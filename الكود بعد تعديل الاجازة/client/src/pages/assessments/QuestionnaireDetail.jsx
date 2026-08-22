import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, ArrowDown, ArrowUp, CheckSquare, CopyPlus, ExternalLink, Layers, Library, Link2,
  Loader2, Plus, Save, Send, Trash2,
} from "lucide-react";
import api from "../../api/client";
import { ErrorState, LoadingState } from "../../components/States";
import Modal from "../../components/Modal";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import { chipClass, fmtDate } from "../../lib/format";

const QUESTION_TYPES = ["yes-no", "scale", "select", "text"];

const TABS = [
  { key: "builder", label: "Builder", icon: CheckSquare },
  { key: "scoring", label: "Scoring", icon: Layers },
  { key: "distribution", label: "Distribution", icon: Send },
  { key: "preview", label: "Preview", icon: Link2 },
];

const statusChip = (s) =>
  chipClass(s, {
    active: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
    draft: "border-neutral-700 bg-neutral-900 text-neutral-400",
    retired: "border-neutral-700 bg-neutral-900 text-neutral-500",
  });

export default function QuestionnaireDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [q, setQ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("builder");

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/questionnaires/${id}`)
      .then((r) => setQ(r.data))
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const [bankOpen, setBankOpen] = useState(false);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (loading || !q) return <LoadingState label="Loading questionnaire…" />;

  const questionCount = (q.sections || []).reduce((a, s) => a + (s.questions || []).length, 0);

  return (
    <div>
      <div className="flex items-start gap-3">
        <button onClick={() => navigate("/assessments/questionnaires")} className="mt-1 rounded-lg border border-line p-2 text-neutral-400 transition hover:text-gold" title="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="heading text-2xl font-semibold text-neutral-100">{q.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
            <span className={statusChip(q.status)}>{q.status}</span>
            {q.category && <span>{q.category}</span>}
            <span>{(q.sections || []).length} section(s)</span>
            <span>{questionCount} question(s)</span>
            <span>{q.responseCount || 0} response(s)</span>
            <span>Last used {fmtDate(q.lastUsedAt)}</span>
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-line pb-px">
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

      <div className="mt-5 space-y-5">
        {tab === "builder" && <BuilderTab q={q} reload={load} openBank={() => setBankOpen(true)} />}
        {tab === "scoring" && <ScoringTab q={q} reload={load} />}
        {tab === "distribution" && <DistributionTab q={q} reload={load} />}
        {tab === "preview" && <PreviewTab q={q} />}
      </div>

      <QuestionBankModal open={bankOpen} onClose={() => setBankOpen(false)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

const NEW_QUESTION = { text: "", type: "yes-no", options: [], weight: 1, required: false, helpText: "", conditional: null };

function BuilderTab({ q, reload, openBank }) {
  const [sections, setSections] = useState(() => JSON.parse(JSON.stringify(q.sections || [])));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const setQn = (si, qi, patch) => {
    setDirty(true);
    setSections((s) => s.map((sec, i) => (i !== si ? sec : { ...sec, questions: sec.questions.map((qq, j) => (j !== qi ? qq : { ...qq, ...patch })) })));
  };

  const addQuestion = (si) => {
    setDirty(true);
    setSections((s) => s.map((sec, i) => (i !== si ? sec : { ...sec, questions: [...(sec.questions || []), { ...NEW_QUESTION }] })));
  };

  const removeQuestion = (si, qi) => {
    setDirty(true);
    setSections((s) => s.map((sec, i) => (i !== si ? sec : { ...sec, questions: sec.questions.filter((_, j) => j !== qi) })));
  };

  const moveQuestion = (si, qi, dir) => {
    setDirty(true);
    setSections((s) =>
      s.map((sec, i) => {
        if (i !== si) return sec;
        const arr = [...sec.questions];
        const j = qi + dir;
        if (j < 0 || j >= arr.length) return sec;
        [arr[qi], arr[j]] = [arr[j], arr[qi]];
        return { ...sec, questions: arr };
      })
    );
  };

  const addSection = () => {
    setDirty(true);
    setSections((s) => [...s, { title: "", description: "", questions: [] }]);
  };

  const removeSection = (si) => {
    setDirty(true);
    setSections((s) => s.filter((_, i) => i !== si));
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/questionnaires/${q._id}`, { sections });
      setDirty(false);
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const allRefs = sections.flatMap((s, si) => (s.questions || []).map((qq, qi) => ({ ref: `s${si}q${qi}`, text: qq.text || `s${si}q${qi}` })));

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white/[0.02] px-5 py-4">
        <div>
          <h2 className="heading text-sm font-semibold text-neutral-100">Questionnaire builder</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Sections with weighted questions. Save to persist — activation happens from the list.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost px-3 py-1.5" onClick={openBank}>
            <Library className="h-3.5 w-3.5" /> Question bank
          </button>
          <button className="btn-primary px-3 py-1.5" onClick={save} disabled={!dirty || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {sections.length === 0 && (
          <div className="rounded-lg border border-dashed border-line px-5 py-10 text-center text-sm text-neutral-600">
            No sections yet — add the first section to start building.
          </div>
        )}
        {sections.map((sec, si) => (
          <div key={si} className="rounded-xl border border-line bg-white/[0.02]">
            <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
              <input
                className="input flex-1 min-w-[200px]"
                placeholder="Section title"
                value={sec.title}
                onChange={(e) => { setDirty(true); setSections((s) => s.map((x, i) => (i !== si ? x : { ...x, title: e.target.value }))); }}
              />
              <button onClick={() => removeSection(si)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-red-950/40 hover:text-red-300" title="Remove section">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 py-2">
              <input
                className="input w-full"
                placeholder="Section description (optional)"
                value={sec.description || ""}
                onChange={(e) => { setDirty(true); setSections((s) => s.map((x, i) => (i !== si ? x : { ...x, description: e.target.value }))); }}
              />
            </div>
            <div className="divide-y divide-line/60">
              {(sec.questions || []).map((qq, qi) => (
                <div key={qi} className="space-y-2 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] text-neutral-600">s{si}q{qi}</span>
                    <input
                      className="input flex-1 min-w-[220px]"
                      placeholder="Question text"
                      value={qq.text}
                      onChange={(e) => setQn(si, qi, { text: e.target.value })}
                    />
                    <select className="input w-32" value={qq.type} onChange={(e) => setQn(si, qi, { type: e.target.value, options: e.target.value === "select" ? qq.options : [] })}>
                      {QUESTION_TYPES.map((t) => (
                        <option key={t} value={t} className="bg-ink-deep">{t}</option>
                      ))}
                    </select>
                    <input
                      className="input w-20 text-right font-mono"
                      type="number"
                      min={0}
                      max={100}
                      title="Question weight"
                      value={qq.weight}
                      onChange={(e) => setQn(si, qi, { weight: Number(e.target.value) || 0 })}
                    />
                    <label className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <input type="checkbox" className="h-3.5 w-3.5 accent-[#D4AF37]" checked={Boolean(qq.required)} onChange={(e) => setQn(si, qi, { required: e.target.checked })} />
                      Required
                    </label>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => moveQuestion(si, qi, -1)} disabled={qi === 0} className="rounded-md p-1.5 text-neutral-500 transition hover:text-gold disabled:opacity-30" title="Move up">
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => moveQuestion(si, qi, 1)} disabled={qi === (sec.questions || []).length - 1} className="rounded-md p-1.5 text-neutral-500 transition hover:text-gold disabled:opacity-30" title="Move down">
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => removeQuestion(si, qi)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-red-950/40 hover:text-red-300" title="Remove">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {qq.type === "select" && (
                    <input
                      className="input ml-7 w-full max-w-md"
                      placeholder="Options, comma separated (best first)"
                      value={(qq.options || []).join(", ")}
                      onChange={(e) => setQn(si, qi, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })}
                    />
                  )}
                  <div className="ml-7 flex flex-wrap items-center gap-3">
                    <select
                      className="input w-44 text-xs"
                      title="Show only when…"
                      value={qq.conditional?.ref || ""}
                      onChange={(e) => setQn(si, qi, { conditional: e.target.value ? { ref: e.target.value, answer: qq.conditional?.answer ?? "" } : null })}
                    >
                      <option value="" className="bg-ink-deep">Always shown</option>
                      {allRefs.filter((r) => r.ref !== `s${si}q${qi}`).map((r) => (
                        <option key={r.ref} value={r.ref} className="bg-ink-deep">{r.ref} — {r.text.slice(0, 40)}</option>
                      ))}
                    </select>
                    {qq.conditional?.ref && (
                      <input
                        className="input w-40 text-xs"
                        placeholder='Equals, e.g. "Yes"'
                        value={qq.conditional.answer ?? ""}
                        onChange={(e) => setQn(si, qi, { conditional: { ...qq.conditional, answer: e.target.value } })}
                      />
                    )}
                    <input
                      className="input ml-auto w-full max-w-md text-xs"
                      placeholder="Help text (optional)"
                      value={qq.helpText || ""}
                      onChange={(e) => setQn(si, qi, { helpText: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3">
              <button className="btn-ghost px-3 py-1.5" onClick={() => addQuestion(si)}>
                <Plus className="h-3.5 w-3.5" /> Add question
              </button>
            </div>
          </div>
        ))}
        <button className="btn-ghost w-full py-3" onClick={addSection}>
          <Plus className="h-4 w-4" /> Add section
        </button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function ScoringTab({ q, reload }) {
  const [mode, setMode] = useState(q.scoringRules?.mode || "weighted");
  const [passThreshold, setPassThreshold] = useState(q.scoringRules?.passThreshold ?? 70);
  const [weights, setWeights] = useState(() =>
    (q.sections || []).map((s, si) => ({
      sectionIndex: si,
      weight: q.scoringRules?.sectionWeights?.find((w) => Number(w.sectionIndex) === si)?.weight ?? 1,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const total = weights.reduce((a, w) => a + Number(w.weight || 0), 0);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/questionnaires/${q._id}`, {
        scoringRules: { mode, passThreshold: Number(passThreshold), sectionWeights: weights },
      });
      setSaved(true);
      reload();
      setTimeout(() => setSaved(false), 2000);
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
          <h2 className="heading text-sm font-semibold text-neutral-100">Scoring rules</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Question scores (yes/no 100/0, scale value/5, select best→worst) roll into sections, then sections roll into the overall score.</p>
        </div>
        <button className="btn-primary px-3 py-1.5" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : saved ? "Saved" : "Save"}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
        <div className="space-y-4">
          <Field label="Scoring mode">
            <Select value={mode} onChange={(e) => setMode(e.target.value)} options={["weighted", "pass-fail"]} />
          </Field>
          <Field label="Pass threshold" hint="Overall % required to pass (pass-fail mode)">
            <TextInput type="number" min={0} max={100} value={passThreshold} onChange={(e) => setPassThreshold(e.target.value)} />
          </Field>
          <div className="rounded-lg border border-line bg-white/[0.02] p-4 text-xs text-neutral-500">
            <p><span className="text-gold">Weighted:</span> overall is the weighted average of section scores using the section weights below.</p>
            <p className="mt-1"><span className="text-gold">Pass-fail:</span> the response passes when the overall score reaches the pass threshold.</p>
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="label">Section weights (relative)</p>
            <span className={`text-xs ${Math.abs(total - 1) < 0.005 ? "text-emerald-400" : "text-red-400"}`}>
              Total: {total.toFixed(3)}
            </span>
          </div>
          <div className="space-y-2 rounded-lg border border-line bg-white/[0.02] p-4">
            {(q.sections || []).map((s, si) => (
              <div key={si} className="flex items-center gap-3">
                <span className="flex-1 truncate text-sm text-neutral-300">{s.title || `Section ${si + 1}`}</span>
                <input
                  className="input w-24 text-right font-mono"
                  type="number"
                  min={0}
                  step={0.05}
                  value={weights[si]?.weight ?? 1}
                  onChange={(e) =>
                    setWeights((w) => w.map((x, i) => (i !== si ? x : { ...x, weight: Number(e.target.value) || 0 })))
                  }
                />
              </div>
            ))}
            {(q.sections || []).length === 0 && <p className="text-xs text-neutral-600">Add sections in the Builder to configure weights.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Distribution
// ---------------------------------------------------------------------------

function DistributionTab({ q, reload }) {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [respondent, setRespondent] = useState("");
  const [saving, setSaving] = useState(false);
  const [fresh, setFresh] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/responses", { params: { questionnaire: q._id } })
      .then((r) => setResponses(r.data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q._id]);

  useEffect(() => {
    load();
  }, [load]);

  const respondUrl = (token) => `${window.location.origin}/assessments/respond/${token}`;

  const distribute = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const doc = await api.post("/responses", { questionnaire: q._id, respondent, sourceType: "adhoc" }).then((r) => r.data);
      setFresh(doc);
      setRespondent("");
      setAdding(false);
      reload();
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyLink = (token) => {
    navigator.clipboard?.writeText(respondUrl(token));
    setCopied(token);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white/[0.02] px-5 py-4">
        <div>
          <h2 className="heading text-sm font-semibold text-neutral-100">Distribution</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Send a response link to a respondent — they answer without touching the assessment record.</p>
        </div>
        <button className="btn-primary px-3 py-1.5" onClick={() => setAdding(true)}>
          <Send className="h-3.5 w-3.5" /> Distribute
        </button>
      </div>

      {fresh && (
        <div className="border-b border-line bg-emerald-950/30 px-5 py-4">
          <p className="text-sm text-emerald-300">Response created — share this link with the respondent:</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="flex-1 min-w-[240px] rounded-lg border border-line bg-ink-deep px-3 py-2 text-xs text-gold-light">{respondUrl(fresh.linkToken)}</code>
            <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => copyLink(fresh.linkToken)}>
              <CopyPlus className="h-3.5 w-3.5" /> {copied === fresh.linkToken ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line bg-white/[0.02]">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Respondent</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Status</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Score</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Submitted</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Link</th>
            </tr>
          </thead>
          <tbody>
            {responses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-sm text-neutral-600">
                  {loading ? "Loading responses…" : "No responses yet — distribute a link to the first respondent."}
                </td>
              </tr>
            )}
            {responses.map((r) => (
              <tr key={r._id} className="border-b border-line/60 last:border-0">
                <td className="px-5 py-3 text-neutral-200">{r.respondent || "—"}</td>
                <td className="px-5 py-3">
                  <span className={chipClass(r.status)}>{r.status}</span>
                </td>
                <td className="px-5 py-3 font-mono text-neutral-200">{r.overallScore != null ? `${r.overallScore}%` : "—"}</td>
                <td className="px-5 py-3 text-neutral-400">{fmtDate(r.submittedAt)}</td>
                <td className="px-5 py-3 text-right">
                  <button className="rounded-md p-1.5 text-neutral-500 transition hover:text-gold" title="Open response link" onClick={() => window.open(respondUrl(r.linkToken), "_blank")}>
                    <ExternalLink className="h-4 w-4" />
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
        title="Distribute questionnaire"
        subtitle="An invite link is generated for the respondent."
        width="max-w-md"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setAdding(false)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="dist-form" type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Creating…" : "Create link"}
            </button>
          </>
        }
      >
        <form id="dist-form" onSubmit={distribute} className="grid grid-cols-1 gap-4">
          <Field label="Respondent" hint="Name or email of the person answering">
            <TextInput value={respondent} onChange={(e) => setRespondent(e.target.value)} required placeholder="e.g. vendor.risk@example.com" />
          </Field>
        </form>
      </Modal>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

function PreviewTab({ q }) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line bg-white/[0.02] px-5 py-4">
        <h2 className="heading text-sm font-semibold text-neutral-100">Preview</h2>
        <p className="mt-0.5 text-xs text-neutral-500">Read-only rendering of the questionnaire as the respondent sees it.</p>
      </div>
      <div className="space-y-5 p-5">
        {(q.sections || []).length === 0 && <p className="text-sm text-neutral-600">Nothing to preview yet.</p>}
        {(q.sections || []).map((s, si) => (
          <div key={si}>
            <h3 className="heading text-sm font-semibold text-gold">Section {si + 1} — {s.title}</h3>
            {s.description && <p className="mt-1 text-xs text-neutral-500">{s.description}</p>}
            <div className="mt-3 space-y-2">
              {(s.questions || []).map((qq, qi) => (
                <div key={qi} className="rounded-lg border border-line bg-white/[0.02] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-neutral-200">
                      {qq.text}
                      {qq.required && <span className="ml-1 text-red-400">*</span>}
                    </p>
                    <span className="chip border-neutral-700 bg-neutral-900 text-neutral-400">{qq.type}</span>
                  </div>
                  {qq.type === "select" && (
                    <p className="mt-1 text-xs text-neutral-500">Options: {(qq.options || []).join(" → ")}</p>
                  )}
                  {qq.conditional?.ref && (
                    <p className="mt-1 text-xs text-amber-400/80">Only shown when {qq.conditional.ref} equals "{qq.conditional.answer}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Question bank modal
// ---------------------------------------------------------------------------

function QuestionBankModal({ open, onClose }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get("/question-bank", { params: { q: query } })
      .then((r) => setItems(r.data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, query]);

  if (!open) return null;

  return (
    <Modal open onClose={onClose} title="Question bank" subtitle="Reusable questions you can copy into a questionnaire." width="max-w-2xl">
      <input className="input mb-4 w-full" placeholder="Search the bank…" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="max-h-[50vh] space-y-2 overflow-y-auto">
        {loading ? (
          <p className="py-6 text-center text-sm text-neutral-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-600">No bank items found.</p>
        ) : (
          items.map((it) => (
            <div key={it._id} className="rounded-lg border border-line bg-white/[0.02] px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-neutral-200">{it.text}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {it.type}
                    {it.type === "select" && it.options?.length ? ` · ${it.options.join(" → ")}` : ""}
                    {it.category ? ` · ${it.category}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] text-neutral-600">{(it.tags || []).join(", ")}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
