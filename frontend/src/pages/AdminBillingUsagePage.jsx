import React from "react";
import {
  Sliders,
  TrendingUp,
  DollarSign,
  Cpu,
  Layers,
  Zap,
  CheckCircle2,
  Calendar
} from "lucide-react";

export function AdminBillingUsagePage() {
  const projectBreakdown = [
    { project: "BILLING (Payment Gateway)", spend: "$596.61", pct: 42, tokens: "18.2M", runs: "12,480", color: "var(--prism-pink)" },
    { project: "AUTH (Identity & SSO)", spend: "$397.74", pct: 28, tokens: "12.0M", runs: "8,400", color: "var(--accent-violet)" },
    { project: "INFRA (Core Kubernetes Grid)", spend: "$255.69", pct: 18, tokens: "7.8M", runs: "5,120", color: "var(--accent-teal)" },
    { project: "NOTIF (Customer Communications)", spend: "$113.64", pct: 8, tokens: "3.4M", runs: "2,200", color: "var(--accent-amber)" },
    { project: "FULFILLMENT (Inventory Locking)", spend: "$56.82", pct: 4, tokens: "1.4M", runs: "980", color: "var(--accent-blue)" },
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
            <Sliders size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                PLATFORM ADMIN
              </span>
              <span className="badge badge-teal">Enterprise Tier Active</span>
              <span className="badge badge-magenta">Monthly Budget Governed</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Platform Usage & Billing Telemetry
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Track LLM token consumption, inference compute charges, and departmental cost allocations across projects.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--ink-secondary)" }}>
          <Calendar size={14} /> Current Period: Sep 01 - Sep 30, 2026
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
        <div className="prism-card" style={{ padding: "16px 20px", background: "var(--bg-card)" }}>
          <div style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Current Spend</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--prism-pink)", marginTop: "4px" }}>$1,420.50</div>
          <div style={{ fontSize: "11.5px", color: "var(--accent-teal)", marginTop: "2px" }}>28.4% of $5,000 monthly cap</div>
        </div>

        <div className="prism-card" style={{ padding: "16px 20px", background: "var(--bg-card)" }}>
          <div style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Total Tokens Processed</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--ink-primary)", marginTop: "4px" }}>42.8M</div>
          <div style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "2px" }}>32.4M prompt • 10.4M completion</div>
        </div>

        <div className="prism-card" style={{ padding: "16px 20px", background: "var(--bg-card)" }}>
          <div style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Tool Broker Calls</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent-teal)", marginTop: "4px" }}>29,180</div>
          <div style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "2px" }}>Zero extra per-call cost</div>
        </div>

        <div className="prism-card" style={{ padding: "16px 20px", background: "var(--bg-card)" }}>
          <div style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Projected Month End</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent-violet)", marginTop: "4px" }}>$2,840.00</div>
          <div style={{ fontSize: "11.5px", color: "var(--accent-teal)", marginTop: "2px" }}>Well within annual allocation</div>
        </div>
      </div>

      {/* Breakdown by Project */}
      <div className="prism-card" style={{ padding: "20px", background: "var(--bg-card)", border: "1px solid var(--border-card)", display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
          Cost Allocation by Project Fleet
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {projectBreakdown.map((p) => (
            <div key={p.project} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12.5px" }}>
                <strong style={{ color: "var(--ink-primary)" }}>{p.project}</strong>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ color: "var(--ink-tertiary)" }}>{p.tokens} tokens • {p.runs} runs</span>
                  <strong style={{ color: p.color }}>{p.spend} ({p.pct}%)</strong>
                </div>
              </div>

              <div style={{ height: "6px", borderRadius: "999px", background: "var(--bg-input)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${p.pct}%`, background: p.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
