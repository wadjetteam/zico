/**
 * Risk Calculation API Routes
 * Professional GRC Risk Scoring System
 * 
 * Endpoints:
 * POST /api/risks/calculate - Full risk calculation
 * POST /api/risks/preview-score - Quick preview (existing)
 * GET  /api/risks/:id/calculation - Get calculation snapshot
 * POST /api/risks/:id/controls/:controlId/override - Override control weight
 */

import { RiskEngine } from './riskEngine.js';

/**
 * Main risk calculation endpoint
 * POST /api/risks/calculate
 */
export async function calculateRisk(req, res) {
  try {
    const {
      domain,
      criteriaScores,
      likelihood,
      riskControls,
      riskId,
    } = req.body;

    // Get active parameter for domain
    const param = PARAMETERS.find(
      (p) => p.domain?._id === domain && p.status === "active"
    );

    if (!param) {
      return res.status(400).json({ message: "No active parameter found for this domain" });
    }

    // Create engine and calculate
    const engine = new RiskEngine(param);
    const result = engine.calculate({
      criteriaScores,
      likelihood,
      riskControls: riskControls || [],
      riskId,
      calculatedBy: req.user?.username || "system",
    });

    if (!result.success) {
      return res.status(422).json({ message: "Validation failed", errors: result.errors });
    }

    return res.status(200).json(result.result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * Quick preview score (lightweight)
 * POST /api/risks/preview-score
 */
export async function previewScore(req, res) {
  try {
    const { domain, criteriaScores, likelihood, riskControls } = req.body;

    const param = PARAMETERS.find(
      (p) => p.domain?._id === domain && p.status === "active"
    );

    if (!param) {
      return res.status(400).json({ message: "No active parameter found" });
    }

    const engine = new RiskEngine(param);
    const result = engine.calculate({
      criteriaScores,
      likelihood,
      riskControls: riskControls || [],
      calculatedBy: req.user?.username || "system",
    });

    if (!result.success) {
      return res.status(422).json({ message: "Validation failed", errors: result.errors });
    }

    return res.status(200).json(result.result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * Get calculation snapshot for a risk
 * GET /api/risks/:id/calculation
 */
export async function getCalculationSnapshot(req, res) {
  try {
    const { id } = req.params;
    const risk = RISKS.find((r) => r._id === id);

    if (!risk) {
      return res.status(404).json({ message: "Risk not found" });
    }

    // Find latest snapshot
    const snapshots = RISK_CALCULATIONS.filter((s) => s.riskId === id);
    const latestSnapshot = snapshots.sort(
      (a, b) => new Date(b.calculatedAt) - new Date(a.calculatedAt)
    )[0];

    if (!latestSnapshot) {
      return res.status(404).json({ message: "No calculation found" });
    }

    return res.status(200).json(latestSnapshot);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * Override control weight with governance
 * POST /api/risks/:id/controls/:controlId/override
 */
export async function overrideControlWeight(req, res) {
  try {
    const { id: riskId, controlId } = req.params;
    const { weight, justification } = req.body;

    const risk = RISKS.find((r) => r._id === riskId);
    if (!risk) {
      return res.status(404).json({ message: "Risk not found" });
    }

    const link = LINKS.find(
      (l) => l.risk_id === riskId && l.control_id === controlId
    );
    if (!link) {
      return res.status(404).json({ message: "Control link not found" });
    }

    // Get parameter for governance rules
    const param = PARAMETERS.find(
      (p) => p.domain?._id === risk.domain?._id && p.status === "active"
    );

    if (!param) {
      return res.status(400).json({ message: "No active parameter" });
    }

    // Check governance
    const governanceEngine = new GovernanceEngine(param);
    const overrideCheck = governanceEngine.evaluateOverride(weight, link.suggestedWeight || 0);

    if (overrideCheck.requiresJustification && !justification) {
      return res.status(422).json({
        message: "Justification required for this override",
        governance: overrideCheck,
      });
    }

    if (overrideCheck.requiresApproval) {
      // In real system, create approval workflow
      link.pendingApproval = true;
      link.approvalStatus = "pending";
    }

    link.weight = weight;
    link.justification = justification;
    link.overriddenAt = new Date().toISOString();
    link.overriddenBy = req.user?.username || "system";

    return res.status(200).json({
      message: "Control weight updated",
      link,
      governance: overrideCheck,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * Get parameter configuration
 * GET /api/parameters/:id
 */
export async function getParameter(req, res) {
  try {
    const { id } = req.params;
    const param = PARAMETERS.find((p) => p._id === id);

    if (!param) {
      return res.status(404).json({ message: "Parameter not found" });
    }

    return res.status(200).json(param);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * Get active parameter for domain
 * GET /api/parameters/domain/:domainId
 */
export async function getParameterByDomain(req, res) {
  try {
    const { domainId } = req.params;
    const param = PARAMETERS.find(
      (p) => p.domain?._id === domainId && p.status === "active"
    );

    if (!param) {
      return res.status(404).json({ message: "No active parameter for this domain" });
    }

    return res.status(200).json(param);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * Create new parameter version
 * POST /api/parameters
 */
export async function createParameter(req, res) {
  try {
    const paramData = req.body;

    const newParam = {
      _id: `p-${Date.now()}`,
      ...paramData,
      status: "draft",
      methodVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user?.username || "system",
    };

    PARAMETERS.push(newParam);

    return res.status(201).json(newParam);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * Publish parameter
 * POST /api/parameters/:id/publish
 */
export async function publishParameter(req, res) {
  try {
    const { id } = req.params;
    const param = PARAMETERS.find((p) => p._id === id);

    if (!param) {
      return res.status(404).json({ message: "Parameter not found" });
    }

    // Deactivate old version
    PARAMETERS.filter(
      (p) => p.domain?._id === param.domain?._id && p._id !== id
    ).forEach((p) => (p.status = "inactive"));

    param.status = "active";
    param.publishedAt = new Date().toISOString();
    param.updatedAt = new Date().toISOString();

    return res.status(200).json(param);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Import data references (will be replaced with actual imports)
let PARAMETERS = [];
let RISKS = [];
let LINKS = [];
let RISK_CALCULATIONS = [];

export function setDataReferences(data) {
  PARAMETERS = data.parameters;
  RISKS = data.risks;
  LINKS = data.links;
  RISK_CALCULATIONS = data.riskCalculations || [];
}

export default {
  calculateRisk,
  previewScore,
  getCalculationSnapshot,
  overrideControlWeight,
  getParameter,
  getParameterByDomain,
  createParameter,
  publishParameter,
  setDataReferences,
};
