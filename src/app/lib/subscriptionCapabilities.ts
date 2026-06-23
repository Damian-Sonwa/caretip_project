/** Mirrors backend `subscriptionCapabilities.ts` for UI gating (server remains source of truth). */

export type BusinessSubscriptionTier = "basic" | "premium" | "enterprise";

export type SubscriptionCapability =
  | "advancedAnalytics"
  | "csvExport"
  | "multiLocation"
  | "tableQr"
  | "employeeGoals"
  | "brandingCustomization";

/** Enterprise-only capabilities (placeholders — enforced when product ships). */
export type EnterpriseFeatureKey =
  | "apiAccess"
  | "multiBrand"
  | "customReporting"
  | "dedicatedOnboarding"
  | "accountManager";

export type FeatureKey = SubscriptionCapability | EnterpriseFeatureKey;

const PREMIUM_CAPABILITIES: SubscriptionCapability[] = [
  "advancedAnalytics",
  "csvExport",
  "multiLocation",
  "tableQr",
  "employeeGoals",
  "brandingCustomization",
];

const ENTERPRISE_FEATURES: EnterpriseFeatureKey[] = [
  "apiAccess",
  "multiBrand",
  "customReporting",
  "dedicatedOnboarding",
  "accountManager",
];

const TIER_CAPABILITIES: Record<BusinessSubscriptionTier, ReadonlySet<SubscriptionCapability>> = {
  basic: new Set(),
  premium: new Set(PREMIUM_CAPABILITIES),
  enterprise: new Set(PREMIUM_CAPABILITIES),
};

const DEFAULT_TIER: BusinessSubscriptionTier = "basic";

export function resolveSubscriptionTier(
  tier: BusinessSubscriptionTier | undefined | null,
): BusinessSubscriptionTier {
  return tier ?? DEFAULT_TIER;
}

export function isEnterpriseFeatureKey(key: FeatureKey): key is EnterpriseFeatureKey {
  return (ENTERPRISE_FEATURES as readonly string[]).includes(key);
}

export function hasSubscriptionCapability(
  tier: BusinessSubscriptionTier | undefined | null,
  capability: SubscriptionCapability,
): boolean {
  const resolved = resolveSubscriptionTier(tier);
  return TIER_CAPABILITIES[resolved]?.has(capability) ?? false;
}

export function hasFeature(
  tier: BusinessSubscriptionTier | undefined | null,
  featureKey: FeatureKey,
): boolean {
  const resolved = resolveSubscriptionTier(tier);
  if (isEnterpriseFeatureKey(featureKey)) {
    return resolved === "enterprise";
  }
  return hasSubscriptionCapability(resolved, featureKey);
}

export function minimumTierForFeature(featureKey: FeatureKey): BusinessSubscriptionTier {
  if (isEnterpriseFeatureKey(featureKey)) return "enterprise";
  if (TIER_CAPABILITIES.basic.has(featureKey as SubscriptionCapability)) return "basic";
  return "premium";
}

export function capabilitiesForTier(
  tier: BusinessSubscriptionTier | undefined | null,
): SubscriptionCapability[] {
  const resolved = resolveSubscriptionTier(tier);
  return [...(TIER_CAPABILITIES[resolved] ?? [])];
}
