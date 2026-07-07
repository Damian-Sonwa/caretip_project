import type { ReactNode } from "react";
import type { FeatureKey } from "@/app/lib/subscriptionCapabilities";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { businessUi } from "../businessDashboardUi";
import { FeatureLearnMoreButton } from "../../subscription/FeatureLearnMoreButton";
import type { FeatureInfoIntent } from "../../subscription/FeatureInfoDrawerContext";
import { cn } from "@/lib/utils";

type DashboardFeaturePreviewCardProps = {
  featureKey: FeatureKey;
  title: string;
  description: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  intent?: FeatureInfoIntent;
};

/** Polished locked-feature preview — Learn more opens the feature info drawer. */
export function DashboardFeaturePreviewCard({
  featureKey,
  title,
  description,
  icon,
  children,
  className,
  intent = "upgrade",
}: DashboardFeaturePreviewCardProps) {
  const { t } = useTranslation();

  return (
    <Card className={cn(businessUi.cardStatic, "business-dashboard-panel-card w-full overflow-hidden", className)}>
      <CardHeader className="business-dashboard-panel-card__header space-y-3">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? (
            <div className={cn(businessUi.iconTileMuted, "shrink-0")} aria-hidden>
              {icon}
            </div>
          ) : null}
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-lg leading-snug">{title}</CardTitle>
            <CardDescription className={businessUi.cardDesc}>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      {children ? <CardContent className="pt-0">{children}</CardContent> : null}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-6 py-4">
        <p className="text-sm text-muted-foreground">{t("subscription.locked.availableOnPro")}</p>
        <FeatureLearnMoreButton featureKey={featureKey} intent={intent} />
      </div>
    </Card>
  );
}
