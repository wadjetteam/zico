import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, CheckSquare, Loader2, Plus, ShieldCheck, Trash2, UserRound, Users } from "lucide-react";
import api from "../../api/client";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { ErrorState, LoadingState } from "../../components/States";
import { Field, Select, TextInput } from "../../components/Field";
import { chipClass, fmtDateTime } from "../../lib/format";

const MODULES = ["policy", "compliance", "audit", "context", "governance"];
const ACTIONS = ["view", "create", "edit", "delete", "approve"];
const MODULE_LABELS = { policy: "Policy", compliance: "Compliance", audit: "Audit", context: "Context Organization", governance: "Governance" };

const TABS = [
  { key: "matrix", label: "Permissions Matrix", icon: CheckSquare },
  { key: "users", label: "Assigned Users", icon: Users },
  { key: "authority", label: "Approval Authority", icon: ShieldCheck },
];

const cell = (v) => (v ? "border-gold/50 bg-gold/15 text-gold" : "border-line bg-transparent");

export default function RoleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [matrix, setMatrix] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("matrix");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/governance/roles/${id}`);
      setRole(data);
      setMatrix(data.permissionsMatrix || {});
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(load, [load]);

  const saveMatrix = async () => {
    setSaving(true);
    try {
      await api.put(`/governance/roles/${id}`, { permissionsMatrix: matrix });
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (loading || !role || !matrix) return <LoadingState label="Loading role…" />;

  return (
    <div>
      <div className="flex items-start gap-3">
        <button onClick={() => navigate(-1)} className="mt-1 rounded-lg border border-line p-2 text-neutral-400 transition hover:text-gold" title="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="heading text-2xl font-semibold text-neutral-100">{role.name}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
            {role.description || "No description"}
            <span className={chipClass(role.status, { Active: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300", Inactive: "border-neutral-700 bg-neutral-900 text-neutral-400" })}>{role.status}</span>
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
        {tab === "matrix" && (
          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white/[0.02] px-5 py-4">
              <div>
                <h2 className="heading text-sm font-semibold text-neutral-100">Permissions by module × action</h2>
                <p className="mt-0.5 text-xs text-neutral-500">Every module's permission checks reference this matrix — no module keeps its own access rules.</p>
              </div>
              <button className="btn-primary px-3 py-1.5 text-xs" onClick={saveMatrix} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Save Matrix
              </button>
            </div>
            <div className="overflow-x-auto p-5">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Module</th>
                    {ACTIONS.map((a) => (
                      <th key={a} className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{a}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map((mod) => (
                    <tr key={mod} className="border-b border-line/60 last:border-0">
                      <td className="px-2 py-2.5 font-medium text-neutral-200">{MODULE_LABELS[mod]}</td>
                      {ACTIONS.map((a) => (
                        <td key={a} className="px-2 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => setMatrix((m) => ({ ...m, [mod]: { ...(m[mod] || {}), [a]: !m[mod]?.[a] } }))}
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition ${cell(matrix[mod]?.[a])}`}
                            title={`${a} — ${MODULE_LABELS[mod]}`}
                          >
                            {matrix[mod]?.[a] ? <CheckSquare className="h-4 w-4" /> : null}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "users" && <AssignedUsersTab role={role} reload={load} />}
        {tab === "authority" && <AuthorityTab role={role} reload={load} />}
      </div>
    </div>
  );
}

function AssignedUsersTab({ role, reload }) {
  const [users, setUsers] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [assignments, dir] = await Promise.all([
      api.get(`/governance/roles/${role._id}/users`),
      api.get("/users"),
    ]);
    setUsers(assignments.data.items);
    setDirectory(dir.data.items);
    setLoading(false);
  }, [role._id]);

  useEffect(() => {
    load();
  }, [load]);

  const assign = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await api.post(`/governance/roles/${role._id}/users`, { userId: selected });
      setSelected("");
      setOpen(false);
      load();
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const unassign = async (assignment) => {
    if (!window.confirm(`Remove ${assignment.user?.fullName || assignment.user?.username} from this role?`)) return;
    await api.delete(`/governance/roles/${role._id}/users/${assignment.user._id}`);
    load();
    reload();
  };

  const assignedIds = new Set(users.map((u) => String(u.user._id)));
  const available = directory.filter((u) => !assignedIds.has(String(u._id)));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="label">Users holding this role ({users.length})</p>
        <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Assign User
        </button>
      </div>
      <DataTable
        columns={[
          {
            key: "user",
            header: "User",
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
          { key: "username", header: "Username", render: (r) => <span className="text-neutral-300">{r.user?.username}</span> },
          {
            key: "createdAt",
            header: "Assigned at",
            render: (r) => <span className="whitespace-nowrap text-neutral-400">{fmtDateTime(r.createdAt)}</span>},
          {
            key: "__a",
            header: "",
            sortable: false,
            className: "w-14 text-right",
            render: (r) => (
              <button className="rounded-md p-1.5 text-neutral-500 hover:text-red-300" onClick={() => unassign(r)} aria-label="Remove">
                <Trash2 className="h-4 w-4" />
              </button>
            ),
          },
        ]}
        rows={users}
        loading={loading}
        searchable={false}
        emptyHint="No users assigned to this role yet."
      />

      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title="Assign User"
        subtitle={`Add a user to the "${role.name}" role.`}
        width="max-w-md"
        footer={
          <>
            <button className="btn-ghost" type="button" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn-primary" form="assign-form" type="submit" disabled={saving || !selected}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Assign
            </button>
          </>
        }
      >
        <form id="assign-form" onSubmit={assign} className="grid grid-cols-1 gap-4">
          <Field label="User *">
            <Select value={selected} onChange={(e) => setSelected(e.target.value)} options={[{ value: "", label: "— Select user —" }, ...available.map((u) => ({ value: u._id, label: `${u.fullName || u.username} (${u.username})` }))]} />
          </Field>
          {!available.length && <p className="text-xs text-neutral-600">All users already hold this role.</p>}
        </form>
      </Modal>
    </div>
  );
}

function AuthorityTab({ role, reload }) {
  const [entries, setEntries] = useState(role.approvalAuthority || []);
  const [form, setForm] = useState({ module: "policy", workflowStage: "" });
  const [saving, setSaving] = useState(false);

  const save = async (next) => {
    setSaving(true);
    try {
      await api.put(`/governance/roles/${role._id}`, { approvalAuthority: next });
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    const stage = form.workflowStage.trim();
    if (!stage) return;
    await save([...entries, { module: form.module, workflowStage: stage }]);
  };

  const remove = async (i) => {
    await save(entries.filter((_, idx) => idx !== i));
  };

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white/[0.02] px-5 py-4">
        <div>
          <h2 className="heading text-sm font-semibold text-neutral-100">Workflow stages this role can approve</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Referenced by ExceptionType.required_approver_role and policy workflow stages — e.g. "Policy: Approval stage", "Audit: Findings Review stage".
          </p>
        </div>
      </div>
      <div className="p-5">
        <form onSubmit={add} className="mb-5 grid gap-3 sm:grid-cols-[200px_1fr_auto]">
          <Select value={form.module} onChange={(e) => setForm((f) => ({ ...f, module: e.target.value }))} options={MODULES.map((m) => ({ value: m, label: MODULE_LABELS[m] }))} />
          <TextInput value={form.workflowStage} onChange={(e) => setForm((f) => ({ ...f, workflowStage: e.target.value }))} placeholder="Workflow stage, e.g. Findings Review / Approval / Exception Request approval" />
          <button className="btn-primary px-3 py-1.5 text-xs" type="submit" disabled={saving || !form.workflowStage.trim()}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Add
          </button>
        </form>
        {!entries.length && <p className="text-sm text-neutral-600">No approval authority defined — this role cannot approve workflow stages.</p>}
        <div className="flex flex-col gap-2">
          {entries.map((e, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-line bg-white/[0.02] px-3 py-2.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="chip border-gold/30 bg-gold/5 text-gold-light">{MODULE_LABELS[e.module] || e.module}</span>
                <span className="text-neutral-300">{e.workflowStage}</span>
              </div>
              <button className="rounded-md p-1.5 text-neutral-500 hover:text-red-300" onClick={() => remove(i)} aria-label="Remove" disabled={saving}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
