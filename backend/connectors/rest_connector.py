"""Generic configured REST connector.

All endpoint and payload data comes from the persisted connector instance.
"""
from backend.connectors.configured_http import ConfiguredHttpConnector


class RestApiConnector(ConfiguredHttpConnector):
    pass
