import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, ClipboardCheck, RefreshCcw, SearchCheck, ShieldCheck } from "lucide-react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import { ErrorState, LoadingState } from "../../components/States";
import { fmtDate } from "../../lib/format";

const KIND_META = {
  "control-overdue": { label: "Control test overdue", icon: AlertTriangle, style: "border-red-800/60 bg-red-950/40 text-red-300" },
  "control-test": { label: "Control test due", icon: ClipboardCheck, style: "border-sky-800/60 bg-sky-950/40 text-sky-300" },
  campaign: { label: "Campaign due", icon: CalendarClock, style: "border-gold/40 bg-gold/10 text-gold-light" },
  gap: { label: "Gap remediation due", icon: SearchCheck, style: "border-amber-800/60 bg-amber-950/40 text-amber-300" },
  review: { label: "Framework review", icon: RefreshCcw, style: "border-indigo-800/60 bg-indigo-950/40 text-indigo-300" },
};

export default function ComplianceCalendar() {
  const [range, setRange] = useState(90);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get("/compliance/calendar", { params: { days: range } })
      .then((r) => setEvents(r.data.events || []))
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(load, [load]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const grouped = {};
  for (const ev of events) {
    const day = new Date(ev.date);
    day.setHours(0, 0, 0, 0);
    const key = day.toISOString();
    if (!grouped[key]) grouped[key] = { date: day, items: [] };
    grouped[key].items.push(ev);
  }
  const days = Object.values(grouped).sort((a, b) => a.date - b.date);

  const counts = {};
  for (const ev of events) counts[ev.kind] = (counts[ev.kind] || 0) + 1;

  return (
    <>
      <PageHeader
        title="Compliance Calendar"
        subtitle="Date-driven obligations: control testing, campaigns, gap remediation and framework reviews."
        actions={
          <select className="input w-40" value={range} onChange={(e) => setRange(Number(e.target.value))}>
            <option value={30}>Next 30 days</option>
            <option value={60}>Next 60 days</option>
            <option value={90}>Next 90 days</option>
          </select>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {Object.entries(KIND_META).map(([kind, meta]) => {
          const Icon = meta.icon;
          return (
            <div key={kind} className={`chip ${meta.style}`}>
              <Icon className="h-3 w-3" /> {meta.label}: {counts[kind] || 0}
            </div>
          );
        })}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <LoadingState label="Loading calendar…" />
      ) : (
        <div className="flex flex-col gap-3">
          {days.map((day) => {
            const isPast = day.date < today;
            return (
              <div key={day.date.toISOString()} className="card overflow-hidden">
                <div className="border-b border-line bg-white/[0.02] px-4 py-2.5 text-sm font-semibold text-neutral-200">
                  {fmtDate(day.date)}
                  {isPast && <span className="ml-2 text-[10px] font-normal uppercase tracking-wider text-red-400">overdue</span>}
                </div>
                <div className="divide-y divide-line/60">
                  {day.items.map((ev, i) => {
                    const meta = KIND_META[ev.kind] || KIND_META["control-test"];
                    const Icon = meta.icon;
                    return (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                        <Icon className={`h-4 w-4 shrink-0 ${meta.style.split(" ").pop()}`} />
                        <span className="text-neutral-200">{ev.label}</span>
                        {ev.framework && <span className="text-xs text-neutral-500">{ev.framework}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {!days.length && <div className="card p-10 text-center text-sm text-neutral-500"><ShieldCheck className="mx-auto mb-2 h-6 w-6 text-neutral-700" />Nothing scheduled in this window.</div>}
        </div>
      )}
    </>
  );
}
