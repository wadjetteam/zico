import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Handshake, Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import api, { resource } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { ErrorState } from "../../components/States";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import { chipClass, fmtDate } from "../../lib/format";

const thirdParty = resource("third-party");

const STATUS_FILTERS = [
  { key: "", label: "All" },
  { key: "not-started", label: "Not started" },
  { key: "onboarding", label: "Onboarding" },
  { key: "in-review", label: "In review" },
  { key: "approved", label: "Approved" },
  { key: "monitoring", label: "Monitoring" },
  { key: "rejected", label: "Rejected" },
  { key: "offboarding", label: "Offboarding" },
];

const vendorChip = (s) =>
  chipClass(s, {
    "not-started": "border-neutral-700 bg-neutral-900 text-neutral-400",
    onboarding: "border-sky-800/60 bg-sky-950/40 text-sky-300",
    "in-review": "border-amber-800/60 bg-amber-950/40 text-amber-300",
    approved: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
    monitoring: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
    rejected: "border-red-800/60 bg-red-950/40 text-red-300",
    offboarding: "border-red-800/60 bg-red-950/40 text-red-300",
  });

const tierChip = (t) => chipClass(t);

const EMPTY = {
  vendorName: "",
  serviceProvided: "",
  contactEmail: "",
  owner: "",
  dataClassification: "",
  contractStart: "",
  contractEnd: "",
  dpaInPlace: false,
  nextAssessment: "",
  notes: "",
};

const DATA_CLASSES = ["Public", "Internal", "Restricted", "Confidential", "Secret"];

export default function ThirdParty() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    thirdParty
      .list({ status: filter })
      .then((d) => {
        setRows(d.items);
        setSummary(d.summary);
      })
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm({ ...EMPTY });
    setEditing("new");
  };

  const openEdit = (r) => {
    setForm({
      vendorName: r.vendorName,
      serviceProvided: r.serviceProvided || "",
      contactEmail: r.contactEmail || "",
      owner: r.owner || "",
      dataClassification: r.dataClassification || "",
      contractStart: r.contractStart ? new Date(r.contractStart).toISOString().slice(0, 10) : "",
      contractEnd: r.contractEnd ? new Date(r.contractEnd).toISOString().slice(0, 10) : "",
      dpaInPlace: Boolean(r.dpaInPlace),
      nextAssessment: r.nextAssessment ? new Date(r.nextAssessment).toISOString().slice(0, 10) : "",
      notes: r.notes || "",
    });
    setEditing(r);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      for (const k of ["contractStart", "contractEnd", "nextAssessment"]) {
        payload[k] = payload[k] ? new Date(payload[k]).toISOString() : undefined;
      }
      if (editing === "new") await thirdParty.create(payload);
      else await thirdParty.update(editing._id, payload);
      setEditing(null);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete vendor "${row.vendorName}"? Its assessment history and responses are removed too.`)) return;
    try {
      await thirdParty.remove(row._id);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Third-Party Assessments"
        subtitle="Vendor lifecycle: onboard, assess with questionnaires, approve, monitor and offboard — findings push straight to the risk register."
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New vendor
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold"><Handshake className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{summary.total ?? 0}</p>
            <p className="text-xs text-neutral-500">Total vendors</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-950/40 text-amber-300"><Handshake className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{summary.inReview ?? 0}</p>
            <p className="text-xs text-neutral-500">Onboarding / in review</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950/40 text-emerald-300"><Handshake className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{summary.approved ?? 0}</p>
            <p className="text-xs text-neutral-500">Approved / monitoring</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-950/40 text-red-300"><Handshake className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{summary.critical ?? 0}</p>
            <p className="text-xs text-neutral-500">Critical tier</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-950/40 text-sky-300"><Handshake className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{summary.overdue ?? 0}</p>
            <p className="text-xs text-neutral-500">Reassessment overdue</p>
          </div>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <DataTable
          toolbar={
            <>
              <div className="flex gap-1">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      filter === f.key ? "bg-gold/15 text-gold" : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button className="btn-ghost px-3 py-1.5" onClick={load} title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </button>
            </>
          }
          columns={[
            {
              key: "vendorName",
              header: "Vendor",
              render: (r) => (
                <div>
                  <span className="font-medium text-neutral-100">{r.vendorName}</span>
                  <p className="text-[11px] text-neutral-600">{r.serviceProvided || "—"}</p>
                </div>
              ),
            },
            { key: "owner", header: "Owner", render: (r) => <span className="text-neutral-300">{r.owner || "—"}</span> },
            {
              key: "currentScore",
              header: "Score",
              render: (r) => (r.currentScore != null ? <span className="font-mono text-gold">{r.currentScore}%</span> : <span className="text-neutral-600">—</span>),
            },
            { key: "currentTier", header: "Tier", render: (r) => (r.currentTier ? <span className={tierChip(r.currentTier)}>{r.currentTier}</span> : <span className="text-neutral-600">—</span>) },
            { key: "vendorStatus", header: "Lifecycle", render: (r) => <span className={vendorChip(r.vendorStatus)}>{r.vendorStatus}</span> },
            { key: "nextAssessment", header: "Next assessment", render: (r) => <span className="text-neutral-400">{fmtDate(r.nextAssessment)}</span> },
            {
              key: "__a",
              header: "",
              sortable: false,
              className: "w-20 text-right",
              render: (r) => (
                <div className="flex justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openEdit(r)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-white/5 hover:text-gold" title="Edit">
                    <Pencil className="h-4 w-4" />
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
          searchPlaceholder="Search vendors…"
          emptyHint="Register a vendor to start its onboarding and assessment lifecycle."
          emptyAction={
            <button className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New vendor
            </button>
          }
          onRowClick={(r) => navigate(`/assessments/third-party/${r._id}`)}
        />
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => !saving && setEditing(null)}
        title={editing === "new" ? "New vendor" : "Edit vendor"}
        subtitle="Vendors start in not-started and move through onboarding, review and monitoring."
        width="max-w-2xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="vendor-form" type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <form id="vendor-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Vendor name">
            <TextInput value={form.vendorName} onChange={(e) => setForm((s) => ({ ...s, vendorName: e.target.value }))} required placeholder="e.g. Temenos" />
          </Field>
          <Field label="Service provided">
            <TextInput value={form.serviceProvided} onChange={(e) => setForm((s) => ({ ...s, serviceProvided: e.target.value }))} placeholder="e.g. Core banking platform" />
          </Field>
          <Field label="Contact email">
            <TextInput type="email" value={form.contactEmail} onChange={(e) => setForm((s) => ({ ...s, contactEmail: e.target.value }))} placeholder="risk@vendor.example" />
          </Field>
          <Field label="Owner">
            <TextInput value={form.owner} onChange={(e) => setForm((s) => ({ ...s, owner: e.target.value }))} placeholder="e.g. Procurement" />
          </Field>
          <Field label="Data classification">
            <Select value={form.dataClassification} onChange={(e) => setForm((s) => ({ ...s, dataClassification: e.target.value }))} options={DATA_CLASSES} />
          </Field>
          <Field label="DPA in place">
            <label className="flex items-center gap-3 py-2">
              <input type="checkbox" checked={form.dpaInPlace} onChange={(e) => setForm((s) => ({ ...s, dpaInPlace: e.target.checked }))} className="h-4 w-4 accent-[#D4AF37]" />
              <span className="text-sm text-neutral-300">Data processing agreement signed</span>
            </label>
          </Field>
          <Field label="Contract start">
            <TextInput type="date" value={form.contractStart} onChange={(e) => setForm((s) => ({ ...s, contractStart: e.target.value }))} />
          </Field>
          <Field label="Contract end">
            <TextInput type="date" value={form.contractEnd} onChange={(e) => setForm((s) => ({ ...s, contractEnd: e.target.value }))} />
          </Field>
          <Field label="Next assessment" className="sm:col-span-2">
            <TextInput type="date" value={form.nextAssessment} onChange={(e) => setForm((s) => ({ ...s, nextAssessment: e.target.value }))} />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <TextArea value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
