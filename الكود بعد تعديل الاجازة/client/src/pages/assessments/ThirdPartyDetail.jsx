import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, FileCheck2, FileText, FolderOpen, Handshake, History, Link2, Loader2, Pencil, Plus, Trash2, TriangleAlert,
} from "lucide-react";
import api from "../../api/client";
import { ErrorState, LoadingState } from "../../components/States";
import Modal from "../../components/Modal";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import LifecycleStepper from "../../components/assessments/LifecycleStepper";
import { chipClass, fmtDate, fmtDateTime } from "../../lib/format";

const STAGES = [
  { key: "not-started", label: "Not started" },
  { key: "onboarding", label: "Onboarding" },
  { key: "in-review", label: "In review" },
  { key: "approved", label: "Approved" },
  { key: "monitoring", label: "Monitoring" },
  { key: "offboarding", label: "Offboarding" },
];

const FLOW = {
  "not-started": [{ key: "onboarding", label: "Start onboarding" }],
  onboarding: [{ key: "in-review", label: "Move to review" }],
  "in-review": [{ key: "approved", label: "Approve" }, { key: "rejected", label: "Reject" }],
  approved: [{ key: "monitoring", label: "Start monitoring" }],
  rejected: [{ key: "in-review", label: "Reassess" }, { key: "offboarding", label: "Offboard" }],
  monitoring: [{ key: "in-review", label: "Reassess" }, { key: "offboarding", label: "Offboard" }],
  offboarding: [],
};

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

const SEVERITIES = ["info", "low", "medium", "high", "critical"];
const FINDING_STATUSES = ["open", "in-progress", "mitigated", "accepted"];

const TABS = [
  { key: "overview", label: "Overview", icon: Handshake },
  { key: "assessments", label: "Assessments", icon: FileCheck2 },
  { key: "findings", label: "Findings", icon: TriangleAlert },
  { key: "documents", label: "Documents", icon: FolderOpen },
  { key: "trail", label: "Audit trail", icon: History },
];

export default function ThirdPartyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [v, setV] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/third-party/${id}`)
      .then((r) => setV(r.data))
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const transition = async (status) => {
    try {
      await api.post(`/third-party/${id}/transition`, { status });
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (loading || !v) return <LoadingState label="Loading vendor…" />;

  return (
    <div>
      <div className="flex items-start gap-3">
        <button onClick={() => navigate("/assessments/third-party")} className="mt-1 rounded-lg border border-line p-2 text-neutral-400 transition hover:text-gold" title="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="heading text-2xl font-semibold text-neutral-100">{v.vendorName}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
            <span className={vendorChip(v.vendorStatus)}>{v.vendorStatus}</span>
            {v.currentTier && <span className={chipClass(v.currentTier)}>{v.currentTier}</span>}
            <span>{v.serviceProvided || "—"}</span>
            {v.currentScore != null && <span className="font-mono text-gold">{v.currentScore}%</span>}
            <span>Next assessment {fmtDate(v.nextAssessment)}</span>
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex gap-1 overflow-x-auto border-b border-line pb-px">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition ${
                    active ? "border-gold text-gold" : "border-transparent text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="mt-5">
            {tab === "overview" && <OverviewTab v={v} reload={load} />}
            {tab === "assessments" && <AssessmentsTab v={v} reload={load} />}
            {tab === "findings" && <FindingsTab v={v} reload={load} />}
            {tab === "documents" && <DocumentsTab v={v} reload={load} />}
            {tab === "trail" && <TrailTab v={v} />}
          </div>
        </div>
        <div className="space-y-5">
          <LifecycleStepper stages={STAGES} current={v.vendorStatus} actions={FLOW[v.vendorStatus] || []} onAction={transition} hint="Vendor lifecycle — the server guards every move." />
          <MetaCard v={v} />
        </div>
      </div>
    </div>
  );
}

function MetaCard({ v }) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line bg-white/[0.02] px-5 py-4">
        <h2 className="heading text-sm font-semibold text-neutral-100">Vendor details</h2>
      </div>
      <div className="space-y-3 px-5 py-4 text-sm">
        {[
          ["Contact", v.contactEmail || "—"],
          ["Owner", v.owner || "—"],
          ["Data classification", v.dataClassification || "—"],
          ["DPA in place", v.dpaInPlace ? "Yes" : "No"],
          ["Contract", `${fmtDate(v.contractStart)} → ${fmtDate(v.contractEnd)}`],
          ["Last assessed", fmtDate(v.lastAssessed)],
          ["Assessment history", (v.assessmentHistory || []).length],
          ["Open findings", (v.findings || []).filter((f) => f.status !== "closed" && f.status !== "accepted").length],
        ].map(([k, val]) => (
          <div key={k} className="flex items-center justify-between gap-3">
            <span className="text-[11px] uppercase tracking-wider text-neutral-600">{k}</span>
            <span className="text-right text-neutral-200">{val}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

function OverviewTab({ v, reload }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    vendorName: v.vendorName,
    serviceProvided: v.serviceProvided || "",
    contactEmail: v.contactEmail || "",
    owner: v.owner || "",
    dataClassification: v.dataClassification || "",
    contractStart: v.contractStart ? new Date(v.contractStart).toISOString().slice(0, 10) : "",
    contractEnd: v.contractEnd ? new Date(v.contractEnd).toISOString().slice(0, 10) : "",
    dpaInPlace: Boolean(v.dpaInPlace),
    nextAssessment: v.nextAssessment ? new Date(v.nextAssessment).toISOString().slice(0, 10) : "",
    notes: v.notes || "",
  });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      for (const k of ["contractStart", "contractEnd", "nextAssessment"]) payload[k] = payload[k] ? new Date(payload[k]).toISOString() : undefined;
      await api.put(`/third-party/${v._id}`, payload);
      setEditing(false);
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white/[0.02] px-5 py-4">
        <div>
          <h2 className="heading text-sm font-semibold text-neutral-100">Vendor profile</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Contract, contact and classification details.</p>
        </div>
        <button className="btn-ghost px-3 py-1.5" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" /> Edit
        </button>
      </div>
      <div className="grid grid-cols-1 gap-x-8 px-5 py-4 md:grid-cols-2">
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-600">Service provided</p>
            <p className="mt-0.5 text-neutral-200">{v.serviceProvided || "—"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-600">Contact email</p>
            <p className="mt-0.5 text-neutral-200">{v.contactEmail || "—"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-600">Owner</p>
            <p className="mt-0.5 text-neutral-200">{v.owner || "—"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-600">Data classification</p>
            <p className="mt-0.5 text-neutral-200">{v.dataClassification || "—"}</p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-600">Contract</p>
            <p className="mt-0.5 text-neutral-200">{fmtDate(v.contractStart)} → {fmtDate(v.contractEnd)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-600">DPA</p>
            <p className="mt-0.5 text-neutral-200">{v.dpaInPlace ? "In place" : "Missing"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-600">Next assessment</p>
            <p className="mt-0.5 text-neutral-200">{fmtDate(v.nextAssessment)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-600">Notes</p>
            <p className="mt-0.5 text-neutral-200">{v.notes || "—"}</p>
          </div>
        </div>
      </div>

      <Modal
        open={editing}
        onClose={() => !saving && setEditing(false)}
        title="Edit vendor"
        width="max-w-2xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(false)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="v-edit-form" type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <form id="v-edit-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Vendor name">
            <TextInput value={form.vendorName} onChange={(e) => setForm((s) => ({ ...s, vendorName: e.target.value }))} required />
          </Field>
          <Field label="Service provided">
            <TextInput value={form.serviceProvided} onChange={(e) => setForm((s) => ({ ...s, serviceProvided: e.target.value }))} />
          </Field>
          <Field label="Contact email">
            <TextInput type="email" value={form.contactEmail} onChange={(e) => setForm((s) => ({ ...s, contactEmail: e.target.value }))} />
          </Field>
          <Field label="Owner">
            <TextInput value={form.owner} onChange={(e) => setForm((s) => ({ ...s, owner: e.target.value }))} />
          </Field>
          <Field label="Data classification">
            <Select value={form.dataClassification} onChange={(e) => setForm((s) => ({ ...s, dataClassification: e.target.value }))} options={["Public", "Internal", "Restricted", "Confidential", "Secret"]} />
          </Field>
          <Field label="DPA">
            <label className="flex items-center gap-3 py-2">
              <input type="checkbox" checked={form.dpaInPlace} onChange={(e) => setForm((s) => ({ ...s, dpaInPlace: e.target.checked }))} className="h-4 w-4 accent-[#D4AF37]" />
              <span className="text-sm text-neutral-300">DPA in place</span>
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
    </section>
  );
}

// ---------------------------------------------------------------------------
// Assessments
// ---------------------------------------------------------------------------

function AssessmentsTab({ v, reload }) {
  const [questionnaires, setQuestionnaires] = useState([]);
  const [starting, setStarting] = useState(false);
  const [form, setForm] = useState({ questionnaire: "", respondent: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [fresh, setFresh] = useState(null);

  useEffect(() => {
    api.get("/questionnaires", { params: { status: "active" } }).then((r) => setQuestionnaires(r.data.items)).catch(() => {});
  }, []);

  const start = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await api.post(`/third-party/${v._id}/assessments`, form).then((r) => r.data);
      setFresh({ response: data.response, historyId: data.historyId });
      setStarting(false);
      setForm({ questionnaire: "", respondent: "", notes: "" });
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const url = fresh?.response?.linkToken ? `${window.location.origin}/assessments/respond/${fresh.response.linkToken}` : "";

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white/[0.02] px-5 py-4">
        <div>
          <h2 className="heading text-sm font-semibold text-neutral-100">Assessment history</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Every questionnaire round with the vendor and its score.</p>
        </div>
        <button className="btn-primary px-3 py-1.5" onClick={() => setStarting(true)}>
          <Plus className="h-3.5 w-3.5" /> Start assessment
        </button>
      </div>

      {fresh && (
        <div className="border-b border-line bg-emerald-950/30 px-5 py-4">
          <p className="text-sm text-emerald-300">Assessment started — share this link with the vendor contact:</p>
          <code className="mt-1 block break-all text-xs text-gold-light">{url}</code>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line bg-white/[0.02]">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Date</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Questionnaire</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Respondent</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Score</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Tier</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {(v.assessmentHistory || []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-sm text-neutral-600">No assessments yet — start the first round.</td>
              </tr>
            )}
            {(v.assessmentHistory || []).map((h) => (
              <tr key={h._id} className="border-b border-line/60 last:border-0">
                <td className="px-5 py-3 text-neutral-400">{fmtDate(h.date)}</td>
                <td className="px-5 py-3 text-neutral-200">{h.questionnaireName || "—"}</td>
                <td className="px-5 py-3 text-neutral-300">{h.respondent || "—"}</td>
                <td className="px-5 py-3 font-mono text-neutral-200">{h.score != null ? `${h.score}%` : "—"}</td>
                <td className="px-5 py-3">{h.tier ? <span className={chipClass(h.tier)}>{h.tier}</span> : <span className="text-neutral-600">—</span>}</td>
                <td className="px-5 py-3"><span className={chipClass(h.status)}>{h.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={starting}
        onClose={() => !saving && setStarting(false)}
        title="Start vendor assessment"
        subtitle="Creates a response link for the vendor contact and logs the round."
        width="max-w-md"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setStarting(false)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="start-form" type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Starting…" : "Start"}
            </button>
          </>
        }
      >
        <form id="start-form" onSubmit={start} className="grid grid-cols-1 gap-4">
          <Field label="Questionnaire">
            <select className="input" value={form.questionnaire} required onChange={(e) => setForm((s) => ({ ...s, questionnaire: e.target.value }))}>
              <option value="">— Select questionnaire —</option>
              {questionnaires.map((q) => (
                <option key={q._id} value={q._id} className="bg-ink-deep">{q.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Respondent (vendor contact)">
            <TextInput value={form.respondent} onChange={(e) => setForm((s) => ({ ...s, respondent: e.target.value }))} required placeholder={v.contactEmail || "vendor contact"} />
          </Field>
          <Field label="Notes">
            <TextArea value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
          </Field>
        </form>
      </Modal>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------

function FindingsTab({ v, reload }) {
  const [adding, setAdding] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [pushing, setPushing] = useState(null);
  const [domains, setDomains] = useState([]);
  const [pushDomain, setPushDomain] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", severity: "medium", owner: "" });

  useEffect(() => {
    api.get("/domains").then((r) => setDomains(r.data.items.filter((d) => d.status === "active"))).catch(() => {});
  }, []);

  const openCreate = () => {
    setForm({ title: "", description: "", severity: "medium", owner: "" });
    setEditingItem(null);
    setAdding(true);
  };

  const openEdit = (f) => {
    setForm({ title: f.title, description: f.description || "", severity: f.severity, owner: f.owner || "" });
    setEditingItem(f);
    setAdding(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) await api.put(`/third-party/${v._id}/findings/${editingItem._id}`, form);
      else await api.post(`/third-party/${v._id}/findings`, form);
      setAdding(false);
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const push = async () => {
    if (!pushDomain) return;
    setSaving(true);
    try {
      const data = await api.post(`/third-party/${v._id}/findings/${pushing._id}/push`, { domain: pushDomain }).then((r) => r.data);
      alert(`Finding pushed to the register (${data.risk.riskId || "R-"}).`);
      setPushing(null);
      setPushDomain("");
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white/[0.02] px-5 py-4">
        <div>
          <h2 className="heading text-sm font-semibold text-neutral-100">Findings</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Issues raised against the vendor — push them to the risk register.</p>
        </div>
        <button className="btn-primary px-3 py-1.5" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" /> Add finding
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line bg-white/[0.02]">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Finding</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Severity</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Owner</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Status</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Register</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500"></th>
            </tr>
          </thead>
          <tbody>
            {(v.findings || []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-sm text-neutral-600">No findings yet.</td>
              </tr>
            )}
            {(v.findings || []).map((f) => (
              <tr key={f._id} className="border-b border-line/60 last:border-0">
                <td className="px-5 py-3">
                  <p className="font-medium text-neutral-100">{f.title}</p>
                  {f.description && <p className="mt-0.5 max-w-md text-[11px] text-neutral-500">{f.description}</p>}
                </td>
                <td className="px-5 py-3"><span className={chipClass(f.severity)}>{f.severity}</span></td>
                <td className="px-5 py-3 text-neutral-300">{f.owner || "—"}</td>
                <td className="px-5 py-3"><span className={chipClass(f.status)}>{f.status}</span></td>
                <td className="px-5 py-3">
                  {f.pushedToRegister ? (
                    <span className={chipClass("approved")}>Pushed</span>
                  ) : (
                    <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => { setPushing(f); setPushDomain(""); }}>
                      Push to register
                    </button>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => openEdit(f)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-white/5 hover:text-gold" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={adding}
        onClose={() => !saving && setAdding(false)}
        title={editingItem ? "Edit finding" : "Add finding"}
        width="max-w-lg"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setAdding(false)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="finding-form" type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <form id="finding-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2">
            <TextInput value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} required />
          </Field>
          <Field label="Severity">
            <Select value={form.severity} onChange={(e) => setForm((s) => ({ ...s, severity: e.target.value }))} options={SEVERITIES} />
          </Field>
          <Field label="Owner">
            <TextInput value={form.owner} onChange={(e) => setForm((s) => ({ ...s, owner: e.target.value }))} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <TextArea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
          </Field>
        </form>
      </Modal>

      <Modal
        open={Boolean(pushing)}
        onClose={() => !saving && setPushing(null)}
        title="Push finding to register"
        subtitle={`Score and register "${pushing?.title}".`}
        width="max-w-md"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setPushing(null)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" onClick={push} disabled={saving || !pushDomain}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Pushing…" : "Push"}
            </button>
          </>
        }
      >
        <Field label="Register domain" hint="Scored with this domain's active parameter">
          <select className="input" value={pushDomain} onChange={(e) => setPushDomain(e.target.value)}>
            <option value="">— Select domain —</option>
            {domains.map((d) => (
              <option key={d._id} value={d._id} className="bg-ink-deep">{d.name}</option>
            ))}
          </select>
        </Field>
      </Modal>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

function DocumentsTab({ v, reload }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", type: "", link: "", description: "" });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/third-party/${v._id}/documents`, form);
      setAdding(false);
      setForm({ name: "", type: "", link: "", description: "" });
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (d) => {
    if (!window.confirm(`Remove document "${d.name}"?`)) return;
    try {
      await api.delete(`/third-party/${v._id}/documents/${d._id}`);
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white/[0.02] px-5 py-4">
        <div>
          <h2 className="heading text-sm font-semibold text-neutral-100">Documents</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Contracts, attestations, audit reports and exit plans.</p>
        </div>
        <button className="btn-primary px-3 py-1.5" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5" /> Attach document
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line bg-white/[0.02]">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Document</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Type</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Uploaded</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Link</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500"></th>
            </tr>
          </thead>
          <tbody>
            {(v.documents || []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-sm text-neutral-600">No documents attached.</td>
              </tr>
            )}
            {(v.documents || []).map((d) => (
              <tr key={d._id} className="border-b border-line/60 last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-neutral-500" />
                    <div>
                      <p className="font-medium text-neutral-100">{d.name}</p>
                      {d.description && <p className="text-[11px] text-neutral-500">{d.description}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-neutral-300">{d.type || "—"}</td>
                <td className="px-5 py-3 text-neutral-400">{fmtDate(d.uploadedAt)}</td>
                <td className="px-5 py-3">
                  {d.link ? (
                    <a href={d.link} target="_blank" rel="noreferrer" className="text-gold-light hover:underline" title={d.link}>
                      <Link2 className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-neutral-600">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => remove(d)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-red-950/40 hover:text-red-300" title="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={adding}
        onClose={() => !saving && setAdding(false)}
        title="Attach document"
        subtitle="Record a reference to the vendor document."
        width="max-w-md"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setAdding(false)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="doc-form" type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <form id="doc-form" onSubmit={save} className="grid grid-cols-1 gap-4">
          <Field label="Name">
            <TextInput value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required placeholder="e.g. ISO 27001 Certificate 2026" />
          </Field>
          <Field label="Type">
            <TextInput value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))} placeholder="e.g. Attestation, Contract" />
          </Field>
          <Field label="Link">
            <TextInput value={form.link} onChange={(e) => setForm((s) => ({ ...s, link: e.target.value }))} placeholder="https://…" />
          </Field>
          <Field label="Description">
            <TextArea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
          </Field>
        </form>
      </Modal>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

function TrailTab({ v }) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line bg-white/[0.02] px-5 py-4">
        <h2 className="heading text-sm font-semibold text-neutral-100">Audit trail</h2>
        <p className="mt-0.5 text-xs text-neutral-500">Lifecycle moves, assessments, findings and documents.</p>
      </div>
      <div className="px-5 py-4">
        {(v.auditTrail || []).length === 0 && <p className="text-sm text-neutral-600">No trail entries yet.</p>}
        {(v.auditTrail || [])
          .slice()
          .reverse()
          .map((t, i) => (
            <div key={i} className="flex gap-3 border-b border-line/50 py-3 last:border-0">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold/70" />
              <div>
                <p className="text-sm text-neutral-200">{t.action}</p>
                <p className="text-xs text-neutral-500">{fmtDateTime(t.at)} · {t.by}</p>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
