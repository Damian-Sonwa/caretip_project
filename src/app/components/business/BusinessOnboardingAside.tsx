import { Building2, CheckCircle2, Lock, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
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

  return (
    <aside className="business-onboarding-aside" aria-label={t("business.onboarding.asideAria")}>
      <div>
        <p className="business-onboarding-aside__eyebrow">{t("business.onboarding.eyebrow")}</p>
        <h1 className="business-onboarding-aside__title text-balance">
          {t("business.onboarding.headline")}
        </h1>
        <p className="business-onboarding-aside__desc">{t("business.onboarding.description")}</p>

        <div className="business-onboarding-visual hidden sm:block" aria-hidden>
          <span className="business-onboarding-visual__badge">
            <Building2 className="h-3 w-3" />
            {t("business.onboarding.visualBadge")}
          </span>
          <div className="mt-4 space-y-3">
            <div className="h-2.5 w-3/4 rounded-full bg-neutral-200/80 dark:bg-neutral-700/80" />
            <div className="h-2.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800" />
            <div className="h-2.5 w-5/6 rounded-full bg-neutral-100 dark:bg-neutral-800" />
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/[0.04] p-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Building2 className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-2 w-2/3 rounded-full bg-primary/20" />
                <div className="h-2 w-1/2 rounded-full bg-neutral-200/80 dark:bg-neutral-700/80" />
              </div>
            </div>
          </div>
        </div>
      </div>

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

      <BusinessOnboardingProgress step={step} className="hidden lg:flex" />
    </aside>
  );
}
