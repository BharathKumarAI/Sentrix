import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Server,
  Database,
  Cpu,
  RotateCw,
  Zap,
  TrendingUp,
  ShieldCheck,
  Play,
  Cloud,
  HardDrive,
  Folder,
  FileText,
  Download,
  Layers,
  Lock,
  Archive,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  Eye,
  EyeOff,
  Sliders,
  Check,
  Globe,
  Radio,
  Clock,
  Gauge,
  HelpCircle,
  Terminal,
  Shield,
  CheckCircle,
  XCircle,
  Info,
  Search,
  Copy,
  X,
  AlertOctagon
} from "lucide-react";
import {
  fetchAdminSystemHealth,
  fetchAdminInfrastructureConfig,
  testAdminInfrastructureProbe,
  applyAdminInfrastructureConfig,
  fetchAdminStorageOverview,
  fetchAdminBackups,
  createAdminBackup,
  restoreAdminBackup,
  getBackupDownloadUrl
} from "../api/client";

// Cloud Provider Metadata with Refined Badges and Styling
const CLOUD_THEMES = {
  local: {
    id: "local",
    label: "Local Dev",
    brand: "Local Host",
    accent: "var(--accent-teal)",
    badgeBg: "rgba(16, 185, 129, 0.12)",
    badgeBorder: "rgba(16, 185, 129, 0.35)",
    badgeText: "var(--accent-teal)",
    icon: Server
  },
  aws: {
    id: "aws",
    label: "AWS",
    brand: "Amazon Web Services",
    accent: "#f59e0b",
    badgeBg: "rgba(245, 158, 11, 0.12)",
    badgeBorder: "rgba(245, 158, 11, 0.35)",
    badgeText: "#f59e0b",
    icon: Zap
  },
  azure: {
    id: "azure",
    label: "Azure",
    brand: "Microsoft Azure",
    accent: "#0284c7",
    badgeBg: "rgba(2, 132, 199, 0.12)",
    badgeBorder: "rgba(2, 132, 199, 0.35)",
    badgeText: "#0284c7",
    icon: Cloud
  },
  gcp: {
    id: "gcp",
    label: "GCP",
    brand: "Google Cloud Platform",
    accent: "#3b82f6",
    badgeBg: "rgba(59, 130, 246, 0.12)",
    badgeBorder: "rgba(59, 130, 246, 0.35)",
    badgeText: "#3b82f6",
    icon: Cpu
  },
  custom: {
    id: "custom",
    label: "Custom",
    brand: "MinIO / Self-Hosted",
    accent: "var(--accent-violet)",
    badgeBg: "rgba(139, 125, 255, 0.12)",
    badgeBorder: "rgba(139, 125, 255, 0.35)",
    badgeText: "var(--accent-violet)",
    icon: RefreshCw
  }
};

export function AdminSystemHealthPage() {
  const [activeTab, setActiveTab] = useState("cloud"); // "cloud", "services", "storage", "backups"
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Core telemetry state
  const [services, setServices] = useState([]);
  const [overallStatus, setOverallStatus] = useState("OPERATIONAL");
  const [systemResources, setSystemResources] = useState(null);
  const [activeProviderMeta, setActiveProviderMeta] = useState({ id: "local", name: "Local / Self-Hosted", badge: "Offline First" });

  // Tool-wise Multi-Cloud Workbench state
  const [infraData, setInfraData] = useState(null);
  const [subsystemClouds, setSubsystemClouds] = useState({
    database: "local",
    cache: "local",
    storage: "local",
    vault: "local",
    mlflow: "local"
  });
  const [formConfig, setFormConfig] = useState({});
  const [diagnosticResults, setDiagnosticResults] = useState(null);
  const [subsystemProbeResults, setSubsystemProbeResults] = useState({});
  const [isProbing, setIsProbing] = useState(false);
  const [probingSubsystem, setProbingSubsystem] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  // Storage Overview state
  const [storageOverview, setStorageOverview] = useState(null);
  const [storageSearch, setStorageSearch] = useState("");
  const [selectedStorageContainer, setSelectedStorageContainer] = useState("ALL");

  // Backups state
  const [backups, setBackups] = useState([]);
  const [backupSearch, setBackupSearch] = useState("");
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(null);
  const [showCreateBackupModal, setShowCreateBackupModal] = useState(false);
  const [backupDescription, setBackupDescription] = useState("");
  const [showRestoreModal, setShowRestoreModal] = useState(null);
  const [copiedChecksum, setCopiedChecksum] = useState(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const loadAllData = async () => {
    setIsRefreshing(true);
    try {
      const [health, infra, storage, backupList] = await Promise.all([
        fetchAdminSystemHealth().catch(() => null),
        fetchAdminInfrastructureConfig().catch(() => null),
        fetchAdminStorageOverview().catch(() => null),
        fetchAdminBackups().catch(() => null)
      ]);

      if (health) {
        if (Array.isArray(health.services)) setServices(health.services);
        if (health.status) setOverallStatus(health.status);
        if (health.system_resources) setSystemResources(health.system_resources);
        if (health.active_provider) setActiveProviderMeta(health.active_provider);
      }

      if (infra) {
        setInfraData(infra);
        const activeCfg = infra.active_config || {};
        
        // Detect tool-wise clouds from config
        const detectedClouds = {
          database: activeCfg.db_cloud || (activeCfg.db_host?.includes("amazonaws") ? "aws" : activeCfg.db_host?.includes("azure") ? "azure" : activeCfg.db_host?.includes("cloudsql") ? "gcp" : "local"),
          cache: activeCfg.cache_cloud || (activeCfg.cache_provider?.includes("AWS") ? "aws" : activeCfg.cache_provider?.includes("AZURE") ? "azure" : activeCfg.cache_provider?.includes("GCP") ? "gcp" : "local"),
          storage: activeCfg.storage_cloud || (activeCfg.storage_provider?.includes("AWS") ? "aws" : activeCfg.storage_provider?.includes("AZURE") ? "azure" : activeCfg.storage_provider?.includes("GOOGLE") ? "gcp" : "local"),
          vault: activeCfg.vault_cloud || (activeCfg.vault_provider?.includes("AWS") ? "aws" : activeCfg.vault_provider?.includes("AZURE") ? "azure" : activeCfg.vault_provider?.includes("GCP") ? "gcp" : "local"),
          mlflow: activeCfg.mlflow_cloud || (activeCfg.mlflow_tracking_uri?.includes("amazonaws") || activeCfg.mlflow_tracking_uri?.includes(".aws") ? "aws" : activeCfg.mlflow_tracking_uri?.includes("azure") ? "azure" : activeCfg.mlflow_tracking_uri?.includes("run.app") ? "gcp" : "local")
        };
        setSubsystemClouds(detectedClouds);
        setFormConfig({ ...activeCfg });
      }

      if (storage) setStorageOverview(storage);
      if (backupList && Array.isArray(backupList.backups)) setBackups(backupList.backups);
    } catch (err) {
      console.warn("Failed to load platform health telemetry:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // When user selects a cloud for a specific subsystem / tool
  const handleSubsystemCloudChange = (subsystem, cloudProvider) => {
    setSubsystemClouds((prev) => ({
      ...prev,
      [subsystem]: cloudProvider
    }));

    if (!infraData?.subsystem_presets?.[subsystem]?.[cloudProvider]) return;

    const presetValues = infraData.subsystem_presets[subsystem][cloudProvider];
    setFormConfig((prev) => ({
      ...prev,
      [`${subsystem}_cloud`]: cloudProvider,
      ...presetValues
    }));

    showToast(`Configured ${subsystem.toUpperCase()} for ${presetValues.name || cloudProvider.toUpperCase()}`, "success");
  };

  // Sync All Subsystems to a single cloud provider (1-Click preset)
  const handleSyncAllToCloud = (cloudProvider) => {
    setSubsystemClouds({
      database: cloudProvider,
      cache: cloudProvider,
      storage: cloudProvider,
      vault: cloudProvider,
      mlflow: cloudProvider
    });

    if (!infraData) return;
    const defaults = infraData.providers?.[cloudProvider]?.defaults || {};
    setFormConfig({
      ...defaults,
      db_cloud: cloudProvider,
      cache_cloud: cloudProvider,
      storage_cloud: cloudProvider,
      vault_cloud: cloudProvider,
      mlflow_cloud: cloudProvider
    });

    showToast(`Synchronized all services to ${infraData.providers?.[cloudProvider]?.name || cloudProvider.toUpperCase()}`, "success");
  };

  // Preset: Hybrid Enterprise Composition
  const handleSetHybridPreset = () => {
    setSubsystemClouds({
      database: "aws",
      cache: "azure",
      storage: "aws",
      vault: "local",
      mlflow: "local"
    });

    const awsDb = infraData?.subsystem_presets?.database?.aws || {};
    const azureCache = infraData?.subsystem_presets?.cache?.azure || {};
    const awsStorage = infraData?.subsystem_presets?.storage?.aws || {};
    const localVault = infraData?.subsystem_presets?.vault?.local || {};
    const localMlflow = infraData?.subsystem_presets?.mlflow?.local || {};

    setFormConfig((prev) => ({
      ...prev,
      db_cloud: "aws",
      cache_cloud: "azure",
      storage_cloud: "aws",
      vault_cloud: "local",
      mlflow_cloud: "local",
      ...awsDb,
      ...azureCache,
      ...awsStorage,
      ...localVault,
      ...localMlflow
    }));

    showToast("Loaded Hybrid Enterprise composition profile", "success");
  };

  // Run full suite diagnostic latency probe
  const handleRunFullProbe = async () => {
    setIsProbing(true);
    try {
      const payload = {
        ...formConfig,
        db_cloud: subsystemClouds.database,
        cache_cloud: subsystemClouds.cache,
        storage_cloud: subsystemClouds.storage,
        vault_cloud: subsystemClouds.vault,
        mlflow_cloud: subsystemClouds.mlflow || "local"
      };
      const res = await testAdminInfrastructureProbe("hybrid", payload, null);
      setDiagnosticResults(res);
      setSubsystemProbeResults(res.subsystems || {});
      const isOk = res.overall_status === "HEALTHY";
      showToast(
        `Diagnostics Probe Complete: ${res.overall_status} (${res.total_diagnostic_time_ms}ms)`,
        isOk ? "success" : "warning"
      );
    } catch (err) {
      showToast("Probe failed: " + err.message, "error");
    } finally {
      setIsProbing(false);
    }
  };

  // Run targeted probe on a single subsystem
  const handleRunSubsystemProbe = async (subsystemKey) => {
    setProbingSubsystem(subsystemKey);
    try {
      const cloudForSubsystem = subsystemClouds[subsystemKey] || "local";
      const res = await testAdminInfrastructureProbe(cloudForSubsystem, formConfig, subsystemKey);
      const probeResult = res.result;
      const isOk = probeResult.status === "SUCCESS";
      
      setSubsystemProbeResults((prev) => ({
        ...prev,
        [subsystemKey]: probeResult
      }));

      showToast(
        `${subsystemKey.toUpperCase()} Probe: ${probeResult.status} (${probeResult.latency_ms}ms) - ${probeResult.message || probeResult.error}`,
        isOk ? "success" : "warning"
      );
    } catch (err) {
      showToast(`Failed to probe ${subsystemKey}: ${err.message}`, "error");
    } finally {
      setProbingSubsystem(null);
    }
  };

  // Apply active platform composition
  const handleApplyConfig = async () => {
    const isHybrid = Object.values(subsystemClouds).some(
      (c, _, arr) => (c || "").toLowerCase() !== (arr[0] || "").toLowerCase()
    );
    const targetLabel = isHybrid ? "Hybrid Multi-Cloud Architecture" : `${(subsystemClouds.database || "local").toUpperCase()} Architecture`;

    if (!window.confirm(`Are you sure you want to apply ${targetLabel} as the active platform infrastructure? All platform services will immediately align.`)) {
      return;
    }
    setIsApplying(true);
    try {
      const payload = {
        ...formConfig,
        db_cloud: subsystemClouds.database,
        cache_cloud: subsystemClouds.cache,
        storage_cloud: subsystemClouds.storage,
        vault_cloud: subsystemClouds.vault,
        mlflow_cloud: subsystemClouds.mlflow || "local"
      };
      const res = await applyAdminInfrastructureConfig(isHybrid ? "hybrid" : subsystemClouds.database, payload);
      showToast(res.message || "Configuration applied seamlessly!", "success");
      if (res.diagnostic_summary) {
        setDiagnosticResults(res.diagnostic_summary);
        setSubsystemProbeResults(res.diagnostic_summary.subsystems || {});
      }
      await loadAllData();
    } catch (err) {
      showToast("Failed to apply configuration: " + err.message, "error");
    } finally {
      setIsApplying(false);
    }
  };

  const handleCreateBackupSubmit = async (e) => {
    e.preventDefault();
    setIsCreatingBackup(true);
    try {
      const res = await createAdminBackup(backupDescription.trim() || "Manual Admin Platform Snapshot");
      showToast(`Backup snapshot ${res.backup_filename} created successfully! (${res.total_rows} rows saved & synced)`, "success");
      setShowCreateBackupModal(false);
      setBackupDescription("");
      loadAllData();
    } catch (err) {
      showToast("Failed to create snapshot: " + err.message, "error");
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackupSubmit = async (filename) => {
    setShowRestoreModal(null);
    setRestoringBackup(filename);
    try {
      const res = await restoreAdminBackup(filename);
      showToast(`Restoration complete! ${res.total_rows_restored} table rows restored successfully from ${filename}.`, "success");
      loadAllData();
    } catch (err) {
      showToast("Restoration failed: " + err.message, "error");
    } finally {
      setRestoringBackup(null);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedChecksum(id);
    setTimeout(() => setCopiedChecksum(null), 2000);
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Filtered files in Storage Reflection tab
  const filteredStorageFiles = useMemo(() => {
    const files = storageOverview?.blob_mirror?.recent_files || [];
    return files.filter((f) => {
      const matchesSearch =
        storageSearch === "" ||
        f.filename?.toLowerCase().includes(storageSearch.toLowerCase()) ||
        f.relative_path?.toLowerCase().includes(storageSearch.toLowerCase()) ||
        f.path?.toLowerCase().includes(storageSearch.toLowerCase()) ||
        f.container?.toLowerCase().includes(storageSearch.toLowerCase());
      const matchesContainer =
        selectedStorageContainer === "ALL" || f.container === selectedStorageContainer;
      return matchesSearch && matchesContainer;
    });
  }, [storageOverview, storageSearch, selectedStorageContainer]);

  // Filtered backups in Disaster Recovery tab
  const filteredBackups = useMemo(() => {
    return backups.filter((b) => {
      return (
        backupSearch === "" ||
        b.filename?.toLowerCase().includes(backupSearch.toLowerCase()) ||
        b.description?.toLowerCase().includes(backupSearch.toLowerCase()) ||
        b.sha256?.toLowerCase().includes(backupSearch.toLowerCase())
      );
    });
  }, [backups, backupSearch]);

  // Cloud Selector Component
  const renderCloudSelector = (subsystemKey) => {
    const activeCloud = (subsystemClouds[subsystemKey] || "local").toLowerCase();

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gap: "4px",
          background: "var(--bg-input)",
          padding: "4px",
          borderRadius: "8px",
          border: "1px solid var(--border-subtle)",
          marginBottom: "12px"
        }}
      >
        {Object.values(CLOUD_THEMES).map((theme) => {
          const isSelected = activeCloud === theme.id;
          const Icon = theme.icon;

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => handleSubsystemCloudChange(subsystemKey, theme.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                padding: "6px 2px",
                fontSize: "11px",
                fontWeight: isSelected ? 600 : 500,
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                background: isSelected ? "var(--bg-card)" : "transparent",
                color: isSelected ? theme.accent : "var(--ink-secondary)",
                border: isSelected ? `1px solid ${theme.badgeBorder}` : "1px solid transparent",
                boxShadow: isSelected ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
              title={`${theme.brand} (${theme.label})`}
            >
              {isSelected ? <Check size={11} strokeWidth={2.5} style={{ flexShrink: 0 }} /> : <Icon size={11} style={{ flexShrink: 0 }} />}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{theme.label}</span>
            </button>
          );
        })}
      </div>
    );
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
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "32px",
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: "8px",
            background:
              toastMessage.type === "error"
                ? "rgba(239, 68, 68, 0.95)"
                : toastMessage.type === "warning"
                ? "rgba(245, 158, 11, 0.95)"
                : "rgba(16, 185, 129, 0.95)",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backdropFilter: "blur(8px)",
            animation: "fadeIn 0.2s ease"
          }}
        >
          {toastMessage.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Hero Header Card */}
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
            <Activity size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "11.5px",
                  fontWeight: 700,
                  color: "var(--ink-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em"
                }}
              >
                PLATFORM ADMIN • INFRASTRUCTURE & MULTI-CLOUD HEALTH
              </span>
              <span
                className={`badge ${
                  overallStatus === "OPERATIONAL" || overallStatus === "HEALTHY"
                    ? "badge-teal"
                    : "badge-amber"
                }`}
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background:
                      overallStatus === "OPERATIONAL" || overallStatus === "HEALTHY"
                        ? "var(--accent-teal)"
                        : "var(--accent-amber)",
                    boxShadow:
                      overallStatus === "OPERATIONAL" || overallStatus === "HEALTHY"
                        ? "0 0 6px var(--accent-teal)"
                        : "0 0 6px var(--accent-amber)"
                  }}
                />
                Platform {overallStatus}
              </span>
              <span className="badge badge-magenta">
                Target: {activeProviderMeta?.name || "Local Dev"}
              </span>
              <span className="badge badge-violet">
                {activeProviderMeta?.badge || "Multi-Cloud Studio"}
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
              System Health & Infrastructure Studio
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Live telemetry monitoring, latency diagnostics, and tool-wise cloud infrastructure switching.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={handleRunFullProbe}
            disabled={isProbing}
            className="btn-secondary"
            style={{
              gap: "6px",
              padding: "8px 14px",
              fontSize: "12.5px",
              fontWeight: 600,
              color: "var(--ink-primary)",
              border: "1px solid var(--border-card)"
            }}
          >
            <Zap size={14} style={{ color: "var(--accent-amber)" }} className={isProbing ? "spin" : ""} />
            {isProbing ? "Probing Clouds..." : "Run Fleet Diagnostics"}
          </button>

          <button
            onClick={loadAllData}
            disabled={isRefreshing}
            className="btn-secondary"
            style={{
              gap: "6px",
              padding: "8px 14px",
              fontSize: "12.5px",
              fontWeight: 500,
              color: "var(--ink-secondary)",
              border: "1px solid var(--border-card)"
            }}
          >
            <RotateCw size={13} className={isRefreshing ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* 5 KPI Stat Cards Row (Aligned with Platform Architecture) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px"
        }}
      >
        {/* Card 1: Fleet Status */}
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
            <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>
              Fleet Health
            </span>
            <CheckCircle2 size={16} color="var(--accent-teal)" />
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--accent-teal)" }}>
            {overallStatus}
          </div>
          <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
            {services.filter((s) => s.status === "OPERATIONAL" || s.status === "HEALTHY").length} of {services.length} platform daemons online
          </div>
        </div>

        {/* Card 2: System Uptime */}
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
            <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>
              Runtime Uptime
            </span>
            <Clock size={16} color="var(--accent-violet)" />
          </div>
          <div className="mono" style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)" }}>
            {systemResources?.uptime_formatted || "Active"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
            Continuous platform availability
          </div>
        </div>

        {/* Card 3: Memory Usage */}
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
            <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>
              Memory Footprint
            </span>
            <Cpu size={16} color="var(--accent-amber)" />
          </div>
          <div className="mono" style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)" }}>
            {systemResources?.memory_usage_mb != null ? `${systemResources.memory_usage_mb} MB` : "—"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
            Process RSS active memory
          </div>
        </div>

        {/* Card 4: Database Connection Pool */}
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
            <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>
              PostgreSQL Pool
            </span>
            <Database size={16} color="var(--accent-teal)" />
          </div>
          <div className="mono" style={{ fontSize: "20px", fontWeight: 700, color: "var(--accent-teal)" }}>
            {systemResources ? `${systemResources.db_pool_active} / ${systemResources.db_pool_max}` : "1 / 25"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
            Active / pooled connections
          </div>
        </div>

        {/* Card 5: Active Infrastructure */}
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
            <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>
              Active Architecture
            </span>
            <Cloud size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {activeProviderMeta?.name ? activeProviderMeta.name.split("/")[0].trim() : "Multi-Cloud"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
            {activeProviderMeta?.badge || "Offline First"} • 5 subsystems synced
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div
        className="prism-card"
        style={{
          padding: "8px 12px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "cloud", label: "Multi-Cloud Studio", icon: Cloud, color: "var(--prism-pink)", bg: "rgba(236, 72, 153, 0.15)", border: "rgba(236, 72, 153, 0.3)" },
            { id: "services", label: "Platform Daemons", icon: Server, count: services.length, color: "var(--accent-teal)", bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.3)" },
            { id: "storage", label: "Storage Reflection", icon: HardDrive, count: storageOverview?.blob_mirror?.total_files, color: "var(--accent-violet)", bg: "rgba(139, 92, 246, 0.15)", border: "rgba(139, 92, 246, 0.3)" },
            { id: "backups", label: "Disaster Recovery", icon: Archive, count: backups.length, color: "var(--accent-amber)", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)" }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
                className={`tab-btn ${isActive ? "active" : ""}`}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  background: isActive ? tab.bg : "transparent",
                  color: isActive ? tab.color : "var(--ink-secondary)",
                  border: isActive ? `1px solid ${tab.border}` : "1px solid transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.16s ease"
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: "10px",
                      background: isActive ? "var(--bg-card)" : "var(--bg-app)",
                      color: isActive ? tab.color : "var(--ink-tertiary)",
                      border: "1px solid var(--border-subtle)",
                      marginLeft: "2px"
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontSize: "11px",
              color: "var(--ink-tertiary)",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <ShieldCheck size={13} style={{ color: "var(--accent-teal)" }} />
            Zero-Downtime Resilience Active
          </span>
        </div>
      </div>

      {/* TAB 1: Tool-Wise Multi-Cloud Testing Studio */}
      {activeTab === "cloud" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Quick Presets Bar */}
          <div
            className="prism-card"
            style={{
              padding: "16px 20px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-card)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px"
            }}
          >
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Target Cloud Environment Profiles
              </div>
              <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", margin: "3px 0 0 0" }}>
                Select a deployment target to synchronize platform services, or configure each service independently below.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {[
                { id: "local", label: "Local / Self-Hosted", icon: Server, accent: "var(--accent-teal)" },
                { id: "aws", label: "AWS Target", icon: Zap, accent: "#f59e0b" },
                { id: "azure", label: "Azure Target", icon: Cloud, accent: "#0284c7" },
                { id: "gcp", label: "GCP Target", icon: Cpu, accent: "#3b82f6" }
              ].map((p) => {
                const isAllSelected = Object.values(subsystemClouds).every((c) => (c || "").toLowerCase() === p.id);
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSyncAllToCloud(p.id)}
                    type="button"
                    style={{
                      fontSize: "12px",
                      padding: "6px 12px",
                      gap: "6px",
                      display: "flex",
                      alignItems: "center",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: isAllSelected ? 600 : 500,
                      background: isAllSelected ? "var(--bg-input)" : "var(--bg-card)",
                      color: isAllSelected ? p.accent : "var(--ink-primary)",
                      border: isAllSelected ? `1px solid ${p.accent}` : "1px solid var(--border-subtle)",
                      boxShadow: isAllSelected ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {isAllSelected ? <Check size={12} strokeWidth={2.5} /> : <Icon size={12} />}
                    <span>{p.label}</span>
                  </button>
                );
              })}

              {(() => {
                const isHybrid = Object.values(subsystemClouds).some((c, _, arr) => (c || "").toLowerCase() !== (arr[0] || "").toLowerCase());
                return (
                  <button
                    onClick={handleSetHybridPreset}
                    type="button"
                    style={{
                      fontSize: "12px",
                      padding: "6px 14px",
                      gap: "6px",
                      display: "flex",
                      alignItems: "center",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: isHybrid ? 600 : 500,
                      background: isHybrid ? "rgba(139, 125, 255, 0.12)" : "var(--bg-card)",
                      color: isHybrid ? "var(--accent-violet)" : "var(--ink-primary)",
                      border: isHybrid ? "1px solid var(--accent-violet)" : "1px solid var(--border-subtle)",
                      boxShadow: isHybrid ? "0 1px 4px rgba(139, 125, 255, 0.15)" : "none",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {isHybrid ? <Check size={12} strokeWidth={2.5} /> : <Layers size={12} />}
                    <span>Hybrid Composition</span>
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Section 1: Core Persistence & Cache Engine (3 Columns Balanced) */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Database size={15} style={{ color: "var(--accent-teal)" }} />
              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
                Core Persistence & Cache Infrastructure
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
              {/* 1. RELATIONAL DATABASE CARD */}
              <div
                className="prism-card"
                style={{
                  padding: "20px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                  borderRadius: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px"
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "8px",
                        background: "rgba(16, 185, 129, 0.12)",
                        color: "var(--accent-teal)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <Database size={16} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--ink-primary)", margin: 0 }}>
                        Relational Database
                      </h3>
                      <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>PostgreSQL / Aurora / Cloud SQL</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRunSubsystemProbe("database")}
                    disabled={probingSubsystem === "database"}
                    className="btn-secondary"
                    style={{ padding: "5px 10px", fontSize: "11.5px", gap: "5px", color: "var(--ink-secondary)" }}
                  >
                    <Zap size={11} className={probingSubsystem === "database" ? "spin" : ""} style={{ color: "var(--accent-teal)" }} />
                    Test DB
                  </button>
                </div>

                {renderCloudSelector("database")}

                {/* Database Form Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
                  <div>
                    <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>
                      Host / Endpoint
                    </label>
                    <input
                      type="text"
                      className="prism-input mono"
                      value={formConfig.db_host ?? ""}
                      onChange={(e) => setFormConfig({ ...formConfig, db_host: e.target.value })}
                      placeholder="e.g. localhost or postgres-cluster.aws.internal"
                      style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "8px" }}>
                    <div>
                      <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>Port</label>
                      <input
                        type="text"
                        className="prism-input mono"
                        value={formConfig.db_port ?? ""}
                        onChange={(e) => setFormConfig({ ...formConfig, db_port: e.target.value })}
                        placeholder="5432"
                        style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                      />
                    </div>
                    <div>
                      <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>Database Name</label>
                      <input
                        type="text"
                        className="prism-input mono"
                        value={formConfig.db_name ?? ""}
                        onChange={(e) => setFormConfig({ ...formConfig, db_name: e.target.value })}
                        placeholder="prism_db"
                        style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div>
                      <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>User</label>
                      <input
                        type="text"
                        className="prism-input"
                        value={formConfig.db_user ?? ""}
                        onChange={(e) => setFormConfig({ ...formConfig, db_user: e.target.value })}
                        placeholder="Database user"
                        style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                      />
                    </div>
                    <div>
                      <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>SSL Mode</label>
                      <select
                        className="prism-input"
                        value={formConfig.db_ssl_mode || "disable"}
                        onChange={(e) => setFormConfig({ ...formConfig, db_ssl_mode: e.target.value })}
                        style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                      >
                        <option value="disable">disable (Local)</option>
                        <option value="require">require (Cloud TLS)</option>
                        <option value="verify-full">verify-full</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>Password</label>
                    <input
                      type={showSecrets ? "text" : "password"}
                      className="prism-input"
                      value={formConfig.db_password ?? ""}
                      onChange={(e) => setFormConfig({ ...formConfig, db_password: e.target.value })}
                      placeholder="Optional for local peer auth"
                      style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                    />
                  </div>
                </div>

                {/* Subsystem Live Probe Feedback */}
                {subsystemProbeResults.database && (
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: "var(--bg-input)",
                      border: `1px solid ${subsystemProbeResults.database.status === "SUCCESS" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                      fontSize: "11.5px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, color: subsystemProbeResults.database.status === "SUCCESS" ? "var(--accent-teal)" : "var(--accent-rose)" }}>
                        {subsystemProbeResults.database.status === "SUCCESS" ? "● ONLINE" : "▲ DEGRADED"} ({subsystemProbeResults.database.latency_ms}ms)
                      </span>
                      <span style={{ color: "var(--ink-tertiary)", fontSize: "11px" }}>{subsystemProbeResults.database.provider}</span>
                    </div>
                    <div style={{ color: "var(--ink-secondary)", marginTop: "3px" }}>
                      {subsystemProbeResults.database.message || subsystemProbeResults.database.error}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. CACHE GRID CARD */}
              <div
                className="prism-card"
                style={{
                  padding: "20px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                  borderRadius: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px"
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "8px",
                        background: "rgba(139, 125, 255, 0.12)",
                        color: "var(--accent-violet)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <Zap size={16} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--ink-primary)", margin: 0 }}>
                        Cache Grid
                      </h3>
                      <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>Redis / ElastiCache / Memorystore</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRunSubsystemProbe("cache")}
                    disabled={probingSubsystem === "cache"}
                    className="btn-secondary"
                    style={{ padding: "5px 10px", fontSize: "11.5px", gap: "5px", color: "var(--ink-secondary)" }}
                  >
                    <Zap size={11} className={probingSubsystem === "cache" ? "spin" : ""} style={{ color: "var(--accent-violet)" }} />
                    Test Cache
                  </button>
                </div>

                {renderCloudSelector("cache")}

                {/* Cache Form Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
                  <div>
                    <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>Provider Engine</label>
                    <input
                      type="text"
                      className="prism-input"
                      value={formConfig.cache_provider ?? ""}
                      onChange={(e) => setFormConfig({ ...formConfig, cache_provider: e.target.value })}
                      placeholder="IN_MEMORY, AWS_ELASTICACHE, AZURE_REDIS, GCP_MEMORYSTORE"
                      style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "8px" }}>
                    <div>
                      <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>Redis Host</label>
                      <input
                        type="text"
                        className="prism-input mono"
                        value={formConfig.cache_host ?? ""}
                        onChange={(e) => setFormConfig({ ...formConfig, cache_host: e.target.value })}
                        placeholder="e.g. localhost or redis.internal"
                        style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                      />
                    </div>
                    <div>
                      <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>Port</label>
                      <input
                        type="text"
                        className="prism-input mono"
                        value={formConfig.cache_port ?? ""}
                        onChange={(e) => setFormConfig({ ...formConfig, cache_port: e.target.value })}
                        placeholder="6379"
                        style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>Password / Token</label>
                    <input
                      type={showSecrets ? "text" : "password"}
                      className="prism-input"
                      value={formConfig.cache_password ?? ""}
                      onChange={(e) => setFormConfig({ ...formConfig, cache_password: e.target.value })}
                      placeholder="Leave blank for local in-memory grid"
                      style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                    <input
                      type="checkbox"
                      id="cache_ssl_box"
                      checked={formConfig.cache_ssl === "true" || formConfig.cache_ssl === true}
                      onChange={(e) => setFormConfig({ ...formConfig, cache_ssl: e.target.checked ? "true" : "false" })}
                    />
                    <label htmlFor="cache_ssl_box" style={{ color: "var(--ink-secondary)", cursor: "pointer", fontSize: "11.5px", fontWeight: 500 }}>
                      Enable TLS / SSL (Port 6380 / ElastiCache Transit Encryption)
                    </label>
                  </div>
                </div>

                {/* Subsystem Live Probe Feedback */}
                {subsystemProbeResults.cache && (
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: "var(--bg-input)",
                      border: `1px solid ${subsystemProbeResults.cache.status === "SUCCESS" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                      fontSize: "11.5px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, color: subsystemProbeResults.cache.status === "SUCCESS" ? "var(--accent-teal)" : "var(--accent-rose)" }}>
                        {subsystemProbeResults.cache.status === "SUCCESS" ? "● ONLINE" : "▲ DEGRADED"} ({subsystemProbeResults.cache.latency_ms}ms)
                      </span>
                      <span style={{ color: "var(--ink-tertiary)", fontSize: "11px" }}>{subsystemProbeResults.cache.provider}</span>
                    </div>
                    <div style={{ color: "var(--ink-secondary)", marginTop: "3px" }}>
                      {subsystemProbeResults.cache.message || subsystemProbeResults.cache.error}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. OBJECT STORAGE CARD */}
              <div
                className="prism-card"
                style={{
                  padding: "20px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                  borderRadius: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px"
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "8px",
                        background: "rgba(2, 132, 199, 0.12)",
                        color: "#0284c7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <HardDrive size={16} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--ink-primary)", margin: 0 }}>
                        Object Storage
                      </h3>
                      <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>S3 / Azure Blob / GCS / Local Mirror</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRunSubsystemProbe("storage")}
                    disabled={probingSubsystem === "storage"}
                    className="btn-secondary"
                    style={{ padding: "5px 10px", fontSize: "11.5px", gap: "5px", color: "var(--ink-secondary)" }}
                  >
                    <Zap size={11} className={probingSubsystem === "storage" ? "spin" : ""} style={{ color: "#0284c7" }} />
                    Test Storage
                  </button>
                </div>

                {renderCloudSelector("storage")}

                {/* Storage Form Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
                  <div>
                    <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>Storage Provider</label>
                    <input
                      type="text"
                      className="prism-input"
                      value={formConfig.storage_provider ?? ""}
                      onChange={(e) => setFormConfig({ ...formConfig, storage_provider: e.target.value })}
                      placeholder="LOCAL_MIRROR, AWS_S3, AZURE_BLOB, GOOGLE_CLOUD_STORAGE"
                      style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                    />
                  </div>

                  <div>
                    <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>Bucket / Container Name</label>
                    <input
                      type="text"
                      className="prism-input mono"
                      value={formConfig.storage_bucket ?? ""}
                      onChange={(e) => setFormConfig({ ...formConfig, storage_bucket: e.target.value })}
                      placeholder="e.g. evidence-bundles"
                      style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                    />
                  </div>

                  {/* AWS S3 Connection Details */}
                  {subsystemClouds.storage === "aws" && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div>
                          <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>AWS Region</label>
                          <input
                            type="text"
                            className="prism-input mono"
                            value={formConfig.aws_region ?? ""}
                            onChange={(e) => setFormConfig({ ...formConfig, aws_region: e.target.value })}
                            placeholder="us-east-1"
                            style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                          />
                        </div>
                        <div>
                          <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>Custom Endpoint</label>
                          <input
                            type="text"
                            className="prism-input mono"
                            value={formConfig.aws_endpoint_url ?? ""}
                            onChange={(e) => setFormConfig({ ...formConfig, aws_endpoint_url: e.target.value })}
                            placeholder="https://s3.us-east-1.amazonaws.com"
                            style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div>
                          <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>Access Key ID</label>
                          <input
                            type={showSecrets ? "text" : "password"}
                            className="prism-input"
                            value={formConfig.aws_access_key_id ?? ""}
                            onChange={(e) => setFormConfig({ ...formConfig, aws_access_key_id: e.target.value })}
                            placeholder="AKIA..."
                            style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                          />
                        </div>
                        <div>
                          <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>Secret Access Key</label>
                          <input
                            type={showSecrets ? "text" : "password"}
                            className="prism-input"
                            value={formConfig.aws_secret_access_key ?? ""}
                            onChange={(e) => setFormConfig({ ...formConfig, aws_secret_access_key: e.target.value })}
                            placeholder="Secret key..."
                            style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Azure Blob Connection Details */}
                  {subsystemClouds.storage === "azure" && (
                    <div>
                      <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>
                        Storage Connection String
                      </label>
                      <input
                        type={showSecrets ? "text" : "password"}
                        className="prism-input mono"
                        value={formConfig.storage_connection_string ?? ""}
                        onChange={(e) => setFormConfig({ ...formConfig, storage_connection_string: e.target.value })}
                        placeholder="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=..."
                        style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                      />
                    </div>
                  )}

                  {/* Local Storage Mirror Details */}
                  {subsystemClouds.storage === "local" && (
                    <div>
                      <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>Local Mirror Path</label>
                      <input
                        type="text"
                        className="prism-input mono"
                        value={formConfig.storage_local_path ?? "./storage/blobs"}
                        disabled
                        style={{ width: "100%", fontSize: "12px", padding: "7px 10px", background: "var(--bg-input)" }}
                      />
                    </div>
                  )}
                </div>

                {/* Subsystem Live Probe Feedback */}
                {subsystemProbeResults.storage && (
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: "var(--bg-input)",
                      border: `1px solid ${subsystemProbeResults.storage.status === "SUCCESS" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                      fontSize: "11.5px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, color: subsystemProbeResults.storage.status === "SUCCESS" ? "var(--accent-teal)" : "var(--accent-rose)" }}>
                        {subsystemProbeResults.storage.status === "SUCCESS" ? "● ONLINE" : "▲ DEGRADED"} ({subsystemProbeResults.storage.latency_ms}ms)
                      </span>
                      <span style={{ color: "var(--ink-tertiary)", fontSize: "11px" }}>{subsystemProbeResults.storage.provider}</span>
                    </div>
                    <div style={{ color: "var(--ink-secondary)", marginTop: "3px" }}>
                      {subsystemProbeResults.storage.message || subsystemProbeResults.storage.error}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Security & Observability Infrastructure (2 Columns Balanced) */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Lock size={15} style={{ color: "var(--accent-violet)" }} />
              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
                Security & Observability Infrastructure
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
              {/* 4. SECRETS VAULT CARD */}
              <div
                className="prism-card"
                style={{
                  padding: "20px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                  borderRadius: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px"
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "8px",
                        background: "rgba(16, 185, 129, 0.12)",
                        color: "var(--accent-teal)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <Lock size={16} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--ink-primary)", margin: 0 }}>
                        Secrets Vault
                      </h3>
                      <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>AWS Secrets / Key Vault / Local DB Keystore</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRunSubsystemProbe("vault")}
                    disabled={probingSubsystem === "vault"}
                    className="btn-secondary"
                    style={{ padding: "5px 10px", fontSize: "11.5px", gap: "5px", color: "var(--ink-secondary)" }}
                  >
                    <Zap size={11} className={probingSubsystem === "vault" ? "spin" : ""} style={{ color: "var(--accent-teal)" }} />
                    Test Vault
                  </button>
                </div>

                {renderCloudSelector("vault")}

                {/* Vault Form Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
                  <div>
                    <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>Vault Provider Engine</label>
                    <input
                      type="text"
                      className="prism-input"
                      value={formConfig.vault_provider ?? ""}
                      onChange={(e) => setFormConfig({ ...formConfig, vault_provider: e.target.value })}
                      placeholder="LOCAL_VAULT, AWS_SECRETS_MANAGER, AZURE_KEY_VAULT, GCP_SECRET_MANAGER"
                      style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                    />
                  </div>

                  <div>
                    <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>Vault Name / URL / Prefix</label>
                    <input
                      type="text"
                      className="prism-input mono"
                      value={formConfig.vault_name ?? ""}
                      onChange={(e) => setFormConfig({ ...formConfig, vault_name: e.target.value })}
                      placeholder="e.g. vault-name or key-vault-url"
                      style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                    />
                  </div>

                  <div style={{ padding: "10px 12px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", fontSize: "11.5px", color: "var(--ink-secondary)" }}>
                    <span style={{ color: "var(--accent-teal)", fontWeight: 600 }}>Security Guarantee: </span>
                    API keys are encrypted in PostgreSQL <code>iam.api_keys</code> with automatic fallbacks so external vault outages never cause unauthenticated crashes.
                  </div>
                </div>

                {/* Subsystem Live Probe Feedback */}
                {subsystemProbeResults.vault && (
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: "var(--bg-input)",
                      border: `1px solid ${subsystemProbeResults.vault.status === "SUCCESS" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                      fontSize: "11.5px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, color: subsystemProbeResults.vault.status === "SUCCESS" ? "var(--accent-teal)" : "var(--accent-rose)" }}>
                        {subsystemProbeResults.vault.status === "SUCCESS" ? "● ONLINE" : "▲ DEGRADED"} ({subsystemProbeResults.vault.latency_ms}ms)
                      </span>
                      <span style={{ color: "var(--ink-tertiary)", fontSize: "11px" }}>{subsystemProbeResults.vault.provider}</span>
                    </div>
                    <div style={{ color: "var(--ink-secondary)", marginTop: "3px" }}>
                      {subsystemProbeResults.vault.message || subsystemProbeResults.vault.error}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. MLFLOW OBSERVABILITY CARD */}
              <div
                className="prism-card"
                style={{
                  padding: "20px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                  borderRadius: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px"
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "8px",
                        background: "rgba(59, 130, 246, 0.12)",
                        color: "#3b82f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <Activity size={16} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--ink-primary)", margin: 0 }}>
                        MLflow Observability
                      </h3>
                      <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>Evaluation & Prompt Experiment Tracking</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRunSubsystemProbe("mlflow")}
                    disabled={probingSubsystem === "mlflow"}
                    className="btn-secondary"
                    style={{ padding: "5px 10px", fontSize: "11.5px", gap: "5px", color: "var(--ink-secondary)" }}
                  >
                    <Zap size={11} className={probingSubsystem === "mlflow" ? "spin" : ""} style={{ color: "#3b82f6" }} />
                    Test MLflow
                  </button>
                </div>

                {renderCloudSelector("mlflow")}

                {/* MLflow Form Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
                  <div>
                    <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>Tracking URI / Endpoint</label>
                    <input
                      type="text"
                      className="prism-input mono"
                      value={formConfig.mlflow_tracking_uri ?? ""}
                      onChange={(e) => setFormConfig({ ...formConfig, mlflow_tracking_uri: e.target.value })}
                      placeholder="sqlite:///mlflow.db or https://<mlflow-host>"
                      style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div>
                      <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>Experiment Name</label>
                      <input
                        type="text"
                        className="prism-input"
                        value={formConfig.mlflow_experiment_name ?? ""}
                        onChange={(e) => setFormConfig({ ...formConfig, mlflow_experiment_name: e.target.value })}
                        placeholder="sentrix_sre_platform"
                        style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                      />
                    </div>
                    <div>
                      <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>Tracking Token / Key</label>
                      <input
                        type={showSecrets ? "text" : "password"}
                        className="prism-input"
                        value={formConfig.mlflow_tracking_token ?? ""}
                        onChange={(e) => setFormConfig({ ...formConfig, mlflow_tracking_token: e.target.value })}
                        placeholder="Bearer token or leave blank"
                        style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "11.5px" }}>Artifact Root Location</label>
                    <input
                      type="text"
                      className="prism-input mono"
                      value={formConfig.mlflow_artifact_root ?? ""}
                      onChange={(e) => setFormConfig({ ...formConfig, mlflow_artifact_root: e.target.value })}
                      placeholder="./mlruns or storage URI"
                      style={{ width: "100%", fontSize: "12px", padding: "7px 10px" }}
                    />
                  </div>

                  <div style={{ padding: "10px 12px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", fontSize: "11.5px", color: "var(--ink-secondary)" }}>
                    <span style={{ color: "#3b82f6", fontWeight: 600 }}>Zero Data-Loss Mode: </span>
                    Autonomous skill runs and prompt evaluations log asynchronously with local SQLite recovery if remote tracking is offline.
                  </div>
                </div>

                {/* Subsystem Live Probe Feedback */}
                {subsystemProbeResults.mlflow && (
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: "var(--bg-input)",
                      border: `1px solid ${subsystemProbeResults.mlflow.status === "SUCCESS" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                      fontSize: "11.5px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, color: subsystemProbeResults.mlflow.status === "SUCCESS" ? "var(--accent-teal)" : "var(--accent-rose)" }}>
                        {subsystemProbeResults.mlflow.status === "SUCCESS" ? "● ONLINE" : "▲ DEGRADED"} ({subsystemProbeResults.mlflow.latency_ms}ms)
                      </span>
                      <span style={{ color: "var(--ink-tertiary)", fontSize: "11px" }}>{subsystemProbeResults.mlflow.provider}</span>
                    </div>
                    <div style={{ color: "var(--ink-secondary)", marginTop: "3px" }}>
                      {subsystemProbeResults.mlflow.message || subsystemProbeResults.mlflow.error}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Footer Bar */}
          <div
            className="prism-card"
            style={{
              padding: "16px 22px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-card)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
            }}
          >
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Active Composition Status
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-primary)", marginTop: "4px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span>DB: <strong style={{ color: "var(--accent-teal)" }}>{subsystemClouds.database.toUpperCase()}</strong></span>
                <span style={{ color: "var(--ink-tertiary)" }}>•</span>
                <span>Cache: <strong style={{ color: "var(--accent-violet)" }}>{subsystemClouds.cache.toUpperCase()}</strong></span>
                <span style={{ color: "var(--ink-tertiary)" }}>•</span>
                <span>Storage: <strong style={{ color: "#0284c7" }}>{subsystemClouds.storage.toUpperCase()}</strong></span>
                <span style={{ color: "var(--ink-tertiary)" }}>•</span>
                <span>Vault: <strong style={{ color: "var(--accent-teal)" }}>{subsystemClouds.vault.toUpperCase()}</strong></span>
                <span style={{ color: "var(--ink-tertiary)" }}>•</span>
                <span>MLflow: <strong style={{ color: "#3b82f6" }}>{(subsystemClouds.mlflow || "local").toUpperCase()}</strong></span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={() => setShowSecrets(!showSecrets)}
                type="button"
                className="btn-secondary"
                style={{ gap: "6px", fontSize: "12px", padding: "7px 14px", color: "var(--ink-secondary)" }}
              >
                {showSecrets ? <EyeOff size={13} /> : <Eye size={13} />}
                {showSecrets ? "Hide Secrets" : "Show Secrets"}
              </button>

              <button
                onClick={handleRunFullProbe}
                disabled={isProbing}
                type="button"
                className="btn-secondary"
                style={{ gap: "6px", fontSize: "12px", padding: "7px 16px", color: "var(--ink-primary)", border: "1px solid var(--border-card)" }}
              >
                <Zap size={13} style={{ color: "var(--accent-amber)" }} className={isProbing ? "spin" : ""} />
                {isProbing ? "Probing Multi-Cloud..." : "Probe All 5 Subsystems"}
              </button>

              <button
                onClick={handleApplyConfig}
                disabled={isApplying}
                type="button"
                className="btn-primary"
                style={{
                  gap: "6px",
                  fontSize: "12.5px",
                  padding: "7px 18px",
                  background: "var(--accent-teal)",
                  color: "#ffffff",
                  fontWeight: 600,
                  border: "none",
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)"
                }}
              >
                <Check size={14} className={isApplying ? "spin" : ""} />
                {isApplying ? "Synchronizing Platform..." : "Apply as Active Platform"}
              </button>
            </div>
          </div>

          {/* Diagnostic Probe Results Banner */}
          {diagnosticResults && (
            <div
              className="prism-card"
              style={{
                padding: "18px 22px",
                background: "var(--bg-elevated)",
                border: `1px solid ${diagnosticResults.overall_status === "HEALTHY" ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
                borderRadius: "10px",
                display: "flex",
                flexDirection: "column",
                gap: "14px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {diagnosticResults.overall_status === "HEALTHY" ? (
                    <CheckCircle2 size={18} style={{ color: "var(--accent-teal)" }} />
                  ) : (
                    <AlertTriangle size={18} style={{ color: "var(--accent-amber)" }} />
                  )}
                  <div>
                    <h3 style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--ink-primary)", margin: 0 }}>
                      Live Multi-Cloud Diagnostic Probe Results ({diagnosticResults.total_diagnostic_time_ms}ms total execution)
                    </h3>
                    <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)" }}>
                      Timestamp: {diagnosticResults.timestamp}
                    </span>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "20px",
                    background: diagnosticResults.overall_status === "HEALTHY" ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                    color: diagnosticResults.overall_status === "HEALTHY" ? "var(--accent-teal)" : "var(--accent-amber)",
                    border: `1px solid ${diagnosticResults.overall_status === "HEALTHY" ? "rgba(16, 185, 129, 0.25)" : "rgba(245, 158, 11, 0.25)"}`
                  }}
                >
                  OVERALL: {diagnosticResults.overall_status}
                </span>
              </div>

              {/* Subsystems Breakdown Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
                {Object.entries(diagnosticResults.subsystems || {}).map(([key, info]) => {
                  const isOk = info.status === "SUCCESS" || info.status === "OPERATIONAL";
                  return (
                    <div
                      key={key}
                      style={{
                        padding: "12px",
                        background: "var(--bg-card)",
                        borderRadius: "8px",
                        border: "1px solid var(--border-subtle)",
                        fontSize: "12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 600, textTransform: "capitalize", color: "var(--ink-primary)" }}>
                          {key.replace("_", " ")}
                        </span>
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: "11.5px",
                            color: isOk ? "var(--accent-teal)" : "var(--accent-rose)"
                          }}
                        >
                          {info.status} ({info.latency_ms}ms)
                        </span>
                      </div>

                      <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", wordBreak: "break-all" }} className="mono">
                        {info.target || info.provider}
                      </div>

                      <p style={{ fontSize: "11.5px", color: "var(--ink-secondary)", margin: 0, lineHeight: 1.4 }}>
                        {info.message || info.error || "Subsystem responding."}
                      </p>

                      {info.fallback && (
                        <div style={{ fontSize: "10.5px", color: "var(--accent-violet)", fontWeight: 500 }}>
                          Fallback Active: {info.fallback}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Zero-Downtime Resilience Architecture Callout */}
          <div
            className="prism-card"
            style={{
              padding: "18px 22px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: "10px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <ShieldCheck size={16} style={{ color: "var(--accent-teal)" }} />
              <h3 style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--ink-primary)", margin: 0 }}>
                Zero-Downtime Multi-Cloud Fallback Architecture
              </h3>
            </div>
            <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", lineHeight: 1.6, margin: 0 }}>
              Sentrix enables true hybrid cloud orchestration. You can run your Relational Database on AWS Aurora, Cache Grid on Azure Redis, Object Storage on Amazon S3 or Google Cloud Storage, and Secrets on Local Vault. If any cloud provider suffers network partitioning, firewall blockades, or credential expiration, Sentrix automatically engages high-performance local in-memory caching and local storage mirrors with zero downtime.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: Core Platform Daemons (Clean 3-column responsive layout with zero overflow) */}
      {activeTab === "services" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)", margin: 0 }}>
                Platform Daemon Registry & Telemetry Probes
              </h2>
              <p style={{ fontSize: "12px", color: "var(--ink-secondary)", margin: "2px 0 0 0" }}>
                Continuous health verification across platform databases, caching grids, storage endpoints, and ADK runtime engines.
              </p>
            </div>
            <span className="badge badge-teal">
              {services.filter((s) => s.status === "OPERATIONAL" || s.status === "HEALTHY").length} / {services.length} Healthy
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: "16px"
            }}
          >
            {services.map((svc, idx) => {
              const isHealthy = svc.status === "HEALTHY" || svc.status === "OPERATIONAL";
              const sName = (svc.name || "").toLowerCase();
              const Icon = sName.includes("postgres") || sName.includes("relational")
                ? Database
                : sName.includes("cache")
                ? Zap
                : sName.includes("storage")
                ? HardDrive
                : sName.includes("vault")
                ? Lock
                : sName.includes("mlflow")
                ? Activity
                : sName.includes("connector")
                ? Globe
                : Cpu;

              const iconColor = sName.includes("postgres")
                ? "var(--accent-teal)"
                : sName.includes("cache")
                ? "var(--accent-violet)"
                : sName.includes("storage")
                ? "#0284c7"
                : sName.includes("vault")
                ? "var(--accent-teal)"
                : sName.includes("mlflow")
                ? "#3b82f6"
                : sName.includes("connector")
                ? "var(--accent-amber)"
                : "var(--prism-pink)";

              return (
                <div
                  key={idx}
                  className="prism-card"
                  style={{
                    padding: "18px 20px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-card)",
                    borderRadius: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.03)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          background: "var(--bg-input)",
                          color: iconColor,
                          border: "1px solid var(--border-subtle)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink-primary)", margin: 0 }}>
                          {svc.name}
                        </h3>
                        <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "2px" }}>
                          Core Platform Subsystem
                        </div>
                      </div>
                    </div>

                    <span
                      className={`badge ${isHealthy ? "badge-teal" : "badge-rose"}`}
                      style={{ flexShrink: 0 }}
                    >
                      {svc.status || "OPERATIONAL"}
                    </span>
                  </div>

                  <p style={{ fontSize: "12px", color: "var(--ink-secondary)", lineHeight: 1.5, margin: 0 }}>
                    {svc.details || "Operating with zero errors."}
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "8px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      textAlign: "center",
                      fontSize: "11.5px"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>Probe State</div>
                      <div style={{ fontWeight: 600, color: isHealthy ? "var(--accent-teal)" : "var(--accent-rose)", marginTop: "2px" }}>
                        {svc.status}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>Latency</div>
                      <div className="mono" style={{ fontWeight: 600, color: "var(--ink-primary)", marginTop: "2px" }}>
                        {svc.latency || "<1ms"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>Health Check</div>
                      <div style={{ fontWeight: 600, color: isHealthy ? "var(--accent-teal)" : "var(--accent-rose)", marginTop: "2px" }}>
                        {isHealthy ? "Passed" : "Failing"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Local Storage Reflection Hub */}
      {activeTab === "storage" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Storage Header Card */}
          <div
            className="prism-card"
            style={{
              padding: "18px 22px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: "10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px"
            }}
          >
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Local Filesystem Mirror Root
              </div>
              <div className="mono" style={{ fontSize: "14px", fontWeight: 600, color: "var(--accent-teal)", marginTop: "3px" }}>
                {storageOverview?.storage_root || "./storage"}
              </div>
            </div>
            <div style={{ display: "flex", gap: "24px" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: 600 }}>Mirrored Blobs</div>
                <div className="mono" style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink-primary)" }}>{storageOverview?.blob_mirror?.total_files || 0}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", textTransform: "uppercase", fontWeight: 600 }}>Footprint</div>
                <div className="mono" style={{ fontSize: "18px", fontWeight: 700, color: "var(--accent-violet)" }}>{formatBytes(storageOverview?.blob_mirror?.total_bytes)}</div>
              </div>
            </div>
          </div>

          {/* Containers Breakdown Pills */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            {Object.entries(storageOverview?.blob_mirror?.containers || {}).map(([cName, count]) => (
              <div
                key={cName}
                onClick={() => setSelectedStorageContainer(selectedStorageContainer === cName ? "ALL" : cName)}
                style={{
                  padding: "12px 14px",
                  background: selectedStorageContainer === cName ? "rgba(16, 185, 129, 0.08)" : "var(--bg-card)",
                  borderRadius: "8px",
                  border: selectedStorageContainer === cName ? "1px solid var(--accent-teal)" : "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "var(--accent-teal)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <Folder size={16} />
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-primary)" }}>{cName}</div>
                  <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>{count} mirrored blobs</div>
                </div>
              </div>
            ))}
          </div>

          {/* Mirrored Files Table with Search */}
          <div
            className="prism-card"
            style={{
              padding: "20px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: "10px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--ink-primary)", margin: 0 }}>
                Reflected Files in Local Storage Folder ({filteredStorageFiles.length} files)
              </h3>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ position: "relative" }}>
                  <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--ink-tertiary)" }} />
                  <input
                    type="text"
                    className="prism-input"
                    value={storageSearch}
                    onChange={(e) => setStorageSearch(e.target.value)}
                    placeholder="Search files or paths..."
                    style={{ fontSize: "12px", padding: "6px 10px 6px 30px", width: "220px" }}
                  />
                  {storageSearch && (
                    <button
                      onClick={() => setStorageSearch("")}
                      style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--ink-tertiary)", cursor: "pointer", padding: 0 }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {selectedStorageContainer !== "ALL" && (
                  <button
                    onClick={() => setSelectedStorageContainer("ALL")}
                    className="btn-secondary"
                    style={{ fontSize: "11px", padding: "5px 8px" }}
                  >
                    Reset: {selectedStorageContainer} <X size={10} style={{ marginLeft: "4px" }} />
                  </button>
                )}
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--ink-tertiary)" }}>
                    <th style={{ padding: "8px 12px", fontWeight: 600 }}>Container</th>
                    <th style={{ padding: "8px 12px", fontWeight: 600 }}>Filename</th>
                    <th style={{ padding: "8px 12px", fontWeight: 600 }}>Relative Path</th>
                    <th style={{ padding: "8px 12px", fontWeight: 600 }}>Size</th>
                    <th style={{ padding: "8px 12px", fontWeight: 600 }}>Modified At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStorageFiles.map((file, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: "var(--bg-input)",
                            color: "var(--ink-secondary)",
                            border: "1px solid var(--border-subtle)"
                          }}
                        >
                          {file.container}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--ink-primary)" }}>
                        {file.filename}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "11.5px", color: "var(--ink-tertiary)" }} className="mono">
                        {file.relative_path || file.path || file.filename}
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--accent-violet)", fontWeight: 500 }} className="mono">
                        {formatBytes(file.size_bytes)}
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--ink-secondary)", fontSize: "11.5px" }}>
                        {new Date(file.modified_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {filteredStorageFiles.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: "28px", textAlign: "center", color: "var(--ink-tertiary)" }}>
                        No mirrored storage files match your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Backups & Disaster Recovery */}
      {activeTab === "backups" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            className="prism-card"
            style={{
              padding: "20px 24px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px"
            }}
          >
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink-primary)", margin: 0 }}>
                Platform Disaster Recovery & Database Snapshots
              </h3>
              <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", margin: "4px 0 0 0" }}>
                Every snapshot serializes 17 platform tables with SHA-256 cryptographic verification and local mirror preservation.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--ink-tertiary)" }} />
                <input
                  type="text"
                  className="prism-input"
                  value={backupSearch}
                  onChange={(e) => setBackupSearch(e.target.value)}
                  placeholder="Search snapshot files..."
                  style={{ fontSize: "12px", padding: "6px 10px 6px 30px", width: "200px" }}
                />
              </div>

              <button
                onClick={() => setShowCreateBackupModal(true)}
                disabled={isCreatingBackup}
                className="btn-primary"
                style={{
                  gap: "6px",
                  fontSize: "12.5px",
                  padding: "8px 16px",
                  fontWeight: 600,
                  background: "var(--accent-teal)",
                  border: "none",
                  color: "#ffffff"
                }}
              >
                <Archive size={14} className={isCreatingBackup ? "spin" : ""} />
                {isCreatingBackup ? "Exporting Tables..." : "Create Platform Backup"}
              </button>
            </div>
          </div>

          <div
            className="prism-card"
            style={{
              padding: "20px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: "10px"
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--ink-tertiary)" }}>
                    <th style={{ padding: "8px 12px", fontWeight: 600 }}>Snapshot File</th>
                    <th style={{ padding: "8px 12px", fontWeight: 600 }}>Description</th>
                    <th style={{ padding: "8px 12px", fontWeight: 600 }}>Rows</th>
                    <th style={{ padding: "8px 12px", fontWeight: 600 }}>Size</th>
                    <th style={{ padding: "8px 12px", fontWeight: 600 }}>SHA-256 Checksum</th>
                    <th style={{ padding: "8px 12px", fontWeight: 600 }}>Timestamp</th>
                    <th style={{ padding: "8px 12px", fontWeight: 600, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBackups.map((b, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--accent-teal)" }} className="mono">
                        {b.filename}
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--ink-primary)" }}>
                        {b.description || "Database Snapshot"}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: "rgba(16, 185, 129, 0.12)",
                            color: "var(--accent-teal)",
                            border: "1px solid rgba(16, 185, 129, 0.25)"
                          }}
                        >
                          {b.total_rows !== undefined && b.total_rows !== null ? `${b.total_rows} rows` : "Snapshot"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--ink-primary)", fontWeight: 500 }} className="mono">
                        {formatBytes(b.size_bytes)}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "11px", color: "var(--ink-tertiary)" }}>
                        {b.sha256 ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span className="mono">{b.sha256.slice(0, 12)}...</span>
                            <button
                              onClick={() => copyToClipboard(b.sha256, b.filename)}
                              className="btn-ghost"
                              style={{ padding: "2px 4px", fontSize: "10px" }}
                              title="Copy full SHA-256 checksum"
                            >
                              {copiedChecksum === b.filename ? <Check size={11} color="var(--accent-teal)" /> : <Copy size={11} />}
                            </button>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--ink-secondary)", fontSize: "11.5px" }}>
                        {new Date(b.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                          <a
                            href={getBackupDownloadUrl(b.filename)}
                            download={b.filename}
                            className="btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "11.5px", gap: "4px", textDecoration: "none", color: "var(--ink-secondary)" }}
                          >
                            <Download size={12} />
                            Download
                          </a>
                          <button
                            onClick={() => setShowRestoreModal(b.filename)}
                            disabled={restoringBackup === b.filename}
                            className="btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "11.5px", gap: "4px", color: "var(--accent-rose)" }}
                          >
                            <RotateCw size={12} className={restoringBackup === b.filename ? "spin" : ""} />
                            {restoringBackup === b.filename ? "Restoring..." : "Restore"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredBackups.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: "28px", textAlign: "center", color: "var(--ink-tertiary)" }}>
                        No platform backups recorded yet. Click "Create Platform Backup" to generate one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Backup Snapshot */}
      {showCreateBackupModal && (
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
          onClick={() => setShowCreateBackupModal(false)}
        >
          <div
            className="prism-card"
            style={{
              width: "100%",
              maxWidth: "480px",
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
                <Archive size={20} color="var(--accent-teal)" />
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink-primary)", margin: 0 }}>
                  Create Platform Snapshot
                </h2>
              </div>
              <button onClick={() => setShowCreateBackupModal(false)} className="btn-ghost" style={{ padding: "4px" }}>
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", margin: 0 }}>
              This operation serializes all 17 database tables, computes SHA-256 cryptographic verification checksums, and syncs to your configured storage mirror.
            </p>

            <form onSubmit={handleCreateBackupSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", marginBottom: "6px" }}>
                  Snapshot Description
                </label>
                <input
                  type="text"
                  className="prism-input"
                  value={backupDescription}
                  onChange={(e) => setBackupDescription(e.target.value)}
                  placeholder="e.g. Pre-Deployment Baseline Snapshot"
                  autoFocus
                  style={{ width: "100%", fontSize: "12.5px", padding: "8px 12px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateBackupModal(false)}
                  className="btn-secondary"
                  style={{ fontSize: "12.5px", padding: "7px 14px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBackup}
                  className="btn-primary"
                  style={{ fontSize: "12.5px", padding: "7px 18px", background: "var(--accent-teal)", border: "none" }}
                >
                  {isCreatingBackup ? "Exporting..." : "Generate Backup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Restore Backup Confirmation */}
      {showRestoreModal && (
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
          onClick={() => setShowRestoreModal(null)}
        >
          <div
            className="prism-card"
            style={{
              width: "100%",
              maxWidth: "480px",
              background: "var(--bg-card)",
              border: "2px solid var(--accent-rose)",
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
                <AlertOctagon size={22} color="var(--accent-rose)" />
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--accent-rose)", margin: 0 }}>
                  Confirm Platform Database Restore
                </h2>
              </div>
              <button onClick={() => setShowRestoreModal(null)} className="btn-ghost" style={{ padding: "4px" }}>
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", lineHeight: 1.5, margin: 0 }}>
              Are you sure you want to restore the platform database from <strong style={{ color: "var(--accent-teal)" }} className="mono">{showRestoreModal}</strong>?
            </p>

            <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", fontSize: "12px", color: "var(--ink-primary)" }}>
              Existing records in all 17 tables will be upserted to match this snapshot. This cannot be undone.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setShowRestoreModal(null)}
                className="btn-secondary"
                style={{ fontSize: "12.5px", padding: "7px 14px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRestoreBackupSubmit(showRestoreModal)}
                className="btn-danger"
                style={{ fontSize: "12.5px", padding: "7px 18px", fontWeight: 600 }}
              >
                Proceed with Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
