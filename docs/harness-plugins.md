# DeepSeek Harness Plugin Architecture & Scoped Agent Composition

Sentrix incorporates a microkernel agent harness following an **"Everything is a Plugin"** design. Every runtime capability—from token budgeting to telemetry recording and root cause synthesis—is encapsulated as an isolated lifecycle plugin.

---

## 1. Harness Plugin Architecture

```mermaid
graph TB
    subgraph HarnessKernel["Sentrix Agent Harness Microkernel"]
        direction TB
        REG["HarnessPluginRegistry<br/>(Discovery, Initialization & Priority Pipeline)"]

        subgraph BuiltinPlugins["Built-in Core Plugins (Ordered Lifecycle Chain)"]
            BUDGET["ContextBudgeterPlugin<br/>(Tracks token footprints, truncates large payloads)"]
            FINOPS["FinOpsTrackerPlugin<br/>(Monitors inference costs, enforces project quotas)"]
            RECORD["SessionRecorderPlugin<br/>(Captures reproducible event & tool traces)"]
            RCA["RCAEnginePlugin<br/>(Constructs topological fault causality DAG)"]
        end

        REG --> BUDGET
        REG --> FINOPS
        REG --> RECORD
        REG --> RCA
    end

    subgraph ADKRuntime["Google ADK 2.8 Execution Engine"]
        AGENT["Project LlmAgent Instance"]
    end

    HarnessKernel <-->|Lifecycle Hooks (pre/post/stream)| AGENT
```

---

## 2. Configuration Inheritance Hierarchy

Harness configurations, instructions, and capability bindings inherit predictably from Platform down to Project:

```mermaid
flowchart TD
    PLATFORM["<b>Platform Scope</b><br/>Global base plugins, system safety boundaries, root instruction templates"]
    ORG["<b>Organization Scope</b><br/>Departmental compliance rules, organizational model quotas"]
    PROJECT["<b>Project Scope</b><br/>Domain runbooks, specific connector bindings, environment conduit overrides"]

    PLATFORM -->|Inherits & Overrides| ORG
    ORG -->|Inherits & Overrides| PROJECT

    PROJECT --> RESOLVED["<b>Resolved Effective Agent Configuration</b><br/>• Strict explicit operation bindings (no implicit union)<br/>• Keyed prompt & skill overrides<br/>• Enforced platform disabled status"]
```

### Inheritance Rules
1. **Explicit Binding Replacement:** A more specific plugin binding replaces the entire inherited binding. Operation permissions are never unioned implicitly.
2. **Keyed Prompt Overrides:** Instructions inherit by key. Supplying a `null` prompt entry explicitly removes an inherited prompt.
3. **Platform Override Supremacy:** If a plugin is disabled at the Platform scope, it can never be re-enabled at Organization or Project scopes.

---

## 3. Plugin Lifecycle Hook Pipeline

During an active investigation run, the harness invokes registered plugins at precise execution milestones:

```mermaid
sequenceDiagram
    autonumber
    participant Session as Agent Session
    participant Registry as Plugin Registry
    participant Budgeter as Context Budgeter
    participant FinOps as FinOps Tracker
    participant Broker as Tool Broker
    participant Model as LLM (Gemini/Claude)
    participant Recorder as Session Recorder

    Session->>Registry: on_session_start(context)
    Registry->>Budgeter: Initialize token window budget (e.g. 128k)
    Registry->>FinOps: Check project spend against budget ceiling
    Registry->>Recorder: Initialize immutable run ledger

    loop Investigation Iteration (Max 4 steps)
        Session->>Registry: pre_tool_execute(tool_name, params)
        Registry->>Budgeter: Ensure params fit within context window
        Registry->>Broker: Dispatch read-only query
        Broker-->>Registry: Telemetry payload
        Registry->>Recorder: Record raw tool output
        Registry->>Session: post_tool_execute(tool_name, sanitized_result)

        Session->>Model: Invoke Model with bounded context
        Model-->>Session: Streaming response / Tool request
        Session->>Registry: on_model_response(response, usage)
        Registry->>FinOps: Record token consumption & calculate cost
    end

    Session->>Registry: on_session_end(rca_summary)
    Registry->>Recorder: Finalize session trace & persist audit record
```

---

## 4. Admin Management & Configuration APIs

Harness configurations can be inspected and updated through the Enterprise Admin Console (**Admin → Harness Configuration**) or directly via REST APIs:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/admin/harness-configuration/plugins` | `GET`, `POST` | List and register read-only connector plugin definitions. |
| `/api/admin/harness-configuration/scopes/{scope}/{scope_id}` | `GET`, `PUT` | Read or update configuration for a specific scope (`platform`, `organization`, `project`). |
| `/api/admin/harness-configuration/projects/{project_id}/resolved` | `GET` | Retrieve effective compiled plugin catalog and instructions for a project. |
| `/api/admin/harness-configuration/projects/{project_id}/execute` | `POST` | Execute a test investigation run using the resolved harness agent with SSE streaming. |

---

## 5. Security Invariants & Execution Boundaries

- **Read-Only Enforced:** The harness only exposes diagnostic read operations. All state-mutating operations trigger cryptographic action proposals requiring human SRE authorization.
- **Per-Call Adapters:** Credential-bearing adapters are instantiated per execution call rather than maintained in a global cache, preventing cross-tenant credential leakage.
- **Dynamic Policy Re-check:** On every tool invocation, the harness re-verifies the live configuration. Disabling a plugin immediately halts ongoing tool dispatches even for an in-flight agent session.

---

*Sentrix Harness Engine — Extensible, Governed, and Observable Agent Runtime.*
