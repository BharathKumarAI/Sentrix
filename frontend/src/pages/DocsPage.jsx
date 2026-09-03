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
  Network
} from "lucide-react";

export function DocsPage({ activeProject }) {
  const { projectKey } = useParams();
  const navigate = useNavigate();
  const currentKey = projectKey || activeProject?.project_key || "BILLING";

  const [activeTab, setActiveTab] = useState("tools"); // "tools" | "mcp" | "connectors" | "agents" | "tester"
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
      padding: "24px 32px",
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      maxWidth: "1400px",
      margin: "0 auto",
      width: "100%",
      overflowY: "auto",
      height: "calc(100vh - 64px)"
    }}>
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
                Platform Developer Documentation
              </span>
              <span className="badge badge-magenta">ADK 2.8 Architecture</span>
              <span className="badge badge-teal">MCP Ready</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: "700", color: "var(--ink-primary)", marginTop: "4px", margin: 0 }}>
              Sentrix SRE Extensibility & Integration Guide
            </h1>
            <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "4px", margin: 0 }}>
              Comprehensive blueprints and recipes for adding new Tools, MCP servers, Datasource Connectors, and Autonomous SRE Agents.
            </p>
          </div>
        </div>

        {/* Global Search within Documentation */}
        <div style={{ position: "relative", width: "280px" }}>
          <Search size={14} color="var(--ink-tertiary)" style={{ position: "absolute", left: "10px", top: "10px" }} />
          <input
            type="text"
            placeholder="Search guides, tools, MCP..."
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
          { id: "tools", label: "Adding New Tools", icon: Wrench, badge: "Tool Broker" },
          { id: "mcp", label: "Model Context Protocol (MCP)", icon: Network, badge: "Claude & Gemini" },
          { id: "connectors", label: "Datasource Connectors", icon: Database, badge: "Zero-Trust" },
          { id: "agents", label: "Autonomous Agent Specs", icon: Bot, badge: "ADK 2.8" },
          { id: "tester", label: "Tool Schema Tester", icon: Code2, badge: "Interactive" }
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

      {/* =========================================================================
         TAB 1: ADDING NEW TOOLS
         ========================================================================= */}
      {activeTab === "tools" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="prism-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "16px", color: "var(--ink-primary)", margin: 0 }}>
              How to Add a New Tool to Sentrix
            </h3>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "6px", lineHeight: 1.6 }}>
              All diagnostics executed by the autonomous SRE agent are mediated by the <strong>Tool Broker</strong>. Tools follow a strict read-only execution model; any mutating action (scaling, restarts, write comments) requires staging a <strong>Cryptographic Action Proposal</strong>.
            </p>

            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--accent-teal)" }}>
                Step 1: Define the Python Tool Function & Schema
              </div>
              <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", margin: 0 }}>
                Create your tool implementation in <code>backend/connectors/custom_tools.py</code>:
              </p>

              <div style={{ position: "relative" }}>
                <pre className="prism-card mono" style={{
                  padding: "16px",
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "12px",
                  color: "var(--ink-primary)",
                  overflowX: "auto"
                }}>
{`from typing import Dict, Any
from backend.connectors.base_connector import ToolBroker, ToolDefinition

# 1. Implement tool execution logic
async def execute_redis_slowlog(project_id: str, project_env: str, limit: int = 10) -> Dict[str, Any]:
    """Retrieves top slow queries from the project's Redis instance."""
    # Resolve concrete Redis connection for the user's dynamic environment
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
                  style={{ position: "absolute", top: "12px", right: "12px", padding: "4px 8px", fontSize: "11px" }}
                >
                  {copiedSection === "step1" ? <Check size={13} color="var(--accent-teal)" /> : <Copy size={13} />}
                </button>
              </div>

              <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--prism-pink)", marginTop: "10px" }}>
                Step 2: Bind the Tool to the Project Setup Studio
              </div>
              <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", margin: 0 }}>
                Tools automatically surface in <code>ProjectSetupStudioPage.jsx</code> under <strong>Tools & Skills</strong>, allowing project engineers to toggle them per project with 1 click.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         TAB 2: MODEL CONTEXT PROTOCOL (MCP)
         ========================================================================= */}
      {activeTab === "mcp" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="prism-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Network size={20} color="var(--accent-teal)" />
              <h3 style={{ fontSize: "16px", color: "var(--ink-primary)", margin: 0 }}>
                Model Context Protocol (MCP) Integration
              </h3>
            </div>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "6px", lineHeight: 1.6 }}>
              Sentrix natively supports Anthropic and Google ADK <strong>Model Context Protocol (MCP)</strong> servers. MCP exposes standardized tool discovery, resources, and live telemetry over standard I/O (stdio) or Server-Sent Events (SSE).
            </p>

            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink-primary)" }}>
                Configuring an MCP Server in Sentrix
              </div>
              <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", margin: 0 }}>
                Add your MCP server definition into <code>mcp_config.json</code>:
              </p>

              <div style={{ position: "relative" }}>
                <pre className="prism-card mono" style={{
                  padding: "16px",
                  background: "rgba(0, 0, 0, 0.4)",
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
                  style={{ position: "absolute", top: "12px", right: "12px", padding: "4px 8px", fontSize: "11px" }}
                >
                  {copiedSection === "mcpConfig" ? <Check size={13} color="var(--accent-teal)" /> : <Copy size={13} />}
                </button>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "12px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "8px" }}>
                <CheckCircle2 size={16} color="var(--accent-teal)" />
                <span style={{ fontSize: "12px", color: "var(--ink-primary)" }}>
                  Sentrix automatically synthesizes Gemini function declarations from MCP server definitions at runtime without manual code edits.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         TAB 3: DATASOURCE CONNECTORS
         ========================================================================= */}
      {activeTab === "connectors" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="prism-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "16px", color: "var(--ink-primary)", margin: 0 }}>
              Creating a Custom Datasource Connector
            </h3>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "6px", lineHeight: 1.6 }}>
              All infrastructure integrations inherit from <code>BaseConnector</code>. Connectors support zero-trust credential encryption, probe testing, and automatic mapping to dynamic project environments.
            </p>

            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--accent-violet)" }}>
                BaseConnector Architecture Pattern
              </div>

              <div style={{ position: "relative" }}>
                <pre className="prism-card mono" style={{
                  padding: "16px",
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "12px",
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
                  style={{ position: "absolute", top: "12px", right: "12px", padding: "4px 8px", fontSize: "11px" }}
                >
                  {copiedSection === "connectorCode" ? <Check size={13} color="var(--accent-teal)" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         TAB 4: AGENT DOCUMENTATION
         ========================================================================= */}
      {activeTab === "agents" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="prism-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "16px", color: "var(--ink-primary)", margin: 0 }}>
              Google ADK 2.8 Autonomous SRE Agent Architecture
            </h3>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "6px", lineHeight: 1.6 }}>
              Sentrix agents run on <strong>Google ADK 2.8</strong> utilizing <strong>Gemini 2.5 Pro</strong>. Agents execute iterative reasoning loops, query live tool conduits, correlate with OKF v2.0 incident precedents, and generate human-in-the-loop action proposals.
            </p>

            <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div className="prism-card" style={{ padding: "16px", background: "rgba(255, 255, 255, 0.02)" }}>
                <h4 style={{ fontSize: "13px", color: "var(--prism-pink)", margin: 0 }}>1. Observation Phase</h4>
                <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "6px" }}>
                  Polls Jira queues and ServiceNow incident tables every 30s. Extracts P1/P2 tickets, affected CMDB microservices, and stack traces.
                </p>
              </div>

              <div className="prism-card" style={{ padding: "16px", background: "rgba(255, 255, 255, 0.02)" }}>
                <h4 style={{ fontSize: "13px", color: "var(--accent-teal)", margin: 0 }}>2. Tool Broker Dispatch</h4>
                <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "6px" }}>
                  Dispatches parallel queries across PostgreSQL, Datadog APM, Splunk, and Kubernetes pods to capture lock contention and crash loops.
                </p>
              </div>

              <div className="prism-card" style={{ padding: "16px", background: "rgba(255, 255, 255, 0.02)" }}>
                <h4 style={{ fontSize: "13px", color: "var(--accent-violet)", margin: 0 }}>3. OKF v2.0 Correlation</h4>
                <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "6px" }}>
                  Matches current incident signature with 148+ historical precedents in the Open Knowledge Fabric to determine proven fix confidence.
                </p>
              </div>

              <div className="prism-card" style={{ padding: "16px", background: "rgba(255, 255, 255, 0.02)" }}>
                <h4 style={{ fontSize: "13px", color: "var(--accent-amber)", margin: 0 }}>4. Remediation Governance</h4>
                <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "6px" }}>
                  Stages cryptographically sealed Action Proposals (GitLab MR, DB Pool scaling) requiring engineer approval under delegated identity.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         TAB 5: INTERACTIVE SCHEMA TESTER
         ========================================================================= */}
      {activeTab === "tester" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="prism-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "16px", color: "var(--ink-primary)", margin: 0 }}>
              Live Tool Schema Validator
            </h3>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "6px" }}>
              Validate your custom tool or MCP tool schema against the Sentrix ADK 2.8 runtime specifications before registering it in production.
            </p>

            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <textarea
                value={testToolSchema}
                onChange={(e) => setTestToolSchema(e.target.value)}
                rows={12}
                className="mono"
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  color: "var(--ink-primary)",
                  fontSize: "12.5px"
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
                  style={{ fontSize: "12px", padding: "8px 14px" }}
                >
                  Load K8s Sample
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
