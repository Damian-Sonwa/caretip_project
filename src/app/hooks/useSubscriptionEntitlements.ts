import { useCallback, useEffect, useState } from "react";
import { fetchBusinessProfile, getEmployeeProfile } from "../lib/api";
import {
  hasSubscriptionCapability,
  type BusinessSubscriptionTier,
  type SubscriptionCapability,
} from "../lib/subscriptionCapabilities";
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
  const [tier, setTier] = useState<BusinessSubscriptionTier>(sessionTier ?? "premium");
  const [ready, setReady] = useState(Boolean(sessionTier) || opts.cacheOnly === true);

  useEffect(() => {
    if (opts.cacheOnly) {
      setTier(sessionTier ?? "premium");
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
            const next = profile.subscriptionTier ?? "premium";
            primeSubscriptionTierFromSession(next);
            setTier(next);
          }
        } else {
          const profile = await getEmployeeProfile({ silent: true });
          if (!cancelled) setTier(profile.subscriptionTier ?? "premium");
        }
      } catch {
        if (!cancelled) setTier(sessionTier ?? "premium");
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [opts.cacheOnly, opts.enabled, opts.role, sessionTier]);

  const hasCapability = useCallback(
    (capability: SubscriptionCapability) => hasSubscriptionCapability(tier, capability),
    [tier],
  );

  const advancedAnalyticsEnabled = hasCapability("advancedAnalytics");

  return { tier, ready, hasCapability, advancedAnalyticsEnabled };
}
