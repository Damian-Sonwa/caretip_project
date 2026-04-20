import { useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { fetchBusinessProfile } from "../lib/api";
import { logClientError } from "../lib/clientLog";
import { useSocket } from "../hooks/useSocket";
import { useRealtimeFallback } from "../hooks/useRealtimeFallback";

/**
 * Shown at `/verification-pending` while KYC is not yet approved (`verified` in PostgreSQL).
 * Realtime: `verification_updated` from Socket.io; DB poll only when disconnected (fallback).
 */
export function PendingVerification() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const syncVerification = useCallback(async () => {
    if (!user || user.role !== "business" || user.impersonation) return;
    try {
      const p = await fetchBusinessProfile();
      const next =
        p.verificationStatus === "pending"
          ? "PENDING"
          : p.verificationStatus === "verified"
            ? "APPROVED"
            : "REJECTED";
      updateUser({ status: next });
      if (p.verificationStatus === "verified") {
        navigate("/dashboard", { replace: true });
      }
    } catch (err: unknown) {
      logClientError("PendingVerification.sync", err);
    }
  }, [user, navigate, updateUser]);

  const { socket, connected } = useSocket(
    Boolean(user && user.role === "business" && !user.impersonation)
  );

  useRealtimeFallback(connected, syncVerification, 60000);

  useEffect(() => {
    if (!user || user.impersonation) return;
    if (user.status === "APPROVED") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    void syncVerification();
  }, [syncVerification]);

  useEffect(() => {
    if (!socket || user?.role !== "business" || user.impersonation) return;
    const h = () => void syncVerification();
    socket.on("verification_updated", h);
    return () => {
      socket.off("verification_updated", h);
    };
  }, [socket, user?.role, user?.impersonation, syncVerification]);

  const rejected = user?.status === "REJECTED";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-2xl font-semibold text-foreground mb-3">
          {rejected ? "Verification update" : "Verification pending"}
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          {rejected ? (
            <>
              Your business verification was not approved. Please contact support if you have questions.
            </>
          ) : (
            <>
              Welcome to CareTip! Our team is currently reviewing your business details to ensure the highest
              security standards. You will receive an email once your dashboard is activated.
            </>
          )}
        </p>
        <Link
          to="/"
          className="inline-flex justify-center px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
