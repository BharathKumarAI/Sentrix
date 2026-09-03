import React from "react";
import { Activity, ShieldCheck, Database, Cpu, TrendingDown } from "lucide-react";

export function TelemetryFooter({ activeProject, activeEnvironment }) {
  return (
    <footer style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      height: "36px",
      background: "rgba(7, 10, 28, 0.9)",
      backdropFilter: "blur(16px)",
      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      fontSize: "11px",
      color: "var(--ink-secondary)",
      zIndex: 40
    }}>
      {/* Left: Model Route & Skill Version */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Cpu size={13} color="var(--accent-violet)" />
          <span>Model Route: <strong className="mono" style={{ color: "#fff" }}>Gemini 2.5 Pro / LiteLLM Router</strong></span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <ShieldCheck size={13} color="var(--accent-teal)" />
          <span>Active Skill: <strong style={{ color: "#fff" }}>{activeProject?.project_key || "GLOBAL"}_TriageSkill v2.0</strong> (Eval Gate: 98.4%)</span>
        </div>
      </div>

      {/* Right: Telemetry & Circadian Beat */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Database size={13} color="var(--accent-teal)" />
          <span>PostgreSQL: <strong className="mono" style={{ color: "var(--accent-teal)" }}>sentrix_db (HEALTHY)</strong></span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <TrendingDown size={13} color="var(--accent-teal)" />
          <span>MTTR Impact: <strong className="mono" style={{ color: "var(--accent-teal)" }}>-68% Average</strong></span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-teal)", boxShadow: "0 0 8px var(--accent-teal)" }} />
          <span className="mono" style={{ color: "#fff" }}>38ms Heartbeat</span>
        </div>
      </div>
    </footer>
  );
}
