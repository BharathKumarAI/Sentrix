import React, { useState } from "react";
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  Search,
  Sliders,
  Cpu,
  Layers,
  Sparkles
} from "lucide-react";

export function AdminModelProvidersPage() {
  const [testingModel, setTestingModel] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const providers = [
    {
      id: "prov-google",
      name: "Google Vertex AI / Gemini",
      models: ["Gemini 2.5 Pro", "Gemini 2.5 Flash"],
      role: "Default Reasoning Engine (ADK 2.8)",
      status: "CONNECTED",
      latency: "410ms",
      quotaRpm: 1200,
      currentUsagePct: 38,
      fallbackPriority: 1,
      description: "Primary model for complex error stack deconstruction, log pattern synthesis, and runbook correlation."
    },
    {
      id: "prov-anthropic",
      name: "Anthropic Claude API",
      models: ["Claude 3.5 Sonnet", "Claude 3.5 Haiku"],
      role: "Database & Code Specialist",
      status: "CONNECTED",
      latency: "520ms",
      quotaRpm: 800,
      currentUsagePct: 44,
      fallbackPriority: 2,
      description: "Specialized in deterministic SQL query plan generation, locking graph analysis, and code patch synthesis."
    },
    {
      id: "prov-openai",
      name: "OpenAI Platform",
      models: ["GPT-4o", "GPT-4o Mini"],
      role: "Gateway & Network Sentinel",
      status: "CONNECTED",
      latency: "460ms",
      quotaRpm: 1500,
      currentUsagePct: 29,
      fallbackPriority: 3,
      description: "Used for OAuth2 proxy traffic correlation and Envoy network latency anomaly detection."
    },
    {
      id: "prov-local",
      name: "Local Private vLLM Cluster",
      models: ["Llama 3.3 70B Instruct (vLLM)"],
      role: "Air-Gapped / Sensitive Data Fallback",
      status: "CONNECTED",
      latency: "180ms",
      quotaRpm: 3000,
      currentUsagePct: 12,
      fallbackPriority: 4,
      description: "Zero external network egress model for strictly confidential customer PII logs and financial ledger tokens."
    }
  ];

  const handleTestModel = (provName) => {
    setTestingModel(provName);
    setTestResult(null);
    setTimeout(() => {
      setTestingModel(null);
      setTestResult({
        provider: provName,
        status: "SUCCESS",
        latency: "340ms",
        message: "Model handshake successful. Streaming response validated with zero tokens throttled."
      });
    }, 800);
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
            <Database size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                PLATFORM ADMIN
              </span>
              <span className="badge badge-teal">4 Providers Connected</span>
              <span className="badge badge-magenta">Automatic Multi-Model Failover</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Model Providers & LLM Governance
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Manage AI foundational models, rate limit quotas, token latency, and air-gapped private cluster fallbacks.
            </p>
          </div>
        </div>
      </div>

      {/* Providers Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
        {providers.map((prov) => (
          <div
            key={prov.id}
            className="prism-card"
            style={{
              padding: "20px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>{prov.name}</h3>
                <div style={{ fontSize: "11.5px", color: "var(--prism-pink)", fontWeight: 600, marginTop: "2px" }}>
                  {prov.role}
                </div>
              </div>
              <span className="badge badge-teal">{prov.status}</span>
            </div>

            <p style={{ fontSize: "12px", color: "var(--ink-secondary)", lineHeight: 1.5 }}>
              {prov.description}
            </p>

            {/* Models list */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {prov.models.map((m) => (
                <span key={m} className="badge badge-magenta" style={{ fontSize: "10.5px" }}>
                  {m}
                </span>
              ))}
            </div>

            {/* Quota bar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11.5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-tertiary)" }}>RPM Rate Limit: {prov.quotaRpm}</span>
                <span style={{ color: "var(--accent-teal)", fontWeight: 600 }}>{prov.currentUsagePct}% utilized</span>
              </div>
              <div style={{ height: "4px", borderRadius: "999px", background: "var(--bg-input)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${prov.currentUsagePct}%`, background: "var(--accent-teal)" }} />
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px", marginTop: "auto" }}>
              <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                Latency: <strong style={{ color: "var(--accent-violet)" }}>{prov.latency}</strong> • Priority #{prov.fallbackPriority}
              </span>
              <button
                onClick={() => handleTestModel(prov.name)}
                disabled={testingModel === prov.name}
                className="btn-secondary"
                style={{ padding: "4px 10px", fontSize: "11px", gap: "4px" }}
              >
                <Play size={11} /> Test Ingest
              </button>
            </div>
          </div>
        ))}
      </div>

      {testResult && (
        <div style={{ padding: "12px 16px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "var(--accent-teal)", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={16} />
          <span>{testResult.provider}: {testResult.message} (Latency: {testResult.latency})</span>
        </div>
      )}
    </div>
  );
}
