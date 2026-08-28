import { useState } from "react";
import { Plus, Eye, Pencil, Archive, X } from "lucide-react";
import { useFrameworks, useRequirements, useCreateFramework, useDashboard } from "./hooks";
import { T, Pill, ProgressBar, FilterSelect, DataTable, useSort, Toolbar, SectionLabel, DetailRow, Field, complianceScore, FRAMEWORK_STATUSES, reqStatusMeta } from "./shared";
import { Badge } from "./shared";

export function FrameworksPage() {
  const { data: fwData, isLoading } = useFrameworks();
  const { data: reqData } = useRequirements();
  const { data: dashData } = useDashboard();
  const createMutation = useCreateFramework();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [creating, setCreating] = useState(false);
  const { sort, toggle, apply } = useSort("code");

  if (isLoading || !fwData) return <div style={{ color: T.textMuted }}>Loading...</div>;

  const frameworks = fwData.items || [];
  const requirements = reqData?.items || [];

  const enriched = frameworks.map((f: any) => {
    const reqs = requirements.filter((r: any) => r.frameworkId === f.id);
    return { ...f, requirementCount: reqs.length, compliancePct: complianceScore(reqs) };
  });

  const filtered = apply(enriched.filter((f: any) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || f.name?.toLowerCase().includes(q) || f.issuer?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || f.status === statusFilter;
    return matchSearch && matchStatus;
  }));

  const save = (fw: any) => {
    createMutation.mutate(fw, { onSuccess: () => setCreating(false) });
  };

  const columns = [
    { key: "code", label: "ID" },
    { key: "name", label: "Framework", render: (r: any) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { key: "type", label: "Type" },
    { key: "version", label: "Version" },
    { key: "issuer", label: "Issuer" },
    { key: "status", label: "Status", render: (r: any) => <Pill label={r.status} color={r.status === "Active" ? T.green : T.grey} bg={r.status === "Active" ? T.greenSoft : T.greySoft} /> },
    { key: "requirementCount", label: "Reqs" },
    { key: "compliancePct", label: "Compliance", render: (r: any) => <ProgressBar value={r.compliancePct} color={r.compliancePct >= 70 ? T.green : r.compliancePct >= 40 ? T.amber : T.red} /> },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 700 }}>Frameworks & Regulations</h1><p style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Frameworks tracked for compliance coverage.</p></div>
        <button onClick={() => setCreating(true)} style={{ background: T.accent, color: "#1a1508", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}><Plus size={14} style={{ marginRight: 6 }} /> Add Framework</button>
      </div>
      <Toolbar search={search} onSearch={setSearch} placeholder="Search frameworks…" resultCount={filtered.length} totalCount={frameworks.length} right={<FilterSelect label="" value={statusFilter} options={["All", ...FRAMEWORK_STATUSES]} onChange={setStatusFilter} />} />
      <DataTable columns={columns} rows={filtered} sort={sort} onSort={toggle} />
      {creating && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", justifyContent: "flex-end", zIndex: 100 }}>
          <div style={{ width: 480, height: "100%", background: T.panelBg, padding: 24, overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}><h2 style={{ fontSize: 16, fontWeight: 600 }}>Add Framework</h2><button onClick={() => setCreating(false)} style={{ background: "none", border: "none", color: T.textSecondary, fontSize: 18, cursor: "pointer" }}>✕</button></div>
            <FieldDrawer onSave={save} onClose={() => setCreating(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function FieldDrawer({ onSave, onClose }: any) {
  const [form, setForm] = useState({ name: "", type: "Standard", version: "", issuer: "", description: "", status: "Active" });
  const [error, setError] = useState("");
  const set = (f: string, v: any) => setForm((x: any) => ({ ...x, [f]: v }));
  const save = () => { if (!form.name.trim()) return setError("Name required"); onSave(form); };
  return (
    <>
      <Field label="Framework Name" required error={error}><input value={form.name} onChange={(e) => set("name", e.target.value)} style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 11px", color: T.textPrimary, fontSize: 13 }} /></Field>
      <Field label="Type"><select value={form.type} onChange={(e) => set("type", e.target.value)} style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 11px", color: T.textPrimary, fontSize: 13 }}>{["Standard", "Regulation", "Internal Policy Baseline"].map((t) => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Version"><input value={form.version} onChange={(e) => set("version", e.target.value)} style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 11px", color: T.textPrimary, fontSize: 13 }} /></Field>
      <Field label="Issuer"><input value={form.issuer} onChange={(e) => set("issuer", e.target.value)} style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 11px", color: T.textPrimary, fontSize: 13 }} /></Field>
      <Field label="Description"><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 11px", color: T.textPrimary, fontSize: 13, resize: "vertical" }} /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 16px", color: T.textSecondary, fontSize: 12, cursor: "pointer" }}>Cancel</button>
        <button onClick={save} style={{ background: T.accent, color: "#1a1508", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Create</button>
      </div>
    </>
  );
}
