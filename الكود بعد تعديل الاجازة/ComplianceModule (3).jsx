import React, { useState, useMemo } from "react";
import {
  LayoutGrid, Landmark, Shield, ShieldCheck, ClipboardList, Boxes, Sparkles,
  BarChart3, Settings, Search, HelpCircle, ChevronRight, ChevronDown, X,
  Plus, Filter as FilterIcon, ArrowUpDown, Pencil, Link2, CheckCircle2,
  Clock, CircleDashed, AlertTriangle, Building2, Menu, Trash2, Eye,
  FileText, Layers, Map as MapIcon, FolderCheck, AlertOctagon, Wrench,
  FileBarChart2, Gavel, Upload, Download, RefreshCw, ArrowRight,
  BadgeCheck, MinusCircle, XCircle, HelpCircle as UnknownIcon, Archive,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  DESIGN TOKENS — same system as the Control Management module           */
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

/* ---------------------------------------------------------------------- */
/*  STUBS FOR EXISTING MODULES                                             */
/*  These stand in for Wadjet's real Control / Risk / Policy / Asset /     */
/*  Audit stores. Swap for the real selectors/services when integrating.  */
/* ---------------------------------------------------------------------- */
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
  { id: "AST-007", name: "Internal File Server" },
];
const EXISTING_AUDITS = [
  { id: "AUD-2026-01", name: "Q1 2026 Internal Security Audit" },
  { id: "AUD-2025-04", name: "Annual ISO 27001 Surveillance Audit" },
];

const byId = (list, id) => list.find((x) => x.id === id);
const nameOf = (list, id) => byId(list, id)?.name || id;

/* ---------------------------------------------------------------------- */
/*  ENUMS                                                                   */
/* ---------------------------------------------------------------------- */
const REQ_STATUSES = ["Not Assessed", "Compliant", "Partially Compliant", "Non-Compliant", "Not Applicable"];
const FRAMEWORK_TYPES = ["Standard", "Regulation", "Internal Policy Baseline"];
const FRAMEWORK_STATUSES = ["Active", "Archived", "Draft"];
const EVIDENCE_STATUSES = ["Missing", "Requested", "Submitted", "Under Review", "Approved", "Rejected", "Expired"];
const EVIDENCE_TYPES = ["Document", "Screenshot", "Log Export", "Policy", "Ticket / Record", "Attestation"];
const GAP_SEVERITIES = ["Critical", "High", "Medium", "Low"];
const GAP_STATUSES = ["Open", "In Progress", "Resolved", "Accepted", "Closed"];
const REMEDIATION_STATUSES = ["Open", "In Progress", "Blocked", "Completed", "Cancelled"];
const REMEDIATION_PRIORITIES = ["Critical", "High", "Medium", "Low"];

/* ---------------------------------------------------------------------- */
/*  SEED DATA                                                               */
/* ---------------------------------------------------------------------- */
const SEED_FRAMEWORKS = [
  {
    id: "FRW-001",
    name: "ISO/IEC 27001:2022",
    type: "Standard",
    version: "2022",
    issuer: "ISO/IEC",
    effectiveDate: "2022-10-25",
    description: "Information security management system requirements.",
    status: "Active",
  },
  {
    id: "FRW-002",
    name: "CBE Cybersecurity Framework",
    type: "Regulation",
    version: "v3.1",
    issuer: "Central Bank of Egypt",
    effectiveDate: "2023-01-01",
    description: "Regulatory cybersecurity baseline for supervised financial institutions.",
    status: "Active",
  },
  {
    id: "FRW-003",
    name: "PCI DSS v4.0",
    type: "Standard",
    version: "4.0",
    issuer: "PCI Security Standards Council",
    effectiveDate: "2024-03-31",
    description: "Security standard for organizations handling branded payment cards.",
    status: "Active",
  },
];

const SEED_REQUIREMENTS = [
  {
    id: "REQ-101",
    title: "Authentication information management",
    description: "The organization shall manage authentication information through a formal process, including strong factors for privileged and remote access.",
    frameworkId: "FRW-001",
    category: "Identity & Access",
    applicability: "Applicable",
    status: "Compliant",
    mappedControls: ["CTL-001"],
    relatedPolicies: ["POL-002"],
    relatedRisks: ["RSK-014"],
    relatedAssets: ["AST-001", "AST-003"],
  },
  {
    id: "REQ-102",
    title: "Network security controls",
    description: "Networks shall be managed and controlled to protect information in systems and applications, including perimeter filtering of malicious traffic.",
    frameworkId: "FRW-001",
    category: "Network Security",
    applicability: "Applicable",
    status: "Compliant",
    mappedControls: ["CTL-002"],
    relatedPolicies: ["POL-005"],
    relatedRisks: ["RSK-022"],
    relatedAssets: ["AST-002"],
  },
  {
    id: "REQ-103",
    title: "Access control policy and least privilege",
    description: "Access to information and associated assets shall be restricted according to business and security requirements, granting the minimum privilege necessary.",
    frameworkId: "FRW-001",
    category: "Identity & Access",
    applicability: "Applicable",
    status: "Partially Compliant",
    mappedControls: ["CTL-003"],
    relatedPolicies: ["POL-002"],
    relatedRisks: ["RSK-031"],
    relatedAssets: ["AST-003", "AST-004"],
  },
  {
    id: "REQ-104",
    title: "Management of technical vulnerabilities",
    description: "Information about technical vulnerabilities shall be obtained in a timely fashion, exposure evaluated, and appropriate measures taken.",
    frameworkId: "FRW-001",
    category: "Vulnerability Management",
    applicability: "Applicable",
    status: "Non-Compliant",
    mappedControls: ["CTL-004"],
    relatedPolicies: ["POL-009"],
    relatedRisks: ["RSK-045"],
    relatedAssets: ["AST-001", "AST-002", "AST-004", "AST-007"],
  },
  {
    id: "REQ-201",
    title: "Strong authentication for remote access",
    description: "Financial institutions shall enforce multi-factor authentication for all remote and privileged access channels.",
    frameworkId: "FRW-002",
    category: "Identity & Access",
    applicability: "Applicable",
    status: "Compliant",
    mappedControls: ["CTL-001"],
    relatedPolicies: ["POL-002"],
    relatedRisks: ["RSK-014"],
    relatedAssets: ["AST-001"],
  },
  {
    id: "REQ-202",
    title: "Vulnerability management program",
    description: "Institutions shall run a continuous vulnerability management program covering infrastructure and customer-facing applications.",
    frameworkId: "FRW-002",
    category: "Vulnerability Management",
    applicability: "Applicable",
    status: "Non-Compliant",
    mappedControls: ["CTL-004"],
    relatedPolicies: ["POL-009"],
    relatedRisks: ["RSK-045"],
    relatedAssets: ["AST-002", "AST-004"],
  },
  {
    id: "REQ-301",
    title: "Protect cardholder data with network segmentation and filtering",
    description: "Install and maintain network security controls to protect cardholder data environments from untrusted networks.",
    frameworkId: "FRW-003",
    category: "Network Security",
    applicability: "Applicable",
    status: "Partially Compliant",
    mappedControls: ["CTL-002"],
    relatedPolicies: ["POL-005"],
    relatedRisks: ["RSK-022"],
    relatedAssets: ["AST-002", "AST-006"],
  },
  {
    id: "REQ-302",
    title: "Restrict access to cardholder data by business need to know",
    description: "Limit access to system components and cardholder data to only those individuals whose job requires it.",
    frameworkId: "FRW-003",
    category: "Identity & Access",
    applicability: "Not Applicable",
    status: "Not Applicable",
    mappedControls: [],
    relatedPolicies: ["POL-002"],
    relatedRisks: [],
    relatedAssets: [],
  },
];

const SEED_ASSESSMENTS = [
  {
    id: "ASM-001",
    requirementId: "REQ-103",
    status: "Partially Compliant",
    assessor: "Marwa Hassan",
    date: "2026-06-02",
    comments: "RBAC rollout in progress; production database still pending migration.",
    findings: "Legacy shared accounts remain on the core banking database.",
    evidenceIds: ["EVD-003"],
    controlEffectiveness: "Partially Effective",
    reviewer: "CISO",
    reviewStatus: "Reviewed",
  },
  {
    id: "ASM-002",
    requirementId: "REQ-104",
    status: "Non-Compliant",
    assessor: "Omar Farid",
    date: "2026-07-14",
    comments: "Scanning tool procured but not yet scheduled across all asset groups.",
    findings: "No completed scan cycle in the last quarter.",
    evidenceIds: [],
    controlEffectiveness: "Not Effective",
    reviewer: "Compliance Manager",
    reviewStatus: "Pending Review",
  },
  {
    id: "ASM-003",
    requirementId: "REQ-101",
    status: "Compliant",
    assessor: "Marwa Hassan",
    date: "2026-05-20",
    comments: "MFA enforced for all staff and remote sessions, verified via IAM logs.",
    findings: "No exceptions found.",
    evidenceIds: ["EVD-001"],
    controlEffectiveness: "Effective",
    reviewer: "CISO",
    reviewStatus: "Reviewed",
  },
];

const SEED_EVIDENCE = [
  {
    id: "EVD-001",
    name: "MFA Enforcement Policy Export.pdf",
    requirementId: "REQ-101",
    controlId: "CTL-001",
    type: "Document",
    owner: "IAM Manager",
    uploadDate: "2026-05-18",
    expirationDate: "2027-05-18",
    status: "Approved",
    verificationStatus: "Verified",
    reviewer: "CISO",
    comments: "Confirms MFA enforced across IdP for all users.",
  },
  {
    id: "EVD-002",
    name: "WAF Ruleset Configuration.png",
    requirementId: "REQ-102",
    controlId: "CTL-002",
    type: "Screenshot",
    owner: "Network Security Lead",
    uploadDate: "2026-04-30",
    expirationDate: "2027-04-30",
    status: "Approved",
    verificationStatus: "Verified",
    reviewer: "CISO",
    comments: "",
  },
  {
    id: "EVD-003",
    name: "RBAC Access Review Q2.xlsx",
    requirementId: "REQ-103",
    controlId: "CTL-003",
    type: "Log Export",
    owner: "IT Operations Manager",
    uploadDate: "2026-06-01",
    expirationDate: "2026-12-01",
    status: "Under Review",
    verificationStatus: "Pending",
    reviewer: "Compliance Manager",
    comments: "Awaiting confirmation on legacy shared accounts.",
  },
  {
    id: "EVD-004",
    name: "Vulnerability Scan Report.pdf",
    requirementId: "REQ-104",
    controlId: "CTL-004",
    type: "Document",
    owner: "Vulnerability Management Lead",
    uploadDate: "",
    expirationDate: "",
    status: "Missing",
    verificationStatus: "Pending",
    reviewer: "",
    comments: "No completed scan report on file yet.",
  },
];

const SEED_GAPS = [
  {
    id: "GAP-001",
    requirementId: "REQ-103",
    frameworkId: "FRW-001",
    description: "Shared privileged accounts still active on the core banking database.",
    currentState: "Shared service accounts with broad access remain in use.",
    expectedState: "Individual, least-privilege accounts for all database access.",
    severity: "High",
    owner: "IT Operations Manager",
    dueDate: "2026-09-30",
    status: "In Progress",
    relatedRiskId: "RSK-031",
    relatedControlId: "CTL-003",
    remediationPlan: "Migrate shared accounts to named accounts with role-based grants.",
  },
  {
    id: "GAP-002",
    requirementId: "REQ-104",
    frameworkId: "FRW-001",
    description: "No completed vulnerability scan cycle in the current quarter.",
    currentState: "Scanning tool deployed but not scheduled.",
    expectedState: "Weekly automated scans across all in-scope infrastructure.",
    severity: "Critical",
    owner: "Vulnerability Management Lead",
    dueDate: "2026-09-15",
    status: "Open",
    relatedRiskId: "RSK-045",
    relatedControlId: "CTL-004",
    remediationPlan: "Finalize scan schedules and onboard remaining asset groups.",
  },
  {
    id: "GAP-003",
    requirementId: "REQ-202",
    frameworkId: "FRW-002",
    description: "Vulnerability management program does not yet cover customer-facing applications.",
    currentState: "Infrastructure scanning only; application layer excluded.",
    expectedState: "Program extended to cover all customer-facing applications.",
    severity: "High",
    owner: "Vulnerability Management Lead",
    dueDate: "2026-10-01",
    status: "Open",
    relatedRiskId: "RSK-045",
    relatedControlId: "CTL-004",
    remediationPlan: "Extend scan scope and add DAST tooling for web applications.",
  },
];

const SEED_REMEDIATION = [
  {
    id: "REM-001",
    gapId: "GAP-001",
    requirementId: "REQ-103",
    description: "Migrate shared database accounts to individual least-privilege accounts.",
    owner: "IT Operations Manager",
    priority: "High",
    dueDate: "2026-09-30",
    status: "In Progress",
    progress: 55,
    relatedRiskId: "RSK-031",
    relatedControlId: "CTL-003",
  },
  {
    id: "REM-002",
    gapId: "GAP-002",
    requirementId: "REQ-104",
    description: "Finalize weekly vulnerability scan schedule across all infrastructure asset groups.",
    owner: "Vulnerability Management Lead",
    priority: "Critical",
    dueDate: "2026-09-15",
    status: "Open",
    progress: 10,
    relatedRiskId: "RSK-045",
    relatedControlId: "CTL-004",
  },
  {
    id: "REM-003",
    gapId: "GAP-003",
    requirementId: "REQ-202",
    description: "Onboard customer-facing applications into the vulnerability scanning scope.",
    owner: "Vulnerability Management Lead",
    priority: "High",
    dueDate: "2026-10-01",
    status: "Blocked",
    progress: 20,
    relatedRiskId: "RSK-045",
    relatedControlId: "CTL-004",
  },
];

const SEED_FINDINGS = [
  {
    id: "FND-001",
    auditId: "AUD-2026-01",
    requirementId: "REQ-104",
    finding: "Vulnerability scanning not consistently performed across all in-scope infrastructure.",
    severity: "High",
    evidenceId: "EVD-004",
    auditor: "Internal Audit Team",
    status: "Open",
    correctiveAction: "Linked to REM-002",
    dueDate: "2026-09-15",
  },
  {
    id: "FND-002",
    auditId: "AUD-2025-04",
    requirementId: "REQ-103",
    finding: "Legacy shared accounts identified on the core banking database during access review.",
    severity: "Medium",
    evidenceId: "EVD-003",
    auditor: "External ISO Auditor",
    status: "In Remediation",
    correctiveAction: "Linked to REM-001",
    dueDate: "2026-09-30",
  },
];

/* ---------------------------------------------------------------------- */
/*  BUSINESS LOGIC                                                         */
/* ---------------------------------------------------------------------- */
// Compliant = 100, Partially Compliant = 50, Non-Compliant = 0.
// Not Applicable is excluded entirely. Not Assessed is excluded from the
// score but surfaced separately so it isn't silently counted as compliant.
function complianceScore(requirements) {
  const scored = requirements.filter(
    (r) => r.status !== "Not Applicable" && r.status !== "Not Assessed"
  );
  if (scored.length === 0) return 0;
  const points = { Compliant: 100, "Partially Compliant": 50, "Non-Compliant": 0 };
  const total = scored.reduce((s, r) => s + (points[r.status] ?? 0), 0);
  return Math.round(total / scored.length);
}

const reqStatusMeta = (status) => {
  switch (status) {
    case "Compliant":
      return { color: T.green, bg: T.greenSoft, Icon: BadgeCheck };
    case "Partially Compliant":
      return { color: T.amber, bg: T.amberSoft, Icon: MinusCircle };
    case "Non-Compliant":
      return { color: T.red, bg: T.redSoft, Icon: XCircle };
    case "Not Applicable":
      return { color: T.grey, bg: T.greySoft, Icon: Archive };
    default:
      return { color: T.blue, bg: T.blueSoft, Icon: UnknownIcon };
  }
};

const evidenceStatusMeta = (status) => {
  switch (status) {
    case "Approved":
      return { color: T.green, bg: T.greenSoft };
    case "Under Review":
    case "Submitted":
    case "Requested":
      return { color: T.amber, bg: T.amberSoft };
    case "Rejected":
    case "Expired":
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
    default:
      return { color: T.grey, bg: T.greySoft };
  }
};

const gapStatusMeta = (status) => {
  switch (status) {
    case "Resolved":
    case "Closed":
      return { color: T.green, bg: T.greenSoft };
    case "In Progress":
      return { color: T.amber, bg: T.amberSoft };
    case "Accepted":
      return { color: T.blue, bg: T.blueSoft };
    default:
      return { color: T.red, bg: T.redSoft };
  }
};

const remediationStatusMeta = (status) => {
  switch (status) {
    case "Completed":
      return { color: T.green, bg: T.greenSoft };
    case "In Progress":
      return { color: T.amber, bg: T.amberSoft };
    case "Blocked":
    case "Cancelled":
      return { color: T.red, bg: T.redSoft };
    default:
      return { color: T.grey, bg: T.greySoft };
  }
};

const isOverdue = (dueDate, status, doneStatuses) =>
  dueDate && !doneStatuses.includes(status) && new Date(dueDate) < new Date("2026-08-22");

/* ---------------------------------------------------------------------- */
/*  SHARED PRIMITIVES (identical language to Control Management)           */
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
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 20,
        background: bg,
        color,
        fontSize: 11.5,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {Icon && <Icon size={11} />}
      {label}
    </span>
  );
}

function Pill({ label, color, bg }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color,
        background: bg,
        padding: "3px 8px",
        borderRadius: 6,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function KpiCard({ label, value, Icon, iconColor, iconBg, sub }) {
  return (
    <div
      style={{
        background: T.panelBg,
        border: `1px solid ${T.panelBorder}`,
        borderRadius: 10,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: 10.5,
            letterSpacing: 0.6,
            color: T.textMuted,
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
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
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        color: T.accent,
        margin: "20px 0 10px",
        paddingBottom: 8,
        borderBottom: `1px solid ${T.panelBorder}`,
      }}
    >
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
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        fontSize: 12,
        borderBottom: `1px solid ${T.panelBorder}`,
        paddingBottom: 8,
      }}
    >
      <span style={{ color: T.textMuted }}>{k}</span>
      <span style={{ color: T.textPrimary, textAlign: "right" }}>{v}</span>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div style={{ padding: "40px 16px", textAlign: "center", color: T.textMuted, fontSize: 12.5 }}>
      {label}
    </div>
  );
}

function Toolbar({ search, onSearch, placeholder, right, filterOpen, onToggleFilters, activeFilterCount, resultCount, totalCount }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: T.inputBg,
          border: `1px solid ${T.panelBorder}`,
          borderRadius: 8,
          padding: "9px 12px",
          flex: "1 1 240px",
          maxWidth: 360,
        }}
      >
        <Search size={14} color={T.textMuted} />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: T.textPrimary,
            fontSize: 12.5,
            width: "100%",
            fontFamily: FONT_STACK,
          }}
        />
      </div>
      {onToggleFilters && (
        <button
          onClick={onToggleFilters}
          style={{
            ...secondaryBtnStyle,
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: activeFilterCount ? T.accent : T.textSecondary,
            borderColor: activeFilterCount ? T.accent : T.panelBorder,
          }}
        >
          <FilterIcon size={13} />
          Filters
          {activeFilterCount > 0 && (
            <span
              style={{
                background: T.accent,
                color: "#1a1508",
                fontSize: 10,
                fontWeight: 700,
                borderRadius: 10,
                padding: "1px 6px",
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      )}
      {right}
      <div style={{ fontSize: 11.5, color: T.textMuted, marginLeft: "auto" }}>
        {resultCount} of {totalCount}
      </div>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: T.textMuted, marginBottom: 5, fontWeight: 600 }}>{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle()}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function useSort(defaultKey) {
  const [sort, setSort] = useState({ key: defaultKey, dir: "asc" });
  const toggle = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
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
                <th
                  key={col.key}
                  onClick={() => !col.noSort && onSort(col.key)}
                  style={{
                    textAlign: "left",
                    padding: "11px 16px",
                    fontSize: 10.5,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    color: T.textMuted,
                    fontWeight: 700,
                    borderBottom: `1px solid ${T.panelBorder}`,
                    cursor: col.noSort ? "default" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {col.label}
                    {!col.noSort && (
                      <ArrowUpDown size={10} style={{ opacity: sort.key === col.key ? 1 : 0.3 }} />
                    )}
                  </span>
                </th>
              ))}
              {renderActions && <th style={{ padding: "11px 16px", borderBottom: `1px solid ${T.panelBorder}` }} />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1}>
                  <EmptyState label="No records match your search or filters." />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{ borderBottom: `1px solid ${T.panelBorder}`, cursor: onRowClick ? "pointer" : "default" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.rowHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={{ padding: "12px 16px", fontSize: 12, verticalAlign: "middle" }}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                  {renderActions && (
                    <td style={{ padding: "12px 16px" }} onClick={(e) => e.stopPropagation()}>
                      {renderActions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* simple CSS/SVG chart primitives — no charting dependency required */
function HBarChart({ data, max, colorFn }) {
  const m = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 130, fontSize: 11.5, color: T.textSecondary, flexShrink: 0 }}>{d.label}</div>
          <div style={{ flex: 1, height: 8, background: "#1c1c20", borderRadius: 4, overflow: "hidden" }}>
            <div
              style={{
                width: `${(d.value / m) * 100}%`,
                height: "100%",
                background: colorFn ? colorFn(d) : T.accent,
                borderRadius: 4,
              }}
            />
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
            const circle = (
              <circle
                key={seg.label}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={14}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return circle;
          })}
        </g>
        <text x="50%" y="47%" textAnchor="middle" fontSize="20" fontWeight="700" fill={T.textPrimary}>
          {centerValue}
        </text>
        <text x="50%" y="61%" textAnchor="middle" fontSize="9" fill={T.textMuted} letterSpacing="0.5">
          {centerLabel}
        </text>
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
  const w = 320;
  const h = 70;
  const max = Math.max(...points.map((p) => p.value));
  const min = Math.min(...points.map((p) => p.value));
  const range = max - min || 1;
  const stepX = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * stepX} ${h - ((p.value - min) / range) * h}`)
    .join(" ");
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
        <path d={path} fill="none" stroke={color} strokeWidth={2} />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {points.map((p) => (
          <span key={p.label} style={{ fontSize: 9.5, color: T.textMuted }}>
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  PAGE: DASHBOARD                                                        */
/* ---------------------------------------------------------------------- */
function ComplianceDashboard({ data, goTo }) {
  const { frameworks, requirements, gaps, evidence, remediation } = data;
  const score = complianceScore(requirements);
  const compliant = requirements.filter((r) => r.status === "Compliant").length;
  const partial = requirements.filter((r) => r.status === "Partially Compliant").length;
  const nonCompliant = requirements.filter((r) => r.status === "Non-Compliant").length;
  const openGaps = gaps.filter((g) => !["Resolved", "Closed"].includes(g.status)).length;
  const missingEvidence = evidence.filter((e) => ["Missing", "Requested", "Expired", "Rejected"].includes(e.status)).length;
  const overdueRemediation = remediation.filter((r) => isOverdue(r.dueDate, r.status, ["Completed", "Cancelled"])).length;

  const byFramework = frameworks.map((f) => {
    const reqs = requirements.filter((r) => r.frameworkId === f.id);
    return { label: f.name, value: complianceScore(reqs) };
  });

  const statusDonut = [
    { label: "Compliant", value: compliant, color: T.green },
    { label: "Partially Compliant", value: partial, color: T.amber },
    { label: "Non-Compliant", value: nonCompliant, color: T.red },
    { label: "Not Applicable", value: requirements.filter((r) => r.status === "Not Applicable").length, color: T.grey },
    { label: "Not Assessed", value: requirements.filter((r) => r.status === "Not Assessed").length, color: T.blue },
  ].filter((s) => s.value > 0);

  const gapsBySeverity = GAP_SEVERITIES.map((sev) => ({
    label: sev,
    value: gaps.filter((g) => g.severity === sev).length,
  }));

  const remediationProgress = remediation.map((r) => ({ label: r.id, value: r.progress }));

  const trend = [
    { label: "Mar", value: 48 },
    { label: "Apr", value: 52 },
    { label: "May", value: 58 },
    { label: "Jun", value: 61 },
    { label: "Jul", value: 65 },
    { label: "Aug", value: score },
  ];

  const recent = [
    { icon: FolderCheck, text: "Assessment completed for REQ-101 (Compliant) by Marwa Hassan", when: "2 days ago" },
    { icon: Upload, text: "Evidence EVD-003 submitted for REQ-103", when: "3 days ago" },
    { icon: AlertOctagon, text: "New gap GAP-002 opened on REQ-104 (Critical)", when: "5 days ago" },
    { icon: Wrench, text: "Remediation REM-001 progress updated to 55%", when: "1 week ago" },
    { icon: Layers, text: "PCI DSS v4.0 framework requirements refreshed", when: "2 weeks ago" },
  ];

  return (
    <div>
      <PageHeading
        title="Compliance Dashboard"
        subtitle="Executive overview of framework coverage, requirement status, and remediation health."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 22 }}>
        <KpiCard label="Overall Compliance Score" value={`${score}%`} Icon={ShieldCheck} iconColor={T.accent} iconBg={T.accentSoft} />
        <KpiCard label="Compliant Requirements" value={compliant} Icon={BadgeCheck} iconColor={T.green} iconBg={T.greenSoft} />
        <KpiCard label="Partially Compliant" value={partial} Icon={MinusCircle} iconColor={T.amber} iconBg={T.amberSoft} />
        <KpiCard label="Non-Compliant" value={nonCompliant} Icon={XCircle} iconColor={T.red} iconBg={T.redSoft} />
        <KpiCard label="Open Gaps" value={openGaps} Icon={AlertOctagon} iconColor={T.red} iconBg={T.redSoft} />
        <KpiCard label="Missing Evidence" value={missingEvidence} Icon={FileText} iconColor={T.grey} iconBg={T.greySoft} />
        <KpiCard label="Overdue Remediation" value={overdueRemediation} Icon={Clock} iconColor={T.amber} iconBg={T.amberSoft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16, marginBottom: 16 }}>
        <ChartCard title="Compliance by Framework" onExpand={() => goTo("frameworks")}>
          <HBarChart data={byFramework} max={100} colorFn={(d) => (d.value >= 70 ? T.green : d.value >= 40 ? T.amber : T.red)} />
        </ChartCard>
        <ChartCard title="Compliance Status Distribution" onExpand={() => goTo("requirements")}>
          <DonutChart segments={statusDonut} centerValue={`${score}%`} centerLabel="SCORE" />
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
        <ChartCard title="Compliance Trend Over Time">
          <SparkTrend points={trend} color={T.accent} />
        </ChartCard>
        <ChartCard title="Gaps by Severity" onExpand={() => goTo("gaps")}>
          <HBarChart data={gapsBySeverity} colorFn={(d) => severityMeta(d.label).color} />
        </ChartCard>
        <ChartCard title="Remediation Progress" onExpand={() => goTo("remediation")}>
          <HBarChart data={remediationProgress} max={100} colorFn={() => T.blue} />
        </ChartCard>
      </div>

      <ChartCard title="Recent Activity">
        <div style={{ display: "flex", flexDirection: "column" }}>
          {recent.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderBottom: i < recent.length - 1 ? `1px solid ${T.panelBorder}` : "none",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: T.accentSoft,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
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

function ChartCard({ title, children, onExpand }) {
  return (
    <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary, letterSpacing: 0.2 }}>{title}</div>
        {onExpand && (
          <button onClick={onExpand} style={{ ...iconBtnStyle, padding: 6 }} title="View section">
            <ArrowRight size={12} color={T.textMuted} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function PageHeading({ title, subtitle, action }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: T.textPrimary }}>{title}</h1>
          <p style={{ fontSize: 12.5, color: T.textMuted, margin: "6px 0 0" }}>{subtitle}</p>
        </div>
        {action}
      </div>
      <div style={{ height: 1, background: T.panelBorder, marginBottom: 22 }} />
    </>
  );
}

/* ---------------------------------------------------------------------- */
/*  PAGE: FRAMEWORKS & REGULATIONS                                         */
/* ---------------------------------------------------------------------- */
function FrameworksPage({ data, setData, goTo }) {
  const { frameworks, requirements } = data;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const { sort, toggle, apply } = useSort("id");

  const enriched = frameworks.map((f) => {
    const reqs = requirements.filter((r) => r.frameworkId === f.id);
    const mappedControls = new Set(reqs.flatMap((r) => r.mappedControls));
    return {
      ...f,
      requirementCount: reqs.length,
      mappedControlCount: mappedControls.size,
      compliancePct: complianceScore(reqs),
    };
  });

  const filtered = apply(
    enriched.filter((f) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || f.name.toLowerCase().includes(q) || f.issuer.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || f.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
  );

  const save = (fw) => {
    setData((d) => ({
      ...d,
      frameworks: d.frameworks.some((x) => x.id === fw.id)
        ? d.frameworks.map((x) => (x.id === fw.id ? fw : x))
        : [...d.frameworks, fw],
    }));
    setEditing(null);
    setCreating(false);
  };

  const archive = (fw) => {
    setData((d) => ({
      ...d,
      frameworks: d.frameworks.map((x) => (x.id === fw.id ? { ...x, status: "Archived" } : x)),
    }));
  };

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Framework", render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { key: "type", label: "Type" },
    { key: "version", label: "Version" },
    { key: "issuer", label: "Issuer" },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <Pill
          label={r.status}
          color={r.status === "Active" ? T.green : r.status === "Draft" ? T.blue : T.grey}
          bg={r.status === "Active" ? T.greenSoft : r.status === "Draft" ? T.blueSoft : T.greySoft}
        />
      ),
    },
    { key: "requirementCount", label: "Requirements" },
    { key: "mappedControlCount", label: "Mapped Controls" },
    {
      key: "compliancePct",
      label: "Compliance",
      render: (r) => <ProgressBar value={r.compliancePct} color={r.compliancePct >= 70 ? T.green : r.compliancePct >= 40 ? T.amber : T.red} />,
    },
  ];

  return (
    <div>
      <PageHeading
        title="Frameworks & Regulations"
        subtitle="Frameworks tracked for compliance, with live requirement and control coverage."
        action={
          <button onClick={() => setCreating(true)} style={{ ...primaryBtnStyle, padding: "10px 16px" }}>
            <Plus size={14} style={{ marginRight: 6 }} /> Add Framework
          </button>
        }
      />
      <Toolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search frameworks or issuers…"
        resultCount={filtered.length}
        totalCount={frameworks.length}
        right={
          <FilterSelect label="" value={statusFilter} options={["All", ...FRAMEWORK_STATUSES]} onChange={setStatusFilter} />
        }
      />
      <DataTable
        columns={columns}
        rows={filtered}
        sort={sort}
        onSort={toggle}
        onRowClick={(r) => setDetail(r)}
        renderActions={(r) => (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setDetail(r)} style={iconBtnStyle} title="View requirements">
              <Eye size={13} color={T.textSecondary} />
            </button>
            <button onClick={() => setEditing(r)} style={iconBtnStyle} title="Edit">
              <Pencil size={13} color={T.textSecondary} />
            </button>
            <button onClick={() => archive(r)} style={iconBtnStyle} title="Archive">
              <Archive size={13} color={T.textSecondary} />
            </button>
          </div>
        )}
      />

      {detail && (
        <div style={overlayStyle}>
          <div style={{ ...drawerStyle, width: 520 }}>
            <div style={drawerHeaderStyle}>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>{detail.id}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary }}>{detail.name}</div>
              </div>
              <button onClick={() => setDetail(null)} style={iconBtnStyle}>
                <X size={15} color={T.textSecondary} />
              </button>
            </div>
            <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }}>
              <SectionLabel>Framework Information</SectionLabel>
              <p style={{ fontSize: 12.5, color: T.textSecondary, lineHeight: 1.6, marginTop: 0 }}>{detail.description}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                <DetailRow k="Type" v={detail.type} />
                <DetailRow k="Version" v={detail.version} />
                <DetailRow k="Issuing Organization" v={detail.issuer} />
                <DetailRow k="Effective Date" v={detail.effectiveDate} />
                <DetailRow k="Status" v={detail.status} />
                <DetailRow k="Compliance %" v={`${detail.compliancePct}%`} />
              </div>

              <SectionLabel>Requirements ({detail.requirementCount})</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {requirements
                  .filter((r) => r.frameworkId === detail.id)
                  .map((r) => {
                    const meta = reqStatusMeta(r.status);
                    return (
                      <div
                        key={r.id}
                        onClick={() => goTo("requirements")}
                        style={{
                          background: T.cardBg,
                          border: `1px solid ${T.panelBorder}`,
                          borderRadius: 7,
                          padding: "9px 11px",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary }}>{r.title}</div>
                          <div style={{ fontSize: 10.5, color: T.textMuted }}>{r.id}</div>
                        </div>
                        <Badge {...meta} label={r.status} />
                      </div>
                    );
                  })}
              </div>
            </div>
            <div style={drawerFooterStyle}>
              <button onClick={() => setDetail(null)} style={secondaryBtnStyle}>
                Close
              </button>
              <button onClick={() => setEditing(detail)} style={primaryBtnStyle}>
                <Pencil size={13} style={{ marginRight: 6 }} /> Edit Framework
              </button>
            </div>
          </div>
        </div>
      )}

      {(editing || creating) && (
        <FrameworkFormDrawer
          initial={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={save}
        />
      )}
    </div>
  );
}

function FrameworkFormDrawer({ initial, onClose, onSave }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(
    initial || {
      id: `FRW-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      name: "",
      type: "Standard",
      version: "",
      issuer: "",
      effectiveDate: "",
      description: "",
      status: "Active",
    }
  );
  const set = (f, v) => setForm((x) => ({ ...x, [f]: v }));
  const [error, setError] = useState("");

  const save = () => {
    if (!form.name.trim()) return setError("Framework Name is required.");
    onSave(form);
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...drawerStyle, width: 480 }}>
        <div style={drawerHeaderStyle}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{isEdit ? "Edit Framework" : "Add Framework"}</div>
          <button onClick={onClose} style={iconBtnStyle}>
            <X size={15} color={T.textSecondary} />
          </button>
        </div>
        <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }}>
          <Field label="Framework Name" required error={error}>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} style={inputStyle()} />
          </Field>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="Type">
                <select value={form.type} onChange={(e) => set("type", e.target.value)} style={selectStyle()}>
                  {FRAMEWORK_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Version">
                <input value={form.version} onChange={(e) => set("version", e.target.value)} style={inputStyle()} />
              </Field>
            </div>
          </div>
          <Field label="Issuing Organization">
            <input value={form.issuer} onChange={(e) => set("issuer", e.target.value)} style={inputStyle()} />
          </Field>
          <Field label="Effective Date">
            <input type="date" value={form.effectiveDate} onChange={(e) => set("effectiveDate", e.target.value)} style={inputStyle()} />
          </Field>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              style={inputStyle({ resize: "vertical", fontFamily: FONT_STACK })}
            />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => set("status", e.target.value)} style={selectStyle()}>
              {FRAMEWORK_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
        <div style={drawerFooterStyle}>
          <button onClick={onClose} style={secondaryBtnStyle}>
            Cancel
          </button>
          <button onClick={save} style={primaryBtnStyle}>
            {isEdit ? "Save Changes" : "Add Framework"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  PAGE: REQUIREMENTS                                                     */
/* ---------------------------------------------------------------------- */
function RequirementsPage({ data, setData, goTo }) {
  const { requirements, frameworks, gaps, evidence, assessments } = data;
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ framework: "All", status: "All", domain: "All" });
  const [detail, setDetail] = useState(null);
  const { sort, toggle, apply } = useSort("id");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const domains = Array.from(new Set(requirements.map((r) => r.category))).sort();

  const filtered = apply(
    requirements.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || r.id.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
      const matchesFramework = filters.framework === "All" || r.frameworkId === filters.framework;
      const matchesStatus = filters.status === "All" || r.status === filters.status;
      const matchesDomain = filters.domain === "All" || r.category === filters.domain;
      return matchesSearch && matchesFramework && matchesStatus && matchesDomain;
    })
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const evidenceStatusFor = (reqId) => {
    const items = evidence.filter((e) => e.requirementId === reqId);
    if (items.length === 0) return "Missing";
    if (items.some((e) => e.status === "Approved")) return "Approved";
    return items[0].status;
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== "All").length;

  const columns = [
    { key: "id", label: "ID" },
    { key: "title", label: "Title", render: (r) => <span style={{ fontWeight: 600 }}>{r.title}</span> },
    { key: "frameworkId", label: "Framework", render: (r) => nameOf(frameworks, r.frameworkId) },
    { key: "category", label: "Domain" },
    { key: "applicability", label: "Applicability" },
    { key: "status", label: "Status", render: (r) => <Badge {...reqStatusMeta(r.status)} label={r.status} /> },
    { key: "mappedControls", label: "Controls", noSort: true, render: (r) => `${r.mappedControls.length} mapped` },
    { key: "evidence", label: "Evidence", noSort: true, render: (r) => <Pill label={evidenceStatusFor(r.id)} {...evidenceStatusMeta(evidenceStatusFor(r.id))} /> },
  ];

  return (
    <div>
      <PageHeading title="Requirements" subtitle="Every requirement across active frameworks, with a 360° view of relationships." />
      <Toolbar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search requirements by ID, title, description…"
        onToggleFilters={() => setShowFilters((s) => !s)}
        activeFilterCount={activeFilterCount}
        resultCount={filtered.length}
        totalCount={requirements.length}
      />
      {showFilters && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 10,
            marginBottom: 16,
            padding: 14,
            background: T.panelBg,
            border: `1px solid ${T.panelBorder}`,
            borderRadius: 10,
          }}
        >
          <FilterSelect
            label="Framework"
            value={filters.framework}
            options={["All", ...frameworks.map((f) => f.id)]}
            onChange={(v) => setFilters((f) => ({ ...f, framework: v }))}
          />
          <FilterSelect
            label="Status"
            value={filters.status}
            options={["All", ...REQ_STATUSES]}
            onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
          />
          <FilterSelect
            label="Domain"
            value={filters.domain}
            options={["All", ...domains]}
            onChange={(v) => setFilters((f) => ({ ...f, domain: v }))}
          />
        </div>
      )}
      <DataTable columns={columns} rows={paged} sort={sort} onSort={toggle} onRowClick={(r) => setDetail(r)} />

      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14 }}>
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} style={{ ...secondaryBtnStyle, opacity: page === 1 ? 0.4 : 1 }}>
          Previous
        </button>
        <span style={{ fontSize: 12, color: T.textMuted, alignSelf: "center" }}>
          Page {page} of {totalPages}
        </span>
        <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} style={{ ...secondaryBtnStyle, opacity: page === totalPages ? 0.4 : 1 }}>
          Next
        </button>
      </div>

      {detail && (
        <RequirementDetailsDrawer
          requirement={detail}
          framework={byId(frameworks, detail.frameworkId)}
          gaps={gaps.filter((g) => g.requirementId === detail.id)}
          evidenceItems={evidence.filter((e) => e.requirementId === detail.id)}
          assessmentItems={assessments.filter((a) => a.requirementId === detail.id)}
          onClose={() => setDetail(null)}
          onStatusChange={(status) =>
            setData((d) => ({
              ...d,
              requirements: d.requirements.map((r) => (r.id === detail.id ? { ...r, status } : r)),
            }))
          }
          goTo={goTo}
        />
      )}
    </div>
  );
}

function RequirementDetailsDrawer({ requirement, framework, gaps, evidenceItems, assessmentItems, onClose, onStatusChange, goTo }) {
  const meta = reqStatusMeta(requirement.status);
  return (
    <div style={overlayStyle}>
      <div style={{ ...drawerStyle, width: 540 }}>
        <div style={drawerHeaderStyle}>
          <div>
            <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>{requirement.id} · {framework?.name}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary }}>{requirement.title}</div>
          </div>
          <button onClick={onClose} style={iconBtnStyle}>
            <X size={15} color={T.textSecondary} />
          </button>
        </div>
        <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }}>
          <SectionLabel>Requirement Information</SectionLabel>
          <p style={{ fontSize: 12.5, color: T.textSecondary, lineHeight: 1.6, marginTop: 0 }}>{requirement.description}</p>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 10 }}>
            <DetailStat label="Category">
              <span style={{ fontSize: 12.5, color: T.textPrimary }}>{requirement.category}</span>
            </DetailStat>
            <DetailStat label="Applicability">
              <span style={{ fontSize: 12.5, color: T.textPrimary }}>{requirement.applicability}</span>
            </DetailStat>
            <DetailStat label="Status">
              <Badge {...meta} label={requirement.status} />
            </DetailStat>
          </div>
          <Field label="Update compliance status">
            <select value={requirement.status} onChange={(e) => onStatusChange(e.target.value)} style={selectStyle()}>
              {REQ_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>

          <SectionLabel>Relationships</SectionLabel>
          <RelationBlock title="Mapped Controls" items={requirement.mappedControls} lookup={EXISTING_CONTROLS} onOpen={() => goTo && goTo("controls")} />
          <RelationBlock title="Related Policies" items={requirement.relatedPolicies} lookup={EXISTING_POLICIES} />
          <RelationBlock title="Related Risks" items={requirement.relatedRisks} lookup={EXISTING_RISKS} />
          <RelationBlock title="Related Assets" items={requirement.relatedAssets} lookup={EXISTING_ASSETS} />

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10.5, color: T.textMuted, marginBottom: 6, fontWeight: 600 }}>
              Evidence ({evidenceItems.length})
            </div>
            {evidenceItems.length === 0 ? (
              <div style={{ fontSize: 12, color: T.textMuted }}>No evidence submitted yet.</div>
            ) : (
              evidenceItems.map((e) => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12 }}>
                  <span style={{ color: T.textPrimary }}>{e.name}</span>
                  <Pill label={e.status} {...evidenceStatusMeta(e.status)} />
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10.5, color: T.textMuted, marginBottom: 6, fontWeight: 600 }}>
              Compliance Gaps ({gaps.length})
            </div>
            {gaps.length === 0 ? (
              <div style={{ fontSize: 12, color: T.textMuted }}>No open gaps.</div>
            ) : (
              gaps.map((g) => (
                <div key={g.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12 }}>
                  <span style={{ color: T.textPrimary }}>{g.id} — {g.description}</span>
                  <Pill label={g.severity} {...severityMeta(g.severity)} />
                </div>
              ))
            )}
          </div>

          <SectionLabel>Assessment History</SectionLabel>
          {assessmentItems.length === 0 ? (
            <div style={{ fontSize: 12, color: T.textMuted }}>No assessments recorded.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {assessmentItems.map((a) => (
                <div key={a.id} style={{ background: T.cardBg, border: `1px solid ${T.panelBorder}`, borderRadius: 7, padding: "9px 11px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary }}>{a.assessor}</span>
                    <span style={{ fontSize: 11, color: T.textMuted }}>{a.date}</span>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Badge {...reqStatusMeta(a.status)} label={a.status} />
                  </div>
                  <div style={{ fontSize: 11.5, color: T.textSecondary, marginTop: 6 }}>{a.comments}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={drawerFooterStyle}>
          <button onClick={onClose} style={secondaryBtnStyle}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function RelationBlock({ title, items, lookup, onOpen }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10.5, color: T.textMuted, marginBottom: 6, fontWeight: 600 }}>
        {title} ({items.length})
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: T.textMuted }}>None linked.</div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {items.map((id) => (
            <span
              key={id}
              onClick={onOpen}
              style={{
                fontSize: 11.5,
                background: T.cardBg,
                border: `1px solid ${T.panelBorder}`,
                borderRadius: 6,
                padding: "4px 8px",
                color: T.textSecondary,
                cursor: onOpen ? "pointer" : "default",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Link2 size={10} /> {nameOf(lookup, id)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  PAGE: ASSESSMENTS                                                      */
/* ---------------------------------------------------------------------- */
function AssessmentsPage({ data, setData }) {
  const { assessments, requirements } = data;
  const [creating, setCreating] = useState(false);
  const { sort, toggle, apply } = useSort("date");
  const [search, setSearch] = useState("");

  const rows = apply(
    assessments.filter((a) => {
      const q = search.trim().toLowerCase();
      const req = byId(requirements, a.requirementId);
      return !q || a.assessor.toLowerCase().includes(q) || (req && req.title.toLowerCase().includes(q));
    })
  );

  const addAssessment = (form) => {
    setData((d) => ({
      ...d,
      assessments: [{ ...form, id: `ASM-${Math.random().toString(36).slice(2, 5).toUpperCase()}` }, ...d.assessments],
      requirements: d.requirements.map((r) => (r.id === form.requirementId ? { ...r, status: form.status } : r)),
    }));
    setCreating(false);
  };

  const columns = [
    { key: "requirementId", label: "Requirement", render: (r) => nameOf(requirements, r.requirementId) },
    { key: "status", label: "Result", render: (r) => <Badge {...reqStatusMeta(r.status)} label={r.status} /> },
    { key: "assessor", label: "Assessor" },
    { key: "date", label: "Date" },
    { key: "controlEffectiveness", label: "Control Effectiveness" },
    { key: "reviewer", label: "Reviewer" },
    {
      key: "reviewStatus",
      label: "Review Status",
      render: (r) => (
        <Pill
          label={r.reviewStatus}
          color={r.reviewStatus === "Reviewed" ? T.green : T.amber}
          bg={r.reviewStatus === "Reviewed" ? T.greenSoft : T.amberSoft}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeading
        title="Compliance Assessments"
        subtitle="Assessment history preserved per requirement — nothing is overwritten, only appended."
        action={
          <button onClick={() => setCreating(true)} style={{ ...primaryBtnStyle, padding: "10px 16px" }}>
            <Plus size={14} style={{ marginRight: 6 }} /> New Assessment
          </button>
        }
      />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search by assessor or requirement…" resultCount={rows.length} totalCount={assessments.length} />
      <DataTable columns={columns} rows={rows} sort={sort} onSort={toggle} />

      {creating && <AssessmentFormDrawer requirements={requirements} onClose={() => setCreating(false)} onSave={addAssessment} />}
    </div>
  );
}

function AssessmentFormDrawer({ requirements, onClose, onSave }) {
  const [form, setForm] = useState({
    requirementId: requirements[0]?.id || "",
    status: "Not Assessed",
    assessor: "",
    date: "2026-08-22",
    comments: "",
    findings: "",
    evidenceIds: [],
    controlEffectiveness: "Not Assessed",
    reviewer: "",
    reviewStatus: "Pending Review",
  });
  const set = (f, v) => setForm((x) => ({ ...x, [f]: v }));
  const [error, setError] = useState("");

  const save = () => {
    if (!form.assessor.trim()) return setError("Assessor is required.");
    onSave(form);
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...drawerStyle, width: 500 }}>
        <div style={drawerHeaderStyle}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>New Assessment</div>
          <button onClick={onClose} style={iconBtnStyle}>
            <X size={15} color={T.textSecondary} />
          </button>
        </div>
        <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }}>
          <Field label="Requirement" required>
            <select value={form.requirementId} onChange={(e) => set("requirementId", e.target.value)} style={selectStyle()}>
              {requirements.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} — {r.title}
                </option>
              ))}
            </select>
          </Field>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="Assessment Status" required>
                <select value={form.status} onChange={(e) => set("status", e.target.value)} style={selectStyle()}>
                  {REQ_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Assessment Date">
                <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} style={inputStyle()} />
              </Field>
            </div>
          </div>
          <Field label="Assessor" required error={error}>
            <input value={form.assessor} onChange={(e) => set("assessor", e.target.value)} style={inputStyle()} />
          </Field>
          <Field label="Comments">
            <textarea value={form.comments} onChange={(e) => set("comments", e.target.value)} rows={2} style={inputStyle({ resize: "vertical", fontFamily: FONT_STACK })} />
          </Field>
          <Field label="Findings">
            <textarea value={form.findings} onChange={(e) => set("findings", e.target.value)} rows={2} style={inputStyle({ resize: "vertical", fontFamily: FONT_STACK })} />
          </Field>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="Control Effectiveness">
                <select value={form.controlEffectiveness} onChange={(e) => set("controlEffectiveness", e.target.value)} style={selectStyle()}>
                  {["Effective", "Partially Effective", "Not Effective", "Not Assessed"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Reviewer">
                <input value={form.reviewer} onChange={(e) => set("reviewer", e.target.value)} style={inputStyle()} />
              </Field>
            </div>
          </div>
          <Field label="Review Status">
            <select value={form.reviewStatus} onChange={(e) => set("reviewStatus", e.target.value)} style={selectStyle()}>
              {["Pending Review", "Reviewed"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
        <div style={drawerFooterStyle}>
          <button onClick={onClose} style={secondaryBtnStyle}>
            Cancel
          </button>
          <button onClick={save} style={primaryBtnStyle}>
            Save Assessment
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  PAGE: CROSS-MAPPING                                                    */
/* ---------------------------------------------------------------------- */
function CrossMappingPage({ data }) {
  const { requirements, frameworks, evidence } = data;
  const [search, setSearch] = useState("");
  const [frameworkFilter, setFrameworkFilter] = useState("All");

  const rows = requirements.filter((r) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || r.title.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    const matchesFramework = frameworkFilter === "All" || r.frameworkId === frameworkFilter;
    return matchesSearch && matchesFramework;
  });

  return (
    <div>
      <PageHeading
        title="Cross-Mapping"
        subtitle="Requirement → Control → Policy → Risk → Asset → Evidence → Compliance Status, in one traceable chain."
      />
      <Toolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search requirement…"
        resultCount={rows.length}
        totalCount={requirements.length}
        right={<FilterSelect label="" value={frameworkFilter} options={["All", ...frameworks.map((f) => f.id)]} onChange={setFrameworkFilter} />}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.length === 0 && <EmptyState label="No requirements match your search or filters." />}
        {rows.map((r) => (
          <MappingChain key={r.id} requirement={r} framework={byId(frameworks, r.frameworkId)} evidenceCount={evidence.filter((e) => e.requirementId === r.id).length} />
        ))}
      </div>
    </div>
  );
}

function MappingChain({ requirement, framework, evidenceCount }) {
  const meta = reqStatusMeta(requirement.status);
  const nodes = [
    { label: framework?.name, sub: requirement.title, Icon: Landmark, color: T.purple },
    { label: requirement.mappedControls.length ? requirement.mappedControls.map((id) => nameOf(EXISTING_CONTROLS, id)).join(", ") : "No control mapped", sub: "Internal Control", Icon: ShieldCheck, color: T.blue },
    { label: requirement.relatedPolicies.length ? requirement.relatedPolicies.map((id) => nameOf(EXISTING_POLICIES, id)).join(", ") : "No policy linked", sub: "Policy", Icon: FileText, color: T.accent },
    { label: requirement.relatedRisks.length ? requirement.relatedRisks.map((id) => nameOf(EXISTING_RISKS, id)).join(", ") : "No risk linked", sub: "Risk", Icon: AlertTriangle, color: T.red },
    { label: requirement.relatedAssets.length ? `${requirement.relatedAssets.length} asset(s)` : "No asset linked", sub: "Asset", Icon: Boxes, color: T.grey },
    { label: evidenceCount ? `${evidenceCount} item(s)` : "No evidence", sub: "Evidence", Icon: FolderCheck, color: T.amber },
  ];

  return (
    <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>{requirement.id}</div>
        <Badge {...meta} label={requirement.status} />
      </div>
      <div style={{ display: "flex", alignItems: "stretch", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
        {nodes.map((n, i) => (
          <React.Fragment key={i}>
            <div
              style={{
                minWidth: 150,
                maxWidth: 190,
                background: T.cardBg,
                border: `1px solid ${T.panelBorder}`,
                borderRadius: 8,
                padding: "10px 12px",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <n.Icon size={12} color={n.color} />
                <span style={{ fontSize: 9.5, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{n.sub}</span>
              </div>
              <div style={{ fontSize: 11.5, color: T.textPrimary, lineHeight: 1.4 }}>{n.label}</div>
            </div>
            {i < nodes.length - 1 && (
              <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <ArrowRight size={14} color={T.textMuted} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  PAGE: EVIDENCE                                                         */
/* ---------------------------------------------------------------------- */
function EvidencePage({ data, setData }) {
  const { evidence, requirements } = data;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [creating, setCreating] = useState(false);
  const { sort, toggle, apply } = useSort("uploadDate");

  const rows = apply(
    evidence.filter((e) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || e.name.toLowerCase().includes(q) || e.owner.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
  );

  const setStatus = (id, status) =>
    setData((d) => ({ ...d, evidence: d.evidence.map((e) => (e.id === id ? { ...e, status } : e)) }));

  const addEvidence = (form) => {
    setData((d) => ({ ...d, evidence: [{ ...form, id: `EVD-${Math.random().toString(36).slice(2, 5).toUpperCase()}` }, ...d.evidence] }));
    setCreating(false);
  };

  const columns = [
    { key: "name", label: "Evidence", render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { key: "requirementId", label: "Requirement", render: (r) => nameOf(requirements, r.requirementId) },
    { key: "controlId", label: "Control", render: (r) => nameOf(EXISTING_CONTROLS, r.controlId) },
    { key: "type", label: "Type" },
    { key: "owner", label: "Owner" },
    { key: "uploadDate", label: "Uploaded", render: (r) => r.uploadDate || "—" },
    {
      key: "expirationDate",
      label: "Expires",
      render: (r) => {
        const expired = r.expirationDate && new Date(r.expirationDate) < new Date("2026-08-22");
        return <span style={{ color: expired ? T.red : T.textSecondary }}>{r.expirationDate || "—"}</span>;
      },
    },
    { key: "status", label: "Status", render: (r) => <Pill label={r.status} {...evidenceStatusMeta(r.status)} /> },
  ];

  return (
    <div>
      <PageHeading
        title="Evidence"
        subtitle="Supporting artifacts for assessments — evidence supports a decision, it doesn't replace it."
        action={
          <button onClick={() => setCreating(true)} style={{ ...primaryBtnStyle, padding: "10px 16px" }}>
            <Upload size={14} style={{ marginRight: 6 }} /> Upload Evidence
          </button>
        }
      />
      <Toolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search evidence by name or owner…"
        resultCount={rows.length}
        totalCount={evidence.length}
        right={<FilterSelect label="" value={statusFilter} options={["All", ...EVIDENCE_STATUSES]} onChange={setStatusFilter} />}
      />
      <DataTable
        columns={columns}
        rows={rows}
        sort={sort}
        onSort={toggle}
        renderActions={(r) => (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setStatus(r.id, "Approved")} style={iconBtnStyle} title="Verify / Approve">
              <CheckCircle2 size={13} color={T.green} />
            </button>
            <button onClick={() => setStatus(r.id, "Rejected")} style={iconBtnStyle} title="Reject">
              <XCircle size={13} color={T.red} />
            </button>
            <button style={iconBtnStyle} title="Download">
              <Download size={13} color={T.textSecondary} />
            </button>
            <button onClick={() => setStatus(r.id, "Requested")} style={iconBtnStyle} title="Replace / Request update">
              <RefreshCw size={13} color={T.textSecondary} />
            </button>
          </div>
        )}
      />

      {creating && <EvidenceFormDrawer requirements={requirements} onClose={() => setCreating(false)} onSave={addEvidence} />}
    </div>
  );
}

function EvidenceFormDrawer({ requirements, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    requirementId: requirements[0]?.id || "",
    controlId: EXISTING_CONTROLS[0].id,
    type: "Document",
    owner: "",
    uploadDate: "2026-08-22",
    expirationDate: "",
    status: "Submitted",
    verificationStatus: "Pending",
    reviewer: "",
    comments: "",
  });
  const set = (f, v) => setForm((x) => ({ ...x, [f]: v }));
  const [error, setError] = useState("");

  const save = () => {
    if (!form.name.trim()) return setError("Evidence Name is required.");
    onSave(form);
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...drawerStyle, width: 480 }}>
        <div style={drawerHeaderStyle}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Upload Evidence</div>
          <button onClick={onClose} style={iconBtnStyle}>
            <X size={15} color={T.textSecondary} />
          </button>
        </div>
        <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }}>
          <Field label="Evidence Name" required error={error}>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} style={inputStyle()} placeholder="e.g. Q3 Access Review.xlsx" />
          </Field>
          <Field label="Requirement">
            <select value={form.requirementId} onChange={(e) => set("requirementId", e.target.value)} style={selectStyle()}>
              {requirements.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} — {r.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Control">
            <select value={form.controlId} onChange={(e) => set("controlId", e.target.value)} style={selectStyle()}>
              {EXISTING_CONTROLS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="Type">
                <select value={form.type} onChange={(e) => set("type", e.target.value)} style={selectStyle()}>
                  {EVIDENCE_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Owner">
                <input value={form.owner} onChange={(e) => set("owner", e.target.value)} style={inputStyle()} />
              </Field>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="Upload Date">
                <input type="date" value={form.uploadDate} onChange={(e) => set("uploadDate", e.target.value)} style={inputStyle()} />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Expiration Date">
                <input type="date" value={form.expirationDate} onChange={(e) => set("expirationDate", e.target.value)} style={inputStyle()} />
              </Field>
            </div>
          </div>
          <Field label="Status">
            <select value={form.status} onChange={(e) => set("status", e.target.value)} style={selectStyle()}>
              {EVIDENCE_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Comments">
            <textarea value={form.comments} onChange={(e) => set("comments", e.target.value)} rows={2} style={inputStyle({ resize: "vertical", fontFamily: FONT_STACK })} />
          </Field>
        </div>
        <div style={drawerFooterStyle}>
          <button onClick={onClose} style={secondaryBtnStyle}>
            Cancel
          </button>
          <button onClick={save} style={primaryBtnStyle}>
            Save Evidence
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  PAGE: COMPLIANCE GAPS                                                  */
/* ---------------------------------------------------------------------- */
function GapsPage({ data, setData, goTo }) {
  const { gaps, requirements, frameworks } = data;
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ framework: "All", severity: "All", owner: "All", status: "All" });
  const [creating, setCreating] = useState(false);
  const { sort, toggle, apply } = useSort("dueDate");

  const owners = Array.from(new Set(gaps.map((g) => g.owner))).sort();

  const rows = apply(
    gaps.filter((g) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || g.description.toLowerCase().includes(q) || g.id.toLowerCase().includes(q);
      const matchesFramework = filters.framework === "All" || g.frameworkId === filters.framework;
      const matchesSeverity = filters.severity === "All" || g.severity === filters.severity;
      const matchesOwner = filters.owner === "All" || g.owner === filters.owner;
      const matchesStatus = filters.status === "All" || g.status === filters.status;
      return matchesSearch && matchesFramework && matchesSeverity && matchesOwner && matchesStatus;
    })
  );

  const addGap = (form) => {
    // avoid duplicate open gaps for the same requirement
    const dup = data.gaps.find((g) => g.requirementId === form.requirementId && !["Resolved", "Closed"].includes(g.status));
    if (dup) {
      alert(`An open gap (${dup.id}) already exists for this requirement.`);
      return;
    }
    setData((d) => ({ ...d, gaps: [{ ...form, id: `GAP-${Math.random().toString(36).slice(2, 5).toUpperCase()}` }, ...d.gaps] }));
    setCreating(false);
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== "All").length;

  const columns = [
    { key: "id", label: "ID" },
    { key: "requirementId", label: "Requirement", render: (r) => nameOf(requirements, r.requirementId) },
    { key: "frameworkId", label: "Framework", render: (r) => nameOf(frameworks, r.frameworkId) },
    { key: "description", label: "Description" },
    { key: "severity", label: "Severity", render: (r) => <Pill label={r.severity} {...severityMeta(r.severity)} /> },
    { key: "owner", label: "Owner" },
    { key: "dueDate", label: "Due Date", render: (r) => (
      <span style={{ color: isOverdue(r.dueDate, r.status, ["Resolved", "Closed"]) ? T.red : T.textSecondary }}>{r.dueDate}</span>
    ) },
    { key: "status", label: "Status", render: (r) => <Pill label={r.status} {...gapStatusMeta(r.status)} /> },
  ];

  return (
    <div>
      <PageHeading
        title="Compliance Gaps"
        subtitle="Non-Compliant and Partially Compliant requirements surface here for remediation planning."
        action={
          <button onClick={() => setCreating(true)} style={{ ...primaryBtnStyle, padding: "10px 16px" }}>
            <Plus size={14} style={{ marginRight: 6 }} /> Log Gap
          </button>
        }
      />
      <Toolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search gaps…"
        onToggleFilters={() => setShowFilters((s) => !s)}
        activeFilterCount={activeFilterCount}
        resultCount={rows.length}
        totalCount={gaps.length}
      />
      {showFilters && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16, padding: 14, background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10 }}>
          <FilterSelect label="Framework" value={filters.framework} options={["All", ...frameworks.map((f) => f.id)]} onChange={(v) => setFilters((f) => ({ ...f, framework: v }))} />
          <FilterSelect label="Severity" value={filters.severity} options={["All", ...GAP_SEVERITIES]} onChange={(v) => setFilters((f) => ({ ...f, severity: v }))} />
          <FilterSelect label="Owner" value={filters.owner} options={["All", ...owners]} onChange={(v) => setFilters((f) => ({ ...f, owner: v }))} />
          <FilterSelect label="Status" value={filters.status} options={["All", ...GAP_STATUSES]} onChange={(v) => setFilters((f) => ({ ...f, status: v }))} />
        </div>
      )}
      <DataTable
        columns={columns}
        rows={rows}
        sort={sort}
        onSort={toggle}
        renderActions={(r) => (
          <button onClick={() => goTo("remediation")} style={iconBtnStyle} title="Create remediation task">
            <Wrench size={13} color={T.textSecondary} />
          </button>
        )}
      />

      {creating && <GapFormDrawer requirements={requirements} frameworks={frameworks} onClose={() => setCreating(false)} onSave={addGap} />}
    </div>
  );
}

function GapFormDrawer({ requirements, frameworks, onClose, onSave }) {
  const first = requirements[0];
  const [form, setForm] = useState({
    requirementId: first?.id || "",
    frameworkId: first?.frameworkId || frameworks[0]?.id || "",
    description: "",
    currentState: "",
    expectedState: "",
    severity: "Medium",
    owner: "",
    dueDate: "2026-09-30",
    status: "Open",
    relatedRiskId: EXISTING_RISKS[0]?.id || "",
    relatedControlId: EXISTING_CONTROLS[0]?.id || "",
    remediationPlan: "",
  });
  const set = (f, v) => setForm((x) => ({ ...x, [f]: v }));
  const [error, setError] = useState("");

  const onReqChange = (id) => {
    const req = byId(requirements, id);
    setForm((x) => ({ ...x, requirementId: id, frameworkId: req?.frameworkId || x.frameworkId }));
  };

  const save = () => {
    if (!form.description.trim()) return setError("Description is required.");
    if (!form.owner.trim()) return setError("Owner is required.");
    onSave(form);
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...drawerStyle, width: 500 }}>
        <div style={drawerHeaderStyle}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Log Compliance Gap</div>
          <button onClick={onClose} style={iconBtnStyle}>
            <X size={15} color={T.textSecondary} />
          </button>
        </div>
        <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }}>
          <Field label="Requirement" required>
            <select value={form.requirementId} onChange={(e) => onReqChange(e.target.value)} style={selectStyle()}>
              {requirements.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} — {r.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Description" required error={error}>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} style={inputStyle({ resize: "vertical", fontFamily: FONT_STACK })} />
          </Field>
          <Field label="Current State">
            <textarea value={form.currentState} onChange={(e) => set("currentState", e.target.value)} rows={2} style={inputStyle({ resize: "vertical", fontFamily: FONT_STACK })} />
          </Field>
          <Field label="Expected State">
            <textarea value={form.expectedState} onChange={(e) => set("expectedState", e.target.value)} rows={2} style={inputStyle({ resize: "vertical", fontFamily: FONT_STACK })} />
          </Field>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="Severity">
                <select value={form.severity} onChange={(e) => set("severity", e.target.value)} style={selectStyle()}>
                  {GAP_SEVERITIES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Owner" required>
                <input value={form.owner} onChange={(e) => set("owner", e.target.value)} style={inputStyle()} />
              </Field>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="Due Date">
                <input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} style={inputStyle()} />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Status">
                <select value={form.status} onChange={(e) => set("status", e.target.value)} style={selectStyle()}>
                  {GAP_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="Related Risk">
                <select value={form.relatedRiskId} onChange={(e) => set("relatedRiskId", e.target.value)} style={selectStyle()}>
                  {EXISTING_RISKS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Related Control">
                <select value={form.relatedControlId} onChange={(e) => set("relatedControlId", e.target.value)} style={selectStyle()}>
                  {EXISTING_CONTROLS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
          <Field label="Remediation Plan">
            <textarea value={form.remediationPlan} onChange={(e) => set("remediationPlan", e.target.value)} rows={2} style={inputStyle({ resize: "vertical", fontFamily: FONT_STACK })} />
          </Field>
        </div>
        <div style={drawerFooterStyle}>
          <button onClick={onClose} style={secondaryBtnStyle}>
            Cancel
          </button>
          <button onClick={save} style={primaryBtnStyle}>
            Log Gap
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  PAGE: REMEDIATION                                                      */
/* ---------------------------------------------------------------------- */
function RemediationPage({ data, setData }) {
  const { remediation, gaps, requirements } = data;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [creating, setCreating] = useState(false);
  const { sort, toggle, apply } = useSort("dueDate");

  const rows = apply(
    remediation.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || r.description.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
  );

  const updateProgress = (id, progress) =>
    setData((d) => ({
      ...d,
      remediation: d.remediation.map((r) =>
        r.id === id
          ? { ...r, progress, status: progress >= 100 ? "Completed" : progress > 0 && r.status === "Open" ? "In Progress" : r.status }
          : r
      ),
    }));

  const addTask = (form) => {
    setData((d) => ({ ...d, remediation: [{ ...form, id: `REM-${Math.random().toString(36).slice(2, 5).toUpperCase()}` }, ...d.remediation] }));
    setCreating(false);
  };

  const columns = [
    { key: "id", label: "Task ID" },
    { key: "gapId", label: "Gap" },
    { key: "requirementId", label: "Requirement", render: (r) => nameOf(requirements, r.requirementId) },
    { key: "description", label: "Description" },
    { key: "owner", label: "Owner" },
    { key: "priority", label: "Priority", render: (r) => <Pill label={r.priority} {...severityMeta(r.priority)} /> },
    {
      key: "dueDate",
      label: "Due Date",
      render: (r) => (
        <span style={{ color: isOverdue(r.dueDate, r.status, ["Completed", "Cancelled"]) ? T.red : T.textSecondary, display: "flex", alignItems: "center", gap: 5 }}>
          {r.dueDate}
          {isOverdue(r.dueDate, r.status, ["Completed", "Cancelled"]) && <AlertTriangle size={11} color={T.red} />}
        </span>
      ),
    },
    { key: "status", label: "Status", render: (r) => <Pill label={r.status} {...remediationStatusMeta(r.status)} /> },
    {
      key: "progress",
      label: "Progress",
      render: (r) => (
        <input
          type="range"
          min={0}
          max={100}
          value={r.progress}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => updateProgress(r.id, Number(e.target.value))}
          style={{ width: 90, marginRight: 6, accentColor: T.accent }}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeading
        title="Remediation"
        subtitle="Remediation tasks trace back to the gap that raised them."
        action={
          <button onClick={() => setCreating(true)} style={{ ...primaryBtnStyle, padding: "10px 16px" }}>
            <Plus size={14} style={{ marginRight: 6 }} /> New Task
          </button>
        }
      />
      <Toolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search remediation tasks…"
        resultCount={rows.length}
        totalCount={remediation.length}
        right={<FilterSelect label="" value={statusFilter} options={["All", ...REMEDIATION_STATUSES]} onChange={setStatusFilter} />}
      />
      <DataTable columns={columns} rows={rows} sort={sort} onSort={toggle} />

      {creating && <RemediationFormDrawer gaps={gaps} onClose={() => setCreating(false)} onSave={addTask} />}
    </div>
  );
}

function RemediationFormDrawer({ gaps, onClose, onSave }) {
  const openGaps = gaps.filter((g) => !["Resolved", "Closed"].includes(g.status));
  const first = openGaps[0] || gaps[0];
  const [form, setForm] = useState({
    gapId: first?.id || "",
    requirementId: first?.requirementId || "",
    description: first?.remediationPlan || "",
    owner: first?.owner || "",
    priority: "High",
    dueDate: first?.dueDate || "2026-09-30",
    status: "Open",
    progress: 0,
    relatedRiskId: first?.relatedRiskId || EXISTING_RISKS[0]?.id,
    relatedControlId: first?.relatedControlId || EXISTING_CONTROLS[0]?.id,
  });
  const set = (f, v) => setForm((x) => ({ ...x, [f]: v }));
  const [error, setError] = useState("");

  const onGapChange = (id) => {
    const gap = byId(gaps, id);
    setForm((x) => ({
      ...x,
      gapId: id,
      requirementId: gap?.requirementId || x.requirementId,
      description: gap?.remediationPlan || x.description,
      owner: gap?.owner || x.owner,
      relatedRiskId: gap?.relatedRiskId || x.relatedRiskId,
      relatedControlId: gap?.relatedControlId || x.relatedControlId,
    }));
  };

  const save = () => {
    if (!form.description.trim()) return setError("Description is required.");
    onSave(form);
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...drawerStyle, width: 480 }}>
        <div style={drawerHeaderStyle}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>New Remediation Task</div>
          <button onClick={onClose} style={iconBtnStyle}>
            <X size={15} color={T.textSecondary} />
          </button>
        </div>
        <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }}>
          <Field label="Originating Gap" required>
            <select value={form.gapId} onChange={(e) => onGapChange(e.target.value)} style={selectStyle()}>
              {gaps.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.id} — {g.description.slice(0, 40)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Description" required error={error}>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} style={inputStyle({ resize: "vertical", fontFamily: FONT_STACK })} />
          </Field>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="Owner">
                <input value={form.owner} onChange={(e) => set("owner", e.target.value)} style={inputStyle()} />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Priority">
                <select value={form.priority} onChange={(e) => set("priority", e.target.value)} style={selectStyle()}>
                  {REMEDIATION_PRIORITIES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="Due Date">
                <input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} style={inputStyle()} />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Status">
                <select value={form.status} onChange={(e) => set("status", e.target.value)} style={selectStyle()}>
                  {REMEDIATION_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </div>
        <div style={drawerFooterStyle}>
          <button onClick={onClose} style={secondaryBtnStyle}>
            Cancel
          </button>
          <button onClick={save} style={primaryBtnStyle}>
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  PAGE: REPORTS                                                          */
/* ---------------------------------------------------------------------- */
function ReportsPage({ data }) {
  const { requirements, frameworks, gaps, evidence, remediation } = data;
  const score = complianceScore(requirements);

  const reports = [
    { title: "Overall Compliance Report", desc: `Program-wide score: ${score}%. Covers all ${frameworks.length} frameworks and ${requirements.length} requirements.`, Icon: FileBarChart2 },
    { title: "Framework Compliance Report", desc: frameworks.map((f) => `${f.name}: ${complianceScore(requirements.filter((r) => r.frameworkId === f.id))}%`).join(" · "), Icon: Landmark },
    { title: "Requirements Status Report", desc: REQ_STATUSES.map((s) => `${s}: ${requirements.filter((r) => r.status === s).length}`).join(" · "), Icon: ClipboardList },
    { title: "Compliance Gap Report", desc: `${gaps.filter((g) => !["Resolved", "Closed"].includes(g.status)).length} open gaps across ${GAP_SEVERITIES.length} severity tiers.`, Icon: AlertOctagon },
    { title: "Evidence Status Report", desc: `${evidence.filter((e) => e.status === "Approved").length} approved of ${evidence.length} evidence items.`, Icon: FolderCheck },
    { title: "Remediation Report", desc: `${remediation.filter((r) => r.status === "Completed").length} completed of ${remediation.length} remediation tasks.`, Icon: Wrench },
    { title: "Audit Readiness Report", desc: "Cross-references open findings, gaps, and missing evidence ahead of the next audit cycle.", Icon: Gavel },
  ];

  return (
    <div>
      <PageHeading title="Reports" subtitle="Generate compliance reports for stakeholders, auditors, and regulators." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        {reports.map((r) => (
          <div key={r.title} style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: T.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <r.Icon size={14} color={T.accent} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>{r.title}</div>
            </div>
            <div style={{ fontSize: 11.5, color: T.textSecondary, lineHeight: 1.5, flex: 1 }}>{r.desc}</div>
            <button style={{ ...secondaryBtnStyle, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Download size={12} /> Export
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  PAGE: AUDIT & FINDINGS                                                 */
/* ---------------------------------------------------------------------- */
function AuditFindingsPage({ data }) {
  const { requirements, evidence } = data;
  const findings = data.findings;
  const [search, setSearch] = useState("");
  const { sort, toggle, apply } = useSort("dueDate");

  const rows = apply(
    findings.filter((f) => {
      const q = search.trim().toLowerCase();
      return !q || f.finding.toLowerCase().includes(q) || f.auditor.toLowerCase().includes(q);
    })
  );

  const columns = [
    { key: "id", label: "Finding ID" },
    { key: "auditId", label: "Audit", render: (r) => nameOf(EXISTING_AUDITS, r.auditId) },
    { key: "requirementId", label: "Requirement", render: (r) => nameOf(requirements, r.requirementId) },
    { key: "finding", label: "Finding" },
    { key: "severity", label: "Severity", render: (r) => <Pill label={r.severity} {...severityMeta(r.severity)} /> },
    { key: "evidenceId", label: "Evidence", render: (r) => (r.evidenceId ? nameOf(evidence, r.evidenceId) : "—") },
    { key: "auditor", label: "Auditor" },
    { key: "status", label: "Status", render: (r) => <Pill label={r.status} color={r.status === "Open" ? T.red : T.amber} bg={r.status === "Open" ? T.redSoft : T.amberSoft} /> },
    { key: "correctiveAction", label: "Corrective Action" },
    { key: "dueDate", label: "Due Date" },
  ];

  return (
    <div>
      <PageHeading
        title="Audit & Findings"
        subtitle="Findings from the existing Audit Management module, referenced against requirements and gaps — not duplicated here."
      />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search findings…" resultCount={rows.length} totalCount={findings.length} />
      <DataTable columns={columns} rows={rows} sort={sort} onSort={toggle} />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  SHELL: SIDEBAR + HEADER                                                */
/* ---------------------------------------------------------------------- */
const COMPLIANCE_SUBNAV = [
  { key: "dashboard", label: "Dashboard", Icon: LayoutGrid },
  { key: "frameworks", label: "Frameworks & Regulations", Icon: Landmark },
  { key: "requirements", label: "Requirements", Icon: ClipboardList },
  { key: "assessments", label: "Assessments", Icon: FolderCheck },
  { key: "crossmapping", label: "Cross-Mapping", Icon: MapIcon },
  { key: "evidence", label: "Evidence", Icon: FileText },
  { key: "gaps", label: "Compliance Gaps", Icon: AlertOctagon },
  { key: "remediation", label: "Remediation", Icon: Wrench },
  { key: "reports", label: "Reports", Icon: FileBarChart2 },
  { key: "audit", label: "Audit & Findings", Icon: Gavel },
];

const OTHER_NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutGrid },
  { label: "Context Organization", icon: Landmark, expandable: true },
  { label: "Governance", icon: Building2, expandable: true },
  { label: "Risk Management", icon: Shield, expandable: true },
  { label: "Control Management", icon: ShieldCheck, expandable: true },
];
const OTHER_NAV_ITEMS_BOTTOM = [
  { label: "Audit", icon: ClipboardList, expandable: true },
  { label: "Asset Management", icon: Boxes, expandable: true },
  { label: "Artificial Intelligence", icon: Sparkles, expandable: true },
  { label: "Reporting", icon: BarChart3, expandable: true },
  { label: "Settings", icon: Settings, expandable: true },
];

function Sidebar({ page, setPage }) {
  const [complianceOpen, setComplianceOpen] = useState(true);

  const navRowStyle = (active) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "9px 10px",
    borderRadius: 7,
    marginBottom: 2,
    cursor: "pointer",
    background: active ? T.accentSoft : "transparent",
    color: active ? T.accent : T.textSecondary,
    fontSize: 13,
    fontWeight: active ? 600 : 500,
  });

  return (
    <div style={{ width: 230, minWidth: 230, background: T.sidebarBg, borderRight: `1px solid ${T.panelBorder}`, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 16px", borderBottom: `1px solid ${T.panelBorder}` }}>
        <Menu size={16} color={T.textSecondary} style={{ marginRight: 2 }} />
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#3a3a40,#1b1b1f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: T.accent, fontWeight: 700 }}>
          W
        </div>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: T.textPrimary }}>WADJET</div>
          <div style={{ fontSize: 9.5, color: T.textMuted, letterSpacing: 0.3 }}>Eyes on Risk. Control in Action.</div>
        </div>
      </div>

      <div style={{ padding: "10px 8px", flex: 1, overflowY: "auto" }}>
        {OTHER_NAV_ITEMS.map((item) => (
          <div key={item.label} style={navRowStyle(false)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <item.icon size={16} />
              <span>{item.label}</span>
            </div>
            {item.expandable && <ChevronRight size={13} style={{ opacity: 0.6 }} />}
          </div>
        ))}

        <div style={navRowStyle(true)} onClick={() => setComplianceOpen((o) => !o)}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ClipboardList size={16} />
            <span>Compliance</span>
          </div>
          {complianceOpen ? <ChevronDown size={13} style={{ opacity: 0.8 }} /> : <ChevronRight size={13} style={{ opacity: 0.6 }} />}
        </div>
        {complianceOpen && (
          <div style={{ marginLeft: 10, paddingLeft: 12, borderLeft: `1px solid ${T.panelBorder}`, marginBottom: 4 }}>
            {COMPLIANCE_SUBNAV.map((item) => (
              <div
                key={item.key}
                onClick={() => setPage(item.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "7px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12.5,
                  color: page === item.key ? T.accent : T.textSecondary,
                  fontWeight: page === item.key ? 600 : 500,
                  background: page === item.key ? T.accentSoft : "transparent",
                }}
              >
                <item.Icon size={13} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {OTHER_NAV_ITEMS_BOTTOM.map((item) => (
          <div key={item.label} style={navRowStyle(false)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <item.icon size={16} />
              <span>{item.label}</span>
            </div>
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
        <Search size={14} color={T.textMuted} />
        <span style={{ fontSize: 12.5, color: T.textMuted }}>Search modules...</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <HelpCircle size={16} color={T.textSecondary} />
        <Settings size={16} color={T.textSecondary} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${T.panelBorder}`, borderRadius: 20, padding: "4px 10px 4px 4px" }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.accent, color: "#1a1a1a", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            s
          </div>
          <span style={{ fontSize: 12.5, color: T.textSecondary }}>admin</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  ROOT COMPONENT                                                         */
/* ---------------------------------------------------------------------- */
export default function ComplianceModule() {
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState({
    frameworks: SEED_FRAMEWORKS,
    requirements: SEED_REQUIREMENTS,
    assessments: SEED_ASSESSMENTS,
    evidence: SEED_EVIDENCE,
    gaps: SEED_GAPS,
    remediation: SEED_REMEDIATION,
    findings: SEED_FINDINGS,
  });

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <ComplianceDashboard data={data} goTo={setPage} />;
      case "frameworks":
        return <FrameworksPage data={data} setData={setData} goTo={setPage} />;
      case "requirements":
        return <RequirementsPage data={data} setData={setData} goTo={setPage} />;
      case "assessments":
        return <AssessmentsPage data={data} setData={setData} />;
      case "crossmapping":
        return <CrossMappingPage data={data} />;
      case "evidence":
        return <EvidencePage data={data} setData={setData} />;
      case "gaps":
        return <GapsPage data={data} setData={setData} goTo={setPage} />;
      case "remediation":
        return <RemediationPage data={data} setData={setData} />;
      case "reports":
        return <ReportsPage data={data} />;
      case "audit":
        return <AuditFindingsPage data={data} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg, fontFamily: FONT_STACK, color: T.textPrimary }}>
      <Sidebar page={page} setPage={setPage} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header />
        <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>{renderPage()}</div>
      </div>
    </div>
  );
}
