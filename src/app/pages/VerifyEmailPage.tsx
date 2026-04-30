import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { AuthRecoveryLayout } from "@/app/components/auth/AuthRecoveryLayout";
import { verifyEmailWithToken } from "@/app/lib/api";
import { toUserFriendlyMessage } from "@/app/lib/errorMessages";
import { logClientError } from "@/app/lib/clientLog";
import { useAuth } from "@/app/hooks/useAuth";

export function VerifyEmailPage() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const rawToken = sp.get("token")?.trim() ?? "";

  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(
    rawToken ? "verifying" : "error"
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!rawToken) return;
    let cancelled = false;
    (async () => {
      try {
        await verifyEmailWithToken(rawToken);
        if (cancelled) return;
        // Optimistically flip local flag so route guards unlock immediately.
        if (user?.isVerified === false) updateUser({ emailVerified: true, isVerified: true });
        setStatus("success");
      } catch (err) {
        logClientError("VerifyEmailPage", err);
        if (cancelled) return;
        setError(toUserFriendlyMessage(err));
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, rawToken, updateUser, user]);

  if (status === "success") {
    return (
      <AuthRecoveryLayout showFooterLink={false}>
        <div className="space-y-4 text-center">
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-2xl">Email verified</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Thanks. Your email is verified.</p>
          <Link
            to="/login"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            Continue
          </Link>
        </div>
      </AuthRecoveryLayout>
    );
  }

  if (status === "verifying") {
    return (
      <AuthRecoveryLayout showFooterLink={false}>
        <div className="space-y-3 text-center">
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-2xl">Verifying your email…</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">This will only take a moment.</p>
        </div>
      </AuthRecoveryLayout>
    );
  }

  return (
    <AuthRecoveryLayout showFooterLink={false}>
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-2xl">Verification failed</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {error || "This verification link is invalid or has expired."}
        </p>
        <Link
          to="/login"
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          Back to login
        </Link>
      </div>
    </AuthRecoveryLayout>
  );
}

