import { useCallback, useEffect, useMemo, useState } from "react";
import { resource } from "../../../api/client";
import apiClient from "../../../api/client";
import DataTable from "../../../components/DataTable";
import { Select } from "../../../components/Field";
import { AUDIT_ACTION_STYLES, fmtDateTime } from "../../../lib/policy";
import { Shield, CheckCircle2, XCircle, Download } from "lucide-react";

const api = resource("policies");

const fmtMeta = (details) => {
  if (!details || typeof details !== "object") return "";
  return Object.entries(details)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join("  ");
};

export default function AuditTab({ policy }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`${policy._id}/audit-logs`).then((d) => setRows(d.items)).finally(() => setLoading(false));
  }, [policy._id]);

  useEffect(() => { load(); }, [load]);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const { data } = await apiClient.get("/audit/verify-chain-integrity");
      setVerifyResult(data);
    } catch (err) {
      setVerifyResult({ valid: false, error: err?.response?.data?.message || err.message });
    } finally {
      setVerifying(false);
    }
  };

  const handleExport = () => {
    const headers = ["Timestamp", "Action", "User", "Role", "Details"];
    const csvRows = rows.map((r) => [
      r.createdAt || "",
      r.actionType || "",
      r.actor || "system",
      r.actorRole || "",
      (fmtMeta(r.details) || "").replace(/"/g, '""'),
    ]);
    const csv = [headers.join(","), ...csvRows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${policy._id}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const users = useMemo(() => [...new Set(rows.map((r) => r.actor || "system"))].sort(), [rows]);
  const actions = useMemo(() => [...new Set(rows.map((r) => r.actionType))].sort(), [rows]);

  const filtered = useMemo(() => {
    const f = new Date(fromFilter);
    const t = new Date(toFilter);
    t.setHours(23, 59, 59, 999);
    return rows.filter((r) => {
      if (actionFilter && r.actionType !== actionFilter) return false;
      if (userFilter && (r.actor || "system") !== userFilter) return false;
      if (fromFilter && new Date(r.createdAt) < f) return false;
      if (toFilter && new Date(r.createdAt) > t) return false;
      return true;
    });
  }, [rows, actionFilter, userFilter, fromFilter, toFilter]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="label">Audit Log ({filtered.length} of {rows.length})</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost text-xs gap-1" onClick={handleVerify} disabled={verifying}>
            <Shield className="h-3 w-3" /> {verifying ? "Verifying..." : "Verify Integrity"}
          </button>
          <button className="btn-ghost text-xs gap-1" onClick={handleExport}>
            <Download className="h-3 w-3" /> Export CSV
          </button>
        </div>
      </div>

      {verifyResult && (
        <div className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-sm ${verifyResult.valid ? "border border-emerald-800/60 bg-emerald-950/40 text-emerald-300" : "border border-red-800/60 bg-red-950/40 text-red-300"}`}>
          {verifyResult.valid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {verifyResult.valid
            ? `? Audit chain verified — ${verifyResult.entriesVerified} entries checked, no tampering detected`
            : `? Audit Chain Integrity Failed — tampering detected at entry ${verifyResult.firstBrokenEntryId || "unknown"}`}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select className="!w-44" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} options={[{ value: "", label: "All actions" }, ...actions.map((a) => ({ value: a, label: a }))]} />
        <Select className="!w-44" value={userFilter} onChange={(e) => setUserFilter(e.target.value)} options={[{ value: "", label: "All users" }, ...users.map((u) => ({ value: u, label: u }))]} />
        <input type="date" className="input !w-36" value={fromFilter} onChange={(e) => setFromFilter(e.target.value)} title="From date" />
        <input type="date" className="input !w-36" value={toFilter} onChange={(e) => setToFilter(e.target.value)} title="To date" />
      </div>

      <DataTable
        columns={[
          { key: "createdAt", header: "Timestamp", render: (r) => <span className="whitespace-nowrap text-neutral-400">{fmtDateTime(r.createdAt)}</span> },
          { key: "actionType", header: "Action", render: (r) => <span className={`chip ${AUDIT_ACTION_STYLES(r.actionType)}`}>{r.actionType}</span> },
          { key: "actor", header: "User", render: (r) => (
              <span className="whitespace-nowrap font-medium text-neutral-100">
                {r.actor || "system"}
                {r.actorRole ? <span className="ml-1 text-[11px] font-normal text-neutral-500">({r.actorRole})</span> : null}
              </span>
            ),
          },
          { key: "details", header: "Details", render: (r) => <span className="max-w-[340px] font-mono text-[11px] leading-relaxed text-neutral-500">{fmtMeta(r.details) || "—"}</span> },
        ]}
        rows={filtered}
        loading={loading}
        searchable={false}
        emptyHint="No audit entries recorded yet. Actions like workflow transitions, edits and versioning are logged here."
      />
    </div>
  );
}
