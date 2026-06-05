import { useMemo, useState } from "react";
import { CareIcon } from "@/components/icons";
import {
  NotificationAlertDialog,
  type NotificationAlertItem,
} from "@/components/ui/notification-alert-dialog";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useNotifications } from "@/app/hooks/useNotifications";
import { useAuth } from "@/app/hooks/useAuth";
import { resolveInboxNotificationDestination } from "@/app/lib/notificationNavigation";
import { cn } from "@/lib/utils";

function formatGroupTime(iso: string, locale: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

function inboxPathForRole(role: string | undefined): string {
  if (role === "employee") return "/employee/inbox";
  if (role === "business") return "/dashboard/notifications";
  if (role === "platform_admin") return "/platform-admin/notifications";
  return "/dashboard/notifications";
}

function unreadSummaryText(count: number, t: TFunction): string {
  if (count === 0) return t("notifications.bell.empty");
  return t("notifications.bell.unreadSummary", {
    count,
    defaultValue: `You have ${count} unread notifications`,
  });
}

type NotificationBellProps = {
  className?: string;
};

export function NotificationBell({ className }: NotificationBellProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, authStatus, authReady } = useAuth();
  const [open, setOpen] = useState(false);
  const role = user?.role;
  const enabled =
    authReady &&
    authStatus === "authenticated" &&
    Boolean(user) &&
    (role === "employee" || role === "business" || role === "platform_admin");

  const {
    unreadCount,
    items,
    loading,
    markRead,
    markAllRead,
  } = useNotifications({ enabled, loadList: open });

  const badge = unreadCount > 0;
  const inboxPath = inboxPathForRole(role);
  const list = items ?? [];

  const alertItems = useMemo((): NotificationAlertItem[] => {
    return list.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      time: formatGroupTime(n.createdAt, i18n.language),
      read: n.read,
    }));
  }, [list, i18n.language]);

  const alertLabels = useMemo(
    () => ({
      title: t("notifications.bell.title"),
      unreadSummary: (count: number) => unreadSummaryText(count, t),
      markAllRead: t("notifications.bell.markAllRead"),
      close: t("notifications.bell.close"),
      viewAll: t("notifications.bell.viewAll"),
      empty: t("notifications.bell.empty"),
      readLabel: t("notifications.bell.read"),
    }),
    [t],
  );

  if (!enabled) return null;

  return (
    <NotificationAlertDialog
      className={className}
      items={alertItems}
      unreadCount={unreadCount}
      loading={loading && list.length === 0}
      labels={alertLabels}
      onOpenChange={setOpen}
      onViewAll={() => {
        setOpen(false);
        navigate(inboxPath);
      }}
      onMarkRead={(id) => void markRead(id)}
      onMarkAllRead={() => void markAllRead()}
      onItemActivate={(id) => {
        const n = list.find((item) => item.id === id);
        const dest = n
          ? resolveInboxNotificationDestination(n, {
              role,
              isPlatformAdmin: role === "platform_admin",
            })
          : null;
        if (dest) navigate(dest);
        setOpen(false);
      }}
      trigger={
        <button
          type="button"
          className={cn(
            "relative inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-xl p-2 transition-colors hover:bg-muted active:opacity-90",
            className,
          )}
          aria-label={
            badge
              ? t("notifications.bell.unreadAria", { count: unreadCount })
              : t("notifications.bell.aria")
          }
        >
          <CareIcon name="notifications" size="md" className="text-foreground" />
          {badge ? (
            <span
              className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-accent-foreground"
              aria-hidden
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      }
    />
  );
}
