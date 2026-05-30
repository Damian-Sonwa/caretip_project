import { useMemo, useState } from "react";
import { Bell, CheckCheck, Loader2, Search } from "lucide-react";
import {
  InlineSpinner,
  NotificationInboxListSkeleton,
} from "@/app/components/dashboard/DashboardSectionLoading";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useRequireAuth } from "@/app/hooks/useRequireAuth";
import { useNotifications, type NotificationListFilters } from "@/app/hooks/useNotifications";
import { isSupportTicketNotification } from "@/app/lib/api";
import {
  SupportStatusBadge,
  isSupportNotificationType,
} from "@/app/components/support/supportTicketUi";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import type { SupportTicketStatus } from "@/app/lib/api";

function formatTimestamp(iso: string, locale: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type InboxKindFilter = "all" | "support" | "other";

export function NotificationInboxPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, authStatus, authReady } = useRequireAuth();
  const isPlatformAdmin = user?.role === "platform_admin" || user?.role === "admin";
  const notificationsEnabled =
    authReady && authStatus === "authenticated" && Boolean(user);

  const [kindFilter, setKindFilter] = useState<InboxKindFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [supportStatus, setSupportStatus] = useState<SupportTicketStatus | "">("");

  const listFilters = useMemo((): NotificationListFilters | undefined => {
    const filters: NotificationListFilters = {};
    if (kindFilter === "support") filters.kind = "support";
    if (kindFilter === "other") filters.kind = "other";
    if (appliedSearch.trim()) filters.q = appliedSearch.trim();
    if (supportStatus && kindFilter !== "other") filters.supportStatus = supportStatus;
    return Object.keys(filters).length ? filters : undefined;
  }, [kindFilter, appliedSearch, supportStatus]);

  const { unreadCount, items, loading, nextCursor, loadNotifications, markRead, markAllRead } =
    useNotifications({
      enabled: notificationsEnabled,
      loadList: true,
      listFilters,
    });
  const list = items ?? [];
  const waitingForAuth = !authReady || authStatus === "initializing";
  const isInitialInboxLoad = (waitingForAuth || loading) && list.length === 0;
  const isInboxRefreshing = loading && list.length > 0;

  const subtitle = isPlatformAdmin
    ? t("notifications.inbox.subtitleAdmin")
    : t("notifications.inbox.subtitle");

  const openNotification = (n: (typeof list)[number]) => {
    void markRead(n.id);
    if (n.url) {
      navigate(n.url);
      return;
    }
    const ticketId = n.metadata?.ticketId;
    if (typeof ticketId === "string" && isSupportTicketNotification(n.type)) {
      const base = isPlatformAdmin ? "/platform-admin/support" : "/dashboard/support";
      navigate(`${base}/${ticketId}`);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {isPlatformAdmin ? t("admin.sidebar.navNotifications") : t("notifications.inbox.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {unreadCount > 0 ? (
          <Button type="button" variant="outline" size="sm" onClick={() => void markAllRead()}>
            <CheckCheck className="mr-1.5 h-4 w-4" aria-hidden />
            {t("notifications.inbox.markAllRead")}
          </Button>
        ) : null}
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setAppliedSearch(searchInput);
          }}
        >
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("notifications.inbox.searchPlaceholder")}
              aria-label={t("notifications.inbox.searchAria")}
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            {t("notifications.inbox.search")}
          </Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {(["all", "support", "other"] as const).map((k) => (
            <Button
              key={k}
              type="button"
              size="sm"
              variant={kindFilter === k ? "default" : "outline"}
              onClick={() => setKindFilter(k)}
            >
              {t(`notifications.inbox.filter.${k}`)}
            </Button>
          ))}
          {kindFilter !== "other" ? (
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              value={supportStatus}
              onChange={(e) => setSupportStatus(e.target.value as SupportTicketStatus | "")}
              aria-label={t("notifications.inbox.statusFilterAria")}
            >
              <option value="">{t("support.filters.allStatuses")}</option>
              {(["OPEN", "PENDING", "RESOLVED", "CLOSED"] as const).map((s) => (
                <option key={s} value={s}>
                  {t(`support.status.${s}`)}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>

      {isInboxRefreshing ? (
        <div
          className="mb-3 flex items-center justify-end gap-2 text-xs font-medium text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <InlineSpinner />
          <span>{t("dashboard.refresh.updating")}</span>
        </div>
      ) : null}

      {isInitialInboxLoad ? (
        <NotificationInboxListSkeleton />
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
          <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground/70" aria-hidden />
          <p className="text-sm font-medium text-foreground">{t("notifications.inbox.emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("notifications.inbox.emptyBody")}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((n) => {
            const metaStatus = n.metadata?.status;
            const showTicketBadge = isSupportNotificationType(n.type);
            return (
              <li key={n.id}>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-xl border border-border bg-card px-4 py-3 text-left shadow-sm transition-[border-color,box-shadow,background-color]",
                    "hover:border-border/90 hover:shadow-md",
                    !n.read && "border-accent/25 bg-accent/[0.04]",
                    n.priority === "high" && "ring-1 ring-accent/20",
                  )}
                  onClick={() => openNotification(n)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      {showTicketBadge ? (
                        <span className="rounded bg-muted px-1 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground">
                          [TICKET]
                        </span>
                      ) : null}
                      {typeof metaStatus === "string" &&
                      ["OPEN", "PENDING", "RESOLVED", "CLOSED"].includes(metaStatus) ? (
                        <SupportStatusBadge status={metaStatus as SupportTicketStatus} />
                      ) : null}
                      <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    </div>
                    <time
                      className="shrink-0 text-[11px] font-medium text-muted-foreground"
                      dateTime={n.createdAt}
                    >
                      {formatTimestamp(n.createdAt, i18n.language)}
                    </time>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{n.message}</p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {nextCursor ? (
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => void loadNotifications({ append: true, cursor: nextCursor })}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {t("notifications.inbox.loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
