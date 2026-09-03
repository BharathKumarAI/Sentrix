import React, { useState, useEffect } from "react";
import { 
  Layers, 
  Check, 
  Terminal, 
  Eye, 
  ShieldAlert, 
  BookOpen, 
  Save,
  SlidersHorizontal
} from "lucide-react";
import { fetchProjectInstructions, updateProjectInstructions } from "../api/client";

export function ProjectCustomizationView({ activeProject }) {
  const [directives, setDirectives] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [domainContext, setDomainContext] = useState("");
  const [escalationPolicy, setEscalationPolicy] = useState("");
  const [displayMode, setDisplayMode] = useState("CARD");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (activeProject?.id) {
      fetchProjectInstructions(activeProject.id).then((data) => {
        setDirectives(data.prompt_directives || "");
        setGuidelines(data.triage_guidelines || "");
        setDomainContext(data.domain_context || "");
        setEscalationPolicy(data.escalation_policy || "");
      });
    }
  }, [activeProject]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProjectInstructions(activeProject.id, {
        prompt_directives: directives,
        triage_guidelines: guidelines,
        domain_context: domainContext,
        escalation_policy: escalationPolicy
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

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
            <Layers size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                {activeProject?.project_key || "BILLING"} • SETTINGS & INSTRUCTIONS
              </span>
              <span className="badge badge-teal">Project Directives</span>
              <span className="badge badge-magenta">ADK Ingest</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Project Customization & Setup Instructions
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Configure custom prompt directives, domain knowledge, and tool output presentation rules for <strong>{activeProject?.name}</strong>.
            </p>
          </div>
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={isSaving} style={{ gap: "6px" }}>
          <Save size={14} /> {isSaving ? "Saving..." : savedSuccess ? "Saved!" : "Save Configuration"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        
        {/* Left Column: Prompt Directives & Domain Context */}
        <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ fontSize: "15px", color: "#fff" }}>AI Triage Directives & Persona</h3>
          
          <div>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
              Project Prompt Directives (Injected into ADK Agents)
            </label>
            <textarea
              rows={6}
              value={directives}
              onChange={(e) => setDirectives(e.target.value)}
              className="glass-card"
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "6px",
                background: "rgba(255,255,255,0.03)",
                color: "#fff",
                fontSize: "12px",
                lineHeight: "1.5",
                resize: "vertical"
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
              Domain & Architecture Context
            </label>
            <textarea
              rows={3}
              value={domainContext}
              onChange={(e) => setDomainContext(e.target.value)}
              className="glass-card"
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "6px",
                background: "rgba(255,255,255,0.03)",
                color: "#fff",
                fontSize: "12px",
                lineHeight: "1.5"
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
              Escalation Policy
            </label>
            <input
              type="text"
              value={escalationPolicy}
              onChange={(e) => setEscalationPolicy(e.target.value)}
              className="glass-card"
              style={{ width: "100%", padding: "10px 12px", marginTop: "6px", color: "#fff", fontSize: "12px" }}
            />
          </div>
        </div>

        {/* Right Column: Display Instructions & Tool Render Rules */}
        <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ fontSize: "15px", color: "#fff" }}>Tool Data Display Preferences</h3>

          <div>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
              Default Output Presentation Mode
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
              {[
                { id: "CARD", label: "Evidence Cards", desc: "Clean summary tiles with confidence badges" },
                { id: "TABLE", label: "Data Table View", desc: "Tabular view for logs and database records" },
                { id: "DIFF", label: "Code Diff Inspector", desc: "Highlight patch changes and stacktrace diffs" },
                { id: "RAW_JSON", label: "Raw JSON Tree", desc: "Unfiltered JSON payloads for deep debugging" }
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => setDisplayMode(m.id)}
                  className="glass-card"
                  style={{
                    padding: "12px",
                    cursor: "pointer",
                    border: displayMode === m.id ? "1px solid var(--accent-teal)" : "1px solid var(--border-glass)",
                    background: displayMode === m.id ? "rgba(78, 230, 199, 0.1)" : "var(--bg-surface-glass)"
                  }}
                >
                  <div style={{ fontSize: "13px", fontWeight: "600", color: displayMode === m.id ? "var(--accent-teal)" : "#fff" }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--ink-secondary)", marginTop: "3px" }}>
                    {m.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
              Security Redaction & Triage Safety Guidelines
            </label>
            <textarea
              rows={4}
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              className="glass-card"
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "6px",
                background: "rgba(255,255,255,0.03)",
                color: "#ff9ec7",
                fontSize: "12px",
                lineHeight: "1.5"
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
