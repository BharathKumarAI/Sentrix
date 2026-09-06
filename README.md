# Sentrix | Autonomous SRE & Multi-Tenant Incident Governance Platform

[![Platform](https://img.shields.io/badge/Platform-Sentrix-06b6d4?style=flat-square)](https://github.com/)
[![ADK Core](https://img.shields.io/badge/Agent_Runtime-Google_ADK_2.8-8b5cf6?style=flat-square)](https://cloud.google.com/)
[![Frontend](https://img.shields.io/badge/Frontend-Vite_8_+_React_19-ec4899?style=flat-square)](https://vitejs.dev/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI_+_SQLAlchemy-10b981?style=flat-square)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue?style=flat-square)](LICENSE)

**Sentrix** is an enterprise-grade autonomous Site Reliability Engineering (SRE) and multi-tenant incident governance platform. It orchestrates real-time incident triage, root cause deconstruction, tool broker mediation, and cryptographic remediation proposal governance across distributed multi-cloud services.

---

## 🏗️ Architecture Overview

Sentrix operates across a **4-Plane Model** (Experience, Control, Runtime, and Integration/Data) designed to keep agent reasoning strictly advisory while enforcing human-in-the-loop authorization on all infrastructure mutations.

```mermaid
graph TB
    subgraph External["External Monitoring & Ticketing"]
        JIRA["Jira Cloud (JQL Multi-Queue)"]
        SNOW["ServiceNow (sn_incident CMDB)"]
        ALERTS["APM Webhooks (Datadog/Prometheus)"]
    end

    subgraph ExperiencePlane["1. Experience Plane (React 19 + Vite 8)"]
        BOARD["Live Triage Kanban Board<br/>(Pulsing Radar Beacon)"]
        STREAM["Investigation Stream<br/>(SSE Real-Time Milestones)"]
        STUDIO["Setup Studio & Environment Conduits"]
        ADMIN["Enterprise Admin Console<br/>(Health, Billing, Security)"]
    end

    subgraph ControlPlane["2. Control Plane (FastAPI + PostgreSQL)"]
        REGISTRY["Project Registry & Tenant Store"]
        RESOLVER["Dynamic Environment Resolver Matrix"]
        OKF["OKF v2.0 Knowledge Fabric<br/>(Embeddings & Runbooks)"]
        AUTHZ["RBAC & Zero-Trust Secret Vault"]
    end

    subgraph RuntimePlane["3. Runtime Plane (Google ADK 2.8 + DeepSeek Harness)"]
        HARNESS["Agent Harness Microkernel<br/>('Everything is a Plugin')"]
        ROUTER["Multi-Model Stage Router<br/>(Gemini 2.5 Pro / Claude / DeepSeek)"]
        BROKER["Guarded Tool Broker<br/>(Read-Only Enforcer & PII Redactor)"]
        PROPOSALS["Cryptographic Action Proposals<br/>(Human-in-the-loop Gate)"]
    end

    subgraph DataPlane["4. Integration & Data Plane (Enterprise Connectors)"]
        DB["PostgreSQL / Oracle / MySQL<br/>(Read-Only Diagnostic Views)"]
        APM["Datadog / Splunk / Prometheus<br/>(Metric & Log Streaming)"]
        K8S["Kubernetes Pod Operator<br/>(Diagnostic Probes)"]
        GIT["GitLab / GitHub MR Stager<br/>(Automated Code Diffs)"]
        MCP["Model Context Protocol (MCP)<br/>(Dynamic Tool Servers)"]
    end

    JIRA -->|30s Poll / Webhook| REGISTRY
    SNOW -->|CMDB Poll| REGISTRY
    ALERTS -->|Webhook| REGISTRY

    BOARD <-->|REST / SSE| HARNESS
    STREAM <-->|Live Telemetry SSE| HARNESS
    ADMIN -->|Config & Policies| REGISTRY
    STUDIO -->|Conduit Mapping| RESOLVER

    REGISTRY --> HARNESS
    RESOLVER --> BROKER
    OKF --> HARNESS
    AUTHZ --> BROKER

    HARNESS --> ROUTER
    ROUTER --> BROKER
    BROKER -->|Read Queries| DB
    BROKER -->|Log Searches| APM
    BROKER -->|Pod Status| K8S
    BROKER -->|Dynamic Tools| MCP

    BROKER -.->|Mutating Action Intercept| PROPOSALS
    PROPOSALS -->|Human Approval Required| BOARD
    PROPOSALS -->|Staged Diff| GIT
```

---

## 🔄 End-to-End Incident Lifecycle

When an incident hits production, Sentrix orchestrates the entire diagnostic and remediation process through seven deterministic stages:

```mermaid
sequenceDiagram
    autonumber
    actor Engineer as SRE Engineer
    participant Ingestion as Ingestion Service
    participant Classifier as Request Classifier
    participant Harness as DeepSeek Harness
    participant Broker as Guarded Tool Broker
    participant Infra as External Telemetry (DB/APM/K8s)
    participant RCA as RCA Synthesis Engine
    participant Proposal as Action Proposals

    Note over Ingestion: 1. Trigger
    Ingestion->>Classifier: Ingest Jira ticket / ServiceNow alert (e.g. BILL-1049)
    Note over Classifier: 2. 4D Classification
    Classifier->>Harness: Resolve Intent, Scope, Read Mode, and Risk Tier
    
    Note over Harness,Broker: 3. Autonomous Diagnostic Investigation
    loop Live Telemetry Extraction
        Harness->>Broker: Dispatch read-only probe
        Broker->>Infra: Execute diagnostic query (PostgreSQL pool, APM logs)
        Infra-->>Broker: Telemetry payload
        Broker-->>Harness: Sanitized result (PII redacted)
        Harness-->>Engineer: Stream milestone SSE (Progress Shimmer + Telemetry Peeks)
    end

    Note over Harness,RCA: 4. Topological RCA Deconstruction
    Harness->>RCA: Synthesize Fault DAG & bottleneck
    RCA-->>Engineer: Render Service Flow DAG & Executive Summary

    Note over Broker,Proposal: 5. Governed Action Staging
    Harness->>Proposal: Stage remediation (e.g. Tune pool size + GitLab MR)
    Proposal-->>Engineer: Display ActionApprovalCard (Zero write without approval)

    Note over Engineer,Proposal: 6. Human-in-the-Loop Authorization
    Engineer->>Proposal: Sign & Approve with cryptographic credentials
    Proposal->>Broker: Execute authorized modification

    Note over Broker,Harness: 7. Verification & Knowledge Ingestion
    Broker->>Infra: Run synthetic assertions (P99 latency, error rate)
    Infra-->>Harness: Confirmation metrics
    Harness-->>Engineer: Mark incident Resolved & Verified
    Harness->>Harness: Vectorize incident findings into OKF v2.0
```

---

## ⚡ Quick Start: How to Run the Platform

### System Requirements
- **Node.js**: `v18.0.0+` (`v20+` recommended)
- **Python**: `3.10` or `3.11`
- **Git**: Installed and configured
- **Database**: SQLite (default out-of-the-box) or PostgreSQL (production)

---

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd Prism
```

---

### Step 2: Backend Setup & Launch
The backend is built with FastAPI, SQLite/PostgreSQL, Google ADK 2.8, and async SQLAlchemy.

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate

# Install base dependencies (or tailored to your target cloud):
pip install -r requirements.txt            # Core Platform (Local / SQLite / Postgres)
# Or install based on target cloud:
# pip install -r requirements-azure.txt   # Microsoft Azure (Blob Storage, Key Vault, Identity)
# pip install -r requirements-gcp.txt     # Google Cloud Platform (GCS, Secret Manager, Trace)
# pip install -r requirements-aws.txt     # Amazon Web Services (S3, Secrets Manager via Boto3)
# pip install -r requirements-k8s.txt     # Kubernetes Cluster Pod Operator
# pip install -r requirements-all.txt     # All clouds combined

# Or from project root with npm:
# npm run setup:azure  /  npm run setup:gcp  /  npm run setup:aws  /  npm run setup:all

# (Optional) Initialize schema and seed RBAC roles
python -m database.schema
python -m database.seed_data --apply

# Run FastAPI ASGI server with auto-reload
python main.py
# Or directly via Uvicorn:
# uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

> **Backend Health Verification:**  
> Verify backend health at: `http://localhost:8000/health` or open Swagger UI at `http://localhost:8000/docs`.

---

### Step 3: Frontend Setup & Launch
The frontend is powered by React 19, Vite 8, and a bespoke high-contrast telemetry design system.

```bash
# Open a new terminal window
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

> **Access Application:**  
> Open your browser at **`http://localhost:5173`** (Default entry point routes to Live Triage Board or Admin Console).

---

## 🧭 Navigation Directory & Routes

| Route | Module | Purpose |
|---|---|---|
| `/p/:projectKey/board` | **Live Triage Board** *(#1 Priority)* | Real-time Kanban board with pulsating radar beacon, priority filters, team comments, and evidence lockers. |
| `/p/:projectKey/triage` | **Auto-Triage Hub** | Live Jira/ServiceNow polling, triage feed, service flow visualizer, root cause analysis, GitLab diff approvals. |
| `/p/:projectKey/investigations` | **Investigation Stream** | Interactive multi-stage thinking progress card with live telemetry peeks, steering chips, and approval cards. |
| `/p/:projectKey/overview` | **Project Command Center** | Real-time SLA compliance, MTTA/MTTR metrics, active incidents, and telemetry feeds. |
| `/p/:projectKey/metrics` | **SRE Reliability & Metrics** | Interactive dual-curve SVG area chart (MTTA/MTTR), SLO error budget gauge, daily velocity histogram & squad matrix. |
| `/p/:projectKey/setup` | **Setup & Studio** | Multi-queue JQL generator, datasource connectors forum, dynamic environment flow, runbook uploader. |
| `/p/:projectKey/environments` | **Environment Resolver** | Interactive conduit mapping connecting project environments to tool instances without hardcoding. |
| `/p/:projectKey/reports` | **Autonomous SRE Reports** | 4-cycle historical improvement curves, triage stats, agent metrics, and SendGrid executive email brief dispatcher. |
| `/p/:projectKey/feedback` | **Domain Feedback Loop** | Engineer validation, accuracy scoring, and reinforcement learning signals for ADK agents. |
| `/admin/overview` | **Enterprise Admin Console** | Platform health, multi-project usage, connectors catalog & security policies. |
| `/admin/projects` | **Projects Fleet** | Register new enterprise projects, configure tiers, and manage project lifecycles. |
| `/admin/organizations` | **Organizations** | Multi-tenant organizational management and policy inheritance. |
| `/admin/connectors` | **Connectors Catalog** | Manage connections to PostgreSQL, Oracle, Datadog, Splunk, Kubernetes, and Jira. |
| `/admin/system-health` | **System Health & Observability** | CPU, memory, socket connections, latency distributions, and connector ping status. |
| `/admin/billing` | **FinOps & Model Usage** | Per-project token attribution, cost tracking, and model rate limit monitoring. |
| `/admin/security-policy` | **Security & Audit Logs** | Immutable audit ledger of every prompt, tool query, approval, and administrative change. |
| `/docs` | **Platform Knowledge Base** | In-app operational tour, architecture breakdown, prompt recipes, and live schema tester. |

---

## 🔐 Core Invariants & Security Guardrails

Sentrix enforces five non-negotiable architectural invariants:

1. **Reasoning is NOT Authorization:**  
   LLMs generate diagnoses and proposals, but have **zero autonomous write capabilities**. Mutating actions require explicit human sign-off via cryptographic action proposals.
2. **Read-Only Auto-Triage:**  
   All automatic probes dispatched by the Tool Broker are strictly verified read-only queries (`SELECT`, `kubectl get`, `datadog query`, `splunk search`). AST parsing blocks write statements.
3. **Decoupled Environment-to-Tool Conduits:**  
   No hardcoded URLs. Projects define dynamic environment lists (e.g. `["us-east-prod", "eu-dr", "stage-alpha"]`), and the Resolver maps them to concrete tool instances.
4. **Zero-Trust Token Vault & PII Redaction:**  
   External credentials (passwords, tokens, SSH keys) remain encrypted in the backend. Sensitive customer patterns (JWTs, PANs, emails) are stripped before sending telemetry to models.
5. **Deterministic Auditability:**  
   Every investigation run produces an immutable audit record containing model snapshots, token consumption, raw tool commands, approval signatures, and git commit hashes.

---

## 📚 Documentation Index

[`docs/README.md`](./docs/README.md) is the canonical documentation map. Use the focused guides below for the relevant audience:

- [Platform Architecture & Operational Specification (`docs/HOW_THE_PROJECT_WORKS.md`)](./docs/HOW_THE_PROJECT_WORKS.md) — Canonical guide to the 4-plane model, incident lifecycle, and subsystem mechanics.
- [Production Architecture & Data Model (`docs/production-architecture.md`)](./docs/production-architecture.md) — Multi-tenant hierarchy, persistence lifecycle, ADK runtime, and deployment topologies.
- [Skills & 4D Request Classification Architecture (`docs/SENTRIX_SKILLS_AND_REQUEST_CLASSIFICATION_ARCHITECTURE.md`)](./docs/SENTRIX_SKILLS_AND_REQUEST_CLASSIFICATION_ARCHITECTURE.md) — 4-layer skill hierarchy (L0–L3) and 4-dimensional classification matrix.
- [DeepSeek Harness & Plugin Architecture (`docs/harness-plugins.md`)](./docs/harness-plugins.md) — Microkernel plugin lifecycle and configuration inheritance.
- [Application Source & Local Data Policy (`docs/local-data-policy.md`)](./docs/local-data-policy.md) — Local data retention, storage guidelines, and git hygiene.
- [Backend Architecture & API Guide (`backend/README.md`)](./backend/README.md) — Backend developer manual, directory breakdown, and REST/SSE endpoints.
- [Frontend Architecture & Design Guide (`frontend/README.md`)](./frontend/README.md) — React 19 UI architecture, telemetry design system, and component catalog.
- [Skills Catalog & Organization (`skills/README.md`)](./skills/README.md) — Guide to platform diagnostic skills and developer assistance skills.

---

## 🧪 Testing & Build Verification

```bash
# Frontend production build & lint
cd frontend
npm run lint
npm run build

# Backend automated test suite
cd ../backend
python -m unittest discover tests/
# Or if pytest is installed: pytest tests/
```

---

*Sentrix — Autonomous Site Reliability Engineering with Uncompromising Governance.*
