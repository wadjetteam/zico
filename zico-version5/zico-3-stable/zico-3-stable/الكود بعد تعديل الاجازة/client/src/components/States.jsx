import { AlertTriangle, Inbox, Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading data…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-neutral-500">
      <Loader2 className="h-6 w-6 animate-spin text-gold" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ title = "Nothing here yet", hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full border border-line bg-ink-deep">
        <Inbox className="h-5 w-5 text-gold/70" />
      </div>
      <p className="heading text-base text-neutral-200">{title}</p>
      {hint && <p className="max-w-sm text-sm text-neutral-500">{hint}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <AlertTriangle className="h-6 w-6 text-red-400" />
      <p className="text-sm text-neutral-400">{message}</p>
      {onRetry && (
        <button className="btn-ghost" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
