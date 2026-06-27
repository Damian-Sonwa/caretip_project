import {
  capabilitiesForTier,
  hasFeature as hasFeatureForTier,
  resolveSubscriptionTier,
  type FeatureKey,
  type SubscriptionLifecycleStatus,
} from "./subscriptionCapabilities";
import {
  getAccessSourceFromSession,
  getSubscriptionStatusFromSession,
  getSubscriptionTierFromSession,
  type EntitlementAccessSource,
} from "./subscriptionSessionCache";

/** Session cache has been primed (including explicit `accessSource: "none"`). */
export function isEntitlementsSessionPrimed(): boolean {
  return (
    getAccessSourceFromSession() !== null ||
    getSubscriptionStatusFromSession() !== null ||
    getSubscriptionTierFromSession() !== null
  );
}

export function sessionAccessSource(): EntitlementAccessSource | null {
  return getAccessSourceFromSession();
}

export function sessionSubscriptionStatus(): SubscriptionLifecycleStatus | null {
  return getSubscriptionStatusFromSession();
}

export function sessionHasActiveEntitlements(): boolean {
  const accessSource = getAccessSourceFromSession();
  if (accessSource === "subscription" || accessSource === "sponsored") return true;
  if (accessSource === "none") return false;

  const tier = resolveSubscriptionTier(getSubscriptionTierFromSession());
  const status = getSubscriptionStatusFromSession();
  if (tier != null && status != null && status !== "none") return true;
  return false;
}

export function sessionHasFeature(featureKey: FeatureKey): boolean {
  if (!sessionHasActiveEntitlements()) return false;
  const tier = resolveSubscriptionTier(getSubscriptionTierFromSession());
  return hasFeatureForTier(tier, featureKey, capabilitiesForTier(tier));
}

export function sessionResolvedTier() {
  return resolveSubscriptionTier(getSubscriptionTierFromSession());
}
