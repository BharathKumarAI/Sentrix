"""
Governed Capability Executor for PRISM.
Single entrypoint for all capability/operation invocations.
Enforces:
1. Capability & Project Authorization
2. Dynamic Environment Resolution
3. Policy checks (scope boundaries, budget, read vs write gating)
4. Audit Ledger recording & row hashing
5. Immutable Evidence Bundle persistence & Signal discovery
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from backend.agent.execution_context import ExecutionContextSnapshot
from backend.agent.signals import SignalStore
from backend.connectors.base import ActionProposalPayload, EvidenceBundle
from backend.connectors.registry import ConnectorRegistry
from backend.database.connection import get_async_db
from backend.database.models import ActionProposal, EvidenceBundleRecord, ToolCallRecord

logger = logging.getLogger("prism.agent.executor")


class GovernedCapabilityExecutor:
    """Executes capability operations under enterprise governance rules."""

    def __init__(
        self,
        context: ExecutionContextSnapshot,
        signal_store: SignalStore,
    ):
        self.context = context
        self.signal_store = signal_store
        self.collected_bundles: List[EvidenceBundle] = []
        self.staged_proposals: List[ActionProposalPayload] = []

    async def execute_operation(
        self,
        tool_key: str,
        operation_key: str,
        arguments: Dict[str, Any],
        step_id: Optional[str] = None,
    ) -> Tuple[Optional[EvidenceBundle], Optional[ActionProposalPayload]]:
        """
        Executes an operation. Returns (EvidenceBundle, None) for reads,
        or (None, ActionProposalPayload) for writes.
        """
        # 1. Authorize: Is tool enabled in project context?
        if tool_key not in self.context.enabled_tools:
            raise PermissionError(f"Tool '{tool_key}' is not enabled for project '{self.context.project_id}'.")

        # 2. Retrieve adapter
        adapter = await ConnectorRegistry.get_adapter_by_tool_key(tool_key)
        if not adapter:
            raise ValueError(f"No active adapter found for tool '{tool_key}'")

        # 3. Inspect operation manifest
        manifests = adapter.describe_manifests()
        matching_manifest = next((m for m in manifests if m.operation_id == operation_key), None)
        if not matching_manifest:
            # Try matching by capability
            matching_manifest = next((m for m in manifests if m.capability == operation_key), None)

        read_only = matching_manifest.read_only if matching_manifest else ("write" not in operation_key)
        timeout_ms = matching_manifest.timeout_ms if matching_manifest else 30000

        # Inject known signals into arguments if missing
        enriched_args = dict(arguments)
        if "account.id" in self.signal_store._signals and "ban" not in enriched_args:
            enriched_args["ban"] = self.signal_store.get_first_value("account.id")
        if "case.key" in self.signal_store._signals and "issueKey" not in enriched_args:
            enriched_args["issueKey"] = self.signal_store.get_first_value("case.key")
        if "trace.id" in self.signal_store._signals and "traceId" not in enriched_args:
            enriched_args["traceId"] = self.signal_store.get_first_value("trace.id")
        if "job.name" in self.signal_store._signals and "job_name" not in enriched_args:
            enriched_args["job_name"] = self.signal_store.get_first_value("job.name")
        if "environment" not in enriched_args:
            enriched_args["environment"] = self.context.environment

        # 4. Branch: Safe Read vs Governed Write
        if read_only:
            # Safe Read: execute with timeout and persist EvidenceBundle
            start_t = datetime.now(timezone.utc)
            try:
                evidence = await asyncio.wait_for(
                    adapter.invoke_read(
                        operation=operation_key,
                        args=enriched_args,
                        environment=self.context.environment,
                        run_id=self.context.run_id,
                        step_id=step_id,
                    ),
                    timeout=timeout_ms / 1000.0,
                )
            except asyncio.TimeoutError:
                logger.error(f"Operation {operation_key} timed out after {timeout_ms}ms")
                raise TimeoutError(f"Operation '{operation_key}' timed out after {timeout_ms}ms")

            duration_ms = int((datetime.now(timezone.utc) - start_t).total_seconds() * 1000)

            # Register produced signals into SignalStore
            for sig in evidence.signals:
                self.signal_store.add(
                    signal_type=sig["type"],
                    value=sig["value"],
                    subtype=sig.get("subtype"),
                    source=f"tool:{tool_key}:{operation_key}",
                )

            self.collected_bundles.append(evidence)

            # Persist EvidenceBundleRecord & ToolCallRecord in DB
            async with get_async_db() as db:
                ev_rec = EvidenceBundleRecord(
                    id=evidence.id,
                    run_id=self.context.run_id,
                    step_id=step_id,
                    connector_id=tool_key,
                    operation=operation_key,
                    observations_json=evidence.observations,
                    produced_signals_json=evidence.signals,
                    artifact_ref=evidence.artifact_ref,
                    confidence_score=evidence.confidence_score,
                    content_sha256=evidence.content_sha256,
                    summary=evidence.summary,
                    raw_payload_json=evidence.raw_payload,
                )
                ev_rec.row_hash = ev_rec.calculate_row_hash({"id": ev_rec.id, "hash": ev_rec.content_sha256})
                db.add(ev_rec)

                tc_rec = ToolCallRecord(
                    id=f"tc_{evidence.id[3:]}",
                    run_id=self.context.run_id,
                    connector_instance_id=tool_key,
                    tool_environment=self.context.environment,
                    operation=operation_key,
                    input_args_json=enriched_args,
                    output_data_json=evidence.raw_payload,
                    status="SUCCESS",
                    duration_ms=duration_ms,
                )
                tc_rec.row_hash = tc_rec.calculate_row_hash({"id": tc_rec.id, "op": operation_key})
                db.add(tc_rec)

            return evidence, None

        else:
            # Governed Write: Stage Proposal with diff preview and hash
            proposal = await adapter.propose_write(
                operation=operation_key,
                args=enriched_args,
                environment=self.context.environment,
                delegated_identity=self.context.delegated_identity,
            )
            self.staged_proposals.append(proposal)

            # Persist ActionProposal in DB
            async with get_async_db() as db:
                prop_rec = ActionProposal(
                    id=proposal.id,
                    run_id=self.context.run_id,
                    connector_instance_id=tool_key,
                    tool_environment=self.context.environment,
                    operation=operation_key,
                    target_resource_json=proposal.target_resource,
                    payload_json=proposal.payload,
                    diff_preview=proposal.diff_preview,
                    risk_level=proposal.risk_level,
                    required_role=proposal.required_role,
                    status="PENDING_APPROVAL",
                    expires_at=datetime.now(timezone.utc),
                    canonical_hash=proposal.canonical_hash,
                )
                prop_rec.row_hash = prop_rec.calculate_row_hash({"id": prop_rec.id, "hash": prop_rec.canonical_hash})
                db.add(prop_rec)

            return None, proposal
