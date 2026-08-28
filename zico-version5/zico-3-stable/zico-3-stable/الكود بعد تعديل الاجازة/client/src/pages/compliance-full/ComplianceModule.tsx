import React, { useState, useMemo, useEffect } from "react";
import apiClient from "../../api/client";
import {
  LayoutGrid, Landmark, Shield, ShieldCheck, ClipboardList, Boxes,
  BarChart3, Settings, Search, HelpCircle, ChevronRight, ChevronDown, X,
  Plus, Filter as FilterIcon, ArrowUpDown, Pencil, Link2, CheckCircle2,
  Clock, CircleDashed, AlertTriangle, Building2, Menu, Trash2, Eye,
  FileText, Layers, Map as MapIcon, FolderCheck, AlertOctagon, Wrench,
  FileBarChart2, Gavel, Upload, Download, RefreshCw, ArrowRight,
  BadgeCheck, MinusCircle, XCircle, Archive,
} from "lucide-react";

const T = {
  bg: "#0b0b0d", sidebarBg: "#0e0e11", panelBg: "#141417", panelBorder: "#232327",
  cardBg: "#0f0f12", rowHover: "#101013", inputBg: "#0c0c0f", textPrimary: "#f2f2f0",
  textSecondary: "#8c8c94", textMuted: "#5c5c64", accent: "#d9ad4f",
  accentSoft: "rgba(217,173,79,0.14)", green: "#3fbf6a", greenSoft: "rgba(63,191,106,0.14)",
  amber: "#e0b23d", amberSoft: "rgba(224,178,61,0.14)", grey: "#7d7d86",
  greySoft: "rgba(125,125,134,0.14)", red: "#e2584f", redSoft: "rgba(226,88,79,0.14)",
  blue: "#7c8ff0", blueSoft: "rgba(124,143,240,0.14)", purple: "#b183e0",
  purpleSoft: "rgba(177,131,224,0.14)",
};
const FONT_STACK = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

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

const REQ_STATUSES = ["Not Assessed", "Compliant", "Partially Compliant", "Non-Compliant", "Not Applicable"];
const FRAMEWORK_TYPES = ["Standard", "Regulation", "Internal Policy Baseline"];
const FRAMEWORK_STATUSES = ["Active", "Archived", "Draft"];
const EVIDENCE_STATUSES = ["Missing", "Requested", "Submitted", "Under Review", "Approved", "Rejected", "Expired"];
const EVIDENCE_TYPES = ["Document", "Screenshot", "Log Export", "Policy", "Ticket / Record", "Attestation"];
const GAP_SEVERITIES = ["Critical", "High", "Medium", "Low"];
const GAP_STATUSES = ["Open", "In Progress", "Resolved", "Accepted", "Closed"];
const REMEDIATION_STATUSES = ["Open", "In Progress", "Blocked", "Completed", "Cancelled"];
const REMEDIATION_PRIORITIES = ["Critical", "High", "Medium", "Low"];

const SEED_FRAMEWORKS = [
  { id: "FRW-001", name: "ISO/IEC 27001:2022", type: "Standard", version: "2022", issuer: "ISO/IEC", effectiveDate: "2022-10-25", description: "Information security management system requirements.", status: "Active" },
  { id: "FRW-002", name: "CBE Cybersecurity Framework", type: "Regulation", version: "v3.1", issuer: "Central Bank of Egypt", effectiveDate: "2023-01-01", description: "Regulatory cybersecurity baseline for supervised financial institutions.", status: "Active" },
  { id: "FRW-003", name: "PCI DSS v4.0", type: "Standard", version: "4.0", issuer: "PCI Security Standards Council", effectiveDate: "2024-03-31", description: "Security standard for organizations handling branded payment cards.", status: "Active" },
];

const SEED_REQUIREMENTS = [
  { id: "REQ-101", title: "Authentication information management", description: "Manage authentication information through a formal process.", frameworkId: "FRW-001", domainId: "d-1", organizationId: "o-1", category: "Identity & Access", applicability: "Applicable", status: "Compliant", mappedControls: ["CTL-001"], relatedPolicies: ["POL-002"], relatedRisks: ["RSK-014"], relatedAssets: ["AST-001", "AST-003"] },
  { id: "REQ-102", title: "Network security controls", description: "Networks shall be managed and controlled.", frameworkId: "FRW-001", domainId: "d-1", organizationId: "o-1", category: "Network Security", applicability: "Applicable", status: "Compliant", mappedControls: ["CTL-002"], relatedPolicies: ["POL-005"], relatedRisks: ["RSK-022"], relatedAssets: ["AST-002"] },
  { id: "REQ-103", title: "Access control policy and least privilege", description: "Access to information shall be restricted.", frameworkId: "FRW-001", domainId: "d-1", organizationId: "o-1", category: "Identity & Access", applicability: "Applicable", status: "Partially Compliant", mappedControls: ["CTL-003"], relatedPolicies: ["POL-002"], relatedRisks: ["RSK-031"], relatedAssets: ["AST-003", "AST-004"] },
  { id: "REQ-104", title: "Management of technical vulnerabilities", description: "Information about technical vulnerabilities shall be obtained.", frameworkId: "FRW-001", domainId: "d-4", organizationId: "o-2", category: "Vulnerability Management", applicability: "Applicable", status: "Non-Compliant", mappedControls: ["CTL-004"], relatedPolicies: ["POL-009"], relatedRisks: ["RSK-045"], relatedAssets: ["AST-001", "AST-002", "AST-004", "AST-007"] },
  { id: "REQ-201", title: "Strong authentication for remote access", description: "Enforce multi-factor authentication for remote access.", frameworkId: "FRW-002", domainId: "d-1", organizationId: "o-2", category: "Identity & Access", applicability: "Applicable", status: "Compliant", mappedControls: ["CTL-001"], relatedPolicies: ["POL-002"], relatedRisks: ["RSK-014"], relatedAssets: ["AST-001"] },
  { id: "REQ-202", title: "Vulnerability management program", description: "Run a continuous vulnerability management program.", frameworkId: "FRW-002", domainId: "d-4", organizationId: "o-2", category: "Vulnerability Management", applicability: "Applicable", status: "Non-Compliant", mappedControls: ["CTL-004"], relatedPolicies: ["POL-009"], relatedRisks: ["RSK-045"], relatedAssets: ["AST-002", "AST-004"] },
  { id: "REQ-301", title: "Protect cardholder data with network segmentation", description: "Install and maintain network security controls.", frameworkId: "FRW-003", domainId: "d-3", organizationId: "o-3", category: "Network Security", applicability: "Applicable", status: "Partially Compliant", mappedControls: ["CTL-002"], relatedPolicies: ["POL-005"], relatedRisks: ["RSK-022"], relatedAssets: ["AST-002", "AST-006"] },
  { id: "REQ-302", title: "Restrict access to cardholder data", description: "Limit access to system components.", frameworkId: "FRW-003", domainId: "d-3", organizationId: "o-3", category: "Identity & Access", applicability: "Not Applicable", status: "Not Applicable", mappedControls: [], relatedPolicies: ["POL-002"], relatedRisks: [], relatedAssets: [] },
];

const COMPLIANCE_STORAGE_KEY = "wadjet_compliance_workspace_v1";

const loadComplianceState = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(COMPLIANCE_STORAGE_KEY) || "null");
    return saved && typeof saved === "object" ? { ...saved } : null;
  } catch {
    return null;
  }
};

const SEED_ASSESSMENTS = [
  { id: "ASM-001", requirementId: "REQ-103", status: "Partially Compliant", assessor: "Marwa Hassan", date: "2026-06-02", comments: "RBAC rollout in progress.", findings: "Legacy shared accounts remain.", evidenceIds: ["EVD-003"], controlEffectiveness: "Partially Effective", reviewer: "CISO", reviewStatus: "Reviewed" },
  { id: "ASM-002", requirementId: "REQ-104", status: "Non-Compliant", assessor: "Omar Farid", date: "2026-07-14", comments: "Scanning tool procured but not scheduled.", findings: "No completed scan cycle.", evidenceIds: [], controlEffectiveness: "Not Effective", reviewer: "Compliance Manager", reviewStatus: "Pending Review" },
  { id: "ASM-003", requirementId: "REQ-101", status: "Compliant", assessor: "Marwa Hassan", date: "2026-05-20", comments: "MFA enforced for all staff.", findings: "No exceptions found.", evidenceIds: ["EVD-001"], controlEffectiveness: "Effective", reviewer: "CISO", reviewStatus: "Reviewed" },
];

const SEED_EVIDENCE = [
  { id: "EVD-001", name: "MFA Enforcement Policy Export.pdf", requirementId: "REQ-101", controlId: "CTL-001", type: "Document", owner: "IAM Manager", uploadDate: "2026-05-18", expirationDate: "2027-05-18", status: "Approved", verificationStatus: "Verified", reviewer: "CISO", comments: "Confirms MFA enforced.", attachment: { name: "MFA_Policy_Export.pdf", size: 245760, type: "application/pdf", data: null } },
  { id: "EVD-002", name: "WAF Ruleset Configuration.png", requirementId: "REQ-102", controlId: "CTL-002", type: "Screenshot", owner: "Network Security Lead", uploadDate: "2026-04-30", expirationDate: "2027-04-30", status: "Approved", verificationStatus: "Verified", reviewer: "CISO", comments: "", attachment: { name: "WAF_Ruleset_Config.png", size: 102400, type: "image/png", data: null } },
  { id: "EVD-003", name: "RBAC Access Review Q2.xlsx", requirementId: "REQ-103", controlId: "CTL-003", type: "Log Export", owner: "IT Operations Manager", uploadDate: "2026-06-01", expirationDate: "2026-12-01", status: "Under Review", verificationStatus: "Pending", reviewer: "Compliance Manager", comments: "Awaiting confirmation.", attachment: null },
  { id: "EVD-004", name: "Vulnerability Scan Report.pdf", requirementId: "REQ-104", controlId: "CTL-004", type: "Document", owner: "Vulnerability Management Lead", uploadDate: "", expirationDate: "", status: "Missing", verificationStatus: "Pending", reviewer: "", comments: "No scan report on file.", attachment: null },
];

const SEED_GAPS = [
  { id: "GAP-001", requirementId: "REQ-103", frameworkId: "FRW-001", description: "Shared privileged accounts still active.", currentState: "Shared service accounts remain.", expectedState: "Individual accounts only.", severity: "High", owner: "IT Operations Manager", dueDate: "2026-09-30", status: "In Progress", relatedRiskId: "RSK-031", relatedControlId: "CTL-003", remediationPlan: "Migrate shared accounts." },
  { id: "GAP-002", requirementId: "REQ-104", frameworkId: "FRW-001", description: "No completed vulnerability scan cycle.", currentState: "Tool deployed but not scheduled.", expectedState: "Weekly automated scans.", severity: "Critical", owner: "Vulnerability Management Lead", dueDate: "2026-09-15", status: "Open", relatedRiskId: "RSK-045", relatedControlId: "CTL-004", remediationPlan: "Finalize scan schedules." },
  { id: "GAP-003", requirementId: "REQ-202", frameworkId: "FRW-002", description: "Program does not cover customer apps.", currentState: "Infrastructure scanning only.", expectedState: "Cover all customer apps.", severity: "High", owner: "Vulnerability Management Lead", dueDate: "2026-10-01", status: "Open", relatedRiskId: "RSK-045", relatedControlId: "CTL-004", remediationPlan: "Extend scan scope." },
];

const SEED_REMEDIATION = [
  { id: "REM-001", gapId: "GAP-001", requirementId: "REQ-103", description: "Migrate shared database accounts.", owner: "IT Operations Manager", priority: "High", dueDate: "2026-09-30", status: "In Progress", progress: 55, relatedRiskId: "RSK-031", relatedControlId: "CTL-003" },
  { id: "REM-002", gapId: "GAP-002", requirementId: "REQ-104", description: "Finalize weekly vulnerability scan schedule.", owner: "Vulnerability Management Lead", priority: "Critical", dueDate: "2026-09-15", status: "Open", progress: 10, relatedRiskId: "RSK-045", relatedControlId: "CTL-004" },
  { id: "REM-003", gapId: "GAP-003", requirementId: "REQ-202", description: "Onboard customer-facing applications.", owner: "Vulnerability Management Lead", priority: "High", dueDate: "2026-10-01", status: "Blocked", progress: 20, relatedRiskId: "RSK-045", relatedControlId: "CTL-004" },
];

const SEED_FINDINGS = [
  { id: "FND-001", auditId: "AUD-2026-01", requirementId: "REQ-104", finding: "Vulnerability scanning not consistently performed.", severity: "High", evidenceId: "EVD-004", auditor: "Internal Audit Team", status: "Open", correctiveAction: "Linked to REM-002", dueDate: "2026-09-15" },
  { id: "FND-002", auditId: "AUD-2025-04", requirementId: "REQ-103", finding: "Legacy shared accounts identified.", severity: "Medium", evidenceId: "EVD-003", auditor: "External ISO Auditor", status: "In Remediation", correctiveAction: "Linked to REM-001", dueDate: "2026-09-30" },
];

function complianceScore(requirements) {
  const scored = requirements.filter((r) => r.status !== "Not Applicable" && r.status !== "Not Assessed");
  if (scored.length === 0) return 0;
  const points = { Compliant: 100, "Partially Compliant": 50, "Non-Compliant": 0 };
  const total = scored.reduce((s, r) => s + (points[r.status] ?? 0), 0);
  return Math.round(total / scored.length);
}

const reqStatusMeta = (status) => {
  switch (status) {
    case "Compliant": return { color: T.green, bg: T.greenSoft, Icon: BadgeCheck };
    case "Partially Compliant": return { color: T.amber, bg: T.amberSoft, Icon: MinusCircle };
    case "Non-Compliant": return { color: T.red, bg: T.redSoft, Icon: XCircle };
    case "Not Applicable": return { color: T.grey, bg: T.greySoft, Icon: Archive };
    default: return { color: T.blue, bg: T.blueSoft, Icon: HelpCircle };
  }
};

const evidenceStatusMeta = (status) => {
  switch (status) {
    case "Approved": return { color: T.green, bg: T.greenSoft };
    case "Under Review": case "Submitted": case "Requested": return { color: T.amber, bg: T.amberSoft };
    case "Rejected": case "Expired": return { color: T.red, bg: T.redSoft };
    default: return { color: T.grey, bg: T.greySoft };
  }
};

const severityMeta = (sev) => {
  switch (sev) {
    case "Critical": return { color: T.red, bg: T.redSoft };
    case "High": return { color: "#e28a4f", bg: "rgba(226,138,79,0.14)" };
    case "Medium": return { color: T.amber, bg: T.amberSoft };
    default: return { color: T.grey, bg: T.greySoft };
  }
};

const gapStatusMeta = (status) => {
  switch (status) {
    case "Resolved": case "Closed": return { color: T.green, bg: T.greenSoft };
    case "In Progress": return { color: T.amber, bg: T.amberSoft };
    case "Accepted": return { color: T.blue, bg: T.blueSoft };
    default: return { color: T.red, bg: T.redSoft };
  }
};

const remediationStatusMeta = (status) => {
  switch (status) {
    case "Completed": return { color: T.green, bg: T.greenSoft };
    case "In Progress": return { color: T.amber, bg: T.amberSoft };
    case "Blocked": case "Cancelled": return { color: T.red, bg: T.redSoft };
    default: return { color: T.grey, bg: T.greySoft };
  }
};

const isOverdue = (dueDate, status, doneStatuses) =>
  dueDate && !doneStatuses.includes(status) && new Date(dueDate) < new Date();

const inputStyle = (extra = {}) => ({
  background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8,
  color: T.textPrimary, fontSize: 12.5, padding: "9px 11px", outline: "none",
  fontFamily: FONT_STACK, width: "100%", boxSizing: "border-box", ...extra,
});
const selectStyle = (extra = {}) => ({ ...inputStyle(extra), appearance: "auto" });
const iconBtnStyle = { border: `1px solid ${T.panelBorder}`, background: T.inputBg, borderRadius: 7, padding: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const primaryBtnStyle = { background: T.accent, color: "#1a1508", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center" };
const secondaryBtnStyle = { background: "transparent", color: T.textSecondary, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", justifyContent: "flex-end", zIndex: 100 };
const drawerStyle = { height: "100%", background: T.panelBg, borderLeft: `1px solid ${T.panelBorder}`, display: "flex", flexDirection: "column", boxShadow: "-12px 0 32px rgba(0,0,0,0.4)" };
const drawerHeaderStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${T.panelBorder}` };
const drawerFooterStyle = { display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: `1px solid ${T.panelBorder}` };

function Badge({ label, color, bg, Icon }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, background: bg, color, fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap" }}>{Icon && <Icon size={11} />}{label}</span>;
}
function Pill({ label, color, bg }) {
  return <span style={{ fontSize: 11, fontWeight: 600, color, background: bg, padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>{label}</span>;
}
function KpiCard({ label, value, Icon, iconColor, iconBg, sub }) {
  return (
    <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10.5, letterSpacing: 0.6, color: T.textMuted, fontWeight: 600, textTransform: "uppercase" }}>{label}</span>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={13} color={iconColor} /></div>
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
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: T.accent, margin: "20px 0 10px", paddingBottom: 8, borderBottom: `1px solid ${T.panelBorder}` }}>{children}</div>;
}
function Field({ label, required, children, error }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
      <label style={{ fontSize: 11.5, color: T.textSecondary, fontWeight: 600 }}>{label} {required && <span style={{ color: T.red }}>*</span>}</label>
      {children}
      {error && <span style={{ fontSize: 11, color: T.red }}>{error}</span>}
    </div>
  );
}
function DetailRow({ k, v }) {
  return <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, borderBottom: `1px solid ${T.panelBorder}`, paddingBottom: 8 }}><span style={{ color: T.textMuted }}>{k}</span><span style={{ color: T.textPrimary, textAlign: "right" }}>{v}</span></div>;
}
function DetailStat({ label, children }) {
  return <div style={{ marginBottom: 10 }}><div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>{label}</div>{children}</div>;
}
function EmptyState({ label }) {
  return <div style={{ padding: "40px 16px", textAlign: "center", color: T.textMuted, fontSize: 12.5 }}>{label}</div>;
}
function Toolbar({ search, onSearch, placeholder, right, resultCount, totalCount }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 12px", flex: "1 1 240px", maxWidth: 360 }}>
        <Search size={14} color={T.textMuted} />
        <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} style={{ background: "transparent", border: "none", outline: "none", color: T.textPrimary, fontSize: 12.5, width: "100%", fontFamily: FONT_STACK }} />
      </div>
      {right}
      <div style={{ fontSize: 11.5, color: T.textMuted, marginLeft: "auto" }}>{resultCount} of {totalCount}</div>
    </div>
  );
}
function FilterSelect({ label, value, options, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: T.textMuted, marginBottom: 5, fontWeight: 600 }}>{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle()}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function useSort(defaultKey) {
  const [sort, setSort] = useState({ key: defaultKey, dir: "asc" });
  const toggle = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  const apply = (rows) => rows.slice().sort((a, b) => {
    const dir = sort.dir === "asc" ? 1 : -1;
    const av = a[sort.key]; const bv = b[sort.key];
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
          <thead><tr style={{ background: "#111114" }}>
            {columns.map((col) => (
              <th key={col.key} onClick={() => !col.noSort && onSort(col.key)} style={{ textAlign: "left", padding: "11px 16px", fontSize: 10.5, letterSpacing: 0.5, textTransform: "uppercase", color: T.textMuted, fontWeight: 700, borderBottom: `1px solid ${T.panelBorder}`, cursor: col.noSort ? "default" : "pointer", whiteSpace: "nowrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{col.label}{!col.noSort && <ArrowUpDown size={10} style={{ opacity: sort.key === col.key ? 1 : 0.3 }} />}</span>
              </th>
            ))}
            {renderActions && <th style={{ padding: "11px 16px", borderBottom: `1px solid ${T.panelBorder}` }} />}
          </tr></thead>
          <tbody>
            {rows.length === 0 ? (<tr><td colSpan={columns.length + 1}><EmptyState label="No records match your search or filters." /></td></tr>) : (
              rows.map((row, idx) => (
                <tr key={row.id || row._id || idx} onClick={() => onRowClick && onRowClick(row)} style={{ borderBottom: `1px solid ${T.panelBorder}`, cursor: onRowClick ? "pointer" : "default" }} onMouseEnter={(e) => (e.currentTarget.style.background = T.rowHover)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  {columns.map((col) => <td key={col.key} style={{ padding: "12px 16px", fontSize: 12, verticalAlign: "middle" }}>{col.render ? col.render(row) : row[col.key]}</td>)}
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
      <div>
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
function PageHeading({ title, subtitle, action }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: T.textPrimary }}>{title}</h1><p style={{ fontSize: 12.5, color: T.textMuted, margin: "6px 0 0" }}>{subtitle}</p></div>
        {action}
      </div>
      <div style={{ height: 1, background: T.panelBorder, marginBottom: 22 }} />
    </>
  );
}

/* ----------------------------- PAGES ----------------------------- */

function ComplianceDashboard({ data, goTo }) {
  const { frameworks, requirements, assessments, gaps, evidence, remediation } = data;
  const score = complianceScore(requirements);
  const compliant = requirements.filter((r) => r.status === "Compliant").length;
  const partial = requirements.filter((r) => r.status === "Partially Compliant").length;
  const nonCompliant = requirements.filter((r) => r.status === "Non-Compliant").length;
  const openGaps = gaps.filter((g) => !["Resolved", "Closed"].includes(g.status)).length;
  const missingEvidence = evidence.filter((e) => ["Missing", "Requested", "Expired", "Rejected"].includes(e.status)).length;
  const overdueRemediation = remediation.filter((r) => isOverdue(r.dueDate, r.status, ["Completed", "Cancelled"])).length;
  const byFramework = frameworks.map((f) => ({ label: f.name, value: complianceScore(requirements.filter((r) => r.frameworkId === f.id)) }));
  const statusDonut = [
    { label: "Compliant", value: compliant, color: T.green },
    { label: "Partially Compliant", value: partial, color: T.amber },
    { label: "Non-Compliant", value: nonCompliant, color: T.red },
    { label: "Not Applicable", value: requirements.filter((r) => r.status === "Not Applicable").length, color: T.grey },
    { label: "Not Assessed", value: requirements.filter((r) => r.status === "Not Assessed").length, color: T.blue },
  ].filter((s) => s.value > 0);
  const gapsBySeverity = GAP_SEVERITIES.map((sev) => ({ label: sev, value: gaps.filter((g) => g.severity === sev).length }));
  const remediationProgress = remediation.map((r) => ({ label: r.id, value: r.progress }));
  const workflowStages = [
    { key: "frameworks", label: "Frameworks", count: frameworks.length, description: "Sources maintained" },
    { key: "requirements", label: "Requirements", count: requirements.length, description: "Requirements structured" },
    { key: "controls", label: "Controls", count: null, description: "Internal controls mapped", path: "/controls/management" },
    { key: "assessments", label: "Assessments", count: assessments.length, description: "Assessments recorded" },
    { key: "evidence", label: "Evidence", count: evidence.length, description: "Evidence tracked" },
    { key: "gaps", label: "Gaps", count: openGaps, description: "Open issues" },
    { key: "remediation", label: "Remediation", count: remediation.length, description: "Tasks tracked" },
    { key: "reports", label: "Reports", count: null, description: "Management output" },
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
      <PageHeading title="Compliance Dashboard" subtitle="Executive overview of framework coverage, requirement status, and remediation health." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", gap: 8, marginBottom: 22 }}>
        {workflowStages.map((stage, index) => (
          <button key={stage.key} onClick={() => stage.path ? window.location.assign(stage.path) : goTo(stage.key)} style={{ ...secondaryBtnStyle, textAlign: "left", padding: "11px 12px", borderColor: stage.key === "gaps" && stage.count > 0 ? T.red : T.panelBorder, background: stage.key === "gaps" && stage.count > 0 ? T.redSoft : T.panelBg }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, display: "grid", placeItems: "center", background: T.accentSoft, color: T.accent, fontSize: 10, fontWeight: 800 }}>{index + 1}</span>
              <span style={{ color: T.textPrimary, fontSize: 11, fontWeight: 700 }}>{stage.label}</span>
            </div>
            <div style={{ color: stage.key === "gaps" && stage.count > 0 ? T.red : T.textSecondary, fontSize: 16, fontWeight: 800 }}>{stage.count ?? "→"}</div>
            <div style={{ color: T.textMuted, fontSize: 10, marginTop: 2 }}>{stage.description}</div>
          </button>
        ))}
      </div>
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
        <ChartCard title="Compliance by Framework" onExpand={() => goTo("frameworks")}><HBarChart data={byFramework} max={100} colorFn={(d) => d.value >= 70 ? T.green : d.value >= 40 ? T.amber : T.red} /></ChartCard>
        <ChartCard title="Compliance Status Distribution" onExpand={() => goTo("requirements")}><DonutChart segments={statusDonut} centerValue={`${score}%`} centerLabel="SCORE" /></ChartCard>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
        <ChartCard title="Gaps by Severity" onExpand={() => goTo("gaps")}><HBarChart data={gapsBySeverity} colorFn={(d) => severityMeta(d.label).color} /></ChartCard>
        <ChartCard title="Remediation Progress" onExpand={() => goTo("remediation")}><HBarChart data={remediationProgress} max={100} colorFn={() => T.blue} /></ChartCard>
        <ChartCard title="Recent Activity">
          <div style={{ display: "flex", flexDirection: "column" }}>
            {recent.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < recent.length - 1 ? `1px solid ${T.panelBorder}` : "none" }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: T.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><r.icon size={13} color={T.accent} /></div>
                <div style={{ fontSize: 12.5, color: T.textPrimary, flex: 1 }}>{r.text}</div>
                <div style={{ fontSize: 11, color: T.textMuted, whiteSpace: "nowrap" }}>{r.when}</div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

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
    return { ...f, requirementCount: reqs.length, mappedControlCount: new Set(reqs.flatMap((r) => r.mappedControls)).size, compliancePct: complianceScore(reqs) };
  });
  const filtered = apply(enriched.filter((f) => {
    const q = search.trim().toLowerCase();
    return (!q || f.name.toLowerCase().includes(q) || f.issuer.toLowerCase().includes(q)) && (statusFilter === "All" || f.status === statusFilter);
  }));
  const save = (fw) => { setData((d) => ({ ...d, frameworks: d.frameworks.some((x) => x.id === fw.id) ? d.frameworks.map((x) => x.id === fw.id ? fw : x) : [...d.frameworks, fw] })); setEditing(null); setCreating(false); };
  const archive = (fw) => setData((d) => ({ ...d, frameworks: d.frameworks.map((x) => x.id === fw.id ? { ...x, status: "Archived" } : x) }));
  const columns = [
    { key: "id", label: "ID" }, { key: "name", label: "Framework", render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { key: "type", label: "Type" }, { key: "version", label: "Version" }, { key: "issuer", label: "Issuer" },
    { key: "status", label: "Status", render: (r) => <Pill label={r.status} color={r.status === "Active" ? T.green : T.grey} bg={r.status === "Active" ? T.greenSoft : T.greySoft} /> },
    { key: "requirementCount", label: "Requirements" }, { key: "mappedControlCount", label: "Mapped Controls" },
    { key: "compliancePct", label: "Compliance", render: (r) => <ProgressBar value={r.compliancePct} color={r.compliancePct >= 70 ? T.green : r.compliancePct >= 40 ? T.amber : T.red} /> },
  ];
  return (
    <div>
      <PageHeading title="Frameworks & Regulations" subtitle="Frameworks tracked for compliance, with live requirement and control coverage." action={<button onClick={() => setCreating(true)} style={{ ...primaryBtnStyle, padding: "10px 16px" }}><Plus size={14} style={{ marginRight: 6 }} /> Add Framework</button>} />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search frameworks or issuers…" resultCount={filtered.length} totalCount={frameworks.length} right={<FilterSelect label="" value={statusFilter} options={["All", ...FRAMEWORK_STATUSES]} onChange={setStatusFilter} />} />
      <DataTable columns={columns} rows={filtered} sort={sort} onSort={toggle} onRowClick={(r) => setDetail(r)} renderActions={(r) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setDetail(r)} style={iconBtnStyle} title="View"><Eye size={13} color={T.textSecondary} /></button>
          <button onClick={() => setEditing(r)} style={iconBtnStyle} title="Edit"><Pencil size={13} color={T.textSecondary} /></button>
          <button onClick={() => archive(r)} style={iconBtnStyle} title="Archive"><Archive size={13} color={T.textSecondary} /></button>
        </div>
      )} />
      {detail && (
        <div style={overlayStyle}><div style={{ ...drawerStyle, width: 520 }}>
          <div style={drawerHeaderStyle}><div><div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>{detail.id}</div><div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary }}>{detail.name}</div></div><button onClick={() => setDetail(null)} style={iconBtnStyle}><X size={15} color={T.textSecondary} /></button></div>
          <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }}>
            <SectionLabel>Framework Information</SectionLabel>
            <p style={{ fontSize: 12.5, color: T.textSecondary, lineHeight: 1.6, marginTop: 0 }}>{detail.description}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}><DetailRow k="Type" v={detail.type} /><DetailRow k="Version" v={detail.version} /><DetailRow k="Issuer" v={detail.issuer} /><DetailRow k="Effective Date" v={detail.effectiveDate} /><DetailRow k="Status" v={detail.status} /><DetailRow k="Compliance %" v={`${detail.compliancePct}%`} /></div>
            <SectionLabel>Requirements ({detail.requirementCount})</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {requirements.filter((r) => r.frameworkId === detail.id).map((r) => (
                <div key={r.id} onClick={() => goTo("requirements")} style={{ background: T.cardBg, border: `1px solid ${T.panelBorder}`, borderRadius: 7, padding: "9px 11px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div><div style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary }}>{r.title}</div><div style={{ fontSize: 10.5, color: T.textMuted }}>{r.id}</div></div>
                  <Badge {...reqStatusMeta(r.status)} label={r.status} />
                </div>
              ))}
            </div>
          </div>
          <div style={drawerFooterStyle}><button onClick={() => setDetail(null)} style={secondaryBtnStyle}>Close</button><button onClick={() => setEditing(detail)} style={primaryBtnStyle}><Pencil size={13} style={{ marginRight: 6 }} /> Edit Framework</button></div>
        </div></div>
      )}
      {(editing || creating) && <FrameworkFormDrawer initial={editing} onClose={() => { setEditing(null); setCreating(false); }} onSave={save} />}
    </div>
  );
}

function FrameworkFormDrawer({ initial, onClose, onSave }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(initial || { id: `FRW-${Math.random().toString(36).slice(2, 5).toUpperCase()}`, name: "", type: "Standard", version: "", issuer: "", effectiveDate: "", description: "", status: "Active" });
  const set = (f, v) => setForm((x) => ({ ...x, [f]: v }));
  const [error, setError] = useState("");
  const save = () => { if (!form.name.trim()) return setError("Framework Name is required."); onSave(form); };
  return (
    <div style={overlayStyle}><div style={{ ...drawerStyle, width: 480 }}>
      <div style={drawerHeaderStyle}><div style={{ fontSize: 15, fontWeight: 700 }}>{isEdit ? "Edit Framework" : "Add Framework"}</div><button onClick={onClose} style={iconBtnStyle}><X size={15} color={T.textSecondary} /></button></div>
      <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }}>
        <Field label="Framework Name" required error={error}><input value={form.name} onChange={(e) => set("name", e.target.value)} style={inputStyle()} /></Field>
        <div style={{ display: "flex", gap: 12 }}><div style={{ flex: 1 }}><Field label="Type"><select value={form.type} onChange={(e) => set("type", e.target.value)} style={selectStyle()}>{FRAMEWORK_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field></div><div style={{ flex: 1 }}><Field label="Version"><input value={form.version} onChange={(e) => set("version", e.target.value)} style={inputStyle()} /></Field></div></div>
        <Field label="Issuing Organization"><input value={form.issuer} onChange={(e) => set("issuer", e.target.value)} style={inputStyle()} /></Field>
        <Field label="Effective Date"><input type="date" value={form.effectiveDate} onChange={(e) => set("effectiveDate", e.target.value)} style={inputStyle()} /></Field>
        <Field label="Description"><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} style={inputStyle({ resize: "vertical", fontFamily: FONT_STACK })} /></Field>
        <Field label="Status"><select value={form.status} onChange={(e) => set("status", e.target.value)} style={selectStyle()}>{FRAMEWORK_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
      </div>
      <div style={drawerFooterStyle}><button onClick={onClose} style={secondaryBtnStyle}>Cancel</button><button onClick={save} style={primaryBtnStyle}>{isEdit ? "Save Changes" : "Add Framework"}</button></div>
    </div></div>
  );
}

const CONTEXT_DOMAIN_NAMES = {
  "d-1": "Information Security",
  "d-2": "Operational",
  "d-3": "Compliance",
  "d-4": "Cybersecurity",
  "d-5": "Third Party Risk",
  "d-6": "Financial",
};

const CONTEXT_ORGANIZATION_NAMES = {
  "o-1": "Wadjet Bank Plc",
  "o-2": "Wadjet Digital Ltd",
  "o-3": "Wadjet Capital",
};

function RequirementsPage({ data, setData, goTo }) {
  const { requirements, frameworks, assessments, evidence, gaps } = data;
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ framework: "All", status: "All", domain: "All" });
  const [detail, setDetail] = useState(null);
  const [relationshipDraft, setRelationshipDraft] = useState(null);
  const [relationshipSaved, setRelationshipSaved] = useState(false);
  const [creating, setCreating] = useState(false);
  const [relationshipOptions, setRelationshipOptions] = useState({ controls: EXISTING_CONTROLS, policies: EXISTING_POLICIES, risks: EXISTING_RISKS, organizations: Object.entries(CONTEXT_ORGANIZATION_NAMES).map(([id, name]) => ({ id, name })), domains: Object.entries(CONTEXT_DOMAIN_NAMES).map(([id, name]) => ({ id, name })) });
  const [page, setPage] = useState(1);
  const pageSize = 6;
  useEffect(() => {
    Promise.all([apiClient.get("/controls"), apiClient.get("/policies"), apiClient.get("/risks"), apiClient.get("/organizations"), apiClient.get("/domains")]).then(([controls, policies, risks, organizations, domains]) => {
      const normalize = (items, idKeys, nameKeys) => (items || []).map((item) => ({
        id: idKeys.map((key) => item[key]).find(Boolean) || item._id,
        name: nameKeys.map((key) => item[key]).find(Boolean) || item.name || item.title || item._id,
      })).filter((item) => item.id);
      const merge = (seed, live) => [...seed, ...live.filter((item) => !seed.some((known) => known.id === item.id))];
      const validNamed = (items, prefix) => items.filter((item) => item.name && !/^\d+$/.test(String(item.name)) && String(item.id).startsWith(prefix));
      const liveOrganizations = validNamed(normalize(organizations.data.items, ["_id"], ["name"]), "o-");
      const liveDomains = validNamed(normalize(domains.data.items, ["_id"], ["name"]), "d-");
      setRelationshipOptions({
        controls: merge(EXISTING_CONTROLS, normalize(controls.data.items, ["controlId", "_id"], ["name", "title"])),
        policies: merge(EXISTING_POLICIES, normalize(policies.data.items, ["policyId", "policyNumber", "_id"], ["title", "name"]).filter((item) => /^POL-/.test(String(item.id)))),
        risks: merge(EXISTING_RISKS, normalize(risks.data.items, ["riskId", "_id"], ["title", "name"]).filter((item) => /^R-/.test(String(item.id)))),
        organizations: liveOrganizations.length ? liveOrganizations : Object.entries(CONTEXT_ORGANIZATION_NAMES).map(([id, name]) => ({ id, name })),
        domains: liveDomains.length ? liveDomains : Object.entries(CONTEXT_DOMAIN_NAMES).map(([id, name]) => ({ id, name })),
      });
    }).catch(() => {});
  }, []);
  const domains = [...new Set(requirements.map((r) => r.category))];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requirements.filter((r) => {
      const matchSearch = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
      const matchFw = filters.framework === "All" || r.frameworkId === filters.framework;
      const matchStatus = filters.status === "All" || r.status === filters.status;
      const matchDomain = filters.domain === "All" || r.category === filters.domain;
      return matchSearch && matchFw && matchStatus && matchDomain;
    });
  }, [requirements, search, filters]);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const updateStatus = (id, status) => setData((d) => ({ ...d, requirements: d.requirements.map((r) => r.id === id ? { ...r, status } : r) }));
  const openDetail = (requirement) => {
    setDetail(requirement);
    setRelationshipSaved(false);
    setRelationshipDraft({
      organizationId: requirement.organizationId || "",
      domainId: requirement.domainId || "",
      mappedControls: requirement.mappedControls || [],
      relatedPolicies: requirement.relatedPolicies || [],
      relatedRisks: requirement.relatedRisks || [],
    });
  };
  const saveRelationships = () => {
    if (!relationshipDraft || !detail) return;
    const updated = { ...detail, ...relationshipDraft };
    setData((d) => ({ ...d, requirements: d.requirements.map((r) => r.id === detail.id ? updated : r) }));
    setDetail(updated);
    setRelationshipSaved(true);
  };
  const toggleRelationship = (field, value) => setRelationshipDraft((draft) => ({
    ...draft,
    [field]: draft[field].includes(value) ? draft[field].filter((id) => id !== value) : [...draft[field], value],
  }));
  const addRequirement = (form) => {
    const nextNumber = requirements.reduce((max, item) => Math.max(max, Number(String(item.id).match(/\d+/)?.[0] || 0)), 0) + 1;
    const requirement = { ...form, id: `REQ-${nextNumber}`, mappedControls: form.mappedControls || [], relatedPolicies: form.relatedPolicies || [], relatedRisks: form.relatedRisks || [], relatedAssets: [] };
    setData((d) => ({ ...d, requirements: [requirement, ...d.requirements] }));
    setCreating(false);
  };
  const getEvidenceStatus = (reqId) => {
    const ev = evidence.filter((e) => e.requirementId === reqId);
    if (ev.some((e) => e.status === "Approved")) return "Approved";
    if (ev.some((e) => ["Under Review", "Submitted", "Requested"].includes(e.status))) return "Pending";
    if (ev.some((e) => ["Rejected", "Expired"].includes(e.status))) return "Rejected";
    return "Missing";
  };
  const columns = [
    { key: "id", label: "ID" }, { key: "title", label: "Title", render: (r) => <span style={{ fontWeight: 600 }}>{r.title}</span> },
    { key: "organizationId", label: "Organization", render: (r) => CONTEXT_ORGANIZATION_NAMES[r.organizationId] || "—" },
    { key: "domainId", label: "Domain", render: (r) => CONTEXT_DOMAIN_NAMES[r.domainId] || r.category || "—" },
    { key: "frameworkId", label: "Framework", render: (r) => nameOf(frameworks, r.frameworkId) },
    { key: "applicability", label: "Applicability" },
    { key: "status", label: "Status", render: (r) => { const m = reqStatusMeta(r.status); return <Badge {...m} label={r.status} />; } },
    { key: "mappedControls", label: "Controls", render: (r) => `${r.mappedControls.length} mapped` },
    { key: "evidenceStatus", label: "Evidence", render: (r) => <Pill label={getEvidenceStatus(r.id)} color={getEvidenceStatus(r.id) === "Approved" ? T.green : getEvidenceStatus(r.id) === "Pending" ? T.amber : T.red} bg={getEvidenceStatus(r.id) === "Approved" ? T.greenSoft : getEvidenceStatus(r.id) === "Pending" ? T.amberSoft : T.redSoft} /> },
  ];
  return (
    <div>
      <PageHeading title="Requirements" subtitle="All compliance requirements across frameworks." action={<button onClick={() => setCreating(true)} style={{ ...primaryBtnStyle, padding: "10px 16px" }}><Plus size={14} style={{ marginRight: 6 }} /> Add Requirement</button>} />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search requirements…" resultCount={filtered.length} totalCount={requirements.length} right={
        <div style={{ display: "flex", gap: 8 }}>
          <FilterSelect label="" value={filters.status} options={["All", ...REQ_STATUSES]} onChange={(v) => setFilters((f) => ({ ...f, status: v }))} />
          <FilterSelect label="" value={filters.framework} options={["All", ...frameworks.map((f) => f.id)]} onChange={(v) => setFilters((f) => ({ ...f, framework: v }))} />
          <FilterSelect label="" value={filters.domain} options={["All", ...domains]} onChange={(v) => setFilters((f) => ({ ...f, domain: v }))} />
        </div>
      } />
      <DataTable columns={columns} rows={paged} sort={{ key: "id", dir: "asc" }} onSort={() => {}} onRowClick={openDetail} />
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 16 }}>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ ...secondaryBtnStyle, opacity: page === 1 ? 0.5 : 1 }}>Previous</button>
        <span style={{ fontSize: 12, color: T.textMuted }}>Page {page} of {totalPages}</span>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ ...secondaryBtnStyle, opacity: page === totalPages ? 0.5 : 1 }}>Next</button>
      </div>
      {detail && (
        <div style={overlayStyle}><div style={{ ...drawerStyle, width: 540 }}>
          <div style={drawerHeaderStyle}><div><div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>{detail.id} • {nameOf(frameworks, detail.frameworkId)}</div><div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary }}>{detail.title}</div></div><button onClick={() => setDetail(null)} style={iconBtnStyle}><X size={15} color={T.textSecondary} /></button></div>
          <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }}>
            <SectionLabel>Requirement Information</SectionLabel>
            <p style={{ fontSize: 12.5, color: T.textSecondary, lineHeight: 1.6 }}>{detail.description}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <Field label="Organization"><select value={relationshipDraft?.organizationId || ""} onChange={(e) => setRelationshipDraft((d) => ({ ...d, organizationId: e.target.value }))} style={selectStyle()}>{relationshipOptions.organizations.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></Field>
              <Field label="Domain"><select value={relationshipDraft?.domainId || ""} onChange={(e) => setRelationshipDraft((d) => ({ ...d, domainId: e.target.value }))} style={selectStyle()}>{relationshipOptions.domains.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></Field>
            </div>
            <DetailRow k="Domain" v={CONTEXT_DOMAIN_NAMES[detail.domainId] || detail.category} /><DetailRow k="Organization" v={CONTEXT_ORGANIZATION_NAMES[detail.organizationId]} />
            <DetailRow k="Category" v={detail.category} /><DetailRow k="Applicability" v={detail.applicability} />
            <DetailRow k="Status" v={detail.status} />
            <div style={{ marginTop: 8 }}><Field label="Update Status"><select value={detail.status} onChange={(e) => { updateStatus(detail.id, e.target.value); setDetail((d) => ({ ...d, status: e.target.value })); }} style={selectStyle()}>{REQ_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field></div>
            <SectionLabel>Relationships</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              {[{ field: "mappedControls", label: "Controls", options: relationshipOptions.controls }, { field: "relatedPolicies", label: "Policies", options: relationshipOptions.policies }, { field: "relatedRisks", label: "Risks", options: relationshipOptions.risks }].map((group) => (
                <Field key={group.field} label={`${group.label} (multi-select)`}>
                  <div style={{ ...selectStyle(), minHeight: 88, maxHeight: 130, overflowY: "auto", display: "grid", gap: 4, padding: 8 }}>
                    {group.options.map((option) => <label key={option.id} style={{ display: "flex", alignItems: "center", gap: 7, color: T.textSecondary, fontSize: 11, cursor: "pointer" }}><input type="checkbox" checked={(relationshipDraft?.[group.field] || []).includes(option.id)} onChange={() => toggleRelationship(group.field, option.id)} />{option.id} — {option.name}</label>)}
                  </div>
                </Field>
              ))}
              <div style={{ display: "flex", alignItems: "end" }}><button onClick={saveRelationships} style={{ ...primaryBtnStyle, width: "100%" }}><Link2 size={13} style={{ marginRight: 5 }} /> Save Relationships</button></div>
            </div>
            {relationshipSaved && <p style={{ color: T.green, fontSize: 11, marginBottom: 10 }}>Relationships saved and included in traceability.</p>}
            <DetailStat label="Mapped Controls"><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{detail.mappedControls.map((c) => <Pill key={c} label={nameOf(EXISTING_CONTROLS, c)} color={T.blue} bg={T.blueSoft} />)}</div></DetailStat>
            <DetailStat label="Related Policies"><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{detail.relatedPolicies.map((p) => <Pill key={p} label={nameOf(EXISTING_POLICIES, p)} color={T.accent} bg={T.accentSoft} />)}</div></DetailStat>
            <DetailStat label="Related Risks"><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{detail.relatedRisks.map((r) => <Pill key={r} label={nameOf(EXISTING_RISKS, r)} color={T.red} bg={T.redSoft} />)}</div></DetailStat>
            <DetailStat label="Related Assets"><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{detail.relatedAssets.map((a) => <Pill key={a} label={nameOf(EXISTING_ASSETS, a)} color={T.grey} bg={T.greySoft} />)}</div></DetailStat>
            <SectionLabel>Evidence</SectionLabel>
            {evidence.filter((e) => e.requirementId === detail.id).length === 0 ? <EmptyState label="No evidence submitted yet." /> : evidence.filter((e) => e.requirementId === detail.id).map((e) => <DetailRow key={e.id} k={e.name} v={e.status} />)}
            <SectionLabel>Compliance Gaps</SectionLabel>
            {gaps.filter((g) => g.requirementId === detail.id && !["Resolved", "Closed"].includes(g.status)).length === 0 ? <EmptyState label="No open gaps." /> : gaps.filter((g) => g.requirementId === detail.id && !["Resolved", "Closed"].includes(g.status)).map((g) => <DetailRow key={g.id} k={g.code} v={g.description} />)}
            <SectionLabel>Assessment History</SectionLabel>
            {assessments.filter((a) => a.requirementId === detail.id).length === 0 ? <EmptyState label="No assessments recorded." /> : assessments.filter((a) => a.requirementId === detail.id).map((a) => (
              <div key={a.id} style={{ background: T.cardBg, border: `1px solid ${T.panelBorder}`, borderRadius: 7, padding: "9px 11px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12, fontWeight: 600 }}>{a.assessor}</span><Badge {...reqStatusMeta(a.status)} label={a.status} /></div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{a.date} • {a.comments}</div>
              </div>
            ))}
          </div>
          <div style={drawerFooterStyle}><button onClick={() => setDetail(null)} style={secondaryBtnStyle}>Close</button></div>
        </div></div>
      )}
      {creating && <RequirementFormDrawer frameworks={frameworks} options={relationshipOptions} onClose={() => setCreating(false)} onSave={addRequirement} />}
    </div>
  );
}

function RequirementFormDrawer({ frameworks, options, onClose, onSave }) {
  const [form, setForm] = useState({ title: "", description: "", frameworkId: frameworks[0]?.id || "", organizationId: options.organizations[0]?.id || "", domainId: options.domains[0]?.id || "", category: "", applicability: "Applicable", status: "Not Assessed", mappedControls: [], relatedPolicies: [], relatedRisks: [] });
  const [error, setError] = useState("");
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggle = (field, id) => setForm((current) => ({ ...current, [field]: current[field].includes(id) ? current[field].filter((value) => value !== id) : [...current[field], id] }));
  const save = () => {
    if (!form.title.trim()) return setError("Requirement title is required.");
    if (!form.description.trim()) return setError("Requirement description is required.");
    onSave({ ...form, title: form.title.trim(), description: form.description.trim(), category: form.category.trim() || "General" });
  };
  return (
    <div style={overlayStyle}><div style={{ ...drawerStyle, width: 560 }}>
      <div style={drawerHeaderStyle}><div style={{ fontSize: 15, fontWeight: 700 }}>Add Requirement</div><button onClick={onClose} style={iconBtnStyle}><X size={15} color={T.textSecondary} /></button></div>
      <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }}>
        <Field label="Title" required error={error}><input value={form.title} onChange={(e) => set("title", e.target.value)} style={inputStyle()} /></Field>
        <Field label="Requirement text" required><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} style={inputStyle({ resize: "vertical" })} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Framework"><select value={form.frameworkId} onChange={(e) => set("frameworkId", e.target.value)} style={selectStyle()}>{frameworks.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></Field>
          <Field label="Organization"><select value={form.organizationId} onChange={(e) => set("organizationId", e.target.value)} style={selectStyle()}>{options.organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></Field>
          <Field label="Domain"><select value={form.domainId} onChange={(e) => set("domainId", e.target.value)} style={selectStyle()}>{options.domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
          <Field label="Category"><input value={form.category} onChange={(e) => set("category", e.target.value)} style={inputStyle()} placeholder="e.g. Access Control" /></Field>
          <Field label="Applicability"><select value={form.applicability} onChange={(e) => set("applicability", e.target.value)} style={selectStyle()}>{["Applicable", "Not Applicable"].map((value) => <option key={value}>{value}</option>)}</select></Field>
          <Field label="Initial status"><select value={form.status} onChange={(e) => set("status", e.target.value)} style={selectStyle()}>{REQ_STATUSES.map((value) => <option key={value}>{value}</option>)}</select></Field>
        </div>
        {[{ field: "mappedControls", label: "Controls", values: options.controls }, { field: "relatedPolicies", label: "Policies", values: options.policies }, { field: "relatedRisks", label: "Risks", values: options.risks }].map((group) => (
          <Field key={group.field} label={`Related ${group.label}`}>
            <div style={{ display: "grid", gap: 5, maxHeight: 120, overflowY: "auto", padding: 9, border: `1px solid ${T.panelBorder}`, borderRadius: 8, background: T.inputBg }}>
              {group.values.map((value) => <label key={value.id} style={{ display: "flex", gap: 7, alignItems: "center", fontSize: 11, color: T.textSecondary }}><input type="checkbox" checked={form[group.field].includes(value.id)} onChange={() => toggle(group.field, value.id)} />{value.id} — {value.name}</label>)}
            </div>
          </Field>
        ))}
      </div>
      <div style={drawerFooterStyle}><button onClick={onClose} style={secondaryBtnStyle}>Cancel</button><button onClick={save} style={primaryBtnStyle}>Create Requirement</button></div>
    </div></div>
  );
}

function AssessmentsPage({ data, setData }) {
  const { assessments, requirements } = data;
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const { sort, toggle, apply } = useSort("date");
  const rows = apply(assessments.filter((a) => { const q = search.trim().toLowerCase(); return !q || a.assessor.toLowerCase().includes(q) || a.requirementId.toLowerCase().includes(q); }));
  const addAssessment = (form) => {
    const newAsm = { ...form, id: `ASM-${Math.random().toString(36).slice(2, 5).toUpperCase()}` };
    setData((d) => {
      const requirement = d.requirements.find((r) => r.id === form.requirementId);
      const needsGap = ["Partially Compliant", "Non-Compliant"].includes(form.status);
      const hasOpenGap = d.gaps.some((g) => g.requirementId === form.requirementId && !["Resolved", "Closed"].includes(g.status));
      const nextGap = needsGap && !hasOpenGap && requirement ? {
        id: `GAP-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
        requirementId: requirement.id,
        frameworkId: requirement.frameworkId,
        description: `${form.status} assessment result requires remediation for ${requirement.title}.`,
        currentState: form.findings || "Requirement is not fully implemented.",
        expectedState: requirement.description,
        severity: form.status === "Non-Compliant" ? "High" : "Medium",
        owner: form.reviewer || form.assessor,
        dueDate: "",
        status: "Open",
        relatedRiskId: requirement.relatedRisks?.[0] || "",
        relatedControlId: requirement.mappedControls?.[0] || "",
        remediationPlan: "Define and track corrective actions to restore compliance.",
      } : null;
      return {
        ...d,
        assessments: [newAsm, ...d.assessments],
        requirements: d.requirements.map((r) => r.id === form.requirementId ? { ...r, status: form.status } : r),
        gaps: nextGap ? [nextGap, ...d.gaps] : d.gaps,
      };
    });
    setCreating(false);
  };
  const columns = [
    { key: "id", label: "ID" }, { key: "requirementId", label: "Requirement", render: (r) => nameOf(requirements, r.requirementId) },
    { key: "status", label: "Result", render: (r) => { const m = reqStatusMeta(r.status); return <Badge {...m} label={r.status} />; } },
    { key: "assessor", label: "Assessor" }, { key: "date", label: "Date" },
    { key: "controlEffectiveness", label: "Control Eff." }, { key: "reviewStatus", label: "Review", render: (r) => <Pill label={r.reviewStatus} color={r.reviewStatus === "Reviewed" ? T.green : T.amber} bg={r.reviewStatus === "Reviewed" ? T.greenSoft : T.amberSoft} /> },
  ];
  return (
    <div>
      <PageHeading title="Assessments" subtitle="Append-only assessment history — never modified or deleted." action={<button onClick={() => setCreating(true)} style={{ ...primaryBtnStyle, padding: "10px 16px" }}><Plus size={14} style={{ marginRight: 6 }} /> New Assessment</button>} />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search by assessor…" resultCount={rows.length} totalCount={assessments.length} />
      <DataTable columns={columns} rows={rows} sort={sort} onSort={toggle} />
      {creating && <AssessmentFormDrawer requirements={requirements} onClose={() => setCreating(false)} onSave={addAssessment} />}
    </div>
  );
}

function AssessmentFormDrawer({ requirements, onClose, onSave }) {
  const [form, setForm] = useState({ requirementId: requirements[0]?.id || "", status: "Not Assessed", assessor: "", date: "2026-08-22", comments: "", findings: "", controlEffectiveness: "Not Assessed", reviewer: "", reviewStatus: "Pending Review" });
  const set = (f, v) => setForm((x) => ({ ...x, [f]: v }));
  const [error, setError] = useState("");
  const save = () => { if (!form.assessor.trim()) return setError("Assessor is required."); onSave(form); };
  return (
    <div style={overlayStyle}><div style={{ ...drawerStyle, width: 480 }}>
      <div style={drawerHeaderStyle}><div style={{ fontSize: 15, fontWeight: 700 }}>New Assessment</div><button onClick={onClose} style={iconBtnStyle}><X size={15} color={T.textSecondary} /></button></div>
      <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }}>
        <Field label="Requirement" required><select value={form.requirementId} onChange={(e) => set("requirementId", e.target.value)} style={selectStyle()}>{requirements.map((r) => <option key={r.id} value={r.id}>{r.id} — {r.title}</option>)}</select></Field>
        <Field label="Assessment Status" required><select value={form.status} onChange={(e) => set("status", e.target.value)} style={selectStyle()}>{REQ_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Assessor" required error={error}><input value={form.assessor} onChange={(e) => set("assessor", e.target.value)} style={inputStyle()} /></Field>
        <Field label="Assessment Date"><input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} style={inputStyle()} /></Field>
        <Field label="Comments"><textarea value={form.comments} onChange={(e) => set("comments", e.target.value)} rows={3} style={inputStyle({ resize: "vertical" })} /></Field>
        <Field label="Findings"><textarea value={form.findings} onChange={(e) => set("findings", e.target.value)} rows={3} style={inputStyle({ resize: "vertical" })} /></Field>
        <Field label="Control Effectiveness"><select value={form.controlEffectiveness} onChange={(e) => set("controlEffectiveness", e.target.value)} style={selectStyle()}>{["Effective", "Partially Effective", "Not Effective", "Not Assessed"].map((s) => <option key={s}>{s}</option>)}</select></Field>
        <div style={{ display: "flex", gap: 12 }}><div style={{ flex: 1 }}><Field label="Reviewer"><input value={form.reviewer} onChange={(e) => set("reviewer", e.target.value)} style={inputStyle()} /></Field></div><div style={{ flex: 1 }}><Field label="Review Status"><select value={form.reviewStatus} onChange={(e) => set("reviewStatus", e.target.value)} style={selectStyle()}>{["Pending Review", "Reviewed"].map((s) => <option key={s}>{s}</option>)}</select></Field></div></div>
      </div>
      <div style={drawerFooterStyle}><button onClick={onClose} style={secondaryBtnStyle}>Cancel</button><button onClick={save} style={primaryBtnStyle}>Save Assessment</button></div>
    </div></div>
  );
}

function CrossMappingPage({ data }) {
  const { requirements, frameworks, evidence } = data;
  const [search, setSearch] = useState("");
  const [frameworkFilter, setFrameworkFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("legacy");
  const [catalog, setCatalog] = useState([]);
  const [showCatalog, setShowCatalog] = useState(true);
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const emptyMapping = { mapId: "", isoControl: "", isoObjective: "", cbeDomain: "", cbeControlId: "", supportingCbeControls: "", pciRequirement: "", mappingStrength: "Partial", coverage: "0%", gap: "", controlOwner: "", auditFrequency: "", typicalAuditEvidence: "", rationale: "" };
  const [newMapping, setNewMapping] = useState(emptyMapping);
  const [platformLists, setPlatformLists] = useState({ controls: [], policies: [], risks: [] });
  useEffect(() => {
    apiClient.get("/compliance/cross-mappings").then((response) => setCatalog(response.data.items || [])).catch(() => setCatalogError("Could not load the live mapping catalog"));
    Promise.all(["/controls", "/policies", "/risks"].map((endpoint) => apiClient.get(endpoint)))
      .then(([controls, policies, risks]) => setPlatformLists({
        controls: controls.data.items || controls.data || [],
        policies: policies.data.items || policies.data || [],
        risks: risks.data.items || risks.data || [],
      }))
      .catch(() => setCatalogError("Could not load platform reference lists"));
  }, []);
  const filtered = requirements.filter((r) => {
    const q = search.trim().toLowerCase();
    return (!q || r.title.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)) && (frameworkFilter === "All" || r.frameworkId === frameworkFilter);
  });
  const filteredCatalog = catalog.filter((row) => !catalogSearch.trim() || Object.values(row).join(" ").toLowerCase().includes(catalogSearch.trim().toLowerCase()));
  const addMapping = async () => {
    setCatalogError("");
    try {
      const response = await apiClient.post("/compliance/cross-mappings", newMapping);
      setCatalog((items) => [...items, response.data]);
      setNewMapping(emptyMapping);
      setShowAddMapping(false);
    } catch (error) {
      setCatalogError(error.response?.data?.message || "Could not add mapping");
    }
  };
  return (
    <div>
      <PageHeading title="Cross-Mapping" subtitle="Requirement → Control → Policy → Risk → Asset → Evidence → Compliance Status, in one traceable chain." />
      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: `1px solid ${T.panelBorder}`, paddingBottom: 10 }}>
        <button onClick={() => setActiveTab("legacy")} style={activeTab === "legacy" ? primaryBtnStyle : secondaryBtnStyle}>Existing Cross-Mapping</button>
        <button onClick={() => setActiveTab("catalog")} style={activeTab === "catalog" ? primaryBtnStyle : secondaryBtnStyle}>Excel Mapping Catalog</button>
      </div>
      {activeTab === "legacy" && <div>
        <Toolbar search={search} onSearch={setSearch} placeholder="Search requirement…" resultCount={filtered.length} totalCount={requirements.length} right={<FilterSelect label="" value={frameworkFilter} options={["All", ...frameworks.map((f) => f.id)]} onChange={setFrameworkFilter} />} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.length === 0 && <EmptyState label="No requirements match your search or filters." />}
          {filtered.map((r) => (
            <MappingChain key={r.id} requirement={r} framework={frameworks.find((f) => f.id === r.frameworkId)} evidenceItems={evidence.filter((e) => e.requirementId === r.id)} />
          ))}
        </div>
      </div>}
      {activeTab === "catalog" && <section style={{ marginTop: 8, background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <div><h2 style={{ fontSize: 15, margin: 0 }}>Framework Mapping Catalog</h2><p style={{ color: T.textMuted, fontSize: 11, margin: "4px 0 0" }}>Live catalog from the Excel baseline plus mappings added in the platform.</p></div>
          <div style={{ display: "flex", gap: 8 }}><button onClick={() => setShowCatalog((open) => !open)} style={secondaryBtnStyle}>{showCatalog ? "Hide" : "Show"} Catalog</button><button onClick={() => setShowAddMapping((open) => !open)} style={primaryBtnStyle}>{showAddMapping ? "Cancel" : "Add Mapping"}</button></div>
        </div>
        {showAddMapping && <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, padding: 12, marginBottom: 12, background: T.cardBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8 }}>
          <input value={newMapping.mapId} onChange={(e) => setNewMapping((current) => ({ ...current, mapId: e.target.value }))} placeholder="Map ID (e.g. M-046)" style={inputStyle()} />
          <select value={newMapping.isoControl} onChange={(e) => setNewMapping((current) => ({ ...current, isoControl: e.target.value }))} style={selectStyle()}><option value="">Select platform requirement / ISO control</option>{requirements.map((item) => <option key={item.id} value={`${item.id} — ${item.title}`}>{item.id} — {item.title}</option>)}</select>
          <select value={newMapping.cbeControlId} onChange={(e) => setNewMapping((current) => ({ ...current, cbeControlId: e.target.value }))} style={selectStyle()}><option value="">Select internal control</option>{platformLists.controls.map((item) => <option key={item._id || item.id || item.controlId} value={item.controlId || item._id || item.id}>{item.controlId || item._id || item.id} — {item.name || item.title}</option>)}</select>
          <select value={newMapping.pciRequirement} onChange={(e) => setNewMapping((current) => ({ ...current, pciRequirement: e.target.value }))} style={selectStyle()}><option value="">Select mapped policy</option>{platformLists.policies.map((item) => <option key={item._id || item.id || item.policyId} value={item.policyId || item._id || item.id}>{item.policyId || item._id || item.id} — {item.title || item.name}</option>)}</select>
          <select value={newMapping.cbeDomain} onChange={(e) => setNewMapping((current) => ({ ...current, cbeDomain: e.target.value }))} style={selectStyle()}><option value="">Select linked risk</option>{platformLists.risks.map((item) => <option key={item._id || item.id || item.riskId} value={item.riskId || item._id || item.id}>{item.riskId || item._id || item.id} — {item.title || item.name}</option>)}</select>
          <select value={newMapping.controlOwner} onChange={(e) => setNewMapping((current) => ({ ...current, controlOwner: e.target.value }))} style={selectStyle()}><option value="">Select owner from platform users</option>{["owner", "ownerTeam", "department"].flatMap((key) => platformLists.controls.map((item) => item[key])).filter(Boolean).filter((owner, index, items) => items.indexOf(owner) === index).map((owner) => <option key={owner} value={owner}>{owner}</option>)}</select>
          {["isoObjective", "supportingCbeControls", "mappingStrength", "coverage", "auditFrequency"].map((key) => <input key={key} value={newMapping[key]} onChange={(e) => setNewMapping((current) => ({ ...current, [key]: e.target.value }))} placeholder={key} style={inputStyle()} />)}
          <textarea value={newMapping.gap} onChange={(e) => setNewMapping((current) => ({ ...current, gap: e.target.value }))} placeholder="gap / coverage notes" rows={2} style={inputStyle({ resize: "vertical" })} />
          <textarea value={newMapping.typicalAuditEvidence} onChange={(e) => setNewMapping((current) => ({ ...current, typicalAuditEvidence: e.target.value }))} placeholder="typical audit evidence (one item per line)" rows={2} style={inputStyle({ resize: "vertical" })} />
          <textarea value={newMapping.rationale} onChange={(e) => setNewMapping((current) => ({ ...current, rationale: e.target.value }))} placeholder="rationale" rows={2} style={{ ...inputStyle({ resize: "vertical" }), gridColumn: "1 / -1" }} />
          <button onClick={addMapping} style={{ ...primaryBtnStyle, gridColumn: "1 / -1" }}>Save Mapping</button>
        </div>}
        {catalogError && <div style={{ color: T.red, fontSize: 12, marginBottom: 8 }}>{catalogError}</div>}
        {showCatalog && <div>
          <input value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} placeholder="Search Map ID, ISO, CBE, PCI, owner…" style={{ ...inputStyle(), width: "100%", marginBottom: 10 }} />
          <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}><thead><tr>{["Map ID", "ISO Control", "CBE Control", "PCI DSS", "Strength", "Coverage", "Owner", "Audit Frequency"].map((header) => <th key={header} style={{ textAlign: "left", padding: "8px 6px", color: T.textMuted, borderBottom: `1px solid ${T.panelBorder}` }}>{header}</th>)}</tr></thead><tbody>{filteredCatalog.map((row) => <tr key={row.mapId}><td style={{ padding: "8px 6px", color: T.accent }}>{row.mapId}</td><td style={{ padding: "8px 6px" }}>{row.isoControl}</td><td style={{ padding: "8px 6px" }}>{row.cbeControlId || row.cbeDomain || "—"}</td><td style={{ padding: "8px 6px" }}>{row.pciRequirement}</td><td style={{ padding: "8px 6px" }}>{row.mappingStrength}</td><td style={{ padding: "8px 6px" }}>{row.coverage}</td><td style={{ padding: "8px 6px" }}>{row.controlOwner || "—"}</td><td style={{ padding: "8px 6px" }}>{row.auditFrequency || "—"}</td></tr>)}</tbody></table></div>
        </div>}
      </section>}
    </div>
  );
}

function MappingChain({ requirement, framework, evidenceItems }) {
  const meta = reqStatusMeta(requirement.status);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const evidenceCount = evidenceItems.length;

  const nodes = [
    { label: framework?.name || "Unknown", sub: requirement.title, Icon: Landmark, color: T.purple },
    { label: requirement.mappedControls.length ? requirement.mappedControls.map((id) => nameOf(EXISTING_CONTROLS, id)).join(", ") : "No control mapped", sub: "Internal Control", Icon: ShieldCheck, color: T.blue },
    { label: requirement.relatedPolicies.length ? requirement.relatedPolicies.map((id) => nameOf(EXISTING_POLICIES, id)).join(", ") : "No policy linked", sub: "Policy", Icon: FileText, color: T.accent },
    { label: requirement.relatedRisks.length ? requirement.relatedRisks.map((id) => nameOf(EXISTING_RISKS, id)).join(", ") : "No risk linked", sub: "Risk", Icon: AlertTriangle, color: T.red },
    { label: requirement.relatedAssets.length ? `${requirement.relatedAssets.length} asset(s)` : "No asset linked", sub: "Asset", Icon: Boxes, color: T.grey },
    { label: evidenceCount ? `${evidenceCount} item(s)` : "No evidence", sub: "Evidence", Icon: FolderCheck, color: T.amber, interactive: true },
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
              onClick={() => n.interactive && setEvidenceOpen((v) => !v)}
              style={{
                minWidth: 150,
                maxWidth: 190,
                background: n.interactive && evidenceOpen ? T.amberSoft : T.cardBg,
                border: n.interactive && evidenceOpen ? `1px solid ${T.amber}` : `1px solid ${T.panelBorder}`,
                borderRadius: 8,
                padding: "10px 12px",
                flexShrink: 0,
                cursor: n.interactive ? "pointer" : "default",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <n.Icon size={12} color={n.color} />
                <span style={{ fontSize: 9.5, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{n.sub}</span>
                {n.interactive && (
                  <ChevronDown size={11} color={T.textMuted} style={{ marginLeft: "auto", transition: "transform 0.2s ease", transform: evidenceOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                )}
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
      {evidenceOpen && (
        <div style={{ marginTop: 12, borderTop: `1px solid ${T.panelBorder}`, paddingTop: 12 }}>
          {evidenceCount === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: T.textMuted, fontSize: 12 }}>No evidence items linked to this requirement.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {evidenceItems.map((e) => {
                const expired = e.expirationDate && new Date(e.expirationDate) < new Date("2026-08-23");
                const statusMeta = evidenceStatusMeta(e.status);
                return (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, background: T.cardBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                      {e.attachment && e.attachment.type && e.attachment.type.startsWith("image") && e.attachment.data ? (
                        <img src={e.attachment.data} alt={e.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", flexShrink: 0, border: `1px solid ${T.panelBorder}` }} />
                      ) : (
                        <FolderCheck size={14} color={T.amber} style={{ flexShrink: 0 }} />
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</div>
                        <div style={{ fontSize: 10.5, color: T.textMuted, marginTop: 2 }}>
                          {e.type && <span style={{ marginRight: 12 }}>{e.type}</span>}
                          {e.owner && <span style={{ marginRight: 12 }}>Owner: {e.owner}</span>}
                          {e.controlId && <span>Control: {nameOf(EXISTING_CONTROLS, e.controlId)}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      {e.uploadDate && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 9.5, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.3 }}>Uploaded</div>
                          <div style={{ fontSize: 11, color: T.textSecondary }}>{e.uploadDate}</div>
                        </div>
                      )}
                      {e.expirationDate && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 9.5, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.3 }}>Expires</div>
                          <div style={{ fontSize: 11, color: expired ? T.red : T.textSecondary }}>{e.expirationDate}</div>
                        </div>
                      )}
                      <Pill label={e.status} {...statusMeta} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Node({ color, label, value }) {
  return <div style={{ background: `${color}15`, border: `1px solid ${color}33`, borderRadius: 7, padding: "6px 10px", flex: "1 1 auto", minWidth: 100 }}><div style={{ fontSize: 9, fontWeight: 700, color, letterSpacing: 0.5 }}>{label}</div><div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div></div>;
}

function EvidencePage({ data, setData }) {
  const { evidence, requirements } = data;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [historyLog, setHistoryLog] = useState({});
  const { sort, toggle, apply } = useSort("uploadDate");

  const types = [...new Set(evidence.map((e) => e.type).filter(Boolean))];
  const filtered = apply(evidence.filter((e) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || e.name.toLowerCase().includes(q) || e.owner.toLowerCase().includes(q) || e.id.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "All" || e.status === statusFilter;
    const matchesType = typeFilter === "All" || e.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }));

  const setStatus = (id, status) => {
    setData((d) => ({ ...d, evidence: d.evidence.map((e) => e.id === id ? { ...e, status } : e) }));
    setHistoryLog((prev) => ({ ...prev, [id]: [{ action: `Status changed to ${status}`, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }), user: "Current User" }, ...(prev[id] || [])] }));
  };

  const addEvidence = (form) => {
    setData((d) => ({ ...d, evidence: [{ ...form, id: `EVD-${Math.random().toString(36).slice(2, 5).toUpperCase()}` }, ...d.evidence] }));
    setCreating(false);
  };

  const getStats = () => {
    const total = evidence.length;
    const approved = evidence.filter((e) => e.status === "Approved").length;
    const pending = evidence.filter((e) => ["Submitted", "Under Review", "Requested"].includes(e.status)).length;
    const rejected = evidence.filter((e) => e.status === "Rejected").length;
    const expired = evidence.filter((e) => e.expirationDate && new Date(e.expirationDate) < new Date()).length;
    return { total, approved, pending, rejected, expired };
  };

  const stats = getStats();

  const statusChips = [
    { label: "All", count: stats.total, color: T.textSecondary },
    { label: "Approved", count: stats.approved, color: T.green },
    { label: "Submitted", count: evidence.filter((e) => e.status === "Submitted").length, color: T.amber },
    { label: "Under Review", count: evidence.filter((e) => e.status === "Under Review").length, color: T.blue },
    { label: "Rejected", count: stats.rejected, color: T.red },
    { label: "Expired", count: stats.expired, color: T.red },
    { label: "Missing", count: evidence.filter((e) => e.status === "Missing").length, color: T.grey },
  ];

  return (
    <div>
      <PageHeading title="Evidence" subtitle="Supporting artifacts for assessments — evidence supports a decision, it doesn't replace it." action={<button onClick={() => setCreating(true)} style={{ ...primaryBtnStyle, padding: "10px 16px" }}><Upload size={14} style={{ marginRight: 6 }} /> Upload Evidence</button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
        {statusChips.map((chip) => (
          <div key={chip.label} onClick={() => setStatusFilter(chip.label)} style={{ background: statusFilter === chip.label ? `${chip.color}15` : T.cardBg, border: `1px solid ${statusFilter === chip.label ? chip.color : T.panelBorder}`, borderRadius: 8, padding: "12px 14px", cursor: "pointer", transition: "all 0.15s ease" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: statusFilter === chip.label ? chip.color : T.textPrimary }}>{chip.count}</div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>{chip.label}</div>
          </div>
        ))}
      </div>

      <Toolbar search={search} onSearch={setSearch} placeholder="Search evidence…" resultCount={filtered.length} totalCount={evidence.length} right={<FilterSelect label="" value={typeFilter} options={["All", ...types]} onChange={setTypeFilter} />} />

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 && <EmptyState label="No evidence matches your search or filters." />}
        {filtered.map((e) => {
          const expired = e.expirationDate && new Date(e.expirationDate) < new Date("2026-08-23");
          const isExpanded = expandedId === e.id;
          const statusMeta = evidenceStatusMeta(e.status);
          const log = historyLog[e.id] || [];
          return (
            <div key={e.id} style={{ background: T.panelBg, border: `1px solid ${isExpanded ? statusMeta.color : T.panelBorder}`, borderRadius: 10, overflow: "hidden", transition: "border-color 0.15s ease" }}>
              <div onClick={() => setExpandedId(isExpanded ? null : e.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}>
                <div style={{ transition: "transform 0.2s ease", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", flexShrink: 0 }}><ChevronRight size={14} color={T.textMuted} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</span>
                    <span style={{ fontSize: 10, color: T.textMuted, flexShrink: 0 }}>{e.id}</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: T.textMuted, marginTop: 2, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {e.type && <span>{e.type}</span>}
                    {e.owner && <span>Owner: {e.owner}</span>}
                    <span style={{ color: T.textSecondary }}>{nameOf(requirements, e.requirementId)}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {expired && <span style={{ fontSize: 9.5, color: T.red, fontWeight: 700, textTransform: "uppercase" }}>Expired</span>}
                  <Pill label={e.status} {...statusMeta} />
                  <div style={{ display: "flex", gap: 4 }}>
                    {(e.status === "Submitted" || e.status === "Under Review" || e.status === "Requested") && (
                      <button onClick={(ev) => { ev.stopPropagation(); setStatus(e.id, "Approved"); }} style={{ ...iconBtnStyle, padding: "4px 6px" }} title="Approve"><CheckCircle2 size={12} color={T.green} /></button>
                    )}
                    {e.status !== "Rejected" && e.status !== "Approved" && (
                      <button onClick={(ev) => { ev.stopPropagation(); setStatus(e.id, "Rejected"); }} style={{ ...iconBtnStyle, padding: "4px 6px" }} title="Reject"><XCircle size={12} color={T.red} /></button>
                    )}
                    {e.status === "Approved" && (
                      <button onClick={(ev) => { ev.stopPropagation(); setStatus(e.id, "Under Review"); }} style={{ ...iconBtnStyle, padding: "4px 6px" }} title="Re-review"><RefreshCw size={12} color={T.textSecondary} /></button>
                    )}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div style={{ borderTop: `1px solid ${T.panelBorder}`, background: T.cardBg }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: "16px 20px" }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Evidence Details</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <DetailRow k="Control" v={nameOf(EXISTING_CONTROLS, e.controlId) || "—"} />
                        <DetailRow k="Requirement" v={nameOf(requirements, e.requirementId) || "—"} />
                        <DetailRow k="Type" v={e.type || "—"} />
                        <DetailRow k="Owner" v={e.owner || "—"} />
                        <DetailRow k="Upload Date" v={e.uploadDate || "—"} />
                        <DetailRow k="Expiration" v={e.expirationDate ? <span style={{ color: expired ? T.red : T.textPrimary }}>{e.expirationDate}{expired ? " (Expired)" : ""}</span> : "—"} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Verification</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <DetailRow k="Status" v={<Pill label={e.status} {...statusMeta} />} />
                        <DetailRow k="Verification" v={<span style={{ fontWeight: 600, color: e.verificationStatus === "Verified" ? T.green : T.amber }}>{e.verificationStatus || "Pending"}</span>} />
                        <DetailRow k="Reviewer" v={e.reviewer || "—"} />
                        <DetailRow k="Comments" v={e.comments ? <span style={{ fontSize: 11, color: T.textSecondary }}>{e.comments}</span> : "—"} />
                      </div>
                    </div>
                  </div>

                  {e.attachment && (
                    <div style={{ borderTop: `1px solid ${T.panelBorder}`, padding: "16px 20px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Attachment Preview</div>
                      {e.attachment.type && e.attachment.type.startsWith("image") ? (
                        <div style={{ position: "relative" }}>
                          <img src={e.attachment.data} alt={e.attachment.name} style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8, border: `1px solid ${T.panelBorder}`, display: "block" }} />
                          <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.7)", borderRadius: 6, padding: "4px 10px", fontSize: 10, color: "#fff", fontWeight: 600 }}>{e.attachment.name}</div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 12, background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "14px 16px" }}>
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: T.amberSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><FileText size={20} color={T.amber} /></div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.attachment.name}</div>
                            <div style={{ fontSize: 11, color: T.textMuted }}>{e.attachment.size ? `${Math.round(e.attachment.size / 1024)} KB` : "Document"} • {e.attachment.type || "Unknown type"}</div>
                          </div>
                          <button style={{ ...secondaryBtnStyle, padding: "6px 12px", fontSize: 11 }}><Download size={12} style={{ marginRight: 4 }} /> Download</button>
                        </div>
                      )}
                    </div>
                  )}

                  {log.length > 0 && (
                    <div style={{ borderTop: `1px solid ${T.panelBorder}`, padding: "12px 20px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Activity Log</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {log.map((entry, i) => (
                          <div key={i} style={{ display: "flex", gap: 10, fontSize: 11, color: T.textSecondary }}>
                            <span style={{ color: T.textMuted, flexShrink: 0 }}>{entry.date}</span>
                            <span>{entry.action}</span>
                            <span style={{ color: T.textMuted }}>— {entry.user}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ borderTop: `1px solid ${T.panelBorder}`, padding: "12px 20px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => setStatus(e.id, "Approved")} style={{ ...secondaryBtnStyle, padding: "6px 12px", fontSize: 11 }}><CheckCircle2 size={12} style={{ marginRight: 4 }} color={T.green} /> Approve</button>
                    <button onClick={() => setStatus(e.id, "Rejected")} style={{ ...secondaryBtnStyle, padding: "6px 12px", fontSize: 11 }}><XCircle size={12} style={{ marginRight: 4 }} color={T.red} /> Reject</button>
                    <button onClick={() => setStatus(e.id, "Requested")} style={{ ...secondaryBtnStyle, padding: "6px 12px", fontSize: 11 }}><RefreshCw size={12} style={{ marginRight: 4 }} color={T.textSecondary} /> Request Update</button>
                    <button onClick={() => setStatus(e.id, "Under Review")} style={{ ...secondaryBtnStyle, padding: "6px 12px", fontSize: 11 }}><Eye size={12} style={{ marginRight: 4 }} color={T.textSecondary} /> Send to Review</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {creating && <EvidenceFormDrawer requirements={requirements} onClose={() => setCreating(false)} onSave={addEvidence} />}
    </div>
  );
}

function EvidenceFormDrawer({ requirements, onClose, onSave }) {
  const [form, setForm] = useState({ name: "", requirementId: requirements[0]?.id || "", controlId: EXISTING_CONTROLS[0].id, type: "Document", owner: "", uploadDate: "2026-08-23", expirationDate: "", status: "Submitted", verificationStatus: "Pending", reviewer: "", comments: "" });
  const [attachment, setAttachment] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const set = (f, v) => setForm((x) => ({ ...x, [f]: v }));
  const fileToData = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setAttachment({ name: file.name, size: file.size, type: file.type, data: reader.result }); };
    reader.readAsDataURL(file);
  };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) fileToData(file); };
  const handlePaste = (e) => { const item = e.clipboardData.items[0]; if (item && item.type.startsWith("image")) { const file = item.getAsFile(); fileToData(file); } };
  const save = () => { if (!form.name.trim()) return setError("Evidence Name is required."); onSave({ ...form, attachment }); };
  return (
    <div style={overlayStyle}><div style={{ ...drawerStyle, width: 520 }}>
      <div style={drawerHeaderStyle}><div style={{ fontSize: 15, fontWeight: 700 }}>Upload Evidence</div><button onClick={onClose} style={iconBtnStyle}><X size={15} color={T.textSecondary} /></button></div>
      <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }} onPaste={handlePaste}>
        <Field label="Evidence Name" required error={error}><input value={form.name} onChange={(e) => set("name", e.target.value)} style={inputStyle()} /></Field>
        <Field label="Requirement"><select value={form.requirementId} onChange={(e) => set("requirementId", e.target.value)} style={selectStyle()}>{requirements.map((r) => <option key={r.id} value={r.id}>{r.id} — {r.title}</option>)}</select></Field>
        <Field label="Control"><select value={form.controlId} onChange={(e) => set("controlId", e.target.value)} style={selectStyle()}>{EXISTING_CONTROLS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Type"><select value={form.type} onChange={(e) => set("type", e.target.value)} style={selectStyle()}>{EVIDENCE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Owner"><input value={form.owner} onChange={(e) => set("owner", e.target.value)} style={inputStyle()} /></Field>
        <div style={{ display: "flex", gap: 12 }}><div style={{ flex: 1 }}><Field label="Upload Date"><input type="date" value={form.uploadDate} onChange={(e) => set("uploadDate", e.target.value)} style={inputStyle()} /></Field></div><div style={{ flex: 1 }}><Field label="Expiration Date"><input type="date" value={form.expirationDate} onChange={(e) => set("expirationDate", e.target.value)} style={inputStyle()} /></Field></div></div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, marginBottom: 6 }}>ATTACHMENT — Screenshot / File</div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("evidence-file-input").click()}
            style={{
              border: `2px dashed ${dragOver ? T.amber : T.panelBorder}`,
              borderRadius: 10,
              padding: attachment ? "12px" : "24px",
              textAlign: "center",
              cursor: "pointer",
              background: dragOver ? T.amberSoft : T.inputBg,
              transition: "all 0.15s ease",
            }}
          >
            {attachment ? (
              <div>
                {attachment.type && attachment.type.startsWith("image") ? (
                  <div style={{ marginBottom: 8 }}>
                    <img src={attachment.data} alt={attachment.name} style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, border: `1px solid ${T.panelBorder}` }} />
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, justifyContent: "center" }}>
                    <FileText size={20} color={T.amber} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{attachment.name}</span>
                  </div>
                )}
                <div style={{ fontSize: 11, color: T.textMuted }}>
                  {attachment.type && attachment.type.startsWith("image") ? "Image" : attachment.name} • {attachment.size ? `${Math.round(attachment.size / 1024)} KB` : ""}
                </div>
                <button onClick={(e) => { e.stopPropagation(); setAttachment(null); }} style={{ ...secondaryBtnStyle, padding: "4px 12px", fontSize: 11, marginTop: 8 }}>Remove</button>
              </div>
            ) : (
              <div>
                <Upload size={28} color={T.textMuted} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 12, color: T.textSecondary, fontWeight: 600 }}>Drop file here or click to browse</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>or paste screenshot with Ctrl+V</div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>PNG, JPG, PDF — max 10MB</div>
              </div>
            )}
            <input id="evidence-file-input" type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" style={{ display: "none" }} onChange={(e) => { if (e.target.files[0]) fileToData(e.target.files[0]); }} />
          </div>
        </div>

        <Field label="Status"><select value={form.status} onChange={(e) => set("status", e.target.value)} style={selectStyle()}>{EVIDENCE_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Verification Status"><select value={form.verificationStatus} onChange={(e) => set("verificationStatus", e.target.value)} style={selectStyle()}>{["Verified", "Pending"].map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Reviewer"><input value={form.reviewer} onChange={(e) => set("reviewer", e.target.value)} style={inputStyle()} /></Field>
        <Field label="Comments"><textarea value={form.comments} onChange={(e) => set("comments", e.target.value)} rows={3} style={inputStyle({ resize: "vertical" })} /></Field>
      </div>
      <div style={drawerFooterStyle}><button onClick={onClose} style={secondaryBtnStyle}>Cancel</button><button onClick={save} style={primaryBtnStyle}>Upload</button></div>
    </div></div>
  );
}

function GapsPage({ data, setData, goTo }) {
  const { gaps, requirements, frameworks } = data;
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ framework: "All", severity: "All", owner: "All", status: "All" });
  const [creating, setCreating] = useState(false);
  const { sort, toggle, apply } = useSort("dueDate");
  const owners = [...new Set(gaps.map((g) => g.owner))];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return gaps.filter((g) => {
      const matchSearch = !q || g.description.toLowerCase().includes(q) || g.id.toLowerCase().includes(q);
      const matchFw = filters.framework === "All" || g.frameworkId === filters.framework;
      const matchSev = filters.severity === "All" || g.severity === filters.severity;
      const matchOwner = filters.owner === "All" || g.owner === filters.owner;
      const matchStatus = filters.status === "All" || g.status === filters.status;
      return matchSearch && matchFw && matchSev && matchOwner && matchStatus;
    });
  }, [gaps, search, filters]);
  const paged = apply(filtered);
  const addGap = (form) => {
    setData((d) => ({ ...d, gaps: [{ ...form, id: `GAP-${Math.random().toString(36).slice(2, 5).toUpperCase()}` }, ...d.gaps] }));
    setCreating(false);
  };
  const columns = [
    { key: "id", label: "ID" }, { key: "requirementId", label: "Requirement", render: (r) => nameOf(requirements, r.requirementId) },
    { key: "description", label: "Description", render: (r) => <span style={{ maxWidth: 200, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</span> },
    { key: "severity", label: "Severity", render: (r) => { const m = severityMeta(r.severity); return <Pill label={r.severity} color={m.color} bg={m.bg} />; } },
    { key: "owner", label: "Owner" }, { key: "dueDate", label: "Due Date", render: (r) => <span style={{ color: isOverdue(r.dueDate, r.status, ["Resolved", "Closed"]) ? T.red : T.textSecondary }}>{r.dueDate}</span> },
    { key: "status", label: "Status", render: (r) => { const m = gapStatusMeta(r.status); return <Pill label={r.status} color={m.color} bg={m.bg} />; } },
  ];
  return (
    <div>
      <PageHeading title="Compliance Gaps" subtitle="Track compliance shortfalls and deviations." action={<button onClick={() => setCreating(true)} style={{ ...primaryBtnStyle, padding: "10px 16px" }}><Plus size={14} style={{ marginRight: 6 }} /> Log Gap</button>} />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search gaps…" resultCount={paged.length} totalCount={gaps.length} right={
        <div style={{ display: "flex", gap: 8 }}>
          <FilterSelect label="" value={filters.status} options={["All", ...GAP_STATUSES]} onChange={(v) => setFilters((f) => ({ ...f, status: v }))} />
          <FilterSelect label="" value={filters.severity} options={["All", ...GAP_SEVERITIES]} onChange={(v) => setFilters((f) => ({ ...f, severity: v }))} />
          <FilterSelect label="" value={filters.framework} options={["All", ...frameworks.map((f) => f.id)]} onChange={(v) => setFilters((f) => ({ ...f, framework: v }))} />
          <FilterSelect label="" value={filters.owner} options={["All", ...owners]} onChange={(v) => setFilters((f) => ({ ...f, owner: v }))} />
        </div>
      } />
      <DataTable columns={columns} rows={paged} sort={sort} onSort={toggle} renderActions={(r) => (
        <div style={{ display: "flex", gap: 6 }}><button onClick={() => goTo("remediation")} style={iconBtnStyle} title="Create Remediation"><Wrench size={13} color={T.textSecondary} /></button></div>
      )} />
      {creating && <GapFormDrawer requirements={requirements} frameworks={frameworks} onClose={() => setCreating(false)} onSave={addGap} />}
    </div>
  );
}

function GapFormDrawer({ requirements, frameworks, onClose, onSave }) {
  const [form, setForm] = useState({ requirementId: requirements[0]?.id || "", description: "", currentState: "", expectedState: "", severity: "Medium", owner: "", dueDate: "", status: "Open", relatedRiskId: "", relatedControlId: "", remediationPlan: "" });
  const set = (f, v) => setForm((x) => ({ ...x, [f]: v }));
  const [error, setError] = useState("");
  const req = requirements.find((r) => r.id === form.requirementId);
  const save = () => { if (!form.description.trim()) return setError("Description is required."); if (!form.owner.trim()) return setError("Owner is required."); onSave({ ...form, frameworkId: req?.frameworkId || frameworks[0]?.id }); };
  return (
    <div style={overlayStyle}><div style={{ ...drawerStyle, width: 500 }}>
      <div style={drawerHeaderStyle}><div style={{ fontSize: 15, fontWeight: 700 }}>Log Gap</div><button onClick={onClose} style={iconBtnStyle}><X size={15} color={T.textSecondary} /></button></div>
      <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }}>
        <Field label="Requirement" required><select value={form.requirementId} onChange={(e) => set("requirementId", e.target.value)} style={selectStyle()}>{requirements.map((r) => <option key={r.id} value={r.id}>{r.id} — {r.title}</option>)}</select></Field>
        <Field label="Description" required error={error}><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} style={inputStyle({ resize: "vertical" })} /></Field>
        <Field label="Current State"><textarea value={form.currentState} onChange={(e) => set("currentState", e.target.value)} rows={2} style={inputStyle({ resize: "vertical" })} /></Field>
        <Field label="Expected State"><textarea value={form.expectedState} onChange={(e) => set("expectedState", e.target.value)} rows={2} style={inputStyle({ resize: "vertical" })} /></Field>
        <Field label="Severity"><select value={form.severity} onChange={(e) => set("severity", e.target.value)} style={selectStyle()}>{GAP_SEVERITIES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Owner" required><input value={form.owner} onChange={(e) => set("owner", e.target.value)} style={inputStyle()} /></Field>
        <Field label="Due Date"><input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} style={inputStyle()} /></Field>
        <Field label="Status"><select value={form.status} onChange={(e) => set("status", e.target.value)} style={selectStyle()}>{GAP_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Related Risk"><select value={form.relatedRiskId} onChange={(e) => set("relatedRiskId", e.target.value)} style={selectStyle()}><option value="">None</option>{EXISTING_RISKS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></Field>
        <Field label="Related Control"><select value={form.relatedControlId} onChange={(e) => set("relatedControlId", e.target.value)} style={selectStyle()}><option value="">None</option>{EXISTING_CONTROLS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Remediation Plan"><textarea value={form.remediationPlan} onChange={(e) => set("remediationPlan", e.target.value)} rows={3} style={inputStyle({ resize: "vertical" })} /></Field>
      </div>
      <div style={drawerFooterStyle}><button onClick={onClose} style={secondaryBtnStyle}>Cancel</button><button onClick={save} style={primaryBtnStyle}>Save Gap</button></div>
    </div></div>
  );
}

function RemediationPage({ data, setData }) {
  const { remediation, gaps, requirements } = data;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [creating, setCreating] = useState(false);
  const { sort, toggle, apply } = useSort("dueDate");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return remediation.filter((r) => (!q || r.description.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)) && (statusFilter === "All" || r.status === statusFilter));
  }, [remediation, search, statusFilter]);
  const paged = apply(filtered);
  const updateProgress = (id, progress) => {
    setData((d) => {
      const task = d.remediation.find((r) => r.id === id);
      const completed = progress >= 100;
      return {
        ...d,
        remediation: d.remediation.map((r) => r.id === id ? { ...r, progress, status: completed ? "Completed" : progress > 0 && r.status === "Open" ? "In Progress" : r.status } : r),
        gaps: completed && task?.gapId
          ? d.gaps.map((gap) => gap.id === task.gapId ? { ...gap, status: "Resolved" } : gap)
          : d.gaps,
      };
    });
  };
  const addTask = (form) => { setData((d) => ({ ...d, remediation: [{ ...form, id: `REM-${Math.random().toString(36).slice(2, 5).toUpperCase()}`, progress: 0 }, ...d.remediation] })); setCreating(false); };
  const columns = [
    { key: "id", label: "Task ID" }, { key: "gapId", label: "Gap", render: (r) => r.gapId },
    { key: "description", label: "Description", render: (r) => <span style={{ maxWidth: 180, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</span> },
    { key: "owner", label: "Owner" }, { key: "priority", label: "Priority" },
    { key: "dueDate", label: "Due Date", render: (r) => <span style={{ color: isOverdue(r.dueDate, r.status, ["Completed", "Cancelled"]) ? T.red : T.textSecondary }}>{r.dueDate}</span> },
    { key: "status", label: "Status", render: (r) => { const m = remediationStatusMeta(r.status); return <Pill label={r.status} color={m.color} bg={m.bg} />; } },
    { key: "progress", label: "Progress", noSort: true, render: (r) => (
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: 120 }}>
        <input type="range" min={0} max={100} value={r.progress} onChange={(e) => updateProgress(r.id, Number(e.target.value))} style={{ flex: 1 }} />
        <span style={{ fontSize: 11, width: 30 }}>{r.progress}%</span>
      </div>
    )},
  ];
  return (
    <div>
      <PageHeading title="Remediation" subtitle="Track remediation tasks for identified gaps." action={<button onClick={() => setCreating(true)} style={{ ...primaryBtnStyle, padding: "10px 16px" }}><Plus size={14} style={{ marginRight: 6 }} /> New Task</button>} />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search tasks…" resultCount={paged.length} totalCount={remediation.length} right={<FilterSelect label="" value={statusFilter} options={["All", ...REMEDIATION_STATUSES]} onChange={setStatusFilter} />} />
      <DataTable columns={columns} rows={paged} sort={sort} onSort={toggle} />
      {creating && <RemediationFormDrawer gaps={gaps} requirements={requirements} onClose={() => setCreating(false)} onSave={addTask} />}
    </div>
  );
}

function RemediationFormDrawer({ gaps, requirements, onClose, onSave }) {
  const [form, setForm] = useState({ gapId: gaps[0]?.id || "", description: "", owner: "", priority: "High", dueDate: "", status: "Open" });
  const set = (f, v) => setForm((x) => ({ ...x, [f]: v }));
  const [error, setError] = useState("");
  const gap = gaps.find((g) => g.id === form.gapId);
  const save = () => { if (!form.description.trim()) return setError("Description is required."); onSave({ ...form, requirementId: gap?.requirementId || requirements[0]?.id || "", relatedRiskId: gap?.relatedRiskId || "", relatedControlId: gap?.relatedControlId || "" }); };
  return (
    <div style={overlayStyle}><div style={{ ...drawerStyle, width: 480 }}>
      <div style={drawerHeaderStyle}><div style={{ fontSize: 15, fontWeight: 700 }}>New Remediation Task</div><button onClick={onClose} style={iconBtnStyle}><X size={15} color={T.textSecondary} /></button></div>
      <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }}>
        <Field label="Originating Gap" required><select value={form.gapId} onChange={(e) => set("gapId", e.target.value)} style={selectStyle()}>{gaps.map((g) => <option key={g.id} value={g.id}>{g.id} — {g.description}</option>)}</select></Field>
        <Field label="Description" required error={error}><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} style={inputStyle({ resize: "vertical" })} /></Field>
        <Field label="Owner"><input value={form.owner} onChange={(e) => set("owner", e.target.value)} style={inputStyle()} /></Field>
        <Field label="Priority"><select value={form.priority} onChange={(e) => set("priority", e.target.value)} style={selectStyle()}>{REMEDIATION_PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></Field>
        <Field label="Due Date"><input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} style={inputStyle()} /></Field>
        <Field label="Status"><select value={form.status} onChange={(e) => set("status", e.target.value)} style={selectStyle()}>{REMEDIATION_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
      </div>
      <div style={drawerFooterStyle}><button onClick={onClose} style={secondaryBtnStyle}>Cancel</button><button onClick={save} style={primaryBtnStyle}>Create Task</button></div>
    </div></div>
  );
}

function ReportsPage({ data }) {
  const { frameworks, requirements, gaps, evidence, remediation } = data;
  const score = complianceScore(requirements);
  const reports = [
    { title: "Overall Compliance Report", desc: "Program-wide score, framework count, requirement count", icon: Shield, data: `${score}% • ${frameworks.length} frameworks • ${requirements.length} requirements` },
    { title: "Framework Compliance Report", desc: "Per-framework scores and coverage", icon: ClipboardList, data: frameworks.map((f) => `${f.id}: ${complianceScore(requirements.filter((r) => r.frameworkId === f.id))}%`).join(" | ") },
    { title: "Requirements Status Report", desc: "Breakdown by compliance status", icon: FileText, data: `C:${requirements.filter((r) => r.status === "Compliant").length} P:${requirements.filter((r) => r.status === "Partially Compliant").length} NC:${requirements.filter((r) => r.status === "Non-Compliant").length}` },
    { title: "Compliance Gap Report", desc: "Open gaps by severity", icon: AlertOctagon, data: gaps.filter((g) => !["Resolved", "Closed"].includes(g.status)).map((g) => g.id).join(", ") || "None" },
    { title: "Evidence Status Report", desc: "Approved vs total evidence", icon: Upload, data: `${evidence.filter((e) => e.status === "Approved").length} of ${evidence.length} approved` },
    { title: "Remediation Report", desc: "Completed vs total tasks", icon: Wrench, data: `${remediation.filter((r) => r.status === "Completed").length} of ${remediation.length} completed` },
    { title: "Audit Readiness Report", desc: "Cross-references open findings, gaps, missing evidence", icon: ShieldCheck, data: `${gaps.filter((g) => g.status === "Open").length} open gaps, ${evidence.filter((e) => e.status === "Missing").length} missing evidence` },
  ];
  return (
    <div>
      <PageHeading title="Reports" subtitle="Pre-canned reports for stakeholder communication." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        {reports.map((r, i) => (
          <div key={i} style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: 20, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}><r.icon size={16} color={T.accent} /><span style={{ fontWeight: 600, fontSize: 13 }}>{r.title}</span></div>
            <p style={{ fontSize: 12, color: T.textSecondary, marginBottom: 8 }}>{r.desc}</p>
            <span style={{ fontSize: 11, color: T.textMuted }}>{r.data}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditFindingsPage({ data }) {
  const { findings } = data;
  const [search, setSearch] = useState("");
  const { sort, toggle, apply } = useSort("dueDate");
  const rows = apply(findings.filter((f) => { const q = search.trim().toLowerCase(); return !q || f.finding.toLowerCase().includes(q) || f.auditor.toLowerCase().includes(q); }));
  const columns = [
    { key: "id", label: "Finding ID" }, { key: "auditId", label: "Audit" }, { key: "requirementId", label: "Requirement" },
    { key: "finding", label: "Finding", render: (r) => <span style={{ maxWidth: 200, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.finding}</span> },
    { key: "severity", label: "Severity", render: (r) => { const m = severityMeta(r.severity); return <Pill label={r.severity} color={m.color} bg={m.bg} />; } },
    { key: "evidenceId", label: "Evidence" }, { key: "auditor", label: "Auditor" },
    { key: "status", label: "Status", render: (r) => <Pill label={r.status} color={r.status === "Open" ? T.red : T.amber} bg={r.status === "Open" ? T.redSoft : T.amberSoft} /> },
    { key: "dueDate", label: "Due Date" },
  ];
  return (
    <div>
      <PageHeading title="Audit & Findings" subtitle="Audit findings from the Audit Management module (read-only)." />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search findings…" resultCount={rows.length} totalCount={findings.length} />
      <DataTable columns={columns} rows={rows} sort={sort} onSort={toggle} />
    </div>
  );
}

export default function ComplianceModule({ page: pageProp }) {
  const [page, setPage] = useState(pageProp || "dashboard");
  useEffect(() => { if (pageProp) setPage(pageProp); }, [pageProp]);
  const [data, setData] = useState(() => loadComplianceState() || {
    frameworks: SEED_FRAMEWORKS, requirements: SEED_REQUIREMENTS, assessments: SEED_ASSESSMENTS,
    evidence: SEED_EVIDENCE, gaps: SEED_GAPS, remediation: SEED_REMEDIATION, findings: SEED_FINDINGS,
  });
  useEffect(() => {
    window.localStorage.setItem(COMPLIANCE_STORAGE_KEY, JSON.stringify(data));
  }, [data]);
  const renderPage = () => {
    switch (page) {
      case "dashboard": return <ComplianceDashboard data={data} goTo={setPage} />;
      case "frameworks": return <FrameworksPage data={data} setData={setData} goTo={setPage} />;
      case "requirements": return <RequirementsPage data={data} setData={setData} goTo={setPage} />;
      case "assessments": return <AssessmentsPage data={data} setData={setData} />;
      case "crossmapping": return <CrossMappingPage data={data} />;
      case "evidence": return <EvidencePage data={data} setData={setData} />;
      case "gaps": return <GapsPage data={data} setData={setData} goTo={setPage} />;
      case "remediation": return <RemediationPage data={data} setData={setData} />;
      case "reports": return <ReportsPage data={data} />;
      case "audit": return <AuditFindingsPage data={data} />;
      default: return null;
    }
  };
  return (
    <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1, background: T.bg, fontFamily: FONT_STACK, color: T.textPrimary }}>
      {renderPage()}
    </div>
  );
}
