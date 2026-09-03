/**
 * PRISM API Client
 * Interfaces with FastAPI REST and SSE streaming endpoints.
 */

const API_BASE = "http://localhost:8000/api";

export async function fetchProjects() {
  const res = await fetch(`${API_BASE}/projects`);
  return res.json();
}

export async function createProject(data) {
  const res = await fetch(`${API_BASE}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function toggleFollowProject(projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/follow`, {
    method: "POST",
  });
  return res.json();
}

export async function fetchProjectInstructions(projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/instructions`);
  return res.json();
}

export async function updateProjectInstructions(projectId, data) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/instructions`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchParameters(projectId = null, isAdmin = false) {
  const url = new URL(`${API_BASE}/parameters`);
  if (projectId) url.searchParams.append("project_id", projectId);
  if (isAdmin) url.searchParams.append("is_admin", "true");
  const res = await fetch(url);
  return res.json();
}

export async function setParameterOverride(data) {
  const res = await fetch(`${API_BASE}/parameters/override`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchConnectorCatalog() {
  const res = await fetch(`${API_BASE}/connectors/catalog`);
  return res.json();
}

export async function toggleAdminConnector(connectorKey) {
  const res = await fetch(`${API_BASE}/connectors/catalog/${connectorKey}/toggle-admin`, {
    method: "POST",
  });
  return res.json();
}

export async function fetchConnectorInstances() {
  const res = await fetch(`${API_BASE}/connectors/instances`);
  return res.json();
}

export async function fetchProjectEnvMappings(projectId) {
  const res = await fetch(`${API_BASE}/connectors/mappings/${projectId}`);
  return res.json();
}

export async function updateProjectEnvMapping(data) {
  const res = await fetch(`${API_BASE}/connectors/mappings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteProjectEnvMapping(mappingId) {
  const res = await fetch(`${API_BASE}/connectors/mappings/${mappingId}`, {
    method: "DELETE",
  });
  return res.json();
}

export async function fetchConnectorHealth() {
  const res = await fetch(`${API_BASE}/connectors/health`);
  return res.json();
}

export async function fetchPendingActions() {
  const res = await fetch(`${API_BASE}/actions/pending`);
  return res.json();
}

export async function approveAction(proposalId, data) {
  const res = await fetch(`${API_BASE}/actions/${proposalId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function rejectAction(proposalId, reason) {
  const res = await fetch(`${API_BASE}/actions/${proposalId}/reject?reason=${encodeURIComponent(reason)}`, {
    method: "POST",
  });
  return res.json();
}

export async function fetchEvidence(runId) {
  const res = await fetch(`${API_BASE}/evidence/${runId}`);
  return res.json();
}

export async function fetchOkfCases(query = "", projectId = null) {
  const url = new URL(`${API_BASE}/okf/cases`);
  if (query) url.searchParams.append("query", query);
  if (projectId) url.searchParams.append("project_id", projectId);
  const res = await fetch(url);
  return res.json();
}

export async function fetchOkfNodes() {
  const res = await fetch(`${API_BASE}/okf/nodes`);
  return res.json();
}

export async function submitFeedback(data) {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchDashboardMetrics(projectId = null) {
  const url = new URL(`${API_BASE}/metrics/dashboard`);
  if (projectId) url.searchParams.append("project_id", projectId);
  const res = await fetch(url);
  return res.json();
}

export async function sendChatQuery(data) {
  const res = await fetch(`${API_BASE}/investigations/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
export async function fetchBoardTickets(projectKey) {
  const res = await fetch(`${API_BASE}/board/tickets/${projectKey}`);
  return res.json();
}

export async function updateBoardTicket(ticketKey, data) {
  const res = await fetch(`${API_BASE}/board/tickets/${ticketKey}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function runTicketQuery(ticketKey, data) {
  const res = await fetch(`${API_BASE}/board/tickets/${ticketKey}/run-query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function syncTicketToJira(ticketKey, data) {
  const res = await fetch(`${API_BASE}/board/tickets/${ticketKey}/sync-jira`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchTeamActivity() {
  const res = await fetch(`${API_BASE}/board/team-activity`);
  return res.json();
}

export async function addTicketComment(ticketKey, data) {
  const res = await fetch(`${API_BASE}/board/tickets/${ticketKey}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchProjectConfiguration(projectKey) {
  const res = await fetch(`${API_BASE}/projects/${projectKey}/configuration`);
  return res.json();
}

export async function updateProjectConfiguration(projectKey, data) {
  const res = await fetch(`${API_BASE}/projects/${projectKey}/configuration`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchProjectRunbooks(projectKey) {
  const res = await fetch(`${API_BASE}/projects/${projectKey}/runbooks`);
  return res.json();
}

export async function uploadProjectRunbook(projectKey, data) {
  const res = await fetch(`${API_BASE}/projects/${projectKey}/runbooks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

