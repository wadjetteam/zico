import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import { CATEGORIES, SCALE, SCALE_LABELS, STANDARD_CRITERIA, STATUSES, TREATMENTS } from "./constants";
import { titleCase } from "../../lib/format";
import api from "../../api/client";
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
} from "../../lib/riskEngine";

export {
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
};

export const EMPTY_FORM = {
  riskId: "",
  title: "",
  process: "",
  subProcess: "",
  assetSystem: "",
  ownerTeam: "",
  category: "Cybersecurity",
  threat: "",
  vulnerability: "",
  riskDate: "",
  owner: "",
  likelihood: 3,
  impacts: {},
  existingControls: "",
  residualScore: "",
  treatment: "Mitigate",
  status: "Open",
  mitigationActions: "",
  deadline: "",
  asset: "",
  treatmentOwner: "",
  treatmentDueDate: "",
  treatmentEffectiveness: "Not Assessed",
  residualJustification: "",
  acceptedBy: "",
};

export function formFromRisk(r) {
  const impacts = {};
  for (const i of r.impacts || []) impacts[i.name] = i.value;
  for (const d of [
    { key: "impactFinance", name: "Financial" },
    { key: "impactRegulatory", name: "Regulatory" },
    { key: "impactReputational", name: "Reputational" },
    { key: "impactSafety", name: "Safety" },
    { key: "impactOperational", name: "Operational" },
    { key: "impactC", name: "Confidentiality" },
    { key: "impactI", name: "Integrity" },
    { key: "impactA", name: "Availability" },
  ]) {
    if (impacts[d.name] == null && r[d.key] != null) impacts[d.name] = r[d.key];
  }
  return {
    riskId: r.riskId || "",
    title: r.title || "",
    description: r.description || "",
    process: r.process || "",
    subProcess: r.subProcess || "",
    riskCategory: r.riskCategory || "Cybersecurity",
    assetSystem: r.assetSystem || "",
    threat: r.threat || "",
    vulnerability: r.vulnerability || "",
    riskOwnerId: r.riskOwnerId || "",
    ownerTeam: r.ownerTeam || "",
    riskSource: r.riskSource || "",
    dateIdentified: r.dateIdentified || "",
    likelihood: r.likelihood || 3,
    impacts,
    treatmentDecision: r.treatmentDecision || "Modify",
    treatmentActions: r.treatmentActions || "",
    estimatedBudget: r.estimatedBudget ?? null,
    plannedControls: r.plannedControls || [],
    treatmentOwnerId: r.treatmentOwnerId || "",
    targetDate: r.targetDate || "",
    reviewFrequency: r.reviewFrequency || "Quarterly",
    acceptanceJustification: r.acceptanceJustification || "",
    nextReviewDate: r.nextReviewDate || "",
    riskOwnerSignOff: r.riskOwnerSignOff || null,
    attachments: r.attachments || [],
    existingControls: r.existingControls || "",
    residualScore: r.residualScore ?? "",
    treatment: r.treatment || "Mitigate",
    status: r.status || "Open",
    mitigationActions: r.mitigationActions || "",
    deadline: r.deadline || "",
    asset: r.asset?._id || r.asset || "",
    treatmentOwner: r.treatmentOwner || "",
    treatmentDueDate: r.treatmentDueDate ? String(r.treatmentDueDate).slice(0, 10) : "",
    treatmentEffectiveness: r.treatmentEffectiveness || "Not Assessed",
    residualJustification: r.residualJustification || "",
    acceptedBy: r.acceptedBy || "",
  };
}

function Section({ title, children }) {
  return (
    <div>
      <p className="label border-b border-line pb-2">{title}</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

export default function RiskForm({
  form,
  onChange,
  assetOptions = [],
  showAsset = true,
  method = "advanced",
  criteria = STANDARD_CRITERIA,
  thresholds,
  appetiteLimit,
  param,
  links = [],
}) {
  const set = (k) => (e) => {
    const v = e.target.value;
    onChange(k, k === "likelihood" ? Number(v) : v);
  };
  const setImpact = (name) => (e) =>
    onChange("impacts", { ...(form.impacts || {}), [name]: Number(e.target.value) });

  const [users, setUsers] = useState([]);
  useEffect(() => {
    let active = true;
    api
      .get("/users")
      .then((r) => {
        if (active) setUsers(r.data?.items || r.data || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const overallScore = impactSum(form, criteria);
  const impact = impactFor(form, method, criteria);
  const riskScore = riskScoreFor({ likelihood: form.likelihood, impact, param });
  const axes = residualAxesFor({
    likelihood: form.likelihood,
    impact,
    links,
    controlOf: (id) => {
      const link = links.find((l) => l.control?._id === id || l.control_id === id);
      return link?.control || null;
    },
    cfg: {
      weights: param?.controlEffectivenessWeights,
      capReduction: param?.residualCapReduction,
    },
  });
  const suggested = axes.score;
  const hasUserResidual = form.residualScore !== "" && form.residualScore != null;
  const effectiveResidual = hasUserResidual ? Number(form.residualScore) : suggested;
  const residualDeviation = hasUserResidual && requiresJustification(Number(form.residualScore), suggested);
  const inherentLevel = levelOf(riskScore, thresholds);
  const residualLevel = levelOf(effectiveResidual, thresholds);
  const methodLabel =
    param?.riskScoreMethod === "weighted_additive"
      ? "weighted additive (×5, weights sum to 1)"
      : param?.riskScoreMethod === "matrix_lookup"
        ? "matrix lookup (5×5)"
        : "likelihood × impact";
  const methodName = param?.riskScoreMethod || "multiplicative";
  const useSuggestion = () => {
    onChange("residualScore", "");
    onChange("residualJustification", "");
  };

  return (
    <div className="space-y-6">
      <Section title="Identification">
        <Field label="Risk ID" hint="e.g. R-049">
          <TextInput value={form.riskId} onChange={set("riskId")} placeholder="Auto-assigned if blank" />
        </Field>
        <Field label="Risk title">
          <TextInput value={form.title} onChange={set("title")} required placeholder="e.g. Unauthorised access to customer data" />
        </Field>
        <Field label="Process">
          <TextInput value={form.process} onChange={set("process")} placeholder="e.g. Customer Onboarding" />
        </Field>
        <Field label="Sub-Process">
          <TextInput value={form.subProcess} onChange={set("subProcess")} placeholder="e.g. KYC Verification" />
        </Field>
        <Field label="Asset / System">
          <TextInput value={form.assetSystem} onChange={set("assetSystem")} placeholder="e.g. Mobile Banking App" />
        </Field>
        <Field label="Owner Team">
          <TextInput value={form.ownerTeam} onChange={set("ownerTeam")} placeholder="e.g. Digital Banking" />
        </Field>
        <Field label="Risk category">
          <Select value={form.category} onChange={set("category")} options={CATEGORIES} />
        </Field>
        <Field label="Risk date">
          <TextInput type="date" value={form.riskDate} onChange={set("riskDate")} />
        </Field>
        <Field label="Owner" hint="Accountable owner — required">
          <TextInput value={form.owner} onChange={set("owner")} placeholder="e.g. Head of Digital" required />
        </Field>
      </Section>

      <Section title="Threat & vulnerability">
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label="Threat">
            <TextArea value={form.threat} onChange={set("threat")} placeholder="The threat actor or event that could exploit the vulnerability." />
          </Field>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label="Vulnerability">
            <TextArea value={form.vulnerability} onChange={set("vulnerability")} placeholder="The weakness that could be exploited." />
          </Field>
        </div>
        {showAsset && (
          <Field label="Linked asset (optional)">
            <Select value={form.asset} onChange={set("asset")} options={assetOptions} />
          </Field>
        )}
      </Section>

      <div className="rounded-xl border border-dashed border-gold/30 bg-gold/[0.02] p-4">
        <p className="label flex items-center gap-2 text-gold">
          Your assessment for this risk
          <HelpCircle
            className="h-3.5 w-3.5 cursor-help text-neutral-500"
            title="Rules vs. data: the criteria, weights, thresholds and appetite are set once in the Domain & Parameter settings (read-only panel above). These 1-5 picks are the data for THIS risk only - its own likelihood and impact - and every risk needs its own."
          />
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
          Rate this risk only: how likely it is (1–5) and its impact per criterion (1 = minimal · 5 = severe). The
          weights, thresholds and appetite from the read-only parameter panel above are applied automatically — you
          can change the values if the default assessment does not reflect this specific risk.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Likelihood" hint={SCALE_LABELS[form.likelihood]}>
            <Select value={form.likelihood} onChange={set("likelihood")} options={SCALE} />
          </Field>
          {(criteria || []).map((c) => (
            <Field key={c.name} label={`Impact · ${c.name}`}>
              <Select value={form.impacts?.[c.name] || 1} onChange={setImpact(c.name)} options={SCALE} />
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
            {links.length > 0 && (
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
          <p className="mt-2 text-[11px] text-neutral-600">
            Auto-calculated from your domain, parameter and linked controls — adjust likelihood/impact above if needed.
          </p>
        </div>
      </div>

      <Section title="Controls & treatment">
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label="Existing controls">
            <TextArea value={form.existingControls} onChange={set("existingControls")} placeholder="Current controls in place to reduce the risk." />
          </Field>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label="Mitigation actions">
            <TextArea value={form.mitigationActions} onChange={set("mitigationActions")} placeholder="Planned actions to mitigate the risk." />
          </Field>
        </div>
        <Field label="Treatment">
          <Select value={form.treatment} onChange={set("treatment")} options={TREATMENTS.map((t) => ({ value: t, label: titleCase(t) }))} />
        </Field>
        {(form.treatment === "Accept" || form.treatment === "pending_acceptance") && (
          <Field
            label="Accepted by"
            hint={
              form.treatment === "Accept"
                ? "Required — the accountable sign-off for accepting this residual. Critical/High risks require ciso, cro or board."
                : "Requested approver — the risk stays pending until they accept."
            }
          >
            <Select
              value={form.acceptedBy || ""}
              onChange={set("acceptedBy")}
              options={[
                { value: "", label: "Select user…" },
                ...users.map((u) => ({ value: u._id, label: `${u.fullName || u.username} (${titleCase(u.role)})` })),
              ]}
            />
          </Field>
        )}
        <Field label="Status">
          <Select value={form.status} onChange={set("status")} options={STATUSES} />
        </Field>
        <Field label="Treatment owner" hint="Required when residual exposure exceeds appetite">
          <TextInput value={form.treatmentOwner || ""} onChange={set("treatmentOwner")} placeholder="e.g. Head of IT Security" />
        </Field>
        <Field label="Treatment due date" hint="Required when residual exposure exceeds appetite">
          <TextInput type="date" value={form.treatmentDueDate || ""} onChange={set("treatmentDueDate")} />
        </Field>
        <Field label="Treatment effectiveness" hint="Assessed at treatment review">
          <Select
            value={form.treatmentEffectiveness || "Not Assessed"}
            onChange={set("treatmentEffectiveness")}
            options={["Not Assessed", "Effective", "Partially Effective", "Ineffective"]}
          />
        </Field>
        <Field label="Residual score" hint={links.length > 0 ? `L(${axes.residualLikelihood}) × I(${axes.residualImpact}) = ${suggested} · leave blank to use` : `No linked controls — residual equals inherent (${riskScore})`}>
          <div className="flex items-center gap-2">
            <TextInput type="number" min="1" max="25" value={form.residualScore} onChange={set("residualScore")} />
            {!hasUserResidual && (
              <span className="chip border-line bg-white/[0.03] text-neutral-400">suggested {suggested}</span>
            )}
          </div>
        </Field>
        {residualDeviation && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 sm:col-span-2 lg:col-span-3">
            <p className="flex items-start gap-2 text-xs text-amber-200">
              <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Your residual ({Number(form.residualScore)}) deviates more than 20% from the control-driven suggestion
                ({suggested}) for the <strong>{methodName}</strong> method. This deviation must be justified so we can
                confirm the residual is an accepted decision under the ISO 27001 risk treatment framework — it is not a
                formality, it records who accepted the exposure and why.
              </span>
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <TextArea
                value={form.residualJustification || ""}
                onChange={set("residualJustification")}
                placeholder={`Required — at least ${JUSTIFICATION_MIN_LENGTH} characters. e.g. Additional compensating controls are being deployed; owner has accepted residual exposure until Q3.`}
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
        <Field label="Residual level" hint="Computed automatically from the domain's thresholds">
          <div className="input flex items-center justify-between gap-2">
            <span>{residualLevel}</span>
            <span className={`chip ${residualLevel === "Critical" ? "border-red-800/60 bg-red-950/40 text-red-300" : residualLevel === "High" ? "border-orange-800/60 bg-orange-950/40 text-orange-300" : residualLevel === "Medium" ? "border-amber-800/60 bg-amber-950/40 text-amber-300" : "border-emerald-800/60 bg-emerald-950/40 text-emerald-300"}`}>
              {residualLevel}
            </span>
          </div>
        </Field>
        <Field label="Deadline">
          <TextInput type="date" value={form.deadline} onChange={set("deadline")} />
        </Field>
      </Section>
    </div>
  );
}
