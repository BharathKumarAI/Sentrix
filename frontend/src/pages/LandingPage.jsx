import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShieldCheck, 
  Terminal, 
  MessageSquare, 
  Cpu, 
  Zap, 
  ArrowRight, 
  Layers, 
  Lock, 
  Paperclip, 
  CheckCircle2, 
  Activity, 
  Radar, 
  BarChart2, 
  Database, 
  Server, 
  ExternalLink,
  Sparkles,
  ChevronRight,
  Sun,
  Moon,
  Clock,
  Play
} from "lucide-react";
import { BrandLogo } from "../components/BrandLogo";

export function LandingPage() {
  const navigate = useNavigate();
  const [activeScenario, setActiveScenario] = useState("STRIPE_504");
  const [simulatedExecuting, setSimulatedExecuting] = useState(false);
  const [simulatedApproved, setSimulatedApproved] = useState(false);

  const scenarios = {
    STRIPE_504: {
      title: "Stripe Webhook 504 Gateway Timeout",
      project: "BILLING",
      env: "production",
      rootCause: "PostgreSQL Database Connection Pool Exhaustion on worker pods due to unindexed queries under peak Stripe webhook load.",
      impact: "4.8% failure rate on /v1/webhooks/charges (142 failed transactions)",
      telemetry: [
        { tool: "Splunk", metric: "PoolAcquireTimeoutException (15 instances)", status: "ERROR" },
        { tool: "PostgreSQL", metric: "Active connections: 20/20 (SATURATED)", status: "CRITICAL" },
        { tool: "Kubernetes", metric: "Readiness probe failed on stripe-webhook-worker", status: "DEGRADED" }
      ],
      proposal: {
        type: "JIRA_COMMENT",
        target: "BILL-1049",
        action: "Post Autonomous Triage Summary to Jira & Stage Pod Restart"
      }
    },
    DB_DEADLOCK: {
      title: "PostgreSQL Read-Replica Lock Saturation",
      project: "FULFILL",
      env: "production",
      rootCause: "Long-running transaction holding exclusive lock on orders table during bulk inventory refresh batch.",
      impact: "Order checkout latency spiked to 3,450ms across US-East region",
      telemetry: [
        { tool: "PostgreSQL", metric: "48 waiting query threads in pg_stat_activity", status: "SATURATED" },
        { tool: "Splunk", metric: "HTTP 500 LockWaitTimeout in order-api", status: "ERROR" },
        { tool: "OKF v2.0", metric: "Matched Runbook: Bulk Lock Mitigation v3", status: "VERIFIED" }
      ],
      proposal: {
        type: "RUN_COMMAND",
        target: "k8s-prod-us-east",
        action: "Terminate Hung Backend Query & Rotate Worker Connections"
      }
    },
    K8S_OOM: {
      title: "Worker Container OOMKilled Crashloop",
      project: "AUTH_ID",
      env: "staging",
      rootCause: "Memory leak in token verification cache leading to container OOMKilled exit code 137.",
      impact: "OAuth token issuance delay increased by 2.4s",
      telemetry: [
        { tool: "Kubernetes", metric: "Pod restart count: 8 (CrashLoopBackOff)", status: "DEGRADED" },
        { tool: "Splunk", metric: "Out of Memory allocating JWT cache heap", status: "ERROR" },
        { tool: "OKF v2.0", metric: "Correlated Precedent: INC-3904 (Resolved in 6m)", status: "VERIFIED" }
      ],
      proposal: {
        type: "RUN_COMMAND",
        target: "k8s-staging-cluster",
        action: "Scale Memory Limit from 512Mi to 1Gi & Execute Rollout"
      }
    }
  };

  const currentData = scenarios[activeScenario];

  const handleSimulatedApprove = () => {
    setSimulatedExecuting(true);
    setTimeout(() => {
      setSimulatedExecuting(false);
      setSimulatedApproved(true);
    }, 800);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-base)",
      color: "var(--ink-primary)",
      fontFamily: "var(--font-sans)",
      overflowX: "hidden"
    }}>
      {/* 1. TOP STICKY NAVIGATION BAR */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 200,
        backdropFilter: "blur(14px)",
        background: "var(--bg-elevated)",
        borderBottom: "1px solid var(--border-subtle)",
        padding: "14px 60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <div onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <BrandLogo size={36} subtitle="Autonomous SRE Engine" />
          </div>

          <nav style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <a href="#features" style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink-secondary)", textDecoration: "none" }}>
              Capabilities
            </a>
            <a href="#simulation" style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink-secondary)", textDecoration: "none" }}>
              Live Simulation
            </a>
            <a href="#architecture" style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink-secondary)", textDecoration: "none" }}>
              Tool Connectors
            </a>
            <a href="#approvals" style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink-secondary)", textDecoration: "none" }}>
              Governed Approvals
            </a>
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            className="btn-ghost"
            onClick={() => navigate("/admin/overview")}
            style={{ fontSize: "12.5px", padding: "8px 14px" }}
          >
            Admin Console
          </button>
          <button
            className="btn-primary"
            onClick={() => navigate("/p/BILLING/investigations")}
            style={{ fontSize: "12.5px", padding: "8px 18px", gap: "6px" }}
          >
            <span>Launch Sentrix Triage</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section style={{
        padding: "80px 60px 60px 60px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        position: "relative"
      }}>
        {/* Background Radial Glow */}
        <div style={{
          position: "absolute",
          top: "5%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "90vw",
          height: "450px",
          background: "radial-gradient(ellipse at center, rgba(236, 72, 153, 0.12), rgba(139, 92, 246, 0.06), transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0
        }} />

        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Announcement Pill */}
          <div className="badge badge-magenta" style={{
            padding: "6px 14px",
            fontSize: "12px",
            fontWeight: "700",
            marginBottom: "24px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            borderRadius: "20px"
          }}>
            <Sparkles size={13} />
            <span>SENTRIX 2.8 • Autonomous Telemetry & Incident Autopsy Engine</span>
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontSize: "clamp(36px, 4vw, 60px)",
            fontWeight: "900",
            letterSpacing: "-0.04em",
            lineHeight: "1.12",
            maxWidth: "1100px",
            marginBottom: "20px",
            color: "var(--ink-primary)"
          }}>
            Autonomous Incident Triage from Alert to Governed Remediation
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: "18px",
            color: "var(--ink-secondary)",
            maxWidth: "900px",
            lineHeight: "1.6",
            marginBottom: "36px"
          }}>
            Correlate Splunk logs, governed PostgreSQL replicas, and Kubernetes cluster telemetry in milliseconds. Stage cryptographic Jira approvals and execute pod rollouts with zero unintended mutations.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center", marginBottom: "50px" }}>
            <button
              className="btn-primary"
              onClick={() => navigate("/p/BILLING/investigations")}
              style={{ fontSize: "14px", padding: "12px 28px", gap: "8px", borderRadius: "10px" }}
            >
              <Zap size={16} />
              <span>Launch Autonomous Triage</span>
            </button>

            <button
              className="btn-secondary"
              onClick={() => navigate("/p/BILLING/overview")}
              style={{ fontSize: "14px", padding: "12px 24px", gap: "8px", borderRadius: "10px" }}
            >
              <Activity size={16} color="var(--accent-teal)" />
              <span>Explore Fleet Overview</span>
            </button>
          </div>

          {/* Performance KPIs Banner */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            width: "100%",
            maxWidth: "1400px"
          }}>
            {[
              { stat: "4.2x", label: "Faster MTTR", desc: "Average time to root-cause isolation" },
              { stat: "96.4%", label: "Triage Confidence", desc: "Cross-correlated telemetry accuracy" },
              { stat: "0", label: "Unintended Actions", desc: "Cryptographically write-locked" },
              { stat: "100%", label: "Delegated Audit", desc: "Full provenance for every mutation" }
            ].map((kpi) => (
              <div key={kpi.label} className="prism-card" style={{
                padding: "28px 20px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}>
                <span className="mono" style={{ fontSize: "36px", fontWeight: "800", color: "var(--prism-pink)" }}>
                  {kpi.stat}
                </span>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink-primary)" }}>
                  {kpi.label}
                </span>
                <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                  {kpi.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE SIMULATION SECTION */}
      <section id="simulation" style={{
        padding: "60px 60px",
        width: "100%"
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <span className="badge badge-teal" style={{ fontSize: "11px", marginBottom: "8px" }}>
            Interactive Demo
          </span>
          <h2 style={{ fontSize: "32px", fontWeight: "800", letterSpacing: "-0.03em" }}>
            Experience Sentrix Telemetry Correlation Live
          </h2>
          <p style={{ fontSize: "14px", color: "var(--ink-secondary)", maxWidth: "600px", margin: "8px auto 0 auto" }}>
            Select an incident scenario below to see how Sentrix synthesizes distributed evidence, isolates root causes, and stages governed write actions.
          </p>
        </div>

        {/* Scenario Switcher Tabs */}
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "24px" }}>
          {Object.keys(scenarios).map((key) => {
            const sc = scenarios[key];
            const isSelected = activeScenario === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveScenario(key);
                  setSimulatedApproved(false);
                }}
                className={isSelected ? "btn-primary" : "btn-secondary"}
                style={{ fontSize: "12.5px", padding: "8px 16px" }}
              >
                {sc.title}
              </button>
            );
          })}
        </div>

        {/* Simulated Triage Stream Card */}
        <div className="glass-card" style={{
          padding: "28px",
          background: "var(--card-bg-chat)",
          border: "1px solid var(--border-card)",
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <BrandLogo size={28} showText={false} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--ink-primary)", margin: 0 }}>
                    {currentData.title}
                  </h3>
                  <span className="mono badge badge-magenta">PROJECT: {currentData.project}</span>
                  <span className="mono badge badge-teal">ENV: {currentData.env}</span>
                </div>
                <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                  Autopsy isolated in 38ms across 3 active connectors
                </span>
              </div>
            </div>
            <span className="badge badge-teal" style={{ fontSize: "11px" }}>96.4% Confidence</span>
          </div>

          {/* Root Cause Box */}
          <div style={{
            background: "rgba(225, 29, 72, 0.08)",
            border: "1px solid rgba(225, 29, 72, 0.25)",
            borderRadius: "8px",
            padding: "14px 18px"
          }}>
            <span style={{ fontSize: "10.5px", fontWeight: "800", color: "var(--prism-pink)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Verified Root Cause:
            </span>
            <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink-primary)", margin: "4px 0 6px 0", lineHeight: "1.5" }}>
              {currentData.rootCause}
            </p>
            <span style={{ fontSize: "11.5px", color: "var(--accent-amber)" }}>
              Impact: {currentData.impact}
            </span>
          </div>

          {/* Parallel Telemetry Citations */}
          <div>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
              Concurrent Telemetry Evidence:
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              {currentData.telemetry.map((t, idx) => (
                <div key={idx} className="prism-card" style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-primary)" }}>{t.tool}</span>
                    <span className={`badge ${t.status === "ERROR" ? "badge-rose" : t.status === "CRITICAL" ? "badge-magenta" : "badge-amber"}`} style={{ fontSize: "9px" }}>
                      {t.status}
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--ink-secondary)", lineHeight: "1.4" }}>
                    {t.metric}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Governed Action Proposal */}
          <div style={{
            background: "var(--thinking-bg)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "8px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={16} color="var(--accent-teal)" />
                <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink-primary)" }}>
                  {currentData.proposal.action}
                </span>
                <span className="mono badge badge-blue">Target: {currentData.proposal.target}</span>
              </div>
              <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "2px", display: "block" }}>
                Requires human authorization under delegated identity <strong>kbk@company.com</strong>
              </span>
            </div>

            {simulatedApproved ? (
              <span className="badge badge-teal" style={{ padding: "6px 14px", fontSize: "12px", gap: "6px" }}>
                <CheckCircle2 size={13} /> Executed & Posted
              </span>
            ) : (
              <button
                className="btn-primary"
                onClick={handleSimulatedApprove}
                disabled={simulatedExecuting}
                style={{ fontSize: "12px", padding: "8px 18px", gap: "6px" }}
              >
                {simulatedExecuting ? (
                  <span>Authorizing...</span>
                ) : (
                  <>
                    <Lock size={13} />
                    <span>Approve & Execute Action</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 4. CORE CAPABILITIES / PILLARS */}
      <section id="features" style={{
        padding: "60px 60px",
        width: "100%"
      }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span className="badge badge-magenta" style={{ fontSize: "11px", marginBottom: "8px" }}>
            Engine Features
          </span>
          <h2 style={{ fontSize: "32px", fontWeight: "800", letterSpacing: "-0.03em" }}>
            Engineered for High-Stakes Production Telemetry
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
          {[
            {
              icon: <Zap size={20} color="var(--prism-pink)" />,
              title: "Parallel Multi-Tool Synthesis",
              desc: "Dispatches concurrent asyncio queries across Splunk clusters, PostgreSQL replicas, and Kubernetes APIs in parallel to isolate root causes."
            },
            {
              icon: <ShieldCheck size={20} color="var(--accent-teal)" />,
              title: "Cryptographic Human Write-Locks",
              desc: "Write actions are staged as proposals requiring human authorization, Atlassian OAuth delegation, and full audit logging."
            },
            {
              icon: <Paperclip size={20} color="var(--accent-blue)" />,
              title: "Diagnostic Log Attachments",
              desc: "Drag and drop .log traces, PostgreSQL query dumps, or Kubernetes coredumps directly into the investigation stream."
            },
            {
              icon: <Radar size={20} color="var(--accent-amber)" />,
              title: "Dynamic Environment Scope",
              desc: "Automatically resolves staging or production context per incident ticket or query intent without manual selection."
            },
            {
              icon: <Activity size={20} color="var(--accent-violet)" />,
              title: "Live Thinking & Trace Transparency",
              desc: "Full agent reasoning trace displayed in real-time with step-by-step thinking expansion and tool invocation timelines."
            },
            {
              icon: <Layers size={20} color="var(--accent-teal)" />,
              title: "Multi-Project Fleet Management",
              desc: "Switch between billing, fulfillment, auth, and infrastructure projects with isolated environments and connector configurations."
            },
            {
              icon: <Lock size={20} color="var(--prism-pink)" />,
              title: "Delegated Identity & OAuth",
              desc: "All actions execute under delegated user identity with Atlassian SSO, RBAC enforcement, and session expiry handling."
            },
            {
              icon: <Database size={20} color="var(--accent-amber)" />,
              title: "OKF Knowledge Graph v2.0",
              desc: "Semantic vector search across runbooks, historical incidents, and remediation precedents with similarity scoring."
            }
          ].map((feat, idx) => (
            <div key={idx} className="glass-card" style={{
              padding: "24px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-card)",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "var(--thinking-bg)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {feat.icon}
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink-primary)", margin: 0 }}>
                {feat.title}
              </h3>
              <p style={{ fontSize: "13px", color: "var(--ink-secondary)", lineHeight: "1.6", margin: 0 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CONNECTOR ARCHITECTURE ECOSYSTEM */}
      <section id="architecture" style={{
        padding: "60px 60px",
        width: "100%",
        textAlign: "center"
      }}>
        <span className="badge badge-teal" style={{ fontSize: "11px", marginBottom: "8px" }}>
          Integrations
        </span>
        <h2 style={{ fontSize: "32px", fontWeight: "800", letterSpacing: "-0.03em", marginBottom: "28px" }}>
          Built-in Connectors for Your Production Stack
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "14px"
        }}>
          {[
            { name: "Splunk Enterprise", category: "Logs & Traces", status: "Active" },
            { name: "PostgreSQL Replica", category: "Database Metrics", status: "Active" },
            { name: "Kubernetes K8s", category: "Cluster Inspector", status: "Active" },
            { name: "Atlassian Jira Cloud", category: "ITSM Governance", status: "Active" },
            { name: "OKF Knowledge Graph", category: "Runbooks & Precedents", status: "Active" },
            { name: "Datadog Telemetry", category: "APM & Spans", status: "Catalog" },
            { name: "Prometheus Metrics", category: "Alertmanager", status: "Catalog" },
            { name: "Kafka Event Ledger", category: "Event Streaming", status: "Catalog" }
          ].map((conn) => (
            <div key={conn.name} className="prism-card" style={{
              padding: "16px",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: "6px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink-primary)" }}>{conn.name}</span>
                <span className={`badge ${conn.status === "Active" ? "badge-teal" : "badge-violet"}`} style={{ fontSize: "9px" }}>
                  {conn.status}
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>{conn.category}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CALL TO ACTION FOOTER */}
      <footer style={{
        marginTop: "60px",
        borderTop: "1px solid var(--border-subtle)",
        background: "var(--bg-elevated)",
        padding: "50px 60px 30px 60px"
      }}>
        <div style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "30px",
          marginBottom: "40px"
        }}>
          <div>
            <BrandLogo size={32} subtitle="Autonomous SRE & Telemetry Intelligence" />
            <p style={{ fontSize: "12px", color: "var(--ink-secondary)", maxWidth: "320px", marginTop: "12px", lineHeight: "1.6" }}>
              Sentrix accelerates site reliability engineering with governed autonomous agent pipelines and cross-tool telemetry synthesis.
            </p>
          </div>

          <div style={{ display: "flex", gap: "40px" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase", display: "block", marginBottom: "12px" }}>
                Platform Modules
              </span>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px" }}>
                <li><a href="/p/BILLING/overview" style={{ color: "var(--ink-secondary)", textDecoration: "none" }}>Project Overview</a></li>
                <li><a href="/p/BILLING/investigations" style={{ color: "var(--ink-secondary)", textDecoration: "none" }}>Investigation Stream</a></li>
                <li><a href="/p/BILLING/triage" style={{ color: "var(--ink-secondary)", textDecoration: "none" }}>Auto-Triage Hub</a></li>
                <li><a href="/p/BILLING/actions" style={{ color: "var(--ink-secondary)", textDecoration: "none" }}>Action Proposals</a></li>
              </ul>
            </div>

            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase", display: "block", marginBottom: "12px" }}>
                Administration
              </span>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px" }}>
                <li><a href="/admin/overview" style={{ color: "var(--ink-secondary)", textDecoration: "none" }}>Admin Dashboard</a></li>
                <li><a href="/admin/connectors" style={{ color: "var(--ink-secondary)", textDecoration: "none" }}>Connectors Catalog</a></li>
                <li><a href="/admin/prompts" style={{ color: "var(--ink-secondary)", textDecoration: "none" }}>Skills & Prompts</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div style={{
          width: "100%",
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "11.5px",
          color: "var(--ink-tertiary)"
        }}>
          <span>© 2026 Sentrix Platform. Autonomous SRE & Incident Autopsy. All rights reserved.</span>
          <span>Enterprise Delegated Security • SOC2 Certified</span>
        </div>
      </footer>
    </div>
  );
}
