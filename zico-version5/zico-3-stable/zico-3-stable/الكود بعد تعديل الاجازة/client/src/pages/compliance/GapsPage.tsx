import { useState } from "react";
import { useGaps, useCreateGap, useReference } from "./hooks";
import { T, Pill, DataTable, useSort, Toolbar, FilterSelect, severityMeta, gapStatusMeta, isOverdue, fmtDate, GAP_SEVERITIES, GAP_STATUSES } from "./shared";

export function GapsPage({ goTo }: { goTo: (p: string) => void }) {
  const { data, isLoading } = useGaps();
  const { data: ref } = useReference();
  const createMutation = useCreateGap();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [creating, setCreating] = useState(false);
  const { sort, toggle, apply } = useSort("dueDate");

  if (isLoading || !data) return <div style={{ color: T.textMuted }}>Loading...</div>;
  const items = data.items || [];

  const filtered = apply(items.filter((g: any) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || g.description?.toLowerCase().includes(q) || g.code?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || g.status === statusFilter;
    const matchSeverity = severityFilter === "All" || g.severity === severityFilter;
    return matchSearch && matchStatus && matchSeverity;
  }));

  const columns = [
    { key: "code", label: "ID" },
    { key: "requirementId", label: "Requirement", render: (r: any) => r.requirement?.title?.slice(0, 25) || r.requirementId?.slice(0, 8) },
    { key: "description", label: "Description", render: (r: any) => <span style={{ maxWidth: 200, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</span> },
    { key: "severity", label: "Severity", render: (r: any) => { const m = severityMeta(r.severity); return <Pill label={r.severity} color={m.color} bg={m.bg} />; } },
    { key: "owner", label: "Owner" },
    { key: "dueDate", label: "Due Date", render: (r: any) => <span style={{ color: isOverdue(r.dueDate, r.status, ["Resolved", "Closed"]) ? T.red : T.textSecondary }}>{fmtDate(r.dueDate)}</span> },
    { key: "status", label: "Status", render: (r: any) => { const m = gapStatusMeta(r.status); return <Pill label={r.status} color={m.color} bg={m.bg} />; } },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 700 }}>Compliance Gaps</h1><p style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Track compliance shortfalls and deviations.</p></div>
        <button onClick={() => goTo("remediation")} style={{ background: T.accent, color: "#1a1508", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>+ Create Remediation</button>
      </div>
      <Toolbar search={search} onSearch={setSearch} placeholder="Search gaps…" resultCount={filtered.length} totalCount={items.length} right={<><FilterSelect label="" value={statusFilter} options={["All", ...GAP_STATUSES]} onChange={setStatusFilter} /><FilterSelect label="" value={severityFilter} options={["All", ...GAP_SEVERITIES]} onChange={setSeverityFilter} /></>} />
      <DataTable columns={columns} rows={filtered} sort={sort} onSort={toggle} />
    </div>
  );
}
