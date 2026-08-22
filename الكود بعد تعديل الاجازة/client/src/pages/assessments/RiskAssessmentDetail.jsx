import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, ClipboardList, CopyPlus, ExternalLink, FileCheck2, History, Loader2, Pencil, Plus, Send, Trash2, TriangleAlert,
} from "lucide-react";
import api from "../../api/client";
import { ErrorState, LoadingState } from "../../components/States";
import Modal from "../../components/Modal";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import LifecycleStepper from "../../components/assessments/LifecycleStepper";
import { chipClass, fmtDate, fmtDateTime } from "../../lib/format";

const STAGES = [
  { key: "planning", label: "Planning" },
  { key: "data-collection", label: "Data collection" },
  { key: "scoring", label: "Scoring" },
  { key: "review", label: "Review" },
  { key: "published", label: "Published" },
];

const FLOW = {
  planning: [{ key: "data-collection", label: "Start data collection" }, { key: "cancelled", label: "Cancel" }],
  "data-collection": [{ key: "scoring", label: "Move to scoring" }, { key: "cancelled", label: "Cancel" }],
  scoring: [{ key: "review", label: "Move to review" }, { key: "cancelled", label: "Cancel" }],
  review: [{ key: "published", label: "Publish" }, { key: "cancelled", label: "Cancel" }],
  published: [{ key: "data-collection", label: "Re-open collection" }],
  cancelled: [],
};

const statusChip = (s) =>
  chipClass(s, {
    planning: "border-neutral-700 bg-neutral-900 text-neutral-400",
    "data-collection": "border-sky-800/60 bg-sky-950/40 text-sky-300",
    scoring: "border-violet-800/60 bg-violet-950/40 text-violet-300",
    review: "border-amber-800/60 bg-amber-950/40 text-amber-300",
    published: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
    cancelled: "border-red-800/60 bg-red-950/40 text-red-300",
  });

const RISK_STATUSES = ["open", "accepted", "mitigated", "transferred", "closed"];
const RISK_CATEGORIES = ["cyber", "operational", "compliance", "strategic", "credit", "liquidity", "market", "reputational"];

const TABS = [
  { key: "overview", label: "Overview", icon: ClipboardList },
  { key: "questionnaire", label: "Questionnaire", icon: FileCheck2 },
  { key: "risks", label: "Identified risks", icon: TriangleAlert },
  { key: "approvals", label: "Approvals", icon: Pencil },
  { key: "trail", label: "Audit trail", icon: History },
];

export default function RiskAssessmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [a, setA] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/assessments/${id}`)
      .then((r) => setA(r.data))
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const transition = async (status) => {
    try {
      await api.post(`/assessments/${id}/transition`, { status });
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (loading || !a) return <LoadingState label="Loading assessment…" />;

  const scopeLabel =
    a.scopeType === "asset" ? a.asset?.name
    : a.scopeType === "vendor" ? a.vendorName
    : a.scopeType === "domain" ? a.domain?.name
    : a.organization?.name || "—";

  return (
    <div>
      <div className="flex items-start gap-3">
        <button onClick={() => navigate("/assessments/risk")} className="mt-1 rounded-lg border border-line p-2 text-neutral-400 transition hover:text-gold" title="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="heading text-2xl font-semibold text-neutral-100">{a.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
            <span className={statusChip(a.status)}>{a.status}</span>
            <span>{scopeLabel}</span>
            <span>{a.questionnaire?.name || "No questionnaire"}</span>
            {a.score != null && <span className="font-mono text-gold">{a.score}%</span>}
            <span>Due {fmtDate(a.dueDate)}</span>
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
            {tab === "overview" && <OverviewTab a={a} reload={load} />}
            {tab === "questionnaire" && <QuestionnaireTab a={a} reload={load} />}
            {tab === "risks" && <RisksTab a={a} reload={load} />}
            {tab === "approvals" && <ApprovalsTab a={a} reload={load} />}
            {tab === "trail" && <TrailTab a={a} />}
          </div>
        </div>
        <div className="space-y-5">
          <LifecycleStepper stages={STAGES} current={a.status} actions={FLOW[a.status] || []} onAction={transition} hint="Guarded transitions — the server enforces the flow." />
          <MetaCard a={a} />
        </div>
      </div>
    </div>
  );
}

function MetaCard({ a }) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line bg-white/[0.02] px-5 py-4">
        <h2 className="heading text-sm font-semibold text-neutral-100">Details</h2>
      </div>
      <div className="space-y-3 px-5 py-4 text-sm">
        {[
          ["Scope type", a.scopeType],
          ["Assigned to", a.assignedTo || "—"],
          ["Reviewer", a.reviewer || "—"],
          ["Methodology", a.methodology || "—"],
          ["Started", fmtDate(a.startedAt)],
          ["Completed", fmtDate(a.completedAt)],
          ["Published", fmtDate(a.publishedAt)],
          ["Identified risks", (a.identifiedRisks || []).length],
          ["Approvals", (a.approvals || []).length],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3">
            <span className="text-[11px] uppercase tracking-wider text-neutral-600">{k}</span>
            <span className="text-right text-neutral-200">{v ?? "—"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

function OverviewTab({ a, reload }) {
  const [responding, setResponding] = useState(false);
  const [respondent, setRespondent] = useState("");
  const [saving, setSaving] = useState(false);
  const [fresh, setFresh] = useState(null);

  const distribute = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await api.post(`/assessments/${a._id}/respond`, { respondent }).then((r) => r.data);
      setFresh(data.response);
      setResponding(false);
      setRespondent("");
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const url = fresh?.linkToken ? `${window.location.origin}/assessments/respond/${fresh.linkToken}` : "";

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white/[0.02] px-5 py-4">
        <div>
          <h2 className="heading text-sm font-semibold text-neutral-100">Assessment overview</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Distribute the questionnaire, then move the assessment through the lifecycle.</p>
        </div>
        {!a.responseId && (
          <button className="btn-primary px-3 py-1.5" onClick={() => setResponding(true)} disabled={!a.questionnaire}>
            <Send className="h-3.5 w-3.5" /> Distribute questionnaire
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-x-8 px-5 py-4 md:grid-cols-2">
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-600">Name</p>
            <p className="mt-0.5 text-neutral-200">{a.name}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-600">Questionnaire</p>
            <p className="mt-0.5 text-neutral-200">{a.questionnaire?.name || "—"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-600">Scope</p>
            <p className="mt-0.5 text-neutral-200">
              {a.scopeType}: {a.scopeType === "asset" ? a.asset?.name : a.scopeType === "vendor" ? a.vendorName : a.scopeType === "domain" ? a.domain?.name : a.organization?.name}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-600">Due date</p>
            <p className="mt-0.5 text-neutral-200">{fmtDate(a.dueDate)}</p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-600">Assigned to</p>
            <p className="mt-0.5 text-neutral-200">{a.assignedTo || "—"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-600">Reviewer</p>
            <p className="mt-0.5 text-neutral-200">{a.reviewer || "—"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-600">Methodology</p>
            <p className="mt-0.5 text-neutral-200">{a.methodology || "—"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-600">Overall score</p>
            <p className="mt-0.5 font-mono text-gold">{a.score != null ? `${a.score}%` : "—"}</p>
          </div>
        </div>
      </div>

      {a.sectionScores?.length > 0 && (
        <div className="border-t border-line px-5 py-4">
          <p className="label mb-2">Section scores</p>
          <div className="flex flex-wrap gap-2">
            {a.sectionScores.map((s) => (
              <span key={s.sectionIndex} className="chip border-gold/30 bg-gold/5 text-gold-light">
                {s.title || `Section ${s.sectionIndex + 1}`}: {s.score}%
              </span>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={responding}
        onClose={() => !saving && setResponding(false)}
        title="Distribute questionnaire"
        subtitle={`Send "${a.questionnaire?.name}" to a respondent.`}
        width="max-w-md"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setResponding(false)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="respond-form" type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Sending…" : "Send"}
            </button>
          </>
        }
      >
        <form id="respond-form" onSubmit={distribute} className="grid grid-cols-1 gap-4">
          <Field label="Respondent">
            <TextInput value={respondent} onChange={(e) => setRespondent(e.target.value)} required placeholder="e.g. asset.owner@bank.io" />
          </Field>
          {fresh && (
            <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/30 p-3">
              <p className="text-xs text-emerald-300">Response link created:</p>
              <code className="mt-1 block break-all text-xs text-gold-light">{url}</code>
            </div>
          )}
        </form>
      </Modal>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Questionnaire
// ---------------------------------------------------------------------------

function QuestionnaireTab({ a, reload }) {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!a.responseId) {
      setLoading(false);
      return;
    }
    api
      .get(`/responses/${a.responseId}`)
      .then((r) => setResponse(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [a.responseId, a]);

  if (!a.responseId) {
    return (
      <section className="card overflow-hidden">
        <div className="border-b border-line bg-white/[0.02] px-5 py-4">
          <h2 className="heading text-sm font-semibold text-neutral-100">Questionnaire</h2>
        </div>
        <p className="px-5 py-8 text-center text-sm text-neutral-600">
          No questionnaire distributed yet — use "Distribute questionnaire" on the Overview tab.
        </p>
      </section>
    );
  }

  const url = response?.linkToken ? `${window.location.origin}/assessments/respond/${response.linkToken}` : "";
  const [copied, setCopied] = useState(false);

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white/[0.02] px-5 py-4">
        <div>
          <h2 className="heading text-sm font-semibold text-neutral-100">Response collection</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            {loading ? "Loading…" : response ? `Status ${response.status} · respondent ${response.respondent || "—"}` : "Response not found."}
          </p>
        </div>
        {response?.status !== "submitted" && (
          <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
            <CopyPlus className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy response link"}
          </button>
        )}
      </div>
      <div className="space-y-4 px-5 py-4">
        {loading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className={chipClass(response?.status)}>{response?.status}</span>
              <span className="font-mono text-sm text-neutral-300">Score: {response?.overallScore != null ? `${response.overallScore}%` : "—"}</span>
              <span className="text-xs text-neutral-500">Submitted {fmtDateTime(response?.submittedAt)}</span>
            </div>
            {response?.sectionScores?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {response.sectionScores.map((s) => (
                  <span key={s.sectionIndex} className="chip border-gold/30 bg-gold/5 text-gold-light">
                    {s.title || `Section ${s.sectionIndex + 1}`}: {s.score}%
                  </span>
                ))}
              </div>
            )}
            <div className="rounded-lg border border-line bg-white/[0.02] p-3">
              <p className="text-[11px] uppercase tracking-wider text-neutral-600">Response link</p>
              <code className="mt-1 block break-all text-xs text-gold-light">{url}</code>
              <button className="btn-ghost mt-2 px-3 py-1.5 text-xs" onClick={() => window.open(url, "_blank")}>
                <ExternalLink className="h-3.5 w-3.5" /> Open
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Identified risks
// ---------------------------------------------------------------------------

function RisksTab({ a, reload }) {
  const [adding, setAdding] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [pushing, setPushing] = useState(null);
  const [domains, setDomains] = useState([]);
  const [pushDomain, setPushDomain] = useState("");
  const [saving, setSaving] = useState(false);

  const EMPTY_RISK = { title: "", description: "", category: "operational", likelihood: 3, impact: 3, owner: "" };
  const [form, setForm] = useState(EMPTY_RISK);

  useEffect(() => {
    api.get("/domains").then((r) => setDomains(r.data.items.filter((d) => d.status === "active"))).catch(() => {});
  }, []);

  const openCreate = () => {
    setForm(EMPTY_RISK);
    setEditingItem(null);
    setAdding(true);
  };

  const openEdit = (item) => {
    setForm({
      title: item.title,
      description: item.description || "",
      category: item.category || "operational",
      likelihood: item.likelihood,
      impact: item.impact,
      owner: item.owner || "",
    });
    setEditingItem(item);
    setAdding(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) await api.put(`/assessments/${a._id}/risks/${editingItem._id}`, form);
      else await api.post(`/assessments/${a._id}/risks`, form);
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
      const data = await api.post(`/assessments/${a._id}/risks/${pushing._id}/push`, { domain: pushDomain }).then((r) => r.data);
      alert(`Risk pushed to the register (${data.risk.riskId || "R-"}).`);
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
          <h2 className="heading text-sm font-semibold text-neutral-100">Identified risks</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Risks found during the assessment — push them to the Risk register with scoring.</p>
        </div>
        <button className="btn-primary px-3 py-1.5" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" /> Add risk
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line bg-white/[0.02]">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Risk</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">L × I</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Rating</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Owner</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Status</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Register</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500"></th>
            </tr>
          </thead>
          <tbody>
            {(a.identifiedRisks || []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-sm text-neutral-600">No risks identified yet.</td>
              </tr>
            )}
            {(a.identifiedRisks || []).map((r) => (
              <tr key={r._id} className="border-b border-line/60 last:border-0">
                <td className="px-5 py-3">
                  <div>
                    <p className="font-medium text-neutral-100">{r.title}</p>
                    <p className="text-[11px] text-neutral-500">{r.category}</p>
                  </div>
                </td>
                <td className="px-5 py-3 font-mono text-neutral-300">{r.likelihood} × {r.impact}</td>
                <td className="px-5 py-3">
                  <span className={chipClass(r.calculatedRating >= 12 ? "critical" : r.calculatedRating >= 6 ? "high" : "medium", { critical: "border-red-800/60 bg-red-950/40 text-red-300", high: "border-orange-800/60 bg-orange-950/40 text-orange-300", medium: "border-amber-800/60 bg-amber-950/40 text-amber-300" })}>
                    {r.calculatedRating}
                  </span>
                </td>
                <td className="px-5 py-3 text-neutral-300">{r.owner || "—"}</td>
                <td className="px-5 py-3"><span className={chipClass(r.status)}>{r.status}</span></td>
                <td className="px-5 py-3">
                  {r.pushedToRegister ? (
                    <span className={chipClass("approved")}>Pushed</span>
                  ) : (
                    <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => { setPushing(r); setPushDomain(""); }}>
                      Push to register
                    </button>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-0.5">
                    <button onClick={() => openEdit(r)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-white/5 hover:text-gold" title="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={adding}
        onClose={() => !saving && setAdding(false)}
        title={editingItem ? "Edit identified risk" : "Add identified risk"}
        subtitle="Scores 1–5 on likelihood and impact; the rating is likelihood × impact."
        width="max-w-lg"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setAdding(false)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="risk-form" type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <form id="risk-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2">
            <TextInput value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} required />
          </Field>
          <Field label="Category">
            <Select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} options={RISK_CATEGORIES} />
          </Field>
          <Field label="Owner">
            <TextInput value={form.owner} onChange={(e) => setForm((s) => ({ ...s, owner: e.target.value }))} />
          </Field>
          <Field label="Likelihood (1–5)">
            <TextInput type="number" min={1} max={5} value={form.likelihood} onChange={(e) => setForm((s) => ({ ...s, likelihood: Number(e.target.value) }))} />
          </Field>
          <Field label="Impact (1–5)">
            <TextInput type="number" min={1} max={5} value={form.impact} onChange={(e) => setForm((s) => ({ ...s, impact: Number(e.target.value) }))} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <TextArea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
          </Field>
        </form>
      </Modal>

      <Modal
        open={Boolean(pushing)}
        onClose={() => !saving && setPushing(null)}
        title="Push risk to register"
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
        <Field label="Register domain" hint="The risk is scored with this domain's active parameter">
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
// Approvals
// ---------------------------------------------------------------------------

function ApprovalsTab({ a, reload }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ role: "Reviewer", decision: "approved", comment: "" });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/assessments/${a._id}/approvals`, form);
      setAdding(false);
      setForm({ role: "Reviewer", decision: "approved", comment: "" });
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
          <h2 className="heading text-sm font-semibold text-neutral-100">Approvals</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Record reviewer sign-off before publishing.</p>
        </div>
        <button className="btn-primary px-3 py-1.5" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5" /> Add approval
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line bg-white/[0.02]">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Role</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Approver</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Decision</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Comment</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">At</th>
            </tr>
          </thead>
          <tbody>
            {(a.approvals || []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-sm text-neutral-600">No approvals recorded.</td>
              </tr>
            )}
            {(a.approvals || []).map((ap) => (
              <tr key={ap._id} className="border-b border-line/60 last:border-0">
                <td className="px-5 py-3 text-neutral-200">{ap.role}</td>
                <td className="px-5 py-3 text-neutral-300">{ap.approver}</td>
                <td className="px-5 py-3">
                  <span className={chipClass(ap.decision, { approved: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300", declined: "border-red-800/60 bg-red-950/40 text-red-300" })}>{ap.decision}</span>
                </td>
                <td className="px-5 py-3 text-neutral-400">{ap.comment || "—"}</td>
                <td className="px-5 py-3 text-neutral-400">{fmtDateTime(ap.at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={adding}
        onClose={() => !saving && setAdding(false)}
        title="Add approval"
        subtitle="The current user is recorded as the approver."
        width="max-w-md"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setAdding(false)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="approval-form" type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <form id="approval-form" onSubmit={save} className="grid grid-cols-1 gap-4">
          <Field label="Role">
            <TextInput value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))} required placeholder="e.g. CRO" />
          </Field>
          <Field label="Decision">
            <Select value={form.decision} onChange={(e) => setForm((s) => ({ ...s, decision: e.target.value }))} options={["approved", "declined"]} />
          </Field>
          <Field label="Comment">
            <TextArea value={form.comment} onChange={(e) => setForm((s) => ({ ...s, comment: e.target.value }))} />
          </Field>
        </form>
      </Modal>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

function TrailTab({ a }) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line bg-white/[0.02] px-5 py-4">
        <h2 className="heading text-sm font-semibold text-neutral-100">Audit trail</h2>
        <p className="mt-0.5 text-xs text-neutral-500">Every lifecycle change, distribution and approval is recorded.</p>
      </div>
      <div className="space-y-0 px-5 py-4">
        {(a.auditTrail || []).length === 0 && <p className="text-sm text-neutral-600">No trail entries yet.</p>}
        {(a.auditTrail || [])
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
