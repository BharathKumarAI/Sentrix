"""
Telemetry & Operational Metrics Service for PRISM.
Computes live platform health, MTTR improvements, connector latency, token usage,
and quality feedback scores.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import func, select
from backend.database.connection import get_async_db
from backend.database.models import (
    ActionProposal,
    ConnectorHealth,
    EvidenceItem,
    OkfFeedbackSignal,
    OkfTriagedCase,
    Project,
    Run,
    RunMetric,
)


class MetricsService:
    """Calculates operational metrics across all 4 PRISM planes."""

    @classmethod
    async def get_dashboard_summary(cls, project_id: Optional[str] = None) -> Dict[str, Any]:
        async with get_async_db() as db:
            # 1. Total runs and success rate
            runs_query = select(Run)
            if project_id:
                runs_query = runs_query.where(Run.project_id == project_id)
            runs_res = await db.execute(runs_query)
            runs = runs_res.scalars().all()

            total_runs = len(runs)
            completed_runs = sum(1 for r in runs if r.status in ("COMPLETED", "AWAITING_APPROVAL"))
            success_rate = (completed_runs / total_runs * 100) if total_runs > 0 else None

            # 2. Average Latency & Tokens
            avg_latency = int(sum(r.latency_ms for r in runs) / total_runs) if total_runs > 0 else None
            total_tokens = sum(r.total_tokens for r in runs) if total_runs > 0 else 0

            # 3. Action proposals
            props_res = await db.execute(select(ActionProposal))
            props = props_res.scalars().all()
            total_proposals = len(props)
            pending_proposals = sum(1 for p in props if p.status == "PENDING_APPROVAL")
            approved_proposals = sum(1 for p in props if p.status in ("APPROVED", "EXECUTED"))

            # 4. Connector Health status
            health_res = await db.execute(select(ConnectorHealth))
            health_rows = health_res.scalars().all()
            healthy_count = sum(1 for h in health_rows if h.status == "HEALTHY")
            total_connectors = len(health_rows)

            # 5. OKF Cases & MTTR
            cases_res = await db.execute(select(OkfTriagedCase))
            cases = cases_res.scalars().all()
            total_cases = len(cases)
            avg_mttr = int(sum(c.mttr_minutes for c in cases) / total_cases) if total_cases > 0 else None

            # 6. Feedback Score
            fb_res = await db.execute(
                select(func.avg(OkfFeedbackSignal.feedback_score)).where(OkfFeedbackSignal.feedback_score.isnot(None))
            )
            avg_feedback = fb_res.scalar()

            return {
                "total_investigations": total_runs,
                "investigation_success_rate": round(success_rate, 1) if success_rate is not None else None,
                "average_triage_latency_ms": avg_latency,
                "total_tokens_consumed": total_tokens,
                "action_proposals": {
                    "total": total_proposals,
                    "pending_approval": pending_proposals,
                    "approved_and_executed": approved_proposals
                },
                "connectors": {
                    "total_active": total_connectors,
                    "healthy": healthy_count,
                    "degraded": max(total_connectors - healthy_count, 0)
                },
                "okf_knowledge": {
                    "total_distilled_cases": total_cases,
                    "average_mttr_minutes": avg_mttr,
                    "mttr_reduction_percent": None
                },
                "user_satisfaction_score": round(float(avg_feedback), 1) if avg_feedback is not None else None
            }
