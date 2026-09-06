import React, { useState, useEffect, useMemo } from "react";
import {
  Database,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  Search,
  Sliders,
  Shield,
  Zap,
  Settings,
  Globe,
  Activity,
  Server,
  Star,
  ArrowRight,
  Lock,
  Plus,
  Trash2,
  Edit3,
  Save,
  Filter,
  Check,
  RefreshCw,
  Code2,
  HelpCircle,
  X,
  ExternalLink,
  Tag
} from "lucide-react";
import {
  fetchAdminModelProviders,
  testAdminModelProvider,
  updateAdminModelProvider,
  createAdminModelProvider,
  deleteAdminModelProvider,
  createAdminModel,
  deleteAdminModel,
  fetchModelCatalog,
  fetchStageModelConfigs,
  updateStageModelConfig,
  batchUpdateStageModelConfigs,
  setGlobalDefaultModel,
  resetStageModelDefaults,
  testStageModelExecution
} from "../api/client";

export function AdminModelProvidersPage() {
  // Available models is now the FIRST tab as requested by the user!
  const [activeTab, setActiveTab] = useState("models"); // "models" | "stages" | "benchmarks"
  const [providers, setProviders] = useState([]);
  const [stages, setStages] = useState([]);
  const [defaultModel, setDefaultModel] = useState(null);
  const [modelCatalog, setModelCatalog] = useState([]);
  const [routingStrategies, setRoutingStrategies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dirtyStages, setDirtyStages] = useState(new Set());

  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [capabilityFilter, setCapabilityFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");

  // Live Test states
  const [testingStage, setTestingStage] = useState(null);
  const [stageTestResults, setStageTestResults] = useState({});
  const [testingProvider, setTestingProvider] = useState(null);
  const [providerTestResults, setProviderTestResults] = useState({});
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState(null);

  // Toast / notification
  const [toastMessage, setToastMessage] = useState(null);

  // Modals: Add Model
  const [isAddModelModalOpen, setIsAddModelModalOpen] = useState(false);
  const [modelFormData, setModelFormData] = useState({
    provider_id: "",
    name: "",
    id: "",
    context_window: "200,000 tokens",
    input_cost: "$1.00 / 1M",
    output_cost: "$4.00 / 1M",
    latency_avg: "300ms",
    capabilities: "Deep Reasoning, Tool Calling",
    is_default: false
  });

  // Modals: Add/Edit Provider
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [providerFormData, setProviderFormData] = useState({
    name: "",
    provider_key: "",
    role: "",
    quota_rpm: 1000,
    status: "CONNECTED",
    description: "",
    endpoint_url: "",
    api_key: ""
  });

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [provData, stageData, catalogData] = await Promise.all([
        fetchAdminModelProviders(),
        fetchStageModelConfigs(),
        fetchModelCatalog()
      ]);

      if (Array.isArray(provData)) {
        setProviders(provData);
        if (provData.length > 0 && !modelFormData.provider_id) {
          setModelFormData((prev) => ({ ...prev, provider_id: provData[0].id }));
        }
      }
      if (stageData && Array.isArray(stageData.stages)) {
        setStages(stageData.stages);
        setDefaultModel(stageData.default_model);
        if (Array.isArray(stageData.routing_strategies)) {
          setRoutingStrategies(stageData.routing_strategies);
        }
      }
      if (Array.isArray(catalogData)) {
        setModelCatalog(catalogData);
      }
    } catch (err) {
      console.error("Failed to load model governance data:", err);
      showToast("Error loading model configurations: " + (err.message || "Unknown error"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handle stage modification in local state
  const handleStageChange = (stageKey, field, value) => {
    setStages((prev) =>
      prev.map((s) => {
        if (s.stage_key !== stageKey) return s;

        const updated = { ...s, [field]: value };
        if (field === "primary_model_id") {
          const foundModel = modelCatalog.find((m) => m.id === value);
          if (foundModel) {
            updated.primary_model_name = foundModel.name;
            updated.provider_id = foundModel.provider_id;
            updated.provider_name = foundModel.provider_name;
          }
        }
        if (field === "fallback_model_id") {
          const foundModel = modelCatalog.find((m) => m.id === value);
          if (foundModel) {
            updated.fallback_model_name = foundModel.name;
            updated.fallback_provider_id = foundModel.provider_id;
            updated.fallback_provider_name = foundModel.provider_name;
          }
        }
        return updated;
      })
    );
    setDirtyStages((prev) => new Set(prev).add(stageKey));
  };

  // Save modified stages
  const handleSaveStages = async () => {
    setIsSaving(true);
    try {
      const stagesToSave = stages.filter((s) => dirtyStages.has(s.stage_key));
      if (stagesToSave.length === 0) {
        showToast("No changes to save.", "info");
        setIsSaving(false);
        return;
      }
      await batchUpdateStageModelConfigs(stagesToSave);
      setDirtyStages(new Set());
      showToast(`Successfully saved ${stagesToSave.length} stage configuration(s)!`);
      loadAllData();
    } catch (err) {
      console.error("Failed to save stages:", err);
      showToast("Failed to save stage configurations: " + err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to Enterprise Defaults
  const handleResetDefaults = async () => {
    if (!window.confirm("Are you sure you want to reset all stages to enterprise best practice defaults?")) {
      return;
    }
    setIsLoading(true);
    try {
      await resetStageModelDefaults();
      setDirtyStages(new Set());
      showToast("Stages reset to enterprise defaults.");
      await loadAllData();
    } catch (err) {
      showToast("Failed to reset defaults: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Set Global Default Model
  const handleSetGlobalDefault = async (modelId, providerId, modelName, providerName) => {
    try {
      await setGlobalDefaultModel({
        model_id: modelId,
        provider_id: providerId,
        model_name: modelName,
        provider_name: providerName
      });
      showToast(`'${modelName}' is now designated as the Global Default Model.`);
      await loadAllData();
    } catch (err) {
      showToast("Failed to set default model: " + err.message, "error");
    }
  };

  // Test Stage Execution Probe
  const handleTestStage = async (stageKey) => {
    setTestingStage(stageKey);
    try {
      const res = await testStageModelExecution(stageKey);
      setStageTestResults((prev) => ({
        ...prev,
        [stageKey]: {
          status: res.status,
          latency: res.latency,
          resolvedModel: res.resolved_model,
          tokenThroughput: res.token_throughput,
          message: res.message
        }
      }));
      showToast(`Stage '${res.stage_name}' probe successful (${res.latency})!`);
    } catch (err) {
      setStageTestResults((prev) => ({
        ...prev,
        [stageKey]: {
          status: "ERROR",
          latency: "Timeout",
          message: err.message || "Stage probe failed."
        }
      }));
      showToast(`Stage probe failed: ${err.message}`, "error");
    } finally {
      setTestingStage(null);
    }
  };

  // Test Provider Socket
  const handleTestProvider = async (prov) => {
    setTestingProvider(prov.id);
    try {
      const res = await testAdminModelProvider(prov.id);
      setProviderTestResults((prev) => ({
        ...prev,
        [prov.id]: {
          status: res.status,
          latency: res.latency,
          message: res.message
        }
      }));
      showToast(`Provider '${prov.name}' handshake verified (${res.latency})`);
    } catch (err) {
      setProviderTestResults((prev) => ({
        ...prev,
        [prov.id]: {
          status: "ERROR",
          latency: "Timeout",
          message: err.message || "Handshake failed."
        }
      }));
      showToast(`Handshake failed for ${prov.name}`, "error");
    } finally {
      setTestingProvider(null);
    }
  };

  // Delete Model Handler
  const handleDeleteModel = async (model) => {
    if (!window.confirm(`Are you sure you want to remove model '${model.name}' from the catalog?`)) {
      return;
    }
    try {
      await deleteAdminModel(model.id);
      showToast(`Model '${model.name}' deleted successfully.`);
      await loadAllData();
    } catch (err) {
      showToast("Failed to delete model: " + err.message, "error");
    }
  };

  // Add Model Submit
  const handleSaveModelForm = async (e) => {
    e.preventDefault();
    try {
      const capList = modelFormData.capabilities
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      await createAdminModel({
        provider_id: modelFormData.provider_id,
        name: modelFormData.name,
        id: modelFormData.id || modelFormData.name.toLowerCase().replace(/\s+/g, "-"),
        context_window: modelFormData.context_window,
        input_cost: modelFormData.input_cost,
        output_cost: modelFormData.output_cost,
        latency_avg: modelFormData.latency_avg,
        capabilities: capList,
        is_default: modelFormData.is_default
      });

      showToast(`Model '${modelFormData.name}' added to available models catalog!`);
      setIsAddModelModalOpen(false);
      setModelFormData({
        provider_id: providers[0]?.id || "",
        name: "",
        id: "",
        context_window: "200,000 tokens",
        input_cost: "$1.00 / 1M",
        output_cost: "$4.00 / 1M",
        latency_avg: "300ms",
        capabilities: "Deep Reasoning, Tool Calling",
        is_default: false
      });
      await loadAllData();
    } catch (err) {
      showToast("Failed to add model: " + err.message, "error");
    }
  };

  // Run Parallel Benchmark
  const handleRunBenchmark = async () => {
    setBenchmarkLoading(true);
    try {
      const probes = providers.map(async (p) => {
        try {
          const res = await testAdminModelProvider(p.id);
          return {
            id: p.id,
            name: p.name,
            role: p.role,
            latencyStr: res.latency,
            latencyMs: parseInt(res.latency) || null,
            status: res.status,
            modelsCount: p.models?.length || 0
          };
        } catch {
          return {
            id: p.id,
            name: p.name,
            role: p.role,
            latencyStr: "Failed",
            latencyMs: 9999,
            status: "ERROR",
            modelsCount: p.models?.length || 0
          };
        }
      });
      const results = await Promise.all(probes);
      results.sort((a, b) => a.latencyMs - b.latencyMs);
      setBenchmarkResults(results);
      showToast("Multi-Provider benchmark completed successfully!");
    } catch (err) {
      showToast("Benchmark error: " + err.message, "error");
    } finally {
      setBenchmarkLoading(false);
    }
  };

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    return modelCatalog.filter((m) => {
      if (providerFilter !== "all" && m.provider_id !== providerFilter) {
        return false;
      }
      const matchesSearch =
        searchQuery === "" ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.provider_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.capabilities && m.capabilities.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())));

      if (!matchesSearch) return false;

      if (capabilityFilter === "reasoning") {
        return m.capabilities?.some((c) => c.toLowerCase().includes("reasoning") || c.toLowerCase().includes("chain"));
      }
      if (capabilityFilter === "fast") {
        return m.capabilities?.some((c) => c.toLowerCase().includes("latency") || c.toLowerCase().includes("triage"));
      }
      if (capabilityFilter === "code") {
        return m.capabilities?.some((c) => c.toLowerCase().includes("code") || c.toLowerCase().includes("sql"));
      }
      if (capabilityFilter === "private") {
        return m.capabilities?.some((c) => c.toLowerCase().includes("egress") || c.toLowerCase().includes("local") || c.toLowerCase().includes("offline"));
      }
      return true;
    });
  }, [modelCatalog, searchQuery, capabilityFilter, providerFilter]);

  // Provider Modal Handlers
  const handleOpenProviderModal = (provider = null) => {
    if (provider) {
      setEditingProvider(provider);
      setProviderFormData({
        name: provider.name,
        provider_key: provider.provider_key,
        role: provider.role,
        quota_rpm: provider.quotaRpm ?? 0,
        status: provider.status,
        description: provider.description || "",
        endpoint_url: provider.credentials?.endpoint_url || "",
        api_key: ""
      });
    } else {
      setEditingProvider(null);
      setProviderFormData({
        name: "",
        provider_key: "",
        role: "",
        quota_rpm: 1000,
        status: "CONNECTED",
        description: "",
        endpoint_url: "",
        api_key: ""
      });
    }
    setIsProviderModalOpen(true);
  };

  const handleSaveProviderForm = async (e) => {
    e.preventDefault();
    try {
      if (editingProvider) {
        await updateAdminModelProvider(editingProvider.id, {
          name: providerFormData.name,
          role: providerFormData.role,
          quota_rpm: parseInt(providerFormData.quota_rpm),
          status: providerFormData.status,
          description: providerFormData.description,
          credentials_json: {
            endpoint_url: providerFormData.endpoint_url,
            ...(providerFormData.api_key ? { api_key: providerFormData.api_key } : {})
          }
        });
        showToast(`Provider '${providerFormData.name}' updated successfully.`);
      } else {
        await createAdminModelProvider({
          provider_key: providerFormData.provider_key || providerFormData.name.toLowerCase().replace(/\s+/g, "_"),
          name: providerFormData.name,
          role: providerFormData.role,
          quota_rpm: parseInt(providerFormData.quota_rpm),
          status: providerFormData.status,
          description: providerFormData.description,
          credentials_json: {
            endpoint_url: providerFormData.endpoint_url,
            api_key: providerFormData.api_key
          },
          models: [
            {
              id: `${providerFormData.name.toLowerCase().replace(/\s+/g, "-")}-primary`,
              name: `${providerFormData.name} Primary Model`,
              context_window: "128,000 tokens",
              input_cost: "$0.50 / 1M",
              output_cost: "$2.00 / 1M",
              latency_avg: "250ms",
              capabilities: ["Custom Endpoint", "Inference"]
            }
          ]
        });
        showToast(`Provider '${providerFormData.name}' registered successfully.`);
      }
      setIsProviderModalOpen(false);
      await loadAllData();
    } catch (err) {
      showToast("Failed to save provider: " + err.message, "error");
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
        boxSizing: "border-box",
        background: "var(--bg-app)",
        color: "var(--ink-primary)"
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "28px",
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            background:
              toastMessage.type === "error"
                ? "var(--accent-rose)"
                : toastMessage.type === "info"
                ? "var(--accent-blue)"
                : "var(--accent-teal)",
            color: "#fff",
            backdropFilter: "blur(8px)"
          }}
        >
          {toastMessage.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMessage.message}</span>
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
              background: "var(--prism-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 0 18px var(--prism-glow)",
              flexShrink: 0
            }}
          >
            <Cpu size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                PLATFORM ADMIN • AI GATEWAY & MODELS
              </span>
              <span className="badge badge-teal" style={{ display: "flex", alignItems: "center", gap: "5px", padding: "3px 8px" }}>
                <CheckCircle2 size={11} />
                {isLoading ? "…" : `${providers.filter((p) => p.status === "CONNECTED").length} Providers Connected`}
              </span>
              <span className="badge badge-magenta" style={{ padding: "3px 8px" }}>
                {modelCatalog.length} Available Models
              </span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "3px 9px",
                  borderRadius: "999px",
                  background: "rgba(59, 130, 246, 0.15)",
                  color: "var(--accent-blue)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontWeight: 600
                }}
              >
                <Star size={11} fill="currentColor" />
                Default: {defaultModel?.primary_model_name || "Gemini 2.5 Pro"}
              </span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Model Governance & Multi-Stage LLM Routing
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Manage available AI models, configure multi-stage pipeline routing, and set the global default model.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => setIsAddModelModalOpen(true)}
            style={{
              fontSize: "12.5px",
              padding: "7px 16px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--prism-gradient)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 0 16px var(--prism-glow)"
            }}
          >
            <Plus size={14} />
            Add Model
          </button>

          <button
            onClick={() => handleOpenProviderModal()}
            className="btn-secondary"
            style={{
              fontSize: "12px",
              padding: "7px 14px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Server size={13} />
            Add Provider
          </button>

          <button
            onClick={handleResetDefaults}
            className="btn-secondary"
            style={{
              fontSize: "12px",
              padding: "7px 14px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
            title="Reset stage configurations to enterprise recommendations"
          >
            <RotateCw size={13} />
            Reset Defaults
          </button>

          {dirtyStages.size > 0 && (
            <button
              onClick={handleSaveStages}
              disabled={isSaving}
              style={{
                fontSize: "12px",
                padding: "7px 16px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 0 16px rgba(16, 185, 129, 0.4)"
              }}
            >
              <Save size={13} />
              {isSaving ? "Saving..." : `Save ${dirtyStages.size} Change(s)`}
            </button>
          )}
        </div>
      </div>

      {/* Global Default Model Highlight Card */}
      <div
        className="prism-card"
        style={{
          padding: "16px 20px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-card)",
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(59, 130, 246, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-blue)"
            }}
          >
            <Star size={22} fill="currentColor" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)" }}>
                Platform Global Default Model:
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "var(--accent-blue)",
                  background: "rgba(59, 130, 246, 0.12)",
                  padding: "2px 10px",
                  borderRadius: "6px"
                }}
              >
                {defaultModel?.primary_model_name || "Gemini 2.5 Pro"}
              </span>
              <span style={{ fontSize: "12px", color: "var(--ink-tertiary)" }}>
                ({defaultModel?.provider_name || "Google Vertex AI / Gemini"})
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Any autonomous SRE triage task without an explicit stage override will route to this model. Fallback:{" "}
              <strong>{defaultModel?.fallback_model_name || "Not configured"}</strong>.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <select
            value={defaultModel?.primary_model_id || "gemini-2.5-pro"}
            onChange={(e) => {
              const m = modelCatalog.find((x) => x.id === e.target.value);
              if (m) {
                handleSetGlobalDefault(m.id, m.provider_id, m.name, m.provider_name);
              }
            }}
            style={{
              padding: "7px 12px",
              borderRadius: "8px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              color: "var(--ink-primary)",
              fontSize: "12.5px",
              fontWeight: 600,
              outline: "none",
              cursor: "pointer"
            }}
          >
            {modelCatalog.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.provider_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Tabs (Available Models is FIRST) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "10px"
        }}
      >
        <button
          onClick={() => setActiveTab("models")}
          style={{
            padding: "8px 18px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: activeTab === "models" ? "var(--bg-elevated)" : "transparent",
            color: activeTab === "models" ? "var(--prism-pink)" : "var(--ink-secondary)",
            border: activeTab === "models" ? "1px solid var(--prism-pink)" : "1px solid transparent",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <Database size={15} />
          Available Models & Catalog
          <span
            style={{
              fontSize: "10.5px",
              background: "rgba(125, 125, 125, 0.15)",
              color: "var(--ink-primary)",
              padding: "1px 6px",
              borderRadius: "10px",
              fontWeight: 700
            }}
          >
            {modelCatalog.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("stages")}
          style={{
            padding: "8px 18px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: activeTab === "stages" ? "var(--bg-elevated)" : "transparent",
            color: activeTab === "stages" ? "var(--prism-pink)" : "var(--ink-secondary)",
            border: activeTab === "stages" ? "1px solid var(--prism-pink)" : "1px solid transparent",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <Layers size={15} />
          Stage-Based Model Routing
          <span
            style={{
              fontSize: "10.5px",
              background: "rgba(125, 125, 125, 0.15)",
              color: "var(--ink-primary)",
              padding: "1px 6px",
              borderRadius: "10px",
              fontWeight: 700
            }}
          >
            {stages.length} Stages
          </span>
        </button>

        <button
          onClick={() => setActiveTab("benchmarks")}
          style={{
            padding: "8px 18px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: activeTab === "benchmarks" ? "var(--bg-elevated)" : "transparent",
            color: activeTab === "benchmarks" ? "var(--accent-teal)" : "var(--ink-secondary)",
            border: activeTab === "benchmarks" ? "1px solid var(--accent-teal)" : "1px solid transparent",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <Activity size={15} />
          Live Latency & Failover Probes
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AVAILABLE MODELS & CATALOG (FIRST TAB)                             */}
      {/* ========================================================================= */}
      {activeTab === "models" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Controls Bar: Search, Filters, Add Model */}
          <div
            className="prism-card"
            style={{
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: "12px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 280px" }}>
              <Search size={16} style={{ color: "var(--ink-tertiary)" }} />
              <input
                type="text"
                placeholder="Search models by name, provider, or capability (e.g. 'Gemini', 'Claude', 'Code')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--ink-primary)",
                  fontSize: "13px",
                  width: "100%"
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{ background: "transparent", border: "none", color: "var(--ink-tertiary)", cursor: "pointer" }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {/* Provider Filter */}
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                style={{
                  padding: "5px 10px",
                  borderRadius: "6px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                  color: "var(--ink-primary)",
                  fontSize: "12px",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="all">All Providers</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Capability Filter Chips */}
              {[
                { id: "all", label: "All Types" },
                { id: "reasoning", label: "Deep Reasoning" },
                { id: "fast", label: "Fast Triage" },
                { id: "code", label: "Code & SQL" },
                { id: "private", label: "Zero-Egress Private" }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setCapabilityFilter(btn.id)}
                  style={{
                    padding: "5px 11px",
                    borderRadius: "6px",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: capabilityFilter === btn.id ? "rgba(236, 72, 153, 0.15)" : "var(--bg-card)",
                    color: capabilityFilter === btn.id ? "var(--prism-pink)" : "var(--ink-secondary)",
                    border: capabilityFilter === btn.id ? "1px solid var(--prism-pink)" : "1px solid var(--border-card)"
                  }}
                >
                  {btn.label}
                </button>
              ))}

              <button
                onClick={() => setIsAddModelModalOpen(true)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  background: "var(--prism-gradient)",
                  color: "#fff",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                <Plus size={13} /> Add Model
              </button>
            </div>
          </div>

          {/* Model Catalog Table / Grid */}
          <div
            className="prism-card"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: "14px",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--bg-elevated)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Database size={16} style={{ color: "var(--prism-pink)" }} />
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)" }}>
                  Configured AI Models Catalog ({filteredCatalog.length})
                </h3>
              </div>
              <span style={{ fontSize: "12px", color: "var(--ink-tertiary)" }}>
                Click "Set as Default" on any model to make it the platform baseline
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}>
                    <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ink-secondary)" }}>MODEL NAME</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ink-secondary)" }}>PROVIDER</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ink-secondary)" }}>CONTEXT WINDOW</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ink-secondary)" }}>TOKEN PRICING</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ink-secondary)" }}>AVG LATENCY</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ink-secondary)" }}>CAPABILITIES</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ink-secondary)", textAlign: "right" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalog.map((m) => {
                    const isDefault = defaultModel?.primary_model_id === m.id || m.is_default;

                    return (
                      <tr
                        key={m.id}
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          background: isDefault ? "rgba(59, 130, 246, 0.04)" : "transparent",
                          transition: "background 0.1s ease"
                        }}
                      >
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: 700, color: "var(--ink-primary)", fontSize: "13.5px" }}>
                              {m.name}
                            </span>
                            {isDefault && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 800,
                                  background: "rgba(59, 130, 246, 0.18)",
                                  color: "var(--accent-blue)",
                                  border: "1px solid rgba(59, 130, 246, 0.35)",
                                  padding: "2px 7px",
                                  borderRadius: "4px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "3px"
                                }}
                              >
                                <Star size={10} fill="currentColor" /> DEFAULT
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontFamily: "monospace", marginTop: "2px" }}>
                            id: {m.id}
                          </div>
                        </td>

                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              fontSize: "11.5px",
                              fontWeight: 600,
                              color: "var(--ink-primary)",
                              background: "var(--bg-elevated)",
                              border: "1px solid var(--border-card)",
                              padding: "3px 8px",
                              borderRadius: "6px"
                            }}
                          >
                            {m.provider_name}
                          </span>
                        </td>

                        <td style={{ padding: "14px 16px", color: "var(--ink-primary)", fontWeight: 600 }}>
                          {m.context_window}
                        </td>

                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ color: "var(--accent-teal)", fontWeight: 600 }}>
                              In: {m.input_cost}
                            </span>
                            <span style={{ color: "var(--ink-secondary)", fontSize: "11px" }}>
                              Out: {m.output_cost}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: "14px 16px", color: "var(--accent-violet)", fontWeight: 700 }}>
                          {m.latency_avg}
                        </td>

                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {(m.capabilities || []).map((c) => (
                              <span
                                key={c}
                                style={{
                                  fontSize: "10.5px",
                                  background: "var(--bg-elevated)",
                                  color: "var(--ink-secondary)",
                                  border: "1px solid var(--border-card)",
                                  padding: "2px 6px",
                                  borderRadius: "4px"
                                }}
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td style={{ padding: "14px 16px", textAlign: "right" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                            {!isDefault ? (
                              <button
                                onClick={() => handleSetGlobalDefault(m.id, m.provider_id, m.name, m.provider_name)}
                                className="btn-secondary"
                                style={{
                                  fontSize: "11px",
                                  padding: "4px 9px",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                Set Default
                              </button>
                            ) : (
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-blue)", padding: "4px 8px" }}>
                                Active
                              </span>
                            )}

                            <button
                              onClick={() => handleDeleteModel(m)}
                              style={{
                                background: "transparent",
                                border: "1px solid var(--border-card)",
                                borderRadius: "6px",
                                padding: "4px 7px",
                                color: "var(--ink-tertiary)",
                                cursor: "pointer"
                              }}
                              title="Delete Model from Catalog"
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
            </div>
          </div>

          {/* Connected Providers Cards Matrix */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink-primary)" }}>
              Underlying Model Providers ({providers.length})
            </h3>
            <button
              onClick={() => handleOpenProviderModal()}
              className="btn-secondary"
              style={{ fontSize: "12px", padding: "5px 12px", display: "flex", alignItems: "center", gap: "5px" }}
            >
              <Plus size={13} /> Register New Provider
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "16px" }}>
            {providers.map((prov) => {
              const testRes = providerTestResults[prov.id];

              return (
                <div
                  key={prov.id}
                  className="prism-card"
                  style={{
                    padding: "20px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-card)",
                    borderRadius: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <h4 style={{ fontSize: "15.5px", fontWeight: 700, color: "var(--ink-primary)" }}>
                          {prov.name}
                        </h4>
                        <span className="badge badge-teal" style={{ fontSize: "10px", padding: "2px 6px" }}>
                          {prov.status}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--prism-pink)", fontWeight: 600, marginTop: "2px" }}>
                        {prov.role}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        onClick={() => handleOpenProviderModal(prov)}
                        style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border-card)",
                          borderRadius: "6px",
                          padding: "5px 8px",
                          color: "var(--ink-secondary)",
                          cursor: "pointer"
                        }}
                        title="Edit Provider"
                      >
                        <Edit3 size={13} />
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: "12px", color: "var(--ink-secondary)", lineHeight: 1.5 }}>
                    {prov.description}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11.5px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--ink-tertiary)" }}>RPM Quota: {prov.quotaRpm}</span>
                      <span style={{ color: "var(--accent-teal)", fontWeight: 600 }}>
                        {prov.currentUsagePct}% utilized
                      </span>
                    </div>
                    <div style={{ height: "5px", borderRadius: "999px", background: "var(--bg-elevated)", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${prov.currentUsagePct}%`,
                          background: "var(--accent-teal)"
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderTop: "1px solid var(--border-subtle)",
                      paddingTop: "10px",
                      marginTop: "auto"
                    }}
                  >
                    <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)" }}>
                      Live Latency: <strong style={{ color: "var(--accent-violet)" }}>{prov.latency}</strong> • Priority #{prov.fallbackPriority}
                    </span>
                    <button
                      onClick={() => handleTestProvider(prov)}
                      disabled={testingProvider === prov.id}
                      className="btn-secondary"
                      style={{ padding: "4px 10px", fontSize: "11px", gap: "4px", display: "flex", alignItems: "center" }}
                    >
                      <Play size={11} fill="currentColor" /> {testingProvider === prov.id ? "Probing..." : "Test Ingest"}
                    </button>
                  </div>

                  {testRes && (
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: "6px",
                        background:
                          testRes.status === "SUCCESS"
                            ? "rgba(16, 185, 129, 0.1)"
                            : "rgba(239, 68, 68, 0.1)",
                        border:
                          testRes.status === "SUCCESS"
                            ? "1px solid rgba(16, 185, 129, 0.25)"
                            : "1px solid rgba(239, 68, 68, 0.25)",
                        fontSize: "11.5px",
                        color: testRes.status === "SUCCESS" ? "var(--accent-teal)" : "var(--accent-rose)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      {testRes.status === "SUCCESS" ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                      <span>{testRes.message} ({testRes.latency})</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STAGE-BASED MODEL ROUTING                                          */}
      {/* ========================================================================= */}
      {activeTab === "stages" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Execution Pipeline Breadcrumb */}
          <div
            style={{
              padding: "14px 20px",
              borderRadius: "12px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-card)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              overflowX: "auto"
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
              Execution Pipeline:
            </span>
            {stages
              .filter((s) => s.category === "Pipeline")
              .map((s, idx, arr) => (
                <React.Fragment key={s.stage_key}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-subtle)",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--ink-primary)"
                    }}
                  >
                    <span style={{ color: "var(--prism-pink)", fontSize: "10px" }}>#{idx + 1}</span>
                    <span>{s.stage_name.split("&")[0].trim()}</span>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "var(--accent-blue)",
                        background: "rgba(59, 130, 246, 0.12)",
                        padding: "1px 5px",
                        borderRadius: "4px"
                      }}
                    >
                      {s.primary_model_name}
                    </span>
                  </div>
                  {idx < arr.length - 1 && <ArrowRight size={13} style={{ color: "var(--ink-tertiary)" }} />}
                </React.Fragment>
              ))}
          </div>

          {/* Stage Cards Matrix */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {stages.map((stage) => {
              const isDirty = dirtyStages.has(stage.stage_key);
              const testResult = stageTestResults[stage.stage_key];

              return (
                <div
                  key={stage.stage_key}
                  className="prism-card"
                  style={{
                    padding: "20px 24px",
                    background: "var(--bg-card)",
                    border: isDirty
                      ? "2px solid var(--prism-pink)"
                      : "1px solid var(--border-card)",
                    borderRadius: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    boxShadow: isDirty ? "0 0 16px var(--prism-glow)" : "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  {/* Stage Top Bar */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background:
                            stage.category === "Security"
                              ? "rgba(239, 68, 68, 0.15)"
                              : stage.category === "Specialist"
                              ? "rgba(139, 92, 246, 0.15)"
                              : stage.category === "Global"
                              ? "rgba(59, 130, 246, 0.15)"
                              : "rgba(16, 185, 129, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color:
                            stage.category === "Security"
                              ? "var(--accent-rose)"
                              : stage.category === "Specialist"
                              ? "var(--accent-violet)"
                              : stage.category === "Global"
                              ? "var(--accent-blue)"
                              : "var(--accent-teal)"
                        }}
                      >
                        {stage.category === "Security" ? (
                          <Shield size={18} />
                        ) : stage.category === "Specialist" ? (
                          <Code2 size={18} />
                        ) : stage.category === "Global" ? (
                          <Star size={18} />
                        ) : (
                          <Layers size={18} />
                        )}
                      </div>

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink-primary)" }}>
                            {stage.stage_name}
                          </h3>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              padding: "2px 7px",
                              borderRadius: "4px",
                              background:
                                stage.category === "Security"
                                  ? "rgba(239, 68, 68, 0.15)"
                                  : stage.category === "Specialist"
                                  ? "rgba(139, 92, 246, 0.15)"
                                  : "rgba(16, 185, 129, 0.15)",
                              color:
                                stage.category === "Security"
                                  ? "var(--accent-rose)"
                                  : stage.category === "Specialist"
                                  ? "var(--accent-violet)"
                                  : "var(--accent-teal)"
                            }}
                          >
                            {stage.category} Stage
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontFamily: "monospace" }}>
                            stage_key: {stage.stage_key}
                          </span>
                          {isDirty && (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                background: "rgba(236, 72, 153, 0.2)",
                                color: "var(--prism-pink)",
                                padding: "2px 6px",
                                borderRadius: "4px"
                              }}
                            >
                              MODIFIED
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "3px" }}>
                          {stage.description}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        onClick={() => handleTestStage(stage.stage_key)}
                        disabled={testingStage === stage.stage_key}
                        className="btn-secondary"
                        style={{
                          fontSize: "11.5px",
                          padding: "5px 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px"
                        }}
                      >
                        <Play size={12} fill="currentColor" />
                        {testingStage === stage.stage_key ? "Testing Probe..." : "Test Stage"}
                      </button>
                    </div>
                  </div>

                  {/* Configuration Controls Row */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "14px",
                      background: "var(--bg-elevated)",
                      padding: "14px 16px",
                      borderRadius: "10px",
                      border: "1px solid var(--border-card)"
                    }}
                  >
                    {/* Primary Model Selector */}
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-secondary)", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>
                        Primary Model
                      </label>
                      <select
                        value={stage.primary_model_id}
                        onChange={(e) => handleStageChange(stage.stage_key, "primary_model_id", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          borderRadius: "8px",
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-card)",
                          color: "var(--ink-primary)",
                          fontSize: "12px",
                          fontWeight: 600,
                          outline: "none"
                        }}
                      >
                        {modelCatalog.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.provider_name})
                          </option>
                        ))}
                      </select>
                      <div style={{ fontSize: "10.5px", color: "var(--ink-tertiary)", marginTop: "4px" }}>
                        Provider: <strong>{stage.provider_name}</strong>
                      </div>
                    </div>

                    {/* Fallback Model Selector */}
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-secondary)", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>
                        Fallback Model (Auto-Failover)
                      </label>
                      <select
                        value={stage.fallback_model_id || ""}
                        onChange={(e) => handleStageChange(stage.stage_key, "fallback_model_id", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          borderRadius: "8px",
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-card)",
                          color: "var(--ink-primary)",
                          fontSize: "12px",
                          outline: "none"
                        }}
                      >
                        <option value="">None (No Fallback)</option>
                        {modelCatalog.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.provider_name})
                          </option>
                        ))}
                      </select>
                      <div style={{ fontSize: "10.5px", color: "var(--ink-tertiary)", marginTop: "4px" }}>
                        Provider: <strong>{stage.fallback_provider_name || "None"}</strong>
                      </div>
                    </div>

                    {/* Routing Strategy */}
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-secondary)", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>
                        Routing Strategy
                      </label>
                      <select
                        value={stage.routing_strategy}
                        onChange={(e) => handleStageChange(stage.stage_key, "routing_strategy", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          borderRadius: "8px",
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-card)",
                          color: "var(--ink-primary)",
                          fontSize: "12px",
                          outline: "none"
                        }}
                      >
                        {routingStrategies.map((rs) => (
                          <option key={rs.id} value={rs.id}>
                            {rs.name}
                          </option>
                        ))}
                      </select>
                      <div style={{ fontSize: "10.5px", color: "var(--ink-tertiary)", marginTop: "4px" }}>
                        Timeout: <strong>{stage.timeout_seconds}s</strong>
                      </div>
                    </div>

                    {/* Temperature Slider & Max Tokens */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-secondary)", textTransform: "uppercase" }}>
                          Temperature: {stage.temperature}
                        </label>
                        <span style={{ fontSize: "10.5px", color: "var(--accent-blue)", fontWeight: 600 }}>
                          Max Tokens: {stage.max_tokens}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={stage.temperature}
                        onChange={(e) => handleStageChange(stage.stage_key, "temperature", parseFloat(e.target.value))}
                        style={{
                          width: "100%",
                          accentColor: "var(--prism-pink)",
                          cursor: "pointer"
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--ink-tertiary)" }}>
                        <span>Deterministic (0.0)</span>
                        <span>Creative (1.0)</span>
                      </div>
                    </div>
                  </div>

                  {/* Stage Probe Output */}
                  {testResult && (
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        background:
                          testResult.status === "HEALTHY"
                            ? "rgba(16, 185, 129, 0.1)"
                            : "rgba(239, 68, 68, 0.1)",
                        border:
                          testResult.status === "HEALTHY"
                            ? "1px solid rgba(16, 185, 129, 0.3)"
                            : "1px solid rgba(239, 68, 68, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        color: testResult.status === "HEALTHY" ? "var(--accent-teal)" : "var(--accent-rose)"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {testResult.status === "HEALTHY" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                        <span>
                          <strong>{testResult.resolvedModel}:</strong> {testResult.message}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11.5px" }}>
                        <span>
                          Latency: <strong>{testResult.latency}</strong>
                        </span>
                        {testResult.tokenThroughput && (
                          <span>
                            Speed: <strong>{testResult.tokenThroughput}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LIVE LATENCY & BENCHMARKS                                          */}
      {/* ========================================================================= */}
      {activeTab === "benchmarks" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            className="prism-card"
            style={{
              padding: "20px 24px",
              background: "var(--bg-card)",
              borderRadius: "14px",
              border: "1px solid var(--border-card)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px"
            }}
          >
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink-primary)" }}>
                Multi-Model Latency Benchmark & Health Matrix
              </h2>
              <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "3px" }}>
                Execute concurrent socket probes across all connected providers to evaluate packet round-trip time and failover readiness.
              </p>
            </div>

            <button
              onClick={handleRunBenchmark}
              disabled={benchmarkLoading}
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #10b981, #06b6d4)",
                color: "#fff",
                border: "none",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <RefreshCw size={14} className={benchmarkLoading ? "animate-spin" : ""} />
              {benchmarkLoading ? "Benchmarking All Providers..." : "Run Multi-Provider Benchmark"}
            </button>
          </div>

          {benchmarkResults ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
              {benchmarkResults.map((item, idx) => (
                <div
                  key={item.id}
                  className="prism-card"
                  style={{
                    padding: "18px",
                    background: "var(--bg-card)",
                    borderRadius: "12px",
                    border: idx === 0 ? "2px solid var(--accent-teal)" : "1px solid var(--border-card)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: idx === 0 ? "var(--accent-teal)" : "var(--ink-tertiary)" }}>
                        RANK #{idx + 1} {idx === 0 && "• FASTEST"}
                      </span>
                      <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "2px" }}>
                        {item.name}
                      </h4>
                    </div>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 800,
                        color: item.latencyMs < 300 ? "var(--accent-teal)" : item.latencyMs < 500 ? "var(--accent-amber)" : "var(--accent-rose)",
                        background: "var(--bg-elevated)",
                        padding: "3px 8px",
                        borderRadius: "6px"
                      }}
                    >
                      {item.latencyStr}
                    </span>
                  </div>

                  <div style={{ fontSize: "12px", color: "var(--ink-secondary)" }}>
                    {item.role}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11.5px", color: "var(--ink-tertiary)" }}>
                    <span>Models: {item.modelsCount} available</span>
                    <span style={{ color: item.status === "SUCCESS" ? "var(--accent-teal)" : "var(--accent-rose)", fontWeight: 600 }}>
                      Socket: {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                background: "var(--bg-card)",
                borderRadius: "12px",
                border: "1px dashed var(--border-card)",
                color: "var(--ink-secondary)"
              }}
            >
              <Activity size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink-primary)" }}>No benchmark data yet.</p>
              <p style={{ fontSize: "12.5px", marginTop: "4px" }}>
                Click "Run Multi-Provider Benchmark" above to test all model sockets in parallel.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD MODEL TO CATALOG                                               */}
      {/* ========================================================================= */}
      {isAddModelModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px"
          }}
        >
          <div
            className="prism-card"
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "var(--bg-elevated)",
              borderRadius: "16px",
              border: "1px solid var(--border-card)",
              padding: "26px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
              color: "var(--ink-primary)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Plus size={18} style={{ color: "var(--prism-pink)" }} />
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink-primary)" }}>
                  Add Model to Available Catalog
                </h3>
              </div>
              <button
                onClick={() => setIsAddModelModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--ink-tertiary)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModelForm} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Provider
                </label>
                <select
                  required
                  value={modelFormData.provider_id}
                  onChange={(e) => setModelFormData({ ...modelFormData, provider_id: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-card)",
                    color: "var(--ink-primary)",
                    fontSize: "13px",
                    outline: "none"
                  }}
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Model Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Claude 3.7 Sonnet, Gemini 2.0 Flash, DeepSeek V3"
                  value={modelFormData.name}
                  onChange={(e) => setModelFormData({ ...modelFormData, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-card)",
                    color: "var(--ink-primary)",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Model Identifier / ID (Optional - auto-generated from name if blank)
                </label>
                <input
                  type="text"
                  placeholder="e.g. claude-3-7-sonnet"
                  value={modelFormData.id}
                  onChange={(e) => setModelFormData({ ...modelFormData, id: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-card)",
                    color: "var(--ink-primary)",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                    Context Window
                  </label>
                  <input
                    type="text"
                    value={modelFormData.context_window}
                    onChange={(e) => setModelFormData({ ...modelFormData, context_window: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-card)",
                      color: "var(--ink-primary)",
                      fontSize: "13px",
                      outline: "none"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                    Average Latency
                  </label>
                  <input
                    type="text"
                    value={modelFormData.latency_avg}
                    onChange={(e) => setModelFormData({ ...modelFormData, latency_avg: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-card)",
                      color: "var(--ink-primary)",
                      fontSize: "13px",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                    Input Pricing / 1M tokens
                  </label>
                  <input
                    type="text"
                    value={modelFormData.input_cost}
                    onChange={(e) => setModelFormData({ ...modelFormData, input_cost: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-card)",
                      color: "var(--ink-primary)",
                      fontSize: "13px",
                      outline: "none"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                    Output Pricing / 1M tokens
                  </label>
                  <input
                    type="text"
                    value={modelFormData.output_cost}
                    onChange={(e) => setModelFormData({ ...modelFormData, output_cost: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-card)",
                      color: "var(--ink-primary)",
                      fontSize: "13px",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Capabilities (Comma-separated)
                </label>
                <input
                  type="text"
                  value={modelFormData.capabilities}
                  onChange={(e) => setModelFormData({ ...modelFormData, capabilities: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-card)",
                    color: "var(--ink-primary)",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <input
                  type="checkbox"
                  id="is_default_checkbox"
                  checked={modelFormData.is_default}
                  onChange={(e) => setModelFormData({ ...modelFormData, is_default: e.target.checked })}
                  style={{ accentColor: "var(--prism-pink)", cursor: "pointer", width: "16px", height: "16px" }}
                />
                <label htmlFor="is_default_checkbox" style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--ink-primary)", cursor: "pointer" }}>
                  Designate as Platform Global Default Model
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddModelModalOpen(false)}
                  className="btn-secondary"
                  style={{ padding: "8px 16px", fontSize: "13px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    background: "var(--prism-gradient)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  Save Model to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT PROVIDER                                                */}
      {/* ========================================================================= */}
      {isProviderModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px"
          }}
        >
          <div
            className="prism-card"
            style={{
              width: "100%",
              maxWidth: "540px",
              background: "var(--bg-elevated)",
              borderRadius: "16px",
              border: "1px solid var(--border-card)",
              padding: "26px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
              color: "var(--ink-primary)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink-primary)" }}>
                {editingProvider ? `Configure ${editingProvider.name}` : "Register New Model Provider"}
              </h3>
              <button
                onClick={() => setIsProviderModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--ink-tertiary)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProviderForm} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Provider Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Local Private vLLM Cluster, DeepSeek Cloud"
                  value={providerFormData.name}
                  onChange={(e) => setProviderFormData({ ...providerFormData, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-card)",
                    color: "var(--ink-primary)",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </div>

              {!editingProvider && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                    Provider Key (Unique Identifier)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. vllm_private_01"
                    value={providerFormData.provider_key}
                    onChange={(e) => setProviderFormData({ ...providerFormData, provider_key: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-card)",
                      color: "var(--ink-primary)",
                      fontSize: "13px",
                      outline: "none"
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Role / Specialization
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Air-Gapped / Sensitive Data Fallback, Fast Classification"
                  value={providerFormData.role}
                  onChange={(e) => setProviderFormData({ ...providerFormData, role: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-card)",
                    color: "var(--ink-primary)",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                    RPM Quota Limit
                  </label>
                  <input
                    type="number"
                    value={providerFormData.quota_rpm}
                    onChange={(e) => setProviderFormData({ ...providerFormData, quota_rpm: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-card)",
                      color: "var(--ink-primary)",
                      fontSize: "13px",
                      outline: "none"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                    Status
                  </label>
                  <select
                    value={providerFormData.status}
                    onChange={(e) => setProviderFormData({ ...providerFormData, status: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-card)",
                      color: "var(--ink-primary)",
                      fontSize: "13px",
                      outline: "none"
                    }}
                  >
                    <option value="CONNECTED">CONNECTED</option>
                    <option value="DEGRADED">DEGRADED</option>
                    <option value="DISCONNECTED">DISCONNECTED</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Endpoint Base URL (Optional / Self-Hosted)
                </label>
                <input
                  type="text"
                  placeholder="e.g. http://localhost:11434 or http://vllm.internal:8000/v1"
                  value={providerFormData.endpoint_url}
                  onChange={(e) => setProviderFormData({ ...providerFormData, endpoint_url: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-card)",
                    color: "var(--ink-primary)",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  API Key / Secret Token (Optional / Cloud)
                </label>
                <input
                  type="password"
                  placeholder="Enter secret token to update credentials"
                  value={providerFormData.api_key}
                  onChange={(e) => setProviderFormData({ ...providerFormData, api_key: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-card)",
                    color: "var(--ink-primary)",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description of when this provider is used..."
                  value={providerFormData.description}
                  onChange={(e) => setProviderFormData({ ...providerFormData, description: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-card)",
                    color: "var(--ink-primary)",
                    fontSize: "12.5px",
                    outline: "none",
                    resize: "vertical"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsProviderModalOpen(false)}
                  className="btn-secondary"
                  style={{ padding: "8px 16px", fontSize: "13px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    background: "var(--prism-gradient)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  Save Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
