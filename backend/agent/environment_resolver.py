"""
Dynamic Environment Resolution Matrix for PRISM.
Resolves execution targets from:
  (project_id, active_project_environment, connector_instance_id) -> tool_environment

Enforces Global Connector handling:
  - If a connector is marked `is_global = True` (or mapped to '*'), it is accessible
    across ALL project environments automatically (e.g. Central Docs MCP, Slack Hub).
"""
import logging
from typing import Any, Dict, Optional, Tuple
from sqlalchemy import select
from backend.database.connection import get_async_db
from backend.database.models import (
    ConnectorEnvironment,
    ConnectorInstance,
    ProjectToolEnvMapping,
)

logger = logging.getLogger("prism.agent.env_resolver")


class EnvironmentResolver:
    """
    Resolves the exact tool environment and configuration for a given project context.
    """

    @classmethod
    async def resolve_tool_environment(
        cls,
        project_id: str,
        project_environment: str,
        connector_instance_id: str
    ) -> Tuple[str, Optional[str]]:
        """
        Resolves the target tool environment.
        Returns: (tool_environment_name, endpoint_override_or_none)
        """
        async with get_async_db() as db:
            # 1. Check if the connector is marked global
            inst_query = select(ConnectorInstance).where(
                (ConnectorInstance.id == connector_instance_id) |
                (ConnectorInstance.instance_key == connector_instance_id)
            )
            inst_res = await db.execute(inst_query)
            instance = inst_res.scalars().first()
            if not instance:
                logger.warning(f"Connector instance {connector_instance_id} not found; falling back to default.")
                return project_environment, None

            if instance.is_global:
                logger.info(f"Connector '{instance.instance_key}' is GLOBAL. Executing in 'global' environment.")
                return "global", instance.base_url

            # 2. Check explicit project-to-tool environment mapping
            mapping_query = select(ProjectToolEnvMapping).where(
                ProjectToolEnvMapping.project_id == project_id,
                ProjectToolEnvMapping.project_environment == project_environment,
                ProjectToolEnvMapping.connector_instance_id == instance.id,
                ProjectToolEnvMapping.is_active == True
            )
            mapping_res = await db.execute(mapping_query)
            mapping = mapping_res.scalars().first()

            if mapping:
                tool_env = mapping.tool_environment
                logger.info(f"Resolved mapping: Project '{project_id}' [{project_environment}] -> Tool '{instance.instance_key}' [{tool_env}]")
            else:
                # Default convention fallback (e.g. tool_env = f"{instance.connector_key}-{project_environment}")
                tool_env = f"{instance.connector_key}-{project_environment}"
                logger.info(f"No explicit mapping found for Project '{project_id}' [{project_environment}]. Using convention: '{tool_env}'")

            # 3. Retrieve any endpoint override for this connector environment
            cenv_query = select(ConnectorEnvironment).where(
                ConnectorEnvironment.connector_instance_id == instance.id,
                ConnectorEnvironment.environment_name == tool_env
            )
            cenv_res = await db.execute(cenv_query)
            cenv = cenv_res.scalars().first()
            endpoint = cenv.endpoint_override if cenv and cenv.endpoint_override else instance.base_url

            return tool_env, endpoint

    @classmethod
    async def get_all_mappings_for_project(cls, project_id: str) -> list:
        """Returns all configured tool mappings for a project to render in the UI."""
        async with get_async_db() as db:
            query = (
                select(ProjectToolEnvMapping, ConnectorInstance)
                .join(ConnectorInstance, ProjectToolEnvMapping.connector_instance_id == ConnectorInstance.id)
                .where(ProjectToolEnvMapping.project_id == project_id)
            )
            result = await db.execute(query)
            items = []
            for mapping, instance in result.all():
                items.append({
                    "id": mapping.id,
                    "project_id": mapping.project_id,
                    "project_environment": mapping.project_environment,
                    "connector_id": instance.id,
                    "connector_name": instance.name,
                    "connector_key": instance.connector_key,
                    "tool_environment": mapping.tool_environment,
                    "is_active": mapping.is_active,
                    "notes": mapping.notes
                })
            return items
