import { useEffect, useMemo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router";
import { Mail, Copy, Loader2, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import { AuthRecoveryLayout } from "@/app/components/auth/AuthRecoveryLayout";
import {
  VerifyEmailConfirmedView,
  VerifyEmailFromToken,
} from "@/app/components/auth/EmailVerificationFlow";
import { EmailVerificationSuccessScreen } from "@/app/components/auth/EmailVerificationSuccessScreen";
import { useAuth } from "@/app/hooks/useAuth";
import { resolveInboxOpenTarget } from "@/app/lib/inboxDeepLink";
import {
  resendVerificationEmailAPI,
  resendVerificationEmailSessionAPI,
} from "@/app/lib/api";
import { toUserFriendlyMessage } from "@/app/lib/errorMessages";
import { caretipBtnPrimaryFull, caretipBtnSecondaryFull } from "@/lib/caretipButtonSystem";
import { cn } from "@/lib/utils";
import { logClientError } from "@/app/lib/clientLog";

/**
 * Shown after password sign-up (and if an unverified session hits a protected route).
 * With `?token=` from the email link, completes verification once then shows success.
 */
export function CheckEmailPage() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const tokenFromUrl = searchParams.get("token")?.trim() ?? "";
  const verifiedFromUrl = searchParams.get("verified") === "1";
  const verifyErrorBanner = (location.state as { verifyError?: string } | null)?.verifyError;

  const { user, logout, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [resendBusy, setResendBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);

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

  const emailLocale = i18n.resolvedLanguage?.toLowerCase().startsWith("de") ? "de" : "en";

  const handleResendVerification = useCallback(async () => {
    setResendBusy(true);
    try {
      const r = hasSessionUser
        ? await resendVerificationEmailSessionAPI(emailLocale)
        : await resendVerificationEmailAPI(email.trim(), password, emailLocale);
      toast.success(r.message || t("auth.page.toastResendDefault"));
    } catch (err) {
      logClientError("CheckEmailPage.resendVerification", err);
      toast.error(toUserFriendlyMessage(err));
    } finally {
      setResendBusy(false);
    }
  }, [email, emailLocale, hasSessionUser, password, t]);

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
    setShowVerificationSuccess(true);
  }, [logout, navigate, refreshSession, t]);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  const isWebmail = inboxTarget?.kind === "web";

  if (showVerificationSuccess) {
    return <EmailVerificationSuccessScreen />;
  }

  if (tokenFromUrl) {
    return <VerifyEmailFromToken token={tokenFromUrl} />;
  }

  if (verifiedFromUrl) {
    return <VerifyEmailConfirmedView />;
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
        <h1 className="caretip-auth-title !pt-0">{t("auth.checkEmail.title")}</h1>
        {hasSessionUser ? (
          <p className="caretip-auth-subtitle !mt-2">
            {t("auth.checkEmail.introSession", { email: user!.email })}
          </p>
        ) : (
          <p className="caretip-auth-subtitle !mt-2">
            {t("auth.checkEmail.introResend")}
          </p>
        )}
        <p className="caretip-auth-helper">
          {t("auth.checkEmail.dashboardLocked")}
        </p>

        <div className="flex flex-col gap-2 pt-2">
          {hasSessionUser ? (
            <button
              type="button"
              onClick={openInbox}
              className={cn(caretipBtnPrimaryFull, "caretip-auth-submit gap-2")}
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
              className={cn(caretipBtnSecondaryFull, "gap-2 text-sm")}
            >
              <Copy className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              {t("auth.checkEmail.goToInboxManually")}
            </button>
          ) : (
            <div className="space-y-2 text-left">
              <label className="block">
                <span className="caretip-auth-label">{t("auth.checkEmail.emailLabel")}</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="caretip-auth-field"
                  placeholder={t("auth.checkEmail.placeholderEmail")}
                  autoComplete="email"
                />
              </label>
              <label className="block">
                <span className="caretip-auth-label">{t("auth.checkEmail.passwordLabel")}</span>
                <div className="relative">
                  <Lock className="caretip-auth-field-icon" aria-hidden />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    className="caretip-auth-field caretip-auth-field--has-icon caretip-auth-field--password-toggle"
                    placeholder={t("auth.checkEmail.placeholderPassword")}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="caretip-auth-field-toggle"
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
            className={cn(caretipBtnSecondaryFull, "text-sm disabled:cursor-not-allowed")}
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
            className={cn(caretipBtnPrimaryFull, "caretip-auth-submit")}
          >
            {t("auth.checkEmail.continue")}
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/signup", { replace: true });
            }}
            className={cn(caretipBtnSecondaryFull, "text-sm")}
          >
            {t("auth.checkEmail.useDifferentEmail")}
          </button>
        </div>
      </div>
    </AuthRecoveryLayout>
  );
}
