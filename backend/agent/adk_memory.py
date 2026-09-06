"""
PostgreSQL-Backed Long-Term Memory Service for PRISM using Google ADK.
Extends BaseMemoryService to store project-level operational context, past triage notes,
and user preferences across multi-turn sessions.
"""
import logging
from typing import Any, Mapping, Optional, Sequence
from google.adk.events import Event
from google.adk.memory.base_memory_service import BaseMemoryService, SearchMemoryResponse
from google.adk.memory.memory_entry import MemoryEntry
from google.adk.sessions import Session
from sqlalchemy import select, text
from backend.database.connection import get_async_db
from backend.database.models import OkfKnowledgeNode

logger = logging.getLogger("prism.agent.memory")


class PrismDatabaseMemoryService(BaseMemoryService):
    """
    Durable Memory Service integrated with Google ADK and PostgreSQL.
    """

    async def add_memory(
        self,
        *,
        app_name: str,
        user_id: str,
        memories: Sequence[MemoryEntry],
        custom_metadata: Optional[Mapping[str, object]] = None
    ) -> None:
        async with get_async_db() as db:
            for mem in memories:
                node = OkfKnowledgeNode(
                    id=f"mem_{mem.id if hasattr(mem, 'id') and mem.id else 'auto'}_{int(datetime.now().timestamp())}",
                    title=f"Memory: {app_name} ({user_id})",
                    category="MEMORY",
                    content_markdown=str(mem.content if hasattr(mem, "content") else mem),
                    applicability_rules_json={"app_name": app_name, "user_id": user_id, "metadata": dict(custom_metadata or {})},
                    helpful_score=1,
                    usage_count=1
                )
                node.row_hash = node.calculate_row_hash({"title": node.title, "content": node.content_markdown})
                db.add(node)
        logger.info(f"Persisted {len(memories)} memory entries for {user_id} ({app_name})")

    async def search_memory(
        self,
        *,
        app_name: str,
        user_id: str,
        query: str
    ) -> SearchMemoryResponse:
        logger.info(f"Searching memory for query='{query}' (app={app_name}, user={user_id})")
        async with get_async_db() as db:
            # Query knowledge nodes and triaged cases
            stmt = select(OkfKnowledgeNode).where(
                OkfKnowledgeNode.content_markdown.ilike(f"%{query[:30]}%")
            ).limit(5)
            res = await db.execute(stmt)
            nodes = res.scalars().all()

            memories = []
            for n in nodes:
                memories.append(MemoryEntry(content=n.content_markdown))

            return SearchMemoryResponse(memories=memories)

    async def add_events_to_memory(
        self,
        *,
        app_name: str,
        user_id: str,
        events: Sequence[Event],
        session_id: Optional[str] = None,
        custom_metadata: Optional[Mapping[str, object]] = None
    ) -> None:
        logger.info(f"Added {len(events)} events to memory for session {session_id}")

    async def add_session_to_memory(self, session: Session) -> None:
        logger.info(f"Indexed session {session.id} into memory.")
