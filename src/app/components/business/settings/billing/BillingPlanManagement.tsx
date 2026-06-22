import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Check, Crown, Loader2 } from "lucide-react";
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
import {
  isDowngrade,
  isUpgrade,
  SUBSCRIPTION_PLAN_DEFINITIONS,
} from "../../../../data/subscriptionPlans";
import { cn } from "@/lib/utils";

type Props = {
  billing: BillingStatus;
  billingCycle: SubscriptionBillingCycle;
  onChanged: () => void;
};

export function BillingPlanManagement({ billing, billingCycle, onChanged }: Props) {
  const { t } = useTranslation();
  const [busyPlan, setBusyPlan] = useState<SubscriptionPlanKey | "portal" | "cancel" | null>(null);

  const current = billing.planKey;

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
      toast.error(toUserFriendlyMessage(err, t("business.billing.checkoutError")));
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
      toast.error(toUserFriendlyMessage(err, t("business.billing.portalError")));
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
      toast.error(toUserFriendlyMessage(err, t("business.billing.cancelError")));
    } finally {
      setBusyPlan(null);
    }
  }

  const canCheckout = billing.billingEnabled && billing.stripeConfigured;
  const canPortal = canCheckout && Boolean(billing.stripeCustomerId);

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {SUBSCRIPTION_PLAN_DEFINITIONS.map((plan) => {
          const isCurrent = plan.planKey === current;
          const price =
            billingCycle === "yearly"
              ? plan.yearlyMonthlyEquivalent ?? plan.yearlyPrice
              : plan.monthlyPrice;
          const priceSuffix =
            billingCycle === "yearly" && plan.yearlyPrice
              ? t("business.billing.perMonthBilledYearly", { total: plan.yearlyPrice })
              : t("business.billing.perMonth");

          const features: string[] = [];
          for (let i = 0; i < plan.featureCount; i++) {
            const key = `business.billing.plans.${plan.planKey}.f${i}`;
            const value = t(key);
            if (value && value !== key) features.push(value);
          }

          let action: ReactNode = null;
          if (plan.isContactSales) {
            action = (
              <Link
                to="/contact?intent=enterprise"
                className="inline-flex min-h-[40px] w-full items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted/50"
              >
                {t("business.billing.contactSales")}
              </Link>
            );
          } else if (isCurrent) {
            action = (
              <span className="inline-flex min-h-[40px] w-full items-center justify-center rounded-lg bg-muted px-4 text-sm font-semibold text-muted-foreground">
                {t("business.billing.currentPlanBadge")}
              </span>
            );
          } else if (isUpgrade(current, plan.planKey)) {
            action = (
              <button
                type="button"
                disabled={!canCheckout || busyPlan !== null}
                onClick={() => void handleUpgrade(plan.planKey)}
                className="inline-flex min-h-[40px] w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {busyPlan === plan.planKey ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("business.billing.upgrade")
                )}
              </button>
            );
          } else if (isDowngrade(current, plan.planKey)) {
            action = canPortal ? (
              <button
                type="button"
                disabled={busyPlan !== null}
                onClick={() => void handlePortal()}
                className="inline-flex min-h-[40px] w-full items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted/50 disabled:opacity-60"
              >
                {t("business.billing.downgrade")}
              </button>
            ) : (
              <span className="inline-flex min-h-[40px] w-full items-center justify-center rounded-lg border border-dashed border-border px-4 text-sm text-muted-foreground">
                {t("business.billing.downgradeUnavailable")}
              </span>
            );
          }

          return (
            <article
              key={plan.planKey}
              className={cn(
                "flex flex-col rounded-xl border p-5 shadow-sm",
                isCurrent ? "border-primary/40 ring-1 ring-primary/20" : "border-border/70 bg-card",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-lg font-semibold text-foreground">
                    {t(`business.billing.plans.${plan.planKey}.name`)}
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(`business.billing.plans.${plan.planKey}.tagline`)}
                  </p>
                </div>
                {plan.planKey === "premium" ? (
                  <Crown className="h-5 w-5 shrink-0 text-accent" aria-hidden />
                ) : null}
              </div>
              <div className="mt-4">
                {plan.isContactSales ? (
                  <p className="text-2xl font-bold text-foreground">{t("business.billing.customPricing")}</p>
                ) : (
                  <>
                    <p className="text-3xl font-bold tracking-tight text-foreground">{price}</p>
                    <p className="text-xs text-muted-foreground">{priceSuffix}</p>
                  </>
                )}
              </div>
              <ul className="mt-4 flex-1 space-y-2">
                {features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5">{action}</div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
