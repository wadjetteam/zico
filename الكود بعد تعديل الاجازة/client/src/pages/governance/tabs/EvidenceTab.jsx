import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, Plus, Trash2, Undo2, Upload, X } from "lucide-react";
import { resource } from "../../../api/client";
import DataTable from "../../../components/DataTable";
import Modal from "../../../components/Modal";
import { Field, Select, TextArea, TextInput } from "../../../components/Field";
import { fmtDateTime, orDash } from "../../../lib/policy";

const api = resource("policies");
const frameworks = resource("frameworks");

const EMPTY = { controlId: "", controlName: "", framework: "", evidenceDescription: "", documentIds: "" };

const humanSize = (b) => {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
};

export default function EvidenceTab({ policy }) {
  const [rows, setRows] = useState([]);
  const [frameworkOptions, setFrameworkOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`${policy._id}/evidence`).then((d) => setRows(d.items)).finally(() => setLoading(false));
  }, [policy._id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    frameworks.list().then((d) => setFrameworkOptions(d.items));
  }, []);

  const controlOptions = useMemo(() => {
    const fw = frameworkOptions.find((f) => f.name === form.framework);
    return (fw?.controls || []).map((c, i) => ({
      id: String(c.id || c._id || i + 1),
      name: c.name || c.title || `Control ${c.id || i + 1}`,
    }));
  }, [frameworkOptions, form.framework]);

  const pickFile = (f) => {
    setFile(f || null);
    if (f && !form.controlId) setForm((s) => ({ ...s, controlId: f.name.split(".").slice(0, -1).join(".").toUpperCase() }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("controlId", form.controlId);
        fd.append("controlName", form.controlName);
        fd.append("framework", form.framework);
        fd.append("evidenceDescription", form.evidenceDescription);
        fd.append("documentIds", form.documentIds);
        await api.post(`${policy._id}/evidence`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.create(`${policy._id}/evidence`, form);
      }
      setOpen(false);
      setForm(EMPTY);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleReviewed = async (row) => {
    await api.update(`${policy._id}/evidence/${row._id}`, { reviewed: !row.reviewed });
    load();
  };

  const remove = async (row) => {
    if (!window.confirm("Remove this evidence mapping?")) return;
    await api.remove(`${policy._id}/evidence/${row._id}`);
    load();
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label">Evidence Traceability ({rows.length})</p>
          <p className="mt-1 text-[11px] text-neutral-600">Policy ? Compliance Control ? Evidence</p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add Evidence
        </button>
      </div>

      <DataTable
        columns={[
          { key: "controlId", header: "Control", render: (r) => <span className="whitespace-nowrap font-mono text-xs text-gold">{orDash(r.controlId)}</span> },
          { key: "framework", header: "Framework", render: (r) => <span className="chip">{r.framework || "—"}</span> },
          { key: "evidenceDescription", header: "Evidence description", render: (r) => <span className="max-w-[280px] text-neutral-400">{orDash(r.evidenceDescription)}</span> },
          {
            key: "attachments",
            header: "Attachment",
            render: (r) => {
              const a = r.attachments?.[0];
              return a?.url ? (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex max-w-[200px] items-center gap-1.5 rounded-lg border border-line bg-white/[0.02] px-2 py-1 text-[11px] text-neutral-300 transition hover:border-gold/50 hover:text-gold"
                  title={`Open ${a.filename} (${humanSize(a.sizeBytes)})`}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{a.filename}</span>
                </a>
              ) : (
                <span className="text-neutral-600">—</span>
              );
            },
          },
          { key: "status", header: "Status", render: (r) => <span className={`chip ${r.status === "Approved" ? "border-emerald-800/60 bg-emerald-950/40 text-emerald-300" : "border-amber-800/60 bg-amber-950/40 text-amber-300"}`}>{r.status}</span> },
          { key: "updatedAt", header: "Last updated", render: (r) => <span className="whitespace-nowrap text-neutral-400">{fmtDateTime(r.updatedAt)}</span> },
          {
            key: "reviewed",
            header: "Reviewed",
            render: (r) => <span className={r.reviewed ? "text-emerald-400" : "text-neutral-600"}>{r.reviewed ? "Yes" : "No"}</span>,
          },
          {
            key: "__a",
            header: "",
            sortable: false,
            className: "w-24 text-right",
            render: (r) => (
              <div className="flex justify-end gap-1">
                <button onClick={() => toggleReviewed(r)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-emerald-950/40 hover:text-emerald-300" title={r.reviewed ? "Unmark reviewed" : "Mark reviewed"}>
                  {r.reviewed ? <Undo2 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                </button>
                <button onClick={() => remove(r)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-red-950/40 hover:text-red-300" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
          },
        ]}
        rows={rows}
        loading={loading}
        searchable={false}
        emptyHint="No evidence mappings yet."
      />

      <Modal open={open} onClose={() => !saving && setOpen(false)} title="Add Evidence Mapping" width="max-w-lg"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="evidence-form" type="submit" disabled={saving || !form.controlId}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Add Evidence
            </button>
          </>
        }
      >
        <form id="evidence-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Control ID *">
            <TextInput value={form.controlId} onChange={(e) => setForm((s) => ({ ...s, controlId: e.target.value }))} required placeholder="e.g. A.5.1" />
          </Field>
          <Field label="Control name">
            <TextInput value={form.controlName} onChange={(e) => setForm((s) => ({ ...s, controlName: e.target.value }))} />
          </Field>
          <Field label="Framework" className="sm:col-span-2">
            <Select value={form.framework} onChange={(e) => setForm((s) => ({ ...s, framework: e.target.value }))} options={[{ value: "", label: "— Select framework —" }, ...frameworkOptions.map((f) => ({ value: f.name, label: f.name }))]} />
          </Field>
          <Field label="Evidence file" hint="Image, PDF, screenshot, document — up to 25 MB" className="sm:col-span-2">
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] || null)} />
            {file ? (
              <div className="flex items-center justify-between rounded-lg border border-gold/40 bg-gold/5 px-3 py-2">
                <span className="flex min-w-0 items-center gap-2 text-sm text-neutral-200">
                  <FileText className="h-4 w-4 shrink-0 text-gold" />
                  <span className="truncate">{file.name}</span>
                  <span className="shrink-0 text-[11px] text-neutral-500">{humanSize(file.size)}</span>
                </span>
                <button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }} className="rounded-md p-1 text-neutral-500 transition hover:text-red-300" title="Remove file">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-700 bg-white/[0.02] px-3 py-4 text-sm text-neutral-400 transition hover:border-gold/50 hover:text-gold">
                <Upload className="h-4 w-4" /> Click to choose a file from your device
              </button>
            )}
          </Field>
          <Field label="Evidence description" className="sm:col-span-2">
            <TextArea value={form.evidenceDescription} onChange={(e) => setForm((s) => ({ ...s, evidenceDescription: e.target.value }))} placeholder="What proves this control is in force…" />
          </Field>
          <Field label="Document IDs" hint="Comma-separated" className="sm:col-span-2">
            <TextInput value={form.documentIds} onChange={(e) => setForm((s) => ({ ...s, documentIds: e.target.value }))} placeholder="DOC-001, DOC-002" />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
