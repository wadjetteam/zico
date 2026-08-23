import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, CalendarClock, CheckSquare, FileWarning, Landmark, ScrollText, ShieldAlert, TrendingUp, Users } from "lucide-react";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import { ErrorState, LoadingState } from "../../components/States";
import { chipClass, fmtDate, SEVERITY_STYLES } from "../../lib/format";

const STAGE_COLORS = {
  Planning: "#38bdf8",
  Fieldwork: "#818cf8",
  "Findings Review": "#f59e0b",
  Reporting: "#d4af37",
  CAPA: "#34d399",
  Closed: "#52525b",
};

const KIND_CHIP = {
  "control-test": "border-sky-800/60 bg-sky-950/40 text-sky-300",
  audit: "border-indigo-800/60 bg-indigo-950/40 text-indigo-300",
  followup: "border-amber-800/60 bg-amber-950/40 text-amber-300",
  committee: "border-gold/40 bg-gold/10 text-gold-light",
};

const KIND_LABEL = { "control-test": "Control test", audit: "Audit", followup: "Follow-up", committee: "Committee" };

const KPI = ({ label, value, sub, icon: Icon, tone, to }) => {
  const body = (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-semibold text-neutral-100">{value}</div>
          <div className="mt-1 text-xs text-neutral-400">{label}</div>
          {sub && <div className="mt-0.5 text-[11px] text-neutral-600">{sub}</div>}
        </div>
        <span className="rounded-lg border border-line bg-white/[0.02] p-2" style={{ color: tone }}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
  return to ? (
    <Link to={to} className="transition hover:border-gold/40" title={`Open ${label}`}>
      {body}
    </Link>
  ) : (
    body
  );
};

export default function ExecutiveDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get("/governance/executive-dashboard")
      .then((r) => setData(r.data))
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (loading || !data) return <LoadingState label="Aggregating organization-wide posture…" />;

  const { kpis = {}, trend = [], auditsByStage = [], topItems = [], policyHealth = {}, calendar = [] } = data;
  const trendData = (trend || []).map((t) => ({ name: t.month, percent: t.percent }));

  return (
    <>
      <PageHeader title="Executive Dashboard" subtitle="Organization-wide governance, risk, and compliance posture — read-only rollup across all modules." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPI label="Overall compliance" value={`${kpis?.compliancePercent ?? 0}%`} icon={TrendingUp} tone="#d4af37" sub="fully / largely implemented controls" to="/reporting/compliance" />
        <KPI label="Open critical findings" value={kpis?.openCriticalFindings ?? 0} icon={ShieldAlert} tone="#ef4444" sub="critical & high severity" to="/compliance/gaps" />
        <KPI label="Policies pending approval" value={kpis?.policiesPendingApproval ?? 0} icon={FileWarning} tone="#f59e0b" sub="in approval or review" to="/governance/policies" />
        <KPI label="Overdue CAPAs" value={kpis?.overdueCapas ?? 0} icon={ScrollText} tone="#fb923c" sub="past due date, not closed" to="/audit/manage" />
        <KPI label="Audits in progress" value={kpis?.auditsInProgress ?? 0} icon={Users} tone="#38bdf8" sub={`${kpis?.activeExceptionTypes ?? 0} active exception types`} to="/audit/active" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPI label="Attestation coverage" value={`${kpis?.attestationCompletionPercent ?? 0}%`} icon={CheckSquare} tone="#34d399" sub="published policies with attestations" to="/governance/policies" />
        <KPI label="Approval pipeline" value={kpis?.pendingApproval ?? 0} icon={FileWarning} tone="#f59e0b" sub={`${kpis?.pendingReview ?? 0} in review`} to="/governance/policies" />
        <KPI label="Open exceptions" value={kpis?.openExceptionsCount ?? 0} icon={ShieldAlert} tone="#fb923c" sub={`${kpis?.expiringExceptionsCount ?? 0} expiring within 90 days`} to="/governance/policies" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
              <TrendingUp className="h-4 w-4 text-gold" /> Compliance trend — 12 months
            </div>
            <Link to="/compliance/dashboard" className="text-xs text-gold hover:underline">Compliance module →</Link>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -22 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#141417", border: "1px solid #2a2a2e", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v ?? "—"}%`, "Assessed pass rate"]} />
                <Line type="monotone" dataKey="percent" stroke="#D4AF37" strokeWidth={2} dot={{ r: 3, fill: "#D4AF37" }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-[11px] text-neutral-600">Percentage of controls assessed that month with a Pass result. Months without assessments are blank.</p>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-neutral-200">Audit status summary</div>
            <Link to="/audit/manage" className="text-xs text-gold hover:underline">Audits →</Link>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={auditsByStage}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  stroke="none"
                  className="cursor-pointer"
                  onClick={() => navigate("/audit/active")}
                >
                  {auditsByStage.map((s) => (
                    <Cell key={s.name} fill={STAGE_COLORS[s.name] || "#52525b"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#141417", border: "1px solid #2a2a2e", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {!auditsByStage.length && <p className="text-center text-xs text-neutral-600">No engagements yet.</p>}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {auditsByStage.map((s) => (
              <Link key={s.name} to="/audit/active" className="flex items-center gap-1.5 text-xs text-neutral-400 transition hover:text-gold">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STAGE_COLORS[s.name] || "#52525b" }} />
                {s.name}: {s.value}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line bg-white/[0.02] px-5 py-4">
            <div>
              <h2 className="heading text-sm font-semibold text-neutral-100">Top open risks / gaps</h2>
              <p className="mt-0.5 text-xs text-neutral-500">Highest-severity open items across compliance gaps and audit findings.</p>
            </div>
            <Link to="/compliance/gaps" className="text-xs text-gold hover:underline">Manage gaps →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line bg-white/[0.02]">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Severity</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Item</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Type</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Owner</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Due</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {topItems.map((item, i) => (
                  <tr key={`${item.kind}-${item.ref}-${i}`} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-2.5">
                      <span className={`chip ${SEVERITY_STYLES[item.severity.toLowerCase()] || SEVERITY_STYLES.medium}`}>{item.severity}</span>
                    </td>
                    <td className="max-w-[280px] px-4 py-2.5">
                      <div className="truncate text-neutral-200" title={item.title}>{item.title}</div>
                      <div className="font-mono text-[11px] text-neutral-600">{item.ref}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`chip ${item.kind === "Gap" ? "border-sky-800/60 bg-sky-950/40 text-sky-300" : "border-indigo-800/60 bg-indigo-950/40 text-indigo-300"}`}>{item.kind}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-neutral-300">{item.owner || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-neutral-400">{fmtDate(item.dueDate)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Link to={item.link} className="text-xs text-gold hover:underline">
                        <ArrowRight className="inline h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {!topItems.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-neutral-600">No open gaps or findings.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-neutral-200">Policy health</div>
              <Link to="/governance/policies" className="text-xs text-gold hover:underline">Policies →</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/governance/policies" className="rounded-lg border border-line bg-white/[0.02] p-3 transition hover:border-gold/40">
                <div className={`text-xl font-semibold ${(policyHealth.overdue ?? 0) ? "text-red-400" : "text-neutral-100"}`}>{policyHealth.overdue ?? 0}</div>
                <div className="mt-0.5 text-[11px] text-neutral-500">Overdue for review</div>
              </Link>
              <Link to="/governance/policies" className="rounded-lg border border-line bg-white/[0.02] p-3 transition hover:border-gold/40">
                <div className="text-xl font-semibold text-amber-300">{policyHealth.dueSoon ?? 0}</div>
                <div className="mt-0.5 text-[11px] text-neutral-500">Due within 90 days</div>
              </Link>
            </div>
            <div className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3">
              {(policyHealth.upcomingReviews || []).map((p) => (
                <Link key={p._id} to={`/governance/policies/${p._id}`} className="flex items-center justify-between rounded-md px-1 text-xs transition hover:bg-gold/5">
                  <span className="max-w-[220px] truncate text-neutral-400" title={`${p.policyId} — ${p.title}`}>{p.title}</span>
                  <span className="whitespace-nowrap text-neutral-500">{fmtDate(p.nextReviewAt)}</span>
                </Link>
              ))}
              {!policyHealth.upcomingReviews.length && <p className="text-xs text-neutral-600">No review dates scheduled.</p>}
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
                <CalendarClock className="h-4 w-4 text-gold" /> Upcoming governance calendar
              </div>
              <Link to="/compliance/calendar" className="text-xs text-gold hover:underline">Compliance calendar →</Link>
            </div>
            <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-1">
              {calendar.map((ev, i) => (
                <Link key={`${ev.kind}-${i}`} to={ev.link} className="flex items-start gap-2 rounded-lg border border-line bg-white/[0.02] px-3 py-2 transition hover:border-gold/40">
                  <span className={`chip mt-0.5 shrink-0 ${KIND_CHIP[ev.kind] || "border-neutral-700 bg-neutral-900 text-neutral-400"}`}>{KIND_LABEL[ev.kind] || ev.kind}</span>
                  <div className="min-w-0">
                    <div className="truncate text-xs text-neutral-200" title={ev.label}>{ev.label}</div>
                    <div className="text-[11px] text-neutral-600">{fmtDate(ev.date)}</div>
                  </div>
                </Link>
              ))}
              {!calendar.length && <p className="text-sm text-neutral-600">No obligations in the next 90 days.</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white/[0.02] px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Landmark className="h-4 w-4 text-gold" />
          Governance committees
        </div>
        <Link to="/governance/committees" className="btn-ghost px-3 py-1.5 text-xs">
          Manage committees <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link to="/governance/roles" className="btn-ghost px-3 py-1.5 text-xs">
          Roles & permissions <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link to="/reporting/executive" className="btn-ghost px-3 py-1.5 text-xs">
          Risk dashboard <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </>
  );
}
