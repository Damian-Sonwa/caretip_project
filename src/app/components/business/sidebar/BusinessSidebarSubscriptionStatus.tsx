import { useTranslation } from "react-i18next";
import { useAuth } from "@/app/hooks/useAuth";
import { useBusinessEntitlementsContext } from "@/app/contexts/BusinessEntitlementsContext";
import { useSubscriptionEntitlements } from "@/app/hooks/useSubscriptionEntitlements";
import {
  subscriptionPlanStatusLabel,
  subscriptionTrialStatusLabel,
} from "@/app/lib/subscriptionPlanDisplayName";
import { cn } from "@/lib/utils";
export function BusinessSidebarSubscriptionStatus({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const businessContext = useBusinessEntitlementsContext();
  const fallback = useSubscriptionEntitlements({
    enabled: user?.role === "business" && businessContext == null,
    role: user?.role === "business" ? "business" : null,
  });
  const { tier, status, hasActiveEntitlements, isSponsored, ready } = businessContext ?? fallback;

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

  return (
    <div className={cn("border-b border-neutral-200/70 px-4 py-3", className)}>
      {businessName ? (
        <p className="truncate text-sm font-semibold text-sidebar-foreground">{businessName}</p>
      ) : null}
      <p
        className={cn(
          "text-xs font-medium",
          businessName ? "mt-0.5" : "",
          !hasActiveEntitlements && ready
            ? "text-muted-foreground"
            : "text-primary/90",
        )}
      >
        {label}
      </p>
    </div>
  );
}
