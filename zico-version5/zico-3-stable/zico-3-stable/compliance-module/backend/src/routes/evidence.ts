import { Router } from "express";
import { prisma } from "../index";
import { authenticate, authorize } from "../middleware/auth";
import { badRequest, notFound } from "../middleware/errorHandler";

export const evidenceRouter = Router();
evidenceRouter.use(authenticate);

evidenceRouter.get("/", async (req, res, next) => {
  try {
    const { search, status, sort = "uploadDate", order = "desc" } = req.query;
    const where: any = {};
    if (status && status !== "All") where.status = status as string;
    if (search) where.OR = [{ name: { contains: search as string } }, { owner: { contains: search as string } }];
    const items = await prisma.evidence.findMany({ where, orderBy: { [sort as string]: order === "desc" ? "desc" : "asc" }, include: { requirement: true } });
    res.json({ items, total: items.length });
  } catch (err) { next(err); }
});

evidenceRouter.post("/", authorize("Admin", "ComplianceManager"), async (req, res, next) => {
  try {
    const { name, requirementId, controlId, type, owner, expirationDate, status } = req.body;
    if (!name || !requirementId) throw badRequest("name and requirementId required");
    const count = await prisma.evidence.count();
    const item = await prisma.evidence.create({
      data: { code: `EVD-${String(count + 1).padStart(3, "0")}`, name, requirementId, controlId: controlId || "", type: type || "Document", owner: owner || "", expirationDate: expirationDate ? new Date(expirationDate) : null, status: status || "Submitted" },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
});

evidenceRouter.patch("/:id/status", authorize("Admin", "ComplianceManager"), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) throw badRequest("status required");
    const existing = await prisma.evidence.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Evidence not found");
    const item = await prisma.evidence.update({ where: { id: req.params.id }, data: { status } });
    res.json(item);
  } catch (err) { next(err); }
});
