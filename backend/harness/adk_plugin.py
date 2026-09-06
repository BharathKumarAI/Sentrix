"""Google ADK 2.8 runner bridge for the persisted Sentrix harness plugins."""
from typing import Any

from google.adk.plugins import BasePlugin

from backend.harness.plugin_registry import HarnessPluginRegistry
from backend.harness.session_recorder import HarnessSessionRecorder


class HarnessLifecyclePlugin(BasePlugin):
    """Routes ADK lifecycle callbacks through the tenant-aware harness registry."""

    def __init__(self, run_id: str):
        super().__init__(name="sentrix_harness")
        self.run_id = run_id

    async def before_run_callback(self, *, invocation_context):
        HarnessSessionRecorder.record_event(self.run_id, "RUN_STARTED", {
            "invocation_id": getattr(invocation_context, "invocation_id", None)
        })
        return None

    async def before_tool_callback(self, *, tool, tool_args: dict[str, Any], tool_context):
        context = {"tool": getattr(tool, "name", str(tool)), "arguments": tool_args, "run_id": self.run_id}
        for plugin in HarnessPluginRegistry._plugins.values():
            if plugin.is_enabled:
                await plugin.before_execute(context)
        HarnessSessionRecorder.record_event(self.run_id, "TOOL_STARTED", context)
        return None

    async def after_tool_callback(self, *, tool, tool_args: dict[str, Any], tool_context, result: dict[str, Any]):
        context = {"tool": getattr(tool, "name", str(tool)), "arguments": tool_args, "run_id": self.run_id}
        current = result
        for plugin in HarnessPluginRegistry._plugins.values():
            if plugin.is_enabled:
                updated = await plugin.after_execute(context, current)
                if updated is not None:
                    current = updated
        HarnessSessionRecorder.record_event(self.run_id, "TOOL_COMPLETED", {"tool": context["tool"]})
        return current

    async def after_run_callback(self, *, invocation_context):
        HarnessSessionRecorder.record_event(self.run_id, "RUN_COMPLETED", {})
