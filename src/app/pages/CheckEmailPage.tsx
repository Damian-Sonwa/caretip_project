import { useEffect, useMemo, useCallback, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, Copy, Loader2, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import { AuthRecoveryLayout } from "@/app/components/auth/AuthRecoveryLayout";
import { useAuth, getPostAuthRedirect } from "@/app/hooks/useAuth";
import { resolveInboxOpenTarget } from "@/app/lib/inboxDeepLink";
import { resendVerificationEmailAPI, resendVerificationEmailSessionAPI } from "@/app/lib/api";
import { toUserFriendlyMessage } from "@/app/lib/errorMessages";
import { logClientError } from "@/app/lib/clientLog";

/**
 * Shown after password sign-up (and if an unverified session hits a protected route).
 * Users should not use the dashboard until they verify via the link in their inbox.
 */
export function CheckEmailPage() {
  const { user, logout, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [resendBusy, setResendBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const inboxTarget = useMemo(() => (user ? resolveInboxOpenTarget(user.email) : null), [user]);
  const hasSessionUser = !!user && !!inboxTarget;

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
      const r = hasSessionUser
        ? await resendVerificationEmailSessionAPI()
        : await resendVerificationEmailAPI(email.trim(), password);
      toast.success(r.message || "We sent a new verification link. Check your inbox.");
    } catch (err) {
      logClientError("CheckEmailPage.resendVerification", err);
      toast.error(toUserFriendlyMessage(err));
    } finally {
      setResendBusy(false);
    }
  }, [email, hasSessionUser, password]);

  const handleContinueAfterVerify = useCallback(async () => {
    const refreshed = await refreshSession();
    if (!refreshed) {
      logout();
      navigate("/login", { replace: true });
      return;
    }
    if (refreshed.isVerified === false) {
      toast.error("Not verified yet. Open the link in your email first.");
      return;
    }
    navigate(getPostAuthRedirect(refreshed), { replace: true });
  }, [logout, navigate, refreshSession]);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  const isWebmail = inboxTarget?.kind === "web";

  return (
    <AuthRecoveryLayout showFooterLink={false}>
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-2xl">
          Check your email to verify your account
        </h1>
        {hasSessionUser ? (
          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            We sent a verification link to{" "}
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">{user!.email}</span>. Open it on this device
            (or copy the link into the browser where you use CareTip).
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            Enter your email and password to resend the verification link.
          </p>
        )}
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          The dashboard stays unavailable until your email is verified.
        </p>

        <div className="flex flex-col gap-2 pt-2">
          {hasSessionUser ? (
            <button
              type="button"
              onClick={openInbox}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Mail className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              Open my email
              {isWebmail ? (
                <span className="sr-only">Opens {inboxTarget!.providerLabel}</span>
              ) : (
                <span className="sr-only">Opens your default email app</span>
              )}
            </button>
          ) : null}

          {hasSessionUser && isWebmail && (
            <p className="text-[11px] leading-snug text-neutral-600 dark:text-neutral-400">
              Opens {inboxTarget!.providerLabel} in a new tab.
            </p>
          )}

          {hasSessionUser ? (
            <button
              type="button"
              onClick={() => void copyAddressAndHint()}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-semibold text-neutral-900 transition hover:bg-gray-50/80 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
            >
              <Copy className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              Go to inbox manually
            </button>
          ) : (
            <div className="space-y-2 text-left">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Email</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-neutral-900 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/25 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                  placeholder="you@venue.com"
                  autoComplete="email"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Password</span>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-10 text-sm font-medium text-neutral-900 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/25 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                    placeholder="Your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleResendVerification()}
            disabled={resendBusy}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-neutral-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-900/70"
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

          {!hasSessionUser ? (
            <p className="pt-1 text-[11px] text-neutral-600 dark:text-neutral-400">
              Forgot your password?{" "}
              <Link to="/forgot-password" className="font-semibold text-primary underline-offset-2 hover:underline">
                Reset it
              </Link>
              .
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 border-t border-neutral-200 pt-4">
          <button
            type="button"
            onClick={() => {
              void handleContinueAfterVerify();
            }}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/signup", { replace: true });
            }}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm font-semibold text-neutral-900 transition hover:bg-gray-50/80 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
          >
            Use a different email
          </button>
        </div>
      </div>
    </AuthRecoveryLayout>
  );
}
