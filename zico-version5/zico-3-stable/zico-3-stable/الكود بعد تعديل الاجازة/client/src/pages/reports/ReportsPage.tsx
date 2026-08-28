import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle, BarChart3, Building2, CheckCircle2, ClipboardCheck, Download,
  FileText, Gauge, LineChart as LineChartIcon, PieChart as PieChartIcon, Search,
  Shield, ShieldCheck, Target, TrendingUp,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import api from "../../api/client";

const MODULES = [
  { id: "all", label: "All Reports", icon: FileText },
  { id: "compliance", label: "Compliance", icon: Shield },
  { id: "risk", label: "Risk", icon: AlertTriangle },
  { id: "audit", label: "Audit", icon: Search },
  { id: "asset", label: "Asset", icon: Building2 },
  { id: "governance", label: "Governance", icon: ShieldCheck },
  { id: "controls", label: "Controls", icon: ClipboardCheck },
  { id: "platform", label: "Platform", icon: BarChart3 },
  { id: "context", label: "Context", icon: Building2 },
];

const CHART_COLORS = ["#D4AF37", "#60a5fa", "#ef4444", "#f59e0b", "#4ade80", "#a78bfa", "#f472b6"];
const tooltipStyle = { contentStyle: { background: "#141417", border: "1px solid #383838", borderRadius: 8, color: "#f5f5f5" } };

function StatCard({ icon: Icon, label, value, hint, tone = "#D4AF37" }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-50">{value}</p>
          {hint && <p className="mt-1 text-[11px] text-neutral-500">{hint}</p>}
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-ink-deep">
          <Icon size={16} style={{ color: tone }} />
        </span>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <section className={`card p-4 ${className}`}>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-100">{title}</h2>
          {subtitle && <p className="mt-1 text-[11px] text-neutral-500">{subtitle}</p>}
        </div>
      </div>
      <div className="h-64">{children}</div>
    </section>
  );
}

export default function ReportsPage({ moduleFilter = "all" }) {
  const [activeModule, setActiveModule] = useState(moduleFilter);
  const [downloading, setDownloading] = useState(null);
  const summaryQuery = useQuery({ queryKey: ["reports", "executive-summary"], queryFn: () => api.get("/dashboard/summary").then((r) => r.data), staleTime: 30_000 });
  const risksQuery = useQuery({ queryKey: ["reports", "risk-register"], queryFn: () => api.get("/risks", { params: { pageSize: 500 } }).then((r) => r.data), staleTime: 30_000 });
  const treatmentsQuery = useQuery({ queryKey: ["reports", "risk-treatments"], queryFn: () => api.get("/v1/treatments").then((r) => r.data), staleTime: 30_000 });
  const reportsQuery = useQuery({
    queryKey: ["reports", activeModule],
    queryFn: () => api.get("/reports", { params: activeModule !== "all" ? { module: activeModule } : {} }).then((r) => r.data),
  });
  const inboxQuery = useQuery({ queryKey: ["reports", "inbox"], queryFn: () => api.get("/reports/inbox").then((r) => r.data), staleTime: 60_000 });

  const summary = summaryQuery.data || {};
  const totals = summary.totals || {};
  const attention = summary.attention || {};
  const risks = risksQuery.data?.items || [];
  const treatments = treatmentsQuery.data?.items || [];
  const reports = reportsQuery.data?.items || [];
  const riskMix = useMemo(() => ["Critical", "High", "Medium", "Low"].map((name) => ({ name, value: (summary.bySeverity || []).find((x) => x.name === name)?.value || 0 })), [summary]);
  const radar = [
    { subject: "Risk coverage", value: summary.riskControlCoveragePercent || 0, fullMark: 100 },
    { subject: "Compliance", value: summary.compliancePercent || 0, fullMark: 100 },
    { subject: "Control effectiveness", value: summary.controlEffectivenessPercent || 0, fullMark: 100 },
    { subject: "Treatment progress", value: treatments.length ? Math.round(treatments.reduce((sum, treatment) => sum + Number(treatment.progress_percentage || 0), 0) / treatments.length) : 0, fullMark: 100 },
    { subject: "Audit readiness", value: Math.max(0, 100 - ((attention.openFindings || 0) * 10)), fullMark: 100 },
    { subject: "Asset visibility", value: totals.assets ? 100 : 0, fullMark: 100 },
  ];
  const heatmap = Array.from({ length: 5 }, (_, likelihood) => Array.from({ length: 5 }, (_, impact) => ({
    likelihood: likelihood + 1,
    impact: impact + 1,
    count: risks.filter((r) => Number(r.likelihood) === likelihood + 1 && Number(r.impact || r.inherentImpact) === impact + 1).length,
  })));

  const handleDownload = async (reportId, format) => {
    setDownloading(`${reportId}-${format}`);
    try {
      const token = localStorage.getItem("wadjet_token");
      const response = await fetch(`/api/reports/generate?reportId=${reportId}&format=${format}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 401) return window.location.replace("/login");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${reportId}_${Date.now()}.${format}`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Failed to generate report: ${error.message}`);
    } finally {
      setDownloading(null);
    }
  };

  if (summaryQuery.isLoading || risksQuery.isLoading) return <div className="text-neutral-400">Compiling executive GRC report...</div>;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold">WADJET GRC / BOARD REPORTING</p>
          <h1 className="mt-1 text-3xl font-semibold text-neutral-50">Enterprise Risk & Assurance</h1>
          <p className="mt-1 text-sm text-neutral-400">Current exposure, control confidence, compliance posture, and decisions requiring management attention.</p>
        </div>
        <div className="text-right text-[11px] text-neutral-500">As of {new Date().toLocaleDateString("en-GB")}<br />Confidential — Executive use</div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard icon={AlertTriangle} label="Open risks" value={totals.openRisks || 0} hint={`${totals.highCriticalRisks || 0} high / critical`} tone="#ef4444" />
        <StatCard icon={Target} label="Outside appetite" value={risks.filter((r) => r.exceedsAppetite).length} hint="Requires decision" tone="#f59e0b" />
        <StatCard icon={ShieldCheck} label="Compliance" value={`${summary.compliancePercent || 0}%`} hint="Implemented controls" />
        <StatCard icon={ClipboardCheck} label="Risk coverage" value={`${summary.riskControlCoveragePercent || 0}%`} hint="Open risks with controls" tone="#60a5fa" />
        <StatCard icon={TrendingUp} label="Open findings" value={attention.openFindings || 0} hint={`${attention.criticalFindings || 0} critical`} tone="#f59e0b" />
        <StatCard icon={CheckCircle2} label="Closed risks" value={totals.closedRisks || 0} hint="Lifecycle completed" tone="#4ade80" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Executive posture" subtitle="Balanced view of the platform's current control environment">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radar} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#3f3f46" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#a3a3a3", fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#737373", fontSize: 9 }} />
              <Radar dataKey="value" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.3} />
              <Tooltip {...tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Risk severity distribution" subtitle="Open exposure by inherent severity">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={riskMix} layout="vertical" margin={{ left: 10, right: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#292929" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fill: "#737373", fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#a3a3a3", fontSize: 11 }} width={55} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>{riskMix.map((entry, index) => <Cell key={entry.name} fill={["#ef4444", "#f59e0b", "#D4AF37", "#4ade80"][index]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Risk matrix" subtitle="Likelihood × impact concentration">
          <div className="grid h-full grid-cols-5 gap-1">
            {heatmap.flat().map((cell) => {
              const score = cell.likelihood * cell.impact;
              const color = score >= 16 ? "bg-red-500/80" : score >= 10 ? "bg-orange-500/70" : score >= 5 ? "bg-gold/60" : "bg-emerald-500/50";
              return <div key={`${cell.likelihood}-${cell.impact}`} className={`flex flex-col items-center justify-center rounded ${color} text-xs text-white`} title={`Likelihood ${cell.likelihood}, impact ${cell.impact}`}><b>{cell.count}</b><span className="text-[8px] opacity-70">{score}</span></div>;
            })}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Risk trend" subtitle="Six-month movement of opened and closed risks">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={summary.trend || []}><CartesianGrid strokeDasharray="3 3" stroke="#292929" /><XAxis dataKey="month" tick={{ fill: "#737373", fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fill: "#737373", fontSize: 10 }} /><Tooltip {...tooltipStyle} /><Line type="monotone" dataKey="opened" name="Opened" stroke="#ef4444" strokeWidth={2} /><Line type="monotone" dataKey="closed" name="Closed" stroke="#4ade80" strokeWidth={2} /></LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Framework compliance" subtitle="Implementation confidence by framework">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={(summary.frameworkCompliance || []).slice(0, 8)}><CartesianGrid strokeDasharray="3 3" stroke="#292929" /><XAxis dataKey="name" tick={{ fill: "#737373", fontSize: 9 }} /><YAxis domain={[0, 100]} tick={{ fill: "#737373", fontSize: 10 }} /><Tooltip {...tooltipStyle} /><Bar dataKey="percent" name="Coverage %" fill="#D4AF37" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Control effectiveness" subtitle="Assurance quality of linked controls">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart><Pie data={summary.controlEffectivenessDistribution || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="72%" label={({ name, value }) => `${name}: ${value}`}>{(summary.controlEffectivenessDistribution || []).map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}</Pie><Tooltip {...tooltipStyle} /></PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Management attention" subtitle="Items requiring ownership or escalation">
          <div className="space-y-2 overflow-auto">
            {[["Policies in review", attention.policiesInReview], ["Pending exceptions", attention.pendingExceptions], ["Active POAM", attention.poamActive], ["Overdue reassessments", summary.overdueReassessmentCount], ["Unmitigated high/critical", summary.unmitigatedHighCriticalCount]].map(([label, value]) => <div key={label} className="flex items-center justify-between rounded-lg border border-line/60 bg-white/[0.02] px-3 py-2.5"><span className="text-xs text-neutral-300">{label}</span><b className={value > 0 ? "text-orange-400" : "text-emerald-400"}>{value || 0}</b></div>)}
          </div>
        </ChartCard>
        <ChartCard title="Report delivery" subtitle="Downloadable board and operational outputs">
          <div className="flex h-full flex-col justify-between"><div><div className="flex items-center gap-2 text-gold"><Gauge size={18} /><span className="text-sm font-medium">{inboxQuery.data?.total || 0} generated packages</span></div><p className="mt-2 text-xs text-neutral-500">Use the detailed module reports below for evidence-level review.</p></div><div className="flex items-center gap-2 text-[11px] text-neutral-500"><LineChartIcon size={14} /> Live data refreshes every 30 seconds</div></div>
        </ChartCard>
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-2 text-lg font-semibold text-neutral-100">Detailed report catalogue</h2>
          {MODULES.map((mod) => <button key={mod.id} onClick={() => setActiveModule(mod.id)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${activeModule === mod.id ? "bg-gold text-black" : "bg-neutral-800 text-neutral-300"}`}><mod.icon size={12} className="mr-1 inline" />{mod.label}</button>)}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(reportsQuery.isLoading ? [] : reports).map((report) => <div key={report.id} className="card p-4"><div className="flex items-center gap-2"><FileText size={16} className="text-gold" /><h3 className="text-sm font-semibold text-neutral-100">{report.name}</h3></div><p className="my-3 text-xs text-neutral-500">{report.description}</p><div className="flex gap-2">{report.formats.map((format) => <button key={format} onClick={() => handleDownload(report.id, format)} disabled={downloading === `${report.id}-${format}`} className="btn-ghost px-2.5 py-1 text-[11px]"><Download size={11} className="mr-1 inline" />{downloading === `${report.id}-${format}` ? "..." : format.toUpperCase()}</button>)}</div></div>)}
        </div>
      </section>
    </div>
  );
}
