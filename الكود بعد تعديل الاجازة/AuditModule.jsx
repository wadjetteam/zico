import React, { useState, useMemo } from "react";
import {
  LayoutGrid, Landmark, Shield, ShieldCheck, ClipboardList, Boxes, Sparkles,
  BarChart3, Settings, Search, HelpCircle, ChevronRight, ChevronDown, X,
  Plus, Filter as FilterIcon, ArrowUpDown, Pencil, Link2, CheckCircle2,
  Clock, CircleDashed, AlertTriangle, Building2, Menu, Trash2, Eye,
  FileText, Layers, Map as MapIcon, FolderCheck, AlertOctagon, Wrench,
  FileBarChart2, Gavel, Upload, Download, RefreshCw, ArrowRight,
  BadgeCheck, MinusCircle, XCircle, HelpCircle as UnknownIcon, Archive,
  CalendarClock, CalendarCheck2, PlayCircle, Users, ClipboardCheck,
  FileSearch, History as HistoryIcon, ListChecks, ShieldAlert, FileCheck2,
  CircleSlash, Send, Inbox, GitBranch, Target, ArrowLeft, PlusCircle,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  DESIGN TOKENS — identical system to Compliance / Control Management     */
/* ---------------------------------------------------------------------- */
const T = {
  bg: "#0b0b0d",
  sidebarBg: "#0e0e11",
  panelBg: "#141417",
  panelBorder: "#232327",
  cardBg: "#0f0f12",
  rowHover: "#101013",
  inputBg: "#0c0c0f",
  textPrimary: "#f2f2f0",
  textSecondary: "#8c8c94",
  textMuted: "#5c5c64",
  accent: "#d9ad4f",
  accentSoft: "rgba(217,173,79,0.14)",
  green: "#3fbf6a",
  greenSoft: "rgba(63,191,106,0.14)",
  amber: "#e0b23d",
  amberSoft: "rgba(224,178,61,0.14)",
  grey: "#7d7d86",
  greySoft: "rgba(125,125,134,0.14)",
  red: "#e2584f",
  redSoft: "rgba(226,88,79,0.14)",
  blue: "#7c8ff0",
  blueSoft: "rgba(124,143,240,0.14)",
  purple: "#b183e0",
  purpleSoft: "rgba(177,131,224,0.14)",
};
const FONT_STACK =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const TODAY = new Date("2026-08-23");

/* ---------------------------------------------------------------------- */
/*  STUBS FOR EXISTING WADJET-GRC MODULES                                  */
/*  Stand in for the real Compliance / Control / Risk / Policy / Asset     */
/*  stores. Swap for real selectors/services when wired into the app.     */
/* ---------------------------------------------------------------------- */
const EXISTING_FRAMEWORKS = [
  { id: "FRW-001", name: "ISO/IEC 27001:2022" },
  { id: "FRW-002", name: "CBE Cybersecurity Framework" },
  { id: "FRW-003", name: "PCI DSS v4.0" },
];
const EXISTING_REQUIREMENTS = [
  { id: "REQ-101", title: "Authentication information management", frameworkId: "FRW-001", mappedControls: ["CTL-001"], relatedPolicies: ["POL-002"] },
  { id: "REQ-102", title: "Network security controls", frameworkId: "FRW-001", mappedControls: ["CTL-002"], relatedPolicies: ["POL-005"] },
  { id: "REQ-103", title: "Access control policy and least privilege", frameworkId: "FRW-001", mappedControls: ["CTL-003"], relatedPolicies: ["POL-002"] },
  { id: "REQ-104", title: "Management of technical vulnerabilities", frameworkId: "FRW-001", mappedControls: ["CTL-004"], relatedPolicies: ["POL-009"] },
  { id: "REQ-301", title: "Protect cardholder data with network segmentation", frameworkId: "FRW-003", mappedControls: ["CTL-002"], relatedPolicies: ["POL-005"] },
  { id: "REQ-302", title: "Restrict access to cardholder data by need to know", frameworkId: "FRW-003", mappedControls: ["CTL-003"], relatedPolicies: ["POL-002"] },
];
const EXISTING_CONTROLS = [
  { id: "CTL-001", name: "Multi-Factor Authentication (MFA)" },
  { id: "CTL-002", name: "Web Application Firewall (WAF)" },
  { id: "CTL-003", name: "Least Privilege Access (RBAC)" },
  { id: "CTL-004", name: "Automated Vulnerability Scanning" },
];
const EXISTING_RISKS = [
  { id: "RSK-014", name: "Unauthorized access to customer data" },
  { id: "RSK-022", name: "Web portal compromise via injection" },
  { id: "RSK-031", name: "Privilege escalation by internal users" },
  { id: "RSK-045", name: "Unpatched infrastructure exploitation" },
];
const EXISTING_POLICIES = [
  { id: "POL-002", name: "Access Control Policy" },
  { id: "POL-005", name: "Network Security Policy" },
  { id: "POL-009", name: "Vulnerability Management Policy" },
];
const EXISTING_ASSETS = [
  { id: "AST-001", name: "Corporate VPN Gateway" },
  { id: "AST-002", name: "Customer Web Portal" },
  { id: "AST-003", name: "Employee Directory (AD)" },
  { id: "AST-004", name: "Core Banking Database" },
  { id: "AST-005", name: "Payment Gateway" },
  { id: "AST-006", name: "POS Terminal Fleet" },
  { id: "AST-007", name: "Internal File Server" },
];
const AUDITORS = ["Omar Farid", "Nourhan Adel", "Marwa Hassan", "External ISO Auditor"];

const byId = (list, id) => list.find((x) => x.id === id);
const nameOf = (list, id) => byId(list, id)?.name || byId(list, id)?.title || id;

/* ---------------------------------------------------------------------- */
/*  ENUMS                                                                   */
/* ---------------------------------------------------------------------- */
const AUDIT_TYPES = ["Internal Audit", "External Audit", "Compliance Audit", "Control Effectiveness Audit", "Risk-Based Audit", "Follow-up Audit"];
const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const PLAN_STATUSES = ["Draft", "Planned", "Approved", "Scheduled", "Cancelled"];
const AUDIT_STATUSES = ["Planned", "Scheduled", "In Progress", "Under Review", "Completed", "Cancelled"];
const TEST_RESULTS = ["Conformity", "Partial Conformity", "Non-Conformity", "Observation", "Not Applicable", "Not Tested"];
const EVIDENCE_TYPES = ["Document", "Screenshot", "Log Export", "Policy", "Ticket / Record", "Attestation"];
const EVIDENCE_REQ_STATUSES = ["Requested", "Submitted", "Under Review", "Accepted", "Rejected", "Overdue", "Cancelled"];
const FINDING_SEVERITIES = ["Critical", "High", "Medium", "Low", "Observation"];
const FINDING_STATUSES = ["Open", "Assigned", "In Progress", "Pending Verification", "Resolved", "Closed", "Accepted"];
const CA_STATUSES = ["Open", "Assigned", "In Progress", "Blocked", "Pending Verification", "Verified", "Closed", "Overdue", "Cancelled"];
const OVERALL_RESULTS = ["Effective", "Partially Effective", "Ineffective", "Not Conclusive"];

/* ---------------------------------------------------------------------- */
/*  SEED DATA                                                               */
/* ---------------------------------------------------------------------- */
const SEED_PLANS = [
  {
    id: "AP-2026-01",
    name: "Q4 2026 Third-Party Vendor Risk Audit",
    type: "Risk-Based Audit",
    objective: "Assess third-party vendor security controls against contractual and regulatory obligations.",
    plannedStart: "2026-10-01",
    plannedEnd: "2026-10-20",
    owner: "CISO",
    leadAuditor: "Nourhan Adel",
    auditors: ["Nourhan Adel"],
    auditee: "Vendor Management Office",
    department: "Procurement",
    frameworkId: "FRW-002",
    priority: "High",
    status: "Draft",
    description: "Annual review of critical third-party vendors' security posture and contractual compliance.",
  },
  {
    id: "AP-2026-02",
    name: "Annual PCI DSS Recertification Audit",
    type: "Compliance Audit",
    objective: "Confirm continued PCI DSS v4.0 compliance ahead of annual recertification.",
    plannedStart: "2026-11-01",
    plannedEnd: "2026-11-15",
    owner: "Compliance Manager",
    leadAuditor: "Omar Farid",
    auditors: ["Omar Farid", "Marwa Hassan"],
    auditee: "Payments Team",
    department: "Finance Technology",
    frameworkId: "FRW-003",
    priority: "Critical",
    status: "Approved",
    description: "Full recertification audit of the cardholder data environment.",
  },
  {
    id: "AP-2026-03",
    name: "Q4 2026 ISO 27001 Follow-up Audit",
    type: "Follow-up Audit",
    objective: "Verify closure of findings raised during the 2025 ISO 27001 surveillance audit.",
    plannedStart: "2026-11-01",
    plannedEnd: "2026-11-10",
    owner: "CISO",
    leadAuditor: "Nourhan Adel",
    auditors: ["Nourhan Adel"],
    auditee: "Information Security",
    department: "Information Technology",
    frameworkId: "FRW-001",
    priority: "Medium",
    status: "Scheduled",
    description: "Follow-up on AUD-2025-04 findings and corrective action verification.",
  },
];

const SEED_AUDITS = [
  {
    id: "AUD-2026-01",
    planId: null,
    name: "Q3 2026 ISO 27001 Internal Audit",
    type: "Internal Audit",
    objective: "Evaluate the effectiveness of ISO/IEC 27001:2022 controls across IT Operations.",
    owner: "CISO",
    leadAuditor: "Omar Farid",
    team: ["Omar Farid", "Nourhan Adel"],
    auditee: "IT Operations",
    department: "Information Technology",
    frameworkId: "FRW-001",
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    status: "In Progress",
    overallResult: "Not Conclusive",
    followUpOfAuditId: null,
  },
  {
    id: "AUD-2026-02",
    planId: null,
    name: "PCI DSS v4.0 Compliance Audit",
    type: "Compliance Audit",
    objective: "Verify cardholder data environment controls meet PCI DSS v4.0 requirements.",
    owner: "Compliance Manager",
    leadAuditor: "Marwa Hassan",
    team: ["Marwa Hassan"],
    auditee: "Payments Team",
    department: "Finance Technology",
    frameworkId: "FRW-003",
    startDate: "2026-06-01",
    endDate: "2026-06-20",
    status: "Completed",
    overallResult: "Partially Effective",
    followUpOfAuditId: null,
  },
  {
    id: "AUD-2025-04",
    planId: null,
    name: "Annual ISO 27001 Surveillance Audit",
    type: "External Audit",
    objective: "External surveillance audit for ISO/IEC 27001:2022 certification maintenance.",
    owner: "CISO",
    leadAuditor: "External ISO Auditor",
    team: ["External ISO Auditor"],
    auditee: "Information Security",
    department: "Information Technology",
    frameworkId: "FRW-001",
    startDate: "2025-11-01",
    endDate: "2025-11-10",
    status: "Completed",
    overallResult: "Effective",
    followUpOfAuditId: null,
  },
  {
    id: "AUD-2026-03",
    planId: "AP-2026-03",
    name: "Q4 2026 ISO 27001 Follow-up Audit",
    type: "Follow-up Audit",
    objective: "Verify closure of findings raised during the 2025 surveillance audit.",
    owner: "CISO",
    leadAuditor: "Nourhan Adel",
    team: ["Nourhan Adel"],
    auditee: "Information Security",
    department: "Information Technology",
    frameworkId: "FRW-001",
    startDate: "2026-11-01",
    endDate: "2026-11-10",
    status: "Planned",
    overallResult: "Not Conclusive",
    followUpOfAuditId: "AUD-2025-04",
  },
];

const SEED_SCOPE = {
  "AUD-2026-01": {
    organization: "Wadjet Financial Holding",
    department: "Information Technology",
    businessUnit: "IT Operations",
    location: "Cairo HQ",
    assets: ["AST-001", "AST-003", "AST-004"],
    frameworks: ["FRW-001"],
    requirements: ["REQ-101", "REQ-102", "REQ-103", "REQ-104"],
    controls: ["CTL-001", "CTL-002", "CTL-003", "CTL-004"],
    policies: ["POL-002", "POL-005", "POL-009"],
  },
  "AUD-2026-02": {
    organization: "Wadjet Financial Holding",
    department: "Finance Technology",
    businessUnit: "Payments",
    location: "Cairo HQ",
    assets: ["AST-002", "AST-005", "AST-006"],
    frameworks: ["FRW-003"],
    requirements: ["REQ-301", "REQ-302"],
    controls: ["CTL-002", "CTL-003"],
    policies: ["POL-002", "POL-005"],
  },
  "AUD-2025-04": {
    organization: "Wadjet Financial Holding",
    department: "Information Technology",
    businessUnit: "Information Security",
    location: "Cairo HQ",
    assets: ["AST-003", "AST-004"],
    frameworks: ["FRW-001"],
    requirements: ["REQ-101", "REQ-103"],
    controls: ["CTL-001", "CTL-003"],
    policies: ["POL-002"],
  },
  "AUD-2026-03": {
    organization: "Wadjet Financial Holding",
    department: "Information Technology",
    businessUnit: "Information Security",
    location: "Cairo HQ",
    assets: ["AST-004"],
    frameworks: ["FRW-001"],
    requirements: ["REQ-103"],
    controls: ["CTL-003"],
    policies: ["POL-002"],
  },
};

const SEED_CHECKLIST = [
  { id: "CHK-001", auditId: "AUD-2026-01", requirementId: "REQ-101", controlId: "CTL-001", testObjective: "Confirm MFA is enforced for all privileged and remote access.", testProcedure: "Sample 10 privileged accounts and review IAM logs for MFA challenge events.", auditor: "Omar Farid", testDate: "2026-08-10", result: "Conformity", evidenceIds: ["EVR-001"], comment: "All sampled accounts enforced MFA without exception.", reviewStatus: "Reviewed" },
  { id: "CHK-002", auditId: "AUD-2026-01", requirementId: "REQ-103", controlId: "CTL-003", testObjective: "Verify least-privilege access is enforced on the core banking database.", testProcedure: "Review the access matrix against job roles for the core banking database.", auditor: "Nourhan Adel", testDate: "2026-08-12", result: "Non-Conformity", evidenceIds: ["EVR-002"], comment: "Shared service accounts remain active; access matrix incomplete.", reviewStatus: "Pending Review" },
  { id: "CHK-003", auditId: "AUD-2026-01", requirementId: "REQ-104", controlId: "CTL-004", testObjective: "Confirm weekly vulnerability scans are performed across in-scope infrastructure.", testProcedure: "Review scan schedule and the last four scan reports.", auditor: "Omar Farid", testDate: "", result: "Not Tested", evidenceIds: [], comment: "", reviewStatus: "Not Started" },
  { id: "CHK-004", auditId: "AUD-2026-01", requirementId: "REQ-102", controlId: "CTL-002", testObjective: "Confirm WAF ruleset is reviewed on a quarterly cadence.", testProcedure: "Review WAF change log and last review sign-off.", auditor: "Nourhan Adel", testDate: "2026-08-14", result: "Partial Conformity", evidenceIds: ["EVR-004"], comment: "WAF rules active but not reviewed quarterly as required.", reviewStatus: "Reviewed" },
  { id: "CHK-101", auditId: "AUD-2026-02", requirementId: "REQ-301", controlId: "CTL-002", testObjective: "Verify network segmentation isolates the cardholder data environment.", testProcedure: "Review firewall rules and segmentation test results.", auditor: "Marwa Hassan", testDate: "2026-06-08", result: "Partial Conformity", evidenceIds: [], comment: "Segmentation largely in place; one flat VLAN identified for POS terminals.", reviewStatus: "Reviewed" },
  { id: "CHK-102", auditId: "AUD-2026-02", requirementId: "REQ-302", controlId: "CTL-003", testObjective: "Confirm access to cardholder data is restricted by business need to know.", testProcedure: "Review role-based access assignments for the payment gateway.", auditor: "Marwa Hassan", testDate: "2026-06-10", result: "Conformity", evidenceIds: [], comment: "Access restricted appropriately; no exceptions found.", reviewStatus: "Reviewed" },
  { id: "CHK-201", auditId: "AUD-2025-04", requirementId: "REQ-101", controlId: "CTL-001", testObjective: "Confirm MFA enforcement across staff and remote sessions.", testProcedure: "Sample IAM logs.", auditor: "External ISO Auditor", testDate: "2025-11-03", result: "Conformity", evidenceIds: [], comment: "No exceptions found.", reviewStatus: "Reviewed" },
  { id: "CHK-202", auditId: "AUD-2025-04", requirementId: "REQ-103", controlId: "CTL-003", testObjective: "Verify least-privilege access on the core banking database.", testProcedure: "Review access matrix.", auditor: "External ISO Auditor", testDate: "2025-11-05", result: "Non-Conformity", evidenceIds: [], comment: "Legacy shared accounts identified during access review.", reviewStatus: "Reviewed" },
];

const SEED_EVIDENCE_REQUESTS = [
  { id: "EVR-001", auditId: "AUD-2026-01", requirementId: "REQ-101", controlId: "CTL-001", description: "MFA enforcement logs for privileged accounts – August 2026.", evidenceType: "Log Export", requestedFrom: "IAM Manager", requestedBy: "Omar Farid", requestDate: "2026-08-05", dueDate: "2026-08-09", status: "Accepted", evidenceName: "IAM_MFA_Logs_Aug2026.csv", reviewer: "Omar Farid", reviewerComments: "Confirms full MFA coverage across sampled accounts." },
  { id: "EVR-002", auditId: "AUD-2026-01", requirementId: "REQ-103", controlId: "CTL-003", description: "Current access matrix for the core banking database.", evidenceType: "Document", requestedFrom: "IT Operations Manager", requestedBy: "Nourhan Adel", requestDate: "2026-08-06", dueDate: "2026-08-11", status: "Under Review", evidenceName: "DB_Access_Matrix.xlsx", reviewer: "Nourhan Adel", reviewerComments: "Matrix incomplete; following up with the asset owner." },
  { id: "EVR-003", auditId: "AUD-2026-01", requirementId: "REQ-104", controlId: "CTL-004", description: "Latest four vulnerability scan reports for in-scope infrastructure.", evidenceType: "Document", requestedFrom: "Vulnerability Management Lead", requestedBy: "Omar Farid", requestDate: "2026-08-14", dueDate: "2026-08-20", status: "Overdue", evidenceName: "", reviewer: "", reviewerComments: "" },
  { id: "EVR-004", auditId: "AUD-2026-01", requirementId: "REQ-102", controlId: "CTL-002", description: "WAF rule review schedule and change log.", evidenceType: "Log Export", requestedFrom: "Network Security Lead", requestedBy: "Omar Farid", requestDate: "2026-08-13", dueDate: "2026-08-18", status: "Submitted", evidenceName: "WAF_Change_Log.pdf", reviewer: "Omar Farid", reviewerComments: "" },
  { id: "EVR-005", auditId: "AUD-2026-02", requirementId: "REQ-301", controlId: "CTL-002", description: "Network segmentation test report for the CDE.", evidenceType: "Document", requestedFrom: "Network Security Lead", requestedBy: "Marwa Hassan", requestDate: "2026-06-03", dueDate: "2026-06-07", status: "Accepted", evidenceName: "Segmentation_Test_Report_Q2.pdf", reviewer: "Marwa Hassan", reviewerComments: "Confirms segmentation with one noted exception." },
];

const SEED_FINDINGS = [
  { id: "FND-A-001", auditId: "AUD-2026-01", checklistItemId: "CHK-002", requirementId: "REQ-103", controlId: "CTL-003", description: "Shared privileged service accounts remain active on the core banking database, contrary to least-privilege requirements.", evidenceRequestId: "EVR-002", rootCause: "Legacy migration incomplete; no owner assigned to decommission shared accounts.", impact: "Increased risk of unauthorized, untraceable access to customer financial data.", riskId: "RSK-031", severity: "High", recommendation: "Migrate all shared accounts to named, role-based accounts within 60 days.", owner: "IT Operations Manager", dueDate: "2026-09-30", status: "In Progress" },
  { id: "FND-A-002", auditId: "AUD-2026-01", checklistItemId: "CHK-004", requirementId: "REQ-102", controlId: "CTL-002", description: "WAF ruleset has not been reviewed on the required quarterly cadence.", evidenceRequestId: "EVR-004", rootCause: "No calendarized review process or assigned owner.", impact: "Outdated rules may not address newly disclosed attack patterns.", riskId: "RSK-022", severity: "Medium", recommendation: "Assign WAF review ownership and implement a quarterly review checklist.", owner: "Network Security Lead", dueDate: "2026-10-15", status: "Open" },
  { id: "FND-B-001", auditId: "AUD-2025-04", checklistItemId: "CHK-202", requirementId: "REQ-103", controlId: "CTL-003", description: "Legacy shared accounts identified on the core banking database during access review.", evidenceRequestId: null, rootCause: "Incomplete decommissioning of legacy service accounts.", impact: "Reduced traceability of privileged database access.", riskId: "RSK-031", severity: "Medium", recommendation: "Complete migration to named accounts and verify via follow-up audit.", owner: "IT Operations Manager", dueDate: "2026-09-30", status: "Closed" },
  { id: "FND-C-001", auditId: "AUD-2026-02", checklistItemId: "CHK-101", requirementId: "REQ-301", controlId: "CTL-002", description: "POS terminal fleet shares a flat network segment with other retail systems.", evidenceRequestId: "EVR-005", rootCause: "Segmentation project for POS terminals was deprioritized.", impact: "Potential lateral movement into the cardholder data environment.", riskId: "RSK-022", severity: "High", recommendation: "Isolate POS terminals onto a dedicated, firewalled VLAN.", owner: "Network Security Lead", dueDate: "2026-08-01", status: "Closed" },
];

const SEED_CORRECTIVE_ACTIONS = [
  { id: "CA-001", findingId: "FND-A-001", auditId: "AUD-2026-01", requirementId: "REQ-103", controlId: "CTL-003", description: "Migrate shared database service accounts to named, least-privilege accounts.", owner: "IT Operations Manager", priority: "High", dueDate: "2026-09-30", status: "In Progress", progress: 55, completionDate: "", verification: "Pending", reviewerComments: "Awaiting evidence of completed migration for the remaining 6 accounts." },
  { id: "CA-002", findingId: "FND-A-002", auditId: "AUD-2026-01", requirementId: "REQ-102", controlId: "CTL-002", description: "Establish and document a quarterly WAF rule review process.", owner: "Network Security Lead", priority: "Medium", dueDate: "2026-10-15", status: "Open", progress: 0, completionDate: "", verification: "Not Started", reviewerComments: "" },
  { id: "CA-003", findingId: "FND-B-001", auditId: "AUD-2025-04", requirementId: "REQ-103", controlId: "CTL-003", description: "Complete migration of legacy shared database accounts to named accounts.", owner: "IT Operations Manager", priority: "Medium", dueDate: "2026-09-30", status: "Verified", progress: 100, completionDate: "2026-08-01", verification: "Verified", reviewerComments: "Confirmed via follow-up access review; no shared accounts remain." },
  { id: "CA-004", findingId: "FND-C-001", auditId: "AUD-2026-02", requirementId: "REQ-301", controlId: "CTL-002", description: "Migrate POS terminal fleet onto a dedicated, firewalled VLAN.", owner: "Network Security Lead", priority: "High", dueDate: "2026-08-01", status: "Closed", progress: 100, completionDate: "2026-07-28", verification: "Verified", reviewerComments: "Segmentation re-tested and confirmed effective." },
];

const SEED_HISTORY = [
  { id: "HST-001", auditId: "AUD-2026-01", user: "CISO", action: "Audit created", when: "2026-07-20", prev: "", next: "Planned" },
  { id: "HST-002", auditId: "AUD-2026-01", user: "Omar Farid", action: "Audit scope defined", when: "2026-07-25", prev: "", next: "4 requirements, 4 controls, 3 assets" },
  { id: "HST-003", auditId: "AUD-2026-01", user: "Omar Farid", action: "Audit status changed", when: "2026-08-01", prev: "Scheduled", next: "In Progress" },
  { id: "HST-004", auditId: "AUD-2026-01", user: "Nourhan Adel", action: "Checklist item tested (CHK-002)", when: "2026-08-12", prev: "Not Tested", next: "Non-Conformity" },
  { id: "HST-005", auditId: "AUD-2026-01", user: "Nourhan Adel", action: "Finding created (FND-A-001)", when: "2026-08-12", prev: "", next: "High severity" },
  { id: "HST-006", auditId: "AUD-2026-01", user: "IT Operations Manager", action: "Corrective action progress updated (CA-001)", when: "2026-08-20", prev: "20%", next: "55%" },
  { id: "HST-007", auditId: "AUD-2026-02", user: "Compliance Manager", action: "Audit created", when: "2026-05-15", prev: "", next: "Planned" },
  { id: "HST-008", auditId: "AUD-2026-02", user: "Marwa Hassan", action: "Audit completed", when: "2026-06-20", prev: "Under Review", next: "Completed" },
  { id: "HST-009", auditId: "AUD-2025-04", user: "External ISO Auditor", action: "Audit completed", when: "2025-11-10", prev: "Under Review", next: "Completed" },
  { id: "HST-010", auditId: "AUD-2025-04", user: "IT Operations Manager", action: "Corrective action verified (CA-003)", when: "2026-08-01", prev: "Pending Verification", next: "Verified" },
];

/* ---------------------------------------------------------------------- */
/*  BUSINESS LOGIC                                                         */
/* ---------------------------------------------------------------------- */
// Overall audit result derived from checklist results + open findings —
// never hard-coded. Configurable thresholds live here in one place.
function computeOverallResult(auditId, checklist, findings) {
  const items = checklist.filter((c) => c.auditId === auditId && c.result !== "Not Applicable");
  const tested = items.filter((c) => c.result !== "Not Tested");
  if (tested.length === 0) return "Not Conclusive";
  if (tested.length < items.length) return "Not Conclusive";

  const openCritical = findings.some(
    (f) => f.auditId === auditId && f.severity === "Critical" && !["Resolved", "Closed", "Accepted"].includes(f.status)
  );
  const nonConformities = tested.filter((c) => c.result === "Non-Conformity").length;
  const partial = tested.filter((c) => c.result === "Partial Conformity").length;
  const ratio = (nonConformities + partial * 0.5) / tested.length;

  if (openCritical || ratio > 0.4) return "Ineffective";
  if (ratio > 0.15) return "Partially Effective";
  return "Effective";
}

const isOverdue = (dueDate, status, doneStatuses) =>
  dueDate && !doneStatuses.includes(status) && new Date(dueDate) < TODAY;

const planStatusMeta = (s) => {
  switch (s) {
    case "Approved":
    case "Scheduled":
      return { color: T.green, bg: T.greenSoft };
    case "Planned":
      return { color: T.blue, bg: T.blueSoft };
    case "Cancelled":
      return { color: T.red, bg: T.redSoft };
    default:
      return { color: T.grey, bg: T.greySoft };
  }
};
const auditStatusMeta = (s) => {
  switch (s) {
    case "Completed":
      return { color: T.green, bg: T.greenSoft, Icon: CheckCircle2 };
    case "In Progress":
      return { color: T.amber, bg: T.amberSoft, Icon: PlayCircle };
    case "Under Review":
      return { color: T.purple, bg: T.purpleSoft, Icon: FileSearch };
    case "Scheduled":
      return { color: T.blue, bg: T.blueSoft, Icon: CalendarClock };
    case "Cancelled":
      return { color: T.red, bg: T.redSoft, Icon: XCircle };
    default:
      return { color: T.grey, bg: T.greySoft, Icon: CircleDashed };
  }
};
const resultMeta = (r) => {
  switch (r) {
    case "Conformity":
      return { color: T.green, bg: T.greenSoft };
    case "Partial Conformity":
    case "Observation":
      return { color: T.amber, bg: T.amberSoft };
    case "Non-Conformity":
      return { color: T.red, bg: T.redSoft };
    case "Not Applicable":
      return { color: T.grey, bg: T.greySoft };
    default:
      return { color: T.blue, bg: T.blueSoft };
  }
};
const overallResultMeta = (r) => {
  switch (r) {
    case "Effective":
      return { color: T.green, bg: T.greenSoft };
    case "Partially Effective":
      return { color: T.amber, bg: T.amberSoft };
    case "Ineffective":
      return { color: T.red, bg: T.redSoft };
    default:
      return { color: T.grey, bg: T.greySoft };
  }
};
const evReqStatusMeta = (s) => {
  switch (s) {
    case "Accepted":
      return { color: T.green, bg: T.greenSoft };
    case "Submitted":
    case "Under Review":
    case "Requested":
      return { color: T.amber, bg: T.amberSoft };
    case "Rejected":
    case "Overdue":
      return { color: T.red, bg: T.redSoft };
    default:
      return { color: T.grey, bg: T.greySoft };
  }
};
const severityMeta = (sev) => {
  switch (sev) {
    case "Critical":
      return { color: T.red, bg: T.redSoft };
    case "High":
      return { color: "#e28a4f", bg: "rgba(226,138,79,0.14)" };
    case "Medium":
      return { color: T.amber, bg: T.amberSoft };
    case "Low":
      return { color: T.blue, bg: T.blueSoft };
    default:
      return { color: T.grey, bg: T.greySoft };
  }
};
const findingStatusMeta = (s) => {
  switch (s) {
    case "Resolved":
    case "Closed":
    case "Accepted":
      return { color: T.green, bg: T.greenSoft };
    case "In Progress":
    case "Pending Verification":
      return { color: T.amber, bg: T.amberSoft };
    default:
      return { color: T.red, bg: T.redSoft };
  }
};
const caStatusMeta = (s) => {
  switch (s) {
    case "Verified":
    case "Closed":
      return { color: T.green, bg: T.greenSoft };
    case "In Progress":
    case "Pending Verification":
    case "Assigned":
      return { color: T.amber, bg: T.amberSoft };
    case "Blocked":
    case "Overdue":
    case "Cancelled":
      return { color: T.red, bg: T.redSoft };
    default:
      return { color: T.grey, bg: T.greySoft };
  }
};

/* ---------------------------------------------------------------------- */
/*  SHARED PRIMITIVES (identical language to Compliance / Control modules) */
/* ---------------------------------------------------------------------- */
const inputStyle = (extra = {}) => ({
  background: T.inputBg,
  border: `1px solid ${T.panelBorder}`,
  borderRadius: 8,
  color: T.textPrimary,
  fontSize: 12.5,
  padding: "9px 11px",
  outline: "none",
  fontFamily: FONT_STACK,
  width: "100%",
  boxSizing: "border-box",
  ...extra,
});
const selectStyle = (extra = {}) => ({ ...inputStyle(extra), appearance: "auto" });
const iconBtnStyle = {
  border: `1px solid ${T.panelBorder}`,
  background: T.inputBg,
  borderRadius: 7,
  padding: 8,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const primaryBtnStyle = {
  background: T.accent,
  color: "#1a1508",
  border: "none",
  borderRadius: 8,
  padding: "9px 16px",
  fontSize: 12.5,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
};
const secondaryBtnStyle = {
  background: "transparent",
  color: T.textSecondary,
  border: `1px solid ${T.panelBorder}`,
  borderRadius: 8,
  padding: "9px 16px",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};
const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  justifyContent: "flex-end",
  zIndex: 100,
};
const drawerStyle = {
  height: "100%",
  background: T.panelBg,
  borderLeft: `1px solid ${T.panelBorder}`,
  display: "flex",
  flexDirection: "column",
  boxShadow: "-12px 0 32px rgba(0,0,0,0.4)",
};
const drawerHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 24px",
  borderBottom: `1px solid ${T.panelBorder}`,
};
const drawerFooterStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  padding: "16px 24px",
  borderTop: `1px solid ${T.panelBorder}`,
};

function Badge({ label, color, bg, Icon }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, background: bg, color, fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap" }}>
      {Icon && <Icon size={11} />}
      {label}
    </span>
  );
}
function Pill({ label, color, bg }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color, background: bg, padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}
function KpiCard({ label, value, Icon, iconColor, iconBg, sub, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12, minWidth: 0, cursor: onClick ? "pointer" : "default" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10.5, letterSpacing: 0.6, color: T.textMuted, fontWeight: 600, textTransform: "uppercase" }}>{label}</span>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={13} color={iconColor} />
        </div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: T.textPrimary }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: T.textMuted }}>{sub}</div>}
    </div>
  );
}
function ProgressBar({ value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 100 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 4, background: "#232327", overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 11.5, color: T.textSecondary, width: 30, textAlign: "right" }}>{value}%</span>
    </div>
  );
}
function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: T.accent, margin: "20px 0 10px", paddingBottom: 8, borderBottom: `1px solid ${T.panelBorder}` }}>
      {children}
    </div>
  );
}
function Field({ label, required, children, error }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
      <label style={{ fontSize: 11.5, color: T.textSecondary, fontWeight: 600 }}>
        {label} {required && <span style={{ color: T.red }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: T.red }}>{error}</span>}
    </div>
  );
}
function DetailStat({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: T.textMuted, marginBottom: 5, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}
function DetailRow({ k, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, borderBottom: `1px solid ${T.panelBorder}`, paddingBottom: 8 }}>
      <span style={{ color: T.textMuted }}>{k}</span>
      <span style={{ color: T.textPrimary, textAlign: "right" }}>{v}</span>
    </div>
  );
}
function EmptyState({ label }) {
  return <div style={{ padding: "40px 16px", textAlign: "center", color: T.textMuted, fontSize: 12.5 }}>{label}</div>;
}
function Toolbar({ search, onSearch, placeholder, right, onToggleFilters, activeFilterCount, resultCount, totalCount }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 12px", flex: "1 1 240px", maxWidth: 360 }}>
        <Search size={14} color={T.textMuted} />
        <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} style={{ background: "transparent", border: "none", outline: "none", color: T.textPrimary, fontSize: 12.5, width: "100%", fontFamily: FONT_STACK }} />
      </div>
      {onToggleFilters && (
        <button onClick={onToggleFilters} style={{ ...secondaryBtnStyle, display: "flex", alignItems: "center", gap: 6, color: activeFilterCount ? T.accent : T.textSecondary, borderColor: activeFilterCount ? T.accent : T.panelBorder }}>
          <FilterIcon size={13} />
          Filters
          {activeFilterCount > 0 && <span style={{ background: T.accent, color: "#1a1508", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 6px" }}>{activeFilterCount}</span>}
        </button>
      )}
      {right}
      <div style={{ fontSize: 11.5, color: T.textMuted, marginLeft: "auto" }}>{resultCount} of {totalCount}</div>
    </div>
  );
}
function FilterSelect({ label, value, options, onChange }) {
  return (
    <div>
      {label && <div style={{ fontSize: 10.5, color: T.textMuted, marginBottom: 5, fontWeight: 600 }}>{label}</div>}
      <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle()}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function useSort(defaultKey) {
  const [sort, setSort] = useState({ key: defaultKey, dir: "asc" });
  const toggle = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  const apply = (rows) =>
    rows.slice().sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
    });
  return { sort, toggle, apply };
}
function DataTable({ columns, rows, sort, onSort, onRowClick, renderActions }) {
  return (
    <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ background: "#111114" }}>
              {columns.map((col) => (
                <th key={col.key} onClick={() => !col.noSort && onSort(col.key)} style={{ textAlign: "left", padding: "11px 16px", fontSize: 10.5, letterSpacing: 0.5, textTransform: "uppercase", color: T.textMuted, fontWeight: 700, borderBottom: `1px solid ${T.panelBorder}`, cursor: col.noSort ? "default" : "pointer", whiteSpace: "nowrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {col.label}
                    {!col.noSort && <ArrowUpDown size={10} style={{ opacity: sort.key === col.key ? 1 : 0.3 }} />}
                  </span>
                </th>
              ))}
              {renderActions && <th style={{ padding: "11px 16px", borderBottom: `1px solid ${T.panelBorder}` }} />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length + 1}><EmptyState label="No records match your search or filters." /></td></tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} onClick={() => onRowClick && onRowClick(row)} style={{ borderBottom: `1px solid ${T.panelBorder}`, cursor: onRowClick ? "pointer" : "default" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.rowHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  {columns.map((col) => (
                    <td key={col.key} style={{ padding: "12px 16px", fontSize: 12, verticalAlign: "middle" }}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                  {renderActions && <td style={{ padding: "12px 16px" }} onClick={(e) => e.stopPropagation()}>{renderActions(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function HBarChart({ data, max, colorFn }) {
  const m = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 130, fontSize: 11.5, color: T.textSecondary, flexShrink: 0 }}>{d.label}</div>
          <div style={{ flex: 1, height: 8, background: "#1c1c20", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${(d.value / m) * 100}%`, height: "100%", background: colorFn ? colorFn(d) : T.accent, borderRadius: 4 }} />
          </div>
          <div style={{ width: 40, fontSize: 11.5, color: T.textPrimary, textAlign: "right" }}>{d.value}</div>
        </div>
      ))}
    </div>
  );
}
function DonutChart({ segments, size = 128, centerLabel, centerValue }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${size / 2},${size / 2}) rotate(-90)`}>
          <circle r={r} fill="none" stroke="#1c1c20" strokeWidth={14} />
          {segments.map((seg) => {
            const frac = seg.value / total;
            const dash = frac * c;
            const circle = <circle key={seg.label} r={r} fill="none" stroke={seg.color} strokeWidth={14} strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-offset} strokeLinecap="butt" />;
            offset += dash;
            return circle;
          })}
        </g>
        <text x="50%" y="47%" textAnchor="middle" fontSize="20" fontWeight="700" fill={T.textPrimary}>{centerValue}</text>
        <text x="50%" y="61%" textAnchor="middle" fontSize="9" fill={T.textMuted} letterSpacing="0.5">{centerLabel}</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {segments.map((seg) => (
          <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, display: "inline-block" }} />
            <span style={{ color: T.textSecondary }}>{seg.label}</span>
            <span style={{ color: T.textPrimary, fontWeight: 600 }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function SparkTrend({ points, color }) {
  const w = 320, h = 70;
  const max = Math.max(...points.map((p) => p.value));
  const min = Math.min(...points.map((p) => p.value));
  const range = max - min || 1;
  const stepX = w / (points.length - 1);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${i * stepX} ${h - ((p.value - min) / range) * h}`).join(" ");
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
        <path d={path} fill="none" stroke={color} strokeWidth={2} />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {points.map((p) => <span key={p.label} style={{ fontSize: 9.5, color: T.textMuted }}>{p.label}</span>)}
      </div>
    </div>
  );
}
function ChartCard({ title, children, onExpand }) {
  return (
    <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary, letterSpacing: 0.2 }}>{title}</div>
        {onExpand && <button onClick={onExpand} style={{ ...iconBtnStyle, padding: 6 }} title="View section"><ArrowRight size={12} color={T.textMuted} /></button>}
      </div>
      {children}
    </div>
  );
}
function PageHeading({ title, subtitle, action, back }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          {back && (
            <button onClick={back} style={{ ...secondaryBtnStyle, marginBottom: 10, display: "flex", alignItems: "center", gap: 6, padding: "6px 12px" }}>
              <ArrowLeft size={13} /> Back
            </button>
          )}
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: T.textPrimary }}>{title}</h1>
          <p style={{ fontSize: 12.5, color: T.textMuted, margin: "6px 0 0" }}>{subtitle}</p>
        </div>
        {action}
      </div>
      <div style={{ height: 1, background: T.panelBorder, marginBottom: 22 }} />
    </>
  );
}
function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${T.panelBorder}`, marginBottom: 20, overflowX: "auto" }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            background: "transparent",
            border: "none",
            borderBottom: active === t.key ? `2px solid ${T.accent}` : "2px solid transparent",
            color: active === t.key ? T.accent : T.textSecondary,
            fontSize: 12.5,
            fontWeight: active === t.key ? 700 : 500,
            padding: "10px 14px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            fontFamily: FONT_STACK,
          }}
        >
          {t.label}{typeof t.count === "number" ? ` (${t.count})` : ""}
        </button>
      ))}
    </div>
  );
}
function RelationBlock({ title, items, lookup }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10.5, color: T.textMuted, marginBottom: 6, fontWeight: 600 }}>{title} ({items.length})</div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: T.textMuted }}>None linked.</div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {items.map((id) => (
            <span key={id} style={{ fontSize: 11, background: T.cardBg, border: `1px solid ${T.panelBorder}`, borderRadius: 6, padding: "4px 9px", color: T.textSecondary }}>
              {nameOf(lookup, id)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  PAGE: AUDIT DASHBOARD                                                  */
/* ---------------------------------------------------------------------- */
function AuditDashboard({ data, goTo }) {
  const { plans, audits, checklist, evidenceRequests, findings, correctiveActions } = data;

  const total = audits.length;
  const byStatus = (s) => audits.filter((a) => a.status === s).length;
  const openFindings = findings.filter((f) => !["Resolved", "Closed", "Accepted"].includes(f.status)).length;
  const criticalFindings = findings.filter((f) => f.severity === "Critical" && !["Resolved", "Closed", "Accepted"].includes(f.status)).length;
  const pendingEvidence = evidenceRequests.filter((e) => ["Requested", "Submitted", "Under Review", "Overdue"].includes(e.status)).length;
  const openCA = correctiveActions.filter((c) => !["Verified", "Closed", "Cancelled"].includes(c.status)).length;
  const overdueAudits = audits.filter((a) => isOverdue(a.endDate, a.status, ["Completed", "Cancelled"])).length;

  const statusDonut = ["Planned", "Scheduled", "In Progress", "Under Review", "Completed", "Cancelled"]
    .map((s) => ({ label: s, value: byStatus(s), color: auditStatusMeta(s).color }))
    .filter((s) => s.value > 0);

  const findingsBySeverity = FINDING_SEVERITIES.map((s) => ({ label: s, value: findings.filter((f) => f.severity === s).length }));

  const auditProgress = audits
    .filter((a) => ["In Progress", "Under Review"].includes(a.status))
    .map((a) => {
      const items = checklist.filter((c) => c.auditId === a.id);
      const tested = items.filter((c) => c.result !== "Not Tested").length;
      return { label: a.id, value: items.length ? Math.round((tested / items.length) * 100) : 0 };
    });

  const caByStatus = CA_STATUSES.map((s) => ({ label: s, value: correctiveActions.filter((c) => c.status === s).length })).filter((s) => s.value > 0);

  const trend = [
    { label: "Mar", value: 1 }, { label: "Apr", value: 2 }, { label: "May", value: 2 },
    { label: "Jun", value: 3 }, { label: "Jul", value: 4 }, { label: "Aug", value: openFindings },
  ];

  const recent = [
    { icon: ClipboardCheck, text: "Checklist item CHK-002 tested — Non-Conformity on REQ-103 (AUD-2026-01)", when: "3 days ago" },
    { icon: AlertOctagon, text: "Finding FND-A-001 opened — shared privileged accounts on core banking DB", when: "3 days ago" },
    { icon: Wrench, text: "Corrective action CA-001 progress updated to 55%", when: "1 day ago" },
    { icon: FileCheck2, text: "Corrective action CA-003 verified and closed (AUD-2025-04 follow-up)", when: "3 weeks ago" },
    { icon: CheckCircle2, text: "PCI DSS v4.0 Compliance Audit (AUD-2026-02) completed — Partially Effective", when: "9 weeks ago" },
  ];

  return (
    <div>
      <PageHeading title="Audit Dashboard" subtitle="Enterprise view of audit planning, execution, findings, and corrective action health." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 22 }}>
        <KpiCard label="Total Audits" value={total} Icon={ClipboardList} iconColor={T.accent} iconBg={T.accentSoft} onClick={() => goTo("audits")} />
        <KpiCard label="Planned" value={byStatus("Planned")} Icon={CircleDashed} iconColor={T.grey} iconBg={T.greySoft} />
        <KpiCard label="Scheduled" value={byStatus("Scheduled")} Icon={CalendarClock} iconColor={T.blue} iconBg={T.blueSoft} />
        <KpiCard label="In Progress" value={byStatus("In Progress")} Icon={PlayCircle} iconColor={T.amber} iconBg={T.amberSoft} />
        <KpiCard label="Completed" value={byStatus("Completed")} Icon={CheckCircle2} iconColor={T.green} iconBg={T.greenSoft} />
        <KpiCard label="Overdue Audits" value={overdueAudits} Icon={AlertTriangle} iconColor={T.red} iconBg={T.redSoft} />
        <KpiCard label="Open Findings" value={openFindings} Icon={AlertOctagon} iconColor={T.red} iconBg={T.redSoft} onClick={() => goTo("findings")} />
        <KpiCard label="Critical Findings" value={criticalFindings} Icon={ShieldAlert} iconColor={T.red} iconBg={T.redSoft} onClick={() => goTo("findings")} />
        <KpiCard label="Pending Evidence" value={pendingEvidence} Icon={Inbox} iconColor={T.amber} iconBg={T.amberSoft} onClick={() => goTo("evidence")} />
        <KpiCard label="Open Corrective Actions" value={openCA} Icon={Wrench} iconColor={T.blue} iconBg={T.blueSoft} onClick={() => goTo("corrective")} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16, marginBottom: 16 }}>
        <ChartCard title="Audits by Status" onExpand={() => goTo("audits")}>
          <DonutChart segments={statusDonut} centerValue={total} centerLabel="AUDITS" />
        </ChartCard>
        <ChartCard title="Findings by Severity" onExpand={() => goTo("findings")}>
          <HBarChart data={findingsBySeverity} colorFn={(d) => severityMeta(d.label).color} />
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
        <ChartCard title="Findings Trend Over Time">
          <SparkTrend points={trend} color={T.accent} />
        </ChartCard>
        <ChartCard title="Audit Progress (active audits)" onExpand={() => goTo("audits")}>
          {auditProgress.length ? <HBarChart data={auditProgress} max={100} colorFn={() => T.blue} /> : <EmptyState label="No audits in progress." />}
        </ChartCard>
        <ChartCard title="Corrective Action Status" onExpand={() => goTo("corrective")}>
          <HBarChart data={caByStatus} colorFn={(d) => caStatusMeta(d.label).color} />
        </ChartCard>
      </div>

      <ChartCard title="Recent Activity">
        <div style={{ display: "flex", flexDirection: "column" }}>
          {recent.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < recent.length - 1 ? `1px solid ${T.panelBorder}` : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: T.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <r.icon size={13} color={T.accent} />
              </div>
              <div style={{ fontSize: 12.5, color: T.textPrimary, flex: 1 }}>{r.text}</div>
              <div style={{ fontSize: 11, color: T.textMuted, whiteSpace: "nowrap" }}>{r.when}</div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  PAGE: AUDIT PLANS                                                      */
/* ---------------------------------------------------------------------- */
function AuditPlansPage({ data, setData, goTo }) {
  const { plans, audits } = data;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const { sort, toggle, apply } = useSort("id");

  const filtered = apply(
    plans.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
  );

  const save = (plan) => {
    setData((d) => ({ ...d, plans: d.plans.some((x) => x.id === plan.id) ? d.plans.map((x) => (x.id === plan.id ? plan : x)) : [...d.plans, plan] }));
    setEditing(null);
    setCreating(false);
  };
  const setStatus = (plan, status) => setData((d) => ({ ...d, plans: d.plans.map((x) => (x.id === plan.id ? { ...x, status } : x)) }));

  const createAuditFromPlan = (plan) => {
    const newAudit = {
      id: `AUD-${plan.id.replace("AP-", "")}`,
      planId: plan.id,
      name: plan.name,
      type: plan.type,
      objective: plan.objective,
      owner: plan.owner,
      leadAuditor: plan.leadAuditor,
      team: plan.auditors,
      auditee: plan.auditee,
      department: plan.department,
      frameworkId: plan.frameworkId,
      startDate: plan.plannedStart,
      endDate: plan.plannedEnd,
      status: "Planned",
      overallResult: "Not Conclusive",
      followUpOfAuditId: plan.type === "Follow-up Audit" ? null : null,
    };
    setData((d) => ({
      ...d,
      audits: d.audits.some((a) => a.id === newAudit.id) ? d.audits : [...d.audits, newAudit],
      plans: d.plans.map((x) => (x.id === plan.id ? { ...x, status: "Scheduled" } : x)),
    }));
    goTo("audits");
  };

  const columns = [
    { key: "id", label: "Plan ID" },
    { key: "name", label: "Audit Name", render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { key: "type", label: "Type" },
    { key: "frameworkId", label: "Framework", render: (r) => nameOf(EXISTING_FRAMEWORKS, r.frameworkId) },
    { key: "leadAuditor", label: "Lead Auditor" },
    { key: "plannedStart", label: "Planned Start" },
    { key: "priority", label: "Priority", render: (r) => <Pill label={r.priority} {...severityMeta(r.priority === "Critical" ? "Critical" : r.priority)} /> },
    { key: "status", label: "Status", render: (r) => <Pill label={r.status} {...planStatusMeta(r.status)} /> },
  ];

  return (
    <div>
      <PageHeading
        title="Audit Plans"
        subtitle="Planned audit activity awaiting approval and scheduling."
        action={<button onClick={() => setCreating(true)} style={{ ...primaryBtnStyle, padding: "10px 16px" }}><Plus size={14} style={{ marginRight: 6 }} /> New Audit Plan</button>}
      />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search audit plans…" resultCount={filtered.length} totalCount={plans.length}
        right={<FilterSelect value={statusFilter} options={["All", ...PLAN_STATUSES]} onChange={setStatusFilter} />} />
      <DataTable columns={columns} rows={filtered} sort={sort} onSort={toggle} onRowClick={(r) => setDetail(r)}
        renderActions={(r) => (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setDetail(r)} style={iconBtnStyle} title="View"><Eye size={13} color={T.textSecondary} /></button>
            <button onClick={() => setEditing(r)} style={iconBtnStyle} title="Edit"><Pencil size={13} color={T.textSecondary} /></button>
            {r.status === "Draft" && <button onClick={() => setStatus(r, "Planned")} style={iconBtnStyle} title="Mark Planned"><CheckCircle2 size={13} color={T.textSecondary} /></button>}
            {r.status === "Planned" && <button onClick={() => setStatus(r, "Approved")} style={iconBtnStyle} title="Approve"><BadgeCheck size={13} color={T.textSecondary} /></button>}
            {r.status === "Approved" && <button onClick={() => createAuditFromPlan(r)} style={iconBtnStyle} title="Schedule audit"><CalendarCheck2 size={13} color={T.textSecondary} /></button>}
            {r.status !== "Cancelled" && r.status !== "Scheduled" && <button onClick={() => setStatus(r, "Cancelled")} style={iconBtnStyle} title="Cancel"><CircleSlash size={13} color={T.textSecondary} /></button>}
          </div>
        )} />

      {detail && (
        <div style={overlayStyle}>
          <div style={{ ...drawerStyle, width: 520 }}>
            <div style={drawerHeaderStyle}>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>{detail.id}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary }}>{detail.name}</div>
              </div>
              <button onClick={() => setDetail(null)} style={iconBtnStyle}><X size={15} color={T.textSecondary} /></button>
            </div>
            <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }}>
              <SectionLabel>Plan Information</SectionLabel>
              <p style={{ fontSize: 12.5, color: T.textSecondary, lineHeight: 1.6, marginTop: 0 }}>{detail.description}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <DetailRow k="Objective" v={detail.objective} />
                <DetailRow k="Type" v={detail.type} />
                <DetailRow k="Framework" v={nameOf(EXISTING_FRAMEWORKS, detail.frameworkId)} />
                <DetailRow k="Planned Start" v={detail.plannedStart} />
                <DetailRow k="Planned End" v={detail.plannedEnd} />
                <DetailRow k="Audit Owner" v={detail.owner} />
                <DetailRow k="Lead Auditor" v={detail.leadAuditor} />
                <DetailRow k="Auditors" v={detail.auditors.join(", ")} />
                <DetailRow k="Auditee" v={detail.auditee} />
                <DetailRow k="Department" v={detail.department} />
                <DetailRow k="Priority" v={detail.priority} />
                <DetailRow k="Status" v={<Pill label={detail.status} {...planStatusMeta(detail.status)} />} />
              </div>
            </div>
            <div style={drawerFooterStyle}>
              <button onClick={() => setDetail(null)} style={secondaryBtnStyle}>Close</button>
              {detail.status === "Approved" && <button onClick={() => { createAuditFromPlan(detail); setDetail(null); }} style={primaryBtnStyle}><CalendarCheck2 size={13} style={{ marginRight: 6 }} /> Schedule Audit</button>}
            </div>
          </div>
        </div>
      )}

      {(editing || creating) && <PlanFormDrawer initial={editing} onClose={() => { setEditing(null); setCreating(false); }} onSave={save} />}
    </div>
  );
}
function PlanFormDrawer({ initial, onClose, onSave }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(initial || {
    id: `AP-2026-${Math.floor(Math.random() * 90 + 10)}`, name: "", type: "Internal Audit", objective: "",
    plannedStart: "", plannedEnd: "", owner: "", leadAuditor: AUDITORS[0], auditors: [AUDITORS[0]],
    auditee: "", department: "", frameworkId: "FRW-001", priority: "Medium", status: "Draft", description: "",
  });
  const set = (f, v) => setForm((x) => ({ ...x, [f]: v }));
  const [error, setError] = useState("");
  const save = () => { if (!form.name.trim()) return setError("Audit Name is required."); onSave(form); };

  return (
    <div style={overlayStyle}>
      <div style={{ ...drawerStyle, width: 480 }}>
        <div style={drawerHeaderStyle}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{isEdit ? "Edit Audit Plan" : "New Audit Plan"}</div>
          <button onClick={onClose} style={iconBtnStyle}><X size={15} color={T.textSecondary} /></button>
        </div>
        <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }}>
          <Field label="Audit Name" required error={error}><input value={form.name} onChange={(e) => set("name", e.target.value)} style={inputStyle()} /></Field>
          <Field label="Audit Objective"><textarea value={form.objective} onChange={(e) => set("objective", e.target.value)} rows={2} style={inputStyle({ resize: "vertical" })} /></Field>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="Audit Type"><select value={form.type} onChange={(e) => set("type", e.target.value)} style={selectStyle()}>{AUDIT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field></div>
            <div style={{ flex: 1 }}><Field label="Priority"><select value={form.priority} onChange={(e) => set("priority", e.target.value)} style={selectStyle()}>{PRIORITIES.map((t) => <option key={t}>{t}</option>)}</select></Field></div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="Planned Start"><input type="date" value={form.plannedStart} onChange={(e) => set("plannedStart", e.target.value)} style={inputStyle()} /></Field></div>
            <div style={{ flex: 1 }}><Field label="Planned End"><input type="date" value={form.plannedEnd} onChange={(e) => set("plannedEnd", e.target.value)} style={inputStyle()} /></Field></div>
          </div>
          <Field label="Framework"><select value={form.frameworkId} onChange={(e) => set("frameworkId", e.target.value)} style={selectStyle()}>{EXISTING_FRAMEWORKS.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></Field>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="Audit Owner"><input value={form.owner} onChange={(e) => set("owner", e.target.value)} style={inputStyle()} /></Field></div>
            <div style={{ flex: 1 }}><Field label="Lead Auditor"><select value={form.leadAuditor} onChange={(e) => set("leadAuditor", e.target.value)} style={selectStyle()}>{AUDITORS.map((a) => <option key={a}>{a}</option>)}</select></Field></div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="Auditee"><input value={form.auditee} onChange={(e) => set("auditee", e.target.value)} style={inputStyle()} /></Field></div>
            <div style={{ flex: 1 }}><Field label="Department"><input value={form.department} onChange={(e) => set("department", e.target.value)} style={inputStyle()} /></Field></div>
          </div>
          <Field label="Description"><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} style={inputStyle({ resize: "vertical" })} /></Field>
          <Field label="Status"><select value={form.status} onChange={(e) => set("status", e.target.value)} style={selectStyle()}>{PLAN_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        </div>
        <div style={drawerFooterStyle}>
          <button onClick={onClose} style={secondaryBtnStyle}>Cancel</button>
          <button onClick={save} style={primaryBtnStyle}>{isEdit ? "Save Changes" : "Create Plan"}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  PAGE: AUDITS (list) + AUDIT DETAILS (tabbed)                           */
/* ---------------------------------------------------------------------- */
function AuditsPage({ data, setData, goTo, openAuditId, setOpenAuditId }) {
  const { audits } = data;
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ status: "All", type: "All", framework: "All" });
  const { sort, toggle, apply } = useSort("id");

  const openAudit = openAuditId ? byId(audits, openAuditId) : null;
  if (openAudit) {
    return <AuditDetailsPage audit={openAudit} data={data} setData={setData} goTo={goTo} onBack={() => setOpenAuditId(null)} />;
  }

  const filtered = apply(
    audits.filter((a) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || a.auditee.toLowerCase().includes(q);
      const matchesStatus = filters.status === "All" || a.status === filters.status;
      const matchesType = filters.type === "All" || a.type === filters.type;
      const matchesFramework = filters.framework === "All" || a.frameworkId === filters.framework;
      return matchesSearch && matchesStatus && matchesType && matchesFramework;
    })
  );
  const activeFilterCount = Object.values(filters).filter((v) => v !== "All").length;

  const columns = [
    { key: "id", label: "Audit ID" },
    { key: "name", label: "Audit Name", render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { key: "type", label: "Type" },
    { key: "frameworkId", label: "Framework", render: (r) => nameOf(EXISTING_FRAMEWORKS, r.frameworkId) },
    { key: "auditee", label: "Auditee" },
    { key: "leadAuditor", label: "Lead Auditor" },
    { key: "endDate", label: "End Date" },
    { key: "status", label: "Status", render: (r) => <Badge {...auditStatusMeta(r.status)} label={r.status} /> },
    { key: "overallResult", label: "Result", render: (r) => <Pill label={r.overallResult} {...overallResultMeta(r.overallResult)} /> },
  ];

  return (
    <div>
      <PageHeading title="Audits" subtitle="All active and completed audit engagements." />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search audits, auditees…" onToggleFilters={() => setShowFilters((s) => !s)} activeFilterCount={activeFilterCount} resultCount={filtered.length} totalCount={audits.length} />
      {showFilters && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16, padding: 14, background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10 }}>
          <FilterSelect label="Status" value={filters.status} options={["All", ...AUDIT_STATUSES]} onChange={(v) => setFilters((f) => ({ ...f, status: v }))} />
          <FilterSelect label="Type" value={filters.type} options={["All", ...AUDIT_TYPES]} onChange={(v) => setFilters((f) => ({ ...f, type: v }))} />
          <FilterSelect label="Framework" value={filters.framework} options={["All", ...EXISTING_FRAMEWORKS.map((f) => f.id)]} onChange={(v) => setFilters((f) => ({ ...f, framework: v }))} />
        </div>
      )}
      <DataTable columns={columns} rows={filtered} sort={sort} onSort={toggle} onRowClick={(r) => setOpenAuditId(r.id)}
        renderActions={(r) => <button onClick={() => setOpenAuditId(r.id)} style={iconBtnStyle} title="Open"><Eye size={13} color={T.textSecondary} /></button>} />
    </div>
  );
}

function AuditDetailsPage({ audit, data, setData, goTo, onBack }) {
  const [tab, setTab] = useState("overview");
  const scope = data.scope[audit.id] || { organization: "", department: "", businessUnit: "", location: "", assets: [], frameworks: [], requirements: [], controls: [], policies: [] };
  const auditChecklist = data.checklist.filter((c) => c.auditId === audit.id);
  const auditEvidence = data.evidenceRequests.filter((e) => e.auditId === audit.id);
  const auditFindings = data.findings.filter((f) => f.auditId === audit.id);
  const auditCAs = data.correctiveActions.filter((c) => c.auditId === audit.id);
  const auditHistory = data.history.filter((h) => h.auditId === audit.id);
  const followUpOf = audit.followUpOfAuditId ? byId(data.audits, audit.followUpOfAuditId) : null;
  const followUps = data.audits.filter((a) => a.followUpOfAuditId === audit.id);

  const setAuditField = (field, value) => setData((d) => ({ ...d, audits: d.audits.map((a) => (a.id === audit.id ? { ...a, [field]: value } : a)) }));

  const recomputeResult = () => {
    const result = computeOverallResult(audit.id, data.checklist, data.findings);
    setAuditField("overallResult", result);
  };

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "scope", label: "Scope" },
    { key: "criteria", label: "Criteria", count: scope.requirements.length },
    { key: "checklist", label: "Checklist", count: auditChecklist.length },
    { key: "evidence", label: "Evidence", count: auditEvidence.length },
    { key: "findings", label: "Findings", count: auditFindings.length },
    { key: "corrective", label: "Corrective Actions", count: auditCAs.length },
    { key: "reports", label: "Reports" },
    { key: "history", label: "History" },
  ];

  return (
    <div>
      <PageHeading
        back={onBack}
        title={audit.name}
        subtitle={`${audit.id} · ${audit.type} · ${audit.auditee}`}
        action={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Badge {...auditStatusMeta(audit.status)} label={audit.status} />
            <select value={audit.status} onChange={(e) => setAuditField("status", e.target.value)} style={selectStyle({ width: 160 })}>
              {AUDIT_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        }
      />
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
          <div>
            <SectionLabel>Audit Information</SectionLabel>
            <p style={{ fontSize: 12.5, color: T.textSecondary, lineHeight: 1.6, marginTop: 0 }}>{audit.objective}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <DetailRow k="Audit Owner" v={audit.owner} />
              <DetailRow k="Lead Auditor" v={audit.leadAuditor} />
              <DetailRow k="Audit Team" v={audit.team.join(", ")} />
              <DetailRow k="Auditee" v={audit.auditee} />
              <DetailRow k="Department" v={audit.department} />
              <DetailRow k="Framework" v={nameOf(EXISTING_FRAMEWORKS, audit.frameworkId)} />
              <DetailRow k="Start Date" v={audit.startDate} />
              <DetailRow k="End Date" v={audit.endDate} />
            </div>
            {followUpOf && (
              <>
                <SectionLabel>Original Audit</SectionLabel>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: T.textPrimary }}>
                  <GitBranch size={13} color={T.accent} /> This is a follow-up to <b>{followUpOf.name}</b> ({followUpOf.id})
                </div>
              </>
            )}
            {followUps.length > 0 && (
              <>
                <SectionLabel>Follow-up Audits</SectionLabel>
                {followUps.map((f) => (
                  <div key={f.id} style={{ fontSize: 12.5, color: T.textPrimary, marginBottom: 6 }}>{f.id} — {f.name} ({f.status})</div>
                ))}
              </>
            )}
          </div>
          <div>
            <SectionLabel>Overall Result</SectionLabel>
            <div style={{ background: T.cardBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <Badge {...overallResultMeta(audit.overallResult)} label={audit.overallResult} />
              <p style={{ fontSize: 11.5, color: T.textMuted, marginTop: 10, lineHeight: 1.6 }}>
                Calculated from checklist test results and open findings — not hard-coded.
              </p>
              <button onClick={recomputeResult} style={{ ...secondaryBtnStyle, display: "flex", alignItems: "center", gap: 6 }}>
                <RefreshCw size={12} /> Recalculate
              </button>
            </div>
            <SectionLabel>Testing Snapshot</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <DetailRow k="Checklist items" v={auditChecklist.length} />
              <DetailRow k="Tested" v={auditChecklist.filter((c) => c.result !== "Not Tested").length} />
              <DetailRow k="Non-Conformities" v={auditChecklist.filter((c) => c.result === "Non-Conformity").length} />
              <DetailRow k="Open findings" v={auditFindings.filter((f) => !["Resolved", "Closed", "Accepted"].includes(f.status)).length} />
              <DetailRow k="Open corrective actions" v={auditCAs.filter((c) => !["Verified", "Closed", "Cancelled"].includes(c.status)).length} />
            </div>
          </div>
        </div>
      )}

      {tab === "scope" && <ScopeTab audit={audit} scope={scope} setData={setData} />}
      {tab === "criteria" && <CriteriaTab scope={scope} />}
      {tab === "checklist" && <ChecklistTab audit={audit} checklist={auditChecklist} data={data} setData={setData} />}
      {tab === "evidence" && <EvidenceTab audit={audit} requests={auditEvidence} setData={setData} />}
      {tab === "findings" && <FindingsTab audit={audit} findings={auditFindings} setData={setData} />}
      {tab === "corrective" && <CorrectiveTab audit={audit} actions={auditCAs} setData={setData} />}
      {tab === "reports" && <ReportsTab audit={audit} scope={scope} checklist={auditChecklist} findings={auditFindings} correctiveActions={auditCAs} />}
      {tab === "history" && <HistoryTab events={auditHistory} />}
    </div>
  );
}

function ScopeTab({ audit, scope, setData }) {
  const toggleItem = (key, id) => {
    setData((d) => {
      const current = d.scope[audit.id] || { organization: "", department: "", businessUnit: "", location: "", assets: [], frameworks: [], requirements: [], controls: [], policies: [] };
      const list = current[key].includes(id) ? current[key].filter((x) => x !== id) : [...current[key], id];
      return { ...d, scope: { ...d.scope, [audit.id]: { ...current, [key]: list } } };
    });
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
      <div>
        <SectionLabel>Organizational Scope</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <DetailRow k="Organization" v={scope.organization} />
          <DetailRow k="Department" v={scope.department} />
          <DetailRow k="Business Unit" v={scope.businessUnit} />
          <DetailRow k="Location" v={scope.location} />
        </div>
      </div>
      <div>
        <SectionLabel>Technical Scope — Assets</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {EXISTING_ASSETS.map((a) => (
            <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.textSecondary, cursor: "pointer" }}>
              <input type="checkbox" checked={scope.assets.includes(a.id)} onChange={() => toggleItem("assets", a.id)} />
              {a.name}
            </label>
          ))}
        </div>
      </div>
      <div>
        <SectionLabel>Compliance Scope</SectionLabel>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10.5, color: T.textMuted, marginBottom: 6, fontWeight: 600 }}>Frameworks</div>
          {EXISTING_FRAMEWORKS.map((f) => (
            <label key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.textSecondary, marginBottom: 4, cursor: "pointer" }}>
              <input type="checkbox" checked={scope.frameworks.includes(f.id)} onChange={() => toggleItem("frameworks", f.id)} />
              {f.name}
            </label>
          ))}
        </div>
        <RelationBlock title="Selected Requirements" items={scope.requirements} lookup={EXISTING_REQUIREMENTS} />
        <RelationBlock title="Mapped Controls" items={scope.controls} lookup={EXISTING_CONTROLS} />
        <RelationBlock title="Applicable Policies" items={scope.policies} lookup={EXISTING_POLICIES} />
      </div>
    </div>
  );
}

function CriteriaTab({ scope }) {
  const reqs = scope.requirements.map((id) => byId(EXISTING_REQUIREMENTS, id)).filter(Boolean);
  return (
    <div>
      <SectionLabel>Audit Criteria — Selected Requirements</SectionLabel>
      {reqs.length === 0 ? <EmptyState label="No criteria selected yet. Add requirements from the Scope tab." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reqs.map((r) => (
            <div key={r.id} style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 10.5, color: T.textMuted, fontWeight: 600 }}>{r.id} · {nameOf(EXISTING_FRAMEWORKS, r.frameworkId)}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, marginTop: 2 }}>{r.title}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {r.mappedControls.map((c) => <Pill key={c} label={nameOf(EXISTING_CONTROLS, c)} color={T.blue} bg={T.blueSoft} />)}
                {r.relatedPolicies.map((p) => <Pill key={p} label={nameOf(EXISTING_POLICIES, p)} color={T.purple} bg={T.purpleSoft} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChecklistTab({ audit, checklist, data, setData }) {
  const [creating, setCreating] = useState(false);
  const requirementOptions = (data.scope[audit.id]?.requirements || []).map((id) => byId(EXISTING_REQUIREMENTS, id)).filter(Boolean);

  const setResult = (item, result) => setData((d) => ({ ...d, checklist: d.checklist.map((c) => (c.id === item.id ? { ...c, result, reviewStatus: c.reviewStatus === "Not Started" ? "Pending Review" : c.reviewStatus } : c)) }));
  const createFinding = (item) => {
    if (data.findings.some((f) => f.checklistItemId === item.id)) return;
    const req = byId(EXISTING_REQUIREMENTS, item.requirementId);
    const newFinding = {
      id: `FND-${audit.id.replace("AUD-", "")}-${Math.floor(Math.random() * 900 + 100)}`,
      auditId: audit.id, checklistItemId: item.id, requirementId: item.requirementId, controlId: item.controlId,
      description: `Non-conformity identified during testing of ${req?.title || item.requirementId}.`,
      evidenceRequestId: item.evidenceIds[0] || null, rootCause: "", impact: "", riskId: "", severity: "Medium",
      recommendation: "", owner: "", dueDate: "", status: "Open",
    };
    setData((d) => ({ ...d, findings: [...d.findings, newFinding] }));
  };

  const columns = [
    { key: "id", label: "Item" },
    { key: "requirementId", label: "Requirement", render: (r) => nameOf(EXISTING_REQUIREMENTS, r.requirementId) },
    { key: "controlId", label: "Control", render: (r) => nameOf(EXISTING_CONTROLS, r.controlId) },
    { key: "auditor", label: "Auditor" },
    { key: "testDate", label: "Test Date" },
    { key: "result", label: "Result", render: (r) => (
      <select value={r.result} onChange={(e) => setResult(r, e.target.value)} style={selectStyle({ width: 150 })}>
        {TEST_RESULTS.map((t) => <option key={t}>{t}</option>)}
      </select>
    ) },
    { key: "reviewStatus", label: "Review", render: (r) => <Pill label={r.reviewStatus} color={r.reviewStatus === "Reviewed" ? T.green : T.grey} bg={r.reviewStatus === "Reviewed" ? T.greenSoft : T.greySoft} /> },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button onClick={() => setCreating(true)} style={{ ...primaryBtnStyle, padding: "9px 14px" }}><Plus size={14} style={{ marginRight: 6 }} /> Add Checklist Item</button>
      </div>
      <DataTable columns={columns} rows={checklist} sort={{ key: "id", dir: "asc" }} onSort={() => {}}
        renderActions={(r) => (
          <div style={{ display: "flex", gap: 6 }}>
            {r.result === "Non-Conformity" && (
              <button onClick={() => createFinding(r)} style={iconBtnStyle} title="Create finding">
                <AlertOctagon size={13} color={data.findings.some((f) => f.checklistItemId === r.id) ? T.grey : T.red} />
              </button>
            )}
          </div>
        )} />
      {checklist.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <SectionLabel>Auditor Comments</SectionLabel>
          {checklist.filter((c) => c.comment).map((c) => (
            <div key={c.id} style={{ fontSize: 12, color: T.textSecondary, marginBottom: 6 }}><b style={{ color: T.textPrimary }}>{c.id}</b> — {c.comment}</div>
          ))}
        </div>
      )}
      {creating && (
        <ChecklistFormDrawer requirementOptions={requirementOptions} onClose={() => setCreating(false)}
          onSave={(item) => { setData((d) => ({ ...d, checklist: [...d.checklist, { ...item, id: `CHK-${Math.floor(Math.random() * 9000 + 1000)}`, auditId: audit.id }] })); setCreating(false); }} />
      )}
    </div>
  );
}
function ChecklistFormDrawer({ requirementOptions, onClose, onSave }) {
  const [form, setForm] = useState({ requirementId: requirementOptions[0]?.id || "", controlId: requirementOptions[0]?.mappedControls?.[0] || "", testObjective: "", testProcedure: "", auditor: AUDITORS[0], testDate: "", result: "Not Tested", evidenceIds: [], comment: "", reviewStatus: "Not Started" });
  const set = (f, v) => setForm((x) => ({ ...x, [f]: v }));
  return (
    <div style={overlayStyle}>
      <div style={{ ...drawerStyle, width: 460 }}>
        <div style={drawerHeaderStyle}><div style={{ fontSize: 15, fontWeight: 700 }}>Add Checklist Item</div><button onClick={onClose} style={iconBtnStyle}><X size={15} color={T.textSecondary} /></button></div>
        <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }}>
          <Field label="Requirement"><select value={form.requirementId} onChange={(e) => set("requirementId", e.target.value)} style={selectStyle()}>{requirementOptions.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}</select></Field>
          <Field label="Control"><select value={form.controlId} onChange={(e) => set("controlId", e.target.value)} style={selectStyle()}>{EXISTING_CONTROLS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Test Objective"><textarea value={form.testObjective} onChange={(e) => set("testObjective", e.target.value)} rows={2} style={inputStyle({ resize: "vertical" })} /></Field>
          <Field label="Test Procedure"><textarea value={form.testProcedure} onChange={(e) => set("testProcedure", e.target.value)} rows={2} style={inputStyle({ resize: "vertical" })} /></Field>
          <Field label="Auditor"><select value={form.auditor} onChange={(e) => set("auditor", e.target.value)} style={selectStyle()}>{AUDITORS.map((a) => <option key={a}>{a}</option>)}</select></Field>
        </div>
        <div style={drawerFooterStyle}><button onClick={onClose} style={secondaryBtnStyle}>Cancel</button><button onClick={() => onSave(form)} style={primaryBtnStyle}>Add Item</button></div>
      </div>
    </div>
  );
}

function EvidenceTab({ audit, requests, setData }) {
  const [creating, setCreating] = useState(false);
  const setStatus = (r, status) => setData((d) => ({ ...d, evidenceRequests: d.evidenceRequests.map((e) => (e.id === r.id ? { ...e, status } : e)) }));
  const columns = [
    { key: "id", label: "Request" },
    { key: "requirementId", label: "Requirement", render: (r) => nameOf(EXISTING_REQUIREMENTS, r.requirementId) },
    { key: "evidenceType", label: "Type" },
    { key: "requestedFrom", label: "Requested From" },
    { key: "dueDate", label: "Due Date" },
    { key: "evidenceName", label: "Evidence", render: (r) => r.evidenceName || <span style={{ color: T.textMuted }}>None submitted</span> },
    { key: "status", label: "Status", render: (r) => <Pill label={r.status} {...evReqStatusMeta(r.status)} /> },
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button onClick={() => setCreating(true)} style={{ ...primaryBtnStyle, padding: "9px 14px" }}><Send size={14} style={{ marginRight: 6 }} /> Request Evidence</button>
      </div>
      <DataTable columns={columns} rows={requests} sort={{ key: "id", dir: "asc" }} onSort={() => {}}
        renderActions={(r) => (
          <div style={{ display: "flex", gap: 6 }}>
            {r.status === "Submitted" && <button onClick={() => setStatus(r, "Accepted")} style={iconBtnStyle} title="Accept"><CheckCircle2 size={13} color={T.green} /></button>}
            {r.status === "Submitted" && <button onClick={() => setStatus(r, "Rejected")} style={iconBtnStyle} title="Reject"><XCircle size={13} color={T.red} /></button>}
            {["Requested", "Overdue"].includes(r.status) && <button onClick={() => setStatus(r, "Submitted")} style={iconBtnStyle} title="Mark submitted"><Upload size={13} color={T.textSecondary} /></button>}
          </div>
        )} />
      {creating && (
        <EvidenceRequestFormDrawer onClose={() => setCreating(false)}
          onSave={(req) => { setData((d) => ({ ...d, evidenceRequests: [...d.evidenceRequests, { ...req, id: `EVR-${Math.floor(Math.random() * 9000 + 1000)}`, auditId: audit.id, status: "Requested", evidenceName: "", reviewer: "", reviewerComments: "" }] })); setCreating(false); }} />
      )}
    </div>
  );
}
function EvidenceRequestFormDrawer({ onClose, onSave }) {
  const [form, setForm] = useState({ requirementId: EXISTING_REQUIREMENTS[0].id, controlId: EXISTING_CONTROLS[0].id, description: "", evidenceType: "Document", requestedFrom: "", requestedBy: AUDITORS[0], requestDate: "2026-08-23", dueDate: "" });
  const set = (f, v) => setForm((x) => ({ ...x, [f]: v }));
  return (
    <div style={overlayStyle}>
      <div style={{ ...drawerStyle, width: 460 }}>
        <div style={drawerHeaderStyle}><div style={{ fontSize: 15, fontWeight: 700 }}>Request Evidence</div><button onClick={onClose} style={iconBtnStyle}><X size={15} color={T.textSecondary} /></button></div>
        <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }}>
          <Field label="Requirement"><select value={form.requirementId} onChange={(e) => set("requirementId", e.target.value)} style={selectStyle()}>{EXISTING_REQUIREMENTS.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}</select></Field>
          <Field label="Description"><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} style={inputStyle({ resize: "vertical" })} /></Field>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="Evidence Type"><select value={form.evidenceType} onChange={(e) => set("evidenceType", e.target.value)} style={selectStyle()}>{EVIDENCE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field></div>
            <div style={{ flex: 1 }}><Field label="Due Date"><input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} style={inputStyle()} /></Field></div>
          </div>
          <Field label="Requested From"><input value={form.requestedFrom} onChange={(e) => set("requestedFrom", e.target.value)} style={inputStyle()} /></Field>
        </div>
        <div style={drawerFooterStyle}><button onClick={onClose} style={secondaryBtnStyle}>Cancel</button><button onClick={() => onSave(form)} style={primaryBtnStyle}>Send Request</button></div>
      </div>
    </div>
  );
}

function FindingsTab({ audit, findings, setData }) {
  const [detail, setDetail] = useState(null);
  const setStatus = (f, status) => setData((d) => ({ ...d, findings: d.findings.map((x) => (x.id === f.id ? { ...x, status } : x)) }));
  const columns = [
    { key: "id", label: "Finding" },
    { key: "requirementId", label: "Requirement", render: (r) => nameOf(EXISTING_REQUIREMENTS, r.requirementId) },
    { key: "description", label: "Description", render: (r) => <span title={r.description}>{r.description.length > 60 ? r.description.slice(0, 60) + "…" : r.description}</span> },
    { key: "severity", label: "Severity", render: (r) => <Badge {...severityMeta(r.severity)} label={r.severity} /> },
    { key: "owner", label: "Owner" },
    { key: "dueDate", label: "Due Date" },
    { key: "status", label: "Status", render: (r) => <Pill label={r.status} {...findingStatusMeta(r.status)} /> },
  ];
  return (
    <div>
      <DataTable columns={columns} rows={findings} sort={{ key: "id", dir: "asc" }} onSort={() => {}} onRowClick={setDetail}
        renderActions={(r) => (
          <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
            <select value={r.status} onChange={(e) => setStatus(r, e.target.value)} style={selectStyle({ width: 150 })}>
              {FINDING_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        )} />
      {detail && (
        <div style={overlayStyle}>
          <div style={{ ...drawerStyle, width: 520 }}>
            <div style={drawerHeaderStyle}>
              <div><div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>{detail.id}</div><div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary }}>Finding</div></div>
              <button onClick={() => setDetail(null)} style={iconBtnStyle}><X size={15} color={T.textSecondary} /></button>
            </div>
            <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }}>
              <SectionLabel>Description</SectionLabel>
              <p style={{ fontSize: 12.5, color: T.textSecondary, lineHeight: 1.6, marginTop: 0 }}>{detail.description}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <DetailRow k="Requirement" v={nameOf(EXISTING_REQUIREMENTS, detail.requirementId)} />
                <DetailRow k="Control" v={nameOf(EXISTING_CONTROLS, detail.controlId)} />
                <DetailRow k="Severity" v={<Badge {...severityMeta(detail.severity)} label={detail.severity} />} />
                <DetailRow k="Owner" v={detail.owner} />
                <DetailRow k="Due Date" v={detail.dueDate} />
                <DetailRow k="Status" v={<Pill label={detail.status} {...findingStatusMeta(detail.status)} />} />
              </div>
              <SectionLabel>Root Cause Analysis</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <DetailRow k="Root Cause" v={detail.rootCause || "—"} />
                <DetailRow k="Impact" v={detail.impact || "—"} />
                <DetailRow k="Recommendation" v={detail.recommendation || "—"} />
              </div>
              <RelationBlock title="Related Risk" items={detail.riskId ? [detail.riskId] : []} lookup={EXISTING_RISKS} />
            </div>
            <div style={drawerFooterStyle}><button onClick={() => setDetail(null)} style={secondaryBtnStyle}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function CorrectiveTab({ audit, actions, setData }) {
  const setField = (a, field, value) => setData((d) => ({ ...d, correctiveActions: d.correctiveActions.map((x) => (x.id === a.id ? { ...x, [field]: value } : x)) }));
  const verify = (a) => setData((d) => ({ ...d, correctiveActions: d.correctiveActions.map((x) => (x.id === a.id ? { ...x, status: "Verified", verification: "Verified", progress: 100 } : x)) }));
  const columns = [
    { key: "id", label: "Action" },
    { key: "description", label: "Description", render: (r) => <span title={r.description}>{r.description.length > 55 ? r.description.slice(0, 55) + "…" : r.description}</span> },
    { key: "owner", label: "Owner" },
    { key: "priority", label: "Priority", render: (r) => <Pill label={r.priority} {...severityMeta(r.priority)} /> },
    { key: "dueDate", label: "Due Date" },
    { key: "progress", label: "Progress", render: (r) => <ProgressBar value={r.progress} color={r.progress >= 100 ? T.green : T.amber} /> },
    { key: "status", label: "Status", render: (r) => <Pill label={r.status} {...caStatusMeta(r.status)} /> },
  ];
  return (
    <DataTable columns={columns} rows={actions} sort={{ key: "id", dir: "asc" }} onSort={() => {}}
      renderActions={(r) => (
        <div style={{ display: "flex", gap: 6 }}>
          {r.status !== "Verified" && r.status !== "Closed" && r.progress >= 100 && (
            <button onClick={() => verify(r)} style={iconBtnStyle} title="Auditor: verify completion"><ShieldCheck size={13} color={T.green} /></button>
          )}
          {r.status === "In Progress" && r.progress < 100 && (
            <button onClick={() => setField(r, "progress", Math.min(100, r.progress + 15))} style={iconBtnStyle} title="Advance progress"><ArrowRight size={13} color={T.textSecondary} /></button>
          )}
        </div>
      )} />
  );
}

function ReportsTab({ audit, scope, checklist, findings, correctiveActions }) {
  const tested = checklist.filter((c) => c.result !== "Not Tested");
  const stats = {
    tested: tested.length,
    total: checklist.length,
    conforming: checklist.filter((c) => c.result === "Conformity").length,
    partial: checklist.filter((c) => c.result === "Partial Conformity").length,
    nonConforming: checklist.filter((c) => c.result === "Non-Conformity").length,
  };
  const bySeverity = FINDING_SEVERITIES.map((s) => ({ label: s, value: findings.filter((f) => f.severity === s).length }));
  const reportTypes = ["Full Audit Report", "Executive Summary", "Findings Report", "Evidence Report", "Checklist Results", "Control Effectiveness Report", "Compliance Results", "Corrective Action Report", "Follow-up Audit Report"];

  return (
    <div>
      <SectionLabel>Executive Summary</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        <DetailRow k="Audit Name" v={audit.name} />
        <DetailRow k="Audit Type" v={audit.type} />
        <DetailRow k="Audit Period" v={`${audit.startDate} — ${audit.endDate}`} />
        <DetailRow k="Auditors" v={audit.team.join(", ")} />
        <DetailRow k="Overall Result" v={<Pill label={audit.overallResult} {...overallResultMeta(audit.overallResult)} />} />
      </div>

      <SectionLabel>Audit Statistics (calculated, not hard-coded)</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 20 }}>
        <KpiCard label="Controls Tested" value={stats.tested} Icon={ListChecks} iconColor={T.accent} iconBg={T.accentSoft} />
        <KpiCard label="Conforming" value={stats.conforming} Icon={CheckCircle2} iconColor={T.green} iconBg={T.greenSoft} />
        <KpiCard label="Partially Conforming" value={stats.partial} Icon={MinusCircle} iconColor={T.amber} iconBg={T.amberSoft} />
        <KpiCard label="Non-Conforming" value={stats.nonConforming} Icon={XCircle} iconColor={T.red} iconBg={T.redSoft} />
      </div>
      <ChartCard title="Findings by Severity">
        <HBarChart data={bySeverity} colorFn={(d) => severityMeta(d.label).color} />
      </ChartCard>

      <SectionLabel>Available Reports</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
        {reportTypes.map((r) => (
          <div key={r} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FileBarChart2 size={14} color={T.accent} />
              <span style={{ fontSize: 12.5, color: T.textPrimary }}>{r}</span>
            </div>
            <Download size={13} color={T.textMuted} style={{ cursor: "pointer" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryTab({ events }) {
  return (
    <div>
      <SectionLabel>Audit Activity Log</SectionLabel>
      {events.length === 0 ? <EmptyState label="No recorded activity yet." /> : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {events.map((e, i) => (
            <div key={e.id} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: i < events.length - 1 ? `1px solid ${T.panelBorder}` : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: T.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <HistoryIcon size={13} color={T.accent} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: T.textPrimary, fontWeight: 600 }}>{e.action}</div>
                <div style={{ fontSize: 11.5, color: T.textSecondary, marginTop: 2 }}>
                  {e.user} {e.prev && <>· {e.prev} → </>}{e.next && <b style={{ color: T.textPrimary }}>{e.next}</b>}
                </div>
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, whiteSpace: "nowrap" }}>{e.when}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  GLOBAL PAGES: reuse the same tab-content components, filtered by audit */
/* ---------------------------------------------------------------------- */
function GlobalChecklistPage({ data, setData }) {
  const [auditFilter, setAuditFilter] = useState("All");
  const rows = data.checklist.filter((c) => auditFilter === "All" || c.auditId === auditFilter);
  return (
    <div>
      <PageHeading title="Audit Checklist" subtitle="Testing status of every checklist item across all audits."
        action={<FilterSelect label="" value={auditFilter} options={["All", ...data.audits.map((a) => a.id)]} onChange={setAuditFilter} />} />
      <ChecklistTab audit={{ id: auditFilter === "All" ? "AUD-2026-01" : auditFilter }} checklist={rows} data={data} setData={setData} />
    </div>
  );
}
function GlobalEvidencePage({ data, setData }) {
  const [auditFilter, setAuditFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const rows = data.evidenceRequests.filter((e) => (auditFilter === "All" || e.auditId === auditFilter) && (statusFilter === "All" || e.status === statusFilter));
  return (
    <div>
      <PageHeading title="Evidence & Requests" subtitle="Evidence requested from auditees across all audits, and its review status." />
      <Toolbar search="" onSearch={() => {}} placeholder="" resultCount={rows.length} totalCount={data.evidenceRequests.length}
        right={<div style={{ display: "flex", gap: 10 }}>
          <FilterSelect label="" value={auditFilter} options={["All", ...data.audits.map((a) => a.id)]} onChange={setAuditFilter} />
          <FilterSelect label="" value={statusFilter} options={["All", ...EVIDENCE_REQ_STATUSES]} onChange={setStatusFilter} />
        </div>} />
      <EvidenceTab audit={{ id: auditFilter === "All" ? "AUD-2026-01" : auditFilter }} requests={rows} setData={setData} />
    </div>
  );
}
function GlobalFindingsPage({ data, setData }) {
  const [auditFilter, setAuditFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const rows = data.findings.filter((f) => (auditFilter === "All" || f.auditId === auditFilter) && (severityFilter === "All" || f.severity === severityFilter));
  return (
    <div>
      <PageHeading title="Findings" subtitle="Every finding raised across all audits, with severity and remediation status." />
      <Toolbar search="" onSearch={() => {}} placeholder="" resultCount={rows.length} totalCount={data.findings.length}
        right={<div style={{ display: "flex", gap: 10 }}>
          <FilterSelect label="" value={auditFilter} options={["All", ...data.audits.map((a) => a.id)]} onChange={setAuditFilter} />
          <FilterSelect label="" value={severityFilter} options={["All", ...FINDING_SEVERITIES]} onChange={setSeverityFilter} />
        </div>} />
      <FindingsTab audit={{ id: auditFilter === "All" ? "AUD-2026-01" : auditFilter }} findings={rows} setData={setData} />
    </div>
  );
}
function GlobalCorrectivePage({ data, setData }) {
  const [auditFilter, setAuditFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const rows = data.correctiveActions.filter((c) => (auditFilter === "All" || c.auditId === auditFilter) && (statusFilter === "All" || c.status === statusFilter));
  return (
    <div>
      <PageHeading title="Corrective Actions" subtitle="Remediation tracking for every audit finding, with auditor verification." />
      <Toolbar search="" onSearch={() => {}} placeholder="" resultCount={rows.length} totalCount={data.correctiveActions.length}
        right={<div style={{ display: "flex", gap: 10 }}>
          <FilterSelect label="" value={auditFilter} options={["All", ...data.audits.map((a) => a.id)]} onChange={setAuditFilter} />
          <FilterSelect label="" value={statusFilter} options={["All", ...CA_STATUSES]} onChange={setStatusFilter} />
        </div>} />
      <CorrectiveTab audit={{ id: auditFilter === "All" ? "AUD-2026-01" : auditFilter }} actions={rows} setData={setData} />
    </div>
  );
}
function GlobalScopePage({ data, goToAudit }) {
  return (
    <div>
      <PageHeading title="Audit Scope" subtitle="Organizational, technical, and compliance scope defined for each audit." />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data.audits.map((a) => {
          const s = data.scope[a.id];
          if (!s) return null;
          return (
            <div key={a.id} onClick={() => goToAudit(a.id, "scope")} style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 16, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 10.5, color: T.textMuted, fontWeight: 600 }}>{a.id}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>{a.name}</div>
                </div>
                <Badge {...auditStatusMeta(a.status)} label={a.status} />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Pill label={`${s.assets.length} assets`} color={T.blue} bg={T.blueSoft} />
                <Pill label={`${s.requirements.length} requirements`} color={T.purple} bg={T.purpleSoft} />
                <Pill label={`${s.controls.length} controls`} color={T.accent} bg={T.accentSoft} />
                <Pill label={`${s.policies.length} policies`} color={T.grey} bg={T.greySoft} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function GlobalReportsPage({ data, goToAudit }) {
  return (
    <div>
      <PageHeading title="Audit Reports" subtitle="Select an audit to view or export its full reporting package." />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data.audits.map((a) => (
          <div key={a.id} onClick={() => goToAudit(a.id, "reports")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 16, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: T.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileBarChart2 size={15} color={T.accent} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>{a.name}</div>
                <div style={{ fontSize: 11, color: T.textMuted }}>{a.id} · {a.status}</div>
              </div>
            </div>
            <Pill label={a.overallResult} {...overallResultMeta(a.overallResult)} />
          </div>
        ))}
      </div>
    </div>
  );
}
function GlobalHistoryPage({ data }) {
  const [auditFilter, setAuditFilter] = useState("All");
  const rows = data.history.filter((h) => auditFilter === "All" || h.auditId === auditFilter).slice().sort((a, b) => new Date(b.when) - new Date(a.when));
  return (
    <div>
      <PageHeading title="Audit History" subtitle="Full activity trail across every audit engagement."
        action={<FilterSelect label="" value={auditFilter} options={["All", ...data.audits.map((a) => a.id)]} onChange={setAuditFilter} />} />
      <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 20 }}>
        <HistoryTab events={rows} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  NAVIGATION                                                             */
/* ---------------------------------------------------------------------- */
const AUDIT_SUBNAV = [
  { key: "dashboard", label: "Dashboard", Icon: LayoutGrid },
  { key: "plans", label: "Audit Plans", Icon: CalendarClock },
  { key: "audits", label: "Audits", Icon: ClipboardList },
  { key: "scope", label: "Audit Scope", Icon: Target },
  { key: "checklist", label: "Audit Checklist", Icon: ListChecks },
  { key: "evidence", label: "Evidence & Requests", Icon: FileSearch },
  { key: "findings", label: "Findings", Icon: AlertOctagon },
  { key: "corrective", label: "Corrective Actions", Icon: Wrench },
  { key: "reports", label: "Audit Reports", Icon: FileBarChart2 },
  { key: "history", label: "Audit History", Icon: HistoryIcon },
];
const OTHER_NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutGrid },
  { label: "Context Organization", icon: Landmark, expandable: true },
  { label: "Governance", icon: Building2, expandable: true },
  { label: "Risk Management", icon: Shield, expandable: true },
  { label: "Control Management", icon: ShieldCheck, expandable: true },
  { label: "Compliance", icon: ClipboardList, expandable: true },
];
const OTHER_NAV_ITEMS_BOTTOM = [
  { label: "Asset Management", icon: Boxes, expandable: true },
  { label: "Artificial Intelligence", icon: Sparkles, expandable: true },
  { label: "Reporting", icon: BarChart3, expandable: true },
  { label: "Settings", icon: Settings, expandable: true },
];

function Sidebar({ page, setPage }) {
  const [auditOpen, setAuditOpen] = useState(true);
  const navRowStyle = (active) => ({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 10px", borderRadius: 7, marginBottom: 2, cursor: "pointer", background: active ? T.accentSoft : "transparent", color: active ? T.accent : T.textSecondary, fontSize: 13, fontWeight: active ? 600 : 500 });
  return (
    <div style={{ width: 230, minWidth: 230, background: T.sidebarBg, borderRight: `1px solid ${T.panelBorder}`, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 16px", borderBottom: `1px solid ${T.panelBorder}` }}>
        <Menu size={16} color={T.textSecondary} style={{ marginRight: 2 }} />
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#3a3a40,#1b1b1f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: T.accent, fontWeight: 700 }}>W</div>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: T.textPrimary }}>WADJET</div>
          <div style={{ fontSize: 9.5, color: T.textMuted, letterSpacing: 0.3 }}>Eyes on Risk. Control in Action.</div>
        </div>
      </div>
      <div style={{ padding: "10px 8px", flex: 1, overflowY: "auto" }}>
        {OTHER_NAV_ITEMS.map((item) => (
          <div key={item.label} style={navRowStyle(false)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><item.icon size={16} /><span>{item.label}</span></div>
            {item.expandable && <ChevronRight size={13} style={{ opacity: 0.6 }} />}
          </div>
        ))}
        <div style={navRowStyle(true)} onClick={() => setAuditOpen((o) => !o)}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Gavel size={16} /><span>Audit</span></div>
          {auditOpen ? <ChevronDown size={13} style={{ opacity: 0.8 }} /> : <ChevronRight size={13} style={{ opacity: 0.6 }} />}
        </div>
        {auditOpen && (
          <div style={{ marginLeft: 10, paddingLeft: 12, borderLeft: `1px solid ${T.panelBorder}`, marginBottom: 4 }}>
            {AUDIT_SUBNAV.map((item) => (
              <div key={item.key} onClick={() => setPage(item.key)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12.5, color: page === item.key ? T.accent : T.textSecondary, fontWeight: page === item.key ? 600 : 500, background: page === item.key ? T.accentSoft : "transparent" }}>
                <item.Icon size={13} /><span>{item.label}</span>
              </div>
            ))}
          </div>
        )}
        {OTHER_NAV_ITEMS_BOTTOM.map((item) => (
          <div key={item.label} style={navRowStyle(false)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><item.icon size={16} /><span>{item.label}</span></div>
            {item.expandable && <ChevronRight size={13} style={{ opacity: 0.6 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
function Header() {
  return (
    <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: `1px solid ${T.panelBorder}`, background: T.bg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "7px 12px", width: 340 }}>
        <Search size={14} color={T.textMuted} /><span style={{ fontSize: 12.5, color: T.textMuted }}>Search modules...</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <HelpCircle size={16} color={T.textSecondary} />
        <Settings size={16} color={T.textSecondary} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${T.panelBorder}`, borderRadius: 20, padding: "4px 10px 4px 4px" }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.accent, color: "#1a1a1a", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>s</div>
          <span style={{ fontSize: 12.5, color: T.textSecondary }}>admin</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  ROOT COMPONENT                                                         */
/* ---------------------------------------------------------------------- */
export default function AuditModule() {
  const [page, setPage] = useState("dashboard");
  const [openAuditId, setOpenAuditId] = useState(null);
  const [data, setData] = useState({
    plans: SEED_PLANS,
    audits: SEED_AUDITS,
    scope: SEED_SCOPE,
    checklist: SEED_CHECKLIST,
    evidenceRequests: SEED_EVIDENCE_REQUESTS,
    findings: SEED_FINDINGS,
    correctiveActions: SEED_CORRECTIVE_ACTIONS,
    history: SEED_HISTORY,
  });

  const goTo = (key) => { setPage(key); if (key !== "audits") setOpenAuditId(null); };
  const goToAudit = (auditId, tabKey) => { setPage("audits"); setOpenAuditId(auditId); };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <AuditDashboard data={data} goTo={goTo} />;
      case "plans": return <AuditPlansPage data={data} setData={setData} goTo={goTo} />;
      case "audits": return <AuditsPage data={data} setData={setData} goTo={goTo} openAuditId={openAuditId} setOpenAuditId={setOpenAuditId} />;
      case "scope": return <GlobalScopePage data={data} goToAudit={goToAudit} />;
      case "checklist": return <GlobalChecklistPage data={data} setData={setData} />;
      case "evidence": return <GlobalEvidencePage data={data} setData={setData} />;
      case "findings": return <GlobalFindingsPage data={data} setData={setData} />;
      case "corrective": return <GlobalCorrectivePage data={data} setData={setData} />;
      case "reports": return <GlobalReportsPage data={data} goToAudit={goToAudit} />;
      case "history": return <GlobalHistoryPage data={data} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg, fontFamily: FONT_STACK, color: T.textPrimary }}>
      <Sidebar page={page} setPage={goTo} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header />
        <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>{renderPage()}</div>
      </div>
    </div>
  );
}
