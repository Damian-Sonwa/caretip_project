import type { SocketConnectionStatus } from "../hooks/useSocket";
import type { PublicSocketStatus } from "../hooks/usePublicSocket";

type Status = SocketConnectionStatus | PublicSocketStatus;

const LABELS: Record<string, string> = {
  idle: "Live updates",
  connecting: "Connecting…",
  connected: "Live updates connected",
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        ok
          ? "border-success/40 bg-success/10 text-success-foreground"
          : warn
            ? "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100"
            : "border-border bg-muted text-muted-foreground"
      } ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-success" : warn ? "bg-amber-500 animate-pulse" : "bg-muted-foreground"}`}
        aria-hidden
      />
      {label}
    </span>
  );
}
