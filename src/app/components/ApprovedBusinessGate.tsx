import { useEffect } from "react";
import { Outlet } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { fetchBusinessProfile, hasClientAccessToken } from "../lib/api";
import { primeSubscriptionTierFromSession } from "../lib/subscriptionSessionCache";
import { logClientError } from "../lib/clientLog";
import { isApiConnectivityError } from "../lib/errorMessages";
import type { BusinessAccountStatus } from "../hooks/useAuth";
import { GlobalAppLoadingHold } from "./GlobalAppLoadingHold";

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
        primeSubscriptionTierFromSession(p.subscriptionTier);
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
    const refresh = () => {
      if (!hasClientAccessToken()) return;
      void fetchBusinessProfile({ silent: true })
        .then((p) => {
          const s = mapDbVerificationToStatus(p.verificationStatus);
          if (s) updateUser({ status: s });
        })
        .catch(() => {});
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [canSyncProfile, updateUser]);

  if (!user) return <GlobalAppLoadingHold />;

  return <Outlet />;
}
