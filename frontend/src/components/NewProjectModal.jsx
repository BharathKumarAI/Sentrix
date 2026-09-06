import React, { useState } from "react";
import { X, Layers, Plus, Check } from "lucide-react";
import { createProject } from "../api/client";

export function NewProjectModal({ onClose, onProjectCreated }) {
  const [projectKey, setProjectKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [criticalityTier, setCriticalityTier] = useState("");
  const [defaultEnv, setDefaultEnv] = useState("prod");
  const [environments, setEnvironments] = useState(["dev", "staging", "prod"]);
  const [newEnvInput, setNewEnvInput] = useState("");
  const [ticketingSystem, setTicketingSystem] = useState("jira");
  const [enableSla, setEnableSla] = useState(true);
  const [slaConfig, setSlaConfig] = useState({
    Blocker: "2h",
    Critical: "4h",
    Major: "8h",
    Minor: "24h",
    Trivial: "48h"
  });
  const [newPriorityKey, setNewPriorityKey] = useState("");
  const [newPrioritySla, setNewPrioritySla] = useState("");
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
        setDefaultEnv(environments.find((e) => e !== env) || "");
      }
    }
  };

  const handleTicketingChange = (system) => {
    setTicketingSystem(system);
    if (system === "jira") {
      setSlaConfig({
        Blocker: "2h",
        Critical: "4h",
        Major: "8h",
        Minor: "24h",
        Trivial: "48h"
      });
    } else if (system === "servicenow") {
      setSlaConfig({
        "P1 - Critical": "1h",
        "P2 - High": "4h",
        "P3 - Moderate": "12h",
        "P4 - Low": "24h",
        "P5 - Planning": "48h"
      });
    } else {
      setSlaConfig({
        P1: "1h",
        P2: "4h",
        P3: "24h",
        P4: "72h"
      });
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
        criticality_tier: criticalityTier || null,
        default_environment: defaultEnv || null,
        environments: environments,
        ticketing_system: ticketingSystem,
        sla_config: enableSla ? slaConfig : {}
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
        width: "560px",
        maxHeight: "90vh",
        overflowY: "auto",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        borderRadius: "var(--radius-md)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Layers size={18} color="var(--accent-teal)" />
            <h3 style={{ fontSize: "16px", color: "#fff" }}>Add New Project</h3>
          </div>
          <button className="btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>Project Key</label>
              <input
                type="text"
                placeholder="e.g. BILLING"
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
                placeholder="e.g. Payment Gateway"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-card"
                style={{ width: "100%", padding: "8px 12px", marginTop: "4px", color: "#fff" }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>Description</label>
            <textarea
              rows={2}
              placeholder="Project purpose, service scope, and monitored dependencies..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-card"
              style={{ width: "100%", padding: "8px 12px", marginTop: "4px", color: "#fff", fontSize: "12px", resize: "none" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>Criticality Tier</label>
                <span style={{ fontSize: "10px", color: "var(--ink-muted)" }}>Optional</span>
              </div>
              <select
                value={criticalityTier}
                onChange={(e) => setCriticalityTier(e.target.value)}
                className="glass-card"
                style={{ width: "100%", padding: "8px 12px", marginTop: "4px", color: "#fff", background: "var(--bg-input)" }}
              >
                <option value="">None / Optional</option>
                <option value="Tier-1 Mission Critical">Tier-1 Mission Critical (SLA 99.99%)</option>
                <option value="Tier-2 High Availability">Tier-2 High Availability (SLA 99.9%)</option>
                <option value="Tier-3 Standard">Tier-3 Standard Internal Service</option>
              </select>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>Default Environment</label>
                <span style={{ fontSize: "10px", color: "var(--ink-muted)" }}>Optional</span>
              </div>
              <select
                value={defaultEnv}
                onChange={(e) => setDefaultEnv(e.target.value)}
                className="glass-card"
                style={{ width: "100%", padding: "8px 12px", marginTop: "4px", color: "#fff", background: "var(--bg-input)" }}
              >
                <option value="">None / Optional</option>
                {environments.map((env) => (
                  <option key={env} value={env}>{env.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
              Define Custom Environments
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
                <Plus size={14} /> Add
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

          {/* SLA Configuration */}
          <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                Incident Priority SLAs (Optional)
              </span>
              <label style={{ fontSize: "11px", color: "var(--ink-secondary)", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={enableSla}
                  onChange={(e) => setEnableSla(e.target.checked)}
                  style={{ accentColor: "var(--prism-pink)" }}
                />
                Track SLAs
              </label>
            </div>

            {enableSla && (
              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  {[
                    { id: "jira", label: "Jira" },
                    { id: "servicenow", label: "ServiceNow" },
                    { id: "custom", label: "Standard / Custom" }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTicketingChange(t.id)}
                      style={{
                        padding: "3px 8px",
                        fontSize: "11px",
                        borderRadius: "4px",
                        border: ticketingSystem === t.id ? "1px solid var(--prism-magenta)" : "1px solid var(--border-subtle)",
                        background: ticketingSystem === t.id ? "rgba(225, 29, 72, 0.15)" : "transparent",
                        color: ticketingSystem === t.id ? "var(--prism-pink)" : "var(--ink-secondary)",
                        cursor: "pointer"
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "6px" }}>
                  {Object.entries(slaConfig).map(([prio, val]) => (
                    <div key={prio} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", background: "var(--bg-app)", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
                      <span style={{ fontSize: "11px", color: "var(--ink-primary)", fontWeight: 600 }}>{prio}</span>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => setSlaConfig({ ...slaConfig, [prio]: e.target.value })}
                        style={{ width: "42px", padding: "2px 4px", fontSize: "10.5px", background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--accent-teal)", textAlign: "center", borderRadius: "3px", fontFamily: "monospace" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
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
