import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Layers, Loader2, Pencil, Plus, RefreshCw, RotateCcw, SlidersHorizontal, Trash2 } from "lucide-react";
import api, { resource } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { ErrorState } from "../../components/States";
import { Field, TextInput } from "../../components/Field";
import { chipClass } from "../../lib/format";
import { CRITERIA_CATALOG } from "../risk/constants";
import { RISK_SCORE_METHODS } from "../../lib/riskEngine";

const paramsApi = resource("parameters");
const domains = resource("domains");
const risks = resource("risks");

const WEIGHTS = [1, 2, 3, 4, 5];
const EMPTY_LEVEL = { label: "", numericWeight: 1, description: "", isDefault: false };

const EMPTY = {
  domain: "",
  name: "",
  thresholdsCritical: 16,
  thresholdsHigh: 10,
  thresholdsMedium: 5,
  appetiteLimit: 15,
  active: true,
  criteria: [
    { name: "Financial", weight: 0.2 }, { name: "Regulatory", weight: 0.2 }, { name: "Reputational", weight: 0.15 },
    { name: "Operational", weight: 0.15 }, { name: "Confidentiality", weight: 0.1 }, { name: "Integrity", weight: 0.1 },
    { name: "Availability", weight: 0.1 },
  ],
  customName: "",
  riskScoreMethod: "multiplicative",
  likelihoodWeight: 0.5,
  impactWeight: 0.5,
  matrix: Array.from({ length: 5 }, (_, l) => Array.from({ length: 5 }, (_, i) => (l + 1) * (i + 1))),
  residualCapReduction: 0.75,
  effectiveWeight: 0.75,
  partiallyEffectiveWeight: 0.5,
  ineffectiveWeight: 0.25,
  notAssessedWeight: 0,
};

const METHOD_LABELS = {
  multiplicative: "Multiplicative (L × I)",
  weighted_additive: "Weighted additive (×5)",
  matrix_lookup: "Matrix lookup (5×5)",
};

const LEGACY = [
  ["impactFinance", "Financial"],
  ["impactRegulatory", "Regulatory"],
  ["impactReputational", "Reputational"],
  ["impactSafety", "Safety"],
  ["impactOperational", "Operational"],
  ["impactC", "Confidentiality"],
  ["impactI", "Integrity"],
  ["impactA", "Availability"],
];

export default function Parameters() {
  const [rows, setRows] = useState([]);
  const [domainList, setDomainList] = useState([]);
  const [riskRows, setRiskRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [domainFilter, setDomainFilter] = useState("");

  const [scaleTarget, setScaleTarget] = useState(null); // parameter being scale-edited
  const [scaleForm, setScaleForm] = useState([]);
  const [scaleKey, setScaleKey] = useState("likelihoodScale");
  const [scaleError, setScaleError] = useState("");

  const [job, setJob] = useState(null); // active re-baseline job
  const [jobError, setJobError] = useState("");

  const [preview, setPreview] = useState(null); // impact preview of proposed scoring values
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [previewConfirmed, setPreviewConfirmed] = useState(false);

  const loadPreview = async () => {
    if (!editing || editing === "new" || !editing._id) return;
    setPreviewBusy(true);
    setPreviewError("");
    try {
      const params = {
        thresholds: JSON.stringify({ critical: Number(form.thresholdsCritical), high: Number(form.thresholdsHigh), medium: Number(form.thresholdsMedium) }),
        criteria: JSON.stringify(form.criteria.map((c) => ({ name: c.name, weight: Number(c.weight) || 0 }))),
        riskScoreMethod: form.riskScoreMethod,
        riskScoreWeights: JSON.stringify({ likelihood: Number(form.likelihoodWeight), impact: Number(form.impactWeight) }),
      };
      const res = await api.get(`/parameters/${editing._id}/preview`, { params });
      setPreview(res.data);
      setConfirmText("");
      setPreviewConfirmed(false);
    } catch (err) {
      setPreviewError(err?.response?.data?.message || err.message);
      setPreview(null);
    } finally {
      setPreviewBusy(false);
    }
  };

  const previewRequired = preview?.total_changes > 0;
  const previewPhrase = `I understand ${preview?.total_changes ?? 0} risk${(preview?.total_changes ?? 0) === 1 ? "" : "s"} will change severity`;

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([paramsApi.list(), domains.list(), risks.list({ pageSize: 200 })])
      .then(([p, d, r]) => {
        setRows(p.items);
        setDomainList(d.items);
        setRiskRows(r.items || []);
      })
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const domainName = useMemo(() => new Map(domainList.map((d) => [d._id, d])), [domainList]);

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.active).length;
    const riskCount = riskRows.filter((r) => r.parameter).length;
    return { total: rows.length, active, riskCount, domains: domainList.length };
  }, [rows, riskRows, domainList]);

  const pendingByParam = useMemo(() => {
    const map = {};
    for (const r of riskRows) {
      if (!r.pendingRebaseline) continue;
      const p = rows.find((x) => String(x.domain?._id || x.domain) === String(r.domain?._id || r.domain));
      if (p) map[p._id] = (map[p._id] || 0) + 1;
    }
    return map;
  }, [riskRows, rows]);

  const runRebaseline = async (p) => {
    setJobError("");
    try {
      const res = await api.post("/risks/rebaseline", { parameterId: p._id });
      setJob(res.data);
      pollJob(res.data._id);
    } catch (err) {
      setJobError(err?.response?.data?.message || err.message);
    }
  };

  const pollJob = async (id) => {
    try {
      const res = await api.get(`/risk-score-jobs/${id}`);
      setJob(res.data);
      if (res.data.status === "queued" || res.data.status === "running") {
        setTimeout(() => pollJob(id), 1200);
      } else {
        load();
      }
    } catch {
      /* stop polling on error; the banner shows the last known state */
    }
  };

  const openCreate = () => {
    setForm(EMPTY);
    setEditing("new");
    setPreview(null);
    setPreviewError("");
    setPreviewConfirmed(false);
    setConfirmText("");
  };

  const openEdit = (row) => {
    let criteria = (row.criteria || []).map((c) => ({ name: c.name, weight: Number(c.weight) || 0 }));
    if (!criteria.length && row.weights) {
      criteria = LEGACY.map(([key, name]) => ({ name, weight: Number(row.weights[key]) || 0 }));
    }
    const w = row.riskScoreWeights || { likelihood: 0.5, impact: 0.5 };
    const t = row.matrixLookupTable;
    setForm({
      domain: row.domain?._id || row.domain || "",
      name: row.name || "",
      thresholdsCritical: row.thresholds?.critical ?? 16,
      thresholdsHigh: row.thresholds?.high ?? 10,
      thresholdsMedium: row.thresholds?.medium ?? 5,
      appetiteLimit: row.appetiteLimit ?? 15,
      active: row.active !== false,
      criteria,
      customName: "",
      riskScoreMethod: row.riskScoreMethod || "multiplicative",
      likelihoodWeight: Number(w.likelihood) ?? 0.5,
      impactWeight: Number(w.impact) ?? 0.5,
      matrix: Array.isArray(t) && t.length === 5
        ? t.map((r2) => r2.map((c) => (c == null ? "" : c)))
        : Array.from({ length: 5 }, (_, l) => Array.from({ length: 5 }, (_, i) => (l + 1) * (i + 1))),
      residualCapReduction: row.residualCapReduction ?? 0.75,
      effectiveWeight: row.controlEffectivenessWeights?.Effective ?? 0.75,
      partiallyEffectiveWeight: row.controlEffectivenessWeights?.["Partially Effective"] ?? 0.5,
      ineffectiveWeight: row.controlEffectivenessWeights?.Ineffective ?? 0.25,
      notAssessedWeight: row.controlEffectivenessWeights?.["Not Assessed"] ?? 0,
    });
    setEditing(row);
    setPreview(null);
    setPreviewError("");
    setPreviewConfirmed(false);
    setConfirmText("");
  };

  const totalWeight = form.criteria.reduce((a, c) => a + (Number(c.weight) || 0), 0);
  const totalOk = Math.abs(totalWeight - 1) < 0.005;
  const weightSum = (Number(form.likelihoodWeight) || 0) + (Number(form.impactWeight) || 0);
  const weightOk = Math.abs(weightSum - 1) < 0.001;
  const matrixFilled =
    Array.isArray(form.matrix) &&
    form.matrix.length === 5 &&
    form.matrix.every((r2) => Array.isArray(r2) && r2.length === 5 && r2.every((c) => Number.isFinite(Number(c)) && Number(c) >= 1 && Number(c) <= 25));

  const save = async (e) => {
    e.preventDefault();
    if (previewRequired && !previewConfirmed) {
      alert("Run the impact preview and confirm the severity-band changes before saving (type-to-confirm).");
      return;
    }
    setSaving(true);
    try {
      if (!totalOk) {
        alert(`Criteria weights must sum to 1 (current total: ${totalWeight.toFixed(2)}).`);
        return;
      }
      if (form.riskScoreMethod === "weighted_additive" && !weightOk) {
        alert(`Weighted additive requires likelihood + impact weights to sum to 1 (current total: ${weightSum.toFixed(3)}).`);
        return;
      }
      if (form.riskScoreMethod === "matrix_lookup" && !matrixFilled) {
        alert("Matrix lookup requires all 25 cells filled with a number between 1 and 25.");
        return;
      }
      const payload = {
        domain: form.domain,
        name: form.name,
        thresholds: {
          critical: Number(form.thresholdsCritical),
          high: Number(form.thresholdsHigh),
          medium: Number(form.thresholdsMedium),
        },
        appetiteLimit: Number(form.appetiteLimit),
        active: form.active,
        criteria: form.criteria.map((c) => ({ name: c.name, weight: Number(c.weight) || 0 })),
        riskScoreMethod: form.riskScoreMethod,
        riskScoreWeights: { likelihood: Number(form.likelihoodWeight), impact: Number(form.impactWeight) },
        residualCapReduction: Number(form.residualCapReduction),
        controlEffectivenessWeights: {
          Effective: Number(form.effectiveWeight),
          "Partially Effective": Number(form.partiallyEffectiveWeight),
          Ineffective: Number(form.ineffectiveWeight),
          "Not Assessed": Number(form.notAssessedWeight),
        },
      };
      if (form.riskScoreMethod === "matrix_lookup") {
        payload.matrixLookupTable = form.matrix.map((r2) => r2.map((c) => Number(c)));
      }
      if (editing === "new") await paramsApi.create(payload);
      else await paramsApi.update(editing._id, payload);
      setEditing(null);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete parameter "${row.name}"? Risks already scored under it keep their stored scores.`)) return;
    try {
      await paramsApi.remove(row._id);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  const openScale = (row, key) => {
    setScaleForm((row[key] || []).map((l) => ({ ...l })));
    setScaleKey(key);
    setScaleError("");
    setScaleTarget(row);
  };

  const setLevel = (idx, patch) => setScaleForm((s) => s.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const addLevel = () => setScaleForm((s) => [...s, { ...EMPTY_LEVEL, numericWeight: s.length + 1 }]);
  const removeLevel = (idx) => setScaleForm((s) => s.filter((_, i) => i !== idx));

  const saveScale = async (e) => {
    e.preventDefault();
    const cleaned = scaleForm
      .map((l, i) => ({
        label: String(l.label || "").trim(),
        numericWeight: Number(l.numericWeight) || 1,
        description: String(l.description || "").trim(),
        isDefault: !!l.isDefault,
        sortOrder: i + 1,
      }))
      .filter((l) => l.label);
    const labels = cleaned.map((l) => l.label.toLowerCase());
    const weights = cleaned.map((l) => l.numericWeight);
    if (!cleaned.length) return setScaleError("Add at least one level.");
    if (new Set(labels).size !== labels.length) return setScaleError("Level labels must be unique.");
    if (new Set(weights).size !== weights.length) return setScaleError("Each level needs a distinct numeric weight (1–5).");
    setSaving(true);
    try {
      await paramsApi.update(scaleTarget._id, { [scaleKey]: cleaned });
      setScaleTarget(null);
      load();
    } catch (err) {
      setScaleError(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const visibleRows = domainFilter === "" ? rows : rows.filter((r) => String(r.domain?._id || r.domain) === domainFilter);

  return (
    <>
      <PageHeader
        title="Parameters"
        subtitle="A parameter is the risk-scoring configuration of a domain: impact criteria weights, severity thresholds, risk appetite and the ISO 31000 likelihood & impact scales. When a risk is submitted, you pick the domain first — then choose which of its parameters scores the risk."
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New parameter
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold"><Layers className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{stats.total}</p>
            <p className="text-xs text-neutral-500">Total parameters</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950/40 text-emerald-300"><Layers className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{stats.active}</p>
            <p className="text-xs text-neutral-500">Active</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-950/40 text-sky-300"><Layers className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{stats.riskCount}</p>
            <p className="text-xs text-neutral-500">Risks scored under a parameter</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-950/40 text-violet-300"><Layers className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{stats.domains}</p>
            <p className="text-xs text-neutral-500">Domains</p>
          </div>
        </div>
      </div>

      {jobError && (
        <p className="mb-4 rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-300">{jobError}</p>
      )}

      {job && (
        <div className="mb-4 rounded-lg border border-line bg-white/[0.02] p-4">
          <p className="label flex items-center gap-2">
            Re-baseline job
            {job.param?.name ? ` · ${job.param.name} v${job.param.methodVersion}` : ""}
            {job.status === "done" ? (
              <span className="chip border-emerald-800/60 bg-emerald-950/40 text-emerald-300">done</span>
            ) : (
              <span className="chip border-amber-800/60 bg-amber-950/40 text-amber-300">{job.status}</span>
            )}
          </p>
          {job.status !== "done" ? (
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full bg-gold-gradient transition-all" style={{ width: `${job.progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-neutral-400">
                Re-scoring risks against the updated parameter method… {job.processed}/{job.total}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-neutral-400">
              {job.total} risks re-scored to {job.param?.name} v{job.param?.methodVersion}. Scores changed are recorded in
              the Risk Score History; user-overridden residuals were kept.
            </p>
          )}
        </div>
      )}

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <DataTable
          toolbar={
            <>
              <select className="input w-56" value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
                <option value="" className="bg-ink-deep">All domains</option>
                {domainList.map((d) => (
                  <option key={d._id} value={d._id} className="bg-ink-deep">{d.name}</option>
                ))}
              </select>
              <button className="btn-ghost px-3 py-1.5" onClick={load} title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </button>
            </>
          }
          columns={[
            {
              key: "name",
              header: "Parameter",
              render: (r) => (
                <div>
                  <span className="font-medium text-neutral-100">{r.name}</span>
                  {r.active ? (
                    <span className="ml-2 text-[10px] text-emerald-400">active</span>
                  ) : (
                    <span className="ml-2 text-[10px] text-neutral-500">inactive</span>
                  )}
                </div>
              ),
            },
            {
              key: "domain",
              header: "Domain",
              render: (r) => {
                const d = domainName.get(String(r.domain?._id || r.domain));
                return (
                  <div>
                    <span className="text-neutral-200">{d?.name || "—"}</span>
                    <p className="text-[11px] text-neutral-600">{d?.scoringMethod === "advanced" ? "Advanced 70/30" : "Default max"}</p>
                  </div>
                );
              },
            },
            {
              key: "method",
              header: "Score method",
              render: (r) => {
                const pending = pendingByParam[r._id] || 0;
                return (
                  <div>
                    <span className="text-neutral-200">{METHOD_LABELS[r.riskScoreMethod || "multiplicative"]}</span>
                    <p className="font-mono text-[11px] text-neutral-500">
                      v{r.methodVersion ?? 1}
                      {pending ? ` · ${pending} pending re-baseline` : ""}
                    </p>
                  </div>
                );
              },
            },
            {
              key: "criteria",
              header: "Criteria (weights)",
              className: "max-w-xs",
              render: (r) => (
                <div className="flex flex-wrap gap-1">
                  {(r.criteria || []).map((c) => (
                    <span key={c.name} className="chip !py-0.5 text-[11px]">
                      {c.name} <span className="font-mono text-[10px] text-neutral-500">{Number(c.weight).toFixed(2)}</span>
                    </span>
                  ))}
                </div>
              ),
            },
            {
              key: "thresholds",
              header: "Thresholds",
              render: (r) => (
                <span className="whitespace-nowrap font-mono text-xs text-neutral-300">
                  C{r.thresholds?.critical} / H{r.thresholds?.high} / M{r.thresholds?.medium}
                </span>
              ),
            },
            {
              key: "appetiteLimit",
              header: "Appetite",
              render: (r) => <span className="font-mono text-sm text-gold">{r.appetiteLimit}</span>,
            },
            {
              key: "scales",
              header: "Scales",
              render: (r) => (
                <span className="font-mono text-xs text-neutral-400">
                  {(r.likelihoodScale || []).length} × {(r.impactScale || []).length}
                </span>
              ),
            },
            {
              key: "risks",
              header: "Risks",
              render: (r) => {
                const n = riskRows.filter((x) => String(x.parameter?._id || x.parameter || "") === String(r._id)).length;
                return <span className={`font-mono text-sm ${n ? "text-gold" : "text-neutral-600"}`}>{n}</span>;
              },
            },
            {
              key: "__rebase",
              header: "",
              sortable: false,
              className: "w-40 text-right",
              render: (r) => {
                const pending = pendingByParam[r._id] || 0;
                return pending > 0 ? (
                  <button
                    className="btn-ghost px-3 py-1.5"
                    onClick={() => runRebaseline(r)}
                    title={`Re-baseline ${pending} risks to ${METHOD_LABELS[r.riskScoreMethod || "multiplicative"]} v${r.methodVersion ?? 1}`}
                  >
                    <RotateCcw className="h-4 w-4" /> Re-baseline ({pending})
                  </button>
                ) : (
                  <span className="whitespace-nowrap text-xs text-neutral-600">Current</span>
                );
              },
            },
            {
              key: "__a",
              header: "",
              sortable: false,
              className: "w-28 text-right",
              render: (r) => (
                <div className="flex justify-end gap-1">
                  <button onClick={() => openScale(r, "likelihoodScale")} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-white/5 hover:text-gold" title="Edit scales (likelihood & impact)">
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                  <button onClick={() => openEdit(r)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-white/5 hover:text-gold" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(r)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-red-950/40 hover:text-red-300" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            },
          ]}
          rows={visibleRows}
          loading={loading}
          searchPlaceholder="Search parameters…"
          emptyHint="Create a parameter inside a domain — it becomes a scoring option for that domain's risks."
          emptyAction={
            <button className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New parameter
            </button>
          }
        />
      )}

      {/* Parameter editor */}
      <Modal
        open={Boolean(editing)}
        onClose={() => !saving && setEditing(null)}
        title={editing === "new" ? "New parameter" : "Edit parameter"}
        subtitle="A parameter belongs to a domain. Risks submitted under that domain can be scored by any of its parameters — pick it on the Submit Risk page."
        width="max-w-3xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="param-form" type="submit" disabled={saving || (previewRequired && !previewConfirmed)} title={previewRequired && !previewConfirmed ? "Confirm the severity-band impact preview first" : undefined}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <form id="param-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Domain" hint="Which domain this parameter belongs to" className="sm:col-span-2">
            <select className="input" value={form.domain} required onChange={(e) => setForm((s) => ({ ...s, domain: e.target.value }))}>
              <option value="">— Select domain —</option>
              {domainList.map((d) => (
                <option key={d._id} value={d._id} className="bg-ink-deep">{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Name">
            <TextInput value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required placeholder="e.g. Standard, Basel III, Strict" />
          </Field>

          <div className="sm:col-span-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="label">Impact criteria (weights must sum to 1)</p>
              <span className={`text-xs ${totalOk ? "text-emerald-400" : "text-red-400"}`}>
                Total: {totalWeight.toFixed(3)} {totalOk ? "✓" : "— must equal 1.000"}
              </span>
            </div>
            <div className="space-y-2 rounded-lg border border-line bg-white/[0.02] p-3">
              {form.criteria.length === 0 && <p className="text-xs text-neutral-600">No criteria yet — add at least one.</p>}
              {form.criteria.map((c, idx) => (
                <div key={`${c.name}-${idx}`} className="flex items-center gap-2">
                  <select
                    className="input flex-1"
                    value={c.name}
                    onChange={(e) => {
                      if (e.target.value === "__new__") return;
                      setForm((s) => ({ ...s, criteria: s.criteria.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)) }));
                    }}
                  >
                    {CRITERIA_CATALOG.includes(c.name) ? (
                      <option value={c.name} className="bg-ink-deep">{c.name}</option>
                    ) : (
                      <option value={c.name} className="bg-ink-deep">{c.name} (custom)</option>
                    )}
                    <option value="" disabled className="bg-ink-deep">— Choose existing —</option>
                    {CRITERIA_CATALOG
                      .filter((n) => !form.criteria.some((x) => x.name === n))
                      .map((n) => (
                        <option key={n} value={n} className="bg-ink-deep">{n}</option>
                      ))}
                    <option value="__new__" className="bg-ink-deep">+ Add new criterion…</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    className="input w-24 text-right font-mono"
                    value={c.weight}
                    onChange={(e) => setForm((s) => ({ ...s, criteria: s.criteria.map((x, i) => (i === idx ? { ...x, weight: e.target.value } : x)) }))}
                  />
                  <button type="button" onClick={() => setForm((s) => ({ ...s, criteria: s.criteria.filter((_, i) => i !== idx) }))} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-red-950/40 hover:text-red-300" title="Remove criterion">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2 border-t border-line pt-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="New criterion name, e.g. Data Privacy"
                  value={form.customName}
                  onChange={(e) => setForm((s) => ({ ...s, customName: e.target.value }))}
                />
                <button
                  type="button"
                  className="btn-ghost px-3 py-1.5"
                  onClick={() => {
                    const clean = String(form.customName || "").trim();
                    if (!clean || form.criteria.some((c) => c.name === clean)) return;
                    setForm((s) => ({ ...s, criteria: [...s.criteria, { name: clean, weight: 0 }], customName: "" }));
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              <p className="text-[11px] text-neutral-600">Tip: to split a weight, first add the criterion with weight 0, then adjust all weights so the total is 1.</p>
            </div>
          </div>

          <div className="sm:col-span-3 rounded-lg border border-line bg-white/[0.02] p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="label">Risk score method</p>
{editing && editing !== "new" && (
                <span className="font-mono text-[11px] text-neutral-400">
                  current v{editing.methodVersion ?? 1}
                  {pendingByParam[editing._id] ? ` · ${pendingByParam[editing._id]} risks pending` : ""}
                </span>
              )}
            </div>
            <select
              className="input w-full"
              value={form.riskScoreMethod}
              onChange={(e) => setForm((s) => ({ ...s, riskScoreMethod: e.target.value }))}
            >
              {RISK_SCORE_METHODS.map((m) => (
                <option key={m} value={m} className="bg-ink-deep">{METHOD_LABELS[m]}</option>
              ))}
            </select>
            {form.riskScoreMethod === "weighted_additive" && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Likelihood weight" hint={`Total ${weightSum.toFixed(3)} ${weightOk ? "✓" : "— must sum to 1.000"}`}>
                  <TextInput type="number" min={0} max={1} step={0.05} value={form.likelihoodWeight} onChange={(e) => setForm((s) => ({ ...s, likelihoodWeight: e.target.value }))} />
                </Field>
                <Field label="Impact weight">
                  <TextInput type="number" min={0} max={1} step={0.05} value={form.impactWeight} onChange={(e) => setForm((s) => ({ ...s, impactWeight: e.target.value }))} />
                </Field>
                <p className="col-span-2 text-[11px] text-neutral-600">
                  riskScore = (wL × likelihood + wI × impact) × 5, rounded and clamped to 1–25 — thresholds and appetite
                  stay on the same scale as multiplicative.
                </p>
              </div>
            )}
            {form.riskScoreMethod === "matrix_lookup" && (
              <div className="mt-3">
                <p className="mb-1.5 text-[11px] text-neutral-600">
                  5×5 lookup — rows are likelihood, columns are impact. Empty or non-numeric cells fall back to L × I
                  server-side, so scoring never silently fails.
                </p>
                <div className="grid w-fit grid-cols-[auto_repeat(5,44px)] gap-1">
                  <div />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="text-center text-[10px] text-neutral-500">I{i}</div>
                  ))}
                  {form.matrix.map((row, l) => (
                    <Fragment key={l}>
                      <div className="flex items-center text-[10px] text-neutral-500">L{l + 1}</div>
                      {row.map((cell, i) => (
                        <input
                          key={i}
                          type="number"
                          min={1}
                          max={25}
                          className="input h-8 w-11 px-1 text-center font-mono text-xs"
                          value={cell}
                          onChange={(e) =>
                            setForm((s) => ({
                              ...s,
                              matrix: s.matrix.map((r2, l2) =>
                                l2 === l ? r2.map((c, i2) => (i2 === i ? e.target.value : c)) : r2
                              ),
                            }))
                          }
                        />
                      ))}
                    </Fragment>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-neutral-500">
                  {matrixFilled ? "All 25 cells filled." : "Fill all 25 cells (1–25) to save this method."}
                </p>
              </div>
            )}
            {editing && editing !== "new" && (
              <p className="mt-2 border-t border-line pt-2 text-[11px] text-neutral-600">
                Changing the method, weights, matrix or thresholds bumps the parameter to a new method version — risks
                scored under the old version appear as “Pending re-baseline” until you run the re-baseline job.
              </p>
            )}
          </div>

          <div className="sm:col-span-3 rounded-lg border border-line bg-white/[0.02] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="label">Impact preview (severity-band change)</p>
              {editing && editing !== "new" ? (
                <button type="button" className="btn-ghost px-3 py-1.5" onClick={loadPreview} disabled={previewBusy}>
                  {previewBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Preview
                </button>
              ) : (
                <span className="text-[11px] text-neutral-600">Available when editing an existing parameter</span>
              )}
            </div>
            {previewError && <p className="mb-2 rounded-md border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs text-red-300">{previewError}</p>}
            {preview && (
              <div className="space-y-2">
                <p className={`text-xs ${preview.total_changes > 0 ? "text-amber-300" : "text-emerald-400"}`}>{preview.message}</p>
                {preview.would_change.length > 0 && (
                  <ul className="max-h-40 space-y-1 overflow-auto rounded-md border border-line bg-ink-deep/60 p-2">
                    {preview.would_change.map((it) => (
                      <li key={it.risk_id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-neutral-300">{it.riskId} — {it.title}</span>
                        <span className="shrink-0 font-mono text-neutral-400">{it.old_score} {it.old_level} → <span className={it.new_score > it.old_score ? "text-red-300" : "text-emerald-400"}>{it.new_score} {it.new_level}</span></span>
                      </li>
                    ))}
                  </ul>
                )}
                {previewRequired && (
                  <div className="flex items-center gap-2 rounded-md border border-amber-900/60 bg-amber-950/30 p-2.5">
                    <input
                      className="input flex-1"
                      value={confirmText}
                      onChange={(e) => { setConfirmText(e.target.value); setPreviewConfirmed(e.target.value.trim() === previewPhrase); }}
                      placeholder={`Type: ${previewPhrase}`}
                    />
                    <span className={`shrink-0 text-[11px] ${previewConfirmed ? "text-emerald-400" : "text-neutral-500"}`}>
                      {previewConfirmed ? "Confirmed" : "Required to save"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="sm:col-span-3 rounded-lg border border-line bg-white/[0.02] p-3">
            <p className="label mb-2">Residual calculation (control-driven)</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Field label="Cap reduction" hint="max CEF">
                <TextInput type="number" min={0} max={1} step={0.05} value={form.residualCapReduction} onChange={(e) => setForm((s) => ({ ...s, residualCapReduction: e.target.value }))} />
              </Field>
              <Field label="Effective" hint="weight">
                <TextInput type="number" min={0} max={1} step={0.05} value={form.effectiveWeight} onChange={(e) => setForm((s) => ({ ...s, effectiveWeight: e.target.value }))} />
              </Field>
              <Field label="Partially effective" hint="weight">
                <TextInput type="number" min={0} max={1} step={0.05} value={form.partiallyEffectiveWeight} onChange={(e) => setForm((s) => ({ ...s, partiallyEffectiveWeight: e.target.value }))} />
              </Field>
              <Field label="Ineffective" hint="weight">
                <TextInput type="number" min={0} max={1} step={0.05} value={form.ineffectiveWeight} onChange={(e) => setForm((s) => ({ ...s, ineffectiveWeight: e.target.value }))} />
              </Field>
              <Field label="Not assessed" hint="weight">
                <TextInput type="number" min={0} max={1} step={0.05} value={form.notAssessedWeight} onChange={(e) => setForm((s) => ({ ...s, notAssessedWeight: e.target.value }))} />
              </Field>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-neutral-600">
              CEF = 1 − Π(1 − wᵢ) across existing/mitigating links (proposed links are excluded), capped at the cap
              reduction. Suggested residual = inherent × (1 − CEF), never below 1. A residual that deviates more than 20%
              from the suggestion needs a written justification (ISO 27001 accepted-exposure record).
            </p>
          </div>

          <Field label="Critical ≥" hint="Score at/above = Critical">
            <TextInput type="number" min={1} max={25} value={form.thresholdsCritical} onChange={(e) => setForm((s) => ({ ...s, thresholdsCritical: e.target.value }))} />
          </Field>
          <Field label="High ≥" hint="Score at/above = High">
            <TextInput type="number" min={1} max={25} value={form.thresholdsHigh} onChange={(e) => setForm((s) => ({ ...s, thresholdsHigh: e.target.value }))} />
          </Field>
          <Field label="Medium ≥" hint="Below = Low">
            <TextInput type="number" min={1} max={25} value={form.thresholdsMedium} onChange={(e) => setForm((s) => ({ ...s, thresholdsMedium: e.target.value }))} />
          </Field>

          <Field label="Risk appetite limit" hint="Maximum acceptable residual score" className="sm:col-span-2">
            <TextInput type="number" min={1} max={25} value={form.appetiteLimit} onChange={(e) => setForm((s) => ({ ...s, appetiteLimit: e.target.value }))} />
          </Field>
          <Field label="Active" className="flex items-end">
            <label className="flex items-center gap-3 py-2">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))} className="h-4 w-4 accent-[#D4AF37]" />
              <span className="text-sm text-neutral-300">Active parameter</span>
            </label>
          </Field>
        </form>
      </Modal>

      {/* Scales editor */}
      <Modal
        open={Boolean(scaleTarget)}
        onClose={() => !saving && setScaleTarget(null)}
        title={`${scaleKey === "likelihoodScale" ? "Likelihood scale" : "Impact scale"} — ${scaleTarget?.name || ""}`}
        subtitle="ISO 31000 qualitative levels with criteria text — assessors pick the level whose description fits."
        width="max-w-2xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setScaleTarget(null)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="scale-form" type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving…" : "Save scale"}
            </button>
          </>
        }
      >
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setScaleKey("likelihoodScale")}
            className={`btn-ghost px-3 py-1.5 ${scaleKey === "likelihoodScale" ? "!text-gold" : ""}`}
          >
            Likelihood
          </button>
          <button
            type="button"
            onClick={() => setScaleKey("impactScale")}
            className={`btn-ghost px-3 py-1.5 ${scaleKey === "impactScale" ? "!text-gold" : ""}`}
          >
            Impact
          </button>
        </div>
        <form id="scale-form" onSubmit={saveScale} className="space-y-2">
          {scaleError && <p className="rounded-md border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs text-red-300">{scaleError}</p>}
          {scaleForm.length === 0 && <p className="text-xs text-neutral-600">No levels — add at least one.</p>}
          {scaleForm.map((l, idx) => (
            <div key={idx} className="flex items-start gap-2 rounded-lg border border-line bg-white/[0.02] p-2.5">
              <select
                className="input w-20 text-center font-mono"
                value={l.numericWeight}
                onChange={(e) => setLevel(idx, { numericWeight: Number(e.target.value) })}
                title="Numeric weight"
              >
                {WEIGHTS.map((w) => (
                  <option key={w} value={w} className="bg-ink-deep">{w}</option>
                ))}
              </select>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Level label, e.g. Rare"
                    value={l.label}
                    onChange={(e) => setLevel(idx, { label: e.target.value })}
                  />
                  <label className="flex shrink-0 items-center gap-1.5 text-[11px] text-neutral-400">
                    <input
                      type="checkbox"
                      checked={!!l.isDefault}
                      onChange={(e) => setLevel(idx, { isDefault: e.target.checked })}
                      className="h-3.5 w-3.5 accent-[#D4AF37]"
                    />
                    Default
                  </label>
                </div>
                <textarea
                  className="input w-full"
                  rows={2}
                  placeholder="Criteria description (what this level means, so assessors pick consistently)"
                  value={l.description}
                  onChange={(e) => setLevel(idx, { description: e.target.value })}
                />
              </div>
              <button
                type="button"
                onClick={() => removeLevel(idx)}
                className="rounded-md p-1.5 text-neutral-500 transition hover:bg-red-950/40 hover:text-red-300"
                title="Remove level"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" className="btn-ghost px-3 py-1.5" onClick={addLevel}>
            <Plus className="h-3.5 w-3.5" /> Add level
          </button>
        </form>
      </Modal>
    </>
  );
}
