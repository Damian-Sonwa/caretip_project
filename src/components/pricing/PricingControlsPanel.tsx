import { useTranslation } from "react-i18next";
import type { BillingCycle, Industry } from "@/app/data/pricingTypes";
import { PRICING_INDUSTRIES } from "@/app/data/pricingTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { PricingBillingToggle } from "@/components/pricing/PricingBillingToggle";
import { cn } from "@/lib/utils";

type PricingControlsPanelProps = {
  industry: Industry;
  billingCycle: BillingCycle;
  onIndustryChange: (industry: Industry) => void;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  className?: string;
};

export function PricingControlsPanel({
  industry,
  billingCycle,
  onIndustryChange,
  onBillingCycleChange,
  className,
}: PricingControlsPanelProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("caretip-pricing-controls", className)}>
      <div className="caretip-pricing-controls__field">
        <label className="caretip-pricing-controls__label" htmlFor="pricing-business-type">
          {t("staticPages.pricing.industry.label")}
        </label>
        <Select value={industry} onValueChange={(v) => onIndustryChange(v as Industry)}>
          <SelectTrigger
            id="pricing-business-type"
            className="caretip-pricing-select-trigger"
            aria-label={t("staticPages.pricing.industry.selectAria")}
          >
            <SelectValue placeholder={t("staticPages.pricing.industry.selectPlaceholder")} />
          </SelectTrigger>
          <SelectContent className="caretip-pricing-select-content" position="popper">
            {PRICING_INDUSTRIES.map((key) => (
              <SelectItem key={key} value={key} className="caretip-pricing-select-item">
                {t(`staticPages.pricing.industry.${key}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
