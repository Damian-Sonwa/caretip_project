import { Link, useLocation } from "react-router";
import { Clock, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  getBusinessVerificationNoticeLabels,
  shouldSuppressLayoutVerificationBanner,
} from "../../lib/businessVerificationNotice";
import { useBusinessVerificationNotice } from "../../hooks/useBusinessVerificationNotice";
import { cn } from "@/lib/utils";

/**
 * Soft banner while platform onboarding review is pending or rejected.
 * KYC status does not trigger this banner — see dashboard status bar "Coming soon".
 */
export function VerificationPendingBanner({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { show, rejected } = useBusinessVerificationNotice();

  if (!show || shouldSuppressLayoutVerificationBanner(pathname)) {
    return null;
  }

  const labels = getBusinessVerificationNoticeLabels(t, rejected);

  return (
    <div
      className={cn(
        "business-verification-bar relative z-20 border-b px-4 py-2",
        rejected
          ? "border-destructive/15 bg-destructive/[0.03] text-destructive/90"
          : "border-amber-500/15 bg-amber-500/[0.04] text-amber-950/85 dark:text-amber-100/90",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2.5 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {rejected ? (
            <ShieldAlert className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
          ) : (
            <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
          )}
          <div className="flex min-w-0 flex-1 items-baseline gap-1.5 sm:gap-2">
            <p className="shrink-0 text-xs font-medium">{labels.title}</p>
            <span className="hidden text-xs opacity-50 sm:inline" aria-hidden>
              ·
            </span>
            <p className="hidden min-w-0 truncate text-xs opacity-75 sm:block">{labels.description}</p>
          </div>
        </div>
        <Link
          to="/awaiting-approval"
          className={cn(
            "shrink-0 text-xs font-semibold underline-offset-2 transition-colors hover:underline",
            rejected ? "text-destructive" : "text-amber-900/90 dark:text-amber-100",
          )}
        >
          {labels.cta}
        </Link>
      </div>
    </div>
  );
}
