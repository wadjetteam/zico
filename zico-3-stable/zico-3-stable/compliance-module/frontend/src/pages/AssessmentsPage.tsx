import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { T, reqStatusMeta } from "../lib/theme";

export function AssessmentsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["assessments"], queryFn: async () => (await api.get("/assessments")).data });
  if (isLoading) return <div style={{ color: T.textMuted }}>Loading...</div>;
  return (
    <div>
      <p style={{ fontSize: 12, color: T.textSecondary, marginBottom: 20 }}>{data?.total} assessments (append-only)</p>
      <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead><tr style={{ background: "#111114", borderBottom: `1px solid ${T.panelBorder}` }}>{["Code", "Requirement", "Result", "Assessor", "Date", "Review"].map((h) => <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10.5, textTransform: "uppercase", color: T.textMuted, fontWeight: 700 }}>{h}</th>)}</tr></thead>
          <tbody>
            {data?.items.map((a: any) => (
              <tr key={a.id} style={{ borderBottom: `1px solid ${T.panelBorder}44` }}>
                <td style={{ padding: "12px 16px", color: T.accent, fontWeight: 600 }}>{a.code}</td>
                <td style={{ padding: "12px 16px" }}>{a.requirement?.title || a.requirementId}</td>
                <td style={{ padding: "12px 16px" }}><span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, background: reqStatusMeta[a.status]?.bg, color: reqStatusMeta[a.status]?.color }}>{a.status}</span></td>
                <td style={{ padding: "12px 16px", color: T.textSecondary }}>{a.assessor}</td>
                <td style={{ padding: "12px 16px", color: T.textSecondary }}>{new Date(a.date).toISOString().slice(0, 10)}</td>
                <td style={{ padding: "12px 16px" }}><span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, background: a.reviewStatus === "Reviewed" ? T.greenSoft : T.amberSoft, color: a.reviewStatus === "Reviewed" ? T.green : T.amber }}>{a.reviewStatus}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
