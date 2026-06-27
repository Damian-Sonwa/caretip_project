import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { BillingStatus, SubscriptionPlanKey } from "@/app/lib/api";
import { createBillingCheckoutSession } from "@/app/lib/api";
import { toUserFriendlyMessage } from "@/app/lib/errorMessages";
import { mapPricingTierToPlanKey, type PricingTierKey } from "@/app/data/pricingPlanCatalog";
import { subscriptionPlanDisplayName } from "../../../../lib/subscriptionPlanDisplayName";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { pricingPageUi } from "@/components/pricing/pricingPageUi";

const TRIAL_TIER_OPTIONS: PricingTierKey[] = ["starter", "business", "enterprise"];

type BillingTrialPlanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billingCycle: "monthly" | "yearly";
};

export function BillingTrialPlanDialog({
  open,
  onOpenChange,
  billingCycle,
}: BillingTrialPlanDialogProps) {
  const { t } = useTranslation();
  const [selectedTier, setSelectedTier] = useState<PricingTierKey>("business");
  const [busy, setBusy] = useState(false);

  async function startTrialCheckout() {
    const planKey = mapPricingTierToPlanKey(selectedTier);
    if (planKey === "enterprise") {
      onOpenChange(false);
      window.location.assign("/contact?intent=enterprise");
      return;
    }

    setBusy(true);
    try {
      const session = await createBillingCheckoutSession({
        planKey,
        billingCycle,
        includeTrial: true,
        checkoutFlow: "billing",
      });
      if (session.url) {
        window.location.assign(session.url);
        return;
      }
      toast.error(t("business.billing.checkoutNoUrl"));
    } catch (err) {
      toast.error(toUserFriendlyMessage(err) || t("business.billing.checkoutError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="space-y-2 border-b border-border/60 bg-gradient-to-br from-emerald-50/80 via-background to-stone-50/80 px-6 py-5 text-left">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {t("business.billing.trialFlow.chooseTitle")}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {t("business.billing.trialFlow.chooseDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 px-6 py-5" role="radiogroup" aria-label={t("business.billing.trialFlow.chooseTitle")}>
          {TRIAL_TIER_OPTIONS.map((tierKey) => {
            const planKey = mapPricingTierToPlanKey(tierKey);
            const isSelected = selectedTier === tierKey;
            const tierName = t(`staticPages.pricing.tiers.${tierKey}.name`);
            const isPopular = tierKey === "business";

            return (
              <label
                key={tierKey}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                  isSelected
                    ? "border-primary/40 bg-primary/[0.06] ring-1 ring-primary/20"
                    : "border-border/70 bg-background hover:bg-muted/30",
                )}
              >
                <input
                  type="radio"
                  name="trial-plan"
                  className="mt-1 shrink-0 accent-[var(--caretip-brand-orange,#e9781c)]"
                  checked={isSelected}
                  onChange={() => setSelectedTier(tierKey)}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-foreground">{tierName}</span>
                    {isPopular ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                        {t("staticPages.pricing.popular")}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {t(`business.billing.trialFlow.planHint.${planKey}`)}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-border/60 bg-muted/10 px-6 py-4 sm:flex-col">
          <button
            type="button"
            disabled={busy}
            onClick={() => void startTrialCheckout()}
            className={cn(pricingPageUi.cardCtaPrimary, "w-full justify-center")}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {selectedTier === "enterprise"
              ? t("business.billing.contactSales")
              : t("business.billing.trialFlow.confirmCta")}
          </button>
          <p className="text-center text-[11px] leading-snug text-muted-foreground">
            {t("business.billing.trialPaymentNote")}
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type BillingTrialSectionProps = {
  billing: BillingStatus;
  billingCycle: "monthly" | "yearly";
  autoOpenTrial?: boolean;
  onAutoOpenHandled?: () => void;
};

export function BillingTrialSection({
  billing,
  billingCycle,
  autoOpenTrial = false,
  onAutoOpenHandled,
}: BillingTrialSectionProps) {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (autoOpenTrial && billing.trialEligible) {
      setDialogOpen(true);
      onAutoOpenHandled?.();
    }
  }, [autoOpenTrial, billing.trialEligible, onAutoOpenHandled]);

  if (billing.accessSource === "sponsored") return null;

  if (billing.trialEligible) {
    return (
      <>
        <section
          id={BILLING_START_TRIAL_HASH}
          className="billing-trial-promo"
          aria-labelledby="billing-trial-promo-title"
        >
          <div className="billing-trial-promo__content">
            <h3 id="billing-trial-promo-title" className="text-lg font-semibold tracking-tight text-foreground">
              {t("business.billing.trialFlow.promoTitle")}
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t("business.billing.trialFlow.promoBody")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="billing-trial-promo__cta"
          >
            {t("business.billing.trialFlow.promoCta")}
          </button>
        </section>
        <p className="text-center text-xs text-muted-foreground">
          {t("business.billing.trialFlow.orSubscribeBelow")}
        </p>
        <BillingTrialPlanDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          billingCycle={billingCycle}
        />
      </>
    );
  }

  if (billing.trialUsed && !billing.trialEligible && billing.status === "none") {
    if (billing.lastTrialPlanKey) {
      return <BillingTrialExpiredUpgrade billing={billing} billingCycle={billingCycle} />;
    }
    return (
      <section className="rounded-xl border border-border/70 bg-muted/20 px-5 py-4">
        <p className="text-sm text-muted-foreground">{t("business.billing.trialFlow.alreadyUsed")}</p>
      </section>
    );
  }

  return null;
}

function BillingTrialExpiredUpgrade({
  billing,
  billingCycle,
}: {
  billing: BillingStatus;
  billingCycle: "monthly" | "yearly";
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const planKey = billing.lastTrialPlanKey as SubscriptionPlanKey;

  if (planKey === "enterprise") {
    return (
      <section className="billing-trial-expired">
        <h3 className="text-lg font-semibold text-foreground">
          {t("business.billing.trialFlow.expiredTitle", {
            plan: subscriptionPlanDisplayName("enterprise", t),
          })}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">{t("business.billing.trialFlow.expiredEnterpriseBody")}</p>
        <Link to="/contact?intent=enterprise" className={cn(pricingPageUi.cardCtaPrimary, "mt-4 inline-flex w-full justify-center sm:w-auto")}>
          {t("business.billing.contactSales")}
        </Link>
      </section>
    );
  }

  const planName = subscriptionPlanDisplayName(planKey, t);

  async function handleUpgrade() {
    setBusy(true);
    try {
      const session = await createBillingCheckoutSession({
        planKey,
        billingCycle,
        includeTrial: false,
        checkoutFlow: "billing",
      });
      if (session.url) {
        window.location.assign(session.url);
        return;
      }
      toast.error(t("business.billing.checkoutNoUrl"));
    } catch (err) {
      toast.error(toUserFriendlyMessage(err) || t("business.billing.checkoutError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="billing-trial-expired">
      <h3 className="text-lg font-semibold text-foreground">
        {t("business.billing.trialFlow.expiredTitle", { plan: planName })}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("business.billing.trialFlow.expiredBody", { plan: planName })}
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleUpgrade()}
        className={cn(pricingPageUi.cardCtaPrimary, "mt-4 inline-flex w-full justify-center sm:w-auto")}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {t("business.billing.trialFlow.upgradeCta", { plan: planName })}
      </button>
    </section>
  );
}

export const BILLING_START_TRIAL_HASH = "start-trial";
