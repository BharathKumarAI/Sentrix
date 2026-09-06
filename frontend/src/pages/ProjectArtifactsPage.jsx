import React, { useState, useEffect } from "react";
import {
  Folder,
  FileText,
  Download,
  Eye,
  Plus,
  RotateCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Code,
  Layers,
  Cpu,
  Sliders,
  HardDrive,
  Copy,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  X
} from "lucide-react";
import {
  fetchProjectStorageTree,
  fetchProjectArtifactContent,
  getProjectArtifactDownloadUrl,
  createProjectArtifact
} from "../api/client";

export function ProjectArtifactsPage({ activeProject }) {
  const projectId = activeProject?.id || "prj_billing";
  const projectName = activeProject?.name || "Global Billing & Payment Gateway";
  const projectKey = activeProject?.project_key || "";

  const [treeData, setTreeData] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all"); // "all", "artifacts", "skills", "config", "evals"
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Preview Drawer
  const [previewItem, setPreviewItem] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // New Asset Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubfolder, setNewSubfolder] = useState("skills/custom-sre-skill");
  const [newFilename, setNewFilename] = useState("SKILL.md");
  const [newContent, setNewContent] = useState(
`---
name: custom-investigation-skill
description: Project-scoped autonomous investigation skill for ${projectKey}
version: 1.0.0
---

# Custom Autonomous Investigation Procedure
1. Step 1: Validate system health metrics
2. Step 2: Correlate error events
`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadTree = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchProjectStorageTree(projectId);
      setTreeData(data);
    } catch (err) {
      console.warn("Failed to load project storage tree:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTree();
  }, [projectId]);

  const handleOpenPreview = async (file) => {
    setPreviewItem(file);
    setIsLoadingPreview(true);
    try {
      const data = await fetchProjectArtifactContent(projectId, file.subfolder, file.filename);
      setPreviewContent(data);
    } catch (err) {
      setPreviewContent({ content_str: "Failed to load artifact content: " + err.message });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createProjectArtifact(
        projectId,
        newSubfolder,
        newFilename,
        newContent,
        newFilename.endsWith(".md") ? "text/markdown" : "application/json"
      );
      showToast(`Asset '${newFilename}' created in ${newSubfolder}!`, "success");
      setShowCreateModal(false);
      loadTree();
    } catch (err) {
      showToast("Failed to create asset: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Compile all files across subfolders
  const allFiles = [];
  if (treeData && treeData.subfolders) {
    Object.entries(treeData.subfolders).forEach(([sub, info]) => {
      (info.files || []).forEach((f) => {
        allFiles.push({ ...f, category: sub });
      });
    });
  }

  // Filtered files
  const filteredFiles = allFiles.filter((f) => {
    if (activeFilter !== "all" && f.category !== activeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        f.filename.toLowerCase().includes(q) ||
        f.relative_path.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div
      style={{
        padding: "24px 32px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        overflowY: "auto",
        minHeight: "100%",
        boxSizing: "border-box"
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: "8px",
            background: toastMessage.type === "error" ? "rgba(239, 68, 68, 0.95)" : "rgba(16, 185, 129, 0.95)",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <CheckCircle2 size={16} />
          {toastMessage.msg}
        </div>
      )}

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
            <Folder size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                PROJECT WORKSPACE
              </span>
              <span className="badge badge-teal">Google ADK Assets</span>
              <span className="badge badge-magenta">{projectKey}</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "4px" }}>
              Project Artifacts, Skills & Config Hub
            </h1>
            <p style={{ fontSize: "13px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              Dedicated project repository holding RCA reports, ADK execution graphs, custom SRE skills, prompts, and evaluation datasets.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
            style={{ gap: "6px" }}
          >
            <Plus size={14} />
            Create Asset / Skill
          </button>

          <button
            onClick={loadTree}
            disabled={isRefreshing}
            className="btn-secondary"
            style={{ gap: "6px" }}
          >
            <RotateCw size={13} className={isRefreshing ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* 4 Category Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        {/* Artifacts Card */}
        <div
          onClick={() => setActiveFilter("artifacts")}
          className="prism-card"
          style={{
            padding: "16px 20px",
            background: activeFilter === "artifacts" ? "var(--bg-elevated)" : "var(--bg-card)",
            border: activeFilter === "artifacts" ? "1px solid var(--accent-teal)" : "1px solid var(--border-card)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText size={18} style={{ color: "var(--accent-teal)" }} />
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)" }}>Run Artifacts</h3>
            </div>
            <span className="badge badge-teal">{treeData?.subfolders?.artifacts?.file_count || 0} files</span>
          </div>
          <p style={{ fontSize: "11.5px", color: "var(--ink-secondary)" }}>
            RCA Markdown reports, ADK execution traces, evidence bundles & action proposals.
          </p>
          <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "auto" }}>
            {formatBytes(treeData?.subfolders?.artifacts?.total_bytes)}
          </div>
        </div>

        {/* Skills Card */}
        <div
          onClick={() => setActiveFilter("skills")}
          className="prism-card"
          style={{
            padding: "16px 20px",
            background: activeFilter === "skills" ? "var(--bg-elevated)" : "var(--bg-card)",
            border: activeFilter === "skills" ? "1px solid var(--accent-violet)" : "1px solid var(--border-card)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Cpu size={18} style={{ color: "var(--accent-violet)" }} />
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)" }}>Project Skills</h3>
            </div>
            <span className="badge badge-teal">{treeData?.subfolders?.skills?.file_count || 0} files</span>
          </div>
          <p style={{ fontSize: "11.5px", color: "var(--ink-secondary)" }}>
            Custom SRE skill definitions, SKILL.md guides, and tool bindings.
          </p>
          <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "auto" }}>
            {formatBytes(treeData?.subfolders?.skills?.total_bytes)}
          </div>
        </div>

        {/* Config Card */}
        <div
          onClick={() => setActiveFilter("config")}
          className="prism-card"
          style={{
            padding: "16px 20px",
            background: activeFilter === "config" ? "var(--bg-elevated)" : "var(--bg-card)",
            border: activeFilter === "config" ? "1px solid var(--accent-magenta)" : "1px solid var(--border-card)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sliders size={18} style={{ color: "var(--accent-magenta)" }} />
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)" }}>Config & Prompts</h3>
            </div>
            <span className="badge badge-teal">{treeData?.subfolders?.config?.file_count || 0} files</span>
          </div>
          <p style={{ fontSize: "11.5px", color: "var(--ink-secondary)" }}>
            System prompt directives, topology maps, and runtime configurations.
          </p>
          <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "auto" }}>
            {formatBytes(treeData?.subfolders?.config?.total_bytes)}
          </div>
        </div>

        {/* Evals Card */}
        <div
          onClick={() => setActiveFilter("evals")}
          className="prism-card"
          style={{
            padding: "16px 20px",
            background: activeFilter === "evals" ? "var(--bg-elevated)" : "var(--bg-card)",
            border: activeFilter === "evals" ? "1px solid var(--accent-teal)" : "1px solid var(--border-card)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Zap size={18} style={{ color: "var(--accent-teal)" }} />
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)" }}>ADK Evals</h3>
            </div>
            <span className="badge badge-teal">{treeData?.subfolders?.evals?.file_count || 0} files</span>
          </div>
          <p style={{ fontSize: "11.5px", color: "var(--ink-secondary)" }}>
            Quality Flywheel gold datasets, LLM-as-a-judge benchmarks & metrics.
          </p>
          <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", marginTop: "auto" }}>
            {formatBytes(treeData?.subfolders?.evals?.total_bytes)}
          </div>
        </div>
      </div>

      {/* Path info banner */}
      <div
        style={{
          padding: "10px 16px",
          background: "var(--bg-input)",
          borderRadius: "8px",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <HardDrive size={14} style={{ color: "var(--accent-teal)" }} />
          <span style={{ color: "var(--ink-tertiary)" }}>Local Filesystem Root:</span>
          <span style={{ fontFamily: "monospace", color: "var(--ink-primary)" }}>{treeData?.local_path || `./storage/projects/${projectId}`}</span>
        </div>
        <div style={{ color: "var(--ink-secondary)" }}>
          Total Footprint: <strong>{formatBytes(treeData?.total_bytes)}</strong> across <strong>{treeData?.total_files || 0}</strong> files
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--ink-tertiary)" }} />
          <input
            type="text"
            placeholder="Search artifacts, skills, or run IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 34px",
              background: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
              color: "var(--ink-primary)",
              fontSize: "13px"
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          {["all", "artifacts", "skills", "config", "evals"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={activeFilter === f ? "btn-primary" : "btn-secondary"}
              style={{ padding: "6px 12px", fontSize: "12px", textTransform: "capitalize" }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* File List Table */}
      <div
        className="prism-card"
        style={{
          padding: "20px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)"
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--ink-tertiary)" }}>
                <th style={{ padding: "10px 12px" }}>Category</th>
                <th style={{ padding: "10px 12px" }}>Filename</th>
                <th style={{ padding: "10px 12px" }}>Relative Path</th>
                <th style={{ padding: "10px 12px" }}>Size</th>
                <th style={{ padding: "10px 12px" }}>Last Modified</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--border-card)" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <span className={file.category === "artifacts" ? "badge badge-teal" : file.category === "skills" ? "badge badge-violet" : "badge badge-magenta"}>
                      {file.category}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--ink-primary)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {file.extension === ".md" ? (
                        <FileText size={15} style={{ color: "var(--accent-teal)" }} />
                      ) : (
                        <Code size={15} style={{ color: "var(--accent-violet)" }} />
                      )}
                      {file.filename}
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "var(--ink-secondary)", fontSize: "11.5px" }}>
                    {file.relative_path}
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--accent-violet)", fontWeight: 600 }}>
                    {formatBytes(file.size_bytes)}
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--ink-tertiary)", fontSize: "11.5px" }}>
                    {new Date(file.modified_at).toLocaleString()}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                      <button
                        onClick={() => handleOpenPreview(file)}
                        className="btn-secondary"
                        style={{ padding: "4px 8px", fontSize: "11.5px", gap: "4px" }}
                        title="Preview Content"
                      >
                        <Eye size={12} />
                        Preview
                      </button>
                      <a
                        href={getProjectArtifactDownloadUrl(projectId, file.subfolder, file.filename)}
                        download={file.filename}
                        className="btn-secondary"
                        style={{ padding: "4px 8px", fontSize: "11.5px", gap: "4px", textDecoration: "none" }}
                        title="Download File"
                      >
                        <Download size={12} />
                        Download
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFiles.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--ink-tertiary)" }}>
                    No assets found matching the selected filter. Click "Create Asset / Skill" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PREVIEW DRAWER / MODAL */}
      {previewItem && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: "min(680px, 90vw)",
            background: "var(--bg-card)",
            borderLeft: "1px solid var(--border-subtle)",
            boxShadow: "-12px 0 32px rgba(0,0,0,0.5)",
            zIndex: 10000,
            display: "flex",
            flexDirection: "column",
            padding: "24px",
            boxSizing: "border-box"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>
                {previewItem.category.toUpperCase()} PREVIEW
              </div>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ink-primary)", marginTop: "2px" }}>
                {previewItem.filename}
              </h2>
              <div style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--ink-secondary)", marginTop: "2px" }}>
                {previewItem.relative_path}
              </div>
            </div>
            <button
              onClick={() => setPreviewItem(null)}
              className="btn-secondary"
              style={{ padding: "6px 12px" }}
            >
              Close
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", margin: "16px 0", background: "var(--bg-input)", borderRadius: "8px", border: "1px solid var(--border-subtle)", padding: "16px" }}>
            {isLoadingPreview ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-tertiary)" }}>
                Loading artifact content...
              </div>
            ) : (
              <pre
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "12px",
                  lineHeight: 1.6,
                  color: "var(--ink-primary)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  margin: 0
                }}
              >
                {previewContent?.content_str || "No content available."}
              </pre>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={() => {
                if (previewContent?.content_str) {
                  navigator.clipboard.writeText(previewContent.content_str);
                  showToast("Copied content to clipboard!", "success");
                }
              }}
              className="btn-secondary"
              style={{ gap: "6px" }}
            >
              <Copy size={13} />
              Copy Content
            </button>

            <a
              href={getProjectArtifactDownloadUrl(projectId, previewItem.subfolder, previewItem.filename)}
              download={previewItem.filename}
              className="btn-primary"
              style={{ gap: "6px", textDecoration: "none" }}
            >
              <Download size={13} />
              Download File
            </a>
          </div>
        </div>
      )}

      {/* CREATE ASSET MODAL */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10001,
            padding: "20px"
          }}
        >
          <div
            className="prism-card"
            style={{
              width: "100%",
              maxWidth: "600px",
              padding: "24px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ink-primary)" }}>
                Create Project Asset / Skill
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
                style={{ padding: "4px 8px" }}
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Target Subfolder:
                </label>
                <input
                  type="text"
                  value={newSubfolder}
                  onChange={(e) => setNewSubfolder(e.target.value)}
                  placeholder="e.g. skills/billing-investigation, config, evals"
                  required
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    color: "var(--ink-primary)",
                    fontSize: "13px"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Filename:
                </label>
                <input
                  type="text"
                  value={newFilename}
                  onChange={(e) => setNewFilename(e.target.value)}
                  placeholder="e.g. SKILL.md, eval_dataset.json, system_prompt.md"
                  required
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    color: "var(--ink-primary)",
                    fontSize: "13px"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                  Content:
                </label>
                <textarea
                  rows={10}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    color: "var(--ink-primary)",
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "12px",
                    lineHeight: 1.5,
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? "Saving..." : "Save to Project Storage"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
