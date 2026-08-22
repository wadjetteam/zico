import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ClipboardList, Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import api, { resource } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { ErrorState } from "../../components/States";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import { chipClass, fmtDate } from "../../lib/format";

const assessments = resource("assessments");

const STATUS_FILTERS = [
  { key: "", label: "All" },
  { key: "planning", label: "Planning" },
  { key: "data-collection", label: "Data collection" },
  { key: "scoring", label: "Scoring" },
  { key: "review", label: "Review" },
  { key: "published", label: "Published" },
  { key: "cancelled", label: "Cancelled" },
];

const statusChip = (s) =>
  chipClass(s, {
    planning: "border-neutral-700 bg-neutral-900 text-neutral-400",
    "data-collection": "border-sky-800/60 bg-sky-950/40 text-sky-300",
    scoring: "border-violet-800/60 bg-violet-950/40 text-violet-300",
    review: "border-amber-800/60 bg-amber-950/40 text-amber-300",
    published: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
    cancelled: "border-red-800/60 bg-red-950/40 text-red-300",
  });

const scopeChip = (s) =>
  chipClass(s, {
    asset: "border-gold/30 bg-gold/5 text-gold-light",
    vendor: "border-sky-800/60 bg-sky-950/40 text-sky-300",
    domain: "border-violet-800/60 bg-violet-950/40 text-violet-300",
    organization: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  });

const EMPTY = {
  name: "",
  questionnaire: "",
  scopeType: "asset",
  asset: "",
  vendorName: "",
  domain: "",
  organization: "",
  methodology: "",
  assignedTo: "",
  reviewer: "",
  dueDate: "",
};

export default function RiskAssessments() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [questionnaires, setQuestionnaires] = useState([]);
  const [assets, setAssets] = useState([]);
  const [domainsList, setDomainsList] = useState([]);
  const [orgsList, setOrgsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    assessments
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
    Promise.all([
      api.get("/questionnaires", { params: { status: "active" } }).then((r) => r.data.items),
      resource("assets").list(),
      resource("domains").list(),
      resource("organizations").list(),
    ])
      .then(([qs, as, ds, os]) => {
        setQuestionnaires(qs);
        setAssets(as.items);
        setDomainsList(ds.items);
        setOrgsList(os.items);
      })
      .catch(() => {});
  }, [load]);

  const activeQs = useMemo(() => questionnaires.filter((q) => q.status === "active"), [questionnaires]);

  const openCreate = () => {
    setForm({ ...EMPTY });
    setEditing("new");
  };

  const openEdit = (r) => {
    setForm({
      name: r.name,
      questionnaire: r.questionnaire?._id || r.questionnaire || "",
      scopeType: r.scopeType || "asset",
      asset: r.asset?._id || r.asset || "",
      vendorName: r.vendorName || "",
      domain: r.domain?._id || r.domain || "",
      organization: r.organization?._id || r.organization || "",
      methodology: r.methodology || "",
      assignedTo: r.assignedTo || "",
      reviewer: r.reviewer || "",
      dueDate: r.dueDate ? new Date(r.dueDate).toISOString().slice(0, 10) : "",
    });
    setEditing(r);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.dueDate) payload.dueDate = new Date(payload.dueDate).toISOString();
      else delete payload.dueDate;
      if (editing === "new") await assessments.create(payload);
      else await assessments.update(editing._id, payload);
      setEditing(null);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete assessment "${row.name}"? Its collected response is removed with it.`)) return;
    try {
      await assessments.remove(row._id);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Risk Assessments"
        subtitle="Questionnaire-based assessments against assets, vendors, domains or whole organizations — with lifecycle transitions, approvals and push-to-register."
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New assessment
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold"><ClipboardList className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{summary.total ?? 0}</p>
            <p className="text-xs text-neutral-500">Total</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-950/40 text-sky-300"><ClipboardList className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{summary.inProgress ?? 0}</p>
            <p className="text-xs text-neutral-500">In progress</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950/40 text-emerald-300"><ClipboardList className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{summary.published ?? 0}</p>
            <p className="text-xs text-neutral-500">Published</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-950/40 text-red-300"><ClipboardList className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{summary.overdue ?? 0}</p>
            <p className="text-xs text-neutral-500">Overdue</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-950/40 text-violet-300"><ClipboardList className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{summary.avgScore ?? 0}%</p>
            <p className="text-xs text-neutral-500">Avg score</p>
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
              key: "name",
              header: "Assessment",
              render: (r) => (
                <div>
                  <span className="font-medium text-neutral-100">{r.name}</span>
                  <p className="text-[11px] text-neutral-600">{r.questionnaire?.name || "No questionnaire"}</p>
                </div>
              ),
            },
            {
              key: "scopeType",
              header: "Scope",
              render: (r) => (
                <div>
                  <span className={scopeChip(r.scopeType)}>{r.scopeType}</span>
                  <p className="mt-1 text-[11px] text-neutral-500">
                    {r.scopeType === "asset" ? r.asset?.name : r.scopeType === "vendor" ? r.vendorName : r.domain?.name || r.organization?.name || "—"}
                  </p>
                </div>
              ),
            },
            { key: "assignedTo", header: "Assigned to", render: (r) => <span className="text-neutral-300">{r.assignedTo || "—"}</span> },
            { key: "dueDate", header: "Due", render: (r) => <span className="text-neutral-400">{fmtDate(r.dueDate)}</span> },
            {
              key: "score",
              header: "Score",
              render: (r) => (r.score != null ? <span className="font-mono text-gold">{r.score}%</span> : <span className="text-neutral-600">—</span>),
            },
            { key: "status", header: "Status", render: (r) => <span className={statusChip(r.status)}>{r.status}</span> },
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
          searchPlaceholder="Search assessments…"
          emptyHint="Assign an active questionnaire to a scope and move it through the lifecycle."
          emptyAction={
            <button className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New assessment
            </button>
          }
          onRowClick={(r) => navigate(`/assessments/risk/${r._id}`)}
        />
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => !saving && setEditing(null)}
        title={editing === "new" ? "New assessment" : "Edit assessment"}
        subtitle="Assessments start in planning and move through data collection, scoring and review."
        width="max-w-2xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="assess-form" type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <form id="assess-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Assessment name" className="sm:col-span-2">
            <TextInput value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required placeholder="e.g. Core Banking Annual Assessment" />
          </Field>
          <Field label="Questionnaire" className="sm:col-span-2" hint="Only active questionnaires can be assigned">
            <select className="input" value={form.questionnaire} required onChange={(e) => setForm((s) => ({ ...s, questionnaire: e.target.value }))}>
              <option value="">— Select questionnaire —</option>
              {activeQs.map((q) => (
                <option key={q._id} value={q._id} className="bg-ink-deep">{q.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Scope type">
            <Select value={form.scopeType} onChange={(e) => setForm((s) => ({ ...s, scopeType: e.target.value }))} options={["asset", "vendor", "domain", "organization"]} />
          </Field>
          {form.scopeType === "asset" && (
            <Field label="Asset" className="sm:col-span-2">
              <select className="input" value={form.asset} required onChange={(e) => setForm((s) => ({ ...s, asset: e.target.value }))}>
                <option value="">— Select asset —</option>
                {assets.map((a) => (
                  <option key={a._id} value={a._id} className="bg-ink-deep">{a.name}</option>
                ))}
              </select>
            </Field>
          )}
          {form.scopeType === "vendor" && (
            <Field label="Vendor name" className="sm:col-span-2">
              <TextInput value={form.vendorName} onChange={(e) => setForm((s) => ({ ...s, vendorName: e.target.value }))} required placeholder="e.g. NorthCloud Ltd" />
            </Field>
          )}
          {form.scopeType === "domain" && (
            <Field label="Domain" className="sm:col-span-2">
              <select className="input" value={form.domain} required onChange={(e) => setForm((s) => ({ ...s, domain: e.target.value }))}>
                <option value="">— Select domain —</option>
                {domainsList.map((d) => (
                  <option key={d._id} value={d._id} className="bg-ink-deep">{d.name}</option>
                ))}
              </select>
            </Field>
          )}
          {form.scopeType === "organization" && (
            <Field label="Organization" className="sm:col-span-2">
              <select className="input" value={form.organization} required onChange={(e) => setForm((s) => ({ ...s, organization: e.target.value }))}>
                <option value="">— Select organization —</option>
                {orgsList.map((o) => (
                  <option key={o._id} value={o._id} className="bg-ink-deep">{o.name}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Assigned to">
            <TextInput value={form.assignedTo} onChange={(e) => setForm((s) => ({ ...s, assignedTo: e.target.value }))} placeholder="e.g. Core Systems" />
          </Field>
          <Field label="Reviewer">
            <TextInput value={form.reviewer} onChange={(e) => setForm((s) => ({ ...s, reviewer: e.target.value }))} placeholder="e.g. CRO" />
          </Field>
          <Field label="Due date">
            <TextInput type="date" value={form.dueDate} onChange={(e) => setForm((s) => ({ ...s, dueDate: e.target.value }))} />
          </Field>
          <Field label="Methodology">
            <TextInput value={form.methodology} onChange={(e) => setForm((s) => ({ ...s, methodology: e.target.value }))} placeholder="e.g. RCSA" />
          </Field>
        </form>
      </Modal>
    </>
  );
}
