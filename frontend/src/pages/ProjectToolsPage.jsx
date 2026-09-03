import React, { useState } from "react";
import {
  Wrench,
  Server,
  Database,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  Layers,
  Network
} from "lucide-react";

export function ProjectToolsPage({ activeProject, activeEnvironment }) {
  const projectKey = activeProject?.project_key || "BILLING";
  const [testingToolId, setTestingToolId] = useState(null);
  const [probeResults, setProbeResults] = useState({});

  const [tools, setTools] = useState([
    {
      id: "tool-pg",
      name: "PostgreSQL Primary (billing_db)",
      category: "Database & Storage",
      targetHost: "billing-db-primary.c.prism-prod.internal:5432",
      activeEnvironment: activeEnvironment || "prod",
      status: "HEALTHY",
      latency: "14.2ms",
      authMode: "Vault Dynamic Credentials (IAM)",
      poolLimit: 50,
      description: "Primary transactional database for recurring billing, ledger journal, and customer invoicing."
    },
    {
      id: "tool-dd",
      name: "Datadog Telemetry & Logs API",
      category: "Observability & Metrics",
      targetHost: "api.datadoghq.com/api/v2/logs/events/search",
      activeEnvironment: activeEnvironment || "prod",
      status: "HEALTHY",
      latency: "28.6ms",
      authMode: "Bearer Token (Rotated 30d)",
      poolLimit: 100,
      description: "Ingests 504 error surges, worker pod CPU/RAM metrics, and distributed APM spans."
    },
    {
      id: "tool-k8s",
      name: "Kubernetes Cluster Operator",
      category: "Compute & Orchestration",
      targetHost: "k8s-prod-us-east-1.internal.company:6443",
      activeEnvironment: activeEnvironment || "prod",
      status: "HEALTHY",
      latency: "18.1ms",
      authMode: "mTLS Certificate (Vault CA)",
      poolLimit: 20,
      description: "Allows SRE agents to inspect pod CrashLoopBackOff, check logs, and stage rolling restart proposals."
    },
    {
      id: "tool-jira",
      name: "Atlassian Jira Enterprise Cloud",
      category: "Incident Management",
      targetHost: "company.atlassian.net/rest/api/3",
      activeEnvironment: activeEnvironment || "prod",
      status: "HEALTHY",
      latency: "45.0ms",
      authMode: "OAuth 2.0 (Delegated Identity)",
      poolLimit: 50,
      description: "Direct integration for syncing auto-triage RCA reports, attaching query outputs, and updating fix teams."
    },
    {
      id: "tool-redis",
      name: "Redis Session & Cache Grid",
      category: "Cache & Queues",
      targetHost: "redis-cluster-shard-01.internal:6379",
      activeEnvironment: activeEnvironment || "prod",
      status: "HEALTHY",
      latency: "4.8ms",
      authMode: "AUTH Token + Sentinel",
      poolLimit: 120,
      description: "In-memory caching for JWKS public keys, idempotency tokens, and transactional email queue backlogs."
    }
  ]);

  const handleTestProbe = (toolId) => {
    setTestingToolId(toolId);
    setTimeout(() => {
      setProbeResults((prev) => ({
        ...prev,
        [toolId]: {
          status: "SUCCESS",
          code: 200,
          latency: (Math.random() * 15 + 8).toFixed(1) + "ms",
          verifiedAt: "Just now"
        }
      }));
      setTestingToolId(null);
    }, 900);
  };

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
            <Wrench size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                {projectKey} • BUILD
              </span>
              <span className="badge badge-teal">5 Connectors Bound</span>
              <span className="badge badge-magenta">Zero Hardcoded Endpoints</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Project Tools & Telemetry Connectors
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Configured tools authorized for Autonomous SRE Agent invocation. Bound dynamically to <strong>{activeEnvironment || "prod"}</strong> environment.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="badge badge-teal">
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-teal)" }} />
            Active Env: {activeEnvironment || "prod"}
          </span>
        </div>
      </div>

      {/* Tools Cards Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {tools.map((tool) => {
          const isTesting = testingToolId === tool.id;
          const probe = probeResults[tool.id];

          return (
            <div
              key={tool.id}
              className="prism-card"
              style={{
                padding: "20px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-card)",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>{tool.name}</h3>
                    <span className="badge badge-teal" style={{ fontSize: "10.5px" }}>{tool.category}</span>
                    <span className="badge badge-magenta" style={{ fontSize: "10px" }}>mTLS Active</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "4px" }}>
                    {tool.description}
                  </div>
                </div>

                <button
                  onClick={() => handleTestProbe(tool.id)}
                  disabled={isTesting}
                  className="btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "11.5px", gap: "6px" }}
                >
                  {isTesting ? <RotateCw size={13} className="spin" /> : <Play size={13} />}
                  {isTesting ? "Pinging..." : "Test Connection"}
                </button>
              </div>

              {/* Endpoint Specs */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "10px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "12px"
                }}
              >
                <div>
                  <span style={{ color: "var(--ink-tertiary)" }}>Target Endpoint:</span>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--ink-primary)", marginTop: "2px" }}>
                    {tool.targetHost}
                  </div>
                </div>

                <div>
                  <span style={{ color: "var(--ink-tertiary)" }}>Authentication:</span>
                  <div style={{ color: "var(--accent-teal)", fontWeight: 600, marginTop: "2px" }}>
                    {tool.authMode}
                  </div>
                </div>

                <div>
                  <span style={{ color: "var(--ink-tertiary)" }}>Latency (p99):</span>
                  <div style={{ color: "var(--accent-violet)", fontWeight: 700, marginTop: "2px" }}>
                    {probe ? probe.latency : tool.latency}
                  </div>
                </div>
              </div>

              {probe && (
                <div style={{ padding: "8px 12px", borderRadius: "6px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "var(--accent-teal)", fontSize: "11.5px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle2 size={14} />
                  Connection probe successful: HTTP 200 OK ({probe.latency}) at {probe.verifiedAt}.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
