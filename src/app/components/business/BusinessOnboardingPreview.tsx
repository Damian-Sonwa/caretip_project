import { Building2, MapPin, QrCode, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { OnboardingStep } from "./BusinessOnboardingProgress";

type BusinessOnboardingPreviewProps = {
  step: OnboardingStep;
};

export function BusinessOnboardingPreview({ step }: BusinessOnboardingPreviewProps) {
  const { t } = useTranslation();

  if (step === 1) {
    return (
      <div className="business-onboarding-preview" role="img" aria-label={t("business.onboarding.preview.step1Aria")}>
        <div className="business-onboarding-preview__header">
          <span className="business-onboarding-preview__icon">
            <Building2 className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="business-onboarding-preview__title">{t("business.onboarding.preview.step1Title")}</p>
            <p className="business-onboarding-preview__subtitle">{t("business.onboarding.preview.step1Subtitle")}</p>
          </div>
        </div>
        <div className="business-onboarding-preview__body">
          <div className="business-onboarding-preview__row">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {t("business.onboarding.preview.venueLabel")}
            </span>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t("business.onboarding.preview.venueExample")}
            </span>
          </div>
          <div className="business-onboarding-preview__chip">{t("business.onboarding.preview.typeExample")}</div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="business-onboarding-preview" role="img" aria-label={t("business.onboarding.preview.step2Aria")}>
        <div className="business-onboarding-preview__header">
          <span className="business-onboarding-preview__icon">
            <MapPin className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="business-onboarding-preview__title">{t("business.onboarding.preview.step2Title")}</p>
            <p className="business-onboarding-preview__subtitle">{t("business.onboarding.preview.step2Subtitle")}</p>
          </div>
        </div>
        <div className="business-onboarding-preview__body">
          <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            {t("business.onboarding.preview.addressExample")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="business-onboarding-preview" role="img" aria-label={t("business.onboarding.preview.step3Aria")}>
      <div className="business-onboarding-preview__header">
        <span className="business-onboarding-preview__icon">
          <QrCode className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="business-onboarding-preview__title">{t("business.onboarding.preview.step3Title")}</p>
          <p className="business-onboarding-preview__subtitle">{t("business.onboarding.preview.step3Subtitle")}</p>
        </div>
      </div>
      <div className="business-onboarding-preview__body business-onboarding-preview__body--qr">
        <div className="business-onboarding-preview__qr">
          <QrCode className="h-10 w-10 text-primary/80" aria-hidden />
        </div>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {t("business.onboarding.preview.readyHint")}
        </p>
      </div>
    </div>
  );
}
