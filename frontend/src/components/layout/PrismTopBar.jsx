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
  MessageSquarePlus
} from "lucide-react";
import { FrameworkFeedbackModal } from "../FrameworkFeedbackModal";

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

  // Active detail modal/popover: null | "PROJECT_DETAILS" | "SEARCH_PALETTE" | "NOTIFICATIONS" | "HELP_DOCS" | "SETTINGS" | "USER_PROFILE"
  const [activeModal, setActiveModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [readNotifications, setReadNotifications] = useState([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const topbarRef = useRef(null);

  const isAdmin = location.pathname.startsWith("/admin");
  const pathParts = location.pathname.split("/").filter(Boolean);
  const currentPage = pathParts[2] || "overview";
  const projectKey = activeProject?.project_key || "BILLING";

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

  const notifications = [
    {
      id: "notif-1",
      level: "CRITICAL",
      title: "P1 504 Gateway Timeout on Stripe Webhooks",
      ticketKey: "BILL-1049",
      time: "14:10 UTC",
      desc: "PoolAcquireTimeoutException: HikariCP connection pool saturated at 20/20."
    },
    {
      id: "notif-2",
      level: "ACTION_REQUIRED",
      title: "Governed Action Proposal Awaiting Approval",
      ticketKey: "PROP-K8S-01",
      time: "14:12 UTC",
      desc: "Staged rolling rollout restart for stripe-webhook-worker pods in billing-prod."
    },
    {
      id: "notif-3",
      level: "AUTO_TRIAGED",
      title: "Auto-Triage Completed (96.4% Accuracy)",
      ticketKey: "BILL-1021",
      time: "13:45 UTC",
      desc: "Isolated row-level deadlock on billing_transactions. Fix staged to GitLab."
    },
    {
      id: "notif-4",
      level: "HEALTHY",
      title: "OKF v2.0 Fabric Synchronized",
      ticketKey: "OKF-FABRIC",
      time: "13:00 UTC",
      desc: "148 precedent incident cases indexed. Recurring incident rate decreased 54%."
    }
  ];

  const toggleModal = (modalName) => {
    setActiveModal((prev) => (prev === modalName ? null : modalName));
  };

  return (
    <header
      ref={topbarRef}
      style={{
        height: "64px",
        background: "var(--bg-sidebar)",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        zIndex: 30,
        position: "relative"
      }}
    >
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

        {/* Project Mode: Interactive Project Pill (Click reveals Project Details & Switcher) */}
        {!isAdmin && activeProject && (
          <div style={{ position: "relative" }}>
            <div
              onClick={() => toggleModal("PROJECT_DETAILS")}
              className="prism-card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                cursor: "pointer",
                borderRadius: "var(--radius-sm)",
                background: activeModal === "PROJECT_DETAILS" ? "rgba(236, 72, 153, 0.12)" : "var(--bg-elevated)",
                border: activeModal === "PROJECT_DETAILS" ? "1px solid var(--prism-pink)" : "1px solid var(--border-subtle)",
                transition: "all 0.15s ease"
              }}
              title="Click to view full project details & switch projects"
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
              <span className="mono badge badge-magenta" style={{ fontSize: "9px" }}>
                {activeProject.project_key}
              </span>
              <ChevronDown size={14} color="var(--ink-secondary)" />
            </div>

            {/* INTERACTIVE PROJECT DETAILS POPOVER */}
            {activeModal === "PROJECT_DETAILS" && (
              <div
                className="prism-card message-animate-in"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  width: "380px",
                  padding: "16px",
                  zIndex: 100,
                  background: "var(--bg-card)",
                  boxShadow: "0 16px 36px rgba(0,0,0,0.65)",
                  border: "1px solid var(--border-card)",
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
                        {activeProject.department || "Core FinTech Engineering"}
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-teal">Tier-1 Critical</span>
                </div>

                {/* Telemetry & SLA Specs */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "rgba(0, 0, 0, 0.25)", padding: "10px", borderRadius: "8px" }}>
                  <div>
                    <span style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>SLA Compliance:</span>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--accent-teal)" }}>99.98% Adherence</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>Avg Incident MTTR:</span>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--prism-pink)" }}>14.2 min (-68%)</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>Primary Jira Queue:</span>
                    <div className="mono" style={{ fontSize: "11px", color: "var(--ink-primary)" }}>BILLING-SRE-QUEUE</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>On-Call Lead:</span>
                    <div style={{ fontSize: "11.5px", color: "var(--ink-primary)", fontWeight: "600" }}>Sarah Jones (SJ)</div>
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
                    style={{ flex: 1, fontSize: "11.5px", padding: "6px 10px", justifyContent: "center" }}
                  >
                    Live Triage Board
                  </button>
                  <button
                    onClick={() => {
                      navigate(`/p/${activeProject.project_key}/setup`);
                      setActiveModal(null);
                    }}
                    className="btn-secondary"
                    style={{ flex: 1, fontSize: "11.5px", padding: "6px 10px", justifyContent: "center" }}
                  >
                    Setup Studio
                  </button>
                </div>

                {/* Project Switcher List */}
                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                  <div style={{ fontSize: "10.5px", fontWeight: "700", color: "var(--ink-tertiary)", marginBottom: "6px", textTransform: "uppercase" }}>
                    Switch Project Roster ({projects.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "140px", overflowY: "auto" }}>
                    {projects.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onSelectProject(p);
                          setActiveModal(null);
                          navigate(`/p/${p.project_key}/${currentPage}`);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 8px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          background: activeProject.id === p.id ? "rgba(225, 29, 72, 0.15)" : "transparent"
                        }}
                      >
                        <span style={{ fontSize: "12px", color: "var(--ink-primary)", fontWeight: activeProject.id === p.id ? "700" : "500" }}>
                          {p.name}
                        </span>
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
        <Search size={14} color="var(--ink-tertiary)" style={{ position: "absolute", left: "12px", top: "11px" }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setActiveModal("SEARCH_PALETTE")}
          placeholder={isAdmin ? "Search users, projects, agents... (⌘K)" : "Search tickets, agents, workflows... (⌘K)"}
          style={{
            width: "100%",
            padding: "8px 40px 8px 34px",
            background: "var(--bg-input)",
            border: activeModal === "SEARCH_PALETTE" ? "1px solid var(--prism-pink)" : "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-pill)",
            color: "var(--ink-primary)",
            fontSize: "12px",
            outline: "none",
            transition: "all 0.15s ease"
          }}
        />
        <div
          onClick={() => toggleModal("SEARCH_PALETTE")}
          style={{
            position: "absolute",
            right: "10px",
            top: "8px",
            fontSize: "10px",
            color: "var(--ink-tertiary)",
            background: "var(--thinking-bg)",
            border: "1px solid var(--border-subtle)",
            padding: "2px 6px",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          ⌘K
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
                {[
                  { label: "Live Triage Board", icon: Radio, path: `/p/${projectKey}/board`, badge: "LIVE" },
                  { label: "Auto-Triage Hub", icon: Zap, path: `/p/${projectKey}/triage`, badge: "ADK" },
                  { label: "Investigation Stream", icon: Terminal, path: `/p/${projectKey}/investigations`, badge: "AI" },
                  { label: "SRE Metrics", icon: Activity, path: `/p/${projectKey}/metrics`, badge: "SLO" }
                ].map((item) => (
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
              <div
                onClick={() => {
                  navigate(`/p/${projectKey}/triage`);
                  setActiveModal(null);
                }}
                style={{ padding: "8px 10px", borderRadius: "6px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#fff" }}>BILL-1049: 504 Gateway Timeout on Stripe Webhooks</div>
                  <div style={{ fontSize: "11px", color: "var(--accent-rose)" }}>Critical • HikariCP Pool Saturation (20/20)</div>
                </div>
                <ArrowRight size={13} color="var(--accent-rose)" />
              </div>
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
            style={{ padding: "6px 12px", fontSize: "12px", gap: "6px" }}
            title="Register New Enterprise Project"
          >
            <Plus size={14} /> New Project
          </button>
        )}

        {/* EXTENSIBILITY DOCS BUTTON */}
        <button
          onClick={() => {
            setActiveModal(null);
            navigate(isAdmin ? "/admin/docs" : `/p/${projectKey}/docs`);
          }}
          className="btn-ghost"
          style={{
            padding: "5px 10px",
            fontSize: "12px",
            fontWeight: "600",
            gap: "6px",
            borderRadius: "8px",
            color: location.pathname.includes("/docs") ? "var(--accent-teal)" : "var(--ink-secondary)",
            background: location.pathname.includes("/docs") ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.03)",
            border: location.pathname.includes("/docs") ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
          title="Extensibility Documentation (Tools, MCP, Connectors, Agents)"
        >
          <BookOpen size={14} color={location.pathname.includes("/docs") ? "var(--accent-teal)" : "var(--ink-secondary)"} />
          <span>Docs</span>
        </button>

        {/* FRAMEWORK FEEDBACK & ISSUE REPORT BUTTON */}
        <button
          onClick={() => {
            setActiveModal(null);
            setShowFeedbackModal(true);
          }}
          className="btn-ghost"
          style={{
            padding: "5px 11px",
            fontSize: "12px",
            fontWeight: "600",
            gap: "6px",
            borderRadius: "8px",
            border: "1px solid rgba(236, 72, 153, 0.35)",
            background: "rgba(236, 72, 153, 0.08)",
            color: "var(--prism-pink)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            transition: "all 0.15s ease"
          }}
          title="Report framework issue, chat problem, or submit new feature request"
        >
          <MessageSquarePlus size={14} />
          <span>Feedback</span>
        </button>

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

        {/* NOTIFICATION BELL WITH INTERACTIVE DETAILS POPOVER */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => toggleModal("NOTIFICATIONS")}
            className="btn-ghost"
            style={{
              padding: "8px",
              background: activeModal === "NOTIFICATIONS" ? "rgba(236, 72, 153, 0.15)" : "transparent",
              borderRadius: "8px"
            }}
            title="Incident Telemetry Notifications (12)"
          >
            <Bell size={17} color={activeModal === "NOTIFICATIONS" ? "var(--prism-pink)" : "var(--ink-secondary)"} />
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
            justifyContent: "center",
            pointerEvents: "none"
          }}>
            {12 - readNotifications.length}
          </div>

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
        <div style={{ position: "relative" }}>
          <button
            onClick={() => toggleModal("HELP_DOCS")}
            className="btn-ghost"
            style={{
              padding: "8px",
              background: activeModal === "HELP_DOCS" ? "rgba(139, 125, 255, 0.15)" : "transparent",
              borderRadius: "8px"
            }}
            title="Platform Help & Architecture"
          >
            <HelpCircle size={17} color={activeModal === "HELP_DOCS" ? "var(--accent-violet)" : "var(--ink-secondary)"} />
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
                <span className="mono badge badge-violet" style={{ fontSize: "9px" }}>v2.8 ADK</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11.5px", color: "var(--ink-secondary)" }}>
                <div><strong>Autonomous Engine:</strong> Google ADK 2.8 on Gemini 2.5 Pro</div>
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
                  navigate(isAdmin ? "/admin/docs" : `/p/${projectKey}/docs`);
                  setActiveModal(null);
                }}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", fontSize: "11.5px", padding: "7px", gap: "6px" }}
              >
                <BookOpen size={13} />
                Developer & Extensibility Docs
              </button>
            </div>
          )}
        </div>

        {/* SETTINGS ICON WITH INTERACTIVE DETAILS POPOVER */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => toggleModal("SETTINGS")}
            className="btn-ghost"
            style={{
              padding: "8px",
              background: activeModal === "SETTINGS" ? "rgba(16, 185, 129, 0.15)" : "transparent",
              borderRadius: "8px"
            }}
            title="Platform Settings & Environment Matrix"
          >
            <Settings size={17} color={activeModal === "SETTINGS" ? "var(--accent-teal)" : "var(--ink-secondary)"} />
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
        <div style={{ width: "1px", height: "20px", background: "var(--border-subtle)", margin: "0 2px" }} />

        {/* USER PILL AVATAR WITH INTERACTIVE PROFILE DETAILS POPOVER */}
        <div style={{ position: "relative" }}>
          <div
            onClick={() => toggleModal("USER_PROFILE")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 10px 4px 4px",
              borderRadius: "var(--radius-pill)",
              background: activeModal === "USER_PROFILE" ? "rgba(236, 72, 153, 0.15)" : "var(--bg-elevated)",
              border: activeModal === "USER_PROFILE" ? "1px solid var(--prism-pink)" : "1px solid var(--border-subtle)",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            title="Click to view authenticated engineer profile & delegation session"
          >
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
              justifyContent: "center",
              boxShadow: "0 0 10px var(--prism-glow)"
            }}>
              {isAdmin ? "SA" : "SJ"}
            </div>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--ink-primary)" }}>
              {isAdmin ? "Admin" : "Sarah Jones"}
            </span>
          </div>

          {/* USER PROFILE & DELEGATION SESSION POPOVER */}
          {activeModal === "USER_PROFILE" && (
            <div
              className="prism-card message-animate-in"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
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
                  <User size={15} color="var(--prism-pink)" />
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink-primary)" }}>
                    Engineer Identity & Delegation Session
                  </span>
                </div>
                <span className="badge badge-teal" style={{ fontSize: "9px" }}>Authenticated</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11.5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-tertiary)" }}>Identity:</span>
                  <span style={{ color: "var(--ink-primary)", fontWeight: "600" }}>{isAdmin ? "admin@company.com" : "kbk@company.com"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-tertiary)" }}>Role Authority:</span>
                  <span style={{ color: "var(--prism-pink)", fontWeight: "600" }}>{isAdmin ? "Platform Lead Admin" : "Staff SRE Commander"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-tertiary)" }}>Delegation Token:</span>
                  <span className="mono badge badge-magenta" style={{ fontSize: "9px" }}>Valid 6h 42m</span>
                </div>
              </div>

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
    </header>
  );
}

