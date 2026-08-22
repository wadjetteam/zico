import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, BookOpen, CheckSquare, Download, FileText, GitBranch, History,
  Landmark, ListTree, Network, Scale, ShieldCheck, FileSearch, Workflow,
} from "lucide-react";
import { resource } from "../../api/client";
import { ErrorState, LoadingState } from "../../components/States";
import { POLICY_STATUS_STYLES, POLICY_LIFECYCLE, stepIndex, fmtDay } from "../../lib/policy";
import DetailsTab from "./tabs/DetailsTab";
import WorkflowTab from "./tabs/WorkflowTab";
import DocumentsTab from "./tabs/DocumentsTab";
import RiskMappingsTab from "./tabs/RiskMappingsTab";
import ControlMappingsTab from "./tabs/ControlMappingsTab";
import EvidenceTab from "./tabs/EvidenceTab";
import AttestationsTab from "./tabs/AttestationsTab";
import VersionsTab from "./tabs/VersionsTab";
import HierarchyTab from "./tabs/HierarchyTab";
import AuditTab from "./tabs/AuditTab";

const api = resource("policies");

const TABS = [
  { key: "details", label: "Policy Details", icon: FileText },
  { key: "workflow", label: "Workflow & Approval", icon: Workflow },
  { key: "documents", label: "Documents", icon: FileSearch },
  { key: "risk", label: "Risk Mapping", icon: ShieldCheck },
  { key: "control", label: "Control Mapping", icon: Network },
  { key: "evidence", label: "Evidence Mapping", icon: Scale },
  { key: "attestation", label: "Attestation & Exceptions", icon: CheckSquare },
  { key: "versions", label: "Version History", icon: History },
  { key: "compare", label: "Version Compare", icon: GitBranch },
  { key: "hierarchy", label: "Hierarchy", icon: ListTree },
  { key: "audit", label: "Audit History", icon: BookOpen },
];

export { POLICY_LIFECYCLE, stepIndex };

/** Numbered lifecycle stepper: completed = gold, current = outlined + "Current", future = muted. */
export function Stepper({ steps, current, compact = false }) {
  const idx = current;
  return (
    <div className={`flex items-center ${compact ? "gap-1" : "gap-0"}`}>
      {steps.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={s.key} className={`flex items-center ${i > 0 ? (compact ? "ml-1" : "flex-1") : ""}`}>
            {i > 0 && (
              <div className={`h-0.5 ${compact ? "w-3" : "flex-1"} ${done || active ? "bg-gold/70" : "bg-neutral-800"}`} />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex items-center justify-center rounded-full border text-xs font-semibold ${
                  done
                    ? "border-gold bg-gold/15 text-gold"
                    : active
                      ? "border-gold bg-transparent text-gold"
                      : "border-neutral-700 text-neutral-600"
                } ${compact ? "h-6 w-6" : "h-8 w-8"}`}
              >
                {done ? "✓" : i + 1}
              </div>
              {!compact && (
                <span className={`text-[10px] ${active ? "font-medium text-gold" : "text-neutral-500"}`}>{s.label}</span>
              )}
            </div>
            {!compact && active && <span className="ml-1 text-[10px] uppercase tracking-wide text-gold">Current</span>}
          </div>
        );
      })}
    </div>
  );
}

/** Render a policy to a print-friendly window and trigger the browser PDF dialog. */
const exportPdf = (policy) => {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  const line = (label, value) =>
    `<tr><td style="padding:6px 12px;color:#666;font-size:12px;width:200px">${label}</td><td style="padding:6px 12px;color:#111;font-size:13px">${value}</td></tr>`;
  w.document.write(`<!doctype html><html><head><title>${policy.policyId} — ${policy.title}</title></head>
  <body style="font-family:Segoe UI,Arial,sans-serif;max-width:800px;margin:40px auto;color:#111">
    <h1 style="font-size:22px;margin:0">${policy.title}</h1>
    <p style="color:#666;margin:4px 0 24px">${policy.policyId} · v${policy.version} · ${policy.status}</p>
    <table style="border-collapse:collapse;width:100%">
      ${line("Description", policy.description || "—")}
      ${line("Category", policy.category || "—")}
      ${line("Classification", policy.classification || "—")}
      ${line("Owner", policy.owner || "—")}
      ${line("Department", policy.department || "—")}
      ${line("Effective date", fmtDay(policy.effectiveDate))}
      ${line("Expiration date", fmtDay(policy.expirationDate))}
      ${line("Applicable to", policy.applicableTo || "—")}
      ${line("Regulatory basis", policy.regulatoryBasis || "—")}
      ${line("Next review", fmtDay(policy.nextReviewAt))}
    </table>
    <h2 style="font-size:15px;margin-top:28px;border-bottom:1px solid #ddd;padding-bottom:6px">Content</h2>
    <div style="white-space:pre-wrap;font-size:13px;line-height:1.6">${(policy.content || "No content").replace(/</g, "&lt;")}</div>
  </body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
};

export default function PolicyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("details");

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(id)
      .then(setPolicy)
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (loading || !policy) return <LoadingState label="Loading policy…" />;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(-1)}
            className="mt-1 rounded-lg border border-line p-2 text-neutral-400 transition hover:text-gold"
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="heading text-2xl font-semibold text-neutral-100">{policy.title}</h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
              {policy.policyId} · v{policy.version} ·{" "}
              <span className={`chip ${POLICY_STATUS_STYLES[policy.status] || POLICY_STATUS_STYLES.draft}`}>{policy.status}</span>
            </p>
          </div>
        </div>
        <button className="btn-ghost" onClick={() => exportPdf(policy)}>
          <Download className="h-4 w-4" /> PDF Export
        </button>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-line pb-px">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition ${
                active ? "border-gold text-gold" : "border-transparent text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {tab === "details" && <DetailsTab policy={policy} reload={load} />}
        {tab === "workflow" && <WorkflowTab policy={policy} reload={load} />}
        {tab === "documents" && <DocumentsTab policy={policy} />}
        {tab === "risk" && <RiskMappingsTab policy={policy} />}
        {tab === "control" && <ControlMappingsTab policy={policy} />}
        {tab === "evidence" && <EvidenceTab policy={policy} />}
        {tab === "attestation" && <AttestationsTab policy={policy} />}
        {tab === "versions" && <VersionsTab policy={policy} reload={load} />}
        {tab === "compare" && <VersionsTab policy={policy} reload={load} compareOnly />}
        {tab === "hierarchy" && <HierarchyTab policy={policy} reload={load} />}
        {tab === "audit" && <AuditTab policy={policy} />}
      </div>
    </div>
  );
}
