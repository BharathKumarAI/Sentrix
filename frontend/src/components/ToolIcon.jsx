import React from "react";
import {
  Database,
  Terminal,
  Ticket,
  Shield,
  Activity,
  Zap,
  FileText,
  Network,
  Server,
  Cpu,
  Layers,
  Lock,
  Cloud,
  HardDrive,
  Radio,
  Webhook,
  GitBranch,
  Package,
  Search,
  Globe,
  Sliders,
  Box,
  Key,
  Folder,
  Code,
  CheckCircle2,
  AlertTriangle,
  HelpCircle
} from "lucide-react";

export const AVAILABLE_TOOL_ICONS = [
  { key: "database", label: "Database / SQL", icon: Database, color: "var(--prism-pink, #f43f5e)", category: "Storage" },
  { key: "oracle", label: "Oracle / Enterprise DB", icon: Database, color: "var(--prism-pink, #f43f5e)", category: "Storage" },
  { key: "postgres", label: "PostgreSQL", icon: Database, color: "#38bdf8", category: "Storage" },
  { key: "terminal", label: "Terminal / Unix", icon: Terminal, color: "var(--accent-teal, #14b8a6)", category: "Compute" },
  { key: "unix", label: "Unix / SSH Worker", icon: Terminal, color: "var(--accent-teal, #14b8a6)", category: "Compute" },
  { key: "ticket", label: "Issue / Jira", icon: Ticket, color: "#38bdf8", category: "ITSM" },
  { key: "jira", label: "Jira Enterprise", icon: Ticket, color: "#38bdf8", category: "ITSM" },
  { key: "shield", label: "ServiceNow / Security", icon: Shield, color: "var(--accent-amber, #f59e0b)", category: "ITSM" },
  { key: "servicenow", label: "ServiceNow ITSM", icon: Shield, color: "var(--accent-amber, #f59e0b)", category: "ITSM" },
  { key: "activity", label: "Telemetry / Splunk", icon: Activity, color: "var(--accent-violet, #a855f7)", category: "Observability" },
  { key: "splunk", label: "Splunk Cluster", icon: Activity, color: "var(--accent-violet, #a855f7)", category: "Observability" },
  { key: "signalfx", label: "SignalFx / APM", icon: Activity, color: "#e879f9", category: "Observability" },
  { key: "zap", label: "Kafka Event Bus", icon: Zap, color: "var(--accent-teal, #14b8a6)", category: "Streaming" },
  { key: "kafka", label: "Apache Kafka", icon: Zap, color: "var(--accent-teal, #14b8a6)", category: "Streaming" },
  { key: "file-text", label: "Confluence / Docs", icon: FileText, color: "#c084fc", category: "Knowledge" },
  { key: "confluence", label: "Confluence Wiki", icon: FileText, color: "#c084fc", category: "Knowledge" },
  { key: "network", label: "MCP / Protocol Bus", icon: Network, color: "#ec4899", category: "Protocols" },
  { key: "server", label: "Server Cluster", icon: Server, color: "#94a3b8", category: "Compute" },
  { key: "cpu", label: "Compute Worker", icon: Cpu, color: "#06b6d4", category: "Compute" },
  { key: "cloud", label: "Cloud Provider", icon: Cloud, color: "#38bdf8", category: "Infrastructure" },
  { key: "hard-drive", label: "Storage Volume", icon: HardDrive, color: "#10b981", category: "Storage" },
  { key: "layers", label: "Service Mesh / Layers", icon: Layers, color: "#8b5cf6", category: "Infrastructure" },
  { key: "lock", label: "Secrets / Vault", icon: Lock, color: "#f97316", category: "Security" },
  { key: "webhook", label: "Webhook / Event Receiver", icon: Webhook, color: "#14b8a6", category: "Integration" },
  { key: "git-branch", label: "Git / CI Repository", icon: GitBranch, color: "#f43f5e", category: "DevOps" },
  { key: "code", label: "Custom Code / Lambda", icon: Code, color: "#22c55e", category: "Compute" },
  { key: "globe", label: "Public API Gateway", icon: Globe, color: "#3b82f6", category: "Integration" },
  { key: "sliders", label: "Config Engine", icon: Sliders, color: "#a855f7", category: "Configuration" }
];

const ICON_MAP = {
  database: { component: Database, color: "var(--prism-pink, #f43f5e)" },
  oracle: { component: Database, color: "var(--prism-pink, #f43f5e)" },
  postgres: { component: Database, color: "#38bdf8" },
  "postgres-icon": { component: Database, color: "#38bdf8" },
  terminal: { component: Terminal, color: "var(--accent-teal, #14b8a6)" },
  unix: { component: Terminal, color: "var(--accent-teal, #14b8a6)" },
  ssh: { component: Terminal, color: "var(--accent-teal, #14b8a6)" },
  ticket: { component: Ticket, color: "#38bdf8" },
  jira: { component: Ticket, color: "#38bdf8" },
  "jira-icon": { component: Ticket, color: "#38bdf8" },
  shield: { component: Shield, color: "var(--accent-amber, #f59e0b)" },
  servicenow: { component: Shield, color: "var(--accent-amber, #f59e0b)" },
  activity: { component: Activity, color: "var(--accent-violet, #a855f7)" },
  splunk: { component: Activity, color: "var(--accent-violet, #a855f7)" },
  "splunk-icon": { component: Activity, color: "var(--accent-violet, #a855f7)" },
  signalfx: { component: Activity, color: "#e879f9" },
  datadog: { component: Activity, color: "#a855f7" },
  "datadog-icon": { component: Activity, color: "#a855f7" },
  zap: { component: Zap, color: "var(--accent-teal, #14b8a6)" },
  kafka: { component: Zap, color: "var(--accent-teal, #14b8a6)" },
  "file-text": { component: FileText, color: "#c084fc" },
  filetext: { component: FileText, color: "#c084fc" },
  confluence: { component: FileText, color: "#c084fc" },
  "book-open": { component: FileText, color: "#c084fc" },
  network: { component: Network, color: "#ec4899" },
  mcp: { component: Network, color: "#ec4899" },
  "mcp-icon": { component: Network, color: "#ec4899" },
  server: { component: Server, color: "#94a3b8" },
  cpu: { component: Cpu, color: "#06b6d4" },
  cloud: { component: Cloud, color: "#38bdf8" },
  "hard-drive": { component: HardDrive, color: "#10b981" },
  harddrive: { component: HardDrive, color: "#10b981" },
  layers: { component: Layers, color: "#8b5cf6" },
  lock: { component: Lock, color: "#f97316" },
  radio: { component: Radio, color: "#e11d48" },
  webhook: { component: Webhook, color: "#14b8a6" },
  "git-branch": { component: GitBranch, color: "#f43f5e" },
  gitbranch: { component: GitBranch, color: "#f43f5e" },
  package: { component: Package, color: "#f59e0b" },
  search: { component: Search, color: "#06b6d4" },
  globe: { component: Globe, color: "#3b82f6" },
  sliders: { component: Sliders, color: "#a855f7" },
  box: { component: Box, color: "#64748b" },
  key: { component: Key, color: "#eab308" },
  folder: { component: Folder, color: "#6366f1" },
  code: { component: Code, color: "#22c55e" }
};

export function ToolIcon({
  iconName,
  size = 18,
  color,
  fallbackText = "",
  className = "",
  style = {}
}) {
  const rawKey = (iconName || "").trim();

  // 1. Custom SVG markup support
  if (rawKey.startsWith("<svg") && rawKey.endsWith("</svg>")) {
    return (
      <span
        className={`tool-icon-svg ${className}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          lineHeight: 0,
          ...style
        }}
        dangerouslySetInnerHTML={{ __html: rawKey }}
      />
    );
  }

  // 2. Custom Image URL or path support
  if (
    rawKey.startsWith("http://") ||
    rawKey.startsWith("https://") ||
    rawKey.startsWith("data:image/") ||
    rawKey.startsWith("/")
  ) {
    return (
      <img
        src={rawKey}
        alt={fallbackText || "tool icon"}
        className={`tool-icon-img ${className}`}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          borderRadius: "4px",
          display: "inline-block",
          ...style
        }}
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />
    );
  }

  // 3. Normalized key lookup
  const cleanKey = rawKey.toLowerCase().replace(/[_\s-]+/g, "-");
  const directMatch = ICON_MAP[cleanKey] || ICON_MAP[rawKey.toLowerCase()];

  if (directMatch) {
    const Component = directMatch.component;
    const finalColor = color || directMatch.color;
    return <Component size={size} color={finalColor} className={className} style={style} />;
  }

  // 4. Heuristic search by substring
  if (cleanKey.includes("oracle") || cleanKey.includes("sql") || cleanKey.includes("db") || cleanKey.includes("postgres")) {
    return <Database size={size} color={color || "var(--prism-pink, #f43f5e)"} className={className} style={style} />;
  }
  if (cleanKey.includes("unix") || cleanKey.includes("ssh") || cleanKey.includes("terminal") || cleanKey.includes("host")) {
    return <Terminal size={size} color={color || "var(--accent-teal, #14b8a6)"} className={className} style={style} />;
  }
  if (cleanKey.includes("jira") || cleanKey.includes("ticket") || cleanKey.includes("issue")) {
    return <Ticket size={size} color={color || "#38bdf8"} className={className} style={style} />;
  }
  if (cleanKey.includes("servicenow") || cleanKey.includes("itsm") || cleanKey.includes("shield")) {
    return <Shield size={size} color={color || "var(--accent-amber, #f59e0b)"} className={className} style={style} />;
  }
  if (cleanKey.includes("splunk") || cleanKey.includes("signal") || cleanKey.includes("datadog") || cleanKey.includes("telemetry") || cleanKey.includes("apm") || cleanKey.includes("activity")) {
    return <Activity size={size} color={color || "var(--accent-violet, #a855f7)"} className={className} style={style} />;
  }
  if (cleanKey.includes("kafka") || cleanKey.includes("stream") || cleanKey.includes("event") || cleanKey.includes("zap")) {
    return <Zap size={size} color={color || "var(--accent-teal, #14b8a6)"} className={className} style={style} />;
  }
  if (cleanKey.includes("confluence") || cleanKey.includes("wiki") || cleanKey.includes("doc") || cleanKey.includes("knowledge")) {
    return <FileText size={size} color={color || "#c084fc"} className={className} style={style} />;
  }
  if (cleanKey.includes("mcp") || cleanKey.includes("network") || cleanKey.includes("bus")) {
    return <Network size={size} color={color || "#ec4899"} className={className} style={style} />;
  }

  // 5. Fallback monogram badge if identifier is short or unknown
  const text = (fallbackText || rawKey || "TL").trim();
  const monogram = text.length >= 2 ? text.slice(0, 2).toUpperCase() : (text + "X").slice(0, 2).toUpperCase();

  return (
    <div
      className={`tool-icon-monogram ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "6px",
        background: "rgba(255, 255, 255, 0.08)",
        border: "1px solid var(--border-subtle)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.max(9, Math.floor(size * 0.45)),
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        color: color || "var(--prism-pink, #f43f5e)",
        userSelect: "none",
        ...style
      }}
    >
      {monogram}
    </div>
  );
}
