"""
Base Connector Architecture for PRISM.
Defines normalized contracts for all external integration adapters (Jira, Splunk, Oracle, Unix, SignalFx, Kafka, qTest, Confluence).
Enforces separation of safe reads (EvidenceBundle) vs writes (Governed Action Proposals).
Supports signal declarations (requiredSignals, acceptedSignals, producedSignals).
"""
import abc
import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.auth.identity import seeded_admin_user_id


class ExecutionContext(BaseModel):
    user_id: str = Field(default_factory=seeded_admin_user_id)
    project_id: str = ""
    project_environment: str = ""
    tool_environment: str = ""
    delegated_identity: str = ""
    correlation_id: str = "corr_default"
    effective_parameters: Dict[str, Any] = Field(default_factory=dict)


class ConnectorCapabilities(BaseModel):
    can_read: bool = True
    can_write_proposals: bool = False
    supported_operations: List[str] = Field(default_factory=list)
    supported_protocols: List[str] = Field(default_factory=list)
    auth_types: List[str] = Field(default_factory=list)
    is_global_capable: bool = False


class OperationManifest(BaseModel):
    operation_id: str
    display_name: str
    capability: str
    tool_name: str
    description: str
    input_schema: Dict[str, Any] = Field(default_factory=dict)
    output_schema: Dict[str, Any] = Field(default_factory=dict)
    required_signals: List[str] = Field(default_factory=list)
    accepted_signals: List[str] = Field(default_factory=list)
    produced_signals: List[str] = Field(default_factory=list)
    read_only: bool = True
    idempotent: bool = True
    requires_approval: bool = False
    timeout_ms: int = 30000
    max_retries: int = 2
    concurrency_limit: int = 5
    cost_class: str = "low"
    data_classification: str = "internal"
    source_type: str = "telemetry"
    batch_supported: bool = False
    enabled: bool = True


class EvidenceBundle(BaseModel):
    id: str
    run_id: str
    step_id: Optional[str] = None
    source: Dict[str, str]  # {"connector": "configured-source", "operation": "database.query_batch"}
    observations: List[Dict[str, Any]] = Field(default_factory=list)
    signals: List[Dict[str, Any]] = Field(default_factory=list)
    artifact_ref: Optional[str] = None
    summary: str
    raw_payload: Dict[str, Any] = Field(default_factory=dict)
    confidence_score: float = 1.0
    content_sha256: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @classmethod
    def create(
        cls,
        run_id: str = "run_default",
        connector: str = "system",
        operation: str = "default.op",
        summary: str = "",
        raw_payload: Optional[Dict[str, Any]] = None,
        observations: Optional[List[Dict[str, Any]]] = None,
        signals: Optional[List[Dict[str, Any]]] = None,
        step_id: Optional[str] = None,
        confidence: float = 1.0,
        **kwargs,
    ) -> "EvidenceBundle":
        payload = raw_payload or kwargs.get("raw_payload_json") or {}
        payload_bytes = json.dumps(payload, sort_keys=True, default=str).encode("utf-8")
        sha256 = hashlib.sha256(payload_bytes).hexdigest()
        source_name = kwargs.get("source_system") or connector
        ev_id = f"ev_{source_name.replace('-', '_')[:8]}_{uuid.uuid4().hex[:8]}"
        art_ref = f"artifact://{run_id}/{source_name}/{ev_id}"
        return cls(
            id=ev_id,
            run_id=run_id,
            step_id=step_id,
            source={"connector": source_name, "operation": operation},
            observations=observations or [],
            signals=signals or [],
            artifact_ref=art_ref,
            summary=summary or kwargs.get("normalized_summary", ""),
            raw_payload=payload,
            confidence_score=confidence,
            content_sha256=sha256,
        )

    @property
    def source_system(self) -> str:
        return self.source.get("connector", "system") if isinstance(self.source, dict) else str(self.source)

    @property
    def normalized_summary(self) -> str:
        return self.summary

    @property
    def query_params(self) -> Dict[str, Any]:
        return self.raw_payload.get("query_params", {})


# Backward compatibility alias
NormalizedEvidence = EvidenceBundle


class ActionProposalPayload(BaseModel):
    id: str
    connector_instance_id: str
    tool_environment: str
    operation: str
    target_resource: Dict[str, Any]
    payload: Dict[str, Any]
    diff_preview: Optional[str] = None
    risk_level: str = "MEDIUM_RISK"  # LOW_RISK, MEDIUM_RISK, HIGH_IMPACT
    required_role: str = "TRIAGE_ENGINEER"
    status: str = "PENDING_APPROVAL"  # PENDING_APPROVAL, APPROVED, REJECTED, EXECUTED
    canonical_hash: str
    expires_at: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @classmethod
    def create(
        cls,
        connector_id: str,
        tool_environment: str,
        operation: str,
        target_resource: Dict[str, Any],
        payload: Dict[str, Any],
        diff_preview: Optional[str] = None,
        risk: str = "MEDIUM_RISK",
        role: str = "TRIAGE_ENGINEER",
        **kwargs,
    ) -> "ActionProposalPayload":
        canonical_content = {
            "connector_id": connector_id,
            "tool_environment": tool_environment,
            "operation": operation,
            "target": target_resource,
            "payload": payload,
        }
        encoded = json.dumps(canonical_content, sort_keys=True, default=str).encode("utf-8")
        canonical_hash = hashlib.sha256(encoded).hexdigest()
        prop_id = f"act_{operation.replace('.', '_')[:8]}_{uuid.uuid4().hex[:8]}"
        return cls(
            id=prop_id,
            connector_instance_id=connector_id,
            tool_environment=tool_environment,
            operation=operation,
            target_resource=target_resource,
            payload=payload,
            diff_preview=diff_preview,
            risk_level=risk,
            required_role=role,
            status="PENDING_APPROVAL",
            canonical_hash=canonical_hash,
            expires_at=datetime.now(timezone.utc).isoformat(),
        )


class ExecutionResult(BaseModel):
    proposal_id: str
    status: str  # SUCCESS, FAILED
    external_ref: Optional[str] = None
    output_data: Dict[str, Any] = Field(default_factory=dict)
    error_message: Optional[str] = None


class ConnectorAdapter(abc.ABC):
    """Abstract base adapter for all PRISM connectors."""

    def __init__(self, instance_key: str, config: Optional[Dict[str, Any]] = None):
        self.instance_key = instance_key
        self.config = config or {}

    def describe_manifests(self) -> List[OperationManifest]:
        """Returns the list of typed operations supported by this connector."""
        # Default implementation if describe_capabilities was used
        if hasattr(self, "describe_capabilities"):
            caps = self.describe_capabilities()
            manifests = []
            for op in caps.supported_operations:
                manifests.append(OperationManifest(
                    operation_id=op,
                    display_name=op,
                    capability=op.split(".")[0],
                    tool_name=op.replace(".", "_"),
                    description=f"Operation {op}",
                    read_only=not caps.can_write_proposals,
                ))
            return manifests
        return []

    def describe_capabilities(self) -> ConnectorCapabilities:
        manifests = self.describe_manifests()
        return ConnectorCapabilities(
            can_read=any(m.read_only for m in manifests),
            can_write_proposals=any(not m.read_only for m in manifests),
            supported_operations=[m.operation_id for m in manifests],
        )

    @abc.abstractmethod
    async def health_check(self, environment: str) -> Dict[str, Any]:
        """Performs a health check probe against the connector instance."""
        pass

    async def invoke_read(
        self,
        operation: str,
        args: Dict[str, Any],
        environment: str,
        run_id: str = "run_default",
        step_id: Optional[str] = None,
        context: Optional[Any] = None,
        **kwargs,
    ) -> EvidenceBundle:
        """Executes a safe, read-only capability and normalizes output into an EvidenceBundle."""
        raise NotImplementedError

    async def propose_write(
        self,
        operation: str,
        args: Dict[str, Any],
        environment: str,
        delegated_identity: str = "",
        context: Optional[Any] = None,
        **kwargs,
    ) -> ActionProposalPayload:
        """Stages a state mutation into a cryptographically locked ActionProposalPayload."""
        raise NotImplementedError

    @abc.abstractmethod
    async def execute_approved(
        self,
        proposal: ActionProposalPayload,
        approval_id: str,
        delegated_identity: str,
    ) -> ExecutionResult:
        """Executes an approved proposal acting under the authenticated user's delegated identity."""
        pass
