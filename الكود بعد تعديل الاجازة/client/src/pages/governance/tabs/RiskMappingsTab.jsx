import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { resource } from "../../../api/client";
import DataTable from "../../../components/DataTable";
import Modal from "../../../components/Modal";
import { Field, Select, TextArea, TextInput } from "../../../components/Field";
import { fmtDateTime, orDash } from "../../../lib/policy";

const api = resource("policies");
const risks = resource("risks");

const LEVEL_STYLES = {
  Critical: "border-red-800/60 bg-red-950/40 text-red-300",
  High: "border-orange-800/60 bg-orange-950/40 text-orange-300",
  Medium: "border-amber-800/60 bg-amber-950/40 text-amber-300",
  Low: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
};

export default function RiskMappingsTab({ policy }) {
  const [rows, setRows] = useState([]);
  const [riskOptions, setRiskOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ risk: "", mappingType: "Primary", rationale: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`${policy._id}/risk-mappings`).then((d) => setRows(d.items)).finally(() => setLoading(false));
  }, [policy._id]);

  useEffect(load, [load]);

  useEffect(() => {
    risks.list().then((d) => setRiskOptions(d.items));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.create(`${policy._id}/risk-mappings`, form);
      setOpen(false);
      setForm({ risk: "", mappingType: "Primary", rationale: "" });
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm("Remove this risk mapping?")) return;
    await api.remove(`${policy._id}/risk-mappings/${row._id}`);
    load();
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="label">Risk Mappings ({rows.length})</p>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Link Risk
        </button>
      </div>

      <DataTable
        columns={[
          { key: "riskId", header: "Risk ID", render: (r) => <span className="whitespace-nowrap font-mono text-xs text-gold">{r.risk?.riskId || "—"}</span> },
          { key: "riskTitle", header: "Risk title", render: (r) => <span className="font-medium text-neutral-100">{r.risk?.title || "—"}</span> },
          { key: "riskLevel", header: "Risk level", render: (r) => <span className={`chip ${LEVEL_STYLES[r.risk?.overallRisk] || LEVEL_STYLES.Low}`}>{r.risk?.overallRisk || "—"}</span> },
          { key: "mappingType", header: "Mapping type", render: (r) => <span className="chip">{r.mappingType}</span> },
          { key: "rationale", header: "Rationale", render: (r) => <span className="text-neutral-400">{orDash(r.rationale)}</span> },
          { key: "mappedBy", header: "Mapped by", render: (r) => <span className="whitespace-nowrap text-neutral-300">{r.mappedBy?.fullName || r.mappedBy?.username || "—"}</span> },
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
        emptyHint="No risk mappings"
      />

      <Modal open={open} onClose={() => !saving && setOpen(false)} title="Link Risk to Policy" width="max-w-lg"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="risk-map-form" type="submit" disabled={saving || !form.risk}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Link Risk
            </button>
          </>
        }
      >
        <form id="risk-map-form" onSubmit={save} className="grid grid-cols-1 gap-4">
          <Field label="Search risk by ID or title”¦">
            <select className="input" value={form.risk} onChange={(e) => setForm((s) => ({ ...s, risk: e.target.value }))}>
              <option value="">— Select risk —</option>
              {riskOptions.map((r) => (
                <option key={r._id} value={r._id} className="bg-ink-deep">
                  {r.riskId} — {r.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mapping type">
            <Select value={form.mappingType} onChange={(e) => setForm((s) => ({ ...s, mappingType: e.target.value }))} options={["Primary", "Support"].map((t) => ({ value: t, label: t }))} />
          </Field>
          <Field label="Rationale">
            <TextArea value={form.rationale} onChange={(e) => setForm((s) => ({ ...s, rationale: e.target.value }))} placeholder="Why this risk relates to this policy”¦" />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
