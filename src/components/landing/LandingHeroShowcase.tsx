import type { ImgHTMLAttributes } from "react";
import { motion } from "motion/react";

import { landingUi } from "@/components/landing/landingUi";
import { cn } from "@/lib/utils";

type LandingHeroShowcaseProps = {
  src: string;
  alt: string;
  className?: string;
};

/** Premium hero showcase — card dimensions match the image (shrink-wrapped). */
export function LandingHeroShowcase({ src, alt, className }: LandingHeroShowcaseProps) {
  return (
    <motion.div
      className={cn(landingUi.heroMediaShell, className)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
    >
      <div className={landingUi.heroShowcaseFrame}>
        <motion.div
          aria-hidden
          className={landingUi.heroShowcaseGlow}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
        />
        <motion.div
          className={landingUi.heroShowcaseCard}
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          <motion.img
            src={src}
            alt={alt}
            className={landingUi.heroShowcaseImg}
            loading="eager"
            decoding="async"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.75, ease: "easeOut", delay: 0.12 }}
            {...({ fetchpriority: "high" } as ImgHTMLAttributes<HTMLImageElement>)}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
