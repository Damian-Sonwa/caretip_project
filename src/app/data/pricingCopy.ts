import type { IndustryId } from "./caretipIndustries";
import { resolvePricingAudienceSegment } from "./caretipIndustries";

/** i18n prefix for pricing page copy (hero, intro, tier descriptions). */
export type PricingCopyScope =
  | `staticPages.pricing.industryCopy.${IndustryId}`
  | `staticPages.pricing.audience.operations`
  | `staticPages.pricing.audience.solo`
  | `staticPages.pricing.audience.general`;

const INDUSTRY_COPY_IDS = new Set<IndustryId>(["hotel", "logistics", "midwife", "freelancer"]);

export function resolvePricingCopyScope(industry: IndustryId): PricingCopyScope {
  if (INDUSTRY_COPY_IDS.has(industry)) {
    return `staticPages.pricing.industryCopy.${industry}`;
  }
  const segment = resolvePricingAudienceSegment(industry);
  return `staticPages.pricing.audience.${segment}`;
}
