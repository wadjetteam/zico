import { useDashboard } from "../api/hooks";
import { T, reqStatusMeta, severityMeta } from "../lib/theme";

export function ComplianceDashboard({ goTo }: { goTo: (p: string) => void }) {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) return <div style={{ color: T.textMuted }}>Loading dashboard...</div>;

  const { kpis, byFramework, statusDistribution, gapsBySeverity, remediationProgress } = data;

  const KpiCard = ({ label, value, color, icon }: any) => (
    <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 11, color: T.textSecondary }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        <KpiCard label="Overall Compliance" value={`${kpis.overallScore}%`} color={T.accent} icon="🛡" />
        <KpiCard label="Compliant" value={kpis.compliantCount} color={T.green} icon="✓" />
        <KpiCard label="Partially Compliant" value={kpis.partialCount} color={T.amber} icon="◐" />
        <KpiCard label="Non-Compliant" value={kpis.nonCompliantCount} color={T.red} icon="✗" />
        <KpiCard label="Open Gaps" value={kpis.openGaps} color={T.red} icon="⚠" />
        <KpiCard label="Missing Evidence" value={kpis.missingEvidence} color={T.grey} icon="📄" />
        <KpiCard label="Overdue Remediation" value={kpis.overdueRemediation} color={T.amber} icon="⏰" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: T.accent, textTransform: "uppercase", marginBottom: 16, borderTop: `2px solid ${T.accent}`, paddingTop: 8 }}>Compliance by Framework</h3>
          {byFramework.map((f: any) => (
            <div key={f.frameworkId} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span>{f.frameworkName}</span>
                <span style={{ color: f.score >= 70 ? T.green : f.score >= 40 ? T.amber : T.red }}>{f.score}%</span>
              </div>
              <div style={{ height: 6, background: T.inputBg, borderRadius: 3 }}>
                <div style={{ height: "100%", width: `${f.score}%`, background: f.score >= 70 ? T.green : f.score >= 40 ? T.amber : T.red, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: T.accent, textTransform: "uppercase", marginBottom: 16, borderTop: `2px solid ${T.accent}`, paddingTop: 8 }}>Status Distribution</h3>
          {statusDistribution.map((s: any) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: s.color, display: "inline-block" }} />
              <span style={{ fontSize: 12, flex: 1 }}>{s.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: T.accent, textTransform: "uppercase", marginBottom: 16, borderTop: `2px solid ${T.accent}`, paddingTop: 8 }}>Gaps by Severity</h3>
          {gapsBySeverity.map((g: any) => (
            <div key={g.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 12, width: 60 }}>{g.label}</span>
              <div style={{ flex: 1, height: 6, background: T.inputBg, borderRadius: 3 }}>
                <div style={{ height: "100%", width: `${Math.min(g.value * 20, 100)}%`, background: severityMeta[g.label]?.color || T.grey, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, width: 20, textAlign: "right" }}>{g.value}</span>
            </div>
          ))}
        </div>
        <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: T.accent, textTransform: "uppercase", marginBottom: 16, borderTop: `2px solid ${T.accent}`, paddingTop: 8 }}>Remediation Progress</h3>
          {remediationProgress.map((r: any) => (
            <div key={r.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                <span>{r.label}</span>
                <span>{r.value}%</span>
              </div>
              <div style={{ height: 6, background: T.inputBg, borderRadius: 3 }}>
                <div style={{ height: "100%", width: `${r.value}%`, background: T.blue, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: T.accent, textTransform: "uppercase", marginBottom: 16, borderTop: `2px solid ${T.accent}`, paddingTop: 8 }}>Quick Actions</h3>
          <button onClick={() => goTo("frameworks")} style={{ display: "block", width: "100%", padding: "10px 14px", marginBottom: 8, background: T.accentSoft, border: `1px solid ${T.accent}33`, borderRadius: 8, color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>→ Manage Frameworks</button>
          <button onClick={() => goTo("requirements")} style={{ display: "block", width: "100%", padding: "10px 14px", marginBottom: 8, background: T.greenSoft, border: `1px solid ${T.green}33`, borderRadius: 8, color: T.green, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>→ View Requirements</button>
          <button onClick={() => goTo("gaps")} style={{ display: "block", width: "100%", padding: "10px 14px", marginBottom: 8, background: T.redSoft, border: `1px solid ${T.red}33`, borderRadius: 8, color: T.red, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>→ Open Gaps ({kpis.openGaps})</button>
          <button onClick={() => goTo("remediation")} style={{ display: "block", width: "100%", padding: "10px 14px", background: T.amberSoft, border: `1px solid ${T.amber}33`, borderRadius: 8, color: T.amber, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>→ Remediation Tasks</button>
        </div>
      </div>
    </div>
  );
}
