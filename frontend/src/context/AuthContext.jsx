import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { setAuthHeaders, fetchMyPermissions, fetchAdminUsers } from "../api/client";

const UNAUTHENTICATED = {
  id: "", name: "Not signed in", email: "", role: "GENERAL_VIEWER",
  displayRole: "No session", assignedProjects: [], badgeClass: "badge-slate", badgeLabel: "No session"
};

const ROLE_METADATA = {
  PLATFORM_ADMIN: {
    displayRole: "Platform Admin",
    scope: "GLOBAL",
    badgeClass: "badge-magenta",
    badgeLabel: "Platform Admin",
    description: "Full administrative sovereignty across platform, fleet, IAM & billing."
  },
  PROJECT_OWNER: {
    displayRole: "Project Owner",
    scope: "PROJECT",
    badgeClass: "badge-violet",
    badgeLabel: "Project Owner",
    description: "Sets project configs, authorizes write-locks, and signs off on incident actions."
  },
  PROJECT_ANALYST: {
    displayRole: "Project Analyst",
    scope: "PROJECT",
    badgeClass: "badge-teal",
    badgeLabel: "Project Analyst",
    description: "Performs analysis & live triage, auto-triage investigations, and stages action proposals."
  },
  PROJECT_MANAGER: {
    displayRole: "Project Manager",
    scope: "PROJECT",
    badgeClass: "badge-amber",
    badgeLabel: "Project Manager",
    description: "Project oversight, SLAs, burndown and reporting. Not involved in technical triage."
  },
  PROJECT_VIEWER: {
    displayRole: "Project Viewer",
    scope: "PROJECT",
    badgeClass: "badge-cyan",
    badgeLabel: "Project Viewer",
    description: "Read-only project observer: uses chat, views reports, live triage board, and metrics."
  },
  GENERAL_VIEWER: {
    displayRole: "General Viewer",
    scope: "PORTAL",
    badgeClass: "badge-slate",
    badgeLabel: "General Viewer",
    description: "Portal user with no project access: documentation, health overview, general assistant."
  }
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [personas, setPersonas] = useState([]);
  const [currentPersonaId, setCurrentPersonaId] = useState(() => {
    return localStorage.getItem("sentrix_active_persona") || "";
  });

  const [capabilities, setCapabilities] = useState([]);

  // Fetch all personas dynamically from the backend DB
  const refreshPersonas = useCallback(async () => {
    try {
      const dbUsers = await fetchAdminUsers();
      if (Array.isArray(dbUsers) && dbUsers.length > 0) {
        const mapped = dbUsers.map((u) => {
          const meta = ROLE_METADATA[u.role] || {
            displayRole: u.role,
            scope: "PROJECT",
            badgeClass: "badge-teal",
            badgeLabel: u.role,
            description: `${u.department || "Platform Team"} member`
          };

          return {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            globalRole: u.global_role || u.role,
            displayRole: meta.displayRole,
            scope: meta.scope,
            department: u.department,
            avatar: u.avatar_url || null,
            writeLockAuthority: Boolean(u.delegatedWrite),
            description: meta.description,
            badgeClass: meta.badgeClass,
            badgeLabel: meta.badgeLabel,
            assignedProjects: Array.isArray(u.projects) ? u.projects : [],
            projectMemberships: u.project_memberships || []
          };
        });
        setPersonas(mapped);
      }
    } catch (err) {
      console.warn("Unable to load users:", err);
    }
  }, []);

  useEffect(() => {
    refreshPersonas();
  }, [refreshPersonas]);

  const currentPersona = personas.find(p => p.id === currentPersonaId) || (personas.length > 0 ? personas[0] : UNAUTHENTICATED);

  // Sync headers whenever persona changes
  useEffect(() => {
    if (!currentPersona) return;
    localStorage.setItem("sentrix_active_persona", currentPersona.id);
    setAuthHeaders(currentPersona.id, currentPersona.role);

    setCapabilities([]);
    // Fetch dynamic capabilities from backend
    fetchMyPermissions()
      .then(res => {
        if (res && Array.isArray(res.capabilities)) {
          setCapabilities(res.capabilities);
        }
      })
      .catch(err => { setCapabilities([]); console.warn("Failed to fetch permissions:", err); });
  }, [currentPersona]);

  const switchPersona = (personaId) => {
    const found = personas.find(p => p.id === personaId);
    if (found) {
      setCurrentPersonaId(found.id);
      setAuthHeaders(found.id, found.role);
    }
  };

  const hasCapability = (cap) => Boolean(currentPersona.id) && capabilities.includes(cap);

  const isProjectPermitted = (projectKey) => {
    if (!currentPersona) return false;
    if (currentPersona.role === "PLATFORM_ADMIN") return true;
    if (currentPersona.role === "GENERAL_VIEWER") return false;
    if (!projectKey) return false;
    return currentPersona.assignedProjects.includes(projectKey.toUpperCase()) || currentPersona.assignedProjects.includes("*");
  };

  return (
    <AuthContext.Provider
      value={{
        currentPersona,
        personas,
        switchPersona,
        refreshPersonas,
        hasCapability,
        isProjectPermitted,
        capabilities,
        isPlatformAdmin: currentPersona?.role === "PLATFORM_ADMIN",
        isProjectOwner: currentPersona?.role === "PROJECT_OWNER",
        isProjectAnalyst: currentPersona?.role === "PROJECT_ANALYST",
        isProjectManager: currentPersona?.role === "PROJECT_MANAGER",
        isProjectViewer: currentPersona?.role === "PROJECT_VIEWER",
        isGeneralViewer: currentPersona?.role === "GENERAL_VIEWER",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
