import React from "react";

export function BrandLogo({ 
  size = 32, 
  showText = true, 
  subtitle = "Autonomous SRE Platform",
  isAdmin = false,
  className = ""
}) {
  const iconSize = size;

  return (
    <div className={`brand-logo-container ${className}`} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      {/* Sentrix Orbital Shield & Nexus Emblem */}
      <div style={{
        width: `${iconSize}px`,
        height: `${iconSize}px`,
        borderRadius: "9px",
        background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 4px 18px rgba(236, 72, 153, 0.35)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Subtle internal gloss */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "45%",
          background: "linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 100%)",
          borderRadius: "9px 9px 0 0"
        }} />

        {/* High-Tech Sentrix Shield & Neural Nexus SVG */}
        <svg 
          width={Math.round(iconSize * 0.62)} 
          height={Math.round(iconSize * 0.62)} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#ffffff" 
          strokeWidth="2.2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ position: "relative", zIndex: 1 }}
        >
          {/* Outer Chamfered Hexagonal Shield */}
          <path d="M12 2.5L20.5 6.8V17.2L12 21.5L3.5 17.2V6.8L12 2.5Z" />
          {/* Inner Interlocking Nexus Diamond */}
          <path d="M12 7L16.5 12L12 17L7.5 12L12 7Z" strokeWidth="1.8" opacity="0.9" />
          {/* Central Neural Pulse Core */}
          <circle cx="12" cy="12" r="1.8" fill="#ffffff" stroke="none" />
        </svg>
      </div>

      {showText && (
        <div style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ 
              fontSize: size >= 36 ? "18px" : "16px", 
              fontWeight: "800", 
              letterSpacing: "-0.03em", 
              color: "var(--ink-primary)",
              lineHeight: 1.2
            }}>
              Sentrix
            </span>
            {isAdmin ? (
              <span className="badge badge-magenta" style={{ padding: "0 6px", fontSize: "9px" }}>Admin</span>
            ) : (
              <span className="badge badge-teal" style={{ padding: "0 5px", fontSize: "8.5px" }}>2.8 ADK</span>
            )}
          </div>
          {subtitle && (
            <div style={{ fontSize: "11px", color: "var(--ink-tertiary)", whiteSpace: "nowrap" }}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
