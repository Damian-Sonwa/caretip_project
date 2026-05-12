import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { Bell, Search, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { CareTipLogo } from "./CareTipLogo";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.name?.trim() || t("shell.header.adminFallback");
  const displayEmail = user?.email?.trim() || "";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "A";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-30 border-b border-border/80 bg-white"
    >
      <div className="flex min-w-0 items-center justify-between gap-2 px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          <button type="button" onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors">
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
            className="relative touch-manipulation rounded-lg p-2 transition-colors hover:bg-muted active:opacity-90"
            aria-label={t("shell.header.notificationsAria")}
          >
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
          </button>

          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-border">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                {displayEmail || t("shell.header.platformAdminEmail")}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-xs font-medium cursor-pointer hover:ring-2 hover:ring-accent/50 transition-all">
              {initials}
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
