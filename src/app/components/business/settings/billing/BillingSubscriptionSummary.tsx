import { useTranslation } from "react-i18next";
import { CreditCard, Sparkles } from "lucide-react";
import { Link } from "react-router";
import type { BillingStatus } from "../../../../lib/api";
import { BillingStatusBadge } from "./BillingStatusBadge";
import { formatBillingDate, resolveBillingLocale } from "./billingFormatters";
import {
  resolveBillingTrialPlanKey,
  subscriptionPlanDisplayName,
  subscriptionTrialStatusLabel,
} from "../../../../lib/subscriptionPlanDisplayName";
import { cn } from "@/lib/utils";

function sponsoredProgrammeLabel(
  billing: BillingStatus,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  if (billing.sponsoredProgrammeLabelKey) {
    return t(billing.sponsoredProgrammeLabelKey);
  }
  if (billing.sponsoredProgrammeKey) {
    return t(`sponsored.programmes.${billing.sponsoredProgrammeKey}`, {
      defaultValue: billing.sponsoredProgrammeKey,
    });
  }
  return t("sponsored.programmes.generic");
}

type Props = {
  billing: BillingStatus;
  onManagePayment?: () => void;
  className?: string;
};

export function BillingSubscriptionSummary({ billing, onManagePayment, className }: Props) {
  const { t, i18n } = useTranslation();
  const locale = resolveBillingLocale(i18n.language);
  const emptyDate = t("business.billing.notApplicable");

  if (billing.accessSource === "sponsored") {
    const programme = sponsoredProgrammeLabel(billing, t);
    return (
      <section
        className={cn("billing-subscription-summary billing-subscription-summary--sponsored", className)}
        aria-labelledby="billing-summary-heading"
      >
        <p className="billing-subscription-summary__eyebrow">{t("business.billing.sponsoredAccessTitle")}</p>
        <h3 id="billing-summary-heading" className="billing-subscription-summary__plan">
          {programme}
        </h3>
        <p className="billing-subscription-summary__body">{t("business.billing.subscriptionSummary.sponsoredProgramme")}</p>
        <Link
          to="/contact?intent=support"
          className="billing-subscription-summary__support-link"
        >
          {t("business.billing.subscriptionSummary.contactSupport")}
        </Link>
      </section>
    );
  }

  const isUnsubscribed = billing.status === "none" || !billing.planKey;
  if (isUnsubscribed) {
    return (
      <section
        className={cn("billing-subscription-summary billing-subscription-summary--empty", className)}
        aria-labelledby="billing-summary-heading"
      >
        <p className="billing-subscription-summary__eyebrow">{t("business.billing.subscriptionSummary.title")}</p>
        <h3 id="billing-summary-heading" className="billing-subscription-summary__plan">
          {t("business.billing.subscriptionSummary.noActiveTitle")}
        </h3>
        <p className="billing-subscription-summary__body">{t("business.billing.subscriptionSummary.noActiveBody")}</p>
      </section>
    );
  }

  const effectivePlanKey = resolveBillingTrialPlanKey(billing);
  const planName = subscriptionPlanDisplayName(effectivePlanKey, t);
  const isTrialing =
    billing.isTrial || billing.status === "trialing" || billing.trialDaysRemaining != null;
  const trialDays = billing.trialDaysRemaining ?? 0;
  const renewalDate = billing.renewalDate ?? billing.currentPeriodEnd;
  const showStatus = billing.status !== "none";

  return (
    <section
      className={cn("billing-subscription-summary", className)}
      aria-labelledby="billing-summary-heading"
    >
      <p className="billing-subscription-summary__eyebrow">{t("business.billing.subscriptionSummary.title")}</p>
      <div className="billing-subscription-summary__headline">
        <h3 id="billing-summary-heading" className="billing-subscription-summary__plan">
          {isTrialing ? subscriptionTrialStatusLabel(effectivePlanKey, t) : planName}
        </h3>
        {isTrialing && trialDays > 0 ? (
          <span className="billing-subscription-summary__trial-pill">
            <Sparkles className="size-3.5 shrink-0" aria-hidden />
            {t("business.billing.trial.daysRemaining", { count: trialDays })}
          </span>
        ) : null}
      </div>

      <dl className="billing-subscription-summary__meta">
        {showStatus && billing.status !== "none" ? (
          <div className="billing-subscription-summary__meta-row">
            <dt>{t("business.billing.subscriptionSummary.statusLabel")}</dt>
            <dd>
              <BillingStatusBadge status={billing.status} />
            </dd>
          </div>
        ) : null}

        {renewalDate ? (
          <div className="billing-subscription-summary__meta-row">
            <dt>{t("business.billing.subscriptionSummary.renewsOn")}</dt>
            <dd>{formatBillingDate(renewalDate, locale, emptyDate)}</dd>
          </div>
        ) : null}

        {billing.hasStripeBilling ? (
          <div className="billing-subscription-summary__meta-row">
            <dt>{t("business.billing.subscriptionSummary.paymentMethod")}</dt>
            <dd className="billing-subscription-summary__payment">
              <CreditCard className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              {onManagePayment ? (
                <button type="button" onClick={onManagePayment} className="billing-subscription-summary__portal-link">
                  {t("business.billing.subscriptionSummary.paymentMethodPortal")}
                </button>
              ) : (
                <span>{t("business.billing.subscriptionSummary.paymentMethodPortal")}</span>
              )}
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
