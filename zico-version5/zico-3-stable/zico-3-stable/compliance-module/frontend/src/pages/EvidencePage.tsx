import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { T, evidenceStatusMeta } from "../lib/theme";

export function EvidencePage() {
  const { data, isLoading } = useQuery({ queryKey: ["evidence"], queryFn: async () => (await api.get("/evidence")).data });
  if (isLoading) return <div style={{ color: T.textMuted }}>Loading...</div>;
  return (
    <div>
      <p style={{ fontSize: 12, color: T.textSecondary, marginBottom: 20 }}>{data?.total} evidence items</p>
      <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead><tr style={{ background: "#111114", borderBottom: `1px solid ${T.panelBorder}` }}>{["Code", "Name", "Requirement", "Type", "Owner", "Status"].map((h) => <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10.5, textTransform: "uppercase", color: T.textMuted, fontWeight: 700 }}>{h}</th>)}</tr></thead>
          <tbody>
            {data?.items.map((e: any) => (
              <tr key={e.id} style={{ borderBottom: `1px solid ${T.panelBorder}44` }}>
                <td style={{ padding: "12px 16px", color: T.accent, fontWeight: 600 }}>{e.code}</td>
                <td style={{ padding: "12px 16px", fontWeight: 500 }}>{e.name}</td>
                <td style={{ padding: "12px 16px", color: T.textSecondary }}>{e.requirement?.title || e.requirementId}</td>
                <td style={{ padding: "12px 16px", color: T.textSecondary }}>{e.type}</td>
                <td style={{ padding: "12px 16px", color: T.textSecondary }}>{e.owner}</td>
                <td style={{ padding: "12px 16px" }}><span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, background: evidenceStatusMeta[e.status]?.bg, color: evidenceStatusMeta[e.status]?.color }}>{e.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
