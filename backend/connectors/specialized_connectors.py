"""
Specialized connector adapters for Sentrix Platform.
Exposes rich enterprise connectors for Splunk, Jira, GitHub, Datadog, Kubernetes, and Slack.
"""
from backend.connectors.configured_http import ConfiguredHttpConnector
from backend.connectors.splunk_connector import SplunkConnector
from backend.connectors.jira_connector import JiraConnector
from backend.connectors.github_connector import GitHubConnector
from backend.connectors.datadog_connector import DatadogConnector


class KubernetesConnector(ConfiguredHttpConnector):
    """Kubernetes API / Operator Connector."""
    pass


class SlackConnector(ConfiguredHttpConnector):
    """Slack Broadcast & Incident Channel Connector."""
    pass


__all__ = [
    "SplunkConnector",
    "JiraConnector",
    "GitHubConnector",
    "DatadogConnector",
    "KubernetesConnector",
    "SlackConnector",
]
