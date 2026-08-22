import { useMemo, useCallback } from "react";
import { Field, Select } from "./Field";
import { calculateRiskAssessment, CONTROL_TYPES, DEFAULT_THRESHOLDS } from "../lib/riskAssessment";
import { chipClass } from "../lib/format";

const SCALE = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }));

// Default CE bands — overridden by domain param if available
const DEFAULT_CE_BANDS = {
  Effective: 75,
  "Partially Effective": 50,
  Ineffective: 25,
  "Not Assessed": 0,
};

const CRITERIA_LABELS = {
  Financial: "Financial",
  Regulatory: "Regulatory",
  Reputational: "Reputational",
  Safety: "Safety",
  Operational: "Operational",
  Confidentiality: "Confidentiality",
  Integrity: "Integrity",
  Availability: "Availability",
};

const LEVEL_COLORS = {
  Low: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  Medium: "border-amber-800/60 bg-amber-950/40 text-amber-300",
  High: "border-orange-800/60 bg-orange-950/40 text-orange-300",
  Critical: "border-red-800/60 bg-red-950/40 text-red-300",
};

const APPETITE_COLORS = {
  "Within Appetite": "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  "Exceeds Appetite": "border-red-800/60 bg-red-950/40 text-red-300",
};

function Tooltip({ children, text }) {
  return (
    <span className="relative inline-flex items-center" tabIndex={0}>
      {children}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-2 py-1.5 text-[10px] text-neutral-100 bg-ink-deep border border-line rounded shadow-lg opacity-0 invisible transition-opacity group-hover:opacity-100 group-hover:visible z-10 whitespace-normal leading-snug">
        {text}
      </span>
    </span>
  );
}

function ReadOnlyField({ label, value, hint, tooltip }) {
  return (
    <Field label={label} hint={hint}>
      <div className="input bg-white/[0.02] border-neutral-800 text-neutral-400 cursor-not-allowed select-none">
        {value ?? "—"}
      </div>
      {tooltip && <Tooltip text={tooltip}><span className="ml-1.5 text-neutral-500 hover:text-gold cursor-help">ℹ️</span></Tooltip>}
    </Field>
  );
}

function ScoreDisplay({ label, score, level, subLabel }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-lg border bg-white/[0.02] min-w-[100px]">
      <span className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</span>
      <span className="text-3xl font-mono font-bold text-neutral-100">{score}</span>
      <span className={`chip text-xs ${LEVEL_COLORS[level] || "border-neutral-700 bg-neutral-900 text-neutral-400"}`}>
        {level}
      </span>
      {subLabel && <span className="text-[10px] text-neutral-500">{subLabel}</span>}
    </div>
  );
}

export function ControlEffectivenessInput({
  controls = [],
  onChange,
  readOnly = false,
  domainParam,
}) {
  // Build CE band map from domain param if available, else use defaults
  const bandMap = useMemo(() => {
    const weights = domainParam?.controlEffectivenessWeights;
    if (weights && Object.keys(weights).length) {
      return Object.fromEntries(
        Object.entries(weights).map(([label, val]) => [label, Math.round(Number(val) * 100)])
      );
    }
    return { ...DEFAULT_CE_BANDS };
  }, [domainParam]);

  const bandOptions = useMemo(() =>
    Object.entries(bandMap).map(([label, pct]) => ({
      value: label,
      label: `${label} (${pct}%)`,
    })),
    [bandMap]
  );

  // Derive band label from stored numeric CE value
  const getBandFromCE = (ceValue) => {
    const entry = Object.entries(bandMap).find(([, pct]) => pct === ceValue);
    return entry ? entry[0] : "Not Assessed";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="label">Linked Controls & Effectiveness</span>
        {controls.length === 0 && (
          <span className="text-[11px] text-neutral-500">No controls linked. Add controls to enable residual risk calculation.</span>
        )}
      </div>

      {controls.length === 0 ? (
        <p className="text-sm text-neutral-500 text-center py-4">
          Link controls from the Control Picker to calculate residual risk.
        </p>
      ) : (
        <div className="space-y-2">
          {controls.map((control, index) => (
            <div key={control.controlId || control._id || index} className="rounded-lg border border-line bg-white/[0.02] p-3">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="font-mono text-xs font-semibold text-gold">
                  {control.annexCode || control.controlId || `Control ${index + 1}`}
                </span>
                <span className="flex-1 truncate text-sm text-neutral-300">{control.name || "Unnamed Control"}</span>
                <span className={`chip text-[10px] ${chipClass(control.implementationStatus)}`}>
                  {control.implementationStatus || "—"}
                </span>
                <span className="text-[10px] text-neutral-500">
                  {control.framework?.name || "—"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Effectiveness Rating" hint="Domain-defined bands — system converts to numeric value automatically">
                  {!readOnly ? (
                    <Select
                      value={getBandFromCE(control.ce ?? 0)}
                      onChange={(e) => {
                        const band = e.target.value;
                        const numericCE = bandMap[band] ?? 0;
                        onChange(control.controlId || control._id || index, "ce", numericCE);
                        onChange(control.controlId || control._id || index, "effectivenessRating", band);
                      }}
                      options={bandOptions}
                    />
                  ) : (
                    <div className="input bg-white/[0.02] border-neutral-800 text-neutral-400 cursor-not-allowed">
                      {getBandFromCE(control.ce ?? 0)}
                    </div>
                  )}
                </Field>

                <Field label="CE Value (auto)" hint="Numeric value derived from the selected band — read-only">
                  <div className="input bg-white/[0.02] border-neutral-800 text-neutral-400 cursor-not-allowed">
                    {control.ce ?? 0}%
                  </div>
                </Field>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RiskAssessmentForm({
  form,
  onChange,
  domainParam,
  domainName,
  impactMethod,
  linkedControls = [],
  onControlCEChange,
  readOnly = false,
  showControlsSection = true,
  onAssessmentChange,
}) {
  const criteria = domainParam?.criteria || [];
  const thresholds = domainParam?.thresholds || DEFAULT_THRESHOLDS;
  const appetiteLimit = domainParam?.appetiteLimit;

  const impacts = form?.impacts || {};

  const assessment = useMemo(() => {
    if (!form?.likelihood || !criteria.length) return null;
    try {
      return calculateRiskAssessment({
        likelihood: form.likelihood,
        impacts,
        criteria,
        impactMethod: impactMethod || domainParam?.scoringMethod || "weighted",
        controls: linkedControls.map((c) => ({
          ce: c.ce ?? 0,
          type: c.type || CONTROL_TYPES.OTHER,
          controlId: c.controlId || c._id,
        })),
        thresholds,
        useAxisAware: true,
        appetiteLimit,
      });
    } catch (e) {
      console.warn("Risk assessment calculation error:", e.message);
      return null;
    }
  }, [form?.likelihood, impacts, criteria, impactMethod, domainParam?.scoringMethod, linkedControls, thresholds, appetiteLimit]);

  const handleImpactChange = useCallback(
    (criterionName, value) => {
      onChange("impacts", { ...impacts, [criterionName]: Number(value) });
    },
    [impacts, onChange]
  );

  const handleCEChange = useCallback(
    (controlId, field, value) => {
      if (onControlCEChange) onControlCEChange(controlId, field, value);
    },
    [onControlCEChange]
  );

  if (!criteria.length) {
    return (
      <div className="rounded-lg border border-amber-800/60 bg-amber-950/30 p-4 text-sm text-amber-300">
        No active parameter found for the selected domain. Risk assessment cannot be calculated.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Domain Parameter Panel (Read-Only) */}
      <div className="rounded-xl border border-gold/30 bg-gold/[0.02] p-4">
        <div className="flex items-center gap-2 text-gold mb-3">
          <span className="label">Domain Parameter (Read-Only)</span>
          <span className="chip text-[10px] border-gold/40 bg-gold/10 text-gold">{domainName || "Unknown"}</span>
        </div>
        <p className="text-[11px] text-neutral-500 mb-4">
          The following values are derived from the domain's active parameter and cannot be edited here.
          They are used automatically in the risk calculation below.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReadOnlyField
            label="Impact Method"
            value={impactMethod === "weighted" ? "Weighted Average" : impactMethod === "max" ? "Maximum" : "Advanced (70/30 Blend)"}
            hint="How individual impacts combine into a single Impact score"
            tooltip="Weighted: Σ(value × weight)/Σweights | Max: highest value | Advanced: 70% max + 30% weighted"
          />
          <ReadOnlyField
            label="Risk Score Method"
            value={
              domainParam?.riskScoreMethod === "weighted_additive"
                ? "Weighted Additive"
                : domainParam?.riskScoreMethod === "matrix_lookup"
                ? "Matrix Lookup"
                : "Multiplicative (L × I)"
            }
            hint="How Likelihood + Impact produce Risk Score"
          />
          <ReadOnlyField
            label="Thresholds"
            value={`C≥${thresholds.critical} H≥${thresholds.high} M≥${thresholds.medium}`}
            hint="Score boundaries for risk levels"
            tooltip="Critical ≥ 20 | High ≥ 12 | Medium ≥ 6 | Low < 6 (defaults shown, domain may override)"
          />
          <ReadOnlyField
            label="Risk Appetite"
            value={appetiteLimit ? `≤ ${appetiteLimit}` : "Not Set"}
            hint="Maximum acceptable residual risk score"
            tooltip="If residual score exceeds appetite, risk requires treatment or acceptance approval"
          />
        </div>

        <div className="mt-4 pt-4 border-t border-line">
          <span className="label text-[11px]">Impact Weights (per criterion)</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {criteria.map((c) => (
              <span key={c.name} className="chip text-[10px] border-line bg-white/[0.03] text-neutral-400">
                {CRITERIA_LABELS[c.name] || c.name}: {Number(c.weight).toFixed(3)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* User Input: Likelihood & Impacts */}
      <div className="rounded-xl border border-dashed border-gold/30 bg-gold/[0.02] p-4">
        <div className="flex items-center gap-2 text-gold mb-3">
          <span className="label">Your Assessment for This Risk</span>
        </div>
        <p className="text-[11px] text-neutral-500 mb-4">
          Enter the likelihood (1–5) and impact per criterion (1–5). All scores below update instantly.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Likelihood" hint="How likely is this risk to occur? (1 = Rare, 5 = Almost Certain)">
            <Select
              value={form?.likelihood || 3}
              onChange={(e) => onChange("likelihood", Number(e.target.value))}
              options={SCALE}
              disabled={readOnly}
            />
          </Field>

          {criteria.map((c) => (
            <Field key={c.name} label={`Impact · ${CRITERIA_LABELS[c.name] || c.name}`} hint={`Weight: ${Number(c.weight).toFixed(3)}`}>
              <Select
                value={impacts[c.name] || 3}
                onChange={(e) => handleImpactChange(c.name, e.target.value)}
                options={SCALE}
                disabled={readOnly}
              />
            </Field>
          ))}
        </div>
      </div>

      {/* Calculated Results — Read-Only */}
      {assessment && (
        <div className="rounded-xl border border-line bg-white/[0.02] p-4">
          <span className="label flex items-center gap-2">
            Calculated Risk Metrics (Auto-Updated)
            <Tooltip text="These values are calculated in real-time from your inputs above and the linked controls' effectiveness.">
              <span className="ml-1.5 text-neutral-500 hover:text-gold cursor-help">ℹ️</span>
            </Tooltip>
          </span>

          {/* Row 1: Inherent */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ScoreDisplay
              label="Impact (Weighted)"
              score={assessment.impact}
              level={assessment.inherentLevel}
              subLabel={impactMethod}
            />
            <ScoreDisplay
              label="Inherent Score"
              score={assessment.inherentScore}
              level={assessment.inherentLevel}
              subLabel="L × I"
            />
            <ScoreDisplay
              label="Residual Score"
              score={assessment.residualScore}
              level={assessment.residualLevel}
              subLabel="Inherent × (1 − CE)"
            />
          </div>

          {/* Row 2: Combined CE + Appetite Status */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col items-center gap-1 p-3 rounded-lg border bg-white/[0.02]">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500">Combined CE</span>
              <span className="text-3xl font-mono font-bold text-neutral-100">
                {linkedControls.length > 0
                  ? `${Math.round((1 - (1 - (assessment.likelihoodCE ?? 0) / 100) * (1 - (assessment.impactCE ?? 0) / 100)) * 100)}%`
                  : "0%"}
              </span>
              <span className="text-[10px] text-neutral-500">Control Effectiveness</span>
            </div>

            <div className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-white/[0.02]">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500">Appetite Status</span>
              {assessment.appetiteStatus ? (
                <>
                  <span className={`chip mt-1 ${APPETITE_COLORS[assessment.appetiteStatus] || "border-neutral-700 bg-neutral-900 text-neutral-400"}`}>
                    {assessment.appetiteStatus === "Within Appetite" ? "✅" : "⚠️"} {assessment.appetiteStatus}
                  </span>
                  <span className="text-[10px] text-neutral-500">≤ {appetiteLimit}</span>
                </>
              ) : (
                <span className="text-sm text-neutral-500">Appetite not set</span>
              )}
            </div>
          </div>

          {assessment.appetiteStatus === "Exceeds Appetite" && (
            <div className="mt-4 rounded-lg border border-amber-800/60 bg-amber-950/30 px-3 py-2 text-sm text-amber-300">
              ⚠️ Residual Score ({assessment.residualScore}) exceeds Risk Appetite (≤ {appetiteLimit}).
              Treatment, transfer, or formal acceptance required.
            </div>
          )}
        </div>
      )}

      {/* Controls & CE Section */}
      {showControlsSection && (
        <ControlEffectivenessInput
          controls={linkedControls}
          onChange={handleCEChange}
          readOnly={readOnly}
          domainParam={domainParam}
        />
      )}

      {assessment && onAssessmentChange && (
        <input type="hidden" onChange={() => onAssessmentChange(assessment)} />
      )}
    </div>
  );
}
