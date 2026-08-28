export const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const fmtDateTime = (v) =>
  v
    ? new Date(v).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export const fmtDateInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : "");

export const severityOf = (score = 0) =>
  score >= 20 ? "critical" : score >= 12 ? "high" : score >= 6 ? "medium" : "low";

export const SEVERITY_STYLES = {
  low: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  medium: "border-amber-800/60 bg-amber-950/40 text-amber-300",
  high: "border-orange-800/60 bg-orange-950/40 text-orange-300",
  critical: "border-red-800/60 bg-red-950/40 text-red-300",
};

export const STATUS_STYLES = {
  Open: "border-gold/40 bg-gold/10 text-gold-light",
  "In Progress": "border-sky-800/60 bg-sky-950/40 text-sky-300",
  Accepted: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  Mitigate: "border-indigo-800/60 bg-indigo-950/40 text-indigo-300",
  Low: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  Medium: "border-amber-800/60 bg-amber-950/40 text-amber-300",
  High: "border-orange-800/60 bg-orange-950/40 text-orange-300",
  Critical: "border-red-800/60 bg-red-950/40 text-red-300",
  open: "border-gold/40 bg-gold/10 text-gold-light",
  "in-review": "border-sky-800/60 bg-sky-950/40 text-sky-300",
  mitigating: "border-indigo-800/60 bg-indigo-950/40 text-indigo-300",
  closed: "border-neutral-700 bg-neutral-900 text-neutral-400",
  approved: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  complete: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  pending: "border-amber-800/60 bg-amber-950/40 text-amber-300",
  draft: "border-neutral-700 bg-neutral-900 text-neutral-400",
  expired: "border-red-800/60 bg-red-950/40 text-red-300",
  overdue: "border-red-800/60 bg-red-950/40 text-red-300",
  rejected: "border-red-800/60 bg-red-950/40 text-red-300",
  "in-progress": "border-sky-800/60 bg-sky-950/40 text-sky-300",
  planned: "border-neutral-700 bg-neutral-900 text-neutral-400",
  assigned: "border-neutral-700 bg-neutral-900 text-neutral-400",
  "not-started": "border-neutral-700 bg-neutral-900 text-neutral-400",
  blocked: "border-red-800/60 bg-red-950/40 text-red-300",
  retired: "border-neutral-700 bg-neutral-900 text-neutral-500",
  fail: "border-red-800/60 bg-red-950/40 text-red-300",
  pass: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
};

export const chipClass = (value, map = STATUS_STYLES) =>
  `chip ${map[value] || "border-neutral-700 bg-neutral-900 text-neutral-400"}`;

export const titleCase = (s = "") => String(s).replace(/[-_]/g, " ");
