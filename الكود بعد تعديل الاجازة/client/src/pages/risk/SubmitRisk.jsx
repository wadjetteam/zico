import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { CheckCircle2, HelpCircle, AlertTriangle, Target, Shield, FileText, Users } from "lucide-react";
import api, { resource } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import ControlPicker from "../../components/ControlPicker";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import { CreatableSelect } from "../../components/CreatableSelect";
import { syncRiskLinks } from "../../lib/riskLinks";
import { SEVERITY_STYLES, titleCase } from "../../lib/format";
import { computeRiskScore } from "../../lib/riskEngine";

const risks = resource("risks");
const assets = resource("assets");
const domains = resource("domains");
const parameters = resource("parameters");

const RISK_CATEGORIES = [
  "Cybersecurity", "Information Security", "Compliance/Legal", "Operational/BCP",
  "Third-Party Risk", "Human Risk", "Application/Mobile Security", "Cloud/Physical/AI", "Risk Management/GRC"
];
const RISK_SOURCES = ["Audit", "Incident", "Regulatory", "Risk Workshop", "Vendor Assessment", "Scan"];
const TREATMENT_DECISIONS = ["Modify", "Retain", "Avoid", "Share"];
const REVIEW_FREQUENCIES = ["Monthly", "Quarterly", "Annually"];
const SCALE = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }));
const SCALE_LABELS = { 1: "Rare", 2: "Unlikely", 3: "Possible", 4: "Likely", 5: "Almost Certain" };

const IMPACTS = [
  { key: "financial", label: "Financial" },
  { key: "regulatory", label: "Regulatory" },
  { key: "reputational", label: "Reputational" },
  { key: "safety", label: "Safety" },
  { key: "operational", label: "Operational" },
  { key: "confidentiality", label: "Confidentiality" },
  { key: "integrity", label: "Integrity" },
  { key: "availability", label: "Availability" },
];

const uniqueImpactCriteria = (criteria = []) => {
  const seen = new Set();
  return criteria.filter((c) => {
    const name = c.name || c;
    if (typeof name !== "string" || name.length < 3) return false;
    if (/[0-9]/.test(name)) return false;
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
};

const normalizeWeights = (weights, changedName, newValue) => {
  const clamped = Math.min(1, Math.max(0, Number(newValue) || 0));
  return { ...weights, [changedName]: clamped };
};

export default function SubmitRisk() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", description: "", domain: "", parameter: "", process: "", subProcess: "", riskCategory: "Cybersecurity",
    assetSystem: "", threat: "", vulnerability: "", riskOwnerId: "", ownerTeam: "", riskSource: "",
    dateIdentified: new Date().toISOString().slice(0, 10),
    likelihood: 3, impacts: {}, criteriaWeights: {},
    treatmentDecision: "Modify", treatmentActions: "", estimatedBudget: null,
    plannedControls: [], treatmentOwnerId: "", targetDate: "", reviewFrequency: "Quarterly",
    acceptanceJustification: "", nextReviewDate: "", riskOwnerSignOff: null, attachments: [],
  });
  const [linkedControls, setLinkedControls] = useState([]);
  const [assetOptions, setAssetOptions] = useState([]);
  const [domainOptions, setDomainOptions] = useState([]);
  const [params, setParams] = useState([]);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [computed, setComputed] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [parameterOptions, setParameterOptions] = useState([]);

  useEffect(() => {
    assets.list().then((d) => setAssetOptions(d.items)).catch(() => setAssetOptions([]));
    domains.list().then((d) => {
      const opts = d.items.map((x) => ({ value: x._id, label: x.name, status: x.status }));
      setDomainOptions(opts);
      setForm((s) => ({ ...s, domain: s.domain || opts[0]?.value || "" }));
    }).catch(() => {});
    parameters.list().then((d) => setParams(d.items)).catch(() => setParams([]));
    resource("users").list().then((d) => setUsers(d.items)).catch(() => setUsers([]));
  }, []);

  const domainInfo = useMemo(() => {
    const dm = domainOptions.find((o) => o.value === form.domain);
    if (!dm) return null;
    const domainParams = params.filter((p) => String(p.domain?._id || p.domain) === form.domain);
    const chosen = form.parameter ? domainParams.find((p) => p._id === form.parameter) : domainParams.find((p) => p.active) || domainParams[0];
    if (!chosen?.criteria) return { name: dm.label, param: chosen };
    return {
      name: dm.label,
      param: {
        ...chosen,
        criteria: uniqueImpactCriteria(chosen.criteria),
      },
    };
  }, [domainOptions, form.domain, form.parameter, params]);

  useEffect(() => {
    if (!domainInfo?.param?.criteria) return;
    setForm((prev) => {
      const next = { ...prev };
      const impacts = { ...prev.impacts };
      const weights = { ...prev.criteriaWeights };
      for (const c of domainInfo.param.criteria) {
        if (impacts[c.name] == null) impacts[c.name] = 3;
        if (weights[c.name] == null) weights[c.name] = Number(c.weight) || 0.125;
      }
      next.impacts = impacts;
      next.criteriaWeights = weights;
      if (domainInfo.param._id) next.parameter = domainInfo.param._id;
      return next;
    });
  }, [domainInfo?.param?._id]);

  useEffect(() => {
    if (!form.domain) return;
    const domainParams = params.filter((p) => String(p.domain?._id || p.domain) === form.domain);
    const opts = domainParams.map((p) => ({ value: p._id, label: `${p.name} (v${Number(p.methodVersion) || 1})` }));
    setParameterOptions(opts);
    setForm((prev) => {
      const activeParam = domainParams.find((p) => p.active) || domainParams[0];
      return { ...prev, parameter: activeParam?._id || prev.parameter };
    });
  }, [form.domain, params]);

  const previewScore = useCallback(async () => {
    if (!domainInfo?.param || !form.likelihood) return;
    setPreviewing(true);
    try {
      const impactsObj = {};
      const weightsObj = {};
      for (const c of domainInfo.param.criteria || []) {
        impactsObj[c.name] = Number(form.impacts?.[c.name]) || 1;
        const rawW = form.criteriaWeights?.[c.name];
        weightsObj[c.name] = (rawW != null && !isNaN(Number(rawW))) ? Number(rawW) : (Number(c.weight) || 0.125);
      }
      const linked = linkedControls.map((l) => ({
        controlId: l.control_id,
        controlName: l.control?.name || l.controlName || "",
        effectiveness: l.testedEffectiveness || (domainInfo?.param?.controlEffectivenessWeights?.[l.effectiveness || "Not Assessed"] || 0) * 100,
        relevance: l.relevance ?? 0.95,
        weight: l.weight ?? (1 / linkedControls.length),
        effectivenessRating: l.effectiveness || "Not Assessed",
        testedEffectiveness: l.testedEffectiveness ?? null,
      }));
      const res = await api.post("/risks/preview-score", {
        likelihood: Number(form.likelihood),
        impacts: impactsObj,
        criteriaWeights: weightsObj,
        domain: form.domain,
        linkedControls: linked,
      });
      setComputed(res.data);
    } catch (e) {
      console.warn("Preview failed:", e.message);
    } finally {
      setPreviewing(false);
    }
  }, [domainInfo, form.likelihood, form.impacts, form.criteriaWeights, form.domain, linkedControls]);

  useEffect(() => {
    const timer = setTimeout(previewScore, 300);
    return () => clearTimeout(timer);
  }, [previewScore]);

  const handleControlCEChange = useCallback((controlId, field, value) => {
    setLinkedControls(prev => prev.map(c => {
      const id = c.controlId || c._id || c.control_id;
      return id === controlId ? { ...c, [field]: value } : c;
    }));
  }, []);

  const handleLinksChange = useCallback((newLinks) => {
    setLinkedControls(newLinks);
  }, []);

  const setField = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const createRisk = async () => {
    const impacts = (domainInfo?.param?.criteria || []).map((c) => ({
      name: c.name,
      value: Number(form.impacts?.[c.name]) || 1,
    }));
    const criteriaWeights = (domainInfo?.param?.criteria || []).map((c) => {
      const rawW = form.criteriaWeights?.[c.name];
      return {
        name: c.name,
        weight: (rawW != null && !isNaN(Number(rawW))) ? Number(rawW) : (Number(c.weight) || 0.125),
      };
    });
    const payload = {
      ...form,
      impacts,
      criteriaWeights,
      parameter: form.parameter || domainInfo?.param?._id || undefined,
      riskId: undefined,
      computed: undefined,
    };
    if (!payload.asset) delete payload.asset;
    const created = await risks.create(payload);
    await syncRiskLinks(created._id, linkedControls.map(l => ({
      control_id: l.control_id,
      link_type: l.link_type || "existing",
      effectiveness: l.effectiveness || "Not Assessed",
      testedEffectiveness: l.testedEffectiveness ?? null,
      testedEffectivenessSource: l.testedEffectivenessSource ?? null,
    })));
    return created;
  };

  const submit = async (e) => {
    e.preventDefault();
    const missing = [];
    if (!form.title) missing.push("Title");
    if (!form.domain) missing.push("Domain");
    if (!form.parameter) missing.push("Parameter");
    if (!form.riskOwnerId) missing.push("Risk Owner");
    if (!form.treatmentDecision) missing.push("Treatment Decision");
    if (!form.nextReviewDate) missing.push("Next Review Date");
    if (missing.length) {
      setError(`Please complete all required fields: ${missing.join(", ")}.`);
      return;
    }
    if (form.nextReviewDate && form.nextReviewDate < new Date().toISOString().slice(0, 10)) {
      setError("Next Review Date must be in the future.");
      return;
    }
    if (!domainInfo?.param) {
      setError("No active parameter found for the selected domain. Please select a valid domain.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createRisk();
      setDone(true);
      setTimeout(() => navigate("/risk/view"), 900);
    } catch (err) {
      const data = err?.response?.data;
      setError(data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const ragStatus = useMemo(() => {
    if (!form.targetDate || !computed) return "Green";
    const today = new Date().toISOString().slice(0, 10);
    if (form.targetDate < today) return "Red";
    const daysUntil = Math.ceil((new Date(form.targetDate) - new Date(today)) / 86400000);
    if (daysUntil < 30) return "Amber";
    return "Green";
  }, [form.targetDate, computed]);

  const currentCE = useMemo(() => {
    if (!linkedControls.length) return 0;
    let ce = 0;
    for (const c of linkedControls) {
      const tested = c.testedEffectiveness != null && String(c.testedEffectiveness).trim() !== "";
      const val = tested ? Number(c.testedEffectiveness) / 100 : (domainInfo?.param?.controlEffectivenessWeights?.[c.effectiveness || "Not Assessed"] || 0);
      ce = 1 - (1 - ce) * (1 - val);
    }
    return Math.min(ce, domainInfo?.param?.residualCapReduction || 0.75);
  }, [linkedControls, domainInfo]);

  const targetCE = useMemo(() => {
    const all = [...linkedControls, ...(form.plannedControls || [])];
    if (!all.length) return currentCE;
    let ce = 0;
    for (const c of all) {
      const tested = c.testedEffectiveness != null && String(c.testedEffectiveness).trim() !== "";
      const val = tested ? Number(c.testedEffectiveness) / 100 : (domainInfo?.param?.controlEffectivenessWeights?.[c.effectivenessRating || "Not Assessed"] || 0);
      ce = 1 - (1 - ce) * (1 - val);
    }
    return Math.min(ce, domainInfo?.param?.residualCapReduction || 0.75);
  }, [linkedControls, form.plannedControls, currentCE, domainInfo]);

  return (
    <>
      <PageHeader
        title="Submit New Risk"
        subtitle="Record a new risk with full assessment, control mapping, treatment plan, and governance approval."
      />
      <form onSubmit={submit} className="space-y-6">
        {error && (
          <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>
        )}

        {/* Section 1 — Risk Identification */}
        <div className="card space-y-4 p-6">
          <p className="label border-b border-line pb-2">1. Risk Identification</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Risk Title" hint="Short descriptive title" className="lg:col-span-2">
              <TextInput value={form.title} onChange={(e) => setField("title", e.target.value)} required />
            </Field>
            <Field label="Domain / Business Unit" hint="Determines scoring rules">
              <Select value={form.domain} onChange={(e) => setField("domain", e.target.value)} options={domainOptions} required />
            </Field>
            <Field label="Parameter Version" hint="Active parameter for this domain">
              <Select value={form.parameter} onChange={(e) => setField("parameter", e.target.value)} options={parameterOptions} required />
            </Field>
            <Field label="Risk Description" hint="Full threat scenario" className="lg:col-span-2">
              <TextArea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={3} />
            </Field>
            <Field label="Risk Category">
              <Select value={form.riskCategory} onChange={(e) => setField("riskCategory", e.target.value)} options={RISK_CATEGORIES} />
            </Field>
            <Field label="Process">
              <TextInput value={form.process} onChange={(e) => setField("process", e.target.value)} />
            </Field>
            <Field label="Sub-Process">
              <TextInput value={form.subProcess} onChange={(e) => setField("subProcess", e.target.value)} />
            </Field>
            <Field label="Asset / System">
              <Select value={form.assetSystem} onChange={(e) => setField("assetSystem", e.target.value)} options={[{ value: "", label: "— None —" }, ...assetOptions.map((a) => ({ value: a._id, label: a.name }))]} />
            </Field>
            <Field label="Threat">
              <TextInput value={form.threat} onChange={(e) => setField("threat", e.target.value)} />
            </Field>
            <Field label="Vulnerability">
              <TextInput value={form.vulnerability} onChange={(e) => setField("vulnerability", e.target.value)} />
            </Field>
            <Field label="Risk Owner" hint="Select existing user or type a new name to create" className="lg:col-span-2">
              <CreatableSelect
                value={form.riskOwnerId}
                onChange={(val) => setField("riskOwnerId", val)}
                options={users.map((u) => ({ value: u.fullName || u.username, label: u.fullName || u.username }))}
                placeholder="Select or type owner name…"
              />
            </Field>
            <Field label="Owner Team">
              <TextInput value={form.ownerTeam} onChange={(e) => setField("ownerTeam", e.target.value)} />
            </Field>
            <Field label="Risk Source">
              <Select value={form.riskSource} onChange={(e) => setField("riskSource", e.target.value)} options={[{ value: "", label: "— Select —" }, ...RISK_SOURCES.map((s) => ({ value: s, label: s }))]} />
            </Field>
            <Field label="Date Identified">
              <TextInput type="date" value={form.dateIdentified} onChange={(e) => setField("dateIdentified", e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Section 2 — Domain Parameters (Read-Only) */}
        {domainInfo?.param && (
          <div className="card space-y-4 p-6">
            <p className="label border-b border-line pb-2">2. Domain Parameters (Read-Only)</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Impact Method" value={domainInfo.param.impactMethod === "max" ? "Maximum" : "Weighted Average"} readOnly />
              <Field label="Risk Score Method" value={domainInfo.param.riskScoreMethod === "weighted_additive" ? "Weighted Additive" : "Multiplicative (L × I)"} readOnly />
              <Field label="Thresholds" value={`C≥${domainInfo.param.thresholds.critical} H≥${domainInfo.param.thresholds.high} M≥${domainInfo.param.thresholds.medium}`} readOnly />
              <Field label="Risk Appetite" value={`≤ ${domainInfo.param.appetiteLimit ?? "Not Set"}`} readOnly />
              <Field label="Parameter Version" value={`v${Number(domainInfo.param.methodVersion) || 1}`} readOnly />
              <Field label="Residual Cap" value={`${Math.round((Number(domainInfo.param.residualCapReduction) || 0.75) * 100)}%`} readOnly />
            </div>
            <div className="mt-3">
              <span className="label text-[11px]">Impact Weights</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {(domainInfo.param.criteria || []).map((c) => (
                  <span key={c.name} className="chip text-[10px] border-line bg-white/[0.03] text-neutral-400">{c.name}: {Number(c.weight).toFixed(3)}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section 3 — Risk Analysis */}
        <div className="card space-y-4 p-6">
          <p className="label border-b border-line pb-2">3. Risk Analysis</p>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Inputs */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-lg border border-line bg-white/[0.02] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">Likelihood (User Input)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {SCALE.map((n) => (
                    <button
                      key={n.value}
                      type="button"
                      onClick={() => setField("likelihood", Number(n.value))}
                      className={`rounded-lg border px-3 py-2.5 text-center transition ${
                        form.likelihood === Number(n.value)
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-line bg-ink-deep/40 text-neutral-300 hover:border-gold/40"
                      }`}
                    >
                      <span className="block text-lg font-mono font-bold">{n.value}</span>
                      <span className="text-[10px] text-neutral-500">{SCALE_LABELS[n.value]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Impact Criteria</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-600">
                      Total: {Object.values(form.criteriaWeights).reduce((a, b) => a + (Number(b) || 0), 0).toFixed(3)}
                    </span>
                    {Math.abs(Object.values(form.criteriaWeights).reduce((a, b) => a + (Number(b) || 0), 0) - 1) > 0.001 && (
                      <AlertTriangle className="h-3 w-3 text-amber-400" />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const defaults = {};
                        for (const c of domainInfo?.param?.criteria || []) {
                          defaults[c.name] = Number(c.weight) || 0.125;
                        }
                        setField("criteriaWeights", defaults);
                      }}
                      className="rounded-md border border-line px-2 py-1 text-[10px] text-neutral-400 transition hover:border-gold/40 hover:text-gold"
                    >
                      Reset defaults
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {uniqueImpactCriteria(domainInfo?.param?.criteria || IMPACTS).map((c) => {
                    const name = typeof c === "string" ? c : (c.name || c.key || c.label);
                    const domainWeight = typeof c === "string" ? null : (Number(c.weight) || null);
                    const rawWeight = form.criteriaWeights?.[name];
                    const weight = (rawWeight != null && !isNaN(Number(rawWeight))) ? Number(rawWeight) : (domainWeight ?? 0.125);
                    const rate = Number(form.impacts?.[name]) || 1;
                    const contribution = Number((weight * rate).toFixed(3));
                    return (
                      <div key={name} className="rounded-lg border border-line bg-white/[0.02] p-3">
                        <span className="block text-[10px] uppercase tracking-wider text-neutral-500 mb-1">{name}</span>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="block text-[9px] text-neutral-600 mb-0.5">Weight</label>
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              max="1"
                              className="input w-full text-center font-mono text-xs"
                              value={weight}
                              onChange={(e) => {
                                const val = Math.min(1, Math.max(0, Number(e.target.value) || 0));
                                setField("criteriaWeights", normalizeWeights(form.criteriaWeights, name, val));
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-neutral-600 mb-0.5">Rate (1-5)</label>
                            <select
                              className="input w-full text-center font-mono text-xs"
                              value={rate}
                              onChange={(e) => setField("impacts", { ...form.impacts, [name]: Number(e.target.value) })}
                            >
                              {SCALE.map((n) => (
                                <option key={n.value} value={n.value}>{n.value}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="rounded bg-ink-deep/60 px-2 py-1 text-center">
                          <span className="text-[10px] text-neutral-500">Contribution</span>
                          <span className="block font-mono text-sm font-bold text-neutral-200">{contribution.toFixed(3)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Live Scores */}
            <div className="lg:col-span-5 space-y-3">
              {computed && (
                <>
                  <div className="rounded-lg border border-gold/30 bg-gold/[0.02] p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gold mb-2">Inherent Risk Score</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-mono font-bold text-neutral-100">{computed.inherentScore}</span>
                      <span className={`chip ${SEVERITY_STYLES[computed.inherentLevel?.toLowerCase()]}`}>{computed.inherentLevel}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-neutral-500">L {form.likelihood} × I {computed.impact}</p>
                  </div>

                  <div className="rounded-lg border border-line bg-white/[0.02] p-4">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">Residual Score (Current)</p>
                    <div className="flex items-baseline gap-3">
                      <span className={`text-4xl font-mono font-bold ${SEVERITY_STYLES[computed.residualLevel?.toLowerCase()]}`}>{computed.residualScore}</span>
                      <span className={`chip ${SEVERITY_STYLES[computed.residualLevel?.toLowerCase()]}`}>{computed.residualLevel}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-neutral-500">After controls · Combined CE {Math.round(currentCE * 100)}%</p>
                  </div>

                  <div className="rounded-lg border border-line bg-white/[0.02] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Escalation Path</p>
                    <p className="text-sm font-medium text-gold">{computed.escalationPath}</p>
                  </div>
                </>
              )}
              {!computed && (
                <div className="rounded-lg border border-dashed border-line p-6 text-center text-xs text-neutral-600">
                  Select a domain and enter values to see live scores.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 4 — Current Controls & Residual */}
        <div className="card space-y-4 p-6">
          <p className="label border-b border-line pb-2">4. Current Controls & Residual (As-Is)</p>
          <ControlPicker value={linkedControls} onChange={handleLinksChange} />
          {computed && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-line bg-white/[0.02] p-3 text-center">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">Combined CE</span>
                <span className="block text-2xl font-mono font-bold text-neutral-100">{Math.round(currentCE * 100)}%</span>
              </div>
              <div className="rounded-lg border border-line bg-white/[0.02] p-3 text-center">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">Residual Current</span>
                <span className={`block text-2xl font-mono font-bold ${SEVERITY_STYLES[computed.residualLevel?.toLowerCase()]}`}>{computed.residualScore}</span>
                <span className={`chip text-xs ${SEVERITY_STYLES[computed.residualLevel?.toLowerCase()]}`}>{computed.residualLevel}</span>
              </div>
              <div className="rounded-lg border border-line bg-white/[0.02] p-3 text-center">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">Appetite</span>
                <span className="block text-2xl font-mono font-bold text-neutral-100">≤ {domainInfo?.param?.appetiteLimit ?? "—"}</span>
                {domainInfo?.param?.toleranceLimit && (
                  <span className="text-[10px] text-neutral-500">Tolerance: ≤ {domainInfo.param.toleranceLimit}</span>
                )}
              </div>
              <div className="rounded-lg border border-line bg-white/[0.02] p-3 text-center">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">Status</span>
                <span className={`chip mt-1 ${computed.appetiteStatus === "Within Appetite" ? "border-emerald-800/60 bg-emerald-950/40 text-emerald-300" : computed.appetiteStatus === "Above Appetite / Within Tolerance" ? "border-amber-800/60 bg-amber-950/40 text-amber-300" : "border-red-800/60 bg-red-950/40 text-red-300"}`}>
                  {computed.appetiteStatus || (computed.residualScore > (domainInfo?.param?.appetiteLimit || 25) ? "Exceeds Appetite" : "Within Appetite")}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section 4.5 — Calculation Trace (Audit) */}
        {computed && computed.calculationTrace && (
          <div className="card space-y-4 p-6">
            <p className="label border-b border-line pb-2">4.5 Calculation Trace (Audit Trail)</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-line bg-white/[0.02] p-3">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">Likelihood</span>
                <span className="block text-lg font-mono font-bold text-neutral-100">{computed.calculationTrace.likelihood}</span>
              </div>
              <div className="rounded-lg border border-line bg-white/[0.02] p-3">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">Impact</span>
                <span className="block text-lg font-mono font-bold text-neutral-100">{computed.calculationTrace.impact}</span>
                <span className="text-[10px] text-neutral-500">{computed.calculationTrace.impactCalcDetail}</span>
              </div>
              <div className="rounded-lg border border-line bg-white/[0.02] p-3">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">Inherent Score</span>
                <span className="block text-lg font-mono font-bold text-neutral-100">{computed.inherentScore}</span>
                <span className="text-[10px] text-neutral-500">{computed.calculationTrace.inherentCalcDetail}</span>
              </div>
              <div className="rounded-lg border border-line bg-white/[0.02] p-3">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">Combined CE</span>
                <span className="block text-lg font-mono font-bold text-neutral-100">{computed.calculationTrace.effectiveCE}%</span>
                {computed.calculationTrace.capApplied && <span className="text-[10px] text-amber-400">Cap applied (max {computed.maximumRiskReduction ? (computed.maximumRiskReduction * 100).toFixed(0) : 75}%)</span>}
              </div>
              <div className="rounded-lg border border-line bg-white/[0.02] p-3">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">Residual Score</span>
                <span className="block text-lg font-mono font-bold text-neutral-100">{computed.residualScore}</span>
                <span className="text-[10px] text-neutral-500">{computed.calculationTrace.residualCalcDetail}</span>
              </div>
              <div className="rounded-lg border border-line bg-white/[0.02] p-3">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">Max Risk Reduction</span>
                <span className="block text-lg font-mono font-bold text-neutral-100">{computed.maximumRiskReduction ? (computed.maximumRiskReduction * 100).toFixed(0) : 75}%</span>
                <span className="text-[10px] text-neutral-500">Min Residual: {computed.calculationTrace.minResidualScore}</span>
              </div>
            </div>
            {computed.calculationTrace.ceDetails && computed.calculationTrace.ceDetails.length > 0 && (
              <div className="mt-3">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">Control Effectiveness Details</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {computed.calculationTrace.ceDetails.map((d, i) => (
                    <span key={i} className="chip text-[10px] border-line bg-white/[0.03] text-neutral-400">{d}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 5 — Treatment Plan & Target Residual */}
        <div className="card space-y-4 p-6">
          <p className="label border-b border-line pb-2">5. Treatment Plan & Target Residual</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Treatment Decision" hint="Required — how will this risk be handled?" className="lg:col-span-2">
              <Select value={form.treatmentDecision} onChange={(e) => setField("treatmentDecision", e.target.value)} options={TREATMENT_DECISIONS} />
            </Field>
            <Field label="Treatment Owner" hint="Select existing user or type a new name to create">
              <CreatableSelect
                value={form.treatmentOwnerId}
                onChange={(val) => setField("treatmentOwnerId", val)}
                options={users.map((u) => ({ value: u.fullName || u.username, label: u.fullName || u.username }))}
                placeholder="Select or type owner name…"
              />
            </Field>
            <Field label="Treatment Actions" hint="Describe planned actions" className="lg:col-span-2">
              <TextArea value={form.treatmentActions} onChange={(e) => setField("treatmentActions", e.target.value)} rows={3} />
            </Field>
            <Field label="Estimated Budget">
              <TextInput type="number" value={form.estimatedBudget || ""} onChange={(e) => setField("estimatedBudget", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 45000" />
            </Field>
            <Field label="Target Date">
              <TextInput type="date" value={form.targetDate} onChange={(e) => setField("targetDate", e.target.value)} />
            </Field>
            <Field label="Review Frequency">
              <Select value={form.reviewFrequency} onChange={(e) => setField("reviewFrequency", e.target.value)} options={REVIEW_FREQUENCIES} />
            </Field>
          </div>
          {computed && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-line bg-white/[0.02] p-3 text-center">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">Residual Target</span>
                <span className="block text-2xl font-mono font-bold text-neutral-100">{Math.max(1, Math.round(computed.inherentScore * (1 - targetCE)))}</span>
              </div>
              <div className="rounded-lg border border-line bg-white/[0.02] p-3 text-center">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">RAG Status</span>
                <span className={`chip mt-1 ${ragStatus === "Red" ? "border-red-800/60 bg-red-950/40 text-red-300" : ragStatus === "Amber" ? "border-amber-800/60 bg-amber-950/40 text-amber-300" : "border-emerald-800/60 bg-emerald-950/40 text-emerald-300"}`}>{ragStatus}</span>
              </div>
              <div className="rounded-lg border border-line bg-white/[0.02] p-3 text-center">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">Target CE</span>
                <span className="block text-2xl font-mono font-bold text-neutral-100">{Math.round(targetCE * 100)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Section 6 — Approval & Governance */}
        <div className="card space-y-4 p-6">
          <p className="label border-b border-line pb-2">6. Approval & Governance</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Acceptance Justification" hint={computed && computed.residualScore > (domainInfo?.param?.appetiteLimit || 25) ? "Required — residual exceeds appetite" : "Optional"} className="lg:col-span-2">
              <TextArea value={form.acceptanceJustification} onChange={(e) => setField("acceptanceJustification", e.target.value)} rows={3} />
            </Field>
            <Field label="Next Review Date" hint="ISO 27005 requires periodic review">
              <TextInput type="date" value={form.nextReviewDate} onChange={(e) => setField("nextReviewDate", e.target.value)} required />
            </Field>
            <Field label="Risk Owner Sign-Off" hint="Formal acceptance of the risk">
              <Select value={form.riskOwnerSignOff?.signedBy || ""} onChange={(e) => setField("riskOwnerSignOff", e.target.value ? { signedBy: e.target.value, signedAt: new Date().toISOString() } : null)} options={[{ value: "", label: "Select sign-off…" }, ...users.map((u) => ({ value: u._id, label: u.fullName || u.username }))]} />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={() => setForm({
            title: "", description: "", domain: form.domain, process: "", subProcess: "", riskCategory: "Cybersecurity",
            assetSystem: "", threat: "", vulnerability: "", riskOwnerId: "", ownerTeam: "", riskSource: "",
            dateIdentified: new Date().toISOString().slice(0, 10),
            likelihood: 3, impacts: {},
            treatmentDecision: "Modify", treatmentActions: "", estimatedBudget: null,
            plannedControls: [], treatmentOwnerId: "", targetDate: "", reviewFrequency: "Quarterly",
            acceptanceJustification: "", nextReviewDate: "", riskOwnerSignOff: null, attachments: [],
          })}>Reset</button>
          <button type="submit" className="btn-primary" disabled={saving || done}>
            {done ? <CheckCircle2 className="h-4 w-4" /> : null}
            {done ? "Submitted" : saving ? "Submitting…" : "Submit risk"}
          </button>
        </div>
      </form>
    </>
  );
}
