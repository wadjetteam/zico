import { useCallback, useEffect, useState } from "react";
import { Edit3, Loader2, Plus, Power, RefreshCw } from "lucide-react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import { ErrorState, LoadingState } from "../../components/States";
import { Field, TextInput } from "../../components/Field";
import { chipClass } from "../../lib/format";

const emptyForm = { name: "", email: "", department: "", is_active: true };

export default function RiskOwners() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get("/users").then(({ data }) => setUsers(data.items || data || [])).catch((e) => setError(e?.response?.data?.message || e.message)).finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);
  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (user) => { setEditing(user); setForm({ name: user.name || user.fullName || "", email: user.email || "", department: user.department || "", is_active: user.is_active !== false }); setOpen(true); };
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try { if (editing) await api.put(`/users/${editing._id}`, form); else await api.post("/users", form); setOpen(false); load(); }
    catch (e) { setError(e?.response?.data?.message || e.message); }
    finally { setSaving(false); }
  };
  const toggle = async (user) => {
    try { await api.put(`/users/${user._id}`, { is_active: user.is_active === false }); load(); }
    catch (e) { setError(e?.response?.data?.message || e.message); }
  };

  if (loading) return <LoadingState label="Loading risk owners…" />;
  return (
    <>
      <PageHeader title="Risk Owners" subtitle="Manage users who can be assigned to risks. Inactive users cannot receive new risk assignments." actions={<><button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</button><button type="button" className="btn-primary inline-flex items-center gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Add user</button></>} />
      {error && <ErrorState message={error} onRetry={load} />}
      <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-line bg-white/[0.02] text-[10px] uppercase tracking-[0.14em] text-neutral-500"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-line">{users.map((user) => <tr key={user._id} className="hover:bg-white/[0.025]"><td className="px-4 py-4 text-neutral-200">{user.name || user.fullName || user.username}</td><td className="px-4 py-4 text-neutral-400">{user.email}</td><td className="px-4 py-4 text-neutral-400">{user.department || "—"}</td><td className="px-4 py-4"><span className={chipClass(user.is_active === false ? "Inactive" : "Active")}>{user.is_active === false ? "Inactive" : "Active"}</span></td><td className="px-4 py-4 text-right"><div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => openEdit(user)} title="Edit user"><Edit3 className="h-4 w-4" /> Edit</button><button type="button" className="btn-ghost" onClick={() => toggle(user)} title="Toggle active status"><Power className="h-4 w-4" /> {user.is_active === false ? "Activate" : "Deactivate"}</button></div></td></tr>)}</tbody></table>{!users.length && <div className="p-10 text-center text-sm text-neutral-500">No users found.</div>}</div></div>
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit user" : "Add risk owner"} subtitle="Only active users appear in risk assignment dropdowns." footer={<><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" form="risk-owner-form" className="btn-primary" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</button></>}>
        <form id="risk-owner-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2"><Field label="Name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field><Field label="Email"><TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field><Field label="Department"><TextInput value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field></form>
      </Modal>
    </>
  );
}