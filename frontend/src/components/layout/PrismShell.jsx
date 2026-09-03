import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { PrismSidebar } from "./PrismSidebar";
import { PrismTopBar } from "./PrismTopBar";
import { TelemetryFooter } from "../TelemetryFooter";

export function PrismShell({
  projects,
  activeProject,
  onSelectProject,
  activeEnvironment,
  onSelectEnvironment,
  onOpenNewProjectModal
}) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("prism_theme") || "dark";
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return window.innerWidth <= 1024;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("prism_theme", theme);
  }, [theme]);

  // Responsive screen fit: auto-collapse on tablet/laptop screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keyboard shortcut: Cmd+B / Ctrl+B to toggle sidebar expander
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      display: "flex",
      overflow: "hidden",
      background: "var(--bg-app)"
    }}>
      {/* Fixed Collapsible Left Sidebar with Modern Expander */}
      <PrismSidebar
        projects={projects}
        activeProject={activeProject}
        onSelectProject={onSelectProject}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Main Workspace Area */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        minWidth: 0
      }}>
        {/* Top Scope & Breadcrumb Bar with Modern Sidebar Toggle */}
        <PrismTopBar
          projects={projects}
          activeProject={activeProject}
          onSelectProject={onSelectProject}
          activeEnvironment={activeEnvironment}
          onSelectEnvironment={onSelectEnvironment}
          onOpenNewProjectModal={onOpenNewProjectModal}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
        />

        {/* Dynamic Full-Space Page Content */}
        <main style={{
          flex: 1,
          overflowY: "auto",
          background: "radial-gradient(ellipse 60% 40% at 50% -10%, rgba(225, 29, 72, 0.05) 0%, transparent 80%)",
          paddingBottom: "36px"
        }}>
          <Outlet />
        </main>

        {/* Bottom Circadian Telemetry Bar */}
        <TelemetryFooter
          activeProject={activeProject}
          activeEnvironment={activeEnvironment}
        />
      </div>
    </div>
  );
}
