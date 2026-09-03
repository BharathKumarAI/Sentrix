"""
Multi-Level Feedback Collection Engine for PRISM.
Captures user feedback across:
1. Message Level (Thumbs up/down, 1-5 rating, comment)
2. Citation / Evidence Level (Verified, Relevant, Irrelevant)
3. Action Proposal Level (Approval decision, override edits, rejection reasons)
4. Triage Accuracy Level (Root cause confirmation, MTTR delta)
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import desc, select
from backend.database.connection import get_async_db
from backend.database.models import EvidenceItem, OkfFeedbackSignal

logger = logging.getLogger("prism.feedback.service")


class FeedbackService:
    """
    Records and processes multi-level quality feedback to feed the auto-learning loop.
    """

    @classmethod
    async def record_feedback(
        cls,
        source_type: str,
        source_id: str,
        user_id: str,
        signal_type: str,
        score: Optional[int] = None,
        notes: Optional[str] = None
    ) -> str:
        """Record an explicit feedback signal in the database."""
        sig_id = f"sig_{uuid.uuid4().hex[:10]}"
        async with get_async_db() as db:
            signal = OkfFeedbackSignal(
                id=sig_id,
                source_type=source_type,
                source_id=source_id,
                user_id=user_id,
                signal_type=signal_type,
                feedback_score=score,
                qualitative_notes=notes
            )
            signal.row_hash = signal.calculate_row_hash({"id": sig_id, "src": source_id, "sig": signal_type})
            db.add(signal)

            # If evidence citation feedback, update the evidence record directly
            if source_type == "EVIDENCE" and signal_type in ("VERIFIED", "REJECTED", "UNCERTAIN"):
                ev_stmt = select(EvidenceItem).where(EvidenceItem.id == source_id)
                ev_res = await db.execute(ev_stmt)
                ev_item = ev_res.scalars().first()
                if ev_item:
                    ev_item.relevance_rating = signal_type

            logger.info(f"Recorded {signal_type} feedback for {source_type} [{source_id}] by {user_id}")
        return sig_id

    @classmethod
    async def get_recent_feedback(cls, limit: int = 25) -> List[Dict[str, Any]]:
        """Retrieve recent feedback signals for operational metrics."""
        async with get_async_db() as db:
            stmt = select(OkfFeedbackSignal).order_by(desc(OkfFeedbackSignal.submitted_at)).limit(limit)
            res = await db.execute(stmt)
            signals = res.scalars().all()
            return [
                {
                    "id": s.id,
                    "source_type": s.source_type,
                    "source_id": s.source_id,
                    "user_id": s.user_id,
                    "signal_type": s.signal_type,
                    "feedback_score": s.feedback_score,
                    "notes": s.qualitative_notes,
                    "submitted_at": s.submitted_at.isoformat()
                }
                for s in signals
            ]
