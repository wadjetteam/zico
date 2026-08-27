"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const express_1 = require("express");
const index_1 = require("../index");
exports.dashboardRouter = (0, express_1.Router)();
exports.dashboardRouter.get("/", async (req, res, next) => {
    try {
        const [totalPlans, totalAudits, auditsByStatus, overdueAudits, openFindings, criticalFindings, pendingEvidence, openCorrectiveActions, findingsBySeverity, inProgressAudits,] = await Promise.all([
            index_1.prisma.auditPlan.count(),
            index_1.prisma.audit.count(),
            index_1.prisma.audit.groupBy({ by: ["status"], _count: { _all: true } }),
            index_1.prisma.audit.count({ where: { endDate: { lt: new Date() }, status: { notIn: ["Completed", "Cancelled"] } } }),
            index_1.prisma.finding.count({ where: { status: { in: ["Open", "Assigned", "InProgress", "PendingVerification"] } } }),
            index_1.prisma.finding.count({ where: { severity: "Critical", status: { notIn: ["Closed", "Accepted", "Resolved"] } } }),
            index_1.prisma.evidenceRequest.count({ where: { status: { in: ["Requested", "Submitted", "UnderReview"] } } }),
            index_1.prisma.correctiveAction.count({ where: { status: { in: ["Open", "Assigned", "InProgress", "Blocked", "PendingVerification"] } } }),
            index_1.prisma.finding.groupBy({ by: ["severity"], _count: { _all: true } }),
            index_1.prisma.audit.findMany({ where: { status: "InProgress" }, select: { id: true, name: true, _count: { select: { checklistItems: true } } } }),
        ]);
        const checklistStats = await index_1.prisma.checklistItem.groupBy({
            by: ["result"],
            _count: { _all: true },
        });
        const correctiveByStatus = await index_1.prisma.correctiveAction.groupBy({
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
