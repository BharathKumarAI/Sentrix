import React, { useState, useEffect } from "react";
import {
  GitFork,
  HelpCircle,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Sliders,
  Sparkles,
  Database,
  Terminal,
  Clock,
  ChevronRight,
  TrendingDown,
  Lock,
  ArrowRight,
  Split,
  Eye,
  FileCode,
  Gauge
} from "lucide-react";
import {
  fetchRCAMethodologies,
  analyzeIncidentRCA,
  checkContextBudget
} from "../api/client";

export function RCAWorkbench() {
  const [methodologies, setMethodologies] = useState([]);
  const [activeMethod, setActiveMethod] = useState("five_whys");
  const [incidentTitle, setIncidentTitle] = useState(
    "PostgreSQL Connection Pool Exhaustion on payment worker pods during batch reconciliation"
  );
  const [targetEnv, setTargetEnv] = useState("QLAB02");
  const [baselineEnv, setBaselineEnv] = useState("QLAB01");
  const [taxonomy, setTaxonomy] = useState("4Ss");

  // RCA Results State
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  // Context Budget Simulator State
  const [budgetToolType, setBudgetToolType] = useState("splunk");
  const [budgetQuery, setBudgetQuery] = useState("index=prod_apps level=ERROR service=payment-worker");
  const [budgetEarliest, setBudgetEarliest] = useState("-1y"); // intentionally wide to test guardrail
  const [budgetResult, setBudgetResult] = useState(null);
  const [budgetChecking, setBudgetChecking] = useState(false);

  // Pre-configured Incident Scenarios
  const PRESET_INCIDENTS = [];

  // Load Methodologies on mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        const cat = await fetchRCAMethodologies();
        if (Array.isArray(cat)) setMethodologies(cat);
      } catch (err) {
        console.error("Failed to load RCA methodologies catalog", err);
      }
    }
    loadCatalog();
    handleRunAnalysis("five_whys");
  }, []);

  // Execute RCA Analysis
  const handleRunAnalysis = async (methodToRun = activeMethod) => {
    try {
      setAnalyzing(true);
      setAnalysisError(null);
      const res = await analyzeIncidentRCA(
        incidentTitle,
        methodToRun,
        targetEnv,
        baselineEnv,
        { taxonomy }
      );
      setAnalysisResult(res);
    } catch (err) {
      console.error("RCA analysis failed", err);
      setAnalysisError(err.message || "Analysis execution failed");
    } finally {
      setAnalyzing(false);
    }
  };

  // Run Context Budget Evaluation
  const handleCheckBudget = async () => {
    try {
      setBudgetChecking(true);
      const res = await checkContextBudget(
        budgetToolType,
        budgetQuery,
        budgetEarliest,
        "now"
      );
      setBudgetResult(res);
    } catch (err) {
      console.error("Budget check error", err);
    } finally {
      setBudgetChecking(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Banner */}
      <div
        className="prism-card"
        style={{
          padding: "24px",
          background: "linear-gradient(135deg, rgba(13, 148, 136, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)",
          border: "1px solid rgba(13, 148, 136, 0.2)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span className="badge badge-teal" style={{ fontSize: "11px", fontWeight: "700" }}>
                AUTONOMOUS SRE REASONER
              </span>
              <span className="badge badge-purple" style={{ fontSize: "11px", fontWeight: "700" }}>
                CONTEXT TAX BUDGETER ACTIVE
              </span>
              <span style={{ fontSize: "12px", color: "var(--ink-tertiary)" }}>
                Deterministic Investigation Framework
              </span>
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "var(--ink-primary)" }}>
              Root Cause Analysis (RCA) & Context Guardrail Workbench
            </h2>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "4px", maxWidth: "850px" }}>
              Execute structured causal reasoning across <strong>5 Whys</strong>, <strong>Ishikawa Fishbone</strong>, <strong>Kepner-Tregoe</strong>, <strong>FMEA RPN</strong>, and <strong>Fault Trees</strong>. Guard your LLM context window against telemetry bloat with automated time-bounding and token budgeting.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => handleRunAnalysis(activeMethod)}
              disabled={analyzing}
              className="prism-btn-primary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                fontSize: "13px",
                fontWeight: "700"
              }}
            >
              <RefreshCw size={15} className={analyzing ? "spin" : ""} />
              {analyzing ? "Analyzing Evidence..." : "Run RCA Investigation"}
            </button>
          </div>
        </div>

        {/* Preset Incidents Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--ink-tertiary)" }}>
            PRESET SCENARIOS:
          </span>
          {PRESET_INCIDENTS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIncidentTitle(preset.title);
                setTargetEnv(preset.target);
                setBaselineEnv(preset.baseline);
                setActiveMethod(preset.recommendedMethod);
                handleRunAnalysis(preset.recommendedMethod);
              }}
              className="prism-btn-ghost"
              style={{
                fontSize: "11px",
                padding: "4px 10px",
                borderRadius: "6px",
                borderColor: incidentTitle === preset.title ? "var(--prism-teal)" : "var(--border-subtle)",
                color: incidentTitle === preset.title ? "var(--prism-teal)" : "var(--ink-secondary)"
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Incident Input and Environment Scope */}
      <div className="prism-card" style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr auto auto", gap: "16px", alignItems: "end" }}>
        <div>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
            Active Incident Title or Symptom
          </label>
          <input
            type="text"
            value={incidentTitle}
            onChange={(e) => setIncidentTitle(e.target.value)}
            className="prism-input"
            style={{ width: "100%", fontSize: "13px", padding: "10px 14px" }}
            placeholder="Enter incident description or symptom..."
          />
        </div>

        <div>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
            Target (Failing) Env
          </label>
          <select
            value={targetEnv}
            onChange={(e) => setTargetEnv(e.target.value)}
            className="prism-input"
            style={{ fontSize: "13px", padding: "10px 12px" }}
          >
            <option value="QLAB02">QLAB02 (Staging)</option>
            <option value="QLAB03">QLAB03 (Integration)</option>
            <option value="PROD_US_EAST">PROD (US-East)</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
            Baseline (Healthy) Env
          </label>
          <select
            value={baselineEnv}
            onChange={(e) => setBaselineEnv(e.target.value)}
            className="prism-input"
            style={{ fontSize: "13px", padding: "10px 12px" }}
          >
            <option value="QLAB01">QLAB01 (Baseline)</option>
            <option value="DEV01">DEV01 (Local Edge)</option>
          </select>
        </div>
      </div>

      {/* Methodology Selector Tabs */}
      <div
        className="prism-card"
        style={{
          display: "flex",
          gap: "8px",
          padding: "8px",
          borderRadius: "10px",
          overflowX: "auto",
          alignItems: "stretch"
        }}
      >
        {[
          { id: "five_whys", name: "1. The 5 Whys", desc: "Iterative Causal Ladder", icon: HelpCircle },
          { id: "fishbone", name: "2. Ishikawa Fishbone", desc: "Multi-Vector (4Ss/6Ms)", icon: GitFork },
          { id: "kepner_tregoe", name: "3. Kepner-Tregoe", desc: "IS / IS NOT Differential", icon: Sliders },
          { id: "fmea", name: "4. FMEA Risk RPN", desc: "Risk Priority Number", icon: AlertTriangle },
          { id: "fault_tree", name: "5. Fault Tree (FTA)", desc: "Boolean Logic Gates", icon: Layers },
          { id: "auto_ensemble", name: "6. Auto-Ensemble", desc: "Composite Synthesis", icon: Sparkles },
          { id: "context_budget", name: "7. Context Guardrail", desc: "Token Tax & Time-Bounds", icon: ShieldCheck }
        ].map((tab) => {
          const isActive = activeMethod === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveMethod(tab.id);
                if (tab.id !== "context_budget") {
                  handleRunAnalysis(tab.id);
                } else if (!budgetResult) {
                  handleCheckBudget();
                }
              }}
              style={{
                flex: "1 1 0",
                minWidth: "145px",
                padding: "10px 12px",
                borderRadius: "8px",
                border: isActive
                  ? "1.5px solid var(--prism-teal)"
                  : "1px solid var(--border-subtle)",
                background: isActive
                  ? "rgba(13, 148, 136, 0.12)"
                  : "transparent",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
                gap: "3px",
                transition: "all 0.15s ease",
                boxShadow: isActive ? "0 2px 8px rgba(13, 148, 136, 0.15)" : "none",
                textAlign: "left"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%" }}>
                <Icon
                  size={14}
                  style={{
                    color: isActive ? "var(--prism-teal)" : "var(--ink-tertiary)",
                    flexShrink: 0
                  }}
                />
                <span
                  style={{
                    fontSize: "12.5px",
                    fontWeight: isActive ? "700" : "600",
                    color: isActive ? "var(--prism-teal)" : "var(--ink-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                >
                  {tab.name}
                </span>
              </div>
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: "500",
                  color: isActive ? "var(--ink-secondary)" : "var(--ink-tertiary)",
                  paddingLeft: "20px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  width: "100%"
                }}
              >
                {tab.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Results Canvas */}
      {analyzing ? (
        <div className="prism-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <RefreshCw size={36} className="spin" style={{ margin: "0 auto 16px auto", color: "var(--prism-teal)" }} />
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink-primary)" }}>
            Correlating Multi-Layer Telemetry & Reasoning...
          </h3>
          <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "6px" }}>
            Executing {activeMethod.toUpperCase()} methodology across Jira, Splunk, APM metrics, and git diffs.
          </p>
        </div>
      ) : activeMethod === "context_budget" ? (
        /* CONTEXT BUDGETER TAB */
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="prism-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldCheck size={18} color="var(--prism-teal)" />
                  Context Budgeting & Time-Bounding Simulator
                </h3>
                <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "4px" }}>
                  Test connector queries against time-bounding safety nets and token compression rules.
                </p>
              </div>
              <button
                onClick={handleCheckBudget}
                disabled={budgetChecking}
                className="prism-btn-primary"
                style={{ fontSize: "12px", padding: "8px 16px" }}
              >
                {budgetChecking ? "Evaluating..." : "Run Guardrail Check"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
                  Connector Tool Type
                </label>
                <select
                  value={budgetToolType}
                  onChange={(e) => setBudgetToolType(e.target.value)}
                  className="prism-input"
                  style={{ width: "100%", fontSize: "13px", padding: "8px 12px" }}
                >
                  <option value="splunk">Splunk Logs (SPL)</option>
                  <option value="jira">Jira / ServiceNow (HTML Strip)</option>
                  <option value="apm">Datadog APM (Time-Series Aggregator)</option>
                  <option value="sql">Oracle / Postgres (Read-Only & LIMIT)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
                  Proposed Earliest Time
                </label>
                <input
                  type="text"
                  value={budgetEarliest}
                  onChange={(e) => setBudgetEarliest(e.target.value)}
                  className="prism-input"
                  style={{ width: "100%", fontSize: "13px", padding: "8px 12px" }}
                  placeholder="e.g. -15m, -1y, or all"
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
                  Sample Query / Command
                </label>
                <input
                  type="text"
                  value={budgetQuery}
                  onChange={(e) => setBudgetQuery(e.target.value)}
                  className="prism-input"
                  style={{ width: "100%", fontSize: "13px", padding: "8px 12px" }}
                />
              </div>
            </div>

            {budgetResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
                {/* Metric Summary Strip */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  <div className="prism-card" style={{ padding: "16px", background: "rgba(13, 148, 136, 0.05)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)" }}>TIME BOUND ENFORCED</div>
                    <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--prism-teal)", marginTop: "4px" }}>
                      {budgetResult.earliest_time_enforced || "N/A"}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "2px" }}>Overrode unbounded query</div>
                  </div>

                  <div className="prism-card" style={{ padding: "16px", background: "rgba(16, 185, 129, 0.05)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)" }}>TOKENS SAVED</div>
                    <div style={{ fontSize: "20px", fontWeight: "800", color: "#10b981", marginTop: "4px" }}>
                      {budgetResult.tokens_saved || 0}
                    </div>
                    <div style={{ fontSize: "11px", color: "#10b981", marginTop: "2px" }}>
                      {budgetResult.compression_ratio_pct}% payload compression
                    </div>
                  </div>

                  <div className="prism-card" style={{ padding: "16px", background: "rgba(99, 102, 241, 0.05)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)" }}>ORIGINAL VS COMPRESSED</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-primary)", marginTop: "6px" }}>
                      {budgetResult.original_estimated_tokens} tokens → {budgetResult.compressed_estimated_tokens} tokens
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "2px" }}>
                      Context budget protected
                    </div>
                  </div>
                </div>

                {/* Violations Caught Alert */}
                {budgetResult.safety_violations?.length > 0 && (
                  <div
                    style={{
                      padding: "14px 18px",
                      borderRadius: "8px",
                      background: "rgba(245, 158, 11, 0.1)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "700", color: "#d97706" }}>
                      <AlertTriangle size={16} />
                      Safety Guardrail Interventions Triggered:
                    </div>
                    {budgetResult.safety_violations.map((v, i) => (
                      <div key={i} style={{ fontSize: "12px", color: "var(--ink-secondary)", marginLeft: "24px" }}>
                        • {v}
                      </div>
                    ))}
                  </div>
                )}

                {/* Sanitized Payload Preview */}
                <div className="prism-card" style={{ padding: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--ink-secondary)", marginBottom: "8px" }}>
                    Sanitized Payload Delivered to LLM:
                  </div>
                  <pre
                    style={{
                      background: "var(--bg-card)",
                      padding: "14px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      overflowX: "auto",
                      maxHeight: "260px",
                      color: "var(--ink-primary)",
                      fontFamily: "monospace"
                    }}
                  >
                    {JSON.stringify(budgetResult.processed_payload || budgetResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : activeMethod === "five_whys" && analysisResult?.chain ? (
        /* 5 WHYS VISUALIZER */
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Executive Root Cause Alert */}
          <div
            className="prism-card"
            style={{
              padding: "20px 24px",
              background: "linear-gradient(90deg, rgba(239, 68, 68, 0.08) 0%, rgba(249, 115, 22, 0.08) 100%)",
              border: "1px solid rgba(239, 68, 68, 0.3)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <AlertTriangle size={20} color="#ef4444" />
              <span style={{ fontSize: "13px", fontWeight: "800", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                ISOLATED SYSTEMIC ROOT CAUSE (LEVEL {analysisResult.depth})
              </span>
              <span className="badge badge-teal" style={{ marginLeft: "auto" }}>
                Confidence: {(analysisResult.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink-primary)", marginTop: "10px" }}>
              {analysisResult.root_cause}
            </div>
            <div style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "8px", lineHeight: "1.5" }}>
              <strong>Recommended Preventative Action:</strong> {analysisResult.preventative_action}
            </div>
          </div>

          {/* 5 Whys Ladder Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", position: "relative" }}>
            {analysisResult.chain.map((node, index) => (
              <div
                key={node.level}
                className="prism-card"
                style={{
                  padding: "18px 22px",
                  display: "flex",
                  gap: "18px",
                  borderLeft: `4px solid ${index === analysisResult.chain.length - 1 ? "#ef4444" : "var(--prism-teal)"}`
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: index === analysisResult.chain.length - 1 ? "rgba(239, 68, 68, 0.15)" : "rgba(13, 148, 136, 0.15)",
                    color: index === analysisResult.chain.length - 1 ? "#ef4444" : "var(--prism-teal)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "800",
                    fontSize: "14px",
                    flexShrink: 0
                  }}
                >
                  W{node.level}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-primary)" }}>
                      {node.question}
                    </span>
                    <span className="badge badge-neutral" style={{ fontSize: "11px", fontWeight: "600" }}>
                      Component: {node.component}
                    </span>
                  </div>

                  <div style={{ fontSize: "13px", color: "var(--ink-secondary)", lineHeight: "1.5" }}>
                    {node.answer}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "6px",
                      fontSize: "12px",
                      color: "var(--ink-tertiary)",
                      background: "rgba(0,0,0,0.03)",
                      padding: "6px 10px",
                      borderRadius: "6px"
                    }}
                  >
                    <CheckCircle2 size={14} color="#10b981" />
                    <strong>Evidence Proof:</strong> {node.evidence_proof}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeMethod === "fishbone" && analysisResult?.branches ? (
        /* FISHBONE / ISHIKAWA VISUALIZER */
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Head Problem Statement */}
          <div
            className="prism-card"
            style={{
              padding: "18px 24px",
              background: "rgba(99, 102, 241, 0.08)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--prism-purple)", textTransform: "uppercase" }}>
                HEAD PROBLEM (EFFECT)
              </span>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink-primary)", marginTop: "4px" }}>
                {analysisResult.head_problem}
              </h3>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => {
                  setTaxonomy("4Ss");
                  handleRunAnalysis("fishbone");
                }}
                className={`prism-btn-ghost ${taxonomy === "4Ss" ? "active" : ""}`}
                style={{ fontSize: "11px", padding: "4px 10px", borderColor: taxonomy === "4Ss" ? "var(--prism-purple)" : "var(--border-subtle)" }}
              >
                Service & Tech (4Ss)
              </button>
              <button
                onClick={() => {
                  setTaxonomy("6Ms");
                  handleRunAnalysis("fishbone");
                }}
                className={`prism-btn-ghost ${taxonomy === "6Ms" ? "active" : ""}`}
                style={{ fontSize: "11px", padding: "4px 10px", borderColor: taxonomy === "6Ms" ? "var(--prism-purple)" : "var(--border-subtle)" }}
              >
                Manufacturing (6Ms)
              </button>
            </div>
          </div>

          {/* Fishbone Ribs Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            {analysisResult.branches.map((branch, idx) => (
              <div
                key={idx}
                className="prism-card"
                style={{
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  borderTop: `4px solid ${branch.impact_score >= 8 ? "#ef4444" : "var(--prism-teal)"}`
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-primary)" }}>
                    {branch.category}
                  </span>
                  <span
                    className="badge"
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      background: branch.impact_score >= 8 ? "rgba(239, 68, 68, 0.15)" : "rgba(13, 148, 136, 0.15)",
                      color: branch.impact_score >= 8 ? "#ef4444" : "var(--prism-teal)"
                    }}
                  >
                    Impact: {branch.impact_score}/10
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {branch.causes.map((c, cIdx) => (
                    <div
                      key={cIdx}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "6px",
                        background: c.is_primary ? "rgba(239, 68, 68, 0.06)" : "rgba(0,0,0,0.02)",
                        border: c.is_primary ? "1px solid rgba(239, 68, 68, 0.25)" : "1px solid var(--border-subtle)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {c.is_primary && (
                          <span className="badge badge-pink" style={{ fontSize: "9px", fontWeight: "800", padding: "2px 6px" }}>
                            PRIMARY
                          </span>
                        )}
                        <span style={{ fontSize: "12px", fontWeight: c.is_primary ? "700" : "500", color: "var(--ink-primary)" }}>
                          {c.cause}
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                        Evidence: {c.evidence}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeMethod === "kepner_tregoe" && analysisResult?.matrix ? (
        /* KEPNER-TREGOE (IS / IS NOT) VISUALIZER */
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Isolated Environmental Delta Badge */}
          <div
            className="prism-card"
            style={{
              padding: "18px 24px",
              background: "rgba(13, 148, 136, 0.08)",
              border: "1px solid rgba(13, 148, 136, 0.3)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "800", color: "var(--prism-teal)" }}>
              <Split size={16} />
              ISOLATED ENVIRONMENTAL DELTA ({analysisResult.baseline_environment} vs {analysisResult.target_environment})
            </div>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--ink-primary)", marginTop: "8px" }}>
              {analysisResult.isolated_delta}
            </div>
            <div style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "6px" }}>
              <strong>Recommended Verification Test:</strong> {analysisResult.recommended_test}
            </div>
          </div>

          {/* IS / IS NOT Matrix Table */}
          <div className="prism-card" style={{ padding: "0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.03)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ padding: "14px 18px", fontWeight: "700", color: "var(--ink-secondary)", width: "100px" }}>DIMENSION</th>
                  <th style={{ padding: "14px 18px", fontWeight: "700", color: "#10b981" }}>IS (Verified Symptom)</th>
                  <th style={{ padding: "14px 18px", fontWeight: "700", color: "#ef4444" }}>IS NOT (Could Be But Isn't)</th>
                  <th style={{ padding: "14px 18px", fontWeight: "700", color: "var(--prism-purple)" }}>DISTINCTION (What's Different)</th>
                  <th style={{ padding: "14px 18px", fontWeight: "700", color: "var(--ink-primary)" }}>CAUSE CLUE</th>
                </tr>
              </thead>
              <tbody>
                {analysisResult.matrix.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "16px 18px", fontWeight: "800", color: "var(--prism-teal)" }}>
                      {row.dimension}
                    </td>
                    <td style={{ padding: "16px 18px", color: "var(--ink-primary)" }}>
                      {row.is_fact}
                    </td>
                    <td style={{ padding: "16px 18px", color: "var(--ink-secondary)" }}>
                      {row.is_not_fact}
                    </td>
                    <td style={{ padding: "16px 18px", color: "var(--prism-purple)", fontWeight: "600" }}>
                      {row.distinction}
                    </td>
                    <td style={{ padding: "16px 18px", color: "var(--ink-primary)" }}>
                      {row.cause_clue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeMethod === "fmea" && analysisResult?.modes ? (
        /* FMEA RPN VISUALIZER */
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* FMEA KPI Header */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div className="prism-card" style={{ padding: "18px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)" }}>MAX RPN SCORE</div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#ef4444", marginTop: "6px" }}>
                {analysisResult.max_rpn}
              </div>
              <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>RPN = Severity x Occurrence x Detection</div>
            </div>

            <div className="prism-card" style={{ padding: "18px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)" }}>CRITICAL RISKS (RPN &ge; 200)</div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#d97706", marginTop: "6px" }}>
                {analysisResult.critical_risk_count}
              </div>
              <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>Requires engineering redesign</div>
            </div>

            <div className="prism-card" style={{ padding: "18px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)" }}>AVERAGE RPN</div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--prism-teal)", marginTop: "6px" }}>
                {analysisResult.average_rpn}
              </div>
              <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>Across {analysisResult.total_failure_modes_evaluated} evaluated modes</div>
            </div>
          </div>

          {/* FMEA Failure Modes Table */}
          <div className="prism-card" style={{ padding: "0", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.03)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ padding: "14px 18px", fontWeight: "700", color: "var(--ink-secondary)" }}>COMPONENT</th>
                  <th style={{ padding: "14px 18px", fontWeight: "700", color: "var(--ink-secondary)" }}>POTENTIAL FAILURE MODE</th>
                  <th style={{ padding: "14px 12px", fontWeight: "700", color: "var(--ink-secondary)", textAlign: "center" }}>S</th>
                  <th style={{ padding: "14px 12px", fontWeight: "700", color: "var(--ink-secondary)", textAlign: "center" }}>O</th>
                  <th style={{ padding: "14px 12px", fontWeight: "700", color: "var(--ink-secondary)", textAlign: "center" }}>D</th>
                  <th style={{ padding: "14px 16px", fontWeight: "700", color: "var(--ink-secondary)", textAlign: "center" }}>RPN</th>
                  <th style={{ padding: "14px 18px", fontWeight: "700", color: "var(--ink-secondary)" }}>RECOMMENDED MITIGATION</th>
                </tr>
              </thead>
              <tbody>
                {analysisResult.modes.map((mode, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "16px 18px", fontWeight: "700", color: "var(--ink-primary)" }}>
                      {mode.component}
                    </td>
                    <td style={{ padding: "16px 18px", color: "var(--ink-secondary)" }}>
                      <strong>{mode.failure_mode}</strong>
                      <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "2px" }}>
                        Effect: {mode.effects_of_failure}
                      </div>
                    </td>
                    <td style={{ padding: "16px 12px", textAlign: "center", fontWeight: "700", color: "#ef4444" }}>{mode.severity}</td>
                    <td style={{ padding: "16px 12px", textAlign: "center", fontWeight: "700", color: "#d97706" }}>{mode.occurrence}</td>
                    <td style={{ padding: "16px 12px", textAlign: "center", fontWeight: "700", color: "var(--prism-teal)" }}>{mode.detection}</td>
                    <td style={{ padding: "16px 16px", textAlign: "center" }}>
                      <span
                        className="badge"
                        style={{
                          fontSize: "12px",
                          fontWeight: "800",
                          background: mode.rpn >= 200 ? "rgba(239, 68, 68, 0.15)" : "rgba(13, 148, 136, 0.15)",
                          color: mode.rpn >= 200 ? "#ef4444" : "var(--prism-teal)"
                        }}
                      >
                        {mode.rpn}
                      </span>
                    </td>
                    <td style={{ padding: "16px 18px", fontSize: "12px", color: "var(--ink-primary)" }}>
                      {mode.recommended_mitigation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeMethod === "fault_tree" && analysisResult?.root_gate ? (
        /* FAULT TREE (FTA) VISUALIZER */
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Active Cut Set Alert */}
          <div
            className="prism-card"
            style={{
              padding: "18px 24px",
              background: "rgba(13, 148, 136, 0.08)",
              border: "1px solid rgba(13, 148, 136, 0.3)"
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: "800", color: "var(--prism-teal)" }}>
              BOOLEAN FAULT TREE DEDUCTION
            </div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-primary)", marginTop: "6px" }}>
              {analysisResult.conclusion}
            </div>
            <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)" }}>ACTIVE CUT SET:</span>
              {analysisResult.active_cut_set.map((item, idx) => (
                <span key={idx} className="badge badge-pink" style={{ fontSize: "11px" }}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Logic Tree Hierarchy */}
          <div className="prism-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <span className="badge badge-neutral" style={{ fontSize: "12px", fontWeight: "800" }}>TOP EVENT</span>
              <span style={{ fontSize: "16px", fontWeight: "800", color: "var(--ink-primary)" }}>
                {analysisResult.top_event}
              </span>
              <span className="badge badge-pink" style={{ marginLeft: "auto" }}>
                TRIGGERED (OR GATE)
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
              {analysisResult.root_gate.children.map((branch, bIdx) => (
                <div
                  key={bIdx}
                  className="prism-card"
                  style={{
                    padding: "18px",
                    border: branch.status === "VERIFIED_TRUE" ? "2px solid #ef4444" : "1px solid var(--border-subtle)",
                    background: branch.status === "VERIFIED_TRUE" ? "rgba(239, 68, 68, 0.04)" : "var(--bg-card)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-primary)" }}>
                      {branch.event}
                    </span>
                    <span className={`badge ${branch.status === "VERIFIED_TRUE" ? "badge-pink" : "badge-neutral"}`}>
                      {branch.operator} GATE • {branch.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--ink-secondary)", marginBottom: "12px" }}>
                    {branch.description}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {branch.children.map((leaf, lIdx) => (
                      <div
                        key={lIdx}
                        style={{
                          padding: "10px",
                          borderRadius: "6px",
                          background: leaf.status === "VERIFIED_TRUE" ? "rgba(239, 68, 68, 0.08)" : "rgba(0,0,0,0.02)",
                          fontSize: "12px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: leaf.status === "VERIFIED_TRUE" ? "700" : "500", color: "var(--ink-primary)" }}>
                            {leaf.event}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "2px" }}>
                            Evidence: {leaf.evidence}
                          </div>
                        </div>
                        <span className={`badge ${leaf.status === "VERIFIED_TRUE" ? "badge-teal" : "badge-neutral"}`} style={{ fontSize: "10px" }}>
                          P = {leaf.probability}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeMethod === "auto_ensemble" && analysisResult?.executive_summary ? (
        /* AUTO-ENSEMBLE SYNTHESIS VISUALIZER */
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            className="prism-card"
            style={{
              padding: "24px",
              background: "linear-gradient(135deg, rgba(13, 148, 136, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)",
              border: "1px solid rgba(13, 148, 136, 0.3)"
            }}
          >
            <span className="badge badge-teal" style={{ fontSize: "11px", fontWeight: "800" }}>
              COMPOSITE SRE SYNTHESIS REPORT
            </span>
            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--ink-primary)", marginTop: "8px" }}>
              {analysisResult.incident_title}
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
              <div className="prism-card" style={{ padding: "16px", background: "var(--bg-card)" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)" }}>ISOLATED ROOT CAUSE (5 WHYS)</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-primary)", marginTop: "6px" }}>
                  {analysisResult.executive_summary.isolated_root_cause}
                </div>
              </div>

              <div className="prism-card" style={{ padding: "16px", background: "var(--bg-card)" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)" }}>ENVIRONMENTAL DELTA (KEPNER-TREGOE)</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-primary)", marginTop: "6px" }}>
                  {analysisResult.executive_summary.environmental_delta}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ fontSize: "13px", color: "var(--ink-secondary)" }}>
                <strong>Highest Risk Action:</strong> {analysisResult.executive_summary.critical_mitigation}
              </div>
              <span className="badge badge-pink" style={{ fontSize: "12px", fontWeight: "800" }}>
                Max RPN: {analysisResult.executive_summary.max_rpn}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="prism-card" style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: "var(--ink-tertiary)" }}>Select an RCA methodology above or click "Run RCA Investigation".</p>
        </div>
      )}
    </div>
  );
}
