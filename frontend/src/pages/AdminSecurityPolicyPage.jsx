import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Zap,
  Power,
  Play,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  ArrowUpRight,
  Copy,
  Terminal,
  Shield,
  Key,
  FileCheck,
  Layers,
  HelpCircle,
  X,
  AlertOctagon,
  Flame,
  Check,
  Code,
  FileText,
  Activity
} from "lucide-react";
import {
  fetchAdminSecurityPolicies,
  fetchAdminSecurityOverview,
  toggleAdminEmergencyKillswitch,
  updateAdminSecurityPolicy,
  createAdminSecurityPolicy,
  deleteAdminSecurityPolicy,
  evaluateAdminSecurityPolicyTest
} from "../api/client";

export function AdminSecurityPolicyPage() {
  const [overview, setOverview] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("policies"); // "policies" | "flags" | "audit"
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [activeLevel, setActiveLevel] = useState("ALL");

  // Notifications
  const [notification, setNotification] = useState(null);

  // Modals & Drawers
  const [showKillSwitchModal, setShowKillSwitchModal] = useState(false);
  const [killSwitchConfirmText, setKillSwitchConfirmText] = useState("");
  const [killSwitchReason, setKillSwitchReason] = useState("");
  const [isTogglingKillswitch, setIsTogglingKillswitch] = useState(false);

  const [selectedPolicyForEdit, setSelectedPolicyForEdit] = useState(null);
  const [editedRulesJson, setEditedRulesJson] = useState("");
  const [rulesEditMode, setRulesEditMode] = useState("form"); // "form" | "json"
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  const [selectedPolicyForTest, setSelectedPolicyForTest] = useState(null);
  const [testInput, setTestInput] = useState("");
  const [testType, setTestType] = useState("sql");
  const [testResult, setTestResult] = useState(null);
  const [isTestingPolicy, setIsTestingPolicy] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPolicyForm, setNewPolicyForm] = useState({
    name: "",
    policyKey: "",
    category: "Execution Governance",
    enforcementLevel: "STRICT",
    description: "",
    rules: {}
  });

  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [overviewData, policiesData] = await Promise.all([
        fetchAdminSecurityOverview().catch((err) => {
          console.warn("Security overview error:", err);
          return null;
        }),
        fetchAdminSecurityPolicies().catch((err) => {
          console.warn("Security policies error:", err);
          return [];
        })
      ]);

      if (overviewData) setOverview(overviewData);
      if (Array.isArray(policiesData)) setPolicies(policiesData);
    } catch (err) {
      console.error("Failed to load security governance data:", err);
      showToast("Error loading security data: " + (err.message || "Network issue"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isKillSwitchActive = Boolean(overview?.killswitch?.active);

  // ──────────────────────────────────────────────────────────────────────────
  // Emergency Kill-Switch Handler
  // ──────────────────────────────────────────────────────────────────────────
  const handleToggleKillswitchSubmit = async (e) => {
    e.preventDefault();
    if (!isKillSwitchActive && killSwitchConfirmText.trim() !== "FREEZE-ALL-WRITES") {
      showToast("Please type 'FREEZE-ALL-WRITES' exactly to engage write freeze.", "error");
      return;
    }

    setIsTogglingKillswitch(true);
    try {
      const res = await toggleAdminEmergencyKillswitch({
        active: !isKillSwitchActive,
        reason: killSwitchReason.trim() || (isKillSwitchActive ? "Incident mitigated - normal operations resumed" : "Emergency administrative write-lock engaged")
      });

      showToast(
        !isKillSwitchActive
          ? "CRITICAL: Emergency Write Freeze has been ENGAGED. State mutations are blocked platform-wide."
          : "Emergency Write Freeze has been DISENGAGED. Normal proposal execution restored.",
        !isKillSwitchActive ? "warning" : "success"
      );

      setShowKillSwitchModal(false);
      setKillSwitchConfirmText("");
      setKillSwitchReason("");
      loadData();
    } catch (err) {
      console.error("Killswitch toggle failed:", err);
      showToast("Killswitch failed: " + (err.message || "Request error"), "error");
    } finally {
      setIsTogglingKillswitch(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Policy Toggle & Enforcement Level Change
  // ──────────────────────────────────────────────────────────────────────────
  const handleTogglePolicyEnabled = async (pol) => {
    const nextState = !pol.isEnabled;
    // Optimistic UI update
    setPolicies((prev) =>
      prev.map((p) => (p.id === pol.id ? { ...p, isEnabled: nextState } : p))
    );

    try {
      await updateAdminSecurityPolicy(pol.id, {
        isEnabled: nextState,
        version: pol.version
      });
      showToast(`Policy '${pol.name}' ${nextState ? "activated" : "paused"}.`);
      loadData();
    } catch (err) {
      console.error("Failed to toggle policy:", err);
      showToast("Failed to update policy: " + (err.message || "Error"), "error");
      loadData(); // revert
    }
  };

  const handleChangeEnforcementLevel = async (pol, newLevel) => {
    if (pol.enforcementLevel === newLevel) return;

    setPolicies((prev) =>
      prev.map((p) => (p.id === pol.id ? { ...p, enforcementLevel: newLevel } : p))
    );

    try {
      await updateAdminSecurityPolicy(pol.id, {
        enforcementLevel: newLevel,
        version: pol.version
      });
      showToast(`Enforcement level for '${pol.name}' changed to ${newLevel}.`);
      loadData();
    } catch (err) {
      console.error("Failed to update enforcement level:", err);
      showToast("Failed to update level: " + (err.message || "Error"), "error");
      loadData();
    }
  };

  const getCategoryBadgeClass = (category) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("compliance") || cat.includes("audit")) return "badge-purple";
    if (cat.includes("cost")) return "badge-amber";
    if (cat.includes("privacy") || cat.includes("protection")) return "badge-cyan";
    if (cat.includes("execution")) return "badge-teal";
    if (cat.includes("incident") || cat.includes("freeze")) return "badge-rose";
    if (cat.includes("infrastructure")) return "badge-blue";
    if (cat.includes("session")) return "badge-pink";
    if (cat.includes("write-lock") || cat.includes("lock")) return "badge-crimson";
    return "badge-indigo";
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Rule Config Modal Handlers
  // ──────────────────────────────────────────────────────────────────────────
  const handleOpenEditRules = (pol) => {
    setSelectedPolicyForEdit({ ...pol });
    setEditedRulesJson(JSON.stringify(pol.rules || {}, null, 2));
    setRulesEditMode("form");
  };

  const handleSavePolicyRules = async () => {
    if (!selectedPolicyForEdit) return;

    let parsedRules = {};
    if (rulesEditMode === "json") {
      try {
        parsedRules = JSON.parse(editedRulesJson);
      } catch (err) {
        showToast("Invalid JSON formatting in rules editor", "error");
        return;
      }
    } else {
      parsedRules = selectedPolicyForEdit.rules || {};
    }

    setIsSavingPolicy(true);
    try {
      await updateAdminSecurityPolicy(selectedPolicyForEdit.id, {
        name: selectedPolicyForEdit.name,
        description: selectedPolicyForEdit.description,
        enforcementLevel: selectedPolicyForEdit.enforcementLevel,
        isEnabled: selectedPolicyForEdit.isEnabled,
        rules: parsedRules,
        version: selectedPolicyForEdit.version
      });

      showToast(`Rules and configuration saved for '${selectedPolicyForEdit.name}'.`);
      setSelectedPolicyForEdit(null);
      loadData();
    } catch (err) {
      console.error("Failed to save rules:", err);
      if (err.status === 409) {
        showToast("Conflict: This policy was modified concurrently. Refreshing data...", "error");
      } else {
        showToast("Error saving rules: " + (err.message || "Failed"), "error");
      }
      loadData();
    } finally {
      setIsSavingPolicy(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Policy test handlers
  // ──────────────────────────────────────────────────────────────────────────
  const handleOpenSimulator = (pol = null) => {
    setSelectedPolicyForTest(pol || policies[0] || null);
    setTestResult(null);

    setTestType("");
    setTestInput("");
  };

  const handleRunSimulation = async () => {
    setIsTestingPolicy(true);
    try {
      const res = await evaluateAdminSecurityPolicyTest({
        policy_id: selectedPolicyForTest?.id,
        policy_key: selectedPolicyForTest?.policyKey,
        test_type: testType,
        test_input: testInput,
        rules: selectedPolicyForTest?.rules || {},
        requested_tokens: 320000
      });
      setTestResult(res);
    } catch (err) {
      console.error("Policy test failed:", err);
      showToast("Policy test error: " + err.message, "error");
    } finally {
      setIsTestingPolicy(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Create & Delete Handlers
  // ──────────────────────────────────────────────────────────────────────────
  const handleCreatePolicySubmit = async (e) => {
    e.preventDefault();
    try {
      await createAdminSecurityPolicy(newPolicyForm);
      showToast(`Guardrail policy '${newPolicyForm.name}' created.`);
      setShowCreateModal(false);
      setNewPolicyForm({
        name: "",
        policyKey: "",
        category: "Execution Governance",
        enforcementLevel: "STRICT",
        description: "",
        rules: {}
      });
      loadData();
    } catch (err) {
      console.error("Failed to create policy:", err);
      showToast("Create failed: " + err.message, "error");
    }
  };

  const handleDeletePolicy = async (pol) => {
    if (!window.confirm(`Are you sure you want to permanently delete custom guardrail '${pol.name}'?`)) {
      return;
    }

    try {
      await deleteAdminSecurityPolicy(pol.id);
      showToast(`Policy '${pol.name}' deleted.`);
      loadData();
    } catch (err) {
      console.error("Failed to delete policy:", err);
      showToast("Cannot delete policy: " + err.message, "error");
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Filtered Policies
  // ──────────────────────────────────────────────────────────────────────────
  const filteredPolicies = policies.filter((p) => {
    // Exclude platform security flags from standard policies tab (they have dedicated tab)
    if (activeTab === "policies" && p.category === "Platform Security Flags") return false;
    if (activeTab === "flags" && p.category !== "Platform Security Flags") return false;

    const matchesSearch =
      searchQuery === "" ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.policyKey?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === "ALL" || p.category === activeCategory;

    const matchesLevel =
      activeLevel === "ALL" || p.enforcementLevel === activeLevel;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  const categories = [
    "ALL",
    ...Array.from(
      new Set(
        policies
          .filter((p) => p.category !== "Platform Security Flags")
          .map((p) => p.category)
          .filter(Boolean)
      )
    )
  ];

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
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "32px",
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: "8px",
            background:
              notification.type === "error"
                ? "rgba(239, 68, 68, 0.95)"
                : notification.type === "warning"
                ? "rgba(245, 158, 11, 0.95)"
                : "rgba(16, 185, 129, 0.95)",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            animation: "fadeIn 0.2s ease"
          }}
        >
          {notification.type === "error" ? (
            <AlertOctagon size={16} />
          ) : notification.type === "warning" ? (
            <AlertTriangle size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          <span>{notification.message}</span>
        </div>
      )}

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
              background: isKillSwitchActive
                ? "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)"
                : "var(--prism-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: isKillSwitchActive
                ? "0 0 24px rgba(239, 68, 68, 0.5)"
                : "0 0 18px var(--prism-glow)",
              flexShrink: 0
            }}
          >
            {isKillSwitchActive ? <AlertOctagon size={24} /> : <ShieldAlert size={24} />}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "11.5px",
                  fontWeight: 700,
                  color: "var(--ink-tertiary)",
                  textTransform: "uppercase"
                }}
              >
                PLATFORM ADMIN • SECURITY & GUARDRAILS
              </span>
              <span className="badge badge-teal">Zero Autonomous Writes</span>
              <span className="badge badge-magenta">Tool Broker Guardrails Active</span>
              <span
                className={`badge ${
                  isKillSwitchActive ? "badge-rose" : "badge-teal"
                }`}
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: isKillSwitchActive ? "#ef4444" : "#10b981",
                    display: "inline-block"
                  }}
                />
                {isKillSwitchActive
                  ? "EMERGENCY WRITE FREEZE ENGAGED"
                  : "OPERATIONAL: WRITES GUARDED"}
              </span>
            </div>

            <h1
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--ink-primary)",
                marginTop: "4px"
              }}
            >
              Security, Guardrails & Write-Lock Governance
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Cryptographic guardrails enforcing safe read telemetry, human write-lock gates, PII redaction, and emergency kill-switches.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={loadData}
            className="btn-secondary"
            style={{ fontSize: "12px", gap: "6px", padding: "8px 12px" }}
            title="Reload from PostgreSQL"
          >
            <RefreshCw size={13} className={isLoading ? "spin" : ""} /> Refresh
          </button>

          <button
            onClick={() => handleOpenSimulator()}
            className="btn-secondary"
            style={{ fontSize: "12px", gap: "6px", padding: "8px 12px" }}
          >
            <Play size={13} /> Policy Simulator
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-secondary"
            style={{ fontSize: "12px", gap: "6px", padding: "8px 12px" }}
          >
            <Plus size={13} /> New Guardrail
          </button>

          {/* Emergency Kill Switch Button */}
          <button
            onClick={() => setShowKillSwitchModal(true)}
            className={isKillSwitchActive ? "btn-danger" : "btn-secondary"}
            style={{
              borderColor: isKillSwitchActive
                ? "var(--accent-rose)"
                : "rgba(225, 29, 72, 0.4)",
              background: isKillSwitchActive
                ? "rgba(225, 29, 72, 0.25)"
                : "rgba(225, 29, 72, 0.08)",
              color: isKillSwitchActive ? "#fff" : "var(--accent-rose)",
              gap: "8px",
              padding: "8px 14px",
              fontWeight: 700,
              fontSize: "12.5px"
            }}
          >
            <Power size={14} />
            {isKillSwitchActive
              ? "DISENGAGE EMERGENCY WRITE FREEZE"
              : "Engage Emergency Write Freeze"}
          </button>
        </div>
      </div>

      {/* Prominent Kill Switch Active Banner */}
      {isKillSwitchActive && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "10px",
            background: "rgba(225, 29, 72, 0.15)",
            border: "2px solid var(--accent-rose)",
            color: "var(--ink-primary)",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            boxShadow: "0 0 20px rgba(225, 29, 72, 0.2)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <AlertOctagon size={24} color="var(--accent-rose)" />
            <div>
              <div style={{ fontWeight: 700, color: "var(--accent-rose)", fontSize: "14px" }}>
                PLATFORM EMERGENCY WRITE FREEZE ACTIVE
              </div>
              <div style={{ color: "var(--ink-secondary)", fontSize: "12.5px", marginTop: "2px" }}>
                Reason: <strong>{overview?.killswitch?.reason || "Administrative freeze"}</strong> • Engaged by: <strong>{overview?.killswitch?.engagedBy || "Platform Admin"}</strong> • All action proposals and database mutations return HTTP 423 (Locked).
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowKillSwitchModal(true)}
            className="btn-danger"
            style={{ fontSize: "12px", padding: "6px 14px" }}
          >
            Disengage Freeze
          </button>
        </div>
      )}

      {/* Security Posture KPI Overview Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px"
        }}
      >
        {/* Card 1: Write Lock State */}
        <div
          className="prism-card"
          style={{
            padding: "16px",
            background: isKillSwitchActive ? "rgba(239, 68, 68, 0.08)" : "var(--bg-card)",
            border: isKillSwitchActive ? "1px solid var(--accent-rose)" : "1px solid var(--border-card)",
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>
              Kill-Switch Status
            </span>
            <Power size={14} color={isKillSwitchActive ? "var(--accent-rose)" : "var(--accent-teal)"} />
          </div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: isKillSwitchActive ? "var(--accent-rose)" : "var(--accent-teal)" }}>
            {isKillSwitchActive ? "FREEZE ACTIVE" : "DISENGAGED"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
            {isKillSwitchActive ? "All mutation executions locked" : "Autonomous write gate operational"}
          </div>
        </div>

        {/* Card 2: Total Guardrails */}
        <div
          className="prism-card"
          style={{
            padding: "16px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>
              Active Guardrails
            </span>
            <ShieldCheck size={14} color="var(--accent-teal)" />
          </div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink-primary)" }}>
            {overview?.stats?.activePolicies || policies.filter((p) => p.isEnabled).length} of{" "}
            {overview?.stats?.totalPolicies || policies.length}
          </div>
          <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
            Across {overview?.stats?.categoriesCount ?? 0} governance domains
          </div>
        </div>

        {/* Card 3: Strict Enforcement */}
        <div
          className="prism-card"
          style={{
            padding: "16px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>
              Strict Blocking Mode
            </span>
            <Lock size={14} color="var(--accent-violet)" />
          </div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--accent-violet)" }}>
            {overview?.stats?.strictEnforcement || policies.filter((p) => p.enforcementLevel === "STRICT").length} Policies
          </div>
          <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
            Immediate execution block on violation
          </div>
        </div>

        {/* Card 4: PII & Data Redaction */}
        <div
          className="prism-card"
          style={{
            padding: "16px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>
              PII & Credential Scrub
            </span>
            <Flame size={14} color="var(--prism-pink)" />
          </div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--prism-pink)" }}>
            ENFORCED
          </div>
          <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
            6 Regex patterns with ReDoS protection
          </div>
        </div>

        {/* Card 5: Audit Ledger */}
        <div
          className="prism-card"
          style={{
            padding: "16px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>
              Chained Audit Ledger
            </span>
            <FileCheck size={14} color="var(--accent-teal)" />
          </div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink-primary)" }}>
            {overview?.stats?.securityEventsCount || 0} Sealed
          </div>
          <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
            Blockchain-style SHA-256 hash chaining
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "12px",
          gap: "12px",
          flexWrap: "wrap"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setActiveTab("policies")}
            className={`tab-btn ${activeTab === "policies" ? "active" : ""}`}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              background: activeTab === "policies" ? "rgba(236, 72, 153, 0.15)" : "transparent",
              color: activeTab === "policies" ? "var(--prism-pink)" : "var(--ink-secondary)",
              border: activeTab === "policies" ? "1px solid rgba(236, 72, 153, 0.3)" : "1px solid transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Shield size={14} /> Guardrails & Policies
          </button>

          <button
            onClick={() => setActiveTab("flags")}
            className={`tab-btn ${activeTab === "flags" ? "active" : ""}`}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              background: activeTab === "flags" ? "rgba(139, 92, 246, 0.15)" : "transparent",
              color: activeTab === "flags" ? "var(--accent-violet)" : "var(--ink-secondary)",
              border: activeTab === "flags" ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Zap size={14} /> Platform Security Flags
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`tab-btn ${activeTab === "audit" ? "active" : ""}`}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              background: activeTab === "audit" ? "rgba(16, 185, 129, 0.15)" : "transparent",
              color: activeTab === "audit" ? "var(--accent-teal)" : "var(--ink-secondary)",
              border: activeTab === "audit" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Activity size={14} /> Governance Audit Stream
          </button>
        </div>

        {/* Search & Level Filter */}
        {activeTab === "policies" && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                borderRadius: "8px",
                background: "var(--bg-input)",
                border: "1px solid var(--border-card)"
              }}
            >
              <Search size={14} color="var(--ink-tertiary)" />
              <input
                type="text"
                placeholder="Search policies or keys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--ink-primary)",
                  fontSize: "12.5px",
                  width: "160px"
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Filter size={13} color="var(--ink-tertiary)" />
              <select
                value={activeLevel}
                onChange={(e) => setActiveLevel(e.target.value)}
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-card)",
                  color: "var(--ink-primary)",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                <option value="ALL">All Levels</option>
                <option value="STRICT">Strict Only</option>
                <option value="AUDIT_ONLY">Audit Only</option>
                <option value="DISABLED">Disabled</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: Guardrails & Policies */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "policies" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Category Filter Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  background: activeCategory === cat ? "var(--prism-gradient)" : "var(--bg-card)",
                  color: activeCategory === cat ? "#fff" : "var(--ink-secondary)",
                  border: activeCategory === cat ? "none" : "1px solid var(--border-card)",
                  cursor: "pointer"
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Policy Cards Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
              gap: "16px"
            }}
          >
            {filteredPolicies.map((pol) => {
              const rules = pol.rules || {};
              const isFreeze = pol.policyKey === "EMERGENCY_WRITE_FREEZE";

              return (
                <div
                  key={pol.id}
                  className="prism-card"
                  style={{
                    padding: "20px",
                    background: isFreeze && pol.isEnabled ? "rgba(225, 29, 72, 0.06)" : "var(--bg-card)",
                    border: isFreeze && pol.isEnabled ? "1px solid var(--accent-rose)" : "1px solid var(--border-card)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                    transition: "all 0.2s ease"
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span className={`badge ${getCategoryBadgeClass(pol.category)}`} style={{ fontSize: "10.5px" }}>
                          {pol.category || "Governance"}
                        </span>
                        <code
                          style={{
                            fontSize: "11px",
                            color: "var(--ink-secondary)",
                            background: "var(--bg-app)",
                            border: "1px solid var(--border-subtle)",
                            padding: "2px 7px",
                            borderRadius: "5px",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 600
                          }}
                        >
                          {pol.policyKey}
                        </code>
                        <span style={{ fontSize: "10px", color: "var(--ink-muted)" }}>v{pol.version || 1}</span>
                      </div>
                      <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "6px" }}>
                        {pol.name}
                      </h3>
                    </div>

                    {/* Enforcement Level Selector */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                      <select
                        value={pol.enforcementLevel || "STRICT"}
                        onChange={(e) => handleChangeEnforcementLevel(pol, e.target.value)}
                        style={{
                          background:
                            pol.enforcementLevel === "STRICT"
                              ? "rgba(16, 185, 129, 0.12)"
                              : pol.enforcementLevel === "AUDIT_ONLY"
                              ? "rgba(245, 158, 11, 0.12)"
                              : "var(--bg-app)",
                          border:
                            pol.enforcementLevel === "STRICT"
                              ? "1px solid rgba(16, 185, 129, 0.35)"
                              : pol.enforcementLevel === "AUDIT_ONLY"
                              ? "1px solid rgba(245, 158, 11, 0.35)"
                              : "1px solid var(--border-subtle)",
                          color:
                            pol.enforcementLevel === "STRICT"
                              ? "var(--accent-teal)"
                              : pol.enforcementLevel === "AUDIT_ONLY"
                              ? "var(--accent-amber)"
                              : "var(--ink-tertiary)",
                          fontSize: "11px",
                          fontWeight: 700,
                          borderRadius: "6px",
                          padding: "4px 8px",
                          cursor: "pointer",
                          outline: "none"
                        }}
                      >
                        <option value="STRICT">STRICT</option>
                        <option value="AUDIT_ONLY">AUDIT_ONLY</option>
                        <option value="DISABLED">DISABLED</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", lineHeight: 1.5, margin: 0 }}>
                    {pol.description}
                  </p>

                  {/* Configured Rule Chips */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: "6px",
                      background: "var(--bg-app)",
                      border: "1px solid var(--border-subtle)",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      fontSize: "11px"
                    }}
                  >
                    <span style={{ color: "var(--ink-tertiary)", fontWeight: 700, fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Active Rules:
                    </span>
                    {Object.entries(rules).slice(0, 4).map(([k, v]) => (
                      <span
                        key={k}
                        style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-card)",
                          padding: "3px 8px",
                          borderRadius: "5px",
                          color: typeof v === "boolean" ? (v ? "var(--accent-teal)" : "var(--accent-rose)") : "var(--ink-primary)",
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 600,
                          boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                        }}
                      >
                        {k}: <span style={{ fontWeight: 700 }}>{Array.isArray(v) ? `[${v.length}]` : String(v)}</span>
                      </span>
                    ))}
                    {Object.keys(rules).length > 4 && (
                      <span style={{ color: "var(--ink-tertiary)", fontWeight: 600, fontSize: "10.5px" }}>+{Object.keys(rules).length - 4} more</span>
                    )}
                  </div>

                  {/* Card Footer: Toggle & Actions */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderTop: "1px solid var(--border-subtle)",
                      paddingTop: "12px",
                      marginTop: "auto",
                      fontSize: "11.5px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <label
                        style={{
                          position: "relative",
                          display: "inline-block",
                          width: "36px",
                          height: "20px",
                          cursor: "pointer"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(pol.isEnabled)}
                          onChange={() => handleTogglePolicyEnabled(pol)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: pol.isEnabled ? "var(--accent-teal)" : "rgba(255,255,255,0.15)",
                            transition: "0.2s",
                            borderRadius: "20px"
                          }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            content: "",
                            height: "14px",
                            width: "14px",
                            left: pol.isEnabled ? "19px" : "3px",
                            bottom: "3px",
                            backgroundColor: "#fff",
                            transition: "0.2s",
                            borderRadius: "50%"
                          }}
                        />
                      </label>
                      <span style={{ color: pol.isEnabled ? "var(--accent-teal)" : "var(--ink-tertiary)", fontWeight: 600 }}>
                        {pol.isEnabled ? "Policy Active" : "Policy Paused"}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        onClick={() => handleOpenSimulator(pol)}
                        className="btn-ghost"
                        style={{ padding: "4px 8px", fontSize: "11px", gap: "4px" }}
                        title="Run policy evaluation"
                      >
                        <Play size={11} /> Test
                      </button>

                      <button
                        onClick={() => handleOpenEditRules(pol)}
                        className="btn-secondary"
                        style={{ padding: "4px 10px", fontSize: "11px", gap: "4px" }}
                      >
                        <Sliders size={11} /> Config
                      </button>

                      {pol.id.startsWith("pol_cust_") && (
                        <button
                          onClick={() => handleDeletePolicy(pol)}
                          className="btn-ghost"
                          style={{ padding: "4px 6px", color: "var(--accent-rose)" }}
                          title="Delete Custom Guardrail"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: Platform Security Flags */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "flags" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "13px", color: "var(--ink-secondary)" }}>
            Platform-wide security feature flags governing cryptographic signatures, RBAC authority tokens, header masking, and multi-tenant isolation.
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: "16px"
            }}
          >
            {filteredPolicies.map((flag) => {
              const severity = flag.rules?.severity || "HIGH";
              const severityColor =
                severity === "CRITICAL"
                  ? "var(--accent-rose)"
                  : severity === "HIGH"
                  ? "var(--accent-amber)"
                  : "var(--accent-violet)";

              return (
                <div
                  key={flag.id}
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
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: `rgba(255,255,255,0.06)`,
                            color: severityColor,
                            border: `1px solid ${severityColor}`
                          }}
                        >
                          {severity}
                        </span>
                        <code style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>{flag.policyKey}</code>
                      </div>
                      <h3 style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "6px" }}>
                        {flag.name}
                      </h3>
                    </div>

                    <label
                      style={{
                        position: "relative",
                        display: "inline-block",
                        width: "40px",
                        height: "22px",
                        cursor: "pointer"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(flag.isEnabled)}
                        onChange={() => handleTogglePolicyEnabled(flag)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: flag.isEnabled ? "var(--accent-teal)" : "rgba(255,255,255,0.15)",
                          transition: "0.2s",
                          borderRadius: "22px"
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          content: "",
                          height: "16px",
                          width: "16px",
                          left: flag.isEnabled ? "21px" : "3px",
                          bottom: "3px",
                          backgroundColor: "#fff",
                          transition: "0.2s",
                          borderRadius: "50%"
                        }}
                      />
                    </label>
                  </div>

                  <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", lineHeight: 1.5, margin: 0 }}>
                    {flag.description}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderTop: "1px solid var(--border-subtle)",
                      paddingTop: "10px",
                      marginTop: "auto",
                      fontSize: "11px",
                      color: "var(--ink-tertiary)"
                    }}
                  >
                    <span>Impact: <strong>{flag.rules?.impact || "Platform Defense"}</strong></span>
                    <span style={{ color: flag.isEnabled ? "var(--accent-teal)" : "var(--ink-muted)" }}>
                      {flag.isEnabled ? "● Enforcement Active" : "○ Inactive"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: Governance Audit Stream */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "audit" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "13px", color: "var(--ink-secondary)" }}>
            Cryptographic SHA-256 blockchain-style hash chained audit log stream recording all killswitch triggers, policy adjustments, and break-glass overrides.
          </div>

          <div
            className="prism-card"
            style={{
              padding: "0px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              overflowX: "auto"
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ padding: "12px 16px", color: "var(--ink-tertiary)", fontWeight: 600 }}>TIMESTAMP</th>
                  <th style={{ padding: "12px 16px", color: "var(--ink-tertiary)", fontWeight: 600 }}>ACTION TYPE</th>
                  <th style={{ padding: "12px 16px", color: "var(--ink-tertiary)", fontWeight: 600 }}>ACTOR</th>
                  <th style={{ padding: "12px 16px", color: "var(--ink-tertiary)", fontWeight: 600 }}>RESOURCE</th>
                  <th style={{ padding: "12px 16px", color: "var(--ink-tertiary)", fontWeight: 600 }}>BLOCK ROW HASH</th>
                  <th style={{ padding: "12px 16px", color: "var(--ink-tertiary)", fontWeight: 600 }}>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {(overview?.recentEvents || []).map((ev) => (
                  <tr
                    key={ev.id}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      transition: "background 0.15s ease"
                    }}
                  >
                    <td style={{ padding: "12px 16px", color: "var(--ink-secondary)", whiteSpace: "nowrap" }}>
                      {ev.occurredAt ? new Date(ev.occurredAt).toLocaleString() : "Not recorded"}
                    </td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <span
                        className={`badge ${
                          ev.actionType?.includes("ENGAGED")
                            ? "badge-rose"
                            : ev.actionType?.includes("DISENGAGED")
                            ? "badge-teal"
                            : "badge-indigo"
                        }`}
                      >
                        {ev.actionType}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--ink-primary)", fontWeight: 600 }}>
                      {ev.actorId}
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--ink-secondary)" }}>
                      <code>{ev.resourceId || ev.resourceType}</code>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <code
                          style={{
                            fontSize: "11px",
                            color: "var(--accent-teal)",
                            background: "rgba(16, 185, 129, 0.1)",
                            padding: "2px 6px",
                            borderRadius: "4px"
                          }}
                        >
                          {ev.rowHash ? ev.rowHash.substring(0, 12) + "..." : "SEALED"}
                        </code>
                        <CheckCircle2 size={12} color="var(--accent-teal)" />
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--ink-tertiary)", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {JSON.stringify(ev.details || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: Dual-Confirmation Emergency Write Freeze Kill-Switch */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showKillSwitchModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px"
          }}
          onClick={() => setShowKillSwitchModal(false)}
        >
          <div
            className="prism-card"
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "var(--bg-card)",
              border: isKillSwitchActive ? "2px solid var(--accent-teal)" : "2px solid var(--accent-rose)",
              padding: "24px",
              borderRadius: "14px",
              boxShadow: "0 20px 48px rgba(0,0,0,0.8)",
              display: "flex",
              flexDirection: "column",
              gap: "18px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {isKillSwitchActive ? (
                  <ShieldCheck size={22} color="var(--accent-teal)" />
                ) : (
                  <AlertOctagon size={22} color="var(--accent-rose)" />
                )}
                <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ink-primary)" }}>
                  {isKillSwitchActive ? "Disengage Emergency Write Freeze" : "ENGAGE GLOBAL EMERGENCY WRITE FREEZE"}
                </h2>
              </div>
              <button onClick={() => setShowKillSwitchModal(false)} className="btn-ghost" style={{ padding: "4px" }}>
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", lineHeight: 1.5 }}>
              {isKillSwitchActive ? (
                <>
                  Disengaging the emergency freeze will restore normal cryptographic Action Proposal approvals and write execution capabilities for domain engineers.
                </>
              ) : (
                <>
                  <strong style={{ color: "var(--accent-rose)" }}>CRITICAL SAFETY ACTION:</strong> Engaging the write freeze instantly halts all agent proposal execution, pod restarts, schema migrations, and write operations platform-wide across all tenant fleets. Read-only diagnostic telemetry remains active.
                </>
              )}
            </p>

            <form onSubmit={handleToggleKillswitchSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-tertiary)" }}>
                  Incident Reference or Rationale:
                </label>
                <input
                  type="text"
                  required
                  placeholder={isKillSwitchActive ? "e.g. Incident INC-8422 mitigated and verified clean" : "e.g. Incident INC-8422: Suspected rogue mutation loop detected"}
                  value={killSwitchReason}
                  onChange={(e) => setKillSwitchReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-card)",
                    color: "var(--ink-primary)",
                    fontSize: "13px",
                    marginTop: "6px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {!isKillSwitchActive && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent-rose)" }}>
                    Dual-Confirmation: Type "FREEZE-ALL-WRITES" to confirm:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="FREEZE-ALL-WRITES"
                    value={killSwitchConfirmText}
                    onChange={(e) => setKillSwitchConfirmText(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: "rgba(225, 29, 72, 0.1)",
                      border: "1px solid var(--accent-rose)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "13px",
                      marginTop: "6px",
                      boxSizing: "border-box",
                      fontFamily: "monospace"
                    }}
                  />
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowKillSwitchModal(false)}
                  className="btn-secondary"
                  style={{ fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTogglingKillswitch || (!isKillSwitchActive && killSwitchConfirmText.trim() !== "FREEZE-ALL-WRITES")}
                  className={isKillSwitchActive ? "btn-primary" : "btn-danger"}
                  style={{ fontSize: "12.5px", fontWeight: 700, opacity: (!isKillSwitchActive && killSwitchConfirmText.trim() !== "FREEZE-ALL-WRITES") ? 0.5 : 1 }}
                >
                  {isTogglingKillswitch
                    ? "Updating Governance Ledger..."
                    : isKillSwitchActive
                    ? "Confirm Disengage Freeze"
                    : "ENGAGE WRITE FREEZE NOW"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: Rule Configuration Drawer/Modal */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedPolicyForEdit && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px"
          }}
          onClick={() => setSelectedPolicyForEdit(null)}
        >
          <div
            className="prism-card"
            style={{
              width: "100%",
              maxWidth: "640px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              padding: "24px",
              borderRadius: "14px",
              boxShadow: "0 20px 48px rgba(0,0,0,0.8)",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Sliders size={18} color="var(--prism-pink)" />
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink-primary)" }}>
                  Configure Rules & Flags: {selectedPolicyForEdit.name}
                </h2>
              </div>
              <button onClick={() => setSelectedPolicyForEdit(null)} className="btn-ghost" style={{ padding: "4px" }}>
                <X size={16} />
              </button>
            </div>

            {/* Mode Switcher */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "10px" }}>
              <button
                type="button"
                onClick={() => setRulesEditMode("form")}
                className={`tab-btn ${rulesEditMode === "form" ? "active" : ""}`}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  background: rulesEditMode === "form" ? "rgba(236, 72, 153, 0.15)" : "transparent",
                  color: rulesEditMode === "form" ? "var(--prism-pink)" : "var(--ink-secondary)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <FileText size={12} /> Guided Form
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditedRulesJson(JSON.stringify(selectedPolicyForEdit.rules || {}, null, 2));
                  setRulesEditMode("json");
                }}
                className={`tab-btn ${rulesEditMode === "json" ? "active" : ""}`}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  background: rulesEditMode === "json" ? "rgba(139, 92, 246, 0.15)" : "transparent",
                  color: rulesEditMode === "json" ? "var(--accent-violet)" : "var(--ink-secondary)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <Code size={12} /> Raw JSON Editor
              </button>
            </div>

            {rulesEditMode === "form" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-tertiary)" }}>Policy Name</label>
                  <input
                    type="text"
                    value={selectedPolicyForEdit.name}
                    onChange={(e) => setSelectedPolicyForEdit({ ...selectedPolicyForEdit, name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-card)",
                      color: "var(--ink-primary)",
                      fontSize: "12.5px",
                      marginTop: "4px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-tertiary)" }}>Description</label>
                  <textarea
                    rows={2}
                    value={selectedPolicyForEdit.description}
                    onChange={(e) => setSelectedPolicyForEdit({ ...selectedPolicyForEdit, description: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-card)",
                      color: "var(--ink-primary)",
                      fontSize: "12.5px",
                      marginTop: "4px",
                      boxSizing: "border-box",
                      resize: "vertical"
                    }}
                  />
                </div>

                {/* Specific Rule Form Inputs based on keys in rules */}
                <div style={{ background: "var(--bg-app)", border: "1px solid var(--border-subtle)", padding: "14px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-primary)" }}>
                    Rule Parameters & Thresholds:
                  </div>

                  {Object.entries(selectedPolicyForEdit.rules || {}).map(([k, v]) => {
                    if (typeof v === "boolean") {
                      return (
                        <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "12px", color: "var(--ink-secondary)", fontFamily: "monospace" }}>{k}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...selectedPolicyForEdit.rules, [k]: !v };
                              setSelectedPolicyForEdit({ ...selectedPolicyForEdit, rules: updated });
                            }}
                            className={v ? "btn-secondary" : "btn-ghost"}
                            style={{
                              padding: "3px 10px",
                              fontSize: "11px",
                              color: v ? "var(--accent-teal)" : "var(--ink-muted)",
                              border: v ? "1px solid var(--accent-teal)" : "1px solid var(--border-card)"
                            }}
                          >
                            {v ? "ENABLED (true)" : "DISABLED (false)"}
                          </button>
                        </div>
                      );
                    } else if (typeof v === "number") {
                      return (
                        <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                          <span style={{ fontSize: "12px", color: "var(--ink-secondary)", fontFamily: "monospace" }}>{k}</span>
                          <input
                            type="number"
                            value={v}
                            onChange={(e) => {
                              const num = parseFloat(e.target.value) || 0;
                              const updated = { ...selectedPolicyForEdit.rules, [k]: num };
                              setSelectedPolicyForEdit({ ...selectedPolicyForEdit, rules: updated });
                            }}
                            style={{
                              width: "120px",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              background: "var(--bg-input)",
                              border: "1px solid var(--border-card)",
                              color: "var(--ink-primary)",
                              fontSize: "12px",
                              textAlign: "right"
                            }}
                          />
                        </div>
                      );
                    } else if (Array.isArray(v)) {
                      return (
                        <div key={k} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontSize: "12px", color: "var(--ink-secondary)", fontFamily: "monospace" }}>{k} (comma-separated list):</span>
                          <input
                            type="text"
                            value={v.join(", ")}
                            onChange={(e) => {
                              const arr = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                              const updated = { ...selectedPolicyForEdit.rules, [k]: arr };
                              setSelectedPolicyForEdit({ ...selectedPolicyForEdit, rules: updated });
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              borderRadius: "4px",
                              background: "var(--bg-input)",
                              border: "1px solid var(--border-card)",
                              color: "var(--ink-primary)",
                              fontSize: "12px",
                              boxSizing: "border-box"
                            }}
                          />
                        </div>
                      );
                    } else {
                      return (
                        <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                          <span style={{ fontSize: "12px", color: "var(--ink-secondary)", fontFamily: "monospace" }}>{k}</span>
                          <input
                            type="text"
                            value={String(v)}
                            onChange={(e) => {
                              const updated = { ...selectedPolicyForEdit.rules, [k]: e.target.value };
                              setSelectedPolicyForEdit({ ...selectedPolicyForEdit, rules: updated });
                            }}
                            style={{
                              width: "160px",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              background: "var(--bg-input)",
                              border: "1px solid var(--border-card)",
                              color: "var(--ink-primary)",
                              fontSize: "12px"
                            }}
                          />
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            ) : (
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-tertiary)" }}>
                  Direct JSON Rule Configuration:
                </label>
                <textarea
                  rows={10}
                  value={editedRulesJson}
                  onChange={(e) => setEditedRulesJson(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    background: "var(--bg-app)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--accent-teal)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "12px",
                    marginTop: "6px",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--border-subtle)", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => setSelectedPolicyForEdit(null)}
                className="btn-secondary"
                style={{ fontSize: "12px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePolicyRules}
                disabled={isSavingPolicy}
                className="btn-primary"
                style={{ fontSize: "12.5px", fontWeight: 700 }}
              >
                {isSavingPolicy ? "Saving..." : "Save Policy Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: Policy Simulator Sandbox */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedPolicyForTest && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px"
          }}
          onClick={() => setSelectedPolicyForTest(null)}
        >
          <div
            className="prism-card"
            style={{
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              padding: "24px",
              borderRadius: "14px",
              boxShadow: "0 20px 48px rgba(0,0,0,0.8)",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Terminal size={18} color="var(--accent-teal)" />
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink-primary)" }}>
                  Policy Simulator & AST Evaluation Sandbox
                </h2>
              </div>
              <button onClick={() => setSelectedPolicyForTest(null)} className="btn-ghost" style={{ padding: "4px" }}>
                <X size={16} />
              </button>
            </div>

            {/* Target Policy Selector */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
              <span style={{ fontSize: "12px", color: "var(--ink-tertiary)" }}>Testing Policy:</span>
              <select
                value={selectedPolicyForTest.id}
                onChange={(e) => {
                  const p = policies.find((pol) => pol.id === e.target.value);
                  if (p) handleOpenSimulator(p);
                }}
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-card)",
                  color: "var(--ink-primary)",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  maxWidth: "340px"
                }}
              >
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.policyKey})
                  </option>
                ))}
              </select>
            </div>

            {/* Input payload */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-tertiary)" }}>
                Test Telemetry / Query Input:
              </label>
              <textarea
                rows={4}
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  background: "var(--bg-app)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--ink-primary)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "12px",
                  marginTop: "4px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Run Button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={isTestingPolicy}
                className="btn-primary"
                style={{ fontSize: "12px", gap: "6px" }}
              >
                <Play size={12} /> {isTestingPolicy ? "Evaluating AST..." : "Evaluate Policy"}
              </button>
            </div>

            {/* Simulation Results Panel */}
            {testResult && (
              <div
                style={{
                  background: testResult.passed ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                  border: testResult.passed ? "1px solid var(--accent-teal)" : "1px solid var(--accent-rose)",
                  padding: "14px",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {testResult.passed ? (
                      <CheckCircle2 size={16} color="var(--accent-teal)" />
                    ) : (
                      <AlertOctagon size={16} color="var(--accent-rose)" />
                    )}
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "13px",
                        color: testResult.passed ? "var(--accent-teal)" : "var(--accent-rose)"
                      }}
                    >
                      {testResult.passed ? "POLICY EVALUATION PASSED (CLEAN)" : "GUARDRAIL VIOLATION DETECTED"}
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>{testResult.summary}</span>
                </div>

                {testResult.statementTypes && (
                  <div style={{ fontSize: "11.5px", color: "var(--ink-secondary)" }}>
                    Parsed AST Statements:{" "}
                    <strong>{testResult.statementTypes.join(", ") || "None"}</strong>
                  </div>
                )}

                {testResult.violations?.length > 0 && (
                  <div style={{ marginTop: "4px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-rose)" }}>
                      Violations Intercepted:
                    </div>
                    <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: "12px", color: "var(--accent-rose)" }}>
                      {testResult.violations.map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {testResult.sanitizedText && (
                  <div style={{ marginTop: "6px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-teal)" }}>
                      Sanitized Telemetry Preview:
                    </div>
                    <pre
                      style={{
                        background: "var(--bg-app)",
                        border: "1px solid var(--border-subtle)",
                        padding: "10px",
                        borderRadius: "6px",
                        fontSize: "11.5px",
                        color: "var(--accent-teal)",
                        margin: "4px 0 0 0",
                        fontFamily: "'JetBrains Mono', monospace",
                        whiteSpace: "pre-wrap"
                      }}
                    >
                      {testResult.sanitizedText}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: Create Custom Guardrail Modal */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px"
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="prism-card"
            style={{
              width: "100%",
              maxWidth: "540px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              padding: "24px",
              borderRadius: "14px",
              boxShadow: "0 20px 48px rgba(0,0,0,0.8)",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Shield size={18} color="var(--prism-pink)" />
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink-primary)" }}>
                  Create Platform Guardrail Policy
                </h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="btn-ghost" style={{ padding: "4px" }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePolicySubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-tertiary)" }}>Policy Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ingress Network CIDR Filter"
                  value={newPolicyForm.name}
                  onChange={(e) => setNewPolicyForm({ ...newPolicyForm, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-card)",
                    color: "var(--ink-primary)",
                    fontSize: "12.5px",
                    marginTop: "4px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-tertiary)" }}>Policy Key (Unique) *</label>
                <input
                  type="text"
                  required
                  placeholder="INGRESS_NETWORK_CIDR_FILTER"
                  value={newPolicyForm.policyKey}
                  onChange={(e) => setNewPolicyForm({ ...newPolicyForm, policyKey: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-card)",
                    color: "var(--ink-primary)",
                    fontSize: "12.5px",
                    marginTop: "4px",
                    boxSizing: "border-box",
                    fontFamily: "monospace"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-tertiary)" }}>Category</label>
                  <select
                    value={newPolicyForm.category}
                    onChange={(e) => setNewPolicyForm({ ...newPolicyForm, category: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-card)",
                      color: "var(--ink-primary)",
                      fontSize: "12.5px",
                      marginTop: "4px"
                    }}
                  >
                    <option value="Execution Governance">Execution Governance</option>
                    <option value="Write-Lock Governance">Write-Lock Governance</option>
                    <option value="Data Privacy">Data Privacy</option>
                    <option value="Cost Governance">Cost Governance</option>
                    <option value="Multi-Tenant Governance">Multi-Tenant Governance</option>
                    <option value="Custom Guardrails">Custom Guardrails</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-tertiary)" }}>Enforcement Level</label>
                  <select
                    value={newPolicyForm.enforcementLevel}
                    onChange={(e) => setNewPolicyForm({ ...newPolicyForm, enforcementLevel: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-card)",
                      color: "var(--ink-primary)",
                      fontSize: "12.5px",
                      marginTop: "4px"
                    }}
                  >
                    <option value="STRICT">STRICT (Hard Block)</option>
                    <option value="AUDIT_ONLY">AUDIT_ONLY (Warn/Log)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-tertiary)" }}>Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain what this guardrail protects against..."
                  value={newPolicyForm.description}
                  onChange={(e) => setNewPolicyForm({ ...newPolicyForm, description: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-card)",
                    color: "var(--ink-primary)",
                    fontSize: "12.5px",
                    marginTop: "4px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                  style={{ fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ fontSize: "12.5px", fontWeight: 700 }}>
                  Create Guardrail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
