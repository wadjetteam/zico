import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  Boxes,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileWarning,
  Landmark,
  Link2,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import api from "../api/client";
import PageHeader from "../components/PageHeader";
import { ErrorState, LoadingState } from "../components/States";
import { titleCase } from "../lib/format";

const SEVERITY_COLORS = { low: "#4ade80", medium: "#E8C96A", high: "#f59e0b", critical: "#ef4444" };
const PIE_COLORS = ["#D4AF37", "#E8C96A", "#B8860B", "#FFD700", "#8a6d1f", "#c9a227", "#6b5310", "#f2dc9a"];

const axis = { stroke: "#4b5563", fontSize: 11 };
const tooltipStyle = {
  contentStyle: {
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: 10,
    fontSize: 12,
    color: "#e5e5e5",
  },
};

function StatCard({ icon: Icon, label, value, accent, to }) {
  const body = (
    <motion.div whileHover={{ y: -2 }} className="card h-full p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-neutral-500">{label}</p>
          <p className="heading mt-2 text-3xl font-semibold text-neutral-50">{value}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-ink-deep">
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </span>
      </div>
    </motion.div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

function AttentionItem({ icon: Icon, label, value, to, tone }) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-lg border border-line/60 bg-white/[0.02] px-3.5 py-3 transition hover:border-gold/40 hover:bg-gold/5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-ink-deep">
        <Icon className="h-4 w-4" style={{ color: tone }} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-neutral-500">{label}</p>
        <p className="text-sm font-medium text-neutral-200">{value}</p>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const go = (to) => () => navigate(to);

  const load = () => {
    setError(null);
    api
      .get("/dashboard/summary")
      .then((r) => setData(r.data))
      .catch((e) => setError(e?.response?.data?.message || e.message));
  };

  useEffect(load, []);

  const { totals, attention, bySeverity, byCategory, trend, compliancePercent, frameworkCompliance } = data || {};

  const effDist = data?.controlEffectivenessDistribution || [];
  const effMax = Math.max(1, ...effDist.map((e) => e.value));
  const methodDist = data?.riskScoreMethodDistribution || [];
  const methodMax = Math.max(1, ...methodDist.map((e) => e.value));

  const categoryTotal = useMemo(() => (byCategory || []).reduce((a, c) => a + c.value, 0), [byCategory]);

  const catWithPct = useMemo(() => {
    const list = byCategory || [];
    const top = list.slice(0, 7);
    const rest = list.slice(7).reduce((a, c) => a + c.value, 0);
    const merged = rest > 0 ? [...top, { name: "Other", value: rest }] : top;
    const total = merged.reduce((a, c) => a + c.value, 0);
    return merged.map((c) => ({ ...c, pct: total ? Math.round((c.value / total) * 100) : 0 }));
  }, [byCategory]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState label="Compiling executive summary…" />;

  return (
    <>
      <PageHeader
        title="Executive Summary"
        subtitle="Consolidated view of the enterprise risk register, control coverage and assurance activity."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ShieldAlert} label="Open risks" value={totals.openRisks} accent="#E8C96A" to="/risk/view" />
        <StatCard icon={CheckCircle2} label="Closed risks" value={totals.closedRisks} accent="#4ade80" to="/risk/close" />
        <StatCard icon={Activity} label="Compliance coverage" value={`${compliancePercent}%`} accent="#D4AF37" to="/reporting/compliance" />
        <StatCard icon={Boxes} label="Assets tracked" value={totals.assets} accent="#B8860B" to="/assets/manage" />
        <StatCard icon={ClipboardCheck} label="Active audits" value={totals.activeAudits} accent="#60a5fa" to="/audit/active" />
        <StatCard icon={Landmark} label="Frameworks" value={totals.frameworks} accent="#a78bfa" to="/compliance/frameworks" />
        <StatCard icon={FileWarning} label="Policies" value={totals.policies} accent="#f472b6" to="/governance/policies" />
        <StatCard icon={AlertTriangle} label="High/Critical risks" value={totals.highCriticalRisks} accent="#ef4444" to="/risk/scoring" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Link2} label="Risk → control coverage" value={`${data.riskControlCoveragePercent ?? 0}%`} accent="#4ade80" to="/risk/view" />
        <StatCard icon={AlertTriangle} label="Unmitigated High/Critical" value={data.unmitigatedHighCriticalCount ?? 0} accent="#ef4444" to="/risk/view?hasControls=false" />
        <StatCard icon={SlidersHorizontal} label="Over-scope controls" value={data.orphanControlsCount ?? 0} accent="#E8C96A" to="/controls/management" />
        <StatCard icon={RefreshCcw} label="Pending re-baseline" value={data.pendingRebaselineCount ?? 0} accent="#fb923c" to="/risk/view?methodVersion=stale" />
        <StatCard icon={CalendarClock} label="Overdue reassessments" value={data.overdueReassessmentCount ?? 0} accent="#ef4444" to="/risk/scoring?reassessment=overdue" />
        <div className="card h-full p-5">
          <p className="text-[11px] uppercase tracking-wider text-neutral-500">Control effectiveness</p>
          <ul className="mt-3 space-y-2">
            {effDist.map((e) => (
              <li key={e.name} className="flex items-center gap-2 text-xs">
                <span className="w-28 shrink-0 truncate text-neutral-400">{e.name}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-deep">
                  <span
                    className={`block h-full rounded-full ${
                      e.name === "Effective"
                        ? "bg-emerald-400"
                        : e.name === "Partially Effective"
                        ? "bg-amber-400"
                        : e.name === "Ineffective"
                        ? "bg-red-400"
                        : "bg-neutral-600"
                    }`}
                    style={{ width: `${(e.value / effMax) * 100}%` }}
                  />
                </span>
                <span className="w-5 text-right font-mono text-neutral-300">{e.value}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-3 text-[11px] uppercase tracking-wider text-neutral-500">
            Risk score methods in use
          </p>
          <ul className="mt-2 space-y-1.5">
            {methodDist.map((m) => (
              <li key={m.name} className="flex items-center gap-2 text-xs">
                <span className="w-28 shrink-0 truncate text-neutral-400">{m.name.replace(/_/g, " ")}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-deep">
                  <span className="block h-full rounded-full bg-[#D4AF37]/70" style={{ width: `${(m.value / methodMax) * 100}%` }} />
                </span>
                <span className="w-5 text-right font-mono text-neutral-300">{m.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="card p-5">
          <h3 className="heading text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Register by category
          </h3>
          <div className="relative mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={catWithPct}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={92}
                  paddingAngle={2}
                  stroke="#101417"
                  className="cursor-pointer"
                  onClick={(entry) => navigate(entry.name === "Other" ? "/risk/view" : `/risk/view?category=${encodeURIComponent(entry.name)}`)}
                >
                  {catWithPct.map((entry, i) => (
                    <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, _n, item) => [`${v} risk${v === 1 ? "" : "s"} (${item.payload.pct}%)`, titleCase(item.payload.name)]}
                  {...tooltipStyle}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="heading text-3xl font-semibold text-neutral-50">{categoryTotal}</p>
                <p className="text-[10px] uppercase tracking-wider text-neutral-500">total risks</p>
              </div>
            </div>          </div>
          <ul className="mt-2 space-y-2">
            {catWithPct.map((c, i) => (
              <li key={c.name}>
                <Link
                  to={c.name === "Other" ? "/risk/view" : `/risk/view?category=${encodeURIComponent(c.name)}`}
                  className="flex items-center gap-2 rounded-md px-1.5 py-0.5 text-xs transition hover:bg-gold/5 hover:text-gold"
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="flex-1 truncate text-neutral-300">{titleCase(c.name)}</span>
                  <span className="font-mono text-neutral-500">{c.pct}%</span>
                  <span className="w-8 text-right font-mono text-neutral-300">{c.value}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5">
          <h3 className="heading text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Needs attention
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
            <AttentionItem icon={FileWarning} label="Policies in review" value={`${attention.policiesInReview} awaiting review`} to="/governance/policies" tone="#60a5fa" />
            <AttentionItem icon={AlertTriangle} label="Overdue policy reviews" value={`${attention.overduePolicies} past their review date`} to="/governance/policies" tone="#f59e0b" />
            <AttentionItem icon={ClipboardCheck} label="Pending exceptions" value={`${attention.pendingExceptions} awaiting decision`} to="/governance/exceptions" tone="#c9a227" />
            <AttentionItem icon={ShieldAlert} label="Expired exceptions" value={`${attention.expiredExceptions} beyond expiry`} to="/governance/exceptions" tone="#ef4444" />
            <AttentionItem icon={Activity} label="POAM actions" value={`${attention.poamActive} planned / in progress`} to="/risk/poam" tone="#a78bfa" />
            <AttentionItem icon={AlertTriangle} label="Open audit findings" value={`${attention.criticalFindings} high/critical of ${attention.openFindings} open`} to="/audit/manage" tone="#f472b6" />
            <AttentionItem icon={RefreshCcw} label="Change reviews pending" value={`${attention.changeTriggerPending} risks flagged by control changes`} to="/risk/view?changeTrigger=pending" tone="#38bdf8" />
            <AttentionItem icon={ClipboardCheck} label="Pending acceptances" value={`${attention.pendingAcceptances} awaiting formal sign-off`} to="/risk/view?treatment=pending_acceptance" tone="#a78bfa" />
            <AttentionItem icon={ShieldCheck} label="Pending second approvals" value={`${attention.pendingSecondApprovals} override decisions`} to="/risk/view" tone="#34d399" />
            <AttentionItem icon={CalendarClock} label="Overdue reassessments" value={`${attention.reassessmentOwnerAlerts} owner alerts · ${attention.reassessmentManagerEscalations} escalated`} to="/risk/scoring?reassessment=overdue" tone="#ef4444" />
          </div>
        </div>

        <div className="card p-5">
          <h3 className="heading text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Open risks by severity
          </h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySeverity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#242424" vertical={false} />
                <XAxis dataKey="name" tickFormatter={titleCase} {...axis} />
                <YAxis allowDecimals={false} {...axis} />
                <Tooltip cursor={{ fill: "rgba(212,175,55,0.06)" }} {...tooltipStyle} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} className="cursor-pointer" onClick={(entry) => navigate(`/risk/view?severity=${entry.name}`)}>
                  {bySeverity.map((s) => (
                    <Cell key={s.name} fill={SEVERITY_COLORS[s.name] || "#D4AF37"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 border-t border-line/60 pt-3">
            {bySeverity.map((s) => (
              <Link key={s.name} to={`/risk/view?severity=${s.name}`} className="text-center transition hover:bg-gold/5 rounded-lg py-1">
                <p className="heading text-lg font-semibold" style={{ color: SEVERITY_COLORS[s.name] || "#D4AF37" }}>
                  {s.value}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-neutral-500">{titleCase(s.name)}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="card p-5">
          <h3 className="heading text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Framework coverage
          </h3>
          <ul className="mt-4 space-y-4">
            {frameworkCompliance.map((f) => (
              <li key={f.id}>
                <Link
                  to={`/controls/management?framework=${f.id}`}
                  className="group flex items-baseline justify-between text-sm"
                  title={`Open controls of ${f.name}`}
                >
                  <span className="text-neutral-300 transition group-hover:text-gold">{f.name}</span>
                  <span className="text-gold">{f.percent}%</span>
                </Link>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-deep">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${f.percent}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full bg-gold-gradient"
                  />
                </div>
                <p className="mt-1 text-[11px] text-neutral-600">
                  {f.implemented} of {f.totalControls} controls implemented
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5 xl:col-span-2">
          <h3 className="heading text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Risks opened vs closed (6 months)
          </h3>
          <div className="mt-4 h-64 cursor-pointer" onClick={go("/risk/view")} title="Open the risk register">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#242424" vertical={false} />
                <XAxis dataKey="month" {...axis} />
                <YAxis allowDecimals={false} {...axis} />
                <Tooltip {...tooltipStyle} />
                <Legend formatter={(v) => <span className="text-[11px] capitalize text-neutral-400">{v}</span>} />
                <Line type="monotone" dataKey="opened" stroke="#D4AF37" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="closed" stroke="#4ade80" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
