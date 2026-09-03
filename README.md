# Sentrix | Autonomous SRE & Multi-Tenant Incident Governance Platform

[![Platform](https://img.shields.io/badge/Platform-Sentrix-06b6d4?style=flat-square)](https://github.com/)
[![ADK Core](https://img.shields.io/badge/Agent_Runtime-Google_ADK_2.8-8b5cf6?style=flat-square)](https://cloud.google.com/)
[![Frontend](https://img.shields.io/badge/Frontend-Vite_8_+_React_19-ec4899?style=flat-square)](https://vitejs.dev/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI_+_SQLAlchemy-10b981?style=flat-square)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue?style=flat-square)](LICENSE)

**Sentrix** is an enterprise-grade autonomous Site Reliability Engineering (SRE) platform. It orchestrates real-time incident triage, root cause deconstruction, tool broker mediation, and cryptographic remediation proposal governance across distributed multi-cloud services.

---

## 🏗️ Architecture Overview

```
                          ┌─────────────────────────────────────┐
                          │   Jira Cloud / ServiceNow Polling   │
                          └──────────────────┬──────────────────┘
                                             │ Webhook / 30s Poll
                                             ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               SENTRIX CONTROL PLANE                                    │
│                                                                                        │
│  ┌─────────────────────────┐   ┌──────────────────────────┐   ┌─────────────────────┐  │
│  │   Auto-Triage Hub &     │   │   OKF v2.0 Knowledge     │   │  Multi-Tenant Fleet │  │
│  │   Live Incident Desk    │◄─►│   Fabric (Vector/Preced) │◄─►│  Setup Studio       │  │
│  └────────────┬────────────┘   └──────────────────────────┘   └─────────────────────┘  │
│               │                                                                        │
│               ▼                                                                        │
│  ┌────────────────────────────────────────────────────────┐                            │
│  │   ADK 2.8 Autonomous SRE Engine (Gemini 2.5 Pro)       │                            │
│  └────────────────────────────┬───────────────────────────┘                            │
│                               │ Guarded Tools Ingestion                                │
│                               ▼                                                        │
│  ┌────────────────────────────────────────────────────────┐                            │
│  │   Tool Broker & Environment Resolver Matrix            │                            │
│  └───────┬────────────────────┬────────────────────┬──────┘                            │
└──────────┼────────────────────┼────────────────────┼───────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
   ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
   │ PostgreSQL DB │    │ Datadog / APM │    │ Kubernetes    │
   │ Read Replica  │    │ Metric Stream │    │ Pod Operator  │
   └───────────────┘    └───────────────┘    └───────────────┘
```

---

## ⚡ Quick Start: How to Initiate the Project

### 1. System Requirements
- **Node.js**: `v18.0.0` or higher (`v20+` recommended)
- **Python**: `3.10` or `3.11`
- **Git**: installed and configured

---

### 2. Clone and Setup Environment

```bash
git clone <repository-url>
cd Prism
```

---

### 3. Backend Setup & Initiation

The backend is built with FastAPI, SQLite / PostgreSQL, and async SQLAlchemy.

```bash
# Navigate to backend directory
cd backend

# Create and activate a Python virtual environment
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI backend server
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

> **Backend Health Check:**  
> Verify backend is running by opening: `http://localhost:8000/docs` (Swagger UI) or `http://localhost:8000/health`.

---

### 4. Frontend Setup & Initiation

The user interface is powered by React 19, Vite 8, and dynamic dark/light telemetry styling.

```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install Node modules
npm install

# Start the Vite development server
npm run dev
```

> **Frontend Access:**  
> Open your browser at: **`http://localhost:5173`**

---

## 🚀 Key Modules & Navigation Routes

| Route | Module | Purpose |
|---|---|---|
| `/p/:projectKey/board` | **Live Triage Board** *(#1 Priority)* | Real-time Kanban board with pulsating radar beacon, priority filters, team comments, and evidence lockers. |
| `/admin/overview` | **Enterprise Admin Console** | Platform health, multi-project usage, connectors catalog & security policies. |
| `/admin/projects` | **Projects Fleet** | Register new enterprise projects, configure tiers, and manage project lifecycles. |
| `/p/:projectKey/overview` | **Project Command Center** | Real-time SLA compliance, MTTA/MTTR metrics, active incidents, and telemetry feeds. |
| `/p/:projectKey/triage` | **Auto-Triage Hub** | Live Jira/ServiceNow polling, triage feed, service flow visualizer, root cause analysis, GitLab diff approvals. |
| `/p/:projectKey/investigations` | **Autonomous Investigation Stream** | Interactive multi-stage thinking progress card with live telemetry peeks, steering chips, and approval cards. |
| `/p/:projectKey/metrics` | **SRE Reliability & Metrics** | Interactive dual-curve SVG area chart (MTTA/MTTR), SLO error budget gauge, daily velocity histogram & squad matrix. |
| `/p/:projectKey/setup` | **Setup & Studio** | Multi-queue JQL generator, datasource connectors forum, dynamic environment flow, runbook uploader. |
| `/p/:projectKey/environments` | **Environment Resolver** | Interactive conduit mapping connecting project environments to tool instances without hardcoding. |
| `/p/:projectKey/reports` | **Autonomous SRE Reports** | 4-cycle historical improvement curves, triage stats, agent metrics, and SendGrid executive email brief dispatcher. |
| `/p/:projectKey/feedback` | **Domain Feedback Loop** | Engineer validation, accuracy scoring, and reinforcement learning signals for ADK agents. |

---

## 📦 Sentrix Customization Skills Catalog (`skills/`)

A turnkey architectural skill catalog is available in `skills/` to replicate the Sentrix platform into any React/Next.js/FastAPI codebase:
- [`skills/sentrix-platform-architecture/SKILL.md`](./skills/sentrix-platform-architecture/SKILL.md): Master design system, color tokens, and implementation guidelines.
- [`skills/sentrix-platform-architecture/InvestigationStreamChat.jsx`](./skills/sentrix-platform-architecture/InvestigationStreamChat.jsx): Standalone investigation stream with interactive thinking progress card.
- [`skills/sentrix-platform-architecture/SentrixAutonomousChat.jsx`](./skills/sentrix-platform-architecture/SentrixAutonomousChat.jsx): Standalone drop-in chat component with zero-trust action approvals.
- [`skills/sentrix-platform-architecture/COMPONENT_ARCHITECTURE_AND_HIGHLIGHTING_REPORT.md`](./skills/sentrix-platform-architecture/COMPONENT_ARCHITECTURE_AND_HIGHLIGHTING_REPORT.md): Deep-dive report on component architecture, highlighting logic, and interactive graphs.
- [`skills/sentrix-platform-architecture/INVESTIGATION_STREAM_AND_APPROVALS_SPEC.md`](./skills/sentrix-platform-architecture/INVESTIGATION_STREAM_AND_APPROVALS_SPEC.md): Agent triggers, tool conduits, and cryptographic action approval state machines.

---

## 🛠️ Multi-Queue Jira & ServiceNow Ingestion

Sentrix polls Jira queues and ServiceNow incident tables concurrently without hardcoded parameters:
- **JQL Pattern**:
  ```sql
  project = "BILLING" AND (queue in ("BILLING-SRE-QUEUE", "PAYMENTS-GATEWAY-QUEUE") OR fixTeam = "Payments Core Team" OR assignee in ("sarah.k@company.com")) AND status in ("Open", "In Progress", "Escalated") ORDER BY priority DESC
  ```
- **ServiceNow Table**: `sn_incident` filtered by CMDB CI `cmdb_ci_service=Billing Gateway`.

---

## 🔐 Cryptographic Remediation Safeguards
- **Read-Only Auto-Triage**: All diagnostic queries executed through the Tool Broker are strictly read-only (`SELECT`, `kubectl get`, `datadog query`).
- **Governed Action Proposals**: Any modifying action (restarting pods, tripping circuit breakers, scaling pools, applying database indexes) generates a **Cryptographic Action Proposal** awaiting manual domain engineer approval.
- **GitLab MR Automation**: Fix branches (e.g. `fix/BILL-1049-hikari-pool`) and before/after merge requests are pre-staged for one-click human verification.

---

## 🧪 Production Build & Validation

To test and build the production bundle:

```bash
# Frontend production build
cd frontend
npm run build

# Backend automated test suite
cd ../backend
pytest
```
