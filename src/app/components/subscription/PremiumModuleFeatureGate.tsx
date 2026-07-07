import type { ReactNode } from "react";
import type { FeatureKey } from "@/app/lib/subscriptionCapabilities";
import { FeatureGate } from "./FeatureGate";
import { ProUpgradeCard } from "./ProUpgradeCard";

type PremiumModuleFeatureGateProps = {
  featureKey: FeatureKey;
  children: ReactNode;
  enabled?: boolean;
};

/** Gates an entire module — shows dashboard Pro upgrade card when access is denied. */
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
      lockedFallback={<ProUpgradeCard className="w-full" />}
    >
      {children}
    </FeatureGate>
  );
}
