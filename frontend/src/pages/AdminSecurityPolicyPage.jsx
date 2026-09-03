import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Zap,
  Power
} from "lucide-react";

export function AdminSecurityPolicyPage() {
  const [killSwitchActive, setKillSwitchActive] = useState(false);

  const policies = [
    {
      id: "pol-01",
      name: "Cryptographic Write-Lock Enforcement",
      status: "STRICT",
      badgeColor: "badge-teal",
      description: "Any mutation to production databases, Kubernetes pods, or Jira incident status requires an explicit HMAC SHA-256 signature from a human SRE."
    },
    {
      id: "pol-02",
      name: "Delegated Identity Attribution",
      status: "MANDATORY",
      badgeColor: "badge-teal",
      description: "All automated tool queries executed on third-party infrastructure (Datadog, Splunk, Jira) must bind the individual email of the authenticated SRE on-call."
    },
    {
      id: "pol-03",
      name: "Mutation Blast Radius Ceiling",
      status: "ACTIVE",
      badgeColor: "badge-magenta",
      description: "Automated remediation proposals cannot exceed: max 5 pods restarted concurrently, max 50 pool connection increase, and max 1 database session terminated per minute."
    },
    {
      id: "pol-04",
      name: "Air-Gapped Telemetry Scrubbing",
      status: "ACTIVE",
      badgeColor: "badge-teal",
      description: "Customer passwords, credit card PAN numbers, and JWT private keys are scrubbed by the Tool Broker regex pipeline prior to model tokenization."
    }
  ];

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
            <ShieldAlert size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                PLATFORM ADMIN
              </span>
              <span className="badge badge-teal">Zero Autonomous Writes</span>
              <span className="badge badge-magenta">Tool Broker Guardrails Active</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Security & Write-Lock Governance Policies
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Global platform guardrails preventing unintended automated write side-effects, data exfiltration, or unauthorized cluster mutations.
            </p>
          </div>
        </div>

        {/* Emergency Killswitch */}
        <button
          onClick={() => setKillSwitchActive(!killSwitchActive)}
          className={killSwitchActive ? "btn-danger" : "btn-secondary"}
          style={{
            borderColor: killSwitchActive ? "var(--accent-rose)" : "rgba(225, 29, 72, 0.4)",
            background: killSwitchActive ? "rgba(225, 29, 72, 0.25)" : "rgba(225, 29, 72, 0.08)",
            color: killSwitchActive ? "#fff" : "var(--accent-rose)",
            gap: "8px"
          }}
        >
          <Power size={14} />
          {killSwitchActive ? "EMERGENCY KILL-SWITCH ENGAGED" : "Engage Emergency Write Freeze"}
        </button>
      </div>

      {killSwitchActive && (
        <div style={{ padding: "14px 18px", borderRadius: "8px", background: "rgba(225, 29, 72, 0.15)", border: "1px solid var(--accent-rose)", color: "#fff", fontSize: "13px", display: "flex", alignItems: "center", gap: "12px" }}>
          <AlertTriangle size={18} color="var(--accent-rose)" />
          <span><strong>EMERGENCY WRITE FREEZE ACTIVE:</strong> All agent write permissions, database mutations, and pod restart proposals are completely locked. Read-only investigations remain available.</span>
        </div>
      )}

      {/* Policies List */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
        {policies.map((pol) => (
          <div
            key={pol.id}
            className="prism-card"
            style={{
              padding: "20px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>{pol.name}</h3>
              <span className={`badge ${pol.badgeColor}`}>{pol.status}</span>
            </div>

            <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", lineHeight: 1.5 }}>
              {pol.description}
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px", marginTop: "auto", fontSize: "11px", color: "var(--accent-teal)" }}>
              <CheckCircle2 size={13} /> Policy strictly enforced by Tool Broker
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
