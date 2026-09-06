"""
Connector Registry and Lifecycle Manager for PRISM.
Dynamically resolves and instantiates connector adapters based on database catalog and configuration.
Maintains typed manifests and executes capability-based routing.
"""
import logging
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from backend.connectors.base import ConnectorAdapter, OperationManifest
from backend.connectors.configured_http import ConfiguredHttpConnector
from backend.connectors.confluence_connector import ConfluenceConnector
from backend.connectors.datadog_connector import DatadogConnector
from backend.connectors.db_connector import DatabaseConnector
from backend.connectors.dynatrace_connector import DynatraceConnector
from backend.connectors.elastic_connector import ElasticConnector
from backend.connectors.github_connector import GitHubConnector
from backend.connectors.gitlab_connector import GitLabConnector
from backend.connectors.jira_connector import JiraConnector
from backend.connectors.kafka_connector import KafkaConnector
from backend.connectors.mcp_connector import MCPConnector
from backend.connectors.observability_connector import ObservabilityConnector
from backend.connectors.opentelemetry_connector import OpenTelemetryConnector
from backend.connectors.oracle_connector import OracleConnector
from backend.connectors.qtest_connector import QTestConnector
from backend.connectors.rest_connector import RestApiConnector
from backend.connectors.servicenow_connector import ServiceNowConnector
from backend.connectors.specialized_connectors import (
    KubernetesConnector,
    SlackConnector,
)
from backend.connectors.splunk_connector import SplunkConnector
from backend.connectors.unix_connector import UnixConnector
from backend.database.connection import get_async_db
from backend.database.models import ConnectorCatalog, ConnectorInstance, ProjectConnectorBinding, ToolDefinition, ToolInstanceRecord

logger = logging.getLogger("prism.connectors.registry")


class ConnectorRegistry:
    """Central registry for connector adapters."""

    _instances: Dict[str, ConnectorAdapter] = {}

    ADAPTER_CLASSES = {
        "jira": JiraConnector,
        "atlassian-jira": JiraConnector,
        "servicenow": ServiceNowConnector,
        "servicenow-itsm": ServiceNowConnector,
        "splunk": SplunkConnector,
        "splunk-enterprise": SplunkConnector,
        "elastic": ElasticConnector,
        "elasticsearch": ElasticConnector,
        "opensearch": ElasticConnector,
        "datadog": DatadogConnector,
        "dynatrace": DynatraceConnector,
        "opentelemetry": OpenTelemetryConnector,
        "jaeger": OpenTelemetryConnector,
        "tempo": OpenTelemetryConnector,
        "github": GitHubConnector,
        "gitlab": GitLabConnector,
        "postgres": DatabaseConnector,
        "postgresql": DatabaseConnector,
        "mysql": DatabaseConnector,
        "snowflake": DatabaseConnector,
        "database": DatabaseConnector,
        "relational-db": DatabaseConnector,
        "oracle": OracleConnector,
        "unix": UnixConnector,
        "ssh": UnixConnector,
        "signalfx": ObservabilityConnector,
        "splunk-observability": ObservabilityConnector,
        "kafka": KafkaConnector,
        "qtest": QTestConnector,
        "confluence": ConfluenceConnector,
        "atlassian-confluence": ConfluenceConnector,
        "kubernetes": KubernetesConnector,
        "slack": SlackConnector,
        "mcp_docs": ConfiguredHttpConnector,
        "rest_generic": RestApiConnector,
        "mcp_generic": MCPConnector,
    }

    # Pre-initialized instances for platform tool keys
    DEFAULT_TOOL_INSTANCES = {}

    @classmethod
    def clear_cache(cls):
        """Clears cached connector adapter instances."""
        cls._instances.clear()
        logger.info("Connector registry adapter cache cleared.")

    @classmethod
    def get_adapter_class(cls, provider_or_tool_key: str):
        key = provider_or_tool_key.lower().replace("_", "-")
        return cls.ADAPTER_CLASSES.get(key) or cls.ADAPTER_CLASSES.get(provider_or_tool_key.lower())

    @classmethod
    async def get_adapter_by_tool_key(cls, tool_key: str) -> Optional[ConnectorAdapter]:
        """Resolves an adapter directly by platform tool_key (e.g. jira, splunk, oracle)."""
        instance_key = cls.DEFAULT_TOOL_INSTANCES.get(tool_key, f"inst_{tool_key}")
        return await cls.get_adapter(instance_key, fallback_tool_key=tool_key)

    @classmethod
    async def get_adapter(cls, instance_key: str, fallback_tool_key: Optional[str] = None) -> Optional[ConnectorAdapter]:
        """Retrieve an initialized connector adapter, creating on-demand if needed."""
        if instance_key in cls._instances:
            return cls._instances[instance_key]

        from backend.database.models import ConnectorInstance
        config = {}
        tool_key = fallback_tool_key
        async with get_async_db() as db:
            instance = await db.scalar(select(ConnectorInstance).where(
                ConnectorInstance.instance_key == instance_key, ConnectorInstance.is_deleted == False))
            if instance is not None:
                tool_key = instance.connector_key
                config = {**(instance.auth_config_json or {}), "base_url": instance.base_url}

        if not tool_key:
            tool_key = instance_key.replace("inst_", "").lower()

        adapter_class = cls.get_adapter_class(tool_key) or (RestApiConnector if instance is not None else None)
        if not adapter_class:
            return None

        adapter = adapter_class(instance_key=instance_key, config=config)
        adapter.base_url = config.get("base_url")
        cls._instances[instance_key] = adapter
        logger.info(f"Initialized connector adapter: {instance_key} -> {adapter_class.__name__}")
        return adapter

    @classmethod
    def register_manual(cls, instance_key: str, adapter: ConnectorAdapter):
        cls._instances[instance_key] = adapter

    @classmethod
    async def register_dynamic_connector(
        cls,
        instance_key: str,
        provider: str,
        config: Dict[str, Any]
    ) -> ConnectorAdapter:
        """Dynamically instantiates and registers a connector adapter at runtime."""
        adapter_class = cls.get_adapter_class(provider) or RestApiConnector
        adapter = adapter_class(instance_key=instance_key, config=config)
        cls._instances[instance_key] = adapter
        logger.info(f"Dynamically registered connector: {instance_key} ({adapter_class.__name__})")
        return adapter

    @classmethod
    def list_all_manifests(cls) -> List[OperationManifest]:
        """Returns all registered operation manifests across default platform adapters."""
        all_manifests = []
        for tool_key in [
            "jira",
            "servicenow",
            "splunk",
            "elastic",
            "datadog",
            "dynatrace",
            "opentelemetry",
            "github",
            "gitlab",
            "postgres",
            "oracle",
            "unix",
            "kafka",
            "qtest",
            "confluence",
        ]:
            adapter_class = cls.get_adapter_class(tool_key)
            if adapter_class:
                try:
                    adapter = adapter_class(instance_key=f"inst_{tool_key}")
                    all_manifests.extend(adapter.describe_manifests())
                except Exception as e:
                    logger.warning(f"Error getting manifests for {tool_key}: {e}")
        return all_manifests

    @classmethod
    async def resolve_system_to_adapter(
        cls,
        project_id: str,
        system_name: str,
    ) -> Optional[ConnectorAdapter]:
        """
        Resolves a project-level system name (e.g. 'samson', 'tuxedo', 'daemons')
        to its underlying raw connector adapter via project_connector_bindings.
        Falls back to direct tool_key resolution if no project binding is found.
        """
        async with get_async_db() as db:
            stmt = (
                select(ProjectConnectorBinding, ConnectorInstance)
                .join(ConnectorInstance, ProjectConnectorBinding.connector_instance_id == ConnectorInstance.id)
                .where(
                    (ProjectConnectorBinding.project_id == project_id) &
                    (ProjectConnectorBinding.system_name == system_name) &
                    (ProjectConnectorBinding.is_enabled == True)
                )
            )
            res = await db.execute(stmt)
            row = res.first()
            if row:
                binding, instance = row
                return await cls.get_adapter(instance.id, fallback_tool_key=instance.connector_key)

        # Fallback: direct tool_key lookup if system_name matches a raw connector key directly (e.g., 'oracle', 'unix', 'jira')
        return await cls.get_adapter_by_tool_key(system_name.lower())
