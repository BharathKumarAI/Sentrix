import React, { useState, useEffect, useRef } from "react";
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
  PanelLeftClose,
  X,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  User,
  Cpu,
  Clock,
  Activity,
  Terminal,
  ArrowRight,
  Shield,
  Zap,
  Check,
  Radio,
  BookOpen,
  MessageSquarePlus,
  Home,
  FileText,
  Server,
  Database,
  Key,
  Sliders
} from "lucide-react";
import { FrameworkFeedbackModal } from "../FrameworkFeedbackModal";
import { DocsModal } from "../DocsModal";
import { fetchSystemNotifications, fetchBoardTickets } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export const ADMIN_PAGES_CATALOG = [
  // OVERVIEW
  { key: "overview", label: "Overview", title: "Admin Overview", subtitle: "Platform-wide executive KPIs & SLA compliance", path: "/admin/overview", icon: Home, group: "OVERVIEW", color: "#6366f1", bg: "rgba(99, 102, 241, 0.15)" },
  { key: "dashboard", label: "Dashboard", title: "Admin Dashboard", subtitle: "Live operational telemetry & multi-tenant fleet status", path: "/admin/dashboard", icon: Activity, group: "OVERVIEW", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },

  // PLATFORM & RUNTIME
  { key: "projects", label: "Projects Fleet", title: "Projects Fleet", subtitle: "Multi-tenant project roster & SLA tiers", path: "/admin/projects", icon: Layers, group: "PLATFORM & RUNTIME", color: "#ec4899", bg: "rgba(236, 72, 153, 0.15)" },
  { key: "harness", label: "Agent Harness", title: "Agent Harness & Plugins", subtitle: "Composable agent kernel & lifecycle hooks", path: "/admin/harness", icon: Zap, group: "PLATFORM & RUNTIME", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.15)" },
  { key: "skills", label: "Skills Catalog", title: "Skills Catalog", subtitle: "Autonomous diagnostics & remediation playbooks", path: "/admin/skills", icon: Cpu, group: "PLATFORM & RUNTIME", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
  { key: "prompts", label: "Prompts", title: "Prompt Templates", subtitle: "System directives, triage & persona templates", path: "/admin/prompts", icon: FileText, group: "PLATFORM & RUNTIME", color: "#a855f7", bg: "rgba(168, 85, 247, 0.15)" },
  { key: "connectors", label: "Connectors", title: "Connectors Catalog", subtitle: "Enterprise adapters & diagnostic health probes", path: "/admin/connectors", icon: Server, group: "PLATFORM & RUNTIME", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.15)" },
  { key: "models", label: "Model Providers", title: "Model Providers", subtitle: "Multi-model routing, fallback priority & quotas", path: "/admin/models", icon: Database, group: "PLATFORM & RUNTIME", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" },
  { key: "keys", label: "API Keys", title: "API Keys Vault", subtitle: "Zero-trust API credentials & cryptographic rotation", path: "/admin/keys", icon: Key, group: "PLATFORM & RUNTIME", color: "#eab308", bg: "rgba(234, 179, 8, 0.15)" },
  { key: "docs", label: "Developer Docs", title: "Developer Docs", subtitle: "Architecture blueprints & API references", path: "/admin/docs", icon: BookOpen, group: "PLATFORM & RUNTIME", color: "#64748b", bg: "rgba(100, 116, 139, 0.15)" },

  // OBSERVABILITY & FINOPS
  { key: "health", label: "System Health", title: "System Health", subtitle: "Infrastructure probes, latencies & uptime monitors", path: "/admin/health", icon: CheckCircle2, group: "OBSERVABILITY & FINOPS", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
  { key: "audit", label: "Audit Logs", title: "Audit & Compliance", subtitle: "Immutable cryptographic ledger & governance trails", path: "/admin/audit", icon: ShieldCheck, group: "OBSERVABILITY & FINOPS", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.15)" },
  { key: "billing", label: "Usage & Billing", title: "Usage & Billing", subtitle: "FinOps spend tracking & token economics", path: "/admin/billing", icon: Sliders, group: "OBSERVABILITY & FINOPS", color: "#f43f5e", bg: "rgba(244, 63, 94, 0.15)" },
  { key: "reports", label: "Reports", title: "Reports & Digests", subtitle: "Reliability reports & incident post-mortems", path: "/admin/reports", icon: FileText, group: "OBSERVABILITY & FINOPS", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.15)" },

  // GOVERNANCE & IAM
  { key: "users", label: "Users & Roles", title: "User Management", subtitle: "RBAC roles & platform authorizations", path: "/admin/users", icon: User, group: "GOVERNANCE & IAM", color: "#6366f1", bg: "rgba(99, 102, 241, 0.15)" },
  { key: "security", label: "Security Policies", title: "Security Governance", subtitle: "Zero-trust policies & write-lock rules", path: "/admin/security", icon: Shield, group: "GOVERNANCE & IAM", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" },
  { key: "organizations", label: "Organizations", title: "Organizations & Teams", subtitle: "Tenant hierarchies & squad assignments", path: "/admin/organizations", icon: Layers, group: "GOVERNANCE & IAM", color: "#14b8a6", bg: "rgba(20, 184, 166, 0.15)" },
];

export function PrismTopBar({
  projects = [],
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

  // Active detail modal/popover: null | "PROJECT_DETAILS" | "ADMIN_PAGE_SWITCHER" | "SEARCH_PALETTE" | "NOTIFICATIONS" | "HELP_DOCS" | "SETTINGS" | "USER_PROFILE"
  const [activeModal, setActiveModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminModuleSearch, setAdminModuleSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [readNotifications, setReadNotifications] = useState([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const topbarRef = useRef(null);

  const { currentPersona, personas, switchPersona, isPlatformAdmin, isGeneralViewer } = useAuth();
  const isAdmin = location.pathname.startsWith("/admin");
  const pathParts = location.pathname.split("/").filter(Boolean);
  const currentAdminKey = (isAdmin ? pathParts[1] : null) || "overview";
  const currentAdminPage = ADMIN_PAGES_CATALOG.find((p) => p.key === currentAdminKey) || ADMIN_PAGES_CATALOG[0];
  const currentPage = isAdmin ? currentAdminKey : (pathParts[2] || "overview");
  const projectKey = activeProject?.project_key || "";


  // Document Title Synchronization
  useEffect(() => {
    if (isAdmin) {
      document.title = `Sentrix | ${currentAdminPage.title}`;
    } else if (activeProject) {
      document.title = `Sentrix | ${activeProject.name}`;
    }
  }, [location.pathname, isAdmin, currentAdminPage, activeProject]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (topbarRef.current && !topbarRef.current.contains(e.target)) {
        setActiveModal(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K opens search, Escape closes modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setActiveModal((prev) => (prev === "SEARCH_PALETTE" ? null : "SEARCH_PALETTE"));
      } else if (e.key === "Escape") {
        setActiveModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [notifications, setNotifications] = useState([]);
  const [activeBoardTickets, setActiveBoardTickets] = useState([]);

  useEffect(() => {
    fetchSystemNotifications()
      .then((data) => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch((err) => console.warn("Could not load notifications:", err));

    if (projectKey) {
      fetchBoardTickets(projectKey)
        .then((data) => {
          if (Array.isArray(data)) setActiveBoardTickets(data);
        })
        .catch(() => {});
    }
  }, [projectKey]);

  const toggleModal = (modalName) => {
    setActiveModal((prev) => (prev === modalName ? null : modalName));
  };

  const adminPageGroups = [
    "OVERVIEW",
    "PLATFORM & RUNTIME",
    "OBSERVABILITY & FINOPS",
    "GOVERNANCE & IAM"
  ];

  const filteredAdminPages = ADMIN_PAGES_CATALOG.filter((p) => {
    if (!adminModuleSearch.trim()) return true;
    const q = adminModuleSearch.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.subtitle.toLowerCase().includes(q) ||
      p.group.toLowerCase().includes(q) ||
      p.key.toLowerCase().includes(q)
    );
  });

  return (
    <header
      ref={topbarRef}
      style={{
        height: "60px",
        background: "var(--bg-sidebar)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        zIndex: 30,
        position: "relative"
      }}
    >
      {/* Left: Sidebar Toggle + Project & Environment Switchers */}
      {/* Left: Breadcrumbs / Module Switcher */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Admin Mode Header & Interactive Segmented Page Switcher */}
        {isAdmin && (
          <div style={{ position: "relative" }}>
            <div
              onClick={() => toggleModal("ADMIN_PAGE_SWITCHER")}
              style={{
                display: "flex",
                alignItems: "center",
                height: "36px",
                borderRadius: "8px",
                background: activeModal === "ADMIN_PAGE_SWITCHER" ? "rgba(99, 102, 241, 0.12)" : "var(--bg-elevated)",
                border: activeModal === "ADMIN_PAGE_SWITCHER" ? "1px solid var(--prism-purple)" : "1px solid var(--border-subtle)",
                cursor: "pointer",
                transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                overflow: "hidden",
                boxShadow: activeModal === "ADMIN_PAGE_SWITCHER" ? "0 0 16px rgba(99, 102, 241, 0.25)" : "0 1px 2px rgba(0, 0, 0, 0.12)"
              }}
              title="Click to jump across Admin Console modules"
            >
              {/* Context Tag (Left Segment) */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "0 10px",
                height: "100%",
                background: "rgba(99, 102, 241, 0.08)",
                borderRight: "1px solid var(--border-subtle)",
                fontSize: "11px",
                fontWeight: "700",
                color: "var(--prism-purple)",
                letterSpacing: "0.04em",
                textTransform: "uppercase"
              }}>
                <div style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "4px",
                  background: "linear-gradient(135deg, #0d9488 0%, #6366f1 100%)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <currentAdminPage.icon size={11} />
                </div>
                <span>ADMIN CONSOLE</span>
              </div>

              {/* Current Page Title & Expander Arrow (Right Segment) */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "0 10px",
                height: "100%"
              }}>
                <span style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--ink-primary)",
                  letterSpacing: "-0.01em"
                }}>
                  {currentAdminPage.title}
                </span>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "18px",
                  height: "18px",
                  borderRadius: "4px",
                  background: activeModal === "ADMIN_PAGE_SWITCHER" ? "rgba(99, 102, 241, 0.2)" : "var(--bg-app)",
                  color: activeModal === "ADMIN_PAGE_SWITCHER" ? "var(--prism-purple)" : "var(--ink-tertiary)",
                  transform: activeModal === "ADMIN_PAGE_SWITCHER" ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "all 0.2s ease"
                }}>
                  <ChevronDown size={12} />
                </div>
              </div>
            </div>

            {/* High-End Executive Admin Pages Dropdown */}
            {activeModal === "ADMIN_PAGE_SWITCHER" && (
              <div
                className="prism-card message-animate-in"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  width: "560px",
                  maxHeight: "520px",
                  overflowY: "auto",
                  padding: "16px",
                  zIndex: 100,
                  background: "var(--bg-card)",
                  boxShadow: "0 22px 50px -10px rgba(0,0,0,0.75), 0 0 0 1px var(--border-card)",
                  border: "1px solid var(--border-card)",
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                {/* Popover Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "6px",
                      background: "linear-gradient(135deg, #0d9488 0%, #6366f1 100%)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <Compass size={13} />
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink-primary)" }}>
                        Admin Console Navigation Suite
                      </div>
                      <div style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>
                        Global governance, fleet runtime, telemetry probes & security policies
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-magenta" style={{ fontSize: "9.5px", padding: "2px 6px" }}>
                    {ADMIN_PAGES_CATALOG.length} Modules
                  </span>
                </div>

                {/* Instant Filter Search Bar */}
                <div style={{ position: "relative" }}>
                  <Search size={13} color="var(--ink-tertiary)" style={{ position: "absolute", left: "10px", top: "9px" }} />
                  <input
                    type="text"
                    value={adminModuleSearch}
                    onChange={(e) => setAdminModuleSearch(e.target.value)}
                    placeholder="Search 17 admin modules... (or type key)"
                    autoFocus
                    style={{
                      width: "100%",
                      height: "32px",
                      padding: "0 28px 0 30px",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "6px",
                      color: "var(--ink-primary)",
                      fontSize: "12px",
                      outline: "none"
                    }}
                  />
                  {adminModuleSearch && (
                    <button
                      onClick={() => setAdminModuleSearch("")}
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "7px",
                        background: "none",
                        border: "none",
                        color: "var(--ink-tertiary)",
                        cursor: "pointer",
                        padding: "2px"
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Grouped Module Cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxHeight: "340px", overflowY: "auto", paddingRight: "4px" }}>
                  {adminPageGroups.map((grp) => {
                    const groupItems = filteredAdminPages.filter((p) => p.group === grp);
                    if (groupItems.length === 0) return null;
                    return (
                      <div key={grp} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "2px 2px",
                          borderBottom: "1px solid var(--border-subtle)"
                        }}>
                          <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {grp}
                          </span>
                          <span className="mono" style={{ fontSize: "9px", color: "var(--ink-tertiary)" }}>
                            {groupItems.length}
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                          {groupItems.map((page) => {
                            const PageIcon = page.icon;
                            const isCurrent = page.key === currentAdminKey;
                            return (
                              <div
                                key={page.key}
                                onClick={() => {
                                  navigate(page.path);
                                  setActiveModal(null);
                                  setAdminModuleSearch("");
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "9px",
                                  padding: "8px 10px",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  background: isCurrent ? "rgba(99, 102, 241, 0.12)" : "rgba(255, 255, 255, 0.02)",
                                  border: "1px solid",
                                  borderColor: isCurrent ? "var(--prism-purple)" : "var(--border-subtle)",
                                  transition: "all 0.15s ease",
                                  position: "relative"
                                }}
                                onMouseEnter={(e) => {
                                  if (!isCurrent) {
                                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isCurrent) {
                                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                                  }
                                }}
                              >
                                <div style={{
                                  width: "24px",
                                  height: "24px",
                                  borderRadius: "6px",
                                  background: page.bg || "rgba(255, 255, 255, 0.06)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: page.color || "var(--ink-secondary)",
                                  flexShrink: 0,
                                  marginTop: "1px"
                                }}>
                                  <PageIcon size={13} />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
                                    <span style={{
                                      fontSize: "12px",
                                      fontWeight: isCurrent ? "700" : "600",
                                      color: isCurrent ? "var(--prism-purple)" : "var(--ink-primary)",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap"
                                    }}>
                                      {page.title}
                                    </span>
                                    {isCurrent && (
                                      <span className="badge badge-teal" style={{ fontSize: "8px", padding: "1px 4px" }}>
                                        ACTIVE
                                      </span>
                                    )}
                                  </div>
                                  <span style={{
                                    fontSize: "10px",
                                    color: "var(--ink-tertiary)",
                                    lineHeight: 1.25,
                                    marginTop: "2px",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden"
                                  }}>
                                    {page.subtitle}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {filteredAdminPages.length === 0 && (
                    <div style={{ textAlign: "center", padding: "20px 0", color: "var(--ink-tertiary)", fontSize: "12px" }}>
                      No admin modules match "{adminModuleSearch}"
                    </div>
                  )}
                </div>

                {/* Footer Quick Actions */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "10px"
                }}>
                  <button
                    onClick={() => {
                      navigate(`/p/${projectKey}/overview`);
                      setActiveModal(null);
                    }}
                    className="btn-ghost"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "11px",
                      color: "var(--prism-pink)",
                      padding: "4px 8px"
                    }}
                  >
                    <Zap size={13} />
                    <span>Switch to Project Mode ({projectKey})</span>
                  </button>
                  <span className="mono" style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>
                    Press Esc to close
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Project Mode: Interactive Segmented Pill */}
        {!isAdmin && activeProject && (
          <div style={{ position: "relative" }}>
            <div
              onClick={() => toggleModal("PROJECT_DETAILS")}
              style={{
                display: "flex",
                alignItems: "center",
                height: "36px",
                borderRadius: "8px",
                background: activeModal === "PROJECT_DETAILS" ? "rgba(244, 63, 94, 0.12)" : "var(--bg-elevated)",
                border: activeModal === "PROJECT_DETAILS" ? "1px solid var(--prism-magenta)" : "1px solid var(--border-subtle)",
                cursor: "pointer",
                transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                overflow: "hidden",
                boxShadow: activeModal === "PROJECT_DETAILS" ? "0 0 16px rgba(244, 63, 94, 0.25)" : "0 1px 2px rgba(0, 0, 0, 0.12)"
              }}
              title="Click to view project details & switch project roster"
            >
              {/* Project Key Badge (Left Segment) */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "0 10px",
                height: "100%",
                background: "rgba(244, 63, 94, 0.08)",
                borderRight: "1px solid var(--border-subtle)",
                fontSize: "11px",
                fontWeight: "700",
                color: "var(--prism-magenta)",
                letterSpacing: "0.04em"
              }}>
                <div style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "4px",
                  background: "var(--prism-gradient)",
                  color: "#fff",
                  fontSize: "9.5px",
                  fontWeight: "800",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {activeProject.project_key?.slice(0, 2) || "PR"}
                </div>
                <span className="mono">{activeProject.project_key}</span>
              </div>

              {/* Project Name & Expander Chevron (Right Segment) */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "0 10px",
                height: "100%"
              }}>
                <span style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--ink-primary)",
                  letterSpacing: "-0.01em",
                  maxWidth: "220px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                  {activeProject.name}
                </span>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "18px",
                  height: "18px",
                  borderRadius: "4px",
                  background: activeModal === "PROJECT_DETAILS" ? "rgba(244, 63, 94, 0.2)" : "var(--bg-app)",
                  color: activeModal === "PROJECT_DETAILS" ? "var(--prism-magenta)" : "var(--ink-tertiary)",
                  transform: activeModal === "PROJECT_DETAILS" ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "all 0.2s ease"
                }}>
                  <ChevronDown size={12} />
                </div>
              </div>
            </div>

            {/* INTERACTIVE PROJECT DETAILS POPOVER */}
            {activeModal === "PROJECT_DETAILS" && (
              <div
                className="prism-card message-animate-in"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  width: "420px",
                  padding: "16px",
                  zIndex: 100,
                  background: "var(--bg-card)",
                  boxShadow: "0 22px 50px -10px rgba(0,0,0,0.75), 0 0 0 1px var(--border-card)",
                  border: "1px solid var(--border-card)",
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "var(--prism-gradient)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "12px" }}>
                      {activeProject.project_key?.slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--ink-primary)" }}>
                        {activeProject.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                        {activeProject.department || "Enterprise Monitored Service"}
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-teal">Tier-1 Critical</span>
                </div>

                {/* Telemetry & SLA Specs */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "var(--bg-app)", border: "1px solid var(--border-subtle)", padding: "10px", borderRadius: "8px" }}>
                  <div>
                    <span style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>SLA Adherence:</span>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--accent-teal)" }}>99.98% Healthy</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>Autonomous MTTR:</span>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--prism-pink)" }}>14.2m (-68%)</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>Active Queue:</span>
                    <div className="mono" style={{ fontSize: "11px", color: "var(--ink-primary)" }}>{activeProject.project_key}-QUEUE</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>Criticality Tier:</span>
                    <div style={{ fontSize: "11.5px", color: "var(--accent-amber)", fontWeight: "600" }}>Mission Critical</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      navigate(`/p/${activeProject.project_key}/board`);
                      setActiveModal(null);
                    }}
                    className="btn-primary"
                    style={{ flex: 1, fontSize: "11.5px", padding: "7px 10px", justifyContent: "center" }}
                  >
                    Live Triage Board
                  </button>
                  <button
                    onClick={() => {
                      navigate(`/p/${activeProject.project_key}/setup`);
                      setActiveModal(null);
                    }}
                    className="btn-secondary"
                    style={{ flex: 1, fontSize: "11.5px", padding: "7px 10px", justifyContent: "center" }}
                  >
                    Setup Studio
                  </button>
                </div>

                {/* Searchable Project Switcher List */}
                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "10.5px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                      Switch Project Roster ({projects.length})
                    </span>
                  </div>

                  <div style={{ position: "relative" }}>
                    <Search size={12} color="var(--ink-tertiary)" style={{ position: "absolute", left: "9px", top: "8px" }} />
                    <input
                      type="text"
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      placeholder="Search projects by key or name..."
                      style={{
                        width: "100%",
                        height: "28px",
                        padding: "0 24px 0 28px",
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "6px",
                        color: "var(--ink-primary)",
                        fontSize: "11px",
                        outline: "none"
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "150px", overflowY: "auto" }}>
                    {projects
                      .filter((p) => {
                        if (!projectSearch.trim()) return true;
                        const q = projectSearch.toLowerCase();
                        return (p.name || "").toLowerCase().includes(q) || (p.project_key || "").toLowerCase().includes(q);
                      })
                      .map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            onSelectProject(p);
                            setActiveModal(null);
                            setProjectSearch("");
                            navigate(`/p/${p.project_key}/${currentPage}`);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            opacity: (p.status || "").toUpperCase() === "DISABLED" ? 0.65 : 1,
                            background: activeProject.id === p.id ? "rgba(225, 29, 72, 0.15)" : "transparent",
                            border: activeProject.id === p.id ? "1px solid rgba(225, 29, 72, 0.3)" : "1px solid transparent"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "12px", color: (p.status || "").toUpperCase() === "DISABLED" ? "var(--ink-muted)" : "var(--ink-primary)", fontWeight: activeProject.id === p.id ? "700" : "500" }}>
                              {p.name}
                            </span>
                            {(p.status || "").toUpperCase() === "DISABLED" && (
                              <span className="badge badge-rose" style={{ fontSize: "8.5px", padding: "1px 4px" }}>
                                DISABLED
                              </span>
                            )}
                          </div>
                          <span className="mono badge badge-magenta" style={{ fontSize: "9px" }}>
                            {p.project_key}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Middle: Interactive Global Search (Click reveals Command Palette) */}
      <div style={{ position: "relative", width: "360px" }}>
        <div style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          height: "36px",
          width: "100%",
          borderRadius: "8px",
          background: "var(--bg-input)",
          border: activeModal === "SEARCH_PALETTE" ? "1px solid var(--prism-pink)" : "1px solid var(--border-subtle)",
          boxShadow: activeModal === "SEARCH_PALETTE" ? "0 0 0 2px rgba(236, 72, 153, 0.15)" : "none",
          transition: "all 0.15s ease"
        }}>
          <Search size={14} color="var(--ink-tertiary)" style={{ position: "absolute", left: "12px", pointerEvents: "none" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setActiveModal("SEARCH_PALETTE")}
            placeholder={isAdmin ? "Search users, projects, agents... (⌘K)" : "Search tickets, agents, workflows... (⌘K)"}
            style={{
              width: "100%",
              height: "100%",
              padding: "0 44px 0 34px",
              background: "transparent",
              border: "none",
              color: "var(--ink-primary)",
              fontSize: "12px",
              outline: "none"
            }}
          />
          <kbd
            onClick={() => toggleModal("SEARCH_PALETTE")}
            style={{
              position: "absolute",
              right: "8px",
              fontSize: "10px",
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: "600",
              color: "var(--ink-tertiary)",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-subtle)",
              padding: "2px 6px",
              borderRadius: "5px",
              cursor: "pointer",
              userSelect: "none"
            }}
          >
            ⌘K
          </kbd>
        </div>

        {/* INTERACTIVE COMMAND PALETTE POPOVER */}
        {activeModal === "SEARCH_PALETTE" && (
          <div
            className="prism-card message-animate-in"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              width: "480px",
              padding: "16px",
              zIndex: 100,
              background: "var(--bg-card)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.7)",
              border: "1px solid var(--prism-pink)",
              borderRadius: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                Quick Navigation & Incident Search
              </span>
              <span className="mono" style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>Press ESC to close</span>
            </div>

            {/* Quick Jumps */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "10.5px", color: "var(--ink-secondary)", fontWeight: "600" }}>Command Jumps:</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                {(isAdmin ? [
                  { label: "Overview", icon: Home, path: "/admin/overview", badge: "KPIs" },
                  { label: "Dashboard", icon: Activity, path: "/admin/dashboard", badge: "TELEMETRY" },
                  { label: "Projects Fleet", icon: Layers, path: "/admin/projects", badge: "FLEET" },
                  { label: "Agent Harness", icon: Zap, path: "/admin/harness", badge: "PLUGINS" },
                  { label: "System Health", icon: CheckCircle2, path: "/admin/health", badge: "HEALTH" },
                  { label: "Usage & Billing", icon: Sliders, path: "/admin/billing", badge: "FINOPS" },
                  { label: "Audit Logs", icon: ShieldCheck, path: "/admin/audit", badge: "SECURITY" },
                  { label: "Model Providers", icon: Database, path: "/admin/models", badge: "MODELS" }
                ] : [
                  { label: "Live Triage Board", icon: Radio, path: `/p/${projectKey}/board`, badge: "LIVE" },
                  { label: "Auto-Triage Hub", icon: Zap, path: `/p/${projectKey}/triage`, badge: "ADK" },
                  { label: "Investigation Stream", icon: Terminal, path: `/p/${projectKey}/investigations`, badge: "AI" },
                  { label: "SRE Metrics", icon: Activity, path: `/p/${projectKey}/metrics`, badge: "SLO" }
                ]).map((item) => (
                  <div
                    key={item.label}
                    onClick={() => {
                      navigate(item.path);
                      setActiveModal(null);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      background: "rgba(255, 255, 255, 0.04)",
                      cursor: "pointer",
                      fontSize: "12px",
                      color: "var(--ink-primary)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <item.icon size={13} color="var(--prism-pink)" />
                      <span>{item.label}</span>
                    </div>
                    <span className="badge badge-magenta" style={{ fontSize: "9px" }}>{item.badge}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Tickets Search Match */}
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "10.5px", color: "var(--ink-secondary)", fontWeight: "600" }}>Active Incident Tickets:</span>
              {activeBoardTickets.length > 0 ? (
                activeBoardTickets.slice(0, 3).map((ticket) => (
                  <div
                    key={ticket.key || ticket.id}
                    onClick={() => {
                      navigate(`/p/${projectKey}/board`);
                      setActiveModal(null);
                    }}
                    style={{ padding: "8px 10px", borderRadius: "6px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: "700", color: "#fff" }}>{ticket.key}: {ticket.title}</div>
                      <div style={{ fontSize: "11px", color: "var(--accent-rose)" }}>{ticket.priority || "P1"} • {ticket.service || "Core"} ({ticket.status})</div>
                    </div>
                    <ArrowRight size={13} color="var(--accent-rose)" />
                  </div>
                ))
              ) : (
                <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", padding: "4px 8px" }}>
                  No active incidents for this project.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right: Actions, Notifications, Help, Settings & User Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Admin Quick Add Project Button */}
        {isAdmin && (
          <button
            onClick={onOpenNewProjectModal}
            className="btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: "36px",
              padding: "0 14px",
              fontSize: "12px",
              fontWeight: "600",
              gap: "6px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(236, 72, 153, 0.25)"
            }}
            title="Register New Enterprise Project"
          >
            <Plus size={14} /> <span>New Project</span>
          </button>
        )}

        {/* EXTENSIBILITY DOCS POPUP BUTTON */}
        <button
          onClick={() => {
            setActiveModal(null);
            setShowDocsModal(true);
          }}
          style={{
            height: "32px",
            padding: "0 8px",
            fontSize: "12px",
            fontWeight: "600",
            gap: "5px",
            borderRadius: "6px",
            color: showDocsModal ? "var(--accent-teal)" : "var(--ink-secondary)",
            background: showDocsModal ? "rgba(16, 185, 129, 0.12)" : "transparent",
            border: "none",
            display: "inline-flex",
            alignItems: "center",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => {
            if (!showDocsModal) {
              e.currentTarget.style.color = "var(--ink-primary)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }
          }}
          onMouseLeave={(e) => {
            if (!showDocsModal) {
              e.currentTarget.style.color = "var(--ink-secondary)";
              e.currentTarget.style.background = "transparent";
            }
          }}
          title="Open Platform Documentation & Extensibility Specs (Popup)"
        >
          <BookOpen size={15} color={showDocsModal ? "var(--accent-teal)" : "currentColor"} />
          <span>Docs</span>
        </button>

        {/* FRAMEWORK FEEDBACK & ISSUE REPORT BUTTON */}
        <button
          onClick={() => {
            setActiveModal(null);
            setShowFeedbackModal(true);
          }}
          style={{
            height: "32px",
            padding: "0 8px",
            fontSize: "12px",
            fontWeight: "600",
            gap: "5px",
            borderRadius: "6px",
            border: "none",
            background: showFeedbackModal ? "rgba(236, 72, 153, 0.12)" : "transparent",
            color: showFeedbackModal ? "var(--prism-pink)" : "var(--ink-secondary)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => {
            if (!showFeedbackModal) {
              e.currentTarget.style.color = "var(--prism-pink)";
              e.currentTarget.style.background = "rgba(236, 72, 153, 0.08)";
            }
          }}
          onMouseLeave={(e) => {
            if (!showFeedbackModal) {
              e.currentTarget.style.color = "var(--ink-secondary)";
              e.currentTarget.style.background = "transparent";
            }
          }}
          title="Report framework issue, chat problem, or submit new feature request"
        >
          <MessageSquarePlus size={15} />
          <span>Feedback</span>
        </button>

        {/* Global Theme Switcher (Light / Dark) */}
        <button
          onClick={onToggleTheme}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--ink-secondary)",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
            e.currentTarget.style.color = "var(--ink-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--ink-secondary)";
          }}
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? (
            <Moon size={16} color="var(--accent-violet)" />
          ) : (
            <Sun size={16} color="var(--accent-amber)" />
          )}
        </button>

        {/* NOTIFICATION BELL WITH INTERACTIVE DETAILS POPOVER */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => toggleModal("NOTIFICATIONS")}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: activeModal === "NOTIFICATIONS" ? "rgba(236, 72, 153, 0.12)" : "transparent",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              color: activeModal === "NOTIFICATIONS" ? "var(--prism-pink)" : "var(--ink-secondary)"
            }}
            onMouseEnter={(e) => {
              if (activeModal !== "NOTIFICATIONS") {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                e.currentTarget.style.color = "var(--ink-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeModal !== "NOTIFICATIONS") {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--ink-secondary)";
              }
            }}
            title={`Incident Telemetry Notifications (${Math.max(0, notifications.length - readNotifications.length)})`}
          >
            <Bell size={17} />
          </button>
          
          {notifications.length > readNotifications.length && (
            <div style={{
              position: "absolute",
              top: "1px",
              right: "1px",
              minWidth: "15px",
              height: "15px",
              padding: "0 3px",
              borderRadius: "8px",
              background: "var(--prism-magenta)",
              color: "#fff",
              fontSize: "8.5px",
              fontWeight: "800",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              boxShadow: "0 0 6px var(--prism-magenta)"
            }}>
              {notifications.length - readNotifications.length}
            </div>
          )}

          {/* NOTIFICATION CENTER POPOVER */}
          {activeModal === "NOTIFICATIONS" && (
            <div
              className="prism-card message-animate-in"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: "-60px",
                width: "400px",
                padding: "16px",
                zIndex: 100,
                background: "var(--bg-card)",
                boxShadow: "0 16px 36px rgba(0,0,0,0.7)",
                border: "1px solid var(--border-card)",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Bell size={15} color="var(--prism-pink)" />
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink-primary)" }}>
                    Incident Telemetry Alerts
                  </span>
                </div>
                <button
                  onClick={() => setReadNotifications(notifications.map((n) => n.id))}
                  className="btn-ghost"
                  style={{ fontSize: "10.5px", padding: "2px 6px", color: "var(--ink-tertiary)" }}
                >
                  Mark All Read
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "280px", overflowY: "auto" }}>
                {notifications.map((n) => {
                  const isRead = readNotifications.includes(n.id);
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        setReadNotifications((prev) => [...prev, n.id]);
                        navigate(`/p/${projectKey}/triage`);
                        setActiveModal(null);
                      }}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: isRead ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.06)",
                        border: "1px solid var(--border-subtle)",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span className={`badge ${n.level === "CRITICAL" ? "badge-rose" : n.level === "ACTION_REQUIRED" ? "badge-magenta" : "badge-teal"}`} style={{ fontSize: "9px" }}>
                          {n.level}
                        </span>
                        <span className="mono" style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>{n.time}</span>
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: "700", color: isRead ? "var(--ink-secondary)" : "#fff" }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--ink-secondary)", lineHeight: 1.4 }}>
                        {n.desc}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  navigate(`/p/${projectKey}/board`);
                  setActiveModal(null);
                }}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", fontSize: "11.5px", padding: "7px" }}
              >
                Open Live Triage Board
              </button>
            </div>
          )}
        </div>

        {/* HELP ICON WITH INTERACTIVE DETAILS POPOVER */}
        {/* HELP ICON WITH INTERACTIVE DETAILS POPOVER */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => toggleModal("HELP_DOCS")}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: activeModal === "HELP_DOCS" ? "rgba(139, 125, 255, 0.12)" : "transparent",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              color: activeModal === "HELP_DOCS" ? "var(--accent-violet)" : "var(--ink-secondary)"
            }}
            onMouseEnter={(e) => {
              if (activeModal !== "HELP_DOCS") {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                e.currentTarget.style.color = "var(--ink-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeModal !== "HELP_DOCS") {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--ink-secondary)";
              }
            }}
            title="Platform Help & Architecture"
          >
            <HelpCircle size={16} color="currentColor" />
          </button>

          {/* HELP & ARCHITECTURE POPOVER */}
          {activeModal === "HELP_DOCS" && (
            <div
              className="prism-card message-animate-in"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: "-20px",
                width: "340px",
                padding: "16px",
                zIndex: 100,
                background: "var(--bg-card)",
                boxShadow: "0 16px 36px rgba(0,0,0,0.7)",
                border: "1px solid var(--border-card)",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <BookOpen size={15} color="var(--accent-violet)" />
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink-primary)" }}>
                    Sentrix SRE Architecture Help
                  </span>
                </div>
                <span className="mono badge badge-violet" style={{ fontSize: "9px" }}>Google ADK</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11.5px", color: "var(--ink-secondary)" }}>
                <div><strong>Autonomous Engine:</strong> Google ADK on Gemini 2.5 Pro</div>
                <div><strong>Backend Daemon:</strong> FastAPI on Port 8000 (38ms Heartbeat)</div>
                <div><strong>Zero-Trust Model:</strong> Cryptographic Write-Lock active</div>
              </div>

              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "8px" }}>
                <span style={{ fontSize: "10.5px", color: "var(--ink-tertiary)", fontWeight: "700", textTransform: "uppercase" }}>Keyboard Shortcuts:</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px", fontSize: "11px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Toggle Sidebar</span> <kbd className="mono">⌘B</kbd></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Command Palette</span> <kbd className="mono">⌘K</kbd></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Close Any Dialog</span> <kbd className="mono">Esc</kbd></div>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveModal(null);
                  setShowDocsModal(true);
                }}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", fontSize: "11.5px", padding: "7px", gap: "6px" }}
              >
                <BookOpen size={13} />
                Developer & Extensibility Docs (Popup)
              </button>
            </div>
          )}
        </div>

        {/* SETTINGS ICON WITH INTERACTIVE DETAILS POPOVER */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => toggleModal("SETTINGS")}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: activeModal === "SETTINGS" ? "rgba(16, 185, 129, 0.12)" : "transparent",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              color: activeModal === "SETTINGS" ? "var(--accent-teal)" : "var(--ink-secondary)"
            }}
            onMouseEnter={(e) => {
              if (activeModal !== "SETTINGS") {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                e.currentTarget.style.color = "var(--ink-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeModal !== "SETTINGS") {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--ink-secondary)";
              }
            }}
            title="Platform Settings & Environment Matrix"
          >
            <Settings size={16} color="currentColor" />
          </button>

          {/* SETTINGS POPOVER */}
          {activeModal === "SETTINGS" && (
            <div
              className="prism-card message-animate-in"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: "350px",
                padding: "16px",
                zIndex: 100,
                background: "var(--bg-card)",
                boxShadow: "0 16px 36px rgba(0,0,0,0.7)",
                border: "1px solid var(--border-card)",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Settings size={15} color="var(--accent-teal)" />
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink-primary)" }}>
                    Platform Governance & Session
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "11.5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-tertiary)" }}>Current Environment:</span>
                  <span className="mono badge badge-teal">{activeEnvironment || "prod"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-tertiary)" }}>Polling Cadence:</span>
                  <span style={{ color: "var(--ink-primary)", fontWeight: "600" }}>30s Jira/ServiceNow</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-tertiary)" }}>Telemetry Broker:</span>
                  <span style={{ color: "var(--accent-teal)", fontWeight: "600" }}>Connected (4/4)</span>
                </div>
              </div>

              <button
                onClick={() => {
                  navigate(`/p/${projectKey}/environments`);
                  setActiveModal(null);
                }}
                className="btn-secondary"
                style={{ width: "100%", justifyContent: "center", fontSize: "11.5px", padding: "6px" }}
              >
                Edit Environment Matrix
              </button>
            </div>
          )}
        </div>

        {/* Subtle Vertical Divider */}
        <div style={{ width: "1px", height: "18px", background: "var(--border-subtle)", margin: "0 4px" }} />

        {/* USER PILL AVATAR WITH INTERACTIVE PROFILE DETAILS POPOVER - FLUID BORDERLESS */}
        <div style={{ position: "relative" }}>
          <div
            onClick={() => toggleModal("USER_PROFILE")}
            style={{
              display: "flex",
              alignItems: "center",
              height: "32px",
              gap: "8px",
              padding: "0 6px 0 2px",
              borderRadius: "6px",
              background: activeModal === "USER_PROFILE" ? "rgba(236, 72, 153, 0.12)" : "transparent",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => {
              if (activeModal !== "USER_PROFILE") {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeModal !== "USER_PROFILE") {
                e.currentTarget.style.background = "transparent";
              }
            }}
            title="Click to switch role persona or view delegation session"
          >
            <div style={{ position: "relative", width: "26px", height: "26px", flexShrink: 0 }}>
              {currentPersona.avatar ? (
                <img
                  src={currentPersona.avatar}
                  alt={currentPersona.name}
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    boxShadow: "0 0 8px var(--prism-glow)"
                  }}
                />
              ) : (
                <div style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  background: "var(--prism-gradient)",
                  color: "#fff",
                  fontSize: "10.5px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 8px var(--prism-glow)"
                }}>
                  {currentPersona.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
              )}
              {/* Green online status indicator dot */}
              <span style={{
                position: "absolute",
                bottom: "-1px",
                right: "-1px",
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#10b981",
                border: "1.5px solid var(--bg-surface)",
                boxShadow: "0 0 4px #10b981"
              }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: "1.15" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--ink-primary)", letterSpacing: "-0.01em" }}>
                {currentPersona.name}
              </span>
              <span className={`badge ${currentPersona.badgeClass}`} style={{ fontSize: "8px", padding: "0 4px", marginTop: "1px", height: "13px", lineHeight: "13px" }}>
                {currentPersona.badgeLabel}
              </span>
            </div>
            <ChevronDown
              size={12}
              color="var(--ink-tertiary)"
              style={{
                transform: activeModal === "USER_PROFILE" ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.15s ease"
              }}
            />
          </div>

          {/* USER PROFILE & PERSONA SWITCHER POPOVER */}
          {activeModal === "USER_PROFILE" && (
            <div
              className="prism-card message-animate-in"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: "380px",
                padding: "16px",
                zIndex: 100,
                background: "var(--bg-card)",
                boxShadow: "0 16px 36px rgba(0,0,0,0.7)",
                border: "1px solid var(--border-card)",
                display: "flex",
                flexDirection: "column",
                gap: "14px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <User size={15} color="var(--prism-pink)" />
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink-primary)" }}>
                    Active Identity & Role Persona
                  </span>
                </div>
                <span className={`badge ${currentPersona.badgeClass}`} style={{ fontSize: "9.5px" }}>
                  {currentPersona.badgeLabel}
                </span>
              </div>

              {/* Current Active Persona Summary */}
              <div style={{ padding: "10px 12px", borderRadius: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: "6px", fontSize: "11.5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-tertiary)" }}>Identity:</span>
                  <span style={{ color: "var(--ink-primary)", fontWeight: "600" }}>{currentPersona.email}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-tertiary)" }}>Authority:</span>
                  <span style={{ color: "var(--prism-pink)", fontWeight: "600" }}>{currentPersona.displayRole}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-tertiary)" }}>Write Lock Rights:</span>
                  <span className={`badge ${currentPersona.writeLockAuthority ? "badge-magenta" : "badge-slate"}`} style={{ fontSize: "9px" }}>
                    {currentPersona.writeLockAuthority ? "Authorized Writer" : "Read-Only Observer"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-tertiary)" }}>Assigned Projects:</span>
                  <span className="mono" style={{ fontSize: "10px", color: "var(--accent-teal)" }}>
                    {currentPersona.assignedProjects.length > 0 ? currentPersona.assignedProjects.join(", ") : "None (Portal Scope)"}
                  </span>
                </div>
              </div>

              {/* Persona Switcher Menu */}
              <div>
                <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--ink-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                  Switch Role Persona (Test RBAC Governance)
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "250px", overflowY: "auto" }}>
                  {personas.map((p) => {
                    const isActive = p.id === currentPersona.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          switchPersona(p.id);
                          if (p.role === "GENERAL_VIEWER") {
                            navigate("/portal");
                          } else if (p.role === "PLATFORM_ADMIN") {
                            navigate("/admin/overview");
                          } else {
                            navigate(`/p/${projectKey}/overview`);
                          }
                          setActiveModal(null);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          background: isActive ? "rgba(236, 72, 153, 0.12)" : "var(--bg-elevated)",
                          border: "1px solid",
                          borderColor: isActive ? "var(--prism-pink)" : "var(--border-subtle)",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <img
                          src={p.avatar}
                          alt={p.name}
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            flexShrink: 0
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: "12px", fontWeight: "600", color: isActive ? "var(--prism-pink)" : "var(--ink-primary)" }}>
                              {p.name}
                            </span>
                            <span className={`badge ${p.badgeClass}`} style={{ fontSize: "8.5px", padding: "0 4px" }}>
                              {p.badgeLabel}
                            </span>
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--ink-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {p.description}
                          </div>
                        </div>
                        {isActive && <Check size={14} color="var(--prism-pink)" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {isPlatformAdmin && (
                <button
                  onClick={() => {
                    if (isAdmin) {
                      navigate(`/p/${projectKey}/overview`);
                    } else {
                      navigate("/admin/overview");
                    }
                    setActiveModal(null);
                  }}
                  className="btn-secondary"
                  style={{ width: "100%", justifyContent: "center", fontSize: "11.5px", padding: "7px" }}
                >
                  {isAdmin ? "Switch to Project View" : "Switch to Admin Console"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FRAMEWORK LEVEL FEEDBACK & BUG REPORT MODAL */}
      <FrameworkFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        activeProject={activeProject}
        activeEnvironment={activeEnvironment}
      />

      {/* PLATFORM EXTENSIBILITY & DEVELOPER DOCS MODAL */}
      <DocsModal
        isOpen={showDocsModal}
        onClose={() => setShowDocsModal(false)}
      />
    </header>
  );
}
