import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Copy, FilePlus2, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import api, { resource } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { ErrorState } from "../../components/States";
import { Field, TextArea, TextInput } from "../../components/Field";
import { chipClass, fmtDate } from "../../lib/format";

const questionnaires = resource("questionnaires");

const FILTERS = [
  { key: "", label: "All" },
  { key: "active", label: "Active" },
  { key: "draft", label: "Draft" },
  { key: "retired", label: "Retired" },
];

const statusChip = (s) =>
  chipClass(s, {
    active: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
    draft: "border-neutral-700 bg-neutral-900 text-neutral-400",
    retired: "border-neutral-700 bg-neutral-900 text-neutral-500",
  });

export default function Questionnaires() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", description: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    questionnaires
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

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const doc = await questionnaires.create(form);
      setCreating(false);
      setForm({ name: "", category: "", description: "" });
      navigate(`/assessments/questionnaires/${doc._id}`);
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const transition = async (row, status) => {
    try {
      await api.post(`/questionnaires/${row._id}/transition`, { status });
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  const duplicate = async (row) => {
    try {
      await api.post(`/questionnaires/${row._id}/duplicate`);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete questionnaire "${row.name}"?`)) return;
    try {
      await questionnaires.remove(row._id);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Questionnaires"
        subtitle="Reusable assessment templates — build sections of weighted questions, activate for distribution, and track responses."
        actions={
          <button className="btn-primary" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New questionnaire
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold"><FilePlus2 className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{summary.total ?? 0}</p>
            <p className="text-xs text-neutral-500">Total</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950/40 text-emerald-300"><FilePlus2 className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{summary.active ?? 0}</p>
            <p className="text-xs text-neutral-500">Active</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300"><FilePlus2 className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{summary.draft ?? 0}</p>
            <p className="text-xs text-neutral-500">Draft</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400"><FilePlus2 className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{summary.retired ?? 0}</p>
            <p className="text-xs text-neutral-500">Retired</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-950/40 text-sky-300"><FilePlus2 className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{summary.responses ?? 0}</p>
            <p className="text-xs text-neutral-500">Responses</p>
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
                {FILTERS.map((f) => (
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
              header: "Questionnaire",
              render: (r) => (
                <div>
                  <span className="font-medium text-neutral-100">{r.name}</span>
                  <p className="text-[11px] text-neutral-600">{r.category || "—"}</p>
                </div>
              ),
            },
            {
              key: "sectionCount",
              header: "Sections",
              render: (r) => <span className="font-mono text-neutral-300">{r.sectionCount}</span>,
            },
            {
              key: "questionCount",
              header: "Questions",
              render: (r) => <span className="font-mono text-neutral-300">{r.questionCount}</span>,
            },
            {
              key: "responseCount",
              header: "Responses",
              render: (r) => <span className={`font-mono ${r.responseCount ? "text-gold" : "text-neutral-600"}`}>{r.responseCount}</span>,
            },
            { key: "lastUsedAt", header: "Last used", render: (r) => <span className="text-neutral-400">{fmtDate(r.lastUsedAt)}</span> },
            { key: "status", header: "Status", render: (r) => <span className={statusChip(r.status)}>{r.status}</span> },
            {
              key: "__a",
              header: "",
              sortable: false,
              className: "w-36 text-right",
              render: (r) => (
                <div className="flex justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                  {r.status !== "active" && (
                    <button className="rounded-md p-1.5 text-neutral-500 transition hover:bg-emerald-950/40 hover:text-emerald-300" title="Activate" onClick={() => transition(r, "active")}>
                      <FilePlus2 className="h-4 w-4" />
                    </button>
                  )}
                  {r.status !== "retired" && (
                    <button className="rounded-md p-1.5 text-neutral-500 transition hover:bg-amber-950/40 hover:text-amber-300" title="Retire" onClick={() => transition(r, "retired")}>
                      <Copy className="h-4 w-4 rotate-180" />
                    </button>
                  )}
                  <button className="rounded-md p-1.5 text-neutral-500 transition hover:bg-white/5 hover:text-gold" title="Duplicate" onClick={() => duplicate(r)}>
                    <Copy className="h-4 w-4" />
                  </button>
                  <button className="rounded-md p-1.5 text-neutral-500 transition hover:bg-red-950/40 hover:text-red-300" title="Delete" onClick={() => remove(r)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            },
          ]}
          rows={rows}
          loading={loading}
          searchPlaceholder="Search questionnaires…"
          emptyHint="Build a questionnaire template, then activate it to start collecting responses."
          emptyAction={
            <button className="btn-primary" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> New questionnaire
            </button>
          }
          onRowClick={(r) => navigate(`/assessments/questionnaires/${r._id}`)}
        />
      )}

      <Modal
        open={creating}
        onClose={() => !saving && setCreating(false)}
        title="New questionnaire"
        subtitle="Created as a draft — build sections and questions, then activate."
        width="max-w-lg"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setCreating(false)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="q-form" type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Creating…" : "Create"}
            </button>
          </>
        }
      >
        <form id="q-form" onSubmit={create} className="grid grid-cols-1 gap-4">
          <Field label="Name">
            <TextInput value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required placeholder="e.g. Vendor Information Security Due Diligence" />
          </Field>
          <Field label="Category" hint="e.g. Third Party, Internal">
            <TextInput value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} placeholder="Third Party" />
          </Field>
          <Field label="Description">
            <TextArea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
