import React from "react";

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

const inputStyle = (extra = {}) => ({
  background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8,
  color: T.textPrimary, fontSize: 12.5, padding: "9px 11px", outline: "none",
  fontFamily: FONT_STACK, width: "100%", boxSizing: "border-box", ...extra,
});

const selectStyle = (extra = {}) => ({ ...inputStyle(extra), appearance: "auto" });
const secondaryBtnStyle = { background: "transparent", color: T.textSecondary, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
const primaryBtnStyle = { background: T.accent, color: "#1a1508", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center" };
const iconBtnStyle = { border: `1px solid ${T.panelBorder}`, background: T.inputBg, borderRadius: 7, padding: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };

export function Badge({ label, color, bg, Icon }: any) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, background: bg, color, fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap" }}>{Icon && <Icon size={11} />}{label}</span>;
}

export function Pill({ label, color, bg }: any) {
  return <span style={{ fontSize: 11, fontWeight: 600, color, background: bg, padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>{label}</span>;
}

export function KpiCard({ label, value, Icon, iconColor, iconBg, sub, to }: any) {
  const body = (
    <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10.5, letterSpacing: 0.6, color: T.textMuted, fontWeight: 600, textTransform: "uppercase" }}>{label}</span>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={13} color={iconColor} /></div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: T.textPrimary }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: T.textMuted }}>{sub}</div>}
    </div>
  );
  return to ? <a href={to} onClick={(e) => { e.preventDefault(); window.history.pushState({}, "", to); window.dispatchEvent(new PopStateEvent("popstate")); }} style={{ textDecoration: "none" }}>{body}</a> : body;
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

export function DetailRow({ k, v }: any) {
  return <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, borderBottom: `1px solid ${T.panelBorder}`, paddingBottom: 8 }}><span style={{ color: T.textMuted }}>{k}</span><span style={{ color: T.textPrimary, textAlign: "right" }}>{v}</span></div>;
}

export function EmptyState({ label }: any) {
  return <div style={{ padding: "40px 16px", textAlign: "center", color: T.textMuted, fontSize: 12.5 }}>{label}</div>;
}

export function Toolbar({ search, onSearch, placeholder, right, resultCount, totalCount }: any) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.inputBg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "9px 12px", flex: "1 1 240px", maxWidth: 360 }}>
        <SearchIcon size={14} color={T.textMuted} />
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
      {label && <div style={{ fontSize: 10.5, color: T.textMuted, marginBottom: 5, fontWeight: 600 }}>{label}</div>}
      <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle()}>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function useSort(defaultKey: string) {
  const [sort, setSort] = React.useState({ key: defaultKey, dir: "asc" });
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
            {rows.length === 0 ? (<tr><td colSpan={columns.length + 1}><EmptyState label="No records found." /></td></tr>) : (
              rows.map((row: any, idx: number) => (
                <tr key={row.id || idx} onClick={() => onRowClick && onRowClick(row)} style={{ borderBottom: `1px solid ${T.panelBorder}`, cursor: onRowClick ? "pointer" : "default" }} onMouseEnter={(e) => (e.currentTarget.style.background = T.rowHover)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
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

export function PageHeading({ title, subtitle, action }: any) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: T.textPrimary }}>{title}</h1><p style={{ fontSize: 12.5, color: T.textMuted, margin: "6px 0 0" }}>{subtitle}</p></div>
        {action}
      </div>
      <div style={{ height: 1, background: T.panelBorder, marginBottom: 22 }} />
    </>
  );
}

import { Search as SearchIcon, ArrowUpDown } from "lucide-react";

export default { T, FONT_STACK, Badge, Pill, KpiCard, SectionLabel, Field, DetailRow, EmptyState, Toolbar, FilterSelect, useSort, DataTable, PageHeading, inputStyle, selectStyle, primaryBtnStyle, secondaryBtnStyle, iconBtnStyle };
