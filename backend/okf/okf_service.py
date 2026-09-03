"""
OKF v2.0 (Organizational Knowledge Fabric) Service for PRISM.
Powers auto-learning from resolved triages, case-based reasoning retrieval,
and organizational knowledge graph navigation.
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import desc, or_, select
from backend.database.connection import get_async_db
from backend.database.models import OkfEntity, OkfKnowledgeNode, OkfTriagedCase

logger = logging.getLogger("prism.okf.service")


class OKFService:
    """
    Manages continuous learning and retrieval across enterprise incident investigations.
    """

    @classmethod
    async def search_cases(
        cls,
        query: str,
        project_id: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Search past triaged cases by keywords, signature, or project."""
        async with get_async_db() as db:
            stmt = select(OkfTriagedCase)
            if project_id:
                stmt = stmt.where(OkfTriagedCase.project_id == project_id)

            if query:
                q_wildcard = f"%{query}%"
                stmt = stmt.where(
                    or_(
                        OkfTriagedCase.title.ilike(q_wildcard),
                        OkfTriagedCase.issue_signature.ilike(q_wildcard),
                        OkfTriagedCase.root_cause.ilike(q_wildcard),
                        OkfTriagedCase.incident_id.ilike(q_wildcard)
                    )
                )

            stmt = stmt.order_by(desc(OkfTriagedCase.times_referenced)).limit(limit)
            result = await db.execute(stmt)
            cases = result.scalars().all()

            return [
                {
                    "id": c.id,
                    "incident_id": c.incident_id,
                    "project_id": c.project_id,
                    "title": c.title,
                    "issue_signature": c.issue_signature,
                    "root_cause": c.root_cause,
                    "resolution_summary": c.resolution_summary,
                    "resolved_actions": c.resolved_actions_json,
                    "tags": c.tags,
                    "mttr_minutes": c.mttr_minutes,
                    "confidence_score": c.confidence_score,
                    "times_referenced": c.times_referenced
                }
                for c in cases
            ]

    @classmethod
    async def auto_learn_case(
        cls,
        incident_id: str,
        project_id: str,
        title: str,
        signature: str,
        root_cause: str,
        resolution_summary: str,
        resolved_actions: List[Dict[str, Any]],
        key_evidence_ids: List[str],
        verified_by_user_id: str,
        mttr_minutes: int = 15
    ) -> str:
        """
        Auto-learning feedback loop: Distills a verified investigation into an immutable OKF Knowledge Case.
        """
        case_id = f"okf_{uuid.uuid4().hex[:10]}"
        async with get_async_db() as db:
            case = OkfTriagedCase(
                id=case_id,
                incident_id=incident_id,
                project_id=project_id,
                title=title,
                issue_signature=signature,
                root_cause=root_cause,
                resolution_summary=resolution_summary,
                resolved_actions_json=resolved_actions,
                key_evidence_ids=key_evidence_ids,
                tags=["auto-learned", project_id],
                mttr_minutes=mttr_minutes,
                confidence_score=0.97,
                verified_by_user_id=verified_by_user_id,
                times_referenced=1
            )
            case.row_hash = case.calculate_row_hash({"id": case.id, "inc": incident_id})
            db.add(case)
            logger.info(f"[OKF Auto-Learning] Case {case_id} learned from verified incident {incident_id}")
        return case_id

    @classmethod
    async def list_knowledge_nodes(cls, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """List organizational runbooks and architecture nodes."""
        async with get_async_db() as db:
            stmt = select(OkfKnowledgeNode)
            if category:
                stmt = stmt.where(OkfKnowledgeNode.category == category)
            stmt = stmt.order_by(desc(OkfKnowledgeNode.helpful_score))
            result = await db.execute(stmt)
            nodes = result.scalars().all()
            return [
                {
                    "id": n.id,
                    "title": n.title,
                    "category": n.category,
                    "content": n.content_markdown,
                    "solution_steps": n.solution_steps_json,
                    "helpful_score": n.helpful_score,
                    "usage_count": n.usage_count
                }
                for n in nodes
            ]

    @classmethod
    async def create_knowledge_node(
        cls,
        title: str,
        category: str,
        content_markdown: str,
        solution_steps: Optional[List[str]] = None,
        node_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create and persist a new organizational runbook or knowledge node."""
        nid = node_id or f"OKF-RUN-{uuid.uuid4().hex[:6].upper()}"
        async with get_async_db() as db:
            node = OkfKnowledgeNode(
                id=nid,
                title=title,
                category=category,
                content_markdown=content_markdown,
                solution_steps_json=solution_steps or [],
                helpful_score=10,
                usage_count=0
            )
            node.row_hash = node.calculate_row_hash({"id": nid, "title": title})
            db.add(node)
            logger.info(f"[OKF Knowledge Fabric] Created runbook node {nid}: {title}")
            return {
                "id": node.id,
                "title": node.title,
                "category": node.category,
                "content": node.content_markdown,
                "solution_steps": node.solution_steps_json,
                "helpful_score": node.helpful_score,
                "usage_count": node.usage_count
            }
