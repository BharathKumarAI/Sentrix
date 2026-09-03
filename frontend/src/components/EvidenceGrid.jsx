import React, { useState, useEffect } from "react";
import { 
  FileCode2, 
  Database, 
  Terminal, 
  GitBranch, 
  Server, 
  Search, 
  Lock, 
  Copy, 
  Check, 
  ThumbsUp, 
  ThumbsDown,
  X,
  ExternalLink
} from "lucide-react";
import { fetchEvidence, submitFeedback } from "../api/client";

export function EvidenceGrid({ activeProject }) {
  const [evidenceList, setEvidenceList] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Fetch latest evidence for project
    fetchEvidence("run_latest")
      .then((data) => setEvidenceList(Array.isArray(data) ? data : []))
      .catch((e) => console.error(e));
  }, [activeProject]);

  const getSourceIcon = (src) => {
    switch (src?.toLowerCase()) {
      case "splunk": return <Terminal size={16} color="var(--accent-teal)" />;
      case "postgres": return <Database size={16} color="var(--accent-violet)" />;
      case "jira": return <ExternalLink size={16} color="#60a5fa" />;
      case "github": return <GitBranch size={16} color="var(--accent-amber)" />;
      case "kubernetes": return <Server size={16} color="var(--accent-rose)" />;
      default: return <FileCode2 size={16} color="var(--accent-teal)" />;
    }
  };

  const handleCitationFeedback = async (evidenceId, rating) => {
    try {
      await submitFeedback({
        source_type: "EVIDENCE",
        source_id: evidenceId,
        user_id: "usr_admin_01",
        signal_type: rating,
      });
      setEvidenceList((prev) =>
        prev.map((e) => (e.id === evidenceId ? { ...e, relevance_rating: rating } : e))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // Filter evidence
  const filtered = evidenceList.filter((e) =>
    (e.summary || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.source_system || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px" }}>
      
      {/* Header & Filter */}
      <div className="glass-panel" style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "17px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FileCode2 size={18} color="var(--accent-teal)" /> Evidence Artifact & Citation Inspector
          </h2>
          <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "3px" }}>
            Normalized, project-scoped telemetry with cryptographic SHA-256 provenance hashes.
          </p>
        </div>

        {/* Search Input */}
        <div style={{ position: "relative", width: "280px" }}>
          <Search size={14} color="var(--ink-tertiary)" style={{ position: "absolute", left: "10px", top: "10px" }} />
          <input
            type="text"
            placeholder="Search evidence or source..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 32px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid var(--border-glass)",
              borderRadius: "var(--radius-pill)",
              color: "#fff",
              fontSize: "12px"
            }}
          />
        </div>
      </div>

      {/* Grid of Evidence Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
        gap: "18px"
      }}>
        {filtered.length === 0 ? (
          <div className="glass-panel" style={{ padding: "40px", textAlign: "center", gridColumn: "1/-1", color: "var(--ink-secondary)" }}>
            No evidence artifacts found. Run an investigation or auto-triage in the Hub to generate evidence.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="glass-card"
              style={{
                padding: "18px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "12px",
                cursor: "pointer"
              }}
              onClick={() => setSelectedItem(item)}
            >
              {/* Card Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {getSourceIcon(item.source_system)}
                  <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "#fff" }}>
                    {item.source_system}
                  </span>
                  <span className="mono" style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>
                    env: {item.tool_environment}
                  </span>
                </div>
                
                <span className="badge badge-teal">
                  {Math.round(item.confidence_score * 100)}% Confidence
                </span>
              </div>

              {/* Normalized Summary */}
              <p style={{ fontSize: "13px", color: "var(--ink-primary)", lineHeight: "1.5" }}>
                {item.summary}
              </p>

              {/* Hash & Citation Feedback Bar */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "10px",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                fontSize: "11px"
              }}>
                <div className="mono" style={{ color: "var(--ink-tertiary)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Lock size={11} /> {item.content_sha256?.slice(0, 10)}...
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "4px" }} onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn-ghost"
                    style={{ padding: "3px 6px", color: item.relevance_rating === "VERIFIED" ? "var(--accent-teal)" : "var(--ink-secondary)" }}
                    onClick={() => handleCitationFeedback(item.id, "VERIFIED")}
                    title="Mark Verified & Relevant"
                  >
                    <ThumbsUp size={12} />
                  </button>
                  <button
                    className="btn-ghost"
                    style={{ padding: "3px 6px", color: item.relevance_rating === "REJECTED" ? "var(--accent-rose)" : "var(--ink-secondary)" }}
                    onClick={() => handleCitationFeedback(item.id, "REJECTED")}
                    title="Mark Irrelevant / Noise"
                  >
                    <ThumbsDown size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Provenance Scrim Drawer Modal */}
      {selectedItem && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(8px)",
          display: "flex",
          justifyContent: "flex-end",
          zIndex: 100
        }}>
          <div className="glass-panel" style={{
            width: "550px",
            height: "100%",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            borderRadius: "0",
            borderLeft: "1px solid var(--border-glass)",
            overflowY: "auto"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {getSourceIcon(selectedItem.source_system)}
                <h3 style={{ fontSize: "16px" }}>Provenance: {selectedItem.source_system} Artifact</h3>
              </div>
              <button className="btn-ghost" onClick={() => setSelectedItem(null)}>
                <X size={18} />
              </button>
            </div>

            <div>
              <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: "600", textTransform: "uppercase" }}>Summary</div>
              <p style={{ fontSize: "13px", color: "#fff", marginTop: "4px" }}>{selectedItem.summary}</p>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: "600", textTransform: "uppercase" }}>Cryptographic SHA-256 Provenance</span>
                <button
                  className="btn-ghost"
                  style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                  onClick={() => handleCopy(selectedItem.content_sha256)}
                >
                  {copiedHash ? <Check size={12} color="var(--accent-teal)" /> : <Copy size={12} />}
                  {copiedHash ? "Copied!" : "Copy Hash"}
                </button>
              </div>
              <div className="mono" style={{ fontSize: "11px", background: "rgba(0,0,0,0.5)", padding: "8px 12px", borderRadius: "6px", color: "var(--accent-teal)", wordBreak: "break-all", marginTop: "4px" }}>
                {selectedItem.content_sha256}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: "600", textTransform: "uppercase" }}>Query Parameters</div>
              <pre className="mono" style={{ fontSize: "11px", background: "rgba(0,0,0,0.5)", padding: "10px", borderRadius: "6px", color: "#ffd699", marginTop: "4px", overflowX: "auto" }}>
                {JSON.stringify(selectedItem.query_params, null, 2)}
              </pre>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: "600", textTransform: "uppercase" }}>Raw Normalized Payload</div>
              <pre className="mono" style={{ fontSize: "11px", background: "rgba(0,0,0,0.5)", padding: "12px", borderRadius: "6px", color: "var(--ink-primary)", marginTop: "4px", maxHeight: "320px", overflowY: "auto" }}>
                {JSON.stringify(selectedItem.raw_payload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
