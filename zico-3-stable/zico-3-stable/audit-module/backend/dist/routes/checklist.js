import { Router } from "express";
import { prisma } from "../index";
import { badRequest, notFound } from "../middleware/errorHandler";
export const checklistRouter = Router();
checklistRouter.get("/", async (req, res, next) => {
    try {
        const { auditId, result, page = "1", pageSize = "20" } = req.query;
        const where = {};
        if (auditId && auditId !== "All")
            where.auditId = auditId;
        if (result && result !== "All")
            where.result = result;
        const total = await prisma.checklistItem.count({ where });
        const items = await prisma.checklistItem.findMany({ where, skip: (Number(page) - 1) * Number(pageSize), take: Number(pageSize), orderBy: { createdAt: "desc" } });
        res.json({ items, total, page: Number(page), pageSize: Number(pageSize) });
    }
    catch (err) {
        next(err);
    }
});
checklistRouter.get("/:id", async (req, res, next) => {
    try {
        const item = await prisma.checklistItem.findUnique({ where: { id: req.params.id } });
        if (!item)
            throw notFound("Checklist item not found");
        res.json(item);
    }
    catch (err) {
        next(err);
    }
});
checklistRouter.post("/", async (req, res, next) => {
    try {
        const { auditId, requirementId, controlId, testObjective, testProcedure, auditor } = req.body;
        if (!auditId)
            throw badRequest("auditId is required");
        const audit = await prisma.audit.findUnique({ where: { id: auditId } });
        if (!audit)
            throw badRequest("Invalid auditId");
        const item = await prisma.checklistItem.create({ data: { auditId, requirementId, controlId, testObjective: testObjective || "", testProcedure: testProcedure || "", auditor: auditor || "", result: "NotTested" } });
        res.status(201).json(item);
    }
    catch (err) {
        next(err);
    }
});
checklistRouter.put("/:id", async (req, res, next) => {
    try {
        const existing = await prisma.checklistItem.findUnique({ where: { id: req.params.id } });
        if (!existing)
            throw notFound("Checklist item not found");
        const { result, testObjective, testProcedure, auditor, testDate, comment, reviewStatus } = req.body;
        const item = await prisma.checklistItem.update({
            where: { id: req.params.id },
            data: {
                result: result ?? existing.result,
                testObjective: testObjective ?? existing.testObjective,
                testProcedure: testProcedure ?? existing.testProcedure,
                auditor: auditor ?? existing.auditor,
                testDate: testDate ? new Date(testDate) : existing.testDate,
                comment: comment ?? existing.comment,
                reviewStatus: reviewStatus ?? existing.reviewStatus,
            },
        });
        // Log history
        await prisma.auditHistoryEvent.create({ data: { auditId: existing.auditId, user: "system", action: "CHECKLIST_UPDATED", prev: existing.result, next: item.result } });
        res.json(item);
    }
    catch (err) {
        next(err);
    }
});
