import type { IndustryId } from "./caretipIndustries";
import type { PricingCopyScope } from "./pricingCopy";

/** Top-level pricing page audience — controls which card set is shown. */
export type PricingPageAudience = "hotels_logistics" | "midwives_freelancers";

export const PRICING_PAGE_AUDIENCES: readonly PricingPageAudience[] = [
  "hotels_logistics",
  "midwives_freelancers",
] as const;

export const DEFAULT_PRICING_AUDIENCE: PricingPageAudience = "hotels_logistics";

export function resolveCopyScopeForAudience(audience: PricingPageAudience): PricingCopyScope {
  return audience === "hotels_logistics"
    ? "staticPages.pricing.audience.operations"
    : "staticPages.pricing.audience.solo";
}

/** Representative industry id for analytics / data attributes (not shown in UI). */
export function resolveIndustryForAudience(audience: PricingPageAudience): IndustryId {
  return audience === "hotels_logistics" ? "hotel" : "midwife";
}
