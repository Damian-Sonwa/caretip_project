import { useTranslation } from "react-i18next";
import { onboardingDisplayFont, onboardingHeadline, onboardingSubhead } from "./businessOnboardingUi";

export function BusinessOnboardingWelcome() {
  const { t } = useTranslation();

  return (
    <header className="space-y-3">
      <h1
        className={onboardingHeadline}
        style={{ fontFamily: onboardingDisplayFont }}
      >
        {t("business.onboarding.headline")}
      </h1>
      <p className={onboardingSubhead}>{t("business.onboarding.description")}</p>
    </header>
  );
}
