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
  Check
} from "lucide-react";

export function ToolsEvidenceSidebar({ evidence, isOpen, onClose }) {
  const [expandedTool, setExpandedTool] = useState({
    splunk: true,
    postgres: true,
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

  const splunk = evidence?.splunk;
  const postgres = evidence?.postgres;
  const k8s = evidence?.kubernetes;
  const okf = evidence?.okf;

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
            4 Active
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
        padding: "16px"
      }}>
        {/* Tool 1: Splunk Logs */}
        {splunk && (
          <div className="tool-evidence-card">
            <div 
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
              onClick={() => toggleTool("splunk")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Server size={14} color="var(--accent-amber)" />
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--ink-primary)" }}>{splunk.tool_name}</div>
                  <span className="mono" style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>Latency: {splunk.latency}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="badge badge-teal" style={{ fontSize: "9px" }}>{splunk.status}</span>
                {expandedTool.splunk ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            </div>

            {expandedTool.splunk && (
              <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                <div style={{ fontSize: "10.5px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>
                  Search Query Executed:
                </div>
                <div className="mono" style={{ fontSize: "11px", color: "var(--accent-teal)", background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", padding: "6px 8px", borderRadius: "4px", marginBottom: "8px", overflowX: "auto" }}>
                  {splunk.query}
                </div>

                <div style={{ fontSize: "10.5px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: "600", marginBottom: "6px" }}>
                  Matching Events ({splunk.events?.length || 0}):
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {splunk.events?.map((evt, i) => (
                    <div key={i} style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", padding: "8px", borderRadius: "6px", fontSize: "11px", borderLeft: evt.level === "ERROR" ? "3px solid var(--accent-rose)" : "3px solid var(--accent-amber)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                        <span className="mono" style={{ fontSize: "9.5px", color: "var(--ink-tertiary)" }}>{evt.time}</span>
                        <span className={`badge ${evt.level === "ERROR" ? "badge-rose" : "badge-amber"}`} style={{ fontSize: "8.5px", padding: "1px 5px" }}>
                          {evt.level}
                        </span>
                      </div>
                      <div style={{ color: "var(--ink-primary)", lineHeight: "1.4" }}>{evt.msg}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tool 2: Governed PostgreSQL Replica */}
        {postgres && (
          <div className="tool-evidence-card">
            <div 
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
              onClick={() => toggleTool("postgres")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "rgba(59, 130, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Database size={14} color="var(--accent-blue)" />
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--ink-primary)" }}>{postgres.tool_name}</div>
                  <span className="mono" style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>Latency: {postgres.latency}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="badge badge-amber" style={{ fontSize: "9px" }}>{postgres.status}</span>
                {expandedTool.postgres ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            </div>

            {expandedTool.postgres && (
              <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "8px" }}>
                  <div style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", padding: "6px", borderRadius: "4px" }}>
                    <div style={{ fontSize: "9.5px", color: "var(--ink-tertiary)" }}>Active / Max Pool</div>
                    <div className="mono" style={{ fontSize: "12px", fontWeight: "700", color: "var(--accent-rose)" }}>
                      {postgres.metrics?.active_connections}
                    </div>
                  </div>
                  <div style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", padding: "6px", borderRadius: "4px" }}>
                    <div style={{ fontSize: "9.5px", color: "var(--ink-tertiary)" }}>Waiting Threads</div>
                    <div className="mono" style={{ fontSize: "12px", fontWeight: "700", color: "var(--accent-amber)" }}>
                      {postgres.metrics?.waiting_threads}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: "10.5px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>
                  Slow Query Isolated:
                </div>
                <div className="mono" style={{ fontSize: "10.5px", color: "var(--accent-teal)", background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", padding: "6px 8px", borderRadius: "4px", overflowX: "auto" }}>
                  {postgres.slow_query}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tool 3: Kubernetes Cluster */}
        {k8s && (
          <div className="tool-evidence-card">
            <div 
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
              onClick={() => toggleTool("kubernetes")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "rgba(225, 29, 72, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Terminal size={14} color="var(--prism-pink)" />
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--ink-primary)" }}>{k8s.tool_name}</div>
                  <span className="mono" style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>Latency: {k8s.latency}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="badge badge-rose" style={{ fontSize: "9px" }}>{k8s.status}</span>
                {expandedTool.kubernetes ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            </div>

            {expandedTool.kubernetes && (
              <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                <div style={{ fontSize: "10.5px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>
                  Inspection Command:
                </div>
                <div className="mono" style={{ fontSize: "10.5px", color: "var(--accent-teal)", background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", padding: "6px 8px", borderRadius: "4px", marginBottom: "8px" }}>
                  {k8s.command}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {k8s.pod_events?.map((pe, i) => (
                    <div key={i} style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", padding: "8px", borderRadius: "6px", fontSize: "11px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                        <span className="mono" style={{ fontSize: "9.5px", color: "var(--ink-tertiary)" }}>{pe.time}</span>
                        <span className="badge badge-amber" style={{ fontSize: "8.5px", padding: "1px 5px" }}>{pe.reason}</span>
                      </div>
                      <div style={{ color: "var(--ink-primary)", lineHeight: "1.4" }}>{pe.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tool 4: OKF v2.0 Knowledge Precedents */}
        {okf && (
          <div className="tool-evidence-card">
            <div 
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
              onClick={() => toggleTool("okf")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "rgba(139, 125, 255, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={14} color="var(--accent-violet)" />
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--ink-primary)" }}>{okf.tool_name}</div>
                  <span className="mono" style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>Match: {okf.similarity}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="badge badge-violet" style={{ fontSize: "9px" }}>OKF v2.0</span>
                {expandedTool.okf ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            </div>

            {expandedTool.okf && (
              <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--ink-primary)", marginBottom: "4px" }}>
                  {okf.matched_node}
                </div>
                <div style={{ fontSize: "10.5px", color: "var(--accent-teal)", marginBottom: "8px" }}>
                  Precedent: {okf.precedent_incident}
                </div>

                <div style={{ fontSize: "10.5px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>
                  Recommended Steps:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "var(--ink-secondary)" }}>
                  {okf.runbook_steps?.map((st, i) => (
                    <div key={i}>{st}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
