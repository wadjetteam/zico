import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Grid2X2, Loader2, Pencil, ShieldCheck, Table2, Trash2 } from "lucide-react";
import api, { resource } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import ControlPicker from "../../components/ControlPicker";
import RiskAssessmentForm from "../../components/RiskAssessmentForm";
import { ErrorState, LoadingState } from "../../components/States";
import { Select } from "../../components/Field";
import { chipClass, fmtDate, SEVERITY_STYLES, titleCase } from "../../lib/format";
import { controlsToSelection, syncRiskLinks } from "../../lib/riskLinks";
import { formFromRisk } from "./RiskForm";
import ParameterPanel from "./ParameterPanel";
import { CATEGORIES, STATUSES } from "./constants";
import { calculateRiskAssessment, getDefaultImpacts, CONTROL_TYPES, DEFAULT_THRESHOLDS } from "../../lib/riskAssessment";

const risks = resource("risks");

function Heatmap({ rows, drill, onDrill }) {
  const [hover, setHover] = useState(null);
  const cells = useMemo(() => {
    const map = {};
    for (const r of rows) {
      const impact = r.impactScore ?? r.impact;
      const key = `${r.likelihood}-${impact}`;
      (map[key] ||= []).push(r);
    }
    return map;
  }, [rows]);

  const cellTone = (items) => {
    const levelRank = { Low: 0, Medium: 1, High: 2, Critical: 3 };
    const top = items.reduce((a, r) => Math.max(a, levelRank[r.inherentLevel] ?? 0), 0);
    if (top >= 3) return "bg-red-950/60 border-red-800/60";
    if (top === 2) return "bg-orange-950/50 border-orange-800/50";
    if (top === 1) return "bg-amber-950/40 border-amber-800/40";
    return "bg-emerald-950/30 border-emerald-800/40";
  };

  const levelCounts = ["Critical", "High", "Medium", "Low"].map((name) => ({
    name,
    value: rows.filter((r) => r.inherentLevel === name).length,
  }));

  const onEnter = (e, l, i, items) => {
    const cell = e.currentTarget.getBoundingClientRect();
    const scroll = e.currentTarget.closest(".heatmap-scroll")?.getBoundingClientRect();
    if (!scroll) return;
    setHover({ l, i, items, x: cell.left - scroll.left, y: cell.top - scroll.top });
  };

  return (
    <div className="card p-5">
      <div className="flex gap-3">
        <div className="flex flex-col justify-center">
          <span className="rotate-180 text-[10px] uppercase tracking-[0.2em] text-neutral-600 [writing-mode:vertical-rl]">
            Likelihood
          </span>
        </div>
        <div className="heatmap-scroll relative min-w-0 flex-1 overflow-x-auto">
          <div className="grid min-w-[560px] grid-cols-[auto_repeat(5,1fr)] gap-1.5">
            {[5, 4, 3, 2, 1].map((l) => (
              <div key={`row-${l}`} className="contents">
                <div className="flex items-center justify-end pr-2 text-xs text-neutral-600">{l}</div>
                {[1, 2, 3, 4, 5].map((i) => {
                  const items = cells[`${l}-${i}`] || [];
                  const isDrilled = drill && drill.l === l && drill.i === i;
                  return (
                    <div
                      key={`${l}-${i}`}
                      onMouseEnter={(e) => items.length && onEnter(e, l, i, items)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => items.length && onDrill?.(l, i)}
                      className={`relative min-h-[74px] rounded-lg border p-2 transition ${
                        items.length
                          ? `${cellTone(items)} cursor-pointer hover:ring-1 hover:ring-gold/60 ${
                              isDrilled ? "ring-2 ring-gold" : ""
                            }`
                          : "cursor-default border-dashed border-line bg-white/[0.01]"
                      }`}
                      title={items.map((r) => r.title).join("\n")}
                    >
                      <span className="text-[10px] text-neutral-500">{l * i}</span>
                      {items.length > 0 && (
                        <p className="heading mt-0.5 text-xl font-semibold text-neutral-100">{items.length}</p>
                      )}
                      {items.slice(0, 3).map((r) => (
                        <p key={r._id} className="mt-0.5 truncate font-mono text-[10px] leading-tight text-gold/90">
                          {r.riskId || r._id.slice(-6)}
                        </p>
                      ))}
                      {items.length > 3 && (
                        <p className="mt-0.5 text-[10px] text-neutral-500">+{items.length - 3} more…</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <div />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={`ci-${i}`} className="pt-1 text-center text-xs text-neutral-600">
                {i}
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-[10px] uppercase tracking-[0.2em] text-neutral-600">Impact</p>

          {hover && hover.items.length > 0 && (
            <div
              className="pointer-events-none absolute z-20 w-72 rounded-lg border border-line bg-ink-deep/95 p-3 shadow-xl shadow-black/50 backdrop-blur"
              style={{
                left: Math.min(hover.x + 12, 320),
                top: hover.y + 10,
              }}
            >
              <p className="mb-2 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-neutral-500">
                Cell L {hover.l} × I {hover.i}
                <span className="font-mono text-neutral-400">
                  {hover.items.length} risk{hover.items.length > 1 ? "s" : ""}
                </span>
              </p>
              <ul className="space-y-2">
                {hover.items.slice(0, 6).map((r) => (
                  <li key={r._id} className="text-xs">
                    <p className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-gold">{r.riskId || r._id.slice(-6)}</span>
                      <span className={`chip !py-0.5 ${chipClass(r.inherentLevel)}`}>{r.inherentLevel}</span>
                      <span className="ml-auto truncate text-neutral-500">{r.status}</span>
                    </p>
                    <p className="mt-1 line-clamp-2 leading-snug text-neutral-300">{r.title}</p>
                    <p className="mt-1 font-mono text-[10px] text-neutral-500">
                      residual {r.residualScore} · suggested {r.suggestedResidual ?? "—"} ·{" "}
                      {(r.linkedControls || []).length} control{(r.linkedControls || []).length === 1 ? "" : "s"}
                    </p>
                  </li>
                ))}
              </ul>
              {hover.items.length > 6 && (
                <p className="mt-2 text-[10px] text-neutral-500">+{hover.items.length - 6} more…</p>
              )}
              <p className="mt-2 border-t border-line pt-1.5 text-[10px] text-gold/80">Click cell to drill into these risks</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-3">
        {[
          { name: "Critical", dot: "bg-red-500" },
          { name: "High", dot: "bg-orange-500" },
          { name: "Medium", dot: "bg-amber-500" },
          { name: "Low", dot: "bg-emerald-500" },
        ].map((lv) => {
          const c = levelCounts.find((x) => x.name === lv.name)?.value || 0;
          return (
            <span key={lv.name} className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <span className={`h-2.5 w-2.5 rounded-sm ${lv.dot}`} />
              {lv.name} <span className="font-mono text-neutral-300">{c}</span>
            </span>
          );
        })}
        <span className="ml-auto text-[11px] text-neutral-600">
          Cell color = highest inherent level inside · dashed cells = no risks · click a filled cell to drill into it
        </span>
      </div>
    </div>
  );
}

function Clamp({ text, max = 220 }) {
  const t = String(text || "");
  const truncated = t.length > max ? `${t.slice(0, max)}…` : t;
  return (
    <span className="line-clamp-2 max-w-[280px] text-xs text-neutral-500" title={t}>
      {truncated}
    </span>
  );
}

const narrow = "px-2 text-center";

const AUTHORITY_LEVEL = { risk_owner: 1, ciso: 2, cro: 2, board: 3 };

export default function ViewRisks() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("table");
  const [drill, setDrill] = useState(null); // {l, i} drilled from the heatmap
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [domain, setDomain] = useState(searchParams.get("domain") || "");
  const [severity, setSeverity] = useState(searchParams.get("severity") || "");
  const [hasControls, setHasControls] = useState(searchParams.get("hasControls") || "");
  const [methodVersion, setMethodVersion] = useState(searchParams.get("methodVersion") || "");
  const [reassessment, setReassessment] = useState(searchParams.get("reassessment") || "");
  const [changeTrigger, setChangeTrigger] = useState(searchParams.get("changeTrigger") || "");
  const [treatment, setTreatment] = useState(searchParams.get("treatment") || "");
  const [domainOptions, setDomainOptions] = useState([]);

  const setFilter = (key, setter) => (e) => {
    const value = e.target.value;
    setter(value);
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [links, setLinks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(null);
  const [activeParams, setActiveParams] = useState({});
  const [paramsById, setParamsById] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    risks
      .list({
        status: status || undefined,
        category: category || undefined,
        domain: domain || undefined,
        severityLevel: severity ? titleCase(severity) : undefined,
        hasControls: hasControls || undefined,
        methodVersion: methodVersion || undefined,
        reassessment: reassessment || undefined,
        changeTrigger: changeTrigger || undefined,
        treatment: treatment || undefined,
      })
      .then((d) => setRows(d.items))
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [status, category, domain, severity, hasControls, methodVersion, reassessment, changeTrigger, treatment]);

  useEffect(load, [load]);

  useEffect(() => {
    resource("domains")
      .list()
      .then((d) => setDomainOptions(d.items))
      .catch(() => {});
    resource("parameters")
      .list()
      .then((d) => {
        const byDomain = {};
        const byId = {};
        for (const p of d.items) {
          byId[p._id] = p;
          if (p.active) byDomain[String(p.domain?._id || p.domain)] = p;
        }
        setParamsById(byId);
        setActiveParams(byDomain);
      })
      .catch(() => {});
  }, []);

  const paramFor = (r) =>
    (r?.parameter?._id && paramsById[r.parameter._id]) || activeParams[String(r?.domain?._id)];

  const openEdit = (r) => {
    setEditing(r);
    setForm(formFromRisk(r));
    setLinks(controlsToSelection(r.linkedControls));
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    const editParam = paramFor(editing);
    const impact = impactFor(form, editing?.domain?.scoringMethod, editParam?.criteria);
    const riskScore = riskScoreFor({ likelihood: form.likelihood, impact, param: editParam });
    const axes = residualAxesFor({
      likelihood: form.likelihood,
      impact,
      links,
      controlOf: (id) => {
        const link = links.find((l) => l.control?._id === id || l.control_id === id);
        return link?.control || null;
      },
      cfg: {
        weights: editParam?.controlEffectivenessWeights,
        capReduction: editParam?.residualCapReduction,
      },
    });
    const suggested = axes.score;
    const hasUserResidual = form.residualScore !== "" && form.residualScore != null;
    if (
      hasUserResidual &&
      requiresJustification(Number(form.residualScore), suggested) &&
      (form.residualJustification || "").trim().length < JUSTIFICATION_MIN_LENGTH
    ) {
      alert(`Residual (${Number(form.residualScore)}) deviates >20% from the control-driven suggestion (${suggested}). Add a residual justification of at least ${JUSTIFICATION_MIN_LENGTH} characters to confirm the accepted exposure under ISO 27001.`);
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.asset === "") delete payload.asset;
      delete payload.severityLevel;
      delete payload.overallRisk;
      delete payload.inherentLevel;
      payload.residualJustification = (form.residualJustification || "").trim() || null;
      if (!hasUserResidual) payload.residualScore = suggested;
      await risks.update(editing._id, payload);
      await syncRiskLinks(editing._id, links);
      setEditing(null);
      load();
    } catch (err) {
      const data = err?.response?.data;
      if (err?.response?.status === 422 && data?.suggestedAction === "pending_acceptance") {
        if (
          window.confirm(
            `${data.message}\n\nSave as pending acceptance instead? The risk will be routed to ${data.requiredApproverName || "the required approver"} for formal sign-off.`
          )
        ) {
          try {
            await risks.update(editing._id, { ...payload, treatment: "pending_acceptance" });
            await syncRiskLinks(editing._id, links);
            setEditing(null);
            load();
          } catch (err2) {
            alert(err2?.response?.data?.message || err2.message);
          }
        } else {
          alert(data.message);
        }
      } else {
        alert(data?.message || err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const approveOverride = async (r) => {
    setBusy(r._id);
    try {
      await api.put(`/risks/${r._id}/approve-override`);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setBusy(null);
    }
  };

  const [overrideTarget, setOverrideTarget] = useState(null);
  const [overrideScore, setOverrideScore] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideBusy, setOverrideBusy] = useState(false);

  const openOverride = (r) => {
    setOverrideTarget(r);
    setOverrideScore(String(r.residualScore ?? ""));
    setOverrideReason("");
  };

  const submitOverride = async () => {
    const score = Number(overrideScore);
    if (!Number.isInteger(score) || score < 1 || score > 25) {
      alert("Manual residual score must be an integer between 1 and 25.");
      return;
    }
    if (overrideReason.trim().length < 30) {
      alert("Provide a written justification of at least 30 characters — this becomes the ISO 27005 accepted-exposure record.");
      return;
    }
    setOverrideBusy(true);
    try {
      await api.post(`/risks/${overrideTarget._id}/override-residual`, {
        manual_residual_score: score,
        justification: overrideReason.trim(),
      });
      setOverrideTarget(null);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setOverrideBusy(false);
    }
  };

  const resetResidual = async () => {
    setOverrideBusy(true);
    try {
      await api.post(`/risks/${overrideTarget._id}/reset-residual`);
      setOverrideTarget(null);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setOverrideBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(deleting._id);
    try {
      await risks.remove(deleting._id);
      setDeleting(null);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setBusy(null);
    }
  };

  const impactNames = useMemo(() => {
    const names = new Set();
    for (const r of rows) for (const i of r.impacts || []) names.add(i.name);
    return [...names];
  }, [rows]);

  const displayRows = useMemo(() => {
    if (!drill) return rows;
    return rows.filter((r) => r.likelihood === drill.l && (r.impactScore ?? r.impact) === drill.i);
  }, [rows, drill]);

  const impactCol = (name) => ({
    key: `impact-${name}`,
    header: name,
    className: narrow,
    render: (r) => {
      const v = (r.impacts || []).find((i) => i.name === name)?.value;
      return v != null ? <span className="font-mono text-xs text-neutral-300">{v}</span> : <span className="text-neutral-700">—</span>;
    },
  });

  const columns = [
    {
      key: "riskId",
      header: "Risk ID",
      render: (r) => (
        <Link to="/risk/scoring" className="whitespace-nowrap font-medium text-gold hover:underline">
          {r.riskId || r._id.slice(-6)}
        </Link>
      ),
    },
    { key: "process", header: "Process", render: (r) => <span className="whitespace-nowrap">{r.process || "—"}</span> },
    {
      key: "domain",
      header: "Domain",
      render: (r) => (
        <span className="whitespace-nowrap text-neutral-300" title={r.domain?.scoringMethod === "advanced" ? "Advanced · Blended 70/30" : "Default · Plain max"}>
          {r.domain?.name || "—"}
        </span>
      ),
    },
    {
      key: "parameter",
      header: "Parameter",
      render: (r) => (
        <span className="whitespace-nowrap text-neutral-300" title="The parameter that scored this risk (criteria weights, thresholds, appetite)">
          {r.parameter?.name || "—"}
        </span>
      ),
    },
    { key: "subProcess", header: "Sub-Process", render: (r) => <span className="whitespace-nowrap">{r.subProcess || "—"}</span> },
    { key: "assetSystem", header: "Asset / System", render: (r) => <span className="whitespace-nowrap">{r.assetSystem || "—"}</span> },
    { key: "ownerTeam", header: "Owner Team", render: (r) => <span className="whitespace-nowrap">{r.ownerTeam || "—"}</span> },
    { key: "category", header: "Risk Category", render: (r) => <span className="whitespace-nowrap">{r.category || r.riskCategory || "—"}</span> },
    { key: "threat", header: "Threat", render: (r) => <Clamp text={r.threat} /> },
    { key: "vulnerability", header: "Vulnerability", render: (r) => <Clamp text={r.vulnerability} /> },
    {
      key: "severityLevel",
      header: "Severity",
      render: (r) => (
        <span className={`chip whitespace-nowrap ${r.severityLevel ? chipClass(r.severityLevel) : "border-neutral-700 bg-neutral-900 text-neutral-400"}`}>
          {r.severityLevel || "—"}
        </span>
      ),
    },
    {
      key: "title",
      header: "Risk Title",
      render: (r) => (
        <Link to="/risk/scoring" className="whitespace-nowrap font-medium text-neutral-100 hover:text-gold">
          {r.title}
        </Link>
      ),
    },
    { key: "description", header: "Risk Description", render: (r) => <Clamp text={r.description} /> },
    { key: "riskDate", header: "Risk Date", render: (r) => <span className="whitespace-nowrap">{fmtDate(r.riskDate)}</span> },
    { key: "likelihood", header: "Likelihood", className: narrow },
    ...impactNames.map(impactCol),
    { key: "inherentScore", header: "Risk Score", className: narrow, render: (r) => <span className="whitespace-nowrap">{r.inherentScore ?? r.riskScore ?? "—"}</span> },
    { key: "inherentLevel", header: "Inherent Level", render: (r) => r.inherentLevel || "—" },
    { key: "escalationPath", header: "Escalation Path", render: (r) => r.escalationPath ? <span className="text-xs text-gold">{r.escalationPath}</span> : "—" },
    { key: "existingControls", header: "Existing Controls", render: (r) => <Clamp text={r.existingControls} /> },
    {
      key: "linkedControls",
      header: "Linked Controls",
      render: (r) => {
        const lc = r.linkedControls || [];
        if (lc.length === 0) return <span className="whitespace-nowrap text-xs text-neutral-600">—</span>;
        return (
          <div className="flex max-w-[220px] flex-wrap gap-1">
            {lc.map((l) => {
              const hasTested = l.testedEffectiveness != null && String(l.testedEffectiveness).trim() !== "";
              return (
                <Link
                  key={l._id}
                  to={`/controls/${l.control?._id}`}
                  className={`group inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] transition hover:border-gold/50 hover:bg-gold/10 ${hasTested ? "border-sky-800/60 bg-sky-950/40" : "border-line bg-ink-deep/60"}`}
                  title={`${l.control?.name} · ${l.control?.framework?.name || ""} · ${l.effectiveness}${hasTested ? ` · Tested ${l.testedEffectiveness}%` : ""}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      l.effectiveness === "Effective"
                        ? "bg-emerald-400"
                        : l.effectiveness === "Partially Effective"
                        ? "bg-amber-400"
                        : l.effectiveness === "Ineffective"
                        ? "bg-red-400"
                        : "bg-neutral-500"
                    }`}
                  />
                  <span className={`font-mono font-semibold ${hasTested ? "text-sky-300" : "text-gold"} group-hover:underline`}>
                    {l.control?.annexCode || l.control?.controlId}
                  </span>
                  {hasTested && <span className="text-[9px] text-sky-400">{l.testedEffectiveness}%</span>}
                </Link>
              );
            })}
          </div>
        );
      },
    },
    {
      key: "linkedExceptions",
      header: "Linked Exceptions",
      render: (r) => {
        const lx = r.linkedExceptions || [];
        if (lx.length === 0) return <span className="whitespace-nowrap text-xs text-neutral-600">—</span>;
        return (
          <div className="flex max-w-[220px] flex-wrap gap-1">
            {lx.map((x) => (
              <span
                key={x.exceptionId}
                className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] ${
                  x.status === "Approved" ? "border-emerald-800/60 bg-emerald-950/40 text-emerald-300" : x.status === "Rejected" ? "border-red-800/60 bg-red-950/40 text-red-300" : "border-amber-800/60 bg-amber-950/40 text-amber-300"
                }`}
                title={`${x.policy.policyId} — ${x.policy.title} · ${x.status} · ${x.riskBindingStatus}`}
              >
                <span className="font-mono font-semibold">{x.policy.policyId}</span>
                <span className="text-[10px] opacity-70">{x.status}</span>
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: "residualScore",
      header: "Residual Score",
      render: (r) => (
        <span
          className={`chip whitespace-nowrap ${SEVERITY_STYLES[String(r.overallRisk || "low").toLowerCase()]}`}
          title={r.residualOverride ? `Manual override from calculated ${r.calculatedResidualScore}` : `Calculated from residual likelihood ${r.residualLikelihood ?? "?"} × impact ${r.residualImpact ?? "?"}`}
        >
          {r.residualScore} · {r.overallRisk || "—"}
          {r.residualOverride ? " (manual)" : ""}
        </span>
      ),
    },
    {
      key: "exceedsAppetite",
      header: "Appetite",
      render: (r) =>
        r.exceedsAppetite ? (
          <span
            className="chip whitespace-nowrap border-amber-800/60 bg-amber-950/40 text-amber-300"
            title={`Residual ${r.residualScore} exceeds the domain appetite limit ${r.appetiteLimit}`}
          >
            Exceeds{r.appetiteLimit ? ` > ${r.appetiteLimit}` : ""}
          </span>
        ) : (
          <span className="whitespace-nowrap text-xs text-emerald-400/80">Within</span>
        ),
    },
    { key: "overallRisk", header: "Overall Risk", render: (r) => r.overallRisk || "—" },
    {
      key: "baseline",
      header: "Baseline",
      render: (r) =>
        r.pendingRebaseline ? (
          <span className="chip whitespace-nowrap border-amber-800/60 bg-amber-950/40 text-amber-300" title={`Parameter method version moved — re-baseline this risk's score to ${r.parameter?.name || "its parameter"} v${r.parameter?.methodVersion ?? "?"}`}>
            Re-baseline needed
          </span>
        ) : (
          <span className="whitespace-nowrap text-xs text-neutral-600">Current</span>
        ),
    },
    { key: "treatment", header: "Treatment", render: (r) => {
      const pending = r.treatment === "pending_acceptance";
      return (
        <span className={`chip whitespace-nowrap ${pending ? "border-violet-800/60 bg-violet-950/40 text-violet-300" : chipClass(r.treatment)}`}>
          {pending ? "Pending acceptance" : r.treatment || "—"}
        </span>
      );
    } },
    {
      key: "acceptance",
      header: "Acceptance",
      render: (r) =>
        r.treatment === "Accept" ? (
          <span className="whitespace-nowrap text-xs text-neutral-300" title={r.acceptedAt ? `Signed off ${fmtDate(r.acceptedAt)}` : ""}>
            {r.acceptedByName || r.acceptedBy || "Signed off"}
          </span>
        ) : (
          <span className="whitespace-nowrap text-xs text-neutral-600">—</span>
        ),
    },
    {
      key: "review",
      header: "Review",
      render: (r) => {
        const pending2nd = r.requiresSecondApproval && !r.secondApprovedBy;
        const canApprove = pending2nd && AUTHORITY_LEVEL[user?.role] >= 1 && user?.username && user.username !== r.overriddenBy;
        return (
          <div className="flex flex-col items-start gap-1">
            {r.changeTriggerPending && (
              <span
                className="chip whitespace-nowrap border-sky-800/60 bg-sky-950/40 text-sky-300"
                title={r.changeTriggerReason || "Linked control effectiveness changed — re-assess this risk"}
              >
                Change review
              </span>
            )}
            {pending2nd && (
              <span className="chip whitespace-nowrap border-violet-800/60 bg-violet-950/40 text-violet-300" title={`Large residual override by ${r.overriddenBy} — needs an independent second approval`}>
                Pending 2nd approval
              </span>
            )}
            {canApprove && (
              <button
                onClick={() => approveOverride(r)}
                disabled={busy === r._id}
                className="chip whitespace-nowrap border-emerald-800/60 bg-emerald-950/40 text-emerald-300 transition hover:bg-emerald-900/40"
                title="Approve this override as an independent reviewer"
              >
                {busy === r._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                Approve override
              </button>
            )}
            {!r.changeTriggerPending && !pending2nd && (
              <span className="whitespace-nowrap text-xs text-neutral-600">—</span>
            )}
          </div>
        );
      },
    },
    {
      key: "reassessment",
      header: "Next Reassessment",
      render: (r) =>
        r.overdueReassessment ? (
          <span className="chip whitespace-nowrap border-red-800/60 bg-red-950/40 text-red-300" title={r.nextReassessmentDue ? `Due ${fmtDate(r.nextReassessmentDue)}` : "No assessment on record"}>
            Overdue
          </span>
        ) : r.nextReassessmentDue ? (
          <span className="whitespace-nowrap text-xs text-neutral-300">{fmtDate(r.nextReassessmentDue)}</span>
        ) : (
          <span className="whitespace-nowrap text-xs text-neutral-600">—</span>
        ),
    },
    {
      key: "treatmentOwner",
      header: "Treatment Owner",
      render: (r) =>
        r.treatmentOwner ? (
          <span className="whitespace-nowrap" title={r.treatmentDueDate ? `Due ${fmtDate(r.treatmentDueDate)}` : "No due date"}>
            {r.treatmentOwner}
            {r.treatmentDueDate ? ` · ${fmtDate(r.treatmentDueDate)}` : ""}
          </span>
        ) : (
          <span className="whitespace-nowrap text-neutral-600">—</span>
        ),
    },
    {
      key: "treatmentEffectiveness",
      header: "Effectiveness",
      render: (r) => (
        <span
          className={`chip whitespace-nowrap ${
            r.treatmentEffectiveness === "Effective"
              ? "border-emerald-800/60 bg-emerald-950/40 text-emerald-300"
              : r.treatmentEffectiveness === "Partially Effective"
              ? "border-amber-800/60 bg-amber-950/40 text-amber-300"
              : r.treatmentEffectiveness === "Ineffective"
              ? "border-red-800/60 bg-red-950/40 text-red-300"
              : "border-neutral-700 bg-neutral-900 text-neutral-400"
          }`}
        >
          {r.treatmentEffectiveness || "Not Assessed"}
        </span>
      ),
    },
    { key: "status", header: "Status", render: (r) => <span className={chipClass(r.status)}>{titleCase(r.status)}</span> },
    { key: "mitigationActions", header: "Mitigation Actions", render: (r) => <Clamp text={r.mitigationActions} /> },
    { key: "deadline", header: "Deadline", render: (r) => <span className="whitespace-nowrap">{fmtDate(r.deadline)}</span> },
    { key: "owner", header: "Owner", render: (r) => <span className="whitespace-nowrap">{r.owner || "—"}</span> },
    {
      key: "_actions",
      header: "Actions",
      sortable: false,
      render: (r) => (
        <div className="flex items-center gap-1 whitespace-nowrap">
          <button
            onClick={() => openEdit(r)}
            className="rounded-md p-1.5 text-neutral-500 transition hover:bg-white/5 hover:text-gold"
            title="Edit risk"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => openOverride(r)}
            className="rounded-md p-1.5 text-neutral-500 transition hover:bg-sky-950/40 hover:text-sky-300"
            title="Override residual (governed manual score)"
          >
            <ShieldCheck className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleting(r)}
            className="rounded-md p-1.5 text-neutral-500 transition hover:bg-red-950/60 hover:text-red-300"
            title="Delete risk"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <PageHeader
        title="View Risks"
        subtitle="The enterprise risk register loaded from the risk assessment sheet — same columns, full edit and delete."
        actions={
          <div className="flex rounded-lg border border-line p-1">
            <button
              onClick={() => setView("table")}
              className={`btn px-3 py-1.5 ${view === "table" ? "bg-gold-gradient text-black" : "text-neutral-400"}`}
            >
              <Table2 className="h-4 w-4" /> Table
            </button>
            <button
              onClick={() => setView("heatmap")}
              className={`btn px-3 py-1.5 ${view === "heatmap" ? "bg-gold-gradient text-black" : "text-neutral-400"}`}
            >
              <Grid2X2 className="h-4 w-4" /> Heat map
            </button>
          </div>
        }
      />

      {loading ? (
        <LoadingState label="Loading risk register…" />
      ) : view === "heatmap" ? (
        <Heatmap
          rows={rows.filter((r) => r.status !== "Closed")}
          drill={drill}
          onDrill={(l, i) => {
            setDrill({ l, i });
            setView("table");
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={displayRows}
          searchPlaceholder="Search risks…"
          emptyHint={drill ? "No risks at this likelihood × impact combination." : "Submit a risk to populate the register."}
          toolbar={
            <>
              {drill && (
                <span className="chip border-gold/40 bg-gold/10 px-2.5 py-1.5 text-gold">
                  Drilling: L {drill.l} × I {drill.i}
                  <button onClick={() => setDrill(null)} className="ml-1.5 text-neutral-300 transition hover:text-red-300" title="Clear drill">
                    ×
                  </button>
                </span>
              )}
              <Select
                value={domain}
                onChange={setFilter("domain", setDomain)}
                options={[{ value: "", label: "All domains" }, ...domainOptions.map((d) => ({ value: d._id, label: d.name }))]}
              />
              <Select
                value={status}
                onChange={setFilter("status", setStatus)}
                options={[{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: titleCase(s) }))]}
              />
              <Select
                value={category}
                onChange={setFilter("category", setCategory)}
                options={[{ value: "", label: "All categories" }, ...CATEGORIES.map((c) => ({ value: c, label: titleCase(c) }))]}
              />
              <Select
                value={severity}
                onChange={setFilter("severity", setSeverity)}
                options={[{ value: "", label: "All severities" }, ...["low", "medium", "high", "critical"].map((s) => ({ value: s, label: titleCase(s) }))]}
              />
              <Select
                value={hasControls}
                onChange={setFilter("hasControls", setHasControls)}
                options={[
                  { value: "", label: "All coverage" },
                  { value: "false", label: "No linked controls" },
                ]}
              />
              <Select
                value={methodVersion}
                onChange={setFilter("methodVersion", setMethodVersion)}
                options={[
                  { value: "", label: "All baselines" },
                  { value: "stale", label: "Pending re-baseline" },
                ]}
              />
              <Select
                value={reassessment}
                onChange={setFilter("reassessment", setReassessment)}
                options={[
                  { value: "", label: "All reassessments" },
                  { value: "overdue", label: "Overdue reassessment" },
                ]}
              />
              <Select
                value={changeTrigger}
                onChange={setFilter("changeTrigger", setChangeTrigger)}
                options={[
                  { value: "", label: "All review flags" },
                  { value: "pending", label: "Change review pending" },
                ]}
              />
              <Select
                value={treatment}
                onChange={setFilter("treatment", setTreatment)}
                options={[
                  { value: "", label: "All treatments" },
                  { value: "pending_acceptance", label: "Pending acceptance" },
                  { value: "Accept", label: "Accept" },
                ]}
              />
            </>
          }
        />
      )}

      <Modal
        open={!!editing}
        onClose={() => !saving && setEditing(null)}
        title={`Edit risk ${form?.riskId ? `(${form.riskId})` : ""}`}
        subtitle={form?.title}
        width="max-w-4xl"
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={saveEdit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </>
        }
      >
        {form && (
          <>
            <ParameterPanel
              className="mb-4"
              domainName={editing?.domain?.name}
              method={editing?.domain?.scoringMethod}
              param={paramFor(editing)}
            />
            <p className="mb-4 -mt-2 text-[11px] text-neutral-600">
              The domain is fixed after submission — it cannot be changed when editing a risk.
            </p>
            <RiskAssessmentForm
              form={form}
              onChange={(k, v) => setForm((s) => ({ ...s, [k]: v }))}
              domainParam={paramFor(editing)}
              domainName={editing?.domain?.name}
              impactMethod={editing?.domain?.scoringMethod === 'advanced' ? 'advanced' : 'weighted'}
              linkedControls={links}
              onControlCEChange={(controlId, field, value) => {
                setLinks(prev => prev.map(l => {
                  if (l.control_id === controlId || l._id === controlId) {
                    return { ...l, [field]: value };
                  }
                  return l;
                }));
              }}
              readOnly={false}
              showControlsSection={false}
            />
            <div className="mt-4 rounded-lg border border-line bg-white/[0.02] p-4">
              <ControlPicker value={links} onChange={setLinks} />
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={!!overrideTarget}
        onClose={() => !overrideBusy && setOverrideTarget(null)}
        title={`Governed residual override — ${overrideTarget?.riskId || ""}`}
        subtitle={overrideTarget?.title}
        width="max-w-2xl"
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={() => setOverrideTarget(null)} disabled={overrideBusy}>
              Cancel
            </button>
            {overrideTarget?.residualOverride && (
              <button type="button" className="btn-ghost" onClick={resetResidual} disabled={overrideBusy}>
                {overrideBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Reset to calculated
              </button>
            )}
            <button type="button" className="btn-primary" onClick={submitOverride} disabled={overrideBusy}>
              {overrideBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {overrideBusy ? "Applying…" : "Apply override"}
            </button>
          </>
        }
      >
        {overrideTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="card p-3">
                <p className="text-[10px] uppercase tracking-wider text-neutral-500">Inherent</p>
                <p className="heading mt-1 text-xl text-neutral-100">{overrideTarget.riskScore}</p>
                <span className="chip mt-1">{overrideTarget.inherentLevel}</span>
              </div>
              <div className="card p-3">
                <p className="text-[10px] uppercase tracking-wider text-neutral-500">Residual likelihood</p>
                <p className="heading mt-1 text-xl text-neutral-100">{overrideTarget.residualLikelihood ?? "—"}</p>
                <p className="mt-1 text-[11px] text-neutral-500">after preventive controls</p>
              </div>
              <div className="card p-3">
                <p className="text-[10px] uppercase tracking-wider text-neutral-500">Residual impact</p>
                <p className="heading mt-1 text-xl text-neutral-100">{overrideTarget.residualImpact ?? "—"}</p>
                <p className="mt-1 text-[11px] text-neutral-500">after detective/corrective controls</p>
              </div>
              <div className="card border-sky-900/50 bg-sky-950/20 p-3">
                <p className="text-[10px] uppercase tracking-wider text-sky-300">Calculated residual</p>
                <p className="heading mt-1 text-xl text-sky-200">{overrideTarget.calculatedResidualScore ?? "—"} <span className="text-xs font-normal text-sky-400">[Auto]</span></p>
                <p className="mt-1 text-[11px] text-sky-400/70">ISO 27005 engine · L×I</p>
              </div>
            </div>

            {overrideTarget.linkedControls?.length > 0 && (
              <div>
                <p className="label mb-1.5">Linked controls (effectiveness drives the calculation)</p>
                <ul className="space-y-1">
                  {overrideTarget.linkedControls.map((l) => (
                    <li key={l._id} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-white/[0.02] px-3 py-1.5 text-sm">
                      <span className="truncate text-neutral-300">
                        {l.control?.controlId || l.control_id} — {l.control?.name || "Control"}
                        <span className="ml-2 text-[10px] text-neutral-500">({l.control?.controlType || "type?"} · {l.link_type})</span>
                      </span>
                      <span className="chip shrink-0">{l.effectiveness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {overrideTarget.residualOverride && (
              <p className="rounded-md border border-sky-900/60 bg-sky-950/30 px-3 py-2 text-xs text-sky-200">
                Currently overridden to <strong>{overrideTarget.residualScore}</strong> by {overrideTarget.overriddenBy || "—"} on {overrideTarget.overriddenAt ? fmtDate(overrideTarget.overriddenAt) : "—"}.
                Justification: {overrideTarget.residualJustification || "—"}
              </p>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="label mb-1.5">Manual residual score (1–25)</span>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={25}
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(e.target.value)}
                  placeholder="e.g. 8"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="label mb-1.5">Justification (required, min 30 chars)</span>
                <textarea
                  className="input min-h-[72px]"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Why the control-driven calculation does not reflect the accepted exposure — this is the auditable record."
                />
                <span className={`mt-1 block text-[11px] ${overrideReason.trim().length >= 30 ? "text-emerald-400" : "text-neutral-500"}`}>
                  {overrideReason.trim().length} / 30 characters
                </span>
              </label>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => !busy && setDeleting(null)}
        title="Delete risk"
        subtitle="This permanently removes the risk from the register."
        width="max-w-md"
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={() => setDeleting(null)} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="btn-primary bg-red-900/60 text-red-100 hover:bg-red-800/60" onClick={confirmDelete} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? "Deleting…" : "Delete"}
            </button>
          </>
        }
      >
        <p className="text-sm text-neutral-300">
          <strong className="text-neutral-100">{deleting?.riskId || "Risk"}</strong> — {deleting?.title}
        </p>
      </Modal>
    </>
  );
}
