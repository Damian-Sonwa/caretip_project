import { Link } from "react-router";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ActivateCareTipCta } from "./ActivateCareTipCta";
import { cn } from "@/lib/utils";

/** Upgrade notice for team invite / add-staff actions — not an error state. */
export function TeamGrowthUpgradeNotice({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.05] via-card to-muted/35 p-5 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.1)] sm:p-6",
        className,
      )}
      aria-labelledby="team-growth-notice-title"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/[0.05]" aria-hidden />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {t("business.team.upgradeNotice.eyebrow")}
          </p>
          <h2
            id="team-growth-notice-title"
            className="text-base font-semibold tracking-tight text-foreground sm:text-lg"
          >
            {t("business.team.upgradeNotice.title")}
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {t("business.team.upgradeNotice.body")}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <ActivateCareTipCta action="trial" size="md" className="w-full sm:w-auto" />
          <Link
            to="/dashboard/billing/subscription"
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50 sm:w-auto"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            {t("business.team.upgradeNotice.viewPlans")}
          </Link>
        </div>
      </div>
    </section>
  );
}
