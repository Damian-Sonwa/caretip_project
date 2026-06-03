import type { InboxNotification } from "./api";
import { isSupportTicketNotification } from "./api";

export type InboxNavigationRole = "employee" | "business" | "platform_admin" | "admin" | string | undefined;

function normalizePath(url: string): string {
  const path = url.split("?")[0]?.trim() || url;
  if (!path.startsWith("/")) return path;
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

/** Routes that only repeat the default home/overview — not a real deep link from inbox. */
export function isGenericInboxDestination(url: string, role?: InboxNavigationRole): boolean {
  const path = normalizePath(url);
  if (role === "employee") {
    return path === "/employee" || path === "/employee/dashboard";
  }
  if (role === "business") {
    return path === "/dashboard";
  }
  if (role === "platform_admin" || role === "admin") {
    return path === "/platform-admin" || path === "/platform-admin/dashboard";
  }
  return false;
}

/**
 * Actionable in-app route for Open / bell tap. Returns null when the message itself is the destination
 * (e.g. welcome copy) or only points at a generic dashboard overview.
 */
export function resolveInboxNotificationDestination(
  notification: InboxNotification,
  opts: { role?: InboxNavigationRole; isPlatformAdmin?: boolean },
): string | null {
  const ticketId = notification.metadata?.ticketId;
  if (typeof ticketId === "string" && isSupportTicketNotification(notification.type)) {
    const base = opts.isPlatformAdmin ? "/platform-admin/support" : "/dashboard/support";
    return `${base}/${ticketId}`;
  }

  const type = notification.type;
  if (type === "tip_received" || type === "qr_payment_success") {
    if (opts.role === "employee") {
      return "/employee/notifications";
    }
    if (opts.role === "business") {
      return "/dashboard/transactions";
    }
  }

  if (type === "payout_paid" || type === "payout_completed") {
    if (opts.role === "employee") return "/employee/transactions";
    if (opts.role === "business") return "/dashboard/transactions";
  }

  if (type === "employee_invited" && opts.role === "business") {
    return "/dashboard/staff-management";
  }

  const raw = notification.url?.trim();
  if (!raw) return null;
  if (isGenericInboxDestination(raw, opts.role)) return null;
  return raw;
}

export function inboxNotificationHasOpenAction(
  notification: InboxNotification,
  opts: { role?: InboxNavigationRole; isPlatformAdmin?: boolean },
): boolean {
  return resolveInboxNotificationDestination(notification, opts) != null;
}
