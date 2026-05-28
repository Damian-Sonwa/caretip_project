import type { BusinessSubscriptionTier } from "@prisma/client";

/** Product capabilities that can be enforced server-side (see subscription-readiness-audit.md). */
export type SubscriptionCapability =
  | "advancedAnalytics"
  | "csvExport"
  | "multiLocation"
  | "tableQr"
  | "employeeGoals"
  | "brandingCustomization";

const PREMIUM_CAPABILITIES: SubscriptionCapability[] = [
  "advancedAnalytics",
  "csvExport",
  "multiLocation",
  "tableQr",
  "employeeGoals",
  "brandingCustomization",
];

const ENTERPRISE_CAPABILITIES: SubscriptionCapability[] = [...PREMIUM_CAPABILITIES];

const TIER_CAPABILITIES: Record<BusinessSubscriptionTier, ReadonlySet<SubscriptionCapability>> = {
  basic: new Set<SubscriptionCapability>([]),
  premium: new Set(PREMIUM_CAPABILITIES),
  enterprise: new Set(ENTERPRISE_CAPABILITIES),
};

export function hasSubscriptionCapability(
  tier: BusinessSubscriptionTier,
  capability: SubscriptionCapability,
): boolean {
  return TIER_CAPABILITIES[tier]?.has(capability) ?? false;
}

export function minimumTierForCapability(capability: SubscriptionCapability): BusinessSubscriptionTier {
  if (TIER_CAPABILITIES.basic.has(capability)) return "basic";
  if (TIER_CAPABILITIES.premium.has(capability)) return "premium";
  return "enterprise";
}

/** Basic tier: summary-only stats; premium+ may use analytics/full scopes. */
export function isStatsScopeAllowedForTier(
  tier: BusinessSubscriptionTier,
  scope: "summary" | "analytics" | "full",
): boolean {
  if (scope === "summary") return true;
  return hasSubscriptionCapability(tier, "advancedAnalytics");
}

/** Employee tips API scopes (account is always allowed). */
export function isEmployeeTipsScopeAllowedForTier(
  tier: BusinessSubscriptionTier,
  scope: "account" | "summary" | "analytics" | "full",
): boolean {
  if (scope === "account" || scope === "summary") return true;
  return hasSubscriptionCapability(tier, "advancedAnalytics");
}

export const BASIC_MAX_LOCATIONS = 1;
