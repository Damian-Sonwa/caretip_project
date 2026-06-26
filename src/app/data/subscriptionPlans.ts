import type { SubscriptionPlanKey } from "../lib/api";

/** Plan rank helpers for billing upgrade/downgrade logic. Display copy lives in `pricingPlanCatalog`. */

const PLAN_RANK: Record<SubscriptionPlanKey, number> = {
  basic: 0,
  premium: 1,
  enterprise: 2,
};

export function compareSubscriptionPlans(a: SubscriptionPlanKey, b: SubscriptionPlanKey): number {
  return PLAN_RANK[a] - PLAN_RANK[b];
}

export function isUpgrade(from: SubscriptionPlanKey, to: SubscriptionPlanKey): boolean {
  return compareSubscriptionPlans(to, from) > 0;
}

export function isDowngrade(from: SubscriptionPlanKey, to: SubscriptionPlanKey): boolean {
  return compareSubscriptionPlans(to, from) < 0;
}
