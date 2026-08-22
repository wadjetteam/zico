import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AlertTriangle, ArrowRight, TrendingUp } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import { ErrorState, LoadingState } from "../../components/States";
import { fmtDate } from "../../lib/format";

const heatColor = (p) => {
  if (p == null) return "bg-neutral-900 text-neutral-600";
  if (p >= 80) return "bg-emerald-950/70 text-emerald-300";
  if (p >= 60) return "bg-lime-950/60 text-lime-300";
  if (p >= 40) return "bg-amber-950/50 text-amber-300";
  if (p >= 20) return "bg-orange-950/50 text-orange-300";
  return "bg-red-950/60 text-red-300";
};

export default function ComplianceDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get("/compliance/dashboard")
      .then((r) => setData(r.data))
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (loading || !data) return <LoadingState label="Loading compliance dashboard…" />;

  const trendData = data.trend
    .map((t) => ({ name: t.label, percent: t.percent }))
    .filter((t) => t.percent != null);
  const overall = data.heatmapFrameworks.length
    ? data.heatmapFrameworks.map((f) => ({ framework: f.name, percent: data.heatmap.map((row) => row[String(f.id)]).filter((p) => p != null) }))
    : [];
  const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);

  return (
    <>
      <PageHeader title="Compliance Dashboard" subtitle="Implementation heatmap, testing trend and outstanding obligations at a glance." />

      <div className="grid gap-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card overflow-hidden lg:col-span-2">
            <div className="border-b border-line bg-white/[0.02] px-4 py-3 text-sm font-semibold text-neutral-200">
              Compliance heatmap by domain × framework (% fully / largely implemented)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-white/[0.02]">
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Domain</th>
                    {data.heatmapFrameworks.map((f) => (
                      <th key={f.id} className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{f.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.heatmap.map((row) => (
                    <tr key={row.domain} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-2 font-medium text-neutral-300">{row.domain}</td>
                      {data.heatmapFrameworks.map((f) => {
                        const p = row[String(f.id)];
                        return (
                          <td key={f.id} className="px-2 py-2 text-center">
                            <button
                              className={`inline-flex h-8 min-w-14 items-center justify-center rounded-md border border-line px-2 text-xs font-semibold transition hover:scale-105 hover:border-gold/50 ${heatColor(p)}`}
                              title={`Open controls of ${f.name}${row.domain ? ` (${row.domain})` : ""}`}
                              onClick={() => navigate(`/controls/management?framework=${f.id}`)}
                              disabled={p == null}
                            >
                              {p == null ? "—" : `${p}%`}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-200">
              <TrendingUp className="h-4 w-4 text-gold" /> Testing trend
            </div>
            <div className="h-44 cursor-pointer" onClick={() => navigate("/compliance/campaigns")} title="Open assessment campaigns">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -22 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#141417", border: "1px solid #2a2a2e", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}%`, "Pass rate"]} />
                  <Line type="monotone" dataKey="percent" stroke="#D4AF37" strokeWidth={2} dot={{ r: 3, fill: "#D4AF37" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {!trendData.length && <p className="text-xs text-neutral-500">Record assessments to see the pass-rate trend.</p>}
            <div className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3">
              {overall.map((f) => (
                <Link key={f.framework} to={`/controls/management?framework=${data.heatmapFrameworks.find((x) => x.name === f.framework)?.id || ""}`} className="flex items-center justify-between rounded-md px-1 text-xs transition hover:bg-gold/5">
                  <span className="text-neutral-400">{f.framework}</span>
                  <span className={f.percent.length ? "font-semibold text-neutral-200" : "text-neutral-600"}>{avg(f.percent) != null ? `${avg(f.percent)}%` : "—"}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-neutral-200">Overdue control tests</h2>
            <div className="flex flex-col gap-2">
              {data.overdueTests.slice(0, 6).map((c) => (
                <button key={c._id} className="rounded-lg border border-line bg-white/[0.02] px-3 py-2 text-left text-xs transition hover:border-gold/40" onClick={() => navigate("/controls/management")}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-200">{c.controlId} — {c.name}</span>
                    <AlertTriangle className="h-3 w-3 text-red-400" />
                  </div>
                  <div className="mt-0.5 text-neutral-500">due {fmtDate(c.nextTestDueAt)} · {c.framework?.name}</div>
                </button>
              ))}
              {!data.overdueTests.length && <p className="text-sm text-neutral-500">No overdue tests.</p>}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-neutral-200">Open gaps by severity</h2>
            <div className="flex flex-col gap-2.5">
              {data.gapsBySeverity.map((g) => (
                <Link key={g.severity} to={`/compliance/gaps?severity=${g.severity}`} className="block rounded-md px-1 transition hover:bg-gold/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">{g.severity}</span>
                    <span className="font-semibold text-neutral-200">{g.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full ${g.severity === "Critical" ? "bg-red-500" : g.severity === "High" ? "bg-orange-500" : g.severity === "Medium" ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min(100, g.count * 25)}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
            <Link to="/compliance/gaps" className="btn-ghost mt-4">Manage gaps <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-neutral-200">Shortcuts</h2>
            <div className="flex flex-col gap-2">
              {[
                { to: "/compliance/calendar", label: "Compliance calendar" },
                { to: "/compliance/crosswalks", label: "Crosswalk explorer" },
                { to: "/compliance/campaigns", label: "Assessment campaigns" },
                { to: "/audit/manage", label: "Manage audits" },
              ].map((s) => (
                <Link key={s.to} to={s.to} className="flex items-center justify-between rounded-lg border border-line bg-white/[0.02] px-3 py-2.5 text-sm text-neutral-300 transition hover:border-gold/40 hover:text-gold">
                  {s.label} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
