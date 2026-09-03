import React, { useState } from "react";
import { 
  BarChart2, 
  Table, 
  FileDiff, 
  Code, 
  ChevronRight, 
  Download, 
  Maximize2,
  TrendingUp,
  Activity
} from "lucide-react";

export function OpenWorkerArtifactRenderer({ artifactType = "CHART", data = null }) {
  const [activeView, setActiveView] = useState(artifactType); // CHART, TABLE, DIFF, JSON
  const [tableFilter, setTableFilter] = useState("");

  // Sample rich metric trend dataset (e.g. Splunk/Datadog latency spike during incident)
  const metricPoints = [
    { time: "14:00", p50: 18, p95: 45, p99: 120, errors: 0 },
    { time: "14:05", p50: 22, p95: 55, p99: 180, errors: 2 },
    { time: "14:10", p50: 85, p95: 420, p99: 1450, errors: 38 },
    { time: "14:15", p50: 160, p95: 1890, p99: 3800, errors: 86 }, // Peak anomaly
    { time: "14:20", p50: 140, p95: 1650, p99: 3400, errors: 72 },
    { time: "14:25", p50: 45, p95: 320, p99: 890, errors: 14 },   // Recovery after restart
    { time: "14:30", p50: 20, p95: 50, p99: 140, errors: 1 }
  ];

  // Database / Log table records
  const sampleRows = [
    { tx_id: "tx_998124_stripe", status: "PAYMENT_FAILED", error: "ERR_GATEWAY_TIMEOUT", latency: "30,000ms", retries: 3 },
    { tx_id: "tx_998125_stripe", status: "LEDGER_LOCKED", error: "PoolAcquireTimeoutException", latency: "30,000ms", retries: 2 },
    { tx_id: "tx_998126_stripe", status: "PAYMENT_FAILED", error: "HTTP 504 Gateway Timeout", latency: "30,000ms", retries: 3 },
    { tx_id: "tx_998127_adyen", status: "SETTLED_OK", error: "None", latency: "142ms", retries: 0 },
    { tx_id: "tx_998128_stripe", status: "PAYMENT_FAILED", error: "PoolAcquireTimeoutException", latency: "30,000ms", retries: 2 }
  ];

  return (
    <div className="glass-panel" style={{
      padding: "18px",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      border: "1px solid rgba(139, 125, 255, 0.35)",
      borderRadius: "var(--radius-md)"
    }}>
      {/* View Switcher Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity size={16} color="var(--accent-teal)" />
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#fff" }}>
            OpenWorker Adaptive Artifact Visualizer
          </span>
          <span className="badge badge-violet" style={{ fontSize: "9px" }}>Dynamic View</span>
        </div>

        {/* View Mode Buttons */}
        <div style={{ display: "flex", gap: "4px" }}>
          {[
            { id: "CHART", label: "Metric Chart", icon: BarChart2 },
            { id: "TABLE", label: "Interactive Table", icon: Table },
            { id: "DIFF", label: "Config Diff", icon: FileDiff },
            { id: "JSON", label: "Raw JSON", icon: Code }
          ].map((mode) => {
            const Icon = mode.icon;
            const isSelected = activeView === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveView(mode.id)}
                className="btn-ghost"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: isSelected ? "rgba(139, 125, 255, 0.2)" : "transparent",
                  color: isSelected ? "#fff" : "var(--ink-secondary)",
                  border: isSelected ? "1px solid rgba(139, 125, 255, 0.4)" : "1px solid transparent"
                }}
              >
                <Icon size={12} color={isSelected ? "var(--accent-teal)" : "currentColor"} />
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW 1: Interactive SVG Metric Trend Chart */}
      {activeView === "CHART" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
            <span style={{ color: "var(--ink-secondary)" }}>
              Telemetry Trend: <strong>p99 Latency (ms) & Error Volume (Spike at 14:15 UTC)</strong>
            </span>
            <div style={{ display: "flex", gap: "12px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--accent-rose)" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-rose)" }} /> Error Spike
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--accent-teal)" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-teal)" }} /> p99 Latency
              </span>
            </div>
          </div>

          {/* SVG Line / Bar Chart */}
          <div style={{
            background: "rgba(0, 0, 0, 0.45)",
            padding: "16px 12px 10px 12px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            height: "180px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "12px"
          }}>
            {metricPoints.map((pt) => {
              const heightPercent = Math.min(100, Math.round((pt.p99 / 4000) * 100));
              const errorHeight = Math.min(100, Math.round((pt.errors / 100) * 100));
              const isAnomaly = pt.errors > 30;
              return (
                <div key={pt.time} style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  height: "100%",
                  justifyContent: "flex-end"
                }}>
                  <div style={{ fontSize: "9px", color: isAnomaly ? "var(--accent-rose)" : "var(--ink-tertiary)" }}>
                    {pt.p99}ms
                  </div>

                  {/* Dual Bar (Latency + Error) */}
                  <div style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    gap: "2px",
                    height: "110px"
                  }}>
                    {/* Latency Bar */}
                    <div style={{
                      width: "14px",
                      height: `${heightPercent}%`,
                      background: isAnomaly 
                        ? "linear-gradient(180deg, #ff7ab6 0%, #8b7dff 100%)" 
                        : "linear-gradient(180deg, #4ee6c7 0%, #20b899 100%)",
                      borderRadius: "3px 3px 0 0",
                      transition: "height 0.4s ease",
                      boxShadow: isAnomaly ? "0 0 10px rgba(255, 122, 182, 0.5)" : "none"
                    }} />
                    
                    {/* Error Bar */}
                    {pt.errors > 0 && (
                      <div style={{
                        width: "8px",
                        height: `${errorHeight}%`,
                        background: "var(--accent-rose)",
                        borderRadius: "2px 2px 0 0"
                      }} />
                    )}
                  </div>

                  <span className="mono" style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>
                    {pt.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Interactive Data Table */}
      {activeView === "TABLE" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-glass)", textAlign: "left", color: "var(--ink-tertiary)" }}>
                  <th style={{ padding: "8px" }}>Transaction ID</th>
                  <th style={{ padding: "8px" }}>Status</th>
                  <th style={{ padding: "8px" }}>Gateway Error Code</th>
                  <th style={{ padding: "8px" }}>Latency</th>
                  <th style={{ padding: "8px" }}>Retries</th>
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "8px" }} className="mono">{r.tx_id}</td>
                    <td style={{ padding: "8px" }}>
                      <span className={`badge ${r.status === "SETTLED_OK" ? "badge-teal" : "badge-rose"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: "8px", color: r.error === "None" ? "var(--ink-tertiary)" : "#ffd699" }} className="mono">
                      {r.error}
                    </td>
                    <td style={{ padding: "8px" }} className="mono">{r.latency}</td>
                    <td style={{ padding: "8px" }} className="mono">{r.retries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Config Diff */}
      {activeView === "DIFF" && (
        <pre className="mono" style={{
          background: "rgba(0,0,0,0.5)",
          padding: "12px",
          borderRadius: "6px",
          fontSize: "11px",
          lineHeight: "1.5",
          color: "#4ee6c7",
          overflowX: "auto"
        }}>
{`--- /etc/postgresql/postgresql.conf (Production)
+++ /etc/postgresql/postgresql.conf.remediation
@@ -112,6 +112,6 @@
- max_connections = 20
+ max_connections = 100
- idle_in_transaction_session_timeout = 120000ms
+ idle_in_transaction_session_timeout = 15000ms
- tcp_keepalives_idle = 600
+ tcp_keepalives_idle = 30`}
        </pre>
      )}

      {/* VIEW 4: Raw JSON Tree */}
      {activeView === "JSON" && (
        <pre className="mono" style={{
          background: "rgba(0,0,0,0.5)",
          padding: "12px",
          borderRadius: "6px",
          fontSize: "11px",
          color: "var(--ink-primary)",
          maxHeight: "220px",
          overflowY: "auto"
        }}>
          {JSON.stringify({
            incident_telemetry: {
              source: "splunk_datadog_postgres_correlation",
              cluster: "billing-prod",
              p99_latency_max: 3800,
              error_rate_peak: "86 errors/min",
              dominant_exception: "PoolAcquireTimeoutException",
              remediation_recommendations: [
                "Rollout restart deployment/stripe-webhook-worker",
                "Increase postgres max_connections from 20 to 100"
              ]
            }
          }, null, 2)}
        </pre>
      )}
    </div>
  );
}
