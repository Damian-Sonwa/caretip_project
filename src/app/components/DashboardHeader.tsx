import { Link, useNavigate } from "react-router";
import { Search, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import {
  CareTipLogo,
} from "./CareTipLogo";
import { BusinessLogoMark } from "./business/BusinessLogoMark";
import { ProfileAvatar } from "./ui/profile-avatar";
import { useBusinessVenueBrand } from "../hooks/useBusinessVenueBrand";
import { NotificationBell } from "@/app/components/notifications/NotificationBell";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { ThemeQuickToggle } from "@/app/components/theme/ThemeQuickToggle";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPlatformAdmin = user?.role === "platform_admin";
  const isBusinessManager = user?.role === "business";
  const { venueName, logo: businessLogo } = useBusinessVenueBrand();
  const displayName = user?.name?.trim() || t("shell.header.adminFallback");
  const displayEmail = user?.email?.trim() || "";

  return (
    <header className="caretip-dashboard-header-bar sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur-[4px]">
      <div
        className={cn(
          "flex min-w-0 max-w-full items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3.5 lg:px-8",
          isPlatformAdmin ? "gap-1.5 max-lg:gap-2 sm:gap-3" : "gap-2",
        )}
      >
        <div
          className={cn(
            "caretip-dashboard-header-leading flex min-w-0 flex-1 items-center",
            isPlatformAdmin ? "gap-1.5 max-lg:gap-2 sm:gap-3" : "gap-2 sm:gap-3",
          )}
        >
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 touch-manipulation items-center justify-center rounded-xl p-2.5 transition-colors hover:bg-muted active:bg-muted/80 lg:hidden"
            aria-label={t("shell.header.menuButtonAria")}
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>

          {!isBusinessManager ? (
            <div className="min-w-0 max-w-[min(6.75rem,36vw)] shrink overflow-hidden lg:hidden">
              <CareTipLogo size="bar" />
            </div>
          ) : null}

          {!isBusinessManager ? (
            <form
              className={cn(
                "caretip-dashboard-header-search relative min-w-0",
                isPlatformAdmin ? "flex-1 lg:max-w-md" : "w-full max-w-md flex-1",
              )}
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const raw = String(fd.get("q") ?? "").trim();
                navigate(raw ? `/faq?q=${encodeURIComponent(raw)}` : "/faq");
              }}
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                type="search"
                enterKeyHint="search"
                placeholder={t("shell.header.searchPlaceholder")}
                autoComplete="off"
                aria-label={t("shell.header.searchAria")}
                className={cn(
                  "w-full min-w-0 rounded-lg border border-border bg-input-background py-2 pl-10 pr-3 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent",
                  isPlatformAdmin && "max-lg:py-2 max-lg:pl-9 max-lg:pr-2 max-lg:text-xs placeholder:max-lg:text-xs",
                )}
              />
            </form>
          ) : null}
        </div>

        <div
          className={cn(
            "caretip-dashboard-header-trailing flex shrink-0 items-center",
            isPlatformAdmin ? "gap-1 max-lg:gap-1.5 sm:gap-3" : "gap-2 sm:gap-3",
          )}
        >
          {user?.role === "employee" || user?.role === "business" || user?.role === "platform_admin" ? (
            <NotificationBell />
          ) : null}

          {user?.role === "employee" || user?.role === "business" || user?.role === "platform_admin" ? (
            <ThemeQuickToggle />
          ) : null}

          {user?.role === "employee" || user?.role === "business" || user?.role === "platform_admin" ? (
            <LanguageSwitcher variant="dashboard" />
          ) : null}

          {isBusinessManager ? (
            <Link
              to="/dashboard/settings?section=business"
              className="inline-flex max-w-[4.5rem] shrink-0 touch-manipulation items-center justify-center rounded-xl p-0 transition-colors hover:bg-muted active:opacity-90 sm:max-w-none sm:p-0.5"
              aria-label={t("shell.nav.settings")}
            >
              <BusinessLogoMark
                key={`${businessLogo ?? "no-logo"}-${venueName}`}
                logoPathOrUrl={businessLogo}
                businessName={venueName}
                size="dashboardHeader"
                fallbackTone="muted"
              />
            </Link>
          ) : (
            <div className="hidden items-center gap-3 border-l border-border pl-3 sm:flex">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{displayName}</p>
                <p className="max-w-[180px] truncate text-xs text-muted-foreground">
                  {displayEmail || t("shell.header.platformAdminEmail")}
                </p>
              </div>
              <ProfileAvatar
                key={user?.avatar ?? user?.id ?? "header-avatar"}
                src={user?.avatar}
                displayName={displayName}
                className="h-9 w-9 ring-2 ring-accent/30 transition-all hover:ring-accent/50"
                lightbox={false}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
