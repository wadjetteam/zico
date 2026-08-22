/**
 * Risk Assessment Module — Pure Calculation Engine
 * 
 * Implements the exact specification from the requirements:
 * - Inherent Risk: Likelihood × Impact (Weighted or Max)
 * - Residual Risk: Inherent × (1 - Combined CE) where CE is per-control
 * - Control Effectiveness reduces Overall Score directly (configurable by control type)
 * - All functions are pure, side-effect free, and testable
 * 
 * Control Types (configurable):
 * - Preventive: reduces Likelihood
 * - Detective: reduces Impact  
 * - Corrective: reduces Impact
 * - Default/Other: reduces Overall Score (legacy behavior)
 */

export const IMPACT_CRITERIA = [
  'Financial',
  'Regulatory',
  'Reputational',
  'Safety',
  'Operational',
  'Confidentiality',
  'Integrity',
  'Availability',
];

export const CONTROL_TYPES = {
  PREVENTIVE: 'Preventive',
  DETECTIVE: 'Detective',
  CORRECTIVE: 'Corrective',
  OTHER: 'Other',
};

/** Control effectiveness reduction target axis */
export const CE_REDUCTION_AXIS = {
  [CONTROL_TYPES.PREVENTIVE]: 'likelihood',
  [CONTROL_TYPES.DETECTIVE]: 'impact',
  [CONTROL_TYPES.CORRECTIVE]: 'impact',
  [CONTROL_TYPES.OTHER]: 'overall',
};

export const RISK_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

/** Default thresholds (1-25 scale) */
export const DEFAULT_THRESHOLDS = {
  critical: 20,
  high: 12,
  medium: 6,
};

/** Validate input is integer 1-5 */
export const validateScale15 = (value, fieldName) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw new Error(`${fieldName} must be an integer between 1 and 5, got: ${value}`);
  }
  return n;
};

/** Validate CE is percentage 0-100 */
export const validateCE = (value, fieldName) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    throw new Error(`${fieldName} must be a number between 0 and 100, got: ${value}`);
  }
  return n;
};

/**
 * Calculate weighted impact from individual criteria scores and weights
 * Impact = Σ (criterion_value × weight) / Σ weights
 * Falls back to max if weights are invalid
 */
export const calculateWeightedImpact = (impacts, criteria) => {
  if (!criteria?.length || !impacts) return 1;
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const c of criteria) {
    const value = Number(impacts[c.name]);
    const weight = Number(c.weight);
    
    if (!Number.isFinite(value) || value < 1 || value > 5) continue;
    if (!Number.isFinite(weight) || weight <= 0) continue;
    
    weightedSum += value * weight;
    totalWeight += weight;
  }
  
  if (totalWeight === 0) {
    // Fallback: max impact if no valid weights
    return calculateMaxImpact(impacts, criteria);
  }
  
  return Math.min(5, Math.max(1, Math.round(weightedSum / totalWeight)));
};

/**
 * Calculate max impact (simple max of all criteria)
 */
export const calculateMaxImpact = (impacts, criteria) => {
  if (!criteria?.length || !impacts) return 1;
  
  const values = criteria
    .map(c => Number(impacts[c.name]))
    .filter(v => Number.isFinite(v) && v >= 1 && v <= 5);
  
  return values.length ? Math.max(...values) : 1;
};

/**
 * Calculate impact based on domain's configured method
 * @param {string} method - 'weighted' | 'max' | 'advanced' (70/30 blend)
 */
export const calculateImpact = (impacts, criteria, method = 'weighted') => {
  switch (method) {
    case 'weighted':
      return calculateWeightedImpact(impacts, criteria);
    case 'max':
      return calculateMaxImpact(impacts, criteria);
    case 'advanced': {
      // 70% max + 30% weighted average (like existing engine)
      const maxImpact = calculateMaxImpact(impacts, criteria);
      const weightedImpact = calculateWeightedImpact(impacts, criteria);
      return Math.min(5, Math.max(1, Math.round(0.7 * maxImpact + 0.3 * weightedImpact)));
    }
    default:
      return calculateWeightedImpact(impacts, criteria);
  }
};

/**
 * Calculate Inherent Risk Score
 * Inherent = Likelihood × Impact (1-25 scale)
 */
export const calculateInherentScore = (likelihood, impact) => {
  const L = validateScale15(likelihood, 'Likelihood');
  const I = validateScale15(impact, 'Impact');
  return L * I;
};

/**
 * Determine Risk Level from score and thresholds
 * @param {number} score - Risk score (1-25)
 * @param {Object} thresholds - { critical, high, medium }
 */
export const determineRiskLevel = (score, thresholds = DEFAULT_THRESHOLDS) => {
  const n = Number(score) || 0;
  const t = thresholds || DEFAULT_THRESHOLDS;
  
  if (n >= (t.critical ?? 20)) return RISK_LEVELS.CRITICAL;
  if (n >= (t.high ?? 12)) return RISK_LEVELS.HIGH;
  if (n >= (t.medium ?? 6)) return RISK_LEVELS.MEDIUM;
  return RISK_LEVELS.LOW;
};

/**
 * Calculate combined Control Effectiveness using complement rule
 * CE_combined = 1 - Π(1 - CE_i)
 * Only includes controls of matching type for the axis
 * @param {Array} controls - [{ ce: 0-100, type: 'Preventive'|'Detective'|'Corrective'|'Other' }]
 * @param {string} targetAxis - 'likelihood' | 'impact' | 'overall'
 */
export const calculateCombinedCE = (controls, targetAxis = 'overall') => {
  if (!controls?.length) return 0;
  
  const relevantControls = controls.filter(c => {
    const ce = Number(c.ce);
    if (!Number.isFinite(ce) || ce < 0 || ce > 100) return false;
    
    const controlType = c.type || CONTROL_TYPES.OTHER;
    const reducesAxis = CE_REDUCTION_AXIS[controlType];
    
    // If control reduces 'overall', it applies to any axis
    // If control reduces specific axis, only apply when matching
    return reducesAxis === 'overall' || reducesAxis === targetAxis;
  });
  
  if (!relevantControls.length) return 0;
  
  let combined = 0;
  for (const c of relevantControls) {
    const ceFraction = Number(c.ce) / 100;
    combined = 1 - (1 - combined) * (1 - ceFraction);
  }
  
  return Math.min(1, Math.max(0, combined));
};

/**
 * Calculate Residual Risk Score with axis-aware CE (ISO 27005 style)
 * Returns { residualLikelihood, residualImpact, residualScore, residualLevel }
 * 
 * @param {Object} params
 * @param {number} params.likelihood - 1-5
 * @param {number} params.impact - 1-5
 * @param {Array} params.controls - [{ ce: 0-100, type: ControlType }]
 * @param {Object} params.thresholds - Risk level thresholds
 * @param {string} params.impactMethod - 'weighted' | 'max' | 'advanced'
 */
export const calculateResidualRisk = ({ likelihood, impact, controls = [], thresholds, impactMethod = 'weighted' }) => {
  const L = validateScale15(likelihood, 'Likelihood');
  const I = validateScale15(impact, 'Impact');
  
  // CE for likelihood axis (Preventive + Other)
  const likelihoodCE = calculateCombinedCE(controls, 'likelihood');
  // CE for impact axis (Detective + Corrective + Other)
  const impactCE = calculateCombinedCE(controls, 'impact');
  
  // Apply CE to each axis (clamped to 1-5)
  const clamp15 = (v) => Math.min(5, Math.max(1, Math.round(v)));
  const residualLikelihood = clamp15(L * (1 - likelihoodCE));
  const residualImpact = clamp15(I * (1 - impactCE));
  
  // Residual score = residualL × residualI
  const residualScore = residualLikelihood * residualImpact;
  const residualLevel = determineRiskLevel(residualScore, thresholds);
  
  return {
    residualLikelihood,
    residualImpact,
    residualScore,
    residualLevel,
    likelihoodCE: Math.round(likelihoodCE * 100),
    impactCE: Math.round(impactCE * 100),
  };
};

/**
 * Calculate Residual Risk Score (Legacy simple mode - reduces Overall Score directly)
 * Residual = Inherent × (1 - Combined CE)
 * 
 * @param {number} inherentScore - 1-25
 * @param {Array} controls - [{ ce: 0-100 }]
 * @param {Object} thresholds - Risk level thresholds
 */
export const calculateSimpleResidualRisk = (inherentScore, controls = [], thresholds) => {
  const inherent = Number(inherentScore);
  if (!Number.isFinite(inherent) || inherent < 1 || inherent > 25) {
    throw new Error(`Inherent score must be 1-25, got: ${inherentScore}`);
  }
  
  const combinedCE = calculateCombinedCE(controls, 'overall');
  const residualScore = Math.max(1, Math.round(inherent * (1 - combinedCE)));
  const residualLevel = determineRiskLevel(residualScore, thresholds);
  
  return {
    residualScore,
    residualLevel,
    combinedCE: Math.round(combinedCE * 100),
  };
};

/**
 * Main calculation function - computes all risk metrics at once
 * Returns complete assessment object for UI display
 * 
 * @param {Object} input
 * @param {number} input.likelihood - 1-5
 * @param {Object} input.impacts - { Financial: 1-5, Regulatory: 1-5, ... }
 * @param {Array} input.criteria - Domain criteria with weights
 * @param {string} input.impactMethod - 'weighted' | 'max' | 'advanced'
 * @param {Array} input.controls - [{ ce: 0-100, type: ControlType, controlId }]
 * @param {Object} input.thresholds - { critical, high, medium }
 * @param {boolean} input.useAxisAware - Use ISO 27005 axis-aware (default true)
 */
export const calculateRiskAssessment = (input) => {
  const {
    likelihood,
    impacts,
    criteria,
    impactMethod = 'weighted',
    controls = [],
    thresholds = DEFAULT_THRESHOLDS,
    useAxisAware = true,
    appetiteLimit,
  } = input;
  
  // Validate inputs
  validateScale15(likelihood, 'Likelihood');
  if (criteria?.length) {
    for (const c of criteria) {
      const v = Number(impacts?.[c.name]);
      if (!Number.isFinite(v) || v < 1 || v > 5) {
        throw new Error(`Impact for ${c.name} must be 1-5, got: ${v}`);
      }
    }
  }
  for (const c of controls) {
    validateCE(c.ce, `Control ${c.controlId || c.name || 'unknown'} CE`);
  }
  
  // 1. Calculate Impact
  const impact = calculateImpact(impacts, criteria, impactMethod);
  
  // 2. Calculate Inherent Risk
  const inherentScore = calculateInherentScore(likelihood, impact);
  const inherentLevel = determineRiskLevel(inherentScore, thresholds);
  
  // 4. Calculate Residual Risk
  let residual;
  if (useAxisAware) {
    residual = calculateResidualRisk({
      likelihood,
      impact,
      controls,
      thresholds,
      impactMethod,
    });
  } else {
    residual = calculateSimpleResidualRisk(inherentScore, controls, thresholds);
  }
  
  const appetiteStatus = appetiteLimit != null
    ? (residual.residualScore <= appetiteLimit ? 'Within Appetite' : 'Exceeds Appetite')
    : null;

  return {
    // Inputs (validated)
    likelihood: validateScale15(likelihood, 'Likelihood'),
    impacts: { ...impacts },
    
    // Domain config (read-only reference)
    criteria: criteria?.map(c => ({ name: c.name, weight: Number(c.weight) })) || [],
    impactMethod,
    thresholds: { ...thresholds },
    
    // Calculated
    impact,
    inherentScore,
    inherentLevel,
    residualScore: residual.residualScore,
    residualLevel: residual.residualLevel,
    residualLikelihood: residual.residualLikelihood,
    residualImpact: residual.residualImpact,
    likelihoodCE: residual.likelihoodCE,
    impactCE: residual.impactCE,
    combinedCE: residual.combinedCE,
    appetiteStatus,
  };
};

/**
 * Get default impact values for a domain (for pre-filling form)
 */
export const getDefaultImpacts = (criteria, defaultValue = 3) => {
  const defaults = {};
  if (criteria?.length) {
    for (const c of criteria) {
      defaults[c.name] = defaultValue;
    }
  }
  return defaults;
};

export default {
  IMPACT_CRITERIA,
  CONTROL_TYPES,
  CE_REDUCTION_AXIS,
  RISK_LEVELS,
  DEFAULT_THRESHOLDS,
  validateScale15,
  validateCE,
  calculateWeightedImpact,
  calculateMaxImpact,
  calculateImpact,
  calculateInherentScore,
  determineRiskLevel,
  calculateCombinedCE,
  calculateResidualRisk,
  calculateSimpleResidualRisk,
  calculateRiskAssessment,
  getDefaultImpacts,
};