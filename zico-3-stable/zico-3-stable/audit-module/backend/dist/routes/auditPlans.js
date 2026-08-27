"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditPlansRouter = void 0;
const express_1 = require("express");
const index_1 = require("../index");
const errorHandler_1 = require("../middleware/errorHandler");
exports.auditPlansRouter = (0, express_1.Router)();
// List all plans
exports.auditPlansRouter.get("/", async (req, res, next) => {
    try {
        const { search, status, type, page = "1", pageSize = "10" } = req.query;
        const where = {};
        if (status && status !== "All")
            where.status = status;
        if (type && type !== "All")
            where.type = type;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { planCode: { contains: search, mode: "insensitive" } },
                { objective: { contains: search, mode: "insensitive" } },
            ];
        }
        const total = await index_1.prisma.auditPlan.count({ where });
        const items = await index_1.prisma.auditPlan.findMany({
            where,
            skip: (Number(page) - 1) * Number(pageSize),
            take: Number(pageSize),
            orderBy: { createdAt: "desc" },
        });
        res.json({ items, total, page: Number(page), pageSize: Number(pageSize) });
    }
    catch (err) {
        next(err);
    }
});
// Get single plan
exports.auditPlansRouter.get("/:id", async (req, res, next) => {
    try {
        const plan = await index_1.prisma.auditPlan.findUnique({ where: { id: req.params.id } });
        if (!plan)
            throw (0, errorHandler_1.notFound)("Plan not found");
        res.json(plan);
    }
    catch (err) {
        next(err);
    }
});
// Create plan
exports.auditPlansRouter.post("/", async (req, res, next) => {
    try {
        const { name, type, objective, plannedStart, plannedEnd, owner, leadAuditor, auditors, auditee, department, frameworkId, priority, description, originalAuditId } = req.body;
        if (!name)
            throw (0, errorHandler_1.badRequest)("Name is required");
        const count = await index_1.prisma.auditPlan.count();
        const plan = await index_1.prisma.auditPlan.create({
            data: {
                planCode: `AP-${new Date().getFullYear()}-${String(count + 1).padStart(2, "0")}`,
                name,
                type: type || "Regular",
                objective: objective || "",
                plannedStart: plannedStart ? new Date(plannedStart) : null,
                plannedEnd: plannedEnd ? new Date(plannedEnd) : null,
                owner: owner || "",
                leadAuditor: leadAuditor || "",
                auditors: JSON.stringify(auditors || []),
                auditee: auditee || "",
                department: department || "",
                frameworkId: frameworkId || null,
                priority: priority || "Medium",
                description: description || "",
                originalAuditId: originalAuditId || null,
            },
        });
        res.status(201).json(plan);
    }
    catch (err) {
        next(err);
    }
});
// Update plan
exports.auditPlansRouter.put("/:id", async (req, res, next) => {
    try {
        const existing = await index_1.prisma.auditPlan.findUnique({ where: { id: req.params.id } });
        if (!existing)
            throw (0, errorHandler_1.notFound)("Plan not found");
        const { name, type, objective, plannedStart, plannedEnd, owner, leadAuditor, auditors, auditee, department, frameworkId, priority, status, description, originalAuditId } = req.body;
        const plan = await index_1.prisma.auditPlan.update({
            where: { id: req.params.id },
            data: {
                name: name ?? existing.name,
                type: type ?? existing.type,
                objective: objective ?? existing.objective,
                plannedStart: plannedStart ? new Date(plannedStart) : existing.plannedStart,
                plannedEnd: plannedEnd ? new Date(plannedEnd) : existing.plannedEnd,
                owner: owner ?? existing.owner,
                leadAuditor: leadAuditor ?? existing.leadAuditor,
                auditors: auditors ? JSON.stringify(auditors) : existing.auditors,
                auditee: auditee ?? existing.auditee,
                department: department ?? existing.department,
                frameworkId: frameworkId ?? existing.frameworkId,
                priority: priority ?? existing.priority,
                status: status ?? existing.status,
                description: description ?? existing.description,
                originalAuditId: originalAuditId ?? existing.originalAuditId,
            },
        });
        res.json(plan);
    }
    catch (err) {
        next(err);
    }
});
// Approve plan (creates audit)
exports.auditPlansRouter.post("/:id/approve", async (req, res, next) => {
    try {
        const plan = await index_1.prisma.auditPlan.findUnique({ where: { id: req.params.id } });
        if (!plan)
            throw (0, errorHandler_1.notFound)("Plan not found");
        if (plan.status === "Scheduled" || plan.status === "Cancelled") {
            throw (0, errorHandler_1.badRequest)(`Cannot approve a plan with status ${plan.status}`);
        }
        const result = await index_1.prisma.$transaction(async (tx) => {
            // Update plan status
            const updatedPlan = await tx.auditPlan.update({
                where: { id: plan.id },
                data: { status: "Scheduled" },
            });
            // Create audit from plan
            const auditCount = await tx.audit.count();
            const audit = await tx.audit.create({
                data: {
                    auditCode: `AUD-${new Date().getFullYear()}-${String(auditCount + 1).padStart(2, "0")}`,
                    planId: plan.id,
                    name: plan.name,
                    type: plan.type,
                    objective: plan.objective,
                    owner: plan.owner,
                    leadAuditor: plan.leadAuditor,
                    team: plan.auditors,
                    auditee: plan.auditee,
                    department: plan.department,
                    frameworkId: plan.frameworkId,
                    startDate: plan.plannedStart,
                    endDate: plan.plannedEnd,
                    status: "Planned",
                    overallResult: "Not Conclusive",
                    followUpOfAuditId: plan.type === "Follow-up Audit" ? plan.originalAuditId : null,
                },
            });
            // Log history
            await tx.auditHistoryEvent.create({
                data: {
                    auditId: audit.id,
                    user: "system",
                    action: "AUDIT_CREATED_FROM_PLAN",
                    prev: plan.status,
                    next: "Scheduled",
                    metadata: JSON.stringify({ planId: plan.id }),
                },
            });
            return { plan: updatedPlan, audit };
        });
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
