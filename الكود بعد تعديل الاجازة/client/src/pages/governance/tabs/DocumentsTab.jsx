import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, FileText, Loader2, Pencil, Plus, Tag, Trash2, Upload, X } from "lucide-react";
import { resource } from "../../../api/client";
import DataTable from "../../../components/DataTable";
import Modal from "../../../components/Modal";
import { Field, Select, TextInput } from "../../../components/Field";
import { POLICY_CLASS_STYLES, fmtDateTime, orDash } from "../../../lib/policy";

const api = resource("policies");

const EMPTY = { fileName: "", displayName: "", tags: "", version: "1.0", size: 0, classification: "Internal", role: "", fileType: "" };

const humanSize = (b) => {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
};

export default function DocumentsTab({ policy }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`${policy._id}/documents`).then((d) => setRows(d.items)).finally(() => setLoading(false));
  }, [policy._id]);

  useEffect(load, [load]);

  const types = useMemo(() => [...new Set(rows.map((r) => r.fileType).filter(Boolean))], [rows]);
  const roles = useMemo(() => [...new Set(rows.map((r) => r.role).filter(Boolean))], [rows]);
  const visible = rows.filter(
    (r) =>
      (!typeFilter || r.fileType === typeFilter) &&
      (!roleFilter || r.role === roleFilter) &&
      (!classFilter || r.classification === classFilter)
  );

  const openModal = (row) => {
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    if (row) {
      setForm({
        fileName: row.fileName || "",
        displayName: row.displayName || "",
        tags: (row.tags || []).join(", "),
        version: row.version || "1.0",
        size: row.size || 0,
        classification: row.classification || "Internal",
        role: row.role || "",
        fileType: row.fileType || "",
      });
      setEditing(row);
    } else {
      setForm(EMPTY);
      setEditing("new");
    }
  };

  const pickFile = (f) => {
    setFile(f || null);
    if (!f) return;
    const ext = (f.name.split(".").pop() || "").toUpperCase();
    setForm((s) => ({
      ...s,
      fileName: s.fileName || f.name,
      displayName: s.displayName || f.name.replace(/\.[^.]+$/, ""),
      fileType: s.fileType || ext,
      size: f.size,
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        size: Number(form.size) || 0,
        tags: String(form.tags).split(",").map((s) => s.trim()).filter(Boolean),
      };
      if (editing === "new") {
        if (file) {
          const fd = new FormData();
          fd.append("file", file);
          for (const [k, v] of Object.entries(payload)) fd.append(k, Array.isArray(v) ? v.join(", ") : String(v ?? ""));
          await api.post(`${policy._id}/documents`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        } else {
          await api.create(`${policy._id}/documents`, payload);
        }
      } else {
        await api.update(`${policy._id}/documents/${editing._id}`, payload);
      }
      setEditing(null);
      setFile(null);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete document "${row.displayName || row.fileName}"?`)) return;
    await api.remove(`${policy._id}/documents/${row._id}`);
    load();
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="label">Documents ({visible.length})</p>
        <button className="btn-primary" onClick={() => openModal(null)}>
          <Plus className="h-4 w-4" /> Upload Document
        </button>
      </div>

      <DataTable
        columns={[
          { key: "fileName", header: "File", render: (r) => <span className="font-mono text-xs text-neutral-300">{orDash(r.fileName)}</span> },
          { key: "displayName", header: "Display name", render: (r) => <span className="font-medium text-neutral-100">{orDash(r.displayName)}</span> },
          { key: "tags", header: "Tags", render: (r) => (r.tags?.length ? r.tags.map((t) => <span key={t} className="chip mr-1">{t}</span>) : <span className="text-neutral-600">—</span>) },
          { key: "version", header: "Versions", render: (r) => <span className="font-mono text-xs">v{r.version}</span> },
          { key: "size", header: "Size", render: (r) => humanSize(r.size) },
          {
            key: "classification",
            header: "Classification",
            render: (r) => <span className={`chip ${POLICY_CLASS_STYLES[r.classification] || POLICY_CLASS_STYLES.Internal}`}>{r.classification || "Internal"}</span>,
          },
          { key: "updatedAt", header: "Modified", render: (r) => <span className="whitespace-nowrap text-neutral-400">{fmtDateTime(r.updatedAt)}</span> },
          {
            key: "__a",
            header: "",
            sortable: false,
            className: "w-28 text-right",
            render: (r) => (
              <div className="flex justify-end gap-1">
                {r.fileId ? (
                  <a href={`/api/files/${r.fileId}`} target="_blank" rel="noreferrer" className="rounded-md p-1.5 text-neutral-500 transition hover:bg-white/5 hover:text-gold" title="Open file">
                    <Eye className="h-4 w-4" />
                  </a>
                ) : (
                  <button onClick={() => setPreview(r)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-white/5 hover:text-gold" title="View">
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => openModal(r)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-sky-950/40 hover:text-sky-300" title="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove(r)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-red-950/40 hover:text-red-300" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
          },
        ]}
        rows={visible}
        loading={loading}
        searchable
        searchPlaceholder="Search documents”¦"
        emptyHint="No documents uploaded yet."
        toolbar={
          <>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} options={[{ value: "", label: "All Types" }, ...types.map((t) => ({ value: t, label: t }))]} />
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} options={[{ value: "", label: "All Roles" }, ...roles.map((t) => ({ value: t, label: t }))]} />
            <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} options={[{ value: "", label: "All Classifications" }, ...["Public", "Internal", "Confidential", "Restricted"].map((c) => ({ value: c, label: c }))]} />
          </>
        }
      />

      <Modal open={Boolean(editing)} onClose={() => !saving && setEditing(null)} title={editing === "new" ? "Upload Document" : "Edit Document"} width="max-w-2xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="doc-form" type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {editing === "new" ? "Upload" : "Save"}
            </button>
          </>
        }
      >
        <form id="doc-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {editing === "new" && (
            <Field label="Choose file" hint="PDF, image, Word, Excel — up to 25 MB" className="sm:col-span-3">
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
          )}
          <Field label="File name / reference" className="sm:col-span-2">
            <TextInput value={form.fileName} onChange={(e) => setForm((s) => ({ ...s, fileName: e.target.value }))} placeholder="e.g. ISMS-Policy-2026.pdf" />
          </Field>
          <Field label="File type">
            <TextInput value={form.fileType} onChange={(e) => setForm((s) => ({ ...s, fileType: e.target.value }))} placeholder="e.g. PDF" />
          </Field>
          <Field label="Display name" className="sm:col-span-2">
            <TextInput value={form.displayName} onChange={(e) => setForm((s) => ({ ...s, displayName: e.target.value }))} />
          </Field>
          <Field label="Version">
            <TextInput value={form.version} onChange={(e) => setForm((s) => ({ ...s, version: e.target.value }))} />
          </Field>
          <Field label="Size (bytes)">
            <TextInput type="number" min={0} value={form.size} onChange={(e) => setForm((s) => ({ ...s, size: e.target.value }))} />
          </Field>
          <Field label="Role">
            <TextInput value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))} placeholder="e.g. Reviewer" />
          </Field>
          <Field label="Classification">
            <Select value={form.classification} onChange={(e) => setForm((s) => ({ ...s, classification: e.target.value }))} options={["Public", "Internal", "Confidential", "Restricted"].map((c) => ({ value: c, label: c }))} />
          </Field>
          <Field label="Tags" hint="Comma-separated" className="sm:col-span-3">
            <TextInput value={form.tags} onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))} />
          </Field>
        </form>
      </Modal>

      <Modal open={Boolean(preview)} onClose={() => setPreview(null)} title="Document details" width="max-w-lg"
        footer={
          <>
            {preview?.fileId && (
              <a href={`/api/files/${preview.fileId}`} target="_blank" rel="noreferrer" className="btn-primary">
                <Eye className="h-4 w-4" /> Open file
              </a>
            )}
            <button className="btn-ghost" onClick={() => setPreview(null)}>Close</button>
          </>
        }
      >
        {preview && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 rounded-lg border border-line bg-white/[0.02] p-4">
              <FileText className="h-8 w-8 shrink-0 text-gold" />
              <div>
                <p className="font-medium text-neutral-100">{preview.displayName || preview.fileName || "Untitled"}</p>
                <p className="font-mono text-xs text-neutral-500">{preview.fileName}</p>
              </div>
            </div>
            {[
              ["Version", `v${preview.version}`],
              ["Size", humanSize(preview.size)],
              ["Role", orDash(preview.role)],
              ["Classification", preview.classification],
              ["Uploaded", fmtDateTime(preview.createdAt)],
              ["Tags", preview.tags?.length ? preview.tags.join(", ") : "None"],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between border-b border-line/50 pb-2">
                <span className="text-xs text-neutral-500">{l}</span>
                <span className="text-neutral-200">{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
