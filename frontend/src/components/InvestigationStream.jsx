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
  BarChart2, 
  FileText, 
  Table, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  BrainCircuit, 
  Zap, 
  ArrowRight,
  Layers,
  MessageSquare,
  Paperclip,
  X,
  Wrench,
  Info,
  Sliders,
  FileCode
} from "lucide-react";
import { sendChatQuery, submitFeedback } from "../api/client";
import { CodeBlockShowcase } from "./CodeBlockShowcase";
import { ActionApprovalCard } from "./ActionApprovalCard";
import { ToolsEvidenceSidebar } from "./ToolsEvidenceSidebar";

const DEFAULT_CHAT_TOOLS = [
  {
    id: "splunk",
    name: "Splunk Enterprise Logs",
    icon: "🪵",
    category: "Telemetry",
    enabled: true,
    tooltip: "Searches indexed application telemetry, HTTP 5xx codes, and worker exception stack traces."
  },
  {
    id: "postgres",
    name: "Governed PostgreSQL Replica",
    icon: "🗄️",
    category: "Database",
    enabled: true,
    tooltip: "Safe read-replica connection pool inspection, active locks, and slow query diagnostics."
  },
  {
    id: "kubernetes",
    name: "Kubernetes Cluster Inspector",
    icon: "☸️",
    category: "Compute",
    enabled: true,
    tooltip: "Monitors container crash loops, pod readiness probes, and worker replica state."
  },
  {
    id: "okf",
    name: "OKF v2.0 Knowledge Graph",
    icon: "📚",
    category: "Knowledge",
    enabled: true,
    tooltip: "Semantic vector search across organizational runbooks, precedent incidents, and SLAs."
  },
  {
    id: "jira",
    name: "Jira Cloud Connector",
    icon: "🎫",
    category: "ITSM",
    enabled: true,
    tooltip: "Fetches ticket metadata, links comments, and stages governed resolution updates."
  }
];

const FEEDBACK_IMPROVEMENT_CATEGORIES = [
  {
    id: "INACCURATE_DIAGNOSIS",
    label: "Inaccurate Root Cause",
    icon: "❌",
    desc: "Diagnosis doesn't match telemetry or identified incorrect failure domain."
  },
  {
    id: "BAD_REMEDIATION",
    label: "Incorrect Remediation",
    icon: "⚠️",
    desc: "Proposed Jira comment, command, or rollout restart is flawed or risky."
  },
  {
    id: "MISSING_TELEMETRY",
    label: "Missing Telemetry / Tool Omission",
    icon: "🔍",
    desc: "Did not check necessary Splunk logs, PostgreSQL pools, or Kubernetes pods."
  },
  {
    id: "STALE_RUNBOOK",
    label: "Hallucinated or Outdated Runbook",
    icon: "📚",
    desc: "Cited obsolete procedures or irrelevant historical incident precedent."
  },
  {
    id: "AUTH_BLOCKED",
    label: "Authentication / Permission Blocked",
    icon: "🔐",
    desc: "Could not post or execute due to closed Jira OAuth session or RBAC."
  },
  {
    id: "FORMATTING_ERROR",
    label: "Formatting & Presentation Issue",
    icon: "📝",
    desc: "Tables, graphs, or code blocks were difficult to parse or unreadable."
  }
];

export function InvestigationStream({
  activeProject,
  activeEnvironment,
  onSelectEnvironment,
  delegatedIdentity
}) {
  const [messages, setMessages] = useState([
    {
      id: "msg_init_01",
      sender: "ASSISTANT",
      text: `### Welcome to Sentrix Autonomous Investigation Stream\n\nConnected to **${activeProject?.name || "Global Billing"}** in environment \`${activeEnvironment}\` under delegated identity \`${delegatedIdentity}\`.\n\nI can analyze incident telemetry, query logs in Splunk, inspect governed PostgreSQL databases, check Kubernetes pod status, or stage write action approvals for Jira comments and command execution.\n\nHere is an example code snippet for investigating the connection pool:\n\n\`\`\`sql\nSELECT pool_name, active_connections, max_connections, waiting_threads \nFROM pg_stat_activity \nWHERE state = 'active';\n\`\`\`\n\n*Try one of the quick investigation prompts below to generate a report, metric graph, or action approval.*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      generationTime: "0.42s",
      thinking: [
        "Connected to active project namespace and resolved environment routing.",
        "Verified read-replica database pool connection and Splunk log cluster index.",
        "OKF v2.0 knowledge fabric synchronized and ready for queries."
      ],
      artifact: null,
      actionProposals: [],
      feedbackSubmitted: null
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedTimer, setElapsedTimer] = useState(0);
  const [expandedThinking, setExpandedThinking] = useState({ msg_init_01: false });
  const [copiedId, setCopiedId] = useState(null);
  const [feedbackModalMsg, setFeedbackModalMsg] = useState(null);
  const [feedbackCategory, setFeedbackCategory] = useState("INACCURATE_DIAGNOSIS");
  const [feedbackSeverity, setFeedbackSeverity] = useState("MEDIUM");
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [showEvidenceSidebar, setShowEvidenceSidebar] = useState(true);
  const [currentEvidence, setCurrentEvidence] = useState(null);
  const [resolvedEnvInfo, setResolvedEnvInfo] = useState({
    env: activeEnvironment || "prod",
    source: "Auto-Resolved from Ticket BILL-1049 (prod)"
  });
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [toolsConfig, setToolsConfig] = useState(DEFAULT_CHAT_TOOLS);
  const [showToolsPopover, setShowToolsPopover] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const timerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isLoading) {
      setElapsedTimer(0);
      timerRef.current = setInterval(() => {
        setElapsedTimer((prev) => +(prev + 0.1).toFixed(1));
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading]);

  const quickPrompts = [
    { label: "Generate Triage Report & Approvals", query: "Generate a complete incident triage report for 504 gateway timeout on Stripe webhooks with Jira comment and pod restart approvals" },
    { label: "Show Latency & Error Graph", query: "Show telemetry anomaly graph with p99 latency spikes and error rate volume" },
    { label: "Show Database Table", query: "Show table of failed transactions and PostgreSQL pool saturation errors" },
    { label: "Verify K8s Pod Health", query: "Check Kubernetes pod health and readiness probes in billing-prod" }
  ];

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleThinking = (msgId) => {
    setExpandedThinking((prev) => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newAttachments = files.map((f) => ({
      name: f.name,
      size: `${(f.size / 1024).toFixed(1)} KB`,
      type: f.type || "text/plain"
    }));
    setAttachedFiles((prev) => [...prev, ...newAttachments]);
    setShowAttachMenu(false);
  };

  const handleAttachSample = (sample) => {
    setAttachedFiles((prev) => [...prev, sample]);
    setShowAttachMenu(false);
  };

  const removeAttachment = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTool = (toolId) => {
    setToolsConfig((prev) =>
      prev.map((t) => (t.id === toolId ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const setAllTools = (enabled) => {
    setToolsConfig((prev) => prev.map((t) => ({ ...t, enabled })));
  };

  const handleSend = async (queryText = null) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() && attachedFiles.length === 0) return;

    const filesToSend = [...attachedFiles];
    const startTime = performance.now();
    const userMsg = {
      id: `msg_user_${Date.now()}`,
      sender: "USER",
      text: textToSend,
      attachments: filesToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      artifact: null,
      actionProposals: []
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery("");
    setAttachedFiles([]);
    setShowAttachMenu(false);
    setShowToolsPopover(false);
    setIsLoading(true);

    try {
      const activeTools = toolsConfig.filter((t) => t.enabled).map((t) => t.id);
      const res = await sendChatQuery({
        project_id: activeProject?.id || "prj_billing",
        environment: activeEnvironment || "prod",
        query: textToSend,
        delegated_identity: delegatedIdentity,
        enabled_tools: activeTools,
        attachments: filesToSend
      });

      const totalDuration = ((performance.now() - startTime) / 1000).toFixed(2);
      const msgId = `msg_asst_${Date.now()}`;

      if (res.tools_evidence) {
        setCurrentEvidence(res.tools_evidence);
      }

      if (res.resolved_environment) {
        setResolvedEnvInfo({
          env: res.resolved_environment,
          source: res.resolution_source || `Auto-Resolved (${res.resolved_environment})`
        });
        if (onSelectEnvironment) {
          onSelectEnvironment(res.resolved_environment);
        }
      }

      const activeToolNames = toolsConfig.filter((t) => t.enabled).map((t) => t.name).join(", ") || "None";
      const thinkingSteps = [
        `1. Resolved target project "${activeProject?.project_key || 'BILLING'}" in environment "${res.resolved_environment || activeEnvironment}".`,
        `2. Dispatched concurrent queries across enabled tools: [${activeToolNames}].`,
        filesToSend.length > 0 ? `3. Correlated ${filesToSend.length} attached diagnostic file(s) against real-time telemetry.` : `3. Correlated real-time telemetry anomalies against OKF v2.0 historical incident cases.`,
        `4. Staged human-governed action proposals (Jira comment & pod restart) in ${totalDuration}s.`
      ];

      const assistantMsg = {
        id: msgId,
        sender: "ASSISTANT",
        text: res.answer,
        artifact: res.artifact,
        actionProposals: res.action_proposals || [],
        generationTime: `${totalDuration}s`,
        thinking: thinkingSteps,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        matchedCases: res.matched_cases || [],
        feedbackSubmitted: null
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error", err);
      const errMsg = {
        id: `msg_err_${Date.now()}`,
        sender: "ASSISTANT",
        text: "⚠️ **Investigation Error**: Unable to reach backend agent broker. Please ensure the Sentrix server daemon is running on port 8000.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        generationTime: "0.10s",
        thinking: ["Failed to connect to agent broker endpoint."],
        artifact: null,
        actionProposals: []
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (msgId, signalType, score = null) => {
    try {
      await submitFeedback({
        source_type: "MESSAGE",
        source_id: msgId,
        user_id: "usr_admin_01",
        signal_type: signalType,
        score: score
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, feedbackSubmitted: signalType } : m))
      );
    } catch (e) {
      console.error("Feedback submission error", e);
    }
  };

  const handleDislikeClick = (msg) => {
    setFeedbackModalMsg(msg);
    setFeedbackCategory("INACCURATE_DIAGNOSIS");
    setFeedbackSeverity("MEDIUM");
    setFeedbackNotes("");
  };

  const handleDetailedFeedbackSubmit = async () => {
    if (!feedbackModalMsg) return;
    setIsSubmittingFeedback(true);
    try {
      await submitFeedback({
        source_type: "MESSAGE",
        source_id: feedbackModalMsg.id,
        user_id: "usr_admin_01",
        signal_type: "THUMBS_DOWN",
        score: 1,
        category: feedbackCategory,
        severity: feedbackSeverity,
        notes: feedbackNotes
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === feedbackModalMsg.id
            ? {
                ...m,
                feedbackSubmitted: "THUMBS_DOWN",
                feedbackCategory: feedbackCategory,
                feedbackNotes: feedbackNotes
              }
            : m
        )
      );
      setFeedbackModalMsg(null);
    } catch (err) {
      console.error("Failed to submit detailed feedback", err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Custom Markdown renderers for Code Blocks
  const markdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const codeString = String(children).replace(/\n$/, "");
      if (!inline && match) {
        return (
          <CodeBlockShowcase
            language={match[1].toUpperCase()}
            code={codeString}
            title={match[1] === "sql" ? "Governed Database Query" : match[1] === "bash" ? "Shell Command" : undefined}
          />
        );
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  return (
    <div style={{
      width: "100%",
      height: "calc(100vh - 64px - 36px)",
      display: "flex",
      flexDirection: "row",
      background: "var(--bg-app)",
      overflow: "hidden"
    }}>
      {/* CENTER AREA: Focused directly on user conversation, answers, code, and approvals */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden"
      }}>
        {/* Sub-header Bar: Cleaned up without redundant duplication */}
        <div style={{
          padding: "10px 24px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-elevated)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--ink-secondary)", fontWeight: "600" }}>
              Autonomous Incident Investigation Session
            </span>
            <span className="mono badge badge-violet" style={{ fontSize: "10px" }}>
              Identity: {delegatedIdentity}
            </span>
          </div>

          <button
            className="btn-secondary"
            onClick={() => setShowEvidenceSidebar(!showEvidenceSidebar)}
            style={{ fontSize: "11.5px", padding: "4px 10px", gap: "6px" }}
            title="Toggle Tools-Wise Evidence Sidebar"
          >
            <Layers size={13} color="var(--prism-pink)" />
            <span>Tools Evidence (4)</span>
            <span className="badge badge-magenta" style={{ fontSize: "9px", padding: "0 5px" }}>
              {showEvidenceSidebar ? "Hide" : "Show"}
            </span>
          </button>
        </div>

        {/* Messages Stream */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 28px",
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}>
          {messages.map((m) => {
            const isAssistant = m.sender === "ASSISTANT";
            const hasArtifact = !!m.artifact;
            const hasApprovals = m.actionProposals && m.actionProposals.length > 0;
            const isThinkingOpen = expandedThinking[m.id];

            return (
              <div
                key={m.id}
                className="message-animate-in"
                style={{
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                  alignSelf: isAssistant ? "flex-start" : "flex-end",
                  width: isAssistant ? (hasArtifact || hasApprovals ? "100%" : "90%") : "auto",
                  maxWidth: isAssistant ? "100%" : "75%"
                }}
              >
                {/* Assistant Avatar */}
                {isAssistant && (
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "var(--prism-gradient)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 4px 14px var(--prism-glow)"
                  }}>
                    <Bot size={18} color="#fff" />
                  </div>
                )}

                {/* Message Bubble Card */}
                <div className="glass-card" style={{
                  flex: 1,
                  padding: "20px 24px",
                  background: isAssistant ? "var(--card-bg-chat)" : "rgba(225, 29, 72, 0.12)",
                  border: isAssistant ? "1px solid var(--border-card)" : "1px solid rgba(225, 29, 72, 0.35)",
                }}>
                  {/* Message Header Bar */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "14px",
                    borderBottom: "1px solid var(--border-subtle)",
                    paddingBottom: "10px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: "700", color: isAssistant ? "var(--prism-pink)" : "var(--ink-primary)" }}>
                        {isAssistant ? "Sentrix Agent Runtime" : delegatedIdentity}
                      </span>
                      {isAssistant && (
                        <span className="badge badge-teal" style={{ fontSize: "9.5px" }}>
                          Verified Telemetry
                        </span>
                      )}
                      {isAssistant && m.generationTime && (
                        <span className="mono badge badge-violet" style={{ fontSize: "9.5px" }}>
                          <Zap size={10} /> {m.generationTime}
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="mono" style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                        {m.timestamp}
                      </span>
                      <button
                        className="btn-ghost"
                        style={{ padding: "4px" }}
                        onClick={() => handleCopyText(m.text, m.id)}
                        title="Copy message content"
                      >
                        {copiedId === m.id ? <Check size={13} color="var(--accent-teal)" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* SHOW THINKING ACCORDION */}
                  {isAssistant && m.thinking && m.thinking.length > 0 && (
                    <div className="thinking-accordion">
                      <div 
                        className="thinking-header"
                        onClick={() => handleToggleThinking(m.id)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <BrainCircuit size={14} />
                          <span>Thinking Process ({m.generationTime || "1.2s"})</span>
                        </div>
                        {isThinkingOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>

                      {isThinkingOpen && (
                        <div className="thinking-body">
                          {m.thinking.map((step, idx) => (
                            <div key={idx} className="thinking-step">
                              <CheckCircle2 size={13} color="var(--accent-teal)" />
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* User Attachments Display */}
                  {!isAssistant && m.attachments && m.attachments.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                      {m.attachments.map((att, i) => (
                        <div key={i} className="prism-card" style={{
                          padding: "5px 10px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "11px",
                          background: "var(--thinking-bg)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "6px"
                        }}>
                          <Paperclip size={12} color="var(--prism-pink)" />
                          <span style={{ fontWeight: "600", color: "var(--ink-primary)" }}>{att.name}</span>
                          <span className="mono" style={{ fontSize: "9.5px", color: "var(--ink-tertiary)" }}>({att.size})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message Markdown Content */}
                  <div className="prism-markdown-body" style={{ fontSize: "13.5px", lineHeight: "1.7" }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {m.text}
                    </ReactMarkdown>
                  </div>

                  {/* ACTION APPROVALS: JIRA COMMENTING & RUN COMMANDS */}
                  {isAssistant && hasApprovals && (
                    <div style={{ marginTop: "18px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--prism-pink)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                        Governed Action Proposals Requiring Authorization:
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {m.actionProposals.map((prop) => (
                          <ActionApprovalCard
                            key={prop.id}
                            proposal={prop}
                            delegatedIdentity={delegatedIdentity}
                            onExecuted={(propId) => {
                              console.log("Proposal executed:", propId);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* DYNAMIC ARTIFACT: TRIAGE REPORT */}
                  {m.artifact?.type === "TRIAGE_REPORT" && (
                    <div className="prism-card" style={{
                      marginTop: "18px",
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      border: "1px solid rgba(16, 185, 129, 0.4)",
                      background: "rgba(16, 185, 129, 0.04)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <FileText size={18} color="var(--accent-teal)" />
                          <h4 style={{ fontSize: "15px", fontWeight: "700", color: "var(--ink-primary)", margin: 0 }}>
                            {m.artifact.title}
                          </h4>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <span className="mono badge badge-teal">{m.artifact.incident_id}</span>
                          <span className="badge badge-magenta">{Math.round(m.artifact.confidence_score * 100)}% Confidence</span>
                        </div>
                      </div>

                      <div style={{
                        padding: "14px 16px",
                        borderRadius: "8px",
                        background: "rgba(0, 0, 0, 0.25)",
                        borderLeft: "4px solid var(--accent-teal)"
                      }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--accent-teal)", textTransform: "uppercase" }}>
                          Verified Root Cause
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--ink-primary)", marginTop: "4px", lineHeight: "1.5", marginBottom: "4px" }}>
                          {m.artifact.root_cause}
                        </p>
                        <div style={{ fontSize: "11px", color: "var(--accent-amber)" }}>
                          Impact: {m.artifact.impact}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase", marginBottom: "8px" }}>
                          Incident Timeline of Events
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {m.artifact.timeline?.map((item, idx) => (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
                              <span className="mono" style={{ color: "var(--prism-pink)", width: "70px", flexShrink: 0 }}>
                                {item.time}
                              </span>
                              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-teal)" }} />
                              <span style={{ color: "var(--ink-secondary)" }}>{item.event}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DYNAMIC ARTIFACT: METRIC CHART */}
                  {m.artifact?.type === "METRIC_CHART" && (
                    <div className="prism-card" style={{
                      marginTop: "16px",
                      padding: "18px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      border: "1px solid rgba(139, 125, 255, 0.4)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <BarChart2 size={16} color="var(--accent-teal)" />
                          <h4 style={{ fontSize: "14px", color: "var(--ink-primary)", margin: 0 }}>{m.artifact.title}</h4>
                        </div>
                        <div style={{ display: "flex", gap: "10px", fontSize: "10.5px" }}>
                          <span style={{ color: "var(--accent-teal)" }}>• p99 Latency (ms)</span>
                          <span style={{ color: "var(--prism-pink)" }}>• Error Spike Volume</span>
                        </div>
                      </div>

                      <div style={{
                        background: "rgba(0, 0, 0, 0.25)",
                        padding: "16px 12px 10px 12px",
                        borderRadius: "8px",
                        height: "170px",
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        gap: "10px"
                      }}>
                        {m.artifact.metric_points?.map((pt) => {
                          const heightPct = Math.min(100, Math.round((pt.p99 / 4000) * 100));
                          const isSpike = pt.errors > 30;
                          return (
                            <div key={pt.time} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%", justifyContent: "flex-end" }}>
                              <span className="mono" style={{ fontSize: "9.5px", color: isSpike ? "var(--prism-pink)" : "var(--ink-tertiary)" }}>
                                {pt.p99}ms
                              </span>
                              <div style={{
                                width: "14px",
                                height: `${heightPct}%`,
                                background: isSpike ? "var(--prism-gradient)" : "linear-gradient(180deg, #10b981 0%, #059669 100%)",
                                borderRadius: "3px 3px 0 0",
                                boxShadow: isSpike ? "0 0 12px var(--prism-glow)" : "none"
                              }} />
                              <span className="mono" style={{ fontSize: "9.5px", color: "var(--ink-tertiary)" }}>{pt.time}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* DYNAMIC ARTIFACT: ENTERPRISE DATA TABLE */}
                  {m.artifact?.type === "DATA_TABLE" && (
                    <div className="prism-card" style={{
                      marginTop: "16px",
                      padding: "18px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                      border: "1px solid rgba(59, 130, 246, 0.4)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <Table size={16} color="var(--accent-blue)" />
                          <h4 style={{ fontSize: "14px", color: "var(--ink-primary)", fontWeight: "700", margin: 0 }}>{m.artifact.title}</h4>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <span className="mono badge badge-blue" style={{ fontSize: "10px" }}>{m.artifact.rows?.length || 0} Records</span>
                          <span className="badge badge-teal" style={{ fontSize: "10px" }}>PII Masked</span>
                        </div>
                      </div>

                      <div style={{ overflowX: "auto" }}>
                        <table className="enterprise-table">
                          <thead>
                            <tr>
                              {m.artifact.columns?.map((c) => (
                                <th key={c}><span>{c}</span></th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {m.artifact.rows?.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className={cIdx === 0 ? "mono" : undefined}>
                                    {cell.includes("FAILED") ? (
                                      <span className="badge badge-rose">{cell}</span>
                                    ) : cell.includes("LOCKED") ? (
                                      <span className="badge badge-amber">{cell}</span>
                                    ) : cell.includes("SETTLED") ? (
                                      <span className="badge badge-teal">{cell}</span>
                                    ) : (
                                      cell
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Follow-up Quick Action Chips */}
                  {isAssistant && (
                    <div style={{
                      marginTop: "16px",
                      paddingTop: "12px",
                      borderTop: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap"
                    }}>
                      <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>Suggested follow-up:</span>
                      <button
                        className="btn-ghost"
                        style={{ fontSize: "11px", padding: "3px 8px", background: "var(--thinking-bg)", borderRadius: "4px" }}
                        onClick={() => handleSend("Explain the root cause and mitigation steps in detail")}
                      >
                        <ArrowRight size={11} color="var(--prism-pink)" /> Explain Root Cause
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ fontSize: "11px", padding: "3px 8px", background: "var(--thinking-bg)", borderRadius: "4px" }}
                        onClick={() => handleSend("Show table of failed transactions")}
                      >
                        <ArrowRight size={11} color="var(--accent-blue)" /> Query Failed DB Rows
                      </button>
                    </div>
                  )}

                  {/* Multi-Level Feedback Footer */}
                  {isAssistant && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: "12px",
                      paddingTop: "10px",
                      borderTop: "1px solid var(--border-subtle)"
                    }}>
                      <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                        Was this investigation response helpful?
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <button
                          className="btn-ghost"
                          style={{
                            padding: "3px 8px",
                            color: m.feedbackSubmitted === "THUMBS_UP" ? "var(--accent-teal)" : "var(--ink-secondary)"
                          }}
                          onClick={() => handleFeedback(m.id, "THUMBS_UP", 5)}
                          title="Helpful & Accurate"
                        >
                          <ThumbsUp size={13} />
                        </button>
                        
                        <button
                          className="btn-ghost"
                          style={{
                            padding: "3px 8px",
                            color: m.feedbackSubmitted === "THUMBS_DOWN" ? "var(--prism-pink)" : "var(--ink-secondary)"
                          }}
                          onClick={() => handleDislikeClick(m)}
                          title="Inaccurate / Needs Improvement (Opens Detailed Categorized Form)"
                        >
                          <ThumbsDown size={13} />
                        </button>

                        {m.feedbackSubmitted === "THUMBS_UP" && (
                          <span className="badge badge-teal" style={{ fontSize: "9px" }}>Helpful ✓</span>
                        )}
                        {m.feedbackSubmitted === "THUMBS_DOWN" && (
                          <span className="badge badge-magenta" style={{ fontSize: "9px" }}>Improvements Flagged</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Categorized Feedback Confirmation Banner */}
                  {isAssistant && m.feedbackSubmitted === "THUMBS_DOWN" && (
                    <div style={{
                      marginTop: "8px",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      background: "rgba(225, 29, 72, 0.08)",
                      border: "1px solid rgba(225, 29, 72, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "11px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--ink-primary)" }}>
                        <CheckCircle2 size={12} color="var(--prism-pink)" />
                        <span>
                          Improvement Recorded: <strong style={{ color: "var(--prism-pink)" }}>
                            {FEEDBACK_IMPROVEMENT_CATEGORIES.find((c) => c.id === m.feedbackCategory)?.label || "Categorized Feedback"}
                          </strong>
                        </span>
                      </div>
                      <button
                        className="btn-ghost"
                        onClick={() => handleDislikeClick(m)}
                        style={{ fontSize: "10.5px", padding: "1px 6px", color: "var(--prism-pink)" }}
                      >
                        Edit Details
                      </button>
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {!isAssistant && (
                  <div style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "10px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-card)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <User size={16} color="var(--ink-primary)" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="message-animate-in" style={{ display: "flex", gap: "14px", alignItems: "flex-start", width: "90%" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "var(--prism-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <RotateCw size={18} color="#fff" className="animate-spin" />
              </div>

              <div className="prism-card" style={{ flex: 1, padding: "16px 20px", background: "var(--thinking-bg)", border: "1px solid rgba(139, 125, 255, 0.4)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-violet)", fontWeight: "600", fontSize: "12.5px" }}>
                    <BrainCircuit size={16} />
                    <span>Thinking & Telemetry Synthesis...</span>
                  </div>
                  <span className="mono badge badge-violet" style={{ fontSize: "10px" }}>{elapsedTimer}s elapsed</span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--ink-secondary)" }}>
                  Correlating Splunk logs, PostgreSQL replica pool, and Kubernetes events in parallel...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Inquiries Quick Carousel */}
        <div style={{
          padding: "8px 24px",
          background: "var(--bg-elevated)",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          overflowX: "auto"
        }}>
          <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: "600", whiteSpace: "nowrap" }}>
            Suggested Inquiries:
          </span>
          {quickPrompts.map((p) => (
            <button
              key={p.label}
              className="btn-secondary"
              style={{ fontSize: "11px", padding: "4px 10px", whiteSpace: "nowrap" }}
              onClick={() => handleSend(p.query)}
              disabled={isLoading}
            >
              <Sparkles size={11} color="var(--prism-pink)" />
              {p.label}
            </button>
          ))}
        </div>

        {/* Chat Input Console */}
        <div style={{
          padding: "12px 24px",
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--bg-elevated)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          position: "relative"
        }}>
          {/* Hidden Native File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            style={{ display: "none" }}
          />

          {/* Attached Files Tray (Above Input) */}
          {attachedFiles.length > 0 && (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              alignItems: "center",
              padding: "6px 12px",
              borderRadius: "8px",
              background: "var(--thinking-bg)",
              border: "1px solid var(--border-subtle)"
            }}>
              <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: "700", textTransform: "uppercase" }}>
                Attached Diagnostics ({attachedFiles.length}):
              </span>
              {attachedFiles.map((f, idx) => (
                <div
                  key={idx}
                  className="badge badge-teal"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    padding: "4px 8px"
                  }}
                >
                  <Paperclip size={11} />
                  <span>{f.name}</span>
                  <span className="mono" style={{ opacity: 0.75 }}>({f.size})</span>
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="btn-ghost"
                    style={{ padding: "1px", marginLeft: "2px", color: "inherit" }}
                    title="Remove attachment"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ATTACH POPOVER MENU */}
          {showAttachMenu && (
            <div className="prism-card" style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: "24px",
              width: "320px",
              padding: "12px",
              zIndex: 120,
              boxShadow: "0 14px 36px rgba(0, 0, 0, 0.4)",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Paperclip size={14} color="var(--prism-pink)" />
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--ink-primary)" }}>Attach Investigation Data</span>
                </div>
                <button className="btn-ghost" style={{ padding: "2px" }} onClick={() => setShowAttachMenu(false)}>
                  <X size={13} />
                </button>
              </div>

              {/* Upload Local File Trigger */}
              <button
                className="btn-secondary"
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowAttachMenu(false);
                }}
                style={{ justifyContent: "flex-start", padding: "8px 10px", fontSize: "12px", gap: "8px" }}
              >
                <FileCode size={14} color="var(--accent-teal)" />
                <span>Upload Local File from Device...</span>
              </button>

              <div style={{ fontSize: "10px", color: "var(--ink-tertiary)", fontWeight: "700", textTransform: "uppercase", marginTop: "4px" }}>
                Quick Diagnostic Samples:
              </div>

              {/* Quick Sample 1 */}
              <div
                onClick={() => handleAttachSample({ name: "stripe_webhook_504.log", size: "24.2 KB", type: "text/plain" })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "11.5px",
                  background: "var(--thinking-bg)",
                  border: "1px solid var(--border-subtle)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <FileText size={13} color="var(--accent-amber)" />
                  <span style={{ color: "var(--ink-primary)", fontWeight: "500" }}>stripe_webhook_504.log</span>
                </div>
                <span className="mono badge badge-amber" style={{ fontSize: "9px" }}>24.2 KB</span>
              </div>

              {/* Quick Sample 2 */}
              <div
                onClick={() => handleAttachSample({ name: "pg_stat_activity_dump.sql", size: "12.8 KB", type: "text/sql" })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "11.5px",
                  background: "var(--thinking-bg)",
                  border: "1px solid var(--border-subtle)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Table size={13} color="var(--accent-teal)" />
                  <span style={{ color: "var(--ink-primary)", fontWeight: "500" }}>pg_stat_activity_dump.sql</span>
                </div>
                <span className="mono badge badge-teal" style={{ fontSize: "9px" }}>12.8 KB</span>
              </div>

              {/* Quick Sample 3 */}
              <div
                onClick={() => handleAttachSample({ name: "k8s_worker_coredump.json", size: "38.5 KB", type: "application/json" })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "11.5px",
                  background: "var(--thinking-bg)",
                  border: "1px solid var(--border-subtle)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Terminal size={13} color="var(--accent-rose)" />
                  <span style={{ color: "var(--ink-primary)", fontWeight: "500" }}>k8s_worker_coredump.json</span>
                </div>
                <span className="mono badge badge-rose" style={{ fontSize: "9px" }}>38.5 KB</span>
              </div>
            </div>
          )}

          {/* TOOLS CONFIGURATION POPOVER WITH RICH TOOLTIPS */}
          {showToolsPopover && (
            <div className="prism-card" style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: "110px",
              width: "420px",
              padding: "16px",
              zIndex: 120,
              boxShadow: "0 18px 42px rgba(0, 0, 0, 0.45)",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <Wrench size={15} color="var(--accent-teal)" />
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink-primary)" }}>Available Chat Investigation Tools</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--ink-secondary)", marginTop: "2px" }}>
                    Enable or disable real-time connectors for this conversation. Hover tooltips to view scope.
                  </p>
                </div>
                <button className="btn-ghost" style={{ padding: "3px" }} onClick={() => setShowToolsPopover(false)}>
                  <X size={14} />
                </button>
              </div>

              {/* Quick Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: "600" }}>
                  {toolsConfig.filter((t) => t.enabled).length} of {toolsConfig.length} Tools Enabled
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="btn-ghost"
                    onClick={() => setAllTools(true)}
                    style={{ fontSize: "10.5px", padding: "2px 6px", color: "var(--accent-teal)" }}
                  >
                    Enable All
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => setAllTools(false)}
                    style={{ fontSize: "10.5px", padding: "2px 6px", color: "var(--ink-secondary)" }}
                  >
                    Disable All
                  </button>
                </div>
              </div>

              {/* Tools List with Tooltips */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {toolsConfig.map((tool) => (
                  <div
                    key={tool.id}
                    title={tool.tooltip}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      background: tool.enabled ? "var(--thinking-bg)" : "transparent",
                      border: `1px solid ${tool.enabled ? "var(--border-subtle)" : "transparent"}`,
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: "16px" }}>{tool.icon}</span>
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: tool.enabled ? "var(--ink-primary)" : "var(--ink-tertiary)",
                            textDecoration: tool.enabled ? "none" : "line-through"
                          }}>
                            {tool.name}
                          </span>
                          <span className="mono badge badge-violet" style={{ fontSize: "8.5px", padding: "1px 5px" }}>
                            {tool.category}
                          </span>
                        </div>
                        <span style={{
                          fontSize: "10.5px",
                          color: "var(--ink-secondary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {tool.tooltip}
                        </span>
                      </div>
                    </div>

                    {/* Enable/Disable Toggle Pill */}
                    <button
                      onClick={() => toggleTool(tool.id)}
                      className="btn-ghost"
                      style={{
                        marginLeft: "10px",
                        padding: "3px 8px",
                        borderRadius: "12px",
                        fontSize: "10px",
                        fontWeight: "700",
                        cursor: "pointer",
                        border: tool.enabled ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid var(--border-subtle)",
                        background: tool.enabled ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.04)",
                        color: tool.enabled ? "var(--accent-teal)" : "var(--ink-tertiary)"
                      }}
                      title={`Click to ${tool.enabled ? "disable" : "enable"} ${tool.name}`}
                    >
                      {tool.enabled ? "ENABLED" : "DISABLED"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Primary Controls Row */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {/* Attach Button */}
            <button
              className="btn-secondary"
              onClick={() => {
                setShowAttachMenu(!showAttachMenu);
                setShowToolsPopover(false);
              }}
              title="Attach logs, database dumps, or diagnostic files"
              style={{
                padding: "10px 12px",
                gap: "6px",
                borderColor: attachedFiles.length > 0 ? "var(--accent-teal)" : undefined,
                background: attachedFiles.length > 0 ? "rgba(16, 185, 129, 0.12)" : undefined
              }}
            >
              <Paperclip size={15} color={attachedFiles.length > 0 ? "var(--accent-teal)" : "var(--prism-pink)"} />
              <span style={{ fontSize: "12px" }}>Attach</span>
              {attachedFiles.length > 0 && (
                <span className="badge badge-teal" style={{ fontSize: "9px", padding: "0 4px" }}>
                  {attachedFiles.length}
                </span>
              )}
            </button>

            {/* Tools Selector Button with Tooltip */}
            <button
              className="btn-secondary"
              onClick={() => {
                setShowToolsPopover(!showToolsPopover);
                setShowAttachMenu(false);
              }}
              title="Available investigation tools: Click to enable or disable connectors for this chat"
              style={{
                padding: "10px 12px",
                gap: "6px",
                borderColor: showToolsPopover ? "var(--prism-pink)" : undefined,
                background: showToolsPopover ? "rgba(225, 29, 72, 0.12)" : undefined
              }}
            >
              <Wrench size={14} color="var(--accent-teal)" />
              <span style={{ fontSize: "12px" }}>
                Tools ({toolsConfig.filter((t) => t.enabled).length}/{toolsConfig.length})
              </span>
            </button>

            {/* Main Prompt Input Box */}
            <input
              type="text"
              placeholder="Ask a question, request a triage report, view error graphs, or query database..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              style={{
                flex: 1,
                padding: "12px 18px",
                background: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                color: "var(--ink-primary)",
                fontSize: "13.5px"
              }}
            />

            {/* Send CTA */}
            <button
              className="btn-primary"
              onClick={() => handleSend()}
              disabled={isLoading || (!inputQuery.trim() && attachedFiles.length === 0)}
              style={{ padding: "12px 20px" }}
            >
              <Send size={15} /> Send
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: Tools-Wise Evidence & Telemetry Inspector */}
      <ToolsEvidenceSidebar
        evidence={currentEvidence || {
          splunk: {
            tool_name: "Splunk Enterprise Cluster",
            latency: "34ms",
            status: "HEALTHY",
            query: 'index=payment_prod sourcetype=gateway_access status>=500 | stats count by error_code, uri_path',
            events: [
              {"time": "14:10:02 UTC", "level": "ERROR", "msg": "PoolAcquireTimeoutException: Timeout after 30000ms waiting for connection"},
              {"time": "14:10:08 UTC", "level": "ERROR", "msg": "HTTP 504 Gateway Timeout on POST /v1/webhooks/charges"}
            ]
          },
          postgres: {
            tool_name: "Governed PostgreSQL Replica",
            latency: "22ms",
            status: "SATURATED",
            metrics: { "active_connections": "20 / 20", "waiting_threads": 48 },
            slow_query: "SELECT * FROM payment_transactions WHERE status = 'PENDING' FOR UPDATE;"
          },
          kubernetes: {
            tool_name: "Kubernetes Cluster Inspector",
            latency: "18ms",
            status: "DEGRADED",
            command: "kubectl get pods -n billing-prod -l app=stripe-webhook-worker",
            pod_events: [
              {"time": "14:15:22 UTC", "reason": "Unhealthy", "message": "Readiness probe failed with statuscode: 503"}
            ]
          },
          okf: {
            tool_name: "OKF v2.0 Knowledge Graph",
            matched_node: "Emergency Payment Gateway Triage Runbook",
            similarity: "94.2%",
            precedent_incident: "INC-4812 (Resolved in 8m)",
            runbook_steps: [
              "1. Confirm connection pool saturation in pg_stat_activity.",
              "2. Trigger governed rollout restart on worker deployment.",
              "3. Verify error rate returns below 0.1% baseline."
            ]
          }
        }}
        isOpen={showEvidenceSidebar}
        onClose={() => setShowEvidenceSidebar(false)}
      />

      {/* DETAILED CATEGORIZED IMPROVEMENT FEEDBACK MODAL */}
      {feedbackModalMsg && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div className="prism-card" style={{
            width: "100%",
            maxWidth: "560px",
            padding: "24px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.55)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(225, 29, 72, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ThumbsDown size={18} color="var(--prism-pink)" />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink-primary)", margin: 0 }}>
                    Investigation Feedback & Improvements
                  </h3>
                  <span style={{ fontSize: "11.5px", color: "var(--ink-secondary)" }}>
                    Categorize the failure or omission to train model directive tuning
                  </span>
                </div>
              </div>
              <button className="btn-ghost" style={{ padding: "4px" }} onClick={() => setFeedbackModalMsg(null)}>
                <X size={16} />
              </button>
            </div>

            {/* Category Selection Grid */}
            <div>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>
                1. Select Improvement Category:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {FEEDBACK_IMPROVEMENT_CATEGORIES.map((cat) => {
                  const isSelected = feedbackCategory === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setFeedbackCategory(cat.id)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border: isSelected ? "1.5px solid var(--prism-pink)" : "1px solid var(--border-subtle)",
                        background: isSelected ? "rgba(225, 29, 72, 0.12)" : "var(--thinking-bg)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "3px",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "14px" }}>{cat.icon}</span>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: isSelected ? "var(--prism-pink)" : "var(--ink-primary)" }}>
                          {cat.label}
                        </span>
                      </div>
                      <span style={{ fontSize: "10px", color: "var(--ink-secondary)", lineHeight: "1.3" }}>
                        {cat.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Severity Selector */}
            <div>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>
                2. Impact / Severity Level:
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { id: "LOW", label: "Minor Inconvenience" },
                  { id: "MEDIUM", label: "Misleading Analysis" },
                  { id: "HIGH", label: "Critical Production Risk" }
                ].map((sev) => {
                  const isSelected = feedbackSeverity === sev.id;
                  return (
                    <button
                      key={sev.id}
                      className="btn-ghost"
                      onClick={() => setFeedbackSeverity(sev.id)}
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        fontSize: "11px",
                        borderRadius: "6px",
                        border: isSelected ? "1.5px solid var(--prism-pink)" : "1px solid var(--border-subtle)",
                        background: isSelected ? "rgba(225, 29, 72, 0.12)" : "var(--thinking-bg)",
                        color: isSelected ? "var(--prism-pink)" : "var(--ink-secondary)",
                        fontWeight: isSelected ? "700" : "500"
                      }}
                    >
                      {sev.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Textarea for Details */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  3. Detailed Observations & Suggestions:
                </label>
                <span style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>Optional</span>
              </div>
              <textarea
                rows={3}
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                placeholder="Specify what should be improved, e.g. Jira authentication was closed and prevented commenting, or database pool queries were missing index telemetry..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  color: "var(--ink-primary)",
                  fontSize: "12px",
                  resize: "vertical",
                  fontFamily: "inherit"
                }}
              />

              {/* Quick Insert Snippet Pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                {[
                  "Jira authentication was closed",
                  "Root cause diagnosis was inaccurate",
                  "Splunk query missed HTTP 504 logs",
                  "Remediation command had high risk"
                ].map((tag) => (
                  <button
                    key={tag}
                    className="btn-ghost"
                    onClick={() => setFeedbackNotes((prev) => (prev ? `${prev}. ${tag}` : tag))}
                    style={{ fontSize: "10px", padding: "2px 7px", background: "var(--thinking-bg)", borderRadius: "12px", border: "1px solid var(--border-subtle)", color: "var(--ink-secondary)" }}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
              <button
                className="btn-ghost"
                onClick={() => setFeedbackModalMsg(null)}
                disabled={isSubmittingFeedback}
                style={{ fontSize: "12px", padding: "7px 14px" }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleDetailedFeedbackSubmit}
                disabled={isSubmittingFeedback}
                style={{ fontSize: "12px", padding: "7px 18px", gap: "6px" }}
              >
                {isSubmittingFeedback ? (
                  <>
                    <RotateCw size={13} className="animate-spin" />
                    <span>Saving Feedback...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Submit Improvement Feedback</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
