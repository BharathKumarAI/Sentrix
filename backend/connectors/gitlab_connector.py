"""Configured provider adapters. No bundled operational data."""
from backend.connectors.configured_http import ConfiguredHttpConnector


class GitLabConnector(ConfiguredHttpConnector):
    pass
