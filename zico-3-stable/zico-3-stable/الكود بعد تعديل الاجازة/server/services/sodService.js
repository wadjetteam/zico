/**
 * WADJET GRC — Segregation of Duties (SoD) Engine
 * 
 * Centralized SoD constraint enforcement for policy lifecycle.
 * SoD constraints are data-driven and cannot be bypassed by metadata flags.
 */

import { POLICY_APPROVALS, POLICY_REVIEWS } from "../data/policyVersionData.js";

const DEFAULT_CONSTRAINTS = [
  { workflowStep: "review", mustDifferFrom: ["creator"] },
  { workflowStep: "approval", mustDifferFrom: ["creator", "reviewer"] },
  { workflowStep: "publish", mustDifferFrom: ["creator", "reviewer", "approver"] },
  { workflowStep: "reject", mustDifferFrom: ["creator"] },
];

const sodConstraints = [...DEFAULT_CONSTRAINTS];

export function getSoDConstraints() {
  return [...sodConstraints];
}

export function addSoDConstraint(constraint) {
  sodConstraints.push(constraint);
}

function getActorsForPolicyVersion(policyVersionId) {
  const reviewerIds = POLICY_REVIEWS
    .filter((r) => r.policyVersionId === policyVersionId && r.status === "APPROVED")
    .map((r) => r.reviewerUserId);
  const approverIds = POLICY_APPROVALS
    .filter((a) => a.policyVersionId === policyVersionId && a.status === "APPROVED")
    .map((a) => a.approverUserId);

  return { reviewerIds, approverIds };
}

export function checkSoDConstraint(action, actorUserId, policyVersion) {
  const constraints = sodConstraints.filter((c) => c.workflowStep === action);
  const errors = [];

  const { reviewerIds, approverIds } = getActorsForPolicyVersion(policyVersion._id);

  for (const constraint of constraints) {
    for (const differFrom of constraint.mustDifferFrom) {
      let conflictingUserId = null;

      switch (differFrom) {
        case "creator":
          conflictingUserId = policyVersion.createdByUserId;
          break;
        case "reviewer":
          if (reviewerIds.includes(actorUserId)) {
            conflictingUserId = actorUserId;
          }
          break;
        case "approver":
          if (approverIds.includes(actorUserId)) {
            conflictingUserId = actorUserId;
          }
          break;
      }

      if (conflictingUserId && conflictingUserId === actorUserId) {
        errors.push({
          code: "SOD_VIOLATION",
          message: `SoD violation: User cannot ${action} — must differ from ${differFrom} of this policy version`,
          constraint: { workflowStep: action, mustDifferFrom: differFrom },
        });
      }
    }
  }

  return { allowed: errors.length === 0, errors };
}

export default { checkSoDConstraint, getSoDConstraints, addSoDConstraint };
