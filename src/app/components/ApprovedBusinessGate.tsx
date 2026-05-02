import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { fetchBusinessProfile } from "../lib/api";
import { logClientError } from "../lib/clientLog";
import type { BusinessAccountStatus } from "../hooks/useAuth";
import { PageLoader } from "./PageLoader";

function mapDbVerificationToStatus(
  v: "pending" | "verified" | "rejected" | undefined
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
      .catch((err: unknown) => {
        logClientError("ApprovedBusinessGate", err);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role, user?.impersonation, updateUser]);

  useEffect(() => {
    if (!user || user.role !== "business" || user.impersonation) return;
    const refresh = () => {
      void fetchBusinessProfile()
        .then((p) => {
          const s = mapDbVerificationToStatus(p.verificationStatus);
          if (s) updateUser({ status: s });
        })
        .catch(() => {});
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [user?.id, user?.role, user?.impersonation, updateUser]);

  if (!user) return null;

  if (user.impersonation) {
    return <Outlet />;
  }

  if (user.role === "business" && !user.impersonation && !ready) {
    return <PageLoader message="Syncing account status…" />;
  }

  return <Outlet />;
}
