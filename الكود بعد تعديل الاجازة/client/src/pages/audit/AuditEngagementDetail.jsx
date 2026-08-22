import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, Briefcase, ClipboardList, Eye, FileText, Fingerprint, Flag, Layers, ListChecks, Pencil, Plus, ScrollText, ShieldCheck, Trash2,
} from "lucide-react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { ErrorState, LoadingState } from "../../components/States";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import { chipClass, fmtDate, fmtDateInput, fmtDateTime } from "../../lib/format";
import { STAGES, stageChip, ProgressBar } from "./AuditList";

const SEVERITIES = ["Critical", "High", "Medium", "Low"];

const InfoRow = ({ label, value }) => (
  <div className="py-2">
    <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{label}</div>
    <div className="mt-0.5 text-sm text-neutral-200">{value || "—"}</div>
  </div>
);

const TABS = [
  { key: "details", label: "Details", icon: Briefcase },
  { key: "workflow", label: "Workflow & Lifecycle", icon: ListChecks },
  { key: "procedures", label: "Checklist / Test Procedures", icon: ClipboardList },
  { key: "evidence", label: "Fieldwork & Evidence", icon: Fingerprint },
  { key: "findings", label: "Findings", icon: Flag },
  { key: "capa", label: "CAPA", icon: ShieldCheck },
  { key: "mapping", label: "Control & Framework Mapping", icon: Layers },
  { key: "reports", label: "Report History", icon: FileText },
  { key: "trail", label: "Audit Trail", icon: ScrollText },
];

export default function AuditEngagementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [engagement, setEngagement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("details");

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/audit/engagements/${id}`)
      .then((r) => setEngagement(r.data))
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  const transition = async (to) => {
    const comments = window.prompt(`Move to "${to}" — approval comment (optional):`, "");
    if (comments === null) return;
    try {
      await api.put(`/audit/engagements/${id}/transition`, { to, comments });
      load();
    } catch (err) {
      window.alert(err?.response?.data?.message || err.message);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (loading || !engagement) return <LoadingState label="Loading engagement…" />;

  const idx = STAGES.indexOf(engagement.stage);
  const nextStage = idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1] : null;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate(-1)} className="mt-1 rounded-lg border border-line p-2 text-neutral-400 transition hover:text-gold" title="Back">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="heading text-2xl font-semibold text-neutral-100">{engagement.title}</h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
              {engagement.auditId} · {engagement.auditType} · {engagement.entity?.name || "—"} ·{" "}
              <span className={`chip ${stageChip(engagement.stage)}`}>{engagement.stage}</span>
              {engagement.overallRating && <span className="chip border-neutral-700 bg-neutral-900 text-neutral-400">{engagement.overallRating}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {nextStage && (
            <button className="btn-primary" onClick={() => transition(nextStage)}>
              Move to {nextStage}
            </button>
          )}
          <ProgressBar percent={engagement.progressPercent} />
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
        {tab === "details" && <DetailsTab engagement={engagement} reload={load} />}
        {tab === "workflow" && <WorkflowTab engagement={engagement} onTransition={transition} reload={load} />}
        {tab === "procedures" && <ProceduresTab engagement={engagement} reload={load} />}
        {tab === "evidence" && <EvidenceTab engagement={engagement} />}
        {tab === "findings" && <FindingsTab engagement={engagement} reload={load} />}
        {tab === "capa" && <CapaTab engagement={engagement} reload={load} />}
        {tab === "mapping" && <MappingTab engagement={engagement} />}
        {tab === "reports" && <ReportsTab engagement={engagement} reload={load} />}
        {tab === "trail" && <TrailTab engagement={engagement} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1) Details
// ---------------------------------------------------------------------------

function DetailsTab({ engagement, reload }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const open = () => {
    setForm({
      title: engagement.title,
      objective: engagement.objective || "",
      scope: engagement.scope || "",
      auditType: engagement.auditType || "Internal",
      leadAuditor: engagement.leadAuditor?._id || "",
      auditee: engagement.auditee || "",
      entity: engagement.entity?._id || "",
      classification: engagement.classification || "",
      overallRating: engagement.overallRating || "",
      nextFollowupAt: fmtDateInput(engagement.nextFollowupAt),
      plannedStart: fmtDateInput(engagement.plannedStart),
      plannedEnd: fmtDateInput(engagement.plannedEnd),
    });
    setEditing(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      for (const k of ["plannedStart", "plannedEnd", "nextFollowupAt"]) payload[k] = payload[k] ? new Date(payload[k]).toISOString() : undefined;
      await api.put(`/audit/engagements/${engagement._id}`, payload);
      setEditing(false);
      reload();
    } catch (err) {
      window.alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="card p-5 lg:col-span-2">
        <h2 className="mb-2 text-sm font-semibold text-neutral-200">Engagement details</h2>
        <div className="grid grid-cols-2 gap-x-8">
          <InfoRow label="Objective" value={engagement.objective} />
          <InfoRow label="Scope" value={engagement.scope} />
          <InfoRow label="Planned dates" value={`${fmtDate(engagement.plannedStart)} → ${fmtDate(engagement.plannedEnd)}`} />
          <InfoRow label="Actual dates" value={engagement.actualStart ? `${fmtDate(engagement.actualStart)} → ${fmtDate(engagement.actualEnd)}` : "—"} />
          <InfoRow label="Lead auditor" value={engagement.leadAuditor?.fullName || engagement.leadAuditor?.username || "—"} />
          <InfoRow label="Audit team" value={(engagement.auditTeam || []).map((u) => u.fullName || u.username).join(", ") || "—"} />
          <InfoRow label="Audited entity" value={engagement.entity?.name || "—"} />
          <InfoRow label="Auditee" value={engagement.auditee || "—"} />
          <InfoRow label="Classification" value={engagement.classification || "—"} />
          <InfoRow label="Overall rating" value={engagement.overallRating || "—"} />
          <InfoRow label="Next follow-up" value={fmtDate(engagement.nextFollowupAt)} />
          <InfoRow label="Stage reached" value={`${engagement.stage} (${engagement.progressPercent}%)`} />
        </div>
        <button className="btn-ghost mt-4" onClick={open}>Edit details</button>
      </div>

      <div className="card p-5">
        <h2 className="mb-2 text-sm font-semibold text-neutral-200">Criteria</h2>
        <div className="text-xs uppercase tracking-wider text-neutral-500">Frameworks</div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {(engagement.criteriaFrameworkIds || []).length ? (
            engagement.criteriaFrameworkIds.map((f) => (
              <span key={f._id} className="chip border-neutral-700 bg-neutral-900 text-neutral-300">{f.name} v{f.version}</span>
            ))
          ) : (
            <span className="text-sm text-neutral-500">None selected</span>
          )}
        </div>
        <div className="mt-4 text-xs uppercase tracking-wider text-neutral-500">Policies</div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {(engagement.criteriaPolicyIds || []).length ? (
            engagement.criteriaPolicyIds.map((p) => (
              <span key={p._id} className="chip border-neutral-700 bg-neutral-900 text-neutral-300">{p.title}</span>
            ))
          ) : (
            <span className="text-sm text-neutral-500">None selected</span>
          )}
        </div>
        <div className="mt-4 text-xs uppercase tracking-wider text-neutral-500">Approval history</div>
        <div className="mt-2 flex flex-col gap-2">
          {(engagement.approvalHistory || []).slice(-4).reverse().map((a, i) => (
            <div key={i} className="rounded-lg border border-line bg-white/[0.02] p-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-200">{a.from} → {a.to}</span>
                <span className="text-neutral-500">{fmtDate(a.at)}</span>
              </div>
              <div className="mt-0.5 text-neutral-400">{a.approver}{a.comments ? ` — ${a.comments}` : ""}</div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit engagement details" width="max-w-3xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(false)} type="button">Cancel</button>
            <button className="btn-primary" form="detail-form" type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </>
        }
      >
        <form id="detail-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2"><TextInput value={form.title || ""} required onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></Field>
          <Field label="Audit type"><Select value={form.auditType || "Internal"} onChange={(e) => setForm((f) => ({ ...f, auditType: e.target.value }))} options={["Internal", "External", "IT", "Financial", "Compliance"].map((t) => ({ value: t, label: t }))} /></Field>
          <Field label="Classification"><TextInput value={form.classification || ""} onChange={(e) => setForm((f) => ({ ...f, classification: e.target.value }))} /></Field>
          <Field label="Planned start"><TextInput type="date" value={form.plannedStart || ""} onChange={(e) => setForm((f) => ({ ...f, plannedStart: e.target.value }))} /></Field>
          <Field label="Planned end"><TextInput type="date" value={form.plannedEnd || ""} onChange={(e) => setForm((f) => ({ ...f, plannedEnd: e.target.value }))} /></Field>
          <Field label="Overall rating">
            <Select value={form.overallRating || ""} onChange={(e) => setForm((f) => ({ ...f, overallRating: e.target.value }))} options={[{ value: "", label: "— None —" }, ...["Satisfactory", "Needs Improvement", "Unsatisfactory"].map((t) => ({ value: t, label: t }))]} />
          </Field>
          <Field label="Next follow-up"><TextInput type="date" value={form.nextFollowupAt || ""} onChange={(e) => setForm((f) => ({ ...f, nextFollowupAt: e.target.value }))} /></Field>
          <Field label="Objective" className="sm:col-span-2"><TextArea value={form.objective || ""} onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))} /></Field>
          <Field label="Scope" className="sm:col-span-2"><TextArea value={form.scope || ""} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))} /></Field>
        </form>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2) Workflow & Lifecycle
// ---------------------------------------------------------------------------

function WorkflowTab({ engagement, onTransition }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-neutral-200">Lifecycle</h2>
        <div className="flex items-center gap-0">
          {STAGES.map((s, i) => {
            const reached = STAGES.indexOf(engagement.stage) >= i;
            const current = engagement.stage === s;
            return (
              <div key={s} className="flex flex-1 flex-col items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                  current ? "border-gold bg-gold/15 text-gold" : reached ? "border-emerald-800/60 bg-emerald-950/40 text-emerald-300" : "border-neutral-700 bg-neutral-900 text-neutral-500"
                }`}>
                  {i + 1}
                </div>
                <div className={`mt-1.5 text-center text-[10px] font-medium leading-tight ${current ? "text-gold" : reached ? "text-neutral-300" : "text-neutral-600"}`}>{s}</div>
                {i < STAGES.length - 1 && (
                  <div className={`mt-[-26px] h-0.5 w-full self-start pl-8 ${STAGES.indexOf(engagement.stage) > i ? "bg-emerald-800/60" : "bg-neutral-800"}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 border-t border-line pt-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Move to stage</h3>
          <div className="flex flex-wrap gap-2">
            {STAGES.filter((s) => s !== engagement.stage).map((s) => (
              <button key={s} className={`chip transition hover:border-gold/60 hover:text-gold ${stageChip(s)}`} onClick={() => onTransition(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-neutral-200">Approval history</h2>
        <div className="flex flex-col gap-2">
          {(engagement.approvalHistory || []).slice().reverse().map((a, i) => (
            <div key={i} className="rounded-lg border border-line bg-white/[0.02] p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-neutral-200">
                  <span className="chip border-neutral-700 bg-neutral-900 text-neutral-400">{a.from}</span>
                  <span className="mx-1.5 text-neutral-500">→</span>
                  <span className={`chip ${stageChip(a.to)}`}>{a.to}</span>
                </span>
                <span className="text-xs text-neutral-500">{fmtDateTime(a.at)}</span>
              </div>
              <div className="mt-1.5 text-xs text-neutral-400">by {a.approver}{a.comments ? ` — ${a.comments}` : ""}</div>
            </div>
          ))}
          {!engagement.approvalHistory?.length && <p className="text-sm text-neutral-500">No transitions recorded yet.</p>}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3) Test procedures
// ---------------------------------------------------------------------------

function ProceduresTab({ engagement, reload }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [controls, setControls] = useState([]);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/controls", { params: { pageSize: 500 } }).then((r) => setControls(r.data.items || []));
    api.get("/users").then((r) => setUsers(r.data.items || []));
  }, []);

  const open = (row) => {
    setForm(
      row
        ? {
            description: row.description,
            relatedControl: row.relatedControl?._id || "",
            testMethod: row.testMethod || "Inquiry",
            result: row.result || "Not Tested",
            tester: row.tester || "",
            testedAt: fmtDateInput(row.testedAt),
          }
        : { testMethod: "Inquiry", result: "Not Tested" }
    );
    setEditing(row || "new");
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      payload.testedAt = payload.testedAt ? new Date(payload.testedAt).toISOString() : undefined;
      if (editing === "new") await api.post(`/audit/engagements/${engagement._id}/procedures`, payload);
      else await api.put(`/audit/procedures/${editing._id}`, payload);
      setEditing(null);
      reload();
    } catch (err) {
      window.alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm("Delete this test procedure?")) return;
    await api.delete(`/audit/procedures/${row._id}`);
    reload();
  };

  const RESULT_STYLES = { Pass: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300", Fail: "border-red-800/60 bg-red-950/40 text-red-300", "N/A": "border-neutral-700 bg-neutral-900 text-neutral-400", "Not Tested": "border-neutral-700 bg-neutral-900 text-neutral-500" };

  return (
    <div>
      <DataTable
        columns={[
          { key: "procedureId", header: "ID" },
          { key: "description", header: "Procedure", render: (r) => <span className="font-medium text-neutral-100">{r.description}</span> },
          { key: "testMethod", header: "Method", render: (r) => <span className="text-xs">{r.testMethod}</span> },
          { key: "relatedControl", header: "Related control", render: (r) => r.relatedControl ? `${r.relatedControl.controlId} — ${r.relatedControl.name}` : "—" },
          { key: "tester", header: "Tester" },
          { key: "testedAt", header: "Tested", render: (r) => fmtDate(r.testedAt) },
          { key: "result", header: "Result", render: (r) => <span className={`chip ${chipClass(r.result, RESULT_STYLES)}`}>{r.result}</span> },
        ]}
        rows={engagement.procedures || []}
        loading={false}
        emptyHint="No test procedures defined yet."
        toolbar={
          <button className="btn-primary" onClick={() => open(null)}><Plus className="h-4 w-4" /> Add procedure</button>
        }
      />

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === "new" ? "New test procedure" : "Edit procedure"}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} type="button">Cancel</button>
            <button className="btn-primary" form="proc-form" type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </>
        }
      >
        <form id="proc-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Description" className="sm:col-span-2"><TextArea value={form.description || ""} required onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
          <Field label="Test method"><Select value={form.testMethod || "Inquiry"} onChange={(e) => setForm((f) => ({ ...f, testMethod: e.target.value }))} options={["Inquiry", "Observation", "Inspection", "Re-performance"].map((m) => ({ value: m, label: m }))} /></Field>
          <Field label="Result"><Select value={form.result || "Not Tested"} onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))} options={["Pass", "Fail", "N/A", "Not Tested"].map((m) => ({ value: m, label: m }))} /></Field>
          <Field label="Related control">
            <Select value={form.relatedControl || ""} onChange={(e) => setForm((f) => ({ ...f, relatedControl: e.target.value }))} options={[{ value: "", label: "— None —" }, ...controls.map((c) => ({ value: c._id, label: `${c.controlId} — ${c.name}` }))]} />
          </Field>
          <Field label="Tester">
            <Select value={form.tester || ""} onChange={(e) => setForm((f) => ({ ...f, tester: e.target.value }))} options={[{ value: "", label: "— None —" }, ...users.map((u) => ({ value: u.fullName || u.username, label: u.fullName || u.username }))]} />
          </Field>
          <Field label="Tested at"><TextInput type="date" value={form.testedAt || ""} onChange={(e) => setForm((f) => ({ ...f, testedAt: e.target.value }))} /></Field>
        </form>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4) Fieldwork & Evidence
// ---------------------------------------------------------------------------

function EvidenceTab({ engagement }) {
  const procedures = engagement.procedures || [];
  const findings = engagement.findings || [];
  const tested = procedures.filter((p) => p.result !== "Not Tested");
  const passed = procedures.filter((p) => p.result === "Pass").length;
  const failed = procedures.filter((p) => p.result === "Fail").length;
  const evidence = [
    ...procedures.flatMap((p) => (p.evidenceDocumentIds || []).map((e) => ({ doc: e, from: p.procedureId }))),
    ...findings.flatMap((f) => (f.evidenceDocumentIds || []).map((e) => ({ doc: e, from: f.findingId }))),
  ];

  const cards = [
    { label: "Procedures executed", value: tested.length, total: procedures.length },
    { label: "Passed", value: passed, style: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300" },
    { label: "Failed", value: failed, style: "border-red-800/60 bg-red-950/40 text-red-300" },
    { label: "Evidence references", value: evidence.length, style: "border-gold/40 bg-gold/10 text-gold-light" },
  ];

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <div className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${c.style}`}>{c.value}</div>
            <div className="mt-2 text-sm text-neutral-300">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-neutral-200">Evidence references</h2>
          {evidence.length ? (
            <div className="flex flex-col gap-2">
              {evidence.map((e, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-line bg-white/[0.02] px-3 py-2 text-sm">
                  <span className="font-mono text-xs text-gold-light">{e.doc}</span>
                  <span className="text-xs text-neutral-500">{e.from}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No evidence documents referenced yet.</p>
          )}
        </div>
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-neutral-200">Fieldwork summary</h2>
          <div className="flex flex-col gap-2">
            {procedures.map((p) => (
              <div key={p._id} className="rounded-lg border border-line bg-white/[0.02] px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-200">{p.description}</span>
                  <span className={`chip ${p.result === "Pass" ? "border-emerald-800/60 bg-emerald-950/40 text-emerald-300" : p.result === "Fail" ? "border-red-800/60 bg-red-950/40 text-red-300" : "border-neutral-700 bg-neutral-900 text-neutral-500"}`}>{p.result}</span>
                </div>
                <div className="mt-1 text-xs text-neutral-500">{p.testMethod} · {p.tester || "—"} · {fmtDate(p.testedAt)}</div>
              </div>
            ))}
            {!procedures.length && <p className="text-sm text-neutral-500">No procedures yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5) Findings
// ---------------------------------------------------------------------------

function FindingsTab({ engagement, reload }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [controls, setControls] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/controls", { params: { pageSize: 500 } }).then((r) => setControls(r.data.items || []));
  }, []);

  const open = (row) => {
    setForm(
      row
        ? {
            title: row.title,
            severity: row.severity || "Medium",
            description: row.description || "",
            rootCause: row.rootCause || "",
            recommendation: row.recommendation || "",
            relatedControl: row.relatedControl?._id || "",
            managementResponse: row.managementResponse || "",
            status: row.status || "Open",
          }
        : { severity: "Medium", status: "Open" }
    );
    setEditing(row || "new");
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing === "new") await api.post(`/audit/engagements/${engagement._id}/findings`, form);
      else await api.put(`/audit/findings/${editing._id}`, form);
      setEditing(null);
      reload();
    } catch (err) {
      window.alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm("Delete this finding? Linked CAPAs are removed too.")) return;
    await api.delete(`/audit/findings/${row._id}`);
    reload();
  };

  return (
    <div>
      <DataTable
        columns={[
          { key: "findingId", header: "ID" },
          { key: "title", header: "Finding", render: (r) => <span className="font-medium text-neutral-100">{r.title}</span> },
          { key: "severity", header: "Severity", render: (r) => <span className={`chip ${chipClass(r.severity)}`}>{r.severity}</span> },
          { key: "status", header: "Status", render: (r) => <span className={`chip ${chipClass(r.status)}`}>{r.status}</span> },
          { key: "raisedBy", header: "Raised by" },
          { key: "raisedAt", header: "Raised", render: (r) => fmtDate(r.raisedAt) },
        ]}
        rows={engagement.findings || []}
        loading={false}
        emptyHint="No findings raised for this engagement."
        toolbar={<button className="btn-primary" onClick={() => open(null)}><Plus className="h-4 w-4" /> Raise finding</button>}
      />

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === "new" ? "Raise finding" : "Edit finding"} width="max-w-3xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} type="button">Cancel</button>
            <button className="btn-primary" form="finding-form" type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </>
        }
      >
        <form id="finding-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2"><TextInput value={form.title || ""} required onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></Field>
          <Field label="Severity"><Select value={form.severity || "Medium"} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))} options={SEVERITIES.map((s) => ({ value: s, label: s }))} /></Field>
          <Field label="Status"><Select value={form.status || "Open"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} options={["Open", "In Remediation", "Closed"].map((s) => ({ value: s, label: s }))} /></Field>
          <Field label="Related control">
            <Select value={form.relatedControl || ""} onChange={(e) => setForm((f) => ({ ...f, relatedControl: e.target.value }))} options={[{ value: "", label: "— None —" }, ...controls.map((c) => ({ value: c._id, label: `${c.controlId} — ${c.name}` }))]} />
          </Field>
          <Field label="Description" className="sm:col-span-2"><TextArea value={form.description || ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
          <Field label="Root cause"><TextArea value={form.rootCause || ""} onChange={(e) => setForm((f) => ({ ...f, rootCause: e.target.value }))} /></Field>
          <Field label="Recommendation"><TextArea value={form.recommendation || ""} onChange={(e) => setForm((f) => ({ ...f, recommendation: e.target.value }))} /></Field>
          <Field label="Management response" className="sm:col-span-2"><TextArea value={form.managementResponse || ""} onChange={(e) => setForm((f) => ({ ...f, managementResponse: e.target.value }))} /></Field>
        </form>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6) CAPA
// ---------------------------------------------------------------------------

function CapaTab({ engagement, reload }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const open = (row) => {
    setForm(
      row
        ? {
            finding: row.finding?._id || "",
            description: row.description,
            owner: row.owner || "",
            dueDate: fmtDateInput(row.dueDate),
            priority: row.priority || "Medium",
            status: row.status || "Open",
            verificationComments: row.verificationComments || "",
          }
        : { priority: "Medium", status: "Open" }
    );
    setEditing(row || "new");
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      payload.dueDate = payload.dueDate ? new Date(payload.dueDate).toISOString() : undefined;
      if (editing === "new") await api.post(`/audit/engagements/${engagement._id}/capas`, payload);
      else await api.put(`/audit/capas/${editing._id}`, payload);
      setEditing(null);
      reload();
    } catch (err) {
      window.alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm("Delete this CAPA?")) return;
    await api.delete(`/audit/capas/${row._id}`);
    reload();
  };

  const close = async (row) => {
    const verifiedBy = window.prompt("Verifier name (required to close):", "");
    if (!verifiedBy) return;
    const comments = window.prompt("Verification comments:", "") || "";
    try {
      await api.put(`/audit/capas/${row._id}`, { status: "Closed", verifiedBy, verificationComments: comments });
      reload();
    } catch (err) {
      window.alert(err?.response?.data?.message || err.message);
    }
  };

  return (
    <div>
      <DataTable
        columns={[
          { key: "capaId", header: "ID" },
          { key: "description", header: "Corrective action", render: (r) => <span className="font-medium text-neutral-100">{r.description}</span> },
          { key: "finding", header: "Finding", render: (r) => r.finding ? <div><div className="text-xs text-neutral-300">{r.finding.title}</div><div className="text-[10px] text-neutral-500">{r.finding.severity}</div></div> : "—" },
          { key: "priority", header: "Priority", render: (r) => <span className={`chip ${chipClass(r.priority)}`}>{r.priority}</span> },
          { key: "owner", header: "Owner" },
          { key: "dueDate", header: "Due", render: (r) => <span className={new Date(r.dueDate) < new Date() && r.status !== "Closed" ? "text-red-300" : ""}>{fmtDate(r.dueDate)}</span> },
          { key: "status", header: "Status", render: (r) => <span className={`chip ${chipClass(r.status)}`}>{r.status}</span> },
          {
            key: "__actions",
            header: "",
            sortable: false,
            className: "w-24 text-right",
            render: (r) =>
              r.status !== "Closed" && (
                <div className="flex justify-end gap-1">
                  <button className="rounded-md p-1.5 text-neutral-500 transition hover:text-gold" onClick={() => open(r)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                  <button className="rounded-md border border-emerald-800/40 px-2 py-1 text-xs text-emerald-300 transition hover:bg-emerald-950/30" onClick={() => close(r)}>Close</button>
                  <button className="rounded-md p-1.5 text-neutral-500 transition hover:text-red-300" onClick={() => remove(r)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              ),
          },
        ]}
        rows={engagement.capas || []}
        loading={false}
        emptyHint="No corrective actions defined."
        toolbar={<button className="btn-primary" onClick={() => open(null)}><Plus className="h-4 w-4" /> New CAPA</button>}
      />

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === "new" ? "New CAPA" : "Edit CAPA"} width="max-w-3xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} type="button">Cancel</button>
            <button className="btn-primary" form="capa-form" type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </>
        }
      >
        <form id="capa-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Linked finding" className="sm:col-span-2">
            <Select value={form.finding || ""} onChange={(e) => setForm((f) => ({ ...f, finding: e.target.value }))} options={[{ value: "", label: "— Select finding —" }, ...(engagement.findings || []).map((f) => ({ value: f._id, label: `${f.findingId} — ${f.title}` }))]} />
          </Field>
          <Field label="Description" className="sm:col-span-2"><TextArea value={form.description || ""} required onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
          <Field label="Priority"><Select value={form.priority || "Medium"} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} options={SEVERITIES.map((s) => ({ value: s, label: s }))} /></Field>
          <Field label="Status"><Select value={form.status || "Open"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} options={["Open", "In Progress", "Pending Verification", "Closed", "Risk Accepted"].map((s) => ({ value: s, label: s }))} /></Field>
          <Field label="Owner"><TextInput value={form.owner || ""} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} /></Field>
          <Field label="Due date"><TextInput type="date" value={form.dueDate || ""} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} /></Field>
          <Field label="Verification comments" className="sm:col-span-2"><TextArea value={form.verificationComments || ""} onChange={(e) => setForm((f) => ({ ...f, verificationComments: e.target.value }))} /></Field>
        </form>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7) Control & framework mapping
// ---------------------------------------------------------------------------

function MappingTab({ engagement }) {
  const mappedControls = [
    ...(engagement.procedures || []).map((p) => ({ type: "Procedure", ref: p.procedureId, control: p.relatedControl })),
    ...(engagement.findings || []).map((f) => ({ type: "Finding", ref: f.findingId, control: f.relatedControl })),
    ...(engagement.capas || []).map((c) => ({ type: "CAPA", ref: c.capaId, control: c.finding })),
  ].filter((m) => m.control);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-neutral-200">Criteria frameworks</h2>
        {(engagement.criteriaFrameworkIds || []).map((f) => (
          <div key={f._id} className="mb-2 rounded-lg border border-line bg-white/[0.02] px-3 py-2.5 text-sm">
            <div className="font-medium text-neutral-100">{f.name} <span className="text-neutral-500">v{f.version}</span></div>
          </div>
        ))}
        {!engagement.criteriaFrameworkIds?.length && <p className="text-sm text-neutral-500">No frameworks linked.</p>}
      </div>
      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-neutral-200">Linked controls (procedures / findings / CAPAs)</h2>
        {mappedControls.length ? (
          <div className="flex flex-col gap-2">
            {mappedControls.map((m, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-line bg-white/[0.02] px-3 py-2 text-sm">
                <div>
                  <div className="font-medium text-neutral-200">{m.control.name}</div>
                  <div className="text-xs text-neutral-500">{m.control.controlId}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gold-light">{m.type}</div>
                  <div className="text-[10px] text-neutral-500">{m.ref}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No control mappings yet.</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8) Report history
// ---------------------------------------------------------------------------

function ReportsTab({ engagement, reload }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const open = () => {
    setForm({ title: `${engagement.title} — Draft`, executiveSummary: "", includeSections: ["Executive Summary", "Scope", "Findings", "CAPA Plan"] });
    setEditing("new");
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/audit/engagements/${engagement._id}/reports`, form);
      setEditing(null);
      reload();
    } catch (err) {
      window.alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const issue = async (row, status) => {
    try {
      await api.put(`/audit/reports/${row._id}`, { status });
      reload();
    } catch (err) {
      window.alert(err?.response?.data?.message || err.message);
    }
  };

  const view = (row) => {
    const line = (label, v) => `<tr><td style="padding:4px 12px 4px 0;color:#888;font-size:12px">${label}</td><td style="padding:4px 0;font-size:13px">${v || "—"}</td></tr>`;
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>${row.reportId} v${row.version}</title></head>
      <body style="font-family:Segoe UI,Arial,sans-serif;background:#fff;color:#222;padding:32px;max-width:760px;margin:0 auto">
      <h1 style="font-size:20px;border-bottom:2px solid #111;padding-bottom:8px">${row.title}</h1>
      <table style="margin-top:12px">${line("Report ID", row.reportId)}${line("Version", row.version)}${line("Status", row.status)}${line("Issued by", row.issuedBy)}${line("Issued", new Date(row.issuedAt).toLocaleDateString("en-GB"))}</table>
      <h2 style="font-size:15px;margin-top:24px;border-bottom:1px solid #ddd;padding-bottom:6px">Executive summary</h2>
      <div style="white-space:pre-wrap;font-size:13px;line-height:1.6">${(row.executiveSummary || "No summary").replace(/</g, "&lt;")}</div>
      </body></html>`);
    w.document.close();
  };

  return (
    <div>
      <DataTable
        columns={[
          { key: "reportId", header: "Report" },
          { key: "version", header: "Version", render: (r) => <span className="chip border-gold/40 bg-gold/10 text-gold-light">v{r.version}</span> },
          { key: "title", header: "Title", render: (r) => <span className="font-medium text-neutral-100">{r.title}</span> },
          { key: "status", header: "Status", render: (r) => <span className={`chip ${chipClass(r.status)}`}>{r.status}</span> },
          { key: "issuedBy", header: "Issued by" },
          { key: "issuedAt", header: "Issued", render: (r) => fmtDate(r.issuedAt) },
          {
            key: "__actions",
            header: "",
            sortable: false,
            className: "w-32 text-right",
            render: (r) => (
              <div className="flex justify-end gap-1">
                <button className="rounded-md p-1.5 text-neutral-500 transition hover:text-gold" onClick={() => view(r)} aria-label="View"><Eye className="h-4 w-4" /></button>
                {r.status === "Draft" && (
                  <button className="rounded-md border border-emerald-800/40 px-2 py-1 text-xs text-emerald-300 transition hover:bg-emerald-950/30" onClick={() => issue(r, "Issued")}>Issue</button>
                )}
                {r.status === "Issued" && (
                  <button className="rounded-md border border-gold/40 px-2 py-1 text-xs text-gold-light transition hover:bg-gold/10" onClick={() => issue(r, "Final")}>Finalize</button>
                )}
              </div>
            ),
          },
        ]}
        rows={engagement.reports || []}
        loading={false}
        emptyHint="No reports yet — draft the first version."
        toolbar={<button className="btn-primary" onClick={open}><Plus className="h-4 w-4" /> New version</button>}
      />

      <Modal open={editing === "new"} onClose={() => setEditing(null)} title="New report version" width="max-w-2xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} type="button">Cancel</button>
            <button className="btn-primary" form="report-form" type="submit" disabled={saving}>{saving ? "Saving…" : "Create"}</button>
          </>
        }
      >
        <form id="report-form" onSubmit={save} className="grid grid-cols-1 gap-4">
          <Field label="Title"><TextInput value={form.title || ""} required onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></Field>
          <Field label="Executive summary"><TextArea value={form.executiveSummary || ""} onChange={(e) => setForm((f) => ({ ...f, executiveSummary: e.target.value }))} /></Field>
          <Field label="Sections">
            <div className="flex flex-wrap gap-2">
              {["Executive Summary", "Scope", "Methodology", "Findings", "Management Response", "CAPA Plan"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, includeSections: (f.includeSections || []).includes(s) ? f.includeSections.filter((x) => x !== s) : [...(f.includeSections || []), s] }))}
                  className={`chip transition ${form.includeSections?.includes(s) ? "border-gold/60 bg-gold/10 text-gold-light" : "border-neutral-700 bg-neutral-900 text-neutral-400"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>
        </form>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 9) Audit trail
// ---------------------------------------------------------------------------

function TrailTab({ engagement }) {
  return (
    <DataTable
      columns={[
        { key: "at", header: "When", render: (r) => fmtDateTime(r.at) },
        { key: "actor", header: "Actor" },
        { key: "action", header: "Action", render: (r) => <span className="font-mono text-xs text-gold-light">{r.action}</span> },
        { key: "entityLabel", header: "Entity" },
        { key: "details", header: "Details", render: (r) => (r.details ? <pre className="whitespace-pre-wrap font-sans text-xs text-neutral-400">{JSON.stringify(r.details)}</pre> : "—") },
      ]}
      rows={engagement.trail || []}
      loading={false}
      searchable={false}
      emptyHint="No audit trail events recorded yet."
      pageSize={15}
    />
  );
}
