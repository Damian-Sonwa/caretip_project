import { useMemo } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Activity, ArrowRight } from "lucide-react";
import type { PlatformHealthResponse } from "../../lib/api";
import { NetworkOverviewHero } from "../NetworkOverviewHero";
import { platformUi } from "./platformDashboardUi";
import { PLATFORM_SYSTEM_BASE } from "./platformAdminNav";
import { cn } from "@/lib/utils";

type PlatformAdminOverviewHeroProps = {
  health: PlatformHealthResponse | null;
  adminName?: string | null;
  locale?: string;
};

function resolvePlatformStatus(health: PlatformHealthResponse | null): "operational" | "degraded" | "checking" {
  if (!health) return "checking";
  if (health.database === "online" && health.stripe === "online") return "operational";
  return "degraded";
}

export function PlatformAdminOverviewHero({ health, adminName, locale }: PlatformAdminOverviewHeroProps) {
  const { t, i18n } = useTranslation();
  const status = resolvePlatformStatus(health);
  const dateLocale = (locale ?? i18n.language)?.toLowerCase().startsWith("de") ? de : enUS;
  const nowLabel = format(new Date(), "EEEE, MMMM d · h:mm a", { locale: dateLocale });

  const statusBadge = useMemo(() => {
    if (status === "operational") {
      return {
        label: t("admin.overview.hero.statusOperational"),
        className:
          "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
        dot: "bg-emerald-500",
      };
    }
    if (status === "degraded") {
      return {
        label: t("admin.overview.hero.statusDegraded"),
        className:
          "border-amber-500/25 bg-amber-500/10 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
        dot: "bg-amber-500",
      };
    }
    return {
      label: t("admin.overview.hero.statusChecking"),
      className: "border-border bg-muted/60 text-muted-foreground",
      dot: "bg-muted-foreground/50 animate-pulse",
    };
  }, [status, t]);

  return (
    <section className={cn(platformUi.overviewHero, "platform-admin-overview-hero")} aria-labelledby="platform-overview-hero-title">
      <div className="p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className="min-w-0 space-y-4">
            <div
              className={cn(
                "inline-flex max-w-full items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold",
                statusBadge.className,
              )}
            >
              <span className={cn("h-2 w-2 shrink-0 rounded-full", statusBadge.dot)} aria-hidden />
              {statusBadge.label}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {adminName
                  ? t("admin.overview.hero.welcomeNamed", { name: adminName })
                  : t("admin.overview.hero.welcome")}
              </p>
              <h1
                id="platform-overview-hero-title"
                className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-[2rem]"
              >
                {t("admin.overview.title")}
              </h1>
              <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t("admin.overview.hero.summary")}
              </p>
            </div>

            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              <time dateTime={new Date().toISOString()}>{nowLabel}</time>
            </p>
          </div>

          <Link
            to={`${PLATFORM_SYSTEM_BASE}/health`}
            className="inline-flex shrink-0 items-center gap-1 self-start text-sm font-medium text-accent hover:underline"
          >
            {t("admin.overview.hero.systemHealthLink")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-6 border-t border-border/70 pt-6">
          <NetworkOverviewHero health={health} embedded variant="health" includeApiCard />
        </div>
      </div>
    </section>
  );
}
