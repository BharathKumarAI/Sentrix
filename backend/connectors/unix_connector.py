"""Configured Unix or SSH connector contract.

All endpoint and payload data comes from the persisted connector instance.
"""
from backend.connectors.configured_http import ConfiguredHttpConnector


class UnixConnector(ConfiguredHttpConnector):
    pass
