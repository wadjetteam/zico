import { Fragment } from "react";
import { Check, GitBranch } from "lucide-react";

/**
 * stages: [{ key, label }] in lifecycle order.
 * actions: [{ key, label }] — allowed next steps (buttons).
 */
export default function LifecycleStepper({ stages, current, actions = [], onAction, hint }) {
  const idx = Math.max(0, stages.findIndex((s) => s.key === current));
  const terminal = !stages.some((s) => s.key === current);

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-white/[0.02] px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold">
          <GitBranch className="h-4 w-4" />
        </div>
        <div>
          <h2 className="heading text-sm font-semibold text-neutral-100">Lifecycle</h2>
          {hint && <p className="mt-0.5 text-xs text-neutral-500">{hint}</p>}
        </div>
      </div>

      <div className="overflow-x-auto px-5 py-5">
        <div className="flex min-w-max items-center gap-1">
          {stages.map((s, i) => {
            const done = !terminal && i < idx;
            const active = !terminal && i === idx;
            return (
              <Fragment key={s.key}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition ${
                      done
                        ? "border-emerald-700 bg-emerald-950/50 text-emerald-300"
                        : active
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-neutral-700 bg-neutral-900 text-neutral-500"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className={`text-[11px] font-medium ${
                      active ? "text-gold" : done ? "text-neutral-300" : "text-neutral-600"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < stages.length - 1 && (
                  <div className={`mx-1 h-px w-8 sm:w-14 ${done || active ? "bg-emerald-800/70" : "bg-neutral-800"}`} />
                )}
              </Fragment>
            );
          })}
        </div>
      </div>

      {actions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line bg-white/[0.02] px-5 py-3">
          <span className="text-xs text-neutral-500">Move to:</span>
          {actions.map((a) => (
            <button key={a.key} onClick={() => onAction(a.key)} className="btn-primary px-3 py-1.5 text-xs">
              {a.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
