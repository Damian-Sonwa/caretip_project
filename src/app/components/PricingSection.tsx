import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";
import type { BillingCycle, Industry } from "../data/pricingTypes";
import type { PricingTierKey } from "../data/pricingTiers";
import type { PricingCopyScope } from "../data/pricingCopy";
import type { TFunction } from "i18next";
import { pricingPageUi } from "@/components/pricing/pricingPageUi";
import { scheduleIdleWork } from "@/lib/publicRouteDefer";
import { usePublicMountProbe } from "@/lib/publicMountProbe";

export interface TippingTier {
  tierKey?: PricingTierKey;
  name: string;
  tagline?: string;
  feeLine: string;
  feeNote: string;
  features: string[];
  description: string;
  buttonText: string;
  isPopular: boolean;
  icon: ComponentType<{ className?: string }>;
}

interface PricingSectionProps {
  tiers: TippingTier[];
  billingCycle: BillingCycle;
  industry: Industry;
  copyScope?: PricingCopyScope;
}

function TierFeatureList({ features }: { features: string[] }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    scheduleIdleWork(() => setReady(true), 900);
  }, []);

  if (!ready) {
    return <div className="caretip-pricing-tier-features-skeleton" aria-hidden />;
  }

  return (
    <ul className="caretip-pricing-tier-features">
      {features.map((feature, idx) => (
        <li key={idx} className="caretip-pricing-tier-features__item">
          <span className="caretip-pricing-tier-features__check" aria-hidden>
            <Check className="size-3" strokeWidth={2.75} />
          </span>
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

function tierCtaHref(tierKey: PricingTierKey | undefined): string {
  if (tierKey === "enterprise") return "/contact?intent=demo";
  return "/contact?intent=demo";
}

function resolveTierPricing(
  tier: TippingTier,
  billingCycle: BillingCycle,
  t: TFunction,
): { feeLine: string; feeNote: string } {
  if (!tier.tierKey || tier.tierKey === "enterprise") {
    return { feeLine: tier.feeLine, feeNote: tier.feeNote };
  }

  const prefix = `staticPages.pricing.tiers.${tier.tierKey}`;
  const cycleSuffix = billingCycle === "yearly" ? "Yearly" : "Monthly";
  const feeLineKey = `${prefix}.fee${cycleSuffix}`;
  const feeNoteKey = `${prefix}.feeNote${cycleSuffix}`;
  const feeLine = t(feeLineKey);
  const feeNote = t(feeNoteKey);

  return {
    feeLine: feeLine !== feeLineKey ? feeLine : tier.feeLine,
    feeNote: feeNote !== feeNoteKey ? feeNote : tier.feeNote,
  };
}

/**
 * Hospitality SaaS plans — monthly/yearly prices reflect the billing cycle toggle.
 */
export function PricingSection({
  tiers,
  billingCycle,
  industry,
  copyScope = "staticPages.pricing.audience.general",
}: PricingSectionProps) {
  usePublicMountProbe("PricingSection");
  const { t } = useTranslation();

  return (
    <div
      id="pricing-plans-panel"
      role="tabpanel"
      aria-labelledby={`pricing-billing-${billingCycle}`}
      className="caretip-pricing-tiers"
      data-billing-cycle={billingCycle}
      data-industry={industry}
      data-copy-scope={copyScope}
    >
      <div className="caretip-pricing-tiers__grid">
        {tiers.map((tier) => {
          const isEnterprise = tier.tierKey === "enterprise";
          const { feeLine, feeNote } = resolveTierPricing(tier, billingCycle, t);
          const description =
            tier.tierKey &&
            t(`${copyScope}.tiers.${tier.tierKey}.description`, {
              defaultValue: tier.description,
            });

          return (
            <article
              key={tier.tierKey ?? tier.name}
              className={cn(
                "caretip-pricing-tier-card",
                tier.isPopular && "caretip-pricing-tier-card--featured",
                isEnterprise && "caretip-pricing-tier-card--enterprise",
              )}
            >
              {tier.isPopular ? (
                <div className="caretip-pricing-tier-card__badge">
                  <Sparkles className="size-3 shrink-0" aria-hidden />
                  {t("staticPages.pricing.popular")}
                </div>
              ) : null}

              <div className="caretip-pricing-tier-card__header">
                <h3 className="caretip-pricing-tier-card__name">{tier.name}</h3>
                {tier.tagline ? (
                  <p className="caretip-pricing-tier-card__tagline">{tier.tagline}</p>
                ) : null}
              </div>

              <div className="caretip-pricing-tier-card__divider" aria-hidden />

              <div className="caretip-pricing-tier-card__price">
                <p className="caretip-pricing-tier-card__fee">{feeLine}</p>
                <p className="caretip-pricing-tier-card__fee-note">{feeNote}</p>
              </div>

              <div className="caretip-pricing-tier-card__divider" aria-hidden />

              <p className="caretip-pricing-tier-card__desc">{description}</p>

              <TierFeatureList features={tier.features} />

              <Link
                to={tierCtaHref(tier.tierKey)}
                className={cn(
                  isEnterprise
                    ? pricingPageUi.cardCtaEnterprise
                    : tier.isPopular
                      ? pricingPageUi.cardCtaPrimary
                      : pricingPageUi.cardCtaSecondary,
                )}
              >
                {tier.buttonText}
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
