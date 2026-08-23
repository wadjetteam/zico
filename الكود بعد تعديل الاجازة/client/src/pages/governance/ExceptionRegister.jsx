import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Plus, Eye, CheckCircle2, XCircle, Clock, AlertTriangle,
  Calendar, FileText, Filter,
} from "lucide-react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import { LoadingState, ErrorState } from "../../components/States";
import { chipClass, fmtDate } from "../../lib/format";

const STATUS_STYLES = {
  Draft: "border-neutral-700 bg-neutral-900 text-neutral-400",
  Submitted: "border-sky-800/60 bg-sky-950/40 text-sky-300",
  RiskAssessment: "border-violet-800/60 bg-violet-950/40 text-violet-300",
  UnderReview: "border-amber-800/60 bg-amber-950/40 text-amber-300",
  Approved: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  Rejected: "border-red-800/60 bg-red-950/40 text-red-300",
  Active: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  Expired: "border-neutral-700 bg-neutral-900 text-neutral-500",
  Closed: "border-neutral-700 bg-neutral-900 text-neutral-500",
};

const EMPTY_FORM = {
  title: "", description: "", relatedPolicyId: "", relatedControlId: "", relatedRiskId: "",
  exceptionEffectivenessOverride: "", businessJustification: "", compensatingControls: "",
  ownerUserId: "", requestedFrom: "", requestedUntil: "", reviewDate: "",
};

export default function ExceptionRegister() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/governance/exceptions", { params: { status: statusFilter || undefined } });
      setRows(data.items || []);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const activeFilterCount = statusFilter ? 1 : 0;

  const filtered = useMemo(() => {
    if (!statusFilter) return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  const clearFilters = () => setStatusFilter("");

  const openCreate = () => { setForm(EMPTY_FORM); setEditing("new"); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        exceptionEffectivenessOverride: form.exceptionEffectivenessOverride ? Number(form.exceptionEffectivenessOverride) : null,
        requestedFrom: form.requestedFrom || new Date().toISOString(),
        reviewDate: form.reviewDate || new Date().toISOString(),
      };
      if (editing === "new") await api.post("/governance/exceptions", payload);
      else await api.put(`/governance/exceptions/${editing._id}`, payload);
      setEditing(null);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const approve = async (row) => {
    if (!window.confirm(`Approve exception "${row.title}"?`)) return;
    try {
      await api.post(`/governance/exceptions/${row._id}/approve`);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  if (loading) return <LoadingState label="Loading exceptions..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <>
      <PageHeader
        title="Exception Register"
        subtitle="Manage policy and control exceptions with full lifecycle tracking."
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New Exception
          </button>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{rows.length}</p>
            <p className="text-xs text-neutral-500">Total Exceptions</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950/40 text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{rows.filter((r) => r.status === "Active").length}</p>
            <p className="text-xs text-neutral-500">Active</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-950/40 text-amber-300">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{rows.filter((r) => r.status === "UnderReview").length}</p>
            <p className="text-xs text-neutral-500">Under Review</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-950/40 text-red-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{rows.filter((r) => r.status === "Expired").length}</p>
            <p className="text-xs text-neutral-500">Expired</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button className="btn-ghost" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="mr-1 inline h-4 w-4" />
          Filters
          {activeFilterCount > 0 && <span className="ml-1 rounded-full bg-gold px-1.5 text-xs text-ink">{activeFilterCount}</span>}
        </button>
        {activeFilterCount > 0 && (
          <button className="btn-ghost text-xs" onClick={clearFilters}>Clear ({activeFilterCount})</button>
        )}
        <span className="text-xs text-neutral-500">{filtered.length} of {rows.length} exceptions</span>
      </div>

      {showFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-white/[0.02] p-3">
          <select className="input !w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {Object.keys(STATUS_STYLES).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3">Exception</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Requested By</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-500">No exceptions found.</td></tr>
            ) : (
              filtered.map((r) => (
                <tr key={r._id} className="border-b border-line/50 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-100">{r.title}</div>
                    <div className="text-xs text-neutral-500">{r.exceptionCode}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`chip ${STATUS_STYLES[r.status] || STATUS_STYLES.Draft}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-300">{r.requestedByUser?.fullName || r.requestedByUserId}</td>
                  <td className="px-4 py-3 text-neutral-400">{fmtDate(r.requestedUntil)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {r.status === "UnderReview" && (
                        <button className="btn-ghost p-1.5 text-emerald-400" onClick={() => approve(r)} title="Approve">
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {editing && (
        <Modal title={editing === "new" ? "Create Exception" : "Edit Exception"} onClose={() => setEditing(null)} wide>
          <form onSubmit={save} className="space-y-4">
            <Field label="Title">
              <TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </Field>
            <Field label="Description">
              <TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </Field>
            <Field label="Business Justification">
              <TextArea value={form.businessJustification} onChange={(e) => setForm({ ...form, businessJustification: e.target.value })} rows={3} required />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Requested Until">
                <input type="date" className="input" value={form.requestedUntil?.slice(0, 10) || ""} onChange={(e) => setForm({ ...form, requestedUntil: e.target.value })} required />
              </Field>
              <Field label="Effectiveness Override (%)">
                <input type="number" min={0} max={100} className="input" value={form.exceptionEffectivenessOverride} onChange={(e) => setForm({ ...form, exceptionEffectivenessOverride: e.target.value })} />
              </Field>
            </div>
            <Field label="Compensating Controls">
              <TextArea value={form.compensatingControls} onChange={(e) => setForm({ ...form, compensatingControls: e.target.value })} rows={2} />
            </Field>
            <div className="flex justify-end gap-3 border-t border-line pt-4">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
