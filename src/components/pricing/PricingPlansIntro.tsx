import { useTranslation } from "react-i18next";
import type { PricingCopyScope } from "@/app/data/pricingCopy";
import { cn } from "@/lib/utils";

type PricingPlansIntroProps = {
  copyScope?: PricingCopyScope;
  className?: string;
};

export function PricingPlansIntro({ copyScope, className }: PricingPlansIntroProps) {
  const { t } = useTranslation();
  const scope = copyScope ?? "staticPages.pricing.audience.general";

  return (
    <header className={cn("caretip-pricing-plans-intro text-center", className)}>
      <h2 className="caretip-pricing-plans-intro__title">
        {t(`${scope}.sectionTitle`, {
          defaultValue: t("staticPages.pricing.sectionTitle"),
        })}
      </h2>
      <p className="caretip-pricing-plans-intro__subtitle">
        {t(`${scope}.sectionSubtitle`, {
          defaultValue: t("staticPages.pricing.sectionSubtitle"),
        })}
      </p>
    </header>
  );
}
