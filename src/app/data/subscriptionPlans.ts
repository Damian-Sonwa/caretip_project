import type { SubscriptionPlanKey } from "../lib/api";

export type SubscriptionPlanDefinition = {
  planKey: SubscriptionPlanKey;
  monthlyPrice: string | null;
  yearlyPrice: string | null;
  yearlyMonthlyEquivalent: string | null;
  isContactSales: boolean;
  featureCount: number;
};

/** SaaS plan catalog for dashboard billing (display only — Stripe charges via backend price IDs). */
export const SUBSCRIPTION_PLAN_DEFINITIONS: readonly SubscriptionPlanDefinition[] = [
  {
    planKey: "basic",
    monthlyPrice: "€0",
    yearlyPrice: "€0",
    yearlyMonthlyEquivalent: "€0",
    isContactSales: false,
    featureCount: 6,
  },
  {
    planKey: "premium",
    monthlyPrice: "€49",
    yearlyPrice: "€470",
    yearlyMonthlyEquivalent: "€39",
    isContactSales: false,
    featureCount: 8,
  },
  {
    planKey: "enterprise",
    monthlyPrice: null,
    yearlyPrice: null,
    yearlyMonthlyEquivalent: null,
    isContactSales: true,
    featureCount: 8,
  },
] as const;

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
