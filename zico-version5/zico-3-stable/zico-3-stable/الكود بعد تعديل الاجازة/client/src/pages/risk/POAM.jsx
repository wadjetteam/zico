import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { resource } from "../../api/client";
import ResourcePage from "../../components/ResourcePage";
import { chipClass, fmtDate, titleCase } from "../../lib/format";
import { withRiskParam } from "../../lib/riskLifecycle";
import RiskLifecycleStepper from "../../components/RiskLifecycleStepper";

export default function POAM() {
  const [searchParams] = useSearchParams();
  const linkedRiskId = searchParams.get("riskId");
  const [riskOptions, setRiskOptions] = useState([]);
  useEffect(() => {
    resource("risks")
      .list()
      .then((d) =>
        setRiskOptions(
          d.items.map((r) => ({
            value: r._id,
            label: `${r.riskId || ""} — ${r.title}`.replace(/^ — /, ""),
          }))
        )
      );
  }, []);

  const extraToolbar = linkedRiskId ? (
    <div className="flex items-center gap-2">
      <span className="rounded border border-gold/30 bg-gold/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-gold">
        Treatment follow-up
      </span>
      <Link to={withRiskParam("/risk/treatment", linkedRiskId)} className="text-xs text-neutral-300 hover:text-gold">
        Open treatment plan
      </Link>
    </div>
  ) : null;

  return (
    <ResourcePage
      title="Plan of Action & Milestones"
      subtitle="Remediation tasks and milestones linked to risks, with owners and due dates."
      path="poam"
      singular="milestone"
      defaults={linkedRiskId ? { risk: linkedRiskId } : {}}
      extraToolbar={
        <div className="flex items-center gap-3">
          <RiskLifecycleStepper current="poam" riskId={linkedRiskId || undefined} />
          {extraToolbar}
        </div>
      }
      emptyHint="Create milestones to track remediation of open risks."
      transform={(form) => ({
        ...form,
        status: Number(form.percentComplete) >= 100 ? "complete" : form.status,
      })}
      columns={[
        { key: "title", header: "Milestone", render: (r) => <span className="font-medium text-neutral-100">{r.title}</span> },
        { key: "risk", header: "Risk", render: (r) => r.risk?.title ? <span className="line-clamp-1 text-xs text-neutral-500">{r.risk?.title}</span> : <span className="chip border-amber-800/60 bg-amber-950/40 text-amber-300" title="The linked risk was removed from the register — reassign this item">Missing risk</span> },
        { key: "owner", header: "Owner" },
        { key: "dueDate", header: "Due", render: (r) => fmtDate(r.dueDate) },
        {
          key: "percentComplete",
          header: "Progress",
          render: (r) => (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-deep">
                <div className="h-full rounded-full bg-gold-gradient" style={{ width: `${r.percentComplete}%` }} />
              </div>
              <span className="text-xs text-neutral-500">{r.percentComplete}%</span>
            </div>
          ),
        },
        { key: "status", header: "Status", render: (r) => <span className={chipClass(r.status)}>{titleCase(r.status)}</span> },
      ]}
      fields={[
        { name: "title", label: "Milestone title", required: true, span: 2 },
        { name: "risk", label: "Linked risk", type: "select", options: riskOptions, required: true, span: 2 },
        { name: "owner", label: "Owner" },
        { name: "dueDate", label: "Due date", type: "date" },
        { name: "percentComplete", label: "Percent complete", type: "number", min: 0, max: 100 },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: ["planned", "in-progress", "blocked", "complete"].map((v) => ({ value: v, label: titleCase(v) })),
        },
        { name: "description", label: "Description", type: "textarea", span: 2 },
      ]}
    />
  );
}
