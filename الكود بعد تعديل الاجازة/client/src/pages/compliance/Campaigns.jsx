import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Plus, Send } from "lucide-react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { ErrorState } from "../../components/States";
import { Field, Select, TextInput } from "../../components/Field";
import { chipClass, fmtDate, fmtDateInput } from "../../lib/format";

const CAMPAIGN_STATUSES = ["Draft", "Active", "Closed"];
const RESPONSE_STATUSES = ["Not Started", "In Progress", "Submitted"];
const RESPONSE_RESULTS = ["Pass", "Partial", "Fail"];

export default function Campaigns() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [frameworks, setFrameworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get("/compliance/campaigns")
      .then((r) => setRows(r.data.items || []))
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    api.get("/compliance/campaigns/stats").then((r) => setStats(r.data));
    api.get("/frameworks", { params: { pageSize: 100 } }).then((r) => setFrameworks(r.data.items || []));
  }, [load]);

  const openNew = () => {
    setForm({ name: "", frameworkIds: [], domainFilter: "", startDate: fmtDateInput(new Date()), dueDate: "", status: "Active", reminderSchedule: ["t-7d", "t-1d"] });
    setEditing("new");
  };

  const toggle = (key, id) =>
    setForm((f) => ({ ...f, [key]: (f[key] || []).includes(id) ? f[key].filter((x) => x !== id) : [...(f[key] || []), id] }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      payload.startDate = new Date(payload.startDate).toISOString();
      payload.dueDate = new Date(payload.dueDate).toISOString();
      await api.post("/compliance/campaigns", payload);
      setEditing(null);
      load();
    } catch (err) {
      window.alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const statsCards = [
    { label: "Active campaigns", value: stats.active, style: "border-sky-800/60 bg-sky-950/40 text-sky-300" },
    { label: "Pending responses", value: stats.pendingResponses, style: "border-amber-800/60 bg-amber-950/40 text-amber-300" },
    { label: "Completion rate", value: stats.completionRate != null ? `${stats.completionRate}%` : "—", style: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300" },
    { label: "Overdue campaigns", value: stats.overdueCampaigns, style: "border-red-800/60 bg-red-950/40 text-red-300" },
  ];

  return (
    <>
      <PageHeader
        title="Assessment Campaigns"
        subtitle="Assign control assessments to owners across framework scope, track responses and write results back to the control library."
        actions={
          <button className="btn-primary" onClick={openNew}><Plus className="h-4 w-4" /> New Campaign</button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statsCards.map((c) => (
          <div key={c.label} className="card p-3">
            <div className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${c.style}`}>{c.value ?? "—"}</div>
            <div className="mt-1.5 text-[11px] leading-tight text-neutral-400">{c.label}</div>
          </div>
        ))}
      </div>

      {error && !loading ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <DataTable
          columns={[
            { key: "name", header: "Campaign", render: (r) => <span className="font-medium text-neutral-100">{r.name}</span> },
            { key: "status", header: "Status", render: (r) => <span className={`chip ${chipClass(r.status)}`}>{r.status}</span> },
            { key: "dueDate", header: "Due", render: (r) => <span className={new Date(r.dueDate) < new Date() && r.status !== "Closed" ? "text-red-300" : ""}>{fmtDate(r.dueDate)}</span> },
            { key: "assignedOwners", header: "Owners", render: (r) => <span className="text-xs">{r.assignedOwners?.filter(Boolean).join(", ") || "—"}</span> },
            {
              key: "completionPercent",
              header: "Completion",
              render: (r) => (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${r.completionPercent || 0}%` }} />
                  </div>
                  <span className="text-xs text-neutral-500">{r.completionPercent || 0}%</span>
                </div>
              ),
            },
          ]}
          rows={rows}
          loading={loading}
          searchPlaceholder="Search campaigns…"
          emptyHint="Create your first assessment campaign."
          onRowClick={(r) => api.get(`/compliance/campaigns/${r._id}`).then((d) => setDetail(d.data))}
        />
      )}

      <Modal open={editing === "new"} onClose={() => setEditing(null)} title="New assessment campaign" subtitle="One response is generated per in-scope control, owned by the control owner." width="max-w-2xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} type="button">Cancel</button>
            <button className="btn-primary" form="campaign-form" type="submit" disabled={saving}>{saving ? "Creating…" : "Create campaign"}</button>
          </>
        }
      >
        <form id="campaign-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Campaign name" className="sm:col-span-2"><TextInput value={form.name || ""} required onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. 2026 H1 Control Assessment" /></Field>
          <Field label="Frameworks in scope" className="sm:col-span-2">
            <div className="flex flex-wrap gap-2">
              {frameworks.map((f) => (
                <button key={f._id} type="button" onClick={() => toggle("frameworkIds", f._id)} className={`chip transition ${form.frameworkIds?.includes(f._id) ? "border-gold/60 bg-gold/10 text-gold-light" : "border-neutral-700 bg-neutral-900 text-neutral-400"}`}>
                  {f.name}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Domain filter"><TextInput value={form.domainFilter || ""} onChange={(e) => setForm((f) => ({ ...f, domainFilter: e.target.value }))} placeholder="Optional — blank = all domains" /></Field>
          <Field label="Status"><Select value={form.status || "Active"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} options={CAMPAIGN_STATUSES.map((s) => ({ value: s, label: s }))} /></Field>
          <Field label="Start date"><TextInput type="date" value={form.startDate || ""} required onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} /></Field>
          <Field label="Due date"><TextInput type="date" value={form.dueDate || ""} required onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} /></Field>
          <Field label="Reminder schedule" className="sm:col-span-2">
            <div className="flex flex-wrap gap-2">
              {["t-14d", "t-7d", "t-1d"].map((s) => (
                <button key={s} type="button" onClick={() => toggle("reminderSchedule", s)} className={`chip transition ${form.reminderSchedule?.includes(s) ? "border-gold/60 bg-gold/10 text-gold-light" : "border-neutral-700 bg-neutral-900 text-neutral-400"}`}>
                  {s}
                </button>
              ))}
            </div>
          </Field>
        </form>
      </Modal>

      {detail && <CampaignDetailModal campaign={detail} onClose={() => setDetail(null)} onSaved={() => { setDetail(null); load(); }} />}
    </>
  );
}

function CampaignDetailModal({ campaign, onClose, onSaved }) {
  const [current, setCurrent] = useState(campaign);
  const [responses, setResponses] = useState({});

  useEffect(() => {
    setCurrent(campaign);
    const init = {};
    for (const r of campaign.responses || []) init[r._id] = { result: r.result || "", owner: r.owner || "" };
    setResponses(init);
  }, [campaign]);

  const update = async (resp, patch) => {
    try {
      await api.put(`/compliance/campaigns/${current._id}/responses/${resp._id}`, { ...patch, campaignName: current.name });
      const d = await api.get(`/compliance/campaigns/${current._id}`);
      setCurrent(d.data);
      onSaved();
    } catch (err) {
      window.alert(err?.response?.data?.message || err.message);
    }
  };

  const submitted = (current.responses || []).filter((r) => r.responseStatus === "Submitted").length;
  const total = (current.responses || []).length;

  return (
    <Modal open onClose={onClose} title={current.name} subtitle={`Due ${fmtDate(current.dueDate)} · ${submitted}/${total} responses submitted`} width="max-w-4xl"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} type="button">Close</button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <CalendarClock className="h-4 w-4 text-gold" />
          <span>{(current.frameworkIds || []).map((f) => f.name).join(", ") || "No frameworks"}</span>
        </div>
        <span className={`chip ${chipClass(current.status)}`}>{current.status}</span>
        {current.reminderSchedule?.length > 0 && <span className="text-xs text-neutral-500">Reminders: {current.reminderSchedule.join(", ")}</span>}
      </div>

      <DataTable
        columns={[
          { key: "control", header: "Control", render: (r) => <div><div className="font-medium text-neutral-100">{r.control?.controlId} — {r.control?.name}</div><div className="text-[10px] text-neutral-500">{r.control?.framework?.name || ""}</div></div> },
          { key: "owner", header: "Owner", render: (r) => <TextInput className="w-36" value={responses[r._id]?.owner || ""} onChange={(e) => { setResponses((s) => ({ ...s, [r._id]: { ...s[r._id], owner: e.target.value } })); update(r, { owner: e.target.value }); }} /> },
          { key: "responseStatus", header: "Status", render: (r) => <span className={`chip ${chipClass(r.responseStatus)}`}>{r.responseStatus}</span> },
          { key: "submittedAt", header: "Submitted", render: (r) => fmtDate(r.submittedAt) },
          {
            key: "result",
            header: "Result",
            sortable: false,
            render: (r) =>
              r.responseStatus === "Submitted" ? (
                <span className={`chip ${r.result === "Pass" ? "border-emerald-800/60 bg-emerald-950/40 text-emerald-300" : r.result === "Partial" ? "border-amber-800/60 bg-amber-950/40 text-amber-300" : "border-red-800/60 bg-red-950/40 text-red-300"}`}>{r.result}</span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Select className="w-28" value={responses[r._id]?.result || "Pass"} onChange={(e) => setResponses((s) => ({ ...s, [r._id]: { ...s[r._id], result: e.target.value } }))} options={RESPONSE_RESULTS.map((v) => ({ value: v, label: v }))} />
                  <button className="btn-primary px-2 py-1 text-xs" onClick={() => update(r, { responseStatus: "Submitted", result: responses[r._id]?.result || "Pass" })} disabled={r.responseStatus === "Submitted"}>
                    <Send className="h-3 w-3" /> Submit
                  </button>
                </div>
              ),
          },
        ]}
        rows={current.responses || []}
        loading={false}
        searchPlaceholder="Search responses…"
        emptyHint="No controls in scope for this campaign."
        pageSize={12}
      />
    </Modal>
  );
}
