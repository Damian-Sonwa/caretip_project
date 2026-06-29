import { useAuth } from "@/app/hooks/useAuth";
import { useBusinessEntitlementsContext } from "@/app/contexts/BusinessEntitlementsContext";
import { useSubscriptionEntitlements } from "@/app/hooks/useSubscriptionEntitlements";

/** Shared entitlement source for business sidebar widgets. */
export function useBusinessSidebarEntitlements() {
  const { user } = useAuth();
  const businessContext = useBusinessEntitlementsContext();
  const fallback = useSubscriptionEntitlements({
    enabled: user?.role === "business" && businessContext == null,
    role: user?.role === "business" ? "business" : null,
  });
  return businessContext ?? fallback;
}
