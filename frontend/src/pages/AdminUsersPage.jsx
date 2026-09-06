import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  ShieldCheck,
  Shield,
  UserCheck,
  Lock,
  ArrowRight,
  Plus,
  KeyRound,
  Layers,
  Sparkles,
  X,
  Sliders,
  Check,
  Edit2,
  Trash2,
  AlertCircle
} from "lucide-react";
import { 
  fetchAdminUsers, 
  fetchIamRoles, 
  createCustomRole,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  fetchProjects
} from "../api/client";
import { useAuth } from "../context/AuthContext";

const ROLE_BADGE_MAP = {
  PLATFORM_ADMIN: { label: "Platform Admin", class: "badge-magenta" },
  PROJECT_OWNER: { label: "Project Owner", class: "badge-violet" },
  PROJECT_ANALYST: { label: "Project Analyst", class: "badge-teal" },
  PROJECT_MANAGER: { label: "Project Manager", class: "badge-amber" },
  PROJECT_VIEWER: { label: "Project Viewer", class: "badge-cyan" },
  GENERAL_VIEWER: { label: "General Viewer", class: "badge-slate" },
  ADMIN: { label: "Platform Admin", class: "badge-magenta" },
  TRIAGE_ENGINEER: { label: "Project Analyst", class: "badge-teal" }
};

const ALL_CAPABILITIES = [
  { key: "portal:generic_view", label: "Portal Generic View", desc: "Access platform home & status" },
  { key: "portal:docs_view", label: "Developer Docs", desc: "View system documentation & APIs" },
  { key: "portal:access_request", label: "Access Request Desk", desc: "Submit project access requests" },
  { key: "project:view", label: "Project View", desc: "View internal project pages" },
  { key: "triage_board:view", label: "Live Triage Board", desc: "Observe real-time SRE triage board" },
  { key: "investigation:chat", label: "Investigation Chat", desc: "Query & chat with incident investigation stream" },
  { key: "metrics:view", label: "Metrics & Telemetry", desc: "View project metrics, SLAs, & APM" },
  { key: "reports:view", label: "Reports & Digests", desc: "Inspect cadence digests & postmortems" },
  { key: "analysis:execute", label: "Analysis Execution", desc: "Run auto-triage investigations & diagnostic probes" },
  { key: "actions:stage_proposal", label: "Stage Action Proposals", desc: "Stage proposals, attach evidence & update tickets" },
  { key: "actions:approve_write_lock", label: "Approve Write Locks", desc: "Authorize high-impact mutating actions" },
  { key: "project:config_write", label: "Project Config Write", desc: "Edit Setup Studio, environment mappings & directives" },
  { key: "project:oversee_dashboard", label: "Project Oversight", desc: "Executive monitoring & burndown tracking" },
  { key: "admin:console_access", label: "Admin Console Access", desc: "Access /admin/* fleet governance suite" },
  { key: "iam:manage_roles", label: "IAM Role Governance", desc: "Create roles and manage access matrices" }
];

export function AdminUsersPage() {
  const { refreshPersonas } = useAuth();
  const [activeTab, setActiveTab] = useState("USERS"); // "USERS" or "ROLES"
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccessMessage, setActionSuccessMessage] = useState(null);

  // User Add/Edit Modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userFullName, setUserFullName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userGlobalRole, setUserGlobalRole] = useState("STANDARD_USER");
  const [userDepartment, setUserDepartment] = useState("Production Reliability Engineering");
  const [userAvatarUrl, setUserAvatarUrl] = useState("");
  const [userStatus, setUserStatus] = useState("ACTIVE");
  const [userMemberships, setUserMemberships] = useState([]);
  const [userModalError, setUserModalError] = useState(null);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Custom role modal
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [newRoleKey, setNewRoleKey] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newScope, setNewScope] = useState("PROJECT");
  const [newDesc, setNewDesc] = useState("");
  const [selectedCaps, setSelectedCaps] = useState(["project:view", "triage_board:view", "investigation:chat"]);
  const [createRoleError, setCreateRoleError] = useState(null);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      fetchAdminUsers().catch(() => []),
      fetchIamRoles().catch(() => []),
      fetchProjects().catch(() => [])
    ])
      .then(([usersData, rolesData, projsData]) => {
        if (Array.isArray(usersData)) setUsers(usersData);
        if (Array.isArray(rolesData)) setRoles(rolesData);
        if (Array.isArray(projsData)) setAvailableProjects(projsData);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddUserModal = () => {
    setEditingUserId(null);
    setUserFullName("");
    setUserEmail("");
    setUserGlobalRole("STANDARD_USER");
    setUserDepartment("Production Reliability Engineering");
    setUserAvatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80");
    setUserStatus("ACTIVE");
    setUserMemberships([]);
    setUserModalError(null);
    setShowUserModal(true);
  };

  const openEditUserModal = (user) => {
    setEditingUserId(user.id);
    setUserFullName(user.name);
    setUserEmail(user.email);
    setUserGlobalRole(user.global_role || "STANDARD_USER");
    setUserDepartment(user.department || "Production Reliability Engineering");
    setUserAvatarUrl(user.avatar_url || "");
    setUserStatus(user.status || "ACTIVE");

    // Prepopulate memberships
    const mems = (user.project_memberships || []).map(m => ({
      project_key: m.project_key,
      project_role: m.project_role
    }));
    setUserMemberships(mems.length > 0 ? mems : (user.projects && user.projects[0] !== "ALL" ? user.projects.map(p => ({ project_key: p, project_role: user.role })) : []));
    setUserModalError(null);
    setShowUserModal(true);
  };

  const handleAddMembershipRow = () => {
    const defaultProj = availableProjects[0]?.project_key || "";
    setUserMemberships([...userMemberships, { project_key: defaultProj, project_role: "PROJECT_VIEWER" }]);
  };

  const handleRemoveMembershipRow = (idx) => {
    setUserMemberships(userMemberships.filter((_, i) => i !== idx));
  };

  const handleUpdateMembershipRow = (idx, field, val) => {
    const updated = [...userMemberships];
    updated[idx] = { ...updated[idx], [field]: val };
    setUserMemberships(updated);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setUserModalError(null);

    if (!userFullName.trim()) {
      setUserModalError("Full name is required.");
      return;
    }
    if (!userEmail.trim()) {
      setUserModalError("Email is required.");
      return;
    }

    setIsSubmittingUser(true);
    try {
      const payload = {
        email: userEmail.trim().toLowerCase(),
        full_name: userFullName.trim(),
        global_role: userGlobalRole,
        department: userDepartment.trim(),
        avatar_url: userAvatarUrl.trim() || undefined,
        status: userStatus,
        project_memberships: userGlobalRole === "GENERAL_VIEWER" ? [] : userMemberships
      };

      if (editingUserId) {
        await updateAdminUser(editingUserId, payload);
        setActionSuccessMessage(`User ${userEmail} updated successfully.`);
      } else {
        await createAdminUser(payload);
        setActionSuccessMessage(`User ${userEmail} created successfully.`);
      }

      setShowUserModal(false);
      loadData();
      if (refreshPersonas) refreshPersonas();
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err) {
      setUserModalError(err.message || "Operation failed.");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to permanently delete user account "${userEmail}"?`)) {
      return;
    }
    try {
      await deleteAdminUser(userId);
      setActionSuccessMessage(`User ${userEmail} deleted successfully.`);
      loadData();
      if (refreshPersonas) refreshPersonas();
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err) {
      alert(err.message || "Failed to delete user");
    }
  };

  const handleToggleCap = (capKey) => {
    if (selectedCaps.includes(capKey)) {
      setSelectedCaps(selectedCaps.filter(c => c !== capKey));
    } else {
      setSelectedCaps([...selectedCaps, capKey]);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setCreateRoleError(null);
    if (!newRoleKey.trim() || !newDisplayName.trim()) {
      setCreateRoleError("Role Key and Display Name are required.");
      return;
    }

    setIsSubmittingRole(true);
    try {
      await createCustomRole({
        role_key: newRoleKey.trim().toUpperCase().replace(/\s+/g, "_"),
        display_name: newDisplayName.trim(),
        scope: newScope,
        description: newDesc.trim() || undefined,
        capabilities: selectedCaps
      });
      setShowCreateRoleModal(false);
      setNewRoleKey("");
      setNewDisplayName("");
      setNewDesc("");
      loadData();
      setActionSuccessMessage(`Role ${newDisplayName} created.`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err) {
      setCreateRoleError(err.message || "Failed to create custom role");
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== "ALL" && u.role !== roleFilter && u.global_role !== roleFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.role && u.role.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q))
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
            <Users size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                PLATFORM ADMIN • IAM & RBAC
              </span>
              <span className="badge badge-teal">Full Persistence Active</span>
              <span className="badge badge-magenta">Database Synchronized</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Users, Roles & RBAC Governance
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Add, edit, and govern platform users, project memberships, delegated write-locks, and dynamic role matrices.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={openAddUserModal}
            className="btn-primary"
            style={{ fontSize: "12px", gap: "6px" }}
          >
            <Plus size={14} /> Add User
          </button>
          <button
            onClick={() => setActiveTab("USERS")}
            className={activeTab === "USERS" ? "btn-secondary" : "btn-ghost"}
            style={{ fontSize: "12px", gap: "6px" }}
          >
            <Users size={14} /> Active Personas ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("ROLES")}
            className={activeTab === "ROLES" ? "btn-secondary" : "btn-ghost"}
            style={{ fontSize: "12px", gap: "6px" }}
          >
            <ShieldCheck size={14} /> Role Definitions ({roles.length})
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {actionSuccessMessage && (
        <div
          className="message-animate-in"
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "var(--accent-teal)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12.5px"
          }}
        >
          <CheckCircle2 size={16} />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* TAB 1: USERS & ACCESS */}
      {activeTab === "USERS" && (
        <>
          {/* Filter Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "260px" }}>
              <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--ink-tertiary)" }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Filter users by name, email, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: "32px", fontSize: "12px", width: "100%" }}
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input-field"
                style={{ fontSize: "12px", width: "180px" }}
              >
                <option value="ALL">All Roles</option>
                <option value="PLATFORM_ADMIN">Platform Admin</option>
                <option value="PROJECT_OWNER">Project Owner</option>
                <option value="PROJECT_ANALYST">Project Analyst</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="PROJECT_VIEWER">Project Viewer</option>
                <option value="GENERAL_VIEWER">General Viewer</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "12px", color: "var(--ink-tertiary)" }}>
                Showing {filteredUsers.length} of {users.length} personas
              </div>
              <button
                onClick={openAddUserModal}
                className="btn-primary"
                style={{ fontSize: "11.5px", padding: "6px 12px", gap: "4px" }}
              >
                <Plus size={13} /> Add User
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="prism-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)", color: "var(--ink-secondary)", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px" }}>User & Identity</th>
                  <th style={{ padding: "12px 16px" }}>Effective Role</th>
                  <th style={{ padding: "12px 16px" }}>Framework Write Lock</th>
                  <th style={{ padding: "12px 16px" }}>Assigned Projects</th>
                  <th style={{ padding: "12px 16px" }}>Department</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const roleConfig = ROLE_BADGE_MAP[u.role] || { label: u.role, class: "badge-teal" };
                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt={u.name}
                              style={{ width: "32px", height: "32px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                background: "var(--prism-gradient)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontSize: "11px",
                                fontWeight: 700,
                                flexShrink: 0
                              }}
                            >
                              {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--ink-primary)" }}>{u.name}</div>
                            <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span className={`badge ${roleConfig.class}`}>{roleConfig.label}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {u.delegatedWrite ? (
                          <span className="badge badge-magenta" style={{ gap: "4px" }}>
                            <ShieldCheck size={11} /> Authorized Writer
                          </span>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>Read-Only Observer</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {u.projects && u.projects.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {u.projects.map((p) => (
                              <span
                                key={p}
                                style={{
                                  fontSize: "10px",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  background: "var(--bg-input)",
                                  border: "1px solid var(--border-subtle)",
                                  color: "var(--prism-pink)",
                                  fontFamily: "'JetBrains Mono', monospace"
                                }}
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="badge badge-slate" style={{ fontSize: "9.5px" }}>Portal Scope (None)</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--ink-secondary)" }}>
                        {u.department || "Platform Engineering"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span className={`badge ${u.status === "ACTIVE" ? "badge-teal" : "badge-amber"}`}>{u.status}</span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                          <button
                            onClick={() => openEditUserModal(u)}
                            className="btn-ghost"
                            style={{ padding: "5px 8px", borderRadius: "6px", color: "var(--ink-primary)" }}
                            title="Edit User & Project Roles"
                          >
                            <Edit2 size={13} />
                          </button>
                          {!u.is_seeded_admin && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="btn-ghost"
                              style={{ padding: "5px 8px", borderRadius: "6px", color: "var(--accent-rose)" }}
                              title="Delete User Account"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* TAB 2: ROLE DEFINITIONS & CAPABILITY MATRIX */}
      {activeTab === "ROLES" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink-primary)" }}>
                Canonical Role Definitions & Atomic Capabilities
              </h2>
              <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "2px" }}>
                Each role grants a discrete set of capability tokens. New custom roles can be created dynamically.
              </p>
            </div>
            <button
              onClick={() => setShowCreateRoleModal(true)}
              className="btn-primary"
              style={{ fontSize: "12px", gap: "6px" }}
            >
              <Plus size={14} /> Create Custom Role
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
            {roles.map((r) => {
              const badgeStyle = ROLE_BADGE_MAP[r.role_key]?.class || "badge-teal";
              return (
                <div
                  key={r.id || r.role_key}
                  className="prism-card"
                  style={{
                    padding: "18px 20px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-card)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className={`badge ${badgeStyle}`} style={{ fontSize: "11px", fontWeight: 700 }}>
                        {r.display_name}
                      </span>
                      <span className="mono badge badge-slate" style={{ fontSize: "9px" }}>
                        {r.scope}
                      </span>
                    </div>
                    {r.is_custom ? (
                      <span className="badge badge-amber" style={{ fontSize: "9px" }}>Custom Role</span>
                    ) : (
                      <span className="badge badge-teal" style={{ fontSize: "9px" }}>System Core</span>
                    )}
                  </div>

                  <p style={{ fontSize: "12px", color: "var(--ink-secondary)", lineHeight: "1.4" }}>
                    {r.description}
                  </p>

                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", marginBottom: "6px" }}>
                      Capabilities Granted ({r.capabilities?.length || 0})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {(r.capabilities || []).map((cap) => (
                        <span
                          key={cap}
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(255, 255, 255, 0.04)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--accent-teal)",
                            fontFamily: "'JetBrains Mono', monospace"
                          }}
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADD / EDIT USER MODAL */}
      {showUserModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
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
            className="prism-card message-animate-in"
            style={{
              width: "100%",
              maxWidth: "580px",
              padding: "24px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={18} color="var(--prism-pink)" />
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink-primary)" }}>
                  {editingUserId ? "Edit User & Project Roles" : "Add New Platform User"}
                </h2>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="btn-ghost"
                style={{ padding: "4px", borderRadius: "6px" }}
              >
                <X size={16} />
              </button>
            </div>

            {userModalError && (
              <div style={{ padding: "8px 12px", borderRadius: "6px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "var(--accent-rose)", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertCircle size={14} />
                <span>{userModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--ink-secondary)", marginBottom: "4px" }}>
                    FULL NAME *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. David Miller"
                    value={userFullName}
                    onChange={(e) => setUserFullName(e.target.value)}
                    required
                    style={{ width: "100%", fontSize: "12.5px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--ink-secondary)", marginBottom: "4px" }}>
                    EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="e.g. david.miller@company.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    required
                    style={{ width: "100%", fontSize: "12.5px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--ink-secondary)", marginBottom: "4px" }}>
                    GLOBAL ROLE SCOPE
                  </label>
                  <select
                    value={userGlobalRole}
                    onChange={(e) => setUserGlobalRole(e.target.value)}
                    className="input-field"
                    style={{ width: "100%", fontSize: "12.5px" }}
                  >
                    <option value="STANDARD_USER">Standard Project Member</option>
                    <option value="PLATFORM_ADMIN">Platform Admin (Global Control)</option>
                    <option value="GENERAL_VIEWER">General Viewer (No Projects / Portal Only)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--ink-secondary)", marginBottom: "4px" }}>
                    DEPARTMENT
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Production Reliability"
                    value={userDepartment}
                    onChange={(e) => setUserDepartment(e.target.value)}
                    style={{ width: "100%", fontSize: "12.5px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--ink-secondary)", marginBottom: "4px" }}>
                    AVATAR IMAGE URL
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="https://..."
                    value={userAvatarUrl}
                    onChange={(e) => setUserAvatarUrl(e.target.value)}
                    style={{ width: "100%", fontSize: "12px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--ink-secondary)", marginBottom: "4px" }}>
                    ACCOUNT STATUS
                  </label>
                  <select
                    value={userStatus}
                    onChange={(e) => setUserStatus(e.target.value)}
                    className="input-field"
                    style={{ width: "100%", fontSize: "12.5px" }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Project Memberships Section (Only for standard/admin users) */}
              {userGlobalRole !== "GENERAL_VIEWER" && (
                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-secondary)", textTransform: "uppercase" }}>
                        Assigned Projects & Project-Level Roles
                      </label>
                      <div style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>
                        Configure which projects this user can access and their exact role authority.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMembershipRow}
                      className="btn-secondary"
                      style={{ fontSize: "11px", padding: "4px 8px", gap: "4px" }}
                    >
                      <Plus size={12} /> Add Project
                    </button>
                  </div>

                  {userMemberships.length === 0 ? (
                    <div style={{ padding: "12px", textAlign: "center", background: "var(--bg-elevated)", borderRadius: "8px", border: "1px dashed var(--border-subtle)", fontSize: "11.5px", color: "var(--ink-tertiary)" }}>
                      No project memberships configured. User will have no project-level access.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {userMemberships.map((m, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border-subtle)"
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <select
                              value={m.project_key}
                              onChange={(e) => handleUpdateMembershipRow(idx, "project_key", e.target.value)}
                              className="input-field"
                              style={{ width: "100%", fontSize: "11.5px", padding: "4px 8px" }}
                            >
                              {availableProjects.map((p) => (
                                <option key={p.id || p.project_key} value={p.project_key}>
                                  {p.project_key} - {p.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div style={{ flex: 1 }}>
                            <select
                              value={m.project_role}
                              onChange={(e) => handleUpdateMembershipRow(idx, "project_role", e.target.value)}
                              className="input-field"
                              style={{ width: "100%", fontSize: "11.5px", padding: "4px 8px" }}
                            >
                              <option value="PROJECT_OWNER">Project Owner (Sets configs & approves write locks)</option>
                              <option value="PROJECT_ANALYST">Project Analyst (Performs analysis & live triage)</option>
                              <option value="PROJECT_MANAGER">Project Manager (Oversees metrics & reports)</option>
                              <option value="PROJECT_VIEWER">Project Viewer (Read-only live board & chat)</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveMembershipRow(idx)}
                            className="btn-ghost"
                            style={{ color: "var(--accent-rose)", padding: "4px" }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="btn-secondary"
                  style={{ fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="btn-primary"
                  style={{ fontSize: "12px", gap: "6px" }}
                >
                  {isSubmittingUser ? "Saving..." : (editingUserId ? "Save Changes" : "Create User")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM ROLE MODAL */}
      {showCreateRoleModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
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
            className="prism-card message-animate-in"
            style={{
              width: "100%",
              maxWidth: "540px",
              padding: "24px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={18} color="var(--prism-pink)" />
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink-primary)" }}>
                  Create New Extensible Role
                </h2>
              </div>
              <button
                onClick={() => setShowCreateRoleModal(false)}
                className="btn-ghost"
                style={{ padding: "4px", borderRadius: "6px" }}
              >
                <X size={16} />
              </button>
            </div>

            {createRoleError && (
              <div style={{ padding: "8px 12px", borderRadius: "6px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "var(--accent-rose)", fontSize: "12px" }}>
                {createRoleError}
              </div>
            )}

            <form onSubmit={handleCreateRole} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--ink-secondary)", marginBottom: "4px" }}>
                  ROLE IDENTIFIER (KEY)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. PROJECT_SECURITY_AUDITOR"
                  value={newRoleKey}
                  onChange={(e) => setNewRoleKey(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
                  required
                  style={{ width: "100%", fontSize: "12.5px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--ink-secondary)", marginBottom: "4px" }}>
                  DISPLAY NAME
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Security & Compliance Auditor"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  required
                  style={{ width: "100%", fontSize: "12.5px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--ink-secondary)", marginBottom: "4px" }}>
                  SCOPE
                </label>
                <select
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value)}
                  className="input-field"
                  style={{ width: "100%", fontSize: "12.5px" }}
                >
                  <option value="PROJECT">Project-Level Scope</option>
                  <option value="GLOBAL">Global / Platform Scope</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--ink-secondary)", marginBottom: "4px" }}>
                  DESCRIPTION
                </label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Briefly describe the operational responsibility of this role..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{ width: "100%", fontSize: "12px", resize: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--ink-secondary)", marginBottom: "6px" }}>
                  ASSIGN ATOMIC CAPABILITIES ({selectedCaps.length} selected)
                </label>
                <div style={{ maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", paddingRight: "4px" }}>
                  {ALL_CAPABILITIES.map((cap) => {
                    const isChecked = selectedCaps.includes(cap.key);
                    return (
                      <div
                        key={cap.key}
                        onClick={() => handleToggleCap(cap.key)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          background: isChecked ? "rgba(16, 185, 129, 0.12)" : "var(--bg-elevated)",
                          border: "1px solid",
                          borderColor: isChecked ? "var(--accent-teal)" : "var(--border-subtle)"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--ink-primary)" }}>{cap.label}</div>
                          <div style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>{cap.desc}</div>
                        </div>
                        {isChecked && <Check size={14} color="var(--accent-teal)" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateRoleModal(false)}
                  className="btn-secondary"
                  style={{ fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRole}
                  className="btn-primary"
                  style={{ fontSize: "12px", gap: "6px" }}
                >
                  {isSubmittingRole ? "Creating..." : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
