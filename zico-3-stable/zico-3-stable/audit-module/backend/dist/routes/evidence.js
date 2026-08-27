"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evidenceRouter = void 0;
const express_1 = require("express");
const index_1 = require("../index");
const errorHandler_1 = require("../middleware/errorHandler");
exports.evidenceRouter = (0, express_1.Router)();
exports.evidenceRouter.get("/", async (req, res, next) => {
    try {
        const { auditId, status, page = "1", pageSize = "20" } = req.query;
        const where = {};
        if (auditId && auditId !== "All")
            where.auditId = auditId;
        if (status && status !== "All")
            where.status = status;
        const total = await index_1.prisma.evidenceRequest.count({ where });
        const items = await index_1.prisma.evidenceRequest.findMany({ where, skip: (Number(page) - 1) * Number(pageSize), take: Number(pageSize), orderBy: { createdAt: "desc" } });
        res.json({ items, total, page: Number(page), pageSize: Number(pageSize) });
    }
    catch (err) {
        next(err);
    }
});
exports.evidenceRouter.post("/", async (req, res, next) => {
    try {
        const { auditId, requirementId, controlId, description, evidenceType, requestedFrom, requestedBy, dueDate } = req.body;
        if (!auditId)
            throw (0, errorHandler_1.badRequest)("auditId is required");
        const audit = await index_1.prisma.audit.findUnique({ where: { id: auditId } });
        if (!audit)
            throw (0, errorHandler_1.badRequest)("Invalid auditId");
        const item = await index_1.prisma.evidenceRequest.create({ data: { auditId, requirementId, controlId, description: description || "", evidenceType: evidenceType || "", requestedFrom: requestedFrom || "", requestedBy: requestedBy || "", dueDate: dueDate ? new Date(dueDate) : null, status: "Requested" } });
        res.status(201).json(item);
    }
    catch (err) {
        next(err);
    }
});
exports.evidenceRouter.put("/:id", async (req, res, next) => {
    try {
        const existing = await index_1.prisma.evidenceRequest.findUnique({ where: { id: req.params.id } });
        if (!existing)
            throw (0, errorHandler_1.notFound)("Evidence request not found");
        const { status, description, evidenceName, reviewer, reviewerComments } = req.body;
        const item = await index_1.prisma.evidenceRequest.update({ where: { id: req.params.id }, data: { status: status ?? existing.status, description: description ?? existing.description, evidenceName: evidenceName ?? existing.evidenceName, reviewer: reviewer ?? existing.reviewer, reviewerComments: reviewerComments ?? existing.reviewerComments } });
        await index_1.prisma.auditHistoryEvent.create({ data: { auditId: existing.auditId, user: "system", action: "EVIDENCE_STATUS_CHANGED", prev: existing.status, next: item.status } });
        res.json(item);
    }
    catch (err) {
        next(err);
    }
});
