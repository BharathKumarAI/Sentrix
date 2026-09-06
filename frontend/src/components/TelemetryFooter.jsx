import React, { useState, useEffect } from "react";
import { Activity, ShieldCheck, Database, Cpu, Clock, CheckCircle2 } from "lucide-react";

export function TelemetryFooter({ activeProject, activeEnvironment }) {
  const [healthData, setHealthData] = useState(null);
  const [heartbeatMs, setHeartbeatMs] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      const t0 = performance.now();
      try {
        const res = await fetch("/health");
        const roundTrip = Math.round(performance.now() - t0);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setHealthData(data);
            setHeartbeatMs(roundTrip);
          }
        }
      } catch {
        if (isMounted) {
          setHeartbeatMs(null);
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const dbInfo = healthData?.database || {};
  const isHealthy = healthData?.status === "UP";

  return (
    <footer
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "36px",
        background: "rgba(7, 10, 28, 0.92)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        fontSize: "11px",
        color: "var(--ink-secondary)",
        zIndex: 40
      }}
    >
      {/* Left: Engine & Active Project Scope */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Cpu size={13} style={{ color: "var(--accent-violet)" }} />
          <span>
            Runtime: <strong className="mono" style={{ color: "#fff" }}>ADK Engine {healthData?.adk_version ? `v${healthData.adk_version}` : "v2.8.0"}</strong>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <ShieldCheck size={13} style={{ color: "var(--accent-teal)" }} />
          <span>
            Active Scope: <strong style={{ color: "#fff" }}>{activeProject?.name || activeProject?.project_key || "Global Workspace"}</strong>
            {activeEnvironment?.name ? ` (${activeEnvironment.name})` : ""}
          </span>
        </div>
      </div>

      {/* Right: Live Telemetry & Heartbeat */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Database size={13} style={{ color: dbInfo.status === "HEALTHY" ? "var(--accent-teal)" : "var(--accent-rose)" }} />
          <span>
            PostgreSQL:{" "}
            <strong className="mono" style={{ color: dbInfo.status === "HEALTHY" ? "var(--accent-teal)" : "var(--accent-rose)" }}>
              {dbInfo.database || "prism_db"} ({dbInfo.status || "CHECKING"})
            </strong>
            {dbInfo.latency_ms !== undefined && (
              <span style={{ color: "var(--ink-tertiary)", marginLeft: "4px" }}>
                ({dbInfo.latency_ms}ms)
              </span>
            )}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <CheckCircle2 size={13} style={{ color: isHealthy ? "var(--accent-teal)" : "var(--accent-amber)" }} />
          <span>
            Platform: <strong className="mono" style={{ color: isHealthy ? "var(--accent-teal)" : "var(--accent-amber)" }}>
              {isHealthy ? "OPERATIONAL" : "CONNECTING"}
            </strong>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: heartbeatMs !== null ? "var(--accent-teal)" : "var(--accent-amber)",
              boxShadow: heartbeatMs !== null ? "0 0 8px var(--accent-teal)" : "none"
            }}
          />
          <span className="mono" style={{ color: "#fff" }}>
            {heartbeatMs !== null ? `${heartbeatMs}ms Heartbeat` : "Syncing..."}
          </span>
        </div>
      </div>
    </footer>
  );
}
