import React, { useState } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Columns, 
  Star, 
  CheckCircle2, 
  Sliders, 
  Copy, 
  MoreHorizontal,
  Bookmark
} from "lucide-react";

export function AdminPromptsPage() {
  const [activeTab, setActiveTab] = useState("PROMPTS");
  const [searchQuery, setSearchQuery] = useState("");

  const kpis = [
    { label: "Total Prompts", value: "186", sub: "↑ 9.3% vs last 7 days", icon: FileText, color: "var(--prism-pink)" },
    { label: "Active Prompts", value: "142", sub: "↑ 11.6% vs last 7 days", icon: CheckCircle2, color: "var(--accent-teal)" },
    { label: "Executions (7d)", value: "38.7K", sub: "↑ 18.4% vs last 7 days", icon: Sliders, color: "var(--accent-violet)" },
    { label: "Used in Projects", value: "29", sub: "↑ 7.4% vs last 7 days", icon: Bookmark, color: "var(--accent-blue)" },
    { label: "Favorites", value: "24", sub: "↑ 3.2% vs last 7 days", icon: Star, color: "var(--accent-amber)" },
  ];

  const prompts = [
    {
      name: "Triage Analysis Prompt",
      desc: "Analyze and prioritize incoming issues and stack traces",
      scope: "Platform",
      category: "Triage",
      owner: "Sentrix Platform",
      visibility: "All projects",
      status: "Active",
      usedBy: "22 projects",
      executions: "3.2K",
      updated: "1d ago",
      favorite: true
    },
    {
      name: "Root Cause Analysis",
      desc: "Identify the root cause of an incident from cross-tool evidence",
      scope: "Platform",
      category: "Analysis",
      owner: "Sentrix Platform",
      visibility: "All projects",
      status: "Active",
      usedBy: "18 projects",
      executions: "2.1K",
      updated: "2d ago",
      favorite: false
    },
    {
      name: "Resolution Summary",
      desc: "Generate resolution summary and runbook updates",
      scope: "Platform",
      category: "Summary",
      owner: "Sentrix Platform",
      visibility: "All projects",
      status: "Active",
      usedBy: "19 projects",
      executions: "1.9K",
      updated: "3d ago",
      favorite: true
    },
    {
      name: "Customer Communication",
      desc: "Draft user-facing incident status page updates",
      scope: "Project",
      category: "Communication",
      owner: "Sarah Jones",
      visibility: "Project members",
      status: "Active",
      usedBy: "—",
      executions: "812",
      updated: "1d ago",
      favorite: false
    },
    {
      name: "Change Risk Assessment",
      desc: "Assess risk of a proposed write or deployment mutation",
      scope: "Project",
      category: "Risk",
      owner: "Sarah Jones",
      visibility: "Project members",
      status: "Active",
      usedBy: "—",
      executions: "684",
      updated: "2d ago",
      favorite: false
    },
    {
      name: "Billing Error Explanation",
      desc: "Explain complex gateway timeout error codes in simple terms",
      scope: "Project",
      category: "Explanation",
      owner: "Mike Williams",
      visibility: "Project members",
      status: "Draft",
      usedBy: "—",
      executions: "156",
      updated: "5h ago",
      favorite: false
    }
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
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#fff" }}>Prompts & Skills</h1>
          <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
            Manage reusable agent prompt templates and skill directives across the enterprise.
          </p>
        </div>

        <button className="btn-primary">
          <Plus size={16} /> New Prompt
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="prism-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: k.color
              }}>
                <Icon size={22} />
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: "600" }}>{k.label}</div>
                <div className="mono" style={{ fontSize: "22px", fontWeight: "800", color: "#fff" }}>{k.value}</div>
                <div style={{ fontSize: "10px", color: "var(--accent-teal)", marginTop: "2px" }}>{k.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Container */}
      <div className="prism-card" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            {["Skills", "Prompts", "Models & Configs", "Evaluations"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "12px",
                  fontWeight: activeTab === tab ? "600" : "500",
                  color: activeTab === tab ? "var(--prism-pink)" : "var(--ink-secondary)",
                  background: activeTab === tab ? "rgba(225, 29, 72, 0.12)" : "transparent",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ position: "relative", width: "260px" }}>
            <Search size={14} color="var(--ink-tertiary)" style={{ position: "absolute", left: "10px", top: "10px" }} />
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 30px",
                background: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                color: "#fff",
                fontSize: "12px"
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--ink-tertiary)" }}>
                <th style={{ padding: "10px 12px" }}>Prompt</th>
                <th style={{ padding: "10px 12px" }}>Scope</th>
                <th style={{ padding: "10px 12px" }}>Category</th>
                <th style={{ padding: "10px 12px" }}>Owner</th>
                <th style={{ padding: "10px 12px" }}>Visibility</th>
                <th style={{ padding: "10px 12px" }}>Status</th>
                <th style={{ padding: "10px 12px" }}>Executions (7d)</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prompts.map((p, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Star size={14} fill={p.favorite ? "var(--prism-pink)" : "none"} color={p.favorite ? "var(--prism-pink)" : "var(--ink-tertiary)"} />
                      <div>
                        <div style={{ fontWeight: "600", color: "#fff" }}>{p.name}</div>
                        <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>{p.desc}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span className={`badge ${p.scope === "Platform" ? "badge-magenta" : "badge-blue"}`}>{p.scope}</span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span className="badge badge-violet">{p.category}</span>
                  </td>
                  <td style={{ padding: "12px", color: "var(--ink-secondary)" }}>{p.owner}</td>
                  <td style={{ padding: "12px", color: "var(--ink-secondary)" }}>{p.visibility}</td>
                  <td style={{ padding: "12px" }}>
                    <span className={`badge ${p.status === "Active" ? "badge-teal" : "badge-amber"}`}>{p.status}</span>
                  </td>
                  <td style={{ padding: "12px" }} className="mono">{p.executions}</td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    <button className="btn-ghost" style={{ padding: "4px" }}>
                      <MoreHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
