"""
Sentrix Autonomous SRE Platform - Context Budgeting & Time-Bounding Guardrail Middleware.
Protects LLM context window from 'Context Tax' degradation and prevents unbounded queries
across Splunk, Datadog, Jaeger, Jira, and PostgreSQL.
"""
from dataclasses import dataclass, field
from datetime import datetime, timezone
import logging
import re
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("sentrix.harness.context_budgeter")


@dataclass
class ContextBudgetResult:
    tool_name: str
    original_payload_bytes: int
    compressed_payload_bytes: int
    original_estimated_tokens: int
    compressed_estimated_tokens: int
    tokens_saved: int
    compression_ratio_pct: float
    time_bounded: bool
    earliest_time_enforced: str
    latest_time_enforced: str
    safety_violations: List[str]
    processed_payload: Any

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tool_name": self.tool_name,
            "original_payload_bytes": self.original_payload_bytes,
            "compressed_payload_bytes": self.compressed_payload_bytes,
            "original_estimated_tokens": self.original_estimated_tokens,
            "compressed_estimated_tokens": self.compressed_estimated_tokens,
            "tokens_saved": self.tokens_saved,
            "compression_ratio_pct": round(self.compression_ratio_pct, 1),
            "time_bounded": self.time_bounded,
            "earliest_time_enforced": self.earliest_time_enforced,
            "latest_time_enforced": self.latest_time_enforced,
            "safety_violations": self.safety_violations,
            "processed_payload": self.processed_payload
        }


class ContextBudgeter:
    """Enforces token budgets, time bounds, and query sanitization across connector executions."""

    # Default safety boundaries
    DEFAULT_EARLIEST_TIME = "-15m"
    DEFAULT_LATEST_TIME = "now"
    MAX_TIME_WINDOW_HOURS = 24
    MAX_LOG_EVENTS_CAP = 25
    MAX_SQL_ROW_LIMIT = 20
    MAX_DIFF_LINES = 200

    @classmethod
    def estimate_tokens(cls, text: Any) -> int:
        """Rough estimation: 1 token ~= 4 characters for English/JSON telemetry."""
        if text is None:
            return 0
        raw_str = str(text)
        return max(1, len(raw_str) // 4)

    @classmethod
    def sanitize_time_bounds(
        cls,
        earliest_time: Optional[str],
        latest_time: Optional[str]
    ) -> Tuple[str, str, List[str]]:
        """Validates and enforces strict time boundaries on observability queries."""
        violations = []
        earliest = earliest_time.strip() if earliest_time and earliest_time.strip() else cls.DEFAULT_EARLIEST_TIME
        latest = latest_time.strip() if latest_time and latest_time.strip() else cls.DEFAULT_LATEST_TIME

        # Check for dangerously unbounded queries
        if earliest in ["0", "all", "all_time", "*", "-1y", "-10y"]:
            violations.append(f"Unbounded time window '{earliest}' rejected. Overridden to '{cls.DEFAULT_EARLIEST_TIME}'.")
            earliest = cls.DEFAULT_EARLIEST_TIME

        return earliest, latest, violations

    @classmethod
    def process_splunk_query(
        cls,
        query: str,
        earliest_time: Optional[str] = None,
        latest_time: Optional[str] = None,
        raw_logs: Optional[List[Dict[str, Any]]] = None
    ) -> ContextBudgetResult:
        """Processes and budgets Splunk SPL search results."""
        earliest, latest, violations = cls.sanitize_time_bounds(earliest_time, latest_time)
        
        # Check query syntax for aggregation vs raw dump
        has_aggregator = any(keyword in query.lower() for keyword in ["stats ", "timechart ", "chart ", "top ", "rare "])
        if not has_aggregator:
            violations.append("Query lacks statistical aggregation ('stats count by ...'). Raw log extraction capped to 25 events.")

        logs = raw_logs or []
        original_tokens = cls.estimate_tokens(logs)
        original_bytes = len(str(logs).encode("utf-8"))

        # Budget raw logs
        capped_logs = logs[:cls.MAX_LOG_EVENTS_CAP]
        cleaned_logs = []
        for log in capped_logs:
            if isinstance(log, dict):
                # Keep only critical telemetry fields
                cleaned_logs.append({
                    "_time": log.get("_time") or log.get("timestamp"),
                    "level": log.get("level", "ERROR"),
                    "service": log.get("service") or log.get("app"),
                    "trace_id": log.get("trace_id"),
                    "message": (log.get("message") or str(log))[:300]  # truncate message body
                })
            else:
                cleaned_logs.append(str(log)[:300])

        compressed_tokens = cls.estimate_tokens(cleaned_logs)
        compressed_bytes = len(str(cleaned_logs).encode("utf-8"))
        saved = max(0, original_tokens - compressed_tokens)
        ratio = ((original_tokens - compressed_tokens) / max(1, original_tokens)) * 100.0 if original_tokens > 0 else 0.0

        return ContextBudgetResult(
            tool_name="splunk_query",
            original_payload_bytes=original_bytes,
            compressed_payload_bytes=compressed_bytes,
            original_estimated_tokens=original_tokens,
            compressed_estimated_tokens=compressed_tokens,
            tokens_saved=saved,
            compression_ratio_pct=ratio,
            time_bounded=True,
            earliest_time_enforced=earliest,
            latest_time_enforced=latest,
            safety_violations=violations,
            processed_payload={
                "events_returned": len(cleaned_logs),
                "capped_at": cls.MAX_LOG_EVENTS_CAP,
                "events": cleaned_logs
            }
        )

    @classmethod
    def process_jira_ticket(cls, ticket_data: Dict[str, Any]) -> ContextBudgetResult:
        """Strips heavy HTML/rich-text formatting from Jira/ServiceNow to minimize Context Tax."""
        original_tokens = cls.estimate_tokens(ticket_data)
        original_bytes = len(str(ticket_data).encode("utf-8"))

        def strip_html(html_str: str) -> str:
            if not html_str:
                return ""
            clean = re.sub(r"<[^>]+>", "", html_str)
            return " ".join(clean.split())

        # Extract only key triage fields
        fields = ticket_data.get("fields", ticket_data)
        description_raw = fields.get("description", "")
        clean_description = strip_html(str(description_raw))[:800]

        # Extract comments and limit to latest 3
        comments_raw = fields.get("comment", {}).get("comments", []) if isinstance(fields.get("comment"), dict) else []
        clean_comments = []
        for c in comments_raw[-3:]:
            clean_comments.append({
                "author": c.get("author", {}).get("displayName", "User"),
                "created": c.get("created"),
                "body": strip_html(c.get("body", ""))[:300]
            })

        processed = {
            "key": ticket_data.get("key", "UNKNOWN"),
            "summary": fields.get("summary", ""),
            "status": fields.get("status", {}).get("name", "Open") if isinstance(fields.get("status"), dict) else str(fields.get("status")),
            "priority": fields.get("priority", {}).get("name", "P2") if isinstance(fields.get("priority"), dict) else str(fields.get("priority")),
            "description": clean_description,
            "recent_comments": clean_comments
        }

        compressed_tokens = cls.estimate_tokens(processed)
        compressed_bytes = len(str(processed).encode("utf-8"))
        saved = max(0, original_tokens - compressed_tokens)
        ratio = ((original_tokens - compressed_tokens) / max(1, original_tokens)) * 100.0 if original_tokens > 0 else 0.0

        return ContextBudgetResult(
            tool_name="jira_ticket",
            original_payload_bytes=original_bytes,
            compressed_payload_bytes=compressed_bytes,
            original_estimated_tokens=original_tokens,
            compressed_estimated_tokens=compressed_tokens,
            tokens_saved=saved,
            compression_ratio_pct=ratio,
            time_bounded=False,
            earliest_time_enforced="",
            latest_time_enforced="",
            safety_violations=[],
            processed_payload=processed
        )

    @classmethod
    def process_apm_metrics(cls, raw_series: List[Dict[str, Any]]) -> ContextBudgetResult:
        """Compresses time-series arrays into min, max, avg, and p95 summary statistics."""
        original_tokens = cls.estimate_tokens(raw_series)
        original_bytes = len(str(raw_series).encode("utf-8"))

        summary_metrics = {}
        for s in raw_series:
            name = s.get("metric_name", "unknown_metric")
            values = s.get("values", [])
            if values and all(isinstance(v, (int, float)) for v in values):
                sorted_vals = sorted(values)
                p95_idx = int(len(sorted_vals) * 0.95)
                summary_metrics[name] = {
                    "points_count": len(values),
                    "min": round(min(values), 2),
                    "max": round(max(values), 2),
                    "avg": round(sum(values) / len(values), 2),
                    "p95": round(sorted_vals[min(p95_idx, len(sorted_vals) - 1)], 2)
                }
            else:
                summary_metrics[name] = {"summary": "non-numeric series", "points_count": len(values)}

        compressed_tokens = cls.estimate_tokens(summary_metrics)
        compressed_bytes = len(str(summary_metrics).encode("utf-8"))
        saved = max(0, original_tokens - compressed_tokens)
        ratio = ((original_tokens - compressed_tokens) / max(1, original_tokens)) * 100.0 if original_tokens > 0 else 0.0

        return ContextBudgetResult(
            tool_name="datadog_apm_metrics",
            original_payload_bytes=original_bytes,
            compressed_payload_bytes=compressed_bytes,
            original_estimated_tokens=original_tokens,
            compressed_estimated_tokens=compressed_tokens,
            tokens_saved=saved,
            compression_ratio_pct=ratio,
            time_bounded=True,
            earliest_time_enforced=cls.DEFAULT_EARLIEST_TIME,
            latest_time_enforced=cls.DEFAULT_LATEST_TIME,
            safety_violations=[],
            processed_payload=summary_metrics
        )

    @classmethod
    def process_sql_query(cls, sql_query: str, row_limit: int = MAX_SQL_ROW_LIMIT) -> Tuple[str, List[str]]:
        """Enforces read-only SELECT permissions and inserts hard LIMIT clauses."""
        violations = []
        clean_sql = sql_query.strip()
        sql_upper = clean_sql.upper()

        # Check for mutation queries
        dangerous_keywords = ["DROP ", "DELETE ", "UPDATE ", "INSERT ", "ALTER ", "TRUNCATE ", "GRANT ", "REVOKE "]
        for kw in dangerous_keywords:
            if kw in sql_upper:
                violations.append(f"Security violation: Analytical DB tool rejected mutation statement containing '{kw.strip()}'.")
                raise PermissionError(f"Analytical database queries must be strictly read-only. Blocked '{kw.strip()}'.")

        # Check if LIMIT exists
        if "LIMIT " not in sql_upper and "FETCH FIRST" not in sql_upper and "ROWNUM" not in sql_upper:
            violations.append(f"Hard LIMIT {row_limit} appended to prevent full table scan context blowup.")
            clean_sql = f"{clean_sql.rstrip(';')} LIMIT {row_limit};"

        return clean_sql, violations
