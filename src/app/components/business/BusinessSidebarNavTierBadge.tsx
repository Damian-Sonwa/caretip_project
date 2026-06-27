import { useTranslation } from "react-i18next";
import {
  minimumTierForFeature,
  type FeatureKey,
} from "@/app/lib/subscriptionCapabilities";
import { cn } from "@/lib/utils";

type BusinessSidebarNavTierBadgeProps = {
  featureKey: FeatureKey;
  className?: string;
};

export function BusinessSidebarNavTierBadge({
  featureKey,
  className,
}: BusinessSidebarNavTierBadgeProps) {
  const { t } = useTranslation();
  const minTier = minimumTierForFeature(featureKey);
  if (minTier === "basic") return null;

  const labelKey =
    minTier === "enterprise"
      ? "dashboardNav.business.tierBadge.enterprise"
      : "dashboardNav.business.tierBadge.business";

  return (
    <span
      className={cn(
        "business-sidebar-tier-badge shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide",
        minTier === "enterprise"
          ? "bg-violet-500/10 text-violet-700 dark:text-violet-300"
          : "bg-primary/10 text-primary",
        className,
      )}
    >
      {t(labelKey)}
    </span>
  );
}
