"""
Database Seeder for PRISM.
Populates realistic projects, dynamic environments, admin-enabled connectors,
hierarchical parameter definitions & overrides, setup instructions, display configurations,
and OKF v2.0 knowledge items.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import text
from backend.database.connection import get_sync_db
from backend.database.models import (
    User,
    Project,
    ProjectEnvironment,
    ProjectSetupInstruction,
    ProjectDisplayConfig,
    ParameterDefinition,
    ParameterValue,
    ConnectorCatalog,
    ConnectorInstance,
    ConnectorEnvironment,
    ProjectConnectorBinding,
    ProjectToolEnvMapping,
    ConnectorHealth,
    OkfTriagedCase,
    OkfKnowledgeNode,
    OkfEntity
)


def seed_database():
    with get_sync_db() as db:
        print("[PRISM SEED] Starting comprehensive database seeding...")

        # ----------------------------------------------------------------
        # 1. IAM Users
        # ----------------------------------------------------------------
        admin_user = User(
            id="usr_admin_01",
            email="kbk@company.com",
            full_name="K. B. Kumar",
            role="ADMIN",
            department="Platform Core Architecture",
            preferences_json={"theme": "midnight_prism", "compact_mode": False}
        )
        admin_user.row_hash = admin_user.calculate_row_hash({"id": admin_user.id, "email": admin_user.email})

        triage_user = User(
            id="usr_triage_02",
            email="sarah.chen@company.com",
            full_name="Sarah Chen",
            role="TRIAGE_ENGINEER",
            department="Production Reliability Engineering",
            preferences_json={"auto_expand_logs": True, "syntax_highlight": True}
        )
        triage_user.row_hash = triage_user.calculate_row_hash({"id": triage_user.id, "email": triage_user.email})

        db.merge(admin_user)
        db.merge(triage_user)
        db.flush()
        print("  ✓ Seeded IAM Users (Admin: kbk@company.com)")

        # ----------------------------------------------------------------
        # 2. Control Plane: Projects
        # ----------------------------------------------------------------
        p_billing = Project(
            id="prj_billing",
            project_key="BILLING",
            name="Global Billing & Payment Gateway",
            description="Mission-critical transaction processor handling Stripe/Adyen settlement and recurring subscriptions.",
            owner_id=admin_user.id,
            status="ACTIVE",
            is_followed=True,
            default_environment="prod",
            tags=["finance", "tier-0", "pci-dss"]
        )
        p_billing.row_hash = p_billing.calculate_row_hash({"id": p_billing.id, "key": p_billing.project_key})

        p_auth = Project(
            id="prj_auth",
            project_key="AUTH_ID",
            name="Identity & Zero-Trust Access Service",
            description="Entra OIDC identity broker, mTLS certificate distribution, and session vault.",
            owner_id=triage_user.id,
            status="ACTIVE",
            is_followed=True,
            default_environment="staging",
            tags=["security", "tier-0", "identity"]
        )
        p_auth.row_hash = p_auth.calculate_row_hash({"id": p_auth.id, "key": p_auth.project_key})

        p_inventory = Project(
            id="prj_inventory",
            project_key="FULFILL",
            name="Realtime Fulfillment & Inventory Engine",
            description="High-throughput inventory allocation, warehouse routing, and supply chain ledger.",
            owner_id=admin_user.id,
            status="ACTIVE",
            is_followed=False,
            default_environment="dev",
            tags=["logistics", "tier-1"]
        )
        p_inventory.row_hash = p_inventory.calculate_row_hash({"id": p_inventory.id, "key": p_inventory.project_key})

        db.merge(p_billing)
        db.merge(p_auth)
        db.merge(p_inventory)
        db.flush()
        print("  ✓ Seeded Projects (Billing, Auth, Fulfillment)")

        # ----------------------------------------------------------------
        # 3. Dynamic Project Environments (Code=Template, DB=Data)
        # ----------------------------------------------------------------
        billing_envs = [
            ("dev", True, "Local feature testing & integration"),
            ("qa-hotfix", False, "Isolated test bed for hotfix validations"),
            ("staging", False, "Pre-production mirror of transaction processing"),
            ("prod", True, "Production worldwide cluster"),
            ("dr-standby", False, "Disaster recovery failover region")
        ]
        for env_name, is_def, desc in billing_envs:
            e = ProjectEnvironment(
                id=f"env_bill_{env_name}",
                project_id=p_billing.id,
                environment_name=env_name,
                is_default=(env_name == "prod"),
                description=desc
            )
            e.row_hash = e.calculate_row_hash({"proj": p_billing.id, "name": env_name})
            db.merge(e)

        auth_envs = [
            ("dev", False, "Developer sandbox"),
            ("staging", True, "Staging validation for OIDC tokens"),
            ("prod", False, "Live token authority")
        ]
        for env_name, is_def, desc in auth_envs:
            e = ProjectEnvironment(
                id=f"env_auth_{env_name}",
                project_id=p_auth.id,
                environment_name=env_name,
                is_default=is_def,
                description=desc
            )
            e.row_hash = e.calculate_row_hash({"proj": p_auth.id, "name": env_name})
            db.merge(e)

        db.flush()
        print("  ✓ Seeded Custom Dynamic Project Environments")

        # ----------------------------------------------------------------
        # 4. Project Setup Instructions & Domain Context
        # ----------------------------------------------------------------
        billing_inst = ProjectSetupInstruction(
            id="inst_prj_billing",
            project_id=p_billing.id,
            prompt_directives=(
                "You are the senior triage investigator for the Global Billing & Payment Platform. "
                "Whenever an error code 'ERR_PAY_GATEWAY_TIMEOUT' or 'ERR_STRIPE_REJECT' is reported: "
                "1. Immediately query Splunk for the transaction correlation ID within a 15-minute window. "
                "2. Check the PostgreSQL payments database for pending ledger locks or duplicate idempotency keys. "
                "3. Cross-reference Jira for active incident tickets or gateway outage notices. "
                "4. If a write is required (e.g. adding a triage note to Jira or restarting a stalled worker), "
                "stage it as an Action Proposal with clear risk classification and payload diff."
            ),
            triage_guidelines="Strictly observe PCI-DSS standards: never print or echo full credit card numbers or raw authorization tokens. Redact account numbers to last 4 digits.",
            domain_context="Payment microservices: payment-gateway, settlement-engine, billing-ledger, stripe-webhook-worker.",
            escalation_policy="P1 incidents (> $5,000 failure/hr) escalate to #incident-billing-war-room immediately.",
            updated_by=admin_user.id
        )
        billing_inst.row_hash = billing_inst.calculate_row_hash({"project_id": p_billing.id})
        db.merge(billing_inst)
        db.flush()
        print("  ✓ Seeded Project Setup Instructions & Prompt Directives")

        # ----------------------------------------------------------------
        # 5. Project Display Configs
        # ----------------------------------------------------------------
        disp_splunk = ProjectDisplayConfig(
            id="disp_bill_splunk",
            project_id=p_billing.id,
            connector_id="splunk",
            display_mode="CARD",
            priority_fields=["timestamp", "log_level", "error_cluster", "trace_id", "message"],
            hidden_fields=["_raw_hex", "_internal_index_id"],
            custom_formatting_rules={"log_level": {"ERROR": "badge-rose", "WARN": "badge-amber", "INFO": "badge-teal"}}
        )
        disp_splunk.row_hash = disp_splunk.calculate_row_hash({"project_id": p_billing.id, "connector": "splunk"})
        db.merge(disp_splunk)

        disp_jira = ProjectDisplayConfig(
            id="disp_bill_jira",
            project_id=p_billing.id,
            connector_id="jira",
            display_mode="TABLE",
            priority_fields=["key", "summary", "status", "priority", "assignee"],
            hidden_fields=["customfield_10020_raw"],
            custom_formatting_rules={"priority": {"Highest": "text-rose-glow", "High": "text-rose"}}
        )
        disp_jira.row_hash = disp_jira.calculate_row_hash({"project_id": p_billing.id, "connector": "jira"})
        db.merge(disp_jira)
        db.flush()
        print("  ✓ Seeded Project Display Configurations")

        # ----------------------------------------------------------------
        # 6. Parameter Definitions (Multi-Tier Hierarchy)
        # ----------------------------------------------------------------
        params = [
            # PLATFORM_ONLY: Hidden from projects, platform admin eyes only
            ParameterDefinition(
                parameter_key="platform.security.global_egress_proxy",
                connector_id="platform",
                scope_level="PLATFORM_ONLY",
                data_type="string",
                default_value_json="https://egress-proxy.corp.internal:3128",
                validation_rules_json={"regex": r"^https?://.*"},
                is_secret=False,
                ui_section="Network & Security",
                display_name="Global Egress Proxy",
                description="Secure outbound proxy used for all third-party connector API calls."
            ),
            ParameterDefinition(
                parameter_key="platform.vault.master_secret_path",
                connector_id="platform",
                scope_level="PLATFORM_ONLY",
                data_type="secret_ref",
                default_value_json="vault://enterprise/secrets/production/prism",
                is_secret=True,
                ui_section="Network & Security",
                display_name="Master Vault Key Path",
                description="HashiCorp Vault path for encrypted connector authentication tokens."
            ),
            ParameterDefinition(
                parameter_key="platform.rate_limit.max_rpm",
                connector_id="platform",
                scope_level="PLATFORM_ONLY",
                data_type="number",
                default_value_json=120,
                validation_rules_json={"min": 10, "max": 1000},
                is_secret=False,
                ui_section="Governance Ceilings",
                display_name="Global Rate Limit Ceiling (RPM)",
                description="Hard requests-per-minute ceiling across all agent runs."
            ),
            # PROJECT_OVERRIDABLE: Inherited platform default, project can override
            ParameterDefinition(
                parameter_key="connector.splunk.query_timeout_seconds",
                connector_id="splunk",
                scope_level="PROJECT_OVERRIDABLE",
                data_type="number",
                default_value_json=30,
                validation_rules_json={"min": 5, "max": 180},
                is_secret=False,
                ui_section="Tool Constraints",
                display_name="Splunk Query Timeout (seconds)",
                description="Timeout for log searches. Projects can override for deeper queries."
            ),
            ParameterDefinition(
                parameter_key="connector.jira.jql_filter_prefix",
                connector_id="jira",
                scope_level="PROJECT_OVERRIDABLE",
                data_type="string",
                default_value_json="project in (BILL, PAY, CORE) AND created >= -7d",
                is_secret=False,
                ui_section="Tool Constraints",
                display_name="Jira Default JQL Filter Prefix",
                description="Base JQL constraint injected into Jira issue searches."
            ),
            ParameterDefinition(
                parameter_key="triage.confidence_threshold",
                connector_id="platform",
                scope_level="PROJECT_OVERRIDABLE",
                data_type="number",
                default_value_json=0.85,
                validation_rules_json={"min": 0.5, "max": 0.99},
                is_secret=False,
                ui_section="Triage Quality",
                display_name="Minimum Confidence Threshold",
                description="Confidence required before recommending an autonomous remediation action."
            ),
            ParameterDefinition(
                parameter_key="connector.db.max_rows_returned",
                connector_id="postgres",
                scope_level="PROJECT_OVERRIDABLE",
                data_type="number",
                default_value_json=50,
                validation_rules_json={"min": 1, "max": 200},
                is_secret=False,
                ui_section="Tool Constraints",
                display_name="Governed DB Max Query Rows",
                description="Safety cap on rows returned by read-only database investigations."
            ),
            # USER_CUSTOMIZED: Configurable by individual engineer
            ParameterDefinition(
                parameter_key="user.ui.diff_view_mode",
                connector_id="platform",
                scope_level="USER_CUSTOMIZED",
                data_type="select",
                default_value_json="split",
                validation_rules_json={"options": ["split", "unified"]},
                is_secret=False,
                ui_section="User Interface",
                display_name="Code Diff Presentation",
                description="Preferred diff rendering mode in Action Proposal cards."
            ),
            ParameterDefinition(
                parameter_key="user.ui.auto_expand_logs",
                connector_id="platform",
                scope_level="USER_CUSTOMIZED",
                data_type="boolean",
                default_value_json=True,
                is_secret=False,
                ui_section="User Interface",
                display_name="Auto-Expand Evidence Cards",
                description="Whether log and evidence cards expand automatically in the run timeline."
            )
        ]
        for p in params:
            p.row_hash = p.calculate_row_hash({"key": p.parameter_key, "scope": p.scope_level})
            db.merge(p)
        db.flush()

        # Seed Project Override for Billing
        billing_override = ParameterValue(
            id="val_bill_splunk_timeout",
            parameter_key="connector.splunk.query_timeout_seconds",
            level="PROJECT",
            project_id=p_billing.id,
            user_id=None,
            configured_value_json=60,
            is_active=True
        )
        billing_override.row_hash = billing_override.calculate_row_hash({"key": billing_override.parameter_key, "val": 60})
        db.merge(billing_override)
        db.flush()
        print("  ✓ Seeded Multi-Tier Parameter Definitions & Project Overrides")

        # ----------------------------------------------------------------
        # 7. Connector Catalog (Admin Enablement Gate)
        # ----------------------------------------------------------------
        catalog_items = [
            ConnectorCatalog(
                id="cat_splunk",
                connector_key="splunk",
                name="Splunk Enterprise & Observability",
                description="High-velocity log aggregation, error pattern discovery, and trace correlation.",
                category="LOGS_TELEMETRY",
                icon_name="splunk-icon",
                supported_protocols=["PYTHON_SDK", "REST_API"],
                capabilities={"read": True, "write_proposals": False, "streaming": True},
                is_admin_enabled=True,
                documentation_url="https://docs.splunk.com"
            ),
            ConnectorCatalog(
                id="cat_jira",
                connector_key="jira",
                name="Atlassian Jira Cloud Enterprise",
                description="Incident ticketing, sprint blockers, and governed triage comment posting.",
                category="ISSUE_TRACKER",
                icon_name="jira-icon",
                supported_protocols=["REST_API", "MCP"],
                capabilities={"read": True, "write_proposals": True, "streaming": False},
                is_admin_enabled=True,
                documentation_url="https://developer.atlassian.com/cloud/jira/platform/rest/v3"
            ),
            ConnectorCatalog(
                id="cat_postgres",
                connector_key="postgres",
                name="Governed PostgreSQL Inspector",
                description="Execute safe, read-only SQL queries with schema introspection and row capping.",
                category="DATABASE",
                icon_name="postgres-icon",
                supported_protocols=["POSTGRES_DB", "PYTHON_SDK"],
                capabilities={"read": True, "write_proposals": False, "streaming": False},
                is_admin_enabled=True,
                documentation_url="https://www.postgresql.org/docs"
            ),
            ConnectorCatalog(
                id="cat_github",
                connector_key="github",
                name="GitHub Enterprise VCS",
                description="Correlate recent commits, PR diffs, and release tags deployed around incident time.",
                category="VCS",
                icon_name="github-icon",
                supported_protocols=["REST_API", "MCP"],
                capabilities={"read": True, "write_proposals": False, "streaming": False},
                is_admin_enabled=True,
                documentation_url="https://docs.github.com/rest"
            ),
            ConnectorCatalog(
                id="cat_datadog",
                connector_key="datadog",
                name="Datadog APM & Metrics",
                description="Live service latency metrics, p99 spikes, CPU saturation, and anomaly alerts.",
                category="LOGS_TELEMETRY",
                icon_name="datadog-icon",
                supported_protocols=["REST_API"],
                capabilities={"read": True, "write_proposals": False, "streaming": False},
                is_admin_enabled=True,
                documentation_url="https://docs.datadoghq.com"
            ),
            ConnectorCatalog(
                id="cat_kubernetes",
                connector_key="kubernetes",
                name="Kubernetes Infrastructure Cluster",
                description="Inspect pod health, crash-looping containers, exit codes, and propose restarts.",
                category="INFRASTRUCTURE",
                icon_name="k8s-icon",
                supported_protocols=["PYTHON_SDK", "REST_API"],
                capabilities={"read": True, "write_proposals": True, "streaming": False},
                is_admin_enabled=True,
                documentation_url="https://kubernetes.io/docs"
            ),
            ConnectorCatalog(
                id="cat_mcp_docs",
                connector_key="mcp_docs",
                name="Central Runbooks & Architecture MCP",
                description="Model Context Protocol server providing live documentation, runbooks, and diagrams.",
                category="KNOWLEDGE",
                icon_name="mcp-icon",
                supported_protocols=["MCP"],
                capabilities={"read": True, "write_proposals": False, "streaming": False},
                is_admin_enabled=True,
                documentation_url="https://modelcontextprotocol.io"
            ),
            ConnectorCatalog(
                id="cat_slack",
                connector_key="slack",
                name="Slack Incident Response Hub",
                description="Stage broadcast incident announcements and war room updates.",
                category="PROTOCOL",
                icon_name="slack-icon",
                supported_protocols=["REST_API"],
                capabilities={"read": False, "write_proposals": True, "streaming": False},
                is_admin_enabled=True,
                documentation_url="https://api.slack.com"
            ),
            ConnectorCatalog(
                id="cat_sentry",
                connector_key="sentry",
                name="Sentry Error Monitoring MCP",
                description="Deep stacktrace aggregation and release anomaly tracker (Awaiting security sign-off).",
                category="LOGS_TELEMETRY",
                icon_name="sentry-icon",
                supported_protocols=["MCP", "REST_API"],
                capabilities={"read": True, "write_proposals": False, "streaming": False},
                is_admin_enabled=False,  # ADMIN DISABLED TO SHOW ADMIN ENABLEMENT GATE IN UI
                documentation_url="https://sentry.io"
            )
        ]
        for cat in catalog_items:
            cat.row_hash = cat.calculate_row_hash({"key": cat.connector_key, "admin": cat.is_admin_enabled})
            db.merge(cat)
        db.flush()
        print("  ✓ Seeded Connector Catalog (Admin Enablement Gates)")

        # ----------------------------------------------------------------
        # 8. Connector Instances & Environments (Global vs Environment Mapped)
        # ----------------------------------------------------------------
        inst_splunk = ConnectorInstance(
            id="inst_splunk_corp",
            instance_key="splunk-prod-corp",
            connector_key="splunk",
            name="Corporate Splunk Cluster",
            protocol="PYTHON_SDK",
            base_url="https://splunk.corp.internal:8089",
            auth_type="API_KEY",
            is_global=False,
            is_active=True
        )
        inst_splunk.row_hash = inst_splunk.calculate_row_hash({"key": inst_splunk.instance_key})
        db.merge(inst_splunk)

        inst_jira = ConnectorInstance(
            id="inst_jira_corp",
            instance_key="jira-prod-corp",
            connector_key="jira",
            name="Corporate Jira Cloud",
            protocol="REST_API",
            base_url="https://company.atlassian.net",
            auth_type="OAUTH2",
            is_global=False,
            is_active=True
        )
        inst_jira.row_hash = inst_jira.calculate_row_hash({"key": inst_jira.instance_key})
        db.merge(inst_jira)

        inst_postgres = ConnectorInstance(
            id="inst_postgres_billing",
            instance_key="postgres-billing-readonly",
            connector_key="postgres",
            name="Billing Read-Only Database Replica",
            protocol="POSTGRES_DB",
            base_url="postgresql://billing_ro@db.internal:5432/billing_transactions",
            auth_type="SERVICE_ACCOUNT",
            is_global=False,
            is_active=True
        )
        inst_postgres.row_hash = inst_postgres.calculate_row_hash({"key": inst_postgres.instance_key})
        db.merge(inst_postgres)

        inst_k8s = ConnectorInstance(
            id="inst_k8s_prod",
            instance_key="k8s-prod-cluster",
            connector_key="kubernetes",
            name="Production EKS Cluster",
            protocol="PYTHON_SDK",
            base_url="https://k8s.prod.company.net",
            auth_type="MTLS",
            is_global=False,
            is_active=True
        )
        inst_k8s.row_hash = inst_k8s.calculate_row_hash({"key": inst_k8s.instance_key})
        db.merge(inst_k8s)

        # Global Connectors: Irrespective of environment!
        inst_mcp_docs = ConnectorInstance(
            id="inst_mcp_docs_global",
            instance_key="mcp-central-docs",
            connector_key="mcp_docs",
            name="Central Enterprise Documentation MCP",
            protocol="MCP",
            base_url="stdio://npx -y @modelcontextprotocol/server-filesystem /var/docs",
            auth_type="NONE",
            is_global=True,  # GLOBAL TOOL!
            is_active=True
        )
        inst_mcp_docs.row_hash = inst_mcp_docs.calculate_row_hash({"key": inst_mcp_docs.instance_key})
        db.merge(inst_mcp_docs)

        inst_slack = ConnectorInstance(
            id="inst_slack_global",
            instance_key="slack-incident-bot",
            connector_key="slack",
            name="Slack Broadcast Bot",
            protocol="REST_API",
            base_url="https://hooks.slack.com/services/T00/B00/XXXX",
            auth_type="BEARER_TOKEN",
            is_global=True,  # GLOBAL TOOL!
            is_active=True
        )
        inst_slack.row_hash = inst_slack.calculate_row_hash({"key": inst_slack.instance_key})
        db.merge(inst_slack)
        db.flush()

        # Connector Environments
        conn_envs = [
            (inst_splunk.id, "splunk-prod-cluster", "https://splunk-prod.corp.internal:8089"),
            (inst_splunk.id, "splunk-staging-logs", "https://splunk-staging.corp.internal:8089"),
            (inst_splunk.id, "splunk-dev-logs", "https://splunk-dev.corp.internal:8089"),
            (inst_jira.id, "jira-cloud-prod", "https://company.atlassian.net"),
            (inst_jira.id, "jira-cloud-uat", "https://company-uat.atlassian.net"),
            (inst_postgres.id, "billing-prod-replica", "postgresql://ro@prod-db.internal:5432/billing"),
            (inst_postgres.id, "billing-uat-replica", "postgresql://ro@uat-db.internal:5432/billing"),
            (inst_k8s.id, "k8s-prod-us-east", "https://k8s-east.company.net"),
            (inst_k8s.id, "k8s-staging", "https://k8s-staging.company.net")
        ]
        for inst_id, env_name, endpoint in conn_envs:
            ce = ConnectorEnvironment(
                id=f"cenv_{inst_id}_{env_name}",
                connector_instance_id=inst_id,
                environment_name=env_name,
                endpoint_override=endpoint
            )
            ce.row_hash = ce.calculate_row_hash({"inst": inst_id, "name": env_name})
            db.merge(ce)

        # Connector Health status
        for inst in [inst_splunk, inst_jira, inst_postgres, inst_k8s, inst_mcp_docs, inst_slack]:
            health = ConnectorHealth(
                id=f"hlth_{inst.id}",
                connector_instance_id=inst.id,
                environment_name="prod",
                status="HEALTHY",
                latency_ms=42,
                consecutive_failures=0
            )
            health.row_hash = health.calculate_row_hash({"id": health.id, "status": health.status})
            db.merge(health)

        db.flush()
        print("  ✓ Seeded Connector Instances, Environments & Health Checks")

        # ----------------------------------------------------------------
        # 9. Project Connector Bindings & Environment Mappings
        # ----------------------------------------------------------------
        bound_instances = [inst_splunk, inst_jira, inst_postgres, inst_k8s, inst_mcp_docs, inst_slack]
        for inst in bound_instances:
            binding = ProjectConnectorBinding(
                id=f"bind_bill_{inst.id}",
                project_id=p_billing.id,
                connector_instance_id=inst.id,
                is_enabled=True,
                notes=f"Bound to {p_billing.name}"
            )
            binding.row_hash = binding.calculate_row_hash({"proj": p_billing.id, "inst": inst.id})
            db.merge(binding)

        # Mapping Matrix: (Project Env -> Tool Env)
        mappings = [
            # Prod Environment Mappings
            (p_billing.id, "prod", inst_splunk.id, "splunk-prod-cluster"),
            (p_billing.id, "prod", inst_jira.id, "jira-cloud-prod"),
            (p_billing.id, "prod", inst_postgres.id, "billing-prod-replica"),
            (p_billing.id, "prod", inst_k8s.id, "k8s-prod-us-east"),
            # Staging Environment Mappings
            (p_billing.id, "staging", inst_splunk.id, "splunk-staging-logs"),
            (p_billing.id, "staging", inst_jira.id, "jira-cloud-uat"),
            (p_billing.id, "staging", inst_postgres.id, "billing-uat-replica"),
            (p_billing.id, "staging", inst_k8s.id, "k8s-staging"),
            # Dev Environment Mappings
            (p_billing.id, "dev", inst_splunk.id, "splunk-dev-logs"),
            (p_billing.id, "dev", inst_jira.id, "jira-cloud-uat"),
            (p_billing.id, "dev", inst_postgres.id, "billing-uat-replica"),
            (p_billing.id, "dev", inst_k8s.id, "k8s-staging"),
        ]
        for proj_id, p_env, inst_id, t_env in mappings:
            m = ProjectToolEnvMapping(
                id=f"map_{proj_id}_{p_env}_{inst_id}",
                project_id=proj_id,
                project_environment=p_env,
                connector_instance_id=inst_id,
                tool_environment=t_env,
                is_active=True
            )
            m.row_hash = m.calculate_row_hash({"proj": proj_id, "p_env": p_env, "t_env": t_env})
            db.merge(m)

        db.flush()
        print("  ✓ Seeded Project Connector Bindings & Environment Resolution Matrix")

        # ----------------------------------------------------------------
        # 10. OKF v2.0 Knowledge Fabric: Cases, Entities & Runbooks
        # ----------------------------------------------------------------
        case_1 = OkfTriagedCase(
            id="okf_case_01",
            incident_id="INC-4091",
            project_id=p_billing.id,
            title="Stripe Webhook Gateway Timeout during Recurring Subscription Cycle",
            issue_signature="StripeWebhookWorker: ReadTimeout after 30000ms connecting to payment-ledger DB pool. Error: PoolAcquireTimeoutException",
            root_cause="PostgreSQL connection pool exhaustion caused by high concurrency cron without idle connection reap timeout.",
            resolution_summary="Scaled down idle transaction timeout from 120s to 15s in postgres parameter group. Triggered worker pod rolling restart to drain stalled TCP sockets.",
            resolved_actions_json=[
                {"action": "kubernetes.restart_pod", "target": "stripe-webhook-worker-6789b-qwert"},
                {"action": "jira.add_comment", "target": "BILL-1049"}
            ],
            key_evidence_ids=["ev_splunk_4091", "ev_db_pool_4091"],
            tags=["stripe", "webhook", "postgres", "connection-pool", "timeout"],
            mttr_minutes=18,
            confidence_score=0.98,
            verified_by_user_id=admin_user.id,
            times_referenced=14
        )
        case_1.row_hash = case_1.calculate_row_hash({"id": case_1.id, "inc": case_1.incident_id})
        db.merge(case_1)

        case_2 = OkfTriagedCase(
            id="okf_case_02",
            incident_id="INC-3820",
            project_id=p_auth.id,
            title="JWT Token Signature Verification Failure on Auth Edge Proxy",
            issue_signature="TokenVerificationError: Signature key ID 'rsa-2026-q3' not present in cached JWKS keystore.",
            root_cause="Public key rotation clock skew between authorization server and edge proxy caching layer.",
            resolution_summary="Flushed edge envoy proxy JWKS cache and adjusted TTL to 5 minutes.",
            resolved_actions_json=[{"action": "kubernetes.restart_pod", "target": "envoy-auth-proxy-99a"}],
            key_evidence_ids=["ev_splunk_3820"],
            tags=["auth", "jwt", "jwks", "envoy", "cache"],
            mttr_minutes=12,
            confidence_score=0.95,
            verified_by_user_id=triage_user.id,
            times_referenced=8
        )
        case_2.row_hash = case_2.calculate_row_hash({"id": case_2.id, "inc": case_2.incident_id})
        db.merge(case_2)

        # OKF Entities
        entities = [
            ("payment-gateway", "SERVICE", p_billing.id, {"team": "Checkout", "repo": "org/billing-core"}),
            ("stripe-webhook-worker", "SERVICE", p_billing.id, {"team": "Ledger", "repo": "org/stripe-worker"}),
            ("ERR_PAY_GATEWAY_TIMEOUT", "ERROR_CODE", p_billing.id, {"severity": "CRITICAL"}),
            ("PoolAcquireTimeoutException", "ERROR_CODE", p_billing.id, {"severity": "HIGH"}),
            ("auth-edge-proxy", "SERVICE", p_auth.id, {"team": "Identity", "repo": "org/auth-proxy"})
        ]
        for name, etype, pid, meta in entities:
            ent = OkfEntity(
                id=f"ent_{name}",
                entity_name=name,
                entity_type=etype,
                project_id=pid,
                metadata_json=meta
            )
            ent.row_hash = ent.calculate_row_hash({"name": name, "type": etype})
            db.merge(ent)

        # OKF Knowledge Runbooks
        node_1 = OkfKnowledgeNode(
            id="node_rb_billing_01",
            title="Emergency Payment Gateway Triage & Circuit Breaker Reset Runbook",
            category="RUNBOOK",
            content_markdown="""# Payment Gateway Emergency Triage Runbook
1. Check Stripe Webhook Error Rates on Datadog Dashboard: `https://app.datadoghq.com/billing-overview`.
2. Search Splunk for `cluster_id=payment-gateway AND status>=500`.
3. If error rates exceed 5%, verify PostgreSQL connection pool saturation.
4. Execute `kubernetes.restart_pod` on degraded worker replicas.
5. Post triage update to Jira issue before notifying #incident-war-room.""",
            solution_steps_json=[
                {"step": 1, "action": "Query Splunk logs for error cluster"},
                {"step": 2, "action": "Check DB connection pool saturation"},
                {"step": 3, "action": "Stage pod restart Action Proposal"},
                {"step": 4, "action": "Post Jira confirmation note"}
            ],
            helpful_score=38,
            usage_count=45
        )
        node_1.row_hash = node_1.calculate_row_hash({"id": node_1.id, "title": node_1.title})
        db.merge(node_1)

        db.flush()
        print("  ✓ Seeded OKF v2.0 Knowledge Fabric (Cases, Entities, Runbooks)")

        db.commit()
        print("[PRISM SEED] Seeding completed successfully!")


if __name__ == "__main__":
    seed_database()
