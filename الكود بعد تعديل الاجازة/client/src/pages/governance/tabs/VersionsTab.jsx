import { useCallback, useEffect, useMemo, useState } from "react";
import { FileDiff, Loader2, Plus, Trash2 } from "lucide-react";
import { resource } from "../../../api/client";
import DataTable from "../../../components/DataTable";
import Modal from "../../../components/Modal";
import { Field, Select, TextArea } from "../../../components/Field";
import { diffLines, fmtDateTime, orDash } from "../../../lib/policy";

const api = resource("policies");

const nextVersion = (current, changeType) => {
  const [maj, min] = String(current || "1.0").split(".").map((n) => parseInt(n, 10) || 0);
  return changeType === "Major" ? `v${maj + 1}.0` : `v${maj}.${min + 1}`;
};

const STATUS_STYLES = {
  Draft: "border-gray-700 bg-gray-800/50 text-neutral-300",
  Approved: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
};

export default function VersionsTab({ policy, reload, compareOnly }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ changeType: "Minor", changeSummary: "" });
  const [saving, setSaving] = useState(false);
  const [older, setOlder] = useState("");
  const [newer, setNewer] = useState("");
  const [diff, setDiff] = useState(null);
  const [diffOpen, setDiffOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`${policy._id}/versions`).then((d) => setRows(d.items)).finally(() => setLoading(false));
  }, [policy._id]);

  useEffect(() => { load(); }, [load]);

  const versions = useMemo(() => [...rows].sort((a, b) => cmpVersion(a.version, b.version)), [rows]);

  const cmpVersion = (va, vb) => {
    const [am, an] = String(va || "1.0").split(".").map((n) => parseInt(n, 10) || 0);
    const [bm, bn] = String(vb || "1.0").split(".").map((n) => parseInt(n, 10) || 0);
    return am - bm || an - bn;
  };

  useEffect(() => {
    if (versions.length) {
      if (!older) setOlder(versions[0]._id);
      if (!newer) setNewer(versions[versions.length - 1]._id);
    }
  }, [versions, older, newer]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.create(`${policy._id}/versions`, { changeType: form.changeType, summary: form.changeSummary });
      setOpen(false);
      setForm({ changeType: "Minor", changeSummary: "" });
      load();
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm("Delete this version snapshot?")) return;
    await api.remove(`${policy._id}/versions/${row._id}`);
    load();
  };

  const runCompare = () => {
    const a = versions.find((v) => v._id === older);
    const b = versions.find((v) => v._id === newer);
    if (!a || !b) return;
    setDiff({ a, b, lines: diffLines(a.content || "", b.content || "") });
    setDiffOpen(true);
  };

  const current = policy.version;

  return (
    <div>
      {!compareOnly ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="label">Version History ({rows.length}) — current: <span className="font-mono text-gold">v{current}</span></p>
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Create Version
          </button>
        </div>
      ) : (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="label">Compare Versions</p>
        </div>
      )}

      {!compareOnly && (
        <DataTable
          columns={[
            { key: "version", header: "Version", render: (r) => <span className="whitespace-nowrap font-mono text-xs text-gold">v{r.version}</span> },
            { key: "status", header: "Status", render: (r) => <span className={`chip ${STATUS_STYLES[r.status] || STATUS_STYLES.Draft}`}>{r.status}</span> },
            {
              key: "current",
              header: "",
              sortable: false,
              render: (r) => (r.isCurrent ? <span className="chip border-gold/50 bg-gold/10 text-gold">Current</span> : null),
            },
            { key: "changeType", header: "Change type", render: (r) => <span className="chip">{r.changeType}</span> },
            { key: "summary", header: "Summary", render: (r) => <span className="max-w-[300px] text-neutral-400">{orDash(r.summary)}</span> },
            { key: "publishedBy", header: "Created by", render: (r) => <span className="whitespace-nowrap text-neutral-300">{orDash(r.publishedBy)}</span> },
            { key: "createdAt", header: "Created at", render: (r) => <span className="whitespace-nowrap text-neutral-400">{fmtDateTime(r.createdAt)}</span> },
            {
              key: "__a",
              header: "",
              sortable: false,
              className: "w-14 text-right",
              render: (r) => (
                <button onClick={() => remove(r)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-red-950/40 hover:text-red-300" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              ),
            },
          ]}
          rows={versions}
          loading={loading}
          searchable={false}
          emptyHint="No versions recorded yet."
        />
      )}

      {compareOnly && (
        <div>
          <div className="card mb-4 flex flex-wrap items-end gap-3">
            <Field label="Older version" className="min-w-[200px] flex-1">
              <Select value={older} onChange={(e) => setOlder(e.target.value)} options={versions.map((v) => ({ value: v._id, label: `v${v.version} — ${v.changeType} (${fmtDateTime(v.createdAt)})` }))} />
            </Field>
            <Field label="Newer version" className="min-w-[200px] flex-1">
              <Select value={newer} onChange={(e) => setNewer(e.target.value)} options={versions.map((v) => ({ value: v._id, label: `v${v.version} — ${v.changeType} (${fmtDateTime(v.createdAt)})` }))} />
            </Field>
            <button className="btn-primary" onClick={runCompare} disabled={!older || !newer || older === newer}>
              <FileDiff className="h-4 w-4" /> Compare
            </button>
          </div>
          {versions.length === 0 && (
            <div className="card py-16 text-center text-sm text-neutral-500">No versions to compare yet.</div>
          )}
        </div>
      )}

      <Modal open={open} onClose={() => !saving && setOpen(false)} title="Create New Version" width="max-w-lg"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="version-form" type="submit" disabled={saving || !form.changeSummary}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Create Version
            </button>
          </>
        }
      >
        <form id="version-form" onSubmit={save} className="grid grid-cols-1 gap-4">
          <p className="text-xs text-neutral-500">
            Current version: <span className="font-mono text-gold">v{current}</span> â†’ next:{" "}
            <span className="font-mono text-gold">{nextVersion(current, form.changeType)}</span>
          </p>
          <Field label="Change type">
            <Select value={form.changeType} onChange={(e) => setForm((s) => ({ ...s, changeType: e.target.value }))} options={["Minor", "Major"].map((t) => ({ value: t, label: t }))} />
          </Field>
          <Field label="Change summary *">
            <TextArea value={form.changeSummary} onChange={(e) => setForm((s) => ({ ...s, changeSummary: e.target.value }))} required placeholder="What changed in this version”¦" />
          </Field>
        </form>
      </Modal>

      <Modal open={diffOpen} onClose={() => setDiffOpen(false)} title={`Compare v${diff?.a?.versionNumber} â†’ v${diff?.b?.versionNumber}`} width="max-w-2xl"
        footer={<button className="btn-ghost" onClick={() => setDiffOpen(false)} type="button">Close</button>}
      >
        <div className="grid grid-cols-1 gap-3">
          {diff?.lines.map((l, i) => (
            <div key={i} className={`rounded-md border px-3 py-2 font-mono text-xs leading-relaxed ${
              l.type === "add"
                ? "border-emerald-900/60 bg-emerald-950/40 text-emerald-300"
                : l.type === "del"
                ? "border-red-900/60 bg-red-950/40 text-red-300"
                : "border-transparent text-neutral-400"
            }`}>
              {l.type === "add" ? "+ " : l.type === "del" ? "- " : "  "}
              {l.text || "\u00A0"}
            </div>
          ))}
          {diff && diff.lines.length === 0 && <p className="py-8 text-center text-sm text-neutral-500">No textual difference.</p>}
        </div>
      </Modal>
    </div>
  );
}
