"""
Connector Registry and Lifecycle Manager for PRISM.
Dynamically resolves and instantiates connector adapters based on database catalog and configuration.
Strictly enforces Platform Admin enablement gates before permitting connector initialization.
"""
import logging
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from backend.connectors.base import ConnectorAdapter
from backend.connectors.db_connector import DatabaseConnector
from backend.connectors.mcp_connector import MCPConnector
from backend.connectors.rest_connector import RestApiConnector
from backend.connectors.specialized_connectors import (
    DatadogConnector,
    GitHubConnector,
    JiraConnector,
    KubernetesConnector,
    SlackConnector,
    SplunkConnector,
)
from backend.database.connection import get_async_db
from backend.database.models import ConnectorCatalog, ConnectorInstance

logger = logging.getLogger("prism.connectors.registry")


class ConnectorRegistry:
    """
    Central registry for connector adapters.
    Manages active connector lifecycle and enforces admin security policies.
    """
    _instances: Dict[str, ConnectorAdapter] = {}

    ADAPTER_MAPPINGS = {
        "splunk": SplunkConnector,
        "jira": JiraConnector,
        "postgres": DatabaseConnector,
        "github": GitHubConnector,
        "kubernetes": KubernetesConnector,
        "datadog": DatadogConnector,
        "mcp_docs": MCPConnector,
        "slack": SlackConnector,
        "rest_generic": RestApiConnector,
        "mcp_generic": MCPConnector,
    }

    @classmethod
    async def get_adapter(cls, instance_key: str) -> Optional[ConnectorAdapter]:
        """Retrieve an initialized connector adapter, initializing from DB if necessary."""
        if instance_key in cls._instances:
            return cls._instances[instance_key]

        async with get_async_db() as db:
            query = (
                select(ConnectorInstance, ConnectorCatalog)
                .join(ConnectorCatalog, ConnectorInstance.connector_key == ConnectorCatalog.connector_key)
                .where(
                    (ConnectorInstance.id == instance_key) |
                    (ConnectorInstance.instance_key == instance_key)
                )
            )
            result = await db.execute(query)
            row = result.first()
            if not row:
                logger.warning(f"Connector instance '{instance_key}' not found in database.")
                return None

            instance, catalog = row

            # Non-Negotiable Gate: Admin must have enabled the connector
            if not catalog.is_admin_enabled:
                raise PermissionError(
                    f"Access Denied: Connector '{catalog.name}' is currently disabled by Platform Admin."
                )

            adapter_class = cls.ADAPTER_MAPPINGS.get(catalog.connector_key)
            if not adapter_class:
                if instance.protocol == "MCP":
                    adapter_class = MCPConnector
                elif instance.protocol == "POSTGRES_DB":
                    adapter_class = DatabaseConnector
                else:
                    adapter_class = RestApiConnector

            config = {
                "base_url": instance.base_url,
                "auth_type": instance.auth_type,
                "auth_config": instance.auth_config_json or {},
                "protocol": instance.protocol,
                "is_global": instance.is_global,
            }
            adapter = adapter_class(instance_key=instance_key, config=config)
            cls._instances[instance_key] = adapter
            logger.info(f"Initialized connector adapter: {instance_key} ({adapter_class.__name__})")
            return adapter

    @classmethod
    def register_manual(cls, instance_key: str, adapter: ConnectorAdapter):
        """Register an adapter manually (useful for testing and in-memory plugins)."""
        cls._instances[instance_key] = adapter

    @classmethod
    def clear_cache(cls):
        """Clears cached instances on config update."""
        cls._instances.clear()
