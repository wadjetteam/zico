/**
 * WADJET GRC — Policy Version Service
 * 
 * Version comparison, restore, and approval escalation logic.
 */

import { createHash } from "node:crypto";
import { USERS } from "../mock-data.mjs";
import {
  POLICY_VERSIONS,
  POLICY_REVIEWS,
  POLICY_APPROVALS,
} from "../data/policyVersionData.js";
import {
  GOVERNANCE_AUDIT_LOG,
} from "../governance-data.js";
import {
  calculateNextReviewDate,
  computePolicyState,
  processPolicyLifecycleDates,
} from "../data/policyVersionData.js";

const COMPARE_FIELDS = [
  "title", "description", "content", "category", "classification",
  "applicableTo", "applicableRegions", "regulatoryBasis",
  "reviewPeriodDays", "effectiveDate", "expirationDate",
];

function getUserRole(userId) {
  const user = USERS.find((u) => u._id === userId);
  return user?.role || "unknown";
}

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

function getVersion(versionId) {
  return POLICY_VERSIONS.find((v) => v._id === versionId);
}

function getLatestVersion(policyId) {
  const versions = POLICY_VERSIONS.filter((v) => v.policyId === policyId);
  return versions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
}

export function compareVersions(policyId, versionIdA, versionIdB) {
  const a = getVersion(versionIdA);
  const b = getVersion(versionIdB);

  if (!a || !b) {
    throw { code: "VERSION_NOT_FOUND", message: "One or both versions not found" };
  }

  const differences = [];

  for (const field of COMPARE_FIELDS) {
    const valA = a[field] ?? "";
    const valB = b[field] ?? "";

    if (String(valA) !== String(valB)) {
      differences.push({
        field,
        oldValue: valA,
        newValue: valB,
        changeType: "CHANGED",
      });
    } else {
      differences.push({
        field,
        value: valA,
        changeType: "UNCHANGED",
      });
    }
  }

  return {
    versionA: { _id: a._id, versionNumber: a.versionNumber, status: a.status },
    versionB: { _id: b._id, versionNumber: b.versionNumber, status: b.status },
    differences,
  };
}

export function restoreVersionAsDraft(policyId, sourceVersionId, actorUserId) {
  const sourceVersion = getVersion(sourceVersionId);
  if (!sourceVersion) {
    throw { code: "VERSION_NOT_FOUND", message: "Source version not found" };
  }

  const latestVersion = getLatestVersion(policyId);
  const newVersionNumber = latestVersion
    ? `${parseFloat(latestVersion.versionNumber) + 1.0}`
    : "1.0";

  const newVersion = {
    _id: `pv-${Date.now()}`,
    policyId,
    versionNumber: newVersionNumber,
    title: sourceVersion.title,
    description: sourceVersion.description,
    content: sourceVersion.content,
    category: sourceVersion.category,
    classification: sourceVersion.classification,
    ownerUserId: sourceVersion.ownerUserId,
    department: sourceVersion.department,
    applicableTo: sourceVersion.applicableTo,
    applicableRegions: sourceVersion.applicableRegions,
    regulatoryBasis: sourceVersion.regulatoryBasis,
    reviewPeriodDays: sourceVersion.reviewPeriodDays,
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

  recordAudit({
    entityType: "PolicyVersion",
    entityId: newVersion._id,
    policyId,
    action: "VERSION_RESTORED",
    fromState: null,
    toState: "DRAFT",
    actorUserId,
    actorRoleAtTime: getUserRole(actorUserId),
    reason: null,
    metadata: { sourceVersionId, sourceVersionNumber: sourceVersion.versionNumber, newVersionId: newVersion._id },
    ipAddress: null,
  });

  return newVersion;
}

export function checkApprovalEscalations(currentDate = new Date()) {
  const escalations = [];

  for (const approval of POLICY_APPROVALS) {
    if (approval.status !== "PENDING" || !approval.dueAt) continue;
    if (approval.escalatedAt) continue;

    if (currentDate > new Date(approval.dueAt)) {
      approval.escalatedAt = currentDate.toISOString();
      approval.escalatedToUserId = "u-admin";

      escalations.push({
        approvalId: approval._id,
        policyVersionId: approval.policyVersionId,
        originalApprover: approval.approverUserId,
        escalatedTo: "u-admin",
      });

      recordAudit({
        entityType: "PolicyApproval",
        entityId: approval._id,
        policyId: null,
        action: "APPROVAL_ESCALATED",
        fromState: "PENDING",
        toState: "PENDING",
        actorUserId: "system",
        actorRoleAtTime: "system",
        reason: "SLA breach - approval overdue",
        metadata: { dueAt: approval.dueAt, escalatedTo: "u-admin" },
        ipAddress: null,
      });
    }
  }

  return escalations;
}

export function processLifecycleDates(policyId, currentDate = new Date()) {
  const changes = processPolicyLifecycleDates(policyId, POLICY_VERSIONS, currentDate);

  for (const change of changes) {
    const version = getVersion(change.versionId);
    recordAudit({
      entityType: "PolicyVersion",
      entityId: change.versionId,
      policyId,
      action: change.fromState === "ACTIVE" && change.toState === "EXPIRED" ? "POLICY_EXPIRED" : "POLICY_ACTIVATED",
      fromState: change.fromState,
      toState: change.toState,
      actorUserId: "system",
      actorRoleAtTime: "system",
      reason: change.reason,
      metadata: { versionNumber: version?.versionNumber },
      ipAddress: null,
    });
  }

  return changes;
}

export default {
  compareVersions,
  restoreVersionAsDraft,
  checkApprovalEscalations,
  processLifecycleDates,
};
