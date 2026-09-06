"""Admin APIs for reusable connector plugins and scoped harness composition."""
import uuid
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from jsonschema import Draft202012Validator
from backend.auth.rbac import require_capability, CAP_ADMIN_CONSOLE_ACCESS
from backend.database.connection import get_async_db
from backend.database.models import (HarnessConfigurationRecord, HarnessPluginRecord, Organization, Project,
                                     ConnectorCatalog, ConnectorInstance)
from backend.harness.configuration import HarnessConfiguration, resolve_configuration
from backend.harness.plugin_registry import HarnessPluginRegistry

router = APIRouter(prefix="/api/admin/harness-configuration", tags=["Harness configuration"],
                   dependencies=[Depends(require_capability(CAP_ADMIN_CONSOLE_ACCESS))])

class Operation(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1)
    description: str = ""
    capability: str = Field(min_length=1)
    path: str = Field(pattern=r"^/([^/].*)?$")
    method: Literal["GET", "POST"] = "GET"
    read_only: Literal[True] = True
    input_schema: dict = Field(default_factory=lambda: {"type": "object"})

class PluginCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(pattern=r"^[a-z][a-z0-9_-]{0,63}$")
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    version: str = "1.0.0"
    adapter: str = "http"
    operations: dict[str, Operation] = Field(min_length=1)
    timeout_seconds: int = Field(default=30, ge=1, le=120)

@router.get("/plugins")
async def list_plugins():
    async with get_async_db() as db:
        rows = (await db.execute(select(HarnessPluginRecord).where(
            HarnessPluginRecord.category == "tool", HarnessPluginRecord.is_deleted == False))).scalars().all()
        return [{"id": r.id, "name": r.name, "description": r.description,
                 "capabilities": r.capabilities, "status": r.status,
                 "operations": (r.active_config or {}).get("operations", {})} for r in rows]

@router.post("/plugins", status_code=201)
async def create_plugin(req: PluginCreate):
    from backend.harness.connector_runtime import ConnectorPluginRuntime
    if req.adapter not in ConnectorPluginRuntime.adapters:
        raise HTTPException(422, "Install the trusted adapter implementation first")
    try:
        for op in req.operations.values():
            Draft202012Validator.check_schema(op.input_schema)
    except Exception as exc:
        raise HTTPException(422, "Invalid operation input schema") from exc
    try:
        async with get_async_db() as db:
            db.add(HarnessPluginRecord(id=req.id, name=req.name, description=req.description,
                version=req.version, category="tool", status="ENABLED",
                capabilities=sorted({op.capability for op in req.operations.values()}),
                active_config={"adapter": req.adapter, "timeout_seconds": req.timeout_seconds,
                               "operations": {key: op.model_dump() for key, op in req.operations.items()}},
                estimated_usd_per_invocation=0, avg_latency_ms=0))
            await db.flush()
    except IntegrityError as exc:
        raise HTTPException(409, "Plugin ID already exists") from exc
    await HarnessPluginRegistry.initialize_defaults()
    return {"id": req.id}

async def validate_scope(db, scope, scope_id):
    if scope == "platform":
        if scope_id != "platform": raise HTTPException(422, "Platform scope ID must be platform")
    else:
        row = await db.get(Organization if scope == "organization" else Project, scope_id)
        if row is None or row.is_deleted: raise HTTPException(404, "Scope not found")

@router.get("/scopes/{scope}/{scope_id}")
async def get_scope(scope: Literal["platform", "organization", "project"], scope_id: str):
    async with get_async_db() as db:
        await validate_scope(db, scope, scope_id)
        row = await db.scalar(select(HarnessConfigurationRecord).where(
            HarnessConfigurationRecord.scope_type == scope, HarnessConfigurationRecord.scope_id == scope_id,
            HarnessConfigurationRecord.is_deleted == False))
        return row.configuration if row else HarnessConfiguration().model_dump()

@router.put("/scopes/{scope}/{scope_id}")
async def save_scope(scope: Literal["platform", "organization", "project"], scope_id: str, req: HarnessConfiguration):
    async with get_async_db() as db:
        await validate_scope(db, scope, scope_id)
        for plugin_id, binding in req.plugins.items():
            plugin = await db.get(HarnessPluginRecord, plugin_id)
            if not plugin or plugin.is_deleted or plugin.category != "tool":
                raise HTTPException(422, f"Unknown connector plugin: {plugin_id}")
            declared = (plugin.active_config or {}).get("operations", {})
            if set(binding.operations) - set(declared):
                raise HTTPException(422, "Binding contains undeclared operations")
            if binding.enabled:
                instance = await db.scalar(select(ConnectorInstance).where(
                    ConnectorInstance.instance_key == binding.instance_key,
                    ConnectorInstance.is_deleted == False))
                if instance is None:
                    raise HTTPException(422, f"Connector instance '{binding.instance_key}' was not found")
                catalog = await db.scalar(select(ConnectorCatalog).where(
                    ConnectorCatalog.connector_key == instance.connector_key))
                if catalog is None or not catalog.is_admin_enabled:
                    raise HTTPException(422, "Connector is disabled in the platform connector catalog")
                if not instance.is_active or instance.test_status != "PASSED":
                    raise HTTPException(422, "Connector must be active and pass its connection test before it can be enabled")
                if instance.owning_project_id and (scope != "project" or instance.owning_project_id != scope_id):
                    raise HTTPException(422, "Connector instance is owned by a different project")
        row = await db.scalar(select(HarnessConfigurationRecord).where(
            HarnessConfigurationRecord.scope_type == scope, HarnessConfigurationRecord.scope_id == scope_id))
        if row is None:
            row = HarnessConfigurationRecord(id=uuid.uuid4().hex, scope_type=scope, scope_id=scope_id)
            db.add(row)
        row.configuration = req.model_dump()
        row.is_deleted = False
    return req.model_dump()

@router.get("/projects/{project_id}/resolved")
async def get_resolved(project_id: str):
    async with get_async_db() as db:
        try: return await resolve_configuration(db, project_id)
        except ValueError as exc: raise HTTPException(404, str(exc)) from exc

class AgentRunRequest(BaseModel):
    run_id: str
    environment: str
    provider_id: str
    model_id: str
    message: str = Field(min_length=1, max_length=50000)

@router.post("/projects/{project_id}/execute")
async def execute_project_agent(project_id: str, req: AgentRunRequest):
    from backend.database.models import Run, ModelProviderRecord
    from backend.services.event_stream import stream_events
    from backend.services.model_execution import execute_model
    async with get_async_db() as db:
        await validate_scope(db, "project", project_id)
        run = await db.get(Run, req.run_id)
        if not run or run.is_deleted or run.project_id != project_id or run.environment != req.environment:
            raise HTTPException(422, "Run does not match the selected project and environment")
        provider = await db.get(ModelProviderRecord, req.provider_id)
        if not provider or provider.is_deleted:
            raise HTTPException(422, "Provider is unavailable")
        credentials = dict(provider.credentials_json or {})
    async def produce(send):
        async def delta(text):
            await send({"type": "TEXT_DELTA", "payload": {"text": text}})
        try:
            result = await execute_model(model_id=req.model_id, credentials=credentials, prompt=req.message,
                on_delta=delta, harness_context={"project_id": project_id, "environment": req.environment,
                                               "run_id": req.run_id})
            await send({"type": "COMPLETED", "payload": {"text": result.text, "model": result.model,
                "latency_ms": result.latency_ms, "prompt_tokens": result.prompt_tokens,
                "completion_tokens": result.completion_tokens}})
        except Exception:
            await send({"type": "FAILED", "payload": {"message": "Agent execution failed. Check configuration and provider access."}})
    return StreamingResponse(stream_events(produce), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
