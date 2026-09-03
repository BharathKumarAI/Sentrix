import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Layers,
  Zap,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Cpu,
  Server,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  BookOpen,
  DollarSign,
  Activity,
  Globe,
  Sliders,
  ExternalLink
} from "lucide-react";

export function AdminOverviewPage({ projects = [], onOpenNewProjectModal }) {
  const navigate = useNavigate();

  const executiveKpis = [
    {
      label: "Active Enterprise Projects",
      value: "56",
      subtext: "12 Tier-1 Mission Critical",
      change: "+4 this month",
      icon: Layers,
      color: "var(--prism-pink)"
    },
    {
      label: "Autonomous Triage MTTA",
      value: "18s",
      subtext: "vs 6.2m human baseline",
      change: "95.1% faster response",
      icon: Clock,
      color: "var(--accent-teal)"
    },
    {
      label: "Mean Time to Resolve (MTTR)",
      value: "14.2m",
      subtext: "Down from 44.0m baseline",
      change: "68% resolution acceleration",
      icon: TrendingDown,
      color: "var(--accent-violet)"
    },
    {
      label: "Guarded Action Proposals",
      value: "100%",
      subtext: "Zero unauthorized writes",
      change: "Cryptographic lock verified",
      icon: ShieldCheck,
      color: "var(--accent-amber)"
    }
  ];

  const criticalProjects = [
    {
      key: "BILLING",
      name: "Global Billing & Payment Gateway",
      tier: "Tier-1 Mission Critical",
      status: "HEALTHY",
      mtta: "14s",
      mttr: "12.4m",
      sla: "99.99%",
      activeIncidents: 1,
      fixTeam: "Payments Core Team",
      envCount: 3
    },
    {
      key: "AUTH",
      name: "IAM & Edge OAuth Gateway",
      tier: "Tier-1 Mission Critical",
      status: "HEALTHY",
      mtta: "19s",
      mttr: "8.6m",
      sla: "100.0%",
      activeIncidents: 0,
      fixTeam: "Identity & Access Squad",
      envCount: 3
    },
    {
      key: "CHECKOUT",
      name: "Omnichannel Checkout & Cart",
      tier: "Tier-1 Mission Critical",
      status: "HEALTHY",
      mtta: "22s",
      mttr: "16.1m",
      sla: "99.98%",
      activeIncidents: 1,
      fixTeam: "Checkout Reliability",
      envCount: 4
    },
    {
      key: "FULFILLMENT",
      name: "Supply Chain & Warehouse Allocation",
      tier: "Tier-2 High Availability",
      status: "HEALTHY",
      mtta: "28s",
      mttr: "19.5m",
      sla: "99.95%",
      activeIncidents: 0,
      fixTeam: "Fulfillment SRE",
      envCount: 2
    }
  ];

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
      {/* 1. Framework Page Hero Card */}
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
            <Home size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                PLATFORM • EXECUTIVE CONTROL PLANE
              </span>
              <span className="badge badge-teal">Multi-Tenant Enterprise</span>
              <span className="badge badge-magenta">ADK 2.8 Autonomous Engine</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Enterprise SRE Platform Overview
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Global control plane aggregating cross-project incident trends, autonomous triage performance, tool broker governance, and SLA compliance.
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="btn-secondary"
            style={{ fontSize: "12px", gap: "6px" }}
          >
            <Activity size={14} /> View Live Ops Dashboard
          </button>

          <button
            onClick={() => {
              if (onOpenNewProjectModal) onOpenNewProjectModal();
              else navigate("/admin/projects?create=true");
            }}
            className="btn-primary"
            style={{ fontSize: "12px", gap: "6px" }}
          >
            <Plus size={14} /> Register New Project
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
        {executiveKpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="prism-card"
              style={{
                padding: "20px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-card)",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>{kpi.label}</span>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "var(--bg-elevated)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: kpi.color
                  }}
                >
                  <Icon size={18} />
                </div>
              </div>

              <div className="mono" style={{ fontSize: "28px", fontWeight: 800, color: "var(--ink-primary)" }}>
                {kpi.value}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: "8px", fontSize: "11px" }}>
                <span style={{ color: "var(--ink-secondary)" }}>{kpi.subtext}</span>
                <span style={{ color: "var(--accent-teal)", fontWeight: 600 }}>{kpi.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Main Grid: Tier-1 Fleet Health & Autonomous Governance Quality Flywheel */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        {/* Left Column: Tier-1 Mission Critical Projects Fleet Table */}
        <div className="prism-card" style={{ padding: "20px", background: "var(--bg-card)", border: "1px solid var(--border-card)", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
                Mission-Critical Project Fleets
              </h3>
              <p style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "2px" }}>
                Live SLA health, autonomous MTTA, and active SRE squad assignments.
              </p>
            </div>

            <button
              onClick={() => navigate("/admin/projects")}
              className="btn-ghost"
              style={{ fontSize: "11.5px", gap: "4px", color: "var(--prism-pink)" }}
            >
              View all 56 projects <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {criticalProjects.map((p) => (
              <div
                key={p.key}
                onClick={() => navigate(`/p/${p.key}/overview`)}
                style={{
                  padding: "14px 16px",
                  borderRadius: "8px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  display: "grid",
                  gridTemplateColumns: "110px 1.4fr 120px 120px 100px 90px",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                <div>
                  <span className="badge badge-teal" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 700 }}>
                    {p.key}
                  </span>
                </div>

                <div>
                  <strong style={{ fontSize: "13px", color: "var(--ink-primary)" }}>{p.name}</strong>
                  <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "2px" }}>
                    Squad: {p.fixTeam}
                  </div>
                </div>

                <div style={{ fontSize: "11.5px", color: "var(--ink-secondary)" }}>
                  MTTA: <strong style={{ color: "var(--accent-teal)" }}>{p.mtta}</strong>
                </div>

                <div style={{ fontSize: "11.5px", color: "var(--ink-secondary)" }}>
                  MTTR: <strong style={{ color: "var(--accent-violet)" }}>{p.mttr}</strong>
                </div>

                <div>
                  <span style={{ fontSize: "11px", color: "var(--accent-teal)", fontWeight: 700 }}>
                    {p.sla} SLA
                  </span>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span className="badge badge-magenta" style={{ fontSize: "10px" }}>
                    {p.activeIncidents} Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Platform Governance & Zero-Trust Tool Broker */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Quality Flywheel Card */}
          <div className="prism-card" style={{ padding: "20px", background: "var(--bg-card)", border: "1px solid var(--border-card)", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={18} color="var(--accent-teal)" />
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)" }}>
                Zero-Trust SRE Governance
              </h4>
            </div>

            <p style={{ fontSize: "12px", color: "var(--ink-secondary)", lineHeight: 1.45 }}>
              All autonomous investigations run strictly in read-only telemetry mode. Modifying actions generate governed cryptographic action proposals requiring domain engineer authorization.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11.5px", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-tertiary)" }}>Authorized Write Proposals:</span>
                <strong style={{ color: "var(--accent-teal)" }}>128 Approved</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-tertiary)" }}>Blocked Unauthorized Queries:</span>
                <strong style={{ color: "#ef4444" }}>0 Breaches</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-tertiary)" }}>OKF Knowledge Nodes:</span>
                <strong style={{ color: "var(--prism-pink)" }}>1,248 Precedents</strong>
              </div>
            </div>
          </div>

          {/* Quick Fleet Actions */}
          <div className="prism-card" style={{ padding: "18px", background: "var(--bg-card)", border: "1px solid var(--border-card)", display: "flex", flexDirection: "column", gap: "10px" }}>
            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-primary)" }}>
              Platform Quick Links
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <button
                onClick={() => navigate("/admin/connectors")}
                className="btn-ghost"
                style={{ justifyContent: "space-between", fontSize: "12px", padding: "8px 10px" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><Server size={14} /> Connectors Catalog</span>
                <ArrowRight size={12} />
              </button>

              <button
                onClick={() => navigate("/admin/environments")}
                className="btn-ghost"
                style={{ justifyContent: "space-between", fontSize: "12px", padding: "8px 10px" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><Globe size={14} /> Environment Resolver</span>
                <ArrowRight size={12} />
              </button>

              <button
                onClick={() => navigate("/admin/reports")}
                className="btn-ghost"
                style={{ justifyContent: "space-between", fontSize: "12px", padding: "8px 10px" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><BookOpen size={14} /> Fleet Reports (Weekly/Monthly)</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
