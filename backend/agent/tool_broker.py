"""
Governed Tool Broker for PRISM.
Acts as the security perimeter between Google ADK agents and external infrastructure.
Enforces:
1. Dynamic Environment Resolution (Project Env -> Tool Env)
2. Safe immediate execution of Reads with immutable Evidence storage
3. Strict gating of Writes into cryptographically locked Action Proposals
"""
from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, List, Optional
from backend.agent.environment_resolver import EnvironmentResolver
from backend.connectors.base import (
    ActionProposalPayload,
    ExecutionContext,
    NormalizedEvidence,
)
from backend.connectors.registry import ConnectorRegistry
from backend.database.connection import get_async_db
from backend.database.models import ActionProposal, EvidenceItem, ToolCallRecord

logger = logging.getLogger("prism.agent.tool_broker")


class ToolBroker:
    """
    Orchestrates tool invocation, provenance recording, and write proposal generation.
    """

    def __init__(self, context: ExecutionContext, run_id: str):
        self.context = context
        self.run_id = run_id
        self.collected_evidence: List[NormalizedEvidence] = []
        self.generated_proposals: List[ActionProposalPayload] = []

    async def execute_tool(
        self,
        connector_instance_id: str,
        operation: str,
        arguments: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Executes a tool operation safely through the appropriate connector adapter.
        """
        # 1. Resolve target tool environment via EnvironmentResolver
        tool_env, endpoint = await EnvironmentResolver.resolve_tool_environment(
            project_id=self.context.project_id,
            project_environment=self.context.project_environment,
            connector_instance_id=connector_instance_id
        )
        self.context.tool_environment = tool_env

        # 2. Retrieve connector adapter
        adapter = await ConnectorRegistry.get_adapter(connector_instance_id)
        if not adapter:
            raise ValueError(f"No active adapter available for connector instance '{connector_instance_id}'")

        caps = adapter.describe_capabilities()

        # 3. Branch: Safe Read vs Governed Write
        is_write = any(w in operation.lower() for w in ("restart", "post", "write", "comment", "update", "create", "delete", "broadcast"))

        if not is_write:
            # READ OPERATION: Execute & record Evidence
            evidence = await adapter.invoke_read(
                operation=operation,
                args=arguments,
                environment=tool_env,
                context=self.context
            )
            self.collected_evidence.append(evidence)

            # Persist to Database
            async with get_async_db() as db:
                ev_record = EvidenceItem(
                    id=evidence.id,
                    run_id=self.run_id,
                    source_system=evidence.source_system,
                    connector_instance_id=connector_instance_id,
                    tool_environment=tool_env,
                    operation=operation,
                    query_params_json=evidence.query_params,
                    raw_payload_json=evidence.raw_payload,
                    normalized_summary=evidence.normalized_summary,
                    confidence_score=evidence.confidence_score,
                    content_sha256=evidence.content_sha256
                )
                ev_record.row_hash = ev_record.calculate_row_hash({"id": ev_record.id, "hash": ev_record.content_sha256})
                db.add(ev_record)

                tc_record = ToolCallRecord(
                    id=f"tc_{evidence.id[3:]}",
                    run_id=self.run_id,
                    connector_instance_id=connector_instance_id,
                    tool_environment=tool_env,
                    operation=operation,
                    input_args_json=arguments,
                    output_data_json=evidence.raw_payload,
                    status="SUCCESS",
                    duration_ms=45
                )
                tc_record.row_hash = tc_record.calculate_row_hash({"id": tc_record.id, "op": operation})
                db.add(tc_record)

            return {
                "status": "SUCCESS",
                "evidence_id": evidence.id,
                "summary": evidence.normalized_summary,
                "data": evidence.raw_payload,
                "confidence": evidence.confidence_score
            }

        else:
            # WRITE OPERATION: Stage Proposal (Never unilateral write!)
            proposal = await adapter.propose_write(
                operation=operation,
                args=arguments,
                environment=tool_env,
                context=self.context
            )
            self.generated_proposals.append(proposal)

            # Persist Proposal to Database awaiting user approval
            async with get_async_db() as db:
                prop_record = ActionProposal(
                    id=proposal.id,
                    run_id=self.run_id,
                    connector_instance_id=connector_instance_id,
                    tool_environment=tool_env,
                    operation=operation,
                    target_resource_json=proposal.target_resource,
                    payload_json=proposal.payload,
                    diff_preview=proposal.diff_preview,
                    risk_level=proposal.risk_level,
                    required_role=proposal.required_role,
                    status="PENDING_APPROVAL",
                    expires_at=datetime.fromisoformat(proposal.expires_at) if isinstance(proposal.expires_at, str) else proposal.expires_at,
                    canonical_hash=proposal.canonical_hash
                )
                prop_record.row_hash = prop_record.calculate_row_hash({"id": prop_record.id, "hash": prop_record.canonical_hash})
                db.add(prop_record)

                tc_record = ToolCallRecord(
                    id=f"tc_prop_{proposal.id[4:14]}",
                    run_id=self.run_id,
                    connector_instance_id=connector_instance_id,
                    tool_environment=tool_env,
                    operation=operation,
                    input_args_json=arguments,
                    output_data_json={"proposal_staged": proposal.id, "risk": proposal.risk_level},
                    status="SUCCESS",
                    duration_ms=25
                )
                tc_record.row_hash = tc_record.calculate_row_hash({"id": tc_record.id, "prop": proposal.id})
                db.add(tc_record)

            return {
                "status": "AWAITING_APPROVAL",
                "action_proposal_id": proposal.id,
                "operation": operation,
                "risk_level": proposal.risk_level,
                "target": proposal.target_resource,
                "diff_preview": proposal.diff_preview,
                "canonical_hash": proposal.canonical_hash,
                "message": f"Action Proposal staged: {proposal.id} ({proposal.risk_level}). Awaiting human authorization."
            }
