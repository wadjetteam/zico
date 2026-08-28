/**
 * WADJET GRC — Exception Expiry Background Job
 * 
 * Safe-to-repeat pattern: processes Active exceptions past their requestedUntil date.
 * Transitions them to Expired and records audit events.
 * 
 * PLACEHOLDER NOTICE: Uses setInterval for current mock-server architecture.
 * Upgrade path: Replace with Cron Job / Scheduled Worker (e.g., node-cron, BullMQ, PostgreSQL pg_cron) in production.
 */

import { createHash } from "node:crypto";
import { GOVERNANCE_AUDIT_LOG } from "../governance-data.js";
import { EXCEPTIONS } from "../mock-data.mjs";

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

export function processExceptionExpirations(currentDate = new Date()) {
  const changes = [];

  for (const exception of EXCEPTIONS) {
    if (exception.status !== "Active") continue;
    const requestedUntil = exception.requestedUntil || exception.expiryDate;
    if (!requestedUntil) continue;

    if (currentDate > new Date(requestedUntil)) {
      const fromState = exception.status;
      exception.status = "Expired";
      exception.expiredAt = currentDate.toISOString();
      exception.updatedAt = currentDate.toISOString();

      recordAudit({
        entityType: "Exception",
        entityId: exception._id,
        policyId: exception.relatedPolicyId || null,
        action: "EXCEPTION_EXPIRED",
        fromState,
        toState: "Expired",
        actorUserId: "system",
        actorRoleAtTime: "system",
        reason: "Automatic expiration — requestedUntil date reached",
        metadata: { requestedUntil },
        ipAddress: null,
      });

      changes.push({
        exceptionId: exception._id,
        title: exception.title,
        fromState,
        toState: "Expired",
      });
    }
  }

  return changes;
}

let expiryIntervalId = null;

export function startExceptionExpiryJob(intervalMs = 60 * 60 * 1000) {
  if (expiryIntervalId) return expiryIntervalId;

  // PLACEHOLDER: setInterval for mock-server. Replace with Cron Job in production.
  expiryIntervalId = setInterval(() => {
    const changes = processExceptionExpirations();
    if (changes.length > 0) {
      console.log(`[EXCEPTION EXPIRY] Processed ${changes.length} expired exception(s): ${changes.map((c) => c.exceptionId).join(", ")}`);
    }
  }, intervalMs);

  // Run immediately on startup
  processExceptionExpirations();

  return expiryIntervalId;
}

export function stopExceptionExpiryJob() {
  if (expiryIntervalId) {
    clearInterval(expiryIntervalId);
    expiryIntervalId = null;
  }
}

export default { processExceptionExpirations, startExceptionExpiryJob, stopExceptionExpiryJob };
