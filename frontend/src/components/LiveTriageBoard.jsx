import React, { useEffect, useState, useCallback } from "react";
import {
  Kanban,
  Zap,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCw,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Users,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Layers,
  Terminal,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Plus,
  MessageSquare,
  Paperclip,
  Database,
  FileText,
  Copy,
  Check,
  Share2,
  Eye,
  Tag
} from "lucide-react";
import { fetchBoardTickets, updateBoardTicket, fetchTeamActivity } from "../api/client";
import { TicketDetailPanel } from "./TicketDetailPanel.jsx";

export function LiveTriageBoard({ activeProject, activeEnvironment }) {
  const [tickets, setTickets] = useState([]);
  const [teamActivityList, setTeamActivityList] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" | "teamwise" | "comments_evidence"
  const [copiedEvidenceId, setCopiedEvidenceId] = useState(null);

  const projectKey = activeProject?.project_key || "BILLING";

  // Fallback initial tickets
  const defaultTickets = [
    {
      id: "1",
      key: "BILL-1049",
      title: "Payment gateway timeout on recurring charges",
      description: "Cascading 504 Gateway Timeouts observed on /v1/webhooks/charges during recurring subscription billing run.",
      status: "incoming",
      priority: "P1",
      confidence: 96,
      service: "Payment Ledger & Webhooks",
      assignedTeam: "Payments Core Team",
      suggestedFixTeam: "Payments Core Team",
      reporter: "PagerDuty / AlertManager",
      time: "4m ago",
      autoTriaged: true,
      triageSummary: "Root Cause: HikariCP connection pool exhausted on billing-db-primary due to unindexed batch lock in /v1/webhooks/charges.",
      suggestions: [
        "Increase HikariCP pool limit from 20 to 50 on billing-webhook-worker.",
        "Apply missing index on billing_transactions(account_id, settlement_status).",
        "Enable Circuit Breaker fallback on Stripe webhook retry consumer queue."
      ],
      okfReferences: [
        {"id": "OKF-RUN-402", "title": "HikariCP Connection Pool Starvation Runbook", "source": "Sentrix SRE Runbooks"},
        {"id": "OKF-ARCH-110", "title": "Stripe Webhook Idempotency & Batching Guidelines", "source": "Engineering Confluence"}
      ],
      queries: [
        {
          "id": "q1",
          "type": "SQL",
          "tool": "PostgreSQL Primary (billing_db)",
          "query": "SELECT datname, count(*), state FROM pg_stat_activity WHERE datname = 'billing_ledger' GROUP BY datname, state;",
          "description": "Inspect active vs idle connections in billing database pool"
        },
        {
          "id": "q2",
          "type": "LOGS",
          "tool": "Datadog Logs API",
          "query": "service:billing-webhook status:error \"PoolAcquireTimeoutException\" | stats count by host",
          "description": "Trace HikariCP pool acquisition timeouts across worker pods"
        },
        {
          "id": "q3",
          "type": "KUBERNETES",
          "tool": "Kubernetes Cluster Operator",
          "query": "kubectl get pods -n billing -l app=billing-webhook-worker -o wide",
          "description": "Verify container health, restarts, and memory utilization"
        }
      ],
      comments: [
        {
          "id": "c1",
          "author": "Sarah K.",
          "role": "Staff SRE",
          "team": "Payments Core Team",
          "avatar": "SK",
          "time": "6m ago",
          "text": "Tested pool scale to 50 on staging-billing-db. Zero 504 timeouts observed under 2,000 req/sec load test. Hot-patch PR #419 is ready for review."
        },
        {
          "id": "c2",
          "author": "Sentrix Agent",
          "role": "Autonomous Triage",
          "team": "AI SRE",
          "avatar": "AI",
          "time": "8m ago",
          "text": "Autonomous triage verified pool starvation pattern. Generated 3 diagnostic queries and correlated 1,420 gateway error events."
        }
      ],
      evidence: [
        {
          "id": "ev-101",
          "title": "HikariCP Connection Pool Saturation Telemetry",
          "source": "PostgreSQL Primary (billing_db)",
          "type": "METRIC_TRACE",
          "sha256": "8f3b20c9a28114f2e7b1a92bc7190",
          "time": "6m ago",
          "summary": "20/20 active connections saturated for >180s. 42 threads waiting in LockAcquire.",
          "payload": "PoolAcquireTimeoutException: Connection to PostgreSQL timed out after 30000ms.\nActive conns: 20/20\nThreads waiting: 42"
        },
        {
          "id": "ev-102",
          "title": "Stripe Webhook 504 Error Rate Surge",
          "source": "Datadog Logs API",
          "type": "LOG_BURST",
          "sha256": "4b771e129cf8019a12bc780a112df",
          "time": "8m ago",
          "summary": "1,420 504 Gateway Timeouts recorded on /v1/webhooks/charges over 5 minutes.",
          "payload": "service:billing-webhook status:504 count:1420 host:billing-worker-prod-02"
        }
      ],
      liveActivity: "⚡ AI Auto-triage generated 3 diagnostic queries • Ready for SRE review",
      teamActivity: [
        { time: "4m ago", user: "Sarah K. (Payments)", action: "Tested pool scale to 50 on staging; submitted PR #419" },
        { time: "6m ago", user: "Sentrix Agent", action: "Auto-triage completed with 96% confidence" }
      ]
    },
    {
      id: "2",
      key: "AUTH-2091",
      title: "Auth token signature verification latency spike",
      description: "Intermittent 401 Unauthorized errors on API gateway. JWKS signature key verification timing out.",
      status: "auto",
      priority: "P2",
      confidence: 88,
      service: "OAuth2 / IAM Edge",
      assignedTeam: "Identity & Security Team",
      suggestedFixTeam: "Identity & Security Team",
      reporter: "CloudWatch Latency Monitor",
      time: "12m ago",
      autoTriaged: true,
      triageSummary: "Root Cause: JWKS certificate cache expiry policy caused simultaneous cache misses across 16 API gateway instances.",
      suggestions: [
        "Hot-patch JWKS cache TTL from 60s to 3600s with background refresh-ahead.",
        "Pre-warm JWT public key keystore on Envoy edge proxy memory."
      ],
      okfReferences: [
        {"id": "OKF-SEC-109", "title": "JWKS Edge Caching & Thundering Herd Prevention", "source": "Security RFC"}
      ],
      queries: [
        {
          "id": "q1",
          "type": "LOGS",
          "tool": "Elasticsearch Central Logs",
          "query": "index=api_gateway \"JWKS fetch timeout\" | timechart count span=1m by cluster",
          "description": "Histogram of JWKS key retrieval timeouts on API edge"
        }
      ],
      comments: [
        {
          "id": "c1",
          "author": "David L.",
          "role": "Security Architect",
          "team": "Identity & Security Team",
          "avatar": "DL",
          "time": "10m ago",
          "text": "Confirmed JWKS endpoint was getting thundering herd hits every 60s. We are pushing a hotfix config to increase cache TTL to 1 hour with stale-while-revalidate."
        }
      ],
      evidence: [
        {
          "id": "ev-201",
          "title": "Envoy JWKS Fetch Thundering Herd Latency Trace",
          "source": "Elasticsearch Central Logs",
          "type": "TRACE",
          "sha256": "3c91aa8910482910fae8291047192",
          "time": "11m ago",
          "summary": "16 gateway instances made 480 parallel requests to internal JWKS keystore at expiry tick.",
          "payload": "GET http://auth-internal.identity.svc:8080/.well-known/jwks.json\nHTTP 504 Gateway Timeout"
        }
      ],
      liveActivity: "🔍 Analyzing JWKS keystore fetch telemetry across Envoy proxies",
      teamActivity: [
        { time: "10m ago", user: "David L. (Security)", action: "Confirmed thundering herd; staging 1h TTL hotfix" },
        { time: "12m ago", user: "Sentrix Agent", action: "Correlating JWT error spikes with Envoy edge logs" }
      ]
    },
    {
      id: "3",
      key: "DB-3030",
      title: "Deadlock in orders_allocation lock queue",
      description: "Lock wait timeout exceeded during high concurrency flash checkout run on order allocation tables.",
      status: "pending",
      priority: "P1",
      confidence: 92,
      service: "Inventory Fulfillment DB",
      assignedTeam: "Database Infrastructure Team",
      suggestedFixTeam: "Database Infrastructure Team",
      reporter: "SRE On-Call (Sarah K.)",
      time: "25m ago",
      autoTriaged: true,
      triageSummary: "Root Cause: Circular row-level lock sequence between order_items and inventory_reservation tables under concurrent checkout.",
      suggestions: [
        "Sort order item IDs deterministically before acquiring SELECT FOR UPDATE locks.",
        "Kill blocked session PID 10482 to restore transaction flow."
      ],
      okfReferences: [
        {"id": "OKF-DB-301", "title": "PostgreSQL Row-level Locking & Deadlock Resolution", "source": "Database Architecture"}
      ],
      queries: [
        {
          "id": "q1",
          "type": "SQL",
          "tool": "PostgreSQL Admin Console",
          "query": "SELECT blocked_locks.pid AS blocked_pid, blocking_locks.pid AS blocking_pid, blocked_activity.query AS blocked_statement FROM pg_catalog.pg_locks blocked_locks JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype WHERE NOT blocked_locks.granted;",
          "description": "Identify blocking and blocked database processes in PostgreSQL"
        }
      ],
      comments: [
        {
          "id": "c1",
          "author": "Marcus T.",
          "role": "Principal DBA",
          "team": "Database Infrastructure Team",
          "avatar": "MT",
          "time": "18m ago",
          "text": "Terminated rogue blocked session PID 10482 via `SELECT pg_terminate_backend(10482);`. Lock wait queue cleared immediately."
        }
      ],
      evidence: [
        {
          "id": "ev-301",
          "title": "PostgreSQL pg_locks Deadlock Dependency Graph",
          "source": "PostgreSQL Admin Console",
          "type": "LOCK_GRAPH",
          "sha256": "5f8290192a7182901a88290184910",
          "time": "22m ago",
          "summary": "Circular ExclusiveLock on relation orders between backend PID 10482 and PID 10512.",
          "payload": "Process 10482 waits for ExclusiveLock on orders; blocked by 10512."
        }
      ],
      liveActivity: "✅ Auto-triage complete • Pending SRE authorization to hand off to DB Team",
      teamActivity: [
        { time: "18m ago", user: "Marcus T. (DBA)", action: "Terminated blocking session PID 10482; queue normalized" },
        { time: "22m ago", user: "Sentrix Agent", action: "Identified circular lock dependency in order allocation" }
      ]
    },
    {
      id: "4",
      key: "NOTIF-501",
      title: "Email delivery queue backlog exceeding SLA threshold",
      description: "SendGrid SMTP relay returned 429 rate limit exceeded; customer transactional emails delayed by 45 minutes.",
      status: "handoff",
      priority: "P2",
      confidence: 94,
      service: "Notification Dispatcher",
      assignedTeam: "Communications Team",
      suggestedFixTeam: "Communications Team",
      reporter: "Datadog Queue Monitor",
      time: "1h ago",
      autoTriaged: true,
      triageSummary: "Root Cause: SendGrid subaccount hourly quota reached due to unthrottled password reset blast. Fallback AWS SES pool was not activated.",
      suggestions: [
        "Failover notification router to secondary AWS SES provider.",
        "Request quota elevation with SendGrid enterprise support."
      ],
      okfReferences: [
        {"id": "OKF-OPS-212", "title": "Multi-Vendor Email Relay Failover Procedure", "source": "Platform Ops Wiki"}
      ],
      queries: [
        {
          "id": "q1",
          "type": "SQL",
          "tool": "Redis Queue Inspector",
          "query": "LLEN queues:notifications:transactional_email",
          "description": "Check current backlog count in notification queue"
        }
      ],
      comments: [
        {
          "id": "c1",
          "author": "Alex Chen",
          "role": "Lead Engineer",
          "team": "Communications Team",
          "avatar": "AC",
          "time": "35m ago",
          "text": "Switched traffic to AWS SES fallback pool. Drain rate is currently 450 emails/sec. Backlog expected to clear in 12 minutes."
        }
      ],
      evidence: [
        {
          "id": "ev-401",
          "title": "SendGrid 429 Rate Limit HTTP Response",
          "source": "Datadog Queue Monitor",
          "type": "HTTP_ERR",
          "sha256": "91a82910fa892019482910fa82910",
          "time": "50m ago",
          "summary": "Hourly credit limit (100k/hr) reached. SendGrid rejected delivery with Retry-After: 3600.",
          "payload": "HTTP/1.1 429 Too Many Requests\n{\"errors\": [{\"message\": \"Maximum credits exceeded for billing tier\"}]}"
        }
      ],
      liveActivity: "🔄 Dispatched to Communications Team • Alex Chen currently addressing",
      teamActivity: [
        { time: "35m ago", user: "Alex Chen (Comms)", action: "Flipped notification router to AWS SES; queue draining" },
        { time: "45m ago", user: "Sentrix Agent", action: "Transferred ticket from Triage to Communications Team" }
      ]
    },
    {
      id: "5",
      key: "INFRA-880",
      title: "Redis cluster node failover completed",
      description: "Node redis-cluster-shard-02-b experienced OOM crash. Sentinel triggered failover to replica.",
      status: "resolved",
      priority: "P3",
      confidence: 99,
      service: "Session & Cache Grid",
      assignedTeam: "Core Infrastructure",
      suggestedFixTeam: "Core Infrastructure",
      reporter: "K8s OOM Watcher",
      time: "2h ago",
      autoTriaged: true,
      triageSummary: "Root Cause: Redis maxmemory policy was set to noeviction instead of allkeys-lru, causing process termination when RAM exceeded 16GB.",
      suggestions: [
        "Verified: Updated maxmemory-policy to allkeys-lru on Redis ConfigMap.",
        "Telemetry confirmed: Memory stabilized at 62% capacity."
      ],
      okfReferences: [
        {"id": "OKF-INF-104", "title": "Redis Memory Management & Eviction Policies", "source": "Sentrix Infra Runbooks"}
      ],
      queries: [
        {
          "id": "q1",
          "type": "CLI",
          "tool": "Redis CLI",
          "query": "redis-cli -h redis-cluster info memory | grep -E \"used_memory_human|maxmemory_policy\"",
          "description": "Verify Redis cluster memory usage and eviction policy"
        }
      ],
      comments: [
        {
          "id": "c1",
          "author": "Elena R.",
          "role": "Infra SRE",
          "team": "Core Infrastructure",
          "avatar": "ER",
          "time": "1h 15m ago",
          "text": "ConfigMap updated in Helm values. Sentinel promoted replica shard-02-a to primary without packet loss. Memory stabilized at 9.8GB / 16GB."
        }
      ],
      evidence: [
        {
          "id": "ev-501",
          "title": "Redis Sentinel Failover Event Log",
          "source": "K8s OOM Watcher",
          "type": "SYS_LOG",
          "sha256": "44a92019482910fa892019482910f",
          "time": "1h 50m ago",
          "summary": "+switch-master redis-cluster-shard-02 10.244.2.14 6379 10.244.3.18 6379.",
          "payload": "1842:X 03 Sep 2026 10:14:22.812 # +sdown master redis-cluster-shard-02 10.244.2.14 6379"
        }
      ],
      liveActivity: "✔️ Verified resolved • Cluster metrics healthy for 2 hours",
      teamActivity: [
        { time: "1h 15m ago", user: "Elena R. (Infra)", action: "Applied ConfigMap update with allkeys-lru policy" },
        { time: "1h 30m ago", user: "Sentrix Agent", action: "Telemetry verification passed (Zero errors for 60m)" }
      ]
    }
  ];

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchBoardTickets(projectKey);
      if (Array.isArray(data) && data.length > 0) {
        setTickets(data);
        if (selectedTicket) {
          const updated = data.find((t) => t.key === selectedTicket.key);
          if (updated) setSelectedTicket(updated);
        }
      } else {
        setTickets(defaultTickets);
      }

      // Also load team-wise activity
      const teamData = await fetchTeamActivity();
      if (Array.isArray(teamData)) {
        setTeamActivityList(teamData);
      }
    } catch (e) {
      console.error("Failed to load board tickets:", e);
      setTickets((prev) => (prev.length > 0 ? prev : defaultTickets));
    } finally {
      setIsLoading(false);
    }
  }, [projectKey, selectedTicket]);

  useEffect(() => {
    loadTickets();
  }, [projectKey]);

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadTickets();
    }, 12000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadTickets]);

  // Fast stage advance from card
  const handleQuickAdvance = async (e, ticket, targetStatus) => {
    e.stopPropagation();
    try {
      await updateBoardTicket(ticket.key, {
        status: targetStatus,
        assignedTeam: targetStatus === "handoff" ? (ticket.suggestedFixTeam || "Payments Core Team") : ticket.assignedTeam
      });
      loadTickets();
    } catch (err) {
      console.error("Failed to advance status", err);
      setTickets((prev) =>
        prev.map((t) =>
          t.key === ticket.key
            ? {
                ...t,
                status: targetStatus,
                assignedTeam: targetStatus === "handoff" ? (t.suggestedFixTeam || t.assignedTeam) : t.assignedTeam
              }
            : t
        )
      );
    }
  };

  // Define 5 Kanban Columns
  const columns = [
    {
      id: "incoming",
      title: "Triage Queue",
      badgeText: "Yet to Pick",
      icon: AlertCircle,
      accentColor: "var(--accent-rose)",
      badgeClass: "badge-rose",
      nextStage: "auto",
      nextLabel: "Start Triage"
    },
    {
      id: "auto",
      title: "In Auto-Triage",
      badgeText: "AI Active",
      icon: Zap,
      accentColor: "var(--accent-amber)",
      badgeClass: "badge-amber",
      nextStage: "pending",
      nextLabel: "Ready for Review"
    },
    {
      id: "pending",
      title: "Pending Review",
      badgeText: "RCA Ready",
      icon: Clock,
      accentColor: "var(--accent-teal)",
      badgeClass: "badge-teal",
      nextStage: "handoff",
      nextLabel: "Dispatch to Team"
    },
    {
      id: "handoff",
      title: "With Application Team",
      badgeText: "In Progress",
      icon: Users,
      accentColor: "var(--accent-blue)",
      badgeClass: "badge-blue",
      nextStage: "resolved",
      nextLabel: "Verify & Resolve"
    },
    {
      id: "resolved",
      title: "Resolved & Verified",
      badgeText: "Verified",
      icon: ShieldCheck,
      accentColor: "var(--accent-violet)",
      badgeClass: "badge-violet",
      nextStage: null,
      nextLabel: null
    }
  ];

  // Filtering
  const filteredTickets = tickets.filter((t) => {
    if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
    if (teamFilter !== "ALL") {
      const team = (t.assignedTeam || "").toLowerCase();
      if (!team.includes(teamFilter.toLowerCase())) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchKey = (t.key || "").toLowerCase().includes(q);
      const matchTitle = (t.title || "").toLowerCase().includes(q);
      const matchService = (t.service || "").toLowerCase().includes(q);
      const matchRCA = (t.triageSummary || "").toLowerCase().includes(q);
      if (!matchKey && !matchTitle && !matchService && !matchRCA) return false;
    }
    return true;
  });

  const ticketsByColumn = columns.reduce((acc, col) => {
    acc[col.id] = filteredTickets.filter((t) => t.status === col.id);
    return acc;
  }, {});

  // Aggregate all project comments across tickets for feed view
  const allComments = tickets.flatMap((t) =>
    (t.comments || []).map((c) => ({
      ...c,
      ticketKey: t.key,
      ticketTitle: t.title,
      ticketPriority: t.priority,
      service: t.service
    }))
  ).sort((a, b) => (b.id > a.id ? 1 : -1));

  // Aggregate all attached evidence across tickets
  const allEvidence = tickets.flatMap((t) =>
    (t.evidence || []).map((ev) => ({
      ...ev,
      ticketKey: t.key,
      ticketTitle: t.title,
      ticketPriority: t.priority
    }))
  );

  // Summary KPIs
  const totalActive = tickets.filter((t) => t.status !== "resolved").length;
  const p1Count = tickets.filter((t) => t.priority === "P1" && t.status !== "resolved").length;
  const autoTriagedCount = tickets.filter((t) => t.autoTriaged).length;
  const autoRate = tickets.length > 0 ? Math.round((autoTriagedCount / tickets.length) * 100) : 96;

  return (
    <div
      style={{
        padding: "24px 32px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        minHeight: "100%",
        boxSizing: "border-box"
      }}
    >
      {/* 1. Framework Hero Card */}
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
            <Kanban size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {projectKey} • OPERATIONS
              </span>
              <span className="badge badge-teal" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="radar-ping-dot" style={{ width: "6px", height: "6px" }} />
                Live Telemetry Active
              </span>
              <span className="badge badge-magenta">ADK 2.8 Autonomous Triage</span>
              <span className="badge badge-amber">Team Activity & Evidence Trace</span>
            </div>

            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Live Triage & Application Dispatch Board
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Real-time ticket lifecycle tracking, automated RCA synthesis, team comments, cryptographic evidence lockers, and team-wise dispatch.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="btn-secondary"
            style={{
              fontSize: "12px",
              padding: "6px 12px",
              gap: "6px",
              borderColor: autoRefresh ? "rgba(16, 185, 129, 0.4)" : "var(--border-subtle)",
              background: autoRefresh ? "rgba(16, 185, 129, 0.08)" : "var(--bg-card)"
            }}
            title="Toggle real-time telemetry polling"
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: autoRefresh ? "var(--accent-teal)" : "var(--ink-muted)"
              }}
            />
            {autoRefresh ? "Auto-Sync: 12s" : "Auto-Sync: Paused"}
          </button>

          <button
            onClick={loadTickets}
            disabled={isLoading}
            className="btn-secondary"
            style={{ fontSize: "12px", padding: "6px 12px", gap: "6px" }}
            title="Reload board tickets"
          >
            <RotateCw size={13} className={isLoading ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* 2. Operational Telemetry KPI Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px"
        }}
      >
        <div className="prism-card" style={{ padding: "14px 18px", background: "var(--bg-card)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Active Incidents</span>
            <AlertCircle size={15} color="var(--accent-rose)" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "6px" }}>
            <span style={{ fontSize: "22px", fontWeight: 800, color: "var(--ink-primary)" }}>{totalActive}</span>
            <span className="badge badge-rose" style={{ fontSize: "10px" }}>{p1Count} Critical P1</span>
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "4px" }}>Across billing & core services</div>
        </div>

        <div className="prism-card" style={{ padding: "14px 18px", background: "var(--bg-card)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Auto-Triage Rate</span>
            <Zap size={15} color="var(--prism-pink)" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "6px" }}>
            <span style={{ fontSize: "22px", fontWeight: 800, color: "var(--prism-pink)" }}>{autoRate}%</span>
            <span style={{ fontSize: "11px", color: "var(--accent-teal)", fontWeight: 600 }}>↑ 4.2% vs human</span>
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "4px" }}>Autonomous RCA generated</div>
        </div>

        <div className="prism-card" style={{ padding: "14px 18px", background: "var(--bg-card)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Team Discussions</span>
            <MessageSquare size={15} color="var(--prism-pink)" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "6px" }}>
            <span style={{ fontSize: "22px", fontWeight: 800, color: "var(--ink-primary)" }}>{allComments.length}</span>
            <span className="badge badge-teal" style={{ fontSize: "10px" }}>Active Notes</span>
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "4px" }}>Across all incident squads</div>
        </div>

        <div className="prism-card" style={{ padding: "14px 18px", background: "var(--bg-card)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Verified Evidence</span>
            <ShieldCheck size={15} color="var(--accent-teal)" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "6px" }}>
            <span style={{ fontSize: "22px", fontWeight: 800, color: "var(--accent-teal)" }}>{allEvidence.length}</span>
            <span className="badge badge-magenta" style={{ fontSize: "10px" }}>SHA-256 Locked</span>
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "4px" }}>Logs, traces, DB lock graphs</div>
        </div>

        <div className="prism-card" style={{ padding: "14px 18px", background: "var(--bg-card)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Mean Time to Triage</span>
            <TrendingUp size={15} color="var(--accent-teal)" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "6px" }}>
            <span style={{ fontSize: "22px", fontWeight: 800, color: "var(--accent-teal)" }}>38s</span>
            <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>vs 42m manual</span>
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "4px" }}>Log correlation & query generation</div>
        </div>
      </div>

      {/* 3. Live Dispatch Activity Stream Banner */}
      <div
        className="prism-card"
        style={{
          padding: "10px 16px",
          background: "linear-gradient(90deg, rgba(225, 29, 72, 0.08) 0%, rgba(16, 185, 129, 0.06) 100%)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "12.5px"
        }}
      >
        <span className="badge badge-teal" style={{ gap: "6px", textTransform: "uppercase", fontSize: "10.5px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-teal)" }} />
          Live Event Stream
        </span>
        <div style={{ color: "var(--ink-secondary)", display: "flex", alignItems: "center", gap: "16px", overflowX: "hidden", whiteSpace: "nowrap" }}>
          <span>💬 Sarah K. commented on <strong>BILL-1049</strong>: <em>"Testing pool scale to 50 on staging"</em></span>
          <span style={{ color: "var(--ink-muted)" }}>•</span>
          <span>🔒 Attached Evidence: <strong>HikariCP Pool Saturation</strong> (20/20 active conns)</span>
          <span style={{ color: "var(--ink-muted)" }}>•</span>
          <span>💬 Marcus T. commented on <strong>DB-3030</strong>: <em>"Terminated blocking session PID 10482"</em></span>
          <span style={{ color: "var(--ink-muted)" }}>•</span>
          <span>🔄 Alex Chen accepted handoff for <strong>NOTIF-501</strong> (AWS SES router activated)</span>
        </div>
      </div>

      {/* 4. Primary View Mode Switcher + Filters Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          paddingBottom: "4px"
        }}
      >
        {/* View Switcher Pills */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "8px",
            padding: "3px"
          }}
        >
          <button
            onClick={() => setViewMode("kanban")}
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "6px",
              border: "none",
              background: viewMode === "kanban" ? "var(--prism-gradient)" : "transparent",
              color: viewMode === "kanban" ? "#fff" : "var(--ink-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease"
            }}
          >
            <Kanban size={13} />
            Kanban Stages ({tickets.length})
          </button>

          <button
            onClick={() => setViewMode("teamwise")}
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "6px",
              border: "none",
              background: viewMode === "teamwise" ? "var(--prism-gradient)" : "transparent",
              color: viewMode === "teamwise" ? "#fff" : "var(--ink-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease"
            }}
          >
            <Users size={13} />
            Team-Wise Activity & Dispatch (5 Teams)
          </button>

          <button
            onClick={() => setViewMode("comments_evidence")}
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "6px",
              border: "none",
              background: viewMode === "comments_evidence" ? "var(--prism-gradient)" : "transparent",
              color: viewMode === "comments_evidence" ? "#fff" : "var(--ink-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease"
            }}
          >
            <MessageSquare size={13} />
            Team Comments & Evidence ({allComments.length + allEvidence.length})
          </button>
        </div>

        {/* Search & Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "5px 10px",
              width: "240px"
            }}
          >
            <Search size={13} color="var(--ink-tertiary)" />
            <input
              type="text"
              placeholder="Search key, notes, evidence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--ink-primary)",
                fontSize: "12px",
                width: "100%"
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ background: "transparent", border: "none", color: "var(--ink-muted)", cursor: "pointer" }}
              >
                ×
              </button>
            )}
          </div>

          {/* Priority Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {["ALL", "P1", "P2", "P3"].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: priorityFilter === p ? "1px solid var(--prism-magenta)" : "1px solid var(--border-subtle)",
                  background: priorityFilter === p ? "rgba(225, 29, 72, 0.12)" : "var(--bg-card)",
                  color: priorityFilter === p ? "var(--prism-pink)" : "var(--ink-secondary)",
                  cursor: "pointer"
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Team Dropdown */}
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            style={{
              padding: "4px 10px",
              fontSize: "11.5px",
              borderRadius: "6px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              color: "var(--ink-primary)",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="ALL">All Teams</option>
            <option value="Payments">Payments Core</option>
            <option value="Identity">Identity & Security</option>
            <option value="Database">Database Infra</option>
            <option value="Communications">Communications</option>
            <option value="Infrastructure">Core Infra</option>
          </select>
        </div>
      </div>

      {/* =========================================================
          VIEW 1: KANBAN STAGES BOARD
          ========================================================= */}
      {viewMode === "kanban" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(280px, 1fr))",
            gap: "16px",
            alignItems: "start",
            overflowX: "auto",
            paddingBottom: "16px"
          }}
        >
          {columns.map((col) => {
            const colTickets = ticketsByColumn[col.id] || [];
            const ColIcon = col.icon;

            return (
              <div
                key={col.id}
                className="prism-card"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: "480px"
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid var(--border-subtle)",
                    borderTop: `3px solid ${col.accentColor}`,
                    borderRadius: "12px 12px 0 0",
                    background: "var(--bg-elevated)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <ColIcon size={16} color={col.accentColor} />
                      <h3 style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--ink-primary)" }}>
                        {col.title}
                      </h3>
                    </div>

                    <span className={`badge ${col.badgeClass}`} style={{ fontSize: "11px", fontWeight: 700 }}>
                      {colTickets.length}
                    </span>
                  </div>

                  <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                    {col.badgeText}
                  </div>
                </div>

                {/* Tickets Container */}
                <div
                  style={{
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    flex: 1
                  }}
                >
                  {colTickets.length === 0 ? (
                    <div
                      style={{
                        padding: "36px 16px",
                        textAlign: "center",
                        color: "var(--ink-muted)",
                        fontSize: "12px",
                        border: "1px dashed var(--border-subtle)",
                        borderRadius: "8px",
                        marginTop: "8px"
                      }}
                    >
                      No tickets in this bucket.
                    </div>
                  ) : (
                    colTickets.map((ticket) => {
                      const isP1 = ticket.priority === "P1";
                      const isP2 = ticket.priority === "P2";
                      const pColor = isP1 ? "badge-rose" : isP2 ? "badge-amber" : "badge-teal";
                      const isSelected = selectedTicket?.key === ticket.key;
                      const commentCount = ticket.comments?.length || 0;
                      const evidenceCount = ticket.evidence?.length || 0;

                      return (
                        <div
                          key={ticket.id || ticket.key}
                          onClick={() => setSelectedTicket(ticket)}
                          className="prism-card"
                          style={{
                            padding: "14px",
                            background: isSelected ? "var(--bg-card-hover)" : "var(--bg-elevated)",
                            border: isSelected ? "1px solid var(--prism-magenta)" : "1px solid var(--border-card)",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            position: "relative",
                            transition: "all 0.18s ease"
                          }}
                        >
                          {/* Key & Priority Row */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span
                              style={{
                                fontSize: "12.5px",
                                fontWeight: 800,
                                fontFamily: "'JetBrains Mono', monospace",
                                color: "var(--prism-pink)"
                              }}
                            >
                              {ticket.key}
                            </span>

                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span className={`badge ${pColor}`}>{ticket.priority || "P1"}</span>
                              {ticket.confidence && (
                                <span className="badge badge-amber" title="AI Confidence Score">
                                  <Zap size={10} /> {ticket.confidence}%
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Title */}
                          <div>
                            <h4
                              style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "var(--ink-primary)",
                                lineHeight: 1.4
                              }}
                            >
                              {ticket.title}
                            </h4>
                            <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "3px" }}>
                              {ticket.service || "Core Service"}
                            </div>
                          </div>

                          {/* Team Assignment & Comparison */}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                              padding: "6px 8px",
                              borderRadius: "6px",
                              background: "var(--bg-input)",
                              fontSize: "11px"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span style={{ color: "var(--ink-tertiary)" }}>Assigned:</span>
                              <span style={{ fontWeight: 600, color: "var(--ink-secondary)" }}>
                                {ticket.assignedTeam || "Triage Team"}
                              </span>
                            </div>

                            {ticket.suggestedFixTeam && ticket.suggestedFixTeam !== ticket.assignedTeam && (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--accent-teal)" }}>
                                <span>Suggested Team:</span>
                                <span style={{ fontWeight: 700 }}>{ticket.suggestedFixTeam}</span>
                              </div>
                            )}
                          </div>

                          {/* Badges for Comments & Evidence */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "var(--ink-tertiary)" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <MessageSquare size={12} color="var(--prism-pink)" />
                              {commentCount} {commentCount === 1 ? "comment" : "comments"}
                            </span>
                            <span>•</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <ShieldCheck size={12} color="var(--accent-teal)" />
                              {evidenceCount} evidence
                            </span>
                          </div>

                          {/* Card Footer */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              borderTop: "1px solid var(--border-subtle)",
                              paddingTop: "8px",
                              fontSize: "11px",
                              color: "var(--ink-tertiary)"
                            }}
                          >
                            <span>{ticket.time || "Active"}</span>

                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {col.nextStage && (
                                <button
                                  onClick={(e) => handleQuickAdvance(e, ticket, col.nextStage)}
                                  className="btn-ghost"
                                  style={{ padding: "3px 6px", fontSize: "11px", color: "var(--accent-teal)" }}
                                  title={col.nextLabel}
                                >
                                  {col.nextLabel} <ChevronRight size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================
          VIEW 2: TEAM-WISE ACTIVITY & DISPATCH MATRIX
          ========================================================= */}
      {viewMode === "teamwise" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink-primary)" }}>
                Application Engineering Team Dispatch Matrix
              </h2>
              <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "2px" }}>
                Real-time visibility into each team's active incident queue, member discussions, and verified telemetry evidence.
              </p>
            </div>
            <span className="badge badge-teal">5 Engineering Squads Active</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "18px" }}>
            {[
              {
                name: "Payments Core Team",
                lead: "Sarah K. (Staff SRE)",
                status: "INVESTIGATING",
                badgeClass: "badge-rose",
                icon: Zap,
                accent: "var(--prism-pink)",
                desc: "Responsible for Stripe webhooks, billing ledger, recurring charge pipelines."
              },
              {
                name: "Identity & Security Team",
                lead: "David L. (Security Architect)",
                status: "AUTO_TRIAGING",
                badgeClass: "badge-amber",
                icon: ShieldAlert,
                accent: "var(--accent-amber)",
                desc: "Manages OAuth2 edge proxies, JWKS keystores, and IAM token validation."
              },
              {
                name: "Database Infrastructure Team",
                lead: "Marcus T. (Principal DBA)",
                status: "REVIEWING_FIX",
                badgeClass: "badge-teal",
                icon: Database,
                accent: "var(--accent-teal)",
                desc: "PostgreSQL clusters, read-replicas, locking contention, and connection pool sizing."
              },
              {
                name: "Communications Team",
                lead: "Alex Chen (Lead Engineer)",
                status: "HANDOFF_ACCEPTED",
                badgeClass: "badge-blue",
                icon: Users,
                accent: "var(--accent-blue)",
                desc: "SendGrid SMTP relays, AWS SES fallback queues, and transactional notifications."
              },
              {
                name: "Core Infrastructure",
                lead: "Elena R. (Infra SRE)",
                status: "VERIFIED_HEALTHY",
                badgeClass: "badge-violet",
                icon: Cpu,
                accent: "var(--accent-violet)",
                desc: "Kubernetes worker nodes, Redis session caching grids, Envoy edge proxies."
              }
            ].map((team) => {
              // Tickets owned by this team
              const teamTickets = tickets.filter((t) =>
                (t.assignedTeam || "").toLowerCase().includes(team.name.toLowerCase().split(" ")[0])
              );
              // Comments from this team
              const teamComments = allComments.filter((c) =>
                (c.team || "").toLowerCase().includes(team.name.toLowerCase().split(" ")[0])
              );
              // Evidence from this team's tickets
              const teamEvidence = allEvidence.filter((ev) =>
                teamTickets.some((t) => t.key === ev.ticketKey)
              );
              const TeamIcon = team.icon;

              return (
                <div
                  key={team.name}
                  className="prism-card"
                  style={{
                    padding: "20px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-card)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px"
                  }}
                >
                  {/* Team Card Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: "var(--bg-elevated)",
                          border: `1px solid ${team.accent}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: team.accent
                        }}
                      >
                        <TeamIcon size={18} />
                      </div>

                      <div>
                        <h3 style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--ink-primary)" }}>
                          {team.name}
                        </h3>
                        <div style={{ fontSize: "11.5px", color: "var(--ink-tertiary)" }}>
                          On-Call: <strong>{team.lead}</strong>
                        </div>
                      </div>
                    </div>

                    <span className={`badge ${team.badgeClass}`}>{team.status}</span>
                  </div>

                  <p style={{ fontSize: "12px", color: "var(--ink-secondary)", lineHeight: 1.5 }}>
                    {team.desc}
                  </p>

                  {/* Active Incidents Count */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "8px",
                      padding: "10px",
                      borderRadius: "8px",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      textAlign: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>Assigned</div>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "2px" }}>
                        {teamTickets.length}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>Team Notes</div>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--prism-pink)", marginTop: "2px" }}>
                        {teamComments.length}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>Evidence Locked</div>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--accent-teal)", marginTop: "2px" }}>
                        {teamEvidence.length}
                      </div>
                    </div>
                  </div>

                  {/* Active Incident Tickets Chips */}
                  {teamTickets.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--ink-tertiary)" }}>
                        Current Incident Assignments:
                      </span>
                      {teamTickets.map((t) => (
                        <div
                          key={t.key}
                          onClick={() => setSelectedTicket(t)}
                          style={{
                            padding: "8px 10px",
                            borderRadius: "6px",
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border-subtle)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "12px"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--prism-pink)" }}>
                              {t.key}
                            </span>
                            <span style={{ color: "var(--ink-primary)", fontWeight: 500 }}>{t.title.slice(0, 32)}...</span>
                          </div>
                          <span className={`badge ${t.priority === "P1" ? "badge-rose" : "badge-amber"}`} style={{ fontSize: "10px" }}>
                            {t.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recent Member Comments */}
                  {teamComments.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--ink-tertiary)" }}>
                        Latest Team Comment:
                      </span>
                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: "6px",
                          background: "rgba(0, 0, 0, 0.2)",
                          border: "1px solid var(--border-subtle)",
                          fontSize: "12px"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                          <strong style={{ color: "var(--ink-primary)" }}>{teamComments[0].author}</strong>
                          <span style={{ fontSize: "10.5px", color: "var(--ink-muted)" }}>{teamComments[0].time}</span>
                        </div>
                        <p style={{ color: "var(--ink-secondary)", lineHeight: 1.45, fontSize: "11.5px" }}>
                          "{teamComments[0].text}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================
          VIEW 3: PROJECT TEAM COMMENTS & EVIDENCE REPOSITORY
          ========================================================= */}
      {viewMode === "comments_evidence" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
          {/* Left Column: Team Comments Stream */}
          <div
            className="prism-card"
            style={{
              padding: "20px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MessageSquare size={16} color="var(--prism-pink)" />
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
                  Project Team Discussion Stream
                </h3>
              </div>
              <span className="badge badge-teal">{allComments.length} Total</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {allComments.map((c, idx) => (
                <div
                  key={c.id || idx}
                  style={{
                    padding: "14px",
                    borderRadius: "8px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: c.author?.includes("Sentrix") ? "var(--prism-gradient)" : "rgba(59, 130, 246, 0.2)",
                          color: c.author?.includes("Sentrix") ? "#fff" : "var(--accent-blue)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          fontWeight: 700
                        }}
                      >
                        {c.avatar || c.author?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <strong style={{ fontSize: "12.5px", color: "var(--ink-primary)" }}>{c.author}</strong>
                          <span className="badge badge-teal" style={{ fontSize: "10px" }}>{c.team}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        onClick={() => {
                          const t = tickets.find((tk) => tk.key === c.ticketKey);
                          if (t) setSelectedTicket(t);
                        }}
                        className="btn-ghost"
                        style={{ fontSize: "11px", gap: "4px", padding: "2px 6px" }}
                        title="Open incident ticket"
                      >
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--prism-pink)" }}>
                          {c.ticketKey}
                        </span>
                        <ArrowUpRight size={12} />
                      </button>
                      <span style={{ fontSize: "11px", color: "var(--ink-muted)" }}>{c.time}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", lineHeight: 1.5, paddingLeft: "36px" }}>
                    {c.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Evidence Locker */}
          <div
            className="prism-card"
            style={{
              padding: "20px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={16} color="var(--accent-teal)" />
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
                  Verified Telemetry Evidence Locker
                </h3>
              </div>
              <span className="badge badge-magenta">{allEvidence.length} SHA-256 Verified</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {allEvidence.map((ev) => {
                const isCopied = copiedEvidenceId === ev.id;

                return (
                  <div
                    key={ev.id}
                    style={{
                      padding: "14px",
                      borderRadius: "8px",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span className="badge badge-teal">{ev.type}</span>
                        <strong style={{ fontSize: "13px", color: "var(--ink-primary)" }}>{ev.title}</strong>
                      </div>

                      <button
                        onClick={() => {
                          const t = tickets.find((tk) => tk.key === ev.ticketKey);
                          if (t) setSelectedTicket(t);
                        }}
                        className="btn-ghost"
                        style={{ fontSize: "11px", gap: "4px", padding: "2px 6px" }}
                        title="View in workbench"
                      >
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--prism-pink)" }}>
                          {ev.ticketKey}
                        </span>
                        <ArrowUpRight size={12} />
                      </button>
                    </div>

                    <p style={{ fontSize: "12px", color: "var(--ink-secondary)", lineHeight: 1.45 }}>
                      {ev.summary}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: "8px", fontSize: "11px" }}>
                      <span style={{ color: "var(--ink-tertiary)" }}>Source: <strong>{ev.source}</strong></span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--accent-teal)" }}>
                        {ev.sha256?.slice(0, 14)}...
                      </span>
                    </div>

                    {ev.payload && (
                      <pre
                        style={{
                          padding: "8px 10px",
                          borderRadius: "6px",
                          background: "rgba(0, 0, 0, 0.35)",
                          color: "var(--ink-secondary)",
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "11px",
                          lineHeight: 1.4,
                          whiteSpace: "pre-wrap",
                          maxHeight: "120px",
                          overflowY: "auto"
                        }}
                      >
                        {ev.payload}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. Rich Interactive Ticket Detail & Query Workbench */}
      {selectedTicket && (
        <TicketDetailPanel
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onTicketUpdated={loadTickets}
        />
      )}
    </div>
  );
}
