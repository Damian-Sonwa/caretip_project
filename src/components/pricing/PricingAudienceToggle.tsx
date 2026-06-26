import { useTranslation } from "react-i18next";
import type { PricingPageAudience } from "@/app/data/pricingAudience";
import { PRICING_PAGE_AUDIENCES } from "@/app/data/pricingAudience";
import { cn } from "@/lib/utils";

type PricingAudienceToggleProps = {
  value: PricingPageAudience;
  onChange: (audience: PricingPageAudience) => void;
  className?: string;
  "aria-labelledby"?: string;
};

const AUDIENCE_OPTION_IDS: Record<PricingPageAudience, string> = {
  hotels_logistics: "pricing-audience-hotels-logistics",
  midwives_freelancers: "pricing-audience-midwives-freelancers",
};

export function PricingAudienceToggle({
  value,
  onChange,
  className,
  "aria-labelledby": ariaLabelledBy,
}: PricingAudienceToggleProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn("caretip-pricing-audience-toggle", className)}
      data-audience={value}
      role="tablist"
      aria-label={ariaLabelledBy ? undefined : t("staticPages.pricing.audienceToggle.aria")}
      aria-labelledby={ariaLabelledBy}
    >
      <span className="caretip-pricing-audience-toggle__indicator" aria-hidden />
      {PRICING_PAGE_AUDIENCES.map((audience) => (
        <button
          key={audience}
          type="button"
          role="tab"
          id={AUDIENCE_OPTION_IDS[audience]}
          aria-selected={value === audience}
          aria-controls="pricing-plans-panel"
          className={cn(
            "caretip-pricing-audience-toggle__option",
            value === audience && "caretip-pricing-audience-toggle__option--active",
          )}
          onClick={() => onChange(audience)}
        >
          {t(`staticPages.pricing.audienceToggle.${audience}`)}
        </button>
      ))}
    </div>
  );
}
