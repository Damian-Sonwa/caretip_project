import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import type { BusinessSubscriptionTier, FeatureKey } from "@/app/lib/subscriptionCapabilities";
import { getFeatureCatalog } from "@/app/lib/subscriptionFeatureCatalog";
import { UpgradeCta } from "./UpgradeCta";
import { cn } from "@/lib/utils";

type LockedFeatureCardProps = {
  featureKey: FeatureKey;
  tier: BusinessSubscriptionTier | null;
  subscriptionStatus?: "none" | string;
  className?: string;
  compact?: boolean;
};

/** Compact module lock — feature name, short copy, outline upgrade CTA. */
export function LockedFeatureCard({
  featureKey,
  tier: _tier,
  subscriptionStatus: _subscriptionStatus = "none",
  className,
  compact: _compact = true,
}: LockedFeatureCardProps) {
  const { t } = useTranslation();
  const catalog = getFeatureCatalog(featureKey);

  return (
    <section
      className={cn("locked-feature-card locked-feature-card--compact", className)}
      aria-labelledby={`locked-feature-${featureKey}-title`}
    >
      <div className="locked-feature-card__inner">
        <div className="locked-feature-card__compact-copy">
          <Lock className="locked-feature-card__icon locked-feature-card__icon--compact" aria-hidden />
          <div className="locked-feature-card__compact-text">
            <h2
              id={`locked-feature-${featureKey}-title`}
              className="locked-feature-card__title locked-feature-card__title--compact"
            >
              {t(catalog.titleKey)}
            </h2>
            <p className="locked-feature-card__subtitle locked-feature-card__subtitle--compact">
              {t(catalog.benefitKey)}
            </p>
          </div>
        </div>
        <UpgradeCta
          featureKey={featureKey}
          variant="secondary"
          className="locked-feature-card__cta locked-feature-card__cta--compact"
        />
      </div>
    </section>
  );
}
