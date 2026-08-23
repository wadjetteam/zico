import { useEffect, useState } from "react";
import { Archive, Loader2, ThumbsDown, ThumbsUp, Send, Rocket } from "lucide-react";
import { resource } from "../../../api/client";
import { POLICY_LIFECYCLE, fmtDateTime, stepIndex } from "../../../lib/policy";
import Modal from "../../../components/Modal";
import { Field, TextArea } from "../../../components/Field";
import { Stepper } from "../PolicyDetail";

const api = resource("policies");

/** Approval history derived from the audit trail (approval-related actions). */
const APPROVAL_ACTIONS = ["Submitted for Review", "Approved", "Rejected", "Published Direct", "Published", "Archived", "Approved Stage Completed"];

export default function WorkflowTab({ policy, reload }) {
  const [busy, setBusy] = useState("");
  const [stages, setStages] = useState(null);
  const [stagesDirty, setStagesDirty] = useState(false);
  const [history, setHistory] = useState([]);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const idx = stepIndex(policy.lifecycleState || policy.status);

  useEffect(() => {
    api.get(`${policy._id}/audit-logs`).then((d) => setHistory(d.items.filter((l) => APPROVAL_ACTIONS.includes(l.actionType)))).catch(() => {});
  }, [policy._id]);

  const run = async (action, confirmMsg, extra = {}) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(action);
    try {
      await api.create(`${policy._id}/workflow`, { action, ...extra });
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setBusy("");
    }
  };

  const reject = async (e) => {
    e.preventDefault();
    if (!rejectComment.trim()) return;
    setBusy("reject");
    try {
      await api.create(`${policy._id}/workflow`, { action: "reject", comment: rejectComment.trim() });
      setRejectOpen(false);
      setRejectComment("");
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setBusy("");
    }
  };

  const saveStages = async () => {
    setBusy("stages");
    try {
      await api.update(policy._id, { workflowStages: stages.filter((s) => s.name.trim()) });
      setStagesDirty(false);
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setBusy("");
    }
  };

  const buttons = [];
  if (policy.status === "Draft") {
    buttons.push(
      <button key="submit" className="btn-primary" onClick={() => run("submit-review")} disabled={!!busy}>
        {busy === "submit-review" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit for Review
      </button>,
      <button key="direct" className="btn-ghost" onClick={() => run("publish-direct", "Publish this policy directly without review?")} disabled={!!busy}>
        <Rocket className="h-4 w-4" /> Publish Direct
      </button>
    );
  }
  if (policy.status === "Review") {
    buttons.push(
      <button key="ap" className="btn-primary border-emerald-700 bg-emerald-700/90 text-white hover:bg-emerald-700" onClick={() => run("approve")} disabled={!!busy}>
        {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />} Approve
      </button>,
      <button key="rj" className="btn-ghost border-red-900/60 text-red-300 hover:bg-red-950/40" onClick={() => setRejectOpen(true)} disabled={!!busy}>
        <ThumbsDown className="h-4 w-4" /> Reject
      </button>
    );
  }
  if (policy.status === "Approval") {
    buttons.push(
      <button key="ap" className="btn-primary border-emerald-700 bg-emerald-700/90 text-white hover:bg-emerald-700" onClick={() => run("approve")} disabled={!!busy}>
        {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />} Approve
      </button>,
      <button key="rj" className="btn-ghost border-red-900/60 text-red-300 hover:bg-red-950/40" onClick={() => setRejectOpen(true)} disabled={!!busy}>
        <ThumbsDown className="h-4 w-4" /> Reject
      </button>
    );
  }
  if (policy.status === "Approved") {
    buttons.push(
      <button key="pub" className="btn-primary" onClick={() => run("publish", "Publish this policy now?")} disabled={!!busy}>
        {busy === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Publish
      </button>
    );
  }
  if (policy.status === "Published") {
    buttons.push(
      <button key="ar" className="btn-ghost border-red-900/60 text-red-300 hover:bg-red-950/40" onClick={() => run("archive", "Archive this policy? Archived policies cannot go through further workflow transitions.")} disabled={!!busy}>
        {busy === "archive" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />} Archive
      </button>
    );
  }

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <p className="label">Workflow Status</p>
          <span className="chip border-neutral-700 bg-neutral-900 text-neutral-300">{policy.status}</span>
        </div>
        <div className="mt-5">
          <Stepper steps={POLICY_LIFECYCLE} current={idx} />
        </div>

        {policy.status === "Approval" && (
          <div className="mt-5 rounded-lg border border-orange-800/60 bg-orange-950/30 px-4 py-3 text-sm text-orange-300">
            <strong>Approval Required</strong> — This policy is pending approval. Review the policy details before approving.
          </div>
        )}

        {buttons.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {buttons}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <p className="label mb-3">Approval History</p>
          {history.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-600">No approval history available</p>
          ) : (
            <ul className="space-y-3">
              {history.map((h) => (
                <li key={h._id} className="flex items-start justify-between gap-3 rounded-lg border border-line bg-white/[0.02] px-3 py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-neutral-100">{h.actionType}</p>
                    <p className="text-xs text-neutral-500">
                      {h.actor} ({h.actorRole}){h.details?.from ? ` · ${h.details.from} â†’ ${h.details.to}` : ""}
                    </p>
                    {h.details?.comment ? <p className="mt-1 text-xs italic text-neutral-600">â€œ{h.details.comment}â€�</p> : null}
                  </div>
                  <span className="shrink-0 text-xs text-neutral-500">{fmtDateTime(h.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="label">Stages</p>
            {stagesDirty && (
              <button className="btn-primary px-3 py-1.5 text-xs" onClick={saveStages} disabled={!!busy}>
                {busy === "stages" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save stages
              </button>
            )}
          </div>
          {!stages ? (
            <p className="py-6 text-center text-sm text-neutral-600">No workflow stages configured</p>
          ) : (
            <ul className="space-y-2">
              {(stages || []).map((s, i) => (
                <li key={i} className="flex items-center gap-2">
                  <input
                    className="input flex-1"
                    value={s.name}
                    placeholder="Stage name"
                    onChange={(e) => {
                      const next = [...stages];
                      next[i] = { ...next[i], name: e.target.value };
                      setStages(next);
                      setStagesDirty(true);
                    }}
                  />
                  <input
                    className="input w-28"
                    value={s.role || ""}
                    placeholder="Role"
                    onChange={(e) => {
                      const next = [...stages];
                      next[i] = { ...next[i], role: e.target.value };
                      setStages(next);
                      setStagesDirty(true);
                    }}
                  />
                  <button
                    className="rounded-md p-1.5 text-neutral-500 hover:text-red-300"
                    onClick={() => {
                      setStages(stages.filter((_, j) => j !== i));
                      setStagesDirty(true);
                    }}
                    title="Remove stage"
                  >
                    âœ•
                  </button>
                </li>
              ))}
              <li>
                <button
                  className="btn-ghost w-full py-1.5 text-xs"
                  onClick={() => {
                    setStages([...(stages || []), { name: "", role: "" }]);
                    setStagesDirty(true);
                  }}
                >
                  + Add stage
                </button>
              </li>
            </ul>
          )}
          {!stages && (
            <button
              className="btn-ghost w-full py-1.5 text-xs"
              onClick={() => setStages(policy.workflowStages?.length ? policy.workflowStages : [{ name: "", role: "" }])}
            >
              Configure stages
            </button>
          )}
        </div>
      </div>

      <Modal open={rejectOpen} onClose={() => !busy && setRejectOpen(false)} title="Reject Policy" width="max-w-md"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setRejectOpen(false)} type="button" disabled={!!busy}>Cancel</button>
            <button className="btn-primary" form="reject-form" type="submit" disabled={!!busy || !rejectComment.trim()}>
              {busy === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Reject &amp; Return to Draft
            </button>
          </>
        }
      >
        <form id="reject-form" onSubmit={reject} className="grid grid-cols-1 gap-4">
          <p className="text-sm text-neutral-400">This policy will be returned to <span className="text-neutral-200">Draft</span>.</p>
          <Field label="Reason (required) *">
            <TextArea value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} required placeholder="Why is this policy being rejected?" rows={4} />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
