export const CONTROL_TYPES = ["Preventive", "Detective", "Corrective"];

export const DEFAULT_THRESHOLDS = { critical: 20, high: 12, medium: 6 };

export const DEFAULT_IMPACTS = [
  { name: "Financial", value: 1 },
  { name: "Regulatory", value: 1 },
  { name: "Reputational", value: 1 },
  { name: "Safety", value: 1 },
  { name: "Operational", value: 1 },
  { name: "Confidentiality", value: 1 },
  { name: "Integrity", value: 1 },
  { name: "Availability", value: 1 },
];

export const getDefaultImpacts = () =>
  DEFAULT_IMPACTS.reduce((acc, i) => ({ ...acc, [i.name]: i.value }), {});

const clamp15 = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return 1;
  return Math.min(5, Math.max(1, n));
};

const levelOf = (score, thresholds = DEFAULT_THRESHOLDS) => {
  const t = thresholds || {};
  const n = Number(score) || 0;
  if (n >= (t.critical ?? 20)) return "Critical";
  if (n >= (t.high ?? 12)) return "High";
  if (n >= (t.medium ?? 6)) return "Medium";
  return "Low";
};

const impactValues = (impacts, criteria) =>
  (criteria || []).map((c) => {
    const v = Number(impacts?.[c.name]);
    if (!Number.isFinite(v) || v < 1 || v > 5) return 1;
    return Math.round(v);
  });

const blendedImpact = (impacts, criteria) => {
  const values = impactValues(impacts, criteria);
  if (!values.length) return 1;
  const max = Math.max(...values);
  const wSum = (criteria || []).reduce((a, c) => a + (Number(c.weight) || 0), 0);
  const wAvg = values.reduce((a, v, i) => a + v * (Number(criteria?.[i]?.weight) || 0), 0) / (wSum || 1);
  return Math.min(5, Math.max(1, Math.round(0.7 * max + 0.3 * wAvg)));
};

const defaultImpact = (impacts, criteria) => {
  const values = impactValues(impacts, criteria);
  return values.length ? Math.max(...values) : 1;
};

const impactFor = (impacts, method, criteria) =>
  method === "advanced" ? blendedImpact(impacts, criteria) : defaultImpact(impacts, criteria);

const DEFAULT_CEF_WEIGHTS = {
  Effective: 0.75,
  "Partially Effective": 0.5,
  Ineffective: 0.25,
  "Not Assessed": 0,
};

const cefFor = (links = [], { weights = DEFAULT_CEF_WEIGHTS, capReduction = 0.75 } = {}) => {
  let cef = 0;
  for (const l of links) {
    if (l.link_type !== "existing" && l.link_type !== "mitigating") continue;
    const w = Number(weights[l.effectiveness]);
    if (!Number.isFinite(w) || w <= 0) continue;
    cef = 1 - (1 - cef) * (1 - w);
  }
  return Math.min(cef, Number(capReduction) || 0.75);
};

const residualAxesFor = ({ likelihood, impact, links = [], controlOf = () => null, cfg = {} } = {}) => {
  const weights = cfg.weights || DEFAULT_CEF_WEIGHTS;
  const cap = Number(cfg.capReduction) || 0.75;
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
  const residualLikelihood = Math.min(5, Math.max(1, Math.round(Number(likelihood) * (1 - likelihoodCef))));
  const residualImpact = Math.min(5, Math.max(1, Math.round(Number(impact) * (1 - impactCef))));
  return {
    residualLikelihood,
    residualImpact,
    score: Math.max(1, residualLikelihood * residualImpact),
    likelihoodCef,
    impactCef,
  };
};

export function calculateRiskAssessment({
  likelihood,
  impacts = {},
  criteria = [],
  parameter = {},
  linkedControls = [],
  thresholds = DEFAULT_THRESHOLDS,
}) {
  const param = parameter || {};
  const crit = param.criteria?.length ? param.criteria : criteria;
  const method = param.impactMethod || (param.riskScoreMethod === "advanced" ? "advanced" : "max");

  const I = impactFor(impacts, method, crit);
  const L = clamp15(likelihood);
  const inherentScore = L * I;

  const axes = residualAxesFor({
    likelihood: L,
    impact: I,
    links: linkedControls,
    controlOf: (id) => {
      const link = linkedControls.find((l) => l.control?._id === id || l.control_id === id);
      return link?.control || null;
    },
    cfg: {
      weights: param.controlEffectivenessWeights,
      capReduction: param.residualCapReduction,
    },
  });

  const residualScore = axes.score;
  const inherentLevel = levelOf(inherentScore, thresholds);
  const residualLevel = levelOf(residualScore, thresholds);

  return {
    impact: I,
    inherentScore,
    inherentLevel,
    residualScore,
    residualLevel,
    residualLikelihood: axes.residualLikelihood,
    residualImpact: axes.residualImpact,
    thresholds,
  };
}
