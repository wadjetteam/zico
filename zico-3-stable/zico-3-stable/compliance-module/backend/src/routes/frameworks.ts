import { Router } from "express";
import { prisma } from "../index";
import { authenticate, authorize } from "../middleware/auth";
import { badRequest, notFound } from "../middleware/errorHandler";

export const frameworksRouter = Router();
frameworksRouter.use(authenticate);

function generateCode(prefix: string, count: number) {
  return `${prefix}-${String(count + 1).padStart(3, "0")}`;
}

frameworksRouter.get("/", async (req, res, next) => {
  try {
    const { search, status, sort = "name", order = "asc" } = req.query;
    const where: any = {};
    if (status && status !== "All") where.status = status as string;
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { code: { contains: search as string } },
        { issuer: { contains: search as string } },
      ];
    }
    const frameworks = await prisma.framework.findMany({
      where,
      orderBy: { [sort as string]: order === "desc" ? "desc" : "asc" },
    });
    const enriched = await Promise.all(
      frameworks.map(async (f) => ({
        ...f,
        requirementCount: await prisma.requirement.count({ where: { frameworkId: f.id } }),
      }))
    );
    res.json({ items: enriched, total: enriched.length });
  } catch (err) {
    next(err);
  }
});

frameworksRouter.get("/:id", async (req, res, next) => {
  try {
    const fw = await prisma.framework.findUnique({
      where: { id: req.params.id },
      include: { requirements: true },
    });
    if (!fw) throw notFound("Framework not found");
    res.json(fw);
  } catch (err) {
    next(err);
  }
});

frameworksRouter.post("/", authorize("Admin", "ComplianceManager"), async (req, res, next) => {
  try {
    const { name, type, version, issuer, effectiveDate, description, status } = req.body;
    if (!name) throw badRequest("Name is required");
    const count = await prisma.framework.count();
    const fw = await prisma.framework.create({
      data: {
        code: generateCode("FRW", count),
        name,
        type: type || "Standard",
        version: version || "",
        issuer: issuer || "",
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        description: description || "",
        status: status || "Active",
      },
    });
    res.status(201).json(fw);
  } catch (err) {
    next(err);
  }
});

frameworksRouter.put("/:id", authorize("Admin", "ComplianceManager"), async (req, res, next) => {
  try {
    const { name, type, version, issuer, effectiveDate, description, status } = req.body;
    const existing = await prisma.framework.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Framework not found");
    const fw = await prisma.framework.update({
      where: { id: req.params.id },
      data: {
        name: name ?? existing.name,
        type: type ?? existing.type,
        version: version ?? existing.version,
        issuer: issuer ?? existing.issuer,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : existing.effectiveDate,
        description: description ?? existing.description,
        status: status ?? existing.status,
      },
    });
    res.json(fw);
  } catch (err) {
    next(err);
  }
});
