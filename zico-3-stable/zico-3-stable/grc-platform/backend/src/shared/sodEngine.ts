/**
 * WADJET GRC — Segregation of Duties (SoD) Engine
 * Configurable rule engine — rules are data, not hardcoded conditionals.
 */

import { prisma } from "../index";

export interface SoDRuleCheck {
  action: string;
  actorUserId: string;
  targetEntity: any;
  allowed: boolean;
  violations: string[];
}

export class SoDEngine {
  static async check(action: string, actorUserId: string, targetEntity: any): Promise<SoDRuleCheck> {
    const violations: string[] = [];

    const rules = await prisma.soDRule.findMany({
      where: { action, isActive: true },
    });

    const actor = await prisma.user.findUnique({
      where: { id: actorUserId },
      include: { role: true },
    });

    if (!actor) return { action, actorUserId, targetEntity, allowed: false, violations: ["Actor not found"] };

    for (const rule of rules) {
      switch (rule.constraint) {
        case "creator != approver":
          if (targetEntity.createdByUserId === actorUserId) {
            violations.push(rule.description || "Creator cannot approve their own work");
          }
          break;
        case "reviewer != creator":
          if (targetEntity.createdByUserId === actorUserId) {
            violations.push(rule.description || "Creator cannot review their own work");
          }
          break;
        case "approver != publisher":
          if (targetEntity.approvedByUserId === actorUserId) {
            violations.push(rule.description || "Approver cannot publish");
          }
          break;
        case "verifier != owner":
          if (targetEntity.ownerId === actorUserId) {
            violations.push(rule.description || "Owner cannot verify their own work");
          }
          break;
        case "auditor != findingCreator":
          if (targetEntity.createdByUserId === actorUserId) {
            violations.push(rule.description || "Auditor cannot approve own findings");
          }
          break;
      }
    }

    return {
      action,
      actorUserId,
      targetEntity,
      allowed: violations.length === 0,
      violations,
    };
  }

  static async getActiveRules() {
    return prisma.soDRule.findMany({ where: { isActive: true } });
  }
}

export default SoDEngine;
