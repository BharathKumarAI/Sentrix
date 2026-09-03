import React, { useState } from "react";
import {
  Key,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Copy,
  Check,
  ShieldCheck,
  Eye,
  EyeOff,
  Trash2
} from "lucide-react";

export function AdminApiKeysPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [revealedKeyId, setRevealedKeyId] = useState(null);
  const [copiedKeyId, setCopiedKeyId] = useState(null);

  const [keys, setKeys] = useState([
    {
      id: "key-jira",
      name: "Atlassian Jira Enterprise Cloud Token",
      service: "Incident Management",
      masked: "jira_pat_9a82********************391f",
      rawKey: "jira_pat_9a82bc10499104fae8291047192391f",
      scope: "Global (All Projects)",
      vaultManaged: true,
      lastRotated: "12d ago",
      expiresIn: "78 days",
      status: "ACTIVE"
    },
    {
      id: "key-datadog",
      name: "Datadog Observability Ingest API Key",
      service: "Metrics & Logs",
      masked: "dd_api_key_4b77********************19a2",
      rawKey: "dd_api_key_4b771e129cf8019a12bc780a112df19a2",
      scope: "BILLING, AUTH, INFRA",
      vaultManaged: true,
      lastRotated: "5d ago",
      expiresIn: "85 days",
      status: "ACTIVE"
    },
    {
      id: "key-k8s",
      name: "Kubernetes Cluster Operator mTLS Key",
      service: "Container Orchestration",
      masked: "k8s_mtls_cert_1a89********************d082",
      rawKey: "k8s_mtls_cert_1a89bc33608ef912c01992df7891ad082",
      scope: "All Production EKS Nodes",
      vaultManaged: true,
      lastRotated: "2d ago",
      expiresIn: "28 days",
      status: "ACTIVE"
    },
    {
      id: "key-sendgrid",
      name: "SendGrid Production Relay API Secret",
      service: "Customer Communications",
      masked: "SG.91a82910********************fa82",
      rawKey: "SG.91a82910fa892019482910fa82910fa82",
      scope: "NOTIF, BILLING",
      vaultManaged: false,
      lastRotated: "85d ago",
      expiresIn: "5 days",
      status: "EXPIRING_SOON"
    }
  ]);

  const handleRotateKey = (id) => {
    setKeys((prev) =>
      prev.map((k) =>
        k.id === id ? { ...k, lastRotated: "Just now", expiresIn: "90 days", status: "ACTIVE" } : k
      )
    );
  };

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
            <Key size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                PLATFORM ADMIN
              </span>
              <span className="badge badge-teal">HashiCorp Vault Integrated</span>
              <span className="badge badge-magenta">Automatic 90-Day Rotation</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              API Keys & Service Credentials
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Manage third-party authentication tokens, delegated mTLS certificates, and service account keyrings.
            </p>
          </div>
        </div>
      </div>

      {/* Keys Table */}
      <div className="prism-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
          <thead>
            <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)", color: "var(--ink-secondary)", textAlign: "left" }}>
              <th style={{ padding: "12px 16px" }}>Credential Name</th>
              <th style={{ padding: "12px 16px" }}>Service</th>
              <th style={{ padding: "12px 16px" }}>Key Token</th>
              <th style={{ padding: "12px 16px" }}>Scope</th>
              <th style={{ padding: "12px 16px" }}>Expires In</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => {
              const isRevealed = revealedKeyId === k.id;
              const isCopied = copiedKeyId === k.id;

              return (
                <tr key={k.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, color: "var(--ink-primary)" }}>{k.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>Rotated {k.lastRotated}</div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--ink-secondary)" }}>{k.service}</td>
                  <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px" }}>
                    {isRevealed ? k.rawKey : k.masked}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--accent-teal)" }}>{k.scope}</td>
                  <td style={{ padding: "12px 16px", color: k.status === "EXPIRING_SOON" ? "var(--accent-amber)" : "var(--ink-secondary)", fontWeight: 600 }}>
                    {k.expiresIn}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className={`badge ${k.status === "ACTIVE" ? "badge-teal" : "badge-amber"}`}>
                      {k.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <button
                        onClick={() => setRevealedKeyId(isRevealed ? null : k.id)}
                        className="btn-ghost"
                        style={{ padding: "4px" }}
                        title={isRevealed ? "Hide Key" : "Reveal Key"}
                      >
                        {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(k.rawKey);
                          setCopiedKeyId(k.id);
                          setTimeout(() => setCopiedKeyId(null), 2000);
                        }}
                        className="btn-ghost"
                        style={{ padding: "4px" }}
                        title="Copy Key"
                      >
                        {isCopied ? <Check size={13} color="var(--accent-teal)" /> : <Copy size={13} />}
                      </button>

                      <button
                        onClick={() => handleRotateKey(k.id)}
                        className="btn-secondary"
                        style={{ padding: "4px 8px", fontSize: "11px", gap: "4px" }}
                        title="Rotate in Vault"
                      >
                        <RotateCw size={11} /> Rotate
                      </button>
                    </div>
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
