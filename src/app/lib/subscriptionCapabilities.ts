/** Mirrors backend `subscriptionCapabilities.ts` for UI gating (server remains source of truth). */

export type BusinessSubscriptionTier = "basic" | "premium" | "enterprise";

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

const TIER_CAPABILITIES: Record<BusinessSubscriptionTier, ReadonlySet<SubscriptionCapability>> = {
  basic: new Set(),
  premium: new Set(PREMIUM_CAPABILITIES),
  enterprise: new Set(PREMIUM_CAPABILITIES),
};

export function hasSubscriptionCapability(
  tier: BusinessSubscriptionTier | undefined | null,
  capability: SubscriptionCapability,
): boolean {
  const resolved = tier ?? "premium";
  return TIER_CAPABILITIES[resolved]?.has(capability) ?? false;
}

export function capabilitiesForTier(
  tier: BusinessSubscriptionTier | undefined | null,
): SubscriptionCapability[] {
  const resolved = tier ?? "premium";
  return [...(TIER_CAPABILITIES[resolved] ?? [])];
}
