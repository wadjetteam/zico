import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, FileDown, Link2, Loader2, Plus, ShieldAlert, ShieldCheck, ShieldOff, Trash2, XCircle } from "lucide-react";
import axiosApi, { resource } from "../../../api/client";
import DataTable from "../../../components/DataTable";
import Modal from "../../../components/Modal";
import { Field, Select, TextArea, TextInput } from "../../../components/Field";
import { fmtDateTime, orDash } from "../../../lib/policy";

const api = resource("policies");
const risksApi = resource("risks");

const EMPTY_EXCEPTION = { exceptionType: "", reason: "", requestedChange: "", requestedExpiryDate: "" };
const EMPTY_ATTESTATION = { attester: "", statement: "" };

export default function AttestationsTab({ policy }) {
  const [attestations, setAttestations] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [exceptionTypes, setExceptionTypes] = useState([]);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [excOpen, setExcOpen] = useState(false);
  const [attOpen, setAttOpen] = useState(false);
  const [excForm, setExcForm] = useState(EMPTY_EXCEPTION);
  const [attForm, setAttForm] = useState(EMPTY_ATTESTATION);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState("");
  const [verifyResults, setVerifyResults] = useState({});
  const [bindOpen, setBindOpen] = useState(false);
  const [bindTarget, setBindTarget] = useState(null);
  const [bindRiskId, setBindRiskId] = useState("");
  const [waiveOpen, setWaiveOpen] = useState(false);
  const [waiveTarget, setWaiveTarget] = useState(null);
  const [waiveJust, setWaiveJust] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [a, e, t, r] = await Promise.all([
      api.get(`${policy._id}/attestations`),
      api.get(`${policy._id}/exceptions`),
      resource("governance/exception-types").list({}),
      risksApi.list({}),
    ]);
    setAttestations(a.items);
    setExceptions(e.items);
    setExceptionTypes(t.items);
    setRisks(r.items);
    setLoading(false);
  }, [policy._id]);

  useEffect(() => {
    load();
  }, [load]);

  // Max selectable expiry = today + the chosen type's max duration.
  const selectedType = useMemo(
    () => exceptionTypes.find((t) => String(t._id) === String(excForm.exceptionType)),
    [exceptionTypes, excForm.exceptionType]
  );
  const maxExpiryDate = useMemo(() => {
    if (!selectedType?.maxDurationDays) return "";
    const d = new Date();
    d.setDate(d.getDate() + Number(selectedType.maxDurationDays));
    return d.toISOString().slice(0, 10);
  }, [selectedType]);

  const saveAttestation = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.create(`${policy._id}/attestations`, attForm);
      setAttForm(EMPTY_ATTESTATION);
      setAttOpen(false);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveException = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.create(`${policy._id}/exceptions`, excForm);
      setExcForm(EMPTY_EXCEPTION);
      setExcOpen(false);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteException = async (ex) => {
    if (!window.confirm("Delete this exception request?")) return;
    await api.remove(`${policy._id}/exceptions/${ex._id}`);
    load();
  };

  const deleteAttestation = async (at) => {
    if (!window.confirm("Delete this attestation?")) return;
    await api.remove(`${policy._id}/attestations/${at._id}`);
    load();
  };

  const downloadSnapshot = async (at) => {
    try {
      const res = await axiosApi.get(`/attestations/${at._id}/snapshot`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `policy-attestation-${at._id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  const verifySnapshot = async (at) => {
    setVerifying(at._id);
    try {
      const v = await axiosApi.get(`/attestations/${at._id}/verify`).then((r) => r.data);
      setVerifyResults((s) => ({
        ...s,
        [at._id]: { ok: v.snapshotStatus === "available" && v.isVerified, legacy: v.snapshotStatus === "legacy_unavailable", hash: v.snapshotHash },
      }));
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setVerifying("");
    }
  };

  const copyHash = (hash) => {
    navigator.clipboard?.writeText(hash || "");
  };

  const bindRisk = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.create(`${policy._id}/exceptions/${bindTarget._id}/bind-risk`, { riskId: bindRiskId });
      setBindOpen(false);
      setBindRiskId("");
      setBindTarget(null);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const waiveBinding = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.create(`${policy._id}/exceptions/${waiveTarget._id}/waive-risk-binding`, { justification: waiveJust.trim() });
      setWaiveOpen(false);
      setWaiveJust("");
      setWaiveTarget(null);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const setExceptionStatus = async (ex, status) => {
    try {
      if (status === "Rejected") {
        const comment = window.prompt("Comment (required) for rejecting this exception:");
        if (comment === null) return;
        if (!String(comment || "").trim()) return alert("A comment is required when rejecting.");
        await api.update(`${policy._id}/exceptions/${ex._id}`, { status, comment });
      } else {
        await api.update(`${policy._id}/exceptions/${ex._id}`, { status });
      }
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  const bindingChip = (ex) => {
    const styles = {
      bound: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
      waived: "border-amber-800/60 bg-amber-950/40 text-amber-300",
      unbound: "border-red-800/60 bg-red-950/40 text-red-300",
    };
    const label = { bound: "Bound to risk", waived: "Waived", unbound: "Unbound" };
    return <span className={`chip ${styles[ex.riskBindingStatus] || styles.unbound}`}>{label[ex.riskBindingStatus] || "Unbound"}</span>;
  };

  const exceptionChip = (status) => {
    const styles = {
      Pending: "border-amber-800/60 bg-amber-950/40 text-amber-300",
      Approved: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
      Rejected: "border-red-800/60 bg-red-950/40 text-red-300",
    };
    return <span className={`chip ${styles[status] || "border-amber-800/60 bg-amber-950/40 text-amber-300"}`}>{status}</span>;
  };

  return (
    <div>
      <section className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="label">Attestations ({attestations.length})</p>
          <button className="btn-primary" onClick={() => setAttOpen(true)}>
            <Plus className="h-4 w-4" /> Record Attestation
          </button>
        </div>
        <DataTable
          columns={[
            { key: "attester", header: "Attester", render: (r) => <span className="font-medium text-neutral-100">{orDash(r.attester)}</span> },
            { key: "statement", header: "Statement", render: (r) => <span className="max-w-[340px] text-neutral-400">{orDash(r.statement)}</span> },
            {
              key: "policyVersion",
              header: "Policy version",
              render: (r) => (
                <span className="whitespace-nowrap">
                  <span className="font-mono text-xs">v{r.policyVersion || "—"}</span>
                  {r.attestedOnPreviousVersion ? (
                    <span className="chip ml-1.5 border-amber-800/60 bg-amber-950/40 text-amber-300" title="Attested against an older version of this policy">Previous version</span>
                  ) : null}
                </span>
              ),
            },
            {
              key: "snapshot",
              header: "Snapshot evidence",
              render: (r) => {
                if (r.snapshotStatus === "legacy_unavailable") {
                  return <span className="chip border-neutral-800 bg-neutral-900/60 text-neutral-500" title="Recorded before snapshot capture existed — not verifiable against a frozen copy">Legacy — no snapshot</span>;
                }
                const v = verifyResults[r._id];
                return (
                  <span className="flex flex-wrap items-center gap-2">
                    <button className="btn-ghost border-gold/30 px-2 py-1 text-[11px]" onClick={() => downloadSnapshot(r)} title="Download the immutable PDF snapshot of the exact attested version">
                      <FileDown className="h-3.5 w-3.5" /> PDF
                    </button>
                    <span className="font-mono text-[11px] text-neutral-500" title={r.contentHash || ""}>
                      {String(r.contentHash || "").slice(0, 10)}…
                      <button className="ml-1 align-middle text-neutral-600 hover:text-neutral-300" onClick={() => copyHash(r.contentHash)} title="Copy full hash">
                        <Copy className="h-3 w-3" />
                      </button>
                    </span>
                    {v ? (
                      v.legacy ? (
                        <span className="chip border-neutral-800 bg-neutral-900/60 text-neutral-500">Legacy</span>
                      ) : v.ok ? (
                        <span className="chip border-emerald-800/60 bg-emerald-950/40 text-emerald-300"><ShieldCheck className="h-3 w-3" /> Verified</span>
                      ) : (
                        <span className="chip border-red-800/60 bg-red-950/40 text-red-300"><ShieldAlert className="h-3 w-3" /> Not verified</span>
                      )
                    ) : (
                      <button className="btn-ghost px-2 py-1 text-[11px]" onClick={() => verifySnapshot(r)} disabled={verifying === r._id}>
                        {verifying === r._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />} Verify
                      </button>
                    )}
                  </span>
                );
              },
            },
            { key: "createdAt", header: "Attested at", render: (r) => <span className="whitespace-nowrap text-neutral-400">{fmtDateTime(r.createdAt)}</span> },
            {
              key: "__a",
              header: "",
              sortable: false,
              className: "w-14 text-right",
              render: (r) => (
                <button onClick={() => deleteAttestation(r)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-red-950/40 hover:text-red-300" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              ),
            },
          ]}
          rows={attestations}
          loading={loading}
          searchable={false}
          emptyHint="No attestations recorded for this policy."
        />
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="label">Exceptions ({exceptions.length})</p>
          <button className="btn-primary" onClick={() => setExcOpen(true)}>
            <Plus className="h-4 w-4" /> Request Exception
          </button>
        </div>
        <DataTable
          columns={[
            {
              key: "exceptionType",
              header: "Type",
              render: (r) =>
                r.exceptionType ? (
                  <span className="chip border-gold/30 bg-gold/5 text-[10px] text-gold-light">{r.exceptionType.name}</span>
                ) : (
                  <span className="text-neutral-600">—</span>
                ),
            },
            { key: "reason", header: "Reason", render: (r) => <span className="max-w-[240px] font-medium text-neutral-100">{orDash(r.reason)}</span> },
            { key: "requestedChange", header: "Requested change", render: (r) => <span className="max-w-[240px] text-neutral-400">{orDash(r.requestedChange)}</span> },
            { key: "requestedExpiryDate", header: "Expires", render: (r) => <span className="whitespace-nowrap text-neutral-400">{r.requestedExpiryDate ? new Date(r.requestedExpiryDate).toLocaleDateString("en-GB") : "—"}</span> },
            { key: "requestedBy", header: "Requested by", render: (r) => <span className="whitespace-nowrap text-neutral-300">{orDash(r.requestedBy)}</span> },
            { key: "status", header: "Status", render: (r) => exceptionChip(r.status) },
            {
              key: "riskBinding",
              header: "Risk binding",
              render: (r) => (
                <span className="flex flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {bindingChip(r)}
                    {r.risk ? <span className="max-w-[160px] truncate text-xs text-neutral-300" title={`${r.risk.riskId} — ${r.risk.title}`}>{r.risk.title}</span> : null}
                  </span>
                  {r.riskBindingStatus === "unbound" && r.status !== "Approved" ? (
                    <span className="text-[11px] text-red-400">Cannot be approved until bound or waived</span>
                  ) : null}
                </span>
              ),
            },
            { key: "createdAt", header: "Requested at", render: (r) => <span className="whitespace-nowrap text-neutral-400">{fmtDateTime(r.createdAt)}</span> },
            {
              key: "__actions",
              header: "Actions",
              sortable: false,
              className: "w-40 text-right",
              render: (r) => {
                if (r.status === "Approved" || r.status === "Rejected" || r.status === "Expired") {
                  return (
                    <span className="flex items-center justify-end gap-1">
                      <button onClick={() => deleteException(r)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-red-950/40 hover:text-red-300" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </span>
                  );
                }
                return (
                  <span className="flex items-center justify-end gap-1">
                    <button
                      className="rounded-md p-1.5 text-emerald-400 transition hover:bg-emerald-950/40 disabled:cursor-not-allowed disabled:text-neutral-700"
                      title={r.riskBindingStatus === "unbound" ? "Bind the exception to a risk (or waive the binding) before approving" : "Approve exception"}
                      disabled={r.riskBindingStatus === "unbound"}
                      onClick={() => setExceptionStatus(r, "Approved")}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                    <button className="rounded-md p-1.5 text-red-400 transition hover:bg-red-950/40" title="Reject (comment required)" onClick={() => setExceptionStatus(r, "Rejected")}>
                      <XCircle className="h-4 w-4" />
                    </button>
                    <button className="rounded-md p-1.5 text-sky-400 transition hover:bg-sky-950/40" title="Bind to an existing risk" onClick={() => { setBindTarget(r); setBindOpen(true); }}>
                      <Link2 className="h-4 w-4" />
                    </button>
                    <button className="rounded-md p-1.5 text-amber-400 transition hover:bg-amber-950/40" title="Waive risk binding (CISO/CRO only, justification required)" onClick={() => { setWaiveTarget(r); setWaiveOpen(true); }}>
                      <ShieldOff className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteException(r)} className="rounded-md p-1.5 text-neutral-500 transition hover:bg-red-950/40 hover:text-red-300" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </span>
                );
              },
            },
          ]}
          rows={exceptions}
          loading={loading}
          searchable={false}
          emptyHint="No exception requests for this policy."
        />
      </section>

      <Modal open={attOpen} onClose={() => !saving && setAttOpen(false)} title="Record Attestation" width="max-w-md"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setAttOpen(false)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="att-form" type="submit" disabled={saving || !attForm.attester}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Record
            </button>
          </>
        }
      >
        <form id="att-form" onSubmit={saveAttestation} className="grid grid-cols-1 gap-4">
          <Field label="Attester *">
            <TextInput value={attForm.attester} onChange={(e) => setAttForm((s) => ({ ...s, attester: e.target.value }))} required placeholder="Name or role" />
          </Field>
          <Field label="Statement">
            <TextArea value={attForm.statement} onChange={(e) => setAttForm((s) => ({ ...s, statement: e.target.value }))} placeholder='e.g. "I have read and understand this policy”¦"' />
          </Field>
        </form>
      </Modal>

      <Modal open={excOpen} onClose={() => !saving && setExcOpen(false)} title="Request Exception" width="max-w-lg"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setExcOpen(false)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="exc-form" type="submit" disabled={saving || !excForm.exceptionType || !excForm.reason || !excForm.requestedChange}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Request Exception
            </button>
          </>
        }
      >
        <form id="exc-form" onSubmit={saveException} className="grid grid-cols-1 gap-4">
          <Field label="Exception type *" hint="Types and their approval rules are configured in Governance → Define Exceptions.">
            <Select
              value={excForm.exceptionType}
              onChange={(e) => setExcForm((s) => ({ ...s, exceptionType: e.target.value }))}
              options={[{ value: "", label: "— Select exception type —" }, ...exceptionTypes.filter((t) => t.status === "Active").map((t) => ({ value: t._id, label: t.name }))]}
            />
          </Field>
          <Field label="Reason *">
            <TextArea value={excForm.reason} onChange={(e) => setExcForm((s) => ({ ...s, reason: e.target.value }))} required placeholder="Why the deviation is needed…" />
          </Field>
          <Field label="Requested change *">
            <TextArea value={excForm.requestedChange} onChange={(e) => setExcForm((s) => ({ ...s, requestedChange: e.target.value }))} required placeholder="What the policy will say instead…" />
          </Field>
          <Field label="Requested expiry date" hint={selectedType ? `This type allows a maximum of ${selectedType.maxDurationDays} days from today (${maxExpiryDate}).` : "Pick an exception type to see the allowed date range."}>
            <TextInput
              type="date"
              value={excForm.requestedExpiryDate}
              max={maxExpiryDate}
              onChange={(e) => setExcForm((s) => ({ ...s, requestedExpiryDate: e.target.value }))}
            />
          </Field>
        </form>
      </Modal>

      <Modal open={bindOpen} onClose={() => !saving && setBindOpen(false)} title="Bind Exception to a Risk" width="max-w-md"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setBindOpen(false)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="bind-form" type="submit" disabled={saving || !bindRiskId}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Bind Risk
            </button>
          </>
        }
      >
        <form id="bind-form" onSubmit={bindRisk} className="grid grid-cols-1 gap-4">
          <p className="text-sm text-neutral-400">
            The exception can only be approved once it is bound to a documented risk (ISO 27001 6.1.3(e)).
          </p>
          <Field label="Risk *">
            <Select
              value={bindRiskId}
              onChange={(e) => setBindRiskId(e.target.value)}
              options={[{ value: "", label: "— Select a risk —" }, ...risks.map((r) => ({ value: r._id, label: `${r.riskId} — ${r.title} (${r.severityLevel})` }))]}
            />
          </Field>
        </form>
      </Modal>

      <Modal open={waiveOpen} onClose={() => !saving && setWaiveOpen(false)} title="Waive Risk Binding" width="max-w-md"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setWaiveOpen(false)} type="button" disabled={saving}>Cancel</button>
            <button className="btn-primary" form="waive-form" type="submit" disabled={saving || waiveJust.trim().length < 30}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Waive Binding
            </button>
          </>
        }
      >
        <form id="waive-form" onSubmit={waiveBinding} className="grid grid-cols-1 gap-4">
          <p className="text-sm text-neutral-400">
            CISO / CRO only. Waiving the risk binding is an audited decision — a written justification of at least 30 characters is required.
          </p>
          <Field label="Justification (min 30 characters) *">
            <TextArea value={waiveJust} onChange={(e) => setWaiveJust(e.target.value)} required rows={4} placeholder="Why this deviation does not require a bound risk…" />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
