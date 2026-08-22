import { useEffect } from "react";
import { useNavigate } from "react-router";

/**
 * This page has been migrated to /controls/management
 * Redirecting to the new Control Management module.
 */
export default function Controls() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/controls/management", { replace: true });
  }, [navigate]);

  return (
    <div className="flex h-64 items-center justify-center">
      <p className="text-neutral-500">Redirecting to Control Management...</p>
    </div>
  );
}

  const openEdit = (row) => {
    setForm(
      row
        ? {
            controlId: row.controlId,
            name: row.name,
            description: row.description || "",
            framework: row.framework?._id || "",
            domain: row.domain || "",
            controlType: row.controlType || "Preventive",
            owner: row.owner || "",
            testingFrequency: row.testingFrequency || "Annually",
            implementationStatus: row.implementationStatus || "Not Implemented",
            maturityLevel: row.maturityLevel || 1,
            lastTestedAt: fmtDateInput(row.lastTestedAt),
            nextTestDueAt: fmtDateInput(row.nextTestDueAt),
          }
        : { controlType: "Preventive", testingFrequency: "Annually", implementationStatus: "Not Implemented", maturityLevel: 1 }
    );
    setEditing(row || "new");
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      payload.lastTestedAt = payload.lastTestedAt ? new Date(payload.lastTestedAt).toISOString() : undefined;
      payload.nextTestDueAt = payload.nextTestDueAt ? new Date(payload.nextTestDueAt).toISOString() : undefined;
      if (editing === "new") await api.post("/compliance/controls", payload);
      else await api.put(`/compliance/controls/${editing._id}`, payload);
      setEditing(null);
      load();
    } catch (err) {
      window.alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete ${row.controlId}? Assessments, gaps, crosswalks, campaign responses and risk mappings for this control are removed too.`)) return;
    await api.delete(`/compliance/controls/${row._id}`);
    load();
  };

  const statsCards = [
    { label: "Total controls", value: stats.total, style: "border-neutral-700 bg-neutral-900 text-neutral-300" },
    { label: "Fully implemented", value: stats.fully, style: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300" },
    { label: "Largely implemented", value: stats.largely, style: "border-sky-800/60 bg-sky-950/40 text-sky-300" },
    { label: "Partially implemented", value: stats.partial, style: "border-amber-800/60 bg-amber-950/40 text-amber-300" },
    { label: "Not implemented", value: stats.none, style: "border-red-800/60 bg-red-950/40 text-red-300" },
    { label: "Test overdue", value: stats.overdue, style: "border-red-800/60 bg-red-950/40 text-red-300" },
  ];

  return (
    <>
      <PageHeader
        title="Controls"
        subtitle="The company-wide control library — mapping, testing and implementation status per framework."
        actions={
          <>
            <Select className="w-44" value={filters.framework} onChange={(e) => setFilters((f) => ({ ...f, framework: e.target.value }))} options={[{ value: "", label: "All frameworks" }, ...frameworks.map((f) => ({ value: f._id, label: f.name }))]} />
            <Select className="w-40" value={filters.domain} onChange={(e) => setFilters((f) => ({ ...f, domain: e.target.value }))} options={[{ value: "", label: "All domains" }, ...[...new Set(rows.map((r) => r.domain).filter(Boolean))].sort().map((d) => ({ value: d, label: d }))]} />
            <Select className="w-44" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} options={[{ value: "", label: "All statuses" }, ...IMPL_STATUSES.map((s) => ({ value: s, label: s }))]} />
            <Select className="w-48" value={filters.hasRisks} onChange={(e) => setFilters((f) => ({ ...f, hasRisks: e.target.value }))} options={[{ value: "", label: "All mappings" }, { value: "false", label: "No risks mapped (over-scope)" }]} />
            <button className="btn-primary" onClick={() => openEdit(null)}><Plus className="h-4 w-4" /> New Control</button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statsCards.map((c) => (
          <div key={c.label} className="card p-3">
            <div className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${c.style}`}>{c.value ?? "—"}</div>
            <div className="mt-1.5 text-[11px] leading-tight text-neutral-400">{c.label}</div>
          </div>
        ))}
      </div>

      {error && !loading ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <DataTable
          columns={[
            { key: "controlId", header: "ID" },
            { key: "name", header: "Control", render: (r) => <span className="font-medium text-neutral-100">{r.name}</span> },
            { key: "framework", header: "Framework", render: (r) => r.framework?.name || "—" },
            { key: "domain", header: "Domain" },
            { key: "controlType", header: "Type", render: (r) => <span className="text-xs">{r.controlType}</span> },
            { key: "owner", header: "Owner" },
            { key: "nextTestDueAt", header: "Next test", render: (r) => <span className={new Date(r.nextTestDueAt) < new Date() ? "text-red-300" : ""}>{fmtDate(r.nextTestDueAt)}</span> },
            { key: "implementationStatus", header: "Implementation", render: (r) => <span className={`chip ${chipClass(r.implementationStatus, IMPL_STYLES)}`}>{r.implementationStatus}</span> },
            { key: "maturityLevel", header: "Maturity", render: (r) => (r.maturityLevel ? <span className="text-xs">{r.maturityLevel}/5</span> : "—") },
          ]}
          rows={rows}
          loading={loading}
          searchPlaceholder="Search controls…"
          emptyHint="No controls match the current filters."
          onRowClick={(r) => navigate(`/controls/${r._id}`)}
        />
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === "new" ? "New control" : `Edit ${form.controlId}`} width="max-w-3xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} type="button">Cancel</button>
            <button className="btn-primary" form="control-form" type="submit" disabled={saving || impactBlocked} title={impactBlocked ? "Confirm the high-impact override first" : undefined}>{saving ? "Saving…" : "Save"}</button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          {editing !== "new" && editing && <ImpactPanel entityType="control" entityId={editing._id} overrideUrl={`/controls/${editing._id}/impact-override`} onChange={(high, confirmed) => setImpactBlocked(high && !confirmed)} />}
        <form id="control-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Control ID"><TextInput value={form.controlId || ""} onChange={(e) => setForm((f) => ({ ...f, controlId: e.target.value }))} placeholder="Auto: CTRL-0000" /></Field>
          <Field label="Framework">
            <Select value={form.framework || ""} onChange={(e) => setForm((f) => ({ ...f, framework: e.target.value }))} options={[{ value: "", label: "— Select —" }, ...frameworks.map((f) => ({ value: f._id, label: f.name }))]} />
          </Field>
          <Field label="Name" className="sm:col-span-2"><TextInput value={form.name || ""} required onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Domain"><TextInput value={form.domain || ""} onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))} placeholder="e.g. Access, Network, Cloud" /></Field>
          <Field label="Control type"><Select value={form.controlType || "Preventive"} onChange={(e) => setForm((f) => ({ ...f, controlType: e.target.value }))} options={CONTROL_TYPES.map((t) => ({ value: t, label: t }))} /></Field>
          <Field label="Owner"><TextInput value={form.owner || ""} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} /></Field>
          <Field label="Testing frequency"><Select value={form.testingFrequency || "Annually"} onChange={(e) => setForm((f) => ({ ...f, testingFrequency: e.target.value }))} options={FREQUENCIES.map((t) => ({ value: t, label: t }))} /></Field>
          <Field label="Implementation status"><Select value={form.implementationStatus || "Not Implemented"} onChange={(e) => setForm((f) => ({ ...f, implementationStatus: e.target.value }))} options={IMPL_STATUSES.map((t) => ({ value: t, label: t }))} /></Field>
          <Field label="Maturity level (1–5)"><TextInput type="number" min={1} max={5} value={form.maturityLevel ?? 1} onChange={(e) => setForm((f) => ({ ...f, maturityLevel: Number(e.target.value) }))} /></Field>
          <Field label="Last tested"><TextInput type="date" value={form.lastTestedAt || ""} onChange={(e) => setForm((f) => ({ ...f, lastTestedAt: e.target.value }))} /></Field>
          <Field label="Next test due"><TextInput type="date" value={form.nextTestDueAt || ""} onChange={(e) => setForm((f) => ({ ...f, nextTestDueAt: e.target.value }))} /></Field>
          <Field label="Description" className="sm:col-span-2"><TextArea value={form.description || ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
        </form>
        </div>
      </Modal>
    </>
  );
}
