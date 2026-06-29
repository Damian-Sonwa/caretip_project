import { Link } from "react-router";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useBillingStatus } from "@/app/hooks/useBillingStatus";
import { dashboardSidebarUpgradeLink } from "@/lib/theme/dashboardSidebarUi";
import { useBusinessSidebarEntitlements } from "./useBusinessSidebarEntitlements";
import {
  BUSINESS_SIDEBAR_BILLING_HREF,
  resolveSidebarUpgradeCtaState,
} from "./sidebarUpgradeCtaState";

type BusinessSidebarUpgradeCtaProps = {
  className?: string;
};

export function BusinessSidebarUpgradeCta({ className }: BusinessSidebarUpgradeCtaProps) {
  const { t } = useTranslation();
  const entitlements = useBusinessSidebarEntitlements();
  const { data: billing } = useBillingStatus();

  const viewModel = resolveSidebarUpgradeCtaState(entitlements, billing, t);

  if (!viewModel) {
    return (
      <div className={cn("px-3 py-2.5", className)} aria-hidden>
        <div className="h-5 w-20 animate-pulse rounded bg-sidebar-accent/60" />
      </div>
    );
  }

  return (
    <Link
      to={BUSINESS_SIDEBAR_BILLING_HREF}
      className={cn("business-sidebar-upgrade-link", dashboardSidebarUpgradeLink, className)}
    >
      <span className="business-dash-nav-icon shrink-0" aria-hidden>
        <Sparkles className="h-5 w-5" />
      </span>
      <span className="truncate tracking-tight">{viewModel.label}</span>
    </Link>
  );
}
