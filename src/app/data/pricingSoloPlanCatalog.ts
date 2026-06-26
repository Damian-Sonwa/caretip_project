import type { TFunction } from "i18next";
import { Gift, Sparkles, Crown } from "lucide-react";
import type { ComponentType } from "react";
import type { PricingTierKey } from "./pricingConfig";
import type { PricingTierViewModel } from "./pricingPlanCatalog";

export type SoloPricingPlanKey = "free" | "professional" | "enterprise";

type SoloPlanDefinition = {
  planKey: SoloPricingPlanKey;
  /** Maps to existing tier card styling hooks. */
  tierKey: PricingTierKey;
  icon: ComponentType<{ className?: string }>;
  isPopular: boolean;
  available: boolean;
};

export const SOLO_PRICING_PLAN_DEFINITIONS: readonly SoloPlanDefinition[] = [
  {
    planKey: "free",
    tierKey: "starter",
    icon: Gift,
    isPopular: true,
    available: true,
  },
  {
    planKey: "professional",
    tierKey: "business",
    icon: Sparkles,
    isPopular: false,
    available: false,
  },
  {
    planKey: "enterprise",
    tierKey: "enterprise",
    icon: Crown,
    isPopular: false,
    available: false,
  },
] as const;

const SOLO_FEATURE_SLOT_COUNT = 12;

function buildSoloPlanFeatures(t: TFunction, planKey: SoloPricingPlanKey): string[] {
  const features: string[] = [];
  for (let i = 0; i < SOLO_FEATURE_SLOT_COUNT; i++) {
    const key = `staticPages.pricing.soloPlans.${planKey}.f${i}`;
    const value = t(key);
    if (value && value !== key) features.push(value);
  }
  return features;
}

export type SoloPricingPlanViewModel = PricingTierViewModel & {
  planKey: SoloPricingPlanKey;
  available: boolean;
};

/** UI-only solo / freelancer pricing cards — not wired to Stripe checkout. */
export function buildSoloPricingPlanCatalog(t: TFunction): SoloPricingPlanViewModel[] {
  return SOLO_PRICING_PLAN_DEFINITIONS.map((def) => {
    const prefix = `staticPages.pricing.soloPlans.${def.planKey}`;
    return {
      planKey: def.planKey,
      tierKey: def.tierKey,
      available: def.available,
      name: t(`${prefix}.name`),
      tagline: t(`${prefix}.tagline`),
      feeLine: t(`${prefix}.feeLine`),
      feeNote: t(`${prefix}.feeNote`),
      description: t(`${prefix}.description`),
      features: buildSoloPlanFeatures(t, def.planKey),
      buttonText: t(`${prefix}.button`),
      isPopular: def.isPopular,
      icon: def.icon,
    };
  });
}
