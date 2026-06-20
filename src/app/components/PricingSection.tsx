import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { Check, Star } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";
import type { PricingTierKey } from "../data/pricingTiers";
import { scheduleIdleWork } from "@/lib/publicRouteDefer";
import { usePublicMountProbe } from "@/lib/publicMountProbe";

export interface TippingTier {
  tierKey?: PricingTierKey;
  name: string;
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
}

function TierFeatureList({ features }: { features: string[] }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    scheduleIdleWork(() => setReady(true), 900);
  }, []);

  if (!ready) {
    return <div className="mb-6 h-28" aria-hidden />;
  }

  return (
    <ul className="space-y-3 mb-6">
      {features.map((feature, idx) => (
        <li key={idx} className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check className="w-3 h-3 text-accent" />
          </div>
          <span className="text-sm text-foreground">{feature}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Hospitality tipping platform fees — one-time tips only (Stripe PaymentIntents).
 * No recurring plans or invoice billing.
 */
export function PricingSection({ tiers }: PricingSectionProps) {
  usePublicMountProbe("PricingSection");
  const { t } = useTranslation();
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const Icon = tier.icon;

          return (
            <div
              key={tier.name}
              className={cn(
                "caretip-pricing-tier-card relative rounded-2xl p-6 border-2 transition-[border-color,box-shadow,transform] duration-200",
                tier.isPopular
                  ? "border-accent shadow-lg shadow-accent/20 bg-gradient-to-br from-card via-card to-accent/5"
                  : "border-border bg-card hover:border-accent/30",
              )}
            >
              {tier.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                  <Star className="w-3 h-3 fill-current" />
                  {t("staticPages.pricing.popular")}
                </div>
              )}

              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                  tier.isPopular ? "bg-accent/10" : "bg-muted",
                )}
              >
                <Icon
                  className={cn(
                    "w-6 h-6",
                    tier.isPopular ? "text-accent" : "text-muted-foreground",
                  )}
                />
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">{tier.name}</h3>

              <div className="mb-4">
                <p className="text-3xl font-bold text-foreground">{tier.feeLine}</p>
                <p className="text-sm text-muted-foreground mt-1">{tier.feeNote}</p>
              </div>

              <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>

              <TierFeatureList features={tier.features} />

              <Link
                to="/signup"
                className={cn(
                  "w-full flex justify-center py-3 rounded-lg font-semibold transition-[color,background-color,border-color,box-shadow] duration-200 text-sm",
                  tier.isPopular
                    ? "bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20"
                    : "bg-background border-2 border-border text-foreground hover:border-accent hover:bg-accent hover:text-white",
                )}
              >
                {tier.buttonText}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
