import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard } from "lucide-react";
import { Link } from "react-router";
import type { BillingStatus } from "../../../../lib/api";
import { BillingStatusBadge } from "./BillingStatusBadge";
import { formatBillingDate, resolveBillingLocale } from "./billingFormatters";
import {
  resolveBillingTrialPlanKey,
  subscriptionPlanDisplayName,
  subscriptionTrialStatusLabel,
} from "../../../../lib/subscriptionPlanDisplayName";
import { dashboardWorkspaceUi } from "@/app/components/dashboard/dashboardWorkspaceUi";
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

function MetaSeparator() {
  return <span className={dashboardWorkspaceUi.inlineMetaSep} aria-hidden>•</span>;
}

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
        <h2 id="billing-summary-heading" className="billing-subscription-summary__plan">
          {programme}
        </h2>
        <p className="billing-subscription-summary__inline-meta">
          {t("business.billing.subscriptionSummary.sponsoredProgramme")}
        </p>
        <div className="billing-subscription-summary__actions">
          <Link
            to="/contact?intent=support"
            className={cn(dashboardWorkspaceUi.btnSecondary, "inline-flex")}
          >
            {t("business.billing.subscriptionSummary.contactSupport")}
          </Link>
        </div>
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
        <h2 id="billing-summary-heading" className="billing-subscription-summary__plan">
          {t("business.billing.subscriptionSummary.noActiveTitle")}
        </h2>
        <p className="billing-subscription-summary__inline-meta">
          {t("business.billing.subscriptionSummary.noActiveBody")}
        </p>
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

  const metaParts: ReactNode[] = [];

  if (showStatus && billing.status !== "none") {
    metaParts.push(<BillingStatusBadge key="status" status={billing.status} />);
  }

  if (isTrialing && trialDays > 0) {
    metaParts.push(
      <span key="trial">{t("business.billing.trial.daysRemaining", { count: trialDays })}</span>,
    );
  }

  if (renewalDate) {
    metaParts.push(
      <span key="renewal">
        {t("business.billing.subscriptionSummary.renewsOn")}{" "}
        {formatBillingDate(renewalDate, locale, emptyDate)}
      </span>,
    );
  }

  return (
    <section
      className={cn("billing-subscription-summary", className)}
      aria-labelledby="billing-summary-heading"
    >
      <h2 id="billing-summary-heading" className="billing-subscription-summary__plan">
        {isTrialing ? subscriptionTrialStatusLabel(effectivePlanKey, t) : planName}
      </h2>

      {metaParts.length > 0 ? (
        <p className="billing-subscription-summary__inline-meta flex flex-wrap items-center gap-x-0 gap-y-1">
          {metaParts.map((part, index) => (
            <span key={index} className="inline-flex items-center">
              {index > 0 ? <MetaSeparator /> : null}
              {part}
            </span>
          ))}
        </p>
      ) : null}

      {billing.hasStripeBilling && onManagePayment ? (
        <div className="billing-subscription-summary__actions">
          <button
            type="button"
            onClick={onManagePayment}
            className={cn(dashboardWorkspaceUi.btnSecondary, "inline-flex gap-2")}
          >
            <CreditCard className="size-4 shrink-0" aria-hidden />
            {t("business.billing.subscriptionSummary.paymentMethodPortal")}
          </button>
        </div>
      ) : null}
    </section>
  );
}
