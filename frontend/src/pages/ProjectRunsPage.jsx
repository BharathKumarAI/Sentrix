import React, { useState } from "react";
import {
  PlayCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Shield,
  Zap,
  Terminal,
  Activity,
  Layers,
  RotateCw,
  Eye,
  AlertTriangle
} from "lucide-react";

export function ProjectRunsPage({ activeProject }) {
  const projectKey = activeProject?.project_key || "BILLING";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRun, setSelectedRun] = useState(null);

  const runs = [
    {
      id: "run_9a82bc1049",
      ticketKey: "BILL-1049",
      incident: "Stripe Webhook 504 Timeout Surge",
      status: "AWAITING_APPROVAL",
      agent: "Billing Triage Agent",
      model: "Gemini 2.5 Pro",
      duration: "1.24s",
      tokens: 1420,
      toolCalls: 3,
      sha256: "8f3b20c9a28114f2e7b1a92bc7190...d82a",
      timestamp: "4m ago",
      steps: [
        "Ingested alert telemetry from /v1/webhooks/charges",
        "Invoked Tool Broker: PostgreSQL (billing_db)::pg_stat_activity",
        "Invoked Tool Broker: Datadog::search_error_logs",
        "Correlated HikariCP connection pool limit 20/20",
        "Generated ActionProposal #PROP-904 with cryptographic write lock"
      ]
    },
    {
      id: "run_7c11de2091",
      ticketKey: "AUTH-2091",
      incident: "JWKS Signature Verification Latency",
      status: "EXECUTED",
      agent: "Auth & IAM Edge Sentinel",
      model: "GPT-4o",
      duration: "0.98s",
      tokens: 980,
      toolCalls: 2,
      sha256: "3c91aa8910482910fae8291047192...b109",
      timestamp: "12m ago",
      steps: [
        "Parsed Envoy edge proxy 401 response metrics",
        "Invoked Tool Broker: Elasticsearch::fetch_jwks_timeouts",
        "Identified thundering herd keystore expiry storm",
        "Prepared and hot-patched ConfigMap JWKS cache TTL to 3600s"
      ]
    },
    {
      id: "run_5e40aa3030",
      ticketKey: "DB-3030",
      incident: "PostgreSQL Deadlock in orders_allocation",
      status: "EXECUTED",
      agent: "Database Lock Analyzer",
      model: "Claude 3.5 Sonnet",
      duration: "1.42s",
      tokens: 1820,
      toolCalls: 2,
      sha256: "5f8290192a7182901a88290184910...e991",
      timestamp: "25m ago",
      steps: [
        "Traversed pg_catalog.pg_locks cycle dependency graph",
        "Identified blocking session PID 10482 and blocked session 10512",
        "Authorized session termination under delegated identity",
        "Verified transaction throughput normalized"
      ]
    },
    {
      id: "run_4b19cc0501",
      ticketKey: "NOTIF-501",
      incident: "SendGrid SMTP 429 Quota Exhaustion",
      status: "EXECUTED",
      agent: "Notification Queue Balancer",
      model: "Claude 3.5 Haiku",
      duration: "1.10s",
      tokens: 1120,
      toolCalls: 3,
      sha256: "91a82910fa892019482910fa82910...a418",
      timestamp: "1h ago",
      steps: [
        "Measured Redis queue backlog depth (4,200 pending emails)",
        "Executed failover router to secondary AWS SES provider",
        "Confirmed queue drain rate stabilized at 450 emails/sec"
      ]
    },
    {
      id: "run_2a01dd0880",
      ticketKey: "INFRA-880",
      incident: "Redis Cluster Node OOM Failover",
      status: "EXECUTED",
      agent: "Kubernetes Cluster Auto-Healer",
      model: "Gemini 2.5 Flash",
      duration: "0.84s",
      tokens: 760,
      toolCalls: 2,
      sha256: "44a92019482910fa892019482910f...f011",
      timestamp: "2h ago",
      steps: [
        "Caught Sentinel failover event log",
        "Updated ConfigMap maxmemory-policy to allkeys-lru",
        "Ran telemetry health probe for 60m with zero error regressions"
      ]
    }
  ];

  const filteredRuns = runs.filter((r) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.ticketKey.toLowerCase().includes(q) ||
        r.incident.toLowerCase().includes(q) ||
        r.agent.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div
      style={{
        padding: "24px 32px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        overflowY: "auto",
        minHeight: "100%",
        boxSizing: "border-box"
      }}
    >
      {/* Hero Header */}
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
            <PlayCircle size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                {projectKey} • OPERATIONS
              </span>
              <span className="badge badge-teal">Immutable Run History</span>
              <span className="badge badge-magenta">ADK 2.8 State Machine</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Investigation Runs & Timeline Explorer
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Complete audit trace of autonomous AI investigation runs, Tool Broker executions, and cryptographic write proposals.
            </p>
          </div>
        </div>

        <span className="badge badge-teal">5 Runs Indexed</span>
      </div>

      {/* Runs Table */}
      <div className="prism-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
          <thead>
            <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)", color: "var(--ink-secondary)", textAlign: "left" }}>
              <th style={{ padding: "12px 16px" }}>Run ID</th>
              <th style={{ padding: "12px 16px" }}>Incident / Ticket</th>
              <th style={{ padding: "12px 16px" }}>Agent & Model</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px" }}>Duration</th>
              <th style={{ padding: "12px 16px" }}>Tokens</th>
              <th style={{ padding: "12px 16px" }}>Tools</th>
              <th style={{ padding: "12px 16px" }}>Timestamp</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Trace</th>
            </tr>
          </thead>
          <tbody>
            {filteredRuns.map((run) => (
              <tr key={run.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--prism-pink)" }}>
                  {run.id}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontWeight: 600, color: "var(--ink-primary)" }}>{run.incident}</div>
                  <div style={{ fontSize: "11px", color: "var(--accent-teal)", marginTop: "2px" }}>{run.ticketKey}</div>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ color: "var(--ink-primary)" }}>{run.agent}</div>
                  <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>{run.model}</div>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span className={`badge ${run.status === "EXECUTED" ? "badge-teal" : "badge-amber"}`}>
                    {run.status}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace" }}>{run.duration}</td>
                <td style={{ padding: "12px 16px", color: "var(--ink-secondary)" }}>{run.tokens.toLocaleString()}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span className="badge badge-teal">{run.toolCalls} calls</span>
                </td>
                <td style={{ padding: "12px 16px", color: "var(--ink-tertiary)" }}>{run.timestamp}</td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <button
                    onClick={() => setSelectedRun(run)}
                    className="btn-secondary"
                    style={{ padding: "4px 10px", fontSize: "11.5px", gap: "4px" }}
                  >
                    <Eye size={12} /> Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inspect Trace Drawer / Modal */}
      {selectedRun && (
        <div className="prism-card" style={{ padding: "20px", background: "var(--bg-elevated)", border: "1px solid var(--border-card)", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "11px", color: "var(--prism-pink)", fontWeight: 700 }}>ADK RUN TRACE</div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "2px" }}>
                {selectedRun.id} • {selectedRun.incident}
              </h3>
            </div>
            <button onClick={() => setSelectedRun(null)} className="btn-ghost" style={{ fontSize: "11.5px" }}>Close</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Execution Trace Steps:</span>
            {selectedRun.steps.map((step, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "6px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", fontSize: "12px" }}>
                <span style={{ color: "var(--accent-teal)", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                  0{idx + 1}
                </span>
                <span style={{ color: "var(--ink-primary)" }}>{step}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px", fontSize: "11px", color: "var(--ink-tertiary)" }}>
            <span>SHA-256 Provenance: <strong style={{ color: "var(--accent-teal)", fontFamily: "'JetBrains Mono', monospace" }}>{selectedRun.sha256}</strong></span>
            <span>Duration: {selectedRun.duration} • Tokens: {selectedRun.tokens}</span>
          </div>
        </div>
      )}
    </div>
  );
}
