"""
Enterprise Investigation Platform Accelerator Engine for PRISM.
Metadata-driven execution:
User Request -> Context Resolver -> Signal Extraction -> Skill Compilation ->
Deterministic Scheduler -> Governed Capability Executor -> Evidence Bundles & Coverage ->
Model Synthesis -> Approval-gated Write Actions.
"""
import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, List, Optional
from sqlalchemy import select
from backend.agent.execution_context import ContextResolver, ExecutionContextSnapshot
from backend.agent.governed_executor import GovernedCapabilityExecutor
from backend.agent.model_router import ModelRouter
from backend.agent.request_classifier import RequestClassifier
from backend.agent.scheduler import DeterministicScheduler
from backend.agent.signals import SignalExtractor, SignalStore, SignalType
from backend.agent.skills_engine import SkillsEngine
from backend.database.connection import get_async_db
from backend.database.models import (
    Conversation,
    OkfTriagedCase,
    Run,
    RunEvent,
    RunMetric,
    RunSnapshot,
    ModelInvocationLedgerRecord,
)

logger = logging.getLogger("sentrix.agent.triage_engine")


class TriageEngine:
    """
    Metadata-driven autonomous investigation coordinator.
    Replaces hardcoded triage logic with signal-driven scheduling and governed capability execution.
    """

    def __init__(
        self,
        project_id: str,
        environment: str,
        user_id: str,
        delegated_identity: str,
        conversation_id: Optional[str] = None,
        run_id: Optional[str] = None,
        event_sink=None,
    ):
        self.event_sink = event_sink
        self.project_id = project_id
        self.environment = environment
        self.user_id = user_id
        self.delegated_identity = delegated_identity
        self.conversation_id = conversation_id or f"conv_{uuid.uuid4().hex[:12]}"
        self.run_id = run_id or f"run_{uuid.uuid4().hex[:12]}"

    async def execute_auto_triage(
        self,
        issue_title: str,
        issue_description: Optional[str] = None,
        error_logs: Optional[str] = None,
        jira_ticket_key: Optional[str] = None,
        execution_mode: str = "rapid",
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Runs the full metadata-driven investigation lifecycle, streaming typed SSE events.
        """
        start_time = datetime.now(timezone.utc)
        seq_no = 1

        async def emit(event_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
            nonlocal seq_no
            evt = {
                "event_id": f"evt_{seq_no}_{uuid.uuid4().hex[:6]}",
                "run_id": self.run_id,
                "seq_no": seq_no,
                "type": event_type,
                "occurred_at": datetime.now(timezone.utc).isoformat(),
                "payload": payload,
            }
            seq_no += 1

            # Persist event to DB
            try:
                async with get_async_db() as db:
                    re = RunEvent(
                        id=evt["event_id"],
                        run_id=self.run_id,
                        seq_no=evt["seq_no"],
                        event_type=event_type,
                        payload_json=payload,
                    )
                    re.row_hash = re.calculate_row_hash({"id": re.id, "type": event_type})
                    db.add(re)
            except Exception as e:
                logger.warning(f"Could not persist run event: {e}")

            if self.event_sink:
                await self.event_sink(evt)
            return evt

        # 1. Initialize Conversation & Run in Database
        async with get_async_db() as db:
            conv_query = select(Conversation).where(Conversation.id == self.conversation_id)
            conv_res = await db.execute(conv_query)
            conv = conv_res.scalars().first()
            if not conv:
                conv = Conversation(
                    id=self.conversation_id,
                    project_id=self.project_id,
                    environment=self.environment,
                    user_id=self.user_id,
                    title=issue_title[:250],
                    status="ACTIVE",
                    summary=issue_description[:500] if issue_description else issue_title,
                )
                conv.row_hash = conv.calculate_row_hash({"id": conv.id, "title": conv.title})
                db.add(conv)
                await db.flush()

            run_record = Run(
                id=self.run_id,
                conversation_id=self.conversation_id,
                project_id=self.project_id,
                environment=self.environment,
                profile_id="metadata_accelerator",
                status="RUNNING",
                model_route="unresolved",
                started_at=start_time,
            )
            run_record.row_hash = run_record.calculate_row_hash({"id": run_record.id, "status": "RUNNING"})
            db.add(run_record)

        yield await emit("RUN_STARTED", {
            "status": "RUNNING",
            "run_id": self.run_id,
            "project_id": self.project_id,
            "environment": self.environment,
            "issue_title": issue_title,
        })

        # 2. 4-Dimensional Request Classification (Intent, Scope, Mode, Risk)
        raw_combined_prompt = f"{issue_title} {issue_description or ''} {error_logs or ''} {jira_ticket_key or ''}".strip()
        envelope = RequestClassifier.classify(
            prompt=raw_combined_prompt,
            project_id=self.project_id,
            environment=self.environment,
            user_id=self.user_id,
            conversation_id=self.conversation_id,
        )
        yield await emit("REQUEST_CLASSIFIED", envelope.to_dict())

        # 3. Context Resolver (Platform -> Project -> Profile -> Request)
        context = await ContextResolver.resolve(
            run_id=self.run_id,
            project_id=self.project_id,
            environment=self.environment,
            user_id=self.user_id,
            delegated_identity=self.delegated_identity,
            execution_mode=execution_mode,
        )

        # Snapshot resolution
        async with get_async_db() as db:
            snap = RunSnapshot(
                id=f"snap_{self.run_id[4:]}",
                run_id=self.run_id,
                resolved_skills_json=context.active_skills,
                resolved_connectors_json=context.enabled_tools,
                resolved_parameters_json=context.effective_parameters,
                effective_env_mappings_json={"environment": self.environment},
                sha256_hash=context.snapshot_hash,
            )
            snap.row_hash = snap.calculate_row_hash({"id": snap.id, "hash": snap.sha256_hash})
            db.add(snap)

        yield await emit("CONTEXT_RESOLVED", {
            "project_id": context.project_id,
            "environment": context.environment,
            "platform_name": "Sentrix Autonomous SRE",
            "active_tools_count": len(context.enabled_tools),
            "enabled_tools": context.enabled_tools,
            "active_skills": context.active_skills,
            "snapshot_hash": context.snapshot_hash,
            "delegated_identity": self.delegated_identity,
            "rbac_tier": None,
        })

        # 4. Canonical Signal Extraction
        initial_signals = SignalExtractor.extract_from_text(raw_combined_prompt)

        signal_store = SignalStore()
        for s in initial_signals:
            signal_store.add_signal(s)

        # Ingest entities from envelope as canonical signals
        for ent in envelope.entities:
            if ent.type == "account.id":
                signal_store.add(SignalType.ACCOUNT_ID, ent.value, source="envelope")
            elif ent.type == "order.id":
                signal_store.add(SignalType.ORDER_ID, ent.value, source="envelope")
            elif ent.type == "ticket.key":
                signal_store.add(SignalType.CASE_KEY, ent.value, source="envelope")

        # Ensure environment signal is present
        signal_store.add(SignalType.ENVIRONMENT_NAME, envelope.scope.environment, source="context")
        if jira_ticket_key:
            signal_store.add(SignalType.CASE_KEY, jira_ticket_key, source="argument")

        yield await emit("SIGNALS_EXTRACTED", {
            "signals": [s.to_dict() for s in signal_store.all_signals()],
            "summary": signal_store.to_dict_summary(),
        })

        # 5. Layered Domain Skill Compilation (L0-L3 Composition)
        skill = await SkillsEngine.select_best_skill(
            intent_type=envelope.intent.type.value,
            user_prompt=envelope.raw_prompt,
            project_id=self.project_id,
            user_id=self.user_id,
        )
        yield await emit("SKILL_SELECTED", {
            "skill": skill.name,
            "skill_key": skill.skill_key,
            "version": skill.version,
            "scope": skill.scope,
            "tag_badge": skill.tag_badge,
            "tagged_project_id": skill.tagged_project_id,
            "tagged_project_key": skill.tagged_project_key,
            "tagged_user_id": skill.tagged_user_id,
            "composed_skills": skill.composed_skills,
            "required_capabilities": skill.required_capabilities,
            "optional_capabilities": skill.optional_capabilities,
            "workflow_steps": skill.workflow_steps,
        })

        # 5. Initialize Governed Capability Executor & Deterministic Scheduler
        executor = GovernedCapabilityExecutor(context=context, signal_store=signal_store)
        scheduler = DeterministicScheduler(
            context=context,
            signal_store=signal_store,
            executor=executor,
            event_emitter=emit,
        )

        yield await emit("PLANNING_STARTED", {
            "objective": f"Determine root cause and evidence-backed resolution for '{issue_title}'",
            "active_skill": skill.name,
        })

        # 6. Execute Multi-Wave Deterministic Evidence Plan
        evidence_bundles = await scheduler.execute_plan(
            objective=f"Resolve incident: {issue_title}",
        )

        # 7. Model Synthesis (Finding, Root Cause, Routing, Actions)
        yield await emit("REASONING_STEP", {
            "step": "SYNTHESIS",
            "message": "Correlating multi-source evidence bundles across Jira, Database, Logs, and Runbooks...",
        })

        finding = await ModelRouter.synthesize(
            skill=skill,
            evidence_bundles=evidence_bundles,
            signals=signal_store,
            coverage=scheduler.coverage,
            run_id=self.run_id,
            user_input=raw_combined_prompt,
        )

        yield await emit("FINDING_SYNTHESIZED", {
            "finding": finding.finding,
            "primary_evidence": finding.primary_evidence,
            "root_cause": finding.root_cause,
            "confidence": finding.confidence,
            "confidence_label": finding.confidence_label,
            "routing": finding.routing,
            "recommended_actions": finding.recommended_actions,
            "missing_evidence": finding.missing_evidence,
        })

        # 8. Governed Action Proposal (Approval Gated Write Action)
        # Stage proposal to post investigation report to Jira ticket
        ticket_key = signal_store.get_first_value(SignalType.CASE_KEY, "FE-12345")
        comment_text = (
            f"Sentrix Autonomous Investigation Report:\n"
            f"- Finding: {finding.finding}\n"
            f"- Root Cause: {finding.root_cause}\n"
            f"- Confidence: {finding.confidence_label} ({int(finding.confidence * 100)}%)\n"
            f"- Primary Evidence:\n" + "\n".join(f"  * {e}" for e in finding.primary_evidence) + "\n"
            f"- Recommended Routing: {finding.routing}\n"
            f"- Action: {finding.recommended_actions[0] if finding.recommended_actions else 'Review configuration'}"
        )

        _, proposal = await executor.execute_operation(
            tool_key="jira",
            operation_key="ticket.comment.write",
            arguments={"issueKey": ticket_key, "body": comment_text},
            step_id="step_final_comment_proposal",
        )

        if proposal:
            yield await emit("ACTION_PROPOSED", {
                "proposal_id": proposal.id,
                "operation": proposal.operation,
                "risk_level": proposal.risk_level,
                "target": proposal.target_resource,
                "diff_preview": proposal.diff_preview,
                "canonical_hash": proposal.canonical_hash,
                "acting_principal": self.delegated_identity,
                "message": f"Action requires user approval: Post investigation report to Jira ticket {ticket_key}.",
            })

        # 9. Complete Run & Persist Metrics
        duration_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)

        async with get_async_db() as db:
            run_upd = select(Run).where(Run.id == self.run_id)
            r_res = await db.execute(run_upd)
            active_run = r_res.scalars().first()
            if active_run:
                active_run.status = "AWAITING_APPROVAL" if executor.staged_proposals else "COMPLETED"
                active_run.completed_at = datetime.now(timezone.utc)
                active_run.latency_ms = duration_ms
                invocations = (await db.execute(select(ModelInvocationLedgerRecord).where(
                    ModelInvocationLedgerRecord.run_id == self.run_id))).scalars().all()
                prompt_tokens = sum(i.prompt_tokens or 0 for i in invocations)
                completion_tokens = sum(i.completion_tokens or 0 for i in invocations)
                active_run.total_tokens = prompt_tokens + completion_tokens
                active_run.model_route = invocations[-1].resolved_model if invocations else "unresolved"

            metric = RunMetric(
                id=f"met_{self.run_id[4:]}",
                run_id=self.run_id,
                project_id=self.project_id,
                environment=self.environment,
                time_to_first_token_ms=0,
                total_duration_ms=duration_ms,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                tool_invocations_count=len(scheduler.executed_steps),
                action_proposals_count=len(executor.staged_proposals),
                status="SUCCESS",
            )
            metric.row_hash = metric.calculate_row_hash({"id": metric.id, "run_id": self.run_id})
            db.add(metric)

        # Log skill execution & validation metrics into MLflow
        try:
            from backend.observability.mlflow_tracker import MLflowTracker
            MLflowTracker.track_skill_execution(
                skill_key=skill.skill_key,
                skill_name=skill.name,
                parameters={"environment": self.environment, "project_id": self.project_id},
                latency_ms=float(duration_ms),
                status="SUCCESS",
                evidence_count=len(evidence_bundles),
                coverage_score=finding.confidence,
                run_id=self.run_id
            )
        except Exception as mlf_err:
            logger.debug(f"MLflow auto-tracking skipped: {mlf_err}")

        # Save project-scoped ADK artifacts to storage/projects/<project_id>/artifacts/<run_id>/
        try:
            from backend.azure.project_storage import project_storage
            rca_md = f"""# Autonomous RCA Report: {issue_title}
**Run ID:** `{self.run_id}`  
**Project:** `{self.project_id}`  
**Environment:** `{self.environment}`  
**Engine:** Google ADK Autonomous Graph Engine  
**Confidence:** {finding.confidence_label} ({int(finding.confidence * 100)}%)  

## Executive Finding
{finding.finding}

## Root Cause Analysis
{finding.root_cause}

## Primary Evidence
""" + "\n".join(f"- {e}" for e in finding.primary_evidence) + f"""

## Recommended Remediations
""" + "\n".join(f"- {a}" for a in finding.recommended_actions) + f"""

## Governed Action Proposals
- Proposals Staged: {len(executor.staged_proposals)}
- Ticket Reference: `{ticket_key}`
"""

            staged_props_data = [
                {
                    "id": p.id,
                    "operation": p.operation,
                    "target": p.target_resource,
                    "risk_level": p.risk_level,
                    "hash": p.canonical_hash
                }
                for p in executor.staged_proposals
            ]

            eval_metrics_data = {
                "confidence": finding.confidence,
                "confidence_label": finding.confidence_label,
                "duration_ms": duration_ms,
                "tools_executed": len(scheduler.executed_steps),
                "proposals_count": len(executor.staged_proposals),
                "status": "AWAITING_APPROVAL" if executor.staged_proposals else "COMPLETED"
            }

            trace_data = {
                "run_id": self.run_id,
                "engine": "Google ADK Graph",
                "steps": [
                    {"step_id": s.step_id, "tool": s.tool_key, "operation": s.operation_key, "status": s.status}
                    for s in scheduler.executed_steps
                ],
                "duration_ms": duration_ms
            }

            await project_storage.save_project_adk_artifacts(
                project_id=self.project_id,
                run_id=self.run_id,
                rca_report=rca_md,
                execution_trace=trace_data,
                action_proposals=staged_props_data,
                eval_metrics=eval_metrics_data,
                evidence_bundle={"evidence_count": len(evidence_bundles)}
            )
        except Exception as p_err:
            logger.warning(f"Could not persist project-scoped ADK artifacts: {p_err}")



        yield await emit("RUN_COMPLETED", {
            "status": "AWAITING_APPROVAL" if executor.staged_proposals else "COMPLETED",
            "run_id": self.run_id,
            "root_cause": finding.root_cause,
            "confidence_score": finding.confidence,
            "evidence_count": len(evidence_bundles),
            "proposals_count": len(executor.staged_proposals),
            "duration_ms": duration_ms,
            "coverage_complete": all(c.status == "complete" for c in scheduler.coverage if c.area in ["ticket", "database", "logs"]),
        })
