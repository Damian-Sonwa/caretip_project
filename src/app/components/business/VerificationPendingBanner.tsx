import { Link } from "react-router";
import { Clock, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "@/lib/utils";

/**
 * Persistent shell banner while venue KYC is pending or rejected.
 * Does not block navigation — QR / guest tipping stay gated on their routes.
 */
export function VerificationPendingBanner({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (!user || user.role !== "business" || user.impersonation) {
    return null;
  }

  const rejected = user.status === "REJECTED";
  const pending = user.status === "PENDING";
  if (!pending && !rejected) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative z-20 border-b px-4 py-3",
        rejected
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          {rejected ? (
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {rejected
                ? t("business.verification.rejectedPageTitle")
                : t("business.dashboard.fixVerificationTitle")}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed opacity-90 sm:text-sm">
              {rejected
                ? t("business.verification.rejectedPageBody")
                : t("business.dashboard.fixVerificationDesc")}
            </p>
          </div>
        </div>
        {!rejected ? (
          <Link
            to="/verification-pending"
            className="shrink-0 text-xs font-semibold underline underline-offset-2 sm:text-sm"
          >
            {t("business.verification.learnMore")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
