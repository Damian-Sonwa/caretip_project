import { useEffect, useMemo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router";
import { Mail, Eye, EyeOff, Lock } from "lucide-react";
import { AuthStableSubmitButton } from "@/app/components/auth/AuthFormStability";
import { toast } from "sonner";
import { AuthRecoveryLayout } from "@/app/components/auth/AuthRecoveryLayout";
import {
  VerifyEmailConfirmedView,
  VerifyEmailFromToken,
} from "@/app/components/auth/EmailVerificationFlow";
import { EmailVerificationSuccessScreen } from "@/app/components/auth/EmailVerificationSuccessScreen";
import { useAuth } from "@/app/hooks/useAuth";
import { getLoginPathForSessionRole } from "@/app/lib/authSession";
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
      const loginPath = getLoginPathForSessionRole(user?.role ?? "user");
      logout();
      navigate(loginPath, { replace: true });
      return;
    }
    if (refreshed.isVerified === false) {
      toast.error(t("auth.checkEmail.toastNotVerified"));
      return;
    }
    setShowVerificationSuccess(true);
  }, [logout, navigate, refreshSession, t, user?.role]);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  if (showVerificationSuccess) {
    return <EmailVerificationSuccessScreen />;
  }

  if (tokenFromUrl) {
    return <VerifyEmailFromToken token={tokenFromUrl} />;
  }

  if (verifiedFromUrl) {
    return <VerifyEmailConfirmedView />;
  }

  const checkEmailSubtitle = hasSessionUser
    ? t("auth.checkEmail.introSession", { email: user!.email })
    : t("auth.checkEmail.introResend");

  return (
    <AuthRecoveryLayout
      compactMarketing
      showFooterLink={false}
      title={t("auth.checkEmail.title")}
      subtitle={checkEmailSubtitle}
    >
      <div className="caretip-auth-verify-flow space-y-3">
        {verifyErrorBanner ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-left text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
          >
            {verifyErrorBanner}
          </div>
        ) : null}

        <p className="caretip-auth-helper caretip-auth-verify-status">
          {t("auth.checkEmail.statusMessage")}
        </p>

        {!hasSessionUser ? (
          <div className="caretip-auth-verify-fields space-y-2 text-left">
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
            <p className="text-[11px] leading-snug text-neutral-600 dark:text-neutral-400">
              {t("auth.checkEmail.forgotPasswordLead")}{" "}
              <Link to="/forgot-password" className="font-semibold text-primary underline-offset-2 hover:underline">
                {t("auth.checkEmail.resetIt")}
              </Link>
              .
            </p>
          </div>
        ) : null}

        <div className="caretip-auth-verify-actions flex flex-col gap-2 pt-1">
          {hasSessionUser ? (
            <button
              type="button"
              onClick={openInbox}
              className={cn(caretipBtnPrimaryFull, "caretip-auth-submit gap-2")}
            >
              <Mail className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {t("auth.checkEmail.openMyEmail")}
              <span className="sr-only">
                {inboxTarget?.kind === "web"
                  ? t("auth.checkEmail.srOnlyOpensWebmail", { provider: inboxTarget.providerLabel })
                  : t("auth.checkEmail.srOnlyOpensDefault")}
              </span>
            </button>
          ) : null}

          <AuthStableSubmitButton
            type="button"
            variant="secondary"
            loading={resendBusy}
            loadingAriaLabel={t("auth.checkEmail.resendSending")}
            onClick={() => void handleResendVerification()}
            className="text-sm disabled:cursor-not-allowed"
          >
            {t("auth.checkEmail.resendButton")}
          </AuthStableSubmitButton>

          <button
            type="button"
            onClick={() => {
              void handleContinueAfterVerify();
            }}
            className={cn(caretipBtnSecondaryFull, "caretip-auth-verify-continue text-sm")}
          >
            {t("auth.checkEmail.continue")}
          </button>
        </div>
      </div>
    </AuthRecoveryLayout>
  );
}
