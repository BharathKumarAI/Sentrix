import React, { useState } from "react";
import { 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  X, 
  Key, 
  Lock, 
  FileDiff,
  Copy,
  CheckCheck
} from "lucide-react";

export function ActionProposalCard({
  proposal,
  delegatedIdentity,
  onApprove,
  onReject
}) {
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isExecuted, setIsExecuted] = useState(proposal.status === "EXECUTED");
  const [copiedHash, setCopiedHash] = useState(false);

  const isHighImpact = proposal.risk_level === "HIGH_IMPACT";

  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    try {
      await onApprove(proposal.proposal_id || proposal.id);
      setIsExecuted(true);
    } catch (e) {
      console.error("Authorization failed", e);
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(proposal.canonical_hash || "sha256_mock");
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="glass-panel" style={{
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      border: isHighImpact ? "1px solid rgba(255, 122, 182, 0.4)" : "1px solid rgba(78, 230, 199, 0.4)",
      borderRadius: "var(--radius-md)",
      position: "relative",
      overflow: "hidden"
    }}>
      
      {/* Top Banner: Risk Level & Operation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className={`badge ${isHighImpact ? "badge-rose" : "badge-teal"}`}>
            {isHighImpact ? "HIGH IMPACT WRITE" : "LOW RISK WRITE"}
          </span>
          <span className="mono" style={{ fontSize: "13px", fontWeight: "700", color: "#fff" }}>
            {proposal.operation}
          </span>
        </div>

        {/* Target Badge */}
        <div className="mono" style={{ fontSize: "11px", color: "var(--ink-secondary)", background: "rgba(255, 255, 255, 0.06)", padding: "3px 8px", borderRadius: "4px" }}>
          Target: {JSON.stringify(proposal.target || proposal.target_resource || {})}
        </div>
      </div>

      {/* Delegated Identity Security Callout */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderRadius: "var(--radius-sm)",
        background: "rgba(139, 125, 255, 0.08)",
        border: "1px solid rgba(139, 125, 255, 0.2)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
          <Key size={14} color="var(--accent-violet)" />
          <span style={{ color: "var(--ink-secondary)" }}>Executing as: </span>
          <strong className="mono" style={{ color: "#fff" }}>{delegatedIdentity} (Delegated OAuth)</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--accent-teal)" }}>
          <ShieldCheck size={13} /> Human Cryptographic Sign-Off Required
        </div>
      </div>

      {/* Payload Diff Viewer */}
      {proposal.diff_preview && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: "600", textTransform: "uppercase" }}>
            <FileDiff size={12} /> Payload Diff Preview
          </div>
          <pre className="mono" style={{
            background: "rgba(0, 0, 0, 0.45)",
            padding: "12px",
            borderRadius: "var(--radius-sm)",
            fontSize: "11px",
            lineHeight: "1.5",
            color: "#4ee6c7",
            overflowX: "auto",
            border: "1px solid rgba(255, 255, 255, 0.08)"
          }}>
            {proposal.diff_preview}
          </pre>
        </div>
      )}

      {/* Canonical Hash & Actions Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", paddingTop: "6px" }}>
        <div 
          onClick={handleCopyHash}
          style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "11px", color: "var(--ink-tertiary)" }}
        >
          <Lock size={12} color="var(--ink-tertiary)" />
          <span className="mono">sha256: {(proposal.canonical_hash || "hash").slice(0, 16)}...</span>
          {copiedHash ? <CheckCheck size={12} color="var(--accent-teal)" /> : <Copy size={12} />}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isExecuted ? (
            <div className="badge badge-teal" style={{ padding: "6px 14px", fontSize: "12px" }}>
              <Check size={14} /> Executed under {delegatedIdentity}
            </div>
          ) : (
            <>
              <button
                className="btn-secondary"
                onClick={() => onReject(proposal.proposal_id || proposal.id)}
                disabled={isAuthorizing}
                style={{ color: "var(--accent-rose)", borderColor: "rgba(255, 122, 182, 0.3)" }}
              >
                <X size={14} /> Reject Proposal
              </button>
              
              <button
                className={isHighImpact ? "btn-primary" : "btn-teal"}
                onClick={handleAuthorize}
                disabled={isAuthorizing}
                style={{
                  background: isHighImpact 
                    ? "linear-gradient(135deg, #ff7ab6 0%, #8b7dff 100%)" 
                    : undefined
                }}
              >
                <ShieldCheck size={15} /> 
                {isAuthorizing ? "Authorizing..." : "Authorize & Execute Write"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
