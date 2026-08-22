import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, Loader2, Plus, RefreshCw, UserRound, Users } from "lucide-react";
import api, { resource } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { ErrorState } from "../../components/States";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import { chipClass, fmtDate } from "../../lib/format";

const groups = resource("groups");
const users = resource("users");
const domains = resource("domains");

const EMPTY = { name: "", description: "", members: [], linkedDomains: [], status: "active" };

export default function Groups() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [userList, setUserList] = useState([]);
  const [domainList, setDomainList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    groups
      .list()
      .then((d) => setRows(d.items))
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    users.list().then((d) => setUserList(d.items));
    domains.list().then((d) => setDomainList(d.items));
  }, [load]);

  const domainName = useMemo(() => new Map(domainList.map((d) => [d._id, d.name])), [domainList]);
  const userName = useMemo(() => new Map(userList.map((u) => [u._id, u.fullName || u.username])), [userList]);

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.status === "active").length;
    const members = rows.reduce((a, r) => a + (r.members?.length || 0), 0);
    return { total: rows.length, active, members };
  }, [rows]);

  const openCreate = () => setEditing("new");
  const openEdit = (row) =>
    setForm({
      name: row.name,
      description: row.description || "",
      members: (row.members || []).map((m) => m._id),
      linkedDomains: (row.linkedDomains || []).map((d) => d._id),
      status: row.status,
    });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        members: form.members.map(String),
        linkedDomains: form.linkedDomains.map(String),
      };
      if (editing === "new") await groups.create(payload);
      else await groups.update(editing._id, payload);
      setEditing(null);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleMember = (id) =>
    setForm((s) => ({
      ...s,
      members: s.members.includes(id) ? s.members.filter((m) => m !== id) : [...s.members, id],
    }));

  const toggleDomain = (id) =>
    setForm((s) => ({
      ...s,
      linkedDomains: s.linkedDomains.includes(id) ? s.linkedDomains.filter((d) => d !== id) : [...s.linkedDomains, id],
    }));

  return (
    <>
      <PageHeader
        title="Groups"
        subtitle="User groups carry ownership, review and approval responsibilities. Groups can be linked to domains and subscribe to notification rules."
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New group
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold"><Users className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{stats.total}</p>
            <p className="text-xs text-neutral-500">Total groups</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950/40 text-emerald-300"><Users className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{stats.active}</p>
            <p className="text-xs text-neutral-500">Active</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-950/40 text-sky-300"><UserRound className="h-5 w-5" /></div>
          <div>
            <p className="heading text-2xl font-semibold text-neutral-100">{stats.members}</p>
            <p className="text-xs text-neutral-500">Total members</p>
          </div>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <DataTable
          columns={[
            {
              key: "name",
              header: "Group",
              render: (r) => (
                <div>
                  <span className="font-medium text-neutral-100">{r.name}</span>
                  <p className="line-clamp-1 text-xs text-neutral-600">{r.description || "—"}</p>
                </div>
              ),
            },
            {
              key: "members",
              header: "Members",
              render: (r) => (
                <div className="flex -space-x-1.5">
                  {(r.members || []).slice(0, 5).map((m) => (
                    <span key={m._id} className="flex h-6 w-6 items-center justify-center rounded-full border border-ink-deep bg-neutral-800 text-[10px] font-semibold text-neutral-200" title={m.fullName || m.username}>
                      {(m.fullName || m.username || "?").slice(0, 1).toUpperCase()}
                    </span>
                  ))}
                  {(r.members?.length || 0) > 5 && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-ink-deep bg-neutral-900 text-[10px] text-neutral-400">
                      +{(r.members?.length || 0) - 5}
                    </span>
                  )}
                  {!r.members?.length && <span className="text-xs text-neutral-600">No members</span>}
                </div>
              ),
            },
            {
              key: "linkedDomains",
              header: "Linked domains",
              render: (r) =>
                (r.linkedDomains || []).length ? (
                  <div className="flex max-w-xs flex-wrap gap-1">
                    {(r.linkedDomains || []).map((d) => (
                      <span key={d._id} className="chip border-neutral-700 bg-neutral-900 text-neutral-300">
                        {d.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-neutral-600">—</span>
                ),
            },
            {
              key: "notificationRules",
              header: "Rules",
              render: (r) => {
                const enabled = (r.notificationRules || []).filter((x) => x.enabled).length;
                return <span className="text-xs text-neutral-400">{enabled} enabled</span>;
              },
            },
            {
              key: "status",
              header: "Status",
              render: (r) => (
                <span className={chipClass(r.status, { active: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300", inactive: "border-neutral-700 bg-neutral-900 text-neutral-400" })}>
                  {r.status}
                </span>
              ),
            },
            {
              key: "__a",
              header: "",
              sortable: false,
              className: "w-10 text-right",
              render: (r) => (
                <span className="inline-flex items-center gap-1 text-[11px] text-neutral-600">
                  Open <ChevronDown className="h-3 w-3" />
                </span>
              ),
            },
          ]}
          rows={rows}
          loading={loading}
          searchPlaceholder="Search groups…"
          emptyHint="Create a group to manage ownership and notification responsibilities."
          emptyAction={
            <button className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New group
            </button>
          }
          onRowClick={(r) => navigate(`/context/groups/${r._id}`)}
        />
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => !saving && setEditing(null)}
        title={editing === "new" ? "New group" : "Edit group"}
        subtitle="Members come from the user directory; linked domains scope the group's responsibility."
        width="max-w-3xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} type="button" disabled={saving}>
              Cancel
            </button>
            <button className="btn-primary" form="group-form" type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <form id="group-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Group name">
            <TextInput value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required placeholder="e.g. Risk Oversight" />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} options={["active", "inactive"]} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <TextArea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
          </Field>
          <div className="sm:col-span-2">
            <p className="label mb-1.5">Members</p>
            <div className="grid max-h-52 grid-cols-1 gap-1.5 overflow-y-auto rounded-lg border border-line bg-white/[0.02] p-3 sm:grid-cols-2">
              {userList.length === 0 && <p className="text-xs text-neutral-600">No users available — create users in Settings first.</p>}
              {userList.map((u) => (
                <label key={u._id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-300 transition hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={form.members.includes(u._id)}
                    onChange={() => toggleMember(u._id)}
                    className="h-4 w-4 accent-[#D4AF37]"
                  />
                  {u.fullName || u.username}
                  <span className="ml-auto text-[11px] text-neutral-600">{u.role}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <p className="label mb-1.5">Linked domains</p>
            <div className="grid max-h-52 grid-cols-1 gap-1.5 overflow-y-auto rounded-lg border border-line bg-white/[0.02] p-3 sm:grid-cols-2">
              {domainList.length === 0 && <p className="text-xs text-neutral-600">No domains yet.</p>}
              {domainList.map((d) => (
                <label key={d._id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-300 transition hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={form.linkedDomains.includes(d._id)}
                    onChange={() => toggleDomain(d._id)}
                    className="h-4 w-4 accent-[#D4AF37]"
                  />
                  {d.name}
                  <span className="ml-auto text-[11px] text-neutral-600">{domainName.get(String(d.organization?._id || d.organization))}</span>
                </label>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
