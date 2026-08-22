import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Link2, Loader2, Unlink } from "lucide-react";
import { resource } from "../../../api/client";
import Modal from "../../../components/Modal";
import { Field, Select } from "../../../components/Field";
import { POLICY_STATUS_STYLES, fmtDateTime, orDash } from "../../../lib/policy";

const api = resource("policies");

function PolicyNode({ node, depth, expanded, onToggle, onOpen }) {
  const hasChildren = node.children && node.children.length > 0;
  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-gold/5"
        style={{ paddingLeft: `${8 + depth * 20}px` }}
      >
        {hasChildren ? (
          <button onClick={() => onToggle(node._id)} className="rounded p-0.5 text-neutral-500 transition hover:text-gold">
            {expanded.has(node._id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <span className={`font-mono text-xs ${depth === 0 ? "text-gold" : "text-neutral-500"}`}>{node.policyId}</span>
        <button onClick={() => onOpen(node._id)} className="text-sm font-medium text-neutral-100 transition hover:text-gold">
          {node.title}
        </button>
        <span className={`chip ${POLICY_STATUS_STYLES[node.status]}`}>{node.status}</span>
        <span className="font-mono text-[11px] text-neutral-500">v{node.version}</span>
        {depth === 0 && <span className="chip border-gold/50 bg-gold/10 text-gold">Root</span>}
      </div>
      {hasChildren && expanded.has(node._id) && (
        <div>
          {node.children.map((c) => (
            <PolicyNode key={c._id} node={c} depth={depth + 1} expanded={expanded} onToggle={onToggle} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HierarchyTab({ policy, reload }) {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const [setOpen, setSetOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [parentOptions, setParentOptions] = useState([]);
  const [childOptions, setChildOptions] = useState([]);
  const [parentId, setParentId] = useState("");
  const [childId, setChildId] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await api.get(`${policy._id}/hierarchy`);
    setTree(Array.isArray(d) ? d : d.items || []);
    setExpanded(new Set((Array.isArray(d) ? d : d.items || []).map((n) => n._id)));
    setLoading(false);
  }, [policy._id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!setOpen && !linkOpen) return;
    api.list().then((d) => {
      const all = d.items;
      setParentOptions(all.filter((p) => p._id !== policy._id && p.status === "Published"));
      setChildOptions(all.filter((p) => p._id !== policy._id && !p.parentPolicy));
    });
  }, [setOpen, linkOpen, policy._id]);

  const toggle = useCallback((id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const open = (id) => {
    if (id !== policy._id) window.location.href = `/governance/policies/${id}`;
  };

  const saveParent = async (e) => {
    e.preventDefault();
    if (!parentId) return;
    setBusy(true);
    try {
      await api.update(`${policy._id}/hierarchy`, { parentPolicy: parentId });
      setSetOpen(false);
      setParentId("");
      load();
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveChild = async (e) => {
    e.preventDefault();
    if (!childId) return;
    setBusy(true);
    try {
      await api.update(`${childId}/hierarchy`, { parentPolicy: policy._id });
      setLinkOpen(false);
      setChildId("");
      load();
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  const unlink = async () => {
    if (!policy.parentPolicy || !window.confirm("Detach this policy from its parent?")) return;
    setBusy(true);
    try {
      await api.remove(`${policy._id}/hierarchy`);
      load();
      reload();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  const statusOf = useMemo(() => new Set(tree.map((n) => n._id)), [tree]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="label">Policy Hierarchy</p>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => setSetOpen(true)}>
            <Link2 className="h-4 w-4" /> Set Parent Policy
          </button>
          <button className="btn-ghost" onClick={() => setLinkOpen(true)}>
            <Link2 className="h-4 w-4" /> Link Policy as Child
          </button>
        </div>
      </div>

      <div className="card mb-4 flex flex-wrap items-center gap-3 px-4 py-3">
        <span className="text-sm text-neutral-400">Parent policy:</span>
        {policy.parentPolicy ? (
          <>
            <span className="font-mono text-xs text-gold">{policy.parentPolicy.policyId}</span>
            <span className="text-sm text-neutral-100">{policy.parentPolicy.title}</span>
            <span className={`chip ${POLICY_STATUS_STYLES[policy.parentPolicy.status]}`}>{policy.parentPolicy.status}</span>
            <span className="text-[11px] text-neutral-500">{fmtDateTime(policy.parentPolicy.updatedAt)}</span>
            <button onClick={unlink} className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-neutral-500 transition hover:bg-red-950/40 hover:text-red-300" disabled={busy}>
              <Unlink className="h-3.5 w-3.5" /> Detach
            </button>
          </>
        ) : (
          <span className="text-sm text-neutral-600">None — this policy is a root policy.</span>
        )}
      </div>

      {loading ? (
        <div className="card flex items-center justify-center gap-2 py-16 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading hierarchy”¦
        </div>
      ) : tree.length === 0 ? (
        <div className="card py-16 text-center text-sm text-neutral-500">
          No hierarchy defined yet. Set a parent or link child policies to build a tree.
        </div>
      ) : (
        <div className="card divide-y divide-neutral-800/60">
          {tree.map((n) => (
            <PolicyNode key={n._id} node={n} depth={0} expanded={expanded} onToggle={toggle} onOpen={open} />
          ))}
        </div>
      )}

      {!statusOf.has(policy._id) && (
        <p className="mt-3 text-[11px] text-neutral-600">
          Note: this policy is linked in another hierarchy — open it directly to manage its tree.
        </p>
      )}

      <Modal open={setOpen} onClose={() => !busy && setSetOpen(false)} title="Set Parent Policy" width="max-w-md"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setSetOpen(false)} type="button" disabled={busy}>Cancel</button>
            <button className="btn-primary" form="parent-form" type="submit" disabled={busy || !parentId}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Set Parent
            </button>
          </>
        }
      >
        <form id="parent-form" onSubmit={saveParent} className="grid grid-cols-1 gap-4">
          <Field label="Published policy to use as parent *">
            <Select value={parentId} onChange={(e) => setParentId(e.target.value)} options={[{ value: "", label: "— Select policy —" }, ...parentOptions.map((p) => ({ value: p._id, label: `${p.policyId} — ${p.title}` }))]} />
          </Field>
          <p className="text-[11px] text-neutral-600">Only published policies can become parents.</p>
        </form>
      </Modal>

      <Modal open={linkOpen} onClose={() => !busy && setLinkOpen(false)} title="Link Policy as Child" width="max-w-md"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setLinkOpen(false)} type="button" disabled={busy}>Cancel</button>
            <button className="btn-primary" form="child-form" type="submit" disabled={busy || !childId}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Link Child
            </button>
          </>
        }
      >
        <form id="child-form" onSubmit={saveChild} className="grid grid-cols-1 gap-4">
          <Field label="Root policy to attach *">
            <Select value={childId} onChange={(e) => setChildId(e.target.value)} options={[{ value: "", label: "— Select policy —" }, ...childOptions.map((p) => ({ value: p._id, label: `${p.policyId} — ${p.title}` }))]} />
          </Field>
          <p className="text-[11px] text-neutral-600">Only root policies (no parent yet) can be attached.</p>
        </form>
      </Modal>
    </div>
  );
}
