import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { resource } from "../../api/client";
import ResourcePage from "../../components/ResourcePage";
import { fmtDate, titleCase } from "../../lib/format";
import { withRiskParam } from "../../lib/riskLifecycle";
import RiskLifecycleStepper from "../../components/RiskLifecycleStepper";

export default function ManagementReviews() {
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
        ISO 27005 review
      </span>
      <Link to={withRiskParam("/risk/view", linkedRiskId)} className="text-xs text-neutral-300 hover:text-gold">
        Back to risk register
      </Link>
    </div>
  ) : null;

  return (
    <ResourcePage
      title="Management Reviews"
      subtitle="Committee decisions and review notes recorded against each risk."
      path="management-reviews"
      singular="review"
      defaults={linkedRiskId ? { risk: linkedRiskId } : {}}
      extraToolbar={
        <div className="flex items-center gap-3">
          <RiskLifecycleStepper current="reviews" riskId={linkedRiskId || undefined} />
          {extraToolbar}
        </div>
      }
      emptyHint="Log a management review to evidence oversight of the register."
      columns={[
        { key: "risk", header: "Risk", render: (r) => r.risk?.title ? <span className="text-neutral-100">{r.risk?.title}</span> : <span className="chip border-amber-800/60 bg-amber-950/40 text-amber-300" title="The linked risk was removed from the register — reassign this review">Missing risk</span> },
        { key: "reviewer", header: "Reviewer" },
        { key: "decision", header: "Decision", render: (r) => <span className="capitalize">{r.decision}</span> },
        { key: "notes", header: "Notes", render: (r) => <span className="line-clamp-1 text-xs text-neutral-500">{r.notes}</span> },
        { key: "reviewDate", header: "Reviewed", render: (r) => fmtDate(r.reviewDate) },
        { key: "nextReviewDate", header: "Next review", render: (r) => fmtDate(r.nextReviewDate) },
      ]}
      fields={[
        { name: "risk", label: "Risk", type: "select", options: riskOptions, required: true, span: 2 },
        { name: "reviewer", label: "Reviewer", required: true },
        {
          name: "decision",
          label: "Decision",
          type: "select",
          options: ["accept", "mitigate", "transfer", "avoid", "reject", "defer"].map((v) => ({ value: v, label: titleCase(v) })),
        },
        { name: "reviewDate", label: "Review date", type: "date" },
        { name: "nextReviewDate", label: "Next review date", type: "date" },
        { name: "notes", label: "Notes", type: "textarea", span: 2 },
      ]}
    />
  );
}
