import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { AuthSplitLayout } from "./AuthSplitLayout";

type AuthRecoveryLayoutProps = {
  children: React.ReactNode;
  showFooterLink?: boolean;
  title?: string;
  subtitle?: string;
  /** Smaller left marketing panel — verification & recovery flows. */
  compactMarketing?: boolean;
};

/**
 * Password recovery / verification — same split-screen shell as sign-in.
 */
export function AuthRecoveryLayout({
  children,
  showFooterLink = true,
  title,
  subtitle,
  compactMarketing = false,
}: AuthRecoveryLayoutProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "caretip-auth-page caretip-auth-recovery-stage relative min-h-[100dvh] font-sans",
        compactMarketing && "caretip-auth-recovery-stage--compact-marketing",
      )}
    >
      <AuthSplitLayout compactMarketing={compactMarketing}>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="caretip-auth-recovery-inner"
        >
          <div className="caretip-auth-card caretip-auth-card--stable caretip-auth-card--recovery caretip-auth-card--verify-email">
            {title ? (
              <div className="caretip-auth-header caretip-auth-header--verify !mb-3">
                <h1 className="caretip-auth-title !pt-0">{title}</h1>
                {subtitle ? <p className="caretip-auth-subtitle caretip-auth-subtitle--verify">{subtitle}</p> : null}
              </div>
            ) : null}
            <div className="caretip-auth-card-body caretip-auth-card-body--recovery">{children}</div>
          </div>
          {showFooterLink ? (
            <p className="caretip-auth-footer-link">
              <Link to="/login">{t("auth.recovery.backToSignIn")}</Link>
            </p>
          ) : null}
        </motion.div>
      </AuthSplitLayout>
    </div>
  );
}
