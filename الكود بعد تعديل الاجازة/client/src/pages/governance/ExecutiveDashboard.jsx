import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, CalendarClock, CheckSquare, FileWarning, Landmark, ScrollText, ShieldAlert, TrendingUp, Users, Activity, PieChart as PieIcon, BarChart3, Clock } from "lucide-react";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import { ErrorState, LoadingState } from "../../components/States";

const STAGE_COLORS = { Planning: "#38bdf8", Fieldwork: "#818cf8", "Findings Review": "#f59e0b", Reporting: "#d4af37", CAPA: "#34d399", Closed: "#52525b" };

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "audits", label: "Audits & Findings", icon: PieIcon },
  { id: "policies", label: "Policies & Exceptions", icon: BarChart3 },
];

const KPI = ({ label, value, sub, icon: Icon, tone, to }) => {
  const body = (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-semibold text-neutral-100">{value}</div>
          <div className="mt-1 text-xs text-neutral-400">{label}</div>
          {sub && <div className="mt-0.5 text-[11px] text-neutral-600">{sub}</div>}
        </div>
        <span className="rounded-lg border border-line bg-white/[0.02] p-2" style={{ color: tone }}><Icon className="h-4 w-4" /></span>
      </div>
    </div>
  );
  return to ? <Link to={to} className="transition hover:border-gold/40" title={`Open ${label}`}>{body}</Link> : body;
};

export default function ExecutiveDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get("/governance/executive-dashboard").then((r) => setData(r.data)).catch((e) => setError(e?.response?.data?.message || e.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (loading || !data) return <LoadingState label="Aggregating organization-wide posture…" />;

  const { kpis = {}, trend = [], auditsByStage = [], topItems = [], calendar = [] } = data;
  const trendData = (trend || []).map((t) => ({ name: t.month, percent: t.percent }));

  return (
    <>
      <PageHeader title="Executive Dashboard" subtitle="Organization-wide governance, risk, and compliance posture — read-only rollup across all modules." />

      <div className="flex gap-2 mb-5">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? "bg-gold text-black" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"}`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <KPI label="Overall compliance" value={`${kpis?.compliancePercent ?? 0}%`} icon={TrendingUp} tone="#d4af37" to="/compliance/dashboard" />
            <KPI label="Open critical findings" value={kpis?.openCriticalFindings ?? 0} icon={ShieldAlert} tone="#ef4444" to="/compliance/gaps" />
            <KPI label="Policies pending" value={kpis?.policiesPendingApproval ?? 0} icon={FileWarning} tone="#f59e0b" to="/governance/policies" />
            <KPI label="Overdue CAPAs" value={kpis?.overdueCapas ?? 0} icon={ScrollText} tone="#fb923c" to="/audit/manage" />
            <KPI label="Audits in progress" value={kpis?.auditsInProgress ?? 0} icon={Users} tone="#38bdf8" to="/audit/active" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <KPI label="Attestation coverage" value={`${kpis?.attestationCompletionPercent ?? 0}%`} icon={CheckSquare} tone="#34d399" to="/governance/policies" />
            <KPI label="Approval pipeline" value={kpis?.pendingApproval ?? 0} icon={FileWarning} tone="#f59e0b" to="/governance/policies" />
            <KPI label="Open exceptions" value={kpis?.openExceptionsCount ?? 0} icon={ShieldAlert} tone="#fb923c" to="/governance/exceptions" />
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-neutral-200">Compliance trend — 12 months</span>
              <Link to="/compliance/dashboard" className="text-xs text-gold hover:underline">Compliance module →</Link>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -22 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#141417", border: "1px solid #2a2a2e", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v ?? "—"}%`, "Pass rate"]} />
                  <Line type="monotone" dataKey="percent" stroke="#D4AF37" strokeWidth={2} dot={{ r: 3, fill: "#D4AF37" }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === "audits" && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-neutral-200">Audit status summary</span>
                <Link to="/audit/manage" className="text-xs text-gold hover:underline">Audits →</Link>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={auditsByStage} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="none" className="cursor-pointer" onClick={() => navigate("/audit/active")}>
                      {auditsByStage.map((s) => <Cell key={s.name} fill={STAGE_COLORS[s.name] || "#52525b"} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#141417", border: "1px solid #2a2a2e", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {auditsByStage.map((s) => (
                  <Link key={s.name} to="/audit/active" className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-gold">
                    <span className="h-2 w-2 rounded-full" style={{ background: STAGE_COLORS[s.name] || "#52525b" }} /> {s.name} ({s.value})
                  </Link>
                ))}
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-neutral-200">Upcoming calendar</span>
                <Link to="/audit/manage" className="text-xs text-gold hover:underline">View all →</Link>
              </div>
              <div className="space-y-2">
                {calendar.slice(0, 5).map((item, i) => (
                  <Link key={i} to={item.link || "/audit/manage"} className="flex items-center gap-3 rounded-lg border border-line/60 bg-white/[0.02] p-2.5 hover:border-gold/40">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold/10"><CalendarClock className="h-4 w-4 text-gold" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-neutral-200 truncate">{item.title}</p>
                      <p className="text-[10px] text-neutral-500">{item.date}</p>
                    </div>
                  </Link>
                ))}
                {calendar.length === 0 && <p className="text-xs text-neutral-500">No upcoming events.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "policies" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KPI label="Total policies" value={kpis?.totalPolicies ?? 0} icon={FileWarning} tone="#d4af37" to="/governance/policies" />
            <KPI label="Pending review" value={kpis?.policiesPendingReview ?? 0} icon={Clock} tone="#f59e0b" to="/governance/policies" />
            <KPI label="Pending approval" value={kpis?.policiesPendingApproval ?? 0} icon={FileWarning} tone="#fb923c" to="/governance/policies" />
            <KPI label="Published" value={kpis?.publishedPolicies ?? 0} icon={CheckSquare} tone="#34d399" to="/governance/policies" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <KPI label="Open exceptions" value={kpis?.openExceptionsCount ?? 0} icon={ShieldAlert} tone="#fb923c" to="/governance/exceptions" />
            <KPI label="Expiring (90d)" value={kpis?.expiringExceptionsCount ?? 0} icon={CalendarClock} tone="#ef4444" to="/governance/exceptions" />
            <KPI label="Attestation %" value={`${kpis?.attestationCompletionPercent ?? 0}%`} icon={CheckSquare} tone="#34d399" to="/governance/policies" />
          </div>
          {topItems?.length > 0 && (
            <div className="card p-4">
              <span className="text-sm font-semibold text-neutral-200">Items needing attention</span>
              <div className="mt-3 space-y-2">
                {topItems.slice(0, 5).map((item, i) => (
                  <Link key={i} to={item.link || "/governance/policies"} className="flex items-center gap-3 rounded-lg border border-line/60 bg-white/[0.02] p-2.5 hover:border-gold/40">
                    <span className={`grid h-8 w-8 place-items-center rounded-lg ${item.severity === "high" ? "bg-red-950/40 text-red-300" : "bg-amber-950/40 text-amber-300"}`}>
                      {item.type === "policy" ? <FileWarning className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-neutral-200 truncate">{item.title}</p>
                      <p className="text-[10px] text-neutral-500">{item.reason}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
