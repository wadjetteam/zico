import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertOctagon, ArrowUpRight, RefreshCw, ShieldAlert } from "lucide-react";
import { Link } from "react-router";
import api, { resource } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import { ErrorState, LoadingState } from "../../components/States";
import { chipClass, fmtDate, SEVERITY_STYLES } from "../../lib/format";

const risks = resource("risks");
const parameters = resource("parameters");

const domainIdOf = (value) => (typeof value === "object" ? value?._id : value);

function SummaryCard({ icon: Icon, label, value, tone = "text-neutral-100" }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white/[0.03] text-gold">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">{label}</p>
        <p className={`heading mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
      </div>
    </div>
  );
}

export default function RiskTreatment() {
  const [rows, setRows] = useState([]);
  const [paramRows, setParamRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([risks.list({ pageSize: 200 }), parameters.list()])
      .then(([riskData, parameterData]) => {
        setRows(riskData.items || []);
        setParamRows(parameterData.items || []);
      })
      .catch((err) => setError(err?.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const treatmentRows = useMemo(() => {
    const parameterByDomain = new Map();
    for (const parameter of paramRows) {
      const domainId = domainIdOf(parameter.domain);
      if (domainId && (parameter.active !== false && parameter.status !== "inactive")) parameterByDomain.set(String(domainId), parameter);
    }
    return rows
      .filter((risk) => !["closed", "Close", "Closed"].includes(risk.status))
      .map((risk) => {
        const parameter = parameterByDomain.get(String(domainIdOf(risk.domain)));
        const appetite = Number(parameter?.appetiteLimit ?? risk.appetiteLimit);
        const residual = Number(risk.residualScore);
        return { ...risk, parameter, appetite, residual, excess: residual - appetite };
      })
      .filter((risk) => Number.isFinite(risk.residual) && Number.isFinite(risk.appetite) && risk.residual > risk.appetite)
      .sort((a, b) => b.excess - a.excess);
  }, [rows, paramRows]);

  const outsideTolerance = treatmentRows.filter((risk) => risk.toleranceLimit != null && risk.residual > Number(risk.toleranceLimit)).length;
  const critical = treatmentRows.filter((risk) => String(risk.residualLevel || risk.overallRisk || "").toLowerCase() === "critical").length;

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (loading) return <LoadingState label="Loading risks above appetite…" />;

  return (
    <>
      <PageHeader
        title="Risk Treatment"
        subtitle="Risks above the appetite limit for their domain, ready for treatment planning and escalation."
        actions={<button type="button" onClick={load} className="btn-secondary inline-flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Refresh</button>}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={ShieldAlert} label="Above appetite" value={treatmentRows.length} tone={treatmentRows.length ? "text-orange-300" : "text-neutral-100"} />
        <SummaryCard icon={AlertOctagon} label="Outside tolerance" value={outsideTolerance} tone={outsideTolerance ? "text-red-300" : "text-neutral-100"} />
        <SummaryCard icon={AlertOctagon} label="Critical residual" value={critical} tone={critical ? "text-red-300" : "text-neutral-100"} />
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h2 className="heading text-sm font-semibold text-neutral-100">Treatment queue</h2>
          <p className="mt-1 text-xs text-neutral-500">Residual score is compared with the active appetite limit assigned to each risk domain.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-line bg-white/[0.02] text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              <tr><th className="px-4 py-3">Risk</th><th className="px-4 py-3">Domain</th><th className="px-4 py-3">Residual</th><th className="px-4 py-3">Appetite</th><th className="px-4 py-3">Treatment</th><th className="px-4 py-3">Acceptance</th><th className="px-4 py-3">Review</th><th className="px-4 py-3">Treatment owner</th><th className="px-4 py-3">Effectiveness</th><th className="px-4 py-3">Mitigation actions</th><th className="px-4 py-3">Deadline</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {treatmentRows.map((risk) => {
                const level = String(risk.residualLevel || risk.overallRisk || "medium").toLowerCase();
                const owner = risk.riskOwner?.name || risk.ownerName || risk.owner || "Unassigned";
                return (
                  <tr key={risk._id} className="transition hover:bg-white/[0.025]">
                    <td className="max-w-[280px] px-4 py-4"><p className="font-mono text-[11px] text-gold">{risk.riskId || risk._id?.slice(-8)}</p><p className="mt-1 truncate text-neutral-200" title={risk.title}>{risk.title || "Untitled risk"}</p><p className="mt-1 text-[11px] text-neutral-500">Owner: {owner}</p></td>
                    <td className="px-4 py-4 text-neutral-400">{risk.domain?.name || "Unassigned domain"}<p className="mt-1 text-[11px] text-neutral-600">{risk.parameter?.name || "No active parameter"}</p></td>
                    <td className="px-4 py-4"><span className={`chip ${SEVERITY_STYLES[level] || "border-orange-800/60 bg-orange-950/40 text-orange-300"}`}>{risk.residual} · {risk.residualLevel || risk.overallRisk || "Above appetite"}</span></td>
                    <td className="px-4 py-4"><p className="text-neutral-300">{risk.appetite}</p><p className="mt-1 text-[11px] text-orange-300">+{risk.excess} above limit</p></td>
                    <td className="px-4 py-4"><span className={chipClass(risk.treatment || risk.treatmentDecision || "pending")}>{risk.treatment || risk.treatmentDecision || "Pending"}</span></td>
                    <td className="px-4 py-4 text-xs text-neutral-400">{risk.treatment === "Accept" ? risk.acceptedByName || risk.acceptedBy || "Signed off" : "—"}</td>
                    <td className="px-4 py-4 text-xs">{risk.changeTriggerPending ? <span className="chip border-sky-800/60 bg-sky-950/40 text-sky-300">Change review</span> : risk.requiresSecondApproval && !risk.secondApprovedBy ? <span className="chip border-violet-800/60 bg-violet-950/40 text-violet-300">2nd approval</span> : <span className="text-neutral-600">—</span>}</td>
                    <td className="px-4 py-4 text-neutral-400">{risk.treatmentOwner || risk.treatmentOwnerId || "—"}</td>
                    <td className="px-4 py-4"><span className={chipClass(risk.treatmentEffectiveness || "Not Assessed")}>{risk.treatmentEffectiveness || "Not Assessed"}</span></td>
                    <td className="max-w-[240px] px-4 py-4 text-xs text-neutral-400" title={risk.mitigationActions || ""}><span className="line-clamp-2">{risk.mitigationActions || risk.treatmentActions || "—"}</span></td>
                    <td className="px-4 py-4 text-neutral-400">{fmtDate(risk.treatmentDueDate || risk.deadline || risk.targetDate)}</td>
                    <td className="px-4 py-4 text-right"><Link to={`/risk/view?risk=${risk._id}`} className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold-light">Start treatment <ArrowUpRight className="h-3.5 w-3.5" /></Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!treatmentRows.length && <div className="p-12 text-center"><p className="text-sm text-emerald-300">No risks are currently above appetite.</p><p className="mt-1 text-xs text-neutral-500">The treatment queue will populate when a residual score exceeds its domain appetite limit.</p></div>}
        </div>
      </div>
    </>
  );
}