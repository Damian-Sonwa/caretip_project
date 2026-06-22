import { useTranslation } from "react-i18next";
import { Calendar, CreditCard, RefreshCw, Sparkles } from "lucide-react";
import type { BillingStatus } from "../../../../lib/api";
import { BillingStatusBadge } from "./BillingStatusBadge";

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function BillingCurrentPlanCard({ billing }: { billing: BillingStatus }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("de") ? "de-DE" : "en-GB";
  const cycleLabel =
    billing.billingCycle === "yearly"
      ? t("business.billing.cycleYearly")
      : t("business.billing.cycleMonthly");

  const showEmptyState = !billing.hasStripeBilling && billing.planKey === "basic";

  return (
    <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
      {showEmptyState ? (
        <div className="mb-5 rounded-lg border border-dashed border-accent/30 bg-accent/5 px-4 py-3">
          <p className="text-sm font-medium text-foreground">{t("business.billing.emptyStateTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("business.billing.emptyStateBody")}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("business.billing.currentPlan")}
          </p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {t(`business.billing.plans.${billing.planKey}.name`)}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <BillingStatusBadge status={billing.status} />
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {cycleLabel}
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">{t("business.billing.stripeBillingActive")}</p>
          <p className="mt-0.5 text-muted-foreground">
            {billing.hasStripeBilling ? t("business.billing.yes") : t("business.billing.no")}
          </p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex gap-3 rounded-lg border border-border/60 p-3">
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div>
            <dt className="text-xs text-muted-foreground">{t("business.billing.renewalDate")}</dt>
            <dd className="text-sm font-semibold text-foreground">
              {formatDate(billing.renewalDate ?? billing.currentPeriodEnd, locale)}
            </dd>
          </div>
        </div>
        <div className="flex gap-3 rounded-lg border border-border/60 p-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div>
            <dt className="text-xs text-muted-foreground">{t("business.billing.trialEnd")}</dt>
            <dd className="text-sm font-semibold text-foreground">
              {billing.trialEndsAt ? formatDate(billing.trialEndsAt, locale) : t("business.billing.notApplicable")}
            </dd>
          </div>
        </div>
        <div className="flex gap-3 rounded-lg border border-border/60 p-3">
          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div>
            <dt className="text-xs text-muted-foreground">{t("business.billing.memberSince")}</dt>
            <dd className="text-sm font-semibold text-foreground">
              {formatDate(billing.subscriptionCreatedAt, locale)}
            </dd>
          </div>
        </div>
        <div className="flex gap-3 rounded-lg border border-border/60 p-3">
          <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div>
            <dt className="text-xs text-muted-foreground">{t("business.billing.cancellation")}</dt>
            <dd className="text-sm font-semibold text-foreground">
              {billing.cancelAtPeriodEnd
                ? formatDate(billing.cancellationEffective, locale)
                : t("business.billing.notScheduled")}
            </dd>
          </div>
        </div>
      </dl>
    </div>
  );
}
