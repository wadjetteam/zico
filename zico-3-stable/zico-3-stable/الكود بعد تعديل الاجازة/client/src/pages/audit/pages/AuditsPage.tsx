import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Play, CheckCircle2, XCircle } from "lucide-react";
import auditApi from "../api";
import { PageHeading, Toolbar, FilterSelect, DataTable, useSort, Pill, T, SectionLabel, DetailRow } from "../../compliance/shared";

const iconBtn = { border: `1px solid ${T.panelBorder}`, background: T.inputBg, borderRadius: 7, padding: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };

const AUDIT_STATUSES = ["Planned", "In Progress", "Under Review", "Completed", "Cancelled"];

const auditStatusMeta: Record<string, { color: string; bg: string }> = {
  Planned: { color: T.blue, bg: T.blueSoft },
  "In Progress": { color: T.amber, bg: T.amberSoft },
  "Under Review": { color: T.purple, bg: T.purpleSoft },
  Completed: { color: T.green, bg: T.greenSoft },
  Cancelled: { color: T.red, bg: T.redSoft },
};

export default function AuditsPage({ onOpenAudit }: any) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [detail, setDetail] = useState<any>(null);
  const queryClient = useQueryClient();
  const { sort, toggle, apply } = useSort("auditCode");

  const { data, isLoading } = useQuery({
    queryKey: ["audit-audits"],
    queryFn: async () => (await auditApi.get("/audits", { params: { pageSize: 100 } })).data,
    staleTime: 0,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: any) => auditApi.patch(`/audits/${id}/status`, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["audit-audits"] }); },
  });

  const audits = data?.items || [];
  const filtered = apply(audits.filter((a: any) => {
    const q = search.trim().toLowerCase();
    return (!q || a.name?.toLowerCase().includes(q) || a.auditCode?.toLowerCase().includes(q)) && (statusFilter === "All" || a.status === statusFilter);
  }));

  const columns = [
    { key: "auditCode", label: "Audit ID" },
    { key: "name", label: "Audit Name", render: (r: any) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { key: "type", label: "Type" },
    { key: "status", label: "Status", render: (r: any) => <Pill label={r.status} {...auditStatusMeta[r.status] || { color: T.grey, bg: T.greySoft }} /> },
    { key: "overallResult", label: "Result" },
    { key: "startDate", label: "Start", render: (r: any) => r.startDate?.slice(0, 10) || "—" },
    { key: "endDate", label: "End", render: (r: any) => r.endDate?.slice(0, 10) || "—" },
  ];

  return (
    <div>
      <PageHeading title="Audits" subtitle="All audit engagements." />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search audits…" resultCount={filtered.length} totalCount={audits.length} right={<FilterSelect value={statusFilter} options={["All", ...AUDIT_STATUSES]} onChange={setStatusFilter} />} />
      <DataTable columns={columns} rows={filtered} sort={sort} onSort={toggle} onRowClick={(r) => { setDetail(r); onOpenAudit?.(r.id); }} renderActions={(r: any) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={(event) => { event.stopPropagation(); setDetail(r); onOpenAudit?.(r.id); }} style={iconBtn} title="View"><Eye size={13} color={T.textSecondary} /></button>
          {r.status === "Planned" && <button onClick={() => statusMutation.mutate({ id: r.id, status: "In Progress" })} style={iconBtn} title="Start"><Play size={13} color={T.green} /></button>}
          {r.status === "In Progress" && <button onClick={() => statusMutation.mutate({ id: r.id, status: "Completed" })} style={iconBtn} title="Complete"><CheckCircle2 size={13} color={T.green} /></button>}
        </div>
      )} />

      {detail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", justifyContent: "flex-end", zIndex: 100 }}>
          <div style={{ width: 520, height: "100%", background: T.panelBg, padding: 24, overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div><div style={{ fontSize: 11, color: T.textMuted }}>{detail.auditCode}</div><div style={{ fontSize: 16, fontWeight: 700 }}>{detail.name}</div></div>
              <button onClick={() => setDetail(null)} style={iconBtn}>✕</button>
            </div>
            <SectionLabel>Audit Information</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <DetailRow k="Type" v={detail.type} />
              <DetailRow k="Status" v={detail.status} />
              <DetailRow k="Result" v={detail.overallResult} />
              <DetailRow k="Lead Auditor" v={detail.leadAuditor} />
              <DetailRow k="Auditee" v={detail.auditee} />
              <DetailRow k="Start Date" v={detail.startDate?.slice(0, 10) || "—"} />
              <DetailRow k="End Date" v={detail.endDate?.slice(0, 10) || "—"} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
