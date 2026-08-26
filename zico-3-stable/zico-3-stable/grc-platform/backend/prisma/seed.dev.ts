/**
 * WADJET GRC — Development Seed Script
 * WARNING: This file contains demo credentials. DO NOT run in production.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("[SEED] Starting development seed...");

  // Clean existing
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.correctiveAction.deleteMany();
  await prisma.finding.deleteMany();
  await prisma.evidenceRequest.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.auditScope.deleteMany();
  await prisma.audit.deleteMany();
  await prisma.auditPlan.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.requirementControl.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.gap.deleteMany();
  await prisma.remediation.deleteMany();
  await prisma.policyException.deleteMany();
  await prisma.policyVersion.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.riskControlLink.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.controlFramework.deleteMany();
  await prisma.control.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.soDRule.deleteMany();
  await prisma.generatedReport.deleteMany();
  await prisma.department.deleteMany();
  await prisma.assessmentType.deleteMany();
  await prisma.priorityLevel.deleteMany();
  await prisma.dataClassification.deleteMany();
  await prisma.severityLevel.deleteMany();
  await prisma.riskScoreMethod.deleteMany();
  await prisma.controlType.deleteMany();
  await prisma.framework.deleteMany();
  await prisma.domain.deleteMany();
  await prisma.organization.deleteMany();

  // Master Data
  await prisma.dataClassification.createMany({
    data: [
      { code: "public", label: "Public", level: 1 },
      { code: "internal", label: "Internal", level: 2 },
      { code: "confidential", label: "Confidential", level: 3 },
      { code: "restricted", label: "Restricted", level: 4 },
      { code: "highly_restricted", label: "Highly Restricted", level: 5 },
    ],
  });

  await prisma.severityLevel.createMany({
    data: [
      { code: "critical", label: "Critical", order: 1, color: "#e2584f" },
      { code: "high", label: "High", order: 2, color: "#e28a4f" },
      { code: "medium", label: "Medium", order: 3, color: "#e0b23d" },
      { code: "low", label: "Low", order: 4, color: "#7d7d86" },
    ],
  });

  await prisma.department.createMany({
    data: [
      { code: "IT", name: "Information Technology" },
      { code: "FIN", name: "Finance" },
      { code: "HR", name: "Human Resources" },
      { code: "AUDIT", name: "Internal Audit" },
      { code: "RISK", name: "Risk Management" },
      { code: "LEGAL", name: "Legal & Compliance" },
    ],
  });

  await prisma.framework.createMany({
    data: [
      { code: "ISO27001", name: "ISO/IEC 27001:2022", type: "Standard", version: "2022", issuer: "ISO/IEC" },
      { code: "CBE-CSF", name: "CBE Cybersecurity Framework", type: "Regulation", version: "v3.1", issuer: "Central Bank of Egypt" },
      { code: "PCI-DSS", name: "PCI DSS v4.0", type: "Standard", version: "4.0", issuer: "PCI SSC" },
    ],
  });

  // Roles
  const adminRole = await prisma.role.create({ data: { code: "admin", name: "Administrator", isSystem: true } });
  const auditorRole = await prisma.role.create({ data: { code: "auditor", name: "Auditor", isSystem: true } });
  const riskRole = await prisma.role.create({ data: { code: "risk_manager", name: "Risk Manager", isSystem: true } });
  const viewerRole = await prisma.role.create({ data: { code: "viewer", name: "Viewer", isSystem: true } });

  // Permissions
  const permData = [
    { code: "risk.view", name: "View Risks", module: "risk" },
    { code: "risk.create", name: "Create Risks", module: "risk" },
    { code: "risk.edit", name: "Edit Risks", module: "risk" },
    { code: "compliance.view", name: "View Compliance", module: "compliance" },
    { code: "compliance.create", name: "Create Compliance", module: "compliance" },
    { code: "audit.view", name: "View Audits", module: "audit" },
    { code: "audit.create", name: "Create Audits", module: "audit" },
    { code: "asset.view", name: "View Assets", module: "assets" },
    { code: "asset.create", name: "Create Assets", module: "assets" },
    { code: "admin.sod", name: "Manage SoD", module: "admin" },
    { code: "admin.audit_log", name: "View Audit Log", module: "admin" },
  ];
  const perms = [];
  for (const p of permData) perms.push(await prisma.permission.create({ data: p }));

  // Admin gets all permissions
  for (const p of perms) await prisma.rolePermission.create({ data: { roleId: adminRole.id, permissionId: p.id, scope: "all" } });

  // Users
  const pw = await bcrypt.hash("admin123", 12);
  const itDept = await prisma.department.findUnique({ where: { code: "IT" } });
  await prisma.user.create({ data: { username: "admin", email: "admin@wadjet.local", fullName: "System Administrator", passwordHash: pw, roleId: adminRole.id, departmentId: itDept?.id } });
  await prisma.user.create({ data: { username: "auditor", email: "auditor@wadjet.local", fullName: "Senior Auditor", passwordHash: await bcrypt.hash("auditor123", 12), roleId: auditorRole.id } });
  await prisma.user.create({ data: { username: "riskmanager", email: "risk@wadjet.local", fullName: "Risk Manager", passwordHash: await bcrypt.hash("risk123", 12), roleId: riskRole.id } });

  // SoD Rules
  await prisma.soDRule.createMany({
    data: [
      { code: "policy_creator_not_approver", name: "Creator Approve", action: "ApprovePolicy", constraint: "creator != approver" },
      { code: "finding_auditor_independent", name: "Finding Independent", action: "VerifyFinding", constraint: "auditor != findingCreator" },
    ],
  });

  // Risks
  const severityHigh = await prisma.severityLevel.findUnique({ where: { code: "high" } });
  await prisma.risk.createMany({
    data: [
      { riskCode: "RSK-001", title: "Unauthorized access", inherentScore: 20, likelihood: 4, impact: 5, residualScore: 8, severityId: severityHigh?.id, status: "Active", ownerId: "admin" },
      { riskCode: "RSK-002", title: "Web portal compromise", inherentScore: 16, likelihood: 4, impact: 4, residualScore: 6, severityId: severityHigh?.id, status: "Active", ownerId: "admin" },
      { riskCode: "RSK-003", title: "Privilege escalation", inherentScore: 12, likelihood: 3, impact: 4, residualScore: 4, severityId: severityHigh?.id, status: "Active", ownerId: "admin" },
    ],
  });

  // Policies
  await prisma.policy.createMany({
    data: [
      { policyCode: "POL-001", title: "Information Security Policy", status: "Active", version: "3.2", ownerId: "admin", classification: "Internal" },
      { policyCode: "POL-002", title: "Access Control Policy", status: "Active", version: "2.1", ownerId: "admin", classification: "Internal" },
    ],
  });

  // Assets
  await prisma.asset.createMany({
    data: [
      { assetCode: "AST-001", name: "Core Banking Database", type: "Database", criticality: "Critical", status: "Active", owner: "IT Team" },
      { assetCode: "AST-002", name: "Web Portal", type: "Application", criticality: "High", status: "Active", owner: "Dev Team" },
    ],
  });

  console.log("[SEED] Development seed complete.");
  console.log("[SEED] DEMO CREDENTIALS (DEV ONLY):");
  console.log("[SEED]   admin / admin123 (Administrator)");
  console.log("[SEED]   auditor / auditor123 (Auditor)");
  console.log("[SEED]   riskmanager / risk123 (Risk Manager)");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
