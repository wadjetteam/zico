import { T } from "./shared";
import { FileText, ClipboardList, AlertOctagon, Upload, Wrench, Shield } from "lucide-react";

export function ReportsPage() {
  const reports = [
    { title: "Overall Compliance Report", desc: "Program-wide score, framework count, requirement count", icon: Shield, data: "Summary metrics" },
    { title: "Framework Compliance Report", desc: "Per-framework scores and coverage", icon: ClipboardList, data: "Framework breakdown" },
    { title: "Requirements Status Report", desc: "Breakdown by compliance status", icon: FileText, data: "Status counts" },
    { title: "Compliance Gap Report", desc: "Open gaps by severity level", icon: AlertOctagon, data: "Gap analysis" },
    { title: "Evidence Status Report", desc: "Approved vs total evidence", icon: Upload, data: "Evidence metrics" },
    { title: "Remediation Report", desc: "Completed vs total tasks", icon: Wrench, data: "Progress tracking" },
    { title: "Audit Readiness Report", desc: "Cross-references open findings, gaps, missing evidence", icon: Shield, data: "Readiness score" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Reports</h1>
      <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>Pre-canned reports for stakeholder communication.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        {reports.map((r, i) => (
          <div key={i} style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 20, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}><r.icon size={16} color={T.accent} /><span style={{ fontWeight: 600, fontSize: 13 }}>{r.title}</span></div>
            <p style={{ fontSize: 12, color: T.textSecondary, marginBottom: 8 }}>{r.desc}</p>
            <span style={{ fontSize: 11, color: T.textMuted }}>{r.data}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
