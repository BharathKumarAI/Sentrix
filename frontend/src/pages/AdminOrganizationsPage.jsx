import React, { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Users,
  Layers,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  FolderKanban,
  ShieldCheck,
  Briefcase,
  ChevronRight,
  Sparkles,
  RefreshCw,
  X,
  Sliders,
  Filter,
  ArrowRight,
  Network
} from "lucide-react";
import {
  fetchOrganizations,
  createOrganization,
  createOrganizationTeam,
  assignOrganizationProject,
  deleteOrganization,
  deleteOrganizationTeam,
  unassignOrganizationProject,
  fetchProjects
} from "../api/client";
import { useAdminSync, emitAdminSync } from "../context/AdminSyncContext";

export function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("FLEET"); // "FLEET" | "SQUADS" | "ASSIGNMENT"
  const [searchQuery, setSearchQuery] = useState("");
  const [actionSuccessMessage, setActionSuccessMessage] = useState(null);

  // Modals state
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrgForAction, setSelectedOrgForAction] = useState(null);

  // Create Org Form State
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [orgModalError, setOrgModalError] = useState("");

  // Create Team Form State
  const [targetOrgIdForTeam, setTargetOrgIdForTeam] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [teamModalError, setTeamModalError] = useState("");

  // Assign Project Form State
  const [targetProjectId, setTargetProjectId] = useState("");
  const [targetOrgIdForAssign, setTargetOrgIdForAssign] = useState("");
  const [targetTeamIdForAssign, setTargetTeamIdForAssign] = useState("");
  const [assignModalError, setAssignModalError] = useState("");

  // Load organizations and projects
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orgs, projectRows] = await Promise.all([
        fetchOrganizations(),
        fetchProjects()
      ]);
      setOrganizations(Array.isArray(orgs) ? orgs : []);
      setProjects(Array.isArray(projectRows) ? projectRows : []);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useAdminSync(load);

  // Helper notification toaster
  const notifySuccess = (msg) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  // Auto slug generation helper
  const handleOrgNameChange = (val) => {
    setNewOrgName(val);
    if (!newOrgSlug || newOrgSlug === slugify(newOrgName)) {
      setNewOrgSlug(slugify(val));
    }
  };

  const slugify = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64);
  };

  // Handlers
  const handleCreateOrgSubmit = async (e) => {
    e.preventDefault();
    setOrgModalError("");
    if (!newOrgName.trim()) {
      setOrgModalError("Organization name is required.");
      return;
    }
    if (!newOrgSlug.trim()) {
      setOrgModalError("URL identifier (slug) is required.");
      return;
    }
    setBusy(true);
    try {
      const res = await createOrganization({
        name: newOrgName.trim(),
        slug: newOrgSlug.trim()
      });
      setShowCreateOrgModal(false);
      setNewOrgName("");
      setNewOrgSlug("");
      emitAdminSync("organization-created");
      await load();
      notifySuccess(`Organization "${res.name}" created successfully.`);
    } catch (err) {
      setOrgModalError(err.message || "Failed to create organization");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault();
    setTeamModalError("");
    if (!targetOrgIdForTeam) {
      setTeamModalError("Please choose an organization.");
      return;
    }
    if (!newTeamName.trim()) {
      setTeamModalError("Team name cannot be blank.");
      return;
    }
    setBusy(true);
    try {
      const res = await createOrganizationTeam(targetOrgIdForTeam, {
        name: newTeamName.trim()
      });
      setShowAddTeamModal(false);
      setNewTeamName("");
      emitAdminSync("team-created");
      await load();
      notifySuccess(`Team "${res.name}" added successfully.`);
    } catch (err) {
      setTeamModalError(err.message || "Failed to add team");
    } finally {
      setBusy(false);
    }
  };

  const handleAssignProjectSubmit = async (e) => {
    e.preventDefault();
    setAssignModalError("");
    if (!targetProjectId) {
      setAssignModalError("Please select a project.");
      return;
    }
    if (!targetOrgIdForAssign) {
      setAssignModalError("Please select an organization.");
      return;
    }
    setBusy(true);
    try {
      await assignOrganizationProject(
        targetOrgIdForAssign,
        targetProjectId,
        targetTeamIdForAssign || null
      );
      setShowAssignModal(false);
      setTargetProjectId("");
      setTargetTeamIdForAssign("");
      emitAdminSync("project-assigned");
      await load();
      notifySuccess("Project ownership mapped successfully.");
    } catch (err) {
      setAssignModalError(err.message || "Failed to assign project ownership");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteOrg = async (org) => {
    if (!window.confirm(`Are you sure you want to delete organization "${org.name}"? All squads will be removed and assigned projects will be unlinked.`)) {
      return;
    }
    setBusy(true);
    try {
      await deleteOrganization(org.id);
      emitAdminSync("organization-deleted");
      await load();
      notifySuccess(`Organization "${org.name}" removed.`);
    } catch (err) {
      setError(err.message || "Failed to delete organization");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteTeam = async (orgId, team) => {
    if (!window.confirm(`Delete squad "${team.name}"? Projects assigned to this squad will revert to organization-level ownership.`)) {
      return;
    }
    setBusy(true);
    try {
      await deleteOrganizationTeam(orgId, team.id);
      emitAdminSync("team-deleted");
      await load();
      notifySuccess(`Squad "${team.name}" removed.`);
    } catch (err) {
      setError(err.message || "Failed to delete squad");
    } finally {
      setBusy(false);
    }
  };

  const handleUnassignProject = async (orgId, projectId, projectName) => {
    if (!window.confirm(`Unlink project "${projectName}" from this organization?`)) {
      return;
    }
    setBusy(true);
    try {
      await unassignOrganizationProject(orgId, projectId);
      emitAdminSync("project-unassigned");
      await load();
      notifySuccess(`Project "${projectName}" unassigned.`);
    } catch (err) {
      setError(err.message || "Failed to unassign project");
    } finally {
      setBusy(false);
    }
  };

  // Derived metrics & aggregations
  const totalOrganizations = organizations.length;
  const totalTeams = organizations.reduce((acc, o) => acc + (o.teams?.length || 0), 0);
  
  // Assigned projects calculation
  const assignedProjectIds = new Set();
  organizations.forEach(o => {
    (o.projects || []).forEach(p => assignedProjectIds.add(p.id));
  });
  const totalProjects = projects.length;
  const assignedProjectsCount = assignedProjectIds.size;
  const unassignedProjects = projects.filter(p => !assignedProjectIds.has(p.id));

  // Flatten all squads with parent org details
  const allSquads = (organizations || []).flatMap(org =>
    (org?.teams || []).map(team => ({
      ...team,
      orgId: org.id,
      orgName: org.name,
      orgSlug: org.slug,
      assignedProjects: (org?.projects || []).filter(p => p.team_id === team.id)
    }))
  );

  // Filter organizations by search
  const filteredOrganizations = organizations.filter(o => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = (o.name || "").toLowerCase().includes(q);
    const matchSlug = (o.slug || "").toLowerCase().includes(q);
    const matchTeams = (o.teams || []).some(t => (t.name || "").toLowerCase().includes(q));
    const matchProjects = (o.projects || []).some(p => (p.name || "").toLowerCase().includes(q));
    return matchName || matchSlug || matchTeams || matchProjects;
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
      {/* Toast notification banner */}
      {actionSuccessMessage && (
        <div
          className="prism-card message-animate-in"
          style={{
            padding: "12px 18px",
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            borderRadius: "8px",
            color: "var(--accent-teal)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "13px",
            fontWeight: "500"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <CheckCircle2 size={16} color="var(--accent-teal)" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            style={{ background: "transparent", border: "none", color: "var(--accent-teal)", cursor: "pointer" }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* FRAMEWORK PAGE HERO CARD */}
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
          border: "1px solid var(--border-subtle)",
          borderRadius: "12px",
          position: "relative",
          overflow: "hidden"
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
            <Building2 size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                PLATFORM ADMIN • MULTI-TENANT ENTERPRISE
              </span>
              <span className="badge badge-teal">Tenancy Partitioning</span>
              <span className="badge badge-violet">{totalOrganizations} Organizations</span>
              <span className="badge badge-magenta">{totalTeams} Squads</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px", letterSpacing: "-0.01em" }}>
              Organizations, Teams & Ownership Matrix
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px", maxWidth: "800px" }}>
              Architect enterprise multi-tenancy hierarchies, assign project fleets to dedicated SRE squads, and govern cross-tenant ownership boundaries.
            </p>
          </div>
        </div>

        {/* Hero Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => {
              setOrgModalError("");
              setNewOrgName("");
              setNewOrgSlug("");
              setShowCreateOrgModal(true);
            }}
            className="btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: "36px",
              padding: "0 14px",
              fontSize: "12px",
              fontWeight: "600",
              gap: "6px",
              borderRadius: "8px"
            }}
            title="Register a new business organization"
          >
            <Plus size={14} /> New Organization
          </button>

          <button
            onClick={() => {
              setTeamModalError("");
              setNewTeamName("");
              setTargetOrgIdForTeam(organizations[0]?.id || "");
              setShowAddTeamModal(true);
            }}
            className="btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: "36px",
              padding: "0 13px",
              fontSize: "12px",
              fontWeight: "600",
              gap: "6px",
              borderRadius: "8px"
            }}
            title="Add a squad to an existing organization"
          >
            <Users size={14} /> Add Squad
          </button>

          <button
            onClick={() => {
              setAssignModalError("");
              setTargetProjectId(unassignedProjects[0]?.id || projects[0]?.id || "");
              setTargetOrgIdForAssign(organizations[0]?.id || "");
              setTargetTeamIdForAssign("");
              setShowAssignModal(true);
            }}
            className="btn-ghost"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: "36px",
              padding: "0 12px",
              fontSize: "12px",
              fontWeight: "600",
              gap: "6px",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              background: "rgba(255, 255, 255, 0.03)"
            }}
            title="Map project fleet ownership"
          >
            <FolderKanban size={14} /> Assign Project
          </button>

          <button
            onClick={load}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-subtle)",
              cursor: "pointer",
              color: "var(--ink-secondary)",
              transition: "all 0.15s ease"
            }}
            title="Refresh organizations data"
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} />
          </button>
        </div>
      </div>

      {/* EXECUTIVE KPI STAT CARDS (4 TILES) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {/* Metric 1 */}
        <div
          className="prism-card"
          style={{
            padding: "16px 20px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
              Active Business Units
            </span>
            <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(99, 102, 241, 0.12)", color: "var(--prism-purple)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={15} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--ink-primary)", letterSpacing: "-0.02em" }}>
            {totalOrganizations}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "var(--ink-secondary)" }}>
            <ShieldCheck size={13} color="var(--accent-teal)" />
            <span>Multi-tenant partitioned</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div
          className="prism-card"
          style={{
            padding: "16px 20px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
              Governed SRE Squads
            </span>
            <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(236, 72, 153, 0.12)", color: "var(--prism-pink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={15} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--ink-primary)", letterSpacing: "-0.02em" }}>
            {totalTeams}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "var(--ink-secondary)" }}>
            <span>Cross-functional engineering pods</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div
          className="prism-card"
          style={{
            padding: "16px 20px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
              Partitioned Projects
            </span>
            <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(16, 185, 129, 0.12)", color: "var(--accent-teal)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FolderKanban size={15} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--ink-primary)", letterSpacing: "-0.02em" }}>
            {assignedProjectsCount} <span style={{ fontSize: "14px", fontWeight: "500", color: "var(--ink-tertiary)" }}>/ {totalProjects}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "var(--ink-secondary)" }}>
            <span className="badge badge-teal" style={{ fontSize: "9px" }}>
              {totalProjects > 0 ? Math.round((assignedProjectsCount / totalProjects) * 100) : 100}% Governed
            </span>
            <span>Fleet isolation rate</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div
          className="prism-card"
          style={{
            padding: "16px 20px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
              Unassigned Projects Buffer
            </span>
            <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: unassignedProjects.length > 0 ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)", color: unassignedProjects.length > 0 ? "var(--accent-amber)" : "var(--accent-teal)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Layers size={15} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--ink-primary)", letterSpacing: "-0.02em" }}>
            {unassignedProjects.length}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "var(--ink-secondary)" }}>
            {unassignedProjects.length > 0 ? (
              <span className="badge badge-amber" style={{ fontSize: "9px" }}>Pending Assignment</span>
            ) : (
              <span className="badge badge-teal" style={{ fontSize: "9px" }}>Full Fleet Assigned</span>
            )}
            <span>Platform-wide balance</span>
          </div>
        </div>
      </div>

      {/* CONTROLS BAR: TABS & SEARCH */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px"
        }}
      >
        {/* Navigation Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-card)", padding: "4px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
          <button
            onClick={() => setActiveTab("FLEET")}
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: "600",
              borderRadius: "6px",
              background: activeTab === "FLEET" ? "var(--prism-gradient)" : "transparent",
              color: activeTab === "FLEET" ? "#fff" : "var(--ink-secondary)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease"
            }}
          >
            <Building2 size={13} />
            <span>Organizations Fleet ({filteredOrganizations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("SQUADS")}
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: "600",
              borderRadius: "6px",
              background: activeTab === "SQUADS" ? "var(--prism-gradient)" : "transparent",
              color: activeTab === "SQUADS" ? "#fff" : "var(--ink-secondary)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease"
            }}
          >
            <Users size={13} />
            <span>Squads Matrix ({totalTeams})</span>
          </button>

          <button
            onClick={() => setActiveTab("ASSIGNMENT")}
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: "600",
              borderRadius: "6px",
              background: activeTab === "ASSIGNMENT" ? "var(--prism-gradient)" : "transparent",
              color: activeTab === "ASSIGNMENT" ? "#fff" : "var(--ink-secondary)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease"
            }}
          >
            <Network size={13} />
            <span>Ownership Studio</span>
            {unassignedProjects.length > 0 && (
              <span className="badge badge-amber" style={{ fontSize: "9px", padding: "1px 5px" }}>
                {unassignedProjects.length} Unlinked
              </span>
            )}
          </button>
        </div>

        {/* Instant Search Bar */}
        <div style={{ position: "relative", width: "320px" }}>
          <Search size={14} color="var(--ink-tertiary)" style={{ position: "absolute", left: "12px", top: "11px" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search organizations, slugs, squads, projects..."
            style={{
              width: "100%",
              height: "36px",
              padding: "0 12px 0 34px",
              background: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              color: "var(--ink-primary)",
              fontSize: "12px",
              outline: "none",
              transition: "all 0.15s ease"
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "10px",
                top: "10px",
                background: "transparent",
                border: "none",
                color: "var(--ink-tertiary)",
                cursor: "pointer"
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ERROR ALERT BANNER */}
      {error && (
        <div
          role="alert"
          className="prism-card"
          style={{
            padding: "16px",
            border: "1px solid rgba(225, 29, 72, 0.4)",
            background: "rgba(225, 29, 72, 0.08)",
            color: "var(--accent-rose)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: "8px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: "13px" }}>{error}</span>
          </div>
          <button onClick={load} className="btn-secondary" style={{ fontSize: "11.5px", padding: "4px 10px" }}>
            Retry Sync
          </button>
        </div>
      )}

      {/* TAB 1: ORGANIZATIONS FLEET CARDS */}
      {activeTab === "FLEET" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredOrganizations.length === 0 ? (
            <div
              className="prism-card"
              style={{
                padding: "48px 24px",
                textAlign: "center",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                background: "var(--bg-card)"
              }}
            >
              <Building2 size={36} color="var(--ink-tertiary)" />
              <div style={{ fontSize: "15px", fontWeight: "600", color: "var(--ink-primary)" }}>
                {searchQuery ? "No matching organizations found" : "No enterprise organizations created yet"}
              </div>
              <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", maxWidth: "420px" }}>
                {searchQuery
                  ? "Try clearing your search query or create a new organization."
                  : "Establish your first enterprise business unit to group squads and isolate autonomous SRE workflows."}
              </p>
              <button
                onClick={() => {
                  setOrgModalError("");
                  setNewOrgName("");
                  setNewOrgSlug("");
                  setShowCreateOrgModal(true);
                }}
                className="btn-primary"
                style={{ fontSize: "12px", marginTop: "6px" }}
              >
                <Plus size={14} /> Create First Organization
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(460px, 1fr))", gap: "18px" }}>
              {filteredOrganizations.map((org) => {
                const orgInitial = (org.name || "Org").slice(0, 2).toUpperCase();
                const teamsList = org.teams || [];
                const projectsList = org.projects || [];

                return (
                  <div
                    key={org.id}
                    className="prism-card"
                    style={{
                      padding: "20px",
                      borderRadius: "12px",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      transition: "all 0.18s ease"
                    }}
                  >
                    {/* Org Card Top Header */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)",
                            border: "1px solid rgba(99, 102, 241, 0.4)",
                            color: "var(--prism-pink)",
                            fontWeight: "800",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}
                        >
                          {orgInitial}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink-primary)", margin: 0 }}>
                              {org.name}
                            </h3>
                            <span className="mono badge badge-magenta" style={{ fontSize: "9px" }}>
                              {org.slug}
                            </span>
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "2px" }}>
                            ID: <span className="mono">{org.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Header Quick Menu */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <button
                          onClick={() => {
                            setTeamModalError("");
                            setNewTeamName("");
                            setTargetOrgIdForTeam(org.id);
                            setShowAddTeamModal(true);
                          }}
                          className="btn-secondary"
                          style={{ fontSize: "11px", padding: "4px 8px", gap: "4px" }}
                          title="Add Squad to this Organization"
                        >
                          <Plus size={12} /> Squad
                        </button>
                        <button
                          onClick={() => {
                            setAssignModalError("");
                            setTargetProjectId(unassignedProjects[0]?.id || projects[0]?.id || "");
                            setTargetOrgIdForAssign(org.id);
                            setTargetTeamIdForAssign("");
                            setShowAssignModal(true);
                          }}
                          className="btn-ghost"
                          style={{ fontSize: "11px", padding: "4px 8px", gap: "4px", border: "1px solid var(--border-subtle)" }}
                          title="Assign project to this organization"
                        >
                          <FolderKanban size={12} /> Link
                        </button>
                        <button
                          onClick={() => handleDeleteOrg(org)}
                          style={{
                            background: "transparent",
                            border: "1px solid transparent",
                            borderRadius: "6px",
                            padding: "4px 6px",
                            color: "var(--ink-muted)",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "var(--accent-rose)";
                            e.currentTarget.style.borderColor = "rgba(225, 29, 72, 0.3)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--ink-muted)";
                            e.currentTarget.style.borderColor = "transparent";
                          }}
                          title="Delete Organization"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Section 1: Governed Squads / Teams */}
                    <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                          SRE Squads & Pods ({teamsList.length})
                        </span>
                      </div>

                      {teamsList.length === 0 ? (
                        <div style={{ fontSize: "11.5px", color: "var(--ink-muted)", fontStyle: "italic", padding: "4px 0" }}>
                          No dedicated squads configured yet. Projects will operate under organization-level governance.
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {teamsList.map((team) => (
                            <div
                              key={team.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                background: "rgba(255, 255, 255, 0.04)",
                                border: "1px solid var(--border-subtle)",
                                fontSize: "11.5px",
                                color: "var(--ink-primary)"
                              }}
                            >
                              <Users size={12} color="var(--prism-pink)" />
                              <span style={{ fontWeight: "500" }}>{team.name}</span>
                              <button
                                onClick={() => handleDeleteTeam(org.id, team)}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "var(--ink-tertiary)",
                                  cursor: "pointer",
                                  padding: 0,
                                  display: "flex",
                                  alignItems: "center"
                                }}
                                title={`Delete ${team.name}`}
                              >
                                <X size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Section 2: Assigned Project Fleets */}
                    <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                          Governed Project Fleets ({projectsList.length})
                        </span>
                      </div>

                      {projectsList.length === 0 ? (
                        <div style={{ fontSize: "11.5px", color: "var(--ink-muted)", fontStyle: "italic", padding: "4px 0" }}>
                          No project fleets linked. Click "Link" above to assign an active service.
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {projectsList.map((p) => {
                            const owningTeam = teamsList.find(t => t.id === p.team_id);
                            return (
                              <div
                                key={p.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "7px 10px",
                                  borderRadius: "6px",
                                  background: "var(--bg-app)",
                                  border: "1px solid var(--border-subtle)"
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span className="mono badge badge-teal" style={{ fontSize: "9px" }}>
                                    {p.id}
                                  </span>
                                  <span style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--ink-primary)" }}>
                                    {p.name}
                                  </span>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span
                                    className={`badge ${owningTeam ? "badge-magenta" : "badge-slate"}`}
                                    style={{ fontSize: "9.5px" }}
                                  >
                                    {owningTeam ? owningTeam.name : "Org-Wide"}
                                  </span>
                                  <button
                                    onClick={() => handleUnassignProject(org.id, p.id, p.name)}
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: "var(--ink-tertiary)",
                                      cursor: "pointer",
                                      padding: "2px",
                                      display: "flex",
                                      alignItems: "center"
                                    }}
                                    title="Unassign project from organization"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SQUADS MATRIX VIEW */}
      {activeTab === "SQUADS" && (
        <div className="prism-card" style={{ padding: "20px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--ink-primary)", margin: 0 }}>
                Enterprise SRE Squads & Pods Matrix
              </h3>
              <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "2px" }}>
                Directory of all operational squads partitioned by business organization and assigned services.
              </p>
            </div>
            <button
              onClick={() => {
                setTeamModalError("");
                setNewTeamName("");
                setTargetOrgIdForTeam(organizations[0]?.id || "");
                setShowAddTeamModal(true);
              }}
              className="btn-primary"
              style={{ fontSize: "11.5px", gap: "5px" }}
            >
              <Plus size={13} /> Add Squad
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--ink-tertiary)" }}>
                  <th style={{ padding: "10px 12px", fontWeight: "700" }}>SQUAD / POD NAME</th>
                  <th style={{ padding: "10px 12px", fontWeight: "700" }}>PARENT BUSINESS UNIT</th>
                  <th style={{ padding: "10px 12px", fontWeight: "700" }}>ASSIGNED PROJECT FLEET</th>
                  <th style={{ padding: "10px 12px", fontWeight: "700" }}>SERVICES GOVERNED</th>
                  <th style={{ padding: "10px 12px", fontWeight: "700", textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {allSquads.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "28px", textAlign: "center", color: "var(--ink-tertiary)" }}>
                      No squads configured yet. Click "Add Squad" to establish your first engineering pod.
                    </td>
                  </tr>
                ) : (
                  allSquads.map((squad) => (
                    <tr key={squad.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "12px", fontWeight: "600", color: "var(--ink-primary)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "rgba(236, 72, 153, 0.1)", color: "var(--prism-pink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Users size={12} />
                          </div>
                          <span>{squad.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Building2 size={13} color="var(--prism-purple)" />
                          <span style={{ fontWeight: "600", color: "var(--ink-primary)" }}>{squad.orgName}</span>
                          <span className="mono badge badge-magenta" style={{ fontSize: "8.5px" }}>{squad.orgSlug}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        {squad.assignedProjects && squad.assignedProjects.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {squad.assignedProjects.map(sp => (
                              <span key={sp.id} className="badge badge-teal" style={{ fontSize: "10px" }}>
                                {sp.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "var(--ink-muted)", fontStyle: "italic", fontSize: "11px" }}>
                            No assigned services
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span className={`badge ${squad.assignedProjects && squad.assignedProjects.length > 0 ? "badge-teal" : "badge-slate"}`} style={{ fontSize: "9.5px" }}>
                          {squad.assignedProjects?.length || 0} {squad.assignedProjects?.length === 1 ? "Service" : "Services"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <button
                          onClick={() => handleDeleteTeam(squad.orgId, squad)}
                          className="btn-ghost"
                          style={{ padding: "4px 8px", fontSize: "11px", color: "var(--accent-rose)" }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: OWNERSHIP STUDIO VIEW */}
      {activeTab === "ASSIGNMENT" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* Left Column: Unassigned Fleet Buffer */}
          <div className="prism-card" style={{ padding: "20px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--ink-primary)", margin: 0 }}>
                Unassigned Fleet Projects ({unassignedProjects.length})
              </h3>
              <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "2px" }}>
                Projects currently running without a parent organization or squad ownership boundary.
              </p>
            </div>

            {unassignedProjects.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--accent-teal)", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 size={32} />
                <span style={{ fontSize: "13px", fontWeight: "600" }}>All enterprise project fleets are assigned!</span>
                <span style={{ fontSize: "11.5px", color: "var(--ink-secondary)" }}>Zero-trust multi-tenant partitioning is 100% complete.</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {unassignedProjects.map(proj => (
                  <div
                    key={proj.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="mono badge badge-teal" style={{ fontSize: "9px" }}>{proj.project_key}</span>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink-primary)" }}>{proj.name}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "2px" }}>
                        {proj.description || "Enterprise monitored service"}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setAssignModalError("");
                        setTargetProjectId(proj.id);
                        setTargetOrgIdForAssign(organizations[0]?.id || "");
                        setTargetTeamIdForAssign("");
                        setShowAssignModal(true);
                      }}
                      className="btn-primary"
                      style={{ fontSize: "11px", padding: "4px 10px", gap: "4px" }}
                    >
                      Assign <ArrowRight size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Direct Ownership Configuration Form */}
          <div className="prism-card" style={{ padding: "20px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--ink-primary)", margin: 0 }}>
                Map Project to Squad
              </h3>
              <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "2px" }}>
                Designate the owning organization and dedicated SRE squad for any enterprise service.
              </p>
            </div>

            <form onSubmit={handleAssignProjectSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {assignModalError && (
                <div style={{ padding: "8px 12px", borderRadius: "6px", background: "rgba(225, 29, 72, 0.1)", border: "1px solid rgba(225, 29, 72, 0.3)", color: "var(--accent-rose)", fontSize: "12px" }}>
                  {assignModalError}
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "var(--ink-secondary)", marginBottom: "6px" }}>
                  Project Fleet Service
                </label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 10px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    color: "var(--ink-primary)",
                    fontSize: "12.5px",
                    outline: "none"
                  }}
                  required
                >
                  <option value="">Select project to assign...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.project_key})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "var(--ink-secondary)", marginBottom: "6px" }}>
                  Parent Business Organization
                </label>
                <select
                  value={targetOrgIdForAssign}
                  onChange={(e) => {
                    setTargetOrgIdForAssign(e.target.value);
                    setTargetTeamIdForAssign("");
                  }}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 10px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    color: "var(--ink-primary)",
                    fontSize: "12.5px",
                    outline: "none"
                  }}
                  required
                >
                  <option value="">Select organization...</option>
                  {organizations.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "var(--ink-secondary)", marginBottom: "6px" }}>
                  Assigned SRE Squad (Optional)
                </label>
                <select
                  value={targetTeamIdForAssign}
                  onChange={(e) => setTargetTeamIdForAssign(e.target.value)}
                  disabled={!targetOrgIdForAssign}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 10px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    color: "var(--ink-primary)",
                    fontSize: "12.5px",
                    outline: "none"
                  }}
                >
                  <option value="">Organization-level governance (no specific squad)</option>
                  {(organizations.find(o => o.id === targetOrgIdForAssign)?.teams || []).map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: "8px" }}>
                <button
                  type="submit"
                  disabled={busy || !targetProjectId || !targetOrgIdForAssign}
                  className="btn-primary"
                  style={{ width: "100%", height: "36px", justifyContent: "center", fontSize: "12.5px", fontWeight: "600" }}
                >
                  {busy ? "Saving Ownership..." : "Save Ownership Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE ORGANIZATION                                              */}
      {/* ========================================================================= */}
      {showCreateOrgModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <div
            className="prism-card message-animate-in"
            style={{
              width: "100%",
              maxWidth: "480px",
              padding: "24px",
              borderRadius: "14px",
              background: "var(--bg-card)",
              border: "1px solid var(--prism-purple)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "var(--prism-gradient)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Building2 size={16} />
                </div>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink-primary)", margin: 0 }}>
                    Register Enterprise Organization
                  </h2>
                  <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                    Establish isolated tenant scope for squads and projects
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowCreateOrgModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--ink-tertiary)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {orgModalError && (
              <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(225, 29, 72, 0.1)", border: "1px solid rgba(225, 29, 72, 0.3)", color: "var(--accent-rose)", fontSize: "12px" }}>
                {orgModalError}
              </div>
            )}

            <form onSubmit={handleCreateOrgSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--ink-secondary)", marginBottom: "6px" }}>
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={255}
                  value={newOrgName}
                  onChange={(e) => handleOrgNameChange(e.target.value)}
                  placeholder="e.g. Cloud Infrastructure & Platform Services"
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 12px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    color: "var(--ink-primary)",
                    fontSize: "12.5px",
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--ink-secondary)", marginBottom: "6px" }}>
                  URL Identifier / Slug *
                </label>
                <input
                  type="text"
                  required
                  pattern="[a-z0-9][a-z0-9-]{0,63}"
                  maxLength={64}
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="e.g. cloud-platform"
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 12px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    color: "var(--ink-primary)",
                    fontSize: "12.5px",
                    outline: "none",
                    fontFamily: "var(--font-mono, monospace)"
                  }}
                />
                <span style={{ fontSize: "10.5px", color: "var(--ink-tertiary)", marginTop: "4px", display: "block" }}>
                  Lowercase letters, numbers, and hyphens only (max 64 chars).
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateOrgModal(false)}
                  className="btn-ghost"
                  style={{ fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-primary"
                  style={{ fontSize: "12px", padding: "0 16px" }}
                >
                  {busy ? "Registering..." : "Create Organization"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD SQUAD / TEAM                                                 */}
      {/* ========================================================================= */}
      {showAddTeamModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <div
            className="prism-card message-animate-in"
            style={{
              width: "100%",
              maxWidth: "460px",
              padding: "24px",
              borderRadius: "14px",
              background: "var(--bg-card)",
              border: "1px solid var(--prism-pink)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(236, 72, 153, 0.2)", color: "var(--prism-pink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={16} />
                </div>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink-primary)", margin: 0 }}>
                    Add SRE Squad / Team
                  </h2>
                  <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                    Partition engineering pods within an organization
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAddTeamModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--ink-tertiary)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {teamModalError && (
              <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(225, 29, 72, 0.1)", border: "1px solid rgba(225, 29, 72, 0.3)", color: "var(--accent-rose)", fontSize: "12px" }}>
                {teamModalError}
              </div>
            )}

            <form onSubmit={handleCreateTeamSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--ink-secondary)", marginBottom: "6px" }}>
                  Parent Organization *
                </label>
                <select
                  value={targetOrgIdForTeam}
                  onChange={(e) => setTargetOrgIdForTeam(e.target.value)}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 10px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    color: "var(--ink-primary)",
                    fontSize: "12.5px",
                    outline: "none"
                  }}
                  required
                >
                  {organizations.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--ink-secondary)", marginBottom: "6px" }}>
                  Squad / Team Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={255}
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Core Settlement & Ledger SRE"
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 12px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    color: "var(--ink-primary)",
                    fontSize: "12.5px",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="btn-ghost"
                  style={{ fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-primary"
                  style={{ fontSize: "12px", padding: "0 16px" }}
                >
                  {busy ? "Adding Squad..." : "Add Squad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ASSIGN PROJECT OWNERSHIP                                         */}
      {/* ========================================================================= */}
      {showAssignModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <div
            className="prism-card message-animate-in"
            style={{
              width: "100%",
              maxWidth: "480px",
              padding: "24px",
              borderRadius: "14px",
              background: "var(--bg-card)",
              border: "1px solid var(--accent-teal)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.2)", color: "var(--accent-teal)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FolderKanban size={16} />
                </div>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink-primary)", margin: 0 }}>
                    Assign Project Fleet Ownership
                  </h2>
                  <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                    Map a service engine to an organization and SRE squad
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--ink-tertiary)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {assignModalError && (
              <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(225, 29, 72, 0.1)", border: "1px solid rgba(225, 29, 72, 0.3)", color: "var(--accent-rose)", fontSize: "12px" }}>
                {assignModalError}
              </div>
            )}

            <form onSubmit={handleAssignProjectSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--ink-secondary)", marginBottom: "6px" }}>
                  Select Project Fleet Service *
                </label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 10px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    color: "var(--ink-primary)",
                    fontSize: "12.5px",
                    outline: "none"
                  }}
                  required
                >
                  <option value="">Choose a project...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.project_key})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--ink-secondary)", marginBottom: "6px" }}>
                  Target Organization *
                </label>
                <select
                  value={targetOrgIdForAssign}
                  onChange={(e) => {
                    setTargetOrgIdForAssign(e.target.value);
                    setTargetTeamIdForAssign("");
                  }}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 10px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    color: "var(--ink-primary)",
                    fontSize: "12.5px",
                    outline: "none"
                  }}
                  required
                >
                  <option value="">Choose an organization...</option>
                  {organizations.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--ink-secondary)", marginBottom: "6px" }}>
                  Owning Squad / Team (Optional)
                </label>
                <select
                  value={targetTeamIdForAssign}
                  onChange={(e) => setTargetTeamIdForAssign(e.target.value)}
                  disabled={!targetOrgIdForAssign}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 10px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    color: "var(--ink-primary)",
                    fontSize: "12.5px",
                    outline: "none"
                  }}
                >
                  <option value="">Organization only (no dedicated squad)</option>
                  {(organizations.find(o => o.id === targetOrgIdForAssign)?.teams || []).map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="btn-ghost"
                  style={{ fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy || !targetProjectId || !targetOrgIdForAssign}
                  className="btn-primary"
                  style={{ fontSize: "12px", padding: "0 16px" }}
                >
                  {busy ? "Saving..." : "Save Ownership"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminOrganizationsPage;
