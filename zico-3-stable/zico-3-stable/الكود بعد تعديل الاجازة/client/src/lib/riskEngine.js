/**
 * Risk Calculation Engine - Client-side exports
 * Re-exports from server riskEngine for frontend use
 */

export const RISK_SCORE_METHODS = [
  { id: "quantitative", label: "Quantitative", description: "Numerical scoring (1-5 scale)" },
  { id: "qualitative", label: "Qualitative", description: "Descriptive scoring (Low/Med/High/Critical)" },
  { id: "hybrid", label: "Hybrid", description: "Combined quantitative and qualitative" },
];

export const SCALE = [1, 2, 3, 4, 5];

export function impactValues(impact) {
  if (!impact) return {};
  return typeof impact === "object" ? impact : {};
}

export function impactSum(impact) {
  const v = impactValues(impact);
  return Object.values(v).reduce((s, val) => s + (Number(val) || 0), 0);
}

export function blendedImpact(impact) {
  const sum = impactSum(impact);
  const count = Object.keys(impactValues(impact)).length;
  return count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
}

export function defaultImpact() {
  return { financial: 1, operational: 1, reputational: 1, regulatory: 1, strategic: 1 };
}

export function impactFor(impact, axis) {
  return Number(impact?.[axis]) || 0;
}

export function levelOf(score) {
  if (score >= 20) return "Critical";
  if (score >= 12) return "High";
  if (score >= 6) return "Medium";
  return "Low";
}

export function riskScoreFor(likelihood, impact) {
  const imp = typeof impact === "number" ? impact : blendedImpact(impact);
  return Math.round((Number(likelihood) || 0) * imp);
}

export function residualAxesFor(likelihood, impact, controls = []) {
  let l = Number(likelihood) || 0;
  let i = typeof impact === "number" ? impact : blendedImpact(impact);
  
  controls.forEach((c) => {
    const effectiveness = Number(c.effectiveness) || 0;
    const reduction = effectiveness * 0.1;
    if (c.reducesLikelihood) l = Math.max(1, Math.round(l * (1 - reduction)));
    if (c.reducesImpact) i = Math.max(1, Math.round(i * (1 - reduction)));
  });
  
  return { likelihood: l, impact: i, score: l * i };
}

export function requiresJustification(likelihood, impact, threshold = 0.20) {
  const score = riskScoreFor(likelihood, impact);
  return score > threshold * 100;
}

export const JUSTIFICATION_MIN_LENGTH = 30;

export function computeRiskScore(form) {
  const likelihood = Number(form.likelihood) || 0;
  const impact = form.impact || {};
  return riskScoreFor(likelihood, impact);
}

export default {
  RISK_SCORE_METHODS,
  SCALE,
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
  computeRiskScore,
};
