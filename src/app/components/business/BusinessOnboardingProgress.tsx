import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const STEP_KEYS = [
  "business.onboarding.steps.businessDetails",
  "business.onboarding.steps.locationDetails",
  "business.onboarding.steps.verificationFinish",
] as const;

export type OnboardingStep = 1 | 2 | 3;

type BusinessOnboardingProgressProps = {
  step: OnboardingStep;
  className?: string;
};

export function BusinessOnboardingProgress({ step, className }: BusinessOnboardingProgressProps) {
  const { t } = useTranslation();

  return (
    <ol
      className={cn("business-onboarding-progress list-none", className)}
      aria-label={t("business.onboarding.progressAria")}
    >
      {STEP_KEYS.map((labelKey, index) => {
        const stepNumber = (index + 1) as OnboardingStep;
        const isComplete = step > stepNumber;
        const isActive = step === stepNumber;
        const isLast = index === STEP_KEYS.length - 1;

        return (
          <li key={labelKey} className="business-onboarding-progress__item">
            <div className="business-onboarding-progress__rail" aria-hidden>
              <span
                className={cn(
                  "business-onboarding-progress__dot",
                  isComplete && "business-onboarding-progress__dot--complete",
                  isActive && "business-onboarding-progress__dot--active",
                )}
              >
                {isComplete ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : stepNumber}
              </span>
              {!isLast ? (
                <span
                  className={cn(
                    "business-onboarding-progress__line",
                    isComplete && "business-onboarding-progress__line--complete",
                  )}
                />
              ) : null}
            </div>
            <div className="min-w-0 pb-1">
              <span
                className={cn(
                  "business-onboarding-progress__label",
                  isComplete && "business-onboarding-progress__label--complete",
                  isActive && "business-onboarding-progress__label--active",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {t(labelKey)}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
