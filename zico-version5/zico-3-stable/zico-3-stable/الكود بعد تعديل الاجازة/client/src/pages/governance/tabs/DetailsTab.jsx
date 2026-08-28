import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { resource } from "../../../api/client";
import Modal from "../../../components/Modal";
import ImpactPanel from "../../../components/ImpactPanel";
import { Field, Select, TextArea, TextInput } from "../../../components/Field";
import { POLICY_CLASS_STYLES, POLICY_LIFECYCLE, fmtDateTime, orDash, stepIndex } from "../../../lib/policy";
import { Stepper } from "../PolicyDetail";

const api = resource("policies");

const Row = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 border-b border-line/50 py-2 text-sm last:border-0">
    <dt className="shrink-0 text-xs text-neutral-500">{label}</dt>
    <dd className="text-right text-neutral-200">{value}</dd>
  </div>
);

const Tags = ({ v }) => (v?.length ? <span className="flex flex-wrap justify-end gap-1">{v.map((t) => <span key={t} className="chip">{t}</span>)}</span> : <span className="text-neutral-600">None</span>);

export default function DetailsTab({ policy, reload }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [impactBlocked, setImpactBlocked] = useState(false);
  const idx = stepIndex(policy.status);

  const openEdit = () =>
    setForm({
      description: policy.description || "",
      category: policy.category || "",
      classification: policy.classification || "Internal",
      owner: policy.owner || "",
      ownerUserId: policy.ownerUserId || "",
      department: policy.department || "",
      effectiveDate: policy.effectiveDate ? String(policy.effectiveDate).slice(0, 10) : "",
      expirationDate: policy.expirationDate ? String(policy.expirationDate).slice(0, 10) : "",
      applicableTo: policy.applicableTo || "",
      applicableRegions: (policy.applicableRegions || []).join(", "),
      regulatoryBasis: policy.regulatoryBasis || "",
      reviewPeriodDays: policy.reviewPeriodDays || 365,
      sourceTemplateId: policy.sourceTemplateId || "",
    });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.update(policy._id, {
        ...form,
        reviewPeriodDays: Number(form.reviewPeriodDays) || 365,
        applicableRegions: String(form.applicableRegions).split(",").map((s) => s.trim()).filter(Boolean),
        effectiveDate: form.effectiveDate || undefined,
        expirationDate: form.expirationDate || undefined,
      });
      setEditing(false);
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="card flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <p className="label">Lifecycle</p>
          <span className={`chip ${policy.status === "Published" ? "border-emerald-800/60 bg-emerald-950/40 text-emerald-300" : policy.status === "Retired" ? "border-red-800/60 bg-red-950/40 text-red-300" : policy.status === "Archived" ? "border-neutral-700 bg-neutral-800/60 text-neutral-400" : "border-neutral-700 bg-neutral-900 text-neutral-300"}`}>{policy.status}</span>
        </div>
        <Stepper steps={POLICY_LIFECYCLE} current={idx} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="card p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="label">Policy Information</p>
            <button onClick={openEdit} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-sky-950/40 hover:text-sky-300" title="Edit policy">
              <Pencil className="h-4 w-4" />
            </button>
          </div>
          <dl>
            <Row label="Policy ID" value={<span className="font-mono text-gold">{policy.policyId || "—"}</span>} />
            <Row label="Title" value={policy.title} />
            <Row label="Description" value={<span className="text-neutral-400">{orDash(policy.description)}</span>} />
            <Row label="Category" value={orDash(policy.category)} />
            <Row label="Classification" value={<span className={`chip ${POLICY_CLASS_STYLES[policy.classification] || POLICY_CLASS_STYLES.Internal}`}>{policy.classification || "Internal"}</span>} />
            <Row label="Version" value={<span className="font-mono">v{policy.version}</span>} />
            <Row label="Content" value={<span className="text-neutral-500">{policy.content ? `${policy.content.length} chars` : "No content"}</span>} />
            <Row label="Tags" value={<Tags v={policy.tags} />} />
          </dl>
        </div>

        <div className="card p-5">
          <p className="label mb-2">Ownership &amp; Dates</p>
          <dl>
            <Row label="Owner" value={orDash(policy.owner)} />
            <Row label="Owner user ID" value={<span className="font-mono text-xs">{orDash(policy.ownerUserId)}</span>} />
            <Row label="Department" value={orDash(policy.department)} />
            <Row label="Created" value={fmtDateTime(policy.createdAt)} />
            <Row label="Updated" value={fmtDateTime(policy.updatedAt)} />
            <Row label="Effective date" value={fmtDateTime(policy.effectiveDate)} />
            <Row label="Expiration date" value={fmtDateTime(policy.expirationDate)} />
            <Row label="Applicable to" value={orDash(policy.applicableTo)} />
            <Row label="Applicable regions" value={policy.applicableRegions?.length ? policy.applicableRegions.join(", ") : "None"} />
            <Row label="Regulatory basis" value={orDash(policy.regulatoryBasis)} />
          </dl>
        </div>

        <div className="card p-5">
          <p className="label mb-2">Review &amp; Schedule</p>
          <dl>
            <Row label="Review period (days)" value={<span className="font-mono">{policy.reviewPeriodDays || 365} days</span>} />
            <Row label="Last review" value={policy.lastReviewAt ? fmtDateTime(policy.lastReviewAt) : <span className="text-neutral-600">Not reviewed yet</span>} />
            <Row label="Next review" value={policy.nextReviewDate || policy.nextReviewAt ? fmtDateTime(policy.nextReviewDate || policy.nextReviewAt) : <span className="text-neutral-600">Not scheduled</span>} />
            <Row label="Source template ID" value={<span className="font-mono text-xs">{orDash(policy.sourceTemplateId, "None")}</span>} />
            <Row label="Parent policy" value={policy.parentPolicy ? `${policy.parentPolicy.policyId} — ${policy.parentPolicy.title}` : <span className="text-neutral-600">None (top-level)</span>} />
            <Row label="Child policies" value={policy.childPolicies?.length ? policy.childPolicies.map((c) => c.policyId).join(", ") : <span className="text-neutral-600">None</span>} />
          </dl>
        </div>
      </div>

      <Modal
        open={editing}
        onClose={() => !saving && setEditing(false)}
        title="Edit policy information"
        width="max-w-3xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(false)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="details-form" type="submit" disabled={saving || impactBlocked} title={impactBlocked ? "Confirm the high-impact override first" : undefined}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save
            </button>
          </>
        }
      >
        {form && (
          <div className="grid grid-cols-1 gap-4">
            <ImpactPanel entityType="policy" entityId={policy._id} overrideUrl={`/policies/${policy._id}/impact-override`} onChange={(high, confirmed) => setImpactBlocked(high && !confirmed)} />
            <form id="details-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Description" className="sm:col-span-3">
              <TextArea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
            </Field>
            <Field label="Category">
              <TextInput value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} />
            </Field>
            <Field label="Classification">
              <Select value={form.classification} onChange={(e) => setForm((s) => ({ ...s, classification: e.target.value }))} options={["Public", "Internal", "Confidential", "Restricted"].map((c) => ({ value: c, label: c }))} />
            </Field>
            <Field label="Owner">
              <TextInput value={form.owner} onChange={(e) => setForm((s) => ({ ...s, owner: e.target.value }))} />
            </Field>
            <Field label="Owner user ID">
              <TextInput value={form.ownerUserId} onChange={(e) => setForm((s) => ({ ...s, ownerUserId: e.target.value }))} />
            </Field>
            <Field label="Department">
              <TextInput value={form.department} onChange={(e) => setForm((s) => ({ ...s, department: e.target.value }))} />
            </Field>
            <Field label="Review period (days)">
              <TextInput type="number" min={1} value={form.reviewPeriodDays} onChange={(e) => setForm((s) => ({ ...s, reviewPeriodDays: e.target.value }))} />
            </Field>
            <Field label="Effective date">
              <TextInput type="date" value={form.effectiveDate} onChange={(e) => setForm((s) => ({ ...s, effectiveDate: e.target.value }))} />
            </Field>
            <Field label="Expiration date">
              <TextInput type="date" value={form.expirationDate} onChange={(e) => setForm((s) => ({ ...s, expirationDate: e.target.value }))} />
            </Field>
            <Field label="Applicable to" className="sm:col-span-2">
              <TextInput value={form.applicableTo} onChange={(e) => setForm((s) => ({ ...s, applicableTo: e.target.value }))} />
            </Field>
            <Field label="Applicable regions">
              <TextInput value={form.applicableRegions} onChange={(e) => setForm((s) => ({ ...s, applicableRegions: e.target.value }))} />
            </Field>
            <Field label="Regulatory basis" className="sm:col-span-2">
              <TextInput value={form.regulatoryBasis} onChange={(e) => setForm((s) => ({ ...s, regulatoryBasis: e.target.value }))} />
            </Field>
            <Field label="Source template ID">
              <TextInput value={form.sourceTemplateId} onChange={(e) => setForm((s) => ({ ...s, sourceTemplateId: e.target.value }))} />
            </Field>
          </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
