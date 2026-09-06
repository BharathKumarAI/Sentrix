"""Harness inheritance and capability boundary tests; no external services required."""
import unittest
from contextlib import asynccontextmanager
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from pydantic import ValidationError
from backend.harness.configuration import HarnessConfiguration, merge_configurations
from backend.api.harness_configuration import Operation
from backend.harness.connector_runtime import ConnectorPluginRuntime


class InheritanceTests(unittest.TestCase):
    def test_order_and_removal(self):
        merged = merge_configurations([
            ("platform", {"prompts": {"instructions": "shared"}, "skills": {"review": "inspect"}}),
            ("organization", {"prompts": {"instructions": "organization"}}),
            ("project", {"skills": {"review": None}}),
        ])
        self.assertEqual(merged["prompts"]["instructions"], "organization")
        self.assertNotIn("review", merged["skills"])
        self.assertEqual(merged["sources"]["skills"]["review"], "project")

    def test_project_cannot_mutate_shared_inputs(self):
        shared = {"plugins": {"plugin": {"instance_key": "shared", "operations": ["read"]}}}
        result = merge_configurations([("platform", shared)])
        result["plugins"]["plugin"]["operations"].append("extra")
        self.assertEqual(shared["plugins"]["plugin"]["operations"], ["read"])

    def test_binding_replacement_does_not_union_permissions(self):
        result = merge_configurations([
            ("platform", {"plugins": {"plugin": {"instance_key": "a", "operations": ["read", "search"]}}}),
            ("project", {"plugins": {"plugin": {"instance_key": "b", "operations": ["read"], "enabled": False}}}),
        ])
        self.assertFalse(result["plugins"]["plugin"]["enabled"])
        self.assertEqual(result["plugins"]["plugin"]["operations"], ["read"])

    def test_platform_disabled_plugin_cannot_be_reenabled(self):
        result = merge_configurations([
            ("platform", {"plugins": {"plugin": {"instance_key": "a", "operations": ["read"], "enabled": False}}}),
            ("project", {"plugins": {"plugin": {"instance_key": "b", "operations": ["read"], "enabled": True}}}),
        ])
        self.assertFalse(result["plugins"]["plugin"]["enabled"])

    def test_write_and_absolute_paths_are_rejected(self):
        for overrides in ({"read_only": False}, {"path": "https://host/path"}, {"path": "//host/path"}, {"method": "DELETE"}):
            with self.assertRaises(ValidationError):
                Operation.model_validate({"name": "Read", "capability": "read", "path": "/", **overrides})


class RuntimeBoundaryTests(unittest.IsolatedAsyncioTestCase):
    async def test_unbound_operation_never_calls_connector(self):
        @asynccontextmanager
        async def db(): yield AsyncMock()
        with patch('backend.harness.connector_runtime.get_async_db', db), patch(
            'backend.harness.connector_runtime.resolve_configuration', AsyncMock(return_value={"plugins": {}})):
            with self.assertRaisesRegex(ValueError, "not enabled"):
                await ConnectorPluginRuntime.execute(project_id="project", environment="env", run_id="run",
                    plugin_id="plugin", operation="read", arguments={})

    async def test_foreign_run_never_calls_connector(self):
        session = AsyncMock()
        session.get.side_effect = [SimpleNamespace(is_deleted=False, status="ENABLED", category="tool"),
                                   SimpleNamespace(is_deleted=False, project_id="different-project", environment="env")]
        @asynccontextmanager
        async def db(): yield session
        with patch('backend.harness.connector_runtime.get_async_db', db), patch(
            'backend.harness.connector_runtime.resolve_configuration', AsyncMock(return_value={"plugins": {
                "plugin": {"enabled": True, "operations": ["read"], "instance_key": "instance"}}})):
            with self.assertRaisesRegex(ValueError, "Run does not belong"):
                await ConnectorPluginRuntime.execute(project_id="project", environment="env", run_id="run",
                    plugin_id="plugin", operation="read", arguments={})
        session.scalar.assert_not_called()

if __name__ == '__main__': unittest.main()
