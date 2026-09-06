import React, { useState, useEffect } from "react";
import {
  Cpu,
  Zap,
  Play,
  Pause,
  RotateCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Sparkles,
  Terminal,
  Activity,
  Sliders,
  ExternalLink,
  Shield,
  Layers,
  ArrowUpRight,
  TrendingUp
} from "lucide-react";
import { fetchProjectAgents } from "../api/client";

export function ProjectAgentsPage({ activeProject }) {
  const projectKey = activeProject?.project_key || "";
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationOutput, setSimulationOutput] = useState(null);
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activeProject?.id) return;
    setIsLoading(true);
    fetchProjectAgents(activeProject.id)
      .then((data) => setAgents(Array.isArray(data) ? data : []))
      .catch((err) => console.warn("Failed to load agents:", err))
      .finally(() => setIsLoading(false));
  }, [activeProject?.id]);


  const toggleAgentStatus = (id) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: a.status === "ACTIVE" ? "PAUSED" : "ACTIVE" } : a
      )
    );
  };

  const handleSimulateRun = (agent) => {
    setSelectedAgent(agent);
    setIsSimulating(true);
    setSimulationOutput(null);

    setTimeout(() => {
      setIsSimulating(false);
      setSimulationOutput({
        status: "COMPLETED",
        latency: "1.18s",
        tokensUsed: 1420,
        model: agent.model,
        steps: [
          "Ingested synthetic 504 Gateway Timeout alert from /v1/webhooks/charges",
          "Tool Broker authorized tool execution: PostgreSQL (billing_db)::pg_stat_activity",
          "Identified 20/20 active connections saturated in HikariCP pool",
          "Evaluated OKF-RUN-402 runbook: Recommending pool scale to 50",
          "Prepared Action Proposal #PROP-904 with cryptographic write lock"
        ],
        verdict: "Root cause correlated with 96% confidence. SRE human-in-the-loop authorization staged."
      });
    }, 1200);
  };

  const filteredAgents = agents.filter((a) => {
    if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
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
            <Cpu size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                {projectKey} • BUILD
              </span>
              <span className="badge badge-teal">{agents.filter(a => a.status === 'ACTIVE').length} Autonomous Agents Online</span>
              <span className="badge badge-magenta">Google ADK Engine</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Autonomous SRE Agents Fleet
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Governed AI agents configured to investigate incident telemetry, deconstruct logs, and propose verified remediations.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => agents[0] && handleSimulateRun(agents[0])}
            disabled={isSimulating || agents.length === 0}
            className="btn-primary"
            style={{ gap: "6px" }}
          >
            {isSimulating ? <RotateCw size={14} className="spin" /> : <Play size={14} />}
            {isSimulating ? "Running Diagnostic..." : "Simulate Agent Run"}
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
        <div className="prism-card" style={{ padding: "14px 18px", background: "var(--bg-card)" }}>
          <div style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Active Agents</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--ink-primary)", marginTop: "4px" }}>
            {agents.filter((a) => a.status === "ACTIVE").length} / {agents.length}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--accent-teal)", marginTop: "2px" }}>Ready for incident dispatch</div>
        </div>

        <div className="prism-card" style={{ padding: "14px 18px", background: "var(--bg-card)" }}>
          <div style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>24h Executions</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--prism-pink)", marginTop: "4px" }}>
            {agents.reduce((acc, a) => acc + (a.executions24h || 0), 0).toLocaleString()}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "2px" }}>Autonomous investigation steps</div>
        </div>

        <div className="prism-card" style={{ padding: "14px 18px", background: "var(--bg-card)" }}>
          <div style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Mean Accuracy</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--accent-teal)", marginTop: "4px" }}>
            {agents.length > 0
              ? `${(agents.reduce((acc, a) => acc + (parseFloat(a.successRate) || 0), 0) / agents.length).toFixed(1)}%`
              : "—"}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "2px" }}>RCA confirmed by human SREs</div>
        </div>

        <div className="prism-card" style={{ padding: "14px 18px", background: "var(--bg-card)" }}>
          <div style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Average Latency</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--accent-violet)", marginTop: "4px" }}>
            {agents.length > 0
              ? `${(agents.reduce((acc, a) => acc + (parseFloat(a.avgLatency) || 0), 0) / agents.length).toFixed(2)}s`
              : "—"}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "2px" }}>Across all model inferences</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "6px 12px", width: "300px" }}>
          <Search size={14} color="var(--ink-tertiary)" />
          <input
            type="text"
            placeholder="Search agents, models, or tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", color: "var(--ink-primary)", fontSize: "12px", width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {["ALL", "ACTIVE", "STANDBY", "PAUSED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: "4px 10px",
                fontSize: "11.5px",
                fontWeight: 600,
                borderRadius: "6px",
                border: statusFilter === st ? "1px solid var(--prism-magenta)" : "1px solid var(--border-subtle)",
                background: statusFilter === st ? "rgba(225, 29, 72, 0.12)" : "var(--bg-card)",
                color: statusFilter === st ? "var(--prism-pink)" : "var(--ink-secondary)",
                cursor: "pointer"
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Agents Grid */}
      {isLoading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-secondary)" }}>
          <RotateCw size={24} className="spin" style={{ margin: "0 auto 12px" }} />
          <div>Loading autonomous agents...</div>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="prism-card" style={{ padding: "48px", textAlign: "center", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
          <Cpu size={36} color="var(--ink-tertiary)" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink-primary)" }}>No Agents Configured</h3>
          <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "4px" }}>
            No autonomous agents or skill bindings found for this project.
          </p>
        </div>
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "16px" }}>
        {filteredAgents.map((agent) => (
          <div
            key={agent.id}
            className="prism-card"
            style={{
              padding: "20px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              transition: "all 0.18s ease"
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>{agent.name}</h3>
                  <span className={`badge ${agent.status === "ACTIVE" ? "badge-teal" : "badge-amber"}`} style={{ fontSize: "10px" }}>
                    {agent.status}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--prism-pink)", fontWeight: 600, marginTop: "2px" }}>
                  {agent.role} • {agent.model}
                </div>
              </div>

              <button
                onClick={() => toggleAgentStatus(agent.id)}
                className="btn-ghost"
                style={{ padding: "4px 8px", fontSize: "11px" }}
                title={agent.status === "ACTIVE" ? "Pause Agent" : "Activate Agent"}
              >
                {agent.status === "ACTIVE" ? <Pause size={13} /> : <Play size={13} />}
                {agent.status === "ACTIVE" ? "Pause" : "Resume"}
              </button>
            </div>

            <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", lineHeight: 1.5 }}>
              {agent.description}
            </p>

            {/* Performance Bar */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", padding: "8px 12px", borderRadius: "8px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>Success Rate</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent-teal)" }}>{agent.successRate}</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>24h Runs</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-primary)" }}>{agent.executions24h}</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>Avg Latency</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent-violet)" }}>{agent.avgLatency}</div>
              </div>
            </div>

            {/* Tools Attached */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Authorized Tools:</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {agent.tools.map((t, idx) => (
                  <span key={idx} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--border-subtle)", color: "var(--ink-secondary)" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px", marginTop: "auto" }}>
              <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>Last run {agent.lastActive}</span>
              <button
                onClick={() => handleSimulateRun(agent)}
                className="btn-secondary"
                style={{ padding: "4px 10px", fontSize: "11.5px", gap: "4px" }}
              >
                <Play size={12} /> Test Diagnostic
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Simulation Result Drawer / Modal */}
      {simulationOutput && selectedAgent && (
        <div className="prism-card" style={{ padding: "20px", background: "var(--bg-elevated)", border: "1px solid var(--border-card)", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={16} color="var(--accent-teal)" />
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)" }}>
                Diagnostic Simulation Output: {selectedAgent.name}
              </h3>
              <span className="badge badge-teal">{simulationOutput.latency}</span>
            </div>
            <button onClick={() => setSimulationOutput(null)} className="btn-ghost" style={{ fontSize: "11.5px" }}>Close</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {simulationOutput.steps.map((s, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--ink-secondary)" }}>
                <span style={{ color: "var(--prism-pink)", fontWeight: 700 }}>0{idx + 1}.</span>
                <span>{s}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: "10px 14px", borderRadius: "6px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "var(--accent-teal)", fontSize: "12.5px" }}>
            {simulationOutput.verdict}
          </div>
        </div>
      )}
    </div>
  );
}
