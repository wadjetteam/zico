/**
 * WADJET GRC — Compliance Module Data & Handlers
 * In-memory data store for the Compliance Module
 */

export const COMPLIANCE_FRAMEWORKS = [
  { _id: "cf-1", code: "FRW-001", name: "ISO/IEC 27001:2022", type: "Standard", version: "2022", issuer: "ISO/IEC", effectiveDate: "2022-10-25", description: "Information security management systems requirements", status: "Active" },
  { _id: "cf-2", code: "FRW-002", name: "CBE Cybersecurity Framework", type: "Regulation", version: "v3.1", issuer: "Central Bank of Egypt", effectiveDate: "2024-01-01", description: "Cybersecurity regulations for Egyptian banks", status: "Active" },
  { _id: "cf-3", code: "FRW-003", name: "PCI DSS v4.0", type: "Standard", version: "4.0", issuer: "PCI Security Standards Council", effectiveDate: "2024-03-31", description: "Payment card industry data security standard", status: "Active" },
];

export const COMPLIANCE_REQUIREMENTS = [
  { _id: "cr-1", code: "REQ-101", title: "Authentication information management", frameworkId: "cf-1", category: "Identity & Access", applicability: "Applicable", status: "Compliant", mappedControls: JSON.stringify(["cc-1"]), relatedPolicies: JSON.stringify(["pol-1"]), relatedRisks: JSON.stringify([]), relatedAssets: JSON.stringify(["ast-1"]) },
  { _id: "cr-2", code: "REQ-102", title: "Network security controls", frameworkId: "cf-1", category: "Network Security", applicability: "Applicable", status: "Compliant", mappedControls: JSON.stringify(["cc-2"]), relatedPolicies: JSON.stringify([]), relatedRisks: JSON.stringify([]), relatedAssets: JSON.stringify(["ast-4"]) },
  { _id: "cr-3", code: "REQ-103", title: "Access control policy and least privilege", frameworkId: "cf-1", category: "Access Control", applicability: "Applicable", status: "PartiallyCompliant", mappedControls: JSON.stringify(["cc-3"]), relatedPolicies: JSON.stringify(["pol-1"]), relatedRisks: JSON.stringify(["rk-1"]), relatedAssets: JSON.stringify([]) },
  { _id: "cr-4", code: "REQ-104", title: "Management of technical vulnerabilities", frameworkId: "cf-1", category: "Vulnerability Management", applicability: "Applicable", status: "NonCompliant", mappedControls: JSON.stringify(["cc-4"]), relatedPolicies: JSON.stringify([]), relatedRisks: JSON.stringify(["rk-2"]), relatedAssets: JSON.stringify([]) },
  { _id: "cr-5", code: "REQ-201", title: "Strong authentication for remote access", frameworkId: "cf-2", category: "Authentication", applicability: "Applicable", status: "Compliant", mappedControls: JSON.stringify(["cc-1"]), relatedPolicies: JSON.stringify([]), relatedRisks: JSON.stringify([]), relatedAssets: JSON.stringify([]) },
  { _id: "cr-6", code: "REQ-202", title: "Vulnerability management program", frameworkId: "cf-2", category: "Vulnerability Management", applicability: "Applicable", status: "NonCompliant", mappedControls: JSON.stringify(["cc-4"]), relatedPolicies: JSON.stringify([]), relatedRisks: JSON.stringify(["rk-2", "rk-4"]), relatedAssets: JSON.stringify([]) },
  { _id: "cr-7", code: "REQ-301", title: "Protect cardholder data with network segmentation", frameworkId: "cf-3", category: "Data Protection", applicability: "Applicable", status: "PartiallyCompliant", mappedControls: JSON.stringify(["cc-2", "cc-3"]), relatedPolicies: JSON.stringify([]), relatedRisks: JSON.stringify([]), relatedAssets: JSON.stringify(["ast-1", "ast-3"]) },
  { _id: "cr-8", code: "REQ-302", title: "Restrict access to cardholder data by business need", frameworkId: "cf-3", category: "Access Control", applicability: "NotApplicable", status: "NotApplicable", mappedControls: JSON.stringify([]), relatedPolicies: JSON.stringify([]), relatedRisks: JSON.stringify([]), relatedAssets: JSON.stringify([]) },
];

export const COMPLIANCE_ASSESSMENTS = [
  { _id: "ca-1", code: "ASM-001", requirementId: "cr-3", status: "PartiallyCompliant", assessor: "Marwa Hassan", date: "2026-06-02", comments: "Partial controls in place", findings: "Shared accounts still exist", controlEffectiveness: "PartiallyEffective", reviewer: "CISO", reviewStatus: "Reviewed" },
  { _id: "ca-2", code: "ASM-002", requirementId: "cr-4", status: "NonCompliant", assessor: "Omar Farid", date: "2026-07-14", comments: "No regular scanning", findings: "Vulnerability scans not performed weekly", controlEffectiveness: "NotEffective", reviewer: "", reviewStatus: "PendingReview" },
  { _id: "ca-3", code: "ASM-003", requirementId: "cr-1", status: "Compliant", assessor: "Marwa Hassan", date: "2026-05-20", comments: "MFA fully deployed", findings: "", controlEffectiveness: "Effective", reviewer: "CISO", reviewStatus: "Reviewed" },
];

export const COMPLIANCE_EVIDENCE = [
  { _id: "ce-1", code: "EVD-001", name: "MFA Enforcement Policy Export.pdf", requirementId: "cr-1", controlId: "cc-1", type: "Document", owner: "Security Team", uploadDate: "2026-05-20", expirationDate: null, status: "Approved", verificationStatus: "Verified", reviewer: "CISO", comments: "Valid policy document" },
  { _id: "ce-2", code: "EVD-002", name: "WAF Ruleset Configuration.png", requirementId: "cr-2", controlId: "cc-2", type: "Screenshot", owner: "Network Team", uploadDate: "2026-05-15", expirationDate: null, status: "Approved", verificationStatus: "Verified", reviewer: "Network Lead", comments: "Current config" },
  { _id: "ce-3", code: "EVD-003", name: "RBAC Access Review Q2.xlsx", requirementId: "cr-3", controlId: "cc-3", type: "LogExport", owner: "IT Ops", uploadDate: "2026-07-01", expirationDate: "2026-12-31", status: "UnderReview", verificationStatus: "Pending", reviewer: "", comments: "" },
  { _id: "ce-4", code: "EVD-004", name: "Vulnerability Scan Report.pdf", requirementId: "cr-4", controlId: "cc-4", type: "Document", owner: "SecOps", uploadDate: null, expirationDate: null, status: "Missing", verificationStatus: "Pending", reviewer: "", comments: "" },
];

export const COMPLIANCE_GAPS = [
  { _id: "cg-1", code: "GAP-001", requirementId: "cr-3", frameworkId: "cf-1", description: "Shared database accounts still in use", currentState: "Shared accounts exist", expectedState: "Individual accounts only", severity: "High", owner: "IT Ops Manager", dueDate: "2026-09-30", status: "InProgress", relatedRiskId: "rk-1", relatedControlId: "cc-3", remediationPlan: "Migrate shared accounts to individual" },
  { _id: "cg-2", code: "GAP-002", requirementId: "cr-4", frameworkId: "cf-1", description: "No weekly vulnerability scan schedule", currentState: "Ad-hoc scanning", expectedState: "Weekly automated scans", severity: "Critical", owner: "Vuln Mgmt Lead", dueDate: "2026-09-15", status: "Open", relatedRiskId: "rk-2", relatedControlId: "cc-4", remediationPlan: "Implement weekly scan schedule" },
  { _id: "cg-3", code: "GAP-003", requirementId: "cr-6", frameworkId: "cf-2", description: "Customer apps not in scanning scope", currentState: "Partial coverage", expectedState: "100% coverage", severity: "High", owner: "Vuln Mgmt Lead", dueDate: "2026-10-01", status: "Open", relatedRiskId: "rk-4", relatedControlId: "cc-4", remediationPlan: "Onboard all customer apps" },
];

export const COMPLIANCE_REMEDIATION = [
  { _id: "cm-1", code: "REM-001", gapId: "cg-1", requirementId: "cr-3", description: "Migrate shared database accounts to individual accounts", owner: "IT Ops Manager", priority: "High", dueDate: "2026-09-30", status: "InProgress", progress: 55 },
  { _id: "cm-2", code: "REM-002", gapId: "cg-2", requirementId: "cr-4", description: "Finalize weekly vulnerability scan schedule", owner: "Vuln Mgmt Lead", priority: "Critical", dueDate: "2026-09-15", status: "Open", progress: 10 },
  { _id: "cm-3", code: "REM-003", gapId: "cg-3", requirementId: "cr-6", description: "Onboard customer-facing applications into scanning scope", owner: "Vuln Mgmt Lead", priority: "High", dueDate: "2026-10-01", status: "Blocked", progress: 20 },
];

export const COMPLIANCE_FINDINGS = [
  { _id: "cf-1", code: "FND-001", auditId: "AUD-2026-01", requirementId: "cr-4", finding: "Vulnerability scans not performed on schedule", severity: "High", evidenceId: "", auditor: "External ISO Auditor", status: "Open", correctiveAction: "Linked to REM-002", dueDate: "2026-09-15" },
  { _id: "cf-2", code: "FND-002", auditId: "AUD-2026-01", requirementId: "cr-3", finding: "Shared accounts found in production database", severity: "Medium", evidenceId: "", auditor: "Internal Audit Team", status: "Open", correctiveAction: "Linked to REM-001", dueDate: "2026-09-30" },
];

export const COMPLIANCE_CONTROLS = [
  { id: "cc-1", name: "Multi-Factor Authentication (MFA)" },
  { id: "cc-2", name: "Web Application Firewall (WAF)" },
  { id: "cc-3", name: "Least Privilege Access (RBAC)" },
  { id: "cc-4", name: "Automated Vulnerability Scanning" },
];

export const COMPLIANCE_RISKS = [
  { id: "rk-1", name: "Unauthorized access to customer data" },
  { id: "rk-2", name: "Web portal compromise via injection" },
  { id: "rk-3", name: "Privilege escalation by internal users" },
  { id: "rk-4", name: "Unpatched infrastructure exploitation" },
];

export const COMPLIANCE_POLICIES = [
  { id: "pol-1", name: "Access Control Policy" },
  { id: "pol-2", name: "Network Security Policy" },
  { id: "pol-3", name: "Vulnerability Management Policy" },
];

export const COMPLIANCE_ASSETS = [
  { id: "ast-1", name: "Corporate VPN Gateway" },
  { id: "ast-2", name: "Customer Web Portal" },
  { id: "ast-3", name: "Employee Directory (AD)" },
  { id: "ast-4", name: "Core Banking Database" },
  { id: "ast-5", name: "Internal File Server" },
];

export const COMPLIANCE_AUDITS = [
  { id: "AUD-2026-01", name: "Q1 2026 Internal Security Audit" },
  { id: "AUD-2025-04", name: "Annual ISO 27001 Surveillance Audit" },
];

function complianceScore(requirements) {
  const scored = requirements.filter((r) => r.status !== "NotApplicable" && r.status !== "NotAssessed");
  if (scored.length === 0) return 0;
  const points = { Compliant: 100, PartiallyCompliant: 50, NonCompliant: 0 };
  const total = scored.reduce((s, r) => s + (points[r.status] ?? 0), 0);
  return Math.round(total / scored.length);
}

function getName(list, id) {
  return list.find((x) => x.id === id || x._id === id)?.name || id?.slice(0, 8) || "—";
}

export function getComplianceDashboard() {
  const kpis = {
    overallScore: complianceScore(COMPLIANCE_REQUIREMENTS),
    compliantCount: COMPLIANCE_REQUIREMENTS.filter((r) => r.status === "Compliant").length,
    partialCount: COMPLIANCE_REQUIREMENTS.filter((r) => r.status === "PartiallyCompliant").length,
    nonCompliantCount: COMPLIANCE_REQUIREMENTS.filter((r) => r.status === "NonCompliant").length,
    openGaps: COMPLIANCE_GAPS.filter((g) => !["Resolved", "Closed"].includes(g.status)).length,
    missingEvidence: COMPLIANCE_EVIDENCE.filter((e) => ["Missing", "Requested", "Expired", "Rejected"].includes(e.status)).length,
    overdueRemediation: COMPLIANCE_REMEDIATION.filter((r) => r.dueDate && !["Completed", "Cancelled"].includes(r.status) && new Date(r.dueDate) < new Date()).length,
  };

  const byFramework = COMPLIANCE_FRAMEWORKS.map((f) => ({
    frameworkId: f._id, frameworkName: f.name, code: f.code,
    score: complianceScore(COMPLIANCE_REQUIREMENTS.filter((r) => r.frameworkId === f._id)),
  }));

  const statusDistribution = [
    { label: "Compliant", value: kpis.compliantCount, color: "#3fbf6a" },
    { label: "Partially Compliant", value: kpis.partialCount, color: "#e0b23d" },
    { label: "Non-Compliant", value: kpis.nonCompliantCount, color: "#e2584f" },
    { label: "Not Applicable", value: COMPLIANCE_REQUIREMENTS.filter((r) => r.status === "NotApplicable").length, color: "#7d7d86" },
    { label: "Not Assessed", value: COMPLIANCE_REQUIREMENTS.filter((r) => r.status === "NotAssessed").length, color: "#7c8ff0" },
  ].filter((s) => s.value > 0);

  const gapsBySeverity = ["Critical", "High", "Medium", "Low"].map((sev) => ({
    label: sev, value: COMPLIANCE_GAPS.filter((g) => g.severity === sev).length,
  }));

  const remediationProgress = COMPLIANCE_REMEDIATION.map((r) => ({ label: r.code, value: r.progress }));

  return { kpis, byFramework, statusDistribution, gapsBySeverity, remediationProgress };
}

export default {
  COMPLIANCE_FRAMEWORKS, COMPLIANCE_REQUIREMENTS, COMPLIANCE_ASSESSMENTS,
  COMPLIANCE_EVIDENCE, COMPLIANCE_GAPS, COMPLIANCE_REMEDIATION, COMPLIANCE_FINDINGS,
  COMPLIANCE_CONTROLS, COMPLIANCE_RISKS, COMPLIANCE_POLICIES, COMPLIANCE_ASSETS, COMPLIANCE_AUDITS,
  getComplianceDashboard, getName, complianceScore,
};
