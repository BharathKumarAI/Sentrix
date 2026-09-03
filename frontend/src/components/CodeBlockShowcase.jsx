import React, { useState } from "react";
import { Copy, Check, Terminal, Code2 } from "lucide-react";

export function CodeBlockShowcase({ language = "BASH", code = "", title = "" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-showcase">
      <div className="code-showcase-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {language === "BASH" ? (
            <Terminal size={14} color="var(--accent-teal)" />
          ) : (
            <Code2 size={14} color="var(--prism-pink)" />
          )}
          <span className="mono badge badge-teal" style={{ fontSize: "9.5px", padding: "1px 6px" }}>
            {language.toUpperCase()}
          </span>
          {title && (
            <span style={{ fontSize: "11px", color: "var(--ink-tertiary)" }}>{title}</span>
          )}
        </div>

        <button
          className="btn-ghost"
          onClick={handleCopy}
          style={{ fontSize: "11px", padding: "3px 8px", gap: "4px" }}
          title="Copy code"
        >
          {copied ? <Check size={12} color="var(--accent-teal)" /> : <Copy size={12} />}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>

      <pre className="code-showcase-body">
        <code>{code}</code>
      </pre>
    </div>
  );
}
