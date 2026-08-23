/**
 * WADJET GRC — Policy Validation Service
 * 
 * Centralized validation for publication gates, workflow configuration,
 * and action availability.
 */

import { USERS, POLICIES } from "../mock-data.mjs";
import {
  POLICY_VERSIONS,
  POLICY_REVIEWS,
  POLICY_APPROVALS,
} from "../data/policyVersionData.js";

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

const DEFAULT_WORKFLOW_CONFIG = {
  reviewRequired: true,
  approvalRequired: true,
  minimumReviewers: 1,
  minimumApprovers: 1,
  sequentialApproval: true,
  allowDirectPublish: false,
  requireEvidence: false,
  requireDocuments: false,
  requireRiskMapping: false,
  requireControlMapping: false,
  preventSelfApproval: true,
  escalationTargetRole: "board",
};

const workflowConfigs = new Map();

function getWorkflowConfig(policyId) {
  return workflowConfigs.get(policyId) || DEFAULT_WORKFLOW_CONFIG;
}

function hasPermission(userId, permission) {
  const user = USERS.find((u) => u._id === userId);
  if (!user) return false;
  const allowedRoles = PERMISSIONS[permission] || [];
  return allowedRoles.includes(user.role);
}

function getVersion(versionId) {
  return POLICY_VERSIONS.find((v) => v._id === versionId);
}

function getPolicyVersions(policyId) {
  return POLICY_VERSIONS.filter((v) => v.policyId === policyId);
}

function getReviewsForVersion(versionId) {
  return POLICY_REVIEWS.filter((r) => r.policyVersionId === versionId);
}

function getApprovalsForVersion(versionId) {
  return POLICY_APPROVALS.filter((a) => a.policyVersionId === versionId);
}

export function validatePublicationEligibility(policyId, versionId, actorUserId) {
  const errors = [];

  if (!hasPermission(actorUserId, "policy.publish")) {
    errors.push({ code: "UNAUTHORIZED", message: "You do not have permission to publish" });
    return { allowed: false, errors };
  }

  const version = getVersion(versionId);
  if (!version) {
    errors.push({ code: "VERSION_NOT_FOUND", message: "Version not found" });
    return { allowed: false, errors };
  }

  if (version.status !== "APPROVED") {
    errors.push({ code: "INVALID_TRANSITION", message: `Cannot publish from state ${version.status}. Must be APPROVED.` });
  }

  const config = getWorkflowConfig(policyId);

  if (config.reviewRequired) {
    const reviews = getReviewsForVersion(versionId);
    const approvedReviews = reviews.filter((r) => r.status === "APPROVED");
    if (approvedReviews.length < config.minimumReviewers) {
      errors.push({ code: "MISSING_REVIEW", message: `Required ${config.minimumReviews} approved review(s). Found ${approvedReviews.length}.` });
    }
  }

  if (config.approvalRequired) {
    const approvals = getApprovalsForVersion(versionId);
    const approvedApprovals = approvals.filter((a) => a.status === "APPROVED");
    if (approvedApprovals.length < config.minimumApprovers) {
      errors.push({ code: "MISSING_APPROVAL", message: `Required ${config.minimumApprovers} approval(s). Found ${approvedApprovals.length}.` });
    }
  }

  if (config.preventSelfApproval && version.createdByUserId === actorUserId) {
    errors.push({ code: "SELF_APPROVAL_NOT_ALLOWED", message: "You cannot publish your own policy" });
  }

  return { allowed: errors.length === 0, errors };
}

export function getAvailableActions(policyId, versionId, actorUserId) {
  const version = getVersion(versionId);
  if (!version) return { state: null, actions: [] };

  const state = version.status;
  const actions = [];

  switch (state) {
    case "DRAFT":
      if (hasPermission(actorUserId, "policy.submit_review")) actions.push("SUBMIT_FOR_REVIEW");
      if (hasPermission(actorUserId, "policy.archive")) actions.push("ARCHIVE");
      break;
    case "REVIEW":
      if (hasPermission(actorUserId, "policy.review")) {
        actions.push("APPROVE_REVIEW");
        actions.push("REJECT");
        actions.push("REQUEST_CHANGES");
      }
      break;
    case "APPROVAL":
      if (hasPermission(actorUserId, "policy.approve")) {
        actions.push("APPROVE");
        actions.push("REJECT");
      }
      break;
    case "APPROVED":
      if (hasPermission(actorUserId, "policy.publish")) actions.push("PUBLISH");
      if (hasPermission(actorUserId, "policy.archive")) actions.push("ARCHIVE");
      break;
    case "PUBLISHED":
    case "ACTIVE":
      if (hasPermission(actorUserId, "policy.create_version")) actions.push("CREATE_NEW_VERSION");
      if (hasPermission(actorUserId, "policy.archive")) actions.push("ARCHIVE");
      break;
  }

  return { state, actions };
}

export function getWorkflowConfigForPolicy(policyId) {
  return getWorkflowConfig(policyId);
}

export function setWorkflowConfigForPolicy(policyId, config) {
  workflowConfigs.set(policyId, { ...DEFAULT_WORKFLOW_CONFIG, ...config });
  return getWorkflowConfig(policyId);
}

export default {
  validatePublicationEligibility,
  getAvailableActions,
  getWorkflowConfigForPolicy,
  setWorkflowConfigForPolicy,
};
