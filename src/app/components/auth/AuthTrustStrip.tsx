import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";

export function AuthTrustStrip() {
  const { t } = useTranslation();

  return (
    <p className="caretip-auth-trust caretip-auth-trust--minimal" aria-label={t("auth.trust.aria")}>
      <ShieldCheck className="caretip-auth-trust__icon" aria-hidden />
      <span>{t("auth.trust.secureAuth")}</span>
    </p>
  );
}
