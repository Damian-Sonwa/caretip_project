import type { ReactNode } from "react";
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
  authLane?: "business" | "employee";
  modeScope?: "both" | "signup-only" | "login-only";
  employeeVenueName?: string;
  inviteVerified?: boolean;
  onEmployeeSignUpClick?: () => void;
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
  authLane = "business",
  modeScope = "both",
  employeeVenueName,
  inviteVerified = false,
  onEmployeeSignUpClick,
  topSlot,
}: SignInCard2Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const isEmployee = authLane === "employee";
  const showModeTabs = !sessionActive && modeScope === "both";

  const title = sessionActive
    ? t("auth.signInCard.titleCareTip")
    : isLogin
      ? isEmployee
        ? t("auth.employeeAuth.titleSignIn")
        : t("auth.signInCard.titleWelcomeBack")
      : isEmployee
        ? employeeVenueName
          ? t("auth.employeeAuth.titleWelcomeVenue", { venue: employeeVenueName })
          : t("auth.employeeAuth.titleJoinTeam")
        : t("auth.signInCard.titleCreateVenue");

  const subtitle = sessionActive
    ? t("auth.signInCard.subtitleSession")
    : isLogin
      ? isEmployee
        ? t("auth.employeeAuth.subtitleSignIn")
        : t("auth.signInCard.subtitleSignInShort")
      : isEmployee
        ? inviteVerified
          ? t("auth.employeeAuth.subtitleInviteVerified")
          : t("auth.employeeAuth.subtitleJoinTeam")
        : t("auth.signInCard.subtitleCreateVenue");

  const handleSignUpTab = () => {
    if (isEmployee && onEmployeeSignUpClick) {
      onEmployeeSignUpClick();
      return;
    }
    if (isLogin) onToggleMode();
  };

  const handleSignInTab = () => {
    if (!isLogin) onToggleMode();
  };

  return (
    <AuthSplitLayout topSlot={topSlot} signUpMode={!sessionActive && !isLogin} authLane={authLane}>
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
            <h1 className="caretip-auth-title">{title}</h1>
            <p className="caretip-auth-subtitle">{subtitle}</p>
          </div>

          {showModeTabs ? (
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
                  onClick={handleSignInTab}
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
                  onClick={handleSignUpTab}
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
