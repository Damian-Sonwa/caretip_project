import { CheckCircle2, Coins, CreditCard, QrCode, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const JOURNEY_STEPS = [
  { key: "scan", icon: QrCode },
  { key: "select", icon: Users },
  { key: "amount", icon: Coins },
  { key: "pay", icon: CreditCard },
  { key: "thanks", icon: CheckCircle2 },
] as const;

type BusinessOnboardingCustomerJourneyProps = {
  className?: string;
};

export function BusinessOnboardingCustomerJourney({ className }: BusinessOnboardingCustomerJourneyProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn("business-onboarding-customer-journey", className)}
      aria-label={t("business.onboarding.preview.customerJourney.aria")}
    >
      <div className="business-onboarding-customer-journey__header">
        <p className="business-onboarding-customer-journey__title">
          {t("business.onboarding.preview.customerJourney.title")}
        </p>
        <p className="business-onboarding-customer-journey__subtitle">
          {t("business.onboarding.preview.customerJourney.subtitle")}
        </p>
      </div>

      <ol className="business-onboarding-customer-journey__steps">
        {JOURNEY_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === JOURNEY_STEPS.length - 1;

          return (
            <li key={step.key} className="business-onboarding-customer-journey__step">
              <div className="business-onboarding-customer-journey__step-inner">
                <span className="business-onboarding-customer-journey__icon-wrap" aria-hidden>
                  <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={2.25} />
                </span>
                <div className="business-onboarding-customer-journey__copy">
                  <p className="business-onboarding-customer-journey__step-title">
                    {t(`business.onboarding.preview.customerJourney.steps.${step.key}.title`)}
                  </p>
                  <p className="business-onboarding-customer-journey__step-desc">
                    {t(`business.onboarding.preview.customerJourney.steps.${step.key}.desc`)}
                  </p>
                </div>
              </div>
              {!isLast ? (
                <span className="business-onboarding-customer-journey__connector" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
