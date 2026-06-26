import { useEffect } from "react";
import { Outlet } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { fetchBusinessProfile, hasClientAccessToken } from "../lib/api";
import { BILLING_CHECKOUT_SYNCED_EVENT } from "../lib/billingCheckoutSuccessSync";
import { primeSubscriptionEntitlementsFromSession } from "../lib/subscriptionSessionCache";
import { resolveSubscriptionTier } from "../lib/subscriptionCapabilities";
import { logClientError } from "../lib/clientLog";
import { isApiConnectivityError } from "../lib/errorMessages";
import type { BusinessAccountStatus } from "../hooks/useAuth";

function mapDbVerificationToStatus(
  v: "pending" | "verified" | "rejected" | undefined,
): BusinessAccountStatus | undefined {
  if (v === "pending") return "PENDING";
  if (v === "verified") return "APPROVED";
  if (v === "rejected") return "REJECTED";
  return undefined;
}

/**
 * Keeps manager `user.status` fresh without blocking the dashboard shell.
 * QR / public flows gate on `user.status` elsewhere.
 */
export function ApprovedBusinessGate() {
  const { user, updateUser, sessionValidated, authStatus } = useAuth();

  const canSyncProfile =
    sessionValidated &&
    authStatus === "authenticated" &&
    hasClientAccessToken() &&
    user?.role === "business" &&
    !user.impersonation;

  useEffect(() => {
    if (!canSyncProfile) return;
    let cancelled = false;
    void fetchBusinessProfile({ silent: true })
      .then((p) => {
        if (cancelled) return;
        const tier = resolveSubscriptionTier(p.subscriptionTier);
        const status = p.subscriptionStatus ?? (tier ? "active" : "none");
        primeSubscriptionEntitlementsFromSession({ tier, status });
        const s = mapDbVerificationToStatus(p.verificationStatus);
        if (s) updateUser({ status: s });
      })
      .catch((err: unknown) => {
        if (!isApiConnectivityError(err)) {
          logClientError("ApprovedBusinessGate", err);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [canSyncProfile, updateUser, user?.id]);

  useEffect(() => {
    if (!canSyncProfile) return;
    const refreshProfile = () => {
      if (!hasClientAccessToken()) return;
      void fetchBusinessProfile({ silent: true, revalidate: true })
        .then((p) => {
          const tier = resolveSubscriptionTier(p.subscriptionTier);
          const status = p.subscriptionStatus ?? (tier ? "active" : "none");
          primeSubscriptionEntitlementsFromSession({ tier, status });
          const s = mapDbVerificationToStatus(p.verificationStatus);
          if (s) updateUser({ status: s });
        })
        .catch(() => {});
    };
    window.addEventListener("focus", refreshProfile);
    window.addEventListener(BILLING_CHECKOUT_SYNCED_EVENT, refreshProfile);
    return () => {
      window.removeEventListener("focus", refreshProfile);
      window.removeEventListener(BILLING_CHECKOUT_SYNCED_EVENT, refreshProfile);
    };
  }, [canSyncProfile, updateUser]);

  if (!user) return null;

  return <Outlet />;
}
