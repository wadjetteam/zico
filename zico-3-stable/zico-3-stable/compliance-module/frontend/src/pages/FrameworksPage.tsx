import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { T, reqStatusMeta } from "../lib/theme";
import { useAuth } from "../context/AuthContext";

export function FrameworksPage() {
  const { data, isLoading } = useQuery({ queryKey: ["frameworks"], queryFn: async () => (await api.get("/frameworks")).data });
  const { canWrite } = useAuth();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Standard", version: "", issuer: "", description: "", status: "Active" });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/frameworks", form);
    qc.invalidateQueries({ queryKey: ["frameworks"] });
    setCreating(false);
    setForm({ name: "", type: "Standard", version: "", issuer: "", description: "", status: "Active" });
  };

  if (isLoading) return <div style={{ color: T.textMuted }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: T.textSecondary }}>{data?.total} frameworks</p>
        {canWrite && <button onClick={() => setCreating(true)} style={{ background: T.accent, color: "#1a1508", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>+ New Framework</button>}
      </div>
      <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: "#111114", borderBottom: `1px solid ${T.panelBorder}` }}>
              {["Code", "Name", "Type", "Version", "Issuer", "Status", "Reqs"].map((h) => <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10.5, textTransform: "uppercase", color: T.textMuted, fontWeight: 700 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {data?.items.map((f: any) => (
              <tr key={f.id} style={{ borderBottom: `1px solid ${T.panelBorder}44` }}>
                <td style={{ padding: "12px 16px", color: T.accent, fontWeight: 600 }}>{f.code}</td>
                <td style={{ padding: "12px 16px", fontWeight: 500 }}>{f.name}</td>
                <td style={{ padding: "12px 16px", color: T.textSecondary }}>{f.type}</td>
                <td style={{ padding: "12px 16px", color: T.textSecondary }}>{f.version}</td>
                <td style={{ padding: "12px 16px", color: T.textSecondary }}>{f.issuer}</td>
                <td style={{ padding: "12px 16px" }}><span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, background: f.status === "Active" ? T.greenSoft : T.greySoft, color: f.status === "Active" ? T.green : T.grey }}>{f.status}</span></td>
                <td style={{ padding: "12px 16px", color: T.textSecondary }}>{f.requirementCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {creating && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", justifyContent: "flex-end", zIndex: 100 }}>
          <div style={{ width: 480, height: "100%", background: T.panelBg, padding: 24, overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>New Framework</h2>
              <button onClick={() => setCreating(false)} style={{ background: "none", border: "none", color: T.textSecondary, fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <form onSubmit={create}>
              <label style={{ fontSize: 11, color: T.textSecondary, display: "block", marginBottom: 4 }}>Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: "100%", marginBottom: 12, background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 11px", color: T.textPrimary, fontSize: 13 }} />
              <label style={{ fontSize: 11, color: T.textSecondary, display: "block", marginBottom: 4 }}>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ width: "100%", marginBottom: 12, background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 11px", color: T.textPrimary, fontSize: 13 }}>
                <option value="Standard">Standard</option><option value="Regulation">Regulation</option><option value="InternalPolicyBaseline">Internal Policy Baseline</option>
              </select>
              <label style={{ fontSize: 11, color: T.textSecondary, display: "block", marginBottom: 4 }}>Version</label>
              <input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} style={{ width: "100%", marginBottom: 12, background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 11px", color: T.textPrimary, fontSize: 13 }} />
              <label style={{ fontSize: 11, color: T.textSecondary, display: "block", marginBottom: 4 }}>Issuer</label>
              <input value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} style={{ width: "100%", marginBottom: 12, background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 11px", color: T.textPrimary, fontSize: 13 }} />
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
