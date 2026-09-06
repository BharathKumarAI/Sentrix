import React, { useState, useEffect } from "react";
import { 
  Sliders, 
  Lock, 
  ShieldAlert, 
  Layers, 
  User, 
  Check, 
  Edit3, 
  RotateCcw,
  Search,
  Filter
} from "lucide-react";
import { fetchParameters, setParameterOverride, getCurrentUserId } from "../api/client";

export function ParameterStudio({ activeProject, isAdmin = true }) {
  const [params, setParams] = useState([]);
  const [filterSection, setFilterSection] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingParam, setEditingParam] = useState(null);
  const [overrideValue, setOverrideValue] = useState("");
  const [overrideLevel, setOverrideLevel] = useState("PROJECT");
  const [isSaving, setIsSaving] = useState(false);

  const loadParameters = async () => {
    try {
      const data = await fetchParameters(activeProject?.id, isAdmin);
      setParams(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading parameters", e);
    }
  };

  useEffect(() => {
    loadParameters();
  }, [activeProject, isAdmin]);

  const handleSaveOverride = async () => {
    if (!editingParam) return;
    setIsSaving(true);
    try {
      let parsedVal = overrideValue;
      if (editingParam.data_type === "number") parsedVal = Number(overrideValue);
      if (editingParam.data_type === "boolean") parsedVal = overrideValue === "true" || overrideValue === true;

      await setParameterOverride({
        parameter_key: editingParam.parameter_key,
        level: overrideLevel,
        project_id: overrideLevel === "PROJECT" ? activeProject?.id : null,
        user_id: overrideLevel === "USER" ? getCurrentUserId() : null,
        configured_value: parsedVal
      });

      await loadParameters();
      setEditingParam(null);
    } catch (e) {
      console.error("Failed to save override", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter parameters
  const filtered = params.filter((p) => {
    const matchesSearch = p.parameter_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.display_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = filterSection === "ALL" || p.ui_section === filterSection;
    return matchesSearch && matchesSection;
  });

  const sections = ["ALL", ...new Set(params.map(p => p.ui_section).filter(Boolean))];

  return (
    <div style={{
      padding: "24px 32px",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      overflowY: "auto",
      minHeight: "100%",
      boxSizing: "border-box"
    }}>
      
      {/* Framework Page Hero Card */}
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
            <Sliders size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                {activeProject?.project_key || ""} • CONFIGURATION PARAMETERS
              </span>
              <span className="badge badge-teal">Zero Hardcoding</span>
              <span className="badge badge-magenta">3-Tier Hierarchy</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Hierarchical Tool-Wise Parameter Studio
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Manages Platform-Only, Project-Overridable, and User-Customized configuration boundaries.
            </p>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span className="badge badge-magenta" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Lock size={10} /> PLATFORM ONLY
          </span>
          <span className="badge badge-teal" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Layers size={10} /> PROJECT OVERRIDABLE
          </span>
          <span className="badge badge-amber" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <User size={10} /> USER CUSTOMIZED
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {sections.map((sec) => (
            <button
              key={sec}
              className={filterSection === sec ? "btn-primary" : "btn-secondary"}
              style={{ fontSize: "11px", padding: "5px 12px" }}
              onClick={() => setFilterSection(sec)}
            >
              {sec}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", width: "260px" }}>
          <Search size={14} color="var(--ink-tertiary)" style={{ position: "absolute", left: "10px", top: "10px" }} />
          <input
            type="text"
            placeholder="Search parameters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 32px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid var(--border-glass)",
              borderRadius: "var(--radius-pill)",
              color: "#fff",
              fontSize: "12px"
            }}
          />
        </div>
      </div>

      {/* Parameters Table */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-glass)", textAlign: "left", color: "var(--ink-tertiary)" }}>
                <th style={{ padding: "10px" }}>Parameter Key & Name</th>
                <th style={{ padding: "10px" }}>Scope Level</th>
                <th style={{ padding: "10px" }}>Platform Default</th>
                <th style={{ padding: "10px" }}>Effective Project Value</th>
                <th style={{ padding: "10px" }}>Inheritance Status</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isPlatformOnly = p.scope_level === "PLATFORM_ONLY";
                return (
                  <tr key={p.parameter_key} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                    <td style={{ padding: "10px" }}>
                      <div style={{ fontWeight: "600", color: "#fff" }}>{p.display_name}</div>
                      <div className="mono" style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>{p.parameter_key}</div>
                    </td>
                    
                    <td style={{ padding: "10px" }}>
                      <span className={`badge ${
                        p.scope_level === "PLATFORM_ONLY" ? "badge-rose" :
                        p.scope_level === "USER_CUSTOMIZED" ? "badge-violet" : "badge-teal"
                      }`}>
                        {p.scope_level}
                      </span>
                    </td>

                    <td style={{ padding: "10px" }} className="mono">
                      {p.is_secret ? "••••••••" : JSON.stringify(p.default_value)}
                    </td>

                    <td style={{ padding: "10px" }} className="mono">
                      <strong style={{ color: p.has_project_override ? "var(--accent-teal)" : "var(--ink-primary)" }}>
                        {p.is_secret ? "••••••••" : JSON.stringify(p.effective_value)}
                      </strong>
                    </td>

                    <td style={{ padding: "10px" }}>
                      {p.has_project_override ? (
                        <span className="badge badge-teal">Project Override Active</span>
                      ) : (
                        <span style={{ color: "var(--ink-tertiary)" }}>Inherited from Platform</span>
                      )}
                    </td>

                    <td style={{ padding: "10px", textAlign: "right" }}>
                      {!isPlatformOnly && (
                        <button
                          className="btn-ghost"
                          style={{ padding: "4px 8px" }}
                          onClick={() => {
                            setEditingParam(p);
                            setOverrideValue(String(p.effective_value));
                            setOverrideLevel(p.scope_level === "USER_CUSTOMIZED" ? "USER" : "PROJECT");
                          }}
                        >
                          <Edit3 size={13} /> Override
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Parameter Modal */}
      {editingParam && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100
        }}>
          <div className="glass-panel" style={{ width: "480px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "16px" }}>Configure Override: {editingParam.display_name}</h3>
            
            <div>
              <div className="mono" style={{ fontSize: "12px", color: "var(--ink-tertiary)" }}>{editingParam.parameter_key}</div>
              <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "4px" }}>{editingParam.description}</p>
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>Override Level</label>
              <select
                value={overrideLevel}
                onChange={(e) => setOverrideLevel(e.target.value)}
                className="glass-card"
                style={{ width: "100%", padding: "8px 12px", marginTop: "4px", color: "var(--ink-input)", background: "var(--bg-input)" }}
              >
                <option value="PROJECT">Project Level Override ({activeProject?.name})</option>
                <option value="USER">User Customized Override (Current User)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>New Parameter Value</label>
              <input
                type="text"
                value={overrideValue}
                onChange={(e) => setOverrideValue(e.target.value)}
                className="glass-card mono"
                style={{ width: "100%", padding: "8px 12px", marginTop: "4px", color: "var(--accent-teal)" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button className="btn-secondary" onClick={() => setEditingParam(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveOverride} disabled={isSaving}>
                <Check size={14} /> Save Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
