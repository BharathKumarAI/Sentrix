"""Organization directory and team ownership configuration for administrators."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from backend.auth.rbac import require_capability, CAP_ADMIN_CONSOLE_ACCESS
from backend.database.connection import get_async_db
from backend.database.models import Organization, Team, Project

router = APIRouter(prefix="/api/admin/organizations", tags=["Organizations"],
                   dependencies=[Depends(require_capability(CAP_ADMIN_CONSOLE_ACCESS))])


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]{0,63}$")


class TeamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class ProjectOwnership(BaseModel):
    team_id: str | None = None


@router.get("")
async def list_organizations():
    async with get_async_db() as db:
        organizations = (await db.execute(select(Organization).where(Organization.is_deleted == False)
                                         .order_by(Organization.name))).scalars().all()
        teams = (await db.execute(select(Team).where(Team.is_deleted == False))).scalars().all()
        projects = (await db.execute(select(Project).where(Project.is_deleted == False))).scalars().all()
        return [{"id": o.id, "name": o.name, "slug": o.slug,
                 "teams": [{"id": t.id, "name": t.name} for t in teams if t.organization_id == o.id],
                 "projects": [{"id": p.id, "name": p.name, "team_id": p.team_id}
                              for p in projects if p.organization_id == o.id]} for o in organizations]


@router.post("", status_code=201)
async def create_organization(req: OrganizationCreate):
    try:
        async with get_async_db() as db:
            row = Organization(id=f"org_{uuid.uuid4().hex}", name=req.name.strip(), slug=req.slug)
            if not row.name:
                raise HTTPException(422, "Organization name cannot be blank")
            db.add(row)
            await db.flush()
            result = {"id": row.id, "name": row.name, "slug": row.slug}
        return result
    except IntegrityError as exc:
        raise HTTPException(409, "An organization with this slug already exists") from exc


@router.post("/{organization_id}/teams", status_code=201)
async def create_team(organization_id: str, req: TeamCreate):
    try:
        async with get_async_db() as db:
            organization = await db.get(Organization, organization_id)
            if not organization or organization.is_deleted:
                raise HTTPException(404, "Organization not found")
            row = Team(id=f"team_{uuid.uuid4().hex}", organization_id=organization_id, name=req.name.strip())
            if not row.name:
                raise HTTPException(422, "Team name cannot be blank")
            db.add(row)
            await db.flush()
            result = {"id": row.id, "name": row.name}
        return result
    except IntegrityError as exc:
        raise HTTPException(409, "A team with this name already exists in this organization") from exc


@router.put("/{organization_id}/projects/{project_id}")
async def assign_project(organization_id: str, project_id: str, req: ProjectOwnership):
    async with get_async_db() as db:
        org = await db.get(Organization, organization_id)
        project = await db.get(Project, project_id)
        if not org or org.is_deleted or not project or project.is_deleted:
            raise HTTPException(404, "Organization or project not found")
        if req.team_id:
            team = await db.get(Team, req.team_id)
            if not team or team.is_deleted or team.organization_id != organization_id:
                raise HTTPException(422, "Select a team belonging to this organization")
        project.organization_id, project.team_id = organization_id, req.team_id
    return {"project_id": project_id, "organization_id": organization_id, "team_id": req.team_id}


@router.delete("/{organization_id}/projects/{project_id}")
async def unassign_project(organization_id: str, project_id: str):
    async with get_async_db() as db:
        project = await db.get(Project, project_id)
        if not project or project.is_deleted:
            raise HTTPException(404, "Project not found")
        project.organization_id = None
        project.team_id = None
    return {"status": "unassigned", "project_id": project_id}


@router.delete("/{organization_id}/teams/{team_id}")
async def delete_team(organization_id: str, team_id: str):
    async with get_async_db() as db:
        team = await db.get(Team, team_id)
        if not team or team.is_deleted or team.organization_id != organization_id:
            raise HTTPException(404, "Team not found")
        team.is_deleted = True
        # detach projects from this team
        projects = (await db.execute(select(Project).where(Project.team_id == team_id))).scalars().all()
        for p in projects:
            p.team_id = None
    return {"status": "deleted", "team_id": team_id}


@router.delete("/{organization_id}")
async def delete_organization(organization_id: str):
    async with get_async_db() as db:
        org = await db.get(Organization, organization_id)
        if not org or org.is_deleted:
            raise HTTPException(404, "Organization not found")
        org.is_deleted = True
        # detach projects
        projects = (await db.execute(select(Project).where(Project.organization_id == organization_id))).scalars().all()
        for p in projects:
            p.organization_id = None
            p.team_id = None
        # soft delete teams
        teams = (await db.execute(select(Team).where(Team.organization_id == organization_id))).scalars().all()
        for t in teams:
            t.is_deleted = True
    return {"status": "deleted", "organization_id": organization_id}

