import React, { useState } from "react";
import {
  Ticket,
  Search,
  Filter,
  AlertCircle,
  Clock,
  ExternalLink,
  CheckCircle2,
  Zap,
  Users,
  Shield,
  ArrowUpRight,
  TrendingUp
} from "lucide-react";
import { TicketDetailPanel } from "../components/TicketDetailPanel";

export function ProjectTicketsPage({ activeProject }) {
  const projectKey = activeProject?.project_key || "BILLING";
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [selectedTicket, setSelectedTicket] = useState(null);

  const tickets = [
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
      slaCountdown: "26m remaining",
      autoTriaged: true,
      triageSummary: "Root Cause: HikariCP connection pool exhausted on billing-db-primary due to unindexed batch lock in /v1/webhooks/charges.",
      suggestions: [
        "Increase HikariCP pool limit from 20 to 50 on billing-webhook-worker.",
        "Apply missing index on billing_transactions(account_id, settlement_status)."
      ],
      queries: [
        {
          id: "q1",
          type: "SQL",
          tool: "PostgreSQL Primary (billing_db)",
          query: "SELECT datname, count(*), state FROM pg_stat_activity WHERE datname = 'billing_ledger' GROUP BY datname, state;",
          description: "Inspect active vs idle connections in billing database pool"
        }
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
      slaCountdown: "48m remaining",
      autoTriaged: true,
      triageSummary: "Root Cause: JWKS certificate cache expiry policy caused simultaneous cache misses across 16 API gateway instances.",
      suggestions: [
        "Hot-patch JWKS cache TTL from 60s to 3600s with background refresh-ahead."
      ],
      queries: []
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
      slaCountdown: "5m remaining",
      autoTriaged: true,
      triageSummary: "Root Cause: Circular row-level lock sequence between order_items and inventory_reservation tables.",
      suggestions: [
        "Sort order item IDs deterministically before acquiring SELECT FOR UPDATE locks."
      ],
      queries: []
    },
    {
      id: "4",
      key: "NOTIF-501",
      title: "Email delivery queue backlog exceeding SLA threshold",
      description: "SendGrid SMTP relay returned 429 rate limit exceeded; customer transactional emails delayed.",
      status: "handoff",
      priority: "P2",
      confidence: 94,
      service: "Notification Dispatcher",
      assignedTeam: "Communications Team",
      suggestedFixTeam: "Communications Team",
      reporter: "Datadog Queue Monitor",
      time: "1h ago",
      slaCountdown: "SLA Met",
      autoTriaged: true,
      triageSummary: "Root Cause: SendGrid subaccount hourly quota reached due to password reset blast.",
      suggestions: [
        "Failover notification router to secondary AWS SES provider."
      ],
      queries: []
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
      slaCountdown: "Resolved",
      autoTriaged: true,
      triageSummary: "Root Cause: Redis maxmemory policy was set to noeviction instead of allkeys-lru.",
      suggestions: [
        "Verified: Updated maxmemory-policy to allkeys-lru on Redis ConfigMap."
      ],
      queries: []
    }
  ];

  const filteredTickets = tickets.filter((t) => {
    if (severityFilter !== "ALL" && t.priority !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.key.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.service.toLowerCase().includes(q)
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
      {/* Hero Header */}
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
            <Ticket size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                {projectKey} • OPERATIONS
              </span>
              <span className="badge badge-teal">Live Jira Two-Way Sync</span>
              <span className="badge badge-magenta">SLA Governed</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Incidents & Jira Ticket Desk
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Enterprise tracking for production outages, telemetry anomalies, auto-triaged root causes, and resolution SLAs.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="badge badge-rose">2 Critical P1 Unresolved</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "6px 12px", width: "320px" }}>
          <Search size={14} color="var(--ink-tertiary)" />
          <input
            type="text"
            placeholder="Search ticket key, summary, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", color: "var(--ink-primary)", fontSize: "12px", width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {["ALL", "P1", "P2", "P3"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              style={{
                padding: "4px 10px",
                fontSize: "11.5px",
                fontWeight: 600,
                borderRadius: "6px",
                border: severityFilter === sev ? "1px solid var(--prism-magenta)" : "1px solid var(--border-subtle)",
                background: severityFilter === sev ? "rgba(225, 29, 72, 0.12)" : "var(--bg-card)",
                color: severityFilter === sev ? "var(--prism-pink)" : "var(--ink-secondary)",
                cursor: "pointer"
              }}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets Table */}
      <div className="prism-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
          <thead>
            <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)", color: "var(--ink-secondary)", textAlign: "left" }}>
              <th style={{ padding: "12px 16px" }}>Ticket Key</th>
              <th style={{ padding: "12px 16px" }}>Summary</th>
              <th style={{ padding: "12px 16px" }}>Severity</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px" }}>SLA Timer</th>
              <th style={{ padding: "12px 16px" }}>Assigned Team</th>
              <th style={{ padding: "12px 16px" }}>Auto-Triage</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((ticket) => {
              const pColor = ticket.priority === "P1" ? "badge-rose" : ticket.priority === "P2" ? "badge-amber" : "badge-teal";

              return (
                <tr
                  key={ticket.id}
                  style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background 0.15s ease" }}
                  className="table-row-hover"
                >
                  <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--prism-pink)" }}>
                    {ticket.key}
                  </td>
                  <td style={{ padding: "12px 16px", maxWidth: "340px" }}>
                    <div style={{ fontWeight: 600, color: "var(--ink-primary)" }}>{ticket.title}</div>
                    <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "2px" }}>{ticket.service}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className={`badge ${pColor}`}>{ticket.priority}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className="badge badge-teal" style={{ textTransform: "capitalize" }}>{ticket.status}</span>
                  </td>
                  <td style={{ padding: "12px 16px", color: ticket.slaCountdown.includes("remaining") ? "var(--accent-amber)" : "var(--accent-teal)", fontWeight: 600 }}>
                    {ticket.slaCountdown}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--ink-secondary)" }}>
                    {ticket.assignedTeam}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {ticket.autoTriaged ? (
                      <span className="badge badge-magenta">
                        <Zap size={10} /> {ticket.confidence}% RCA
                      </span>
                    ) : (
                      <span style={{ color: "var(--ink-muted)" }}>Manual</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="btn-secondary"
                      style={{ padding: "4px 10px", fontSize: "11.5px", gap: "4px" }}
                    >
                      Inspect <ArrowUpRight size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Ticket Detail Drawer */}
      {selectedTicket && (
        <TicketDetailPanel
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}
