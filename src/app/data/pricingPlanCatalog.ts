import type { TFunction } from "i18next";
import type { SubscriptionPlanKey } from "../lib/api";
import {
  PRICING_TIER_DEFINITIONS,
  mapPricingTierFromI18n,
  type PricingTierKey,
} from "./pricingConfig";

export {
  PRICING_TIER_DEFINITIONS,
  PRICING_TIER_FEATURE_SLOT_COUNT,
  buildPricingTierFeatures,
  mapPricingTierFromI18n,
  type PricingTierDefinition,
  type PricingTierKey,
} from "./pricingConfig";

/** Marketing tier (Starter / Business / Enterprise) → SaaS plan key (basic / premium / enterprise). */
export function mapPricingTierToPlanKey(tier: PricingTierKey): SubscriptionPlanKey {
  switch (tier) {
    case "starter":
      return "basic";
    case "business":
      return "premium";
    case "enterprise":
      return "enterprise";
    default:
      return "basic";
  }
}

export function mapPlanKeyToPricingTier(planKey: SubscriptionPlanKey): PricingTierKey {
  switch (planKey) {
    case "basic":
      return "starter";
    case "premium":
      return "business";
    case "enterprise":
      return "enterprise";
    default:
      return "starter";
  }
}

export type PricingTierViewModel = ReturnType<typeof mapPricingTierFromI18n>;

/** Build all pricing tiers from the shared i18n catalog (`staticPages.pricing.tiers.*`). */
export function buildPricingTierCatalog(t: TFunction): PricingTierViewModel[] {
  return PRICING_TIER_DEFINITIONS.map((def) => mapPricingTierFromI18n(t, def));
}
