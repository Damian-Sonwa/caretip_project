import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import {
  Gift,
  TrendingUp,
  Star,
  Sparkles,
  Check,
  ArrowRight,
  Heart,
} from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { businessUi } from "@/app/components/business/businessDashboardUi";

interface Notification {
  id: string;
  type: "renewal" | "trial" | "promo" | "alert" | "success";
  title: string;
  message: string;
  date: string;
  read: boolean;
  actionLabel?: string;
  actionUrl?: string;
  icon: typeof Gift;
  color: string;
  bgColor: string;
}

const NOTIFICATION_IDS = ["1", "2", "3", "4", "5", "6"] as const;

export function NotificationsPage() {
  const { t, i18n } = useTranslation();
  const notificationsData = useMemo<Notification[]>(
    () =>
      NOTIFICATION_IDS.map((id, index) => {
        const icons = [Gift, Heart, Check, Star, Sparkles, TrendingUp] as const;
        const types = ["promo", "success", "success", "promo", "alert", "success"] as const;
        const reads = [false, false, true, true, true, true] as const;
        const dates = ["2026-03-17", "2026-03-15", "2026-03-01", "2026-02-28", "2026-02-20", "2025-12-15"];
        const actionUrls = [
          "/business/qr-management",
          "/dashboard/transactions",
          "/dashboard/transactions",
          "/dashboard/staff-management",
          "/dashboard/settings?section=notifications",
          undefined,
        ] as const;
        const withAction = index < 5;
        return {
          id,
          type: types[index],
          title: t(`business.notifications.items.${id}.title`),
          message: t(`business.notifications.items.${id}.message`),
          date: dates[index],
          read: reads[index],
          actionLabel: withAction ? t(`business.notifications.items.${id}.action`) : undefined,
          actionUrl: actionUrls[index],
          icon: icons[index],
          color: "text-primary",
          bgColor: index === 4 ? "bg-accent/10" : "bg-gray-50",
        };
      }),
    [t, i18n.resolvedLanguage],
  );

  const [notifications, setNotifications] = useState<Notification[]>(notificationsData);

  useEffect(() => {
    setNotifications(notificationsData);
  }, [notificationsData]);

  const [filter, setFilter] = useState<"all" | "unread" | "promo">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "promo") return n.type === "promo";
    return true;
  });

  const filterLabel = (f: typeof filter) => {
    if (f === "all") return t("business.notifications.filterAll");
    if (f === "unread") return t("business.notifications.filterUnread");
    return t("business.notifications.filterPromo");
  };

  return (
    <main className={cn(businessUi.page, businessUi.pageShell, "overflow-x-hidden")}>
      <div className={businessUi.pageInner}>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-semibold text-foreground sm:text-3xl">{t("business.notifications.title")}</h1>
          <p className={businessUi.cardDesc}>{t("business.notifications.subtitle")}</p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            {t("business.notifications.markAllRead")}
          </button>
        )}
      </div>

      <div className={cn(businessUi.periodToggle, "mb-6 w-full sm:w-fit")} role="group" aria-label={t("business.notifications.title")}>
        {(["all", "unread", "promo"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              businessUi.periodBtn,
              filter === f ? businessUi.periodBtnActive : businessUi.periodBtnIdle,
            )}
          >
            {filterLabel(f)}
            {f === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
          </button>
        ))}
      </div>

      <div className="max-w-3xl space-y-4">
        {filtered.map((n) => {
          const Icon = n.icon;
          return (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4",
                n.read ? businessUi.notificationCard : businessUi.notificationCardUnread,
              )}
            >
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", businessUi.iconTileMuted)}>
                <Icon className={`h-5 w-5 ${n.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-foreground">{n.title}</h2>
                  {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </div>
                <p className={cn("mb-3 text-sm", businessUi.cardDesc)}>{n.message}</p>
                <p className="mb-3 text-xs text-muted-foreground">{n.date}</p>
                <div className="flex flex-wrap gap-2">
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(n.id)}
                      className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      {t("business.notifications.markRead")}
                    </button>
                  )}
                  {n.actionUrl && n.actionLabel && (
                    <Link to={n.actionUrl} className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80">
                      {n.actionLabel}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      </div>
    </main>
  );
}
