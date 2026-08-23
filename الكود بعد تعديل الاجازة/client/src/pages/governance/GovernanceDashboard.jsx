import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ShieldCheck, FileText, AlertTriangle, Users, Calendar,
  CheckCircle2, Clock, TrendingUp, AlertCircle, ArrowRight,
} from "lucide-react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import { LoadingState } from "../../components/States";

const StatCard = ({ label, value, Icon, tone = "text-neutral-100", onClick }) => (
  <div className={`card flex items-center gap-4 px-5 py-4 ${onClick ? "cursor-pointer hover:border-gold/40 transition" : ""}`} onClick={onClick}>
    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone.includes("emerald") ? "bg-emerald-950/40" : tone.includes("amber") ? "bg-amber-950/40" : tone.includes("red") ? "bg-red-950/40" : "bg-gold/10"} ${tone}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="heading text-2xl font-semibold text-neutral-100">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  </div>
);

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

  const { policies, exceptions, committees } = data;

  return (
    <>
      <PageHeader
        title="Governance Dashboard"
        subtitle="Enterprise governance overview — policies, exceptions, and committees."
      />

      {/* Policies Section */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-200">Policies</h2>
          <button className="btn-ghost text-xs" onClick={() => navigate("/governance/policies")}>
            View all <ArrowRight className="ml-1 inline h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Policies" value={policies.total} Icon={FileText} onClick={() => navigate("/governance/policies")} />
          <StatCard label="Active" value={policies.active} Icon={CheckCircle2} tone="text-emerald-300" />
          <StatCard label="Due for Review" value={policies.dueForReview} Icon={Clock} tone="text-amber-300" />
          <StatCard label="Overdue" value={policies.overdueReviews} Icon={AlertCircle} tone="text-red-300" />
        </div>
      </div>

      {/* Exceptions Section */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-200">Exceptions</h2>
          <button className="btn-ghost text-xs" onClick={() => navigate("/governance/exceptions")}>
            View all <ArrowRight className="ml-1 inline h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Active Exceptions" value={exceptions.active} Icon={AlertTriangle} tone="text-amber-300" />
          <StatCard label="Expiring Soon (≤30d)" value={exceptions.expiringSoon} Icon={Clock} tone="text-red-300" />
        </div>
      </div>

      {/* Committees Section */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-200">Committees</h2>
          <button className="btn-ghost text-xs" onClick={() => navigate("/governance/committees")}>
            View all <ArrowRight className="ml-1 inline h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Open Actions" value={committees.openActions} Icon={TrendingUp} tone="text-sky-300" />
          <StatCard label="Upcoming Meetings" value={committees.upcomingMeetings} Icon={Calendar} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="mb-4 text-sm font-semibold text-neutral-200">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary" onClick={() => navigate("/governance/policies")}>
            <FileText className="mr-2 h-4 w-4" /> New Policy
          </button>
          <button className="btn-ghost" onClick={() => navigate("/governance/exceptions")}>
            <AlertTriangle className="mr-2 h-4 w-4" /> New Exception
          </button>
          <button className="btn-ghost" onClick={() => navigate("/governance/roles")}>
            <Users className="mr-2 h-4 w-4" /> Manage Roles
          </button>
          <button className="btn-ghost" onClick={() => navigate("/governance/committees")}>
            <ShieldCheck className="mr-2 h-4 w-4" /> View Committees
          </button>
        </div>
      </div>
    </>
  );
}
