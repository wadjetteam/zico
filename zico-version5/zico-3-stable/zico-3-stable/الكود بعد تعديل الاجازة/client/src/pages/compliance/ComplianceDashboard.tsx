import { ShieldCheck, BadgeCheck, MinusCircle, XCircle, AlertOctagon, FileText, Clock, ArrowRight, FolderCheck, Upload, Wrench, Layers } from "lucide-react";
import { useDashboard } from "./hooks";
import { T, KpiCard, HBarChart, DonutChart, severityMeta, complianceScore } from "./shared";

export function ComplianceDashboard({ goTo }: { goTo: (p: string) => void }) {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) return <div style={{ color: T.textMuted, fontSize: 13 }}>Loading dashboard...</div>;

  const { kpis, byFramework, statusDistribution, gapsBySeverity, remediationProgress } = data;
  const score = kpis.overallScore;

  const trend = [
    { label: "Mar", value: 48 }, { label: "Apr", value: 52 }, { label: "May", value: 58 },
    { label: "Jun", value: 61 }, { label: "Jul", value: 65 }, { label: "Aug", value: score },
  ];

  const recent = [
    { icon: FolderCheck, text: "Assessment completed for REQ-101 (Compliant) by Marwa Hassan", when: "2 days ago" },
    { icon: Upload, text: "Evidence EVD-003 submitted for REQ-103", when: "3 days ago" },
    { icon: AlertOctagon, text: "New gap GAP-002 opened on REQ-104 (Critical)", when: "5 days ago" },
    { icon: Wrench, text: "Remediation REM-001 progress updated to 55%", when: "1 week ago" },
    { icon: Layers, text: "PCI DSS v4.0 framework requirements refreshed", when: "2 weeks ago" },
  ];

  const ChartCard = ({ title, children, onExpand }: any) => (
    <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary }}>{title}</div>
        {onExpand && <button onClick={onExpand} style={{ border: `1px solid ${T.panelBorder}`, background: T.inputBg, borderRadius: 7, padding: 6, cursor: "pointer" }}><ArrowRight size={12} color={T.textMuted} /></button>}
      </div>
      {children}
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Compliance Dashboard</h1>
      <p style={{ fontSize: 12.5, color: T.textMuted, marginBottom: 22 }}>Executive overview of framework coverage, requirement status, and remediation health.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 22 }}>
        <KpiCard label="Overall Compliance Score" value={`${score}%`} Icon={ShieldCheck} iconColor={T.accent} iconBg={T.accentSoft} />
        <KpiCard label="Compliant Requirements" value={kpis.compliantCount} Icon={BadgeCheck} iconColor={T.green} iconBg={T.greenSoft} />
        <KpiCard label="Partially Compliant" value={kpis.partialCount} Icon={MinusCircle} iconColor={T.amber} iconBg={T.amberSoft} />
        <KpiCard label="Non-Compliant" value={kpis.nonCompliantCount} Icon={XCircle} iconColor={T.red} iconBg={T.redSoft} />
        <KpiCard label="Open Gaps" value={kpis.openGaps} Icon={AlertOctagon} iconColor={T.red} iconBg={T.redSoft} />
        <KpiCard label="Missing Evidence" value={kpis.missingEvidence} Icon={FileText} iconColor={T.grey} iconBg={T.greySoft} />
        <KpiCard label="Overdue Remediation" value={kpis.overdueRemediation} Icon={Clock} iconColor={T.amber} iconBg={T.amberSoft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16, marginBottom: 16 }}>
        <ChartCard title="Compliance by Framework" onExpand={() => goTo("frameworks")}>
          <HBarChart data={byFramework.map((f: any) => ({ label: f.frameworkName, value: f.score }))} max={100} colorFn={(d: any) => d.value >= 70 ? T.green : d.value >= 40 ? T.amber : T.red} />
        </ChartCard>
        <ChartCard title="Compliance Status Distribution" onExpand={() => goTo("requirements")}>
          <DonutChart segments={statusDistribution} centerValue={`${score}%`} centerLabel="SCORE" />
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
        <ChartCard title="Compliance Trend Over Time">
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
            {trend.map((p, i) => <div key={i} style={{ flex: 1, background: T.accent, height: `${p.value}%`, borderRadius: 4, opacity: 0.3 + (i * 0.14) }} />)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>{trend.map((p, i) => <span key={i} style={{ fontSize: 10, color: T.textMuted }}>{p.label}</span>)}</div>
        </ChartCard>
        <ChartCard title="Gaps by Severity" onExpand={() => goTo("gaps")}>
          <HBarChart data={gapsBySeverity} colorFn={(d: any) => severityMeta(d.label).color} />
        </ChartCard>
        <ChartCard title="Remediation Progress" onExpand={() => goTo("remediation")}>
          <HBarChart data={remediationProgress} max={100} colorFn={() => T.blue} />
        </ChartCard>
      </div>

      <ChartCard title="Recent Activity">
        <div style={{ display: "flex", flexDirection: "column" }}>
          {recent.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < recent.length - 1 ? `1px solid ${T.panelBorder}` : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: T.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}><r.icon size={13} color={T.accent} /></div>
              <div style={{ fontSize: 12.5, color: T.textPrimary, flex: 1 }}>{r.text}</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>{r.when}</div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
