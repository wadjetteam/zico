import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BellRing, CalendarClock, CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";
import { Link } from "react-router";
import api, { resource } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import { ErrorState, LoadingState } from "../../components/States";
import { chipClass, fmtDate, severityOf, SEVERITY_STYLES } from "../../lib/format";

const risks = resource("risks");

const getDueDate = (risk) => risk.dueDate || risk.due_date || risk.targetDate || risk.target_date;

const daysUntil = (date) => {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / 86400000);
};

const followUpState = (days) => {
  if (days === null) return { label: "No due date", tone: "neutral", message: "Set a due date" };
  if (days <= 1) return { label: "Critical", tone: "critical", message: "Escalation required" };
  if (days <= 14) return { label: "Urgent", tone: "high", message: "Owner action needed" };
  return { label: "Reminder", tone: "medium", message: "Keep treatment on track" };
};

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

export default function FollowingUp() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    risks
      .list()
      .then((data) => setRows(data.items || []))
      .catch((err) => setError(err?.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const followUps = useMemo(() => {
    return rows
      .filter((risk) => !["closed", "Close", "Closed"].includes(risk.status))
      .map((risk) => {
        const days = daysUntil(getDueDate(risk));
        return { ...risk, days, state: followUpState(days) };
      })
      .sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999));
  }, [rows]);

  const visibleRows = followUps.filter((risk) => {
    if (filter === "critical") return risk.days !== null && risk.days <= 1;
    if (filter === "urgent") return risk.days !== null && risk.days <= 14;
    if (filter === "no-date") return risk.days === null;
    return true;
  });
  const overdue = followUps.filter((risk) => risk.days !== null && risk.days < 0).length;
  const urgent = followUps.filter((risk) => risk.days !== null && risk.days <= 14).length;
  const dueSoon = followUps.filter((risk) => risk.days !== null && risk.days >= 0 && risk.days <= 30).length;
  const notifyOwner = async (risk) => {
    setSending(risk._id);
    try { await api.post(`/risks/${risk._id}/notify-owner`); window.alert("Risk owner notification sent."); }
    catch (err) { window.alert(err?.response?.data?.message || err.message); }
    finally { setSending(null); }
  };

  return (
    <>
      <PageHeader
        title="Following Up"
        subtitle="Monitor risk owners, treatment progress, and due-date warnings from one place."
        actions={
          <button type="button" onClick={load} className="btn-secondary inline-flex items-center gap-2" title="Refresh follow-ups">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />

      {error && <ErrorState message={error} />}
      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard icon={BellRing} label="Open follow-ups" value={followUps.length} />
            <SummaryCard icon={AlertTriangle} label="Overdue" value={overdue} tone={overdue ? "text-red-300" : "text-neutral-100"} />
            <SummaryCard icon={CalendarClock} label="Due within 30 days" value={dueSoon} tone={dueSoon ? "text-amber-300" : "text-neutral-100"} />
            <SummaryCard icon={CheckCircle2} label="Urgent attention" value={urgent} tone={urgent ? "text-orange-300" : "text-neutral-100"} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {[ ["all", "All open risks"], ["critical", "Critical / escalation"], ["urgent", "Urgent <= 14 days"], ["no-date", "Missing due date"] ].map(([value, label]) => (
              <button key={value} type="button" onClick={() => setFilter(value)} className={`btn-secondary ${filter === value ? "border-gold/50 bg-gold/10 text-gold" : ""}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="card mt-4 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-line bg-white/[0.02] text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Risk</th>
                    <th className="px-4 py-3 font-medium">Owner</th>
                    <th className="px-4 py-3 font-medium">Due date</th>
                    <th className="px-4 py-3 font-medium">Priority</th>
                    <th className="px-4 py-3 font-medium">Next step</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visibleRows.map((risk) => {
                    const level = String(risk.inherentLevel || severityOf(risk.inherentScore || risk.score || 0)).toLowerCase();
                    const owner = risk.riskOwner?.name || risk.owner?.name || risk.ownerName || (typeof risk.riskOwner === "string" ? risk.riskOwner : null) || "Unassigned";
                    return (
                      <tr key={risk._id} className="transition hover:bg-white/[0.025]">
                        <td className="max-w-[310px] px-4 py-4">
                          <p className="font-mono text-[11px] text-gold">{risk.riskId || risk._id?.slice(-8)}</p>
                          <p className="mt-1 truncate text-neutral-200" title={risk.title}>{risk.title || "Untitled risk"}</p>
                        </td>
                        <td className="px-4 py-4 text-neutral-400">{owner}</td>
                        <td className="px-4 py-4">
                          <p className={risk.days !== null && risk.days <= 14 ? "text-orange-300" : "text-neutral-300"}>{fmtDate(getDueDate(risk))}</p>
                          <p className="mt-1 text-[11px] text-neutral-600">{risk.days === null ? "Needs scheduling" : risk.days < 0 ? `${Math.abs(risk.days)} days overdue` : `${risk.days} days left`}</p>
                        </td>
                        <td className="px-4 py-4"><span className={`chip ${SEVERITY_STYLES[level] || "border-neutral-700 bg-neutral-900 text-neutral-400"}`}>{risk.inherentLevel || level}</span></td>
                        <td className="px-4 py-4"><span className={chipClass(risk.state.tone === "critical" ? "Critical" : risk.state.tone === "high" ? "High" : "Medium")}>{risk.state.message}</span></td>
                        <td className="px-4 py-4 text-right"><div className="flex justify-end gap-3"><button type="button" onClick={() => notifyOwner(risk)} disabled={sending === risk._id} className="text-xs text-gold hover:text-gold-light">{sending === risk._id ? "Sending…" : "Notify owner"}</button><Link to={`/risk/view?risk=${risk._id}`} className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold-light">Open <ExternalLink className="h-3.5 w-3.5" /></Link></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!visibleRows.length && <div className="p-10 text-center text-sm text-neutral-500">No risks match this follow-up view.</div>}
            </div>
          </div>
        </>
      )}
    </>
  );
}