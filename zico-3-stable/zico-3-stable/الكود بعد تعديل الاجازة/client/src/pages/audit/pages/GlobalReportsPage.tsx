import { useQuery } from "@tanstack/react-query";
import { FileText, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import auditApi from "../api";
import { KpiCard, T } from "../../compliance/shared";

export default function GlobalReportsPage() {
  const { data } = useQuery({ queryKey: ["audit-dashboard"], queryFn: async () => (await auditApi.get("/dashboard")).data });
  const kpis = data?.kpis || {};

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: T.textPrimary }}>Audit Reports</h1>
      <p style={{ fontSize: 12.5, color: T.textMuted, marginBottom: 22 }}>Summary reports and audit analytics.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <KpiCard label="Total Plans" value={kpis.totalPlans ?? 0} Icon={FileText} iconColor={T.accent} iconBg={T.accentSoft} />
        <KpiCard label="Total Audits" value={kpis.totalAudits ?? 0} Icon={Users} iconColor={T.blue} iconBg={T.blueSoft} />
        <KpiCard label="Open Findings" value={kpis.openFindings ?? 0} Icon={AlertTriangle} iconColor={T.amber} iconBg={T.amberSoft} />
        <KpiCard label="Critical Findings" value={kpis.criticalFindings ?? 0} Icon={AlertTriangle} iconColor={T.red} iconBg={T.redSoft} />
        <KpiCard label="Pending Evidence" value={kpis.pendingEvidence ?? 0} Icon={FileText} iconColor={T.purple} iconBg={T.purpleSoft} />
        <KpiCard label="Open Corrective Actions" value={kpis.openCorrectiveActions ?? 0} Icon={CheckCircle2} iconColor={T.green} iconBg={T.greenSoft} />
      </div>
    </div>
  );
}
