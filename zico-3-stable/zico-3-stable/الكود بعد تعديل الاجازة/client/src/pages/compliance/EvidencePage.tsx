import { useState } from "react";
import { useEvidence } from "./hooks";
import { T, Pill, DataTable, useSort, Toolbar, FilterSelect, evidenceStatusMeta, EVIDENCE_STATUSES } from "./shared";

export function EvidencePage() {
  const { data, isLoading } = useEvidence();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const { sort, toggle, apply } = useSort("uploadDate");

  if (isLoading || !data) return <div style={{ color: T.textMuted }}>Loading...</div>;
  const items = data.items || [];

  const filtered = apply(items.filter((e: any) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || e.name?.toLowerCase().includes(q) || e.owner?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || e.status === statusFilter;
    return matchSearch && matchStatus;
  }));

  const columns = [
    { key: "code", label: "ID" },
    { key: "name", label: "Evidence", render: (r: any) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { key: "requirementId", label: "Requirement", render: (r: any) => r.requirement?.title?.slice(0, 20) || r.requirementId?.slice(0, 8) },
    { key: "type", label: "Type" },
    { key: "owner", label: "Owner" },
    { key: "uploadDate", label: "Uploaded", render: (r: any) => new Date(r.uploadDate).toISOString().slice(0, 10) },
    { key: "expirationDate", label: "Expires", render: (r: any) => r.expirationDate ? new Date(r.expirationDate).toISOString().slice(0, 10) : "—" },
    { key: "status", label: "Status", render: (r: any) => { const m = evidenceStatusMeta(r.status); return <Pill label={r.status} color={m.color} bg={m.bg} />; } },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Evidence</h1>
      <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>Supporting documentation for compliance requirements.</p>
      <Toolbar search={search} onSearch={setSearch} placeholder="Search evidence…" resultCount={filtered.length} totalCount={items.length} right={<FilterSelect label="" value={statusFilter} options={["All", ...EVIDENCE_STATUSES]} onChange={setStatusFilter} />} />
      <DataTable columns={columns} rows={filtered} sort={sort} onSort={toggle} />
    </div>
  );
}
