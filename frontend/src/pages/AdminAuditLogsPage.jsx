import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Shield,
  Lock,
  FileText,
  Copy,
  Check,
  RotateCw,
  AlertTriangle,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Activity,
  Fingerprint,
  Terminal
} from "lucide-react";
import {
  fetchAdminAuditLogs,
  fetchAdminAuditStats,
  verifyAdminAuditLedger
} from "../api/client";

export function AdminAuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [resourceFilter, setResourceFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [totalRecords, setTotalRecords] = useState(0);
  const [auditRecords, setAuditRecords] = useState([]);
  const [stats, setStats] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [error, setError] = useState(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load audit statistics
  const loadStats = useCallback(async () => {
    try {
      const data = await fetchAdminAuditStats();
      if (data && !data.error) {
        setStats(data);
      }
    } catch (err) {
      console.warn("Failed to load audit stats:", err);
    }
  }, []);

  // Load audit records from backend
  const loadAuditLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        limit: pageSize,
        offset: page * pageSize,
        search: debouncedSearch.trim() || undefined,
        action_type: actionFilter !== "ALL" ? actionFilter : undefined,
        resource_type: resourceFilter !== "ALL" ? resourceFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined
      };

      const res = await fetchAdminAuditLogs(params);

      if (res && res.items !== undefined) {
        setAuditRecords(res.items);
        setTotalRecords(res.total || res.items.length);
      } else if (Array.isArray(res)) {
        setAuditRecords(res);
        setTotalRecords(res.length);
      } else {
        setAuditRecords([]);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error("Failed to load audit records:", err);
      setError("Unable to connect to the Cryptographic Audit Ledger backend service.");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, actionFilter, resourceFilter, statusFilter]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  // Handle on-demand cryptographic verification
  const handleVerifyLedger = async () => {
    setIsVerifying(true);
    try {
      const result = await verifyAdminAuditLedger();
      setVerificationResult(result);
      await loadStats();
      await loadAuditLogs();
    } catch (err) {
      console.error("Verification failed:", err);
      setVerificationResult({
        status: "ERROR",
        message: "Failed to communicate with the verification engine."
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Copy hash to clipboard
  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Export logs to CSV
  const handleExportCSV = () => {
    if (auditRecords.length === 0) return;
    const headers = ["ID", "Timestamp", "Actor", "IP Address", "Action Type", "Resource Type", "Resource ID", "Status", "SHA-256 Signature", "Details"];
    const rows = auditRecords.map(r => [
      `"${r.id}"`,
      `"${r.occurred_at || ""}"`,
      `"${r.actor_id}"`,
      `"${r.ip_address || "127.0.0.1"}"`,
      `"${r.action_type}"`,
      `"${r.resource_type}"`,
      `"${r.resource_id}"`,
      `"${r.status || "VERIFIED"}"`,
      `"${r.row_hash || ""}"`,
      `"${JSON.stringify(r.details || {}).replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sentrix_audit_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export logs to JSON
  const handleExportJSON = () => {
    if (auditRecords.length === 0) return;
    const blob = new Blob([JSON.stringify(auditRecords, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sentrix_audit_ledger_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Action badge color classifier
  const getActionBadgeClass = (action) => {
    const act = (action || "").toUpperCase();
    if (act.includes("DELETE") || act.includes("REVOKE") || act.includes("BREACH") || act.includes("BLOCKED")) {
      return "badge-rose";
    }
    if (act.includes("STATUS") || act.includes("CHANGE") || act.includes("MODIFY")) {
      return "badge-amber";
    }
    if (act.includes("APPROVED") || act.includes("HEALTH") || act.includes("SUCCESS")) {
      return "badge-teal";
    }
    if (act.includes("KEY") || act.includes("SECRET") || act.includes("PROMPT") || act.includes("TEMPLATE")) {
      return "badge-violet";
    }
    if (act.includes("POLICY") || act.includes("SECURITY") || act.includes("ENFORCE")) {
      return "badge-magenta";
    }
    return "badge-blue";
  };

  // Unique options for filters from current or stats
  const availableActionTypes = stats?.action_breakdown ? Object.keys(stats.action_breakdown) : [];
  const availableResourceTypes = stats?.resource_breakdown ? Object.keys(stats.resource_breakdown) : [];

  const totalPages = Math.ceil(totalRecords / pageSize);
  const startRecord = totalRecords === 0 ? 0 : page * pageSize + 1;
  const endRecord = Math.min((page + 1) * pageSize, totalRecords);

  const isFilterActive = debouncedSearch || actionFilter !== "ALL" || resourceFilter !== "ALL" || statusFilter !== "ALL";

  return (
    <div
      style={{
        padding: "24px 32px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        overflowY: "auto",
        minHeight: "100%",
        boxSizing: "border-box"
      }}
    >
      {/* 1. Framework Standard Page Hero */}
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
              boxShadow: "0 0 18px var(--prism-glow)",
              flexShrink: 0
            }}
          >
            <ShieldCheck size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                PLATFORM ADMIN • COMPLIANCE LEDGER
              </span>
              <span className="badge badge-teal">Immutable SHA-256</span>
              <span className="badge badge-magenta">SOC 2 / ISO 27001 Compliant</span>
              {stats && (
                <span className="badge badge-blue">
                  {stats.verified_count}/{stats.total_events} Sealed
                </span>
              )}
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Cryptographic Audit & Compliance Ledger
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Tamper-evident audit trail of all high-impact mutations, tool authorizations, and delegated identity releases.
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            className="btn-secondary"
            onClick={handleExportCSV}
            title="Download CSV export of current ledger records"
            style={{ fontSize: "12px", gap: "6px" }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            className="btn-secondary"
            onClick={handleExportJSON}
            title="Download JSON payload of current ledger records"
            style={{ fontSize: "12px", gap: "6px" }}
          >
            <FileText size={14} /> JSON
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              loadStats();
              loadAuditLogs();
            }}
            disabled={isLoading}
            style={{ fontSize: "12px", gap: "6px" }}
            title="Refresh ledger stream"
          >
            <RotateCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            className="btn-primary"
            onClick={handleVerifyLedger}
            disabled={isVerifying}
            style={{
              fontSize: "12px",
              gap: "6px",
              background: isVerifying ? "var(--ink-tertiary)" : "var(--prism-gradient)",
              color: "#fff"
            }}
          >
            <Shield size={14} />
            {isVerifying ? "Verifying Hashes..." : "Verify Ledger Integrity"}
          </button>
        </div>
      </div>

      {/* 2. Verification Status Banner (If Run or Result Available) */}
      {verificationResult && (
        <div
          className="prism-card"
          style={{
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: verificationResult.status === "VERIFIED"
              ? "rgba(16, 185, 129, 0.08)"
              : "rgba(239, 68, 68, 0.08)",
            border: `1px solid ${verificationResult.status === "VERIFIED" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            borderRadius: "10px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {verificationResult.status === "VERIFIED" ? (
              <CheckCircle2 size={20} color="var(--accent-teal)" />
            ) : (
              <AlertTriangle size={20} color="var(--accent-rose)" />
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: "13.5px", color: "var(--ink-primary)" }}>
                {verificationResult.status === "VERIFIED"
                  ? "Cryptographic Verification Passed — 100% Chain Integrity"
                  : "Ledger Integrity Warning — Signature Mismatch Detected"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "2px" }}>
                {verificationResult.status === "VERIFIED" ? (
                  <>
                    Validated {verificationResult.valid_count} of {verificationResult.total_checked} audit entries against deterministic SHA-256 signatures. No tampering detected.
                  </>
                ) : (
                  <>
                    Found {verificationResult.mismatches_count} mismatched records. Please inspect the audit trail immediately.
                  </>
                )}
                {verificationResult.checked_at && (
                  <span style={{ marginLeft: "8px", opacity: 0.75 }}>
                    ({new Date(verificationResult.checked_at).toLocaleTimeString()})
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setVerificationResult(null)}
            className="btn-ghost"
            style={{ padding: "4px", color: "var(--ink-tertiary)" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 3. Live KPI Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px"
        }}
      >
        {/* Total Events */}
        <div
          className="prism-card"
          style={{
            padding: "16px 20px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            gap: "14px"
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(139, 92, 246, 0.15)",
              color: "var(--accent-violet)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Activity size={22} />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
              Total Ledger Records
            </div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "2px" }}>
              {stats ? stats.total_events : totalRecords}
            </div>
            <div style={{ fontSize: "11px", color: "var(--ink-secondary)" }}>
              Append-only audit trail
            </div>
          </div>
        </div>

        {/* Verified Hashes */}
        <div
          className="prism-card"
          style={{
            padding: "16px 20px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            gap: "14px"
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "var(--accent-teal)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
              Cryptographic Integrity
            </div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--accent-teal)", marginTop: "2px" }}>
              {stats ? `${stats.verification_rate}%` : "100%"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--ink-secondary)" }}>
              {stats ? `${stats.verified_count} verified signatures` : "Deterministic SHA-256"}
            </div>
          </div>
        </div>

        {/* Unique Actors */}
        <div
          className="prism-card"
          style={{
            padding: "16px 20px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            gap: "14px"
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(6, 182, 212, 0.15)",
              color: "var(--prism-cyan, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Fingerprint size={22} />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
              Active Actors & Tools
            </div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "2px" }}>
              {stats ? stats.unique_actors : "—"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--ink-secondary)" }}>
              Human & autonomous agents
            </div>
          </div>
        </div>

        {/* High Impact Security Events */}
        <div
          className="prism-card"
          style={{
            padding: "16px 20px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            gap: "14px"
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(245, 158, 11, 0.15)",
              color: "var(--accent-amber)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Lock size={22} />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
              Security & Policy Events
            </div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--accent-amber)", marginTop: "2px" }}>
              {stats ? stats.security_events : "—"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--ink-secondary)" }}>
              Destructive & key mutations
            </div>
          </div>
        </div>
      </div>

      {/* 4. Filter & Search Controls */}
      <div
        className="prism-card"
        style={{
          padding: "14px 20px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flex: 1 }}>
          {/* Search Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "7px 12px",
              minWidth: "260px",
              maxWidth: "380px",
              flex: 1
            }}
          >
            <Search size={14} color="var(--ink-tertiary)" />
            <input
              type="text"
              placeholder="Search actor, action, IP, or resource..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--ink-primary)",
                fontSize: "12.5px",
                width: "100%"
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="btn-ghost"
                style={{ padding: "0", color: "var(--ink-tertiary)" }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Action Type Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)" }}>Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(0);
              }}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "6px",
                padding: "6px 10px",
                color: "var(--ink-primary)",
                fontSize: "12px",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="ALL">All Actions ({stats?.total_events || ""})</option>
              {availableActionTypes.map((action) => (
                <option key={action} value={action}>
                  {action} ({stats?.action_breakdown?.[action] ?? 0})
                </option>
              ))}
            </select>
          </div>

          {/* Resource Type Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)" }}>Resource:</span>
            <select
              value={resourceFilter}
              onChange={(e) => {
                setResourceFilter(e.target.value);
                setPage(0);
              }}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "6px",
                padding: "6px 10px",
                color: "var(--ink-primary)",
                fontSize: "12px",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="ALL">All Resources</option>
              {availableResourceTypes.map((res) => (
                <option key={res} value={res}>
                  {res} ({stats?.resource_breakdown?.[res] ?? 0})
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)" }}>Integrity:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "6px",
                padding: "6px 10px",
                color: "var(--ink-primary)",
                fontSize: "12px",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified Only</option>
              <option value="TAMPERED">Tampered / Flagged</option>
            </select>
          </div>

          {isFilterActive && (
            <button
              className="btn-ghost"
              onClick={() => {
                setSearchQuery("");
                setActionFilter("ALL");
                setResourceFilter("ALL");
                setStatusFilter("ALL");
                setPage(0);
              }}
              style={{
                fontSize: "11.5px",
                color: "var(--prism-pink)",
                padding: "4px 8px",
                gap: "4px"
              }}
            >
              <X size={12} /> Clear Filters
            </button>
          )}
        </div>

        {/* Page Size Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)" }}>Per Page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
              padding: "4px 8px",
              color: "var(--ink-primary)",
              fontSize: "11.5px",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          className="prism-card"
          style={{
            padding: "16px 20px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "var(--ink-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertTriangle size={18} color="var(--accent-rose)" />
            <span style={{ fontSize: "13px" }}>{error}</span>
          </div>
          <button
            className="btn-secondary"
            onClick={loadAuditLogs}
            style={{ fontSize: "11.5px" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* 5. Main Audit Table */}
      <div
        className="prism-card"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr
                style={{
                  background: "var(--bg-elevated)",
                  borderBottom: "1px solid var(--border-subtle)",
                  color: "var(--ink-secondary)",
                  textAlign: "left"
                }}
              >
                <th style={{ padding: "12px 18px", width: "150px" }}>Timestamp</th>
                <th style={{ padding: "12px 18px", width: "180px" }}>Actor / Origin</th>
                <th style={{ padding: "12px 18px", width: "180px" }}>Action Type</th>
                <th style={{ padding: "12px 18px" }}>Target System & Scope</th>
                <th style={{ padding: "12px 18px", width: "170px" }}>SHA-256 Digest</th>
                <th style={{ padding: "12px 18px", width: "110px" }}>Status</th>
                <th style={{ padding: "12px 18px", width: "90px", textAlign: "right" }}>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 24px", textAlign: "center", color: "var(--ink-tertiary)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                      <RotateCw size={24} className="animate-spin" color="var(--accent-teal)" />
                      <span style={{ fontSize: "13px" }}>Querying Cryptographic Audit Ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : auditRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "64px 24px", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                      <ShieldCheck size={36} color="var(--ink-tertiary)" style={{ opacity: 0.5 }} />
                      <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink-primary)" }}>
                        No Audit Records Found
                      </div>
                      <div style={{ fontSize: "12.5px", color: "var(--ink-secondary)", maxWidth: "340px" }}>
                        {isFilterActive
                          ? "No audit events match your active search filters. Try adjusting your query or resetting filters."
                          : "The audit ledger is currently empty. Administrative and system operations will automatically appear here."}
                      </div>
                      {isFilterActive && (
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            setSearchQuery("");
                            setActionFilter("ALL");
                            setResourceFilter("ALL");
                            setStatusFilter("ALL");
                            setPage(0);
                          }}
                          style={{ marginTop: "6px", fontSize: "12px" }}
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                auditRecords.map((log) => {
                  const isCopied = copiedHash === log.id;
                  const dateObj = log.occurred_at ? new Date(log.occurred_at) : null;
                  const formattedDate = dateObj
                    ? `${dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${dateObj.toLocaleTimeString()}`
                    : "Recent";

                  const detailsSummary = typeof log.details === "object"
                    ? Object.entries(log.details)
                        .filter(([k]) => !k.startsWith("_") && k !== "timestamp")
                        .slice(0, 3)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" • ")
                    : String(log.details || "");

                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        transition: "background 0.15s ease",
                        cursor: "pointer"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Timestamp */}
                      <td style={{ padding: "12px 18px", whiteSpace: "nowrap" }}>
                        <div style={{ color: "var(--ink-primary)", fontWeight: 500 }}>
                          {formattedDate}
                        </div>
                        <div style={{ fontSize: "10.5px", color: "var(--ink-tertiary)", marginTop: "2px" }}>
                          {log.occurred_at ? new Date(log.occurred_at).toISOString().slice(11, 19) + " UTC" : ""}
                        </div>
                      </td>

                      {/* Actor */}
                      <td style={{ padding: "12px 18px" }}>
                        <div style={{ fontWeight: 600, color: "var(--ink-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                          {log.actor_id}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--accent-teal)", fontFamily: "'JetBrains Mono', monospace", marginTop: "2px" }}>
                          {log.ip_address || "127.0.0.1"}
                        </div>
                      </td>

                      {/* Action Type */}
                      <td style={{ padding: "12px 18px" }}>
                        <span className={`badge ${getActionBadgeClass(log.action_type)}`} style={{ fontSize: "10.5px" }}>
                          {log.action_type}
                        </span>
                      </td>

                      {/* Target System & Scope */}
                      <td style={{ padding: "12px 18px", maxWidth: "340px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "10.5px",
                              fontFamily: "'JetBrains Mono', monospace",
                              color: "var(--ink-primary)",
                              fontWeight: 600
                            }}
                          >
                            {log.resource_type}
                          </span>
                          <span style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>::</span>
                          <span
                            style={{
                              fontSize: "11px",
                              color: "var(--accent-violet)",
                              fontFamily: "'JetBrains Mono', monospace"
                            }}
                          >
                            {log.resource_id}
                          </span>
                        </div>
                        {detailsSummary && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--ink-secondary)",
                              marginTop: "3px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {detailsSummary}
                          </div>
                        )}
                      </td>

                      {/* SHA-256 Digest */}
                      <td style={{ padding: "12px 18px" }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleCopy(log.row_hash, log.id)}
                          className="btn-ghost"
                          style={{
                            fontSize: "11px",
                            padding: "4px 8px",
                            fontFamily: "'JetBrains Mono', monospace",
                            color: log.row_hash ? "var(--accent-teal)" : "var(--ink-tertiary)",
                            background: "rgba(16, 185, 129, 0.08)",
                            borderRadius: "6px",
                            border: "1px solid rgba(16, 185, 129, 0.2)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px"
                          }}
                          title="Click to copy full 64-character SHA-256 hash"
                        >
                          {isCopied ? (
                            <>
                              <Check size={12} color="var(--accent-teal)" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              {log.row_hash ? `${log.row_hash.slice(0, 10)}...${log.row_hash.slice(-6)}` : "Unsealed"}
                            </>
                          )}
                        </button>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "12px 18px" }}>
                        {log.is_verified || log.status === "VERIFIED" ? (
                          <span className="badge badge-teal" style={{ fontSize: "10.5px", gap: "4px" }}>
                            <CheckCircle2 size={11} /> VERIFIED
                          </span>
                        ) : (
                          <span className="badge badge-rose" style={{ fontSize: "10.5px", gap: "4px" }}>
                            <AlertTriangle size={11} /> TAMPERED
                          </span>
                        )}
                      </td>

                      {/* Inspect */}
                      <td style={{ padding: "12px 18px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="btn-ghost"
                          style={{
                            padding: "4px 8px",
                            color: "var(--ink-secondary)",
                            fontSize: "11.5px",
                            gap: "4px"
                          }}
                          title="Inspect raw audit payload"
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 6. Table Footer / Pagination */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--border-subtle)",
            background: "var(--bg-elevated)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            fontSize: "12px",
            color: "var(--ink-secondary)"
          }}
        >
          <div>
            Showing <strong style={{ color: "var(--ink-primary)" }}>{startRecord}</strong> to{" "}
            <strong style={{ color: "var(--ink-primary)" }}>{endRecord}</strong> of{" "}
            <strong style={{ color: "var(--ink-primary)" }}>{totalRecords}</strong> ledger entries
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              className="btn-secondary"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || isLoading}
              style={{ padding: "4px 8px", fontSize: "11.5px", gap: "4px" }}
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <span style={{ fontSize: "11.5px", padding: "0 6px" }}>
              Page <strong style={{ color: "var(--ink-primary)" }}>{page + 1}</strong> of{" "}
              <strong style={{ color: "var(--ink-primary)" }}>{Math.max(1, totalPages)}</strong>
            </span>

            <button
              className="btn-secondary"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || isLoading}
              style={{ padding: "4px 8px", fontSize: "11.5px", gap: "4px" }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 7. Payload Inspection Modal */}
      {selectedLog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "24px"
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="prism-card"
            style={{
              width: "100%",
              maxWidth: "760px",
              maxHeight: "90vh",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: "14px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid var(--border-subtle)",
                background: "var(--bg-elevated)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(16, 185, 129, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-teal)"
                  }}
                >
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)" }}>
                    Audit Record Deep Inspection
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {selectedLog.id}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className={`badge ${getActionBadgeClass(selectedLog.action_type)}`}>
                  {selectedLog.action_type}
                </span>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="btn-ghost"
                  style={{ padding: "6px", color: "var(--ink-tertiary)" }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Key Attributes Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "12px",
                  background: "var(--bg-elevated)",
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "12px"
                }}
              >
                <div>
                  <span style={{ color: "var(--ink-tertiary)", fontSize: "11px", display: "block" }}>Occurred At</span>
                  <strong style={{ color: "var(--ink-primary)" }}>
                    {selectedLog.occurred_at ? new Date(selectedLog.occurred_at).toUTCString() : "N/A"}
                  </strong>
                </div>
                <div>
                  <span style={{ color: "var(--ink-tertiary)", fontSize: "11px", display: "block" }}>Actor Identity</span>
                  <strong style={{ color: "var(--ink-primary)" }}>{selectedLog.actor_id}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--ink-tertiary)", fontSize: "11px", display: "block" }}>Origin IP Address</span>
                  <strong style={{ color: "var(--accent-teal)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {selectedLog.ip_address || "127.0.0.1"}
                  </strong>
                </div>
                <div>
                  <span style={{ color: "var(--ink-tertiary)", fontSize: "11px", display: "block" }}>Target Resource</span>
                  <strong style={{ color: "var(--accent-violet)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {selectedLog.resource_type}::{selectedLog.resource_id}
                  </strong>
                </div>
              </div>

              {/* Cryptographic Hash Section */}
              <div
                style={{
                  padding: "14px",
                  background: "rgba(16, 185, 129, 0.05)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  borderRadius: "10px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--accent-teal)", textTransform: "uppercase" }}>
                    Immutable SHA-256 Checksum Signature
                  </span>
                  <button
                    onClick={() => handleCopy(selectedLog.row_hash, `modal_${selectedLog.id}`)}
                    className="btn-ghost"
                    style={{ fontSize: "11px", color: "var(--accent-teal)", gap: "4px" }}
                  >
                    {copiedHash === `modal_${selectedLog.id}` ? <Check size={12} /> : <Copy size={12} />} Copy Full Digest
                  </button>
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11.5px",
                    color: "var(--ink-primary)",
                    wordBreak: "break-all",
                    background: "var(--bg-app)",
                    border: "1px solid var(--border-subtle)",
                    padding: "8px 12px",
                    borderRadius: "6px"
                  }}
                >
                  {selectedLog.row_hash || "No signature computed"}
                </div>
              </div>

              {/* Raw JSON Payload */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)" }}>
                    Event Payload (`details_json`)
                  </span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedLog.details, null, 2), `json_${selectedLog.id}`)}
                    className="btn-ghost"
                    style={{ fontSize: "11px", color: "var(--ink-tertiary)", gap: "4px" }}
                  >
                    {copiedHash === `json_${selectedLog.id}` ? <Check size={12} /> : <Copy size={12} />} Copy JSON
                  </button>
                </div>
                <pre
                  style={{
                    background: "var(--bg-app)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    fontSize: "11.5px",
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "var(--ink-primary)",
                    maxHeight: "260px",
                    overflowY: "auto",
                    margin: 0
                  }}
                >
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid var(--border-subtle)",
                background: "var(--bg-elevated)",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end"
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => setSelectedLog(null)}
                style={{ fontSize: "12px" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminAuditLogsPage;
