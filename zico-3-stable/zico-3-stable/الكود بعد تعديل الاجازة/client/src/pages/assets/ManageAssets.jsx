import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, FileUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router";
import api, { resource } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { ErrorState } from "../../components/States";
import { Field, Select, TextArea, TextInput } from "../../components/Field";

const assets = resource("assets");

const TYPES = ["Application", "Cloud", "Database", "Hardware", "Human Asset", "Information Asset", "Infrastructure", "Network Device", "Security Tool", "Third Party"];
const CLASSIFICATIONS = ["Public", "Internal", "Confidential", "Restricted"];
const CRITICALITIES = ["Critical", "High", "Medium", "Low"];
const ENVIRONMENTS = ["Production", "DR Site", "Development", "Test"];
const STATUSES = ["Active", "Inactive", "Retired"];

const CRIT_STYLES = {
  Critical: "border-red-800/60 bg-red-950/40 text-red-300",
  High: "border-orange-800/60 bg-orange-950/40 text-orange-300",
  Medium: "border-amber-800/60 bg-amber-950/40 text-amber-300",
  Low: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
};
const CLASS_STYLES = {
  Confidential: "border-amber-800/60 bg-amber-950/40 text-amber-300",
  Restricted: "border-red-800/60 bg-red-950/40 text-red-300",
  Internal: "border-neutral-700 bg-neutral-900 text-neutral-300",
  Public: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
};

const EMPTY = {
  assetId: "",
  name: "",
  type: "Application",
  businessProcess: "",
  businessOwner: "",
  owner: "",
  department: "",
  classification: "Internal",
  criticality: "Medium",
  location: "",
  environment: "Production",
  status: "Active",
  group: "",
  domain: "",
  organization: "",
  notes: "",
};

const StatCard = ({ label, value, tone }) => (
  <div className="card flex flex-col justify-between p-4">
    <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">{label}</p>
    <p className={`heading mt-2 text-4xl font-semibold ${tone}`}>{value}</p>
  </div>
);

export default function ManageAssets() {
  const [searchParams] = useSearchParams();
  const organization = searchParams.get("organization") || "";
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total: 0, byCriticality: {}, byStatus: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [critFilter, setCritFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [envFilter, setEnvFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [groups, setGroups] = useState([]);
  const [domains, setDomains] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      assets.list({ type: typeFilter || undefined, criticality: critFilter || undefined, classification: classFilter || undefined, environment: envFilter || undefined, status: statusFilter || undefined, organization: organization || undefined }),
      assets.get(`stats${organization ? `?organization=${organization}` : ""}`),
    ])
      .then(([d, s]) => {
        setRows(d.items);
        setStats(s);
      })
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [typeFilter, critFilter, classFilter, envFilter, statusFilter, organization]);

  useEffect(load, [load]);

  useEffect(() => {
    resource("asset-groups").list().then((d) => setGroups(d.items));
    resource("domains").list().then((d) => setDomains(d.items));
    resource("organizations").list().then((d) => setOrganizations(d.items));
  }, []);

  const crit = stats.byCriticality || {};
  const statStatus = stats.byStatus || {};

  const openCreate = () => {
    setForm({ ...EMPTY, assetId: "" });
    setEditing("new");
  };

  const openEdit = (row) =>
    setEditing(row) ||
    setForm({
      assetId: row.assetId || "",
      name: row.name || "",
      type: row.type || "Application",
      businessProcess: row.businessProcess || "",
      businessOwner: row.businessOwner || "",
      owner: row.owner || "",
      department: row.department || "",
      classification: row.classification || "Internal",
      criticality: row.criticality || "Medium",
      location: row.location || "",
      environment: row.environment || "Production",
      status: row.status || "Active",
      group: row.group?._id || "",
      domain: row.domain?._id || "",
      organization: row.organization?._id || "",
      notes: row.notes || "",
    });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, group: form.group || undefined, domain: form.domain || undefined, organization: form.organization || undefined };
      if (editing === "new") await assets.create(payload);
      else await assets.update(editing._id, payload);
      setEditing(null);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete asset "${row.name}"? This cannot be undone.`)) return;
    await assets.remove(row._id);
    load();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/assets/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setImportResult(data);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const { data } = await api.get("/assets/export", { responseType: "blob" });
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Asset_Inventory.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Manage Assets"
        subtitle="The asset inventory aligned with the Asset Inventory sheet: systems, data stores, processes and services in scope for risk assessment."
        actions={
          <>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFile} />
            <button className="btn-ghost" onClick={() => fileRef.current?.click()} disabled={importing}>
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} Import Excel
            </button>
            <button className="btn-ghost" onClick={exportExcel} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export Excel
            </button>
            <button className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New Asset
            </button>
          </>
        }
      />

      {importResult && (
        <div className="mb-5 rounded-lg border border-emerald-800/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
          Import complete: <b>{importResult.created}</b> created, <b>{importResult.updated}</b> updated, <b>{importResult.skipped}</b> skipped
          {importResult.errors?.length ? (
            <ul className="mt-2 list-inside list-disc text-xs text-red-300">
              {importResult.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Total Assets" value={stats.total} tone="text-gold" />
        <StatCard label="Critical" value={crit.Critical || 0} tone="text-red-400" />
        <StatCard label="High" value={crit.High || 0} tone="text-orange-300" />
        <StatCard label="Medium" value={crit.Medium || 0} tone="text-amber-300" />
        <StatCard label="Active" value={statStatus.Active || 0} tone="text-emerald-400" />
      </div>

      {error && !loading ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <DataTable
          columns={[
            { key: "assetId", header: "Asset ID", render: (r) => <span className="whitespace-nowrap font-mono text-xs text-gold">{r.assetId}</span> },
            { key: "name", header: "Asset Name", render: (r) => <span className="font-medium text-neutral-100">{r.name}</span> },
            { key: "type", header: "Asset Type", render: (r) => <span className="chip">{r.type}</span> },
            { key: "businessProcess", header: "Business Process", render: (r) => <span className="text-neutral-400">{r.businessProcess || "—"}</span> },
            { key: "businessOwner", header: "Business Owner", render: (r) => <span className="text-neutral-300">{r.businessOwner || "—"}</span> },
            { key: "owner", header: "Asset Owner", render: (r) => <span className="text-neutral-300">{r.owner || "—"}</span> },
            { key: "department", header: "Department", render: (r) => <span className="text-neutral-400">{r.department || "—"}</span> },
            { key: "classification", header: "Classification", render: (r) => <span className={`chip ${CLASS_STYLES[r.classification] || CLASS_STYLES.Internal}`}>{r.classification}</span> },
            { key: "criticality", header: "Criticality", render: (r) => <span className={`chip ${CRIT_STYLES[r.criticality] || CRIT_STYLES.Medium}`}>{r.criticality}</span> },
            { key: "location", header: "Location", render: (r) => <span className="text-neutral-400">{r.location || "—"}</span> },
            { key: "environment", header: "Environment", render: (r) => <span className="whitespace-nowrap text-neutral-400">{r.environment || "—"}</span> },
            { key: "status", header: "Status", render: (r) => <span className={`chip ${r.status === "Active" ? "border-emerald-800/60 bg-emerald-950/40 text-emerald-300" : "border-neutral-700 bg-neutral-900 text-neutral-400"}`}>{r.status}</span> },
            {
              key: "__actions",
              header: "",
              sortable: false,
              className: "w-24 text-right",
              render: (row) => (
                <div className="flex justify-end gap-1">
                  <button onClick={() => openEdit(row)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-white/5 hover:text-gold" aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(row)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-red-950/40 hover:text-red-300" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            },
          ]}
          rows={rows}
          loading={loading}
          emptyHint="Add the systems and processes that support critical services, or import the Asset Inventory sheet."
          emptyAction={
            <button className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New Asset
            </button>
          }
          toolbar={
            <>
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} options={[{ value: "", label: "All types" }, ...TYPES.map((t) => ({ value: t, label: t }))]} />
              <Select value={critFilter} onChange={(e) => setCritFilter(e.target.value)} options={[{ value: "", label: "All criticalities" }, ...CRITICALITIES.map((t) => ({ value: t, label: t }))]} />
              <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} options={[{ value: "", label: "All classifications" }, ...CLASSIFICATIONS.map((t) => ({ value: t, label: t }))]} />
              <Select value={envFilter} onChange={(e) => setEnvFilter(e.target.value)} options={[{ value: "", label: "All environments" }, ...ENVIRONMENTS.map((t) => ({ value: t, label: t }))]} />
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: "", label: "All statuses" }, ...STATUSES.map((t) => ({ value: t, label: t }))]} />
            </>
          }
        />
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New Asset" : "Edit Asset"}
        subtitle="Fields follow the Asset Inventory sheet. All changes are written to the register immediately on save."
        width="max-w-3xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} type="button" disabled={saving}>
              Cancel
            </button>
            <button className="btn-primary" form="asset-form" type="submit" disabled={saving || !form.name}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {editing === "new" ? "Create" : "Save"}
            </button>
          </>
        }
      >
        <form id="asset-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Asset ID" hint="Auto-generated if empty">
            <TextInput value={form.assetId} onChange={(e) => setForm((s) => ({ ...s, assetId: e.target.value }))} placeholder="ASSET-021" />
          </Field>
          <Field label="Asset name" required className="sm:col-span-2">
            <TextInput value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          </Field>
          <Field label="Asset type">
            <Select value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))} options={TYPES.map((t) => ({ value: t, label: t }))} />
          </Field>
          <Field label="Criticality">
            <Select value={form.criticality} onChange={(e) => setForm((s) => ({ ...s, criticality: e.target.value }))} options={CRITICALITIES.map((t) => ({ value: t, label: t }))} />
          </Field>
          <Field label="Classification">
            <Select value={form.classification} onChange={(e) => setForm((s) => ({ ...s, classification: e.target.value }))} options={CLASSIFICATIONS.map((t) => ({ value: t, label: t }))} />
          </Field>
          <Field label="Business process">
            <TextInput value={form.businessProcess} onChange={(e) => setForm((s) => ({ ...s, businessProcess: e.target.value }))} />
          </Field>
          <Field label="Business owner">
            <TextInput value={form.businessOwner} onChange={(e) => setForm((s) => ({ ...s, businessOwner: e.target.value }))} />
          </Field>
          <Field label="Asset owner">
            <TextInput value={form.owner} onChange={(e) => setForm((s) => ({ ...s, owner: e.target.value }))} />
          </Field>
          <Field label="Department">
            <TextInput value={form.department} onChange={(e) => setForm((s) => ({ ...s, department: e.target.value }))} />
          </Field>
          <Field label="Location">
            <TextInput value={form.location} onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))} />
          </Field>
          <Field label="Environment">
            <Select value={form.environment} onChange={(e) => setForm((s) => ({ ...s, environment: e.target.value }))} options={ENVIRONMENTS.map((t) => ({ value: t, label: t }))} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} options={STATUSES.map((t) => ({ value: t, label: t }))} />
          </Field>
          <Field label="Asset group">
            <Select value={form.group} onChange={(e) => setForm((s) => ({ ...s, group: e.target.value }))} options={[{ value: "", label: "— Ungrouped —" }, ...groups.map((g) => ({ value: g._id, label: g.name }))]} />
          </Field>
          <Field label="Domain">
            <Select value={form.domain} onChange={(e) => setForm((s) => ({ ...s, domain: e.target.value }))} options={[{ value: "", label: "— No domain —" }, ...domains.map((x) => ({ value: x._id, label: x.name }))]} />
          </Field>
          <Field label="Organization">
            <Select value={form.organization} onChange={(e) => setForm((s) => ({ ...s, organization: e.target.value }))} options={[{ value: "", label: "— No organization —" }, ...organizations.map((x) => ({ value: x._id, label: x.name }))]} />
          </Field>
          <Field label="Notes" className="sm:col-span-3">
            <TextArea value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
