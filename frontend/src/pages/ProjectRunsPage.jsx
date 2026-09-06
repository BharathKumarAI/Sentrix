import React, { useState, useEffect } from "react";
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
import { fetchProjectRuns } from "../api/client";

export function ProjectRunsPage({ activeProject }) {
  const projectId = activeProject?.id;
  const projectKey = activeProject?.project_key || "";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRun, setSelectedRun] = useState(null);
  const [runs, setRuns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    setIsLoading(true);
    fetchProjectRuns(projectId)
      .then((data) => setRuns(Array.isArray(data) ? data : []))
      .catch((err) => console.warn("Failed to load runs:", err))
      .finally(() => setIsLoading(false));
  }, [projectId]);

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
              <span className="badge badge-magenta">Autonomous State Machine</span>
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
