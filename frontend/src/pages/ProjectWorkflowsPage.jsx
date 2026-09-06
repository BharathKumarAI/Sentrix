import React, { useState, useEffect } from "react";
import {
  GitFork,
  Play,
  Pause,
  RotateCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  AlertOctagon,
  ChevronRight,
  Plus
} from "lucide-react";
import { fetchProjectRuns } from "../api/client";

export function ProjectWorkflowsPage({ activeProject }) {
  const projectKey = activeProject?.project_key || "";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [executingWorkflowId, setExecutingWorkflowId] = useState(null);
  const [runs, setRuns] = useState([]);

  useEffect(() => {
    if (!activeProject?.id) return;
    fetchProjectRuns(activeProject.id)
      .then(data => {
        if (Array.isArray(data)) setRuns(data);
      })
      .catch(err => console.warn("Failed to load workflow runs", err));
  }, [activeProject?.id]);

  const defaultWorkflows = [];

  const workflows = defaultWorkflows;

  const handleExecuteWorkflow = (wfId) => {
    setExecutingWorkflowId(wfId);
    setTimeout(() => {
      setExecutingWorkflowId(null);
    }, 1500);
  };

  const activeWf = selectedWorkflow || workflows[0];

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
            <GitFork size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                {projectKey} • BUILD
              </span>
              <span className="badge badge-teal">4 Autonomous Pipelines Active</span>
              <span className="badge badge-magenta">DAG Orchestration</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              SRE Investigation & Remediation Workflows
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Deterministic incident response DAGs combining monitoring triggers, Tool Broker queries, AI synthesis, and human-governed write actions.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleExecuteWorkflow(activeWf.id)}
          disabled={executingWorkflowId === activeWf.id}
          className="btn-primary"
          style={{ gap: "6px" }}
        >
          {executingWorkflowId === activeWf.id ? <RotateCw size={14} className="spin" /> : <Play size={14} />}
          {executingWorkflowId === activeWf.id ? "Running Pipeline..." : "Test Run Pipeline"}
        </button>
      </div>

      {/* Main Split Layout: Workflows List & Selected DAG Visualizer */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "20px", alignItems: "start" }}>
        {/* Left: Workflows List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>Configured Pipelines</h2>
            <span style={{ fontSize: "12px", color: "var(--ink-tertiary)" }}>{workflows.length} Total</span>
          </div>

          {workflows.map((wf) => {
            const isSelected = activeWf.id === wf.id;
            return (
              <div
                key={wf.id}
                onClick={() => setSelectedWorkflow(wf)}
                className="prism-card"
                style={{
                  padding: "16px 18px",
                  background: isSelected ? "var(--bg-card-hover)" : "var(--bg-card)",
                  border: isSelected ? "1px solid var(--prism-magenta)" : "1px solid var(--border-card)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)" }}>{wf.name}</h3>
                  <span className="badge badge-teal" style={{ fontSize: "10px" }}>{wf.status}</span>
                </div>

                <div style={{ fontSize: "12px", color: "var(--ink-secondary)" }}>
                  Trigger: <code style={{ color: "var(--accent-amber)" }}>{wf.trigger}</code>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", fontSize: "11px", color: "var(--ink-tertiary)", borderTop: "1px solid var(--border-subtle)", paddingTop: "8px" }}>
                  <span>Runs: <strong style={{ color: "var(--ink-primary)" }}>{wf.runsTotal}</strong></span>
                  <span>Accuracy: <strong style={{ color: "var(--accent-teal)" }}>{wf.successRate}</strong></span>
                  <span>MTTR: <strong style={{ color: "var(--accent-violet)" }}>{wf.avgDuration}</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Pipeline DAG Visualizer */}
        <div
          className="prism-card"
          style={{
            padding: "20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "11px", color: "var(--prism-pink)", fontWeight: 700, textTransform: "uppercase" }}>
                PIPELINE DAG VISUALIZER
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "2px" }}>
                {activeWf.name}
              </h3>
            </div>
            <span className="badge badge-magenta">{activeWf.steps.length} Steps</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {activeWf.steps.map((step, idx) => (
              <div
                key={idx}
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px"
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: step.type === "GOVERNANCE" ? "var(--prism-gradient)" : "rgba(16, 185, 129, 0.15)",
                    color: step.type === "GOVERNANCE" ? "#fff" : "var(--accent-teal)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  {idx + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <strong style={{ fontSize: "13px", color: "var(--ink-primary)" }}>{step.name}</strong>
                    <span className="badge badge-teal" style={{ fontSize: "10px" }}>{step.type}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "3px" }}>
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(225, 29, 72, 0.08)", border: "1px solid rgba(225, 29, 72, 0.25)", fontSize: "12px", color: "var(--ink-secondary)" }}>
            <strong style={{ color: "var(--prism-pink)" }}>Write-Lock Guarantee:</strong> Step 4 contains high-impact database / pod mutations and will never execute without an explicit cryptographic signature from a delegated SRE.
          </div>
        </div>
      </div>
    </div>
  );
}
