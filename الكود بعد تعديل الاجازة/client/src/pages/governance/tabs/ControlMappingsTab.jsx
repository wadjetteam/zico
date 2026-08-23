import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { resource } from "../../../api/client";
import DataTable from "../../../components/DataTable";
import Modal from "../../../components/Modal";
import { Field, Select, TextArea } from "../../../components/Field";
import { fmtDateTime, orDash } from "../../../lib/policy";

const api = resource("policies");
const frameworks = resource("frameworks");

export default function ControlMappingsTab({ policy }) {
  const [rows, setRows] = useState([]);
  const [frameworkOptions, setFrameworkOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ framework: "", control: "", mappingType: "Direct", rationale: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`${policy._id}/control-mappings`).then((d) => setRows(d.items)).finally(() => setLoading(false));
  }, [policy._id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    frameworks.list().then((d) => setFrameworkOptions(d.items));
  }, []);

  const controls = useMemo(() => {
    const fw = frameworkOptions.find((f) => f._id === form.framework);
    return (fw?.controls || []).map((c, i) => ({
      id: String(c.id || c._id || i + 1),
      name: c.name || c.title || `Control ${c.id || i + 1}`,
    }));
  }, [frameworkOptions, form.framework]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fw = frameworkOptions.find((f) => f._id === form.framework);
      const ctrl = controls.find((c) => c.id === form.control);
      await api.create(`${policy._id}/control-mappings`, {
        controlId: ctrl?.id || form.control,
        controlName: ctrl?.name || "",
        framework: fw?.name || "",
        domain: fw?.description || "",
        mappingType: form.mappingType,
        rationale: form.rationale,
      });
      setOpen(false);
      setForm({ framework: "", control: "", mappingType: "Direct", rationale: "" });
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm("Remove this control mapping?")) return;
    await api.remove(`${policy._id}/control-mappings/${row._id}`);
    load();
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="label">Control Mappings ({rows.length})</p>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Map Control
        </button>
      </div>

      <DataTable
        columns={[
          { key: "controlId", header: "Control ID", render: (r) => <span className="whitespace-nowrap font-mono text-xs text-gold">{r.controlId || "—"}</span> },
          { key: "controlName", header: "Control name", render: (r) => <span className="font-medium text-neutral-100">{orDash(r.controlName)}</span> },
          { key: "framework", header: "Framework", render: (r) => <span className="chip">{r.framework || "—"}</span> },
          { key: "domain", header: "Domain", render: (r) => <span className="text-neutral-400">{orDash(r.domain)}</span> },
          { key: "mappingType", header: "Mapping type", render: (r) => <span className="chip">{r.mappingType}</span> },
          { key: "rationale", header: "Rationale", render: (r) => <span className="text-neutral-400">{orDash(r.rationale)}</span> },
          { key: "createdAt", header: "Mapped at", render: (r) => <span className="whitespace-nowrap text-neutral-400">{fmtDateTime(r.createdAt)}</span> },
          {
            key: "__a",
            header: "",
            sortable: false,
            className: "w-14 text-right",
            render: (r) => (
              <button onClick={() => remove(r)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-red-950/40 hover:text-red-300" title="Remove">
                <Trash2 className="h-4 w-4" />
              </button>
            ),
          },
        ]}
        rows={rows}
        loading={loading}
        searchable={false}
        emptyHint="No control mappings"
      />

      <Modal open={open} onClose={() => !saving && setOpen(false)} title="Map Control to Policy" width="max-w-lg"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="control-map-form" type="submit" disabled={saving || !form.framework || !form.control}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Map Control
            </button>
          </>
        }
      >
        <form id="control-map-form" onSubmit={save} className="grid grid-cols-1 gap-4">
          <Field label="Framework">
            <Select value={form.framework} onChange={(e) => setForm((s) => ({ ...s, framework: e.target.value, control: "" }))} options={[{ value: "", label: "— Select framework —" }, ...frameworkOptions.map((f) => ({ value: f._id, label: f.name }))]} />
          </Field>
          <Field label="Search control by ID or title”¦">
            <select className="input" value={form.control} onChange={(e) => setForm((s) => ({ ...s, control: e.target.value }))}>
              <option value="">— Select control —</option>
              {controls.map((c) => (
                <option key={c.id} value={c.id} className="bg-ink-deep">
                  {c.id} — {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mapping type">
            <Select value={form.mappingType} onChange={(e) => setForm((s) => ({ ...s, mappingType: e.target.value }))} options={["Direct", "Indirect", "Partial"].map((t) => ({ value: t, label: t }))} />
          </Field>
          <Field label="Rationale">
            <TextArea value={form.rationale} onChange={(e) => setForm((s) => ({ ...s, rationale: e.target.value }))} placeholder="How this control supports the policy”¦" />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
