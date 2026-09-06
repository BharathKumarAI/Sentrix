import React from "react";
import { Link } from "react-router-dom";
export function LandingPage() {
  return <main className="prism-card" style={{ margin: "48px auto", padding: 32, maxWidth: 760 }}>
    <h1>Agent operations platform</h1>
    <p>Configure organizations, teams, projects, and integrations. Investigations use your connected data sources and governed agent capabilities.</p>
    <Link className="btn-primary" to="/portal">Open workspace</Link>
  </main>;
}
