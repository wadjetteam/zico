import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, CalendarDays, FileText, Gavel, Loader2, Pencil, Plus, Trash2, UserRound, Users } from "lucide-react";
import api from "../../api/client";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { ErrorState, LoadingState } from "../../components/States";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import { chipClass, fmtDate, fmtDateInput, fmtDateTime } from "../../lib/format";

const TYPES = ["Board", "Audit Committee", "Risk Committee", "Policy Board", "Other"];
const FREQUENCIES = ["Weekly", "Monthly", "Quarterly", "Semi-annual", "Annual", "Ad hoc"];
const MEMBER_ROLES = ["Chair", "Member", "Secretary"];
const VOTE_RESULTS = ["Unanimous", "Majority", "Minority"];
const RECORD_TYPES = ["Audit Report", "Policy", "Policy Exception", "Compliance Assessment", "Risk Register", "Other"];

const TABS = [
  { key: "details", label: "Details", icon: Pencil },
  { key: "members", label: "Members", icon: Users },
  { key: "meetings", label: "Meeting Log", icon: CalendarDays },
  { key: "decisions", label: "Decisions & Sign-offs", icon: Gavel },
];

const EMPTY_DETAILS = { name: "", type: "Other", chair: "", charter: "", meetingFrequency: "Quarterly", quorumRequired: 3, status: "Active" };

export default function CommitteeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [committee, setCommittee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("details");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/governance/committees/${id}`);
      setCommittee(data);
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (loading || !committee) return <LoadingState label="Loading committee…" />;

  return (
    <div>
      <div className="flex items-start gap-3">
        <button onClick={() => navigate(-1)} className="mt-1 rounded-lg border border-line p-2 text-neutral-400 transition hover:text-gold" title="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="heading text-2xl font-semibold text-neutral-100">{committee.name}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
            <span className="chip border-gold/30 bg-gold/5 text-gold-light">{committee.type}</span>
            {committee.chair?.fullName || committee.chair?.username ? `Chair: ${committee.chair.fullName || committee.chair.username}` : ""}
            <span className={chipClass(committee.status, { Active: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300", Inactive: "border-neutral-700 bg-neutral-900 text-neutral-400" })}>{committee.status}</span>
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
        {tab === "details" && <DetailsTab committee={committee} reload={load} />}
        {tab === "members" && <MembersTab committee={committee} reload={load} />}
        {tab === "meetings" && <MeetingsTab committee={committee} />}
        {tab === "decisions" && <DecisionsTab committee={committee} />}
      </div>
    </div>
  );
}

function DetailsTab({ committee, reload }) {
  const [form, setForm] = useState(() => ({
    name: committee.name,
    type: committee.type,
    chair: committee.chair?._id || "",
    charter: committee.charter || "",
    meetingFrequency: committee.meetingFrequency,
    quorumRequired: committee.quorumRequired,
    status: committee.status,
  }));
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    api.get("/users").then((r) => setUsers(r.data.items));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/governance/committees/${committee._id}`, form);
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
          <h2 className="heading text-sm font-semibold text-neutral-100">Committee details</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Quorum is the minimum number of members required for decisions to be valid.</p>
        </div>
        {!editing && (
          <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}
      </div>
      <div className="p-5">
        {editing ? (
          <form id="det-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Committee name *" className="sm:col-span-2">
              <TextInput value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
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
            <Field label="Quorum required">
              <TextInput type="number" min="1" value={form.quorumRequired} onChange={(e) => setForm((s) => ({ ...s, quorumRequired: e.target.value }))} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} options={["Active", "Inactive"].map((v) => ({ value: v, label: v }))} />
            </Field>
            <Field label="Charter / description" className="sm:col-span-2">
              <TextArea value={form.charter} onChange={(e) => setForm((s) => ({ ...s, charter: e.target.value }))} />
            </Field>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button className="btn-ghost" type="button" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
              <button className="btn-primary" type="submit" disabled={saving || !form.name}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save Details
              </button>
            </div>
          </form>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-line bg-white/[0.02] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Type</div>
              <div className="mt-1 text-sm font-medium text-neutral-100">{committee.type}</div>
            </div>
            <div className="rounded-lg border border-line bg-white/[0.02] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Chair</div>
              <div className="mt-1 text-sm font-medium text-neutral-100">{committee.chair?.fullName || committee.chair?.username || "—"}</div>
            </div>
            <div className="rounded-lg border border-line bg-white/[0.02] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Meeting frequency</div>
              <div className="mt-1 text-sm font-medium text-neutral-100">{committee.meetingFrequency}</div>
            </div>
            <div className="rounded-lg border border-line bg-white/[0.02] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Quorum required</div>
              <div className="mt-1 text-sm font-medium text-neutral-100">{committee.quorumRequired} members</div>
            </div>
            <div className="rounded-lg border border-line bg-white/[0.02] px-4 py-3 sm:col-span-2 lg:col-span-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Charter</div>
              <div className="mt-1 text-sm text-neutral-300">{committee.charter || "—"}</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function MembersTab({ committee, reload }) {
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ userId: "", memberRole: "Member" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [m, u] = await Promise.all([api.get(`/governance/committees/${committee._id}/members`), api.get("/users")]);
    setMembers(m.data.items);
    setUsers(u.data.items);
    setLoading(false);
  }, [committee._id]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/governance/committees/${committee._id}/members`, form);
      setForm({ userId: "", memberRole: "Member" });
      setOpen(false);
      load();
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (m) => {
    if (!window.confirm(`Remove ${m.user?.fullName || m.user?.username} from the committee?`)) return;
    await api.delete(`/governance/committees/${committee._id}/members/${m._id}`);
    load();
    reload();
  };

  const changeRole = async (m, role) => {
    await api.put(`/governance/committees/${committee._id}/members/${m._id}`, { memberRole: role });
    load();
  };

  const memberIds = new Set(members.map((m) => String(m.user?._id)));
  const available = users.filter((u) => !memberIds.has(String(u._id)));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="label">Members ({members.length}) · quorum {committee.quorumRequired}</p>
        <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Member
        </button>
      </div>
      <DataTable
        columns={[
          {
            key: "user",
            header: "Member",
            render: (r) => (
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white/[0.03]">
                  <UserRound className="h-3.5 w-3.5 text-gold" />
                </span>
                <div>
                  <div className="font-medium text-neutral-100">{r.user?.fullName || r.user?.username}</div>
                  <div className="text-xs text-neutral-500">{r.user?.email}</div>
                </div>
              </div>
            ),
          },
          {
            key: "memberRole",
            header: "Role in committee",
            render: (r) => (
              <Select
                className="max-w-[160px] py-1.5"
                value={r.memberRole}
                onChange={(e) => changeRole(r, e.target.value)}
                options={MEMBER_ROLES.map((v) => ({ value: v, label: v }))}
              />
            ),
          },
          {
            key: "__a",
            header: "",
            sortable: false,
            className: "w-14 text-right",
            render: (r) => (
              <button className="rounded-md p-1.5 text-neutral-500 hover:text-red-300" onClick={() => remove(r)} aria-label="Remove">
                <Trash2 className="h-4 w-4" />
              </button>
            ),
          },
        ]}
        rows={members}
        loading={loading}
        searchable={false}
        emptyHint="No members yet — add the first member."
      />

      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title="Add Member"
        subtitle={`Add a member to ${committee.name}.`}
        width="max-w-md"
        footer={
          <>
            <button className="btn-ghost" type="button" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn-primary" form="mem-form" type="submit" disabled={saving || !form.userId}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Add Member
            </button>
          </>
        }
      >
        <form id="mem-form" onSubmit={add} className="grid grid-cols-1 gap-4">
          <Field label="Member *">
            <Select value={form.userId} onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))} options={[{ value: "", label: "— Select user —" }, ...available.map((u) => ({ value: u._id, label: `${u.fullName || u.username} (${u.username})` }))]} />
          </Field>
          <Field label="Role in committee">
            <Select value={form.memberRole} onChange={(e) => setForm((f) => ({ ...f, memberRole: e.target.value }))} options={MEMBER_ROLES.map((v) => ({ value: v, label: v }))} />
          </Field>
          {!available.length && <p className="text-xs text-neutral-600">All users are already members of this committee.</p>}
        </form>
      </Modal>
    </div>
  );
}

function MeetingsTab({ committee }) {
  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: fmtDateInput(new Date()), attendees: [], agenda: "", minutesDocumentId: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [m, u] = await Promise.all([api.get(`/governance/committees/${committee._id}/meetings`), api.get("/users")]);
    setMeetings(m.data.items);
    setUsers(u.data.items);
    setLoading(false);
  }, [committee._id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleAttendee = (id) => {
    setForm((f) => ({
      ...f,
      attendees: f.attendees.includes(id) ? f.attendees.filter((a) => a !== id) : [...f.attendees, id],
    }));
  };

  const log = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/governance/committees/${committee._id}/meetings`, form);
      setForm({ date: fmtDateInput(new Date()), attendees: [], agenda: "", minutesDocumentId: "" });
      setOpen(false);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (m) => {
    if (!window.confirm("Delete this meeting record?")) return;
    await api.delete(`/governance/committees/${committee._id}/meetings/${m._id}`);
    load();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="label">Meeting log ({meetings.length})</p>
        <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Log Meeting
        </button>
      </div>
      <DataTable
        columns={[
          { key: "date", header: "Date", render: (r) => <span className="whitespace-nowrap text-neutral-200">{fmtDate(r.date)}</span> },
          {
            key: "attendees",
            header: "Attendees",
            render: (r) => <span className="max-w-[260px] text-neutral-300">{r.attendees?.map((a) => a.fullName || a.username).join(", ") || "—"}</span>,
          },
          { key: "agenda", header: "Agenda", render: (r) => <span className="max-w-[300px] text-neutral-400">{r.agenda || "—"}</span> },
          {
            key: "minutesDocumentId",
            header: "Minutes",
            render: (r) =>
              r.minutesDocumentId ? (
                <a href={r.minutesDocumentId} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gold hover:underline">
                  <FileText className="h-3.5 w-3.5" /> Minutes
                </a>
              ) : (
                <span className="text-neutral-600">—</span>
              ),
          },
          {
            key: "decisionsCount",
            header: "Decisions recorded",
            render: (r) => <span className="font-semibold text-neutral-200">{r.decisionsCount}</span>,
          },
          {
            key: "__a",
            header: "",
            sortable: false,
            className: "w-14 text-right",
            render: (r) => (
              <button className="rounded-md p-1.5 text-neutral-500 hover:text-red-300" onClick={() => remove(r)} aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            ),
          },
        ]}
        rows={meetings}
        loading={loading}
        searchable={false}
        emptyHint="No meetings logged yet."
      />

      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title="Log Meeting"
        subtitle={`Record a ${committee.name} meeting.`}
        width="max-w-lg"
        footer={
          <>
            <button className="btn-ghost" type="button" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn-primary" form="meet-form" type="submit" disabled={saving || !form.date}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Log Meeting
            </button>
          </>
        }
      >
        <form id="meet-form" onSubmit={log} className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Date *">
              <TextInput type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </Field>
            <Field label="Minutes (file link)">
              <TextInput value={form.minutesDocumentId} onChange={(e) => setForm((f) => ({ ...f, minutesDocumentId: e.target.value }))} placeholder="/docs/minutes-2026-02.pdf" />
            </Field>
          </div>
          <Field label="Attendees">
            <div className="flex max-h-32 flex-col gap-1.5 overflow-y-auto rounded-lg border border-line bg-ink-deep p-2">
              {users.map((u) => (
                <label key={u._id} className="flex cursor-pointer items-center gap-2 px-1 text-sm text-neutral-300">
                  <input type="checkbox" className="h-4 w-4 accent-gold" checked={form.attendees.includes(u._id)} onChange={() => toggleAttendee(u._id)} />
                  {u.fullName || u.username} <span className="text-xs text-neutral-600">({u.username})</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Agenda">
            <TextArea value={form.agenda} onChange={(e) => setForm((f) => ({ ...f, agenda: e.target.value }))} placeholder="Topics discussed…" />
          </Field>
        </form>
      </Modal>
    </div>
  );
}

function DecisionsTab({ committee }) {
  const [decisions, setDecisions] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: fmtDateInput(new Date()), meeting: "", linkedRecordType: "", linkedRecordId: "", voteResult: "Unanimous", decision: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [d, m] = await Promise.all([api.get(`/governance/committees/${committee._id}/decisions`), api.get(`/governance/committees/${committee._id}/meetings`)]);
    setDecisions(d.data.items);
    setMeetings(m.data.items);
    setLoading(false);
  }, [committee._id]);

  useEffect(() => {
    load();
  }, [load]);

  const record = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/governance/committees/${committee._id}/decisions`, form);
      setForm({ date: fmtDateInput(new Date()), meeting: "", linkedRecordType: "", linkedRecordId: "", voteResult: "Unanimous", decision: "" });
      setOpen(false);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (d) => {
    if (!window.confirm("Delete this decision record?")) return;
    await api.delete(`/governance/committees/${committee._id}/decisions/${d._id}`);
    load();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="label">Decisions & sign-offs ({decisions.length})</p>
        <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Record Decision
        </button>
      </div>
      <DataTable
        columns={[
          { key: "date", header: "Date", render: (r) => <span className="whitespace-nowrap text-neutral-200">{fmtDate(r.date)}</span> },
          {
            key: "linkedRecord",
            header: "Record linked",
            render: (r) =>
              r.linkedRecordType || r.linkedRecordId ? (
                <span className="whitespace-nowrap text-neutral-300">
                  {r.linkedRecordType} {r.linkedRecordId && <span className="font-mono text-xs text-gold">{r.linkedRecordId}</span>}
                </span>
              ) : (
                <span className="text-neutral-600">—</span>
              ),
          },
          {
            key: "voteResult",
            header: "Vote result",
            render: (r) => (
              <span className={chipClass(r.voteResult, { Unanimous: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300", Majority: "border-sky-800/60 bg-sky-950/40 text-sky-300", Minority: "border-amber-800/60 bg-amber-950/40 text-amber-300" })}>
                {r.voteResult}
              </span>
            ),
          },
          { key: "decision", header: "Decision", render: (r) => <span className="max-w-[360px] text-neutral-300">{r.decision}</span> },
          {
            key: "meeting",
            header: "Meeting",
            render: (r) => <span className="whitespace-nowrap text-neutral-400">{r.meeting ? fmtDate(r.meeting.date) : "—"}</span>,
          },
          {
            key: "__a",
            header: "",
            sortable: false,
            className: "w-14 text-right",
            render: (r) => (
              <button className="rounded-md p-1.5 text-neutral-500 hover:text-red-300" onClick={() => remove(r)} aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            ),
          },
        ]}
        rows={decisions}
        loading={loading}
        searchable={false}
        emptyHint="No formal decisions recorded yet."
      />

      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title="Record Decision"
        subtitle="Formal sign-off or decision by the committee (requires quorum on the linked meeting)."
        width="max-w-lg"
        footer={
          <>
            <button className="btn-ghost" type="button" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn-primary" form="dec-form" type="submit" disabled={saving || !form.decision}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Record Decision
            </button>
          </>
        }
      >
        <form id="dec-form" onSubmit={record} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date">
            <TextInput type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </Field>
          <Field label="Linked meeting">
            <Select value={form.meeting} onChange={(e) => setForm((f) => ({ ...f, meeting: e.target.value }))} options={[{ value: "", label: "— None —" }, ...meetings.map((m) => ({ value: m._id, label: fmtDate(m.date) }))]} />
          </Field>
          <Field label="Record type">
            <Select value={form.linkedRecordType} onChange={(e) => setForm((f) => ({ ...f, linkedRecordType: e.target.value }))} options={[{ value: "", label: "— None —" }, ...RECORD_TYPES.map((t) => ({ value: t, label: t }))]} />
          </Field>
          <Field label="Record ID">
            <TextInput value={form.linkedRecordId} onChange={(e) => setForm((f) => ({ ...f, linkedRecordId: e.target.value }))} placeholder='e.g. "AUD-0002"' />
          </Field>
          <Field label="Vote result">
            <Select value={form.voteResult} onChange={(e) => setForm((f) => ({ ...f, voteResult: e.target.value }))} options={VOTE_RESULTS.map((v) => ({ value: v, label: v }))} />
          </Field>
          <Field label="Decision *" className="sm:col-span-2">
            <TextArea value={form.decision} onChange={(e) => setForm((f) => ({ ...f, decision: e.target.value }))} required placeholder='e.g. "Approved Audit Report AUD-0012…"' />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
