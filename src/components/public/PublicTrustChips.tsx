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
  /** Chip surface style — `onDark` for orange-black panels */
  tone?: "light" | "onDark";
};

export function PublicTrustChips({ className, variant = "default", tone = "light" }: PublicTrustChipsProps) {
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
          <span
            className={cn(
              publicPageUi.trustChip,
              tone === "onDark" &&
                "border-white/10 bg-white/[0.06] text-neutral-300 shadow-none dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-300",
            )}
          >
            <span
              className={cn(publicPageUi.trustChipDot, tone === "onDark" && "bg-amber-400")}
              aria-hidden
            />
            {t(`${ns}.${key}`)}
          </span>
        </li>
      ))}
    </ul>
  );
}
