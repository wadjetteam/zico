import { useState } from "react";
import { LayoutGrid, CalendarCheck, Search, FileText, AlertTriangle, Wrench, ClipboardList, History, BarChart3, Shield } from "lucide-react";
import AuditDashboard from "./pages/AuditDashboard";
import AuditPlansPage from "./pages/AuditPlansPage";
import AuditsPage from "./pages/AuditsPage";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { key: "plans", label: "Audit Plans", icon: CalendarCheck },
  { key: "audits", label: "Audits", icon: Search },
  { key: "checklist", label: "Checklist", icon: ClipboardList },
  { key: "evidence", label: "Evidence", icon: FileText },
  { key: "findings", label: "Findings", icon: AlertTriangle },
  { key: "corrective", label: "Corrective Actions", icon: Wrench },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "history", label: "History", icon: History },
];

const T = { bg: "#0b0b0d", sidebarBg: "#0e0e11", panelBg: "#141417", panelBorder: "#232327", textPrimary: "#f2f2f0", textSecondary: "#8c8c94", accent: "#d9ad4f", accentSoft: "rgba(217,173,79,0.14)" };

export default function AuditModule() {
  const [page, setPage] = useState("dashboard");
  const [openAuditId, setOpenAuditId] = useState<string | null>(null);

  const renderPage = () => {
    if (openAuditId) return <AuditDetailsPage auditId={openAuditId} onBack={() => setOpenAuditId(null)} />;
    switch (page) {
      case "dashboard": return <AuditDashboard />;
      case "plans": return <AuditPlansPage />;
      case "audits": return <AuditsPage onOpenAudit={setOpenAuditId} />;
      case "checklist": return <PlaceholderPage title="Checklist" desc="Global checklist view across all audits." />;
      case "evidence": return <PlaceholderPage title="Evidence Requests" desc="Global evidence request view." />;
      case "findings": return <PlaceholderPage title="Findings" desc="Global findings view." />;
      case "corrective": return <PlaceholderPage title="Corrective Actions" desc="Global corrective actions view." />;
      case "reports": return <PlaceholderPage title="Audit Reports" desc="Audit reports and analytics." />;
      case "history": return <PlaceholderPage title="Audit History" desc="Append-only audit history log." />;
      default: return <AuditDashboard />;
    }
  };

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      <div style={{ width: 220, minWidth: 220, background: T.sidebarBg, borderRight: `1px solid ${T.panelBorder}`, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ padding: "16px", borderBottom: `1px solid ${T.panelBorder}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.accent, letterSpacing: 1 }}>WADJET</div>
          <div style={{ fontSize: 10, color: T.textSecondary }}>Audit Module</div>
        </div>
        <nav style={{ padding: "10px 8px", flex: 1 }}>
          {NAV.map((item) => (
            <div key={item.key} onClick={() => { setPage(item.key); setOpenAuditId(null); }} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12.5, marginBottom: 2, color: page === item.key ? T.accent : T.textSecondary, fontWeight: page === item.key ? 600 : 500, background: page === item.key ? T.accentSoft : "transparent" }}>
              <item.icon size={13} />
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </div>
      <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1, background: T.bg }}>
        {renderPage()}
      </div>
    </div>
  );
}

function PlaceholderPage({ title, desc }: any) {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: T.textPrimary }}>{title}</h1>
      <p style={{ fontSize: 12.5, color: T.textSecondary, marginBottom: 20 }}>{desc}</p>
      <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 40, textAlign: "center", color: T.textMuted }}>
        <Shield size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
        <p>Coming soon — data will be loaded from the backend.</p>
      </div>
    </div>
  );
}

function AuditDetailsPage({ auditId, onBack }: any) {
  const { data: audit, isLoading } = require("@tanstack/react-query").useQuery({
    queryKey: ["audit-details", auditId],
    queryFn: async () => (await require("../api/client").default.get(`/audits/${auditId}`)).data,
  });
  const [tab, setTab] = useState("overview");

  if (isLoading || !audit) return <div style={{ color: T.textSecondary, padding: 40 }}>Loading audit details...</div>;

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: T.accent, fontSize: 12, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
        <span>←</span> Back to Audits
      </button>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: T.textPrimary }}>{audit.name}</h1>
      <p style={{ fontSize: 12.5, color: T.textSecondary, marginBottom: 20 }}>{audit.auditCode} • {audit.status} • {audit.overallResult}</p>
      <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${T.panelBorder}`, marginBottom: 20 }}>
        {["overview", "scope", "checklist", "evidence", "findings", "corrective", "history"].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "10px 16px", background: "none", border: "none", borderBottom: tab === t ? `2px solid ${T.accent}` : "2px solid transparent", color: tab === t ? T.accent : T.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
        ))}
      </div>
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 18 }}>
            <SectionLabel>Audit Information</SectionLabel>
            <DetailRow k="Type" v={audit.type} />
            <DetailRow k="Objective" v={audit.objective} />
            <DetailRow k="Owner" v={audit.owner} />
            <DetailRow k="Lead Auditor" v={audit.leadAuditor} />
            <DetailRow k="Auditee" v={audit.auditee} />
            <DetailRow k="Department" v={audit.department} />
            <DetailRow k="Start Date" v={audit.startDate?.slice(0, 10) || "—"} />
            <DetailRow k="End Date" v={audit.endDate?.slice(0, 10) || "—"} />
          </div>
          <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 18 }}>
            <SectionLabel>Statistics</SectionLabel>
            <DetailRow k="Checklist Items" v={audit.checklistItems?.length || 0} />
            <DetailRow k="Evidence Requests" v={audit.evidenceRequests?.length || 0} />
            <DetailRow k="Findings" v={audit.findings?.length || 0} />
            <DetailRow k="Corrective Actions" v={audit.correctiveActions?.length || 0} />
          </div>
        </div>
      )}
      {tab !== "overview" && (
        <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 40, textAlign: "center", color: T.textMuted }}>
          <p>{tab.charAt(0).toUpperCase() + tab.slice(1)} view — Coming soon.</p>
        </div>
      )}
    </div>
  );
}
