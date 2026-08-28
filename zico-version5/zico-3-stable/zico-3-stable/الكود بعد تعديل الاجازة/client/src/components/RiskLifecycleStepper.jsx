import { Link, useLocation } from "react-router";
import { withRiskParam } from "../lib/riskLifecycle";

const STEPS = [
  { key: "view", label: "Identify", path: "/risk/view" },
  { key: "scoring", label: "Assess", path: "/risk/scoring" },
  { key: "treatment", label: "Treat", path: "/risk/treatment" },
  { key: "reviews", label: "Review", path: "/risk/reviews" },
  { key: "poam", label: "POAM", path: "/risk/poam" },
  { key: "close", label: "Close", path: "/risk/close" },
];

export default function RiskLifecycleStepper({ current, riskId }) {
  const { search } = useLocation();
  const currentIndex = STEPS.findIndex((step) => step.key === current);
  const activeKey = currentIndex >= 0 ? STEPS[currentIndex].key : "view";

  const buildHref = (path) => {
    const next = new URLSearchParams(search || "");
    next.delete("riskId");
    const base = withRiskParam(path, riskId);
    const extra = next.toString();
    return extra ? `${base}&${extra}` : base;
  };

  return (
    <div className="rounded-2xl border border-gold/20 bg-gradient-to-r from-ink to-ink-deep p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-500">ISO 27005 lifecycle</span>
        <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-gold">
          {current ? STEPS[currentIndex]?.label || "Identify" : "Identify"}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {STEPS.map((step, index) => {
          const isCurrent = step.key === activeKey;
          const isComplete = currentIndex > index;
          const href = buildHref(step.path);

          return (
            <div key={step.key} className="flex items-center gap-2">
              <Link
                to={href}
                className={`group inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] transition-all ${
                  isCurrent
                    ? "border-gold bg-gold/12 text-gold shadow-[0_0_0_1px_rgba(212,175,55,0.2)]"
                    : isComplete
                      ? "border-emerald-800/60 bg-emerald-950/35 text-emerald-300"
                      : "border-line bg-white/[0.02] text-neutral-500 hover:border-gold/40 hover:text-neutral-200"
                }`}
                title={step.label}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold ${isCurrent ? "bg-gold text-ink" : isComplete ? "bg-emerald-500 text-ink" : "bg-neutral-800 text-neutral-400"}`}>
                  {index + 1}
                </span>
                {step.label}
              </Link>
              {index < STEPS.length - 1 && (
                <span className="h-px w-4 bg-gradient-to-r from-gold/60 to-transparent" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
