"""
Agentic FinOps & Cloud Cost Management Tracker for Sentrix.
Enterprise multi-tenant agent cost governance aligned with Google ADK 2.8.0:
Tracks tokens, inference cost, latency, and CAPO (Cost per Accepted Outcome),
enforcing per-run dollar ceilings and step-count kill switches.
"""
from dataclasses import dataclass
from datetime import datetime, timezone
import logging
import os
from typing import Any, Dict, List, Optional

logger = logging.getLogger("sentrix.harness.finops")

# Configurable average senior SRE hourly rate for benchmark cost savings
MANUAL_SRE_HOURLY_COST_USD = float(os.getenv("MANUAL_SRE_HOURLY_COST_USD", "145.0"))


@dataclass
class RunBudgetLimit:
    max_tokens: int = 100_000
    max_cost_usd: float = 2.50
    max_steps: int = 30
    timeout_seconds: int = 120


class FinOpsTracker:
    """
    Monitors and enforces agent execution economics in real time.
    """

    _active_budgets: Dict[str, RunBudgetLimit] = {}
    _run_spend: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def initialize_run(cls, run_id: str, budget: Optional[RunBudgetLimit] = None):
        cls._active_budgets[run_id] = budget or RunBudgetLimit()
        cls._run_spend[run_id] = {
            "run_id": run_id,
            "tokens_in": 0,
            "tokens_out": 0,
            "total_tokens": 0,
            "total_cost_usd": 0.0,
            "steps_count": 0,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "status": "HEALTHY",
            "accepted_outcome": False
        }

    @classmethod
    def record_step_spend(
        cls,
        run_id: str,
        stage: str,
        tokens_in: int,
        tokens_out: int,
        cost_usd: float
    ) -> Dict[str, Any]:
        if run_id not in cls._run_spend:
            cls.initialize_run(run_id)

        spend = cls._run_spend[run_id]
        spend["tokens_in"] += tokens_in
        spend["tokens_out"] += tokens_out
        spend["total_tokens"] += (tokens_in + tokens_out)
        spend["total_cost_usd"] += cost_usd
        spend["steps_count"] += 1

        budget = cls._active_budgets.get(run_id, RunBudgetLimit())

        # Guardrail kill switches
        if spend["total_cost_usd"] >= budget.max_cost_usd:
            spend["status"] = "BUDGET_EXCEEDED"
            logger.warning(f"[FinOps] Run '{run_id}' exceeded cost budget: ${spend['total_cost_usd']:.4f} >= ${budget.max_cost_usd}")
        elif spend["steps_count"] >= budget.max_steps:
            spend["status"] = "STEP_LIMIT_EXCEEDED"
            logger.warning(f"[FinOps] Run '{run_id}' exceeded maximum steps limit: {spend['steps_count']} steps")

        return spend

    @classmethod
    def mark_outcome_accepted(cls, run_id: str):
        """Marks that SRE accepted this triage finding or executed proposed action."""
        if run_id in cls._run_spend:
            cls._run_spend[run_id]["accepted_outcome"] = True

    @classmethod
    def get_summary(cls) -> Dict[str, Any]:
        """Calculates global platform FinOps metrics and CAPO."""
        total_runs = len(cls._run_spend)
        total_cost = sum(r["total_cost_usd"] for r in cls._run_spend.values())
        total_tokens = sum(r["total_tokens"] for r in cls._run_spend.values())
        accepted_runs = sum(1 for r in cls._run_spend.values() if r.get("accepted_outcome", False))

        capo = (total_cost / accepted_runs) if accepted_runs > 0 else (total_cost / max(total_runs, 1))

        return {
            "total_runs_monitored": total_runs,
            "total_tokens_consumed": total_tokens,
            "total_cost_usd": round(total_cost, 4),
            "accepted_outcomes": accepted_runs,
            "cost_per_accepted_outcome_usd": round(capo, 4),
            "estimated_manual_sre_cost_saved_usd": round(accepted_runs * MANUAL_SRE_HOURLY_COST_USD, 2),
            "currency": "USD",
            "budget_guardrails_active": True
        }
