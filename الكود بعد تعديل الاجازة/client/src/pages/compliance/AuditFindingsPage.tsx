import { useState } from "react";
import { useFindings } from "./hooks";
import { T, Pill, DataTable, useSort, Toolbar, severityMeta } from "./shared";

export function AuditFindingsPage() {
  const { data, isLoading } = useFindings();
  const [search, setSearch] = useState("");
  const { sort, toggle, apply } = useSort("dueDate");

  if (isLoading || !data) return <div style={{ color: T.textMuted }}>Loading...</div>;
  const items = data.items || [];

  const filtered = apply(items.filter((f: any) => {
    const q = search.trim().toLowerCase();
    return !q || f.finding?.toLowerCase().includes(q) || f.auditor?.toLowerCase().includes(q);
  }));

  const columns = [
    { key: "code", label: "Finding ID" },
    { key: "auditId", label: "Audit", render: (r: any) => r.auditId?.slice(0, 12) },
    { key: "requirementId", label: "Requirement", render: (r: any) => r.requirementId?.slice(0, 8) },
    { key: "finding", label: "Finding", render: (r: any) => <span style={{ maxWidth: 200, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.finding}</span> },
    { key: "severity", label: "Severity", render: (r: any) => { const m = severityMeta(r.severity); return <Pill label={r.severity} color={m.color} bg={m.bg} />; } },
    { key: "auditor", label: "Auditor" },
    { key: "status", label: "Status", render: (r: any) => <Pill label={r.status} color={r.status === "Open" ? T.red : T.amber} bg={r.status === "Open" ? T.redSoft : T.amberSoft} /> },
    { key: "dueDate", label: "Due Date", render: (r: any) => new Date(r.dueDate).toISOString().slice(0, 10) },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Audit & Findings</h1>
      <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>Audit findings from the Audit Management module (read-only).</p>
      <Toolbar search={search} onSearch={setSearch} placeholder="Search findings…" resultCount={filtered.length} totalCount={items.length} />
      <DataTable columns={columns} rows={filtered} sort={sort} onSort={toggle} />
    </div>
  );
}
