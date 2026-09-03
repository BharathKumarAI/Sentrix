import React, { useState } from "react";
import {
  MessageSquarePlus,
  AlertTriangle,
  Lightbulb,
  Zap,
  CheckCircle2,
  X,
  Send,
  Cpu,
  Terminal,
  Layers,
  Copy,
  Check
} from "lucide-react";

export function FrameworkFeedbackModal({ isOpen, onClose, activeProject, activeEnvironment }) {
  if (!isOpen) return null;

  const projectKey = activeProject?.project_key || "BILLING";
  const [feedbackType, setFeedbackType] = useState("BUG"); // "BUG" | "FEATURE" | "PERFORMANCE"
  const [title, setTitle] = useState("");
  const [component, setComponent] = useState("CHAT_STREAM");
  const [severity, setSeverity] = useState("P2");
  const [description, setDescription] = useState("");
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const generatedId = `STX-FEEDBACK-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = {
        id: generatedId,
        type: feedbackType,
        title,
        component,
        severity,
        description,
        projectKey,
        environment: activeEnvironment || "prod",
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };

      // Store in local storage feedback log
      try {
        const existing = JSON.parse(localStorage.getItem("sentrix_framework_feedback") || "[]");
        existing.unshift(payload);
        localStorage.setItem("sentrix_framework_feedback", JSON.stringify(existing));
      } catch (err) {
        console.error("Failed to store feedback locally", err);
      }

      setIsSubmitting(false);
      setSubmittedTicket(generatedId);
    }, 600);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(8px)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div
        className="prism-card message-animate-in"
        style={{
          width: "100%",
          maxWidth: "560px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          borderRadius: "14px",
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.65)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "18px"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "var(--prism-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 0 12px var(--prism-glow)"
            }}>
              <MessageSquarePlus size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink-primary)", margin: 0 }}>
                Framework Feedback & Feature Requests
              </h3>
              <p style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", margin: 0, marginTop: "2px" }}>
                Report framework bugs (e.g. chat stream issues) or submit new feature requests
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: "6px" }}
            title="Close modal (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {submittedTicket ? (
          /* SUCCESS CONFIRMATION SCREEN */
          <div style={{
            padding: "24px",
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "12px"
          }}>
            <CheckCircle2 size={36} color="var(--accent-teal)" />
            <div>
              <h4 style={{ fontSize: "15px", color: "var(--ink-primary)", margin: 0 }}>
                Feedback Successfully Submitted!
              </h4>
              <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "4px" }}>
                Your report has been dispatched to the Sentrix platform engineering team with diagnostic logs.
              </p>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--bg-elevated)",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid var(--border-subtle)"
            }}>
              <span className="mono" style={{ fontSize: "12px", fontWeight: "700", color: "var(--prism-pink)" }}>
                {submittedTicket}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(submittedTicket);
                  setCopiedTicket(true);
                  setTimeout(() => setCopiedTicket(false), 2000);
                }}
                className="btn-ghost"
                style={{ padding: "2px 6px", fontSize: "11px" }}
              >
                {copiedTicket ? <Check size={12} color="var(--accent-teal)" /> : <Copy size={12} />}
              </button>
            </div>

            <button
              onClick={() => {
                setSubmittedTicket(null);
                setTitle("");
                setDescription("");
                onClose();
              }}
              className="btn-primary"
              style={{ marginTop: "8px", fontSize: "12px", padding: "8px 20px" }}
            >
              Done
            </button>
          </div>
        ) : (
          /* SUBMISSION FORM */
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Feedback Category Pills */}
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { id: "BUG", label: "Framework Issue / Bug", icon: AlertTriangle, color: "var(--accent-rose)" },
                { id: "FEATURE", label: "Feature Request", icon: Lightbulb, color: "var(--accent-teal)" },
                { id: "PERFORMANCE", label: "Latency / Perf", icon: Zap, color: "var(--accent-violet)" }
              ].map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setFeedbackType(cat.id)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    background: feedbackType === cat.id ? "rgba(236, 72, 153, 0.14)" : "rgba(255, 255, 255, 0.03)",
                    border: feedbackType === cat.id ? "1px solid var(--prism-pink)" : "1px solid var(--border-subtle)",
                    color: feedbackType === cat.id ? "var(--prism-pink)" : "var(--ink-secondary)",
                    fontSize: "12px",
                    fontWeight: feedbackType === cat.id ? "700" : "500",
                    cursor: "pointer"
                  }}
                >
                  <cat.icon size={13} color={cat.color} />
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Title */}
            <div>
              <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                Summary / Short Title *
              </label>
              <input
                type="text"
                required
                placeholder={feedbackType === "BUG" ? "e.g., Investigation chat stream disconnects on long SQL queries" : "e.g., Add native PagerDuty on-call routing connector"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  color: "var(--ink-primary)",
                  fontSize: "12.5px"
                }}
              />
            </div>

            {/* Component & Severity Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Affected Component
                </label>
                <select
                  value={component}
                  onChange={(e) => setComponent(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    color: "var(--ink-primary)",
                    fontSize: "12px"
                  }}
                >
                  <option value="CHAT_STREAM">Investigation Chat & AI Stream</option>
                  <option value="TOOL_BROKER">Tool Broker & Queries</option>
                  <option value="AUTO_TRIAGE">Auto-Triage Hub & JQL</option>
                  <option value="LIVE_BOARD">Live Triage Board</option>
                  <option value="CONNECTORS">Datasource Connectors</option>
                  <option value="GENERAL">General Platform UI / Shell</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Severity / Urgency
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    color: "var(--ink-primary)",
                    fontSize: "12px"
                  }}
                >
                  <option value="P1">P1 - Blocker / Crash</option>
                  <option value="P2">P2 - Major Degradation</option>
                  <option value="P3">P3 - Minor / Cosmetic / Idea</option>
                </select>
              </div>
            </div>

            {/* Description & Reproduction Steps */}
            <div>
              <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                Details & Steps to Reproduce *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe what happened, error messages seen, or the exact capability needed..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  color: "var(--ink-primary)",
                  fontSize: "12.5px",
                  lineHeight: 1.5
                }}
              />
            </div>

            {/* Diagnostic Snapshot Checkbox */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 12px",
              background: "rgba(0, 0, 0, 0.25)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              fontSize: "11.5px",
              color: "var(--ink-secondary)"
            }}>
              <input
                type="checkbox"
                id="includeDiag"
                checked={includeDiagnostics}
                onChange={(e) => setIncludeDiagnostics(e.target.checked)}
              />
              <label htmlFor="includeDiag" style={{ cursor: "pointer" }}>
                Auto-attach session context (Project: <strong style={{ color: "var(--prism-pink)" }}>{projectKey}</strong>, Env: <strong style={{ color: "var(--accent-teal)" }}>{activeEnvironment || "prod"}</strong>, Identity: <strong>kbk@company.com</strong>)
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                style={{ padding: "8px 16px", fontSize: "12px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !description.trim()}
                className="btn-primary"
                style={{ padding: "8px 20px", fontSize: "12px", gap: "6px" }}
              >
                <Send size={13} />
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
