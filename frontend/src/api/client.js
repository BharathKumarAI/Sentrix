/**
 * Sentrix API Client
 * Enterprise-grade REST & SSE client for the Sentrix Autonomous SRE platform.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

let currentAuthHeaders = {
  "x-user-id": typeof localStorage !== "undefined" ? (localStorage.getItem("sentrix_active_persona") || "") : "",
  "x-user-role": typeof localStorage !== "undefined" ? (localStorage.getItem("sentrix_active_role") || "PLATFORM_ADMIN") : "PLATFORM_ADMIN"
};

export function setAuthHeaders(userId, role) {
  const finalId = userId || currentAuthHeaders["x-user-id"] || "";
  const finalRole = (role || "PLATFORM_ADMIN").toUpperCase();
  currentAuthHeaders["x-user-id"] = finalId;
  currentAuthHeaders["x-user-role"] = finalRole;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("sentrix_active_persona", finalId);
    localStorage.setItem("sentrix_active_role", finalRole);
  }
}

export function getCurrentUserId() {
  return currentAuthHeaders["x-user-id"] || "";
}

export function getAuthHeaders() {
  return { ...currentAuthHeaders };
}

async function fetch(url, options = {}) {
  const response = await globalThis.fetch(url, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers },
  });
  if (!response.ok) {
    const payload = await response.clone().json().catch(() => ({}));
    const detail = typeof payload.detail === "string" ? payload.detail : `Request failed (${response.status})`;
    throw new Error(detail);
  }
  return response;
}

export async function fetchProjects() {
  const res = await fetch(`${API_BASE}/projects`, {
    headers: getAuthHeaders()
  });
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

export async function updateProject(projectId, data) {
  const res = await fetch(`${API_BASE}/projects/${projectId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateProjectStatus(projectId, status) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-user-role": "ADMIN"
    },
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to update project status to ${status}`);
  }
  return res.json();
}

export async function deleteProject(projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}`, {
    method: "DELETE",
    headers: {
      "x-user-role": "ADMIN"
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to delete project");
  }
  return res.json();
}

export async function fetchProjectDetail(projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}`);
  return res.json();
}

export async function toggleFollowProject(projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/follow`, {
    method: "POST",
  });
  return res.json();
}

export async function fetchProjectSummary(projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/summary`);
  return res.json();
}

export async function fetchProjectRuns(projectId, limit = 50) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/runs?limit=${limit}`);
  return res.json();
}

export async function fetchProjectAgents(projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/agents`);
  return res.json();
}

export async function fetchProjectMetrics(projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/metrics`);
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

export async function fetchConnectorKpis() {
  const res = await fetch(`${API_BASE}/connectors/kpis`);
  return res.json();
}

export async function testConnectorConnection(instanceId, environment = "prod") {
  const res = await fetch(`${API_BASE}/connectors/${instanceId}/test-connection?environment=${environment}`, {
    method: "POST"
  });
  return res.json();
}

export async function fetchProjectEnvMappings(projectKey) {
  try {
    const res = await fetch(`${API_BASE}/projects/${projectKey}/environment-mappings`);
    if (res.ok) return await res.json();
  } catch (e) {
    // try fallback
  }
  const fallback = await fetch(`${API_BASE}/connectors/mappings/${projectKey}`);
  return fallback.ok ? fallback.json() : [];
}

export async function updateProjectEnvMapping(data) {
  const res = await fetch(`${API_BASE}/connectors/mappings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function saveProjectEnvMapping(projectKey, data) {
  const res = await fetch(`${API_BASE}/projects/${projectKey}/environment-mappings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Failed to save project environment mapping");
  return json;
}

export async function deleteProjectEnvMapping(projectKeyOrMappingId, mappingId = null) {
  const actualId = mappingId || projectKeyOrMappingId;
  const projectKey = mappingId ? projectKeyOrMappingId : null;
  if (projectKey) {
    const res = await fetch(`${API_BASE}/projects/${projectKey}/environment-mappings/${actualId}`, {
      method: "DELETE"
    });
    return res.json();
  }
  const res = await fetch(`${API_BASE}/connectors/mappings/${actualId}`, {
    method: "DELETE",
  });
  return res.json();
}

export async function toggleConnectorEnable(instanceId) {
  const res = await fetch(`${API_BASE}/connectors/${instanceId}/toggle-enable`, {
    method: "POST"
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to toggle connector enablement");
  }
  return data;
}

export async function updateConnectorInstance(instanceId, data) {
  const res = await fetch(`${API_BASE}/connectors/instances/${instanceId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Failed to update connector");
  return json;
}

export async function deleteConnectorInstance(instanceId) {
  const res = await fetch(`${API_BASE}/connectors/instances/${instanceId}`, {
    method: "DELETE"
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Failed to delete connector");
  return json;
}

export async function fetchConnectorEnvironments(instanceId) {
  const res = await fetch(`${API_BASE}/connectors/instances/${instanceId}/environments`);
  if (!res.ok) return [];
  return res.json();
}

export async function saveConnectorEnvironment(instanceId, data) {
  const res = await fetch(`${API_BASE}/connectors/instances/${instanceId}/environments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Failed to save tool environment");
  return json;
}

export async function deleteConnectorEnvironment(instanceId, envName) {
  const res = await fetch(`${API_BASE}/connectors/instances/${instanceId}/environments/${envName}`, {
    method: "DELETE"
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Failed to delete tool environment");
  return json;
}

export async function fetchProjectSystems(projectKey) {
  const res = await fetch(`${API_BASE}/projects/${projectKey}/systems`);
  return res.json();
}

export async function fetchProjectAvailableConnectors(projectKey) {
  const res = await fetch(`${API_BASE}/projects/${projectKey}/available-connectors`);
  return res.json();
}

export async function bindProjectSystem(projectKey, data) {
  const res = await fetch(`${API_BASE}/projects/${projectKey}/systems`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Failed to bind project system");
  return json;
}

export async function unbindProjectSystem(projectKey, systemIdentifier) {
  const res = await fetch(`${API_BASE}/projects/${projectKey}/systems/${systemIdentifier}`, {
    method: "DELETE"
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Failed to unbind project system");
  return json;
}

export async function addProjectSystemCustomField(projectKey, systemName, fieldData) {
  const res = await fetch(`${API_BASE}/projects/${projectKey}/systems/${systemName}/custom-fields`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fieldData)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Failed to add custom field");
  return json;
}

export async function testProjectSystem(projectKey, systemName, environment = "prod") {
  const res = await fetch(`${API_BASE}/projects/${projectKey}/systems/${systemName}/test?environment=${environment}`, {
    method: "POST"
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
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to approve action proposal");
  }
  return res.json();
}

export async function rejectAction(proposalId, reason) {
  const res = await fetch(`${API_BASE}/actions/${proposalId}/reject?reason=${encodeURIComponent(reason)}`, {
    method: "POST",
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to reject action proposal");
  }
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

export async function fetchToolDefinitions() {
  const res = await fetch(`${API_BASE}/tools/definitions`);
  return res.json();
}

export async function fetchToolFields(toolKey) {
  const res = await fetch(`${API_BASE}/tools/definitions/${toolKey}/fields`);
  return res.json();
}

export async function createToolField(toolKey, fieldData) {
  const res = await fetch(`${API_BASE}/tools/definitions/${toolKey}/fields`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fieldData),
  });
  return res.json();
}

export async function deleteToolField(toolKey, fieldKey) {
  const res = await fetch(`${API_BASE}/tools/definitions/${toolKey}/fields/${fieldKey}`, {
    method: "DELETE",
  });
  return res.json();
}

export async function fetchConnectorInstance(instanceId) {
  const res = await fetch(`${API_BASE}/connectors/instances/${instanceId}`);
  return res.json();
}

export async function fetchProjectTools(projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/tools`);
  return res.json();
}

export async function bindProjectToolWithEnv(projectId, data) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/tools/bind-with-env`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function streamAutoTriage(payload, onEvent, onError) {
  try {
    const response = await fetch(`${API_BASE}/investigations/auto-triage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const raw = line.slice(6).trim();
          if (raw) {
            try {
              const event = JSON.parse(raw);
              // Skip the internal DONE sentinel — it's only there to prevent EOF
              if (event.type === "STREAM_DONE") continue;
              onEvent(event);
            } catch (e) {
              console.warn("Failed to parse SSE JSON", raw, e);
            }
          }
        }
      }
    }
  } catch (err) {
    if (onError) onError(err);
    else console.error("Auto triage stream error:", err);
  }
}

// ========================================================================
// Admin Platform Live Backend API Functions
// ========================================================================

export async function fetchAdminOverview() {
  const res = await fetch(`${API_BASE}/admin/overview`);
  return res.json();
}

export async function fetchAdminDashboard() {
  const res = await fetch(`${API_BASE}/admin/dashboard`);
  return res.json();
}

export async function fetchAdminModelProviders() {
  const res = await fetch(`${API_BASE}/admin/model-providers`);
  return res.json();
}

export async function createAdminModelProvider(data) {
  const res = await fetch(`${API_BASE}/admin/model-providers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function updateAdminModelProvider(providerId, data) {
  const res = await fetch(`${API_BASE}/admin/model-providers/${providerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deleteAdminModelProvider(providerId) {
  const res = await fetch(`${API_BASE}/admin/model-providers/${providerId}`, {
    method: "DELETE"
  });
  return res.json();
}

export async function createAdminModel(data) {
  const res = await fetch(`${API_BASE}/admin/models`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deleteAdminModel(modelId) {
  const res = await fetch(`${API_BASE}/admin/models/${modelId}`, {
    method: "DELETE"
  });
  return res.json();
}

export async function testAdminModelProvider(providerId) {
  const res = await fetch(`${API_BASE}/admin/model-providers/${providerId}/test`, {
    method: "POST"
  });
  return res.json();
}

export async function fetchModelCatalog() {
  const res = await fetch(`${API_BASE}/admin/models/catalog`);
  return res.json();
}

export async function fetchStageModelConfigs() {
  const res = await fetch(`${API_BASE}/admin/models/stage-routing`);
  return res.json();
}

export async function updateStageModelConfig(stageKey, data) {
  const res = await fetch(`${API_BASE}/admin/models/stage-routing/${stageKey}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function batchUpdateStageModelConfigs(stages) {
  const res = await fetch(`${API_BASE}/admin/models/stage-routing`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stages })
  });
  return res.json();
}

export async function setGlobalDefaultModel(payload) {
  const res = await fetch(`${API_BASE}/admin/models/set-default`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function resetStageModelDefaults() {
  const res = await fetch(`${API_BASE}/admin/models/reset-defaults`, {
    method: "POST"
  });
  return res.json();
}

export async function testStageModelExecution(stageKey) {
  const res = await fetch(`${API_BASE}/admin/models/stage-routing/test/${stageKey}`, {
    method: "POST"
  });
  return res.json();
}

export async function fetchAdminPrompts(params = {}) {
  const query = new URLSearchParams();
  if (params.scope) query.set("scope", params.scope);
  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  if (params.project_id) query.set("project_id", params.project_id);
  const qs = query.toString();
  const res = await fetch(`${API_BASE}/admin/prompts${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function fetchAdminPromptStats() {
  const res = await fetch(`${API_BASE}/admin/prompts/stats`);
  return res.json();
}

export async function createAdminPrompt(data) {
  const res = await fetch(`${API_BASE}/admin/prompts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateAdminPrompt(promptId, data) {
  const res = await fetch(`${API_BASE}/admin/prompts/${promptId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteAdminPrompt(promptId) {
  const res = await fetch(`${API_BASE}/admin/prompts/${promptId}`, {
    method: "DELETE",
  });
  return res.json();
}

export async function toggleFavoritePrompt(promptId) {
  const res = await fetch(`${API_BASE}/admin/prompts/${promptId}/favorite`, {
    method: "POST"
  });
  return res.json();
}

export async function testPromptRun(promptId, input) {
  const res = await fetch(`${API_BASE}/admin/prompts/${promptId}/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input })
  });
  return res.json();
}

export async function fetchAdminSkills(params = {}) {
  const query = new URLSearchParams();
  if (params.scope) query.set("scope", params.scope);
  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  if (params.project_id) query.set("project_id", params.project_id);
  const qs = query.toString();
  const res = await fetch(`${API_BASE}/admin/skills${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function createAdminSkill(data) {
  const res = await fetch(`${API_BASE}/admin/skills`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateAdminSkill(skillId, data) {
  const res = await fetch(`${API_BASE}/admin/skills/${skillId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function setAdminSkillLifecycle(skillId, lifecycleStatus) {
  const res = await fetch(`${API_BASE}/admin/skills/${skillId}/lifecycle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lifecycle_status: lifecycleStatus }),
  });
  return res.json();
}

export async function publishAdminSkill(skillId) {
  const res = await fetch(`${API_BASE}/admin/skills/${skillId}/publish`, {
    method: "POST",
  });
  return res.json();
}

export async function deleteAdminSkill(skillId) {
  const res = await fetch(`${API_BASE}/admin/skills/${skillId}`, {
    method: "DELETE",
  });
  return res.json();
}

export async function discoverMcpTools(data) {
  const res = await fetch(`${API_BASE}/admin/connectors/mcp/discover`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function registerDynamicConnector(data) {
  const res = await fetch(`${API_BASE}/admin/connectors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function testConnectorHealth(instanceKey) {
  const res = await fetch(`${API_BASE}/admin/connectors/${instanceKey}/test`, {
    method: "POST",
  });
  return res.json();
}

export async function fetchAdminApiKeys(options = {}) {
  const params = new URLSearchParams();
  if (options.scopeView) params.append("scope_view", options.scopeView);
  if (options.userEmail) params.append("user_email", options.userEmail);
  if (options.projectKey) params.append("project_key", options.projectKey);
  const queryStr = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_BASE}/admin/api-keys${queryStr}`, {
    headers: {
      ...(options.userEmail ? { "x-user-identity": options.userEmail } : {}),
      ...(options.projectKey ? { "x-project-context": options.projectKey } : {}),
    }
  });
  return res.json();
}

export async function createAdminApiKey(data, options = {}) {
  const params = new URLSearchParams();
  if (options.userEmail) params.append("user_email", options.userEmail);
  const queryStr = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_BASE}/admin/api-keys${queryStr}`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...(options.userEmail ? { "x-user-identity": options.userEmail } : {}),
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function rotateAdminApiKey(keyId, options = {}) {
  const params = new URLSearchParams();
  if (options.userEmail) params.append("user_email", options.userEmail);
  const queryStr = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_BASE}/admin/api-keys/${keyId}/rotate${queryStr}`, {
    method: "POST",
    headers: {
      ...(options.userEmail ? { "x-user-identity": options.userEmail } : {}),
    }
  });
  return res.json();
}

export async function deleteAdminApiKey(keyId, options = {}) {
  const params = new URLSearchParams();
  if (options.userEmail) params.append("user_email", options.userEmail);
  const queryStr = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_BASE}/admin/api-keys/${keyId}${queryStr}`, {
    method: "DELETE",
    headers: {
      ...(options.userEmail ? { "x-user-identity": options.userEmail } : {}),
    }
  });
  return res.json();
}

export async function syncAdminApiKeys() {
  const res = await fetch(`${API_BASE}/admin/api-keys/sync`, {
    method: "POST"
  });
  return res.json();
}

export async function fetchAdminUsers() {
  const res = await fetch(`${API_BASE}/admin/users`, {
    headers: getAuthHeaders()
  });
  return res.json();
}

export async function createAdminUser(data) {
  const res = await fetch(`${API_BASE}/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create user");
  }
  return res.json();
}

export async function updateAdminUser(userId, data) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update user");
  }
  return res.json();
}

export async function deleteAdminUser(userId) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to delete user");
  }
  return res.json();
}

export async function fetchIamRoles() {
  const res = await fetch(`${API_BASE}/iam/roles`, {
    headers: getAuthHeaders()
  });
  return res.json();
}

export async function createCustomRole(data) {
  const res = await fetch(`${API_BASE}/iam/roles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create custom role");
  }
  return res.json();
}

export async function fetchMyPermissions(projectId = null) {
  const qs = projectId ? `?project_id=${projectId}` : "";
  const res = await fetch(`${API_BASE}/iam/my-permissions${qs}`, {
    headers: getAuthHeaders()
  });
  return res.json();
}

export async function fetchAdminAuditLogs(params = {}) {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set("limit", params.limit);
  if (params.offset !== undefined) query.set("offset", params.offset);
  if (params.search) query.set("search", params.search);
  if (params.action_type && params.action_type !== "ALL") query.set("action_type", params.action_type);
  if (params.resource_type && params.resource_type !== "ALL") query.set("resource_type", params.resource_type);
  if (params.status && params.status !== "ALL") query.set("status", params.status);

  const qs = query.toString() ? `?${query.toString()}` : "";
  const res = await fetch(`${API_BASE}/admin/audit-logs${qs}`);
  return res.json();
}

export async function fetchAdminAuditStats() {
  const res = await fetch(`${API_BASE}/admin/audit-logs/stats`);
  return res.json();
}

export async function verifyAdminAuditLedger() {
  const res = await fetch(`${API_BASE}/admin/audit-logs/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  return res.json();
}

export async function fetchAdminBillingUsage(params = {}) {
  const query = new URLSearchParams();
  if (params.projectId && params.projectId !== "all") query.append("project_id", params.projectId);
  if (params.period) query.append("period", params.period);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const res = await fetch(`${API_BASE}/admin/billing-usage${qs}`);
  return res.json();
}

export async function updateAdminBillingBudget(payload) {
  const res = await fetch(`${API_BASE}/admin/billing/budget`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function fetchAdminBillingInvocations(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  if (params.search) query.append("search", params.search);
  if (params.projectId && params.projectId !== "all") query.append("project_id", params.projectId);
  if (params.stage && params.stage !== "all" && params.stage !== "All") query.append("stage", params.stage);
  if (params.modelId && params.modelId !== "all" && params.modelId !== "All") query.append("model_id", params.modelId);
  if (params.status && params.status !== "all" && params.status !== "All") query.append("status", params.status);
  if (params.sortBy) query.append("sort_by", params.sortBy);
  if (params.sortDir) query.append("sort_dir", params.sortDir);
  if (params.period) query.append("period", params.period);

  const qs = query.toString() ? `?${query.toString()}` : "";
  const res = await fetch(`${API_BASE}/admin/billing/invocations${qs}`);
  return res.json();
}

export async function fetchAdminBillingInvocationDetail(invocationId) {
  const res = await fetch(`${API_BASE}/admin/billing/invocations/${invocationId}`);
  return res.json();
}

export function getAdminBillingExportUrl(params = {}) {
  const query = new URLSearchParams();
  if (params.projectId && params.projectId !== "all") query.append("project_id", params.projectId);
  if (params.period) query.append("period", params.period);
  if (params.search) query.append("search", params.search);
  if (params.stage && params.stage !== "all" && params.stage !== "All") query.append("stage", params.stage);
  if (params.modelId && params.modelId !== "all" && params.modelId !== "All") query.append("model_id", params.modelId);
  if (params.status && params.status !== "all" && params.status !== "All") query.append("status", params.status);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return `${API_BASE}/admin/billing/export${qs}`;
}

export async function fetchAdminSecurityPolicies() {
  const res = await fetch(`${API_BASE}/admin/security-policies`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch security policies`);
  return res.json();
}

export async function fetchAdminSecurityOverview() {
  const res = await fetch(`${API_BASE}/admin/security/overview`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch security overview`);
  return res.json();
}

export async function toggleAdminEmergencyKillswitch(data) {
  const res = await fetch(`${API_BASE}/admin/security/killswitch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to toggle killswitch" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function updateAdminSecurityPolicy(policyId, data) {
  const res = await fetch(`${API_BASE}/admin/security-policies/${policyId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to update security policy" }));
    const errorObj = new Error(err.detail || `HTTP ${res.status}`);
    errorObj.status = res.status;
    throw errorObj;
  }
  return res.json();
}

export async function createAdminSecurityPolicy(data) {
  const res = await fetch(`${API_BASE}/admin/security-policies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to create security policy" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function deleteAdminSecurityPolicy(policyId) {
  const res = await fetch(`${API_BASE}/admin/security-policies/${policyId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to delete security policy" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function evaluateAdminSecurityPolicyTest(data) {
  const res = await fetch(`${API_BASE}/admin/security-policies/evaluate-test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to evaluate policy test`);
  return res.json();
}

export async function fetchAdminSystemHealth() {
  const res = await fetch(`${API_BASE}/admin/system-health`);
  return res.json();
}

export async function fetchAdminMlflowRuns() {
  const res = await fetch(`${API_BASE}/admin/mlflow/runs`);
  return res.json();
}

export async function fetchAdminInfrastructureConfig() {
  const res = await fetch(`${API_BASE}/admin/infrastructure/config`);
  return res.json();
}

export async function testAdminInfrastructureProbe(provider, details, subsystem = null) {
  const res = await fetch(`${API_BASE}/admin/infrastructure/test-probe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, details, subsystem }),
  });
  return res.json();
}

export async function applyAdminInfrastructureConfig(provider, details) {
  const res = await fetch(`${API_BASE}/admin/infrastructure/apply-config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, details }),
  });
  return res.json();
}

export async function fetchAdminAzureStatus() {

  const res = await fetch(`${API_BASE}/admin/azure/ecosystem-status`);
  return res.json();
}

export async function testAdminAzureConnections() {
  const res = await fetch(`${API_BASE}/admin/azure/test-connections`, {
    method: "POST",
  });
  return res.json();
}

export async function applyAdminAzureReferences(references) {
  const res = await fetch(`${API_BASE}/admin/azure/apply-references`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ references }),
  });
  return res.json();
}

export async function fetchAdminStorageOverview() {
  const res = await fetch(`${API_BASE}/admin/storage/overview`);
  return res.json();
}

export async function fetchAdminBackups() {
  const res = await fetch(`${API_BASE}/admin/backups`);
  return res.json();
}

export async function createAdminBackup(description = "Manual Administrator Snapshot") {
  const res = await fetch(`${API_BASE}/admin/backups/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  return res.json();
}

export async function restoreAdminBackup(filename) {
  const res = await fetch(`${API_BASE}/admin/backups/${encodeURIComponent(filename)}/restore`, {
    method: "POST",
  });
  return res.json();
}

export function getBackupDownloadUrl(filename) {
  return `${API_BASE}/admin/backups/${encodeURIComponent(filename)}/download`;
}

// --- Project-Wise Storage & ADK Artifacts ---

export async function fetchProjectStorageTree(projectId) {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/storage/tree`);
  return res.json();
}

export async function fetchProjectArtifacts(projectId, subfolder = null) {
  const url = subfolder
    ? `${API_BASE}/projects/${encodeURIComponent(projectId)}/artifacts?subfolder=${encodeURIComponent(subfolder)}`
    : `${API_BASE}/projects/${encodeURIComponent(projectId)}/artifacts`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchProjectArtifactContent(projectId, subfolder, filename) {
  const res = await fetch(
    `${API_BASE}/projects/${encodeURIComponent(projectId)}/artifacts/${subfolder}/${encodeURIComponent(filename)}/content`
  );
  return res.json();
}

export function getProjectArtifactDownloadUrl(projectId, subfolder, filename) {
  return `${API_BASE}/projects/${encodeURIComponent(projectId)}/artifacts/${subfolder}/${encodeURIComponent(filename)}/download`;
}

export async function createProjectArtifact(projectId, subfolder, filename, content, contentType = "application/json") {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/artifacts/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subfolder, filename, content, content_type: contentType }),
  });
  return res.json();
}

export async function fetchProjectReports(projectKey, cadence = "weekly") {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectKey)}/reports?cadence=${encodeURIComponent(cadence)}`);
  return res.json();
}

export async function fetchProjectFeedback(projectKey) {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectKey)}/feedback`);
  return res.json();
}

export async function fetchSystemNotifications() {
  const res = await fetch(`${API_BASE}/notifications`);
  return res.json();
}

// ========================================================================
// AGENT HARNESS: EVERYTHING IS A PLUGIN (DEEPSEEK HARNESS & GOOGLE ADK 2.0)
// ========================================================================

export async function fetchHarnessPlugins(category = null) {
  const url = category ? `${API_BASE}/harness/plugins?category=${encodeURIComponent(category)}` : `${API_BASE}/harness/plugins`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return res.json();
}

export async function fetchHarnessPlugin(pluginId) {
  const res = await fetch(`${API_BASE}/harness/plugins/${encodeURIComponent(pluginId)}`, { headers: getAuthHeaders() });
  return res.json();
}

export async function toggleHarnessPlugin(pluginId, enabled) {
  const res = await fetch(`${API_BASE}/harness/plugins/${encodeURIComponent(pluginId)}/toggle`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ enabled })
  });
  return res.json();
}

export async function configureHarnessPlugin(pluginId, config) {
  const res = await fetch(`${API_BASE}/harness/plugins/${encodeURIComponent(pluginId)}/configure`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ config })
  });
  return res.json();
}

export async function testHarnessPlugin(pluginId) {
  const res = await fetch(`${API_BASE}/harness/plugins/${encodeURIComponent(pluginId)}/test`, {
    method: "POST",
    headers: getAuthHeaders()
  });
  return res.json();
}

export async function fetchHarnessModes() {
  const res = await fetch(`${API_BASE}/harness/modes`, { headers: getAuthHeaders() });
  return res.json();
}

export async function switchHarnessMode(mode) {
  const res = await fetch(`${API_BASE}/harness/modes/switch`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ mode })
  });
  return res.json();
}

export async function fetchHarnessStats() {
  const res = await fetch(`${API_BASE}/harness/stats`, { headers: getAuthHeaders() });
  return res.json();
}

export async function fetchHarnessFinOpsSummary() {
  const res = await fetch(`${API_BASE}/harness/finops/summary`, { headers: getAuthHeaders() });
  return res.json();
}

export async function fetchHarnessTrace(runId = "system_harness") {
  const res = await fetch(`${API_BASE}/harness/traces/${encodeURIComponent(runId)}`, { headers: getAuthHeaders() });
  return res.json();
}

export function getHarnessEventsEventSource() {
  return new EventSource(`${API_BASE}/harness/events`);
}

// ROOT CAUSE ANALYSIS (RCA) & CONTEXT BUDGETER CLIENT API
export async function fetchRCAMethodologies() {
  const res = await fetch(`${API_BASE}/harness/rca/methodologies`, { headers: getAuthHeaders() });
  return res.json();
}

export async function analyzeIncidentRCA(incidentTitle, methodology = "auto_ensemble", targetEnv = "QLAB02", baselineEnv = "QLAB01", context = {}) {
  const res = await fetch(`${API_BASE}/harness/rca/analyze`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      incident_title: incidentTitle,
      methodology,
      target_env: targetEnv,
      baseline_env: baselineEnv,
      context
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "RCA analysis failed");
  }
  return res.json();
}

export async function checkContextBudget(toolType = "splunk", query = null, earliestTime = null, latestTime = null, payload = null) {
  const res = await fetch(`${API_BASE}/harness/rca/budget-check`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      tool_type: toolType,
      query,
      earliest_time: earliestTime,
      latest_time: latestTime,
      payload
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Context budget check failed");
  }
  return res.json();
}








export async function fetchOrganizations() {
  return (await fetch(`${API_BASE}/admin/organizations`)).json();
}
export async function createOrganization(data) {
  return (await fetch(`${API_BASE}/admin/organizations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })).json();
}
export async function createOrganizationTeam(id, data) {
  return (await fetch(`${API_BASE}/admin/organizations/${id}/teams`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })).json();
}
export async function assignOrganizationProject(id, projectId, teamId) {
  return (await fetch(`${API_BASE}/admin/organizations/${id}/projects/${projectId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ team_id: teamId }) })).json();
}
export async function unassignOrganizationProject(id, projectId) {
  return (await fetch(`${API_BASE}/admin/organizations/${id}/projects/${projectId}`, { method: "DELETE" })).json();
}
export async function deleteOrganizationTeam(id, teamId) {
  return (await fetch(`${API_BASE}/admin/organizations/${id}/teams/${teamId}`, { method: "DELETE" })).json();
}
export async function deleteOrganization(id) {
  return (await fetch(`${API_BASE}/admin/organizations/${id}`, { method: "DELETE" })).json();
}


export async function harnessConfiguration(path, options = {}) {
  const response = await fetch(`${API_BASE}/admin/harness-configuration${path}`, {
    ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  return response.json();
}
