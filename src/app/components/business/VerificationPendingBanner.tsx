import { Link } from "react-router";
import { Clock, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "@/lib/utils";

/**
 * Soft banner while platform business verification is pending or rejected.
 * Does not block navigation — live guest tips stay gated on go-live routes.
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
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          {rejected ? (
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {rejected
                ? t("business.dashboard.verificationBannerRejectedTitle")
                : t("business.dashboard.verificationBannerTitle")}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed opacity-90 sm:text-sm">
              {rejected
                ? t("business.dashboard.verificationBannerRejectedDesc")
                : t("business.dashboard.verificationBannerDesc")}
            </p>
          </div>
        </div>
        <Link
          to="/verification-pending"
          className="shrink-0 rounded-md bg-background/80 px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-border/60 hover:bg-background sm:text-sm"
        >
          {t("business.dashboard.verificationBannerCta")}
        </Link>
      </div>
    </div>
  );
}
