import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { T, reqStatusMeta } from "../lib/theme";
import { useAuth } from "../context/AuthContext";

export function RequirementsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["requirements"], queryFn: async () => (await api.get("/requirements")).data });
  const { canWrite } = useAuth();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", frameworkId: "", category: "", status: "NotAssessed" });
  const [frameworks, setFrameworks] = useState<any[]>([]);

  const openCreate = async () => {
    const fw = await api.get("/frameworks");
    setFrameworks(fw.data.items);
    setCreating(true);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/requirements", form);
    qc.invalidateQueries({ queryKey: ["requirements"] });
    setCreating(false);
  };

  if (isLoading) return <div style={{ color: T.textMuted }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: T.textSecondary }}>{data?.total} requirements</p>
        {canWrite && <button onClick={openCreate} style={{ background: T.accent, color: "#1a1508", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>+ New Requirement</button>}
      </div>
      <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead><tr style={{ background: "#111114", borderBottom: `1px solid ${T.panelBorder}` }}>{["Code", "Title", "Framework", "Category", "Status"].map((h) => <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10.5, textTransform: "uppercase", color: T.textMuted, fontWeight: 700 }}>{h}</th>)}</tr></thead>
          <tbody>
            {data?.items.map((r: any) => (
              <tr key={r.id} style={{ borderBottom: `1px solid ${T.panelBorder}44` }}>
                <td style={{ padding: "12px 16px", color: T.accent, fontWeight: 600 }}>{r.code}</td>
                <td style={{ padding: "12px 16px", fontWeight: 500 }}>{r.title}</td>
                <td style={{ padding: "12px 16px", color: T.textSecondary }}>{r.framework?.name || r.frameworkId}</td>
                <td style={{ padding: "12px 16px", color: T.textSecondary }}>{r.category}</td>
                <td style={{ padding: "12px 16px" }}><span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, background: reqStatusMeta[r.status]?.bg || T.greySoft, color: reqStatusMeta[r.status]?.color || T.grey }}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {creating && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", justifyContent: "flex-end", zIndex: 100 }}>
          <div style={{ width: 480, height: "100%", background: T.panelBg, padding: 24, overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}><h2 style={{ fontSize: 16, fontWeight: 600 }}>New Requirement</h2><button onClick={() => setCreating(false)} style={{ background: "none", border: "none", color: T.textSecondary, fontSize: 18, cursor: "pointer" }}>✕</button></div>
            <form onSubmit={create}>
              <label style={{ fontSize: 11, color: T.textSecondary, display: "block", marginBottom: 4 }}>Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ width: "100%", marginBottom: 12, background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 11px", color: T.textPrimary, fontSize: 13 }} />
              <label style={{ fontSize: 11, color: T.textSecondary, display: "block", marginBottom: 4 }}>Framework *</label>
              <select value={form.frameworkId} onChange={(e) => setForm({ ...form, frameworkId: e.target.value })} style={{ width: "100%", marginBottom: 12, background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 11px", color: T.textPrimary, fontSize: 13 }}>
                <option value="">Select framework</option>
                {frameworks.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <label style={{ fontSize: 11, color: T.textSecondary, display: "block", marginBottom: 4 }}>Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ width: "100%", marginBottom: 12, background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 11px", color: T.textPrimary, fontSize: 13 }} />
              <label style={{ fontSize: 11, color: T.textSecondary, display: "block", marginBottom: 4 }}>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ width: "100%", marginBottom: 12, background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 11px", color: T.textPrimary, fontSize: 13, resize: "vertical" }} />
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setCreating(false)} style={{ background: "transparent", border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 16px", color: T.textSecondary, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ background: T.accent, color: "#1a1508", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
