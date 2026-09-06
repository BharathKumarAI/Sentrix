"""
Execution Context Resolver for PRISM.
Resolves Platform -> Project -> Profile -> Request hierarchy.
Ensures lower scopes narrow policies but cannot broaden authority.
Produces an immutable snapshot with a SHA-256 fingerprint for run provenance.
"""
import hashlib
import json
import logging
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import or_, select
from backend.database.connection import get_async_db
from backend.database.models import (
    Project,
    ProjectSkillBinding,
    ProjectTool,
    SkillDefinitionRecord,
    ToolDefinition,
    ToolOperation,
    UserSkillRecord,
    StageModelConfigRecord,
)

logger = logging.getLogger("prism.agent.context")


@dataclass(frozen=True)
class ExecutionContextSnapshot:
    run_id: str
    project_id: str
    project_key: str
    environment: str
    user_id: str
    delegated_identity: str
    execution_mode: str  # rapid or deep
    models: Dict[str, str]  # stage -> model alias
    enabled_tools: List[str]  # tool_keys
    allowed_capabilities: List[str]  # capabilities
    active_skills: List[Dict[str, Any]]  # list of enriched skill descriptors
    effective_parameters: Dict[str, Any]
    policies: Dict[str, Any]
    created_at: str
    snapshot_hash: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "run_id": self.run_id,
            "project_id": self.project_id,
            "project_key": self.project_key,
            "environment": self.environment,
            "user_id": self.user_id,
            "delegated_identity": self.delegated_identity,
            "execution_mode": self.execution_mode,
            "models": self.models,
            "enabled_tools": self.enabled_tools,
            "allowed_capabilities": self.allowed_capabilities,
            "active_skills": self.active_skills,
            "effective_parameters": self.effective_parameters,
            "policies": self.policies,
            "created_at": self.created_at,
            "snapshot_hash": self.snapshot_hash,
        }


class ContextResolver:
    """Deterministic resolver of the effective execution context."""

    DEFAULT_MODELS = {
        "understanding": "fast",
        "planning": "fast",
        "reasoning": "reasoning",
        "response": "response",
    }

    PLATFORM_GLOBAL_POLICIES = {
        "writesRequireApproval": True,
        "crossProjectAccess": False,
        "maxToolCallsRapid": 8,
        "maxToolCallsDeep": 25,
        "allowAdhocSql": False,
    }

    @classmethod
    async def resolve(
        cls,
        run_id: str,
        project_id: str,
        environment: str,
        user_id: str,
        delegated_identity: str,
        execution_mode: str = "rapid",
        request_overrides: Optional[Dict[str, Any]] = None,
    ) -> ExecutionContextSnapshot:
        async with get_async_db() as db:
            # 1. Project Resolution
            proj_stmt = select(Project).where(Project.id == project_id)
            proj_res = await db.execute(proj_stmt)
            proj = proj_res.scalars().first()
            project_key = proj.project_key if proj else project_id.upper()

            # 2. Enabled Tools & Capabilities for this Project
            pt_stmt = select(ProjectTool).where(
                ProjectTool.project_id == project_id,
                ProjectTool.is_enabled == True,
            )
            pt_res = await db.execute(pt_stmt)
            project_tools = pt_res.scalars().all()

            enabled_tools: List[str] = []
            allowed_capabilities: List[str] = []
            project_policies: Dict[str, Any] = dict(cls.PLATFORM_GLOBAL_POLICIES)

            if project_tools:
                for pt in project_tools:
                    enabled_tools.append(pt.tool_key)
                    for cap in pt.allowed_capabilities_json or []:
                        if cap not in allowed_capabilities:
                            allowed_capabilities.append(cap)
                    if pt.custom_policies_json:
                        # Narrowing: can strengthen security
                        if pt.custom_policies_json.get("writesRequireApproval"):
                            project_policies["writesRequireApproval"] = True
            else:
                # Fallback to all platform managed tools if no explicit binding yet
                tools_stmt = select(ToolDefinition).where(ToolDefinition.is_active == True)
                tools_res = await db.execute(tools_stmt)
                all_tools = tools_res.scalars().all()
                for t in all_tools:
                    enabled_tools.append(t.tool_key)
                    for cap in t.capabilities or []:
                        if cap not in allowed_capabilities:
                            allowed_capabilities.append(cap)

            # 3. Active Skills for Project & User Combinations
            sb_stmt = select(ProjectSkillBinding).where(
                ProjectSkillBinding.project_id == project_id,
                ProjectSkillBinding.is_enabled == True,
            )
            sb_res = await db.execute(sb_stmt)
            skill_bindings = sb_res.scalars().all()
            active_skills: List[Dict[str, Any]] = []

            if skill_bindings:
                for sb in skill_bindings:
                    active_skills.append({
                        "skill_key": sb.skill_key,
                        "version": sb.skill_version,
                        "scope": "PROJECT",
                        "project_id": project_id,
                        "project_key": project_key,
                        "tagged_to": f"Project: {project_key}",
                        "tag_badge": f"Project: {project_key}",
                    })
            else:
                # Dynamically query active platform skills from database
                plat_stmt = select(SkillDefinitionRecord).where(
                    SkillDefinitionRecord.scope == "PLATFORM",
                    SkillDefinitionRecord.is_active == True,
                )
                plat_res = await db.execute(plat_stmt)
                active_skills = [
                    {
                        "skill_key": rec.skill_key,
                        "version": rec.version,
                        "scope": "PLATFORM",
                        "project_id": None,
                        "project_key": None,
                        "tagged_to": "Platform Fleet (All Projects)",
                        "tag_badge": "Platform Fleet",
                    }
                    for rec in plat_res.scalars().all()
                ]

            # 3b. User Skills tagged to this User-Project combination
            if user_id:
                u_stmt = select(UserSkillRecord).where(
                    UserSkillRecord.user_id == user_id,
                    UserSkillRecord.is_active == True,
                    or_(UserSkillRecord.project_id == project_id, UserSkillRecord.project_id == None),
                )
                u_res = await db.execute(u_stmt)
                for usk in u_res.scalars().all():
                    active_skills.append({
                        "skill_key": usk.skill_key,
                        "version": "1.0.0",
                        "scope": "USER",
                        "user_id": user_id,
                        "project_id": project_id,
                        "project_key": project_key,
                        "tagged_to": f"User: {user_id} ⤹ {project_key}",
                        "tag_badge": f"User: {user_id} @ {project_key}",
                    })

            # 4. Effective Parameters (Simulated/Resolved)
            effective_params = {
                "splunk.defaultWindowMinutes": 30,
                "splunk.maxResults": 5000,
                "oracle.queryTimeoutSeconds": 15,
                "unix.maxFiles": 20,
            }

            # 5. Model Routing (Dynamically resolved from PostgreSQL control_plane.stage_model_configs)
            stage_stmt = select(StageModelConfigRecord).where(StageModelConfigRecord.is_active == True)
            stage_res = await db.execute(stage_stmt)
            stage_records = stage_res.scalars().all()
            models = {sr.stage_key: sr.primary_model_id for sr in stage_records}
            if not models:
                models = dict(cls.DEFAULT_MODELS)
            if request_overrides and "models" in request_overrides:
                for stage, alias in request_overrides["models"].items():
                    models[stage] = alias

            created_at = datetime.now(timezone.utc).isoformat()

            # 6. Calculate deterministic SHA-256 fingerprint
            content_to_hash = {
                "project_id": project_id,
                "environment": environment,
                "execution_mode": execution_mode,
                "enabled_tools": sorted(enabled_tools),
                "allowed_capabilities": sorted(allowed_capabilities),
                "active_skills": sorted(active_skills, key=lambda x: x["skill_key"]),
                "models": models,
                "policies": project_policies,
            }
            raw_bytes = json.dumps(content_to_hash, sort_keys=True).encode("utf-8")
            snapshot_hash = hashlib.sha256(raw_bytes).hexdigest()

            return ExecutionContextSnapshot(
                run_id=run_id,
                project_id=project_id,
                project_key=project_key,
                environment=environment,
                user_id=user_id,
                delegated_identity=delegated_identity,
                execution_mode=execution_mode,
                models=models,
                enabled_tools=enabled_tools,
                allowed_capabilities=allowed_capabilities,
                active_skills=active_skills,
                effective_parameters=effective_params,
                policies=project_policies,
                created_at=created_at,
                snapshot_hash=snapshot_hash,
            )
