/**
 * WADJET GRC — Report Definitions Registry
 * 
 * ALL platform reports registered via registerReport().
 * Each report covers the FULL data model — no field left behind.
 * Status/Severity columns use colorColumns for visual coding.
 */

import { registerReport } from "./reportsEngine.js";
import {
  COMPLIANCE_FRAMEWORKS, COMPLIANCE_REQUIREMENTS, COMPLIANCE_GAPS,
  COMPLIANCE_EVIDENCE, COMPLIANCE_REMEDIATION,
  COMPLIANCE_FINDINGS, COMPLIANCE_CONTROLS, COMPLIANCE_POLICIES,
  COMPLIANCE_RISKS, COMPLIANCE_ASSETS,
} from "../compliance-data.js";
import {
  RISKS, ASSETS, ASSET_GROUPS, POAM, AUDIT_FINDINGS, AUDIT_ENGAGEMENTS,
  AUDIT_CAPAS, AUDIT_PROCEDURES, AUDIT_UNIVERSE, CONTROLS, GAPS,
  FRAMEWORKS, POLICIES, EXCEPTIONS, EXCEPTION_TYPES, COMMITTEES,
  ROLES, USERS, ORGANIZATIONS, GROUPS, MANAGEMENT_REVIEWS,
  RISK_TREATMENTS, TREATMENT_CONTROLS, TREATMENT_ACTIONS, TREATMENT_EVIDENCE,
} from "../mock-data.mjs";
import {
  GOVERNANCE_AUDIT_LOG, POLICY_VERSIONS, POLICY_ACKNOWLEDGEMENTS,
  COMMITTEE_MEETINGS, COMMITTEE_DECISIONS, COMMITTEE_ACTIONS,
} from "../governance-data.js";
import { getCrossMappings } from "./crossMappingAgent.js";

const fwName = (fwId) => COMPLIANCE_FRAMEWORKS.find((f) => f._id === fwId)?.name || fwId;
const fwNameMain = (fwId) => FRAMEWORKS.find((f) => f._id === fwId)?.name || fwId;
const policyName = (pId) => POLICIES.find((p) => p._id === pId)?.title || pId;
const userName = (uId) => USERS.find((u) => u._id === uId)?.fullName || uId;

// ══════════════════════════════════════════════
// COMPLIANCE REPORTS
// ══════════════════════════════════════════════

registerReport({
  id: "compliance_summary",
  name: "Compliance Executive Summary",
  module: "compliance",
  description: "Overall compliance posture with KPIs and framework coverage",
  icon: "ShieldCheck",
  isDashboard: true,
  supportedFormats: ["xlsx", "pdf"],
  columns: [
    { key: "name", header: "Framework" },
    { key: "score", header: "Score", format: "percent" },
  ],
  dataSource: async () => {
    const score = (reqs) => {
      const scored = reqs.filter((r) => r.status !== "NotApplicable" && r.status !== "NotAssessed");
      if (!scored.length) return 0;
      const pts = { Compliant: 100, PartiallyCompliant: 50, NonCompliant: 0 };
      return Math.round(scored.reduce((s, r) => s + (pts[r.status] ?? 0), 0) / scored.length);
    };
    return COMPLIANCE_FRAMEWORKS.map((f) => ({
      name: f.name,
      score: score(COMPLIANCE_REQUIREMENTS.filter((r) => r.frameworkId === f._id)),
    }));
  },
});

registerReport({
  id: "compliance_requirements",
  name: "Requirements Detail Report",
  module: "compliance",
  description: "All requirements with status, mappings, and evidence",
  icon: "ClipboardList",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["status"],
  columns: [
    { key: "code", header: "Code" },
    { key: "title", header: "Title" },
    { key: "framework", header: "Framework" },
    { key: "category", header: "Category" },
    { key: "status", header: "Status" },
    { key: "criticality", header: "Criticality" },
    { key: "owner", header: "Owner" },
    { key: "applicability", header: "Applicability" },
  ],
  dataSource: async () =>
    COMPLIANCE_REQUIREMENTS.map((r) => ({
      code: r.code,
      title: r.title,
      framework: fwName(r.frameworkId),
      category: r.category,
      status: r.status,
      criticality: r.criticality || "—",
      owner: r.owner || "—",
      applicability: r.applicability || "—",
    })),
});

registerReport({
  id: "compliance_gaps",
  name: "Gap Analysis Report",
  module: "compliance",
  description: "All compliance gaps with severity and remediation plans",
  icon: "AlertOctagon",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["severity", "status"],
  columns: [
    { key: "code", header: "Code" },
    { key: "description", header: "Description" },
    { key: "severity", header: "Severity" },
    { key: "status", header: "Status" },
    { key: "owner", header: "Owner" },
    { key: "dueDate", header: "Due Date", format: "date" },
    { key: "currentState", header: "Current State" },
    { key: "expectedState", header: "Expected State" },
    { key: "remediationPlan", header: "Remediation Plan" },
  ],
  dataSource: async () =>
    COMPLIANCE_GAPS.map((g) => ({
      code: g.code,
      description: g.description,
      severity: g.severity,
      status: g.status,
      owner: g.owner,
      dueDate: g.dueDate,
      currentState: g.currentState || "—",
      expectedState: g.expectedState || "—",
      remediationPlan: g.remediationPlan || "—",
    })),
});

registerReport({
  id: "compliance_evidence",
  name: "Evidence Inventory",
  module: "compliance",
  description: "Complete evidence inventory with status and verification",
  icon: "FileText",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["status", "verificationStatus"],
  columns: [
    { key: "code", header: "Code" },
    { key: "name", header: "Name" },
    { key: "type", header: "Type" },
    { key: "status", header: "Status" },
    { key: "owner", header: "Owner" },
    { key: "uploadDate", header: "Upload Date", format: "date" },
    { key: "expirationDate", header: "Expiration", format: "date" },
    { key: "verificationStatus", header: "Verification" },
    { key: "reviewer", header: "Reviewer" },
  ],
  dataSource: async () =>
    COMPLIANCE_EVIDENCE.map((e) => ({
      code: e.code,
      name: e.name,
      type: e.type,
      status: e.status,
      owner: e.owner,
      uploadDate: e.uploadDate,
      expirationDate: e.expirationDate,
      verificationStatus: e.verificationStatus,
      reviewer: e.reviewer || "—",
    })),
});

registerReport({
  id: "cross_mapping_analysis",
  name: "Cross-Mapping Analysis",
  module: "compliance",
  description: "ISO, CBE, and PCI DSS mappings with coverage, ownership, evidence, and gap rationale",
  icon: "GitCompare",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["mappingStrength", "coverage"],
  columns: [
    { key: "mapId", header: "Map ID" },
    { key: "isoControl", header: "ISO Control" },
    { key: "cbeControlId", header: "CBE Control" },
    { key: "pciRequirement", header: "PCI DSS Requirement" },
    { key: "mappingStrength", header: "Mapping Strength" },
    { key: "coverage", header: "Coverage" },
    { key: "gap", header: "Gap / Coverage Notes" },
    { key: "controlOwner", header: "Control Owner" },
    { key: "auditFrequency", header: "Audit Frequency" },
    { key: "typicalAuditEvidence", header: "Typical Audit Evidence" },
    { key: "rationale", header: "Rationale" },
  ],
  dataSource: async () => (await getCrossMappings()).map((row) => ({
    ...row,
    typicalAuditEvidence: row.typicalAuditEvidence.join("; "),
  })),
});

// ══════════════════════════════════════════════
// RISK REPORTS — Full schema coverage
// ══════════════════════════════════════════════

registerReport({
  id: "risk_register",
  name: "Risk Register",
  module: "risk",
  description: "Complete risk register with scores, owners, and status",
  icon: "Shield",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["severityLevel", "status"],
  columns: [
    { key: "riskId", header: "Risk ID" },
    { key: "title", header: "Title" },
    { key: "process", header: "Process" },
    { key: "subProcess", header: "Sub-Process" },
    { key: "assetSystem", header: "Asset/System" },
    { key: "category", header: "Category" },
    { key: "owner", header: "Owner" },
    { key: "likelihood", header: "Likelihood" },
    { key: "impactScore", header: "Impact" },
    { key: "riskScore", header: "Score" },
    { key: "residualScore", header: "Residual" },
    { key: "residualLevel", header: "Residual Level" },
    { key: "severityLevel", header: "Severity" },
    { key: "status", header: "Status" },
    { key: "treatment", header: "Treatment" },
  ],
  dataSource: async () =>
    RISKS.map((r) => ({
      riskId: r.riskId,
      title: r.title,
      process: r.process || "—",
      subProcess: r.subProcess || "—",
      assetSystem: r.assetSystem || "—",
      category: r.category,
      owner: r.owner,
      likelihood: r.likelihood,
      impactScore: r.impactScore,
      riskScore: r.riskScore,
      residualScore: r.residualScore,
      residualLevel: r.residualLevel || "—",
      severityLevel: r.severityLevel,
      status: r.status,
      treatment: r.treatment || "—",
    })),
});

registerReport({
  id: "risk_register_full",
  name: "Risk Register — Full Detail",
  module: "risk",
  description: "Complete risk data including threat, vulnerability, impacts, dates, and treatment details",
  icon: "Shield",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["severityLevel", "status"],
  columns: [
    { key: "riskId", header: "Risk ID" },
    { key: "title", header: "Title" },
    { key: "process", header: "Process" },
    { key: "subProcess", header: "Sub-Process" },
    { key: "assetSystem", header: "Asset/System" },
    { key: "category", header: "Category" },
    { key: "threat", header: "Threat" },
    { key: "vulnerability", header: "Vulnerability" },
    { key: "owner", header: "Owner" },
    { key: "ownerTeam", header: "Owner Team" },
    { key: "domain", header: "Domain" },
    { key: "likelihood", header: "Likelihood" },
    { key: "impactScore", header: "Impact" },
    { key: "riskScore", header: "Score" },
    { key: "residualScore", header: "Residual" },
    { key: "residualLevel", header: "Residual Level" },
    { key: "severityLevel", header: "Severity" },
    { key: "status", header: "Status" },
    { key: "treatment", header: "Treatment" },
    { key: "mitigationActions", header: "Mitigation Actions" },
    { key: "treatmentOwner", header: "Treatment Owner" },
    { key: "deadline", header: "Deadline", format: "date" },
    { key: "treatmentDueDate", header: "Treatment Due", format: "date" },
    { key: "treatmentEffectiveness", header: "Treatment Effectiveness" },
    { key: "riskDate", header: "Risk Date", format: "date" },
    { key: "createdAt", header: "Created", format: "date" },
    { key: "closedAt", header: "Closed", format: "date" },
  ],
  dataSource: async () =>
    RISKS.map((r) => ({
      riskId: r.riskId,
      title: r.title,
      process: r.process || "—",
      subProcess: r.subProcess || "—",
      assetSystem: r.assetSystem || "—",
      category: r.category,
      threat: r.threat || "—",
      vulnerability: r.vulnerability || "—",
      owner: r.owner,
      ownerTeam: r.ownerTeam || "—",
      domain: r.domain?.name || "—",
      likelihood: r.likelihood,
      impactScore: r.impactScore,
      riskScore: r.riskScore,
      residualScore: r.residualScore,
      residualLevel: r.residualLevel || "—",
      severityLevel: r.severityLevel,
      status: r.status,
      treatment: r.treatment || "—",
      mitigationActions: r.mitigationActions || "—",
      treatmentOwner: r.treatmentOwner || "—",
      deadline: r.deadline || null,
      treatmentDueDate: r.treatmentDueDate || null,
      treatmentEffectiveness: r.treatmentEffectiveness || "—",
      riskDate: r.riskDate || null,
      createdAt: r.createdAt || null,
      closedAt: r.closedAt || null,
    })),
});

registerReport({
  id: "risk_poam",
  name: "POAM Status Report",
  module: "risk",
  description: "POA&M items with milestones and status",
  icon: "Clock",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["status"],
  columns: [
    { key: "_id", header: "ID" },
    { key: "title", header: "Title" },
    { key: "description", header: "Description" },
    { key: "status", header: "Status" },
    { key: "owner", header: "Owner" },
    { key: "dueDate", header: "Due Date", format: "date" },
    { key: "riskId", header: "Linked Risk" },
  ],
  dataSource: async () =>
    POAM.map((p) => ({
      _id: p._id,
      title: p.title,
      description: p.description || "—",
      status: p.status,
      owner: p.owner,
      dueDate: p.dueDate,
      riskId: p.riskId || "—",
    })),
});

registerReport({
  id: "risk_management_reviews",
  name: "Management Reviews Report",
  module: "risk",
  description: "All management review decisions and outcomes",
  icon: "ClipboardCheck",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["decision"],
  columns: [
    { key: "risk", header: "Risk" },
    { key: "reviewer", header: "Reviewer" },
    { key: "decision", header: "Decision" },
    { key: "reviewDate", header: "Review Date", format: "date" },
    { key: "nextReviewDate", header: "Next Review", format: "date" },
    { key: "notes", header: "Notes" },
  ],
  dataSource: async () =>
    MANAGEMENT_REVIEWS.map((mr) => ({
      risk: mr.risk,
      reviewer: mr.reviewer,
      decision: mr.decision,
      reviewDate: mr.reviewDate,
      nextReviewDate: mr.nextReviewDate,
      notes: mr.notes || "—",
    })),
});

registerReport({
  id: "risk_treatments",
  name: "Risk Treatment Plans",
  module: "risk",
  description: "Treatment plans with residual risk, ownership, progress, evidence, and workflow state",
  icon: "ShieldCheck",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["status", "workflowStatus"],
  columns: [
    { key: "id", header: "Treatment ID" },
    { key: "riskId", header: "Risk ID" },
    { key: "riskTitle", header: "Risk" },
    { key: "strategy", header: "Strategy" },
    { key: "residualLikelihood", header: "Residual Likelihood" },
    { key: "residualImpact", header: "Residual Impact" },
    { key: "residualScore", header: "Residual Score" },
    { key: "status", header: "Status" },
    { key: "workflowStatus", header: "Workflow Status" },
    { key: "owner", header: "Owner" },
    { key: "targetDate", header: "Target Date", format: "date" },
    { key: "progress", header: "Progress", format: "percent" },
    { key: "controlCount", header: "Controls" },
    { key: "actionCount", header: "Actions" },
    { key: "evidenceCount", header: "Evidence" },
    { key: "overdue", header: "Overdue" },
  ],
  dataSource: async () => RISK_TREATMENTS.map((t) => {
    const risk = RISKS.find((r) => r._id === t.risk_id);
    const owner = USERS.find((u) => u._id === t.owner_id);
    return {
      id: t.id || t._id,
      riskId: risk?.riskId || t.risk_id,
      riskTitle: risk?.title || "—",
      strategy: t.strategy,
      residualLikelihood: t.residual_likelihood,
      residualImpact: t.residual_impact,
      residualScore: t.residual_score,
      status: t.status,
      workflowStatus: t.workflow_status,
      owner: owner?.fullName || owner?.username || t.owner_id || "—",
      targetDate: t.target_date || null,
      progress: Number(t.progress_percentage || 0),
      controlCount: TREATMENT_CONTROLS.filter((item) => item.treatment_id === t._id).length,
      actionCount: TREATMENT_ACTIONS.filter((item) => item.treatment_id === t._id).length,
      evidenceCount: TREATMENT_EVIDENCE.filter((item) => item.treatment_id === t._id).length,
      overdue: Boolean(t.overdue_flag),
    };
  }),
});

// ══════════════════════════════════════════════
// ASSET REPORTS
// ══════════════════════════════════════════════

registerReport({
  id: "asset_inventory",
  name: "Asset Inventory",
  module: "asset",
  description: "Full asset register with details",
  icon: "Building2",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["criticality", "status"],
  columns: [
    { key: "_id", header: "Asset ID" },
    { key: "name", header: "Name" },
    { key: "type", header: "Type" },
    { key: "owner", header: "Owner" },
    { key: "location", header: "Location" },
    { key: "criticality", header: "Criticality" },
    { key: "status", header: "Status" },
    { key: "domain", header: "Domain" },
  ],
  dataSource: async () =>
    ASSETS.map((a) => ({
      _id: a._id,
      name: a.name,
      type: a.type,
      owner: a.owner,
      location: a.location,
      criticality: a.criticality,
      status: a.status,
      domain: a.domain,
    })),
});

registerReport({
  id: "asset_groups",
  name: "Asset Groups Report",
  module: "asset",
  description: "Asset groupings and membership",
  icon: "FolderOpen",
  supportedFormats: ["xlsx", "pdf", "csv"],
  columns: [
    { key: "_id", header: "Group ID" },
    { key: "name", header: "Name" },
    { key: "description", header: "Description" },
    { key: "status", header: "Status" },
  ],
  dataSource: async () =>
    ASSET_GROUPS.map((g) => ({
      _id: g._id,
      name: g.name,
      description: g.description || "—",
      status: g.status,
    })),
});

// ══════════════════════════════════════════════
// AUDIT REPORTS
// ══════════════════════════════════════════════

registerReport({
  id: "audit_findings",
  name: "Audit Findings Report",
  module: "audit",
  description: "All audit findings with severity and corrective actions",
  icon: "Search",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["severity", "status"],
  columns: [
    { key: "findingId", header: "Finding ID" },
    { key: "title", header: "Title" },
    { key: "severity", header: "Severity" },
    { key: "status", header: "Status" },
    { key: "owner", header: "Owner" },
    { key: "dueDate", header: "Due Date", format: "date" },
    { key: "description", header: "Description" },
  ],
  dataSource: async () =>
    AUDIT_FINDINGS.map((f) => ({
      findingId: f.findingId,
      title: f.title,
      severity: f.severity,
      status: f.status,
      owner: f.owner,
      dueDate: f.dueDate,
      description: f.description || "—",
    })),
});

registerReport({
  id: "audit_engagements",
  name: "Audit Engagements Report",
  module: "audit",
  description: "All audit engagements with progress and ratings",
  icon: "ClipboardList",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["status", "stage"],
  columns: [
    { key: "auditId", header: "Audit ID" },
    { key: "title", header: "Title" },
    { key: "auditType", header: "Type" },
    { key: "entity", header: "Entity" },
    { key: "auditee", header: "Auditee" },
    { key: "leadAuditor", header: "Lead Auditor" },
    { key: "stage", header: "Stage" },
    { key: "progressPercent", header: "Progress", format: "percent" },
    { key: "overallRating", header: "Rating" },
    { key: "status", header: "Status" },
    { key: "plannedStart", header: "Planned Start", format: "date" },
    { key: "plannedEnd", header: "Planned End", format: "date" },
  ],
  dataSource: async () =>
    AUDIT_ENGAGEMENTS.map((e) => ({
      auditId: e.auditId,
      title: e.title,
      auditType: e.auditType,
      entity: e.entity?.name || "—",
      auditee: e.auditee,
      leadAuditor: e.leadAuditor?.fullName || e.leadAuditor?.username || e.leadAuditor || "—",
      stage: e.stage,
      progressPercent: e.progressPercent,
      overallRating: e.overallRating || "—",
      status: e.status,
      plannedStart: e.plannedStart || null,
      plannedEnd: e.plannedEnd || null,
    })),
});

registerReport({
  id: "audit_capas",
  name: "CAPA Report",
  module: "audit",
  description: "Corrective and Preventive Actions with verification status",
  icon: "ShieldCheck",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["status"],
  columns: [
    { key: "_id", header: "ID" },
    { key: "title", header: "Title" },
    { key: "status", header: "Status" },
    { key: "owner", header: "Owner" },
    { key: "dueDate", header: "Due Date", format: "date" },
    { key: "verificationComments", header: "Verification" },
    { key: "verifiedBy", header: "Verified By" },
  ],
  dataSource: async () =>
    AUDIT_CAPAS.map((c) => ({
      _id: c._id,
      title: c.title,
      status: c.status,
      owner: c.owner,
      dueDate: c.dueDate,
      verificationComments: c.verificationComments || "—",
      verifiedBy: c.verifiedBy || "—",
    })),
});

// ══════════════════════════════════════════════
// GOVERNANCE — POLICY REPORTS
// ══════════════════════════════════════════════

registerReport({
  id: "governance_policies",
  name: "Policy Register",
  module: "governance",
  description: "All policies with status, versions, and ownership",
  icon: "FileText",
  requiredPermission: "policy.view",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["status", "classification"],
  columns: [
    { key: "policyId", header: "Policy ID" },
    { key: "title", header: "Title" },
    { key: "category", header: "Category" },
    { key: "classification", header: "Classification" },
    { key: "version", header: "Version" },
    { key: "status", header: "Status" },
    { key: "owner", header: "Owner" },
    { key: "department", header: "Department" },
    { key: "effectiveDate", header: "Effective Date", format: "date" },
    { key: "expirationDate", header: "Expiration", format: "date" },
    { key: "nextReviewDate", header: "Next Review", format: "date" },
    { key: "reviewPeriodDays", header: "Review Period (days)" },
  ],
  dataSource: async () =>
    POLICIES.map((p) => ({
      policyId: p.policyId,
      title: p.title,
      category: p.category,
      classification: p.classification,
      version: p.version,
      status: p.status,
      owner: p.owner,
      department: p.department,
      effectiveDate: p.effectiveDate,
      expirationDate: p.expirationDate,
      nextReviewDate: p.nextReviewDate,
      reviewPeriodDays: p.reviewPeriodDays || "—",
    })),
});

registerReport({
  id: "governance_policies_full",
  name: "Policy Register — Full Detail",
  module: "governance",
  description: "Complete policy data including linked controls, risks, assets, and attestation status",
  icon: "FileText",
  requiredPermission: "policy.view",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["status", "classification"],
  columns: [
    { key: "policyId", header: "Policy ID" },
    { key: "title", header: "Title" },
    { key: "description", header: "Description" },
    { key: "category", header: "Category" },
    { key: "classification", header: "Classification" },
    { key: "version", header: "Version" },
    { key: "status", header: "Status" },
    { key: "owner", header: "Owner" },
    { key: "department", header: "Department" },
    { key: "effectiveDate", header: "Effective Date", format: "date" },
    { key: "expirationDate", header: "Expiration", format: "date" },
    { key: "nextReviewDate", header: "Next Review", format: "date" },
    { key: "reviewPeriodDays", header: "Review Period (days)" },
    { key: "linkedControlsCount", header: "Linked Controls" },
    { key: "linkedRisksCount", header: "Linked Risks" },
    { key: "linkedAssetsCount", header: "Linked Assets" },
    { key: "attestationsCount", header: "Attestations" },
    { key: "parentPolicy", header: "Parent Policy" },
  ],
  dataSource: async () =>
    POLICIES.map((p) => ({
      policyId: p.policyId,
      title: p.title,
      description: p.description || "—",
      category: p.category,
      classification: p.classification,
      version: p.version,
      status: p.status,
      owner: p.owner,
      department: p.department,
      effectiveDate: p.effectiveDate,
      expirationDate: p.expirationDate,
      nextReviewDate: p.nextReviewDate,
      reviewPeriodDays: p.reviewPeriodDays || "—",
      linkedControlsCount: p.linkedControls?.length || 0,
      linkedRisksCount: p.linkedRisks?.length || 0,
      linkedAssetsCount: p.linkedAssets?.length || 0,
      attestationsCount: p.attestations?.length || 0,
      parentPolicy: p.parentPolicy ? policyName(p.parentPolicy) : "—",
    })),
});

registerReport({
  id: "governance_policy_acknowledgements",
  name: "Policy Acknowledgement Status",
  module: "governance",
  description: "Acknowledgement rates per policy",
  icon: "BadgeCheck",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["status"],
  columns: [
    { key: "policy", header: "Policy" },
    { key: "acknowledgedBy", header: "Acknowledged By" },
    { key: "acknowledgedAt", header: "Date", format: "datetime" },
    { key: "status", header: "Status" },
  ],
  dataSource: async () => {
    const rows = [];
    POLICY_ACKNOWLEDGEMENTS.forEach((ack) => {
      rows.push({
        policy: policyName(ack.policyId),
        acknowledgedBy: userName(ack.userId),
        acknowledgedAt: ack.acknowledgedAt,
        status: ack.status || "Completed",
      });
    });
    return rows;
  },
});

// ══════════════════════════════════════════════
// GOVERNANCE — COMMITTEE REPORTS
// ══════════════════════════════════════════════

registerReport({
  id: "committee_decisions_log",
  name: "Committee Decisions Log",
  module: "governance",
  description: "All committee decisions with voting records",
  icon: "Gavel",
  supportedFormats: ["xlsx", "pdf", "csv"],
  columns: [
    { key: "committee", header: "Committee" },
    { key: "description", header: "Decision" },
    { key: "decisionType", header: "Type" },
    { key: "votesFor", header: "Votes For" },
    { key: "votesAgainst", header: "Votes Against" },
    { key: "decidedAt", header: "Date", format: "date" },
    { key: "relatedEntityType", header: "Related Entity Type" },
    { key: "relatedEntityId", header: "Related Entity ID" },
  ],
  dataSource: async () => {
    const rows = [];
    COMMITTEE_DECISIONS.forEach((d) => {
      const committee = COMMITTEES.find((c) => c._id === d.committeeId);
      rows.push({
        committee: committee?.name || d.committeeId,
        description: d.description,
        decisionType: d.decisionType || "—",
        votesFor: d.votesFor ?? "—",
        votesAgainst: d.votesAgainst ?? "—",
        decidedAt: d.decidedAt,
        relatedEntityType: d.relatedEntityType || "—",
        relatedEntityId: d.relatedEntityId || "—",
      });
    });
    return rows;
  },
});

registerReport({
  id: "committee_meetings_attendance",
  name: "Committee Meetings & Attendance",
  module: "governance",
  description: "Meeting records with attendee lists",
  icon: "Users",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["status"],
  columns: [
    { key: "committee", header: "Committee" },
    { key: "meetingNumber", header: "Meeting #" },
    { key: "scheduledDate", header: "Scheduled", format: "date" },
    { key: "actualDate", header: "Actual Date", format: "date" },
    { key: "attendeeCount", header: "Attendees" },
    { key: "status", header: "Status" },
    { key: "agendaItems", header: "Agenda Items" },
  ],
  dataSource: async () => {
    const rows = [];
    COMMITTEE_MEETINGS.forEach((m) => {
      const committee = COMMITTEES.find((c) => c._id === m.committeeId);
      rows.push({
        committee: committee?.name || m.committeeId,
        meetingNumber: m.meetingNumber,
        scheduledDate: m.scheduledDate,
        actualDate: m.actualDate || "—",
        attendeeCount: m.attendeeUserIds?.length || 0,
        status: m.status || "—",
        agendaItems: (m.agendaItems || []).join("; ") || "—",
      });
    });
    return rows;
  },
});

// ══════════════════════════════════════════════
// GOVERNANCE — EXCEPTION REPORTS
// ══════════════════════════════════════════════

registerReport({
  id: "exception_register",
  name: "Exception Register",
  module: "governance",
  description: "All exceptions with status and expiry dates",
  icon: "AlertTriangle",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["status"],
  columns: [
    { key: "title", header: "Title" },
    { key: "description", header: "Description" },
    { key: "exceptionType", header: "Type" },
    { key: "status", header: "Status" },
    { key: "owner", header: "Owner" },
    { key: "expiryDate", header: "Expiry Date", format: "date" },
    { key: "riskId", header: "Linked Risk" },
    { key: "waiverJustification", header: "Waiver Justification" },
    { key: "waivedBy", header: "Waived By" },
    { key: "requestedFrom", header: "Requested From", format: "date" },
    { key: "requestedUntil", header: "Requested Until", format: "date" },
  ],
  dataSource: async () =>
    EXCEPTIONS.map((e) => ({
      title: e.title,
      description: e.description || "—",
      exceptionType: e.exceptionType,
      status: e.status,
      owner: e.owner,
      expiryDate: e.expiryDate,
      riskId: e.riskId || "—",
      waiverJustification: e.waiverJustification || "—",
      waivedBy: e.waivedBy || "—",
      requestedFrom: e.requestedFrom || null,
      requestedUntil: e.requestedUntil || null,
    })),
});

// ══════════════════════════════════════════════
// GOVERNANCE — ROLES & PERMISSIONS
// ══════════════════════════════════════════════

registerReport({
  id: "role_assignments",
  name: "Role Assignment Report",
  module: "governance",
  description: "User-to-role assignments with permissions",
  icon: "UserCog",
  requiredPermission: "governance.view",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["status"],
  columns: [
    { key: "roleName", header: "Role" },
    { key: "description", header: "Description" },
    { key: "status", header: "Status" },
    { key: "approvalAuthority", header: "Approval Authority" },
    { key: "modulesWithAccess", header: "Module Access" },
    { key: "email", header: "Contact Email" },
  ],
  dataSource: async () =>
    ROLES.map((r) => ({
      roleName: r.name,
      description: r.description || "—",
      status: r.status,
      approvalAuthority: r.approvalAuthority || "—",
      modulesWithAccess: (r.modulesWithAccess || []).join(", ") || "—",
      email: r.email || "—",
    })),
});

// ══════════════════════════════════════════════
// AUDIT TRAIL
// ══════════════════════════════════════════════

registerReport({
  id: "governance_audit_log",
  name: "Governance Audit Log Export",
  module: "governance",
  description: "Complete audit trail with hash chain integrity",
  icon: "ScrollText",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["action"],
  columns: [
    { key: "_id", header: "Log ID" },
    { key: "timestamp", header: "Timestamp", format: "datetime" },
    { key: "action", header: "Action" },
    { key: "entityType", header: "Entity Type" },
    { key: "entityId", header: "Entity ID" },
    { key: "fromState", header: "From State" },
    { key: "toState", header: "To State" },
    { key: "actorUserId", header: "Actor" },
    { key: "actorRoleAtTime", header: "Actor Role" },
    { key: "reason", header: "Reason" },
  ],
  dataSource: async () =>
    GOVERNANCE_AUDIT_LOG.map((e) => ({
      _id: e._id,
      timestamp: e.timestamp,
      action: e.action,
      entityType: e.entityType || "—",
      entityId: e.entityId || "—",
      fromState: e.fromState || "—",
      toState: e.toState || "—",
      actorUserId: e.actorUserId || "system",
      actorRoleAtTime: e.actorRoleAtTime || "system",
      reason: e.reason || "—",
    })),
});

// ══════════════════════════════════════════════
// CONTROLS / SoA
// ══════════════════════════════════════════════

registerReport({
  id: "control_effectiveness",
  name: "Control Effectiveness Report",
  module: "controls",
  description: "Control effectiveness scores across all dimensions",
  icon: "ShieldCheck",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["status"],
  columns: [
    { key: "controlId", header: "Control ID" },
    { key: "name", header: "Name" },
    { key: "domain", header: "Domain" },
    { key: "controlType", header: "Type" },
    { key: "owner", header: "Owner" },
    { key: "status", header: "Status" },
    { key: "effectiveness.overall", header: "Overall Effectiveness", format: "percent" },
    { key: "effectiveness.design", header: "Design" },
    { key: "effectiveness.operating", header: "Operating" },
    { key: "effectiveness.coverage", header: "Coverage" },
    { key: "effectiveness.testing", header: "Testing" },
    { key: "maturityLevel", header: "Maturity" },
    { key: "testingFrequency", header: "Testing Frequency" },
    { key: "lastTestedAt", header: "Last Tested", format: "date" },
    { key: "nextTestDueAt", header: "Next Test Due", format: "date" },
  ],
  dataSource: async () =>
    CONTROLS.map((c) => ({
      controlId: c.controlId,
      name: c.name,
      domain: c.domain,
      controlType: c.controlType,
      owner: c.owner,
      status: c.status,
      effectiveness: {
        overall: c.effectiveness?.overall,
        design: c.effectiveness?.design,
        operating: c.effectiveness?.operating,
        coverage: c.effectiveness?.coverage,
        testing: c.effectiveness?.testing,
      },
      maturityLevel: c.maturityLevel,
      testingFrequency: c.testingFrequency || "—",
      lastTestedAt: c.lastTestedAt || null,
      nextTestDueAt: c.nextTestDueAt || null,
    })),
});

registerReport({
  id: "soa_export",
  name: "Statement of Applicability",
  module: "controls",
  description: "SoA with control-to-framework mappings",
  icon: "FileCheck",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["status"],
  columns: [
    { key: "controlId", header: "Control ID" },
    { key: "name", header: "Control Name" },
    { key: "framework", header: "Framework" },
    { key: "requirement", header: "Requirement" },
    { key: "controlType", header: "Type" },
    { key: "status", header: "Implementation Status" },
    { key: "owner", header: "Owner" },
  ],
  dataSource: async () => {
    const rows = [];
    CONTROLS.forEach((c) => {
      const mappings = c.frameworkMappings || [{ framework: c.framework, requirement: c.annexCode }];
      mappings.forEach((m) => {
        rows.push({
          controlId: c.controlId,
          name: c.name,
          framework: m.framework?.name || "—",
          requirement: m.requirement || "—",
          controlType: c.controlType,
          status: c.status,
          owner: c.owner,
        });
      });
    });
    return rows;
  },
});

// ══════════════════════════════════════════════
// PLATFORM EXECUTIVE
// ══════════════════════════════════════════════

registerReport({
  id: "platform_executive",
  name: "Platform Executive Summary",
  module: "platform",
  description: "Cross-module executive summary for board reporting",
  icon: "BarChart3",
  isDashboard: true,
  supportedFormats: ["xlsx", "pdf", "csv"],
  columns: [
    { key: "metric", header: "Metric" },
    { key: "value", header: "Value" },
  ],
  dataSource: async (context = {}) => {
    const dashboard = context.dashboardSummary;
    if (dashboard) {
      return [
        { metric: "Open Risks", value: dashboard.totals.openRisks },
        { metric: "High / Critical Risks", value: dashboard.totals.highCriticalRisks },
        { metric: "Compliance", value: `${dashboard.compliancePercent}%` },
        { metric: "Control Effectiveness", value: `${dashboard.controlEffectivenessPercent}%` },
        { metric: "Risk Control Coverage", value: `${dashboard.riskControlCoveragePercent}%` },
        { metric: "Open Audit Findings", value: dashboard.attention.openFindings },
        { metric: "Critical / High Findings", value: dashboard.attention.criticalFindings },
        { metric: "Assets", value: dashboard.totals.assets },
        { metric: "Active Audits", value: dashboard.totals.activeAudits },
        { metric: "Policies", value: dashboard.totals.policies },
        { metric: "Active POAM", value: dashboard.attention.poamActive },
      ];
    }
    const complianceScore = (() => {
      const scored = COMPLIANCE_REQUIREMENTS.filter((r) => r.status !== "NotApplicable" && r.status !== "NotAssessed");
      if (!scored.length) return 0;
      const pts = { Compliant: 100, PartiallyCompliant: 50, NonCompliant: 0 };
      return Math.round(scored.reduce((s, r) => s + (pts[r.status] ?? 0), 0) / scored.length);
    })();
    return [
      { metric: "Overall Compliance Score", value: `${complianceScore}%` },
      { metric: "Total Requirements", value: COMPLIANCE_REQUIREMENTS.length },
      { metric: "Open Gaps", value: COMPLIANCE_GAPS.filter((g) => g.status === "Open").length },
      { metric: "Total Risks", value: RISKS.length },
      { metric: "Open Risks", value: RISKS.filter((r) => r.status === "Open").length },
      { metric: "Total Assets", value: ASSETS.length },
      { metric: "Total Controls", value: CONTROLS.length },
      { metric: "Audit Findings", value: AUDIT_FINDINGS.length },
      { metric: "Open Audit Findings", value: AUDIT_FINDINGS.filter((f) => f.status === "Open").length },
      { metric: "Active Policies", value: POLICIES.filter((p) => p.status === "Published" || p.status === "Active").length },
      { metric: "Active Exceptions", value: EXCEPTIONS.filter((e) => e.status === "Approved" || e.status === "Active").length },
      { metric: "POAM Items", value: POAM.length },
    ];
  },
});

// ══════════════════════════════════════════════
// CONTEXT / ORGANIZATIONAL REPORTS
// ══════════════════════════════════════════════

registerReport({
  id: "organizations_report",
  name: "Organizational Structure Report",
  module: "context",
  description: "Organizations, groups, and membership",
  icon: "Building",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["status"],
  columns: [
    { key: "orgId", header: "Org ID" },
    { key: "name", header: "Name" },
    { key: "type", header: "Type" },
    { key: "region", header: "Region" },
    { key: "industry", header: "Industry" },
    { key: "status", header: "Status" },
    { key: "parentOrg", header: "Parent Org" },
    { key: "createdAt", header: "Created", format: "date" },
  ],
  dataSource: async () =>
    ORGANIZATIONS.map((o) => ({
      orgId: o.orgId,
      name: o.name,
      type: o.type,
      region: o.region || "—",
      industry: o.industry || "—",
      status: o.status,
      parentOrg: o.parentOrg ? (ORGANIZATIONS.find((p) => p._id === o.parentOrg)?.name || "—") : "—",
      createdAt: o.createdAt || null,
    })),
});

registerReport({
  id: "groups_report",
  name: "Groups & Membership Report",
  module: "context",
  description: "User groups with member lists",
  icon: "Users",
  supportedFormats: ["xlsx", "pdf", "csv"],
  colorColumns: ["status"],
  columns: [
    { key: "name", header: "Group Name" },
    { key: "description", header: "Description" },
    { key: "status", header: "Status" },
    { key: "memberCount", header: "Members" },
  ],
  dataSource: async () =>
    GROUPS.map((g) => ({
      name: g.name,
      description: g.description || "—",
      status: g.status,
      memberCount: g.members?.length || 0,
    })),
});
