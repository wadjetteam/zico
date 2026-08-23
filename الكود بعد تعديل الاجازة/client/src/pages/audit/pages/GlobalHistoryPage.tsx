import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import auditApi from "../api";
import { PageHeading, Toolbar, FilterSelect, DataTable, useSort, T } from "../../compliance/shared";

export default function GlobalHistoryPage() {
  const [auditFilter, setAuditFilter] = useState("All");
  const [search, setSearch] = useState("");
  const { sort, toggle, apply } = useSort("when");

  const { data: historyData } = useQuery({
    queryKey: ["audit-history", auditFilter],
    queryFn: async () => {
      const auditsRes = await auditApi.get("/audits", { params: { pageSize: 100 } });
      const audits = auditsRes.data.items || [];
      const events: any[] = [];
      for (const audit of audits.slice(0, 5)) {
        const res = await auditApi.get(`/audits/${audit.id}`);
        const auditData = res.data;
        if (auditData.historyEvents) events.push(...auditData.historyEvents);
      }
      return { items: events.sort((a: any, b: any) => new Date(b.when).getTime() - new Date(a.when).getTime()) };
    },
  });

  const { data: auditsData } = useQuery({ queryKey: ["audit-audits-list"], queryFn: async () => (await auditApi.get("/audits", { params: { pageSize: 100 } })).data });

  const events = historyData?.items || [];
  const audits = auditsData?.items || [];
  const filtered = apply(events.filter((e: any) => {
    const q = search.trim().toLowerCase();
    return (!q || e.action?.toLowerCase().includes(q) || e.user?.toLowerCase().includes(q));
  }));

  const columns = [
    { key: "when", label: "Timestamp", render: (r: any) => new Date(r.when).toLocaleString() },
    { key: "auditId", label: "Audit", render: (r: any) => audits.find((a: any) => a.id === r.auditId)?.name || r.auditId },
    { key: "user", label: "User" },
    { key: "action", label: "Action" },
    { key: "prev", label: "Previous State" },
    { key: "next", label: "New State" },
  ];

  return (
    <div>
      <PageHeading title="Audit History" subtitle="Append-only log of all audit-related events." />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search history…" resultCount={filtered.length} totalCount={events.length} />
      <DataTable columns={columns} rows={filtered} sort={sort} onSort={toggle} />
    </div>
  );
}
