import { useTranslation } from "react-i18next";
import { Lock, Sparkles } from "lucide-react";
import type { FeatureKey } from "@/app/lib/subscriptionCapabilities";
import {
  featureListKeys,
  getFeatureCatalog,
} from "@/app/lib/subscriptionFeatureCatalog";
import { UpgradeCta } from "../../subscription/UpgradeCta";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import type { SidebarNavLockReason } from "./sidebarNavLock";
import { planLabelKeyForFeature } from "./sidebarNavLock";

type PremiumAccessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureKey: FeatureKey | null;
  lockReason: SidebarNavLockReason;
};

export function PremiumAccessDialog({
  open,
  onOpenChange,
  featureKey,
}: PremiumAccessDialogProps) {
  const { t } = useTranslation();
  if (!featureKey) return null;

  const catalog = getFeatureCatalog(featureKey);
  const features = featureListKeys(catalog);
  const planLabel = t(planLabelKeyForFeature(featureKey));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="border-b border-border/60 bg-gradient-to-br from-primary/[0.05] via-background to-muted/40 px-6 py-5">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-primary">
              <Lock className="h-4 w-4 shrink-0" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wide">
                {t("dashboardNav.business.premiumDialog.upgradeEyebrow")}
              </span>
            </div>
            <DialogTitle className="text-xl font-semibold tracking-tight">
              {t(catalog.titleKey)}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              {t(catalog.benefitKey)}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-4 px-6 py-5">
          <ul className="space-y-2" aria-label={t("subscription.locked.includesAria")}>
            {features.map((key) => (
              <li key={key} className="flex items-start gap-2.5 text-sm text-foreground/90">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            {t("dashboardNav.business.premiumDialog.availableOnPlan", { plan: planLabel })}
          </p>
        </div>
        <DialogFooter className="flex-col gap-2 border-t border-border/60 bg-muted/10 px-6 py-4 sm:flex-col sm:justify-stretch">
          <UpgradeCta
            featureKey={featureKey}
            className="w-full justify-center"
            fullWidth
            closeBeforeNavigate={() => onOpenChange(false)}
          />
          <Button type="button" variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            {t("dashboardNav.business.premiumDialog.maybeLater")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
