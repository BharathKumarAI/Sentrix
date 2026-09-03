import React, { useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Search,
  Filter,
  Sparkles,
  Zap,
  Tag,
  Send,
  Sliders,
  Check
} from "lucide-react";

export function ProjectFeedbackPage({ activeProject }) {
  const projectKey = activeProject?.project_key || "BILLING";
  const [selectedTicketKey, setSelectedTicketKey] = useState("BILL-1049");
  const [rating, setRating] = useState("UP"); // "UP" | "DOWN"
  const [selectedTags, setSelectedTags] = useState(["Root Cause Accuracy", "Suggested Fix Relevance"]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState(false);

  const availableTags = [
    "Root Cause Accuracy",
    "Suggested Fix Relevance",
    "Tool Query Efficiency",
    "False Positive Alert",
    "Severity Assessment",
    "Missing Runbook Citation"
  ];

  const [feedbacks, setFeedbacks] = useState([
    {
      id: "fb-1",
      ticketKey: "BILL-1049",
      rating: "UP",
      author: "Sarah K. (Staff SRE)",
      time: "10m ago",
      tags: ["Root Cause Accuracy", "Suggested Fix Relevance"],
      comment: "HikariCP pool limit diagnosis was spot-on. Hot-patch pool bump to 50 eliminated the 504 timeouts under load test.",
      status: "CALIBRATED"
    },
    {
      id: "fb-2",
      ticketKey: "DB-3030",
      rating: "UP",
      author: "Marcus T. (Principal DBA)",
      time: "35m ago",
      tags: ["Root Cause Accuracy", "Tool Query Efficiency"],
      comment: "The pg_locks cycle detection graph query was very accurate. Session PID 10482 was indeed the root culprit.",
      status: "CALIBRATED"
    },
    {
      id: "fb-3",
      ticketKey: "AUTH-2091",
      rating: "UP",
      author: "David L. (Security Lead)",
      time: "2h ago",
      tags: ["Suggested Fix Relevance"],
      comment: "Good suggestion to switch JWKS cache to stale-while-revalidate to eliminate the 60s thundering herd misses.",
      status: "CALIBRATED"
    }
  ]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newFb = {
        id: `fb-${Date.now()}`,
        ticketKey: selectedTicketKey,
        rating: rating,
        author: "Current SRE (Delegated)",
        time: "Just now",
        tags: [...selectedTags],
        comment: commentText,
        status: "RECORDED"
      };
      setFeedbacks([newFb, ...feedbacks]);
      setCommentText("");
      setIsSubmitting(false);
      setSubmittedMessage(true);
      setTimeout(() => setSubmittedMessage(false), 3000);
    }, 600);
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
            <ThumbsUp size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                {projectKey} • CALIBRATION
              </span>
              <span className="badge badge-teal">RLHF Continuous Learning</span>
              <span className="badge badge-magenta">97.2% Human SRE Approval</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              SRE Auto-Triage Feedback & RLHF Loop
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Record domain engineer evaluation on AI incident diagnoses, query generation precision, and remediation runbooks.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="badge badge-teal">482 Total Feedbacks</span>
        </div>
      </div>

      {/* Main Grid: Submission Form on Left, Audit Stream on Right */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.2fr", gap: "20px", alignItems: "start" }}>
        {/* Left: Interactive Feedback Form */}
        <div
          className="prism-card"
          style={{
            padding: "22px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
              Submit Triage Calibration Feedback
            </h3>
            <span className="badge badge-magenta">Human-in-the-Loop</span>
          </div>

          <form onSubmit={handleSubmitFeedback} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Ticket Selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11.5px", color: "var(--ink-secondary)", fontWeight: 600 }}>
                Target Incident Ticket:
              </label>
              <select
                value={selectedTicketKey}
                onChange={(e) => setSelectedTicketKey(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--ink-primary)",
                  fontSize: "12px",
                  outline: "none"
                }}
              >
                <option value="BILL-1049">BILL-1049 • Payment gateway timeout on recurring charges</option>
                <option value="AUTH-2091">AUTH-2091 • Auth token signature verification latency spike</option>
                <option value="DB-3030">DB-3030 • Deadlock in orders_allocation lock queue</option>
                <option value="NOTIF-501">NOTIF-501 • Email delivery queue backlog exceeding SLA</option>
                <option value="INFRA-880">INFRA-880 • Redis cluster node failover completed</option>
              </select>
            </div>

            {/* Rating Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11.5px", color: "var(--ink-secondary)", fontWeight: 600 }}>
                Triage Quality Rating:
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setRating("UP")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "6px",
                    border: rating === "UP" ? "1px solid var(--accent-teal)" : "1px solid var(--border-subtle)",
                    background: rating === "UP" ? "rgba(16, 185, 129, 0.15)" : "var(--bg-elevated)",
                    color: rating === "UP" ? "var(--accent-teal)" : "var(--ink-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontWeight: 600,
                    fontSize: "12px"
                  }}
                >
                  <ThumbsUp size={14} /> Accurate & High Value
                </button>

                <button
                  type="button"
                  onClick={() => setRating("DOWN")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "6px",
                    border: rating === "DOWN" ? "1px solid var(--accent-rose)" : "1px solid var(--border-subtle)",
                    background: rating === "DOWN" ? "rgba(225, 29, 72, 0.15)" : "var(--bg-elevated)",
                    color: rating === "DOWN" ? "var(--accent-rose)" : "var(--ink-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontWeight: 600,
                    fontSize: "12px"
                  }}
                >
                  <ThumbsDown size={14} /> Needs Fine-Tuning
                </button>
              </div>
            </div>

            {/* Tags */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11.5px", color: "var(--ink-secondary)", fontWeight: 600 }}>
                Evaluation Categories:
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      style={{
                        padding: "3px 8px",
                        fontSize: "11px",
                        borderRadius: "4px",
                        border: isSelected ? "1px solid var(--prism-magenta)" : "1px solid var(--border-subtle)",
                        background: isSelected ? "rgba(225, 29, 72, 0.15)" : "var(--bg-input)",
                        color: isSelected ? "var(--prism-pink)" : "var(--ink-secondary)",
                        cursor: "pointer"
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes Textarea */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11.5px", color: "var(--ink-secondary)", fontWeight: 600 }}>
                SRE Detailed Notes:
              </label>
              <textarea
                rows={3}
                placeholder="Explain what the AI agent did well or what prompt instructions should be refined..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "6px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--ink-primary)",
                  fontSize: "12px",
                  resize: "vertical",
                  outline: "none"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !commentText.trim()}
              className="btn-primary"
              style={{ padding: "8px", gap: "6px", justifyContent: "center" }}
            >
              {isSubmitting ? <RotateCw size={13} className="spin" /> : <Send size={13} />}
              {isSubmitting ? "Recording Feedback..." : "Record SRE Calibration Feedback"}
            </button>

            {submittedMessage && (
              <div style={{ padding: "8px 12px", borderRadius: "6px", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "var(--accent-teal)", fontSize: "11.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Check size={14} /> Feedback saved and incorporated into model calibration queue.
              </div>
            )}
          </form>
        </div>

        {/* Right: Feedback Log Stream */}
        <div
          className="prism-card"
          style={{
            padding: "22px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
              Recent SRE Calibration Feedbacks
            </h3>
            <span className="badge badge-teal">{feedbacks.length} In Log</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {feedbacks.map((fb) => (
              <div
                key={fb.id}
                style={{
                  padding: "14px",
                  borderRadius: "8px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        padding: "3px 6px",
                        borderRadius: "4px",
                        background: fb.rating === "UP" ? "rgba(16, 185, 129, 0.15)" : "rgba(225, 29, 72, 0.15)",
                        color: fb.rating === "UP" ? "var(--accent-teal)" : "var(--accent-rose)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11px",
                        fontWeight: 700
                      }}
                    >
                      {fb.rating === "UP" ? <ThumbsUp size={11} /> : <ThumbsDown size={11} />}
                      {fb.rating === "UP" ? "Accurate" : "Refinement"}
                    </span>
                    <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--prism-pink)", fontSize: "12.5px" }}>
                      {fb.ticketKey}
                    </strong>
                  </div>

                  <span style={{ fontSize: "11px", color: "var(--ink-muted)" }}>{fb.time}</span>
                </div>

                <p style={{ fontSize: "12px", color: "var(--ink-secondary)", lineHeight: 1.5 }}>
                  "{fb.comment}"
                </p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: "8px", fontSize: "11px" }}>
                  <span style={{ color: "var(--ink-tertiary)" }}>By: <strong style={{ color: "var(--ink-primary)" }}>{fb.author}</strong></span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {fb.tags.map((t, idx) => (
                      <span key={idx} style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "3px", background: "var(--bg-input)", color: "var(--accent-teal)" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
