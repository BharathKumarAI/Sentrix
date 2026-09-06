import React, { useState, useEffect } from "react";
import { 
  X, 
  Server, 
  Sparkles, 
  Check, 
  Activity, 
  RotateCw, 
  Zap, 
  ShieldCheck, 
  Globe,
  AlertCircle,
  Database,
  Terminal,
  Ticket,
  FileText,
  Shield,
  Layers,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Tag
} from "lucide-react";
import { testConnectorConnection, fetchProjects } from "../api/client";

const RAW_TOOL_PRESETS = [
  {
    key: "oracle",
    name: "Oracle Database",
    category: "DATABASE",
    protocol: "POSTGRES_DB",
    defaultEndpoint: "jdbc:oracle:thin:@oracle-db.corp.internal:1521/PROD",
    defaultAuthType: "SERVICE_ACCOUNT",
    desc: "Governed relational database for core transactional queries, accounts, and relational dependencies.",
    icon: Database,
    color: "var(--prism-pink)",
    fields: [
      { field_key: "db_schema", label: "Default Schema", data_type: "string", default_value: "", description: "Default schema for table queries" },
      { field_key: "query_timeout_sec", label: "Query Timeout (s)", data_type: "integer", default_value: "30", description: "Read query SLA threshold" }
    ]
  },
  {
    key: "unix",
    name: "Unix / SSH Server Operator",
    category: "COMPUTE",
    protocol: "REST_API",
    defaultEndpoint: "ssh://unix-workers.corp.internal:22",
    defaultAuthType: "SSH_KEY",
    desc: "Remote host execution, tuxedo process monitoring, batch daemon logs, and systemd service states.",
    icon: Terminal,
    color: "var(--accent-teal)",
    fields: [
      { field_key: "host_group", label: "Host Pool Group", data_type: "string", default_value: "", description: "Cluster host group identifier" },
      { field_key: "allowed_commands", label: "Allowed Binaries", data_type: "string", default_value: "", description: "Comma-delimited execution allowlist" }
    ]
  },
  {
    key: "jira",
    name: "Atlassian Jira Enterprise",
    category: "ISSUE_TRACKER",
    protocol: "REST_API",
    defaultEndpoint: "https://jira.corp.internal/rest/api/2",
    defaultAuthType: "BEARER_TOKEN",
    desc: "Incident queue synchronization, autonomous triage updates, and bi-directional JQL ticket tracking.",
    icon: Ticket,
    color: "#38bdf8",
    fields: [
      { field_key: "jira_project_key", label: "Jira Project Key", data_type: "string", default_value: "", description: "Target Jira board namespace" },
      { field_key: "default_issue_type", label: "Default Issue Type", data_type: "string", default_value: "", description: "Triage issue type" }
    ]
  },
  {
    key: "servicenow",
    name: "ServiceNow ITSM",
    category: "ITSM",
    protocol: "REST_API",
    defaultEndpoint: "https://service-now.corp.internal/api/now/table",
    defaultAuthType: "OAUTH2",
    desc: "Enterprise IT Service Management, change approval gates, and incident correlation tickets.",
    icon: Shield,
    color: "var(--accent-amber)",
    fields: [
      { field_key: "assignment_group", label: "Assignment Group", data_type: "string", default_value: "", description: "Default resolver group" },
      { field_key: "urgency_level", label: "Default Urgency", data_type: "integer", default_value: "2", description: "Standard triage urgency code" }
    ]
  },
  {
    key: "splunk",
    name: "Corporate Splunk Cluster",
    category: "LOGS",
    protocol: "PYTHON_SDK",
    defaultEndpoint: "https://splunk-indexer.internal:8089",
    defaultAuthType: "BEARER_TOKEN",
    desc: "Distributed indexed log searches, SPL error stack trace parsing, and high-velocity telemetry.",
    icon: Activity,
    color: "var(--accent-violet)",
    fields: [
      { field_key: "default_index", label: "Splunk Index", data_type: "string", default_value: "", description: "Primary log index to search" },
      { field_key: "search_earliest", label: "Search Window Earliest", data_type: "string", default_value: "", description: "Default SPL time modifier" }
    ]
  },
  {
    key: "signalfx",
    name: "Splunk Observability (SignalFx)",
    category: "METRICS_APM",
    protocol: "REST_API",
    defaultEndpoint: "https://api.us0.signalfx.com",
    defaultAuthType: "BEARER_TOKEN",
    desc: "Real-time microservices APM, service latency percentiles (P99), and anomaly detector alerts.",
    icon: Activity,
    color: "#e879f9",
    fields: [
      { field_key: "realm", label: "SignalFx Realm", data_type: "string", default_value: "", description: "Regional tenant realm" },
      { field_key: "alert_threshold_p99", label: "P99 SLA Threshold (ms)", data_type: "integer", default_value: "450", description: "Latency escalation gate" }
    ]
  },
  {
    key: "confluence",
    name: "Atlassian Confluence",
    category: "KNOWLEDGE",
    protocol: "REST_API",
    defaultEndpoint: "https://confluence.corp.internal/rest/api",
    defaultAuthType: "BEARER_TOKEN",
    desc: "Enterprise standard operating procedures, architecture runbooks, and OKF knowledge base.",
    icon: FileText,
    color: "#c084fc",
    fields: [
      { field_key: "space_key", label: "Confluence Space", data_type: "string", default_value: "", description: "Target documentation space" }
    ]
  },
  {
    key: "kafka",
    name: "Apache Kafka Event Bus",
    category: "STREAMING",
    protocol: "PYTHON_SDK",
    defaultEndpoint: "",
    defaultAuthType: "SERVICE_ACCOUNT",
    desc: "Real-time payment event bus, consumer lag inspections, and dead-letter queue diagnostics.",
    icon: Zap,
    color: "var(--accent-teal)",
    fields: [
      { field_key: "bootstrapServers", label: "Bootstrap Servers (Kafka Brokers)", data_type: "string", requirement_mode: "ALWAYS_REQUIRED", default_value: "", description: "Kafka broker host:port addresses (mandatory)" },
      { field_key: "username", label: "SASL / Username", data_type: "string", requirement_mode: "OPTIONAL", default_value: "", description: "Optional SASL username" },
      { field_key: "password", label: "SASL / Password", data_type: "password", requirement_mode: "OPTIONAL", default_value: "", secret: true, description: "Optional SASL password" },
      { field_key: "allowedTopics", label: "Allowed Event Topics", data_type: "string", requirement_mode: "OPTIONAL", default_value: "", description: "Configurable topic whitelist" }
    ]
  }
];

export function ConnectorAcceleratorModal({ onClose, onConnectorCreated }) {
  const [selectedToolKey, setSelectedToolKey] = useState("");
  const [name, setName] = useState("");
  const [connectorKey, setConnectorKey] = useState("");
  const [protocol, setProtocol] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [scope, setScope] = useState("PLATFORM"); // PLATFORM (available to project) or PROJECT
  const [owningProjectId, setOwningProjectId] = useState("");
  const [availableProjects, setAvailableProjects] = useState([]);
  const [iconName, setIconName] = useState("oracle");
  const [authType, setAuthType] = useState("");
  
  useEffect(() => {
    async function loadProjects() {
      try {
        const projs = await fetchProjects();
        if (Array.isArray(projs)) {
          setAvailableProjects(projs);
        }
      } catch (err) {
        console.error("Failed to load projects for connector modal", err);
      }
    }
    loadProjects();
  }, []);

  
  // Credentials
  const [authUser, setAuthUser] = useState("");
  const [authSecret, setAuthSecret] = useState("");

  // Project Override Policies
  const [baseUrlOverridable, setBaseUrlOverridable] = useState(false);
  const [authOverridable, setAuthOverridable] = useState(true);

  // Governed Custom Fields defined by Admin
  const [customFields, setCustomFields] = useState([]);
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("string");
  const [newFieldReqMode, setNewFieldReqMode] = useState("OPTIONAL");
  const [newFieldDefault, setNewFieldDefault] = useState("");
  const [newFieldDesc, setNewFieldDesc] = useState("");

  // Test Connection
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectPreset = (preset) => {
    setSelectedToolKey(preset.key);
    setName(preset.name);
    setConnectorKey(preset.key);
    setIconName(preset.key);
    setProtocol(preset.protocol);
    setBaseUrl(preset.defaultEndpoint || "");
    setAuthType(preset.defaultAuthType);
    setCustomFields(preset.fields ? [...preset.fields] : []);
    setTestResult(null);
  };

  const handleAddCustomField = () => {
    if (!newFieldKey.trim() || !newFieldLabel.trim()) return;
    const cleanKey = newFieldKey.trim().toLowerCase().replace(/\s+/g, "_");
    setCustomFields((prev) => [
      ...prev,
      {
        field_key: cleanKey,
        label: newFieldLabel.trim(),
        data_type: newFieldType,
        requirement_mode: newFieldReqMode,
        default_value: newFieldDefault.trim(),
        description: newFieldDesc.trim() || undefined
      }
    ]);
    setNewFieldKey("");
    setNewFieldLabel("");
    setNewFieldDefault("");
    setNewFieldDesc("");
  };

  const handleToggleCustomFieldRequirement = (index) => {
    setCustomFields((prev) => prev.map((f, i) => {
      if (i !== index) return f;
      return {
        ...f,
        requirement_mode: f.requirement_mode === "ALWAYS_REQUIRED" ? "OPTIONAL" : "ALWAYS_REQUIRED"
      };
    }));
  };

  const handleRemoveCustomField = (index) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const instance = connectorKey.trim().toLowerCase();
      const res = await fetch(`/api/admin/connectors/${encodeURIComponent(instance)}/test?environment=default`, { method: "POST" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.detail || "Connection test failed");
      setTestResult({ status: payload.health?.status || "UNKNOWN", latency_ms: payload.health?.latency_ms, message: payload.health?.message || "Health probe completed." });
    } catch (e) {
      setTestResult({
        status: "FAILED",
        latency_ms: 0,
        message: `Connection test failed: ${e.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !connectorKey.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        connector_key: connectorKey.trim().toLowerCase(),
        protocol: protocol,
        base_url: baseUrl.trim(),
        auth_type: authType,
        auth_config: {
          username: authUser.trim(),
          secret_ref: authSecret.trim()
        },
        scope: scope, // "PLATFORM" or "PROJECT"
        owning_project_id: scope === "PROJECT" ? (owningProjectId || null) : null,
        override_policy: {
          base_url_overridable: baseUrlOverridable,
          auth_overridable: authOverridable,
          filters_overridable: true
        },
        is_global: scope === "PLATFORM",
        icon_name: iconName || connectorKey,
        environments: ["prod", "staging", "dev"],
        custom_fields: customFields
      };

      const res = await fetch("/api/connectors/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      onConnectorCreated(data);
      onClose();
    } catch (err) {
      console.error("Failed to register connector", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.82)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1200,
      padding: "20px"
    }}>
      <div
        className="prism-card"
        style={{
          width: "740px",
          maxHeight: "92vh",
          padding: "26px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          borderRadius: "var(--radius-md)",
          overflowY: "auto",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-card)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Server size={22} color="var(--prism-pink)" />
            <div>
              <h3 style={{ fontSize: "17px", color: "var(--ink-primary)", margin: 0, fontWeight: "700" }}>
                Create Enterprise Raw Connector
              </h3>
              <p style={{ fontSize: "12px", color: "var(--ink-secondary)", margin: "2px 0 0 0" }}>
                Define a raw enterprise tool that will be made available for projects to bind as custom system names.
              </p>
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Step 1: Select Raw Enterprise Tool Engine */}
        <div>
          <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            1. SELECT ENTERPRISE TOOL ENGINE
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px", marginTop: "8px" }}>
            {RAW_TOOL_PRESETS.map((p) => {
              const Icon = p.icon;
              const isSel = selectedToolKey === p.key;
              return (
                <div
                  key={p.key}
                  onClick={() => handleSelectPreset(p)}
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    borderRadius: "8px",
                    border: isSel ? "1px solid var(--prism-magenta)" : "1px solid var(--border-subtle)",
                    background: isSel ? "rgba(225, 29, 72, 0.12)" : "rgba(255, 255, 255, 0.02)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Icon size={16} color={p.color} />
                    <span className="badge" style={{ fontSize: "9px" }}>{p.category}</span>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: isSel ? "var(--prism-pink)" : "var(--ink-primary)", marginTop: "2px" }}>
                    {p.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Step 2: Core Identity & Project Scope */}
          <div style={{ display: "grid", gridTemplateColumns: scope === "PROJECT" ? "1.2fr 0.9fr 1fr 1fr" : "1.2fr 1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)" }}>CONNECTOR NAME *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  marginTop: "4px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "12px"
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)" }}>TOOL KEY *</label>
              <input
                type="text"
                required
                value={connectorKey}
                onChange={(e) => setConnectorKey(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  marginTop: "4px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "6px",
                  color: "var(--prism-pink)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "12px"
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)" }}>AVAILABILITY SCOPE *</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  marginTop: "4px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "12px"
                }}
              >
                <option value="PLATFORM">PLATFORM (Available to All Projects)</option>
                <option value="PROJECT">PROJECT (Restricted Scoped)</option>
              </select>
            </div>

            {scope === "PROJECT" && (
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-teal)" }}>ASSIGNED PROJECT *</label>
                <select
                  value={owningProjectId}
                  onChange={(e) => setOwningProjectId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    marginTop: "4px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--accent-teal)",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: 600
                  }}
                >
                  {availableProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.key})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Step 3: Endpoint & Authentication */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)" }}>ENDPOINT URI / CONNECTION STRING (OPTIONAL)</label>
              <input
                type="text"
                placeholder="e.g. https://api.corp.internal (optional for broker-based connectors)"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  marginTop: "4px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "6px",
                  color: "var(--accent-teal)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11.5px"
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)" }}>AUTH TYPE *</label>
              <select
                value={authType}
                onChange={(e) => setAuthType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  marginTop: "4px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "12px"
                }}
              >
                <option value="SERVICE_ACCOUNT">Service Account</option>
                <option value="SSH_KEY">SSH Key / Vault Key</option>
                <option value="BEARER_TOKEN">Bearer Token</option>
                <option value="OAUTH2">OAuth 2.0 / OIDC</option>
                <option value="API_KEY">API Key Header</option>
                <option value="NONE">None (Anonymous / Local)</option>
              </select>
            </div>
          </div>

          {/* Central Platform Vault Credentials */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)" }}>PLATFORM DEFAULT USER / ACCOUNT</label>
              <input
                type="text"
                placeholder="e.g. sentrix_reader"
                value={authUser}
                onChange={(e) => setAuthUser(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  marginTop: "4px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "11.5px"
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)" }}>VAULT SECRET REFERENCE / TOKEN</label>
              <input
                type="password"
                placeholder="vault://path/to/secret"
                value={authSecret}
                onChange={(e) => setAuthSecret(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  marginTop: "4px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "11.5px"
                }}
              />
            </div>
          </div>

          {/* Step 4: Project Override Policy */}
          <div style={{
            padding: "12px 14px",
            borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
              PROJECT OVERRIDE GOVERNANCE POLICY
            </span>
            <div style={{ display: "flex", gap: "20px", fontSize: "12px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={baseUrlOverridable}
                  onChange={(e) => setBaseUrlOverridable(e.target.checked)}
                />
                <span>Allow projects to override Base URL / Endpoint</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={authOverridable}
                  onChange={(e) => setAuthOverridable(e.target.checked)}
                />
                <span style={{ color: "var(--accent-teal)" }}>Allow projects to override Credentials</span>
              </label>
            </div>
          </div>

          {/* Step 5: Admin Governed Custom Fields */}
          <div style={{
            padding: "14px",
            borderRadius: "8px",
            background: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                  ADMIN GOVERNED CUSTOM FIELDS ({customFields.length})
                </span>
                <p style={{ fontSize: "11px", color: "var(--ink-secondary)", margin: "2px 0 0 0" }}>
                  Fields defined here are governed at the platform level. Projects cannot add custom fields arbitrarily.
                </p>
              </div>
              <span className="badge badge-teal" style={{ fontSize: "10px" }}>Platform Governed</span>
            </div>

            {/* List of Custom Fields */}
            {customFields.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {customFields.map((f, i) => (
                  <span
                    key={i}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--border-subtle)",
                      fontSize: "11px",
                      fontFamily: "'JetBrains Mono', monospace"
                    }}
                  >
                    <Tag size={11} color="var(--accent-teal)" />
                    <span style={{ color: "#fff", fontWeight: 600 }}>{f.field_key}</span>
                    <span style={{ color: "var(--ink-tertiary)" }}>({f.data_type || "string"})</span>
                    <span
                      className={`badge ${f.requirement_mode === "ALWAYS_REQUIRED" ? "badge-rose" : "badge-teal"}`}
                      style={{ fontSize: "8px", cursor: "pointer", padding: "1px 4px" }}
                      onClick={() => handleToggleCustomFieldRequirement(i)}
                      title="Click to toggle MANDATORY / OPTIONAL"
                    >
                      {f.requirement_mode === "ALWAYS_REQUIRED" ? "MANDATORY" : "OPTIONAL"}
                    </span>
                    {f.default_value && <span style={{ color: "var(--prism-pink)" }}>= {f.default_value}</span>}
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(i)}
                      style={{ background: "none", border: "none", color: "var(--accent-rose)", cursor: "pointer", padding: "0 2px" }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add Custom Field Inputs */}
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 0.8fr 0.9fr 0.9fr auto", gap: "6px", alignItems: "end" }}>
              <div>
                <label style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>FIELD KEY</label>
                <input
                  type="text"
                  placeholder="e.g. ban_code"
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                  style={{ width: "100%", padding: "6px 8px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "4px", color: "var(--ink-primary)", fontSize: "11px", fontFamily: "'JetBrains Mono', monospace" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>LABEL</label>
                <input
                  type="text"
                  placeholder="Display Name"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  style={{ width: "100%", padding: "6px 8px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "4px", color: "var(--ink-primary)", fontSize: "11px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>TYPE</label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                  style={{ width: "100%", padding: "6px 8px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "4px", color: "var(--ink-primary)", fontSize: "11px" }}
                >
                  <option value="string">String</option>
                  <option value="integer">Integer</option>
                  <option value="boolean">Boolean</option>
                  <option value="secret">Secret</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>MODE</label>
                <select
                  value={newFieldReqMode}
                  onChange={(e) => setNewFieldReqMode(e.target.value)}
                  style={{ width: "100%", padding: "6px 8px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "4px", color: "var(--ink-primary)", fontSize: "11px" }}
                >
                  <option value="OPTIONAL">Optional</option>
                  <option value="ALWAYS_REQUIRED">Mandatory</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>DEFAULT VAL</label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={newFieldDefault}
                  onChange={(e) => setNewFieldDefault(e.target.value)}
                  style={{ width: "100%", padding: "6px 8px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "4px", color: "var(--ink-primary)", fontSize: "11px" }}
                />
              </div>

              <button
                type="button"
                onClick={handleAddCustomField}
                className="btn-secondary"
                style={{ padding: "6px 10px", fontSize: "11px" }}
              >
                <Plus size={12} /> Add
              </button>
            </div>
          </div>

          {/* Diagnostic Pre-Check */}
          <div style={{
            padding: "12px 14px",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--ink-primary)", fontWeight: "600" }}>
                <Activity size={14} color="var(--accent-teal)" /> Pre-Enablement Handshake Diagnostic
              </div>
              
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: "4px 10px", fontSize: "11px" }}
                onClick={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting ? <RotateCw size={11} className="spin" /> : <Activity size={11} />}
                {isTesting ? "Pinging..." : "Test Handshake"}
              </button>
            </div>

            {testResult && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderRadius: "6px",
                background: testResult.status === "PASSED" ? "rgba(16, 185, 129, 0.12)" : "rgba(225, 29, 72, 0.12)",
                border: testResult.status === "PASSED" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(225, 29, 72, 0.3)",
                fontSize: "12px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {testResult.status === "PASSED" ? <Check size={14} color="var(--accent-teal)" /> : <AlertCircle size={14} color="var(--accent-rose)" />}
                  <span style={{ color: testResult.status === "PASSED" ? "var(--accent-teal)" : "var(--accent-rose)" }}>
                    {testResult.message}
                  </span>
                </div>
                <span className="mono" style={{ color: "#fff", fontWeight: "700" }}>
                  {testResult.latency_ms}ms
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ gap: "6px" }}>
              <Check size={14} />
              {isSubmitting ? "Creating Connector..." : "Create Connector for Platform"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
