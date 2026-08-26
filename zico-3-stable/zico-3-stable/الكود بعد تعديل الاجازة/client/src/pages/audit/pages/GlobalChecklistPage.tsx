import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import auditApi from "../api";
import { PageHeading, Toolbar, FilterSelect, DataTable, useSort, Pill, T } from "../../compliance/shared";

const RESULT_STYLES: Record<string, { color: string; bg: string }> = {
  Conformity: { color: T.green, bg: T.greenSoft },
  PartialConformity: { color: T.amber, bg: T.amberSoft },
  NonConformity: { color: T.red, bg: T.redSoft },
  Observation: { color: T.blue, bg: T.blueSoft },
  NotApplicable: { color: T.grey, bg: T.greySoft },
  NotTested: { color: T.grey, bg: T.greySoft },
};

export default function GlobalChecklistPage() {
  const [auditFilter, setAuditFilter] = useState("All");
  const [resultFilter, setResultFilter] = useState("All");
  const [search, setSearch] = useState("");
  const { sort, toggle, apply } = useSort("id");

  const { data: checklistData } = useQuery({ queryKey: ["audit-checklist", auditFilter], queryFn: async () => (await auditApi.get("/checklist", { params: { auditId: auditFilter === "All" ? undefined : auditFilter, pageSize: 100 } })).data });
  const { data: auditsData } = useQuery({ queryKey: ["audit-audits-list"], queryFn: async () => (await auditApi.get("/audits", { params: { pageSize: 100 } })).data });

  const items = checklistData?.items || [];
  const audits = auditsData?.items || [];
  const filtered = apply(items.filter((item: any) => {
    const q = search.trim().toLowerCase();
    return (!q || item.testObjective?.toLowerCase().includes(q)) && (resultFilter === "All" || item.result === resultFilter);
  }));

  const columns = [
    { key: "auditId", label: "Audit", render: (r: any) => audits.find((a: any) => a.id === r.auditId)?.name || r.auditId },
    { key: "requirementId", label: "Requirement" },
    { key: "controlId", label: "Control" },
    { key: "testObjective", label: "Test Objective", render: (r: any) => <span style={{ maxWidth: 200, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.testObjective}</span> },
    { key: "auditor", label: "Auditor" },
    { key: "result", label: "Result", render: (r: any) => <Pill label={r.result} {...RESULT_STYLES[r.result] || { color: T.grey, bg: T.greySoft }} /> },
    { key: "reviewStatus", label: "Review" },
  ];

  return (
    <div>
      <PageHeading title="Checklist" desc="Audit checklist items across all audits." />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search checklist…" resultCount={filtered.length} totalCount={items.length} right={<><FilterSelect value={auditFilter} options={["All", ...audits.map((a: any) => a.id)]} onChange={setAuditFilter} /><FilterSelect value={resultFilter} options={["All", "Conformity", "PartialConformity", "NonConformity", "Observation", "NotApplicable", "NotTested"]} onChange={setResultFilter} /></>} />
      <DataTable columns={columns} rows={filtered} sort={sort} onSort={toggle} />
    </div>
  );
}
