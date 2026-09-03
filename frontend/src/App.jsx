import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { PrismShell } from "./components/layout/PrismShell";
import { ProjectOverviewPage } from "./pages/ProjectOverviewPage";
import { ProjectAgentsPage } from "./pages/ProjectAgentsPage";
import { ProjectWorkflowsPage } from "./pages/ProjectWorkflowsPage";
import { ProjectToolsPage } from "./pages/ProjectToolsPage";
import { ProjectTicketsPage } from "./pages/ProjectTicketsPage";
import { ProjectRunsPage } from "./pages/ProjectRunsPage";
import { ProjectMetricsPage } from "./pages/ProjectMetricsPage";
import { ProjectReportsPage } from "./pages/ProjectReportsPage";
import { ProjectFeedbackPage } from "./pages/ProjectFeedbackPage";
import { ProjectSetupStudioPage } from "./pages/ProjectSetupStudioPage";

import { AdminOverviewPage } from "./pages/AdminOverviewPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminConnectorsPage } from "./pages/AdminConnectorsPage";
import { AdminPromptsPage } from "./pages/AdminPromptsPage";
import { AdminProjectsFleetPage } from "./pages/AdminProjectsFleetPage";
import { AdminSkillsCatalogPage } from "./pages/AdminSkillsCatalogPage";
import { AdminSystemHealthPage } from "./pages/AdminSystemHealthPage";
import { AdminAuditLogsPage } from "./pages/AdminAuditLogsPage";
import { AdminModelProvidersPage } from "./pages/AdminModelProvidersPage";
import { AdminApiKeysPage } from "./pages/AdminApiKeysPage";
import { AdminBillingUsagePage } from "./pages/AdminBillingUsagePage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminSecurityPolicyPage } from "./pages/AdminSecurityPolicyPage";

import { AutoTriageHub } from "./components/AutoTriageHub";
import { InvestigationStream } from "./components/InvestigationStream";
import { ActionProposalCard } from "./components/ActionProposalCard";
import { EvidenceGrid } from "./components/EvidenceGrid";
import { OkfKnowledgeBrowser } from "./components/OkfKnowledgeBrowser";
import { EnvironmentMatrixEditor } from "./components/EnvironmentMatrixEditor";
import { ParameterStudio } from "./components/ParameterStudio";
import { ProjectCustomizationView } from "./components/ProjectCustomizationView";
import { NewProjectModal } from "./components/NewProjectModal";
import { LandingPage } from "./pages/LandingPage";
import { LiveTriageBoard } from "./components/LiveTriageBoard";
import { 
  fetchProjects, 
  fetchPendingActions, 
  approveAction, 
  rejectAction 
} from "./api/client";
import { ShieldCheck } from "lucide-react";

export function App() {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [activeEnvironment, setActiveEnvironment] = useState("prod");
  const [pendingActions, setPendingActions] = useState([]);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [delegatedIdentity] = useState("kbk@company.com");

  const loadProjects = async () => {
    try {
      const data = await fetchProjects();
      if (Array.isArray(data) && data.length > 0) {
        setProjects(data);
        if (!activeProject) {
          const defaultProj = data.find((p) => p.is_followed) || data[0];
          setActiveProject(defaultProj);
          setActiveEnvironment(defaultProj.default_environment || "prod");
        }
      }
    } catch (e) {
      console.error("Failed to fetch projects", e);
    }
  };

  const loadPendingActions = async () => {
    try {
      const actions = await fetchPendingActions();
      setPendingActions(Array.isArray(actions) ? actions : []);
    } catch (e) {
      console.error("Failed to fetch actions", e);
    }
  };

  useEffect(() => {
    loadProjects();
    loadPendingActions();
    const interval = setInterval(loadPendingActions, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleApproveAction = async (actionId, options) => {
    try {
      await approveAction(actionId, options);
      loadPendingActions();
    } catch (e) {
      console.error("Failed to approve action", e);
    }
  };

  const handleRejectAction = async (actionId) => {
    try {
      await rejectAction(actionId);
      loadPendingActions();
    } catch (e) {
      console.error("Failed to reject action", e);
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Sentrix Platform Landing Page */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        
        {/* Admin Console Routes (/admin/*) */}
        <Route
          path="/admin"
          element={
            <PrismShell
              projects={projects}
              activeProject={activeProject}
              onSelectProject={setActiveProject}
              activeEnvironment={activeEnvironment}
              onSelectEnvironment={setActiveEnvironment}
              onOpenNewProjectModal={() => setShowNewProjectModal(true)}
            />
          }
        >
          <Route index element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview" element={<AdminOverviewPage projects={projects} onOpenNewProjectModal={() => setShowNewProjectModal(true)} />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="projects" element={<AdminProjectsFleetPage />} />
          <Route path="skills" element={<AdminSkillsCatalogPage />} />
          <Route path="prompts" element={<AdminPromptsPage />} />
          <Route path="connectors" element={<AdminConnectorsPage />} />
          <Route path="environments" element={<EnvironmentMatrixEditor activeProject={activeProject} />} />
          <Route path="models" element={<AdminModelProvidersPage />} />
          <Route path="keys" element={<AdminApiKeysPage />} />
          <Route path="health" element={<AdminSystemHealthPage />} />
          <Route path="audit" element={<AdminAuditLogsPage />} />
          <Route path="billing" element={<AdminBillingUsagePage />} />
          <Route path="reports" element={<ProjectReportsPage activeProject={activeProject} />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="security" element={<AdminSecurityPolicyPage />} />
        </Route>

        {/* Project Routes (/p/:projectKey/*) */}
        <Route
          path="/p/:projectKey"
          element={
            <PrismShell
              projects={projects}
              activeProject={activeProject}
              onSelectProject={setActiveProject}
              activeEnvironment={activeEnvironment}
              onSelectEnvironment={setActiveEnvironment}
              onOpenNewProjectModal={() => setShowNewProjectModal(true)}
            />
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<ProjectOverviewPage activeProject={activeProject} />} />
          <Route
            path="triage"
            element={
              <AutoTriageHub
                activeProject={activeProject}
                activeEnvironment={activeEnvironment}
                delegatedIdentity={delegatedIdentity}
                onActionApproved={handleApproveAction}
                onActionRejected={handleRejectAction}
                onViewEvidence={() => {}}
              />
            }
          />
          <Route
            path="investigations"
            element={
              <InvestigationStream
                activeProject={activeProject}
                activeEnvironment={activeEnvironment}
                onSelectEnvironment={setActiveEnvironment}
                delegatedIdentity={delegatedIdentity}
              />
            }
          />
          <Route
            path="actions"
            element={
              <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div className="prism-card" style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldCheck size={18} color="var(--prism-pink)" />
                    <h2 style={{ fontSize: "18px", color: "var(--ink-primary)" }}>Governed Action Proposals Desk</h2>
                    <span className="badge badge-magenta">Cryptographic Write Lock</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "4px" }}>
                    All high-impact mutations (Jira comments, database pool scaling, Kubernetes pod restarts) require human authorization under delegated identity.
                  </p>
                </div>

                {pendingActions.length === 0 ? (
                  <div className="prism-card" style={{ padding: "40px", textAlign: "center", color: "var(--ink-secondary)" }}>
                    No pending action proposals requiring authorization.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {pendingActions.map((prop) => (
                      <ActionProposalCard
                        key={prop.id}
                        proposal={prop}
                        delegatedIdentity={delegatedIdentity}
                        onApprove={handleApproveAction}
                        onReject={handleRejectAction}
                      />
                    ))}
                  </div>
                )}
              </div>
            }
          />
          <Route path="tools" element={<ProjectToolsPage activeProject={activeProject} activeEnvironment={activeEnvironment} />} />
          <Route path="agents" element={<ProjectAgentsPage activeProject={activeProject} />} />
          <Route path="workflows" element={<ProjectWorkflowsPage activeProject={activeProject} />} />
          <Route path="tickets" element={<ProjectTicketsPage activeProject={activeProject} />} />
          <Route path="runs" element={<ProjectRunsPage activeProject={activeProject} />} />
          <Route path="knowledge" element={<OkfKnowledgeBrowser activeProject={activeProject} />} />
          <Route path="board" element={<LiveTriageBoard activeProject={activeProject} activeEnvironment={activeEnvironment} />} />
          <Route path="metrics" element={<ProjectMetricsPage activeProject={activeProject} />} />
          <Route path="reports" element={<ProjectReportsPage activeProject={activeProject} />} />
          <Route path="feedback" element={<ProjectFeedbackPage activeProject={activeProject} />} />
          <Route path="setup" element={<ProjectSetupStudioPage activeProject={activeProject} onProjectUpdated={loadProjects} />} />
          <Route path="environments" element={<EnvironmentMatrixEditor activeProject={activeProject} />} />
          <Route path="parameters" element={<ParameterStudio activeProject={activeProject} isAdmin={true} />} />
          <Route path="settings" element={<ProjectCustomizationView activeProject={activeProject} />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/p/BILLING/overview" replace />} />
      </Routes>

      {/* New Project Registration Modal */}
      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onProjectCreated={(newProj) => {
            loadProjects();
            if (newProj && newProj.project_key) {
              window.location.href = `/p/${newProj.project_key}/setup`;
            }
          }}
        />
      )}
    </BrowserRouter>
  );
}

export default App;
