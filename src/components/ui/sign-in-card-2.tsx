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

const authFont = "font-['Roboto',ui-sans-serif,system-ui,sans-serif]";

/**
 * Soft light auth shell: off-white canvas, white elevated card, Roboto typography.
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
        "relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-gray-50 px-4 py-10 pt-20 sm:pt-24 dark:bg-neutral-900",
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
              "relative overflow-hidden rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-7 dark:bg-neutral-900",
              "border border-gray-200 dark:border-neutral-800",
            )}
          >
            <div className={cn("relative space-y-1 text-center", sessionActive ? "mb-6" : "mb-5")}>
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
                className="text-xs font-medium text-neutral-600 dark:text-neutral-400"
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
                  className="mb-5 flex rounded-full border border-gray-200 bg-gray-50 p-1 dark:border-neutral-800 dark:bg-neutral-900"
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
                      "flex-1 rounded-full py-2.5 text-sm font-semibold transition-all",
                      isLogin
                        ? "bg-primary text-white shadow-md"
                        : "text-neutral-600 hover:bg-white/90 dark:text-neutral-400 dark:hover:bg-neutral-900/70",
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
                      "flex-1 rounded-full py-2.5 text-sm font-semibold transition-all",
                      !isLogin
                        ? "bg-primary text-white shadow-md"
                        : "text-neutral-600 hover:bg-white/90 dark:text-neutral-400 dark:hover:bg-neutral-900/70",
                      formBusy && "cursor-not-allowed opacity-60",
                    )}
                  >
                    {t("auth.signInCard.tabSignUp")}
                  </button>
                </div>

                <div className="mb-5 w-full">
                  <label
                    htmlFor="auth-role-select"
                    className="mb-2 block text-left text-xs font-medium text-neutral-600 dark:text-neutral-400"
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
                        "h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-10 text-sm text-neutral-900 outline-none transition dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100",
                        "focus:border-primary focus:ring-[3px] focus:ring-primary/25",
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
