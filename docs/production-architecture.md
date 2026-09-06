# Sentrix Production Architecture & Operational Specification

## Executive Overview
Sentrix is an enterprise-grade autonomous Site Reliability Engineering (SRE) platform engineered for zero-trust operational environments. It decouples high-reasoning diagnostic intelligence from mutating infrastructure execution, ensuring all modifying commands require human authorization via cryptographic proposals.

---

## 1. Multi-Tenant Scoping & Data Model

Sentrix organizes all tenancy, configurations, permissions, and runtime records across **four strictly enforced hierarchical scopes**:

```mermaid
graph TD
    subgraph MultiTenantHierarchy["Multi-Tenant Scoping Model"]
        ORG["Organization (e.g. Acme FinTech Corp)<br/>• Global Policies & SSO Integration<br/>• Root RBAC Defaults & Platform Plugins"]
        TEAM["Engineering Team / Squad (e.g. Payments Core Squad)<br/>• Department Budgets & FinOps Allocations<br/>• Squad Runbooks & Notification Endpoints"]
        PRJ["Project Scope (e.g. Project BILLING)<br/>• Connector Instances & Mappings<br/>• Project Skills & Custom Prompts<br/>• Incident Evidence & Action Proposals"]
        ENV["Dynamic Environment Array (e.g. ['prod-east', 'eu-dr', 'stage-alpha'])<br/>• Physical Connection Conduits<br/>• Hostnames, Ports, Replica Credentials"]
    end

    ORG --> TEAM
    TEAM --> PRJ
    PRJ --> ENV

    subgraph ProjectAssets["Project-Scoped Assets & Runtime Records"]
        direction TB
        ASSET1["Connector Instances & Bindings"]
        ASSET2["Skills & Custom Instruction Prompts"]
        ASSET3["Model Routes & FinOps Quotas"]
        ASSET4["Investigation Runs & Telemetry Evidence"]
        ASSET5["Action Proposals & Cryptographic Approvals"]
        ASSET6["Audit Trail & Verification Signatures"]
    end

    PRJ -.-> ProjectAssets
```

### Scoping Invariants
1. **Strict Tenant Isolation:** No project may execute diagnostic queries or access evidence belonging to another project. Database queries are hard-scoped to `project_id`.
2. **Dynamic Environments:** Environments are not hardcoded (e.g. `dev`/`stage`/`prod`). Projects configure dynamic environments matching their physical topology (e.g. `us-east-prod`, `eu-west-dr`, `pci-vault`).
3. **Empty Database Validity:** The administration console and project dashboards treat an empty database as a valid, first-class state. No demo tenants are automatically inserted into production databases.

---

## 2. Database Lifecycle & Schema Management

Sentrix supports both **SQLite** (for local development and zero-dependency staging) and **PostgreSQL** (for enterprise production clusters) via **async SQLAlchemy 2.0**.

```mermaid
flowchart TD
    SQL_GEN["python -m database.schema --sql"] --> SCHEMA_SQL["backend/database/schema.sql<br/>(Immutable DDL Blueprint)"]
    SCHEMA_SQL --> DDL_APPLY["python -m database.schema<br/>(Creates Missing Tables / Non-Destructive)"]
    DDL_APPLY --> SEED_RBAC["python -m database.seed_data --apply<br/>(Installs System RBAC Roles: Admin, SRE Lead, Engineer, Auditor)"]
    SEED_RBAC --> READY["PostgreSQL / SQLite Production Ready<br/>(Zero Injected Dummy Data)"]
```

### Database Management Commands
```bash
# Export the complete database DDL schema
python -m database.schema --sql > database/schema.sql

# Create missing tables non-destructively (never drops tables or data)
python -m database.schema

# Seed explicit system RBAC role definitions
python -m database.seed_data --apply
```

### Key Database Schemas (`control_plane`)
- `control_plane.organizations`: Global enterprise tenant entities.
- `control_plane.teams`: Squad groupings and FinOps attribution units.
- `control_plane.projects`: Core operational boundaries owning connectors, runs, and policies.
- `control_plane.environments`: Project-specific environment definitions.
- `control_plane.connector_instances`: Registered enterprise connections (PostgreSQL, Datadog, Splunk, K8s).
- `control_plane.project_tool_env_mappings`: Dynamic conduit resolver linking project environments to connectors.
- `control_plane.runs`: Immutable investigation sessions with status, model snapshots, and token metrics.
- `control_plane.action_proposals`: Cryptographic remediation proposals awaiting domain engineer sign-off.
- `control_plane.audit_logs`: Append-only, tamper-resistant operational ledger.

---

## 3. Google ADK 2.8 Agent Runtime & Execution Lifecycle

The agent runtime is powered by **Google ADK 2.8** paired with the **DeepSeek Harness** microkernel:

```mermaid
sequenceDiagram
    autonumber
    participant Client as Frontend (React 19)
    participant API as FastAPI Backend (/api/runs/:id/stream)
    participant ADK as Google ADK 2.8 Runtime
    participant Harness as Harness Plugin Engine
    participant Broker as Guarded Tool Broker
    participant Store as Evidence Store & DB

    Client->>API: GET /api/runs/:id/stream (SSE Connection)
    API->>ADK: Initialize Async LlmAgent(model, tools, prompt)
    ADK->>Harness: on_session_start(context)

    loop Bounded Investigation Loop (Max 4 Calls)
        Harness->>ADK: Evaluate Next Step with Token Budgeter
        ADK->>Broker: Dispatch Tool Probe (e.g. query_postgres_locks)
        Harness->>Broker: pre_tool_execute(tool_name, params)
        Broker->>Store: Execute Read Query & Record Evidence
        Broker-->>Harness: post_tool_execute(tool_name, telemetry)
        Harness-->>API: SSE Event: TEXT_DELTA / TOOL_RESULT
        API-->>Client: Real-Time Stream Event (Milestone & Telemetry Peek)
    end

    ADK->>Harness: on_session_end(rca_summary)
    Harness->>Store: Persist RCA Report & Token Metrics
    API-->>Client: SSE Event: STREAM_DONE
```

### Execution Guardrails
- **Bounded Call Budget:** ADK agents execute with a hard cap of 4 iterative tool calls per investigation phase to eliminate infinite reasoning loops.
- **Strict Execution Timeouts:** Each diagnostic probe has an enforceable socket timeout (default 5,000ms).
- **Untrusted Evidence Isolation:** Raw external data (logs, SQL outputs, pod descriptors) is classified as untrusted input. The system never executes code embedded inside telemetry.
- **Typed Output Schemas:** Every agent milestone outputs strict Pydantic/JSON schemas validating root cause, severity, affected entities, and staged diffs.

---

## 4. Guarded Tool Broker & Connector Topology

Connectors isolate network communication protocols from the agent reasoning layer:

```mermaid
graph LR
    subgraph AgentLayer["Reasoning Layer"]
        AGENT["Google ADK Agent"]
    end

    subgraph BrokerLayer["Guarded Tool Broker"]
        VALIDATOR["Schema Validator & AST Parser"]
        RESOLVER["Dynamic Environment Resolver"]
        PII["PII Redactor & Token Vault"]
    end

    subgraph ConnectorLayer["Connector Adapters"]
        C_SQL["PostgreSQL / Oracle / MySQL"]
        C_K8S["Kubernetes Pod Operator"]
        C_APM["Datadog / APM Streams"]
        C_LOG["Splunk / Elastic Logs"]
        C_MCP["Model Context Protocol (MCP)"]
    end

    AGENT -->|Tool Call Request| VALIDATOR
    VALIDATOR --> RESOLVER
    RESOLVER --> PII
    PII -->|Read Query| C_SQL
    PII -->|Read Query| C_K8S
    PII -->|Read Query| C_APM
    PII -->|Read Query| C_LOG
    PII -->|Dynamic Tool| C_MCP
```

### Connector Invariants
- **No Mock Fallbacks in Production:** Connectors never silently fall back to synthetic local data when an endpoint is unreachable; they explicitly return `UNAVAILABLE` or raise connection errors.
- **AST SQL Inspection:** All relational database probes are parsed with `sqlglot`. Queries containing `INSERT`, `UPDATE`, `DELETE`, `DROP`, or `ALTER` are immediately rejected with security violations.
- **Dynamic MCP Discovery:** Sentrix dynamically queries MCP servers over standard stdio or SSE transports, converting registered MCP tools into ADK-compatible tool definitions.

---

## 5. Deployment Topologies

```mermaid
graph TB
    subgraph Topology["Sentrix Production Deployment Options"]
        DEV["Local Development<br/>• FastAPI Uvicorn Server<br/>• Vite 8 Dev Server<br/>• Local SQLite Database"]
        CONTAINER["Docker Compose Cluster<br/>• Sentrix API Container<br/>• React SPA Nginx Container<br/>• PostgreSQL 16 Replica<br/>• Redis Cache"]
        K8S_DEP["Enterprise Cloud / Kubernetes<br/>• Cloud Run / GKE Deployments<br/>• Managed PostgreSQL (Cloud SQL / RDS)<br/>• Google Secret Manager / Vault<br/>• Private VPC Peering"]
        AIRGAP["Air-Gapped On-Premises<br/>• Local vLLM / Ollama Server<br/>• Self-Hosted PostgreSQL<br/>• Zero External Internet Egress"]
    end
```

### Environment Variables Matrix
| Variable | Required | Description | Default |
|---|---|---|---|
| `DATABASE_URL` | Yes | SQLAlchemy async connection string | `sqlite+aiosqlite:///./sentrix.db` |
| `ADK_MODEL` | No | Default model route | `gemini-2.5-pro` |
| `GEMINI_API_KEY` | Conditional | Google Gemini API key for ADK | Set in vault |
| `ANTHROPIC_API_KEY` | Conditional | Claude 3.5 Sonnet API key | Set in vault |
| `OPENAI_API_KEY` | Conditional | OpenAI API key | Set in vault |
| `DEEPSEEK_API_KEY` | Conditional | DeepSeek R1/V3 API key | Set in vault |
| `PORT` | No | FastAPI listening port | `8000` |
| `CORS_ORIGINS` | No | Allowed frontend origins | `http://localhost:5173` |

---

*Sentrix Architectural Blueprint — Autonomous SRE with Verifiable Governance.*
