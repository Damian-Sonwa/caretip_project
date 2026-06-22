import { useTranslation } from "react-i18next";
import type { BillingCycle } from "@/app/data/pricingTypes";
import { YEARLY_BILLING_ENABLED } from "@/app/data/pricingTypes";
import { cn } from "@/lib/utils";

type PricingBillingToggleProps = {
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  className?: string;
  "aria-labelledby"?: string;
};

export function PricingBillingToggle({
  value,
  onChange,
  className,
  "aria-labelledby": ariaLabelledBy,
}: PricingBillingToggleProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn("caretip-pricing-billing-toggle", className)}
      data-cycle={value}
      role="tablist"
      aria-label={ariaLabelledBy ? undefined : t("staticPages.pricing.billing.aria")}
      aria-labelledby={ariaLabelledBy}
    >
      <span className="caretip-pricing-billing-toggle__indicator" aria-hidden />
      <button
        type="button"
        role="tab"
        id="pricing-billing-monthly"
        aria-selected={value === "monthly"}
        aria-controls="pricing-plans-panel"
        className={cn(
          "caretip-pricing-billing-toggle__option",
          value === "monthly" && "caretip-pricing-billing-toggle__option--active",
        )}
        onClick={() => onChange("monthly")}
      >
        {t("staticPages.pricing.billing.monthly")}
      </button>
      <button
        type="button"
        role="tab"
        id="pricing-billing-yearly"
        aria-selected={value === "yearly"}
        aria-controls="pricing-plans-panel"
        className={cn(
          "caretip-pricing-billing-toggle__option caretip-pricing-billing-toggle__option--yearly",
          value === "yearly" && "caretip-pricing-billing-toggle__option--active",
        )}
        onClick={() => onChange("yearly")}
      >
        <span>{t("staticPages.pricing.billing.yearly")}</span>
        <span
          className={cn(
            "caretip-pricing-save-badge",
            !YEARLY_BILLING_ENABLED && "caretip-pricing-save-badge--soon",
          )}
        >
          {YEARLY_BILLING_ENABLED
            ? t("staticPages.pricing.billing.saveBadge")
            : t("staticPages.pricing.billing.comingSoonBadge")}
        </span>
      </button>
    </div>
  );
}
