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
  Kanban
} from "lucide-react";
import { BrandLogo } from "../BrandLogo";

export function PrismSidebar({ activeProject, projects, onSelectProject }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = location.pathname.startsWith("/admin");
  const projectKey = activeProject?.project_key || "BILLING";

  // Project mode nav groups — original icons restored
  const projectNav = [
    {
      group: "MAIN",
      items: [
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
        { label: "Live Triage Board", path: `/p/${projectKey}/board`, icon: Kanban, badge: "Live", badgeColor: "badge-teal" },
        { label: "Tickets & Incidents", path: `/p/${projectKey}/tickets`, icon: Ticket },
        { label: "Runs & Timeline", path: `/p/${projectKey}/runs`, icon: PlayCircle },
        { label: "Action Proposals", path: `/p/${projectKey}/actions`, icon: ShieldCheck, badge: "Write Lock", badgeColor: "badge-magenta" },
      ]
    },
    {
      group: "PROJECT",
      items: [
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
        { label: "Projects Fleet", path: "/admin/projects", icon: Layers },
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
    <aside style={{
      width: collapsed ? "70px" : "240px",
      minWidth: collapsed ? "70px" : "240px",
      height: "100vh",
      background: "var(--bg-sidebar)",
      borderRight: "1px solid var(--border-subtle)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      transition: "width 0.2s var(--ease)",
      zIndex: 40,
      userSelect: "none"
    }}>
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
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: collapsed ? "8px 0" : "8px 12px",
                        justifyContent: collapsed ? "center" : "flex-start",
                        borderRadius: "var(--radius-sm)",
                        textDecoration: "none",
                        fontSize: "12.5px",
                        fontWeight: isActive ? "600" : "500",
                        color: isActive ? "#ffffff" : "var(--ink-secondary)",
                        background: isActive ? "var(--prism-gradient)" : "transparent",
                        boxShadow: isActive ? "0 4px 14px -2px var(--prism-glow)" : "none",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <Icon size={16} color={isActive ? "#ffffff" : "currentColor"} />
                      {!collapsed && (
                        <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.label}
                        </span>
                      )}
                      {!collapsed && item.badge && !isActive && (
                        <span className={`badge ${item.badgeColor || "badge-magenta"}`} style={{ fontSize: "9px", padding: "1px 5px" }}>
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

      {/* Bottom User Card & Collapse */}
      <div style={{
        padding: "12px",
        borderTop: "1px solid var(--border-subtle)",
        background: "rgba(5, 8, 22, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        {!collapsed ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
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
              flexShrink: 0
            }}>
              {isAdmin ? "SA" : "SJ"}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--ink-primary)", whiteSpace: "nowrap" }}>
                {isAdmin ? "Super Administrator" : "Sarah Jones"}
              </div>
              <div className="mono" style={{ fontSize: "10px", color: "var(--ink-tertiary)", whiteSpace: "nowrap" }}>
                {isAdmin ? "admin@sentrix.io" : "kbk@company.com"}
              </div>
            </div>
          </div>
        ) : null}

        <button
          className="btn-ghost"
          onClick={() => setCollapsed(!collapsed)}
          style={{ padding: "6px" }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
