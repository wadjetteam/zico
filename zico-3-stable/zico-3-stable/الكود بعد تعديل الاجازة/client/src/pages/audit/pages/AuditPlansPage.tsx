import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Eye, Pencil, CalendarCheck2, CircleSlash, X, BadgeCheck, CheckCircle2 } from "lucide-react";
import auditApi from "../api";
import { PageHeading, Toolbar, FilterSelect, DataTable, useSort, Pill, T, SectionLabel, DetailRow, Field, EmptyState, inputStyle, selectStyle, primaryBtnStyle, secondaryBtnStyle, iconBtnStyle } from "../../compliance/shared";

const PLAN_STATUSES = ["Draft", "Planned", "Approved", "Scheduled", "Cancelled"];
const AUDIT_TYPES = ["Internal Audit", "External Audit", "Compliance Audit", "Control Effectiveness Audit", "Risk-Based Audit", "Follow-up Audit"];
const PRIORITIES = ["Critical", "High", "Medium", "Low"];

const planStatusMeta: Record<string, { color: string; bg: string }> = {
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
  const [detail, setDetail] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const { sort, toggle, apply } = useSort("planCode");

  const { data, isLoading } = useQuery({
    queryKey: ["audit-plans"],
    queryFn: async () => (await auditApi.get("/plans", { params: { pageSize: 100 } })).data,
  });

  const createMutation = useMutation({
    mutationFn: (plan: any) => auditApi.post("/plans", plan),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["audit-plans"] }); setCreating(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...plan }: any) => auditApi.put(`/plans/${id}`, plan),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["audit-plans"] }); setEditing(null); },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => auditApi.post(`/plans/${id}/approve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["audit-plans"] }); qc.invalidateQueries({ queryKey: ["audit-audits"] }); },
  });

  const plans = data?.items || [];
  const filtered = apply(plans.filter((p: any) => {
    const q = search.trim().toLowerCase();
    return (!q || p.name?.toLowerCase().includes(q) || p.planCode?.toLowerCase().includes(q)) && (statusFilter === "All" || p.status === statusFilter);
  }));

  const columns = [
    { key: "planCode", label: "Plan ID" },
    { key: "name", label: "Audit Name", render: (r: any) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { key: "type", label: "Type" },
    { key: "priority", label: "Priority", render: (r: any) => <Pill label={r.priority || "Medium"} color={r.priority === "Critical" ? T.red : T.amber} bg={r.priority === "Critical" ? T.redSoft : T.amberSoft} /> },
    { key: "status", label: "Status", render: (r: any) => <Pill label={r.status} {...planStatusMeta[r.status] || { color: T.grey, bg: T.greySoft }} /> },
    { key: "plannedStart", label: "Start", render: (r: any) => r.plannedStart?.slice(0, 10) || "—" },
  ];

  return (
    <div>
      <PageHeading title="Audit Plans" subtitle="Planned audit activity awaiting approval and scheduling." action={<button onClick={() => setCreating(true)} style={{ ...primaryBtnStyle, padding: "10px 16px" }}><Plus size={14} style={{ marginRight: 6 }} /> New Plan</button>} />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search audit plans…" resultCount={filtered.length} totalCount={plans.length} right={<FilterSelect value={statusFilter} options={["All", ...PLAN_STATUSES]} onChange={setStatusFilter} />} />
      <DataTable columns={columns} rows={filtered} sort={sort} onSort={toggle} onRowClick={(r) => setDetail(r)} renderActions={(r: any) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setDetail(r)} style={iconBtnStyle} title="View"><Eye size={13} color={T.textSecondary} /></button>
          <button onClick={() => setEditing(r)} style={iconBtnStyle} title="Edit"><Pencil size={13} color={T.textSecondary} /></button>
          {(r.status === "Draft" || r.status === "Planned") && <button onClick={() => approveMutation.mutate(r.id)} style={iconBtnStyle} title="Approve & Schedule"><CalendarCheck2 size={13} color={T.green} /></button>}
          {r.status !== "Cancelled" && r.status !== "Scheduled" && <button onClick={() => updateMutation.mutate({ id: r.id, status: "Cancelled" })} style={iconBtnStyle} title="Cancel"><CircleSlash size={13} color={T.red} /></button>}
        </div>
      )} />

      {detail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", justifyContent: "flex-end", zIndex: 100 }}>
          <div style={{ width: 520, height: "100%", background: T.panelBg, padding: 24, overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div><div style={{ fontSize: 11, color: T.textMuted }}>{detail.planCode}</div><div style={{ fontSize: 16, fontWeight: 700 }}>{detail.name}</div></div>
              <button onClick={() => setDetail(null)} style={iconBtnStyle}><X size={15} /></button>
            </div>
            <SectionLabel>Plan Information</SectionLabel>
            <p style={{ fontSize: 12.5, color: T.textSecondary, lineHeight: 1.6 }}>{detail.description || "No description"}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              <DetailRow k="Type" v={detail.type} />
              <DetailRow k="Priority" v={detail.priority || "Medium"} />
              <DetailRow k="Status" v={detail.status} />
              <DetailRow k="Planned Start" v={detail.plannedStart?.slice(0, 10) || "—"} />
              <DetailRow k="Planned End" v={detail.plannedEnd?.slice(0, 10) || "—"} />
              <DetailRow k="Owner" v={detail.owner} />
              <DetailRow k="Lead Auditor" v={detail.leadAuditor} />
              <DetailRow k="Auditee" v={detail.auditee} />
              <DetailRow k="Department" v={detail.department} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setDetail(null)} style={secondaryBtnStyle}>Close</button>
              <button onClick={() => { setDetail(null); setEditing(detail); }} style={primaryBtnStyle}><Pencil size={13} style={{ marginRight: 6 }} /> Edit</button>
            </div>
          </div>
        </div>
      )}

      {(creating || editing) && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", justifyContent: "flex-end", zIndex: 100 }}>
          <div style={{ width: 480, height: "100%", background: T.panelBg, padding: 24, overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>{creating ? "New Audit Plan" : "Edit Plan"}</h2>
              <button onClick={() => { setCreating(false); setEditing(null); }} style={iconBtnStyle}><X size={15} /></button>
            </div>
            <PlanForm initial={editing} onClose={() => { setCreating(false); setEditing(null); }} onSave={(plan) => { if (creating) createMutation.mutate(plan); else updateMutation.mutate({ id: editing.id, ...plan }); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function PlanForm({ initial, onClose, onSave }: any) {
  const [form, setForm] = useState(initial || { name: "", type: "Internal Audit", objective: "", plannedStart: "", plannedEnd: "", owner: "", leadAuditor: "", priority: "Medium", auditee: "", department: "", description: "", frameworkId: "FRW-001" });
  const [error, setError] = useState("");
  const set = (f: string, v: any) => setForm((x: any) => ({ ...x, [f]: v }));
  const save = () => { if (!form.name.trim()) return setError("Name is required"); onSave(form); };

  return (
    <>
      <Field label="Audit Name" required error={error}><input value={form.name} onChange={(e) => set("name", e.target.value)} style={inputStyle()} /></Field>
      <Field label="Objective"><textarea value={form.objective} onChange={(e) => set("objective", e.target.value)} rows={2} style={inputStyle()} /></Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Type"><select value={form.type} onChange={(e) => set("type", e.target.value)} style={selectStyle()}>{AUDIT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field></div>
        <div style={{ flex: 1 }}><Field label="Priority"><select value={form.priority} onChange={(e) => set("priority", e.target.value)} style={selectStyle()}>{PRIORITIES.map((t) => <option key={t}>{t}</option>)}</select></Field></div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Planned Start"><input type="date" value={form.plannedStart} onChange={(e) => set("plannedStart", e.target.value)} style={inputStyle()} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Planned End"><input type="date" value={form.plannedEnd} onChange={(e) => set("plannedEnd", e.target.value)} style={inputStyle()} /></Field></div>
      </div>
      <Field label="Owner"><input value={form.owner} onChange={(e) => set("owner", e.target.value)} style={inputStyle()} /></Field>
      <Field label="Lead Auditor"><input value={form.leadAuditor} onChange={(e) => set("leadAuditor", e.target.value)} style={inputStyle()} /></Field>
      <Field label="Auditee"><input value={form.auditee} onChange={(e) => set("auditee", e.target.value)} style={inputStyle()} /></Field>
      <Field label="Department"><input value={form.department} onChange={(e) => set("department", e.target.value)} style={inputStyle()} /></Field>
      <Field label="Description"><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} style={inputStyle()} /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <button onClick={onClose} style={secondaryBtnStyle}>Cancel</button>
        <button onClick={save} style={primaryBtnStyle}>Save Plan</button>
      </div>
    </>
  );
}
