import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";

const TRUST_KEYS = [
  "auth.trust.secureAuth",
  "auth.trust.gdpr",
  "auth.trust.encryption",
] as const;

export function AuthTrustStrip() {
  const { t } = useTranslation();

  return (
    <ul className="caretip-auth-trust" aria-label={t("auth.trust.aria")}>
      {TRUST_KEYS.map((key) => (
        <li key={key}>
          <ShieldCheck className="caretip-auth-trust__icon" aria-hidden />
          <span>{t(key)}</span>
        </li>
      ))}
    </ul>
  );
}
