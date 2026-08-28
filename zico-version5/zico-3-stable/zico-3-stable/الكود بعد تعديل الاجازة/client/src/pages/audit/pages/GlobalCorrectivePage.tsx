import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import auditApi from "../api";
import { PageHeading, Toolbar, FilterSelect, DataTable, useSort, Pill, T } from "../../compliance/shared";

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  Open: { color: T.red, bg: T.redSoft },
  Assigned: { color: T.amber, bg: T.amberSoft },
  InProgress: { color: T.blue, bg: T.blueSoft },
  Blocked: { color: T.red, bg: T.redSoft },
  PendingVerification: { color: T.purple, bg: T.purpleSoft },
  Verified: { color: T.green, bg: T.greenSoft },
  Closed: { color: T.grey, bg: T.greySoft },
  Overdue: { color: T.red, bg: T.redSoft },
  Cancelled: { color: T.grey, bg: T.greySoft },
};

export default function GlobalCorrectivePage() {
  const [auditFilter, setAuditFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const { sort, toggle, apply } = useSort("id");

  const { data: caData } = useQuery({ queryKey: ["audit-corrective", auditFilter], queryFn: async () => (await auditApi.get("/corrective-actions", { params: { auditId: auditFilter === "All" ? undefined : auditFilter, pageSize: 100 } })).data });
  const { data: auditsData } = useQuery({ queryKey: ["audit-audits-list"], queryFn: async () => (await auditApi.get("/audits", { params: { pageSize: 100 } })).data });

  const items = caData?.items || [];
  const audits = auditsData?.items || [];
  const filtered = apply(items.filter((c: any) => {
    const q = search.trim().toLowerCase();
    return (!q || c.description?.toLowerCase().includes(q)) && (statusFilter === "All" || c.status === statusFilter);
  }));

  const columns = [
    { key: "actionCode", label: "ID" },
    { key: "auditId", label: "Audit", render: (r: any) => audits.find((a: any) => a.id === r.auditId)?.name || r.auditId },
    { key: "description", label: "Description" },
    { key: "owner", label: "Owner" },
    { key: "priority", label: "Priority" },
    { key: "dueDate", label: "Due", render: (r: any) => r.dueDate?.slice(0, 10) || "—" },
    { key: "status", label: "Status", render: (r: any) => <Pill label={r.status} {...STATUS_STYLES[r.status] || { color: T.grey, bg: T.greySoft }} /> },
    { key: "progress", label: "Progress", render: (r: any) => (
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: 100 }}>
        <div style={{ flex: 1, height: 6, background: T.inputBg, borderRadius: 3 }}>
          <div style={{ width: `${r.progress}%`, height: "100%", background: r.progress >= 100 ? T.green : T.blue, borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 11, width: 30 }}>{r.progress}%</span>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeading title="Corrective Actions" desc="Corrective actions across all audits." />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search actions…" resultCount={filtered.length} totalCount={items.length} right={<><FilterSelect value={auditFilter} options={["All", ...audits.map((a: any) => a.id)]} onChange={setAuditFilter} /><FilterSelect value={statusFilter} options={["All", "Open", "Assigned", "InProgress", "Blocked", "PendingVerification", "Verified", "Closed", "Overdue"]} onChange={setStatusFilter} /></>} />
      <DataTable columns={columns} rows={filtered} sort={sort} onSort={toggle} />
    </div>
  );
}
