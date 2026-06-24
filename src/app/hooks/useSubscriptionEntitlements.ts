import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchBusinessProfile, getEmployeeProfile } from "../lib/api";
import {
  hasFeature as hasFeatureForTier,
  hasSubscriptionCapability,
  resolveSubscriptionTier,
  type BusinessSubscriptionTier,
  type FeatureKey,
  type SubscriptionCapability,
} from "@/app/lib/subscriptionCapabilities";
import {
  getSubscriptionTierFromSession,
  primeSubscriptionTierFromSession,
} from "../lib/subscriptionSessionCache";

type Role = "business" | "employee";

export function useSubscriptionEntitlements(opts: {
  enabled: boolean;
  role: Role | null | undefined;
  /** Skip network — use session cache only (mobile drawer). Ready only when cache is primed. */
  cacheOnly?: boolean;
}) {
  const sessionTier = getSubscriptionTierFromSession();
  const [tier, setTier] = useState<BusinessSubscriptionTier>(() =>
    resolveSubscriptionTier(sessionTier ?? undefined),
  );
  const [ready, setReady] = useState(() => Boolean(sessionTier));

  useEffect(() => {
    if (opts.cacheOnly) {
      const cached = getSubscriptionTierFromSession();
      if (cached) {
        setTier(resolveSubscriptionTier(cached));
        setReady(true);
      }
      return;
    }
    if (!opts.enabled || !opts.role) {
      setReady(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        if (opts.role === "business") {
          const profile = await fetchBusinessProfile({ silent: true });
          if (!cancelled) {
            const next = resolveSubscriptionTier(profile.subscriptionTier);
            primeSubscriptionTierFromSession(next);
            setTier(next);
          }
        } else {
          const profile = await getEmployeeProfile({ silent: true });
          if (!cancelled) {
            const next = resolveSubscriptionTier(profile.subscriptionTier);
            primeSubscriptionTierFromSession(next);
            setTier(next);
          }
        }
      } catch {
        if (!cancelled) {
          const fallback = resolveSubscriptionTier(getSubscriptionTierFromSession() ?? undefined);
          setTier(fallback);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [opts.cacheOnly, opts.enabled, opts.role]);

  const hasFeature = useCallback(
    (featureKey: FeatureKey) => hasFeatureForTier(tier, featureKey),
    [tier],
  );

  const hasCapability = useCallback(
    (capability: SubscriptionCapability) => hasSubscriptionCapability(tier, capability),
    [tier],
  );

  const tierFlags = useMemo(
    () => ({
      isBasic: tier === "basic",
      isPremium: tier === "premium",
      isEnterprise: tier === "enterprise",
    }),
    [tier],
  );

  const advancedAnalyticsEnabled = hasCapability("advancedAnalytics");

  return {
    tier,
    ready,
    ...tierFlags,
    hasFeature,
    hasCapability,
    advancedAnalyticsEnabled,
  };
}

/** Business dashboard entitlement hook with explicit loading/ready flags. */
export function useBusinessEntitlements(opts: { enabled: boolean }) {
  const result = useSubscriptionEntitlements({
    enabled: opts.enabled,
    role: opts.enabled ? "business" : null,
  });
  return {
    ...result,
    entitlements: {
      tier: result.tier,
      hasFeature: result.hasFeature,
      hasCapability: result.hasCapability,
      advancedAnalyticsEnabled: result.advancedAnalyticsEnabled,
      isBasic: result.isBasic,
      isPremium: result.isPremium,
      isEnterprise: result.isEnterprise,
    },
    isLoading: opts.enabled && !result.ready,
    isReady: result.ready,
  };
}
