import { useState } from "react";
import { useAssessments } from "./hooks";
import { T, Pill, DataTable, useSort, Toolbar, reqStatusMeta } from "./shared";

export function AssessmentsPage() {
  const { data, isLoading } = useAssessments();
  const [search, setSearch] = useState("");
  const { sort, toggle, apply } = useSort("date");

  if (isLoading || !data) return <div style={{ color: T.textMuted }}>Loading...</div>;
  const items = data.items || [];

  const filtered = apply(items.filter((a: any) => {
    const q = search.trim().toLowerCase();
    return !q || a.assessor?.toLowerCase().includes(q) || a.code?.toLowerCase().includes(q);
  }));

  const columns = [
    { key: "code", label: "ID" },
    { key: "requirementId", label: "Requirement", render: (r: any) => r.requirement?.title?.slice(0, 30) || r.requirementId?.slice(0, 8) },
    { key: "status", label: "Result", render: (r: any) => { const m = reqStatusMeta(r.status); return <Pill label={r.status} color={m.color} bg={m.bg} />; } },
    { key: "assessor", label: "Assessor" },
    { key: "date", label: "Date", render: (r: any) => new Date(r.date).toISOString().slice(0, 10) },
    { key: "controlEffectiveness", label: "Control Eff." },
    { key: "reviewStatus", label: "Review", render: (r: any) => <Pill label={r.reviewStatus} color={r.reviewStatus === "Reviewed" ? T.green : T.amber} bg={r.reviewStatus === "Reviewed" ? T.greenSoft : T.amberSoft} /> },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Assessments</h1>
      <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>Append-only assessment history — never modified or deleted.</p>
      <Toolbar search={search} onSearch={setSearch} placeholder="Search by assessor…" resultCount={filtered.length} totalCount={items.length} />
      <DataTable columns={columns} rows={filtered} sort={sort} onSort={toggle} />
    </div>
  );
}
