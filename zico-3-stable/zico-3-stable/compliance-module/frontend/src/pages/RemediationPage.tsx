import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { T, remediationStatusMeta, isOverdue, fmtDate } from "../lib/theme";
import { useAuth } from "../context/AuthContext";

export function RemediationPage() {
  const { data, isLoading } = useQuery({ queryKey: ["remediation"], queryFn: async () => (await api.get("/remediation")).data });
  const { canWrite } = useAuth();
  const qc = useQueryClient();

  const updateProgress = async (id: string, progress: number) => {
    await api.patch(`/remediation/${id}/progress`, { progress });
    qc.invalidateQueries({ queryKey: ["remediation"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  if (isLoading) return <div style={{ color: T.textMuted }}>Loading...</div>;
  return (
    <div>
      <p style={{ fontSize: 12, color: T.textSecondary, marginBottom: 20 }}>{data?.total} remediation tasks</p>
      <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead><tr style={{ background: "#111114", borderBottom: `1px solid ${T.panelBorder}` }}>{["Code", "Gap", "Owner", "Priority", "Due Date", "Status", "Progress"].map((h) => <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10.5, textTransform: "uppercase", color: T.textMuted, fontWeight: 700 }}>{h}</th>)}</tr></thead>
          <tbody>
            {data?.items.map((r: any) => (
              <tr key={r.id} style={{ borderBottom: `1px solid ${T.panelBorder}44` }}>
                <td style={{ padding: "12px 16px", color: T.accent, fontWeight: 600 }}>{r.code}</td>
                <td style={{ padding: "12px 16px", color: T.textSecondary }}>{r.gapId?.slice(0, 8)}...</td>
                <td style={{ padding: "12px 16px", color: T.textSecondary }}>{r.owner}</td>
                <td style={{ padding: "12px 16px", color: T.textSecondary }}>{r.priority}</td>
                <td style={{ padding: "12px 16px", color: isOverdue(r.dueDate, r.status, ["Completed", "Cancelled"]) ? T.red : T.textSecondary }}>{fmtDate(r.dueDate)}</td>
                <td style={{ padding: "12px 16px" }}><span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, background: remediationStatusMeta[r.status]?.bg, color: remediationStatusMeta[r.status]?.color }}>{r.status}</span></td>
                <td style={{ padding: "12px 16px", width: 140 }}>
                  <input type="range" min={0} max={100} value={r.progress} onChange={(e) => updateProgress(r.id, Number(e.target.value))} disabled={!canWrite} style={{ width: "100%" }} />
                  <span style={{ fontSize: 11, color: T.textMuted }}>{r.progress}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
