import type { ReactNode } from "react";
import { Check, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SubscriptionBillingCycle } from "../../../../lib/api";
import type { PricingTierViewModel } from "../../../../data/pricingPlanCatalog";
import { resolveTierDescription, resolveTierPricing } from "@/components/pricing/pricingTierPresentation";
import { dashboardWorkspaceUi } from "@/app/components/dashboard/dashboardWorkspaceUi";
import { cn } from "@/lib/utils";

const HIGHLIGHT_LIMIT = 4;

export type BillingWorkspacePlanBadge =
  | { kind: "current" }
  | { kind: "trial"; daysRemaining: number };

type BillingWorkspacePlanCardProps = {
  tier: PricingTierViewModel;
  billingCycle: SubscriptionBillingCycle;
  badge?: BillingWorkspacePlanBadge | null;
  footer: ReactNode;
  subscriptionInfo?: ReactNode;
};

export function BillingWorkspacePlanCard({
  tier,
  billingCycle,
  badge,
  footer,
  subscriptionInfo,
}: BillingWorkspacePlanCardProps) {
  const { t } = useTranslation();
  const { feeLine, feeNote } = resolveTierPricing(tier, billingCycle, t);
  const description = resolveTierDescription(tier, t);
  const isCurrent = badge?.kind === "current" || badge?.kind === "trial";
  const highlights = tier.features.slice(0, HIGHLIGHT_LIMIT);

  return (
    <article
      className={cn(
        dashboardWorkspaceUi.card,
        dashboardWorkspaceUi.cardPad,
        "billing-workspace-plan-card flex h-full flex-col shadow-sm",
        isCurrent && "border-primary/35 ring-1 ring-primary/15",
      )}
      aria-labelledby={`billing-plan-${tier.tierKey}-title`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3
            id={`billing-plan-${tier.tierKey}-title`}
            className={dashboardWorkspaceUi.sectionTitle}
          >
            {tier.name}
          </h3>
          <p className={cn(dashboardWorkspaceUi.helperText, "mt-1 line-clamp-2")}>{description}</p>
        </div>
        {badge ? <PlanBadge badge={badge} /> : null}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p className={dashboardWorkspaceUi.kpiValue}>{feeLine}</p>
        <p className={cn(dashboardWorkspaceUi.helperText, "mt-0.5 text-xs")}>{feeNote}</p>
      </div>

      {highlights.length > 0 ? (
        <ul className="mt-4 space-y-1.5" aria-label={t("staticPages.pricing.featuresHeading", { defaultValue: "Features" })}>
          {highlights.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
              <span className="min-w-0 leading-snug">{feature}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {subscriptionInfo ? (
        <div className="mt-4 rounded-md border border-border/80 bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
          {subscriptionInfo}
        </div>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 pt-5">{footer}</div>
    </article>
  );
}

function PlanBadge({ badge }: { badge: BillingWorkspacePlanBadge }) {
  const { t } = useTranslation();

  if (badge.kind === "trial") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
        {t("business.billing.trial.cardBadge", { count: badge.daysRemaining })}
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
      <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
      {t("business.billing.currentPlanBadge")}
    </span>
  );
}
