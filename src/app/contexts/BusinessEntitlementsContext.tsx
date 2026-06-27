import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { useSubscriptionEntitlements } from "../hooks/useSubscriptionEntitlements";

type BusinessEntitlementsValue = ReturnType<typeof useSubscriptionEntitlements>;

const BusinessEntitlementsContext = createContext<BusinessEntitlementsValue | null>(null);

/** Single entitlement fetch for the business dashboard shell. */
export function BusinessEntitlementsProvider({ children }: { children: ReactNode }) {
  const { user, authStatus } = useAuth();
  const enabled = authStatus === "authenticated" && user?.role === "business";
  const value = useSubscriptionEntitlements({
    enabled,
    role: enabled ? "business" : null,
  });
  return (
    <BusinessEntitlementsContext.Provider value={value}>{children}</BusinessEntitlementsContext.Provider>
  );
}

export function useBusinessEntitlementsContext(): BusinessEntitlementsValue | null {
  return useContext(BusinessEntitlementsContext);
}
