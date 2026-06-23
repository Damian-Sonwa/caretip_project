import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BusinessSubscriptionTier, FeatureKey } from "@/app/lib/subscriptionCapabilities";
import { featureListKeys, getFeatureCatalog } from "@/app/lib/subscriptionFeatureCatalog";
import { SubscriptionBadge } from "./SubscriptionBadge";
import { UpgradeCta } from "./UpgradeCta";
import { cn } from "@/lib/utils";

type LockedFeatureCardProps = {
  featureKey: FeatureKey;
  tier: BusinessSubscriptionTier;
  className?: string;
  compact?: boolean;
};

export function LockedFeatureCard({ featureKey, tier, className, compact = false }: LockedFeatureCardProps) {
  const { t } = useTranslation();
  const catalog = getFeatureCatalog(featureKey);
  const features = featureListKeys(catalog);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] via-white to-stone-50/80 p-6 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] sm:p-8",
        className,
      )}
      aria-labelledby={`locked-feature-${featureKey}-title`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5" aria-hidden />
      <div className="relative flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
              aria-hidden
            >
              <Lock className="h-5 w-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {t("subscription.locked.eyebrow")}
              </p>
              <h2
                id={`locked-feature-${featureKey}-title`}
                className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                {t(catalog.titleKey)}
              </h2>
              {!compact ? (
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {t(catalog.benefitKey)}
                </p>
              ) : null}
            </div>
          </div>
          <SubscriptionBadge tier={tier} size="md" />
        </div>

        {!compact ? (
          <ul className="grid gap-2 sm:grid-cols-2" aria-label={t("subscription.locked.includesAria")}>
            {features.map((key) => (
              <li key={key} className="flex items-start gap-2 text-sm text-foreground/90">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {t("subscription.locked.currentPlan", {
              plan: t(`subscription.tiers.${tier}`),
              required: t(`subscription.tiers.${catalog.requiredTier}`),
            })}
          </p>
          <UpgradeCta featureKey={featureKey} className="sm:min-w-[200px]" fullWidth />
        </div>
      </div>
    </section>
  );
}
