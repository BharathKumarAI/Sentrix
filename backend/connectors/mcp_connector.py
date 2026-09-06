"""Configured MCP connector contract.

All endpoint and payload data comes from the persisted connector instance.
"""
from backend.connectors.configured_http import ConfiguredHttpConnector


class MCPConnector(ConfiguredHttpConnector):
    pass
