import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, Boxes, Building2, ChevronRight, FolderTree, GitBranch, Landmark, Layers,
  Link2, Loader2, MapPin, Network, Pencil, ShieldCheck, Tag, UserRound, Users,
} from "lucide-react";
import api from "../../api/client";
import { ErrorState, LoadingState } from "../../components/States";
import Modal from "../../components/Modal";
import { Field, Select, TextArea, TextInput } from "../../components/Field";
import { chipClass, fmtDate } from "../../lib/format";
import { orgTypeChip } from "./Organizations";

const TABS = [
  { key: "details", label: "Details", icon: Building2 },
  { key: "hierarchy", label: "Hierarchy", icon: GitBranch },
  { key: "records", label: "Linked Records", icon: Link2 },
];

function OrgTree({ nodes, depth = 0 }) {
  return (
    <div className="space-y-1">
      {nodes.map((n) => (
        <div key={n._id}>
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${depth === 0 ? "bg-gold/10" : "bg-white/[0.03]"}`}>
            <span className="text-neutral-600">{depth === 0 ? <Landmark className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}</span>
            <span className={depth === 0 ? "font-semibold text-gold-light" : "font-medium text-neutral-200"}>{n.name}</span>
            <span className={orgTypeChip(n.type || "parent")}>{n.type || "parent"}</span>
            {n.orgId && <span className="font-mono text-[11px] text-neutral-600">{n.orgId}</span>}
            <span className="ml-auto text-[11px] text-neutral-600">{n.region || ""}</span>
          </div>
          {n.children?.length > 0 && (
            <div className="ml-5 border-l border-line pl-4 pt-1">
              <OrgTree nodes={n.children} depth={depth + 1} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function OrganizationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("details");
  const [hierarchy, setHierarchy] = useState(null);
  const [rollup, setRollup] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get(`/organizations/${id}`).then((r) => r.data),
      api.get(`/context/organizations/${id}/hierarchy`).then((r) => r.data),
      api.get(`/context/organizations/${id}/rollup`).then((r) => r.data),
    ])
      .then(([o, h, r]) => {
        setOrg(o);
        setHierarchy(h);
        setRollup(r);
      })
      .catch((e) => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (loading || !org) return <LoadingState label="Loading organization…" />;

  return (
    <div>
      <div className="flex items-start gap-3">
        <button onClick={() => navigate(-1)} className="mt-1 rounded-lg border border-line p-2 text-neutral-400 transition hover:text-gold" title="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="heading text-2xl font-semibold text-neutral-100">{org.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
            {orgTypeChip(org.type || "parent")}
            {org.orgId && <span className="font-mono text-[11px] text-neutral-600">{org.orgId}</span>}
            {org.parentOrg?.name && <span>under {org.parentOrg.name}</span>}
            <span className={chipClass(org.status, { active: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300", inactive: "border-neutral-700 bg-neutral-900 text-neutral-400" })}>{org.status}</span>
            <span>Created {fmtDate(org.createdAt)}</span>
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
        {tab === "details" && <DetailsTab org={org} reload={load} />}
        {tab === "hierarchy" && (
          <section className="card overflow-hidden">
            <div className="border-b border-line bg-white/[0.02] px-5 py-4">
              <h2 className="heading text-sm font-semibold text-neutral-100">Organization hierarchy</h2>
              <p className="mt-0.5 text-xs text-neutral-500">Parent chain plus all descendants of this entity.</p>
            </div>
            <div className="p-5">
              <OrgTree nodes={[hierarchy?.tree].filter(Boolean)} />
            </div>
          </section>
        )}
        {tab === "records" && <LinkedRecordsTab counts={rollup?.counts} />}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 border-b border-line/60 py-3 last:border-0">
      <Icon className="mt-0.5 h-4 w-4 text-gold/70" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-neutral-600">{label}</p>
        <p className="mt-0.5 whitespace-pre-line text-sm text-neutral-200">{value || "—"}</p>
      </div>
    </div>
  );
}

function DetailsTab({ org, reload }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/organizations").then((r) => setOrgs(r.data.items.filter((o) => o._id !== org._id)));
  }, [org._id]);

  const startEdit = () => {
    setForm({
      orgId: org.orgId || "",
      name: org.name,
      type: org.type || "parent",
      parentOrg: org.parentOrg?._id || "",
      region: org.region || "",
      industry: org.industry || "",
      regulatoryFramework: org.regulatoryFramework || "",
      applicableRegulations: (org.applicableRegulations || []).join("\n"),
      description: org.description || "",
      address: org.address || "",
      primaryContact: org.primaryContact || "",
      status: org.status,
    });
    setEditing(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/organizations/${org._id}`, {
        ...form,
        applicableRegulations: form.applicableRegulations.split("\n").map((s) => s.trim()).filter(Boolean),
      });
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
          <h2 className="heading text-sm font-semibold text-neutral-100">Organization details</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Master data for the context container.</p>
        </div>
        <button className="btn-ghost px-3 py-1.5" onClick={startEdit}>
          <Pencil className="h-4 w-4" /> Edit
        </button>
      </div>
      <div className="grid grid-cols-1 gap-x-8 px-5 py-2 md:grid-cols-2">
        <div>
          <InfoRow icon={Building2} label="Name" value={org.name} />
          <InfoRow icon={Tag} label="Org ID" value={org.orgId} />
          <InfoRow icon={Network} label="Type" value={org.type} />
          <InfoRow icon={GitBranch} label="Parent organization" value={org.parentOrg?.name} />
          <InfoRow icon={MapPin} label="Region" value={org.region} />
          <InfoRow icon={Building2} label="Industry" value={org.industry} />
        </div>
        <div>
          <InfoRow icon={ShieldCheck} label="Regulatory framework" value={org.regulatoryFramework} />
          <InfoRow icon={Layers} label="Applicable regulations" value={(org.applicableRegulations || []).join("\n")} />
          <InfoRow icon={UserRound} label="Primary contact" value={org.primaryContact} />
          <InfoRow icon={MapPin} label="Address" value={org.address} />
          <InfoRow icon={ShieldCheck} label="Status" value={org.status} />
          <InfoRow icon={ShieldCheck} label="Description" value={org.description} />
        </div>
      </div>

      {editing && (
        <ModalWrapper open={editing} onClose={() => setEditing(false)} saving={saving} onSubmit={save} org={org}>
          <form id="org-detail-form" onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Name" className="sm:col-span-2">
              <TextInput value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
            </Field>
            <Field label="Org ID">
              <TextInput value={form.orgId} onChange={(e) => setForm((s) => ({ ...s, orgId: e.target.value }))} />
            </Field>
            <Field label="Type">
              <Select value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))} options={["parent", "subsidiary", "business-unit", "branch"]} />
            </Field>
            <Field label="Parent organization">
              <select className="input" value={form.parentOrg} onChange={(e) => setForm((s) => ({ ...s, parentOrg: e.target.value }))}>
                <option value="" className="bg-ink-deep">— No parent (root) —</option>
                {orgs.map((o) => (
                  <option key={o._id} value={o._id} className="bg-ink-deep">{o.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} options={["active", "inactive"]} />
            </Field>
            <Field label="Region">
              <TextInput value={form.region} onChange={(e) => setForm((s) => ({ ...s, region: e.target.value }))} />
            </Field>
            <Field label="Industry">
              <TextInput value={form.industry} onChange={(e) => setForm((s) => ({ ...s, industry: e.target.value }))} />
            </Field>
            <Field label="Primary contact">
              <TextInput value={form.primaryContact} onChange={(e) => setForm((s) => ({ ...s, primaryContact: e.target.value }))} />
            </Field>
            <Field label="Regulatory framework" className="sm:col-span-2">
              <TextInput value={form.regulatoryFramework} onChange={(e) => setForm((s) => ({ ...s, regulatoryFramework: e.target.value }))} />
            </Field>
            <Field label="Applicable regulations" hint="One per line" className="sm:col-span-3">
              <TextArea rows={3} value={form.applicableRegulations} onChange={(e) => setForm((s) => ({ ...s, applicableRegulations: e.target.value }))} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <TextInput value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
            </Field>
            <Field label="Description" className="sm:col-span-3">
              <TextArea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
            </Field>
          </form>
        </ModalWrapper>
      )}
    </section>
  );
}

function ModalWrapper({ open, onClose, saving, onSubmit, org, children }) {
  return (
    <Modal open={open} onClose={onClose} title="Edit organization" subtitle="Changes propagate to everything attached to this entity." width="max-w-3xl"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} type="button" disabled={saving}>Cancel</button>
          <button className="btn-primary" form="org-detail-form" type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }>
      {children}
    </Modal>
  );
}

const RECORD_LINKS = [
  { key: "subOrganizations", label: "Sub-organizations", path: "/context/organizations", icon: GitBranch, accent: "bg-violet-950/40 text-violet-300" },
  { key: "domains", label: "Domains", path: "/context/domains", icon: FolderTree, accent: "bg-gold/10 text-gold" },
  { key: "assets", label: "Assets", path: "/assets/manage", icon: Boxes, accent: "bg-sky-950/40 text-sky-300" },
  { key: "risks", label: "Risks", path: "/risk/view", icon: ShieldCheck, accent: "bg-red-950/40 text-red-300" },
  { key: "parameters", label: "Scoring parameters", path: "/context/parameters", icon: Layers, accent: "bg-emerald-950/40 text-emerald-300" },
  { key: "groups", label: "Groups", path: "/context/groups", icon: Users, accent: "bg-indigo-950/40 text-indigo-300" },
  { key: "memberships", label: "Group memberships", path: "/context/groups", icon: UserRound, accent: "bg-amber-950/40 text-amber-300" },
];

function LinkedRecordsTab({ counts }) {
  const navigate = useNavigate();
  if (!counts) return <LoadingState label="Counting linked records…" />;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {RECORD_LINKS.map((r) => {
        const Icon = r.icon;
        const value = counts[r.key] ?? 0;
        return (
          <button key={r.key} onClick={() => navigate(r.path)} className="card flex items-center gap-4 px-5 py-4 text-left transition hover:border-gold/40">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${r.accent}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="heading text-2xl font-semibold text-neutral-100">{value}</p>
              <p className="text-xs text-neutral-500">{r.label}</p>
            </div>
            <ChevronRight className="ml-auto h-4 w-4 text-neutral-600" />
          </button>
        );
      })}
    </div>
  );
}
