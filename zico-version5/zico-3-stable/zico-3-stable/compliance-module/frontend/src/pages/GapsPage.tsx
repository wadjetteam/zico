import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { T, gapStatusMeta, severityMeta, isOverdue, fmtDate } from "../lib/theme";
import { useAuth } from "../context/AuthContext";

export function GapsPage({ goTo }: { goTo: (p: string) => void }) {
  const { data, isLoading } = useQuery({ queryKey: ["gaps"], queryFn: async () => (await api.get("/gaps")).data });
  const { canWrite } = useAuth();
  if (isLoading) return <div style={{ color: T.textMuted }}>Loading...</div>;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: T.textSecondary }}>{data?.total} gaps</p>
        {canWrite && <button onClick={() => goTo("remediation")} style={{ background: T.accent, color: "#1a1508", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>+ Create Remediation</button>}
      </div>
      <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead><tr style={{ background: "#111114", borderBottom: `1px solid ${T.panelBorder}` }}>{["Code", "Requirement", "Severity", "Owner", "Due Date", "Status"].map((h) => <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10.5, textTransform: "uppercase", color: T.textMuted, fontWeight: 700 }}>{h}</th>)}</tr></thead>
          <tbody>
            {data?.items.map((g: any) => (
              <tr key={g.id} style={{ borderBottom: `1px solid ${T.panelBorder}44` }}>
                <td style={{ padding: "12px 16px", color: T.accent, fontWeight: 600 }}>{g.code}</td>
                <td style={{ padding: "12px 16px" }}>{g.requirement?.title || g.requirementId}</td>
                <td style={{ padding: "12px 16px" }}><span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, background: severityMeta[g.severity]?.bg, color: severityMeta[g.severity]?.color }}>{g.severity}</span></td>
                <td style={{ padding: "12px 16px", color: T.textSecondary }}>{g.owner}</td>
                <td style={{ padding: "12px 16px", color: isOverdue(g.dueDate, g.status, ["Resolved", "Closed"]) ? T.red : T.textSecondary }}>{fmtDate(g.dueDate)}</td>
                <td style={{ padding: "12px 16px" }}><span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, background: gapStatusMeta[g.status]?.bg, color: gapStatusMeta[g.status]?.color }}>{g.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
