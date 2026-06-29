import type { TFunction } from "i18next";
import type { BillingStatus } from "@/app/lib/api";
import type { BusinessSubscriptionTier, SubscriptionLifecycleStatus } from "@/app/lib/subscriptionCapabilities";

export const BUSINESS_SIDEBAR_BILLING_HREF = "/dashboard/billing/subscription";

export type SidebarUpgradeCtaViewModel = {
  label: string;
};

type EntitlementSlice = {
  tier: BusinessSubscriptionTier | null;
  status: SubscriptionLifecycleStatus;
  hasActiveEntitlements: boolean;
  isSponsored: boolean;
  ready: boolean;
};

export function resolveSidebarUpgradeCtaState(
  entitlements: EntitlementSlice,
  billing: BillingStatus | null,
  t: TFunction,
): SidebarUpgradeCtaViewModel | null {
  if (!entitlements.ready) return null;

  const manageSubscription = t("dashboardNav.business.upgradeCta.manageSubscription");
  const upgrade = t("dashboardNav.business.upgradeCta.upgrade");

  const isEnterprise =
    entitlements.tier === "enterprise" &&
    entitlements.hasActiveEntitlements &&
    entitlements.tier != null;

  if (isEnterprise || entitlements.isSponsored || billing?.accessSource === "sponsored") {
    return { label: manageSubscription };
  }

  return { label: upgrade };
}
