import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Calendar, CreditCard, RefreshCw, Sparkles } from "lucide-react";
import type { BillingStatus } from "../../../../lib/api";
import { BillingStatusBadge } from "./BillingStatusBadge";
import { PremiumPlanCard } from "../../../premium/PremiumPlanCard";
import { premiumVisualClasses } from "@/lib/premiumVisualTokens";

function formatDate(iso: string | null, locale: string, emptyLabel: string): string {
  if (!iso) return emptyLabel;
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
  const showUpgrade = billing.planKey !== "enterprise";

  return (
    <PremiumPlanCard
      badge={<span className={premiumVisualClasses.badge}>{t("business.billing.currentPlan")}</span>}
      title={
        <h3 className="text-2xl font-bold tracking-tight text-white">
          {t(`business.billing.plans.${billing.planKey}.name`)}
        </h3>
      }
      subtitle={
        showEmptyState ? (
          <p>{t("business.billing.emptyStateBody")}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <BillingStatusBadge status={billing.status} />
            <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90">
              {cycleLabel}
            </span>
          </div>
        )
      }
      meta={
        <div className="rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm text-white">
          <p className="font-medium">{t("business.billing.stripeBillingActive")}</p>
          <p className="mt-0.5 text-white/75">
            {billing.hasStripeBilling ? t("business.billing.yes") : t("business.billing.no")}
          </p>
        </div>
      }
      upgradeAction={
        showUpgrade ? (
          <Link
            to="#billing-plans"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/15"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {t("premium.plan.upgrade")}
          </Link>
        ) : null
      }
    >
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex gap-3 rounded-lg border border-border/60 p-3">
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div>
            <dt className="text-xs text-muted-foreground">{t("business.billing.renewalDate")}</dt>
            <dd className="text-sm font-semibold text-foreground">
              {formatDate(billing.renewalDate ?? billing.currentPeriodEnd, locale, t("business.billing.notApplicable"))}
            </dd>
          </div>
        </div>
        <div className="flex gap-3 rounded-lg border border-border/60 p-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div>
            <dt className="text-xs text-muted-foreground">{t("business.billing.trialEnd")}</dt>
            <dd className="text-sm font-semibold text-foreground">
              {billing.trialEndsAt
                ? formatDate(billing.trialEndsAt, locale, t("business.billing.notApplicable"))
                : t("business.billing.notApplicable")}
            </dd>
          </div>
        </div>
        <div className="flex gap-3 rounded-lg border border-border/60 p-3">
          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div>
            <dt className="text-xs text-muted-foreground">{t("business.billing.memberSince")}</dt>
            <dd className="text-sm font-semibold text-foreground">
              {formatDate(billing.subscriptionCreatedAt, locale, t("business.billing.notApplicable"))}
            </dd>
          </div>
        </div>
        <div className="flex gap-3 rounded-lg border border-border/60 p-3">
          <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div>
            <dt className="text-xs text-muted-foreground">{t("business.billing.cancellation")}</dt>
            <dd className="text-sm font-semibold text-foreground">
              {billing.cancelAtPeriodEnd
                ? formatDate(billing.cancellationEffective, locale, t("business.billing.notApplicable"))
                : t("business.billing.notScheduled")}
            </dd>
          </div>
        </div>
      </dl>
    </PremiumPlanCard>
  );
}
