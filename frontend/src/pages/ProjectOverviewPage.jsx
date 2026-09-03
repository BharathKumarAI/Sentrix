import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Cpu, 
  Wrench, 
  GitFork, 
  BookOpen, 
  FileText, 
  Zap, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ChevronRight,
  Star,
  ExternalLink,
  Settings,
  ShieldAlert,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";

export function ProjectOverviewPage({ activeProject }) {
  const navigate = useNavigate();
  const [isFollowed, setIsFollowed] = useState(true);

  const projectName = activeProject?.name || "Global Billing & Payment Gateway";
  const projectKey = activeProject?.project_key || "BILLING";

  // KPIs matching reference 1D31E017
  const kpis = [
    { label: "Agents", value: "12", sub: "↑ 2 this week", icon: Cpu, color: "var(--prism-magenta)" },
    { label: "Workflows", value: "8", sub: "↑ 1 this week", icon: GitFork, color: "var(--accent-violet)" },
    { label: "Tools", value: "24", sub: "↑ 3 this week", icon: Wrench, color: "var(--accent-amber)" },
    { label: "Knowledge Sources", value: "1,248", sub: "↑ 86 this week", icon: BookOpen, color: "var(--accent-teal)" },
    { label: "Investigations", value: "356", sub: "↑ 18% vs last 7 days", icon: FileText, color: "var(--accent-teal)" },
    { label: "Resolution Rate", value: "89.7%", sub: "↑ 5.4% vs last 7 days", icon: CheckCircle2, color: "var(--prism-pink)" },
  ];

  // Recent Investigations table data
  const recentInvestigations = [
    { id: "INV-237129", title: "Billing failed for BAN: 986069888", service: "Billing", severity: "Critical", time: "2m ago" },
    { id: "INV-237128", title: "Unable to process upgrade request", service: "Orders", severity: "High", time: "15m ago" },
    { id: "INV-237127", title: "DCC not applied on device financing", service: "Billing", severity: "Medium", time: "1h ago" },
    { id: "INV-237126", title: "Service activation delayed", service: "Activation", severity: "Low", time: "3h ago" },
    { id: "INV-237125", title: "Tax calculation mismatch", service: "Billing", severity: "High", time: "5h ago" },
  ];

  // Agent Activity data
  const agentActivity = [
    { name: "Billing Triage Agent", executions: "1,248", successRate: "92.4%", trend: "up" },
    { name: "Discount Analysis Agent", executions: "932", successRate: "90.1%", trend: "up" },
    { name: "Payment Investigation Agent", executions: "821", successRate: "88.7%", trend: "up" },
    { name: "Account Validation Agent", executions: "645", successRate: "93.2%", trend: "up" },
    { name: "Tax Calculation Agent", executions: "512", successRate: "85.3%", trend: "down" },
  ];

  // Knowledge sources
  const knowledgeSources = [
    { name: "Billing Runbooks", type: "SharePoint", status: "Synced", docs: 542 },
    { name: "Policy & Procedures", type: "Confluence", status: "Synced", docs: 321 },
    { name: "Error Code Library", type: "Database", status: "Synced", docs: 198 },
    { name: "Product Catalog", type: "Salesforce", status: "Syncing", docs: 112 },
    { name: "Internal KB Articles", type: "Sentrix KB", status: "Synced", docs: 75 }
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
      {/* Project Hero Header (Matching reference 1D31E017) */}
      <div className="prism-card" style={{
        padding: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{
            width: "54px",
            height: "54px",
            borderRadius: "14px",
            background: "var(--prism-gradient)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "20px",
            fontWeight: "800",
            boxShadow: "0 0 20px var(--prism-glow)"
          }}>
            {projectKey.slice(0, 2)}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: "800", color: "var(--ink-primary)" }}>{projectName}</h1>
              <button
                onClick={() => setIsFollowed(!isFollowed)}
                className="btn-ghost"
                style={{ padding: "4px" }}
              >
                <Star size={18} fill={isFollowed ? "var(--accent-amber)" : "none"} color={isFollowed ? "var(--accent-amber)" : "var(--ink-secondary)"} />
              </button>
            </div>
            
            <div style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "3px" }}>
              AI-powered billing issue triage and investigation platform <span style={{ color: "var(--prism-pink)", cursor: "pointer" }}>• See more</span>
            </div>

            {/* Metadata Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "10px", flexWrap: "wrap" }}>
              <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                Owner: <strong style={{ color: "var(--ink-primary)" }}>Sarah Jones</strong>
              </div>
              <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                Teams: <strong style={{ color: "var(--ink-primary)" }}>Billing, AI Platform</strong>
              </div>
              <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                Environments: <strong className="mono" style={{ color: "var(--accent-teal)" }}>Prod, Staging, Dev</strong>
              </div>
              <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                Created: <strong style={{ color: "var(--ink-secondary)" }}>Mar 15, 2025</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            className="btn-secondary" 
            onClick={() => navigate(`/p/${projectKey}/settings`)}
          >
            <Settings size={14} /> Project Settings
          </button>
          
          <button 
            className="btn-primary" 
            onClick={() => navigate(`/p/${projectKey}/triage`)}
          >
            <Zap size={14} /> Launch Autonomous Triage
          </button>
        </div>
      </div>

      {/* 6 KPI Stat Summary Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "14px"
      }}>
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="prism-card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "var(--thinking-bg)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: k.color
              }}>
                <Icon size={20} />
              </div>

              <div>
                <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: "600" }}>{k.label}</div>
                <div className="mono" style={{ fontSize: "20px", fontWeight: "800", color: "var(--ink-primary)" }}>{k.value}</div>
                <div style={{ fontSize: "10px", color: "var(--accent-teal)", marginTop: "2px" }}>{k.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Chart & Recent Investigations */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        
        {/* Investigations Over Time Chart */}
        <div className="prism-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--ink-primary)" }}>Investigations Over Time</h3>
              <p style={{ fontSize: "11px", color: "var(--ink-secondary)", marginTop: "2px" }}>Incident volume & resolution throughput</p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--prism-pink)" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--prism-pink)" }} /> Created
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--accent-violet)" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-violet)" }} /> Resolved
              </span>
              <span className="mono badge badge-magenta" style={{ fontSize: "10px" }}>Last 7 days</span>
            </div>
          </div>

          {/* SVG Smooth Curves Graphic */}
          <div style={{ height: "200px", width: "100%", position: "relative" }}>
            <svg width="100%" height="100%" viewBox="0 0 700 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b7dff" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#8b7dff" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              <line x1="0" y1="40" x2="700" y2="40" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="700" y2="80" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="700" y2="120" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="0" y1="160" x2="700" y2="160" stroke="var(--border-subtle)" strokeDasharray="3 3" />

              {/* Created Curve */}
              <path d="M 0 140 Q 100 80, 200 110 T 400 80 T 600 90 T 700 70 L 700 200 L 0 200 Z" fill="url(#createdGrad)" />
              <path d="M 0 140 Q 100 80, 200 110 T 400 80 T 600 90 T 700 70" fill="none" stroke="#ec4899" strokeWidth="2.5" />

              {/* Resolved Curve */}
              <path d="M 0 170 Q 100 120, 200 140 T 400 120 T 600 130 T 700 100 L 700 200 L 0 200 Z" fill="url(#resolvedGrad)" />
              <path d="M 0 170 Q 100 120, 200 140 T 400 120 T 600 130 T 700 100" fill="none" stroke="#8b7dff" strokeWidth="2.5" />

              {/* Data points */}
              <circle cx="200" cy="110" r="4" fill="#ec4899" />
              <circle cx="400" cy="80" r="4" fill="#ec4899" />
              <circle cx="600" cy="90" r="4" fill="#ec4899" />
              <circle cx="200" cy="140" r="4" fill="#8b7dff" />
              <circle cx="400" cy="120" r="4" fill="#8b7dff" />
              <circle cx="600" cy="130" r="4" fill="#8b7dff" />
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

        {/* Recent Investigations List */}
        <div className="prism-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--ink-primary)" }}>Recent Investigations</h3>
            <button 
              className="btn-ghost" 
              style={{ fontSize: "11px", color: "var(--prism-pink)" }}
              onClick={() => navigate(`/p/${projectKey}/investigations`)}
            >
              View all
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recentInvestigations.map((inv) => (
              <div 
                key={inv.id}
                onClick={() => navigate(`/p/${projectKey}/triage`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "var(--thinking-bg)",
                  border: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  transition: "background 0.15s ease"
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--ink-primary)" }}>{inv.title}</div>
                  <div className="mono" style={{ fontSize: "10px", color: "var(--ink-tertiary)", marginTop: "2px" }}>
                    #{inv.id} • {inv.service}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className={`badge ${
                    inv.severity === "Critical" ? "badge-rose" :
                    inv.severity === "High" ? "badge-magenta" :
                    inv.severity === "Medium" ? "badge-amber" : "badge-teal"
                  }`}>
                    {inv.severity}
                  </span>
                  <span className="mono" style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>{inv.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Row: Agent Activity, Donut Chart & Knowledge Sources */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
        
        {/* Agent Activity Table */}
        <div className="prism-card" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-primary)" }}>Agent Activity</h4>
            <span style={{ fontSize: "11px", color: "var(--prism-pink)", cursor: "pointer" }}>View all</span>
          </div>

          <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "var(--ink-tertiary)", textAlign: "left", borderBottom: "1px solid var(--border-subtle)" }}>
                <th style={{ padding: "6px" }}>Agent</th>
                <th style={{ padding: "6px" }}>Executions</th>
                <th style={{ padding: "6px" }}>Success</th>
              </tr>
            </thead>
            <tbody>
              {agentActivity.map((a) => (
                <tr key={a.name} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "8px 6px", color: "var(--ink-primary)", fontWeight: "500" }}>{a.name}</td>
                  <td style={{ padding: "8px 6px", color: "var(--ink-primary)" }} className="mono">{a.executions}</td>
                  <td style={{ padding: "8px 6px", color: "var(--accent-teal)", fontWeight: "600" }} className="mono">{a.successRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Workflow Runs Donut */}
        <div className="prism-card" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-primary)" }}>Workflow Runs</h4>
            <span style={{ fontSize: "11px", color: "var(--prism-pink)", cursor: "pointer" }}>View all</span>
          </div>

          {/* Donut Graphic */}
          <div style={{ position: "relative", width: "130px", height: "130px" }}>
            <svg width="130" height="130" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--border-subtle)" strokeWidth="3.8" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="3.8" strokeDasharray="75, 100" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ef4444" strokeWidth="3.8" strokeDasharray="15, 100" strokeDashoffset="-75" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span className="mono" style={{ fontSize: "18px", fontWeight: "800", color: "var(--ink-primary)" }}>1,248</span>
              <span style={{ fontSize: "9px", color: "var(--ink-tertiary)" }}>Total Runs</span>
            </div>
          </div>

          <div style={{ width: "100%", display: "flex", justifyContent: "space-around", fontSize: "11px" }}>
            <span style={{ color: "var(--accent-teal)" }}>• 942 Successful (75%)</span>
            <span style={{ color: "var(--accent-rose)" }}>• 186 Failed (15%)</span>
          </div>
        </div>

        {/* Knowledge Sources Table */}
        <div className="prism-card" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-primary)" }}>Knowledge Sources</h4>
            <span style={{ fontSize: "11px", color: "var(--prism-pink)", cursor: "pointer" }} onClick={() => navigate(`/p/${projectKey}/knowledge`)}>View all</span>
          </div>

          <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "var(--ink-tertiary)", textAlign: "left", borderBottom: "1px solid var(--border-subtle)" }}>
                <th style={{ padding: "6px" }}>Source</th>
                <th style={{ padding: "6px" }}>Type</th>
                <th style={{ padding: "6px" }}>Status</th>
                <th style={{ padding: "6px" }}>Docs</th>
              </tr>
            </thead>
            <tbody>
              {knowledgeSources.map((k) => (
                <tr key={k.name} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "8px 6px", color: "var(--ink-primary)", fontWeight: "500" }}>{k.name}</td>
                  <td style={{ padding: "8px 6px", color: "var(--ink-secondary)" }}>{k.type}</td>
                  <td style={{ padding: "8px 6px" }}>
                    <span className="badge badge-teal" style={{ fontSize: "9px" }}>{k.status}</span>
                  </td>
                  <td style={{ padding: "8px 6px", color: "var(--ink-primary)" }} className="mono">{k.docs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
