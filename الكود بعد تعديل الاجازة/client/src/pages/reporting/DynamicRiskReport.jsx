import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { resource } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import { LoadingState } from "../../components/States";
import { chipClass, fmtDate, SEVERITY_STYLES, titleCase } from "../../lib/format";

export default function DynamicRiskReport() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resource("risks").list().then((d) => setRows(d.items)).finally(() => setLoading(false));
  }, []);

  const exportCsv = () => {
    const headers = ["Title", "Category", "Owner", "Likelihood", "Impact", "Inherent", "Residual", "Severity", "Status", "Created", "Closed"];
    const lines = rows.map((r) =>
      [r.title, r.category, r.owner, r.likelihood, r.impactScore ?? r.impact, r.inherentScore ?? r.riskScore, r.residualScore, r.overallRisk || r.severityLevel || "—", r.status, fmtDate(r.createdAt), fmtDate(r.closedAt)]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[headers.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wadjet-risk-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="Dynamic Risk Report"
        subtitle="Filterable, exportable view of every risk and its current scoring fields."
        actions={<button className="btn-primary" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</button>}
      />
      {loading ? (
        <LoadingState />
      ) : (
        <DataTable
          pageSize={15}
          rows={rows}
          searchPlaceholder="Search report…"
          columns={[
            { key: "title", header: "Risk", render: (r) => <span className="font-medium text-neutral-100">{r.title}</span> },
            { key: "category", header: "Category", render: (r) => <span className="capitalize">{r.category}</span> },
            { key: "owner", header: "Owner" },
            { key: "likelihood", header: "L" },
            { key: "impact", header: "I", render: (r) => r.impactScore ?? r.impact },
            { key: "inherentScore", header: "Inherent", render: (r) => r.inherentScore ?? r.riskScore },
            { key: "residualScore", header: "Residual", render: (r) => <span className={`chip ${SEVERITY_STYLES[String(r.overallRisk || r.severityLevel || "low").toLowerCase()]}`}>{r.residualScore}</span> },
            { key: "status", header: "Status", render: (r) => <span className={chipClass(r.status)}>{titleCase(r.status)}</span> },
            { key: "createdAt", header: "Created", render: (r) => fmtDate(r.createdAt) },
          ]}
        />
      )}
    </>
  );
}
