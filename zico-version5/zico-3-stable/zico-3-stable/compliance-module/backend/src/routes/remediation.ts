import { Router } from "express";
import { prisma } from "../index";
import { authenticate, authorize } from "../middleware/auth";
import { badRequest, notFound } from "../middleware/errorHandler";

export const remediationRouter = Router();
remediationRouter.use(authenticate);

remediationRouter.get("/", async (req, res, next) => {
  try {
    const { search, status, sort = "dueDate", order = "asc" } = req.query;
    const where: any = {};
    if (status && status !== "All") where.status = status as string;
    if (search) where.OR = [{ code: { contains: search as string } }, { description: { contains: search as string } }];
    const items = await prisma.remediation.findMany({ where, orderBy: { [sort as string]: order === "desc" ? "desc" : "asc" }, include: { gap: true } });
    res.json({ items, total: items.length });
  } catch (err) { next(err); }
});

remediationRouter.post("/", authorize("Admin", "ComplianceManager"), async (req, res, next) => {
  try {
    const { gapId, requirementId, description, owner, priority, dueDate, status } = req.body;
    if (!gapId || !description || !owner) throw badRequest("gapId, description, owner required");
    const count = await prisma.remediation.count();
    const item = await prisma.remediation.create({
      data: { code: `REM-${String(count + 1).padStart(3, "0")}`, gapId, requirementId: requirementId || "", description, owner, priority: priority || "High", dueDate: dueDate ? new Date(dueDate) : null, status: status || "Open", progress: 0 },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
});

remediationRouter.patch("/:id/progress", authorize("Admin", "ComplianceManager"), async (req, res, next) => {
  try {
    const { progress } = req.body;
    if (progress === undefined || progress < 0 || progress > 100) throw badRequest("progress 0-100 required");
    const existing = await prisma.remediation.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Remediation not found");

    let newStatus = existing.status;
    if (progress >= 100) newStatus = "Completed";
    else if (progress > 0 && existing.status === "Open") newStatus = "InProgress";

    const item = await prisma.remediation.update({ where: { id: req.params.id }, data: { progress, status: newStatus } });
    res.json(item);
  } catch (err) { next(err); }
});

remediationRouter.put("/:id", authorize("Admin", "ComplianceManager"), async (req, res, next) => {
  try {
    const existing = await prisma.remediation.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Remediation not found");
    let data = { ...req.body };
    if (data.progress !== undefined) {
      if (data.progress >= 100) data.status = "Completed";
      else if (data.progress > 0 && existing.status === "Open") data.status = "InProgress";
    }
    const item = await prisma.remediation.update({ where: { id: req.params.id }, data });
    res.json(item);
  } catch (err) { next(err); }
});
