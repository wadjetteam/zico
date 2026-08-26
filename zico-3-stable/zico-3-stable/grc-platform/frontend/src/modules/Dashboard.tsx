import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutGrid, Shield, AlertTriangle, FileText, Users, Settings,
  ChevronRight, Search, Plus, Filter as FilterIcon, TrendingUp,
  CheckCircle2, Clock, XCircle, Building2, Target
} from "lucide-react";

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
  post: async (url: string, body: any) => {
    const token = localStorage.getItem("grc_token");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    return res.json();
  },
};

function KpiCard({ label, value, icon: Icon, color, bg }: any) {
  return (
    <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 10.5, textTransform: "uppercase", color: T.textMuted, fontWeight: 600 }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: T.textPrimary }}>{value}</div>
    </div>
  );
}

export default function ProductionDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get("http://localhost:5100/api/dashboard/summary"),
  });

  if (isLoading || !data) return <div style={{ color: T.textMuted, padding: 40 }}>Loading dashboard...</div>;

  const { totals, bySeverity, byCategory } = data;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: T.textPrimary }}>Executive Dashboard</h1>
      <p style={{ fontSize: 12.5, color: T.textMuted, marginBottom: 24 }}>Real-time GRC posture across all modules.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        <KpiCard label="Open Risks" value={totals?.openRisks ?? 0} Icon={AlertTriangle} color={T.amber} bg={T.amberSoft} />
        <KpiCard label="Closed Risks" value={totals?.closedRisks ?? 0} Icon={CheckCircle2} color={T.green} bg={T.greenSoft} />
        <KpiCard label="Assets" value={totals?.assets ?? 0} Icon={Building2} color={T.blue} bg={T.blueSoft} />
        <KpiCard label="Active Audits" value={totals?.activeAudits ?? 0} Icon={Target} color={T.accent} bg={T.accentSoft} />
        <KpiCard label="Frameworks" value={totals?.frameworks ?? 0} Icon={Shield} color={T.purple || "#b183e0"} bg={T.purpleSoft || "rgba(177,131,224,0.14)"} />
        <KpiCard label="Policies" value={totals?.policies ?? 0} Icon={FileText} color={T.green} bg={T.greenSoft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary, marginBottom: 12 }}>Risks by Severity</h3>
          {(bySeverity || []).map((s: any) => (
            <div key={s.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.panelBorder}` }}>
              <span style={{ fontSize: 12, color: T.textSecondary }}>{s.name}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary }}>{s.value}</span>
            </div>
          ))}
        </div>
        <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary, marginBottom: 12 }}>Risks by Category</h3>
          {(byCategory || []).slice(0, 6).map((c: any) => (
            <div key={c.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.panelBorder}` }}>
              <span style={{ fontSize: 12, color: T.textSecondary }}>{c.name}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary }}>{c.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
