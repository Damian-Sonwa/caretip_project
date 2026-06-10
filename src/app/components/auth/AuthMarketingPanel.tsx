import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { CareTipLogo } from "@/app/components/CareTipLogo";

const BENEFIT_KEYS = [
  "auth.marketing.benefitTeam",
  "auth.marketing.benefitQr",
  "auth.marketing.benefitAnalytics",
  "auth.marketing.benefitPayments",
] as const;

/** Curved brand panel — trust narrative. */
export function AuthMarketingPanel() {
  const { t } = useTranslation();

  return (
    <aside className="caretip-auth-marketing caretip-auth-marketing--blob-overlay" aria-label={t("auth.marketing.panelAria")}>
      <div className="caretip-auth-marketing__glow" aria-hidden />
      <div className="caretip-auth-marketing__grain" aria-hidden />

      <div className="caretip-auth-marketing__inner">
        <div className="caretip-auth-marketing__content">
          <CareTipLogo size="auth" align="start" layoutIsolatedDouble visualScale={1.28} />

          <span className="caretip-auth-marketing__badge">{t("auth.marketing.badge")}</span>

          <h2 className="caretip-auth-marketing__headline">{t("auth.marketing.headline")}</h2>
          <p className="caretip-auth-marketing__body">{t("auth.marketing.body")}</p>

          <ul className="caretip-auth-marketing__benefits">
            {BENEFIT_KEYS.map((key) => (
              <li key={key}>
                <Check className="caretip-auth-marketing__check" aria-hidden />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
