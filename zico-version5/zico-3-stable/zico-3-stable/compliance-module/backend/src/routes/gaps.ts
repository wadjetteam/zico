import { Router } from "express";
import { prisma } from "../index";
import { authenticate, authorize } from "../middleware/auth";
import { badRequest, notFound, conflict } from "../middleware/errorHandler";

export const gapsRouter = Router();
gapsRouter.use(authenticate);

gapsRouter.get("/", async (req, res, next) => {
  try {
    const { search, frameworkId, severity, owner, status, sort = "dueDate", order = "asc" } = req.query;
    const where: any = {};
    if (frameworkId && frameworkId !== "All") where.frameworkId = frameworkId as string;
    if (severity && severity !== "All") where.severity = severity as string;
    if (owner && owner !== "All") where.owner = owner as string;
    if (status && status !== "All") where.status = status as string;
    if (search) where.OR = [{ code: { contains: search as string } }, { description: { contains: search as string } }];
    const items = await prisma.gap.findMany({ where, orderBy: { [sort as string]: order === "desc" ? "desc" : "asc" }, include: { requirement: true, framework: true } });
    res.json({ items, total: items.length });
  } catch (err) { next(err); }
});

gapsRouter.post("/", authorize("Admin", "ComplianceManager"), async (req, res, next) => {
  try {
    const { requirementId, description, currentState, expectedState, severity, owner, dueDate, status, relatedRiskId, relatedControlId, remediationPlan } = req.body;
    if (!requirementId || !description || !owner) throw badRequest("requirementId, description, owner required");

    // Duplicate prevention
    const existingOpen = await prisma.gap.findFirst({
      where: { requirementId, status: { notIn: ["Resolved", "Closed"] } },
    });
    if (existingOpen) throw conflict("An open gap already exists for this requirement");

    const requirement = await prisma.requirement.findUnique({ where: { id: requirementId } });
    if (!requirement) throw notFound("Requirement not found");

    const count = await prisma.gap.count();
    const item = await prisma.gap.create({
      data: { code: `GAP-${String(count + 1).padStart(3, "0")}`, requirementId, frameworkId: requirement.frameworkId, description, currentState: currentState || "", expectedState: expectedState || "", severity: severity || "Medium", owner, dueDate: dueDate ? new Date(dueDate) : null, status: status || "Open", relatedRiskId: relatedRiskId || "", relatedControlId: relatedControlId || "", remediationPlan: remediationPlan || "" },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
});

gapsRouter.put("/:id", authorize("Admin", "ComplianceManager"), async (req, res, next) => {
  try {
    const existing = await prisma.gap.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Gap not found");
    const item = await prisma.gap.update({ where: { id: req.params.id }, data: req.body });
    res.json(item);
  } catch (err) { next(err); }
});
