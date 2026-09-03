"""
Base Connector Architecture for PRISM.
Defines normalized contracts for all external integration adapters (MCP, REST, DB, SDK).
Enforces separation of safe reads (Immediate Evidence) vs writes (Governed Action Proposals).
"""
import abc
import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ExecutionContext(BaseModel):
    user_id: str
    project_id: str
    project_environment: str
    tool_environment: str
    delegated_identity: str
    correlation_id: str
    effective_parameters: Dict[str, Any] = Field(default_factory=dict)


class ConnectorCapabilities(BaseModel):
    can_read: bool = True
    can_write_proposals: bool = False
    supported_operations: List[str] = Field(default_factory=list)
    supported_protocols: List[str] = Field(default_factory=list)
    auth_types: List[str] = Field(default_factory=list)
    is_global_capable: bool = False


class NormalizedEvidence(BaseModel):
    id: str
    source_system: str
    tool_environment: str
    operation: str
    query_params: Dict[str, Any]
    raw_payload: Dict[str, Any]
    normalized_summary: str
    confidence_score: float = 1.0
    content_sha256: str
    is_redacted: bool = False
    relevance_rating: str = "VERIFIED"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @classmethod
    def create(cls, source_system: str, tool_environment: str, operation: str,
               query_params: Dict[str, Any], raw_payload: Dict[str, Any],
               summary: str, confidence: float = 1.0) -> "NormalizedEvidence":
        payload_bytes = json.dumps(raw_payload, sort_keys=True, default=str).encode("utf-8")
        sha256 = hashlib.sha256(payload_bytes).hexdigest()
        import uuid
        ev_id = f"ev_{source_system[:4]}_{uuid.uuid4().hex[:8]}"
        return cls(
            id=ev_id,
            source_system=source_system,
            tool_environment=tool_environment,
            operation=operation,
            query_params=query_params,
            raw_payload=raw_payload,
            normalized_summary=summary,
            confidence_score=confidence,
            content_sha256=sha256
        )


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
    status: str = "PENDING_APPROVAL"
    canonical_hash: str
    expires_at: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @classmethod
    def create(cls, connector_id: str, tool_environment: str, operation: str,
               target_resource: Dict[str, Any], payload: Dict[str, Any],
               diff_preview: Optional[str] = None, risk: str = "MEDIUM_RISK",
               role: str = "TRIAGE_ENGINEER") -> "ActionProposalPayload":
        canonical_content = {
            "connector_id": connector_id,
            "tool_environment": tool_environment,
            "operation": operation,
            "target": target_resource,
            "payload": payload
        }
        encoded = json.dumps(canonical_content, sort_keys=True, default=str).encode("utf-8")
        canonical_hash = hashlib.sha256(encoded).hexdigest()
        import uuid
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
            canonical_hash=canonical_hash,
            expires_at=datetime.now(timezone.utc).isoformat()
        )


class ExecutionResult(BaseModel):
    proposal_id: str
    status: str  # SUCCESS, FAILED
    external_ref: Optional[str] = None
    output_data: Dict[str, Any] = Field(default_factory=dict)
    executed_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    error_message: Optional[str] = None


class ConnectorAdapter(abc.ABC):
    """
    Abstract contract that all connectors (MCP, REST API, Database, Python SDK) must implement.
    """
    def __init__(self, instance_key: str, config: Dict[str, Any]):
        self.instance_key = instance_key
        self.config = config

    @abc.abstractmethod
    def describe_capabilities(self) -> ConnectorCapabilities:
        """Return operations and metadata supported by this connector."""
        pass

    @abc.abstractmethod
    async def health_check(self, environment: str) -> Dict[str, Any]:
        """Validate live connectivity and report latency."""
        pass

    @abc.abstractmethod
    async def invoke_read(
        self,
        operation: str,
        args: Dict[str, Any],
        environment: str,
        context: ExecutionContext
    ) -> NormalizedEvidence:
        """Execute project-scoped read and return cryptographically hashed evidence."""
        pass

    @abc.abstractmethod
    async def propose_write(
        self,
        operation: str,
        args: Dict[str, Any],
        environment: str,
        context: ExecutionContext
    ) -> ActionProposalPayload:
        """Normalize write into an immutable Action Proposal without executing side effects."""
        pass

    @abc.abstractmethod
    async def execute_approved(
        self,
        proposal: ActionProposalPayload,
        approval_id: str,
        delegated_identity: str
    ) -> ExecutionResult:
        """Execute an already-approved proposal under the delegated user identity."""
        pass
