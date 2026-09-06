"""Configuration-driven OpenTelemetryConnector adapter; operations require persisted configuration."""
from backend.connectors.configured_http import ConfiguredHttpConnector


class OpenTelemetryConnector(ConfiguredHttpConnector):
    pass
