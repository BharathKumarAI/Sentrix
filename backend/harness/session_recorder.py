"""
Append-Only Session Trace Recorder for Sentrix Agent Harness.
Implements append-only execution traceability aligned with Google ADK 2.8.0:
Records every reasoning step, tool call, hook dispatch, evaluation rubric,
and FinOps metric into an immutable chronological audit trail.
"""
import asyncio
from datetime import datetime, timezone
import hashlib
import json
import logging
from typing import Any, AsyncGenerator, Dict, List, Optional
import uuid

logger = logging.getLogger("sentrix.harness.trace")


class TraceEvent:
    """Immutable single trace event in the harness execution timeline."""

    def __init__(
        self,
        seq_no: int,
        event_type: str,
        plugin_id: Optional[str],
        category: Optional[str],
        payload: Dict[str, Any],
        run_id: str
    ):
        self.id = f"trc_{seq_no}_{uuid.uuid4().hex[:6]}"
        self.seq_no = seq_no
        self.event_type = event_type
        self.plugin_id = plugin_id
        self.category = category
        self.payload = payload
        self.run_id = run_id
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.checksum = self._compute_checksum()

    def _compute_checksum(self) -> str:
        serialized = json.dumps({
            "seq_no": self.seq_no,
            "type": self.event_type,
            "plugin_id": self.plugin_id,
            "timestamp": self.timestamp,
            "payload": self.payload
        }, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "seq_no": self.seq_no,
            "event_type": self.event_type,
            "plugin_id": self.plugin_id,
            "category": self.category,
            "payload": self.payload,
            "run_id": self.run_id,
            "timestamp": self.timestamp,
            "checksum": self.checksum
        }


class HarnessSessionRecorder:
    """
    Manages active session trajectories and live SSE lifecycle broadcasts.
    """

    _traces_by_run: Dict[str, List[TraceEvent]] = {}
    _recent_lifecycle_events: List[Dict[str, Any]] = []
    _event_listeners: List[asyncio.Queue] = []

    @classmethod
    def record_event(
        cls,
        run_id: str,
        event_type: str,
        payload: Dict[str, Any],
        plugin_id: Optional[str] = None,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """Appends an event to the run trace and broadcasts to live listeners."""
        if run_id not in cls._traces_by_run:
            cls._traces_by_run[run_id] = []

        seq_no = len(cls._traces_by_run[run_id]) + 1
        event = TraceEvent(
            seq_no=seq_no,
            event_type=event_type,
            plugin_id=plugin_id,
            category=category,
            payload=payload,
            run_id=run_id
        )
        cls._traces_by_run[run_id].append(event)

        event_dict = event.to_dict()

        # Cache in recent lifecycle events (max 50)
        cls._recent_lifecycle_events.insert(0, event_dict)
        if len(cls._recent_lifecycle_events) > 50:
            cls._recent_lifecycle_events.pop()

        # Broadcast to active SSE queues
        for q in list(cls._event_listeners):
            try:
                q.put_nowait(event_dict)
            except Exception:
                pass

        return event_dict

    @classmethod
    def get_trace(cls, run_id: str) -> List[Dict[str, Any]]:
        events = cls._traces_by_run.get(run_id, [])
        return [e.to_dict() for e in events]

    @classmethod
    def get_recent_events(cls) -> List[Dict[str, Any]]:
        return list(cls._recent_lifecycle_events)

    @classmethod
    async def subscribe_lifecycle_stream(cls) -> AsyncGenerator[Dict[str, Any], None]:
        """Async generator streaming live plugin lifecycle events to SSE clients."""
        q = asyncio.Queue()
        cls._event_listeners.append(q)
        try:
            while True:
                event = await q.get()
                yield event
        finally:
            if q in cls._event_listeners:
                cls._event_listeners.remove(q)
