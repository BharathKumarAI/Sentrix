import React, { useState, useEffect, useMemo } from "react";
import {
  Cpu,
  Server,
  Layers,
  Wrench,
  ShieldCheck,
  ShieldAlert,
  PlayCircle,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Sliders,
  Sparkles,
  Zap,
  Terminal,
  Database,
  ExternalLink,
  ChevronRight,
  Info,
  DollarSign,
  Clock,
  Radio,
  BookOpen,
  Filter,
  Check,
  X
} from "lucide-react";
import {
  fetchHarnessPlugins,
  toggleHarnessPlugin,
  configureHarnessPlugin,
  testHarnessPlugin,
  fetchHarnessModes,
  switchHarnessMode,
  fetchHarnessStats,
  fetchHarnessFinOpsSummary,
  getHarnessEventsEventSource
} from "../api/client";
import { RCAWorkbench } from "../components/RCAWorkbench";

export function AdminHarnessPluginsPage() {
  const [activeView, setActiveView] = useState("plugins"); // "plugins" | "rca_workbench"
  const [plugins, setPlugins] = useState([]);
  const [stats, setStats] = useState(null);
  const [modesData, setModesData] = useState({ active_mode: "sre_triage", modes: [] });
  const [finops, setFinops] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  // Filters
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, enabled, disabled

  // Live action states
  const [testingPluginId, setTestingPluginId] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [selectedConfigPlugin, setSelectedConfigPlugin] = useState(null);
  const [configDraft, setConfigDraft] = useState({});
  const [savingConfig, setSavingConfig] = useState(false);

  // Live SSE events
  const [liveEvents, setLiveEvents] = useState([]);
  const [showEventStream, setShowEventStream] = useState(true);

  // Initial load
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pluginsRes, statsRes, modesRes, finopsRes] = await Promise.all([
        fetchHarnessPlugins(),
        fetchHarnessStats(),
        fetchHarnessModes(),
        fetchHarnessFinOpsSummary()
      ]);
      setPlugins(Array.isArray(pluginsRes) ? pluginsRes : []);
      setStats(statsRes || null);
      setModesData(modesRes || { active_mode: "sre_triage", modes: [] });
      setFinops(finopsRes || null);
    } catch (err) {
      console.error("Failed to load harness data", err);
      setError(err.message || "Failed to load harness data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Setup SSE live stream
    let es;
    try {
      es = getHarnessEventsEventSource();
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setLiveEvents((prev) => [data, ...prev.slice(0, 30)]);
        } catch (err) {
          // ignore ping
        }
      };
      es.onerror = () => {
        // SSE silent retry
      };
    } catch (e) {
      console.warn("SSE connection error", e);
    }

    return () => {
      if (es) es.close();
    };
  }, []);

  // Mode switcher handler
  const handleSwitchMode = async (modeKey) => {
    try {
      await switchHarnessMode(modeKey);
      setModesData((prev) => ({
        ...prev,
        active_mode: modeKey,
        modes: prev.modes.map((m) => ({ ...m, is_active: m.key === modeKey }))
      }));
      // Refresh stats
      const newStats = await fetchHarnessStats();
      setStats(newStats);
    } catch (err) {
      alert("Failed to switch harness mode: " + (err.message || err));
    }
  };

  // Toggle plugin handler (optimistic)
  const handleTogglePlugin = async (pluginId, currentStatus) => {
    const nextEnabled = currentStatus !== "ENABLED";
    setPlugins((prev) =>
      prev.map((p) => (p.id === pluginId ? { ...p, status: nextEnabled ? "ENABLED" : "DISABLED" } : p))
    );
    try {
      const updated = await toggleHarnessPlugin(pluginId, nextEnabled);
      setPlugins((prev) => prev.map((p) => (p.id === pluginId ? updated : p)));
      const newStats = await fetchHarnessStats();
      setStats(newStats);
    } catch (err) {
      // Revert on error
      setPlugins((prev) =>
        prev.map((p) => (p.id === pluginId ? { ...p, status: currentStatus } : p))
      );
      alert("Toggle failed: " + (err.message || err));
    }
  };

  // Run self-test probe
  const handleRunSelfTest = async (pluginId) => {
    setTestingPluginId(pluginId);
    try {
      const res = await testHarnessPlugin(pluginId);
      setTestResults((prev) => ({ ...prev, [pluginId]: res }));
      // refresh stats
      const newStats = await fetchHarnessStats();
      setStats(newStats);
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [pluginId]: { healthy: false, details: err.message || "Test probe failed", latency_ms: 0 }
      }));
    } finally {
      setTestingPluginId(null);
    }
  };

  // Open config modal
  const handleOpenConfig = (plugin) => {
    setSelectedConfigPlugin(plugin);
    setConfigDraft(plugin.active_config ? { ...plugin.active_config } : {});
  };

  // Save config draft
  const handleSaveConfig = async () => {
    if (!selectedConfigPlugin) return;
    setSavingConfig(true);
    try {
      const updated = await configureHarnessPlugin(selectedConfigPlugin.id, configDraft);
      setPlugins((prev) =>
        prev.map((p) => (p.id === selectedConfigPlugin.id ? updated : p))
      );
      setSelectedConfigPlugin(null);
    } catch (err) {
      alert("Failed to update config: " + (err.message || err));
    } finally {
      setSavingConfig(false);
    }
  };

  // Filter plugins
  const filteredPlugins = useMemo(() => {
    return plugins.filter((p) => {
      if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
      if (statusFilter === "enabled" && p.status !== "ENABLED") return false;
      if (statusFilter === "disabled" && p.status === "ENABLED") return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(query);
        const matchDesc = (p.description || "").toLowerCase().includes(query);
        const matchCap = (p.capabilities || []).some((c) => c.toLowerCase().includes(query));
        const matchTags = (p.tags || []).some((t) => t.toLowerCase().includes(query));
        return matchName || matchDesc || matchCap || matchTags;
      }
      return true;
    });
  }, [plugins, selectedCategory, statusFilter, searchQuery]);

  // Category tab definitions
  const categories = [
    { key: "all", label: "All Plugins", icon: Layers },
    { key: "tool", label: "Tools & Connectors", icon: Wrench, count: stats?.categories?.tool || 0 },
    { key: "model", label: "Models (LLMs)", icon: Cpu, count: stats?.categories?.model || 0 },
    { key: "skill", label: "Skills & Playbooks", icon: Sparkles, count: stats?.categories?.skill || 0 },
    { key: "sandbox", label: "Sandboxes", icon: Terminal, count: stats?.categories?.sandbox || 0 },
    { key: "evaluator", label: "Evaluators & Guards", icon: ShieldCheck, count: stats?.categories?.evaluator || 0 },
    { key: "memory", label: "Memory & State", icon: Database, count: stats?.categories?.memory || 0 },
    { key: "hook", label: "Hooks & Governance", icon: Sliders, count: stats?.categories?.hook || 0 }
  ];

  const getCategoryColor = (cat) => {
    switch (cat) {
      case "tool":
        return { badge: "badge-teal", color: "var(--prism-teal)" };
      case "model":
        return { badge: "badge-purple", color: "var(--prism-purple)" };
      case "skill":
        return { badge: "badge-magenta", color: "var(--prism-pink)" };
      case "sandbox":
        return { badge: "badge-amber", color: "#f59e0b" };
      case "evaluator":
        return { badge: "badge-blue", color: "#3b82f6" };
      case "memory":
        return { badge: "badge-cyan", color: "#06b6d4" };
      case "hook":
        return { badge: "badge-crimson", color: "var(--prism-crimson)" };
      default:
        return { badge: "badge-neutral", color: "var(--ink-secondary)" };
    }
  };

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
            <Zap size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                AGENT FRAMEWORK • EXTENSIBLE HARNESS
              </span>
              <span className="badge badge-teal">Google ADK 2.8.0</span>
              <span className="badge badge-magenta">FinOps Governed</span>
              <span className="badge badge-purple">Plugin Boundary</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Agent Harness & Plugin Hub
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px", maxWidth: "800px" }}>
              Composable runtime: no privileged core. Every connector, skill, model router, execution sandbox, evaluator, and write-lock gate is an extensible, hot-swappable plugin backed by PostgreSQL.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => setShowEventStream(!showEventStream)}
            className="prism-btn-ghost"
            style={{
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              borderColor: showEventStream ? "var(--prism-teal)" : "var(--border-subtle)",
              color: showEventStream ? "var(--prism-teal)" : "var(--ink-secondary)"
            }}
          >
            <Radio size={15} className={showEventStream ? "pulsing-glow" : ""} />
            {showEventStream ? "Live Event Stream (ON)" : "Live Event Stream (OFF)"}
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="prism-btn-ghost"
            style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} />
            Refresh Registry
          </button>
        </div>
      </div>

      {/* Global Harness KPIs & FinOps Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        {/* Metric 1: Mounted Plugins */}
        <div className="prism-card" style={{ padding: "20px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Mounted Plugins
            </span>
            <Layers size={18} color="var(--prism-purple)" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "12px" }}>
            <span style={{ fontSize: "32px", fontWeight: "800", color: "var(--ink-primary)" }}>
              {stats?.total_plugins || plugins.length}
            </span>
            <span style={{ fontSize: "13px", color: "var(--prism-teal)", fontWeight: "600" }}>
              {stats?.enabled_plugins || 0} active
            </span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--ink-tertiary)", marginTop: "6px" }}>
            Across {Object.keys(stats?.categories || {}).length || 7} plugin categories
          </div>
        </div>

        {/* Metric 2: Active Mode */}
        <div className="prism-card" style={{ padding: "20px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Active Harness Mode
            </span>
            <Activity size={18} color="var(--prism-teal)" />
          </div>
          <div style={{ marginTop: "12px" }}>
            <span className="badge badge-teal" style={{ fontSize: "14px", fontWeight: "700", padding: "6px 12px" }}>
              {(modesData.active_mode || "sre_triage").replace("_", " ").toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--ink-tertiary)", marginTop: "10px" }}>
            Runtime policy & permission boundary
          </div>
        </div>

        {/* Metric 3: FinOps Spend */}
        <div className="prism-card" style={{ padding: "20px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              FinOps Cumulative Spend
            </span>
            <DollarSign size={18} color="#10b981" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "12px" }}>
            <span style={{ fontSize: "32px", fontWeight: "800", color: "var(--ink-primary)" }}>
              {finops?.total_cost_usd != null ? `$${finops.total_cost_usd.toFixed(4)}` : "—"}
            </span>
            <span style={{ fontSize: "12px", color: "var(--ink-tertiary)" }}>USD</span>
          </div>
          <div style={{ fontSize: "12px", color: "#10b981", marginTop: "6px", fontWeight: "600" }}>
            Saved ${finops?.estimated_manual_sre_cost_saved_usd != null ? finops.estimated_manual_sre_cost_saved_usd.toFixed(2) : "0.00"} vs manual SRE
          </div>
        </div>

        {/* Metric 4: CAPO (Cost per Accepted Outcome) */}
        <div className="prism-card" style={{ padding: "20px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              CAPO (Cost / Outcome)
            </span>
            <ShieldCheck size={18} color="var(--prism-pink)" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "12px" }}>
            <span style={{ fontSize: "32px", fontWeight: "800", color: "var(--prism-pink)" }}>
              {finops?.cost_per_accepted_outcome_usd != null ? `$${finops.cost_per_accepted_outcome_usd.toFixed(4)}` : "—"}
            </span>
            <span style={{ fontSize: "12px", color: "var(--ink-tertiary)" }}>/ accepted incident</span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--ink-tertiary)", marginTop: "6px" }}>
            Cost per outcome efficiency rubric
          </div>
        </div>
      </div>

      {/* Primary View Switcher: Plugins Microkernel vs RCA Workbench */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px", marginTop: "4px" }}>
        <button
          onClick={() => setActiveView("plugins")}
          className={`prism-btn-ghost ${activeView === "plugins" ? "active" : ""}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "700",
            padding: "10px 20px",
            borderRadius: "8px",
            background: activeView === "plugins" ? "rgba(13, 148, 136, 0.12)" : "transparent",
            borderColor: activeView === "plugins" ? "var(--prism-teal)" : "var(--border-subtle)",
            color: activeView === "plugins" ? "var(--prism-teal)" : "var(--ink-secondary)"
          }}
        >
          <Layers size={17} />
          Harness Plugin Registry ({plugins.length})
        </button>

        <button
          onClick={() => setActiveView("rca_workbench")}
          className={`prism-btn-ghost ${activeView === "rca_workbench" ? "active" : ""}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "700",
            padding: "10px 20px",
            borderRadius: "8px",
            background: activeView === "rca_workbench" ? "rgba(99, 102, 241, 0.12)" : "transparent",
            borderColor: activeView === "rca_workbench" ? "var(--prism-purple)" : "var(--border-subtle)",
            color: activeView === "rca_workbench" ? "var(--prism-purple)" : "var(--ink-secondary)"
          }}
        >
          <Sparkles size={17} />
          RCA Reasoners & Context Budget Workbench
          <span className="badge badge-teal" style={{ fontSize: "10px", marginLeft: "4px" }}>6 ENGINES</span>
        </button>
      </div>

      {activeView === "rca_workbench" ? (
        <RCAWorkbench />
      ) : (
        <>
          {/* Operational Mode Switcher Bar */}
          <div className="prism-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Zap size={18} color="var(--prism-teal)" />
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink-primary)" }}>
                    Harness Execution Mode Selector
                  </h3>
                </div>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Adjusts agent behavioral guardrails, write-lock policies, and active plugin bundles on the fly.
            </p>
          </div>
          <span className="badge badge-neutral" style={{ fontSize: "12px" }}>
            Execution Mode Presets
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
          {modesData.modes.map((mode) => {
            const isActive = mode.is_active || modesData.active_mode === mode.key;
            return (
              <div
                key={mode.key}
                onClick={() => handleSwitchMode(mode.key)}
                style={{
                  padding: "16px 20px",
                  borderRadius: "10px",
                  border: isActive ? "2px solid var(--prism-teal)" : "1px solid var(--border-subtle)",
                  background: isActive ? "rgba(13, 148, 136, 0.08)" : "var(--bg-card)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: isActive ? "var(--prism-teal)" : "var(--ink-primary)" }}>
                    {mode.name}
                  </span>
                  <span className={`badge ${mode.badge_color}`} style={{ fontSize: "10px", fontWeight: "700" }}>
                    {mode.badge}
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--ink-secondary)", lineHeight: "1.4" }}>
                  {mode.description}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                  <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                    {mode.default_plugins?.length || 0} plugins bound
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: isActive ? "var(--prism-teal)" : "var(--ink-tertiary)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    {isActive ? <><CheckCircle2 size={12} color="var(--prism-teal)" /> CURRENT ACTIVE</> : "Click to Activate →"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time SSE Lifecycle Event Drawer */}
      {showEventStream && (
        <div className="prism-card" style={{ padding: "20px 24px", background: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Radio size={16} color="var(--prism-teal)" className="pulsing-glow" />
              <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--ink-primary)" }}>
                Live Harness Lifecycle & Spatiotemporal Hooks Stream
              </span>
              <span className="badge badge-teal" style={{ fontSize: "10px" }}>CONNECTED</span>
            </div>
            <span style={{ fontSize: "12px", color: "var(--ink-tertiary)" }}>
              {liveEvents.length} events received
            </span>
          </div>

          <div style={{
            maxHeight: "140px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "12px"
          }}>
            {liveEvents.length === 0 ? (
              <div style={{ color: "var(--ink-tertiary)", fontStyle: "italic" }}>
                Listening for plugin mount, test probe, mode switch, and write-lock proposal events...
              </div>
            ) : (
              liveEvents.map((evt, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 10px", borderRadius: "6px", background: "var(--bg-card-hover)", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ color: "var(--ink-tertiary)", minWidth: "75px" }}>
                    {new Date(evt.timestamp || Date.now()).toLocaleTimeString()}
                  </span>
                  <span className="badge badge-magenta" style={{ fontSize: "10px", minWidth: "160px", textAlign: "center" }}>
                    {evt.event_type}
                  </span>
                  <span style={{ color: "var(--prism-teal)", fontWeight: "600" }}>
                    {evt.plugin_id || "harness"}
                  </span>
                  <span style={{ color: "var(--ink-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {JSON.stringify(evt.payload || {})}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Category Tabs & Filter Toolbar */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "4px",
          borderBottom: "1px solid var(--border-subtle)"
        }}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderRadius: "8px 8px 0 0",
                  border: "none",
                  borderBottom: isSelected ? "2px solid var(--prism-teal)" : "2px solid transparent",
                  background: isSelected ? "rgba(13, 148, 136, 0.12)" : "transparent",
                  color: isSelected ? "var(--prism-teal)" : "var(--ink-secondary)",
                  fontWeight: isSelected ? "700" : "500",
                  fontSize: "13px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease"
                }}
              >
                <Icon size={16} />
                <span>{cat.label}</span>
                {cat.count !== undefined && (
                  <span style={{
                    fontSize: "11px",
                    padding: "2px 6px",
                    borderRadius: "10px",
                    background: isSelected ? "var(--prism-teal)" : "rgba(255,255,255,0.08)",
                    color: isSelected ? "#fff" : "var(--ink-tertiary)"
                  }}>
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search and Secondary Filter */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ position: "relative", minWidth: "320px", flex: 1, maxWidth: "500px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--ink-tertiary)" }} />
            <input
              type="text"
              placeholder="Search plugins by name, capability, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="prism-input"
              style={{ paddingLeft: "36px", width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Filter size={14} color="var(--ink-tertiary)" />
              <span style={{ fontSize: "12px", color: "var(--ink-tertiary)" }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="prism-input"
                style={{ padding: "6px 12px", fontSize: "12px" }}
              >
                <option value="all">All States</option>
                <option value="enabled">Enabled Only</option>
                <option value="disabled">Disabled Only</option>
              </select>
            </div>
            <span style={{ fontSize: "13px", color: "var(--ink-tertiary)" }}>
              Showing {filteredPlugins.length} of {plugins.length} plugins
            </span>
          </div>
        </div>
      </div>

      {/* Plugins Grid */}
      {loading ? (
        <div className="prism-card" style={{ padding: "60px", textAlign: "center", color: "var(--ink-tertiary)" }}>
          <RefreshCw size={28} className="spin" style={{ margin: "0 auto 16px" }} />
          Loading Agent Harness Plugin Registry...
        </div>
      ) : filteredPlugins.length === 0 ? (
        <div className="prism-card" style={{ padding: "60px", textAlign: "center", color: "var(--ink-tertiary)" }}>
          No plugins match your current filters.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "20px" }}>
          {filteredPlugins.map((plugin) => {
            const isEnabled = plugin.status === "ENABLED";
            const categoryMeta = getCategoryColor(plugin.category);
            const isTesting = testingPluginId === plugin.id;
            const probe = testResults[plugin.id];

            return (
              <div
                key={plugin.id}
                className="prism-card"
                style={{
                  padding: "22px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  opacity: isEnabled ? 1 : 0.65,
                  border: isEnabled ? "1px solid var(--border-subtle)" : "1px dashed var(--border-subtle)",
                  transition: "all 0.2s ease"
                }}
              >
                <div>
                  {/* Top Category & Status Toggle */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className={`badge ${categoryMeta.badge}`} style={{ fontSize: "11px", fontWeight: "700" }}>
                        {plugin.category.toUpperCase()}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                        v{plugin.version}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: isEnabled ? "var(--prism-teal)" : "var(--ink-tertiary)" }}>
                        {isEnabled ? "ENABLED" : "DISABLED"}
                      </span>
                      <button
                        onClick={() => handleTogglePlugin(plugin.id, plugin.status)}
                        style={{
                          width: "38px",
                          height: "22px",
                          borderRadius: "12px",
                          background: isEnabled ? "var(--prism-teal)" : "rgba(255, 255, 255, 0.15)",
                          border: "none",
                          cursor: "pointer",
                          position: "relative",
                          padding: "2px",
                          transition: "background 0.2s"
                        }}
                      >
                        <div
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            background: "#fff",
                            transform: isEnabled ? "translateX(16px)" : "translateX(0)",
                            transition: "transform 0.2s"
                          }}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Plugin Title & Author */}
                  <h4 style={{ fontSize: "17px", fontWeight: "700", color: "var(--ink-primary)", marginBottom: "4px" }}>
                    {plugin.name}
                  </h4>
                  <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", marginBottom: "10px" }}>
                    By {plugin.author} • ID: <code style={{ fontSize: "10px" }}>{plugin.id}</code>
                  </div>

                  <p style={{ fontSize: "13px", color: "var(--ink-secondary)", lineHeight: "1.45", marginBottom: "16px" }}>
                    {plugin.description}
                  </p>

                  {/* Capabilities Tags */}
                  {plugin.capabilities && plugin.capabilities.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                      {plugin.capabilities.slice(0, 4).map((cap, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: "11px",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            background: "var(--bg-card-hover)",
                            color: "var(--ink-secondary)",
                            border: "1px solid var(--border-subtle)",
                            fontWeight: "500"
                          }}
                        >
                          {cap}
                        </span>
                      ))}
                      {plugin.capabilities.length > 4 && (
                        <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", alignSelf: "center" }}>
                          +{plugin.capabilities.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* FinOps & Latency Snapshot */}
                  {plugin.finops && (
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      marginBottom: "16px",
                      fontSize: "11px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={12} color="var(--ink-tertiary)" />
                        <span style={{ color: "var(--ink-tertiary)" }}>Avg:</span>
                        <span style={{ color: "var(--ink-primary)", fontWeight: "600" }}>
                          {plugin.finops.avg_latency_ms}ms
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <DollarSign size={12} color="var(--ink-tertiary)" />
                        <span style={{ color: "var(--ink-tertiary)" }}>Tier:</span>
                        <span style={{ color: "var(--prism-teal)", fontWeight: "600" }}>
                          {plugin.finops.cost_tier}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ color: "var(--ink-tertiary)" }}>Calls:</span>
                        <span style={{ color: "var(--ink-primary)", fontWeight: "600" }}>
                          {plugin.finops.total_invocations}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Diagnostic Probe Result (Inline Banner) */}
                  {probe && (
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: "6px",
                        background: probe.healthy ? "rgba(16, 185, 129, 0.1)" : "rgba(225, 29, 72, 0.1)",
                        border: probe.healthy ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(225, 29, 72, 0.3)",
                        marginBottom: "16px",
                        fontSize: "11px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px"
                      }}
                    >
                      {probe.healthy ? (
                        <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: "2px" }} />
                      ) : (
                        <XCircle size={14} color="var(--prism-crimson)" style={{ flexShrink: 0, marginTop: "2px" }} />
                      )}
                      <div>
                        <div style={{ fontWeight: "700", color: probe.healthy ? "#10b981" : "var(--prism-crimson)" }}>
                          {probe.healthy ? `Probe Passed (${probe.latency_ms}ms)` : "Probe Failed"}
                        </div>
                        <div style={{ color: "var(--ink-secondary)", marginTop: "2px", lineHeight: "1.3" }}>
                          {probe.details}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div style={{
                  display: "flex",
                  gap: "8px",
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "14px",
                  marginTop: "8px"
                }}>
                  <button
                    onClick={() => handleRunSelfTest(plugin.id)}
                    disabled={isTesting}
                    className="prism-btn-ghost"
                    style={{
                      flex: 1,
                      padding: "6px 12px",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <Activity size={13} className={isTesting ? "spin" : ""} color="var(--prism-teal)" />
                    {isTesting ? "Probing..." : "Self-Test"}
                  </button>

                  <button
                    onClick={() => handleOpenConfig(plugin)}
                    className="prism-btn-ghost"
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <Sliders size={13} color="var(--ink-secondary)" />
                    Configure
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* Dynamic Plugin Configuration Modal */}
      {selectedConfigPlugin && (
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
            zIndex: 1000,
            padding: "20px"
          }}
        >
          <div
            className="prism-card"
            style={{
              width: "100%",
              maxWidth: "580px",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span className="badge badge-teal" style={{ fontSize: "11px", fontWeight: "700", marginBottom: "6px" }}>
                  {selectedConfigPlugin.category.toUpperCase()} PLUGIN CONFIG
                </span>
                <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--ink-primary)" }}>
                  {selectedConfigPlugin.name}
                </h3>
                <p style={{ fontSize: "12px", color: "var(--ink-tertiary)", marginTop: "2px" }}>
                  Plugin parameter schema & dynamic override
                </p>
              </div>
              <button
                onClick={() => setSelectedConfigPlugin(null)}
                style={{ background: "transparent", border: "none", color: "var(--ink-tertiary)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxHeight: "400px", overflowY: "auto" }}>
              {selectedConfigPlugin.config_schema && Object.keys(selectedConfigPlugin.config_schema).length > 0 ? (
                Object.entries(selectedConfigPlugin.config_schema).map(([key, schema]) => (
                  <div key={key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink-secondary)" }}>
                      {key} <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>({schema.type})</span>
                    </label>
                    {schema.type === "boolean" ? (
                      <select
                        value={configDraft[key] === undefined ? schema.default : configDraft[key] ? "true" : "false"}
                        onChange={(e) => setConfigDraft({ ...configDraft, [key]: e.target.value === "true" })}
                        className="prism-input"
                      >
                        <option value="true">True (Enabled)</option>
                        <option value="false">False (Disabled)</option>
                      </select>
                    ) : schema.type === "number" || schema.type === "integer" ? (
                      <input
                        type="number"
                        value={configDraft[key] !== undefined ? configDraft[key] : schema.default}
                        onChange={(e) => setConfigDraft({ ...configDraft, [key]: parseFloat(e.target.value) || 0 })}
                        className="prism-input"
                      />
                    ) : (
                      <input
                        type="text"
                        value={configDraft[key] !== undefined ? configDraft[key] : schema.default || ""}
                        onChange={(e) => setConfigDraft({ ...configDraft, [key]: e.target.value })}
                        className="prism-input"
                      />
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--ink-tertiary)" }}>
                  No configurable parameters defined for this plugin.
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--border-subtle)", paddingTop: "16px" }}>
              <button
                onClick={() => setSelectedConfigPlugin(null)}
                className="prism-btn-ghost"
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="prism-btn-primary"
                style={{ padding: "8px 20px", fontSize: "13px" }}
              >
                {savingConfig ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
