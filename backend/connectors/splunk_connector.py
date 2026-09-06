"""Configuration-driven SplunkConnector adapter; operations require persisted configuration."""
from backend.connectors.configured_http import ConfiguredHttpConnector


class SplunkConnector(ConfiguredHttpConnector):
    pass
