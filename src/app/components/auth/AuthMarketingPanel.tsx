import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { CareTipLogo } from "@/app/components/CareTipLogo";
import { cn } from "@/lib/utils";

const BUSINESS_BENEFIT_KEYS = [
  "auth.marketing.benefitTeam",
  "auth.marketing.benefitQr",
  "auth.marketing.benefitAnalytics",
  "auth.marketing.benefitPayments",
] as const;

const EMPLOYEE_BENEFIT_KEYS = [
  "auth.employeeMarketing.benefitEarnings",
  "auth.employeeMarketing.benefitInsights",
  "auth.employeeMarketing.benefitHistory",
  "auth.employeeMarketing.benefitSecure",
] as const;

type AuthMarketingPanelProps = {
  lane?: "business" | "employee";
  /** Scales down logo and marketing copy (~30% tighter). */
  compact?: boolean;
};

/** Curved brand panel — trust narrative (business vs staff). */
export function AuthMarketingPanel({ lane = "business", compact = false }: AuthMarketingPanelProps) {
  const { t } = useTranslation();
  const isEmployee = lane === "employee";
  const benefitKeys = isEmployee ? EMPLOYEE_BENEFIT_KEYS : BUSINESS_BENEFIT_KEYS;
  const prefix = isEmployee ? "auth.employeeMarketing" : "auth.marketing";

  return (
    <aside
      className={cn(
        "caretip-auth-marketing caretip-auth-marketing--blob-overlay",
        compact && "caretip-auth-marketing--compact",
      )}
      aria-label={t(`${prefix}.panelAria`)}
    >
      <div className="caretip-auth-marketing__glow" aria-hidden />
      <div className="caretip-auth-marketing__grain" aria-hidden />

      <div className="caretip-auth-marketing__inner">
        <div className="caretip-auth-marketing__content">
          <CareTipLogo size="auth" align="start" layoutIsolatedDouble visualScale={compact ? 0.92 : 1.28} />

          <span className="caretip-auth-marketing__badge">{t(`${prefix}.badge`)}</span>

          <h2 className="caretip-auth-marketing__headline">{t(`${prefix}.headline`)}</h2>
          <p className="caretip-auth-marketing__body">{t(`${prefix}.body`)}</p>

          <ul className="caretip-auth-marketing__benefits">
            {benefitKeys.map((key) => (
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
