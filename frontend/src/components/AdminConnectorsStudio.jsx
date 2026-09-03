import React, { useState, useEffect } from "react";
import { 
  Server, 
  ShieldAlert, 
  Check, 
  X, 
  ToggleLeft, 
  ToggleRight, 
  Globe, 
  ExternalLink,
  Plus,
  RefreshCw,
  Activity,
  Zap,
  RotateCw
} from "lucide-react";
import { fetchConnectorCatalog, fetchConnectorInstances, toggleAdminConnector, fetchConnectorHealth } from "../api/client";
import { ConnectorAcceleratorModal } from "./ConnectorAcceleratorModal";

export function AdminConnectorsStudio() {
  const [catalog, setCatalog] = useState([]);
  const [instances, setInstances] = useState([]);
  const [healthList, setHealthList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAcceleratorModal, setShowAcceleratorModal] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [testResult, setTestResult] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [catData, instData, hlthData] = await Promise.all([
        fetchConnectorCatalog(),
        fetchConnectorInstances(),
        fetchConnectorHealth()
      ]);
      setCatalog(catData);
      setInstances(instData);
      setHealthList(hlthData);
    } catch (e) {
      console.error("Error loading connectors", e);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (instId) => {
    setTestingId(instId);
    try {
      const res = await fetch(`http://localhost:8000/api/connectors/${instId}/test-connection?environment=prod`, {
        method: "POST"
      });
      const data = await res.json();
      setTestResult((prev) => ({ ...prev, [instId]: data }));
    } catch (e) {
      console.error("Test failed", e);
    } finally {
      setTestingId(null);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleAdmin = async (connectorKey) => {
    try {
      await toggleAdminConnector(connectorKey);
      setCatalog((prev) =>
        prev.map((c) =>
          c.connector_key === connectorKey ? { ...c, is_admin_enabled: !c.is_admin_enabled } : c
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "20px" }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Server size={18} color="var(--accent-violet)" />
            <h2 style={{ fontSize: "18px" }}>Admin Connectors & Extensibility Studio</h2>
            <span className="badge badge-rose">Admin Privilege</span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "4px" }}>
            Extend platform tools via modular accelerators (MCP, REST, SQL, APM) and verify live connectivity.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-secondary" onClick={loadData}>
            <RefreshCw size={14} /> Refresh Catalog
          </button>
          
          <button className="btn-teal" onClick={() => setShowAcceleratorModal(true)}>
            <Zap size={14} /> Add Connector from Template
          </button>
        </div>
      </div>

      {/* Global Catalog Grid */}
      <div>
        <h3 style={{ fontSize: "15px", marginBottom: "12px", color: "#fff" }}>
          Enterprise Connector Catalog (Admin Enablement Gate)
        </h3>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "16px"
        }}>
          {catalog.map((c) => (
            <div
              key={c.id}
              className="glass-card"
              style={{
                padding: "18px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "14px",
                border: c.is_admin_enabled 
                  ? "1px solid rgba(78, 230, 199, 0.3)" 
                  : "1px solid rgba(255, 122, 182, 0.3)"
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#fff" }}>{c.name}</span>
                  <span className={`badge ${c.is_admin_enabled ? "badge-teal" : "badge-rose"}`}>
                    {c.is_admin_enabled ? "Admin Enabled" : "Disabled"}
                  </span>
                </div>

                <p style={{ fontSize: "12px", color: "var(--ink-secondary)", lineHeight: "1.4" }}>
                  {c.description}
                </p>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
                  {c.supported_protocols?.map((prot) => (
                    <span key={prot} className="mono" style={{ fontSize: "10px", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: "4px" }}>
                      {prot}
                    </span>
                  ))}
                </div>
              </div>

              {/* Toggle Switch */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "10px",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)"
              }}>
                <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>Global Availability:</span>
                <button
                  className="btn-ghost"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: c.is_admin_enabled ? "var(--accent-teal)" : "var(--accent-rose)",
                    fontWeight: "600"
                  }}
                  onClick={() => handleToggleAdmin(c.connector_key)}
                >
                  {c.is_admin_enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  {c.is_admin_enabled ? "Enabled" : "Disabled"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Instances Table */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "15px", marginBottom: "12px", color: "#fff" }}>
          Configured Connector Instances & Endpoints
        </h3>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-glass)", textAlign: "left", color: "var(--ink-tertiary)" }}>
                <th style={{ padding: "10px" }}>Instance Name</th>
                <th style={{ padding: "10px" }}>Connector Key</th>
                <th style={{ padding: "10px" }}>Protocol</th>
                <th style={{ padding: "10px" }}>Auth Type</th>
                <th style={{ padding: "10px" }}>Scope</th>
                <th style={{ padding: "10px" }}>Status & Latency</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Diagnostic Probes</th>
              </tr>
            </thead>
            <tbody>
              {instances.map((inst) => {
                const isTestingThis = testingId === inst.id;
                const result = testResult[inst.id];
                return (
                  <tr key={inst.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                    <td style={{ padding: "10px", fontWeight: "600", color: "#fff" }}>{inst.name}</td>
                    <td style={{ padding: "10px" }} className="mono">{inst.connector_key}</td>
                    <td style={{ padding: "10px" }}>
                      <span className="badge badge-violet">{inst.protocol}</span>
                    </td>
                    <td style={{ padding: "10px" }} className="mono">{inst.auth_type}</td>
                    <td style={{ padding: "10px" }}>
                      {inst.is_global ? (
                        <span className="badge badge-teal" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Globe size={11} /> GLOBAL TOOL
                        </span>
                      ) : (
                        <span style={{ color: "var(--ink-secondary)" }}>Environment-Mapped</span>
                      )}
                    </td>
                    <td style={{ padding: "10px" }}>
                      {result ? (
                        <span className="mono" style={{ color: "var(--accent-teal)", fontWeight: "600" }}>
                          ✓ {result.latency_ms}ms ({result.status})
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--accent-teal)" }}>
                          <Activity size={13} /> Active
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "10px", textAlign: "right" }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: "4px 10px", fontSize: "11px" }}
                        onClick={() => handleTestConnection(inst.id)}
                        disabled={isTestingThis}
                      >
                        {isTestingThis ? <RotateCw size={11} className="animate-spin" /> : <Activity size={11} />}
                        {isTestingThis ? "Testing..." : "Test Connection"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accelerator Modal */}
      {showAcceleratorModal && (
        <ConnectorAcceleratorModal
          onClose={() => setShowAcceleratorModal(false)}
          onConnectorCreated={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
}
