"""Oracle adapter uses explicit read operation configuration; no bundled tenant data."""
from backend.connectors.configured_http import ConfiguredHttpConnector


class OracleConnector(ConfiguredHttpConnector):
    pass
