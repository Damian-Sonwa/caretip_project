import { Check, Clock, CreditCard, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const TRUST_KEYS = ["noContracts", "stripe", "transparent", "setup"] as const;

const TRUST_ICONS = {
  noContracts: Check,
  stripe: CreditCard,
  transparent: Shield,
  setup: Clock,
} as const;

type PricingTrustSignalsProps = {
  className?: string;
  subtle?: boolean;
};

export function PricingTrustSignals({ className, subtle = false }: PricingTrustSignalsProps) {
  const { t } = useTranslation();

  return (
    <ul
      className={cn("caretip-pricing-trust", subtle && "caretip-pricing-trust--subtle", className)}
      aria-label={t("staticPages.pricing.trust.aria")}
    >
      {TRUST_KEYS.map((key) => {
        const Icon = TRUST_ICONS[key];
        return (
          <li key={key} className="caretip-pricing-trust__item">
            <span className="caretip-pricing-trust__icon" aria-hidden>
              <Icon className="size-3.5" strokeWidth={2.25} />
            </span>
            <span>{t(`staticPages.pricing.trust.${key}`)}</span>
          </li>
        );
      })}
    </ul>
  );
}
