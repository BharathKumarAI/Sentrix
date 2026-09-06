import React, { useState, useEffect } from "react";
import { 
  Users, 
  Layers, 
  Cpu, 
  PlayCircle, 
  ShieldCheck, 
  Activity, 
  Server, 
  TrendingUp, 
  AlertTriangle, 
  Database,
  ArrowUpRight,
  Sparkles,
  RotateCw
} from "lucide-react";
import { fetchAdminDashboard } from "../api/client";
import { useAdminSync } from "../context/AdminSyncContext";

// Utility: normalise service status string → colour token
function statusColor(status = "") {
  const s = status.toUpperCase();
  if (s === "HEALTHY" || s === "OPERATIONAL") return "var(--accent-teal)";
  if (s === "DEGRADED" || s === "WARN") return "var(--accent-amber)";
  return "var(--accent-rose)";
}

// Utility: relative time from ISO string
function relativeTime(isoStr) {
  if (!isoStr) return "just now";
  const diffMs = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    fetchAdminDashboard()
      .then((d) => { if (d && !d.error) setData(d); })
      .catch((err) => console.warn("Dashboard fetch failed:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  useAdminSync(() => {
    loadData();
  });

  // ── Stats row (measured data) ──────────────────────
  const s = data?.stats || {};
  const stats = [
    {
      label: "Total Users",
      value: s.totalUsersDisplay || "—",
      change: s.newUsersWeek != null ? `↑ ${s.newUsersWeek} new this week` : "Loading…",
      icon: Users, color: "var(--prism-pink)"
    },
    {
      label: "Active Projects",
      value: s.activeProjects != null ? String(s.activeProjects) : "—",
      change: s.newProjectsWeek != null ? `↑ ${s.newProjectsWeek} new this week` : "Loading…",
      icon: Layers, color: "var(--accent-teal)"
    },
    {
      label: "Active Agents",
      value: s.totalAgents != null ? String(s.totalAgents) : "—",
      change: s.newAgentsWeek != null ? `↑ ${s.newAgentsWeek} new this week` : "Loading…",
      icon: Cpu, color: "var(--accent-violet)"
    },
    {
      label: "Total Executions",
      value: s.totalRunsDisplay || "—",
      change: s.runsWeek != null ? `↑ ${s.runsWeek} this week` : "Loading…",
      icon: PlayCircle, color: "var(--accent-amber)"
    },
    {
      label: "Healthy Services",
      value: s.healthyServicesPct != null ? `${s.healthyServicesPct}%` : "—",
      change: s.healthStatus || (isLoading ? "Checking…" : "Unavailable"),
      icon: ShieldCheck, color: "var(--accent-teal)"
    },
  ];

  // ── Health services (live) ────────────────────────────────────────────
  const healthServices = (data?.healthServices || []).map((svc) => ({
    name: svc.name,
    status: svc.status,
    color: statusColor(svc.status),
  }));

  // ── Recent alerts from audit feed (live) ─────────────────────────────
  const severityForAction = (action = "") => {
    const a = action.toUpperCase();
    if (a.includes("FAIL") || a.includes("ERROR") || a.includes("BREACH")) return "Critical";
    if (a.includes("WARN") || a.includes("LIMIT") || a.includes("LAG")) return "High";
    if (a.includes("ROTATE") || a.includes("UPDATED")) return "Medium";
    return "Info";
  };
  const systemAlerts = (data?.recentAuditFeed || []).slice(0, 4).map((e) => ({
    title: e.action.replace(/_/g, " "),
    location: e.resource || "system",
    time: relativeTime(e.occurred_at),
    severity: severityForAction(e.action),
  }));

  // ── Model provider usage (live) ───────────────────────────────────────
  const PROVIDER_COLORS = [
    "var(--prism-magenta)",
    "var(--accent-violet)",
    "var(--accent-teal)",
    "var(--accent-amber)",
    "var(--ink-secondary)",
  ];
  const providers = (data?.modelProviderBreakdown || []).map((p, i) => ({
    name: p.name,
    requests: p.tokens,
    pct: p.sharePct,
    color: PROVIDER_COLORS[i % PROVIDER_COLORS.length],
  }));

  // ── Execution trend for SVG sparkline ────────────────────────────────
  const trend = data?.executionTrend || [];
  const trendMax = data?.trendMax || 1;

  // Map trend into SVG path points (600 wide, 180 tall)
  const svgPoints = trend.map((d, i) => {
    const x = trend.length > 1 ? (i / (trend.length - 1)) * 600 : 300;
    const y = 180 - ((d.count / trendMax) * 155 + 10);
    return { x, y, label: d.date, count: d.count };
  });
  const pathD = svgPoints.length > 1
    ? `M ${svgPoints.map((p) => `${p.x} ${p.y}`).join(" L ")}`
    : "M 0 90 L 600 90";
  const areaD = svgPoints.length > 1
    ? `${pathD} L ${svgPoints[svgPoints.length - 1].x} 180 L 0 180 Z`
    : "M 0 90 L 600 90 L 600 180 L 0 180 Z";

  return (
    <div style={{
      padding: "24px 32px",
      display: "flex",
      flexDirection: "column",
      gap: "24px",
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
              boxShadow: "0 0 18px var(--prism-glow)",
              flexShrink: 0
            }}
          >
            <Activity size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                PLATFORM ADMIN • LIVE OPERATIONS
              </span>
              <span className="badge badge-teal">Fleet Health: {isLoading ? "…" : s.healthyServicesPct != null ? `${s.healthyServicesPct}%` : "Unavailable"}</span>
              <span className="badge badge-magenta">{s.activeProjects ?? "…"} Active Projects</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Enterprise Admin Dashboard
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Platform-wide operational telemetry, fleet status, multi-tenant governance, and global resource consumption.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button className="btn-secondary" style={{ fontSize: "12px", gap: "6px" }}>
            <Activity size={14} /> Run Fleet Health Probe
          </button>
        </div>
      </div>

      {/* 5 KPI Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="prism-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "var(--thinking-bg)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: s.color
              }}>
                <Icon size={22} />
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: "600" }}>{s.label}</div>
                <div className="mono" style={{ fontSize: "22px", fontWeight: "800", color: "var(--ink-primary)" }}>{s.value}</div>
                <div style={{ fontSize: "10px", color: "var(--accent-teal)", marginTop: "2px" }}>{s.change}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Usage Chart, Health, and Alerts */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "20px" }}>
        
        {/* Platform Usage Chart */}
        <div className="prism-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--ink-primary)" }}>Platform Usage</h3>
              <p style={{ fontSize: "11px", color: "var(--ink-secondary)" }}>Executions over time</p>
            </div>
            <span className="mono badge badge-magenta">Last 7 days</span>
          </div>

          {/* SVG Live Trend Sparkline */}
          <div style={{ height: "180px", width: "100%", position: "relative" }}>
            {isLoading ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-tertiary)", fontSize: "12px", gap: "8px" }}>
                <RotateCw size={14} className="spin" /> Loading trend data…
              </div>
            ) : (
              <svg width="100%" height="100%" viewBox="0 0 600 180" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="35" x2="600" y2="35" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <line x1="0" y1="70" x2="600" y2="70" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <line x1="0" y1="105" x2="600" y2="105" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <line x1="0" y1="140" x2="600" y2="140" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                {svgPoints.length > 0 && (
                  <>
                    <path d={areaD} fill="url(#usageGrad)" />
                    <path d={pathD} fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinejoin="round" />
                    {svgPoints.map((pt, i) => (
                      <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#ec4899" />
                    ))}
                  </>
                )}
              </svg>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "var(--ink-tertiary)", borderTop: "1px solid var(--border-subtle)", paddingTop: "8px" }}>
            {trend.map((d, i) => <span key={i}>{d.date}</span>)}
          </div>
        </div>

        {/* Platform Health List */}
        <div className="prism-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--ink-primary)" }}>Platform Health</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {healthServices.map((svc) => (
              <div key={svc.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11.5px" }}>
                <span style={{ color: "var(--ink-primary)" }}>{svc.name}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: svc.color, fontWeight: "600" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: svc.color }} />
                  {svc.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent System Alerts */}
        <div className="prism-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--ink-primary)" }}>Recent Alerts</h3>
            <span style={{ fontSize: "11px", color: "var(--prism-pink)", cursor: "pointer" }}>View all</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {systemAlerts.map((alt, i) => (
              <div key={i} style={{ padding: "8px 10px", borderRadius: "6px", background: "var(--thinking-bg)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--ink-primary)" }}>{alt.title}</span>
                  <span className={`badge ${alt.severity === "Critical" ? "badge-rose" : alt.severity === "High" ? "badge-magenta" : "badge-amber"}`} style={{ fontSize: "9px" }}>
                    {alt.severity}
                  </span>
                </div>
                <div className="mono" style={{ fontSize: "10px", color: "var(--ink-tertiary)", marginTop: "2px" }}>
                  {alt.location} • {alt.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Row: Projects Donut, Model Providers, and Audit Logs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr", gap: "20px" }}>
        
        {/* Projects Overview */}
        <div className="prism-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
          <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-primary)" }}>Projects Fleet</h4>
            <span style={{ fontSize: "11px", color: "var(--prism-pink)", cursor: "pointer" }}>View all</span>
          </div>

          <div style={{ position: "relative", width: "120px", height: "120px" }}>
            <svg width="120" height="120" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--border-subtle)" strokeWidth="3.8" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="3.8" strokeDasharray="50, 100" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#8b7dff" strokeWidth="3.8" strokeDasharray="25, 100" strokeDashoffset="-50" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span className="mono" style={{ fontSize: "18px", fontWeight: "800", color: "var(--ink-primary)" }}>{s.totalProjects ?? "—"}</span>
              <span style={{ fontSize: "9px", color: "var(--ink-tertiary)" }}>Total Projects</span>
            </div>
          </div>

          <div style={{ width: "100%", display: "flex", justifyContent: "space-around", fontSize: "11px" }}>
            <span style={{ color: "var(--accent-teal)" }}>• Active {s.activeProjects ?? "—"} ({s.totalProjects ? Math.round((s.activeProjects / s.totalProjects) * 100) : 0}%)</span>
            <span style={{ color: "var(--accent-violet)" }}>• In Dev {s.devProjects ?? "—"} ({s.totalProjects ? Math.round((s.devProjects / s.totalProjects) * 100) : 0}%)</span>
          </div>
        </div>

        {/* Model Provider Usage */}
        <div className="prism-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-primary)" }}>Model Provider Usage</h4>
            <span style={{ fontSize: "11px", color: "var(--prism-pink)", cursor: "pointer" }}>View all</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {providers.map((p) => (
              <div key={p.name} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                  <span style={{ color: "var(--ink-primary)" }}>{p.name}</span>
                  <span className="mono" style={{ color: "var(--ink-secondary)" }}>{p.requests} ({p.pct}%)</span>
                </div>
                <div style={{ width: "100%", height: "6px", background: "var(--thinking-bg)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: `${p.pct}%`, height: "100%", background: p.color, borderRadius: "3px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="prism-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-primary)" }}>Recent Audit Logs</h4>
            <span style={{ fontSize: "11px", color: "var(--prism-pink)", cursor: "pointer" }}>View all</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {(data?.recentAuditFeed || []).map((log, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", padding: "6px 8px", background: "var(--thinking-bg)", border: "1px solid var(--border-subtle)", borderRadius: "6px" }}>
                <div>
                  <div style={{ color: "var(--ink-primary)", fontWeight: "600" }}>{log.action.replace(/_/g, " ")}</div>
                  <div style={{ color: "var(--ink-tertiary)" }}>{log.actor} • {log.resource}</div>
                </div>
                <div className="mono" style={{ color: "var(--ink-tertiary)" }}>{relativeTime(log.occurred_at)}</div>
              </div>
            ))}
            {!isLoading && (!data?.recentAuditFeed || data.recentAuditFeed.length === 0) && (
              <div style={{ color: "var(--ink-tertiary)", fontSize: "11.5px", textAlign: "center", padding: "12px" }}>No audit events yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
