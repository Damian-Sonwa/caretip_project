import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type PricingYearlyNoticeProps = {
  className?: string;
};

export function PricingYearlyNotice({ className }: PricingYearlyNoticeProps) {
  const { t } = useTranslation();

  return (
    <p
      className={cn("caretip-pricing-yearly-notice", className)}
      role="status"
      aria-live="polite"
    >
      {t("staticPages.pricing.billing.yearlyComingSoon")}
    </p>
  );
}
