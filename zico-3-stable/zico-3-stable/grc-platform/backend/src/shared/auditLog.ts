/**
 * WADJET GRC — Cross-Module Audit Log Service
 * Hash-chained, tamper-evident audit trail for all modules.
 */

import { createHash } from "node:crypto";
import { prisma } from "../index";

export interface AuditLogEntry {
  actorUserId?: string;
  actorUsername: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  fromState?: string;
  toState?: string;
  reason?: string;
  metadata?: any;
  ipAddress?: string;
}

export class AuditLogService {
  static async log(entry: AuditLogEntry) {
    const previousEntry = await prisma.auditLog.findFirst({
      orderBy: { timestamp: "desc" },
    });

    const logData = {
      actorUserId: entry.actorUserId || null,
      actorUsername: entry.actorUsername,
      actorRole: entry.actorRole,
      actorRoleAtTime: entry.actorRole,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId || null,
      fromState: entry.fromState || null,
      toState: entry.toState || null,
      reason: entry.reason || null,
      metadata: JSON.stringify(entry.metadata || {}),
      ipAddress: entry.ipAddress || null,
      previousEntryHash: previousEntry?.entryHash || null,
    };

    const hashContent = JSON.stringify(logData);
    const entryHash = `sha256:${createHash("sha256").update(hashContent).digest("hex")}`;

    return prisma.auditLog.create({
      data: { ...logData, entryHash },
    });
  }

  static async verifyChainIntegrity() {
    const entries = await prisma.auditLog.findMany({
      orderBy: { timestamp: "asc" },
    });

    const issues = [];
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const { entryHash, previousEntryHash, ...content } = entry;
      const computedHash = `sha256:${createHash("sha256").update(JSON.stringify(content)).digest("hex")}`;

      if (entryHash !== computedHash) {
        issues.push({
          entryId: entry.id,
          issue: "HASH_MISMATCH",
          detail: "Entry content has been modified",
        });
      }

      if (i > 0 && previousEntryHash !== entries[i - 1].entryHash) {
        issues.push({
          entryId: entry.id,
          issue: "CHAIN_BROKEN",
          detail: "Chain link broken",
        });
      }
    }

    return {
      valid: issues.length === 0,
      totalEntries: entries.length,
      issues,
    };
  }

  static async findByEntity(entityType: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { timestamp: "desc" },
    });
  }

  static async findByUser(userId: string) {
    return prisma.auditLog.findMany({
      where: { actorUserId: userId },
      orderBy: { timestamp: "desc" },
    });
  }
}

export default AuditLogService;
