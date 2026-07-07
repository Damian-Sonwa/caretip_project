import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { FeatureKey } from "@/app/lib/subscriptionCapabilities";

export type FeatureInfoIntent = "activation" | "upgrade";

type FeatureInfoDrawerState = {
  featureKey: FeatureKey;
  intent: FeatureInfoIntent;
};

type FeatureInfoDrawerContextValue = {
  openFeatureInfo: (featureKey: FeatureKey, intent?: FeatureInfoIntent) => void;
  closeFeatureInfo: () => void;
};

const FeatureInfoDrawerContext = createContext<FeatureInfoDrawerContextValue | null>(null);

export function FeatureInfoDrawerProvider({
  children,
  renderDrawer,
}: {
  children: ReactNode;
  renderDrawer: (props: {
    state: FeatureInfoDrawerState | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => ReactNode;
}) {
  const [state, setState] = useState<FeatureInfoDrawerState | null>(null);

  const openFeatureInfo = useCallback((featureKey: FeatureKey, intent: FeatureInfoIntent = "upgrade") => {
    setState({ featureKey, intent });
  }, []);

  const closeFeatureInfo = useCallback(() => {
    setState(null);
  }, []);

  const value = useMemo(
    () => ({ openFeatureInfo, closeFeatureInfo }),
    [openFeatureInfo, closeFeatureInfo],
  );

  return (
    <FeatureInfoDrawerContext.Provider value={value}>
      {children}
      {renderDrawer({
        state,
        open: state != null,
        onOpenChange: (open) => {
          if (!open) closeFeatureInfo();
        },
      })}
    </FeatureInfoDrawerContext.Provider>
  );
}

export function useFeatureInfoDrawer(): FeatureInfoDrawerContextValue {
  const ctx = useContext(FeatureInfoDrawerContext);
  if (!ctx) {
    throw new Error("useFeatureInfoDrawer must be used within FeatureInfoDrawerProvider");
  }
  return ctx;
}

export function useOptionalFeatureInfoDrawer(): FeatureInfoDrawerContextValue | null {
  return useContext(FeatureInfoDrawerContext);
}
