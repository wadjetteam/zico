import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import api from "../../api/client";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import { LoadingState } from "../../components/States";
import { chipClass } from "../../lib/format";

const EMPTY = { name: "", description: "", email: "", status: "Active" };

const MODULE_LABELS = { policy: "Policy", compliance: "Compliance", audit: "Audit", context: "Context Org", governance: "Governance" };

export default function RolesPermissions() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/governance/roles");
      setItems(data.items);
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
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
    setForm({ name: row.name, description: row.description || "", email: row.email || "", status: row.status });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/governance/roles/${editing._id}`, form);
      else await api.post("/governance/roles", form);
      setOpen(false);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete role "${row.name}"?`)) return;
    try {
      await api.delete(`/governance/roles/${row._id}`);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  const assignments = items.reduce((a, r) => a + (r.usersAssignedCount || r.usersAssigned || 0), 0);

  if (loading) return <LoadingState label="Loading roles…" />;

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Who can do what, platform-wide — the single source of truth for permissions across all modules."
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Role
          </button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <div className="text-2xl font-semibold text-neutral-100">{items.length}</div>
          <div className="mt-2 text-sm text-neutral-400">Roles defined</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-semibold text-neutral-100">{items.filter((r) => r.status === "Active").length}</div>
          <div className="mt-2 text-sm text-neutral-400">Active roles</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-semibold text-neutral-100">{assignments}</div>
          <div className="mt-2 text-sm text-neutral-400">Role assignments</div>
        </div>
      </div>

      <DataTable
        columns={[
          {
            key: "name",
            header: "Role name",
            render: (r) => (
              <div>
                <div className="font-medium text-neutral-100">{r.name}</div>
                {r.description && <div className="mt-0.5 max-w-[300px] text-xs text-neutral-500">{r.description}</div>}
              </div>
            ),
          },
          {
            key: "email",
            header: "Email",
            render: (r) => <span className="text-neutral-400 text-xs">{r.email || "—"}</span>,
          },
          {
            key: "usersAssigned",
            header: "Users assigned",
            render: (r) => <span className="font-semibold text-neutral-200">{r.usersAssigned}</span>,
          },
          {
            key: "modulesWithAccess",
            header: "Modules with access",
            render: (r) => (
              <div className="flex max-w-[340px] flex-wrap gap-1.5">
                {(r.modulesWithAccess || []).map((m) => (
                  <span key={m} className="chip border-gold/30 bg-gold/5 text-[10px] text-gold-light">{MODULE_LABELS[m] || m}</span>
                ))}
              </div>
            ),
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
        searchPlaceholder="Search roles…"
        onRowClick={(r) => navigate(`/governance/roles/${r._id}`)}
        emptyHint="No roles defined yet. Create the first role to start mapping permissions."
      />

      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title={editing ? "Edit Role" : "Create Role"}
        subtitle="Permissions are configured on the role detail page (matrix, users, approval authority)."
        width="max-w-lg"
        footer={
          <>
            <button className="btn-ghost" type="button" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn-primary" form="role-form" type="submit" disabled={saving || !form.name}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {editing ? "Save Changes" : "Create Role"}
            </button>
          </>
        }
      >
        <form id="role-form" onSubmit={save} className="grid grid-cols-1 gap-4">
          <Field label="Role name *">
            <TextInput value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required placeholder='e.g. "Compliance Manager"' />
          </Field>
          <Field label="Description">
            <TextArea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} placeholder="What is this role responsible for?" />
          </Field>
          <Field label="Email">
            <TextInput value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} placeholder='e.g. "compliance@company.com"' />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} options={["Active", "Inactive"].map((v) => ({ value: v, label: v }))} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
