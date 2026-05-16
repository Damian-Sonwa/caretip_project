import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { Bell, Search, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { CareTipLogo } from "./CareTipLogo";
import { ProfileAvatar } from "./ui/profile-avatar";
import { useEmployeeUnreadCount } from "../hooks/useEmployeeUnreadNotifications";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const employeeUnreadCount = useEmployeeUnreadCount();
  const showNotificationBadge = user?.role === "employee" && employeeUnreadCount > 0;
  const displayName = user?.name?.trim() || t("shell.header.adminFallback");
  const displayEmail = user?.email?.trim() || "";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-30 border-b border-border/80 bg-white/95 backdrop-blur-[6px]"
    >
      <div className="flex min-w-0 items-center justify-between gap-2 px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="touch-manipulation lg:hidden rounded-xl p-2.5 hover:bg-muted active:bg-muted/80 transition-colors min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
            aria-label={t("shell.header.menuButtonAria")}
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>

          <div className="shrink-0 lg:hidden">
            <CareTipLogo size="xs" />
          </div>

          <form
            className="relative max-w-md w-full"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const raw = String(fd.get("q") ?? "").trim();
              navigate(raw ? `/faq?q=${encodeURIComponent(raw)}` : "/faq");
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              name="q"
              type="search"
              enterKeyHint="search"
              placeholder={t("shell.header.searchPlaceholder")}
              autoComplete="off"
              aria-label={t("shell.header.searchAria")}
              className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
          </form>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              if (user?.role === "employee") {
                navigate("/employee/notifications");
                return;
              }
              if (user?.role === "business") {
                navigate("/dashboard/notifications");
                return;
              }
              if (user?.role === "platform_admin") {
                navigate("/platform-admin/dashboard");
                return;
              }
              navigate("/faq");
            }}
            className="relative inline-flex touch-manipulation items-center justify-center rounded-xl min-h-[44px] min-w-[44px] p-2 transition-colors hover:bg-muted active:opacity-90"
            aria-label={
              showNotificationBadge
                ? t("shell.header.notificationsUnreadAria", { count: employeeUnreadCount })
                : t("shell.header.notificationsAria")
            }
          >
            <Bell className="w-5 h-5 text-foreground" />
            {showNotificationBadge ? (
              <span
                className={cn(
                  "absolute top-1 right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-accent-foreground shadow-sm",
                  "animate-in fade-in zoom-in-75 duration-200",
                )}
                aria-hidden
              >
                {employeeUnreadCount > 9 ? "9+" : employeeUnreadCount}
              </span>
            ) : null}
          </button>

          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-border">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                {displayEmail || t("shell.header.platformAdminEmail")}
              </p>
            </div>
            <ProfileAvatar
              key={user?.avatar ?? user?.id ?? "header-avatar"}
              src={user?.avatar}
              displayName={displayName}
              className="h-9 w-9 ring-2 ring-accent/30 hover:ring-accent/50 transition-all"
              lightbox={false}
            />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
