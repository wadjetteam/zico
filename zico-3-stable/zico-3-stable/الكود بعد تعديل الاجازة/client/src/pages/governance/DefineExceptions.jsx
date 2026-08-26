import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import api from "../../api/client";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import { LoadingState } from "../../components/States";
import { chipClass } from "../../lib/format";

const EMPTY = {
  name: "",
  description: "",
  maxDurationDays: 90,
  requiredApproverRole: "",
  escalationDays: 0,
  escalationRole: "",
  status: "Active",
};

export default function DefineExceptions() {
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [t, r] = await Promise.all([
      api.get("/governance/exception-types"),
      api.get("/governance/roles"),
    ]);
    setItems(t.data.items);
    setRoles(r.data.items.filter((x) => x.status === "Active"));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name,
      description: row.description || "",
      maxDurationDays: row.maxDurationDays,
      requiredApproverRole: row.requiredApproverRole?._id || "",
      escalationDays: row.escalationDays || 0,
      escalationRole: row.escalationRole?._id || "",
      status: row.status,
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/governance/exception-types/${editing._id}`, form);
      else await api.post("/governance/exception-types", form);
      setOpen(false);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete exception type "${row.name}"?`)) return;
    try {
      await api.delete(`/governance/exception-types/${row._id}`);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  const roleOptions = [{ value: "", label: "— Select role —" }, ...roles.map((r) => ({ value: r._id, label: r.name }))];
  const activeTypes = items.filter((t) => t.status === "Active").length;
  const loggedExceptions = items.reduce((a, t) => a + (t.usageCount || 0), 0);

  if (loading) return <LoadingState label="Loading exception types…" />;

  return (
    <>
      <PageHeader
        title="Define Exceptions"
        subtitle="Configure exception types and approval rules."
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Define Exception Type
          </button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <div className="text-2xl font-semibold text-neutral-100">{items.length}</div>
          <div className="mt-2 text-sm text-neutral-400">Exception types</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-semibold text-neutral-100">{activeTypes}</div>
          <div className="mt-2 text-sm text-neutral-400">Active types</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-semibold text-neutral-100">{loggedExceptions}</div>
          <div className="mt-2 text-sm text-neutral-400">Exceptions using these types</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-semibold text-neutral-100">{roles.length}</div>
          <div className="mt-2 text-sm text-neutral-400">Approver roles available</div>
        </div>
      </div>

      <DataTable
        columns={[
          {
            key: "name",
            header: "Exception type",
            render: (r) => (
              <div>
                <div className="font-medium text-neutral-100">{r.name}</div>
                {r.description && <div className="mt-0.5 max-w-[280px] text-xs text-neutral-500">{r.description}</div>}
              </div>
            ),
          },
          {
            key: "maxDurationDays",
            header: "Max duration allowed",
            render: (r) => <span className="whitespace-nowrap">{r.maxDurationDays} days</span>,
          },
          {
            key: "requiredApproverRole",
            header: "Required approver role",
            render: (r) => <span className="whitespace-nowrap text-neutral-200">{r.requiredApproverRole?.name || "—"}</span>,
          },
          {
            key: "escalationDays",
            header: "Auto-escalation",
            render: (r) =>
              r.escalationDays > 0 ? (
                <span className="whitespace-nowrap text-neutral-300">
                  Escalate to <span className="text-gold">{r.escalationRole?.name || "—"}</span> after {r.escalationDays}d
                </span>
              ) : (
                <span className="text-neutral-600">None</span>
              ),
          },
          {
            key: "usageCount",
            header: "Exceptions using this type",
            render: (r) => <span className="font-semibold text-neutral-200">{r.usageCount}</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <span className={chipClass(r.status, { Active: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300", Inactive: "border-neutral-700 bg-neutral-900 text-neutral-400" })}>
                {r.status}
              </span>
            ),
          },
          {
            key: "__a",
            header: "",
            sortable: false,
            className: "w-20 text-right",
            render: (r) => (
              <>
                <button className="rounded-md p-1.5 text-neutral-500 hover:text-gold" onClick={() => openEdit(r)} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button className="rounded-md p-1.5 text-neutral-500 hover:text-red-300" onClick={() => remove(r)} aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ),
          },
        ]}
        rows={items}
        loading={loading}
        searchable={false}
        emptyHint="No exception types defined yet. Define the categories of exceptions users can request."
      />

      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title={editing ? "Edit Exception Type" : "Define Exception Type"}
        subtitle="Categories of exceptions users can request, plus the approval rules each type enforces."
        width="max-w-lg"
        footer={
          <>
            <button className="btn-ghost" type="button" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn-primary" form="et-form" type="submit" disabled={saving || !form.name || !form.requiredApproverRole}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save Exception Type
            </button>
          </>
        }
      >
        <form id="et-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Type name *" className="sm:col-span-2">
            <TextInput value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required placeholder='e.g. "Temporary Non-Compliance"' />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <TextArea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} placeholder="When is this category of exception appropriate?" />
          </Field>
          <Field label="Max duration allowed (days) *" hint="A requested exception's end date cannot exceed this.">
            <TextInput type="number" min="1" value={form.maxDurationDays} onChange={(e) => setForm((s) => ({ ...s, maxDurationDays: e.target.value }))} />
          </Field>
          <Field label="Required approver role *">
            <Select value={form.requiredApproverRole} onChange={(e) => setForm((s) => ({ ...s, requiredApproverRole: e.target.value }))} options={roleOptions} />
          </Field>
          <Field label="Escalate after (days)" hint="0 disables auto-escalation.">
            <TextInput type="number" min="0" value={form.escalationDays} onChange={(e) => setForm((s) => ({ ...s, escalationDays: e.target.value }))} />
          </Field>
          <Field label="Escalate to role">
            <Select value={form.escalationRole} onChange={(e) => setForm((s) => ({ ...s, escalationRole: e.target.value }))} options={[{ value: "", label: "— None —" }, ...roles.map((r) => ({ value: r._id, label: r.name }))]} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} options={["Active", "Inactive"].map((v) => ({ value: v, label: v }))} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
