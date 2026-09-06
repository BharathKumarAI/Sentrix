"""Validated, tenant-scoped harness configuration and deterministic inheritance."""
from copy import deepcopy
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import select, or_
from backend.database.models import HarnessConfigurationRecord, HarnessPluginRecord, Project


class PluginBinding(BaseModel):
    model_config = ConfigDict(extra="forbid")
    enabled: bool = True
    instance_key: str = Field(min_length=1, max_length=64)
    operations: list[str] = Field(default_factory=list)

class RuntimeConfig(BaseModel):
    max_llm_calls: int = Field(default=4, ge=1, le=32)
    timeout_seconds: int = Field(default=120, ge=1, le=600)


class HarnessConfiguration(BaseModel):
    model_config = ConfigDict(extra="forbid")
    plugins: dict[str, PluginBinding] = Field(default_factory=dict)
    prompts: dict[str, str | None] = Field(default_factory=dict)
    skills: dict[str, str | None] = Field(default_factory=dict)
    runtime: RuntimeConfig = Field(default_factory=RuntimeConfig)


def merge_configurations(layers):
    """Whole plugin bindings replace inherited bindings; null removes a prompt/skill."""
    result = {"plugins": {}, "prompts": {}, "skills": {}, "runtime": {"max_llm_calls": 4, "timeout_seconds": 120}}
    sources = {"plugins": {}, "prompts": {}, "skills": {}, "runtime": {}}
    platform_disabled = set()
    for scope, configuration in layers:
        validated = HarnessConfiguration.model_validate(configuration).model_dump()
        for section, entries in validated.items():
            if section == "runtime":
                result[section].update(entries)
                sources[section].update({key: scope for key in entries})
                continue
            for key, value in entries.items():
                # A platform-disabled plugin is a hard safety boundary. More specific
                # scopes may change its binding metadata, but can never re-enable it.
                if section == "plugins" and key in platform_disabled and value is not None:
                    value = {**value, "enabled": False}
                if value is None:
                    result[section].pop(key, None)
                else:
                    result[section][key] = deepcopy(value)
                sources[section][key] = scope
                if scope == "platform" and section == "plugins" and value is not None and not value.get("enabled", True):
                    platform_disabled.add(key)
    return {**result, "sources": sources}


async def resolve_configuration(db, project_id):
    project = await db.get(Project, project_id)
    if project is None or project.is_deleted:
        raise ValueError("Project not found")
    scopes = [("platform", "platform")]
    if project.organization_id:
        scopes.append(("organization", project.organization_id))
    scopes.append(("project", project.id))
    rows = (await db.execute(select(HarnessConfigurationRecord).where(
        HarnessConfigurationRecord.is_deleted == False,
        or_(*[(HarnessConfigurationRecord.scope_type == kind) &
              (HarnessConfigurationRecord.scope_id == key) for kind, key in scopes])
    ))).scalars().all()
    by_scope = {(r.scope_type, r.scope_id): r.configuration for r in rows}
    return merge_configurations([(f"{kind}:{key}", by_scope.get((kind, key), {})) for kind, key in scopes])
