import type { ReactNode } from "react";
import type { FeatureKey } from "@/app/lib/subscriptionCapabilities";
import { useSubscriptionEntitlements } from "@/app/hooks/useSubscriptionEntitlements";
import { LockedFeatureCard } from "./LockedFeatureCard";

type FeatureGateProps = {
  featureKey: FeatureKey;
  role: "business" | "employee";
  enabled?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  /** When false, render nothing instead of LockedFeatureCard */
  showLockedCard?: boolean;
  lockedCardCompact?: boolean;
  lockedCardClassName?: string;
};

export function FeatureGate({
  featureKey,
  role,
  enabled = true,
  children,
  fallback,
  showLockedCard = true,
  lockedCardCompact = false,
  lockedCardClassName,
}: FeatureGateProps) {
  const { tier, status, ready, hasFeature } = useSubscriptionEntitlements({
    enabled,
    role,
  });

  if (!enabled) return null;
  if (!ready) return children;
  if (hasFeature(featureKey)) return <>{children}</>;

  if (fallback) return <>{fallback}</>;
  if (!showLockedCard) return null;

  return (
    <LockedFeatureCard
      featureKey={featureKey}
      tier={tier}
      subscriptionStatus={status}
      compact={lockedCardCompact}
      className={lockedCardClassName}
    />
  );
}
