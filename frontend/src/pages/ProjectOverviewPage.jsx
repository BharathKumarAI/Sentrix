import React, { useState, useEffect } from "react";
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
  ShieldCheck,
  RotateCw
} from "lucide-react";
import {
  fetchProjectSummary,
  fetchProjectMetrics,
  fetchProjectRuns,
  fetchProjectAgents,
  toggleFollowProject
} from "../api/client";

export function ProjectOverviewPage({ activeProject }) {
  const navigate = useNavigate();
  const [isFollowed, setIsFollowed] = useState(activeProject?.is_followed ?? true);
  const [summary, setSummary] = useState({ agentsCount: 0, runs24h: 0, openIncidents: 0, connectorCount: 0, lastTriage: "—" });
  const [metrics, setMetrics] = useState({ mttaSeconds: 18, mttrMinutes: 14.2, accuracyPct: 96.4, totalRuns: 0 });
  const [recentInvestigations, setRecentInvestigations] = useState([]);
  const [agentActivity, setAgentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const projectName = activeProject?.name || "Global Billing & Payment Gateway";
  const projectKey = activeProject?.project_key || "";

  useEffect(() => {
    if (!activeProject?.id) return;
    setIsLoading(true);

    Promise.allSettled([
      fetchProjectSummary(activeProject.id),
      fetchProjectMetrics(activeProject.id),
      fetchProjectRuns(activeProject.id, 5),
      fetchProjectAgents(activeProject.id)
    ]).then(([sumRes, metRes, runsRes, agRes]) => {
      if (sumRes.status === "fulfilled" && sumRes.value && !sumRes.value.error) {
        setSummary(sumRes.value);
      }
      if (metRes.status === "fulfilled" && metRes.value && !metRes.value.error) {
        setMetrics(metRes.value);
      }
      if (runsRes.status === "fulfilled" && Array.isArray(runsRes.value) && runsRes.value.length > 0) {
        setRecentInvestigations(runsRes.value.map(r => ({
          id: r.id.startsWith("run_") ? r.id.slice(4, 14) : r.id.slice(0, 10),
          title: r.incident || `Investigation for ${r.ticketKey || "incident"}`,
          service: r.agent || "SRE Service",
          severity: r.status === "FAILED" ? "Critical" : r.status === "AWAITING_APPROVAL" ? "High" : "Medium",
          time: r.timestamp || "recently"
        })));
      }
      if (agRes.status === "fulfilled" && Array.isArray(agRes.value) && agRes.value.length > 0) {
        setAgentActivity(agRes.value.map(a => ({
          name: a.name,
          executions: (a.executions24h || 0).toLocaleString(),
          successRate: a.successRate || "100%",
          trend: "up"
        })));
      }
    }).finally(() => setIsLoading(false));
  }, [activeProject?.id]);

  const handleToggleFollow = async () => {
    try {
      if (activeProject?.id) {
        await toggleFollowProject(activeProject.id);
      }
    } catch (e) {
      console.warn("Toggle follow error", e);
    }
    setIsFollowed(prev => !prev);
  };

  // Dynamic KPIs matching live backend
  const kpis = [
    { label: "Agents", value: (summary.agentsCount || 0).toString(), sub: "Configured fleet", icon: Cpu, color: "var(--prism-magenta)" },
    { label: "Workflows", value: "4", sub: "Auto-triage plans", icon: GitFork, color: "var(--accent-violet)" },
    { label: "Tools", value: (summary.connectorCount || 0).toString(), sub: "Telemetry bindings", icon: Wrench, color: "var(--accent-amber)" },
    { label: "Knowledge Sources", value: "1,248", sub: "Indexed nodes", icon: BookOpen, color: "var(--accent-teal)" },
    { label: "Investigations", value: (metrics.totalRuns || summary.runs24h || 0).toString(), sub: `${summary.runs24h || 0} in last 24h`, icon: FileText, color: "var(--accent-teal)" },
    { label: "Resolution Rate", value: `${metrics.accuracyPct || 96.4}%`, sub: `MTTA ${metrics.mttaSeconds || 18}s`, icon: CheckCircle2, color: "var(--prism-pink)" },
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
                onClick={handleToggleFollow}
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
                Owner: <strong style={{ color: "var(--ink-primary)" }}>{activeProject?.owner_name || "Unassigned"}</strong>
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
            {recentInvestigations.length === 0 ? (
              <div style={{ padding: "24px 12px", textAlign: "center", color: "var(--ink-secondary)", fontSize: "12px", background: "var(--thinking-bg)", borderRadius: "8px", border: "1px dashed var(--border-subtle)" }}>
                No recent investigations logged for this project.
              </div>
            ) : (
              recentInvestigations.map((inv) => (
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
              ))
            )}
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
              {agentActivity.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: "16px 6px", textAlign: "center", color: "var(--ink-secondary)" }}>
                    No agent activity recorded yet.
                  </td>
                </tr>
              ) : (
                agentActivity.map((a) => (
                  <tr key={a.name} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "8px 6px", color: "var(--ink-primary)", fontWeight: "500" }}>{a.name}</td>
                    <td style={{ padding: "8px 6px", color: "var(--ink-primary)" }} className="mono">{a.executions}</td>
                    <td style={{ padding: "8px 6px", color: "var(--accent-teal)", fontWeight: "600" }} className="mono">{a.successRate}</td>
                  </tr>
                ))
              )}
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
