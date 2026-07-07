import { useTranslation } from "react-i18next";
import { useAuth } from "@/app/hooks/useAuth";
import { useBusinessSidebarEntitlements } from "./useBusinessSidebarEntitlements";
import {
  subscriptionPlanStatusLabel,
  subscriptionTrialStatusLabel,
} from "@/app/lib/subscriptionPlanDisplayName";
import { cn } from "@/lib/utils";

export function BusinessSidebarSubscriptionStatus({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tier, status, hasActiveEntitlements, isSponsored, ready } = useBusinessSidebarEntitlements();

  const isBasicTier = tier === "basic";

  const label = (() => {
    if (!ready) return t("dashboardNav.business.subscriptionStatus.loading");
    if (isSponsored) return t("dashboardNav.business.subscriptionStatus.sponsored");
    if (!hasActiveEntitlements || tier == null) {
      return t("dashboardNav.business.subscriptionStatus.none");
    }
    if (status === "trialing") return subscriptionTrialStatusLabel(tier, t);
    return subscriptionPlanStatusLabel(tier, t);
  })();

  const businessName = user?.businessName?.trim();
  const showActiveBasicBadge = ready && (isBasicTier || (!hasActiveEntitlements && !isSponsored));

  return (
    <div className={cn("border-b border-sidebar-border px-4 py-3", className)}>
      {businessName ? (
        <p className="truncate text-sm font-semibold text-sidebar-foreground">{businessName}</p>
      ) : null}
      <p
        className={cn(
          "text-xs font-medium",
          businessName ? "mt-0.5" : "",
          isSponsored || (hasActiveEntitlements && tier != null && !isBasicTier)
            ? "text-primary/90"
            : showActiveBasicBadge
              ? "text-sidebar-foreground/80"
              : "text-muted-foreground",
        )}
      >
        {label}
      </p>
    </div>
  );
}
