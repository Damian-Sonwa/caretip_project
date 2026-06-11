import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { CareTipLogo } from "@/app/components/CareTipLogo";
import { cn } from "@/lib/utils";

const BENEFIT_KEYS = ["benefit1", "benefit2", "benefit3", "benefit4"] as const;

type AuthMarketingPanelProps = {
  lane?: "business" | "employee";
  signUpMode?: boolean;
  /** Scales down logo and marketing copy (~30% tighter). */
  compact?: boolean;
};

/** Curved brand panel — trust narrative (business vs staff). */
export function AuthMarketingPanel({
  lane = "business",
  signUpMode = false,
  compact = false,
}: AuthMarketingPanelProps) {
  const { t } = useTranslation();
  const isEmployee = lane === "employee";
  const mode = signUpMode ? "signUp" : "signIn";
  const prefix = isEmployee ? `auth.employeeMarketing.${mode}` : `auth.marketing.${mode}`;

  return (
    <aside
      className={cn(
        "caretip-auth-marketing caretip-auth-marketing--blob-overlay",
        compact && "caretip-auth-marketing--compact",
      )}
      aria-label={t(`${prefix}.panelAria`)}
    >
      <div className="caretip-auth-marketing__inner">
        <div className="caretip-auth-marketing__content">
          <CareTipLogo size="auth" align="left" layoutIsolatedDouble visualScale={compact ? 1.05 : 1.72} />

          <span className="caretip-auth-marketing__badge">{t(`${prefix}.badge`)}</span>

          <h2 className="caretip-auth-marketing__headline">{t(`${prefix}.headline`)}</h2>
          <p className="caretip-auth-marketing__body">{t(`${prefix}.body`)}</p>

          <ul className="caretip-auth-marketing__benefits">
            {BENEFIT_KEYS.map((key) => (
              <li key={key}>
                <Check className="caretip-auth-marketing__check" aria-hidden />
                <span>{t(`${prefix}.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
