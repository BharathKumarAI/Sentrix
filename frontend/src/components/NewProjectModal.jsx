import React, { useState } from "react";
import { X, Layers, Plus, Check } from "lucide-react";
import { createProject } from "../api/client";

export function NewProjectModal({ onClose, onProjectCreated }) {
  const [projectKey, setProjectKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultEnv, setDefaultEnv] = useState("prod");
  const [environments, setEnvironments] = useState(["dev", "staging", "prod"]);
  const [newEnvInput, setNewEnvInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddEnv = () => {
    const clean = newEnvInput.trim().toLowerCase();
    if (clean && !environments.includes(clean)) {
      setEnvironments([...environments, clean]);
      setNewEnvInput("");
    }
  };

  const handleRemoveEnv = (env) => {
    if (environments.length > 1) {
      setEnvironments(environments.filter((e) => e !== env));
      if (defaultEnv === env) {
        setDefaultEnv(environments.find((e) => e !== env) || "dev");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectKey.trim() || !name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await createProject({
        project_key: projectKey.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim(),
        default_environment: defaultEnv,
        environments: environments
      });
      onProjectCreated(res);
      onClose();
    } catch (err) {
      console.error("Failed to create project", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 200,
      padding: "20px"
    }}>
      <div className="glass-panel" style={{
        width: "520px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        borderRadius: "var(--radius-md)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Layers size={18} color="var(--accent-teal)" />
            <h3 style={{ fontSize: "16px", color: "#fff" }}>Add New Project (Dynamic Environments)</h3>
          </div>
          <button className="btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>Project Key</label>
            <input
              type="text"
              placeholder="e.g. AUTH, BILLING, CATALOG"
              value={projectKey}
              onChange={(e) => setProjectKey(e.target.value)}
              className="glass-card mono"
              style={{ width: "100%", padding: "8px 12px", marginTop: "4px", color: "var(--accent-teal)" }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>Project Name</label>
            <input
              type="text"
              placeholder="e.g. Identity & Access Broker"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-card"
              style={{ width: "100%", padding: "8px 12px", marginTop: "4px", color: "#fff" }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>Description</label>
            <textarea
              rows={2}
              placeholder="Project purpose, service scope, and business criticality..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-card"
              style={{ width: "100%", padding: "8px 12px", marginTop: "4px", color: "#fff", fontSize: "12px" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
              Define Custom Environments (Code=Template, DB=Data)
            </label>
            
            <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
              <input
                type="text"
                placeholder="e.g. sandbox, dev-us-east, qa-hotfix"
                value={newEnvInput}
                onChange={(e) => setNewEnvInput(e.target.value)}
                className="glass-card mono"
                style={{ flex: 1, padding: "6px 12px", fontSize: "12px", color: "#fff" }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddEnv(); }}}
              />
              <button type="button" className="btn-secondary" onClick={handleAddEnv}>
                <Plus size={14} /> Add Env
              </button>
            </div>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
              {environments.map((env) => (
                <span
                  key={env}
                  className="badge badge-violet"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    border: defaultEnv === env ? "1px solid var(--accent-teal)" : undefined
                  }}
                  onClick={() => setDefaultEnv(env)}
                  title="Click to set as default environment"
                >
                  <span className="mono">{env} {defaultEnv === env && "(Default)"}</span>
                  {environments.length > 1 && (
                    <X size={12} onClick={(e) => { e.stopPropagation(); handleRemoveEnv(env); }} />
                  )}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-teal" disabled={isSubmitting}>
              <Check size={14} /> {isSubmitting ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
