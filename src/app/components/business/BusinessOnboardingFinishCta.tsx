import { Loader2, Rocket } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { onboardingFinishBtn } from "./businessOnboardingUi";

type BusinessOnboardingFinishCtaProps = {
  busy: boolean;
  disabled: boolean;
  onFinish: () => void;
};

export function BusinessOnboardingFinishCta({ busy, disabled, onFinish }: BusinessOnboardingFinishCtaProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="business-onboarding-finish-cta"
    >
      <div className="business-onboarding-finish-cta__copy">
        <p className="business-onboarding-finish-cta__title">{t("business.onboarding.finalStep.readyTitle")}</p>
        <p className="business-onboarding-finish-cta__message">{t("business.onboarding.finalStep.readyMessage")}</p>
      </div>
      <button
        type="button"
        onClick={onFinish}
        disabled={disabled || busy}
        aria-busy={busy}
        className={cn(onboardingFinishBtn, "business-onboarding-finish-cta__button w-full")}
      >
        {busy ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            {t("business.onboarding.actions.publishing")}
          </>
        ) : (
          <>
            <Rocket className="h-5 w-5" aria-hidden />
            {t("business.onboarding.actions.finish")}
          </>
        )}
      </button>
      <p className="business-onboarding-finish-cta__footnote">{t("business.onboarding.finalStep.publishHint")}</p>
    </motion.div>
  );
}
