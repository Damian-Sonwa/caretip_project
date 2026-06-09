import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { fetchBusinessProfile, hasClientAccessToken } from "../lib/api";
import { primeSubscriptionTierFromSession } from "../lib/subscriptionSessionCache";
import { logClientError } from "../lib/clientLog";
import { isApiConnectivityError } from "../lib/errorMessages";
import type { BusinessAccountStatus } from "../hooks/useAuth";
import { GlobalAppLoadingHold } from "./GlobalAppLoadingHold";
import {
  APP_LOADING_PRIORITY,
  useAppLoadingRegistration,
} from "../context/AppLoadingManager";
import { AppRouteGateShell } from "./AppRouteGateShell";

function mapDbVerificationToStatus(
  v: "pending" | "verified" | "rejected" | undefined,
): BusinessAccountStatus | undefined {
  if (v === "pending") return "PENDING";
  if (v === "verified") return "APPROVED";
  if (v === "rejected") return "REJECTED";
  return undefined;
}

/**
 * Loads latest KYC from the API on every visit (fixes stale `user.status` after admin verification).
 * Dashboard stays accessible for all managers; QR / public flows gate on `user.status` elsewhere.
 */
export function ApprovedBusinessGate() {
  const { t } = useTranslation();
  const { user, updateUser, sessionValidated, authStatus } = useAuth();
  const [profileSynced, setProfileSynced] = useState(false);

  const canSyncProfile =
    sessionValidated &&
    authStatus === "authenticated" &&
    hasClientAccessToken() &&
    user?.role === "business" &&
    !user.impersonation;

  useEffect(() => {
    if (!canSyncProfile) {
      setProfileSynced(true);
      return;
    }
    let cancelled = false;
    setProfileSynced(false);
    void fetchBusinessProfile()
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
      })
      .finally(() => {
        if (!cancelled) setProfileSynced(true);
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

  const syncBlocking = canSyncProfile && !profileSynced;
  useAppLoadingRegistration(
    "dashboard-kyc-gate",
    APP_LOADING_PRIORITY.ROUTE_GUARD,
    syncBlocking,
    t("common.syncingAccountStatus"),
  );

  if (!user) return <GlobalAppLoadingHold />;

  if (user.impersonation) {
    return <Outlet />;
  }

  if (syncBlocking) {
    return <AppRouteGateShell />;
  }

  return <Outlet />;
}
