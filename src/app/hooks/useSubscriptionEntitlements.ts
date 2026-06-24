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
  /** Skip network on mount — use session cache only (mobile drawer / nav). */
  cacheOnly?: boolean;
}) {
  const sessionTier = opts.role === "business" ? getSubscriptionTierFromSession() : null;
  const [tier, setTier] = useState<BusinessSubscriptionTier>(
    resolveSubscriptionTier(sessionTier ?? undefined),
  );
  const [ready, setReady] = useState(Boolean(sessionTier) || opts.cacheOnly === true);

  useEffect(() => {
    if (opts.cacheOnly) {
      setTier(resolveSubscriptionTier(sessionTier ?? undefined));
      setReady(true);
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
          if (!cancelled) setTier(resolveSubscriptionTier(profile.subscriptionTier));
        }
      } catch {
        if (!cancelled) setTier(resolveSubscriptionTier(sessionTier ?? undefined));
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [opts.cacheOnly, opts.enabled, opts.role, sessionTier]);

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
