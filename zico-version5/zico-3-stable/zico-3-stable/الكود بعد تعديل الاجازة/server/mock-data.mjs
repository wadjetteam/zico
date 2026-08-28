export const USERS = [
  { _id: "u-admin", username: "admin", fullName: "System Administrator", name: "System Administrator", email: "admin@wadjet.local", department: "GRC", is_active: true, role: "board" },
  { _id: "u-analyst", username: "analyst", fullName: "Ana Lyte", name: "Ana Lyte", email: "analyst@wadjet.local", department: "Risk", is_active: true, role: "risk_owner" },
  { _id: "u-auditor", username: "auditor", fullName: "Audrey Tor", name: "Audrey Tor", email: "auditor@wadjet.local", department: "Audit", is_active: true, role: "ciso" },
  { _id: "u-manager", username: "manager", fullName: "Morgan Lee", name: "Morgan Lee", email: "manager@wadjet.local", department: "Operations", is_active: true, role: "cro" },
  { _id: "u-officer", username: "officer", fullName: "Owen Fischer", name: "Owen Fischer", email: "officer@wadjet.local", department: "Risk", is_active: true, role: "risk_owner" },
];

export const PASSWORDS = {
  admin: "admin123",
  analyst: "analyst123",
  auditor: "auditor123",
  manager: "manager123",
  officer: "officer123",
};

export const ROLES = [
  { _id: "r-admin", name: "Admin", description: "Full access to all modules", status: "Active", permissionsMatrix: { grc: "manage", audit: "manage", settings: "manage" }, approvalAuthority: "Tier 3", email: "admin@wadjet.local", modulesWithAccess: ["policy", "compliance", "audit", "context", "governance"] },
  { _id: "r-user", name: "User", description: "Standard analyst access", status: "Active", permissionsMatrix: { grc: "edit", audit: "view", settings: "view" }, approvalAuthority: "None", email: "analyst@wadjet.local", modulesWithAccess: ["policy", "compliance", "context"] },
  { _id: "r-auditor", name: "Auditor", description: "Audit module access", status: "Active", permissionsMatrix: { grc: "view", audit: "manage", settings: "view" }, approvalAuthority: "Tier 2", email: "auditor@wadjet.local", modulesWithAccess: ["audit", "compliance"] },
  { _id: "r-viewer", name: "Viewer", description: "Read-only access", status: "Active", permissionsMatrix: { grc: "view", audit: "view", settings: "none" }, approvalAuthority: "None", email: "viewer@wadjet.local", modulesWithAccess: ["policy", "audit"] },
];

export const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
export const daysAhead = (n) => new Date(Date.now() + n * 86400000).toISOString();

export const THRESHOLDS = { critical: 20, high: 12, medium: 6 };
export const CRITERIA = ["Financial", "Regulatory", "Reputational", "Safety", "Operational", "Confidentiality", "Integrity", "Availability"];

export const DOMAINS = [
  { _id: "d-1", name: "Information Security", organization: { _id: "o-1", name: "Wadjet Bank Plc" }, status: "active", scoringMethod: "advanced", description: "CIA triad and security operations", escalationMatrix: { Low: "Risk Owner", Medium: "Risk Owner + CISO", High: "CISO + CRO", Critical: "Board of Directors via Enterprise Risk Register" } },
  { _id: "d-2", name: "Operational", organization: { _id: "o-1", name: "Wadjet Bank Plc" }, status: "active", scoringMethod: "advanced", description: "Process and service delivery", escalationMatrix: { Low: "Process Owner", Medium: "Process Owner + COO", High: "COO + CRO", Critical: "Board of Directors via Enterprise Risk Register" } },
  { _id: "d-3", name: "Compliance", organization: { _id: "o-1", name: "Wadjet Bank Plc" }, status: "active", scoringMethod: "max", description: "Regulatory and legal obligations", escalationMatrix: { Low: "Compliance Officer", Medium: "Head of Compliance + CRO", High: "CRO + Legal Counsel", Critical: "Board of Directors via Regulatory Risk Register" } },
  { _id: "d-4", name: "Cybersecurity", organization: { _id: "o-2", name: "Wadjet Digital Ltd" }, status: "active", scoringMethod: "advanced", description: "Cyber threats and incidents", escalationMatrix: { Low: "IT Security Team", Medium: "CISO + IT Security", High: "CISO + CRO", Critical: "Board of Directors via Cyber Risk Committee" } },
  { _id: "d-5", name: "Third Party Risk", organization: { _id: "o-1", name: "Wadjet Bank Plc" }, status: "active", scoringMethod: "advanced", description: "Vendor and supplier exposure", escalationMatrix: { Low: "Vendor Manager", Medium: "Procurement Director + CRO", High: "CRO + Procurement", Critical: "Board of Directors via Third Party Risk Committee" } },
  { _id: "d-6", name: "Financial", organization: { _id: "o-3", name: "Wadjet Capital" }, status: "active", scoringMethod: "max", description: "Financial loss and liquidity", escalationMatrix: { Low: "Finance Manager", Medium: "CFO + CRO", High: "CFO + Board", Critical: "Board of Directors via Financial Risk Committee" } },
];

export const PARAMETERS = DOMAINS.map((d, i) => ({
  _id: `p-${i + 1}`,
  name: d.name,
  domain: { _id: d._id, name: d.name },
  description: `Risk methodology for ${d.name} domain`,
  status: "active",
  methodVersion: 1,
  scoringMethod: d.scoringMethod,
  impactMethod: d.scoringMethod === "max" ? "max" : "weighted",
  criteria: CRITERIA.map((c) => ({ name: c, weight: 0.125 })),
  riskScoreMethod: "multiplicative",
  riskScoreWeights: { likelihood: 0.5, impact: 0.5 },
  matrixLookupTable: null,
  thresholds: { ...THRESHOLDS },
  appetiteLimit: 8,
  toleranceLimit: 12,
  residualMethod: "overall_ce",
  maximumRiskReduction: 0.75,
  minResidualScore: 1,
  controlEffectivenessModel: {
    version: "CE-V1",
    factors: {
      design: 0.25,
      operating: 0.35,
      coverage: 0.25,
      testing: 0.15,
    },
  },
  controlEffectivenessWeights: {
    Effective: 0.75,
    "Partially Effective": 0.5,
    Ineffective: 0.25,
    "Not Assessed": 0,
  },
  recommendedControls: [],
  governanceRules: {
    justificationThreshold: 0.2,
    approvalThreshold: 0.4,
    minJustificationLength: 20,
    requireJustification: true,
    requireApproval: true,
  },
  createdBy: "admin",
  createdAt: daysAgo(200),
  updatedAt: daysAgo(30),
}));

export const levelOf = (score) => {
  const n = Number(score) || 0;
  if (n >= THRESHOLDS.critical) return "Critical";
  if (n >= THRESHOLDS.high) return "High";
  if (n >= THRESHOLDS.medium) return "Medium";
  return "Low";
};

const riskSeed = [
  ["R-001", "Unauthorised access to customer data", "Customer Onboarding", "KYC Verification", "Core Banking System", "Digital Banking", "Cybersecurity", "Insider or external attacker", "Weak access controls on admin consoles", 4, [5, 4, 3, 2, 2, 4, 4, 5], "Open", "Mitigate", "Head of IT Security", 30],
  ["R-002", "Phishing campaign targeting staff", "IT Operations", "Email Gateway", "Email Infrastructure", "IT Operations", "Human Risk", "Spear phishers", "Low security awareness", 4, [3, 3, 4, 2, 3, 3, 3, 4], "In Progress", "Mitigate", "CISO", 45],
  ["R-003", "Cloud misconfiguration exposure", "Cloud Services", "IaaS Provisioning", "Public Cloud Tenant", "Cloud Engineering", "Cloud Security", "Automated scanners", "Default security groups", 3, [4, 4, 3, 2, 4, 5, 4, 4], "Open", "Mitigate", "Head of Cloud", 60],
  ["R-004", "Third-party vendor data breach", "Procurement", "Vendor Management", "Payment Processor", "Procurement", "Third Party Risk", "Cybercriminals", "Insufficient vendor oversight", 4, [5, 5, 4, 3, 4, 4, 4, 5], "Open", "Transfer", "Procurement Director", 90],
  ["R-005", "Regulatory fine for AML gaps", "Compliance", "AML Monitoring", "Transaction Monitoring", "Compliance", "Compliance", "Regulator", "Outdated AML rules", 3, [5, 5, 4, 2, 4, 3, 3, 4], "Open", "Mitigate", "Head of Compliance", 75],
  ["R-006", "Core system outage during peak", "Operations", "Batch Processing", "Core Banking System", "Operations", "Business Continuity", "Infrastructure failure", "Single point of failure", 3, [5, 4, 4, 4, 5, 4, 4, 5], "Open", "Mitigate", "COO", 120],
  ["R-007", "Fraudulent wire transfers", "Payments", "Wire Transfers", "Payment Hub", "Retail Banking", "Cybersecurity / Fraud", "Organised fraud rings", "Weak transaction monitoring", 3, [5, 5, 4, 2, 4, 3, 3, 5], "In Progress", "Mitigate", "Head of Fraud", 30],
  ["R-008", "Ransomware infection", "IT Operations", "Endpoint Protection", "Endpoints", "IT Operations", "Cybersecurity", "Ransomware gangs", "Unpatched endpoints", 4, [5, 4, 5, 3, 5, 5, 4, 5], "Open", "Mitigate", "CISO", 15],
  ["R-009", "Data privacy complaint volume", "Compliance", "Data Subject Requests", "Privacy Portal", "Legal", "Compliance / Legal", "Customers / regulators", "Manual DSR process", 2, [3, 4, 3, 1, 3, 4, 4, 3], "Open", "Accept", "Data Protection Officer", 60],
  ["R-010", "Legacy application end-of-life", "Application Management", "Decommissioning", "Legacy Lending App", "IT Operations", "Application Security", "Technical debt", "Unsupported platform", 3, [4, 3, 3, 2, 4, 4, 4, 4], "Accepted", "Avoid", "Head of Applications", 180],
  ["R-011", "Business continuity plan untested", "Operations", "BCP Testing", "DR Site", "Operations", "Operational / BCP", "Regional disruption", "Stale BCP", 2, [4, 3, 3, 4, 4, 3, 3, 4], "Open", "Mitigate", "BCP Coordinator", 45],
  ["R-012", "AI model bias in credit scoring", "Risk Management", "Model Governance", "AI Scoring Engine", "Risk", "Emerging Technology / AI", "Model drift / bias", "No model validation", 3, [4, 5, 4, 2, 4, 4, 4, 4], "In Progress", "Mitigate", "Chief Risk Officer", 90],
  ["R-013", "Insider threat from privileged users", "IT Operations", "Privileged Access", "AD / PAM", "IT Operations", "Human Risk / Security Monitoring", "Disgruntled insider", "No privileged session monitoring", 3, [5, 4, 5, 3, 5, 5, 5, 5], "Open", "Mitigate", "Head of IT Security", 60],
  ["R-014", "Supplier concentration risk", "Procurement", "Supplier Diversification", "Cloud Provider", "Procurement", "Operational / Third Party", "Provider outage", "Single vendor dependency", 2, [4, 3, 3, 3, 4, 4, 3, 4], "Open", "Transfer", "Procurement Director", 120],
  ["R-015", "Card data interception in transit", "Payments", "Card Processing", "POS Gateway", "Retail Banking", "Physical Security / Fraud", "Network sniffing", "Legacy TLS", 2, [5, 4, 4, 2, 4, 5, 4, 4], "Closed", "Mitigate", "Head of Payments", 20],
  ["R-016", "Insider data exfiltration via USB", "IT Operations", "Endpoint Controls", "Endpoints", "IT Operations", "Information Security", "Malicious insider", "USB ports enabled", 3, [4, 3, 4, 2, 3, 5, 4, 3], "Closed", "Mitigate", "Head of IT Security", 40],
];

const RISK_DOMAIN_BY_CATEGORY = {
  Cybersecurity: "d-4",
  "Cybersecurity / Fraud": "d-4",
  "Cloud Security": "d-4",
  "Human Risk": "d-1",
  "Human Risk / Security Monitoring": "d-1",
  "Human Risk / Emerging Technology": "d-1",
  "Information Security": "d-1",
  "Application Security": "d-1",
  "Application Security / Mobile": "d-1",
  "Emerging Technology / AI": "d-1",
  Compliance: "d-3",
  "Compliance / Legal": "d-3",
  "Compliance / Cybersecurity": "d-3",
  "Business Continuity": "d-2",
  Operational: "d-2",
  "Operational / BCP": "d-2",
  "Operational / Third Party": "d-5",
  "Third Party Risk": "d-5",
  "Third Party Risk / Cybersecurity": "d-5",
  "Physical Security": "d-6",
  "Physical Security / Fraud": "d-6",
  "Risk Management": "d-6",
};

export const RISKS = riskSeed.map(([riskId, title, process, subProcess, assetSystem, ownerTeam, category, threat, vulnerability, likelihood, impacts, status, treatment, owner, deadlineDays], i) => {
  const impact = Math.max(...impacts);
  const riskScore = likelihood * impact;
  const residual = Math.max(1, riskScore - (status === "Closed" ? 8 : 2));
  const domainId = RISK_DOMAIN_BY_CATEGORY[category] || "d-4";
  const domain = DOMAINS.find((d) => d._id === domainId);
  const organization = domain?.organization || null;
  return {
    _id: `risk-${i + 1}`,
    riskId,
    title,
    process,
    subProcess,
    assetSystem,
    ownerTeam,
    category,
    threat,
    vulnerability,
    riskDate: daysAgo(200 - i * 9),
    owner,
    likelihood,
    impacts: impacts.map((value, j) => ({ name: CRITERIA[j], value })),
    impactScore: impact,
    riskScore,
    inherentLevel: levelOf(riskScore),
    residualScore: residual,
    residualLevel: levelOf(residual),
    severityLevel: levelOf(riskScore),
    domain: domain ? { _id: domain._id, name: domain.name } : null,
    organization,
    treatment,
    status,
    mitigationActions: "Implement compensating controls, monitor monthly and report to risk committee.",
    deadline: daysAhead(deadlineDays),
    asset: null,
    treatmentOwner: owner,
    treatmentDueDate: daysAhead(deadlineDays),
    treatmentEffectiveness: status === "Closed" ? "Effective" : "Partially Effective",
    createdAt: daysAgo(200 - i * 9),
    closedAt: status === "Closed" ? daysAgo(20) : null,
  };
});

export const ASSETS = [
  { _id: "a-1", name: "Core Banking System", type: "Application", owner: "IT Operations", location: "Primary DC", criticality: "Critical", status: "Operational", domain: "Information Security", organization: { _id: "o-1", name: "Wadjet Bank Plc" } },
  { _id: "a-2", name: "Mobile Banking App", type: "Application", owner: "Digital Banking", location: "Cloud", criticality: "Critical", status: "Operational", domain: "Cybersecurity", organization: { _id: "o-2", name: "Wadjet Digital Ltd" } },
  { _id: "a-3", name: "Customer Database", type: "Database", owner: "Data Office", location: "Primary DC", criticality: "Critical", status: "Operational", domain: "Information Security", organization: { _id: "o-1", name: "Wadjet Bank Plc" } },
  { _id: "a-4", name: "Email Gateway", type: "Infrastructure", owner: "IT Operations", location: "Secondary DC", criticality: "High", status: "Operational", domain: "Cybersecurity", organization: { _id: "o-2", name: "Wadjet Digital Ltd" } },
  { _id: "a-5", name: "Payment Hub", type: "Application", owner: "Payments", location: "Primary DC", criticality: "Critical", status: "Operational", domain: "Cybersecurity / Fraud", organization: { _id: "o-1", name: "Wadjet Bank Plc" } },
  { _id: "a-6", name: "Branch Network", type: "Infrastructure", owner: "Branch Operations", location: "Branches", criticality: "Medium", status: "Operational", domain: "Operational", organization: { _id: "o-1", name: "Wadjet Bank Plc" } },
  { _id: "a-7", name: "HR System", type: "Application", owner: "Human Resources", location: "Cloud", criticality: "High", status: "Operational", domain: "Human Risk", organization: { _id: "o-1", name: "Wadjet Bank Plc" } },
  { _id: "a-8", name: "AI Scoring Engine", type: "Application", owner: "Risk", location: "Cloud", criticality: "High", status: "In Deployment", domain: "Emerging Technology / AI", organization: { _id: "o-3", name: "Wadjet Capital" } },
];

export const ASSET_GROUPS = [
  { _id: "ag-1", name: "Core Banking", description: "Systems supporting core banking operations", status: "Active" },
  { _id: "ag-2", name: "Digital Channels", description: "Customer-facing digital channels", status: "Active" },
  { _id: "ag-3", name: "Payments Infrastructure", description: "Payment processing infrastructure", status: "Active" },
];

export const ORGANIZATIONS = [
  { _id: "o-1", orgId: "ORG-001", name: "Wadjet Bank Plc", type: "parent", region: "East Africa", industry: "Banking", status: "active", createdAt: daysAgo(400), description: "Parent holding entity" },
  { _id: "o-2", orgId: "ORG-002", name: "Wadjet Digital Ltd", type: "subsidiary", parentOrg: { _id: "o-1", name: "Wadjet Bank Plc" }, region: "East Africa", industry: "Fintech", status: "active", createdAt: daysAgo(300), description: "Digital banking subsidiary" },
  { _id: "o-3", orgId: "ORG-003", name: "Wadjet Capital", type: "subsidiary", parentOrg: { _id: "o-1", name: "Wadjet Bank Plc" }, region: "West Africa", industry: "Banking", status: "active", createdAt: daysAgo(250), description: "Capital markets arm" },
];

export const GROUPS = [
  { _id: "g-1", name: "IT Security Team", description: "Security operations group", status: "Active", members: ["u-admin", "u-officer"], notificationRules: [{ event: "risk.created", channel: "email" }] },
  { _id: "g-2", name: "Risk Committee", description: "Enterprise risk committee", status: "Active", members: ["u-admin", "u-manager"], notificationRules: [{ event: "risk.escalated", channel: "email" }] },
  { _id: "g-3", name: "Audit Team", description: "Internal audit group", status: "Active", members: ["u-auditor"], notificationRules: [] },
];

export const FRAMEWORKS = [
  { _id: "f-1", name: "ISO 27001:2022", version: "2022", status: "Active", description: "Information security management system" },
  { _id: "f-2", name: "ISO 27002:2022", version: "2022", status: "Active", description: "Information security controls guidance" },
  { _id: "f-3", name: "NIST CSF 2.0", version: "2.0", status: "Active", description: "Cybersecurity framework" },
  { _id: "f-4", name: "PCI DSS 4.0", version: "4.0", status: "Active", description: "Payment card industry data security standard" },
  { _id: "f-5", name: "CBE Cybersecurity Requirements", version: "2023", status: "Active", description: "Central Bank of Egypt cybersecurity regulations" },
  { _id: "f-6", name: "Internal Bank Policy", version: "1.0", status: "Active", description: "Bank internal security policies and procedures" },
];

// Framework mappings for each control (controlId -> [{frameworkId, annexCode}])
const CONTROL_FRAMEWORK_MAPPINGS = {
  "ORG-01": [{ fId: "f-1", annex: "A.5.1" }, { fId: "f-5", annex: "Section 3.1" }],
  "ORG-02": [{ fId: "f-1", annex: "A.5.15" }, { fId: "f-4", annex: "Req 7" }],
  "ORG-03": [{ fId: "f-1", annex: "A.5.1" }, { fId: "f-3", annex: "ID.RA" }],
  "ORG-04": [{ fId: "f-1", annex: "A.5.19" }, { fId: "f-5", annex: "Section 4.2" }],
  "ORG-05": [{ fId: "f-1", annex: "A.5.12" }, { fId: "f-4", annex: "Req 3" }],
  "ORG-06": [{ fId: "f-1", annex: "A.5.2" }, { fId: "f-5", annex: "Section 5.1" }],
  "ORG-07": [{ fId: "f-1", annex: "A.5.2" }, { fId: "f-5", annex: "Section 5.2" }],
  "PEO-01": [{ fId: "f-1", annex: "A.6.3" }, { fId: "f-5", annex: "Section 6.1" }],
  "PEO-02": [{ fId: "f-1", annex: "A.6.3" }, { fId: "f-3", annex: "PR.AT" }],
  "PEO-03": [{ fId: "f-1", annex: "A.6.1" }],
  "PEO-04": [{ fId: "f-1", annex: "A.6.2" }, { fId: "f-6", annex: "HR-001" }],
  "PEO-05": [{ fId: "f-1", annex: "A.6.3" }],
  "PHY-01": [{ fId: "f-1", annex: "A.7.1" }, { fId: "f-5", annex: "Section 7.1" }],
  "PHY-02": [{ fId: "f-1", annex: "A.7.4" }],
  "PHY-03": [{ fId: "f-1", annex: "A.7.2" }],
  "PHY-04": [{ fId: "f-1", annex: "A.7.1" }],
  "PHY-05": [{ fId: "f-1", annex: "A.7.1" }],
  "PHY-06": [{ fId: "f-1", annex: "A.7.1" }],
  "TECH-01": [{ fId: "f-1", annex: "A.8.5" }, { fId: "f-4", annex: "Req 8" }, { fId: "f-5", annex: "Section 8.1" }],
  "TECH-02": [{ fId: "f-1", annex: "A.8.2" }, { fId: "f-5", annex: "Section 8.2" }],
  "TECH-03": [{ fId: "f-1", annex: "A.8.3" }, { fId: "f-4", annex: "Req 7" }],
  "TECH-04": [{ fId: "f-1", annex: "A.8.8" }, { fId: "f-4", annex: "Req 11" }],
  "TECH-05": [{ fId: "f-1", annex: "A.8.2" }, { fId: "f-3", annex: "PR.AC" }],
  "TECH-06": [{ fId: "f-1", annex: "A.8.1" }, { fId: "f-3", annex: "DE.CM" }],
  "TECH-07": [{ fId: "f-1", annex: "A.8.1" }, { fId: "f-3", annex: "DE.CM" }],
  "TECH-08": [{ fId: "f-1", annex: "A.8.24" }, { fId: "f-4", annex: "Req 3" }],
  "TECH-09": [{ fId: "f-1", annex: "A.8.24" }, { fId: "f-4", annex: "Req 4" }],
  "TECH-10": [{ fId: "f-1", annex: "A.8.15" }, { fId: "f-3", annex: "DE.AE" }, { fId: "f-5", annex: "Section 8.3" }],
  "TECH-11": [{ fId: "f-1", annex: "A.8.14" }, { fId: "f-5", annex: "Section 8.4" }],
  "TECH-12": [{ fId: "f-1", annex: "A.8.8" }, { fId: "f-4", annex: "Req 6" }],
  "TECH-13": [{ fId: "f-1", annex: "A.8.5" }, { fId: "f-4", annex: "Req 8" }],
};

const controlSeed = [
  // === ADMINISTRATIVE CONTROLS ===
  ["ORG-01", "Information Security Policy", "f-1", "Administrative", "Preventive", "CISO", "Annually", "Active / Implemented", 100, 4, 90, 85, 95, 100, ["AST-001", "AST-002", "AST-003"]],
  ["ORG-02", "Access Control Policy", "f-1", "Administrative", "Preventive", "Head of IT Security", "Annually", "Active / Implemented", 100, 4, 95, 90, 100, 100, ["AST-001", "AST-003", "AST-004"]],
  ["ORG-03", "Risk Assessment Process", "f-1", "Administrative", "Preventive", "CISO", "Semi-Annual", "Active / Implemented", 100, 4, 85, 80, 90, 95, ["AST-001", "AST-002", "AST-004"]],
  ["ORG-04", "Supplier Security Assessment", "f-1", "Administrative", "Preventive", "Procurement Director", "Annually", "In Progress / Under Implementation", 65, 2, 70, 60, 75, 80, ["AST-005", "AST-006"]],
  ["ORG-05", "Data Classification Policy", "f-1", "Administrative", "Preventive", "Data Office", "Annually", "Active / Implemented", 100, 3, 80, 75, 85, 90, ["AST-004", "AST-005"]],
  ["ORG-06", "Business Continuity Policy", "f-1", "Administrative", "Corrective", "BCP Coordinator", "Annually", "Active / Implemented", 100, 3, 75, 70, 80, 85, ["AST-001", "AST-007"]],
  ["ORG-07", "Incident Response Policy", "f-1", "Administrative", "Corrective", "Head of IT Security", "Annually", "Active / Implemented", 100, 4, 90, 85, 95, 100, ["AST-001", "AST-002", "AST-003"]],

  // === ADMINISTRATIVE CONTROLS (PEOPLE) ===
  ["PEO-01", "Security Awareness Training", "f-1", "Administrative", "Preventive", "CISO", "Quarterly", "Active / Implemented", 100, 4, 90, 88, 95, 100, ["AST-003", "AST-008"]],
  ["PEO-02", "Phishing Simulation", "f-1", "Administrative", "Detective", "CISO", "Monthly", "Active / Implemented", 100, 3, 85, 80, 90, 95, ["AST-003", "AST-008"]],
  ["PEO-03", "Background Verification", "f-1", "Administrative", "Preventive", "HR Director", "At Hiring", "Active / Implemented", 100, 4, 95, 95, 100, 100, ["AST-003"]],
  ["PEO-04", "Joiner-Mover-Leaver Process", "f-1", "Administrative", "Preventive", "HR Director", "Continuous", "Active / Implemented", 100, 4, 90, 85, 100, 100, ["AST-003", "AST-005"]],
  ["PEO-05", "Privileged User Training", "f-1", "Administrative", "Preventive", "Head of IT Security", "Semi-Annual", "In Progress / Under Implementation", 45, 2, 70, 65, 80, 75, ["AST-001", "AST-003"]],

  // === PHYSICAL CONTROLS ===
  ["PHY-01", "Data Center Access Control", "f-1", "Physical", "Preventive", "Head of IT Security", "Continuous", "Active / Implemented", 100, 5, 95, 95, 100, 100, ["AST-001", "AST-007"]],
  ["PHY-02", "CCTV Surveillance", "f-1", "Physical", "Detective", "Security Manager", "Continuous", "Active / Implemented", 100, 4, 90, 90, 95, 100, ["AST-007"]],
  ["PHY-03", "Visitor Management", "f-1", "Physical", "Preventive", "Security Manager", "Continuous", "Active / Implemented", 100, 4, 85, 85, 100, 100, ["AST-007"]],
  ["PHY-04", "Fire Detection & Suppression", "f-1", "Physical", "Corrective", "Facilities Manager", "Quarterly", "Active / Implemented", 100, 4, 95, 95, 100, 100, ["AST-007"]],
  ["PHY-05", "UPS & Generator", "f-1", "Physical", "Corrective", "Facilities Manager", "Monthly", "Active / Implemented", 100, 4, 90, 90, 100, 100, ["AST-007"]],
  ["PHY-06", "Environmental Monitoring", "f-1", "Physical", "Detective", "Facilities Manager", "Continuous", "In Progress / Under Implementation", 80, 3, 85, 80, 90, 95, ["AST-007"]],

  // === TECHNICAL CONTROLS ===
  ["TECH-01", "Multi-Factor Authentication (MFA)", "f-1", "Technical", "Preventive", "Head of IT Security", "Continuous", "Active / Implemented", 100, 4, 90, 85, 92, 100, ["AST-001", "AST-003", "AST-008"]],
  ["TECH-02", "Privileged Access Management (PAM)", "f-1", "Technical", "Preventive", "Head of IT Security", "Continuous", "In Progress / Under Implementation", 85, 3, 85, 80, 85, 90, ["AST-001", "AST-003", "AST-004"]],
  ["TECH-03", "Role-Based Access Control (RBAC)", "f-1", "Technical", "Preventive", "Head of IT Security", "Quarterly", "Active / Implemented", 100, 4, 90, 88, 95, 100, ["AST-003", "AST-004", "AST-005"]],
  ["TECH-04", "Vulnerability Management", "f-1", "Technical", "Detective", "CISO", "Monthly", "In Progress / Under Implementation", 75, 3, 80, 75, 85, 90, ["AST-001", "AST-002", "AST-004", "AST-007"]],
  ["TECH-05", "Firewall", "f-1", "Technical", "Preventive", "Head of IT Security", "Quarterly", "Active / Implemented", 100, 4, 95, 90, 100, 100, ["AST-001", "AST-002"]],
  ["TECH-06", "Intrusion Detection System (IDS)", "f-1", "Technical", "Detective", "CISO", "Continuous", "Active / Implemented", 100, 4, 85, 85, 90, 95, ["AST-001", "AST-002"]],
  ["TECH-07", "Endpoint Detection & Response (EDR)", "f-1", "Technical", "Detective", "Head of IT Security", "Continuous", "In Progress / Under Implementation", 70, 3, 80, 78, 88, 90, ["AST-008"]],
  ["TECH-08", "Data Encryption at Rest", "f-1", "Technical", "Preventive", "Head of IT Security", "Continuous", "Active / Implemented", 100, 4, 90, 90, 95, 100, ["AST-004", "AST-005"]],
  ["TECH-09", "Data Encryption in Transit", "f-1", "Technical", "Preventive", "Head of IT Security", "Continuous", "Active / Implemented", 100, 4, 95, 95, 100, 100, ["AST-001", "AST-002", "AST-006"]],
  ["TECH-10", "Security Information & Event Management (SIEM)", "f-1", "Technical", "Detective", "CISO", "Continuous", "Active / Implemented", 100, 4, 85, 82, 90, 95, ["AST-001", "AST-002", "AST-004"]],
  ["TECH-11", "Backup & Recovery", "f-1", "Technical", "Corrective", "Head of IT Security", "Daily", "Active / Implemented", 100, 4, 90, 88, 95, 100, ["AST-004", "AST-005", "AST-007"]],
  ["TECH-12", "Patch Management", "f-1", "Technical", "Preventive", "Head of IT Security", "Weekly", "In Progress / Under Implementation", 60, 3, 80, 75, 85, 90, ["AST-001", "AST-002", "AST-007"]],
  ["TECH-13", "Multi-Factor Authentication (MFA)", "f-3", "Technical", "Preventive", "Head of Payments", "Continuous", "Active / Implemented", 100, 5, 95, 92, 100, 100, ["AST-006"]],
];

const ANNEX = {
  "ORG-01": "A.5.1", "ORG-02": "A.5.15", "ORG-03": "A.5.1", "ORG-04": "A.5.19", "ORG-05": "A.5.12", "ORG-06": "A.5.2", "ORG-07": "A.5.2",
  "PEO-01": "A.6.3", "PEO-02": "A.6.3", "PEO-03": "A.6.1", "PEO-04": "A.6.2", "PEO-05": "A.6.3",
  "PHY-01": "A.7.1", "PHY-02": "A.7.4", "PHY-03": "A.7.2", "PHY-04": "A.7.1", "PHY-05": "A.7.1", "PHY-06": "A.7.1",
  "TECH-01": "A.8.5", "TECH-02": "A.8.2", "TECH-03": "A.8.3", "TECH-04": "A.8.8", "TECH-05": "A.8.2",
  "TECH-06": "A.8.1", "TECH-07": "A.8.1", "TECH-08": "A.8.24", "TECH-09": "A.8.24", "TECH-10": "A.8.15",
  "TECH-11": "A.8.14", "TECH-12": "A.8.8", "TECH-13": "A.8.5",
};

export const CONTROLS = controlSeed.map(([controlId, name, fId, domain, controlType, owner, testingFrequency, status, progress, maturityLevel, designEff, operatingEff, coverage, testingResult, targetAssets], i) => {
  const fw = FRAMEWORKS.find((f) => f._id === fId);
  const overallEff = Math.round((designEff * 0.25) + (operatingEff * 0.35) + (coverage * 0.25) + (testingResult * 0.15));
  const mappings = (CONTROL_FRAMEWORK_MAPPINGS[controlId] || []).map(m => {
    const mFw = FRAMEWORKS.find((f) => f._id === m.fId);
    return { framework: { _id: mFw?._id, name: mFw?.name }, requirement: m.annex };
  });
  return {
    _id: `c-${i + 1}`,
    controlId,
    annexCode: ANNEX[controlId] || null,
    name,
    description: `${controlType} control for ${domain} domain — ${name}.`,
    category: domain,
    domain,
    controlType,
    owner,
    testingFrequency,
    status,
    progress,
    maturityLevel,
    targetAssets: targetAssets || [],
    effectiveness: {
      design: designEff,
      operating: operatingEff,
      coverage: coverage,
      testing: testingResult,
      overall: overallEff,
    },
    framework: { _id: fw._id, name: fw.name },
    frameworkMappings: mappings.length > 0 ? mappings : [{ framework: { _id: fw._id, name: fw.name }, requirement: ANNEX[controlId] || null }],
    lastTestedAt: daysAgo(60 - i * 3),
    nextTestDueAt: i % 3 === 0 ? daysAgo(10) : daysAhead(30 + i * 10),
    createdAt: daysAgo(200 - i * 3),
    evidence: [],
    assessments: [],
  };
});

export const LINKS = [];
// Risk-treatment records are kept separately from risk/control links so that a
// treatment plan retains its approval, ownership and progress audit trail.
export const RISK_TREATMENTS = [];
export const TREATMENT_CONTROLS = [];
export const TREATMENT_ACTIONS = [];
export const TREATMENT_EVIDENCE = [];
export const TREATMENT_AUDIT_EVENTS = [];

export const GAPS = [
  { _id: "g-1", gapId: "G-001", description: "No formal supplier security assessment program", control: { _id: "c-3", name: "Supplier security assessment" }, severity: "High", owner: "Procurement Director", dueDate: daysAhead(45), status: "Open", createdAt: daysAgo(30) },
  { _id: "g-2", gapId: "G-002", description: "Recovery plan not tested in last 18 months", control: { _id: "c-8", name: "Recovery plan testing" }, severity: "Critical", owner: "BCP Coordinator", dueDate: daysAgo(5), status: "In Progress", createdAt: daysAgo(60) },
  { _id: "g-3", gapId: "G-003", description: "Cardholder data access not fully restricted", control: { _id: "c-11", name: "Access restriction to cardholder data" }, severity: "High", owner: "Head of Payments", dueDate: daysAhead(30), status: "Open", createdAt: daysAgo(20) },
  { _id: "g-4", gapId: "G-004", description: "Incident response playbook outdated", control: { _id: "c-7", name: "Incident response playbook" }, severity: "Medium", owner: "Head of IT Security", dueDate: daysAhead(60), status: "Open", createdAt: daysAgo(10) },
  { _id: "g-5", gapId: "G-005", description: "Vulnerability scan coverage incomplete", control: { _id: "c-2", name: "Vulnerability management" }, severity: "Medium", owner: "CISO", dueDate: daysAhead(20), status: "In Progress", createdAt: daysAgo(15) },
  { _id: "g-6", gapId: "G-006", description: "Legacy TLS on payment gateway", control: { _id: "c-9", name: "Encryption of cardholder data" }, severity: "High", owner: "Head of Payments", dueDate: daysAgo(12), status: "Closed", createdAt: daysAgo(90) },
];

export const CAMPAIGNS = [
  {
    _id: "cmp-1", name: "Q3 ISO 27001 Control Self-Assessment", status: "Active", frameworkIds: ["f-1"], domainFilter: "", startDate: daysAgo(20), dueDate: daysAhead(10), assignedOwners: ["Head of IT Security", "CISO", "Procurement Director"], reminderSchedule: ["t-7d", "t-1d"], completionPercent: 62,
    responses: [
      { _id: "rsp-1", controlId: "c-1", owner: "Head of IT Security", status: "Submitted", result: "Pass", updatedAt: daysAgo(5), comments: "Policy updated and approved." },
      { _id: "rsp-2", controlId: "c-2", owner: "CISO", status: "In Progress", result: "Partial", updatedAt: daysAgo(3), comments: "" },
      { _id: "rsp-3", controlId: "c-3", owner: "Procurement Director", status: "Not Started", result: null, updatedAt: null, comments: "" },
    ],
  },
  {
    _id: "cmp-2", name: "PCI DSS 4.0 Annual Assessment", status: "Draft", frameworkIds: ["f-3"], domainFilter: "Cybersecurity", startDate: daysAhead(5), dueDate: daysAhead(60), assignedOwners: ["Head of Payments", "CISO"], reminderSchedule: ["t-7d"], completionPercent: 0,
    responses: [
      { _id: "rsp-4", controlId: "c-9", owner: "Head of Payments", status: "Not Started", result: null, updatedAt: null, comments: "" },
      { _id: "rsp-5", controlId: "c-11", owner: "Head of Payments", status: "Not Started", result: null, updatedAt: null, comments: "" },
    ],
  },
];

export const CROSSWALKS = [
  { _id: "cw-1", sourceControl: { _id: "c-1", name: "Access control policy" }, sourceFramework: "ISO 27001:2022", targetFramework: "f-2", targetControl: { _id: "c-5", name: "Asset inventory and classification" }, mappingType: "Equivalent" },
  { _id: "cw-2", sourceControl: { _id: "c-2", name: "Vulnerability management" }, sourceFramework: "ISO 27001:2022", targetFramework: "f-2", targetControl: { _id: "c-6", name: "Continuous monitoring" }, mappingType: "Partial" },
  { _id: "cw-3", sourceControl: { _id: "c-9", name: "Encryption of cardholder data" }, sourceFramework: "NIST CSF 2.0", targetFramework: "f-3", targetControl: { _id: "c-9", name: "Encryption of cardholder data" }, mappingType: "Equivalent" },
];

export const POLICIES = [
  { _id: "pol-1", policyId: "POL-001", title: "Information Security Policy", description: "Enterprise information security framework", category: "Information Security", classification: "Internal", version: "3.2", content: "This policy establishes the enterprise information security framework...", tags: ["security", "iso27001"], status: "Published", owner: "CISO", ownerUserId: "u-admin", department: "IT", effectiveDate: daysAgo(120), expirationDate: daysAhead(700), reviewPeriodDays: 365, nextReviewDate: daysAhead(245), createdAt: daysAgo(400), updatedAt: daysAgo(10) },
  { _id: "pol-2", policyId: "POL-002", title: "Data Privacy Policy", description: "Handling of personal data", category: "Data Privacy", classification: "Internal", version: "2.1", content: "This policy governs the collection and processing of personal data...", tags: ["privacy", "gdpr"], status: "Review", owner: "Data Protection Officer", ownerUserId: "u-officer", department: "Legal", effectiveDate: daysAgo(200), expirationDate: daysAhead(400), reviewPeriodDays: 365, nextReviewDate: daysAgo(15), createdAt: daysAgo(500), updatedAt: daysAgo(16) },
  { _id: "pol-3", policyId: "POL-003", title: "Acceptable Use Policy", description: "Acceptable use of company assets", category: "IT", classification: "Internal", version: "1.8", content: "Users must use company systems for authorised business purposes...", tags: ["aup", "users"], status: "Published", owner: "Head of IT Security", ownerUserId: "u-admin", department: "IT", effectiveDate: daysAgo(300), expirationDate: daysAhead(65), reviewPeriodDays: 365, nextReviewDate: daysAgo(5), createdAt: daysAgo(600), updatedAt: daysAgo(7) },
  { _id: "pol-4", policyId: "POL-004", title: "Incident Response Policy", description: "Security incident handling", category: "Information Security", classification: "Internal", version: "2.0", content: "All security incidents must be reported to the SOC within 30 minutes...", tags: ["incident", "soc"], status: "Approval", owner: "CISO", ownerUserId: "u-admin", department: "IT", effectiveDate: null, expirationDate: null, reviewPeriodDays: 365, nextReviewDate: null, createdAt: daysAgo(30), updatedAt: daysAgo(2) },
  { _id: "pol-5", policyId: "POL-005", title: "Third-Party Risk Management Policy", description: "Vendor due diligence", category: "Third-Party", classification: "Internal", version: "1.3", content: "All vendors with access to bank data must complete due diligence...", tags: ["vendor", "tprm"], status: "Draft", owner: "Procurement Director", ownerUserId: "u-manager", department: "Procurement", effectiveDate: null, expirationDate: null, reviewPeriodDays: 365, nextReviewDate: null, createdAt: daysAgo(12), updatedAt: daysAgo(1) },
  { _id: "pol-6", policyId: "POL-006", title: "Business Continuity Policy", description: "BCP framework and disaster recovery", category: "Operational", classification: "Internal", version: "1.0", content: "The organization shall maintain business continuity plans...", tags: ["bcp", "dr"], status: "Review", owner: "CISO", ownerUserId: "u-admin", department: "IT", effectiveDate: null, expirationDate: null, reviewPeriodDays: 365, nextReviewDate: null, createdAt: daysAgo(10), updatedAt: daysAgo(1) },
  { _id: "pol-7", policyId: "POL-007", title: "Access Control Policy", description: "User access management and privileged accounts", category: "Information Security", classification: "Internal", version: "2.0", content: "Access to systems shall be granted based on least privilege principle...", tags: ["access", "privilege"], status: "Approval", owner: "IT Security Manager", ownerUserId: "u-manager", department: "IT", effectiveDate: null, expirationDate: null, reviewPeriodDays: 365, nextReviewDate: null, createdAt: daysAgo(17), updatedAt: daysAgo(2) },
  { _id: "pol-8", policyId: "POL-008", title: "Data Classification Policy", description: "Data classification and handling requirements", category: "Data Privacy", classification: "Internal", version: "1.0", content: "All data shall be classified according to sensitivity levels...", tags: ["data", "classification"], status: "Published", owner: "Data Protection Officer", ownerUserId: "u-officer", department: "Legal", effectiveDate: daysAhead(10), expirationDate: daysAhead(375), reviewPeriodDays: 365, nextReviewDate: null, createdAt: daysAgo(4), updatedAt: daysAgo(1) },
  { _id: "pol-9", policyId: "POL-009", title: "Legacy Password Policy", description: "Password requirements (deprecated)", category: "Information Security", classification: "Internal", version: "1.0", content: "Passwords must be at least 8 characters...", tags: ["password", "legacy"], status: "Expired", owner: "CISO", ownerUserId: "u-admin", department: "IT", effectiveDate: daysAgo(1090), expirationDate: daysAgo(200), reviewPeriodDays: 365, nextReviewDate: daysAgo(730), createdAt: daysAgo(1200), updatedAt: daysAgo(200) },
  { _id: "pol-10", policyId: "POL-010", title: "Outdated IT Security Policy", description: "Replaced by Information Security Policy", category: "Information Security", classification: "Internal", version: "1.0", content: "This policy has been archived...", tags: ["legacy", "archived"], status: "Archived", owner: "CISO", ownerUserId: "u-admin", department: "IT", effectiveDate: daysAgo(900), expirationDate: daysAgo(400), reviewPeriodDays: 365, nextReviewDate: daysAgo(500), createdAt: daysAgo(1000), updatedAt: daysAgo(400) },
];

export const EXCEPTIONS = [
  { _id: "exc-1", title: "Legacy TLS on payment gateway", description: "Temporary exception pending TLS 1.3 migration", status: "Pending", exceptionType: "Technical", owner: "Head of Payments", expiryDate: daysAhead(30), createdAt: daysAgo(5) },
  { _id: "exc-2", title: "USB ports on branch terminals", description: "Exception for card reader terminals", status: "Approved", exceptionType: "Operational", owner: "Branch Operations", expiryDate: daysAhead(90), createdAt: daysAgo(40) },
  { _id: "exc-3", title: "Shared service account", description: "Legacy shared account for batch jobs", status: "Expired", exceptionType: "Technical", owner: "IT Operations", expiryDate: daysAgo(10), createdAt: daysAgo(200) },
  { _id: "exc-4", title: "Vendor remote access", description: "Remote access for payment vendor support", status: "Approved", exceptionType: "Third-Party", owner: "Procurement Director", expiryDate: daysAhead(15), createdAt: daysAgo(60) },
];

export const DOCUMENTS = [
  { _id: "doc-1", title: "Risk Management Framework", category: "Framework", status: "Published", owner: "Chief Risk Officer", version: "2.0", uploadedAt: daysAgo(90) },
  { _id: "doc-2", title: "BCP Manual", category: "Procedure", status: "Draft", owner: "BCP Coordinator", version: "1.4", uploadedAt: daysAgo(20) },
  { _id: "doc-3", title: "Access Review Process", category: "Procedure", status: "Published", owner: "Head of IT Security", version: "1.1", uploadedAt: daysAgo(150) },
];

export const MANAGEMENT_REVIEWS = [
  { _id: "mr-1", risk: "risk-4", reviewer: "admin", decision: "mitigate", reviewDate: daysAgo(20), nextReviewDate: daysAhead(160), notes: "Treatment plan approved for the residual above appetite; compensating controls tracked in the POAM." },
  { _id: "mr-2", risk: "risk-8", reviewer: "auditor", decision: "defer", reviewDate: daysAgo(5), nextReviewDate: daysAhead(175), notes: "Deferred to the Q3 committee; interim monitoring agreed with the risk owner." },
];

export const POAM = [
  { _id: "poam-1", title: "Deploy privileged access management", description: "Implement PAM for admin consoles", status: "In Progress", owner: "Head of IT Security", dueDate: daysAhead(60), riskId: "R-013" },
  { _id: "poam-2", title: "Patch management automation", description: "Automate endpoint patching", status: "Planned", owner: "IT Operations", dueDate: daysAhead(90), riskId: "R-008" },
  { _id: "poam-3", title: "Vendor assessment program", description: "Annual vendor security assessments", status: "Closed", owner: "Procurement Director", dueDate: daysAgo(10), riskId: "R-004" },
];

export const QUESTIONNAIRES = [
  {
    _id: "q-1", title: "Information Security Baseline", description: "Standard security assessment questionnaire", status: "active", version: "1.0", owner: "CISO", createdAt: daysAgo(120),
    sections: [
      { id: "sec-1", title: "Access Control", questions: [{ id: "qu-1", text: "Is access reviewed quarterly?", type: "yesno" }, { id: "qu-2", text: "Is MFA enforced for admin access?", type: "yesno" }] },
      { id: "sec-2", title: "Incident Management", questions: [{ id: "qu-3", text: "Is there a documented incident response plan?", type: "yesno" }, { id: "qu-4", text: "Are incidents reported to the board?", type: "yesno" }] },
    ],
  },
  {
    _id: "q-2", title: "Data Privacy Assessment", description: "Privacy controls assessment", status: "active", version: "1.1", owner: "Data Protection Officer", createdAt: daysAgo(80),
    sections: [
      { id: "sec-1", title: "Data Handling", questions: [{ id: "qu-1", text: "Is personal data minimised?", type: "yesno" }, { id: "qu-2", text: "Are DSARs processed within 30 days?", type: "yesno" }] },
    ],
  },
];

export const ASSESSMENTS = [
  { _id: "as-1", title: "ISO 27001 Readiness Assessment", status: "In Progress", questionnaire: { _id: "q-1", title: "Information Security Baseline" }, domain: { _id: "d-1", name: "Information Security" }, asset: { _id: "a-1", name: "Core Banking System" }, organization: { _id: "o-1", name: "Wadjet Bank Plc" }, respondent: { _id: "u-officer", fullName: "Owen Fischer" }, dueDate: daysAhead(30), startedAt: daysAgo(10), completedAt: null, risks: [], approvals: [] },
  { _id: "as-2", title: "Mobile Banking App Security Review", status: "Completed", questionnaire: { _id: "q-1", title: "Information Security Baseline" }, domain: { _id: "d-4", name: "Cybersecurity" }, asset: { _id: "a-2", name: "Mobile Banking App" }, organization: { _id: "o-2", name: "Wadjet Digital Ltd" }, respondent: { _id: "u-analyst", fullName: "Ana Lyte" }, dueDate: daysAgo(5), startedAt: daysAgo(60), completedAt: daysAgo(3), risks: [], approvals: [] },
  { _id: "as-3", title: "Vendor Payment Processor Review", status: "Draft", questionnaire: { _id: "q-2", title: "Data Privacy Assessment" }, domain: { _id: "d-5", name: "Third Party Risk" }, asset: null, organization: { _id: "o-1", name: "Wadjet Bank Plc" }, respondent: { _id: "u-manager", fullName: "Morgan Lee" }, dueDate: daysAhead(45), startedAt: null, completedAt: null, risks: [], approvals: [] },
];

export const RESPONSES = [
  { _id: "res-1", questionnaire: { _id: "q-1", title: "Information Security Baseline" }, respondent: { _id: "u-officer", fullName: "Owen Fischer" }, status: "In Progress", answers: [{ questionId: "qu-1", answer: "Yes" }, { questionId: "qu-2", answer: "" }], submittedAt: null },
];

export const THIRD_PARTY = [
  { _id: "tp-1", name: "CloudPay Processing Ltd", category: "Payment Processor", status: "Active", riskRating: "High", owner: "Procurement Director", contractStart: daysAgo(400), contractEnd: daysAhead(600), findings: [], assessments: [], documents: [] },
  { _id: "tp-2", name: "DataCloud Hosting Inc", category: "Cloud Provider", status: "Active", riskRating: "Medium", owner: "Head of Cloud", contractStart: daysAgo(300), contractEnd: daysAhead(400), findings: [], assessments: [], documents: [] },
];

export const COMMITTEES = [
  { _id: "cm-1", name: "Risk Committee", status: "Active", mandate: "Oversee enterprise risk", frequency: "Quarterly", chair: "Chief Risk Officer", createdAt: daysAgo(500), members: [{ _id: "cm-m1", user: { _id: "u-admin", fullName: "System Administrator", username: "admin", email: "admin@wadjet.local" }, memberRole: "Chair" }, { _id: "cm-m2", user: { _id: "u-manager", fullName: "Morgan Lee", username: "manager", email: "manager@wadjet.local" }, memberRole: "Member" }] },
  { _id: "cm-2", name: "Audit Committee", status: "Active", mandate: "Oversee internal audit", frequency: "Quarterly", chair: "Head of Audit", createdAt: daysAgo(450), members: [{ _id: "cm-m3", user: { _id: "u-auditor", fullName: "Audrey Tor", username: "auditor", email: "auditor@wadjet.local" }, memberRole: "Chair" }] },
  { _id: "cm-3", name: "IT Steering Committee", status: "Active", mandate: "Approve IT investments", frequency: "Monthly", chair: "CIO", createdAt: daysAgo(350), members: [] },
];

export const EXCEPTION_TYPES = [
  { _id: "et-1", name: "Technical", description: "Technical control deviations", defaultExpiryDays: 90, status: "Active" },
  { _id: "et-2", name: "Operational", description: "Operational process deviations", defaultExpiryDays: 60, status: "Active" },
  { _id: "et-3", name: "Third-Party", description: "Vendor-related deviations", defaultExpiryDays: 45, status: "Active" },
];

export const AUDIT_ENGAGEMENTS = [
  { _id: "ae-1", auditId: "A-2026-01", title: "Core Banking System General Controls Review", auditType: "IT", entity: { _id: "o-1", name: "Wadjet Bank Plc" }, auditee: "IT Operations", leadAuditor: { _id: "u-auditor", fullName: "Audrey Tor", username: "auditor" }, plannedStart: daysAgo(30), plannedEnd: daysAhead(20), stage: "Fieldwork", progressPercent: 55, overallRating: null, status: "In Progress", scope: "Access controls, change management, backup" },
  { _id: "ae-2", auditId: "A-2026-02", title: "Third-Party Vendor Management Audit", auditType: "Compliance", entity: { _id: "o-2", name: "Wadjet Digital Ltd" }, auditee: "Procurement", leadAuditor: { _id: "u-auditor", fullName: "Audrey Tor", username: "auditor" }, plannedStart: daysAgo(10), plannedEnd: daysAhead(40), stage: "Planning", progressPercent: 10, overallRating: null, status: "In Progress", scope: "Vendor due diligence, contracts, monitoring" },
  { _id: "ae-3", auditId: "A-2025-06", title: "Information Security Annual Audit", auditType: "Internal", entity: { _id: "o-1", name: "Wadjet Bank Plc" }, auditee: "IT", leadAuditor: { _id: "u-auditor", fullName: "Audrey Tor", username: "auditor" }, plannedStart: daysAgo(120), plannedEnd: daysAgo(30), stage: "Closed", progressPercent: 100, overallRating: "Satisfactory", status: "Completed", scope: "ISMS controls" },
];

export const AUDIT_UNIVERSE = [
  { _id: "au-1", name: "Core Banking System", type: "IT", riskRating: "High", lastAuditedAt: daysAgo(30), nextAuditDue: daysAhead(150), status: "Scheduled" },
  { _id: "au-2", name: "Procurement & Vendor Management", type: "Business Process", riskRating: "High", lastAuditedAt: daysAgo(200), nextAuditDue: daysAhead(30), status: "Due" },
  { _id: "au-3", name: "Retail Banking Operations", type: "Business Unit", riskRating: "Medium", lastAuditedAt: daysAgo(120), nextAuditDue: daysAhead(180), status: "Scheduled" },
  { _id: "au-4", name: "AML Compliance Function", type: "Business Process", riskRating: "Critical", lastAuditedAt: daysAgo(240), nextAuditDue: daysAgo(20), status: "Overdue" },
];

export const AUDIT_PROCEDURES = [
  { _id: "ap-1", code: "P-001", title: "Verify access reviews performed quarterly", type: "Test", status: "Open", owner: "IT Operations", dueDate: daysAhead(15), result: null },
  { _id: "ap-2", code: "P-002", title: "Review change management tickets", type: "Sampling", status: "In Progress", owner: "IT Operations", dueDate: daysAhead(10), result: null },
];

export const AUDIT_FINDINGS = [
  { _id: "af-1", findingId: "F-2026-01", title: "Privileged access not reviewed for 6 months", severity: "High", status: "Open", owner: "Head of IT Security", dueDate: daysAhead(45), description: "Monthly privileged access reviews not performed since January." },
  { _id: "af-2", findingId: "F-2026-02", title: "Backup restoration not tested", severity: "Medium", status: "In Progress", owner: "IT Operations", dueDate: daysAhead(30), description: "No restoration test performed in the last 12 months." },
  { _id: "af-3", findingId: "F-2025-11", title: "Vendor contracts missing SLA clauses", severity: "High", status: "Closed", owner: "Procurement Director", dueDate: daysAgo(30), description: "Three vendor contracts lacked SLA provisions." },
];

export const AUDIT_CAPAS = [
  { _id: "ac-1", title: "Reinstate monthly privileged access reviews", status: "In Progress", owner: "Head of IT Security", dueDate: daysAhead(45), verificationComments: "", verifiedBy: null },
  { _id: "ac-2", title: "Quarterly backup restoration tests", status: "Open", owner: "IT Operations", dueDate: daysAhead(60), verificationComments: "", verifiedBy: null },
];

export const AUDIT_REPORTS = [
  { _id: "ar-1", title: "Draft audit report — Core Banking", status: "Draft", version: "0.1", createdAt: daysAgo(5), updatedAt: daysAgo(2) },
];

export const EMAIL_CONFIG = { smtpHost: "", smtpPort: 587, smtpUser: "", smtpAppPassword: "", fromEmail: "", fromName: "Wadjet GRC", secure: false, enabled: false };

export const EMAIL_MESSAGES = [
  { _id: "em-1", to: "risk-committee@wadjet.local", subject: "Q3 Risk Committee pack", body: "Please find the Q3 risk pack attached.", status: "Draft", attachments: [], scheduledAt: null, createdAt: daysAgo(2) },
  { _id: "em-2", to: "admin@wadjet.local", subject: "Campaign due reminder", body: "The ISO self-assessment campaign is due Friday.", status: "Sent", attachments: [], scheduledAt: null, createdAt: daysAgo(4) },
];

export const BACKUP_CONFIG = { enabled: true, frequency: "daily", retentionDays: 30, location: "s3://wadjet-backups", lastRunAt: daysAgo(1) };

export const BACKUP_RECORDS = [
  { _id: "bk-1", filename: "wadjet-grc-2026-08-19.zip", size: "24.1 MB", status: "Completed", createdAt: daysAgo(1) },
  { _id: "bk-2", filename: "wadjet-grc-2026-08-18.zip", size: "23.8 MB", status: "Completed", createdAt: daysAgo(2) },
];

export const DOCUMENT_PROGRAM = { autoVersioning: true, approvalWorkflow: true, reviewReminders: true, reminderDays: 30, retentionYears: 7 };
