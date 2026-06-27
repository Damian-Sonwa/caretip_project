import type { SubscriptionPlanKey } from "@prisma/client";
import { isSubscriptionBillingEnabled } from "../config/featureFlags.js";
import { isSubscriptionTrialEnabled } from "../config/subscriptionTrial.js";
import { prisma } from "../prisma.js";
import { isStripeConfigured } from "./stripe.service.js";
import { resolveSubscriptionEntitlements } from "./subscriptionEntitlement.service.js";

export type TrialEligibilityReason =
  | "eligible"
  | "sponsored"
  | "active_subscription"
  | "trial_used"
  | "billing_unavailable";

export type TrialEligibility = {
  eligible: boolean;
  trialUsed: boolean;
  reason: TrialEligibilityReason;
  /** Plan evaluated during the last trial — used to preselect post-trial upgrade. */
  lastTrialPlanKey: SubscriptionPlanKey | null;
};

export function isTrialPlanKeyEligibleForStripeTrial(planKey: SubscriptionPlanKey): boolean {
  return planKey === "basic" || planKey === "premium";
}

export async function resolveTrialEligibilityForBusiness(
  businessId: string,
): Promise<TrialEligibility> {
  const entitlements = await resolveSubscriptionEntitlements(businessId);

  if (entitlements.accessSource === "sponsored") {
    return {
      eligible: false,
      trialUsed: false,
      reason: "sponsored",
      lastTrialPlanKey: null,
    };
  }

  if (entitlements.hasActiveEntitlements) {
    return {
      eligible: false,
      trialUsed: false,
      reason: "active_subscription",
      lastTrialPlanKey: entitlements.plan,
    };
  }

  if (!isSubscriptionBillingEnabled() || !isStripeConfigured() || !isSubscriptionTrialEnabled()) {
    return {
      eligible: false,
      trialUsed: false,
      reason: "billing_unavailable",
      lastTrialPlanKey: null,
    };
  }

  const sub = await prisma.subscription.findUnique({
    where: { businessId },
    select: {
      planKey: true,
      trialStartedAt: true,
      trialExpiredAt: true,
    },
  });

  const trialUsed = Boolean(sub?.trialStartedAt ?? sub?.trialExpiredAt);

  if (trialUsed) {
    return {
      eligible: false,
      trialUsed: true,
      reason: "trial_used",
      lastTrialPlanKey: sub?.planKey ?? null,
    };
  }

  return {
    eligible: true,
    trialUsed: false,
    reason: "eligible",
    lastTrialPlanKey: null,
  };
}

export async function assertTrialCheckoutAllowed(
  businessId: string,
  planKey: SubscriptionPlanKey,
): Promise<void> {
  const eligibility = await resolveTrialEligibilityForBusiness(businessId);
  if (!eligibility.eligible) {
    throw new Error(
      eligibility.reason === "trial_used"
        ? "Free trial has already been used for this business"
        : "Free trial is not available",
    );
  }
  if (!isTrialPlanKeyEligibleForStripeTrial(planKey)) {
    throw new Error("Free trial is not available for the selected plan");
  }
}
