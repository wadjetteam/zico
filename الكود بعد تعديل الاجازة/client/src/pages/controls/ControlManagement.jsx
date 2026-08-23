import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  ShieldCheck, Plus, Search, CheckCircle2, Clock, CircleDashed,
  Pencil, Trash2, Eye, BarChart3, X, Filter, RotateCcw,
  Users, Server, Target, ChevronDown, ChevronUp,
} from "lucide-react";
import api, { resource } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import { chipClass } from "../../lib/format";

const controls = resource("controls");
const assetsApi = resource("assets");
const frameworksApi = resource("frameworks");

const CONTROL_TYPES = ["Preventive", "Detective", "Corrective"];
const CATEGORIES = ["Technical", "Administrative", "Physical"];
const STATUSES = ["Active / Implemented", "In Progress / Under Implementation", "Inactive / Planned"];

const statusMeta = (status) => {
  if (status === "Active / Implemented")
    return { label: "Active", color: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300", Icon: CheckCircle2 };
  if (status === "In Progress / Under Implementation")
    return { label: "In Progress", color: "border-amber-800/60 bg-amber-950/40 text-amber-300", Icon: Clock };
  return { label: "Planned", color: "border-neutral-700 bg-neutral-900 text-neutral-400", Icon: CircleDashed };
};

const categoryMeta = (category) => {
  const map = {
    Technical: "border-sky-800/60 bg-sky-950/40 text-sky-300",
    Administrative: "border-gold/30 bg-gold/5 text-gold-light",
    Physical: "border-neutral-700 bg-neutral-900 text-neutral-400",
  };
  return map[category] || map.Technical;
};

const EMPTY_FORM = {
  name: "", description: "", category: "Technical", controlType: "Preventive",
  status: "Inactive / Planned", progress: 0, owner: "", controlId: "",
  targetAssets: [], frameworkMappings: [],
  effectiveness: { design: 0, operating: 0, coverage: 0, testing: 0 },
};

export default function ControlManagement() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [assetOptions, setAssetOptions] = useState([]);
  const [frameworkOptions, setFrameworkOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [frameworkFilter, setFrameworkFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [detailView, setDetailView] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      controls.list({ pageSize: 500 }),
      assetsApi.list({ pageSize: 500 }),
      frameworksApi.list({ pageSize: 500 }),
    ])
      .then(([c, a, f]) => {
        setRows(c.items || []);
        setAssetOptions(a.items || []);
        setFrameworkOptions(f.items || []);
      })
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeFilterCount = [statusFilter, categoryFilter, typeFilter, frameworkFilter, ownerFilter].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter(""); setCategoryFilter(""); setTypeFilter("");
    setFrameworkFilter(""); setOwnerFilter("");
  };

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    let result = rows.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (categoryFilter && c.category !== categoryFilter) return false;
      if (typeFilter && c.controlType !== typeFilter) return false;
      if (frameworkFilter && !c.frameworkMappings?.some((m) => m.framework?.name === frameworkFilter)) return false;
      if (ownerFilter && c.owner !== ownerFilter) return false;
      if (!t) return true;
      return `${c.controlId || ""} ${c.name} ${c.description || ""} ${c.owner || ""}`.toLowerCase().includes(t);
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key] ?? "";
        let bVal = b[sortConfig.key] ?? "";
        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [rows, search, statusFilter, categoryFilter, typeFilter, frameworkFilter, ownerFilter, sortConfig]);

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.status === "Active / Implemented").length;
    const progress = rows.filter((r) => r.status === "In Progress / Under Implementation").length;
    const planned = rows.filter((r) => r.status === "Inactive / Planned").length;
    const avgProgress = rows.length ? Math.round(rows.reduce((a, r) => a + (r.progress || 0), 0) / rows.length) : 0;
    return { total: rows.length, active, progress, planned, avgProgress };
  }, [rows]);

  const uniqueOwners = useMemo(() => [...new Set(rows.map((r) => r.owner).filter(Boolean))].sort(), [rows]);
  const uniqueFrameworks = useMemo(() => [...new Set(rows.flatMap((r) => (r.frameworkMappings || []).map((m) => m.framework?.name).filter(Boolean)))].sort(), [rows]);

  const requestSort = (key) => {
    setSortConfig((prev) => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }));
  };

  const openCreate = () => { setForm({ ...EMPTY_FORM, controlId: `CTL-${String(rows.length + 1).padStart(3, "0")}` }); setEditing("new"); };
  const openEdit = (row) => {
    setForm({
      ...row,
      targetAssets: row.targetAssets?.map((a) => (typeof a === "object" ? a._id : a)) || [],
      effectiveness: row.effectiveness || { design: 0, operating: 0, coverage: 0, testing: 0 },
      frameworkMappings: row.frameworkMappings || [],
    });
    setEditing(row._id);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const overall = Math.round(
        (form.effectiveness.design * 0.25) + (form.effectiveness.operating * 0.35) +
        (form.effectiveness.coverage * 0.25) + (form.effectiveness.testing * 0.15)
      );
      const payload = { ...form, effectiveness: { ...form.effectiveness, overall } };
      if (editing === "new") await controls.create(payload);
      else await controls.update(editing, payload);
      setEditing(null);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete control "${row.name}"?`)) return;
    try { await controls.remove(row._id); load(); }
    catch (err) { alert(err?.response?.data?.message || err.message); }
  };

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const updateEffectiveness = (field, value) =>
    setForm((f) => ({ ...f, effectiveness: { ...f.effectiveness, [field]: Number(value) || 0 } }));

  const handleStatusChange = (status) => {
    setForm((f) => ({
      ...f,
      status,
      progress: status === "Active / Implemented" ? 100 : status === "Inactive / Planned" ? 0 : f.progress || 50,
    }));
  };

  const handleProgressChange = (progress) => {
    let status = form.status;
    if (progress === 0) status = "Inactive / Planned";
    else if (progress === 100) status = "Active / Implemented";
    else status = "In Progress / Under Implementation";
    setForm((f) => ({ ...f, progress, status }));
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ChevronDown className="h-3 w-3 opacity-30" />;
    return sortConfig.direction === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  return (
    <>
      <PageHeader
        title="Control Management"
        subtitle="Centralized control library — design, assess, and map controls to risks and frameworks."
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New Control
          </button>
        }
      />

      {/* KPI Dashboard */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total Controls" value={stats.total} Icon={ShieldCheck} />
        <StatCard label="Active" value={stats.active} Icon={CheckCircle2} />
        <StatCard label="In Progress" value={stats.progress} Icon={Clock} />
        <StatCard label="Planned" value={stats.planned} Icon={CircleDashed} />
        <StatCard label="Avg Progress" value={`${stats.avgProgress}%`} Icon={BarChart3} />
      </div>

      {/* Search & Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              className="input pl-9"
              placeholder="Search by ID, name, description, or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-ghost" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-1 inline h-4 w-4" />
            Filters
            {activeFilterCount > 0 && <span className="ml-1 rounded-full bg-gold px-1.5 text-xs text-ink">{activeFilterCount}</span>}
          </button>
          {activeFilterCount > 0 && (
            <button className="btn-ghost text-xs" onClick={clearFilters}>
              <RotateCcw className="mr-1 inline h-3 w-3" /> Clear ({activeFilterCount})
            </button>
          )}
          <span className="text-xs text-neutral-500">{filtered.length} of {rows.length} controls</span>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-white/[0.02] p-3">
            <select className="input !w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="input !w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="input !w-auto" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All types</option>
              {CONTROL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="input !w-auto" value={frameworkFilter} onChange={(e) => setFrameworkFilter(e.target.value)}>
              <option value="">All frameworks</option>
              {uniqueFrameworks.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <select className="input !w-auto" value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
              <option value="">All owners</option>
              {uniqueOwners.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wider text-neutral-500">
              {[
                { key: "controlId", label: "ID" },
                { key: "name", label: "Name" },
                { key: "category", label: "Category" },
                { key: "controlType", label: "Type" },
                { key: "status", label: "Status" },
                { key: "progress", label: "Progress" },
                { key: "owner", label: "Owner" },
              ].map((col) => (
                <th key={col.key} className="cursor-pointer px-4 py-3 hover:text-neutral-300" onClick={() => requestSort(col.key)}>
                  <div className="flex items-center gap-1">{col.label}<SortIcon column={col.key} /></div>
                </th>
              ))}
              <th className="px-4 py-3">Assets</th>
              <th className="px-4 py-3">Frameworks</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-neutral-500">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-neutral-500">No controls found matching your criteria.</td></tr>
            ) : (
              filtered.map((c) => {
                const { label, color, Icon } = statusMeta(c.status);
                return (
                  <tr key={c._id} className="border-b border-line/50 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-xs text-gold">{c.controlId}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-100">{c.name}</div>
                      <div className="max-w-xs truncate text-xs text-neutral-500">{c.description}</div>
                    </td>
                    <td className="px-4 py-3"><span className={`chip ${categoryMeta(c.category)}`}>{c.category}</span></td>
                    <td className="px-4 py-3 text-neutral-300">{c.controlType}</td>
                    <td className="px-4 py-3"><span className={`chip ${color}`}><Icon className="mr-1 inline h-3 w-3" />{label}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-neutral-800">
                          <div className="h-2 rounded-full bg-gold" style={{ width: `${c.progress}%` }} />
                        </div>
                        <span className="text-xs text-neutral-400">{c.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-300">{c.owner || "—"}</td>
                    <td className="px-4 py-3 text-neutral-400">{c.targetAssets?.length || 0}</td>
                    <td className="px-4 py-3 text-neutral-400">{c.frameworkMappings?.length || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="btn-ghost p-1.5" onClick={() => setDetailView(c)} title="View details"><Eye className="h-4 w-4" /></button>
                        <button className="btn-ghost p-1.5" onClick={() => openEdit(c)} title="Edit"><Pencil className="h-4 w-4" /></button>
                        <button className="btn-ghost p-1.5 text-red-400" onClick={() => remove(c)} title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Drawer */}
      <Modal open={editing !== null} title={editing === "new" ? "Create Control" : "Edit Control"} onClose={() => setEditing(null)} wide>
          <form onSubmit={save} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200">Basic Information</h3>
              {editing === "new" && (
                <Field label="Control ID">
                  <TextInput value={form.controlId} onChange={(e) => updateField("controlId", e.target.value)} required placeholder="e.g. CTL-001" />
                </Field>
              )}
              <Field label="Control Name">
                <TextInput value={form.name} onChange={(e) => updateField("name", e.target.value)} required placeholder="e.g. Multi-Factor Authentication" />
              </Field>
              <Field label="Description">
                <TextArea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={3} placeholder="Describe the control purpose and implementation..." />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Category">
                  <Select value={form.category} onChange={(e) => updateField("category", e.target.value)} options={CATEGORIES} required />
                </Field>
                <Field label="Control Type">
                  <Select value={form.controlType} onChange={(e) => updateField("controlType", e.target.value)} options={CONTROL_TYPES} />
                </Field>
                <Field label="Status">
                  <Select value={form.status} onChange={(e) => handleStatusChange(e.target.value)} options={STATUSES} required />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Owner">
                  <TextInput value={form.owner} onChange={(e) => updateField("owner", e.target.value)} required placeholder="e.g. IAM Manager" />
                </Field>
                <Field label="Progress (%)">
                  <input type="number" min={0} max={100} className="input" value={form.progress} onChange={(e) => handleProgressChange(Number(e.target.value))} />
                </Field>
              </div>
              {form.status === "In Progress / Under Implementation" && (
                <p className="text-xs text-amber-400">Status is automatically set based on progress: 0% = Planned, 1-99% = In Progress, 100% = Active</p>
              )}
            </div>


            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200">Target Assets</h3>
              <div className="flex flex-wrap gap-2">
                {assetOptions.map((a) => {
                  const selected = form.targetAssets.includes(a._id);
                  return (
                    <button
                      key={a._id}
                      type="button"
                      className={`chip ${selected ? "border-gold/50 bg-gold/10 text-gold" : "border-line bg-white/[0.03] text-neutral-400"}`}
                      onClick={() => updateField("targetAssets", selected ? form.targetAssets.filter((id) => id !== a._id) : [...form.targetAssets, a._id])}
                    >
                      {a.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200">Framework Mappings</h3>
              {(form.frameworkMappings || []).map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <select className="input flex-1" value={m.framework?._id || m.framework || ""} onChange={(e) => {
                    const updated = [...(form.frameworkMappings || [])];
                    const fw = frameworkOptions.find((f) => f._id === e.target.value);
                    updated[i] = { ...m, framework: fw ? { _id: fw._id, name: fw.name } : e.target.value };
                    updateField("frameworkMappings", updated);
                  }}>
                    <option value="">Select framework...</option>
                    {frameworkOptions.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
                  </select>
                  <input className="input flex-1" placeholder="Requirement (e.g. A.5.17)" value={m.requirement || m.annexCode || ""} onChange={(e) => {
                    const updated = [...(form.frameworkMappings || [])];
                    updated[i] = { ...m, requirement: e.target.value };
                    updateField("frameworkMappings", updated);
                  }} />
                  <button type="button" className="btn-ghost p-2 text-red-400" onClick={() => updateField("frameworkMappings", (form.frameworkMappings || []).filter((_, idx) => idx !== i))}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button type="button" className="btn-ghost text-xs" onClick={() => updateField("frameworkMappings", [...(form.frameworkMappings || []), { framework: "", requirement: "" }])}>
                <Plus className="mr-1 inline h-3 w-3" /> Add Framework Mapping
              </button>
            </div>

            <div className="flex justify-end gap-3 border-t border-line pt-4">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Control"}
              </button>
            </div>
          </form>
      </Modal>

      {/* Detail View Drawer */}
      <Modal open={detailView !== null} title={detailView ? `Control Details — ${detailView.controlId}` : "Control Details"} onClose={() => setDetailView(null)} wide>
        {detailView && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><span className="text-xs text-neutral-500">Name</span><p className="font-medium text-neutral-100">{detailView.name}</p></div>
              <div><span className="text-xs text-neutral-500">Category</span><p><span className={`chip ${categoryMeta(detailView.category)}`}>{detailView.category}</span></p></div>
              <div><span className="text-xs text-neutral-500">Type</span><p className="text-neutral-300">{detailView.controlType}</p></div>
              <div><span className="text-xs text-neutral-500">Status</span><span className={`chip ${statusMeta(detailView.status).color}`}>{detailView.status}</span></div>
              <div><span className="text-xs text-neutral-500">Owner</span><p className="text-neutral-300">{detailView.owner || "—"}</p></div>
              <div><span className="text-xs text-neutral-500">Progress</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 rounded-full bg-neutral-800"><div className="h-2 rounded-full bg-gold" style={{ width: `${detailView.progress}%` }} /></div>
                  <span className="text-sm text-neutral-300">{detailView.progress}%</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-neutral-200">Target Assets ({detailView.targetAssets?.length || 0})</h4>
              <div className="flex flex-wrap gap-2">
                {(detailView.targetAssets || []).map((a) => {
                  const asset = typeof a === "object" ? a : assetOptions.find((ao) => ao._id === a);
                  return <span key={typeof a === "string" ? a : a._id} className="chip border-line bg-white/[0.03] text-neutral-300">{asset?.name || a}</span>;
                })}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-neutral-200">Framework Mappings ({detailView.frameworkMappings?.length || 0})</h4>
              <div className="space-y-2">
                {(detailView.frameworkMappings || []).map((m, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-line p-2">
                    <span className="chip border-gold/30 bg-gold/5 text-gold-light">{m.framework?.name || m.framework}</span>
                    <span className="text-sm text-neutral-300">{m.requirement || m.annexCode}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-line pt-4">
              <button className="btn-ghost" onClick={() => setDetailView(null)}>Close</button>
              <button className="btn-primary" onClick={() => { setDetailView(null); openEdit(detailView); }}>Edit Control</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function StatCard({ label, value, Icon }) {
  return (
    <div className="card flex items-center gap-4 px-5 py-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="heading text-2xl font-semibold text-neutral-100">{value}</p>
        <p className="text-xs text-neutral-500">{label}</p>
      </div>
    </div>
  );
}
