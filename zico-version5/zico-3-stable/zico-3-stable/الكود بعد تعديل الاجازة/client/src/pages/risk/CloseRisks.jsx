import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { resource } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { Field, TextArea } from "../../components/Field";
import { LoadingState } from "../../components/States";
import { chipClass, fmtDate, titleCase } from "../../lib/format";
import { withRiskParam } from "../../lib/riskLifecycle";
import RiskLifecycleStepper from "../../components/RiskLifecycleStepper";

const risks = resource("risks");

export default function CloseRisks() {
  const [searchParams] = useSearchParams();
  const linkedRiskId = searchParams.get("riskId");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    risks.list().then((d) => setRows(d.items)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const visibleRows = linkedRiskId ? rows.filter((r) => r._id === linkedRiskId || r.riskId === linkedRiskId) : rows;

  const close = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await risks.update(closing._id, { status: "Closed", resolutionNotes: notes, closedAt: new Date() });
      setClosing(null);
      setNotes("");
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const reopen = async (r) => {
    if (!window.confirm("Re-open this risk? The resolution notes will be cleared.")) return;
    try {
      await risks.update(r._id, { status: "Open", resolutionNotes: "", closedAt: null });
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  const columns = [
    {
      key: "riskId",
      header: "ID",
      render: (r) => <span className="whitespace-nowrap font-mono text-xs text-gold">{r.riskId || "—"}</span>,
    },
    { key: "title", header: "Risk", render: (r) => <span className="font-medium text-neutral-100">{r.title}</span> },
    { key: "category", header: "Category", render: (r) => <span className="whitespace-nowrap">{r.category || "—"}</span> },
    { key: "owner", header: "Owner" },
    {
      key: "status",
      header: "Status",
      render: (r) => <span className={chipClass(r.status)}>{titleCase(r.status)}</span>,
    },
    { key: "closedAt", header: "Closed", render: (r) => fmtDate(r.closedAt) },
    {
      key: "resolutionNotes",
      header: "Resolution",
      render: (r) => <span className="line-clamp-1 text-xs text-neutral-500">{r.resolutionNotes || "—"}</span>,
    },
    {
      key: "__a",
      header: "",
      sortable: false,
      className: "text-right",
      render: (r) =>
        r.status === "Closed" ? (
          <button className="btn-ghost px-3 py-1.5" onClick={() => reopen(r)}>
            Re-open
          </button>
        ) : (
          <button className="btn-primary px-3 py-1.5" onClick={() => { setClosing(r); setNotes(""); }}>
            Close
          </button>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Close Risks"
        subtitle="Formally retire risks from the register with documented resolution evidence. A Management Review must be logged against the risk first — closing without oversight is blocked."
        actions={
          <div className="flex items-center gap-3">
            <RiskLifecycleStepper current="close" riskId={linkedRiskId || undefined} />
            {linkedRiskId ? (
              <Link to={withRiskParam("/risk/reviews", linkedRiskId)} className="text-xs text-gold hover:underline">
                Review the linked risk
              </Link>
            ) : null}
          </div>
        }
      />
      {linkedRiskId && (
        <div className="mb-4 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">
          ISO 27005 closure workflow: review the treatment outcome, confirm residual exposure, and close only after management oversight.
        </div>
      )}
      {loading ? <LoadingState /> : <DataTable columns={columns} rows={visibleRows} searchPlaceholder="Search risks…" />}

      <Modal
        open={Boolean(closing)}
        onClose={() => setClosing(null)}
        title="Close risk"
        subtitle={closing?.title}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setClosing(null)}>Cancel</button>
            <button className="btn-primary" form="close-form" type="submit" disabled={saving}>
              {saving ? "Closing…" : "Confirm closure"}
            </button>
          </>
        }
      >
        <form id="close-form" onSubmit={close}>
          <Field label="Resolution notes" hint="Describe the controls implemented or the reason the exposure no longer applies. Requires a Management Review on the risk.">
            <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} required />
          </Field>
        </form>
      </Modal>
    </>
  );
}
