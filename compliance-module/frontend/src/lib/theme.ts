export const T = {
  bg: "#0b0b0d",
  sidebarBg: "#0e0e11",
  panelBg: "#141417",
  panelBorder: "#232327",
  cardBg: "#0f0f12",
  rowHover: "#101013",
  inputBg: "#0c0c0f",
  textPrimary: "#f2f2f0",
  textSecondary: "#8c8c94",
  textMuted: "#5c5c64",
  accent: "#d9ad4f",
  accentSoft: "rgba(217,173,79,0.14)",
  green: "#3fbf6a",
  greenSoft: "rgba(63,191,106,0.14)",
  amber: "#e0b23d",
  amberSoft: "rgba(224,178,61,0.14)",
  grey: "#7d7d86",
  greySoft: "rgba(125,125,134,0.14)",
  red: "#e2584f",
  redSoft: "rgba(226,88,79,0.14)",
  blue: "#7c8ff0",
  blueSoft: "rgba(124,143,240,0.14)",
  purple: "#b183e0",
  purpleSoft: "rgba(177,131,224,0.14)",
  orange: "#e28a4f",
};

export const FONT_STACK = `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`;

export const reqStatusMeta: Record<string, { color: string; bg: string }> = {
  NotAssessed: { color: T.blue, bg: T.blueSoft },
  Compliant: { color: T.green, bg: T.greenSoft },
  PartiallyCompliant: { color: T.amber, bg: T.amberSoft },
  NonCompliant: { color: T.red, bg: T.redSoft },
  NotApplicable: { color: T.grey, bg: T.greySoft },
};

export const severityMeta: Record<string, { color: string; bg: string }> = {
  Critical: { color: T.red, bg: T.redSoft },
  High: { color: T.orange, bg: "rgba(226,138,79,0.14)" },
  Medium: { color: T.amber, bg: T.amberSoft },
  Low: { color: T.grey, bg: T.greySoft },
};

export const gapStatusMeta: Record<string, { color: string; bg: string }> = {
  Open: { color: T.red, bg: T.redSoft },
  InProgress: { color: T.amber, bg: T.amberSoft },
  Resolved: { color: T.green, bg: T.greenSoft },
  Accepted: { color: T.blue, bg: T.blueSoft },
  Closed: { color: T.grey, bg: T.greySoft },
};

export const remediationStatusMeta: Record<string, { color: string; bg: string }> = {
  Open: { color: T.grey, bg: T.greySoft },
  InProgress: { color: T.amber, bg: T.amberSoft },
  Blocked: { color: T.red, bg: T.redSoft },
  Completed: { color: T.green, bg: T.greenSoft },
  Cancelled: { color: T.red, bg: T.redSoft },
};

export const evidenceStatusMeta: Record<string, { color: string; bg: string }> = {
  Missing: { color: T.grey, bg: T.greySoft },
  Requested: { color: T.blue, bg: T.blueSoft },
  Submitted: { color: T.amber, bg: T.amberSoft },
  UnderReview: { color: T.amber, bg: T.amberSoft },
  Approved: { color: T.green, bg: T.greenSoft },
  Rejected: { color: T.red, bg: T.redSoft },
  Expired: { color: T.red, bg: T.redSoft },
};

export function isOverdue(dueDate: string | null | undefined, status: string, doneStatuses: string[]): boolean {
  if (!dueDate) return false;
  if (doneStatuses.includes(status)) return false;
  return new Date() > new Date(dueDate);
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toISOString().slice(0, 10);
}
