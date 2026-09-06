import React, { useState, useEffect } from "react";
import {
  Cpu,
  Search,
  Filter,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Zap,
  Play,
  RotateCw,
  Code2,
  Sliders,
  Sparkles,
  Plus,
  Network,
  Package,
  Layers,
  User,
  ArrowRight,
  FileText,
  X,
  Save,
  Trash2,
  UploadCloud,
  Check,
  Globe,
  Radio,
  ExternalLink,
  ChevronRight,
  Tag
} from "lucide-react";
import {
  fetchProjects,
  fetchAdminSkills,
  createAdminSkill,
  updateAdminSkill,
  setAdminSkillLifecycle,
  publishAdminSkill,
  deleteAdminSkill,
  discoverMcpTools
} from "../api/client";

export function AdminSkillsCatalogPage() {
  const [activeScope, setActiveScope] = useState("ALL"); // ALL, PLATFORM, PROJECT, USER
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [projectsList, setProjectsList] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [skillsList, setSkillsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMcpOpen, setIsMcpOpen] = useState(false);
  const [mcpStatus, setMcpStatus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  // Create Skill Form State
  const [newSkill, setNewSkill] = useState({
    name: "",
    skill_key: "",
    version: "1.0.0",
    category: "investigation",
    scope: "PLATFORM",
    target_project_id: "",
    owner: "Sentrix Platform SRE",
    required_capabilities: "ticket.read, logs.search",
    instructions_markdown: "### Diagnostic Procedure\n1. Ingest incident identifiers.\n2. Query authorized logs.\n3. Identify failure boundary.",
    output_spec: { required: ["finding", "evidence", "root_cause"] }
  });

  // MCP Discovery Form State
  const [mcpForm, setMcpForm] = useState({
    server_name: "kubernetes-cluster",
    transport: "sse",
    endpoint_uri: "sse://mcp-k8s.internal:8080",
    auth_token: ""
  });

  // Drawer Edit Form State
  const [editInstructions, setEditInstructions] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const showNotification = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    fetchProjects()
      .then((data) => {
        if (Array.isArray(data)) {
          setProjectsList(data);
          if (data.length > 0 && !newSkill.target_project_id) {
            setNewSkill((prev) => ({ ...prev, target_project_id: data[0].id }));
          }
        }
      })
      .catch((err) => console.warn("Failed to fetch projects for filter:", err));
  }, []);

  const loadSkills = () => {
    setIsLoading(true);
    fetchAdminSkills({
      scope: activeScope === "ALL" ? "" : activeScope,
      category: categoryFilter === "ALL" ? "" : categoryFilter,
      project_id: projectFilter === "ALL" ? "" : projectFilter,
      search: searchQuery
    })
      .then((data) => {
        if (Array.isArray(data)) {
          setSkillsList(data);
        }
      })
      .catch((err) => {
        console.warn("Failed to load skills:", err);
        showNotification("Failed to load skills from server", "error");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadSkills();
  }, [activeScope, categoryFilter, projectFilter]);

  const handleOpenDetail = (skill) => {
    setSelectedSkill(skill);
    setEditInstructions(skill.description || "");
    setEditCategory(skill.category || "investigation");
    setEditStatus(skill.lifecycle_status || "ACTIVE");
  };

  const handleSaveDetail = async () => {
    if (!selectedSkill) return;
    setIsSaving(true);
    try {
      await updateAdminSkill(selectedSkill.id, {
        category: editCategory,
        instructions_markdown: editInstructions
      });
      if (editStatus !== selectedSkill.lifecycle_status) {
        await setAdminSkillLifecycle(selectedSkill.id, editStatus);
      }
      showNotification(`Skill '${selectedSkill.name}' updated successfully!`);
      loadSkills();
      setSelectedSkill(prev => ({
        ...prev,
        category: editCategory,
        description: editInstructions,
        lifecycle_status: editStatus
      }));
    } catch (err) {
      showNotification(`Update failed: ${err.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishBundle = async (skillId) => {
    setIsSaving(true);
    try {
      const res = await publishAdminSkill(skillId);
      showNotification(`Immutable bundle published! SHA-256: ${res.package_hash.slice(0, 12)}...`);
      loadSkills();
      if (selectedSkill && selectedSkill.id === skillId) {
        setSelectedSkill(prev => ({ ...prev, lifecycle_status: "ACTIVE" }));
      }
    } catch (err) {
      showNotification(`Publish failed: ${err.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSkillSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const capsArray = newSkill.required_capabilities
        .split(",")
        .map(c => c.trim())
        .filter(Boolean);

      await createAdminSkill({
        skill_key: newSkill.skill_key.trim(),
        name: newSkill.name.trim(),
        version: newSkill.version.trim(),
        category: newSkill.category,
        scope: newSkill.scope,
        target_project_id: newSkill.scope === "PROJECT" ? newSkill.target_project_id : null,
        owner: newSkill.owner,
        required_capabilities: capsArray,
        instructions_markdown: newSkill.instructions_markdown,
        output_spec: newSkill.output_spec
      });

      showNotification(`Created ${newSkill.scope.toLowerCase()} skill '${newSkill.name}'!`);
      setIsCreateOpen(false);
      loadSkills();
    } catch (err) {
      showNotification(`Creation failed: ${err.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMcpDiscoverSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMcpStatus("Connecting to MCP endpoint...");
    try {
      const res = await discoverMcpTools(mcpForm);
      setMcpStatus(`Discovered ${res.tools_discovered} tools and registered instance '${res.connector_instance}'`);
      showNotification(`Ingested ${res.tools_discovered} MCP capabilities into Sentrix!`);
      setTimeout(() => {
        setIsMcpOpen(false);
        setMcpStatus(null);
        loadSkills();
      }, 1500);
    } catch (err) {
      setMcpStatus(`Error: ${err.message}`);
      showNotification(`MCP discovery failed: ${err.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSkills = skillsList.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.category && s.category.toLowerCase().includes(q)) ||
      (s.skill_key && s.skill_key.toLowerCase().includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q))
    );
  });

  const categories = ["ALL", "investigation", "analysis", "synthesis", "knowledge", "triage", "infrastructure", "user_shortcut"];

  const countsByScope = {
    ALL: skillsList.length,
    PLATFORM: skillsList.filter(s => s.scope === "PLATFORM").length,
    PROJECT: skillsList.filter(s => s.scope === "PROJECT").length,
    USER: skillsList.filter(s => s.scope === "USER").length,
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
        position: "relative"
      }}
    >
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "32px",
            zIndex: 9999,
            padding: "12px 18px",
            borderRadius: "8px",
            background: notification.type === "error" ? "rgba(239, 68, 68, 0.95)" : "rgba(16, 185, 129, 0.95)",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          {notification.type === "error" ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
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
              boxShadow: "0 0 18px var(--prism-glow)"
            }}
          >
            <Cpu size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                PLATFORM ADMIN • SKILLS & CAPABILITIES
              </span>
              <span className="badge badge-teal">{skillsList.length} Registered Skills</span>
              <span className="badge badge-magenta">Layered L0-L3 Architecture</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Skills & Tool Capabilities Catalog
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Governed diagnostic building blocks composed across Platform (L1), Project (L2), and User (L3) boundaries with zero-trust capability enforcement.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setIsMcpOpen(true)}
            className="btn btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "12.5px" }}
          >
            <Network size={14} color="var(--accent-teal)" />
            Discover MCP Server
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "12.5px",
              background: "var(--prism-gradient)",
              color: "#fff"
            }}
          >
            <Plus size={15} />
            Create Platform Skill
          </button>
        </div>
      </div>

      {/* Scope Navigation Tabs & Search Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px"
        }}
      >
        {/* Scope Selector Tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "10px",
            padding: "4px"
          }}
        >
          {[
            { key: "ALL", label: "All Skills", icon: Layers },
            { key: "PLATFORM", label: "Platform Skills (L1)", icon: Package },
            { key: "PROJECT", label: "Project Skills (L2)", icon: Cpu },
            { key: "USER", label: "User Skills (L3)", icon: User }
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = activeScope === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveScope(tab.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "6px 14px",
                  borderRadius: "7px",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: isSel ? "var(--prism-gradient)" : "transparent",
                  color: isSel ? "#fff" : "var(--ink-secondary)",
                  transition: "all 0.15s ease"
                }}
              >
                <Icon size={14} />
                {tab.label}
                <span
                  style={{
                    fontSize: "10.5px",
                    padding: "1px 6px",
                    borderRadius: "10px",
                    background: isSel ? "rgba(255,255,255,0.25)" : "var(--bg-input)",
                    color: isSel ? "#fff" : "var(--ink-tertiary)"
                  }}
                >
                  {countsByScope[tab.key] || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "8px",
            padding: "6px 14px",
            width: "280px"
          }}
        >
          <Search size={15} style={{ color: "var(--ink-tertiary)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills, intents, capabilities..."
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--ink-primary)",
              fontSize: "12.5px",
              width: "100%"
            }}
          />
        </div>
      </div>

      {/* Category Pills Filter & Project Association Filter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", overflowX: "auto", paddingBottom: "2px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600, marginRight: "4px" }}>
            Category:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                fontSize: "11.5px",
                padding: "3px 10px",
                borderRadius: "6px",
                border: categoryFilter === cat ? "1px solid var(--prism-magenta)" : "1px solid var(--border-subtle)",
                background: categoryFilter === cat ? "rgba(217, 70, 239, 0.12)" : "var(--bg-card)",
                color: categoryFilter === cat ? "var(--prism-pink)" : "var(--ink-secondary)",
                cursor: "pointer",
                textTransform: "capitalize"
              }}
            >
              {cat.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Project Association Filter Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Tag size={13} color="var(--accent-teal)" />
          <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>
            Project Scope:
          </span>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              color: "var(--ink-primary)",
              fontSize: "12px",
              fontWeight: 600
            }}
          >
            <option value="ALL">All Projects (Platform Fleet)</option>
            {projectsList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_key} — {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Skills Grid */}
      {isLoading ? (
        <div style={{ padding: "60px", textAlign: "center", color: "var(--ink-secondary)" }}>
          <RotateCw size={24} className="spin" style={{ marginBottom: "12px", color: "var(--accent-teal)" }} />
          <div>Querying Sentrix Skill Registry...</div>
        </div>
      ) : filteredSkills.length === 0 ? (
        <div
          className="prism-card"
          style={{ padding: "60px 20px", textAlign: "center", color: "var(--ink-secondary)" }}
        >
          <Package size={36} style={{ color: "var(--ink-tertiary)", marginBottom: "12px" }} />
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink-primary)" }}>No skills found</div>
          <p style={{ fontSize: "12.5px", color: "var(--ink-tertiary)", marginTop: "4px" }}>
            No skills match the selected scope ({activeScope}) or search criteria.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
          {filteredSkills.map((skill) => {
            const reqCaps = skill.requiredCapabilities || [];
            const isComposed = skill.workflowSpec && Array.isArray(skill.workflowSpec.uses) && skill.workflowSpec.uses.length > 0;
            const scopeColor = skill.scope === "PLATFORM" ? "badge-teal" : skill.scope === "PROJECT" ? "badge-blue" : "badge-orange";

            return (
              <div
                key={skill.id}
                onClick={() => handleOpenDetail(skill)}
                className="prism-card"
                style={{
                  padding: "20px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, border-color 0.15s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--prism-magenta)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-card)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
                        {skill.name}
                      </h3>
                      <span className={`badge ${scopeColor}`} style={{ fontSize: "9.5px", textTransform: "uppercase" }}>
                        {skill.scope || "PLATFORM"}
                      </span>
                      <span className={`badge ${skill.badgeColor || "badge-teal"}`} style={{ fontSize: "9.5px" }}>
                        {skill.permission || "READ_ONLY"}
                      </span>
                      {skill.lifecycle_status && (
                        <span
                          style={{
                            fontSize: "9.5px",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            background: skill.lifecycle_status === "ACTIVE" ? "rgba(16, 185, 129, 0.15)" : "rgba(234, 179, 8, 0.15)",
                            color: skill.lifecycle_status === "ACTIVE" ? "var(--accent-teal)" : "#eab308",
                            fontWeight: 700
                          }}
                        >
                          {skill.lifecycle_status}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", marginTop: "3px" }}>
                      {skill.category} • <span className="mono">{skill.skill_key}</span> {skill.version ? `v${skill.version}` : ""}
                    </div>

                    {/* Tagged Context Badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                      {skill.scope === "PROJECT" ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "10px",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            background: "rgba(139, 92, 246, 0.15)",
                            border: "1px solid rgba(139, 92, 246, 0.35)",
                            color: "var(--accent-violet)",
                            fontWeight: 700
                          }}
                        >
                          <Tag size={10} />
                          {skill.tag_badge || `Project: ${skill.tagged_project_key || 'Unassigned'}`}
                        </span>
                      ) : skill.scope === "USER" ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "10px",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            background: "rgba(236, 72, 153, 0.15)",
                            border: "1px solid rgba(236, 72, 153, 0.35)",
                            color: "var(--accent-pink)",
                            fontWeight: 700
                          }}
                        >
                          <User size={10} />
                          {skill.tag_badge || `User: ${skill.user_id} @ ${skill.tagged_project_key || 'Unassigned'}`}
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "10px",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            background: "rgba(16, 185, 129, 0.12)",
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                            color: "var(--accent-teal)",
                            fontWeight: 700
                          }}
                        >
                          <Globe size={10} />
                          Platform Fleet (All Projects)
                        </span>
                      )}
                      {skill.tagged_to && (
                        <span style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>
                          • {skill.tagged_to}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p
                  style={{
                    fontSize: "12.5px",
                    color: "var(--ink-secondary)",
                    lineHeight: 1.5,
                    maxHeight: "72px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical"
                  }}
                >
                  {skill.description}
                </p>

                {/* Composed Skills indicator (for L2 project skills) */}
                {isComposed && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--prism-pink)" }}>
                    <Layers size={13} />
                    <span>Composes {skill.workflowSpec.uses.length} Platform Skills</span>
                  </div>
                )}

                {/* Capabilities pills */}
                {reqCaps.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--ink-tertiary)", fontWeight: 600, textTransform: "uppercase" }}>
                      Required Capabilities:
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                      {reqCaps.slice(0, 4).map((cap, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: "10.5px",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            background: "var(--bg-input)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--accent-teal)",
                            fontFamily: "'JetBrains Mono', monospace"
                          }}
                        >
                          {cap}
                        </span>
                      ))}
                      {reqCaps.length > 4 && (
                        <span style={{ fontSize: "10px", color: "var(--ink-tertiary)", alignSelf: "center" }}>
                          +{reqCaps.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer stats */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderTop: "1px solid var(--border-subtle)",
                    paddingTop: "10px",
                    fontSize: "11px",
                    color: "var(--ink-tertiary)",
                    marginTop: "auto"
                  }}
                >
                  <span>
                    24h Invocations: <strong style={{ color: "var(--ink-primary)" }}>{(skill.invocations24h ?? 0).toLocaleString()}</strong>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--accent-violet)" }}>
                    Inspect <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Skill Detail & Edit Drawer (Slide-over) */}
      {selectedSkill && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: "600px",
            maxWidth: "90vw",
            background: "var(--bg-elevated)",
            borderLeft: "1px solid var(--border-card)",
            boxShadow: "-8px 0 32px rgba(0,0,0,0.4)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          {/* Drawer Header */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "14px"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="badge badge-teal" style={{ fontSize: "10px" }}>{selectedSkill.scope}</span>
                <span className="badge badge-magenta" style={{ fontSize: "10px" }}>{selectedSkill.permission}</span>
                <span className="badge" style={{ fontSize: "10px", background: "var(--bg-input)" }}>
                  {selectedSkill.source_type || "GITLAB"}
                </span>
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "6px" }}>
                {selectedSkill.name}
              </h2>
              <div style={{ fontSize: "12px", color: "var(--ink-tertiary)", marginTop: "2px" }}>
                Key: <strong className="mono">{selectedSkill.skill_key}</strong> • Version: {selectedSkill.version}
              </div>
            </div>

            <button
              onClick={() => setSelectedSkill(null)}
              style={{ background: "transparent", border: "none", color: "var(--ink-tertiary)", cursor: "pointer" }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Body */}
          <div style={{ padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Lifecycle State Control */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-card)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-primary)" }}>Lifecycle Status</div>
                <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>Current operational governance state</div>
              </div>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-card)",
                  color: "var(--ink-primary)",
                  borderRadius: "6px",
                  padding: "5px 10px",
                  fontSize: "12px",
                  fontWeight: 600
                }}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="VALIDATING">VALIDATING</option>
                <option value="EVALUATING">EVALUATING</option>
                <option value="DEPRECATED">DEPRECATED</option>
              </select>
            </div>

            {/* Tagged Scope & Associations Section (Agent Context) */}
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Tag size={16} color="var(--accent-teal)" />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-primary)" }}>
                    Tagged Scope & Associations
                  </span>
                </div>
                <span className={`badge ${selectedSkill.scope === 'PROJECT' ? 'badge-blue' : selectedSkill.scope === 'USER' ? 'badge-magenta' : 'badge-teal'}`}>
                  {selectedSkill.scope} Scope
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
                <div>
                  <span style={{ color: "var(--ink-tertiary)", display: "block", fontSize: "11px" }}>Target Tag:</span>
                  <strong style={{ color: "var(--ink-primary)" }}>{selectedSkill.tag_badge || "Global Platform"}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--ink-tertiary)", display: "block", fontSize: "11px" }}>Association:</span>
                  <strong style={{ color: "var(--ink-primary)" }}>{selectedSkill.tagged_to || "All Projects"}</strong>
                </div>
                {selectedSkill.user_id && (
                  <div>
                    <span style={{ color: "var(--ink-tertiary)", display: "block", fontSize: "11px" }}>User Identity:</span>
                    <span className="mono" style={{ color: "var(--accent-pink)" }}>{selectedSkill.user_id}</span>
                  </div>
                )}
                {selectedSkill.tagged_project_key && (
                  <div>
                    <span style={{ color: "var(--ink-tertiary)", display: "block", fontSize: "11px" }}>Project Scope:</span>
                    <span className="mono" style={{ color: "var(--accent-violet)" }}>{selectedSkill.tagged_project_key}</span>
                  </div>
                )}
              </div>

              {/* Agent Prompt Injection Preview */}
              <div style={{ marginTop: "4px" }}>
                <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                  Agent Execution Context Header:
                </span>
                <div
                  className="mono"
                  style={{
                    fontSize: "11px",
                    lineHeight: 1.4,
                    padding: "8px 10px",
                    borderRadius: "6px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--ink-secondary)",
                    whiteSpace: "pre-wrap"
                  }}
                >
{`### Active Skill: ${selectedSkill.name} (${selectedSkill.scope})
- Tagged Target: ${selectedSkill.tag_badge || 'Platform Fleet'}
- Project Scope: ${selectedSkill.tagged_project_key || 'Platform Fleet (All Projects)'}
- User Context: ${selectedSkill.user_id || 'System Default / Unbound'}`}
                </div>
              </div>
            </div>

            {/* Category */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
                Category
              </label>
              <input
                type="text"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--ink-primary)",
                  fontSize: "13px"
                }}
              />
            </div>

            {/* Markdown Instructions Editor */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)" }}>
                  Skill Instructions (Markdown)
                </label>
                <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>Compiled into Agent Execution Context</span>
              </div>
              <textarea
                rows={10}
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--ink-primary)",
                  fontSize: "12.5px",
                  fontFamily: "'JetBrains Mono', monospace",
                  lineHeight: 1.5,
                  resize: "vertical"
                }}
              />
            </div>

            {/* Capabilities */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
                Declared Capabilities
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {(selectedSkill.requiredCapabilities || []).map((cap, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: "11px",
                      padding: "3px 9px",
                      borderRadius: "4px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-card)",
                      color: "var(--accent-teal)",
                      fontFamily: "'JetBrains Mono', monospace"
                    }}
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            {/* Composed Platform Skills (for project skills) */}
            {selectedSkill.workflowSpec && selectedSkill.workflowSpec.uses && (
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
                  Composed Platform Skills
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {selectedSkill.workflowSpec.uses.map((use, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "6px 10px",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "6px",
                        fontSize: "11.5px",
                        color: "var(--ink-primary)",
                        fontFamily: "'JetBrains Mono', monospace"
                      }}
                    >
                      {use}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--bg-card)"
            }}
          >
            <button
              onClick={() => handlePublishBundle(selectedSkill.id)}
              disabled={isSaving}
              className="btn btn-secondary"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}
            >
              <UploadCloud size={14} color="var(--accent-teal)" />
              Publish Version Bundle
            </button>

            <button
              onClick={handleSaveDetail}
              disabled={isSaving}
              className="btn btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12.5px",
                background: "var(--prism-gradient)",
                color: "#fff"
              }}
            >
              <Save size={14} />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Modal: Create Platform Skill */}
      {isCreateOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <div
            className="prism-card"
            style={{
              width: "560px",
              maxWidth: "100%",
              padding: "24px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-card)",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Package size={20} color="var(--accent-teal)" />
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ink-primary)" }}>
                  {newSkill.scope === "PROJECT" ? "Create Project Skill (L2)" : "Create Platform Skill (L1)"}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--ink-tertiary)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSkillSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Skill Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kubernetes Pod Crash Triage"
                  value={newSkill.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                    setNewSkill({ ...newSkill, name, skill_key: key });
                  }}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)", fontSize: "12.5px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                    Skill Key (Canonical ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={newSkill.skill_key}
                    onChange={(e) => setNewSkill({ ...newSkill, skill_key: e.target.value })}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)", fontSize: "12.5px", fontFamily: "monospace" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                    Category
                  </label>
                  <select
                    value={newSkill.category}
                    onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)", fontSize: "12.5px" }}
                  >
                    <option value="investigation">investigation</option>
                    <option value="analysis">analysis</option>
                    <option value="synthesis">synthesis</option>
                    <option value="knowledge">knowledge</option>
                    <option value="infrastructure">infrastructure</option>
                  </select>
                </div>
              </div>

              {/* Scope Level & Target Project Association */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                    Scope Level
                  </label>
                  <select
                    value={newSkill.scope}
                    onChange={(e) => setNewSkill({ ...newSkill, scope: e.target.value })}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)", fontSize: "12.5px" }}
                  >
                    <option value="PLATFORM">PLATFORM (L1)</option>
                    <option value="PROJECT">PROJECT (L2)</option>
                  </select>
                </div>
                {newSkill.scope === "PROJECT" ? (
                  <div>
                    <label style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                      Target Project
                    </label>
                    <select
                      value={newSkill.target_project_id}
                      onChange={(e) => setNewSkill({ ...newSkill, target_project_id: e.target.value })}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)", fontSize: "12.5px" }}
                    >
                      {projectsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.project_key} — {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                      Target Scope
                    </label>
                    <div style={{ fontSize: "12px", color: "var(--accent-teal)", padding: "7px 0", fontWeight: 600 }}>
                      Platform Fleet (All Projects)
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Required Capabilities (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="ticket.read, logs.search, database.query.read"
                  value={newSkill.required_capabilities}
                  onChange={(e) => setNewSkill({ ...newSkill, required_capabilities: e.target.value })}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)", fontSize: "12px", fontFamily: "monospace" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Instructions Markdown
                </label>
                <textarea
                  rows={5}
                  value={newSkill.instructions_markdown}
                  onChange={(e) => setNewSkill({ ...newSkill, instructions_markdown: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)", fontSize: "12px", fontFamily: "monospace" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="btn btn-secondary"
                  style={{ fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary"
                  style={{ fontSize: "12px", background: "var(--prism-gradient)", color: "#fff" }}
                >
                  {isSaving ? "Creating..." : "Register Skill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Discover MCP Server */}
      {isMcpOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <div
            className="prism-card"
            style={{
              width: "520px",
              maxWidth: "100%",
              padding: "24px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-card)",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Network size={20} color="var(--accent-teal)" />
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ink-primary)" }}>
                  Discover Model Context Protocol (MCP) Server
                </h3>
              </div>
              <button
                onClick={() => { setIsMcpOpen(false); setMcpStatus(null); }}
                style={{ background: "transparent", border: "none", color: "var(--ink-tertiary)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", lineHeight: 1.5 }}>
              Connect to any external MCP server to introspect tools and resources, and auto-register them as governed Sentrix capabilities.
            </p>

            <form onSubmit={handleMcpDiscoverSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Server Identifier / Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="kubernetes-cluster"
                  value={mcpForm.server_name}
                  onChange={(e) => setMcpForm({ ...mcpForm, server_name: e.target.value })}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)", fontSize: "12.5px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                    Transport
                  </label>
                  <select
                    value={mcpForm.transport}
                    onChange={(e) => setMcpForm({ ...mcpForm, transport: e.target.value })}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)", fontSize: "12.5px" }}
                  >
                    <option value="sse">SSE (HTTP)</option>
                    <option value="stdio">stdio (Local)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                    Endpoint URI or Command
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="sse://mcp-server:8080 or stdio://command"
                    value={mcpForm.endpoint_uri}
                    onChange={(e) => setMcpForm({ ...mcpForm, endpoint_uri: e.target.value })}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)", fontSize: "12px", fontFamily: "monospace" }}
                  />
                </div>
              </div>

              {mcpStatus && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    background: mcpStatus.startsWith("Error") ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                    color: mcpStatus.startsWith("Error") ? "var(--accent-red)" : "var(--accent-teal)",
                    fontSize: "12px",
                    fontWeight: 600
                  }}
                >
                  {mcpStatus}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => { setIsMcpOpen(false); setMcpStatus(null); }}
                  className="btn btn-secondary"
                  style={{ fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary"
                  style={{ fontSize: "12px", background: "var(--prism-gradient)", color: "#fff" }}
                >
                  {isSaving ? "Discovering..." : "Discover & Ingest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
