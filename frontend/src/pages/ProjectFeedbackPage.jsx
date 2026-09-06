import React, { useState, useEffect } from "react";
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
import { fetchProjectFeedback, submitFeedback, fetchBoardTickets } from "../api/client";

export function ProjectFeedbackPage({ activeProject }) {
  const projectKey = activeProject?.project_key || "";
  const [selectedTicketKey, setSelectedTicketKey] = useState("");
  const [availableTickets, setAvailableTickets] = useState([]);
  const [rating, setRating] = useState("UP"); // "UP" | "DOWN"
  const [selectedTags, setSelectedTags] = useState(["Root Cause Accuracy", "Suggested Fix Relevance"]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const availableTags = [
    "Root Cause Accuracy",
    "Suggested Fix Relevance",
    "Tool Query Efficiency",
    "False Positive Alert",
    "Severity Assessment",
    "Missing Runbook Citation"
  ];

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      fetchProjectFeedback(projectKey).catch(() => []),
      fetchBoardTickets(projectKey).catch(() => [])
    ])
      .then(([fbData, ticketData]) => {
        if (Array.isArray(ticketData) && ticketData.length > 0) {
          setAvailableTickets(ticketData);
          if (!selectedTicketKey) {
            setSelectedTicketKey(ticketData[0].key);
          }
        }
        if (Array.isArray(fbData)) {
          setFeedbacks(
            fbData.map((item) => ({
              id: item.id,
              ticketKey: item.source_id || "GENERAL",
              rating: item.signal_type === "VERIFIED" || item.feedback_score > 0 ? "UP" : "DOWN",
              author: item.user_id || "SRE Engineer",
              time: item.submitted_at ? new Date(item.submitted_at).toLocaleString() : null,
              tags: item.notes?.startsWith("[Category:") ? [item.notes.split("]")[0].replace("[Category:", "").trim()] : ["Quality Calibration"],
              comment: item.notes?.replace(/\[Category:.*?\]/g, "").trim() || "No additional commentary provided.",
              status: "RECORDED"
            }))
          );
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [projectKey]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      await submitFeedback({
        source_type: "INCIDENT",
        source_id: selectedTicketKey || "GENERAL",
        user_id: "sre.operator@company.com",
        signal_type: rating === "UP" ? "VERIFIED" : "REJECTED",
        score: rating === "UP" ? 5 : 1,
        notes: commentText,
        category: selectedTags.join(", ")
      });
      setCommentText("");
      setSubmittedMessage(true);
      setTimeout(() => setSubmittedMessage(false), 3500);
      loadData();
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    } finally {
      setIsSubmitting(false);
    }
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
              background: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(139,92,246,0.15))",
              border: "1px solid rgba(236,72,153,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--prism-pink)"
            }}
          >
            <MessageSquare size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "var(--ink-primary)" }}>
              Human-in-the-Loop SRE Calibration ({projectKey})
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Rate autonomous triage root cause accuracy, report false positives, and continuously improve agent prompt instructions.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={loadData} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px", gap: "6px" }}>
            <RotateCw size={13} className={isLoading ? "spin" : ""} /> Refresh Signals
          </button>
        </div>
      </div>

      {/* Main Grid: Feedback Submission Form & Feedback History */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "20px" }}>
        {/* Left: Interactive Feedback Card */}
        <div
          className="prism-card"
          style={{
            padding: "22px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            display: "flex",
            flexDirection: "column",
            gap: "18px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={16} color="var(--prism-pink)" />
            <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "var(--ink-primary)" }}>
              Submit Triage Calibration Feedback
            </h3>
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
                {availableTickets.length > 0 ? (
                  availableTickets.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.key} • {t.title}
                    </option>
                  ))
                ) : (
                  <option value="GENERAL">General Project Telemetry Feedback</option>
                )}
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
                    gap: "8px",
                    fontSize: "12px",
                    fontWeight: 600
                  }}
                >
                  <ThumbsUp size={14} />
                  Accurate Diagnosis
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
                    gap: "8px",
                    fontSize: "12px",
                    fontWeight: 600
                  }}
                >
                  <ThumbsDown size={14} />
                  Needs Refinement
                </button>
              </div>
            </div>

            {/* Tag Selection */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11.5px", color: "var(--ink-secondary)", fontWeight: 600 }}>
                Evaluation Aspects:
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
                        padding: "4px 8px",
                        fontSize: "11px",
                        borderRadius: "4px",
                        border: isSelected ? "1px solid var(--prism-pink)" : "1px solid var(--border-subtle)",
                        background: isSelected ? "rgba(236, 72, 153, 0.15)" : "var(--bg-elevated)",
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

            {/* Comment Area */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11.5px", color: "var(--ink-secondary)", fontWeight: 600 }}>
                Calibration Notes & Findings:
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
            {isLoading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-tertiary)" }}>
                <RotateCw className="spin" size={20} style={{ margin: "0 auto 8px auto" }} />
                <span>Loading feedback stream...</span>
              </div>
            ) : feedbacks.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-tertiary)", fontSize: "12.5px" }}>
                No calibration feedback recorded yet for this project. Submit the first evaluation to calibrate model instructions.
              </div>
            ) : (
              feedbacks.map((fb) => (
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
