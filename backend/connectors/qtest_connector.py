"""Configuration-driven QTestConnector adapter; operations require persisted configuration."""
from backend.connectors.configured_http import ConfiguredHttpConnector


class QTestConnector(ConfiguredHttpConnector):
    pass
