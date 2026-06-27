import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createBillingCheckoutSession,
  createBillingPortalSession,
  scheduleBillingCancelAtPeriodEnd,
  type BillingStatus,
  type SubscriptionBillingCycle,
  type SubscriptionPlanKey,
} from "../../../../lib/api";
import { toUserFriendlyMessage } from "../../../../lib/errorMessages";
import { isDowngrade, isUpgrade } from "../../../../data/subscriptionPlans";
import {
  buildPricingTierCatalog,
  mapPricingTierToPlanKey,
  type PricingTierKey,
} from "../../../../data/pricingPlanCatalog";
import { PricingTierCard, type PricingTierCardBadge } from "@/components/pricing/PricingTierCard";
import { pricingPageUi } from "@/components/pricing/pricingPageUi";
import { cn } from "@/lib/utils";
import { formatBillingDate, resolveBillingLocale } from "./billingFormatters";

type Props = {
  billing: BillingStatus;
  billingCycle: SubscriptionBillingCycle;
  onChanged: () => void;
};

export function BillingPlanManagement({ billing, billingCycle, onChanged }: Props) {
  const { t, i18n } = useTranslation();
  const locale = resolveBillingLocale(i18n.language);
  const emptyDate = t("business.billing.notApplicable");
  const [busyPlan, setBusyPlan] = useState<SubscriptionPlanKey | "portal" | "cancel" | null>(null);

  const tiers = useMemo(() => buildPricingTierCatalog(t), [t]);
  const currentPlanKey = billing.planKey;
  const isTrialing =
    billing.isTrial || billing.status === "trialing" || billing.trialDaysRemaining != null;
  const trialDaysRemaining = billing.trialDaysRemaining ?? 0;
  const isUnsubscribed = billing.status === "none" || !currentPlanKey;

  const canCheckout = billing.billingEnabled && billing.stripeConfigured;
  const canPortal = canCheckout && Boolean(billing.stripeCustomerId);
  const canDowngrade = canPortal && billing.hasStripeBilling;

  async function handleUpgrade(planKey: SubscriptionPlanKey) {
    if (planKey === "enterprise") return;
    setBusyPlan(planKey);
    try {
      const session = await createBillingCheckoutSession({ planKey, billingCycle });
      if (session.url) {
        window.location.assign(session.url);
        return;
      }
      toast.error(t("business.billing.checkoutNoUrl"));
    } catch (err) {
      toast.error(toUserFriendlyMessage(err) || t("business.billing.checkoutError"));
    } finally {
      setBusyPlan(null);
    }
  }

  async function handlePortal() {
    setBusyPlan("portal");
    try {
      const { url } = await createBillingPortalSession();
      window.location.assign(url);
    } catch (err) {
      toast.error(toUserFriendlyMessage(err) || t("business.billing.portalError"));
    } finally {
      setBusyPlan(null);
    }
  }

  async function handleCancel() {
    if (!window.confirm(t("business.billing.cancelConfirm"))) return;
    setBusyPlan("cancel");
    try {
      await scheduleBillingCancelAtPeriodEnd();
      toast.success(t("business.billing.cancelScheduled"));
      onChanged();
    } catch (err) {
      toast.error(toUserFriendlyMessage(err) || t("business.billing.cancelError"));
    } finally {
      setBusyPlan(null);
    }
  }

  function resolveBadge(tierKey: PricingTierKey): PricingTierCardBadge | null {
    const planKey = mapPricingTierToPlanKey(tierKey);
    const isCurrent = !isUnsubscribed && planKey === currentPlanKey;

    if (isCurrent && isTrialing && trialDaysRemaining > 0) {
      return { kind: "trial", daysRemaining: trialDaysRemaining };
    }
    if (isCurrent) {
      return { kind: "current" };
    }
    return null;
  }

  function renderSubscriptionInfo(tierKey: PricingTierKey): ReactNode {
    const planKey = mapPricingTierToPlanKey(tierKey);
    const isCurrent = !isUnsubscribed && planKey === currentPlanKey;
    if (!isCurrent) return null;

    const renewalDate = billing.renewalDate ?? billing.currentPeriodEnd;
    const lines: ReactNode[] = [];

    if (billing.status !== "none") {
      lines.push(
        <p key="status" className="caretip-pricing-tier-card__subscription-line">
          {t("business.billing.subscriptionSummary.statusLabel")}:{" "}
          <span className="font-medium text-foreground">{t(`business.billing.status.${billing.status}`)}</span>
        </p>,
      );
    }

    if (isTrialing && billing.trialEndsAt) {
      lines.push(
        <p key="trial" className="caretip-pricing-tier-card__subscription-line">
          {t("business.billing.planCard.trialEnds", {
            date: formatBillingDate(billing.trialEndsAt, locale, emptyDate),
          })}
        </p>,
      );
      if (trialDaysRemaining > 0) {
        lines.push(
          <p key="days" className="caretip-pricing-tier-card__subscription-line">
            {t("business.billing.trial.daysRemaining", { count: trialDaysRemaining })}
          </p>,
        );
      }
    } else if (renewalDate) {
      lines.push(
        <p key="renewal" className="caretip-pricing-tier-card__subscription-line">
          {t("business.billing.planCard.renewsOn", {
            date: formatBillingDate(renewalDate, locale, emptyDate),
          })}
        </p>,
      );
    }

    if (billing.cancelAtPeriodEnd && billing.cancellationEffective) {
      lines.push(
        <p key="cancel" className="caretip-pricing-tier-card__subscription-line caretip-pricing-tier-card__subscription-line--muted">
          {t("business.billing.planCard.cancelScheduled", {
            date: formatBillingDate(billing.cancellationEffective, locale, emptyDate),
          })}
        </p>,
      );
    }

    if (lines.length === 0) return null;
    return <div className="space-y-1">{lines}</div>;
  }

  function renderTierFooter(tierKey: PricingTierKey, tierName: string, isPopular: boolean): ReactNode {
    const planKey = mapPricingTierToPlanKey(tierKey);
    const isCurrent = !isUnsubscribed && planKey === currentPlanKey;
    const isEnterprise = tierKey === "enterprise";

    if (isEnterprise) {
      return (
        <Link to="/contact?intent=enterprise" className={pricingPageUi.cardCtaEnterprise}>
          {t("business.billing.contactSales")}
        </Link>
      );
    }

    if (isCurrent) {
      return (
        <button
          type="button"
          disabled
          className={cn(
            pricingPageUi.cardCtaSecondary,
            "inline-flex items-center justify-center gap-2 opacity-70",
          )}
          aria-disabled="true"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          {t("business.billing.currentPlanBadge")}
        </button>
      );
    }

    if (isUnsubscribed || (currentPlanKey && isUpgrade(currentPlanKey, planKey))) {
      return (
        <div className="flex w-full flex-col gap-2">
          <button
            type="button"
            disabled={!canCheckout || busyPlan !== null}
            onClick={() => void handleUpgrade(planKey)}
            className={cn(
              isPopular || isUnsubscribed ? pricingPageUi.cardCtaPrimary : pricingPageUi.cardCtaSecondary,
              "disabled:opacity-60",
            )}
          >
            {busyPlan === planKey ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : isUnsubscribed ? (
              t("business.billing.planCard.subscribeToPlan", { plan: tierName })
            ) : (
              t("business.billing.upgradeToPlan", { plan: tierName })
            )}
          </button>
        </div>
      );
    }

    if (currentPlanKey && isDowngrade(currentPlanKey, planKey)) {
      if (canDowngrade) {
        return (
          <div className="flex w-full flex-col gap-2">
            <button
              type="button"
              disabled={busyPlan !== null}
              onClick={() => void handlePortal()}
              className={cn(pricingPageUi.cardCtaSecondary, "disabled:opacity-60")}
            >
              {busyPlan === "portal" ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                t("business.billing.planCard.downgradeToPlan", { plan: tierName })
              )}
            </button>
            <p className="text-center text-[11px] leading-snug text-muted-foreground">
              {t("business.billing.planCard.downgradeViaPortal")}
            </p>
          </div>
        );
      }

      return (
        <div className="flex w-full flex-col gap-2">
          <button
            type="button"
            disabled
            className={cn(pricingPageUi.cardCtaSecondary, "opacity-60")}
            aria-disabled="true"
          >
            {t("business.billing.downgrade")}
          </button>
          <p className="text-center text-[11px] leading-snug text-muted-foreground">
            {t("business.billing.downgradeUnavailable")}
          </p>
        </div>
      );
    }

    return null;
  }

  if (billing.accessSource === "sponsored") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border/70 bg-muted/20 px-5 py-4">
          <h3 className="text-lg font-semibold text-foreground">{t("business.billing.sponsoredAccessTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("business.billing.subscriptionSummary.sponsoredProgramme")}</p>
          <Link
            to="/contact?intent=support"
            className={cn(pricingPageUi.cardCtaPrimary, "mt-4 inline-flex w-full sm:w-auto")}
          >
            {t("business.billing.subscriptionSummary.contactSupport")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t("business.billing.planManagement")}</h3>
          <p className="text-sm text-muted-foreground">{t("business.billing.planManagementDesc")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canPortal ? (
            <button
              type="button"
              disabled={busyPlan !== null}
              onClick={() => void handlePortal()}
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted/50 disabled:opacity-60"
            >
              {busyPlan === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("business.billing.manageBilling")}
            </button>
          ) : null}
          {canCheckout && billing.hasStripeBilling && !billing.cancelAtPeriodEnd ? (
            <button
              type="button"
              disabled={busyPlan !== null}
              onClick={() => void handleCancel()}
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-red-200 px-4 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {busyPlan === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("business.billing.cancelSubscription")}
            </button>
          ) : null}
        </div>
      </div>

      {!canCheckout ? (
        <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("business.billing.billingNotEnabled")}
        </p>
      ) : null}

      <div className="caretip-pricing-tiers caretip-pricing-tiers--billing" data-billing-cycle={billingCycle}>
        <div className="caretip-pricing-tiers__grid">
          {tiers.map((tier) => (
            <PricingTierCard
              key={tier.tierKey}
              tier={tier}
              billingCycle={billingCycle}
              variant="subscription"
              badge={resolveBadge(tier.tierKey)}
              footer={renderTierFooter(tier.tierKey, tier.name, tier.isPopular)}
              subscriptionInfo={renderSubscriptionInfo(tier.tierKey)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
