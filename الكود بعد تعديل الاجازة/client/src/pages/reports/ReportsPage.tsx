import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Shield, ShieldCheck, AlertTriangle, Search, Building2, BarChart3, Clock, ClipboardList, FolderOpen, Users, UserCog, AlertOctagon, ScrollText, ShieldCheck as ShieldCheckIcon, Building, Gavel, ClipboardCheck, BadgeCheck, FileCheck, Handshake } from "lucide-react";
import api from "../../api/client";

const MODULES = [
  { id: "all", label: "All Reports", icon: FileText },
  { id: "compliance", label: "Compliance", icon: Shield },
  { id: "risk", label: "Risk", icon: AlertTriangle },
  { id: "audit", label: "Audit", icon: Search },
  { id: "asset", label: "Asset", icon: Building2 },
  { id: "governance", label: "Governance", icon: ShieldCheckIcon },
  { id: "controls", label: "Controls", icon: ClipboardCheck },
  { id: "context", label: "Context", icon: Building },
  { id: "platform", label: "Platform", icon: BarChart3 },
];

export default function ReportsPage({ moduleFilter = "all" }) {
  const [activeModule, setActiveModule] = useState(moduleFilter);
  const [downloading, setDownloading] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", activeModule],
    queryFn: async () => {
      const params = activeModule !== "all" ? { module: activeModule } : {};
      return (await api.get("/reports", { params })).data;
    },
  });

  const reports = data?.items || [];
  const filteredReports = activeModule === "all" ? reports : reports.filter((r) => r.module === activeModule);

  const handleDownload = async (reportId, format) => {
    setDownloading(`${reportId}-${format}`);
    try {
      const token = localStorage.getItem("wadjet_token");
      const response = await fetch(`/api/reports/generate?reportId=${reportId}&format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errData.message || `HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportId}_${Date.now()}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to generate report: " + err.message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Reports</h1>
      <p className="text-sm text-neutral-400 mb-6">Generate and download audit-ready reports from any module.</p>

      {/* Module Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {MODULES.map((mod) => (
          <button
            key={mod.id}
            onClick={() => setActiveModule(mod.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeModule === mod.id
                ? "bg-gold text-black"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            <mod.icon size={14} />
            {mod.label}
          </button>
        ))}
      </div>

      {/* Reports Grid */}
      {isLoading ? (
        <div className="text-neutral-400">Loading reports...</div>
      ) : filteredReports.length === 0 ? (
        <div className="text-neutral-400">No reports available for this module.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <div key={report.id} className="card p-5 hover:border-gold/50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  {getIcon(report.icon)}
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-100 text-sm">{report.name}</h3>
                  <span className="text-xs text-neutral-500 capitalize">{report.module}</span>
                </div>
              </div>
              <p className="text-xs text-neutral-400 mb-4 line-clamp-2">{report.description}</p>
              <div className="flex gap-2">
                {report.formats.map((format) => (
                  <button
                    key={format}
                    onClick={() => handleDownload(report.id, format)}
                    disabled={downloading === `${report.id}-${format}`}
                    className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    <Download size={12} />
                    {downloading === `${report.id}-${format}` ? "..." : `.${format.toUpperCase()}`}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getIcon(iconName) {
  const icons = { ShieldCheck, Shield, AlertTriangle, FileText, Building2, Search, BarChart3, Clock, ClipboardList, FolderOpen, Users, UserCog, AlertOctagon, ScrollText, ClipboardCheck, BadgeCheck, FileCheck, Handshake, Building, Gavel };
  const Icon = icons[iconName] || FileText;
  return <Icon size={18} className="text-gold" />;
}
