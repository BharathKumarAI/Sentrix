import React, { useState } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Shield,
  Lock,
  FileText,
  Copy,
  Check,
  RotateCw
} from "lucide-react";

export function AdminAuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedHash, setCopiedHash] = useState(null);

  const auditRecords = [
    {
      id: "audit_8f3b20c9",
      timestamp: "4m ago",
      actor: "Sarah K.",
      delegatedIdentity: "kbk@company.com",
      actionType: "WRITE_LOCK_RELEASE",
      target: "PostgreSQL (billing_db)::HikariCP_Pool",
      sha256: "8f3b20c9a28114f2e7b1a92bc7190...a92b",
      status: "VERIFIED",
      details: "Approved pool capacity expansion from 20 to 50 on billing-webhook-worker."
    },
    {
      id: "audit_3c91aa89",
      timestamp: "12m ago",
      actor: "David L.",
      delegatedIdentity: "sec-admin@company.com",
      actionType: "CONFIG_MUTATION",
      target: "Envoy Proxy ConfigMap::JWKS_TTL",
      sha256: "3c91aa8910482910fae8291047192...b109",
      status: "VERIFIED",
      details: "Hot-patched JWKS cache TTL to 3600s with stale-while-revalidate."
    },
    {
      id: "audit_5f829019",
      timestamp: "25m ago",
      actor: "Marcus T.",
      delegatedIdentity: "dba-lead@company.com",
      actionType: "PROCESS_TERMINATE",
      target: "PostgreSQL Primary::PID_10482",
      sha256: "5f8290192a7182901a88290184910...e991",
      status: "VERIFIED",
      details: "Terminated deadlocked session PID 10482 to restore transaction flow."
    },
    {
      id: "audit_91a82910",
      timestamp: "1h ago",
      actor: "Alex Chen",
      delegatedIdentity: "alex.c@company.com",
      actionType: "ROUTE_FAILOVER",
      target: "Notification Dispatcher::AWS_SES_POOL",
      sha256: "91a82910fa892019482910fa82910...a418",
      status: "VERIFIED",
      details: "Emergency rerouted transactional email queue from SendGrid to AWS SES."
    },
    {
      id: "audit_44a92019",
      timestamp: "2h ago",
      actor: "Elena R.",
      delegatedIdentity: "infra-sre@company.com",
      actionType: "CONFIG_MUTATION",
      target: "Redis Cluster::maxmemory-policy",
      sha256: "44a92019482910fa892019482910f...f011",
      status: "VERIFIED",
      details: "Updated ConfigMap policy from noeviction to allkeys-lru on Redis cache."
    }
  ];

  const filteredLogs = auditRecords.filter((log) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.actor.toLowerCase().includes(q) ||
        log.delegatedIdentity.toLowerCase().includes(q) ||
        log.actionType.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q)
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
            <ShieldCheck size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                PLATFORM ADMIN
              </span>
              <span className="badge badge-teal">Immutable SHA-256 Ledger</span>
              <span className="badge badge-magenta">SOC 2 / ISO 27001 Compliant</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Cryptographic Audit & Compliance Ledger
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Tamper-evident audit trail of all high-impact mutations, tool authorizations, and delegated identity releases.
            </p>
          </div>
        </div>

        <span className="badge badge-teal">5 Records Verified</span>
      </div>

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "6px 12px", width: "320px" }}>
        <Search size={14} color="var(--ink-tertiary)" />
        <input
          type="text"
          placeholder="Search actor, identity, target, or action..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ background: "transparent", border: "none", outline: "none", color: "var(--ink-primary)", fontSize: "12px", width: "100%" }}
        />
      </div>

      {/* Audit Table */}
      <div className="prism-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
          <thead>
            <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)", color: "var(--ink-secondary)", textAlign: "left" }}>
              <th style={{ padding: "12px 16px" }}>Timestamp</th>
              <th style={{ padding: "12px 16px" }}>Actor / Delegated Identity</th>
              <th style={{ padding: "12px 16px" }}>Action Type</th>
              <th style={{ padding: "12px 16px" }}>Target System</th>
              <th style={{ padding: "12px 16px" }}>SHA-256 Signature</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => {
              const isCopied = copiedHash === log.id;

              return (
                <tr key={log.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "12px 16px", color: "var(--ink-tertiary)", whiteSpace: "nowrap" }}>
                    {log.timestamp}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, color: "var(--ink-primary)" }}>{log.actor}</div>
                    <div style={{ fontSize: "11px", color: "var(--accent-teal)", fontFamily: "'JetBrains Mono', monospace" }}>
                      {log.delegatedIdentity}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className="badge badge-magenta">{log.actionType}</span>
                  </td>
                  <td style={{ padding: "12px 16px", maxWidth: "260px" }}>
                    <div style={{ color: "var(--ink-primary)", fontWeight: 500 }}>{log.target}</div>
                    <div style={{ fontSize: "11px", color: "var(--ink-secondary)", marginTop: "2px" }}>{log.details}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(log.sha256);
                        setCopiedHash(log.id);
                        setTimeout(() => setCopiedHash(null), 2000);
                      }}
                      className="btn-ghost"
                      style={{ fontSize: "11px", padding: "2px 6px", fontFamily: "'JetBrains Mono', monospace", color: "var(--accent-teal)" }}
                      title="Copy SHA-256 Signature"
                    >
                      {isCopied ? <Check size={12} /> : log.sha256.slice(0, 16)}...
                    </button>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className="badge badge-teal">
                      <CheckCircle2 size={11} /> {log.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
