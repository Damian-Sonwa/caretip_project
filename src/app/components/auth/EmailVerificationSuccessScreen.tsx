import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { AuthRecoveryLayout } from "@/app/components/auth/AuthRecoveryLayout";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";
import { useAuth } from "@/app/hooks/useAuth";
import { getLoginPathForSessionRole } from "@/app/lib/authSession";
import { caretipBtnPrimaryFull } from "@/lib/caretipButtonSystem";
import { cn } from "@/lib/utils";

/** Post-verification success — user must click Continue to reach login. */
export function EmailVerificationSuccessScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleContinue = () => {
    const loginPath = getLoginPathForSessionRole(user?.role ?? "user");
    void logout();
    navigate(loginPath, { replace: true });
  };

  return (
    <AuthRecoveryLayout showFooterLink={false}>
      <div
        className="flex flex-col items-center gap-5 py-2 text-center"
        role="status"
        aria-live="polite"
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
          aria-hidden
        >
          <CheckCircle2 className="h-8 w-8" strokeWidth={2.25} />
        </div>
        <div className="space-y-2">
          <h1 className="caretip-auth-title !pt-0">{t("auth.checkEmail.successTitle")}</h1>
          <p className="caretip-auth-subtitle !mt-0">{t("auth.checkEmail.successSubtitle")}</p>
          <p className="text-sm text-muted-foreground">{t("auth.checkEmail.successContinueBody")}</p>
        </div>
        <button
          type="button"
          onClick={handleContinue}
          className={cn(caretipBtnPrimaryFull, "caretip-auth-submit w-full")}
        >
          {t("auth.checkEmail.continue")}
        </button>
      </div>
    </AuthRecoveryLayout>
  );
}

export function EmailVerificationVerifyingScreen() {
  const { t } = useTranslation();

  return (
    <AuthRecoveryLayout showFooterLink={false}>
      <div
        className="flex flex-col items-center gap-5 py-2 text-center"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <LoadingSpinner size="md" className="text-primary/80" />
        <div className="space-y-2">
          <h1 className="caretip-auth-title !pt-0">{t("auth.checkEmail.verifyingTitle")}</h1>
          <p className="caretip-auth-subtitle !mt-0">{t("auth.checkEmail.verifyingBody")}</p>
        </div>
      </div>
    </AuthRecoveryLayout>
  );
}
