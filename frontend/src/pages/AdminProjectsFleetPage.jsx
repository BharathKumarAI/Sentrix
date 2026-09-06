import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Layers,
  Search,
  Filter,
  Plus,
  Star,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Database,
  Cpu,
  RotateCw,
  Wrench,
  Settings,
  X,
  Server,
  Tag,
  Trash2,
  Power,
  PowerOff,
  AlertTriangle
} from "lucide-react";
import {
  fetchProjects,
  createProject,
  fetchProjectSummary,
  toggleFollowProject,
  updateProjectStatus,
  deleteProject
} from "../api/client";
import { emitAdminSync, useAdminSync } from "../context/AdminSyncContext";

export function AdminProjectsFleetPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // Sync across tabs & pages
  useAdminSync((event) => {
    if (event?.type && event.type.startsWith("PROJECT_")) {
      loadLiveProjects();
    }
  });

  useEffect(() => {
    if (location.search.includes("create=true")) {
      setShowNewProjectModal(true);
    }
  }, [location.search]);

  // New Project Form State
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTier, setNewTier] = useState(""); // Optional (default none)
  const [newDefaultEnv, setNewDefaultEnv] = useState("prod"); // Optional
  const [newEnvironments, setNewEnvironments] = useState(["dev", "staging", "prod"]);
  const [newEnvInput, setNewEnvInput] = useState("");
  const [ticketingSystem, setTicketingSystem] = useState("jira"); // "jira" | "servicenow" | "custom"
  const [enableSla, setEnableSla] = useState(true);
  const [slaConfig, setSlaConfig] = useState({
    Blocker: "2h",
    Critical: "4h",
    Major: "8h",
    Minor: "24h",
    Trivial: "48h"
  });
  const [newPriorityKey, setNewPriorityKey] = useState("");
  const [newPrioritySla, setNewPrioritySla] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Lifecycle & Destructive Delete States
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteConfirmKey, setDeleteConfirmKey] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadLiveProjects();
  }, []);

  const loadLiveProjects = async () => {
    setIsLoading(true);
    try {
      const data = await fetchProjects();
      if (Array.isArray(data) && data.length > 0) {
        // Build base project list from backend
        const base = data.map((p) => ({
          id: p.id,
          project_key: p.project_key,
          name: p.name,
          description: p.description || "Enterprise monitored service engine.",
          status: p.status || "HEALTHY",
          environments: p.environments || [p.default_environment || "prod"],
          isFollowed: p.is_followed || false,
          criticalityTier: p.criticality_tier,
          ticketingSystem: p.ticketing_system,
          slaConfig: p.sla_config || {},
          // Placeholders while summaries load
          agentsCount: 0,
          openIncidents: 0,
          runs24h: 0,
          lastTriage: "—"
        }));
        setProjects(base);

        // Batch-fetch per-project summaries
        const summaries = await Promise.allSettled(
          base.map((p) => fetchProjectSummary(p.id))
        );
        setProjects(base.map((p, i) => {
          const s = summaries[i].status === "fulfilled" ? summaries[i].value : {};
          return {
            ...p,
            agentsCount: s.agentsCount ?? 0,
            openIncidents: s.openIncidents ?? 0,
            runs24h: s.runs24h ?? 0,
            lastTriage: s.lastTriage ?? "—",
          };
        }));
      }
    } catch (e) {
      console.error("Failed to load projects", e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFollow = async (id) => {
    try {
      await toggleFollowProject(id);
    } catch (e) {
      console.warn("Follow toggle failed", e);
    }
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFollowed: !p.isFollowed } : p))
    );
  };

  const handleToggleProjectStatus = async (proj) => {
    const isCurrentlyDisabled = proj.status === "DISABLED";
    const targetStatus = isCurrentlyDisabled ? "ACTIVE" : "DISABLED";
    setStatusUpdatingId(proj.id);
    try {
      await updateProjectStatus(proj.id, targetStatus);
      emitAdminSync("PROJECT_UPDATED", { projectId: proj.id, status: targetStatus });
      setActionMessage(`Project ${proj.project_key} is now ${targetStatus}.`);
      setTimeout(() => setActionMessage(""), 4500);
      await loadLiveProjects();
    } catch (err) {
      console.error("Failed to toggle project status:", err);
      setActionMessage(`Error: ${err.message}`);
      setTimeout(() => setActionMessage(""), 5000);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleOpenDeleteModal = (proj) => {
    setProjectToDelete(proj);
    setDeleteConfirmKey("");
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    if (deleteConfirmKey.trim().toUpperCase() !== projectToDelete.project_key.toUpperCase()) {
      setDeleteError(`Please type "${projectToDelete.project_key}" exactly to confirm deletion.`);
      return;
    }

    setIsDeleting(true);
    setDeleteError("");
    try {
      await deleteProject(projectToDelete.id);
      const deletedKey = projectToDelete.project_key;
      emitAdminSync("PROJECT_DELETED", { projectId: projectToDelete.id, projectKey: deletedKey });
      setProjectToDelete(null);
      setActionMessage(`Project ${deletedKey} and all associated telemetry records permanently deleted.`);
      setTimeout(() => setActionMessage(""), 5000);
      await loadLiveProjects();
    } catch (err) {
      console.error("Failed to delete project:", err);
      setDeleteError(err.message || "Failed to delete project from control plane.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTicketingSystemChange = (system) => {
    setTicketingSystem(system);
    if (system === "jira") {
      setSlaConfig({
        Blocker: "2h",
        Critical: "4h",
        Major: "8h",
        Minor: "24h",
        Trivial: "48h"
      });
    } else if (system === "servicenow") {
      setSlaConfig({
        "P1 - Critical": "1h",
        "P2 - High": "4h",
        "P3 - Moderate": "12h",
        "P4 - Low": "24h",
        "P5 - Planning": "48h"
      });
    } else if (system === "custom") {
      setSlaConfig({
        P1: "1h",
        P2: "4h",
        P3: "24h",
        P4: "72h"
      });
    }
  };

  const handleUpdatePrioritySla = (prio, val) => {
    setSlaConfig((prev) => ({
      ...prev,
      [prio]: val
    }));
  };

  const handleRemovePriority = (prio) => {
    setSlaConfig((prev) => {
      const copy = { ...prev };
      delete copy[prio];
      return copy;
    });
  };

  const handleAddCustomPriority = () => {
    const key = newPriorityKey.trim();
    const val = newPrioritySla.trim();
    if (key && val) {
      setSlaConfig((prev) => ({
        ...prev,
        [key]: val
      }));
      setNewPriorityKey("");
      setNewPrioritySla("");
    }
  };

  const handleAddEnvironment = () => {
    const clean = newEnvInput.trim().toLowerCase();
    if (clean && !newEnvironments.includes(clean)) {
      setNewEnvironments([...newEnvironments, clean]);
      setNewEnvInput("");
    }
  };

  const handleRemoveEnvironment = (env) => {
    if (newEnvironments.length > 1) {
      const filtered = newEnvironments.filter((e) => e !== env);
      setNewEnvironments(filtered);
      if (newDefaultEnv === env) {
        setNewDefaultEnv(filtered[0] || "");
      }
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    const cleanKey = newKey.trim().toUpperCase();
    const cleanName = newName.trim();

    if (!cleanKey || !cleanName) {
      setErrorMessage("Project Key and Project Name are required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await createProject({
        project_key: cleanKey,
        name: cleanName,
        description: newDesc.trim() || `${cleanName} enterprise service tier`,
        criticality_tier: newTier || null,
        default_environment: newDefaultEnv || null,
        environments: newEnvironments,
        ticketing_system: ticketingSystem,
        sla_config: enableSla ? slaConfig : {}
      });

      setShowNewProjectModal(false);
      setNewKey("");
      setNewName("");
      setNewDesc("");
      setNewTier("");
      setNewDefaultEnv("prod");
      setNewEnvironments(["dev", "staging", "prod"]);

      // Reload fleet & emit sync across admin panel
      emitAdminSync("PROJECT_CREATED", { projectKey: cleanKey });
      await loadLiveProjects();

      // Immediately navigate to the Setup Studio for this new project!
      navigate(`/p/${cleanKey}/setup`);
    } catch (err) {
      console.error("Failed to create project", err);
      setErrorMessage(err.message || "Failed to register project on platform.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onlineProjectsCount = projects.filter(
    (p) => (p.status || "").toUpperCase() !== "DISABLED" && (p.status || "").toUpperCase() !== "ARCHIVED"
  ).length;
  const disabledProjectsCount = projects.filter(
    (p) => (p.status || "").toUpperCase() === "DISABLED" || (p.status || "").toUpperCase() === "ARCHIVED"
  ).length;

  const filteredProjects = projects.filter((p) => {
    const isDis = (p.status || "").toUpperCase() === "DISABLED" || (p.status || "").toUpperCase() === "ARCHIVED";
    if (statusFilter === "ONLINE" && isDis) return false;
    if (statusFilter === "DISABLED" && !isDis) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.project_key.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return true;
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
            <Layers size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                PLATFORM ADMIN • FLEET DIRECTORY
              </span>
              <span className="badge badge-teal">{onlineProjectsCount} Enterprise Project{onlineProjectsCount === 1 ? "" : "s"} Online</span>
              {disabledProjectsCount > 0 && (
                <span className="badge badge-rose">{disabledProjectsCount} Disabled</span>
              )}
              <span className="badge badge-magenta">Multi-Tenant Isolation</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Enterprise Projects Fleet
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Register new enterprise projects, configure JQL queues, environment matrices, and autonomous SRE agent dispatch across platforms.
            </p>
          </div>
        </div>

        {/* Primary Action Button: Add New Project */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="btn-primary"
            style={{ gap: "6px" }}
          >
            <Plus size={15} /> Add New Project
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            background: actionMessage.startsWith("Error") ? "rgba(244, 63, 94, 0.15)" : "rgba(20, 184, 166, 0.15)",
            border: actionMessage.startsWith("Error") ? "1px solid rgba(244, 63, 94, 0.35)" : "1px solid rgba(20, 184, 166, 0.35)",
            color: actionMessage.startsWith("Error") ? "var(--accent-rose)" : "var(--accent-teal)",
            fontSize: "12.5px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage("")} className="btn-ghost" style={{ padding: "2px" }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap"
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: "280px" }}>
          <Search size={14} color="var(--ink-tertiary)" style={{ position: "absolute", left: "12px", top: "10px" }} />
          <input
            type="text"
            placeholder="Filter projects by key, service name, or scope..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 34px",
              borderRadius: "6px",
              background: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              color: "var(--ink-primary)",
              fontSize: "12px"
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {[
              { id: "ALL", label: `All (${projects.length})` },
              { id: "ONLINE", label: `Online (${onlineProjectsCount})` },
              ...(disabledProjectsCount > 0 ? [{ id: "DISABLED", label: `Disabled (${disabledProjectsCount})` }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: "6px 12px",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: statusFilter === tab.id ? "1px solid var(--prism-magenta)" : "1px solid var(--border-subtle)",
                  background: statusFilter === tab.id ? "rgba(225, 29, 72, 0.14)" : "var(--bg-card)",
                  color: statusFilter === tab.id ? "var(--prism-pink)" : "var(--ink-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowNewProjectModal(true)}
            className="btn-secondary"
            style={{ padding: "7px 14px", fontSize: "12px", gap: "6px" }}
          >
            <Plus size={13} /> Register Project
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
        {filteredProjects.map((proj) => {
          const isDisabled = proj.status === "DISABLED";
          const isUpdating = statusUpdatingId === proj.id;

          return (
            <div
              key={proj.id}
              className="prism-card"
              style={{
                padding: "20px",
                background: isDisabled ? "rgba(18, 18, 24, 0.72)" : "var(--bg-card)",
                border: isDisabled ? "1px dashed rgba(244, 63, 94, 0.45)" : "1px solid var(--border-card)",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                opacity: isDisabled ? 0.8 : 1,
                transition: "all 0.18s ease"
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: isDisabled ? "var(--ink-muted)" : "var(--prism-pink)", fontSize: "13.5px" }}>
                      {proj.project_key}
                    </span>
                    <span className={`badge ${isDisabled ? "badge-rose" : proj.status === "HEALTHY" ? "badge-teal" : "badge-amber"}`}>
                      {proj.status}
                    </span>
                    {proj.criticalityTier && (
                      <span className="badge badge-rose" style={{ fontSize: "10px" }}>
                        {proj.criticalityTier}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: isDisabled ? "var(--ink-secondary)" : "var(--ink-primary)", marginTop: "4px" }}>
                    {proj.name}
                  </h3>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {/* Disable / Enable Button */}
                  <button
                    onClick={() => handleToggleProjectStatus(proj)}
                    disabled={isUpdating}
                    className="btn-ghost"
                    style={{
                      padding: "4px 8px",
                      fontSize: "11px",
                      color: isDisabled ? "var(--accent-teal)" : "var(--accent-amber)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                    title={isDisabled ? "Re-enable project operations" : "Disable project operations"}
                  >
                    {isDisabled ? <Power size={13} /> : <PowerOff size={13} />}
                    <span>{isUpdating ? "..." : isDisabled ? "Enable" : "Disable"}</span>
                  </button>

                  {/* Permanently Delete Project (Platform Admin) */}
                  <button
                    onClick={() => handleOpenDeleteModal(proj)}
                    className="btn-ghost"
                    style={{
                      padding: "4px 6px",
                      color: "var(--accent-rose)",
                      display: "flex",
                      alignItems: "center"
                    }}
                    title="Permanently Delete Project (Platform Admin)"
                  >
                    <Trash2 size={14} />
                  </button>

                  {/* Follow Star */}
                  <button
                    onClick={() => toggleFollow(proj.id)}
                    className="btn-ghost"
                    style={{ padding: "4px", color: proj.isFollowed ? "var(--accent-amber)" : "var(--ink-muted)" }}
                    title={proj.isFollowed ? "Following project" : "Follow project"}
                  >
                    <Star size={16} fill={proj.isFollowed ? "var(--accent-amber)" : "none"} />
                  </button>
                </div>
              </div>

            <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", lineHeight: 1.5 }}>
              {proj.description}
            </p>

            {/* Environments & SLA Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>Environments:</span>
              {(proj.environments || ["dev", "staging", "prod"]).map((env) => (
                <span key={env} className="badge badge-teal" style={{ textTransform: "uppercase", fontSize: "10px" }}>
                  {env}
                </span>
              ))}
              {proj.slaConfig && Object.keys(proj.slaConfig).length > 0 && (
                <span
                  className="badge badge-violet"
                  style={{ fontSize: "9.5px", marginLeft: "auto" }}
                  title={Object.entries(proj.slaConfig).map(([k, v]) => `${k}: ${v}`).join(", ")}
                >
                  SLA: {Object.keys(proj.slaConfig).slice(0, 2).map(k => `${k} ${proj.slaConfig[k]}`).join(" • ")}
                </span>
              )}
            </div>

            {/* Stats Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", padding: "8px 12px", borderRadius: "8px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", textAlign: "center", fontSize: "12px" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>Agents</div>
                <div style={{ fontWeight: 700, color: "var(--ink-primary)" }}>{proj.agentsCount ?? 0}</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>Open Incidents</div>
                <div style={{ fontWeight: 700, color: (proj.openIncidents || 0) > 0 ? "var(--accent-rose)" : "var(--accent-teal)" }}>
                  {proj.openIncidents || 0}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>24h Runs</div>
                <div style={{ fontWeight: 700, color: "var(--accent-teal)" }}>{proj.runs24h ?? 0}</div>
              </div>
            </div>

            {/* Card Actions: Open Workspace and Open Setup Studio */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px", gap: "8px" }}>
              <button
                onClick={() => navigate(`/p/${proj.project_key}/setup`)}
                className="btn-ghost"
                style={{ fontSize: "11.5px", gap: "5px", color: "var(--prism-pink)" }}
                title="Configure JQL, Connectors & Runbooks"
              >
                <Wrench size={13} /> Setup Studio
              </button>

              <button
                onClick={() => navigate(`/p/${proj.project_key}/overview`)}
                className="btn-secondary"
                style={{ padding: "5px 12px", fontSize: "12px", gap: "6px" }}
              >
                Workspace <ArrowRight size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>

      {/* =================================================================
          ADMIN ADD NEW PROJECT MODAL
          ================================================================= */}
      {showNewProjectModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.78)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px"
          }}
        >
          <div
            className="prism-card"
            style={{
              width: "100%",
              maxWidth: "580px",
              padding: "24px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              boxShadow: "0 0 30px rgba(0,0,0,0.5)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--prism-gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <Plus size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink-primary)", margin: 0 }}>
                    Register New Enterprise Project
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--ink-tertiary)", margin: "2px 0 0 0" }}>
                    Configure multi-tenant isolation and initialize autonomous SRE governance.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowNewProjectModal(false)} className="btn-ghost" style={{ padding: "4px" }}>
                <X size={16} />
              </button>
            </div>

            {errorMessage && (
              <div style={{ padding: "8px 12px", borderRadius: "6px", background: "rgba(244, 63, 94, 0.12)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "var(--accent-rose)", fontSize: "12px" }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateProject} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11.5px", color: "var(--ink-secondary)", fontWeight: 600 }}>Project Key *:</label>
                  <input
                    type="text"
                    placeholder="e.g. PAYMENTS"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value.toUpperCase())}
                    required
                    style={{ padding: "8px 12px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--prism-pink)", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11.5px", color: "var(--ink-secondary)", fontWeight: 600 }}>Project Name *:</label>
                  <input
                    type="text"
                    placeholder="e.g. Payment Gateway & Webhooks"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    style={{ padding: "8px 12px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)", fontSize: "12px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11.5px", color: "var(--ink-secondary)", fontWeight: 600 }}>Description:</label>
                <textarea
                  rows={2}
                  placeholder="Primary services, database clusters, and monitored SLA dependencies."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)", fontSize: "12px", resize: "none" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={{ fontSize: "11.5px", color: "var(--ink-secondary)", fontWeight: 600 }}>Criticality Tier:</label>
                    <span style={{ fontSize: "10px", color: "var(--ink-muted)" }}>Optional</span>
                  </div>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)", fontSize: "12px" }}
                  >
                    <option value="">None / Optional</option>
                    <option value="Tier-1 Mission Critical">Tier-1 Mission Critical (SLA 99.99%)</option>
                    <option value="Tier-2 High Availability">Tier-2 High Availability (SLA 99.9%)</option>
                    <option value="Tier-3 Standard">Tier-3 Standard Internal Service</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={{ fontSize: "11.5px", color: "var(--ink-secondary)", fontWeight: 600 }}>Default Environment:</label>
                    <span style={{ fontSize: "10px", color: "var(--ink-muted)" }}>Optional</span>
                  </div>
                  <select
                    value={newDefaultEnv}
                    onChange={(e) => setNewDefaultEnv(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)", fontSize: "12px" }}
                  >
                    <option value="">None / Optional</option>
                    {newEnvironments.map((env) => (
                      <option key={env} value={env}>{env.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Environments Tags */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "11.5px", color: "var(--ink-secondary)", fontWeight: 600 }}>Environments Matrix:</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {newEnvironments.map((env) => (
                    <span
                      key={env}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        color: "var(--ink-primary)"
                      }}
                    >
                      {env}
                      {newEnvironments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEnvironment(env)}
                          style={{ background: "transparent", border: "none", color: "var(--ink-muted)", cursor: "pointer" }}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
                  <input
                    type="text"
                    placeholder="Add environment (e.g. uat, sandbox)"
                    value={newEnvInput}
                    onChange={(e) => setNewEnvInput(e.target.value)}
                    style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)", fontSize: "11.5px" }}
                  />
                  <button
                    type="button"
                    onClick={handleAddEnvironment}
                    className="btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "11.5px", gap: "4px" }}
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>

              {/* Incident Priority & SLA Matrix Section */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px 14px", borderRadius: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", marginTop: "2px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-primary)" }}>Incident Priority & SLA Matrix</span>
                      <span className="badge badge-teal" style={{ fontSize: "9.5px" }}>Optional</span>
                    </div>
                    <p style={{ fontSize: "11px", color: "var(--ink-secondary)", marginTop: "2px" }}>
                      Target resolution SLA durations by incident priority (Jira, ServiceNow, or custom).
                    </p>
                  </div>

                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--ink-secondary)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={enableSla}
                      onChange={(e) => setEnableSla(e.target.checked)}
                      style={{ accentColor: "var(--prism-pink)" }}
                    />
                    Enable SLA Tracking
                  </label>
                </div>

                {enableSla && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                    {/* Ticketing Template Selection */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Schema:</span>
                      {[
                        { id: "jira", label: "Atlassian Jira (Blocker, Critical...)" },
                        { id: "servicenow", label: "ServiceNow (P1, P2...)" },
                        { id: "custom", label: "Standard SRE / Custom" }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleTicketingSystemChange(t.id)}
                          style={{
                            padding: "4px 10px",
                            fontSize: "11px",
                            borderRadius: "6px",
                            border: ticketingSystem === t.id ? "1px solid var(--prism-magenta)" : "1px solid var(--border-subtle)",
                            background: ticketingSystem === t.id ? "rgba(225, 29, 72, 0.12)" : "var(--bg-input)",
                            color: ticketingSystem === t.id ? "var(--prism-pink)" : "var(--ink-secondary)",
                            cursor: "pointer",
                            fontWeight: 600
                          }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Priority SLA Rows */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px", maxHeight: "140px", overflowY: "auto", paddingRight: "4px" }}>
                      {Object.entries(slaConfig).map(([prio, val]) => (
                        <div
                          key={prio}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            background: "var(--bg-input)",
                            border: "1px solid var(--border-subtle)"
                          }}
                        >
                          <span style={{ fontSize: "11.5px", fontWeight: 700, color: prio.toLowerCase().includes("blocker") || prio.includes("1") ? "var(--accent-rose)" : "var(--ink-primary)" }}>
                            {prio}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <input
                              type="text"
                              value={val}
                              onChange={(e) => handleUpdatePrioritySla(prio, e.target.value)}
                              placeholder="e.g. 2h, 4h"
                              style={{
                                width: "48px",
                                padding: "2px 6px",
                                fontSize: "11px",
                                borderRadius: "4px",
                                background: "var(--bg-elevated)",
                                border: "1px solid var(--border-subtle)",
                                color: "var(--accent-teal)",
                                textAlign: "center",
                                fontFamily: "'JetBrains Mono', monospace"
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePriority(prio)}
                              style={{ background: "transparent", border: "none", color: "var(--ink-muted)", cursor: "pointer", fontSize: "13px" }}
                              title="Remove priority"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Custom Priority Row */}
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "8px" }}>
                      <input
                        type="text"
                        placeholder="Priority name (e.g. P0, Urgent)"
                        value={newPriorityKey}
                        onChange={(e) => setNewPriorityKey(e.target.value)}
                        style={{ flex: 1, padding: "4px 8px", fontSize: "11px", borderRadius: "4px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)" }}
                      />
                      <input
                        type="text"
                        placeholder="SLA (e.g. 30m, 2h)"
                        value={newPrioritySla}
                        onChange={(e) => setNewPrioritySla(e.target.value)}
                        style={{ width: "80px", padding: "4px 8px", fontSize: "11px", borderRadius: "4px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)", fontFamily: "'JetBrains Mono', monospace" }}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomPriority}
                        className="btn-secondary"
                        style={{ padding: "4px 10px", fontSize: "11px" }}
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="btn-ghost"
                  style={{ fontSize: "12px" }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ gap: "6px", padding: "8px 16px" }}
                >
                  {isSubmitting ? <RotateCw size={13} className="spin" /> : <Plus size={13} />}
                  {isSubmitting ? "Registering..." : "Create & Launch Setup Studio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================
          DESTRUCTIVE DELETE PROJECT MODAL (PLATFORM ADMINS ONLY)
          ================================================================= */}
      {projectToDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.82)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 300,
            padding: "20px"
          }}
        >
          <div
            className="prism-card"
            style={{
              width: "100%",
              maxWidth: "540px",
              padding: "26px",
              background: "var(--bg-card)",
              border: "1px solid rgba(244, 63, 94, 0.4)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              boxShadow: "0 0 40px rgba(244, 63, 94, 0.25)"
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "rgba(244, 63, 94, 0.15)",
                  border: "1px solid rgba(244, 63, 94, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-rose)"
                }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ fontSize: "17px", fontWeight: 800, color: "var(--ink-primary)", margin: 0 }}>
                      Permanently Delete Project
                    </h3>
                    <span className="badge badge-rose" style={{ fontSize: "10px", fontWeight: 700 }}>
                      DESTRUCTIVE
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--ink-tertiary)", margin: "3px 0 0 0" }}>
                    Platform Administrator authorization required.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setProjectToDelete(null)}
                className="btn-ghost"
                style={{ padding: "4px" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Critical Warning Callout */}
            <div style={{
              padding: "14px",
              borderRadius: "8px",
              background: "rgba(244, 63, 94, 0.08)",
              border: "1px solid rgba(244, 63, 94, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              <div style={{ fontSize: "12.5px", color: "var(--accent-rose)", fontWeight: 600, lineHeight: 1.5 }}>
                You are about to delete <strong style={{ color: "var(--ink-primary)" }}>{projectToDelete.name}</strong> (<span style={{ color: "var(--prism-pink)", fontFamily: "'JetBrains Mono', monospace" }}>{projectToDelete.project_key}</span>).
              </div>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "var(--ink-secondary)", lineHeight: 1.6 }}>
                <li>All multi-tenant environments and VPC boundaries will be deleted.</li>
                <li>All connected datasources, telemetry tool bindings, and skill runbooks will be unlinked.</li>
                <li>All historical autonomous triage runs, evidence bundles, and execution snapshots will be permanently erased.</li>
                <li>This action is recorded in the immutable platform audit ledger.</li>
              </ul>
            </div>

            {deleteError && (
              <div style={{
                padding: "8px 12px",
                borderRadius: "6px",
                background: "rgba(244, 63, 94, 0.15)",
                border: "1px solid rgba(244, 63, 94, 0.35)",
                color: "var(--accent-rose)",
                fontSize: "12px"
              }}>
                {deleteError}
              </div>
            )}

            {/* Confirmation Key Input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "var(--ink-secondary)" }}>
                To verify, type <strong style={{ color: "var(--prism-pink)", fontFamily: "'JetBrains Mono', monospace" }}>{projectToDelete.project_key}</strong> below:
              </label>
              <input
                type="text"
                placeholder={projectToDelete.project_key}
                value={deleteConfirmKey}
                onChange={(e) => setDeleteConfirmKey(e.target.value)}
                style={{
                  padding: "9px 12px",
                  borderRadius: "6px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--ink-input)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "13px",
                  fontWeight: 700
                }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setProjectToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting || deleteConfirmKey.trim().toUpperCase() !== projectToDelete.project_key.toUpperCase()}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid rgba(244, 63, 94, 0.6)",
                  background: deleteConfirmKey.trim().toUpperCase() === projectToDelete.project_key.toUpperCase()
                    ? "linear-gradient(135deg, #e11d48, #be123c)"
                    : "rgba(244, 63, 94, 0.2)",
                  color: "#fff",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: deleteConfirmKey.trim().toUpperCase() === projectToDelete.project_key.toUpperCase() && !isDeleting
                    ? "pointer"
                    : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: deleteConfirmKey.trim().toUpperCase() === projectToDelete.project_key.toUpperCase() ? 1 : 0.5
                }}
              >
                <Trash2 size={14} />
                {isDeleting ? "Permanently Deleting..." : "Permanently Delete Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
