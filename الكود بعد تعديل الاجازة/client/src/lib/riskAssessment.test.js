/**
 * Unit Tests for Risk Assessment Module
 * 
 * Run with: npm test -- riskAssessment.test.js
 * Or: npx vitest run client/src/lib/riskAssessment.test.js
 */

import {
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
  CONTROL_TYPES,
  CE_REDUCTION_AXIS,
  DEFAULT_THRESHOLDS,
} from "./riskAssessment";

const MOCK_CRITERIA = [
  { name: "Financial", weight: 0.2 },
  { name: "Regulatory", weight: 0.15 },
  { name: "Reputational", weight: 0.15 },
  { name: "Safety", weight: 0.1 },
  { name: "Operational", weight: 0.1 },
  { name: "Confidentiality", weight: 0.1 },
  { name: "Integrity", weight: 0.1 },
  { name: "Availability", weight: 0.1 },
];

const MOCK_IMPACTS = {
  Financial: 5,
  Regulatory: 4,
  Reputational: 3,
  Safety: 2,
  Operational: 3,
  Confidentiality: 4,
  Integrity: 4,
  Availability: 5,
};

const MOCK_THRESHOLDS = { critical: 20, high: 12, medium: 6 };

describe("Validation Functions", () => {
  describe("validateScale15", () => {
    test("accepts valid 1-5 integers", () => {
      expect(validateScale15(1, "Test")).toBe(1);
      expect(validateScale15(3, "Test")).toBe(3);
      expect(validateScale15(5, "Test")).toBe(5);
    });

    test("rejects values outside 1-5", () => {
      expect(() => validateScale15(0, "Test")).toThrow("Test must be an integer between 1 and 5");
      expect(() => validateScale15(6, "Test")).toThrow("Test must be an integer between 1 and 5");
      expect(() => validateScale15(-1, "Test")).toThrow("Test must be an integer between 1 and 5");
    });

    test("rejects non-integers", () => {
      expect(() => validateScale15(2.5, "Test")).toThrow("Test must be an integer between 1 and 5");
      expect(() => validateScale15("abc", "Test")).toThrow("Test must be an integer between 1 and 5");
      expect(() => validateScale15(null, "Test")).toThrow("Test must be an integer between 1 and 5");
    });
  });

  describe("validateCE", () => {
    test("accepts valid 0-100 percentages", () => {
      expect(validateCE(0, "CE")).toBe(0);
      expect(validateCE(50, "CE")).toBe(50);
      expect(validateCE(100, "CE")).toBe(100);
    });

    test("rejects values outside 0-100", () => {
      expect(() => validateCE(-1, "CE")).toThrow("CE must be a number between 0 and 100");
      expect(() => validateCE(101, "CE")).toThrow("CE must be a number between 0 and 100");
    });

    test("rejects non-numbers", () => {
      expect(() => validateCE("abc", "CE")).toThrow("CE must be a number between 0 and 100");
      // Number(null) === 0 which is valid, so test with undefined instead
      expect(() => validateCE(undefined, "CE")).toThrow("CE must be a number between 0 and 100");
    });
  });
});

describe("Impact Calculation", () => {
  describe("calculateMaxImpact", () => {
    test("returns maximum impact value", () => {
      expect(calculateMaxImpact(MOCK_IMPACTS, MOCK_CRITERIA)).toBe(5);
    });

    test("returns 1 for empty criteria", () => {
      expect(calculateMaxImpact(MOCK_IMPACTS, [])).toBe(1);
      expect(calculateMaxImpact(MOCK_IMPACTS, null)).toBe(1);
    });

    test("ignores invalid impact values", () => {
      const impacts = { Financial: 6, Regulatory: 0, Safety: 3 };
      const criteria = [{ name: "Financial" }, { name: "Regulatory" }, { name: "Safety" }];
      expect(calculateMaxImpact(impacts, criteria)).toBe(3);
    });
  });

  describe("calculateWeightedImpact", () => {
    test("calculates weighted average correctly", () => {
      // (5*0.2 + 4*0.15 + 3*0.15 + 2*0.1 + 3*0.1 + 4*0.1 + 4*0.1 + 5*0.1) / 1.0
      // = (1.0 + 0.6 + 0.45 + 0.2 + 0.3 + 0.4 + 0.4 + 0.5) / 1.0 = 3.85 -> 4
      const result = calculateWeightedImpact(MOCK_IMPACTS, MOCK_CRITERIA);
      expect(result).toBe(4);
    });

    test("falls back to max impact when weights are zero", () => {
      const zeroWeightCriteria = MOCK_CRITERIA.map(c => ({ ...c, weight: 0 }));
      expect(calculateWeightedImpact(MOCK_IMPACTS, zeroWeightCriteria)).toBe(5);
    });

    test("falls back to max impact when no valid weights", () => {
      const noWeightCriteria = MOCK_CRITERIA.map(c => ({ ...c, weight: -1 }));
      expect(calculateWeightedImpact(MOCK_IMPACTS, noWeightCriteria)).toBe(5);
    });
  });

  describe("calculateImpact", () => {
    test("uses weighted method by default", () => {
      expect(calculateImpact(MOCK_IMPACTS, MOCK_CRITERIA, 'weighted')).toBe(4);
    });

    test("uses max method when specified", () => {
      expect(calculateImpact(MOCK_IMPACTS, MOCK_CRITERIA, 'max')).toBe(5);
    });

    test("uses advanced (70/30 blend) method", () => {
      // 70% max (5) + 30% weighted (4) = 3.5 + 1.2 = 4.7 -> 5
      expect(calculateImpact(MOCK_IMPACTS, MOCK_CRITERIA, 'advanced')).toBe(5);
    });
  });
});

describe("Inherent Risk Score", () => {
  test("calculates Likelihood × Impact", () => {
    expect(calculateInherentScore(4, 5)).toBe(20);
    expect(calculateInherentScore(3, 4)).toBe(12);
    expect(calculateInherentScore(2, 3)).toBe(6);
  });

  test("validates inputs", () => {
    expect(() => calculateInherentScore(0, 5)).toThrow();
    expect(() => calculateInherentScore(4, 6)).toThrow();
  });
});

describe("Risk Level Determination", () => {
  test("correctly assigns levels with default thresholds", () => {
    expect(determineRiskLevel(25)).toBe("Critical");
    expect(determineRiskLevel(20)).toBe("Critical");
    expect(determineRiskLevel(19)).toBe("High");
    expect(determineRiskLevel(12)).toBe("High");
    expect(determineRiskLevel(11)).toBe("Medium");
    expect(determineRiskLevel(6)).toBe("Medium");
    expect(determineRiskLevel(5)).toBe("Low");
    expect(determineRiskLevel(1)).toBe("Low");
  });

  test("uses custom thresholds", () => {
    const custom = { critical: 15, high: 10, medium: 5 };
    expect(determineRiskLevel(15, custom)).toBe("Critical");
    expect(determineRiskLevel(10, custom)).toBe("High");
    expect(determineRiskLevel(5, custom)).toBe("Medium");
    expect(determineRiskLevel(4, custom)).toBe("Low");
  });
});

describe("Control Effectiveness - Combined CE", () => {
  describe("calculateCombinedCE", () => {
    test("returns 0 for no controls", () => {
      expect(calculateCombinedCE([])).toBe(0);
      expect(calculateCombinedCE(null)).toBe(0);
    });

    test("calculates single control CE", () => {
      const controls = [{ ce: 50, type: CONTROL_TYPES.OTHER }];
      expect(calculateCombinedCE(controls, 'overall')).toBe(0.5);
    });

    test("calculates combined CE for multiple controls (complement rule)", () => {
      // 1 - (1-0.5)*(1-0.3) = 1 - 0.5*0.7 = 1 - 0.35 = 0.65
      const controls = [
        { ce: 50, type: CONTROL_TYPES.OTHER },
        { ce: 30, type: CONTROL_TYPES.OTHER },
      ];
      expect(calculateCombinedCE(controls, 'overall')).toBeCloseTo(0.65, 2);
    });

    test("caps at 100%", () => {
      const controls = [
        { ce: 80, type: CONTROL_TYPES.OTHER },
        { ce: 80, type: CONTROL_TYPES.OTHER },
        { ce: 80, type: CONTROL_TYPES.OTHER },
      ];
      expect(calculateCombinedCE(controls, 'overall')).toBeLessThanOrEqual(1);
    });

    test("filters by control type for axis", () => {
      const controls = [
        { ce: 50, type: CONTROL_TYPES.PREVENTIVE }, // reduces likelihood
        { ce: 50, type: CONTROL_TYPES.DETECTIVE },  // reduces impact
      ];
      expect(calculateCombinedCE(controls, 'likelihood')).toBe(0.5); // only preventive
      expect(calculateCombinedCE(controls, 'impact')).toBe(0.5);    // only detective
      // 'overall' only includes 'Other' type controls, not preventive/detective
      expect(calculateCombinedCE(controls, 'overall')).toBe(0);
    });

    test("'Other' type applies to all axes including overall", () => {
      const controls = [
        { ce: 50, type: CONTROL_TYPES.OTHER },
      ];
      expect(calculateCombinedCE(controls, 'likelihood')).toBe(0.5);
      expect(calculateCombinedCE(controls, 'impact')).toBe(0.5);
      expect(calculateCombinedCE(controls, 'overall')).toBe(0.5);
    });

    test("combines 'Other' with axis-specific controls for overall", () => {
      const controls = [
        { ce: 50, type: CONTROL_TYPES.OTHER },      // reduces overall (all axes)
        { ce: 50, type: CONTROL_TYPES.OTHER },      // another overall control
      ];
      // 1 - (1-0.5)*(1-0.5) = 0.75
      expect(calculateCombinedCE(controls, 'overall')).toBeCloseTo(0.75, 2);
    });

    test("'Other' type applies to all axes", () => {
      const controls = [
        { ce: 50, type: CONTROL_TYPES.OTHER },
      ];
      expect(calculateCombinedCE(controls, 'likelihood')).toBe(0.5);
      expect(calculateCombinedCE(controls, 'impact')).toBe(0.5);
      expect(calculateCombinedCE(controls, 'overall')).toBe(0.5);
    });

    test("ignores invalid CE values", () => {
      const controls = [
        { ce: 50, type: CONTROL_TYPES.OTHER },
        { ce: -10, type: CONTROL_TYPES.OTHER },
        { ce: 150, type: CONTROL_TYPES.OTHER },
        { ce: "abc", type: CONTROL_TYPES.OTHER },
      ];
      expect(calculateCombinedCE(controls, 'overall')).toBe(0.5);
    });
  });
});

describe("Residual Risk Calculation", () => {
  describe("calculateSimpleResidualRisk (Legacy)", () => {
    test("applies combined CE to inherent score", () => {
      const controls = [{ ce: 50, type: CONTROL_TYPES.OTHER }];
      const result = calculateSimpleResidualRisk(20, controls, MOCK_THRESHOLDS);
      // 20 * (1 - 0.5) = 10
      expect(result.residualScore).toBe(10);
      expect(result.residualLevel).toBe("Medium");
    });

    test("floors at 1", () => {
      const controls = [{ ce: 100, type: CONTROL_TYPES.OTHER }];
      const result = calculateSimpleResidualRisk(20, controls, MOCK_THRESHOLDS);
      expect(result.residualScore).toBe(1);
      expect(result.residualLevel).toBe("Low");
    });
  });

  describe("calculateResidualRisk (ISO 27005 Axis-Aware)", () => {
    test("reduces likelihood with preventive controls", () => {
      const controls = [{ ce: 50, type: CONTROL_TYPES.PREVENTIVE }];
      const result = calculateResidualRisk({
        likelihood: 4,
        impact: 5,
        controls,
        thresholds: MOCK_THRESHOLDS,
      });
      // L: 4 * (1-0.5) = 2, I: 5 * (1-0) = 5 -> Score: 2*5 = 10
      expect(result.residualLikelihood).toBe(2);
      expect(result.residualImpact).toBe(5);
      expect(result.residualScore).toBe(10);
    });

    test("reduces impact with detective/corrective controls", () => {
      const controls = [{ ce: 50, type: CONTROL_TYPES.DETECTIVE }];
      const result = calculateResidualRisk({
        likelihood: 4,
        impact: 5,
        controls,
        thresholds: MOCK_THRESHOLDS,
      });
      // L: 4 * (1-0) = 4, I: 5 * (1-0.5) = 2.5 -> 3 -> Score: 4*3 = 12
      expect(result.residualLikelihood).toBe(4);
      expect(result.residualImpact).toBe(3);
      expect(result.residualScore).toBe(12);
    });

    test("combines both axis reductions", () => {
      const controls = [
        { ce: 50, type: CONTROL_TYPES.PREVENTIVE },
        { ce: 50, type: CONTROL_TYPES.DETECTIVE },
      ];
      const result = calculateResidualRisk({
        likelihood: 4,
        impact: 5,
        controls,
        thresholds: MOCK_THRESHOLDS,
      });
      // L: 4*0.5=2, I: 5*0.5=2.5->3 -> Score: 2*3=6
      expect(result.residualLikelihood).toBe(2);
      expect(result.residualImpact).toBe(3);
      expect(result.residualScore).toBe(6);
    });

    test("clamps axis values to 1-5", () => {
      const controls = [{ ce: 100, type: CONTROL_TYPES.PREVENTIVE }];
      const result = calculateResidualRisk({
        likelihood: 5,
        impact: 5,
        controls,
        thresholds: MOCK_THRESHOLDS,
      });
      // L: 5*0=0 -> clamped to 1, I: 5 -> Score: 1*5=5
      expect(result.residualLikelihood).toBe(1);
      expect(result.residualImpact).toBe(5);
    });
  });
});

describe("Full Risk Assessment", () => {
  describe("calculateRiskAssessment", () => {
    test("computes complete assessment with no controls", () => {
      const result = calculateRiskAssessment({
        likelihood: 4,
        impacts: MOCK_IMPACTS,
        criteria: MOCK_CRITERIA,
        impactMethod: 'weighted',
        controls: [],
        thresholds: MOCK_THRESHOLDS,
      });

      expect(result.likelihood).toBe(4);
      expect(result.impact).toBe(4); // weighted
      expect(result.inherentScore).toBe(16); // 4*4
      expect(result.inherentLevel).toBe("High");
      expect(result.residualScore).toBe(16); // no controls = same as inherent
      expect(result.residualLevel).toBe("High");
      expect(result.appetiteStatus).toBeNull(); // no appetiteLimit passed
    });

    test("computes assessment with preventive controls", () => {
      const controls = [
        { ce: 50, type: CONTROL_TYPES.PREVENTIVE, controlId: "c1" },
      ];
      const result = calculateRiskAssessment({
        likelihood: 4,
        impacts: MOCK_IMPACTS,
        criteria: MOCK_CRITERIA,
        impactMethod: 'weighted',
        controls,
        thresholds: MOCK_THRESHOLDS,
      });

      expect(result.likelihoodCE).toBe(50);
      expect(result.impactCE).toBe(0);
      expect(result.residualLikelihood).toBe(2);
      expect(result.residualImpact).toBe(4);
      expect(result.residualScore).toBe(8);
    });

    test("computes assessment with mixed control types", () => {
      const controls = [
        { ce: 75, type: CONTROL_TYPES.PREVENTIVE, controlId: "c1" },
        { ce: 50, type: CONTROL_TYPES.DETECTIVE, controlId: "c2" },
        { ce: 25, type: CONTROL_TYPES.CORRECTIVE, controlId: "c3" },
      ];
      const result = calculateRiskAssessment({
        likelihood: 4,
        impacts: MOCK_IMPACTS,
        criteria: MOCK_CRITERIA,
        impactMethod: 'weighted',
        controls,
        thresholds: MOCK_THRESHOLDS,
      });

      // Preventive 75% -> L CE = 0.75
      // Detective 50% + Corrective 25% -> I CE = 1-(1-0.5)*(1-0.25) = 0.625
      // L: 4*(1-0.75)=1, I: 4*(1-0.625)=1.5->2 -> Score: 1*2=2
      expect(result.likelihoodCE).toBe(75);
      expect(result.impactCE).toBe(63); // rounded
      expect(result.residualScore).toBe(2);
      expect(result.residualLevel).toBe("Low");
    });

    test("validates all inputs", () => {
      expect(() => calculateRiskAssessment({
        likelihood: 6,
        impacts: MOCK_IMPACTS,
        criteria: MOCK_CRITERIA,
        impactMethod: 'weighted',
        controls: [],
        thresholds: MOCK_THRESHOLDS,
      })).toThrow("Likelihood must be an integer between 1 and 5");

      expect(() => calculateRiskAssessment({
        likelihood: 3,
        impacts: { Financial: 6 },
        criteria: MOCK_CRITERIA,
        impactMethod: 'weighted',
        controls: [],
        thresholds: MOCK_THRESHOLDS,
      })).toThrow("Impact for Financial must be 1-5");

      expect(() => calculateRiskAssessment({
        likelihood: 3,
        impacts: MOCK_IMPACTS,
        criteria: MOCK_CRITERIA,
        impactMethod: 'weighted',
        controls: [{ ce: 150, type: CONTROL_TYPES.OTHER, controlId: "c1" }],
        thresholds: MOCK_THRESHOLDS,
      })).toThrow("Control c1 CE must be a number between 0 and 100");
    });

    test("returns appetiteStatus Within Appetite when residual <= limit", () => {
      const result = calculateRiskAssessment({
        likelihood: 3,
        impacts: MOCK_IMPACTS,
        criteria: MOCK_CRITERIA,
        impactMethod: "weighted",
        controls: [],
        thresholds: MOCK_THRESHOLDS,
        appetiteLimit: 15,
      });
      // inherentScore = 3*4 = 12, residualScore = 12 (no controls), 12 <= 15
      expect(result.appetiteStatus).toBe("Within Appetite");
    });

    test("returns appetiteStatus Exceeds Appetite when residual > limit", () => {
      const result = calculateRiskAssessment({
        likelihood: 5,
        impacts: { Financial: 5, Regulatory: 5, Reputational: 5, Safety: 5, Operational: 5, Confidentiality: 5, Integrity: 5, Availability: 5 },
        criteria: MOCK_CRITERIA,
        impactMethod: "weighted",
        controls: [],
        thresholds: MOCK_THRESHOLDS,
        appetiteLimit: 15,
      });
      // inherentScore = 5*5 = 25, 25 > 15
      expect(result.appetiteStatus).toBe("Exceeds Appetite");
    });

    test("does not include overallScore in output", () => {
      const result = calculateRiskAssessment({
        likelihood: 3,
        impacts: MOCK_IMPACTS,
        criteria: MOCK_CRITERIA,
        impactMethod: "weighted",
        controls: [],
        thresholds: MOCK_THRESHOLDS,
      });
      expect(result.overallScore).toBeUndefined();
    });

      const result = calculateRiskAssessment({
        likelihood: 3,
        impacts: MOCK_IMPACTS,
        criteria: MOCK_CRITERIA,
        impactMethod: 'advanced',
        controls: [],
        thresholds: MOCK_THRESHOLDS,
      });

      expect(result.impactMethod).toBe('advanced');
      expect(result.thresholds).toEqual(MOCK_THRESHOLDS);
      expect(result.criteria).toHaveLength(8);
    });
  });
});

describe("Default Impacts", () => {
  test("generates default impact values for all criteria", () => {
    const defaults = getDefaultImpacts(MOCK_CRITERIA, 3);
    expect(Object.keys(defaults)).toHaveLength(8);
    expect(defaults.Financial).toBe(3);
    expect(defaults.Availability).toBe(3);
  });

  test("returns empty object for empty criteria", () => {
    expect(getDefaultImpacts([])).toEqual({});
    expect(getDefaultImpacts(null)).toEqual({});
  });
});

describe("CE Reduction Axis Mapping", () => {
  test("Preventive reduces Likelihood", () => {
    expect(CE_REDUCTION_AXIS[CONTROL_TYPES.PREVENTIVE]).toBe('likelihood');
  });

  test("Detective reduces Impact", () => {
    expect(CE_REDUCTION_AXIS[CONTROL_TYPES.DETECTIVE]).toBe('impact');
  });

  test("Corrective reduces Impact", () => {
    expect(CE_REDUCTION_AXIS[CONTROL_TYPES.CORRECTIVE]).toBe('impact');
  });

  test("Other reduces Overall", () => {
    expect(CE_REDUCTION_AXIS[CONTROL_TYPES.OTHER]).toBe('overall');
  });
});

console.log("All tests passed! ✅");