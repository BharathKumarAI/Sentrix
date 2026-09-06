# Investigation Stream: Agent Triggers, Diagnostic Conduits & Governed Approvals Specification

This specification documents the exact engineering architecture of the **Investigation Stream**, detailing how autonomous agents are triggered, how tool conduits are dispatched in real-time, and how cryptographic action approvals enforce zero-trust security before state modifications occur.

---

## 1. Agent Trigger Lifecycle

An autonomous investigation stream is initiated through one of three pathways:
1. **Automated Webhook Fire:** PagerDuty, AlertManager, Prometheus Alert, or Datadog Monitor webhook hits `/api/investigations/trigger` with an incident payload.
2. **Scheduled Polling Dispatch:** Auto-triage hub poller detects a new high-priority ticket matching the project's dynamic JQL or ServiceNow filter.
3. **Interactive Engineer Trigger:** A domain engineer opens the Investigation Stream and submits a natural language query or clicks an alert card.

```
┌─────────────────────────┐
│ Incident Alert Trigger  │ (PagerDuty / JQL / Manual Prompt)
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Autonomous SRE Runtime  │ (Google ADK Engine)
└───────────┬─────────────┘
            ├──────────────────────────┐
            ▼                          ▼
┌───────────────────────┐   ┌───────────────────────────┐
│ Read-Only Telemetry   │   │ Governed Action Proposal  │
│ Tool Broker Execution │   │ (Modifying State / Write) │
└───────────┬───────────┘   └──────────┬────────────────┘
            │                          │
            │                          ▼
            │               ┌───────────────────────────┐
            │               │ Human-in-the-Loop Approval│
            │               │ (ActionApprovalCard)      │
            │               └──────────┬────────────────┘
            │                          │ (Authorized)
            ▼                          ▼
┌───────────────────────┐   ┌───────────────────────────┐
│ Correlated Diagnostic │   │ Tool Broker Execution     │
│ Artifacts & Timeline  │   │ (Kubectl / Jira / Schema) │
└───────────────────────┘   └──────────┬────────────────┘
                                       │
                                       ▼
                            ┌───────────────────────────┐
                            │ Post-Remediation Telemetry│
                            │ Verification (p99 < 20ms) │
                            └───────────────────────────┘
```

---

## 2. Real-Time Tool Trigger Visualization

As the autonomous agent progresses through its root cause tree, it triggers specific tool conduits through the **Guarded Tool Broker**:

### Real-Time UI Feedback:
- **Header Trigger Badges:**
  Every message header displays live pills indicating which external systems were queried:
  ```jsx
  <span className="mono badge badge-teal">
    <Zap size={9} /> Triggered: POSTGRESQL PRIMARY
  </span>
  <span className="mono badge badge-teal">
    <Zap size={9} /> Triggered: DATADOG APM
  </span>
  ```
- **Active Diagnostic Conduits Bar:**
  A top drawer displays all connected external tools (PostgreSQL, Datadog, Kubernetes, Splunk, Jira Cloud). Domain engineers can toggle any conduit **ON** or **OFF** to constrain the agent's diagnostic scope.
- **Interactive Multi-Stage Thinking & Progress Card (While Agent Synthesizes):**
  When a prompt or incident is posted, instead of static loading text, an animated, interactive progress card keeps engineers actively engaged:
  1. **Neon Shimmer Progress Bar:** Live progress percentage (`24% → 58% → 84% → 96%`) with animated multi-stage gradient flow (`.thinking-progress-bar`).
  2. **4 Sequential Diagnostic Milestones:**
     - `Stage 1/4: Tool Broker Dispatch` (PostgreSQL, Datadog APM, Splunk query dispatch).
     - `Stage 2/4: Telemetry Extraction` (Connection pool exhaustion & lock contention trace).
     - `Stage 3/4: OKF v2.0 Correlation` (Historical incident cases & runbook match scores).
     - `Stage 4/4: RCA Synthesis & Staging` (Formulating root cause & staging action proposals).
  3. **Interactive Live Telemetry Peeks (Zero Boredom):**
     Engineers can click peek chips while waiting to inspect live diagnostic packets:
     - 🐘 `[Peek: PostgreSQL Locks]` -> Shows `pg_stat_activity: 20/20 saturated, PID 19420 holding lock`.
     - 🐶 `[Peek: APM Latency Spike]` -> Shows `Datadog APM: 420 PoolAcquireTimeoutException errors/min`.
     - ☸️ `[Peek: Pod Restarts]` -> Shows `stripe-webhook-worker: 4 restarts in last 10m`.
  4. **Interactive Steering Guidance Chips:**
     Engineers can guide the agent's synthesis on the fly:
     - 🎯 `[Focus Connection Pool]`
     - 🔍 `[Focus Envoy 504]`
     - ⚡ `[Check Recent Git Commits]`
     Shifts the agent's diagnostic focus and updates prompt context in real-time.
  5. **Cancel / Redefine Action:** Immediate `[Cancel]` button to abort or rephrase.
- **Thinking Process Accordion (Post-Execution):**
  Once generated, intermediate reasoning steps collapse into a neat accordion (`⚡ 1.4s`) with one-click full transparency.

---

## 3. Dynamic Multi-Modal Diagnostic Artifacts

The Investigation Stream does not merely return plain text; it renders rich, interactive domain artifacts:

### 1. Root Cause Analysis (`RCA_REPORT`)
- Displays verified root cause summary, blast radius, affected customer accounts, and SLA impact.
- **Incident Event Chronology:** Step-by-step timeline detailing how the incident escalated from initial webhook spike to thread saturation.

### 2. Metric Latency Graph (`METRIC_CHART`)
- Visual histogram tracking p99 response times against error rate volumes.
- Healthy baseline intervals render in emerald teal (`#10b981`), while saturated timeout intervals spike into the neon gradient (`#ec4899`) with glow effects (`var(--prism-glow)`).

### 3. Governed Data Tables (`DATA_TABLE`)
- Tabular outputs from database diagnostic queries (e.g. `pg_stat_activity`, Redis cache hit keys).
- Masking indicators for sensitive customer data (`PII Masked` badge).
- One-click **`Copy SQL`** button allowing engineers to replicate the exact diagnostic query in local shells.

---

## 4. Governed Action Proposals & Cryptographic Approvals

The platform enforces **Zero-Trust Autonomous Execution**: the agent is strictly prohibited from mutating system state without explicit engineer authorization.

### The `ActionApprovalCard` State Machine:

```
[PENDING_APPROVAL] ──► User Clicks "Approve" ──► (Is Jira OAuth required?)
                             │                          │
                             │ (No: Run Command)        ├──► YES: [AUTH_REQUIRED] ──► OAuth Modal ──► [AUTHENTICATED]
                             ▼                          │                                                    │
                      [EXECUTING]                       └────────────────────────────────────────────────────┘
                             │
                             ▼ (Broker Success)
                        [EXECUTED]  (Green Badge + Verification Telemetry Appended)
                             │
                    (Or User Clicks "Dismiss")
                             │
                             ▼
                        [REJECTED]  (Rose Badge + Audit Log Recorded)
```

### Supported Action Proposal Types:
1. **Kubernetes Deployment & ConfigMap Restarts (`RUN_COMMAND`):**
   - Displays target cluster (`k8s-prod-us-east-1`), risk level, and color-coded configuration diff.
   - Clicking **`Approve & Execute via Broker`** invokes the Tool Broker to patch the deployment and initiates a rolling restart.
2. **Jira Ticket Delegated Updates (`JIRA_COMMENT`):**
   - When the agent proposes updating the Jira incident ticket with diagnostic RCA findings, it triggers the **OAuth Delegation Modal**.
   - Verifies the engineer's active delegated session identity (e.g. `sarah.j@company.com`) before posting the official comment to Jira.
3. **Database Schema & Connection Pool Patches:**
   - Displays SQL DDL modifications or HikariCP maximum pool size increases (`20 → 50`).

---

## 5. Post-Approval Verification Loop

Once an action proposal is executed:
1. The card status transitions to `EXECUTED` with a teal verification icon.
2. The agent automatically triggers a follow-up diagnostic probe to the affected tool conduit:
   - Queries `pg_stat_activity`: Asserts that active database connections dropped from `20/20` to `4/50`.
   - Queries Datadog APM: Asserts that p99 latency dropped from `30,000ms` back down to `18ms`.
3. The verified telemetry is posted into the stream as confirmation of incident resolution.
