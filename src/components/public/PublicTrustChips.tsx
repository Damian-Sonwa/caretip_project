import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { publicPageUi } from "@/components/public/publicPageUi";

type TrustChipVariant = "default" | "features" | "faq" | "pricing" | "howItWorks";

const CHIP_KEYS: Record<TrustChipVariant, readonly string[]> = {
  default: ["liveMinutes", "noApp", "instantPayouts", "secureOnboarding", "worksInstantly"],
  features: ["liveMinutes", "noApp", "instantPayouts", "secureOnboarding", "worksInstantly"],
  faq: ["liveMinutes", "noApp", "instantPayouts", "secureOnboarding", "worksInstantly"],
  pricing: ["noApp", "instantPayouts", "secureOnboarding", "worksInstantly"],
  howItWorks: ["liveMinutes", "noApp", "instantPayouts", "secureOnboarding"],
};

type PublicTrustChipsProps = {
  className?: string;
  variant?: TrustChipVariant;
};

export function PublicTrustChips({ className, variant = "default" }: PublicTrustChipsProps) {
  const { t } = useTranslation();
  const nsMap = {
    default: "staticPages.common.trustChips",
    features: "staticPages.common.trustChipsFeatures",
    faq: "staticPages.common.trustChipsFaq",
    pricing: "staticPages.common.trustChipsPricing",
    howItWorks: "staticPages.common.trustChipsHowItWorks",
  } as const;
  const ns = nsMap[variant];

  const keys = CHIP_KEYS[variant];

  return (
    <ul
      className={cn("flex flex-wrap items-center gap-2 sm:gap-2.5", className)}
      aria-label={t("staticPages.common.trustChipsAria")}
    >
      {keys.map((key) => (
        <li key={key}>
          <span className={publicPageUi.trustChip}>
            <span className={publicPageUi.trustChipDot} aria-hidden />
            {t(`${ns}.${key}`)}
          </span>
        </li>
      ))}
    </ul>
  );
}
