import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Building2, ChevronDown, Loader2, Plus, RefreshCw } from "lucide-react";
import { resource } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { ErrorState } from "../../components/States";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import { chipClass } from "../../lib/format";

const orgApi = resource("organizations");

const ORG_TYPES = ["parent", "subsidiary", "business-unit", "branch"];
const ORG_TYPE_STYLES = {
  parent: "border-gold/30 bg-gold/5 text-gold-light",
  subsidiary: "border-sky-800/60 bg-sky-950/40 text-sky-300",
  "business-unit": "border-violet-800/60 bg-violet-950/40 text-violet-300",
  branch: "border-neutral-700 bg-neutral-900 text-neutral-400",
};
const orgTypeChip = (t) => `chip ${ORG_TYPE_STYLES[t] || ORG_TYPE_STYLES.parent}`;

const EMPTY = {
  orgId: "",
  name: "",
  type: "parent",
  parentOrg: "",
  region: "",
  industry: "",
  regulatoryFramework: "",
  applicableRegulations: "",
  description: "",
  address: "",
  primaryContact: "",
  status: "active",
};

const nextOrganizationId = (items) => {
  const next = items.reduce((max, item) => {
    const number = Number(String(item.orgId || "").match(/\d+/)?.[0] || 0);
    return Math.max(max, number);
  }, 0) + 1;
  return `ORG-${String(next).padStart(3, "0")}`;
};

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="card flex items-center gap-4 px-5 py-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent || "bg-gold/10 text-gold"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="heading text-2xl font-semibold text-neutral-100">{value}</p>
        <p className="text-xs text-neutral-500">{label}</p>
        {sub && <p className="text-[11px] text-neutral-600">{sub}</p>}
      </div>
    </div>
  );
}

export default function Organizations() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    orgApi
      .list()
      .then((d) => setRows(d.items))
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byId = useMemo(() => new Map(rows.map((o) => [o._id, o])), [rows]);

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.status === "active").length;
    const parents = rows.filter((r) => r.type === "parent" || !r.parentOrg).length;
    return {
      total: rows.length,
      active,
      parents,
      subsidiaries: rows.length - parents,
    };
  }, [rows]);

  const openCreate = () => {
    setForm({ ...EMPTY, orgId: nextOrganizationId(rows) });
    setEditing("new");
  };
  const openEdit = (row) =>
    setForm({
      orgId: row.orgId || "",
      name: row.name,
      type: row.type || "parent",
      parentOrg: row.parentOrg?._id || row.parentOrg || "",
      region: row.region || "",
      industry: row.industry || "",
      regulatoryFramework: row.regulatoryFramework || "",
      applicableRegulations: (row.applicableRegulations || []).join("\n"),
      description: row.description || "",
      address: row.address || "",
      primaryContact: row.primaryContact || "",
      status: row.status,
    });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        applicableRegulations: form.applicableRegulations
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (editing === "new") await orgApi.create(payload);
      else await orgApi.update(editing._id, payload);
      setEditing(null);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete organization "${row.name}"? Domains, child organizations and assets must be removed first.`)) return;
    try {
      await orgApi.remove(row._id);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  const visibleRows = typeFilter === "" ? rows : rows.filter((r) => (r.type || "parent") === typeFilter);

  return (
    <>
      <PageHeader
        title="Organizations"
        subtitle="Context Organization — the top-level container of the risk universe. Organizations form a hierarchy (parent → subsidiary → business unit) and own the domains below them."
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New organization
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Building2} label="Organizations" value={stats.total} sub="total entities" />
        <StatCard icon={Building2} label="Active" value={stats.active} sub="in operation" accent="bg-emerald-950/40 text-emerald-300" />
        <StatCard icon={Building2} label="Parent / standalone" value={stats.parents} sub="roots of the hierarchy" accent="bg-gold/10 text-gold" />
        <StatCard icon={Building2} label="Subsidiaries & units" value={stats.subsidiaries} sub="attached to a parent" accent="bg-sky-950/40 text-sky-300" />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <DataTable
          toolbar={
            <>
              <select className="input w-48" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="" className="bg-ink-deep">All types</option>
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-ink-deep">{t}</option>
                ))}
              </select>
              <button className="btn-ghost px-3 py-1.5" onClick={load} title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </button>
            </>
          }
          columns={[
            {
              key: "name",
              header: "Organization",
              render: (r) => (
                <div>
                  <Link to={`/context/domains?organization=${r._id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-neutral-100 hover:text-gold">{r.name}</Link>
                  <p className="text-[11px] text-neutral-600">{r.orgId || "—"}</p>
                </div>
              ),
            },
            { key: "type", header: "Type", render: (r) => <span className={orgTypeChip(r.type || "parent")}>{r.type || "parent"}</span> },
            { key: "parentOrg", header: "Parent", render: (r) => r.parentOrg?.name || "—" },
            { key: "region", header: "Region", render: (r) => r.region || "—" },
            { key: "industry", header: "Industry", render: (r) => r.industry || "—" },
            {
              key: "status",
              header: "Status",
              render: (r) => (
                <span className={chipClass(r.status, { active: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300", inactive: "border-neutral-700 bg-neutral-900 text-neutral-400" })}>
                  {r.status}
                </span>
              ),
            },
            {
              key: "__a",
              header: "",
              sortable: false,
              className: "w-10 text-right",
              render: (r) => (
                <span className="inline-flex items-center gap-1 text-[11px] text-neutral-600">
                  Open <ChevronDown className="h-3 w-3" />
                </span>
              ),
            },
          ]}
          rows={visibleRows}
          loading={loading}
          searchPlaceholder="Search organizations…"
          emptyHint="Create the first context organization to start building your risk universe."
          emptyAction={
            <button className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New organization
            </button>
          }
          onRowClick={(r) => navigate(`/context/organizations/${r._id}`)}
        />
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => !saving && setEditing(null)}
        title={editing === "new" ? "New organization" : "Edit organization"}
        subtitle="Organizations are the top of the context hierarchy — attach a parent to nest it."
        width="max-w-3xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} type="button" disabled={saving}>
              Cancel
            </button>
            <button className="btn-primary" form="org-form" type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <form id="org-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Name" className="sm:col-span-2">
            <TextInput value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required placeholder="e.g. Wadjet Retail Bank" />
          </Field>
          <Field label="Org ID" hint="Optional internal code">
            <TextInput value={form.orgId} readOnly disabled className="cursor-not-allowed opacity-70" />
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))} options={ORG_TYPES} />
          </Field>
          <Field label="Parent organization" hint="Leave empty for a root entity">
            <select className="input" value={form.parentOrg} onChange={(e) => setForm((s) => ({ ...s, parentOrg: e.target.value }))}>
              <option value="" className="bg-ink-deep">— No parent (root) —</option>
              {rows
                .filter((o) => !editing || o._id !== editing._id)
                .map((o) => (
                  <option key={o._id} value={o._id} className="bg-ink-deep">
                    {o.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Region">
            <TextInput value={form.region} onChange={(e) => setForm((s) => ({ ...s, region: e.target.value }))} placeholder="e.g. EMEA" />
          </Field>
          <Field label="Industry">
            <TextInput value={form.industry} onChange={(e) => setForm((s) => ({ ...s, industry: e.target.value }))} placeholder="e.g. Retail Banking" />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} options={["active", "inactive"]} />
          </Field>
          <Field label="Primary contact" className="sm:col-span-2">
            <TextInput value={form.primaryContact} onChange={(e) => setForm((s) => ({ ...s, primaryContact: e.target.value }))} placeholder="e.g. Chief Risk Officer" />
          </Field>
          <Field label="Regulatory framework" className="sm:col-span-3">
            <TextInput value={form.regulatoryFramework} onChange={(e) => setForm((s) => ({ ...s, regulatoryFramework: e.target.value }))} placeholder="e.g. ISO/IEC 27001:2022" />
          </Field>
          <Field label="Applicable regulations" hint="One per line" className="sm:col-span-3">
            <TextArea value={form.applicableRegulations} onChange={(e) => setForm((s) => ({ ...s, applicableRegulations: e.target.value }))} rows={3} placeholder={"ISO/IEC 27001:2022\nGDPR"} />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <TextInput value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
          </Field>
          <Field label="Description" className="sm:col-span-3">
            <TextArea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
          </Field>
        </form>
      </Modal>
    </>
  );
}

export { orgTypeChip };
