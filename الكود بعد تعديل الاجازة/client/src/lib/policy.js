/** Status colors for the policy lifecycle. Gray=Draft, blue=Review, orange=Approval, green=Approved/Published, red=Retired. */
export const POLICY_STATUS_STYLES = {
  Draft: "border-neutral-700 bg-neutral-900 text-neutral-300",
  Review: "border-sky-800/60 bg-sky-950/40 text-sky-300",
  Approval: "border-orange-800/60 bg-orange-950/40 text-orange-300",
  Approved: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  Published: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  Retired: "border-red-800/60 bg-red-950/40 text-red-300",
  Archived: "border-neutral-700 bg-neutral-800/60 text-neutral-400",
  draft: "border-neutral-700 bg-neutral-900 text-neutral-300",
  "in-review": "border-sky-800/60 bg-sky-950/40 text-sky-300",
  approved: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  retired: "border-red-800/60 bg-red-950/40 text-red-300",
  "Pending Review": "border-sky-800/60 bg-sky-950/40 text-sky-300",
  "Pending Approval": "border-orange-800/60 bg-orange-950/40 text-orange-300",
};

export const POLICY_CLASS_STYLES = {
  Public: "border-neutral-700 bg-neutral-900 text-neutral-300",
  Internal: "border-sky-800/60 bg-sky-950/40 text-sky-300",
  Confidential: "border-orange-800/60 bg-orange-950/40 text-orange-300",
  Restricted: "border-red-800/60 bg-red-950/40 text-red-300",
};

/** Lifecycle position for the steppers (1-based step index). */
export const POLICY_LIFECYCLE = [
  { key: "Draft", label: "Draft" },
  { key: "Review", label: "Review" },
  { key: "Approval", label: "Approval" },
  { key: "Approved", label: "Approved" },
  { key: "Published", label: "Published" },
];

export const stepIndex = (status) => {
  if (status === "Archived" || status === "Retired") return POLICY_LIFECYCLE.length;
  const i = POLICY_LIFECYCLE.findIndex((s) => s.key === status);
  return i === -1 ? 0 : i;
};

export const fmtDateTime = (v) =>
  v ? new Date(v).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export const fmtDay = (v) => (v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export const orDash = (v, placeholder = "—") => (v === "" || v == null ? placeholder : v);

export const AUDIT_ACTION_STYLES = (action) => {
  const a = String(action || "").toLowerCase();
  if (a.includes("approve")) return "border-emerald-800/60 bg-emerald-950/40 text-emerald-300";
  if (a.includes("reject") || a.includes("deleted") || a.includes("removed")) return "border-red-800/60 bg-red-950/40 text-red-300";
  if (a.includes("submitted") || a.includes("requested") || a.includes("published") || a.includes("viewed") || a.includes("downloaded"))
    return "border-orange-800/60 bg-orange-950/40 text-orange-300";
  if (a.includes("uploaded") || a.includes("created") || a.includes("mapped") || a.includes("linked") || a.includes("added"))
    return "border-sky-800/60 bg-sky-950/40 text-sky-300";
  return "border-neutral-700 bg-neutral-900 text-neutral-300";
};

/** Simple LCS-based line diff. Returns arrays: {base, type: same|added|removed}[] */
export function diffLines(oldText, newText) {
  const a = String(oldText || "").split("\n");
  const b = String(newText || "").split("\n");
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "removed", text: a[i++] });
    } else {
      out.push({ type: "added", text: b[j++] });
    }
  }
  while (i < n) out.push({ type: "removed", text: a[i++] });
  while (j < m) out.push({ type: "added", text: b[j++] });
  return out;
}

export const downloadCsv = (filename, headers, rows) => {
  const lines = rows.map((r) =>
    headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
  );
  const blob = new Blob([[headers.join(","), ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
