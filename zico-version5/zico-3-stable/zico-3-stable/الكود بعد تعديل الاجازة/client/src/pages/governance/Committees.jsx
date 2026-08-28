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

const TYPES = ["Board", "Audit Committee", "Risk Committee", "Policy Board", "Other"];
const FREQUENCIES = ["Weekly", "Monthly", "Quarterly", "Semi-annual", "Annual", "Ad hoc"];

const EMPTY = {
  name: "",
  type: "Other",
  chair: "",
  charter: "",
  meetingFrequency: "Quarterly",
  quorumRequired: 3,
  status: "Active",
};

export default function Committees() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, u] = await Promise.all([api.get("/governance/committees"), api.get("/users")]);
    setItems(c.data.items);
    setUsers(u.data.items);
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
      type: row.type,
      chair: row.chair?._id || "",
      charter: row.charter || "",
      meetingFrequency: row.meetingFrequency,
      quorumRequired: row.quorumRequired,
      status: row.status,
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/governance/committees/${editing._id}`, form);
      else await api.post("/governance/committees", form);
      setOpen(false);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete committee "${row.name}"?`)) return;
    try {
      await api.delete(`/governance/committees/${row._id}`);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  const totalMembers = items.reduce((a, c) => a + (Number(c.membersCount) || 0), 0);
  const totalDecisions = items.reduce((a, c) => a + (Number(c.decisionsCount) || 0), 0);

  if (loading) return <LoadingState label="Loading committees…" />;

  return (
    <>
      <PageHeader
        title="Committees"
        subtitle="Formal governance bodies owning sign-off authority on specific record types."
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Committee
          </button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <div className="text-2xl font-semibold text-neutral-100">{items.length}</div>
          <div className="mt-2 text-sm text-neutral-400">Committees</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-semibold text-neutral-100">{items.filter((c) => c.status === "Active").length}</div>
          <div className="mt-2 text-sm text-neutral-400">Active</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-semibold text-neutral-100">{totalMembers}</div>
          <div className="mt-2 text-sm text-neutral-400">Total members</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-semibold text-neutral-100">{totalDecisions}</div>
          <div className="mt-2 text-sm text-neutral-400">Decisions recorded</div>
        </div>
      </div>

      <DataTable
        columns={[
          {
            key: "name",
            header: "Committee name",
            render: (r) => (
              <div>
                <div className="font-medium text-neutral-100">{r.name}</div>
                {r.charter && <div className="mt-0.5 max-w-[320px] text-xs text-neutral-500">{r.charter}</div>}
              </div>
            ),
          },
          {
            key: "type",
            header: "Type",
            render: (r) => <span className="chip border-gold/30 bg-gold/5 text-gold-light">{r.type}</span>,
          },
          {
            key: "chair",
            header: "Chair",
            render: (r) => <span className="whitespace-nowrap text-neutral-200">{r.chair?.fullName || r.chair?.username || "—"}</span>,
          },
          {
            key: "membersCount",
            header: "Members",
            render: (r) => (
              <span className="whitespace-nowrap text-neutral-300">
                {r.membersCount} <span className="text-neutral-600">/ quorum {r.quorumRequired}</span>
              </span>
            ),
          },
          { key: "meetingFrequency", header: "Meeting frequency", render: (r) => <span className="whitespace-nowrap text-neutral-300">{r.meetingFrequency}</span> },
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
        searchPlaceholder="Search committees…"
        onRowClick={(r) => navigate(`/governance/committees/${r._id}`)}
        emptyHint="No committees defined yet."
      />

      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title={editing ? "Edit Committee" : "Create Committee"}
        subtitle="Members, meetings and decisions are managed on the committee detail page."
        width="max-w-lg"
        footer={
          <>
            <button className="btn-ghost" type="button" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn-primary" form="cm-form" type="submit" disabled={saving || !form.name}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {editing ? "Save Changes" : "Create Committee"}
            </button>
          </>
        }
      >
        <form id="cm-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Committee name *" className="sm:col-span-2">
            <TextInput value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required placeholder='e.g. "Audit Committee"' />
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))} options={TYPES.map((t) => ({ value: t, label: t }))} />
          </Field>
          <Field label="Chair">
            <Select value={form.chair} onChange={(e) => setForm((s) => ({ ...s, chair: e.target.value }))} options={[{ value: "", label: "— None —" }, ...users.map((u) => ({ value: u._id, label: u.fullName || u.username }))]} />
          </Field>
          <Field label="Meeting frequency">
            <Select value={form.meetingFrequency} onChange={(e) => setForm((s) => ({ ...s, meetingFrequency: e.target.value }))} options={FREQUENCIES.map((f) => ({ value: f, label: f }))} />
          </Field>
          <Field label="Quorum required" hint="Minimum members for decisions to be valid.">
            <TextInput type="number" min="1" value={form.quorumRequired} onChange={(e) => setForm((s) => ({ ...s, quorumRequired: e.target.value }))} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} options={["Active", "Inactive"].map((v) => ({ value: v, label: v }))} />
          </Field>
          <Field label="Charter / description" className="sm:col-span-2">
            <TextArea value={form.charter} onChange={(e) => setForm((s) => ({ ...s, charter: e.target.value }))} placeholder="Purpose, authority and mandate of the committee…" />
          </Field>
        </form>
      </Modal>
    </>
  );
}
