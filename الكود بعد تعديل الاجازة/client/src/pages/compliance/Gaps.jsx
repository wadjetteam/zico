import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { ErrorState } from "../../components/States";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import { chipClass, fmtDate, fmtDateInput } from "../../lib/format";

const SEVERITIES = ["Low", "Medium", "High", "Critical"];
const STATUSES = ["Open", "In Progress", "Closed"];

export default function Gaps() {
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ severity: searchParams.get("severity") || "", status: searchParams.get("status") || "" });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get("/compliance/gaps", { params: filters })
      .then((r) => setRows(r.data.items || []))
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [JSON.stringify(filters)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
    api.get("/compliance/gaps/stats").then((r) => setStats(r.data));
    api.get("/controls", { params: { pageSize: 500 } }).then((r) => setControls(r.data.items || []));
  }, [load]);

  const openEdit = (row) => {
    setForm(
      row
        ? {
            description: row.description,
            control: row.control?._id || "",
            severity: row.severity || "Medium",
            owner: row.owner || "",
            dueDate: fmtDateInput(row.dueDate),
            status: row.status || "Open",
          }
        : { severity: "Medium", status: "Open" }
    );
    setEditing(row || "new");
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      payload.dueDate = payload.dueDate ? new Date(payload.dueDate).toISOString() : undefined;
      if (editing === "new") await api.post("/compliance/gaps", payload);
      else await api.put(`/compliance/gaps/${editing._id}`, payload);
      setEditing(null);
      load();
    } catch (err) {
      window.alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete ${row.gapId}?`)) return;
    await api.delete(`/compliance/gaps/${row._id}`);
    load();
  };

  const setStatus = async (row, status) => {
    await api.put(`/compliance/gaps/${row._id}`, { status });
    load();
  };

  const statsCards = [
    { label: "Open gaps", value: stats.total, style: "border-gold/40 bg-gold/10 text-gold-light" },
    { label: "Critical", value: stats.critical, style: "border-red-800/60 bg-red-950/40 text-red-300" },
    { label: "Overdue", value: stats.overdue, style: "border-red-800/60 bg-red-950/40 text-red-300" },
    { label: "Closed this quarter", value: stats.closedThisQuarter, style: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300" },
  ];

  return (
    <>
      <PageHeader
        title="Gaps & Remediation"
        subtitle="Company-wide compliance gaps — owners, due dates and remediation status per control."
        actions={
          <>
            <Select className="w-36" value={filters.severity} onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value }))} options={[{ value: "", label: "All severities" }, ...SEVERITIES.map((s) => ({ value: s, label: s }))]} />
            <Select className="w-36" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} options={[{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s }))]} />
            <button className="btn-primary" onClick={() => openEdit(null)}><Plus className="h-4 w-4" /> Log Gap</button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statsCards.map((c) => (
          <div key={c.label} className="card p-3">
            <div className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${c.style}`}>{c.value ?? "—"}</div>
            <div className="mt-1.5 text-[11px] leading-tight text-neutral-400">{c.label}</div>
          </div>
        ))}
      </div>

      {error && !loading ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <DataTable
          columns={[
            { key: "gapId", header: "ID" },
            { key: "description", header: "Gap", render: (r) => <span className="font-medium text-neutral-100">{r.description}</span> },
            { key: "control", header: "Control", render: (r) => r.control ? <div><div className="text-xs text-neutral-200">{r.control.controlId}</div><div className="text-[10px] text-neutral-500">{r.control.name}</div></div> : "—" },
            { key: "severity", header: "Severity", render: (r) => <span className={`chip ${chipClass(r.severity)}`}>{r.severity}</span> },
            { key: "owner", header: "Owner" },
            { key: "dueDate", header: "Due", render: (r) => <span className={new Date(r.dueDate) < new Date() && r.status !== "Closed" ? "text-red-300" : ""}>{fmtDate(r.dueDate)}</span> },
            { key: "status", header: "Status", render: (r) => (
              <div className="flex items-center gap-1.5">
                <span className={`chip ${chipClass(r.status)}`}>{r.status}</span>
                {r.status !== "Closed" && <button className="rounded border border-emerald-800/40 px-1.5 py-0.5 text-[10px] text-emerald-300 hover:bg-emerald-950/30" onClick={(e) => { e.stopPropagation(); setStatus(r, "Closed"); }}>Close</button>}
              </div>
            ) },
            { key: "__actions", header: "", sortable: false, className: "w-20 text-right", render: (r) => (
              <div className="flex justify-end gap-1">
                <button className="rounded-md p-1.5 text-neutral-500 transition hover:text-gold" onClick={(e) => { e.stopPropagation(); openEdit(r); }} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                <button className="rounded-md p-1.5 text-neutral-500 transition hover:text-red-300" onClick={(e) => { e.stopPropagation(); remove(r); }} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            )},
          ]}
          rows={rows}
          loading={loading}
          searchPlaceholder="Search gaps…"
          emptyHint="No gaps match the current filters."
        />
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === "new" ? "Log gap" : `Edit ${form.gapId || "gap"}`} width="max-w-2xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} type="button">Cancel</button>
            <button className="btn-primary" form="gap-form" type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </>
        }
      >
        <form id="gap-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Related control" className="sm:col-span-2">
            <Select value={form.control || ""} onChange={(e) => setForm((f) => ({ ...f, control: e.target.value }))} options={[{ value: "", label: "— Select control —" }, ...controls.map((c) => ({ value: c._id, label: `${c.controlId} — ${c.name}` }))]} />
          </Field>
          <Field label="Description" className="sm:col-span-2"><TextArea value={form.description || ""} required onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
          <Field label="Severity"><Select value={form.severity || "Medium"} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))} options={SEVERITIES.map((s) => ({ value: s, label: s }))} /></Field>
          <Field label="Status"><Select value={form.status || "Open"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} options={STATUSES.map((s) => ({ value: s, label: s }))} /></Field>
          <Field label="Owner"><TextInput value={form.owner || ""} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} /></Field>
          <Field label="Due date"><TextInput type="date" value={form.dueDate || ""} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} /></Field>
        </form>
      </Modal>
    </>
  );
}
