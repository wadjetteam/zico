import { Router } from "express";
import { prisma } from "../index";
import { badRequest, notFound } from "../middleware/errorHandler";

export const auditsRouter = Router();

function generateAuditCode(count: number) {
  return `AUD-${new Date().getFullYear()}-${String(count + 1).padStart(2, "0")}`;
}

// List all audits
auditsRouter.get("/", async (req, res, next) => {
  try {
    const { search, status, type, page = "1", pageSize = "10" } = req.query;
    const where: any = {};
    if (status && status !== "All") where.status = status as string;
    if (type && type !== "All") where.type = type as string;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { auditCode: { contains: search as string, mode: "insensitive" } },
        { objective: { contains: search as string, mode: "insensitive" } },
      ];
    }
    const total = await prisma.audit.count({ where });
    const items = await prisma.audit.findMany({
      where,
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { checklistItems: true, findings: true, correctiveActions: true } } },
    });
    res.json({ items, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    next(err);
  }
});

// Get single audit with all relations
auditsRouter.get("/:id", async (req, res, next) => {
  try {
    const audit = await prisma.audit.findUnique({
      where: { id: req.params.id },
      include: {
        scope: true,
        checklistItems: true,
        evidenceRequests: true,
        findings: { include: { correctiveActions: true } },
        correctiveActions: true,
        historyEvents: { orderBy: { when: "desc" } },
      },
    });
    if (!audit) throw notFound("Audit not found");
    res.json(audit);
  } catch (err) {
    next(err);
  }
});

// Create audit
auditsRouter.post("/", async (req, res, next) => {
  try {
    const { name, type, objective, owner, leadAuditor, team, auditee, department, frameworkId, startDate, endDate, description } = req.body;
    if (!name) throw badRequest("Name is required");
    const count = await prisma.audit.count();
    const audit = await prisma.audit.create({
      data: {
        auditCode: generateAuditCode(count),
        name,
        type: type || "Internal Audit",
        objective: objective || "",
        owner: owner || "",
        leadAuditor: leadAuditor || "",
        team: JSON.stringify(team || []),
        auditee: auditee || "",
        department: department || "",
        frameworkId: frameworkId || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: "Planned",
        overallResult: "Not Conclusive",
      },
    });
    res.status(201).json(audit);
  } catch (err) {
    next(err);
  }
});

// Update audit
auditsRouter.put("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.audit.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Audit not found");
    const { name, type, objective, owner, leadAuditor, team, auditee, department, frameworkId, startDate, endDate, status, overallResult } = req.body;
    const audit = await prisma.audit.update({
      where: { id: req.params.id },
      data: {
        name: name ?? existing.name,
        type: type ?? existing.type,
        objective: objective ?? existing.objective,
        owner: owner ?? existing.owner,
        leadAuditor: leadAuditor ?? existing.leadAuditor,
        team: team ? JSON.stringify(team) : existing.team,
        auditee: auditee ?? existing.auditee,
        department: department ?? existing.department,
        frameworkId: frameworkId ?? existing.frameworkId,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: endDate ? new Date(endDate) : existing.endDate,
        status: status ?? existing.status,
        overallResult: overallResult ?? existing.overallResult,
      },
    });
    res.json(audit);
  } catch (err) {
    next(err);
  }
});

// Update audit status with validation
auditsRouter.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) throw badRequest("Status is required");
    const existing = await prisma.audit.findUnique({
      where: { id: req.params.id },
      include: { checklistItems: true },
    });
    if (!existing) throw notFound("Audit not found");

    // Validate: cannot complete with untested items
    if (status === "Completed") {
      const untestedCount = existing.checklistItems.filter((c) => c.result === "NotTested").length;
      if (untestedCount > 0) {
        throw badRequest(`Cannot complete audit with ${untestedCount} untested checklist item(s)`);
      }
    }

    const audit = await prisma.audit.update({
      where: { id: req.params.id },
      data: { status },
    });

    // Log history
    await prisma.auditHistoryEvent.create({
      data: {
        auditId: audit.id,
        user: "system",
        action: "STATUS_CHANGED",
        prev: existing.status,
        next: status,
      },
    });

    res.json(audit);
  } catch (err) {
    next(err);
  }
});

// Compute overall result
auditsRouter.get("/:id/overall-result", async (req, res, next) => {
  try {
    const audit = await prisma.audit.findUnique({
      where: { id: req.params.id },
      include: { checklistItems: true, findings: true },
    });
    if (!audit) throw notFound("Audit not found");

    const result = computeOverallResult(audit.checklistItems as any, audit.findings as any);
    res.json({ overallResult: result });
  } catch (err) {
    next(err);
  }
});

export function computeOverallResult(checklistItems: any[], findings: any[]) {
  const applicable = checklistItems.filter((c) => c.result !== "NotApplicable");
  const tested = applicable.filter((c) => c.result !== "NotTested");

  if (tested.length === 0) return "Not Conclusive";
  if (tested.length < applicable.length) return "Not Conclusive";

  const nonConformities = tested.filter((c) => c.result === "NonConformity").length;
  const partial = tested.filter((c) => c.result === "PartialConformity").length;
  const ratio = (nonConformities + partial * 0.5) / tested.length;

  const openCritical = findings.some((f) => f.severity === "Critical" && !["Closed", "Accepted", "Resolved"].includes(f.status));
  if (openCritical || ratio > 0.4) return "Ineffective";
  if (ratio > 0.15) return "Partially Effective";
  return "Effective";
}

export default { computeOverallResult };
