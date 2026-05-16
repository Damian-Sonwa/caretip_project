import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { landingUi } from "@/components/landing/landingUi";
import { LandingBenefitBlock } from "@/components/landing/LandingCheckBadge";
import { cn } from "@/lib/utils";

export type LandingShowcaseBenefit = {
  title: string;
  description: string;
};

export type LandingSplitShowcaseSectionProps = {
  id: string;
  /** Visual column on large screens: left or right */
  visualPosition: "left" | "right";
  tone?: "warm" | "muted";
  eyebrow: string;
  titleLine1: string;
  titleLine2?: string;
  subtitle: string;
  benefits: LandingShowcaseBenefit[];
  benefitsVariant?: "split" | "showcase";
  cta?: { label: string; to: string; icon?: ReactNode };
  visual: ReactNode;
  benefitsAriaLabel?: string;
};

export function LandingSplitShowcaseSection({
  id,
  visualPosition,
  tone = "warm",
  eyebrow,
  titleLine1,
  titleLine2,
  subtitle,
  benefits,
  benefitsVariant = "showcase",
  cta,
  visual,
  benefitsAriaLabel,
}: LandingSplitShowcaseSectionProps) {
  const visualFirstOnMobile = true;
  const visualLgOrder = visualPosition === "left" ? "lg:order-1" : "lg:order-2";
  const copyLgOrder = visualPosition === "left" ? "lg:order-2" : "lg:order-1";

  return (
    <section
      id={id}
      className={cn(
        landingUi.showcaseSection,
        tone === "muted" ? landingUi.showcaseSectionToneMuted : landingUi.showcaseSectionToneWarm,
      )}
    >
      <div className={landingUi.showcaseGrid}>
        <motion.div
          initial={{ opacity: 0, x: visualPosition === "left" ? -24 : 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className={cn(
            landingUi.showcaseVisualCol,
            visualFirstOnMobile ? "order-1" : "order-2",
            visualLgOrder,
          )}
        >
          <div className="relative w-full">{visual}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: visualPosition === "left" ? 24 : -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className={cn(
            landingUi.showcaseCopy,
            visualFirstOnMobile ? "order-2 max-lg:mt-2" : "order-1",
            copyLgOrder,
          )}
        >
          <div className={landingUi.showcaseIntro}>
            <span className={landingUi.pill}>{eyebrow}</span>
            <h2 className={landingUi.showcaseHeadline}>
              <span className="block text-neutral-900 dark:text-neutral-100">{titleLine1}</span>
              {titleLine2 ? (
                <span className={landingUi.showcaseHeadlineAccent}>{titleLine2}</span>
              ) : null}
            </h2>
            <p className={landingUi.showcaseSubtitle}>{subtitle}</p>
          </div>

          <div className={landingUi.showcaseActionCluster}>
            <div
              className={cn(
                landingUi.showcaseBenefits,
                benefitsVariant === "showcase" && landingUi.showcaseBenefitsPanel,
              )}
              role="list"
              aria-label={benefitsAriaLabel}
            >
              {benefits.map((item) => (
                <LandingBenefitBlock
                  key={item.title}
                  variant={benefitsVariant}
                  title={item.title}
                  description={item.description}
                  className={benefitsVariant === "showcase" ? "py-3.5 sm:py-4" : undefined}
                />
              ))}
            </div>

            {cta ? (
              <Link to={cta.to} className={cn(landingUi.cta, landingUi.showcaseCta)}>
                {cta.icon}
                {cta.label}
              </Link>
            ) : null}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/** Shared image frame + ambient glow for split showcase visuals */
export function LandingShowcaseVisualFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full", className)}>
      <div aria-hidden className={landingUi.showcaseVisualGlow} />
      {children}
    </div>
  );
}

export function LandingShowcaseCoverImage({
  src,
  alt,
  objectPosition = "center",
  className,
}: {
  src: string;
  alt: string;
  objectPosition?: string;
  className?: string;
}) {
  return (
    <LandingShowcaseVisualFrame>
      <div className={landingUi.showcaseVisualFrame}>
        <img
          src={src}
          alt={alt}
          className={cn(landingUi.showcaseVisualImg, className)}
          style={{ objectPosition }}
          loading="lazy"
          decoding="async"
        />
      </div>
    </LandingShowcaseVisualFrame>
  );
}
