import { useTranslation } from "react-i18next";
import type { BillingCycle } from "@/app/data/pricingTypes";
import type { PricingPageAudience } from "@/app/data/pricingAudience";
import { PricingAudienceToggle } from "@/components/pricing/PricingAudienceToggle";
import { PricingBillingToggle } from "@/components/pricing/PricingBillingToggle";
import { cn } from "@/lib/utils";

type PricingControlsPanelProps = {
  audience: PricingPageAudience;
  billingCycle: BillingCycle;
  onAudienceChange: (audience: PricingPageAudience) => void;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  className?: string;
};

export function PricingControlsPanel({
  audience,
  billingCycle,
  onAudienceChange,
  onBillingCycleChange,
  className,
}: PricingControlsPanelProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("caretip-pricing-controls", className)}>
      <div className="caretip-pricing-controls__field">
        <span className="caretip-pricing-controls__label" id="pricing-audience-label">
          {t("staticPages.pricing.audienceToggle.label")}
        </span>
        <PricingAudienceToggle
          value={audience}
          onChange={onAudienceChange}
          className="caretip-pricing-audience-toggle--in-panel"
          aria-labelledby="pricing-audience-label"
        />
      </div>

      <div className="caretip-pricing-controls__field">
        <span className="caretip-pricing-controls__label" id="pricing-billing-label">
          {t("staticPages.pricing.billing.label")}
        </span>
        <PricingBillingToggle
          value={billingCycle}
          onChange={onBillingCycleChange}
          className="caretip-pricing-billing-toggle--in-panel"
          aria-labelledby="pricing-billing-label"
        />
      </div>
    </div>
  );
}
