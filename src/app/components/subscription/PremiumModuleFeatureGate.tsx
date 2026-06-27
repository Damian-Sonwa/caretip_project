import type { ReactNode } from "react";
import type { FeatureKey } from "@/app/lib/subscriptionCapabilities";
import { FeatureGate } from "./FeatureGate";

type PremiumModuleFeatureGateProps = {
  featureKey: FeatureKey;
  children: ReactNode;
  enabled?: boolean;
};

/** Gates an entire module section — renders only LockedFeatureCard when access is denied (no partial premium UI). */
export function PremiumModuleFeatureGate({
  featureKey,
  children,
  enabled = true,
}: PremiumModuleFeatureGateProps) {
  return (
    <FeatureGate
      featureKey={featureKey}
      role="business"
      enabled={enabled}
      lockedCardClassName="w-full"
    >
      {children}
    </FeatureGate>
  );
}
