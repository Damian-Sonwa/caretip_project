import { useTranslation } from "react-i18next";
import { Crown, Sparkles } from "lucide-react";
import type { BusinessSubscriptionTier } from "@/app/lib/subscriptionCapabilities";
import { subscriptionPlanDisplayName } from "@/app/lib/subscriptionPlanDisplayName";
import { cn } from "@/lib/utils";

type SubscriptionBadgeProps = {
  tier: BusinessSubscriptionTier;
  className?: string;
  size?: "sm" | "md";
};

export function SubscriptionBadge({ tier, className, size = "sm" }: SubscriptionBadgeProps) {
  const { t } = useTranslation();
  const label = subscriptionPlanDisplayName(tier, t);
  const isPremium = tier === "premium";
  const isEnterprise = tier === "enterprise";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wide",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        tier === "basic" && "bg-stone-100 text-stone-700",
        isPremium && "bg-primary/10 text-primary",
        isEnterprise && "bg-violet-100 text-violet-800",
        className,
      )}
    >
      {isEnterprise ? (
        <Crown className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden />
      ) : isPremium ? (
        <Sparkles className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden />
      ) : null}
      {label}
    </span>
  );
}
