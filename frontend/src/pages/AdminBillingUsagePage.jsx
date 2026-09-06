import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Sliders,
  TrendingUp,
  DollarSign,
  Cpu,
  Layers,
  Zap,
  CheckCircle2,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Search,
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  X,
  Settings2,
  BarChart3,
  Database,
  Activity,
  Copy,
  Check,
  ArrowUpDown,
  FileText,
  Eye,
  Info,
  ExternalLink,
  Clock
} from "lucide-react";
import {
  fetchAdminBillingUsage,
  fetchAdminBillingInvocations,
  fetchAdminBillingInvocationDetail,
  updateAdminBillingBudget,
  getAdminBillingExportUrl
} from "../api/client";

/**
 * Formats timestamps according to the client user's active system clock and timezone.
 * Uses the browser's Intl.DateTimeFormat with undefined locale/tz to automatically align
 * with the operating system environment (e.g. America/Chicago, CDT, 12-hour/24-hour preference).
 */
export function formatSystemTime(dateInput, formatType = "full") {
  if (!dateInput || dateInput === "—") return "—";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  if (formatType === "relative") {
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 0 && diffSec > -15) return "just now";
    if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(d);
  }

  if (formatType === "compact") {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(d);
  }

  if (formatType === "time-only") {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(d);
  }

  if (formatType === "date-only") {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  }

  // "full" format includes the short timezone abbreviation (e.g. CDT, EST, PST)
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "short"
  }).format(d);
}

export function getProjectBadgeStyle(key) {
  return {
    background: "rgba(139, 92, 246, 0.12)",
    color: "var(--accent-violet)",
    border: "1px solid rgba(139, 92, 246, 0.28)"
  };
}

export function getStageBadgeStyle(stage) {
  const s = String(stage || "").toLowerCase();
  if (s === "reasoning") {
    return {
      background: "rgba(236, 72, 153, 0.12)",
      color: "var(--prism-pink)",
      border: "1px solid rgba(236, 72, 153, 0.28)"
    };
  }
  if (s === "planning") {
    return {
      background: "rgba(20, 184, 166, 0.12)",
      color: "var(--accent-teal)",
      border: "1px solid rgba(20, 184, 166, 0.28)"
    };
  }
  if (s === "response") {
    return {
      background: "rgba(139, 92, 246, 0.12)",
      color: "var(--accent-violet)",
      border: "1px solid rgba(139, 92, 246, 0.28)"
    };
  }
  if (s === "understanding") {
    return {
      background: "rgba(245, 158, 11, 0.12)",
      color: "var(--accent-amber)",
      border: "1px solid rgba(245, 158, 11, 0.28)"
    };
  }
  return {
    background: "var(--bg-elevated)",
    color: "var(--ink-secondary)",
    border: "1px solid var(--border-subtle)"
  };
}

class BillingErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("CRITICAL BILLING PAGE ERROR:", error, errorInfo);
    this.setState({ error, errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "32px", color: "#ef4444", background: "#1e1e2e", fontFamily: "monospace", borderRadius: "12px", margin: "24px" }}>
          <h2 style={{ color: "#f87171", fontSize: "18px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={18} color="#f87171" /> Billing Page Render Crash Detected:
          </h2>
          <div style={{ background: "rgba(0,0,0,0.5)", padding: "16px", borderRadius: "8px", overflowX: "auto" }}>
            <p style={{ fontWeight: 700, fontSize: "14px", color: "#fbbf24" }}>{String(this.state.error?.message || this.state.error)}</p>
            <pre style={{ fontSize: "12px", color: "#94a3b8", marginTop: "8px", whiteSpace: "pre-wrap" }}>{this.state.error?.stack}</pre>
            <pre style={{ fontSize: "11px", color: "#cbd5e1", marginTop: "8px", whiteSpace: "pre-wrap" }}>{this.state.errorInfo?.componentStack}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AdminBillingUsagePage() {
  return (
    <BillingErrorBoundary>
      <AdminBillingUsagePageContent />
    </BillingErrorBoundary>
  );
}

function AdminBillingUsagePageContent() {
  const [usage, setUsage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Last synced state uses the timestamp returned by the current browser locale.
  const [lastSyncedAt, setLastSyncedAt] = useState(() => new Date());

  // Live system date string (YYYY-MM-DD) for highlighting current day in graphs
  const todayDateStr = useMemo(() => {
    const d = lastSyncedAt || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, [lastSyncedAt]);

  // Budget Modal State
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetCapInput, setBudgetCapInput] = useState(500);
  const [alertThresholdInput, setAlertThresholdInput] = useState(80);
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Paginated & Managed Audit Ledger State
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerLimit, setLedgerLimit] = useState(10);
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerProjectFilter, setLedgerProjectFilter] = useState("all");
  const [ledgerStageFilter, setLedgerStageFilter] = useState("all");
  const [ledgerModelFilter, setLedgerModelFilter] = useState("all");
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState("all");
  const [ledgerSortBy, setLedgerSortBy] = useState("created_at");
  const [ledgerSortDir, setLedgerSortDir] = useState("desc");
  const [ledgerData, setLedgerData] = useState(null);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);

  // Detail Modal State
  const [selectedInvocation, setSelectedInvocation] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [copiedField, setCopiedField] = useState("");

  // Interactive Graphs State
  const [timelineMetric, setTimelineMetric] = useState("cost"); // "cost" | "tokens" | "cumulative"
  const [hoveredTimelineIdx, setHoveredTimelineIdx] = useState(null);
  const [hoveredDonutIdx, setHoveredDonutIdx] = useState(null);
  const [hoveredBubbleId, setHoveredBubbleId] = useState(null);

  const loadData = (projId = selectedProjectId, per = selectedPeriod) => {
    setIsRefreshing(true);
    fetchAdminBillingUsage({ projectId: projId, period: per })
      .then((data) => {
        if (data) {
          setUsage(data);
          if (data.budgetLimitRaw) setBudgetCapInput(data.budgetLimitRaw);
          if (data.alertThresholdPct) setAlertThresholdInput(data.alertThresholdPct);
        }
      })
      .catch((err) => console.warn("Failed to load billing usage:", err))
      .finally(() => {
        setIsLoading(false);
        setIsRefreshing(false);
        setLastSyncedAt(new Date());
      });
  };

  useEffect(() => {
    loadData(selectedProjectId, selectedPeriod);
  }, [selectedProjectId, selectedPeriod]);

  // Load Paginated Audit Ledger from PostgreSQL
  const loadLedger = useCallback(
    (
      page = ledgerPage,
      limit = ledgerLimit,
      search = ledgerSearch,
      proj = ledgerProjectFilter,
      stg = ledgerStageFilter,
      mod = ledgerModelFilter,
      stat = ledgerStatusFilter,
      sBy = ledgerSortBy,
      sDir = ledgerSortDir,
      per = selectedPeriod
    ) => {
      setIsLedgerLoading(true);
      fetchAdminBillingInvocations({
        page,
        limit,
        search,
        projectId: proj,
        stage: stg,
        modelId: mod,
        status: stat,
        sortBy: sBy,
        sortDir: sDir,
        period: per,
      })
        .then((data) => {
          if (data) {
            setLedgerData(data);
          }
        })
        .catch((err) => console.warn("Failed to load invocations ledger:", err))
        .finally(() => {
          setIsLedgerLoading(false);
          setLastSyncedAt(new Date());
        });
    },
    [
      ledgerPage,
      ledgerLimit,
      ledgerSearch,
      ledgerProjectFilter,
      ledgerStageFilter,
      ledgerModelFilter,
      ledgerStatusFilter,
      ledgerSortBy,
      ledgerSortDir,
      selectedPeriod,
    ]
  );

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const handleOpenDetail = (invId) => {
    setIsLoadingDetail(true);
    setIsDetailModalOpen(true);
    fetchAdminBillingInvocationDetail(invId)
      .then((data) => setSelectedInvocation(data))
      .catch((err) => console.error("Failed to load invocation detail:", err))
      .finally(() => setIsLoadingDetail(false));
  };

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 1800);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    setIsSavingBudget(true);
    try {
      await updateAdminBillingBudget({
        monthly_budget_usd: parseFloat(budgetCapInput),
        alert_threshold_pct: parseFloat(alertThresholdInput),
        currency: "USD"
      });
      setSaveSuccessMsg("Budget limit updated successfully!");
      setTimeout(() => {
        setSaveSuccessMsg("");
        setIsBudgetModalOpen(false);
      }, 1000);
      loadData(selectedProjectId, selectedPeriod);
    } catch (err) {
      console.error("Failed to update budget:", err);
    } finally {
      setIsSavingBudget(false);
    }
  };

  const projectBreakdown = usage?.projectBreakdown || [];
  const projectModelUsage = usage?.projectModelUsage || [];
  const modelBreakdown = usage?.modelBreakdown || [];
  const dailyTimeline = usage?.dailyTimeline || [];
  const stageBreakdown = usage?.stageBreakdown || [];
  const modelEfficiency = usage?.modelEfficiency || [];

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
            <Sliders size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                PLATFORM ADMIN • GOVERNANCE & TELEMETRY
              </span>
              <span className="badge badge-teal">Enterprise Tier Active</span>
              <span className="badge badge-magenta">Monthly Budget Governed</span>
              <span
                className="badge"
                style={{
                  background: "rgba(34, 197, 94, 0.12)",
                  color: "var(--accent-emerald)",
                  border: "1px solid rgba(34, 197, 94, 0.28)",
                  fontWeight: 600,
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                <Database size={11} />
                Live PostgreSQL Telemetry
              </span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Platform Usage & Billing Telemetry
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Track authentic LLM token consumption, inference compute charges, and project-wise model utilization.
            </p>
          </div>
        </div>

        {/* Executive Right Controls: Live System Clock & Action Group */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          {/* Dedicated System Clock & Sync Widget */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              padding: "8px 14px",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
            }}
            title="All telemetry and audit timestamps across this page synchronize directly with your local system clock and timezone"
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ fontSize: "10px", color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                Synced
              </span>
              <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--accent-teal)", fontFamily: "monospace", marginTop: "1px" }}>
                {formatSystemTime(lastSyncedAt, "time-only")}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              className="prism-button"
              onClick={() => loadData(selectedProjectId, selectedPeriod)}
              disabled={isRefreshing}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                padding: "7px 13px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              <RefreshCw size={13} className={isRefreshing ? "spin-animation" : ""} />
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </button>

            <a
              href={getAdminBillingExportUrl({ projectId: selectedProjectId, period: selectedPeriod })}
              download
              className="prism-button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                padding: "7px 13px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                textDecoration: "none",
                color: "var(--ink-primary)",
                fontWeight: 600
              }}
            >
              <Download size={13} /> Export CSV
            </a>

            <button
              className="prism-button prism-button-primary"
              onClick={() => setIsBudgetModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                padding: "7px 15px",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <Settings2 size={13} /> Configure Budget
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Period Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          background: "var(--bg-card)",
          padding: "10px 18px",
          borderRadius: "12px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
        }}
      >
        {/* Project Selector Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", marginRight: "2px", display: "flex", alignItems: "center", gap: "5px" }}>
            <Filter size={12} /> Project Scope:
          </span>
          <button
            onClick={() => setSelectedProjectId("all")}
            style={{
              padding: "5px 12px",
              borderRadius: "7px",
              fontSize: "11.5px",
              fontWeight: 700,
              cursor: "pointer",
              border: selectedProjectId === "all" ? "1px solid var(--prism-pink)" : "1px solid var(--border-subtle)",
              background: selectedProjectId === "all" ? "var(--prism-pink)" : "var(--bg-elevated)",
              color: selectedProjectId === "all" ? "#fff" : "var(--ink-secondary)",
              boxShadow: selectedProjectId === "all" ? "0 2px 8px rgba(236, 72, 153, 0.25)" : "none",
              transition: "all 0.15s ease"
            }}
          >
            All Projects (Fleet)
          </button>

          {projectBreakdown.map((p) => {
            const isSelected = selectedProjectId === p.project_id || selectedProjectId === p.project_key;
            return (
              <button
                key={p.project_id}
                onClick={() => setSelectedProjectId(p.project_id)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "7px",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: isSelected ? "1px solid var(--accent-teal)" : "1px solid var(--border-subtle)",
                  background: isSelected ? "var(--accent-teal)" : "var(--bg-elevated)",
                  color: isSelected ? "#fff" : "var(--ink-secondary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: isSelected ? "0 2px 8px rgba(20, 184, 166, 0.25)" : "none",
                  transition: "all 0.15s ease"
                }}
              >
                <span>{p.project_key}</span>
                <span style={{ fontSize: "10.5px", opacity: isSelected ? 0.9 : 0.65 }}>({p.tokens})</span>
              </button>
            );
          })}
        </div>

        {/* Period Selector Segmented Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Calendar size={12} style={{ color: "var(--ink-tertiary)" }} />
          <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginRight: "2px" }}>
            Period:
          </span>
          <div style={{ display: "flex", background: "var(--bg-input)", padding: "2px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            {[
              { id: "current_month", label: "This Month (Sep 2026)" },
              { id: "last_30_days", label: "Last 30 Days" },
              { id: "all_time", label: "All Time" }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedPeriod(item.id)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: selectedPeriod === item.id ? 700 : 500,
                  cursor: "pointer",
                  border: "none",
                  background: selectedPeriod === item.id ? "var(--bg-elevated)" : "transparent",
                  color: selectedPeriod === item.id ? "var(--ink-primary)" : "var(--ink-tertiary)",
                  boxShadow: selectedPeriod === item.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s ease"
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
        {/* Current Spend */}
        <div className="prism-card" style={{ padding: "18px 20px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Current Spend</div>
            <DollarSign size={16} style={{ color: "var(--prism-pink)" }} />
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--prism-pink)", marginTop: "6px" }}>
            {isLoading ? "…" : (usage?.totalCostUsd || "—")}
          </div>
          <div style={{ marginTop: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--ink-secondary)", marginBottom: "4px" }}>
              <span>Budget Utilized</span>
              <strong>{usage?.budgetUsedPct ?? 0}% of {usage?.budgetLimitUsd}</strong>
            </div>
            <div style={{ height: "5px", borderRadius: "999px", background: "var(--bg-input)", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(usage?.budgetUsedPct || 0, 100)}%`,
                  background: (usage?.budgetUsedPct || 0) > 80 ? "var(--accent-amber)" : "var(--prism-pink)"
                }}
              />
            </div>
          </div>
        </div>

        {/* Total Tokens Processed */}
        <div className="prism-card" style={{ padding: "18px 20px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Total Tokens Processed</div>
            <Cpu size={16} style={{ color: "var(--accent-teal)" }} />
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--ink-primary)", marginTop: "6px" }}>
            {isLoading ? "…" : (usage?.totalTokens || "—")}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "6px", display: "flex", gap: "10px" }}>
            <span>Prompt: <strong style={{ color: "var(--ink-primary)" }}>{Number(usage?.promptTokens || 0).toLocaleString()}</strong></span>
            <span>•</span>
            <span>Completion: <strong style={{ color: "var(--ink-primary)" }}>{Number(usage?.completionTokens || 0).toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Model Invocations & Runs */}
        <div className="prism-card" style={{ padding: "18px 20px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Model Invocations</div>
            <Zap size={16} style={{ color: "var(--accent-amber)" }} />
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--accent-amber)", marginTop: "6px" }}>
            {isLoading ? "…" : (usage?.totalInvocations != null ? Number(usage.totalInvocations).toLocaleString() : "—")}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "6px" }}>
            {usage?.totalRuns ?? 0} agent triage runs • {usage?.avgLatencyMs ?? 0}ms avg latency
          </div>
        </div>

        {/* Tool Broker Calls */}
        <div className="prism-card" style={{ padding: "18px 20px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Tool Broker Executions</div>
            <Layers size={16} style={{ color: "var(--accent-teal)" }} />
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--accent-teal)", marginTop: "6px" }}>
            {usage?.toolBrokerCalls != null ? Number(usage.toolBrokerCalls).toLocaleString() : "—"}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--accent-emerald)", marginTop: "6px" }}>
            $0.00 zero marginal compute charge
          </div>
        </div>

        {/* Projected Month End */}
        <div className="prism-card" style={{ padding: "18px 20px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Projected Month End</div>
            <TrendingUp size={16} style={{ color: "var(--accent-violet)" }} />
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--accent-violet)", marginTop: "6px" }}>
            {isLoading ? "…" : (usage?.projectedMonthEnd || "—")}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "6px" }}>
            Linear run-rate extrapolation
          </div>
        </div>
      </div>

      {/* INTERACTIVE GRAPHS SECTION */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", gap: "18px" }}>
        {/* Graph 1: Interactive Daily Spend & Token Timeline Chart */}
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
          {/* Chart Header & Mode Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)", display: "flex", alignItems: "center", gap: "7px" }}>
                <TrendingUp size={16} style={{ color: "var(--prism-pink)" }} />
                Interactive Telemetry & Burn Trajectory
              </h3>
              <p style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "2px" }}>
                Hover curve for daily token volume, inference cost, and running budget burn.
              </p>
            </div>

            {/* Metric Mode Toggle Segmented Switcher */}
            <div style={{ display: "flex", background: "var(--bg-input)", padding: "2px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              {[
                { id: "cost", label: "Daily Cost ($)" },
                { id: "tokens", label: "Daily Tokens" },
                { id: "cumulative", label: "Cumulative Burn" }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setTimelineMetric(m.id)}
                  style={{
                    padding: "4px 11px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: timelineMetric === m.id ? 700 : 500,
                    cursor: "pointer",
                    border: "none",
                    background: timelineMetric === m.id ? "var(--bg-elevated)" : "transparent",
                    color: timelineMetric === m.id ? "var(--ink-primary)" : "var(--ink-tertiary)",
                    boxShadow: timelineMetric === m.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s ease"
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Area / Line Canvas */}
          <div style={{ position: "relative", width: "100%", height: "200px" }}>
            {dailyTimeline.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--ink-tertiary)", fontSize: "12px" }}>
                {isLoading ? "Rendering live telemetry timeline…" : "No timeline data in current period."}
              </div>
            ) : (
              (() => {
                const svgW = 600;
                const svgH = 190;
                const padL = 40;
                const padR = 25;
                const padT = 20;
                const padB = 30;

                // Determine values based on active mode
                const values = dailyTimeline.map((d) => {
                  if (timelineMetric === "cost") return d.cost_usd;
                  if (timelineMetric === "tokens") return d.tokens;
                  return d.cumulative_cost_usd;
                });
                const maxVal = Math.max(...values, timelineMetric === "cost" ? 0.05 : (timelineMetric === "tokens" ? 1000 : 0.05));
                const minVal = 0;

                const getX = (idx) => padL + (idx / Math.max(dailyTimeline.length - 1, 1)) * (svgW - padL - padR);
                const getY = (val) => padT + (1 - (val - minVal) / (maxVal - minVal || 1)) * (svgH - padT - padB);

                const points = dailyTimeline.map((d, i) => ({
                  x: getX(i),
                  y: getY(values[i]),
                  data: d,
                  val: values[i]
                }));

                const pathD = points.length > 0
                  ? points.reduce((acc, p, i) => {
                      if (i === 0) return `M ${p.x} ${p.y}`;
                      // Smooth cubic bezier curve
                      const prev = points[i - 1];
                      const cp1x = prev.x + (p.x - prev.x) / 2;
                      const cp1y = prev.y;
                      const cp2x = prev.x + (p.x - prev.x) / 2;
                      const cp2y = p.y;
                      return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
                    }, "")
                  : "";

                const lastPt = points[points.length - 1];
                const firstPt = points[0];
                const areaD = points.length > 1
                  ? `${pathD} L ${lastPt.x} ${svgH - padB} L ${firstPt.x} ${svgH - padB} Z`
                  : "";

                const activePoint = hoveredTimelineIdx !== null && points[hoveredTimelineIdx]
                  ? points[hoveredTimelineIdx]
                  : null;

                const primaryColor = timelineMetric === "tokens"
                  ? "var(--accent-teal)"
                  : (timelineMetric === "cumulative" ? "var(--accent-violet)" : "var(--prism-pink)");

                return (
                  <>
                    <svg
                      viewBox={`0 0 ${svgW} ${svgH}`}
                      style={{ width: "100%", height: "100%", overflow: "visible" }}
                      onMouseLeave={() => setHoveredTimelineIdx(null)}
                    >
                      <defs>
                        <linearGradient id="timelineGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={timelineMetric === "tokens" ? "#14b8a6" : (timelineMetric === "cumulative" ? "#8b5cf6" : "#ec4899")} stopOpacity="0.35" />
                          <stop offset="100%" stopColor={timelineMetric === "tokens" ? "#14b8a6" : (timelineMetric === "cumulative" ? "#8b5cf6" : "#ec4899")} stopOpacity="0.0" />
                        </linearGradient>
                        <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={timelineMetric === "tokens" ? "#14b8a6" : (timelineMetric === "cumulative" ? "#8b5cf6" : "#ec4899")} floodOpacity="0.6" />
                        </filter>
                      </defs>

                      {/* Horizontal Grid lines */}
                      {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                        const yVal = padT + ratio * (svgH - padT - padB);
                        const labelVal = maxVal * (1 - ratio);
                        return (
                          <g key={idx}>
                            <line
                              x1={padL}
                              y1={yVal}
                              x2={svgW - padR}
                              y2={yVal}
                              stroke="var(--border-subtle)"
                              strokeDasharray="3 3"
                              strokeWidth="0.8"
                            />
                            <text
                              x={padL - 6}
                              y={yVal + 3}
                              fill="var(--ink-tertiary)"
                              fontSize="9"
                              textAnchor="end"
                            >
                              {timelineMetric === "tokens"
                                ? `${(labelVal / 1000).toFixed(0)}k`
                                : `$${labelVal.toFixed(timelineMetric === "cost" ? 3 : 2)}`}
                            </text>
                          </g>
                        );
                      })}

                      {/* Area Fill & Path Line */}
                      {areaD && <path d={areaD} fill="url(#timelineGrad)" />}
                      {pathD && (
                        <path
                          d={pathD}
                          fill="none"
                          stroke={primaryColor}
                          strokeWidth="2.5"
                          filter="url(#glowEffect)"
                          strokeLinecap="round"
                        />
                      )}

                      {/* Active Hover Crosshair Line */}
                      {activePoint && (
                        <line
                          x1={activePoint.x}
                          y1={padT}
                          x2={activePoint.x}
                          y2={svgH - padB}
                          stroke={primaryColor}
                          strokeWidth="1.2"
                          strokeDasharray="2 2"
                        />
                      )}

                      {/* Interactive Hover Circles and Hit Areas */}
                      {points.map((p, idx) => (
                        <g key={idx}>
                          {/* Visible point */}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={hoveredTimelineIdx === idx ? 6 : 3.5}
                            fill={hoveredTimelineIdx === idx ? "#fff" : primaryColor}
                            stroke={primaryColor}
                            strokeWidth={hoveredTimelineIdx === idx ? 3 : 1.5}
                            style={{ transition: "all 0.15s ease", cursor: "pointer" }}
                          />
                          {/* X-axis date label */}
                          <text
                            x={p.x}
                            y={svgH - 10}
                            fill={hoveredTimelineIdx === idx ? "var(--ink-primary)" : "var(--ink-tertiary)"}
                            fontSize="9.5"
                            fontWeight={hoveredTimelineIdx === idx ? 700 : 500}
                            textAnchor="middle"
                          >
                            {p.data.date === todayDateStr
                              ? `${p.data.label} (Today)`
                              : p.data.label}
                          </text>
                          {/* Invisible wide hit target for smooth mouse interaction */}
                          <rect
                            x={p.x - (svgW / points.length) / 2}
                            y={0}
                            width={svgW / points.length}
                            height={svgH}
                            fill="transparent"
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() => setHoveredTimelineIdx(idx)}
                          />
                        </g>
                      ))}
                    </svg>

                    {/* Interactive Tooltip Card */}
                    {activePoint && (
                      <div
                        style={{
                          position: "absolute",
                          left: `${Math.min(Math.max((activePoint.x / svgW) * 100, 15), 85)}%`,
                          top: `${Math.max((activePoint.y / svgH) * 100 - 35, 10)}%`,
                          transform: "translate(-50%, -100%)",
                          background: "var(--bg-elevated)",
                          border: `1px solid ${primaryColor}`,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          pointerEvents: "none",
                          zIndex: 20,
                          minWidth: "160px",
                          whiteSpace: "nowrap"
                        }}
                      >
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-tertiary)", marginBottom: "4px" }}>
                          {activePoint.data.date} • {activePoint.data.label}
                          {activePoint.data.date === todayDateStr
                            ? " (Today • Live Telemetry)"
                            : ""}
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                          <span style={{ fontSize: "16px", fontWeight: 800, color: primaryColor }}>
                            {timelineMetric === "tokens"
                              ? `${activePoint.data.tokens.toLocaleString()} tokens`
                              : (timelineMetric === "cumulative" ? `$${activePoint.data.cumulative_cost_usd.toFixed(4)}` : `$${activePoint.data.cost_usd.toFixed(4)}`)}
                          </span>
                        </div>
                        <div style={{ fontSize: "10.5px", color: "var(--ink-secondary)", marginTop: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
                          <div>Prompt: {activePoint.data.prompt_tokens.toLocaleString()} • Out: {activePoint.data.completion_tokens.toLocaleString()}</div>
                          <div>Invocations: <strong>{activePoint.data.invocations} calls</strong> • Runs: <strong>{activePoint.data.runs}</strong></div>
                          {timelineMetric === "cumulative" && (
                            <div style={{ color: "var(--accent-teal)", fontWeight: 600, marginTop: "2px" }}>
                              Cumulative Tokens: {activePoint.data.cumulative_tokens.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        </div>

        {/* Graph 2: Interactive Model Fleet Donut / Radial Breakdown */}
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)", display: "flex", alignItems: "center", gap: "7px" }}>
                <Cpu size={16} style={{ color: "var(--accent-teal)" }} />
                Interactive Model Fleet Share
              </h3>
              <p style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "2px" }}>
                Hover arc segments to inspect per-model cost share and token throughput.
              </p>
            </div>
            <span className="badge badge-teal">{modelBreakdown.length} Active Models</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: "16px", minHeight: "200px" }}>
            {/* SVG Donut */}
            <div style={{ position: "relative", width: "170px", height: "170px", flexShrink: 0 }}>
              {(() => {
                const totalCost = modelBreakdown.reduce((sum, m) => sum + (m.cost_raw || 0), 0) || 1.0;
                let currentAngle = -90; // Start at 12 o'clock

                const slices = modelBreakdown.map((m, idx) => {
                  const share = (m.cost_raw || 0) / totalCost;
                  const angle = share * 360;
                  const startA = currentAngle;
                  const endA = currentAngle + angle;
                  currentAngle = endA;

                  const radius = 70;
                  const innerRadius = 46;
                  const isHovered = hoveredDonutIdx === idx;

                  // Coordinates
                  const rad = (deg) => (deg * Math.PI) / 180;
                  const x1 = 85 + radius * Math.cos(rad(startA));
                  const y1 = 85 + radius * Math.sin(rad(startA));
                  const x2 = 85 + radius * Math.cos(rad(endA - 0.5));
                  const y2 = 85 + radius * Math.sin(rad(endA - 0.5));

                  const ix1 = 85 + innerRadius * Math.cos(rad(endA - 0.5));
                  const iy1 = 85 + innerRadius * Math.sin(rad(endA - 0.5));
                  const ix2 = 85 + innerRadius * Math.cos(rad(startA));
                  const iy2 = 85 + innerRadius * Math.sin(rad(startA));

                  const largeArc = angle > 180 ? 1 : 0;
                  const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;

                  return {
                    ...m,
                    idx,
                    pathData,
                    isHovered
                  };
                });

                const activeModel = hoveredDonutIdx !== null && modelBreakdown[hoveredDonutIdx]
                  ? modelBreakdown[hoveredDonutIdx]
                  : modelBreakdown[0];

                return (
                  <>
                    <svg viewBox="0 0 170 170" style={{ width: "100%", height: "100%" }}>
                      {slices.map((s, sIdx) => (
                        <path
                          key={`${s.model_id}-${sIdx}`}
                          d={s.pathData}
                          fill={s.color || "var(--prism-pink)"}
                          opacity={s.isHovered ? 1.0 : (hoveredDonutIdx !== null ? 0.4 : 0.88)}
                          style={{
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            transformOrigin: "85px 85px",
                            transform: s.isHovered ? "scale(1.04)" : "scale(1)"
                          }}
                          onMouseEnter={() => setHoveredDonutIdx(s.idx)}
                          onMouseLeave={() => setHoveredDonutIdx(null)}
                        />
                      ))}
                    </svg>

                    {/* Donut Center Readout */}
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        textAlign: "center",
                        pointerEvents: "none",
                        width: "80px"
                      }}
                    >
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink-primary)" }}>
                        {activeModel ? `${activeModel.sharePct}%` : "100%"}
                      </div>
                      <div style={{ fontSize: "9.5px", color: "var(--ink-tertiary)", lineHeight: 1.1, marginTop: "2px" }}>
                        {activeModel ? activeModel.model : "All Models"}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Interactive Model Legend Table */}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1, minWidth: "240px" }}>
              {/* Table Header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 62px 46px", padding: "4px 8px", fontSize: "10px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border-subtle)", marginBottom: "3px" }}>
                <span>Model</span>
                <span style={{ textAlign: "right" }}>Tokens</span>
                <span style={{ textAlign: "right" }}>Spend</span>
                <span style={{ textAlign: "right" }}>Share</span>
              </div>
              {modelBreakdown.map((m, idx) => {
                const isHov = hoveredDonutIdx === idx;
                return (
                  <div
                    key={`${m.model_id}-${idx}`}
                    onMouseEnter={() => setHoveredDonutIdx(idx)}
                    onMouseLeave={() => setHoveredDonutIdx(null)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 50px 62px 46px",
                      alignItems: "center",
                      padding: "5px 8px",
                      borderRadius: "6px",
                      background: isHov ? "var(--bg-elevated)" : "transparent",
                      border: isHov ? "1px solid var(--border-subtle)" : "1px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", overflow: "hidden" }}>
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: m.color || "var(--prism-pink)",
                          flexShrink: 0
                        }}
                      />
                      <span style={{ fontSize: "11.5px", fontWeight: isHov ? 700 : 500, color: isHov ? "var(--ink-primary)" : "var(--ink-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.model}
                      </span>
                    </div>

                    <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", textAlign: "right" }}>
                      {m.tokens}
                    </span>

                    <strong style={{ fontSize: "11.5px", color: m.color || "var(--prism-pink)", textAlign: "right" }}>
                      {m.cost}
                    </strong>

                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-secondary)", textAlign: "right" }}>
                      {m.sharePct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SECOND GRAPH ROW: Speed vs Cost Efficiency Matrix & Pipeline Stage Allocation */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", gap: "18px" }}>
        {/* Graph 3: Interactive Speed vs Cost Efficiency Bubble Chart */}
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)", display: "flex", alignItems: "center", gap: "7px" }}>
                <Activity size={16} style={{ color: "var(--accent-violet)" }} />
                Model Inference Efficiency (Speed vs Cost)
              </h3>
              <p style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "2px" }}>
                X-Axis: Average Latency (ms) • Y-Axis: Cost per 1K Tokens ($) • Bubble Size: Token Volume
              </p>
            </div>
            <span className="badge badge-magenta">Pareto Optimal</span>
          </div>

          <div style={{ position: "relative", width: "100%", height: "200px" }}>
            {modelEfficiency.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--ink-tertiary)", fontSize: "12px" }}>
                No model efficiency telemetry available.
              </div>
            ) : (
              (() => {
                const svgW = 550;
                const svgH = 190;
                const padL = 50;
                const padR = 40;
                const padT = 20;
                const padB = 35;

                const maxLat = Math.max(...modelEfficiency.map((m) => m.avg_latency_ms), 650);
                const maxCost = Math.max(...modelEfficiency.map((m) => m.cost_per_1k), 0.006);
                const maxTokens = Math.max(...modelEfficiency.map((m) => m.total_tokens), 1000);

                const getX = (lat) => padL + (lat / (maxLat || 1)) * (svgW - padL - padR);
                const getY = (cst) => padT + (1 - (cst / (maxCost || 1))) * (svgH - padT - padB);
                const getRadius = (tok) => 6 + Math.sqrt(tok / (maxTokens || 1)) * 14;

                const activeBubble = hoveredBubbleId
                  ? modelEfficiency.find((m) => m.model_id === hoveredBubbleId)
                  : null;

                return (
                  <>
                    <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", height: "100%", overflow: "visible" }}>
                      {/* Grid & Axis Guides */}
                      {[0, 0.5, 1].map((r, i) => {
                        const yPos = padT + r * (svgH - padT - padB);
                        const cstVal = maxCost * (1 - r);
                        return (
                          <g key={i}>
                            <line x1={padL} y1={yPos} x2={svgW - padR} y2={yPos} stroke="var(--border-subtle)" strokeDasharray="3 3" />
                            <text x={padL - 6} y={yPos + 3} fill="var(--ink-tertiary)" fontSize="9" textAnchor="end">
                              ${cstVal.toFixed(4)}
                            </text>
                          </g>
                        );
                      })}

                      {[0, 200, 400, 600].map((lat, i) => {
                        if (lat > maxLat) return null;
                        const xPos = getX(lat);
                        return (
                          <g key={i}>
                            <line x1={xPos} y1={padT} x2={xPos} y2={svgH - padB} stroke="var(--border-subtle)" strokeDasharray="3 3" opacity="0.4" />
                            <text x={xPos} y={svgH - padB + 14} fill="var(--ink-tertiary)" fontSize="9" textAnchor="middle">
                              {lat}ms
                            </text>
                          </g>
                        );
                      })}

                      {/* Bubbles with Collision-Free Staggered Halo Labels */}
                      {modelEfficiency.map((m, mIdx) => {
                        const cx = getX(m.avg_latency_ms);
                        const cy = getY(m.cost_per_1k);
                        const r = getRadius(m.total_tokens);
                        const isHov = hoveredBubbleId === m.model_id;

                        // Strategic label positioning per model to eliminate text collisions
                        let labelX = cx;
                        let labelY = cy - r - 6;
                        let textAnchor = "middle";

                        const mid = (m.model_id || "").toLowerCase();
                        if (mid.includes("flash")) {
                          labelX = cx - r - 6;
                          labelY = cy + 4;
                          textAnchor = "end";
                        } else if (mid.includes("mini")) {
                          labelX = cx + r + 6;
                          labelY = cy + 4;
                          textAnchor = "start";
                        } else if (mid.includes("pro") || mid.includes("sonnet")) {
                          labelX = cx;
                          labelY = cy - r - 8;
                          textAnchor = "middle";
                        } else {
                          labelX = cx;
                          labelY = cy + r + 14;
                          textAnchor = "middle";
                        }

                        return (
                          <g
                            key={`${m.model_id}-${mIdx}`}
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() => setHoveredBubbleId(m.model_id)}
                            onMouseLeave={() => setHoveredBubbleId(null)}
                          >
                            <circle
                              cx={cx}
                              cy={cy}
                              r={r}
                              fill={m.color || "var(--prism-pink)"}
                              opacity={isHov ? 0.95 : 0.65}
                              stroke={isHov ? "#fff" : (m.color || "var(--prism-pink)")}
                              strokeWidth={isHov ? 2.5 : 1.2}
                              style={{ transition: "all 0.2s ease" }}
                            />
                            {/* Halo outlined label text for high-contrast readability */}
                            <text
                              x={labelX}
                              y={labelY}
                              fill={isHov ? "var(--ink-primary)" : "var(--ink-secondary)"}
                              fontSize={isHov ? "10.5" : "9.5"}
                              fontWeight={isHov ? 800 : 600}
                              textAnchor={textAnchor}
                              style={{
                                pointerEvents: "none",
                                paintOrder: "stroke fill",
                                stroke: "var(--bg-card)",
                                strokeWidth: "3px",
                                strokeLinejoin: "round",
                                transition: "all 0.15s ease"
                              }}
                            >
                              {m.name}
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    {/* Tooltip */}
                    {activeBubble && (
                      <div
                        style={{
                          position: "absolute",
                          left: `${Math.min(Math.max((getX(activeBubble.avg_latency_ms) / svgW) * 100, 22), 78)}%`,
                          top: `${Math.max((getY(activeBubble.cost_per_1k) / svgH) * 100 - 20, 10)}%`,
                          transform: "translate(-50%, -100%)",
                          background: "var(--bg-elevated)",
                          border: `1px solid ${activeBubble.color || "var(--prism-pink)"}`,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.65)",
                          padding: "9px 13px",
                          borderRadius: "8px",
                          pointerEvents: "none",
                          zIndex: 30,
                          minWidth: "160px"
                        }}
                      >
                        <strong style={{ fontSize: "12px", color: "var(--ink-primary)" }}>{activeBubble.name}</strong>
                        <div style={{ fontSize: "10.5px", color: "var(--ink-tertiary)" }}>{activeBubble.provider}</div>
                        <div style={{ fontSize: "11px", color: "var(--accent-teal)", marginTop: "4px" }}>
                          Speed: {activeBubble.avg_latency_ms}ms avg latency
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--prism-pink)", fontWeight: 600 }}>
                          Rate: {activeBubble.cost_per_1k_display} per 1k tokens
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--ink-secondary)" }}>
                          Throughput: {activeBubble.total_tokens.toLocaleString()} tokens ({activeBubble.invocations} calls)
                        </div>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        </div>

        {/* Graph 4: Interactive Pipeline Stage Compute Allocation */}
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)", display: "flex", alignItems: "center", gap: "7px" }}>
                <Layers size={16} style={{ color: "var(--accent-amber)" }} />
                Pipeline Stage Compute Allocation
              </h3>
              <p style={{ fontSize: "11.5px", color: "var(--ink-secondary)", marginTop: "2px" }}>
                Breakdown of LLM compute spend across Reasoning (RCA), Planning (DAGs), and Response (Jira/Reports).
              </p>
            </div>
            <span className="badge badge-teal">Autonomous Flow</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", justifyContent: "center", flex: 1 }}>
            {stageBreakdown.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--ink-tertiary)", fontSize: "12px", padding: "20px" }}>
                No stage telemetry recorded.
              </div>
            ) : (
              stageBreakdown.map((stg) => {
                const stageColors = {
                  Reasoning: "var(--prism-pink)",
                  Planning: "var(--accent-teal)",
                  Response: "var(--accent-violet)",
                  Understanding: "var(--accent-amber)"
                };
                const color = stageColors[stg.stage] || "var(--prism-pink)";

                return (
                  <div key={stg.stage} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
                        <strong style={{ color: "var(--ink-primary)" }}>{stg.stage} Stage</strong>
                        <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                          ({stg.invocations} invocations • {stg.avg_latency_ms}ms latency)
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ color: "var(--ink-secondary)" }}>{stg.total_tokens.toLocaleString()} tokens</span>
                        <strong style={{ color: color }}>{stg.cost_display} ({stg.share_pct}%)</strong>
                      </div>
                    </div>

                    <div style={{ height: "7px", borderRadius: "999px", background: "rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.04)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.max(stg.share_pct, 2)}%`, background: color, borderRadius: "999px" }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* CORE FEATURE: Project-Wise Model Usage Breakdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 800, color: "var(--ink-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <BarChart3 size={18} style={{ color: "var(--prism-pink)" }} />
              Project-Wise Model Usage & Compute Allocation
            </h2>
            <p style={{ fontSize: "12.5px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Granular per-project breakdown of active LLM models, pipeline stages, token counts, latency, and inference charges.
            </p>
          </div>

          <span className="badge badge-teal" style={{ fontSize: "11.5px" }}>
            Verified PostgreSQL Telemetry
          </span>
        </div>

        {projectModelUsage.length === 0 ? (
          <div
            className="prism-card"
            style={{
              padding: "40px 20px",
              textAlign: "center",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              color: "var(--ink-tertiary)",
              fontSize: "13px"
            }}
          >
            {isLoading ? "Querying database for project model usage…" : "No model usage recorded for the selected filter."}
          </div>
        ) : (
          projectModelUsage.map((p) => (
            <div
              key={p.project_id}
              className="prism-card"
              style={{
                padding: "20px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-card)",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "14px"
              }}
            >
              {/* Project Header Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid var(--border-subtle)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 800,
                      letterSpacing: "0.5px",
                      ...getProjectBadgeStyle(p.project_key)
                    }}
                  >
                    {p.project_key}
                  </span>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
                    {p.project_name}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12.5px" }}>
                  <span style={{ color: "var(--ink-tertiary)" }}>
                    Tokens: <strong style={{ color: "var(--ink-primary)" }}>{Number(p.total_tokens).toLocaleString()}</strong>
                  </span>
                  <span style={{ color: "var(--ink-tertiary)" }}>
                    Invocations: <strong style={{ color: "var(--ink-primary)" }}>{p.total_invocations}</strong>
                  </span>
                  <span style={{ color: "var(--ink-tertiary)" }}>
                    Triage Runs: <strong style={{ color: "var(--ink-primary)" }}>{p.total_runs}</strong>
                  </span>
                  <div
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: "rgba(20, 184, 166, 0.1)",
                      border: "1px solid rgba(20, 184, 166, 0.25)",
                      color: "var(--accent-teal)",
                      fontWeight: 700,
                      fontSize: "13px"
                    }}
                  >
                    Total Spend: {p.total_spend_display}
                  </div>
                </div>
              </div>

              {/* Models Matrix Table */}
              {p.models.length === 0 ? (
                <div style={{ padding: "18px", color: "var(--ink-tertiary)", fontSize: "12px", textAlign: "center" }}>
                  No model calls recorded for this project yet. Invocations from autonomous investigations will appear here automatically.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--ink-tertiary)", textAlign: "left" }}>
                        <th style={{ padding: "8px 12px", fontWeight: 600 }}>MODEL & PROVIDER</th>
                        <th style={{ padding: "8px 12px", fontWeight: 600 }}>STAGES</th>
                        <th style={{ padding: "8px 12px", fontWeight: 600, textAlign: "right" }}>INVOCATIONS</th>
                        <th style={{ padding: "8px 12px", fontWeight: 600, textAlign: "right" }}>PROMPT TOKENS</th>
                        <th style={{ padding: "8px 12px", fontWeight: 600, textAlign: "right" }}>OUTPUT TOKENS</th>
                        <th style={{ padding: "8px 12px", fontWeight: 600, textAlign: "right" }}>TOTAL TOKENS</th>
                        <th style={{ padding: "8px 12px", fontWeight: 600, textAlign: "right" }}>AVG LATENCY</th>
                        <th style={{ padding: "8px 12px", fontWeight: 600, textAlign: "right" }}>COST (USD)</th>
                        <th style={{ padding: "8px 12px", fontWeight: 600, textAlign: "right", width: "140px" }}>SHARE OF PROJECT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.models.map((m, mIdx) => (
                        <tr
                          key={`${p.project_id}-${m.model_id}-${mIdx}`}
                          style={{
                            borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                            transition: "background 0.15s ease"
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          {/* Model & Provider */}
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  background: m.color || "var(--prism-pink)",
                                  flexShrink: 0
                                }}
                              />
                              <div>
                                <strong style={{ color: "var(--ink-primary)" }}>{m.model_name}</strong>
                                <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                                  {m.provider}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Stages */}
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                              {m.stages.map((st) => {
                                const stgStyle = getStageBadgeStyle(st);
                                return (
                                  <span
                                    key={st}
                                    style={{
                                      fontSize: "10.5px",
                                      padding: "2px 7px",
                                      borderRadius: "4px",
                                      fontWeight: 600,
                                      background: stgStyle.background,
                                      border: stgStyle.border,
                                      color: stgStyle.color,
                                      textTransform: "capitalize"
                                    }}
                                  >
                                    {st}
                                  </span>
                                );
                              })}
                            </div>
                          </td>

                          {/* Invocations */}
                          <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: "var(--ink-primary)" }}>
                            {m.invocations.toLocaleString()}
                          </td>

                          {/* Prompt Tokens */}
                          <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--ink-secondary)" }}>
                            {m.prompt_tokens.toLocaleString()}
                          </td>

                          {/* Completion Tokens */}
                          <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--ink-secondary)" }}>
                            {m.completion_tokens.toLocaleString()}
                          </td>

                          {/* Total Tokens */}
                          <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "var(--ink-primary)" }}>
                            {m.total_tokens.toLocaleString()}
                          </td>

                          {/* Latency */}
                          <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--accent-teal)" }}>
                            {m.avg_latency_ms}ms
                          </td>

                          {/* Cost */}
                          <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "var(--prism-pink)" }}>
                            {m.cost_display}
                          </td>

                          {/* Share of Project */}
                          <td style={{ padding: "10px 12px", textAlign: "right" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                              <div style={{ width: "70px", height: "6px", borderRadius: "999px", background: "rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.04)", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${m.share_pct}%`, background: m.color || "var(--prism-pink)", borderRadius: "999px" }} />
                              </div>
                              <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--ink-primary)", minWidth: "40px", fontFamily: "monospace" }}>
                                {m.share_pct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Grid: Global Fleet Allocation & Model Share */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "18px" }}>
        {/* Cost Allocation by Project Fleet */}
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
              Cost Allocation by Project Fleet
            </h3>
            <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)" }}>
              {projectBreakdown.length} active projects
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {projectBreakdown.length === 0 ? (
              <div style={{ color: "var(--ink-tertiary)", fontSize: "12px", textAlign: "center", padding: "20px" }}>
                {isLoading ? "Loading project breakdown…" : "No project cost data yet."}
              </div>
            ) : (
              projectBreakdown.map((p) => (
                <div key={p.project_id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12.5px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ color: "var(--ink-primary)" }}>{p.project_key}</strong>
                      <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)" }}>({p.project_name})</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ color: "var(--ink-tertiary)", fontSize: "11.5px" }}>
                        {p.tokens} tokens • {p.runs} runs
                      </span>
                      <strong style={{ color: p.color || "var(--prism-pink)" }}>
                        {p.spend} ({p.pct}%)
                      </strong>
                    </div>
                  </div>
                  <div style={{ height: "6px", borderRadius: "999px", background: "var(--bg-input)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${p.pct}%`, background: p.color || "var(--prism-pink)" }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Global Model Fleet Distribution */}
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-primary)" }}>
              Fleet-Wide Model Distribution
            </h3>
            <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)" }}>
              {modelBreakdown.length} models invoked
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {modelBreakdown.length === 0 ? (
              <div style={{ color: "var(--ink-tertiary)", fontSize: "12px", textAlign: "center", padding: "20px" }}>
                {isLoading ? "Loading model distribution…" : "No model usage recorded."}
              </div>
            ) : (
              modelBreakdown.map((m) => (
                <div
                  key={m.model_id}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "12px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: m.color || "var(--prism-pink)"
                      }}
                    />
                    <div>
                      <strong style={{ color: "var(--ink-primary)", fontSize: "12.5px" }}>{m.model}</strong>
                      <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                        {m.provider} • {m.avg_latency_ms}ms avg
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: "var(--ink-primary)" }}>{m.cost}</div>
                    <div style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>
                      {m.tokens} tokens ({m.sharePct}%)
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ENTERPRISE MODEL INVOCATION AUDIT LEDGER & MANAGEMENT CENTER */}
      <div
        className="prism-card"
        style={{
          padding: "22px 24px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          borderRadius: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
        }}
      >
        {/* Ledger Header & Quick Stats Bar */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink-primary)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                <Database size={18} style={{ color: "var(--accent-teal)" }} />
                Live Model Invocation Audit Ledger (PostgreSQL)
              </h3>
              <span className="badge badge-teal" style={{ fontSize: "10.5px" }}>
                PostgreSQL Direct Stream
              </span>
              <span className="badge badge-magenta" style={{ fontSize: "10.5px" }}>
                {ledgerData?.total ?? 0} Invocations Logged
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--ink-secondary)", marginTop: "4px" }}>
              Auditable, filterable transaction ledger of every LLM reasoning, planning, and triage step with exact token counts, latencies, and billing costs.
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", background: "var(--bg-input)", padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              <span style={{ color: "var(--ink-tertiary)" }}>Matching Spend:</span>
              <strong style={{ color: "var(--prism-pink)" }}>{ledgerData?.stats?.totalCostDisplay || "$0.00"}</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", background: "var(--bg-input)", padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              <span style={{ color: "var(--ink-tertiary)" }}>Tokens:</span>
              <strong style={{ color: "var(--accent-teal)" }}>{ledgerData?.stats?.totalTokens ? Number(ledgerData.stats.totalTokens).toLocaleString() : 0}</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", background: "var(--bg-input)", padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              <span style={{ color: "var(--ink-tertiary)" }}>Avg Latency:</span>
              <strong style={{ color: "var(--accent-amber)" }}>{ledgerData?.stats?.avgLatencyMs || 0}ms</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", background: "var(--bg-input)", padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              <span style={{ color: "var(--ink-tertiary)" }}>Success Rate:</span>
              <strong style={{ color: "var(--accent-emerald)" }}>{ledgerData?.stats?.successRatePct ?? "Not measured"}%</strong>
            </div>
          </div>
        </div>

        {/* Management Toolbar: Search, Filters, Rows Selector, CSV Export */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            background: "var(--bg-card)",
            padding: "12px 16px",
            borderRadius: "10px",
            border: "1px solid var(--border-card)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
          }}
        >
          {/* Left Controls: Search & Dropdown Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flex: 1 }}>
            {/* Search Input */}
            <div style={{ position: "relative", minWidth: "240px", flex: 1, maxWidth: "340px" }}>
              <Search
                size={14}
                style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "var(--ink-tertiary)", pointerEvents: "none" }}
              />
              <input
                type="text"
                placeholder="Search run ID, incident, model, or project…"
                value={ledgerSearch}
                onChange={(e) => {
                  setLedgerSearch(e.target.value);
                  setLedgerPage(1);
                }}
                style={{
                  width: "100%",
                  padding: "7.5px 30px 7.5px 34px",
                  borderRadius: "6px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-card)",
                  color: "var(--ink-primary)",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  outline: "none",
                  transition: "border-color 0.15s ease"
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--prism-pink)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-card)")}
              />
              {ledgerSearch && (
                <button
                  onClick={() => {
                    setLedgerSearch("");
                    setLedgerPage(1);
                  }}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "var(--ink-tertiary)",
                    cursor: "pointer",
                    padding: "2px"
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Project Filter */}
            <select
              value={ledgerProjectFilter}
              onChange={(e) => {
                setLedgerProjectFilter(e.target.value);
                setLedgerPage(1);
              }}
              style={{
                padding: "7.5px 28px 7.5px 12px",
                borderRadius: "6px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-card)",
                color: "var(--ink-primary)",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                maxWidth: "160px",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%2364748b' height='14' viewBox='0 0 24 24' width='14' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
                outline: "none"
              }}
            >
              <option value="all">All Projects</option>
              {ledgerData?.filterOptions?.projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Stage Filter */}
            <select
              value={ledgerStageFilter}
              onChange={(e) => {
                setLedgerStageFilter(e.target.value);
                setLedgerPage(1);
              }}
              style={{
                padding: "7.5px 28px 7.5px 12px",
                borderRadius: "6px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-card)",
                color: "var(--ink-primary)",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%2364748b' height='14' viewBox='0 0 24 24' width='14' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
                outline: "none"
              }}
            >
              <option value="all">All Stages</option>
              <option value="understanding">Understanding</option>
              <option value="planning">Planning</option>
              <option value="reasoning">Reasoning</option>
              <option value="response">Response</option>
            </select>

            {/* Model Filter */}
            <select
              value={ledgerModelFilter}
              onChange={(e) => {
                setLedgerModelFilter(e.target.value);
                setLedgerPage(1);
              }}
              style={{
                padding: "7.5px 28px 7.5px 12px",
                borderRadius: "6px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-card)",
                color: "var(--ink-primary)",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%2364748b' height='14' viewBox='0 0 24 24' width='14' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
                outline: "none"
              }}
            >
              <option value="all">All Models</option>
              {ledgerData?.filterOptions?.models?.map((m, idx) => (
                <option key={`${m.id}-${idx}`} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={ledgerStatusFilter}
              onChange={(e) => {
                setLedgerStatusFilter(e.target.value);
                setLedgerPage(1);
              }}
              style={{
                padding: "7.5px 28px 7.5px 12px",
                borderRadius: "6px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-card)",
                color: "var(--ink-primary)",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%2364748b' height='14' viewBox='0 0 24 24' width='14' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
                outline: "none"
              }}
            >
              <option value="all">All Statuses</option>
              <option value="SUCCESS">Success Only</option>
              <option value="RATE_LIMITED">Rate Limited (429)</option>
              <option value="TIMED_OUT">Timed Out</option>
            </select>
          </div>

          {/* Right Controls: Rows per page, Export, Refresh */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--ink-secondary)" }}>
              <span>Show:</span>
              <select
                value={ledgerLimit}
                onChange={(e) => {
                  setLedgerLimit(Number(e.target.value));
                  setLedgerPage(1);
                }}
                style={{
                  padding: "5.5px 24px 5.5px 8px",
                  borderRadius: "6px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-card)",
                  color: "var(--ink-primary)",
                  fontSize: "11.5px",
                  fontWeight: 500,
                  cursor: "pointer",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%2364748b' height='12' viewBox='0 0 24 24' width='12' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 6px center",
                  outline: "none"
                }}
              >
                <option value={10}>10 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
              </select>
            </div>

            {/* Export CSV Button */}
            <a
              href={getAdminBillingExportUrl({
                projectId: ledgerProjectFilter,
                period: selectedPeriod,
                search: ledgerSearch,
                stage: ledgerStageFilter,
                modelId: ledgerModelFilter,
                status: ledgerStatusFilter
              })}
              download
              className="btn btn-secondary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                fontSize: "11.5px",
                textDecoration: "none",
                borderRadius: "6px"
              }}
            >
              <Download size={13} />
              Export CSV
            </a>

            {/* Refresh Button */}
            <button
              onClick={() => loadLedger()}
              disabled={isLedgerLoading}
              className="btn btn-secondary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 10px",
                fontSize: "11.5px",
                borderRadius: "6px"
              }}
            >
              <RefreshCw size={13} className={isLedgerLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div style={{ overflowX: "auto", border: "1px solid var(--border-subtle)", borderRadius: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)", color: "var(--ink-tertiary)", textAlign: "left" }}>
                <th
                  onClick={() => {
                    if (ledgerSortBy === "created_at") {
                      setLedgerSortDir(ledgerSortDir === "desc" ? "asc" : "desc");
                    } else {
                      setLedgerSortBy("created_at");
                      setLedgerSortDir("desc");
                    }
                  }}
                  style={{ padding: "10px 12px", fontWeight: 600, cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    TIMESTAMP (SYSTEM)
                    <ArrowUpDown size={11} style={{ opacity: ledgerSortBy === "created_at" ? 1 : 0.4 }} />
                  </div>
                </th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>PROJECT</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>INCIDENT & RUN</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>STAGE</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>RESOLVED MODEL</th>
                <th
                  onClick={() => {
                    if (ledgerSortBy === "total_tokens") {
                      setLedgerSortDir(ledgerSortDir === "desc" ? "asc" : "desc");
                    } else {
                      setLedgerSortBy("total_tokens");
                      setLedgerSortDir("desc");
                    }
                  }}
                  style={{ padding: "10px 12px", fontWeight: 600, textAlign: "right", cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                    TOKENS
                    <ArrowUpDown size={11} style={{ opacity: ledgerSortBy === "total_tokens" ? 1 : 0.4 }} />
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (ledgerSortBy === "latency_ms") {
                      setLedgerSortDir(ledgerSortDir === "desc" ? "asc" : "desc");
                    } else {
                      setLedgerSortBy("latency_ms");
                      setLedgerSortDir("desc");
                    }
                  }}
                  style={{ padding: "10px 12px", fontWeight: 600, textAlign: "right", cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                    LATENCY
                    <ArrowUpDown size={11} style={{ opacity: ledgerSortBy === "latency_ms" ? 1 : 0.4 }} />
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (ledgerSortBy === "cost_usd") {
                      setLedgerSortDir(ledgerSortDir === "desc" ? "asc" : "desc");
                    } else {
                      setLedgerSortBy("cost_usd");
                      setLedgerSortDir("desc");
                    }
                  }}
                  style={{ padding: "10px 12px", fontWeight: 600, textAlign: "right", cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                    COST (USD)
                    <ArrowUpDown size={11} style={{ opacity: ledgerSortBy === "cost_usd" ? 1 : 0.4 }} />
                  </div>
                </th>
                <th style={{ padding: "10px 12px", fontWeight: 600, textAlign: "center" }}>STATUS</th>
                <th style={{ padding: "10px 12px", fontWeight: 600, textAlign: "center" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {isLedgerLoading ? (
                <tr>
                  <td colSpan={10} style={{ padding: "36px", textAlign: "center", color: "var(--ink-secondary)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <RefreshCw size={15} className="animate-spin" style={{ color: "var(--prism-pink)" }} />
                      Querying PostgreSQL audit ledger…
                    </div>
                  </td>
                </tr>
              ) : !ledgerData?.items || ledgerData.items.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: "36px", textAlign: "center", color: "var(--ink-tertiary)" }}>
                    No model invocations match the selected search and filter criteria.
                  </td>
                </tr>
              ) : (
                ledgerData.items.map((inv) => {
                  const stageColors = {
                    Reasoning: "var(--prism-pink)",
                    Planning: "var(--accent-teal)",
                    Response: "var(--accent-violet)",
                    Understanding: "var(--accent-amber)"
                  };
                  const stgColor = stageColors[inv.stage] || "var(--ink-secondary)";

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => handleOpenDetail(inv.id)}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                        cursor: "pointer",
                        transition: "background 0.15s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td
                        style={{ padding: "11px 12px", whiteSpace: "nowrap", fontSize: "11px" }}
                        title={`System Time: ${formatSystemTime(inv.created_at_iso || inv.timestamp, "full")}`}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <div style={{ fontWeight: 600, color: "var(--ink-primary)", fontFamily: "monospace", fontSize: "11px" }}>
                            {formatSystemTime(inv.created_at_iso || inv.timestamp, "compact")}
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--ink-tertiary)", display: "flex", alignItems: "center", gap: "4px" }}>
                            <span
                              style={{
                                display: "inline-block",
                                width: "5px",
                                height: "5px",
                                borderRadius: "50%",
                                background: "var(--accent-emerald)"
                              }}
                            />
                            {formatSystemTime(inv.created_at_iso || inv.timestamp, "relative")}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "5px",
                            fontSize: "10.5px",
                            fontWeight: 800,
                            letterSpacing: "0.5px",
                            ...getProjectBadgeStyle(inv.project_key)
                          }}
                        >
                          {inv.project_key}
                        </span>
                      </td>
                      <td style={{ padding: "11px 12px", maxWidth: "220px" }}>
                        <div style={{ color: "var(--accent-teal)", fontFamily: "monospace", fontSize: "11px", fontWeight: 600 }}>
                          {inv.run_id}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--ink-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }} title={inv.conversation_title}>
                          {inv.conversation_title}
                        </div>
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        {(() => {
                          const stgStyle = getStageBadgeStyle(inv.stage);
                          return (
                            <span
                              style={{
                                padding: "3px 8px",
                                borderRadius: "5px",
                                fontSize: "11px",
                                fontWeight: 600,
                                background: stgStyle.background,
                                color: stgStyle.color,
                                border: stgStyle.border,
                                textTransform: "capitalize"
                              }}
                            >
                              {inv.stage}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: inv.color || "var(--prism-pink)" }} />
                          <strong style={{ color: "var(--ink-primary)", fontSize: "12px" }}>{inv.model_name}</strong>
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--ink-tertiary)", marginLeft: "13px" }}>
                          {inv.provider}
                        </div>
                      </td>
                      <td style={{ padding: "11px 12px", textAlign: "right" }}>
                        <div style={{ color: "var(--ink-primary)", fontWeight: 600 }}>
                          {inv.total_tokens.toLocaleString()}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--ink-tertiary)" }}>
                          {inv.prompt_tokens} in • {inv.completion_tokens} out
                        </div>
                      </td>
                      <td style={{ padding: "11px 12px", textAlign: "right" }}>
                        <span
                          style={{
                            fontWeight: 600,
                            color: inv.latency_ms < 250 ? "var(--accent-teal)" : (inv.latency_ms < 500 ? "var(--accent-amber)" : "var(--accent-violet)")
                          }}
                        >
                          {inv.latency_ms}ms
                        </span>
                      </td>
                      <td style={{ padding: "11px 12px", textAlign: "right", fontWeight: 700, color: "var(--prism-pink)" }}>
                        {inv.cost_display}
                      </td>
                      <td style={{ padding: "11px 12px", textAlign: "center" }}>
                        <span
                          style={{
                            padding: "2px 7px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: 700,
                            background: inv.status === "SUCCESS"
                              ? "rgba(34, 197, 94, 0.12)"
                              : (inv.status === "RATE_LIMITED" ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.15)"),
                            color: inv.status === "SUCCESS"
                              ? "var(--accent-emerald)"
                              : (inv.status === "RATE_LIMITED" ? "var(--accent-amber)" : "var(--accent-rose)")
                          }}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ padding: "11px 12px", textAlign: "center" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(inv.id);
                          }}
                          className="btn btn-secondary"
                          style={{
                            padding: "3px 8px",
                            fontSize: "11px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            borderRadius: "5px"
                          }}
                        >
                          <Eye size={12} />
                          Trace
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Smart Pagination Footer (No Ever Scrolling!) */}
        {ledgerData && ledgerData.total > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              paddingTop: "6px"
            }}
          >
            <div style={{ fontSize: "12px", color: "var(--ink-secondary)" }}>
              Showing <strong>{((ledgerPage - 1) * ledgerLimit) + 1}</strong> to{" "}
              <strong>{Math.min(ledgerPage * ledgerLimit, ledgerData.total)}</strong> of{" "}
              <strong>{ledgerData.total}</strong> model invocations
            </div>

            {/* Page Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <button
                onClick={() => setLedgerPage(1)}
                disabled={ledgerPage === 1}
                className="btn btn-secondary"
                style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "5px", opacity: ledgerPage === 1 ? 0.4 : 1 }}
              >
                « First
              </button>
              <button
                onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                disabled={ledgerPage === 1}
                className="btn btn-secondary"
                style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "5px", display: "flex", alignItems: "center", gap: "3px", opacity: ledgerPage === 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={13} /> Prev
              </button>

              {/* Page Number Chips */}
              {Array.from({ length: Math.min(5, ledgerData.totalPages) }, (_, i) => {
                let pNum = i + 1;
                if (ledgerData.totalPages > 5) {
                  if (ledgerPage > 3 && ledgerPage <= ledgerData.totalPages - 2) {
                    pNum = ledgerPage - 2 + i;
                  } else if (ledgerPage > ledgerData.totalPages - 2) {
                    pNum = ledgerData.totalPages - 4 + i;
                  }
                }
                const isActive = ledgerPage === pNum;
                return (
                  <button
                    key={pNum}
                    onClick={() => setLedgerPage(pNum)}
                    style={{
                      minWidth: "28px",
                      height: "26px",
                      borderRadius: "5px",
                      fontSize: "11.5px",
                      fontWeight: isActive ? 700 : 500,
                      cursor: "pointer",
                      border: "none",
                      background: isActive ? "var(--prism-gradient)" : "var(--bg-input)",
                      color: isActive ? "#fff" : "var(--ink-secondary)",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {pNum}
                  </button>
                );
              })}

              <button
                onClick={() => setLedgerPage((p) => Math.min(ledgerData.totalPages, p + 1))}
                disabled={ledgerPage >= ledgerData.totalPages}
                className="btn btn-secondary"
                style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "5px", display: "flex", alignItems: "center", gap: "3px", opacity: ledgerPage >= ledgerData.totalPages ? 0.4 : 1 }}
              >
                Next <ChevronRight size={13} />
              </button>
              <button
                onClick={() => setLedgerPage(ledgerData.totalPages)}
                disabled={ledgerPage >= ledgerData.totalPages}
                className="btn btn-secondary"
                style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "5px", opacity: ledgerPage >= ledgerData.totalPages ? 0.4 : 1 }}
              >
                Last »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* INVOCATION DEEP TRACE INSPECTION MODAL */}
      {isDetailModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999
          }}
          onClick={() => setIsDetailModalOpen(false)}
        >
          <div
            className="prism-card"
            style={{
              width: "680px",
              maxWidth: "94%",
              maxHeight: "88vh",
              overflowY: "auto",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              padding: "26px",
              borderRadius: "16px",
              boxShadow: "0 14px 45px rgba(0, 0, 0, 0.7)",
              display: "flex",
              flexDirection: "column",
              gap: "18px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "rgba(20, 184, 166, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Cpu size={18} style={{ color: "var(--accent-teal)" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink-primary)", margin: 0 }}>
                    Model Invocation Execution Trace
                  </h3>
                  <div style={{ fontSize: "11.5px", color: "var(--ink-tertiary)", fontFamily: "monospace", marginTop: "2px" }}>
                    ID: {selectedInvocation?.id}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 700,
                    background: selectedInvocation?.status === "SUCCESS" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    color: selectedInvocation?.status === "SUCCESS" ? "var(--accent-emerald)" : "var(--accent-rose)"
                  }}
                >
                  {selectedInvocation?.status}
                </span>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--ink-tertiary)",
                    cursor: "pointer",
                    padding: "4px"
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {isLoadingDetail ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-secondary)" }}>
                <RefreshCw size={20} className="animate-spin" style={{ color: "var(--prism-pink)", margin: "0 auto 10px" }} />
                Loading execution telemetry from PostgreSQL…
              </div>
            ) : selectedInvocation ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* 3 Metrics Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  <div style={{ background: "var(--bg-input)", padding: "12px", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Total Tokens</div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink-primary)", marginTop: "4px" }}>
                      {selectedInvocation.total_tokens.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "10.5px", color: "var(--ink-secondary)", marginTop: "2px" }}>
                      {selectedInvocation.prompt_tokens} prompt • {selectedInvocation.completion_tokens} completion
                    </div>
                  </div>

                  <div style={{ background: "var(--bg-input)", padding: "12px", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Execution Latency</div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--accent-teal)", marginTop: "4px" }}>
                      {selectedInvocation.latency_ms}ms
                    </div>
                    <div style={{ fontSize: "10.5px", color: "var(--ink-secondary)", marginTop: "2px" }}>
                      Model endpoint response time
                    </div>
                  </div>

                  <div style={{ background: "var(--bg-input)", padding: "12px", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", fontWeight: 600 }}>Inference Charge</div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--prism-pink)", marginTop: "4px" }}>
                      {selectedInvocation.cost_display}
                    </div>
                    <div style={{ fontSize: "10.5px", color: "var(--ink-secondary)", marginTop: "2px" }}>
                      {selectedInvocation.pricing_formula}
                    </div>
                  </div>
                </div>

                {/* SRE Pipeline Stage & Description */}
                <div style={{ background: "var(--bg-app)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="badge badge-teal">{selectedInvocation.stage} Stage</span>
                    <span style={{ fontSize: "11.5px", color: "var(--ink-tertiary)" }}>
                      Alias: <code style={{ color: "var(--accent-violet)" }}>{selectedInvocation.model_alias}</code>
                    </span>
                  </div>
                  <p style={{ fontSize: "12.5px", color: "var(--ink-primary)", marginTop: "8px", lineHeight: "1.5" }}>
                    {selectedInvocation.stage_description}
                  </p>
                </div>

                {/* Incident & Run Execution Context */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
                  <div style={{ fontWeight: 700, color: "var(--ink-tertiary)" }}>INCIDENT CONTEXT</div>
                  <div style={{ background: "var(--bg-input)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--ink-secondary)" }}>Incident Title:</span>
                      <strong style={{ color: "var(--ink-primary)" }}>{selectedInvocation.conversation_title}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--ink-secondary)" }}>Project:</span>
                      <span style={{ color: "var(--ink-primary)", fontWeight: 600 }}>
                        {selectedInvocation.project_key} ({selectedInvocation.project_name})
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--ink-secondary)" }}>Environment & Profile:</span>
                      <span style={{ color: "var(--accent-teal)" }}>
                        {selectedInvocation.environment} • {selectedInvocation.profile_id}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--ink-secondary)" }}>Run ID:</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <code style={{ fontFamily: "monospace", color: "var(--accent-violet)" }}>{selectedInvocation.run_id}</code>
                        <button
                          onClick={() => handleCopy(selectedInvocation.run_id, "run_id")}
                          className="btn btn-secondary"
                          style={{ padding: "2px 5px", fontSize: "10px" }}
                        >
                          {copiedField === "run_id" ? <Check size={11} style={{ color: "var(--accent-emerald)" }} /> : <Copy size={11} />}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--ink-secondary)" }}>Timestamp (System Time):</span>
                      <span style={{ color: "var(--ink-primary)", fontWeight: 600, fontFamily: "monospace", fontSize: "11.5px" }}>
                        {formatSystemTime(selectedInvocation.created_at_iso || selectedInvocation.created_at, "full")}
                      </span>
                    </div>
                    {selectedInvocation.run_started_at && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "var(--ink-secondary)" }}>Run Execution Window:</span>
                        <span style={{ color: "var(--accent-teal)", fontFamily: "monospace", fontSize: "11px" }}>
                          {formatSystemTime(selectedInvocation.run_started_at, "compact")} → {formatSystemTime(selectedInvocation.run_completed_at, "time-only")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error diagnostics if any */}
                {selectedInvocation.error_message && (
                  <div style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.4)", borderRadius: "8px", padding: "12px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <AlertTriangle size={16} style={{ color: "var(--accent-rose)", flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent-rose)" }}>
                        Execution Warning / Failure Log
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--ink-primary)", marginTop: "4px", lineHeight: "1.4" }}>
                        {selectedInvocation.error_message}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick action buttons */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
                  <button
                    onClick={() => {
                      setLedgerModelFilter(selectedInvocation.model_id);
                      setLedgerPage(1);
                      setIsDetailModalOpen(false);
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: "11.5px", padding: "6px 12px" }}
                  >
                    Filter by {selectedInvocation.model_name}
                  </button>
                  <button
                    onClick={() => {
                      setLedgerProjectFilter(selectedInvocation.project_id);
                      setLedgerPage(1);
                      setIsDetailModalOpen(false);
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: "11.5px", padding: "6px 12px" }}
                  >
                    Filter by {selectedInvocation.project_key}
                  </button>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="btn btn-primary"
                    style={{ fontSize: "11.5px", padding: "6px 14px" }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Budget Configuration Modal */}
      {isBudgetModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999
          }}
          onClick={() => setIsBudgetModalOpen(false)}
        >
          <div
            className="prism-card"
            style={{
              width: "480px",
              maxWidth: "92%",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              padding: "26px",
              borderRadius: "16px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "rgba(236, 72, 153, 0.15)",
                    color: "var(--prism-pink)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Settings2 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink-primary)", margin: 0 }}>
                    Configure Monthly Budget Cap
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--ink-secondary)", margin: "2px 0 0 0" }}>
                    Policy-governed inference spend threshold
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsBudgetModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--ink-tertiary)",
                  cursor: "pointer",
                  padding: "4px"
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--ink-primary)", marginBottom: "6px" }}>
                  Monthly Spend Limit (USD)
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--ink-tertiary)", fontWeight: 700 }}>
                    $
                  </span>
                  <input
                    type="number"
                    step="50"
                    min="10"
                    value={budgetCapInput}
                    onChange={(e) => setBudgetCapInput(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px 10px 28px",
                      borderRadius: "8px",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--ink-primary)",
                      fontSize: "14px",
                      fontWeight: 700,
                      boxSizing: "border-box"
                    }}
                    required
                  />
                </div>
                <span style={{ fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "4px", display: "block" }}>
                  Governs all project fleets across Google Vertex AI, Anthropic, and OpenAI calls.
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--ink-primary)", marginBottom: "6px" }}>
                  Warning Alert Threshold ({alertThresholdInput}%)
                </label>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={alertThresholdInput}
                  onChange={(e) => setAlertThresholdInput(e.target.value)}
                  style={{ width: "100%", accentColor: "var(--prism-pink)", cursor: "pointer" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "4px" }}>
                  <span>50%</span>
                  <span>75%</span>
                  <span>80% (Default)</span>
                  <span>95%</span>
                </div>
              </div>

              {saveSuccessMsg && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: "rgba(34, 197, 94, 0.15)",
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                    color: "var(--accent-emerald)",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <CheckCircle2 size={14} /> {saveSuccessMsg}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--ink-secondary)",
                    fontSize: "12.5px",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBudget}
                  className="prism-button prism-button-primary"
                  style={{
                    padding: "8px 20px",
                    borderRadius: "8px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {isSavingBudget ? "Saving Policy…" : "Save Policy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
