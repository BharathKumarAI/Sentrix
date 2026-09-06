"""
Layered Capability Skills Engine for Sentrix.
Implements the 4-layer capability hierarchy:
- L0: System Skills (Internal routing, tool selection, security governance)
- L1: Platform Skills (Reusable enterprise diagnostic building blocks)
- L2: Project Skills (Domain specialization composing L1 platform skills + custom flow)
- L3: User Skills (Sandboxed personal shortcuts & custom instructions)

Enforces zero hardcoded skills: all skills are dynamically loaded from PostgreSQL database
registries (control_plane.skill_definitions, project_skill_bindings, user_skills) or declarative
storage packages (storage/skills/{scope}/{skill_key}/manifest.yaml).
"""
import logging
import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
import yaml
from sqlalchemy import or_, select
from backend.database.connection import get_async_db
from backend.database.models import (
    Project,
    ProjectSkillBinding,
    SkillDefinitionRecord,
    UserSkillRecord,
)

logger = logging.getLogger("sentrix.agent.skills")

STORAGE_SKILLS_DIR = Path(__file__).resolve().parent.parent.parent / "storage" / "skills"


@dataclass
class CompiledSkill:
    skill_key: str
    name: str
    version: str
    scope: str = "PLATFORM"  # PLATFORM, PROJECT, USER
    tagged_project_id: Optional[str] = None
    tagged_project_key: Optional[str] = None
    tagged_user_id: Optional[str] = None
    tag_badge: str = "Platform Fleet"
    required_capabilities: List[str] = field(default_factory=list)
    optional_capabilities: List[str] = field(default_factory=list)
    accepted_signals: List[str] = field(default_factory=list)
    instructions_markdown: str = ""
    output_spec: Dict[str, Any] = field(default_factory=dict)
    workflow_steps: List[str] = field(default_factory=list)
    composed_skills: List[str] = field(default_factory=list)
    custom_instructions: Optional[str] = None
    policies: Dict[str, Any] = field(default_factory=lambda: {"read_only": True, "risk_tier": "LOW", "approval_required": False})
    parameters: List[Dict[str, Any]] = field(default_factory=list)

    def format_prompt_guidance(self) -> str:
        """Assembles prompt guidance from composed layers and tagging context."""
        tagging_context = f"""### Active Skill: {self.name} (v{self.version} • {self.scope})
- Tagged Target: {self.tag_badge}
- Project Scope: {self.tagged_project_key or 'Platform Fleet (All Projects)'}
- User Context: {self.tagged_user_id or 'System Default / Unbound'}"""

        composed_desc = ""
        if self.composed_skills:
            composed_desc = "\nComposed Platform Capabilities:\n" + "\n".join(f"- {c}" for c in self.composed_skills)

        workflow_desc = ""
        if self.workflow_steps:
            workflow_desc = "\nInvestigation Sequence:\n" + "\n".join(f"{i+1}. {step}" for i, step in enumerate(self.workflow_steps))

        custom_desc = ""
        if self.custom_instructions:
            custom_desc = f"\nProject/User Custom Guidance:\n{self.custom_instructions}\n"

        return f"""{tagging_context}
{self.instructions_markdown}
{composed_desc}
{workflow_desc}
{custom_desc}

Required Evidence Sections:
- Finding: Primary failure determination.
- Evidence: Supporting database, log, ticket, and telemetry proof.
- Root Cause: Concrete technical origin of the fault.
- Confidence: High, Medium, or Low with percentage estimate.
- Routing: Owning engineering queue or fix team.
- Recommended Action: Specific remediation steps.
"""


class SkillsEngine:
    """
    Manages L0-L3 skill discovery, composition, binding, and permission intersection.
    Contains ZERO hardcoded skills. All skill metadata and execution instructions
    are dynamically resolved from PostgreSQL or filesystem packages.
    """

    @classmethod
    def _load_from_storage(cls, skill_key: str) -> Optional[CompiledSkill]:
        """
        Dynamically loads a skill package from storage/skills/{scope}/{skill_key}/
        by parsing manifest.yaml and reading SKILL.md.
        """
        if not STORAGE_SKILLS_DIR.exists():
            return None

        # Search across all scope directories (platform, project, etc.)
        for scope_dir in STORAGE_SKILLS_DIR.iterdir():
            if not scope_dir.is_dir():
                continue
            skill_folder = scope_dir / skill_key
            if not skill_folder.is_dir():
                continue

            manifest_path = skill_folder / "manifest.yaml"
            if not manifest_path.exists():
                manifest_path = skill_folder / "skill.yaml"

            if not manifest_path.exists():
                continue

            try:
                with open(manifest_path, "r", encoding="utf-8") as mf:
                    data = yaml.safe_load(mf) or {}

                metadata = data.get("metadata", {})
                caps = data.get("capabilities", {})
                wf = data.get("workflow", {})

                # Read SKILL.md if present
                instructions = ""
                skill_md_path = skill_folder / "SKILL.md"
                if skill_md_path.exists():
                    with open(skill_md_path, "r", encoding="utf-8") as sm:
                        instructions = sm.read()
                elif "description" in metadata:
                    instructions = metadata["description"]

                return CompiledSkill(
                    skill_key=metadata.get("skill_key", skill_key),
                    name=metadata.get("name", skill_key),
                    version=metadata.get("version", "1.0.0"),
                    scope=metadata.get("scope", scope_dir.name.upper()),
                    required_capabilities=caps.get("required", []),
                    optional_capabilities=caps.get("optional", []),
                    accepted_signals=data.get("accepted_signals", []),
                    instructions_markdown=instructions,
                    output_spec=data.get("output_schema", {}),
                    workflow_steps=wf.get("steps", []),
                    composed_skills=wf.get("uses", []),
                    policies=data.get("policies", {"read_only": True, "risk_tier": "LOW", "approval_required": False}),
                    parameters=data.get("parameters", []),
                )
            except Exception as ex:
                logger.warning(f"Error parsing storage skill package for '{skill_key}': {ex}")

        return None

    @classmethod
    async def resolve_skill(
        cls,
        skill_key: str,
        version: Optional[str] = None,
        project_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> CompiledSkill:
        """
        Resolves skill dynamically across L0 -> L1 -> L2 -> L3.
        1. Queries PostgreSQL control_plane.skill_definitions.
        2. If absent from database, inspects storage/skills/ package manifests.
        3. Composes L2 ProjectSkillBinding custom instructions.
        4. Injects L3 UserSkillRecord preferences.
        """
        base_skill: Optional[CompiledSkill] = None

        # 1. Check Database for Skill Definition
        try:
            async with get_async_db() as db:
                stmt = select(SkillDefinitionRecord).where(
                    SkillDefinitionRecord.skill_key == skill_key,
                    SkillDefinitionRecord.is_active == True
                )
                if version and version != "latest":
                    stmt = stmt.where(SkillDefinitionRecord.version == version)
                res = await db.execute(stmt)
                rec = res.scalars().first()

                if rec:
                    wf = rec.workflow_spec_json or {}
                    base_skill = CompiledSkill(
                        skill_key=rec.skill_key,
                        name=rec.name,
                        version=rec.version,
                        scope=rec.scope,
                        required_capabilities=rec.required_capabilities_json or [],
                        optional_capabilities=rec.optional_capabilities_json or [],
                        accepted_signals=rec.accepted_signals_json or [],
                        instructions_markdown=rec.instructions_markdown or "",
                        output_spec=rec.output_spec_json or {},
                        workflow_steps=wf.get("steps", []),
                        composed_skills=wf.get("uses", []),
                        policies=rec.policies_json or {},
                        parameters=rec.parameters_json or [],
                    )
        except Exception as dbe:
            logger.warning(f"Database query failed during skill resolution: {dbe}")

        # 2. Dynamic Fallback: Inspect declarative storage packages in storage/skills/
        if not base_skill:
            base_skill = cls._load_from_storage(skill_key)

        if not base_skill:
            raise ValueError(
                f"Skill '{skill_key}' is not registered in the Sentrix database or storage/skills directory."
            )

        # 3. Resolve Project Tagging & Bindings (L2)
        target_pid = project_id
        target_pkey = None
        target_pname = None

        if rec and getattr(rec, "target_project_id", None):
            target_pid = rec.target_project_id

        if target_pid:
            try:
                async with get_async_db() as db:
                    p_res = await db.execute(select(Project).where(Project.id == target_pid))
                    p_rec = p_res.scalars().first()
                    if p_rec:
                        target_pkey = p_rec.project_key
                        target_pname = p_rec.name
            except Exception as pe:
                logger.warning(f"Could not load project metadata for skill '{skill_key}': {pe}")

        if base_skill.scope == "PROJECT" or (rec and getattr(rec, "target_project_id", None)):
            base_skill.tagged_project_id = target_pid
            base_skill.tagged_project_key = target_pkey or target_pid
            base_skill.tag_badge = f"Project: {target_pkey or target_pid}"
        else:
            base_skill.tag_badge = "Platform Fleet (All Projects)"

        # Check Project-Level Custom Instructions & Bindings (L2)
        if project_id:
            try:
                async with get_async_db() as db:
                    b_stmt = select(ProjectSkillBinding).where(
                        ProjectSkillBinding.project_id == project_id,
                        ProjectSkillBinding.skill_key == skill_key,
                        ProjectSkillBinding.is_enabled == True
                    )
                    b_res = await db.execute(b_stmt)
                    binding = b_res.scalars().first()
                    if binding and binding.custom_instructions:
                        base_skill.custom_instructions = binding.custom_instructions
                        if base_skill.scope == "PLATFORM":
                            base_skill.tagged_project_id = project_id
                            base_skill.tagged_project_key = target_pkey or project_id
                            base_skill.tag_badge = f"Platform Fleet (Customized for {target_pkey or project_id})"
            except Exception as e:
                logger.warning(f"Could not load project skill binding: {e}")

        # 4. Check User-Level Custom Instructions (L3) - strictly scoped to (user_id, project_id)
        if user_id:
            try:
                async with get_async_db() as db:
                    u_stmt = select(UserSkillRecord).where(
                        UserSkillRecord.user_id == user_id,
                        UserSkillRecord.extends_skill_key == skill_key,
                        UserSkillRecord.is_active == True,
                        or_(UserSkillRecord.project_id == project_id, UserSkillRecord.project_id == None)
                    )
                    u_res = await db.execute(u_stmt)
                    user_sk = u_res.scalars().first()
                    if user_sk:
                        base_skill.tagged_user_id = user_id
                        base_skill.tag_badge = f"User: {user_id} @ {base_skill.tagged_project_key or 'Platform'}"
                        if user_sk.custom_instructions:
                            existing = base_skill.custom_instructions or ""
                            base_skill.custom_instructions = (
                                f"{existing}\nUser Guidance ({user_sk.name} for user '{user_id}'):\n{user_sk.custom_instructions}".strip()
                            )
            except Exception as e:
                logger.warning(f"Could not load user skill: {e}")

        return base_skill

    @classmethod
    def calculate_effective_permissions(
        cls,
        platform_caps: Set[str],
        project_caps: Set[str],
        user_caps: Set[str],
        skill_caps: Set[str]
    ) -> Set[str]:
        """
        Calculates mathematical intersection of capabilities:
        Effective = Platform ∩ Project ∩ User ∩ Skill (never union).
        """
        return platform_caps & project_caps & user_caps & skill_caps

    @classmethod
    async def select_best_skill(
        cls,
        intent_type: str,
        user_prompt: str,
        project_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> CompiledSkill:
        """
        Dynamically scores and selects the best skill based on classified intent,
        project bindings, user-project combinations, accepted signals, and prompt context without hardcoding.
        """
        candidates: List[Dict[str, Any]] = []

        # 1. Query available skills from database
        try:
            async with get_async_db() as db:
                # First fetch active project skill bindings
                project_bound_keys = set()
                if project_id:
                    b_stmt = select(ProjectSkillBinding).where(
                        ProjectSkillBinding.project_id == project_id,
                        ProjectSkillBinding.is_enabled == True
                    )
                    b_res = await db.execute(b_stmt)
                    for b in b_res.scalars().all():
                        project_bound_keys.add(b.skill_key)

                # Fetch all active skill definitions
                stmt = select(SkillDefinitionRecord).where(SkillDefinitionRecord.is_active == True)
                res = await db.execute(stmt)
                for rec in res.scalars().all():
                    candidates.append({
                        "skill_key": rec.skill_key,
                        "name": rec.name,
                        "category": rec.category,
                        "intents": [i.upper() for i in (rec.intents_json or [])],
                        "accepted_signals": rec.accepted_signals_json or [],
                        "is_project_bound": rec.skill_key in project_bound_keys or (getattr(rec, "target_project_id", None) == project_id),
                        "scope": rec.scope,
                    })

                # Check if user has shortcuts for this project combination
                if user_id:
                    u_stmt = select(UserSkillRecord).where(
                        UserSkillRecord.user_id == user_id,
                        UserSkillRecord.is_active == True,
                        or_(UserSkillRecord.project_id == project_id, UserSkillRecord.project_id == None)
                    )
                    u_res = await db.execute(u_stmt)
                    for u in u_res.scalars().all():
                        for cand in candidates:
                            if cand["skill_key"] == u.extends_skill_key or cand["skill_key"] == u.skill_key:
                                cand["has_user_shortcut"] = True
        except Exception as e:
            logger.warning(f"Failed to query database for skill candidates: {e}")

        # If DB candidates empty, scan storage directory manifests
        if not candidates and STORAGE_SKILLS_DIR.exists():
            for scope_dir in STORAGE_SKILLS_DIR.iterdir():
                if not scope_dir.is_dir():
                    continue
                for sk_folder in scope_dir.iterdir():
                    if not sk_folder.is_dir():
                        continue
                    m_path = sk_folder / "manifest.yaml"
                    if not m_path.exists():
                        m_path = sk_folder / "skill.yaml"
                    if m_path.exists():
                        try:
                            with open(m_path, "r", encoding="utf-8") as mf:
                                m_data = yaml.safe_load(mf) or {}
                            m_meta = m_data.get("metadata", {})
                            candidates.append({
                                "skill_key": m_meta.get("skill_key", sk_folder.name),
                                "name": m_meta.get("name", sk_folder.name),
                                "category": m_meta.get("category", "investigation"),
                                "intents": [i.upper() for i in m_data.get("intents", [])],
                                "accepted_signals": m_data.get("accepted_signals", []),
                                "is_project_bound": scope_dir.name.upper() == "PROJECT",
                                "scope": scope_dir.name.upper(),
                            })
                        except Exception:
                            pass

        if not candidates:
            raise RuntimeError("No active skills found in Sentrix database or storage catalog.")

        # 2. Dynamic scoring
        norm_intent = (intent_type or "").upper()
        norm_prompt = (user_prompt or "").lower()
        scored: List[tuple[int, str]] = []

        for c in candidates:
            score = 0
            sk_key = c["skill_key"]
            sk_name = c["name"].lower()
            sk_category = c["category"].lower()

            # Intent match (+60)
            if any(norm_intent == i or norm_intent in i or i in norm_intent for i in c["intents"]):
                score += 60

            # Project-bound bonus (+30) to prioritize project-specific workflows
            if c.get("is_project_bound"):
                score += 30

            # User shortcut / preference match (+25) for this user-project combo
            if c.get("has_user_shortcut"):
                score += 25

            # Signal match (+20 each)
            for sig in c.get("accepted_signals", []):
                sig_short = sig.split(".")[-1]
                if sig_short in norm_prompt:
                    score += 20
                if "account" in sig and ("ban" in norm_prompt or "account" in norm_prompt):
                    score += 20
                if "case" in sig and ("ticket" in norm_prompt or "jira" in norm_prompt or "issue" in norm_prompt):
                    score += 20
                if "environment" in norm_prompt or "qlab" in norm_prompt:
                    score += 15

            # Semantic keyword matching from name and category (+10 each)
            name_words = re.findall(r"\w+", sk_name) + re.findall(r"\w+", sk_key)
            for word in name_words:
                if len(word) > 3 and word in norm_prompt:
                    score += 15

            if sk_category in norm_prompt:
                score += 10

            scored.append((score, sk_key))

        # Sort descending by score
        scored.sort(key=lambda x: x[0], reverse=True)
        winner_key = scored[0][1]
        logger.info(f"[SkillsEngine] Selected dynamic skill '{winner_key}' (score={scored[0][0]}) for intent '{intent_type}'")

        return await cls.resolve_skill(winner_key, project_id=project_id, user_id=user_id)
