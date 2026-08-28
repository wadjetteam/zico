import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import api, { resource } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import { ErrorState, LoadingState } from "../../components/States";
import { Select } from "../../components/Field";
import RiskLifecycleStepper from "../../components/RiskLifecycleStepper";
import { fmtDate, titleCase } from "../../lib/format";

export default function ScoreHistory() {
  const [searchParams] = useSearchParams();
  const [risks, setRisks] = useState([]);
  const [selected, setSelected] = useState(searchParams.get("riskId") || "");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    resource("risks")
      .list({ pageSize: 200 })
      .then((d) => {
        setRisks(d.items);
        const linkedRiskId = searchParams.get("riskId");
        if (linkedRiskId && d.items.some((r) => r._id === linkedRiskId || r.riskId === linkedRiskId)) {
          setSelected(linkedRiskId);
          selectRisk(linkedRiskId);
        }
      })
      .catch(() => {});
  }, [searchParams]);

  const selectRisk = (id) => {
    setSelected(id);
    if (!id) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .get(`/risk-score-history/${id}`)
      .then((r) => setRows(r.data.items || []))
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  };

  const columns = [
    {
      key: "changed_at",
      header: "Changed",
      render: (h) => <span className="whitespace-nowrap text-xs text-neutral-300">{fmtDate(h.changed_at)}</span>,
    },
    {
      key: "previousInherentScore",
      header: "Prev. inherent",
      render: (h) => <span className="font-mono text-xs text-neutral-400">{h.previousInherentScore ?? "—"}</span>,
    },
    {
      key: "newInherentScore",
      header: "New inherent",
      render: (h) => <span className="font-mono text-xs text-neutral-100">{h.newInherentScore ?? "—"}</span>,
    },
    {
      key: "previousResidualScore",
      header: "Prev. residual",
      render: (h) => <span className="font-mono text-xs text-neutral-400">{h.previousResidualScore ?? "—"}</span>,
    },
    {
      key: "newResidualScore",
      header: "New residual",
      render: (h) => <span className="font-mono text-xs text-neutral-100">{h.newResidualScore ?? "—"}</span>,
    },
    {
      key: "suggestedResidual",
      header: "Suggested",
      render: (h) => <span className="font-mono text-xs text-neutral-400">{h.suggestedResidual ?? "—"}</span>,
    },
    {
      key: "riskScoreMethodAtChange",
      header: "Method",
      render: (h) => <span className="whitespace-nowrap text-xs">{titleCase(h.riskScoreMethodAtChange || "—")}</span>,
    },
    { key: "methodVersionAtChange", header: "Ver.", render: (h) => <span className="font-mono text-xs">v{h.methodVersionAtChange ?? "—"}</span> },
    { key: "changed_by", header: "Changed by", render: (h) => <span className="whitespace-nowrap text-xs">{h.changed_by || "—"}</span> },
    {
      key: "residualJustification",
      header: "Justification",
      render: (h) => (
        <span className="line-clamp-1 max-w-[260px] text-xs text-neutral-500" title={h.residualJustification || ""}>
          {h.residualJustification || "—"}
        </span>
      ),
    },
  ];

  const current = risks.find((r) => r._id === selected);

  return (
    <>
      <PageHeader
        title="Risk Score History"
        subtitle="Every scoring event recorded per risk — method re-baselines, re-scores and residual overrides with their justification."
        actions={
          <div className="flex items-center gap-3">
            <RiskLifecycleStepper current="scoring" riskId={selected || undefined} />
            <Select
              className="w-72"
              value={selected}
              onChange={(e) => selectRisk(e.target.value)}
              options={[
                { value: "", label: "Select a risk…" },
                ...risks.map((r) => ({ value: r._id, label: `${r.riskId || ""} — ${r.title}`.replace(/^ — /, "") })),
              ]}
            />
          </div>
        }
      />

      {selected && (
        <div className="mb-4 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">
          ISO 27005 score trail: this record shows the assessment history used to support the treatment and review decisions.
        </div>
      )}

      {error ? (
        <ErrorState message={error} onRetry={() => selectRisk(selected)} />
      ) : loading ? (
        <LoadingState />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          searchPlaceholder="Search history…"
          emptyHint={
            selected
              ? `No scoring events recorded for ${current?.riskId || "this risk"} yet.`
              : "Select a risk above to see its scoring history."
          }
        />
      )}
    </>
  );
}