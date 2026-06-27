import type { ReactNode } from "react";
import { FeatureInfoDrawerProvider } from "../subscription/FeatureInfoDrawerContext";
import { FeatureInfoDrawer } from "../subscription/FeatureInfoDrawer";

export function BusinessFeatureInfoDrawerProvider({ children }: { children: ReactNode }) {
  return (
    <FeatureInfoDrawerProvider
      renderDrawer={({ state, open, onOpenChange }) => (
        <FeatureInfoDrawer
          featureKey={state?.featureKey ?? null}
          intent={state?.intent}
          open={open}
          onOpenChange={onOpenChange}
        />
      )}
    >
      {children}
    </FeatureInfoDrawerProvider>
  );
}
