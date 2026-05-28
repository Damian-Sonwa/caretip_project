import { useCallback, useEffect, useState } from "react";
import { fetchBusinessProfile, getEmployeeProfile } from "../lib/api";
import {
  hasSubscriptionCapability,
  type BusinessSubscriptionTier,
  type SubscriptionCapability,
} from "../lib/subscriptionCapabilities";

type Role = "business" | "employee";

export function useSubscriptionEntitlements(opts: {
  enabled: boolean;
  role: Role | null | undefined;
}) {
  const [tier, setTier] = useState<BusinessSubscriptionTier>("premium");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!opts.enabled || !opts.role) {
      setReady(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        if (opts.role === "business") {
          const profile = await fetchBusinessProfile({ silent: true });
          if (!cancelled) setTier(profile.subscriptionTier ?? "premium");
        } else {
          const profile = await getEmployeeProfile({ silent: true });
          if (!cancelled) setTier(profile.subscriptionTier ?? "premium");
        }
      } catch {
        if (!cancelled) setTier("premium");
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [opts.enabled, opts.role]);

  const hasCapability = useCallback(
    (capability: SubscriptionCapability) => hasSubscriptionCapability(tier, capability),
    [tier],
  );

  const advancedAnalyticsEnabled = hasCapability("advancedAnalytics");

  return { tier, ready, hasCapability, advancedAnalyticsEnabled };
}
