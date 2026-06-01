import { useTranslation } from "react-i18next";
import { onboardingTrustItem } from "./businessOnboardingUi";

const TRUST_KEYS = [
  "business.onboarding.trust.secure",
  "business.onboarding.trust.fast",
  "business.onboarding.trust.editable",
] as const;

export function BusinessOnboardingTrust() {
  const { t } = useTranslation();

  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2" role="list">
      {TRUST_KEYS.map((key) => (
        <li key={key} className={onboardingTrustItem}>
          {t(key)}
        </li>
      ))}
    </ul>
  );
}
