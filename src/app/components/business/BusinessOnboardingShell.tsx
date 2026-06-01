import { Link } from "react-router";
import { CareTipLogo } from "../CareTipLogo";
import type { OnboardingStep } from "./BusinessOnboardingProgress";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 3;

export function BusinessOnboardingHeader() {
  return (
    <header className="business-onboarding-header">
      <Link
        to="/"
        className="inline-flex shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
      >
        <CareTipLogo size="auth" align="center" />
      </Link>
    </header>
  );
}

type BusinessOnboardingProgressHeaderProps = {
  step: OnboardingStep;
};

export function BusinessOnboardingProgressHeader({ step }: BusinessOnboardingProgressHeaderProps) {
  const { t } = useTranslation();
  const isFinal = step === TOTAL_STEPS;

  return (
    <div
      className="space-y-4"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={TOTAL_STEPS}
      aria-valuenow={step}
      aria-label={t("business.onboarding.progressAria")}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {t("business.onboarding.formStepLabel", { current: step, total: TOTAL_STEPS })}
        </p>
        {isFinal ? (
          <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-orange-700 ring-1 ring-orange-500/20 dark:text-orange-300">
            {t("business.onboarding.finalStep.badge")}
          </span>
        ) : null}
      </div>

      <div className="flex gap-1.5">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const n = (i + 1) as OnboardingStep;
          const filled = n <= step;
          return (
            <div
              key={n}
              aria-hidden
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500 ease-out",
                filled ? "bg-orange-500" : "bg-zinc-200 dark:bg-zinc-800",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

export function BusinessOnboardingFootnote() {
  const { t } = useTranslation();
  const line = [
    t("business.onboarding.trust.secure"),
    t("business.onboarding.trust.fast"),
    t("business.onboarding.trust.editable"),
  ].join("  ·  ");

  return (
    <p className="text-center text-xs leading-relaxed text-zinc-400 dark:text-zinc-500 lg:text-left">
      {line}
    </p>
  );
}

/** @deprecated Use BusinessOnboardingProgressHeader */
export function BusinessOnboardingStepBars({ step }: { step: OnboardingStep }) {
  return <BusinessOnboardingProgressHeader step={step} />;
}
