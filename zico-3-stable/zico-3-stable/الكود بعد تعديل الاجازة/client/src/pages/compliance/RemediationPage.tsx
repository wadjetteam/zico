import { useState } from "react";
import { useRemediation } from "./hooks";
import { T, Pill, DataTable, useSort, Toolbar, FilterSelect, remediationStatusMeta, isOverdue, fmtDate, REMEDIATION_STATUSES } from "./shared";
import { useQueryClient } from "@tanstack/react-query";
import api from "./api";

export function RemediationPage() {
  const { data, isLoading } = useRemediation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const qc = useQueryClient();
  const { sort, toggle, apply } = useSort("dueDate");

  const updateProgress = async (id: string, progress: number) => {
    await api.patch(`/remediation/${id}/progress`, { progress });
    qc.invalidateQueries({ queryKey: ["remediation"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  if (isLoading || !data) return <div style={{ color: T.textMuted }}>Loading...</div>;
  const items = data.items || [];

  const filtered = apply(items.filter((r: any) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || r.description?.toLowerCase().includes(q) || r.code?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    return matchSearch && matchStatus;
  }));

  const columns = [
    { key: "code", label: "Task ID" },
    { key: "gapId", label: "Gap", render: (r: any) => r.gapId?.slice(0, 8) },
    { key: "description", label: "Description", render: (r: any) => <span style={{ maxWidth: 180, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</span> },
    { key: "owner", label: "Owner" },
    { key: "priority", label: "Priority" },
    { key: "dueDate", label: "Due Date", render: (r: any) => <span style={{ color: isOverdue(r.dueDate, r.status, ["Completed", "Cancelled"]) ? T.red : T.textSecondary }}>{fmtDate(r.dueDate)}</span> },
    { key: "status", label: "Status", render: (r: any) => { const m = remediationStatusMeta(r.status); return <Pill label={r.status} color={m.color} bg={m.bg} />; } },
    { key: "progress", label: "Progress", noSort: true, render: (r: any) => (
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: 120 }}>
        <input type="range" min={0} max={100} value={r.progress} onChange={(e) => updateProgress(r.id, Number(e.target.value))} style={{ flex: 1 }} />
        <span style={{ fontSize: 11, width: 30 }}>{r.progress}%</span>
      </div>
    )},
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Remediation</h1>
      <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>Track remediation tasks for identified gaps.</p>
      <Toolbar search={search} onSearch={setSearch} placeholder="Search tasks…" resultCount={filtered.length} totalCount={items.length} right={<FilterSelect label="" value={statusFilter} options={["All", ...REMEDIATION_STATUSES]} onChange={setStatusFilter} />} />
      <DataTable columns={columns} rows={filtered} sort={sort} onSort={toggle} />
    </div>
  );
}
