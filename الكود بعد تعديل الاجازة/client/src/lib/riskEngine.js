/**
 * Shared, pure risk-scoring engine.
 * Used by the backend (canonical computation on save) AND the client (live
 * preview). Never import axios/React — keep this file side-effect free.
 *
 * Two orthogonal axes:
 *   (a) impact axis  — how the 8 criteria collapse into one impact (1–5):
 *                      'max' (plain max) or 'advanced' (blended 70/30).
 *   (b) score method — how likelihood + impact become riskScore (1–25):
 *                      'multiplicative' | 'weighted_additive' | 'matrix_lookup'.
 */

export const SCALE_FACTOR = 5;
export const DEFAULT_RESIDUAL_CAP = 0.75;
export const DEFAULT_MIN_RESIDUAL_SCORE = 1;
export const DEFAULT_SCORE_WEIGHTS = { likelihood: 0.5, impact: 0.5 };
export const JUSTIFICATION_THRESHOLD = 0.20;
export const APPROVAL_THRESHOLD = 0.40;

/** Effectiveness keys are the platform display strings (single source of truth). */
export const DEFAULT_CEF_WEIGHTS = {
  Effective: 0.75,
  "Partially Effective": 0.5,
  Ineffective: 0.25,
  "Not Assessed": 0,
};

export const RISK_SCORE_METHODS = ["multiplicative", "weighted_additive", "matrix_lookup"];
export const QUANTITATIVE_ALE = "quantitative_ale"; // Phase 2 — flagged, not implemented

/**
 * Residual Risk Calculation Methods:
 * - "overall_ce": Residual = Inherent × (1 - Effective CE) [Basic/Standard]
 * - "axis_reduction": Residual = ResidualL × ResidualI [Advanced/ISO 27005]
 */
export const RESIDUAL_METHODS = ["overall_ce", "axis_reduction"];

const clamp15 = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return 1;
  return Math.min(5, Math.max(1, n));
};

/** Values (1–5) aligned to the criteria list from the form's impacts map. */
export const impactValues = (form, criteria) =>
  (criteria || []).map((c) => {
    const v = Number(form?.impacts?.[c.name]);
    if (!Number.isFinite(v) || v < 1 || v > 5) return 1;
    return Math.round(v);
  });

export const impactSum = (form, criteria) => impactValues(form, criteria).reduce((a, b) => a + b, 0);

/** Advanced: Blended Impact — 70% of the maximum criterion + 30% of the weighted average. */
export const blendedImpact = (form, criteria) => {
  const values = impactValues(form, criteria);
  if (!values.length) return 1;
  const max = Math.max(...values);
  const wSum = (criteria || []).reduce((a, c) => a + (Number(c.weight) || 0), 0);
  const wAvg = values.reduce((a, v, i) => a + v * (Number(criteria?.[i]?.weight) || 0), 0) / (wSum || 1);
  return Math.min(5, Math.max(1, Math.round(0.7 * max + 0.3 * wAvg)));
};

/** Default method: plain max impact. */
export const defaultImpact = (form, criteria) => {
  const values = impactValues(form, criteria);
  return values.length ? Math.max(...values) : 1;
};

/** Impact per the domain's fixed method (axis a). */
export const impactFor = (form, method, criteria) =>
  method === "advanced" ? blendedImpact(form, criteria) : defaultImpact(form, criteria);

/** Level from the domain's parameter thresholds (falls back to 20/12/6). */
export const levelOf = (score, thresholds = { critical: 20, high: 12, medium: 6 }) => {
  const t = thresholds || {};
  const n = Number(score) || 0;
  if (n >= (t.critical ?? 20)) return "Critical";
  if (n >= (t.high ?? 12)) return "High";
  if (n >= (t.medium ?? 6)) return "Medium";
  return "Low";
};

/**
 * riskScore per the domain's configured method (axis b).
 * matrix_lookup falls back to multiplicative when the table is missing,
 * incomplete or holds a non-numeric cell — never silently fail to score.
 */
export const riskScoreFor = ({ likelihood, impact, param = {} }) => {
  const L = clamp15(likelihood);
  const I = clamp15(impact);
  const method = param.riskScoreMethod || "multiplicative";
  switch (method) {
    case "weighted_additive": {
      const w = param.riskScoreWeights || DEFAULT_SCORE_WEIGHTS;
      const wL = Number(w.likelihood);
      const wI = Number(w.impact);
      const wl = Number.isFinite(wL) ? wL : 0.5;
      const wi = Number.isFinite(wI) ? wI : 0.5;
      return Math.min(25, Math.max(1, Math.round((wl * L + wi * I) * SCALE_FACTOR)));
    }
    case "matrix_lookup": {
      const t = param.matrixLookupTable;
      const cell = Array.isArray(t) && Array.isArray(t[L - 1]) ? t[L - 1][I - 1] : undefined;
      if (Number.isFinite(Number(cell))) return Math.min(25, Math.max(1, Math.round(Number(cell))));
      return L * I; // fallback: multiplicative
    }
    case "multiplicative":
    default:
      return L * I;
  }
};

/**
 * Control Effectiveness Factor: combined reduction of all existing/mitigating
 * links. proposed links are excluded — they are not live yet. Capped at
 * residualCapReduction so no domain can claim more than the cap.
 */
export const cefFor = (links = [], { weights = DEFAULT_CEF_WEIGHTS, capReduction = DEFAULT_RESIDUAL_CAP } = {}) => {
  let cef = 0;
  for (const l of links) {
    if (l.link_type !== "existing" && l.link_type !== "mitigating") continue;
    const w = Number(weights[l.effectiveness]);
    if (!Number.isFinite(w) || w <= 0) continue;
    cef = 1 - (1 - cef) * (1 - w);
  }
  return Math.min(cef, Number(capReduction) || DEFAULT_RESIDUAL_CAP);
};

/** Control-driven residual suggestion with minimum residual floor. */
export const suggestedResidual = (inherentScore, links, cfg) => {
  const minResidual = cfg?.minResidualScore ?? DEFAULT_MIN_RESIDUAL_SCORE;
  return Math.max(minResidual, Math.round(Number(inherentScore) * (1 - cefFor(links, cfg))));
};

/**
 * ISO 27005 axis-aware residual: Preventive controls reduce the LIKELIHOOD
 * axis, Detective/Corrective controls reduce the IMPACT axis (controls typed
 * otherwise reduce both). Aggregation uses the complement rule so stacked
 * controls never exceed a 100% reduction, capped per-domain like cefFor.
 * Returns the rounded axis values and the multiplicative residual score.
 */
export const residualAxesFor = ({ likelihood, impact, links = [], controlOf = () => null, cfg = {} } = {}) => {
  const weights = cfg.weights || DEFAULT_CEF_WEIGHTS;
  const cap = Number(cfg.capReduction) || DEFAULT_RESIDUAL_CAP;
  const reduce = (axis) => {
    let cef = 0;
    for (const l of links) {
      if (l.link_type !== "existing" && l.link_type !== "mitigating") continue;
      const cType = String(controlOf(l.control_id)?.controlType || "").toLowerCase();
      const affects = cType === "detective" || cType === "corrective" ? "impact" : cType === "preventive" ? "likelihood" : "both";
      if (affects !== axis && affects !== "both") continue;
      const w = Number(weights[l.effectiveness]);
      if (!Number.isFinite(w) || w <= 0) continue;
      cef = 1 - (1 - cef) * (1 - w);
    }
    return Math.min(cef, cap);
  };
  const likelihoodCef = reduce("likelihood");
  const impactCef = reduce("impact");
  const clamp15 = (v) => Math.min(5, Math.max(1, Math.round(Number(v) || 1)));
  const residualLikelihood = clamp15(likelihood * (1 - likelihoodCef));
  const residualImpact = clamp15(impact * (1 - impactCef));
  return {
    residualLikelihood,
    residualImpact,
    score: Math.max(1, residualLikelihood * residualImpact),
    likelihoodCef,
    impactCef,
  };
};

/**
 * Unified risk-scoring function — Single Source of Truth.
 *
 * This is the ONLY function allowed to compute any risk score in the platform
 * (create, update, report, dashboard, export). No parallel implementations
 * are permitted anywhere else.
 *
 * @param {Object} params
 * @param {number} params.likelihood - 1-5
 * @param {Object} params.impacts - { Financial: 1-5, Regulatory: 1-5, ... }
 * @param {Object} params.parameter - Full domain parameter object
 * @param {Array} params.linkedControls - [{ controlId, effectivenessRating, testedEffectiveness? }]
 * @returns {Object} Full risk score with calculation trace
 */
export function computeRiskScore({ likelihood, impacts, parameter, linkedControls = [] }) {
  const param = parameter || {};
  const criteria = param.criteria || [];

  if (!criteria.length) {
    throw new Error("Parameter must include at least one impact criterion.");
  }

  const thresholds = param.thresholds || { critical: 20, high: 12, medium: 6 };
  const appetiteLimit = param.appetiteLimit != null ? Number(param.appetiteLimit) : null;
  const toleranceLimit = param.toleranceLimit != null ? Number(param.toleranceLimit) : null;
  const minResidualScore = param.minResidualScore ?? DEFAULT_MIN_RESIDUAL_SCORE;
  const residualMethod = param.residualMethod || "overall_ce";

  const totalWeight = criteria.reduce((a, c) => a + (Number(c.weight) || 0), 0);
  if (Math.abs(totalWeight - 1) > 0.005) {
    throw new Error(
      `Impact criteria weights must sum to 1 (±0.005). Current total: ${totalWeight.toFixed(3)}`
    );
  }

  const impactValuesArr = criteria.map((c) => {
    const v = Number(impacts?.[c.name]);
    if (!Number.isFinite(v) || v < 1 || v > 5) {
      throw new Error(`Impact for ${c.name} must be a number between 1 and 5.`);
    }
    return v;
  });

  const impactMethod = param.impactMethod;
  if (!impactMethod) {
    throw new Error("Parameter is missing required field: impactMethod.");
  }
  let impact;
  let impactCalcDetail;
  if (impactMethod === "weighted") {
    const weightedSum = criteria.reduce((a, c, i) => a + impactValuesArr[i] * (Number(c.weight) || 0), 0);
    impact = Math.min(5, Math.max(1, Math.round(weightedSum)));
    impactCalcDetail = `Σ(value × weight) = ${weightedSum.toFixed(3)} → rounded to ${impact}`;
  } else if (impactMethod === "max") {
    impact = Math.max(...impactValuesArr);
    impactCalcDetail = `max(${impactValuesArr.join(", ")}) = ${impact}`;
  } else {
    throw new Error(
      `Unknown impactMethod: "${impactMethod}". Allowed values are "weighted" or "max".`
    );
  }

  const L = Math.min(5, Math.max(1, Math.round(Number(likelihood) || 1)));
  const I = impact;
  const riskScoreMethod = param.riskScoreMethod;
  if (!riskScoreMethod) {
    throw new Error("Parameter is missing required field: riskScoreMethod.");
  }
  let inherentScore;
  let inherentCalcDetail;
  switch (riskScoreMethod) {
    case "multiplicative":
      inherentScore = L * I;
      inherentCalcDetail = `${L} × ${I} = ${inherentScore}`;
      break;
    case "weighted_additive": {
      const w = param.riskScoreWeights || DEFAULT_SCORE_WEIGHTS;
      const wL = Number(w.likelihood);
      const wI = Number(w.impact);
      const wl = Number.isFinite(wL) ? wL : 0.5;
      const wi = Number.isFinite(wI) ? wI : 0.5;
      inherentScore = Math.min(25, Math.max(1, Math.round((wl * L + wi * I) * SCALE_FACTOR)));
      inherentCalcDetail = `(${wl}×${L} + ${wi}×${I}) × ${SCALE_FACTOR} = ${inherentScore}`;
      break;
    }
    case "matrix_lookup": {
      const t = param.matrixLookupTable;
      if (!Array.isArray(t) || t.length !== 5 || !Array.isArray(t[L - 1]) || t[L - 1].length !== 5) {
        throw new Error("matrix_lookup requires a fully populated 5x5 numeric table.");
      }
      const cell = t[L - 1][I - 1];
      if (!Number.isFinite(Number(cell))) {
        throw new Error(`matrix_lookup cell [${L}][${I}] is not a valid number.`);
      }
      inherentScore = Math.min(25, Math.max(1, Math.round(Number(cell))));
      inherentCalcDetail = `table[${L}][${I}] = ${inherentScore}`;
      break;
    }
    default:
      throw new Error(
        `Unknown riskScoreMethod: "${riskScoreMethod}". Allowed values are "multiplicative", "weighted_additive", or "matrix_lookup".`
      );
  }

  const ceBands = param.controlEffectivenessWeights || DEFAULT_CEF_WEIGHTS;
  const capReduction = Number(param.maximumRiskReduction ?? param.residualCapReduction ?? DEFAULT_RESIDUAL_CAP);
  let combinedCE = 0;
  const ceDetails = [];
  for (const ctrl of linkedControls) {
    let ceFraction;
    if (ctrl.testedEffectiveness != null && String(ctrl.testedEffectiveness).trim() !== "") {
      const tested = Number(ctrl.testedEffectiveness);
      if (!Number.isFinite(tested) || tested < 0 || tested > 100) {
        throw new Error(`Tested effectiveness for control must be a number between 0 and 100.`);
      }
      ceFraction = tested / 100;
      ceDetails.push(`${ctrl.controlId || "control"}: tested ${tested}%`);
    } else {
      const band = ctrl.effectivenessRating || "Not Assessed";
      const w = Number(ceBands[band]);
      if (!Number.isFinite(w) || w <= 0) continue;
      ceFraction = w;
      ceDetails.push(`${ctrl.controlId || "control"}: ${band} (${(w * 100).toFixed(0)}%)`);
    }
    combinedCE = 1 - (1 - combinedCE) * (1 - ceFraction);
  }
  const rawCE = combinedCE;
  combinedCE = Math.min(combinedCE, capReduction);

  let residualScore;
  let residualCalcDetail;
  let residualLikelihood = null;
  let residualImpact = null;
  let likelihoodCef = null;
  let impactCef = null;

  if (residualMethod === "axis_reduction") {
    // Advanced: ISO 27005 axis-aware reduction
    const axisResult = residualAxesFor({
      likelihood: L,
      impact: I,
      links: linkedControls.map(l => ({ ...l, link_type: "existing" })),
      controlOf: () => null,
      cfg: { weights: ceBands, capReduction },
    });
    residualLikelihood = axisResult.residualLikelihood;
    residualImpact = axisResult.residualImpact;
    likelihoodCef = axisResult.likelihoodCef;
    impactCef = axisResult.impactCef;
    residualScore = Math.max(minResidualScore, axisResult.score);
    residualCalcDetail = `L:${L}→${residualLikelihood} × I:${I}→${residualImpact} = ${residualScore}`;
  } else {
    // Standard: Overall CE reduction
    residualScore = Math.max(minResidualScore, Math.round(inherentScore * (1 - combinedCE)));
    residualCalcDetail = `${inherentScore} × (1 - ${(combinedCE * 100).toFixed(1)}%) = ${residualScore}`;
  }

  const levelOf = (score) => {
    const n = Number(score) || 0;
    if (n >= (Number(thresholds.critical) || 20)) return "Critical";
    if (n >= (Number(thresholds.high) || 12)) return "High";
    if (n >= (Number(thresholds.medium) || 6)) return "Medium";
    return "Low";
  };

  const inherentLevel = levelOf(inherentScore);
  const residualLevel = levelOf(residualScore);

  // Appetite/Tolerance evaluation
  let appetiteStatus;
  if (appetiteLimit != null) {
    if (residualScore <= appetiteLimit) {
      appetiteStatus = "Within Appetite";
    } else if (toleranceLimit != null && residualScore <= toleranceLimit) {
      appetiteStatus = "Above Appetite / Within Tolerance";
    } else {
      appetiteStatus = toleranceLimit != null ? "Outside Tolerance" : "Exceeds Appetite";
    }
  }

  const scoredWithParameter = {
    parameterVersion: Number(param.methodVersion) || 1,
    impactMethod,
    riskScoreMethod,
    residualMethod,
    criteria: criteria.map((c) => ({ name: c.name, weight: Number(c.weight) || 0 })),
    thresholds: { ...thresholds },
    appetiteLimit,
    toleranceLimit,
    controlEffectivenessBands: { ...ceBands },
    maximumRiskReduction: capReduction,
    minResidualScore,
    scoredAt: new Date().toISOString(),
  };

  return {
    impact: I,
    inherentScore,
    inherentLevel,
    combinedCE,
    effectiveCE: combinedCE,
    rawCE,
    maximumRiskReduction: capReduction,
    residualScore,
    residualLevel,
    residualLikelihood,
    residualImpact,
    likelihoodCef,
    impactCef,
    appetiteStatus,
    scoredWithParameter,
    calculationTrace: {
      likelihood: L,
      impact: I,
      impactMethod,
      impactCalcDetail,
      riskScoreMethod,
      inherentCalcDetail,
      ceDetails,
      rawCE: Number((rawCE * 100).toFixed(1)),
      effectiveCE: Number((combinedCE * 100).toFixed(1)),
      capApplied: rawCE > capReduction,
      residualMethod,
      residualCalcDetail,
      minResidualScore,
      thresholds,
      appetiteLimit,
      toleranceLimit,
    },
  };
}

/** |user − suggested| / suggested (Infinity when suggested is 0 and user > 0). */
export const deviationRatio = (userValue, suggested) => {
  const s = Number(suggested);
  const u = Number(userValue);
  if (!Number.isFinite(s) || s <= 0) return u > 0 ? Infinity : 0;
  return Math.abs(u - s) / s;
};

/**
 * Determine override governance level based on deviation ratio.
 * Returns: "normal" | "warning" | "justification" | "approval"
 */
export const overrideGovernance = (userValue, suggested) => {
  const ratio = deviationRatio(userValue, suggested);
  if (ratio === 0) return "normal";
  if (ratio <= 0.10) return "normal";
  if (ratio <= JUSTIFICATION_THRESHOLD) return "warning";
  if (ratio <= APPROVAL_THRESHOLD) return "justification";
  return "approval";
};

/** Legacy: >20% deviation requires justification. */
export const requiresJustification = (userValue, suggested) => deviationRatio(userValue, suggested) > JUSTIFICATION_THRESHOLD;

/** >40% deviation requires approval. */
export const requiresApproval = (userValue, suggested) => deviationRatio(userValue, suggested) > APPROVAL_THRESHOLD;

export const JUSTIFICATION_MIN_LENGTH = 20;