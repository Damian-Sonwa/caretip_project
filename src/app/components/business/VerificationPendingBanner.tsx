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
        "business-verification-bar relative z-20 border-b bg-background/95 px-4 py-2.5 backdrop-blur-sm",
        rejected ? "border-destructive/15" : "border-border",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2.5 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
              rejected
                ? "border-destructive/20 bg-destructive/5 text-destructive"
                : "border-amber-200/90 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-200",
            )}
          >
            {rejected ? (
              <ShieldAlert className="h-3 w-3" aria-hidden />
            ) : (
              <Clock className="h-3 w-3" aria-hidden />
            )}
            {rejected
              ? t("business.awaitingApproval.badgeRejected")
              : t("business.awaitingApproval.badgePending")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">{labels.title}</p>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">{labels.description}</p>
          </div>
        </div>
        <Link
          to="/awaiting-approval"
          className="shrink-0 text-xs font-semibold text-foreground underline-offset-2 transition-colors hover:underline"
        >
          {labels.cta}
        </Link>
      </div>
    </div>
  );
}
