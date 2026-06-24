import type { BusinessSubscriptionTier } from "./subscriptionCapabilities";

const STORAGE_KEY = "caretip.subscriptionTier";

let cachedTier: BusinessSubscriptionTier | null = null;

function readStoredTier(): BusinessSubscriptionTier | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw === "basic" || raw === "premium" || raw === "enterprise") return raw;
  } catch {
    /* ignore quota / privacy mode */
  }
  return null;
}

/** Prime from profile fetch so entitlement hooks can render the final tier on first paint. */
export function primeSubscriptionTierFromSession(tier: BusinessSubscriptionTier | undefined): void {
  if (!tier) return;
  cachedTier = tier;
  try {
    sessionStorage.setItem(STORAGE_KEY, tier);
  } catch {
    /* ignore */
  }
}

export function getSubscriptionTierFromSession(): BusinessSubscriptionTier | null {
  if (cachedTier) return cachedTier;
  const stored = readStoredTier();
  if (stored) {
    cachedTier = stored;
    return stored;
  }
  return null;
}

export function clearSubscriptionTierSession(): void {
  cachedTier = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
