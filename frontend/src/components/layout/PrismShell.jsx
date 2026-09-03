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

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("prism_theme", theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      display: "flex",
      overflow: "hidden",
      background: "var(--bg-app)"
    }}>
      {/* Fixed Collapsible Left Sidebar */}
      <PrismSidebar
        projects={projects}
        activeProject={activeProject}
        onSelectProject={onSelectProject}
      />

      {/* Main Workspace Area */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden"
      }}>
        {/* Top Scope & Breadcrumb Bar */}
        <PrismTopBar
          projects={projects}
          activeProject={activeProject}
          onSelectProject={onSelectProject}
          activeEnvironment={activeEnvironment}
          onSelectEnvironment={onSelectEnvironment}
          onOpenNewProjectModal={onOpenNewProjectModal}
          theme={theme}
          onToggleTheme={handleToggleTheme}
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
