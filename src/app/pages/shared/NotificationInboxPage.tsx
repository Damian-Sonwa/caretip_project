import { useEffect } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useRequireAuth } from "@/app/hooks/useRequireAuth";
import { useNotifications } from "@/app/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";

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

export function NotificationInboxPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  useRequireAuth();
  const { unreadCount, items, loading, nextCursor, loadNotifications, markRead, markAllRead } =
    useNotifications({ enabled: true, loadList: true });

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {t("notifications.inbox.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("notifications.inbox.subtitle")}</p>
        </div>
        {unreadCount > 0 ? (
          <Button type="button" variant="outline" size="sm" onClick={() => void markAllRead()}>
            <CheckCheck className="mr-1.5 h-4 w-4" aria-hidden />
            {t("notifications.inbox.markAllRead")}
          </Button>
        ) : null}
      </div>

      {loading && items.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
          <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground/70" aria-hidden />
          <p className="text-sm font-medium text-foreground">{t("notifications.inbox.emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("notifications.inbox.emptyBody")}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className={cn(
                  "w-full rounded-xl border border-border bg-card px-4 py-3 text-left shadow-sm transition-[border-color,box-shadow,background-color]",
                  "hover:border-border/90 hover:shadow-md",
                  !n.read && "border-accent/25 bg-accent/[0.04]",
                  n.priority === "high" && "ring-1 ring-accent/20",
                )}
                onClick={() => {
                  void markRead(n.id);
                  if (n.url) navigate(n.url);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
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
          ))}
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
