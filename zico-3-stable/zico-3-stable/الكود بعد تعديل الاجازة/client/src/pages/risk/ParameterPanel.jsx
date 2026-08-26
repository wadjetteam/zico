import { Lock, SlidersHorizontal } from "lucide-react";

/**
 * Read-only view of the domain's active parameter: scoring method, criteria
 * with weights, severity thresholds and the risk appetite limit. This
 * configuration is set in the Domain / Parameter settings only — nothing
 * here is editable.
 */
export default function ParameterPanel({ domainName, method, param, className = "" }) {
  const thresholds = param?.thresholds || {};
  return (
    <div className={`rounded-xl border border-line bg-white/[0.02] ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <p className="label flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-gold" />
          Domain &amp; Parameter
        </p>
        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-neutral-500">
          <Lock className="h-3 w-3" /> Read-only
        </span>
      </div>

      <div className="space-y-3 px-4 py-3 text-sm">
        <div className="flex flex-wrap gap-x-6 gap-y-1.5">
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-neutral-600">Domain</dt>
            <dd className="font-medium text-neutral-100">{domainName || "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-neutral-600">Scoring method</dt>
            <dd className="text-neutral-200">
              {method === "advanced"
                ? "Advanced Blended Impact (70% max + 30% weighted avg)"
                : "Default plain max impact"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-neutral-600">Risk score method</dt>
            <dd className="text-neutral-200">
              {param?.riskScoreMethod === "weighted_additive"
                ? `Weighted additive ×5 (L ${(param.riskScoreWeights?.likelihood ?? 0.5) * 100}% / I ${(param.riskScoreWeights?.impact ?? 0.5) * 100}%)`
                : param?.riskScoreMethod === "matrix_lookup"
                  ? "Matrix lookup (5×5)"
                  : "Multiplicative (L × I)"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-neutral-600">Parameter</dt>
            <dd className="flex items-center gap-1.5 text-neutral-200">
              {param?.name || "—"}
              {param?.methodVersion != null && (
                <span className="chip border-line bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-neutral-400">
                  v{param.methodVersion}
                </span>
              )}
            </dd>
          </div>
        </div>

        {param?.criteria?.length ? (
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-neutral-600">Criteria &amp; weights (fixed)</dt>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {param.criteria.map((c) => (
                <div key={c.name} className="rounded-lg border border-line bg-white/[0.02] px-2.5 py-1.5">
                  <p className="truncate text-xs text-neutral-300">{c.name}</p>
                  <p className="font-mono text-[11px] text-gold">{(Number(c.weight) * 100).toFixed(0)}%</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {param?.riskScoreMethod === "matrix_lookup" && Array.isArray(param.matrixLookupTable) && (
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-neutral-600">Lookup table (L → I, 1–25)</dt>
            <div className="mt-1.5 overflow-x-auto">
              <table className="w-full border-collapse text-center font-mono text-[11px]">
                <tbody>
                  {param.matrixLookupTable.map((row, li) => (
                    <tr key={li}>
                      <td className="border border-line bg-white/[0.02] px-1.5 py-1 text-neutral-500">L{li + 1}</td>
                      {row.map((cell, ii) => (
                        <td key={ii} className="border border-line px-1.5 py-1 text-neutral-300">{cell ?? "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {param?.residualCapReduction != null && (
          <div className="flex flex-wrap gap-x-6 gap-y-1.5">
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-neutral-600">Residual cap reduction</dt>
              <dd className="font-mono text-xs text-neutral-200">≤ {Math.round((param.residualCapReduction || 0.75) * 100)}%</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-neutral-600">Control effectiveness weights</dt>
              <dd className="font-mono text-xs text-neutral-300">
                {Object.entries(param.controlEffectivenessWeights || {})
                  .map(([k, v]) => `${k} ${v}`)
                  .join(" · ")}
              </dd>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-x-6 gap-y-1.5 border-t border-line pt-2.5">
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-neutral-600">Severity thresholds</dt>
            <dd className="font-mono text-xs text-neutral-200">
              Critical ≥ {thresholds.critical ?? 20} · High ≥ {thresholds.high ?? 12} · Medium ≥ {thresholds.medium ?? 6}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-neutral-600">Risk appetite</dt>
            <dd className="font-mono text-xs text-neutral-200">residual ≤ {param?.appetiteLimit ?? "—"}</dd>
          </div>
        </div>

        <p className="border-t border-line pt-2 text-[11px] leading-relaxed text-neutral-600">
          These values come from the domain's active parameter and are applied automatically to every risk in the
          domain. They cannot be changed here.
        </p>
      </div>
    </div>
  );
}
