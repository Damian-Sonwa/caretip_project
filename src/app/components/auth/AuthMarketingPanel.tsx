import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { CareTipLogo, CARE_TIP_LOGO_AUTH_SURFACE_CLASS } from "@/app/components/CareTipLogo";
import { cn } from "@/lib/utils";
import {
  getAuthMarketingContent,
  resolveMarketingSceneFromSignUpMode,
  type AuthLane,
  type AuthMarketingScene,
} from "./authMarketingContent";

const BENEFIT_KEYS = ["benefit1", "benefit2", "benefit3", "benefit4"] as const;

type AuthMarketingPanelProps = {
  lane?: AuthLane;
  signUpMode?: boolean;
  /** Overrides sign-in/sign-up scene — use for invite, activation, verification, etc. */
  marketingScene?: AuthMarketingScene;
  /** Scales down logo and marketing copy (~30% tighter). */
  compact?: boolean;
};

/** Curved brand panel — trust narrative (business vs staff). */
export function AuthMarketingPanel({
  lane = "business",
  signUpMode = false,
  marketingScene,
  compact = false,
}: AuthMarketingPanelProps) {
  const { t } = useTranslation();
  const scene = marketingScene ?? resolveMarketingSceneFromSignUpMode(signUpMode);
  const { i18nPrefix: prefix } = getAuthMarketingContent(lane, scene);

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
          <div
            className={cn(
              "caretip-auth-marketing__brand-row",
              compact && "caretip-auth-marketing__brand-row--compact",
            )}
          >
            <div
              className={cn(
                CARE_TIP_LOGO_AUTH_SURFACE_CLASS,
                "caretip-auth-logo-wrap caretip-auth-logo-wrap--marketing",
                compact && "caretip-auth-logo-wrap--marketing-compact",
              )}
            >
              <CareTipLogo
                size="auth"
                align="center"
                className={cn(
                  "caretip-auth-marketing__logo caretip-auth-marketing__logo--on-surface",
                  compact && "caretip-auth-marketing__logo--compact",
                )}
              />
            </div>

            <span className="caretip-auth-marketing__badge">{t(`${prefix}.badge`)}</span>
          </div>

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
