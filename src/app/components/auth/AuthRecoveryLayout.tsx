import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { CareTipLogo } from "@/app/components/CareTipLogo";

type AuthRecoveryLayoutProps = {
  children: React.ReactNode;
  /** Show subtle “Back to sign in” under the card (default true). */
  showFooterLink?: boolean;
};

/**
 * Soft light (alabaster) canvas + white elevated card + centered CareTip logo.
 */
export function AuthRecoveryLayout({ children, showFooterLink = true }: AuthRecoveryLayoutProps) {
  const { t } = useTranslation();
  return (
    <div className="min-h-[100dvh] bg-white font-['Roboto',ui-sans-serif,system-ui,sans-serif] dark:bg-neutral-950">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-4 py-12">
        <div className="mb-8 flex justify-center">
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <CareTipLogo size="auth" align="center" layoutIsolatedDouble />
          </div>
        </div>
        <div className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-8 dark:border-neutral-800 dark:bg-neutral-900">
          {children}
        </div>
        {showFooterLink ? (
          <p className="mt-8 text-center text-xs text-neutral-600 dark:text-neutral-400">
            <Link to="/login" className="font-medium text-primary hover:underline">
              {t("auth.recovery.backToSignIn")}
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
