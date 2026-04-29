import type { SocketConnectionStatus } from "../hooks/useSocket";
import type { PublicSocketStatus } from "../hooks/usePublicSocket";

type Status = SocketConnectionStatus | PublicSocketStatus;

const LABELS: Record<string, string> = {
  idle: "Live updates",
  connecting: "Connecting…",
  connected: "Live",
  disconnected: "Reconnecting…",
  reconnecting: "Reconnecting…",
};

export function LiveConnectionBadge({
  status,
  className = "",
}: {
  status: Status;
  className?: string;
}) {
  const label = LABELS[status] ?? "Live updates";
  const ok = status === "connected";
  const warn = status === "disconnected" || status === "reconnecting" || status === "connecting";

  return (
    <span
      role="status"
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        ok
          ? "border-gray-200 bg-gray-50 text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
          : warn
            ? "border-gray-200 bg-gray-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
            : "border-border bg-muted text-muted-foreground"
      } ${className}`}
    >
      {ok ? (
        <span className="relative inline-flex h-3 w-3 flex-none items-center justify-center" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40" />
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-primary/20" />
        </span>
      ) : (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            warn ? "bg-primary animate-pulse" : "bg-muted-foreground"
          }`}
          aria-hidden
        />
      )}
      {label}
    </span>
  );
}
