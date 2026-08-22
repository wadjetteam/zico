import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, X, Percent, Shield, Users, Building, Cpu } from "lucide-react";
import api from "../api/client";
import { EFFECTIVENESS_OPTIONS, LINK_TYPES, effectivenessChipClass } from "../lib/riskLinks";
import { chipClass, titleCase } from "../lib/format";

const DOMAIN_ICONS = {
  Organizational: Building,
  People: Users,
  Physical: Shield,
  Technological: Cpu,
};

const DOMAIN_COLORS = {
  Organizational: "border-sky-800/60 bg-sky-950/40 text-sky-300",
  People: "border-violet-800/60 bg-violet-950/40 text-violet-300",
  Physical: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  Technological: "border-amber-800/60 bg-amber-950/40 text-amber-300",
};

/**
 * Searchable multi-select of compliance controls from the Control Library.
 * value: [{ control_id, link_type: existing|proposed|mitigating, effectiveness }]
 */
export default function ControlPicker({ value = [], onChange }) {
  const [controls, setControls] = useState([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [domainFilter, setDomainFilter] = useState("");

  useEffect(() => {
    api
      .get("/controls", { params: { pageSize: 500 } })
      .then((r) => setControls(r.data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const code = (c) => c.controlId || c.annexCode;

  const domains = useMemo(() => {
    const ds = new Set(controls.map((c) => c.domain).filter(Boolean));
    return Array.from(ds).sort();
  }, [controls]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return controls.filter((c) => {
      if (domainFilter && c.domain !== domainFilter) return false;
      if (!t) return true;
      return `${code(c)} ${c.name} ${c.domain || ""} ${c.controlType || ""} ${(c.frameworkMappings || []).map((m) => m.framework?.name || "").join(" ")}`.toLowerCase().includes(t);
    });
  }, [controls, q, domainFilter]);

  const selectedIds = new Set(value.map((s) => s.control_id));

  const toggle = (c) => {
    const exists = selectedIds.has(c._id);
    onChange(
      exists
        ? value.filter((s) => s.control_id !== c._id)
        : [...value, { control_id: c._id, link_type: "existing", effectiveness: "Not Assessed", control: c }]
    );
  };

  const setAttr = (cid, key, v) =>
    onChange(value.map((s) => (s.control_id === cid ? { ...s, [key]: v } : s)));

  const selectedControls = value
    .map((s) => ({ sel: s, control: controls.find((c) => c._id === s.control_id) }))
    .filter((x) => x.control);

  const effectivenessValue = (c) => c?.effectiveness?.overall ?? null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="label">Linked controls (Risk ↔ Control mapping)</span>
        <button type="button" onClick={() => setOpen((o) => !o)} className="btn-ghost px-3 py-1.5 text-xs">
          {open ? "Close picker" : "Browse controls"}
          <ChevronDown className={`ml-1 inline h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="mb-3 rounded-lg border border-line bg-ink-deep/60 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
            <input
              className="input pl-9"
              placeholder="Search by control ID, name, domain, framework…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setDomainFilter("")}
              className={`chip text-[10px] px-2 py-0.5 ${!domainFilter ? "border-gold/50 bg-gold/10 text-gold" : "border-line bg-white/[0.03] text-neutral-400"}`}
            >
              All domains
            </button>
            {domains.map((d) => {
              const Icon = DOMAIN_ICONS[d] || Shield;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDomainFilter(d === domainFilter ? "" : d)}
                  className={`chip text-[10px] px-2 py-0.5 ${d === domainFilter ? "border-gold/50 bg-gold/10 text-gold" : "border-line bg-white/[0.03] text-neutral-400"}`}
                >
                  <Icon className="mr-1 inline h-3 w-3" />
                  {d}
                </button>
              );
            })}
          </div>
          <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
            {loading ? (
              <p className="px-2 py-1 text-xs text-neutral-500">Loading controls…</p>
            ) : filtered.length === 0 ? (
              <p className="px-2 py-1 text-xs text-neutral-500">No controls match.</p>
            ) : (
              filtered.map((c) => {
                const checked = selectedIds.has(c._id);
                const eff = effectivenessValue(c);
                const DomainIcon = DOMAIN_ICONS[c.domain] || Shield;
                return (
                  <label
                    key={c._id}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 transition ${
                      checked ? "border-gold/50 bg-gold/10" : "border-transparent hover:bg-white/5"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-[#D4AF37]"
                      checked={checked}
                      onChange={() => toggle(c)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-gold">{code(c)}</span>
                        <span className={chipClass(c.implementationStatus)}>{c.implementationStatus}</span>
                        <span className={`chip text-[10px] ${DOMAIN_COLORS[c.domain] || "border-line bg-white/[0.03] text-neutral-400"}`}>
                          <DomainIcon className="mr-0.5 inline h-2.5 w-2.5" />
                          {c.domain}
                        </span>
                        {eff !== null && (
                          <span className="chip text-[10px] border-emerald-800/60 bg-emerald-950/40 text-emerald-300">
                            {eff}%
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm text-neutral-200">{c.name}</span>
                      <span className="text-[11px] text-neutral-500">
                        {(c.frameworkMappings || []).map((m) => `${m.framework?.name}${m.annexCode ? ` (${m.annexCode})` : ""}`).join(" · ")}
                      </span>
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}

      {selectedControls.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-3 py-2.5 text-xs text-neutral-500">
          No controls linked yet. Open the picker to attach the controls that mitigate this risk — they feed the SoA
          and control-coverage views.
        </p>
      ) : (
        <div className="space-y-2">
          {selectedControls.map(({ sel, control }) => {
            const hasTested = sel.testedEffectiveness != null && String(sel.testedEffectiveness).trim() !== "";
            const libEff = control?.effectiveness?.overall ?? null;
            const DomainIcon = DOMAIN_ICONS[control?.domain] || Shield;
            return (
              <div
                key={control._id}
                className="rounded-lg border border-line bg-ink-deep/40 px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold text-gold">{code(control)}</span>
                      <span className={effectivenessChipClass(sel.effectiveness)}>{sel.effectiveness}</span>
                      {hasTested && (
                        <span className="chip border-sky-800/60 bg-sky-950/40 text-sky-300">
                          Tested {sel.testedEffectiveness}%
                        </span>
                      )}
                      {libEff !== null && !hasTested && (
                        <span className="chip border-emerald-800/60 bg-emerald-950/40 text-emerald-300">
                          Lib {libEff}%
                        </span>
                      )}
                      <span className={`chip text-[10px] ${DOMAIN_COLORS[control?.domain] || "border-line bg-white/[0.03] text-neutral-400"}`}>
                        <DomainIcon className="mr-0.5 inline h-2.5 w-2.5" />
                        {control?.domain}
                      </span>
                    </span>
                    <span className="block truncate text-sm text-neutral-200">{control.name}</span>
                    <span className="text-[10px] text-neutral-500">
                      {(control?.frameworkMappings || []).map((m) => `${m.framework?.name}${m.annexCode ? ` (${m.annexCode})` : ""}`).join(" · ")}
                    </span>
                  </span>
                  <select
                    className="input !w-auto py-1.5 text-xs"
                    value={sel.link_type}
                    onChange={(e) => setAttr(control._id, "link_type", e.target.value)}
                    aria-label={`Link type for ${control.controlId}`}
                  >
                    {LINK_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-ink-deep">
                        {titleCase(t)}
                      </option>
                    ))}
                  </select>
                  <select
                    className="input !w-auto py-1.5 text-xs"
                    value={sel.effectiveness}
                    onChange={(e) => setAttr(control._id, "effectiveness", e.target.value)}
                    aria-label={`Effectiveness of ${control.controlId}`}
                  >
                    {EFFECTIVENESS_OPTIONS.map((o) => (
                      <option key={o} value={o} className="bg-ink-deep">
                        {o}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="rounded-md p-1 text-neutral-500 transition hover:text-red-300"
                    onClick={() => toggle(control)}
                    aria-label={`Remove ${control.controlId}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <div>
                    <label className="mb-0.5 block text-[9px] text-neutral-500">Weight</label>
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      className="input py-1 text-xs"
                      value={sel.weight ?? 0.33}
                      onChange={(e) => setAttr(control._id, "weight", Number(e.target.value))}
                      placeholder="0.33"
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[9px] text-neutral-500">Relevance</label>
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      className="input py-1 text-xs"
                      value={sel.relevance ?? 0.95}
                      onChange={(e) => setAttr(control._id, "relevance", Number(e.target.value))}
                      placeholder="0.95"
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[9px] text-neutral-500">Role</label>
                    <select
                      className="input py-1 text-xs"
                      value={sel.role || "both"}
                      onChange={(e) => setAttr(control._id, "role", e.target.value)}
                    >
                      <option value="both">Both</option>
                      <option value="likelihood">Likelihood</option>
                      <option value="impact">Impact</option>
                    </select>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={`chip border-line px-2 py-1 text-xs transition ${
                      hasTested ? "border-sky-500/40 bg-sky-950/30 text-sky-300" : "bg-white/[0.03] text-neutral-400 hover:border-gold/40 hover:text-gold"
                    }`}
                    onClick={() => setAttr(control._id, "showTested", !hasTested)}
                  >
                    <Percent className="mr-1 inline h-3 w-3" />
                    {hasTested ? "Tested effectiveness set" : "Add tested effectiveness"}
                  </button>
                  {hasTested && sel.testedEffectivenessSource && (
                    <span className="text-[11px] text-neutral-500">Source: {sel.testedEffectivenessSource}</span>
                  )}
                </div>
                {sel.showTested && (
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] text-neutral-500">Tested effectiveness % (0–100)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="input"
                        value={sel.testedEffectiveness ?? ""}
                        onChange={(e) => setAttr(control._id, "testedEffectiveness", e.target.value)}
                        placeholder="e.g. 60"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-neutral-500">Source <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        className="input"
                        value={sel.testedEffectivenessSource ?? ""}
                        onChange={(e) => setAttr(control._id, "testedEffectivenessSource", e.target.value)}
                        placeholder="Pen-test Q2 2026 / Internal Audit Sample"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}