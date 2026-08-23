import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, FileText, AlertTriangle, Clock, ClipboardCheck, TrendingUp, Search as SearchIcon } from "lucide-react";
import auditApi from "../api/client";
import { KpiCard, SectionLabel, PageHeading, T, FONT_STACK, Pill } from "../components/shared";

export default function AuditDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["audit-dashboard"], queryFn: async () => (await auditApi.get("/dashboard")).data });

  if (isLoading || !data) return <div style={{ color: T.textMuted, padding: 40 }}>Loading dashboard...</div>;

  const { kpis, auditsByStatus, findingsBySeverity, checklistStats, correctiveByStatus } = data;

  return (
    <div>
      <PageHeading title="Audit Dashboard" subtitle="Organization-wide audit posture — plans, audits, findings, and corrective actions." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 20 }}>
        <KpiCard label="Total Plans" value={kpis.totalPlans} Icon={ClipboardCheck} iconColor={T.accent} iconBg={T.accentSoft} to="/audit/plans" />
        <KpiCard label="Total Audits" value={kpis.totalAudits} Icon={SearchIcon} iconColor={T.blue} iconBg={T.blueSoft} to="/audit/audits" />
        <KpiCard label="Overdue Audits" value={kpis.overdueAudits} Icon={Clock} iconColor={T.red} iconBg={T.redSoft} to="/audit/audits" />
        <KpiCard label="Open Findings" value={kpis.openFindings} Icon={AlertTriangle} iconColor={T.amber} iconBg={T.amberSoft} to="/audit/findings" />
        <KpiCard label="Critical Findings" value={kpis.criticalFindings} Icon={AlertTriangle} iconColor={T.red} iconBg={T.redSoft} to="/audit/findings" />
        <KpiCard label="Pending Evidence" value={kpis.pendingEvidence} Icon={FileText} iconColor={T.purple} iconBg={T.purpleSoft} to="/audit/evidence" />
        <KpiCard label="Open Corrective Actions" value={kpis.openCorrectiveActions} Icon={TrendingUp} iconColor={T.green} iconBg={T.greenSoft} to="/audit/corrective" />
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
              <Pill label={f.count} color={f.severity === "Critical" ? T.red : f.severity === "High" ? T.amber : T.textSecondary} bg={f.severity === "Critical" ? T.redSoft : f.severity === "High" ? T.amberSoft : T.greySoft} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
