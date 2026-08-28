import { useRequirements, useReference } from "./hooks";
import { T, reqStatusMeta, Pill } from "./shared";

export function CrosswalksPage() {
  const { data: reqData } = useRequirements({ pageSize: 100 });
  const { data: ref } = useReference();

  const requirements = reqData?.items || [];
  const controls = ref?.controls || [];
  const risks = ref?.risks || [];
  const policies = ref?.policies || [];
  const assets = ref?.assets || [];

  const getName = (list: any[], id: string) => list.find((x: any) => x.id === id)?.name || "";

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Cross-Mapping</h1>
      <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>Visualize requirement relationships across framework → control → policy → risk → asset → evidence.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {requirements.map((req: any) => {
          const meta = reqStatusMeta(req.status);
          let mappedControls: string[] = [];
          try { mappedControls = JSON.parse(req.mappedControls || "[]"); } catch {}
          let relatedPolicies: string[] = [];
          try { relatedPolicies = JSON.parse(req.relatedPolicies || "[]"); } catch {}
          let relatedRisks: string[] = [];
          try { relatedRisks = JSON.parse(req.relatedRisks || "[]"); } catch {}
          let relatedAssets: string[] = [];
          try { relatedAssets = JSON.parse(req.relatedAssets || "[]"); } catch {}

          return (
            <div key={req.id} style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div><span style={{ fontSize: 11, color: T.accent, fontWeight: 600 }}>{req.code}</span> <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 8 }}>{req.title}</span></div>
                <Pill label={req.status} color={meta.color} bg={meta.bg} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Node color={T.purple} label="CONTROLS" value={mappedControls.length > 0 ? mappedControls.map((c) => getName(controls, c)).join(", ") || "None" : "None"} />
                <span style={{ color: T.textMuted }}>→</span>
                <Node color={T.accent} label="POLICIES" value={relatedPolicies.length > 0 ? relatedPolicies.map((p) => getName(policies, p)).join(", ") || "None" : "None"} />
                <span style={{ color: T.textMuted }}>→</span>
                <Node color={T.red} label="RISKS" value={relatedRisks.length > 0 ? relatedRisks.map((r) => getName(risks, r)).join(", ") || "None" : "None"} />
                <span style={{ color: T.textMuted }}>→</span>
                <Node color={T.grey} label="ASSETS" value={relatedAssets.length > 0 ? `${relatedAssets.length} linked` : "None"} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Node({ color, label, value }: any) {
  return (
    <div style={{ background: `${color}15`, border: `1px solid ${color}33`, borderRadius: 7, padding: "6px 10px", flex: "1 1 auto", minWidth: 100 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
    </div>
  );
}
