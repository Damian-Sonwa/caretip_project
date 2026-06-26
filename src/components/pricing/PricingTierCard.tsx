import { useEffect, useState, type ReactNode } from "react";
import { Check, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { BillingCycle } from "@/app/data/pricingTypes";
import { scheduleIdleWork } from "@/lib/publicRouteDefer";
import { resolveTierDescription, resolveTierPricing } from "./pricingTierPresentation";
import type { PricingTierViewModel } from "@/app/data/pricingPlanCatalog";
import type { PricingCopyScope } from "@/app/data/pricingCopy";

export type PricingTierCardBadge =
  | { kind: "popular" }
  | { kind: "current" }
  | { kind: "trial"; daysRemaining: number };

type PricingTierCardProps = {
  tier: PricingTierViewModel;
  billingCycle: BillingCycle;
  copyScope?: PricingCopyScope;
  badge?: PricingTierCardBadge | null;
  footer: ReactNode;
  /** Public pricing page defers feature list paint for perf. Billing uses immediate render. */
  deferFeatureSkeleton?: boolean;
  /** UI-only cards — skip billing-cycle price swap and audience copy overrides. */
  displayOnly?: boolean;
  className?: string;
};

function TierFeatureList({
  features,
  deferSkeleton,
}: {
  features: string[];
  deferSkeleton: boolean;
}) {
  const [ready, setReady] = useState(!deferSkeleton);

  useEffect(() => {
    if (!deferSkeleton) return;
    scheduleIdleWork(() => setReady(true), 900);
  }, [deferSkeleton]);

  if (!ready) {
    return <div className="caretip-pricing-tier-features-skeleton" aria-hidden />;
  }

  return (
    <ul className="caretip-pricing-tier-features">
      {features.map((feature, idx) => (
        <li key={idx} className="caretip-pricing-tier-features__item">
          <span className="caretip-pricing-tier-features__check" aria-hidden>
            <Check className="size-3" strokeWidth={2.75} />
          </span>
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

function CardBadge({ badge, inline = false }: { badge: PricingTierCardBadge; inline?: boolean }) {
  const { t } = useTranslation();

  const className = cn(
    "caretip-pricing-tier-card__badge",
    badge.kind === "current" && "caretip-pricing-tier-card__badge--current",
    badge.kind === "trial" && "caretip-pricing-tier-card__badge--trial",
    inline && "caretip-pricing-tier-card__badge--inline",
  );

  if (badge.kind === "popular") {
    return (
      <div className={className}>
        <Sparkles className="size-3 shrink-0" aria-hidden />
        {t("staticPages.pricing.popular")}
      </div>
    );
  }

  if (badge.kind === "current") {
    return (
      <div className={className}>
        {t("business.billing.currentPlanBadge")}
      </div>
    );
  }

  return (
    <div className={className}>
      {t("business.billing.trial.cardBadge", { count: badge.daysRemaining })}
    </div>
  );
}

function resolveCardBadge(
  tier: PricingTierViewModel,
  explicit?: PricingTierCardBadge | null,
): PricingTierCardBadge | null {
  if (explicit) return explicit;
  if (tier.isPopular) return { kind: "popular" };
  return null;
}

export function PricingTierCard({
  tier,
  billingCycle,
  copyScope = "staticPages.pricing.audience.general",
  badge,
  footer,
  deferFeatureSkeleton = false,
  displayOnly = false,
  className,
}: PricingTierCardProps) {
  const { t } = useTranslation();
  const isEnterprise = tier.tierKey === "enterprise";
  const { feeLine, feeNote } = displayOnly
    ? { feeLine: tier.feeLine, feeNote: tier.feeNote }
    : resolveTierPricing(tier, billingCycle, t);
  const description = displayOnly
    ? tier.description
    : resolveTierDescription(tier, t, copyScope);
  const cardBadge = resolveCardBadge(tier, badge);
  const isTrialBadge = cardBadge?.kind === "trial";
  const isFeatured =
    tier.isPopular ||
    cardBadge?.kind === "current" ||
    isTrialBadge;

  return (
    <article
      className={cn(
        "caretip-pricing-tier-card",
        isFeatured && "caretip-pricing-tier-card--featured",
        cardBadge && !isTrialBadge && "caretip-pricing-tier-card--has-badge",
        isTrialBadge && "caretip-pricing-tier-card--trial-badge",
        isEnterprise && "caretip-pricing-tier-card--enterprise",
        cardBadge?.kind === "current" && "caretip-pricing-tier-card--current",
        className,
      )}
    >
      {cardBadge && !isTrialBadge ? <CardBadge badge={cardBadge} /> : null}

      <div className="caretip-pricing-tier-card__header">
        {isTrialBadge ? <CardBadge badge={cardBadge} inline /> : null}
        <h3 className="caretip-pricing-tier-card__name">{tier.name}</h3>
        {tier.tagline ? <p className="caretip-pricing-tier-card__tagline">{tier.tagline}</p> : null}
      </div>

      <div className="caretip-pricing-tier-card__divider" aria-hidden />

      <div className="caretip-pricing-tier-card__price">
        <p className="caretip-pricing-tier-card__fee">{feeLine}</p>
        <p className="caretip-pricing-tier-card__fee-note">{feeNote}</p>
      </div>

      <div className="caretip-pricing-tier-card__divider" aria-hidden />

      <p className="caretip-pricing-tier-card__desc">{description}</p>

      <TierFeatureList features={tier.features} deferSkeleton={deferFeatureSkeleton} />

      <div className="caretip-pricing-tier-card__actions">{footer}</div>
    </article>
  );
}
