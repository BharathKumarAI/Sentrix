import React, { useState, useEffect } from "react";
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
  TrendingUp,
  RotateCw
} from "lucide-react";
import { TicketDetailPanel } from "../components/TicketDetailPanel";
import { fetchBoardTickets } from "../api/client";

export function ProjectTicketsPage({ activeProject }) {
  const projectKey = activeProject?.project_key || "";
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchBoardTickets(projectKey)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setTickets(data);
        else if (data && !data.error) setTickets(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.warn("Failed to load tickets:", err))
      .finally(() => setIsLoading(false));
  }, [projectKey]);



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
                  <td style={{ padding: "12px 16px", color: (ticket.slaCountdown || "").includes("remaining") ? "var(--accent-amber)" : "var(--accent-teal)", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={12} />
                      <span>{ticket.slaCountdown || (ticket.slaTarget ? `${ticket.slaTarget} target` : "Active")}</span>
                    </div>
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
