import { Router } from "express";
import { prisma } from "../index";
import { badRequest, notFound, conflict } from "../middleware/errorHandler";

export const findingsRouter = Router();

findingsRouter.get("/", async (req, res, next) => {
  try {
    const { auditId, severity, status, page = "1", pageSize = "20" } = req.query;
    const where: any = {};
    if (auditId && auditId !== "All") where.auditId = auditId as string;
    if (severity && severity !== "All") where.severity = severity as string;
    if (status && status !== "All") where.status = status as string;
    const total = await prisma.finding.count({ where });
    const items = await prisma.finding.findMany({ where, skip: (Number(page) - 1) * Number(pageSize), take: Number(pageSize), orderBy: { createdAt: "desc" }, include: { correctiveActions: true } });
    res.json({ items, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) { next(err); }
});

findingsRouter.post("/", async (req, res, next) => {
  try {
    const { auditId, checklistItemId, requirementId, controlId, description, severity, rootCause, impact, riskId, recommendation, owner, dueDate } = req.body;
    if (!auditId) throw badRequest("auditId is required");
    if (!description) throw badRequest("Description is required");
    const audit = await prisma.audit.findUnique({ where: { id: auditId } });
    if (!audit) throw badRequest("Invalid auditId");
    // If from checklist item, check no existing finding
    if (checklistItemId) {
      const existing = await prisma.finding.findUnique({ where: { checklistItemId } });
      if (existing) throw conflict("A finding already exists for this checklist item");
    }
    const count = await prisma.finding.count({ where: { auditId } });
    const finding = await prisma.finding.create({
      data: {
        findingCode: `FND-${new Date().getFullYear()}-${auditId.slice(-4)}-${String(count + 1).padStart(3, "0")}`,
        auditId,
        checklistItemId: checklistItemId || null,
        requirementId: requirementId || null,
        controlId: controlId || null,
        description,
        severity: severity || "Medium",
        rootCause: rootCause || "",
        impact: impact || "",
        riskId: riskId || null,
        recommendation: recommendation || "",
        owner: owner || "",
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "Open",
      },
    });
    await prisma.auditHistoryEvent.create({ data: { auditId, user: "system", action: "FINDING_CREATED", next: finding.status } });
    res.status(201).json(finding);
  } catch (err) { next(err); }
});

findingsRouter.put("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.finding.findUnique({ where: { id: req.params.id }, include: { correctiveActions: true } });
    if (!existing) throw notFound("Finding not found");
    const { status, description, severity, rootCause, impact, recommendation, owner, dueDate } = req.body;

    // Validate: cannot close if open corrective actions
    if (["Closed", "Resolved", "Accepted"].includes(status)) {
      const openCA = existing.correctiveActions.filter((ca: any) => !["Verified", "Closed", "Cancelled"].includes(ca.status));
      if (openCA.length > 0) throw badRequest(`Cannot close finding with ${openCA.length} open corrective action(s)`);
    }

    const finding = await prisma.finding.update({
      where: { id: req.params.id },
      data: { status: status ?? existing.status, description: description ?? existing.description, severity: severity ?? existing.severity, rootCause: rootCause ?? existing.rootCause, impact: impact ?? existing.impact, recommendation: recommendation ?? existing.recommendation, owner: owner ?? existing.owner, dueDate: dueDate ? new Date(dueDate) : existing.dueDate },
    });
    await prisma.auditHistoryEvent.create({ data: { auditId: existing.auditId, user: "system", action: "FINDING_STATUS_CHANGED", prev: existing.status, next: finding.status } });
    res.json(finding);
  } catch (err) { next(err); }
});
