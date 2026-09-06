import React, { useState, useEffect } from "react";
import {
  Compass,
  BookOpen,
  Activity,
  MessageSquare,
  KeyRound,
  ShieldCheck,
  Send,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Server,
  Layers
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fetchProjects } from "../api/client";

export function GeneralViewerPortalPage() {
  const { currentPersona } = useAuth();
  const [requestedProjects, setRequestedProjects] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    {
      id: "msg_1",
      sender: "assistant",
      text: "Hello! Welcome to the Sentrix Autonomous SRE Platform. As a General Viewer, you have full access to our platform documentation, system health telemetry, and this platform assistant. If you need access to specific engineering projects , you can submit an access request below."
    }
  ]);
  const [chatInput, setChatInput] = useState("");

  const [availableProjects, setAvailableProjects] = useState([]);
  useEffect(() => {
    let cancelled = false;
    fetchProjects().then((projects) => {
      if (!cancelled) setAvailableProjects(projects.map((p) => ({ ...p, key: p.project_key })));
    }).catch(() => { if (!cancelled) setAvailableProjects([]); });
    return () => { cancelled = true; };
  }, []);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    const newMsg = { id: `user_${Date.now()}`, sender: "user", text: userText };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput("");

    // Automated smart assistant response
    setTimeout(() => {
      let reply = "I can guide you through our platform architecture and documentation. For project-specific investigations and triage data, please request project membership from a Project Owner.";
      const lower = userText.toLowerCase();
      if (lower.includes("billing") || lower.includes("project")) {
        reply = "The Billing project handles high-volume payment processing. You can click 'Request Access' in the Project Access Desk below to notify the Project Owner (Marcus Brody).";
      } else if (lower.includes("doc") || lower.includes("api")) {
        reply = "You can browse our complete Developer Docs in the documentation section, which details our Tool Broker, Governed Action Proposals, and OKF v2.0 knowledge fabric.";
      } else if (lower.includes("health") || lower.includes("status")) {
        reply = "All core platform services (SRE Gateway, OKF Vector Fabric, Tool Broker) are operational with 99.98% uptime.";
      }

      setChatMessages((prev) => [
        ...prev,
        { id: `asst_${Date.now()}`, sender: "assistant", text: reply }
      ]);
    }, 600);
  };

  const handleRequestAccess = (projKey) => {
    if (!requestedProjects.includes(projKey)) {
      setRequestedProjects([...requestedProjects, projKey]);
    }
  };

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
              boxShadow: "0 0 18px var(--prism-glow)"
            }}
          >
            <Compass size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                PORTAL WORKSPACE • GENERAL VIEWER
              </span>
              <span className="badge badge-teal">Authenticated</span>
              <span className="badge badge-slate">{currentPersona.email}</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Sentrix Platform Portal
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Welcome to Sentrix. Explore platform documentation, view real-time system health, or request access to engineering projects.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="badge badge-teal" style={{ padding: "6px 12px", fontSize: "12px" }}>
            <ShieldCheck size={14} style={{ marginRight: "4px" }} /> General Portal Access
          </span>
        </div>
      </div>

      {/* System Status Banner */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        <div className="prism-card" style={{ padding: "16px 20px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "var(--ink-tertiary)", fontWeight: 600 }}>CORE SRE ENGINE</span>
            <span className="badge badge-teal" style={{ fontSize: "10px" }}>Operational</span>
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "6px" }}>99.98% Uptime</div>
          <div style={{ fontSize: "11px", color: "var(--ink-secondary)", marginTop: "2px" }}>Zero-Trust Tool Broker Active</div>
        </div>

        <div className="prism-card" style={{ padding: "16px 20px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "var(--ink-tertiary)", fontWeight: 600 }}>OKF KNOWLEDGE FABRIC</span>
            <span className="badge badge-teal" style={{ fontSize: "10px" }}>Active</span>
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "6px" }}>Vector Index Live</div>
          <div style={{ fontSize: "11px", color: "var(--ink-secondary)", marginTop: "2px" }}>84 Playbooks Indexed</div>
        </div>

        <div className="prism-card" style={{ padding: "16px 20px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "var(--ink-tertiary)", fontWeight: 600 }}>MODEL ROUTER</span>
            <span className="badge badge-teal" style={{ fontSize: "10px" }}>Connected</span>
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "6px" }}>Gemini 2.5 Pro / Claude</div>
          <div style={{ fontSize: "11px", color: "var(--ink-secondary)", marginTop: "2px" }}>Multi-Region Fallback Active</div>
        </div>
      </div>

      {/* Main Two-Column Layout: Chat Assistant + Project Access Desk */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        
        {/* Left Column: Sentrix General Assistant Chat */}
        <div className="prism-card" style={{ padding: "20px", display: "flex", flexDirection: "column", height: "460px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px", marginBottom: "12px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(236, 72, 153, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--prism-pink)" }}>
              <Sparkles size={16} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink-primary)" }}>Sentrix Platform Assistant</div>
              <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>Ask about platform capabilities, SRE workflows, or access</div>
            </div>
          </div>

          {/* Message History */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "4px" }}>
            {chatMessages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "12.5px",
                  lineHeight: "1.4",
                  background: m.sender === "user" ? "var(--prism-gradient)" : "var(--bg-elevated)",
                  color: "#fff",
                  border: m.sender === "user" ? "none" : "1px solid var(--border-subtle)"
                }}
              >
                {m.text}
              </div>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendChat} style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <input
              type="text"
              className="input-field"
              placeholder="Ask about platform documentation or projects..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{ flex: 1, fontSize: "12.5px", padding: "8px 12px" }}
            />
            <button type="submit" className="btn-primary" style={{ padding: "8px 14px" }}>
              <Send size={14} />
            </button>
          </form>
        </div>

        {/* Right Column: Project Access Request Desk */}
        <div className="prism-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-teal)" }}>
                <KeyRound size={16} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink-primary)" }}>Project Access Request Desk</div>
                <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>Request access to perform analysis or view live triage</div>
              </div>
            </div>
            <span className="badge badge-teal" style={{ fontSize: "11px" }}>3 Available Projects</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", maxHeight: "360px" }}>
            {availableProjects.map((p) => {
              const isRequested = requestedProjects.includes(p.key);
              return (
                <div
                  key={p.key}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "10px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="mono" style={{ fontSize: "13px", fontWeight: 700, color: "var(--prism-pink)" }}>
                        {p.key}
                      </span>
                      <span className="badge badge-teal" style={{ fontSize: "9.5px" }}>{p.tier}</span>
                    </div>
                    {isRequested ? (
                      <span className="badge badge-teal" style={{ gap: "4px", fontSize: "11px" }}>
                        <CheckCircle2 size={12} /> Request Submitted
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRequestAccess(p.key)}
                        className="btn-secondary"
                        style={{ fontSize: "11px", padding: "4px 10px", gap: "4px" }}
                      >
                        Request Access <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--ink-primary)" }}>{p.name}</div>
                  <div style={{ fontSize: "11.5px", color: "var(--ink-secondary)" }}>{p.description}</div>
                  <div style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>Assigned Squad: {p.squad}</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
