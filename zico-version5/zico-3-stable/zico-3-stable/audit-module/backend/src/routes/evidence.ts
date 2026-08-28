import { Router } from "express";
import { prisma } from "../index";
import { badRequest, notFound } from "../middleware/errorHandler";

export const evidenceRouter = Router();

evidenceRouter.get("/", async (req, res, next) => {
  try {
    const { auditId, status, page = "1", pageSize = "20" } = req.query;
    const where: any = {};
    if (auditId && auditId !== "All") where.auditId = auditId as string;
    if (status && status !== "All") where.status = status as string;
    const total = await prisma.evidenceRequest.count({ where });
    const items = await prisma.evidenceRequest.findMany({ where, skip: (Number(page) - 1) * Number(pageSize), take: Number(pageSize), orderBy: { createdAt: "desc" } });
    res.json({ items, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) { next(err); }
});

evidenceRouter.post("/", async (req, res, next) => {
  try {
    const { auditId, requirementId, controlId, description, evidenceType, requestedFrom, requestedBy, dueDate } = req.body;
    if (!auditId) throw badRequest("auditId is required");
    const audit = await prisma.audit.findUnique({ where: { id: auditId } });
    if (!audit) throw badRequest("Invalid auditId");
    const item = await prisma.evidenceRequest.create({ data: { auditId, requirementId, controlId, description: description || "", evidenceType: evidenceType || "", requestedFrom: requestedFrom || "", requestedBy: requestedBy || "", dueDate: dueDate ? new Date(dueDate) : null, status: "Requested" } });
    res.status(201).json(item);
  } catch (err) { next(err); }
});

evidenceRouter.put("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.evidenceRequest.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Evidence request not found");
    const { status, description, evidenceName, reviewer, reviewerComments } = req.body;
    const item = await prisma.evidenceRequest.update({ where: { id: req.params.id }, data: { status: status ?? existing.status, description: description ?? existing.description, evidenceName: evidenceName ?? existing.evidenceName, reviewer: reviewer ?? existing.reviewer, reviewerComments: reviewerComments ?? existing.reviewerComments } });
    await prisma.auditHistoryEvent.create({ data: { auditId: existing.auditId, user: "system", action: "EVIDENCE_STATUS_CHANGED", prev: existing.status, next: item.status } });
    res.json(item);
  } catch (err) { next(err); }
});
