import { useEffect, useMemo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router";
import { Mail, Copy, Loader2, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import { AuthRecoveryLayout } from "@/app/components/auth/AuthRecoveryLayout";
import { useAuth, getPostAuthRedirect } from "@/app/hooks/useAuth";
import { resolveInboxOpenTarget } from "@/app/lib/inboxDeepLink";
import {
  resendVerificationEmailAPI,
  resendVerificationEmailSessionAPI,
  verifyEmailWithToken,
} from "@/app/lib/api";
import { toUserFriendlyMessage } from "@/app/lib/errorMessages";
import { authDebug } from "@/app/lib/authDebugLog";
import { logClientError } from "@/app/lib/clientLog";

/**
 * One-shot: call the verify-email API for this token, then redirect into the app or show success.
 * Token is stripped from the URL on failure so a refresh does not re-hit a consumed token (HTTP 400).
 */
function VerifyEmailFromToken({ token }: { token: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [phase, setPhase] = useState<"verifying" | "success">("verifying");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await verifyEmailWithToken(token);
        if (cancelled) return;
        authDebug("email_verify", { phase: "api_ok" });
        const hasSession =
          typeof localStorage !== "undefined" && !!localStorage.getItem("caretip_token");
        if (hasSession) {
          const refreshed = await refreshSession();
          if (cancelled) return;
          if (refreshed) {
            const target = getPostAuthRedirect(refreshed);
            authDebug("email_verify", { phase: "redirect_after_session", to: target });
            navigate(target, { replace: true });
            return;
          }
        }
        authDebug("email_verify", { phase: "success_no_session" });
        setPhase("success");
      } catch (e) {
        if (cancelled) return;
        const msg = toUserFriendlyMessage(e);
        authDebug("email_verify", { phase: "error", message: msg });
        navigate("/verify-email", { replace: true, state: { verifyError: msg } });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, navigate, refreshSession]);

  if (phase === "success") {
    return (
      <AuthRecoveryLayout showFooterLink={false}>
        <div className="space-y-4 text-center">
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-2xl">
            {t("auth.checkEmail.emailVerifiedTitle")}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{t("auth.checkEmail.emailVerifiedBody")}</p>
          <Link
            to="/login"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            {t("auth.checkEmail.continueToSignIn")}
          </Link>
        </div>
      </AuthRecoveryLayout>
    );
  }

  return (
    <AuthRecoveryLayout showFooterLink={false}>
      <div className="space-y-3 text-center">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-2xl">
          {t("auth.checkEmail.verifyingTitle")}
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{t("auth.checkEmail.verifyingBody")}</p>
      </div>
    </AuthRecoveryLayout>
  );
}

/**
 * Shown after password sign-up (and if an unverified session hits a protected route).
 * With `?token=` from the email link, completes verification once then redirects.
 */
export function CheckEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const tokenFromUrl = searchParams.get("token")?.trim() ?? "";
  const verifyErrorBanner = (location.state as { verifyError?: string } | null)?.verifyError;

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
      toast.success(t("auth.checkEmail.toastCopySuccess"));
    } catch {
      toast.error(t("auth.checkEmail.toastCopyError"));
    }
  }, [user?.email, t]);

  const handleResendVerification = useCallback(async () => {
    setResendBusy(true);
    try {
      const r = hasSessionUser
        ? await resendVerificationEmailSessionAPI()
        : await resendVerificationEmailAPI(email.trim(), password);
      toast.success(r.message || t("auth.page.toastResendDefault"));
    } catch (err) {
      logClientError("CheckEmailPage.resendVerification", err);
      toast.error(toUserFriendlyMessage(err));
    } finally {
      setResendBusy(false);
    }
  }, [email, hasSessionUser, password, t]);

  const handleContinueAfterVerify = useCallback(async () => {
    const refreshed = await refreshSession();
    if (!refreshed) {
      logout();
      navigate("/login", { replace: true });
      return;
    }
    if (refreshed.isVerified === false) {
      toast.error(t("auth.checkEmail.toastNotVerified"));
      return;
    }
    navigate(getPostAuthRedirect(refreshed), { replace: true });
  }, [logout, navigate, refreshSession, t]);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  const isWebmail = inboxTarget?.kind === "web";

  if (tokenFromUrl) {
    return <VerifyEmailFromToken token={tokenFromUrl} />;
  }

  return (
    <AuthRecoveryLayout showFooterLink={false}>
      <div className="space-y-4 text-center">
        {verifyErrorBanner ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-left text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
          >
            {verifyErrorBanner}
          </div>
        ) : null}
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-2xl">
          {t("auth.checkEmail.title")}
        </h1>
        {hasSessionUser ? (
          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            {t("auth.checkEmail.introSession", { email: user!.email })}
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            {t("auth.checkEmail.introResend")}
          </p>
        )}
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          {t("auth.checkEmail.dashboardLocked")}
        </p>

        <div className="flex flex-col gap-2 pt-2">
          {hasSessionUser ? (
            <button
              type="button"
              onClick={openInbox}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Mail className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {t("auth.checkEmail.openMyEmail")}
              {isWebmail ? (
                <span className="sr-only">{t("auth.checkEmail.srOnlyOpensWebmail", { provider: inboxTarget!.providerLabel })}</span>
              ) : (
                <span className="sr-only">{t("auth.checkEmail.srOnlyOpensDefault")}</span>
              )}
            </button>
          ) : null}

          {hasSessionUser && isWebmail && (
            <p className="text-[11px] leading-snug text-neutral-600 dark:text-neutral-400">
              {t("auth.checkEmail.opensWebmailHint", { provider: inboxTarget!.providerLabel })}
            </p>
          )}

          {hasSessionUser ? (
            <button
              type="button"
              onClick={() => void copyAddressAndHint()}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-semibold text-neutral-900 transition hover:bg-gray-50/80 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
            >
              <Copy className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              {t("auth.checkEmail.goToInboxManually")}
            </button>
          ) : (
            <div className="space-y-2 text-left">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  {t("auth.checkEmail.emailLabel")}
                </span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-neutral-900 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/25 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                  placeholder={t("auth.checkEmail.placeholderEmail")}
                  autoComplete="email"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  {t("auth.checkEmail.passwordLabel")}
                </span>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-10 text-sm font-medium text-neutral-900 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/25 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                    placeholder={t("auth.checkEmail.placeholderPassword")}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    aria-label={showPassword ? t("auth.page.hidePassword") : t("auth.page.showPassword")}
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
                {t("auth.checkEmail.resendSending")}
              </>
            ) : (
              t("auth.checkEmail.resendButton")
            )}
          </button>

          {!hasSessionUser ? (
            <p className="pt-1 text-[11px] text-neutral-600 dark:text-neutral-400">
              {t("auth.checkEmail.forgotPasswordLead")}{" "}
              <Link to="/forgot-password" className="font-semibold text-primary underline-offset-2 hover:underline">
                {t("auth.checkEmail.resetIt")}
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
            {t("auth.checkEmail.continue")}
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/signup", { replace: true });
            }}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm font-semibold text-neutral-900 transition hover:bg-gray-50/80 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
          >
            {t("auth.checkEmail.useDifferentEmail")}
          </button>
        </div>
      </div>
    </AuthRecoveryLayout>
  );
}
