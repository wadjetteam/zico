import { Router } from "express";
import { prisma } from "../index";
export const dashboardRouter = Router();
dashboardRouter.get("/", async (req, res, next) => {
    try {
        const [totalPlans, totalAudits, auditsByStatus, overdueAudits, openFindings, criticalFindings, pendingEvidence, openCorrectiveActions, findingsBySeverity, inProgressAudits,] = await Promise.all([
            prisma.auditPlan.count(),
            prisma.audit.count(),
            prisma.audit.groupBy({ by: ["status"], _count: { _all: true } }),
            prisma.audit.count({ where: { endDate: { lt: new Date() }, status: { notIn: ["Completed", "Cancelled"] } } }),
            prisma.finding.count({ where: { status: { in: ["Open", "Assigned", "InProgress", "PendingVerification"] } } }),
            prisma.finding.count({ where: { severity: "Critical", status: { notIn: ["Closed", "Accepted", "Resolved"] } } }),
            prisma.evidenceRequest.count({ where: { status: { in: ["Requested", "Submitted", "UnderReview"] } } }),
            prisma.correctiveAction.count({ where: { status: { in: ["Open", "Assigned", "InProgress", "Blocked", "PendingVerification"] } } }),
            prisma.finding.groupBy({ by: ["severity"], _count: { _all: true } }),
            prisma.audit.findMany({ where: { status: "InProgress" }, select: { id: true, name: true, _count: { select: { checklistItems: true } } } }),
        ]);
        const checklistStats = await prisma.checklistItem.groupBy({
            by: ["result"],
            _count: { _all: true },
        });
        const correctiveByStatus = await prisma.correctiveAction.groupBy({
            by: ["status"],
            _count: { _all: true },
        });
        res.json({
            kpis: {
                totalPlans,
                totalAudits,
                overdueAudits,
                openFindings,
                criticalFindings,
                pendingEvidence,
                openCorrectiveActions,
            },
            auditsByStatus: auditsByStatus.map((a) => ({ status: a.status, count: a._count._all })),
            findingsBySeverity: findingsBySeverity.map((f) => ({ severity: f.severity, count: f._count._all })),
            checklistStats: checklistStats.map((c) => ({ result: c.result, count: c._count._all })),
            correctiveByStatus: correctiveByStatus.map((c) => ({ status: c.status, count: c._count._all })),
            inProgressAudits: inProgressAudits.map((a) => ({ id: a.id, name: a.name, checklistCount: a._count.checklistItems })),
        });
    }
    catch (err) {
        next(err);
    }
});
