import type { TFunction } from "i18next";
import type { SubscriptionPlanKey, BillingStatus } from "./api";
import type { BusinessSubscriptionTier } from "./subscriptionCapabilities";
import { mapPlanKeyToPricingTier } from "../data/pricingPlanCatalog";

export type SubscriptionPlanDisplayKey = SubscriptionPlanKey | BusinessSubscriptionTier;

/** Marketing label for a SaaS plan key (basic → Basic, premium → Pro, enterprise → Premium). */
export function subscriptionPlanDisplayName(
  planKey: SubscriptionPlanDisplayKey | null | undefined,
  t: TFunction,
): string {
  if (!planKey) return t("subscription.activation.noPlan");
  const marketingTier = mapPlanKeyToPricingTier(planKey);
  return t(`staticPages.pricing.tiers.${marketingTier}.name`);
}

/** Sidebar / account status for an active paid plan (e.g. "Basic Plan"). */
export function subscriptionPlanStatusLabel(
  planKey: SubscriptionPlanDisplayKey | null | undefined,
  t: TFunction,
): string {
  if (!planKey) return t("dashboardNav.business.subscriptionStatus.none");
  const marketingTier = mapPlanKeyToPricingTier(planKey);
  const statusKey =
    marketingTier === "starter" ? "starter" : marketingTier === "business" ? "business" : "enterprise";
  return t(`dashboardNav.business.subscriptionStatus.${statusKey}`);
}

/** Trial status label derived from the actual trial plan (e.g. "Pro Trial"). */
export function subscriptionTrialStatusLabel(
  planKey: SubscriptionPlanDisplayKey | null | undefined,
  t: TFunction,
): string {
  return t("dashboardNav.business.subscriptionStatus.trialLabel", {
    plan: subscriptionPlanDisplayName(planKey, t),
  });
}

/** Plan key to show during an active trial — prefers explicit trialPlanKey from billing. */
export function resolveBillingTrialPlanKey(
  billing: Pick<BillingStatus, "trialPlanKey" | "planKey">,
): SubscriptionPlanKey | null {
  return billing.trialPlanKey ?? billing.planKey;
}
