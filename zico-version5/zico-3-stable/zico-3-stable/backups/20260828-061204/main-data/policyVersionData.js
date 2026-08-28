/**
 * WADJET GRC — Policy Lifecycle Data Model
 * 
 * This module defines all entities for the Policy Lifecycle Management Engine.
 * 
 * Architecture:
 * - Policy: Identity only (no lifecycle state)
 * - PolicyVersion: Authoritative lifecycle state
 * - PolicyReview: Review records
 * - PolicyApproval: Approval records
 * - PolicyAuditLog: Append-only, hash-chained audit trail
 */

import { createHash } from "node:crypto";
import { USERS } from "../mock-data.mjs";

// ============================================
// LIFECYCLE STATES (Canonical)
// ============================================

export const POLICY_LIFECYCLE_STATES = {
  DRAFT: "DRAFT",
  REVIEW: "REVIEW",
  APPROVAL: "APPROVAL",
  APPROVED: "APPROVED",
  PUBLISHED: "PUBLISHED",
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  ARCHIVED: "ARCHIVED",
  SUPERSEDED: "SUPERSEDED",
};

export const ARCHIVE_REASONS = {
  SUPERSEDED: "Superseded",
  RETIRED: "Retired",
  OBSOLETE: "Obsolete",
  DISABLED: "Disabled",
  REGULATORY_WITHDRAWAL: "RegulatoryWithdrawal",
  OTHER: "Other",
};

// ============================================
// STATE MACHINE TRANSITION RULES
// ============================================

export const STATE_TRANSITIONS = {
  DRAFT: ["REVIEW", "ARCHIVED"],
  REVIEW: ["APPROVAL", "DRAFT"],
  APPROVAL: ["APPROVED", "REVIEW"],
  APPROVED: ["PUBLISHED"],
  PUBLISHED: ["ACTIVE", "EXPIRED"],
  ACTIVE: ["EXPIRED", "ARCHIVED", "SUPERSEDED"],
  EXPIRED: ["ARCHIVED"],
  SUPERSEDED: ["ARCHIVED"],
  ARCHIVED: [],
};

// ============================================
// ACTION TO STATE MAPPING
// ============================================

export const ACTION_TO_STATE = {
  SUBMIT_FOR_REVIEW: "REVIEW",
  RETURN_TO_DRAFT: "DRAFT",
  START_APPROVAL: "APPROVAL",
  APPROVE: "APPROVED",
  REJECT: null, // Context-dependent
  PUBLISH: "PUBLISHED",
  ACTIVATE: "ACTIVE",
  EXPIRE: "EXPIRED",
  ARCHIVE: "ARCHIVED",
  SUPERSEDE: "SUPERSEDED",
};

// ============================================
// POLICY VERSIONS
// ============================================

export const POLICY_VERSIONS = [
  {
    _id: "pv-1",
    policyId: "pol-1",
    versionNumber: "3.2",
    title: "Information Security Policy",
    description: "Enterprise information security framework",
    content: "This policy establishes the enterprise information security framework...",
    category: "Information Security",
    classification: "Internal",
    ownerUserId: "u-admin",
    department: "IT",
    applicableTo: "All Employees",
    applicableRegions: ["Egypt", "UAE"],
    regulatoryBasis: "ISO 27001:2022",
    reviewPeriodDays: 365,
    status: "ACTIVE",
    createdAt: "2024-08-15T10:00:00Z",
    createdByUserId: "u-admin",
    submittedAt: "2024-08-16T09:00:00Z",
    submittedByUserId: "u-admin",
    reviewedAt: "2024-08-18T15:00:00Z",
    reviewedByUserId: "u-manager",
    approvedAt: "2024-08-20T14:00:00Z",
    approvedByUserId: "u-manager",
    publishedAt: "2024-08-22T08:00:00Z",
    publishedByUserId: "u-admin",
    effectiveDate: "2024-08-22T00:00:00Z",
    expirationDate: "2027-08-22T00:00:00Z",
    supersededAt: null,
    supersededByUserId: null,
    lastReviewDate: "2024-08-22T00:00:00Z",
    nextReviewDate: "2025-08-22T00:00:00Z",
  },
  {
    _id: "pv-2",
    policyId: "pol-2",
    versionNumber: "2.1",
    title: "Data Privacy Policy",
    description: "Handling of personal data",
    content: "This policy governs the collection and processing of personal data...",
    category: "Data Privacy",
    classification: "Internal",
    ownerUserId: "u-officer",
    department: "Legal",
    applicableTo: "All Employees",
    applicableRegions: ["Egypt"],
    regulatoryBasis: "GDPR, PDPL",
    reviewPeriodDays: 365,
    status: "ACTIVE",
    createdAt: "2024-06-01T10:00:00Z",
    createdByUserId: "u-officer",
    submittedAt: "2024-06-02T09:00:00Z",
    submittedByUserId: "u-officer",
    reviewedAt: "2024-06-05T14:00:00Z",
    reviewedByUserId: "u-manager",
    approvedAt: "2024-06-06T10:00:00Z",
    approvedByUserId: "u-manager",
    publishedAt: "2024-06-07T08:00:00Z",
    publishedByUserId: "u-officer",
    effectiveDate: "2024-06-07T00:00:00Z",
    expirationDate: "2027-06-07T00:00:00Z",
    supersededAt: null,
    supersededByUserId: null,
    lastReviewDate: "2024-06-07T00:00:00Z",
    nextReviewDate: "2025-06-07T00:00:00Z",
  },
  {
    _id: "pv-3",
    policyId: "pol-3",
    versionNumber: "1.8",
    title: "Acceptable Use Policy",
    description: "Acceptable use of company assets",
    content: "Users must use company systems for authorised business purposes...",
    category: "IT",
    classification: "Internal",
    ownerUserId: "u-admin",
    department: "IT",
    applicableTo: "All Employees",
    applicableRegions: ["Egypt"],
    regulatoryBasis: "Internal Policy",
    reviewPeriodDays: 365,
    status: "ACTIVE",
    createdAt: "2024-05-01T10:00:00Z",
    createdByUserId: "u-admin",
    submittedAt: "2024-05-02T09:00:00Z",
    submittedByUserId: "u-admin",
    reviewedAt: "2024-05-03T14:00:00Z",
    reviewedByUserId: "u-manager",
    approvedAt: "2024-05-04T10:00:00Z",
    approvedByUserId: "u-manager",
    publishedAt: "2024-05-05T08:00:00Z",
    publishedByUserId: "u-admin",
    effectiveDate: "2024-05-05T00:00:00Z",
    expirationDate: "2027-05-05T00:00:00Z",
    supersededAt: null,
    supersededByUserId: null,
    lastReviewDate: "2024-05-05T00:00:00Z",
    nextReviewDate: "2025-05-05T00:00:00Z",
  },
  {
    _id: "pv-4",
    policyId: "pol-4",
    versionNumber: "2.0",
    title: "Incident Response Policy",
    description: "Security incident handling",
    content: "All security incidents must be reported to the SOC within 30 minutes...",
    category: "Information Security",
    classification: "Internal",
    ownerUserId: "u-admin",
    department: "IT",
    applicableTo: "All Employees",
    applicableRegions: ["Egypt"],
    regulatoryBasis: "ISO 27001:2022",
    reviewPeriodDays: 365,
    status: "APPROVED",
    createdAt: "2026-08-01T10:00:00Z",
    createdByUserId: "u-admin",
    submittedAt: "2026-08-02T09:00:00Z",
    submittedByUserId: "u-admin",
    reviewedAt: "2026-08-03T14:00:00Z",
    reviewedByUserId: "u-manager",
    approvedAt: "2026-08-20T10:00:00Z",
    approvedByUserId: "u-manager",
    publishedAt: null,
    publishedByUserId: null,
    effectiveDate: null,
    expirationDate: null,
    supersededAt: null,
    supersededByUserId: null,
    lastReviewDate: null,
    nextReviewDate: null,
  },
  {
    _id: "pv-5",
    policyId: "pol-5",
    versionNumber: "1.3",
    title: "Third-Party Risk Management Policy",
    description: "Vendor due diligence",
    content: "All vendors with access to bank data must complete due diligence...",
    category: "Third-Party",
    classification: "Internal",
    ownerUserId: "u-manager",
    department: "Procurement",
    applicableTo: "Procurement Team",
    applicableRegions: ["Egypt"],
    regulatoryBasis: "CBE Regulations",
    reviewPeriodDays: 365,
    status: "DRAFT",
    createdAt: "2026-08-10T10:00:00Z",
    createdByUserId: "u-manager",
    submittedAt: null,
    submittedByUserId: null,
    reviewedAt: null,
    reviewedByUserId: null,
    approvedAt: null,
    approvedByUserId: null,
    publishedAt: null,
    publishedByUserId: null,
    effectiveDate: null,
    expirationDate: null,
    supersededAt: null,
    supersededByUserId: null,
    lastReviewDate: null,
    nextReviewDate: null,
  },
  {
    _id: "pv-6",
    policyId: "pol-6",
    versionNumber: "1.0",
    title: "Business Continuity Policy",
    description: "BCP framework and disaster recovery",
    content: "The organization shall maintain business continuity plans...",
    category: "Operational",
    classification: "Internal",
    ownerUserId: "u-admin",
    department: "IT",
    applicableTo: "All Employees",
    applicableRegions: ["Egypt", "UAE"],
    regulatoryBasis: "ISO 22301",
    reviewPeriodDays: 365,
    status: "REVIEW",
    createdAt: "2026-08-12T10:00:00Z",
    createdByUserId: "u-admin",
    submittedAt: "2026-08-14T09:00:00Z",
    submittedByUserId: "u-admin",
    reviewedAt: null,
    reviewedByUserId: null,
    approvedAt: null,
    approvedByUserId: null,
    publishedAt: null,
    publishedByUserId: null,
    effectiveDate: null,
    expirationDate: null,
    supersededAt: null,
    supersededByUserId: null,
    lastReviewDate: null,
    nextReviewDate: null,
  },
  {
    _id: "pv-7",
    policyId: "pol-7",
    versionNumber: "2.0",
    title: "Access Control Policy",
    description: "User access management and privileged accounts",
    content: "Access to systems shall be granted based on least privilege principle...",
    category: "Information Security",
    classification: "Internal",
    ownerUserId: "u-manager",
    department: "IT",
    applicableTo: "All Employees",
    applicableRegions: ["Egypt"],
    regulatoryBasis: "ISO 27001:2022",
    reviewPeriodDays: 365,
    status: "APPROVAL",
    createdAt: "2026-08-05T10:00:00Z",
    createdByUserId: "u-manager",
    submittedAt: "2026-08-06T09:00:00Z",
    submittedByUserId: "u-manager",
    reviewedAt: "2026-08-08T14:00:00Z",
    reviewedByUserId: "u-manager",
    approvedAt: null,
    approvedByUserId: null,
    publishedAt: null,
    publishedByUserId: null,
    effectiveDate: null,
    expirationDate: null,
    supersededAt: null,
    supersededByUserId: null,
    lastReviewDate: null,
    nextReviewDate: null,
  },
  {
    _id: "pv-8",
    policyId: "pol-8",
    versionNumber: "1.0",
    title: "Data Classification Policy",
    description: "Data classification and handling requirements",
    content: "All data shall be classified according to sensitivity levels...",
    category: "Data Privacy",
    classification: "Internal",
    ownerUserId: "u-officer",
    department: "Legal",
    applicableTo: "All Employees",
    applicableRegions: ["Egypt"],
    regulatoryBasis: "PDPL",
    reviewPeriodDays: 365,
    status: "PUBLISHED",
    createdAt: "2026-08-18T10:00:00Z",
    createdByUserId: "u-officer",
    submittedAt: "2026-08-18T11:00:00Z",
    submittedByUserId: "u-officer",
    reviewedAt: "2026-08-19T14:00:00Z",
    reviewedByUserId: "u-manager",
    approvedAt: "2026-08-20T10:00:00Z",
    approvedByUserId: "u-manager",
    publishedAt: "2026-08-21T08:00:00Z",
    publishedByUserId: "u-officer",
    effectiveDate: "2026-09-01T00:00:00Z",
    expirationDate: "2027-09-01T00:00:00Z",
    supersededAt: null,
    supersededByUserId: null,
    lastReviewDate: null,
    nextReviewDate: null,
  },
  {
    _id: "pv-9",
    policyId: "pol-9",
    versionNumber: "1.0",
    title: "Legacy Password Policy",
    description: "Password requirements (deprecated)",
    content: "Passwords must be at least 8 characters...",
    category: "Information Security",
    classification: "Internal",
    ownerUserId: "u-admin",
    department: "IT",
    applicableTo: "All Employees",
    applicableRegions: ["Egypt"],
    regulatoryBasis: "Internal Policy",
    reviewPeriodDays: 365,
    status: "EXPIRED",
    createdAt: "2023-01-01T10:00:00Z",
    createdByUserId: "u-admin",
    submittedAt: "2023-01-02T09:00:00Z",
    submittedByUserId: "u-admin",
    reviewedAt: "2023-01-03T14:00:00Z",
    reviewedByUserId: "u-manager",
    approvedAt: "2023-01-04T10:00:00Z",
    approvedByUserId: "u-manager",
    publishedAt: "2023-01-05T08:00:00Z",
    publishedByUserId: "u-admin",
    effectiveDate: "2023-01-05T00:00:00Z",
    expirationDate: "2026-01-05T00:00:00Z",
    supersededAt: null,
    supersededByUserId: null,
    lastReviewDate: "2023-01-05T00:00:00Z",
    nextReviewDate: "2024-01-05T00:00:00Z",
  },
  {
    _id: "pv-10",
    policyId: "pol-10",
    versionNumber: "1.0",
    title: "Outdated IT Security Policy",
    description: "Replaced by Information Security Policy",
    content: "This policy has been archived...",
    category: "Information Security",
    classification: "Internal",
    ownerUserId: "u-admin",
    department: "IT",
    applicableTo: "All Employees",
    applicableRegions: ["Egypt"],
    regulatoryBasis: "Internal Policy",
    reviewPeriodDays: 365,
    status: "ARCHIVED",
    createdAt: "2022-06-01T10:00:00Z",
    createdByUserId: "u-admin",
    submittedAt: "2022-06-02T09:00:00Z",
    submittedByUserId: "u-admin",
    reviewedAt: "2022-06-03T14:00:00Z",
    reviewedByUserId: "u-manager",
    approvedAt: "2022-06-04T10:00:00Z",
    approvedByUserId: "u-manager",
    publishedAt: "2022-06-05T08:00:00Z",
    publishedByUserId: "u-admin",
    effectiveDate: "2022-06-05T00:00:00Z",
    expirationDate: "2025-06-05T00:00:00Z",
    supersededAt: null,
    supersededByUserId: null,
    lastReviewDate: "2022-06-05T00:00:00Z",
    nextReviewDate: "2023-06-05T00:00:00Z",
    archiveReason: "Superseded",
  },
  {
    _id: "pv-11",
    policyId: "pol-1",
    versionNumber: "4.0",
    title: "Information Security Policy",
    description: "Enterprise information security framework (draft revision)",
    content: "This policy establishes the enterprise information security framework. [DRAFT REVIEW - Updated for 2026 requirements]",
    category: "Information Security",
    classification: "Internal",
    ownerUserId: "u-admin",
    department: "IT",
    applicableTo: "All Employees",
    applicableRegions: ["Egypt", "UAE", "KSA"],
    regulatoryBasis: "ISO 27001:2022",
    reviewPeriodDays: 365,
    status: "DRAFT",
    createdAt: "2026-08-20T10:00:00Z",
    createdByUserId: "u-admin",
    submittedAt: null,
    submittedByUserId: null,
    reviewedAt: null,
    reviewedByUserId: null,
    approvedAt: null,
    approvedByUserId: null,
    publishedAt: null,
    publishedByUserId: null,
    effectiveDate: null,
    expirationDate: null,
    supersededAt: null,
    supersededByUserId: null,
    lastReviewDate: null,
    nextReviewDate: null,
  },
];

// ============================================
// POLICY REVIEWS
// ============================================

export const POLICY_REVIEWS = [
  {
    _id: "pr-1",
    policyVersionId: "pv-1",
    reviewerUserId: "u-manager",
    role: "CISO",
    sequence: 1,
    status: "APPROVED",
    assignedAt: "2024-08-17T09:00:00Z",
    dueAt: "2024-08-19T09:00:00Z",
    decision: "APPROVED",
    comments: "Content is comprehensive and aligns with ISO 27001",
    decidedAt: "2024-08-18T15:00:00Z",
  },
  {
    _id: "pr-2",
    policyVersionId: "pv-4",
    reviewerUserId: "u-manager",
    role: "CISO",
    sequence: 1,
    status: "APPROVED",
    assignedAt: "2026-08-03T09:00:00Z",
    dueAt: "2026-08-05T09:00:00Z",
    decision: "APPROVED",
    comments: "Incident response procedures are well-defined",
    decidedAt: "2026-08-03T14:00:00Z",
  },
  {
    _id: "pr-3",
    policyVersionId: "pv-6",
    reviewerUserId: "u-manager",
    role: "CISO",
    sequence: 1,
    status: "PENDING",
    assignedAt: "2026-08-14T09:00:00Z",
    dueAt: "2026-08-16T09:00:00Z",
    decision: null,
    comments: null,
    decidedAt: null,
  },
  {
    _id: "pr-4",
    policyVersionId: "pv-7",
    reviewerUserId: "u-manager",
    role: "CISO",
    sequence: 1,
    status: "APPROVED",
    assignedAt: "2026-08-06T09:00:00Z",
    dueAt: "2026-08-08T09:00:00Z",
    decision: "APPROVED",
    comments: "Access control requirements are comprehensive",
    decidedAt: "2026-08-08T14:00:00Z",
  },
];

// ============================================
// POLICY APPROVALS
// ============================================

export const POLICY_APPROVALS = [
  {
    _id: "pa-1",
    policyVersionId: "pv-1",
    approverUserId: "u-manager",
    requiredRole: "CISO",
    sequence: 1,
    status: "APPROVED",
    comments: "Approved for publication",
    decidedAt: "2024-08-20T14:00:00Z",
    dueAt: "2024-08-22T14:00:00Z",
    escalatedAt: null,
    escalatedToUserId: null,
  },
  {
    _id: "pa-2",
    policyVersionId: "pv-4",
    approverUserId: "u-manager",
    requiredRole: "CISO",
    sequence: 1,
    status: "APPROVED",
    comments: "Approved",
    decidedAt: "2026-08-20T10:00:00Z",
    dueAt: "2026-08-22T10:00:00Z",
    escalatedAt: null,
    escalatedToUserId: null,
  },
  {
    _id: "pa-3",
    policyVersionId: "pv-7",
    approverUserId: "u-manager",
    requiredRole: "CISO",
    sequence: 1,
    status: "PENDING",
    comments: null,
    decidedAt: null,
    dueAt: "2026-08-25T10:00:00Z",
    escalatedAt: null,
    escalatedToUserId: null,
  },
];

// ============================================
// POLICY AUDIT LOG (Hash-chained)
// ============================================

export const POLICY_AUDIT_LOG = [
  {
    _id: "pal-1",
    entityType: "PolicyVersion",
    entityId: "pv-1",
    policyId: "pol-1",
    action: "POLICY_CREATED",
    fromState: null,
    toState: "DRAFT",
    actorUserId: "u-admin",
    actorRoleAtTime: "board",
    timestamp: "2024-08-15T10:00:00Z",
    reason: null,
    metadata: { versionNumber: "3.2" },
    ipAddress: "192.168.1.100",
    previousEntryHash: null,
    entryHash: "sha256:abc123...",
  },
  {
    _id: "pal-2",
    entityType: "PolicyVersion",
    entityId: "pv-1",
    policyId: "pol-1",
    action: "SUBMITTED_FOR_REVIEW",
    fromState: "DRAFT",
    toState: "REVIEW",
    actorUserId: "u-admin",
    actorRoleAtTime: "board",
    timestamp: "2024-08-16T09:00:00Z",
    reason: null,
    metadata: {},
    ipAddress: "192.168.1.100",
    previousEntryHash: "sha256:abc123...",
    entryHash: "sha256:def456...",
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Compute the current lifecycle state of a policy
 * based on its versions
 */
export function computePolicyState(policyId, versions) {
  const policyVersions = versions.filter((v) => v.policyId === policyId);
  
  // Check if any version is ACTIVE
  const activeVersion = policyVersions.find((v) => v.status === "ACTIVE");
  if (activeVersion) {
    return {
      state: "ACTIVE",
      activeVersionId: activeVersion._id,
      activeVersionNumber: activeVersion.versionNumber,
    };
  }
  
  // Find the latest non-Superseded version
  const latestVersion = policyVersions
    .filter((v) => v.status !== "SUPERSEDED")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  
  if (!latestVersion) {
    return { state: "DRAFT", activeVersionId: null, activeVersionNumber: null };
  }

  // If the latest version is ARCHIVED or EXPIRED, show that state
  if (latestVersion.status === "ARCHIVED" || latestVersion.status === "EXPIRED") {
    return {
      state: latestVersion.status,
      activeVersionId: latestVersion._id,
      activeVersionNumber: latestVersion.versionNumber,
    };
  }
  
  return {
    state: latestVersion.status,
    activeVersionId: latestVersion._id,
    activeVersionNumber: latestVersion.versionNumber,
  };
}

/**
 * Compute review status based on next review date
 */
export function computeReviewStatus(nextReviewDate) {
  if (!nextReviewDate) return "OnTrack";
  
  const now = new Date();
  const nextReview = new Date(nextReviewDate);
  const daysUntilReview = Math.ceil((nextReview - now) / (24 * 60 * 60 * 1000));
  
  if (daysUntilReview < 0) return "Overdue";
  if (daysUntilReview <= 30) return "DueSoon";
  return "UpToDate";
}

/**
 * Calculate next review date
 */
export function calculateNextReviewDate(lastReviewDate, reviewPeriodDays) {
  if (!lastReviewDate) return null;
  const date = new Date(lastReviewDate);
  return new Date(date.getTime() + reviewPeriodDays * 24 * 60 * 60 * 1000);
}

/**
 * Validate state transition
 */
export function isValidTransition(fromState, toState) {
  const allowedTransitions = STATE_TRANSITIONS[fromState] || [];
  return allowedTransitions.includes(toState);
}

/**
 * Compute audit entry hash
 */
export function computeAuditHash(entry, previousHash) {
  const content = JSON.stringify({ ...entry, previousEntryHash: previousHash });
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

/**
 * Process lifecycle dates (expiration/activation)
 */
export function processPolicyLifecycleDates(policyId, versions, currentDate = new Date()) {
  const policyVersions = versions.filter((v) => v.policyId === policyId);
  const changes = [];
  
  for (const version of policyVersions) {
    // Check expiration
    if (version.status === "ACTIVE" && version.expirationDate) {
      if (currentDate > new Date(version.expirationDate)) {
        version.status = "EXPIRED";
        changes.push({
          versionId: version._id,
          fromState: "ACTIVE",
          toState: "EXPIRED",
          reason: "Expiration date reached",
        });
      }
    }
    
    // Check activation (PUBLISHED with effectiveDate <= now)
    if (version.status === "PUBLISHED" && version.effectiveDate) {
      if (currentDate >= new Date(version.effectiveDate)) {
        version.status = "ACTIVE";
        version.lastReviewDate = version.effectiveDate;
        version.nextReviewDate = calculateNextReviewDate(
          version.effectiveDate,
          version.reviewPeriodDays
        ).toISOString();
        changes.push({
          versionId: version._id,
          fromState: "PUBLISHED",
          toState: "ACTIVE",
          reason: "Effective date reached",
        });
      }
    }
  }
  
  return changes;
}

/**
 * Verify the integrity of the audit chain
 * Detects if any entry has been tampered with by checking hash chain
 */
export function verifyAuditChainIntegrity(auditLog) {
  if (!auditLog || auditLog.length === 0) {
    return { valid: true, totalEntries: 0, issues: [] };
  }

  const sorted = [...auditLog].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const issues = [];

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];

    // Verify entry hash
    const { entryHash, previousEntryHash, ...content } = entry;
    const computedContent = JSON.stringify({ ...content, previousEntryHash });
    const computedHash = `sha256:${createHash("sha256").update(computedContent).digest("hex")}`;

    if (entryHash !== computedHash) {
      issues.push({
        entryId: entry._id,
        issue: "HASH_MISMATCH",
        detail: "Entry content has been modified since creation",
      });
    }

    // Verify chain link
    if (i === 0) {
      if (previousEntryHash !== null) {
        issues.push({
          entryId: entry._id,
          issue: "CHAIN_BROKEN",
          detail: "First entry should have null previousEntryHash",
        });
      }
    } else {
      const prevEntry = sorted[i - 1];
      if (previousEntryHash !== prevEntry.entryHash) {
        issues.push({
          entryId: entry._id,
          issue: "CHAIN_BROKEN",
          detail: `Chain link broken: previousEntryHash does not match entry ${prevEntry._id}`,
        });
      }
    }
  }

  return {
    valid: issues.length === 0,
    totalEntries: sorted.length,
    issues,
  };
}

export default {
  POLICY_LIFECYCLE_STATES,
  ARCHIVE_REASONS,
  STATE_TRANSITIONS,
  ACTION_TO_STATE,
  POLICY_VERSIONS,
  POLICY_REVIEWS,
  POLICY_APPROVALS,
  POLICY_AUDIT_LOG,
  computePolicyState,
  computeReviewStatus,
  calculateNextReviewDate,
  isValidTransition,
  computeAuditHash,
  processPolicyLifecycleDates,
  verifyAuditChainIntegrity,
};
