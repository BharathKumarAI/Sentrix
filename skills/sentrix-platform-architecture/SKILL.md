---
name: sentrix-platform-architecture
description: Comprehensive blueprint, design tokens, UI component specifications, live chat patterns, and backend connector integration guide to replicate the Sentrix Autonomous SRE Platform in any frontend and backend codebase.
---

# Sentrix Autonomous SRE Platform Architecture & Design System Skill

Use this skill when building or upgrading a modern enterprise Site Reliability Engineering (SRE), incident response, autonomous agent, or multi-tenant operations platform. This guide provides exact design tokens, layout templates, component recipes, live chat streaming patterns, and backend connector integration architectures.

---

## 1. System Architecture & Core Principles

The Sentrix framework is structured around three non-negotiable architectural tenets:

1. **Zero-Hardcoding Environment & Tool Conduits:**
   - **No Hardcoded Environments:** Never hardcode fixed environment names. Projects declare their own arbitrary, fully customizable list of environments (e.g. region tiers, cluster names, deployment pipelines, tenant scopes) stored dynamically in `project.environments`.
   - **Decoupled Tool Deployments:** Tools, databases, and observability connectors maintain their own independent instance endpoints (e.g. replica clusters, agent gateways, multi-region hostnames).
   - **Interactive Dynamic Environment-to-Tool Mapping:** An interactive mapping resolver matches any project-defined environment to its concrete tool connector endpoint without hardcoded schemas or rigid enums.

2. **Guarded Tool Broker Security:**
   - **Read-Only Telemetry:** Autonomous agent diagnostic probes (`pg_stat_activity`, `kubectl get pods`, Datadog metrics, Splunk searches) are strictly read-only and execute automatically.
   - **Governed Action Proposals:** Any state-modifying action (restarting worker pods, scaling connection pools, applying schema migrations, merging GitLab branches) generates a cryptographic proposal requiring manual domain engineer approval.

3. **OKF v2.0 (Organizational Knowledge Fabric):**
   - Incident signatures, past postmortems, diagnostic playbooks, and runbook solution steps are stored with vector embeddings for continuous retrieval during auto-triage.

---

## 2. Design Tokens & Visual Hierarchy

### Dark Mode (Primary Palette)
```css
:root {
  /* Surface & Elevation */
  --bg-app: #070a1c;
  --bg-card: #0b102b;
  --bg-elevated: #111638;
  --bg-input: rgba(0, 0, 0, 0.35);
  --border-card: rgba(255, 255, 255, 0.08);
  --border-subtle: rgba(255, 255, 255, 0.06);

  /* Brand Accents */
  --prism-pink: #ec4899;
  --prism-magenta: #d946ef;
  --accent-teal: #10b981;
  --accent-violet: #8b5cf6;
  --accent-amber: #f59e0b;
  --accent-rose: #ef4444;

  /* Gradients & Glow */
  --prism-gradient: linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%);
  --prism-glow: rgba(236, 72, 153, 0.3);

  /* Typography Colors */
  --ink-primary: #ffffff;
  --ink-secondary: #94a3b8;
  --ink-tertiary: #64748b;
  --ink-muted: #475569;
}
```

### Light Mode Adaptive Tokens
```css
[data-theme="light"] {
  --bg-app: #f8fafc;
  --bg-card: #ffffff;
  --bg-elevated: #f1f5f9;
  --bg-input: #ffffff;
  --border-card: #e2e8f0;
  --border-subtle: #cbd5e1;
  --ink-primary: #0f172a;
  --ink-secondary: #475569;
  --ink-tertiary: #64748b;
}
```

---

## 3. Standard Framework Page Hero Specification

Every page in the application MUST adhere to the unified Page Hero Card layout:

```jsx
{/* Standard Framework Page Hero Card */}
<div
  className="prism-card"
  style={{
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "16px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-subtle)"
  }}
>
  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
    {/* 48x48 Gradient Icon Box */}
    <div
      style={{
        width: "48px",
        height: "48px",
        borderRadius: "12px",
        background: "var(--prism-gradient)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        boxShadow: "0 0 18px var(--prism-glow)"
      }}
    >
      <Icon size={24} />
    </div>

    <div>
      {/* Scope Tag & Context Badges */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "11.5px", fontWeight 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
          {SCOPE_TAG} • {SUBSYSTEM}
        </span>
        <span className="badge badge-teal">Status Indicator</span>
        <span className="badge badge-magenta">Feature Tag</span>
      </div>

      {/* Primary H1 Title & Subtitle */}
      <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
        {PageTitle}
      </h1>
      <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
        {PageDescription}
      </p>
    </div>
  </div>

  {/* Right Side Action Buttons */}
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <button className="btn-secondary" style={{ fontSize: "12px", gap: "6px" }}>
      Action One
    </button>
    <button className="btn-primary" style={{ fontSize: "12px", gap: "6px" }}>
      Action Two
    </button>
  </div>
</div>
```

---

## 4. Key Component Blueprints

### A. Auto-Triage Hub & Live Queue Poller
- **Data Ingestion:** Supports toggle between **Jira JQL Multi-Queue** and **ServiceNow Incident Tables** (`sn_incident`).
- **Telemetry Bar:** Displays poll heartbeat, sync latency, and automated report runs.
- **In-Line Incident Rows:**
  - Ticket ID (`BILL-1049`, `INC-9042`).
  - Priority badge (`P1 Critical`, `P2 High`).
  - Incident Title & Summary.
  - Assigned Fix Squad (`Payments Core Team`).
  - Root Cause Summary (`HikariCP Pool Starvation 20/20`).
  - Triage Status & MTTA score (`ACTION_STAGED`, `14s MTTA`).
  - Action: **`Open Triage Report & Chat`**.
- **Interactive Deep-Dive Drawer:**
  - **Executive Summary:** Plain-English domain narrative.
  - **Service Flow Visualizer:** Visual DAG (`Webhook -> Proxy -> Service -> DB`) with the broken node highlighted in pulsing red (`30000ms latency`).
  - **Incident Timelines:** Chronological sequence of alert triggers and diagnostic steps.
  - **Expanded Root Causes:** Primary root cause and secondary contributing factors.
  - **GitLab Code Diff:** Side-by-side Before/After syntax-highlighted code blocks, auto-named branch (`fix/{ticket_id}-{desc}`), and **`Approve & Merge to GitLab`** button.
  - **Recommended Fix Plan & Verification Plan:** Step-by-step instructions and synthetic assertion checks.
  - **Evidence by Tools:** Per-tool diagnostic output tabs (Postgres query analyzer, Datadog traces, Kubernetes pod logs, Splunk log excerpts).
  - **Impact & SLA Analysis:** Request loss, revenue at risk, and SLA degradation percentage.
  - **Embedded AI Assistant:** Contextual chat assistant capable of answering questions about root causes and query execution plans.

### B. Live Triage Kanban Board
- **4-Stage Lifecycle Columns:** `Incoming Triage` ──► `Autonomous Investigation` ──► `Action Handoff` ──► `Resolved & Verified`.
- **Top Metrics:** Active alerts count, unassigned queue count, average MTTA, and MTTR trend.
- **Card Elements:** Ticket Key, priority pill, service tag, auto-triaged badge, suggested fix squad, team activity badge, quick advance action (`Investigate`, `Stage Action`, `Resolve`).
- **Team Activity Feed:** Chronological team comments, evidence attachments, and engineer updates.
- **Interactive Detail Modal:** Full evidence locker, SQL queries executed, log payloads, and team comment box with instant state update.

### C. Project Setup Studio (`/p/:projectKey/setup`)
Contains 6 specialized tabs:
1. **Multiple Jira Queues & Polling JQL:** Dynamic JQL query generator supporting multiple queue tags, assigned squads, and team members roster.
2. **Datasources & Connectors Forum:** Per-tool connection cards (PostgreSQL, Datadog, Kubernetes, Redis, Splunk) with real-time latency probe testers.
3. **Environment Mapping & Flow:** Interactive SVG conduits mapping telemetry streams across user-defined project environments and tool clusters.
4. **Skills & Agent-Connector Topology:** Visual DAG showing agent execution through the Tool Broker with per-skill toggles.
5. **System Prompt & Directives:** Live system prompt editor, inference model selector (Gemini 2.5 Pro, Claude 3.5 Sonnet, GPT-4o, vLLM), and temperature slider.
6. **Runbooks Uploader & OKF:** Markdown runbook upload modal with automated indexing into the OKF Knowledge Fabric.

### D. Interactive Environment-to-Tool Mapping Studio
- **Project Environments on Left:** Dynamically rendered from the project's custom environment roster (never hardcoded; projects define their own arbitrary environment names).
- **Conduit Flow in Center:** Visual connection line indicating active resolution.
- **Tool Targets on Right:** Concrete tool instances (e.g. database replica endpoints, Kubernetes cluster contexts, logging clusters).
- **Interactive Actions:**
  - **`+ Map New Tool Environment`**: Select any project-defined environment, choose a tool connector from catalog, and enter resolved host/profile.
  - **`Edit (Change Mapping)`**: Modify the target host, connection timeouts, or connection notes.
  - **`Test Handshake`**: Live latency probe tester verifying socket connectivity.
  - **`Delete`**: Unlink the mapping from the active matrix.

---

## 5. Live Chat & Investigation Stream Blueprint

When implementing the conversational investigation interface:
1. **Server-Sent Events (SSE) Streaming:**
   - Stream events: `THINKING_CHUNK`, `TOOL_INVOCATION`, `TOOL_RESULT`, `ACTION_PROPOSAL`, `FINAL_RESPONSE`.
2. **Thinking Accordion:**
   - Display internal chain-of-thought reasoning inside a collapsible accordion (`"Thinking Process: Analyzed pg_stat_activity..."`).
3. **Adaptive Tool Artifact Rendering:**
   - Render database query results in interactive data tables.
   - Render latency metrics in SVG charts.
   - Render code modifications in syntax-highlighted diff cards.
4. **Cryptographic Action Approval:**
   - Embed `<ActionProposalCard>` for any modifying action with `Approve` and `Reject` buttons.

---

## 6. Real Backend Connector Wiring Architecture

### Database Schema (SQLAlchemy / PostgreSQL / SQLite)
```python
class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True)
    project_key = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String)
    default_environment = Column(String, nullable=True)
    # Dynamic list of user-defined environments (never hardcoded enums)
    environments = Column(JSON, default=list)

class ConnectorInstance(Base):
    __tablename__ = "connector_instances"
    id = Column(String, primary_key=True)
    connector_key = Column(String, nullable=False) # postgres, datadog, kubernetes, jira
    name = Column(String, nullable=False)
    base_url = Column(String, nullable=False)
    auth_type = Column(String, default="SERVICE_ACCOUNT")
    is_active = Column(Boolean, default=True)

class ProjectToolEnvMapping(Base):
    __tablename__ = "project_tool_env_mappings"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"))
    # Matches any user-defined environment string from project.environments
    project_environment = Column(String, nullable=False)
    connector_instance_id = Column(String, ForeignKey("connector_instances.id"))
    tool_environment = Column(String, nullable=False) # Concrete endpoint or profile
    is_active = Column(Boolean, default=True)
```

### Tool Broker Execution Pattern
```python
class ToolBroker:
    @staticmethod
    async def execute_query(project_id: str, project_env: str, tool_type: str, query: str):
        # 1. Dynamically resolve tool endpoint for this project's user-defined environment
        resolved = await EnvironmentResolver.resolve(project_id, project_env, tool_type)
        
        # 2. Enforce read-only constraint
        if not ToolBroker.is_read_only(tool_type, query):
            raise GovernanceException("Modifying actions require an authorized Action Proposal.")
            
        # 3. Execute via connector client
        client = ConnectorRegistry.get(tool_type, resolved.endpoint)
        return await client.query(query)
```

---

## 7. Step-by-Step Implementation Checklist

When replicating this architecture into a new or existing project:

1. **Tokens & Theme Foundation:**
   - Create or update `index.css` with the design tokens listed in Section 2.
   - Implement dark/light theme switching with `data-theme="light"` attributes on `<html>`.

2. **Navigation Shell (`PrismShell`):**
   - Left Sidebar: Collapsible navigation supporting both Admin (`/admin/*`) and Project (`/p/:projectKey/*`) scopes.
   - Top Header Bar: Dynamic breadcrumbs, Project Switcher dropdown with search, Dynamic Environment Switcher (populated from `project.environments`), and Theme Toggle.

3. **Page Hero Standardization:**
   - Ensure every page component mounts the standard Hero card (Section 3).

4. **Auto-Triage Hub Integration:**
   - Implement the in-line row view and deep-dive modal (Section 4A).

5. **Multi-Queue JQL & Setup Studio:**
   - Implement dynamic JQL query generation and connector probe testing (Section 4C).

6. **Interactive Environment-to-Tool Mapping:**
   - Implement the visual conduit flow and modal editors (Section 4D) using dynamic project environment arrays.

7. **Backend API Endpoints:**
   - Expose `/api/projects/{key}/configuration`, `/api/connectors/mappings`, and `/api/investigations/auto-triage`.

---

## 8. Interactive Telemetry Graphs Everywhere Specification

1. **Interactive MTTA & MTTR Compression SVG Area Chart (`ProjectMetricsPage.jsx`):**
   - Dual-curve SVG visualization showing manual baseline (44m) vs Autonomous Agent (14.2m).
   - Mouseover scrubber with floating glassmorphic tooltip reporting point-in-time MTTA (seconds), MTTR (minutes), and incident load.
   - Interactive KPI cards acting as graph filter toggles.

2. **Interactive SLI/SLO Error Budget Burn Gauge:**
   - Multi-track circular SVG gauge tracking 99.98% 30-day availability against 99.90% SLO.
   - Real-time burn velocity tracking (`0.14x / hr`, 142 days budget remaining).

3. **Interactive Daily Ingestion Velocity Histogram:**
   - Stacked P1/P2/P3 bars with glassmorphic hover cards displaying peak surge hour, top affected microservice, and root cause.
   - Click-to-filter drilldown isolating specific days with 1-click reset.

4. **Interactive Root Cause Category Breakdown:**
   - Click-to-drill progress bars revealing affected microservices and linked Jira tickets.

---

## 9. Interactive Thinking Animation & Telemetry Progress Stream (`InvestigationStream.jsx`)

When the autonomous agent processes an inquiry, instead of static loading text, an interactive progress card keeps engineers engaged:
1. **Neon Shimmer Progress Bar:** Animated gradient (`.thinking-progress-bar`: `linear-gradient(90deg, #ec4899, #8b5cf6, #10b981)`) advancing `14% → 96%`.
2. **4 Sequential Diagnostic Milestones:**
   - Stage 1/4: Tool Broker Dispatch
   - Stage 2/4: Telemetry Extraction
   - Stage 3/4: OKF v2.0 Correlation
   - Stage 4/4: RCA Synthesis & Staging
3. **Interactive Telemetry Peeks:** Clickable chips to inspect real-time raw packets while waiting (PostgreSQL locks, Datadog APM spike, Kubernetes pod crash loops).
4. **Interactive Steering Guidance Chips:** Buttons to steer agent focus mid-flight (e.g. `[Focus Connection Pool]`, `[Focus Envoy 504]`).
5. **Interactive Abort Action:** Immediate `[Cancel]` button to abort or rephrase.

---

## 10. Live Triage Board Priority & Modern Expander Suite (`PrismSidebar.jsx` & `PrismTopBar.jsx`)

- **Top Priority Navigation:** Positioned as the #1 item in the project sidebar under `TRIAGE & MISSION CONTROL`.
- **Live Radar Beacon Animation:**
  - Pulsing emerald radiant glow (`@keyframes liveTriagePulse`: `box-shadow: 0 0 22px rgba(16, 185, 129, 0.75)`).
  - Continuous radar ping beacon dot (`@keyframes radarPing`).
- **Modern Expander Suite (Visible Everywhere & Responsive):**
  1. **Floating Edge Expander Tab:** When collapsed, a high-contrast circular button with gradient background, white chevron, and live radar beacon rests on the right border (`.modern-sidebar-floating-tab`), hovering with smooth scale & radiant aura.
  2. **Footer Expander Dock:** Features a modern glassmorphic collapse pill with `PanelLeftClose` when expanded, and a prominent pink-accented `PanelLeftOpen` button when collapsed.
  3. **Universal Top Bar Toggle Button:** A dedicated sidebar expander button in `PrismTopBar.jsx` allows effortless toggling from any header bar.
  4. **Click-Anywhere Expansion:** Clicking anywhere on the collapsed sidebar body, background, or margins automatically expands it.
  5. **Keyboard Shortcut:** `⌘B` / `Ctrl+B` toggles the sidebar on any platform.
  6. **Universal Screen Fit:** Automatically adapts to screen dimensions—auto-collapsing on tablets and small laptops (≤ 1024px) to preserve maximum workspace clarity, with fixed full-height overlay on mobile devices (≤ 768px).

---

## 11. Top Bar Framework Feedback & Bug Reporting Modal (`FrameworkFeedbackModal.jsx`)

- **Top Bar Integration:** A dedicated glowing "Feedback" button in the right cluster of `PrismTopBar.jsx` opens an interactive glassmorphic modal for engineers to report platform issues or submit feature proposals.
- **Reporting Categories:**
  1. 🐞 **Framework Issue / Bug:** Used when the chat stream is unresponsive, a connector fails, or UI rendering glitches.
  2. 💡 **Feature Request:** Used to propose new datasource connectors, agent skills, or notification hooks.
  3. ⚡ **Latency / Performance:** Used to flag Gemini inference delay or connector probe timeouts.
- **Automated Diagnostic Attachment:** Automatically captures active project key, resolved dynamic environment, authenticated user identity, browser user agent, and timestamp.
- **Ticket Dispatch:** Generates an immediate tracking identifier (e.g. `STX-FEEDBACK-2049`) and records payloads into local state/backend storage.

---

## 12. Extensibility & Developer Documentation (`DocsPage.jsx`)

Accessible via `/docs`, `/admin/docs`, and `/p/:projectKey/docs`:
1. **Adding New Tools:** Python Tool Broker definitions, parameter schemas, and read-only execution vs. mutating Action Proposal requirements.
2. **Model Context Protocol (MCP):** Native stdio and SSE server integration, dynamic Gemini tool synthesis, and `mcp_config.json` specifications.
3. **Datasource Connectors:** `BaseConnector` subclassing, credential encryption, and heartbeat probe methods.
4. **Autonomous Agent Specifications:** Google ADK 2.8 on Gemini 2.5 Pro, OKF v2.0 correlation, and multi-turn SRE reasoning loops.
5. **Interactive Live Tool Schema Validator:** In-browser JSON schema validation widget for testing custom tool definitions prior to production deployment.



