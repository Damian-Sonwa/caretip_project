import { ArrowRight, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { onboardingContinueBtn } from "./businessOnboardingUi";

type BusinessOnboardingFinishCtaProps = {
  busy: boolean;
  disabled: boolean;
  onFinish: () => void;
};

export function BusinessOnboardingFinishCta({ busy, disabled, onFinish }: BusinessOnboardingFinishCtaProps) {
  const { t } = useTranslation();

  return (
    <div className="business-onboarding-finish-cta space-y-4 rounded-xl bg-zinc-50/90 p-5 ring-1 ring-zinc-200/60 dark:bg-zinc-900/40 dark:ring-zinc-800">
      <p className="text-sm font-medium leading-relaxed text-zinc-700 dark:text-zinc-300">
        {t("business.onboarding.finalStep.readyMessage")}
      </p>
      <button
        type="button"
        onClick={onFinish}
        disabled={disabled || busy}
        aria-busy={busy}
        className={cn(onboardingContinueBtn, "w-full")}
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {t("business.onboarding.actions.saving")}
          </>
        ) : (
          <>
            {t("business.onboarding.actions.finish")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </button>
    </div>
  );
}
