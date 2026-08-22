import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  ShieldCheck, Plus, Search, CheckCircle2, Clock, CircleDashed,
  AlertTriangle, Pencil, Trash2, Eye, Link2, BarChart3, Shield,
  Users, Server, FileText, Target,
} from "lucide-react";
import api, { resource } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import { chipClass } from "../../lib/format";

const controls = resource("controls");
const assets = resource("assets");
const frameworks = resource("frameworks");

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
  status: "Inactive / Planned", progress: 0, owner: "", targetAssets: [],
  frameworkMappings: [],
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
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      controls.list({ pageSize: 500 }),
      assets.list({ pageSize: 500 }),
      frameworks.list({ pageSize: 500 }),
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

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return rows.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (categoryFilter && c.category !== categoryFilter) return false;
      if (!t) return true;
      return `${c.controlId || ""} ${c.name} ${c.category || ""} ${c.controlType || ""}`.toLowerCase().includes(t);
    });
  }, [rows, search, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.status === "Active / Implemented").length;
    const progress = rows.filter((r) => r.status === "In Progress / Under Implementation").length;
    const planned = rows.filter((r) => r.status === "Inactive / Planned").length;
    const avgCE = rows.length
      ? Math.round(rows.reduce((a, r) => a + (r.effectiveness?.overall || 0), 0) / rows.length)
      : 0;
    return { total: rows.length, active, progress, planned, avgCE };
  }, [rows]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditing("new"); };
  const openEdit = (row) => {
    setForm({
      ...row,
      targetAssets: row.targetAssets?.map((a) => a._id || a) || [],
      effectiveness: row.effectiveness || { design: 0, operating: 0, coverage: 0, testing: 0 },
    });
    setEditing(row._id);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        effectiveness: {
          ...form.effectiveness,
          overall: Math.round(
            (form.effectiveness.design * 0.25) +
            (form.effectiveness.operating * 0.35) +
            (form.effectiveness.coverage * 0.25) +
            (form.effectiveness.testing * 0.15)
          ),
        },
      };
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

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Controls" value={stats.total} Icon={ShieldCheck} />
        <StatCard label="Active" value={stats.active} Icon={CheckCircle2} />
        <StatCard label="In Progress" value={stats.progress} Icon={Clock} />
        <StatCard label="Planned" value={stats.planned} Icon={CircleDashed} />
        <StatCard label="Avg Effectiveness" value={`${stats.avgCE}%`} Icon={BarChart3} />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            className="input pl-9"
            placeholder="Search controls..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input !w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input !w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3">Control</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Effectiveness</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Assets</th>
              <th className="px-4 py-3">Frameworks</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-neutral-500">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-neutral-500">No controls found.</td></tr>
            ) : (
              filtered.map((c) => {
                const { label, color, Icon } = statusMeta(c.status);
                return (
                  <tr key={c._id} className="border-b border-line/50 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-100">{c.name}</div>
                      <div className="text-xs text-neutral-500">{c.controlId}</div>
                    </td>
                    <td className="px-4 py-3"><span className={`chip ${categoryMeta(c.category)}`}>{c.category}</span></td>
                    <td className="px-4 py-3 text-neutral-300">{c.controlType}</td>
                    <td className="px-4 py-3"><span className={`chip ${color}`}><Icon className="mr-1 inline h-3 w-3" />{label}</span></td>
                    <td className="px-4 py-3 text-neutral-300">{c.effectiveness?.overall ?? "—"}%</td>
                    <td className="px-4 py-3 text-neutral-300">{c.owner || "—"}</td>
                    <td className="px-4 py-3 text-neutral-400">{c.targetAssets?.length || 0}</td>
                    <td className="px-4 py-3 text-neutral-400">{c.frameworkMappings?.length || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="btn-ghost p-1.5" onClick={() => navigate(`/controls/detail/${c._id}`)}><Eye className="h-4 w-4" /></button>
                        <button className="btn-ghost p-1.5" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></button>
                        <button className="btn-ghost p-1.5 text-red-400" onClick={() => remove(c)}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {editing && (
        <Modal title={editing === "new" ? "Create Control" : "Edit Control"} onClose={() => setEditing(null)} wide>
          <form onSubmit={save} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200">Basic Information</h3>
              <Field label="Control Name">
                <TextInput value={form.name} onChange={(e) => updateField("name", e.target.value)} required placeholder="e.g. Multi-Factor Authentication" />
              </Field>
              <Field label="Description">
                <TextArea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={3} placeholder="Describe the control purpose and implementation..." />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Category">
                  <Select value={form.category} onChange={(e) => updateField("category", e.target.value)} options={CATEGORIES} />
                </Field>
                <Field label="Control Type">
                  <Select value={form.controlType} onChange={(e) => updateField("controlType", e.target.value)} options={CONTROL_TYPES} />
                </Field>
                <Field label="Status">
                  <Select value={form.status} onChange={(e) => updateField("status", e.target.value)} options={STATUSES} />
                </Field>
              </div>
              <Field label="Owner">
                <TextInput value={form.owner} onChange={(e) => updateField("owner", e.target.value)} placeholder="e.g. IAM Manager" />
              </Field>
            </div>

            {/* Effectiveness Assessment */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200">Effectiveness Assessment</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Design Effectiveness (%)">
                  <input type="number" min={0} max={100} className="input" value={form.effectiveness.design} onChange={(e) => updateEffectiveness("design", e.target.value)} />
                </Field>
                <Field label="Operating Effectiveness (%)">
                  <input type="number" min={0} max={100} className="input" value={form.effectiveness.operating} onChange={(e) => updateEffectiveness("operating", e.target.value)} />
                </Field>
                <Field label="Coverage (%)">
                  <input type="number" min={0} max={100} className="input" value={form.effectiveness.coverage} onChange={(e) => updateEffectiveness("coverage", e.target.value)} />
                </Field>
                <Field label="Testing Result (%)">
                  <input type="number" min={0} max={100} className="input" value={form.effectiveness.testing} onChange={(e) => updateEffectiveness("testing", e.target.value)} />
                </Field>
              </div>
              <div className="rounded-lg border border-line bg-white/[0.02] p-3">
                <span className="text-xs text-neutral-500">Overall Effectiveness: </span>
                <span className="font-mono text-sm font-semibold text-gold">
                  {Math.round((form.effectiveness.design * 0.25) + (form.effectiveness.operating * 0.35) + (form.effectiveness.coverage * 0.25) + (form.effectiveness.testing * 0.15))}%
                </span>
              </div>
            </div>

            {/* Target Assets */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200">Target Assets</h3>
              <Field label="Select Assets">
                <select multiple className="input h-32" value={form.targetAssets} onChange={(e) => updateField("targetAssets", Array.from(e.target.selectedOptions, (o) => o.value))}>
                  {assetOptions.map((a) => <option key={a._id} value={a._id}>{a.name} ({a.type})</option>)}
                </select>
              </Field>
            </div>

            {/* Framework Mappings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200">Framework Mappings</h3>
              {(form.frameworkMappings || []).map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <select className="input flex-1" value={m.framework} onChange={(e) => {
                    const updated = [...form.frameworkMappings];
                    updated[i] = { ...m, framework: e.target.value };
                    updateField("frameworkMappings", updated);
                  }}>
                    <option value="">Select framework...</option>
                    {frameworkOptions.map((f) => <option key={f._id} value={f.name}>{f.name}</option>)}
                  </select>
                  <input className="input flex-1" placeholder="Requirement (e.g. A.5.17)" value={m.requirement} onChange={(e) => {
                    const updated = [...form.frameworkMappings];
                    updated[i] = { ...m, requirement: e.target.value };
                    updateField("frameworkMappings", updated);
                  }} />
                  <button type="button" className="btn-ghost p-2 text-red-400" onClick={() => updateField("frameworkMappings", form.frameworkMappings.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button type="button" className="btn-ghost text-xs" onClick={() => {
                updateField("frameworkMappings", [...(form.frameworkMappings || []), { framework: "", requirement: "" }]);
              }}>
                <Plus className="mr-1 inline h-3 w-3" /> Add Framework Mapping
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-line pt-4">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Control"}</button>
            </div>
          </form>
        </Modal>
      )}
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
