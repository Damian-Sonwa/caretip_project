import type { SupportTicketStatus } from "@/app/lib/api";
import { cn } from "@/lib/utils";

export function SupportStatusBadge({ status }: { status: SupportTicketStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        status === "OPEN" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        status === "PENDING" && "bg-amber-500/15 text-amber-800 dark:text-amber-300",
        status === "RESOLVED" && "bg-sky-500/15 text-sky-800 dark:text-sky-300",
        status === "CLOSED" && "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

export function isSupportNotificationType(type: string): boolean {
  return type.startsWith("support_ticket_");
}
