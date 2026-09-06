"""
Sentrix RBAC & Capability Governance Engine.
Defines canonical capability tokens, role-capability mappings, and authorization checks.
"""
from typing import Set, List, Dict, Any, Optional
from fastapi import HTTPException, Request
from sqlalchemy import select
from backend.database.connection import get_async_db
from backend.database.models import User, ProjectMembership, RoleDefinition

# -----------------------------------------------------------------------------
# Atomic Capability Tokens
# -----------------------------------------------------------------------------

# Portal / Generic Scope
CAP_PORTAL_GENERIC_VIEW = "portal:generic_view"
CAP_PORTAL_DOCS_VIEW = "portal:docs_view"
CAP_PORTAL_ACCESS_REQUEST = "portal:access_request"
CAP_PORTAL_HEALTH_VIEW = "portal:health_view"
CAP_PORTAL_CHAT_ASSISTANT = "portal:chat_assistant"

# Project-Level Scope
CAP_PROJECT_VIEW = "project:view"
CAP_TRIAGE_BOARD_VIEW = "triage_board:view"
CAP_REPORTS_VIEW = "reports:view"
CAP_METRICS_VIEW = "metrics:view"
CAP_KNOWLEDGE_VIEW = "knowledge:view"
CAP_INVESTIGATION_CHAT = "investigation:chat"
CAP_ANALYSIS_EXECUTE = "analysis:execute"
CAP_ACTIONS_STAGE_PROPOSAL = "actions:stage_proposal"
CAP_ACTIONS_APPROVE_WRITE_LOCK = "actions:approve_write_lock"
CAP_PROJECT_CONFIG_WRITE = "project:config_write"
CAP_PROJECT_OVERSEE_DASHBOARD = "project:oversee_dashboard"

# Platform Administration Scope
CAP_ADMIN_CONSOLE_ACCESS = "admin:console_access"
CAP_IAM_MANAGE_ROLES = "iam:manage_roles"
CAP_ADMIN_BILLING_MANAGE = "admin:billing_manage"
CAP_ADMIN_MODELS_MANAGE = "admin:models_manage"
CAP_ADMIN_KEYS_MANAGE = "admin:keys_manage"

# -----------------------------------------------------------------------------
# Default System Role Definitions
# -----------------------------------------------------------------------------

SYSTEM_ROLES: Dict[str, Dict[str, Any]] = {
    "PLATFORM_ADMIN": {
        "display_name": "Platform Admin",
        "scope": "GLOBAL",
        "description": "Full administrative authority across all projects, IAM, model providers, and platform settings.",
        "capabilities": [
            CAP_PORTAL_GENERIC_VIEW,
            CAP_PORTAL_DOCS_VIEW,
            CAP_PORTAL_ACCESS_REQUEST,
            CAP_PORTAL_HEALTH_VIEW,
            CAP_PORTAL_CHAT_ASSISTANT,
            CAP_PROJECT_VIEW,
            CAP_TRIAGE_BOARD_VIEW,
            CAP_REPORTS_VIEW,
            CAP_METRICS_VIEW,
            CAP_KNOWLEDGE_VIEW,
            CAP_INVESTIGATION_CHAT,
            CAP_ANALYSIS_EXECUTE,
            CAP_ACTIONS_STAGE_PROPOSAL,
            CAP_ACTIONS_APPROVE_WRITE_LOCK,
            CAP_PROJECT_CONFIG_WRITE,
            CAP_PROJECT_OVERSEE_DASHBOARD,
            CAP_ADMIN_CONSOLE_ACCESS,
            CAP_IAM_MANAGE_ROLES,
            CAP_ADMIN_BILLING_MANAGE,
            CAP_ADMIN_MODELS_MANAGE,
            CAP_ADMIN_KEYS_MANAGE,
        ]
    },
    "PROJECT_OWNER": {
        "display_name": "Project Owner",
        "scope": "PROJECT",
        "description": "Sets project configs, authorizes governed write actions (write locks), and participates in incident analysis.",
        "capabilities": [
            CAP_PORTAL_GENERIC_VIEW,
            CAP_PORTAL_DOCS_VIEW,
            CAP_PROJECT_VIEW,
            CAP_TRIAGE_BOARD_VIEW,
            CAP_REPORTS_VIEW,
            CAP_METRICS_VIEW,
            CAP_KNOWLEDGE_VIEW,
            CAP_INVESTIGATION_CHAT,
            CAP_ANALYSIS_EXECUTE,
            CAP_ACTIONS_STAGE_PROPOSAL,
            CAP_ACTIONS_APPROVE_WRITE_LOCK,
            CAP_PROJECT_CONFIG_WRITE,
            CAP_PROJECT_OVERSEE_DASHBOARD,
        ]
    },
    "PROJECT_ANALYST": {
        "display_name": "Project Analyst",
        "scope": "PROJECT",
        "description": "Primary performer of analysis and live triage: auto-triage, investigation stream, diagnostic probes, and staging proposals.",
        "capabilities": [
            CAP_PORTAL_GENERIC_VIEW,
            CAP_PORTAL_DOCS_VIEW,
            CAP_PROJECT_VIEW,
            CAP_TRIAGE_BOARD_VIEW,
            CAP_REPORTS_VIEW,
            CAP_METRICS_VIEW,
            CAP_KNOWLEDGE_VIEW,
            CAP_INVESTIGATION_CHAT,
            CAP_ANALYSIS_EXECUTE,
            CAP_ACTIONS_STAGE_PROPOSAL,
        ]
    },
    "PROJECT_MANAGER": {
        "display_name": "Project Manager",
        "scope": "PROJECT",
        "description": "Project oversight, SLAs, and progress monitoring without participating in technical analysis or triaging.",
        "capabilities": [
            CAP_PORTAL_GENERIC_VIEW,
            CAP_PORTAL_DOCS_VIEW,
            CAP_PROJECT_VIEW,
            CAP_TRIAGE_BOARD_VIEW,
            CAP_REPORTS_VIEW,
            CAP_METRICS_VIEW,
            CAP_KNOWLEDGE_VIEW,
            CAP_INVESTIGATION_CHAT,
            CAP_PROJECT_OVERSEE_DASHBOARD,
        ]
    },
    "PROJECT_VIEWER": {
        "display_name": "Project Viewer",
        "scope": "PROJECT",
        "description": "Read-only project observer with access to live triage board, metrics, reports, and interactive inquiry chat.",
        "capabilities": [
            CAP_PORTAL_GENERIC_VIEW,
            CAP_PORTAL_DOCS_VIEW,
            CAP_PROJECT_VIEW,
            CAP_TRIAGE_BOARD_VIEW,
            CAP_REPORTS_VIEW,
            CAP_METRICS_VIEW,
            CAP_KNOWLEDGE_VIEW,
            CAP_INVESTIGATION_CHAT,
        ]
    },
    "GENERAL_VIEWER": {
        "display_name": "General Viewer",
        "scope": "GLOBAL",
        "description": "Portal user with no assigned projects: access to developer docs, platform health, general AI assistant, and project access requests.",
        "capabilities": [
            CAP_PORTAL_GENERIC_VIEW,
            CAP_PORTAL_DOCS_VIEW,
            CAP_PORTAL_ACCESS_REQUEST,
            CAP_PORTAL_HEALTH_VIEW,
            CAP_PORTAL_CHAT_ASSISTANT,
        ]
    }
}


async def get_effective_capabilities(
    user_id: str,
    user_role_header: Optional[str] = None,
    project_id: Optional[str] = None
) -> Set[str]:
    """
    Computes the effective capability set for a given user and optional project context.
    Considers global user role, custom role definitions from DB, and project memberships.
    """
    capabilities: Set[str] = set()

    # Normalize header role if provided
    active_role = (user_role_header or "").upper()

    async with get_async_db() as db:
        # 1. Fetch DB role definitions for dynamic extensibility
        role_records = await db.execute(select(RoleDefinition).where(RoleDefinition.is_deleted == False))
        db_roles = {r.role_key: r.capabilities for r in role_records.scalars().all()}

        # 2. Look up user record
        user = None
        if user_id:
            user_res = await db.execute(select(User).where(User.id == user_id))
            user = user_res.scalars().first()

        if user and user.is_active and not user.is_deleted:
            global_role = (user.role or active_role or "PLATFORM_ADMIN").upper()
        elif active_role:
            global_role = active_role
        else:
            global_role = "PLATFORM_ADMIN"

        # Apply global role capabilities
        if global_role in db_roles:
            capabilities.update(db_roles[global_role])
        elif global_role in SYSTEM_ROLES:
            capabilities.update(SYSTEM_ROLES[global_role]["capabilities"])
        elif global_role in ("ADMIN", "PLATFORM_ADMIN"):
            capabilities.update(SYSTEM_ROLES["PLATFORM_ADMIN"]["capabilities"])

        # If user is Platform Admin, they inherit all capabilities
        if global_role in ("PLATFORM_ADMIN", "ADMIN"):
            capabilities.update(SYSTEM_ROLES["PLATFORM_ADMIN"]["capabilities"])
            return capabilities

        # 3. Project Membership resolution
        if project_id and user:
            mem_res = await db.execute(
                select(ProjectMembership).where(
                    ProjectMembership.user_id == user.id,
                    ProjectMembership.project_id == project_id,
                    ProjectMembership.is_deleted == False
                )
            )
            membership = mem_res.scalars().first()
            if membership:
                proj_role = membership.project_role.upper()
                if proj_role in db_roles:
                    capabilities.update(db_roles[proj_role])
                elif proj_role in SYSTEM_ROLES:
                    capabilities.update(SYSTEM_ROLES[proj_role]["capabilities"])

    return capabilities


def require_capability(required_cap: str):
    """
    FastAPI dependency factory enforcing that the caller has a required capability.
    """
    async def dependency(request: Request):
        actor_id = request.headers.get("x-user-id") or ""
        role_header = request.headers.get("x-user-role") or request.headers.get("X-User-Role") or ""
        project_id = request.path_params.get("project_id") or request.query_params.get("project_id")

        caps = await get_effective_capabilities(
            user_id=actor_id,
            user_role_header=role_header,
            project_id=project_id
        )

        if required_cap not in caps:
            raise HTTPException(
                status_code=403,
                detail=f"Access Denied: Action requires '{required_cap}' capability."
            )
        return True

    return dependency
