"""Configuration-driven JiraConnector adapter; operations require persisted configuration."""
from backend.connectors.configured_http import ConfiguredHttpConnector


class JiraConnector(ConfiguredHttpConnector):
    pass
