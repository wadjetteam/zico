import api from "../api/client";

export const EFFECTIVENESS_OPTIONS = ["Not Assessed", "Effective", "Partially Effective", "Ineffective"];
export const LINK_TYPES = ["existing", "proposed", "mitigating"];

export const effectivenessChipClass = (e) =>
  e === "Effective"
    ? "border-emerald-800/60 bg-emerald-950/40 text-emerald-300"
    : e === "Partially Effective"
    ? "border-amber-800/60 bg-amber-950/40 text-amber-300"
    : e === "Ineffective"
    ? "border-red-800/60 bg-red-950/40 text-red-300"
    : "border-neutral-700 bg-neutral-900 text-neutral-400";

export const controlsToSelection = (items = []) =>
  items
    .filter((l) => l.control)
    .map((l) => ({
      control_id: l.control._id,
      link_type: l.link_type || "existing",
      effectiveness: l.effectiveness || "Not Assessed",
      testedEffectiveness: l.testedEffectiveness ?? null,
      testedEffectivenessSource: l.testedEffectivenessSource ?? null,
      control: l.control,
    }));

export const syncRiskLinks = async (riskId, selected = []) => {
  const { items } = await api.get(`/risks/${riskId}/controls`).then((r) => r.data);
  const existing = new Map(items.map((l) => [l.control._id, l]));
  for (const sel of selected) {
    const cur = existing.get(sel.control_id);
    const payload = {
      link_type: sel.link_type || "existing",
      effectiveness: sel.effectiveness || "Not Assessed",
      testedEffectiveness: sel.testedEffectiveness ?? null,
      testedEffectivenessSource: sel.testedEffectivenessSource ?? null,
    };
    if (cur) {
      if (cur.link_type !== payload.link_type || cur.effectiveness !== payload.effectiveness || cur.testedEffectiveness !== payload.testedEffectiveness || cur.testedEffectivenessSource !== payload.testedEffectivenessSource) {
        await api.put(`/risk-control-links/${cur._id}`, payload);
      }
    } else {
      await api.post("/risk-control-links", {
        risk_id: riskId,
        control_id: sel.control_id,
        ...payload,
      });
    }
  }
  for (const [cid, link] of existing) {
    if (!selected.some((s) => s.control_id === cid)) {
      await api.delete(`/risk-control-links/${link._id}`);
    }
  }
};