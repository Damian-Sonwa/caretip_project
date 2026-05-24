import { useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { useNotifications } from "@/app/hooks/useNotifications";
import { useAuth } from "@/app/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

function formatGroupTime(iso: string, locale: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

function inboxPathForRole(role: string | undefined): string {
  if (role === "employee") return "/employee/inbox";
  if (role === "business") return "/dashboard/notifications";
  if (role === "platform_admin") return "/platform-admin/notifications";
  return "/dashboard/notifications";
}

type NotificationBellProps = {
  className?: string;
};

export function NotificationBell({ className }: NotificationBellProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const enabled = Boolean(user && user.role !== "guest");
  const {
    unreadCount,
    items,
    loading,
    loadNotifications,
    markRead,
    markAllRead,
  } = useNotifications({ enabled, loadList: open });

  const badge = unreadCount > 0;
  const inboxPath = inboxPathForRole(user?.role);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void loadNotifications();
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative inline-flex touch-manipulation items-center justify-center rounded-xl min-h-[44px] min-w-[44px] p-2 transition-colors hover:bg-muted active:opacity-90",
            className,
          )}
          aria-label={
            badge
              ? t("notifications.bell.unreadAria", { count: unreadCount })
              : t("notifications.bell.aria")
          }
        >
          <Bell className="h-5 w-5 text-foreground" />
          {badge ? (
            <span
              className="absolute top-1 right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-accent-foreground"
              aria-hidden
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,22rem)] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-sm font-semibold text-foreground">{t("notifications.bell.title")}</p>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              {t("notifications.bell.markAllRead")}
            </button>
          ) : null}
        </div>
        <div className="max-h-[min(60vh,20rem)] overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />
            </div>
          ) : items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {t("notifications.bell.empty")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.slice(0, 8).map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                      !n.read && "bg-accent/5",
                      n.priority === "high" && "border-l-2 border-l-accent pl-[10px]",
                    )}
                    onClick={() => {
                      void markRead(n.id);
                      if (n.url) navigate(n.url);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug text-foreground">{n.title}</p>
                      <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                        {formatGroupTime(n.createdAt, i18n.language)}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {n.message}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem asChild className="cursor-pointer justify-center py-2.5 text-sm font-medium">
          <Link to={inboxPath} onClick={() => setOpen(false)}>
            {t("notifications.bell.viewAll")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
