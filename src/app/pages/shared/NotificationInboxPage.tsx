import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, ExternalLink, Loader2, Search } from "lucide-react";
import {
  InlineSpinner,
  NotificationInboxListSkeleton,
} from "@/app/components/dashboard/DashboardSectionLoading";
import { dashboardSharedUi } from "@/app/components/dashboard/dashboardSharedUi";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useRequireAuth } from "@/app/hooks/useRequireAuth";
import { useNotifications, type NotificationListFilters } from "@/app/hooks/useNotifications";
import type { InboxNotification } from "@/app/lib/api";
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

function InboxNotificationRow({
  notification,
  selected,
  onSelect,
}: {
  notification: InboxNotification;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t, i18n } = useTranslation();
  const metaStatus = notification.metadata?.status;
  const showTicketBadge = isSupportNotificationType(notification.type);

  return (
    <li>
      <button
        type="button"
        className={cn(
          dashboardSharedUi.listRow,
          "w-full rounded-xl border px-4 py-3 text-left shadow-sm transition-[border-color,box-shadow,background-color]",
          "hover:border-border/90 hover:shadow-md",
          !notification.read && "border-accent/25 bg-accent/[0.04]",
          notification.priority === "high" && "ring-1 ring-accent/20",
          selected && "border-primary/35 bg-primary/[0.06] ring-1 ring-primary/20",
        )}
        onClick={onSelect}
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
            <p className="truncate text-sm font-semibold text-foreground">{notification.title}</p>
          </div>
          <time
            className="shrink-0 text-[11px] font-medium text-muted-foreground"
            dateTime={notification.createdAt}
          >
            {formatTimestamp(notification.createdAt, i18n.language)}
          </time>
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {notification.message}
        </p>
      </button>
    </li>
  );
}

function InboxNotificationDetail({
  notification,
  onOpen,
}: {
  notification: InboxNotification;
  onOpen: () => void;
}) {
  const { t, i18n } = useTranslation();
  const metaStatus = notification.metadata?.status;
  const showTicketBadge = isSupportNotificationType(notification.type);
  const hasDestination = Boolean(
    notification.url ||
      (typeof notification.metadata?.ticketId === "string" &&
        isSupportTicketNotification(notification.type)),
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex flex-wrap items-center gap-2">
          {showTicketBadge ? (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground">
              [TICKET]
            </span>
          ) : null}
          {typeof metaStatus === "string" &&
          ["OPEN", "PENDING", "RESOLVED", "CLOSED"].includes(metaStatus) ? (
            <SupportStatusBadge status={metaStatus as SupportTicketStatus} />
          ) : null}
          {!notification.read ? (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              {t("notifications.inbox.unreadBadge", { defaultValue: "Unread" })}
            </span>
          ) : null}
        </div>
        <h2 className="mt-3 text-lg font-semibold tracking-tight text-foreground">{notification.title}</h2>
        <time className="mt-1 block text-xs text-muted-foreground" dateTime={notification.createdAt}>
          {formatTimestamp(notification.createdAt, i18n.language)}
        </time>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{notification.message}</p>
      </div>
      {hasDestination ? (
        <div className="shrink-0 border-t border-border px-6 py-4">
          <Button type="button" className="w-full sm:w-auto" onClick={onOpen}>
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
            {t("notifications.inbox.openAction", { defaultValue: "Open" })}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

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
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const selected = useMemo(
    () => list.find((n) => n.id === selectedId) ?? null,
    [list, selectedId],
  );

  useEffect(() => {
    if (list.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !list.some((n) => n.id === selectedId)) {
      setSelectedId(list[0]!.id);
    }
  }, [list, selectedId]);

  const subtitle = isPlatformAdmin
    ? t("notifications.inbox.subtitleAdmin")
    : t("notifications.inbox.subtitle");

  const openNotification = (n: InboxNotification) => {
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

  const handleRowSelect = (n: InboxNotification) => {
    setSelectedId(n.id);
    if (!n.read) void markRead(n.id);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches) {
      openNotification(n);
    }
  };

  const filtersBlock = (
    <div className="shrink-0 space-y-3 border-b border-border p-4 xl:p-5">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedSearch(searchInput);
        }}
      >
        <div className="relative min-w-0 flex-1">
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
        <Button type="submit" variant="secondary" size="sm" className="shrink-0">
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
            className="h-8 max-w-full rounded-md border border-input bg-background px-2 text-xs"
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
  );

  const listBlock = (
    <>
      {isInboxRefreshing ? (
        <div
          className="flex items-center justify-end gap-2 border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground xl:px-5"
          role="status"
          aria-live="polite"
        >
          <InlineSpinner />
          <span>{t("dashboard.refresh.updating")}</span>
        </div>
      ) : null}
      {isInitialInboxLoad ? (
        <div className="p-4 xl:p-5">
          <NotificationInboxListSkeleton />
        </div>
      ) : list.length === 0 ? (
        <div className="m-4 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center xl:m-5">
          <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground/70" aria-hidden />
          <p className="text-sm font-medium text-foreground">{t("notifications.inbox.emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("notifications.inbox.emptyBody")}</p>
        </div>
      ) : (
        <ul className="space-y-2 p-4 xl:max-h-none xl:overflow-y-auto xl:p-5">
          {list.map((n) => (
            <InboxNotificationRow
              key={n.id}
              notification={n}
              selected={selectedId === n.id}
              onSelect={() => handleRowSelect(n)}
            />
          ))}
        </ul>
      )}
      {nextCursor ? (
        <div className="flex justify-center border-t border-border p-4 xl:p-5">
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
    </>
  );

  return (
    <div className={dashboardSharedUi.inboxPage}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {isPlatformAdmin ? t("admin.sidebar.navNotifications") : t("notifications.inbox.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {unreadCount > 0 ? (
          <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => void markAllRead()}>
            <CheckCheck className="mr-1.5 h-4 w-4" aria-hidden />
            {t("notifications.inbox.markAllRead")}
          </Button>
        ) : null}
      </div>

      <div className="mb-4 xl:hidden">{filtersBlock}</div>

      <div className={dashboardSharedUi.inboxMasterDetail}>
        <div className={dashboardSharedUi.inboxListPane}>
          <div className="hidden shrink-0 xl:block">{filtersBlock}</div>
          <div className="min-h-0 flex-1 xl:overflow-y-auto">{listBlock}</div>
        </div>

        <div className={dashboardSharedUi.inboxDetailPane}>
          {selected ? (
            <InboxNotificationDetail
              notification={selected}
              onOpen={() => openNotification(selected)}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center text-muted-foreground">
              <Bell className="mb-3 h-10 w-10 opacity-40" aria-hidden />
              <p className="text-sm">
                {t("notifications.inbox.selectPrompt", {
                  defaultValue: "Select a notification to read the full message.",
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
