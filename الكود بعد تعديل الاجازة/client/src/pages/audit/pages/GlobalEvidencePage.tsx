import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import auditApi from "../api";
import { PageHeading, Toolbar, FilterSelect, DataTable, useSort, Pill, T } from "../../compliance/shared";

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  Requested: { color: T.amber, bg: T.amberSoft },
  Submitted: { color: T.blue, bg: T.blueSoft },
  UnderReview: { color: T.purple, bg: T.purpleSoft },
  Accepted: { color: T.green, bg: T.greenSoft },
  Rejected: { color: T.red, bg: T.redSoft },
  Overdue: { color: T.red, bg: T.redSoft },
  Cancelled: { color: T.grey, bg: T.greySoft },
};

export default function GlobalEvidencePage() {
  const [auditFilter, setAuditFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const { sort, toggle, apply } = useSort("requestDate");

  const { data: evidenceData } = useQuery({ queryKey: ["audit-evidence", auditFilter], queryFn: async () => (await auditApi.get("/evidence", { params: { auditId: auditFilter === "All" ? undefined : auditFilter, pageSize: 100 } })).data });
  const { data: auditsData } = useQuery({ queryKey: ["audit-audits-list"], queryFn: async () => (await auditApi.get("/audits", { params: { pageSize: 100 } })).data });

  const items = evidenceData?.items || [];
  const audits = auditsData?.items || [];
  const filtered = apply(items.filter((e: any) => {
    const q = search.trim().toLowerCase();
    return (!q || e.description?.toLowerCase().includes(q)) && (statusFilter === "All" || e.status === statusFilter);
  }));

  const columns = [
    { key: "auditId", label: "Audit", render: (r: any) => audits.find((a: any) => a.id === r.auditId)?.name || r.auditId },
    { key: "description", label: "Description" },
    { key: "evidenceType", label: "Type" },
    { key: "requestedFrom", label: "Requested From" },
    { key: "requestDate", label: "Requested", render: (r: any) => r.requestDate?.slice(0, 10) || "—" },
    { key: "dueDate", label: "Due", render: (r: any) => r.dueDate?.slice(0, 10) || "—" },
    { key: "status", label: "Status", render: (r: any) => <Pill label={r.status} {...STATUS_STYLES[r.status] || { color: T.grey, bg: T.greySoft }} /> },
  ];

  return (
    <div>
      <PageHeading title="Evidence Requests" desc="Evidence requests across all audits." />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search evidence…" resultCount={filtered.length} totalCount={items.length} right={<><FilterSelect value={auditFilter} options={["All", ...audits.map((a: any) => a.id)]} onChange={setAuditFilter} /><FilterSelect value={statusFilter} options={["All", "Requested", "Submitted", "UnderReview", "Accepted", "Rejected", "Overdue"]} onChange={setStatusFilter} /></>} />
      <DataTable columns={columns} rows={filtered} sort={sort} onSort={toggle} />
    </div>
  );
}
