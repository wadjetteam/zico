import { Router } from "express";
import { prisma } from "../index";
import { authenticate } from "../middleware/auth";
import { badRequest } from "../middleware/errorHandler";

export const findingsRouter = Router();
findingsRouter.use(authenticate);

findingsRouter.get("/", async (req, res, next) => {
  try {
    const { search, sort = "dueDate", order = "asc" } = req.query;
    const where: any = {};
    if (search) where.OR = [{ finding: { contains: search as string } }, { auditor: { contains: search as string } }];
    const items = await prisma.finding.findMany({ where, orderBy: { [sort as string]: order === "desc" ? "desc" : "asc" } });
    res.json({ items, total: items.length });
  } catch (err) { next(err); }
});

findingsRouter.post("/", authenticate, async (req, res, next) => {
  try {
    const { auditId, requirementId, finding, severity, evidenceId, auditor, status, correctiveAction, dueDate } = req.body;
    if (!auditId || !requirementId || !finding) throw badRequest("auditId, requirementId, finding required");
    const count = await prisma.finding.count();
    const item = await prisma.finding.create({
      data: { code: `FND-${String(count + 1).padStart(3, "0")}`, auditId, requirementId, finding, severity: severity || "Medium", evidenceId: evidenceId || "", auditor: auditor || "", status: status || "Open", correctiveAction: correctiveAction || "", dueDate: dueDate ? new Date(dueDate) : null },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
});
