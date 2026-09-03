import React, { useState } from "react";
import {
  FileText,
  Calendar,
  Download,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Layers,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  ArrowUpRight,
  Printer,
  Mail,
  Send,
  X,
  RotateCw,
  Users,
  Activity,
  BarChart2
} from "lucide-react";

export function ProjectReportsPage({ activeProject }) {
  const projectKey = activeProject?.project_key || "BILLING";
  const [cadence, setCadence] = useState("weekly"); // "daily" | "weekly" | "biweekly" | "monthly"
  const [isCopied, setIsCopied] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState("cto@company.com, vp-eng@company.com, sre-lead@company.com");
  const [emailSubject, setEmailSubject] = useState("");
  const [includeTriageStats, setIncludeTriageStats] = useState(true);
  const [includeAgentMetrics, setIncludeAgentMetrics] = useState(true);
  const [includeHistoricalTrends, setIncludeHistoricalTrends] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  const reportData = {
    daily: {
      title: "Daily SRE Incident & Auto-Triage Digest",
      period: "September 03, 2026 (00:00 - 23:59 UTC)",
      executiveSummary: "Over the last 24 hours, Sentrix ingested 18 production alerts across the Billing and Core infrastructure. Autonomous triage diagnosed 17 incidents within 38 seconds average, identifying 1 P1 connection pool exhaustion on billing-db-primary.",
      incidentsSummary: [
        { key: "BILL-1049", title: "HikariCP connection pool exhausted on /v1/webhooks/charges", sev: "P1", status: "Staged for Review", fixTeam: "Payments Core Team" },
        { key: "AUTH-2091", title: "JWKS public key verification latency spike on Envoy edge", sev: "P2", status: "Auto-Triaged", fixTeam: "Identity & Security Team" },
        { key: "DB-3030", title: "Deadlock in orders_allocation lock queue", sev: "P1", status: "Pending Review", fixTeam: "Database Infrastructure Team" }
      ],
      kpis: [
        { label: "Incidents (24h)", value: "18" },
        { label: "Auto-Triage Rate", value: "94.4%" },
        { label: "Avg Triage Latency", value: "38s" },
        { label: "Critical Sev-1s", value: "2" }
      ],
      recommendations: [
        "Increase HikariCP pool limit from 20 to 50 on billing-webhook-worker before upcoming midnight recurring billing cycle.",
        "Ensure SRE on-call approves Hot-Patch PR #419 under delegated identity.",
        "Review Envoy edge proxy JWKS cache TTL config on identity cluster."
      ]
    },
    weekly: {
      title: "Weekly SRE Operational Review & Incident Trends",
      period: "Week 36 (Aug 28 - Sep 03, 2026)",
      executiveSummary: "Total incident volume remained stable at 154 alerts (down 12% week-over-week). Mean Time to Acknowledge (MTTA) dropped from 6.2 minutes to 18 seconds via ADK 2.8 autonomous triage. MTTR was reduced by 68% (from 44m to 14.2m).",
      incidentsSummary: [
        { key: "BILL-1049", title: "HikariCP connection pool exhausted on recurring charges", sev: "P1", status: "Resolved", fixTeam: "Payments Core Team" },
        { key: "DB-3030", title: "Deadlock in orders_allocation lock queue", sev: "P1", status: "Resolved", fixTeam: "Database Infrastructure Team" },
        { key: "NOTIF-501", title: "SendGrid SMTP 429 quota exhaustion; rerouted to AWS SES", sev: "P2", status: "Resolved", fixTeam: "Communications Team" },
        { key: "INFRA-880", title: "Redis node failover due to OOM; updated maxmemory policy", sev: "P3", status: "Verified Healthy", fixTeam: "Core Infrastructure" }
      ],
      kpis: [
        { label: "Weekly Incidents", value: "154" },
        { label: "RCA Accuracy", value: "96.4%" },
        { label: "Mean TTR", value: "14.2m" },
        { label: "SLA Adherence", value: "99.8%" }
      ],
      recommendations: [
        "Apply missing index on billing_transactions(account_id, settlement_status) to prevent table scan locks under high concurrency.",
        "Standardize all Redis clusters on allkeys-lru maxmemory-policy via base Helm chart.",
        "Elevate SendGrid enterprise tier credit quota to accommodate monthly recurring invoice blasts."
      ]
    },
    biweekly: {
      title: "Bi-Weekly Reliability Brief & Error Budget Burn",
      period: "Sprint 42 (Aug 21 - Sep 03, 2026)",
      executiveSummary: "Rolling 14-day error budget burn rate is currently at 14.2% of quarterly allowance, maintaining a healthy green status across all Tier-1 billing microservices. 312 total diagnostic queries were executed by autonomous agents with zero security violations.",
      incidentsSummary: [
        { key: "BILL-1020", title: "Stripe webhook idempotency key collision on rapid retries", sev: "P2", status: "Resolved", fixTeam: "Payments Core Team" },
        { key: "AUTH-2044", title: "Entra ID OIDC token exchange timeout during peak morning login", sev: "P1", status: "Resolved", fixTeam: "Identity & Security Team" },
        { key: "K8S-701", title: "Worker node pool autoscaler throttled by AWS EC2 quota", sev: "P2", status: "Resolved", fixTeam: "Core Infrastructure" }
      ],
      kpis: [
        { label: "Error Budget Burn", value: "14.2%" },
        { label: "Total Ingested", value: "312" },
        { label: "Auto-Remediated", value: "42.1%" },
        { label: "SLO Margin", value: "+0.18%" }
      ],
      recommendations: [
        "Upgrade EKS cluster to v1.31 and enable automated pod disruption budgets across worker nodes.",
        "Introduce circuit breaker fallbacks on all external payment gateway webhook endpoints.",
        "Implement periodic database vacuuming schedule on order fulfillment partition tables."
      ]
    },
    monthly: {
      title: "Monthly Executive Board & Reliability Post-Mortem",
      period: "August 01 - August 31, 2026",
      executiveSummary: "In August 2026, Sentrix achieved 99.98% platform availability for the Global Billing & Payments service. Autonomous triage prevented an estimated 14.6 hours of cumulative production downtime, yielding an estimated $148,000 in saved developer on-call hours and SLA violation credits.",
      incidentsSummary: [
        { key: "INC-AUG-01", title: "Primary PostgreSQL read-replica lag exceeded 15s during monthly close", sev: "P1", status: "Post-Mortem Published", fixTeam: "Database Infrastructure Team" },
        { key: "INC-AUG-02", title: "Stripe API TLS handshake termination on edge proxy fleet", sev: "P1", status: "Post-Mortem Published", fixTeam: "Payments Core Team" },
        { key: "INC-AUG-03", title: "Kafka consumer rebalance storm across payment notification topic", sev: "P2", status: "Post-Mortem Published", fixTeam: "Communications Team" }
      ],
      kpis: [
        { label: "Availability", value: "99.98%" },
        { label: "Downtime Prevented", value: "14.6 hrs" },
        { label: "Cost Savings", value: "$148,000" },
        { label: "MTTR Compression", value: "-68%" }
      ],
      recommendations: [
        "Commission dedicated read-replica pool for automated data warehouse batch reporting.",
        "Transition all microservices to HTTP/2 multiplexed connections for external partner APIs.",
        "Establish monthly architectural review for recurring database contention hotspots."
      ]
    }
  };

  const currentReport = reportData[cadence];

  const handleCopyMarkdown = () => {
    const text = `# ${currentReport.title}\n**Period:** ${currentReport.period}\n\n## Executive Summary\n${currentReport.executiveSummary}\n\n## Key Operational KPIs\n${currentReport.kpis.map((k) => `- **${k.label}:** ${k.value}`).join("\n")}\n\n## Preventative Recommendations\n${currentReport.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOpenEmailModal = () => {
    setEmailSubject(`[Executive SRE Brief] ${currentReport.title} - ${projectKey} (${currentReport.period})`);
    setEmailSentSuccess(false);
    setShowEmailModal(true);
  };

  const handleSendEmail = () => {
    setIsSendingEmail(true);
    setTimeout(() => {
      setIsSendingEmail(false);
      setEmailSentSuccess(true);
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailSentSuccess(false);
      }, 1800);
    }, 1200);
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
            <FileText size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                {projectKey} • INSIGHTS
              </span>
              <span className="badge badge-teal">Automated Report Synthesizer</span>
              <span className="badge badge-magenta">Executive & SRE Ready</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              SRE Incident Reports & Executive Digests
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Pre-computed operational retrospectives, failure mode trends, error budget burn rates, and executive briefings.
            </p>
          </div>
        </div>

        {/* Cadence Selector */}
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
          {[
            { id: "daily", label: "Daily Digest" },
            { id: "weekly", label: "Weekly SRE" },
            { id: "biweekly", label: "Bi-Weekly Brief" },
            { id: "monthly", label: "Monthly Board" }
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setCadence(c.id)}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "6px",
                border: "none",
                background: cadence === c.id ? "var(--prism-gradient)" : "transparent",
                color: cadence === c.id ? "#fff" : "var(--ink-secondary)",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--ink-tertiary)" }}>
          <Calendar size={14} /> Active Period: <strong style={{ color: "var(--ink-primary)" }}>{currentReport.period}</strong>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={handleCopyMarkdown}
            className="btn-secondary"
            style={{ fontSize: "12px", padding: "5px 12px", gap: "6px" }}
          >
            {isCopied ? <Check size={13} color="var(--accent-teal)" /> : <Copy size={13} />}
            {isCopied ? "Copied Markdown" : "Copy Markdown"}
          </button>

          <button
            onClick={() => window.print()}
            className="btn-secondary"
            style={{ fontSize: "12px", padding: "5px 12px", gap: "6px" }}
          >
            <Printer size={13} /> Print / PDF
          </button>

          <button
            onClick={handleOpenEmailModal}
            className="btn-primary"
            style={{ fontSize: "12px", padding: "5px 14px", gap: "6px" }}
          >
            <Mail size={14} /> Send Executive Email
          </button>
        </div>
      </div>

      {/* Rendered Report Document Card */}
      <div
        className="prism-card"
        style={{
          padding: "32px 36px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          display: "flex",
          flexDirection: "column",
          gap: "24px"
        }}
      >
        {/* Document Header */}
        <div style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "20px" }}>
          <span className="badge badge-teal" style={{ textTransform: "uppercase", fontSize: "10.5px" }}>
            Sentrix Automated Reliability Intelligence
          </span>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--ink-primary)", marginTop: "8px" }}>
            {currentReport.title}
          </h2>
          <div style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "4px" }}>
            Generated for <strong>{projectKey} Platform Squad</strong> • Scope: Production Environment
          </div>
        </div>

        {/* KPI Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          {currentReport.kpis.map((kpi, idx) => (
            <div
              key={idx}
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>{kpi.label}</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--prism-pink)", marginTop: "4px" }}>
                {kpi.value}
              </div>
            </div>
          ))}
        </div>

        {/* Executive Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
            1. Executive & Incident Narrative
          </h3>
          <p style={{ fontSize: "13px", color: "var(--ink-secondary)", lineHeight: 1.6, paddingLeft: "12px", borderLeft: "3px solid var(--prism-magenta)" }}>
            {currentReport.executiveSummary}
          </p>
        </div>

        {/* 2. Triage Intelligence & Agent Performance Telemetry */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
              2. Autonomous Triage & Agent Performance Analytics
            </h3>
            <span className="mono badge badge-teal" style={{ fontSize: "10px" }}>
              ADK 2.8 Autonomous Engine
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
            {/* Metric 1: MTTA Compression */}
            <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Triage MTTA</span>
                <span className="mono badge badge-teal" style={{ fontSize: "9px" }}>95% Faster</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "6px" }}>
                <span className="mono" style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent-teal)" }}>18s</span>
                <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", textDecoration: "line-through" }}>6.2m baseline</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--ink-secondary)", marginTop: "4px" }}>
                Continuous webhook ingestion & automated triage
              </div>
            </div>

            {/* Metric 2: RCA Accuracy */}
            <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: 600 }}>RCA Verification Rate</span>
                <span className="badge badge-magenta" style={{ fontSize: "9px" }}>Verified</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "6px" }}>
                <span className="mono" style={{ fontSize: "24px", fontWeight: 800, color: "var(--prism-pink)" }}>96.4%</span>
                <span style={{ fontSize: "11px", color: "var(--ink-secondary)" }}>engineer approved</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--ink-secondary)", marginTop: "4px" }}>
                Cross-verified against PostgreSQL & Datadog traces
              </div>
            </div>

            {/* Metric 3: Action Proposals Executed */}
            <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Governed Proposals</span>
                <span className="badge badge-teal" style={{ fontSize: "9px" }}>0 Breaches</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "6px" }}>
                <span className="mono" style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent-violet)" }}>42 Staged</span>
                <span style={{ fontSize: "11px", color: "var(--accent-teal)" }}>40 Approved</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--ink-secondary)", marginTop: "4px" }}>
                100% cryptographic write locks verified
              </div>
            </div>

            {/* Metric 4: On-Call Hours Returned */}
            <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: 600 }}>On-Call Hours Saved</span>
                <span className="badge badge-amber" style={{ fontSize: "9px" }}>Returned</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "6px" }}>
                <span className="mono" style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent-amber)" }}>142 hrs</span>
                <span style={{ fontSize: "11px", color: "var(--ink-secondary)" }}>this period</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--ink-secondary)", marginTop: "4px" }}>
                Eliminated manual log digging & thread investigations
              </div>
            </div>
          </div>

          {/* Squad Dispatch Breakdown */}
          <div style={{ padding: "14px 18px", borderRadius: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
              Identified Fix Squad Dispatches ({projectKey} Incidents):
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
              <div style={{ fontSize: "12px", color: "var(--ink-secondary)" }}>
                • Payments Core Squad: <strong style={{ color: "var(--ink-primary)" }}>42% (65 tickets)</strong>
              </div>
              <div style={{ fontSize: "12px", color: "var(--ink-secondary)" }}>
                • Database Infrastructure: <strong style={{ color: "var(--ink-primary)" }}>28% (43 tickets)</strong>
              </div>
              <div style={{ fontSize: "12px", color: "var(--ink-secondary)" }}>
                • Identity & Security: <strong style={{ color: "var(--ink-primary)" }}>18% (28 tickets)</strong>
              </div>
              <div style={{ fontSize: "12px", color: "var(--ink-secondary)" }}>
                • Core Cloud Infrastructure: <strong style={{ color: "var(--ink-primary)" }}>12% (18 tickets)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Historical Improvement Trends (4-Cycle Compression Curve) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
              3. Historical Reliability Improvement Trends
            </h3>
            <span className="badge badge-teal" style={{ fontSize: "10px" }}>
              -54% Recurring Incident Reduction (OKF Fabric)
            </span>
          </div>

          {/* 4-Period Progression Visualizer */}
          <div style={{ padding: "20px", borderRadius: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--ink-tertiary)" }}>
              <span>MTTA Compression Progression Over Sequential Operating Cycles</span>
              <span style={{ color: "var(--accent-teal)", fontWeight: 600 }}>93% Cumulative Latency Reduction</span>
            </div>

            {/* Visual Trend Bars */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              {[
                { cycle: "Cycle 1 (4w ago)", mtta: "4.2 min", mttr: "44.0m", sla: "99.85%", pct: 100, color: "var(--accent-rose)" },
                { cycle: "Cycle 2 (3w ago)", mtta: "1.8 min", mttr: "28.5m", sla: "99.90%", pct: 43, color: "var(--accent-amber)" },
                { cycle: "Cycle 3 (2w ago)", mtta: "45 sec", mttr: "19.1m", sla: "99.95%", pct: 18, color: "var(--accent-violet)" },
                { cycle: "Cycle 4 (Current)", mtta: "18 sec", mttr: "14.2m", sla: "99.98%", pct: 7, color: "var(--accent-teal)" }
              ].map((c) => (
                <div key={c.cycle} style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px", background: "rgba(0,0,0,0.25)", borderRadius: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-primary)" }}>{c.cycle}</span>
                    <span className="badge badge-teal" style={{ fontSize: "9px" }}>{c.sla}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span className="mono" style={{ fontSize: "18px", fontWeight: 800, color: c.color }}>{c.mtta}</span>
                    <span style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>MTTA</span>
                  </div>

                  <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${c.pct}%`, height: "100%", background: c.color, borderRadius: "3px" }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "var(--ink-secondary)" }}>
                    <span>MTTR: <strong style={{ color: "#fff" }}>{c.mttr}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Significant Incidents Retrospective Table */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
            4. Significant Incidents & Handoffs
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)", color: "var(--ink-secondary)", textAlign: "left" }}>
                  <th style={{ padding: "10px 14px" }}>Ticket Key</th>
                  <th style={{ padding: "10px 14px" }}>Incident Summary</th>
                  <th style={{ padding: "10px 14px" }}>Severity</th>
                  <th style={{ padding: "10px 14px" }}>Resolution Status</th>
                  <th style={{ padding: "10px 14px" }}>Fix Squad</th>
                </tr>
              </thead>
              <tbody>
                {currentReport.incidentsSummary.map((inc) => (
                  <tr key={inc.key} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "12px 14px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--prism-pink)" }}>
                      {inc.key}
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--ink-primary)" }}>{inc.title}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span className={`badge ${inc.sev === "P1" ? "badge-rose" : inc.sev === "P2" ? "badge-amber" : "badge-teal"}`}>
                        {inc.sev}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--accent-teal)", fontWeight: 600 }}>{inc.status}</td>
                    <td style={{ padding: "12px 14px", color: "var(--ink-secondary)" }}>{inc.fixTeam}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Preventative Recommendations */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
            5. Actionable Preventative Recommendations
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {currentReport.recommendations.map((rec, idx) => (
              <div
                key={idx}
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  fontSize: "12.5px"
                }}
              >
                <span style={{ color: "var(--accent-teal)", fontWeight: 800 }}>0{idx + 1}.</span>
                <span style={{ color: "var(--ink-secondary)", lineHeight: 1.5 }}>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Executive Email Dispatcher Modal */}
      {showEmailModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
        >
          <div
            className="prism-card"
            style={{
              width: "520px",
              padding: "24px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Mail size={18} color="var(--prism-pink)" />
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Dispatch Executive SRE Email Brief</h3>
              </div>
              <button onClick={() => setShowEmailModal(false)} className="btn-ghost" style={{ padding: "4px" }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                  Recipients (comma separated):
                </label>
                <input
                  type="text"
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: "4px",
                    padding: "8px 12px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    color: "var(--ink-primary)",
                    fontSize: "12px"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                  Subject Line:
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: "4px",
                    padding: "8px 12px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    color: "var(--ink-primary)",
                    fontSize: "12px"
                  }}
                />
              </div>

              {/* Checkbox Options */}
              <div style={{ padding: "12px", background: "var(--bg-elevated)", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                  Attached Report Sections:
                </span>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--ink-secondary)", cursor: "pointer" }}>
                  <input type="checkbox" checked={includeTriageStats} onChange={(e) => setIncludeTriageStats(e.target.checked)} />
                  Include Autonomous Triage Stats & Squad Dispatches
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--ink-secondary)", cursor: "pointer" }}>
                  <input type="checkbox" checked={includeAgentMetrics} onChange={(e) => setIncludeAgentMetrics(e.target.checked)} />
                  Include Agent Performance & 142 On-Call Hours Saved
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--ink-secondary)", cursor: "pointer" }}>
                  <input type="checkbox" checked={includeHistoricalTrends} onChange={(e) => setIncludeHistoricalTrends(e.target.checked)} />
                  Include 4-Cycle MTTA/MTTR Historical Compression Curve
                </label>
              </div>
            </div>

            {emailSentSuccess && (
              <div style={{ padding: "10px 14px", borderRadius: "6px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-teal)", fontSize: "12px" }}>
                <CheckCircle2 size={16} />
                <span>Executive email brief successfully queued and dispatched via SendGrid Enterprise (200 OK).</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setShowEmailModal(false)} className="btn-secondary" style={{ fontSize: "12px" }}>
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isSendingEmail || emailSentSuccess}
                className="btn-primary"
                style={{ fontSize: "12px", gap: "6px" }}
              >
                {isSendingEmail ? <RotateCw size={13} className="spin" /> : <Send size={13} />}
                {isSendingEmail ? "Dispatching..." : emailSentSuccess ? "Dispatched!" : "Send Executive Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
