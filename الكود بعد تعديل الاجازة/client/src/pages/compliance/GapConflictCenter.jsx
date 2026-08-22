import { useCallback, useEffect, useState } from "react";
import { Download, Printer, ShieldAlert, GitMerge } from "lucide-react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import { ErrorState } from "../../components/States";
import { Select } from "../../components/Field";

const chipFor = (gapType) => {
  const styles = {
    no_policy_and_no_evidence: "border-red-800/60 bg-red-950/40 text-red-300",
    no_policy: "border-amber-800/60 bg-amber-950/40 text-amber-300",
    no_evidence: "border-sky-800/60 bg-sky-950/40 text-sky-300",
  };
  return styles[gapType] || "border-neutral-700 bg-neutral-900 text-neutral-400";
};

const labelFor = (gapType) =>
  ({
    no_policy_and_no_evidence: "No policy & no evidence",
    no_policy: "No policy",
    no_evidence: "No evidence",
  }[gapType] || gapType);

export default function GapConflictCenter() {
  const [tab, setTab] = useState("uncovered");
  const [frameworks, setFrameworks] = useState([]);
  const [frameworkId, setFrameworkId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get("/compliance/gap-and-conflict-report", { params: { framework_id: frameworkId || undefined, type: "all" } })
      .then((r) => setData(r.data))
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [frameworkId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api.get("/frameworks", { params: { pageSize: 100 } }).then((r) => setFrameworks(r.data.items || [])).catch(() => {});
  }, []);

  const exportCSV = (list, filename) => {
    if (!list.length) return alert("Nothing to export.");
    const headers = Object.keys(list[0]);
    const rows = list.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uncovered = data?.uncovered_controls || [];
  const overlapping = data?.overlapping_policies || [];
  const current = tab === "uncovered" ? uncovered : overlapping;

  const uncoveredCols = [
    { key: "controlId", header: "Control", render: (r) => <span className="whitespace-nowrap font-mono text-xs text-gold">{r.controlId}</span> },
    { key: "control_name", header: "Control name", render: (r) => <span className="font-medium text-neutral-100">{r.control_name}</span> },
    { key: "framework_name", header: "Framework", render: (r) => <span className="chip">{r.framework_name || "—"}</span> },
    {
      key: "gap_type",
      header: "Gap type",
      render: (r) => <span className={`chip ${chipFor(r.gap_type)}`}>{labelFor(r.gap_type)}</span>,
    },
    { key: "severity", header: "Severity", render: (r) => <span className={`chip ${r.severity === "high" ? "border-red-800/60 bg-red-950/40 text-red-300" : r.severity === "medium" ? "border-amber-800/60 bg-amber-950/40 text-amber-300" : "border-neutral-700 bg-neutral-900 text-neutral-400"}`}>{r.severity}</span> },
    { key: "linked_policies", header: "Linked policies", render: (r) => <span className="text-xs">{r.linked_policies.length}</span> },
  ];

  const overlapCols = [
    { key: "controlId", header: "Control", render: (r) => <span className="whitespace-nowrap font-mono text-xs text-gold">{r.controlId}</span> },
    { key: "control_name", header: "Control name", render: (r) => <span className="font-medium text-neutral-100">{r.control_name}</span> },
    { key: "conflicting_policy_ids", header: "Conflicting policies", render: (r) => <span className="whitespace-nowrap font-mono text-xs text-amber-300">{r.conflicting_policy_ids.join(", ")}</span> },
    { key: "conflict_type", header: "Conflict type", render: (r) => <span className="chip border-amber-800/60 bg-amber-950/40 text-amber-300">{r.conflict_type.replace("_", " ")}</span> },
    { key: "detected_by", header: "Detected by", render: (r) => <span className="chip">{r.detected_by.replace("_", " ")}</span> },
  ];

  const stats = [
    { label: "Uncovered controls", value: data?.summary?.total_gaps ?? 0, style: "border-red-800/60 bg-red-950/40 text-red-300" },
    { label: "Overlapping policies", value: data?.summary?.total_conflicts ?? 0, style: "border-amber-800/60 bg-amber-950/40 text-amber-300" },
    { label: "No policy + no evidence", value: data?.controlsWithoutPolicyOrEvidenceCount ?? 0, style: "border-neutral-700 bg-neutral-900 text-neutral-400" },
  ];

  return (
    <>
      <PageHeader
        title="Gap & Conflict Center"
        subtitle="Uncovered controls and overlapping policy coverage across frameworks (ISO 27001, NIST, PCI DSS)."
        actions={
          <>
            <Select className="w-44" value={frameworkId} onChange={(e) => setFrameworkId(e.target.value)} options={[{ value: "", label: "All frameworks" }, ...frameworks.map((f) => ({ value: f._id, label: f.name }))]} />
            <button className="btn-ghost" onClick={() => exportCSV(current, `gap-conflict-${tab}.csv`)} title="Export CSV"><Download className="h-4 w-4" /> CSV</button>
            <button className="btn-ghost" onClick={() => window.print()} title="Print report"><Printer className="h-4 w-4" /> PDF</button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((c) => (
          <div key={c.label} className="card p-3">
            <div className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${c.style}`}>{c.value ?? "—"}</div>
            <div className="mt-1.5 text-[11px] leading-tight text-neutral-400">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-2 border-b border-line pb-px">
        <button className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${tab === "uncovered" ? "border-gold text-gold" : "border-transparent text-neutral-400 hover:text-neutral-200"}`} onClick={() => { setTab("uncovered"); setSelected(null); }}>
          <ShieldAlert className="mr-1 inline h-4 w-4" /> Uncovered Controls ({uncovered.length})
        </button>
        <button className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${tab === "conflict" ? "border-gold text-gold" : "border-transparent text-neutral-400 hover:text-neutral-200"}`} onClick={() => { setTab("conflict"); setSelected(null); }}>
          <GitMerge className="mr-1 inline h-4 w-4" /> Overlapping Policies ({overlapping.length})
        </button>
      </div>

      {error && !loading ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <DataTable
            columns={tab === "uncovered" ? uncoveredCols : overlapCols}
            rows={current}
            loading={loading}
            searchable={false}
            emptyHint={tab === "uncovered" ? "Every control is covered by a policy and supporting evidence." : "No control is covered by more than one active policy."}
            onRowClick={(r) => setSelected(selected?.control_id === r.control_id ? null : r)}
          />

          {selected && (
            <div className="card mt-4 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="label">Details — {selected.controlId} · {selected.control_name}</p>
                <button className="text-xs text-neutral-500 hover:text-neutral-300" onClick={() => setSelected(null)}>Close</button>
              </div>
              {tab === "uncovered" ? (
                <ul className="grid gap-1.5 text-sm">
                  {selected.linked_policies.length === 0 ? (
                    <li className="text-neutral-500">No policy currently maps to this control.</li>
                  ) : (
                    selected.linked_policies.map((p) => (
                      <li key={p.policy_id} className="flex items-center justify-between rounded-md border border-line bg-white/[0.02] px-3 py-2">
                        <span className="font-mono text-xs text-gold">{p.policyId}</span>
                        <span className="text-neutral-200">{p.title}</span>
                        <button className="btn-ghost px-2 py-0.5 text-[11px]" onClick={() => (window.location.href = `/governance/policies/${p.policy_id}`)}>Open</button>
                      </li>
                    ))
                  )}
                </ul>
              ) : (
                <ul className="grid gap-1.5 text-sm">
                  {selected.policies.map((p) => (
                    <li key={p.policy_id} className="flex items-center justify-between rounded-md border border-line bg-white/[0.02] px-3 py-2">
                      <span className="font-mono text-xs text-gold">{p.policyId}</span>
                      <span className="text-neutral-200">{p.title}</span>
                      <span className={`chip ${p.status === "Published" ? "border-emerald-800/60 bg-emerald-950/40 text-emerald-300" : "border-amber-800/60 bg-amber-950/40 text-amber-300"}`}>{p.status}</span>
                      <button className="btn-ghost px-2 py-0.5 text-[11px]" onClick={() => (window.location.href = `/governance/policies/${p.policy_id}`)}>Open</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}