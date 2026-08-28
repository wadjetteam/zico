/**
 * WADJET GRC — Database Seed Script
 * Seeds master data and example data for all modules.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("[SEED] Starting database seed...");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.soDRule.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.generatedReport.deleteMany();
  await prisma.auditHistoryEvent.deleteMany();
  await prisma.correctiveAction.deleteMany();
  await prisma.finding.deleteMany();
  await prisma.evidenceRequest.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.auditScope.deleteMany();
  await prisma.audit.deleteMany();
  await prisma.auditPlan.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.requirementControl.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.controlFramework.deleteMany();
  await prisma.control.deleteMany();
  await prisma.riskControlLink.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.policyException.deleteMany();
  await prisma.policyVersion.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.domain.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.framework.deleteMany();
  await prisma.controlType.deleteMany();
  await prisma.riskScoreMethod.deleteMany();
  await prisma.severityLevel.deleteMany();

  // ============================================
  // MASTER DATA
  // ============================================

  // Severity Levels
  await prisma.severityLevel.createMany({
    data: [
      { code: "critical", label: "Critical", order: 1, color: "#e2584f" },
      { code: "high", label: "High", order: 2, color: "#e28a4f" },
      { code: "medium", label: "Medium", order: 3, color: "#e0b23d" },
      { code: "low", label: "Low", order: 4, color: "#7d7d86" },
    ],
  });

  // Risk Score Methods
  await prisma.riskScoreMethod.createMany({
    data: [
      { code: "multiplicative", name: "Multiplicative", description: "Score = Likelihood × Impact" },
      { code: "weighted_additive", name: "Weighted Additive", description: "Score = (wL×L) + (wI×I)" },
      { code: "matrix_lookup", name: "Matrix Lookup", description: "Score from predefined matrix" },
    ],
  });

  // Control Types
  await prisma.controlType.createMany({
    data: [
      { code: "preventive", name: "Preventive", description: "Prevents risk occurrence" },
      { code: "detective", name: "Detective", description: "Detects risk after occurrence" },
      { code: "corrective", name: "Corrective", description: "Corrects after detection" },
    ],
  });

  // Frameworks
  await prisma.framework.createMany({
    data: [
      { code: "ISO27001", name: "ISO/IEC 27001:2022", type: "Standard", version: "2022", issuer: "ISO/IEC" },
      { code: "CBE-CSF", name: "CBE Cybersecurity Framework", type: "Regulation", version: "v3.1", issuer: "Central Bank of Egypt" },
      { code: "PCI-DSS", name: "PCI DSS v4.0", type: "Standard", version: "4.0", issuer: "PCI Security Standards Council" },
      { code: "NIST-CSF", name: "NIST CSF 2.0", type: "Standard", version: "2.0", issuer: "NIST" },
    ],
  });

  // ============================================
  // IDENTITY & ACCESS
  // ============================================

  // Roles
  const adminRole = await prisma.role.create({
    data: { code: "admin", name: "Administrator", description: "Full system access", isSystem: true },
  });
  const auditManagerRole = await prisma.role.create({
    data: { code: "audit_manager", name: "Audit Manager", description: "Manages audit engagements", isSystem: true },
  });
  const auditorRole = await prisma.role.create({
    data: { code: "auditor", name: "Auditor", description: "Conducts audit fieldwork", isSystem: true },
  });
  const riskManagerRole = await prisma.role.create({
    data: { code: "risk_manager", name: "Risk Manager", description: "Manages risk register", isSystem: true },
  });
  const complianceManagerRole = await prisma.role.create({
    data: { code: "compliance_manager", name: "Compliance Manager", description: "Manages compliance", isSystem: true },
  });
  const viewerRole = await prisma.role.create({
    data: { code: "viewer", name: "Viewer", description: "Read-only access", isSystem: true },
  });

  // Permissions
  const permissions = [
    { code: "risk.create", name: "Create Risk", module: "risk" },
    { code: "risk.edit", name: "Edit Risk", module: "risk" },
    { code: "risk.view", name: "View Risk", module: "risk" },
    { code: "control.create", name: "Create Control", module: "controls" },
    { code: "control.edit", name: "Edit Control", module: "controls" },
    { code: "control.view", name: "View Control", module: "controls" },
    { code: "policy.create", name: "Create Policy", module: "governance" },
    { code: "policy.edit", name: "Edit Policy", module: "governance" },
    { code: "policy.view", name: "View Policy", module: "governance" },
    { code: "policy.approve", name: "Approve Policy", module: "governance" },
    { code: "audit.create", name: "Create Audit", module: "audit" },
    { code: "audit.edit", name: "Edit Audit", module: "audit" },
    { code: "audit.view", name: "View Audit", module: "audit" },
    { code: "compliance.view", name: "View Compliance", module: "compliance" },
    { code: "compliance.assess", name: "Assess Compliance", module: "compliance" },
    { code: "asset.create", name: "Create Asset", module: "assets" },
    { code: "asset.view", name: "View Asset", module: "assets" },
    { code: "report.generate", name: "Generate Report", module: "reporting" },
    { code: "admin.sod", name: "Manage SoD Rules", module: "admin" },
    { code: "admin.audit_log", name: "View Audit Log", module: "admin" },
  ];

  for (const perm of permissions) {
    await prisma.permission.create({ data: perm });
  }

  // Role Permissions
  const allPerms = await prisma.permission.findMany();
  for (const perm of allPerms) {
    await prisma.rolePermission.create({ data: { roleId: adminRole.id, permissionId: perm.id, scope: "all" } });
  }

  // Users
  const passwordHash = await bcrypt.hash("admin123", 12);
  const itDept = await prisma.department.findUnique({ where: { code: "IT" } });
  await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@wadjet.local",
      fullName: "System Administrator",
      passwordHash,
      roleId: adminRole.id,
      ownerId: "admin"?.id,
    },
  });

  await prisma.user.create({
    data: {
      username: "auditor",
      email: "auditor@wadjet.local",
      fullName: "Senior Auditor",
      passwordHash: await bcrypt.hash("auditor123", 12),
      roleId: auditorRole.id,
      
    },
  });

  await prisma.user.create({
    data: {
      username: "riskmanager",
      email: "risk@wadjet.local",
      fullName: "Risk Manager",
      passwordHash: await bcrypt.hash("risk123", 12),
      roleId: riskManagerRole.id,
      
    },
  });

  // ============================================
  // SoD RULES
  // ============================================

  await prisma.soDRule.createMany({
    data: [
      { code: "policy_creator_not_approver", name: "Policy Creator ≠ Approver", action: "ApprovePolicy", constraint: "creator != approver", description: "Policy creator cannot approve their own policy" },
      { code: "policy_approver_not_publisher", name: "Policy Approver ≠ Publisher", action: "PublishPolicy", constraint: "approver != publisher", description: "Policy approver cannot publish" },
      { code: "finding_auditor_independent", name: "Finding Verification Independent", action: "VerifyFinding", constraint: "auditor != findingCreator", description: "Auditor cannot verify own findings" },
      { code: "ca_verifier_not_owner", name: "CA Verifier ≠ Owner", action: "VerifyCorrectiveAction", constraint: "verifier != owner", description: "Corrective action owner cannot verify" },
    ],
  });

  // ============================================
  // ORGANIZATIONS & DOMAINS
  // ============================================

  const org = await prisma.organization.create({
    data: { code: "HQ", name: "Head Office", description: "Main headquarters" },
  });

  const itDomain = await prisma.domain.create({
    data: { code: "IT", name: "Information Technology", orgId: org.id },
  });

  const financeDomain = await prisma.domain.create({
    data: { code: "FIN", name: "Finance", orgId: org.id },
  });

  // ============================================
  // ASSETS
  // ============================================

  await prisma.asset.createMany({
    data: [
      { assetCode: "AST-001", name: "Core Banking Database", type: "Database", criticality: "Critical", domainId: itDomain.id, owner: "IT Team" },
      { assetCode: "AST-002", name: "Customer Web Portal", type: "Application", criticality: "High", domainId: itDomain.id, owner: "Dev Team" },
      { assetCode: "AST-003", name: "Employee Directory (AD)", type: "Directory", criticality: "Medium", domainId: itDomain.id, owner: "IT Ops" },
      { assetCode: "AST-004", name: "Payment Gateway", type: "Application", criticality: "Critical", domainId: financeDomain.id, owner: "Payments Team" },
    ],
  });

  // ============================================
  // RISKS
  // ============================================

  const severityHigh = await prisma.severityLevel.findUnique({ where: { code: "high" } });
  const method = await prisma.riskScoreMethod.findFirst({ where: { code: "multiplicative" } });

  await prisma.risk.createMany({
    data: [
      { riskCode: "RSK-001", title: "Unauthorized access to customer data", category: "Cybersecurity", domainId: itDomain.id, inherentScore: 20, likelihood: 4, impact: 5, residualScore: 8, severityId: severityHigh?.id, riskScoreMethodId: method?.id, priority: "High", ownerId: "admin" },
      { riskCode: "RSK-002", title: "Web portal compromise via injection", category: "Application Security", domainId: itDomain.id, inherentScore: 16, likelihood: 4, impact: 4, residualScore: 6, severityId: severityHigh?.id, riskScoreMethodId: method?.id, priority: "High", ownerId: "admin" },
      { riskCode: "RSK-003", title: "Privilege escalation by internal users", category: "Access Control", domainId: itDomain.id, inherentScore: 12, likelihood: 3, impact: 4, residualScore: 4, severityId: severityHigh?.id, riskScoreMethodId: method?.id, priority: "Medium", ownerId: "admin" },
      { riskCode: "RSK-004", title: "Unpatched infrastructure exploitation", category: "Vulnerability Management", domainId: itDomain.id, inherentScore: 20, likelihood: 5, impact: 4, residualScore: 10, severityId: severityHigh?.id, riskScoreMethodId: method?.id, priority: "Critical", ownerId: "admin" },
    ],
  });

  // ============================================
  // CONTROLS
  // ============================================

  const controlType = await prisma.controlType.findFirst({ where: { code: "preventive" } });

  await prisma.control.createMany({
    data: [
      { controlCode: "CTRL-001", name: "Multi-Factor Authentication (MFA)", controlTypeId: controlType?.id, domainId: itDomain.id, implementationStatus: "Implemented", effectiveness: 90, ownerId: "admin" },
      { controlCode: "CTRL-002", name: "Web Application Firewall (WAF)", controlTypeId: controlType?.id, domainId: itDomain.id, implementationStatus: "Implemented", effectiveness: 85, ownerId: "admin" },
      { controlCode: "CTRL-003", name: "Least Privilege Access (RBAC)", controlTypeId: controlType?.id, domainId: itDomain.id, implementationStatus: "PartiallyImplemented", effectiveness: 60, ownerId: "admin" },
      { controlCode: "CTRL-004", name: "Automated Vulnerability Scanning", controlTypeId: controlType?.id, domainId: itDomain.id, implementationStatus: "Implemented", effectiveness: 75, ownerId: "admin" },
    ],
  });

  // ============================================
  // POLICIES
  // ============================================

  await prisma.policy.createMany({
    data: [
      { policyCode: "POL-001", title: "Information Security Policy", category: "Security", status: "Active", version: "3.2", ownerId: "admin", ownerId: "admin"?.id, classification: "Internal" },
      { policyCode: "POL-002", title: "Access Control Policy", category: "Access", status: "Active", version: "2.1", ownerId: "admin", ownerId: "admin"?.id, classification: "Internal" },
      { policyCode: "POL-003", title: "Data Classification Policy", category: "Data", status: "UnderReview", version: "1.5", ownerId: "admin",  classification: "Confidential" },
    ],
  });

  // ============================================
  // COMPLIANCE REQUIREMENTS
  // ============================================

  const isoFramework = await prisma.framework.findUnique({ where: { code: "ISO27001" } });

  await prisma.requirement.createMany({
    data: [
      { code: "REQ-101", title: "Authentication information management", frameworkId: isoFramework?.id || "", category: "Identity & Access", status: "Compliant" },
      { code: "REQ-102", title: "Network security controls", frameworkId: isoFramework?.id || "", category: "Network Security", status: "Compliant" },
      { code: "REQ-103", title: "Access control policy and least privilege", frameworkId: isoFramework?.id || "", category: "Access Control", status: "PartiallyCompliant" },
      { code: "REQ-104", title: "Management of technical vulnerabilities", frameworkId: isoFramework?.id || "", category: "Vulnerability Management", status: "NonCompliant" },
    ],
  });

  // ============================================
  // AUDIT PLANS & AUDITS
  // ============================================

  const plan = await prisma.auditPlan.create({
    data: {
      planCode: "AP-2026-01",
      name: "Q4 2026 ISO 27001 Internal Audit",
      type: "Internal Audit",
      objective: "Evaluate ISO 27001 controls effectiveness",
      plannedStart: new Date("2026-10-01"),
      plannedEnd: new Date("2026-10-20"),
      owner: "CISO",
      leadAuditor: "Omar Farid",
      auditors: JSON.stringify(["Omar Farid", "Nourhan Adel"]),
      auditee: "IT Operations",
      frameworkId: isoFramework?.id,
      priority: "High",
      status: "Approved",
    },
  });

  await prisma.audit.create({
    data: {
      auditCode: "AUD-2026-01",
      planId: plan.id,
      name: "Q3 2026 ISO 27001 Internal Audit",
      type: "Internal Audit",
      objective: "Evaluate the effectiveness of ISO/IEC 27001:2022 controls",
      owner: "CISO",
      leadAuditor: "Omar Farid",
      team: JSON.stringify(["Omar Farid", "Nourhan Adel"]),
      auditee: "IT Operations",
      frameworkId: isoFramework?.id,
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-08-31"),
      status: "InProgress",
      overallResult: "NotConclusive",
    },
  });

  console.log("[SEED] Database seeded successfully!");
  console.log("[SEED] Login: admin / admin123 (Admin role)");
  console.log("[SEED] Login: auditor / auditor123 (Auditor role)");
  console.log("[SEED] Login: riskmanager / risk123 (Risk Manager role)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
