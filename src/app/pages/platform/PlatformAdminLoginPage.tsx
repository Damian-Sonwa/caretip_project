import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Footer } from "../../components/Footer";
import { CareTipLogo } from "../../components/CareTipLogo";
import { useAuth, getPostAuthRedirect } from "../../hooks/useAuth";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { isApiRequestError, EMAIL_NOT_VERIFIED_CODE } from "../../lib/apiError";
import { logClientError } from "../../lib/clientLog";
import { isPlatformAdminSessionRole } from "../../lib/authSession";
import { caretipBtnPrimaryCompact, caretipBtnPrimaryFull } from "@/lib/caretipButtonSystem";
import { cn } from "@/lib/utils";

const FIELD_CLASS =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-none transition focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/25 font-sans dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-400";

export function PlatformAdminLoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const authInFlightRef = useRef(false);
  const { login, user, sessionValidated, logout } = useAuth();
  const navigate = useNavigate();

  const sameLaneValidated = Boolean(
    user && sessionValidated && isPlatformAdminSessionRole(user.role),
  );
  const showCrossSessionHint = Boolean(
    user && sessionValidated && !isPlatformAdminSessionRole(user.role),
  );

  useEffect(() => {
    if (!user || !sessionValidated) return;
    if (!isPlatformAdminSessionRole(user.role)) return;
    navigate("/platform-admin/dashboard", { replace: true });
  }, [user, sessionValidated, navigate]);

  const sessionRoleLabel =
    user?.role === "business"
      ? t("auth.page.sessionRoleBusiness")
      : user?.role === "employee"
        ? t("auth.page.sessionRoleStaff")
        : user?.role === "platform_admin" || user?.role === "admin"
          ? t("auth.page.sessionRolePlatformAdmin")
          : user?.role ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (user && !sessionValidated) return;
    if (!trimmed || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (authInFlightRef.current) return;
    authInFlightRef.current = true;
    setSubmitting(true);
    try {
      await login(trimmed, password, "platform_admin");
      navigate("/platform-admin/dashboard", { replace: true });
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
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-gray-50 font-sans dark:bg-neutral-900">
      <div className="relative z-10 flex min-h-[100dvh] flex-1 flex-col overflow-x-hidden">
        <main className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-gray-50 px-4 py-12 sm:py-16 dark:bg-neutral-900">
          {showCrossSessionHint ? (
            <div className="mb-6 w-full max-w-sm" role="region" aria-label={t("auth.page.crossSessionRegionAria")}>
              <div className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-sm text-amber-950 shadow-sm dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-50">
                <p className="font-medium leading-snug">{t("auth.page.crossSessionBody", { role: sessionRoleLabel })}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!user}
                    onClick={() => user && navigate(getPostAuthRedirect(user), { replace: true })}
                    className={cn(caretipBtnPrimaryCompact, "h-9 min-h-9 px-3 text-xs disabled:opacity-50")}
                  >
                    {t("auth.page.crossSessionContinue")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setError("");
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
            className="relative z-10 w-full max-w-sm"
          >
            <div
              className={
                "relative overflow-hidden rounded-[24px] border border-gray-200 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-7 dark:border-neutral-800 dark:bg-neutral-900"
              }
            >
              <div className="relative mb-5 space-y-1 text-center">
                <motion.div
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.65 }}
                  className="mx-auto flex h-[3.25rem] w-full max-w-[280px] items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <CareTipLogo size="auth" align="center" layoutIsolatedDouble />
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  className="text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-2xl"
                >
                  {t("admin.loginPage.title")}
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-wrap items-center justify-center gap-2"
                >
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    <ShieldCheck className="h-3 w-3" strokeWidth={2} aria-hidden />
                    {t("admin.loginPage.restricted")}
                  </span>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.12 }}
                    className="w-full text-xs font-medium text-neutral-600 dark:text-neutral-400"
                  >
                    {t("admin.loginPage.subtitle")}
                  </motion.p>
                </motion.div>
              </div>

              {sameLaneValidated ? (
                <div className="flex flex-col items-center py-8 text-center" role="status" aria-live="polite">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" aria-hidden />
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{t("admin.loginPage.redirecting")}</p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => void handleSubmit(e)}
                  aria-busy={submitting || Boolean(user && !sessionValidated)}
                  className="flex w-full flex-col gap-4 text-neutral-900 dark:text-neutral-100"
                  method="post"
                  action=""
                  noValidate
                >
                  <input
                    placeholder="Email"
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
                      className={`${FIELD_CLASS} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
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

                  {submitting ? (
                    <p className="text-center text-[11px] font-medium text-neutral-600 dark:text-neutral-400" role="status">
                      {t("admin.loginPage.signingIn")}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={submitting || Boolean(user && !sessionValidated)}
                    className={cn(caretipBtnPrimaryFull, "relative mt-1 disabled:cursor-not-allowed")}
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
              )}

              <p className="mt-6 text-center text-xs text-neutral-600 dark:text-neutral-400">
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
