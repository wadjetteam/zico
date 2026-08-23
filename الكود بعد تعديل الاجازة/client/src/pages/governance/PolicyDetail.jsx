import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Eye, History, Shield, Paperclip, Network, FileText, ClipboardCheck, Layers } from "lucide-react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import { LoadingState } from "../../components/States";
import { chipClass, fmtDate } from "../../lib/format";
import WorkflowTab from "./tabs/WorkflowTab";
import VersionsTab from "./tabs/VersionsTab";
import AuditTab from "./tabs/AuditTab";
import DocumentsTab from "./tabs/DocumentsTab";
import EvidenceTab from "./tabs/EvidenceTab";
import AttestationsTab from "./tabs/AttestationsTab";
import HierarchyTab from "./tabs/HierarchyTab";
import ControlMappingsTab from "./tabs/ControlMappingsTab";
import RiskMappingsTab from "./tabs/RiskMappingsTab";

export function Stepper({ steps, current }) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center">
          <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
            i < current
              ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700"
              : i === current
              ? "bg-gold/20 text-gold border border-gold"
              : "bg-neutral-900 text-neutral-500 border border-neutral-700"
          }`}>
            <span className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold">
              {i < current ? "✓" : i + 1}
            </span>
            {step.label}
          </div>
          {i < steps.length - 1 && (
            <div className={`mx-1 h-0.5 w-4 ${i < current ? "bg-emerald-700" : "bg-neutral-700"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

const LIFECYCLE_STATUS_STYLES = {
  DRAFT: "border-neutral-700 bg-neutral-900 text-neutral-400",
  REVIEW: "border-amber-800/60 bg-amber-950/40 text-amber-300",
  APPROVAL: "border-sky-800/60 bg-sky-950/40 text-sky-300",
  APPROVED: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  PUBLISHED: "border-violet-800/60 bg-violet-950/40 text-violet-300",
  ACTIVE: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  EXPIRED: "border-red-800/60 bg-red-950/40 text-red-300",
  ARCHIVED: "border-neutral-700 bg-neutral-900 text-neutral-500",
  SUPERSEDED: "border-neutral-700 bg-neutral-900 text-neutral-500",
};

const LIFECYCLE_LABELS = {
  DRAFT: "Draft",
  REVIEW: "Under Review",
  APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  PUBLISHED: "Published",
  ACTIVE: "Active",
  EXPIRED: "Expired",
  ARCHIVED: "Archived",
  SUPERSEDED: "Superseded",
};

const TABS = [
  { id: "overview", label: "Overview", icon: Eye },
  { id: "workflow", label: "Workflow & Approval", icon: ClipboardCheck },
  { id: "versions", label: "Version History", icon: History },
  { id: "documents", label: "Documents", icon: Paperclip },
  { id: "risk-mappings", label: "Risk Mapping", icon: Layers },
  { id: "control-mappings", label: "Control Mapping", icon: Shield },
  { id: "evidence", label: "Evidence Mapping", icon: FileText },
  { id: "attestations", label: "Attestation & Exceptions", icon: ClipboardCheck },
  { id: "hierarchy", label: "Hierarchy", icon: Network },
  { id: "audit", label: "Audit History", icon: Shield },
];

export default function PolicyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/policies/${id}`);
      setPolicy(data);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState label="Loading policy details..." />;
  if (error) return <div className="card p-6 text-red-400">Error: {error}</div>;
  if (!policy) return null;

  const lifecycleState = policy.lifecycleState || "DRAFT";
  const statusLabel = LIFECYCLE_LABELS[lifecycleState] || lifecycleState;
  const statusStyle = LIFECYCLE_STATUS_STYLES[lifecycleState] || "border-neutral-700 bg-neutral-900 text-neutral-400";

  return (
    <>
      <div className="mb-4">
        <button className="btn-ghost text-sm" onClick={() => navigate("/governance/policies")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Policies
        </button>
      </div>

      <PageHeader
        title={policy.title}
        subtitle={`${policy.policyNumber || policy.policyId || policy._id} • v${policy.currentActiveVersionNumber || policy.latestVersionNumber || "—"} • ${policy.category || "Uncategorized"}`}
      />

      {/* Status Banner */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-4">
          <span className="text-[10px] uppercase tracking-wider text-neutral-500">Status</span>
          <span className={`chip mt-1 ${statusStyle}`}>{statusLabel}</span>
          {policy.hasDraftVersion && lifecycleState === "ACTIVE" && (
            <span className="chip mt-1 ml-1 text-xs border-neutral-700 bg-neutral-900 text-neutral-400">+ Draft</span>
          )}
        </div>
        <div className="card p-4">
          <span className="text-[10px] uppercase tracking-wider text-neutral-500">Next Review</span>
          <p className="mt-1 text-sm text-neutral-200">{fmtDate(policy.nextReviewDate)}</p>
          {policy.reviewStatus && (
            <span className={`chip text-xs ${policy.reviewStatus === "Overdue" ? "border-red-800/60 bg-red-950/40 text-red-300" : policy.reviewStatus === "DueSoon" ? "border-amber-800/60 bg-amber-950/40 text-amber-300" : "border-emerald-800/60 bg-emerald-950/40 text-emerald-300"}`}>
              {policy.reviewStatus}
            </span>
          )}
        </div>
        <div className="card p-4">
          <span className="text-[10px] uppercase tracking-wider text-neutral-500">Current Version</span>
          <p className="mt-1 text-sm text-neutral-200">v{policy.currentActiveVersionNumber || "—"}</p>
        </div>
        <div className="card p-4">
          <span className="text-[10px] uppercase tracking-wider text-neutral-500">Latest Version</span>
          <p className="mt-1 text-sm text-neutral-200">v{policy.latestVersionNumber || "—"}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2 border-b border-line overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`flex items-center gap-2 px-4 py-2 text-sm transition whitespace-nowrap ${activeTab === tab.id ? "border-b-2 border-gold text-gold" : "text-neutral-400 hover:text-neutral-200"}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-neutral-200">Description</h3>
              <p className="text-sm text-neutral-400">{policy.description || "No description"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              <div><span className="text-xs text-neutral-500">Policy ID</span><p className="text-sm text-neutral-200">{policy.policyNumber || policy.policyId || policy._id}</p></div>
              <div><span className="text-xs text-neutral-500">Lifecycle State</span><p className="text-sm text-neutral-200">{statusLabel}</p></div>
              <div><span className="text-xs text-neutral-500">Category</span><p className="text-sm text-neutral-200">{policy.category || "—"}</p></div>
              <div><span className="text-xs text-neutral-500">Classification</span><p className="text-sm text-neutral-200">{policy.classification || "—"}</p></div>
              <div><span className="text-xs text-neutral-500">Department</span><p className="text-sm text-neutral-200">{policy.department || "—"}</p></div>
              <div><span className="text-xs text-neutral-500">Review Period</span><p className="text-sm text-neutral-200">{policy.reviewPeriodDays || 365} days</p></div>
              <div><span className="text-xs text-neutral-500">Has Draft Version</span><p className="text-sm text-neutral-200">{policy.hasDraftVersion ? "Yes" : "No"}</p></div>
              <div><span className="text-xs text-neutral-500">Pending Review</span><p className="text-sm text-neutral-200">{policy.hasPendingReview ? "Yes" : "No"}</p></div>
              <div><span className="text-xs text-neutral-500">Pending Approval</span><p className="text-sm text-neutral-200">{policy.hasPendingApproval ? "Yes" : "No"}</p></div>
            </div>
          </div>
        )}

        {activeTab === "workflow" && <WorkflowTab policy={policy} reload={load} />}
        {activeTab === "versions" && <VersionsTab policy={policy} reload={load} />}
        {activeTab === "documents" && <DocumentsTab policy={policy} reload={load} />}
        {activeTab === "risk-mappings" && <RiskMappingsTab policy={policy} reload={load} />}
        {activeTab === "control-mappings" && <ControlMappingsTab policy={policy} reload={load} />}
        {activeTab === "evidence" && <EvidenceTab policy={policy} reload={load} />}
        {activeTab === "attestations" && <AttestationsTab policy={policy} reload={load} />}
        {activeTab === "hierarchy" && <HierarchyTab policy={policy} reload={load} />}
        {activeTab === "audit" && <AuditTab policy={policy} reload={load} />}
      </div>
    </>
  );
}
