"""
Base definitions and interfaces for the Sentrix Agent Harness.
Implements an extensible, multi-tenant agent framework plugin architecture
with composable lifecycle hooks aligned with Google ADK 2.8.0.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
import logging
from typing import Any, Callable, Dict, List, Optional, Union

logger = logging.getLogger("sentrix.harness.plugin_base")


class PluginCategory(str, Enum):
    """
    7 Core Plugin Categories in Sentrix Agent Harness:
    - MODEL: Foundation model adapters (Gemini, LiteLLM, DeepSeek, Claude, Ollama)
    - TOOL: External infrastructure connectors (Jira, Splunk, Oracle, K8s, MCP, REST)
    - SKILL: Layered diagnostic and remediation playbooks (L0-L3 Skills Engine)
    - SANDBOX: Code and shell isolation environments (Unix SSH, container sandbox, governed executor)
    - EVALUATOR: Verification, benchmark, and coverage guards (Coverage reporter, root cause scorer, hallucination guard)
    - MEMORY: Durable state and knowledge storage (OKF graph, Azure Blob bundles, ADK session memory)
    - HOOK: Governance, FinOps, policy gates, and audit ledgers (Write-lock approval, CAPO tracker, audit hasher)
    """
    MODEL = "model"
    TOOL = "tool"
    SKILL = "skill"
    SANDBOX = "sandbox"
    EVALUATOR = "evaluator"
    MEMORY = "memory"
    HOOK = "hook"


class PluginStatus(str, Enum):
    ENABLED = "ENABLED"
    DISABLED = "DISABLED"
    DEGRADED = "DEGRADED"
    ERROR = "ERROR"


class HarnessMode(str, Enum):
    """
    Execution modes for the Agent Harness:
    - SRE_TRIAGE: Read-only diagnostic investigation with multi-source evidence correlation.
    - AUTO_REMEDIATION: Governed action proposal execution gated by cryptographic write locks.
    - CODE_SANDBOX: Interactive shell execution and script debugging in an isolated perimeter.
    - BENCHMARK_EVAL: Automated regression testing, evidence coverage scoring, and multi-model eval.
    """
    SRE_TRIAGE = "sre_triage"
    AUTO_REMEDIATION = "auto_remediation"
    CODE_SANDBOX = "code_sandbox"
    BENCHMARK_EVAL = "benchmark_eval"


@dataclass
class PluginFinOpsMetrics:
    """FinOps & Cost Management tracking for AI Agents."""
    cost_tier: str = "LOW"  # FREE, LOW, MEDIUM, HIGH, ENTERPRISE
    estimated_usd_per_invocation: float = 0.0
    total_invocations: int = 0
    total_tokens_consumed: int = 0
    total_cost_usd: float = 0.0
    avg_latency_ms: float = 0.0
    error_count: int = 0
    last_invoked_at: Optional[str] = None

    def record_invocation(self, latency_ms: float, tokens: int = 0, cost_usd: Optional[float] = None, success: bool = True):
        self.total_invocations += 1
        self.total_tokens_consumed += tokens
        incurred = cost_usd if cost_usd is not None else 0.0
        self.total_cost_usd += incurred
        # Moving average latency
        self.avg_latency_ms = ((self.avg_latency_ms * (self.total_invocations - 1)) + latency_ms) / self.total_invocations
        if not success:
            self.error_count += 1
        self.last_invoked_at = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "cost_tier": self.cost_tier,
            "estimated_usd_per_invocation": round(self.estimated_usd_per_invocation, 4),
            "total_invocations": self.total_invocations,
            "total_tokens_consumed": self.total_tokens_consumed,
            "total_cost_usd": round(self.total_cost_usd, 4),
            "avg_latency_ms": round(self.avg_latency_ms, 1),
            "error_count": self.error_count,
            "last_invoked_at": self.last_invoked_at
        }


@dataclass
class PluginManifest:
    """Metadata manifest describing a mounted plugin."""
    id: str
    name: str
    version: str
    category: PluginCategory
    description: str
    author: str = "Sentrix Platform Core"
    status: PluginStatus = PluginStatus.ENABLED
    capabilities: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)
    config_schema: Dict[str, Any] = field(default_factory=dict)
    active_config: Dict[str, Any] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)
    finops: PluginFinOpsMetrics = field(default_factory=PluginFinOpsMetrics)
    mounted_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "category": self.category.value if isinstance(self.category, PluginCategory) else str(self.category),
            "description": self.description,
            "author": self.author,
            "status": self.status.value if isinstance(self.status, PluginStatus) else str(self.status),
            "capabilities": self.capabilities,
            "dependencies": self.dependencies,
            "config_schema": self.config_schema,
            "active_config": self.active_config,
            "tags": self.tags,
            "finops": self.finops.to_dict(),
            "mounted_at": self.mounted_at
        }

    def to_db_dict(self) -> Dict[str, Any]:
        """Converts manifest into a dict suitable for PostgreSQL control_plane.harness_plugins insert/update."""
        return {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "category": self.category.value if isinstance(self.category, PluginCategory) else str(self.category),
            "description": self.description,
            "author": self.author,
            "status": self.status.value if isinstance(self.status, PluginStatus) else str(self.status),
            "capabilities": self.capabilities,
            "dependencies": self.dependencies,
            "config_schema": self.config_schema,
            "active_config": self.active_config,
            "tags": self.tags,
            "cost_tier": self.finops.cost_tier,
            "estimated_usd_per_invocation": self.finops.estimated_usd_per_invocation,
            "total_invocations": self.finops.total_invocations,
            "total_tokens_consumed": self.finops.total_tokens_consumed,
            "total_cost_usd": self.finops.total_cost_usd,
            "avg_latency_ms": self.finops.avg_latency_ms,
            "error_count": self.finops.error_count,
            "last_invoked_at": datetime.fromisoformat(self.finops.last_invoked_at) if self.finops.last_invoked_at else None,
        }

    @classmethod
    def from_db_record(cls, record: Any) -> "PluginManifest":
        """Reconstructs manifest from a database record."""
        category_val = getattr(record, "category", "tool")
        try:
            category = PluginCategory(category_val)
        except ValueError:
            category = PluginCategory.TOOL

        status_val = getattr(record, "status", "ENABLED")
        try:
            status = PluginStatus(status_val)
        except ValueError:
            status = PluginStatus.ENABLED

        last_invoked = getattr(record, "last_invoked_at", None)
        last_invoked_str = last_invoked.isoformat() if last_invoked else None

        finops = PluginFinOpsMetrics(
            cost_tier=getattr(record, "cost_tier", "LOW") or "LOW",
            estimated_usd_per_invocation=float(getattr(record, "estimated_usd_per_invocation", 0.001) or 0.001),
            total_invocations=int(getattr(record, "total_invocations", 0) or 0),
            total_tokens_consumed=int(getattr(record, "total_tokens_consumed", 0) or 0),
            total_cost_usd=float(getattr(record, "total_cost_usd", 0.0) or 0.0),
            avg_latency_ms=float(getattr(record, "avg_latency_ms", 45.0) or 45.0),
            error_count=int(getattr(record, "error_count", 0) or 0),
            last_invoked_at=last_invoked_str
        )

        mounted_at = getattr(record, "mounted_at", None)
        mounted_at_str = mounted_at.isoformat() if mounted_at else datetime.now(timezone.utc).isoformat()

        return cls(
            id=getattr(record, "id"),
            name=getattr(record, "name"),
            version=getattr(record, "version", "2.0.0"),
            category=category,
            description=getattr(record, "description", ""),
            author=getattr(record, "author", "Sentrix Platform Core"),
            status=status,
            capabilities=getattr(record, "capabilities", []) or [],
            dependencies=getattr(record, "dependencies", []) or [],
            config_schema=getattr(record, "config_schema", {}) or {},
            active_config=getattr(record, "active_config", {}) or {},
            tags=getattr(record, "tags", []) or [],
            finops=finops,
            mounted_at=mounted_at_str
        )


class HarnessPlugin(ABC):
    """
    Abstract base class for all Sentrix Agent Harness plugins.
    Implements lifecycle hooks and verification interfaces aligned with Google ADK 2.8.0.
    """

    def __init__(self, manifest: PluginManifest):
        self.manifest = manifest

    @property
    def id(self) -> str:
        return self.manifest.id

    @property
    def name(self) -> str:
        return self.manifest.name

    @property
    def category(self) -> PluginCategory:
        return self.manifest.category

    @property
    def status(self) -> PluginStatus:
        return self.manifest.status

    @status.setter
    def status(self, value: PluginStatus):
        self.manifest.status = value

    @property
    def is_enabled(self) -> bool:
        return self.manifest.status == PluginStatus.ENABLED

    # --- Lifecycle Hooks (Google ADK 2.8.0 Aligned) ---

    async def on_mount(self) -> None:
        """Called when plugin is mounted into the agent harness."""
        logger.info(f"Mounted plugin '{self.id}' ({self.name})")

    async def on_unmount(self) -> None:
        """Called when plugin is gracefully unmounted."""
        logger.info(f"Unmounted plugin '{self.id}'")

    async def before_execute(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Intercepts execution before a tool, model, or step runs. Can mutate or validate context."""
        return context

    async def after_execute(self, context: Dict[str, Any], result: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Intercepts execution results after a step completes."""
        return result

    async def on_signal(self, signal: Dict[str, Any]) -> None:
        """Handles emitted signal in the agent runtime event bus."""
        pass

    async def on_action_proposed(self, proposal: Dict[str, Any]) -> None:
        """Called when an action proposal is submitted (governance check)."""
        pass

    @abstractmethod
    async def self_test(self) -> Dict[str, Any]:
        """
        Executes an active diagnostic self-test probe.
        Must return a dict with: {"healthy": bool, "latency_ms": float, "details": str, "timestamp": str}
        """
        pass

    def get_manifest(self) -> Dict[str, Any]:
        return self.manifest.to_dict()

    def update_config(self, new_config: Dict[str, Any]) -> None:
        self.manifest.active_config.update(new_config)
