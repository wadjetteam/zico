import { Router } from "express";
import { prisma } from "../index";
import { authenticate, authorize } from "../middleware/auth";
import { badRequest, notFound, conflict } from "../middleware/errorHandler";

export const requirementsRouter = Router();
requirementsRouter.use(authenticate);

requirementsRouter.get("/", async (req, res, next) => {
  try {
    const { search, frameworkId, status, category, page = "1", pageSize = "10", sort = "code", order = "asc" } = req.query;
    const where: any = {};
    if (frameworkId && frameworkId !== "All") where.frameworkId = frameworkId as string;
    if (status && status !== "All") where.status = status as string;
    if (category && category !== "All") where.category = category as string;
    if (search) {
      where.OR = [
        { code: { contains: search as string } },
        { title: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }
    const total = await prisma.requirement.count({ where });
    const items = await prisma.requirement.findMany({
      where,
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { [sort as string]: order === "desc" ? "desc" : "asc" },
      include: { framework: true, assessments: true },
    });
    res.json({ items, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) { next(err); }
});

requirementsRouter.get("/:id", async (req, res, next) => {
  try {
    const req2 = await prisma.requirement.findUnique({
      where: { id: req.params.id },
      include: { framework: true, assessments: { orderBy: { createdAt: "desc" } }, evidence: true, gaps: true },
    });
    if (!req2) throw notFound("Requirement not found");
    res.json(req2);
  } catch (err) { next(err); }
});

requirementsRouter.post("/", authorize("Admin", "ComplianceManager"), async (req, res, next) => {
  try {
    const { title, description, frameworkId, category, applicability, status } = req.body;
    if (!title || !frameworkId) throw badRequest("Title and frameworkId required");
    const count = await prisma.requirement.count();
    const item = await prisma.requirement.create({
      data: { code: `REQ-${String(count + 1).padStart(3, "0")}`, title, description: description || "", frameworkId, category: category || "", applicability: applicability || "Applicable", status: status || "NotAssessed" },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
});

requirementsRouter.put("/:id", authorize("Admin", "ComplianceManager"), async (req, res, next) => {
  try {
    const existing = await prisma.requirement.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Requirement not found");
    const item = await prisma.requirement.update({ where: { id: req.params.id }, data: req.body });
    res.json(item);
  } catch (err) { next(err); }
});
