import { Router } from "express";
import { prisma } from "../index";
import { authenticate } from "../middleware/auth";

export const referenceRouter = Router();
referenceRouter.use(authenticate);

referenceRouter.get("/controls", async (req, res) => {
  const items = await prisma.control.findMany();
  res.json({ items });
});

referenceRouter.get("/risks", async (req, res) => {
  const items = await prisma.risk.findMany();
  res.json({ items });
});

referenceRouter.get("/policies", async (req, res) => {
  const items = await prisma.policy.findMany();
  res.json({ items });
});

referenceRouter.get("/assets", async (req, res) => {
  const items = await prisma.asset.findMany();
  res.json({ items });
});

referenceRouter.get("/audits", async (req, res) => {
  const items = await prisma.audit.findMany();
  res.json({ items });
});
