import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Bot,
  User,
  Terminal,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  RotateCw,
  Copy,
  Check,
  Zap,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  Layers,
  Wrench,
  Table,
  BarChart2,
  CheckCircle2,
  X,
  Lock,
  MessageSquare,
  Activity,
  Play,
  ShieldAlert,
  Server
} from "lucide-react";

/**
 * InvestigationStreamChat
 * Reusable full-featured autonomous incident investigation stream.
 * Encapsulates:
 * 1. Agent Trigger Lifecycle (Alert Ingestion -> Diagnostic Tool Execution -> RCA Synthesis)
 * 2. Real-Time Tool Trigger Bar (Splunk, PostgreSQL, Kubernetes, Datadog, Jira)
 * 3. Collapsible Agent Chain-of-Thought ("Thinking Process")
 * 4. Multi-Modal Dynamic Diagnostic Artifacts:
 *    - Data Tables (SQL execution outputs)
 *    - Metric Latency Graphs (p99 latency spikes vs error counts)
 *    - RCA Report Cards with Incident Timelines
 * 5. Governed Cryptographic Action Approvals:
 *    - Kubernetes Deployment Restarts
 *    - Jira Delegated Ticket Updates (with OAuth authentication step)
 *    - SQL Index & Connection Pool Modifications
 */
export function InvestigationStreamChat({
  ticketKey = "BILL-1049",
  serviceName = "Payment Ledger & Webhooks",
  delegatedIdentity = "sarah.j@company.com",
  height = "100%",
  style = {}
}) {
  const [activeTools, setActiveTools] = useState({
    postgres: true,
    datadog: true,
    kubernetes: true,
    splunk: true,
    jira: true
  });

  const toolCatalog = [
    { id: "postgres", name: "PostgreSQL Primary", icon: "🐘", scope: "pg_stat_activity & locks" },
    { id: "datadog", name: "Datadog APM", icon: "🐶", scope: "p99 latency & error rates" },
    { id: "kubernetes", name: "Kubernetes Cluster", icon: "☸️", scope: "Pod health & restart counts" },
    { id: "splunk", name: "Splunk Enterprise", icon: "🪵", scope: "Application trace logs" },
    { id: "jira", name: "Jira Cloud Service Desk", icon: "🔷", scope: "Ticket & delegation updates" }
  ];

  const defaultMessages = [
    {
      id: "inv-msg-1",
      role: "assistant",
      timestamp: "10:42:15 AM",
      generationTime: "1.4s",
      triggeredTools: ["postgres", "datadog", "kubernetes"],
      thinking: [
        `Triggered by critical alert fire for ticket ${ticketKey} (${serviceName}).`,
        "Step 1: Dispatched read-only probe via Tool Broker to PostgreSQL Primary.",
        "Step 2: Dispatched trace monitor query to Datadog APM.",
        "Step 3: Dispatched container inspection probe to Kubernetes us-east cluster.",
        "Synthesized correlated root cause: HikariCP pool exhaustion caused by lock contention on billing_transactions."
      ],
      text: `### Autonomous Triage Session for Incident \`${ticketKey}\`

I ingested the telemetry payload and dispatched automated diagnostic probes across the enabled tool conduits.

#### Diagnostic Findings:
- **PostgreSQL Conduits:** Active database connections reached **20/20** (100% saturation). 142 client threads waiting in acquire queue.
- **Datadog APM Conduits:** \`PoolAcquireTimeoutException\` error spikes observed at **420 errors/min** across 6 worker pods.
- **Kubernetes Conduits:** \`stripe-webhook-worker\` pods restarted **4 times** due to liveness probe timeouts resulting from blocked threads.`,
      artifact: {
        type: "RCA_REPORT",
        title: "Autonomous Root Cause Analysis & Blast Radius",
        incident_id: ticketKey,
        confidence_score: 0.98,
        root_cause: "HikariCP connection pool exhausted on billing-db-primary due to unindexed batch lock in /v1/webhooks/charges.",
        impact: "Severe • 2,410 failed customer subscription renewals • $142K volume at risk",
        timeline: [
          { time: "10:38:00", event: "Stripe webhook retry storm initiated by downstream gateway" },
          { time: "10:39:12", event: "HikariCP pool acquisition latency breached 30,000ms timeout threshold" },
          { time: "10:40:05", event: "Envoy gateway began emitting cascading 504 Gateway Timeouts" },
          { time: "10:41:40", event: "Autonomous SRE agent triggered via PagerDuty webhook" },
          { time: "10:42:15", event: "RCA synthesized and remediation Action Proposal staged" }
        ]
      },
      metricChart: {
        title: "Telemetry Correlation: p99 Latency vs Error Rate Spikes",
        points: [
          { time: "10:35", p99: 45, errors: 0 },
          { time: "10:37", p99: 120, errors: 4 },
          { time: "10:39", p99: 1450, errors: 48 },
          { time: "10:40", p99: 30000, errors: 420 },
          { time: "10:41", p99: 30000, errors: 412 },
          { time: "10:42", p99: 28400, errors: 380 }
        ]
      },
      actionProposals: [
        {
          id: "PROP-K8S-01",
          type: "RUN_COMMAND",
          title: "Scale Connection Pool & Perform Rolling Worker Restart",
          target_cluster: "k8s-prod-us-east-1",
          risk_level: "LOW",
          diff: `- maximum-pool-size: 20
+ maximum-pool-size: 50
+ leak-detection-threshold: 4000`,
          status: "PENDING_APPROVAL"
        },
        {
          id: "PROP-JIRA-02",
          type: "JIRA_COMMENT",
          title: "Post Governed Root Cause & Fix Plan to Jira",
          ticket_key: ticketKey,
          risk_level: "AUDITED",
          status: "PENDING_APPROVAL"
        }
      ]
    }
  ];

  const [messages, setMessages] = useState(defaultMessages);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState({ "inv-msg-1": false });
  const [showToolDrawer, setShowToolDrawer] = useState(false);
  const [activeProposalStates, setActiveProposalStates] = useState({});
  const [jiraAuthModalOpen, setJiraAuthModalOpen] = useState(false);
  const [currentJiraProposal, setCurrentJiraProposal] = useState(null);
  const [elapsedTimer, setElapsedTimer] = useState(0);
  const [activeSteeringFocus, setActiveSteeringFocus] = useState(null);
  const [activePeekTelemetry, setActivePeekTelemetry] = useState(null);
  const messagesEndRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isGenerating) {
      setElapsedTimer(0);
      setActiveSteeringFocus(null);
      setActivePeekTelemetry(null);
      timerRef.current = setInterval(() => {
        setElapsedTimer((prev) => +(prev + 0.1).toFixed(1));
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGenerating]);

  const toggleTool = (id) => {
    setActiveTools((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleThinking = (id) => {
    setExpandedThinking((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Approval Execution Workflow
  const handleApproveProposal = (proposal) => {
    if (proposal.type === "JIRA_COMMENT") {
      setCurrentJiraProposal(proposal);
      setJiraAuthModalOpen(true);
      return;
    }

    // Execute system command
    executeCommandProposal(proposal);
  };

  const executeCommandProposal = (proposal) => {
    setActiveProposalStates((prev) => ({
      ...prev,
      [proposal.id]: "EXECUTING"
    }));

    setTimeout(() => {
      setActiveProposalStates((prev) => ({
        ...prev,
        [proposal.id]: "EXECUTED"
      }));

      // Append verified execution telemetry from the agent
      const confirmationMsg = {
        id: "inv-exec-" + Date.now(),
        role: "assistant",
        timestamp: new Date().toLocaleTimeString(),
        generationTime: "0.6s",
        text: `### ✅ Verified Remediation Execution: \`${proposal.id}\`

- **Cluster:** \`${proposal.target_cluster}\`
- **Execution Command:** \`kubectl patch configmap billing-worker-config --type merge -p '{"data":{"max_pool":"50"}}'\`
- **Rollout Status:** Deployment \`stripe-webhook-worker\` restarted with 3/3 healthy pods.
- **Post-Remediation Telemetry:** Database active connections dropped from **20/20** to **4/50**. p99 latency normalized to **18ms**.`
      };
      setMessages((prev) => [...prev, confirmationMsg]);
    }, 1200);
  };

  const handleAuthenticateJira = () => {
    setIsAuthenticatingJira(true);
    setTimeout(() => {
      setIsAuthenticatingJira(false);
      setJiraAuthModalOpen(false);

      if (currentJiraProposal) {
        setActiveProposalStates((prev) => ({
          ...prev,
          [currentJiraProposal.id]: "EXECUTED"
        }));

        const jiraMsg = {
          id: "inv-jira-" + Date.now(),
          role: "assistant",
          timestamp: new Date().toLocaleTimeString(),
          text: `### 🔷 Jira Ticket Updated via Delegated Session

Successfully posted comprehensive RCA report, service flow diagnostics, and resolution timeline to **${currentJiraProposal.ticket_key}** using delegated OAuth credentials for **${delegatedIdentity}**.`
        };
        setMessages((prev) => [...prev, jiraMsg]);
      }
    }, 900);
  };

  const handleRejectProposal = (proposal) => {
    setActiveProposalStates((prev) => ({
      ...prev,
      [proposal.id]: "REJECTED"
    }));

    const rejectMsg = {
      id: "inv-rej-" + Date.now(),
      role: "assistant",
      timestamp: new Date().toLocaleTimeString(),
      text: `❌ **Proposal Dismissed by Engineer**

The action proposal \`${proposal.id}\` was rejected by ${delegatedIdentity}. No modifications were made to the target environment.`
    };
    setMessages((prev) => [...prev, rejectMsg]);
  };

  // Agent Prompt / Trigger Workflow
  const handleSend = (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isGenerating) return;

    const userMsg = {
      id: "user-" + Date.now(),
      role: "user",
      timestamp: new Date().toLocaleTimeString(),
      text: text.trim()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsGenerating(true);

    setTimeout(() => {
      let replyText = `I processed your inquiry: **"${text.trim()}"**.

Cross-verifying diagnostic probes against enabled tool conduits (${Object.keys(activeTools).filter(k => activeTools[k]).join(", ")})...`;

      if (text.toLowerCase().includes("pg_stat") || text.toLowerCase().includes("sql") || text.toLowerCase().includes("query")) {
        replyText = `### Live Diagnostic Query Output: PostgreSQL Primary

\`\`\`sql
SELECT pid, usename, client_addr, state, query_start, wait_event, query 
FROM pg_stat_activity 
WHERE datname = 'billing_ledger' AND state != 'idle';
\`\`\`

- **Saturated Pool Size:** 20/20 active connections.
- **Top Blocker PID:** \`19420\` running \`UPDATE billing_transactions SET status = 'SETTLED' WHERE id = $1 FOR UPDATE;\`
- **Wait Event:** \`Lock:transactionid\` (exclusive row lock held for 4.2 seconds).`;
      } else if (text.toLowerCase().includes("rollback") || text.toLowerCase().includes("fix")) {
        replyText = `### Remediation Recommendation:

1. Expand the HikariCP max pool size from \`20\` to \`50\` to handle peak batch settlement spikes.
2. Apply missing composite index on \`billing_transactions(account_id, settlement_status)\`.
3. Enable exponential backoff on Stripe retry consumer queue.`;
      }

      const botReply = {
        id: "bot-" + Date.now(),
        role: "assistant",
        timestamp: new Date().toLocaleTimeString(),
        generationTime: "0.9s",
        triggeredTools: ["postgres", "datadog"],
        text: replyText
      };

      setMessages((prev) => [...prev, botReply]);
      setIsGenerating(false);
    }, 1000);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: height,
        background: "var(--bg-app, #070a1c)",
        color: "var(--ink-primary, #ffffff)",
        fontFamily: "inherit",
        borderRadius: "10px",
        overflow: "hidden",
        border: "1px solid var(--border-card, rgba(255, 255, 255, 0.08))",
        ...style
      }}
    >
      {/* 1. Header Bar with Tool Trigger Status & Delegated Identity */}
      <div
        style={{
          padding: "12px 20px",
          background: "var(--bg-elevated, #111638)",
          borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              background: "var(--prism-gradient, linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 0 14px var(--prism-glow, rgba(236, 72, 153, 0.3))"
            }}
          >
            <Activity size={18} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--ink-primary, #ffffff)" }}>
                Autonomous Incident Investigation Stream
              </span>
              <span className="badge badge-teal" style={{ fontSize: "9.5px" }}>
                Live Stream Active
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--ink-secondary, #94a3b8)", marginTop: "1px" }}>
              Delegated Identity: <strong style={{ color: "var(--accent-teal, #10b981)" }}>{delegatedIdentity}</strong> • Incident: <strong style={{ color: "var(--prism-pink, #ec4899)" }}>{ticketKey}</strong>
            </div>
          </div>
        </div>

        {/* Tool Conduits Filter Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setShowToolDrawer(!showToolDrawer)}
            className="btn-secondary"
            style={{ fontSize: "11.5px", padding: "6px 12px", gap: "6px" }}
          >
            <Wrench size={13} />
            Conduits ({Object.values(activeTools).filter(Boolean).length}/{toolCatalog.length} Active)
          </button>
        </div>
      </div>

      {/* 2. Tool Conduits Drawer (Collapsible) */}
      {showToolDrawer && (
        <div
          style={{
            padding: "10px 20px",
            background: "rgba(0, 0, 0, 0.35)",
            borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap"
          }}
        >
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary, #64748b)", textTransform: "uppercase" }}>
            Active Diagnostic Tools:
          </span>
          {toolCatalog.map((t) => {
            const isEnabled = activeTools[t.id];
            return (
              <button
                key={t.id}
                onClick={() => toggleTool(t.id)}
                style={{
                  fontSize: "11px",
                  padding: "4px 10px",
                  borderRadius: "14px",
                  background: isEnabled ? "var(--bg-elevated, #111638)" : "transparent",
                  border: isEnabled ? "1px solid var(--accent-teal, #10b981)" : "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
                  color: isEnabled ? "var(--ink-primary, #ffffff)" : "var(--ink-tertiary, #64748b)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>{t.icon}</span>
                <span>{t.name}</span>
                <span style={{ fontSize: "9px", color: isEnabled ? "var(--accent-teal)" : "var(--ink-tertiary)" }}>
                  {isEnabled ? "ON" : "OFF"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Messages Stream */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "18px"
        }}
      >
        {messages.map((m) => {
          const isBot = m.role === "assistant";
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: isBot ? "flex-start" : "flex-end",
                alignItems: "flex-start",
                gap: "10px",
                maxWidth: "100%"
              }}
            >
              {/* Bot Avatar */}
              {isBot && (
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "var(--prism-gradient, linear-gradient(135deg, #ec4899, #8b5cf6))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  flexShrink: 0,
                  boxShadow: "0 0 10px rgba(236, 72, 153, 0.3)"
                }}>
                  <Bot size={16} />
                </div>
              )}

              {/* Message Outer Shell */}
              <div
                style={{
                  maxWidth: isBot ? "88%" : "75%",
                  padding: isBot ? "18px 20px" : "12px 16px",
                  borderRadius: isBot ? "10px" : "12px 12px 2px 12px",
                  background: isBot ? "var(--bg-card, #0b102b)" : "rgba(236, 72, 153, 0.12)",
                  border: isBot ? "1px solid var(--border-card, rgba(255, 255, 255, 0.08))" : "1px solid rgba(236, 72, 153, 0.35)"
                }}
              >
                {/* Meta Header with Triggered Tools Badges (Bot Only) */}
                {isBot && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                      borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))",
                      paddingBottom: "8px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--prism-pink, #ec4899)" }}>
                        Autonomous SRE Agent
                      </span>

                      {/* Triggered Tool Indicators */}
                      {m.triggeredTools && m.triggeredTools.map((tId) => (
                        <span key={tId} className="mono badge badge-teal" style={{ fontSize: "9.5px", gap: "4px" }}>
                          <Zap size={9} /> Triggered: {tId.toUpperCase()}
                        </span>
                      ))}

                      {m.generationTime && (
                        <span className="mono" style={{ fontSize: "10px", color: "var(--ink-tertiary, #64748b)" }}>
                          ⚡ {m.generationTime}
                        </span>
                      )}
                    </div>

                    <span className="mono" style={{ fontSize: "10.5px", color: "var(--ink-tertiary, #64748b)" }}>
                      {m.timestamp}
                    </span>
                  </div>
                )}

                {/* Collapsible Chain of Thought Accordion */}
                {isBot && m.thinking && m.thinking.length > 0 && (
                  <div
                    style={{
                      marginBottom: "14px",
                      borderRadius: "6px",
                      background: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))",
                      overflow: "hidden"
                    }}
                  >
                    <div
                      onClick={() => toggleThinking(m.id)}
                      style={{
                        padding: "8px 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        background: "rgba(255, 255, 255, 0.03)"
                      }}
                    >
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-secondary, #94a3b8)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Sparkles size={12} color="var(--accent-violet, #8b5cf6)" />
                        Diagnostic Thought Chain ({m.thinking.length} automated steps)
                      </span>
                      {expandedThinking[m.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>

                    {expandedThinking[m.id] && (
                      <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px", color: "var(--ink-secondary, #94a3b8)" }}>
                        {m.thinking.map((step, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                            <span className="mono" style={{ color: "var(--accent-teal, #10b981)", fontSize: "10px" }}>{idx + 1}.</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Markdown Text Body */}
                <div
                  className="chat-markdown"
                  style={{
                    fontSize: "13px",
                    lineHeight: 1.55,
                    color: "var(--ink-primary, #ffffff)"
                  }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.text}
                  </ReactMarkdown>
                </div>

                {/* User Message Timestamp Subtly Below Text */}
                {!isBot && (
                  <div style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "5px"
                  }}>
                    <span className="mono" style={{ fontSize: "10px", color: "var(--ink-tertiary, #64748b)" }}>
                      {m.timestamp}
                    </span>
                  </div>
                )}

                {/* DYNAMIC ARTIFACT: RCA REPORT & TIMELINE */}
                {isBot && m.artifact && m.artifact.type === "RCA_REPORT" && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "16px 18px",
                      borderRadius: "8px",
                      background: "rgba(16, 185, 129, 0.05)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <ShieldCheck size={16} color="var(--accent-teal, #10b981)" />
                        <strong style={{ fontSize: "13px", color: "var(--ink-primary, #ffffff)" }}>
                          {m.artifact.title}
                        </strong>
                      </div>
                      <span className="badge badge-teal" style={{ fontSize: "10px" }}>
                        Confidence: {Math.round(m.artifact.confidence_score * 100)}%
                      </span>
                    </div>

                    <div style={{ padding: "10px 12px", background: "rgba(0,0,0,0.3)", borderRadius: "6px", borderLeft: "3px solid var(--accent-teal)" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-teal)", textTransform: "uppercase" }}>Primary Root Cause:</span>
                      <p style={{ fontSize: "12.5px", color: "#fff", marginTop: "2px", marginBottom: "4px" }}>
                        {m.artifact.root_cause}
                      </p>
                      <span style={{ fontSize: "11px", color: "var(--accent-amber)" }}>{m.artifact.impact}</span>
                    </div>

                    {/* Timeline */}
                    {m.artifact.timeline && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11.5px", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                        {m.artifact.timeline.map((item, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span className="mono" style={{ color: "var(--prism-pink)", width: "65px" }}>{item.time}</span>
                            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--accent-teal)" }} />
                            <span style={{ color: "var(--ink-secondary)" }}>{item.event}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* DYNAMIC ARTIFACT: METRIC CHART */}
                {isBot && m.metricChart && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "16px",
                      borderRadius: "8px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid var(--border-subtle)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-primary)" }}>
                        {m.metricChart.title}
                      </span>
                      <span className="mono badge badge-magenta" style={{ fontSize: "10px" }}>
                        p99 Saturated at 30,000ms
                      </span>
                    </div>

                    <div style={{ height: "140px", display: "flex", alignItems: "flex-end", gap: "8px" }}>
                      {m.metricChart.points.map((pt, idx) => {
                        const heightPct = Math.min(100, Math.max(8, Math.round((pt.p99 / 30000) * 100)));
                        const isSpike = pt.errors > 50;
                        return (
                          <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%", justifyContent: "flex-end" }}>
                            <span className="mono" style={{ fontSize: "9px", color: isSpike ? "var(--prism-pink)" : "var(--ink-tertiary)" }}>
                              {pt.p99 > 1000 ? `${(pt.p99/1000).toFixed(0)}s` : `${pt.p99}ms`}
                            </span>
                            <div
                              style={{
                                width: "100%",
                                height: `${heightPct}%`,
                                borderRadius: "4px 4px 0 0",
                                background: isSpike ? "var(--prism-gradient)" : "var(--accent-teal)",
                                boxShadow: isSpike ? "0 0 10px var(--prism-glow)" : "none"
                              }}
                            />
                            <span className="mono" style={{ fontSize: "9.5px", color: "var(--ink-tertiary)" }}>{pt.time}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* GOVERNED ACTION PROPOSALS SECTION */}
                {isBot && m.actionProposals && m.actionProposals.length > 0 && (
                  <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-amber)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Governed Action Proposals Requiring Authorization:
                    </span>

                    {m.actionProposals.map((proposal) => {
                      const proposalStatus = activeProposalStates[proposal.id] || proposal.status || "PENDING_APPROVAL";
                      const isJira = proposal.type === "JIRA_COMMENT";

                      return (
                        <div
                          key={proposal.id}
                          style={{
                            padding: "14px 16px",
                            borderRadius: "8px",
                            background: isJira ? "rgba(59, 130, 246, 0.08)" : "rgba(245, 158, 11, 0.08)",
                            border: isJira ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {isJira ? <MessageSquare size={16} color="var(--accent-blue, #3b82f6)" /> : <Terminal size={16} color="var(--accent-amber, #f59e0b)" />}
                              <strong style={{ fontSize: "12.5px", color: "var(--ink-primary, #fff)" }}>
                                {proposal.title}
                              </strong>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span className="mono badge badge-amber" style={{ fontSize: "9.5px" }}>
                                {proposal.id}
                              </span>
                              <span className={`badge ${proposalStatus === "EXECUTED" ? "badge-teal" : proposalStatus === "REJECTED" ? "badge-rose" : "badge-magenta"}`} style={{ fontSize: "9.5px" }}>
                                {proposalStatus}
                              </span>
                            </div>
                          </div>

                          {proposal.diff && (
                            <div
                              style={{
                                padding: "8px 10px",
                                background: "#000",
                                borderRadius: "4px",
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: "11px",
                                lineHeight: 1.4
                              }}
                            >
                              {proposal.diff.split("\n").map((line, lIdx) => (
                                <div key={lIdx} style={{ color: line.startsWith("+") ? "var(--accent-teal)" : line.startsWith("-") ? "var(--accent-rose)" : "var(--ink-secondary)" }}>
                                  {line}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Approval Actions */}
                          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                            {proposalStatus === "EXECUTED" ? (
                              <span className="badge badge-teal" style={{ fontSize: "11px", gap: "4px" }}>
                                <CheckCircle2 size={12} /> Executed & Verified
                              </span>
                            ) : proposalStatus === "REJECTED" ? (
                              <span className="badge badge-rose" style={{ fontSize: "11px", gap: "4px" }}>
                                <X size={12} /> Dismissed
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleRejectProposal(proposal)}
                                  className="btn-secondary"
                                  style={{ fontSize: "11.5px", padding: "5px 12px" }}
                                >
                                  Dismiss
                                </button>
                                <button
                                  onClick={() => handleApproveProposal(proposal)}
                                  className={isJira ? "btn-primary" : "btn-teal"}
                                  style={{ fontSize: "11.5px", padding: "5px 14px", gap: "5px" }}
                                >
                                  <Check size={12} />
                                  {isJira ? "Authenticate & Post to Jira" : "Approve & Execute via Broker"}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* User Avatar with Initials */}
              {!isBot && (() => {
                const clean = (delegatedIdentity || "Sarah Jones").replace(/@.*$/, "").replace(/[^a-zA-Z]/g, " ").trim();
                const parts = clean.split(/\s+/).filter(Boolean);
                const initials = parts.length >= 2 
                  ? (parts[0][0] + parts[1][0]).toUpperCase() 
                  : (clean.slice(0, 2).toUpperCase() || "KB");
                return (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "var(--prism-gradient, linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%))",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "11.5px",
                      letterSpacing: "0.5px",
                      flexShrink: 0,
                      boxShadow: "0 0 10px rgba(236, 72, 153, 0.3)"
                    }}
                    title={delegatedIdentity}
                  >
                    {initials}
                  </div>
                );
              })()}
            </div>
          );
        })}

        {isGenerating && (() => {
          const progressPct = Math.min(96, Math.max(14, Math.round((elapsedTimer / 3.8) * 92) + 8));
          const stage = elapsedTimer < 0.8 ? 0 : elapsedTimer < 1.8 ? 1 : elapsedTimer < 2.8 ? 2 : 3;

          const stages = [
            { id: 0, title: "Tool Conduits Dispatch", desc: "Querying PostgreSQL Primary, Datadog APM & Splunk in parallel...", icon: "⚡" },
            { id: 1, title: "Telemetry Anomaly Extraction", desc: "Tracing HikariCP connection pool timeout exceptions & lock contention...", icon: "🔍" },
            { id: 2, title: "OKF v2.0 Correlation", desc: "Cross-referencing historical incident cases & runbook match scores...", icon: "🧠" },
            { id: 3, title: "RCA Synthesis & Staging", desc: "Formulating verified root cause & staging cryptographic action proposals...", icon: "🛡️" }
          ];

          return (
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", maxWidth: "90%" }}>
              <div style={{
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                background: "var(--prism-gradient, linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 0 14px var(--prism-glow, rgba(236, 72, 153, 0.3))"
              }}>
                <RotateCw size={16} color="#fff" className="spin" />
              </div>

              <div
                style={{
                  flex: 1,
                  padding: "16px 20px",
                  background: "var(--bg-card, #0b102b)",
                  border: "1.5px solid rgba(139, 125, 255, 0.4)",
                  borderRadius: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-violet, #8b5cf6)", fontWeight: 700, fontSize: "12.5px" }}>
                    <Activity size={15} />
                    <span>Autonomous SRE Diagnostic Engine Active</span>
                    <span className="radar-ping-dot" style={{ width: "6px", height: "6px" }} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="mono badge badge-violet" style={{ fontSize: "9.5px" }}>
                      ⚡ {elapsedTimer}s • {progressPct}% Progress
                    </span>
                    <button
                      onClick={() => setIsGenerating(false)}
                      className="btn-ghost"
                      style={{ fontSize: "10.5px", padding: "2px 6px", color: "var(--ink-tertiary)" }}
                    >
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>

                {/* Shimmer Progress Bar */}
                <div style={{ width: "100%", height: "6px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "3px", overflow: "hidden" }}>
                  <div
                    className="thinking-progress-bar"
                    style={{
                      width: `${progressPct}%`,
                      height: "100%",
                      borderRadius: "3px",
                      transition: "width 0.2s ease-out"
                    }}
                  />
                </div>

                {/* Diagnostic Stage */}
                <div style={{ padding: "8px 12px", background: "rgba(0, 0, 0, 0.25)", borderRadius: "6px", borderLeft: "3px solid var(--accent-teal)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
                    <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--accent-teal)", textTransform: "uppercase" }}>
                      {stages[stage].icon} Stage {stage + 1}/4: {stages[stage].title}
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#fff", margin: 0, lineHeight: 1.4 }}>
                    {stages[stage].desc}
                  </p>
                </div>

                {/* Steering Guidance Feedback */}
                {activeSteeringFocus && (
                  <div style={{ padding: "6px 10px", background: "rgba(236, 72, 153, 0.12)", border: "1px solid rgba(236, 72, 153, 0.3)", borderRadius: "6px", fontSize: "11px", color: "var(--prism-pink)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Sparkles size={12} />
                    <span><strong>Diagnostic Focus Shifted:</strong> Agent prioritizing <em>"{activeSteeringFocus}"</em>!</span>
                  </div>
                )}

                {/* Interactive Peek Chips */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--ink-tertiary)" }}>
                    🔍 Peek Live Telemetry Packets:
                  </span>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => setActivePeekTelemetry(activePeekTelemetry === "db" ? null : "db")}
                      className="btn-ghost"
                      style={{ fontSize: "10.5px", padding: "3px 8px", background: activePeekTelemetry === "db" ? "rgba(59, 130, 246, 0.2)" : "rgba(255,255,255,0.04)", borderRadius: "4px" }}
                    >
                      🐘 Peek: DB Locks
                    </button>
                    <button
                      onClick={() => setActivePeekTelemetry(activePeekTelemetry === "apm" ? null : "apm")}
                      className="btn-ghost"
                      style={{ fontSize: "10.5px", padding: "3px 8px", background: activePeekTelemetry === "apm" ? "rgba(236, 72, 153, 0.2)" : "rgba(255,255,255,0.04)", borderRadius: "4px" }}
                    >
                      🐶 Peek: APM Spike
                    </button>
                    <button
                      onClick={() => setActivePeekTelemetry(activePeekTelemetry === "k8s" ? null : "k8s")}
                      className="btn-ghost"
                      style={{ fontSize: "10.5px", padding: "3px 8px", background: activePeekTelemetry === "k8s" ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.04)", borderRadius: "4px" }}
                    >
                      ☸️ Peek: Pod Health
                    </button>
                  </div>

                  {activePeekTelemetry && (
                    <div style={{ padding: "8px 10px", background: "#000", borderRadius: "4px", fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--ink-secondary)" }}>
                      {activePeekTelemetry === "db" && "pg_stat_activity: 20/20 saturated. PID 19420 holding lock on billing_transactions."}
                      {activePeekTelemetry === "apm" && "Datadog APM: 420 PoolAcquireTimeoutException errors/min on /v1/webhooks/charges."}
                      {activePeekTelemetry === "k8s" && "stripe-webhook-worker: 4 restarts in last 10m (liveness check failed)."}
                    </div>
                  )}
                </div>

                {/* Steering Guidance Chips */}
                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "8px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>🎯 Steer:</span>
                  <button
                    onClick={() => setActiveSteeringFocus("HikariCP Pool Exhaustion")}
                    className="btn-ghost"
                    style={{ fontSize: "10px", padding: "2px 6px", background: "rgba(255,255,255,0.04)", borderRadius: "3px" }}
                  >
                    Focus Connection Pool
                  </button>
                  <button
                    onClick={() => setActiveSteeringFocus("Envoy 504 Timeout")}
                    className="btn-ghost"
                    style={{ fontSize: "10px", padding: "2px 6px", background: "rgba(255,255,255,0.04)", borderRadius: "3px" }}
                  >
                    Focus Envoy 504
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Input Footer Bar */}
      <div
        style={{
          padding: "14px 20px",
          background: "var(--bg-elevated, #111638)",
          borderTop: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}
      >
        <input
          type="text"
          placeholder="Ask the autonomous SRE agent (e.g. 'Show active lock queries from pg_stat_activity' or 'Check pod health')..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isGenerating}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "8px",
            background: "var(--bg-input, rgba(0, 0, 0, 0.35))",
            border: "1px solid var(--border-card, rgba(255, 255, 255, 0.08))",
            color: "var(--ink-primary, #ffffff)",
            fontSize: "12.5px",
            outline: "none"
          }}
        />

        <button
          onClick={() => handleSend()}
          disabled={!inputValue.trim() || isGenerating}
          className="btn-primary"
          style={{
            padding: "10px 18px",
            gap: "6px",
            opacity: !inputValue.trim() || isGenerating ? 0.6 : 1
          }}
        >
          <Send size={14} /> Send
        </button>
      </div>

      {/* 5. Jira OAuth Delegation Modal */}
      {jiraAuthModalOpen && (
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
              width: "440px",
              padding: "24px",
              background: "var(--bg-card, #0b102b)",
              border: "1px solid var(--border-card)",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Lock size={18} color="var(--accent-blue)" />
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Jira Delegation Authentication</h3>
              </div>
              <button onClick={() => setJiraAuthModalOpen(false)} className="btn-ghost" style={{ padding: "4px" }}>
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", lineHeight: 1.45 }}>
              In accordance with enterprise zero-trust policy, posting comments or updating status on Jira ticket <strong style={{ color: "#fff" }}>{currentJiraProposal?.ticket_key}</strong> requires an active OAuth 2.0 delegated session for <strong style={{ color: "var(--accent-teal)" }}>{delegatedIdentity}</strong>.
            </p>

            <div style={{ padding: "10px 12px", background: "rgba(0,0,0,0.3)", borderRadius: "6px", fontSize: "11px", color: "var(--ink-tertiary)" }}>
              Session Token: <code style={{ color: "var(--prism-pink)" }}>oauth2_bearer_delegated_valid</code>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setJiraAuthModalOpen(false)} className="btn-secondary" style={{ fontSize: "12px" }}>
                Cancel
              </button>
              <button
                onClick={handleAuthenticateJira}
                disabled={isAuthenticatingJira}
                className="btn-primary"
                style={{ fontSize: "12px", gap: "6px" }}
              >
                {isAuthenticatingJira ? <RotateCw size={13} className="spin" /> : <ShieldCheck size={14} />}
                {isAuthenticatingJira ? "Authenticating..." : "Authorize & Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
