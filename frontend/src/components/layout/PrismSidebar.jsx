import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  Layers, 
  Zap, 
  MessageSquare, 
  Cpu, 
  Wrench, 
  GitFork, 
  BookOpen, 
  Ticket, 
  PlayCircle, 
  ShieldCheck, 
  Network, 
  Sliders, 
  Settings, 
  Server, 
  Activity, 
  FileText, 
  Key, 
  Users, 
  ShieldAlert, 
  Database, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ArrowRightLeft,
  Search,
  CheckCircle2,
  Kanban,
  BarChart3,
  ThumbsUp,
  Plus,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { BrandLogo } from "../BrandLogo";

export function PrismSidebar({
  activeProject,
  projects,
  onSelectProject,
  collapsed: controlledCollapsed,
  onToggleCollapse: controlledToggleCollapse
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [localCollapsed, setLocalCollapsed] = useState(false);

  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : localCollapsed;
  const toggleCollapse = controlledToggleCollapse || (() => setLocalCollapsed(!localCollapsed));

  const isAdmin = location.pathname.startsWith("/admin");
  const projectKey = activeProject?.project_key || "BILLING";

  // Project mode nav groups — Live Triage Board pushed to the very top with live pulsing animation
  const projectNav = [
    {
      group: "TRIAGE & MISSION CONTROL",
      items: [
        { 
          label: "Live Triage Board", 
          path: `/p/${projectKey}/board`, 
          icon: Kanban, 
          badge: "LIVE SRE", 
          badgeColor: "badge-teal",
          isLiveGlow: true 
        },
        { label: "Overview", path: `/p/${projectKey}/overview`, icon: Home },
        { label: "Auto-Triage Hub", path: `/p/${projectKey}/triage`, icon: Zap, badge: "ADK 2.8" },
        { label: "Investigation Stream", path: `/p/${projectKey}/investigations`, icon: MessageSquare },
      ]
    },
    {
      group: "BUILD",
      items: [
        { label: "Agents", path: `/p/${projectKey}/agents`, icon: Cpu },
        { label: "Tools & Connectors", path: `/p/${projectKey}/tools`, icon: Wrench },
        { label: "Workflows", path: `/p/${projectKey}/workflows`, icon: GitFork },
        { label: "Knowledge", path: `/p/${projectKey}/knowledge`, icon: BookOpen },
      ]
    },
    {
      group: "OPERATIONS",
      items: [
        { label: "Tickets & Incidents", path: `/p/${projectKey}/tickets`, icon: Ticket },
        { label: "Runs & Timeline", path: `/p/${projectKey}/runs`, icon: PlayCircle },
        { label: "Action Proposals", path: `/p/${projectKey}/actions`, icon: ShieldCheck, badge: "Write Lock", badgeColor: "badge-magenta" },
      ]
    },
    {
      group: "INSIGHTS & GOVERNANCE",
      items: [
        { label: "Metrics & Analytics", path: `/p/${projectKey}/metrics`, icon: BarChart3 },
        { label: "Reports & Digests", path: `/p/${projectKey}/reports`, icon: FileText, badge: "Cadence", badgeColor: "badge-teal" },
        { label: "SRE Feedback Loop", path: `/p/${projectKey}/feedback`, icon: ThumbsUp },
      ]
    },
    {
      group: "PROJECT",
      items: [
        { label: "Setup & Studio", path: `/p/${projectKey}/setup`, icon: Wrench, badge: "Config", badgeColor: "badge-magenta" },
        { label: "Environments Matrix", path: `/p/${projectKey}/environments`, icon: Network },
        { label: "Parameter Studio", path: `/p/${projectKey}/parameters`, icon: Sliders },
        { label: "Settings & Instructions", path: `/p/${projectKey}/settings`, icon: Settings },
      ]
    }
  ];

  // Admin mode nav groups
  const adminNav = [
    {
      group: "OVERVIEW",
      items: [
        { label: "Overview", path: "/admin/overview", icon: Home },
        { label: "Dashboard", path: "/admin/dashboard", icon: Activity },
      ]
    },
    {
      group: "PLATFORM",
      items: [
        { label: "Projects Fleet", path: "/admin/projects", icon: Layers, badge: "Fleet", badgeColor: "badge-teal" },
        { label: "Add Project", path: "/admin/projects?create=true", icon: Plus, badge: "New", badgeColor: "badge-magenta" },
        { label: "Skills", path: "/admin/skills", icon: Cpu },
        { label: "Prompts", path: "/admin/prompts", icon: FileText },
        { label: "Connectors Catalog", path: "/admin/connectors", icon: Server },
        { label: "Environments", path: "/admin/environments", icon: Network },
        { label: "Model Providers", path: "/admin/models", icon: Database },
        { label: "API Keys", path: "/admin/keys", icon: Key },
      ]
    },
    {
      group: "OBSERVABILITY",
      items: [
        { label: "System Health", path: "/admin/health", icon: CheckCircle2 },
        { label: "Audit Logs", path: "/admin/audit", icon: ShieldCheck },
        { label: "Usage & Billing", path: "/admin/billing", icon: Sliders },
        { label: "Reports & Digests", path: "/admin/reports", icon: FileText },
      ]
    },
    {
      group: "USER MANAGEMENT",
      items: [
        { label: "Users & Access", path: "/admin/users", icon: Users },
        { label: "Security & Policy", path: "/admin/security", icon: ShieldAlert },
      ]
    }
  ];

  const currentNav = isAdmin ? adminNav : projectNav;

  return (
    <aside 
      onClick={() => {
        if (collapsed) toggleCollapse();
      }}
      title={collapsed ? "Click anywhere to expand sidebar (⌘B)" : undefined}
      style={{
        width: collapsed ? "70px" : "240px",
        minWidth: collapsed ? "70px" : "240px",
        height: "100vh",
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 40,
        userSelect: "none",
        cursor: collapsed ? "pointer" : "default",
        position: "relative"
      }}>
      {/* Modern Floating Edge Expander Tab (Visibly prominent on right border when collapsed) */}
      {collapsed && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapse();
          }}
          className="modern-sidebar-floating-tab"
          style={{
            position: "absolute",
            right: "-14px",
            top: "76px",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "var(--prism-gradient)",
            border: "2px solid var(--bg-sidebar)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 0 16px rgba(236, 72, 153, 0.6), 0 4px 12px rgba(0, 0, 0, 0.5)",
            zIndex: 60,
            transition: "transform 0.15s ease"
          }}
          title="Expand Sidebar (⌘B)"
        >
          <ChevronRight size={15} strokeWidth={2.5} />
          <span className="radar-ping-dot" style={{ position: "absolute", top: "-2px", right: "-2px", width: "7px", height: "7px" }} />
        </button>
      )}
      {/* Top Brand Area */}
      <div>
        <div 
          onClick={() => navigate("/")}
          style={{
            height: "64px",
            padding: collapsed ? "0 16px" : "0 18px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            borderBottom: "1px solid var(--border-subtle)",
            cursor: "pointer"
          }}
          title="Return to Sentrix Platform Landing Page"
        >
          <BrandLogo 
            size={32} 
            showText={!collapsed} 
            isAdmin={isAdmin}
            subtitle={isAdmin ? "Admin Console" : "Autonomous SRE"}
          />
        </div>

        {/* View Switcher Pill */}
        {!collapsed && (
          <div style={{ padding: "12px 14px 4px 14px" }}>
            <button
              onClick={() => navigate(isAdmin ? `/p/${projectKey}/overview` : "/admin/overview")}
              className="btn-secondary"
              style={{
                width: "100%",
                padding: "6px 10px",
                fontSize: "11px",
                justifyContent: "space-between",
                background: isAdmin ? "rgba(225, 29, 72, 0.08)" : "rgba(255, 255, 255, 0.03)",
                borderColor: isAdmin ? "rgba(225, 29, 72, 0.3)" : "var(--border-subtle)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <ArrowRightLeft size={13} color={isAdmin ? "var(--prism-pink)" : "var(--accent-teal)"} />
                <span style={{ color: isAdmin ? "var(--prism-pink)" : "#fff", fontWeight: "600" }}>
                  {isAdmin ? "Switch to Project" : "Switch to Admin"}
                </span>
              </div>
              <span className="mono" style={{ fontSize: "9px", color: "var(--ink-tertiary)" }}>
                {isAdmin ? projectKey : "SYSTEM"}
              </span>
            </button>
          </div>
        )}

        {/* Navigation Sections */}
        <div style={{
          padding: "10px 10px 20px 10px",
          overflowY: "auto",
          maxHeight: "calc(100vh - 190px)"
        }}>
          {currentNav.map((sec) => (
            <div key={sec.group} style={{ marginBottom: "16px" }}>
              {!collapsed && (
                <div style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  color: "var(--ink-tertiary)",
                  letterSpacing: "0.06em",
                  padding: "6px 10px",
                  textTransform: "uppercase"
                }}>
                  {sec.group}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      className={item.isLiveGlow && !isActive ? "live-triage-nav-tab" : ""}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: collapsed ? "8px 0" : "8px 12px",
                        justifyContent: collapsed ? "center" : "flex-start",
                        borderRadius: "var(--radius-sm)",
                        textDecoration: "none",
                        fontSize: "12.5px",
                        fontWeight: isActive ? "700" : item.isLiveGlow ? "700" : "500",
                        color: isActive ? "#ffffff" : item.isLiveGlow ? "var(--accent-teal)" : "var(--ink-secondary)",
                        background: isActive ? "var(--prism-gradient)" : "transparent",
                        boxShadow: isActive ? "0 4px 14px -2px var(--prism-glow)" : "none",
                        transition: "all 0.15s ease",
                        marginBottom: item.isLiveGlow ? "4px" : "0px"
                      }}
                    >
                      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <Icon size={16} color={isActive ? "#ffffff" : item.isLiveGlow ? "var(--accent-teal)" : "currentColor"} />
                        {item.isLiveGlow && !isActive && (
                          <span
                            className="radar-ping-dot"
                            style={{
                              position: "absolute",
                              top: "-3px",
                              right: "-3px"
                            }}
                          />
                        )}
                      </div>
                      {!collapsed && (
                        <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: item.isLiveGlow ? 700 : undefined }}>
                          {item.label}
                        </span>
                      )}
                      {!collapsed && item.badge && !isActive && (
                        <span className={`badge ${item.badgeColor || "badge-magenta"}`} style={{ fontSize: "9px", padding: "2px 6px", display: "flex", alignItems: "center", gap: "4px" }}>
                          {item.isLiveGlow && <span className="radar-ping-dot" style={{ width: "5px", height: "5px" }} />}
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modern Sidebar Footer with Polished Collapse/Expand Dock */}
      <div style={{
        padding: collapsed ? "12px 10px" : "12px 14px",
        borderTop: "1px solid var(--border-subtle)",
        background: "rgba(5, 8, 22, 0.5)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        gap: "8px"
      }}>
        {!collapsed ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden", minWidth: 0 }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--prism-gradient)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "700",
                flexShrink: 0,
                boxShadow: "0 0 10px var(--prism-glow)"
              }}>
                {isAdmin ? "SA" : "SJ"}
              </div>
              <div style={{ overflow: "hidden", minWidth: 0 }}>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--ink-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {isAdmin ? "Super Administrator" : "Sarah Jones"}
                </div>
                <div className="mono" style={{ fontSize: "10px", color: "var(--ink-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {isAdmin ? "admin@sentrix.io" : "kbk@company.com"}
                </div>
              </div>
            </div>

            <button
              className="btn-ghost"
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 9px",
                borderRadius: "7px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid var(--border-subtle)",
                color: "var(--ink-secondary)",
                fontSize: "11px",
                fontWeight: "600",
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.15s ease"
              }}
              title="Collapse sidebar (⌘B)"
            >
              <PanelLeftClose size={14} />
              <span>Collapse</span>
            </button>
          </>
        ) : (
          <button
            className="btn-ghost"
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse();
            }}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(236, 72, 153, 0.12)",
              border: "1.5px solid rgba(236, 72, 153, 0.5)",
              color: "var(--prism-pink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 0 14px rgba(236, 72, 153, 0.35)",
              transition: "all 0.15s ease"
            }}
            title="Expand sidebar (Click or press ⌘B)"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}
      </div>
    </aside>
  );
}
