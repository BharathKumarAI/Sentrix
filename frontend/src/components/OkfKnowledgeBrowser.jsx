import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Tag, 
  Share2,
  TrendingDown
} from "lucide-react";
import { fetchOkfCases, fetchOkfNodes } from "../api/client";

export function OkfKnowledgeBrowser({ activeProject }) {
  const [cases, setCases] = useState([]);
  const [runbooks, setRunbooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("CASES"); // CASES or RUNBOOKS
  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => {
    fetchOkfCases(searchQuery, activeProject?.id).then((data) => setCases(Array.isArray(data) ? data : []));
    fetchOkfNodes().then((data) => setRunbooks(Array.isArray(data) ? data : []));
  }, [searchQuery, activeProject]);

  return (
    <div style={{
      padding: "24px 32px",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      overflowY: "auto",
      minHeight: "100%",
      boxSizing: "border-box"
    }}>
      
      {/* Framework Page Hero Card */}
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
            <BookOpen size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                {activeProject?.project_key || ""} • OKF v2.0 KNOWLEDGE FABRIC
              </span>
              <span className="badge badge-teal">Continuous Learning</span>
              <span className="badge badge-magenta">Case-Based Precedents</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Organizational Knowledge Fabric (OKF v2.0)
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Case-based reasoning store holding verified incident signatures, auto-learned root causes, and executable runbooks.
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", width: "300px" }}>
          <Search size={14} color="var(--ink-tertiary)" style={{ position: "absolute", left: "10px", top: "10px" }} />
          <input
            type="text"
            placeholder="Search verified cases or signatures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 32px",
              background: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
              color: "var(--ink-primary)",
              fontSize: "12px"
            }}
          />
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          className={activeTab === "CASES" ? "btn-primary" : "btn-secondary"}
          onClick={() => setActiveTab("CASES")}
          style={{ fontSize: "12px" }}
        >
          <Sparkles size={14} /> Auto-Learned Incident Cases ({cases.length})
        </button>
        <button
          className={activeTab === "RUNBOOKS" ? "btn-primary" : "btn-secondary"}
          onClick={() => setActiveTab("RUNBOOKS")}
          style={{ fontSize: "12px" }}
        >
          <FileText size={14} /> Operational Runbooks ({runbooks.length})
        </button>
      </div>

      {/* Content Grid */}
      {activeTab === "CASES" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "18px" }}>
          {cases.map((c) => (
            <div
              key={c.id}
              className="glass-card"
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "14px",
                cursor: "pointer"
              }}
              onClick={() => setSelectedCase(c)}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span className="mono badge badge-teal" style={{ fontSize: "11px" }}>{c.incident_id}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--accent-teal)" }}>
                    <TrendingDown size={13} /> MTTR: {c.mttr_minutes}m
                  </div>
                </div>

                <h4 style={{ fontSize: "14px", color: "var(--ink-primary)", lineHeight: "1.4" }}>{c.title}</h4>

                <div style={{ marginTop: "10px", padding: "10px", borderRadius: "6px", background: "var(--bg-app)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: "10px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: "700" }}>
                    Verified Root Cause
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--ink-primary)", marginTop: "3px", lineHeight: "1.4" }}>
                    {c.root_cause}
                  </p>
                </div>
              </div>

              {/* Tags & Reference Count */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {c.tags?.slice(0, 3).map((t) => (
                    <span key={t} className="mono" style={{ fontSize: "10px", background: "var(--bg-app)", border: "1px solid var(--border-subtle)", color: "var(--ink-secondary)", padding: "2px 6px", borderRadius: "4px" }}>
                      #{t}
                    </span>
                  ))}
                </div>

                <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                  Referenced {c.times_referenced}x
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "18px" }}>
          {runbooks.map((r) => (
            <div key={r.id} className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="badge badge-violet">{r.category}</span>
                <span style={{ fontSize: "11px", color: "var(--accent-teal)" }}>Helpful Score: {r.helpful_score}</span>
              </div>

              <h4 style={{ fontSize: "15px", color: "var(--ink-primary)" }}>{r.title}</h4>

              <div style={{ fontSize: "12px", color: "var(--ink-secondary)", whiteSpace: "pre-line", maxHeight: "160px", overflowY: "auto" }}>
                {r.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
