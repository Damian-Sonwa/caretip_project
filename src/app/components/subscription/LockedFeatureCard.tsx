import { useTranslation } from "react-i18next";
import type { BusinessSubscriptionTier, FeatureKey } from "@/app/lib/subscriptionCapabilities";
import { featureListKeys, getFeatureCatalog } from "@/app/lib/subscriptionFeatureCatalog";
import { SubscriptionBadge } from "./SubscriptionBadge";
import { ActivateCareTipCta } from "./ActivateCareTipCta";
import { UpgradeCta } from "./UpgradeCta";
import { cn } from "@/lib/utils";

type LockedFeatureCardProps = {
  featureKey: FeatureKey;
  tier: BusinessSubscriptionTier | null;
  subscriptionStatus?: "none" | string;
  className?: string;
  compact?: boolean;
};

export function LockedFeatureCard({
  featureKey,
  tier,
  subscriptionStatus = "none",
  className,
  compact = false,
}: LockedFeatureCardProps) {
  const { t } = useTranslation();
  const catalog = getFeatureCatalog(featureKey);
  const features = featureListKeys(catalog);
  const isUnsubscribed = subscriptionStatus === "none" || tier == null;

  if (isUnsubscribed) {
    return (
      <section
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border/70 bg-muted/20 p-6 sm:p-8",
          className,
        )}
        aria-labelledby={`locked-feature-${featureKey}-title`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h2
              id={`locked-feature-${featureKey}-title`}
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              {t(catalog.titleKey)}
            </h2>
            {!compact ? (
              <p className="max-w-xl text-sm text-muted-foreground">{t(catalog.benefitKey)}</p>
            ) : null}
          </div>
          {featureKey === "csvExport" ? (
            <UpgradeCta
              featureKey="csvExport"
              labelKey="subscription.upgrade.premiumPlan"
              className="shrink-0"
            />
          ) : (
            <ActivateCareTipCta className="shrink-0" size="md" />
          )}
        </div>
      </section>
    );
  }

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
          {tier ? <SubscriptionBadge tier={tier} size="md" /> : null}
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
              plan: tier ? t(`subscription.tiers.${tier}`) : t("subscription.activation.noPlan"),
              required: t(`subscription.tiers.${catalog.requiredTier}`),
            })}
          </p>
          <UpgradeCta featureKey={featureKey} className="sm:min-w-[200px]" fullWidth />
        </div>
      </div>
    </section>
  );
}
