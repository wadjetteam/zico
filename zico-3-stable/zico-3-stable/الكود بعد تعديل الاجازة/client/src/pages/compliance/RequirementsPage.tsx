import { useState } from "react";
import { useRequirements, useReference } from "./hooks";
import { T, Pill, DataTable, useSort, Toolbar, FilterSelect, reqStatusMeta, REQ_STATUSES } from "./shared";

export function RequirementsPage() {
  const { data, isLoading } = useRequirements();
  const { data: ref } = useReference();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [frameworkFilter, setFrameworkFilter] = useState("All");
  const { sort, toggle, apply } = useSort("code");

  if (isLoading || !data) return <div style={{ color: T.textMuted }}>Loading...</div>;
  const items = data.items || [];
  const frameworks = ref?.controls || []; // from reference

  const filtered = apply(items.filter((r: any) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || r.title?.toLowerCase().includes(q) || r.code?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    return matchSearch && matchStatus;
  }));

  const columns = [
    { key: "code", label: "ID" },
    { key: "title", label: "Title", render: (r: any) => <span style={{ fontWeight: 600 }}>{r.title}</span> },
    { key: "category", label: "Domain" },
    { key: "applicability", label: "Applicability" },
    { key: "status", label: "Status", render: (r: any) => { const m = reqStatusMeta(r.status); return <Pill label={r.status} color={m.color} bg={m.bg} />; } },
    { key: "frameworkId", label: "Framework", render: (r: any) => r.frameworkId?.slice(0, 8) },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Requirements</h1>
      <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>All compliance requirements across frameworks.</p>
      <Toolbar search={search} onSearch={setSearch} placeholder="Search requirements…" resultCount={filtered.length} totalCount={items.length} right={<><FilterSelect label="" value={statusFilter} options={["All", ...REQ_STATUSES]} onChange={setStatusFilter} /></>} />
      <DataTable columns={columns} rows={filtered} sort={sort} onSort={toggle} />
    </div>
  );
}
