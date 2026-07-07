import { useTranslation } from "react-i18next";
import featureHeroWebp from "../../../../images/feature01.webp";
import featureHeroAvif from "../../../../images/feature01.avif";
import { MarketingPicture } from "@/lib/marketingPicture";
import { cn } from "@/lib/utils";

type FeaturesPageHeroVisualProps = {
  className?: string;
};

export function FeaturesPageHeroVisual({ className }: FeaturesPageHeroVisualProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "caretip-features-hero-v2__visual caretip-features-hero-v2__anim caretip-features-hero-v2__visual-enter",
        className,
      )}
      style={{ animationDelay: "110ms" }}
    >
      <div className="caretip-features-hero-v2__visual-stage">
        <div className="caretip-features-hero-v2__visual-glow caretip-features-hero-v2__visual-glow--core" aria-hidden />
        <div className="caretip-features-hero-v2__visual-glow caretip-features-hero-v2__visual-glow--halo" aria-hidden />
        <div className="caretip-features-hero-v2__visual-ring" aria-hidden />

        <div className="caretip-features-hero-v2__visual-main-wrap caretip-features-hero-v2__float-y">
          <MarketingPicture
            src={featureHeroWebp}
            webpSrc={featureHeroWebp}
            avifSrc={featureHeroAvif}
            alt={t("staticPages.features.title")}
            className="caretip-features-hero-v2__visual-main"
            priority
            fadeIn={false}
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}
