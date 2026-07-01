import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Clock, Mail } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { CareTipLogo } from "../../components/CareTipLogo";

/** Informational page — not a dashboard gate. Managers can open the dashboard while onboarding is reviewed. */
export function BusinessAwaitingApprovalPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const status = user?.onboardingVerificationStatus;
  const isRejected = status === "rejected";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <CareTipLogo className="h-8 mb-8" />
      <div className="max-w-md w-full rounded-xl border border-border bg-card p-8 text-center space-y-4 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
          <Clock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">
          {isRejected
            ? t("business.awaitingApproval.titleRejected")
            : t("business.awaitingApproval.titlePending")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isRejected
            ? t("business.awaitingApproval.descRejected")
            : t("business.awaitingApproval.descPending")}
        </p>
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <Mail className="h-3.5 w-3.5" />
          {t("business.awaitingApproval.emailNotice")}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Link
            to="/dashboard/settings"
            className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            {t("business.awaitingApproval.reviewProfile")}
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("business.awaitingApproval.goToDashboard")}
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {t("business.awaitingApproval.signOut")}
          </button>
        </div>
      </div>
    </div>
  );
}
