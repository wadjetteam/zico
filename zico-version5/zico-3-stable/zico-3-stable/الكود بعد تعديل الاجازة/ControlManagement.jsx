import React, { useState, useMemo, useCallback } from "react";
import {
  LayoutGrid, Landmark, Shield, ShieldCheck, ClipboardList, Boxes, Sparkles,
  BarChart3, Settings, Search, HelpCircle, ChevronRight, ChevronDown, X,
  Plus, Filter as FilterIcon, ArrowUpDown, Pencil, Link2, CheckCircle2,
  Clock, CircleDashed, AlertTriangle, Building2, Menu, Trash2, Eye,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  DESIGN TOKENS — lifted from the existing Wadjet dashboard screenshot   */
/* ---------------------------------------------------------------------- */
const T = {
  bg: "#0b0b0d",
  sidebarBg: "#0e0e11",
  panelBg: "#141417",
  panelBorder: "#232327",
  cardBg: "#0f0f12",
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
};

const FONT_STACK =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

/* ---------------------------------------------------------------------- */
/*  MOCK "EXISTING" DATA LAYER                                             */
/*  In the real Wadjet codebase these come from the Asset Management and   */
/*  Framework/Compliance modules' existing stores — stubbed here so the    */
/*  Control Management module has real IDs to reference against.          */
/* ---------------------------------------------------------------------- */
const EXISTING_ASSETS = [
  { id: "AST-001", name: "Corporate VPN Gateway", type: "Network" },
  { id: "AST-002", name: "Customer Web Portal", type: "Application" },
  { id: "AST-003", name: "Employee Directory (AD)", type: "Identity" },
  { id: "AST-004", name: "Core Banking Database", type: "Database" },
  { id: "AST-005", name: "HR Management System", type: "Application" },
  { id: "AST-006", name: "Payment Gateway API", type: "Application" },
  { id: "AST-007", name: "Internal File Server", type: "Server" },
  { id: "AST-008", name: "Endpoint Fleet (Laptops)", type: "Endpoint" },
];

const EXISTING_FRAMEWORKS = [
  "ISO/IEC 27001:2022",
  "ISO/IEC 27002:2022",
  "CBE Cybersecurity Framework",
];

const CATEGORIES = ["Technical", "Administrative", "Physical"];
const CONTROL_TYPES = ["Preventive", "Detective"];
const STATUSES = [
  "Active / Implemented",
  "In Progress / Under Implementation",
  "Inactive / Planned",
];

const assetName = (id) => EXISTING_ASSETS.find((a) => a.id === id)?.name || id;

/* ---------------------------------------------------------------------- */
/*  SEED DATA                                                              */
/* ---------------------------------------------------------------------- */
const SEED_CONTROLS = [
  {
    id: "CTL-001",
    name: "Multi-Factor Authentication (MFA)",
    description: "Mandatory second factor for all staff and remote access.",
    category: "Technical",
    controlType: "Preventive",
    status: "Active / Implemented",
    progress: 100,
    owner: "IAM Manager",
    targetAssets: ["AST-001", "AST-003", "AST-008"],
    frameworkMapping: [
      { framework: "ISO/IEC 27001:2022", requirement: "A.5.17 Authentication information" },
      { framework: "CBE Cybersecurity Framework", requirement: "IAM-02 Strong Authentication" },
    ],
  },
  {
    id: "CTL-002",
    name: "Web Application Firewall (WAF)",
    description: "Inspects and blocks malicious HTTP/HTTPS traffic to web portals.",
    category: "Technical",
    controlType: "Preventive",
    status: "Active / Implemented",
    progress: 100,
    owner: "Network Security Lead",
    targetAssets: ["AST-002", "AST-006"],
    frameworkMapping: [
      { framework: "ISO/IEC 27001:2022", requirement: "A.8.20 Network security" },
      { framework: "ISO/IEC 27002:2022", requirement: "8.20 Networks security" },
    ],
  },
  {
    id: "CTL-003",
    name: "Least Privilege Access (RBAC)",
    description: "Restricting user access rights to the bare minimum needed.",
    category: "Administrative",
    controlType: "Preventive",
    status: "In Progress / Under Implementation",
    progress: 65,
    owner: "IT Operations Manager",
    targetAssets: ["AST-003", "AST-004", "AST-005"],
    frameworkMapping: [
      { framework: "ISO/IEC 27001:2022", requirement: "A.5.15 Access control" },
    ],
  },
  {
    id: "CTL-004",
    name: "Automated Vulnerability Scanning",
    description: "Weekly scheduled scans for all internal infrastructure and apps.",
    category: "Technical",
    controlType: "Detective",
    status: "Inactive / Planned",
    progress: 0,
    owner: "Vulnerability Management Lead",
    targetAssets: ["AST-001", "AST-002", "AST-004", "AST-007"],
    frameworkMapping: [
      { framework: "ISO/IEC 27001:2022", requirement: "A.8.8 Management of technical vulnerabilities" },
      { framework: "CBE Cybersecurity Framework", requirement: "VM-01 Vulnerability Management" },
    ],
  },
];

/* ---------------------------------------------------------------------- */
/*  STATUS / HELPERS                                                       */
/* ---------------------------------------------------------------------- */
const statusMeta = (status) => {
  if (status === "Active / Implemented")
    return { label: "Active", color: T.green, bg: T.greenSoft, Icon: CheckCircle2 };
  if (status === "In Progress / Under Implementation")
    return { label: "In Progress", color: T.amber, bg: T.amberSoft, Icon: Clock };
  return { label: "Planned", color: T.grey, bg: T.greySoft, Icon: CircleDashed };
};

const clampProgressToStatus = (status, progress) => {
  if (status === "Active / Implemented") return 100;
  if (status === "Inactive / Planned") return 0;
  const p = Number(progress);
  if (Number.isNaN(p)) return 1;
  return Math.min(99, Math.max(1, p));
};

const uid = () => `CTL-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

/* ---------------------------------------------------------------------- */
/*  SIDEBAR NAV — mirrors the screenshot exactly, Control Management       */
/*  inserted as its own primary item (a dedicated page per the brief)      */
/* ---------------------------------------------------------------------- */
const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutGrid },
  { label: "Context Organization", icon: Landmark, expandable: true },
  { label: "Governance", icon: Building2, expandable: true },
  { label: "Risk Management", icon: Shield, expandable: true },
  { label: "Control Management", icon: ShieldCheck, active: true },
  { label: "Compliance", icon: ClipboardList, expandable: true },
  { label: "Audit", icon: ClipboardList, expandable: true },
  { label: "Asset Management", icon: Boxes, expandable: true },
  { label: "Artificial Intelligence", icon: Sparkles, expandable: true },
  { label: "Reporting", icon: BarChart3, expandable: true },
  { label: "Settings", icon: Settings, expandable: true },
];

function Sidebar() {
  return (
    <div
      style={{
        width: 230,
        minWidth: 230,
        background: T.sidebarBg,
        borderRight: `1px solid ${T.panelBorder}`,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "16px 16px",
          borderBottom: `1px solid ${T.panelBorder}`,
        }}
      >
        <Menu size={16} color={T.textSecondary} style={{ marginRight: 2 }} />
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: "linear-gradient(135deg,#3a3a40,#1b1b1f)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: T.accent,
            fontWeight: 700,
          }}
        >
          W
        </div>
        <div style={{ lineHeight: 1.1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 2,
              color: T.textPrimary,
            }}
          >
            WADJET
          </div>
          <div style={{ fontSize: 9.5, color: T.textMuted, letterSpacing: 0.3 }}>
            Eyes on Risk. Control in Action.
          </div>
        </div>
      </div>

      <div style={{ padding: "10px 8px", flex: 1, overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 10px",
              borderRadius: 7,
              marginBottom: 2,
              cursor: "pointer",
              background: item.active ? T.accentSoft : "transparent",
              color: item.active ? T.accent : T.textSecondary,
              fontSize: 13,
              fontWeight: item.active ? 600 : 500,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <item.icon size={16} />
              <span>{item.label}</span>
            </div>
            {item.expandable && <ChevronRight size={13} style={{ opacity: 0.6 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div
      style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        borderBottom: `1px solid ${T.panelBorder}`,
        background: T.bg,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: T.inputBg,
          border: `1px solid ${T.panelBorder}`,
          borderRadius: 8,
          padding: "7px 12px",
          width: 340,
        }}
      >
        <Search size={14} color={T.textMuted} />
        <span style={{ fontSize: 12.5, color: T.textMuted }}>Search modules...</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <HelpCircle size={16} color={T.textSecondary} />
        <Settings size={16} color={T.textSecondary} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: `1px solid ${T.panelBorder}`,
            borderRadius: 20,
            padding: "4px 10px 4px 4px",
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: T.accent,
              color: "#1a1a1a",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            s
          </div>
          <span style={{ fontSize: 12.5, color: T.textSecondary }}>admin</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  KPI CARD — matches the dashboard's stat-card pattern                   */
/* ---------------------------------------------------------------------- */
function KpiCard({ label, value, Icon, iconColor, iconBg }) {
  return (
    <div
      style={{
        background: T.panelBg,
        border: `1px solid ${T.panelBorder}`,
        borderRadius: 10,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: 10.5,
            letterSpacing: 0.6,
            color: T.textMuted,
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={13} color={iconColor} />
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: T.textPrimary }}>{value}</div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  STATUS BADGE / PROGRESS BAR                                            */
/* ---------------------------------------------------------------------- */
function StatusBadge({ status }) {
  const { label, color, bg, Icon } = statusMeta(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 20,
        background: bg,
        color,
        fontSize: 11.5,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={11} />
      {label}
    </span>
  );
}

function CategoryPill({ category }) {
  const map = {
    Technical: { color: T.blue, bg: T.blueSoft },
    Administrative: { color: T.accent, bg: T.accentSoft },
    Physical: { color: T.grey, bg: T.greySoft },
  };
  const c = map[category] || map.Technical;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: c.color,
        background: c.bg,
        padding: "3px 8px",
        borderRadius: 6,
        whiteSpace: "nowrap",
      }}
    >
      {category}
    </span>
  );
}

function ProgressBar({ value, status }) {
  const { color } = statusMeta(status);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 110 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: 4,
          background: "#232327",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: color,
            borderRadius: 4,
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 11.5, color: T.textSecondary, width: 30, textAlign: "right" }}>
        {value}%
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  MULTI-SELECT CHIP INPUT (assets / frameworks)                          */
/* ---------------------------------------------------------------------- */
function ChipMultiSelect({ options, selected, onChange, getLabel, getId, placeholder }) {
  const [open, setOpen] = useState(false);
  const toggle = (id) => {
    if (selected.includes(id)) onChange(selected.filter((s) => s !== id));
    else onChange([...selected, id]);
  };
  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          minHeight: 38,
          border: `1px solid ${T.panelBorder}`,
          borderRadius: 8,
          background: T.inputBg,
          padding: "6px 8px",
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          cursor: "pointer",
          alignItems: "center",
        }}
      >
        {selected.length === 0 && (
          <span style={{ fontSize: 12.5, color: T.textMuted, padding: "2px 4px" }}>
            {placeholder}
          </span>
        )}
        {selected.map((id) => (
          <span
            key={id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11.5,
              background: T.accentSoft,
              color: T.accent,
              borderRadius: 5,
              padding: "3px 6px 3px 8px",
              fontWeight: 600,
            }}
          >
            {getLabel(id)}
            <X
              size={11}
              onClick={(e) => {
                e.stopPropagation();
                toggle(id);
              }}
            />
          </span>
        ))}
        <ChevronDown size={13} color={T.textMuted} style={{ marginLeft: "auto" }} />
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "105%",
            left: 0,
            right: 0,
            background: T.panelBg,
            border: `1px solid ${T.panelBorder}`,
            borderRadius: 8,
            maxHeight: 200,
            overflowY: "auto",
            zIndex: 30,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          {options.map((opt) => {
            const id = getId(opt);
            const active = selected.includes(id);
            return (
              <div
                key={id}
                onClick={() => toggle(id)}
                style={{
                  padding: "8px 12px",
                  fontSize: 12.5,
                  cursor: "pointer",
                  color: active ? T.accent : T.textSecondary,
                  background: active ? T.accentSoft : "transparent",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>{getLabel(id)}</span>
                {active && <span>✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  FRAMEWORK MAPPING EDITOR                                               */
/* ---------------------------------------------------------------------- */
function FrameworkMappingEditor({ mappings, onChange }) {
  const update = (idx, field, value) => {
    const next = mappings.slice();
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };
  const remove = (idx) => onChange(mappings.filter((_, i) => i !== idx));
  const add = () =>
    onChange([...mappings, { framework: EXISTING_FRAMEWORKS[0], requirement: "" }]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {mappings.map((m, idx) => (
        <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={m.framework}
            onChange={(e) => update(idx, "framework", e.target.value)}
            style={selectStyle({ flex: 1 })}
          >
            {EXISTING_FRAMEWORKS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <input
            value={m.requirement}
            onChange={(e) => update(idx, "requirement", e.target.value)}
            placeholder="Requirement / clause reference"
            style={inputStyle({ flex: 1.4 })}
          />
          <button onClick={() => remove(idx)} style={iconBtnStyle}>
            <Trash2 size={13} color={T.red} />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        style={{
          alignSelf: "flex-start",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: T.accent,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "4px 0",
          fontWeight: 600,
        }}
      >
        <Plus size={13} /> Add framework mapping
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  SHARED FORM PRIMITIVES                                                 */
/* ---------------------------------------------------------------------- */
const inputStyle = (extra = {}) => ({
  background: T.inputBg,
  border: `1px solid ${T.panelBorder}`,
  borderRadius: 8,
  color: T.textPrimary,
  fontSize: 12.5,
  padding: "9px 11px",
  outline: "none",
  fontFamily: FONT_STACK,
  width: "100%",
  boxSizing: "border-box",
  ...extra,
});

const selectStyle = (extra = {}) => ({
  ...inputStyle(extra),
  appearance: "auto",
});

const iconBtnStyle = {
  border: `1px solid ${T.panelBorder}`,
  background: T.inputBg,
  borderRadius: 7,
  padding: 8,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function Field({ label, required, children, error }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
      <label style={{ fontSize: 11.5, color: T.textSecondary, fontWeight: 600 }}>
        {label} {required && <span style={{ color: T.red }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: T.red }}>{error}</span>}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        color: T.accent,
        margin: "20px 0 10px",
        paddingBottom: 8,
        borderBottom: `1px solid ${T.panelBorder}`,
      }}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  CREATE / EDIT DRAWER                                                   */
/* ---------------------------------------------------------------------- */
function ControlFormDrawer({ initial, existingIds, onClose, onSave }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(
    initial || {
      id: uid(),
      name: "",
      description: "",
      category: "Technical",
      controlType: "Preventive",
      status: "Inactive / Planned",
      progress: 0,
      owner: "",
      targetAssets: [],
      frameworkMapping: [],
    }
  );
  const [errors, setErrors] = useState({});

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const setStatus = (status) => {
    setForm((f) => ({ ...f, status, progress: clampProgressToStatus(status, f.progress) }));
  };

  const setProgress = (value) => {
    let p = Math.min(100, Math.max(0, Number(value) || 0));
    setForm((f) => {
      let status = f.status;
      if (p === 0) status = "Inactive / Planned";
      else if (p === 100) status = "Active / Implemented";
      else status = "In Progress / Under Implementation";
      return { ...f, progress: p, status };
    });
  };

  const validate = () => {
    const e = {};
    if (!form.id.trim()) e.id = "Control ID is required.";
    else if (!isEdit && existingIds.includes(form.id.trim()))
      e.id = "Control ID must be unique.";
    if (!form.name.trim()) e.name = "Control Name is required.";
    if (!form.category) e.category = "Category is required.";
    if (!form.status) e.status = "Status is required.";
    if (!form.owner.trim()) e.owner = "Control Owner is required.";
    if (form.progress < 0 || form.progress > 100) e.progress = "Progress must be 0–100.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, id: form.id.trim() });
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...drawerStyle, width: 520 }}>
        <div style={drawerHeaderStyle}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary }}>
              {isEdit ? "Edit Control" : "Create Control"}
            </div>
            <div style={{ fontSize: 12, color: T.textMuted }}>
              {isEdit ? form.id : "New control record"}
            </div>
          </div>
          <button onClick={onClose} style={iconBtnStyle}>
            <X size={15} color={T.textSecondary} />
          </button>
        </div>

        <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }}>
          <SectionLabel>Basic Information</SectionLabel>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="Control ID" required error={errors.id}>
                <input
                  value={form.id}
                  disabled={isEdit}
                  onChange={(e) => set("id", e.target.value.toUpperCase())}
                  style={inputStyle({ opacity: isEdit ? 0.6 : 1 })}
                />
              </Field>
            </div>
            <div style={{ flex: 2 }}>
              <Field label="Control Name" required error={errors.name}>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  style={inputStyle()}
                  placeholder="e.g. Multi-Factor Authentication"
                />
              </Field>
            </div>
          </div>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              style={inputStyle({ resize: "vertical", fontFamily: FONT_STACK })}
              placeholder="What does this control do and why does it exist?"
            />
          </Field>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="Category" required error={errors.category}>
                <select
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  style={selectStyle()}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Control Type">
                <select
                  value={form.controlType}
                  onChange={(e) => set("controlType", e.target.value)}
                  style={selectStyle()}
                >
                  {CONTROL_TYPES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <SectionLabel>Implementation</SectionLabel>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="Status" required error={errors.status}>
                <select
                  value={form.status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={selectStyle()}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Implementation Progress (%)" error={errors.progress}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.progress}
                  onChange={(e) => setProgress(e.target.value)}
                  style={inputStyle()}
                />
              </Field>
            </div>
          </div>
          <div style={{ marginTop: -6, marginBottom: 8 }}>
            <ProgressBar value={form.progress} status={form.status} />
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>
            Progress auto-aligns with status (Active → 100%, Planned → 0%, In Progress → 1–99%).
          </div>

          <SectionLabel>Ownership</SectionLabel>
          <Field label="Control Owner" required error={errors.owner}>
            <input
              value={form.owner}
              onChange={(e) => set("owner", e.target.value)}
              style={inputStyle()}
              placeholder="e.g. IAM Manager"
            />
          </Field>

          <SectionLabel>Scope</SectionLabel>
          <Field label="Target Assets">
            <ChipMultiSelect
              options={EXISTING_ASSETS}
              selected={form.targetAssets}
              onChange={(v) => set("targetAssets", v)}
              getId={(a) => a.id}
              getLabel={(id) => assetName(id)}
              placeholder="Reference existing assets…"
            />
          </Field>

          <SectionLabel>Compliance</SectionLabel>
          <Field label="Framework Mapping">
            <FrameworkMappingEditor
              mappings={form.frameworkMapping}
              onChange={(v) => set("frameworkMapping", v)}
            />
          </Field>
        </div>

        <div style={drawerFooterStyle}>
          <button onClick={onClose} style={secondaryBtnStyle}>
            Cancel
          </button>
          <button onClick={handleSave} style={primaryBtnStyle}>
            {isEdit ? "Save Changes" : "Create Control"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  DETAILS DRAWER (read view)                                             */
/* ---------------------------------------------------------------------- */
function ControlDetailsDrawer({ control, onClose, onEdit }) {
  const { label, color, bg, Icon } = statusMeta(control.status);
  return (
    <div style={overlayStyle}>
      <div style={{ ...drawerStyle, width: 480 }}>
        <div style={drawerHeaderStyle}>
          <div>
            <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>{control.id}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary }}>
              {control.name}
            </div>
          </div>
          <button onClick={onClose} style={iconBtnStyle}>
            <X size={15} color={T.textSecondary} />
          </button>
        </div>

        <div style={{ padding: "4px 24px 24px", overflowY: "auto", flex: 1 }}>
          <SectionLabel>Overview</SectionLabel>
          <p style={{ fontSize: 12.5, color: T.textSecondary, lineHeight: 1.6, marginTop: 0 }}>
            {control.description || "No description provided."}
          </p>
          <div style={{ display: "flex", gap: 20, marginTop: 8, flexWrap: "wrap" }}>
            <DetailStat label="Category">
              <CategoryPill category={control.category} />
            </DetailStat>
            <DetailStat label="Control Type">
              <span style={{ fontSize: 12.5, color: T.textPrimary }}>{control.controlType}</span>
            </DetailStat>
            <DetailStat label="Status">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 9px",
                  borderRadius: 20,
                  background: bg,
                  color,
                  fontSize: 11.5,
                  fontWeight: 600,
                }}
              >
                <Icon size={11} /> {label}
              </span>
            </DetailStat>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>
              Implementation Progress
            </div>
            <ProgressBar value={control.progress} status={control.status} />
          </div>

          <SectionLabel>Ownership &amp; Scope</SectionLabel>
          <DetailStat label="Control Owner">
            <span style={{ fontSize: 12.5, color: T.textPrimary }}>{control.owner}</span>
          </DetailStat>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>
              Target Assets ({control.targetAssets.length})
            </div>
            {control.targetAssets.length === 0 ? (
              <div style={{ fontSize: 12, color: T.textMuted }}>No assets assigned.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {control.targetAssets.map((id) => (
                  <div
                    key={id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: T.cardBg,
                      border: `1px solid ${T.panelBorder}`,
                      borderRadius: 7,
                      padding: "8px 10px",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: T.textPrimary, fontWeight: 600 }}>
                        {assetName(id)}
                      </div>
                      <div style={{ fontSize: 10.5, color: T.textMuted }}>{id}</div>
                    </div>
                    <Link2 size={13} color={T.textMuted} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <SectionLabel>Framework Mapping</SectionLabel>
          {control.frameworkMapping.length === 0 ? (
            <div style={{ fontSize: 12, color: T.textMuted }}>No frameworks mapped.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {control.frameworkMapping.map((m, i) => (
                <div
                  key={i}
                  style={{
                    background: T.cardBg,
                    border: `1px solid ${T.panelBorder}`,
                    borderRadius: 7,
                    padding: "9px 11px",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.accent }}>
                    {m.framework}
                  </div>
                  <div style={{ fontSize: 11.5, color: T.textSecondary, marginTop: 2 }}>
                    {m.requirement || "—"}
                  </div>
                </div>
              ))}
            </div>
          )}

          <SectionLabel>Implementation</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <DetailRow k="Current Status" v={label} />
            <DetailRow k="Implementation Progress" v={`${control.progress}%`} />
            <DetailRow k="Target Scope" v={`${control.targetAssets.length} asset(s)`} />
            <DetailRow
              k="Related Assets"
              v={control.targetAssets.map((id) => assetName(id)).join(", ") || "—"}
            />
          </div>
        </div>

        <div style={drawerFooterStyle}>
          <button onClick={onClose} style={secondaryBtnStyle}>
            Close
          </button>
          <button onClick={onEdit} style={primaryBtnStyle}>
            <Pencil size={13} style={{ marginRight: 6 }} />
            Edit Control
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailStat({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: T.textMuted, marginBottom: 5, fontWeight: 600 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function DetailRow({ k, v }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        fontSize: 12,
        borderBottom: `1px solid ${T.panelBorder}`,
        paddingBottom: 8,
      }}
    >
      <span style={{ color: T.textMuted }}>{k}</span>
      <span style={{ color: T.textPrimary, textAlign: "right" }}>{v}</span>
    </div>
  );
}

/* shared drawer chrome styles */
const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  justifyContent: "flex-end",
  zIndex: 100,
};
const drawerStyle = {
  height: "100%",
  background: T.panelBg,
  borderLeft: `1px solid ${T.panelBorder}`,
  display: "flex",
  flexDirection: "column",
  boxShadow: "-12px 0 32px rgba(0,0,0,0.4)",
};
const drawerHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 24px",
  borderBottom: `1px solid ${T.panelBorder}`,
};
const drawerFooterStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  padding: "16px 24px",
  borderTop: `1px solid ${T.panelBorder}`,
};
const primaryBtnStyle = {
  background: T.accent,
  color: "#1a1508",
  border: "none",
  borderRadius: 8,
  padding: "9px 16px",
  fontSize: 12.5,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
};
const secondaryBtnStyle = {
  background: "transparent",
  color: T.textSecondary,
  border: `1px solid ${T.panelBorder}`,
  borderRadius: 8,
  padding: "9px 16px",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};

/* ---------------------------------------------------------------------- */
/*  MAIN PAGE                                                               */
/* ---------------------------------------------------------------------- */
export default function ControlManagement() {
  const [controls, setControls] = useState(SEED_CONTROLS);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    category: "All",
    status: "All",
    controlType: "All",
    framework: "All",
    owner: "All",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState({ key: "id", dir: "asc" });
  const [detailsControl, setDetailsControl] = useState(null);
  const [editingControl, setEditingControl] = useState(null);
  const [creating, setCreating] = useState(false);

  const owners = useMemo(
    () => Array.from(new Set(controls.map((c) => c.owner))).sort(),
    [controls]
  );

  const filtered = useMemo(() => {
    let rows = controls.filter((c) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.owner.toLowerCase().includes(q);
      const matchesCategory = filters.category === "All" || c.category === filters.category;
      const matchesStatus = filters.status === "All" || c.status === filters.status;
      const matchesType = filters.controlType === "All" || c.controlType === filters.controlType;
      const matchesOwner = filters.owner === "All" || c.owner === filters.owner;
      const matchesFramework =
        filters.framework === "All" ||
        c.frameworkMapping.some((m) => m.framework === filters.framework);
      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus &&
        matchesType &&
        matchesOwner &&
        matchesFramework
      );
    });

    rows = rows.slice().sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

    return rows;
  }, [controls, search, filters, sort]);

  const kpis = useMemo(() => {
    const total = controls.length;
    const active = controls.filter((c) => c.status === "Active / Implemented").length;
    const inProgress = controls.filter(
      (c) => c.status === "In Progress / Under Implementation"
    ).length;
    const planned = controls.filter((c) => c.status === "Inactive / Planned").length;
    const avgProgress = total
      ? Math.round(controls.reduce((s, c) => s + c.progress, 0) / total)
      : 0;
    return { total, active, inProgress, planned, avgProgress };
  }, [controls]);

  const toggleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };

  const handleCreate = (newControl) => {
    setControls((prev) => [...prev, newControl]);
    setCreating(false);
  };

  const handleUpdate = (updated) => {
    setControls((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setEditingControl(null);
    setDetailsControl(null);
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== "All").length;

  const columns = [
    { key: "id", label: "Control ID" },
    { key: "name", label: "Control Name" },
    { key: "category", label: "Category" },
    { key: "controlType", label: "Type" },
    { key: "status", label: "Status" },
    { key: "progress", label: "Progress" },
    { key: "owner", label: "Owner" },
    { key: "targetAssets", label: "Target Assets", noSort: true },
    { key: "frameworkMapping", label: "Frameworks", noSort: true },
  ];

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: T.bg,
        fontFamily: FONT_STACK,
        color: T.textPrimary,
      }}
    >
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header />
        <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
          {/* Page heading */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 20,
            }}
          >
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: T.textPrimary }}>
                Control Management
              </h1>
              <p style={{ fontSize: 12.5, color: T.textMuted, margin: "6px 0 0" }}>
                Inventory, ownership, and framework coverage for every operational control.
              </p>
            </div>
            <button
              onClick={() => setCreating(true)}
              style={{ ...primaryBtnStyle, padding: "10px 16px" }}
            >
              <Plus size={14} style={{ marginRight: 6 }} />
              New Control
            </button>
          </div>

          <div
            style={{
              height: 1,
              background: T.panelBorder,
              marginBottom: 22,
            }}
          />

          {/* KPI row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 14,
              marginBottom: 22,
            }}
          >
            <KpiCard
              label="Total Controls"
              value={kpis.total}
              Icon={ShieldCheck}
              iconColor={T.accent}
              iconBg={T.accentSoft}
            />
            <KpiCard
              label="Active Controls"
              value={kpis.active}
              Icon={CheckCircle2}
              iconColor={T.green}
              iconBg={T.greenSoft}
            />
            <KpiCard
              label="In Progress"
              value={kpis.inProgress}
              Icon={Clock}
              iconColor={T.amber}
              iconBg={T.amberSoft}
            />
            <KpiCard
              label="Planned / Inactive"
              value={kpis.planned}
              Icon={CircleDashed}
              iconColor={T.grey}
              iconBg={T.greySoft}
            />
            <KpiCard
              label="Avg. Progress"
              value={`${kpis.avgProgress}%`}
              Icon={BarChart3}
              iconColor={T.blue}
              iconBg={T.blueSoft}
            />
          </div>

          {/* Search + filter bar */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 14,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: T.inputBg,
                border: `1px solid ${T.panelBorder}`,
                borderRadius: 8,
                padding: "9px 12px",
                flex: "1 1 260px",
                maxWidth: 360,
              }}
            >
              <Search size={14} color={T.textMuted} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, name, description, owner…"
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: T.textPrimary,
                  fontSize: 12.5,
                  width: "100%",
                  fontFamily: FONT_STACK,
                }}
              />
            </div>
            <button
              onClick={() => setShowFilters((s) => !s)}
              style={{
                ...secondaryBtnStyle,
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: activeFilterCount ? T.accent : T.textSecondary,
                borderColor: activeFilterCount ? T.accent : T.panelBorder,
              }}
            >
              <FilterIcon size={13} />
              Filters
              {activeFilterCount > 0 && (
                <span
                  style={{
                    background: T.accent,
                    color: "#1a1508",
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 10,
                    padding: "1px 6px",
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
            <div style={{ fontSize: 11.5, color: T.textMuted, marginLeft: "auto" }}>
              {filtered.length} of {controls.length} controls
            </div>
          </div>

          {showFilters && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 10,
                marginBottom: 16,
                padding: 14,
                background: T.panelBg,
                border: `1px solid ${T.panelBorder}`,
                borderRadius: 10,
              }}
            >
              <FilterSelect
                label="Category"
                value={filters.category}
                options={["All", ...CATEGORIES]}
                onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
              />
              <FilterSelect
                label="Status"
                value={filters.status}
                options={["All", ...STATUSES]}
                onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
              />
              <FilterSelect
                label="Control Type"
                value={filters.controlType}
                options={["All", ...CONTROL_TYPES]}
                onChange={(v) => setFilters((f) => ({ ...f, controlType: v }))}
              />
              <FilterSelect
                label="Framework"
                value={filters.framework}
                options={["All", ...EXISTING_FRAMEWORKS]}
                onChange={(v) => setFilters((f) => ({ ...f, framework: v }))}
              />
              <FilterSelect
                label="Owner"
                value={filters.owner}
                options={["All", ...owners]}
                onChange={(v) => setFilters((f) => ({ ...f, owner: v }))}
              />
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button
                  onClick={() =>
                    setFilters({
                      category: "All",
                      status: "All",
                      controlType: "All",
                      framework: "All",
                      owner: "All",
                    })
                  }
                  style={{
                    ...secondaryBtnStyle,
                    width: "100%",
                    padding: "9px 0",
                  }}
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div
            style={{
              background: T.panelBg,
              border: `1px solid ${T.panelBorder}`,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
                <thead>
                  <tr style={{ background: "#111114" }}>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => !col.noSort && toggleSort(col.key)}
                        style={{
                          textAlign: "left",
                          padding: "11px 16px",
                          fontSize: 10.5,
                          letterSpacing: 0.5,
                          textTransform: "uppercase",
                          color: T.textMuted,
                          fontWeight: 700,
                          borderBottom: `1px solid ${T.panelBorder}`,
                          cursor: col.noSort ? "default" : "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          {col.label}
                          {!col.noSort && (
                            <ArrowUpDown
                              size={10}
                              style={{
                                opacity: sort.key === col.key ? 1 : 0.3,
                              }}
                            />
                          )}
                        </span>
                      </th>
                    ))}
                    <th
                      style={{
                        padding: "11px 16px",
                        borderBottom: `1px solid ${T.panelBorder}`,
                      }}
                    />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length + 1}
                        style={{ padding: "40px 16px", textAlign: "center", color: T.textMuted, fontSize: 12.5 }}
                      >
                        No controls match your search or filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setDetailsControl(c)}
                        style={{
                          borderBottom: `1px solid ${T.panelBorder}`,
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#101013")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "12px 16px", fontSize: 12, color: T.accent, fontWeight: 700 }}>
                          {c.id}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12.5, fontWeight: 600, maxWidth: 220 }}>
                          {c.name}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <CategoryPill category={c.category} />
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: T.textSecondary }}>
                          {c.controlType}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <StatusBadge status={c.status} />
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <ProgressBar value={c.progress} status={c.status} />
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: T.textSecondary, whiteSpace: "nowrap" }}>
                          {c.owner}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 11.5, color: T.textSecondary, maxWidth: 160 }}>
                          {c.targetAssets.length} asset{c.targetAssets.length !== 1 ? "s" : ""}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 11.5, color: T.textSecondary, maxWidth: 160 }}>
                          {c.frameworkMapping.length} mapped
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailsControl(c);
                              }}
                              style={iconBtnStyle}
                              title="View"
                            >
                              <Eye size={13} color={T.textSecondary} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingControl(c);
                              }}
                              style={iconBtnStyle}
                              title="Edit"
                            >
                              <Pencil size={13} color={T.textSecondary} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {detailsControl && (
        <ControlDetailsDrawer
          control={detailsControl}
          onClose={() => setDetailsControl(null)}
          onEdit={() => {
            setEditingControl(detailsControl);
          }}
        />
      )}

      {editingControl && (
        <ControlFormDrawer
          initial={editingControl}
          existingIds={controls.map((c) => c.id)}
          onClose={() => setEditingControl(null)}
          onSave={handleUpdate}
        />
      )}

      {creating && (
        <ControlFormDrawer
          initial={null}
          existingIds={controls.map((c) => c.id)}
          onClose={() => setCreating(false)}
          onSave={handleCreate}
        />
      )}
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: T.textMuted, marginBottom: 5, fontWeight: 600 }}>
        {label}
      </div>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle()}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
