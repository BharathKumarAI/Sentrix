"""
Execution Modes for Sentrix Agent Harness.
Implements configurable operational runtime modes aligned with Google ADK 2.8.0:
- SRE_TRIAGE: Safe read-only diagnosis with multi-source log and DB correlation.
- AUTO_REMEDIATION: Governed action execution with write-lock approval desk.
- CODE_SANDBOX: Isolated POSIX shell and debugging sandbox.
- BENCHMARK_EVAL: Automated regression testing, evidence coverage scoring, and multi-model eval.
"""
from dataclasses import dataclass, field
import json
import logging
from typing import Any, Dict, List
from sqlalchemy import text
from backend.database.connection import get_sync_db
from backend.harness.plugin_base import HarnessMode

logger = logging.getLogger("sentrix.harness.modes")


@dataclass
class ModeDefinition:
    key: str
    name: str
    description: str
    badge: str
    badge_color: str
    read_only: bool
    governance_level: str
    default_plugins: List[str]
    allowed_categories: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "key": self.key,
            "name": self.name,
            "description": self.description,
            "badge": self.badge,
            "badge_color": self.badge_color,
            "read_only": self.read_only,
            "governance_level": self.governance_level,
            "default_plugins": self.default_plugins,
            "allowed_categories": self.allowed_categories
        }


HARNESS_MODES_CATALOG: Dict[str, ModeDefinition] = {
    HarnessMode.SRE_TRIAGE.value: ModeDefinition(
        key=HarnessMode.SRE_TRIAGE.value,
        name="SRE Autonomous Triage",
        description="Non-destructive multi-source investigation correlating Splunk logs, Oracle DB queries, Jira tickets, and Confluence runbooks.",
        badge="PRODUCTION SAFE",
        badge_color="badge-teal",
        read_only=True,
        governance_level="READ_ONLY_GUARDED",
        default_plugins=[
            "plugin_tool_jira",
            "plugin_tool_splunk",
            "plugin_tool_oracle",
            "plugin_tool_confluence",
            "plugin_tool_datadog",
            "plugin_model_gemini_pro",
            "plugin_model_gemini_flash",
            "plugin_skill_billing_triage",
            "plugin_eval_evidence_coverage",
            "plugin_memory_okf_graph"
        ],
        allowed_categories=["model", "tool", "skill", "evaluator", "memory"]
    ),
    HarnessMode.AUTO_REMEDIATION.value: ModeDefinition(
        key=HarnessMode.AUTO_REMEDIATION.value,
        name="Governed Auto-Remediation",
        description="Generates cryptographically locked action proposals for human SRE authorization before executing pod restarts or database adjustments.",
        badge="WRITE LOCK ACTIVE",
        badge_color="badge-magenta",
        read_only=False,
        governance_level="HUMAN_IN_THE_LOOP",
        default_plugins=[
            "plugin_tool_jira",
            "plugin_tool_kubernetes",
            "plugin_tool_unix",
            "plugin_tool_servicenow",
            "plugin_model_gemini_pro",
            "plugin_sandbox_governed_executor",
            "plugin_hook_write_lock",
            "plugin_hook_finops_capo"
        ],
        allowed_categories=["model", "tool", "skill", "sandbox", "evaluator", "memory", "hook"]
    ),
    HarnessMode.CODE_SANDBOX.value: ModeDefinition(
        key=HarnessMode.CODE_SANDBOX.value,
        name="Code & Shell Sandbox",
        description="Isolated POSIX execution perimeter for ad-hoc scripts, network diagnostic ping probes, and thread dump captures.",
        badge="ISOLATED CONTAINER",
        badge_color="badge-amber",
        read_only=False,
        governance_level="SANDBOX_CONTAINED",
        default_plugins=[
            "plugin_tool_unix",
            "plugin_tool_mcp_docs",
            "plugin_model_deepseek_v3",
            "plugin_sandbox_unix_ssh",
            "plugin_eval_root_cause_scorer"
        ],
        allowed_categories=["model", "tool", "sandbox", "evaluator"]
    ),
    HarnessMode.BENCHMARK_EVAL.value: ModeDefinition(
        key=HarnessMode.BENCHMARK_EVAL.value,
        name="Benchmark & Eval Suite",
        description="Autonomous quality flywheel evaluating evidence coverage completeness, confidence calibration, and model token costs.",
        badge="EVAL FLYWHEEL",
        badge_color="badge-blue",
        read_only=True,
        governance_level="BENCHMARK_OBSERVER",
        default_plugins=[
            "plugin_model_gemini_pro",
            "plugin_model_deepseek_v3",
            "plugin_model_claude_35",
            "plugin_eval_evidence_coverage",
            "plugin_eval_root_cause_scorer",
            "plugin_hook_finops_capo"
        ],
        allowed_categories=["model", "skill", "evaluator", "memory", "hook"]
    )
}


def sync_harness_modes_with_database(active_mode_key: str = "sre_triage"):
    """Seeds and updates control_plane.harness_execution_modes table."""
    try:
        with get_sync_db() as db:
            for key, m in HARNESS_MODES_CATALOG.items():
                db.execute(text("""
                    INSERT INTO control_plane.harness_execution_modes (
                        key, name, description, badge, badge_color, is_active, read_only,
                        governance_level, default_plugins, allowed_categories,
                        created_at, updated_at, etl_job_id, sync_version, is_deleted, source_system
                    ) VALUES (
                        :key, :name, :description, :badge, :badge_color, :is_active, :read_only,
                        :governance_level, :default_plugins, :allowed_categories,
                        NOW(), NOW(), 'ETL_INIT', 1, FALSE, 'prism'
                    ) ON CONFLICT (key) DO UPDATE SET
                        is_active = :is_active,
                        updated_at = NOW()
                """), {
                    "key": key,
                    "name": m.name,
                    "description": m.description,
                    "badge": m.badge,
                    "badge_color": m.badge_color,
                    "is_active": (key == active_mode_key),
                    "read_only": m.read_only,
                    "governance_level": m.governance_level,
                    "default_plugins": json.dumps(m.default_plugins),
                    "allowed_categories": json.dumps(m.allowed_categories)
                })
            db.commit()
    except Exception as e:
        logger.warning(f"Failed to sync harness execution modes with database: {e}")
