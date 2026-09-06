import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Star, 
  CheckCircle2, 
  Sliders, 
  Copy, 
  MoreHorizontal,
  Bookmark,
  X,
  Trash2,
  Edit3,
  Layers,
  Zap,
  Check,
  Save,
  Tag,
  FolderKanban,
  RotateCw,
  Code2,
  AlertCircle,
  Play
} from "lucide-react";
import { 
  fetchAdminPrompts, 
  fetchAdminPromptStats,
  createAdminPrompt, 
  updateAdminPrompt,
  deleteAdminPrompt,
  toggleFavoritePrompt,
  fetchProjects,
  testPromptRun
} from "../api/client";

export function AdminPromptsPage() {
  const [prompts, setPrompts] = useState([]);
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState("ALL"); // ALL, PLATFORM, PROJECT
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  
  // Notification Toast
  const [notification, setNotification] = useState(null);

  // Selected prompt for Slide-over Drawer
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    scope: "Platform",
    category: "Triage",
    status: "Active",
    project_id: "",
    system_directives: "",
    user_template: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newForm, setNewForm] = useState({
    name: "",
    description: "",
    scope: "Platform",
    category: "Triage",
    status: "Active",
    project_id: "",
    system_directives: "",
    user_template: ""
  });

  const showToast = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Load live data from PostgreSQL control plane backend
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [promptsData, statsData, projectsData] = await Promise.all([
        fetchAdminPrompts({
          scope: scopeFilter !== "ALL" ? scopeFilter : undefined,
          category: categoryFilter !== "ALL" ? categoryFilter : undefined,
          search: searchQuery.trim() || undefined,
          project_id: projectFilter !== "ALL" ? projectFilter : undefined
        }),
        fetchAdminPromptStats(),
        fetchProjects()
      ]);

      if (Array.isArray(promptsData)) {
        setPrompts(promptsData);
      }
      if (statsData && !statsData.error) {
        setStats(statsData);
      }
      if (Array.isArray(projectsData)) {
        setProjects(projectsData);
        if (projectsData.length > 0 && !newForm.project_id) {
          setNewForm((prev) => ({ ...prev, project_id: projectsData[0].id }));
        }
      }
    } catch (err) {
      console.warn("Failed to load prompt control plane data:", err);
      showToast("Error connecting to prompt control plane backend", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-polling every 6 seconds so background SRE agent runs update counts live
    const interval = setInterval(() => {
      fetchAdminPromptStats().then((s) => s && !s.error && setStats(s));
      fetchAdminPrompts({
        scope: scopeFilter !== "ALL" ? scopeFilter : undefined,
        category: categoryFilter !== "ALL" ? categoryFilter : undefined,
        search: searchQuery.trim() || undefined,
        project_id: projectFilter !== "ALL" ? projectFilter : undefined
      }).then((d) => Array.isArray(d) && setPrompts(d));
    }, 6000);
    return () => clearInterval(interval);
  }, [scopeFilter, categoryFilter, projectFilter]);

  const [testPrompt, setTestPrompt] = useState(null);
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState("");
  const [testRunning, setTestRunning] = useState(false);
  const handleTestRun = (e, id, name) => {
    e.stopPropagation();
    setTestPrompt({ id, name });
    setTestInput("");
    setTestOutput("");
  };
  const executeTest = async (e) => {
    e.preventDefault();
    if (!testInput.trim() || testRunning) return;
    setTestRunning(true);
    setTestOutput("");
    try {
      const res = await testPromptRun(testPrompt.id, testInput);
      setTestOutput(res.output);
      await loadData();
    } catch (err) {
      setTestOutput(err.message);
    } finally {
      setTestRunning(false);
    }
  };

  // Favorite toggle
  const handleToggleFavorite = async (e, promptId) => {
    e.stopPropagation();
    try {
      const res = await toggleFavoritePrompt(promptId);
      if (res && res.id) {
        setPrompts((prev) =>
          prev.map((p) => (p.id === promptId ? { ...p, favorite: res.is_favorite } : p))
        );
        if (selectedPrompt && selectedPrompt.id === promptId) {
          setSelectedPrompt((prev) => ({ ...prev, favorite: res.is_favorite }));
        }
        // Refresh live stats
        fetchAdminPromptStats().then((s) => s && !s.error && setStats(s));
      }
    } catch (err) {
      console.warn("Toggle favorite error:", err);
    }
  };

  // Select prompt for Drawer
  const handleSelectPrompt = (prompt) => {
    setSelectedPrompt(prompt);
    setEditForm({
      name: prompt.name || "",
      description: prompt.desc || prompt.description || "",
      scope: prompt.scope || "Platform",
      category: prompt.category || "Triage",
      status: prompt.status || "Active",
      project_id: prompt.project_id || "",
      system_directives: prompt.system_directives || "",
      user_template: prompt.user_template || ""
    });
    setIsEditing(false);
  };

  // Save changes to prompt
  const handleSavePrompt = async (e) => {
    e.preventDefault();
    if (!selectedPrompt) return;
    setIsSaving(true);
    try {
      const res = await updateAdminPrompt(selectedPrompt.id, editForm);
      if (res && res.id) {
        showToast(`Updated prompt template "${res.name}" successfully!`);
        setIsEditing(false);
        loadData();
        // Update local selected
        setSelectedPrompt((prev) => ({
          ...prev,
          ...res,
          desc: res.description
        }));
      } else {
        showToast(res.error || "Failed to update prompt", "error");
      }
    } catch (err) {
      console.error("Save prompt error:", err);
      showToast("Error updating prompt template in PostgreSQL", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete prompt
  const handleDeletePrompt = async (promptId, promptName) => {
    if (!window.confirm(`Are you sure you want to delete prompt template "${promptName}"?`)) return;
    try {
      const res = await deleteAdminPrompt(promptId);
      if (res && res.status === "deleted") {
        showToast(`Prompt "${promptName}" removed from active catalog`);
        if (selectedPrompt && selectedPrompt.id === promptId) {
          setSelectedPrompt(null);
        }
        loadData();
      } else {
        showToast(res.error || "Failed to delete prompt", "error");
      }
    } catch (err) {
      console.error("Delete prompt error:", err);
      showToast("Error deleting prompt template", "error");
    }
  };

  // Create prompt submit
  const handleCreatePrompt = async (e) => {
    e.preventDefault();
    if (!newForm.name.trim()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: newForm.name,
        description: newForm.description,
        scope: newForm.scope,
        category: newForm.category,
        status: newForm.status,
        project_id: newForm.scope === "Project" ? newForm.project_id : null,
        system_directives: newForm.system_directives,
        user_template: newForm.user_template
      };
      const res = await createAdminPrompt(payload);
      if (res && res.id) {
        showToast(`Created prompt "${res.name}" in control plane database!`);
        setShowCreateModal(false);
        setNewForm({
          name: "",
          description: "",
          scope: "Platform",
          category: "Triage",
          status: "Active",
          project_id: projects.length > 0 ? projects[0].id : "",
          system_directives: "",
          user_template: ""
        });
        loadData();
      } else {
        showToast(res.error || "Failed to create prompt", "error");
      }
    } catch (err) {
      console.error("Create prompt error:", err);
      showToast("Error creating prompt template", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered prompt list for client search
  const filteredPrompts = prompts.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.desc && p.desc.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.tagged_to && p.tagged_to.toLowerCase().includes(q))
    );
  });

  // KPI calculations purely from live backend stats or active records
  const liveTotalPrompts = stats ? stats.total_prompts : prompts.length;
  const liveActivePrompts = stats ? stats.active_prompts : prompts.filter((p) => p.status === "Active").length;
  const liveExecutionsTotal = stats ? stats.total_executions : prompts.reduce((acc, p) => acc + (p.executions_raw || 0), 0);
  const liveExecutionsFormatted = liveExecutionsTotal.toLocaleString();
  const liveExecutionsCompact = stats?.total_executions_compact || (liveExecutionsTotal >= 1000 ? `${(liveExecutionsTotal / 1000).toFixed(1)}K` : String(liveExecutionsTotal));
  const liveUsedInProjects = stats ? stats.used_in_projects : projects.length;
  const liveFavorites = stats ? stats.favorites_count : prompts.filter((p) => p.favorite).length;

  const kpis = [
    { label: "Total Prompts", value: String(liveTotalPrompts), sub: "Live PostgreSQL Control Plane", icon: FileText, color: "var(--prism-pink)" },
    { label: "Active Directives", value: String(liveActivePrompts), sub: "Operational Fleet Prompts", icon: CheckCircle2, color: "var(--accent-teal)" },
    { label: "Fleet Executions", value: liveExecutionsFormatted, sub: `${liveExecutionsCompact} Synthesized Runs`, icon: Zap, color: "var(--accent-violet)" },
    { label: "Associated Projects", value: String(liveUsedInProjects), sub: "Platform & Project Scopes", icon: FolderKanban, color: "var(--accent-blue)" },
    { label: "Favorite Templates", value: String(liveFavorites), sub: "Starred Guidelines", icon: Star, color: "var(--accent-amber)" },
  ];

  const categories = ["ALL", "Triage", "Analysis", "Summary", "Communication", "Risk"];

  return (
    <div style={{
      padding: "24px 32px",
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      overflowY: "auto",
      minHeight: "100%",
      boxSizing: "border-box",
      position: "relative"
    }}>
      {testPrompt && (
        <div role="presentation" style={{ position: "fixed", inset: 0, background: "#0009", zIndex: 10000, display: "grid", placeItems: "center", padding: 24 }}>
          <form role="dialog" aria-modal="true" aria-labelledby="prompt-test-title" onSubmit={executeTest}
            onKeyDown={(e) => { if (e.key === "Escape" && !testRunning) setTestPrompt(null); }}
            className="prism-card" style={{ padding: 24, width: "min(640px, 100%)", maxHeight: "85vh", overflowY: "auto", background: "var(--bg-card)" }}>
            <h2 id="prompt-test-title">Test {testPrompt.name}</h2>
            <p>Runs the saved template with your configured default model. Provider charges may apply.</p>
            <label htmlFor="prompt-test-input">Input</label>
            <textarea id="prompt-test-input" autoFocus required maxLength={32000} value={testInput}
              onChange={(e) => setTestInput(e.target.value)} rows={6} style={{ width: "100%", margin: "12px 0" }} />
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-primary" disabled={testRunning || !testInput.trim()}>{testRunning ? "Running…" : "Run test"}</button>
              <button className="btn-secondary" type="button" disabled={testRunning} onClick={() => setTestPrompt(null)}>Close</button>
            </div>
            <pre role="status" style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>{testOutput}</pre>
          </form>
        </div>
      )}
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
          {notification.type === "error" ? <AlertCircle size={16} /> : <Check size={16} />}
          {notification.msg}
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
            <FileText size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                PLATFORM ADMIN • PROMPT DIRECTIVES
              </span>
              <span className="badge badge-teal">Live Database</span>
              <span className="badge badge-magenta">ADK Directive Router</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              System Prompt & Agent Directive Control Plane
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Dynamic prompt templates executed by Google ADK agents across Platform-wide and Project-scoped investigation pipelines.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            className="btn-ghost"
            onClick={loadData}
            title="Reload live prompts and execution statistics"
            style={{ gap: "6px", fontSize: "12px", padding: "8px 12px" }}
          >
            <RotateCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>

          <button 
            className="btn-primary" 
            onClick={() => setShowCreateModal(true)} 
            style={{ gap: "6px", fontSize: "12px", padding: "8px 16px" }}
          >
            <Plus size={15} /> New System Prompt
          </button>
        </div>
      </div>

      {/* KPI cards sourced from persisted execution data */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div 
              key={k.label} 
              className="prism-card" 
              style={{ 
                padding: "16px 18px", 
                display: "flex", 
                alignItems: "center", 
                gap: "14px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-card)"
              }}
            >
              <div style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: k.color
              }}>
                <Icon size={20} />
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: "600", textTransform: "uppercase" }}>
                  {k.label}
                </div>
                <div className="mono" style={{ fontSize: "20px", fontWeight: "800", color: "var(--ink-primary)", marginTop: "2px" }}>
                  {k.value}
                </div>
                <div style={{ fontSize: "10px", color: "var(--accent-teal)", marginTop: "2px" }}>
                  {k.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter & Control Bar */}
      <div 
        className="prism-card" 
        style={{ 
          padding: "14px 18px", 
          display: "flex", 
          flexDirection: "column", 
          gap: "12px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          {/* Scope Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", marginRight: "4px" }}>
              SCOPE:
            </span>
            {[
              { id: "ALL", label: "All Scopes" },
              { id: "Platform", label: "Platform Fleet" },
              { id: "Project", label: "Project Scoped" }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setScopeFilter(s.id)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: scopeFilter === s.id ? "600" : "500",
                  color: scopeFilter === s.id ? "#fff" : "var(--ink-secondary)",
                  background: scopeFilter === s.id ? "var(--prism-pink)" : "rgba(255,255,255,0.05)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Project Filter Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)" }}>
              PROJECT:
            </label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              style={{
                padding: "6px 12px",
                background: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "6px",
                color: "var(--ink-input)",
                fontSize: "12px",
                minWidth: "160px"
              }}
            >
              <option value="ALL">All Projects</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.key} - {proj.name}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div style={{ position: "relative", width: "240px" }}>
              <Search size={14} color="var(--ink-tertiary)" style={{ position: "absolute", left: "10px", top: "9px" }} />
              <input
                type="text"
                placeholder="Search templates & directives..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px 6px 30px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "6px",
                  color: "var(--ink-input)",
                  fontSize: "12px"
                }}
              />
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", marginRight: "4px" }}>
            CATEGORY:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: "3px 10px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: categoryFilter === cat ? "600" : "500",
                color: categoryFilter === cat ? "var(--prism-pink)" : "var(--ink-tertiary)",
                background: categoryFilter === cat ? "rgba(225, 29, 72, 0.12)" : "transparent",
                border: categoryFilter === cat ? "1px solid rgba(225, 29, 72, 0.3)" : "1px solid transparent",
                cursor: "pointer"
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Container */}
      <div 
        className="prism-card" 
        style={{ 
          padding: "0", 
          display: "flex", 
          flexDirection: "column", 
          overflow: "hidden",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)"
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ 
                borderBottom: "1px solid var(--border-subtle)", 
                textAlign: "left", 
                color: "var(--ink-tertiary)",
                background: "var(--bg-card)"
              }}>
                <th style={{ padding: "12px 14px" }}>Prompt & Directive Name</th>
                <th style={{ padding: "12px 14px" }}>Scope & Tagging</th>
                <th style={{ padding: "12px 14px" }}>Category</th>
                <th style={{ padding: "12px 14px" }}>Owner</th>
                <th style={{ padding: "12px 14px" }}>Status</th>
                <th style={{ padding: "12px 14px" }}>Live Executions</th>
                <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && prompts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "36px", color: "var(--ink-tertiary)" }}>
                    <RotateCw size={18} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                    Loading prompt templates from PostgreSQL...
                  </td>
                </tr>
              ) : filteredPrompts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "36px", color: "var(--ink-tertiary)" }}>
                    No prompt templates match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredPrompts.map((p) => {
                  const isSelected = selectedPrompt && selectedPrompt.id === p.id;
                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => handleSelectPrompt(p)}
                      style={{ 
                        borderBottom: "1px solid var(--border-subtle)",
                        cursor: "pointer",
                        background: isSelected ? "rgba(225, 29, 72, 0.08)" : "transparent",
                        transition: "background 0.15s ease"
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "var(--bg-card-hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {/* Name & Favorite */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                          <button 
                            onClick={(e) => handleToggleFavorite(e, p.id)}
                            style={{ 
                              background: "none", 
                              border: "none", 
                              cursor: "pointer", 
                              padding: "2px",
                              marginTop: "2px"
                            }}
                            title={p.favorite ? "Unstar template" : "Star template"}
                          >
                            <Star 
                              size={15} 
                              fill={p.favorite ? "var(--accent-amber)" : "none"} 
                              color={p.favorite ? "var(--accent-amber)" : "var(--ink-tertiary)"} 
                            />
                          </button>
                          <div>
                            <div style={{ fontWeight: "600", color: "var(--ink-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                              {p.name}
                              {p.used_by && (
                                <span style={{ fontSize: "10px", color: "var(--ink-tertiary)", fontWeight: "normal" }}>
                                  ({p.used_by})
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--ink-secondary)", marginTop: "2px", maxWidth: "340px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {p.desc || p.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Scope & Tagging */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <span className={`badge ${p.scope === "Platform" ? "badge-magenta" : "badge-blue"}`} style={{ width: "fit-content" }}>
                            {p.tag_badge || p.scope}
                          </span>
                          <span style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>
                            {p.tagged_to || (p.scope === "Platform" ? "Fleet Platform" : "Project Specific")}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: "12px 14px" }}>
                        <span className="badge badge-violet">{p.category}</span>
                      </td>

                      {/* Owner */}
                      <td style={{ padding: "12px 14px", color: "var(--ink-secondary)" }}>
                        {p.owner}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "12px 14px" }}>
                        <span className={`badge ${p.status === "Active" ? "badge-teal" : "badge-amber"}`}>
                          {p.status}
                        </span>
                      </td>

                      {/* Executions */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Zap size={14} color="var(--accent-violet)" />
                          <span className="mono" style={{ fontWeight: 700, color: "var(--ink-primary)", fontSize: "13px" }}>
                            {p.executions}
                          </span>
                          {p.executions_compact && (
                            <span style={{
                              fontSize: "10px",
                              color: "var(--ink-tertiary)",
                              background: "rgba(255,255,255,0.05)",
                              padding: "1px 5px",
                              borderRadius: "4px",
                              fontFamily: "monospace"
                            }}>
                              {p.executions_compact}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "12px 14px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                          <button
                            onClick={(e) => handleTestRun(e, p.id, p.name)}
                            className="btn-ghost"
                            style={{ padding: "5px 8px", fontSize: "11px", gap: "4px", color: "var(--accent-violet)" }}
                            title="Run a live agent test (records execution in PostgreSQL)"
                          >
                            <Play size={11} fill="var(--accent-violet)" /> Test Run
                          </button>
                          <button
                            onClick={() => handleSelectPrompt(p)}
                            className="btn-ghost"
                            style={{ padding: "5px 8px", fontSize: "11px", gap: "4px" }}
                            title="Inspect & edit prompt"
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeletePrompt(p.id, p.name)}
                            className="btn-ghost"
                            style={{ padding: "5px 8px", fontSize: "11px", color: "var(--prism-pink)" }}
                            title="Delete prompt template"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Inspection & Edit Drawer */}
      {selectedPrompt && (
        <div style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "560px",
          background: "var(--bg-elevated)",
          borderLeft: "1px solid var(--border-subtle)",
          boxShadow: "-12px 0 36px rgba(0, 0, 0, 0.25)",
          zIndex: 1100,
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.25s ease-out"
        }}>
          {/* Drawer Header */}
          <div style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-card)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Code2 size={18} color="var(--prism-pink)" />
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--ink-primary)", margin: 0 }}>
                  Prompt Specification
                </h3>
                <span className="mono" style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                  {selectedPrompt.id}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={(e) => handleToggleFavorite(e, selectedPrompt.id)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                title="Toggle favorite"
              >
                <Star 
                  size={16} 
                  fill={selectedPrompt.favorite ? "var(--accent-amber)" : "none"} 
                  color={selectedPrompt.favorite ? "var(--accent-amber)" : "var(--ink-tertiary)"} 
                />
              </button>
              <button
                onClick={() => setSelectedPrompt(null)}
                style={{ background: "none", border: "none", color: "var(--ink-tertiary)", cursor: "pointer", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Drawer Body Form */}
          <form onSubmit={handleSavePrompt} style={{ padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
            {/* Name */}
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", display: "block", marginBottom: "6px" }}>
                PROMPT NAME
              </label>
              <input
                type="text"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "6px",
                  color: "var(--ink-input)",
                  fontSize: "13px",
                  fontWeight: 600
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", display: "block", marginBottom: "6px" }}>
                DESCRIPTION
              </label>
              <textarea
                rows={2}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "6px",
                  color: "var(--ink-input)",
                  fontSize: "12px",
                  resize: "vertical"
                }}
              />
            </div>

            {/* Scope & Project Selection */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", display: "block", marginBottom: "6px" }}>
                  SCOPE
                </label>
                <select
                  value={editForm.scope}
                  onChange={(e) => setEditForm({ ...editForm, scope: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    color: "var(--ink-input)",
                    fontSize: "12px"
                  }}
                >
                  <option value="Platform">Platform Fleet</option>
                  <option value="Project">Project Scoped</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", display: "block", marginBottom: "6px" }}>
                  CATEGORY
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    color: "var(--ink-input)",
                    fontSize: "12px"
                  }}
                >
                  <option value="Triage">Triage</option>
                  <option value="Analysis">Analysis</option>
                  <option value="Summary">Summary</option>
                  <option value="Communication">Communication</option>
                  <option value="Risk">Risk Assessment</option>
                </select>
              </div>
            </div>

            {/* Target Project (Conditional if Project scoped) */}
            {editForm.scope === "Project" && (
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", display: "block", marginBottom: "6px" }}>
                  TARGET ASSOCIATED PROJECT
                </label>
                <select
                  value={editForm.project_id || ""}
                  onChange={(e) => setEditForm({ ...editForm, project_id: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    color: "var(--ink-input)",
                    fontSize: "12px"
                  }}
                >
                  <option value="">Select Target Project...</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.key} - {proj.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status & Live Executions summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", display: "block", marginBottom: "6px" }}>
                  STATUS
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    color: "var(--ink-input)",
                    fontSize: "12px"
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", display: "block", marginBottom: "6px" }}>
                  LIVE RUN COUNT
                </label>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "6px"
                }}>
                  <span className="mono" style={{ color: "var(--accent-teal)", fontSize: "13px", fontWeight: 700 }}>
                    {selectedPrompt.executions || "0"} Runs
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleTestRun(e, selectedPrompt.id, selectedPrompt.name)}
                    className="btn-secondary"
                    style={{ padding: "4px 8px", fontSize: "10.5px", gap: "4px" }}
                  >
                    <Play size={11} fill="currentColor" /> Test prompt
                  </button>
                </div>
              </div>
            </div>

            {/* System Directives */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)" }}>
                  SYSTEM DIRECTIVES (ADK AGENT PROMPT)
                </label>
                <span style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>
                  Injected into agent model context
                </span>
              </div>
              <textarea
                rows={8}
                value={editForm.system_directives}
                onChange={(e) => setEditForm({ ...editForm, system_directives: e.target.value })}
                placeholder="Autonomous agent system instructions and guidelines..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "6px",
                  color: "var(--ink-input)",
                  fontFamily: "monospace",
                  fontSize: "11.5px",
                  lineHeight: "1.5",
                  resize: "vertical"
                }}
              />
            </div>

            {/* User Template */}
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", display: "block", marginBottom: "6px" }}>
                USER TEMPLATE (OPTIONAL CONTEXT FORMATTER)
              </label>
              <textarea
                rows={4}
                value={editForm.user_template}
                onChange={(e) => setEditForm({ ...editForm, user_template: e.target.value })}
                placeholder="Template structure e.g. Context: {incident_data} Task: {task_request}..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "6px",
                  color: "var(--ink-input)",
                  fontFamily: "monospace",
                  fontSize: "11.5px",
                  lineHeight: "1.5",
                  resize: "vertical"
                }}
              />
            </div>

            {/* Footer Buttons */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              paddingTop: "14px", 
              borderTop: "1px solid var(--border-subtle)", 
              marginTop: "auto" 
            }}>
              <button
                type="button"
                onClick={() => handleDeletePrompt(selectedPrompt.id, selectedPrompt.name)}
                className="btn-ghost"
                style={{ color: "var(--prism-pink)", fontSize: "12px", gap: "6px" }}
              >
                <Trash2 size={14} /> Delete Template
              </button>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedPrompt(null)}
                  className="btn-secondary"
                  style={{ fontSize: "12px" }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary"
                  style={{ fontSize: "12px", gap: "6px" }}
                >
                  <Save size={14} />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Create New Prompt Modal */}
      {showCreateModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1200
        }}>
          <div 
            className="prism-card" 
            style={{ 
              width: "560px", 
              padding: "24px", 
              display: "flex", 
              flexDirection: "column", 
              gap: "16px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-card)",
              boxShadow: "0 16px 40px rgba(0,0,0,0.3)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Plus size={18} color="var(--prism-pink)" />
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink-primary)", margin: 0 }}>
                  Create New System Prompt
                </h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)} 
                style={{ background: "none", border: "none", color: "var(--ink-tertiary)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePrompt} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", display: "block", marginBottom: "4px" }}>
                  PROMPT NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Memory Leak Diagnostic System Directive"
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "var(--ink-input)", fontSize: "12px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", display: "block", marginBottom: "4px" }}>
                  DESCRIPTION
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inspects heap allocations, GC pauses, and container memory thresholds"
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "var(--ink-input)", fontSize: "12px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", display: "block", marginBottom: "4px" }}>
                    SCOPE
                  </label>
                  <select
                    value={newForm.scope}
                    onChange={(e) => setNewForm({ ...newForm, scope: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "var(--ink-input)", fontSize: "12px" }}
                  >
                    <option value="Platform">Platform Fleet</option>
                    <option value="Project">Project Scoped</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", display: "block", marginBottom: "4px" }}>
                    CATEGORY
                  </label>
                  <select
                    value={newForm.category}
                    onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "var(--ink-input)", fontSize: "12px" }}
                  >
                    <option value="Triage">Triage</option>
                    <option value="Analysis">Analysis</option>
                    <option value="Summary">Summary</option>
                    <option value="Communication">Communication</option>
                    <option value="Risk">Risk Assessment</option>
                  </select>
                </div>
              </div>

              {newForm.scope === "Project" && (
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", display: "block", marginBottom: "4px" }}>
                    TARGET ASSOCIATED PROJECT
                  </label>
                  <select
                    value={newForm.project_id || ""}
                    onChange={(e) => setNewForm({ ...newForm, project_id: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "var(--ink-input)", fontSize: "12px" }}
                  >
                    <option value="">Select Project...</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.key} - {proj.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", display: "block", marginBottom: "4px" }}>
                  SYSTEM DIRECTIVES (PROMPT INSTRUCTIONS)
                </label>
                <textarea
                  rows={4}
                  placeholder="You are an autonomous SRE agent specialized in diagnosing..."
                  value={newForm.system_directives}
                  onChange={(e) => setNewForm({ ...newForm, system_directives: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "var(--ink-input)", fontSize: "12px", resize: "vertical" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", display: "block", marginBottom: "4px" }}>
                  USER TEMPLATE (OPTIONAL)
                </label>
                <textarea
                  rows={2}
                  placeholder="Format guidelines for user queries..."
                  value={newForm.user_template}
                  onChange={(e) => setNewForm({ ...newForm, user_template: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "var(--ink-input)", fontSize: "12px", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  className="btn-secondary" 
                  style={{ fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="btn-primary" 
                  style={{ fontSize: "12px" }}
                >
                  {isSubmitting ? "Creating..." : "Save to PostgreSQL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
