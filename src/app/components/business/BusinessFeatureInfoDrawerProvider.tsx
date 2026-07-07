import { useCallback, type ReactNode } from "react";
import type { FeatureKey } from "@/app/lib/subscriptionCapabilities";
import {
  FeatureInfoDrawerProvider,
  type FeatureInfoIntent,
} from "../subscription/FeatureInfoDrawerContext";
import { FeatureInfoDrawer } from "../subscription/FeatureInfoDrawer";

export function BusinessFeatureInfoDrawerProvider({ children }: { children: ReactNode }) {
  const renderDrawer = useCallback(
    ({
      state,
      open,
      onOpenChange,
    }: {
      state: { featureKey: FeatureKey; intent: FeatureInfoIntent } | null;
      open: boolean;
      onOpenChange: (open: boolean) => void;
    }) => (
      <FeatureInfoDrawer
        featureKey={state?.featureKey ?? null}
        intent={state?.intent}
        open={open}
        onOpenChange={onOpenChange}
      />
    ),
    [],
  );

  return (
    <FeatureInfoDrawerProvider renderDrawer={renderDrawer}>
      {children}
    </FeatureInfoDrawerProvider>
  );
}
