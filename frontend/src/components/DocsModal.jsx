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
  X
} from "lucide-react";

export function DocsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState("tools"); // "tools" | "mcp" | "connectors" | "agents" | "tester"
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
      padding: "24px"
    }}>
      <div
        className="prism-card message-animate-in"
        style={{
          width: "92vw",
          maxWidth: "1280px",
          height: "86vh",
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
                  Platform Extensibility & Integration Docs
                </h3>
                <span className="mono badge badge-magenta" style={{ fontSize: "9px" }}>ADK 2.8</span>
                <span className="mono badge badge-teal" style={{ fontSize: "9px" }}>MCP Ready</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--ink-secondary)", margin: 0, marginTop: "2px" }}>
                Platform-wide specifications and guides to add custom Tools, MCP servers, Connectors, and SRE Agents
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Search within Docs */}
            <div style={{ position: "relative", width: "240px" }}>
              <Search size={13} color="var(--ink-tertiary)" style={{ position: "absolute", left: "9px", top: "9px" }} />
              <input
                type="text"
                placeholder="Search platform docs..."
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

        {/* Tab Strip */}
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
            { id: "tools", label: "Adding New Tools", icon: Wrench, badge: "Tool Broker" },
            { id: "mcp", label: "Model Context Protocol (MCP)", icon: Network, badge: "Claude & Gemini" },
            { id: "connectors", label: "Datasource Connectors", icon: Database, badge: "Zero-Trust" },
            { id: "agents", label: "Autonomous Agent Specs", icon: Bot, badge: "ADK 2.8" },
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

        {/* Modal Scrollable Body */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}>
          {/* TAB 1: ADDING NEW TOOLS */}
          {activeTab === "tools" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div className="prism-card" style={{ padding: "20px" }}>
                <h4 style={{ fontSize: "15px", color: "var(--ink-primary)", margin: 0 }}>
                  How to Add a New Tool to Sentrix
                </h4>
                <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "6px", lineHeight: 1.6 }}>
                  All diagnostics executed by the autonomous SRE agent are mediated by the <strong>Tool Broker</strong>. Tools follow a strict read-only execution model; any mutating action requires staging a <strong>Cryptographic Action Proposal</strong>.
                </p>

                <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--accent-teal)" }}>
                    Step 1: Implement the Tool Handler & Register with ToolBroker
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

# 1. Implement tool execution logic
async def execute_redis_slowlog(project_id: str, project_env: str, limit: int = 10) -> Dict[str, Any]:
    """Retrieves top slow queries from the project's Redis instance."""
    connector = await ToolBroker.resolve(project_id, project_env, "CACHE")
    entries = await connector.get_slowlog(limit=limit)
    return {
        "status": "SUCCESS",
        "slowlog_entries": entries,
        "count": len(entries)
    }

# 2. Register tool schema with the Tool Broker
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
                      onClick={() => handleCopy(`from typing import Dict, Any\nfrom backend.connectors.base_connector import ToolBroker, ToolDefinition\n...`, "step1")}
                      className="btn-ghost"
                      style={{ position: "absolute", top: "10px", right: "10px", padding: "4px 8px", fontSize: "11px" }}
                    >
                      {copiedSection === "step1" ? <Check size={13} color="var(--accent-teal)" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MODEL CONTEXT PROTOCOL (MCP) */}
          {activeTab === "mcp" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div className="prism-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Network size={18} color="var(--accent-teal)" />
                  <h4 style={{ fontSize: "15px", color: "var(--ink-primary)", margin: 0 }}>
                    Model Context Protocol (MCP) Integration
                  </h4>
                </div>
                <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "6px", lineHeight: 1.6 }}>
                  Sentrix natively supports Anthropic and Google ADK <strong>Model Context Protocol (MCP)</strong> servers over standard I/O (stdio) and Server-Sent Events (SSE).
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

          {/* TAB 3: DATASOURCE CONNECTORS */}
          {activeTab === "connectors" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div className="prism-card" style={{ padding: "20px" }}>
                <h4 style={{ fontSize: "15px", color: "var(--ink-primary)", margin: 0 }}>
                  Creating a Custom Datasource Connector
                </h4>
                <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "6px", lineHeight: 1.6 }}>
                  All infrastructure integrations inherit from <code>BaseConnector</code> with zero-trust credential encryption, probe testing, and automatic mapping to dynamic project environments.
                </p>

                <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
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
                      onClick={() => handleCopy(`from backend.connectors.base_connector import BaseConnector, ProbeResult...`, "connectorCode")}
                      className="btn-ghost"
                      style={{ position: "absolute", top: "10px", right: "10px", padding: "4px 8px", fontSize: "11px" }}
                    >
                      {copiedSection === "connectorCode" ? <Check size={13} color="var(--accent-teal)" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AGENT DOCUMENTATION */}
          {activeTab === "agents" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div className="prism-card" style={{ padding: "20px" }}>
                <h4 style={{ fontSize: "15px", color: "var(--ink-primary)", margin: 0 }}>
                  Google ADK 2.8 Autonomous SRE Agent Architecture
                </h4>
                <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "6px", lineHeight: 1.6 }}>
                  Sentrix agents run on <strong>Google ADK 2.8</strong> utilizing <strong>Gemini 2.5 Pro</strong>. Agents execute iterative reasoning loops, query live tool conduits, correlate with OKF v2.0 incident precedents, and generate human-in-the-loop action proposals.
                </p>

                <div style={{ marginTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="prism-card" style={{ padding: "14px", background: "rgba(255, 255, 255, 0.02)" }}>
                    <h5 style={{ fontSize: "12.5px", color: "var(--prism-pink)", margin: 0 }}>1. Observation Phase</h5>
                    <p style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "4px" }}>
                      Polls Jira queues and ServiceNow incident tables every 30s. Extracts P1/P2 tickets, affected CMDB microservices, and stack traces.
                    </p>
                  </div>

                  <div className="prism-card" style={{ padding: "14px", background: "rgba(255, 255, 255, 0.02)" }}>
                    <h5 style={{ fontSize: "12.5px", color: "var(--accent-teal)", margin: 0 }}>2. Tool Broker Dispatch</h5>
                    <p style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "4px" }}>
                      Dispatches parallel queries across PostgreSQL, Datadog APM, Splunk, and Kubernetes pods to capture lock contention and crash loops.
                    </p>
                  </div>

                  <div className="prism-card" style={{ padding: "14px", background: "rgba(255, 255, 255, 0.02)" }}>
                    <h5 style={{ fontSize: "12.5px", color: "var(--accent-violet)", margin: 0 }}>3. OKF v2.0 Correlation</h5>
                    <p style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "4px" }}>
                      Matches current incident signature with 148+ historical precedents in the Open Knowledge Fabric to determine proven fix confidence.
                    </p>
                  </div>

                  <div className="prism-card" style={{ padding: "14px", background: "rgba(255, 255, 255, 0.02)" }}>
                    <h5 style={{ fontSize: "12.5px", color: "var(--accent-amber)", margin: 0 }}>4. Remediation Governance</h5>
                    <p style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "4px" }}>
                      Stages cryptographically sealed Action Proposals (GitLab MR, DB Pool scaling) requiring engineer approval under delegated identity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LIVE SCHEMA TESTER */}
          {activeTab === "tester" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
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
