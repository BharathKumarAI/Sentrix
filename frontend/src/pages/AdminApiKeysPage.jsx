import { useAuth } from "../context/AuthContext";
import React, { useState, useEffect } from "react";
import {
  Key,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Copy,
  Check,
  ShieldCheck,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Lock,
  User,
  ExternalLink,
  ShieldAlert,
  Server,
  RefreshCw,
  Info,
  X,
  Sparkles,
  Layers
} from "lucide-react";
import { Link } from "react-router-dom";
import { 
  fetchAdminApiKeys, 
  createAdminApiKey, 
  rotateAdminApiKey, 
  deleteAdminApiKey, 
  syncAdminApiKeys, fetchProjects 
} from "../api/client";

export function AdminApiKeysPage() {
  const [activeTab, setActiveTab] = useState("platform"); // "platform" | "personal"
  const { currentPersona } = useAuth();
  const currentUserEmail = currentPersona?.email || "";
  const [projects, setProjects] = useState([]);
  useEffect(() => { fetchProjects().then(setProjects).catch(() => setProjects([])); }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [revealedKeyId, setRevealedKeyId] = useState(null);
  const [copiedKeyId, setCopiedKeyId] = useState(null);
  const [keys, setKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState(null);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    name: "",
    service: "OpenAI",
    key_type: "GLOBAL",
    custom_key: "",
    auto_generate: true,
    expires_in: "90 days",
    project_key: "",
    description: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadKeys = () => {
    setIsLoading(true);
    fetchAdminApiKeys({
      scopeView: activeTab,
      userEmail: currentUserEmail
    })
      .then((data) => {
        setKeys(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.warn("Failed to load API keys:", err);
        setKeys([]);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadKeys();
  }, [activeTab, currentUserEmail]);

  const handleSyncKeys = async () => {
    setIsSyncing(true);
    try {
      const res = await syncAdminApiKeys();
      setSyncNotice(
        `Keystore synchronized successfully: ${res.synced_count || 0} updated, ${res.total_active_keys || 0} active in vault.`
      );
      loadKeys();
    } catch (err) {
      console.error("Sync failed:", err);
      setSyncNotice("Sync encountered an error. Please try again.");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncNotice(null), 6000);
    }
  };

  const handleRotateKey = async (id) => {
    try {
      await rotateAdminApiKey(id, { userEmail: currentUserEmail });
      loadKeys();
    } catch (err) {
      console.error("Key rotation failed:", err);
    }
  };

  const handleDeleteKey = async (id) => {
    try {
      await deleteAdminApiKey(id, { userEmail: currentUserEmail });
      loadKeys();
    } catch (err) {
      console.error("Key deletion failed:", err);
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!newKeyData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await createAdminApiKey(
        {
          name: newKeyData.name.trim(),
          service: newKeyData.service,
          key_type: newKeyData.key_type,
          custom_key: newKeyData.auto_generate ? null : newKeyData.custom_key.trim(),
          project_key: newKeyData.key_type === "PROJECT" ? newKeyData.project_key : null,
          owner_email: newKeyData.key_type === "PERSONAL" ? currentUserEmail : null,
          expires_in: newKeyData.expires_in,
          description: newKeyData.description
        },
        { userEmail: currentUserEmail }
      );
      setShowAddModal(false);
      setNewKeyData({
        name: "",
        service: "OpenAI",
        key_type: activeTab === "personal" ? "PERSONAL" : "GLOBAL",
        custom_key: "",
        auto_generate: true,
        expires_in: "90 days",
        project_key: "",
        description: ""
      });
      loadKeys();
    } catch (err) {
      console.error("Failed to create key:", err);
      alert("Failed to create credential: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredKeys = keys.filter((k) => {
    const q = searchQuery.toLowerCase();
    return (
      (k.name || "").toLowerCase().includes(q) ||
      (k.service || "").toLowerCase().includes(q) ||
      (k.scope || "").toLowerCase().includes(q) ||
      (k.id || "").toLowerCase().includes(q)
    );
  });

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
              boxShadow: "0 0 18px var(--prism-glow)",
              flexShrink: 0
            }}
          >
            <Key size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                ZERO-TRUST VAULT
              </span>
              <span className="badge badge-teal">Cryptographic Keystore</span>
              <span className="badge badge-magenta">Strict Scope Isolation</span>
              <span className="badge badge-blue">Database-backed secret storage</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              API Keys & Delegated Credentials
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Manage synchronized enterprise platform credentials, third-party API tokens, and private user personal access keys.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={handleSyncKeys}
            disabled={isSyncing}
            className="btn-secondary"
            style={{ padding: "8px 14px", fontSize: "12px", gap: "6px" }}
            title="Reconcile and sync credentials across Model Providers, Connectors, and Key Vault"
          >
            <RefreshCw size={13} className={isSyncing ? "spin" : ""} />
            {isSyncing ? "Syncing..." : "Sync Keystore"}
          </button>

          <button
            onClick={() => {
              setNewKeyData((prev) => ({
                ...prev,
                key_type: activeTab === "personal" ? "PERSONAL" : "GLOBAL"
              }));
              setShowAddModal(true);
            }}
            className="btn-primary"
            style={{ padding: "8px 16px", fontSize: "12px", gap: "6px" }}
          >
            <Plus size={14} /> Add Credential
          </button>
        </div>
      </div>

      {/* Sync Notification Banner */}
      {syncNotice && (
        <div
          className="prism-card"
          style={{
            padding: "12px 16px",
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "var(--accent-teal)",
            fontSize: "12.5px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <CheckCircle2 size={16} />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Scope Navigation Tabs */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px", background: "var(--bg-elevated)", padding: "4px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
          <button
            onClick={() => setActiveTab("platform")}
            style={{
              padding: "7px 16px",
              borderRadius: "6px",
              border: "none",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === "platform" ? "var(--prism-primary, #6366f1)" : "transparent",
              color: activeTab === "platform" ? "#fff" : "var(--ink-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease"
            }}
          >
            <Server size={13} />
            Platform Credentials (Global)
          </button>

          <button
            onClick={() => setActiveTab("personal")}
            style={{
              padding: "7px 16px",
              borderRadius: "6px",
              border: "none",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === "personal" ? "var(--prism-primary, #6366f1)" : "transparent",
              color: activeTab === "personal" ? "#fff" : "var(--ink-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease"
            }}
          >
            <Lock size={13} />
            My Personal Credentials (PATs)
          </button>
        </div>

        {/* Identity & User Test Switcher */}
        {activeTab === "personal" && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
            <span style={{ color: "var(--ink-tertiary)" }}>Viewing as User:</span>
            <span>{currentUserEmail || "Not signed in"}</span>
          </div>
        )}
      </div>

      {/* Project Isolation Architectural Notice Card */}
      <div
        className="prism-card"
        style={{
          padding: "14px 18px",
          background: "rgba(99, 102, 241, 0.04)",
          border: "1px solid rgba(99, 102, 241, 0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Layers size={16} color="var(--accent-teal)" />
          <span style={{ fontSize: "12.5px", color: "var(--ink-secondary)" }}>
            <strong style={{ color: "var(--ink-primary)" }}>Zero-Trust Project Isolation Enforced:</strong> Project-level credentials (e.g. Stripe, AWS, internal keys) are cryptographically bounded to their specific project and are <strong>not visible on this global platform view</strong>.
          </span>
        </div>
        <Link
          to="/admin/projects"
          className="btn-ghost"
          style={{ fontSize: "11.5px", gap: "4px", color: "var(--accent-pink)", textDecoration: "none" }}
        >
          View Projects <ExternalLink size={12} />
        </Link>
      </div>

      {/* Search Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "420px" }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--ink-tertiary)" }} />
          <input
            type="text"
            placeholder="Search credentials by name, service, or scope..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="prism-input"
            style={{ width: "100%", paddingLeft: "34px", fontSize: "12.5px" }}
          />
        </div>
        <span style={{ fontSize: "12px", color: "var(--ink-tertiary)" }}>
          Showing {filteredKeys.length} of {keys.length} credential{keys.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Keys Table / Zero State */}
      <div className="prism-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", overflowX: "auto" }}>
        {isLoading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--ink-tertiary)", fontSize: "13px" }}>
            <RotateCw size={20} className="spin" style={{ margin: "0 auto 8px" }} />
            Loading cryptographic credentials...
          </div>
        ) : filteredKeys.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ink-tertiary)"
              }}
            >
              <Key size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink-primary)" }}>
                No credentials found in {activeTab === "personal" ? "your personal token vault" : "platform scope"}
              </h3>
              <p style={{ fontSize: "12.5px", color: "var(--ink-tertiary)", maxWidth: "460px", margin: "4px auto 0" }}>
                {activeTab === "personal"
                  ? `No personal tokens generated for ${currentUserEmail}. Personal access tokens can be used for delegated SRE CLI workflows and triage automation.`
                  : "No platform API keys or model gateway credentials registered yet. Use 'Add Credential' or 'Sync Keystore' to register secrets."}
              </p>
            </div>
            <button
              onClick={() => {
                setNewKeyData((prev) => ({
                  ...prev,
                  key_type: activeTab === "personal" ? "PERSONAL" : "GLOBAL"
                }));
                setShowAddModal(true);
              }}
              className="btn-primary"
              style={{ marginTop: "8px", fontSize: "12px", gap: "6px" }}
            >
              <Plus size={13} /> {activeTab === "personal" ? "Generate Personal Token" : "Create Platform Key"}
            </button>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)", color: "var(--ink-secondary)", textAlign: "left" }}>
                <th style={{ padding: "12px 16px" }}>Credential Name</th>
                <th style={{ padding: "12px 16px" }}>Service / System</th>
                <th style={{ padding: "12px 16px" }}>Key Token</th>
                <th style={{ padding: "12px 16px" }}>Scope / Ownership</th>
                <th style={{ padding: "12px 16px" }}>Expires In</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredKeys.map((k) => {
                const isRevealed = revealedKeyId === k.id;
                const isCopied = copiedKeyId === k.id;

                return (
                  <tr key={k.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "var(--ink-primary)" }}>{k.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "2px" }}>
                        {k.source ? `Source: ${k.source} • ` : ""}Rotated {k.lastRotated}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className="badge badge-teal">{k.service}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px" }}>
                      {isRevealed ? (
                        <span style={{ color: "var(--accent-teal)", fontWeight: 600 }}>{k.rawKey}</span>
                      ) : (
                        <span style={{ color: "var(--ink-tertiary)" }}>{k.masked}</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ color: k.keyType === "PERSONAL" ? "var(--accent-pink)" : "var(--accent-blue)", fontWeight: 500 }}>
                        {k.scope}
                      </span>
                      {k.ownerEmail && (
                        <div style={{ fontSize: "10.5px", color: "var(--ink-tertiary)", marginTop: "2px" }}>
                          Owner: {k.ownerEmail}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", color: k.status === "EXPIRING_SOON" ? "var(--accent-amber)" : "var(--ink-secondary)", fontWeight: 600 }}>
                      {k.expiresIn}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className={`badge ${k.status === "ACTIVE" ? "badge-teal" : "badge-amber"}`}>
                        {k.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <button
                          onClick={() => setRevealedKeyId(isRevealed ? null : k.id)}
                          className="btn-ghost"
                          style={{ padding: "5px" }}
                          title={isRevealed ? "Hide Token" : "Reveal Token"}
                        >
                          {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(k.rawKey);
                            setCopiedKeyId(k.id);
                            setTimeout(() => setCopiedKeyId(null), 2000);
                          }}
                          className="btn-ghost"
                          style={{ padding: "5px" }}
                          title="Copy Token to Clipboard"
                        >
                          {isCopied ? <Check size={13} color="var(--accent-teal)" /> : <Copy size={13} />}
                        </button>

                        <button
                          onClick={() => handleRotateKey(k.id)}
                          className="btn-secondary"
                          style={{ padding: "4px 8px", fontSize: "11px", gap: "4px" }}
                          title="Rotate in Vault"
                        >
                          <RotateCw size={11} /> Rotate
                        </button>

                        <button
                          onClick={() => handleDeleteKey(k.id)}
                          className="btn-ghost"
                          style={{ padding: "5px", color: "var(--accent-rose, #f43f5e)" }}
                          title="Revoke & Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Generate API Key Modal */}
      {showAddModal && (
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
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="prism-card"
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
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
                <Key size={18} color="var(--prism-primary)" />
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink-primary)" }}>
                  Create or Register Credential
                </h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="btn-ghost" style={{ padding: "4px" }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateKey} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Scope Selection */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
                  Credential Scope & Privacy Level
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setNewKeyData({ ...newKeyData, key_type: "GLOBAL" })}
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      border: newKeyData.key_type === "GLOBAL" ? "1px solid var(--prism-primary)" : "1px solid var(--border-subtle)",
                      background: newKeyData.key_type === "GLOBAL" ? "rgba(99, 102, 241, 0.1)" : "var(--bg-elevated)",
                      color: newKeyData.key_type === "GLOBAL" ? "var(--prism-primary)" : "var(--ink-secondary)",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "center"
                    }}
                  >
                    Global (Admin)
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewKeyData({ ...newKeyData, key_type: "PERSONAL" })}
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      border: newKeyData.key_type === "PERSONAL" ? "1px solid var(--accent-pink)" : "1px solid var(--border-subtle)",
                      background: newKeyData.key_type === "PERSONAL" ? "rgba(236, 72, 153, 0.1)" : "var(--bg-elevated)",
                      color: newKeyData.key_type === "PERSONAL" ? "var(--accent-pink)" : "var(--ink-secondary)",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "center"
                    }}
                  >
                    Personal (User)
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewKeyData({ ...newKeyData, key_type: "PROJECT" })}
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      border: newKeyData.key_type === "PROJECT" ? "1px solid var(--accent-teal)" : "1px solid var(--border-subtle)",
                      background: newKeyData.key_type === "PROJECT" ? "rgba(16, 185, 129, 0.1)" : "var(--bg-elevated)",
                      color: newKeyData.key_type === "PROJECT" ? "var(--accent-teal)" : "var(--ink-secondary)",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "center"
                    }}
                  >
                    Project Scoped
                  </button>
                </div>

                <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "4px" }}>
                  {newKeyData.key_type === "PERSONAL"
                    ? `Bound strictly to ${currentUserEmail}. Invisible to all other users and admins.`
                    : newKeyData.key_type === "PROJECT"
                    ? "Cryptographically isolated to target project; invisible to global platform view."
                    : "Shared across platform administration."}
                </div>
              </div>

              {/* Target Project (if PROJECT scope) */}
              {newKeyData.key_type === "PROJECT" && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                    Target Project
                  </label>
                  <select
                    value={newKeyData.project_key}
                    onChange={(e) => setNewKeyData({ ...newKeyData, project_key: e.target.value })}
                    className="prism-input"
                    style={{ width: "100%", fontSize: "12px" }}
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => <option key={project.id} value={project.project_key}>{project.name}</option>)}
                  </select>
                </div>
              )}

              {/* Name */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Credential Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anthropic Claude Production API Key"
                  value={newKeyData.name}
                  onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                  className="prism-input"
                  style={{ width: "100%", fontSize: "12px" }}
                />
              </div>

              {/* Service */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                    Service / System
                  </label>
                  <select
                    value={newKeyData.service}
                    onChange={(e) => setNewKeyData({ ...newKeyData, service: e.target.value })}
                    className="prism-input"
                    style={{ width: "100%", fontSize: "12px" }}
                  >
                    <option value="OpenAI">OpenAI</option>
                    <option value="Anthropic">Anthropic Claude</option>
                    <option value="Gemini">Google Vertex AI / Gemini</option>
                    <option value="DeepSeek">DeepSeek AI</option>
                    <option value="Datadog">Datadog APM</option>
                    <option value="Splunk">Splunk Enterprise</option>
                    <option value="Jira">Atlassian Jira</option>
                    <option value="Vault">HashiCorp Vault</option>
                    <option value="Custom">Custom Service API</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                    Expiration Policy
                  </label>
                  <select
                    value={newKeyData.expires_in}
                    onChange={(e) => setNewKeyData({ ...newKeyData, expires_in: e.target.value })}
                    className="prism-input"
                    style={{ width: "100%", fontSize: "12px" }}
                  >
                    <option value="30 days">30 days</option>
                    <option value="60 days">60 days</option>
                    <option value="90 days">90 days (Recommended)</option>
                    <option value="180 days">180 days</option>
                    <option value="1 year">1 year</option>
                    <option value="Persistent">Never Expires (Persistent)</option>
                  </select>
                </div>
              </div>

              {/* Auto Generate vs Custom Key */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)" }}>
                    Secret Token Value
                  </label>
                  <label style={{ fontSize: "11.5px", color: "var(--accent-teal)", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={newKeyData.auto_generate}
                      onChange={(e) => setNewKeyData({ ...newKeyData, auto_generate: e.target.checked })}
                    />
                    Auto-generate cryptographic secret
                  </label>
                </div>

                {!newKeyData.auto_generate ? (
                  <input
                    type="password"
                    required
                    placeholder="Paste external API key or token (e.g. sk-ant-..., dd_api_...)"
                    value={newKeyData.custom_key}
                    onChange={(e) => setNewKeyData({ ...newKeyData, custom_key: e.target.value })}
                    className="prism-input"
                    style={{ width: "100%", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace" }}
                  />
                ) : (
                  <div style={{ padding: "8px 12px", background: "var(--bg-elevated)", border: "1px dashed var(--border-subtle)", borderRadius: "6px", fontSize: "11.5px", color: "var(--ink-tertiary)" }}>
                    A secure 256-bit cryptographic token prefixed with <code className="mono" style={{ color: "var(--accent-pink)" }}>stx_...</code> will be automatically generated upon creation.
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Purpose of credential, usage boundaries..."
                  value={newKeyData.description}
                  onChange={(e) => setNewKeyData({ ...newKeyData, description: e.target.value })}
                  className="prism-input"
                  style={{ width: "100%", fontSize: "12px" }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-ghost"
                  style={{ fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ fontSize: "12px", padding: "8px 16px" }}
                >
                  {isSubmitting ? "Generating..." : "Save Credential"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
