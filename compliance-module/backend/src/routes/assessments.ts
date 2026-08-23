import { Router } from "express";
import { prisma } from "../index";
import { authenticate, authorize } from "../middleware/auth";
import { badRequest, notFound } from "../middleware/errorHandler";

export const assessmentsRouter = Router();
assessmentsRouter.use(authenticate);

assessmentsRouter.get("/", async (req, res, next) => {
  try {
    const { search, sort = "date", order = "desc" } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { assessor: { contains: search as string } },
        { code: { contains: search as string } },
      ];
    }
    const items = await prisma.assessment.findMany({ where, orderBy: { [sort as string]: order === "desc" ? "desc" : "asc" }, include: { requirement: true } });
    res.json({ items, total: items.length });
  } catch (err) { next(err); }
});

// Append-only: create new assessment + update requirement status in transaction
assessmentsRouter.post("/", authorize("Admin", "ComplianceManager", "Auditor"), async (req, res, next) => {
  try {
    const { requirementId, status, assessor, date, comments, findings, controlEffectiveness, reviewer, reviewStatus } = req.body;
    if (!requirementId || !status || !assessor) throw badRequest("requirementId, status, assessor required");

    const count = await prisma.assessment.count();
    const result = await prisma.$transaction(async (tx) => {
      const assessment = await tx.assessment.create({
        data: { code: `ASM-${String(count + 1).padStart(3, "0")}`, requirementId, status, assessor, date: date ? new Date(date) : new Date(), comments: comments || "", findings: findings || "", controlEffectiveness: controlEffectiveness || "NotAssessed", reviewer: reviewer || "", reviewStatus: reviewStatus || "PendingReview" },
      });
      await tx.requirement.update({ where: { id: requirementId }, data: { status } });
      return assessment;
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
});
