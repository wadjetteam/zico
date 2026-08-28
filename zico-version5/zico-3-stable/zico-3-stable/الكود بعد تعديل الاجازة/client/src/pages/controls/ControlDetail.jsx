import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Link2 } from "lucide-react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import { ErrorState, LoadingState } from "../../components/States";
import { chipClass, fmtDate, titleCase } from "../../lib/format";
import { effectivenessChipClass } from "../../lib/riskLinks";

const IMPL_STYLES = {
  "Not Implemented": "border-red-800/60 bg-red-950/40 text-red-300",
  "Partially Implemented": "border-amber-800/60 bg-amber-950/40 text-amber-300",
  "Largely Implemented": "border-sky-800/60 bg-sky-950/40 text-sky-300",
  "Fully Implemented": "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
};

export default function ControlDetail() {
  const { id } = useParams();
  const [control, setControl] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    setError(null);
    setControl(null);
    api
      .get(`/controls/${id}`)
      .then((r) => setControl(r.data))
      .catch((e) => setError(e?.response?.data?.message || e.message));
  };

  useEffect(load, [id]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!control) return <LoadingState label="Loading control…" />;

  const linked = control.linkedRisks || [];
  const inScope = control.implementationStatus !== "Not Implemented";
  const code = control.annexCode || control.controlId;
  const justification = inScope
    ? `Applicable — ${linked.length > 0 ? `mitigates ${linked.length} risk${linked.length === 1 ? "" : "s"}: ${linked
        .map((l) => `${l.risk?.riskId || l.risk?._id || ""} (${l.risk?.severityLevel || "—"})`)
        .join(", ")}` : "no risks mapped — review applicability"}`
    : `Not applicable — implementation status is "${control.implementationStatus}".`;

  const columns = [
    {
      key: "riskId",
      header: "Risk ID",
      render: (l) => (
        <Link to="/risk/scoring" className="whitespace-nowrap font-medium text-gold hover:underline">
          {l.risk?.riskId || "—"}
        </Link>
      ),
    },
    { key: "title", header: "Risk", render: (l) => <span className="font-medium text-neutral-100">{l.risk?.title || "—"}</span> },
    {
      key: "severityLevel",
      header: "Severity",
      render: (l) => (
        <span className={chipClass(l.risk?.severityLevel)}>{l.risk?.severityLevel || "—"}</span>
      ),
    },
    { key: "status", header: "Status", render: (l) => <span className={chipClass(l.risk?.status)}>{titleCase(l.risk?.status || "—")}</span> },
    {
      key: "residualScore",
      header: "Residual",
      render: (l) => <span className="whitespace-nowrap font-mono text-xs text-neutral-300">{l.risk?.residualScore ?? "—"}</span>,
    },
    {
      key: "link_type",
      header: "Link type",
      render: (l) => <span className={chipClass(l.link_type)}>{titleCase(l.link_type)}</span>,
    },
    {
      key: "effectiveness",
      header: "Effectiveness",
      render: (l) => <span className={effectivenessChipClass(l.effectiveness)}>{l.effectiveness}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title={control.controlId}
        subtitle={control.name}
        actions={
          <Link to="/controls/management" className="btn-ghost">
            <ArrowLeft className="h-4 w-4" /> Control library
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="card h-fit p-5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-gold">{code}</span>
            <span className={chipClass(control.implementationStatus, IMPL_STYLES)}>{control.implementationStatus}</span>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Framework</dt>
              <dd className="text-right text-neutral-200">{control.framework?.name || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Domain</dt>
              <dd className="text-right text-neutral-200">{control.domain || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Type</dt>
              <dd className="text-right text-neutral-200">{control.controlType || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Owner</dt>
              <dd className="text-right text-neutral-200">{control.owner || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Testing frequency</dt>
              <dd className="text-right text-neutral-200">{control.testingFrequency || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Last tested</dt>
              <dd className="text-right text-neutral-200">{fmtDate(control.lastTestedAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Next test due</dt>
              <dd className="text-right text-neutral-200">{fmtDate(control.nextTestDueAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Maturity</dt>
              <dd className="text-right text-neutral-200">{control.maturityLevel ?? "—"} / 5</dd>
            </div>
          </dl>
        </div>

        <div className="card p-5 xl:col-span-2">
          <h3 className="heading text-sm font-semibold uppercase tracking-wider text-neutral-400">Statement of Applicability</h3>
          <p className="mt-3 text-sm leading-relaxed text-neutral-300">{control.description}</p>
          <div className="mt-4 rounded-lg border border-line bg-ink-deep/40 p-3.5">
            <p className="text-xs text-neutral-500">Justification</p>
            <p className="mt-1 text-sm text-neutral-200">{justification}</p>
          </div>
          {!inScope && (
            <p className="mt-3 text-xs text-neutral-600">
              Controls that are not implemented are flagged as out of scope in the SoA.
            </p>
          )}
          {inScope && linked.length === 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-800/60 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
              <Link2 className="h-3.5 w-3.5" />
              In scope but no risks mapped — review whether this control is over-scope or a risk is missing a control.
            </p>
          )}
        </div>
      </div>

      <div className="mt-5">
        <DataTable
          columns={columns}
          rows={linked}
          searchable={false}
          emptyTitle="No risks mapped"
          emptyHint="Link this control to a risk from the risk register to appear here."
          toolbar={
            <span className="text-xs text-neutral-500">
              {linked.length} risk{linked.length === 1 ? "" : "s"} mitigated by this control
            </span>
          }
        />
      </div>
    </>
  );
}