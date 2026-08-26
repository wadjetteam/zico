import { prisma } from "../index";

const POINTS: Record<string, number> = {
  Compliant: 100,
  PartiallyCompliant: 50,
  NonCompliant: 0,
};

export function complianceScore(requirements: { status: string }[]): number {
  const scored = requirements.filter(
    (r) => r.status !== "NotApplicable" && r.status !== "NotAssessed"
  );
  if (scored.length === 0) return 0;
  const total = scored.reduce((sum, r) => sum + (POINTS[r.status] ?? 0), 0);
  return Math.round(total / scored.length);
}

export function complianceScoreByFramework(frameworks: any[], requirements: any[]) {
  return frameworks.map((f) => ({
    frameworkId: f.id,
    frameworkName: f.name,
    code: f.code,
    score: complianceScore(requirements.filter((r) => r.frameworkId === f.id)),
  }));
}

export function isOverdue(dueDate: Date | null | undefined, status: string, doneStatuses: string[]): boolean {
  if (!dueDate) return false;
  if (doneStatuses.includes(status)) return false;
  return new Date() > new Date(dueDate);
}

export function evidenceEffectiveStatus(evidence: { status: string; expirationDate: Date | null }): string {
  if (evidence.expirationDate && new Date() > new Date(evidence.expirationDate)) {
    return "Expired";
  }
  return evidence.status;
}

export async function processEvidenceExpirations() {
  const now = new Date();
  const expired = await prisma.evidence.findMany({
    where: { expirationDate: { lt: now }, status: { not: "Expired" } },
  });
  for (const e of expired) {
    await prisma.evidence.update({ where: { id: e.id }, data: { status: "Expired" } });
  }
  return expired.length;
}

export default {
  complianceScore,
  complianceScoreByFramework,
  isOverdue,
  evidenceEffectiveStatus,
  processEvidenceExpirations,
};
