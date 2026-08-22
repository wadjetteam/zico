import { useCallback, useEffect, useState } from "react";
import { Link2, Plus } from "lucide-react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import { ErrorState } from "../../components/States";
import { Field, Select } from "../../components/Field";

export default function Crosswalks() {
  const [frameworks, setFrameworks] = useState([]);
  const [sourceFw, setSourceFw] = useState("");
  const [targetFw, setTargetFw] = useState("");
  const [sourceControls, setSourceControls] = useState([]);
  const [targetControls, setTargetControls] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ sourceControl: "", targetControl: "", mappingStrength: "Partial" });
  const [saving, setSaving] = useState(false);

  const loadFrameworks = useCallback(() => {
    api.get("/frameworks", { params: { pageSize: 100 } }).then((r) => {
      const items = r.data.items || [];
      setFrameworks(items);
      if (!sourceFw && items.length > 1) setSourceFw(items[0]._id);
      if (!targetFw && items.length > 1) setTargetFw(items[1]._id);
    });
  }, []);

  useEffect(() => {
    loadFrameworks();
  }, [loadFrameworks]);

  useEffect(() => {
    if (!sourceFw) return;
    api.get("/controls", { params: { framework: sourceFw, pageSize: 500 } }).then((r) => setSourceControls(r.data.items || []));
  }, [sourceFw]);

  useEffect(() => {
    if (!targetFw) return;
    setLoading(true);
    setError(null);
    Promise.all([
      api.get("/controls", { params: { framework: targetFw, pageSize: 500 } }).then((r) => setTargetControls(r.data.items || [])),
      api.get("/compliance/crosswalks", { params: { framework: targetFw } }).then((r) => setMappings(r.data.items || [])),
    ])
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [targetFw]);

  const mapKey = (srcId, tgtId) => `${srcId}::${tgtId}`;
  const byKey = {};
  for (const m of mappings) {
    if (m.sourceControl && m.targetControl) byKey[mapKey(m.sourceControl._id, m.targetControl._id)] = m;
  }

  const removeMapping = async (m) => {
    if (!window.confirm("Remove this mapping?")) return;
    await api.delete(`/compliance/crosswalks/${m._id}`);
    const r = await api.get("/compliance/crosswalks", { params: { framework: targetFw } });
    setMappings(r.data.items || []);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/compliance/crosswalks", { ...form, targetFramework: targetFw });
      setAddOpen(false);
      setForm({ sourceControl: "", targetControl: "", mappingStrength: "Partial" });
      const r = await api.get("/compliance/crosswalks", { params: { framework: targetFw } });
      setMappings(r.data.items || []);
    } catch (err) {
      window.alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const cellClass = (m) =>
    m
      ? m.mappingStrength === "Full"
        ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/40"
        : "bg-amber-950/40 text-amber-300 border-amber-800/40"
      : "border-line/40 text-neutral-700 hover:border-neutral-600 hover:text-neutral-400";

  return (
    <>
      <PageHeader
        title="Crosswalk Explorer"
        subtitle="Map controls across frameworks to find coverage overlaps and gaps."
        actions={
          <>
            <Select className="w-56" value={sourceFw} onChange={(e) => setSourceFw(e.target.value)} options={frameworks.map((f) => ({ value: f._id, label: `From: ${f.name}` }))} />
            <Select className="w-56" value={targetFw} onChange={(e) => setTargetFw(e.target.value)} options={frameworks.map((f) => ({ value: f._id, label: `To: ${f.name}` }))} />
            <button className="btn-primary" onClick={() => setAddOpen(true)} disabled={!sourceFw || !targetFw}><Plus className="h-4 w-4" /> Add Mapping</button>
          </>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-line bg-white/[0.02]">
                  <th className="sticky left-0 bg-[#0b0b0e] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {frameworks.find((f) => f._id === sourceFw)?.name || "Source"} →
                  </th>
                  {targetControls.map((c) => (
                    <th key={c._id} className="px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                      <div>{c.controlId}</div>
                      <div className="font-normal normal-case text-neutral-600">{c.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sourceControls.map((sc) => (
                  <tr key={sc._id} className="border-b border-line/60 last:border-0 hover:bg-white/[0.02]">
                    <td className="sticky left-0 bg-[#0b0b0e] px-4 py-2">
                      <div className="font-medium text-neutral-200">{sc.controlId}</div>
                      <div className="text-[10px] text-neutral-500">{sc.name}</div>
                    </td>
                    {targetControls.map((tc) => {
                      const m = byKey[mapKey(sc._id, tc._id)];
                      return (
                        <td key={tc._id} className="px-2 py-2 text-center">
                          <button
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-xs transition ${cellClass(m)}`}
                            title={m ? `${sc.controlId} ↔ ${tc.controlId} (${m.mappingStrength})` : "Not mapped — click to add"}
                            onClick={() => {
                              if (m) {
                                if (window.confirm(`Remove ${sc.controlId} ↔ ${tc.controlId} mapping?`)) removeMapping(m);
                              } else {
                                setForm({ sourceControl: sc._id, targetControl: tc._id, mappingStrength: "Partial" });
                                setAddOpen(true);
                              }
                            }}
                          >
                            {m ? <Link2 className="h-3.5 w-3.5" /> : "+"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {!sourceControls.length && !loading && (
                  <tr><td colSpan={targetControls.length + 1} className="px-4 py-10 text-center text-sm text-neutral-500">No controls in the source framework.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-line px-4 py-3 text-xs text-neutral-500">
            {mappings.length} mapping(s) into {frameworks.find((f) => f._id === targetFw)?.name || "target"} ·{" "}
            <span className="text-emerald-400">● Full</span> <span className="ml-2 text-amber-400">● Partial</span>
          </div>
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add crosswalk mapping" width="max-w-xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setAddOpen(false)} type="button">Cancel</button>
            <button className="btn-primary" form="crosswalk-form" type="submit" disabled={saving}>{saving ? "Saving…" : "Add mapping"}</button>
          </>
        }
      >
        <form id="crosswalk-form" onSubmit={save} className="grid grid-cols-1 gap-4">
          <Field label="Source control">
            <Select value={form.sourceControl || ""} onChange={(e) => setForm((f) => ({ ...f, sourceControl: e.target.value }))} options={[{ value: "", label: "— Select —" }, ...sourceControls.map((c) => ({ value: c._id, label: `${c.controlId} — ${c.name}` }))]} />
          </Field>
          <Field label="Target control">
            <Select value={form.targetControl || ""} onChange={(e) => setForm((f) => ({ ...f, targetControl: e.target.value }))} options={[{ value: "", label: "— Select —" }, ...targetControls.map((c) => ({ value: c._id, label: `${c.controlId} — ${c.name}` }))]} />
          </Field>
          <Field label="Mapping strength">
            <Select value={form.mappingStrength || "Partial"} onChange={(e) => setForm((f) => ({ ...f, mappingStrength: e.target.value }))} options={[{ value: "Full", label: "Full" }, { value: "Partial", label: "Partial" }]} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
