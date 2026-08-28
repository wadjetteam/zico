import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Eye, Pencil, ArrowLeft } from "lucide-react";
import auditApi from "../api/client";
import { PageHeading, Toolbar, FilterSelect, DataTable, useSort, Pill, T, Badge, SectionLabel, DetailRow, Field, inputStyle, selectStyle, primaryBtnStyle, secondaryBtnStyle } from "../components/shared";

const AUDIT_STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  Planned: { color: T.blue, bg: T.blueSoft },
  Scheduled: { color: T.accent, bg: T.accentSoft },
  InProgress: { color: T.amber, bg: T.amberSoft },
  UnderReview: { color: T.purple, bg: T.purpleSoft },
  Completed: { color: T.green, bg: T.greenSoft },
  Cancelled: { color: T.red, bg: T.redSoft },
};

export default function AuditsPage({ onOpenAudit }: any) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const { sort, toggle, apply } = useSort("auditCode");

  const { data, isLoading } = useQuery({
    queryKey: ["audits", search, statusFilter],
    queryFn: async () => {
      const params: any = { search: search || undefined, page: 1, pageSize: 50 };
      if (statusFilter !== "All") params.status = statusFilter;
      return (await auditApi.get("/audits", { params })).data;
    },
  });

  const filtered = apply((data?.items || []));

  const columns = [
    { key: "auditCode", label: "Code" },
    { key: "name", label: "Name" },
    { key: "type", label: "Type" },
    { key: "status", label: "Status", render: (r: any) => <Pill label={r.status} {...AUDIT_STATUS_STYLES[r.status] || { color: T.grey, bg: T.greySoft }} /> },
    { key: "overallResult", label: "Result" },
    { key: "startDate", label: "Start", render: (r: any) => r.startDate?.slice(0, 10) || "—" },
    { key: "endDate", label: "End", render: (r: any) => r.endDate?.slice(0, 10) || "—" },
    { key: "_count", label: "Items", render: (r: any) => `${r._count?.checklistItems || 0}` },
  ];

  return (
    <div>
      <PageHeading title="Audits" subtitle="All audit engagements." action={<button style={primaryBtnStyle}><Plus size={14} style={{ marginRight: 6 }} /> New Audit</button>} />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search audits..." right={<FilterSelect label="" value={statusFilter} options={["All", "Planned", "Scheduled", "In Progress", "Under Review", "Completed", "Cancelled"]} onChange={setStatusFilter} />} resultCount={filtered.length} totalCount={data?.total || 0} />
      <DataTable columns={columns} rows={filtered} sort={sort} onSort={toggle} onRowClick={(r) => onOpenAudit?.(r.id)} renderActions={(r) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button style={iconBtnStyle} onClick={() => onOpenAudit?.(r.id)} title="View"><Eye size={13} color={T.textSecondary} /></button>
        </div>
      )} />
    </div>
  );
}

const iconBtnStyle = { border: `1px solid ${T.panelBorder}`, background: T.inputBg, borderRadius: 7, padding: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
