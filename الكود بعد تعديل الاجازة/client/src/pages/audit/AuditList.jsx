import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, SearchCheck, Trash2, Pencil } from "lucide-react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { ErrorState } from "../../components/States";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import { chipClass, fmtDate, fmtDateInput } from "../../lib/format";

export const STAGES = ["Planning", "Fieldwork", "Findings Review", "Reporting", "CAPA", "Closed"];
export const TYPES = ["Internal", "External", "IT", "Financial", "Compliance"];

const STAGE_STYLES = {
  Planning: "border-neutral-700 bg-neutral-900 text-neutral-400",
  Fieldwork: "border-sky-800/60 bg-sky-950/40 text-sky-300",
  "Findings Review": "border-amber-800/60 bg-amber-950/40 text-amber-300",
  Reporting: "border-indigo-800/60 bg-indigo-950/40 text-indigo-300",
  CAPA: "border-gold/40 bg-gold/10 text-gold-light",
  Closed: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
};

export const stageChip = (s) => chipClass(s, STAGE_STYLES);

export const ProgressBar = ({ percent }) => (
  <div className="flex items-center gap-2">
    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
      <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, Math.max(0, percent || 0))}%` }} />
    </div>
    <span className="text-xs text-neutral-500">{percent || 0}%</span>
  </div>
);

export default function AuditList({ view, title, subtitle, showUniverse = false }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [type, setType] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [universeOpen, setUniverseOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get("/audit/engagements", { params: { view, pageSize: 100, type: type || undefined } })
      .then((r) => setRows(r.data.items || []))
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [view, type]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = useMemo(
    () => [
      {
        key: "title",
        header: "Engagement",
        render: (r) => (
          <div>
            <div className="font-medium text-neutral-100">{r.title}</div>
            <div className="text-xs text-neutral-500">{r.auditId}</div>
          </div>
        ),
      },
      { key: "auditType", header: "Type", render: (r) => <span className="text-xs">{r.auditType || "Internal"}</span> },
      { key: "entity", header: "Audited entity", render: (r) => r.entity?.name || r.auditee || "—" },
      {
        key: "leadAuditor",
        header: "Lead auditor",
        render: (r) => r.leadAuditor?.fullName || r.leadAuditor?.username || "—",
      },
      {
        key: "dates",
        header: "Dates",
        sortable: false,
        render: (r) => (
          <span className="text-xs text-neutral-400">
            {fmtDate(r.plannedStart)} → {fmtDate(r.plannedEnd)}
          </span>
        ),
      },
      {
        key: "stage",
        header: "Stage",
        render: (r) => (
          <div className="flex flex-col gap-1">
            <span className={`chip ${stageChip(r.stage)}`}>{r.stage}</span>
            <ProgressBar percent={r.progressPercent} />
          </div>
        ),
      },
      {
        key: "overallRating",
        header: "Rating",
        render: (r) => (r.overallRating ? <span className="chip border-neutral-700 bg-neutral-900 text-neutral-400">{r.overallRating}</span> : "—"),
      },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <Select
              className="w-44"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[{ value: "", label: "All types" }, ...TYPES.map((t) => ({ value: t, label: t }))]}
            />
            {showUniverse && (
              <button className="btn-ghost" onClick={() => setUniverseOpen(true)}>
                <SearchCheck className="h-4 w-4" /> Audit Universe
              </button>
            )}
            <button className="btn-primary" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> New Engagement
            </button>
          </>
        }
      />

      {error && !loading ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          searchPlaceholder="Search engagements…"
          emptyHint="No audit engagements in this view."
          onRowClick={(r) => navigate(`/audit/engagements/${r._id}`)}
        />
      )}

      <EngagementModal open={createOpen} onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); load(); }} />
      {showUniverse && <UniverseModal open={universeOpen} onClose={() => setUniverseOpen(false)} />}
    </>
  );
}

export function EngagementModal({ open, onClose, onSaved, engagement }) {
  const [form, setForm] = useState({});
  const [frameworks, setFrameworks] = useState([]);
  const [users, setUsers] = useState([]);
  const [entities, setEntities] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    api.get("/frameworks", { params: { pageSize: 100 } }).then((r) => setFrameworks(r.data.items || []));
    api.get("/users").then((r) => setUsers(r.data.items || []));
    api.get("/audit/universe", { params: { pageSize: 100 } }).then((r) => setEntities(r.data.items || []));
    setForm(
      engagement
        ? {
            title: engagement.title,
            objective: engagement.objective || "",
            scope: engagement.scope || "",
            auditType: engagement.auditType || "Internal",
            criteriaFrameworkIds: (engagement.criteriaFrameworkIds || []).map((f) => f._id || f),
            criteriaPolicyIds: (engagement.criteriaPolicyIds || []).map((p) => p._id || p),
            leadAuditor: engagement.leadAuditor?._id || "",
            auditTeam: (engagement.auditTeam || []).map((u) => u._id || u),
            auditee: engagement.auditee || "",
            entity: engagement.entity?._id || "",
            classification: engagement.classification || "",
            plannedStart: fmtDateInput(engagement.plannedStart),
            plannedEnd: fmtDateInput(engagement.plannedEnd),
            stage: engagement.stage || "Planning",
          }
        : { auditType: "Internal", stage: "Planning", criteriaFrameworkIds: [], auditTeam: [] }
    );
  }, [open, engagement]);

  const toggle = (key, id) =>
    setForm((f) => ({ ...f, [key]: f[key].includes(id) ? f[key].filter((x) => x !== id) : [...f[key], id] }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      payload.plannedStart = payload.plannedStart ? new Date(payload.plannedStart).toISOString() : undefined;
      payload.plannedEnd = payload.plannedEnd ? new Date(payload.plannedEnd).toISOString() : undefined;
      if (engagement) await api.put(`/audit/engagements/${engagement._id}`, payload);
      else await api.post("/audit/engagements", payload);
      onSaved();
    } catch (err) {
      window.alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={engagement ? "Edit engagement" : "New audit engagement"}
      subtitle="Planning details — dates, criteria and team. The workflow starts at Planning."
      width="max-w-3xl"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} type="button">Cancel</button>
          <button className="btn-primary" form="engagement-form" type="submit" disabled={saving}>
            {saving ? "Saving…" : engagement ? "Save changes" : "Create engagement"}
          </button>
        </>
      }
    >
      <form id="engagement-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2">
          <TextInput value={form.title || ""} required onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. ISO 27001 Surveillance Audit 2026" />
        </Field>
        <Field label="Audit type">
          <Select value={form.auditType || "Internal"} onChange={(e) => setForm((f) => ({ ...f, auditType: e.target.value }))} options={TYPES.map((t) => ({ value: t, label: t }))} />
        </Field>
        <Field label="Start stage">
          <Select value={form.stage || "Planning"} onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))} options={STAGES.map((s) => ({ value: s, label: s }))} />
        </Field>
        <Field label="Planned start">
          <TextInput type="date" value={form.plannedStart || ""} required onChange={(e) => setForm((f) => ({ ...f, plannedStart: e.target.value }))} />
        </Field>
        <Field label="Planned end">
          <TextInput type="date" value={form.plannedEnd || ""} required onChange={(e) => setForm((f) => ({ ...f, plannedEnd: e.target.value }))} />
        </Field>
        <Field label="Audited entity">
          <Select value={form.entity || ""} onChange={(e) => setForm((f) => ({ ...f, entity: e.target.value }))} options={[{ value: "", label: "— None —" }, ...entities.map((x) => ({ value: x._id, label: `${x.name} (${x.type})` }))]} />
        </Field>
        <Field label="Auditee / process owner">
          <TextInput value={form.auditee || ""} onChange={(e) => setForm((f) => ({ ...f, auditee: e.target.value }))} />
        </Field>
        <Field label="Lead auditor">
          <Select value={form.leadAuditor || ""} onChange={(e) => setForm((f) => ({ ...f, leadAuditor: e.target.value }))} options={[{ value: "", label: "— None —" }, ...users.map((u) => ({ value: u._id, label: u.fullName || u.username }))]} />
        </Field>
        <Field label="Classification">
          <TextInput value={form.classification || ""} onChange={(e) => setForm((f) => ({ ...f, classification: e.target.value }))} placeholder="Confidential / Internal…" />
        </Field>
        <Field label="Criteria frameworks" hint="Controls tested against these frameworks." className="sm:col-span-2">
          <div className="flex flex-wrap gap-2">
            {frameworks.map((f) => (
              <button
                key={f._id}
                type="button"
                onClick={() => toggle("criteriaFrameworkIds", f._id)}
                className={`chip transition ${form.criteriaFrameworkIds?.includes(f._id) ? "border-gold/60 bg-gold/10 text-gold-light" : "border-neutral-700 bg-neutral-900 text-neutral-400"}`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Audit team" className="sm:col-span-2">
          <div className="flex flex-wrap gap-2">
            {users.map((u) => (
              <button
                key={u._id}
                type="button"
                onClick={() => toggle("auditTeam", u._id)}
                className={`chip transition ${form.auditTeam?.includes(u._id) ? "border-gold/60 bg-gold/10 text-gold-light" : "border-neutral-700 bg-neutral-900 text-neutral-400"}`}
              >
                {u.fullName || u.username}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Objective" className="sm:col-span-2">
          <TextArea value={form.objective || ""} onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))} />
        </Field>
        <Field label="Scope" className="sm:col-span-2">
          <TextArea value={form.scope || ""} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))} />
        </Field>
      </form>
    </Modal>
  );
}

function UniverseModal({ open, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!open) return;
    setLoading(true);
    api
      .get("/audit/universe", { params: { pageSize: 100 } })
      .then((r) => setRows(r.data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(load, [load]);

  const openEdit = (row) => {
    setForm(
      row
        ? {
            name: row.name,
            type: row.type,
            owner: row.owner || "",
            inherentRiskRating: row.inherentRiskRating || "Medium",
            lastAuditedAt: fmtDateInput(row.lastAuditedAt),
            nextScheduledAt: fmtDateInput(row.nextScheduledAt),
          }
        : { type: "System", inherentRiskRating: "Medium" }
    );
    setEditing(row || "new");
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.lastAuditedAt) payload.lastAuditedAt = new Date(payload.lastAuditedAt).toISOString();
      if (payload.nextScheduledAt) payload.nextScheduledAt = new Date(payload.nextScheduledAt).toISOString();
      if (editing === "new") await api.post("/audit/universe", payload);
      else await api.put(`/audit/universe/${editing._id}`, payload);
      setEditing(null);
      load();
    } catch (err) {
      window.alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Remove "${row.name}" from the audit universe?`)) return;
    await api.delete(`/audit/universe/${row._id}`);
    load();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Audit universe"
      subtitle="Department, system, process and vendor scope — with inherent risk ratings."
      width="max-w-4xl"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} type="button">Close</button>
          <button className="btn-primary" onClick={() => openEdit(null)} type="button"><Plus className="h-4 w-4" /> New entity</button>
        </>
      }
    >
      <DataTable
        columns={[
          { key: "name", header: "Entity", render: (r) => <span className="font-medium text-neutral-100">{r.name}</span> },
          { key: "entityId", header: "ID" },
          { key: "type", header: "Type" },
          { key: "owner", header: "Owner" },
          { key: "inherentRiskRating", header: "Inherent risk", render: (r) => <span className={chipClass(r.inherentRiskRating)}>{r.inherentRiskRating}</span> },
          { key: "nextScheduledAt", header: "Next scheduled", render: (r) => fmtDate(r.nextScheduledAt) },
          {
            key: "__actions",
            header: "",
            sortable: false,
            className: "w-24 text-right",
            render: (r) => (
              <div className="flex justify-end gap-1">
                <button className="rounded-md p-1.5 text-neutral-500 hover:text-gold" onClick={() => openEdit(r)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                <button className="rounded-md p-1.5 text-neutral-500 hover:text-red-300" onClick={() => remove(r)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            ),
          },
        ]}
        rows={rows}
        loading={loading}
        searchPlaceholder="Search entities…"
        pageSize={8}
      />

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === "new" ? "New auditable entity" : "Edit entity"} width="max-w-xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} type="button">Cancel</button>
            <button className="btn-primary" form="entity-form" type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </>
        }
      >
        <form id="entity-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Entity name" className="sm:col-span-2">
            <TextInput value={form.name || ""} required onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Type">
            <Select value={form.type || "System"} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} options={["Department", "System", "Process", "Vendor"].map((t) => ({ value: t, label: t }))} />
          </Field>
          <Field label="Inherent risk rating">
            <Select value={form.inherentRiskRating || "Medium"} onChange={(e) => setForm((f) => ({ ...f, inherentRiskRating: e.target.value }))} options={["Low", "Medium", "High", "Critical"].map((t) => ({ value: t, label: t }))} />
          </Field>
          <Field label="Owner">
            <TextInput value={form.owner || ""} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} />
          </Field>
          <Field label="Last audited">
            <TextInput type="date" value={form.lastAuditedAt || ""} onChange={(e) => setForm((f) => ({ ...f, lastAuditedAt: e.target.value }))} />
          </Field>
          <Field label="Next scheduled" className="sm:col-span-2">
            <TextInput type="date" value={form.nextScheduledAt || ""} onChange={(e) => setForm((f) => ({ ...f, nextScheduledAt: e.target.value }))} />
          </Field>
        </form>
      </Modal>
    </Modal>
  );
}
