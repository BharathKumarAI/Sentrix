# Sentrix Platform: Component Architecture & Highlighting Engineering Report

This document delivers an exhaustive technical analysis of how each core component in the Sentrix Autonomous SRE Platform is architected, how state flows through the system, and the exact design engineering behind its visual highlighting mechanisms.

---

## 1. Highlighting Engineering & Visual Cues

A primary requirement of an autonomous SRE platform is providing instantaneous visual comprehension under high-stress incident triage. Sentrix employs a multi-tiered highlighting architecture:

### A. Service Flow Failure Highlighting (Visual DAG)
In [AutoTriageHub.jsx](file:///Users/kbk/Desktop/Prism/frontend/src/components/AutoTriageHub.jsx) and the incident deep-dive drawer:
- **Architecture:** The service flow is represented as a directional node array:
  `Client/Webhook` ──► `Envoy Edge Proxy` ──► `Service Runtime` ──► `Database/Store`.
- **Failure Hop Detection:**
  Each hop contains a `status` property (`"HEALTHY" | "DEGRADED" | "FAILED"`). When `hop.status === "FAILED"`:
  1. **Pulsing Aura Animation:**
     ```css
     box-shadow: 0 0 24px rgba(239, 68, 68, 0.45);
     border: 1.5px solid var(--accent-rose, #ef4444);
     background: rgba(239, 68, 68, 0.12);
     ```
  2. **Latency & Error Badging:** The failed hop displays an urgent red pill with live latency readouts (e.g. `30,000ms [FAILED: 20/20 connections saturated]`), instantly signaling where the cascading bottleneck occurred.
  3. **Healthy Hop Contrast:** Upstream and downstream healthy nodes are rendered with subdued borders (`var(--border-subtle)`) and muted teal badges (`9ms`, `14ms`), maximizing visual contrast against the failed node.

### B. Unified Code Diff Highlighting (GitLab Proposal)
In [AutoTriageHub.jsx](file:///Users/kbk/Desktop/Prism/frontend/src/components/AutoTriageHub.jsx) and [SentrixAutonomousChat.jsx](file:///Users/kbk/Desktop/Prism/frontend/src/components/SentrixAutonomousChat.jsx):
- **Diff Parsing Engine:** Code snippets are processed through a line-by-line diff analyzer:
  - Lines beginning with `+` are styled with `color: var(--accent-teal, #10b981)` and `background: rgba(16, 185, 129, 0.08)`.
  - Lines beginning with `-` are styled with `color: var(--accent-rose, #ef4444)` and `background: rgba(239, 68, 68, 0.08)`.
  - Context lines are rendered in `var(--ink-secondary, #94a3b8)`.
- **Side-by-Side Viewport:**
  - **Left Column (BEFORE):** Shows current production configuration with red highlights on the defect lines.
  - **Right Column (AFTER):** Shows proposed autonomous remediation with teal highlights on the expanded limits.
  - **Branch Auto-Naming Pill:** Auto-generates the target branch badge (`fix/{ticket_id}-{descriptor}`) in `JetBrains Mono` typography.

### C. Priority & Criticality Badge Highlighting
- Priority levels map to high-visibility CSS badge utilities:
  - `P1 Critical` ──► `.badge-rose` (`background: rgba(239, 68, 68, 0.15)`, `color: #ef4444`, `border: 1px solid rgba(239, 68, 68, 0.3)`)
  - `P2 High` ──► `.badge-magenta` (`background: rgba(217, 70, 239, 0.15)`, `color: #d946ef`, `border: 1px solid rgba(217, 70, 239, 0.3)`)
  - `P3 Medium` ──► `.badge-amber` (`background: rgba(245, 158, 11, 0.15)`, `color: #f59e0b`, `border: 1px solid rgba(245, 158, 11, 0.3)`)
  - `Live / Verified` ──► `.badge-teal` with an animated pulsing dot (`width: 6px`, `height: 6px`, `border-radius: 50%`, `animation: pulse 1.5s infinite`).

### D. Search & Substring Highlighting
- Filters throughout `AutoTriageHub`, `LiveTriageBoard`, and `OkfKnowledgeBrowser` execute real-time regex matching across ticket keys, service names, and root cause descriptions. Matching cards immediately highlight with a cyan active ring (`border-color: var(--prism-pink)`).

---

## 2. Component Architecture Breakdown

### 1. `AutoTriageHub.jsx`
- **Location:** `frontend/src/components/AutoTriageHub.jsx`
- **Purpose:** Ingests live incidents, executes autonomous triage with ADK 2.8, surfaces in-line root cause intelligence, and provides an interactive remediation studio.
- **Key Modules:**
  1. **Polling Controller:** Switchable between Jira JQL Multi-Queue and ServiceNow CMDB polling modes. Renders live sync latency, next scheduled poll countdown, and active poller health.
  2. **Automated Runs Track Bar:** 3 metric cards tracking Ingestion Poller status, Autonomous Triage MTTA (mean 18 seconds), and Automated Reporting execution status.
  3. **In-Line Incident Feed:** Structured table rows showing:
     - Ticket Key & Ingestion Source
     - Priority Pill
     - Incident Title
     - Identified Fix Team
     - Identified Root Cause
     - Triage Confidence Score & MTTA
     - Direct Action: **`Open Triage Report & Chat`**
  4. **Deep-Dive Remediation Drawer:**
     - Executive summary
     - Service flow DAG with failure highlight
     - Primary and secondary root cause breakdown
     - Side-by-side Before/After code diff
     - One-click **`Approve & Merge to GitLab`** action
     - Tool evidence viewers (PostgreSQL, Datadog, Kubernetes, Splunk)
     - Embedded conversational AI assistant

---

### 2. `SentrixAutonomousChat.jsx`
- **Location:** `frontend/src/components/SentrixAutonomousChat.jsx` and `skills/sentrix-platform-architecture/SentrixAutonomousChat.jsx`
- **Purpose:** Standalone, reusable conversational agent interface tailored for incident diagnosis.
- **Key Capabilities:**
  1. **Markdown & Table Parser:** Built on `react-markdown` + `remark-gfm` to render formatted markdown, bold callouts, lists, and tables without unstyled raw text.
  2. **Collapsible Thinking Process Accordion:** Captures the autonomous agent's intermediate diagnostic reasoning steps (e.g. *"Queried pg_stat_activity... Found 20 connections holding lock"*), keeping the main response concise while offering complete transparency upon clicking.
  3. **Diagnostic Tool Artifact Cards:** Renders executed SQL queries, shell commands, and tabular result sets with one-click copy buttons.
  4. **Governed Action Proposal Card:**
     - High-visibility amber card displaying the proposal ID, blast radius, target file, and color-coded diff.
     - Contains interactive **`Dismiss`** and **`Authorize & Apply Patch`** buttons. Approving updates state to `Authorized & Deployed` and appends an execution confirmation message to the chat history.
  5. **Quick-Action Prompt Chips:** Pre-seeded prompt chips (e.g. *"Explain primary vs secondary root cause"*, *"Draft incident postmortem"*) allowing one-click inquiry.

---

### 3. `LiveTriageBoard.jsx`
- **Location:** `frontend/src/components/LiveTriageBoard.jsx`
- **Purpose:** Real-time multi-stage Kanban board tracking incident dispatch and team activity.
- **Key Features:**
  - **4 Lifecycle Columns:** `Incoming Triage` ──► `Autonomous Investigation` ──► `Action Handoff` ──► `Resolved & Verified`.
  - **Stage Transition Controls:** Allows one-click stage advance from any card with automatic team reassignment.
  - **Evidence Locker & Comments Feed:** Tabbed view displaying team comments, uploaded log snippets, and real-time engineer updates.
  - **Cryptographic Evidence Detail Modal:** Inspects queries, payload snapshots, and OKF runbook references for any selected ticket.

---

### 4. `EnvironmentMatrixEditor.jsx`
- **Location:** `frontend/src/components/EnvironmentMatrixEditor.jsx`
- **Purpose:** Zero-hardcoding interactive visual matrix connecting project environments to concrete tool connector endpoints.
- **Key Features:**
  - **Dynamic Environment Handling:** Automatically reads the project's unique `environments` array (e.g. custom region tiers, cluster names, or test namespaces)—never hardcoded.
  - **Interactive SVG Conduits:** Visual animated connection lines linking the selected project environment to its resolved tool target.
  - **Live Handshake Probes:** Test button that executes an instantaneous socket probe to verify latency and connectivity to the remote tool endpoint.
  - **Add & Edit Mapping Modals:** Allows engineers to map new tool instances or update connection timeouts and target hosts on the fly.

---

### 5. `ProjectSetupStudioPage.jsx`
- **Location:** `frontend/src/pages/ProjectSetupStudioPage.jsx`
- **Purpose:** Central command center for project configuration, datasource onboarding, and runbook ingestion.
- **6 Specialized Tabs:**
  1. **Multiple Jira Queues & Polling JQL:** Dynamic queue badge manager allowing multiple queues (`BILLING-SRE`, `PAYMENTS-GATEWAY`), team squad assignments, and team members roster, with automatic live JQL query string generation.
  2. **Datasources Forum:** Connection status, latency probes, and configuration for all connected tools.
  3. **Environment Mapping & Flow:** Embedded `EnvironmentMatrixEditor` with interactive telemetry conduits.
  4. **Agent Topology & Skills:** Visual DAG showing agent execution paths through the Tool Broker.
  5. **Prompts & Directives:** System prompt editor, model selector (Gemini 2.5 Pro, Claude 3.5 Sonnet, GPT-4o, vLLM), and inference temperature slider.
  6. **Runbooks Uploader & OKF:** Drag-and-drop markdown runbook uploader with automatic vector indexing into the OKF Knowledge Fabric.

---

### 6. `ProjectReportsPage.jsx` (Executive SRE Incident Reports & Email Dispatcher)
- **Location:** `frontend/src/pages/ProjectReportsPage.jsx`
- **Purpose:** Pre-computed operational retrospectives, failure mode trends, error budget burn rates, and automated executive email briefings.
- **Key Modules:**
  1. **Cadence Engine:** Instant toggling across `Daily Digest`, `Weekly SRE`, `Bi-Weekly Brief`, and `Monthly Board`.
  2. **Executive Narrative & Retrospectives:** Narrative summary, significant incident retrospectives table, and actionable preventative recommendations.
  3. **Autonomous Triage & Agent Performance Analytics:**
     - **MTTA Compression:** Real-time MTTA of 18 seconds vs 6.2m manual baseline (95% reduction).
     - **RCA Verification Rate:** 96.4% accuracy cross-verified by domain engineers.
     - **Governed Action Proposals:** 42 proposals staged, 40 approved, 0 breaches (100% write lock safety).
     - **On-Call Hours Saved:** 142 hours returned to engineering.
     - **Squad Dispatches:** Dispatches breakdown across Payments Core, Database Infra, Identity, and Cloud Infra.
  4. **Historical Reliability Improvement Trends (4-Cycle Visual Curve):**
     - 4-cycle MTTA compression progression (4.2m ──► 1.8m ──► 45s ──► 18s).
     - MTTR reduction (44.0m ──► 14.2m).
     - **-54% Recurring Incident Reduction** driven by continuous case-based learning in the OKF v2.0 fabric.
  5. **Interactive Executive Email Dispatcher Modal:**
     - Pre-populated recipient roster (`cto@company.com, vp-eng@company.com, sre-lead@company.com`).
     - Auto-formatted executive subject line.
     - Checkboxes to selectively attach triage stats, agent metrics, and historical trend curves.
     - One-click dispatch with simulated delivery confirmation (`200 OK via SendGrid Enterprise`).

---

### 7. `AdminOverviewPage.jsx` vs `AdminDashboardPage.jsx`
- **Separation of Concerns:**
  - **`/admin/overview` (Executive Control Plane):** Focused on business and governance metrics across the enterprise: multi-tenant fleet distribution, Tier-1 mission-critical project health, global MTTA/MTTR reduction, zero-trust write-lock compliance, and quick project registration.
  - **`/admin/dashboard` (Operational Telemetry):** Focused on real-time infrastructure performance: platform execution curves, API Gateway and database cluster health matrix, active system alerts, and model provider request distributions.

---

### 8. Interactive Graphs Everywhere & Universal Sidebar Expand (`ProjectMetricsPage.jsx` & `PrismSidebar.jsx`)
- **Universal Sidebar Expand:**
  - In `PrismSidebar.jsx`, the outer container `<aside>` is equipped with an `onClick` handler: `if (collapsed) setCollapsed(false)` and `cursor: collapsed ? "pointer" : "default"`.
  - When the sidebar is collapsed, clicking **anywhere** on the sidebar body, empty area, or icon bar immediately expands it back to the full 240px width with a smooth CSS transition (`transition: width 0.2s var(--ease)`).
- **Interactive Telemetry Graphs Everywhere:**
  1. **Interactive MTTA & MTTR Compression SVG Area Chart:**
     - Dynamic dual-curve SVG area visualization contrasting manual human MTTR baseline (44m) vs Autonomous Sentrix Agent (14.2m).
     - Full mouseover scrubbing: hovering over curve nodes renders an interactive tooltip displaying MTTA in seconds, MTTR in minutes, total incidents handled, and human time savings.
  2. **Interactive SLI/SLO Error Budget Burn Gauge:**
     - Multi-track circular SVG gauge tracking 99.98% 30-day rolling availability against the 99.90% SLO threshold.
     - Live error budget calculation (`85.8% Budget Remaining`) with real-time burn velocity tracking (`0.14x / hr`, 142 days remaining).
  3. **Interactive Daily Incident Ingestion Velocity Histogram:**
     - 7-day stacked bar chart categorizing P1 Critical (Rose), P2 Major (Amber), and P3 Minor (Teal).
     - Hovering any bar renders a glassmorphic breakdown card with peak surge hour (`14:20 UTC`), top affected microservice, and identified root cause.
     - Clicking any bar dynamically filters the dashboard metrics to that specific day.
  4. **Interactive Root Cause Category Distribution with Drilldowns:**
     - Interactive progress bars with percentage readouts.
     - Clicking any root cause category expands affected services (`Stripe Webhook Worker, Postgres Primary`) and links matching Jira incident tickets (`BILL-1049, BILL-1021`).
  5. **Interactive Engineering Squad Matrix:**
     - Interactive table comparing application squads across Mean TTA, Mean TTR, RCA accuracy, and active queue count with subtle hover row highlighting.

---

### 9. Interactive Top Bar Detail Popovers Architecture (`PrismTopBar.jsx`)
- **Click-to-Reveal Details:**
  Every interactive element in the top navigation bar displays rich diagnostic details and contextual actions when clicked:
  1. **Project Pill Details Popover:**
     - Displays Tier classification (`Tier-1 Critical`), SLA compliance (`99.98% Adherence`), Incident MTTR (`14.2 min`), primary Jira queue (`BILLING-SRE-QUEUE`), active on-call engineer, and 1-click jumps to the Live Triage Board & Setup Studio, plus the complete multi-project switcher roster.
  2. **Global Command Palette (`⌘K`):**
     - Clicking or pressing `⌘K` opens an interactive palette with direct jumps to Mission Control, Auto-Triage, Investigation Stream, and SRE Metrics, alongside quick incident ticket matches (`BILL-1049`).
  3. **Notification Center (`Bell` Icon):**
     - Displays 4 live incident telemetry alerts categorized by severity (Critical, Major, Action Required, Auto-Triaged) with timestamp, root cause snippet, `Mark All Read` toggle, and direct link to the Live Triage Board.
  4. **Platform Help & Cheatsheet Popover (`HelpCircle`):**
     - Displays engine runtime version (`ADK 2.8 • Gemini 2.5 Pro`), FastAPI daemon health, zero-trust write-lock status, and platform keyboard shortcuts (`⌘B`, `⌘K`, `Esc`).
  5. **Platform Governance & Session Settings (`Settings`):**
     - Displays current dynamic environment, polling cadence (`30s`), and telemetry broker status with a direct link to the Environment Matrix Editor.
  6. **Engineer Identity & Delegated Authority Card (`User Avatar`):**
     - Displays authenticated engineer credentials, cryptographic OAuth2 write delegation token validity (`Valid for 6h 42m`), assigned squad (`Payments Core Team`), and on-call shift details with a 1-click role switcher (`Admin Console` / `Project View`).

---

### 10. Framework Feedback Modal & Extensibility Documentation (`FrameworkFeedbackModal.jsx` & `DocsPage.jsx`)
- **Top Bar Feedback Button & Diagnostics Modal:**
  - Placed directly in the header cluster with brand-pink accent and `MessageSquarePlus` icon.
  - Supports reporting framework-level issues (chat stream disconnects, broker failures), submitting feature requests (new connectors, custom skills), and reporting performance lags.
  - Automatically captures environment context (Project key, dynamic environment name, engineer identity, browser/OS user-agent, ISO timestamp).
  - Dispatches feedback, generates an immediate tracking code (`STX-FEEDBACK-xxxx`), and stores it in persistent logs.
- **Extensibility & Developer Documentation Hub (`DocsPage.jsx`):**
  - Integrated into `/docs`, `/admin/docs`, `/p/:projectKey/docs`, and linked directly from the TopBar Help Popover.
  - Contains full code recipes and schemas for:
    1. **Adding Custom Python Tools:** Tool Broker registration, parameters JSON schema, and read-only vs. action proposal governance.
    2. **Model Context Protocol (MCP):** Anthropic & Google ADK standard stdio/SSE transports, dynamic Gemini tool synthesis, and `mcp_config.json`.
    3. **Datasource Connectors:** Subclassing `BaseConnector`, heartbeat probes, and credential security.
    4. **Autonomous SRE Agents:** Google ADK 2.8 on Gemini 2.5 Pro architecture, iterative reasoning loops, and OKF v2.0 correlation.
    5. **Interactive Tool Schema Validator:** In-browser JSON schema validation widget for testing custom tool definitions prior to production deployment.

---

## 3. How to Replicate in Any Codebase

1. **Copy the Standalone Chat Component:**
   Import [SentrixAutonomousChat.jsx](./SentrixAutonomousChat.jsx) directly into your React application:
   ```jsx
   import { SentrixAutonomousChat } from "./SentrixAutonomousChat";

   export function IncidentView({ ticket }) {
     return (
       <div style={{ height: "650px" }}>
         <SentrixAutonomousChat
           ticketKey={ticket.key}
           serviceName={ticket.service}
           onActionApprove={(proposal) => handleDeploy(proposal)}
         />
       </div>
     );
   }
   ```

2. **Adopt the Design Tokens:**
   Import the CSS variables from `SKILL.md` into your root stylesheet.

3. **Mount the Unified Page Hero:**
   Wrap every page header in the 48x48 gradient icon card template to ensure instant visual consistency across all console routes.
