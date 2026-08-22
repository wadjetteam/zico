import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Bell, Loader2, Pencil, Plus, Trash2, UserRound, Users } from "lucide-react";
import api from "../../api/client";
import { ErrorState, LoadingState } from "../../components/States";
import Modal from "../../components/Modal";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import { chipClass, fmtDate } from "../../lib/format";

export const NOTIFICATION_EVENTS = [
  { value: "risk-submitted", label: "Risk submitted" },
  { value: "risk-approval", label: "Risk approval needed" },
  { value: "policy-expiring", label: "Policy expiring" },
  { value: "policy-exception", label: "Policy exception" },
  { value: "compliance-due", label: "Compliance due" },
  { value: "assessment-due", label: "Assessment due" },
  { value: "audit-finding", label: "Audit finding" },
  { value: "gap-assigned", label: "Gap assigned" },
  { value: "vendor-finding", label: "Vendor finding" },
];

const TABS = [
  { key: "details", label: "Details", icon: Users },
  { key: "members", label: "Members", icon: UserRound },
  { key: "rules", label: "Notification Rules", icon: Bell },
];

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("details");

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/groups/${id}`)
      .then((r) => setGroup(r.data))
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (loading || !group) return <LoadingState label="Loading group…" />;

  return (
    <div>
      <div className="flex items-start gap-3">
        <button onClick={() => navigate(-1)} className="mt-1 rounded-lg border border-line p-2 text-neutral-400 transition hover:text-gold" title="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="heading text-2xl font-semibold text-neutral-100">{group.name}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
            <span className={chipClass(group.status, { active: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300", inactive: "border-neutral-700 bg-neutral-900 text-neutral-400" })}>{group.status}</span>
            <span>{group.members?.length || 0} member(s)</span>
            <span>{(group.notificationRules || []).filter((r) => r.enabled).length} notification rule(s) enabled</span>
            <span>Created {fmtDate(group.createdAt)}</span>
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-line pb-px">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition ${
                active ? "border-gold text-gold" : "border-transparent text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {tab === "details" && <DetailsTab group={group} reload={load} />}
        {tab === "members" && <MembersTab group={group} reload={load} />}
        {tab === "rules" && <RulesTab group={group} reload={load} />}
      </div>
    </div>
  );
}

function DetailsTab({ group, reload }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: group.name, description: group.description || "", status: group.status });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/groups/${group._id}`, form);
      setEditing(false);
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white/[0.02] px-5 py-4">
        <div>
          <h2 className="heading text-sm font-semibold text-neutral-100">Group details</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Edit the group's identity and status.</p>
        </div>
        <button className="btn-ghost px-3 py-1.5" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" /> Edit
        </button>
      </div>
      <div className="grid grid-cols-1 gap-x-8 px-5 py-4 md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-600">Name</p>
            <p className="mt-0.5 text-sm text-neutral-200">{group.name}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-600">Description</p>
            <p className="mt-0.5 text-sm text-neutral-200">{group.description || "—"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-600">Status</p>
            <p className="mt-0.5"><span className={chipClass(group.status, { active: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300", inactive: "border-neutral-700 bg-neutral-900 text-neutral-400" })}>{group.status}</span></p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-600">Linked domains</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {(group.linkedDomains || []).length ? (
                group.linkedDomains.map((d) => (
                  <span key={d._id} className="chip border-gold/30 bg-gold/5 text-gold-light">{d.name}</span>
                ))
              ) : (
                <span className="text-sm text-neutral-600">None</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-600">Member count</p>
            <p className="mt-0.5 text-sm text-neutral-200">{group.members?.length || 0} user(s)</p>
          </div>
        </div>
      </div>

      <Modal
        open={editing}
        onClose={() => !saving && setEditing(false)}
        title="Edit group"
        width="max-w-xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(false)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="group-edit-form" type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <form id="group-edit-form" onSubmit={save} className="grid grid-cols-1 gap-4">
          <Field label="Name">
            <TextInput value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
          </Field>
          <Field label="Description">
            <TextArea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} options={["active", "inactive"]} />
          </Field>
        </form>
      </Modal>
    </section>
  );
}

function MembersTab({ group, reload }) {
  const [adding, setAdding] = useState(false);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/users").then((r) => setUsers(r.data.items));
  }, []);

  const addMember = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const members = [...(group.members || []).map((m) => m._id), selected];
      await api.put(`/groups/${group._id}`, { members });
      setAdding(false);
      setSelected("");
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (userId) => {
    const members = (group.members || []).map((m) => m._id).filter((m) => m !== userId);
    await api.put(`/groups/${group._id}`, { members });
    reload();
  };

  const available = users.filter((u) => !(group.members || []).some((m) => m._id === u._id));

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white/[0.02] px-5 py-4">
        <div>
          <h2 className="heading text-sm font-semibold text-neutral-100">Members</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Users carrying this group's ownership and approval responsibilities.</p>
        </div>
        <button className="btn-primary px-3 py-1.5" onClick={() => setAdding(true)} disabled={!available.length}>
          <Plus className="h-4 w-4" /> Add member
        </button>
      </div>
      <div className="divide-y divide-line/60">
        {(group.members || []).length === 0 && <p className="px-5 py-6 text-sm text-neutral-600">No members yet.</p>}
        {(group.members || []).map((m) => (
          <div key={m._id} className="flex items-center gap-3 px-5 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-xs font-semibold text-gold-light">
              {(m.fullName || m.username || "?").slice(0, 1).toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-medium text-neutral-100">{m.fullName || m.username}</p>
              <p className="text-xs text-neutral-500">{m.email} · {m.role}</p>
            </div>
            <button
              onClick={() => removeMember(m._id)}
              className="ml-auto rounded-md p-1.5 text-neutral-500 transition hover:bg-red-950/40 hover:text-red-300"
              title="Remove member"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <Modal
        open={adding}
        onClose={() => !saving && setAdding(false)}
        title="Add member"
        subtitle="Pick a user from the directory."
        width="max-w-md"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setAdding(false)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" onClick={addMember} disabled={saving || !selected}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Adding…" : "Add"}
            </button>
          </>
        }
      >
        <Field label="User">
          <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">— Select user —</option>
            {available.map((u) => (
              <option key={u._id} value={u._id} className="bg-ink-deep">{u.fullName || u.username} ({u.email})</option>
            ))}
          </select>
        </Field>
      </Modal>
    </section>
  );
}

const CHANNEL_STYLES = {
  email: "border-sky-800/60 bg-sky-950/40 text-sky-300",
  "in-app": "border-violet-800/60 bg-violet-950/40 text-violet-300",
};

function RulesTab({ group, reload }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ eventType: NOTIFICATION_EVENTS[0].value, channel: "email", enabled: true });
  const [saving, setSaving] = useState(false);

  const usedEvents = new Set((group.notificationRules || []).map((r) => r.eventType));
  const availableEvents = NOTIFICATION_EVENTS.filter((e) => !usedEvents.has(e.value));

  const addRule = async () => {
    setSaving(true);
    try {
      const rules = [...(group.notificationRules || []), form];
      await api.put(`/groups/${group._id}`, { notificationRules: rules });
      setAdding(false);
      setForm({ eventType: availableEvents[0]?.value || NOTIFICATION_EVENTS[0].value, channel: "email", enabled: true });
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateRule = async (idx, patch) => {
    const rules = (group.notificationRules || []).map((r, i) => (i === idx ? { ...r, ...patch } : r));
    await api.put(`/groups/${group._id}`, { notificationRules: rules });
    reload();
  };

  const removeRule = async (idx) => {
    const rules = (group.notificationRules || []).filter((_, i) => i !== idx);
    await api.put(`/groups/${group._id}`, { notificationRules: rules });
    reload();
  };

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white/[0.02] px-5 py-4">
        <div>
          <h2 className="heading text-sm font-semibold text-neutral-100">Notification rules</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Which events should reach this group, and over which channel.</p>
        </div>
        <button className="btn-primary px-3 py-1.5" onClick={() => setAdding(true)} disabled={!availableEvents.length}>
          <Plus className="h-4 w-4" /> Add rule
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line bg-white/[0.02]">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Event</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Channel</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Enabled</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500"></th>
            </tr>
          </thead>
          <tbody>
            {(group.notificationRules || []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-sm text-neutral-600">No rules yet — add the events this group should be notified about.</td>
              </tr>
            )}
            {(group.notificationRules || []).map((rule, idx) => (
              <tr key={`${rule.eventType}-${idx}`} className="border-b border-line/60 last:border-0">
                <td className="px-5 py-3 text-neutral-200">{NOTIFICATION_EVENTS.find((e) => e.value === rule.eventType)?.label || rule.eventType}</td>
                <td className="px-5 py-3">
                  <span className={`chip ${CHANNEL_STYLES[rule.channel] || CHANNEL_STYLES.email}`}>{rule.channel}</span>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => updateRule(idx, { enabled: !rule.enabled })}
                    className={`relative h-5 w-9 rounded-full transition ${rule.enabled ? "bg-emerald-600" : "bg-neutral-700"}`}
                    title={rule.enabled ? "Disable rule" : "Enable rule"}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${rule.enabled ? "left-4.5 translate-x-1" : "left-0.5"}`} />
                  </button>
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => removeRule(idx)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-red-950/40 hover:text-red-300" title="Delete rule">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={adding}
        onClose={() => !saving && setAdding(false)}
        title="Add notification rule"
        subtitle="This group will be notified when the event fires."
        width="max-w-md"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setAdding(false)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" onClick={addRule} disabled={saving || !form.eventType}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Adding…" : "Add"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <Field label="Event type">
            <select className="input" value={form.eventType} onChange={(e) => setForm((s) => ({ ...s, eventType: e.target.value }))}>
              {availableEvents.map((e) => (
                <option key={e.value} value={e.value} className="bg-ink-deep">{e.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Channel">
            <Select value={form.channel} onChange={(e) => setForm((s) => ({ ...s, channel: e.target.value }))} options={["email", "in-app"]} />
          </Field>
          <Field label="Enabled">
            <label className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm((s) => ({ ...s, enabled: e.target.checked }))}
                className="h-4 w-4 accent-[#D4AF37]"
              />
              <span className="text-sm text-neutral-300">Active immediately</span>
            </label>
          </Field>
        </div>
      </Modal>
    </section>
  );
}
