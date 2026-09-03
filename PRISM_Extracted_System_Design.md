Detailed System Design

Backend, Frontend, APIs, Agent Runtime, Connectors, Skills, Security & Operations

PRISM - AI Investigation & Analysis Platform

Version 1.0 | September 2026 | Target: production-grade enterprise platform

1. Executive Summary

PRISM is designed as a governed investigation and resolution platform that combines conversational AI, project-scoped evidence retrieval, reusable skills, configurable connectors, human-approved actions, and auditable execution. The architecture deliberately separates reasoning from authorization: the model may decide what evidence to request and may propose an action, but platform policy and an explicit user approval determine whether a write is allowed and under whose identity it executes.

The central design goal is extensibility without losing control. Projects should be able to add new connectors, skills, prompts, models, and configuration without changing the core runtime. At the same time, every run must be reproducible: the platform records the resolved skill versions, connector bindings, prompt/config snapshots, model route, tool calls, evidence, approvals, and action outcomes.

The selected agent integration path uses Google ADK with LiteLLM-based model routing. The supplied smoke-test already demonstrates the intended minimal composition: an ADK LlmAgent, LiteLlm model adapter, runner/session service, and tool invocation event stream. That proof should evolve into the production runtime described here rather than be wrapped directly into business APIs.

Architectural decision: treat the platform as four cooperating planes - Experience, Control, Runtime, and Integration/Data - instead of a single monolithic agent service.

Plane

Primary responsibility

Examples

Experience plane

User interaction and approval UX

Chat, projects, admin, action cards, run timeline

Control plane

Configuration, policy, registry and governance

Projects, parameters, skills, connector definitions, RBAC, approvals

Runtime plane

Agent execution and durable workflows

ADK runtime, tool broker, action service, job workers, run state

Integration/data plane

Access to external systems and durable evidence

Jira, Splunk, qTest, databases, object store, model gateway

1.1 Non-negotiable platform principles

LLM reasoning is not authorization. All protected access is enforced outside the model.

Read and write capabilities are modeled separately, even when they use the same external connector.

Every write is proposed first; high-impact or user-visible writes require explicit user approval before execution.

Approved writes execute with the approving user identity whenever the target system supports delegated identity; shared platform identities are fallback-only and visibly identified.

Project scope is applied before tool execution, not merely injected into prompts.

Connector protocol (native API, MCP, OAuth/delegated, service account, certificate) is an adapter concern and can change without rewriting skills.

Skills and prompts are versioned immutable artifacts. Publication and project binding are governance events.

New skill versions should not become default merely because they are newer; they must pass evaluation gates against the current baseline.

Configuration is schema-driven and inherits Platform -> Project -> Profile, with policy-controlled overrides.

All runs are observable and auditable end-to-end with correlated run, span, tool-call, approval and external-system IDs.

2. Scope and Product Model

2.1 Primary user journeys

Journey

User experience

System behavior

Investigate

Ask a question or provide an incident/ticket

Build context, retrieve evidence, correlate signals, preserve citations/evidence

Analyze

Request root-cause reasoning or comparison

Run skills/tools, normalize evidence, evaluate confidence and gaps

Resolve

Request recommended or executable remediation

Generate proposed actions with risk and required approval level

Collaborate

Share findings or update external records

Draft updates; execute only after approval under correct identity

Report

Create timeline, findings or metrics

Use immutable run/evidence data to produce reproducible outputs

2.2 Core domain objects

Object

Purpose

Key relationships

Tenant

Security/administrative boundary

Users, projects, platform policies

Project

Operational scope for investigation

Members, connector bindings, skills, prompts, configs

Profile

Persona/run defaults within a project

Prompt, model policy, skill set, parameter overrides

Conversation

User-facing thread

Messages and one or more runs

Run

Immutable execution attempt

Snapshot, events, tool calls, evidence, actions

Connector Definition

Reusable integration type

Capabilities, auth modes, configuration schema

Connector Instance/Binding

Configured project integration

Secrets refs, scopes, filters, protocol mode

Skill Version

Immutable executable/instruction bundle

Manifest, eval results, publication state

Action Proposal

Potential side effect

Target, payload, diff, risk, approval requirements

Approval

Human authorization record

Approver, proposal hash, expiry, decision

Evidence Artifact

Fetched/derived investigation data

Source, provenance, run, retention

3. Logical Architecture

Figure 1. Logical architecture - control and authorization remain outside model reasoning.

3.1 Request path

1. Frontend obtains/maintains an authenticated session with the PRISM API using Microsoft Entra OIDC.

2. The API creates or resumes a conversation and accepts a message with project/profile context.

3. Run Orchestrator resolves an immutable run snapshot: user authorization, project filters, model route, prompt version, skill versions, connector bindings, and parameter values.

4. ADK Runtime processes the message and invokes only tools registered for that resolved snapshot.

5. Tool Broker validates each requested call against user role, project scope, connector capability, data policy, and rate limits before dispatch.

6. Read results are normalized into evidence artifacts and streamed back as events; the model can continue reasoning from those results.

7. Any side-effect request becomes an Action Proposal rather than being executed directly.

8. Frontend renders the proposal and approval details. Approval creates a cryptographically bound authorization record.

9. Action Service executes the approved proposal through the connector adapter using the appropriate delegated user identity, persists outcome/audit, and emits completion events.

4. Backend Design

4.1 Service boundaries

Service/module

Responsibilities

Scaling / failure boundary

API Gateway/BFF

REST APIs, SSE/WebSocket stream, session/auth context, request validation

Stateless horizontal scale

Identity & Authorization

Entra callback, session lifecycle, RBAC/ABAC, project membership

Security-critical; isolated policy module

Run Orchestrator

Create snapshots, lifecycle, retries, cancellation, durable event sequence

Worker + DB backed; idempotent

Agent Runtime

Instantiate ADK agents, model/tool events, context assembly

Ephemeral compute; no authority to bypass broker

Tool Broker

Capability registry, policy checks, quotas, connector dispatch

Central enforcement point; stateless + cache

Connector Runtime

Protocol/auth adapters, normalized errors, pagination, retry

Per-connector concurrency pools

Skill Registry/Resolver

Version resolution, publication, project binding, cache materialization

Read-heavy; immutable artifacts

Action Service

Proposal, approval verification, execute/cancel/expire, audit

Transactional; strict idempotency

Config Service

Schema/parameter registry and inheritance resolution

Strong consistency for writes; cached reads

Evidence Service

Persist metadata, object pointers, provenance, redaction

Object store + metadata DB

Evaluation Service

Offline/online eval suites for prompts/skills/models

Async workers; CI integration

Audit/Telemetry

Append-only audit, metrics/traces/log correlation

High-volume asynchronous ingestion

4.2 ADK runtime composition

The production ADK layer should be a runtime adapter, not the application architecture. The supplied LiteLLM smoke test establishes the desired primitive wiring: LlmAgent + LiteLlm + Runner + Session + tool events. Production code should preserve those primitives while surrounding them with PRISM-owned policy, durable state, tracing, skill resolution, and connector brokering.

AgentFactory builds an ADK agent from a resolved RunSnapshot rather than reading environment variables directly.

ModelGatewayAdapter supplies a LiteLlm instance using model-route configuration and short-lived secret references.

ToolFactory registers PRISM tool proxy functions; those proxies call Tool Broker and never contain external credentials.

ADK session IDs are mapped to PRISM run IDs but PRISM remains the system of record for durable run state.

EventAdapter converts ADK function_call/function_response/text events into the platform event schema.

Cancellation, timeouts, budgets, max tool calls, and recursion limits are enforced by Run Orchestrator independent of prompt instructions.

4.3 Durable run state machine

State

Meaning

Allowed next states

CREATED

Run accepted; snapshot not yet locked

RESOLVING, CANCELLED

RESOLVING

Config/skills/connectors/policy being resolved

RUNNING, FAILED

RUNNING

Agent is reasoning or executing read tools

WAITING_APPROVAL, COMPLETED, FAILED, CANCELLED

WAITING_APPROVAL

At least one blocking action proposal requires a decision

RUNNING, COMPLETED, CANCELLED, EXPIRED

COMPLETED

Run reached a terminal successful response

-

FAILED

Terminal runtime failure

Optional explicit retry creates a new run attempt

CANCELLED

User/system cancelled execution

-

EXPIRED

Required approval or credential expired

New action proposal/run may be created

4.4 Run snapshot contract

A run snapshot is immutable after RUNNING. This is the reproducibility boundary and should be stored as a versioned JSON document plus normalized foreign keys for queryability.

Snapshot area

Examples

Identity

tenant_id, user_id, auth_strength, group/role claims hash

Scope

project_id, profile_id, allowed data scopes, project filters

Model

route_id, provider/model logical name, inference parameters, policy version

Prompt

system prompt version, profile prompt version, dynamic context template version

Skills

skill_id + exact version + artifact digest + manifest digest

Connectors

binding_id + adapter version + capability set + project filters

Configuration

resolved parameters + source level + secret reference IDs (never plaintext)

Policies

authorization policy version, redaction policy, approval policy, budget limits

5. Identity, Authorization and Delegated Actions

5.1 Microsoft Entra OIDC

Use tenant-restricted Microsoft Entra OIDC with server-side authorization-code exchange and certificate-authenticated confidential-client behavior. The browser receives only an application session cookie; provider tokens remain server-side. Session records are durable, revocable, rotated, and bound to user/tenant identity.

Protect application pages and APIs by default; explicitly mark anonymous health/static endpoints.

Validate issuer, tenant, audience, nonce, state, code verifier where applicable, and token timing claims.

Resolve user identity into internal user + memberships; do not directly trust UI-provided project IDs for authorization.

Use short session TTL with renewable server-side session and explicit logout/revocation handling.

Never store external-system OAuth access tokens in browser local/session storage.

5.2 Read authorization

Authenticated viewers may use approved read-only platform tools, but each request is narrowed by project-level policy. A broad connector may be platform-managed while its project binding injects fixed Jira projects, Splunk indexes, qTest projects, environments, database schemas, or comparable scopes. The user cannot widen those filters through prompts or tool arguments.

5.3 Write authorization and approval

Figure 2. User-visible side effects are proposed, approved, then executed with delegated identity.

The UI approval record must be bound to the exact action content. Approval of “add Jira comment X” must not authorize a later modified payload Y. Store a canonical proposal hash that covers connector binding, operation, target resource, normalized payload, scope, required identity mode, and expiry.

Action class

Examples

Default policy

Read-only

Search Jira, fetch logs, query approved DB views

No per-call approval after authorization; fully audited

Low-risk write

Add Jira comment, create draft artifact

Explicit approval; delegated identity preferred

Moderate write

Transition issue, update fields, trigger job

Approval + stronger role/scope checks; optional re-auth

High-impact

Production change, destructive action, bulk update

Out of scope by default; separate privileged workflow / multi-party control

5.4 Identity used for Jira comments and similar writes

For a connector that supports user delegation, the Action Service retrieves the approver-specific external authorization grant and exchanges/refreshes it server-side. The external action is then attributable to that user. The platform service identity is used only for read operations or for targets that cannot support delegation, and those fallback writes should be clearly labeled in the approval UI and audit record.

Do not merely place the user name into the comment text while posting with a shared service account; that creates apparent attribution without real external-system attribution and weakens auditability.

6. Connector Framework

Figure 3. Connector business capability is stable while protocol and auth adapters remain replaceable.

6.1 Connector definition schema

Field group

Representative fields

Identity

key, display_name, description, icon definition, category, owner

Capabilities

read operations, write operations, streaming, attachments, search, health check

Protocols

native_api, mcp, sdk, database, filesystem; supported adapter versions

Authentication

oauth2_auth_code, oidc, api_key, certificate, service_account, managed_identity, none

Configuration schema

groups, fields, types, validation, defaults, sensitivity, override rules

Governance

data classification, allowed projects, approval rules, egress constraints

UI metadata

setup wizard sections, field help, test-connection behavior

Runtime metadata

timeouts, retry policy, rate limits, pagination, circuit-breaker settings

6.2 Adapter contract

Every connector adapter should expose a normalized platform interface so skills are independent of protocol details.

Method

Purpose

describe_capabilities()

Return operations and auth/capability metadata

health_check(context)

Validate configured instance without exposing secrets

invoke_read(operation, args, context)

Execute project-scoped read and return normalized evidence

propose_write(operation, args, context)

Validate and normalize a write into an Action Proposal; no side effect

execute_approved(proposal, approval, identity)

Execute an already-approved immutable action idempotently

normalize_error(error)

Convert provider error to stable PRISM error taxonomy

6.3 Switching API, MCP, OAuth and other modes

Protocol/auth selection belongs in Connector Instance configuration. A Jira connector definition can support native REST today and an MCP server tomorrow; the logical operation `jira.add_comment` does not change. The resolver selects an adapter based on project binding and capability policy. This prevents prompt/skill rewrites when infrastructure changes.

7. Parameter and Configuration Framework

Figure 4. Configuration resolution is deterministic and policy-constrained.

7.1 Parameter registry

Use a single schema-backed parameter registry to drive backend validation and frontend forms. Do not create independent environment variables and bespoke UI forms for every connector or feature.

Column / concept

Meaning

parameter_key

Stable hierarchical key, e.g. connector.jira.timeout_seconds

level_policy

Allowed levels: PLATFORM, PROJECT, PROFILE; indicates whether override is permitted

owner/group

Feature, connector, model, runtime, security, UI group

type

string, secret_ref, number, boolean, select, multi-select, JSON, duration, URL

constraints

allowed set, regex, min/max, required, custom validator

default_value

Non-secret platform default where safe

value/source

Actual value record and its level; secrets are references only

editable_roles

Roles authorized to edit at each level

ui_metadata

Label, description, section, order, placeholder, visibility rules

restart_semantics

dynamic, next_run, worker_restart, deployment

7.2 Resolution algorithm

1. Load parameter definition and validate requested project/profile context.

2. Get platform default/value.

3. Apply project override only if definition allows PROJECT and the value passes validation/policy.

4. Apply profile override only if PROFILE is allowed.

5. Replace secret_ref values with opaque secret handles, never plaintext in snapshots or frontend responses.

6. Return resolved value plus source metadata, schema version, and effective policy version.

7. Persist the resolved non-secret representation in the RunSnapshot.

8. Skill Architecture and Publication

8.1 Skill package

A skill is a versioned artifact containing instructions, optional structured contracts/assets, declared tool/capability dependencies, evaluation metadata, and optional code only where a sandbox policy permits it. First-party filesystem skills and independently published skills can coexist behind a common resolver.

Manifest area

Examples

Identity

skill_id, semantic version, publisher, description

Compatibility

minimum platform/runtime version, supported profiles

Dependencies

required logical tool capabilities and connector categories

Inputs/outputs

JSON schema or typed contract

Security

network requirements, data classification, code-execution flag

Evaluation

suite IDs, baseline version, thresholds, last result

Artifact

digest, storage pointer, signature/provenance

Lifecycle

draft, validated, published, approved, deprecated, revoked

8.2 Evaluation-gated upgrade

A newly published skill version must not automatically supersede the current version. The evaluation service compares the candidate against the project/current baseline over a curated test suite. Promotion requires both safety invariants and improvement/non-regression thresholds.

Gate

Example rule

Contract

All required inputs/outputs and tool dependencies resolve

Security

Scanner passes; no undeclared network/code behavior

Correctness

Critical test cases must pass 100%

Quality

Aggregate quality >= baseline - allowed tolerance; target metrics improve

Cost/latency

Must remain within configured budget or require explicit exception

Tool behavior

No newly introduced write-capability use without governance update

Human review

Platform admin approval per immutable published version

Project rollout

Project binding approval; canary/A-B before default promotion

8.3 Runtime resolution

At run start, the resolver locks exact skill versions and artifact digests. If an admin publishes version 2 while a run is active, that run continues on version 1. New runs use the project binding/default policy that is effective at their creation time.

9. Prompt and Model Management

9.1 Prompt registry

Prompts are immutable versions with ownership, purpose, variables/schema, evaluation suite, approval state, and effective project/profile bindings.

System/platform guardrails remain separate from project persona prompts so a project cannot overwrite mandatory security instructions.

All prompt changes are evaluated and traceable to deployment/run snapshots.

9.2 Model gateway via LiteLLM

The supplied ADK/LiteLLM proof reads MODEL, API base and key and constructs LiteLlm for the ADK agent. Production should replace direct environment lookup with a model route registry. The logical model alias is resolved against approved providers/endpoints, policies, budgets and failover rules. Secrets come from the secret manager; route details are attached to telemetry without logging credentials.

Model route policy

Examples

Allow list

Models/providers approved for tenant or data class

Workload class

fast chat, deep analysis, structured extraction, evaluator

Budget

per-run token/cost ceiling, project/month quota

Fallback

ordered compatible routes; never silently cross prohibited regions/data boundaries

Privacy

provider retention setting, data residency, redaction requirements

Parameters

temperature/reasoning/limits constrained by profile/policy

10. API Design

10.1 API conventions

Base prefix `/api/v1`; JSON for request/response and SSE for run event streaming.

Every mutation accepts/returns `request_id`; action execution additionally requires an idempotency key.

Use RFC-style problem responses with stable machine-readable error codes.

Project ID is in the URL for scoped resources and is independently authorized server-side.

ETag/version fields protect configuration updates from lost-update races.

Pagination uses opaque cursors. Time fields are ISO-8601 UTC.

Frontend never calls connector credentials or model providers directly.

10.2 Core user APIs

Method + path

Purpose

Authorization

POST /api/v1/projects/{projectId}/conversations

Create conversation

Project member

POST /api/v1/conversations/{id}/messages

Submit user message and create run

Conversation owner/member + project access

GET /api/v1/runs/{runId}

Run status and summary

Self/project policy

GET /api/v1/runs/{runId}/events

SSE event stream / replay from event id

Same as run

POST /api/v1/runs/{runId}/cancel

Cancel active run

Run initiator or authorized operator

GET /api/v1/runs/{runId}/evidence

Evidence metadata/provenance

Run access + data policy

GET /api/v1/runs/{runId}/actions

List proposed/approved/executed actions

Run access

10.3 Action approval APIs

Method + path

Behavior

POST /api/v1/actions/{actionId}/approve

Validate action still pending, scope/role, proposal hash and expiry; create Approval; enqueue execution

POST /api/v1/actions/{actionId}/reject

Record user rejection and optional reason; resume run if appropriate

POST /api/v1/actions/{actionId}/cancel

Cancel unexecuted proposal/queued action if permitted

GET /api/v1/actions/{actionId}

Return preview, target, payload/diff, risk, identity mode, approval state, execution outcome

10.4 Admin/control-plane APIs

Area

Representative endpoints

Projects

GET/POST /projects; memberships; project policies

Connectors

/connector-definitions, /projects/{id}/connectors, test-connection, rotate/re-auth

Parameters

/parameter-definitions, /platform/parameters, /projects/{id}/parameters, /profiles/{id}/parameters

Skills

/skills, /skill-versions, validate, publish, approve, bind, evaluate, promote, revoke

Prompts

/prompts, /prompt-versions, evaluate, bind

Models

/model-routes, policies, health

Audit

/audit-events with privileged filters and export

10.5 Example message request

POST /api/v1/conversations/cv_123/messages

{  "client_message_id": "m_456",  "text": "Investigate why billing failed and prepare a Jira update",  "project_id": "prj_billing",  "profile_id": "triage",  "attachments": []}

10.6 Example action proposal response

{  "action_id": "act_789",  "operation": "jira.add_comment",  "target": {"issue_key": "FE-1234"},  "preview": "Billing failure traced to missing discount code...",  "risk": "LOW",  "identity_mode": "DELEGATED_USER",  "requires_approval": true,  "proposal_hash": "sha256:...",  "expires_at": "2026-09-03T04:30:00Z"}

11. Frontend Design

11.1 Application shells

Area

Primary pages/components

Project workspace

Project home, chat/investigation, run timeline, evidence drawer, action approvals, artifacts/history

Admin

Projects, users/teams, connectors, skills, prompts, models, configuration, policies, audit

Profile management

Persona/profile definition, skill bindings, prompt binding, model route, parameter overrides

Shared components

Schema form engine, capability badges, approval card, evidence citation, run event renderer

11.2 Chat / investigation page

Left navigation: project selector, conversations, saved investigations.

Center: streaming user/assistant messages with evidence citations and tool-state summaries, not raw internal chain-of-thought.

Right contextual drawer: Sources/Evidence, Run Timeline, Actions, Parameters used.

Action proposals appear inline and in the Actions drawer with target, exact payload/diff, source evidence, identity that will be used, risk, and Approve/Reject.

When an action is approved, the UI immediately changes state to Executing and then shows target-system result/link and external audit identifier.

If delegated authorization is missing/expired, approval can trigger a connector-specific re-auth flow before execution; the already approved proposal remains immutable but execution waits for valid identity.

11.3 Configuration-driven forms

The frontend should not hard-code a Jira form, Splunk form, model form, and skill form independently. A shared schema form engine consumes the same parameter/connector schema used by backend validation. UI metadata controls grouping, help, secret input behavior, conditional visibility, editable level, and Test Connection actions.

11.4 Frontend state model

State type

Recommended handling

Server entities

Query/cache layer keyed by tenant/project/resource/version

Run stream

Append-only event store in client memory with SSE resume ID

Draft message/forms

Local component state; never source of authorization

Approval state

Server authoritative; UI performs optimistic disable only after submit

Secrets

Never returned after save; show configured/unconfigured metadata only

Permissions

Server-provided capability map drives visibility, but backend still enforces every call

11.5 Approval UX requirements

Use verbs that describe the real side effect: “Post Jira comment”, not generic “Approve”.

Display “Will act as <user>” for delegated writes or “Will act as PRISM service account” for fallback service writes.

Show target resource and environment prominently and require re-confirmation for non-default/high-risk environments.

If the proposal changed, invalidate the old approval and require a new approval.

Prevent double execution with disabled controls + backend idempotency; UI state alone is insufficient.

Allow Reject/Edit request: editing creates a new proposal, never mutates an approved one.

12. Data Model

12.1 Recommended relational schemas

Schema

Representative tables

iam

users, identities, groups, roles, project_memberships, sessions, external_grants

control

projects, profiles, parameter_definitions, parameter_values, policies, model_routes

integration

connector_definitions, connector_instances, project_connector_bindings, connector_health

skills

skills, skill_versions, publications, evaluations, project_skill_bindings, artifact_signatures

runtime

conversations, messages, runs, run_snapshots, run_events, tool_calls, evidence, artifacts

actions

action_proposals, approvals, action_executions, execution_attempts

audit

audit_events, security_events, export_jobs

outbox

webhook_outbox, integration_events, delivery_attempts

12.2 Action tables - critical fields

Table

Critical fields

action_proposals

id, run_id, connector_binding_id, operation, target_json, payload_json, canonical_hash, risk, required_policy, status, expires_at

approvals

id, action_id, approver_user_id, decision, proposal_hash, auth_context_json, created_at, expires_at

action_executions

id, action_id, approval_id, identity_mode, external_identity_id, idempotency_key, status, external_ref, started_at, completed_at

execution_attempts

execution_id, attempt_no, request_digest, provider_status/error, retryable, trace_id

12.3 Evidence provenance

Every evidence item should carry source system, connector binding, operation, immutable retrieval timestamp, query/scope metadata, content hash, sensitivity classification, redaction state, and parent evidence IDs for derived artifacts. The assistant response cites evidence IDs rather than treating copied context as anonymous text.

13. Events and Streaming

13.1 Canonical run event envelope

{  "event_id": 184,  "run_id": "run_123",  "type": "ACTION_PROPOSED",  "occurred_at": "2026-09-03T03:15:21.129Z",  "correlation_id": "...",  "payload": {...}}

Event family

Examples

Lifecycle

RUN_CREATED, RUN_STARTED, RUN_COMPLETED, RUN_FAILED, RUN_CANCELLED

Assistant

ASSISTANT_DELTA, ASSISTANT_MESSAGE_FINAL

Tool

TOOL_REQUESTED, TOOL_STARTED, TOOL_RESULT, TOOL_FAILED

Evidence

EVIDENCE_ADDED, ARTIFACT_CREATED

Action

ACTION_PROPOSED, APPROVAL_REQUIRED, ACTION_APPROVED, ACTION_EXECUTING, ACTION_COMPLETED, ACTION_FAILED

Policy

POLICY_DENIED, BUDGET_WARNING, REDACTION_APPLIED

14. Observability, Audit and ML Evaluation

14.1 Telemetry

Instrument API, orchestration, model calls, tool broker, connector requests, skill resolution, and action execution with OpenTelemetry. Export to the enterprise observability stack, including Splunk O11y where configured. Use a shared `trace_id` and explicit `run_id`, `tool_call_id`, `action_id`, and `connector_binding_id` attributes.

Metric class

Examples

Reliability

run success rate, connector errors, tool retry rate, action failure rate

Performance

time-to-first-token, tool latency, end-to-end run duration, approval wait time

Cost

input/output tokens, model cost estimate, external API usage

Quality

eval pass rate, groundedness, task success, user acceptance/rejection of recommendations

Governance

policy denials, write proposals, approval rate, service-account fallback writes

Adoption

active projects/users, connector utilization, skill invocation frequency

14.2 MLflow / evaluation integration

Use the evaluation subsystem to track datasets, candidate versions, metrics and artifacts. MLflow can be an implementation option for experiment/evaluation tracking, but PRISM should expose an internal evaluation contract so the platform is not structurally coupled to a single experiment tracker. Skill, prompt and model promotion decisions consume normalized evaluation results.

15. Security and Safety Controls

Threat / failure mode

Required control

Prompt tries to widen project scope

Tool Broker injects/validates immutable project filters; ignores unauthorized arguments

Model attempts direct write

No write-capable direct tool; only propose_write capability exposed during reasoning

Approval replay

Proposal hash + expiry + approver + single-use execution/idempotency binding

Stolen browser token

HttpOnly/Secure/SameSite session cookie; server-held provider tokens; session revocation

Connector secret leakage

Secret refs only; redaction in logs/events; scoped secret access by runtime identity

Malicious skill package

Immutable signed bundle, scanner, declared capabilities, evaluation and admin/project approval

Cross-project evidence leakage

Project authorization at query/tool/evidence fetch, not UI-only filters

Tool output prompt injection

Treat connector content as untrusted evidence; explicit provenance; enforce tool-policy outside LLM

Excessive agent loops/cost

Run budgets, tool-call limits, timeouts, model quotas, circuit breakers

Audit tampering

Append-only audit strategy, restricted writer role, retention/export controls

16. Reliability and Failure Handling

All external reads and writes have explicit timeouts and normalized retry semantics. Retry only operations classified as safe/idempotent.

Action execution requires idempotency key persisted before dispatch; uncertain provider outcomes move to NEEDS_RECONCILIATION rather than blind retry.

Connector adapters implement circuit breakers and per-project/provider concurrency/rate limits.

SSE clients resume using last event ID; the canonical event log allows replay after frontend reconnect.

Long-running work executes in durable workers/queues. API process restarts do not lose runs or approvals.

Run failure does not delete evidence or prior events; a retry creates a new attempt/run linked to the original.

17. Example End-to-End Billing Investigation

The supplied billing investigation material illustrates the kind of multi-system flow PRISM should support: extract ticket keys such as order/BAN/environment, identify the billing flow, query approved billing tables, inspect job dependencies, locate the first failing job, retrieve the relevant Unix/service logs, reason about the root cause, then prepare an update/assignment for Jira. The example specifically shows a path through BAN_ERROR, BILLING_ACCOUNT, SUBSCRIBER and BILLING_DEPENDENCIES, followed by log correlation to a BLDISC failure and a missing discount-code configuration.

1. User opens the project configured for the QLAB billing environment and submits the Jira/TDR reference.

2. Jira read connector fetches issue details. Project filters constrain Jira/project access.

3. Database read connector runs only parameterized/allow-listed queries or approved views; evidence is stored with table/query provenance.

4. Log connector uses resolved environment/log-path mappings, not arbitrary unrestricted filesystem paths from the model.

5. Billing investigation skill correlates dependency/job evidence and log errors, producing findings with evidence links.

6. Agent proposes a Jira comment/assignment. It does not post automatically.

7. Frontend displays the exact Jira update and the identity that will execute it.

8. User approves. Action Service posts using that user’s delegated Jira identity where supported and records the external Jira response/audit reference.

The concrete billing details are an example workflow, not a reason to hard-code billing logic into the core platform. Domain logic belongs in versioned skills plus project configuration; connector and approval infrastructure remains generic.

18. Deployment Architecture

18.1 Kubernetes services

Workload

Notes

prism-api

Stateless API/BFF, OIDC/session endpoints, SSE multiplexing

prism-runtime-worker

ADK run execution; autoscale on queued/active runs

prism-action-worker

Side-effect execution with stricter network/secret permissions

prism-eval-worker

Skill/prompt/model evaluation jobs

prism-web

Static frontend assets / edge ingress

PostgreSQL

Managed HA preferred; migrations via controlled job

Object store

Evidence/artifacts/skill bundles; immutable/versioned retention

Queue/event transport

Durable work and outbox delivery; exact technology can be selected by platform standards

Telemetry collectors

OpenTelemetry collectors/exporters

18.2 Network segmentation

API can reach identity/session/control stores but does not need broad external-system write credentials.

Runtime worker reaches model gateway and read connector endpoints according to network policy.

Action worker is the only workload permitted to use privileged/delegated write execution paths.

Database connectors use least-privilege read accounts/views for investigation by default.

Egress is allow-listed by connector instance/environment where feasible.

19. Implementation Sequence

Phase

Deliverables

Exit criteria

1. Foundation

Entra OIDC, project membership, sessions, run/event model, baseline API/UI shell

Authenticated user can run a simple ADK/LiteLLM chat with durable events

2. Read connectors

Connector registry/adapter, Jira/Splunk/qTest/read DB, project filters, evidence

Viewer can investigate with policy-enforced project-scoped reads

3. Governed actions

Action proposal/approval/execution, delegated grants, Jira comment flow

No write bypass; Jira comment executes as approver where supported

4. Config/control plane

Parameter registry, schema forms, admin connector/project/profile pages

Connector/forms driven by shared schemas and inheritance

5. Skills

Immutable registry, publication/binding, resolver/cache, run snapshot integration

Runs lock exact skill version/artifact digest

6. Evaluation

Skill/prompt/model suites, baseline comparison, promotion gates

Candidate versions require measurable non-regression/improvement

7. Production hardening

Observability, HA, DR, quotas, security tests, audit export

SLOs, threat model and operational runbooks validated

20. Acceptance Criteria

A read-only viewer cannot perform a side effect by prompt injection, tool argument manipulation, or direct API call.

Project-scoped queries cannot be widened beyond configured Jira projects/indexes/test projects/database scopes.

A Jira comment action is shown to the user before execution and executes only after valid approval.

When delegated Jira authorization exists, the external write is attributable to the approving user; when it does not, the UI must not falsely represent a service-account write as user-authored.

Changing a connector from native API to MCP requires configuration/adapter changes, not skill rewrites.

Parameter forms and backend validation are generated from the same definitions; invalid overrides are rejected consistently.

Every run can identify exact model route, prompt version, skill versions, connector bindings, parameter resolution sources, tool calls, evidence, approvals and outputs.

A new skill version cannot become default until evaluation and required approvals pass.

Restarting API/runtime processes does not lose active run history or approved action state.

Operational telemetry can follow one user request from frontend/API through model/tool calls to external action using correlated IDs.

21. Key Architecture Decisions

Decision

Recommendation

Reason

Agent framework

Google ADK behind PRISM runtime adapter

Keeps framework replaceable and prevents ADK session/runtime from becoming control plane

Model access

LiteLLM model gateway/adapter

Provider portability and centralized model policy

Authorization

Central Tool Broker + Action Service

Model cannot self-authorize

Writes

Propose -> approve -> execute

Strong human-in-the-loop and auditability

External identity

Delegated user identity for approved writes where supported

True attribution and least privilege

Connectors

Logical capability + protocol/auth adapters

API/MCP/OAuth/service modes remain interchangeable

Configuration

Schema registry + Platform/Project/Profile inheritance

One source for backend validation and frontend forms

Skills

Immutable versioned bundles + eval-gated promotion

Extensibility without uncontrolled regressions

Runtime record

Immutable run snapshot + append-only events

Reproducibility, debugging and audit

Frontend stream

SSE with resumable event IDs

Simple durable streaming model for agent events

22. Open Design Choices to Resolve During Implementation

Exact durable queue/workflow technology (e.g., enterprise standard message bus vs dedicated workflow engine). The interfaces above intentionally avoid coupling.

Secret manager and delegated OAuth token storage implementation aligned with enterprise security standards.

Whether Jira/Atlassian user delegation is implemented through OAuth 2.0 3LO, enterprise app capabilities, or another approved pattern in the target environment.

Exact database safe-query model: curated views/stored procedures are preferred for high assurance; generated SQL requires a stronger parser/policy layer.

Artifact retention and data-classification rules per connector/source.

Approval policy matrix for production-impacting actions, including possible two-person approval/re-authentication.

Choice of experiment/evaluation tracker and CI integration details; preserve the platform-neutral EvalResult contract.

23. Source Material and Traceability

This design incorporates the project direction established in the supplied materials and discussion. Where the supplied material is only an implementation probe or example incident, it is used as such rather than treated as a complete production specification.

Source

Use in this design

Google ADK official about-page URL supplied with project

Framework reference point for the selected ADK direction.

Standalone ADK + LiteLLM smoke-test code supplied with project

Grounds the concrete LlmAgent/LiteLlm/Runner/session/tool-event integration pattern.

Billing failure investigation document supplied with project

Used as an example of a real multi-system investigation and governed Jira-update workflow.

PRISM project architecture discussions

Provides Entra OIDC, project-scoped reads, delegated approval writes, connector portability, parameter hierarchy, published skills and evaluation-gated promotion requirements.