"""Database-backed plugin catalog with explicit diagnostic adapters and no synthetic registrations."""
import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy import select
from backend.database.connection import get_async_db
from backend.database.models import HarnessPluginRecord, ModelProviderRecord
from backend.harness.plugin_base import HarnessMode, HarnessPlugin, PluginCategory, PluginManifest, PluginStatus, PluginFinOpsMetrics


class ConfiguredPlugin(HarnessPlugin):
    async def self_test(self):
        config = self.manifest.active_config
        if self.category == PluginCategory.MODEL:
            from backend.services.model_execution import execute_model
            async with get_async_db() as db:
                provider = await db.get(ModelProviderRecord, config.get("provider_id", ""))
                if not provider or provider.is_deleted:
                    return {"healthy": False, "details": "Configure a model provider for this plugin."}
                credentials = dict(provider.credentials_json or {})
            result = await execute_model(model_id=config.get("model_id", ""), credentials=credentials,
                                         prompt="Reply with OK.", max_tokens=64,
                                         timeout_seconds=min(int(config.get("timeout_seconds", 30)), 120))
            return {"healthy": True, "latency_ms": result.latency_ms,
                    "prompt_tokens": result.prompt_tokens, "completion_tokens": result.completion_tokens,
                    "details": "Configured model returned a response."}
        if self.category == PluginCategory.TOOL:
            from backend.connectors.registry import ConnectorRegistry
            instance_key = config.get("instance_key")
            environment = config.get("environment")
            if not instance_key or not environment:
                return {"healthy": False, "details": "Configure a connector instance and environment."}
            adapter = await ConnectorRegistry.get_adapter(instance_key)
            if adapter is None:
                return {"healthy": False, "details": "No adapter is registered for this connector."}
            result = await adapter.health_check(environment)
            return {**result, "healthy": result.get("status") in ("HEALTHY", "SUCCESS", "CONNECTED"),
                    "details": result.get("message", "Connector health probe completed.")}
        return {"healthy": False, "status": "NOT_CONFIGURED",
                "details": "Register a diagnostic adapter for this capability before testing."}


class HarnessPluginRegistry:
    _plugins: Dict[str, HarnessPlugin] = {}
    _active_mode = HarnessMode.SRE_TRIAGE
    _factories = {}

    @classmethod
    def register_factory(cls, category: str, factory):
        """Extension point: a trusted application factory receives a persisted manifest."""
        cls._factories[category] = factory

    @classmethod
    async def initialize_defaults(cls):
        async with get_async_db() as db:
            rows = (await db.execute(select(HarnessPluginRecord).where(
                HarnessPluginRecord.is_deleted == False))).scalars().all()
        plugins = {}
        for row in rows:
            manifest = PluginManifest(
                id=row.id, name=row.name, version=row.version, category=PluginCategory(row.category),
                description=row.description, author=row.author, status=PluginStatus(row.status),
                capabilities=row.capabilities, dependencies=row.dependencies,
                config_schema=row.config_schema, active_config=row.active_config, tags=row.tags,
                finops=PluginFinOpsMetrics(
                    cost_tier=row.cost_tier, estimated_usd_per_invocation=row.estimated_usd_per_invocation,
                    total_invocations=row.total_invocations, total_tokens_consumed=row.total_tokens_consumed,
                    total_cost_usd=row.total_cost_usd, avg_latency_ms=row.avg_latency_ms,
                    error_count=row.error_count,
                    last_invoked_at=row.last_invoked_at.isoformat() if row.last_invoked_at else None))
            plugins[row.id] = cls._factories.get(row.category, ConfiguredPlugin)(manifest)
        cls._plugins = plugins

    @classmethod
    async def register(cls, plugin):
        cls._plugins[plugin.id] = plugin

    @classmethod
    async def unregister(cls, plugin_id):
        return cls._plugins.pop(plugin_id, None)

    @classmethod
    def get(cls, plugin_id):
        return cls._plugins.get(plugin_id)

    @classmethod
    def list_plugins(cls, category=None):
        return [p.get_manifest() for p in cls._plugins.values() if category is None or p.category == category]

    @classmethod
    async def toggle_plugin(cls, plugin_id, enabled):
        async with get_async_db() as db:
            row = await db.get(HarnessPluginRecord, plugin_id)
            if row is None or row.is_deleted:
                return None
            row.status = "ENABLED" if enabled else "DISABLED"
        await cls.initialize_defaults()
        return cls.get(plugin_id).get_manifest()

    @classmethod
    async def configure_plugin(cls, plugin_id, config):
        async with get_async_db() as db:
            row = await db.get(HarnessPluginRecord, plugin_id)
            if row is None or row.is_deleted:
                return None
            row.active_config = {**(row.active_config or {}), **config}
        await cls.initialize_defaults()
        return cls.get(plugin_id).get_manifest()

    @classmethod
    async def test_plugin(cls, plugin_id):
        plugin = cls.get(plugin_id)
        if not plugin:
            return {"healthy": False, "details": "Plugin not found."}
        try:
            async with asyncio.timeout(120):
                result = await plugin.self_test()
        except Exception as exc:
            result = {"healthy": False, "details": f"Diagnostic failed ({type(exc).__name__}). Check configuration."}
        result["timestamp"] = datetime.now(timezone.utc).isoformat()
        return result

    @classmethod
    def get_mode(cls):
        return cls._active_mode

    @classmethod
    def set_mode(cls, mode):
        cls._active_mode = mode
        return mode

    @classmethod
    def get_stats(cls):
        plugins = list(cls._plugins.values())
        return {"total_plugins": len(plugins), "enabled_plugins": sum(p.is_enabled for p in plugins),
                "active_mode": cls._active_mode.value,
                "categories": {c.value: sum(p.category == c for p in plugins) for c in PluginCategory},
                "finops": {"total_invocations": sum(p.manifest.finops.total_invocations for p in plugins),
                           "total_tokens_consumed": sum(p.manifest.finops.total_tokens_consumed for p in plugins),
                           "total_cost_usd": sum(p.manifest.finops.total_cost_usd for p in plugins),
                           "estimated_savings_usd": None}}
