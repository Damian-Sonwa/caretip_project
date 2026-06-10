import React from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { CareTipLogo } from "@/app/components/CareTipLogo";
import { AuthSplitLayout } from "@/app/components/auth/AuthSplitLayout";

export type AuthRole = "business" | "employee";

export interface SignInCard2Props {
  isLogin: boolean;
  onToggleMode: () => void;
  children: React.ReactNode;
  className?: string;
  formBusy?: boolean;
  sessionActive?: boolean;
  /** Employee invite signup — show hint only, no account-type selector. */
  inviteSignup?: boolean;
  topSlot?: React.ReactNode;
}

/**
 * Premium split-screen auth shell — marketing left, stable card right.
 */
export function SignInCard2({
  isLogin,
  onToggleMode,
  children,
  className,
  formBusy = false,
  sessionActive = false,
  inviteSignup = false,
  topSlot,
}: SignInCard2Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <AuthSplitLayout topSlot={topSlot} signUpMode={!sessionActive && !isLogin}>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn("caretip-auth-card-wrap", className)}
      >
        <div
          className={cn(
            "caretip-auth-card caretip-auth-card--stable",
            !isLogin && "caretip-auth-card--signup",
          )}
        >
          <div
            className={cn(
              "caretip-auth-header",
              sessionActive && "caretip-auth-header--session",
            )}
          >
            <div className="caretip-auth-logo-wrap caretip-auth-logo-wrap--card md:hidden">
              <CareTipLogo size="auth" align="center" layoutIsolatedDouble visualScale={1.18} />
            </div>
            <h1 className="caretip-auth-title">
              {sessionActive
                ? t("auth.signInCard.titleCareTip")
                : isLogin
                  ? t("auth.signInCard.titleWelcomeBack")
                  : inviteSignup
                    ? t("auth.signInCard.titleGetStarted")
                    : t("auth.signInCard.titleCreateVenue")}
            </h1>
            <p className="caretip-auth-subtitle">
              {sessionActive
                ? t("auth.signInCard.subtitleSession")
                : isLogin
                  ? t("auth.signInCard.subtitleSignInShort")
                  : inviteSignup
                    ? t("auth.signInCard.roleLockedInviteHint")
                    : t("auth.signInCard.subtitleCreateVenue")}
            </p>
          </div>

          {!sessionActive ? (
            <div className="caretip-auth-mode-block">
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
                    "flex-1 rounded-full py-1.5 text-sm font-semibold transition-[background-color,box-shadow,color] duration-200",
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
                    "flex-1 rounded-full py-1.5 text-sm font-semibold transition-[background-color,box-shadow,color] duration-200",
                    !isLogin ? "caretip-auth-tab-active" : "caretip-auth-tab-idle",
                    formBusy && "cursor-not-allowed opacity-60",
                  )}
                >
                  {t("auth.signInCard.tabSignUp")}
                </button>
              </div>
            </div>
          ) : null}

          <div className="caretip-auth-card-body">{children}</div>
        </div>
      </motion.div>
    </AuthSplitLayout>
  );
}
