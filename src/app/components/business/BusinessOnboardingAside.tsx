import { CheckCircle2, Lock, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BusinessOnboardingPreview } from "./BusinessOnboardingPreview";
import { BusinessOnboardingProgress, type OnboardingStep } from "./BusinessOnboardingProgress";

type BusinessOnboardingAsideProps = {
  step: OnboardingStep;
};

export function BusinessOnboardingAside({ step }: BusinessOnboardingAsideProps) {
  const { t } = useTranslation();

  const trustItems = [
    { icon: Lock, textKey: "business.onboarding.trust.secure" as const },
    { icon: Zap, textKey: "business.onboarding.trust.fast" as const },
    { icon: CheckCircle2, textKey: "business.onboarding.trust.editable" as const },
  ];

  const stepsRemaining = 3 - step;

  return (
    <aside className="business-onboarding-aside" aria-label={t("business.onboarding.asideAria")}>
      <div className="business-onboarding-aside__intro">
        <p className="business-onboarding-aside__eyebrow">{t("business.onboarding.eyebrow")}</p>
        <h1 className="business-onboarding-aside__title text-balance">
          {t("business.onboarding.headline")}
        </h1>
        <p className="business-onboarding-aside__desc">{t("business.onboarding.description")}</p>
        <p className="business-onboarding-aside__product">{t("business.onboarding.productPitch")}</p>
      </div>

      <BusinessOnboardingPreview step={step} />

      <ul className="business-onboarding-trust list-none" role="list">
        {trustItems.map(({ icon: Icon, textKey }) => (
          <li key={textKey} className="business-onboarding-trust__item">
            <span className="business-onboarding-trust__icon" aria-hidden>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span>{t(textKey)}</span>
          </li>
        ))}
      </ul>

      <div className="business-onboarding-aside__progress-wrap hidden lg:block">
        <p className="business-onboarding-aside__remaining">
          {stepsRemaining === 0
            ? t("business.onboarding.stepsRemaining.final")
            : t("business.onboarding.stepsRemaining", { count: stepsRemaining })}
        </p>
        <BusinessOnboardingProgress step={step} />
      </div>
    </aside>
  );
}
