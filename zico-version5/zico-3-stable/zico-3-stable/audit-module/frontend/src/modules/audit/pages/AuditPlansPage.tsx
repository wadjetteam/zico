import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Eye, Pencil } from "lucide-react";
import auditApi from "../api/client";
import { PageHeading, Toolbar, FilterSelect, DataTable, useSort, Pill, T, FONT_STACK, Badge, SectionLabel, Field, inputStyle, selectStyle, primaryBtnStyle, secondaryBtnStyle } from "../components/shared";

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  Draft: { color: T.grey, bg: T.greySoft },
  Planned: { color: T.blue, bg: T.blueSoft },
  Approved: { color: T.green, bg: T.greenSoft },
  Scheduled: { color: T.accent, bg: T.accentSoft },
  Cancelled: { color: T.red, bg: T.redSoft },
};

export default function AuditPlansPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Regular", objective: "", plannedStart: "", plannedEnd: "", owner: "", leadAuditor: "", priority: "Medium", description: "" });
  const [error, setError] = useState("");
  const { sort, toggle, apply } = useSort("planCode");

  const { data, isLoading } = useQuery({
    queryKey: ["audit-plans", search, statusFilter, typeFilter],
    queryFn: async () => {
      const params: any = { search: search || undefined, page: 1, pageSize: 50 };
      if (statusFilter !== "All") params.status = statusFilter;
      if (typeFilter !== "All") params.type = typeFilter;
      return (await auditApi.get("/plans", { params })).data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (newPlan: any) => auditApi.post("/plans", newPlan),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["audit-plans"] }); setCreating(false); setForm({ name: "", type: "Regular", objective: "", plannedStart: "", plannedEnd: "", owner: "", leadAuditor: "", priority: "Medium", description: "" }); },
    onError: (err: any) => setError(err?.response?.data?.message || err.message),
  });

  const filtered = apply((data?.items || []).filter((p: any) => {
    const q = search.toLowerCase();
    return !q || p.name?.toLowerCase().includes(q) || p.planCode?.toLowerCase().includes(q);
  }));

  const columns = [
    { key: "planCode", label: "Code" },
    { key: "name", label: "Name" },
    { key: "type", label: "Type" },
    { key: "priority", label: "Priority" },
    { key: "status", label: "Status", render: (r: any) => <Pill label={r.status} {...STATUS_STYLES[r.status] || { color: T.grey, bg: T.greySoft }} /> },
    { key: "plannedStart", label: "Start", render: (r: any) => r.plannedStart?.slice(0, 10) || "—" },
    { key: "plannedEnd", label: "End", render: (r: any) => r.plannedEnd?.slice(0, 10) || "—" },
  ];

  return (
    <div>
      <PageHeading title="Audit Plans" subtitle="Plan and schedule audit engagements." action={<button onClick={() => setCreating(true)} style={primaryBtnStyle}><Plus size={14} style={{ marginRight: 6 }} /> New Plan</button>} />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search plans..." right={<><FilterSelect label="" value={statusFilter} options={["All", "Draft", "Planned", "Approved", "Scheduled", "Cancelled"]} onChange={setStatusFilter} /><FilterSelect label="" value={typeFilter} options={["All", "Regular", "Internal Audit", "External Audit", "Compliance Audit", "Follow-up Audit"]} onChange={setTypeFilter} /></>} resultCount={filtered.length} totalCount={data?.total || 0} />
      <DataTable columns={columns} rows={filtered} sort={sort} onSort={toggle} renderActions={(r) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button style={iconBtnStyle} title="View"><Eye size={13} color={T.textSecondary} /></button>
          <button style={iconBtnStyle} title="Edit"><Pencil size={13} color={T.textSecondary} /></button>
        </div>
      )} />

      {creating && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", justifyContent: "flex-end", zIndex: 100 }}>
          <div style={{ width: 480, height: "100%", background: T.panelBg, padding: 24, overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}><h2 style={{ fontSize: 16, fontWeight: 600 }}>New Audit Plan</h2><button onClick={() => setCreating(false)} style={iconBtnStyle}>✕</button></div>
            {error && <div style={{ background: T.redSoft, color: T.red, padding: "8px 12px", borderRadius: 6, fontSize: 12, marginBottom: 16 }}>{error}</div>}
            <Field label="Name" required><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle()} /></Field>
            <Field label="Type"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={selectStyle()}>{["Regular", "Internal Audit", "External Audit", "Compliance Audit", "Control Effectiveness Audit", "Risk-Based Audit", "Follow-up Audit"].map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Objective"><textarea value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} rows={2} style={inputStyle()} /></Field>
            <Field label="Owner"><input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} style={inputStyle()} /></Field>
            <Field label="Lead Auditor"><input value={form.leadAuditor} onChange={(e) => setForm({ ...form, leadAuditor: e.target.value })} style={inputStyle()} /></Field>
            <div style={{ display: "flex", gap: 12 }}><div style={{ flex: 1 }}><Field label="Planned Start"><input type="date" value={form.plannedStart} onChange={(e) => setForm({ ...form, plannedStart: e.target.value })} style={inputStyle()} /></Field></div><div style={{ flex: 1 }}><Field label="Planned End"><input type="date" value={form.plannedEnd} onChange={(e) => setForm({ ...form, plannedEnd: e.target.value })} style={inputStyle()} /></Field></div></div>
            <Field label="Priority"><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={selectStyle()}>{["Critical", "High", "Medium", "Low"].map((p) => <option key={p}>{p}</option>)}</select></Field>
            <Field label="Description"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={inputStyle()} /></Field>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><button onClick={() => setCreating(false)} style={secondaryBtnStyle}>Cancel</button><button onClick={() => createMutation.mutate(form)} style={primaryBtnStyle}>{createMutation.isPending ? "Creating..." : "Create Plan"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

const iconBtnStyle = { border: `1px solid ${T.panelBorder}`, background: T.inputBg, borderRadius: 7, padding: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
