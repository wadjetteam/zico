import { Router } from "express";
import { prisma } from "../index";
import { authenticate } from "../middleware/auth";
import { complianceScore, complianceScoreByFramework, isOverdue, evidenceEffectiveStatus } from "../services/complianceService";

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

dashboardRouter.get("/", async (req, res, next) => {
  try {
    const [frameworks, requirements, assessments, evidence, gaps, remediation] = await Promise.all([
      prisma.framework.findMany(),
      prisma.requirement.findMany(),
      prisma.assessment.findMany(),
      prisma.evidence.findMany(),
      prisma.gap.findMany(),
      prisma.remediation.findMany(),
    ]);

    const overallScore = complianceScore(requirements);
    const compliantCount = requirements.filter((r) => r.status === "Compliant").length;
    const partialCount = requirements.filter((r) => r.status === "PartiallyCompliant").length;
    const nonCompliantCount = requirements.filter((r) => r.status === "NonCompliant").length;
    const openGaps = gaps.filter((g) => !["Resolved", "Closed"].includes(g.status)).length;

    const missingEvidence = evidence.filter((e) => {
      const eff = evidenceEffectiveStatus(e);
      return ["Missing", "Requested", "Expired", "Rejected"].includes(eff);
    }).length;

    const overdueRemediation = remediation.filter((r) => isOverdue(r.dueDate, r.status, ["Completed", "Cancelled"])).length;

    const byFramework = complianceScoreByFramework(frameworks, requirements);
    const statusDistribution = [
      { label: "Compliant", value: compliantCount, color: "#3fbf6a" },
      { label: "Partially Compliant", value: partialCount, color: "#e0b23d" },
      { label: "Non-Compliant", value: nonCompliantCount, color: "#e2584f" },
      { label: "Not Applicable", value: requirements.filter((r) => r.status === "NotApplicable").length, color: "#7d7d86" },
      { label: "Not Assessed", value: requirements.filter((r) => r.status === "NotAssessed").length, color: "#7c8ff0" },
    ].filter((s) => s.value > 0);

    const gapsBySeverity = ["Critical", "High", "Medium", "Low"].map((sev) => ({
      label: sev,
      value: gaps.filter((g) => g.severity === sev).length,
    }));

    const remediationProgress = remediation.map((r) => ({
      label: r.code,
      value: r.progress,
    }));

    res.json({
      kpis: { overallScore, compliantCount, partialCount, nonCompliantCount, openGaps, missingEvidence, overdueRemediation },
      byFramework,
      statusDistribution,
      gapsBySeverity,
      remediationProgress,
    });
  } catch (err) {
    next(err);
  }
});
