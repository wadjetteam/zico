import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Download, Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { resource } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { ErrorState } from "../../components/States";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import { fmtDay, orDash, POLICY_STATUS_STYLES, downloadCsv } from "../../lib/policy";

const api = resource("policies");

const CATEGORIES = ["Information Security", "Data Privacy", "Operational", "Financial", "Human Resources", "IT", "Compliance", "Third-Party"];

const EMPTY = {
  title: "",
  description: "",
  category: "",
  classification: "Internal",
  version: "1.0",
  content: "",
  tags: "",
  status: "Draft",
  owner: "",
  ownerUserId: "",
  department: "",
  effectiveDate: "",
  expirationDate: "",
  applicableTo: "",
  applicableRegions: "",
  regulatoryBasis: "",
  reviewPeriodDays: 365,
  sourceTemplateId: "",
};

const StatCard = ({ label, value, tone }) => (
  <div className="card flex flex-col justify-between p-4">
    <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">{label}</p>
    <p className={`heading mt-2 text-4xl font-semibold ${tone}`}>{value}</p>
  </div>
);

const chips = (v) => (v ? String(v).split(",").map((s) => s.trim()).filter(Boolean) : []);

export default function PolicyManagement() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total: 0, published: 0, pendingReview: 0, pendingApproval: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.list({ status: statusFilter || undefined, category: categoryFilter || undefined, owner: ownerFilter || undefined }), api.get("stats")])
      .then(([d, s]) => {
        setRows(d.items);
        setStats(s);
      })
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [statusFilter, categoryFilter, ownerFilter]);

  useEffect(load, [load]);

  const ownerOptions = useMemo(() => [...new Set(rows.map((r) => r.owner).filter(Boolean))], [rows]);
  const categoryOptions = useMemo(() => [...new Set([...CATEGORIES, ...rows.map((r) => r.category).filter(Boolean)])], [rows]);

  const openCreate = () => {
    setForm(EMPTY);
    setEditing("new");
  };
  const openEdit = (row) =>
    setEditing(row) ||
    setForm({
      title: row.title || "",
      description: row.description || "",
      category: row.category || "",
      classification: row.classification || "Internal",
      version: row.version || "1.0",
      content: row.content || "",
      tags: (row.tags || []).join(", "),
      status: row.status === "Draft" ? "Draft" : row.status,
      owner: row.owner || "",
      ownerUserId: row.ownerUserId || "",
      department: row.department || "",
      effectiveDate: row.effectiveDate ? String(row.effectiveDate).slice(0, 10) : "",
      expirationDate: row.expirationDate ? String(row.expirationDate).slice(0, 10) : "",
      applicableTo: row.applicableTo || "",
      applicableRegions: (row.applicableRegions || []).join(", "),
      regulatoryBasis: row.regulatoryBasis || "",
      reviewPeriodDays: row.reviewPeriodDays || 365,
      sourceTemplateId: row.sourceTemplateId || "",
    });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: chips(form.tags),
        applicableRegions: chips(form.applicableRegions),
        reviewPeriodDays: Number(form.reviewPeriodDays) || 365,
        effectiveDate: form.effectiveDate || undefined,
        expirationDate: form.expirationDate || undefined,
      };
      if (editing === "new") await api.create(payload);
      else await api.update(editing._id, payload);
      setEditing(null);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete policy "${row.title}" (${row.policyId})? Its versions, documents, mappings and audit trail are removed too.`)) return;
    await api.remove(row._id);
    load();
  };

  const exportCsv = () =>
    downloadCsv(
      `wadjet-policies-${new Date().toISOString().slice(0, 10)}.csv`,
      ["policyId", "title", "status", "category", "version", "owner", "department", "nextReviewAt"],
      rows.map((r) => ({
        policyId: r.policyId,
        title: r.title,
        status: r.status,
        category: r.category,
        version: r.version,
        owner: r.owner,
        department: r.department,
        nextReviewAt: r.nextReviewAt ? new Date(r.nextReviewAt).toISOString().slice(0, 10) : "",
      }))
    );

  const columns = [
    {
      key: "policyId",
      header: "Policy ID",
      render: (r) => <span className="whitespace-nowrap font-mono text-xs font-medium text-gold">{r.policyId || "—"}</span>,
    },
    {
      key: "title",
      header: "Title",
      render: (r) => (
        <button onClick={() => navigate(`/governance/policies/${r._id}`)} className="whitespace-nowrap font-medium text-neutral-100 hover:text-gold">
          {r.title}
        </button>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <span className={`chip whitespace-nowrap ${POLICY_STATUS_STYLES[r.status] || POLICY_STATUS_STYLES.draft}`}>{r.status}</span>,
    },
    { key: "category", header: "Category", render: (r) => <span className="whitespace-nowrap text-neutral-400">{orDash(r.category)}</span> },
    { key: "version", header: "Version", render: (r) => <span className="whitespace-nowrap font-mono text-xs">v{r.version}</span> },
    { key: "owner", header: "Owner", render: (r) => <span className="whitespace-nowrap text-neutral-300">{orDash(r.owner)}</span> },
    { key: "department", header: "Department", render: (r) => <span className="whitespace-nowrap text-neutral-400">{orDash(r.department)}</span> },
    {
      key: "nextReviewAt",
      header: "Next Review",
      render: (r) => <span className="whitespace-nowrap text-neutral-400">{fmtDay(r.nextReviewAt)}</span>,
    },
    {
      key: "__a",
      header: "",
      sortable: false,
      className: "w-28 text-right",
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button onClick={() => navigate(`/governance/policies/${r._id}`)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-white/5 hover:text-gold" title="View">
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={() => openEdit(r)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-sky-950/40 hover:text-sky-300" title="Edit">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => remove(r)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-red-950/40 hover:text-red-300" title="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Policy Management"
        subtitle="Centralized policy lifecycle management and governance."
        actions={
          <>
            <button className="btn-ghost" onClick={exportCsv}>
              <Download className="h-4 w-4" /> Export
            </button>
            <button className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Create Policy
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label="Total policies" value={stats.total} tone="text-gold" />
        <StatCard label="Published" value={stats.published} tone="text-emerald-300" />
        <StatCard label="Pending review" value={stats.pendingReview} tone="text-sky-300" />
        <StatCard label="Pending approval" value={stats.pendingApproval} tone="text-orange-300" />
        <StatCard label="Overdue reviews" value={stats.overdue} tone="text-red-300" />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          searchPlaceholder="Search policies by title or ID…"
          emptyHint="Create your first policy to start the lifecycle."
          emptyAction={
            <button className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Create Policy
            </button>
          }
          toolbar={
            <>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: "", label: "All Status" }, ...["Draft", "Review", "Approval", "Approved", "Published", "Retired"].map((s) => ({ value: s, label: s }))]} />
              <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} options={[{ value: "", label: "All Categories" }, ...categoryOptions.map((c) => ({ value: c, label: c }))]} />
              <Select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} options={[{ value: "", label: "All Owners" }, ...ownerOptions.map((o) => ({ value: o, label: o }))]} />
            </>
          }
        />
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => !saving && setEditing(null)}
        title={editing === "new" ? "Create Policy" : `Edit Policy ${form.title ? `(${form.title})` : ""}`}
        subtitle="Policy lifecycle, ownership and review scheduling."
        width="max-w-3xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} type="button" disabled={saving}>
              Cancel
            </button>
            <button className="btn-primary" form="policy-form" type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving…" : editing === "new" ? "Create" : "Save"}
            </button>
          </>
        }
      >
        <form id="policy-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Policy ID" hint="Auto-assigned if blank" className="sm:col-span-1">
            <TextInput value={editing === "new" ? "POL-#### (auto)" : form.policyId || ""} disabled />
          </Field>
          <Field label="Title *" className="sm:col-span-2">
            <TextInput value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} required />
          </Field>
          <Field label="Description" className="sm:col-span-3">
            <TextArea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
          </Field>
          <Field label="Category" className="sm:col-span-1">
            <TextInput list="policy-categories" value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} placeholder="e.g. Information Security" />
            <datalist id="policy-categories">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="Classification">
            <Select value={form.classification} onChange={(e) => setForm((s) => ({ ...s, classification: e.target.value }))} options={["Public", "Internal", "Confidential", "Restricted"].map((c) => ({ value: c, label: c }))} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} options={["Draft", "Review", "Approval", "Approved", "Published", "Retired"].map((s) => ({ value: s, label: s }))} />
          </Field>
          <Field label="Version">
            <TextInput value={form.version} onChange={(e) => setForm((s) => ({ ...s, version: e.target.value }))} />
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
          <Field label="Effective date" type="date">
            <TextInput type="date" value={form.effectiveDate} onChange={(e) => setForm((s) => ({ ...s, effectiveDate: e.target.value }))} />
          </Field>
          <Field label="Expiration date" type="date">
            <TextInput type="date" value={form.expirationDate} onChange={(e) => setForm((s) => ({ ...s, expirationDate: e.target.value }))} />
          </Field>
          <Field label="Review period (days)">
            <TextInput type="number" min={1} value={form.reviewPeriodDays} onChange={(e) => setForm((s) => ({ ...s, reviewPeriodDays: e.target.value }))} />
          </Field>
          <Field label="Applicable to" className="sm:col-span-2">
            <TextInput value={form.applicableTo} onChange={(e) => setForm((s) => ({ ...s, applicableTo: e.target.value }))} />
          </Field>
          <Field label="Applicable regions" hint="Comma-separated">
            <TextInput value={form.applicableRegions} onChange={(e) => setForm((s) => ({ ...s, applicableRegions: e.target.value }))} />
          </Field>
          <Field label="Regulatory basis" className="sm:col-span-2">
            <TextInput value={form.regulatoryBasis} onChange={(e) => setForm((s) => ({ ...s, regulatoryBasis: e.target.value }))} />
          </Field>
          <Field label="Source template ID">
            <TextInput value={form.sourceTemplateId} onChange={(e) => setForm((s) => ({ ...s, sourceTemplateId: e.target.value }))} />
          </Field>
          <Field label="Tags" hint="Comma-separated" className="sm:col-span-3">
            <TextInput value={form.tags} onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
