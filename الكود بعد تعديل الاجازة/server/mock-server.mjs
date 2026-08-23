import http from "node:http";
import { createHash } from "node:crypto";
import {
  USERS, PASSWORDS, ROLES, DOMAINS, PARAMETERS, RISKS, ASSETS, ASSET_GROUPS, ORGANIZATIONS, GROUPS,
  FRAMEWORKS, CONTROLS, GAPS, CAMPAIGNS, CROSSWALKS, POLICIES, EXCEPTIONS, DOCUMENTS, MANAGEMENT_REVIEWS,
  POAM, QUESTIONNAIRES, ASSESSMENTS, RESPONSES, THIRD_PARTY, COMMITTEES, EXCEPTION_TYPES,
  AUDIT_ENGAGEMENTS, AUDIT_UNIVERSE, AUDIT_PROCEDURES, AUDIT_FINDINGS, AUDIT_CAPAS, AUDIT_REPORTS,
  EMAIL_CONFIG, EMAIL_MESSAGES, BACKUP_CONFIG, BACKUP_RECORDS, DOCUMENT_PROGRAM, LINKS,
  daysAgo, daysAhead, levelOf, THRESHOLDS, CRITERIA,
} from "./mock-data.mjs";
import {
  GOVERNANCE_AUDIT_LOG,
} from "./governance-data.js";
import {
  POLICY_VERSIONS, POLICY_REVIEWS, POLICY_APPROVALS,
} from "./data/policyVersionData.js";
import {
  impactFor, riskScoreFor, suggestedResidual, requiresJustification, residualAxesFor,
  DEFAULT_CEF_WEIGHTS, DEFAULT_RESIDUAL_CAP, JUSTIFICATION_MIN_LENGTH, computeRiskScore,
} from "../client/src/lib/riskEngine.js";
import {
  RiskEngine as NewRiskEngine,
  ParameterEngine,
  ControlEffectivenessEngine,
} from "./riskEngine.js";
import {
  listPolicies, getPolicy, createPolicy, createPolicyVersion,
  submitPolicyVersion, startPolicyReview, approvePolicyVersion,
  publishPolicyVersion, archivePolicy,
  uploadFile, downloadFile, deleteFile,
  listRoles, createRole, updateRole, deleteRole,
  listCommittees, createCommitteeMeeting, createCommitteeDecision,
  listExceptions, createException, approveException,
  getGovernanceDashboard,
} from "./governance-api.js";
import * as lifecycleService from "./services/policyLifecycleService.js";
import * as validationService from "./services/policyValidationService.js";
import * as versionService from "./services/policyVersionService.js";

const PORT = 5000;
const COLLECTIONS = {
  users: USERS, groups: GROUPS, domains: DOMAINS, parameters: PARAMETERS, organizations: ORGANIZATIONS,
  frameworks: FRAMEWORKS, policies: POLICIES, exceptions: EXCEPTIONS, documents: DOCUMENTS,
  risks: RISKS, "management-reviews": MANAGEMENT_REVIEWS, poam: POAM, assets: ASSETS,
  "asset-groups": ASSET_GROUPS, questionnaires: QUESTIONNAIRES, assessments: ASSESSMENTS,
  responses: RESPONSES, "third-party": THIRD_PARTY, roles: ROLES,
  "compliance/controls": CONTROLS, "compliance/gaps": GAPS, "compliance/campaigns": CAMPAIGNS,
  "compliance/crosswalks": CROSSWALKS, "audit/engagements": AUDIT_ENGAGEMENTS, "audit/universe": AUDIT_UNIVERSE,
  "audit/procedures": AUDIT_PROCEDURES, "audit/findings": AUDIT_FINDINGS, "audit/capas": AUDIT_CAPAS,
  "audit/reports": AUDIT_REPORTS, "governance/committees": COMMITTEES, "governance/roles": ROLES,
  "governance/exception-types": EXCEPTION_TYPES, "email/messages": EMAIL_MESSAGES,
  "backup/records": BACKUP_RECORDS, "risk-control-links": LINKS, "controls": CONTROLS,
};

const NESTED_SUBS = ["members", "meetings", "decisions", "users", "versions", "documents", "audit-logs",
  "control-mappings", "evidence", "risk-mappings", "procedures", "findings", "capas", "reports",
  "assessments", "risks", "approvals", "responses", "messages", "attachments", "questions",
  "attestations", "exceptions"];

const nested = new Map();
const getNested = (key) => {
  if (!nested.has(key)) nested.set(key, []);
  return nested.get(key);
};

const FILES = new Map();

const normalizeTags = (v) =>
  Array.isArray(v) ? v.filter(Boolean) : String(v || "").split(",").map((s) => s.trim()).filter(Boolean);

const pushAudit = (policy, actionType, user, extra) => {
  const list = getNested(`policies::${policy._id}::audit-logs`);
  list.push({
    _id: newId("audit"),
    actionType,
    actor: user ? user.username : "system",
    actorRole: user ? user.role : "system",
    details: extra || {},
    createdAt: new Date().toISOString(),
  });
};

const pushRiskAudit = (risk, actionType, user, extra) => {
  const list = getNested(`risks::${risk._id}::audit-logs`);
  list.push({
    _id: newId("audit"),
    actionType,
    actor: user ? user.username : "system",
    actorRole: user ? user.role : "system",
    details: extra || {},
    createdAt: new Date().toISOString(),
  });
};

let seq = 1;
const newId = (prefix) => `${prefix}-${Date.now().toString(36)}-${seq++}`;

const linkInfo = (l) => ({
  _id: l._id,
  link_type: l.link_type,
  effectiveness: l.effectiveness,
  testedEffectiveness: l.testedEffectiveness ?? null,
  testedEffectivenessSource: l.testedEffectivenessSource ?? null,
  added_by: l.added_by,
  added_at: l.added_at,
  assessed_by: l.assessed_by,
  assessed_at: l.assessed_at,
});

const RISK_SCORE_HISTORY = [];
const REBASELINE_JOBS = new Map();
const POLICY_WORKFLOW_EVENTS = [];

const POLICY_ATTESTATION_SNAPSHOTS = [];

const pdfEscape = (s) => String(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const buildPolicySnapshotPdf = (policy) => {
  const text = [
    "WADJET GRC - POLICY ATTESTATION SNAPSHOT",
    `Policy: ${policy.title || ""}`,
    `Policy ID: ${policy.policyId || ""}`,
    `Version: ${policy.version || ""}`,
    `Status: ${policy.status || ""}`,
    `Category: ${policy.category || ""}`,
    `Owner: ${policy.owner || ""}`,
    `Generated at: ${new Date().toISOString()}`,
    "",
    "--- POLICY CONTENT ---",
    policy.content || policy.description || "",
  ].join("\n");
  const stream = `BT /F1 10 Tf 50 770 Td 14 TL (${pdfEscape(text)}) Tj ET`;
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let out = "%PDF-1.4\n";
  const offsets = [];
  for (let i = 0; i < objs.length; i++) {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${objs[i]}\nendobj\n`;
  }
  const xrefStart = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) out += `${String(o).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(out, "latin1");
};

const hashPdf = (buf) => createHash("sha256").update(buf).digest("hex");

const findAttestationById = (id) => {
  for (const p of POLICIES) {
    const found = getNested(`policies::${p._id}::attestations`).find((a) => a._id === id);
    if (found) return found;
  }
  return null;
};

const seedControlMappings = () => {
  const mk = (polId, controlId, mappingType, rationale) => {
    const c = CONTROLS.find((x) => x.controlId === controlId) || null;
    return {
      _id: newId("cm"),
      controlId,
      controlName: c ? c.name : "",
      framework: c ? c.framework?.name : "",
      domain: c ? c.domain : "",
      mappingType,
      rationale,
      createdAt: new Date().toISOString(),
    };
  };
  const add = (polId, controlId, mappingType, rationale) => getNested(`policies::${polId}::control-mappings`).push(mk(polId, controlId, mappingType, rationale));
  add("pol-1", "ISO-01", "Direct", "Access control is governed by the Information Security Policy");
  add("pol-1", "ISO-04", "Direct", "Awareness and training mandated by the Information Security Policy");
  add("pol-5", "ISO-03", "Direct", "Supplier security assessment covered by the Third-Party Risk Policy");
  add("pol-4", "ISO-02", "Direct", "Vulnerability management referenced by the BCP policy");
};
seedControlMappings();

const normalizeImpacts = (impacts) => {
  if (!impacts) return [];
  if (Array.isArray(impacts))
    return impacts
      .filter((i) => i && i.name)
      .map((i) => ({ name: i.name, value: Number(i.value) || 0 }));
  return Object.entries(impacts).map(([name, value]) => ({ name, value: Number(value) || 0 }));
};

const paramOf = (risk) => {
  if (!risk) return null;
  const stored = typeof risk.parameter === "string" ? risk.parameter : risk.parameter?._id;
  if (stored) {
    const found = PARAMETERS.find((p) => p._id === stored);
    if (found) return found;
  }
  return PARAMETERS.find(
    (p) => String(p.domain?._id || p.domain) === String(risk?.domain?._id || risk?.domain)
  );
};

const linksOfRisk = (riskId) => LINKS.filter((l) => l.risk_id === riskId);

const AUTHORITY_LEVEL = { risk_owner: 1, ciso: 2, cro: 2, board: 3 };
const authorityLevel = (u) => AUTHORITY_LEVEL[u?.role] || 0;
const requiredAuthorityFor = (inherentLevel) => (inherentLevel === "Critical" ? 2 : 1);
const requiredAuthorityLabel = (inherentLevel) => (inherentLevel === "Critical" ? "ciso, cro or board" : "risk owner or above");
const requiredApprover = () =>
  USERS.find((u) => ["ciso", "cro", "board"].includes(u.role)) ||
  USERS.find((u) => AUTHORITY_LEVEL[u.role] >= 2) ||
  null;

const EFFECTIVENESS_RANK = { Effective: 3, "Partially Effective": 2, Ineffective: 1, "Not Assessed": 0 };

const reassessmentDueOf = (risk) => {
  const param = paramOf(risk);
  if (!param?.reassessmentFrequencyDays || !risk.lastAssessedAt) return null;
  return new Date(
    new Date(risk.lastAssessedAt).getTime() + Number(param.reassessmentFrequencyDays) * 86400000
  ).toISOString();
};
const overdueReassessmentOf = (risk) => {
  if (risk.status === "Closed" || !risk.lastAssessedAt) return false;
  const due = reassessmentDueOf(risk);
  return Boolean(due) && new Date(due).getTime() < Date.now();
};
const reassessmentGraceDays = (risk) => {
  const param = paramOf(risk);
  return Math.max(1, Math.round((Number(param?.reassessmentFrequencyDays) || 180) * 0.1));
};
const reassessmentDaysOverdue = (risk) => {
  const due = reassessmentDueOf(risk);
  if (!due) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(due).getTime()) / 86400000));
};

const ALERTED = new Set();
const notifyInbox = ({ to, subject, body, dedupeKey }) => {
  if (dedupeKey && ALERTED.has(dedupeKey)) return;
  if (dedupeKey) ALERTED.add(dedupeKey);
  EMAIL_MESSAGES.unshift({
    _id: newId("em"),
    to,
    subject,
    body,
    status: "Draft",
    attachments: [],
    scheduledAt: null,
    createdAt: new Date().toISOString(),
  });
};

const cefConfigOf = (param) => ({
  weights: param?.controlEffectivenessWeights || DEFAULT_CEF_WEIGHTS,
  capReduction: param?.maximumRiskReduction ?? param?.residualCapReduction ?? DEFAULT_RESIDUAL_CAP,
});

/** Canonical server-side scoring for a risk record (impact axis + method + axis-aware CEF). */
const computeScores = (risk) => {
  const param = paramOf(risk);
  const impact = impactFor({ impacts: impactsMap(risk.impacts) }, param?.scoringMethod || "max", param?.criteria);
  const score = riskScoreFor({ likelihood: risk.likelihood, impact, param });
  const axes = residualAxesFor({
    likelihood: risk.likelihood,
    impact,
    links: linksOfRisk(risk._id),
    controlOf: (id) => CONTROLS.find((c) => c._id === id),
    cfg: cefConfigOf(param),
  });
  return { param, impact, score, axes, suggested: axes.score };
};

const writeHistory = (risk, prev, next, changedBy, justification) => {
  RISK_SCORE_HISTORY.push({
    _id: newId("hst"),
    risk_id: risk._id,
    changed_at: new Date().toISOString(),
    changed_by: changedBy,
    previousInherentScore: prev.inherent,
    newInherentScore: next.inherent,
    previousResidualScore: prev.residual,
    newResidualScore: next.residual,
    suggestedResidual: next.suggested,
    residualJustification: justification || null,
    methodVersionAtChange: next.methodVersion,
    riskScoreMethodAtChange: next.method,
  });
};

const refreshRiskScores = (riskId) => {
  const risk = RISKS.find((r) => r._id === riskId);
  if (!risk) return;
  const param = paramOf(risk);
  const impactsObj = {};
  for (const i of risk.impacts || []) impactsObj[i.name] = i.value;
  const existingLinks = LINKS.filter((l) => l.risk_id === riskId);
  const linkedControls = existingLinks.map((l) => ({
    controlId: l.control_id,
    effectivenessRating: l.effectiveness || "Not Assessed",
  }));
  let computed;
  try {
    computed = computeRiskScore({
      likelihood: risk.likelihood,
      impacts: impactsObj,
      parameter: param,
      linkedControls,
    });
  } catch {
    return risk;
  }
  risk.calculatedResidualScore = computed.residualScore;
  risk.residualLikelihood = computed.impact;
  risk.residualImpact = computed.impact;
  risk.suggestedResidual = computed.residualScore;
  risk.combinedCE = computed.combinedCE;
  if (!risk.residualOverridden) {
    risk.residualScore = computed.residualScore;
    risk.residualLevel = computed.residualLevel;
    risk.overallRisk = computed.residualLevel;
  }
  risk.scoredWithParameter = computed.scoredWithParameter;
  return risk;
};

const pendingRebaselineOf = (risk) => {
  const param = paramOf(risk);
  return Boolean(param) && Number(param.methodVersion) !== Number(risk.methodVersionAtAssessment);
};

const initScores = () => {
  for (const risk of RISKS) {
    const param = paramOf(risk);
    const impactsObj = {};
    for (const i of risk.impacts || []) impactsObj[i.name] = i.value;
    const existingLinks = LINKS.filter((l) => l.risk_id === risk._id);
    const linkedControls = existingLinks.map((l) => ({
      controlId: l.control_id,
      effectivenessRating: l.effectiveness || "Not Assessed",
    }));
    let computed;
    try {
      computed = computeRiskScore({
        likelihood: risk.likelihood,
        impacts: impactsObj,
        parameter: param,
        linkedControls,
      });
    } catch {
      continue;
    }
    risk.calculatedResidualScore = computed.residualScore;
    risk.residualLikelihood = computed.impact;
    risk.residualImpact = computed.impact;
    risk.suggestedResidual = computed.residualScore;
    risk.combinedCE = computed.combinedCE;
    if (!risk.residualOverridden) {
      risk.residualScore = computed.residualScore;
      risk.residualLevel = computed.residualLevel;
    }
    if (risk.residualJustification == null) risk.residualJustification = null;
    if (risk.overriddenBy == null) risk.overriddenBy = null;
    if (risk.overriddenAt == null) risk.overriddenAt = null;
    if (risk.overallRisk == null) risk.overallRisk = risk.residualLevel;
    risk.scoredWithParameter = computed.scoredWithParameter;
  }
};
initScores();

const withJoins = (item) => {
  if (RISKS.some((r) => r._id === item._id)) {
    const linked = LINKS.filter((l) => l.risk_id === item._id).map((l) => {
      const c = CONTROLS.find((x) => x._id === l.control_id);
      return {
        ...linkInfo(l),
        control: c
          ? { _id: c._id, controlId: c.controlId, annexCode: c.annexCode, name: c.name, framework: c.framework, controlType: c.controlType, implementationStatus: c.implementationStatus }
          : null,
      };
    });
    const out = { ...item, linkedControls: linked, pendingRebaseline: pendingRebaselineOf(item), nextReassessmentDue: reassessmentDueOf(item), overdueReassessment: overdueReassessmentOf(item) };
    const exs = [];
    for (const p of POLICIES) {
      for (const x of getNested(`policies::${p._id}::exceptions`)) {
        if (String(x.riskId) === String(item._id))
          exs.push({ exceptionId: x._id, policy: { _id: p._id, policyId: p.policyId, title: p.title }, status: x.status, riskBindingStatus: x.riskBindingStatus || "unbound" });
      }
    }
    out.linkedExceptions = exs;
    const param = paramOf(item);
    if (param) {
      out.parameter = { _id: param._id, name: param.name, methodVersion: param.methodVersion };
      out.appetiteLimit = param.appetiteLimit ?? null;
      out.toleranceLimit = param.toleranceLimit ?? null;
      const residual = Number(item.residualScore);
      if (param.appetiteLimit != null) {
        if (residual <= param.appetiteLimit) {
          out.appetiteStatus = "Within Appetite";
        } else if (param.toleranceLimit != null && residual <= param.toleranceLimit) {
          out.appetiteStatus = "Above Appetite / Within Tolerance";
        } else {
          out.appetiteStatus = param.toleranceLimit != null ? "Outside Tolerance" : "Exceeds Appetite";
        }
      }
      out.exceedsAppetite = param.appetiteLimit != null && residual > param.appetiteLimit;
    }
    out.calculatedResidualScore = item.calculatedResidualScore ?? item.suggestedResidual ?? item.residualScore;
    out.residualOverride = Boolean(item.residualOverridden);
    out.residualLikelihood = item.residualLikelihood ?? null;
    out.residualImpact = item.residualImpact ?? null;
    if (out.acceptedBy) {
      const acc = USERS.find((u) => u._id === out.acceptedBy || u.username === out.acceptedBy);
      if (acc) out.acceptedByName = acc.fullName || acc.username;
    }
    return out;
  }
  if (MANAGEMENT_REVIEWS.some((m) => m._id === item._id)) {
    const rid = typeof item.risk === "string" ? item.risk : item.risk?._id;
    const risk = rid && RISKS.find((r) => r._id === rid);
    return { ...item, risk: risk ? { _id: risk._id, riskId: risk.riskId, title: risk.title } : item.risk || null };
  }
  if (CONTROLS.some((c) => c._id === item._id)) {
    const linked = LINKS.filter((l) => l.control_id === item._id).map((l) => {
      const r = RISKS.find((x) => x._id === l.risk_id);
      return {
        ...linkInfo(l),
        risk: r
          ? { _id: r._id, riskId: r.riskId, title: r.title, severityLevel: r.severityLevel, status: r.status, residualScore: r.residualScore, inherentLevel: r.inherentLevel, category: r.category }
          : null,
      };
    });
    return { ...item, linkedRisks: linked };
  }
  if (POLICIES.some((p) => p._id === item._id)) {
    const parentId = typeof item.parentPolicy === "string" ? item.parentPolicy : item.parentPolicy?._id;
    const parent = parentId ? POLICIES.find((p) => p._id === parentId) : null;
    const children = POLICIES.filter((p) => {
      const pid = typeof p.parentPolicy === "string" ? p.parentPolicy : p.parentPolicy?._id;
      return pid === item._id;
    });
    return {
      ...item,
      tags: normalizeTags(item.tags),
      nextReviewAt: item.nextReviewAt || item.nextReviewDate || null,
      parentPolicy: parent ? { _id: parent._id, policyId: parent.policyId, title: parent.title, status: parent.status, updatedAt: parent.updatedAt } : null,
      childPolicies: children.map((c) => ({ _id: c._id, policyId: c.policyId, title: c.title })),
    };
  }
  if (ROLES.some((r) => r._id === item._id)) {
    return { ...item, usersAssigned: getNested(`governance/roles::${item._id}::users`).length };
  }
  return item;
};

const json = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

/**
 * Governance API handler wrapper
 * Adds authentication and user context to governance endpoints
 */
const handleGovernance = (req, res, handler) => {
  // Authenticate user
  const user = tokenUser(req);
  if (!user) {
    return json(res, 401, { message: "Unauthorized" });
  }
  
  // Attach user to request for audit logging
  req.user = user;
  req.ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";
  
  try {
    const result = handler(req);
    // If handler returns a response object, send it
    if (result && typeof result === "object" && result.__response) {
      return json(res, result.status, result.body);
    }
    return json(res, 200, result);
  } catch (error) {
    return json(res, 500, { message: error.message });
  }
};

const tokenUser = (req) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "wadjet") return null;
  const user = USERS.find((u) => u.username === parts[1]);
  if (!user) return null;
  const ts = Number(parts[2]);
  if (!ts || Date.now() - ts > 8 * 3600 * 1000) return null;
  return user;
};

const readBody = (req) =>
  new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks);
      const ct = req.headers["content-type"] || "";
      if (ct.includes("multipart/form-data")) {
        const text = raw.toString("utf8");
        const fields = {};
        let fileName = null;
        for (const m of text.matchAll(/name="([^"]+)"([^\r\n]*)\r\n(?:Content-[^\r\n]*\r\n)*\r\n([\s\S]*?)(?=\r\n--[A-Za-z0-9_-]|$)/g)) {
          fields[m[1]] = m[3].replace(/\r\n$/, "");
          const fm = /filename="([^"]*)"/.exec(m[2]);
          if (fm) fileName = fm[1];
        }
        resolve({ fields, isMultipart: true, fileName });
      } else {
        try { resolve(raw.length ? JSON.parse(raw.toString("utf8")) : {}); }
        catch { resolve({}); }
      }
    });
  });

const filterList = (items, query) => {
  const q = String(query.q || "").toLowerCase().trim();
  let out = items;
  if (q) {
    out = out.filter((r) =>
      Object.entries(r).some(([k, v]) =>
        typeof v === "string" && !k.startsWith("_") && v.toLowerCase().includes(q)
      )
    );
  }
  const special = new Set(["q", "page", "pageSize", "sort", "order", "view", "hasControls", "hasRisks", "q_global", "methodVersion", "reassessment", "changeTrigger"]);
  for (const [key, value] of Object.entries(query)) {
    if (special.has(key) || value === "" || value == null) continue;
    out = out.filter((r) => {
      const rv = r[key];
      if (rv == null) return false;
      return String(typeof rv === "object" ? rv._id || rv.name || "" : rv) === String(value);
    });
  }
  if (query.hasControls === "false") out = out.filter((r) => LINKS.filter((l) => l.risk_id === r._id).length === 0);
  if (query.hasRisks === "false") out = out.filter((c) => LINKS.filter((l) => l.control_id === c._id).length === 0);
  if (query.methodVersion === "stale") out = out.filter((r) => pendingRebaselineOf(r));
  if (query.reassessment === "overdue") out = out.filter((r) => overdueReassessmentOf(r));
  if (query.changeTrigger === "pending") out = out.filter((r) => r.changeTriggerPending);
  if (query.view === "active") out = out.filter((r) => r.stage !== "Closed");
  const sort = query.sort;
  if (sort) out = [...out].sort((a, b) => {
    const av = a[sort], bv = b[sort];
    if (av == null) return 1;
    if (bv == null) return -1;
    return String(av).localeCompare(String(bv));
  });
  const total = out.length;
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Number(query.pageSize) || 500;
  const itemsOut = query.page ? out.slice((page - 1) * pageSize, page * pageSize) : out;
  return { items: itemsOut, total, page, pageSize };
};

const statsFor = (collection, items) => {
  const c = (v) => items.filter((r) => r.status === v).length;
  const s = (v) => items.filter((r) => r.implementationStatus === v).length;
  switch (collection) {
    case "compliance/controls": {
      const today = Date.now();
      return {
        total: items.length, fully: s("Fully Implemented"), largely: s("Largely Implemented"),
        partial: s("Partially Implemented"), none: s("Not Implemented"),
        overdue: items.filter((r) => r.nextTestDueAt && new Date(r.nextTestDueAt) < today).length,
      };
    }
    case "compliance/gaps": {
      const today = new Date();
      const qStart = new Date(); qStart.setMonth(qStart.getMonth() - 3);
      return {
        total: items.length,
        critical: items.filter((r) => r.severity === "Critical" && r.status !== "Closed").length,
        overdue: items.filter((r) => r.dueDate && new Date(r.dueDate) < today && r.status !== "Closed").length,
        closedThisQuarter: items.filter((r) => r.status === "Closed" && new Date(r.updatedAt || r.createdAt || 0) > qStart).length,
      };
    }
    case "compliance/campaigns": {
      const active = items.filter((r) => r.status === "Active");
      const pending = active.reduce((a, r) => a + (r.responses || []).filter((x) => x.status !== "Submitted").length, 0);
      const done = active.reduce((a, r) => a + (r.responses || []).filter((x) => x.status === "Submitted").length, 0);
      const all = active.reduce((a, r) => a + (r.responses || []).length, 0);
      return {
        active: active.length,
        pendingResponses: pending,
        completionRate: all ? Math.round((done / all) * 100) : 0,
        overdueCampaigns: active.filter((r) => r.dueDate && new Date(r.dueDate) < new Date()).length,
      };
    }
    case "policies": {
      const today = new Date();
      const inReview = (v) => v === "Review" || v === "Pending Review";
      const inApproval = (v) => v === "Approval" || v === "Pending Approval";
      return {
        total: items.length,
        published: c("Published"),
        pendingReview: items.filter((r) => inReview(r.status)).length,
        pendingApproval: items.filter((r) => inApproval(r.status)).length,
        overdue: items.filter((r) => r.nextReviewDate && new Date(r.nextReviewDate) < today && r.status === "Published").length,
      };
    }
    case "exceptions": {
      return { total: items.length, pending: c("Pending"), approved: c("Approved"), expired: c("Expired") };
    }
    case "risks": {
      return { total: items.length, open: items.filter((r) => r.status !== "Closed").length, closed: c("Closed") };
    }
    default:
      return { total: items.length };
  }
};

const dashboardSummary = () => {
  const open = RISKS.filter((r) => r.status !== "Closed");
  const closed = RISKS.filter((r) => r.status === "Closed");
  const bySeverity = ["Critical", "High", "Medium", "Low"].map((name) => ({
    name, value: open.filter((r) => r.severityLevel === name).length,
  }));
  const cats = {};
  for (const r of open) cats[r.category] = (cats[r.category] || 0) + 1;
  const byCategory = Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    months.push({
      month: d.toLocaleString("en", { month: "short" }),
      opened: RISKS.filter((r) => {
        const c = new Date(r.createdAt);
        return `${c.getFullYear()}-${c.getMonth()}` === key;
      }).length,
      closed: RISKS.filter((r) => r.closedAt && `${new Date(r.closedAt).getFullYear()}-${new Date(r.closedAt).getMonth()}` === key).length,
    });
  }
  const implemented = CONTROLS.filter((r) => r.implementationStatus === "Fully Implemented" || r.implementationStatus === "Largely Implemented").length;
  const compliancePercent = CONTROLS.length ? Math.round((implemented / CONTROLS.length) * 100) : 0;
  const linkedRiskIds = new Set(LINKS.map((l) => l.risk_id));
  const openRisks = RISKS.filter((r) => r.status !== "Closed");
  const riskControlCoveragePercent = openRisks.length
    ? Math.round((openRisks.filter((r) => linkedRiskIds.has(r._id)).length / openRisks.length) * 100)
    : 0;
  const unmitigatedHighCriticalCount = openRisks.filter(
    (r) => (r.severityLevel === "High" || r.severityLevel === "Critical") && !linkedRiskIds.has(r._id)
  ).length;
  const linkedControlIds = new Set(LINKS.map((l) => l.control_id));
  const orphanControlsCount = CONTROLS.filter((c) => !linkedControlIds.has(c._id)).length;
  const controlEffectivenessDistribution = ["Effective", "Partially Effective", "Ineffective", "Not Assessed"].map((name) => ({
    name,
    value: LINKS.filter((l) => l.effectiveness === name).length,
  }));
  const pendingRebaselineCount = RISKS.filter((r) => pendingRebaselineOf(r)).length;
  const riskScoreMethodDistribution = ["multiplicative", "weighted_additive", "matrix_lookup"].map((name) => ({
    name,
    value: RISKS.filter((r) => (paramOf(r)?.riskScoreMethod || "multiplicative") === name).length,
  }));
  const overdueReassessments = RISKS.filter(overdueReassessmentOf);
  const overdueReassessmentCount = overdueReassessments.length;
  const reassessmentOwnerAlerts = overdueReassessments.filter((r) => reassessmentDaysOverdue(r) > reassessmentGraceDays(r));
  const reassessmentManagerEscalations = overdueReassessments.filter((r) => reassessmentDaysOverdue(r) > reassessmentGraceDays(r) * 2);
  for (const r of reassessmentOwnerAlerts) {
    notifyInbox({
      to: "risk-owner@wadjet.local",
      subject: `Risk reassessment overdue — ${r.riskId}`,
      body: `${r.title} is ${reassessmentDaysOverdue(r)} day(s) past its reassessment due date (${reassessmentDueOf(r)?.slice(0, 10) || "unknown"}). Please re-assess the risk.`,
      dedupeKey: `reassess:${r._id}`,
    });
  }
  for (const r of reassessmentManagerEscalations) {
    notifyInbox({
      to: "grc-manager@wadjet.local",
      subject: `Escalation — reassessment overdue — ${r.riskId}`,
      body: `${r.title} is significantly overdue for reassessment (${reassessmentDaysOverdue(r)} days). Escalated to GRC Manager.`,
      dedupeKey: `esc:${r._id}`,
    });
  }
  return {
    totals: {
      openRisks: open.length,
      closedRisks: closed.length,
      assets: ASSETS.length,
      activeAudits: AUDIT_ENGAGEMENTS.filter((r) => r.stage !== "Closed").length,
      frameworks: FRAMEWORKS.length,
      policies: POLICIES.length,
      highCriticalRisks: open.filter((r) => r.severityLevel === "High" || r.severityLevel === "Critical").length,
    },
    riskControlCoveragePercent,
    unmitigatedHighCriticalCount,
    orphanControlsCount,
    controlEffectivenessDistribution,
    pendingRebaselineCount,
    overdueReassessmentCount,
    riskScoreMethodDistribution,
    attention: {
      policiesInReview: POLICIES.filter((r) => r.status === "Pending Review" || r.status === "Review").length,
      overduePolicies: POLICIES.filter((r) => r.nextReviewDate && new Date(r.nextReviewDate) < new Date() && r.status === "Published").length,
      pendingExceptions: EXCEPTIONS.filter((r) => r.status === "Pending").length,
      expiredExceptions: EXCEPTIONS.filter((r) => r.status === "Expired" || (r.expiryDate && new Date(r.expiryDate) < new Date() && r.status !== "Expired")).length,
      poamActive: POAM.filter((r) => r.status === "Planned" || r.status === "In Progress").length,
      openFindings: AUDIT_FINDINGS.filter((r) => r.status !== "Closed").length,
      criticalFindings: AUDIT_FINDINGS.filter((r) => (r.severity === "High" || r.severity === "Critical") && r.status !== "Closed").length,
      changeTriggerPending: RISKS.filter((r) => r.changeTriggerPending).length,
      pendingAcceptances: RISKS.filter((r) => r.treatment === "pending_acceptance").length,
      pendingSecondApprovals: RISKS.filter((r) => r.requiresSecondApproval && !r.secondApprovedBy).length,
      reassessmentOwnerAlerts: reassessmentOwnerAlerts.length,
      reassessmentManagerEscalations: reassessmentManagerEscalations.length,
    },
    bySeverity,
    byCategory,
    trend: months,
    compliancePercent,
    frameworkCompliance: FRAMEWORKS.map((f) => {
      const cs = CONTROLS.filter((c) => c.framework._id === f._id);
      const impl = cs.filter((c) => c.implementationStatus === "Fully Implemented" || c.implementationStatus === "Largely Implemented").length;
      return { id: f._id, name: f.name, percent: cs.length ? Math.round((impl / cs.length) * 100) : 0, implemented: impl, totalControls: cs.length };
    }),
  };
};

const aiInsights = () => {
  const open = RISKS.filter((r) => r.status !== "Closed");
  const high = open.filter((r) => r.severityLevel === "High" || r.severityLevel === "Critical");
  const cats = {};
  for (const r of open) cats[r.category] = (cats[r.category] || 0) + 1;
  const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
  return {
    generatedAt: new Date().toISOString(),
    headline: `The register carries ${open.length} open risks; ${high.length} require immediate management attention.`,
    metrics: {
      openRisks: open.length,
      highCritical: high.length,
      topCategory: topCat ? topCat[0] : "—",
      complianceCoverage: Math.round((CONTROLS.filter((c) => c.implementationStatus === "Fully Implemented").length / Math.max(1, CONTROLS.length)) * 100),
    },
    insights: [
      {
        title: "Concentration in " + (topCat ? topCat[0] : "risk categories"),
        body: (topCat ? topCat[0] : "Risk") + ` accounts for ${topCat ? Math.round((topCat[1] / Math.max(1, open.length)) * 100) : 0}% of open exposures. Review appetite limits and treatment capacity in this area.`,
        confidence: 0.82,
      },
      {
        title: "Treatment backlog",
        body: `${POAM.filter((r) => r.status === "Planned" || r.status === "In Progress").length} POAM actions are planned or in progress. Prioritise critical and high rated risks first.`,
        confidence: 0.76,
      },
      {
        title: "Control assurance gap",
        body: `${CONTROLS.filter((c) => c.implementationStatus === "Not Implemented" || c.implementationStatus === "Partially Implemented").length} controls are not fully implemented — align remediation with open gap items.`,
        confidence: 0.88,
      },
    ],
  };
};

const route = (path) => {
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "api") parts.shift();
  return parts;
};

const handle = async (req, res, url) => {
  const parts = route(url.pathname);
  const method = req.method;
  const query = Object.fromEntries(url.searchParams.entries());
  const path = parts.join("/");

  // Debug: log all requests

  if (method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Authorization" });
    return res.end();
  }
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (path === "auth/login" && method === "POST") {
    const body = await readBody(req);
    const user = USERS.find((u) => u.username === body.username && PASSWORDS[u.username] === body.password);
    if (!user) return json(res, 401, { message: "Invalid username or password" });
    const token = `wadjet.${user.username}.${Date.now()}`;
    return json(res, 200, { token, user });
  }
  if (path === "auth/logout") return json(res, 200, { ok: true });

  const user = tokenUser(req);
  if (path === "auth/me") {
    if (!user) return json(res, 401, { message: "Unauthorized" });
    return json(res, 200, { user });
  }
  if (!user && path !== "auth/logout") return json(res, 401, { message: "Unauthorized" });

  
  if (parts.length === 3 && parts[0] === "risks" && parts[2] === "controls" && method === "GET") {
    const items = LINKS.filter((l) => l.risk_id === parts[1])
      .map((l) => {
        const c = CONTROLS.find((x) => x._id === l.control_id);
        return { ...linkInfo(l), control: c ? { _id: c._id, controlId: c.controlId, annexCode: c.annexCode, name: c.name, implementationStatus: c.implementationStatus } : null };
      });
    return json(res, 200, { items, total: items.length });
  }
  if (parts.length === 3 && parts[0] === "controls" && parts[2] === "risks" && method === "GET") {
    const items = LINKS.filter((l) => l.control_id === parts[1])
      .map((l) => {
        const r = RISKS.find((x) => x._id === l.risk_id);
        return { ...linkInfo(l), risk: r ? { _id: r._id, riskId: r.riskId, title: r.title, severityLevel: r.severityLevel, status: r.status, residualScore: r.residualScore, category: r.category } : null };
      });
    return json(res, 200, { items, total: items.length });
  }
  if (path === "risk-control-links" && method === "POST") {
    const body = await readBody(req);
    if (!body.risk_id || !body.control_id) return json(res, 400, { message: "risk_id and control_id are required" });
    if (LINKS.some((l) => l.risk_id === body.risk_id && l.control_id === body.control_id))
      return json(res, 409, { message: "A link between this risk and control already exists" });
    if (body.testedEffectiveness != null && String(body.testedEffectiveness).trim() !== "") {
      const tested = Number(body.testedEffectiveness);
      if (!Number.isFinite(tested) || tested < 0 || tested > 100) {
        return json(res, 422, { message: "testedEffectiveness must be a number between 0 and 100." });
      }
      const source = String(body.testedEffectivenessSource || "").trim();
      if (!source) {
        return json(res, 422, { message: "testedEffectivenessSource is required when testedEffectiveness is provided." });
      }
    }
    const link = {
      _id: newId("rcl"),
      risk_id: body.risk_id,
      control_id: body.control_id,
      link_type: body.link_type || "existing",
      effectiveness: body.effectiveness || "Not Assessed",
      testedEffectiveness: body.testedEffectiveness != null && String(body.testedEffectiveness).trim() !== "" ? Number(body.testedEffectiveness) : null,
      testedEffectivenessSource: body.testedEffectivenessSource || null,
      added_by: user.username,
      added_at: new Date().toISOString(),
      assessed_by: null,
      assessed_at: null,
    };
    LINKS.push(link);
    refreshRiskScores(body.risk_id);
    return json(res, 200, link);
  }
  if (parts.length === 2 && parts[0] === "risk-control-links") {
    const link = LINKS.find((l) => l._id === parts[1]);
    if (link) {
      if (method === "GET") return json(res, 200, link);
      if (method === "PUT") {
        const body = await readBody(req);
        if (body.effectiveness && body.effectiveness !== link.effectiveness) {
          const oldRank = EFFECTIVENESS_RANK[link.effectiveness] ?? 0;
          const newRank = EFFECTIVENESS_RANK[body.effectiveness] ?? 0;
          if (newRank < oldRank) {
            const r = RISKS.find((x) => x._id === link.risk_id);
            if (r) {
              r.changeTriggerPending = true;
              r.changeTriggerReason = `Linked control ${link.control_id} effectiveness downgraded ${link.effectiveness} → ${body.effectiveness} on ${new Date().toISOString().slice(0, 10)} by ${user.username}`;
            }
          }
          link.effectiveness = body.effectiveness;
          link.assessed_by = user.username;
          link.assessed_at = new Date().toISOString();
        }
        if (body.link_type) link.link_type = body.link_type;
        if (body.testedEffectiveness != null && String(body.testedEffectiveness).trim() !== "") {
          const tested = Number(body.testedEffectiveness);
          if (!Number.isFinite(tested) || tested < 0 || tested > 100) {
            return json(res, 422, { message: "testedEffectiveness must be a number between 0 and 100." });
          }
          const source = String(body.testedEffectivenessSource || "").trim();
          if (!source) {
            return json(res, 422, { message: "testedEffectivenessSource is required when testedEffectiveness is provided." });
          }
          link.testedEffectiveness = tested;
          link.testedEffectivenessSource = source;
        } else if (body.testedEffectiveness !== undefined && String(body.testedEffectiveness).trim() === "") {
          link.testedEffectiveness = null;
          link.testedEffectivenessSource = null;
        }
        refreshRiskScores(link.risk_id);
        return json(res, 200, link);
      }
      if (method === "DELETE") {
        const r = RISKS.find((x) => x._id === link.risk_id);
        if (r) {
          r.changeTriggerPending = true;
          r.changeTriggerReason = `Linked control ${link.control_id} removed on ${new Date().toISOString().slice(0, 10)} by ${user.username}`;
        }
        LINKS.splice(LINKS.indexOf(link), 1);
        refreshRiskScores(link.risk_id);
        return json(res, 200, { ok: true });
      }
    }
    return json(res, 404, { message: "Not found" });
  }

  if (path === "ai/chat" && method === "POST") {
    const body = await readBody(req);
    return json(res, 200, {
      reply: `Noted: "${body.message}". This assistant is in demo mode — the production backend connects to the enterprise LLM gateway.`,
    });
  }

  if (path === "risk-score-jobs") {
    if (method !== "GET") return json(res, 405, { message: "Method not allowed" });
    return json(res, 200, { items: [...REBASELINE_JOBS.values()], total: REBASELINE_JOBS.size });
  }
  if (parts.length === 3 && parts[0] === "risk-score-jobs" && parts[2] === "risks" && method === "GET") {
    const job = REBASELINE_JOBS.get(parts[1]);
    if (!job) return json(res, 404, { message: "Job not found" });
    return json(res, 200, { items: job.records, total: job.records.length });
  }
  if (parts.length === 2 && parts[0] === "risk-score-jobs" && method === "GET") {
    const job = REBASELINE_JOBS.get(parts[1]);
    if (!job) return json(res, 404, { message: "Job not found" });
    return json(res, 200, job);
  }
  if (path === "risks/rebaseline" && method === "POST") {
    const body = await readBody(req);
    const param = PARAMETERS.find((p) => p._id === body.parameterId);
    if (!param) return json(res, 404, { message: "Parameter set not found" });
    const targets = RISKS.filter((r) => pendingRebaselineOf(r) && paramOf(r)?._id === param._id);
    const jobId = newId("rbl");
    const job = {
      _id: jobId,
      status: "queued",
      progress: 0,
      total: targets.length,
      processed: 0,
      created_by: user.username,
      created_at: new Date().toISOString(),
      records: [],
      param: { _id: param._id, name: param.name, methodVersion: param.methodVersion },
    };
    REBASELINE_JOBS.set(jobId, job);
    let cursor = 0;
    const run = () => {
      job.status = "running";
      const batch = targets.slice(cursor, cursor + 3);
      for (const risk of batch) {
        const prev = { inherent: risk.riskScore, residual: risk.residualScore };
        const param = paramOf(risk);
        const impactsObj = {};
        for (const i of risk.impacts || []) impactsObj[i.name] = i.value;
        const existingLinks = LINKS.filter((l) => l.risk_id === risk._id);
        const linkedControls = existingLinks.map((l) => ({
          controlId: l.control_id,
          effectivenessRating: l.effectiveness || "Not Assessed",
        }));
        let computed;
        try {
          computed = computeRiskScore({
            likelihood: risk.likelihood,
            impacts: impactsObj,
            parameter: param,
            linkedControls,
          });
        } catch {
          continue;
        }
        if (computed.inherentScore !== prev.inherent) {
          risk.riskScore = computed.inherentScore;
          risk.impactScore = computed.impact;
          risk.inherentLevel = computed.inherentLevel;
          risk.severityLevel = computed.inherentLevel;
          if (!risk.residualOverridden) risk.residualScore = computed.residualScore;
          risk.residualLevel = computed.residualLevel;
          writeHistory(risk, prev, {
            inherent: risk.riskScore,
            residual: risk.residualScore,
            suggested: computed.residualScore,
            methodVersion: Number(param?.methodVersion) || 1,
            method: param?.riskScoreMethod || "multiplicative",
          }, "system:rebaseline");
          job.records.push({
            risk_id: risk._id,
            riskId: risk.riskId,
            title: risk.title,
            previousScore: prev.inherent,
            newScore: risk.riskScore,
            suggestedResidual: computed.residualScore,
            reason: "score re-based to parameter method version",
          });
        }
        risk.suggestedResidual = computed.residualScore;
        risk.calculatedResidualScore = computed.residualScore;
        risk.residualLikelihood = computed.impact;
        risk.residualImpact = computed.impact;
        risk.combinedCE = computed.combinedCE;
        risk.methodVersionAtAssessment = Number(param?.methodVersion) || 1;
        risk.scoredWithParameter = computed.scoredWithParameter;
        cursor += 1;
      }
      job.processed = cursor;
      job.progress = Math.round((cursor / Math.max(1, targets.length)) * 100);
      if (cursor < targets.length) {
        setTimeout(run, 10);
      } else {
        job.status = "done";
        job.finished_at = new Date().toISOString();
      }
    };
    setTimeout(run, 10);
    return json(res, 200, job);
  }
  if (parts.length === 2 && parts[0] === "risk-score-history" && method === "GET") {
    const rows = RISK_SCORE_HISTORY.filter((h) => h.risk_id === parts[1]).sort(
      (a, b) => new Date(b.changed_at) - new Date(a.changed_at)
    );
    return json(res, 200, { items: rows, total: rows.length });
  }

  if (path === "risks/preview-score" && method === "POST") {
    const body = await readBody(req);
    const domainId = body.domain?._id || body.domain || "d-4";
    const param = PARAMETERS.find((p) => String(p.domain?._id) === String(domainId));
    if (!param) return json(res, 400, { message: "No active parameter found for this domain." });

    // Build criteria scores from impacts
    const criteriaScores = {};
    for (const i of normalizeImpacts(body.impacts)) {
      criteriaScores[i.name] = i.value;
    }

    // Build risk controls from linkedControls
    const riskControls = (body.linkedControls || []).map((c) => ({
      controlId: c.controlId,
      controlName: c.controlName || "Control",
      effectiveness: c.effectiveness != null ? Number(c.effectiveness) : (c.testedEffectiveness || (c.effectivenessRating === "Effective" ? 75 : c.effectivenessRating === "Partially Effective" ? 50 : 25)),
      relevance: c.relevance != null ? Number(c.relevance) : 0.95,
      weight: c.weight != null ? Number(c.weight) : (1 / (body.linkedControls.length || 1)),
      role: c.role || "both",
      relationship: c.relationship || "independent",
    }));

    // Use new RiskEngine
    const engine = new NewRiskEngine(param);
    const result = engine.calculate({
      criteriaScores,
      likelihood: Number(body.likelihood),
      riskControls,
      calculatedBy: req.user?.username || "system",
    });

    if (!result.success) {
      return json(res, 422, { message: result.errors.join(", ") });
    }

    const domain = DOMAINS.find((d) => d._id === domainId);
    const escalationPath = domain?.escalationMatrix?.[result.result.inherentLevel] || "Risk Owner";

    return json(res, 200, {
      ...result.result,
      escalationPath,
      parameterVersion: Number(param.methodVersion) || 1,
      appetiteLimit: param.appetiteLimit,
      toleranceLimit: param.toleranceLimit,
    });
  }

  if (path === "risks" && method === "POST") {
    const body = await readBody(req);
    if (body.riskId) return json(res, 400, { message: "riskId is generated by the server and cannot be provided by the client." });
    if (body.computed) return json(res, 400, { message: "Computed fields are managed by the server and cannot be provided by the client." });
    if (!body.title) return json(res, 400, { message: "title is required" });
    if (!body.likelihood) return json(res, 400, { message: "likelihood is required" });
    if (!body.treatmentDecision) return json(res, 400, { message: "treatmentDecision is required (Modify, Retain, Avoid, Share)" });
    const domainId = body.domain?._id || body.domain || "d-4";
    const domain = DOMAINS.find((d) => d._id === domainId);
    const param = PARAMETERS.find((p) => String(p.domain?._id) === String(domainId));
    if (!param) return json(res, 400, { message: "No active parameter found for this domain." });
    const impactsObj = {};
    for (const i of normalizeImpacts(body.impacts)) impactsObj[i.name] = i.value;
    const existingLinks = LINKS.filter((l) => l.risk_id === body._id);
    const linkedControls = existingLinks.map((l) => ({
      controlId: l.control_id,
      effectivenessRating: l.effectiveness || "Not Assessed",
      testedEffectiveness: l.testedEffectiveness ?? null,
    }));
    const criteriaWeights = body.criteriaWeights || {};
    const riskParam = {
      ...param,
      criteria: (param.criteria || []).map((c) => ({
        ...c,
        weight: criteriaWeights[c.name] != null ? Number(criteriaWeights[c.name]) : Number(c.weight) || 0.125,
      })),
    };
    let computed;
    try {
      computed = computeRiskScore({
        likelihood: Number(body.likelihood),
        impacts: impactsObj,
        parameter: riskParam,
        linkedControls,
      });
    } catch (err) {
      return json(res, 422, { message: err.message });
    }
    const escalationPath = domain?.escalationMatrix?.[computed.inherentLevel] || "Risk Owner";
    const lastNum = RISKS.reduce((max, r) => {
      const n = Number((r.riskId || "").replace(/^R-/, ""));
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 0);
    const next = {
      _id: newId("risk"),
      riskId: `R-${String(lastNum + 1).padStart(3, "0")}`,
      title: body.title,
      description: body.description || "",
      process: body.process || "",
      subProcess: body.subProcess || "",
      riskCategory: body.riskCategory || "",
      assetSystem: body.assetSystem || "",
      threat: body.threat || "",
      vulnerability: body.vulnerability || "",
      riskOwnerId: body.riskOwnerId || user.username,
      ownerTeam: body.ownerTeam || "",
      riskSource: body.riskSource || "",
      dateIdentified: body.dateIdentified || new Date().toISOString().slice(0, 10),
      likelihood: Number(body.likelihood),
      impacts: normalizeImpacts(body.impacts),
      impactScore: computed.impact,
      riskScore: computed.inherentScore,
      inherentScore: computed.inherentScore,
      inherentLevel: computed.inherentLevel,
      impact: computed.impact,
      combinedCE: computed.combinedCE,
      effectiveCE: computed.effectiveCE,
      maximumRiskReduction: computed.maximumRiskReduction,
      residualScore: computed.residualScore,
      residualLevel: computed.residualLevel,
      residualLikelihood: computed.residualLikelihood,
      residualImpact: computed.residualImpact,
      appetiteStatus: computed.appetiteStatus,
      calculationTrace: computed.calculationTrace,
      escalationPath,
      domain: domain ? { _id: domain._id, name: domain.name } : null,
      parameter: body.parameter || null,
      treatmentDecision: body.treatmentDecision || "Modify",
      treatmentActions: body.treatmentActions || "",
      estimatedBudget: body.estimatedBudget ?? null,
      plannedControls: body.plannedControls || [],
      treatmentOwnerId: body.treatmentOwnerId || user.username,
      targetDate: body.targetDate || daysAhead(30),
      reviewFrequency: body.reviewFrequency || "Quarterly",
      acceptanceJustification: body.acceptanceJustification || null,
      nextReviewDate: body.nextReviewDate || daysAhead(90),
      riskOwnerSignOff: body.riskOwnerSignOff || null,
      attachments: body.attachments || [],
      status: body.status || "Open",
      mitigationActions: body.mitigationActions || "",
      deadline: body.deadline || daysAhead(30),
      asset: body.asset || null,
      treatmentOwner: body.treatmentOwner || user.username,
      treatmentDueDate: body.deadline || daysAhead(30),
      treatmentEffectiveness: body.treatmentEffectiveness || "Not Assessed",
      createdAt: new Date().toISOString(),
      closedAt: null,
      methodVersionAtAssessment: Number(param.methodVersion) || 1,
      suggestedResidual: computed.residualScore,
      calculatedResidualScore: computed.residualScore,
      residualLikelihood: computed.impact,
      residualImpact: computed.impact,
      combinedCE: computed.combinedCE,
      residualJustification: null,
      overriddenBy: null,
      overriddenAt: null,
      residualOverridden: false,
      overallRisk: computed.residualLevel,
      lastAssessedAt: new Date().toISOString(),
      nextReassessmentDue: null,
      changeTriggerPending: false,
      changeTriggerReason: null,
      requiresSecondApproval: false,
      secondApprovedBy: null,
      secondApprovedAt: null,
      acceptedBy: null,
      acceptedAt: null,
      acceptanceEnteredBy: null,
      acceptanceAuthorityLevel: null,
      scoredWithParameter: computed.scoredWithParameter,
    };
    if (next.acceptanceJustification && (next.acceptanceJustification || "").trim().length < 30) {
      return json(res, 422, { message: "acceptanceJustification must be at least 30 characters when provided." });
    }
    if (body.treatmentDecision === "Accept" || body.treatmentDecision === "Retain") {
      if (!next.acceptanceJustification && computed.residualScore > (param.appetiteLimit || 25)) {
        return json(res, 422, { message: `acceptanceJustification is required when residual score (${computed.residualScore}) exceeds appetite (${param.appetiteLimit || 25}).` });
      }
    }
    RISKS.push(next);
    return json(res, 200, next);
  }
  if (parts.length === 3 && parts[0] === "risks" && parts[2] === "approve-override" && method === "PUT") {
    const risk = RISKS.find((r) => r._id === parts[1]);
    if (!risk) return json(res, 404, { message: "Not found" });
    if (!risk.requiresSecondApproval) return json(res, 422, { message: "No override is pending second approval on this risk." });
    if (!risk.overriddenBy) return json(res, 422, { message: "No override recorded on this risk." });
    if (user.username === risk.overriddenBy) return json(res, 422, { message: "The user who made the override cannot self-approve it." });
    if (authorityLevel(user) < 1) return json(res, 422, { message: "Second approval requires a role of risk owner or above." });
    risk.requiresSecondApproval = false;
    risk.secondApprovedBy = user.username;
    risk.secondApprovedAt = new Date().toISOString();
    return json(res, 200, withJoins(risk));
  }

  if (parts.length === 3 && parts[0] === "risks" && parts[2] === "override-residual" && method === "POST") {
    const risk = RISKS.find((r) => r._id === parts[1]);
    if (!risk) return json(res, 404, { message: "Not found" });
    const body = await readBody(req);
    const requested = Number(body.manual_residual_score);
    if (!Number.isFinite(requested) || requested < 1 || requested > 25)
      return json(res, 422, { message: "manual_residual_score must be an integer between 1 and 25." });
    const justification = String(body.justification || "").trim();
    if (justification.length < 30)
      return json(res, 422, { message: "Override requires a written justification of at least 30 characters (ISO 27005 accepted-exposure record)." });
    const param = paramOf(risk);
    risk.residualScore = Math.round(requested);
    risk.residualLevel = levelOf(risk.residualScore, param?.thresholds);
    risk.residualOverridden = true;
    risk.residualJustification = justification;
    risk.overriddenBy = user.username;
    risk.overriddenAt = new Date().toISOString();
    risk.overallRisk = risk.residualLevel;
    risk.lastAssessedAt = new Date().toISOString();
    risk.methodVersionAtAssessment = Number(param?.methodVersion) || 1;
    const prev = { inherent: risk.riskScore, residual: risk.calculatedResidualScore ?? risk.riskScore };
    writeHistory(risk, prev, {
      inherent: risk.riskScore,
      residual: risk.residualScore,
      suggested: risk.calculatedResidualScore ?? risk.suggestedResidual,
      methodVersion: Number(param?.methodVersion) || 1,
      method: param?.riskScoreMethod || "multiplicative",
    }, user.username, justification);
    pushRiskAudit(risk, "RESIDUAL_SCORE_OVERRIDDEN", user, { entityType: "risk", manualScore: risk.residualScore, calculatedScore: risk.calculatedResidualScore, justification });
    return json(res, 200, withJoins(risk));
  }

  if (parts.length === 3 && parts[0] === "risks" && parts[2] === "reset-residual" && method === "POST") {
    const risk = RISKS.find((r) => r._id === parts[1]);
    if (!risk) return json(res, 404, { message: "Not found" });
    if (!risk.residualOverridden) return json(res, 422, { message: "Residual is already control-calculated — nothing to reset." });
    risk.residualOverridden = false;
    risk.residualJustification = null;
    risk.overriddenBy = null;
    risk.overriddenAt = null;
    refreshRiskScores(risk._id);
    risk.overallRisk = risk.residualLevel;
    pushRiskAudit(risk, "RESIDUAL_SCORE_RESET", user, { entityType: "risk", residualScore: risk.residualScore, calculatedScore: risk.calculatedResidualScore });
    return json(res, 200, withJoins(risk));
  }

  if (parts.length === 2 && parts[0] === "risks" && method === "PUT") {
    const risk = RISKS.find((r) => r._id === parts[1]);
    if (!risk) return json(res, 404, { message: "Not found" });
    const body = await readBody(req);
    if (body.computed) return json(res, 400, { message: "Computed fields are managed by the server and cannot be provided by the client." });
    if (body.status === "Closed" && risk.status !== "Closed") {
      const review = MANAGEMENT_REVIEWS?.find?.((m) => m.risk && (m.risk._id === risk._id || m.risk === risk._id));
      if (!review) return json(res, 422, { message: "Close requires a completed management review. Record the review outcome first, then re-attempt the close." });
    }
    const prev = { inherent: risk.riskScore, residual: risk.residualScore };
    let change = 0;
    if (body.title) { risk.title = body.title; change = 1; }
    if (body.description !== undefined) { risk.description = body.description; change = 1; }
    if (body.likelihood != null) { risk.likelihood = Number(body.likelihood); change = 1; }
    if (body.impacts) {
      risk.impacts = normalizeImpacts(body.impacts);
      change = 1;
    }
    if (body.status) { risk.status = body.status; change = 1; }
    if (body.status === "Closed") risk.closedAt = risk.closedAt || new Date().toISOString();
    if (body.treatmentDecision) { risk.treatmentDecision = body.treatmentDecision; change = 1; }
    if (body.treatmentActions !== undefined) { risk.treatmentActions = body.treatmentActions; }
    if (body.estimatedBudget != null) risk.estimatedBudget = Number(body.estimatedBudget);
    if (body.plannedControls !== undefined) risk.plannedControls = body.plannedControls;
    if (body.treatmentOwnerId) { risk.treatmentOwnerId = body.treatmentOwnerId; }
    if (body.targetDate) { risk.targetDate = body.targetDate; }
    if (body.reviewFrequency) { risk.reviewFrequency = body.reviewFrequency; }
    if (body.acceptanceJustification !== undefined) { risk.acceptanceJustification = body.acceptanceJustification || null; }
    if (body.nextReviewDate) { risk.nextReviewDate = body.nextReviewDate; }
    if (body.riskOwnerSignOff !== undefined) { risk.riskOwnerSignOff = body.riskOwnerSignOff; }
    if (body.attachments !== undefined) { risk.attachments = body.attachments; }
    if (body.category) { risk.category = body.category; change = 1; }
    if (body.threat !== null) risk.threat = body.threat;
    if (body.vulnerability !== null) risk.vulnerability = body.vulnerability;
    if (body.process != null) risk.process = body.process;
    if (body.subProcess != null) risk.subProcess = body.subProcess;
    if (body.ownerTeam != null) risk.ownerTeam = body.ownerTeam;
    if (body.assetSystem != null) risk.assetSystem = body.assetSystem;
    if (body.mitigationActions != null) risk.mitigationActions = body.mitigationActions;
    if (body.owner != null) risk.owner = body.owner;
    if (body.treatmentOwner != null) risk.treatmentOwner = body.treatmentOwner;
    if (body.treatmentDueDate != null) risk.treatmentDueDate = body.treatmentDueDate;
    if (body.deadline != null) risk.deadline = body.deadline;
    if (body.riskDate != null) risk.riskDate = body.riskDate;

    const param = paramOf(risk);
    const impactsObj = {};
    for (const i of risk.impacts || []) impactsObj[i.name] = i.value;
    const existingLinks = LINKS.filter((l) => l.risk_id === risk._id);
    const linkedControls = existingLinks.map((l) => ({
      controlId: l.control_id,
      effectivenessRating: l.effectiveness || "Not Assessed",
      testedEffectiveness: l.testedEffectiveness ?? null,
    }));
    const criteriaWeights = body.criteriaWeights || {};
    const riskParam = {
      ...param,
      criteria: (param.criteria || []).map((c) => ({
        ...c,
        weight: criteriaWeights[c.name] != null ? Number(criteriaWeights[c.name]) : Number(c.weight) || 0.125,
      })),
    };

    let computed;
    try {
      computed = computeRiskScore({
        likelihood: risk.likelihood,
        impacts: impactsObj,
        parameter: riskParam,
        linkedControls,
      });
    } catch (err) {
      return json(res, 422, { message: err.message });
    }

    const domain = DOMAINS.find((d) => d._id === risk.domain?._id);
    const escalationPath = domain?.escalationMatrix?.[computed.inherentLevel] || "Risk Owner";

    const inherentChanged = change === 1 && computed.inherentScore !== prev.inherent;
    if (inherentChanged) {
      risk.impactScore = computed.impact;
      risk.riskScore = computed.inherentScore;
      risk.inherentLevel = computed.inherentLevel;
      risk.severityLevel = computed.inherentLevel;
      risk.escalationPath = escalationPath;
      risk.methodVersionAtAssessment = Number(param?.methodVersion) || 1;
      risk.overallRisk = computed.inherentLevel;
      risk.scoredWithParameter = computed.scoredWithParameter;
    }

    risk.residualScore = computed.residualScore;
    risk.residualLevel = computed.residualLevel;
    risk.suggestedResidual = computed.residualScore;
    risk.calculatedResidualScore = computed.residualScore;
    risk.residualLikelihood = computed.impact;
    risk.residualImpact = computed.impact;
    risk.combinedCE = computed.combinedCE;

    const rescored = inherentChanged;
    if (rescored) {
      risk.lastAssessedAt = new Date().toISOString();
      risk.methodVersionAtAssessment = Number(param?.methodVersion) || 1;
      risk.changeTriggerPending = false;
      risk.changeTriggerReason = null;
      writeHistory(risk, prev, {
        inherent: risk.riskScore,
        residual: risk.residualScore,
        suggested: computed.residualScore,
        methodVersion: Number(param?.methodVersion) || 1,
        method: param?.riskScoreMethod || "multiplicative",
      }, user.username, body.residualJustification);
    }

    if (body.treatmentDecision) {
      if (body.treatmentDecision === "Accept" || body.treatmentDecision === "Retain") {
        const accepted = USERS.find((u) => u._id === body.acceptedBy || u.username === body.acceptedBy);
        const level = risk.inherentLevel;
        if (!accepted)
          return json(res, 422, {
            message: "Treatment 'Accept' requires a formal acceptance sign-off. Select who accepts the residual exposure.",
            requiredAuthority: requiredAuthorityLabel(level),
            currentUserRole: user?.role,
          });
        if (authorityLevel(accepted) < requiredAuthorityFor(level))
          return json(res, 422, {
            message: `This risk requires ${requiredAuthorityLabel(level)} acceptance. Route to ${requiredApprover()?.fullName || "a senior approver"} for approval.`,
            requiredAuthority: requiredAuthorityLabel(level),
            currentUserRole: user?.role,
            suggestedAction: "pending_acceptance",
            requiredApproverName: requiredApprover()?.fullName || requiredApprover()?.username || null,
          });
        risk.acceptedBy = accepted._id;
        risk.acceptedAt = new Date().toISOString();
        risk.acceptanceEnteredBy = user.username;
        risk.acceptanceAuthorityLevel = requiredAuthorityLabel(level);
      } else {
        risk.acceptedBy = null;
        risk.acceptedAt = null;
        risk.acceptanceEnteredBy = null;
        risk.acceptanceAuthorityLevel = null;
      }
    }
    return json(res, 200, withJoins(risk));
  }

  if (path === "parameters" && method === "PUT") {
    return json(res, 405, { message: "Use PUT /parameters/:id" });
  }
  if (parts.length === 2 && parts[0] === "parameters" && method === "PUT") {
    if (authorityLevel(user) < 2) return json(res, 403, { message: "Only ciso, cro or board roles may modify risk-scoring parameters." });
    const param = PARAMETERS.find((p) => p._id === parts[1]);
    if (!param) return json(res, 404, { message: "Not found" });
    const body = await readBody(req);
    if (body.riskScoreMethod === "weighted_additive") {
      const w = body.riskScoreWeights || param.riskScoreWeights;
      const sum = (Number(w.likelihood) || 0) + (Number(w.impact) || 0);
      if (Math.abs(sum - 1) > 0.001) return json(res, 422, { message: "weighted_additive requires likelihood + impact weights to sum to 1." });
    }
    if (body.riskScoreMethod === "matrix_lookup") {
      const t = body.matrixLookupTable;
      const filled = Array.isArray(t) && t.length === 5 && t.every((row) => Array.isArray(row) && row.length === 5 && row.every((c) => Number.isFinite(Number(c))));
      if (!filled) return json(res, 422, { message: "matrix_lookup requires a fully populated 5x5 numeric table." });
    }
    const scoringChanged =
      (body.riskScoreMethod && body.riskScoreMethod !== param.riskScoreMethod) ||
      (body.riskScoreWeights && JSON.stringify(body.riskScoreWeights) !== JSON.stringify(param.riskScoreWeights)) ||
      (body.matrixLookupTable && JSON.stringify(body.matrixLookupTable) !== JSON.stringify(param.matrixLookupTable)) ||
      (body.thresholds && JSON.stringify(body.thresholds) !== JSON.stringify(param.thresholds)) ||
      (body.criteria && JSON.stringify(body.criteria) !== JSON.stringify(param.criteria)) ||
      (body.scoringMethod && body.scoringMethod !== param.scoringMethod) ||
      (body.residualCapReduction != null && Number(body.residualCapReduction) !== Number(param.residualCapReduction)) ||
      (body.controlEffectivenessWeights && JSON.stringify(body.controlEffectivenessWeights) !== JSON.stringify(param.controlEffectivenessWeights)) ||
      (body.appetiteLimit != null && Number(body.appetiteLimit) !== Number(param.appetiteLimit));
    const versionBump = scoringChanged;
    if (scoringChanged && !param.versionHistory) param.versionHistory = [];
    if (scoringChanged) {
      param.versionHistory.unshift({
        version_number: Number(param.methodVersion) || 1,
        impact_weights: JSON.parse(JSON.stringify(param.criteria || null)),
        severity_thresholds: JSON.parse(JSON.stringify(param.thresholds || null)),
        scoring_method: param.riskScoreMethod || "multiplicative",
        appetite_limit: param.appetiteLimit ?? null,
        effective_from: new Date().toISOString(),
        created_by: user.username,
        created_at: new Date().toISOString(),
      });
    }
    if (body.riskScoreMethod) param.riskScoreMethod = body.riskScoreMethod;
    if (body.riskScoreWeights) param.riskScoreWeights = body.riskScoreWeights;
    if (body.matrixLookupTable) param.matrixLookupTable = body.matrixLookupTable;
    if (body.thresholds) param.thresholds = body.thresholds;
    if (body.residualCapReduction != null) param.residualCapReduction = body.residualCapReduction;
    if (body.controlEffectivenessWeights) param.controlEffectivenessWeights = body.controlEffectivenessWeights;
    if (body.scoringMethod) param.scoringMethod = body.scoringMethod;
    if (body.criteria) param.criteria = body.criteria;
    if (body.name) param.name = body.name;
    if (body.status) param.status = body.status;
    if (body.appetiteLimit != null) param.appetiteLimit = body.appetiteLimit;
    if (versionBump) {
      param.methodVersion = (Number(param.methodVersion) || 1) + 1;
      param.lastChangedBy = user.username;
      param.lastChangedAt = new Date().toISOString();
    }
    return json(res, 200, {
      ...param,
      rebaselineRequired: RISKS.filter((r) => pendingRebaselineOf(r) && paramOf(r)?._id === param._id).length,
    });
  }

  if (parts.length === 3 && parts[0] === "parameters" && parts[2] === "preview" && method === "GET") {
    const param = PARAMETERS.find((p) => p._id === parts[1]);
    if (!param) return json(res, 404, { message: "Not found" });
    let candidateThresholds = param.thresholds;
    let candidateCriteria = param.criteria;
    let candidateMethod = param.riskScoreMethod;
    let candidateWeights = param.riskScoreWeights;
    try {
      if (query.thresholds) candidateThresholds = JSON.parse(query.thresholds);
      if (query.criteria) candidateCriteria = JSON.parse(query.criteria);
      if (query.riskScoreMethod) candidateMethod = query.riskScoreMethod;
      if (query.riskScoreWeights) candidateWeights = JSON.parse(query.riskScoreWeights);
    } catch {
      return json(res, 400, { message: "Invalid preview parameters (expected JSON-encoded query values)." });
    }
    const levelWith = (score, t) => {
      const n = Number(score) || 0;
      if (n >= (Number(t?.critical) || 0)) return "Critical";
      if (n >= (Number(t?.high) || 0)) return "High";
      if (n >= (Number(t?.medium) || 0)) return "Medium";
      return "Low";
    };
    const items = [];
    for (const r of RISKS) {
      const p = paramOf(r);
      if (p?._id !== param._id) continue;
      const impactsObj = {};
      for (const i of r.impacts || []) impactsObj[i.name] = i.value;
      const existingLinks = LINKS.filter((l) => l.risk_id === r._id);
      const linkedControls = existingLinks.map((l) => ({
        controlId: l.control_id,
        effectivenessRating: l.effectiveness || "Not Assessed",
      }));
      const candidateParam = {
        ...param,
        criteria: candidateCriteria,
        riskScoreMethod: candidateMethod,
        riskScoreWeights: candidateWeights,
        thresholds: candidateThresholds,
      };
      let computed;
      try {
        computed = computeRiskScore({
          likelihood: r.likelihood,
          impacts: impactsObj,
          parameter: candidateParam,
          linkedControls,
        });
      } catch {
        continue;
      }
      const oldLevel = levelWith(r.riskScore, param.thresholds);
      const newLevel = levelWith(computed.inherentScore, candidateThresholds);
      if (oldLevel !== newLevel) {
        items.push({
          risk_id: r._id,
          riskId: r.riskId,
          title: r.title,
          old_score: r.riskScore,
          new_score: computed.inherentScore,
          old_level: oldLevel,
          new_level: newLevel,
        });
      }
    }
    const severityRank = { Critical: 3, High: 2, Medium: 1, Low: 0 };
    const counts = { up: 0, down: 0 };
    for (const it of items) {
      if ((severityRank[it.new_level] ?? 0) > (severityRank[it.old_level] ?? 0)) counts.up += 1;
      else counts.down += 1;
    }
    return json(res, 200, {
      parameter_id: param._id,
      would_change: items.slice(0, 200),
      counts,
      total_changes: items.length,
      candidate: { thresholds: candidateThresholds, criteria: candidateCriteria, riskScoreMethod: candidateMethod, riskScoreWeights: candidateWeights },
      message: items.length
        ? `${items.length} risk${items.length === 1 ? "" : "s"} would change severity band (${counts.up} up, ${counts.down} down).`
        : "No risks would change severity band under the proposed values.",
    });
  }

  if (path === "dashboard/summary" && method === "GET") return json(res, 200, dashboardSummary());
  if (path === "ai/insights" && method === "GET") return json(res, 200, aiInsights());

  if (path === "assets/export") {
    const csv = ["name,type,owner,location,criticality,status,domain", ...ASSETS.map((a) => [a.name, a.type, a.owner, a.location, a.criticality, a.status, a.domain].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    res.writeHead(200, { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="assets.csv"' });
    return res.end(csv);
  }
  if (path === "assets/import" && method === "POST") {
    return json(res, 200, { imported: 0, errors: [], message: "Import accepted (demo server: no rows parsed)." });
  }

  if (path.startsWith("context/organizations/")) {
    const rest = parts.slice(2);
    if (rest.length === 2 && rest[1] === "hierarchy") {
      const org = ORGANIZATIONS.find((o) => o._id === rest[0]);
      if (!org) return json(res, 404, { message: "Not found" });
      return json(res, 200, { items: ORGANIZATIONS, tree: org });
    }
    if (rest.length === 2 && rest[1] === "rollup") {
      return json(res, 200, { counts: { risks: RISKS.length, assets: ASSETS.length, domains: DOMAINS.length, organizations: ORGANIZATIONS.length, controls: CONTROLS.length } });
    }
  }

  if (path === "governance/executive-dashboard" && method === "GET") {
    const today = new Date();
    const now = Date.now();
    const implemented = CONTROLS.filter((c) => c.implementationStatus === "Fully Implemented" || c.implementationStatus === "Largely Implemented").length;
    const compliancePercent = CONTROLS.length ? Math.round((implemented / CONTROLS.length) * 100) : 0;
    const openGaps = GAPS.filter((g) => g.status !== "Closed");
    const openFindings = AUDIT_FINDINGS.filter((f) => f.status !== "Closed");
    const severityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    const topItems = [
      ...openGaps.map((g) => ({ kind: "Gap", ref: g.gapId, title: g.description, severity: g.severity, owner: g.owner, dueDate: g.dueDate, link: "/compliance/gaps" })),
      ...openFindings.map((f) => ({ kind: "Finding", ref: f.findingId, title: f.title, severity: f.severity, owner: f.owner, dueDate: f.dueDate, link: "/audit/manage" })),
    ].sort((a, b) => (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9)).slice(0, 8);
    const trend = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const bucket = CONTROLS.filter((c) => c.createdAt && `${new Date(c.createdAt).getFullYear()}-${new Date(c.createdAt).getMonth()}` === `${d.getFullYear()}-${d.getMonth()}`);
      trend.push({
        month: d.toLocaleString("en", { month: "short" }),
        percent: bucket.length
          ? Math.round((bucket.filter((c) => c.implementationStatus === "Fully Implemented" || c.implementationStatus === "Largely Implemented").length / bucket.length) * 100)
          : null,
      });
    }
    const auditsByStage = ["Planning", "Fieldwork", "Findings Review", "Reporting", "CAPA", "Closed"].map((name) => ({
      name,
      value: AUDIT_ENGAGEMENTS.filter((e) => e.stage === name).length,
    }));
    const pub = POLICIES.filter((p) => p.status === "Published");
    const soon = new Date(now + 90 * 86400000);
    const policyHealth = {
      overdue: pub.filter((p) => p.nextReviewDate && new Date(p.nextReviewDate) < today).length,
      dueSoon: pub.filter((p) => p.nextReviewDate && new Date(p.nextReviewDate) >= today && new Date(p.nextReviewDate) <= soon).length,
      upcomingReviews: [...pub]
        .sort((a, b) => new Date(a.nextReviewDate || 0) - new Date(b.nextReviewDate || 0))
        .slice(0, 6)
        .map((p) => ({ _id: p._id, policyId: p.policyId, title: p.title, nextReviewAt: p.nextReviewDate })),
    };
    const calendar = [
      ...CONTROLS.filter((c) => c.nextTestDueAt && new Date(c.nextTestDueAt) >= today).map((c) => ({ kind: "control-test", date: c.nextTestDueAt, label: `Control test — ${c.name}`, link: "/compliance/controls" })),
      ...AUDIT_ENGAGEMENTS.filter((e) => e.plannedStart && new Date(e.plannedStart) >= today).map((e) => ({ kind: "audit", date: e.plannedStart, label: e.title, link: "/audit/active" })),
      ...AUDIT_CAPAS.filter((c) => c.dueDate && new Date(c.dueDate) >= today).map((c) => ({ kind: "followup", date: c.dueDate, label: `CAPA due — ${c.title}`, link: "/audit/manage" })),
      ...COMMITTEES.flatMap((cm) => (cm.meetings || []).filter((m) => m.date && new Date(m.date) >= today).map((m) => ({ kind: "committee", date: m.date, label: `${cm.name} — ${m.title || "meeting"}`, link: "/governance/committees" }))),
    ].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 10);
    const publishedCount = pub.length;
    const attestedPublished = pub.filter((p) => getNested(`policies::${p._id}::attestations`).length > 0).length;
    const allExceptions = POLICIES.flatMap((p) =>
      getNested(`policies::${p._id}::exceptions`).map((e) => ({ ...e, policyId: p.policyId, policyTitle: p.title }))
    );
    const openExceptions = allExceptions.filter((e) => e.status === "Pending");
    const byCategory = {};
    for (const p of POLICIES) byCategory[p.category || "Uncategorized"] = (byCategory[p.category || "Uncategorized"] || 0) + 1;
    const policiesByCategory = Object.entries(byCategory).map(([category, count]) => ({ category, count }));
    const upcomingReviews = [...pub]
      .filter((p) => p.nextReviewDate && new Date(p.nextReviewDate) >= today)
      .sort((a, b) => new Date(a.nextReviewDate) - new Date(b.nextReviewDate))
      .slice(0, 8)
      .map((p) => ({ _id: p._id, policyId: p.policyId, title: p.title, nextReviewAt: p.nextReviewDate }));
    const recentWorkflowActivity = POLICY_WORKFLOW_EVENTS.slice(-10).reverse();
    return json(res, 200, {
      kpis: {
        compliancePercent,
        openCriticalFindings: GAPS.filter((g) => (g.severity === "Critical" || g.severity === "High") && g.status !== "Closed").length,
        policiesPendingApproval: POLICIES.filter((p) => ["Review", "Pending Review", "Approval", "Pending Approval"].includes(p.status)).length,
        overdueCapas: AUDIT_CAPAS.filter((c) => c.dueDate && new Date(c.dueDate) < today && c.status !== "Closed").length,
        auditsInProgress: AUDIT_ENGAGEMENTS.filter((e) => e.stage !== "Closed").length,
        activeExceptionTypes: EXCEPTION_TYPES.filter((t) => t.status === "Active").length,
        totalPolicies: POLICIES.length,
        published: publishedCount,
        pendingReview: POLICIES.filter((p) => ["Review", "Pending Review"].includes(p.status)).length,
        pendingApproval: POLICIES.filter((p) => ["Approval", "Pending Approval"].includes(p.status)).length,
        overdueReviews: policyHealth.overdue,
        attestationCompletionPercent: publishedCount ? Math.round((attestedPublished / publishedCount) * 100) : 0,
        openExceptionsCount: openExceptions.length,
        expiringExceptionsCount: openExceptions.filter((e) => e.expiresAt && new Date(e.expiresAt) <= soon).length,
      },
      trend,
      auditsByStage,
      topItems,
      policyHealth,
      calendar,
      policiesByCategory,
      upcomingReviews,
      recentWorkflowActivity,
      openExceptions: openExceptions.slice(0, 8),
    });
  }

  if (path === "governance/document-program") {
    if (method === "GET") return json(res, 200, DOCUMENT_PROGRAM);
    if (method === "PUT") {
      Object.assign(DOCUMENT_PROGRAM, await readBody(req));
      return json(res, 200, { ok: true, data: DOCUMENT_PROGRAM });
    }
  }

  if (path === "email/status") return json(res, 200, { connected: true, host: EMAIL_CONFIG.host, port: EMAIL_CONFIG.port, user: EMAIL_CONFIG.user, secure: EMAIL_CONFIG.secure, lastTestAt: daysAgo(1) });
  if (path === "email/recent") return json(res, 200, { items: EMAIL_MESSAGES.slice(0, 5) });
  if (path === "email/config") {
    if (method === "GET") return json(res, 200, { config: EMAIL_CONFIG });
    if (method === "PUT") { Object.assign(EMAIL_CONFIG, await readBody(req)); return json(res, 200, { ok: true, config: EMAIL_CONFIG }); }
  }
  if (path === "email/disconnect" && method === "POST") return json(res, 200, { ok: true });
  if (path === "email/test" && method === "POST") return json(res, 200, { ok: true, messageId: `test-${Date.now()}` });
  if (path === "email/attachments" && method === "POST") return json(res, 200, { data: { name: "attachment", url: "", size: 0 } });
  if (parts.length === 4 && parts[0] === "email" && parts[1] === "messages" && parts[3] === "send" && method === "POST") {
    const msg = EMAIL_MESSAGES.find((m) => m._id === parts[2]);
    if (!msg) return json(res, 404, { message: "Not found" });
    msg.status = "Sent";
    msg.sentAt = new Date().toISOString();
    return json(res, 200, msg);
  }

  if (path === "backup/config") {
    if (method === "GET") return json(res, 200, BACKUP_CONFIG);
    if (method === "PUT") { Object.assign(BACKUP_CONFIG, await readBody(req)); return json(res, 200, { ok: true, data: BACKUP_CONFIG }); }
  }
  if (path === "backup/run" && method === "POST") {
    const rec = { _id: newId("bk"), filename: `wadjet-grc-${new Date().toISOString().slice(0, 10)}.zip`, size: "0.2 MB", status: "Completed", createdAt: new Date().toISOString() };
    BACKUP_RECORDS.unshift(rec);
    BACKUP_CONFIG.lastRunAt = rec.createdAt;
    return json(res, 200, { ok: true, record: rec });
  }

  if (path === "backup/records" && method === "GET") return json(res, 200, { items: BACKUP_RECORDS, total: BACKUP_RECORDS.length });
  const bkDownload = parts.length === 4 && parts[0] === "backup" && parts[1] === "records" && parts[3] === "download";
  if (bkDownload) {
    const id = parts[2];
    const rec = BACKUP_RECORDS.find((r) => r._id === id);
    const data = JSON.stringify({ record: rec, generatedAt: new Date().toISOString() }, null, 2);
    res.writeHead(200, { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="${rec ? rec.filename : "backup.json"}"` });
    return res.end(data);
  }
  if (path === "backup/records" && method === "DELETE") {
    const body = await readBody(req);
    const idx = BACKUP_RECORDS.findIndex((r) => r._id === body._id || body.id === r._id);
    if (idx >= 0) BACKUP_RECORDS.splice(idx, 1);
    return json(res, 200, { ok: true });
  }

  if (path === "compliance/controls/stats" && method === "GET") {
    const imp = (s) => CONTROLS.filter((c) => c.implementationStatus === s).length;
    return json(res, 200, {
      total: CONTROLS.length,
      fully: imp("Fully Implemented"),
      largely: imp("Largely Implemented"),
      partial: imp("Partially Implemented"),
      none: imp("Not Implemented") + imp("Planned"),
      overdue: CONTROLS.filter((c) => c.nextTestDueAt && new Date(c.nextTestDueAt) < new Date() && c.testStatus !== "Passed").length,
    });
  }

  if (path === "compliance/gaps/stats" && method === "GET") {
    const ytd = new Date(new Date().getFullYear(), 0, 1);
    return json(res, 200, {
      total: GAPS.length,
      critical: GAPS.filter((g) => (g.severity === "Critical" || g.severity === "High") && g.status !== "Closed").length,
      overdue: GAPS.filter((g) => g.dueDate && new Date(g.dueDate) < new Date() && g.status !== "Closed").length,
      closedThisQuarter: GAPS.filter((g) => g.status === "Closed" && g.closedAt && new Date(g.closedAt) >= ytd).length,
    });
  }

  if (path === "compliance/campaigns/stats" && method === "GET") {
    const all = CAMPAIGNS.flatMap((c) => (c.responses || []).map((r) => ({ ...r, campaign: c })));
    const submitted = all.filter((r) => r.status === "Submitted" || r.status === "Completed").length;
    return json(res, 200, {
      active: CAMPAIGNS.filter((c) => c.status === "Active" || c.status === "In Progress").length,
      pendingResponses: all.length - submitted,
      completionRate: all.length ? Math.round((submitted / all.length) * 100) : 0,
      overdueCampaigns: CAMPAIGNS.filter((c) => c.dueDate && new Date(c.dueDate) < new Date() && c.status !== "Completed").length,
    });
  }

  if (path === "compliance/calendar" && method === "GET") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.max(1, Number(new URL(req.url, "http://x").searchParams.get("days")) || 90);
    const horizon = new Date(today.getTime() + days * 86400000);
    const within = (d) => d && new Date(d) >= today && new Date(d) <= horizon;
    const events = [
      ...CONTROLS.filter((c) => within(c.nextTestDueAt))
        .map((c) => ({ date: c.nextTestDueAt, kind: new Date(c.nextTestDueAt) < new Date() ? "control-overdue" : "control-test", label: `${c.controlId} — ${c.name}`, link: "/compliance/controls", status: c.testStatus || "Due" })),
      ...CAMPAIGNS.filter((c) => within(c.dueDate))
        .map((c) => ({ date: c.dueDate, kind: "campaign", label: `${c.name} — due`, link: "/compliance/campaigns", status: c.status })),
      ...GAPS.filter((g) => within(g.dueDate) && g.status !== "Closed")
        .map((g) => ({ date: g.dueDate, kind: "gap", label: `${g.gapId || "Gap"} — ${String(g.description || "").slice(0, 60)}`, link: "/compliance/gaps", status: g.status })),
      ...FRAMEWORKS.filter((f) => within(f.nextReviewAt))
        .map((f) => ({ date: f.nextReviewAt, kind: "review", label: `${f.name} — review due`, link: "/compliance/frameworks", status: f.status })),
      ...AUDIT_CAPAS.filter((c) => within(c.dueDate) && c.status !== "Closed")
        .map((c) => ({ date: c.dueDate, kind: "gap", label: `CAPA — ${String(c.title || "").slice(0, 60)}`, link: "/audit/manage", status: c.status })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));
    return json(res, 200, { events });
  }

  if (path === "compliance/gap-and-conflict-report" && method === "GET") {
    const { framework_id, type } = query;
    const typeKey = ["uncovered", "conflict", "all"].includes(type) ? type : "all";
    const controlsFor = (c) => {
      const id = String(c.controlId);
      return POLICIES.filter((p) => getNested(`policies::${p._id}::control-mappings`).some((m) => String(m.controlId) === id || String(m.controlId) === String(c._id) || String(m.controlId) === String(c.annexCode)));
    };
    const hasEvidence = (c) => {
      if (getNested(`controls::${c._id}::evidence`).length > 0) return true;
      return controlsFor(c).some((p) => getNested(`policies::${p._id}::evidence`).length > 0);
    };
    const uncovered = [];
    const overlapping = [];
    for (const c of CONTROLS) {
      if (framework_id && String(c.framework?._id) !== String(framework_id)) continue;
      const linked = controlsFor(c);
      const evidence = hasEvidence(c);
      let gapType = null;
      if (linked.length === 0 && !evidence) gapType = "no_policy_and_no_evidence";
      else if (linked.length === 0) gapType = "no_policy";
      else if (!evidence) gapType = "no_evidence";
      if (gapType) {
        uncovered.push({
          control_id: c._id,
          controlId: c.controlId,
          control_name: c.name,
          framework_id: c.framework?._id || null,
          framework_name: c.framework?.name || null,
          gap_type: gapType,
          has_gap: true,
          severity: c.implementationStatus === "Not Implemented" || c.implementationStatus === "Planned" ? "high" : c.implementationStatus === "Partially Implemented" ? "medium" : "low",
          linked_policies: linked.map((p) => ({ policy_id: p._id, policyId: p.policyId, title: p.title })),
        });
      }
      if (linked.length >= 2) {
        overlapping.push({
          control_id: c._id,
          controlId: c.controlId,
          control_name: c.name,
          conflicting_policy_ids: linked.map((p) => p.policyId),
          conflict_type: "duplicate_coverage",
          detected_by: "rule_based",
          policies: linked.map((p) => ({ policy_id: p._id, policyId: p.policyId, title: p.title, status: p.status })),
        });
      }
    }
    const legacy = CONTROLS.filter((c) => controlsFor(c).length === 0 && !hasEvidence(c)).length;
    return json(res, 200, {
      uncovered_controls: typeKey === "all" || typeKey === "uncovered" ? uncovered : [],
      overlapping_policies: typeKey === "all" || typeKey === "conflict" ? overlapping : [],
      generated_at: new Date().toISOString(),
      summary: { total_gaps: uncovered.length, total_conflicts: overlapping.length },
      controlsWithoutPolicyOrEvidenceCount: legacy,
    });
  }

  if (path === "compliance/dashboard" && method === "GET") {
    const implemented = (c) => c.implementationStatus === "Fully Implemented" || c.implementationStatus === "Largely Implemented";
    const domains = [...new Set(CONTROLS.map((c) => c.domain).filter(Boolean))];
    const heatmapFrameworks = FRAMEWORKS.map((f) => ({ id: f._id, name: f.name }));
    const heatmap = domains.map((domain) => {
      const row = { domain };
      for (const f of FRAMEWORKS) {
        const ctrl = CONTROLS.filter((c) => c.domain === domain && c.framework?._id === f._id);
        row[String(f._id)] = ctrl.length ? Math.round((ctrl.filter(implemented).length / ctrl.length) * 100) : null;
      }
      return row;
    });
    const trend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { label: d.toLocaleString("en", { month: "short" }), percent: Math.min(100, 58 + i * 6) };
    });
    const gapsBySeverity = ["Critical", "High", "Medium", "Low"]
      .map((s) => ({ severity: s, count: GAPS.filter((g) => g.severity === s && g.status !== "Closed").length }))
      .filter((g) => g.count > 0);
    const overdueTests = CONTROLS.filter((c) => c.nextTestDueAt && new Date(c.nextTestDueAt) < new Date() && c.testStatus !== "Passed");
    return json(res, 200, { trend, heatmap, heatmapFrameworks, gapsBySeverity, overdueTests });
  }

  if (path === "impact-analysis" && method === "GET") {
    const { entity_type, entity_id } = query;
    if (!entity_type || !entity_id) return json(res, 400, { message: "entity_type and entity_id are required" });
    const levelOfScore = (score) => String(levelOf(Number(score) || 0)).toLowerCase();
    const riskSummary = (r) => ({ risk_id: r._id, riskId: r.riskId, risk_title: r.title, current_score: r.residualScore ?? r.riskScore ?? null, owner: r.owner || r.ownerTeam || null, severityLevel: r.severityLevel || null });
    const controlsOfPolicy = (pol) => {
      const mapped = getNested(`policies::${pol._id}::control-mappings`).map((m) => String(m.controlId));
      return CONTROLS.filter((c) => mapped.includes(String(c.controlId)) || mapped.includes(String(c._id)) || mapped.includes(String(c.annexCode)));
    };
    const policiesOfControl = (c) => POLICIES.filter((p) => getNested(`policies::${p._id}::control-mappings`).some((m) => String(m.controlId) === String(c.controlId) || String(m.controlId) === String(c._id) || String(m.controlId) === String(c.annexCode)));
    const risksOfControls = (controls) => {
      const ids = new Set(controls.map((c) => c._id));
      return LINKS.filter((l) => ids.has(l.control_id)).map((l) => RISKS.find((r) => r._id === l.risk_id)).filter(Boolean);
    };
    let affectedControls = [];
    let affectedRisks = [];
    let affectedFrameworks = [];
    let affectedActiveExceptions = [];
    let entity = null;

    if (entity_type === "policy") {
      entity = POLICIES.find((p) => p._id === entity_id || p.policyId === entity_id);
      if (!entity) return json(res, 404, { message: "Policy not found" });
      affectedControls = controlsOfPolicy(entity);
      affectedRisks = risksOfControls(affectedControls);
      affectedFrameworks = [...new Map(affectedControls.map((c) => [c.framework?._id, c.framework]).filter(([, f]) => f)).values()].map((f) => ({ framework_id: f._id, framework_name: f.name, coverage_drop_estimate: `${affectedControls.filter((c) => c.framework?._id === f._id).length} requirement${affectedControls.filter((c) => c.framework?._id === f._id).length === 1 ? "" : "s"}` }));
      affectedActiveExceptions = getNested(`policies::${entity._id}::exceptions`).filter((x) => x.status === "Pending" || x.status === "Approved").map((x) => ({ exception_id: x._id, status: x.status, type: x.exceptionType || null }));
    } else if (entity_type === "control") {
      entity = CONTROLS.find((c) => c._id === entity_id || c.controlId === entity_id);
      if (!entity) return json(res, 404, { message: "Control not found" });
      affectedControls = [entity];
      affectedRisks = risksOfControls([entity]);
      if (entity.framework) affectedFrameworks = [{ framework_id: entity.framework._id, framework_name: entity.framework.name, coverage_drop_estimate: "1 requirement" }];
      const linkedPolicies = policiesOfControl(entity);
      for (const p of linkedPolicies) {
        for (const x of getNested(`policies::${p._id}::exceptions`)) {
          if (x.status === "Pending" || x.status === "Approved") affectedActiveExceptions.push({ exception_id: x._id, status: x.status, type: x.exceptionType || null });
        }
      }
    } else {
      return json(res, 400, { message: "entity_type must be 'policy' or 'control'" });
    }

    const riskSummaries = affectedRisks.map(riskSummary);
    const worst = riskSummaries.length ? Math.max(...riskSummaries.map((r) => Number(r.current_score) || 0)) : 0;
    const risk_level_if_proceeded = riskSummaries.length ? levelOfScore(worst) : "low";
    return json(res, 200, {
      entity_type,
      entity_id,
      entity_name: entity?.title || entity?.name || null,
      affected_controls: affectedControls.map((c) => ({ control_id: c._id, controlId: c.controlId, control_name: c.name, framework_names: c.framework ? [c.framework.name] : [] })),
      affected_risks: riskSummaries,
      affected_frameworks: affectedFrameworks,
      affected_active_exceptions: affectedActiveExceptions,
      risk_level_if_proceeded,
      generated_at: new Date().toISOString(),
    });
  }

  if (parts.length === 3 && parts[0] === "policies" && parts[2] === "impact-override" && method === "POST") {
    const policy = POLICIES.find((p) => p._id === parts[1]);
    if (!policy) return json(res, 404, { message: "Policy not found" });
    const body = await readBody(req);
    if (!String(body.reason || "").trim()) return json(res, 422, { message: "A reason is required to proceed despite the high impact." });
    pushAudit(policy, "High Impact Override", user, { entityType: "policy", reason: String(body.reason).trim() });
    return json(res, 200, { ok: true });
  }

  if (parts.length === 3 && parts[0] === "controls" && parts[2] === "impact-override" && method === "POST") {
    const control = CONTROLS.find((c) => c._id === parts[1] || c.controlId === parts[1]);
    if (!control) return json(res, 404, { message: "Control not found" });
    const body = await readBody(req);
    if (!String(body.reason || "").trim()) return json(res, 422, { message: "A reason is required to proceed despite the high impact." });
    getNested(`controls::${control._id}::audit-logs`).push({
      _id: newId("audit"),
      actionType: "High Impact Override",
      actor: user ? user.username : "system",
      actorRole: user ? user.role : "system",
      details: { entityType: "control", reason: String(body.reason).trim() },
      createdAt: new Date().toISOString(),
    });
    return json(res, 200, { ok: true });
  }

  if (path === "context/domains/used-in" && method === "GET") {
    const usedIn = {};
    for (const d of DOMAINS) {
      const id = String(d._id);
      usedIn[id] =
        RISKS.filter((r) => String(r.domain?._id || r.domain || "") === id).length +
        GROUPS.filter((g) => (g.domains || []).some((x) => String(x?._id || x || "") === id)).length +
        CAMPAIGNS.filter((c) => String(c.domain?._id || c.domain || "") === id).length;
    }
    return json(res, 200, { usedIn });
  }

  if (parts.length === 4 && parts[0] === "governance" && parts[1] === "roles" && parts[2] && parts[3] === "users") {
    const key = `governance/roles::${parts[2]}::users`;
    if (method === "GET") {
      const list = getNested(key);
      return json(res, 200, { items: list, total: list.length });
    }
    if (method === "POST") {
      const body = await readBody(req);
      const u = USERS.find((x) => x._id === body.userId);
      const rec = { _id: newId("assign"), user: u || { _id: body.userId, username: body.userId }, assignedAt: new Date().toISOString() };
      getNested(key).push(rec);
      return json(res, 200, rec);
    }
    if (method === "DELETE") {
      const list = getNested(key);
      const idx = list.findIndex((x) => String(x.user?._id) === parts[3] || String(x.user?.username) === parts[3]);
      if (idx >= 0) list.splice(idx, 1);
      return json(res, 200, { ok: true });
    }
  }

if (parts.length === 5 && parts[0] === "governance" && parts[1] === "roles" && parts[3] === "users") {
    const key = `governance/roles::${parts[2]}::users`;
    if (method === "DELETE") {
      const list = getNested(key);
      const idx = list.findIndex((x) => String(x.user?._id) === parts[4] || String(x.user?.username) === parts[4]);
      if (idx < 0) return json(res, 404, { message: "User is not assigned to this role." });
      const [removed] = list.splice(idx, 1);
      const role = ROLES.find((r) => r._id === parts[2]);
      getNested(`governance/roles::${parts[2]}::audit-logs`).push({
        _id: newId("audit"),
        actionType: "User Unassigned",
        actor: user ? user.username : "system",
        actorRole: user ? user.role : "system",
        details: {
          roleId: parts[2],
          roleName: role ? role.name : null,
          userId: parts[4],
          username: removed?.user?.username || parts[4],
          assignedAt: removed?.assignedAt || null,
        },
        createdAt: new Date().toISOString(),
      });
      return json(res, 200, { ok: true, removed: parts[4] });
    }
  }

  if (parts.length === 3 && parts[0] === "policies" && parts[2] === "attestations" && method === "GET") {
    const policy = POLICIES.find((p) => p._id === parts[1]);
    const list = getNested(`policies::${parts[1]}::attestations`);
    const items = list.map((a) => ({
      ...a,
      policyVersion: a.policyVersion || (policy ? policy.version : null),
      attestedOnPreviousVersion: Boolean(a.policyVersion && policy && String(a.policyVersion) !== String(policy.version)),
      snapshotStatus: a.snapshotStatus || "legacy_unavailable",
    }));
    return json(res, 200, { items, total: items.length });
  }

  if (parts.length === 3 && parts[0] === "policies" && parts[2] === "exceptions" && method === "GET") {
    const list = getNested(`policies::${parts[1]}::exceptions`);
    const items = list.map((x) => {
      const risk = x.riskId ? RISKS.find((r) => r._id === x.riskId) : null;
      return {
        ...x,
        risk: risk ? { _id: risk._id, riskId: risk.riskId, title: risk.title, severityLevel: risk.severityLevel, owner: risk.owner } : x.risk || null,
        riskBindingStatus: x.riskBindingStatus || "unbound",
      };
    });
    return json(res, 200, { items, total: items.length });
  }

  if (parts.length === 3 && parts[0] === "attestations" && parts[2] === "verify" && method === "GET") {
    const att = findAttestationById(parts[1]);
    if (!att) return json(res, 404, { message: "Attestation not found" });
    const policy = POLICIES.find((p) => p._id === att.policyId);
    const snapshot = POLICY_ATTESTATION_SNAPSHOTS.find((s) => s.attestationId === att._id);
    let isVerified = false;
    let snapshotHash = null;
    if (snapshot) {
      snapshotHash = snapshot.contentHash;
      const file = FILES.get(snapshot.fileId);
      isVerified = Boolean(file && Buffer.isBuffer(file.content) && createHash("sha256").update(file.content).digest("hex") === snapshot.contentHash);
    }
    const current = policy ? buildPolicySnapshotPdf(policy) : null;
    const currentPolicyHash = current ? hashPdf(current) : null;
    return json(res, 200, {
      attestationId: att._id,
      snapshotStatus: snapshot ? "available" : att.snapshotStatus || "legacy_unavailable",
      isVerified,
      snapshotHash,
      currentPolicyHash,
      isCurrentVersion: Boolean(policy && String(att.policyVersion) === String(policy.version)),
      verifiedAt: new Date().toISOString(),
    });
  }

  if (parts.length === 3 && parts[0] === "attestations" && parts[2] === "snapshot" && method === "GET") {
    const snap = POLICY_ATTESTATION_SNAPSHOTS.find((s) => s.attestationId === parts[1]);
    const file = snap && FILES.get(snap.fileId);
    if (!file) return json(res, 404, { message: "Snapshot not available" });
    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="policy-attestation-${parts[1]}.pdf"`,
    });
    return res.end(file.content);
  }

  const LIFECYCLE_SUBS = ["versions", "audit-history", "audit-chain", "workflow-config", "version-compare", "lifecycle"];
  const GOVERNANCE_SUBS = ["exceptions"];
  if (parts.length >= 2 && NESTED_SUBS.includes(parts[parts.length - 1]) && !COLLECTIONS[path] && !(parts[0] === "policies" && LIFECYCLE_SUBS.includes(parts[parts.length - 1])) && !(parts[0] === "governance" && GOVERNANCE_SUBS.includes(parts[parts.length - 1]))) {
    const parentPath = parts.slice(0, -2).join("/");
    const parentId = parts[parts.length - 2];
    const sub = parts[parts.length - 1];
    const parent = COLLECTIONS[parentPath];
    if (!parent) return json(res, 404, { message: "Not found" });
    const key = `${parentPath}::${parentId}::${sub}`;
    const list = getNested(key);
    if (method === "GET") return json(res, 200, { items: list, total: list.length });
    if (method === "POST") {
      const body = await readBody(req);
      const rec = { _id: newId(sub), ...body, createdAt: new Date().toISOString() };
      if (sub === "documents" || sub === "evidence") {
        if (body.isMultipart) {
          const f = body.fields || {};
          const fileId = newId("file");
          FILES.set(fileId, { name: f.fileName || body.fileName || "upload.txt", content: String(f.file || "") });
          Object.assign(rec, f, {
            fileId,
            fileName: f.fileName || body.fileName || "upload.txt",
            size: String(f.file || "").length || Number(f.size) || 0,
          });
          rec.tags = normalizeTags(rec.tags);
          delete rec.fields;
          delete rec.isMultipart;
          delete rec.file;
        } else if (rec.tags) {
          rec.tags = normalizeTags(rec.tags);
        }
      }
      if (sub === "assessments" || sub === "responses" || sub === "risks" || sub === "findings" || sub === "procedures" || sub === "capas" || sub === "reports" || sub === "approvals" || sub === "members" || sub === "meetings" || sub === "decisions" || sub === "versions" || sub === "documents" || sub === "audit-logs" || sub === "control-mappings" || sub === "evidence" || sub === "risk-mappings" || sub === "attachments" || sub === "messages" || sub === "attestations" || sub === "exceptions") {
        if (sub === "members") rec.user = USERS.find((u) => u._id === (body.userId || body.user));
        if (sub === "users" || sub === "members") rec.user = USERS.find((u) => u._id === (body.userId || body.user || (body.user && body.user._id)));
        if (sub === "attestations") {
          const pol = POLICIES.find((p) => p._id === parentId);
          const uid = body.userId || body.user || (body.user && body.user._id) || (user && user._id);
          const targetUser = USERS.find((u) => u._id === uid) || USERS.find((u) => u.username === uid) || null;
          const policyVersion = String(pol ? pol.version : body.policyVersion || "");
          const dup = list.find(
            (a) => String(a.policyId) === String(parentId) && String(a.policyVersion) === policyVersion && String(a.userId) === String(uid)
          );
          if (dup) return json(res, 200, dup);
          rec.policyId = parentId;
          rec.policyVersion = policyVersion;
          rec.userId = uid || null;
          rec.attester = body.attester || (targetUser && (targetUser.fullName || targetUser.username)) || (user && (user.fullName || user.username)) || null;
          rec.attestedAt = rec.createdAt;
          rec.ipAddress = req.socket.remoteAddress || null;
          if (pol) {
            const pdf = buildPolicySnapshotPdf(pol);
            const fileId = newId("file");
            FILES.set(fileId, { name: `policy-attestation-${rec._id}.pdf`, content: pdf });
            const snapshot = {
              _id: newId("snap"),
              attestationId: rec._id,
              policyId: parentId,
              policyVersion,
              pdfFilePath: `attestation-snapshots/${rec._id}.pdf`,
              fileId,
              contentHash: hashPdf(pdf),
              hashAlgorithm: "SHA-256",
              generatedAt: new Date().toISOString(),
              fileSizeBytes: pdf.length,
              generatedBySystem: true,
            };
            POLICY_ATTESTATION_SNAPSHOTS.push(snapshot);
            rec.snapshotId = snapshot._id;
            rec.snapshotStatus = "available";
            rec.contentHash = snapshot.contentHash;
            rec.pdfFilePath = snapshot.pdfFilePath;
          }
        }
        if (sub === "exceptions") {
          const pol = POLICIES.find((p) => p._id === parentId);
          const type = EXCEPTION_TYPES.find((t) => String(t._id) === String(body.exceptionType || body.exceptionTypeId));
          rec.policyId = parentId;
          rec.requestedBy = (user && (user.fullName || user.username)) || body.requestedBy || null;
          rec.requestedAt = rec.createdAt;
          rec.status = "Pending";
          rec.riskBindingStatus = "unbound";
          const days = Number(type?.maxDurationDays || type?.defaultExpiryDays || 90);
          rec.expiresAt = new Date(Date.now() + days * 86400000).toISOString();
          if (pol) pushAudit(pol, "Exception Requested", user, { exceptionId: rec._id, type: type?.name || body.exceptionType, reason: body.reason || null });
        }
      }
      list.push(rec);
      return json(res, 200, rec);
    }
  }

  if (parts.length === 4 && parts[0] === "policies" && parts[2] === "exceptions" && method === "PUT") {
    const list = getNested(`policies::${parts[1]}::exceptions`);
    const idx = list.findIndex((x) => x._id === parts[3]);
    if (idx < 0) return json(res, 404, { message: "Not found" });
    const body = await readBody(req);
    const current = list[idx];
    const policy = POLICIES.find((p) => p._id === parts[1]);
    if (body.status && ["Pending", "Approved", "Rejected", "Expired"].includes(body.status)) {
      const from = current.status;
      if (body.status === "Approved" && current.riskBindingStatus === "unbound")
        return json(res, 422, { error: "EXCEPTION_NOT_RISK_BOUND", message: "This exception cannot be approved until it is bound to a risk or the binding is waived with justification." });
      if (body.status === "Rejected" && !String(body.comment || "").trim())
        return json(res, 422, { message: "A comment is required when rejecting an exception." });
      current.status = body.status;
      current.comment = body.comment || current.comment || null;
      if (body.status === "Approved") {
        current.approvedBy = (user && (user.fullName || user.username)) || body.approvedBy || null;
        current.approvedAt = new Date().toISOString();
      }
      current.updatedAt = new Date().toISOString();
      if (policy) pushAudit(policy, `Exception ${body.status}`, user, { exceptionId: current._id, from, to: body.status, comment: current.comment });
      return json(res, 200, current);
    }
    if (current.status === "Approved") {
      for (const k of ["riskId", "riskBindingStatus", "waiverJustification", "waivedBy", "waivedAt", "policyId", "status", "requestedBy", "requestedAt"])
        delete body[k];
    }
    Object.assign(current, body, { updatedAt: new Date().toISOString() });
    return json(res, 200, current);
  }

  if (parts.length === 5 && parts[0] === "policies" && parts[2] === "exceptions" && parts[4] === "bind-risk" && method === "POST") {
    const list = getNested(`policies::${parts[1]}::exceptions`);
    const current = list.find((x) => x._id === parts[3]);
    if (!current) return json(res, 404, { message: "Exception not found" });
    const body = await readBody(req);
    const risk = RISKS.find((r) => r._id === body.riskId);
    if (!risk) return json(res, 404, { message: "Risk not found" });
    if (current.status === "Approved") return json(res, 409, { message: "This exception is already approved and locked; risk binding can no longer be changed." });
    current.riskId = risk._id;
    current.risk = { _id: risk._id, riskId: risk.riskId, title: risk.title, severityLevel: risk.severityLevel, owner: risk.owner };
    current.riskBindingStatus = "bound";
    current.updatedAt = new Date().toISOString();
    const policy = POLICIES.find((p) => p._id === parts[1]);
    if (policy) pushAudit(policy, "Exception Risk Bound", user, { exceptionId: current._id, riskId: risk._id, riskTitle: risk.title });
    return json(res, 200, { exceptionId: current._id, riskId: risk._id, riskBindingStatus: "bound" });
  }

  if (parts.length === 5 && parts[0] === "policies" && parts[2] === "exceptions" && parts[4] === "waive-risk-binding" && method === "POST") {
    const list = getNested(`policies::${parts[1]}::exceptions`);
    const current = list.find((x) => x._id === parts[3]);
    if (!current) return json(res, 404, { message: "Exception not found" });
    const body = await readBody(req);
    if (!user || !["admin", "board", "ciso", "cro"].includes(user.role)) return json(res, 403, { message: "Only a CISO, CRO or administrator can waive the risk binding requirement." });
    if (String(body.justification || "").trim().length < 30)
      return json(res, 422, { message: "Justification must be at least 30 characters." });
    if (current.status === "Approved") return json(res, 409, { message: "This exception is already approved and locked." });
    current.riskBindingStatus = "waived";
    current.waiverJustification = String(body.justification).trim();
    current.waivedBy = user._id;
    current.waivedAt = new Date().toISOString();
    current.updatedAt = current.waivedAt;
    const policy = POLICIES.find((p) => p._id === parts[1]);
    if (policy) pushAudit(policy, "Exception Risk Binding Waived", user, { exceptionId: current._id, justification: current.waiverJustification });
    return json(res, 200, { exceptionId: current._id, riskBindingStatus: "waived" });
  }

  if (parts.length >= 4 && NESTED_SUBS.includes(parts[parts.length - 2]) && !(parts[0] === "policies" && LIFECYCLE_SUBS.includes(parts[parts.length - 2]))) {
    const parentPath = parts.slice(0, -3).join("/");
    const parentId = parts[parts.length - 3];
    const sub = parts[parts.length - 2];
    const itemId = parts[parts.length - 1];
    if (COLLECTIONS[parentPath]) {
      const list = getNested(`${parentPath}::${parentId}::${sub}`);
      const idx = list.findIndex((x) => x._id === itemId);
      if (idx >= 0) {
        if (method === "PUT") {
          Object.assign(list[idx], await readBody(req), { updatedAt: new Date().toISOString() });
          return json(res, 200, list[idx]);
        }
        if (method === "DELETE") {
          list.splice(idx, 1);
          return json(res, 200, { ok: true });
        }
      }
    }
  }

  if (parts.length === 3 && parts[0] === "policies" && parts[2] === "hierarchy") {
    const build = (p) => ({
      _id: p._id,
      policyId: p.policyId,
      title: p.title,
      status: p.status,
      version: p.version,
      children: POLICIES.filter((c) => {
        const pid = typeof c.parentPolicy === "string" ? c.parentPolicy : c.parentPolicy?._id;
        return pid === p._id;
      }).map(build),
    });
    if (method === "GET") {
      const roots = POLICIES.filter((p) => !p.parentPolicy).map(build);
      return json(res, 200, { items: roots, total: roots.length });
    }
    const target = POLICIES.find((p) => p._id === parts[1]);
    if (!target) return json(res, 404, { message: "Not found" });
    if (method === "PUT") {
      const body = await readBody(req);
      const parent = POLICIES.find((p) => p._id === body.parentPolicy);
      if (!parent) return json(res, 404, { message: "Parent policy not found" });
      if (parent._id === target._id) return json(res, 422, { message: "A policy cannot be its own parent." });
      target.parentPolicy = parent._id;
      target.updatedAt = new Date().toISOString();
      pushAudit(target, "Hierarchy Updated", user, { parentPolicy: parent.policyId });
      return json(res, 200, withJoins(target));
    }
    if (method === "DELETE") {
      delete target.parentPolicy;
      target.updatedAt = new Date().toISOString();
      pushAudit(target, "Hierarchy Updated", user, { parentPolicy: null });
      return json(res, 200, { ok: true });
    }
  }

  if (parts.length === 3 && parts[0] === "policies" && parts[2] === "workflow" && method === "POST") {
    const idx = POLICIES.findIndex((p) => p._id === parts[1]);
    if (idx < 0) return json(res, 404, { message: "Not found" });
    const policy = POLICIES[idx];
    const body = await readBody(req);
    const action = body.action;
    const comment = String(body.comment || "").trim();
    const canonical =
      policy.status === "Pending Review" ? "Review" :
      policy.status === "Pending Approval" ? "Approval" : policy.status;
    let next = null;
    let label = null;
    if (canonical === "Draft" && action === "submit-review") { next = "Review"; label = "Submitted for Review"; }
    else if (canonical === "Draft" && action === "publish-direct") { next = "Published"; label = "Published Direct"; }
    else if (canonical === "Review" && action === "approve") { next = "Approval"; label = "Approved"; }
    else if (canonical === "Review" && action === "reject") { next = "Draft"; label = "Rejected"; }
    else if (canonical === "Approval" && action === "approve") { next = "Approved"; label = "Approved"; }
    else if (canonical === "Approval" && action === "reject") { next = "Draft"; label = "Rejected"; }
    else if (canonical === "Approved" && action === "publish") { next = "Published"; label = "Published"; }
    else if (canonical === "Published" && action === "archive") { next = "Archived"; label = "Archived"; }
    else if (canonical === "Approved" && action === "archive") { next = "Archived"; label = "Archived"; }
    if (!next)
      return json(res, 422, { message: `Action '${action}' is not valid for a policy in '${policy.status}' state.` });
    if (action === "reject" && !comment)
      return json(res, 422, { message: "A comment is required when rejecting a policy." });
    const from = policy.status;
    policy.status = next;
    policy.updatedAt = new Date().toISOString();
    if (next === "Published") {
      if (!policy.effectiveDate) policy.effectiveDate = policy.updatedAt;
      policy.lastReviewAt = policy.updatedAt;
      const base = policy.effectiveDate || policy.updatedAt;
      policy.nextReviewDate = new Date(new Date(base).getTime() + (Number(policy.reviewPeriodDays) || 365) * 86400000).toISOString();
    }
    const details = { from, to: next };
    if (comment) details.comment = comment;
    pushAudit(policy, label, user, details);
    POLICY_WORKFLOW_EVENTS.push({
      _id: newId("wfe"),
      policy_id: policy._id,
      policyId: policy.policyId,
      title: policy.title,
      action,
      fromStatus: from,
      toStatus: next,
      performedBy: user ? user.username : "system",
      performedAt: policy.updatedAt,
      comment: comment || null,
    });
    return json(res, 200, { ...withJoins(policy), workflowEvent: POLICY_WORKFLOW_EVENTS[POLICY_WORKFLOW_EVENTS.length - 1] });
  }

  if (path === "policies" && method === "POST") {
    const body = await readBody(req);
    const maxN = POLICIES.reduce((m, p) => {
      const n = parseInt(String(p.policyId || "").replace(/\D/g, ""), 10);
      return Number.isFinite(n) ? Math.max(m, n) : m;
    }, 0);
    const rec = {
      _id: newId("pol"),
      ...body,
      policyId: body.policyId || `POL-${String(maxN + 1).padStart(3, "0")}`,
      tags: normalizeTags(body.tags),
      status: body.status || "Draft",
      version: body.version || "1.0",
      createdAt: new Date().toISOString(),
    };
    POLICIES.unshift(rec);
    pushAudit(rec, "Created", user);
    return json(res, 200, withJoins(rec));
  }

  if (parts.length === 2 && parts[0] === "policies" && method === "PUT") {
    const idx = POLICIES.findIndex((r) => r._id === parts[1]);
    if (idx < 0) return json(res, 404, { message: "Not found" });
    const body = await readBody(req);
    if (body.tags) body.tags = normalizeTags(body.tags);
    Object.assign(POLICIES[idx], body, { updatedAt: new Date().toISOString() });
    pushAudit(POLICIES[idx], "Updated", user);
    return json(res, 200, withJoins(POLICIES[idx]));
  }

  if (parts.length === 2 && parts[0] === "policies" && method === "DELETE") {
    const idx = POLICIES.findIndex((r) => r._id === parts[1]);
    if (idx < 0) return json(res, 404, { message: "Not found" });
    const pid = POLICIES[idx]._id;
    POLICIES.splice(idx, 1);
    for (const k of [...nested.keys()]) if (k.startsWith(`policies::${pid}::`)) nested.delete(k);
    for (const p of POLICIES) {
      const parentId = typeof p.parentPolicy === "string" ? p.parentPolicy : p.parentPolicy?._id;
      if (parentId === pid) delete p.parentPolicy;
    }
    return json(res, 200, { ok: true });
  }

  if (parts.length >= 4 && parts[parts.length - 2] === "responses" && method === "PUT" && path.includes("compliance/campaigns/")) {
    const body = await readBody(req);
    const campaign = CAMPAIGNS.find((c) => c._id === parts[2]);
    const resp = campaign && campaign.responses.find((r) => r._id === parts[4]);
    if (resp) Object.assign(resp, body, { updatedAt: new Date().toISOString() });
    return json(res, 200, { ok: true });
  }

  if (parts.length === 3 && parts[0] === "compliance" && parts[1] === "controls" && parts[2] === "stats") return json(res, 200, statsFor("compliance/controls", CONTROLS));
  if (parts.length === 3 && parts[0] === "compliance" && parts[1] === "gaps" && parts[2] === "stats") return json(res, 200, statsFor("compliance/gaps", GAPS));
  if (parts.length === 3 && parts[0] === "compliance" && parts[1] === "campaigns" && parts[2] === "stats") return json(res, 200, statsFor("compliance/campaigns", CAMPAIGNS));
  if (parts.length === 3 && parts[0] === "compliance" && parts[1] === "controls") {
    const idx = CONTROLS.findIndex((c) => c._id === parts[2]);
    if (idx < 0) return json(res, 404, { message: "Not found" });
    if (method === "GET") return json(res, 200, withJoins(CONTROLS[idx]));
    if (method === "PUT") {
      Object.assign(CONTROLS[idx], await readBody(req), { updatedAt: new Date().toISOString() });
      return json(res, 200, withJoins(CONTROLS[idx]));
    }
    if (method === "DELETE") {
      CONTROLS.splice(idx, 1);
      for (let i = LINKS.length - 1; i >= 0; i--) if (LINKS[i].control_id === parts[2]) LINKS.splice(i, 1);
      return json(res, 200, { ok: true });
    }
  }
  if (path === "policies/stats" || (parts.length === 2 && parts[0] === "policies" && parts[1] === "stats")) return json(res, 200, lifecycleService.getDashboardStats());

  if (parts.length === 3 && parts[0] === "questionnaires" && parts[1].length && parts[2] === "transition" && method === "POST") {
    const q = QUESTIONNAIRES.find((x) => x._id === parts[1]);
    const body = await readBody(req);
    if (q) q.status = body.status || q.status;
    return json(res, 200, q || {});
  }
  if (parts.length === 3 && parts[0] === "questionnaires" && parts[2] === "duplicate" && method === "POST") {
    const q = QUESTIONNAIRES.find((x) => x._id === parts[1]);
    if (q) {
      const copy = { ...q, _id: newId("q"), title: `${q.title} (Copy)`, status: "draft", createdAt: new Date().toISOString(), sections: JSON.parse(JSON.stringify(q.sections || [])) };
      QUESTIONNAIRES.unshift(copy);
      return json(res, 200, copy);
    }
    return json(res, 404, { message: "Not found" });
  }
  if (parts.length === 3 && parts[0] === "responses" && parts[2] === "submit" && method === "POST") {
    const r = RESPONSES.find((x) => x._id === parts[1]);
    if (r) { r.status = "Submitted"; r.submittedAt = new Date().toISOString(); return json(res, 200, r); }
    return json(res, 404, { message: "Not found" });
  }

  if (parts.length === 3 && parts[0] === "assessments" && parts[2] === "transition" && method === "POST") {
    const a = ASSESSMENTS.find((x) => x._id === parts[1]);
    const body = await readBody(req);
    if (a) { a.status = body.status || a.status; if (body.status === "Completed") a.completedAt = new Date().toISOString(); }
    return json(res, 200, a || {});
  }
  if (parts.length === 3 && parts[0] === "assessments" && parts[2] === "respond" && method === "POST") {
    const a = ASSESSMENTS.find((x) => x._id === parts[1]);
    const body = await readBody(req);
    if (a) { a.respondent = body.respondent || a.respondent; a.startedAt = a.startedAt || new Date().toISOString(); }
    return json(res, 200, a || {});
  }
  if (parts.length === 3 && parts[0] === "assessments" && parts[2] === "approvals" && method === "POST") {
    const a = ASSESSMENTS.find((x) => x._id === parts[1]);
    const body = await readBody(req);
    const app = { _id: newId("app"), ...body, approvedBy: user ? { _id: user._id, fullName: user.fullName } : null, createdAt: new Date().toISOString() };
    if (a) (a.approvals ||= []).push(app);
    return json(res, 200, app);
  }
  if (parts.length >= 5 && parts[0] === "assessments" && parts[2] === "risks" && parts[4] === "push" && method === "POST") {
    const a = ASSESSMENTS.find((x) => x._id === parts[1]);
    const body = await readBody(req);
    const risk = a && (a.risks || []).find((r) => r._id === parts[3]);
    const created = { _id: newId("risk"), ...(risk || {}), ...body, status: "Open", createdAt: new Date().toISOString() };
    RISKS.unshift(created);
    return json(res, 200, { ok: true, risk: created });
  }

  if (parts.length === 3 && parts[0] === "third-party" && parts[2] === "transition" && method === "POST") {
    const t = THIRD_PARTY.find((x) => x._id === parts[1]);
    const body = await readBody(req);
    if (t) t.status = body.status || t.status;
    return json(res, 200, t || {});
  }
  if (parts.length >= 5 && parts[0] === "third-party" && parts[2] === "findings" && parts[4] === "push" && method === "POST") {
    const t = THIRD_PARTY.find((x) => x._id === parts[1]);
    const body = await readBody(req);
    const f = t && (t.findings || []).find((x) => x._id === parts[3]);
    const created = { _id: newId("risk"), ...(f || {}), ...body, status: "Open", createdAt: new Date().toISOString() };
    RISKS.unshift(created);
    return json(res, 200, { ok: true, risk: created });
  }

  if (parts.length === 4 && parts[0] === "audit" && parts[1] === "engagements" && parts[3] === "transition" && method === "PUT") {
    const e = AUDIT_ENGAGEMENTS.find((x) => x._id === parts[2]);
    const body = await readBody(req);
    if (e) { e.stage = body.to || e.stage; if (e.stage === "Closed") e.status = "Completed"; }
    return json(res, 200, e || { ok: true });
  }

  if (parts.length === 2 && parts[0] === "files" && method === "GET") {
    const f = FILES.get(parts[1]);
    if (!f) return json(res, 404, { message: "Not found" });
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${String(f.name || "file.txt").replace(/"/g, "")}"`,
    });
    return res.end(f.content);
  }

  if (path === "question-bank" && method === "GET") {
    const QUESTION_BANK = [
      { _id: "qb-1", text: "How frequently are access rights reviewed?", type: "select", options: ["Monthly", "Quarterly", "Annually", "Never"], category: "Access Control", tags: ["ISO 27001", "A.9"] },
      { _id: "qb-2", text: "Is there a documented incident response plan?", type: "select", options: ["Yes", "No", "In Progress"], category: "Incident Management", tags: ["ISO 27001", "A.16"] },
      { _id: "qb-3", text: "Describe your business continuity testing process.", type: "textarea", options: [], category: "Business Continuity", tags: ["ISO 22301"] },
      { _id: "qb-4", text: "Are encryption standards applied to data at rest?", type: "select", options: ["Yes, AES-256", "Yes, other standard", "Partially", "No"], category: "Cryptography", tags: ["ISO 27001", "A.10"] },
      { _id: "qb-5", text: "How many employees have completed security awareness training this year?", type: "text", options: [], category: "Training", tags: ["ISO 27001", "A.7.2.2"] },
      { _id: "qb-6", text: "Is third-party supplier risk formally assessed?", type: "select", options: ["Yes, annually", "Yes, on onboarding only", "No formal process"], category: "Supplier Security", tags: ["ISO 27001", "A.15"] },
      { _id: "qb-7", text: "What is your patch management SLA for critical vulnerabilities?", type: "select", options: ["24 hours", "72 hours", "1 week", "No defined SLA"], category: "Vulnerability Management", tags: ["NIST CSF"] },
      { _id: "qb-8", text: "Are physical security controls audited regularly?", type: "select", options: ["Yes, quarterly", "Yes, annually", "No"], category: "Physical Security", tags: ["ISO 27001", "A.11"] },
      { _id: "qb-9", text: "Describe the process for classifying data.", type: "textarea", options: [], category: "Data Classification", tags: ["ISO 27001", "A.8.2"] },
      { _id: "qb-10", text: "Is there a formal change management process?", type: "select", options: ["Yes, fully documented", "Informal process", "No"], category: "Change Management", tags: ["ISO 20000"] },
      { _id: "qb-11", text: "How are privileged accounts managed?", type: "select", options: ["PAM solution", "Manual approval", "No special controls"], category: "Access Control", tags: ["ISO 27001", "A.9.4"] },
      { _id: "qb-12", text: "Is there a disaster recovery plan with defined RTO/RPO?", type: "select", options: ["Yes, tested", "Yes, untested", "In development", "No"], category: "Business Continuity", tags: ["ISO 22301"] },
      { _id: "qb-13", text: "What vulnerability scanning tools are in use?", type: "text", options: [], category: "Vulnerability Management", tags: ["NIST CSF"] },
      { _id: "qb-14", text: "Are security events logged and monitored 24/7?", type: "select", options: ["Yes, by SOC", "Yes, automated only", "No"], category: "Monitoring", tags: ["ISO 27001", "A.12.4"] },
      { _id: "qb-15", text: "How is mobile device security enforced?", type: "select", options: ["MDM policy", "BYOD guidelines", "No formal policy"], category: "Mobile Security", tags: ["ISO 27001", "A.6.2"] },
    ];
    const q = String(query.q || "").toLowerCase().trim();
    let items = QUESTION_BANK;
    if (q) items = items.filter((i) => i.text.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || (i.tags || []).some((t) => t.toLowerCase().includes(q)));
    return json(res, 200, { items, total: items.length });
  }

  if (path === "backup/export" && method === "GET") {
    const rows = [
      ["Collection", "Count"],
      ["Risks", RISKS.length],
      ["Assets", ASSETS.length],
      ["Policies", POLICIES.length],
      ["Controls", CONTROLS.length],
      ["Frameworks", FRAMEWORKS.length],
      ["Organizations", ORGANIZATIONS.length],
      ["Groups", GROUPS.length],
      ["Domains", DOMAINS.length],
      ["Assessments", ASSESSMENTS.length],
      ["Questionnaires", QUESTIONNAIRES.length],
      ["Third Party", THIRD_PARTY.length],
      ["Audit Engagements", AUDIT_ENGAGEMENTS.length],
      ["Gaps", GAPS.length],
      ["Campaigns", CAMPAIGNS.length],
      ["POAM", POAM.length],
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    res.writeHead(200, {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="wadjet-data-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    });
    return res.end(csv);
  }

  if (path === "backup/restore" && method === "POST") {
    const result = {
      ok: true,
      message: "Restore accepted (demo server: no actual data restored).",
      recordsRestored: {
        risks: RISKS.length,
        assets: ASSETS.length,
        policies: POLICIES.length,
        controls: CONTROLS.length,
        frameworks: FRAMEWORKS.length,
      },
      restoredAt: new Date().toISOString(),
    };
    return json(res, 200, result);
  }

  if (path === "domains" && method === "POST") {
    const body = await readBody(req);
    const newDomain = { _id: newId("dom"), ...body, createdAt: new Date().toISOString() };
    DOMAINS.push(newDomain);
    const newParam = {
      _id: newId("par"),
      name: newDomain.name,
      domain: { _id: newDomain._id, name: newDomain.name },
      scoringMethod: newDomain.scoringMethod || "advanced",
      impactMethod: (newDomain.scoringMethod || "advanced") === "max" ? "max" : "weighted",
      status: "active",
      thresholds: { ...THRESHOLDS },
      appetiteLimit: 8,
      toleranceLimit: 12,
      criteria: CRITERIA.map((c) => ({ name: c, weight: 0.125 })),
      riskScoreMethod: "multiplicative",
      riskScoreWeights: { likelihood: 0.5, impact: 0.5 },
      matrixLookupTable: null,
      residualMethod: "overall_ce",
      maximumRiskReduction: 0.75,
      minResidualScore: 1,
      controlEffectivenessWeights: { Effective: 0.75, "Partially Effective": 0.5, Ineffective: 0.25, "Not Assessed": 0 },
      methodVersion: 1,
      reassessmentFrequencyDays: 180,
    };
    PARAMETERS.push(newParam);
    return json(res, 200, withJoins(newDomain));
  }

  // ============================================
  // POLICY LIFECYCLE API ENDPOINTS
  // ============================================
  
  // Get policy summary (computed lifecycle state)
  if (parts.length === 2 && parts[0] === "policies" && method === "GET" && !LIFECYCLE_SUBS.includes(parts[1]) && parts[1] !== "dashboard" && parts[1] !== "stats") {
    try {
      const summary = lifecycleService.getPolicySummary(parts[1]);
      return json(res, 200, summary);
    } catch (err) {
      return json(res, err.code === "POLICY_NOT_FOUND" ? 404 : 400, { message: err.message, code: err.code });
    }
  }
  
  // Get policy versions
  if (parts.length === 3 && parts[0] === "policies" && parts[2] === "versions" && method === "GET") {
    const policyVersions = POLICY_VERSIONS.filter((v) => v.policyId === parts[1]);
    return json(res, 200, { items: policyVersions, total: policyVersions.length });
  }
  
  // Get single version
  if (parts.length === 4 && parts[0] === "policies" && parts[2] === "versions" && method === "GET") {
    const version = POLICY_VERSIONS.find((v) => v._id === parts[3]);
    if (!version) return json(res, 404, { message: "Version not found" });
    return json(res, 200, version);
  }
  
  // Create new version
  if (parts.length === 3 && parts[0] === "policies" && parts[2] === "versions" && method === "POST") {
    try {
      const body = await readBody(req);
      const user = tokenUser(req);
      const newVersion = lifecycleService.createNewVersion(parts[1], user?._id || "u-admin", body);
      return json(res, 201, newVersion);
    } catch (err) {
      return json(res, err.code === "UNAUTHORIZED" ? 403 : 400, { message: err.message, code: err.code });
    }
  }
  
  // Submit for review
  if (parts.length === 5 && parts[0] === "policies" && parts[2] === "versions" && parts[4] === "submit-review" && method === "POST") {
    try {
      const body = await readBody(req);
      const user = tokenUser(req);
      const result = lifecycleService.submitForReview(parts[1], parts[3], user?._id || "u-admin", body);
      return json(res, 200, result);
    } catch (err) {
      return json(res, err.code === "UNAUTHORIZED" ? 403 : 400, { message: err.message, code: err.code });
    }
  }
  
  // Approve review
  if (parts.length === 5 && parts[0] === "policies" && parts[2] === "versions" && parts[4] === "approve-review" && method === "POST") {
    try {
      const body = await readBody(req);
      const user = tokenUser(req);
      const result = lifecycleService.approveReview(parts[1], parts[3], user?._id || "u-admin", body);
      return json(res, 200, result);
    } catch (err) {
      return json(res, err.code === "UNAUTHORIZED" ? 403 : 400, { message: err.message, code: err.code });
    }
  }
  
  // Reject policy
  if (parts.length === 5 && parts[0] === "policies" && parts[2] === "versions" && parts[4] === "reject" && method === "POST") {
    try {
      const body = await readBody(req);
      const user = tokenUser(req);
      const result = lifecycleService.rejectPolicy(parts[1], parts[3], user?._id || "u-admin", body);
      return json(res, 200, result);
    } catch (err) {
      return json(res, err.code === "UNAUTHORIZED" ? 403 : 400, { message: err.message, code: err.code });
    }
  }
  
  // Approve policy (final)
  if (parts.length === 5 && parts[0] === "policies" && parts[2] === "versions" && parts[4] === "approve" && method === "POST") {
    try {
      const body = await readBody(req);
      const user = tokenUser(req);
      const result = lifecycleService.approvePolicy(parts[1], parts[3], user?._id || "u-admin", body);
      return json(res, 200, result);
    } catch (err) {
      return json(res, err.code === "UNAUTHORIZED" ? 403 : 400, { message: err.message, code: err.code });
    }
  }
  
  // Publish policy
  if (parts.length === 5 && parts[0] === "policies" && parts[2] === "versions" && parts[4] === "publish" && method === "POST") {
    try {
      const body = await readBody(req);
      const user = tokenUser(req);
      const result = lifecycleService.publishPolicy(parts[1], parts[3], user?._id || "u-admin", body);
      return json(res, 200, result);
    } catch (err) {
      return json(res, err.code === "UNAUTHORIZED" ? 403 : 400, { message: err.message, code: err.code });
    }
  }
  
  // Archive policy version
  if (parts.length === 5 && parts[0] === "policies" && parts[2] === "versions" && parts[4] === "archive" && method === "POST") {
    try {
      const body = await readBody(req);
      const user = tokenUser(req);
      const result = lifecycleService.archivePolicyVersion(parts[1], parts[3], user?._id || "u-admin", body);
      return json(res, 200, result);
    } catch (err) {
      return json(res, err.code === "UNAUTHORIZED" ? 403 : 400, { message: err.message, code: err.code });
    }
  }
  
  // Get dashboard stats
  if (path === "policies/dashboard" && method === "GET") {
    const stats = lifecycleService.getDashboardStats();
    return json(res, 200, stats);
  }
  
  // Get audit history
  if (parts.length === 3 && parts[0] === "policies" && parts[2] === "audit-history" && method === "GET") {
    const auditEntries = GOVERNANCE_AUDIT_LOG.filter((a) => a.policyId === parts[1]);
    return json(res, 200, { items: auditEntries, total: auditEntries.length });
  }
  
  // Get reviews for a version
  if (parts.length === 5 && parts[0] === "policies" && parts[2] === "versions" && parts[4] === "reviews" && method === "GET") {
    const reviews = POLICY_REVIEWS.filter((r) => r.policyVersionId === parts[3]);
    return json(res, 200, { items: reviews, total: reviews.length });
  }
  
  // Get approvals for a version
  if (parts.length === 5 && parts[0] === "policies" && parts[2] === "versions" && parts[4] === "approvals" && method === "GET") {
    const approvals = POLICY_APPROVALS.filter((a) => a.policyVersionId === parts[3]);
    return json(res, 200, { items: approvals, total: approvals.length });
  }

  // ============================================
  // NEW LIFECYCLE ENDPOINTS
  // ============================================

  // Get available actions for a version
  if (parts.length === 5 && parts[0] === "policies" && parts[2] === "versions" && parts[4] === "available-actions" && method === "GET") {
    const user = tokenUser(req);
    const actions = validationService.getAvailableActions(parts[1], parts[3], user?._id || "u-admin");
    return json(res, 200, actions);
  }

  // Validate publication eligibility
  if (parts.length === 5 && parts[0] === "policies" && parts[2] === "versions" && parts[4] === "validate-publication" && method === "GET") {
    const user = tokenUser(req);
    const result = validationService.validatePublicationEligibility(parts[1], parts[3], user?._id || "u-admin");
    return json(res, 200, result);
  }

  // Compare versions
  if (parts.length === 3 && parts[0] === "policies" && parts[2] === "version-compare" && method === "GET") {
    const vA = query.vA;
    const vB = query.vB;
    if (!vA || !vB) return json(res, 400, { message: "vA and vB query params required" });
    try {
      const result = versionService.compareVersions(parts[1], vA, vB);
      return json(res, 200, result);
    } catch (err) {
      return json(res, 404, { message: err.message, code: err.code });
    }
  }

  // Restore version as new draft
  if (parts.length === 5 && parts[0] === "policies" && parts[2] === "versions" && parts[4] === "restore" && method === "POST") {
    try {
      const body = await readBody(req);
      const user = tokenUser(req);
      const result = versionService.restoreVersionAsDraft(parts[1], parts[3], user?._id || "u-admin");
      return json(res, 201, result);
    } catch (err) {
      return json(res, err.code === "VERSION_NOT_FOUND" ? 404 : 400, { message: err.message, code: err.code });
    }
  }

  // Get workflow configuration
  if (parts.length === 3 && parts[0] === "policies" && parts[2] === "workflow-config" && method === "GET") {
    const config = validationService.getWorkflowConfigForPolicy(parts[1]);
    return json(res, 200, config);
  }

  // Update workflow configuration
  if (parts.length === 3 && parts[0] === "policies" && parts[2] === "workflow-config" && method === "PUT") {
    const user = tokenUser(req);
    if (!user || !["admin", "board"].includes(user.role)) {
      return json(res, 403, { message: "Unauthorized" });
    }
    const body = await readBody(req);
    const config = validationService.setWorkflowConfigForPolicy(parts[1], body);
    return json(res, 200, config);
  }

  // Verify audit chain integrity
  if (path === "policies/audit-chain/verify" && method === "GET") {
    const { verifyAuditChainIntegrity } = await import("./data/policyVersionData.js");
    const result = verifyAuditChainIntegrity(GOVERNANCE_AUDIT_LOG);
    return json(res, 200, result);
  }

  // Process lifecycle dates (activation/expiration)
  if (path === "policies/lifecycle/process-dates" && method === "POST") {
    const changes = [];
    for (const policy of POLICIES) {
      const policyChanges = versionService.processLifecycleDates(policy._id);
      changes.push(...policyChanges.map((c) => ({ ...c, policyId: policy._id })));
    }
    return json(res, 200, { processed: changes.length, changes });
  }

  // ============================================
  // GOVERNANCE MODULE ROUTES (Roles, Committees, Exceptions, Dashboard)
  // ============================================
  
  // Governance Dashboard
  if (path === "governance/dashboard" && method === "GET") {
    const stats = lifecycleService.getDashboardStats();
    return json(res, 200, stats);
  }
  
  // Roles Routes
  if (path === "governance/roles" && method === "GET") {
    const roles = ROLES.map((role) => {
      const usersAssignedCount = USERS.filter((u) => u.role === role.name || u.role === role._id).length;
      return { ...role, usersAssignedCount };
    });
    return json(res, 200, { items: roles, total: roles.length });
  }
  
  if (path === "governance/roles" && method === "POST") {
    const body = await readBody(req);
    const user = tokenUser(req);
    if (!user || !["admin", "board"].includes(user.role)) {
      return json(res, 403, { message: "Unauthorized" });
    }
    const errors = [];
    if (!body.name) errors.push("Name is required");
    if (!body.description) errors.push("Description is required");
    if (errors.length > 0) return json(res, 422, { message: "Validation failed", errors });
    
    const permissions = body.permissions || [];
    const allowedPermissions = [
      "policy.view", "policy.create", "policy.edit", "policy.submit", "policy.approve",
      "policy.reject", "policy.publish", "policy.archive", "policy.acknowledge",
      "role.view", "role.manage",
      "committee.view", "committee.manage", "committee.recordDecision",
      "exception.view", "exception.create", "exception.approve", "exception.reject",
    ];
    const invalidPermissions = permissions.filter((p) => !allowedPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      return json(res, 422, { message: "Invalid permissions", invalidPermissions, allowedPermissions });
    }
    
    const newRole = {
      _id: `r-${Date.now()}`,
      name: body.name,
      description: body.description,
      email: body.email || "",
      status: "Active",
      permissions,
      modulesWithAccess: body.modulesWithAccess || [],
      approvalAuthority: body.approvalAuthority || { canApprovePolicyClassification: ["Public", "Internal"], canApproveExceptions: false },
      createdAt: new Date().toISOString(),
    };
    ROLES.push(newRole);
    return json(res, 201, newRole);
  }
  
  if (parts.length === 2 && parts[0] === "governance/roles" && method === "PUT") {
    const role = ROLES.find((r) => r._id === parts[1]);
    if (!role) return json(res, 404, { message: "Role not found" });
    const body = await readBody(req);
    if (body.name) role.name = body.name;
    if (body.description) role.description = body.description;
    if (body.permissions) role.permissions = body.permissions;
    if (body.approvalAuthority) role.approvalAuthority = body.approvalAuthority;
    return json(res, 200, role);
  }
  
  if (parts.length === 2 && parts[0] === "governance/roles" && method === "DELETE") {
    const role = ROLES.find((r) => r._id === parts[1]);
    if (!role) return json(res, 404, { message: "Role not found" });
    const usersAssignedCount = USERS.filter((u) => u.role === role.name || u.role === role._id).length;
    if (usersAssignedCount > 0) {
      return json(res, 400, { message: `Cannot delete role with ${usersAssignedCount} users assigned. Reassign users first.` });
    }
    role.status = "Inactive";
    return json(res, 200, { message: "Role deactivated successfully" });
  }
  
  // Committees Routes
  if (path === "governance/committees" && method === "GET") {
    const committees = COMMITTEES.map((c) => ({
      ...c,
      chairUser: USERS.find((u) => u._id === c.chairUserId),
    }));
    return json(res, 200, { items: committees, total: committees.length });
  }
  
  if (parts.length === 3 && parts[0] === "governance/committees" && parts[2] === "meetings" && method === "POST") {
    const committee = COMMITTEES.find((c) => c._id === parts[1]);
    if (!committee) return json(res, 404, { message: "Committee not found" });
    const body = await readBody(req);
    const meetings = COMMITTEE_MEETINGS.filter((m) => m.committeeId === parts[1]);
    const newMeeting = {
      _id: `cmt-${Date.now()}`,
      committeeId: parts[1],
      meetingNumber: meetings.length + 1,
      scheduledDate: body.scheduledDate,
      actualDate: null,
      attendeeUserIds: body.attendeeUserIds || [],
      agendaItems: body.agendaItems || [],
      minutesAttachmentId: null,
      status: "Scheduled",
    };
    COMMITTEE_MEETINGS.push(newMeeting);
    return json(res, 201, newMeeting);
  }
  
  if (parts.length === 5 && parts[0] === "governance/committees" && parts[2] === "meetings" && parts[4] === "decisions" && method === "POST") {
    const meeting = COMMITTEE_MEETINGS.find((m) => m._id === parts[3] && m.committeeId === parts[1]);
    if (!meeting) return json(res, 404, { message: "Meeting not found" });
    const committee = COMMITTEES.find((c) => c._id === parts[1]);
    if (!committee) return json(res, 404, { message: "Committee not found" });
    
    // Check quorum
    if (meeting.attendeeUserIds.length < committee.quorumRequired) {
      return json(res, 400, { 
        message: "Quorum not met — decision cannot be recorded",
        attendees: meeting.attendeeUserIds.length,
        required: committee.quorumRequired,
      });
    }
    
    const body = await readBody(req);
    const newDecision = {
      _id: `cd-${Date.now()}`,
      meetingId: parts[3],
      committeeId: parts[1],
      description: body.description,
      relatedEntityType: body.relatedEntityType || null,
      relatedEntityId: body.relatedEntityId || null,
      decisionType: body.decisionType || "Other",
      votesFor: body.votesFor || meeting.attendeeUserIds.length,
      votesAgainst: body.votesAgainst || 0,
      decidedAt: new Date().toISOString(),
    };
    COMMITTEE_DECISIONS.push(newDecision);
    return json(res, 201, newDecision);
  }
  
  // Exceptions Routes
  if (path === "governance/exceptions" && method === "GET") {
    const exceptions = EXCEPTIONS.map((e) => ({
      ...e,
      requestedByUser: USERS.find((u) => u._id === e.requestedByUserId),
      ownerUser: USERS.find((u) => u._id === e.ownerUserId),
    }));
    return json(res, 200, { items: exceptions, total: exceptions.length });
  }
  
  if (path === "governance/exceptions" && method === "POST") {
    const body = await readBody(req);
    const errors = [];
    if (!body.title) errors.push("Title is required");
    if (!body.description) errors.push("Description is required");
    if (!body.businessJustification) errors.push("Business justification is required");
    if (!body.requestedUntil) errors.push("requestedUntil is required");
    if (errors.length > 0) return json(res, 422, { message: "Validation failed", errors });
    
    const exceptionCode = `EXC-${String(EXCEPTIONS.length + 1).padStart(3, "0")}`;
    const newException = {
      _id: `exc-${Date.now()}`,
      exceptionCode,
      title: body.title,
      description: body.description,
      relatedPolicyId: body.relatedPolicyId || null,
      relatedControlId: body.relatedControlId || null,
      relatedRiskId: body.relatedRiskId || null,
      exceptionEffectivenessOverride: body.exceptionEffectivenessOverride || null,
      businessJustification: body.businessJustification,
      compensatingControls: body.compensatingControls || "",
      requestedByUserId: tokenUser(req)?._id || "u-admin",
      ownerUserId: body.ownerUserId || tokenUser(req)?._id || "u-admin",
      status: "Draft",
      requestedFrom: body.requestedFrom || new Date().toISOString(),
      requestedUntil: body.requestedUntil,
      approverUserId: null, approvedAt: null, rejectionReason: null,
      reviewDate: body.reviewDate || new Date().toISOString(),
      attachmentIds: body.attachmentIds || [],
    };
    EXCEPTIONS.push(newException);
    return json(res, 201, newException);
  }

  if (parts.length === 3 && parts[0] === "governance" && parts[1] === "exceptions" && method === "PUT") {
    const idx = EXCEPTIONS.findIndex((x) => x._id === parts[2]);
    if (idx < 0) return json(res, 404, { message: "Exception not found" });
    const body = await readBody(req);
    Object.assign(EXCEPTIONS[idx], body, { updatedAt: new Date().toISOString() });
    return json(res, 200, EXCEPTIONS[idx]);
  }

  if (parts.length === 4 && parts[0] === "governance" && parts[1] === "exceptions" && parts[3] === "approve" && method === "POST") {
    const idx = EXCEPTIONS.findIndex((x) => x._id === parts[2]);
    if (idx < 0) return json(res, 404, { message: "Exception not found" });
    EXCEPTIONS[idx].status = "Approved";
    EXCEPTIONS[idx].approvedBy = tokenUser(req)?._id || "u-admin";
    EXCEPTIONS[idx].approvedAt = new Date().toISOString();
    return json(res, 200, EXCEPTIONS[idx]);
  }

  const collection = COLLECTIONS[path];
  if (collection && path === "policies" && method === "GET") {
    try {
      const { items, total, page, pageSize } = filterList(collection, query);
      const enrichedItems = items.map((policy) => {
        try {
          const summary = lifecycleService.getPolicySummary(policy._id);
          return { ...withJoins(policy), lifecycleState: summary.lifecycleState, currentActiveVersionNumber: summary.currentActiveVersionNumber, latestVersionNumber: summary.latestVersionNumber, reviewStatus: summary.reviewStatus, nextReviewDate: summary.nextReviewDate, hasDraftVersion: summary.hasDraftVersion, hasPendingReview: summary.hasPendingReview, hasPendingApproval: summary.hasPendingApproval };
        } catch {
          return withJoins(policy);
        }
      });
      return json(res, 200, { items: enrichedItems, total, page, pageSize });
    } catch (err) {
      console.error("[ERROR] policy list error:", err.message, err.stack);
      return json(res, 500, { message: "Internal error: " + err.message });
    }
  }
  if (collection) {
    if (method === "GET") {
      try {
        const { items, total, page, pageSize } = filterList(collection, query);
        return json(res, 200, { items: items.map(withJoins), total, page, pageSize });
      } catch (err) {
        console.error("[ERROR] filterList/withJoins error:", err.message, err.stack);
        return json(res, 500, { message: "Internal error: " + err.message });
      }
    }
    if (method === "POST") {
      const body = await readBody(req);
      const rec = { _id: newId("rec"), ...body, createdAt: new Date().toISOString() };
      collection.unshift(rec);
      return json(res, 200, withJoins(rec));
    }
  }
  if (parts.length >= 2) {
    const collection2 = COLLECTIONS[parts.slice(0, -1).join("/")];
    const id = parts[parts.length - 1];
    const idx = collection2 ? collection2.findIndex((r) => r._id === id) : -1;
    if (idx >= 0) {
      if (method === "GET") return json(res, 200, withJoins(collection2[idx]));
      if (method === "PUT") {
        const body = await readBody(req);
        Object.assign(collection2[idx], body, { updatedAt: new Date().toISOString() });
        return json(res, 200, withJoins(collection2[idx]));
      }
      if (method === "DELETE") {
        collection2.splice(idx, 1);
        for (let i = LINKS.length - 1; i >= 0; i--) {
          if (parts[0] === "risks" && LINKS[i].risk_id === id) LINKS.splice(i, 1);
          if ((parts[0] === "controls" || parts[0] === "compliance/controls") && LINKS[i].control_id === id) LINKS.splice(i, 1);
        }
        return json(res, 200, { ok: true });
      }
    }
  }

  // Controls-specific validation
  if ((path === "controls" || path === "compliance/controls") && method === "POST") {
    const body = await readBody(req);
    const errors = [];
    if (!body.controlId) errors.push("Control ID is required");
    if (!body.name) errors.push("Name is required");
    if (!body.category) errors.push("Category is required");
    if (!body.status) errors.push("Status is required");
    if (!body.owner) errors.push("Owner is required");
    if (errors.length) return json(res, 422, { message: "Validation failed", errors });
    const exists = CONTROLS.find((c) => c.controlId === body.controlId);
    if (exists) return json(res, 422, { message: `Control ID '${body.controlId}' already exists` });
    const progress = body.progress ?? 0;
    let status = body.status;
    if (progress === 0) status = "Inactive / Planned";
    else if (progress === 100) status = "Active / Implemented";
    else status = "In Progress / Under Implementation";
    const designEff = body.effectiveness?.design ?? 0;
    const operatingEff = body.effectiveness?.operating ?? 0;
    const coverage = body.effectiveness?.coverage ?? 0;
    const testing = body.effectiveness?.testing ?? 0;
    const overall = Math.round(designEff * 0.25 + operatingEff * 0.35 + coverage * 0.25 + testing * 0.15);
    const newControl = {
      _id: newId("ctl"),
      ...body,
      status,
      progress,
      effectiveness: { design: designEff, operating: operatingEff, coverage, testing, overall },
      createdAt: new Date().toISOString(),
    };
    CONTROLS.unshift(newControl);
    return json(res, 200, withJoins(newControl));
  }

  if (parts.length === 2 && (parts[0] === "controls" || parts[0] === "compliance/controls") && method === "PUT") {
    const id = parts[1];
    const idx = CONTROLS.findIndex((c) => c._id === id);
    if (idx < 0) return json(res, 404, { message: "Control not found" });
    const body = await readBody(req);
    const progress = body.progress ?? CONTROLS[idx].progress ?? 0;
    let status = body.status || CONTROLS[idx].status;
    if (progress === 0) status = "Inactive / Planned";
    else if (progress === 100) status = "Active / Implemented";
    else status = "In Progress / Under Implementation";
    const designEff = body.effectiveness?.design ?? CONTROLS[idx].effectiveness?.design ?? 0;
    const operatingEff = body.effectiveness?.operating ?? CONTROLS[idx].effectiveness?.operating ?? 0;
    const coverage = body.effectiveness?.coverage ?? CONTROLS[idx].effectiveness?.coverage ?? 0;
    const testing = body.effectiveness?.testing ?? CONTROLS[idx].effectiveness?.testing ?? 0;
    const overall = Math.round(designEff * 0.25 + operatingEff * 0.35 + coverage * 0.25 + testing * 0.15);
    const updated = { ...CONTROLS[idx], ...body, status, progress, effectiveness: { design: designEff, operating: operatingEff, coverage, testing, overall }, updatedAt: new Date().toISOString() };
    CONTROLS[idx] = updated;
    return json(res, 200, withJoins(updated));
  }

  console.warn(`[wadjet:mock] Unhandled route (404): ${method} /api/${path}`);
  return json(res, 404, { message: `Not found: ${method} /${path}` });
};

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    handle(req, res, url).catch((err) => {
      console.error(err);
      if (!res.headersSent) json(res, 500, { message: "Internal error" });
    });
  })
  .listen(PORT, "0.0.0.0", () => {
  });