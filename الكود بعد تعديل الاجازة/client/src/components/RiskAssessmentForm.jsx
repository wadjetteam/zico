import { Field, Select, TextArea, TextInput } from "./Field";
import { SCALE, SCALE_LABELS, STANDARD_CRITERIA, CATEGORIES, STATUSES, TREATMENTS } from "../pages/risk/constants";
import {
  impactValues,
  impactSum,
  blendedImpact,
  defaultImpact,
  impactFor,
  levelOf,
  riskScoreFor,
  residualAxesFor,
  requiresJustification,
  JUSTIFICATION_MIN_LENGTH,
} from "../lib/riskEngine";

export default function RiskAssessmentForm({
  form,
  onChange,
  domainParam = {},
  domainName,
  impactMethod = "weighted",
  linkedControls = [],
  onControlCEChange,
  readOnly = false,
  showControlsSection = true,
}) {
  const set = (k) => (e) => {
    const v = e.target.value;
    onChange(k, k === "likelihood" ? Number(v) : v);
  };

  const setImpact = (name) => (e) =>
    onChange("impacts", { ...(form.impacts || {}), [name]: Number(e.target.value) });

  const criteria = domainParam?.criteria || STANDARD_CRITERIA;
  const thresholds = domainParam?.thresholds || { critical: 20, high: 12, medium: 6 };
  const appetiteLimit = domainParam?.appetiteLimit != null ? Number(domainParam.appetiteLimit) : null;

  const overallScore = impactSum(form, criteria);
  const impact = impactFor(form, impactMethod, criteria);
  const riskScore = riskScoreFor({ likelihood: form.likelihood, impact, param: domainParam });
  const axes = residualAxesFor({
    likelihood: form.likelihood,
    impact,
    links: linkedControls,
    controlOf: (id) => {
      const link = linkedControls.find((l) => l.control?._id === id || l.control_id === id);
      return link?.control || null;
    },
    cfg: {
      weights: domainParam?.controlEffectivenessWeights,
      capReduction: domainParam?.residualCapReduction,
    },
  });
  const suggested = axes.score;
  const hasUserResidual = form.residualScore !== "" && form.residualScore != null;
  const effectiveResidual = hasUserResidual ? Number(form.residualScore) : suggested;
  const residualDeviation = hasUserResidual && requiresJustification(Number(form.residualScore), suggested);
  const inherentLevel = levelOf(riskScore, thresholds);
  const residualLevel = levelOf(effectiveResidual, thresholds);
  const methodLabel =
    domainParam?.riskScoreMethod === "weighted_additive"
      ? "weighted additive (×5, weights sum to 1)"
      : domainParam?.riskScoreMethod === "matrix_lookup"
        ? "matrix lookup (5×5)"
        : "likelihood × impact";
  const methodName = domainParam?.riskScoreMethod || "multiplicative";

  const useSuggestion = () => {
    onChange("residualScore", "");
    onChange("residualJustification", "");
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="label border-b border-line pb-2">Identification</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Risk ID" hint="e.g. R-049">
            <TextInput value={form.riskId || ""} onChange={set("riskId")} placeholder="Auto-assigned if blank" readOnly={readOnly} />
          </Field>
          <Field label="Risk title">
            <TextInput value={form.title || ""} onChange={set("title")} required placeholder="e.g. Unauthorised access to customer data" readOnly={readOnly} />
          </Field>
          <Field label="Process">
            <TextInput value={form.process || ""} onChange={set("process")} placeholder="e.g. Customer Onboarding" readOnly={readOnly} />
          </Field>
          <Field label="Sub-Process">
            <TextInput value={form.subProcess || ""} onChange={set("subProcess")} placeholder="e.g. KYC Verification" readOnly={readOnly} />
          </Field>
          <Field label="Asset / System">
            <TextInput value={form.assetSystem || ""} onChange={set("assetSystem")} placeholder="e.g. Mobile Banking App" readOnly={readOnly} />
          </Field>
          <Field label="Owner Team">
            <TextInput value={form.ownerTeam || ""} onChange={set("ownerTeam")} placeholder="e.g. Digital Banking" readOnly={readOnly} />
          </Field>
          <Field label="Risk category">
            <Select value={form.category || "Cybersecurity"} onChange={set("category")} options={CATEGORIES} disabled={readOnly} />
          </Field>
          <Field label="Risk date">
            <TextInput type="date" value={form.riskDate || ""} onChange={set("riskDate")} readOnly={readOnly} />
          </Field>
          <Field label="Owner" hint="Accountable owner — required">
            <TextInput value={form.owner || ""} onChange={set("owner")} placeholder="e.g. Head of Digital" required readOnly={readOnly} />
          </Field>
        </div>
      </div>

      <div>
        <p className="label border-b border-line pb-2">Threat & vulnerability</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Threat">
              <TextArea value={form.threat || ""} onChange={set("threat")} placeholder="The threat actor or event that could exploit the vulnerability." readOnly={readOnly} />
            </Field>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Vulnerability">
              <TextArea value={form.vulnerability || ""} onChange={set("vulnerability")} placeholder="The weakness that could be exploited." readOnly={readOnly} />
            </Field>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-gold/30 bg-gold/[0.02] p-4">
        <p className="label text-gold">Your assessment for this risk</p>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
          Rate this risk only: how likely it is (1–5) and its impact per criterion (1 = minimal · 5 = severe).
          {domainName ? ` Domain: ${domainName}` : ""}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Likelihood" hint={SCALE_LABELS[form.likelihood]}>
            <Select value={form.likelihood || 3} onChange={set("likelihood")} options={SCALE} disabled={readOnly} />
          </Field>
          {(criteria || []).map((c) => (
            <Field key={c.name} label={`Impact · ${c.name}`}>
              <Select value={form.impacts?.[c.name] || 1} onChange={setImpact(c.name)} options={SCALE} disabled={readOnly} />
            </Field>
          ))}
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <div className="flex flex-wrap gap-3 rounded-lg border border-line bg-white/[0.02] p-3 text-sm">
            <span className="text-neutral-500">
              Overall score: <strong className="text-neutral-100">{overallScore}</strong>
            </span>
            <span className="text-neutral-500">
              Risk score ({methodLabel}): <strong className="text-neutral-100">{riskScore}</strong>
            </span>
            <span className="text-neutral-500">
              Impact: <strong className="text-neutral-100">{impact}</strong>
            </span>
            <span className="text-neutral-500">
              Inherent level: <strong className="text-neutral-100">{inherentLevel}</strong>
            </span>
            {linkedControls.length > 0 && (
              <>
                <span className="text-neutral-500">
                  Residual L: <strong className="text-neutral-100">{axes.residualLikelihood}</strong>
                </span>
                <span className="text-neutral-500">
                  Residual I: <strong className="text-neutral-100">{axes.residualImpact}</strong>
                </span>
              </>
            )}
            <span className="text-neutral-500">
              Residual level: <strong className="text-neutral-100">{residualLevel}</strong>
            </span>
            {appetiteLimit != null && (
              <span className="text-neutral-500">
                Appetite: <strong className={effectiveResidual > appetiteLimit ? "text-amber-300" : "text-neutral-100"}>
                  ≤ {appetiteLimit}{effectiveResidual > appetiteLimit ? " · exceeded" : ""}
                </strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {showControlsSection && (
        <div>
          <p className="label border-b border-line pb-2">Controls & treatment</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Existing controls">
                <TextArea value={form.existingControls || ""} onChange={set("existingControls")} placeholder="Current controls in place to reduce the risk." readOnly={readOnly} />
              </Field>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Mitigation actions">
                <TextArea value={form.mitigationActions || ""} onChange={set("mitigationActions")} placeholder="Planned actions to mitigate the risk." readOnly={readOnly} />
              </Field>
            </div>
            <Field label="Treatment">
              <Select value={form.treatment || "Mitigate"} onChange={set("treatment")} options={TREATMENTS.map((t) => ({ value: t, label: t }))} disabled={readOnly} />
            </Field>
            <Field label="Status">
              <Select value={form.status || "Open"} onChange={set("status")} options={STATUSES} disabled={readOnly} />
            </Field>
            <Field label="Treatment owner" hint="Required when residual exposure exceeds appetite">
              <TextInput value={form.treatmentOwner || ""} onChange={set("treatmentOwner")} placeholder="e.g. Head of IT Security" readOnly={readOnly} />
            </Field>
            <Field label="Treatment due date" hint="Required when residual exposure exceeds appetite">
              <TextInput type="date" value={form.treatmentDueDate || ""} onChange={set("treatmentDueDate")} readOnly={readOnly} />
            </Field>
            <Field label="Treatment effectiveness" hint="Assessed at treatment review">
              <Select
                value={form.treatmentEffectiveness || "Not Assessed"}
                onChange={set("treatmentEffectiveness")}
                options={["Not Assessed", "Effective", "Partially Effective", "Ineffective"]}
                disabled={readOnly}
              />
            </Field>
            <Field label="Residual score" hint={linkedControls.length > 0 ? `L(${axes.residualLikelihood}) × I(${axes.residualImpact}) = ${suggested} · leave blank to use` : "No linked controls — residual equals inherent"}>
              <div className="flex items-center gap-2">
                <TextInput type="number" min="1" max="25" value={form.residualScore ?? ""} onChange={set("residualScore")} readOnly={readOnly} />
                {!hasUserResidual && (
                  <span className="chip border-line bg-white/[0.03] text-neutral-400">suggested {suggested}</span>
                )}
              </div>
            </Field>
            {residualDeviation && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 sm:col-span-2 lg:col-span-3">
                <p className="text-xs text-amber-200">
                  Your residual ({Number(form.residualScore)}) deviates more than 20% from the control-driven suggestion ({suggested}) for the {methodName} method. This deviation must be justified.
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3">
                  <TextArea
                    value={form.residualJustification || ""}
                    onChange={set("residualJustification")}
                    placeholder={`Required — at least ${JUSTIFICATION_MIN_LENGTH} characters.`}
                    readOnly={readOnly}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] text-amber-200/70">
                      {form.residualJustification ? form.residualJustification.trim().length : 0} / {JUSTIFICATION_MIN_LENGTH} characters
                    </p>
                    <button type="button" onClick={useSuggestion} className="chip border-amber-500/40 bg-amber-950/40 text-amber-200 hover:bg-amber-900/40">
                      Use suggestion ({suggested})
                    </button>
                  </div>
                </div>
              </div>
            )}
            <Field label="Deadline">
              <TextInput type="date" value={form.deadline || ""} onChange={set("deadline")} readOnly={readOnly} />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}
