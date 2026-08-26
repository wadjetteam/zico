import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Database,
  DatabaseBackup,
  Download,
  FileDown,
  HardDrive,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import { ErrorState, LoadingState } from "../../components/States";
import { Field, Select, TextInput } from "../../components/Field";
import { fmtDateTime, titleCase } from "../../lib/format";

const HOURS = Array.from({ length: 24 }, (_, h) => ({ value: h, label: `${String(h).padStart(2, "0")}:00` }));

function fmtBytes(b) {
  if (!b) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = b;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 100 ? 0 : 1)} ${units[i]}`;
}

export default function Backup() {
  const [config, setConfig] = useState(null);
  const [records, setRecords] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(() => {
    setError(null);
    Promise.all([api.get("/backup/config"), api.get("/backup/records")])
      .then(([c, r]) => {
        setConfig(c.data);
        setRecords(r.data.items);
      })
      .catch((e) => setError(e?.response?.data?.message || e.message));
  }, []);

  useEffect(load, [load]);

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/backup/config", config);
      setConfig(data);
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  const runNow = async () => {
    setRunning(true);
    try {
      await api.post("/backup/run");
      load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setRunning(false);
    }
  };

  const downloadRecord = async (record) => {
    try {
      const { data } = await api.get(`/backup/records/${record._id}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = record.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    }
  };

  const downloadExcel = async () => {
    try {
      const { data } = await api.get("/backup/export", { responseType: "blob" });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wadjet-data-export-${stamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    }
  };

  const deleteRecord = async (record) => {
    if (!window.confirm(`Delete backup "${record.filename}"? The file will be removed permanently.`)) return;
    try {
      await api.delete(`/backup/records/${record._id}`);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    }
  };

  const pickFile = (f) => {
    setFile(f);
    setConfirmText("");
    setRestoreResult(null);
  };

  const doRestore = async () => {
    if (!file) return alert("Choose a backup file first.");
    if (confirmText !== "RESTORE") return alert('Type "RESTORE" to confirm.');
    setRestoring(true);
    setRestoreResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/backup/restore", fd);
      setRestoreResult(data);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setRestoring(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!config || !records) return <LoadingState label="Loading backup module…" />;

  return (
    <>
      <PageHeader
        title="Backup"
        subtitle="Scheduled and on-demand database backups with integrity checksums, retention and restore."
          actions={
            <>
              <button className="btn-ghost" onClick={downloadExcel} disabled={restoring}>
                <FileDown className="h-4 w-4" /> Export to Excel
              </button>
              <button className="btn-ghost" onClick={() => setRestoreOpen(true)} disabled={restoring}>
                <Upload className="h-4 w-4" /> Restore
              </button>
              <button className="btn-primary" onClick={runNow} disabled={running}>
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseBackup className="h-4 w-4" />}
                {running ? "Backing up…" : "Backup now"}
              </button>
            </>
          }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="heading text-sm font-semibold uppercase tracking-wider text-neutral-400">
              Schedule & retention
            </h3>
            <span
              className={`chip ${config.enabled ? "border-emerald-800/60 bg-emerald-950/40 text-emerald-300" : "border-neutral-700 bg-neutral-900 text-neutral-400"}`}
            >
              {config.enabled ? "Scheduler on" : "Scheduler off"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Automatic backups">
              <Select
                value={config.enabled ? "on" : "off"}
                onChange={(e) => setConfig({ ...config, enabled: e.target.value === "on" })}
                options={[
                  { value: "on", label: "Enabled" },
                  { value: "off", label: "Disabled" },
                ]}
              />
            </Field>
            <Field label="Run time (daily)">
              <Select
                value={config.hour}
                onChange={(e) => setConfig({ ...config, hour: Number(e.target.value) })}
                options={HOURS}
              />
            </Field>
            <Field label="Keep last N backups">
              <TextInput
                type="number"
                min={1}
                max={90}
                value={config.retention}
                onChange={(e) => setConfig({ ...config, retention: Number(e.target.value) })}
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-4">
            <div className="text-xs text-neutral-500">
              {config.lastRunAt ? (
                <>
                  <span className="text-neutral-300">Last run:</span> {fmtDateTime(config.lastRunAt)}
                </>
              ) : (
                "No backup has run yet."
              )}
              {config.lastResult && <p className="mt-1 text-neutral-600">{config.lastResult}</p>}
            </div>
            <button className="btn-primary" onClick={saveConfig} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Save settings
            </button>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="heading text-sm font-semibold uppercase tracking-wider text-neutral-400">Protection posture</h3>
          <ul className="mt-4 space-y-3 text-xs text-neutral-400">
            <li className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              Every backup is SHA-256 checksummed; integrity is verified before any restore.
            </li>
            <li className="flex items-start gap-2.5">
              <Database className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              Full-database snapshots (all collections) — native MongoDB BSON format, zip-packed.
            </li>
            <li className="flex items-start gap-2.5">
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
              Daily automatic runs with a retention window of {config.retention} backup(s).
            </li>
            <li className="flex items-start gap-2.5">
              <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
              Restore first snapshots the current state as a safety backup.
            </li>
          </ul>
        </div>
      </div>

      <div className="card mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line/60 px-5 py-4">
          <h3 className="heading text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Backup history <span className="ml-1 text-neutral-600">({records.length})</span>
          </h3>
          <button className="btn-ghost" onClick={load}>
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {records.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
            <DatabaseBackup className="h-10 w-10 text-neutral-700" />
            <p className="text-sm text-neutral-500">No backups yet — run your first backup now.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line/60 text-left text-[11px] uppercase tracking-wider text-neutral-500">
                  <th className="px-5 py-3 font-medium">File</th>
                  <th className="px-3 py-3 font-medium">Trigger</th>
                  <th className="px-3 py-3 font-medium">Size</th>
                  <th className="px-3 py-3 font-medium">Collections</th>
                  <th className="px-3 py-3 font-medium">Docs</th>
                  <th className="px-3 py-3 font-medium">Created</th>
                  <th className="px-3 py-3 font-medium">Checksum</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id} className="border-b border-line/40 last:border-0">
                    <td className="max-w-[240px] px-5 py-3">
                      <div className="flex items-center gap-2">
                        <DatabaseBackup className={`h-4 w-4 shrink-0 ${r.status === "failed" ? "text-red-400" : "text-gold/70"}`} />
                        <span className="truncate font-mono text-xs text-neutral-200" title={r.filename}>
                          {r.filename}
                        </span>
                      </div>
                      {r.status === "failed" && <p className="mt-1 text-[11px] text-red-400">{r.error}</p>}
                      {r.restoredAt && (
                        <p className="mt-1 text-[11px] text-emerald-400">Restored {fmtDateTime(r.restoredAt)}</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`chip capitalize ${r.trigger === "scheduled" ? "border-sky-800/60 bg-sky-950/40 text-sky-300" : r.trigger === "pre-restore" ? "border-amber-800/60 bg-amber-950/40 text-amber-300" : "border-neutral-700 bg-neutral-900 text-neutral-300"}`}>
                        {r.trigger}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-neutral-400">{fmtBytes(r.sizeBytes)}</td>
                    <td className="px-3 py-3 text-xs text-neutral-400">{r.collectionCount}</td>
                    <td className="px-3 py-3 text-xs text-neutral-400">{r.documentCount}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-neutral-400">{fmtDateTime(r.createdAt)}</td>
                    <td className="px-3 py-3">
                      <span className="font-mono text-[11px] text-neutral-600" title={r.checksum}>
                        {r.checksum ? `${r.checksum.slice(0, 10)}…` : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button className="btn-ghost !px-2.5 !py-1.5" onClick={() => downloadRecord(r)} disabled={r.status === "failed"} title="Download">
                          <FileDown className="h-4 w-4" />
                        </button>
                        <button className="btn-ghost !px-2.5 !py-1.5" onClick={() => deleteRecord(r)} title="Delete">
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={restoreOpen} onClose={() => setRestoreOpen(false)} title="Restore database" width="lg">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-amber-800/50 bg-amber-950/20 px-4 py-3 text-xs text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Restoring replaces <b>all current data</b> with the contents of the backup file. A safety backup of the
              current state is created automatically before restoring. Type <b>RESTORE</b> to confirm.
            </p>
          </div>

          <Field label="Backup file (.bak.zip)">
            <input ref={fileRef} type="file" accept=".zip,.gz,.bak" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] || null)} />
            <div className="flex items-center gap-3">
              <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" /> Choose file
              </button>
              <span className="truncate text-xs text-neutral-400">{file ? file.name : "No file selected"}</span>
            </div>
          </Field>

          {restoreResult && (
            <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
              Restore completed: <b>{restoreResult.restoredCollections}</b> collection(s) restored. Safety backup:{" "}
              <b>{restoreResult.safetyBackup}</b>
            </div>
          )}

          <Field label={`Type RESTORE to confirm (${confirmText.length}/7)`}>
            <TextInput
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESTORE"
              className="uppercase"
            />
          </Field>

          <div className="flex justify-end gap-2 border-t border-line/60 pt-4">
            <button className="btn-ghost" onClick={() => setRestoreOpen(false)} disabled={restoring}>
              Close
            </button>
            <button className="btn-primary" onClick={doRestore} disabled={restoring || confirmText !== "RESTORE" || !file}>
              {restoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {restoring ? "Restoring…" : "Restore"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
