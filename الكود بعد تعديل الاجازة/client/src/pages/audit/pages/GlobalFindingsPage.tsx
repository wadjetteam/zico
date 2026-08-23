import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import auditApi from "../api";
import { PageHeading, Toolbar, FilterSelect, DataTable, useSort, Pill, T, SectionLabel, DetailRow } from "../../compliance/shared";

const SEVERITY_STYLES: Record<string, { color: string; bg: string }> = {
  Critical: { color: T.red, bg: T.redSoft },
  High: { color: "#e28a4f", bg: "rgba(226,138,79,0.14)" },
  Medium: { color: T.amber, bg: T.amberSoft },
  Low: { color: T.grey, bg: T.greySoft },
  Observation: { color: T.blue, bg: T.blueSoft },
};

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  Open: { color: T.red, bg: T.redSoft },
  Assigned: { color: T.amber, bg: T.amberSoft },
  InProgress: { color: T.blue, bg: T.blueSoft },
  PendingVerification: { color: T.purple, bg: T.purpleSoft },
  Resolved: { color: T.green, bg: T.greenSoft },
  Closed: { color: T.grey, bg: T.greySoft },
  Accepted: { color: T.grey, bg: T.greySoft },
};

export default function GlobalFindingsPage() {
  const qc = useQueryClient();
  const [auditFilter, setAuditFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const { sort, toggle, apply } = useSort("id");

  const { data: findingsData } = useQuery({ queryKey: ["audit-findings", auditFilter], queryFn: async () => (await auditApi.get("/findings", { params: { auditId: auditFilter === "All" ? undefined : auditFilter, pageSize: 100 } })).data });
  const { data: auditsData } = useQuery({ queryKey: ["audit-audits-list"], queryFn: async () => (await auditApi.get("/audits", { params: { pageSize: 100 } })).data });

  const items = findingsData?.items || [];
  const audits = auditsData?.items || [];
  const filtered = apply(items.filter((f: any) => {
    const q = search.trim().toLowerCase();
    return (!q || f.description?.toLowerCase().includes(q)) && (severityFilter === "All" || f.severity === severityFilter) && (statusFilter === "All" || f.status === statusFilter);
  }));

  const columns = [
    { key: "findingCode", label: "ID" },
    { key: "auditId", label: "Audit", render: (r: any) => audits.find((a: any) => a.id === r.auditId)?.name || r.auditId },
    { key: "description", label: "Finding", render: (r: any) => <span style={{ maxWidth: 200, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</span> },
    { key: "severity", label: "Severity", render: (r: any) => <Pill label={r.severity} {...SEVERITY_STYLES[r.severity] || { color: T.grey, bg: T.greySoft }} /> },
    { key: "owner", label: "Owner" },
    { key: "dueDate", label: "Due", render: (r: any) => r.dueDate?.slice(0, 10) || "—" },
    { key: "status", label: "Status", render: (r: any) => <Pill label={r.status} {...STATUS_STYLES[r.status] || { color: T.grey, bg: T.greySoft }} /> },
  ];

  return (
    <div>
      <PageHeading title="Findings" desc="Audit findings across all audits." />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search findings…" resultCount={filtered.length} totalCount={items.length} right={<><FilterSelect value={auditFilter} options={["All", ...audits.map((a: any) => a.id)]} onChange={setAuditFilter} /><FilterSelect value={severityFilter} options={["All", "Critical", "High", "Medium", "Low", "Observation"]} onChange={setSeverityFilter} /><FilterSelect value={statusFilter} options={["All", "Open", "Assigned", "InProgress", "PendingVerification", "Resolved", "Closed"]} onChange={setStatusFilter} /></>} />
      <DataTable columns={columns} rows={filtered} sort={sort} onSort={toggle} onRowClick={(r) => setDetail(r)} />

      {detail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", justifyContent: "flex-end", zIndex: 100 }}>
          <div style={{ width: 520, height: "100%", background: T.panelBg, padding: 24, overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div><div style={{ fontSize: 11, color: T.textMuted }}>{detail.findingCode}</div><div style={{ fontSize: 16, fontWeight: 700 }}>{detail.description}</div></div>
              <button onClick={() => setDetail(null)} style={{ border: `1px solid ${T.panelBorder}`, background: T.inputBg, borderRadius: 7, padding: 8, cursor: "pointer" }}>✕</button>
            </div>
            <SectionLabel>Finding Details</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <DetailRow k="Severity" v={<Pill label={detail.severity} {...SEVERITY_STYLES[detail.severity]} />} />
              <DetailRow k="Status" v={detail.status} />
              <DetailRow k="Owner" v={detail.owner} />
              <DetailRow k="Root Cause" v={detail.rootCause} />
              <DetailRow k="Impact" v={detail.impact} />
              <DetailRow k="Recommendation" v={detail.recommendation} />
              <DetailRow k="Due Date" v={detail.dueDate?.slice(0, 10) || "—"} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
