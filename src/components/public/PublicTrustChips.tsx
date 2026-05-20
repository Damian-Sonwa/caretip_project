import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { publicPageUi } from "@/components/public/publicPageUi";

const TRUST_CHIP_KEYS = [
  "liveMinutes",
  "noApp",
  "instantPayouts",
  "secureOnboarding",
  "worksInstantly",
] as const;

type PublicTrustChipsProps = {
  className?: string;
};

export function PublicTrustChips({ className }: PublicTrustChipsProps) {
  const { t } = useTranslation();

  return (
    <ul
      className={cn("flex flex-wrap items-center gap-2 sm:gap-2.5", className)}
      aria-label={t("staticPages.common.trustChipsAria")}
    >
      {TRUST_CHIP_KEYS.map((key) => (
        <li key={key}>
          <span className={publicPageUi.trustChip}>
            <span className={publicPageUi.trustChipDot} aria-hidden />
            {t(`staticPages.common.trustChips.${key}`)}
          </span>
        </li>
      ))}
    </ul>
  );
}
