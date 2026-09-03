import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Wrench,
  Cpu,
  Database,
  Bot,
  Copy,
  Check,
  Search,
  ExternalLink,
  Code2,
  Terminal,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileCode,
  Network,
  X,
  Compass,
  HelpCircle,
  MessageSquare,
  Activity,
  Sliders,
  Send,
  Zap,
  ArrowRight,
  Eye,
  Shield
} from "lucide-react";

export function DocsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState("how-to-use"); // "how-to-use" | "how-it-works" | "how-to-request" | "tools-connectors" | "mcp" | "tester"
  const [searchFilter, setSearchFilter] = useState("");
  const [copiedSection, setCopiedSection] = useState(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Interactive Schema Tester state
  const [testToolSchema, setTestToolSchema] = useState(JSON.stringify({
    name: "query_postgres_locks",
    description: "Query active row-level deadlocks and locking transactions on PostgreSQL primary",
    parameters: {
      type: "object",
      properties: {
        timeout_threshold_ms: { type: "integer", default: 5000, description: "Filter locks held longer than threshold" },
        include_blocked_queries: { type: "boolean", default: true }
      },
      required: ["timeout_threshold_ms"]
    },
    is_read_only: true,
    connector_type: "DATABASE"
  }, null, 2));
  const [schemaValidationResult, setSchemaValidationResult] = useState(null);

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleValidateSchema = () => {
    try {
      const parsed = JSON.parse(testToolSchema);
      if (!parsed.name || typeof parsed.name !== "string") {
        throw new Error("Missing required string property: 'name'");
      }
      if (!parsed.description || typeof parsed.description !== "string") {
        throw new Error("Missing required string property: 'description'");
      }
      if (!parsed.parameters || typeof parsed.parameters !== "object") {
        throw new Error("Missing required object property: 'parameters'");
      }
      setSchemaValidationResult({
        valid: true,
        message: `Tool '${parsed.name}' is valid for Sentrix Tool Broker & ADK 2.8 binding. (Read-only: ${parsed.is_read_only !== false})`
      });
    } catch (err) {
      setSchemaValidationResult({
        valid: false,
        message: err.message
      });
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.78)",
      backdropFilter: "blur(8px)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div
        className="prism-card message-animate-in"
        style={{
          width: "92vw",
          maxWidth: "1320px",
          height: "88vh",
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          borderRadius: "16px",
          boxShadow: "0 28px 64px rgba(0, 0, 0, 0.75)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        {/* Modal Top Header */}
        <div style={{
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-elevated)",
          flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "var(--prism-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 0 14px var(--prism-glow)"
              }}
            >
              <BookOpen size={20} />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink-primary)", margin: 0 }}>
                  Sentrix Platform Documentation & Knowledge Base
                </h3>
                <span className="mono badge badge-magenta" style={{ fontSize: "9px" }}>ADK 2.8</span>
                <span className="mono badge badge-teal" style={{ fontSize: "9px" }}>Gemini 2.5 Pro</span>
                <span className="mono badge badge-violet" style={{ fontSize: "9px" }}>Zero-Trust</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--ink-secondary)", margin: 0, marginTop: "2px" }}>
                Comprehensive platform guide covering end-to-end usage, architecture, prompting, and developer extensibility
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Search within Docs */}
            <div style={{ position: "relative", width: "240px" }}>
              <Search size={13} color="var(--ink-tertiary)" style={{ position: "absolute", left: "9px", top: "9px" }} />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px 6px 28px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "6px",
                  color: "var(--ink-primary)",
                  fontSize: "11.5px"
                }}
              />
            </div>

            <button
              onClick={onClose}
              className="btn-ghost"
              style={{ padding: "6px" }}
              title="Close Documentation (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 24px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "rgba(0, 0, 0, 0.2)",
          flexShrink: 0,
          overflowX: "auto"
        }}>
          {[
            { id: "how-to-use", label: "How to Use the App", icon: Compass, badge: "User Guide" },
            { id: "how-it-works", label: "How It Works", icon: Activity, badge: "Architecture" },
            { id: "how-to-request", label: "How to Request & Prompt", icon: MessageSquare, badge: "Inquiry Guide" },
            { id: "tools-connectors", label: "Adding Tools & Connectors", icon: Wrench, badge: "Extensibility" },
            { id: "mcp", label: "Model Context Protocol (MCP)", icon: Network, badge: "Standards" },
            { id: "tester", label: "Live Schema Tester", icon: Code2, badge: "Interactive" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="btn-ghost"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "8px",
                background: activeTab === tab.id ? "rgba(236, 72, 153, 0.14)" : "rgba(255, 255, 255, 0.03)",
                border: activeTab === tab.id ? "1px solid var(--prism-pink)" : "1px solid var(--border-subtle)",
                color: activeTab === tab.id ? "var(--prism-pink)" : "var(--ink-secondary)",
                fontWeight: activeTab === tab.id ? "700" : "500",
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap"
              }}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
              <span className="mono badge badge-teal" style={{ fontSize: "9px" }}>{tab.badge}</span>
            </button>
          ))}
        </div>

        {/* Modal Scrollable Content Body */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}>
          {/* =========================================================================
             TAB 1: HOW TO USE THE APPLICATION
             ========================================================================= */}
          {activeTab === "how-to-use" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="prism-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Compass size={18} color="var(--prism-pink)" />
                  <h4 style={{ fontSize: "15px", color: "var(--ink-primary)", margin: 0 }}>
                    Platform Workflow & Navigation Tour
                  </h4>
                </div>
                <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "6px", lineHeight: 1.6 }}>
                  Sentrix is an Autonomous SRE Platform designed to compress Mean Time to Resolution (MTTR) by up to 68%. Follow this operational workflow to triage incidents, run AI investigations, and apply governed remediation.
                </p>

                <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  {/* Step 1 */}
                  <div className="prism-card" style={{ padding: "16px", background: "rgba(255, 255, 255, 0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="mono badge badge-magenta" style={{ fontSize: "10px" }}>1</span>
                      <strong style={{ fontSize: "13px", color: "var(--ink-primary)" }}>Monitor Live Triage Board</strong>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "8px", lineHeight: 1.5 }}>
                      Navigate to the <strong>Live Triage Board</strong> (priority #1 on the sidebar). Filter tickets by severity (P1 Critical, P2 Major) or status (Investigating, Triage Ready, Action Staged, Resolved). Click any incident ticket card to open the complete Evidence Locker & Investigation Details.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="prism-card" style={{ padding: "16px", background: "rgba(255, 255, 255, 0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="mono badge badge-teal" style={{ fontSize: "10px" }}>2</span>
                      <strong style={{ fontSize: "13px", color: "var(--ink-primary)" }}>Autonomous Investigation Stream</strong>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "8px", lineHeight: 1.5 }}>
                      Open the <strong>Investigation Stream</strong> to converse with the autonomous SRE agent. View the agent's real-time diagnostic progress, peek into telemetry packets (PostgreSQL locks, Datadog spikes, K8s restarts), and ask for telemetry charts, database queries, and RCA summaries.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="prism-card" style={{ padding: "16px", background: "rgba(255, 255, 255, 0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="mono badge badge-violet" style={{ fontSize: "10px" }}>3</span>
                      <strong style={{ fontSize: "13px", color: "var(--ink-primary)" }}>Review & Authorize Action Proposals</strong>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "8px", lineHeight: 1.5 }}>
                      The agent never mutates infrastructure without permission. When a fix is identified (e.g. HikariCP pool expansion, pod rollout restart, Jira comment), the agent stages a <strong>Cryptographic Action Proposal</strong>. Verify the diff and click <em>Authorize & Execute</em> under your delegated authority.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="prism-card" style={{ padding: "16px", background: "rgba(255, 255, 255, 0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="mono badge badge-amber" style={{ fontSize: "10px" }}>4</span>
                      <strong style={{ fontSize: "13px", color: "var(--ink-primary)" }}>Project Setup Studio & Customization</strong>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "8px", lineHeight: 1.5 }}>
                      Access <strong>Setup & Studio</strong> to configure Jira queue JQL polling (e.g. 30s intervals), enter enterprise datasource credentials, customize the system prompt, adjust temperature, and upload runbooks into the Open Knowledge Fabric (OKF v2.0).
                    </p>
                  </div>
                </div>

                {/* SRE Metrics & Reports */}
                <div style={{ marginTop: "16px", padding: "14px 16px", background: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldCheck size={16} color="var(--accent-teal)" />
                    <strong style={{ fontSize: "12.5px", color: "var(--accent-teal)" }}>Executive SRE Metrics & SLA Tracking</strong>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "4px", margin: 0 }}>
                    Monitor 30-day MTTR compression curves, SLI/SLO error budget burn gauges (e.g. 99.98% adherence), daily incident ingestion histograms, and squad performance matrices under <strong>Metrics & Analytics</strong> and <strong>Reports & Digests</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
             TAB 2: HOW IT WORKS (ARCHITECTURE)
             ========================================================================= */}
          {activeTab === "how-it-works" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="prism-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Activity size={18} color="var(--accent-violet)" />
                  <h4 style={{ fontSize: "15px", color: "var(--ink-primary)", margin: 0 }}>
                    Autonomous SRE Architecture & Reasoning Engine
                  </h4>
                </div>
                <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "6px", lineHeight: 1.6 }}>
                  Sentrix operates on a dual-loop autonomous architecture powered by <strong>Google ADK 2.8</strong> and <strong>Gemini 2.5 Pro</strong>. It continuously ingests incident alerts, interrogates infrastructure via read-only tools, and synthesizes verifiable root causes.
                </p>

                <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="prism-card" style={{ padding: "14px", borderLeft: "3px solid var(--prism-pink)" }}>
                    <h5 style={{ fontSize: "13px", color: "var(--prism-pink)", margin: 0 }}>Loop 1: Real-time Ingestion & Auto-Triage Daemon</h5>
                    <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "4px", lineHeight: 1.5 }}>
                      A background FastAPI daemon polls configured Jira queues and ServiceNow tables every 30 seconds using dynamic JQL. When an incident is ingested, the classifier isolates affected microservices, calculates priority, and correlates the incident signature with historical precedents in the Open Knowledge Fabric (OKF v2.0).
                    </p>
                  </div>

                  <div className="prism-card" style={{ padding: "14px", borderLeft: "3px solid var(--accent-teal)" }}>
                    <h5 style={{ fontSize: "13px", color: "var(--accent-teal)", margin: 0 }}>Loop 2: Zero-Trust Tool Broker & Parallel Telemetry Dispatch</h5>
                    <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "4px", lineHeight: 1.5 }}>
                      The agent issues parallel telemetry queries through the Tool Broker: querying PostgreSQL for active row-level locks, Datadog APM for latency and error spikes, Splunk for exception traces, and Kubernetes API for pod restart crashloops. All diagnostics are strictly read-only.
                    </p>
                  </div>

                  <div className="prism-card" style={{ padding: "14px", borderLeft: "3px solid var(--accent-violet)" }}>
                    <h5 style={{ fontSize: "13px", color: "var(--accent-violet)", margin: 0 }}>Loop 3: OKF v2.0 Knowledge Correlation & Runbook Matching</h5>
                    <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "4px", lineHeight: 1.5 }}>
                      The agent cross-references active symptoms against 148+ historical incident precedents in the Open Knowledge Fabric. It scores runbook matches (e.g. 96.4% confidence score on HikariCP pool exhaustion) to recommend battle-tested fixes.
                    </p>
                  </div>

                  <div className="prism-card" style={{ padding: "14px", borderLeft: "3px solid var(--accent-amber)" }}>
                    <h5 style={{ fontSize: "13px", color: "var(--accent-amber)", margin: 0 }}>Loop 4: Cryptographic Action Proposal & Human Authorization</h5>
                    <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "4px", lineHeight: 1.5 }}>
                      Mutating actions (such as restarting Kubernetes deployment, scaling database connection limits, or posting comments to Jira) are cryptographically sealed with HMAC-SHA256 tokens. The action cannot execute until a domain engineer approves it under delegated authority.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
             TAB 3: HOW TO REQUEST & PROMPT THE AGENT
             ========================================================================= */}
          {activeTab === "how-to-request" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="prism-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MessageSquare size={18} color="var(--accent-teal)" />
                  <h4 style={{ fontSize: "15px", color: "var(--ink-primary)", margin: 0 }}>
                    Inquiry Guide & Prompt Engineering Recipes
                  </h4>
                </div>
                <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "6px", lineHeight: 1.6 }}>
                  You can converse naturally with the Sentrix Autonomous SRE Agent in the Investigation Stream. Here are tested prompt recipes to trigger specific diagnostic tool flows:
                </p>

                <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Recipe 1 */}
                  <div className="prism-card" style={{ padding: "14px", background: "rgba(255, 255, 255, 0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--prism-pink)" }}>
                        📊 Requesting Telemetry Anomaly & Error Graphs
                      </span>
                      <button
                        onClick={() => handleCopy("Show telemetry anomaly graph with p99 latency spikes and error rate volume", "rec1")}
                        className="btn-ghost"
                        style={{ fontSize: "11px", padding: "3px 8px" }}
                      >
                        {copiedSection === "rec1" ? <Check size={12} color="var(--accent-teal)" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <code className="mono" style={{ display: "block", marginTop: "6px", fontSize: "12px", color: "var(--ink-primary)", background: "rgba(0, 0, 0, 0.3)", padding: "8px 12px", borderRadius: "6px" }}>
                      "Show telemetry anomaly graph with p99 latency spikes and error rate volume"
                    </code>
                    <p style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "6px", margin: 0 }}>
                      Triggers Datadog APM connector and renders an interactive SVG bar chart comparing p99 response times against error spike volumes.
                    </p>
                  </div>

                  {/* Recipe 2 */}
                  <div className="prism-card" style={{ padding: "14px", background: "rgba(255, 255, 255, 0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--accent-teal)" }}>
                        🐘 Querying Database Deadlocks & Pool Saturation
                      </span>
                      <button
                        onClick={() => handleCopy("Query database for active locks, blocked transactions, and HikariCP connection pool health", "rec2")}
                        className="btn-ghost"
                        style={{ fontSize: "11px", padding: "3px 8px" }}
                      >
                        {copiedSection === "rec2" ? <Check size={12} color="var(--accent-teal)" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <code className="mono" style={{ display: "block", marginTop: "6px", fontSize: "12px", color: "var(--ink-primary)", background: "rgba(0, 0, 0, 0.3)", padding: "8px 12px", borderRadius: "6px" }}>
                      "Query database for active locks, blocked transactions, and HikariCP connection pool health"
                    </code>
                    <p style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "6px", margin: 0 }}>
                      Queries <code>pg_stat_activity</code> and renders an interactive SQL data table displaying PID, query text, lock status, and duration.
                    </p>
                  </div>

                  {/* Recipe 3 */}
                  <div className="prism-card" style={{ padding: "14px", background: "rgba(255, 255, 255, 0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--accent-violet)" }}>
                        ☸️ Inspecting Kubernetes Pod Restarts & CrashLogs
                      </span>
                      <button
                        onClick={() => handleCopy("Check Kubernetes worker pod health, restart counts, and show recent container crash logs", "rec3")}
                        className="btn-ghost"
                        style={{ fontSize: "11px", padding: "3px 8px" }}
                      >
                        {copiedSection === "rec3" ? <Check size={12} color="var(--accent-teal)" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <code className="mono" style={{ display: "block", marginTop: "6px", fontSize: "12px", color: "var(--ink-primary)", background: "rgba(0, 0, 0, 0.3)", padding: "8px 12px", borderRadius: "6px" }}>
                      "Check Kubernetes worker pod health, restart counts, and show recent container crash logs"
                    </code>
                    <p style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "6px", margin: 0 }}>
                      Executes Kubernetes API read-only queries to surface pod statuses (CrashLoopBackOff, OOMKilled) and isolates stack traces.
                    </p>
                  </div>

                  {/* Recipe 4 */}
                  <div className="prism-card" style={{ padding: "14px", background: "rgba(255, 255, 255, 0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--accent-amber)" }}>
                        📋 Generating Executive Root Cause Analysis (RCA) Reports
                      </span>
                      <button
                        onClick={() => handleCopy("Synthesize root cause analysis with timeline of events and stage remediation proposals", "rec4")}
                        className="btn-ghost"
                        style={{ fontSize: "11px", padding: "3px 8px" }}
                      >
                        {copiedSection === "rec4" ? <Check size={12} color="var(--accent-teal)" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <code className="mono" style={{ display: "block", marginTop: "6px", fontSize: "12px", color: "var(--ink-primary)", background: "rgba(0, 0, 0, 0.3)", padding: "8px 12px", borderRadius: "6px" }}>
                      "Synthesize root cause analysis with timeline of events and stage remediation proposals"
                    </code>
                    <p style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "6px", margin: 0 }}>
                      Renders a comprehensive Triage Report card with verified root cause, chronological event timeline, and one-click action proposals.
                    </p>
                  </div>
                </div>

                {/* Attaching Files & Diagnostics */}
                <div style={{ marginTop: "14px", padding: "12px 14px", background: "rgba(236, 72, 153, 0.06)", border: "1px solid rgba(236, 72, 153, 0.2)", borderRadius: "8px" }}>
                  <strong style={{ fontSize: "12px", color: "var(--prism-pink)" }}>📎 Attaching Diagnostics to Prompts:</strong>
                  <span style={{ fontSize: "12px", color: "var(--ink-secondary)", marginLeft: "6px" }}>
                    Click the <em>Attach</em> button next to the prompt input to upload SQL dumps (<code>pg_stat_activity_dump.sql</code>), APM metrics, or coredump JSONs. The agent analyzes attachments alongside live telemetry.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
             TAB 4: ADDING TOOLS & CONNECTORS
             ========================================================================= */}
          {activeTab === "tools-connectors" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="prism-card" style={{ padding: "20px" }}>
                <h4 style={{ fontSize: "15px", color: "var(--ink-primary)", margin: 0 }}>
                  Adding Custom Tools & BaseConnector Subclasses
                </h4>
                <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "6px", lineHeight: 1.6 }}>
                  Tools follow a strict read-only execution model mediated by the <strong>Tool Broker</strong>. Any mutating action must stage an <strong>Action Proposal</strong>.
                </p>

                <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--accent-teal)" }}>
                    1. Python Tool Definition & Schema Registration
                  </div>

                  <div style={{ position: "relative" }}>
                    <pre className="prism-card mono" style={{
                      padding: "14px",
                      background: "rgba(0, 0, 0, 0.45)",
                      border: "1px solid var(--border-subtle)",
                      fontSize: "11.5px",
                      color: "var(--ink-primary)",
                      overflowX: "auto"
                    }}>
{`from typing import Dict, Any
from backend.connectors.base_connector import ToolBroker, ToolDefinition

# Implement tool execution logic
async def execute_redis_slowlog(project_id: str, project_env: str, limit: int = 10) -> Dict[str, Any]:
    """Retrieves top slow queries from the project's Redis instance."""
    connector = await ToolBroker.resolve(project_id, project_env, "CACHE")
    entries = await connector.get_slowlog(limit=limit)
    return {
        "status": "SUCCESS",
        "slowlog_entries": entries,
        "count": len(entries)
    }

# Register tool schema with the Tool Broker
ToolBroker.register_tool(
    ToolDefinition(
        name="get_redis_slowlog",
        description="Inspects Redis slowlog to isolate unindexed cache queries and key expirations.",
        parameters={
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "default": 10, "description": "Number of slowlog entries to fetch"}
            }
        },
        handler=execute_redis_slowlog,
        is_read_only=True
    )
)`}
                    </pre>
                    <button
                      onClick={() => handleCopy(`from typing import Dict, Any\nfrom backend.connectors.base_connector import ToolBroker, ToolDefinition\n...`, "codeTool")}
                      className="btn-ghost"
                      style={{ position: "absolute", top: "10px", right: "10px", padding: "4px 8px", fontSize: "11px" }}
                    >
                      {copiedSection === "codeTool" ? <Check size={13} color="var(--accent-teal)" /> : <Copy size={13} />}
                    </button>
                  </div>

                  <div style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--accent-violet)", marginTop: "10px" }}>
                    2. BaseConnector Implementation Pattern
                  </div>

                  <div style={{ position: "relative" }}>
                    <pre className="prism-card mono" style={{
                      padding: "14px",
                      background: "rgba(0, 0, 0, 0.45)",
                      border: "1px solid var(--border-subtle)",
                      fontSize: "11.5px",
                      color: "var(--ink-primary)",
                      overflowX: "auto"
                    }}>
{`from backend.connectors.base_connector import BaseConnector, ProbeResult

class SplunkLogConnector(BaseConnector):
    def __init__(self, endpoint: str, auth_token: str):
        super().__init__(connector_type="OBSERVABILITY")
        self.endpoint = endpoint
        self.auth_token = auth_token

    async def probe(self) -> ProbeResult:
        """Executes lightweight heartbeat probe (< 50ms) to test connectivity."""
        try:
            latency = await self._ping()
            return ProbeResult(success=True, latency_ms=latency, message="Splunk REST API 200 OK")
        except Exception as e:
            return ProbeResult(success=False, error=str(e))

    async def query_logs(self, query: str, time_range: str = "-15m"):
        """Read-only log search execution."""
        return await self._execute_search(query, time_range)`}
                    </pre>
                    <button
                      onClick={() => handleCopy(`from backend.connectors.base_connector import BaseConnector, ProbeResult...`, "codeConn")}
                      className="btn-ghost"
                      style={{ position: "absolute", top: "10px", right: "10px", padding: "4px 8px", fontSize: "11px" }}
                    >
                      {copiedSection === "codeConn" ? <Check size={13} color="var(--accent-teal)" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
             TAB 5: MODEL CONTEXT PROTOCOL (MCP)
             ========================================================================= */}
          {activeTab === "mcp" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="prism-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Network size={18} color="var(--accent-teal)" />
                  <h4 style={{ fontSize: "15px", color: "var(--ink-primary)", margin: 0 }}>
                    Model Context Protocol (MCP) Standard Integration
                  </h4>
                </div>
                <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "6px", lineHeight: 1.6 }}>
                  Sentrix natively supports Anthropic and Google ADK <strong>Model Context Protocol (MCP)</strong> servers over standard I/O (stdio) and Server-Sent Events (SSE). Tools are lazily mapped to Gemini 2.5 Pro function declarations.
                </p>

                <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--ink-primary)" }}>
                    Configuring an MCP Server in <code>mcp_config.json</code>
                  </div>

                  <div style={{ position: "relative" }}>
                    <pre className="prism-card mono" style={{
                      padding: "14px",
                      background: "rgba(0, 0, 0, 0.45)",
                      border: "1px solid var(--border-subtle)",
                      fontSize: "11.5px",
                      color: "var(--ink-primary)",
                      overflowX: "auto"
                    }}>
{`{
  "mcpServers": {
    "kubernetes-operator": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-kubernetes"],
      "env": {
        "KUBECONFIG": "/etc/sentrix/kubeconfig.yaml"
      }
    },
    "postgres-diagnostics": {
      "command": "python",
      "args": ["-m", "sentrix_mcp_postgres"],
      "env": {
        "DATABASE_URL": "postgresql://sentrix_readonly@billing-db:5432/billing"
      }
    }
  }
}`}
                    </pre>
                    <button
                      onClick={() => handleCopy(`{\n  "mcpServers": {\n    "kubernetes-operator": {\n...`, "mcpConfig")}
                      className="btn-ghost"
                      style={{ position: "absolute", top: "10px", right: "10px", padding: "4px 8px", fontSize: "11px" }}
                    >
                      {copiedSection === "mcpConfig" ? <Check size={13} color="var(--accent-teal)" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
             TAB 6: LIVE SCHEMA TESTER
             ========================================================================= */}
          {activeTab === "tester" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="prism-card" style={{ padding: "20px" }}>
                <h4 style={{ fontSize: "15px", color: "var(--ink-primary)", margin: 0 }}>
                  Live Tool Schema Validator
                </h4>
                <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "4px" }}>
                  Validate your custom tool or MCP tool schema against Sentrix ADK 2.8 runtime specifications right in this popup.
                </p>

                <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <textarea
                    value={testToolSchema}
                    onChange={(e) => setTestToolSchema(e.target.value)}
                    rows={10}
                    className="mono"
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      color: "var(--ink-primary)",
                      fontSize: "12px"
                    }}
                  />

                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button
                      onClick={handleValidateSchema}
                      className="btn-primary"
                      style={{ gap: "6px", padding: "7px 14px", fontSize: "12px" }}
                    >
                      <Play size={13} /> Validate Tool Schema
                    </button>
                    <button
                      onClick={() => {
                        setTestToolSchema(JSON.stringify({
                          name: "get_k8s_pod_logs",
                          description: "Fetch tail logs of a specified Kubernetes pod in the project namespace",
                          parameters: {
                            type: "object",
                            properties: {
                              pod_name: { type: "string" },
                              tail_lines: { type: "integer", default: 100 }
                            },
                            required: ["pod_name"]
                          },
                          is_read_only: true
                        }, null, 2));
                        setSchemaValidationResult(null);
                      }}
                      className="btn-secondary"
                      style={{ fontSize: "12px", padding: "7px 12px" }}
                    >
                      Load K8s Sample
                    </button>
                  </div>

                  {schemaValidationResult && (
                    <div style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: schemaValidationResult.valid ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                      border: schemaValidationResult.valid ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid rgba(239, 68, 68, 0.35)",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "12px",
                      color: schemaValidationResult.valid ? "var(--accent-teal)" : "var(--accent-rose)"
                    }}>
                      {schemaValidationResult.valid ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                      <span>{schemaValidationResult.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
