import React, { useState } from "react";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  ShieldCheck,
  Shield,
  UserCheck,
  Lock,
  ArrowRight
} from "lucide-react";

export function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const users = [
    {
      id: "usr-1",
      name: "KBK (Platform Owner)",
      email: "kbk@company.com",
      role: "Platform Admin",
      delegatedWrite: true,
      projects: ["BILLING", "AUTH", "INFRA", "FULFILLMENT", "NOTIF"],
      status: "ACTIVE",
      lastActive: "Just now"
    },
    {
      id: "usr-2",
      name: "Sarah K.",
      email: "sarah.k@company.com",
      role: "Staff SRE",
      delegatedWrite: true,
      projects: ["BILLING", "PAYMENTS"],
      status: "ACTIVE",
      lastActive: "4m ago"
    },
    {
      id: "usr-3",
      name: "David L.",
      email: "david.l@company.com",
      role: "Security Architect",
      delegatedWrite: true,
      projects: ["AUTH", "IDENTITY"],
      status: "ACTIVE",
      lastActive: "12m ago"
    },
    {
      id: "usr-4",
      name: "Marcus T.",
      email: "marcus.t@company.com",
      role: "Principal DBA",
      delegatedWrite: true,
      projects: ["BILLING", "DATA", "INFRA"],
      status: "ACTIVE",
      lastActive: "25m ago"
    },
    {
      id: "usr-5",
      name: "Alex Chen",
      email: "alex.c@company.com",
      role: "Lead Engineer",
      delegatedWrite: false,
      projects: ["NOTIF"],
      status: "ACTIVE",
      lastActive: "1h ago"
    }
  ];

  const filteredUsers = users.filter((u) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
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
            <Users size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                PLATFORM ADMIN
              </span>
              <span className="badge badge-teal">Entra ID / Okta OIDC Active</span>
              <span className="badge badge-magenta">Delegated Identity Governed</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Users, Roles & RBAC Governance
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Manage platform administrators, on-call investigators, and delegated cryptographic write-lock authorization rights.
            </p>
          </div>
        </div>

        <span className="badge badge-teal">5 Active SREs</span>
      </div>

      {/* Users Table */}
      <div className="prism-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
          <thead>
            <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)", color: "var(--ink-secondary)", textAlign: "left" }}>
              <th style={{ padding: "12px 16px" }}>User & Identity</th>
              <th style={{ padding: "12px 16px" }}>Role</th>
              <th style={{ padding: "12px 16px" }}>Write Lock Rights</th>
              <th style={{ padding: "12px 16px" }}>Assigned Projects</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px" }}>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontWeight: 600, color: "var(--ink-primary)" }}>{u.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>{u.email}</div>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span className="badge badge-teal">{u.role}</span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {u.delegatedWrite ? (
                    <span className="badge badge-magenta" style={{ gap: "4px" }}>
                      <ShieldCheck size={11} /> Authorized Writer
                    </span>
                  ) : (
                    <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>Read-Only Observer</span>
                  )}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {u.projects.map((p) => (
                      <span key={p} style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "4px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--prism-pink)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span className="badge badge-teal">{u.status}</span>
                </td>
                <td style={{ padding: "12px 16px", color: "var(--ink-tertiary)" }}>
                  {u.lastActive}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
