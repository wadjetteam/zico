/**
 * WADJET GRC — Governance Module API (Raw HTTP Compatible)
 * 
 * All functions return { status, body } objects for the raw HTTP server
 */

import {
  POLICY_VERSIONS, POLICY_REVIEWS, POLICY_ACKNOWLEDGEMENTS, POLICY_TEMPLATES,
  ATTACHMENTS, COMMITTEE_MEETINGS, COMMITTEE_DECISIONS, COMMITTEE_ACTIONS,
  GOVERNANCE_AUDIT_LOG,
  computePolicyStatus, computeNextReviewDate, computeReviewStatus,
  computeAcknowledgementRate, computeQuorumMet, computeIsOverdue,
  recordAuditLog, validateFileType, scanFileForMalware,
  ALLOWED_GOVERNANCE_PERMISSIONS, MAX_FILE_SIZE_BYTES,
} from "./governance-data.js";
import { POLICIES, COMMITTEES, EXCEPTIONS, USERS, ROLES } from "./mock-data.mjs";

// Helper to create response
const response = (status, body) => ({ __response: true, status, body });

// ============================================
// POLICY ENDPOINTS
// ============================================

export function listPolicies(req) {
  const policies = POLICIES.map((policy) => {
    const status = computePolicyStatus(policy._id, POLICY_VERSIONS);
    const nextReviewDate = computeNextReviewDate(policy, POLICY_VERSIONS);
    const reviewStatus = computeReviewStatus(nextReviewDate);
    const acknowledgements = POLICY_ACKNOWLEDGEMENTS.filter((a) => a.policyId === policy._id);
    const acknowledgementRate = computeAcknowledgementRate(acknowledgements);
    
    return { ...policy, status, nextReviewDate, reviewStatus, acknowledgementRate };
  });
  
  return response(200, { items: policies, total: policies.length });
}

export function getPolicy(req) {
  const { id } = req.params || {};
  const policy = POLICIES.find((p) => p._id === id);
  
  if (!policy) return response(404, { message: "Policy not found" });
  
  const versions = POLICY_VERSIONS.filter((v) => v.policyId === id);
  const status = computePolicyStatus(id, POLICY_VERSIONS);
  const nextReviewDate = computeNextReviewDate(policy, POLICY_VERSIONS);
  const reviewStatus = computeReviewStatus(nextReviewDate);
  const acknowledgements = POLICY_ACKNOWLEDGEMENTS.filter((a) => a.policyId === id);
  const acknowledgementRate = computeAcknowledgementRate(acknowledgements);
  const attachments = ATTACHMENTS.filter((a) => 
    a.relatedEntityType === "Policy" && a.relatedEntityId === id
  );
  const ownerUser = USERS.find((u) => u._id === policy.ownerUserId);
  
  return response(200, {
    ...policy,
    status,
    nextReviewDate,
    reviewStatus,
    acknowledgementRate,
    versions: versions.map((v) => ({
      ...v,
      createdByUser: USERS.find((u) => u._id === v.createdByUserId),
      approvedByUser: v.approvedByUserId ? USERS.find((u) => u._id === v.approvedByUserId) : null,
    })),
    attachments,
    ownerUser,
  });
}

export function createPolicy(req) {
  const body = req.body || {};
  
  const errors = [];
  if (!body.title) errors.push("Title is required");
  if (!body.category) errors.push("Category is required");
  if (!body.ownerUserId) errors.push("Owner is required");
  if (!body.department) errors.push("Department is required");
  
  if (errors.length > 0) return response(422, { message: "Validation failed", errors });
  
  const policyCode = `POL-${String(POLICIES.length + 1).padStart(3, "0")}`;
  
  const newPolicy = {
    _id: `pol-${Date.now()}`,
    policyCode,
    title: body.title,
    description: body.description || "",
    category: body.category,
    classification: body.classification || "Internal",
    ownerUserId: body.ownerUserId,
    department: body.department,
    applicableTo: body.applicableTo || "",
    applicableRegions: body.applicableRegions || [],
    regulatoryMappings: body.regulatoryMappings || [],
    controlMappings: body.controlMappings || [],
    reviewPeriodDays: body.reviewPeriodDays || 365,
    sourceTemplateId: body.sourceTemplateId || null,
    currentVersionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  POLICIES.push(newPolicy);
  
  const newVersion = {
    _id: `pv-${Date.now()}`,
    policyId: newPolicy._id,
    versionNumber: "1.0",
    content: body.content || "",
    changeSummary: "Initial version",
    attachmentIds: [],
    status: "Draft",
    createdByUserId: req.user?._id || "u-admin",
    createdAt: new Date().toISOString(),
    submittedByUserId: null, submittedAt: null,
    approvedByUserId: null, approvedAt: null,
    rejectedByUserId: null, rejectedAt: null, rejectionReason: null,
    publishedAt: null, effectiveDate: null,
    supersededAt: null, supersededByVersionId: null,
  };
  
  POLICY_VERSIONS.push(newVersion);
  newPolicy.currentVersionId = newVersion._id;
  
  recordAuditLog({
    actorUserId: req.user?._id || "u-admin",
    action: "policy.created",
    entityType: "Policy",
    entityId: newPolicy._id,
    oldValue: null,
    newValue: { policyCode, title: body.title, status: "Draft" },
    reason: null,
    ipAddress: req.ip,
  });
  
  return response(201, { ...newPolicy, currentVersion: newVersion });
}

export function createPolicyVersion(req) {
  const { id } = req.params || {};
  const body = req.body || {};
  
  const policy = POLICIES.find((p) => p._id === id);
  if (!policy) return response(404, { message: "Policy not found" });
  
  const versions = POLICY_VERSIONS.filter((v) => v.policyId === id);
  const latestVersion = versions.sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  )[0];
  
  const newVersionNumber = latestVersion 
    ? `${parseFloat(latestVersion.versionNumber) + 0.1}`.slice(0, 3)
    : "1.0";
  
  const newVersion = {
    _id: `pv-${Date.now()}`,
    policyId: id,
    versionNumber: newVersionNumber,
    content: body.content || "",
    changeSummary: body.changeSummary || "",
    attachmentIds: body.attachmentIds || [],
    status: "Draft",
    createdByUserId: req.user?._id || "u-admin",
    createdAt: new Date().toISOString(),
    submittedByUserId: null, submittedAt: null,
    approvedByUserId: null, approvedAt: null,
    rejectedByUserId: null, rejectedAt: null, rejectionReason: null,
    publishedAt: null, effectiveDate: null,
    supersededAt: null, supersededByVersionId: null,
  };
  
  POLICY_VERSIONS.push(newVersion);
  policy.currentVersionId = newVersion._id;
  policy.updatedAt = new Date().toISOString();
  
  recordAuditLog({
    actorUserId: req.user?._id || "u-admin",
    action: "policy.version.created",
    entityType: "PolicyVersion",
    entityId: newVersion._id,
    oldValue: null,
    newValue: { versionNumber: newVersionNumber, status: "Draft" },
    reason: null,
    ipAddress: req.ip,
  });
  
  return response(201, newVersion);
}

export function submitPolicyVersion(req) {
  const { id, vId } = req.params || {};
  
  const version = POLICY_VERSIONS.find((v) => v._id === vId && v.policyId === id);
  if (!version) return response(404, { message: "Policy version not found" });
  
  if (version.status !== "Draft") {
    return response(400, { 
      message: `Invalid state transition: cannot submit from "${version.status}"` 
    });
  }
  
  version.status = "Submitted";
  version.submittedByUserId = req.user?._id || "u-admin";
  version.submittedAt = new Date().toISOString();
  
  recordAuditLog({
    actorUserId: req.user?._id || "u-admin",
    action: "policy.version.submitted",
    entityType: "PolicyVersion",
    entityId: version._id,
    oldValue: { status: "Draft" },
    newValue: { status: "Submitted" },
    reason: null,
    ipAddress: req.ip,
  });
  
  return response(200, version);
}

export function startPolicyReview(req) {
  const { id, vId } = req.params || {};
  const body = req.body || {};
  
  const version = POLICY_VERSIONS.find((v) => v._id === vId && v.policyId === id);
  if (!version) return response(404, { message: "Policy version not found" });
  
  if (version.status !== "Submitted") {
    return response(400, { 
      message: `Invalid state transition: cannot start review from "${version.status}"` 
    });
  }
  
  version.status = "InReview";
  
  const reviewerUserIds = body.reviewerUserIds || ["u-manager"];
  reviewerUserIds.forEach((userId, index) => {
    POLICY_REVIEWS.push({
      _id: `pr-${Date.now()}-${index}`,
      policyVersionId: version._id,
      reviewerUserId: userId,
      sequence: index + 1,
      decision: "Pending",
      comment: null,
      assignedAt: new Date().toISOString(),
      decidedAt: null,
    });
  });
  
  recordAuditLog({
    actorUserId: req.user?._id || "u-admin",
    action: "policy.version.review.started",
    entityType: "PolicyVersion",
    entityId: version._id,
    oldValue: { status: "Submitted" },
    newValue: { status: "InReview", reviewers: reviewerUserIds },
    reason: null,
    ipAddress: req.ip,
  });
  
  return response(200, version);
}

export function approvePolicyVersion(req) {
  const { id, vId } = req.params || {};
  
  const version = POLICY_VERSIONS.find((v) => v._id === vId && v.policyId === id);
  if (!version) return response(404, { message: "Policy version not found" });
  
  if (version.status !== "InReview") {
    return response(400, { 
      message: `Invalid state transition: cannot approve from "${version.status}"` 
    });
  }
  
  version.status = "Approved";
  version.approvedByUserId = req.user?._id || "u-admin";
  version.approvedAt = new Date().toISOString();
  
  recordAuditLog({
    actorUserId: req.user?._id || "u-admin",
    action: "policy.version.approved",
    entityType: "PolicyVersion",
    entityId: version._id,
    oldValue: { status: "InReview" },
    newValue: { status: "Approved" },
    reason: null,
    ipAddress: req.ip,
  });
  
  return response(200, version);
}

export function publishPolicyVersion(req) {
  const { id, vId } = req.params || {};
  const body = req.body || {};
  
  const version = POLICY_VERSIONS.find((v) => v._id === vId && v.policyId === id);
  if (!version) return response(404, { message: "Policy version not found" });
  
  if (version.status !== "Approved") {
    return response(400, { 
      message: `Invalid state transition: cannot publish from "${version.status}"` 
    });
  }
  
  if (!body.effectiveDate) {
    return response(422, { message: "effectiveDate is required for publication" });
  }
  
  const effectiveDate = new Date(body.effectiveDate);
  const now = new Date();
  
  version.publishedAt = new Date().toISOString();
  version.effectiveDate = body.effectiveDate;
  
  if (effectiveDate <= now) {
    version.status = "Active";
    
    const previousActive = POLICY_VERSIONS.find((v) => 
      v.policyId === id && v.status === "Active" && v._id !== version._id
    );
    if (previousActive) {
      previousActive.status = "Superseded";
      previousActive.supersededAt = new Date().toISOString();
      previousActive.supersededByVersionId = version._id;
    }
    
    // Async background task placeholder
    setTimeout(() => {
      const users = USERS.filter((u) => u.status !== "Inactive");
      users.forEach((user) => {
        POLICY_ACKNOWLEDGEMENTS.push({
          _id: `pa-${Date.now()}-${user._id}`,
          policyId: id,
          policyVersionId: version._id,
          userId: user._id,
          status: "Pending",
          assignedAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          acknowledgedAt: null,
        });
      });
    }, 100);
  } else {
    version.status = "Published";
  }
  
  recordAuditLog({
    actorUserId: req.user?._id || "u-admin",
    action: "policy.version.published",
    entityType: "PolicyVersion",
    entityId: version._id,
    oldValue: { status: "Approved" },
    newValue: { status: version.status, effectiveDate: body.effectiveDate },
    reason: null,
    ipAddress: req.ip,
  });
  
  return response(200, version);
}

export function archivePolicy(req) {
  const { id } = req.params || {};
  const body = req.body || {};
  
  const policy = POLICIES.find((p) => p._id === id);
  if (!policy) return response(404, { message: "Policy not found" });
  
  POLICY_VERSIONS.forEach((v) => {
    if (v.policyId === id && v.status !== "Superseded") {
      v.status = "Archived";
    }
  });
  
  recordAuditLog({
    actorUserId: req.user?._id || "u-admin",
    action: "policy.archived",
    entityType: "Policy",
    entityId: id,
    oldValue: { status: "Active" },
    newValue: { status: "Archived" },
    reason: body?.reason || null,
    ipAddress: req.ip,
  });
  
  return response(200, { message: "Policy archived successfully" });
}

// ============================================
// FILE ATTACHMENT ENDPOINTS
// ============================================

export function uploadFile(req) {
  const body = req.body || {};
  
  const errors = [];
  if (!body.originalFileName) errors.push("originalFileName is required");
  if (!body.mimeType) errors.push("mimeType is required");
  if (!body.sizeBytes) errors.push("sizeBytes is required");
  if (!body.relatedEntityType) errors.push("relatedEntityType is required");
  if (!body.relatedEntityId) errors.push("relatedEntityId is required");
  
  if (errors.length > 0) return response(422, { message: "Validation failed", errors });
  
  const typeValidation = validateFileType(body.originalFileName, body.mimeType, body.magicBytes);
  if (!typeValidation.valid) return response(422, { message: typeValidation.reason });
  
  if (body.sizeBytes > MAX_FILE_SIZE_BYTES) {
    return response(422, { 
      message: `File size ${body.sizeBytes} exceeds maximum allowed size of ${MAX_FILE_SIZE_BYTES} bytes` 
    });
  }
  
  const storedFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${body.originalFileName.split(".").pop()}`;
  
  const newAttachment = {
    _id: `att-${Date.now()}`,
    originalFileName: body.originalFileName,
    storedFileName,
    storagePath: "/storage/governance/",
    mimeType: body.mimeType,
    sizeBytes: body.sizeBytes,
    checksum: `sha256:${Date.now()}`,
    uploadedByUserId: req.user?._id || "u-admin",
    uploadedAt: new Date().toISOString(),
    relatedEntityType: body.relatedEntityType,
    relatedEntityId: body.relatedEntityId,
    status: "Active",
    scanStatus: "Pending",
  };
  
  ATTACHMENTS.push(newAttachment);
  
  const scanResult = scanFileForMalware(newAttachment._id);
  newAttachment.scanStatus = scanResult;
  
  recordAuditLog({
    actorUserId: req.user?._id || "u-admin",
    action: "file.uploaded",
    entityType: "Attachment",
    entityId: newAttachment._id,
    oldValue: null,
    newValue: { originalFileName: body.originalFileName, sizeBytes: body.sizeBytes, mimeType: body.mimeType },
    reason: null,
    ipAddress: req.ip,
  });
  
  return response(201, newAttachment);
}

export function downloadFile(req) {
  const { id } = req.params || {};
  
  const attachment = ATTACHMENTS.find((a) => a._id === id);
  if (!attachment) return response(404, { message: "File not found" });
  
  if (attachment.status === "Archived") return response(410, { message: "File has been archived" });
  
  if (attachment.scanStatus !== "Clean") {
    return response(403, { 
      message: `File is not available for download. Scan status: ${attachment.scanStatus}` 
    });
  }
  
  return response(200, {
    message: "File download would be streamed here",
    fileName: attachment.originalFileName,
    mimeType: attachment.mimeType,
  });
}

export function deleteFile(req) {
  const { id } = req.params || {};
  
  const attachment = ATTACHMENTS.find((a) => a._id === id);
  if (!attachment) return response(404, { message: "File not found" });
  
  attachment.status = "Archived";
  
  recordAuditLog({
    actorUserId: req.user?._id || "u-admin",
    action: "file.archived",
    entityType: "Attachment",
    entityId: id,
    oldValue: { status: "Active" },
    newValue: { status: "Archived" },
    reason: null,
    ipAddress: req.ip,
  });
  
  return response(200, { message: "File archived successfully" });
}

// ============================================
// ROLE ENDPOINTS
// ============================================

export function listRoles(req) {
  const roles = ROLES.map((role) => {
    const usersAssignedCount = USERS.filter((u) => 
      u.role === role.name || u.role === role._id
    ).length;
    
    return { ...role, usersAssignedCount };
  });
  
  return response(200, { items: roles, total: roles.length });
}

export function createRole(req) {
  const body = req.body || {};
  
  const errors = [];
  if (!body.name) errors.push("Name is required");
  if (!body.description) errors.push("Description is required");
  
  if (errors.length > 0) return response(422, { message: "Validation failed", errors });
  
  const permissions = body.permissions || [];
  const invalidPermissions = permissions.filter((p) => !ALLOWED_GOVERNANCE_PERMISSIONS.includes(p));
  
  if (invalidPermissions.length > 0) {
    return response(422, { 
      message: "Invalid permissions", 
      invalidPermissions,
      allowedPermissions: ALLOWED_GOVERNANCE_PERMISSIONS,
    });
  }
  
  const newRole = {
    _id: `r-${Date.now()}`,
    name: body.name,
    description: body.description,
    status: "Active",
    permissions,
    approvalAuthority: body.approvalAuthority || {
      canApprovePolicyClassification: ["Public", "Internal"],
      canApproveExceptions: false,
    },
    createdAt: new Date().toISOString(),
  };
  
  ROLES.push(newRole);
  
  recordAuditLog({
    actorUserId: req.user?._id || "u-admin",
    action: "role.created",
    entityType: "Role",
    entityId: newRole._id,
    oldValue: null,
    newValue: { name: body.name, permissions },
    reason: null,
    ipAddress: req.ip,
  });
  
  return response(201, newRole);
}

export function updateRole(req) {
  const { id } = req.params || {};
  const body = req.body || {};
  
  const role = ROLES.find((r) => r._id === id);
  if (!role) return response(404, { message: "Role not found" });
  
  if (body.permissions) {
    const invalidPermissions = body.permissions.filter((p) => !ALLOWED_GOVERNANCE_PERMISSIONS.includes(p));
    if (invalidPermissions.length > 0) {
      return response(422, { 
        message: "Invalid permissions", 
        invalidPermissions,
        allowedPermissions: ALLOWED_GOVERNANCE_PERMISSIONS,
      });
    }
  }
  
  const oldValue = { ...role };
  
  if (body.name) role.name = body.name;
  if (body.description) role.description = body.description;
  if (body.permissions) role.permissions = body.permissions;
  if (body.approvalAuthority) role.approvalAuthority = body.approvalAuthority;
  
  recordAuditLog({
    actorUserId: req.user?._id || "u-admin",
    action: "role.updated",
    entityType: "Role",
    entityId: id,
    oldValue: { name: oldValue.name, permissions: oldValue.permissions },
    newValue: { name: role.name, permissions: role.permissions },
    reason: null,
    ipAddress: req.ip,
  });
  
  return response(200, role);
}

export function deleteRole(req) {
  const { id } = req.params || {};
  
  const role = ROLES.find((r) => r._id === id);
  if (!role) return response(404, { message: "Role not found" });
  
  const usersAssignedCount = USERS.filter((u) => 
    u.role === role.name || u.role === role._id
  ).length;
  
  if (usersAssignedCount > 0) {
    return response(400, { 
      message: `Cannot delete role with ${usersAssignedCount} users assigned. Reassign users first.` 
    });
  }
  
  role.status = "Inactive";
  
  recordAuditLog({
    actorUserId: req.user?._id || "u-admin",
    action: "role.deactivated",
    entityType: "Role",
    entityId: id,
    oldValue: { status: "Active" },
    newValue: { status: "Inactive" },
    reason: null,
    ipAddress: req.ip,
  });
  
  return response(200, { message: "Role deactivated successfully" });
}

// ============================================
// COMMITTEE ENDPOINTS
// ============================================

export function listCommittees(req) {
  const committees = COMMITTEES.map((committee) => {
    const meetings = COMMITTEE_MEETINGS.filter((m) => m.committeeId === committee._id);
    const actions = COMMITTEE_ACTIONS.filter((a) => {
      const decision = COMMITTEE_DECISIONS.find((d) => d._id === a.decisionId);
      return decision?.committeeId === committee._id;
    });
    
    return {
      ...committee,
      meetingsCount: meetings.length,
      openActionsCount: actions.filter((a) => a.status === "Open").length,
      chairUser: USERS.find((u) => u._id === committee.chairUserId),
    };
  });
  
  return response(200, { items: committees, total: committees.length });
}

export function createCommitteeMeeting(req) {
  const { id } = req.params || {};
  const body = req.body || {};
  
  const committee = COMMITTEES.find((c) => c._id === id);
  if (!committee) return response(404, { message: "Committee not found" });
  
  const meetings = COMMITTEE_MEETINGS.filter((m) => m.committeeId === id);
  
  const newMeeting = {
    _id: `cmt-${Date.now()}`,
    committeeId: id,
    meetingNumber: meetings.length + 1,
    scheduledDate: body.scheduledDate,
    actualDate: null,
    attendeeUserIds: body.attendeeUserIds || [],
    agendaItems: body.agendaItems || [],
    minutesAttachmentId: null,
    status: "Scheduled",
  };
  
  COMMITTEE_MEETINGS.push(newMeeting);
  
  recordAuditLog({
    actorUserId: req.user?._id || "u-admin",
    action: "committee.meeting.created",
    entityType: "CommitteeMeeting",
    entityId: newMeeting._id,
    oldValue: null,
    newValue: { meetingNumber: newMeeting.meetingNumber, scheduledDate: body.scheduledDate },
    reason: null,
    ipAddress: req.ip,
  });
  
  return response(201, newMeeting);
}

export function createCommitteeDecision(req) {
  const { id, mId } = req.params || {};
  const body = req.body || {};
  
  const meeting = COMMITTEE_MEETINGS.find((m) => m._id === mId && m.committeeId === id);
  if (!meeting) return response(404, { message: "Meeting not found" });
  
  const committee = COMMITTEES.find((c) => c._id === id);
  
  const quorumMet = computeQuorumMet(meeting, committee);
  if (!quorumMet) {
    return response(400, { 
      message: "Quorum not met — decision cannot be recorded",
      attendees: meeting.attendeeUserIds.length,
      required: committee.quorumRequired,
    });
  }
  
  const newDecision = {
    _id: `cd-${Date.now()}`,
    meetingId: mId,
    committeeId: id,
    description: body.description,
    relatedEntityType: body.relatedEntityType || null,
    relatedEntityId: body.relatedEntityId || null,
    decisionType: body.decisionType || "Other",
    votesFor: body.votesFor || meeting.attendeeUserIds.length,
    votesAgainst: body.votesAgainst || 0,
    decidedAt: new Date().toISOString(),
  };
  
  COMMITTEE_DECISIONS.push(newDecision);
  
  recordAuditLog({
    actorUserId: req.user?._id || "u-admin",
    action: "committee.decision.recorded",
    entityType: "CommitteeDecision",
    entityId: newDecision._id,
    oldValue: null,
    newValue: { description: body.description, decisionType: body.decisionType },
    reason: null,
    ipAddress: req.ip,
  });
  
  return response(201, newDecision);
}

// ============================================
// EXCEPTION ENDPOINTS
// ============================================

export function listExceptions(req) {
  const exceptions = EXCEPTIONS.map((exception) => ({
    ...exception,
    requestedByUser: USERS.find((u) => u._id === exception.requestedByUserId),
    ownerUser: USERS.find((u) => u._id === exception.ownerUserId),
    approverUser: exception.approverUserId ? USERS.find((u) => u._id === exception.approverUserId) : null,
  }));
  
  return response(200, { items: exceptions, total: exceptions.length });
}

export function createException(req) {
  const body = req.body || {};
  
  const errors = [];
  if (!body.title) errors.push("Title is required");
  if (!body.description) errors.push("Description is required");
  if (!body.businessJustification) errors.push("Business justification is required");
  if (!body.requestedUntil) errors.push("requestedUntil is required");
  
  if (errors.length > 0) return response(422, { message: "Validation failed", errors });
  
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
    requestedByUserId: req.user?._id || "u-admin",
    ownerUserId: body.ownerUserId || req.user?._id || "u-admin",
    status: "Draft",
    requestedFrom: body.requestedFrom || new Date().toISOString(),
    requestedUntil: body.requestedUntil,
    approverUserId: null, approvedAt: null, rejectionReason: null,
    reviewDate: body.reviewDate || new Date().toISOString(),
    attachmentIds: body.attachmentIds || [],
  };
  
  EXCEPTIONS.push(newException);
  
  recordAuditLog({
    actorUserId: req.user?._id || "u-admin",
    action: "exception.created",
    entityType: "Exception",
    entityId: newException._id,
    oldValue: null,
    newValue: { exceptionCode, title: body.title, status: "Draft" },
    reason: null,
    ipAddress: req.ip,
  });
  
  return response(201, newException);
}

export function approveException(req) {
  const { id } = req.params || {};
  
  const exception = EXCEPTIONS.find((e) => e._id === id);
  if (!exception) return response(404, { message: "Exception not found" });
  
  if (exception.status !== "UnderReview") {
    return response(400, { 
      message: `Invalid state transition: cannot approve from "${exception.status}"` 
    });
  }
  
  exception.status = "Active";
  exception.approverUserId = req.user?._id || "u-admin";
  exception.approvedAt = new Date().toISOString();
  
  recordAuditLog({
    actorUserId: req.user?._id || "u-admin",
    action: "exception.approved",
    entityType: "Exception",
    entityId: id,
    oldValue: { status: "UnderReview" },
    newValue: { status: "Active" },
    reason: null,
    ipAddress: req.ip,
  });
  
  return response(200, exception);
}

// ============================================
// GOVERNANCE DASHBOARD ENDPOINT
// ============================================

export function getGovernanceDashboard(req) {
  const policies = POLICIES.map((p) => ({
    ...p,
    status: computePolicyStatus(p._id, POLICY_VERSIONS),
    nextReviewDate: computeNextReviewDate(p, POLICY_VERSIONS),
  }));
  
  const activePolicies = policies.filter((p) => p.status === "Active").length;
  const dueForReview = policies.filter((p) => {
    const daysUntil = Math.ceil((new Date(p.nextReviewDate) - new Date()) / (24 * 60 * 60 * 1000));
    return daysUntil <= 30 && daysUntil >= 0;
  }).length;
  const overdueReviews = policies.filter((p) => {
    return new Date(p.nextReviewDate) < new Date();
  }).length;
  const pendingApprovals = POLICY_VERSIONS.filter((v) => v.status === "InReview").length;
  
  const activeExceptions = EXCEPTIONS.filter((e) => e.status === "Active").length;
  const expiringSoon = EXCEPTIONS.filter((e) => {
    if (e.status !== "Active") return false;
    const daysUntilExpiry = Math.ceil((new Date(e.requestedUntil) - new Date()) / (24 * 60 * 60 * 1000));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  }).length;
  
  const openActions = COMMITTEE_ACTIONS.filter((a) => a.status === "Open").length;
  const upcomingMeetings = COMMITTEE_MEETINGS.filter((m) => {
    return m.status === "Scheduled" && new Date(m.scheduledDate) > new Date();
  }).length;
  
  return response(200, {
    policies: {
      total: policies.length,
      active: activePolicies,
      dueForReview,
      overdueReviews,
      pendingApprovals,
    },
    exceptions: {
      active: activeExceptions,
      expiringSoon,
    },
    committees: {
      openActions,
      upcomingMeetings,
    },
  });
}

export default {
  listPolicies, getPolicy, createPolicy, createPolicyVersion,
  submitPolicyVersion, startPolicyReview, approvePolicyVersion,
  publishPolicyVersion, archivePolicy,
  uploadFile, downloadFile, deleteFile,
  listRoles, createRole, updateRole, deleteRole,
  listCommittees, createCommitteeMeeting, createCommitteeDecision,
  listExceptions, createException, approveException,
  getGovernanceDashboard,
};
