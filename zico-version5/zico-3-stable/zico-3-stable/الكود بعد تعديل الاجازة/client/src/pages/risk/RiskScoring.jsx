import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import api, { resource } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { Field, Select } from "../../components/Field";
import { ErrorState, LoadingState } from "../../components/States";
import { STANDARD_CRITERIA, SCALE, SCALE_LABELS, TREATMENTS } from "./constants";
import { impactFor } from "./RiskForm";
import { SEVERITY_STYLES, titleCase } from "../../lib/format";
import { effectivenessChipClass } from "../../lib/riskLinks";
import { riskScoreFor, residualAxesFor, requiresJustification, JUSTIFICATION_MIN_LENGTH } from "../../lib/riskEngine";
import RiskLifecycleStepper from "../../components/RiskLifecycleStepper";

const risks = resource("risks");

export default function RiskScoring() {
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [params, setParams] = useState([]);
  const [overdueOnly, setOverdueOnly] = useState(searchParams.get("reassessment") === "overdue");
  const [users, setUsers] = useState([]);
  const linkedRiskId = searchParams.get("riskId");

  const load = () => {
    setLoading(true);
    risks
      .list({ status: "Open", reassessment: overdueOnly ? "overdue" : undefined })
      .then((d) => setRows(d.items))
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, [overdueOnly]);

  useEffect(() => {
    resource("parameters")
      .list({ active: true })
      .then((d) => setParams(d.items))
      .catch(() => {});
    api
      .get("/users")
      .then((r) => setUsers(r.data?.items || r.data || []))
      .catch(() => {});
  }, []);

  const open = (r) => {
    const impacts = {};
    for (const i of r.impacts || []) impacts[i.name] = i.value;
    setForm({
      likelihood: r.likelihood || 3,
      impacts,
      residualScore: r.residualScore ?? r.inherentScore,
      treatment: r.treatment || "Mitigate",
      residualJustification: r.residualJustification || "",
      acceptedBy: r.acceptedBy || "",
    });
    setEditing(r);
  };

  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: Number(e.target.value) }));

  const save = async (e) => {
    e.preventDefault();
    if (residualDeviation) {
      alert(`Residual (${Number(form.residualScore)}) deviates >20% from the control-driven suggestion (${suggested}). Add a residual justification of at least ${JUSTIFICATION_MIN_LENGTH} characters to confirm the accepted exposure under ISO 27001.`);
      return;
    }
    setSaving(true);
    try {
      const impacts = criteria.map((c) => ({ name: c.name, value: Number(form.impacts?.[c.name]) || 1 }));
      await risks.update(editing._id, {
        likelihood: Number(form.likelihood),
        impacts,
        residualScore: Number(form.residualScore),
        residualJustification: (form.residualJustification || "").trim() || null,
        treatment: form.treatment,
        acceptedBy: form.acceptedBy || null,
      });
      setEditing(null);
      load();
    } catch (err) {
      const data = err?.response?.data;
      if (err?.response?.status === 422 && data?.suggestedAction === "pending_acceptance") {
        if (
          window.confirm(
            `${data.message}\n\nSave as pending acceptance instead? The risk will be routed to ${data.requiredApproverName || "the required approver"} for formal sign-off.`
          )
        ) {
          try {
            await risks.update(editing._id, {
              likelihood: Number(form.likelihood),
              impacts,
              residualScore: Number(form.residualScore),
              residualJustification: (form.residualJustification || "").trim() || null,
              treatment: "pending_acceptance",
              acceptedBy: form.acceptedBy || null,
            });
            setEditing(null);
            load();
          } catch (err2) {
            alert(err2?.response?.data?.message || err2.message);
          }
        } else {
          alert(data.message);
        }
      } else {
        alert(data?.message || err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const linkedRisk = rows.find((r) => r._id === linkedRiskId || r.riskId === linkedRiskId);
  const visibleRows = linkedRiskId ? rows.filter((r) => r._id === linkedRiskId || r.riskId === linkedRiskId) : rows;

  const method = editing?.domain?.scoringMethod || "advanced";
  const activeParam = params.find(
    (p) => p.active && String(p.domain?._id || p.domain) === String(editing?.domain?._id)
  );
  const appetiteLimit = activeParam?.appetiteLimit ?? editing?.appetiteLimit;
  const residual = Number(form?.residualScore) || 0;
  const overAppetite = appetiteLimit != null && residual > appetiteLimit;
  const criteria = activeParam?.criteria || STANDARD_CRITERIA;
  const inherent = riskScoreFor({
    likelihood: form?.likelihood,
    impact: impactFor(form || {}, method, criteria),
    param: activeParam,
  });
  const axes = residualAxesFor({
    likelihood: form?.likelihood,
    impact: impactFor(form || {}, method, criteria),
    links: editing?.linkedControls || [],
    controlOf: (id) => {
      const link = (editing?.linkedControls || []).find((l) => l.control?._id === id || l.control_id === id);
      return link?.control || null;
    },
    cfg: {
      weights: activeParam?.controlEffectivenessWeights,
      capReduction: activeParam?.residualCapReduction,
    },
  });
  const suggested = axes.score;
  const residualDeviation =
    residual > 0 &&
    suggested > 0 &&
    requiresJustification(residual, suggested) &&
    (form?.residualJustification || "").trim().length < JUSTIFICATION_MIN_LENGTH;

  const columns = [
    {
      key: "riskId",
      header: "ID",
      render: (r) => <span className="whitespace-nowrap font-mono text-xs text-gold">{r.riskId || "—"}</span>,
    },
    { key: "title", header: "Risk", render: (r) => <span className="font-medium text-neutral-100">{r.title}</span> },
    {
      key: "domain",
      header: "Domain",
      render: (r) => (
        <span className="whitespace-nowrap text-xs text-neutral-400">
          {r.domain?.name || "—"}
          {r.domain?.scoringMethod === "advanced" ? " · Advanced" : ""}
        </span>
      ),
    },
    { key: "category", header: "Category", render: (r) => <span className="whitespace-nowrap">{r.category}</span> },
    { key: "likelihood", header: "L" },
    { key: "impact", header: "Impact", render: (r) => <span className="whitespace-nowrap">{r.impactScore ?? r.impact}</span> },
    {
      key: "inherentScore",
      header: "Inherent",
      render: (r) => (
        <span className={`chip ${SEVERITY_STYLES[String(r.inherentLevel || "low").toLowerCase()]}`}>
          {r.inherentScore ?? r.riskScore} · {r.inherentLevel || "—"}
        </span>
      ),
    },
    {
      key: "residualScore",
      header: "Residual",
      render: (r) => (
        <span className={`chip ${SEVERITY_STYLES[String(r.overallRisk || "low").toLowerCase()]}`}>
          {r.residualScore} · {r.overallRisk || "—"}
        </span>
      ),
    },
    { key: "treatment", header: "Treatment", render: (r) => {
      const pending = r.treatment === "pending_acceptance";
      return (
        <span className={`whitespace-nowrap ${pending ? "chip border-violet-800/60 bg-violet-950/40 text-violet-300" : ""}`}>
          {pending ? "Pending acceptance" : titleCase(r.treatment)}
        </span>
      );
    } },
    {
      key: "reassessment",
      header: "Next Reassessment",
      render: (r) =>
        r.overdueReassessment ? (
          <span className="chip whitespace-nowrap border-red-800/60 bg-red-950/40 text-red-300">Overdue</span>
        ) : r.nextReassessmentDue ? (
          <span className="whitespace-nowrap text-xs text-neutral-400">{String(r.nextReassessmentDue).slice(0, 10)}</span>
        ) : (
          <span className="whitespace-nowrap text-xs text-neutral-600">—</span>
        ),
    },
    {
      key: "__a",
      header: "",
      sortable: false,
      className: "text-right",
      render: (r) => (
        <button className="btn-ghost px-3 py-1.5" onClick={() => open(r)}>
          Re-score
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Risk Scoring"
        subtitle="Re-assess open risks against their domain's parameter: likelihood, impact criteria, residual exposure and treatment."
        actions={<RiskLifecycleStepper current="scoring" riskId={linkedRiskId || undefined} />}
      />

      {linkedRisk && (
        <div className="mb-4 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">
          ISO 27005 lifecycle context: <span className="font-semibold text-neutral-100">{linkedRisk.riskId || linkedRisk._id.slice(-6)}</span> — {linkedRisk.title}
          <span className="mx-2 text-neutral-500">•</span>
          Continue from identification to treatment, review, and closure.
        </div>
      )}

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <LoadingState />
      ) : (
        <DataTable
          columns={columns}
          rows={visibleRows}
          searchPlaceholder="Search risks…"
          toolbar={
            <Select
              value={overdueOnly ? "overdue" : ""}
              onChange={(e) => setOverdueOnly(e.target.value === "overdue")}
              options={[
                { value: "", label: "All reassessments" },
                { value: "overdue", label: "Overdue reassessment" },
              ]}
            />
          }
        />
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Re-score risk"
        subtitle={editing?.title}
        width="max-w-3xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} type="button">Cancel</button>
            <button className="btn-primary" form="score-form" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save score"}
            </button>
          </>
        }
      >
        {form && (
          <form id="score-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {overAppetite && (
              <p className="rounded-lg border border-amber-800/60 bg-amber-950/30 px-3 py-2 text-sm text-amber-300 sm:col-span-2">
                Residual {residual} exceeds the domain appetite limit (≤ {appetiteLimit}) — treat, transfer or accept
                with management approval.
              </p>
            )}
            <Field label="Likelihood" hint={SCALE_LABELS[form.likelihood]}>
              <Select value={form.likelihood} options={SCALE} onChange={set("likelihood")} />
            </Field>
            {criteria.map((c) => (
              <Field key={c.name} label={`Impact · ${c.name}`} hint={`weight ${Number(c.weight).toFixed(2)}`}>
                <Select
                  value={form.impacts?.[c.name] || 1}
                  options={SCALE}
                  onChange={(e) => setForm((s) => ({ ...s, impacts: { ...(s.impacts || {}), [c.name]: Number(e.target.value) } }))}
                />
              </Field>
            ))}
            <Field
              label="Residual score (after controls)"
              hint={
                `Inherent (${activeParam?.riskScoreMethod === "weighted_additive" ? "weighted additive" : activeParam?.riskScoreMethod === "matrix_lookup" ? "matrix lookup" : "L × I"}) is ${inherent}` +
                ` · suggestion ${suggested}` +
                (appetiteLimit != null ? ` · appetite ≤ ${appetiteLimit}` : "")
              }
            >
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={25}
                  className="input"
                  value={form.residualScore}
                  onChange={set("residualScore")}
                />
                <button
                  type="button"
                  className="chip border-line bg-white/[0.03] px-2 py-1.5 text-xs text-neutral-400 hover:border-gold/40 hover:text-gold"
                  onClick={() => setForm((s) => ({ ...s, residualScore: suggested, residualJustification: "" }))}
                  title="Adopt the control-driven suggestion"
                >
                  Use {suggested}
                </button>
              </div>
            </Field>
            {residualDeviation && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3.5 sm:col-span-2">
                <p className="text-xs leading-relaxed text-amber-200">
                  Your residual ({residual}) deviates more than 20% from the control-driven suggestion ({suggested}).
                  This deviation must be justified to confirm the residual is an accepted decision under the ISO 27001
                  risk treatment framework — it records who accepted the exposure and why.
                </p>
                <textarea
                  className="input mt-3 min-h-[72px] w-full"
                  placeholder={`Required — at least ${JUSTIFICATION_MIN_LENGTH} characters. e.g. Residual accepted by the risk owner until compensating controls are fully deployed.`}
                  value={form.residualJustification}
                  onChange={(e) => setForm((s) => ({ ...s, residualJustification: e.target.value }))}
                />
                <p className="mt-1 text-right text-[11px] text-amber-200/70">
                  {(form.residualJustification || "").trim().length} / {JUSTIFICATION_MIN_LENGTH} characters
                </p>
              </div>
            )}
            <Field label="Treatment">
              <Select
                value={form.treatment}
                options={TREATMENTS.map((t) => ({ value: t, label: titleCase(t) }))}
                onChange={(e) => setForm((s) => ({ ...s, treatment: e.target.value }))}
              />
            </Field>
            {(form.treatment === "Accept" || form.treatment === "pending_acceptance") && (
              <Field
                label="Accepted by"
                hint={form.treatment === "Accept" ? "Required — formal sign-off of the accepted residual" : "Requested approver"}
              >
                <Select
                  value={form.acceptedBy || ""}
                  onChange={(e) => setForm((s) => ({ ...s, acceptedBy: e.target.value }))}
                  options={[
                    { value: "", label: "Select user…" },
                    ...users.map((u) => ({ value: u._id, label: `${u.fullName || u.username} (${titleCase(u.role)})` })),
                  ]}
                />
              </Field>
            )}
            {(editing?.linkedControls || []).length > 0 && (
              <div className="rounded-lg border border-line bg-ink-deep/40 p-3.5 sm:col-span-2">
                <p className="label mb-2">Linked controls ({editing.linkedControls.length})</p>
                <ul className="space-y-2">
                  {editing.linkedControls.map((l) => {
                    const hasTested = l.testedEffectiveness != null && String(l.testedEffectiveness).trim() !== "";
                    return (
                      <li key={l._id} className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-semibold text-gold">
                          {l.control?.annexCode || l.control?.controlId}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-neutral-300">{l.control?.name}</span>
                        <span className={effectivenessChipClass(l.effectiveness)}>{l.effectiveness}</span>
                        {hasTested && (
                          <span className="chip border-sky-800/60 bg-sky-950/40 text-sky-300">
                            Tested {l.testedEffectiveness}%
                          </span>
                        )}
                        {hasTested && l.testedEffectivenessSource && (
                          <span className="text-[11px] text-neutral-500">Source: {l.testedEffectivenessSource}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-[11px] leading-relaxed text-neutral-600">
                  Effectiveness of linked controls should inform the residual exposure you record above.
                  {editing.linkedControls.some(l => l.testedEffectiveness != null && String(l.testedEffectiveness).trim() !== "") && (
                    <span className="text-sky-400"> Tested effectiveness values are used in the residual calculation when present.</span>
                  )}
                </p>
              </div>
            )}
          </form>
        )}
      </Modal>
    </>
  );
}
