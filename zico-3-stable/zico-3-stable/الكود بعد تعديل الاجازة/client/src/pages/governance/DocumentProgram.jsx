import { useCallback, useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import { Field, Select, TextInput } from "../../components/Field";
import { LoadingState } from "../../components/States";

const FILE_TYPE_OPTIONS = ["pdf", "docx", "xlsx", "pptx", "png", "jpg", "jpeg", "csv", "txt", "md", "json", "xml", "zip", "msg", "eml"];

const Section = ({ title, hint, children, onSave, saving, id }) => (
  <section id={id} className="card overflow-hidden scroll-mt-20">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white/[0.02] px-5 py-4">
      <div>
        <h2 className="heading text-sm font-semibold text-neutral-100">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-neutral-500">{hint}</p>}
      </div>
      <button className="btn-primary px-3 py-1.5 text-xs" onClick={onSave} disabled={saving}>
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
      </button>
    </div>
    <div className="p-5">{children}</div>
  </section>
);

export default function DocumentProgram() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [__v] = useState(Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/governance/document-program");
      setSettings({
        classificationSchema: [],
        retentionRules: [],
        numberingConventions: [],
        versioningRules: { majorTrigger: "", minorTrigger: "", majorRequiresReapproval: true },
        allowedFileTypes: ["pdf", "docx"],
        approvalWorkflow: false,
        autoVersioning: false,
        reviewReminders: false,
        reminderDays: 30,
        retentionYears: 7,
        ...data,
        classificationSchema: Array.isArray(data?.classificationSchema) ? data.classificationSchema : [],
        retentionRules: Array.isArray(data?.retentionRules) ? data.retentionRules : [],
        numberingConventions: Array.isArray(data?.numberingConventions) ? data.numberingConventions : [],
        versioningRules: data?.versioningRules ? data.versioningRules : { majorTrigger: "", minorTrigger: "", majorRequiresReapproval: true },
        allowedFileTypes: Array.isArray(data?.allowedFileTypes) ? data.allowedFileTypes : [],
      });
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveSection = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/governance/document-program", settings);
      setSettings(data);
      alert("Document program saved.");
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const patch = (fn) => setSettings((s) => ({ ...s, ...fn(s) }));

  if (loading || !settings) return <LoadingState label="Loading document program…" />;

  const { classificationSchema = [], retentionRules = [], numberingConventions = [], versioningRules = {}, allowedFileTypes = [], maxFileSizeMb } = settings;

  return (
    <>
      <PageHeader title="Document Program" subtitle="Organization-wide document management rules." />

      <div className="grid gap-6">
        <Section
          id="classification"
          title="1 · Classification Schema"
          hint="Classification levels align to the Policy classification set. Levels can be added, descriptions and handling requirements are editable here."
          onSave={saveSection}
          saving={saving}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line bg-white/[0.02]">
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Level</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Description</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Handling requirements</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Color</th>
                  <th className="w-12 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {classificationSchema.map((row, i) => (
                  <tr key={row.level} className="border-b border-line/60 last:border-0">
                    <td className="px-3 py-2 align-middle">
                      <input
                        className="input max-w-[140px] py-1.5"
                        value={row.level}
                        onChange={(e) =>
                          patch((s) => ({
                            classificationSchema: s.classificationSchema.map((c, ci) => (ci === i ? { ...c, level: e.target.value } : c)),
                          }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <input
                        className="input py-1.5"
                        value={row.description}
                        onChange={(e) =>
                          patch((s) => ({
                            classificationSchema: s.classificationSchema.map((c, ci) => (ci === i ? { ...c, description: e.target.value } : c)),
                          }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <textarea
                        className="input resize-y py-1.5"
                        rows={2}
                        value={row.handlingRequirements}
                        onChange={(e) =>
                          patch((s) => ({
                            classificationSchema: s.classificationSchema.map((c, ci) => (ci === i ? { ...c, handlingRequirements: e.target.value } : c)),
                          }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <input
                        type="color"
                        className="h-8 w-12 cursor-pointer rounded border border-line bg-transparent"
                        value={row.color}
                        onChange={(e) =>
                          patch((s) => ({
                            classificationSchema: s.classificationSchema.map((c, ci) => (ci === i ? { ...c, color: e.target.value } : c)),
                          }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right align-middle">
                      <button
                        className="text-xs text-neutral-600 transition hover:text-red-300"
                        onClick={() =>
                          patch((s) => ({
                            classificationSchema: s.classificationSchema.filter((_, ci) => ci !== i),
                            retentionRules: s.retentionRules.filter((r) => r.level !== row.level),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="btn-ghost mt-3 px-3 py-1.5 text-xs"
            onClick={() => patch((s) => ({ classificationSchema: [...s.classificationSchema, { level: "New Level", description: "", handlingRequirements: "", color: "#d4af37" }] }))}
          >
            + Add level
          </button>
        </Section>

        <Section id="retention" title="2 · Retention Policy" hint="Per classification level: how long documents are kept and what happens on expiry." onSave={saveSection} saving={saving}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line bg-white/[0.02]">
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Level</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Retention period (years)</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Disposal method</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Legal hold override</th>
                </tr>
              </thead>
              <tbody>
                {retentionRules.map((row, i) => (
                  <tr key={`${row.level}-${i}`} className="border-b border-line/60 last:border-0">
                    <td className="px-3 py-2 align-middle text-neutral-200">{row.level}</td>
                    <td className="px-3 py-2 align-middle">
                      <input
                        type="number"
                        min="0"
                        className="input max-w-[110px] py-1.5"
                        value={row.retentionYears}
                        onChange={(e) =>
                          patch((s) => ({ retentionRules: s.retentionRules.map((r, ri) => (ri === i ? { ...r, retentionYears: e.target.value } : r)) }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <Select
                        className="max-w-[180px] py-1.5"
                        value={row.disposalMethod}
                        onChange={(e) => patch((s) => ({ retentionRules: s.retentionRules.map((r, ri) => (ri === i ? { ...r, disposalMethod: e.target.value } : r)) }))}
                        options={["Delete", "Archive", "Review"].map((v) => ({ value: v, label: v }))}
                      />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-gold"
                          checked={row.legalHoldOverride}
                          onChange={(e) => patch((s) => ({ retentionRules: s.retentionRules.map((r, ri) => (ri === i ? { ...r, legalHoldOverride: e.target.checked } : r)) }))}
                        />
                        Hold applies
                      </label>
                    </td>
                  </tr>
                ))}
                {classificationSchema.filter((c) => !retentionRules.some((r) => r.level === c.level)).map((c) => (
                  <tr key={c.level}>
                    <td className="px-3 py-2 text-neutral-400">{c.level} <span className="text-neutral-600">(no rule yet)</span></td>
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2">
                      <button
                        className="text-xs text-gold"
                        onClick={() =>
                          patch((s) => ({ retentionRules: [...s.retentionRules, { level: c.level, retentionYears: 5, disposalMethod: "Archive", legalHoldOverride: false }] }))
                        }
                      >
                        + Add rule
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="numbering" title="3 · Numbering Convention" hint="Prefix patterns per record type. Document IDs are auto-generated with these conventions." onSave={saveSection} saving={saving}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line bg-white/[0.02]">
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Record type</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Prefix</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Padding width</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Next number</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Example</th>
                </tr>
              </thead>
              <tbody>
                {numberingConventions.map((row, i) => (
                  <tr key={`${row.recordType}-${i}`} className="border-b border-line/60 last:border-0">
                    <td className="px-3 py-2 align-middle">
                      <input
                        className="input max-w-[160px] py-1.5"
                        value={row.recordType}
                        onChange={(e) => patch((s) => ({ numberingConventions: s.numberingConventions.map((r, ri) => (ri === i ? { ...r, recordType: e.target.value } : r)) }))}
                      />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <input
                        className="input max-w-[110px] py-1.5"
                        value={row.prefix}
                        onChange={(e) => patch((s) => ({ numberingConventions: s.numberingConventions.map((r, ri) => (ri === i ? { ...r, prefix: e.target.value.toUpperCase() } : r)) }))}
                      />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <input
                        type="number"
                        min="1"
                        max="8"
                        className="input max-w-[90px] py-1.5"
                        value={row.paddingWidth}
                        onChange={(e) => patch((s) => ({ numberingConventions: s.numberingConventions.map((r, ri) => (ri === i ? { ...r, paddingWidth: e.target.value } : r)) }))}
                      />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <input
                        type="number"
                        min="1"
                        className="input max-w-[110px] py-1.5"
                        value={row.nextNumber}
                        onChange={(e) => patch((s) => ({ numberingConventions: s.numberingConventions.map((r, ri) => (ri === i ? { ...r, nextNumber: e.target.value } : r)) }))}
                      />
                    </td>
                    <td className="px-3 py-2 align-middle font-mono text-xs text-gold">
                      {row.prefix}-{String(row.nextNumber).padStart(Number(row.paddingWidth) || 4, "0")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="btn-ghost mt-3 px-3 py-1.5 text-xs"
            onClick={() => patch((s) => ({ numberingConventions: [...s.numberingConventions, { recordType: "New Type", prefix: "NEW", paddingWidth: 4, nextNumber: 1 }] }))}
          >
            + Add convention
          </button>
        </Section>

        <Section id="versioning" title="4 · Versioning Rules" hint="What triggers a major vs minor version bump, and whether major versions must re-enter the full workflow." onSave={saveSection} saving={saving}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Major version trigger">
              <Select
                value={versioningRules.majorTrigger}
                onChange={(e) => patch((s) => ({ versioningRules: { ...s.versioningRules, majorTrigger: e.target.value } }))}
                options={["Content change (substantive text or scope)", "Structure or workflow change", "Regulatory requirement change"].map((v) => ({ value: v, label: v }))}
              />
            </Field>
            <Field label="Minor version trigger">
              <Select
                value={versioningRules.minorTrigger}
                onChange={(e) => patch((s) => ({ versioningRules: { ...s.versioningRules, minorTrigger: e.target.value } }))}
                options={["Metadata-only change (owner, tags, dates)", "Editorial or wording-only change"].map((v) => ({ value: v, label: v }))}
              />
            </Field>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-neutral-300 sm:col-span-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-gold"
                checked={versioningRules.majorRequiresReapproval}
                onChange={(e) => patch((s) => ({ versioningRules: { ...s.versioningRules, majorRequiresReapproval: e.target.checked } }))}
              />
              Major version changes require re-approval through the full workflow
            </label>
          </div>
        </Section>

        <Section id="files" title="5 · Allowed File Types & Limits" hint="Accepted file extensions for document uploads across the platform, and the maximum upload size." onSave={saveSection} saving={saving}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {FILE_TYPE_OPTIONS.map((ext) => {
              const checked = allowedFileTypes.includes(ext);
              return (
                <label
                  key={ext}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                    checked ? "border-gold/50 bg-gold/10 text-neutral-100" : "border-line bg-white/[0.02] text-neutral-400"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-gold"
                    checked={checked}
                    onChange={(e) =>
                      patch((s) => ({
                        allowedFileTypes: e.target.checked ? [...new Set([...s.allowedFileTypes, ext])] : s.allowedFileTypes.filter((f) => f !== ext),
                      }))
                    }
                  />
                  <span className="font-mono text-xs uppercase">.{ext}</span>
                </label>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap items-end gap-4">
            <Field label="Max file size (MB)">
              <TextInput
                type="number"
                min="1"
                className="max-w-[140px]"
                value={maxFileSizeMb}
                onChange={(e) => setSettings((s) => ({ ...s, maxFileSizeMb: e.target.value }))}
              />
            </Field>
            <p className="text-xs text-neutral-600">Uploads exceeding this size are rejected platform-wide.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {classificationSchema.map((c) => (
              <span
                key={c.level}
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize text-neutral-300"
                style={{ borderColor: `${c.color}55`, backgroundColor: `${c.color}1a`, color: c.color }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                {c.level}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 text-[11px] text-neutral-500">
              Colors drive classification badges across modules
            </span>
          </div>
        </Section>
      </div>
    </>
  );
}
