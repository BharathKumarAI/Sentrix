import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Server, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Activity, 
  ExternalLink, 
  Zap, 
  RotateCw, 
  Sliders, 
  Trash2, 
  Check, 
  Shield, 
  Lock, 
  Unlock, 
  Globe, 
  Layers, 
  Play, 
  X,
  Database
} from "lucide-react";
import { ConnectorAcceleratorModal } from "../components/ConnectorAcceleratorModal";
import { ConnectorDetailModal } from "../components/ConnectorDetailModal";
import { ToolIcon } from "../components/ToolIcon";
import { 
  fetchConnectorInstances, 
  fetchConnectorKpis, 
  testConnectorConnection,
  toggleConnectorEnable,
  deleteConnectorInstance
} from "../api/client";

export function AdminConnectorsPage() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [testResult, setTestResult] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const [connectors, setConnectors] = useState([]);

  const loadBackendData = async () => {
    setIsLoading(true);
    try {
      const instancesData = await fetchConnectorInstances().catch(() => []);
      if (Array.isArray(instancesData)) {
        setConnectors(instancesData);
      }
    } catch (err) {
      console.warn("Could not load connector data from backend", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBackendData();
  }, []);

  const handleTest = async (e, connId) => {
    e.stopPropagation();
    setTestingId(connId);
    try {
      const data = await testConnectorConnection(connId, "prod");
      setTestResult((prev) => ({ ...prev, [connId]: data }));
      showToast(`Diagnostic check passed (${data.latency_ms}ms). Handshake verified.`, "success");
      loadBackendData();
    } catch (err) {
      console.error("Test connection failed:", err);
      showToast("Diagnostic handshake failed.", "error");
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleEnable = async (e, c) => {
    e.stopPropagation();
    if (!c.is_active && c.test_status !== "PASSED") {
      showToast(`Cannot enable '${c.name}': A diagnostic test must be passed first.`, "warning");
      return;
    }
    try {
      const res = await toggleConnectorEnable(c.id);
      showToast(res.message, "success");
      loadBackendData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const [deleteConfirmConnector, setDeleteConfirmConnector] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConnector = (e, c) => {
    e.stopPropagation();
    setDeleteConfirmConnector(c);
  };

  const confirmDeleteConnector = async () => {
    if (!deleteConfirmConnector) return;
    setIsDeleting(true);
    try {
      await deleteConnectorInstance(deleteConfirmConnector.id);
      showToast(`Connector '${deleteConfirmConnector.name}' deleted successfully`, "success");
      setDeleteConfirmConnector(null);
      loadBackendData();
    } catch (err) {
      showToast(err.message || "Failed to delete connector", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Derive unique categories for dropdown
  const availableTypes = Array.from(
    new Set(connectors.map((c) => c.type).filter(Boolean))
  ).sort();

  // Counts for pills & metrics
  const totalCount = connectors.length;
  const verifiedCount = connectors.filter(c => c.test_status === "PASSED").length;
  const untestedCount = connectors.filter(c => !c.test_status || c.test_status === "UNTESTED").length;
  const failedCount = connectors.filter(c => c.test_status === "FAILED").length;

  // Executive KPI cards (matching AdminSkillsCatalogPage, AdminPromptsPage & AdminOverviewPage)
  const kpis = [
    {
      label: "Total Connectors",
      value: totalCount,
      sub: "Canonical fleet instances",
      icon: Server,
      color: "var(--prism-pink)"
    },
    {
      label: "Diagnostic Verified",
      value: verifiedCount,
      sub: "Healthy protocol probes",
      icon: CheckCircle2,
      color: "var(--accent-teal)"
    },
    {
      label: "Untested / Pending",
      value: untestedCount,
      sub: "Awaiting diagnostic probe",
      icon: Zap,
      color: "var(--accent-amber)"
    },
    {
      label: "Sync Activity (7d)",
      value: "1.4K",
      sub: "Fleet operational calls",
      icon: Activity,
      color: "var(--accent-blue)"
    }
  ];

  const filtered = connectors.filter((c) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.desc && c.desc.toLowerCase().includes(q)) ||
        (c.type && c.type.toLowerCase().includes(q)) ||
        (c.project && c.project.toLowerCase().includes(q)) ||
        (c.endpoint && c.endpoint.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }

    // 2. Tab filtering (Status-based)
    if (activeTab === "VERIFIED" && c.test_status !== "PASSED") return false;
    if (activeTab === "UNTESTED" && c.test_status && c.test_status !== "UNTESTED") return false;
    if (activeTab === "FAILED" && c.test_status !== "FAILED") return false;

    // 3. Category filter
    if (typeFilter !== "ALL" && c.type !== typeFilter) return false;

    // 4. Status filter
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;

    return true;
  });

  return (
    <div style={{
      padding: "24px 32px",
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      overflowY: "auto",
      minHeight: "100%",
      boxSizing: "border-box"
    }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed",
          top: "24px",
          right: "32px",
          zIndex: 9999,
          padding: "12px 18px",
          borderRadius: "8px",
          background: toast.type === "error" ? "rgba(225, 29, 72, 0.95)" : toast.type === "warning" ? "rgba(245, 158, 11, 0.95)" : "rgba(16, 185, 129, 0.95)",
          color: "#fff",
          fontSize: "13px",
          fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backdropFilter: "blur(6px)"
        }}>
          {toast.type === "error" || toast.type === "warning" ? <AlertTriangle size={16} /> : <Check size={16} />}
          {toast.msg}
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
            <Server size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                PLATFORM ADMIN • CONNECTORS FLEET
              </span>
              <span className="badge badge-teal">{verifiedCount}/{totalCount} Active & Verified</span>
              <span className="badge badge-magenta">Enterprise Tool Ecosystem</span>
              <span className="badge badge-purple">Harness Mounted</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Enterprise Connectors Fleet
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Canonical enterprise adapters, protocol endpoints, diagnostic health probes, and per-field governance controls.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <Link
            to="/admin/harness"
            className="btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", textDecoration: "none" }}
            title="Open Agent Harness & Plugin Hub"
          >
            <Zap size={13} color="var(--prism-teal)" /> Harness Plugins Hub
          </Link>

          <button 
            className="btn-secondary" 
            onClick={() => loadBackendData()} 
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}
            title="Refresh fleet telemetry"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>

          <button 
            className="btn-primary" 
            onClick={() => setShowModal(true)} 
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12.5px",
              background: "var(--prism-gradient)",
              color: "#fff"
            }}
          >
            <Plus size={15} /> Add Connector
          </button>
        </div>
      </div>

      {/* Executive KPI Stat Cards (Matching AdminSkillsCatalogPage & AdminPromptsPage) */}
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
                color: k.color,
                flexShrink: 0
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
                <div style={{ fontSize: "10px", color: "var(--ink-secondary)", marginTop: "2px" }}>
                  {k.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="prism-card" style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Pills & Search */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          {/* Status Filter Pills */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: `All Connectors (${totalCount})`, icon: Server },
              { id: "VERIFIED", label: `Verified (${verifiedCount})`, icon: CheckCircle2 },
              { id: "UNTESTED", label: `Untested (${untestedCount})`, icon: Zap },
              ...(failedCount > 0 ? [{ id: "FAILED", label: `Failed (${failedCount})`, icon: XCircle }] : [])
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: isSelected ? "600" : "500",
                    color: isSelected ? "var(--prism-pink)" : "var(--ink-secondary)",
                    background: isSelected ? "rgba(225, 29, 72, 0.12)" : "transparent",
                    border: isSelected ? "1px solid rgba(225, 29, 72, 0.3)" : "1px solid var(--border-subtle)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s ease"
                  }}
                >
                  <TabIcon size={12} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search & Category */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", minWidth: "220px" }}>
              <Search size={13} color="var(--ink-tertiary)" style={{ position: "absolute", left: "10px", top: "9px" }} />
              <input
                type="text"
                placeholder="Search connector or endpoint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px 7px 30px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--ink-input)",
                  fontSize: "11.5px"
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{ position: "absolute", right: "8px", top: "7px", background: "none", border: "none", color: "var(--ink-tertiary)", cursor: "pointer" }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="prism-card"
              style={{
                padding: "6px 10px",
                fontSize: "11.5px",
                color: "var(--ink-input)",
                background: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)"
              }}
            >
              <option value="ALL">All Categories</option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Clean Enterprise Connectors Table */}
      <div className="prism-card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--ink-tertiary)", background: "rgba(255,255,255,0.02)" }}>
                <th style={{ padding: "12px 16px" }}>Connector</th>
                <th style={{ padding: "12px 14px" }}>Category</th>
                <th style={{ padding: "12px 14px" }}>Endpoint / Broker</th>
                <th style={{ padding: "12px 14px" }}>Diagnostic Gate</th>
                <th style={{ padding: "12px 14px" }}>State</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && connectors.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: "48px", textAlign: "center", color: "var(--ink-secondary)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                      <RotateCw size={24} className="animate-spin" style={{ color: "var(--prism-pink)" }} />
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink-primary)" }}>Loading Connectors Fleet from Database...</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: "48px", textAlign: "center", color: "var(--ink-secondary)" }}>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--ink-primary)" }}>No matching connectors found</div>
                    <div style={{ fontSize: "12px", color: "var(--ink-tertiary)", marginTop: "4px" }}>
                      Try adjusting your search or active filter tabs.
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isTesting = testingId === c.id;
                  const isPassed = c.test_status === "PASSED";
                  const isUntested = !c.test_status || c.test_status === "UNTESTED";
                  const isEnvDep = c.environment_scope === "ENVIRONMENT_DEPENDENT" || c.scope === "ENVIRONMENT_DEPENDENT";
                  const toolEnvsCount = c.tool_environments_count != null ? c.tool_environments_count : (c.tool_environments ? c.tool_environments.length : 0);

                  return (
                    <tr 
                      key={c.id} 
                      style={{ 
                        borderBottom: "1px solid var(--border-subtle)",
                        cursor: "pointer",
                        transition: "background 0.15s ease"
                      }}
                      onClick={() => {
                        setSelectedConnector(c);
                        setShowDetailModal(true);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-card-hover, rgba(125, 125, 125, 0.04))"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border-subtle)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}>
                            <ToolIcon iconName={c.icon_name || c.connector_key} size={18} fallbackText={c.name} />
                          </div>
                          <div>
                            <div style={{ fontWeight: "700", color: "var(--ink-primary)", fontSize: "13px" }}>{c.name}</div>
                            <div style={{ fontSize: "10.5px", color: "var(--ink-tertiary)", fontFamily: "monospace", marginTop: "2px" }}>
                              {c.connector_key}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "14px 14px" }}>
                        <span className="badge badge-violet" style={{ fontSize: "11px" }}>{c.type}</span>
                      </td>

                      <td style={{ padding: "14px 14px", maxWidth: "220px" }}>
                        <span 
                          className="mono" 
                          style={{ 
                            fontSize: "11px", 
                            color: "var(--accent-teal)", 
                            display: "block", 
                            overflow: "hidden", 
                            textOverflow: "ellipsis", 
                            whiteSpace: "nowrap" 
                          }}
                          title={c.endpoint || c.base_url}
                        >
                          {c.endpoint || c.base_url}
                        </span>
                      </td>

                      <td style={{ padding: "14px 14px" }}>
                        {isPassed ? (
                          <span className="badge badge-teal" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
                            <CheckCircle2 size={11} /> Verified ({c.test_latency_ms ?? c.latency_ms ?? "Not measured"}ms)
                          </span>
                        ) : isUntested ? (
                          <span className="badge badge-amber" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
                            <Zap size={11} /> Untested
                          </span>
                        ) : (
                          <span className="badge badge-rose" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
                            <XCircle size={11} /> Failed
                          </span>
                        )}
                      </td>

                      <td style={{ padding: "14px 14px" }}>
                        <span className={`badge ${c.is_active ? "badge-teal" : "badge-rose"}`} style={{ fontSize: "10.5px" }}>
                          {c.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <button
                            onClick={(e) => handleTest(e, c.id)}
                            disabled={isTesting}
                            className="btn-ghost"
                            style={{ padding: "4px 8px", fontSize: "11px", gap: "4px" }}
                            title="Run live diagnostic check"
                          >
                            {isTesting ? <RotateCw size={11} className="spin" /> : <Play size={11} />}
                            {isTesting ? "Testing" : "Test"}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedConnector(c);
                              setShowDetailModal(true);
                            }}
                            className="btn-secondary"
                            style={{ padding: "5px 10px", fontSize: "11px", gap: "5px" }}
                            title="Configure connector parameters and environments"
                          >
                            <Sliders size={12} /> Details
                          </button>

                          <button
                            onClick={(e) => handleDeleteConnector(e, c)}
                            className="btn-ghost"
                            style={{ padding: "5px 8px", fontSize: "11px", color: "var(--accent-rose)", gap: "4px" }}
                            title={`Delete connector ${c.name}`}
                          >
                            <Trash2 size={12} />
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

      {/* New Connector Accelerator Modal */}
      {showModal && (
        <ConnectorAcceleratorModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadBackendData();
            showToast("New connector registered and configured.", "success");
          }}
        />
      )}

      {/* Connector Detail Modal */}
      {showDetailModal && selectedConnector && (
        <ConnectorDetailModal
          connector={selectedConnector}
          isOpen={true}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedConnector(null);
          }}
          onConnectorUpdated={() => {
            loadBackendData();
            showToast(`Configuration updated for ${selectedConnector.name}`, "success");
          }}
        />
      )}

      {/* Delete Connector Confirmation Dialog */}
      {deleteConfirmConnector && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: "20px"
        }}>
          <div className="glass-card" style={{
            width: "100%",
            maxWidth: "460px",
            background: "var(--bg-card)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            borderRadius: "var(--radius-md)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(244, 63, 94, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-rose)"
              }}>
                <Trash2 size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--ink-primary)", margin: 0 }}>
                  Delete Connector
                </h3>
                <div style={{ fontSize: "12px", color: "var(--ink-tertiary)", marginTop: "2px" }}>
                  {deleteConfirmConnector.name} ({deleteConfirmConnector.connector_key})
                </div>
              </div>
            </div>

            <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", lineHeight: "1.5", margin: 0 }}>
              Are you sure you want to delete this connector? This will remove the canonical connection configuration and unbind it from all associated projects.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteConfirmConnector(null)}
                disabled={isDeleting}
                style={{ padding: "7px 14px", fontSize: "12px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteConnector}
                disabled={isDeleting}
                style={{
                  padding: "7px 16px",
                  fontSize: "12px",
                  background: "var(--accent-rose)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: 600
                }}
              >
                <Trash2 size={12} />
                <span>{isDeleting ? "Deleting..." : "Delete Connector"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
