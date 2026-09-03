import React, { useState, useEffect } from "react";
import { 
  Server, 
  Plus, 
  Search, 
  Filter, 
  Columns, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Activity, 
  ExternalLink, 
  MoreHorizontal, 
  Zap,
  RotateCw
} from "lucide-react";
import { ConnectorAcceleratorModal } from "../components/ConnectorAcceleratorModal";

export function AdminConnectorsPage() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [testResult, setTestResult] = useState({});

  // Stats from reference image 15F66FAF
  const kpis = [
    { label: "Total Connectors", value: "68", sub: "↑ 10.3% vs last 7 days", icon: Server, color: "var(--prism-pink)" },
    { label: "Active Connectors", value: "54", sub: "↑ 8.6% vs last 7 days", icon: CheckCircle2, color: "var(--accent-teal)" },
    { label: "Degraded", value: "3", sub: "↓ 25% vs last 7 days", icon: AlertTriangle, color: "var(--accent-amber)" },
    { label: "Failed", value: "2", sub: "↓ 33.3% vs last 7 days", icon: XCircle, color: "var(--accent-rose)" },
    { label: "Sync Executions (7d)", value: "12.4K", sub: "↑ 14.6% vs last 7 days", icon: RefreshCw, color: "var(--accent-blue)" }
  ];

  // Realistic Enterprise Connectors from reference 15F66FAF
  const [connectors, setConnectors] = useState([
    {
      id: "jira-cloud",
      name: "Jira Cloud",
      desc: "Fetch issues, projects, and metadata",
      type: "Issue Tracking",
      scope: "Platform",
      project: "—",
      status: "Active",
      lastSync: "2 min ago",
      syncHealth: "Healthy",
      usage: "1.2K",
      owner: "Sarah Jones",
      ownerInit: "SJ",
      endpoint: "https://company.atlassian.net"
    },
    {
      id: "servicenow",
      name: "ServiceNow",
      desc: "Incidents, problems, and change requests",
      type: "ITSM",
      scope: "Platform",
      project: "—",
      status: "Active",
      lastSync: "5 min ago",
      syncHealth: "Healthy",
      usage: "892",
      owner: "Mike Williams",
      ownerInit: "MW",
      endpoint: "https://now.internal/api"
    },
    {
      id: "splunk",
      name: "Splunk Enterprise",
      desc: "Search logs and retrieve cluster events",
      type: "Logging",
      scope: "Platform",
      project: "—",
      status: "Active",
      lastSync: "1 min ago",
      syncHealth: "Healthy",
      usage: "2.8K",
      owner: "Lisa Garcia",
      ownerInit: "LG",
      endpoint: "https://splunk-es.corp:8089"
    },
    {
      id: "datadog",
      name: "Datadog APM",
      desc: "Metrics, traces, and latency dashboards",
      type: "Observability",
      scope: "Platform",
      project: "—",
      status: "Active",
      lastSync: "3 min ago",
      syncHealth: "Healthy",
      usage: "1.1K",
      owner: "Aisha Cooper",
      ownerInit: "AC",
      endpoint: "https://api.datadoghq.com"
    },
    {
      id: "snowflake",
      name: "Snowflake DW",
      desc: "Data warehouse and analytics replication",
      type: "Database",
      scope: "Project",
      project: "Billing Intelligence",
      status: "Active",
      lastSync: "10 min ago",
      syncHealth: "Healthy",
      usage: "632",
      owner: "Sarah Jones",
      ownerInit: "SJ",
      endpoint: "snowflake://dw.internal"
    },
    {
      id: "confluence",
      name: "Confluence Cloud",
      desc: "Spaces, runbooks, and SOP content",
      type: "Knowledge Base",
      scope: "Project",
      project: "Billing Intelligence",
      status: "Active",
      lastSync: "15 min ago",
      syncHealth: "Healthy",
      usage: "412",
      owner: "Sarah Jones",
      ownerInit: "SJ",
      endpoint: "https://confluence.corp"
    },
    {
      id: "pagerduty",
      name: "PagerDuty",
      desc: "Alerts, services, and on-call incidents",
      type: "Alerting",
      scope: "Project",
      project: "Network Operations",
      status: "Degraded",
      lastSync: "27 min ago",
      syncHealth: "Degraded",
      usage: "223",
      owner: "Lisa Garcia",
      ownerInit: "LG",
      endpoint: "https://api.pagerduty.com"
    },
    {
      id: "mcp-filesystem",
      name: "MCP Central Docs",
      desc: "Model Context Protocol documentation server",
      type: "Knowledge Base",
      scope: "Platform",
      project: "—",
      status: "Active",
      lastSync: "Just now",
      syncHealth: "Healthy",
      usage: "4.2K",
      owner: "Super Administrator",
      ownerInit: "SA",
      endpoint: "stdio://npx -y @modelcontextprotocol/server-filesystem"
    }
  ]);

  const handleTest = async (connId) => {
    setTestingId(connId);
    try {
      const res = await fetch(`http://localhost:8000/api/connectors/inst_splunk_corp/test-connection?environment=prod`, {
        method: "POST"
      });
      const data = await res.json();
      setTestResult((prev) => ({ ...prev, [connId]: data }));
    } catch (e) {
      console.error(e);
    } finally {
      setTestingId(null);
    }
  };

  const filtered = connectors.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "ALL" || 
                       (activeTab === "PLATFORM" && c.scope === "Platform") ||
                       (activeTab === "PROJECT" && c.scope === "Project");
    return matchesSearch && matchesTab;
  });

  return (
    <div style={{
      padding: "24px 32px",
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      overflowY: "auto",
      height: "calc(100vh - 64px)"
    }}>
      {/* Top Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#fff" }}>Connectors</h1>
          <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
            Manage external systems, tools, and data sources connected to the platform.
          </p>
        </div>

        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Connector
        </button>
      </div>

      {/* 5 KPI Stat Cards (Matching 15F66FAF) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="prism-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: k.color
              }}>
                <Icon size={22} />
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: "600" }}>{k.label}</div>
                <div className="mono" style={{ fontSize: "22px", fontWeight: "800", color: "#fff" }}>{k.value}</div>
                <div style={{ fontSize: "10px", color: "var(--accent-teal)", marginTop: "2px" }}>{k.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs & Filter Bar (Matching 15F66FAF) */}
      <div className="prism-card" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        
        {/* Tab Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            {[
              { id: "ALL", label: "All Connectors" },
              { id: "PLATFORM", label: "Platform Connectors" },
              { id: "PROJECT", label: "Project Connectors" },
              { id: "SYSTEM", label: "System Connectors" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "12.5px",
                  fontWeight: activeTab === tab.id ? "600" : "500",
                  color: activeTab === tab.id ? "var(--prism-pink)" : "var(--ink-secondary)",
                  background: activeTab === tab.id ? "rgba(225, 29, 72, 0.12)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  borderBottom: activeTab === tab.id ? "2px solid var(--prism-magenta)" : "2px solid transparent"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn-secondary" style={{ fontSize: "11px", padding: "5px 10px" }}>
              <Filter size={12} /> Filters
            </button>
            <button className="btn-secondary" style={{ fontSize: "11px", padding: "5px 10px" }}>
              <Columns size={12} /> Columns
            </button>
          </div>
        </div>

        {/* Filter Inputs & Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
            <Search size={14} color="var(--ink-tertiary)" style={{ position: "absolute", left: "10px", top: "10px" }} />
            <input
              type="text"
              placeholder="Search by connector name, description, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                background: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                color: "#fff",
                fontSize: "12px"
              }}
            />
          </div>

          <select className="prism-card" style={{ padding: "8px 12px", fontSize: "12px", color: "#fff", background: "#0b102b" }}>
            <option>All Scopes</option>
            <option>Platform Only</option>
            <option>Project Scoped</option>
          </select>

          <select className="prism-card" style={{ padding: "8px 12px", fontSize: "12px", color: "#fff", background: "#0b102b" }}>
            <option>All Types</option>
            <option>Logging</option>
            <option>Observability</option>
            <option>Database</option>
            <option>Issue Tracking</option>
          </select>

          <select className="prism-card" style={{ padding: "8px 12px", fontSize: "12px", color: "#fff", background: "#0b102b" }}>
            <option>All Statuses</option>
            <option>Active</option>
            <option>Degraded</option>
            <option>Failed</option>
          </select>
        </div>

        {/* Connectors Table (Matching reference 15F66FAF) */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--ink-tertiary)" }}>
                <th style={{ padding: "10px 12px" }}>Connector</th>
                <th style={{ padding: "10px 12px" }}>Type</th>
                <th style={{ padding: "10px 12px" }}>Scope</th>
                <th style={{ padding: "10px 12px" }}>Project</th>
                <th style={{ padding: "10px 12px" }}>Status</th>
                <th style={{ padding: "10px 12px" }}>Last Sync</th>
                <th style={{ padding: "10px 12px" }}>Sync Health</th>
                <th style={{ padding: "10px 12px" }}>Usage (7d)</th>
                <th style={{ padding: "10px 12px" }}>Owner</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const isTesting = testingId === c.id;
                const result = testResult[c.id];
                return (
                  <tr key={c.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.03)" }}>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: "rgba(255, 255, 255, 0.05)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--prism-pink)",
                          fontWeight: "700"
                        }}>
                          {c.name.slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: "600", color: "#fff" }}>{c.name}</div>
                          <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>{c.desc}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "12px" }}>
                      <span className="badge badge-violet">{c.type}</span>
                    </td>

                    <td style={{ padding: "12px" }}>
                      <span className={`badge ${c.scope === "Platform" ? "badge-magenta" : "badge-blue"}`}>
                        {c.scope}
                      </span>
                    </td>

                    <td style={{ padding: "12px", color: c.project === "—" ? "var(--ink-tertiary)" : "#fff" }}>
                      {c.project}
                    </td>

                    <td style={{ padding: "12px" }}>
                      <span className={`badge ${c.status === "Active" ? "badge-teal" : c.status === "Degraded" ? "badge-amber" : "badge-rose"}`}>
                        {c.status}
                      </span>
                    </td>

                    <td style={{ padding: "12px" }} className="mono">
                      {c.lastSync}
                    </td>

                    <td style={{ padding: "12px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: c.syncHealth === "Healthy" ? "var(--accent-teal)" : "var(--accent-amber)" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: c.syncHealth === "Healthy" ? "var(--accent-teal)" : "var(--accent-amber)" }} />
                        {c.syncHealth}
                      </span>
                    </td>

                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="mono" style={{ color: "#fff" }}>{c.usage}</span>
                        {/* Mini Sparkline SVG */}
                        <svg width="40" height="16">
                          <path d="M 0 12 Q 10 5, 20 10 T 40 4" fill="none" stroke="#10b981" strokeWidth="1.5" />
                        </svg>
                      </div>
                    </td>

                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--prism-gradient)", color: "#fff", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {c.ownerInit}
                        </div>
                        <span style={{ color: "var(--ink-secondary)", fontSize: "11px" }}>{c.owner}</span>
                      </div>
                    </td>

                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: "4px 8px", fontSize: "11px" }}
                          onClick={() => handleTest(c.id)}
                          disabled={isTesting}
                        >
                          {isTesting ? <RotateCw size={11} className="animate-spin" /> : <Activity size={11} />}
                          {result ? `✓ ${result.latency_ms}ms` : "Test"}
                        </button>
                        
                        <button className="btn-ghost" style={{ padding: "4px" }}>
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <ConnectorAcceleratorModal
          onClose={() => setShowModal(false)}
          onConnectorCreated={(newConn) => {
            setConnectors((prev) => [
              {
                id: newConn.id,
                name: newConn.name || "Custom Connector",
                desc: "Newly bound modular accelerator",
                type: "API",
                scope: "Platform",
                project: "—",
                status: "Active",
                lastSync: "Just now",
                syncHealth: "Healthy",
                usage: "0",
                owner: "Super Administrator",
                ownerInit: "SA",
                endpoint: "configured"
              },
              ...prev
            ]);
          }}
        />
      )}
    </div>
  );
}
