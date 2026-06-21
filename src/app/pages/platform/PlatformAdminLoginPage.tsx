import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate, Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Footer } from "../../components/Footer";
import { CareTipLogo, CARE_TIP_LOGO_AUTH_SURFACE_CLASS } from "../../components/CareTipLogo";
import { useAuth, getPostAuthRedirect } from "../../hooks/useAuth";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { isApiRequestError, EMAIL_NOT_VERIFIED_CODE } from "../../lib/apiError";
import {
  isMfaLoginChallenge,
  loginMfaEnableAPI,
  loginMfaSetupAPI,
  loginMfaVerifyAPI,
} from "../../lib/api";
import { logClientError } from "../../lib/clientLog";
import { isPlatformAdminSessionRole, shouldShowLoginSessionResumeUi } from "../../lib/authSession";
import { shouldShowAuthBootstrapShell } from "../../lib/authBootstrapUi";
import { AuthBootstrapShell } from "@/app/components/auth/AuthBootstrapShell";
import { caretipBtnPrimaryCompact, caretipBtnPrimaryFull } from "@/lib/caretipButtonSystem";
import { cn } from "@/lib/utils";
import { AuthPageAtmosphere } from "@/app/components/auth/AuthPageAtmosphere";
import { AuthBackToHomeNav } from "@/app/components/auth/AuthBackToHomeNav";

const FIELD_CLASS = "caretip-auth-field";
const FIELD_PASSWORD = "caretip-auth-field caretip-auth-field--password-toggle";

type MfaStep = "password" | "setup" | "verify";

export function PlatformAdminLoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaStep, setMfaStep] = useState<MfaStep>("password");
  const [pendingMfaToken, setPendingMfaToken] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const authInFlightRef = useRef(false);
  const { login, user, sessionValidated, logout, completeAuthLogin, authStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { forceLogin?: boolean; impersonationExitFailed?: boolean } | null;
  const forceLogin = locationState?.forceLogin === true;
  const [authFlowInProgress, setAuthFlowInProgress] = useState(false);
  const postAuthRedirectRef = useRef<string | null>(null);

  const showSessionResumeUi =
    shouldShowLoginSessionResumeUi({
      authStatus,
      user,
      sessionValidated,
      authFlowInProgress: authFlowInProgress || submitting,
    }) &&
    Boolean(
      user &&
        sessionValidated &&
        !forceLogin &&
        !isPlatformAdminSessionRole(user.role),
    );
  const authTransitionPending = authFlowInProgress && Boolean(postAuthRedirectRef.current);

  const loginSubmitBlocked = Boolean(
    user && !sessionValidated && isPlatformAdminSessionRole(user.role) && !forceLogin,
  );

  const redirectAfterAuth = useCallback(() => {
    const target = "/platform-admin/dashboard";
    if (postAuthRedirectRef.current === target) return;
    postAuthRedirectRef.current = target;
    setAuthFlowInProgress(true);
    navigate(target, { replace: true });
  }, [navigate]);

  const sessionRoleLabel =
    user?.role === "business"
      ? t("auth.page.sessionRoleBusiness")
      : user?.role === "employee"
        ? t("auth.page.sessionRoleStaff")
        : user?.role === "platform_admin" || user?.role === "admin"
          ? t("auth.page.sessionRolePlatformAdmin")
          : user?.role ?? "";

  const startMfaSetup = useCallback(async (token: string) => {
    const setup = await loginMfaSetupAPI(token);
    setQrDataUrl(setup.qrDataUrl);
    setMfaStep("setup");
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (loginSubmitBlocked) return;
    if (!trimmed || !password) {
      setError(t("admin.loginPage.bothRequired"));
      return;
    }
    if (authInFlightRef.current) return;
    authInFlightRef.current = true;
    setAuthFlowInProgress(true);
    setSubmitting(true);
    try {
      const result = await login(trimmed, password);
      if (isMfaLoginChallenge(result)) {
        setPendingMfaToken(result.pendingMfaToken);
        setAuthFlowInProgress(false);
        if (result.mfaSetupRequired) {
          await startMfaSetup(result.pendingMfaToken);
        } else {
          setMfaStep("verify");
        }
        return;
      }
      completeAuthLogin(result);
      redirectAfterAuth();
    } catch (err) {
      logClientError("PlatformAdminLoginPage", err);
      if (isApiRequestError(err) && err.code === EMAIL_NOT_VERIFIED_CODE) {
        setError(err.message);
      } else {
        setError(toUserFriendlyMessage(err));
      }
    } finally {
      authInFlightRef.current = false;
      setSubmitting(false);
      if (!postAuthRedirectRef.current) {
        setAuthFlowInProgress(false);
      }
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const code = mfaCode.trim();
    if (!pendingMfaToken || !code) {
      setError(t("admin.loginPage.mfaCodeRequired", { defaultValue: "Enter the 6-digit code from your authenticator app." }));
      return;
    }
    if (authInFlightRef.current) return;
    authInFlightRef.current = true;
    setAuthFlowInProgress(true);
    setSubmitting(true);
    try {
      const data =
        mfaStep === "setup"
          ? await loginMfaEnableAPI(pendingMfaToken, code)
          : await loginMfaVerifyAPI(pendingMfaToken, code);
      completeAuthLogin(data);
      redirectAfterAuth();
    } catch (err) {
      logClientError("PlatformAdminLoginPage.mfa", err);
      setError(toUserFriendlyMessage(err));
    } finally {
      authInFlightRef.current = false;
      setSubmitting(false);
      if (!postAuthRedirectRef.current) {
        setAuthFlowInProgress(false);
      }
    }
  };

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    if (authFlowInProgress || submitting) return;
    if (!user || !sessionValidated || forceLogin) return;
    if (!isPlatformAdminSessionRole(user.role)) return;
    redirectAfterAuth();
  }, [authFlowInProgress, authStatus, forceLogin, redirectAfterAuth, sessionValidated, submitting, user]);

  if (
    shouldShowAuthBootstrapShell({
      authStatus,
      authTransitionPending,
    })
  ) {
    return <AuthBootstrapShell />;
  }

  return (
    <div className="caretip-auth-page relative flex min-h-[100dvh] flex-col overflow-x-hidden font-sans">
      <div className="relative z-10 flex min-h-[100dvh] flex-1 flex-col overflow-x-hidden">
        <main className="caretip-auth-stage relative flex min-h-0 flex-1 flex-col">
          <AuthPageAtmosphere />
          {showSessionResumeUi ? (
            <div className="caretip-auth-notice-banner !pb-0" role="region" aria-label={t("auth.page.crossSessionRegionAria")}>
              <div className="caretip-auth-notice mb-6">
                <p className="font-medium leading-snug">{t("auth.page.crossSessionBody", { role: sessionRoleLabel })}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!user}
                    onClick={() => {
                      if (!user) return;
                      if (isPlatformAdminSessionRole(user.role)) {
                        redirectAfterAuth();
                        return;
                      }
                      navigate(getPostAuthRedirect(user), { replace: true });
                    }}
                    className={cn(caretipBtnPrimaryCompact, "h-9 min-h-9 px-3 text-xs disabled:opacity-50")}
                  >
                    {t("auth.page.crossSessionContinue")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setError("");
                      setMfaStep("password");
                    }}
                    className="inline-flex h-9 min-h-9 items-center justify-center rounded-lg border border-amber-300/80 bg-white px-3 text-xs font-semibold text-amber-950 transition hover:bg-amber-100/80 dark:border-amber-400/40 dark:bg-neutral-900 dark:text-amber-100 dark:hover:bg-neutral-800"
                  >
                    {t("auth.page.crossSessionSwitch")}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="caretip-auth-card-wrap relative z-10"
          >
            <AuthBackToHomeNav className="caretip-auth-back-home--standalone" />
            <div className="caretip-auth-card">
              <div className="caretip-auth-header !mb-5">
                <motion.div
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className={cn(CARE_TIP_LOGO_AUTH_SURFACE_CLASS, "caretip-auth-logo-wrap caretip-auth-logo-wrap--card")}
                >
                  <CareTipLogo size="auth" align="center" className="caretip-auth-marketing__logo" />
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06, duration: 0.4 }}
                  className="caretip-auth-title"
                >
                  {t("admin.loginPage.title")}
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="mt-2 flex flex-wrap items-center justify-center gap-2"
                >
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    <ShieldCheck className="h-3 w-3" strokeWidth={2} aria-hidden />
                    {t("admin.loginPage.restricted")}
                  </span>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.12 }}
                    className="caretip-auth-subtitle w-full"
                  >
                    {mfaStep === "password"
                      ? t("admin.loginPage.subtitle")
                      : t("admin.loginPage.mfaSubtitle", { defaultValue: "Enter the code from your authenticator app to continue." })}
                  </motion.p>
                </motion.div>
              </div>

              {locationState?.impersonationExitFailed ? (
                <p
                  className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-sm text-amber-950 dark:border-amber-400/40 dark:bg-amber-950/30 dark:text-amber-100"
                  role="status"
                >
                  {t("admin.loginPage.impersonationExitFailed", {
                    defaultValue:
                      "We could not restore your platform admin session. Sign in again to continue.",
                  })}
                </p>
              ) : null}

              {mfaStep === "password" ? (
                <form
                  onSubmit={(e) => void handlePasswordSubmit(e)}
                  aria-busy={submitting || loginSubmitBlocked}
                  className="caretip-auth-form text-neutral-900 dark:text-neutral-100"
                  method="post"
                  action=""
                  noValidate
                >
                  <input
                    placeholder={t("admin.loginPage.emailPlaceholder")}
                    type="email"
                    id="platform-admin-email"
                    name="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={FIELD_CLASS}
                  />

                  <div className="relative">
                    <input
                      placeholder={t("admin.loginPage.passwordPlaceholder")}
                      type={showPassword ? "text" : "password"}
                      id="platform-admin-password"
                      name="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={FIELD_PASSWORD}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="caretip-auth-field-toggle"
                      aria-label={showPassword ? t("admin.loginPage.hidePassword") : t("admin.loginPage.showPassword")}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {error ? (
                    <p className="text-sm font-medium text-red-600 dark:text-red-400" role="alert">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={submitting || loginSubmitBlocked}
                    className={cn(caretipBtnPrimaryFull, "caretip-auth-submit relative disabled:cursor-not-allowed")}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden />
                        {t("admin.loginPage.signingIn")}
                      </>
                    ) : (
                      t("admin.loginPage.signIn")
                    )}
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={(e) => void handleMfaSubmit(e)}
                  className="caretip-auth-form text-neutral-900 dark:text-neutral-100"
                  noValidate
                >
                  {mfaStep === "setup" && qrDataUrl ? (
                    <div className="mb-4 flex flex-col items-center gap-3">
                      <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
                        {t("admin.loginPage.mfaSetupHint", {
                          defaultValue: "Scan this QR code with your authenticator app, then enter the 6-digit code.",
                        })}
                      </p>
                      <img
                        src={qrDataUrl}
                        alt=""
                        className="h-40 w-40 rounded-lg border border-neutral-200 bg-white p-2 dark:border-neutral-700"
                      />
                    </div>
                  ) : null}

                  <input
                    placeholder={t("admin.loginPage.mfaCodePlaceholder", { defaultValue: "6-digit code" })}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\s/g, ""))}
                    className={FIELD_CLASS}
                  />

                  {error ? (
                    <p className="text-sm font-medium text-red-600 dark:text-red-400" role="alert">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={submitting}
                    className={cn(caretipBtnPrimaryFull, "caretip-auth-submit relative disabled:cursor-not-allowed")}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden />
                        {t("admin.loginPage.mfaVerifying", { defaultValue: "Verifying…" })}
                      </>
                    ) : (
                      t("admin.loginPage.mfaContinue", { defaultValue: "Continue" })
                    )}
                  </button>

                  <button
                    type="button"
                    className="mt-2 text-center text-sm font-medium text-neutral-600 underline-offset-4 hover:underline dark:text-neutral-400"
                    onClick={() => {
                      setMfaStep("password");
                      setMfaCode("");
                      setPendingMfaToken("");
                      setQrDataUrl("");
                      setError("");
                    }}
                  >
                    {t("admin.loginPage.mfaBack", { defaultValue: "Back to sign in" })}
                  </button>
                </form>
              )}

              <p className="caretip-auth-form-footer mt-6">
                <Link
                  to="/login"
                  className="font-semibold text-neutral-900 underline-offset-4 transition-colors hover:text-primary hover:underline dark:text-neutral-100"
                >
                  {t("admin.loginPage.businessStaffLink")}
                </Link>
              </p>
            </div>
          </motion.div>
        </main>

        <Footer variant="minimal" surface="light" />
      </div>
    </div>
  );
}
