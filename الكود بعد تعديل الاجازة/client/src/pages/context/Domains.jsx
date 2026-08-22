import { useCallback, useEffect, useMemo, useState } from "react";
import { FolderTree, Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import api, { resource } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { ErrorState } from "../../components/States";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import { chipClass } from "../../lib/format";

const domains = resource("domains");
const orgs = resource("organizations");

const EMPTY = {
  domainId: "",
  name: "",
  organization: "",
  parentDomain: "",
  description: "",
  scoringMethod: "advanced",
  status: "active",
};

export default function Domains() {
  const [rows, setRows] = useState([]);
  const [orgList, setOrgList] = useState([]);
  const [usedIn, setUsedIn] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [orgFilter, setOrgFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([domains.list(), api.get("/context/domains/used-in").then((r) => r.data.usedIn)])
      .then(([d, u]) => {
        setRows(d.items);
        setUsedIn(u);
      })
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    orgs.list().then((d) => setOrgList(d.items));
  }, [load]);

  const orgName = useMemo(() => new Map(orgList.map((o) => [o._id, o.name])), [orgList]);
  const domainName = useMemo(() => new Map(rows.map((d) => [d._id, d.name])), [rows]);

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.status === "active").length;
    const advanced = rows.filter((r) => r.scoringMethod === "advanced").length;
    const totalRefs = rows.reduce((a, r) => a + (usedIn[String(r._id)] || 0), 0);
    return { total: rows.length, active, advanced, totalRefs };
  }, [rows, usedIn]);

  const openCreate = () => setEditing("new");
  const openEdit = (row) =>
    setForm({
      domainId: row.domainId || "",
      name: row.name,
      organization: row.organization?._id || row.organization || "",
      parentDomain: row.parentDomain?._id || row.parentDomain || "",
      description: row.description || "",
      scoringMethod: row.scoringMethod || "advanced",
      status: row.status,
    });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing === "new") await domains.create(payload);
      else await domains.update(editing._id, payload);
      setEditing(null);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete domain "${row.name}"? Risks, sub-domains and scoring parameters must be removed first.`)) return;
    try {
      await domains.remove(row._id);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  const siblingDomains = rows.filter(
    (d) => d.organization === form.organization || d.organization?._id === form.organization
  );

  const visibleRows = orgFilter === "" ? rows : rows.filter((r) => String(r.organization?._id || r.organization) === orgFilter);

  return (
    <>
      <PageHeader
        title="Domains"
        subtitle="Domains scope the risk universe inside an organization. The scoring method is fixed per domain; every risk inside is scored consistently. Domains may nest under a parent domain."
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New domain
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold"><FolderTree className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{stats.total}</p>
            <p className="text-xs text-neutral-500">Total domains</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950/40 text-emerald-300"><FolderTree className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{stats.active}</p>
            <p className="text-xs text-neutral-500">Active</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-950/40 text-violet-300"><FolderTree className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{stats.advanced}</p>
            <p className="text-xs text-neutral-500">Advanced scoring (70/30)</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-950/40 text-sky-300"><FolderTree className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{stats.totalRefs}</p>
            <p className="text-xs text-neutral-500">Total record references</p>
          </div>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <DataTable
          toolbar={
            <>
              <select className="input w-56" value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)}>
                <option value="" className="bg-ink-deep">All organizations</option>
                {orgList.map((o) => (
                  <option key={o._id} value={o._id} className="bg-ink-deep">{o.name}</option>
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
              header: "Domain",
              render: (r) => (
                <div>
                  <span className="font-medium text-neutral-100">{r.name}</span>
                  <p className="text-[11px] text-neutral-600">{r.domainId || "—"}</p>
                </div>
              ),
            },
            {
              key: "organization",
              header: "Organization",
              render: (r) => orgName.get(String(r.organization?._id || r.organization)) || "—",
            },
            { key: "parentDomain", header: "Parent domain", render: (r) => domainName.get(String(r.parentDomain?._id || r.parentDomain || "")) || "—" },
            {
              key: "scoringMethod",
              header: "Scoring method",
              render: (r) => (
                <span className={chipClass(r.scoringMethod, { advanced: "border-violet-800/60 bg-violet-950/40 text-violet-300", default: "border-neutral-700 bg-neutral-900 text-neutral-400" })}>
                  {r.scoringMethod === "advanced" ? "Advanced 70/30" : "Default max"}
                </span>
              ),
            },
            {
              key: "usedIn",
              header: "Used in",
              render: (r) => {
                const n = usedIn[String(r._id)] || 0;
                return <span className={`font-mono text-sm ${n ? "text-gold" : "text-neutral-600"}`}>{n}</span>;
              },
            },
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
              className: "w-24 text-right",
              render: (r) => (
                <div className="flex justify-end gap-1">
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
          rows={visibleRows}
          loading={loading}
          searchPlaceholder="Search domains…"
          emptyHint="Create a domain inside an organization to start scoping the risk universe."
          emptyAction={
            <button className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New domain
            </button>
          }
        />
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => !saving && setEditing(null)}
        title={editing === "new" ? "New domain" : "Edit domain"}
        subtitle="Domains belong to an organization; the scoring method is locked per domain."
        width="max-w-2xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} type="button" disabled={saving}>
              Cancel
            </button>
            <button className="btn-primary" form="domain-form" type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <form id="domain-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Organization" className="sm:col-span-2">
            <select
              className="input"
              value={form.organization}
              required
              onChange={(e) => {
                setForm((s) => ({ ...s, organization: e.target.value, parentDomain: "" }));
              }}
            >
              <option value="">— Select organization —</option>
              {orgList.map((o) => (
                <option key={o._id} value={o._id} className="bg-ink-deep">{o.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Domain name">
            <TextInput value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required placeholder="e.g. Digital Channels" />
          </Field>
          <Field label="Domain ID" hint="Optional internal code">
            <TextInput value={form.domainId} onChange={(e) => setForm((s) => ({ ...s, domainId: e.target.value }))} placeholder="e.g. DMN-002" />
          </Field>
          <Field label="Parent domain" hint="Only domains of the same organization" className="sm:col-span-2">
            <select
              className="input"
              value={form.parentDomain}
              onChange={(e) => setForm((s) => ({ ...s, parentDomain: e.target.value }))}
              disabled={!form.organization}
            >
              <option value="" className="bg-ink-deep">— No parent —</option>
              {siblingDomains
                .filter((d) => !editing || d._id !== editing._id)
                .map((d) => (
                  <option key={d._id} value={d._id} className="bg-ink-deep">{d.name}</option>
                ))}
            </select>
          </Field>
          <Field label="Scoring method">
            <select className="input" value={form.scoringMethod} onChange={(e) => setForm((s) => ({ ...s, scoringMethod: e.target.value }))}>
              <option value="advanced" className="bg-ink-deep">Advanced — blended 70/30 impact</option>
              <option value="default" className="bg-ink-deep">Default — plain max impact</option>
            </select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} options={["active", "inactive"]} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <TextArea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
