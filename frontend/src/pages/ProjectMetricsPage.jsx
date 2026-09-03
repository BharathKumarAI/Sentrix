import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Zap,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Database,
  Cpu,
  Users,
  Info,
  Activity,
  Sparkles,
  ChevronRight,
  X
} from "lucide-react";

export function ProjectMetricsPage({ activeProject }) {
  const projectKey = activeProject?.project_key || "BILLING";
  const [timeRange, setTimeRange] = useState("7d"); // "24h" | "7d" | "30d" | "qtd"
  const [selectedDay, setSelectedDay] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [activeMetricTab, setActiveMetricTab] = useState("ALL"); // "ALL" | "MTTA" | "MTTR" | "SLA"
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState(null);
  const [selectedRootCause, setSelectedRootCause] = useState(null);
  const [hoveredGauge, setHoveredGauge] = useState(false);

  const kpis = [
    {
      id: "MTTA",
      label: "Mean Time to Acknowledge (MTTA)",
      value: "18s",
      change: "↓ 94% vs manual (6.2m)",
      isPositive: true,
      icon: Clock,
      color: "var(--accent-teal)"
    },
    {
      id: "MTTR",
      label: "Mean Time to Resolve (MTTR)",
      value: "14.2m",
      change: "↓ 68% vs baseline (44m)",
      isPositive: true,
      icon: TrendingUp,
      color: "var(--prism-pink)"
    },
    {
      id: "ACCURACY",
      label: "Autonomous Triage Accuracy",
      value: "96.4%",
      change: "↑ 3.2% vs last month",
      isPositive: true,
      icon: Zap,
      color: "var(--accent-violet)"
    },
    {
      id: "SLA",
      label: "SLA Adherence (P1/P2)",
      value: "99.8%",
      change: "0 breach in 30 days",
      isPositive: true,
      icon: ShieldCheck,
      color: "var(--accent-teal)"
    }
  ];

  const rootCauses = [
    {
      id: "pool",
      category: "Connection Pool Saturation (HikariCP / PG)",
      count: 48,
      pct: 38,
      color: "var(--prism-pink)",
      tickets: ["BILL-1049", "BILL-1021", "BILL-988"],
      affectedServices: "Stripe Webhook Worker, Postgres Primary"
    },
    {
      id: "deadlock",
      category: "Row-Level Deadlocks & Lock Contention",
      count: 31,
      pct: 24,
      color: "var(--accent-amber)",
      tickets: ["BILL-1033", "BILL-1012"],
      affectedServices: "Billing Ledger, Ledger Reconciler"
    },
    {
      id: "jwks",
      category: "JWKS / OAuth2 Cache Expiration Storms",
      count: 23,
      pct: 18,
      color: "var(--accent-teal)",
      tickets: ["AUTH-882", "AUTH-841"],
      affectedServices: "Keycloak Gateway, Envoy Edge"
    },
    {
      id: "oom",
      category: "K8s Worker Memory Leak / OOMKilled",
      count: 15,
      pct: 12,
      color: "var(--accent-violet)",
      tickets: ["OPS-541", "OPS-510"],
      affectedServices: "Worker Pool 04, Notification Daemon"
    },
    {
      id: "rate_limit",
      category: "Upstream SaaS API Rate Limits (SendGrid / Stripe)",
      count: 10,
      pct: 8,
      color: "var(--accent-blue)",
      tickets: ["BILL-994", "COMMS-312"],
      affectedServices: "Invoice Mailer, Webhook Dispatcher"
    }
  ];

  const teamPerformance = [
    { team: "Payments Core Team", incidents: 52, mtta: "16s", mttr: "12m", rcaAccuracy: "97.8%", openTickets: 1, lead: "Alex Vance" },
    { team: "Database Infrastructure Team", incidents: 34, mtta: "22s", mttr: "18m", rcaAccuracy: "96.2%", openTickets: 1, lead: "Elena Rostova" },
    { team: "Identity & Security Team", incidents: 28, mtta: "14s", mttr: "10m", rcaAccuracy: "95.5%", openTickets: 1, lead: "Marcus Chen" },
    { team: "Communications Team", incidents: 19, mtta: "19s", mttr: "15m", rcaAccuracy: "94.8%", openTickets: 1, lead: "Priya Sharma" },
    { team: "Core Infrastructure", incidents: 42, mtta: "12s", mttr: "8m", rcaAccuracy: "98.9%", openTickets: 0, lead: "David Kim" }
  ];

  const dailyVolume = [
    { day: "Mon", p1: 4, p2: 8, p3: 12, peakTime: "14:20 UTC", topService: "Stripe Webhook Worker", rca: "Connection Pool Exhaustion" },
    { day: "Tue", p1: 6, p2: 11, p3: 9, peakTime: "11:05 UTC", topService: "Billing Ledger Service", rca: "Row-Level Lock Contention" },
    { day: "Wed", p1: 2, p2: 7, p3: 14, peakTime: "09:40 UTC", topService: "Keycloak Token Gateway", rca: "JWKS Certificate Cache" },
    { day: "Thu", p1: 8, p2: 12, p3: 8, peakTime: "16:15 UTC", topService: "Payment Processing Pods", rca: "K8s Worker Memory Leak" },
    { day: "Fri", p1: 3, p2: 9, p3: 15, peakTime: "18:30 UTC", topService: "Invoice Email Worker", rca: "SendGrid API Rate Limits" },
    { day: "Sat", p1: 1, p2: 4, p3: 6, peakTime: "03:10 UTC", topService: "Ledger Reconciler", rca: "Scheduled Cron Deadlock" },
    { day: "Sun", p1: 2, p2: 5, p3: 5, peakTime: "08:50 UTC", topService: "Stripe Webhook Worker", rca: "Ingress 504 Timeouts" }
  ];

  // Interactive 8-point time series trend data for MTTA & MTTR
  const trendPoints = [
    { label: "Day 1", mtta: 28, mttr: 26.4, baselineMttr: 44.0, incidents: 18 },
    { label: "Day 2", mtta: 24, mttr: 22.1, baselineMttr: 44.0, incidents: 26 },
    { label: "Day 3", mtta: 21, mttr: 19.5, baselineMttr: 44.0, incidents: 23 },
    { label: "Day 4", mtta: 19, mttr: 17.8, baselineMttr: 44.0, incidents: 28 },
    { label: "Day 5", mtta: 18, mttr: 16.0, baselineMttr: 44.0, incidents: 27 },
    { label: "Day 6", mtta: 17, mttr: 15.2, baselineMttr: 44.0, incidents: 11 },
    { label: "Day 7", mtta: 18, mttr: 14.2, baselineMttr: 44.0, incidents: 12 },
    { label: "Live", mtta: 18, mttr: 14.2, baselineMttr: 44.0, incidents: 9 }
  ];

  // SVG Area Chart coordinates calculation (viewBox 0 0 500 160)
  const svgWidth = 500;
  const svgHeight = 160;
  const paddingX = 30;
  const paddingY = 20;

  const getX = (index) => paddingX + (index / (trendPoints.length - 1)) * (svgWidth - 2 * paddingX);
  const getMttrY = (val) => svgHeight - paddingY - ((val - 10) / (48 - 10)) * (svgHeight - 2 * paddingY);
  const getMttaY = (val) => svgHeight - paddingY - ((val - 14) / (32 - 14)) * (svgHeight - 2 * paddingY);

  const mttrPathD = trendPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${getX(i)} ${getMttrY(pt.mttr)}`, "");
  const mttrAreaD = `${mttrPathD} L ${getX(trendPoints.length - 1)} ${svgHeight - paddingY} L ${getX(0)} ${svgHeight - paddingY} Z`;

  const mttaPathD = trendPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${getX(i)} ${getMttaY(pt.mtta)}`, "");
  const baselinePathD = trendPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${getX(i)} ${getMttrY(pt.baselineMttr)}`, "");

  const activeDaily = selectedDay ? dailyVolume.filter((d) => d.day === selectedDay) : dailyVolume;
  const totalSelectedIncidents = activeDaily.reduce((acc, d) => acc + d.p1 + d.p2 + d.p3, 0);

  return (
    <div
      style={{
        padding: "24px 32px",
        display: "flex",
        flexDirection: "column",
        gap: "22px",
        overflowY: "auto",
        minHeight: "100%",
        boxSizing: "border-box"
      }}
    >
      {/* Hero Header */}
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
            <BarChart3 size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                {projectKey} • INSIGHTS
              </span>
              <span className="badge badge-teal">Live SLI/SLO Telemetry</span>
              <span className="badge badge-magenta">ADK Triage Analytics</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              SRE Reliability & Auto-Triage Metrics
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Interactive telemetry analytics, historical MTTA/MTTR curves, SLO error budgets, and squad triage distribution.
            </p>
          </div>
        </div>

        {/* Range Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {[
            { id: "24h", label: "24h" },
            { id: "7d", label: "Last 7 Days" },
            { id: "30d", label: "30 Days" },
            { id: "qtd", label: "Quarter" }
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setTimeRange(r.id)}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "6px",
                border: timeRange === r.id ? "1px solid var(--prism-magenta)" : "1px solid var(--border-subtle)",
                background: timeRange === r.id ? "rgba(225, 29, 72, 0.12)" : "var(--bg-card)",
                color: timeRange === r.id ? "var(--prism-pink)" : "var(--ink-secondary)",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Row (Clickable to switch graph focus) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isSelected = activeMetricTab === kpi.id;

          return (
            <div
              key={kpi.id}
              onClick={() => setActiveMetricTab(activeMetricTab === kpi.id ? "ALL" : kpi.id)}
              className="prism-card"
              style={{
                padding: "16px 20px",
                background: isSelected ? "rgba(236, 72, 153, 0.08)" : "var(--bg-card)",
                border: isSelected ? "1.5px solid var(--prism-pink)" : "1px solid var(--border-card)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isSelected ? "0 0 16px rgba(236, 72, 153, 0.25)" : "none"
              }}
              title="Click to highlight in interactive graphs"
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>{kpi.label}</span>
                <Icon size={16} color={kpi.color} />
              </div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--ink-primary)", marginTop: "6px" }}>
                {kpi.value}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                <span style={{ fontSize: "11.5px", color: "var(--accent-teal)", fontWeight: 600 }}>
                  {kpi.change}
                </span>
                {isSelected && (
                  <span className="badge badge-magenta" style={{ fontSize: "9px" }}>Active View</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* PRIMARY INTERACTIVE GRAPH ROW: Dual-Curve MTTA/MTTR Area Chart & SLO Error Budget Burn Gauge */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px", alignItems: "stretch" }}>
        {/* Left: Interactive SVG Area Chart */}
        <div
          className="prism-card"
          style={{
            padding: "20px 24px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            display: "flex",
            flexDirection: "column",
            gap: "14px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Activity size={16} color="var(--prism-pink)" />
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
                  MTTA & MTTR Compression Trajectory
                </h3>
              </div>
              <p style={{ fontSize: "12px", color: "var(--ink-tertiary)", marginTop: "2px" }}>
                Interactive dual-curve showing human manual baseline (44m) vs Autonomous Sentrix Agent (14.2m).
              </p>
            </div>

            {/* Legend & Toggle Chips */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--prism-pink)" }}>
                <span style={{ width: "10px", height: "3px", background: "var(--prism-pink)", borderRadius: "2px" }} />
                MTTR (14.2m)
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--accent-teal)" }}>
                <span style={{ width: "10px", height: "3px", background: "var(--accent-teal)", borderRadius: "2px" }} />
                MTTA (18s)
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--ink-tertiary)" }}>
                <span style={{ width: "10px", height: "1px", borderTop: "2px dashed var(--ink-tertiary)" }} />
                Baseline (44m)
              </span>
            </div>
          </div>

          {/* SVG Interactive Area Canvas */}
          <div style={{ position: "relative", width: "100%", height: "180px", marginTop: "4px" }}>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              style={{ width: "100%", height: "100%", overflow: "visible" }}
              onMouseLeave={() => setHoveredTrendIdx(null)}
            >
              <defs>
                <linearGradient id="mttrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="mttaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[40, 80, 120].map((y) => (
                <line
                  key={y}
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Baseline manual curve (Dashed) */}
              <path
                d={baselinePathD}
                fill="none"
                stroke="var(--ink-tertiary)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.5"
              />

              {/* MTTR Area & Path */}
              <path d={mttrAreaD} fill="url(#mttrGradient)" />
              <path d={mttrPathD} fill="none" stroke="var(--prism-pink)" strokeWidth="2.5" />

              {/* MTTA Path */}
              <path d={mttaPathD} fill="none" stroke="var(--accent-teal)" strokeWidth="2" />

              {/* Interactive Data Points */}
              {trendPoints.map((pt, idx) => {
                const x = getX(idx);
                const yMttr = getMttrY(pt.mttr);
                const isHovered = hoveredTrendIdx === idx;

                return (
                  <g key={idx}>
                    {/* Hover vertical tracking line */}
                    {isHovered && (
                      <line
                        x1={x}
                        y1={paddingY}
                        x2={x}
                        y2={svgHeight - paddingY}
                        stroke="rgba(255, 255, 255, 0.25)"
                        strokeDasharray="2 2"
                      />
                    )}

                    {/* MTTR circle */}
                    <circle
                      cx={x}
                      cy={yMttr}
                      r={isHovered ? 6 : 4}
                      fill={isHovered ? "#fff" : "var(--prism-pink)"}
                      stroke="var(--bg-card)"
                      strokeWidth="2"
                      style={{ cursor: "pointer", transition: "all 0.15s ease" }}
                      onMouseEnter={() => setHoveredTrendIdx(idx)}
                    />

                    {/* Transparent touch area */}
                    <rect
                      x={x - 15}
                      y={0}
                      width={30}
                      height={svgHeight}
                      fill="transparent"
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setHoveredTrendIdx(idx)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredTrendIdx !== null && (
              <div
                style={{
                  position: "absolute",
                  left: `${(getX(hoveredTrendIdx) / svgWidth) * 100}%`,
                  top: "10px",
                  transform: "translateX(-50%)",
                  background: "rgba(11, 16, 43, 0.95)",
                  border: "1px solid var(--prism-pink)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
                  pointerEvents: "none",
                  zIndex: 20,
                  fontSize: "11.5px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                  whiteSpace: "nowrap"
                }}
              >
                <div style={{ fontWeight: 700, color: "#fff", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "2px" }}>
                  {trendPoints[hoveredTrendIdx].label} • Telemetry Snapshot
                </div>
                <div style={{ color: "var(--prism-pink)", display: "flex", justifyContent: "space-between", gap: "10px" }}>
                  <span>MTTR:</span> <strong>{trendPoints[hoveredTrendIdx].mttr}m</strong>
                </div>
                <div style={{ color: "var(--accent-teal)", display: "flex", justifyContent: "space-between", gap: "10px" }}>
                  <span>MTTA:</span> <strong>{trendPoints[hoveredTrendIdx].mtta}s</strong>
                </div>
                <div style={{ color: "var(--ink-secondary)", display: "flex", justifyContent: "space-between", gap: "10px" }}>
                  <span>Incidents Handled:</span> <strong>{trendPoints[hoveredTrendIdx].incidents}</strong>
                </div>
                <div style={{ color: "var(--ink-tertiary)", fontSize: "10px" }}>
                  Manual Baseline: 44.0m (-68% faster)
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px", fontSize: "11.5px", color: "var(--ink-tertiary)" }}>
            <span>Hover over nodes to inspect point-in-time MTTA & MTTR telemetry snapshots</span>
            <span style={{ color: "var(--accent-teal)", fontWeight: 600 }}>Autonomous Compression: -68% MTTR</span>
          </div>
        </div>

        {/* Right: Interactive SLO Error Budget Burn Gauge */}
        <div
          className="prism-card"
          style={{
            padding: "20px 24px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            cursor: "pointer"
          }}
          onMouseEnter={() => setHoveredGauge(true)}
          onMouseLeave={() => setHoveredGauge(false)}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={16} color="var(--accent-teal)" />
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
                  SLO Error Budget Burn
                </h3>
              </div>
              <span className="badge badge-teal">Healthy 99.98%</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--ink-tertiary)", marginTop: "2px" }}>
              Tier-1 Payment Service 30-Day Rolling SLO (99.90% Target).
            </p>
          </div>

          {/* Interactive SVG Circular Gauge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", height: "140px" }}>
            <svg viewBox="0 0 120 120" style={{ width: "120px", height: "120px" }}>
              {/* Background Track */}
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="10"
              />
              {/* Burn Rate Track */}
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="var(--accent-teal)"
                strokeWidth="10"
                strokeDasharray="301.59"
                strokeDashoffset={301.59 * (1 - 0.858)}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>

            {/* Gauge Center Readout */}
            <div style={{ position: "absolute", textAlign: "center" }}>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--ink-primary)" }}>
                85.8%
              </div>
              <div style={{ fontSize: "10.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>
                Budget Left
              </div>
            </div>
          </div>

          <div style={{ padding: "8px 12px", background: "rgba(16, 185, 129, 0.08)", borderRadius: "6px", border: "1px solid rgba(16, 185, 129, 0.2)", fontSize: "11.5px", color: "var(--ink-primary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Burn Velocity:</span> <strong style={{ color: "var(--accent-teal)" }}>0.14x / hr</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
              <span>Projected Depletion:</span> <strong style={{ color: "var(--ink-secondary)" }}>142 days remaining</strong>
            </div>
          </div>
        </div>
      </div>

      {/* SECOND INTERACTIVE ROW: Daily Incident Velocity Histogram & Root Cause Drilldowns */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px", alignItems: "start" }}>
        {/* Left: Interactive Daily Incident Volume Histogram */}
        <div
          className="prism-card"
          style={{
            padding: "20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BarChart3 size={16} color="var(--accent-teal)" />
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
                  Daily Incident Ingestion Velocity
                </h3>
              </div>
              <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                Click any bar to filter telemetry snapshots by day
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--accent-rose)" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "var(--accent-rose)" }} /> P1 Critical
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--accent-amber)" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "var(--accent-amber)" }} /> P2 Major
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--accent-teal)" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "var(--accent-teal)" }} /> P3 Minor
              </span>
              {selectedDay && (
                <button
                  onClick={() => setSelectedDay(null)}
                  className="btn-ghost"
                  style={{ fontSize: "10.5px", padding: "2px 6px", color: "var(--prism-pink)" }}
                >
                  <X size={11} /> Reset Day
                </button>
              )}
            </div>
          </div>

          {/* Interactive Stacked Bar Chart with Hover Tooltip */}
          <div style={{ position: "relative" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px", alignItems: "end", height: "180px", paddingTop: "20px" }}>
              {dailyVolume.map((item) => {
                const total = item.p1 + item.p2 + item.p3;
                const heightPct = Math.round((total / 30) * 100);
                const isSelected = selectedDay === item.day;
                const isHovered = hoveredDay?.day === item.day;

                return (
                  <div
                    key={item.day}
                    onClick={() => setSelectedDay(selectedDay === item.day ? null : item.day)}
                    onMouseEnter={() => setHoveredDay(item)}
                    onMouseLeave={() => setHoveredDay(null)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      height: "100%",
                      justifyContent: "flex-end",
                      cursor: "pointer",
                      opacity: selectedDay && !isSelected ? 0.35 : 1,
                      transform: isHovered || isSelected ? "scale(1.05)" : "scale(1)",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        maxWidth: "38px",
                        height: `${heightPct}%`,
                        display: "flex",
                        flexDirection: "column-reverse",
                        borderRadius: "6px",
                        overflow: "hidden",
                        border: isSelected ? "2px solid #fff" : "none",
                        boxShadow: isHovered ? "0 0 16px rgba(255, 255, 255, 0.4)" : "none"
                      }}
                    >
                      <div style={{ height: `${(item.p1 / total) * 100}%`, background: "var(--accent-rose)" }} />
                      <div style={{ height: `${(item.p2 / total) * 100}%`, background: "var(--accent-amber)" }} />
                      <div style={{ height: `${(item.p3 / total) * 100}%`, background: "var(--accent-teal)" }} />
                    </div>
                    <span style={{ fontSize: "11px", color: isSelected ? "var(--prism-pink)" : "var(--ink-secondary)", fontWeight: 700 }}>
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Hover Tooltip for Histogram Bar */}
            {hoveredDay && (
              <div
                style={{
                  position: "absolute",
                  top: "-10px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(11, 16, 43, 0.95)",
                  border: "1px solid var(--accent-teal)",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
                  pointerEvents: "none",
                  zIndex: 25,
                  fontSize: "11.5px",
                  display: "flex",
                  gap: "14px",
                  alignItems: "center"
                }}
              >
                <div>
                  <strong style={{ color: "#fff" }}>{hoveredDay.day} Breakdown:</strong>
                  <div style={{ color: "var(--accent-rose)", fontSize: "11px" }}>P1 Critical: {hoveredDay.p1}</div>
                  <div style={{ color: "var(--accent-amber)", fontSize: "11px" }}>P2 Major: {hoveredDay.p2}</div>
                  <div style={{ color: "var(--accent-teal)", fontSize: "11px" }}>P3 Minor: {hoveredDay.p3}</div>
                </div>
                <div style={{ borderLeft: "1px solid rgba(255, 255, 255, 0.15)", paddingLeft: "12px", color: "var(--ink-secondary)" }}>
                  <div>Peak Surge: <strong style={{ color: "#fff" }}>{hoveredDay.peakTime}</strong></div>
                  <div>Top Service: <span style={{ color: "var(--prism-pink)" }}>{hoveredDay.topService}</span></div>
                  <div>Root Cause: <span style={{ color: "var(--accent-teal)" }}>{hoveredDay.rca}</span></div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px", fontSize: "11.5px", color: "var(--ink-tertiary)" }}>
            <span>Filtered Total: <strong style={{ color: "var(--ink-primary)" }}>{totalSelectedIncidents} Incidents</strong></span>
            <span>Auto-Triaged: <strong style={{ color: "var(--accent-teal)" }}>{Math.round(totalSelectedIncidents * 0.96)} (96.1%)</strong></span>
          </div>
        </div>

        {/* Right: Interactive Root Cause Category Distribution */}
        <div
          className="prism-card"
          style={{
            padding: "20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            display: "flex",
            flexDirection: "column",
            gap: "14px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
              Root Cause Category Distribution
            </h3>
            {selectedRootCause && (
              <button
                onClick={() => setSelectedRootCause(null)}
                className="btn-ghost"
                style={{ fontSize: "10.5px", padding: "2px 6px", color: "var(--prism-pink)" }}
              >
                <X size={11} /> Clear Selection
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {rootCauses.map((rc) => {
              const isSelected = selectedRootCause?.id === rc.id;

              return (
                <div
                  key={rc.id}
                  onClick={() => setSelectedRootCause(isSelected ? null : rc)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    background: isSelected ? "rgba(255, 255, 255, 0.05)" : "transparent",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                  title="Click to drill into affected tickets and microservices"
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: isSelected ? "#fff" : "var(--ink-secondary)", maxWidth: "260px", fontWeight: isSelected ? 700 : 500 }}>
                      {rc.category}
                    </span>
                    <strong style={{ color: rc.color }}>{rc.count} ({rc.pct}%)</strong>
                  </div>
                  <div style={{ height: "6px", borderRadius: "999px", background: "var(--bg-input)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${rc.pct}%`, background: rc.color, transition: "width 0.4s ease" }} />
                  </div>

                  {/* Expanded Drilldown on Click */}
                  {isSelected && (
                    <div style={{ marginTop: "4px", padding: "6px 8px", background: "rgba(0, 0, 0, 0.3)", borderRadius: "4px", fontSize: "11px", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--ink-tertiary)" }}>Affected: {rc.affectedServices}</span>
                      <span style={{ color: rc.color }}>Tickets: {rc.tickets.join(", ")}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* THIRD ROW: Interactive Squad Resolution & Accuracy Matrix */}
      <div className="prism-card" style={{ padding: "20px", background: "var(--bg-card)", border: "1px solid var(--border-card)", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
            Engineering Squad Resolution & Accuracy Matrix
          </h3>
          <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
            Live correlation of dispatched auto-triaged tickets across squads
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)", color: "var(--ink-secondary)", textAlign: "left" }}>
                <th style={{ padding: "10px 14px" }}>Application Squad</th>
                <th style={{ padding: "10px 14px" }}>Squad Lead</th>
                <th style={{ padding: "10px 14px" }}>Triaged Incidents</th>
                <th style={{ padding: "10px 14px" }}>Mean TTA</th>
                <th style={{ padding: "10px 14px" }}>Mean TTR</th>
                <th style={{ padding: "10px 14px" }}>RCA Accuracy</th>
                <th style={{ padding: "10px 14px" }}>Active Queue</th>
              </tr>
            </thead>
            <tbody>
              {teamPerformance.map((tp) => (
                <tr
                  key={tp.team}
                  style={{
                    borderBottom: "1px solid var(--border-subtle)",
                    transition: "background 0.15s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--ink-primary)" }}>{tp.team}</td>
                  <td style={{ padding: "12px 14px", color: "var(--ink-secondary)", fontSize: "12px" }}>{tp.lead}</td>
                  <td style={{ padding: "12px 14px", color: "var(--ink-secondary)" }}>{tp.incidents}</td>
                  <td style={{ padding: "12px 14px", fontFamily: "'JetBrains Mono', monospace", color: "var(--accent-teal)" }}>{tp.mtta}</td>
                  <td style={{ padding: "12px 14px", fontFamily: "'JetBrains Mono', monospace", color: "var(--accent-violet)" }}>{tp.mttr}</td>
                  <td style={{ padding: "12px 14px", color: "var(--accent-teal)", fontWeight: 700 }}>{tp.rcaAccuracy}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span className={`badge ${tp.openTickets > 0 ? "badge-rose" : "badge-teal"}`}>
                      {tp.openTickets} active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

