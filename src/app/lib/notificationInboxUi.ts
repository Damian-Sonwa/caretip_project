import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  Coins,
  CreditCard,
  Lock,
  Megaphone,
  MessageSquare,
  QrCode,
  ShieldCheck,
  Star,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import type { InboxNotification } from "./api";
import type { NotificationCategory } from "./notificationNavigation";
import { getNotificationCategory } from "./notificationNavigation";

export type InboxDateBucket = "today" | "yesterday" | "thisWeek" | "earlier";

export type InboxCategoryFilter = "all" | "unread" | NotificationCategory;

const CATEGORY_STYLE: Record<
  NotificationCategory,
  { icon: LucideIcon; iconClass: string; bgClass: string }
> = {
  tips: { icon: Coins, iconClass: "text-emerald-600", bgClass: "bg-emerald-500/12" },
  payouts: { icon: Wallet, iconClass: "text-sky-600", bgClass: "bg-sky-500/12" },
  team: { icon: Users, iconClass: "text-violet-600", bgClass: "bg-violet-500/12" },
  feedback: { icon: Star, iconClass: "text-amber-600", bgClass: "bg-amber-500/12" },
  goals: { icon: Target, iconClass: "text-orange-600", bgClass: "bg-orange-500/12" },
  billing: { icon: CreditCard, iconClass: "text-indigo-600", bgClass: "bg-indigo-500/12" },
  verification: { icon: ShieldCheck, iconClass: "text-teal-600", bgClass: "bg-teal-500/12" },
  security: { icon: Lock, iconClass: "text-rose-600", bgClass: "bg-rose-500/12" },
  support: { icon: MessageSquare, iconClass: "text-blue-600", bgClass: "bg-blue-500/12" },
  announcement: { icon: Megaphone, iconClass: "text-primary", bgClass: "bg-primary/12" },
  system: { icon: Bell, iconClass: "text-muted-foreground", bgClass: "bg-muted" },
  activity: { icon: QrCode, iconClass: "text-primary", bgClass: "bg-primary/10" },
};

export function getNotificationCategoryStyle(category: NotificationCategory) {
  return CATEGORY_STYLE[category] ?? { icon: Activity, iconClass: "text-muted-foreground", bgClass: "bg-muted" };
}

export function getNotificationDateBucket(iso: string, now = new Date()): InboxDateBucket {
  const d = new Date(iso);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  if (d >= startOfToday) return "today";
  if (d >= startOfYesterday) return "yesterday";
  if (d >= startOfWeek) return "thisWeek";
  return "earlier";
}

const BUCKET_ORDER: InboxDateBucket[] = ["today", "yesterday", "thisWeek", "earlier"];

export function groupNotificationsByDate(
  items: InboxNotification[],
): { bucket: InboxDateBucket; items: InboxNotification[] }[] {
  const map = new Map<InboxDateBucket, InboxNotification[]>();
  for (const item of items) {
    const bucket = getNotificationDateBucket(item.createdAt);
    const arr = map.get(bucket) ?? [];
    arr.push(item);
    map.set(bucket, arr);
  }
  return BUCKET_ORDER.filter((b) => map.has(b)).map((bucket) => ({
    bucket,
    items: map.get(bucket)!,
  }));
}

export function filterInboxNotifications(
  items: InboxNotification[],
  categoryFilter: InboxCategoryFilter,
): InboxNotification[] {
  if (categoryFilter === "all") return items;
  if (categoryFilter === "unread") return items.filter((n) => !n.read);
  return items.filter((n) => getNotificationCategory(n) === categoryFilter);
}

/** Primary filter chips shown in the inbox header. */
export const INBOX_FILTER_CHIPS: InboxCategoryFilter[] = [
  "all",
  "unread",
  "tips",
  "team",
  "security",
  "support",
  "system",
];
