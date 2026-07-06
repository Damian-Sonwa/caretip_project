import type { ImgHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import featureHeroImg from "../../../../images/feature01.png";
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
          <img
            src={featureHeroImg}
            alt={t("staticPages.features.title")}
            className="caretip-features-hero-v2__visual-main"
            loading="eager"
            {...({ fetchpriority: "high" } as ImgHTMLAttributes<HTMLImageElement>)}
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}
