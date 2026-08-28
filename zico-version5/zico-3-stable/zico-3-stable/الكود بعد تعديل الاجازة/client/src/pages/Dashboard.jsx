import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, AlertTriangle, Boxes, CalendarClock, CheckCircle2, ClipboardCheck, FileWarning, Landmark, ShieldAlert, ShieldCheck, TrendingUp, PieChart as PieIcon, BarChart3 } from "lucide-react";
import api from "../api/client";
import PageHeader from "../components/PageHeader";
import { ErrorState, LoadingState } from "../components/States";
import { titleCase } from "../lib/format";
import ComplianceModule from "./compliance-full/ComplianceModule";

const SEVERITY_COLORS = { low: "#4ade80", medium: "#E8C96A", high: "#f59e0b", critical: "#ef4444" };
const PIE_COLORS = ["#D4AF37", "#E8C96A", "#B8860B", "#FFD700", "#8a6d1f", "#c9a227", "#6b5310", "#f2dc9a"];
const axis = { stroke: "#4b5563", fontSize: 11 };
const tooltipStyle = { contentStyle: { background: "#111", border: "1px solid #2a2a2a", borderRadius: 10, fontSize: 12, color: "#e5e5e5" } };

const TABS = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "risk", label: "Risk Analytics", icon: BarChart3 },
  { id: "compliance", label: "Compliance", icon: PieIcon },
];

function StatCard({ icon: Icon, label, value, accent, to }) {
  const body = (
    <motion.div whileHover={{ y: -2 }} className="card h-full p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</p>
          <p className="heading mt-1 text-2xl font-semibold text-neutral-50">{value}</p>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-ink-deep">
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </span>
      </div>
    </motion.div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

function AttentionItem({ icon: Icon, label, value, to, tone }) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-lg border border-line/60 bg-white/[0.02] px-3 py-2.5 transition hover:border-gold/40 hover:bg-gold/5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-ink-deep">
        <Icon className="h-3.5 w-3.5" style={{ color: tone }} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</p>
        <p className="text-xs font-medium text-neutral-200 truncate">{value}</p>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const [riskRows, setRiskRows] = useState([]);

  const load = () => {
    setError(null);
    api.get("/dashboard/summary").then((r) => setData(r.data)).catch((e) => setError(e?.response?.data?.message || e.message));
  };

  useEffect(load, []);

  useEffect(() => {
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadRisks = () => api.get("/risks", { params: { pageSize: 200 } }).then((r) => mounted && setRiskRows(r.data.items || [])).catch(() => {});
    loadRisks();
    const timer = window.setInterval(loadRisks, 30000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, []);

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
  const riskAnalytics = useMemo(() => {
    const open = riskRows.filter((risk) => !["Closed", "closed", "Close"].includes(risk.status));
    const closed = riskRows.length - open.length;
    const aboveAppetite = riskRows.filter((risk) => risk.exceedsAppetite || (Number.isFinite(Number(risk.residualScore)) && Number.isFinite(Number(risk.appetiteLimit)) && Number(risk.residualScore) > Number(risk.appetiteLimit)));
    const treatments = Object.entries(open.reduce((counts, risk) => { const label = risk.treatment || risk.treatmentDecision || "Not set"; counts[label] = (counts[label] || 0) + 1; return counts; }, {})).map(([name, value]) => ({ name, value }));
    const owners = Object.entries(open.reduce((counts, risk) => { const name = risk.riskOwner?.name || risk.owner || "Unassigned"; counts[name] = (counts[name] || 0) + 1; return counts; }, {})).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
    return { open, closed, aboveAppetite, treatments, owners, closureRate: riskRows.length ? Math.round((closed / riskRows.length) * 100) : 0 };
  }, [riskRows]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState label="Compiling executive summary…" />;

  return (
    <>
      <PageHeader title="Executive Summary" subtitle="Consolidated view of enterprise risk, control coverage, and assurance activity." />

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id ? "bg-gold text-black" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={ShieldAlert} label="Open risks" value={totals.openRisks} accent="#E8C96A" to="/risk" />
            <StatCard icon={CheckCircle2} label="Closed risks" value={totals.closedRisks} accent="#4ade80" to="/risk/close" />
            <StatCard icon={Activity} label="Compliance" value={`${compliancePercent}%`} accent="#D4AF37" to="/dashboard?tab=compliance" />
            <StatCard icon={Boxes} label="Assets" value={totals.assets} accent="#B8860B" to="/assets/manage" />
            <StatCard icon={ClipboardCheck} label="Active audits" value={totals.activeAudits} accent="#60a5fa" to="/audit/active" />
            <StatCard icon={Landmark} label="Frameworks" value={totals.frameworks} accent="#a78bfa" to="/compliance/frameworks" />
            <StatCard icon={FileWarning} label="Policies" value={totals.policies} accent="#f472b6" to="/governance/policies" />
            <StatCard icon={AlertTriangle} label="High/Critical" value={totals.highCriticalRisks} accent="#ef4444" to="/risk" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-neutral-200 mb-3">Needs Attention</h3>
              <div className="grid grid-cols-1 gap-2">
                <AttentionItem icon={FileWarning} label="Policies in review" value={`${attention.policiesInReview} awaiting`} to="/governance/policies" tone="#60a5fa" />
                <AttentionItem icon={AlertTriangle} label="Overdue reviews" value={`${attention.overduePolicies} past date`} to="/governance/policies" tone="#f59e0b" />
                <AttentionItem icon={ClipboardCheck} label="Pending exceptions" value={`${attention.pendingExceptions} awaiting`} to="/governance/exceptions" tone="#c9a227" />
                <AttentionItem icon={ShieldAlert} label="Open audit findings" value={`${attention.criticalFindings} high/critical`} to="/audit/manage" tone="#f472b6" />
                <AttentionItem icon={CalendarClock} label="Overdue reassessments" value={`${attention.reassessmentOwnerAlerts} alerts`} to="/risk/scoring?reassessment=overdue" tone="#ef4444" />
              </div>
            </div>

            <div className="card p-4">
              <h3 className="text-sm font-semibold text-neutral-200 mb-3">Control Effectiveness</h3>
              <ul className="space-y-2">
                {effDist.map((e) => (
                  <li key={e.name} className="flex items-center gap-2 text-xs">
                    <span className="w-24 truncate text-neutral-400">{e.name}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-deep">
                      <span className={`block h-full rounded-full ${e.name === "Effective" ? "bg-emerald-400" : e.name === "Partially Effective" ? "bg-amber-400" : e.name === "Ineffective" ? "bg-red-400" : "bg-neutral-600"}`} style={{ width: `${(e.value / effMax) * 100}%` }} />
                    </span>
                    <span className="w-5 text-right font-mono text-neutral-300">{e.value}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-line pt-2 text-[10px] uppercase tracking-wider text-neutral-500">Risk Score Methods</p>
              <ul className="mt-1.5 space-y-1.5">
                {methodDist.map((m) => (
                  <li key={m.name} className="flex items-center gap-2 text-xs">
                    <span className="w-24 truncate text-neutral-400">{m.name.replace(/_/g, " ")}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-deep">
                      <span className="block h-full rounded-full bg-[#D4AF37]/70" style={{ width: `${(m.value / methodMax) * 100}%` }} />
                    </span>
                    <span className="w-5 text-right font-mono text-neutral-300">{m.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Risk Analytics Tab */}
      {activeTab === "risk" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatCard icon={ShieldAlert} label="Total risks" value={riskRows.length} accent="#E8C96A" to="/risk" />
            <StatCard icon={Activity} label="Open" value={riskAnalytics.open.length} accent="#f59e0b" to="/risk/view?status=Open" />
            <StatCard icon={CheckCircle2} label="Closed" value={riskAnalytics.closed} accent="#4ade80" to="/risk/close" />
            <StatCard icon={AlertTriangle} label="Above appetite" value={riskAnalytics.aboveAppetite.length} accent="#ef4444" to="/risk/treatment" />
            <StatCard icon={TrendingUp} label="Closure rate" value={`${riskAnalytics.closureRate}%`} accent="#60a5fa" to="/risk" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-neutral-200">Open Risks by Severity</h3>
                <Link to="/risk" className="text-xs text-gold hover:text-gold-light">Open risk register</Link>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bySeverity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#242424" vertical={false} />
                    <XAxis dataKey="name" tickFormatter={titleCase} {...axis} />
                    <YAxis allowDecimals={false} {...axis} />
                    <Tooltip cursor={{ fill: "rgba(212,175,55,0.06)" }} {...tooltipStyle} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} className="cursor-pointer" onClick={(entry) => navigate(`/risk/view?severity=${entry.name}`)}>
                      {bySeverity.map((s) => <Cell key={s.name} fill={SEVERITY_COLORS[s.name] || "#D4AF37"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2 border-t border-line/60 pt-2">
                {bySeverity.map((s) => (
                  <Link key={s.name} to={`/risk/view?severity=${s.name}`} className="text-center hover:bg-gold/5 rounded-lg py-1">
                    <p className="text-lg font-semibold" style={{ color: SEVERITY_COLORS[s.name] || "#D4AF37" }}>{s.value}</p>
                    <p className="text-[9px] uppercase text-neutral-500">{titleCase(s.name)}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-neutral-200">Register by Category</h3>
                <Link to="/risk" className="text-xs text-gold hover:text-gold-light">Open risk register</Link>
              </div>
              <div className="relative h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={catWithPct} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="#101417" className="cursor-pointer" onClick={(entry) => navigate(entry.name === "Other" ? "/risk/view" : `/risk/view?category=${encodeURIComponent(entry.name)}`)}>
                      {catWithPct.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, _n, item) => [`${v} risk${v === 1 ? "" : "s"} (${item.payload.pct}%)`, titleCase(item.payload.name)]} {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-neutral-50">{categoryTotal}</p>
                    <p className="text-[9px] uppercase text-neutral-500">total</p>
                  </div>
                </div>
              </div>
              <ul className="mt-1 space-y-1">
                {catWithPct.map((c, i) => (
                  <li key={c.name}>
                    <Link to={c.name === "Other" ? "/risk/view" : `/risk/view?category=${encodeURIComponent(c.name)}`} className="flex items-center gap-2 rounded-md px-1 py-0.5 text-xs hover:bg-gold/5 hover:text-gold">
                      <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="flex-1 truncate text-neutral-300">{titleCase(c.name)}</span>
                      <span className="font-mono text-neutral-500">{c.pct}%</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-neutral-200">Risks Opened vs Closed (6 Months)</h3>
              <Link to="/risk" className="text-xs text-gold hover:text-gold-light">Open risk register</Link>
            </div>
            <div className="h-56 cursor-pointer" onClick={() => navigate("/risk/view")}>
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

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card p-4">
              <div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-neutral-200">Treatment distribution</h3><Link to="/risk/treatment" className="text-xs text-gold hover:text-gold-light">Treatment queue</Link></div>
              <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={riskAnalytics.treatments} layout="vertical" margin={{ left: 20, right: 15 }}><CartesianGrid strokeDasharray="3 3" stroke="#242424" horizontal={false} /><XAxis type="number" allowDecimals={false} {...axis} /><YAxis type="category" dataKey="name" width={100} {...axis} /><Tooltip {...tooltipStyle} /><Bar dataKey="value" fill="#D4AF37" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div>
            </div>
            <div className="card p-4">
              <div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-neutral-200">Open risks by owner</h3><Link to="/risk/users" className="text-xs text-gold hover:text-gold-light">Manage owners</Link></div>
              <ul className="space-y-3">{riskAnalytics.owners.map((owner) => <li key={owner.name} className="flex items-center gap-3 text-xs"><span className="w-36 truncate text-neutral-400" title={owner.name}>{owner.name}</span><span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-deep"><span className="block h-full rounded-full bg-[#E8C96A]" style={{ width: `${(owner.value / Math.max(1, riskAnalytics.owners[0]?.value || 1)) * 100}%` }} /></span><Link to={`/risk/view?owner=${encodeURIComponent(owner.name)}`} className="w-6 text-right font-mono text-gold">{owner.value}</Link></li>)}</ul>
              <div className="mt-5 border-t border-line pt-3"><p className="text-[10px] uppercase tracking-wider text-neutral-500">Appetite exposure</p><Link to="/risk/treatment" className="mt-2 flex items-center justify-between text-sm hover:text-gold"><span className="text-neutral-300">Risks requiring treatment</span><span className="font-mono text-red-300">{riskAnalytics.aboveAppetite.length}</span></Link></div>
            </div>
          </div>

          <div className="card overflow-hidden p-4">
            <div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-neutral-200">Live risk register snapshot</h3><Link to="/risk" className="text-xs text-gold hover:text-gold-light">View all risks</Link></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="border-b border-line text-[10px] uppercase tracking-wider text-neutral-500"><tr><th className="px-3 py-2">Risk</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Inherent</th><th className="px-3 py-2">Residual</th><th className="px-3 py-2">Appetite</th><th className="px-3 py-2">Owner</th></tr></thead><tbody className="divide-y divide-line">{riskRows.slice(0, 12).map((risk) => <tr key={risk._id} className="hover:bg-white/[0.025]"><td className="px-3 py-3"><Link to={`/risk/view?risk=${risk._id}`} className="text-gold hover:text-gold-light">{risk.riskId || "—"}</Link><p className="mt-1 max-w-[280px] truncate text-neutral-300">{risk.title}</p></td><td className="px-3 py-3"><span className="text-neutral-400">{risk.status || "—"}</span></td><td className="px-3 py-3 text-neutral-300">{risk.inherentScore ?? risk.riskScore ?? "—"} <span className="text-neutral-600">{risk.inherentLevel || ""}</span></td><td className="px-3 py-3 text-neutral-300">{risk.residualScore ?? "—"} <span className="text-neutral-600">{risk.residualLevel || risk.overallRisk || ""}</span></td><td className={`px-3 py-3 ${risk.exceedsAppetite ? "text-red-300" : "text-emerald-300"}`}>{risk.exceedsAppetite ? `Above ${risk.appetiteLimit}` : "Within"}</td><td className="px-3 py-3 text-neutral-400">{risk.riskOwner?.name || risk.owner || "Unassigned"}</td></tr>)}</tbody></table></div>
          </div>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === "compliance" && (
        <ComplianceModule page="dashboard" />
      )}
    </>
  );
}
