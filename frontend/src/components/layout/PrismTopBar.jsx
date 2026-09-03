import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Search, 
  Bell, 
  HelpCircle, 
  Settings, 
  ChevronDown, 
  Layers, 
  ShieldCheck,
  Star,
  Plus,
  Sun,
  Moon,
  Sparkles,
  Compass,
  PanelLeftOpen,
  PanelLeftClose
} from "lucide-react";

export function PrismTopBar({
  projects,
  activeProject,
  onSelectProject,
  activeEnvironment,
  onSelectEnvironment,
  onOpenNewProjectModal,
  theme,
  onToggleTheme,
  sidebarCollapsed,
  onToggleSidebar
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showEnvDropdown, setShowEnvDropdown] = useState(false);

  const isAdmin = location.pathname.startsWith("/admin");
  const pathParts = location.pathname.split("/").filter(Boolean);
  const currentPage = pathParts[2] || "overview";

  return (
    <header style={{
      height: "64px",
      background: "var(--bg-sidebar)",
      borderBottom: "1px solid var(--border-subtle)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      zIndex: 30
    }}>
      {/* Left: Sidebar Toggle + Project & Environment Switchers */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Modern Sidebar Expander Button */}
        <button
          onClick={onToggleSidebar}
          className="btn-ghost"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "9px",
            background: sidebarCollapsed ? "rgba(236, 72, 153, 0.12)" : "rgba(255, 255, 255, 0.04)",
            border: sidebarCollapsed ? "1px solid var(--prism-pink)" : "1px solid var(--border-subtle)",
            color: sidebarCollapsed ? "var(--prism-pink)" : "var(--ink-secondary)",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: sidebarCollapsed ? "0 0 12px rgba(236, 72, 153, 0.3)" : "none",
            flexShrink: 0
          }}
          title={sidebarCollapsed ? "Expand Sidebar (⌘B)" : "Collapse Sidebar (⌘B)"}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
        
        {/* Admin Mode Header */}
        {isAdmin && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink-primary)", margin: 0 }}>
              Admin Dashboard
            </h2>
            <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)" }}>
              Overview of your Sentrix platform
            </span>
          </div>
        )}

        {/* Project Mode: Clean Project Switcher + Environment Switcher (Matches Reference 1D31E017) */}
        {!isAdmin && activeProject && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            
            {/* Project Switcher Pill */}
            <div style={{ position: "relative" }}>
              <div
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                className="prism-card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 12px",
                  cursor: "pointer",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)"
                }}
              >
                <div style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "5px",
                  background: "var(--prism-gradient)",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {activeProject.project_key?.slice(0, 2) || "BI"}
                </div>
                <span style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--ink-primary)" }}>
                  {activeProject.name}
                </span>
                <ChevronDown size={14} color="var(--ink-secondary)" />
              </div>

              {/* Project Dropdown */}
              {showProjectDropdown && (
                <div className="prism-card" style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  width: "280px",
                  padding: "6px",
                  zIndex: 100,
                  background: "var(--bg-card)",
                  boxShadow: "0 14px 32px rgba(0,0,0,0.5)"
                }}>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--ink-tertiary)", padding: "6px 8px", textTransform: "uppercase" }}>
                    Switch Project
                  </div>
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectProject(p);
                        setShowProjectDropdown(false);
                        navigate(`/p/${p.project_key}/${currentPage}`);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        background: activeProject.id === p.id ? "rgba(225, 29, 72, 0.15)" : "transparent"
                      }}
                    >
                      <div style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--ink-primary)" }}>
                        {p.name}
                      </div>
                      <span className="mono badge badge-magenta" style={{ fontSize: "9.5px" }}>
                        {p.project_key}
                      </span>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid var(--border-subtle)", margin: "4px 0" }} />
                  <div
                    onClick={() => {
                      setShowProjectDropdown(false);
                      onOpenNewProjectModal();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      color: "var(--accent-teal)",
                      fontWeight: "600"
                    }}
                  >
                    <Plus size={14} /> Add Project
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Middle: Global Search (Command Palette) */}
      <div style={{ position: "relative", width: "360px" }}>
        <Search size={14} color="var(--ink-tertiary)" style={{ position: "absolute", left: "12px", top: "10px" }} />
        <input
          type="text"
          placeholder={isAdmin ? "Search users, projects, agents..." : "Search tickets, agents, workflows... (⌘K)"}
          style={{
            width: "100%",
            padding: "8px 40px 8px 34px",
            background: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-pill)",
            color: "var(--ink-primary)",
            fontSize: "12px"
          }}
        />
        <div style={{
          position: "absolute",
          right: "10px",
          top: "8px",
          fontSize: "10px",
          color: "var(--ink-tertiary)",
          background: "var(--thinking-bg)",
          border: "1px solid var(--border-subtle)",
          padding: "2px 6px",
          borderRadius: "4px"
        }}>
          ⌘K
        </div>
      </div>

      {/* Right: Actions & User Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {/* Admin Quick Add Project Button */}
        {isAdmin && (
          <button
            onClick={onOpenNewProjectModal}
            className="btn-primary"
            style={{ padding: "6px 12px", fontSize: "12px", gap: "6px" }}
            title="Register New Enterprise Project"
          >
            <Plus size={14} /> New Project
          </button>
        )}

        {/* Global Theme Switcher (Light / Dark) */}
        <button
          className="btn-ghost"
          onClick={onToggleTheme}
          style={{ padding: "8px" }}
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? (
            <Moon size={18} color="var(--accent-violet)" />
          ) : (
            <Sun size={18} color="var(--accent-amber)" />
          )}
        </button>

        {/* Notification Bell */}
        <div style={{ position: "relative", cursor: "pointer" }}>
          <button className="btn-ghost" style={{ padding: "8px" }}>
            <Bell size={17} color="var(--ink-secondary)" />
          </button>
          <div style={{
            position: "absolute",
            top: "2px",
            right: "2px",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: "var(--prism-magenta)",
            color: "#fff",
            fontSize: "9px",
            fontWeight: "800",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            12
          </div>
        </div>

        {/* Help icon */}
        <button className="btn-ghost" style={{ padding: "8px" }} title="Help & Documentation">
          <HelpCircle size={17} color="var(--ink-secondary)" />
        </button>

        {/* Settings icon */}
        <button className="btn-ghost" style={{ padding: "8px" }} title="Platform Settings">
          <Settings size={17} color="var(--ink-secondary)" />
        </button>

        {/* User Pill Avatar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "4px 10px 4px 4px",
          borderRadius: "var(--radius-pill)",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          cursor: "pointer"
        }}>
          <div style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "var(--prism-gradient)",
            color: "#fff",
            fontSize: "11px",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {isAdmin ? "SA" : "SJ"}
          </div>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--ink-primary)" }}>
            {isAdmin ? "Admin" : "Sarah Jones"}
          </span>
        </div>
      </div>
    </header>
  );
}
