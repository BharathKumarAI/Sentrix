import React, { useState, useEffect } from "react";
import { 
  Network, 
  Globe, 
  ArrowRight, 
  Layers, 
  Server, 
  Check, 
  Edit3, 
  Plus,
  Info
} from "lucide-react";
import { fetchProjectEnvMappings, updateProjectEnvMapping } from "../api/client";

export function EnvironmentMatrixEditor({ activeProject }) {
  const [mappings, setMappings] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newToolEnv, setNewToolEnv] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeProject?.id) {
      fetchProjectEnvMappings(activeProject.id)
        .then((data) => setMappings(Array.isArray(data) ? data : []))
        .catch((e) => console.error(e));
    }
  }, [activeProject]);

  const handleSaveMapping = async (m) => {
    setIsSaving(true);
    try {
      await updateProjectEnvMapping({
        project_id: m.project_id,
        project_environment: m.project_environment,
        connector_instance_id: m.connector_id,
        tool_environment: newToolEnv || m.tool_environment,
        notes: m.notes
      });
      setMappings((prev) =>
        prev.map((item) => (item.id === m.id ? { ...item, tool_environment: newToolEnv || item.tool_environment } : item))
      );
      setEditingId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px" }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Network size={18} color="var(--accent-teal)" />
          <h2 style={{ fontSize: "18px" }}>Flexible Environment Resolution Matrix</h2>
        </div>
        <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "4px" }}>
          Maps <strong>Project Environments</strong> (e.g. <code>dev</code>, <code>staging</code>, <code>prod</code>) to <strong>Tool/Connector Environments</strong> (e.g. <code>splunk-prod-cluster</code>, <code>jira-cloud-uat</code>).
        </p>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginTop: "12px",
          padding: "10px 14px",
          borderRadius: "var(--radius-sm)",
          background: "rgba(78, 230, 199, 0.08)",
          border: "1px solid rgba(78, 230, 199, 0.25)"
        }}>
          <Globe size={16} color="var(--accent-teal)" />
          <span style={{ fontSize: "12px", color: "var(--ink-primary)" }}>
            <strong>Global Tools:</strong> Connectors marked as <code>is_global = true</code> (such as Central Documentation MCP and Slack Broadcast Hub) are accessible across <strong>ALL</strong> project environments automatically.
          </span>
        </div>
      </div>

      {/* Mappings Table */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "15px", color: "#fff" }}>
            Active Environment Mappings for {activeProject?.name} ({activeProject?.project_key})
          </h3>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-glass)", textAlign: "left", color: "var(--ink-tertiary)" }}>
                <th style={{ padding: "10px" }}>Project Environment</th>
                <th style={{ padding: "10px" }}>Target Connector / Tool</th>
                <th style={{ padding: "10px" }}>Resolved Tool Environment</th>
                <th style={{ padding: "10px" }}>Status</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m) => {
                const isEditing = editingId === m.id;
                return (
                  <tr key={m.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                    <td style={{ padding: "10px" }}>
                      <span className="mono badge badge-violet" style={{ fontSize: "11px" }}>
                        {m.project_environment}
                      </span>
                    </td>
                    <td style={{ padding: "10px", fontWeight: "600", color: "#fff" }}>
                      {m.connector_name}
                      <div className="mono" style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>{m.connector_key}</div>
                    </td>
                    <td style={{ padding: "10px" }}>
                      {isEditing ? (
                        <input
                          type="text"
                          defaultValue={m.tool_environment}
                          onChange={(e) => setNewToolEnv(e.target.value)}
                          className="glass-card mono"
                          style={{ padding: "4px 8px", fontSize: "12px", color: "#4ee6c7" }}
                        />
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <ArrowRight size={13} color="var(--accent-teal)" />
                          <span className="mono" style={{ color: "var(--accent-teal)", fontWeight: "600" }}>
                            {m.tool_environment}
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span className="badge badge-teal">Active</span>
                    </td>
                    <td style={{ padding: "10px", textAlign: "right" }}>
                      {isEditing ? (
                        <button
                          className="btn-teal"
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                          onClick={() => handleSaveMapping(m)}
                          disabled={isSaving}
                        >
                          <Check size={12} /> Save
                        </button>
                      ) : (
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            className="btn-ghost"
                            style={{ padding: "4px 8px" }}
                            onClick={() => {
                              setEditingId(m.id);
                              setNewToolEnv(m.tool_environment);
                            }}
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          <button
                            className="btn-ghost"
                            style={{ padding: "4px 8px", color: "var(--accent-rose)" }}
                            onClick={async () => {
                              await fetch(`http://localhost:8000/api/connectors/mappings/${m.id}`, { method: "DELETE" });
                              setMappings((prev) => prev.filter((item) => item.id !== m.id));
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
