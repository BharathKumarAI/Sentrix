import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Compass,
  MessageSquare,
  Activity,
  BarChart3,
  ClipboardList,
  Container
} from "lucide-react";

export function DocsPage({ activeProject }) {
  const { projectKey } = useParams();
  const navigate = useNavigate();
  const currentKey = projectKey || activeProject?.project_key || "";

  const [activeTab, setActiveTab] = useState("how-to-use"); // "how-to-use" | "how-it-works" | "how-to-request" | "tools-connectors" | "mcp" | "tester"
  const [searchFilter, setSearchFilter] = useState("");
  const [copiedSection, setCopiedSection] = useState(null);

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
        message: `Tool '${parsed.name}' is valid for Sentrix Tool Broker & Google ADK binding. (Read-only: ${parsed.is_read_only !== false})`
      });
    } catch (err) {
      setSchemaValidationResult({
        valid: false,
        message: err.message
      });
    }
  };

  return (
    <div
      style={{
        padding: "24px 32px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        overflowY: "auto",
        minHeight: "100%",
        boxSizing: "border-box"
      }}
    >
      {/* Unified Page Hero Card */}
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
            <BookOpen size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                Platform Developer & Operational Documentation
              </span>
              <span className="badge badge-magenta">Google ADK Architecture</span>
              <span className="badge badge-teal">Gemini 2.5 Pro</span>
              <span className="badge badge-violet">MCP Ready</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: "700", color: "var(--ink-primary)", marginTop: "4px", margin: 0 }}>
              Sentrix Platform Knowledge Base & Usage Guide
            </h1>
            <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "4px", margin: 0 }}>
              Comprehensive operational tour, system architecture breakdown, prompt recipes, and developer extensibility blueprints.
            </p>
          </div>
        </div>

        {/* Global Search within Documentation */}
        <div style={{ position: "relative", width: "280px" }}>
          <Search size={14} color="var(--ink-tertiary)" style={{ position: "absolute", left: "10px", top: "10px" }} />
          <input
            type="text"
            placeholder="Search guides, recipes, tools..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "7px 12px 7px 30px",
              background: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              color: "var(--ink-primary)",
              fontSize: "12px"
            }}
          />
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        borderBottom: "1px solid var(--border-subtle)",
        paddingBottom: "12px",
        flexWrap: "wrap"
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
              padding: "8px 16px",
              borderRadius: "8px",
              background: activeTab === tab.id ? "rgba(236, 72, 153, 0.12)" : "rgba(255, 255, 255, 0.03)",
              border: activeTab === tab.id ? "1px solid var(--prism-pink)" : "1px solid var(--border-subtle)",
              color: activeTab === tab.id ? "var(--prism-pink)" : "var(--ink-secondary)",
              fontWeight: activeTab === tab.id ? "700" : "500",
              fontSize: "12.5px",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
            <span className="mono badge badge-teal" style={{ fontSize: "9px" }}>{tab.badge}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: HOW TO USE */}
      {activeTab === "how-to-use" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="prism-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "16px", color: "var(--ink-primary)", margin: 0 }}>
              End-to-End Operational Workflow
            </h3>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "6px", lineHeight: 1.6 }}>
              Follow this step-by-step tour to triage active incident tickets, launch AI investigations, and safely apply cryptographic remediation proposals:
            </p>

            <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="prism-card" style={{ padding: "18px", background: "rgba(255, 255, 255, 0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="mono badge badge-magenta">Step 1</span>
                  <strong style={{ fontSize: "13.5px", color: "var(--ink-primary)" }}>Live Triage Board</strong>
                </div>
                <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "8px", lineHeight: 1.5 }}>
                  Monitor prioritized incident queues. Tickets display auto-triage status, confidence score, and identified root cause. Click any ticket to open the full Evidence Locker.
                </p>
              </div>

              <div className="prism-card" style={{ padding: "18px", background: "rgba(255, 255, 255, 0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="mono badge badge-teal">Step 2</span>
                  <strong style={{ fontSize: "13.5px", color: "var(--ink-primary)" }}>Autonomous Investigation Stream</strong>
                </div>
                <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "8px", lineHeight: 1.5 }}>
                  Converse with the SRE Agent. Inspect live telemetry anomalies, review pg_stat_activity query tables, and track the agent's real-time thinking progress.
                </p>
              </div>

              <div className="prism-card" style={{ padding: "18px", background: "rgba(255, 255, 255, 0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="mono badge badge-violet">Step 3</span>
                  <strong style={{ fontSize: "13.5px", color: "var(--ink-primary)" }}>Cryptographic Action Proposals</strong>
                </div>
                <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "8px", lineHeight: 1.5 }}>
                  When a remediation is staged, review the command or code patch. Authorize execution using your delegated identity token (HMAC-SHA256 signed).
                </p>
              </div>

              <div className="prism-card" style={{ padding: "18px", background: "rgba(255, 255, 255, 0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="mono badge badge-amber">Step 4</span>
                  <strong style={{ fontSize: "13.5px", color: "var(--ink-primary)" }}>Project Setup Studio</strong>
                </div>
                <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "8px", lineHeight: 1.5 }}>
                  Configure Jira JQL polling cadence, map dynamic environments to tool endpoints, upload incident runbooks into OKF v2.0, and customize system directives.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOW IT WORKS */}
      {activeTab === "how-it-works" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="prism-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "16px", color: "var(--ink-primary)", margin: 0 }}>
              System Architecture & Core Engine
            </h3>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "6px", lineHeight: 1.6 }}>
              Sentrix uses Google ADK on Gemini 2.5 Pro with strict zero-trust isolation:
            </p>

            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="prism-card" style={{ padding: "16px", borderLeft: "3px solid var(--prism-pink)" }}>
                <h4 style={{ fontSize: "13.5px", color: "var(--prism-pink)", margin: 0 }}>1. Continuous Ingestion Loop</h4>
                <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "4px" }}>
                  FastAPI backend polls Jira & ServiceNow every 30s, classifies priority, and triggers autonomous diagnostic flows.
                </p>
              </div>
              <div className="prism-card" style={{ padding: "16px", borderLeft: "3px solid var(--accent-teal)" }}>
                <h4 style={{ fontSize: "13.5px", color: "var(--accent-teal)", margin: 0 }}>2. Zero-Trust Tool Broker</h4>
                <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "4px" }}>
                  All queries to PostgreSQL, Datadog APM, Splunk, and Kubernetes are strictly read-only and audited.
                </p>
              </div>
              <div className="prism-card" style={{ padding: "16px", borderLeft: "3px solid var(--accent-violet)" }}>
                <h4 style={{ fontSize: "13.5px", color: "var(--accent-violet)", margin: 0 }}>3. Open Knowledge Fabric (OKF v2.0)</h4>
                <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "4px" }}>
                  148+ historical incident precedents vector-matched to current telemetry signatures to calculate fix confidence scores.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HOW TO REQUEST */}
      {activeTab === "how-to-request" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="prism-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "16px", color: "var(--ink-primary)", margin: 0 }}>
              Agent Prompting & Inquiry Recipes
            </h3>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "6px" }}>
              Use these tested recipes to trigger specific tool workflows in the chat:
            </p>

            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { icon: BarChart3, color: "var(--prism-pink)", title: "Telemetry Anomaly & Error Graph", text: "Show telemetry anomaly graph with p99 latency spikes and error rate volume", desc: "Renders SVG dual-curve latency & error volume chart via Datadog APM" },
                { icon: Database, color: "var(--accent-teal)", title: "Database Locks & Connection Pool", text: "Query database for active locks, blocked transactions, and HikariCP connection pool health", desc: "Interrogates pg_stat_activity and renders interactive query data table" },
                { icon: Container, color: "var(--accent-violet)", title: "Kubernetes Pod Crash Loops", text: "Check Kubernetes worker pod health, restart counts, and show recent container crash logs", desc: "Interrogates Kubernetes pods in project namespace and isolates stack traces" },
                { icon: ClipboardList, color: "var(--accent-amber)", title: "Executive RCA Report", text: "Synthesize root cause analysis with timeline of events and stage remediation proposals", desc: "Renders Triage Report card with verified RCA, timeline, and 1-click action proposals" }
              ].map((rec, idx) => {
                const IconComp = rec.icon;
                return (
                  <div key={idx} className="prism-card" style={{ padding: "16px", background: "rgba(255, 255, 255, 0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: rec.color, display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "6px",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid var(--border-subtle)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: rec.color,
                          flexShrink: 0
                        }}>
                          <IconComp size={13} />
                        </div>
                        {rec.title}
                      </span>
                      <button
                        onClick={() => handleCopy(rec.text, `page-rec-${idx}`)}
                        className="btn-ghost"
                        style={{ fontSize: "11px", padding: "3px 8px" }}
                      >
                        {copiedSection === `page-rec-${idx}` ? <Check size={12} color="var(--accent-teal)" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <code className="mono" style={{ display: "block", marginTop: "8px", fontSize: "12px", color: "var(--prism-pink)", background: "var(--bg-app)", border: "1px solid var(--border-subtle)", padding: "8px 12px", borderRadius: "6px" }}>
                      "{rec.text}"
                    </code>
                    <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "6px", margin: 0 }}>
                      {rec.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ADDING TOOLS & CONNECTORS */}
      {activeTab === "tools-connectors" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="prism-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "16px", color: "var(--ink-primary)", margin: 0 }}>
              Adding New Tools & Datasource Connectors
            </h3>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "6px", lineHeight: 1.6 }}>
              All diagnostics are mediated by the Tool Broker. Define tool handlers in Python and register definitions:
            </p>

            <div style={{ marginTop: "16px", position: "relative" }}>
              <pre className="prism-card mono" style={{
                padding: "16px",
                background: "var(--bg-app)",
                border: "1px solid var(--border-subtle)",
                fontSize: "12px",
                color: "var(--ink-primary)",
                overflowX: "auto"
              }}>
{`from backend.connectors.base_connector import ToolBroker, ToolDefinition

async def execute_redis_slowlog(project_id: str, project_env: str, limit: int = 10):
    connector = await ToolBroker.resolve(project_id, project_env, "CACHE")
    entries = await connector.get_slowlog(limit=limit)
    return {"status": "SUCCESS", "slowlog_entries": entries}

ToolBroker.register_tool(
    ToolDefinition(
        name="get_redis_slowlog",
        description="Inspects Redis slowlog for unindexed queries.",
        parameters={"type": "object", "properties": {"limit": {"type": "integer", "default": 10}}},
        handler=execute_redis_slowlog,
        is_read_only=True
    )
)`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MCP */}
      {activeTab === "mcp" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="prism-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "16px", color: "var(--ink-primary)", margin: 0 }}>
              Model Context Protocol (MCP) Standards
            </h3>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "6px" }}>
              Add MCP servers to <code>mcp_config.json</code> to expose tools directly to Gemini 2.5 Pro:
            </p>

            <div style={{ marginTop: "16px", position: "relative" }}>
              <pre className="prism-card mono" style={{
                padding: "16px",
                background: "var(--bg-app)",
                border: "1px solid var(--border-subtle)",
                fontSize: "12px",
                color: "var(--ink-primary)",
                overflowX: "auto"
              }}>
{`{
  "mcpServers": {
    "kubernetes-operator": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-kubernetes"],
      "env": { "KUBECONFIG": "/etc/sentrix/kubeconfig.yaml" }
    }
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: LIVE SCHEMA TESTER */}
      {activeTab === "tester" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="prism-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "16px", color: "var(--ink-primary)", margin: 0 }}>
              Live Tool Schema Validator
            </h3>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "6px" }}>
              Validate your tool schema against Sentrix ADK runtime specifications:
            </p>

            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <textarea
                value={testToolSchema}
                onChange={(e) => setTestToolSchema(e.target.value)}
                rows={10}
                className="mono"
                style={{
                  width: "100%",
                  padding: "14px",
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
                  style={{ gap: "6px", padding: "8px 16px", fontSize: "12px" }}
                >
                  <Play size={13} /> Validate Tool Schema
                </button>
              </div>

              {schemaValidationResult && (
                <div style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: schemaValidationResult.valid ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                  border: schemaValidationResult.valid ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid rgba(239, 68, 68, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "12.5px",
                  color: schemaValidationResult.valid ? "var(--accent-teal)" : "var(--accent-rose)"
                }}>
                  {schemaValidationResult.valid ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{schemaValidationResult.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
