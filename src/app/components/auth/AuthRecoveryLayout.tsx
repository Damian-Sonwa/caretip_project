import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import { CareTipLogo } from "@/app/components/CareTipLogo";
import { AuthPageAtmosphere } from "@/app/components/auth/AuthPageAtmosphere";

type AuthRecoveryLayoutProps = {
  children: React.ReactNode;
  /** Show subtle “Back to sign in” under the card (default true). */
  showFooterLink?: boolean;
};

/**
 * Password recovery / activation — shared premium auth canvas + elevated card.
 */
export function AuthRecoveryLayout({ children, showFooterLink = true }: AuthRecoveryLayoutProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <div className="caretip-auth-page relative min-h-[100dvh] font-sans">
      <AuthPageAtmosphere />
      <div className="caretip-auth-recovery-stage">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="caretip-auth-recovery-inner"
        >
          <div className="mb-7 flex justify-center">
            <div className="caretip-auth-logo-wrap max-w-[15rem]">
              <CareTipLogo size="auth" align="center" layoutIsolatedDouble />
            </div>
          </div>
          <div className="caretip-auth-card">{children}</div>
          {showFooterLink ? (
            <p className="caretip-auth-footer-link">
              <Link to="/login">{t("auth.recovery.backToSignIn")}</Link>
            </p>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
