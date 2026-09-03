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
  Tag
} from "lucide-react";
import { fetchProjects, createProject } from "../api/client";

export function AdminProjectsFleetPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  useEffect(() => {
    if (location.search.includes("create=true")) {
      setShowNewProjectModal(true);
    }
  }, [location.search]);

  // New Project Form State
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTier, setNewTier] = useState("Tier-1 Mission Critical");
  const [newDefaultEnv, setNewDefaultEnv] = useState("prod");
  const [newEnvironments, setNewEnvironments] = useState(["dev", "staging", "prod"]);
  const [newEnvInput, setNewEnvInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [projects, setProjects] = useState([
    {
      id: "prj_billing",
      project_key: "BILLING",
      name: "Global Billing & Payment Gateway",
      description: "Stripe webhooks, recurring subscription ledger, merchant payouts, and tax calculations.",
      status: "HEALTHY",
      environments: ["dev", "staging", "prod"],
      agentsCount: 5,
      openIncidents: 2,
      runs24h: 1248,
      isFollowed: true,
      lastTriage: "4m ago"
    },
    {
      id: "prj_auth",
      project_key: "AUTH",
      name: "Identity, SSO & OAuth2 Gateway",
      description: "Enterprise Okta, Entra OIDC, JWKS key rotation, and session authorization proxies.",
      status: "HEALTHY",
      environments: ["dev", "staging", "prod"],
      agentsCount: 4,
      openIncidents: 1,
      runs24h: 840,
      isFollowed: true,
      lastTriage: "12m ago"
    },
    {
      id: "prj_fulfillment",
      project_key: "FULFILLMENT",
      name: "Inventory & Order Allocation",
      description: "High-concurrency order placement, warehouse inventory locks, and carrier dispatch.",
      status: "WARNING",
      environments: ["staging", "prod"],
      agentsCount: 3,
      openIncidents: 1,
      runs24h: 512,
      isFollowed: false,
      lastTriage: "25m ago"
    },
    {
      id: "prj_notifications",
      project_key: "NOTIF",
      name: "Customer Communications & Relays",
      description: "SendGrid SMTP relays, AWS SES fallback, SMS OTPs, and webhook push dispatches.",
      status: "HEALTHY",
      environments: ["dev", "prod"],
      agentsCount: 2,
      openIncidents: 1,
      runs24h: 310,
      isFollowed: false,
      lastTriage: "1h ago"
    },
    {
      id: "prj_infra",
      project_key: "INFRA",
      name: "Core Platform & Kubernetes Grid",
      description: "EKS worker node pools, Redis sentinel caching clusters, Istio service mesh.",
      status: "HEALTHY",
      environments: ["dev", "staging", "prod"],
      agentsCount: 6,
      openIncidents: 0,
      runs24h: 1890,
      isFollowed: true,
      lastTriage: "2h ago"
    }
  ]);

  useEffect(() => {
    loadLiveProjects();
  }, []);

  const loadLiveProjects = async () => {
    setIsLoading(true);
    try {
      const data = await fetchProjects();
      if (Array.isArray(data) && data.length > 0) {
        // Merge backend projects with fleet metadata
        setProjects((prev) => {
          const map = new Map(prev.map((p) => [p.project_key.toUpperCase(), p]));
          data.forEach((p) => {
            const key = p.project_key.toUpperCase();
            if (map.has(key)) {
              map.set(key, { ...map.get(key), ...p });
            } else {
              map.set(key, {
                id: p.id || `prj_${key.toLowerCase()}`,
                project_key: key,
                name: p.name,
                description: p.description || "Enterprise monitored service engine.",
                status: p.status || "HEALTHY",
                environments: p.environments || ["dev", "staging", "prod"],
                agentsCount: 4,
                openIncidents: 0,
                runs24h: 120,
                isFollowed: p.is_followed || false,
                lastTriage: "Just now"
              });
            }
          });
          return Array.from(map.values());
        });
      }
    } catch (e) {
      console.error("Failed to load projects from server", e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFollow = (id) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFollowed: !p.isFollowed } : p))
    );
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
        setNewDefaultEnv(filtered[0] || "dev");
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
        default_environment: newDefaultEnv,
        environments: newEnvironments
      });

      setShowNewProjectModal(false);
      setNewKey("");
      setNewName("");
      setNewDesc("");
      setNewEnvironments(["dev", "staging", "prod"]);

      // Reload fleet
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

  const filteredProjects = projects.filter((p) => {
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
        gap: "20px",
        overflowY: "auto",
        minHeight: "100%",
        boxSizing: "border-box"
      }}
    >
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
            <Layers size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                PLATFORM ADMIN • FLEET DIRECTORY
              </span>
              <span className="badge badge-teal">{projects.length} Enterprise Projects Online</span>
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

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
        {filteredProjects.map((proj) => (
          <div
            key={proj.id}
            className="prism-card"
            style={{
              padding: "20px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              transition: "all 0.18s ease"
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: "var(--prism-pink)", fontSize: "13.5px" }}>
                    {proj.project_key}
                  </span>
                  <span className={`badge ${proj.status === "HEALTHY" ? "badge-teal" : "badge-amber"}`}>
                    {proj.status}
                  </span>
                </div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
                  {proj.name}
                </h3>
              </div>

              <button
                onClick={() => toggleFollow(proj.id)}
                className="btn-ghost"
                style={{ padding: "4px", color: proj.isFollowed ? "var(--accent-amber)" : "var(--ink-muted)" }}
                title={proj.isFollowed ? "Following project" : "Follow project"}
              >
                <Star size={16} fill={proj.isFollowed ? "var(--accent-amber)" : "none"} />
              </button>
            </div>

            <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", lineHeight: 1.5 }}>
              {proj.description}
            </p>

            {/* Environments Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>Environments:</span>
              {(proj.environments || ["dev", "staging", "prod"]).map((env) => (
                <span key={env} className="badge badge-teal" style={{ textTransform: "uppercase", fontSize: "10px" }}>
                  {env}
                </span>
              ))}
            </div>

            {/* Stats Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", padding: "8px 12px", borderRadius: "8px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", textAlign: "center", fontSize: "12px" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>Agents</div>
                <div style={{ fontWeight: 700, color: "var(--ink-primary)" }}>{proj.agentsCount || 4}</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>Open Incidents</div>
                <div style={{ fontWeight: 700, color: (proj.openIncidents || 0) > 0 ? "var(--accent-rose)" : "var(--accent-teal)" }}>
                  {proj.openIncidents || 0}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>24h Runs</div>
                <div style={{ fontWeight: 700, color: "var(--accent-teal)" }}>{proj.runs24h || 140}</div>
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
        ))}
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
                  <label style={{ fontSize: "11.5px", color: "var(--ink-secondary)", fontWeight: 600 }}>Criticality Tier:</label>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)", fontSize: "12px" }}
                  >
                    <option value="Tier-1 Mission Critical">Tier-1 Mission Critical (SLA 99.99%)</option>
                    <option value="Tier-2 High Availability">Tier-2 High Availability (SLA 99.9%)</option>
                    <option value="Tier-3 Standard">Tier-3 Standard Internal Service</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11.5px", color: "var(--ink-secondary)", fontWeight: 600 }}>Default Environment:</label>
                  <select
                    value={newDefaultEnv}
                    onChange={(e) => setNewDefaultEnv(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--ink-primary)", fontSize: "12px" }}
                  >
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
    </div>
  );
}
