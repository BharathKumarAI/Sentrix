"""Request-local capability dispatch for harness connector plugins."""
import time
from sqlalchemy import select
from jsonschema import Draft202012Validator
from backend.database.connection import get_async_db
from backend.database.models import (HarnessPluginRecord, ConnectorInstance, ConnectorCatalog, ProjectConnectorBinding,
                                     ConnectorEnvironment, ProjectEnvironment, Run, ToolCallRecord, EvidenceItem)
from backend.harness.configuration import resolve_configuration
from backend.connectors.configured_http import ConfiguredHttpConnector


class ConnectorPluginRuntime:
    # Trusted process registrations only: stored JSON cannot import or execute Python.
    adapters = {"http": ConfiguredHttpConnector}

    @classmethod
    def register_adapter(cls, key, factory):
        if key in cls.adapters:
            raise ValueError(f"Adapter already registered: {key}")
        cls.adapters[key] = factory

    @classmethod
    async def execute(cls, *, project_id, environment, run_id, plugin_id, operation, arguments):
        started = time.perf_counter()
        async with get_async_db() as db:
            config = await resolve_configuration(db, project_id)
            binding = config["plugins"].get(plugin_id)
            if not binding or not binding["enabled"] or operation not in binding["operations"]:
                raise ValueError("Capability is not enabled for this project")
            plugin = await db.get(HarnessPluginRecord, plugin_id)
            if not plugin or plugin.is_deleted or plugin.status != "ENABLED" or plugin.category != "tool":
                raise ValueError("Plugin is unavailable")
            run = await db.get(Run, run_id)
            if not run or run.is_deleted or run.project_id != project_id or run.environment != environment:
                raise ValueError("Run does not belong to the requested project and environment")
            instance = await db.scalar(select(ConnectorInstance).where(
                ConnectorInstance.instance_key == binding["instance_key"],
                ConnectorInstance.is_deleted == False, ConnectorInstance.is_active == True))
            if instance is None:
                raise ValueError("Connector instance is unavailable")
            catalog = await db.scalar(select(ConnectorCatalog).where(
                ConnectorCatalog.connector_key == instance.connector_key))
            if catalog is None or not catalog.is_admin_enabled:
                raise ValueError("Connector is disabled by platform administration")
            if instance.test_status != "PASSED":
                raise ValueError("Connector must pass its connection test before execution")
            if instance.owning_project_id and instance.owning_project_id != project_id:
                raise ValueError("Connector belongs to a different project")
            if not instance.is_global and instance.owning_project_id != project_id:
                project_binding = await db.scalar(select(ProjectConnectorBinding).where(
                    ProjectConnectorBinding.project_id == project_id,
                    ProjectConnectorBinding.connector_instance_id == instance.id,
                    ProjectConnectorBinding.is_enabled == True,
                    ProjectConnectorBinding.is_deleted == False))
                if project_binding is None:
                    raise ValueError("Connector is not bound to this project")
            definition = plugin.active_config or {}
            operations = definition.get("operations", {})
            spec = operations.get(operation)
            if not spec or spec.get("read_only") is not True:
                raise ValueError("Only declared read capabilities can execute through this runtime")
            Draft202012Validator(spec.get("input_schema", {"type": "object"})).validate(arguments)
            factory = cls.adapters.get(definition.get("adapter", "http"))
            if factory is None:
                raise ValueError("Plugin adapter is not installed")
            # Do not cache credential-bearing adapters globally.
            adapter = factory(instance_key=instance.instance_key, config={
                **(instance.auth_config_json or {}), "base_url": instance.base_url,
                "operations": operations, "timeout_seconds": definition.get("timeout_seconds", 30)})
            instance_id = instance.id
        from backend.agent.environment_resolver import EnvironmentResolver
        tool_environment, endpoint = await EnvironmentResolver.resolve_tool_environment(
            project_id=project_id, project_environment=environment, connector_instance_id=instance_id)
        if endpoint:
            adapter.base_url = endpoint
        evidence = await adapter.invoke_read(operation, arguments, tool_environment, run_id)
        elapsed = int((time.perf_counter() - started) * 1000)
        async with get_async_db() as db:
            db.add(EvidenceItem(id=evidence.id, run_id=run_id, source_system=plugin_id,
                connector_instance_id=instance_id, tool_environment=environment, operation=operation,
                query_params_json=arguments, raw_payload_json=evidence.raw_payload,
                normalized_summary=evidence.summary, confidence_score=evidence.confidence_score,
                content_sha256=evidence.content_sha256))
            db.add(ToolCallRecord(id=f"tc_{evidence.id}", run_id=run_id,
                connector_instance_id=instance_id, tool_environment=environment, operation=operation,
                input_args_json=arguments, output_data_json=evidence.raw_payload,
                status="SUCCESS", duration_ms=elapsed))
        return {"evidence_id": evidence.id, "source": evidence.source,
                "data": evidence.raw_payload, "latency_ms": elapsed}

    @classmethod
    def agent_tool(cls, *, project_id, environment, run_id):
        async def invoke_capability(plugin_id: str, operation: str, arguments: dict) -> dict:
            """Invoke an enabled plugin operation with arguments matching its declared input schema."""
            return await cls.execute(project_id=project_id, environment=environment, run_id=run_id,
                                     plugin_id=plugin_id, operation=operation, arguments=arguments)
        return invoke_capability
