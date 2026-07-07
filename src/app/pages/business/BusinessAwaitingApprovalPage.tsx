import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { AlertCircle, Clock } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { CareTipLogo } from "../../components/CareTipLogo";
import { cn } from "@/lib/utils";

/** Informational page — not a dashboard gate. Managers can open the dashboard while onboarding is reviewed. */
export function BusinessAwaitingApprovalPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const status = user?.onboardingVerificationStatus;
  const isRejected = status === "rejected";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50/90 px-4 py-12 dark:bg-background">
      <CareTipLogo size="auth" className="mb-6" />
      <div
        className={cn(
          "w-full max-w-lg rounded-2xl border border-zinc-200/90 bg-white p-8 sm:p-10",
          "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_48px_-20px_rgba(0,0,0,0.12)]",
          "dark:border-zinc-800 dark:bg-card",
        )}
      >
        <div className="flex flex-col items-center text-center">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
              isRejected
                ? "border-destructive/20 bg-destructive/5 text-destructive"
                : "border-amber-200/90 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
            )}
          >
            {isRejected ? (
              <AlertCircle className="h-3 w-3 shrink-0" aria-hidden />
            ) : (
              <Clock className="h-3 w-3 shrink-0" aria-hidden />
            )}
            {isRejected
              ? t("business.awaitingApproval.badgeRejected")
              : t("business.awaitingApproval.badgePending")}
          </span>

          <div
            className="mt-6 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800/80"
            aria-hidden
          >
            {isRejected ? (
              <AlertCircle className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
            ) : (
              <Clock className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
            )}
          </div>

          <h1 className="mt-5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {isRejected
              ? t("business.awaitingApproval.titleRejected")
              : t("business.awaitingApproval.titlePending")}
          </h1>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {isRejected
              ? t("business.awaitingApproval.descRejected")
              : t("business.awaitingApproval.descPending")}
          </p>

          {!isRejected ? (
            <p className="mt-3 max-w-md text-xs leading-relaxed text-muted-foreground/90">
              {t("business.awaitingApproval.limitedFeaturesNote")}
            </p>
          ) : null}

          <div className="mt-8 flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Link
              to="/dashboard"
              className="caretip-btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold"
            >
              {t("business.awaitingApproval.goToDashboard")}
            </Link>
            <Link
              to="/dashboard/settings"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {isRejected
                ? t("business.awaitingApproval.reviewProfile")
                : t("business.awaitingApproval.viewVerificationStatus")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
