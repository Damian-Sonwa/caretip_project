import React from "react";
import { useTranslation } from "react-i18next";
import { motion, useMotionValue, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { CareTipLogo } from "@/app/components/CareTipLogo";
import { ChevronDown } from "lucide-react";

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
}

const authFont = "font-sans";

/**
 * Soft light auth shell: off-white canvas, white elevated card, Inter/Manrope typography.
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
}: SignInCard2Props) {
  const { t } = useTranslation();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [6, -6]);
  const rotateY = useTransform(mouseX, [-300, 300], [-6, 6]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <main
      className={cn(
        "caretip-auth-shell relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-4 py-8 pt-[4.75rem] sm:py-10 sm:pt-24",
        authFont,
        className,
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-sm"
        style={{ perspective: 1500 }}
      >
        <motion.div
          className="relative"
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className={cn(
              "caretip-auth-card relative overflow-hidden rounded-2xl border bg-white p-5 sm:p-6 dark:bg-neutral-900",
            )}
          >
            <div className={cn("relative space-y-0.5 text-center", sessionActive ? "mb-5" : "mb-4")}>
              <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.55, bounce: 0.2 }}
                className="caretip-auth-logo-wrap mx-auto flex h-11 w-full max-w-[232px] items-center justify-center overflow-visible rounded-xl border bg-white/95 px-2 py-1 dark:border-neutral-800/80 dark:bg-neutral-900/95"
              >
                <CareTipLogo size="auth" align="center" layoutIsolatedDouble visualScale={1.35} />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="pt-2.5 text-xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50 sm:text-2xl"
              >
                {sessionActive
                  ? t("auth.signInCard.titleCareTip")
                  : isLogin
                    ? t("auth.signInCard.titleWelcomeBack")
                    : t("auth.signInCard.titleGetStarted")}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.12 }}
                className="text-xs font-medium leading-snug text-neutral-500 dark:text-neutral-400/90"
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
                  className="mb-4 flex rounded-full border border-neutral-200/80 bg-neutral-50/90 p-0.5 dark:border-neutral-800 dark:bg-neutral-900/80"
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

                <div className="mb-4 w-full">
                  <label
                    htmlFor="auth-role-select"
                    className="mb-1.5 block text-left text-xs font-medium text-neutral-500 dark:text-neutral-400/90"
                  >
                    {t("auth.signInCard.accountTypeLabel")}
                  </label>
                  <div className="relative">
                    <select
                      id="auth-role-select"
                      disabled={formBusy}
                      value={role}
                      onChange={(e) => onRoleChange(e.target.value as AuthRole)}
                      className={cn(
                        "caretip-auth-field h-10 w-full appearance-none rounded-xl border border-neutral-200/90 bg-white pl-3 pr-10 text-sm text-neutral-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-[border-color,box-shadow] duration-200 dark:border-neutral-700/90 dark:bg-neutral-900 dark:text-neutral-100",
                        "focus:border-[#e9781c]/45 focus:ring-[3px] focus:ring-[#e9781c]/18",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "[&>option]:bg-white [&>option]:text-neutral-900 dark:[&>option]:bg-neutral-900 dark:[&>option]:text-neutral-100",
                      )}
                    >
                      <option value="business">{t("auth.signInCard.roleBusiness")}</option>
                      <option value="employee">{t("auth.signInCard.roleStaff")}</option>
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600 dark:text-neutral-400"
                      aria-hidden
                    />
                  </div>
                </div>
              </>
            ) : null}

            {children}
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
