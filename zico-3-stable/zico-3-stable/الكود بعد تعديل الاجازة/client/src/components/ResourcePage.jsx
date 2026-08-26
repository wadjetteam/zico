import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { resource } from "../api/client";
import PageHeader from "./PageHeader";
import DataTable from "./DataTable";
import Modal from "./Modal";
import { ErrorState } from "./States";
import { Field, Select, TextArea, TextInput } from "./Field";
import { fmtDateInput } from "../lib/format";

/**
 * Config-driven CRUD screen.
 * fields: [{ name, label, type: text|textarea|number|date|select|checkbox, options, required, span }]
 */
export default function ResourcePage({
  title,
  subtitle,
  path,
  columns,
  fields,
  emptyHint,
  singular = "record",
  defaults = {},
  transform,
  canCreate = true,
  listParams,
  extraToolbar,
  readOnly = false,
}) {
  const api = useMemo(() => resource(path), [path]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .list(listParams)
      .then((data) => setRows(data.items || []))
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [api, JSON.stringify(listParams)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    const initial = {};
    for (const f of fields) {
      initial[f.name] =
        defaults[f.name] ?? (f.type === "checkbox" ? false : f.type === "number" ? 0 : f.type === "select" ? (f.options?.[0]?.value ?? f.options?.[0] ?? "") : "");
    }
    setForm(initial);
    setEditing("new");
  };

  const openEdit = (row) => {
    const initial = {};
    for (const f of fields) {
      const raw = row[f.name];
      initial[f.name] =
        f.type === "date"
          ? fmtDateInput(raw)
          : raw && typeof raw === "object" && raw._id
            ? raw._id
            : (raw ?? "");
    }
    setForm(initial);
    setEditing(row);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = transform ? transform(form) : form;
      if (editing === "new") await api.create(payload);
      else await api.update(editing._id, payload);
      setEditing(null);
      load();
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete this ${singular}? This cannot be undone.`)) return;
    await api.remove(row._id);
    load();
  };

  const tableColumns = readOnly
    ? columns
    : [
        ...columns,
        {
          key: "__actions",
          header: "",
          sortable: false,
          className: "w-24 text-right",
          render: (row) => (
            <div className="flex justify-end gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(row);
                }}
                className="rounded-md p-1.5 text-neutral-500 transition hover:bg-white/5 hover:text-gold"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  remove(row);
                }}
                className="rounded-md p-1.5 text-neutral-500 transition hover:bg-red-950/40 hover:text-red-300"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ),
        },
      ];

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            {extraToolbar}
            {canCreate && !readOnly && (
              <button className="btn-primary" onClick={openCreate}>
                <Plus className="h-4 w-4" /> New {singular}
              </button>
            )}
          </>
        }
      />

      {error && !loading ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <DataTable
          columns={tableColumns}
          rows={rows}
          loading={loading}
          emptyHint={emptyHint}
          emptyAction={
            canCreate && !readOnly ? (
              <button className="btn-primary" onClick={openCreate}>
                <Plus className="h-4 w-4" /> New {singular}
              </button>
            ) : null
          }
        />
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === "new" ? `New ${singular}` : `Edit ${singular}`}
        subtitle="All changes are written to the GRC register immediately on save."
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} type="button">
              Cancel
            </button>
            <button className="btn-primary" form="resource-form" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <form id="resource-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((f) => {
            const set = (value) => setForm((s) => ({ ...s, [f.name]: value }));
            const span = f.span === 2 ? "sm:col-span-2" : "";
            if (f.type === "checkbox") {
              return (
                <label key={f.name} className={`flex items-center gap-3 ${span}`}>
                  <input
                    type="checkbox"
                    checked={Boolean(form[f.name])}
                    onChange={(e) => set(e.target.checked)}
                    className="h-4 w-4 accent-[#D4AF37]"
                  />
                  <span className="text-sm text-neutral-300">{f.label}</span>
                </label>
              );
            }
            return (
              <Field key={f.name} label={f.label} hint={f.hint} className={span}>
                {f.type === "textarea" ? (
                  <TextArea
                    value={form[f.name] ?? ""}
                    required={f.required}
                    onChange={(e) => set(e.target.value)}
                  />
                ) : f.type === "select" ? (
                  <Select
                    value={form[f.name] ?? ""}
                    required={f.required}
                    options={f.options || []}
                    onChange={(e) => set(e.target.value)}
                  />
                ) : (
                  <TextInput
                    type={f.type || "text"}
                    value={form[f.name] ?? ""}
                    required={f.required}
                    min={f.min}
                    max={f.max}
                    onChange={(e) => set(f.type === "number" ? Number(e.target.value) : e.target.value)}
                  />
                )}
              </Field>
            );
          })}
        </form>
      </Modal>
    </>
  );
}
