import type { BillingCycle } from "@/app/data/pricingTypes";
import type { IndustryId } from "@/app/data/caretipIndustries";
import type { PricingCopyScope } from "@/app/data/pricingCopy";
import { PricingSection } from "@/app/components/PricingSection";

type PricingCardsHotelsProps = {
  billingCycle: BillingCycle;
  industry: IndustryId;
  copyScope: PricingCopyScope;
};

/** Hotels & logistics — existing subscription tiers (Starter / Business / Enterprise). */
export function PricingCardsHotels({ billingCycle, industry, copyScope }: PricingCardsHotelsProps) {
  return (
    <PricingSection billingCycle={billingCycle} industry={industry} copyScope={copyScope} />
  );
}
