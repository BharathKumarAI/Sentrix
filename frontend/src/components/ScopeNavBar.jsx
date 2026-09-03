import React, { useState } from "react";
import { 
  Layers, 
  ChevronDown, 
  ShieldCheck, 
  Star, 
  Activity, 
  Zap, 
  FileCode2, 
  BookOpen, 
  Sliders, 
  Network, 
  Server, 
  MessageSquare,
  Plus
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";

export function ScopeNavBar({
  projects,
  activeProject,
  onSelectProject,
  activeEnvironment,
  onSelectEnvironment,
  activeProfile,
  onSelectProfile,
  delegatedIdentity,
  onToggleFollow,
  activeTab,
  onSelectTab,
  pendingActionCount = 0,
  onOpenNewProjectModal
}) {
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showEnvDropdown, setShowEnvDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const profiles = [
    { id: "deep_triage", label: "Deep Investigation (ADK Multi-Step)" },
    { id: "fast_triage", label: "Fast Triage (Log & Metric Focus)" },
    { id: "admin_view", label: "Admin & Governance View" },
  ];

  return (
    <header className="glass-panel" style={{
      position: "sticky",
      top: "12px",
      zIndex: 50,
      margin: "12px 20px 0 20px",
      padding: "10px 20px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      borderRadius: "var(--radius-lg)"
    }}>
      {/* Top Scope Row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        
        {/* Brand & Project Scope */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Sentrix Brand Emblem */}
          <div style={{ cursor: "pointer" }} onClick={() => onSelectTab("triage")}>
            <BrandLogo size={34} subtitle="AI Investigation & Resolution" />
          </div>

          {/* Project Switcher Glass Pill */}
          <div style={{ position: "relative" }}>
            <div 
              className="glass-card" 
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                cursor: "pointer",
                borderRadius: "var(--radius-pill)",
                border: "1px solid rgba(139, 125, 255, 0.35)",
              }}
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            >
              <Layers size={15} color="var(--accent-violet)" />
              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink-primary)" }}>
                {activeProject ? activeProject.name : "Select Project"}
              </span>
              <span className="mono" style={{ fontSize: "11px", color: "var(--accent-violet)", background: "rgba(139, 125, 255, 0.15)", padding: "2px 6px", borderRadius: "4px" }}>
                {activeProject?.project_key}
              </span>
              <ChevronDown size={14} color="var(--ink-secondary)" />
            </div>

            {/* Dropdown Menu */}
            {showProjectDropdown && (
              <div className="glass-panel" style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                width: "280px",
                padding: "8px",
                zIndex: 100,
                boxShadow: "0 18px 40px rgba(0,0,0,0.8)"
              }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", padding: "6px 10px", textTransform: "uppercase" }}>
                  Active Projects
                </div>
                {projects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p);
                      setShowProjectDropdown(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      background: activeProject?.id === p.id ? "var(--bg-surface-hover)" : "transparent",
                      transition: "background 0.15s ease"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#fff" }}>{p.name}</div>
                      <div className="mono" style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>{p.project_key} · {p.default_environment}</div>
                    </div>
                    {p.is_followed && <Star size={13} fill="var(--accent-amber)" color="var(--accent-amber)" />}
                  </div>
                ))}
                <div style={{ borderTop: "1px solid var(--border-glass)", margin: "6px 0" }} />
                <div
                  onClick={() => {
                    setShowProjectDropdown(false);
                    onOpenNewProjectModal();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    color: "var(--accent-teal)",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}
                >
                  <Plus size={14} /> Add New Project (Dynamic Envs)
                </div>
              </div>
            )}
          </div>

          {/* Follow Star Button */}
          {activeProject && (
            <button
              className="btn-ghost"
              onClick={() => onToggleFollow(activeProject.id)}
              title={activeProject.is_followed ? "Following Project" : "Follow Project"}
              style={{ padding: "6px" }}
            >
              <Star 
                size={16} 
                fill={activeProject.is_followed ? "var(--accent-amber)" : "none"} 
                color={activeProject.is_followed ? "var(--accent-amber)" : "var(--ink-secondary)"} 
              />
            </button>
          )}

          {/* Dynamic Environment Switcher Pill */}
          <div style={{ position: "relative" }}>
            <div
              className="glass-card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                cursor: "pointer",
                borderRadius: "var(--radius-pill)",
                border: "1px solid rgba(78, 230, 199, 0.35)",
                background: "rgba(78, 230, 199, 0.08)"
              }}
              onClick={() => setShowEnvDropdown(!showEnvDropdown)}
            >
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--accent-teal)", boxShadow: "0 0 8px var(--accent-teal)" }} />
              <span className="mono" style={{ fontSize: "12px", fontWeight: "600", color: "var(--accent-teal)" }}>
                env: {activeEnvironment}
              </span>
              <ChevronDown size={12} color="var(--accent-teal)" />
            </div>

            {showEnvDropdown && (
              <div className="glass-panel" style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                width: "180px",
                padding: "6px",
                zIndex: 100,
                boxShadow: "0 18px 40px rgba(0,0,0,0.8)"
              }}>
                <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--ink-tertiary)", padding: "4px 8px", textTransform: "uppercase" }}>
                  Project Environments
                </div>
                {(activeProject?.environments || ["dev", "staging", "prod"]).map((env) => (
                  <div
                    key={env}
                    onClick={() => {
                      onSelectEnvironment(env);
                      setShowEnvDropdown(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "500",
                      background: activeEnvironment === env ? "rgba(78, 230, 199, 0.15)" : "transparent",
                      color: activeEnvironment === env ? "var(--accent-teal)" : "var(--ink-primary)"
                    }}
                  >
                    <span className="mono">{env}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Profile & Delegated Identity Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          
          {/* Active Profile Pill */}
          <div style={{ position: "relative" }}>
            <div
              className="glass-card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                cursor: "pointer",
                borderRadius: "var(--radius-pill)",
              }}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <Activity size={13} color="var(--accent-violet)" />
              <span style={{ fontSize: "12px", color: "var(--ink-secondary)" }}>
                Profile: <strong style={{ color: "#fff" }}>{profiles.find(p => p.id === activeProfile)?.label.split(" ")[0]}</strong>
              </span>
              <ChevronDown size={12} color="var(--ink-secondary)" />
            </div>

            {showProfileDropdown && (
              <div className="glass-panel" style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: "240px",
                padding: "6px",
                zIndex: 100,
              }}>
                {profiles.map((pr) => (
                  <div
                    key={pr.id}
                    onClick={() => {
                      onSelectProfile(pr.id);
                      setShowProfileDropdown(false);
                    }}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      background: activeProfile === pr.id ? "var(--bg-surface-hover)" : "transparent",
                      color: activeProfile === pr.id ? "var(--accent-violet)" : "var(--ink-primary)"
                    }}
                  >
                    {pr.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delegated Identity Indicator */}
          <div className="glass-card" style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 12px",
            borderRadius: "var(--radius-pill)",
            border: "1px solid rgba(255, 255, 255, 0.12)"
          }}>
            <ShieldCheck size={14} color="var(--accent-teal)" />
            <div style={{ fontSize: "11px" }}>
              <span style={{ color: "var(--ink-tertiary)" }}>Delegated: </span>
              <span className="mono" style={{ color: "var(--ink-primary)", fontWeight: "600" }}>{delegatedIdentity}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        overflowX: "auto",
        borderTop: "1px solid var(--border-glass)",
        paddingTop: "8px"
      }}>
        {[
          { id: "triage", label: "Auto-Triage Hub", icon: Zap },
          { id: "chat", label: "Investigation Stream", icon: MessageSquare },
          { 
            id: "actions", 
            label: "Action Proposals", 
            icon: ShieldCheck, 
            badge: pendingActionCount > 0 ? pendingActionCount : null,
            badgeType: "badge-rose" 
          },
          { id: "evidence", label: "Evidence & Citations", icon: FileCode2 },
          { id: "okf", label: "OKF v2.0 Knowledge", icon: BookOpen },
          { id: "connectors", label: "Admin & Connectors", icon: Server },
          { id: "matrix", label: "Environment Matrix", icon: Network },
          { id: "parameters", label: "Parameter Studio", icon: Sliders },
          { id: "settings", label: "Project Instructions", icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "6px 14px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: isActive ? "rgba(139, 125, 255, 0.16)" : "transparent",
                color: isActive ? "#ffffff" : "var(--ink-secondary)",
                fontSize: "12px",
                fontWeight: isActive ? "600" : "500",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                borderBottom: isActive ? "2px solid var(--accent-violet)" : "2px solid transparent"
              }}
            >
              <Icon size={14} color={isActive ? "var(--accent-violet)" : "var(--ink-tertiary)"} />
              {tab.label}
              {tab.badge && (
                <span className={`badge ${tab.badgeType}`} style={{ padding: "0 6px", fontSize: "9px" }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
