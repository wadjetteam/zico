import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("[SEED] Starting database seed...");

  // Clean existing data
  await prisma.remediation.deleteMany();
  await prisma.gap.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.finding.deleteMany();
  await prisma.framework.deleteMany();
  await prisma.control.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.audit.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const password = await bcrypt.hash("admin123", 12);
  await prisma.user.createMany({
    data: [
      { username: "admin", email: "admin@wadjet.local", fullName: "System Administrator", password, role: "Admin" },
      { username: "manager", email: "manager@wadjet.local", fullName: "Compliance Manager", password, role: "ComplianceManager" },
      { username: "auditor", email: "auditor@wadjet.local", fullName: "Audrey Tor", password, role: "Auditor" },
      { username: "viewer", email: "viewer@wadjet.local", fullName: "View Only User", password, role: "Viewer" },
    ],
  });

  // Reference tables
  const controls = await Promise.all([
    prisma.control.create({ data: { controlCode: "CTRL-001", name: "Multi-Factor Authentication", framework: "ISO 27001" } }),
    prisma.control.create({ data: { controlCode: "CTRL-002", name: "Network Firewall Rules", framework: "ISO 27001" } }),
    prisma.control.create({ data: { controlCode: "CTRL-003", name: "Role-Based Access Control", framework: "ISO 27001" } }),
    prisma.control.create({ data: { controlCode: "CTRL-004", name: "Vulnerability Management Process", framework: "CBE" } }),
  ]);

  const risks = await Promise.all([
    prisma.risk.create({ data: { riskCode: "RSK-001", title: "Unauthorized Access", level: "High" } }),
    prisma.risk.create({ data: { riskCode: "RSK-002", title: "Data Breach", level: "Critical" } }),
    prisma.risk.create({ data: { riskCode: "RSK-003", title: "Service Disruption", level: "Medium" } }),
    prisma.risk.create({ data: { riskCode: "RSK-004", title: "Compliance Violation", level: "High" } }),
  ]);

  const policies = await Promise.all([
    prisma.policy.create({ data: { policyCode: "POL-001", title: "Information Security Policy", status: "Published" } }),
    prisma.policy.create({ data: { policyCode: "POL-002", title: "Access Control Policy", status: "Published" } }),
    prisma.policy.create({ data: { policyCode: "POL-003", title: "Data Classification Policy", status: "Draft" } }),
  ]);

  const assets = await Promise.all([
    prisma.asset.create({ data: { assetCode: "AST-001", name: "Customer Database", type: "Database" } }),
    prisma.asset.create({ data: { assetCode: "AST-002", name: "Web Application Server", type: "Server" } }),
    prisma.asset.create({ data: { assetCode: "AST-003", name: "Payment Gateway", type: "Application" } }),
    prisma.asset.create({ data: { assetCode: "AST-004", name: "Firewall Infrastructure", type: "Network" } }),
    prisma.asset.create({ data: { assetCode: "AST-005", name: "Employee Laptops", type: "Endpoint" } }),
  ]);

  const audits = await Promise.all([
    prisma.audit.create({ data: { auditCode: "AUD-001", name: "ISO 27001 Surveillance Audit", auditor: "External ISO Auditor" } }),
    prisma.audit.create({ data: { auditCode: "AUD-002", name: "Internal Compliance Review", auditor: "Internal Audit Team" } }),
  ]);

  // Frameworks
  const iso = await prisma.framework.create({
    data: { code: "FRW-001", name: "ISO/IEC 27001:2022", type: "Standard", version: "2022", issuer: "ISO/IEC", effectiveDate: new Date("2022-10-25"), description: "Information security management systems", status: "Active" },
  });
  const cbe = await prisma.framework.create({
    data: { code: "FRW-002", name: "CBE Cybersecurity Framework", type: "Regulation", version: "v3.1", issuer: "Central Bank of Egypt", effectiveDate: new Date("2024-01-01"), description: "Cybersecurity regulations for Egyptian banks", status: "Active" },
  });
  const pci = await prisma.framework.create({
    data: { code: "FRW-003", name: "PCI DSS v4.0", type: "Standard", version: "4.0", issuer: "PCI Security Standards Council", effectiveDate: new Date("2024-03-31"), description: "Payment card industry data security standard", status: "Active" },
  });

  // Requirements
  const req1 = await prisma.requirement.create({
    data: { code: "REQ-101", title: "Authentication information management", frameworkId: iso.id, category: "Identity & Access", status: "Compliant", mappedControls: JSON.stringify([controls[0].id]), relatedPolicies: JSON.stringify([policies[1].id]), relatedAssets: JSON.stringify([assets[0].id]) },
  });
  const req2 = await prisma.requirement.create({
    data: { code: "REQ-102", title: "Network security controls", frameworkId: iso.id, category: "Network Security", status: "Compliant", mappedControls: JSON.stringify([controls[1].id]), relatedAssets: JSON.stringify([assets[3].id]) },
  });
  const req3 = await prisma.requirement.create({
    data: { code: "REQ-103", title: "Access control policy and least privilege", frameworkId: iso.id, category: "Access Control", status: "PartiallyCompliant", mappedControls: JSON.stringify([controls[2].id]), relatedPolicies: JSON.stringify([policies[1].id]), relatedRisks: JSON.stringify([risks[0].id]) },
  });
  const req4 = await prisma.requirement.create({
    data: { code: "REQ-104", title: "Management of technical vulnerabilities", frameworkId: iso.id, category: "Vulnerability Management", status: "NonCompliant", mappedControls: JSON.stringify([controls[3].id]), relatedRisks: JSON.stringify([risks[1].id]) },
  });
  const req5 = await prisma.requirement.create({
    data: { code: "REQ-201", title: "Strong authentication for remote access", frameworkId: cbe.id, category: "Authentication", status: "Compliant", mappedControls: JSON.stringify([controls[0].id]) },
  });
  const req6 = await prisma.requirement.create({
    data: { code: "REQ-202", title: "Vulnerability management program", frameworkId: cbe.id, category: "Vulnerability Management", status: "NonCompliant", mappedControls: JSON.stringify([controls[3].id]), relatedRisks: JSON.stringify([risks[1].id, risks[3].id]) },
  });
  const req7 = await prisma.requirement.create({
    data: { code: "REQ-301", title: "Protect cardholder data with network segmentation", frameworkId: pci.id, category: "Data Protection", status: "PartiallyCompliant", mappedControls: JSON.stringify([controls[1].id, controls[2].id]), relatedAssets: JSON.stringify([assets[0].id, assets[2].id]) },
  });
  const req8 = await prisma.requirement.create({
    data: { code: "REQ-302", title: "Restrict access to cardholder data by business need", frameworkId: pci.id, category: "Access Control", status: "NotApplicable" },
  });

  // Assessments
  await prisma.assessment.createMany({
    data: [
      { code: "ASM-001", requirementId: req3.id, status: "PartiallyCompliant", assessor: "Marwa Hassan", date: new Date("2026-06-02"), reviewer: "CISO", reviewStatus: "Reviewed", controlEffectiveness: "PartiallyEffective" },
      { code: "ASM-002", requirementId: req4.id, status: "NonCompliant", assessor: "Omar Farid", date: new Date("2026-07-14"), reviewer: "", reviewStatus: "PendingReview", controlEffectiveness: "NotEffective" },
      { code: "ASM-003", requirementId: req1.id, status: "Compliant", assessor: "Marwa Hassan", date: new Date("2026-05-20"), reviewer: "CISO", reviewStatus: "Reviewed", controlEffectiveness: "Effective" },
    ],
  });

  // Evidence
  await prisma.evidence.createMany({
    data: [
      { code: "EVD-001", name: "MFA Enforcement Policy Export.pdf", requirementId: req1.id, controlId: controls[0].id, type: "Document", owner: "Security Team", status: "Approved", verificationStatus: "Verified" },
      { code: "EVD-002", name: "WAF Ruleset Configuration.png", requirementId: req2.id, controlId: controls[1].id, type: "Screenshot", owner: "Network Team", status: "Approved", verificationStatus: "Verified" },
      { code: "EVD-003", name: "RBAC Access Review Q2.xlsx", requirementId: req3.id, controlId: controls[2].id, type: "LogExport", owner: "IT Ops", status: "UnderReview", verificationStatus: "Pending" },
      { code: "EVD-004", name: "Vulnerability Scan Report.pdf", requirementId: req4.id, controlId: controls[3].id, type: "Document", owner: "SecOps", status: "Missing" },
    ],
  });

  // Gaps
  const gap1 = await prisma.gap.create({
    data: { code: "GAP-001", requirementId: req3.id, frameworkId: iso.id, description: "Shared database accounts still in use", currentState: "Shared accounts exist", expectedState: "Individual accounts only", severity: "High", owner: "IT Ops Manager", dueDate: new Date("2026-09-30"), status: "InProgress", relatedRiskId: risks[0].id, relatedControlId: controls[2].id, remediationPlan: "Migrate shared accounts to individual" },
  });
  const gap2 = await prisma.gap.create({
    data: { code: "GAP-002", requirementId: req4.id, frameworkId: iso.id, description: "No weekly vulnerability scan schedule", currentState: "Ad-hoc scanning", expectedState: "Weekly automated scans", severity: "Critical", owner: "Vuln Mgmt Lead", dueDate: new Date("2026-09-15"), status: "Open", relatedRiskId: risks[1].id, relatedControlId: controls[3].id, remediationPlan: "Implement weekly scan schedule" },
  });
  const gap3 = await prisma.gap.create({
    data: { code: "GAP-003", requirementId: req6.id, frameworkId: cbe.id, description: "Customer apps not in scanning scope", currentState: "Partial coverage", expectedState: "100% coverage", severity: "High", owner: "Vuln Mgmt Lead", dueDate: new Date("2026-10-01"), status: "Open", relatedRiskId: risks[3].id, relatedControlId: controls[3].id, remediationPlan: "Onboard all customer apps" },
  });

  // Remediation
  await prisma.remediation.createMany({
    data: [
      { code: "REM-001", gapId: gap1.id, requirementId: req3.id, description: "Migrate shared database accounts", owner: "IT Ops Manager", priority: "High", dueDate: new Date("2026-09-30"), status: "InProgress", progress: 55 },
      { code: "REM-002", gapId: gap2.id, requirementId: req4.id, description: "Finalize weekly vulnerability scan schedule", owner: "Vuln Mgmt Lead", priority: "Critical", dueDate: new Date("2026-09-15"), status: "Open", progress: 10 },
      { code: "REM-003", gapId: gap3.id, requirementId: req6.id, description: "Onboard customer-facing applications into scanning scope", owner: "Vuln Mgmt Lead", priority: "High", dueDate: new Date("2026-10-01"), status: "Blocked", progress: 20 },
    ],
  });

  // Findings
  await prisma.finding.createMany({
    data: [
      { code: "FND-001", auditId: audits[0].id, requirementId: req4.id, finding: "Vulnerability scans not performed on schedule", severity: "High", auditor: "External ISO Auditor", status: "Open", correctiveAction: "Linked to REM-002", dueDate: new Date("2026-09-15") },
      { code: "FND-002", auditId: audits[1].id, requirementId: req3.id, finding: "Shared accounts found in production database", severity: "Medium", auditor: "Internal Audit Team", status: "Open", correctiveAction: "Linked to REM-001", dueDate: new Date("2026-09-30") },
    ],
  });

  console.log("[SEED] Database seeded successfully!");
  console.log("[SEED] Login: admin / admin123 (Admin role)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
