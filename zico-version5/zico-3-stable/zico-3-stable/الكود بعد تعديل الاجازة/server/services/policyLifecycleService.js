/**
 * WADJET GRC — Policy Lifecycle Service
 * 
 * Centralized service for managing policy lifecycle transitions.
 * Implements the state machine defined in policyVersionData.js.
 * 
 * All state transitions go through this service.
 * Frontend never directly sets status.
 */

import { createHash } from "node:crypto";
import {
  POLICY_VERSIONS,
  POLICY_REVIEWS,
  POLICY_APPROVALS,
} from "../data/policyVersionData.js";
import {
  GOVERNANCE_AUDIT_LOG,
} from "../governance-data.js";
import {
  STATE_TRANSITIONS,
  computePolicyState,
  computeReviewStatus,
  calculateNextReviewDate,
  isValidTransition,
} from "../data/policyVersionData.js";
import { USERS, POLICIES } from "../mock-data.mjs";
import { checkSoDConstraint } from "./sodService.js";

// ============================================
// ERROR CODES
// ============================================

export const POLICY_ERRORS = {
  INVALID_TRANSITION: "INVALID_TRANSITION",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  VERSION_IMMUTABLE: "VERSION_IMMUTABLE",
  MISSING_REVIEW: "MISSING_REVIEW",
  MISSING_APPROVAL: "MISSING_APPROVAL",
  REJECTION_REASON_REQUIRED: "REJECTION_REASON_REQUIRED",
  SELF_APPROVAL_NOT_ALLOWED: "SELF_APPROVAL_NOT_ALLOWED",
  ACTIVE_VERSION_CONFLICT: "ACTIVE_VERSION_CONFLICT",
  POLICY_NOT_FOUND: "POLICY_NOT_FOUND",
  VERSION_NOT_FOUND: "VERSION_NOT_FOUND",
  REQUIRED_FIELD_MISSING: "REQUIRED_FIELD_MISSING",
  INVALID_EFFECTIVE_DATE: "INVALID_EFFECTIVE_DATE",
};

// ============================================
// PERMISSIONS
// ============================================

const PERMISSIONS = {
  "policy.create": ["admin", "board", "ciso"],
  "policy.edit": ["admin", "board", "ciso"],
  "policy.submit_review": ["admin", "board", "ciso", "risk_owner"],
  "policy.review": ["admin", "board", "ciso", "cro"],
  "policy.approve": ["admin", "board", "ciso"],
  "policy.publish": ["admin", "board", "ciso"],
  "policy.publish_direct": ["admin", "board"],
  "policy.archive": ["admin", "board", "ciso"],
  "policy.create_version": ["admin", "board", "ciso"],
  "policy.delete": ["admin", "board"],
};

/**
 * Check if user has permission
 */
function hasPermission(userId, permission) {
  const user = USERS.find((u) => u._id === userId);
  if (!user) return false;
  const allowedRoles = PERMISSIONS[permission] || [];
  return allowedRoles.includes(user.role);
}

/**
 * Get user role at current time
 */
function getUserRole(userId) {
  const user = USERS.find((u) => u._id === userId);
  return user?.role || "unknown";
}

/**
 * Record audit event
 */
function recordAudit(event) {
  const previousEntry = GOVERNANCE_AUDIT_LOG[0] || null;
  const entry = {
    _id: `pal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    previousEntryHash: previousEntry?.entryHash || null,
    ...event,
  };
  
  const content = JSON.stringify({ ...entry, previousEntryHash: entry.previousEntryHash });
  entry.entryHash = `sha256:${createHash("sha256").update(content).digest("hex")}`;
  
  GOVERNANCE_AUDIT_LOG.unshift(entry);
  return entry;
}

/**
 * Get policy by ID
 */
function getPolicy(policyId) {
  return POLICIES.find((p) => p._id === policyId);
}

/**
 * Get version by ID
 */
function getVersion(versionId) {
  return POLICY_VERSIONS.find((v) => v._id === versionId);
}

/**
 * Get versions for a policy
 */
function getPolicyVersions(policyId) {
  return POLICY_VERSIONS.filter((v) => v.policyId === policyId);
}

/**
 * Get current active version for a policy
 */
function getActiveVersion(policyId) {
  return POLICY_VERSIONS.find((v) => v.policyId === policyId && v.status === "ACTIVE");
}

/**
 * Get latest version for a policy
 */
function getLatestVersion(policyId) {
  const versions = getPolicyVersions(policyId);
  return versions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
}

// ============================================
// LIFECYCLE TRANSITIONS
// ============================================

/**
 * Transition a policy version to a new state
 */
function transitionVersion(versionId, action, actorUserId, metadata = {}) {
  const version = getVersion(versionId);
  if (!version) {
    throw { code: POLICY_ERRORS.VERSION_NOT_FOUND, message: "Policy version not found" };
  }
  
  // Determine target state based on action
  let targetState;
  
  switch (action) {
    case "SUBMIT_FOR_REVIEW":
      targetState = "REVIEW";
      break;
    case "RETURN_TO_DRAFT":
      targetState = "DRAFT";
      break;
    case "START_APPROVAL":
      targetState = "APPROVAL";
      break;
    case "APPROVE":
      // Context-dependent: could be review approval or final approval
      if (version.status === "REVIEW") targetState = "APPROVAL";
      else if (version.status === "APPROVAL") targetState = "APPROVED";
      else throw { code: POLICY_ERRORS.INVALID_TRANSITION, message: `Cannot approve from state ${version.status}` };
      break;
    case "REJECT":
      // Context-dependent: rejection moves back one step
      if (version.status === "REVIEW") targetState = "DRAFT";
      else if (version.status === "APPROVAL") targetState = "REVIEW";
      else throw { code: POLICY_ERRORS.INVALID_TRANSITION, message: `Cannot reject from state ${version.status}` };
      
      // Rejection requires a reason
      if (!metadata.reason || metadata.reason.trim().length < 10) {
        throw {
          code: POLICY_ERRORS.REJECTION_REASON_REQUIRED,
          message: "Rejection requires a reason (minimum 10 characters)",
        };
      }
      break;
    case "PUBLISH":
      targetState = "PUBLISHED";
      break;
    case "ACTIVATE":
      targetState = "ACTIVE";
      break;
    case "ARCHIVE":
      targetState = "ARCHIVED";
      break;
    default:
      throw { code: POLICY_ERRORS.INVALID_TRANSITION, message: `Unknown action: ${action}` };
  }
  
  // Validate transition
  if (!isValidTransition(version.status, targetState)) {
    throw {
      code: POLICY_ERRORS.INVALID_TRANSITION,
      message: `Invalid transition from ${version.status} to ${targetState}`,
    };
  }
  
  // Perform transition
  const fromState = version.status;
  version.status = targetState;
  version.updatedAt = new Date().toISOString();
  
  // Update timestamps based on action
  switch (action) {
    case "SUBMIT_FOR_REVIEW":
      version.submittedAt = new Date().toISOString();
      version.submittedByUserId = actorUserId;
      break;
    case "APPROVE":
      if (targetState === "APPROVED") {
        version.approvedAt = new Date().toISOString();
        version.approvedByUserId = actorUserId;
      } else {
        version.reviewedAt = new Date().toISOString();
        version.reviewedByUserId = actorUserId;
      }
      break;
    case "PUBLISH":
      version.publishedAt = new Date().toISOString();
      version.publishedByUserId = actorUserId;
      if (metadata.effectiveDate) {
        version.effectiveDate = metadata.effectiveDate;
      }
      break;
    case "ACTIVATE":
      version.lastReviewDate = version.effectiveDate || new Date().toISOString();
      version.nextReviewDate = calculateNextReviewDate(
        version.lastReviewDate,
        version.reviewPeriodDays
      )?.toISOString();
      break;
  }
  
  // Record audit event
  recordAudit({
    entityType: "PolicyVersion",
    entityId: versionId,
    policyId: version.policyId,
    action,
    fromState,
    toState: targetState,
    actorUserId,
    actorRoleAtTime: getUserRole(actorUserId),
    reason: metadata.reason || null,
    metadata: metadata || {},
    ipAddress: metadata.ipAddress || null,
  });
  
  return version;
}

// ============================================
// API ACTION HANDLERS
// ============================================

/**
 * Submit policy version for review
 */
export function submitForReview(policyId, versionId, actorUserId, metadata = {}) {
  if (!hasPermission(actorUserId, "policy.submit_review")) {
    throw { code: POLICY_ERRORS.UNAUTHORIZED, message: "You do not have permission to submit for review" };
  }
  
  return transitionVersion(versionId, "SUBMIT_FOR_REVIEW", actorUserId, metadata);
}

/**
 * Approve review
 */
export function approveReview(policyId, versionId, actorUserId, metadata = {}) {
  if (!hasPermission(actorUserId, "policy.review")) {
    throw { code: POLICY_ERRORS.UNAUTHORIZED, message: "You do not have permission to review" };
  }
  
  // SoD Check: Reviewer cannot be the same as creator
  const version = getVersion(versionId);
  if (version) {
    const sodResult = checkSoDConstraint("review", actorUserId, version);
    if (!sodResult.allowed) {
      throw { code: sodResult.errors[0].code, message: sodResult.errors[0].message };
    }
  }
  
  // Update review record
  const review = POLICY_REVIEWS.find(
    (r) => r.policyVersionId === versionId && r.reviewerUserId === actorUserId
  );
  if (review) {
    review.status = "APPROVED";
    review.decision = "APPROVED";
    review.comments = metadata.comments || "";
    review.decidedAt = new Date().toISOString();
  }
  
  return transitionVersion(versionId, "APPROVE", actorUserId, metadata);
}

/**
 * Reject review/approval
 */
export function rejectPolicy(policyId, versionId, actorUserId, metadata = {}) {
  if (!hasPermission(actorUserId, "policy.review")) {
    throw { code: POLICY_ERRORS.UNAUTHORIZED, message: "You do not have permission to reject" };
  }
  
  // Update review record
  const review = POLICY_REVIEWS.find(
    (r) => r.policyVersionId === versionId && r.reviewerUserId === actorUserId
  );
  if (review) {
    review.status = "REJECTED";
    review.decision = "REJECTED";
    review.comments = metadata.reason || "";
    review.decidedAt = new Date().toISOString();
  }
  
  return transitionVersion(versionId, "REJECT", actorUserId, metadata);
}

/**
 * Approve policy (final approval)
 */
export function approvePolicy(policyId, versionId, actorUserId, metadata = {}) {
  if (!hasPermission(actorUserId, "policy.approve")) {
    throw { code: POLICY_ERRORS.UNAUTHORIZED, message: "You do not have permission to approve" };
  }
  
  // SoD Check: Approver cannot be the same as creator or reviewer
  const version = getVersion(versionId);
  if (version) {
    const sodResult = checkSoDConstraint("approval", actorUserId, version);
    if (!sodResult.allowed) {
      throw { code: sodResult.errors[0].code, message: sodResult.errors[0].message };
    }
  }
  
  // Update approval record
  const approval = POLICY_APPROVALS.find(
    (a) => a.policyVersionId === versionId && a.approverUserId === actorUserId
  );
  if (approval) {
    approval.status = "APPROVED";
    approval.comments = metadata.comments || "";
    approval.decidedAt = new Date().toISOString();
  }
  
  return transitionVersion(versionId, "APPROVE", actorUserId, metadata);
}

/**
 * Publish policy version
 */
export function publishPolicy(policyId, versionId, actorUserId, metadata = {}) {
  if (!hasPermission(actorUserId, "policy.publish")) {
    throw { code: POLICY_ERRORS.UNAUTHORIZED, message: "You do not have permission to publish" };
  }
  
  const version = getVersion(versionId);
  if (!version) {
    throw { code: POLICY_ERRORS.VERSION_NOT_FOUND, message: "Version not found" };
  }
  
  // SoD Check: Publisher cannot be the same as creator, reviewer, or approver
  const sodResult = checkSoDConstraint("publish", actorUserId, version);
  if (!sodResult.allowed) {
    throw { code: sodResult.errors[0].code, message: sodResult.errors[0].message };
  }
  
  // Validate effective date
  if (!metadata.effectiveDate) {
    throw {
      code: POLICY_ERRORS.INVALID_EFFECTIVE_DATE,
      message: "Effective date is required for publication",
    };
  }
  
  // Perform publication
  const updatedVersion = transitionVersion(versionId, "PUBLISH", actorUserId, metadata);
  
  // If effective date is now or past, activate immediately
  const effectiveDate = new Date(metadata.effectiveDate);
  if (effectiveDate <= new Date()) {
    return transitionVersion(versionId, "ACTIVATE", actorUserId, metadata);
  }
  
  return updatedVersion;
}

/**
 * Create new version from existing policy
 */
export function createNewVersion(policyId, actorUserId, metadata = {}) {
  if (!hasPermission(actorUserId, "policy.create_version")) {
    throw { code: POLICY_ERRORS.UNAUTHORIZED, message: "You do not have permission to create versions" };
  }
  
  const policy = getPolicy(policyId);
  if (!policy) {
    throw { code: POLICY_ERRORS.POLICY_NOT_FOUND, message: "Policy not found" };
  }
  
  const latestVersion = getLatestVersion(policyId);
  if (!latestVersion) {
    throw { code: POLICY_ERRORS.VERSION_NOT_FOUND, message: "No existing version found" };
  }
  
  // Generate new version number
  const versionNum = parseFloat(latestVersion.versionNumber);
  const newVersionNumber = `${versionNum + 1.0}`;
  
  // Create new version (copy baseline data)
  const newVersion = {
    _id: `pv-${Date.now()}`,
    policyId,
    versionNumber: newVersionNumber,
    title: metadata.title || latestVersion.title,
    description: metadata.description || latestVersion.description,
    content: metadata.content || latestVersion.content,
    category: metadata.category || latestVersion.category,
    classification: metadata.classification || latestVersion.classification,
    ownerUserId: metadata.ownerUserId || latestVersion.ownerUserId,
    department: metadata.department || latestVersion.department,
    applicableTo: metadata.applicableTo || latestVersion.applicableTo,
    applicableRegions: metadata.applicableRegions || latestVersion.applicableRegions,
    regulatoryBasis: metadata.regulatoryBasis || latestVersion.regulatoryBasis,
    reviewPeriodDays: metadata.reviewPeriodDays || latestVersion.reviewPeriodDays,
    status: "DRAFT",
    createdAt: new Date().toISOString(),
    createdByUserId: actorUserId,
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
  };
  
  POLICY_VERSIONS.push(newVersion);
  
  // Record audit
  recordAudit({
    entityType: "PolicyVersion",
    entityId: newVersion._id,
    policyId,
    action: "VERSION_CREATED",
    fromState: null,
    toState: "DRAFT",
    actorUserId,
    actorRoleAtTime: getUserRole(actorUserId),
    reason: null,
    metadata: { versionNumber: newVersionNumber, sourceVersionId: latestVersion._id },
    ipAddress: metadata.ipAddress || null,
  });
  
  return newVersion;
}

/**
 * Archive policy version
 */
export function archivePolicyVersion(policyId, versionId, actorUserId, metadata = {}) {
  if (!hasPermission(actorUserId, "policy.archive")) {
    throw { code: POLICY_ERRORS.UNAUTHORIZED, message: "You do not have permission to archive" };
  }
  
  const version = getVersion(versionId);
  if (!version) {
    throw { code: POLICY_ERRORS.VERSION_NOT_FOUND, message: "Version not found" };
  }
  
  // Archive the version
  const updatedVersion = transitionVersion(versionId, "ARCHIVE", actorUserId, metadata);
  
  // Store archive reason
  if (metadata.archiveReason) {
    updatedVersion.archiveReason = metadata.archiveReason;
  }
  
  return updatedVersion;
}

/**
 * Get policy summary (computed state)
 */
export function getPolicySummary(policyId) {
  const policy = getPolicy(policyId);
  if (!policy) {
    throw { code: POLICY_ERRORS.POLICY_NOT_FOUND, message: "Policy not found" };
  }
  
  const versions = getPolicyVersions(policyId);
  const activeVersion = getActiveVersion(policyId);
  const latestVersion = getLatestVersion(policyId);
  const computedState = computePolicyState(policyId, POLICY_VERSIONS);
  
  // Compute review status
  const reviewStatus = activeVersion
    ? computeReviewStatus(activeVersion.nextReviewDate)
    : "OnTrack";
  
  return {
    policyId: policy._id,
    policyNumber: policy.policyId,
    title: policy.title,
    currentActiveVersionId: activeVersion?._id || null,
    currentActiveVersionNumber: activeVersion?.versionNumber || null,
    latestVersionId: latestVersion?._id || null,
    latestVersionNumber: latestVersion?.versionNumber || null,
    lifecycleState: computedState.state,
    effectiveState: computedState.state,
    reviewStatus,
    nextReviewDate: activeVersion?.nextReviewDate || null,
    hasDraftVersion: versions.some((v) => v.status === "DRAFT"),
    hasPendingReview: versions.some((v) => v.status === "REVIEW"),
    hasPendingApproval: versions.some((v) => v.status === "APPROVAL"),
  };
}

/**
 * Get dashboard stats (computed from authoritative records)
 */
export function getDashboardStats() {
  const policies = POLICIES;
  let total = 0;
  let published = 0;
  let pendingReview = 0;
  let pendingApproval = 0;
  let active = 0;
  let overdue = 0;
  let expired = 0;
  let archived = 0;
  
  for (const policy of policies) {
    const state = computePolicyState(policy._id, POLICY_VERSIONS);
    total++;
    
    switch (state.state) {
      case "PUBLISHED":
        published++;
        break;
      case "REVIEW":
        pendingReview++;
        break;
      case "APPROVAL":
        pendingApproval++;
        break;
      case "ACTIVE":
        active++;
        // Check if overdue
        const activeVersion = getActiveVersion(policy._id);
        if (activeVersion?.nextReviewDate) {
          const status = computeReviewStatus(activeVersion.nextReviewDate);
          if (status === "Overdue") overdue++;
        }
        break;
      case "EXPIRED":
        expired++;
        break;
      case "ARCHIVED":
        archived++;
        break;
    }
  }
  
  return {
    total,
    published,
    pendingReview,
    pendingApproval,
    active,
    overdue,
    expired,
    archived,
  };
}

export default {
  submitForReview,
  approveReview,
  rejectPolicy,
  approvePolicy,
  publishPolicy,
  createNewVersion,
  archivePolicyVersion,
  getPolicySummary,
  getDashboardStats,
  POLICY_ERRORS,
};
