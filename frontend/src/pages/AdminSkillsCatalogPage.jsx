import React, { useState } from "react";
import {
  Cpu,
  Search,
  Filter,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Zap,
  Play,
  RotateCw,
  Code2,
  Sliders,
  Sparkles
} from "lucide-react";

export function AdminSkillsCatalogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState(null);

  const skills = [
    {
      id: "skill-db-01",
      name: "Postgres Pool Starvation Diagnostic",
      category: "Database Observability",
      permission: "READ_ONLY",
      badgeColor: "badge-teal",
      invocations24h: 3120,
      description: "Extracts active vs idle connections in PostgreSQL, identifies unindexed table locks, and correlates HikariCP timeouts.",
      parameters: ["datname (string)", "min_duration_ms (int)", "include_idle (bool)"],
      outputSchema: "Array<{ pid, datname, query, state, duration }>"
    },
    {
      id: "skill-db-02",
      name: "pg_locks Deadlock Graph Traversal",
      category: "Database Contention",
      permission: "READ_ONLY",
      badgeColor: "badge-teal",
      invocations24h: 1840,
      description: "Builds a directed cycle graph of blocking and blocked database processes to detect circular row-level deadlocks.",
      parameters: ["relation_name (string)", "timeout_sec (int)"],
      outputSchema: "{ cycle_detected: bool, blocking_pid: int, blocked_statement: string }"
    },
    {
      id: "skill-k8s-01",
      name: "Pod CrashLoop & OOMKilled Correlator",
      category: "Kubernetes Operator",
      permission: "READ_ONLY",
      badgeColor: "badge-teal",
      invocations24h: 940,
      description: "Inspects pod container exit codes (e.g. exit code 137), correlates cgroup peak memory, and determines memory leak rate.",
      parameters: ["namespace (string)", "label_selector (string)"],
      outputSchema: "{ pod_name, exit_code, peak_ram_bytes, restart_count }"
    },
    {
      id: "skill-k8s-02",
      name: "Kubernetes Pod Rolling Restart",
      category: "Infrastructure Mutation",
      permission: "GOVERNED_WRITE",
      badgeColor: "badge-magenta",
      invocations24h: 114,
      description: "Safely restarts deployment pods in batches using zero-downtime rolling update strategy. Requires human delegated approval.",
      parameters: ["deployment_name (string)", "namespace (string)", "max_unavailable (int)"],
      outputSchema: "{ rollout_status: string, updated_replicas: int }"
    },
    {
      id: "skill-sec-01",
      name: "JWKS Edge Cache Mitigator",
      category: "Security & IAM",
      permission: "READ_ONLY",
      badgeColor: "badge-teal",
      invocations24h: 620,
      description: "Probes public key endpoints on Envoy edge proxies to test TLS latency and JWKS certificate expiry skew.",
      parameters: ["endpoint_url (string)", "timeout_ms (int)"],
      outputSchema: "{ http_status: int, latency_ms: float, cached_keys: int }"
    }
  ];

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
            <Cpu size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                PLATFORM ADMIN
              </span>
              <span className="badge badge-teal">5 Standard Skills Active</span>
              <span className="badge badge-magenta">ADK Tool Broker Spec</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Skills & Tool Capabilities Catalog
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Modular SRE diagnostic skills registered with the Tool Broker, enforcing permission tiers and parameters validation.
            </p>
          </div>
        </div>
      </div>

      {/* Skills Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="prism-card"
            style={{
              padding: "20px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              display: "flex",
              flexDirection: "column",
              gap: "14px"
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>{skill.name}</h3>
                  <span className={`badge ${skill.badgeColor}`} style={{ fontSize: "10px" }}>{skill.permission}</span>
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", marginTop: "2px" }}>
                  {skill.category} • {skill.id}
                </div>
              </div>
            </div>

            <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", lineHeight: 1.5 }}>
              {skill.description}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Parameters Schema:</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {skill.parameters.map((p, idx) => (
                  <span key={idx} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--accent-teal)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px", fontSize: "11px", color: "var(--ink-tertiary)" }}>
              <span>24h Invocations: <strong style={{ color: "var(--ink-primary)" }}>{skill.invocations24h.toLocaleString()}</strong></span>
              <span style={{ color: "var(--accent-violet)" }}>Output: JSON Document</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
