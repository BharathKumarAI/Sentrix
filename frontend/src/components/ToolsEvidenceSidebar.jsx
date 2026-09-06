import React, { useState } from "react";
import { 
  Server, 
  Database, 
  Terminal, 
  BookOpen, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  X, 
  Clock, 
  ExternalLink,
  Copy,
  Check,
  FileCode,
  Activity,
  Zap,
  Ticket,
  Search
} from "lucide-react";

export function ToolsEvidenceSidebar({ evidence, isOpen, onClose }) {
  const [expandedTool, setExpandedTool] = useState({
    jira: true,
    oracle: true,
    unix: true,
    splunk: true,
    confluence: false,
    postgres: false,
    kubernetes: false,
    okf: false
  });
  const [copiedKey, setCopiedKey] = useState(null);

  if (!isOpen) return null;

  const toggleTool = (toolKey) => {
    setExpandedTool((prev) => ({
      ...prev,
      [toolKey]: !prev[toolKey]
    }));
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getToolMeta = (key) => {
    switch (key) {
      case "jira":
        return { name: "Atlassian Jira ITSM", icon: Ticket, color: "var(--accent-blue)", bg: "rgba(59, 130, 246, 0.15)" };
      case "oracle":
        return { name: "Oracle Billing & Core DB", icon: Database, color: "var(--accent-amber)", bg: "rgba(245, 158, 11, 0.15)" };
      case "unix":
        return { name: "Unix / Host Log Inspector", icon: FileCode, color: "var(--accent-teal)", bg: "rgba(78, 230, 199, 0.15)" };
      case "splunk":
        return { name: "Splunk Enterprise Logs", icon: Server, color: "var(--accent-amber)", bg: "rgba(245, 158, 11, 0.15)" };
      case "signalfx":
        return { name: "Splunk Observability (SignalFx)", icon: Activity, color: "var(--accent-violet)", bg: "rgba(139, 125, 255, 0.15)" };
      case "kafka":
        return { name: "Apache Kafka Event Bus", icon: Zap, color: "var(--prism-pink)", bg: "rgba(225, 29, 72, 0.15)" };
      case "qtest":
        return { name: "Tricentis qTest", icon: Activity, color: "var(--accent-teal)", bg: "rgba(78, 230, 199, 0.15)" };
      case "confluence":
        return { name: "Confluence Runbooks", icon: BookOpen, color: "var(--accent-violet)", bg: "rgba(139, 125, 255, 0.15)" };
      case "postgres":
        return { name: "PostgreSQL Primary", icon: Database, color: "var(--accent-blue)", bg: "rgba(59, 130, 246, 0.15)" };
      case "kubernetes":
        return { name: "Kubernetes Cluster", icon: Terminal, color: "var(--prism-pink)", bg: "rgba(225, 29, 72, 0.15)" };
      case "okf":
        return { name: "OKF Knowledge Fabric", icon: BookOpen, color: "var(--accent-violet)", bg: "rgba(139, 125, 255, 0.15)" };
      default:
        return { name: key.toUpperCase(), icon: Layers, color: "var(--ink-secondary)", bg: "rgba(255, 255, 255, 0.1)" };
    }
  };

  const evidenceEntries = evidence ? Object.entries(evidence) : [];

  return (
    <aside className="evidence-inspector-sidebar">
      {/* Sidebar Top Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--thinking-bg)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Layers size={16} color="var(--prism-pink)" />
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-primary)", margin: 0 }}>
            Tools Evidence
          </h3>
          <span className="mono badge badge-magenta" style={{ fontSize: "9.5px" }}>
            {evidenceEntries.length} Tools Acquired
          </span>
        </div>

        <button 
          className="btn-ghost" 
          onClick={onClose}
          style={{ padding: "4px" }}
          title="Close Evidence Inspector"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable Tool Evidence Cards Container */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}>
        {evidenceEntries.map(([key, toolData]) => {
          const meta = getToolMeta(key);
          const Icon = meta.icon;
          const isExpanded = expandedTool[key] !== false;

          return (
            <div key={key} className="tool-evidence-card">
              <div 
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                onClick={() => toggleTool(key)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={14} color={meta.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--ink-primary)" }}>
                      {toolData.tool_name || meta.name}
                    </div>
                    <span className="mono" style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>
                      {toolData.latency ? `Latency: ${toolData.latency}` : (toolData.latency_ms ? `${toolData.latency_ms}ms` : "Acquired")}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className={`badge ${toolData.status === "FAILED" ? "badge-rose" : "badge-teal"}`} style={{ fontSize: "9px" }}>
                    {toolData.status || "HEALTHY"}
                  </span>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                  {/* Operation & Canonical Hash */}
                  {toolData.operation && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span className="badge badge-violet mono" style={{ fontSize: "9px" }}>
                        {toolData.operation}
                      </span>
                      {toolData.canonical_hash && (
                        <span className="mono" style={{ fontSize: "9px", color: "var(--ink-tertiary)" }} title={toolData.canonical_hash}>
                          sha256:{toolData.canonical_hash.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                  )}

                  {/* Observations */}
                  {toolData.observations && toolData.observations.length > 0 && (
                    <div style={{ marginBottom: "8px" }}>
                      <div style={{ fontSize: "10px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>
                        Observations ({toolData.observations.length}):
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {toolData.observations.map((obs, i) => (
                          <div key={i} style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", padding: "6px 8px", borderRadius: "4px", fontSize: "10.5px", color: "var(--ink-primary)", lineHeight: "1.4" }}>
                            • {obs}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Discovered Signals */}
                  {toolData.discovered_signals && Object.keys(toolData.discovered_signals).length > 0 && (
                    <div style={{ marginBottom: "8px" }}>
                      <div style={{ fontSize: "10px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>
                        Discovered Signals:
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {Object.entries(toolData.discovered_signals).map(([sigKey, sigVal]) => (
                          <span key={sigKey} className="badge badge-amber mono" style={{ fontSize: "9px" }}>
                            {sigKey}: {String(sigVal)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Generic query/command */}
                  {toolData.query && (
                    <div style={{ marginBottom: "8px" }}>
                      <div style={{ fontSize: "10px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>
                        Query:
                      </div>
                      <div className="mono" style={{ fontSize: "10.5px", color: "var(--accent-teal)", background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", padding: "6px 8px", borderRadius: "4px", overflowX: "auto" }}>
                        {toolData.query}
                      </div>
                    </div>
                  )}

                  {/* Generic events list */}
                  {toolData.events && toolData.events.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {toolData.events.map((evt, i) => (
                        <div key={i} style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", padding: "8px", borderRadius: "6px", fontSize: "11px", borderLeft: evt.level === "ERROR" ? "3px solid var(--accent-rose)" : "3px solid var(--accent-amber)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                            <span className="mono" style={{ fontSize: "9.5px", color: "var(--ink-tertiary)" }}>{evt.time || ""}</span>
                            <span className={`badge ${evt.level === "ERROR" ? "badge-rose" : "badge-amber"}`} style={{ fontSize: "8.5px", padding: "1px 5px" }}>
                              {evt.level || "INFO"}
                            </span>
                          </div>
                          <div style={{ color: "var(--ink-primary)", lineHeight: "1.4" }}>{evt.msg || JSON.stringify(evt)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

