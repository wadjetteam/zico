/**
 * Risk Calculation Engine - Professional GRC Risk Scoring
 * 
 * Architecture:
 * 1. Parameter Engine - Domain methodology configuration
 * 2. Impact Engine - Calculate impact from criteria
 * 3. Control Effectiveness Engine - Calculate control effectiveness
 * 4. Control Reduction Engine - Calculate risk reduction
 * 5. Residual Risk Engine - Calculate final residual risk
 * 6. Appetite Engine - Evaluate against appetite/tolerance
 * 7. Validation Engine - Validate all inputs
 * 8. Snapshot Engine - Store calculation audit trail
 */

// ============================================
// CONSTANTS
// ============================================

export const RISK_CONSTANTS = {
  SCALE_FACTOR: 5,
  DEFAULT_MAX_REDUCTION: 0.75,
  DEFAULT_MIN_RESIDUAL: 1,
  JUSTIFICATION_THRESHOLD: 0.20,
  APPROVAL_THRESHOLD: 0.40,
  DEFAULT_THRESHOLDS: { critical: 20, high: 12, medium: 6 },
  DEFAULT_CE_FACTORS: {
    design: 0.25,
    operating: 0.35,
    coverage: 0.25,
    testing: 0.15,
  },
};

// Control Relationship Types for aggregation
export const CONTROL_RELATIONSHIPS = {
  INDEPENDENT: "independent",     // Controls work independently
  COMPLEMENTARY: "complementary", // Controls enhance each other
  OVERLAPPING: "overlapping",     // Controls have overlap
  COMPENSATING: "compensating",   // One compensates for another
};

// Control Roles for axis-based reduction
export const CONTROL_ROLES = {
  BOTH: "both",                   // Reduces both L and I
  LIKELIHOOD: "likelihood",       // Reduces Likelihood only
  IMPACT: "impact",               // Reduces Impact only
};

// Residual Risk Calculation Methods
export const RESIDUAL_METHODS = {
  OVERALL: "overall_ce",          // RR = IR × (1 - CR)
  AXIS: "axis_reduction",         // RR = RL × RI
};

// ============================================
// PARAMETER ENGINE
// ============================================

export class ParameterEngine {
  constructor(parameter) {
    this.param = parameter;
  }

  static getActiveParameter(domainId, parameters) {
    return parameters.find(
      (p) => p.domain?._id === domainId && p.status === "active"
    );
  }

  static getParameterById(paramId, parameters) {
    return parameters.find((p) => p._id === paramId);
  }

  getCriteria() {
    return this.param?.criteria || [];
  }

  getImpactMethod() {
    return this.param?.impactMethod || "weighted";
  }

  getScoringMethod() {
    return this.param?.riskScoreMethod || "multiplicative";
  }

  getControlEffectivenessModel() {
    return (
      this.param?.controlEffectivenessModel || {
        factors: RISK_CONSTANTS.DEFAULT_CE_FACTORS,
      }
    );
  }

  getThresholds() {
    return this.param?.thresholds || RISK_CONSTANTS.DEFAULT_THRESHOLDS;
  }

  getAppetiteConfig() {
    return {
      appetiteLimit: this.param?.appetiteLimit ?? 8,
      toleranceLimit: this.param?.toleranceLimit ?? 12,
    };
  }

  getResidualRules() {
    return {
      maxReduction: this.param?.maximumRiskReduction ?? RISK_CONSTANTS.DEFAULT_MAX_REDUCTION,
      minResidual: this.param?.minResidualScore ?? RISK_CONSTANTS.DEFAULT_MIN_RESIDUAL,
      method: this.param?.residualMethod || "overall_ce",
    };
  }

  getGovernanceRules() {
    return {
      justificationThreshold:
        this.param?.governanceRules?.justificationThreshold ??
        RISK_CONSTANTS.JUSTIFICATION_THRESHOLD,
      approvalThreshold:
        this.param?.governanceRules?.approvalThreshold ??
        RISK_CONSTANTS.APPROVAL_THRESHOLD,
      minJustificationLength:
        this.param?.governanceRules?.minJustificationLength ?? 20,
      requireJustification:
        this.param?.governanceRules?.requireJustification ?? true,
      requireApproval: this.param?.governanceRules?.requireApproval ?? true,
    };
  }

  getRecommendedControls() {
    return this.param?.recommendedControls || [];
  }

  validate() {
    const errors = [];

    if (!this.param) {
      errors.push("Parameter not found");
      return errors;
    }

    if (!this.param.criteria?.length) {
      errors.push("Parameter must have at least one criterion");
    }

    const totalWeight = this.param.criteria?.reduce(
      (sum, c) => sum + (Number(c.weight) || 0),
      0
    );
    if (Math.abs(totalWeight - 1) > 0.005) {
      errors.push(`Criteria weights must sum to 1 (current: ${totalWeight.toFixed(3)})`);
    }

    const ceModel = this.getControlEffectivenessModel();
    const factorSum = Object.values(ceModel.factors || {}).reduce(
      (sum, v) => sum + v,
      0
    );
    if (Math.abs(factorSum - 1) > 0.005) {
      errors.push(`Control effectiveness factors must sum to 1 (current: ${factorSum.toFixed(3)})`);
    }

    return errors;
  }
}

// ============================================
// IMPACT ENGINE
// ============================================

export class ImpactEngine {
  constructor(parameter) {
    this.paramEngine = new ParameterEngine(parameter);
  }

  calculateWeightedImpact(criteriaScores) {
    const criteria = this.paramEngine.getCriteria();
    let weightedSum = 0;
    const contributions = [];

    for (const criterion of criteria) {
      const score = Number(criteriaScores[criterion.name]) || 1;
      const weight = Number(criterion.weight) || 0;
      const contribution = score * weight;
      weightedSum += contribution;
      contributions.push({
        name: criterion.name,
        score,
        weight,
        contribution,
      });
    }

    // Preserve raw decimal for accuracy, round only for display
    const rawValue = weightedSum;
    const roundedImpact = Math.min(5, Math.max(1, Math.round(weightedSum)));
    return { impact: roundedImpact, contributions, method: "weighted", rawValue };
  }

  calculateMaxImpact(criteriaScores) {
    const criteria = this.paramEngine.getCriteria();
    const values = [];
    const contributions = [];

    for (const criterion of criteria) {
      const score = Number(criteriaScores[criterion.name]) || 1;
      values.push(score);
      contributions.push({ name: criterion.name, score, weight: criterion.weight });
    }

    const impact = values.length ? Math.max(...values) : 1;
    return { impact, contributions, method: "max", rawValue: impact };
  }

  calculateAverageImpact(criteriaScores) {
    const criteria = this.paramEngine.getCriteria();
    const values = [];
    const contributions = [];

    for (const criterion of criteria) {
      const score = Number(criteriaScores[criterion.name]) || 1;
      values.push(score);
      contributions.push({ name: criterion.name, score, weight: criterion.weight });
    }

    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 1;
    const impact = Math.min(5, Math.max(1, Math.round(avg)));
    return { impact, contributions, method: "average", rawValue: avg };
  }

  calculateMatrixLookup(criteriaScores, matrix) {
    const criteria = this.paramEngine.getCriteria();
    const avgScore = criteria.reduce(
      (sum, c) => sum + (Number(criteriaScores[c.name]) || 1),
      0
    ) / (criteria.length || 1);
    const row = Math.min(5, Math.max(1, Math.round(avgScore)));
    const col = row;

    const cell = matrix?.[row - 1]?.[col - 1];
    const impact = Number.isFinite(Number(cell))
      ? Math.min(5, Math.max(1, Math.round(Number(cell))))
      : row;

    return { impact, contributions: [], method: "matrix_lookup", rawValue: impact };
  }

  calculate(criteriaScores) {
    const method = this.paramEngine.getImpactMethod();

    switch (method) {
      case "weighted":
        return this.calculateWeightedImpact(criteriaScores);
      case "max":
        return this.calculateMaxImpact(criteriaScores);
      case "average":
        return this.calculateAverageImpact(criteriaScores);
      case "matrix_lookup":
        return this.calculateMatrixLookup(
          criteriaScores,
          this.paramEngine.param?.matrixLookupTable
        );
      default:
        return this.calculateWeightedImpact(criteriaScores);
    }
  }
}

// ============================================
// INHERENT RISK ENGINE
// ============================================

export class InherentRiskEngine {
  constructor(parameter) {
    this.paramEngine = new ParameterEngine(parameter);
    this.impactEngine = new ImpactEngine(parameter);
  }

  calculate(criteriaScores, likelihood) {
    const impactResult = this.impactEngine.calculate(criteriaScores);
    const L = Math.min(5, Math.max(1, Math.round(Number(likelihood) || 1)));
    const I = impactResult.impact;
    const scoringMethod = this.paramEngine.getScoringMethod();

    let inherentScore;
    let calculationDetail;

    switch (scoringMethod) {
      case "weighted_additive": {
        const weights = this.paramEngine.param?.riskScoreWeights || {
          likelihood: 0.5,
          impact: 0.5,
        };
        const wl = Number.isFinite(Number(weights.likelihood))
          ? Number(weights.likelihood)
          : 0.5;
        const wi = Number.isFinite(Number(weights.impact))
          ? Number(weights.impact)
          : 0.5;
        inherentScore = Math.min(
          25,
          Math.max(1, Math.round((wl * L + wi * I) * RISK_CONSTANTS.SCALE_FACTOR))
        );
        calculationDetail = `(${wl}×${L} + ${wi}×${I}) × ${RISK_CONSTANTS.SCALE_FACTOR} = ${inherentScore}`;
        break;
      }
      case "matrix_lookup": {
        const table = this.paramEngine.param?.matrixLookupTable;
        const cell = table?.[L - 1]?.[I - 1];
        inherentScore = Number.isFinite(Number(cell))
          ? Math.min(25, Math.max(1, Math.round(Number(cell))))
          : L * I;
        calculationDetail = `table[${L}][${I}] = ${inherentScore}`;
        break;
      }
      case "multiplicative":
      default:
        inherentScore = L * I;
        calculationDetail = `${L} × ${I} = ${inherentScore}`;
        break;
    }

    return {
      inherentScore,
      likelihood: L,
      impact: I,
      impactDetail: impactResult,
      scoringMethod,
      calculationDetail,
    };
  }
}

// ============================================
// CONTROL EFFECTIVENESS ENGINE
// ============================================

export class ControlEffectivenessEngine {
  constructor(parameter) {
    this.paramEngine = new ParameterEngine(parameter);
  }

  /**
   * Calculate overall effectiveness for a control based on assessment factors
   * and the parameter's effectiveness model
   */
  calculate(assessment) {
    const model = this.paramEngine.getControlEffectivenessModel();
    const factors = model.factors || RISK_CONSTANTS.DEFAULT_CE_FACTORS;

    let overall = 0;
    const factorResults = [];

    for (const [factorName, weight] of Object.entries(factors)) {
      const score = Number(assessment?.[factorName]) || 0;
      const contribution = score * weight;
      overall += contribution;
      factorResults.push({
        factor: factorName,
        score,
        weight,
        contribution,
      });
    }

    overall = Number(overall.toFixed(4));

    // Calculate confidence based on data completeness
    const hasData = factorResults.filter((f) => f.score > 0).length;
    const confidence = Math.round((hasData / Object.keys(factors).length) * 100);

    return {
      overall,
      confidence,
      factors: factorResults,
      modelVersion: model.version || "CE-V1",
    };
  }

  /**
   * Get effectiveness from library if no specific assessment
   */
  getLibraryEffectiveness(control) {
    return control?.effectiveness?.overall ?? 50;
  }
}

// ============================================
// CONTROL REDUCTION ENGINE
// ============================================

export class ControlReductionEngine {
  constructor(parameter) {
    this.paramEngine = new ParameterEngine(parameter);
    this.ceEngine = new ControlEffectivenessEngine(parameter);
  }

  /**
   * Calculate combined risk reduction from multiple controls
   * Supports role-based allocation and relationship types
   */
  calculate(riskControls, likelihood, impact) {
    if (!riskControls?.length) {
      return {
        rawReduction: 0,
        effectiveReduction: 0,
        capApplied: false,
        contributions: [],
        likelihoodReduction: 0,
        impactReduction: 0,
        residualLikelihood: likelihood,
        residualImpact: impact,
      };
    }

    const rules = this.paramEngine.getResidualRules();
    const contributions = [];
    let combinedReduction = 0;
    let likelihoodReduction = 0;
    let impactReduction = 0;

    // Calculate contribution for each control
    for (const rc of riskControls) {
      const ce = Number(rc.effectiveness) || 0;
      const relevance = Number(rc.relevance) || 1;
      const weight = Number(rc.weight) || 0;
      const relationship = rc.relationship || CONTROL_RELATIONSHIPS.INDEPENDENT;
      
      // Role allocation (default 50/50 for BOTH)
      const likelihoodAllocation = rc.likelihoodAllocation ?? 0.5;
      const impactAllocation = rc.impactAllocation ?? 0.5;

      // Base contribution = CE × Relevance × Weight
      const contribution = (ce / 100) * relevance * weight;
      combinedReduction += contribution;

      // Track axis-specific reductions based on role
      if (rc.role === CONTROL_ROLES.LIKELIHOOD) {
        likelihoodReduction += contribution;
      } else if (rc.role === CONTROL_ROLES.IMPACT) {
        impactReduction += contribution;
      } else if (rc.role === CONTROL_ROLES.BOTH) {
        // Split contribution based on allocation
        likelihoodReduction += contribution * likelihoodAllocation;
        impactReduction += contribution * impactAllocation;
      }

      contributions.push({
        controlId: rc.controlId,
        controlName: rc.controlName,
        effectiveness: ce,
        relevance,
        weight,
        role: rc.role,
        relationship,
        likelihoodAllocation,
        impactAllocation,
        contribution: Number((contribution * 100).toFixed(1)),
        likelihoodContribution: Number((contribution * likelihoodAllocation * 100).toFixed(1)),
        impactContribution: Number((contribution * impactAllocation * 100).toFixed(1)),
      });
    }

    // Apply relationship adjustments
    const relationshipAdjustment = this.calculateRelationshipAdjustment(riskControls);
    combinedReduction = Math.min(combinedReduction * relationshipAdjustment, 1);

    const rawReduction = combinedReduction;
    const maxReduction = rules.maxReduction;
    const capApplied = rawReduction > maxReduction;
    const effectiveReduction = Math.min(rawReduction, maxReduction);

    // Calculate axis-specific reductions (with cap applied proportionally)
    const rawLikelihoodReduction = likelihoodReduction;
    const rawImpactReduction = impactReduction;
    
    // Apply cap proportionally to each axis
    let effectiveLikelihoodReduction = rawLikelihoodReduction;
    let effectiveImpactReduction = rawImpactReduction;
    
    if (capApplied) {
      // Scale down proportionally if overall exceeds cap
      const scaleFactor = maxReduction / rawReduction;
      effectiveLikelihoodReduction = Math.min(rawLikelihoodReduction * scaleFactor, maxReduction);
      effectiveImpactReduction = Math.min(rawImpactReduction * scaleFactor, maxReduction);
    }

    // Calculate residual values
    const residualLikelihood = Math.max(1, likelihood * (1 - effectiveLikelihoodReduction));
    const residualImpact = Math.max(1, impact * (1 - effectiveImpactReduction));

    return {
      rawReduction: Number(rawReduction.toFixed(4)),
      effectiveReduction: Number(effectiveReduction.toFixed(4)),
      capApplied,
      maxReduction,
      contributions,
      rawLikelihoodReduction: Number(rawLikelihoodReduction.toFixed(4)),
      rawImpactReduction: Number(rawImpactReduction.toFixed(4)),
      likelihoodReduction: Number(effectiveLikelihoodReduction.toFixed(4)),
      impactReduction: Number(effectiveImpactReduction.toFixed(4)),
      residualLikelihood: Number(residualLikelihood.toFixed(2)),
      residualImpact: Number(residualImpact.toFixed(2)),
      relationshipAdjustment,
    };
  }

  /**
   * Calculate adjustment factor based on control relationships
   */
  calculateRelationshipAdjustment(controls) {
    const relationships = controls.map((c) => c.relationship || CONTROL_RELATIONSHIPS.INDEPENDENT);
    
    // If all independent, no adjustment
    if (relationships.every((r) => r === CONTROL_RELATIONSHIPS.INDEPENDENT)) {
      return 1.0;
    }

    // Check for overlapping controls (reduce total)
    const overlapping = relationships.filter((r) => r === CONTROL_RELATIONSHIPS.OVERLAPPING).length;
    if (overlapping > 0) {
      // Reduce by 20% for each overlapping pair
      return Math.max(0.6, 1.0 - overlapping * 0.2);
    }

    // Check for complementary controls (increase total slightly)
    const complementary = relationships.filter((r) => r === CONTROL_RELATIONSHIPS.COMPLEMENTARY).length;
    if (complementary > 0) {
      return Math.min(1.1, 1.0 + complementary * 0.05);
    }

    // Compensating controls - no adjustment
    return 1.0;
  }
}

// ============================================
// RESIDUAL RISK ENGINE
// ============================================

export class ResidualRiskEngine {
  constructor(parameter) {
    this.paramEngine = new ParameterEngine(parameter);
  }

  /**
   * Calculate residual risk using Overall CE method
   */
  calculateOverall(inherentScore, effectiveReduction) {
    const rules = this.paramEngine.getResidualRules();
    const rawResidual = inherentScore * (1 - effectiveReduction);
    const residualScore = Math.max(
      rules.minResidual,
      Math.round(rawResidual)
    );

    return {
      residualScore,
      rawResidual: Number(rawResidual.toFixed(2)),
      minResidual: rules.minResidual,
      reductionApplied: Number((effectiveReduction * 100).toFixed(1)),
    };
  }

  /**
   * Calculate residual risk using Axis-based method (ISO 27005)
   */
  calculateAxis(likelihood, impact, likelihoodReduction, impactReduction) {
    const rules = this.paramEngine.getResidualRules();
    
    const residualLikelihood = Math.max(1, likelihood * (1 - likelihoodReduction));
    const residualImpact = Math.max(1, impact * (1 - impactReduction));
    
    const residualScore = Math.max(
      rules.minResidual,
      Math.round(residualLikelihood * residualImpact)
    );

    return {
      residualScore,
      residualLikelihood: Number(residualLikelihood.toFixed(2)),
      residualImpact: Number(residualImpact.toFixed(2)),
      minResidual: rules.minResidual,
      likelihoodReduction: Number((likelihoodReduction * 100).toFixed(1)),
      impactReduction: Number((impactReduction * 100).toFixed(1)),
    };
  }

  /**
   * Main calculate method - dispatches based on parameter config
   */
  calculate(inherentScore, effectiveReduction, likelihood, impact, reductionDetail) {
    const rules = this.paramEngine.getResidualRules();
    
    if (rules.method === RESIDUAL_METHODS.AXIS && reductionDetail) {
      return this.calculateAxis(
        likelihood,
        impact,
        reductionDetail.likelihoodReduction,
        reductionDetail.impactReduction
      );
    }
    
    return this.calculateOverall(inherentScore, effectiveReduction);
  }
}

// ============================================
// APPETITE ENGINE
// ============================================

export class AppetiteEngine {
  constructor(parameter) {
    this.paramEngine = new ParameterEngine(parameter);
  }

  evaluate(residualScore) {
    const config = this.paramEngine.getAppetiteConfig();
    const { appetiteLimit, toleranceLimit } = config;

    let status;
    let exceeded;
    let color;

    if (residualScore <= appetiteLimit) {
      status = "Within Appetite";
      exceeded = false;
      color = "green";
    } else if (toleranceLimit != null && residualScore <= toleranceLimit) {
      status = "Above Appetite / Within Tolerance";
      exceeded = true;
      color = "amber";
    } else {
      status = toleranceLimit != null ? "Outside Tolerance" : "Exceeds Appetite";
      exceeded = true;
      color = "red";
    }

    return {
      status,
      exceeded,
      color,
      appetiteLimit,
      toleranceLimit,
      residualScore,
    };
  }
}

// ============================================
// RISK LEVEL ENGINE
// ============================================

export class RiskLevelEngine {
  constructor(parameter) {
    this.paramEngine = new ParameterEngine(parameter);
  }

  getLevel(score) {
    const thresholds = this.paramEngine.getThresholds();
    const n = Number(score) || 0;

    if (n >= (thresholds.critical || 20)) return "Critical";
    if (n >= (thresholds.high || 12)) return "High";
    if (n >= (thresholds.medium || 6)) return "Medium";
    return "Low";
  }

  getLevelInfo(score) {
    const level = this.getLevel(score);
    const thresholds = this.paramEngine.getThresholds();

    return {
      level,
      thresholds: { ...thresholds },
      nextLevel: level === "Low" ? "Medium" : level === "Medium" ? "High" : level === "High" ? "Critical" : null,
      pointsToNextLevel:
        level === "Low"
          ? (thresholds.medium || 6) - score
          : level === "Medium"
          ? (thresholds.high || 12) - score
          : level === "High"
          ? (thresholds.critical || 20) - score
          : 0,
    };
  }
}

// ============================================
// GOVERNANCE ENGINE
// ============================================

export class GovernanceEngine {
  constructor(parameter) {
    this.paramEngine = new ParameterEngine(parameter);
  }

  evaluateOverride(userValue, suggestedValue, riskLevel) {
    const rules = this.paramEngine.getGovernanceRules();
    const s = Number(suggestedValue);
    const u = Number(userValue);

    let deviationRatio;
    let deviationStatus;

    // Handle edge cases
    if (s === 0 && u === 0) {
      deviationRatio = 0;
      deviationStatus = "normal";
    } else if (s === 0 && u > 0) {
      deviationRatio = 1;
      deviationStatus = "MAXIMUM";
    } else if (!Number.isFinite(s) || s < 0) {
      deviationRatio = u > 0 ? 1 : 0;
      deviationStatus = u > 0 ? "MAXIMUM" : "normal";
    } else {
      deviationRatio = Math.abs(u - s) / s;
      deviationStatus = "CALCULATED";
    }

    let governanceLevel;
    if (deviationRatio === 0) governanceLevel = "normal";
    else if (deviationRatio <= 0.1) governanceLevel = "normal";
    else if (deviationRatio <= rules.justificationThreshold) governanceLevel = "warning";
    else if (deviationRatio <= rules.approvalThreshold) governanceLevel = "justification";
    else governanceLevel = "approval";

    // Critical risk always requires approval for any override
    const forceApprovalForCritical = riskLevel === "Critical" && deviationRatio > 0.1;

    return {
      deviationRatio: Number.isFinite(deviationRatio) ? Number(deviationRatio.toFixed(3)) : 1,
      deviationStatus,
      governanceLevel: forceApprovalForCritical ? "approval" : governanceLevel,
      requiresJustification: (deviationRatio > rules.justificationThreshold || forceApprovalForCritical) && rules.requireJustification,
      requiresApproval: (deviationRatio > rules.approvalThreshold || forceApprovalForCritical) && rules.requireApproval,
      minJustificationLength: rules.minJustificationLength,
      forceApprovalForCritical,
    };
  }
}

// ============================================
// VALIDATION ENGINE
// ============================================

export class ValidationEngine {
  constructor(parameter) {
    this.paramEngine = new ParameterEngine(parameter);
  }

  validateRiskInput(input) {
    const errors = [];

    if (!input.likelihood || input.likelihood < 1 || input.likelihood > 5) {
      errors.push("Likelihood must be between 1 and 5");
    }

    const criteria = this.paramEngine.getCriteria();
    for (const criterion of criteria) {
      const score = input.criteriaScores?.[criterion.name];
      if (score == null || score < 1 || score > 5) {
        errors.push(`Score for ${criterion.name} must be between 1 and 5`);
      }
    }

    return errors;
  }

  validateControlMapping(riskControls) {
    const errors = [];

    if (!riskControls?.length) return errors;

    const totalWeight = riskControls.reduce(
      (sum, rc) => sum + (Number(rc.weight) || 0),
      0
    );

    if (Math.abs(totalWeight - 1) > 0.01) {
      errors.push(`Control weights must sum to 1 (current: ${totalWeight.toFixed(2)})`);
    }

    for (const rc of riskControls) {
      if (!rc.controlId) errors.push("Control ID is required");
      if (rc.effectiveness == null || rc.effectiveness < 0 || rc.effectiveness > 100) {
        errors.push(`Effectiveness for ${rc.controlName || "control"} must be 0-100`);
      }
    }

    return errors;
  }
}

// ============================================
// CALCULATION SNAPSHOT ENGINE
// ============================================

export class SnapshotEngine {
  constructor(parameter) {
    this.paramEngine = new ParameterEngine(parameter);
  }

  createSnapshot(input) {
    const {
      riskId,
      parameterId,
      criteriaScores,
      likelihood,
      impact,
      impactDetail,
      inherentScore,
      inherentCalcDetail,
      riskControls,
      controlReduction,
      residualScore,
      residualCalcDetail,
      riskLevel,
      appetiteStatus,
      calculatedBy,
    } = input;

    return {
      _id: `snap-${Date.now()}`,
      riskId,
      parameterId,
      parameterVersion: this.paramEngine.param?.methodVersion || 1,

      // Inputs
      criteriaValues: criteriaScores,
      criteriaWeights: this.paramEngine.getCriteria().map((c) => ({
        name: c.name,
        weight: c.weight,
      })),
      likelihood,

      // Impact
      impact,
      impactMethod: impactDetail?.method,
      impactContributions: impactDetail?.contributions,

      // Inherent
      inherentScore,
      inherentCalcDetail,

      // Controls
      controls: riskControls?.map((rc) => ({
        controlId: rc.controlId,
        controlName: rc.controlName,
        effectiveness: rc.effectiveness,
        relevance: rc.relevance,
        weight: rc.weight,
        contribution: rc.contribution,
      })),

      // Reduction
      rawReduction: controlReduction?.rawReduction,
      effectiveReduction: controlReduction?.effectiveReduction,
      capApplied: controlReduction?.capApplied,
      maxReduction: controlReduction?.maxReduction,

      // Residual
      residualScore,
      residualCalcDetail,
      minResidual: this.paramEngine.getResidualRules().minResidual,

      // Level
      riskLevel,
      thresholds: this.paramEngine.getThresholds(),

      // Appetite
      appetiteLimit: this.paramEngine.getAppetiteConfig().appetiteLimit,
      toleranceLimit: this.paramEngine.getAppetiteConfig().toleranceLimit,
      appetiteStatus: appetiteStatus?.status,

      // Metadata
      calculatedAt: new Date().toISOString(),
      calculatedBy,
    };
  }
}

// ============================================
// MASTER RISK ENGINE - Orchestrator
// ============================================

export class RiskEngine {
  constructor(parameter) {
    this.parameter = parameter;
    this.paramEngine = new ParameterEngine(parameter);
    this.impactEngine = new ImpactEngine(parameter);
    this.inherentEngine = new InherentRiskEngine(parameter);
    this.ceEngine = new ControlEffectivenessEngine(parameter);
    this.reductionEngine = new ControlReductionEngine(parameter);
    this.residualEngine = new ResidualRiskEngine(parameter);
    this.appetiteEngine = new AppetiteEngine(parameter);
    this.levelEngine = new RiskLevelEngine(parameter);
    this.governanceEngine = new GovernanceEngine(parameter);
    this.validationEngine = new ValidationEngine(parameter);
    this.snapshotEngine = new SnapshotEngine(parameter);
  }

  /**
   * Full risk calculation pipeline
   */
  calculate(input) {
    const { criteriaScores, likelihood, riskControls, riskId, calculatedBy } = input;

    // 1. Validate
    const validationErrors = this.validationEngine.validateRiskInput({
      likelihood,
      criteriaScores,
    });
    if (validationErrors.length > 0) {
      return { success: false, errors: validationErrors };
    }

    // 2. Calculate Impact
    const impactResult = this.impactEngine.calculate(criteriaScores);

    // 3. Calculate Inherent Risk
    const inherentResult = this.inherentEngine.calculate(criteriaScores, likelihood);

    // 4. Calculate Control Effectiveness for each control
    const controlsWithEffectiveness = (riskControls || []).map((rc) => ({
      ...rc,
      effectiveness: rc.effectiveness || this.ceEngine.getLibraryEffectiveness(rc.control),
    }));

    // 5. Calculate Control Reduction (with axis support)
    const reductionResult = this.reductionEngine.calculate(
      controlsWithEffectiveness,
      inherentResult.likelihood,
      inherentResult.impact
    );

    // 6. Calculate Residual Risk (method based on parameter config)
    const residualResult = this.residualEngine.calculate(
      inherentResult.inherentScore,
      reductionResult.effectiveReduction,
      inherentResult.likelihood,
      inherentResult.impact,
      reductionResult
    );

    // 7. Determine Risk Level
    const inherentLevel = this.levelEngine.getLevel(inherentResult.inherentScore);
    const residualLevel = this.levelEngine.getLevel(residualResult.residualScore);

    // 8. Evaluate Appetite
    const appetiteResult = this.appetiteEngine.evaluate(residualResult.residualScore);

    // 9. Create Calculation Trace
    const calculationTrace = {
      likelihood: inherentResult.likelihood,
      impact: inherentResult.impact,
      rawImpactValue: impactResult.rawValue,
      impactMethod: impactResult.method,
      impactCalcDetail: this.formatImpactDetail(impactResult),
      riskScoreMethod: inherentResult.scoringMethod,
      inherentCalcDetail: inherentResult.calculationDetail,
      ceDetails: controlsWithEffectiveness.map((c) => 
        `${c.controlName}: ${c.effectiveness}% (role: ${c.role || 'both'})`
      ),
      rawCE: Number((reductionResult.rawReduction * 100).toFixed(1)),
      effectiveCE: Number((reductionResult.effectiveReduction * 100).toFixed(1)),
      capApplied: reductionResult.capApplied,
      residualMethod: this.paramEngine.getResidualRules().method,
      residualCalcDetail: residualResult.reductionApplied,
      minResidualScore: residualResult.minResidual,
      likelihoodReduction: reductionResult.likelihoodReduction,
      impactReduction: reductionResult.impactReduction,
      residualLikelihood: reductionResult.residualLikelihood,
      residualImpact: reductionResult.residualImpact,
      thresholds: this.paramEngine.getThresholds(),
      appetiteLimit: this.paramEngine.getAppetiteConfig().appetiteLimit,
      toleranceLimit: this.paramEngine.getAppetiteConfig().toleranceLimit,
    };

    // 10. Create Snapshot
    const snapshot = this.snapshotEngine.createSnapshot({
      riskId,
      parameterId: this.parameter?._id,
      criteriaScores,
      likelihood,
      impact: inherentResult.impact,
      impactDetail: impactResult,
      inherentScore: inherentResult.inherentScore,
      inherentCalcDetail: inherentResult.calculationDetail,
      riskControls: controlsWithEffectiveness,
      controlReduction: reductionResult,
      residualScore: residualResult.residualScore,
      residualCalcDetail: `${inherentResult.inherentScore} × (1 - ${reductionResult.effectiveReduction}) = ${residualResult.residualScore}`,
      riskLevel: residualLevel,
      appetiteStatus: appetiteResult,
      calculatedBy,
    });

    return {
      success: true,
      result: {
        impact: inherentResult.impact,
        rawImpactValue: impactResult.rawValue,
        inherentScore: inherentResult.inherentScore,
        inherentLevel,
        combinedCE: reductionResult.effectiveReduction,
        effectiveCE: reductionResult.effectiveReduction,
        rawCE: reductionResult.rawReduction,
        maximumRiskReduction: reductionResult.maxReduction,
        residualScore: residualResult.residualScore,
        residualLevel,
        appetiteStatus: appetiteResult.status,
        calculationTrace,
        snapshot,
        reductionDetail: {
          rawLikelihoodReduction: reductionResult.rawLikelihoodReduction,
          rawImpactReduction: reductionResult.rawImpactReduction,
          likelihoodReduction: reductionResult.likelihoodReduction,
          impactReduction: reductionResult.impactReduction,
          residualLikelihood: reductionResult.residualLikelihood,
          residualImpact: reductionResult.residualImpact,
          relationshipAdjustment: reductionResult.relationshipAdjustment,
        },
      },
    };
  }

  formatImpactDetail(impactResult) {
    if (impactResult.method === "weighted") {
      return `Σ(value × weight) = ${impactResult.rawValue.toFixed(3)} → rounded to ${impactResult.impact}`;
    }
    if (impactResult.method === "max") {
      return `max(${impactResult.contributions.map((c) => c.score).join(", ")}) = ${impactResult.impact}`;
    }
    return `${impactResult.method} = ${impactResult.impact}`;
  }
}

// ============================================
// EXPORT ALL
// ============================================

export default {
  ParameterEngine,
  ImpactEngine,
  InherentRiskEngine,
  ControlEffectivenessEngine,
  ControlReductionEngine,
  ResidualRiskEngine,
  AppetiteEngine,
  RiskLevelEngine,
  GovernanceEngine,
  ValidationEngine,
  SnapshotEngine,
  RiskEngine,
  RISK_CONSTANTS,
};
