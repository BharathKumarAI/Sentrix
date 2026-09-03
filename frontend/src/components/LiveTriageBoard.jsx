import React, { useEffect, useState } from "react";
import { fetchBoardTickets } from "../api/client";

export function LiveTriageBoard({ activeProject, activeEnvironment }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    const load = async () => {
      const data = await fetchBoardTickets(activeProject?.project_key);
      setTickets(data);
    };
    load();
  }, [activeProject]);

  const columns = [
    { id: "incoming", title: "🔴 Incoming", badgeColor: "badge-rose" },
    { id: "auto", title: "⚡ Auto‑Triage", badgeColor: "badge-amber" },
    { id: "pending", title: "✅ Pending Handoff", badgeColor: "badge-teal" },
    { id: "handoff", title: "🔄 With Application Team", badgeColor: "badge-blue" },
    { id: "resolved", title: "✔️ Resolved", badgeColor: "badge-violet" },
  ];

  const ticketsByColumn = columns.reduce((acc, col) => {
    acc[col.id] = tickets.filter((t) => t.status === col.id);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-base)" }}>
      {/* Live activity feed */}
      <div style={{ position: "fixed", top: 0, width: "100%", padding: "8px 24px", background: "rgba(0,0,0,0.4)", color: "#fff", fontSize: "13px", backdropFilter: "blur(6px)" }}>
        <span className="badge badge-teal" style={{ marginRight: "8px" }}>Live</span>
        Auto‑triaged BILL‑1049 (96.4%) • Moved to App Team: Payments • Resolved AUTH‑2091
      </div>
      {/* Kanban board */}
      <div style={{ flex: 1, overflowX: "auto", paddingTop: "40px" }}>
        <div style={{ display: "flex", gap: "16px", padding: "0 24px" }}>
          {columns.map((col) => (
            <div key={col.id} style={{ flex: "0 0 260px", background: "var(--card-bg)", borderRadius: "12px", padding: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "var(--primary)" }}>
                {col.title} <span className={"badge " + col.badgeColor}> {ticketsByColumn[col.id].length} </span>
              </h3>
              <div style={{ marginTop: "12px" }}>
                {ticketsByColumn[col.id].map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    style={{
                      cursor: "pointer",
                      padding: "8px",
                      marginBottom: "8px",
                      background: "rgba(255,255,255,0.08)",
                      borderRadius: "8px",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "#fff" }}>{t.key}</div>
                    <div style={{ fontSize: "12px", color: "var(--ink-secondary)" }}>{t.title}</div>
                    <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--ink-tertiary)" }}>
                      {t.priority && <span className="badge badge-pink" style={{ marginRight: "4px" }}>{t.priority}</span>}
                      {t.confidence && <span className="badge badge-amber" style={{ marginRight: "4px" }}>{t.confidence}%</span>}
                      {t.assignedTeam && <span className="badge badge-teal">{t.assignedTeam}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Detail slide‑over placeholder */}
      {selectedTicket && (
        <div style={{ position: "fixed", right: 0, top: 0, width: "70%", height: "100%", background: "var(--bg-base)", borderLeft: "1px solid var(--border)" }}>
          <button onClick={() => setSelectedTicket(null)} style={{ position: "absolute", top: 10, left: 10 }}>Close</button>
          <pre style={{ padding: "20px", color: "#fff" }}>{JSON.stringify(selectedTicket, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

