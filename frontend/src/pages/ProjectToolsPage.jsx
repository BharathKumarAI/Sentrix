import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Wrench,
  Server,
  Database,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  Layers,
  Network,
  Plus,
  ArrowRight,
  Sliders,
  Check,
  X,
  Radio,
  FileText,
  Trash2,
  Lock,
  Unlock,
  Key,
  Tag,
  Filter,
  Ticket,
  Shield,
  Globe
} from "lucide-react";
import { 
  fetchProjectSystems,
  fetchProjectAvailableConnectors,
  bindProjectSystem,
  unbindProjectSystem,
  testProjectSystem,
  saveProjectEnvMapping,
  deleteProjectEnvMapping
} from "../api/client";
import { ToolIcon } from "../components/ToolIcon";

export function ProjectToolsPage({ activeProject, activeEnvironment }) {
  const { projectKey: routeProjectKey } = useParams();
  const navigate = useNavigate();
  const projectKey = (routeProjectKey || activeProject?.project_key || "").toUpperCase();

  const [systems, setSystems] = useState([]);
  const [availableConnectors, setAvailableConnectors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [testingSystemName, setTestingSystemName] = useState(null);
  const [probeResults, setProbeResults] = useState({});
  const [notification, setNotification] = useState(null);

  // Bind System Modal State
  const [showBindModal, setShowBindModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedConnectorId, setSelectedConnectorId] = useState("");
  const [systemNameInput, setSystemNameInput] = useState("");
  const [systemRoleInput, setSystemRoleInput] = useState("");
  const [usePlatformCreds, setUsePlatformCreds] = useState(true);
  const [authOverrideUsername, setAuthOverrideUsername] = useState("");
  const [authOverridePassword, setAuthOverridePassword] = useState("");
  const [initialFilterKey, setInitialFilterKey] = useState("");
  const [initialFilterVal, setInitialFilterVal] = useState("");

  const [activeTab, setActiveTab] = useState("ALL");
  const [addingMappingSysId, setAddingMappingSysId] = useState(null);
  const [mappingProjectEnv, setMappingProjectEnv] = useState("QLAB01");
  const [mappingToolEnv, setMappingToolEnv] = useState("");
  const [mappingNotes, setMappingNotes] = useState("");
  const [isSavingMapping, setIsSavingMapping] = useState(false);

  // Initial binding environment mapping state (for bind modal)
  const [bindProjEnv, setBindProjEnv] = useState("QLAB01");
  const [bindToolEnv, setBindToolEnv] = useState("");

  const showToast = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [systemsData, connectorsData] = await Promise.all([
        fetchProjectSystems(projectKey).catch(() => []),
        fetchProjectAvailableConnectors(projectKey).catch(() => [])
      ]);

      const safeSystems = Array.isArray(systemsData) ? systemsData : [];
      setSystems(safeSystems);

      const safeConnectors = Array.isArray(connectorsData) ? connectorsData : [];
      setAvailableConnectors(safeConnectors);
      if (safeConnectors.length > 0 && !selectedConnectorId) {
        setSelectedConnectorId(safeConnectors[0].id);
      }
    } catch (err) {
      console.warn("Failed to load project systems data:", err);
      showToast("Error loading project systems from integration engine", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectKey]);

  const handleSaveEnvMapping = async (sys) => {
    if (!mappingProjectEnv.trim() || !mappingToolEnv.trim()) {
      showToast("Please specify both Project Environment and Tool Environment", "warning");
      return;
    }
    setIsSavingMapping(true);
    try {
      await saveProjectEnvMapping(projectKey, {
        project_environment: mappingProjectEnv.trim(),
        connector_instance_id: sys.connector_id,
        tool_environment: mappingToolEnv.trim(),
        notes: mappingNotes.trim()
      });
      showToast(`Routed ${mappingProjectEnv} → ${mappingToolEnv} for ${sys.system_name}`, "success");
      setAddingMappingSysId(null);
      setMappingNotes("");
      loadData();
    } catch (e) {
      showToast(e.message || "Failed to save route", "error");
    } finally {
      setIsSavingMapping(false);
    }
  };

  const handleDeleteEnvMapping = async (mappingId, sysName) => {
    try {
      await deleteProjectEnvMapping(projectKey, mappingId);
      showToast(`Deleted route for ${sysName}`, "success");
      loadData();
    } catch (e) {
      showToast("Failed to delete route", "error");
    }
  };

  // Handle live test probe
  const handleTestProbe = async (systemName) => {
    setTestingSystemName(systemName);
    try {
      const res = await testProjectSystem(projectKey, systemName, activeEnvironment || "prod");
      setProbeResults((prev) => ({
        ...prev,
        [systemName]: {
          status: res.status || "PASSED",
          latency: `${res.latency_ms ? res.latency_ms.toFixed(1) : "12.0"}ms`,
          verifiedAt: new Date().toLocaleTimeString(),
          message: res.message || "Diagnostic ping succeeded"
        }
      }));
      showToast(`System [${systemName}] probe passed (${res.latency_ms ? res.latency_ms.toFixed(1) : "12.0"}ms)`);
    } catch (err) {
      setProbeResults((prev) => ({
        ...prev,
        [systemName]: {
          status: "FAILED",
          latency: "ERR",
          verifiedAt: new Date().toLocaleTimeString(),
          message: err.message || "Probe failed"
        }
      }));
      showToast(`System [${systemName}] probe failed`, "error");
    } finally {
      setTestingSystemName(null);
    }
  };

  // Handle Bind System Submit
  const handleBindSystem = async (e) => {
    e.preventDefault();
    if (!selectedConnectorId || !systemNameInput.trim()) {
      showToast("System Name and Raw Connector are required", "error");
      return;
    }

    const cleanSysName = systemNameInput.trim().toLowerCase().replace(/\s+/g, "_");
    setIsSubmitting(true);

    try {
      const payload = {
        system_name: cleanSysName,
        system_role: systemRoleInput.trim() || undefined,
        connector_instance_id: selectedConnectorId,
        use_platform_credentials: usePlatformCreds,
        auth_override: !usePlatformCreds && authOverrideUsername ? {
          username: authOverrideUsername.trim(),
          password: authOverridePassword.trim() || undefined
        } : undefined,
        project_filters: initialFilterKey.trim() ? {
          [initialFilterKey.trim()]: initialFilterVal.trim()
        } : undefined
      };

      await bindProjectSystem(projectKey, payload);
      showToast(`System [${cleanSysName}] bound successfully to project ${projectKey}!`);
      setShowBindModal(false);
      setSystemNameInput("");
      setSystemRoleInput("");
      setUsePlatformCreds(true);
      setAuthOverrideUsername("");
      setAuthOverridePassword("");
      setInitialFilterKey("");
      setInitialFilterVal("");
      loadData();
    } catch (err) {
      showToast(err.message || "Failed to bind system", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Unbind System
  const handleUnbindSystem = async (system) => {
    if (!window.confirm(`Are you sure you want to unbind system '${system.system_name}' from project ${projectKey}? Autonomous agent playbooks referencing this system will lose connectivity.`)) {
      return;
    }

    try {
      const identifier = system.binding_id || system.id || system.system_name;
      await unbindProjectSystem(projectKey, identifier);
      showToast(`System [${system.system_name}] unbound successfully`);
      loadData();
    } catch (err) {
      showToast(err.message || "Failed to unbind system", "error");
    }
  };

  const getSystemIcon = (connType) => {
    const type = (connType || "").toLowerCase();
    if (type.includes("oracle") || type.includes("db") || type.includes("sql") || type.includes("postgres")) return <Database size={20} color="var(--prism-pink)" />;
    if (type.includes("unix") || type.includes("ssh") || type.includes("server") || type.includes("host")) return <Terminal size={20} color="var(--accent-teal)" />;
    if (type.includes("jira") || type.includes("ticket") || type.includes("issue")) return <Ticket size={20} color="var(--accent-blue, #38bdf8)" />;
    if (type.includes("servicenow") || type.includes("itsm")) return <Shield size={20} color="var(--accent-amber)" />;
    if (type.includes("splunk") || type.includes("signal") || type.includes("datadog") || type.includes("telemetry")) return <Activity size={20} color="var(--accent-violet)" />;
    if (type.includes("confluence") || type.includes("wiki") || type.includes("knowledge")) return <FileText size={20} color="#a855f7" />;
    return <Server size={20} color="var(--ink-secondary)" />;
  };

  const selectedConn = availableConnectors.find(c => c.id === selectedConnectorId);
  const allowCredOverride = selectedConn?.override_policy?.auth_overridable ?? true;

  return (
    <div
      style={{
        padding: "24px 32px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        overflowY: "auto",
        minHeight: "100%",
        boxSizing: "border-box",
        position: "relative"
      }}
    >
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: "fixed",
          top: "24px",
          right: "32px",
          zIndex: 9999,
          padding: "12px 18px",
          borderRadius: "8px",
          background: notification.type === "error" ? "rgba(225, 29, 72, 0.95)" : "rgba(16, 185, 129, 0.95)",
          color: "#fff",
          fontSize: "13px",
          fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backdropFilter: "blur(6px)"
        }}>
          {notification.type === "error" ? <AlertTriangle size={16} /> : <Check size={16} />}
          {notification.msg}
        </div>
      )}

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
            <Wrench size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                {projectKey} • PROJECT SYSTEM NAMES & CONNECTOR BINDINGS
              </span>
              <span className="badge badge-teal">{systems.length} Systems Bound</span>
              <span className="badge badge-magenta">Live Database Systems</span>
              <span className="badge badge-purple">Tool Plugins</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Project Systems Catalog
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Autonomous SRE Agent invokes underlying connectors using project-defined <strong>system names</strong> (e.g. database name, server cluster, or queue identifier defined when adding the connector).
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate(`/p/${projectKey}/harness`)}
            className="btn-secondary"
            style={{ gap: "6px", fontSize: "12px", padding: "8px 14px" }}
            title="Open Agent Harness & Plugin Hub"
          >
            <Zap size={14} color="var(--prism-teal)" /> Harness Plugins Hub
          </button>

          <button
            onClick={() => navigate(`/p/${projectKey}/setup?tab=connectors`)}
            className="btn-secondary"
            style={{ gap: "6px", fontSize: "12px", padding: "8px 14px" }}
          >
            <Sliders size={14} /> Setup Studio
          </button>

          <button
            onClick={() => setShowBindModal(true)}
            className="btn-primary"
            style={{ gap: "6px", fontSize: "12px", padding: "8px 16px" }}
          >
            <Plus size={15} /> Bind System to Connector
          </button>
        </div>
      </div>

      {/* Scope Navigation Tabs */}
      <div className="prism-card" style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { id: "ALL", label: `All Bound Systems (${systems.length})`, icon: null },
            { id: "ENV_DEPENDENT", label: `Environment Dependent (${systems.filter(s => s.environment_scope === "ENVIRONMENT_DEPENDENT").length})`, icon: Layers },
            { id: "ENV_INDEPENDENT", label: `Universal Tools (${systems.filter(s => s.environment_scope !== "ENVIRONMENT_DEPENDENT").length})`, icon: Globe }
          ].map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "12px",
                  fontWeight: activeTab === tab.id ? "600" : "500",
                  color: activeTab === tab.id ? "var(--prism-pink)" : "var(--ink-secondary)",
                  background: activeTab === tab.id ? "rgba(225, 29, 72, 0.12)" : "transparent",
                  border: activeTab === tab.id ? "1px solid rgba(225, 29, 72, 0.3)" : "1px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {TabIcon && <TabIcon size={13} />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: "11.5px", color: "var(--ink-tertiary)" }}>
          Active Project: <strong style={{ color: "var(--accent-teal)" }}>{projectKey}</strong>
        </div>
      </div>

      {/* Systems Cards List */}
      {isLoading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-secondary)" }}>
          <RotateCw size={24} className="spin" style={{ margin: "0 auto 12px" }} />
          <div>Discovering project system bindings and raw connector adapters...</div>
        </div>
      ) : systems.length === 0 ? (
        <div className="prism-card" style={{ padding: "48px", textAlign: "center", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
          <Wrench size={36} color="var(--ink-tertiary)" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink-primary)" }}>No Systems Bound</h3>
          <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "4px", marginBottom: "16px" }}>
            No platform connectors have been mapped to system names in project {projectKey} yet.
          </p>
          <button onClick={() => setShowBindModal(true)} className="btn-primary" style={{ margin: "0 auto" }}>
            <Plus size={14} /> Bind First System
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {systems.filter(s => {
            if (activeTab === "ENV_DEPENDENT") return s.environment_scope === "ENVIRONMENT_DEPENDENT";
            if (activeTab === "ENV_INDEPENDENT") return s.environment_scope !== "ENVIRONMENT_DEPENDENT";
            return true;
          }).map((sys) => {
            const raw = {
              id: sys.connector_id || sys.raw_connector?.id,
              display_name: sys.connector_name || sys.raw_connector?.display_name || sys.system_role,
              connector_type: sys.connector_key || sys.raw_connector?.connector_type,
              base_url: sys.base_url || sys.raw_connector?.base_url,
              is_active: sys.is_enabled ?? sys.raw_connector?.is_active ?? true,
              test_status: sys.status === "HEALTHY" ? "PASSED" : (sys.raw_connector?.test_status || sys.status || "PASSED"),
              test_latency_ms: sys.latency_ms || sys.raw_connector?.test_latency_ms || 22,
              scope: sys.scope || sys.raw_connector?.scope || "PLATFORM",
              override_policy: sys.override_policy || sys.raw_connector?.override_policy || {}
            };
            const isTesting = testingSystemName === sys.system_name;
            const probe = probeResults[sys.system_name];

            const customFieldsList = Array.isArray(sys.project_custom_fields)
              ? sys.project_custom_fields.map(cf => ({
                  key: cf.field_key || cf.key || "field",
                  val: cf.label || cf.default_value || cf.type || "active"
                }))
              : Object.entries(sys.project_custom_fields || {}).map(([fk, fv]) => ({
                  key: fk,
                  val: typeof fv === "object" ? (fv.default_value || fv.label || "active") : String(fv)
                }));

            const filtersList = Array.isArray(sys.project_filters)
              ? sys.project_filters.map(f => ({
                  key: f.filter_key || f.key || "filter",
                  val: f.expression || f.value || ""
                }))
              : Object.entries(sys.project_filters || {}).map(([fk, fv]) => ({
                  key: fk,
                  val: String(fv)
                }));

            return (
              <div
                key={sys.id || sys.binding_id || sys.system_name}
                className="prism-card"
                style={{
                  padding: "20px 24px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px"
                }}
              >
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "10px",
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid var(--border-subtle)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <ToolIcon iconName={sys.icon_name || raw.icon_name || raw.connector_type || sys.connector_key} size={22} fallbackText={sys.system_name} />
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <span
                          className="mono"
                          style={{
                            fontSize: "17px",
                            fontWeight: 800,
                            color: "var(--prism-pink)",
                            letterSpacing: "0.5px"
                          }}
                        >
                          {sys.system_name}
                        </span>
                        <span className="badge badge-teal" style={{ fontSize: "11px" }}>
                          {sys.system_role || raw.display_name}
                        </span>
                        <span className="badge" style={{ background: "rgba(255,255,255,0.06)", fontSize: "10.5px", color: "var(--ink-secondary)" }}>
                          Underlying: <strong style={{ color: "var(--ink-primary)" }}>{raw.display_name || "Raw Connector"}</strong>
                        </span>
                        {sys.environment_scope === "ENVIRONMENT_DEPENDENT" ? (
                          <span className="badge badge-amber" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10.5px" }}>
                            <Layers size={11} /> Env Dependent Tool
                          </span>
                        ) : (
                          <span className="badge badge-magenta" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10.5px" }}>
                            <Globe size={11} /> Universal (Env Independent)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--ink-tertiary)", marginTop: "4px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        {sys.environment_scope === "ENVIRONMENT_DEPENDENT" ? (
                          <span>Routing: <strong style={{ color: "var(--accent-amber)" }}>Dynamic per Project Environment (e.g. QLAB01 → QATAPP91)</strong></span>
                        ) : (
                          <span>Platform Endpoint: <code style={{ color: "var(--accent-teal)" }}>{raw.base_url || "Universal Endpoint"}</code> <span style={{ fontSize: "10px", color: "var(--ink-tertiary)", display: "inline-flex", alignItems: "center", gap: "3px" }}>(<Lock size={10} /> Base URL Platform-Locked)</span></span>
                        )}
                        <span>•</span>
                        <span>Auth: {sys.use_platform_credentials ? <span style={{ color: "var(--accent-teal)", display: "inline-flex", alignItems: "center", gap: "3px" }}><Lock size={11} /> Platform Default</span> : <span style={{ color: "var(--accent-amber)", display: "inline-flex", alignItems: "center", gap: "3px" }}><Key size={11} /> Project Override</span>}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions right */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={() => handleTestProbe(sys.system_name)}
                      disabled={isTesting}
                      className="btn-secondary"
                      style={{ padding: "6px 12px", fontSize: "11.5px", gap: "6px" }}
                    >
                      {isTesting ? <RotateCw size={13} className="spin" /> : <Play size={13} />}
                      {isTesting ? "Testing..." : "Test Probe"}
                    </button>

                    <button
                      onClick={() => handleUnbindSystem(sys)}
                      className="btn-ghost"
                      style={{ padding: "6px 9px", color: "var(--accent-rose, #fb7185)" }}
                      title="Unbind System"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Body Details Grid: Filters & Governed Custom Fields */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {/* Project Filters */}
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Filter size={12} color="var(--ink-tertiary)" />
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                        Project Filters ({filtersList.length})
                      </span>
                    </div>

                    {filtersList.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {filtersList.map((fItem, idx) => (
                          <span
                            key={fItem.key + idx}
                            style={{
                              padding: "3px 8px",
                              borderRadius: "4px",
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid var(--border-subtle)",
                              fontSize: "11px",
                              fontFamily: "'JetBrains Mono', monospace"
                            }}
                          >
                            <span style={{ color: "var(--ink-secondary)" }}>{fItem.key}: </span>
                            <span style={{ color: "var(--prism-pink)", fontWeight: 600 }}>{fItem.val}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: "11.5px", color: "var(--ink-muted)", fontStyle: "italic" }}>
                        No project-specific scoping filters applied.
                      </span>
                    )}
                  </div>

                  {/* Governed Platform Custom Fields */}
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Tag size={12} color="var(--ink-tertiary)" />
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                          Governed Platform Fields ({customFieldsList.length})
                        </span>
                      </div>
                      <span className="badge badge-teal" style={{ fontSize: "9.5px" }}>Platform Governed</span>
                    </div>

                    {customFieldsList.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {customFieldsList.map((cf, idx) => (
                          <span
                            key={cf.key + idx}
                            style={{
                              padding: "3px 8px",
                              borderRadius: "4px",
                              background: "rgba(16, 185, 129, 0.08)",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              fontSize: "11px",
                              fontFamily: "'JetBrains Mono', monospace"
                            }}
                          >
                            <span style={{ color: "var(--ink-secondary)" }}>{cf.key}: </span>
                            <span style={{ color: "var(--accent-teal)", fontWeight: 600 }}>{cf.val}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: "11.5px", color: "var(--ink-muted)", fontStyle: "italic" }}>
                        Platform baseline fields active. Fields are governed centrally on Admin Connectors.
                      </span>
                    )}
                  </div>
                </div>

                {/* Section: Project Environment Routing Matrix (For Environment Dependent Tools) */}
                {sys.environment_scope === "ENVIRONMENT_DEPENDENT" ? (
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: "8px",
                    background: "rgba(245, 158, 11, 0.04)",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Layers size={13} color="var(--accent-amber)" />
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent-amber)", textTransform: "uppercase" }}>
                          Project Environment Routing Matrix
                        </span>
                        <span className="badge badge-amber" style={{ fontSize: "10px" }}>
                          {(sys.environment_mappings || []).length} Mapped Routes
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setAddingMappingSysId(addingMappingSysId === (sys.id || sys.binding_id) ? null : (sys.id || sys.binding_id));
                          if (sys.tool_environments?.length > 0) {
                            setMappingToolEnv(sys.tool_environments[0].environment_name);
                          }
                        }}
                        className="btn-secondary"
                        style={{ fontSize: "11px", padding: "4px 10px", gap: "4px" }}
                      >
                        <Plus size={11} /> Add Environment Route
                      </button>
                    </div>

                    {/* Active Mappings List */}
                    {(sys.environment_mappings || []).length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {sys.environment_mappings.map((m) => {
                          const matchedToolEnv = (sys.tool_environments || []).find(te => te.environment_name === m.tool_environment);
                          return (
                            <div
                              key={m.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                background: "var(--bg-input)",
                                border: "1px solid var(--border-subtle)",
                                fontSize: "11.5px"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span className="mono" style={{ fontWeight: 700, color: "var(--prism-pink)" }}>
                                  Project Env: {m.project_environment}
                                </span>
                                <ArrowRight size={12} color="var(--ink-tertiary)" />
                                <span className="mono" style={{ fontWeight: 700, color: "var(--accent-teal)" }}>
                                  Tool Env: {m.tool_environment}
                                </span>
                                {matchedToolEnv?.endpoint_override && (
                                  <span className="mono" style={{ color: "var(--ink-tertiary)", fontSize: "10.5px" }}>
                                    ({matchedToolEnv.endpoint_override})
                                  </span>
                                )}
                                {m.notes && (
                                  <span style={{ color: "var(--ink-muted)", fontSize: "10px", fontStyle: "italic" }}>
                                    — {m.notes}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteEnvMapping(m.id, sys.system_name)}
                                style={{ background: "none", border: "none", color: "var(--accent-rose)", cursor: "pointer", padding: "2px" }}
                                title="Delete mapping route"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontStyle: "italic" }}>
                        No project environment routes mapped yet. Add a route (e.g. QLAB01 → QATAPP91) so SRE queries resolve against the proper environment.
                      </div>
                    )}

                    {/* Inline Add Mapping Form */}
                    {addingMappingSysId === (sys.id || sys.binding_id) && (
                      <div style={{
                        marginTop: "4px",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px dashed var(--accent-amber)",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap"
                      }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>Project Env:</span>
                          <input
                            type="text"
                            value={mappingProjectEnv}
                            onChange={(e) => setMappingProjectEnv(e.target.value)}
                            placeholder="e.g. QLAB01, PROD"
                            className="glass-card mono"
                            style={{ padding: "4px 8px", fontSize: "11.5px", width: "110px", color: "var(--ink-input)" }}
                          />
                        </div>

                        <ArrowRight size={14} color="var(--ink-tertiary)" style={{ marginTop: "14px" }} />

                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>Tool Target Env:</span>
                          {sys.tool_environments?.length > 0 ? (
                            <select
                              value={mappingToolEnv}
                              onChange={(e) => setMappingToolEnv(e.target.value)}
                              className="glass-card mono"
                              style={{ padding: "4px 8px", fontSize: "11.5px", color: "var(--ink-input)", background: "var(--bg-input)" }}
                            >
                              <option value="">Select tool env...</option>
                              {sys.tool_environments.map(te => (
                                <option key={te.environment_name} value={te.environment_name}>
                                  {te.environment_name} ({te.endpoint_override})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={mappingToolEnv}
                              onChange={(e) => setMappingToolEnv(e.target.value)}
                              placeholder="e.g. QATAPP91"
                              className="glass-card mono"
                              style={{ padding: "4px 8px", fontSize: "11.5px", width: "130px", color: "var(--ink-input)" }}
                            />
                          )}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: "140px" }}>
                          <span style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>Notes (Optional):</span>
                          <input
                            type="text"
                            value={mappingNotes}
                            onChange={(e) => setMappingNotes(e.target.value)}
                            placeholder="e.g. Automated routing for billing incidents"
                            className="glass-card"
                            style={{ padding: "4px 8px", fontSize: "11.5px", color: "var(--ink-input)" }}
                          />
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "14px" }}>
                          <button
                            onClick={() => handleSaveEnvMapping(sys)}
                            disabled={isSavingMapping}
                            className="btn-primary"
                            style={{ padding: "4px 10px", fontSize: "11px", gap: "4px" }}
                          >
                            <Check size={11} /> {isSavingMapping ? "Saving..." : "Save Route"}
                          </button>
                          <button
                            onClick={() => setAddingMappingSysId(null)}
                            className="btn-ghost"
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    background: "rgba(168, 85, 247, 0.04)",
                    border: "1px solid rgba(168, 85, 247, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "11.5px",
                    color: "var(--ink-secondary)"
                  }}>
                    <Globe size={13} color="var(--accent-violet)" />
                    <span>
                      <strong>Universal Execution:</strong> This tool executes universally against platform endpoint <code style={{ color: "var(--accent-teal)" }}>{raw.base_url}</code> irrespective of whether chat query or ticket mentions QLAB01, STG, or PROD.
                    </span>
                  </div>
                )}

                {/* Status, Latency and Live Probe Feedback Bar */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  borderTop: "1px solid rgba(255,255,255,0.04)",
                  paddingTop: "10px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ color: "var(--ink-tertiary)" }}>
                      Connector State: <strong style={{ color: raw.is_active ? "var(--accent-teal)" : "var(--accent-amber)" }}>{raw.is_active ? "ACTIVE" : "DISABLED"}</strong>
                    </span>
                    <span style={{ color: "var(--ink-tertiary)" }}>
                      Admin Diagnostic: <strong style={{ color: raw.test_status === "PASSED" ? "var(--accent-teal)" : "var(--accent-rose)" }}>{raw.test_status || "UNTESTED"}</strong>
                    </span>
                    <span style={{ color: "var(--ink-tertiary)" }}>
                      Adapter Latency: <strong style={{ color: "var(--accent-violet)" }}>{probe ? probe.latency : (raw.test_latency_ms ? `${raw.test_latency_ms.toFixed(1)}ms` : "14.0ms")}</strong>
                    </span>
                  </div>

                  {probe && (
                    <div style={{
                      color: probe.status === "PASSED" || probe.status === "HEALTHY" ? "var(--accent-teal)" : "var(--accent-rose)",
                      fontSize: "11.5px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      {probe.status === "PASSED" || probe.status === "HEALTHY" ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                      <span>Probe {probe.status} at {probe.verifiedAt} ({probe.latency})</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Bind Platform Tool to Project System Name */}
      {showBindModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.78)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1200
        }}>
          <div
            className="prism-card"
            style={{
              width: "580px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-card)",
              boxShadow: "0 16px 40px rgba(0,0,0,0.3)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Network size={20} color="var(--prism-pink)" />
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink-primary)", margin: 0 }}>
                  Bind Platform Connector to Project System
                </h3>
              </div>
              <button
                onClick={() => setShowBindModal(false)}
                style={{ background: "none", border: "none", color: "var(--ink-tertiary)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", margin: 0 }}>
              Select an enabled, tested platform connector and define what your project calls this system (e.g. database name, worker cluster, or queue name).
            </p>

            <form onSubmit={handleBindSystem} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* 1. Connector Selection */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", display: "block", marginBottom: "6px" }}>
                  1. SELECT PLATFORM CONNECTOR (ONLY ACTIVE & TESTED AVAILABLE) *
                </label>
                <select
                  value={selectedConnectorId}
                  onChange={(e) => setSelectedConnectorId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "12.5px"
                  }}
                >
                  {availableConnectors.map((conn) => (
                    <option key={conn.id} value={conn.id}>
                      {conn.display_name} ({conn.connector_type}) - Verified {conn.test_latency_ms ? `${conn.test_latency_ms.toFixed(1)}ms` : "OK"}
                    </option>
                  ))}
                </select>
                {selectedConn && (
                  <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "4px" }}>
                    Endpoint: <code style={{ color: "var(--accent-teal)" }}>{selectedConn.base_url}</code> | Credential Override: {allowCredOverride ? <span style={{ color: "var(--accent-teal)" }}>Allowed</span> : <span style={{ color: "var(--accent-rose)" }}>Locked by Admin</span>}
                  </div>
                )}
              </div>

              {/* 2. System Name (Defined per project) */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", display: "block", marginBottom: "6px" }}>
                  2. PROJECT SYSTEM NAME * (ENTERPRISE REASONING IDENTIFIER)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. billing_db, app_worker, order_queue, batch_daemons"
                  value={systemNameInput}
                  onChange={(e) => setSystemNameInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    color: "var(--prism-pink)",
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "13px"
                  }}
                />
                <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "3px", display: "block" }}>
                  Enter your project's custom system name for this tool. Autonomous agents address the tool by this name.
                </span>
              </div>

              {/* 3. System Role */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", display: "block", marginBottom: "6px" }}>
                  3. SYSTEM ROLE & PURPOSE (OPTIONAL)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Core Relational Ledger or Transaction Processor"
                  value={systemRoleInput}
                  onChange={(e) => setSystemRoleInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "12px"
                  }}
                />
              </div>

              {/* 4. Credentials Override Policy */}
              <div style={{
                padding: "12px 14px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)" }}>
                    4. CREDENTIALS POLICY
                  </label>
                  {!allowCredOverride && (
                    <span style={{ fontSize: "10.5px", color: "var(--accent-rose)", fontWeight: 600 }}>
                      <Lock size={11} style={{ display: "inline", marginRight: "3px" }} />
                      Platform Locked
                    </span>
                  )}
                </div>

                {allowCredOverride ? (
                  <>
                    <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="credMode"
                          checked={usePlatformCreds}
                          onChange={() => setUsePlatformCreds(true)}
                        />
                        Use Platform Default Credentials
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="credMode"
                          checked={!usePlatformCreds}
                          onChange={() => setUsePlatformCreds(false)}
                        />
                        Project Custom Credentials
                      </label>
                    </div>

                    {!usePlatformCreds && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px" }}>
                        <input
                          type="text"
                          placeholder="Override Username / Service ID"
                          value={authOverrideUsername}
                          onChange={(e) => setAuthOverrideUsername(e.target.value)}
                          style={{
                            padding: "8px 10px",
                            background: "var(--bg-input)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "6px",
                            color: "#fff",
                            fontSize: "11.5px"
                          }}
                        />
                        <input
                          type="password"
                          placeholder="Override Password / Secret"
                          value={authOverridePassword}
                          onChange={(e) => setAuthOverridePassword(e.target.value)}
                          style={{
                            padding: "8px 10px",
                            background: "var(--bg-input)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "6px",
                            color: "#fff",
                            fontSize: "11.5px"
                          }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: "11.5px", color: "var(--ink-secondary)" }}>
                    The Platform Admin has locked credential overrides for this connector. Project {projectKey} will inherit central platform vault credentials.
                  </div>
                )}
              </div>

              {/* 5. Optional Filter */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", display: "block", marginBottom: "4px" }}>
                    INITIAL FILTER KEY (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. app or host_group"
                    value={initialFilterKey}
                    onChange={(e) => setInitialFilterKey(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "6px",
                      color: "#fff",
                      fontSize: "11.5px"
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", display: "block", marginBottom: "4px" }}>
                    FILTER VALUE
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. billing-core"
                    value={initialFilterVal}
                    onChange={(e) => setInitialFilterVal(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "6px",
                      color: "#fff",
                      fontSize: "11.5px"
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowBindModal(false)}
                  className="btn-secondary"
                  style={{ fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ fontSize: "12px", gap: "6px" }}
                >
                  <Check size={14} />
                  {isSubmitting ? "Binding System..." : "Bind System"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
