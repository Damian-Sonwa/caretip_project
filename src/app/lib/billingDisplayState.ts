import type { BillingStatus, SubscriptionPlanKey } from "./api";

/** Resolved plan key from billing DTO (internal keys unchanged). */
export function resolveBillingPlanKey(billing: BillingStatus): SubscriptionPlanKey | null {
  return billing.planKey ?? billing.subscriptionTier ?? null;
}

/** True when the venue has an operational plan (Basic counts as active). */
export function hasOperationalBillingPlan(billing: BillingStatus): boolean {
  if (billing.accessSource === "sponsored") return true;
  const planKey = resolveBillingPlanKey(billing);
  if (!planKey) return false;
  if (planKey === "basic") return true;
  return billing.status !== "none";
}

export function isOnInternalBasicPlan(billing: BillingStatus): boolean {
  const planKey = resolveBillingPlanKey(billing);
  const trialing = billing.isTrial || billing.status === "trialing";
  return planKey === "basic" && !trialing;
}

/** Post-trial downgrade: user consumed Pro trial and is back on internal Basic. */
export function shouldShowTrialExpiredUpgrade(billing: BillingStatus): boolean {
  if (billing.accessSource === "sponsored") return false;
  if (!billing.trialUsed || billing.trialEligible) return false;
  if (!isOnInternalBasicPlan(billing)) return false;
  const lastTrial = billing.lastTrialPlanKey;
  return lastTrial === "premium" || lastTrial == null;
}
