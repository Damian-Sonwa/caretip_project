/**
 * Pricing page UI state — billing amounts are not computed yet; monthly fees are shown.
 */

import {
  type IndustryId,
  PRICING_INDUSTRIES,
  type PricingAudienceSegment,
  resolvePricingAudienceSegment,
} from "./caretipIndustries";

export type BillingCycle = "monthly" | "yearly";

export type Industry = IndustryId;

export { PRICING_INDUSTRIES, type PricingAudienceSegment, resolvePricingAudienceSegment };

export const BILLING_CYCLES: readonly BillingCycle[] = ["monthly", "yearly"] as const;

/** Yearly billing toggle shows annual prices and the save badge on the pricing page. */
export const YEARLY_BILLING_ENABLED = true;

export type PricingPageUiState = {
  billingCycle: BillingCycle;
  industry: Industry;
};

export const DEFAULT_PRICING_UI_STATE: PricingPageUiState = {
  billingCycle: "monthly",
  industry: "restaurant",
};
