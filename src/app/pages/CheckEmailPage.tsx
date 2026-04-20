import { useEffect } from "react";
import { useNavigate } from "react-router";
import { AuthRecoveryLayout } from "@/app/components/auth/AuthRecoveryLayout";
import { useAuth } from "@/app/hooks/useAuth";

/**
 * Shown after password sign-up (and if an unverified session hits a protected route).
 * Users should not use the dashboard until they verify via the link in their inbox.
 */
export function CheckEmailPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <AuthRecoveryLayout showFooterLink={false}>
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-bold text-[#1F2937] sm:text-2xl">Verify your email</h1>
        <p className="text-sm leading-relaxed text-[#6B7280]">
          We sent a verification link to{" "}
          <span className="font-semibold text-[#1F2937]">{user.email}</span>. Open it on this device
          (or copy the link into the browser where you use CareTip), then sign in again.
        </p>
        <p className="text-xs text-[#6B7280]">
          The dashboard stays unavailable until your email is verified.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#EB992C] text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            I’ve verified — sign in
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/signup", { replace: true });
            }}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-neutral-200 bg-[#F3F4F6] text-sm font-semibold text-[#1F2937] transition hover:bg-neutral-100"
          >
            Use a different email
          </button>
        </div>
      </div>
    </AuthRecoveryLayout>
  );
}
