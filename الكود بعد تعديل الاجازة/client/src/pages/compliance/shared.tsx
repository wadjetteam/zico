import React, { useState } from "react";
import {
  BadgeCheck, MinusCircle, XCircle, Archive, HelpCircle, Search,
  Filter as FilterIcon, ArrowUpDown,
} from "lucide-react";

export const T = {
  bg: "#0b0b0d", sidebarBg: "#0e0e11", panelBg: "#141417", panelBorder: "#232327",
  cardBg: "#0f0f12", rowHover: "#101013", inputBg: "#0c0c0f", textPrimary: "#f2f2f0",
  textSecondary: "#8c8c94", textMuted: "#5c5c64", accent: "#d9ad4f",
  accentSoft: "rgba(217,173,79,0.14)", green: "#3fbf6a", greenSoft: "rgba(63,191,106,0.14)",
  amber: "#e0b23d", amberSoft: "rgba(224,178,61,0.14)", grey: "#7d7d86",
  greySoft: "rgba(125,125,134,0.14)", red: "#e2584f", redSoft: "rgba(226,88,79,0.14)",
  blue: "#7c8ff0", blueSoft: "rgba(124,143,240,0.14)", purple: "#b183e0",
  purpleSoft: "rgba(177,131,224,0.14)",
};

export const FONT_STACK = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

export const REQ_STATUSES = ["Not Assessed", "Compliant", "Partially Compliant", "Non-Compliant", "Not Applicable"];
export const FRAMEWORK_TYPES = ["Standard", "Regulation", "Internal Policy Baseline"];
export const FRAMEWORK_STATUSES = ["Active", "Archived", "Draft"];
export const EVIDENCE_STATUSES = ["Missing", "Requested", "Submitted", "Under Review", "Approved", "Rejected", "Expired"];
export const EVIDENCE_TYPES = ["Document", "Screenshot", "Log Export", "Policy", "Ticket / Record", "Attestation"];
export const GAP_SEVERITIES = ["Critical", "High", "Medium", "Low"];
export const GAP_STATUSES = ["Open", "In Progress", "Resolved", "Accepted", "Closed"];
export const REMEDIATION_STATUSES = ["Open", "In Progress", "Blocked", "Completed", "Cancelled"];
export const REMEDIATION_PRIORITIES = ["Critical", "High", "Medium", "Low"];

export function complianceScore(requirements: any[]) {
  const scored = requirements.filter((r) => r.status !== "Not Applicable" && r.status !== "Not Assessed");
  if (scored.length === 0) return 0;
  const points: Record<string, number> = { Compliant: 100, "Partially Compliant": 50, "Non-Compliant": 0 };
  const total = scored.reduce((s, r) => s + (points[r.status] ?? 0), 0);
  return Math.round(total / scored.length);
}

export const reqStatusMeta = (status: string) => {
  switch (status) {
    case "Compliant": return { color: T.green, bg: T.greenSoft, Icon: BadgeCheck };
    case "Partially Compliant": return { color: T.amber, bg: T.amberSoft, Icon: MinusCircle };
    case "Non-Compliant": return { color: T.red, bg: T.redSoft, Icon: XCircle };
    case "Not Applicable": return { color: T.grey, bg: T.greySoft, Icon: Archive };
    default:       return { color: T.blue, bg: T.blueSoft, Icon: HelpCircle };
  }
};

export const evidenceStatusMeta = (status: string) => {
  switch (status) {
    case "Approved": return { color: T.green, bg: T.greenSoft };
    case "Under Review": case "Submitted": case "Requested": return { color: T.amber, bg: T.amberSoft };
    case "Rejected": case "Expired": return { color: T.red, bg: T.redSoft };
    default: return { color: T.grey, bg: T.greySoft };
  }
};

export const severityMeta = (sev: string) => {
  switch (sev) {
    case "Critical": return { color: T.red, bg: T.redSoft };
    case "High": return { color: "#e28a4f", bg: "rgba(226,138,79,0.14)" };
    case "Medium": return { color: T.amber, bg: T.amberSoft };
    default: return { color: T.grey, bg: T.greySoft };
  }
};

export const gapStatusMeta = (status: string) => {
  switch (status) {
    case "Resolved": case "Closed": return { color: T.green, bg: T.greenSoft };
    case "In Progress": return { color: T.amber, bg: T.amberSoft };
    case "Accepted": return { color: T.blue, bg: T.blueSoft };
    default: return { color: T.red, bg: T.redSoft };
  }
};

export const remediationStatusMeta = (status: string) => {
  switch (status) {
    case "Completed": return { color: T.green, bg: T.greenSoft };
    case "In Progress": return { color: T.amber, bg: T.amberSoft };
    case "Blocked": case "Cancelled": return { color: T.red, bg: T.redSoft };
    default: return { color: T.grey, bg: T.greySoft };
  }
};

export function isOverdue(dueDate: string | null | undefined, status: string, doneStatuses: string[]) {
  if (!dueDate) return false;
  if (doneStatuses.includes(status)) return false;
  return new Date() > new Date(dueDate);
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toISOString().slice(0, 10);
}

const inputStyle = (extra = {}) => ({
  background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8,
  color: T.textPrimary, fontSize: 12.5, padding: "9px 11px", outline: "none",
  fontFamily: FONT_STACK, width: "100%", boxSizing: "border-box", ...extra,
});

const secondaryBtnStyle = {
  background: "transparent", color: T.textSecondary, border: `1px solid ${T.panelBorder}`,
  borderRadius: 8, padding: "9px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
};

export function Badge({ label, color, bg, Icon }: any) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, background: bg, color, fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap" }}>
      {Icon && <Icon size={11} />}{label}
    </span>
  );
}

export function Pill({ label, color, bg }: any) {
  return <span style={{ fontSize: 11, fontWeight: 600, color, background: bg, padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>{label}</span>;
}

export function KpiCard({ label, value, Icon, iconColor, iconBg, sub }: any) {
  return (
    <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10.5, letterSpacing: 0.6, color: T.textMuted, fontWeight: 600, textTransform: "uppercase" }}>{label}</span>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={13} color={iconColor} /></div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: T.textPrimary }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: T.textMuted }}>{sub}</div>}
    </div>
  );
}

export function ProgressBar({ value, color }: any) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 100 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 4, background: "#232327", overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 11.5, color: T.textSecondary, width: 30, textAlign: "right" }}>{value}%</span>
    </div>
  );
}

export function SectionLabel({ children }: any) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: T.accent, margin: "20px 0 10px", paddingBottom: 8, borderBottom: `1px solid ${T.panelBorder}` }}>{children}</div>;
}

export function Field({ label, required, children, error }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
      <label style={{ fontSize: 11.5, color: T.textSecondary, fontWeight: 600 }}>{label} {required && <span style={{ color: T.red }}>*</span>}</label>
      {children}
      {error && <span style={{ fontSize: 11, color: T.red }}>{error}</span>}
    </div>
  );
}

export function EmptyState({ label }: any) {
  return <div style={{ padding: "40px 16px", textAlign: "center", color: T.textMuted, fontSize: 12.5 }}>{label}</div>;
}

export function Toolbar({ search, onSearch, placeholder, right, resultCount, totalCount }: any) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 12px", flex: "1 1 240px", maxWidth: 360 }}>
        <Search size={14} color={T.textMuted} />
        <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} style={{ background: "transparent", border: "none", outline: "none", color: T.textPrimary, fontSize: 12.5, width: "100%", fontFamily: FONT_STACK }} />
      </div>
      {right}
      <div style={{ fontSize: 11.5, color: T.textMuted, marginLeft: "auto" }}>{resultCount} of {totalCount}</div>
    </div>
  );
}

export function FilterSelect({ label, value, options, onChange }: any) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: T.textMuted, marginBottom: 5, fontWeight: 600 }}>{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle(), appearance: "auto" }}>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function useSort(defaultKey: string) {
  const [sort, setSort] = useState({ key: defaultKey, dir: "asc" });
  const toggle = (key: string) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  const apply = (rows: any[]) => rows.slice().sort((a, b) => {
    const dir = sort.dir === "asc" ? 1 : -1;
    const av = a[sort.key]; const bv = b[sort.key];
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
    return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
  });
  return { sort, toggle, apply };
}

export function DataTable({ columns, rows, sort, onSort, onRowClick, renderActions }: any) {
  return (
    <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead><tr style={{ background: "#111114" }}>
            {columns.map((col: any) => (
              <th key={col.key} onClick={() => !col.noSort && onSort(col.key)} style={{ textAlign: "left", padding: "11px 16px", fontSize: 10.5, letterSpacing: 0.5, textTransform: "uppercase", color: T.textMuted, fontWeight: 700, borderBottom: `1px solid ${T.panelBorder}`, cursor: col.noSort ? "default" : "pointer", whiteSpace: "nowrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{col.label}{!col.noSort && <ArrowUpDown size={10} style={{ opacity: sort.key === col.key ? 1 : 0.3 }} />}</span>
              </th>
            ))}
            {renderActions && <th style={{ padding: "11px 16px", borderBottom: `1px solid ${T.panelBorder}` }} />}
          </tr></thead>
          <tbody>
            {rows.length === 0 ? (<tr><td colSpan={columns.length + 1}><EmptyState label="No records match your search or filters." /></td></tr>) : (
              rows.map((row: any) => (
                <tr key={row.id} onClick={() => onRowClick && onRowClick(row)} style={{ borderBottom: `1px solid ${T.panelBorder}`, cursor: onRowClick ? "pointer" : "default" }} onMouseEnter={(e) => (e.currentTarget.style.background = T.rowHover)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  {columns.map((col: any) => <td key={col.key} style={{ padding: "12px 16px", fontSize: 12, verticalAlign: "middle" }}>{col.render ? col.render(row) : row[col.key]}</td>)}
                  {renderActions && <td style={{ padding: "12px 16px" }} onClick={(e) => e.stopPropagation()}>{renderActions(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function HBarChart({ data, max, colorFn }: any) {
  const m = max ?? Math.max(1, ...data.map((d: any) => d.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map((d: any) => (
        <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 130, fontSize: 11.5, color: T.textSecondary, flexShrink: 0 }}>{d.label}</div>
          <div style={{ flex: 1, height: 8, background: "#1c1c20", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${(d.value / m) * 100}%`, height: "100%", background: colorFn ? colorFn(d) : T.accent, borderRadius: 4 }} />
          </div>
          <div style={{ width: 40, fontSize: 11.5, color: T.textPrimary, textAlign: "right" }}>{d.value}</div>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({ segments, size = 128, centerLabel, centerValue }: any) {
  const total = segments.reduce((s: number, seg: any) => s + seg.value, 0) || 1;
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${size / 2},${size / 2}) rotate(-90)`}>
          <circle r={r} fill="none" stroke="#1c1c20" strokeWidth={14} />
          {segments.map((seg: any) => {
            const frac = seg.value / total;
            const dash = frac * c;
            const circle = <circle key={seg.label} r={r} fill="none" stroke={seg.color} strokeWidth={14} strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-offset} strokeLinecap="butt" />;
            offset += dash;
            return circle;
          })}
        </g>
        <text x="50%" y="47%" textAnchor="middle" fontSize="20" fontWeight="700" fill={T.textPrimary}>{centerValue}</text>
        <text x="50%" y="61%" textAnchor="middle" fontSize="9" fill={T.textMuted} letterSpacing="0.5">{centerLabel}</text>
      </svg>
      <div>
        {segments.map((seg: any) => (
          <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: seg.color, display: "inline-block" }} />
            <span style={{ fontSize: 11.5, color: T.textSecondary }}>{seg.label}</span>
            <span style={{ fontSize: 11.5, color: T.textPrimary, fontWeight: 600 }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
