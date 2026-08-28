"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.correctiveActionsRouter = void 0;
const express_1 = require("express");
const index_1 = require("../index");
const errorHandler_1 = require("../middleware/errorHandler");
exports.correctiveActionsRouter = (0, express_1.Router)();
exports.correctiveActionsRouter.get("/", async (req, res, next) => {
    try {
        const { auditId, findingId, status, page = "1", pageSize = "20" } = req.query;
        const where = {};
        if (auditId && auditId !== "All")
            where.auditId = auditId;
        if (findingId)
            where.findingId = findingId;
        if (status && status !== "All")
            where.status = status;
        const total = await index_1.prisma.correctiveAction.count({ where });
        const items = await index_1.prisma.correctiveAction.findMany({ where, skip: (Number(page) - 1) * Number(pageSize), take: Number(pageSize), orderBy: { createdAt: "desc" } });
        res.json({ items, total, page: Number(page), pageSize: Number(pageSize) });
    }
    catch (err) {
        next(err);
    }
});
exports.correctiveActionsRouter.post("/", async (req, res, next) => {
    try {
        const { findingId, auditId, requirementId, controlId, description, owner, priority, dueDate } = req.body;
        if (!findingId)
            throw (0, errorHandler_1.badRequest)("findingId is required");
        if (!auditId)
            throw (0, errorHandler_1.badRequest)("auditId is required");
        if (!description)
            throw (0, errorHandler_1.badRequest)("Description is required");
        const finding = await index_1.prisma.finding.findUnique({ where: { id: findingId } });
        if (!finding)
            throw (0, errorHandler_1.badRequest)("Invalid findingId");
        const count = await index_1.prisma.correctiveAction.count({ where: { findingId } });
        const action = await index_1.prisma.correctiveAction.create({
            data: {
                actionCode: `CA-${new Date().getFullYear()}-${findingId.slice(-4)}-${String(count + 1).padStart(2, "0")}`,
                findingId,
                auditId,
                requirementId: requirementId || null,
                controlId: controlId || null,
                description,
                owner: owner || "",
                priority: priority || "Medium",
                dueDate: dueDate ? new Date(dueDate) : null,
                status: "Open",
                progress: 0,
            },
        });
        await index_1.prisma.auditHistoryEvent.create({ data: { auditId, user: "system", action: "CORRECTIVE_ACTION_CREATED", next: action.status } });
        res.status(201).json(action);
    }
    catch (err) {
        next(err);
    }
});
exports.correctiveActionsRouter.put("/:id", async (req, res, next) => {
    try {
        const existing = await index_1.prisma.correctiveAction.findUnique({ where: { id: req.params.id } });
        if (!existing)
            throw (0, errorHandler_1.notFound)("Corrective action not found");
        const { status, description, owner, priority, dueDate, progress, verification, reviewerComments } = req.body;
        let newProgress = progress ?? existing.progress;
        let newStatus = status ?? existing.status;
        // Auto-set progress when verified/closed
        if (["Verified", "Closed"].includes(newStatus)) {
            newProgress = 100;
        }
        const action = await index_1.prisma.correctiveAction.update({
            where: { id: req.params.id },
            data: {
                status: newStatus,
                description: description ?? existing.description,
                owner: owner ?? existing.owner,
                priority: priority ?? existing.priority,
                dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
                progress: newProgress,
                verification: verification ?? existing.verification,
                reviewerComments: reviewerComments ?? existing.reviewerComments,
                completionDate: ["Verified", "Closed"].includes(newStatus) ? new Date() : existing.completionDate,
            },
        });
        await index_1.prisma.auditHistoryEvent.create({ data: { auditId: existing.auditId, user: "system", action: "CA_STATUS_CHANGED", prev: existing.status, next: action.status } });
        res.json(action);
    }
    catch (err) {
        next(err);
    }
});
// Auto-transition overdue actions
exports.correctiveActionsRouter.post("/process-overdue", async (req, res, next) => {
    try {
        const now = new Date();
        const overdue = await index_1.prisma.correctiveAction.updateMany({
            where: { dueDate: { lt: now }, status: { notIn: ["Verified", "Closed", "Cancelled", "Overdue"] } },
            data: { status: "Overdue" },
        });
        res.json({ processed: overdue.count });
    }
    catch (err) {
        next(err);
    }
});
