import React from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { CareTipLogo } from "@/app/components/CareTipLogo";
import { ChevronDown } from "lucide-react";
import { AuthPageAtmosphere } from "@/app/components/auth/AuthPageAtmosphere";

export type AuthRole = "business" | "employee";

export interface SignInCard2Props {
  isLogin: boolean;
  onToggleMode: () => void;
  role: AuthRole;
  onRoleChange: (role: AuthRole) => void;
  children: React.ReactNode;
  className?: string;
  formBusy?: boolean;
  /** When true, hides sign-in/sign-up toggle and role selector (active session flow). */
  sessionActive?: boolean;
  /** Team invite in URL/form — lock account type to Staff. */
  roleLocked?: boolean;
}

/**
 * Premium auth shell — warm canvas, elevated card, calm typography.
 */
export function SignInCard2({
  isLogin,
  onToggleMode,
  role,
  onRoleChange,
  children,
  className,
  formBusy = false,
  sessionActive = false,
  roleLocked = false,
}: SignInCard2Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <main
      className={cn("caretip-auth-stage relative font-sans", className)}
    >
      <AuthPageAtmosphere />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="caretip-auth-card-wrap"
      >
        <div className="caretip-auth-card">
          <div
            className={cn(
              "caretip-auth-header",
              sessionActive && "caretip-auth-header--session",
            )}
          >
            <motion.div
              initial={reduceMotion ? false : { scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }}
              className="caretip-auth-logo-wrap"
            >
              <CareTipLogo size="auth" align="center" layoutIsolatedDouble visualScale={1.35} />
            </motion.div>
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.06, duration: 0.4 }}
              className="caretip-auth-title"
            >
              {sessionActive
                ? t("auth.signInCard.titleCareTip")
                : isLogin
                  ? t("auth.signInCard.titleWelcomeBack")
                  : t("auth.signInCard.titleGetStarted")}
            </motion.h1>
            <motion.p
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.1, duration: 0.4 }}
              className="caretip-auth-subtitle"
            >
              {sessionActive
                ? t("auth.signInCard.subtitleSession")
                : isLogin
                  ? t("auth.signInCard.subtitleSignIn")
                  : t("auth.signInCard.subtitleCreate")}
            </motion.p>
          </div>

          {!sessionActive ? (
            <>
              <div
                className="caretip-auth-tabs"
                role="tablist"
                aria-label={t("auth.signInCard.tablistAria")}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={isLogin}
                  disabled={formBusy}
                  onClick={() => {
                    if (!isLogin) onToggleMode();
                  }}
                  className={cn(
                    "flex-1 rounded-full py-2 text-sm font-semibold transition-[background-color,box-shadow,color] duration-200",
                    isLogin ? "caretip-auth-tab-active" : "caretip-auth-tab-idle",
                    formBusy && "cursor-not-allowed opacity-60",
                  )}
                >
                  {t("auth.signInCard.tabSignIn")}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isLogin}
                  disabled={formBusy}
                  onClick={() => {
                    if (isLogin) onToggleMode();
                  }}
                  className={cn(
                    "flex-1 rounded-full py-2 text-sm font-semibold transition-[background-color,box-shadow,color] duration-200",
                    !isLogin ? "caretip-auth-tab-active" : "caretip-auth-tab-idle",
                    formBusy && "cursor-not-allowed opacity-60",
                  )}
                >
                  {t("auth.signInCard.tabSignUp")}
                </button>
              </div>

              {isLogin ? (
                <div className="caretip-auth-role-reserve" aria-hidden />
              ) : roleLocked ? (
                <p className="caretip-auth-helper mb-4 text-left">
                  {t("auth.signInCard.roleStaff")} · {t("auth.signInCard.roleLockedInviteHint")}
                </p>
              ) : (
                <div className="mb-4 w-full">
                  <label htmlFor="auth-role-select" className="caretip-auth-label">
                    {t("auth.signInCard.accountTypeLabel")}
                  </label>
                  <div className="relative">
                    <select
                      id="auth-role-select"
                      disabled={formBusy}
                      value={role}
                      onChange={(e) => onRoleChange(e.target.value as AuthRole)}
                      className={cn(
                        "caretip-auth-field",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "[&>option]:bg-white [&>option]:text-neutral-900 dark:[&>option]:bg-neutral-900 dark:[&>option]:text-neutral-100",
                      )}
                    >
                      <option value="business">{t("auth.signInCard.roleBusiness")}</option>
                      <option value="employee">{t("auth.signInCard.roleStaff")}</option>
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500 dark:text-neutral-400"
                      aria-hidden
                    />
                  </div>
                </div>
              )}
            </>
          ) : null}

          {children}
        </div>
      </motion.div>
    </main>
  );
}
