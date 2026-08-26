import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ShieldCheck, FileText, AlertTriangle, Users, Calendar, CheckCircle2, Clock, TrendingUp, AlertCircle, ArrowRight, Landmark } from "lucide-react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import { LoadingState } from "../../components/States";

function StatCard({ label, value, Icon, tone = "text-neutral-100", to }) {
  const body = (
    <div className={`card flex items-center gap-4 px-5 py-4 ${to ? "cursor-pointer hover:border-gold/40 transition" : ""}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone.includes("emerald") ? "bg-emerald-950/40" : tone.includes("amber") ? "bg-amber-950/40" : tone.includes("red") ? "bg-red-950/40" : "bg-gold/10"} ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="heading text-2xl font-semibold text-neutral-100">{value}</p>
        <p className="text-xs text-neutral-500">{label}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export default function GovernanceDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/governance/dashboard");
      setData(data);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState label="Loading governance dashboard..." />;
  if (error) return <div className="card p-6 text-red-400">{error}</div>;
  if (!data) return null;

  const policies = data.policies || {};
  const exceptions = data.exceptions || {};
  const committees = data.committees || {};

  return (
    <>
      <PageHeader title="Governance Dashboard" subtitle="Enterprise governance overview — policies, exceptions, and committees." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Policies */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gold" />
              <h3 className="text-sm font-semibold text-neutral-200">Policies</h3>
            </div>
            <Link to="/governance/policies" className="text-xs text-gold hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total" value={policies.total || 0} Icon={FileText} to="/governance/policies" />
            <StatCard label="Active" value={policies.active || 0} Icon={CheckCircle2} tone="text-emerald-300" to="/governance/policies" />
            <StatCard label="Due Review" value={policies.dueForReview || 0} Icon={Clock} tone="text-amber-300" to="/governance/policies" />
            <StatCard label="Overdue" value={policies.overdueReviews || 0} Icon={AlertCircle} tone="text-red-300" to="/governance/policies" />
          </div>
        </div>

        {/* Exceptions */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-neutral-200">Exceptions</h3>
            </div>
            <Link to="/governance/exceptions" className="text-xs text-gold hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Active" value={exceptions.active || 0} Icon={AlertTriangle} tone="text-amber-300" to="/governance/exceptions" />
            <StatCard label="Expiring Soon" value={exceptions.expiringSoon || 0} Icon={Clock} tone="text-red-300" to="/governance/exceptions" />
            <StatCard label="Pending" value={exceptions.pending || 0} Icon={TrendingUp} tone="text-sky-300" to="/governance/exceptions" />
            <StatCard label="Expired" value={exceptions.expired || 0} Icon={AlertCircle} tone="text-red-300" to="/governance/exceptions" />
          </div>
        </div>

        {/* Committees */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-neutral-200">Committees</h3>
            </div>
            <Link to="/governance/committees" className="text-xs text-gold hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Open Actions" value={committees.openActions || 0} Icon={TrendingUp} tone="text-sky-300" to="/governance/committees" />
            <StatCard label="Upcoming Meetings" value={committees.upcomingMeetings || 0} Icon={Calendar} to="/governance/committees" />
            <StatCard label="Total Members" value={committees.totalMembers || 0} Icon={Users} to="/governance/committees" />
            <StatCard label="Active Bodies" value={committees.active || 0} Icon={ShieldCheck} tone="text-emerald-300" to="/governance/committees" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 card p-5">
        <h3 className="mb-3 text-sm font-semibold text-neutral-200">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary text-xs" onClick={() => navigate("/governance/policies")}><FileText className="mr-1.5 h-3.5 w-3.5" /> New Policy</button>
          <button className="btn-ghost text-xs" onClick={() => navigate("/governance/exceptions")}><AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> New Exception</button>
          <button className="btn-ghost text-xs" onClick={() => navigate("/governance/roles")}><Users className="mr-1.5 h-3.5 w-3.5" /> Manage Roles</button>
          <button className="btn-ghost text-xs" onClick={() => navigate("/governance/committees")}><ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> View Committees</button>
        </div>
      </div>
    </>
  );
}
