import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { Shield } from "lucide-react";
import auditApi from "./api";
import { KpiCard, SectionLabel, PageHeading, Pill, T } from "../compliance/shared";
import AuditPlansPage from "./pages/AuditPlansPage";
import AuditsPage from "./pages/AuditsPage";
import GlobalChecklistPage from "./pages/GlobalChecklistPage";
import GlobalEvidencePage from "./pages/GlobalEvidencePage";
import GlobalFindingsPage from "./pages/GlobalFindingsPage";
import GlobalCorrectivePage from "./pages/GlobalCorrectivePage";
import GlobalReportsPage from "./pages/GlobalReportsPage";
import GlobalHistoryPage from "./pages/GlobalHistoryPage";

export default function AuditModule({ page: pageProp }: any) {
  const { page: paramsPage } = useParams();
  const currentPage = paramsPage || pageProp || "dashboard";

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <AuditDashboard />;
      case "plans": return <AuditPlansPage />;
      case "audits": return <AuditsPage />;
      case "checklist": return <GlobalChecklistPage />;
      case "evidence": return <GlobalEvidencePage />;
      case "findings": return <GlobalFindingsPage />;
      case "corrective": return <GlobalCorrectivePage />;
      case "reports": return <GlobalReportsPage />;
      case "history": return <GlobalHistoryPage />;
      default: return <AuditDashboard />;
    }
  };

  return (
    <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1, background: T.bg }}>
      {renderPage()}
    </div>
  );
}

function AuditDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["audit-dashboard"], queryFn: async () => (await auditApi.get("/dashboard")).data });

  if (isLoading || !data) return <div style={{ color: T.textMuted, padding: 40 }}>Loading...</div>;

  const { kpis, auditsByStatus, findingsBySeverity } = data;

  return (
    <div>
      <PageHeading title="Audit Dashboard" subtitle="Organization-wide audit posture." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 20 }}>
        <KpiCard label="Total Plans" value={kpis.totalPlans} Icon={Shield} iconColor={T.accent} iconBg={T.accentSoft} />
        <KpiCard label="Total Audits" value={kpis.totalAudits} Icon={Shield} iconColor={T.blue} iconBg={T.blueSoft} />
        <KpiCard label="Overdue" value={kpis.overdueAudits} Icon={Shield} iconColor={T.red} iconBg={T.redSoft} />
        <KpiCard label="Open Findings" value={kpis.openFindings} Icon={Shield} iconColor={T.amber} iconBg={T.amberSoft} />
        <KpiCard label="Critical" value={kpis.criticalFindings} Icon={Shield} iconColor={T.red} iconBg={T.redSoft} />
        <KpiCard label="Pending Evidence" value={kpis.pendingEvidence} Icon={Shield} iconColor={T.purple} iconBg={T.purpleSoft} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 18 }}>
          <SectionLabel>Audits by Status</SectionLabel>
          {auditsByStatus.map((a: any) => (
            <div key={a.status} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.panelBorder}` }}>
              <span style={{ fontSize: 12, color: T.textSecondary }}>{a.status}</span>
              <Pill label={a.count} color={T.accent} bg={T.accentSoft} />
            </div>
          ))}
        </div>
        <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 18 }}>
          <SectionLabel>Findings by Severity</SectionLabel>
          {findingsBySeverity.map((f: any) => (
            <div key={f.severity} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.panelBorder}` }}>
              <span style={{ fontSize: 12, color: T.textSecondary }}>{f.severity}</span>
              <Pill label={f.count} color={f.severity === "Critical" ? T.red : T.amber} bg={f.severity === "Critical" ? T.redSoft : T.amberSoft} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
