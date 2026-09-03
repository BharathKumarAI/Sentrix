import React, { useState } from "react";
import { 
  ShieldCheck, 
  MessageSquare, 
  Terminal, 
  Check, 
  X, 
  RotateCw, 
  AlertTriangle, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Lock,
  Key,
  ShieldAlert
} from "lucide-react";

export function ActionApprovalCard({ proposal, delegatedIdentity, onExecuted }) {
  const [status, setStatus] = useState(proposal.status || "PENDING_APPROVAL");
  const [isExecuting, setIsExecuting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  // Jira Delegation Authentication State
  const isJira = proposal.type === "JIRA_COMMENT";
  const isCommand = proposal.type === "RUN_COMMAND";
  const [jiraAuthState, setJiraAuthState] = useState(isJira ? "AUTH_REQUIRED" : "AUTHENTICATED");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const executeApproval = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      setStatus("EXECUTED");
      if (isJira) {
        setExecutionResult({
          message: `Successfully posted investigation comment to Jira ticket ${proposal.ticket_key} via authenticated OAuth session for ${delegatedIdentity}.`,
          timestamp: new Date().toLocaleTimeString()
        });
      } else {
        setExecutionResult({
          message: `Command executed on cluster ${proposal.target_cluster}: deployment.apps/stripe-webhook-worker restarted. 3 replicas rolled out.`,
          timestamp: new Date().toLocaleTimeString()
        });
      }
      if (onExecuted) onExecuted(proposal.id);
    }, 900);
  };

  const handleApproveClick = () => {
    if (isJira && jiraAuthState !== "AUTHENTICATED") {
      setShowAuthModal(true);
      return;
    }
    executeApproval();
  };

  const handleAuthenticateAndPost = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      setJiraAuthState("AUTHENTICATED");
      setShowAuthModal(false);
      executeApproval();
    }, 850);
  };

  const handleCloseAuth = () => {
    setShowAuthModal(false);
    setJiraAuthState("AUTH_CLOSED");
  };

  const handleReject = () => {
    setStatus("REJECTED");
  };

  return (
    <div className={`approval-card ${isJira ? "approval-card-jira" : "approval-card-cmd"}`}>
      {/* Top Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isJira ? (
            <MessageSquare size={16} color="var(--accent-blue)" />
          ) : (
            <Terminal size={16} color="var(--accent-amber)" />
          )}
          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink-primary)" }}>
            {proposal.title}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {isJira && (
            <span className="mono badge badge-blue">
              JIRA • {proposal.ticket_key}
            </span>
          )}
          {isCommand && (
            <span className="mono badge badge-amber">
              RISK: {proposal.risk_level || "MEDIUM"}
            </span>
          )}
          <span className={`badge ${
            status === "EXECUTED" ? "badge-teal" :
            status === "REJECTED" ? "badge-rose" : "badge-magenta"
          }`}>
            {status.replace("_", " ")}
          </span>
        </div>
      </div>

      <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginBottom: "12px", lineHeight: "1.5" }}>
        {proposal.description}
      </p>

      {/* Content Preview Box */}
      {isJira && (
        <div style={{
          background: "var(--thinking-bg)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "8px",
          padding: "12px 14px",
          marginBottom: "14px",
          fontSize: "12px",
          lineHeight: "1.6",
          color: "var(--ink-secondary)"
        }}>
          <div style={{ fontSize: "10.5px", fontWeight: "700", color: "var(--accent-blue)", textTransform: "uppercase", marginBottom: "6px" }}>
            Proposed Jira Comment (Markdown):
          </div>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", fontSize: "11.5px", color: "var(--ink-primary)" }}>
            {proposal.content}
          </pre>
        </div>
      )}

      {isCommand && (
        <div style={{
          background: "var(--thinking-bg)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "8px",
          padding: "12px 14px",
          marginBottom: "14px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: "700", color: "var(--accent-amber)", textTransform: "uppercase" }}>
              Shell Command to Execute:
            </span>
            <span className="mono" style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>
              Target: {proposal.target_cluster}
            </span>
          </div>
          <div className="mono" style={{ fontSize: "12px", color: "var(--accent-teal)", padding: "8px 10px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "6px" }}>
            $ {proposal.command}
          </div>
          {proposal.rollback_command && (
            <div style={{ fontSize: "10.5px", color: "var(--ink-tertiary)", marginTop: "6px" }}>
              Rollback plan: <code className="mono">{proposal.rollback_command}</code>
            </div>
          )}
        </div>
      )}

      {/* Execution Confirmation Alert */}
      {status === "EXECUTED" && executionResult && (
        <div style={{
          background: "rgba(16, 185, 129, 0.12)",
          border: "1px solid rgba(16, 185, 129, 0.35)",
          borderRadius: "8px",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "12px"
        }}>
          <Check size={16} color="var(--accent-teal)" />
          <div style={{ fontSize: "12px", color: "var(--ink-primary)" }}>
            {executionResult.message}
            <span className="mono" style={{ fontSize: "10px", color: "var(--accent-teal)", marginLeft: "8px" }}>
              at {executionResult.timestamp}
            </span>
          </div>
        </div>
      )}

      {/* Jira Authentication Closed Alert */}
      {isJira && jiraAuthState === "AUTH_CLOSED" && status === "PENDING_APPROVAL" && (
        <div style={{
          background: "rgba(245, 158, 11, 0.12)",
          border: "1px solid rgba(245, 158, 11, 0.35)",
          borderRadius: "8px",
          padding: "10px 14px",
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--ink-primary)" }}>
            <Lock size={15} color="var(--accent-amber)" />
            <span><strong>Authentication Closed:</strong> Jira OAuth session was closed. Re-authenticate to post to {proposal.ticket_key}.</span>
          </div>
          <button
            className="btn-secondary"
            onClick={() => setShowAuthModal(true)}
            style={{ fontSize: "11px", padding: "4px 10px", whiteSpace: "nowrap" }}
          >
            Re-authenticate & Post
          </button>
        </div>
      )}

      {status === "REJECTED" && (
        <div style={{
          background: "rgba(239, 68, 68, 0.12)",
          border: "1px solid rgba(239, 68, 68, 0.35)",
          borderRadius: "8px",
          padding: "10px 14px",
          fontSize: "12px",
          color: "var(--accent-rose)",
          marginBottom: "12px"
        }}>
          Action was rejected by user. No mutation was performed.
        </div>
      )}

      {/* Action Buttons */}
      {status === "PENDING_APPROVAL" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
          <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
            Requires authorization under <strong style={{ color: "var(--ink-primary)" }}>{delegatedIdentity}</strong>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn-ghost"
              onClick={handleReject}
              disabled={isExecuting}
              style={{ fontSize: "11.5px", padding: "6px 12px" }}
            >
              <X size={13} /> Reject
            </button>

            <button
              className={isJira ? "btn-primary" : "btn-teal"}
              onClick={handleApproveClick}
              disabled={isExecuting}
              style={{ fontSize: "12px", padding: "7px 16px" }}
            >
              {isExecuting ? (
                <>
                  <RotateCw size={13} className="animate-spin" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  <span>{isJira ? "Approve & Post to Jira" : "Authorize & Run Command"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* JIRA OAUTH AUTHENTICATION MODAL */}
      {showAuthModal && (
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
            maxWidth: "460px",
            padding: "24px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "rgba(59, 130, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Lock size={18} color="var(--accent-blue)" />
                </div>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--ink-primary)", margin: 0 }}>
                    Atlassian Jira Authentication
                  </h3>
                  <span style={{ fontSize: "11px", color: "var(--ink-secondary)" }}>
                    OAuth 2.0 Delegation Verification
                  </span>
                </div>
              </div>
              <button className="btn-ghost" style={{ padding: "4px" }} onClick={handleCloseAuth}>
                <X size={16} />
              </button>
            </div>

            {/* Context Body */}
            <div style={{
              background: "var(--thinking-bg)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "12px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-tertiary)" }}>Target Ticket:</span>
                <span className="mono badge badge-blue">{proposal.ticket_key}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-tertiary)" }}>Identity:</span>
                <span className="mono" style={{ color: "var(--ink-primary)", fontWeight: "600" }}>{delegatedIdentity}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-tertiary)" }}>Permission Scopes:</span>
                <span className="mono" style={{ color: "var(--accent-teal)" }}>read:jira-work, write:jira-work</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-tertiary)" }}>Session Status:</span>
                <span className="badge badge-amber" style={{ fontSize: "9.5px" }}>CLOSED / AUTH REQUIRED</span>
              </div>
            </div>

            <p style={{ fontSize: "12px", color: "var(--ink-secondary)", lineHeight: "1.5", margin: 0 }}>
              Posting comments to production tickets requires an active authenticated delegated session. Authorize with your enterprise Atlassian SSO credentials to complete this action.
            </p>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
              <button
                className="btn-ghost"
                onClick={handleCloseAuth}
                disabled={isAuthenticating}
                style={{ fontSize: "12px", padding: "8px 14px" }}
              >
                Cancel / Close
              </button>
              <button
                className="btn-primary"
                onClick={handleAuthenticateAndPost}
                disabled={isAuthenticating}
                style={{ fontSize: "12px", padding: "8px 18px", gap: "8px" }}
              >
                {isAuthenticating ? (
                  <>
                    <RotateCw size={13} className="animate-spin" />
                    <span>Verifying SSO Token...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>Authenticate with SSO & Post</span>
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
