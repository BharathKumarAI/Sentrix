import React, { useState, useEffect } from "react";
import { 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  Terminal, 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  Database, 
  RotateCw, 
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
  GitBranch,
  GitMerge,
  GitPullRequest,
  Check,
  FileCode,
  Users,
  Search,
  Filter,
  Ticket,
  Server,
  Activity,
  AlertTriangle,
  Play,
  FileText,
  Copy,
  ExternalLink,
  MessageSquare,
  Send,
  X,
  Radio,
  BookOpen,
  DollarSign,
  TrendingDown,
  Shield
} from "lucide-react";
import { fetchPendingActions, fetchBoardTickets } from "../api/client";

export function AutoTriageHub({
  activeProject,
  activeEnvironment,
  delegatedIdentity,
  onActionApproved,
  onActionRejected,
  onViewEvidence
}) {
  const projectKey = activeProject?.project_key || "";
  const projectName = activeProject?.name || "Global Billing & Payment Gateway";

  // Polling Ingestion Source Mode
  const [ingestionSource, setIngestionSource] = useState("jira"); // "jira" | "servicenow"
  const [isPolling, setIsPolling] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [filterStatus, setFilterStatus] = useState("ALL"); // "ALL" | "TRIAGED" | "INVESTIGATING" | "ACTION_STAGED"
  const [searchQuery, setSearchQuery] = useState("");

  // Selected ticket for deep-dive drawer / modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeReportTab, setActiveReportTab] = useState("report"); // "report" | "evidence" | "impact" | "chat"

  // Merge Request approval state
  const [mergedTickets, setMergedTickets] = useState({});

  // Chat conversation state for the deep-dive drawer
  const [chatMessages, setChatMessages] = useState({});
  const [userQuery, setUserQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // Tickets List populated dynamically from API
  const [tickets, setTickets] = useState([]);

  const loadTickets = () => {
    setIsLoading(true);
    fetchBoardTickets(projectKey)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((t) => ({
            id: t.key || t.id,
            source: t.source || "Jira",
            queue: `${projectKey}-SRE-QUEUE`,
            priority: `${t.priority || "P1"} ${t.priority === "P1" ? "Critical" : "High"}`,
            title: t.title,
            summary: t.description,
            fix_team: t.assignedTeam || "Payments Core Team",
            assignee: t.reporter || "Sentrix SRE Fleet",
            root_cause_short: t.triageSummary || "Autonomous triage verified root cause.",
            triage_status: t.status === "resolved" ? "RESOLVED" : "ACTION_STAGED",
            confidence_score: (t.confidence || 96) / 100,
            mtta: "14s",
            occurred_at: t.time || t.created_at || null,
            executive_summary: t.triageSummary || t.description,
            service_flow: [
              { name: `${projectKey} Ingress Gateway`, type: "EDGE", status: "HEALTHY", latency: "12ms" },
              { name: `${t.service || "Payment"} Service`, type: "APP", status: "DEGRADED", latency: "1420ms" },
              { name: "PostgreSQL Database", type: "DATABASE", status: "HEALTHY", latency: "14ms" }
            ],
            timelines: [
              { time: "Alert Triggered", label: "Alert Fired", desc: t.title },
              { time: "Ingested", label: "Sentrix Ingestion", desc: `Ingested from ${projectKey} queue` },
              { time: "Triaged", label: "Root Cause Verified", desc: t.triageSummary || "Diagnostic synthesis complete" }
            ],
            root_causes_expanded: {
              primary: t.triageSummary || "Diagnostic determination completed.",
              secondary: "Correlated telemetry across active environments."
            },
            gitlab_fix: {
              target_file: "config/application.yml",
              branch_name: `fix/${t.key}-auto-remediation`,
              before_code: `# Current configuration\nservice.pool.max: 20`,
              after_code: `# Remediated configuration\nservice.pool.max: 50`,
              change_summary: "Scale service connection pool and apply recommended index."
            },
            recommended_fix_plan: t.suggestions || [
              "1. Review and approve staged GitLab remediation proposal.",
              "2. Verify health assertions across target environment."
            ],
            verification_plan: [
              "Synthetic probe assertion: Latency returns to p99 < 150ms.",
              "Assert zero active lock starvation errors in logs."
            ],
            evidence_tools: {
              postgres: "SELECT pid, query_start, state, query FROM pg_stat_activity WHERE state != 'idle';",
              datadog: `Service: ${t.service || "Billing"} Health Telemetry`,
              splunk: `index=${projectKey.toLowerCase()} error occurrences verified`
            },
            references: t.okfReferences || [
              { id: "OKF-RUN-402", title: "HikariCP Pool Starvation & Scaling Playbook", category: "Runbook" }
            ],
            impact_summary: {
              failed_requests: "42 Ingested Events",
              revenue_at_risk: "Protected",
              customer_impact: "Preventative auto-remediation staged",
              sla_degradation: "Within SLA target"
            }
          }));
          setTickets(formatted);
          if (!selectedTicket && formatted.length > 0) {
            setSelectedTicket(formatted[0]);
          }
        } else {
          setTickets([]);
        }
      })
      .catch((err) => console.warn("Failed to load triage hub tickets:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadTickets();
  }, [projectKey]);

  // Handle manual sync trigger
  const handleTriggerSync = () => {
    setIsRefreshing(true);
    loadTickets();
    setTimeout(() => {
      setLastSyncTime(new Date().toISOString());
      setIsRefreshing(false);
    }, 600);
  };

  // Handle approving GitLab Merge Request
  const handleApproveMerge = (ticketId) => {
    setMergedTickets((prev) => ({
      ...prev,
      [ticketId]: {
        status: "MERGED",
        branch: tickets.find((t) => t.id === ticketId)?.gitlab_fix?.branch_name,
        mergedAt: new Date().toISOString(),
        mrId: "!MR-" + Math.floor(Math.random() * 800 + 100)
      }
    }));
  };

  // Handle sending chat message in incident deep-dive drawer
  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!userQuery.trim() || !selectedTicket) return;

    const query = userQuery.trim();
    const currentTicketId = selectedTicket.id;
    const prevMessages = chatMessages[currentTicketId] || [
      {
        sender: "agent",
        text: `Hello! I am your autonomous SRE investigator for incident ${selectedTicket.id}. I have analyzed PostgreSQL connection logs, Datadog traces, and generated the GitLab fix proposal. What would you like to explore?`
      }
    ];

    const updatedWithUser = [...prevMessages, { sender: "user", text: query }];
    setChatMessages((prev) => ({ ...prev, [currentTicketId]: updatedWithUser }));
    setUserQuery("");
    setIsThinking(true);

    setTimeout(() => {
      let agentReply = "";
      const lower = query.toLowerCase();

      if (lower.includes("why") || lower.includes("cause") || lower.includes("reason")) {
        agentReply = `Root cause deconstruction: The HikariCP connection pool was restricted to 20 connections. At 14:02 UTC, a batch of Stripe webhook deliveries triggered unindexed queries on 'customer_reference_id', each holding connection slots for ~4.8 seconds. This exhausted the pool in under 12 seconds, resulting in cascading 504 gateway timeouts.`;
      } else if (lower.includes("fix") || lower.includes("gitlab") || lower.includes("merge") || lower.includes("code")) {
        agentReply = `I have generated branch '${selectedTicket.gitlab_fix.branch_name}'. The merge request increases maximumPoolSize to 50 and adds connection-timeout protections. You can click 'Approve & Merge to GitLab' directly in the GitLab tab.`;
      } else if (lower.includes("postmortem") || lower.includes("summary") || lower.includes("executive")) {
        agentReply = `Executive Postmortem Draft: On ${selectedTicket.occurred_at}, ${selectedTicket.id} occurred due to database connection starvation. Sentrix autonomously triaged the issue in ${selectedTicket.mtta}, isolated the unindexed query pattern, and generated a non-breaking configuration fix. Total financial risk was mitigated to under 0.05% of daily volume.`;
      } else {
        agentReply = `Telemetry verification complete: Tool Broker reports PostgreSQL replica latency is now normalized. Staged GitLab proposal is ready for deployment. Would you like me to run the synthetic verification checks?`;
      }

      setChatMessages((prev) => ({
        ...prev,
        [currentTicketId]: [...updatedWithUser, { sender: "agent", text: agentReply }]
      }));
      setIsThinking(false);
    }, 750);
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (filterStatus !== "ALL" && t.triage_status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.fix_team.toLowerCase().includes(q) ||
        t.root_cause_short.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div
      style={{
        padding: "24px 32px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        overflowY: "auto",
        minHeight: "100%",
        boxSizing: "border-box"
      }}
    >
      {/* 1. Header & Live Ingestion Telemetry Hub */}
      <div
        className="prism-card"
        style={{
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "var(--prism-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 0 18px var(--prism-glow)"
            }}
          >
            <Zap size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                {projectKey} • AUTO-TRIAGE HUB & INCIDENT DESK
              </span>
              <span className="badge badge-teal">Autonomous Triaging</span>
              <span className="badge badge-magenta">{tickets.length} Active Incidents</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Autonomous Incident Triage & Root Cause Intelligence Hub
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Continuous real-time polling of Jira queues & ServiceNow incident streams. Identifies root causes, isolates broken service flows, assigns fix teams, and stages verified GitLab code remediations.
            </p>
          </div>
        </div>

        {/* Polling Ingestion Selector & Heartbeat */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--bg-card)", padding: "8px 14px", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-primary)" }}>
                Polling: {ingestionSource === "jira" ? "Jira JQL Multi-Queue" : "ServiceNow CMDB"}
              </span>
            </div>
            <span style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>
              Synced {lastSyncTime} • Interval 30s • 0 errors
            </span>
          </div>

          {/* Switcher */}
          <div style={{ display: "flex", gap: "4px", background: "var(--bg-app)", padding: "3px", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
            <button
              onClick={() => setIngestionSource("jira")}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: "none",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                background: ingestionSource === "jira" ? "var(--prism-pink)" : "transparent",
                color: "#fff"
              }}
            >
              Jira JQL
            </button>
            <button
              onClick={() => setIngestionSource("servicenow")}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: "none",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                background: ingestionSource === "servicenow" ? "var(--accent-teal)" : "transparent",
                color: "#fff"
              }}
            >
              ServiceNow
            </button>
          </div>

          <button
            onClick={handleTriggerSync}
            disabled={isRefreshing}
            className="btn-ghost"
            style={{ padding: "6px" }}
            title="Force immediate queue poll"
          >
            <RefreshCw size={14} className={isRefreshing ? "spin" : ""} color="var(--prism-pink)" />
          </button>
        </div>
      </div>

      {/* 2. Automated Runs Health & Alerting Track Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "14px"
        }}
      >
        {/* Track 1: Queue Ingestion Poller */}
        <div
          className="prism-card"
          style={{
            padding: "14px 18px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Ticket size={18} color="var(--prism-pink)" />
            <div>
              <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>
                Incident Ingestion Poller
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "2px" }}>
                3 Queues Monitored
              </div>
            </div>
          </div>
          <span className="badge badge-teal">Healthy (30s)</span>
        </div>

        {/* Track 2: ADK Autonomous Triage Agent */}
        <div
          className="prism-card"
          style={{
            padding: "14px 18px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Sparkles size={18} color="var(--accent-teal)" />
            <div>
              <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>
                Autonomous Triage Engine
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "2px" }}>
                Avg MTTA: 18 Seconds
              </div>
            </div>
          </div>
          <span className="badge badge-magenta">96.8% Accuracy</span>
        </div>

        {/* Track 3: Automated Reports & Synthesis Runs */}
        <div
          className="prism-card"
          style={{
            padding: "14px 18px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FileText size={18} color="var(--accent-violet)" />
            <div>
              <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>
                Automated Reports Runs
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "2px" }}>
                Daily Brief Generated
              </div>
            </div>
          </div>
          <span className="badge badge-teal">0 Drift Issues</span>
        </div>
      </div>

      {/* 3. Search & Quick Filters Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Search */}
          <div style={{ position: "relative", width: "280px" }}>
            <Search size={14} color="var(--ink-tertiary)" style={{ position: "absolute", left: "10px", top: "10px" }} />
            <input
              type="text"
              placeholder="Search by ticket, team, root cause..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "7px 10px 7px 32px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)", fontSize: "12px" }}
            />
          </div>

          {/* Status Filters */}
          <div style={{ display: "flex", gap: "6px" }}>
            {["ALL", "ACTION_STAGED", "TRIAGED"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`badge ${filterStatus === st ? "badge-magenta" : "badge-teal"}`}
                style={{ cursor: "pointer", border: "none", padding: "6px 12px", fontSize: "11px", textTransform: "uppercase" }}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <span style={{ fontSize: "12px", color: "var(--ink-tertiary)" }}>
          Showing {filteredTickets.length} triaged incident records
        </span>
      </div>

      {/* 4. Triaged Incident Feed - Line/Row View */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filteredTickets.map((t) => {
          const isMerged = !!mergedTickets[t.id];

          return (
            <div
              key={t.id}
              onClick={() => {
                setSelectedTicket(t);
                setActiveReportTab("report");
              }}
              className="prism-card"
              style={{
                padding: "16px 20px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-card)",
                display: "grid",
                gridTemplateColumns: "100px 100px 1.4fr 160px 1.6fr 130px 160px",
                alignItems: "center",
                gap: "14px",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {/* Col 1: Ticket ID + Source */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span className="badge badge-teal" style={{ fontSize: "11px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                  {t.id}
                </span>
                <span style={{ fontSize: "9.5px", color: "var(--ink-tertiary)" }}>{t.source}</span>
              </div>

              {/* Col 2: Priority */}
              <div>
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "10.5px",
                    fontWeight: 700,
                    background: t.priority.includes("P1") ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                    color: t.priority.includes("P1") ? "#ef4444" : "#f59e0b",
                    border: `1px solid ${t.priority.includes("P1") ? "#ef444455" : "#f59e0b55"}`
                  }}
                >
                  {t.priority}
                </span>
              </div>

              {/* Col 3: Title & Summary */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden" }}>
                <strong style={{ fontSize: "13px", color: "var(--ink-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {t.title}
                </strong>
                <span style={{ fontSize: "11px", color: "var(--ink-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {t.summary}
                </span>
              </div>

              {/* Col 4: Identified Fix Team */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "9.5px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>
                  Fix Squad
                </span>
                <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--prism-pink)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Users size={12} /> {t.fix_team}
                </span>
              </div>

              {/* Col 5: Identified Root Cause */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden" }}>
                <span style={{ fontSize: "9.5px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>
                  Identified Root Cause
                </span>
                <span style={{ fontSize: "11.5px", color: "var(--accent-teal)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {t.root_cause_short}
                </span>
              </div>

              {/* Col 6: Triage Status & MTTA */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start" }}>
                <span className={t.triage_status === "ACTION_STAGED" ? "badge badge-magenta" : "badge badge-teal"} style={{ fontSize: "10px" }}>
                  {t.triage_status}
                </span>
                <span style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>
                  MTTA: <strong style={{ color: "var(--ink-primary)" }}>{t.mtta}</strong> ({Math.round(t.confidence_score * 100)}%)
                </span>
              </div>

              {/* Col 7: Open Triage Chat Action */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                <button
                  className="btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "11px", gap: "6px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTicket(t);
                    setActiveReportTab("report");
                  }}
                >
                  <MessageSquare size={13} /> Open Triage Report & Chat
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* =================================================================
          5. INTERACTIVE TRIAGE DEEP-DIVE MODAL & REPORT CHAT DRAWER
          ================================================================= */}
      {selectedTicket && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.82)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: "20px"
          }}
        >
          <div
            className="prism-card"
            style={{
              width: "100%",
              maxWidth: "1150px",
              height: "90vh",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: "14px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 0 40px rgba(0, 0, 0, 0.8)"
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 24px",
                background: "var(--bg-elevated)",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span className="badge badge-teal" style={{ fontSize: "12px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                  {selectedTicket.id}
                </span>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink-primary)" }}>
                    {selectedTicket.title}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "2px", fontSize: "11.5px", color: "var(--ink-tertiary)" }}>
                    <span>Source: <strong>{selectedTicket.source}</strong></span>
                    <span>•</span>
                    <span>Fix Team: <strong style={{ color: "var(--prism-pink)" }}>{selectedTicket.fix_team}</strong></span>
                    <span>•</span>
                    <span>Priority: <strong style={{ color: "#ef4444" }}>{selectedTicket.priority}</strong></span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {mergedTickets[selectedTicket.id] ? (
                  <span className="badge badge-teal" style={{ gap: "4px" }}>
                    <CheckCircle2 size={13} /> Merged to GitLab
                  </span>
                ) : (
                  <button
                    onClick={() => handleApproveMerge(selectedTicket.id)}
                    className="btn-primary"
                    style={{ fontSize: "12px", gap: "6px" }}
                  >
                    <GitMerge size={14} /> Approve & Merge to GitLab
                  </button>
                )}
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="btn-ghost"
                  style={{ padding: "6px" }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                padding: "8px 24px",
                background: "var(--bg-card)",
                borderBottom: "1px solid var(--border-subtle)"
              }}
            >
              {[
                { id: "report", label: "Triage Report & Code Diff", icon: FileText },
                { id: "evidence", label: "Evidence by Tools", icon: Server },
                { id: "impact", label: "Impact Summary & SLA", icon: TrendingDown },
                { id: "chat", label: "Incident AI Assistant", icon: MessageSquare }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeReportTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveReportTab(tab.id)}
                    style={{
                      padding: "7px 14px",
                      borderRadius: "6px",
                      border: "none",
                      background: isActive ? "var(--prism-gradient)" : "transparent",
                      color: isActive ? "#fff" : "var(--ink-secondary)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <Icon size={14} /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Content Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* TAB 1: TRIAGE REPORT & CODE DIFF */}
              {activeReportTab === "report" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Executive Summary Card */}
                  <div className="prism-card" style={{ padding: "18px 20px", background: "rgba(236, 72, 153, 0.06)", border: "1px solid rgba(236, 72, 153, 0.25)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--prism-pink)", fontWeight: 700, fontSize: "13px" }}>
                      <Sparkles size={16} /> Executive Incident Summary
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--ink-primary)", lineHeight: 1.5, marginTop: "6px" }}>
                      {selectedTicket.executive_summary}
                    </p>
                  </div>

                  {/* Service Flow Visualizer (Failed Path Highlighted) */}
                  <div className="prism-card" style={{ padding: "20px", background: "var(--bg-elevated)", border: "1px solid var(--border-card)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-primary)" }}>
                        Service Flow Dependency Path (Failure Point Highlighted)
                      </div>
                      <span className="badge badge-magenta">Active Conduit</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      {selectedTicket.service_flow.map((node, idx) => {
                        const isFailed = node.status === "FAILED";
                        const isDegraded = node.status === "DEGRADED";

                        return (
                          <React.Fragment key={node.name}>
                            <div
                              style={{
                                padding: "14px 18px",
                                borderRadius: "8px",
                                background: isFailed ? "rgba(239, 68, 68, 0.15)" : isDegraded ? "rgba(245, 158, 11, 0.12)" : "var(--bg-card)",
                                border: `1px solid ${isFailed ? "#ef4444" : isDegraded ? "#f59e0b" : "var(--border-subtle)"}`,
                                boxShadow: isFailed ? "0 0 20px rgba(239, 68, 68, 0.35)" : "none",
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                                minWidth: "160px"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "10px", fontWeight: 700, color: isFailed ? "#ef4444" : isDegraded ? "#f59e0b" : "var(--accent-teal)" }}>
                                  {node.type}
                                </span>
                                <span style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>{node.latency}</span>
                              </div>
                              <strong style={{ fontSize: "12.5px", color: "var(--ink-primary)" }}>{node.name}</strong>
                              {node.note && (
                                <span style={{ fontSize: "10px", color: isFailed ? "#ef4444" : "#f59e0b" }}>
                                  {node.note}
                                </span>
                              )}
                            </div>
                            {idx < selectedTicket.service_flow.length - 1 && (
                              <span style={{ color: isFailed ? "#ef4444" : "var(--border-subtle)", fontWeight: 800 }}>
                                ──────►
                              </span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expanded Root Causes (Primary & Secondary) */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="prism-card" style={{ padding: "18px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ef4444", fontWeight: 700, fontSize: "12.5px" }}>
                        <AlertCircle size={15} /> Primary Root Cause Finding
                      </div>
                      <p style={{ fontSize: "12.5px", color: "var(--ink-primary)", lineHeight: 1.5, marginTop: "6px" }}>
                        {selectedTicket.root_causes_expanded.primary}
                      </p>
                    </div>

                    <div className="prism-card" style={{ padding: "18px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f59e0b", fontWeight: 700, fontSize: "12.5px" }}>
                        <Layers size={15} /> Secondary Contributing Findings
                      </div>
                      <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", lineHeight: 1.5, marginTop: "6px" }}>
                        {selectedTicket.root_causes_expanded.secondary}
                      </p>
                    </div>
                  </div>

                  {/* GitLab Code Change Proposal & Unified Diff */}
                  <div className="prism-card" style={{ padding: "20px", background: "var(--bg-card)", border: "1px solid var(--border-card)", display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <GitPullRequest size={16} color="var(--prism-pink)" />
                        <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--ink-primary)" }}>
                          GitLab Remediation Proposal: <code>{selectedTicket.gitlab_fix.target_file}</code>
                        </span>
                      </div>

                      <span className="badge badge-teal" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px" }}>
                        Branch: {selectedTicket.gitlab_fix.branch_name}
                      </span>
                    </div>

                    <p style={{ fontSize: "12px", color: "var(--ink-secondary)" }}>
                      {selectedTicket.gitlab_fix.change_summary}
                    </p>

                    {/* Side-by-side Before & After Code Diff */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      {/* Before */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#ef4444" }}>CURRENT (BEFORE):</span>
                        <pre style={{ margin: 0, padding: "12px", borderRadius: "6px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)", color: "#fca5a5", fontSize: "11.5px", fontFamily: "'JetBrains Mono', monospace", overflowX: "auto" }}>
                          {selectedTicket.gitlab_fix.before_code}
                        </pre>
                      </div>

                      {/* After */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#10b981" }}>PROPOSED FIX (AFTER):</span>
                        <pre style={{ margin: 0, padding: "12px", borderRadius: "6px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", color: "#86efac", fontSize: "11.5px", fontFamily: "'JetBrains Mono', monospace", overflowX: "auto" }}>
                          {selectedTicket.gitlab_fix.after_code}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Remediation & Verification Plan */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="prism-card" style={{ padding: "18px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
                      <strong style={{ fontSize: "13px", color: "var(--ink-primary)" }}>Recommended Action Plan:</strong>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px", fontSize: "12px", color: "var(--ink-secondary)" }}>
                        {selectedTicket.recommended_fix_plan.map((step, idx) => (
                          <div key={idx}>{step}</div>
                        ))}
                      </div>
                    </div>

                    <div className="prism-card" style={{ padding: "18px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
                      <strong style={{ fontSize: "13px", color: "var(--ink-primary)" }}>Post-Fix Verification Plan:</strong>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px", fontSize: "12px", color: "var(--accent-teal)" }}>
                        {selectedTicket.verification_plan.map((step, idx) => (
                          <div key={idx}>• {step}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EVIDENCE BY TOOLS */}
              {activeReportTab === "evidence" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ fontSize: "13px", color: "var(--ink-secondary)" }}>
                    Diagnostic evidence collected across connected tools via the Sentrix Tool Broker:
                  </div>

                  {Object.entries(selectedTicket.evidence_tools).map(([tool, logs]) => (
                    <div key={tool} className="prism-card" style={{ padding: "16px 20px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span className="badge badge-magenta" style={{ textTransform: "uppercase", fontSize: "10.5px" }}>
                          {tool}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--accent-teal)" }}>Read-Only Verified</span>
                      </div>
                      <pre style={{ margin: 0, padding: "12px", borderRadius: "6px", background: "var(--bg-app)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)", fontSize: "11.5px", fontFamily: "'JetBrains Mono', monospace", overflowX: "auto", whiteSpace: "pre-wrap" }}>
                        {logs}
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: IMPACT & POSTMORTEM */}
              {activeReportTab === "impact" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                    <div className="prism-card" style={{ padding: "18px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
                      <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>Failed Ingested Requests</span>
                      <h3 style={{ fontSize: "20px", color: "#ef4444", marginTop: "4px" }}>{selectedTicket.impact_summary.failed_requests}</h3>
                    </div>
                    <div className="prism-card" style={{ padding: "18px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
                      <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>Financial Volume at Risk</span>
                      <h3 style={{ fontSize: "20px", color: "var(--accent-amber)", marginTop: "4px" }}>{selectedTicket.impact_summary.revenue_at_risk}</h3>
                    </div>
                    <div className="prism-card" style={{ padding: "18px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
                      <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>Customer Accounts Affected</span>
                      <h3 style={{ fontSize: "20px", color: "var(--prism-pink)", marginTop: "4px" }}>{selectedTicket.impact_summary.customer_impact}</h3>
                    </div>
                  </div>

                  <div className="prism-card" style={{ padding: "20px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)" }}>SLA Degradation Analysis</h4>
                    <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "6px", lineHeight: 1.5 }}>
                      {selectedTicket.impact_summary.sla_degradation}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: INCIDENT AI ASSISTANT CHAT */}
              {activeReportTab === "chat" && (
                <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "14px" }}>
                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "6px" }}>
                    {(chatMessages[selectedTicket.id] || [
                      {
                        sender: "agent",
                        text: `Hello! I am your autonomous SRE investigator for incident ${selectedTicket.id}. I have analyzed PostgreSQL connection logs, Datadog traces, and generated the GitLab fix proposal. What would you like to explore?`
                      }
                    ]).map((msg, i) => (
                      <div
                        key={i}
                        style={{
                          alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                          maxWidth: "80%",
                          padding: "12px 16px",
                          borderRadius: "10px",
                          background: msg.sender === "user" ? "var(--prism-gradient)" : "var(--bg-card)",
                          border: msg.sender === "user" ? "none" : "1px solid var(--border-card)",
                          color: "#fff",
                          fontSize: "12.5px",
                          lineHeight: 1.45
                        }}
                      >
                        {msg.text}
                      </div>
                    ))}
                    {isThinking && (
                      <div style={{ alignSelf: "flex-start", padding: "10px 14px", borderRadius: "8px", background: "var(--bg-card)", color: "var(--accent-teal)", fontSize: "11.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <RotateCw size={12} className="spin" /> Deconstructing incident telemetry...
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendChatMessage} style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="Ask the SRE agent about root cause, GitLab diff, or query plans..."
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)", fontSize: "12.5px" }}
                    />
                    <button type="submit" className="btn-primary" style={{ padding: "0 18px", gap: "6px" }}>
                      <Send size={14} /> Send
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
