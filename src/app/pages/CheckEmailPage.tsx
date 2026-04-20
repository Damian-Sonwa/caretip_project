import { useEffect, useMemo, useCallback, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthRecoveryLayout } from "@/app/components/auth/AuthRecoveryLayout";
import { useAuth } from "@/app/hooks/useAuth";
import { resolveInboxOpenTarget } from "@/app/lib/inboxDeepLink";
import { resendVerificationEmailSessionAPI } from "@/app/lib/api";
import { toUserFriendlyMessage } from "@/app/lib/errorMessages";
import { logClientError } from "@/app/lib/clientLog";

/**
 * Shown after password sign-up (and if an unverified session hits a protected route).
 * Users should not use the dashboard until they verify via the link in their inbox.
 */
export function CheckEmailPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [resendBusy, setResendBusy] = useState(false);

  const inboxTarget = useMemo(() => (user ? resolveInboxOpenTarget(user.email) : null), [user]);

  const openInbox = useCallback(() => {
    if (!inboxTarget || !user) return;
    try {
      window.open(inboxTarget.href, "_blank", "noopener,noreferrer");
    } catch {
      window.location.href = inboxTarget.href;
    }
  }, [inboxTarget, user]);

  const copyAddressAndHint = useCallback(async () => {
    if (!user?.email) return;
    try {
      await navigator.clipboard.writeText(user.email);
      toast.success("Email address copied. Open your inbox in a browser or app and look for CareTip.");
    } catch {
      toast.error("Could not copy automatically. Your address is shown above.");
    }
  }, [user?.email]);

  const handleResendVerification = useCallback(async () => {
    setResendBusy(true);
    try {
      const r = await resendVerificationEmailSessionAPI();
      toast.success(r.message || "We sent a new verification link. Check your inbox.");
    } catch (err) {
      logClientError("CheckEmailPage.resendVerification", err);
      toast.error(toUserFriendlyMessage(err));
    } finally {
      setResendBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  if (!user || !inboxTarget) {
    return null;
  }

  const isWebmail = inboxTarget.kind === "web";

  return (
    <AuthRecoveryLayout showFooterLink={false}>
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-bold text-[#1F2937] sm:text-2xl">
          Check your email to verify your account
        </h1>
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
            onClick={openInbox}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#197278] text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <Mail className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            Open my email
            {isWebmail ? (
              <span className="sr-only">Opens {inboxTarget.providerLabel}</span>
            ) : (
              <span className="sr-only">Opens your default email app</span>
            )}
          </button>

          {isWebmail && (
            <p className="text-[11px] leading-snug text-[#6B7280]">
              Opens {inboxTarget.providerLabel} in a new tab.
            </p>
          )}

          <button
            type="button"
            onClick={() => void copyAddressAndHint()}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-[#F3F4F6] text-sm font-semibold text-[#1F2937] transition hover:bg-neutral-100"
          >
            <Copy className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            Go to inbox manually
          </button>

          <button
            type="button"
            onClick={() => void handleResendVerification()}
            disabled={resendBusy}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#197278]/40 bg-white text-sm font-semibold text-[#197278] transition hover:bg-[#197278]/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resendBusy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Sending…
              </>
            ) : (
              "Resend verification email"
            )}
          </button>

          <p className="pt-1 text-[11px] text-[#6B7280]">
            Signed out?{" "}
            <Link
              to="/login"
              className="font-semibold text-[#197278] underline-offset-2 hover:underline"
              onClick={() => logout()}
            >
              Sign in
            </Link>{" "}
            and use resend there (password required).
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-neutral-200 pt-4">
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
