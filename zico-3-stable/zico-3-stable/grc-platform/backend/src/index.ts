/**
 * WADJET GRC Platform — Main Server Entry Point
 * Production-grade backend for banking GRC.
 */

import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { authenticate, requirePermission } from "./middleware/authorization";
import AuditLogService from "./shared/auditLog";

export const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5100;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

// Health check (public)
app.get("/api/health", (req, res) => res.json({ ok: true, service: "WADJET GRC" }));

// Auth routes (public)
app.post("/api/auth/login", async (req, res) => {
  try {
    const AuthService = (await import("./shared/auth")).default;
    const result = await AuthService.login(req.body.username, req.body.password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
});

// Protected routes below
app.use(authenticate);

// Auth/me
app.get("/api/auth/me", async (req: any, res) => {
  res.json({ user: req.user });
});

// Audit Log routes (admin only)
app.get("/api/audit/verify-chain", requirePermission("admin.audit_log"), async (req, res) => {
  const result = await AuditLogService.verifyChainIntegrity();
  res.json(result);
});

// Master Data routes (authenticated)
app.get("/api/master/severities", async (req, res) => {
  const data = await prisma.severityLevel.findMany({ orderBy: { order: "asc" } });
  res.json({ items: data });
});

app.get("/api/master/frameworks", async (req, res) => {
  const data = await prisma.framework.findMany();
  res.json({ items: data });
});

// SoD routes
app.get("/api/sod/rules", async (req, res) => {
  const SoDEngine = (await import("./shared/sodEngine")).default;
  const rules = await SoDEngine.getActiveRules();
  res.json({ items: rules });
});

app.post("/api/sod/rules", requirePermission("admin.sod"), async (req, res) => {
  const rule = await prisma.soDRule.create({ data: req.body });
  await AuditLogService.log({ actorUserId: req.user?.id, actorUsername: req.user?.username, actorRole: req.user?.role, action: "SOD_RULE_CREATED", entityType: "SoDRule", entityId: rule.id, toState: "Active" });
  res.status(201).json(rule);
});

// Risk routes
app.get("/api/risks", requirePermission("risk.view"), async (req, res) => {
  const risks = await prisma.risk.findMany({ include: { severity: true } });
  res.json({ items: risks, total: risks.length });
});

app.post("/api/risks", requirePermission("risk.create"), async (req: any, res) => {
  const count = await prisma.risk.count();
  const risk = await prisma.risk.create({
    data: { ...req.body, riskCode: `RSK-${String(count + 1).padStart(3, "0")}`, ownerId: req.user?.id },
  });
  await AuditLogService.log({ actorUserId: req.user?.id, actorUsername: req.user?.username, actorRole: req.user?.role, action: "RISK_CREATED", entityType: "Risk", entityId: risk.id, toState: "Active" });
  res.status(201).json(risk);
});

// Compliance routes
app.get("/api/compliance/requirements", requirePermission("compliance.view"), async (req, res) => {
  const data = await prisma.requirement.findMany({ include: { framework: true } });
  res.json({ items: data, total: data.length });
});

app.get("/api/compliance/gaps", requirePermission("compliance.view"), async (req, res) => {
  const data = await prisma.gap.findMany({ include: { requirement: true, framework: true } });
  res.json({ items: data, total: data.length });
});

app.post("/api/compliance/gaps", requirePermission("compliance.create"), async (req: any, res) => {
  const gap = await prisma.gap.create({ data: req.body });
  await AuditLogService.log({ actorUserId: req.user?.id, actorUsername: req.user?.username, actorRole: req.user?.role, action: "GAP_CREATED", entityType: "Gap", entityId: gap.id, toState: "Open" });
  res.status(201).json(gap);
});

// Audit routes
app.get("/api/audit/plans", requirePermission("audit.view"), async (req, res) => {
  const data = await prisma.auditPlan.findMany();
  res.json({ items: data, total: data.length });
});

app.post("/api/audit/plans", requirePermission("audit.create"), async (req: any, res) => {
  const count = await prisma.auditPlan.count();
  const plan = await prisma.auditPlan.create({
    data: { ...req.body, planCode: `AP-${new Date().getFullYear()}-${String(count + 1).padStart(2, "0")}` },
  });
  await AuditLogService.log({ actorUserId: req.user?.id, actorUsername: req.user?.username, actorRole: req.user?.role, action: "AUDIT_PLAN_CREATED", entityType: "AuditPlan", entityId: plan.id, toState: "Draft" });
  res.status(201).json(plan);
});

app.post("/api/audit/plans/:id/approve", requirePermission("audit.approve"), async (req: any, res) => {
  const plan = await prisma.auditPlan.findUnique({ where: { id: req.params.id } });
  if (!plan) return res.status(404).json({ message: "Plan not found" });

  // SoD Check: Creator cannot approve
  const SoDEngine = (await import("./shared/sodEngine")).default;
  const sodCheck = await SoDEngine.check("ApprovePolicy", req.user?.id, { createdByUserId: plan.ownerId });
  if (!sodCheck.allowed) return res.status(403).json({ message: `SoD violation: ${sodCheck.violations.join(", ")}` });

  const updated = await prisma.auditPlan.update({ where: { id: plan.id }, data: { status: "Scheduled" } });

  // Create audit from plan
  const auditCount = await prisma.audit.count();
  await prisma.audit.create({
    data: { auditCode: `AUD-${new Date().getFullYear()}-${String(auditCount + 1).padStart(2, "0")}`, planId: plan.id, name: plan.name, type: plan.type, objective: plan.objective, owner: plan.owner, leadAuditor: plan.leadAuditor, auditee: plan.auditee, department: plan.department, frameworkId: plan.frameworkId, startDate: plan.plannedStart, endDate: plan.plannedEnd, status: "Planned" },
  });

  await AuditLogService.log({ actorUserId: req.user?.id, actorUsername: req.user?.username, actorRole: req.user?.role, action: "AUDIT_PLAN_APPROVED", entityType: "AuditPlan", entityId: plan.id, fromState: plan.status, toState: "Scheduled" });
  res.json(updated);
});

// Asset routes
app.get("/api/assets", requirePermission("asset.view"), async (req, res) => {
  const data = await prisma.asset.findMany();
  res.json({ items: data, total: data.length });
});

app.post("/api/assets", requirePermission("asset.create"), async (req: any, res) => {
  const count = await prisma.asset.count();
  const asset = await prisma.asset.create({
    data: { ...req.body, assetCode: `AST-${String(count + 1).padStart(3, "0")}` },
  });
  await AuditLogService.log({ actorUserId: req.user?.id, actorUsername: req.user?.username, actorRole: req.user?.role, action: "ASSET_CREATED", entityType: "Asset", entityId: asset.id, toState: "Active" });
  res.status(201).json(asset);
});

app.listen(PORT, () => {
  console.log(`[WADJET GRC] Production backend running on http://localhost:${PORT}`);
});
