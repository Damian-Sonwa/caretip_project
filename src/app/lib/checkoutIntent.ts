import type { SubscriptionBillingCycle, SubscriptionPlanKey } from "./api";
import type { BillingCycle } from "../data/pricingTypes";
import type { PricingTierKey } from "../data/pricingConfig";
import { mapPricingTierToPlanKey } from "../data/pricingPlanCatalog";

export { mapPricingTierToPlanKey as mapMarketingPlanToPlanKey } from "../data/pricingPlanCatalog";

const CHECKOUT_INTENT_KEY = "caretip.checkoutIntent";
const CHECKOUT_SYNC_PLAN_KEY = "caretip.checkoutExpectedPlan";

export type CheckoutIntent = {
  marketingPlan: PricingTierKey;
  planKey: SubscriptionPlanKey;
  billingCycle: SubscriptionBillingCycle;
  trial: boolean;
};

export function parseMarketingPlan(raw: string | null): PricingTierKey | null {
  if (raw === "starter" || raw === "business" || raw === "enterprise") return raw;
  return null;
}

export function parseBillingCycleParam(raw: string | null): SubscriptionBillingCycle {
  return raw === "yearly" ? "yearly" : "monthly";
}

export function parseTrialParam(raw: string | null): boolean {
  return raw === "1" || raw === "true";
}

export function buildCheckoutIntent(params: {
  marketingPlan: PricingTierKey;
  billingCycle: BillingCycle | SubscriptionBillingCycle;
  trial?: boolean;
}): CheckoutIntent {
  const billingCycle = params.billingCycle === "yearly" ? "yearly" : "monthly";
  return {
    marketingPlan: params.marketingPlan,
    planKey: mapPricingTierToPlanKey(params.marketingPlan),
    billingCycle,
    trial: params.trial === true,
  };
}

export function buildCheckoutIntentSearchParams(intent: CheckoutIntent): URLSearchParams {
  const params = new URLSearchParams();
  params.set("plan", intent.marketingPlan);
  params.set("cycle", intent.billingCycle);
  if (intent.trial) params.set("trial", "1");
  return params;
}

export function buildAuthPathForCheckoutIntent(
  intent: CheckoutIntent,
  mode: "signup" | "login",
): string {
  const qs = buildCheckoutIntentSearchParams(intent).toString();
  return `/${mode}${qs ? `?${qs}` : ""}`;
}

export function saveCheckoutIntent(intent: CheckoutIntent): void {
  try {
    sessionStorage.setItem(CHECKOUT_INTENT_KEY, JSON.stringify(intent));
  } catch {
    // ignore quota / private mode
  }
}

export function peekCheckoutIntent(): CheckoutIntent | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_INTENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutIntent;
    if (!parsed?.marketingPlan || !parsed?.planKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearCheckoutIntent(): void {
  try {
    sessionStorage.removeItem(CHECKOUT_INTENT_KEY);
  } catch {
    // ignore
  }
}

export function persistCheckoutIntentFromSearchParams(searchParams: URLSearchParams): CheckoutIntent | null {
  const marketingPlan = parseMarketingPlan(searchParams.get("plan"));
  if (!marketingPlan || marketingPlan === "enterprise") return null;

  const intent = buildCheckoutIntent({
    marketingPlan,
    billingCycle: parseBillingCycleParam(searchParams.get("cycle")),
    trial: parseTrialParam(searchParams.get("trial")),
  });
  saveCheckoutIntent(intent);
  return intent;
}

export function shouldIncludeTrialForIntent(intent: CheckoutIntent): boolean {
  return intent.trial && intent.planKey === "premium";
}

export function primeCheckoutSyncExpectation(planKey: SubscriptionPlanKey): void {
  try {
    sessionStorage.setItem(CHECKOUT_SYNC_PLAN_KEY, planKey);
  } catch {
    // ignore
  }
}

export function getCheckoutSyncExpectation(): SubscriptionPlanKey | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_SYNC_PLAN_KEY);
    if (raw === "basic" || raw === "premium" || raw === "enterprise") return raw;
    return null;
  } catch {
    return null;
  }
}

export function clearCheckoutSyncExpectation(): void {
  try {
    sessionStorage.removeItem(CHECKOUT_SYNC_PLAN_KEY);
  } catch {
    // ignore
  }
}
