import type { BusinessSubscriptionTier } from "./subscriptionCapabilities";

export type MarketingPlanKey = "starter" | "business" | "enterprise";

const TIER_RANK: Record<BusinessSubscriptionTier, number> = {
  basic: 0,
  premium: 1,
  enterprise: 2,
};

const MARKETING_PLANS: MarketingPlanKey[] = ["starter", "business", "enterprise"];

const PLAN_MIN_TIER: Record<MarketingPlanKey, BusinessSubscriptionTier> = {
  starter: "basic",
  business: "premium",
  enterprise: "enterprise",
};

export function isFeatureIncludedInMarketingPlan(
  requiredTier: BusinessSubscriptionTier,
  plan: MarketingPlanKey,
): boolean {
  return TIER_RANK[PLAN_MIN_TIER[plan]] >= TIER_RANK[requiredTier];
}

/** Marketing plan keys that include a feature at the given minimum SaaS tier. */
export function marketingPlansIncludingFeature(
  requiredTier: BusinessSubscriptionTier,
): MarketingPlanKey[] {
  return MARKETING_PLANS.filter((plan) => isFeatureIncludedInMarketingPlan(requiredTier, plan));
}

export function allMarketingPlans(): MarketingPlanKey[] {
  return [...MARKETING_PLANS];
}

export function marketingPlanLabelKey(plan: MarketingPlanKey): string {
  return `dashboardNav.business.planLabels.${plan}`;
}
