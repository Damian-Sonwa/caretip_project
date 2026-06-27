import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import type { BusinessSubscriptionTier, FeatureKey } from "@/app/lib/subscriptionCapabilities";
import { featureListKeys, getFeatureCatalog } from "@/app/lib/subscriptionFeatureCatalog";
import { SubscriptionBadge } from "./SubscriptionBadge";
import { ActivateCareTipCta } from "./ActivateCareTipCta";
import { UpgradeCta } from "./UpgradeCta";
import { FeatureLearnMoreButton } from "./FeatureLearnMoreButton";
import { subscriptionPlanDisplayName } from "@/app/lib/subscriptionPlanDisplayName";
import { cn } from "@/lib/utils";

type LockedFeatureCardProps = {
  featureKey: FeatureKey;
  tier: BusinessSubscriptionTier | null;
  subscriptionStatus?: "none" | string;
  className?: string;
  compact?: boolean;
};

/** Unified locked-state card — activation and upgrade paths share the same muted, non-interactive treatment. */
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
  const requiredTier = catalog.requiredTier;
  const isUnsubscribed = subscriptionStatus === "none" || tier == null;
  const requiredPlanName = subscriptionPlanDisplayName(requiredTier, t);

  return (
    <section
      className={cn(
        "locked-feature-card relative overflow-hidden rounded-2xl border border-border/70 bg-muted/25 p-6 sm:p-8",
        className,
      )}
      aria-labelledby={`locked-feature-${featureKey}-title`}
    >
      <Lock
        className="pointer-events-none absolute -right-2 -top-2 h-28 w-28 text-foreground/[0.04]"
        aria-hidden
      />

      <div className="relative flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2 opacity-90">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Lock className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              {isUnsubscribed
                ? t("dashboardNav.business.premiumDialog.activationEyebrow")
                : t("subscription.featureInfo.upgradeEyebrow")}
            </p>
            <h2
              id={`locked-feature-${featureKey}-title`}
              className={cn(
                "font-semibold tracking-tight text-foreground/90",
                compact ? "text-lg" : "text-xl sm:text-2xl",
              )}
            >
              {t(catalog.titleKey)}
            </h2>
            {!compact ? (
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                {t(catalog.benefitKey)}
              </p>
            ) : null}
          </div>
          <SubscriptionBadge tier={requiredTier} size="md" className="shrink-0 opacity-80" />
        </div>

        {!compact ? (
          <ul
            className="grid gap-2 opacity-75 sm:grid-cols-2"
            aria-label={t("subscription.locked.includesAria")}
          >
            {features.map((key) => (
              <li key={key} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" aria-hidden />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="pointer-events-auto flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {isUnsubscribed
                ? t("dashboardNav.business.premiumDialog.activationPlanHint")
                : t("dashboardNav.business.premiumDialog.includedWithPlan", { plan: requiredPlanName })}
            </p>
            {!isUnsubscribed ? (
              <p className="text-xs text-muted-foreground/90">
                {t("subscription.locked.currentPlan", {
                  plan: subscriptionPlanDisplayName(tier, t),
                  required: requiredPlanName,
                })}
              </p>
            ) : null}
            <FeatureLearnMoreButton
              featureKey={featureKey}
              intent={isUnsubscribed ? "activation" : "upgrade"}
            />
          </div>
          {featureKey === "csvExport" && isUnsubscribed ? (
            <UpgradeCta
              featureKey="csvExport"
              labelKey="subscription.upgrade.premiumPlan"
              className="shrink-0 sm:min-w-[200px]"
            />
          ) : isUnsubscribed ? (
            <ActivateCareTipCta className="shrink-0 sm:min-w-[200px]" size="md" />
          ) : (
            <UpgradeCta featureKey={featureKey} className="sm:min-w-[200px]" fullWidth />
          )}
        </div>
      </div>
    </section>
  );
}
