"""
Hierarchical Parameter Resolution Engine for PRISM.
Cascades configuration through:
  USER_CUSTOMIZED -> PROJECT_OVERRIDABLE -> PLATFORM_DEFAULT
Strictly conceals PLATFORM_ONLY parameters from project-scoped agents and UI queries.
"""
import logging
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from backend.database.connection import get_async_db
from backend.database.models import ParameterDefinition, ParameterValue

logger = logging.getLogger("prism.agent.param_resolver")


class ParameterResolver:
    """
    Evaluates effective configuration parameters for an execution context.
    """

    @classmethod
    async def resolve_effective_parameters(
        cls,
        project_id: Optional[str] = None,
        user_id: Optional[str] = None,
        include_platform_only: bool = False
    ) -> Dict[str, Any]:
        """
        Calculates resolved parameter values taking inheritance into account.
        """
        async with get_async_db() as db:
            # 1. Load parameter definitions
            defs_query = select(ParameterDefinition)
            if not include_platform_only:
                defs_query = defs_query.where(ParameterDefinition.scope_level != "PLATFORM_ONLY")

            defs_res = await db.execute(defs_query)
            definitions = defs_res.scalars().all()

            # 2. Load all active overrides for this project and user
            overrides_query = select(ParameterValue).where(ParameterValue.is_active == True)
            if project_id and user_id:
                overrides_query = overrides_query.where(
                    (ParameterValue.project_id == project_id) |
                    (ParameterValue.user_id == user_id) |
                    (ParameterValue.level == "PLATFORM")
                )
            elif project_id:
                overrides_query = overrides_query.where(
                    (ParameterValue.project_id == project_id) |
                    (ParameterValue.level == "PLATFORM")
                )

            overrides_res = await db.execute(overrides_query)
            overrides = overrides_res.scalars().all()

            # Map overrides by (parameter_key, level)
            override_map: Dict[str, Dict[str, Any]] = {}
            for ov in overrides:
                key = ov.parameter_key
                if key not in override_map:
                    override_map[key] = {}
                override_map[key][ov.level] = ov.configured_value_json

            # 3. Resolve each parameter according to precedence
            effective_params: Dict[str, Any] = {}
            for pdef in definitions:
                key = pdef.parameter_key
                val = pdef.default_value_json

                # Check project override if permitted
                if pdef.scope_level in ("PROJECT_OVERRIDABLE", "PROJECT_MANDATORY"):
                    if key in override_map and "PROJECT" in override_map[key]:
                        val = override_map[key]["PROJECT"]

                # Check user customized override if permitted
                if pdef.scope_level == "USER_CUSTOMIZED":
                    if key in override_map and "USER" in override_map[key]:
                        val = override_map[key]["USER"]

                effective_params[key] = val

            return effective_params

    @classmethod
    async def get_parameters_for_ui(
        cls,
        project_id: Optional[str] = None,
        is_admin: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Returns parameters with definition metadata and effective values for UI editors.
        """
        async with get_async_db() as db:
            query = select(ParameterDefinition)
            if not is_admin:
                query = query.where(ParameterDefinition.scope_level != "PLATFORM_ONLY")

            res = await db.execute(query)
            definitions = res.scalars().all()

            # Load project overrides if project_id is given
            project_overrides: Dict[str, Any] = {}
            if project_id:
                ov_query = select(ParameterValue).where(
                    ParameterValue.project_id == project_id,
                    ParameterValue.level == "PROJECT"
                )
                ov_res = await db.execute(ov_query)
                for ov in ov_res.scalars().all():
                    project_overrides[ov.parameter_key] = ov.configured_value_json

            ui_list = []
            for d in definitions:
                has_override = d.parameter_key in project_overrides
                effective_val = project_overrides[d.parameter_key] if has_override else d.default_value_json

                ui_list.append({
                    "parameter_key": d.parameter_key,
                    "connector_id": d.connector_id,
                    "scope_level": d.scope_level,
                    "data_type": d.data_type,
                    "default_value": d.default_value_json,
                    "effective_value": effective_val,
                    "has_project_override": has_override,
                    "is_secret": d.is_secret,
                    "ui_section": d.ui_section,
                    "display_name": d.display_name,
                    "description": d.description,
                    "validation_rules": d.validation_rules_json
                })
            return ui_list
