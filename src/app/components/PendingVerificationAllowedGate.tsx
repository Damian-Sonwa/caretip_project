import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { fetchBusinessProfile } from "../lib/api";
import { logClientError } from "../lib/clientLog";
import { PageLoader } from "./PageLoader";

function mapDbVerificationToStatus(
  v: "pending" | "verified" | "rejected" | undefined
): "PENDING" | "APPROVED" | "REJECTED" | undefined {
  if (v === "pending") return "PENDING";
  if (v === "verified") return "APPROVED";
  if (v === "rejected") return "REJECTED";
  return undefined;
}

/** Only pending / rejected managers should stay on `/verification-pending`; approved users go to the dashboard. */
export function PendingVerificationAllowedGate() {
  const { user, updateUser } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "business" || user.impersonation) {
      setReady(true);
      return;
    }
    let cancelled = false;
    void fetchBusinessProfile()
      .then((p) => {
        if (cancelled) return;
        const s = mapDbVerificationToStatus(p.verificationStatus);
        if (s) updateUser({ status: s });
      })
      .catch((e) => logClientError("PendingVerificationAllowedGate", e))
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role, user?.impersonation, updateUser]);

  if (user?.impersonation) {
    return <Navigate to="/dashboard" replace />;
  }

  if (user?.role === "business" && !user.impersonation && !ready) {
    return <PageLoader message="Syncing account status…" />;
  }

  if (user?.status === "APPROVED") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
