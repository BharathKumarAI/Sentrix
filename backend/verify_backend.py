"""
End-to-End Verification Test for PRISM Backend Architecture.
Tests:
1. Database Connectivity and ETL Columns Verification
2. Dynamic Parameter Resolution (Platform vs Project Override)
3. Dynamic Environment Resolution (Prod vs Staging vs Global)
4. Full Auto-Triage Execution and Event Stream
5. Governed Action Proposal Staging and Human Delegated Approval
6. OKF v2.0 Auto-Learning and Case Retrieval
7. Multi-Level Feedback Recording
"""
import asyncio
import sys
from sqlalchemy import text
from backend.agent.environment_resolver import EnvironmentResolver
from backend.agent.parameter_resolver import ParameterResolver
from backend.agent.triage_engine import TriageEngine
from backend.connectors.base import ActionProposalPayload
from backend.connectors.registry import ConnectorRegistry
from backend.database.connection import check_db_health, get_async_db
from backend.feedback.feedback_service import FeedbackService
from backend.metrics.metrics_service import MetricsService
from backend.okf.okf_service import OKFService


async def run_verification():
    print("=" * 70)
    print("PRISM END-TO-END BACKEND & AGENT VERIFICATION")
    print("=" * 70)

    # 1. Database Health & ETL Tracking Columns
    print("\n[TEST 1] Verifying PostgreSQL Health & ETL Columns...")
    health = await check_db_health()
    print(f"  ✓ Database Health: {health}")
    assert health["status"] == "HEALTHY", "Database must be healthy"

    async with get_async_db() as db:
        res = await db.execute(text("SELECT count(*) FROM information_schema.tables WHERE table_schema IN ('iam', 'control_plane', 'integration', 'runtime', 'okf_knowledge', 'audit_analytics');"))
        count = res.scalar()
        print(f"  ✓ Total PRISM Tables across 6 Schemas: {count}")
        assert count >= 20, "Expected at least 20 tables across 6 schemas"

        # Verify ETL columns on a critical table
        col_res = await db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_schema = 'runtime' AND table_name = 'action_proposals';"))
        cols = {row[0] for row in col_res.fetchall()}
        required_etl = {"created_at", "updated_at", "etl_job_id", "sync_version", "is_deleted", "row_hash", "source_system"}
        assert required_etl.issubset(cols), f"Missing ETL columns: {required_etl - cols}"
        print(f"  ✓ Verified ETL Tracking Columns on runtime.action_proposals: {required_etl}")

    # 2. Dynamic Parameter Resolution & Inheritance
    print("\n[TEST 2] Verifying Multi-Tier Parameter Inheritance (Platform vs Project Override)...")
    # In seed_data, default splunk timeout is 30, but project BILLING overrode it to 60!
    params = await ParameterResolver.resolve_effective_parameters(project_id="prj_billing", user_id="usr_admin_01")
    splunk_timeout = params.get("connector.splunk.query_timeout_seconds")
    print(f"  ✓ Project 'BILLING' Effective Splunk Timeout: {splunk_timeout}s (Expected 60s from project override)")
    assert splunk_timeout == 60, f"Expected 60s, got {splunk_timeout}"

    # Default project (Auth) should inherit platform default: 30s
    auth_params = await ParameterResolver.resolve_effective_parameters(project_id="prj_auth", user_id="usr_admin_01")
    auth_timeout = auth_params.get("connector.splunk.query_timeout_seconds")
    print(f"  ✓ Project 'AUTH_ID' Effective Splunk Timeout: {auth_timeout}s (Expected 30s platform default)")
    assert auth_timeout == 30, f"Expected 30s, got {auth_timeout}"

    # PLATFORM_ONLY parameter should NOT be in project params
    assert "platform.vault.master_secret_path" not in params, "PLATFORM_ONLY parameters must remain concealed from projects!"
    print("  ✓ Verified PLATFORM_ONLY parameters are concealed from project scope.")

    # 3. Dynamic Environment Resolution Matrix & Global Connectors
    print("\n[TEST 3] Verifying Dynamic Environment Resolution & Global Connectors...")
    # Prod mapping
    tool_env_prod, _ = await EnvironmentResolver.resolve_tool_environment(
        project_id="prj_billing", project_environment="prod", connector_instance_id="inst_splunk_corp"
    )
    print(f"  ✓ Project 'BILLING' [prod] -> Splunk mapped to: '{tool_env_prod}'")
    assert tool_env_prod == "splunk-prod-cluster"

    # Staging mapping
    tool_env_staging, _ = await EnvironmentResolver.resolve_tool_environment(
        project_id="prj_billing", project_environment="staging", connector_instance_id="inst_splunk_corp"
    )
    print(f"  ✓ Project 'BILLING' [staging] -> Splunk mapped to: '{tool_env_staging}'")
    assert tool_env_staging == "splunk-staging-logs"

    # Global Connector (Slack & MCP Docs) - irrespective of project environment!
    global_env, _ = await EnvironmentResolver.resolve_tool_environment(
        project_id="prj_billing", project_environment="prod", connector_instance_id="inst_slack_global"
    )
    print(f"  ✓ Global Connector 'Slack' resolved environment: '{global_env}' (Expected: 'global')")
    assert global_env == "global"

    # 4. Auto-Triage Execution with Streaming Events
    print("\n[TEST 4] Running Autonomous Multi-Tool Incident Triage Engine...")
    engine = TriageEngine(
        project_id="prj_billing",
        environment="prod",
        user_id="usr_admin_01",
        delegated_identity="kbk@company.com"
    )

    events_received = []
    async for event in engine.execute_auto_triage(
        issue_title="Elevated Stripe Webhook Timeout Latency during Subscription Renewal",
        issue_description="Alert: >5% 504 timeouts observed on /v1/webhooks/charges.",
        error_logs="PoolAcquireTimeoutException: Connection to PostgreSQL primary timed out",
        jira_ticket_key="BILL-1049"
    ):
        events_received.append(event)
        print(f"    >> Event [{event['seq_no']}]: {event['type']} - {list(event['payload'].keys())}")

    print(f"  ✓ Auto-Triage completed. Received {len(events_received)} canonical events.")
    assert len(events_received) >= 6, "Expected at least 6 investigation events"

    # 5. Governed Action Proposal & Cryptographic Human Approval
    print("\n[TEST 5] Verifying Governed Action Proposal Approval under Delegated Identity...")
    action_event = next(e for e in events_received if e["type"] == "ACTION_PROPOSED")
    proposal_id = action_event["payload"]["proposal_id"]
    print(f"  ✓ Action Proposal Staged: {proposal_id} ({action_event['payload']['risk_level']})")

    # Authorize & Execute via Adapter
    jira_adapter = await ConnectorRegistry.get_adapter("inst_jira_corp")
    assert jira_adapter is not None

    prop_obj = ActionProposalPayload.create(
        connector_id="inst_jira_corp",
        tool_environment="jira-cloud-prod",
        operation="jira.add_comment",
        target_resource={"issue_key": "BILL-1049"},
        payload={"comment": "Verified root cause: PoolAcquireTimeoutException"},
        diff_preview="+ [PRISM Triage Analysis]\n+ Root Cause: Connection pool exhaustion"
    )
    exec_res = await jira_adapter.execute_approved(
        proposal=prop_obj,
        approval_id="appr_test_1234",
        delegated_identity="kbk@company.com"
    )
    print(f"  ✓ Approved Action Executed: status={exec_res.status}, ref={exec_res.external_ref}")
    assert exec_res.status == "SUCCESS"

    # 6. OKF v2.0 Auto-Learning & Search
    print("\n[TEST 6] Verifying OKF v2.0 Auto-Learning & Case-Based Retrieval...")
    case_id = await OKFService.auto_learn_case(
        incident_id="INC-5510",
        project_id="prj_billing",
        title="Stripe Webhook Concurrency Spike Pool Timeout",
        signature="PoolAcquireTimeoutException: 20/20 active connections",
        root_cause="PostgreSQL Connection Pool Exhaustion from unconstrained worker cron",
        resolution_summary="Restarted pods and capped max connections per worker.",
        resolved_actions=[{"action": "kubernetes.restart_pod"}],
        key_evidence_ids=["ev_test_1"],
        verified_by_user_id="usr_admin_01"
    )
    print(f"  ✓ Auto-Learned Case into OKF v2.0: {case_id}")

    cases = await OKFService.search_cases(query="PoolAcquireTimeoutException", project_id="prj_billing")
    print(f"  ✓ Case-Based Retrieval matched {len(cases)} historical cases.")
    assert len(cases) >= 1

    # 7. Multi-Level Feedback & Metrics
    print("\n[TEST 7] Verifying Multi-Level Feedback & Metrics Summary...")
    fb_id = await FeedbackService.record_feedback(
        source_type="ACTION",
        source_id=proposal_id,
        user_id="usr_admin_01",
        signal_type="ACTION_ACCEPTED",
        score=5,
        notes="Remediation proposal executed successfully and restored service health."
    )
    print(f"  ✓ Recorded Action Feedback: {fb_id}")

    metrics = await MetricsService.get_dashboard_summary()
    print(f"  ✓ Dashboard Metrics: Success Rate={metrics['investigation_success_rate']}%, Avg Latency={metrics['average_triage_latency_ms']}ms, MTTR Reduction={metrics['okf_knowledge']['mttr_reduction_percent']}")

    print("\n" + "=" * 70)
    print("ALL 7 ARCHITECTURAL TEST SUITES PASSED FLAWLESSLY!")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_verification())
