import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { CheckCircle2, Loader2, Save, Send } from "lucide-react";
import api from "../../api/client";
import { ErrorState, LoadingState } from "../../components/States";
import { chipClass } from "../../lib/format";

export default function Respond() {
  const { token } = useParams();
  const [response, setResponse] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/responses/public/${token}`)
      .then((r) => {
        setResponse(r.data);
        const map = {};
        for (const a of r.data.answers || []) map[a.ref] = a.value;
        setAnswers(map);
      })
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const q = response?.questionnaire;
  const submitted = response?.status === "submitted";

  const visibleQuestions = useMemo(() => {
    if (!q) return [];
    return (q.sections || []).map((s) => ({
      section: s,
      questions: (s.questions || []).filter((qq) => {
        const c = qq.conditional;
        if (!c?.ref) return true;
        return answers[c.ref] !== undefined && String(answers[c.ref]) === String(c.answer);
      }),
    }));
  }, [q, answers]);

  const allRefs = useMemo(() => {
    const refs = [];
    for (const s of q?.sections || []) for (const qq of s.questions || []) if (qq.type !== "text") refs.push(qq);
    return refs;
  }, [q]);

  const answeredCount = useMemo(() => allRefs.filter((qq) => answers[qq.ref] !== undefined && answers[qq.ref] !== "").length, [allRefs, answers]);

  const setAnswer = (ref, value) => setAnswers((a) => ({ ...a, [ref]: value }));

  const save = async (submit = false) => {
    setSaving(true);
    try {
      const payload = { answers: allRefs.filter((qq) => answers[qq.ref] !== undefined).map((qq) => ({ ref: qq.ref, value: answers[qq.ref] })) };
      await api.put(`/responses/${response._id}`, payload);
      if (submit) {
        await api.post(`/responses/${response._id}/submit`, {});
        load();
      } else {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2000);
      }
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState message={error} />;
  if (loading || !q) return <LoadingState label="Loading questionnaire…" />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-gold">{q.category || "Questionnaire"}</p>
        <h1 className="heading mt-1 text-2xl font-semibold text-neutral-100">{q.name}</h1>
        {q.description && <p className="mt-1 text-sm text-neutral-500">{q.description}</p>}
        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <span>Respondent: {response.respondent || "—"}</span>
          <span className={chipClass(response.status)}>{response.status}</span>
          {!submitted && <span>{answeredCount} / {allRefs.length} answered</span>}
        </p>
      </div>

      {submitted ? (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-line bg-emerald-950/30 px-5 py-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <div>
              <h2 className="heading text-sm font-semibold text-neutral-100">Response submitted</h2>
              <p className="text-xs text-neutral-400">Thank you — your answers are locked in.</p>
            </div>
            <div className="ml-auto text-right">
              <p className="heading text-2xl font-semibold text-gold">{response.overallScore != null ? `${response.overallScore}%` : "—"}</p>
              <p className="text-[11px] text-neutral-500">Overall score</p>
            </div>
          </div>
          {response.sectionScores?.length > 0 && (
            <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2">
              {response.sectionScores.map((s) => (
                <div key={s.sectionIndex} className="flex items-center justify-between rounded-lg border border-line bg-white/[0.02] px-4 py-3">
                  <span className="text-sm text-neutral-300">{s.title || `Section ${s.sectionIndex + 1}`}</span>
                  <span className="font-mono text-gold">{s.score}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-5">
            {visibleQuestions.map(({ section, questions }) => (
              <section key={section.sortOrder} className="card overflow-hidden">
                <div className="border-b border-line bg-white/[0.02] px-5 py-4">
                  <h2 className="heading text-sm font-semibold text-neutral-100">
                    {section.sortOrder + 1}. {section.title}
                  </h2>
                  {section.description && <p className="mt-0.5 text-xs text-neutral-500">{section.description}</p>}
                </div>
                <div className="divide-y divide-line/60">
                  {questions.length === 0 && <p className="px-5 py-4 text-sm text-neutral-600">No questions for this section.</p>}
                  {questions.map((qq) => (
                    <QuestionRow key={qq.ref} qq={qq} value={answers[qq.ref]} onChange={(v) => setAnswer(qq.ref, v)} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="sticky bottom-4 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-ink-deep/95 px-5 py-3 backdrop-blur">
            <p className="text-xs text-neutral-500">
              {answeredCount} of {allRefs.length} questions answered — save as you go.
            </p>
            <div className="flex gap-2">
              <button className="btn-ghost px-3 py-1.5" onClick={() => save(false)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {savedFlash ? "Saved" : "Save progress"}
              </button>
              <button className="btn-primary px-3 py-1.5" onClick={() => save(true)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function QuestionRow({ qq, value, onChange }) {
  const showOptions = ["scale", "yes-no"];

  return (
    <div className="px-5 py-4">
      <p className="text-sm text-neutral-100">
        {qq.text}
        {qq.required && <span className="ml-1 text-red-400">*</span>}
        <span className="ml-2 align-middle text-[10px] uppercase tracking-wider text-neutral-600">{qq.type}</span>
      </p>
      {qq.helpText && <p className="mt-0.5 text-xs text-neutral-500">{qq.helpText}</p>}

      <div className="mt-3">
        {qq.type === "yes-no" && (
          <div className="flex gap-2">
            {["Yes", "No"].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={`rounded-lg border px-4 py-2 text-sm transition ${
                  value === opt
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-line bg-white/[0.02] text-neutral-300 hover:border-neutral-600"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {qq.type === "scale" && (
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition ${
                  value === n
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-line bg-white/[0.02] text-neutral-300 hover:border-neutral-600"
                }`}
              >
                {n}
              </button>
            ))}
            <span className="self-center text-[11px] text-neutral-500">1 = poor · 5 = excellent</span>
          </div>
        )}

        {qq.type === "select" && (
          <select className="input max-w-sm" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
            <option value="" className="bg-ink-deep">— Select —</option>
            {(qq.options || []).map((o) => (
              <option key={o} value={o} className="bg-ink-deep">{o}</option>
            ))}
          </select>
        )}

        {qq.type === "text" && (
          <textarea
            className="input w-full"
            rows={3}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Your answer (informational, not scored)"
          />
        )}
      </div>
    </div>
  );
}
