import type { BusinessSubscriptionTier, SubscriptionPlanKey } from "@prisma/client";

/** Maps Subscription.planKey → Business.subscriptionTier (1:1 enum literals). */
export function mapPlanKeyToBusinessTier(planKey: SubscriptionPlanKey): BusinessSubscriptionTier {
  switch (planKey) {
    case "basic":
      return "basic";
    case "premium":
      return "premium";
    case "enterprise":
      return "enterprise";
    default: {
      const _exhaustive: never = planKey;
      return _exhaustive;
    }
  }
}

/** Maps legacy Business.subscriptionTier → Subscription.planKey (1:1 enum literals). */
export function mapBusinessTierToPlanKey(tier: BusinessSubscriptionTier): SubscriptionPlanKey {
  switch (tier) {
    case "basic":
      return "basic";
    case "premium":
      return "premium";
    case "enterprise":
      return "enterprise";
    default: {
      const _exhaustive: never = tier;
      return _exhaustive;
    }
  }
}
