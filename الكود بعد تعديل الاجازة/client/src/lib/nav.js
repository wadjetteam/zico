import {
  Building2,
  Landmark,
  ShieldAlert,
  ShieldCheck,
  ClipboardCheck,
  Boxes,
  Sparkles,
  ListChecks,
  BarChart3,
  Settings,
  SearchCheck,
} from "lucide-react";

export const NAV_SECTIONS = [
  {
    id: "context",
    label: "Context Organization",
    icon: Building2,
    items: [
      { to: "/context/organizations", label: "Organizations" },
      { to: "/context/domains", label: "Domains" },
      { to: "/context/parameters", label: "Parameters" },
      { to: "/context/groups", label: "Groups" },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    icon: Landmark,
    items: [
      { to: "/governance/policies", label: "Define Policies" },
      { to: "/governance/exceptions", label: "Define Exceptions" },
      { to: "/governance/documents", label: "Document Program" },
      { to: "/governance/roles", label: "Roles & Permissions" },
      { to: "/governance/committees", label: "Committees" },
      { to: "/governance/executive", label: "Executive Dashboard" },
    ],
  },
  {
    id: "risk",
    label: "Risk Management",
    icon: ShieldAlert,
    items: [
      { to: "/risk/submit", label: "Submit Risk" },
      { to: "/risk/view", label: "View Risks" },
      { to: "/risk/scoring", label: "Risk Scoring" },
      { to: "/risk/reviews", label: "Management Reviews" },
      { to: "/risk/close", label: "Close Risks" },
      { to: "/risk/poam", label: "Plan of Action & Milestones" },
      { to: "/risk/score-history", label: "Score History" },
    ],
  },
  {
    id: "controls",
    label: "Control Management",
    icon: ShieldCheck,
    items: [
      { to: "/controls/management", label: "Control Library" },
    ],
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: ClipboardCheck,
    items: [
      { to: "/compliance/dashboard", label: "Dashboard" },
      { to: "/compliance/frameworks", label: "Frameworks & Regulations" },
      { to: "/compliance/requirements", label: "Requirements" },
      { to: "/compliance/assessments", label: "Assessments" },
      { to: "/compliance/crossmapping", label: "Cross-Mapping" },
      { to: "/compliance/evidence", label: "Evidence" },
      { to: "/compliance/gaps", label: "Compliance Gaps" },
      { to: "/compliance/remediation", label: "Remediation" },
      { to: "/compliance/reports", label: "Reports" },
      { to: "/compliance/audit", label: "Audit & Findings" },
    ],
  },
  {
    id: "audit",
    label: "Audit",
    icon: SearchCheck,
    items: [
      { to: "/audit/manage", label: "Manage Audits" },
      { to: "/audit/active", label: "Active Audits" },
      { to: "/audit/past", label: "Past Audits" },
    ],
  },
  {
    id: "assets",
    label: "Asset Management",
    icon: Boxes,
    items: [
      { to: "/assets/manage", label: "Manage Assets" },
      { to: "/assets/groups", label: "Asset Groups" },
    ],
  },
  {
    id: "ai",
    label: "Artificial Intelligence",
    icon: Sparkles,
    items: [
      { to: "/ai/insights", label: "AI Risk Insights" },
      { to: "/ai/assistant", label: "AI Assistant" },
    ],
  },
  {
    id: "assessments",
    label: "Assessments",
    icon: ListChecks,
    items: [
      { to: "/assessments/risk", label: "Risk Assessments" },
      { to: "/assessments/questionnaires", label: "Questionnaires" },
      { to: "/assessments/third-party", label: "Third-Party Assessments" },
    ],
  },
  {
    id: "reporting",
    label: "Reporting",
    icon: BarChart3,
    items: [
      { to: "/reporting/executive", label: "Executive Summary" },
      { to: "/reporting/dynamic-risk", label: "Dynamic Risk Report" },
      { to: "/reporting/compliance", label: "Compliance Reports" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    items: [
      { to: "/settings/mail", label: "Mail" },
      { to: "/settings/backup", label: "Backup" },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((s) =>
  s.items.map((i) => ({ ...i, section: s.label }))
);
