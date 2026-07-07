import { useTranslation } from "react-i18next";
import type { FeatureKey } from "@/app/lib/subscriptionCapabilities";
import type { FeatureInfoIntent } from "./FeatureInfoDrawerContext";
import { useOptionalFeatureInfoDrawer } from "./FeatureInfoDrawerContext";
import { cn } from "@/lib/utils";

type FeatureLearnMoreButtonProps = {
  featureKey: FeatureKey;
  intent?: FeatureInfoIntent;
  className?: string;
};

export function FeatureLearnMoreButton({
  featureKey,
  intent = "upgrade",
  className,
}: FeatureLearnMoreButtonProps) {
  const { t } = useTranslation();
  const drawer = useOptionalFeatureInfoDrawer();

  if (!drawer) return null;

  return (
    <button
      type="button"
      className={cn(
        "text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      onClick={() => drawer.openFeatureInfo(featureKey, intent)}
    >
      {t("business.dashboard.preview.learnMore")}
    </button>
  );
}
