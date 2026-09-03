import React from "react";
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
  Sparkles
} from "lucide-react";

export function AdminDashboardPage() {
  const stats = [
    { label: "Total Users", value: "1,248", change: "↑ 12.5% vs last 7 days", icon: Users, color: "var(--prism-pink)" },
    { label: "Active Projects", value: "56", change: "↑ 8.3% vs last 7 days", icon: Layers, color: "var(--accent-teal)" },
    { label: "Active Agents", value: "128", change: "↑ 16.7% vs last 7 days", icon: Cpu, color: "var(--accent-violet)" },
    { label: "Total Executions", value: "24.5K", change: "↑ 18.9% vs last 7 days", icon: PlayCircle, color: "var(--accent-amber)" },
    { label: "System Uptime", value: "99.98%", change: "↑ 0.02% vs last 7 days", icon: ShieldCheck, color: "var(--accent-teal)" },
  ];

  const healthServices = [
    { name: "API Gateway", status: "Operational", color: "var(--accent-teal)" },
    { name: "PostgreSQL Database", status: "Operational", color: "var(--accent-teal)" },
    { name: "Redis Cache", status: "Operational", color: "var(--accent-teal)" },
    { name: "Object Storage (S3)", status: "Operational", color: "var(--accent-teal)" },
    { name: "Vector Database (Pinecone)", status: "Operational", color: "var(--accent-teal)" },
    { name: "Message Queue (Kafka)", status: "Operational", color: "var(--accent-teal)" },
    { name: "Notification Service", status: "Operational", color: "var(--accent-teal)" }
  ];

  const systemAlerts = [
    { title: "High error rate in AI Service", location: "AI Service • us-east-1", time: "2m ago", severity: "Critical" },
    { title: "Database replication lag", location: "Primary • us-east-1", time: "15m ago", severity: "High" },
    { title: "Rate limit nearing on Provider", location: "Model Provider • us-east-1", time: "1h ago", severity: "Medium" },
    { title: "Upcoming maintenance window", location: "May 20, 02:00 - 04:00 UTC", time: "2h ago", severity: "Info" },
  ];

  const providers = [
    { name: "OpenAI (GPT-4o)", requests: "12.4K", pct: 42, color: "var(--prism-magenta)" },
    { name: "Google (Gemini 2.5 Pro)", requests: "6.7K", pct: 23, color: "var(--accent-violet)" },
    { name: "Anthropic (Claude 3.5)", requests: "4.6K", pct: 16, color: "var(--accent-teal)" },
    { name: "Azure OpenAI", requests: "3.2K", pct: 11, color: "var(--accent-amber)" },
    { name: "Local LLM / vLLM", requests: "1.6K", pct: 6, color: "var(--ink-secondary)" },
  ];

  return (
    <div style={{
      padding: "24px 32px",
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      overflowY: "auto",
      height: "calc(100vh - 64px)"
    }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: "800", color: "var(--ink-primary)" }}>Admin Dashboard</h1>
        <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
          Platform-wide operational telemetry, fleet status, and resource consumption.
        </p>
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

          {/* SVG Smooth Curves Graphic */}
          <div style={{ height: "180px", width: "100%", position: "relative" }}>
            <svg width="100%" height="100%" viewBox="0 0 600 180" preserveAspectRatio="none">
              <defs>
                <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="35" x2="600" y2="35" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="0" y1="70" x2="600" y2="70" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="0" y1="105" x2="600" y2="105" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="0" y1="140" x2="600" y2="140" stroke="var(--border-subtle)" strokeDasharray="3 3" />

              <path d="M 0 130 Q 100 60, 200 90 T 350 40 T 450 70 T 600 45 L 600 180 L 0 180 Z" fill="url(#usageGrad)" />
              <path d="M 0 130 Q 100 60, 200 90 T 350 40 T 450 70 T 600 45" fill="none" stroke="#ec4899" strokeWidth="2.5" />

              <circle cx="200" cy="90" r="4" fill="#ec4899" />
              <circle cx="350" cy="40" r="4" fill="#ec4899" />
              <circle cx="450" cy="70" r="4" fill="#ec4899" />
            </svg>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "var(--ink-tertiary)", borderTop: "1px solid var(--border-subtle)", paddingTop: "8px" }}>
            <span>May 12</span>
            <span>May 13</span>
            <span>May 14</span>
            <span>May 15</span>
            <span>May 16</span>
            <span>May 17</span>
            <span>May 18</span>
          </div>
        </div>

        {/* Platform Health List */}
        <div className="prism-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--ink-primary)" }}>Platform Health</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {healthServices.map((svc) => (
              <div key={svc.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11.5px" }}>
                <span style={{ color: "var(--ink-primary)" }}>{svc.name}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--accent-teal)", fontWeight: "600" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-teal)" }} />
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
              <span className="mono" style={{ fontSize: "18px", fontWeight: "800", color: "var(--ink-primary)" }}>56</span>
              <span style={{ fontSize: "9px", color: "var(--ink-tertiary)" }}>Total Projects</span>
            </div>
          </div>

          <div style={{ width: "100%", display: "flex", justifyContent: "space-around", fontSize: "11px" }}>
            <span style={{ color: "var(--accent-teal)" }}>• Active 28 (50%)</span>
            <span style={{ color: "var(--accent-violet)" }}>• In Dev 14 (25%)</span>
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
            {[
              { action: "User role updated", user: "Sarah.Jones@company.com", time: "2m ago", role: "Admin" },
              { action: "New project created", user: "Billing Intelligence", time: "10m ago", role: "System" },
              { action: "Model provider added", user: "Anthropic Claude 3.5", time: "30m ago", role: "Admin" },
              { action: "API key rotated", user: "OpenAI Provider Key", time: "1h ago", role: "System" },
            ].map((log, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", padding: "6px 8px", background: "var(--thinking-bg)", border: "1px solid var(--border-subtle)", borderRadius: "6px" }}>
                <div>
                  <div style={{ color: "var(--ink-primary)", fontWeight: "600" }}>{log.action}</div>
                  <div style={{ color: "var(--ink-tertiary)" }}>{log.user}</div>
                </div>
                <div className="mono" style={{ color: "var(--ink-tertiary)" }}>{log.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
