import React, { useState } from "react";
import { 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  Terminal, 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  Database, 
  RotateCw, 
  Sparkles,
  Layers,
  ArrowRight
} from "lucide-react";
import { ActionProposalCard } from "./ActionProposalCard";
import { OpenWorkerArtifactRenderer } from "./OpenWorkerArtifactRenderer";

export function AutoTriageHub({
  activeProject,
  activeEnvironment,
  delegatedIdentity,
  onActionApproved,
  onActionRejected,
  onViewEvidence
}) {
  const [issueTitle, setIssueTitle] = useState(
    "Stripe Webhook Timeout: Cascading 504 Gateway Timeouts in Billing Ledger"
  );
  const [issueDescription, setIssueDescription] = useState(
    "High severity alert: >5% 504 timeouts observed on /v1/webhooks/charges during recurring subscription billing run. Webhook workers failing health checks."
  );
  const [errorLogs, setErrorLogs] = useState(
    "PoolAcquireTimeoutException: Connection to PostgreSQL primary timed out after 30000ms. Active pool 20/20 saturated."
  );
  const [jiraKey, setJiraKey] = useState("BILL-1049");
  
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [events, setEvents] = useState([]);
  const [triageResult, setTriageResult] = useState(null);
  const [stagedProposals, setStagedProposals] = useState([]);

  // Pre-canned Incident Templates
  const incidentTemplates = [
    {
      label: "Stripe Webhook DB Pool Saturation",
      title: "Stripe Webhook Timeout: Cascading 504 Gateway Timeouts in Billing Ledger",
      desc: "High severity alert: >5% 504 timeouts on /v1/webhooks/charges. Active pool saturated.",
      logs: "PoolAcquireTimeoutException: Connection to PostgreSQL primary timed out after 30000ms. Active pool 20/20 saturated.",
      jira: "BILL-1049"
    },
    {
      label: "JWT Token Signature Verification Skew",
      title: "JWT Token Signature Verification Failure on Auth Edge Proxy",
      desc: "Users unable to login; edge proxy returning HTTP 401 Unauthorized for valid OAuth tokens.",
      logs: "TokenVerificationError: Signature key ID 'rsa-2026-q3' not present in cached JWKS keystore.",
      jira: "AUTH-892"
    },
    {
      label: "Inventory Lock Deadlock in Fulfillment",
      title: "Inventory Allocation Lock Timeout during Flash Sale",
      desc: "Order processing stalled on sku_warehouse_allocation table locks.",
      logs: "ERROR: deadlock detected - Process 4120 waits for ExclusiveLock on relation orders.",
      jira: "FUL-301"
    }
  ];

  const handleSelectTemplate = (tmpl) => {
    setIssueTitle(tmpl.title);
    setIssueDescription(tmpl.desc);
    setErrorLogs(tmpl.logs);
    setJiraKey(tmpl.jira);
  };

  const handleLaunchTriage = async () => {
    setIsInvestigating(true);
    setEvents([]);
    setTriageResult(null);
    setStagedProposals([]);

    try {
      const response = await fetch("http://localhost:8000/api/investigations/auto-triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: activeProject?.id || "prj_billing",
          environment: activeEnvironment || "prod",
          issue_title: issueTitle,
          issue_description: issueDescription,
          error_logs: errorLogs,
          jira_ticket_key: jiraKey,
          delegated_identity: delegatedIdentity,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop(); // Keep partial line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const rawData = line.slice(6);
            try {
              const event = JSON.parse(rawData);
              setEvents((prev) => [...prev, event]);

              if (event.type === "ACTION_PROPOSED") {
                setStagedProposals((prev) => [...prev, event.payload]);
              }

              if (event.type === "RUN_COMPLETED") {
                setTriageResult(event.payload);
              }
            } catch (e) {
              console.error("Error parsing SSE event", e);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to execute auto-triage stream", err);
    } finally {
      setIsInvestigating(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px" }}>
      
      {/* Incident Input Panel */}
      <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Zap size={20} color="var(--accent-teal)" />
              <h2 style={{ fontSize: "18px" }}>Autonomous Multi-Tool Triage Hub</h2>
              <span className="badge badge-teal">Google ADK 2.8.0</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "4px" }}>
              Deconstructs incident telemetry, cross-queries Splunk, PostgreSQL, and Kubernetes, and prepares cryptographically governed action proposals.
            </p>
          </div>

          {/* Quick incident templates */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: "600" }}>Templates:</span>
            {incidentTemplates.map((t) => (
              <button
                key={t.label}
                className="btn-secondary"
                style={{ fontSize: "11px", padding: "4px 10px" }}
                onClick={() => handleSelectTemplate(t)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Fields Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>Incident Title</label>
            <input
              type="text"
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              className="glass-card"
              style={{
                width: "100%",
                padding: "10px 14px",
                marginTop: "6px",
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
                fontSize: "13px",
                border: "1px solid var(--border-glass)",
                borderRadius: "var(--radius-sm)"
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>Jira Issue Key (Target)</label>
            <input
              type="text"
              value={jiraKey}
              onChange={(e) => setJiraKey(e.target.value)}
              className="glass-card"
              style={{
                width: "100%",
                padding: "10px 14px",
                marginTop: "6px",
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
                fontSize: "13px",
                border: "1px solid var(--border-glass)",
                borderRadius: "var(--radius-sm)"
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>Error Logs / Stacktrace Snippet</label>
          <textarea
            rows={2}
            value={errorLogs}
            onChange={(e) => setErrorLogs(e.target.value)}
            className="glass-card mono"
            style={{
              width: "100%",
              padding: "10px 14px",
              marginTop: "6px",
              background: "rgba(255,255,255,0.03)",
              color: "#ffd699",
              fontSize: "12px",
              border: "1px solid var(--border-glass)",
              borderRadius: "var(--radius-sm)",
              resize: "vertical"
            }}
          />
        </div>

        {/* CTA Launch */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "6px" }}>
          <button
            className="btn-teal"
            disabled={isInvestigating}
            onClick={handleLaunchTriage}
            style={{ padding: "10px 24px", fontSize: "14px" }}
          >
            {isInvestigating ? (
              <>
                <RotateCw size={16} className="animate-spin" /> Investigating Live Telemetry...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Launch Autonomous Triage
              </>
            )}
          </button>
        </div>
      </div>

      {/* Investigation Results & Telemetry Flow */}
      {(isInvestigating || events.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          
          {/* Left Column: Live Run Event Stream & Timeline */}
          <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Terminal size={16} color="var(--accent-violet)" />
                <h3 style={{ fontSize: "14px" }}>ADK Execution State Machine</h3>
              </div>
              <span className="mono" style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                {events.length} Events Received
              </span>
            </div>

            {/* Event Timeline Feed */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              maxHeight: "420px",
              overflowY: "auto",
              paddingRight: "6px"
            }}>
              {events.map((evt, idx) => (
                <div
                  key={evt.event_id || idx}
                  className="glass-card"
                  style={{
                    padding: "10px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    borderLeft: evt.type === "ACTION_PROPOSED" 
                      ? "3px solid var(--accent-rose)" 
                      : evt.type === "TOOL_RESULT" 
                      ? "3px solid var(--accent-teal)" 
                      : "3px solid var(--accent-violet)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="mono" style={{ fontSize: "11px", fontWeight: "700", color: "#fff" }}>
                      {evt.type}
                    </span>
                    <span className="mono" style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>
                      {evt.occurred_at ? new Date(evt.occurred_at).toLocaleTimeString() : ""}
                    </span>
                  </div>

                  <div style={{ fontSize: "12px", color: "var(--ink-secondary)" }}>
                    {evt.payload?.message || evt.payload?.result_summary || evt.payload?.summary || JSON.stringify(evt.payload)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Verified Root Cause & Staged Proposals */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Root Cause Card */}
            {triageResult && (
              <div className="glass-panel" style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                border: "1px solid rgba(78, 230, 199, 0.4)",
                background: "linear-gradient(135deg, rgba(78, 230, 199, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={18} color="var(--accent-teal)" />
                    <h3 style={{ fontSize: "15px", color: "#fff" }}>Verified Root Cause Hypothesis</h3>
                  </div>
                  <span className="badge badge-teal">
                    {Math.round(triageResult.confidence_score * 100)}% Match
                  </span>
                </div>

                <p style={{ fontSize: "13px", lineHeight: "1.5", color: "var(--ink-primary)" }}>
                  {triageResult.root_cause}
                </p>

                <div style={{ display: "flex", gap: "16px", paddingTop: "8px", borderTop: "1px solid var(--border-glass)" }}>
                  <div style={{ fontSize: "11px", color: "var(--ink-secondary)" }}>
                    Telemetry Duration: <strong className="mono" style={{ color: "#fff" }}>{triageResult.duration_ms}ms</strong>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--ink-secondary)" }}>
                    Evidence Artifacts: <strong className="mono" style={{ color: "var(--accent-teal)" }}>{triageResult.evidence_count} items</strong>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--ink-secondary)" }}>
                    Proposals Staged: <strong className="mono" style={{ color: "var(--accent-rose)" }}>{triageResult.proposals_count}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* OpenWorker Dynamic Artifact Visualizer (Adaptive Charts, Tables, Diffs) */}
            {triageResult && (
              <OpenWorkerArtifactRenderer artifactType="CHART" />
            )}

            {/* Governed Action Proposals Section */}
            {stagedProposals.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldCheck size={18} color="var(--accent-rose)" />
                  <h3 style={{ fontSize: "15px" }}>Governed Action Proposals (Awaiting Authorization)</h3>
                  <span className="badge badge-rose">Cryptographic Lock</span>
                </div>

                {stagedProposals.map((prop) => (
                  <ActionProposalCard
                    key={prop.proposal_id}
                    proposal={prop}
                    delegatedIdentity={delegatedIdentity}
                    onApprove={(id) => onActionApproved(id)}
                    onReject={(id) => onActionRejected(id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
