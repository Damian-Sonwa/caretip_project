import { useTranslation } from "react-i18next";
import { AlertCircle, Calendar, RefreshCw } from "lucide-react";
import type { BillingStatus } from "../../../../lib/api";
import { subscriptionPlanDisplayName, resolveBillingTrialPlanKey } from "../../../../lib/subscriptionPlanDisplayName";

function formatDate(iso: string | null, locale: string, emptyLabel: string): string {
  if (!iso) return emptyLabel;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

type Props = {
  billing: BillingStatus;
};

/**
 * Subscription lifecycle summary — renewal, cancellation, and billing stop dates.
 * Cancel actions remain in BillingPlanManagement (unchanged).
 */
export function BillingSubscriptionLifecycle({ billing }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("de") ? "de-DE" : "en-GB";

  const renewalDate = billing.renewalDate ?? billing.currentPeriodEnd;
  const cancellationEffective = billing.cancelAtPeriodEnd ? billing.cancellationEffective : null;
  const earliestTermination = billing.cancelAtPeriodEnd
    ? cancellationEffective
    : renewalDate;
  const billingStopsLabel = billing.cancelAtPeriodEnd
    ? t("business.billing.lifecycle.billingStopsOn")
    : t("business.billing.lifecycle.billingContinues");

  const displayPlanKey = resolveBillingTrialPlanKey(billing) ?? billing.planKey;

  return (
    <section
      className="rounded-xl border border-border/70 bg-card p-5 shadow-sm"
      aria-labelledby="billing-lifecycle-heading"
    >
      <h3 id="billing-lifecycle-heading" className="text-lg font-semibold text-foreground">
        {t("business.billing.lifecycle.title")}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("business.billing.lifecycle.subtitle")}</p>

      <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border/60 p-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("business.billing.lifecycle.currentSubscription")}
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">
            {subscriptionPlanDisplayName(displayPlanKey, t)},{" "}
            {billing.billingCycle === "yearly"
              ? t("business.billing.cycleYearly")
              : t("business.billing.cycleMonthly")}
          </dd>
        </div>
        <div className="flex gap-3 rounded-lg border border-border/60 p-3">
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
          <div>
            <dt className="text-xs text-muted-foreground">{t("business.billing.renewalDate")}</dt>
            <dd className="text-sm font-semibold text-foreground">
              {formatDate(renewalDate, locale, t("business.billing.notApplicable"))}
            </dd>
          </div>
        </div>
        <div className="flex gap-3 rounded-lg border border-border/60 p-3">
          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("business.billing.lifecycle.cancellationEffective")}
            </dt>
            <dd className="text-sm font-semibold text-foreground">
              {cancellationEffective
                ? formatDate(cancellationEffective, locale, t("business.billing.notApplicable"))
                : t("business.billing.notScheduled")}
            </dd>
          </div>
        </div>
        <div className="flex gap-3 rounded-lg border border-border/60 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("business.billing.lifecycle.earliestTermination")}
            </dt>
            <dd className="text-sm font-semibold text-foreground">
              {formatDate(earliestTermination, locale, t("business.billing.notApplicable"))}
            </dd>
          </div>
        </div>
      </dl>

      <p className="mt-4 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        {billingStopsLabel}
      </p>

      {billing.trialEndsAt ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {t("business.billing.lifecycle.trialConversion", {
            date: formatDate(billing.trialEndsAt, locale, t("business.billing.notApplicable")),
          })}
        </p>
      ) : null}

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {billing.billingCycle === "yearly"
          ? t("business.billing.lifecycle.autoRenewalAnnual")
          : t("business.billing.lifecycle.autoRenewalMonthly")}
      </p>

      {billing.cancelAtPeriodEnd ? (
        <p className="mt-3 text-sm text-amber-800 dark:text-amber-200" role="status">
          {t("business.billing.lifecycle.cancelScheduledNotice", {
            date: formatDate(cancellationEffective, locale, t("business.billing.notApplicable")),
          })}
        </p>
      ) : null}
    </section>
  );
}
