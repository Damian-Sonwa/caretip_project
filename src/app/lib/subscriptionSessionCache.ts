import type { BusinessSubscriptionTier } from "./subscriptionCapabilities";

let cachedTier: BusinessSubscriptionTier | null = null;

/** Prime from an early profile fetch so entitlements hooks can skip a duplicate round-trip. */
export function primeSubscriptionTierFromSession(tier: BusinessSubscriptionTier | undefined): void {
  if (tier) cachedTier = tier;
}

export function getSubscriptionTierFromSession(): BusinessSubscriptionTier | null {
  return cachedTier;
}

export function clearSubscriptionTierSession(): void {
  cachedTier = null;
}
