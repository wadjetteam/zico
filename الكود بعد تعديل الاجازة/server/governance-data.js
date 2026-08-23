/**
 * WADJET GRC — Governance Module Data Models
 * Enterprise-Grade Governance, Risk, and Compliance
 * 
 * Architecture Principles:
 * 1. No derived fields stored - all computed at read time
 * 2. Soft delete only - no hard deletes for governance records
 * 3. Action-based endpoints - no generic PUT for status changes
 * 4. Centralized audit trail - single recordAuditLog() function
 * 5. ID-only relationships - join at read time
 */

// ============================================
// CONSTANTS
// ============================================

export const GOVERNANCE_STATUS = {
  POLICY_VERSION: ["Draft", "Submitted", "InReview", "Approved", "Rejected", "Published", "Active", "Superseded"],
  POLICY_OVERALL: ["Draft", "InReview", "Approved", "Published", "Active", "Archived"],
  ROLE: ["Active", "Inactive"],
  COMMITTEE: ["Active", "Inactive"],
  EXCEPTION: ["Draft", "Submitted", "RiskAssessment", "UnderReview", "Approved", "Rejected", "Active", "Expired", "Closed"],
  ATTACHMENT: ["Active", "Archived"],
};

export const ALLOWED_GOVERNANCE_PERMISSIONS = [
  // Policy permissions
  "policy.view", "policy.create", "policy.edit", "policy.submit", "policy.approve",
  "policy.reject", "policy.publish", "policy.archive", "policy.acknowledge",
  // Role permissions
  "role.view", "role.manage",
  // Committee permissions
  "committee.view", "committee.manage", "committee.recordDecision",
  // Exception permissions
  "exception.view", "exception.create", "exception.approve", "exception.reject",
];

export const ALLOWED_FILE_TYPES = {
  pdf: { mime: "application/pdf", magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", magic: [0x50, 0x4B, 0x03, 0x04] }, // PK
  doc: { mime: "application/msword", magic: [0xD0, 0xCF, 0x11, 0xE0] },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", magic: [0x50, 0x4B, 0x03, 0x04] },
  png: { mime: "image/png", magic: [0x89, 0x50, 0x4E, 0x47] },
  jpg: { mime: "image/jpeg", magic: [0xFF, 0xD8, 0xFF] },
  jpeg: { mime: "image/jpeg", magic: [0xFF, 0xD8, 0xFF] },
};

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

// ============================================
// POLICY VERSIONING
// ============================================

export const POLICY_VERSIONS = [
  {
    _id: "pv-1",
    policyId: "pol-1",
    versionNumber: "3.2",
    content: "This policy establishes the enterprise information security framework...",
    changeSummary: "Updated access control requirements",
    attachmentIds: [],
    status: "Active",
    createdByUserId: "u-admin",
    createdAt: "2025-08-15T10:00:00Z",
    submittedByUserId: "u-admin",
    submittedAt: "2025-08-16T09:00:00Z",
    approvedByUserId: "u-manager",
    approvedAt: "2025-08-20T14:00:00Z",
    rejectedByUserId: null,
    rejectedAt: null,
    rejectionReason: null,
    publishedAt: "2025-08-21T08:00:00Z",
    effectiveDate: "2025-08-22T00:00:00Z",
    supersededAt: null,
    supersededByVersionId: null,
  },
  {
    _id: "pv-2",
    policyId: "pol-2",
    versionNumber: "2.1",
    content: "This policy governs the collection and processing of personal data...",
    changeSummary: "Added GDPR compliance requirements",
    attachmentIds: [],
    status: "Active",
    createdByUserId: "u-officer",
    createdAt: "2025-06-01T10:00:00Z",
    submittedByUserId: "u-officer",
    submittedAt: "2025-06-02T09:00:00Z",
    approvedByUserId: "u-manager",
    approvedAt: "2025-06-05T14:00:00Z",
    rejectedByUserId: null,
    rejectedAt: null,
    rejectionReason: null,
    publishedAt: "2025-06-06T08:00:00Z",
    effectiveDate: "2025-06-07T00:00:00Z",
    supersededAt: null,
    supersededByVersionId: null,
  },
];

export const POLICY_REVIEWS = [
  {
    _id: "pr-1",
    policyVersionId: "pv-1",
    reviewerUserId: "u-manager",
    sequence: 1,
    decision: "Approved",
    comment: "Content is comprehensive and aligns with ISO 27001",
    assignedAt: "2025-08-17T09:00:00Z",
    decidedAt: "2025-08-18T15:00:00Z",
  },
];

export const POLICY_ACKNOWLEDGEMENTS = [];

export const POLICY_AUDIT_LOG = [
  {
    _id: "pal-1",
    policyId: "pol-1",
    actorUserId: "u-admin",
    action: "policy.created",
    timestamp: "2025-08-15T10:00:00Z",
    details: { versionNumber: "3.2" },
  },
];

export const POLICY_TEMPLATES = [
  {
    _id: "pt-1",
    name: "Information Security Policy Template",
    category: "Information Security",
    defaultContent: "# Information Security Policy\n\n## 1. Purpose\n\n## 2. Scope\n\n## 3. Policy Statements\n\n## 4. Roles and Responsibilities\n\n## 5. Compliance",
    applicableFrameworks: ["ISO 27001", "NIST CSF"],
    status: "Active",
  },
];

// ============================================
// FILE ATTACHMENTS
// ============================================

export const ATTACHMENTS = [
  {
    _id: "att-1",
    originalFileName: "security-policy-v3.2.pdf",
    storedFileName: "a1b2c3d4e5f6.pdf",
    storagePath: "/storage/governance/policies/",
    mimeType: "application/pdf",
    sizeBytes: 245760,
    checksum: "sha256:abc123def456",
    uploadedByUserId: "u-admin",
    uploadedAt: "2025-08-15T10:30:00Z",
    relatedEntityType: "PolicyVersion",
    relatedEntityId: "pv-1",
    status: "Active",
    scanStatus: "Clean",
  },
];

// ============================================
// COMMITTEE MEETINGS & DECISIONS
// ============================================

export const COMMITTEE_MEETINGS = [
  {
    _id: "cmt-1",
    committeeId: "cm-1",
    meetingNumber: 1,
    scheduledDate: "2026-08-15T10:00:00Z",
    actualDate: "2026-08-15T10:05:00Z",
    attendeeUserIds: ["u-admin", "u-manager", "u-auditor"],
    agendaItems: ["Q3 Risk Review", "Policy Approvals", "Exception Review"],
    minutesAttachmentId: null,
    status: "Held",
  },
];

export const COMMITTEE_DECISIONS = [
  {
    _id: "cd-1",
    meetingId: "cmt-1",
    committeeId: "cm-1",
    description: "Approved Information Security Policy v3.2",
    relatedEntityType: "Policy",
    relatedEntityId: "pol-1",
    decisionType: "ApprovePolicy",
    votesFor: 3,
    votesAgainst: 0,
    decidedAt: "2026-08-15T11:30:00Z",
  },
];

export const COMMITTEE_ACTIONS = [
  {
    _id: "ca-1",
    decisionId: "cd-1",
    description: "Distribute policy to all staff",
    ownerUserId: "u-admin",
    dueDate: "2026-08-22T00:00:00Z",
    status: "Completed",
  },
];

// ============================================
// GOVERNANCE AUDIT LOG
// ============================================

export const GOVERNANCE_AUDIT_LOG = [
  {
    _id: "gal-1",
    actorUserId: "u-admin",
    timestamp: "2025-08-15T10:00:00Z",
    action: "policy.version.created",
    entityType: "PolicyVersion",
    entityId: "pv-1",
    oldValue: null,
    newValue: { versionNumber: "3.2", status: "Draft" },
    reason: null,
    ipAddress: "192.168.1.100",
  },
  {
    _id: "gal-2",
    actorUserId: "u-manager",
    timestamp: "2025-08-20T14:00:00Z",
    action: "policy.version.approved",
    entityType: "PolicyVersion",
    entityId: "pv-1",
    oldValue: { status: "InReview" },
    newValue: { status: "Approved" },
    reason: "Content is comprehensive",
    ipAddress: "192.168.1.101",
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Compute Policy status from versions
 * Rule: If any version is "Active" → "Active", otherwise latest non-Superseded version status
 */
export function computePolicyStatus(policyId, versions) {
  const policyVersions = versions.filter((v) => v.policyId === policyId);
  const activeVersion = policyVersions.find((v) => v.status === "Active");
  if (activeVersion) return "Active";
  
  const nonSuperseded = policyVersions
    .filter((v) => v.status !== "Superseded")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return nonSuperseded.length > 0 ? nonSuperseded[0].status : "Draft";
}

/**
 * Compute next review date from active version
 */
export function computeNextReviewDate(policy, versions) {
  const activeVersion = versions.find((v) => v.policyId === policy._id && v.status === "Active");
  if (!activeVersion || !activeVersion.effectiveDate) return null;
  const effectiveDate = new Date(activeVersion.effectiveDate);
  return new Date(effectiveDate.getTime() + policy.reviewPeriodDays * 24 * 60 * 60 * 1000);
}

/**
 * Compute review status based on next review date
 */
export function computeReviewStatus(nextReviewDate) {
  if (!nextReviewDate) return "OnTrack";
  const now = new Date();
  const daysUntilReview = Math.ceil((new Date(nextReviewDate) - now) / (24 * 60 * 60 * 1000));
  if (daysUntilReview < 0) return "Overdue";
  if (daysUntilReview <= 30) return "DueSoon";
  return "OnTrack";
}

/**
 * Compute acknowledgement rate
 */
export function computeAcknowledgementRate(acknowledgements) {
  if (!acknowledgements.length) return 0;
  const acknowledged = acknowledgements.filter((a) => a.status === "Acknowledged").length;
  return Math.round((acknowledged / acknowledgements.length) * 100);
}

/**
 * Compute quorum met for a meeting
 */
export function computeQuorumMet(meeting, committee) {
  return meeting.attendeeUserIds.length >= committee.quorumRequired;
}

/**
 * Compute is overdue for an action
 */
export function computeIsOverdue(action) {
  if (action.status !== "Open") return false;
  return new Date(action.dueDate) < new Date();
}

/**
 * Record audit log entry
 */
export function recordAuditLog(entry) {
  const logEntry = {
    _id: `gal-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  GOVERNANCE_AUDIT_LOG.unshift(logEntry);
  return logEntry;
}

/**
 * Validate file type by extension, MIME, and magic bytes
 */
export function validateFileType(fileName, mimeType, magicBytes) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (!extension || !ALLOWED_FILE_TYPES[extension]) {
    return { valid: false, reason: `File type .${extension} is not allowed` };
  }
  
  const allowed = ALLOWED_FILE_TYPES[extension];
  if (allowed.mime !== mimeType) {
    return { valid: false, reason: "MIME type does not match file extension" };
  }
  
  // Check magic bytes (simplified - in production, read actual file content)
  if (magicBytes && allowed.magic) {
    const matches = allowed.magic.every((byte, i) => magicBytes[i] === byte);
    if (!matches) {
      return { valid: false, reason: "File content does not match declared type" };
    }
  }
  
  return { valid: true };
}

/**
 * Malware scan stub - returns "Clean" always
 * TODO: Replace with actual malware scanning (ClamAV or enterprise solution)
 */
export function scanFileForMalware(attachmentId) {
  // Stub implementation - always returns "Clean"
  // In production, this would integrate with ClamAV or enterprise malware scanning
  return "Clean";
}

export default {
  GOVERNANCE_STATUS,
  ALLOWED_GOVERNANCE_PERMISSIONS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  POLICY_VERSIONS,
  POLICY_REVIEWS,
  POLICY_ACKNOWLEDGEMENTS,
  POLICY_TEMPLATES,
  ATTACHMENTS,
  COMMITTEE_MEETINGS,
  COMMITTEE_DECISIONS,
  COMMITTEE_ACTIONS,
  GOVERNANCE_AUDIT_LOG,
  POLICY_AUDIT_LOG,
  computePolicyStatus,
  computeNextReviewDate,
  computeReviewStatus,
  computeAcknowledgementRate,
  computeQuorumMet,
  computeIsOverdue,
  recordAuditLog,
  validateFileType,
  scanFileForMalware,
};
