import { useEffect, useState } from "react";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import api from "../api/client";
import { TextInput } from "./Field";

const LEVEL_STYLES = {
  critical: "border-red-800/60 bg-red-950/40 text-red-300",
  high: "border-amber-800/60 bg-amber-950/40 text-amber-300",
  medium: "border-sky-800/60 bg-sky-950/40 text-sky-300",
  low: "border-neutral-700 bg-neutral-900 text-neutral-400",
};

export default function ImpactPanel({ entityType, entityId, overrideUrl, onChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    setConfirmed(false);
    setConfirmText("");
    setData(null);
    api
      .get("/impact-analysis", { params: { entity_type: entityType, entity_id: entityId } })
      .then((r) => {
        if (live) setData(r.data);
      })
      .catch((e) => {
        if (live) setError(e?.response?.data?.message || e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [entityType, entityId]);

  const high = Boolean(data && (data.risk_level_if_proceeded === "high" || data.risk_level_if_proceeded === "critical"));
  const needConfirm = high && !confirmed;
  const n = data?.affected_risks?.length || 0;
  const requiredText = `I understand the impact on ${n} risk${n === 1 ? "" : "s"}`;

  useEffect(() => {
    onChange?.(high, confirmed);
  }, [high, confirmed]);

  const confirm = async () => {
    if (confirmText.trim() !== requiredText) return;
    setSaving(true);
    try {
      await api.post(overrideUrl, { reason: confirmText.trim() });
      setConfirmed(true);
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="rounded-lg border border-line bg-white/[0.02] p-3 text-sm text-neutral-500">Loading impact analysis…</div>;
  if (error) return <div className="rounded-lg border border-line bg-white/[0.02] p-3 text-sm text-red-400">Impact analysis unavailable: {error}</div>;
  if (!data) return null;

  return (
    <div className={`rounded-lg border p-3 ${high ? "border-red-800/60 bg-red-950/20" : "border-line bg-white/[0.02]"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="label">Impact Analysis</p>
        <span className={`chip capitalize ${LEVEL_STYLES[data.risk_level_if_proceeded]}`}>{data.risk_level_if_proceeded} impact</span>
      </div>
      <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
        <div><span className="text-neutral-500">Affected controls: </span><span className="text-neutral-200">{data.affected_controls.length}</span></div>
        <div><span className="text-neutral-500">Affected risks: </span><span className="text-neutral-200">{data.affected_risks.length}</span></div>
        <div><span className="text-neutral-500">Frameworks: </span><span className="text-neutral-200">{data.affected_frameworks.length}</span></div>
        <div><span className="text-neutral-500">Active exceptions: </span><span className="text-neutral-200">{data.affected_active_exceptions.length}</span></div>
      </div>
      {data.affected_risks.length > 0 && (
        <ul className="mt-2 max-h-28 space-y-1 overflow-auto text-xs text-neutral-300">
          {data.affected_risks.map((r) => (
            <li key={r.risk_id} className="flex items-center justify-between gap-2">
              <span className="truncate">{r.riskId} — {r.risk_title}</span>
              <span className="chip shrink-0">{r.current_score}</span>
            </li>
          ))}
        </ul>
      )}
      {needConfirm && (
        <div className="mt-3 rounded-md border border-red-900/60 bg-red-950/30 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm text-red-300">
            <ShieldAlert className="h-4 w-4 shrink-0" /> This change affects {n} risk{n === 1 ? "" : "s"}. Proceeding requires explicit confirmation.
          </div>
          <div className="flex items-center gap-2">
            <TextInput value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={`Type: ${requiredText}`} className="flex-1" />
            <button className="btn-primary" onClick={confirm} disabled={saving || confirmText.trim() !== requiredText}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Confirm
            </button>
          </div>
        </div>
      )}
      {confirmed && <div className="mt-2 text-xs text-emerald-400">Override confirmed — logged to the governance audit trail.</div>}
    </div>
  );
}