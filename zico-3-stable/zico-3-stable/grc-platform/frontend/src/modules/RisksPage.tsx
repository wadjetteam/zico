import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Eye, Pencil, Search, Filter as FilterIcon } from "lucide-react";

const T = {
  bg: "#0b0b0d", sidebarBg: "#0e0e11", panelBg: "#141417", panelBorder: "#232327",
  textPrimary: "#f2f2f0", textSecondary: "#8c8c94", textMuted: "#5c5c64",
  accent: "#d9ad4f", accentSoft: "rgba(217,173,79,0.14)",
  green: "#3fbf6a", greenSoft: "rgba(63,191,106,0.14)",
  amber: "#e0b23d", amberSoft: "rgba(224,178,61,0.14)",
  red: "#e2584f", redSoft: "rgba(226,88,79,0.14)",
  blue: "#7c8ff0", blueSoft: "rgba(124,143,240,0.14)",
};

const api = {
  get: async (url: string) => {
    const token = localStorage.getItem("grc_token");
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  },
};

function Pill({ label, color, bg }: any) {
  return <span style={{ fontSize: 11, fontWeight: 600, color, background: bg, padding: "3px 8px", borderRadius: 6 }}>{label}</span>;
}

export default function RisksPage() {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");

  const { data, isLoading } = useQuery({
    queryKey: ["risks"],
    queryFn: () => api.get("http://localhost:5100/api/risks"),
  });

  if (isLoading) return <div style={{ color: T.textMuted, padding: 40 }}>Loading...</div>;

  const risks = data?.items || [];
  const filtered = risks.filter((r: any) => {
    const q = search.trim().toLowerCase();
    return (!q || r.title?.toLowerCase().includes(q) || r.riskCode?.toLowerCase().includes(q)) &&
      (severityFilter === "All" || r.severity?.code === severityFilter);
  });

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: T.textPrimary }}>Risk Register</h1>
      <p style={{ fontSize: 12.5, color: T.textMuted, marginBottom: 20 }}>Enterprise risk inventory with real-time scoring.</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 12px", flex: 1 }}>
          <Search size={14} color={T.textMuted} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search risks..." style={{ background: "transparent", border: "none", outline: "none", color: T.textPrimary, fontSize: 13, width: "100%" }} />
        </div>
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} style={{ background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 12px", color: T.textPrimary, fontSize: 13 }}>
          <option value="All">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead><tr style={{ background: "#1111114" }}>
            {["Code", "Title", "Severity", "Score", "Status", "Owner"].map((h) => (
              <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10.5, textTransform: "uppercase", color: T.textMuted, fontWeight: 700, borderBottom: `1px solid ${T.panelBorder}` }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map((r: any) => (
              <tr key={r.id} style={{ borderBottom: `1px solid ${T.panelBorder}` }}>
                <td style={{ padding: "12px 16px", color: T.accent, fontWeight: 600 }}>{r.riskCode}</td>
                <td style={{ padding: "12px 16px", color: T.textPrimary }}>{r.title}</td>
                <td style={{ padding: "12px 16px" }}><Pill label={r.severity?.label || "—"} color={r.severity?.color || T.grey} bg={`${r.severity?.color || T.grey}22`} /></td>
                <td style={{ padding: "12px 16px", color: T.textPrimary }}>{r.residualScore || 0}</td>
                <td style={{ padding: "12px 16px" }}><Pill label={r.status} color={r.status === "Active" ? T.green : T.grey} bg={r.status === "Active" ? T.greenSoft : T.greySoft} /></td>
                <td style={{ padding: "12px 16px", color: T.textSecondary }}>{r.ownerId}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>No risks found.</div>}
      </div>
    </div>
  );
}
