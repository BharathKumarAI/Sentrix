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
  CheckCircle2,
  X
} from "lucide-react";

/**
 * SentrixAutonomousChat
 * Standalone, enterprise-grade AI chat component for autonomous incident response.
 * Features:
 * - Streaming Markdown rendering (GFM tables, blockquotes, code blocks)
 * - Collapsible "Thinking Process" accordion showing internal chain-of-thought
 * - Code syntax highlighting with one-click copy
 * - Governed Action Proposal cards with cryptographic approval buttons
 * - Diagnostic Tool Evidence badges & execution artifacts
 * - Quick-action prompt chips & suggested queries
 */
export function SentrixAutonomousChat({
  ticketKey = "BILL-1049",
  serviceName = "Payment Ledger & Webhooks",
  initialMessages = null,
  onActionApprove = null,
  onActionReject = null,
  onSendMessage = null,
  readOnly = false,
  height = "100%",
  style = {}
}) {
  const defaultInitialMessages = [
    {
      id: "msg-1",
      role: "assistant",
      timestamp: "Just now",
      generationTime: "1.2s",
      thinking: [
        "Ingested ticket payload for " + ticketKey + " (" + serviceName + ").",
        "Dispatched read-only probe to PostgreSQL primary pool: pg_stat_activity shows 20/20 active connections saturated.",
        "Cross-referenced Datadog logs: PoolAcquireTimeoutException spiking at 420 events/min.",
        "Verified OKF case-based precedent OKF-RUN-402 (HikariCP pool starvation).",
        "Formulated recommended configuration expansion and staged Action Proposal."
      ],
      text: `### Autonomous Triage & Diagnostics for \`${ticketKey}\`

I have completed the telemetry analysis across the connected tool conduits:

1. **Root Cause Identification:** HikariCP connection pool exhaustion on the primary database replica (\`billing-db-primary\`).
2. **Failure Path:** \`/v1/webhooks/charges\` batch unindexed lock cascade causing \`504 Gateway Timeouts\`.
3. **SLA Impact:** 99.98% degraded to 98.42% over the last 15 minutes.

You can inspect the verified query evidence below or approve the staged configuration proposal to expand the connection pool.`,
      toolArtifacts: [
        {
          type: "query_result",
          tool: "PostgreSQL Primary (pg_stat_activity)",
          code: "SELECT datname, count(*), state FROM pg_stat_activity WHERE datname = 'billing_ledger' GROUP BY datname, state;",
          result: [
            { datname: "billing_ledger", count: "20", state: "active (holding locks)" },
            { datname: "billing_ledger", count: "142", state: "waiting in queue" }
          ]
        }
      ],
      actionProposal: {
        id: "PROP-9041",
        title: "Expand HikariCP Maximum Pool Size (20 → 50)",
        tool: "Kubernetes ConfigMap / Application YML",
        target: "infra/k8s/billing-webhook-worker-config.yaml",
        blastRadius: "LOW • Zero Downtime Rolling Restart",
        status: "PENDING_APPROVAL",
        diff: `- maximum-pool-size: 20
+ maximum-pool-size: 50
+ leak-detection-threshold: 4000`
      }
    }
  ];

  const [messages, setMessages] = useState(initialMessages || defaultInitialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState({ "msg-1": false });
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [approvedActionIds, setApprovedActionIds] = useState(new Set());
  const [rejectedActionIds, setRejectedActionIds] = useState(new Set());
  const messagesEndRef = useRef(null);

  const suggestedPrompts = [
    "Explain the primary vs secondary root cause",
    "Show active lock queries from pg_stat_activity",
    "Verify if circuit breaker was triggered",
    "Draft executive incident postmortem"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleToggleThinking = (msgId) => {
    setExpandedThinking((prev) => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleApproveAction = (proposal) => {
    setApprovedActionIds((prev) => new Set([...prev, proposal.id]));
    if (onActionApprove) onActionApprove(proposal);

    // Append assistant confirmation
    const confirmationMsg = {
      id: "msg-" + Date.now(),
      role: "assistant",
      timestamp: "Just now",
      text: `✅ **Action Proposal Authorized & Staged for Deployment**

- **Proposal ID:** \`${proposal.id}\`
- **Target File:** \`${proposal.target}\`
- **Branch Created:** \`fix/${ticketKey}-hikari-pool-expansion\`
- **Status:** Merged to GitLab CI pipeline. Verification probe initiated.`
    };
    setMessages((prev) => [...prev, confirmationMsg]);
  };

  const handleRejectAction = (proposal) => {
    setRejectedActionIds((prev) => new Set([...prev, proposal.id]));
    if (onActionReject) onActionReject(proposal);

    const rejectMsg = {
      id: "msg-" + Date.now(),
      role: "assistant",
      timestamp: "Just now",
      text: `❌ **Action Proposal Cancelled by Engineer**

The proposed patch for \`${proposal.target}\` was dismissed. The system remains in read-only telemetry mode.`
    };
    setMessages((prev) => [...prev, rejectMsg]);
  };

  const handleSend = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isGenerating) return;

    const userMsg = {
      id: "msg-" + Date.now(),
      role: "user",
      timestamp: "Just now",
      text: text.trim()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsGenerating(true);

    if (onSendMessage) {
      try {
        const response = await onSendMessage(text);
        if (response) {
          setMessages((prev) => [...prev, response]);
        }
      } catch (err) {
        console.error("Chat invocation failed", err);
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // Default autonomous responder simulation if no callback supplied
    setTimeout(() => {
      let replyText = `I analyzed your request: **"${text.trim()}"**.

Based on live telemetry for \`${ticketKey}\`, all diagnostic indicators verify that the primary constraint is connection acquisition latency. No packet drops or DNS resolution failures were found in the Envoy proxy logs.`;

      if (text.toLowerCase().includes("root cause")) {
        replyText = `### Root Cause Breakdown for \`${ticketKey}\`

- **Primary Finding:** Connection starvation in HikariCP. The default pool size of \`20\` is insufficient for the batch settlement spike of 400 requests/sec.
- **Secondary Finding:** An unindexed \`UPDATE billing_transactions\` query creates row-level lock contention on PostgreSQL, holding connections open for \`>1800ms\` per query instead of normal \`12ms\`.`;
      } else if (text.toLowerCase().includes("postmortem")) {
        replyText = `### Draft Postmortem: Incident \`${ticketKey}\`

- **Service Impacted:** ${serviceName}
- **Incident Duration:** 18 minutes (14s MTTA, 14m MTTR)
- **Root Cause:** HikariCP connection pool exhaustion during batch billing settlement run.
- **Resolution:** Scaled pool size from 20 to 50; applied missing compound index on \`billing_transactions(account_id, settlement_status)\`.
- **Follow-up Action Items:**
  1. Add Datadog monitor alert for HikariCP pending connection queue \`> 10\`.
  2. Implement circuit breaker fallback on webhook retries.`;
      }

      const botReply = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        timestamp: "Just now",
        generationTime: "0.8s",
        text: replyText
      };

      setMessages((prev) => [...prev, botReply]);
      setIsGenerating(false);
    }, 900);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
      {/* 1. Header Bar */}
      <div
        style={{
          padding: "12px 18px",
          background: "var(--bg-elevated, #111638)",
          borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--prism-gradient, linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff"
            }}
          >
            <Bot size={18} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-primary, #ffffff)" }}>
                Sentrix Autonomous SRE Agent
              </span>
              <span className="badge badge-teal" style={{ fontSize: "9.5px" }}>
                Active Session
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--ink-secondary, #94a3b8)", marginTop: "1px" }}>
              Context: <strong style={{ color: "var(--prism-pink, #ec4899)" }}>{ticketKey}</strong> • {serviceName}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="mono badge badge-violet" style={{ fontSize: "10px" }}>
            ADK 2.8 Runtime
          </span>
        </div>
      </div>

      {/* 2. Message History Stream */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}
      >
        {messages.map((m) => {
          const isBot = m.role === "assistant";
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignSelf: isBot ? "flex-start" : "flex-end",
                maxWidth: isBot ? "88%" : "75%",
                gap: "8px"
              }}
            >
              {/* Message Shell */}
              <div
                style={{
                  padding: "16px 18px",
                  borderRadius: "10px",
                  background: isBot ? "var(--bg-card, #0b102b)" : "rgba(236, 72, 153, 0.12)",
                  border: isBot ? "1px solid var(--border-card, rgba(255, 255, 255, 0.08))" : "1px solid rgba(236, 72, 153, 0.35)"
                }}
              >
                {/* Meta Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                    borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))",
                    paddingBottom: "6px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {isBot ? <Bot size={14} color="var(--prism-pink, #ec4899)" /> : <User size={14} color="var(--accent-teal, #10b981)" />}
                    <span style={{ fontSize: "12px", fontWeight: 700, color: isBot ? "var(--prism-pink, #ec4899)" : "var(--ink-primary, #fff)" }}>
                      {isBot ? "Autonomous Agent" : "You (Domain Engineer)"}
                    </span>
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

                {/* Collapsible Chain of Thought Accordion */}
                {isBot && m.thinking && m.thinking.length > 0 && (
                  <div
                    style={{
                      marginBottom: "12px",
                      borderRadius: "6px",
                      background: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))",
                      overflow: "hidden"
                    }}
                  >
                    <div
                      onClick={() => handleToggleThinking(m.id)}
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
                        Thinking Process ({m.thinking.length} diagnostic steps)
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

                {/* Tool Artifacts (Data Tables / Diagnostics) */}
                {isBot && m.toolArtifacts && m.toolArtifacts.length > 0 && (
                  <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {m.toolArtifacts.map((art, idx) => (
                      <div
                        key={idx}
                        style={{
                          borderRadius: "8px",
                          background: "var(--bg-app, #070a1c)",
                          border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))",
                          overflow: "hidden"
                        }}
                      >
                        <div
                          style={{
                            padding: "8px 12px",
                            background: "rgba(255, 255, 255, 0.04)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "var(--accent-teal, #10b981)"
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Table size={12} /> {art.tool}
                          </span>
                          <button
                            onClick={() => handleCopyCode(art.code, `art-${idx}`)}
                            style={{ background: "none", border: "none", color: "var(--ink-secondary, #94a3b8)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "10px" }}
                          >
                            {copiedCodeId === `art-${idx}` ? <Check size={11} color="var(--accent-teal)" /> : <Copy size={11} />} Copy SQL
                          </button>
                        </div>

                        {art.result && (
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11.5px" }}>
                              <thead>
                                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                                  {Object.keys(art.result[0] || {}).map((col) => (
                                    <th key={col} style={{ padding: "8px 12px", textAlign: "left", color: "var(--ink-tertiary, #64748b)" }}>
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {art.result.map((row, rIdx) => (
                                  <tr key={rIdx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                    {Object.values(row).map((val, cIdx) => (
                                      <td key={cIdx} style={{ padding: "8px 12px", fontFamily: "monospace", color: "var(--ink-primary, #fff)" }}>
                                        {val}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Governed Action Proposal Card */}
                {isBot && m.actionProposal && (
                  <div
                    style={{
                      marginTop: "14px",
                      padding: "14px 16px",
                      borderRadius: "8px",
                      background: "rgba(245, 158, 11, 0.08)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <ShieldCheck size={16} color="var(--accent-amber, #f59e0b)" />
                        <strong style={{ fontSize: "12.5px", color: "var(--ink-primary, #fff)" }}>
                          {m.actionProposal.title}
                        </strong>
                      </div>
                      <span className="mono badge badge-amber" style={{ fontSize: "10px" }}>
                        {m.actionProposal.id}
                      </span>
                    </div>

                    <div style={{ fontSize: "11px", color: "var(--ink-secondary, #94a3b8)" }}>
                      Target: <code style={{ color: "#fff" }}>{m.actionProposal.target}</code> • Blast Radius: {m.actionProposal.blastRadius}
                    </div>

                    {/* Diff Snippet */}
                    <div
                      style={{
                        padding: "10px 12px",
                        background: "#000",
                        borderRadius: "6px",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "11px",
                        lineHeight: 1.45,
                        overflowX: "auto"
                      }}
                    >
                      {m.actionProposal.diff.split("\n").map((line, lIdx) => (
                        <div
                          key={lIdx}
                          style={{
                            color: line.startsWith("+") ? "var(--accent-teal, #10b981)" : line.startsWith("-") ? "var(--accent-rose, #ef4444)" : "var(--ink-secondary, #94a3b8)"
                          }}
                        >
                          {line}
                        </div>
                      ))}
                    </div>

                    {/* Action Authorization Buttons */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
                      {approvedActionIds.has(m.actionProposal.id) ? (
                        <span className="badge badge-teal" style={{ fontSize: "11px", gap: "4px" }}>
                          <CheckCircle2 size={12} /> Authorized & Deployed
                        </span>
                      ) : rejectedActionIds.has(m.actionProposal.id) ? (
                        <span className="badge badge-rose" style={{ fontSize: "11px", gap: "4px" }}>
                          <X size={12} /> Dismissed
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRejectAction(m.actionProposal)}
                            className="btn-secondary"
                            style={{ fontSize: "11.5px", padding: "5px 12px" }}
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleApproveAction(m.actionProposal)}
                            className="btn-teal"
                            style={{ fontSize: "11.5px", padding: "5px 14px", gap: "5px" }}
                          >
                            <Check size={12} /> Authorize & Apply Patch
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isGenerating && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-teal, #10b981)", fontSize: "12px", padding: "8px" }}>
            <RotateCw size={14} className="spin" />
            <span>Autonomous agent querying tool conduits & executing diagnostic plan...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Suggested Prompt Chips */}
      {!readOnly && (
        <div
          style={{
            padding: "8px 20px",
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            borderTop: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.04))",
            background: "rgba(0, 0, 0, 0.2)"
          }}
        >
          {suggestedPrompts.map((p) => (
            <button
              key={p}
              onClick={() => handleSend(p)}
              disabled={isGenerating}
              style={{
                fontSize: "11px",
                padding: "4px 10px",
                borderRadius: "14px",
                background: "var(--bg-elevated, #111638)",
                border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
                color: "var(--ink-secondary, #94a3b8)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.borderColor = "var(--prism-pink, #ec4899)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--ink-secondary, #94a3b8)";
                e.currentTarget.style.borderColor = "var(--border-subtle, rgba(255, 255, 255, 0.08))";
              }}
            >
              💡 {p}
            </button>
          ))}
        </div>
      )}

      {/* 4. Input Footer Bar */}
      {!readOnly && (
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
            placeholder="Ask the autonomous SRE agent (e.g. 'Show pg_stat_activity lock queries' or 'Explain failure path')..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
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
      )}
    </div>
  );
}
