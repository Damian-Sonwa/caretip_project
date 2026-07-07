import type { BusinessSubscriptionTier, SubscriptionLifecycleStatus } from "./subscriptionCapabilities";

export type EntitlementAccessSource = "none" | "subscription" | "sponsored";

const ENTITLEMENTS_CACHE_VERSION = "2";
const VERSION_STORAGE_KEY = "caretip.subscriptionEntitlementsVersion";
const TIER_STORAGE_KEY = "caretip.subscriptionTier";
const STATUS_STORAGE_KEY = "caretip.subscriptionStatus";
const ACCESS_SOURCE_STORAGE_KEY = "caretip.accessSource";

let cachedTier: BusinessSubscriptionTier | null = null;
let cachedStatus: SubscriptionLifecycleStatus | null = null;
let cachedAccessSource: EntitlementAccessSource | null = null;

function readStoredTier(): BusinessSubscriptionTier | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(TIER_STORAGE_KEY);
    if (raw === "basic" || raw === "premium" || raw === "enterprise") return raw;
  } catch {
    /* ignore quota / privacy mode */
  }
  return null;
}

function readStoredStatus(): SubscriptionLifecycleStatus | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STATUS_STORAGE_KEY);
    if (
      raw === "none" ||
      raw === "trialing" ||
      raw === "active" ||
      raw === "past_due" ||
      raw === "canceled" ||
      raw === "unpaid" ||
      raw === "incomplete"
    ) {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function readStoredAccessSource(): EntitlementAccessSource | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ACCESS_SOURCE_STORAGE_KEY);
    if (raw === "none" || raw === "subscription" || raw === "sponsored") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

/** Drop stale Option A session cache after internal Basic migration (Commit 4). */
export function migrateSubscriptionEntitlementsCacheIfNeeded(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const storedVersion = sessionStorage.getItem(VERSION_STORAGE_KEY);
    if (storedVersion === ENTITLEMENTS_CACHE_VERSION) return;
    clearSubscriptionTierSession();
    sessionStorage.setItem(VERSION_STORAGE_KEY, ENTITLEMENTS_CACHE_VERSION);
  } catch {
    /* ignore */
  }
}

/** Prime from profile fetch so entitlement hooks can render on first paint. */
export function primeSubscriptionEntitlementsFromSession(opts: {
  tier?: BusinessSubscriptionTier | null;
  status?: SubscriptionLifecycleStatus | null;
  accessSource?: EntitlementAccessSource | null;
}): void {
  if (opts.status !== undefined && opts.status !== null) {
    cachedStatus = opts.status;
    try {
      sessionStorage.setItem(STATUS_STORAGE_KEY, opts.status);
    } catch {
      /* ignore */
    }
  }

  if (opts.accessSource !== undefined && opts.accessSource !== null) {
    cachedAccessSource = opts.accessSource;
    try {
      sessionStorage.setItem(ACCESS_SOURCE_STORAGE_KEY, opts.accessSource);
    } catch {
      /* ignore */
    }
  }

  if (opts.tier === null) {
    cachedTier = null;
    try {
      sessionStorage.removeItem(TIER_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return;
  }

  if (opts.tier) {
    cachedTier = opts.tier;
    try {
      sessionStorage.setItem(TIER_STORAGE_KEY, opts.tier);
      sessionStorage.setItem(VERSION_STORAGE_KEY, ENTITLEMENTS_CACHE_VERSION);
    } catch {
      /* ignore */
    }
  }
}

/** @deprecated Use primeSubscriptionEntitlementsFromSession */
export function primeSubscriptionTierFromSession(tier: BusinessSubscriptionTier | null | undefined): void {
  if (!tier) {
    primeSubscriptionEntitlementsFromSession({ tier: null, status: "none" });
    return;
  }
  primeSubscriptionEntitlementsFromSession({ tier, status: "active" });
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

export function getSubscriptionStatusFromSession(): SubscriptionLifecycleStatus | null {
  if (cachedStatus) return cachedStatus;
  const stored = readStoredStatus();
  if (stored) {
    cachedStatus = stored;
    return stored;
  }
  return null;
}

export function getAccessSourceFromSession(): EntitlementAccessSource | null {
  if (cachedAccessSource) return cachedAccessSource;
  const stored = readStoredAccessSource();
  if (stored) {
    cachedAccessSource = stored;
    return stored;
  }
  return null;
}

export function clearSubscriptionTierSession(): void {
  cachedTier = null;
  cachedStatus = null;
  cachedAccessSource = null;
  try {
    sessionStorage.removeItem(TIER_STORAGE_KEY);
    sessionStorage.removeItem(STATUS_STORAGE_KEY);
    sessionStorage.removeItem(ACCESS_SOURCE_STORAGE_KEY);
    sessionStorage.removeItem(VERSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
