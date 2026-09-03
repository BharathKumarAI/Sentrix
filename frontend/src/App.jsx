import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { PrismShell } from "./components/layout/PrismShell";
import { ProjectOverviewPage } from "./pages/ProjectOverviewPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminConnectorsPage } from "./pages/AdminConnectorsPage";
import { AdminPromptsPage } from "./pages/AdminPromptsPage";
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
  }, []);

  const handleApproveAction = async (id) => {
    await approveAction(id, {
      user_id: "usr_admin_01",
      delegated_identity: delegatedIdentity,
    });
    await loadPendingActions();
  };

  const handleRejectAction = async (id) => {
    await rejectAction(id, "Rejected by investigator");
    await loadPendingActions();
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
          <Route path="overview" element={<AdminDashboardPage />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="connectors" element={<AdminConnectorsPage />} />
          <Route path="prompts" element={<AdminPromptsPage />} />
          <Route path="projects" element={<AdminDashboardPage />} />
          <Route path="skills" element={<AdminPromptsPage />} />
          <Route path="health" element={<AdminDashboardPage />} />
          <Route path="audit" element={<AdminDashboardPage />} />
          <Route path="environments" element={<EnvironmentMatrixEditor activeProject={activeProject} />} />
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
                    <h2 style={{ fontSize: "18px", color: "#fff" }}>Governed Action Proposals Desk</h2>
                    <span className="badge badge-magenta">Cryptographic Write Lock</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "4px" }}>
                    All high-impact mutations (Jira comments, Kubernetes pod restarts) require human authorization under delegated identity.
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
          <Route path="tools" element={<AdminConnectorsPage />} />
          <Route path="agents" element={<ProjectOverviewPage activeProject={activeProject} />} />
          <Route path="workflows" element={<ProjectOverviewPage activeProject={activeProject} />} />
          <Route path="tickets" element={<ProjectOverviewPage activeProject={activeProject} />} />
          <Route path="runs" element={<ProjectOverviewPage activeProject={activeProject} />} />
          <Route path="knowledge" element={<OkfKnowledgeBrowser activeProject={activeProject} />} />
          <Route path="board" element={<LiveTriageBoard activeProject={activeProject} activeEnvironment={activeEnvironment} />} />
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
          onProjectCreated={() => {
            loadProjects();
          }}
        />
      )}
    </BrowserRouter>
  );
}

export default App;
