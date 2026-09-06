import React, { useEffect, useState, useMemo } from "react";
import {
  Sliders,
  Layers,
  Cpu,
  Zap,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  RotateCw,
  RotateCcw,
  Save,
  Plus,
  Search,
  Filter,
  FolderKanban,
  Building2,
  Globe,
  FileText,
  Sparkles,
  Code2,
  Check,
  Trash2,
  ExternalLink,
  ChevronRight,
  Eye,
  Info,
  Clock,
  ArrowRight,
  Lock,
  Unlock,
  Settings,
  Activity,
  Server,
  X,
  Copy
} from "lucide-react";
import {
  fetchProjects,
  fetchOrganizations,
  fetchConnectorInstances,
  harnessConfiguration
} from "../api/client";

const emptyConfig = () => ({
  plugins: {},
  prompts: {},
  skills: {},
  runtime: { max_llm_calls: 4, timeout_seconds: 120 }
});

export function AdminHarnessConfigurationPage() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState("bindings"); // "bindings" | "instructions" | "skills" | "preview" | "register"
  const [searchQuery, setSearchQuery] = useState("");
  const [pluginFilter, setPluginFilter] = useState("all"); // "all" | "enabled" | "overridden"

  // Data states
  const [plugins, setPlugins] = useState([]);
  const [projects, setProjects] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [connectorInstances, setConnectorInstances] = useState([]);

  // Scope state
  const [scope, setScope] = useState("platform"); // "platform" | "organization" | "project"
  const [scopeId, setScopeId] = useState("platform");

  // Configuration state
  const [config, setConfig] = useState(emptyConfig);
  const [instructions, setInstructions] = useState("");
  const [resolved, setResolved] = useState(null);
  const [isLoadingResolved, setIsLoadingResolved] = useState(false);

  // Status feedback states
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [copiedResolved, setCopiedResolved] = useState(false);

  // New Skill Draft
  const [skillName, setSkillName] = useState("");
  const [skillText, setSkillText] = useState("");

  // New Plugin Capability Draft & Modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [draft, setDraft] = useState({
    id: "",
    name: "",
    operation: "",
    capability: "",
    path: ""
  });
  const [isRegistering, setIsRegistering] = useState(false);

  const showToast = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(""), 5000);
    } else {
      setNotice(msg);
      setTimeout(() => setNotice(""), 4000);
    }
  };

  const refreshPlugins = () =>
    harnessConfiguration("/plugins")
      .then((data) => setPlugins(Array.isArray(data) ? data : []))
      .catch((e) => showToast(e.message, true));

  // Initial load
  useEffect(() => {
    setBusy(true);
    Promise.all([
      refreshPlugins(),
      fetchProjects().then((data) => setProjects(Array.isArray(data) ? data : [])),
      fetchOrganizations().then((data) => setOrganizations(Array.isArray(data) ? data : [])),
      fetchConnectorInstances().then((data) => setConnectorInstances(Array.isArray(data) ? data : []))
    ])
      .catch((e) => showToast(e.message, true))
      .finally(() => setBusy(false));
  }, []);

  // Fetch scope configuration on change
  useEffect(() => {
    let active = true;
    setResolved(null);
    setError("");
    setNotice("");
    setConfig(emptyConfig());
    setInstructions("");

    if (!scopeId) {
      setBusy(false);
      return;
    }

    setBusy(true);
    harnessConfiguration(`/scopes/${scope}/${encodeURIComponent(scopeId)}`)
      .then((data) => {
        if (active) {
          const loaded = data || emptyConfig();
          setConfig(loaded);
          setInstructions(loaded.prompts?.instructions || "");
        }
      })
      .catch((e) => {
        if (active) showToast(e.message, true);
      })
      .finally(() => {
        if (active) setBusy(false);
      });

    return () => {
      active = false;
    };
  }, [scope, scopeId]);

  const act = async (action) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setBusy(false);
    }
  };

  const updateBinding = (pluginId, field, value) => {
    setConfig((old) => {
      const existing = old.plugins?.[pluginId] || {
        enabled: false,
        instance_key: "",
        operations: []
      };
      return {
        ...old,
        plugins: {
          ...old.plugins,
          [pluginId]: {
            ...existing,
            [field]: value
          }
        }
      };
    });
  };

  const restoreInheritedBinding = (pluginId) => {
    setConfig((old) => {
      const next = { ...(old.plugins || {}) };
      delete next[pluginId];
      return { ...old, plugins: next };
    });
    showToast(`Restored inherited binding for "${pluginId}".`);
  };

  const handleSaveConfiguration = () => {
    if (!scopeId) return;
    act(async () => {
      const prompts = { ...(config.prompts || {}) };
      if (instructions.trim()) {
        prompts.instructions = instructions;
      } else {
        delete prompts.instructions;
      }
      await harnessConfiguration(`/scopes/${scope}/${encodeURIComponent(scopeId)}`, {
        method: "PUT",
        body: JSON.stringify({ ...config, prompts })
      });
      showToast("Harness configuration saved successfully.");
    });
  };

  const handleFetchResolved = () => {
    if (!scopeId) return;
    const targetProject = scope === "project" ? scopeId : projects[0]?.id;
    if (!targetProject) {
      showToast("Select a project or create one first to preview effective configuration.", true);
      return;
    }
    setIsLoadingResolved(true);
    harnessConfiguration(`/projects/${encodeURIComponent(targetProject)}/resolved`)
      .then((data) => {
        setResolved(data);
        setActiveTab("preview");
        showToast("Effective configuration resolved.");
      })
      .catch((e) => showToast(e.message, true))
      .finally(() => setIsLoadingResolved(false));
  };

  const handleRegisterPlugin = async (e) => {
    e?.preventDefault();
    if (Object.values(draft).some((val) => !val.trim())) {
      showToast("All capability fields are required.", true);
      return;
    }
    setIsRegistering(true);
    try {
      await harnessConfiguration("/plugins", {
        method: "POST",
        body: JSON.stringify({
          id: draft.id.trim().toLowerCase(),
          name: draft.name.trim(),
          operations: {
            [draft.operation.trim()]: {
              name: draft.name.trim(),
              capability: draft.capability.trim(),
              path: draft.path.trim(),
              method: "GET",
              read_only: true,
              input_schema: { type: "object" }
            }
          }
        })
      });
      await refreshPlugins();
      setShowRegisterModal(false);
      setDraft({ id: "", name: "", operation: "", capability: "", path: "" });
      showToast(`Connector capability "${draft.name}" registered successfully.`);
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCopyResolved = () => {
    if (!resolved) return;
    navigator.clipboard.writeText(JSON.stringify(resolved, null, 2));
    setCopiedResolved(true);
    setTimeout(() => setCopiedResolved(false), 2000);
  };

  // Filtered plugins
  const filteredPlugins = useMemo(() => {
    return plugins.filter((plugin) => {
      const binding = config.plugins?.[plugin.id];
      if (pluginFilter === "enabled" && !binding?.enabled) return false;
      if (pluginFilter === "overridden" && !binding) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = plugin.name?.toLowerCase().includes(q);
        const matchesId = plugin.id?.toLowerCase().includes(q);
        const matchesCap = (plugin.capabilities || []).some((c) => c.toLowerCase().includes(q));
        const matchesOps = Object.values(plugin.operations || {}).some(
          (op) =>
            op.name?.toLowerCase().includes(q) ||
            op.capability?.toLowerCase().includes(q) ||
            op.path?.toLowerCase().includes(q)
        );
        return matchesName || matchesId || matchesCap || matchesOps;
      }
      return true;
    });
  }, [plugins, config.plugins, pluginFilter, searchQuery]);

  // Statistics
  const boundPluginsCount = Object.keys(config.plugins || {}).length;
  const enabledPluginsCount = Object.values(config.plugins || {}).filter((p) => p?.enabled).length;

  const getScopeDisplayName = () => {
    if (scope === "platform") return "Platform Defaults";
    if (scope === "organization") {
      const org = organizations.find((o) => o.id === scopeId);
      return org ? `Org: ${org.name}` : "Organization";
    }
    const proj = projects.find((p) => p.id === scopeId);
    return proj ? `Project: ${proj.name}` : "Project";
  };

  // Qualified connector instances
  const testedConnectors = connectorInstances.filter(
    (instance) => instance.is_active && instance.test_status === "PASSED"
  );

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
      {/* Toast Feedback */}
      {(notice || error) && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "32px",
            zIndex: 9999,
            padding: "12px 18px",
            borderRadius: "8px",
            background: error ? "rgba(225, 29, 72, 0.95)" : "rgba(16, 185, 129, 0.95)",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backdropFilter: "blur(6px)"
          }}
        >
          {error ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{error || notice}</span>
          <button
            onClick={() => {
              setError("");
              setNotice("");
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              marginLeft: "6px",
              padding: "2px",
              display: "flex"
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Standard Framework Page Hero Card */}
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
            <Sliders size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "11.5px",
                  fontWeight: 700,
                  color: "var(--ink-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
              >
                PLATFORM ADMIN • HARNESS RUNTIME
              </span>
              <span className="badge badge-teal">Inheritance Engine</span>
              <span className="badge badge-magenta">Scoped Bindings</span>
              <span className="badge badge-cyan">{getScopeDisplayName()}</span>
            </div>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--ink-primary)",
                marginTop: "4px"
              }}
            >
              Harness Configuration & Scoped Composition
            </h1>
            <p
              style={{
                fontSize: "13px",
                color: "var(--ink-secondary)",
                marginTop: "2px"
              }}
            >
              Register reusable connector capabilities, then configure hierarchical bindings, agent instructions, guardrails, and skills across Platform, Organization, and Project scopes.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="btn-secondary"
            style={{ fontSize: "12.5px", gap: "6px" }}
          >
            <Plus size={14} /> Register Capability
          </button>

          <button
            onClick={handleFetchResolved}
            disabled={isLoadingResolved || !scopeId}
            className="btn-secondary"
            style={{ fontSize: "12.5px", gap: "6px" }}
            title="Preview effective merged configuration"
          >
            {isLoadingResolved ? (
              <RotateCw size={14} className="spin" />
            ) : (
              <Eye size={14} />
            )}
            Effective Preview
          </button>

          <button
            onClick={handleSaveConfiguration}
            disabled={busy || !scopeId}
            className="btn-primary"
            style={{ fontSize: "12.5px", gap: "6px" }}
          >
            {busy ? <RotateCw size={14} className="spin" /> : <Save size={14} />}
            Save Configuration
          </button>

          <button
            onClick={() => {
              refreshPlugins();
              if (scopeId) {
                setBusy(true);
                harnessConfiguration(`/scopes/${scope}/${encodeURIComponent(scopeId)}`)
                  .then((data) => {
                    const loaded = data || emptyConfig();
                    setConfig(loaded);
                    setInstructions(loaded.prompts?.instructions || "");
                    showToast("Configuration refreshed.");
                  })
                  .finally(() => setBusy(false));
              }
            }}
            className="btn-ghost"
            style={{ fontSize: "12.5px", gap: "6px" }}
            title="Refresh plugins and scope settings"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Scope Selector Bar Card */}
      <div
        className="prism-card"
        style={{
          padding: "16px 20px",
          background: "var(--bg-elevated)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--ink-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              Configuration Scope:
            </span>
          </div>

          {/* Scope Segmented Buttons */}
          <div
            style={{
              display: "flex",
              background: "var(--bg-card)",
              borderRadius: "8px",
              padding: "3px",
              border: "1px solid var(--border-subtle)",
              gap: "2px"
            }}
          >
            <button
              onClick={() => {
                setScope("platform");
                setScopeId("platform");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12.5px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background: scope === "platform" ? "var(--prism-gradient)" : "transparent",
                color: scope === "platform" ? "#fff" : "var(--ink-secondary)",
                boxShadow: scope === "platform" ? "0 2px 8px var(--prism-glow)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              <Globe size={14} /> Platform Defaults
            </button>

            <button
              onClick={() => {
                setScope("organization");
                setScopeId(organizations[0]?.id || "");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12.5px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background: scope === "organization" ? "var(--prism-gradient)" : "transparent",
                color: scope === "organization" ? "#fff" : "var(--ink-secondary)",
                boxShadow: scope === "organization" ? "0 2px 8px var(--prism-glow)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              <Building2 size={14} /> Organization
            </button>

            <button
              onClick={() => {
                setScope("project");
                setScopeId(projects[0]?.id || "");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12.5px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background: scope === "project" ? "var(--prism-gradient)" : "transparent",
                color: scope === "project" ? "#fff" : "var(--ink-secondary)",
                boxShadow: scope === "project" ? "0 2px 8px var(--prism-glow)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              <FolderKanban size={14} /> Project
            </button>
          </div>

          {/* Target Select Dropdown if Scope is not Platform */}
          {scope !== "platform" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "260px" }}>
              <span style={{ fontSize: "12px", color: "var(--ink-tertiary)", fontWeight: 500 }}>
                Target {scope === "organization" ? "Org" : "Project"}:
              </span>
              <select
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
                className="prism-input"
                style={{
                  height: "36px",
                  padding: "6px 12px",
                  fontSize: "13px",
                  fontWeight: 600,
                  flex: 1
                }}
              >
                <option value="">Select {scope === "organization" ? "an organization" : "a project"}...</option>
                {(scope === "project" ? projects : organizations).map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name} ({row.slug || row.id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Scope Inheritance Info Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "var(--ink-secondary)",
            background: "var(--bg-card)",
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid var(--border-subtle)"
          }}
        >
          <Info size={14} color="var(--prism-teal)" />
          <span>
            <strong>Inheritance:</strong> Project &gt; Organization &gt; Platform defaults.
          </span>
        </div>
      </div>

      {/* Global Executive KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        {/* Metric 1: Scope Target */}
        <div className="prism-card" style={{ padding: "20px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--ink-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              Active Target Scope
            </span>
            {scope === "platform" ? (
              <Globe size={18} color="var(--prism-purple)" />
            ) : scope === "organization" ? (
              <Building2 size={18} color="var(--prism-purple)" />
            ) : (
              <FolderKanban size={18} color="var(--prism-purple)" />
            )}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "12px" }}>
            <span
              style={{
                fontSize: "20px",
                fontWeight: "800",
                color: "var(--ink-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "200px"
              }}
            >
              {getScopeDisplayName()}
            </span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--prism-teal)", marginTop: "6px", fontWeight: "600" }}>
            {scope === "platform"
              ? "Base configuration blueprint"
              : scope === "organization"
              ? "Mid-tier organizational override"
              : "Leaf-level runtime configuration"}
          </div>
        </div>

        {/* Metric 2: Available Plugins */}
        <div className="prism-card" style={{ padding: "20px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--ink-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              Mounted Connector Plugins
            </span>
            <Layers size={18} color="var(--prism-teal)" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "12px" }}>
            <span style={{ fontSize: "32px", fontWeight: "800", color: "var(--ink-primary)" }}>
              {plugins.length}
            </span>
            <span style={{ fontSize: "13px", color: "var(--prism-teal)", fontWeight: "600" }}>
              read-only capabilities
            </span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--ink-tertiary)", marginTop: "6px" }}>
            Microkernel tool registry
          </div>
        </div>

        {/* Metric 3: Scope Bindings */}
        <div className="prism-card" style={{ padding: "20px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--ink-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              Scope Bindings
            </span>
            <CheckCircle2 size={18} color="var(--prism-pink)" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "12px" }}>
            <span style={{ fontSize: "32px", fontWeight: "800", color: "var(--ink-primary)" }}>
              {enabledPluginsCount}
            </span>
            <span style={{ fontSize: "13px", color: "var(--ink-tertiary)" }}>
              of {boundPluginsCount} configured ({plugins.length} total)
            </span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--ink-tertiary)", marginTop: "6px" }}>
            {boundPluginsCount === 0 ? "Inheriting parent bindings" : `${boundPluginsCount} explicit scope overrides`}
          </div>
        </div>

        {/* Metric 4: Runtime Limits */}
        <div className="prism-card" style={{ padding: "20px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--ink-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              Runtime Guardrails
            </span>
            <ShieldCheck size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "12px" }}>
            <span style={{ fontSize: "24px", fontWeight: "800", color: "var(--ink-primary)" }}>
              {config.runtime?.max_llm_calls ?? 4} LLM Calls
            </span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--accent-amber)", marginTop: "6px", fontWeight: "600" }}>
            {config.runtime?.timeout_seconds ?? 120}s timeout guardrail
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "12px",
          flexWrap: "wrap"
        }}
      >
        <button
          onClick={() => setActiveTab("bindings")}
          className={activeTab === "bindings" ? "btn-secondary" : "btn-ghost"}
          style={{ fontSize: "13px", gap: "8px", fontWeight: activeTab === "bindings" ? 700 : 500 }}
        >
          <Layers size={15} /> Connector Plugin Bindings ({plugins.length})
        </button>

        <button
          onClick={() => setActiveTab("instructions")}
          className={activeTab === "instructions" ? "btn-secondary" : "btn-ghost"}
          style={{ fontSize: "13px", gap: "8px", fontWeight: activeTab === "instructions" ? 700 : 500 }}
        >
          <FileText size={15} /> Agent Instructions &amp; Guardrails
        </button>

        <button
          onClick={() => setActiveTab("skills")}
          className={activeTab === "skills" ? "btn-secondary" : "btn-ghost"}
          style={{ fontSize: "13px", gap: "8px", fontWeight: activeTab === "skills" ? 700 : 500 }}
        >
          <Sparkles size={15} /> Scoped Skills ({Object.keys(config.skills || {}).length})
        </button>

        <button
          onClick={() => setActiveTab("preview")}
          className={activeTab === "preview" ? "btn-secondary" : "btn-ghost"}
          style={{ fontSize: "13px", gap: "8px", fontWeight: activeTab === "preview" ? 700 : 500 }}
        >
          <Code2 size={15} /> Effective Config Preview {resolved ? "✓" : ""}
        </button>
      </div>

      {/* TAB 1: CONNECTOR PLUGIN BINDINGS */}
      {activeTab === "bindings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Search & Filter Bar */}
          <div
            className="prism-card"
            style={{
              padding: "16px 20px",
              background: "var(--bg-elevated)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "280px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--ink-tertiary)"
                  }}
                />
                <input
                  type="text"
                  placeholder="Search plugins by name, ID, capability, or path..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="prism-input"
                  style={{ paddingLeft: "36px", height: "38px" }}
                />
              </div>

              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="btn-ghost" style={{ padding: "6px 10px" }}>
                  Clear
                </button>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Filter size={15} color="var(--ink-tertiary)" />
              <button
                onClick={() => setPluginFilter("all")}
                className={`btn ${pluginFilter === "all" ? "btn-secondary" : "btn-ghost"}`}
                style={{ fontSize: "12px" }}
              >
                All ({plugins.length})
              </button>
              <button
                onClick={() => setPluginFilter("enabled")}
                className={`btn ${pluginFilter === "enabled" ? "btn-secondary" : "btn-ghost"}`}
                style={{ fontSize: "12px" }}
              >
                Enabled in Scope ({enabledPluginsCount})
              </button>
              <button
                onClick={() => setPluginFilter("overridden")}
                className={`btn ${pluginFilter === "overridden" ? "btn-secondary" : "btn-ghost"}`}
                style={{ fontSize: "12px" }}
              >
                Explicit Overrides ({boundPluginsCount})
              </button>
            </div>
          </div>

          {/* Plugin Bindings Grid */}
          {filteredPlugins.length === 0 ? (
            <div
              className="prism-card"
              style={{
                padding: "48px 24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px"
              }}
            >
              <Layers size={36} color="var(--ink-tertiary)" />
              <h3 style={{ fontSize: "16px", color: "var(--ink-primary)" }}>No connector plugins found</h3>
              <p style={{ fontSize: "13px", color: "var(--ink-secondary)", maxWidth: "420px" }}>
                {searchQuery
                  ? "No plugins match your search criteria. Try modifying your query."
                  : "No connector plugins registered in the catalog. Click 'Register Capability' to register one."}
              </p>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="btn-primary"
                style={{ marginTop: "8px", fontSize: "12.5px" }}
              >
                <Plus size={14} /> Register Capability
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))", gap: "16px" }}>
              {filteredPlugins.map((plugin) => {
                const binding = config.plugins?.[plugin.id];
                const isOverridden = !!binding;
                const isEnabled = !!binding?.enabled;
                const boundInstanceKey = binding?.instance_key || "";
                const selectedInstance = connectorInstances.find((i) => i.instance_key === boundInstanceKey);

                return (
                  <div
                    key={plugin.id}
                    className="prism-card"
                    style={{
                      padding: "20px",
                      background: isEnabled
                        ? "var(--bg-elevated)"
                        : "var(--bg-card)",
                      border: isEnabled
                        ? "1px solid rgba(20, 184, 166, 0.35)"
                        : "1px solid var(--border-card)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      position: "relative",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {/* Plugin Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "10px",
                            background: isEnabled ? "var(--prism-gradient)" : "var(--bg-card-hover)",
                            border: "1px solid var(--border-subtle)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: isEnabled ? "#fff" : "var(--ink-secondary)",
                            flexShrink: 0
                          }}
                        >
                          <Cpu size={18} />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
                              {plugin.name}
                            </h3>
                            <span className="badge badge-neutral mono" style={{ fontSize: "10.5px" }}>
                              {plugin.id}
                            </span>
                          </div>
                          <p style={{ fontSize: "12px", color: "var(--ink-tertiary)", marginTop: "2px" }}>
                            {plugin.description || "Microkernel read-only tool adapter."}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {isOverridden ? (
                          <span
                            className="badge badge-magenta"
                            style={{ fontSize: "11px", fontWeight: 700 }}
                            title="Explicit local configuration override"
                          >
                            Local Override
                          </span>
                        ) : (
                          <span
                            className="badge badge-neutral"
                            style={{ fontSize: "11px" }}
                            title="Inheriting configuration from parent scope"
                          >
                            Inherited
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Enable in scope switch */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: "var(--bg-card)",
                        borderRadius: "8px",
                        border: "1px solid var(--border-subtle)"
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          cursor: "pointer",
                          userSelect: "none"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          disabled={busy || !scopeId}
                          onChange={(e) => updateBinding(plugin.id, "enabled", e.target.checked)}
                          style={{
                            width: "16px",
                            height: "16px",
                            accentColor: "var(--prism-teal)",
                            cursor: "pointer"
                          }}
                        />
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-primary)" }}>
                          Enable in {getScopeDisplayName()}
                        </span>
                      </label>

                      {isEnabled && (
                        <span className="badge badge-teal" style={{ fontSize: "11px" }}>
                          Active in Scope
                        </span>
                      )}
                    </div>

                    {/* Connector Instance Selector */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <label
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "var(--ink-secondary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          <Server size={14} color="var(--prism-purple)" /> Bound Connector Instance
                        </label>
                        {selectedInstance && (
                          <span className="badge badge-teal" style={{ fontSize: "10px" }}>
                            Status: PASSED
                          </span>
                        )}
                      </div>

                      <select
                        value={boundInstanceKey}
                        disabled={busy || !scopeId}
                        onChange={(e) => updateBinding(plugin.id, "instance_key", e.target.value)}
                        className="prism-input"
                        style={{ height: "38px", fontSize: "12.5px" }}
                      >
                        <option value="">Select a tested, active connector instance...</option>
                        {testedConnectors.map((instance) => (
                          <option key={instance.instance_key} value={instance.instance_key}>
                            {instance.name} ({instance.connector_key} · {instance.instance_key})
                          </option>
                        ))}
                      </select>

                      {!boundInstanceKey && isEnabled && (
                        <div
                          style={{
                            marginTop: "6px",
                            fontSize: "11.5px",
                            color: "var(--accent-amber)",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          <AlertTriangle size={13} />
                          <span>Must bind to a tested connector instance to execute operations.</span>
                        </div>
                      )}
                    </div>

                    {/* Operations checklist */}
                    {plugin.operations && Object.keys(plugin.operations).length > 0 && (
                      <div>
                        <span
                          style={{
                            fontSize: "11.5px",
                            fontWeight: 700,
                            color: "var(--ink-tertiary)",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            display: "block",
                            marginBottom: "8px"
                          }}
                        >
                          Allowed Operations
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {Object.entries(plugin.operations).map(([opId, op]) => {
                            const isOpChecked = binding?.operations?.includes(opId) || false;
                            return (
                              <label
                                key={opId}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "8px 12px",
                                  borderRadius: "6px",
                                  background: "var(--bg-card)",
                                  border: isOpChecked
                                    ? "1px solid rgba(20, 184, 166, 0.25)"
                                    : "1px solid var(--border-subtle)",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease"
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <input
                                    type="checkbox"
                                    checked={isOpChecked}
                                    disabled={busy || !scopeId}
                                    onChange={(e) => {
                                      const currentOps = binding?.operations || [];
                                      const nextOps = e.target.checked
                                        ? [...currentOps, opId]
                                        : currentOps.filter((key) => key !== opId);
                                      updateBinding(plugin.id, "operations", nextOps);
                                    }}
                                    style={{
                                      accentColor: "var(--prism-teal)",
                                      cursor: "pointer"
                                    }}
                                  />
                                  <div>
                                    <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--ink-primary)" }}>
                                      {op.name || opId}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }} className="mono">
                                      {op.path}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span className="badge badge-purple" style={{ fontSize: "10.5px" }}>
                                    {op.capability}
                                  </span>
                                  <span className="badge badge-neutral mono" style={{ fontSize: "10px" }}>
                                    GET
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Card Actions Footer */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: "12px",
                        borderTop: "1px solid var(--border-subtle)",
                        marginTop: "auto"
                      }}
                    >
                      {isOverridden ? (
                        <button
                          onClick={() => restoreInheritedBinding(plugin.id)}
                          className="btn-ghost"
                          style={{
                            fontSize: "11.5px",
                            gap: "5px",
                            color: "var(--ink-tertiary)"
                          }}
                          title="Clear local override and restore inheritance from higher tier"
                        >
                          <RotateCcw size={13} /> Restore inherited binding
                        </button>
                      ) : (
                        <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)" }}>
                          Inherited from platform scope
                        </span>
                      )}

                      <span style={{ fontSize: "11.5px", color: "var(--ink-muted)" }} className="mono">
                        {plugin.capabilities?.length || 0} capabilities
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AGENT INSTRUCTIONS & RUNTIME GUARDRAILS */}
      {activeTab === "instructions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Agent Instructions Card */}
          <div className="prism-card" style={{ padding: "24px", background: "var(--bg-elevated)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <FileText size={18} color="var(--prism-purple)" />
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink-primary)" }}>
                Scoped Agent Instructions &amp; System Directives
              </h2>
            </div>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginBottom: "16px" }}>
              Custom prompt instructions injected into the Sentrix Autonomous SRE agent harness for {getScopeDisplayName()}. These directives guide root cause reasoning, investigation depth, and protocol compliance.
            </p>

            <textarea
              className="prism-input mono"
              rows={8}
              value={instructions}
              disabled={busy || !scopeId}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter system directives for this scope, e.g.:&#10;Always correlate APM latency spikes with database slow query logs before staging any remediation proposals..."
              style={{
                fontSize: "13px",
                lineHeight: "1.6",
                padding: "14px",
                resize: "vertical"
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "10px",
                fontSize: "12px",
                color: "var(--ink-tertiary)"
              }}
            >
              <span>{instructions.length} characters</span>
              {instructions.trim() ? (
                <span className="badge badge-teal">Instructions Configured</span>
              ) : (
                <span className="badge badge-neutral">Using Inherited Directives</span>
              )}
            </div>
          </div>

          {/* Runtime Guardrails Card */}
          <div className="prism-card" style={{ padding: "24px", background: "var(--bg-elevated)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <Shield size={18} color="var(--accent-amber)" />
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink-primary)" }}>
                Harness Runtime Guardrails
              </h2>
            </div>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginBottom: "20px" }}>
              Strict execution boundaries enforced during agent autonomous investigation runs to prevent runaway LLM loops or resource exhaustion.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
              {/* Max LLM Invocations */}
              <div
                style={{
                  padding: "16px 20px",
                  background: "var(--bg-card)",
                  borderRadius: "10px",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--ink-primary)" }}>
                      Maximum LLM Calls
                    </label>
                    <span className="badge badge-amber mono" style={{ fontSize: "12px" }}>
                      {config.runtime?.max_llm_calls ?? 4} calls
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--ink-tertiary)", marginTop: "4px" }}>
                    Maximum iterations the agent reasoning harness is authorized to invoke before halting.
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input
                    type="range"
                    min="1"
                    max="32"
                    value={config.runtime?.max_llm_calls ?? 4}
                    disabled={busy || !scopeId}
                    onChange={(e) =>
                      setConfig((old) => ({
                        ...old,
                        runtime: { ...old.runtime, max_llm_calls: Number(e.target.value) }
                      }))
                    }
                    style={{ flex: 1, accentColor: "var(--accent-amber)" }}
                  />
                  <input
                    type="number"
                    min="1"
                    max="32"
                    value={config.runtime?.max_llm_calls ?? 4}
                    disabled={busy || !scopeId}
                    onChange={(e) =>
                      setConfig((old) => ({
                        ...old,
                        runtime: { ...old.runtime, max_llm_calls: Number(e.target.value) }
                      }))
                    }
                    className="prism-input mono"
                    style={{ width: "70px", textAlign: "center", height: "34px", padding: "4px 8px" }}
                  />
                </div>
              </div>

              {/* Execution Timeout */}
              <div
                style={{
                  padding: "16px 20px",
                  background: "var(--bg-card)",
                  borderRadius: "10px",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--ink-primary)" }}>
                      Execution Timeout
                    </label>
                    <span className="badge badge-purple mono" style={{ fontSize: "12px" }}>
                      {config.runtime?.timeout_seconds ?? 120} seconds
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--ink-tertiary)", marginTop: "4px" }}>
                    Maximum wall-clock duration in seconds allowed before the watchdog aborts execution.
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input
                    type="range"
                    min="10"
                    max="600"
                    step="10"
                    value={config.runtime?.timeout_seconds ?? 120}
                    disabled={busy || !scopeId}
                    onChange={(e) =>
                      setConfig((old) => ({
                        ...old,
                        runtime: { ...old.runtime, timeout_seconds: Number(e.target.value) }
                      }))
                    }
                    style={{ flex: 1, accentColor: "var(--prism-purple)" }}
                  />
                  <input
                    type="number"
                    min="10"
                    max="600"
                    value={config.runtime?.timeout_seconds ?? 120}
                    disabled={busy || !scopeId}
                    onChange={(e) =>
                      setConfig((old) => ({
                        ...old,
                        runtime: { ...old.runtime, timeout_seconds: Number(e.target.value) }
                      }))
                    }
                    className="prism-input mono"
                    style={{ width: "80px", textAlign: "center", height: "34px", padding: "4px 8px" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCOPED SKILLS */}
      {activeTab === "skills" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Active Skills List */}
          <div className="prism-card" style={{ padding: "24px", background: "var(--bg-elevated)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink-primary)" }}>
                  Scoped Skills Catalog
                </h2>
                <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
                  Domain skills and specialized routines active for {getScopeDisplayName()}.
                </p>
              </div>
              <span className="badge badge-teal">
                {Object.keys(config.skills || {}).length} Skills Configured
              </span>
            </div>

            {Object.keys(config.skills || {}).length === 0 ? (
              <div
                style={{
                  padding: "32px",
                  textAlign: "center",
                  background: "var(--bg-card)",
                  borderRadius: "8px",
                  border: "1px dashed var(--border-subtle)"
                }}
              >
                <Sparkles size={28} color="var(--ink-tertiary)" style={{ margin: "0 auto 8px" }} />
                <p style={{ fontSize: "13px", color: "var(--ink-secondary)" }}>
                  No custom skills defined for this scope. Standard platform skills are inherited automatically.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {Object.entries(config.skills || {}).map(([name, text]) => {
                  const isDisabledInScope = text === null;
                  return (
                    <div
                      key={name}
                      style={{
                        padding: "16px 20px",
                        background: "var(--bg-card)",
                        borderRadius: "10px",
                        border: isDisabledInScope
                          ? "1px solid rgba(239, 68, 68, 0.3)"
                          : "1px solid var(--border-subtle)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "16px"
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)" }}>
                            {name}
                          </span>
                          {isDisabledInScope ? (
                            <span className="badge badge-rose">Disabled in this scope</span>
                          ) : (
                            <span className="badge badge-teal">Active</span>
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: "12.5px",
                            color: "var(--ink-secondary)",
                            marginTop: "6px",
                            whiteSpace: "pre-wrap"
                          }}
                        >
                          {isDisabledInScope ? "Inherited skill is suppressed in this scope." : text}
                        </p>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {isDisabledInScope ? (
                          <button
                            onClick={() =>
                              setConfig((old) => {
                                const next = { ...(old.skills || {}) };
                                delete next[name];
                                return { ...old, skills: next };
                              })
                            }
                            className="btn-secondary"
                            style={{ fontSize: "11.5px", gap: "4px" }}
                          >
                            <RotateCcw size={12} /> Remove Suppression
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setConfig((old) => ({
                                ...old,
                                skills: { ...old.skills, [name]: null }
                              }))
                            }
                            className="btn-ghost"
                            style={{ fontSize: "11.5px", gap: "4px", color: "var(--accent-rose)" }}
                          >
                            <XCircle size={12} /> Disable in Scope
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add / Override Skill Form Card */}
          <div className="prism-card" style={{ padding: "24px", background: "var(--bg-elevated)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Plus size={18} color="var(--prism-teal)" />
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
                  Add or Override Skill in this Scope
                </h3>
                <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)" }}>
                  Define custom step-by-step instructions for an agent routine in {getScopeDisplayName()}.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
                  Skill Identifier Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. database_failover_triage"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  className="prism-input mono"
                  style={{ height: "38px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
                  Skill Instructions &amp; Action Plan
                </label>
                <textarea
                  placeholder="Detail the procedural steps, verification commands, and analysis criteria..."
                  value={skillText}
                  onChange={(e) => setSkillText(e.target.value)}
                  className="prism-input"
                  rows={4}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  disabled={!skillName.trim() || !skillText.trim()}
                  onClick={() => {
                    setConfig((old) => ({
                      ...old,
                      skills: { ...(old.skills || {}), [skillName.trim()]: skillText.trim() }
                    }));
                    setSkillName("");
                    setSkillText("");
                    showToast(`Skill "${skillName.trim()}" added to current scope.`);
                  }}
                  className="btn-primary"
                  style={{ fontSize: "12.5px", gap: "6px" }}
                >
                  <Plus size={14} /> Add Skill to Scope
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EFFECTIVE CONFIG PREVIEW */}
      {activeTab === "preview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="prism-card" style={{ padding: "24px", background: "var(--bg-elevated)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink-primary)" }}>
                  Effective Resolved Configuration Inspector
                </h2>
                <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
                  Full hierarchically-resolved runtime state combining platform defaults, organization baselines, and project overrides.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={handleFetchResolved}
                  disabled={isLoadingResolved || !scopeId}
                  className="btn-secondary"
                  style={{ fontSize: "12px", gap: "6px" }}
                >
                  {isLoadingResolved ? <RotateCw size={13} className="spin" /> : <RefreshCw size={13} />}
                  Re-resolve Configuration
                </button>

                {resolved && (
                  <button
                    onClick={handleCopyResolved}
                    className="btn-ghost"
                    style={{ fontSize: "12px", gap: "6px" }}
                  >
                    {copiedResolved ? <Check size={13} color="var(--prism-teal)" /> : <Copy size={13} />}
                    {copiedResolved ? "Copied" : "Copy JSON"}
                  </button>
                )}
              </div>
            </div>

            {resolved ? (
              <div
                style={{
                  background: "var(--bg-code-block)",
                  borderRadius: "10px",
                  padding: "18px",
                  border: "1px solid var(--border-subtle)",
                  overflowX: "auto",
                  maxHeight: "560px"
                }}
              >
                <pre
                  className="mono"
                  style={{
                    fontSize: "12px",
                    lineHeight: "1.6",
                    color: "var(--ink-primary)",
                    margin: 0
                  }}
                >
                  {JSON.stringify(resolved, null, 2)}
                </pre>
              </div>
            ) : (
              <div
                style={{
                  padding: "48px 24px",
                  textAlign: "center",
                  background: "var(--bg-card)",
                  borderRadius: "10px",
                  border: "1px dashed var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px"
                }}
              >
                <Code2 size={36} color="var(--ink-tertiary)" />
                <h3 style={{ fontSize: "15px", color: "var(--ink-primary)" }}>
                  No effective configuration loaded
                </h3>
                <p style={{ fontSize: "13px", color: "var(--ink-secondary)", maxWidth: "440px" }}>
                  Click below to resolve the complete multi-tiered configuration with parent inheritance and runtime parameters.
                </p>
                <button
                  onClick={handleFetchResolved}
                  disabled={isLoadingResolved}
                  className="btn-primary"
                  style={{ fontSize: "12.5px", gap: "6px" }}
                >
                  {isLoadingResolved ? <RotateCw size={14} className="spin" /> : <Eye size={14} />}
                  Resolve Effective Configuration
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REGISTER CAPABILITY MODAL */}
      {showRegisterModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
          }}
        >
          <div
            className="prism-card"
            style={{
              width: "100%",
              maxWidth: "560px",
              background: "var(--bg-elevated)",
              borderRadius: "14px",
              border: "1px solid var(--border-lit-edge)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              overflow: "hidden"
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "var(--prism-gradient)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff"
                  }}
                >
                  <Plus size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink-primary)" }}>
                    Register Connector Capability
                  </h3>
                  <span style={{ fontSize: "12px", color: "var(--ink-tertiary)" }}>
                    Read-only microkernel HTTP operation
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="btn-ghost"
                style={{ padding: "6px", borderRadius: "6px" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleRegisterPlugin} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div
                style={{
                  padding: "10px 14px",
                  background: "var(--bg-card)",
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "12px",
                  color: "var(--ink-secondary)"
                }}
              >
                <Info size={16} color="var(--prism-teal)" />
                <span>
                  Endpoints and credentials stay securely managed inside Connector Instances. This registers the semantic tool capability.
                </span>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Plugin ID (unique lowercase key)
                </label>
                <input
                  type="text"
                  placeholder="e.g. datadog_metrics"
                  value={draft.id}
                  onChange={(e) => setDraft({ ...draft, id: e.target.value })}
                  className="prism-input mono"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Datadog APM & Metrics"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="prism-input"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                    Operation ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. query_metrics"
                    value={draft.operation}
                    onChange={(e) => setDraft({ ...draft, operation: e.target.value })}
                    className="prism-input mono"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                    Capability Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. observability.query"
                    value={draft.capability}
                    onChange={(e) => setDraft({ ...draft, capability: e.target.value })}
                    className="prism-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Relative API Path
                </label>
                <input
                  type="text"
                  placeholder="e.g. /api/v1/query"
                  value={draft.path}
                  onChange={(e) => setDraft({ ...draft, path: e.target.value })}
                  className="prism-input mono"
                  required
                />
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "8px",
                  paddingTop: "14px",
                  borderTop: "1px solid var(--border-subtle)"
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="btn-ghost"
                  style={{ fontSize: "12.5px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering || Object.values(draft).some((v) => !v.trim())}
                  className="btn-primary"
                  style={{ fontSize: "12.5px", gap: "6px" }}
                >
                  {isRegistering ? <RotateCw size={14} className="spin" /> : <Plus size={14} />}
                  Register Capability
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
