import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { ErrorState } from "../../components/States";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import { chipClass, fmtDate, fmtDateInput } from "../../lib/format";

const CATEGORIES = ["Security", "Privacy", "Financial", "Regional"];
const STATUSES = ["Active", "Draft", "Retired"];

export default function Frameworks() {
  const [rows, setRows] = useState([]);
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get("/frameworks", { params: { pageSize: 100 } }),
      api.get("/controls", { params: { pageSize: 500 } }),
    ])
      .then(([fw, ct]) => {
        setRows(fw.data.items || []);
        setControls(ct.data.items || []);
      })
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const complianceOf = (fw) => {
    const list = controls.filter((c) => String(c.framework?._id) === String(fw._id));
    const done = list.filter((c) => ["Fully Implemented", "Largely Implemented"].includes(c.implementationStatus)).length;
    return list.length ? Math.round((done / list.length) * 100) : null;
  };

  const openEdit = (row) => {
    setForm(
      row
        ? {
            name: row.name,
            version: row.version || "",
            category: row.category || "Security",
            issuingBody: row.issuingBody || "",
            applicableRegions: (row.applicableRegions || []).join(", "),
            effectiveDate: fmtDateInput(row.effectiveDate),
            nextReviewAt: fmtDateInput(row.nextReviewAt),
            referenceUrl: row.referenceUrl || "",
            status: row.status || "Active",
            active: row.active !== false,
            description: row.description || "",
          }
        : { category: "Security", status: "Active", active: true, applicableRegions: "" }
    );
    setEditing(row || "new");
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      payload.applicableRegions = (payload.applicableRegions || "").split(",").map((s) => s.trim()).filter(Boolean);
      payload.effectiveDate = payload.effectiveDate ? new Date(payload.effectiveDate).toISOString() : undefined;
      payload.nextReviewAt = payload.nextReviewAt ? new Date(payload.nextReviewAt).toISOString() : undefined;
      if (editing === "new") await api.post("/frameworks", payload);
      else await api.put(`/frameworks/${editing._id}`, payload);
      setEditing(null);
      load();
    } catch (err) {
      window.alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    const inUse = controls.some((c) => String(c.framework?._id) === String(row._id));
    const msg = inUse
      ? `${row.name} still has ${controls.filter((c) => String(c.framework?._id) === String(row._id)).length} control(s) in the library — the server will block this delete. Delete or reassign those controls first, or cancel.`
      : `Delete framework "${row.name}"?`;
    if (!window.confirm(msg)) return;
    try {
      await api.delete(`/frameworks/${row._id}`);
      load();
    } catch (err) {
      window.alert(err?.response?.data?.message || err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Frameworks"
        subtitle="Regulatory and internal control frameworks — extended metadata, review schedule and live compliance per framework."
        actions={
          <button className="btn-primary" onClick={() => openEdit(null)}><Plus className="h-4 w-4" /> New Framework</button>
        }
      />

      {error && !loading ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <DataTable
          columns={[
            { key: "name", header: "Framework", render: (r) => <div><div className="font-medium text-neutral-100">{r.name}</div><div className="text-xs text-neutral-500">v{r.version || "—"}</div></div> },
            { key: "category", header: "Category", render: (r) => <span className={`chip ${r.category === "Financial" ? "border-indigo-800/60 bg-indigo-950/40 text-indigo-300" : r.category === "Privacy" ? "border-purple-800/60 bg-purple-950/40 text-purple-300" : "border-sky-800/60 bg-sky-950/40 text-sky-300"}`}>{r.category || "—"}</span> },
            { key: "issuingBody", header: "Issuing body" },
            { key: "status", header: "Status", render: (r) => <span className={`chip ${chipClass(r.status)}`}>{r.status}</span> },
            {
              key: "compliance",
              header: "Compliance",
              render: (r) => {
                const p = complianceOf(r);
                if (p == null) return <span className="text-xs text-neutral-600">no controls</span>;
                const color = p >= 80 ? "text-emerald-300" : p >= 50 ? "text-gold" : p >= 25 ? "text-amber-300" : "text-red-300";
                return (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${p}%` }} />
                    </div>
                    <span className={`text-xs font-semibold ${color}`}>{p}%</span>
                  </div>
                );
              },
            },
            { key: "nextReviewAt", header: "Next review", render: (r) => <span className={r.nextReviewAt && new Date(r.nextReviewAt) < new Date() ? "text-red-300" : ""}>{fmtDate(r.nextReviewAt)}</span> },
            { key: "__actions", header: "", sortable: false, className: "w-20 text-right", render: (r) => (
              <div className="flex justify-end gap-1">
                <button className="rounded-md p-1.5 text-neutral-500 transition hover:text-gold" onClick={(e) => { e.stopPropagation(); openEdit(r); }} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                <button className="rounded-md p-1.5 text-neutral-500 transition hover:text-red-300" onClick={(e) => { e.stopPropagation(); remove(r); }} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            )},
          ]}
          rows={rows}
          loading={loading}
          searchPlaceholder="Search frameworks…"
          emptyHint="Add a framework such as ISO 27001, PCI DSS or Basel III."
        />
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === "new" ? "New framework" : `Edit ${form.name || "framework"}`} width="max-w-3xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} type="button">Cancel</button>
            <button className="btn-primary" form="framework-form" type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </>
        }
      >
        <form id="framework-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Framework name" className="sm:col-span-2"><TextInput value={form.name || ""} required onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Version"><TextInput value={form.version || ""} onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))} placeholder="e.g. 2022, 4.0" /></Field>
          <Field label="Category"><Select value={form.category || "Security"} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} options={CATEGORIES.map((c) => ({ value: c, label: c }))} /></Field>
          <Field label="Issuing body"><TextInput value={form.issuingBody || ""} onChange={(e) => setForm((f) => ({ ...f, issuingBody: e.target.value }))} placeholder="e.g. ISO/IEC, BCBS, PCI SSC, NIST" /></Field>
          <Field label="Status"><Select value={form.status || "Active"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} options={STATUSES.map((s) => ({ value: s, label: s }))} /></Field>
          <Field label="Effective date"><TextInput type="date" value={form.effectiveDate || ""} onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))} /></Field>
          <Field label="Next review due"><TextInput type="date" value={form.nextReviewAt || ""} onChange={(e) => setForm((f) => ({ ...f, nextReviewAt: e.target.value }))} /></Field>
          <Field label="Applicable regions" hint="Comma-separated, e.g. EU, MENA, Global"><TextInput value={form.applicableRegions || ""} onChange={(e) => setForm((f) => ({ ...f, applicableRegions: e.target.value }))} /></Field>
          <Field label="Reference URL"><TextInput value={form.referenceUrl || ""} onChange={(e) => setForm((f) => ({ ...f, referenceUrl: e.target.value }))} /></Field>
          <label className="flex items-center gap-3 sm:col-span-2">
            <input type="checkbox" checked={form.active !== false} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="h-4 w-4 accent-[#D4AF37]" />
            <span className="text-sm text-neutral-300">Active (included in compliance reporting)</span>
          </label>
          <Field label="Description" className="sm:col-span-2"><TextArea value={form.description || ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
        </form>
      </Modal>
    </>
  );
}
