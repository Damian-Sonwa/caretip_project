import type { SubscriptionStatus } from "../../lib/api";

const STATUS_STYLES: Record<
  SubscriptionStatus,
  { badge: string; dot: string }
> = {
  active: {
    badge: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  trialing: {
    badge: "bg-sky-50 text-sky-800 ring-sky-600/20",
    dot: "bg-sky-500",
  },
  past_due: {
    badge: "bg-amber-50 text-amber-900 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  canceled: {
    badge: "bg-neutral-100 text-neutral-700 ring-neutral-500/20",
    dot: "bg-neutral-400",
  },
  unpaid: {
    badge: "bg-red-50 text-red-800 ring-red-600/20",
    dot: "bg-red-500",
  },
  incomplete: {
    badge: "bg-neutral-100 text-neutral-600 ring-neutral-500/20",
    dot: "bg-neutral-400",
  },
};

export function billingStatusStyles(status: SubscriptionStatus) {
  return STATUS_STYLES[status] ?? STATUS_STYLES.incomplete;
}
