import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[SEED] Starting Audit Module seed...");

  // Clean existing
  await prisma.auditHistoryEvent.deleteMany();
  await prisma.correctiveAction.deleteMany();
  await prisma.finding.deleteMany();
  await prisma.evidenceRequest.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.auditScope.deleteMany();
  await prisma.audit.deleteMany();
  await prisma.auditPlan.deleteMany();
  await prisma.framework.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.control.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.auditor.deleteMany();

  // Reference data with explicit IDs
  await prisma.framework.createMany({
    data: [
      { id: "FRW-001", code: "FRW-001", name: "ISO/IEC 27001:2022", type: "Standard", version: "2022", issuer: "ISO/IEC" },
      { id: "FRW-002", code: "FRW-002", name: "CBE Cybersecurity Framework", type: "Regulation", version: "v3.1", issuer: "Central Bank of Egypt" },
      { id: "FRW-003", code: "FRW-003", name: "PCI DSS v4.0", type: "Standard", version: "4.0", issuer: "PCI Security Standards Council" },
    ],
  });

  await prisma.requirement.createMany({
    data: [
      { id: "REQ-101", code: "REQ-101", title: "Authentication information management", frameworkId: "FRW-001", category: "Identity & Access", mappedControls: JSON.stringify(["CTL-001"]), relatedPolicies: JSON.stringify(["POL-002"]) },
      { id: "REQ-102", code: "REQ-102", title: "Network security controls", frameworkId: "FRW-001", category: "Network Security", mappedControls: JSON.stringify(["CTL-002"]), relatedPolicies: JSON.stringify(["POL-005"]) },
      { id: "REQ-103", code: "REQ-103", title: "Access control policy and least privilege", frameworkId: "FRW-001", category: "Identity & Access", mappedControls: JSON.stringify(["CTL-003"]), relatedPolicies: JSON.stringify(["POL-002"]) },
      { id: "REQ-104", code: "REQ-104", title: "Management of technical vulnerabilities", frameworkId: "FRW-001", category: "Vulnerability Management", mappedControls: JSON.stringify(["CTL-004"]), relatedPolicies: JSON.stringify(["POL-009"]) },
      { id: "REQ-301", code: "REQ-301", title: "Protect cardholder data with network segmentation", frameworkId: "FRW-003", category: "Network Security", mappedControls: JSON.stringify(["CTL-002"]), relatedPolicies: JSON.stringify(["POL-005"]) },
      { id: "REQ-302", code: "REQ-302", title: "Restrict access to cardholder data by need to know", frameworkId: "FRW-003", category: "Identity & Access", mappedControls: JSON.stringify(["CTL-003"]), relatedPolicies: JSON.stringify(["POL-002"]) },
    ],
  });

  await prisma.control.createMany({
    data: [
      { id: "CTL-001", code: "CTL-001", name: "Multi-Factor Authentication (MFA)" },
      { id: "CTL-002", code: "CTL-002", name: "Web Application Firewall (WAF)" },
      { id: "CTL-003", code: "CTL-003", name: "Least Privilege Access (RBAC)" },
      { id: "CTL-004", code: "CTL-004", name: "Automated Vulnerability Scanning" },
    ],
  });

  await prisma.risk.createMany({
    data: [
      { id: "RSK-014", riskCode: "RSK-014", title: "Unauthorized access to customer data" },
      { id: "RSK-022", riskCode: "RSK-022", title: "Web portal compromise via injection" },
      { id: "RSK-031", riskCode: "RSK-031", title: "Privilege escalation by internal users" },
      { id: "RSK-045", riskCode: "RSK-045", title: "Unpatched infrastructure exploitation" },
    ],
  });

  await prisma.policy.createMany({
    data: [
      { id: "POL-002", policyCode: "POL-002", title: "Access Control Policy" },
      { id: "POL-005", policyCode: "POL-005", title: "Network Security Policy" },
      { id: "POL-009", policyCode: "POL-009", title: "Vulnerability Management Policy" },
    ],
  });

  await prisma.asset.createMany({
    data: [
      { id: "AST-001", assetCode: "AST-001", name: "Corporate VPN Gateway" },
      { id: "AST-002", assetCode: "AST-002", name: "Customer Web Portal" },
      { id: "AST-003", assetCode: "AST-003", name: "Employee Directory (AD)" },
      { id: "AST-004", assetCode: "AST-004", name: "Core Banking Database" },
      { id: "AST-005", assetCode: "AST-005", name: "Payment Gateway" },
      { id: "AST-006", assetCode: "AST-006", name: "POS Terminal Fleet" },
      { id: "AST-007", assetCode: "AST-007", name: "Internal File Server" },
    ],
  });

  await prisma.auditor.createMany({
    data: [
      { id: "aud-1", name: "Omar Farid", email: "omar@wadjet.local", department: "IT Audit" },
      { id: "aud-2", name: "Nourhan Adel", email: "nourhan@wadjet.local", department: "Compliance" },
      { id: "aud-3", name: "Marwa Hassan", email: "marwa@wadjet.local", department: "Security" },
      { id: "aud-4", name: "External ISO Auditor", email: "external@iso.local", department: "External" },
    ],
  });

  // Audit Plans
  const plan1 = await prisma.auditPlan.create({
    data: {
      id: "AP-2026-01", planCode: "AP-2026-01", name: "Q4 2026 Third-Party Vendor Risk Audit", type: "Risk-Based Audit",
      objective: "Assess third-party vendor security controls against contractual and regulatory obligations.",
      plannedStart: new Date("2026-10-01"), plannedEnd: new Date("2026-10-20"),
      owner: "CISO", leadAuditor: "Nourhan Adel", auditors: JSON.stringify(["Nourhan Adel"]),
      auditee: "Vendor Management Office", department: "Procurement", frameworkId: "FRW-002",
      priority: "High", status: "Draft",
    },
  });

  const plan2 = await prisma.auditPlan.create({
    data: {
      id: "AP-2026-02", planCode: "AP-2026-02", name: "Annual PCI DSS Recertification Audit", type: "Compliance Audit",
      objective: "Confirm continued PCI DSS v4.0 compliance ahead of annual recertification.",
      plannedStart: new Date("2026-11-01"), plannedEnd: new Date("2026-11-15"),
      owner: "Compliance Manager", leadAuditor: "Omar Farid", auditors: JSON.stringify(["Omar Farid", "Marwa Hassan"]),
      auditee: "Payments Team", department: "Finance Technology", frameworkId: "FRW-003",
      priority: "Critical", status: "Approved",
    },
  });

  const plan3 = await prisma.auditPlan.create({
    data: {
      id: "AP-2026-03", planCode: "AP-2026-03", name: "Q4 2026 ISO 27001 Follow-up Audit", type: "Follow-up Audit",
      objective: "Verify closure of findings raised during the 2025 ISO 27001 surveillance audit.",
      plannedStart: new Date("2026-11-01"), plannedEnd: new Date("2026-11-10"),
      owner: "CISO", leadAuditor: "Nourhan Adel", auditors: JSON.stringify(["Nourhan Adel"]),
      auditee: "Information Security", department: "Information Technology", frameworkId: "FRW-001",
      priority: "Medium", status: "Scheduled", originalAuditId: "AUD-2025-04",
    },
  });

  // Audits
  const audit1 = await prisma.audit.create({
    data: {
      id: "AUD-2026-01", auditCode: "AUD-2026-01", name: "Q3 2026 ISO 27001 Internal Audit", type: "Internal Audit",
      objective: "Evaluate the effectiveness of ISO/IEC 27001:2022 controls across IT Operations.",
      owner: "CISO", leadAuditor: "Omar Farid", team: JSON.stringify(["Omar Farid", "Nourhan Adel"]),
      auditee: "IT Operations", department: "Information Technology", frameworkId: "FRW-001",
      startDate: new Date("2026-08-01"), endDate: new Date("2026-08-31"),
      status: "InProgress", overallResult: "Not Conclusive",
    },
  });

  const audit2 = await prisma.audit.create({
    data: {
      id: "AUD-2026-02", auditCode: "AUD-2026-02", name: "PCI DSS v4.0 Compliance Audit", type: "Compliance Audit",
      objective: "Verify cardholder data environment controls meet PCI DSS v4.0 requirements.",
      owner: "Compliance Manager", leadAuditor: "Marwa Hassan", team: JSON.stringify(["Marwa Hassan"]),
      auditee: "Payments Team", department: "Finance Technology", frameworkId: "FRW-003",
      startDate: new Date("2026-06-01"), endDate: new Date("2026-06-20"),
      status: "Completed", overallResult: "Partially Effective",
    },
  });

  const audit3 = await prisma.audit.create({
    data: {
      id: "AUD-2025-04", auditCode: "AUD-2025-04", name: "Annual ISO 27001 Surveillance Audit", type: "External Audit",
      objective: "External surveillance audit for ISO/IEC 27001:2022 certification maintenance.",
      owner: "CISO", leadAuditor: "External ISO Auditor", team: JSON.stringify(["External ISO Auditor"]),
      auditee: "Information Security", department: "Information Technology", frameworkId: "FRW-001",
      startDate: new Date("2025-11-01"), endDate: new Date("2025-11-10"),
      status: "Completed", overallResult: "Effective",
    },
  });

  const audit4 = await prisma.audit.create({
    data: {
      id: "AUD-2026-03", auditCode: "AUD-2026-03", planId: "AP-2026-03", name: "Q4 2026 ISO 27001 Follow-up Audit", type: "Follow-up Audit",
      objective: "Verify closure of findings raised during the 2025 surveillance audit.",
      owner: "CISO", leadAuditor: "Nourhan Adel", team: JSON.stringify(["Nourhan Adel"]),
      auditee: "Information Security", department: "Information Technology", frameworkId: "FRW-001",
      startDate: new Date("2026-11-01"), endDate: new Date("2026-11-10"),
      status: "Planned", overallResult: "Not Conclusive", followUpOfAuditId: "AUD-2025-04",
    },
  });

  // Checklist Items
  await prisma.checklistItem.createMany({
    data: [
      { id: "CHK-001", auditId: "AUD-2026-01", requirementId: "REQ-101", controlId: "CTL-001", testObjective: "Confirm MFA is enforced for all privileged and remote access.", testProcedure: "Sample 10 privileged accounts and review IAM logs for MFA challenge events.", auditor: "Omar Farid", testDate: new Date("2026-08-10"), result: "Conformity", comment: "All sampled accounts enforced MFA without exception.", reviewStatus: "Reviewed" },
      { id: "CHK-002", auditId: "AUD-2026-01", requirementId: "REQ-103", controlId: "CTL-003", testObjective: "Verify least-privilege access is enforced on the core banking database.", testProcedure: "Review the access matrix against job roles for the core banking database.", auditor: "Nourhan Adel", testDate: new Date("2026-08-12"), result: "NonConformity", comment: "Shared service accounts remain active; access matrix incomplete.", reviewStatus: "PendingReview" },
      { id: "CHK-003", auditId: "AUD-2026-01", requirementId: "REQ-104", controlId: "CTL-004", testObjective: "Confirm weekly vulnerability scans are performed across in-scope infrastructure.", testProcedure: "Review scan schedule and the last four scan reports.", auditor: "Omar Farid", result: "NotTested", reviewStatus: "NotStarted" },
    ],
  });

  // Findings
  await prisma.finding.create({
    data: {
      id: "FND-001", findingCode: "FND-2026-01-001", auditId: "AUD-2026-01", checklistItemId: "CHK-002",
      requirementId: "REQ-103", controlId: "CTL-003", description: "Shared privileged accounts found in production database",
      severity: "High", rootCause: "Legacy shared accounts not migrated", impact: "Potential unauthorized data access",
      recommendation: "Migrate all shared accounts to individual accounts with RBAC", owner: "IT Ops Manager", dueDate: new Date("2026-09-30"), status: "Open",
    },
  });

  // Corrective Actions
  await prisma.correctiveAction.create({
    data: {
      id: "CA-001", actionCode: "CA-2026-001", findingId: "FND-001", auditId: "AUD-2026-01",
      requirementId: "REQ-103", controlId: "CTL-003", description: "Migrate shared database accounts to individual accounts",
      owner: "IT Ops Manager", priority: "High", dueDate: new Date("2026-09-30"), status: "InProgress", progress: 55,
    },
  });

  console.log("[SEED] Audit Module seeded successfully!");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
