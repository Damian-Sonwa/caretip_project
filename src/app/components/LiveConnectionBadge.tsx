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
          ? "border-green-600/30 bg-green-500/10 text-green-700 dark:text-green-300"
          : warn
            ? "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100"
            : "border-border bg-muted text-muted-foreground"
      } ${className}`}
    >
      {ok ? (
        <span className="relative inline-flex h-3 w-3 flex-none items-center justify-center" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-50" />
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-600 ring-2 ring-green-600/20" />
        </span>
      ) : (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            warn ? "bg-amber-500 animate-pulse" : "bg-muted-foreground"
          }`}
          aria-hidden
        />
      )}
      {label}
    </span>
  );
}
