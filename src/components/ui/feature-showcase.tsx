import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { FeatureCarousel } from "@/components/ui/feature-carousel";
import { CareTipHeroAnimation } from "@/components/ui/caretip-hero-animation";
import { BorderBeam } from "@/components/ui/border-beam";
import { LandingImageFrame } from "@/components/ui/landing-image-frame";
import { LandingBenefitChecklist } from "@/components/landing/LandingCheckBadge";
import { LandingHeroShowcase } from "@/components/landing/LandingHeroShowcase";
import { landingUi } from "@/components/landing/landingUi";
import { landingHeroCopyStagger, landingHeroTextReveal } from "@/components/landing/landingHeroMotion";
import { landingType } from "@/components/landing/landingTypography";
import { useTranslation } from "react-i18next";

export type TabMedia = {
  value: string;
  label: string;
  src: string;
  alt?: string;
  /** Shown in the on-image toggle buttons */
  Icon?: LucideIcon;
  /**
   * Passed through to the carousel (hero uses a shared portrait frame; images fill with `object-cover`).
   */
  imageFit?: "cover" | "contain";
  /** Passed to `object-position` on the hero image (e.g. `center 25%` to bias framing). */
  imageObjectPosition?: string;
  /** Square frame for 1:1 hero art (e.g. glassy mockup); default is portrait phone ratio. */
  heroFrameAspect?: "phone" | "square" | "cinematic" | "showcase";
};

export type ShowcaseStep = {
  id: string;
  title: string;
  text: string;
};

export type FeatureShowcaseProps = {
  /** Anchor id for in-page navigation (e.g. landing footer links). */
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  stats?: string[];
  steps?: ShowcaseStep[];
  tabs: TabMedia[];
  defaultTab?: string;
  primaryCtaLabel?: string;
  primaryCtaTo?: string;
  secondaryCtaLabel?: string;
  secondaryCtaTo?: string;
  className?: string;
  /**
   * Cinematic hero variant (warm gradient, wide media).
   * Keeps CareTip orange as the action color.
   */
  variant?: "default" | "cinematic" | "splitPattern";
  /** Use animated hero instead of carousel (for CareTip hero section). */
  useAnimatedHero?: boolean;
  /**
   * Wrap the media panel in a border-beam card (landing marketing style).
   * Keeps content inset so the moving edge is clearly visible.
   */
  heroBorderBeam?: boolean;
};

export function FeatureShowcase({
  id,
  eyebrow,
  title,
  description,
  stats = ["1 reference", "30s setup", "Shareâ€‘ready"],
  steps = [
    {
      id: "step-1",
      title: "Drop a reference",
      text: "Upload a single image. We read it like a brief and extract palette, texture and cues.",
    },
    {
      id: "step-2",
      title: "Pick the vibe",
      text: "Switch between mockup, screen, or abstract views and tune the mood instantly.",
    },
    {
      id: "step-3",
      title: "Export & share",
      text: "Get a moodboard ready for your team with consistent visuals and notes.",
    },
  ],
  tabs: tabsProp,
  defaultTab: _defaultTab,
  primaryCtaLabel = "Get started free",
  primaryCtaTo = "/signup",
  secondaryCtaLabel = "How it works",
  secondaryCtaTo = "/how-it-works",
  className,
  variant = "default",
  useAnimatedHero = false,
  heroBorderBeam = false,
}: FeatureShowcaseProps) {
  const { i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const isDe = i18n.language?.toLowerCase().startsWith("de");

  const carouselImages = React.useMemo(
    () =>
      tabsProp.map((t) => ({
        src: t.src,
        alt: t.alt ?? t.label,
        imageFit: t.imageFit,
        objectPosition: t.imageObjectPosition,
        heroFrameAspect: t.heroFrameAspect,
      })),
    [tabsProp]
  );

  const singleHeroImage = carouselImages.length === 1 ? carouselImages[0] : null;
  const cinematic = variant === "cinematic";
  const splitPattern = variant === "splitPattern";

  return (
    <section
      id={id}
      className={cn(
        cinematic
          ? cn(
              "relative isolate w-full min-w-0 overflow-x-hidden bg-gradient-to-b from-[#fafaf8] via-white to-[#f4f3f0] text-gray-900 pb-8 max-md:px-0 sm:pb-12 md:pb-16 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950 dark:text-neutral-100",
              landingUi.heroSectionCinematic,
            )
          : "w-full bg-transparent text-foreground pt-14 sm:pt-16",
        id && "scroll-mt-[80px]",
        className,
      )}
    >
      {cinematic && !splitPattern ? (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 min-h-[min(88vh,900px)] bg-[radial-gradient(ellipse_150%_68%_at_50%_-10%,rgba(233,120,28,0.065),transparent_62%),radial-gradient(ellipse_100%_58%_at_0%_40%,rgba(120,113,105,0.042),transparent_58%),radial-gradient(ellipse_100%_58%_at_100%_54%,rgba(233,120,28,0.036),transparent_58%)] dark:opacity-40"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 inset-y-0 opacity-[0.28] dark:opacity-[0.16] bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.26)_38%,rgba(255,255,255,0.18)_50%,rgba(255,255,255,0.26)_62%,transparent_100%)]"
            animate={reduceMotion ? undefined : { opacity: [0.22, 0.3, 0.24] }}
            transition={
              reduceMotion ? undefined : { duration: 10, repeat: Infinity, ease: "easeInOut" }
            }
            style={{ willChange: "opacity" }}
          />
        </>
      ) : null}
      {splitPattern ? (
        <div className="mx-auto w-full max-w-7xl px-6 pt-14 pb-16 md:pt-16 md:pb-20">
          <div className="relative overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-stretch">
              {/* Left: textured canvas */}
              <div className="relative flex items-center p-8 sm:p-10 lg:p-12">
                {/* Ambient animated background (no stripes) */}
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-gray-50 dark:bg-neutral-900" />
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute -left-28 -top-28 h-[360px] w-[360px] rounded-full blur-3xl"
                  style={{ background: "rgba(233,120,28,0.20)" }}
                  animate={{ x: [0, 22, 0], y: [0, 14, 0] }}
                  transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-36 right-[-10%] h-[420px] w-[420px] rounded-full blur-3xl"
                  style={{ background: "rgba(0,0,0,0.08)" }}
                  animate={{ x: [0, -18, 0], y: [0, -12, 0] }}
                  transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(900px circle at 30% 45%, rgba(0,0,0,0.06), transparent 64%), radial-gradient(700px circle at 12% 28%, rgba(255,255,255,0.65), transparent 55%)",
                  }}
                />
                <div className="relative z-[1] max-w-xl">
                  {eyebrow?.trim() ? (
                    <Badge variant="outline" className="mb-6 border-primary/40 text-foreground">
                      {eyebrow}
                    </Badge>
                  ) : null}

                  <motion.h1
                    className="text-balance text-4xl font-bold leading-[0.98] text-gray-900 sm:text-5xl md:text-6xl"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  >
                    {title}
                  </motion.h1>

                  {description ? (
                    <p className="mt-5 max-w-xl text-gray-500">
                      {description}
                    </p>
                  ) : null}

                  {stats.length > 0 && (
                    <LandingBenefitChecklist items={stats} tone="split" className="mt-6 sm:mt-7" />
                  )}

                  <div className="mt-8 flex w-full flex-wrap items-stretch justify-center gap-3 sm:justify-start">
                    <Button
                      asChild
                      size="lg"
                      className="h-12 w-[min(64%,280px)] rounded-2xl px-6 font-bold leading-none sm:w-auto"
                    >
                      <Link to={primaryCtaTo} className="whitespace-nowrap">
                        {primaryCtaLabel}
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="h-12 w-[min(64%,280px)] rounded-2xl border-2 border-primary bg-transparent px-6 font-semibold leading-none sm:w-auto"
                    >
                      <Link to={secondaryCtaTo} className="whitespace-nowrap">
                        {secondaryCtaLabel}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right: brand panel + circular pattern */}
              <div className="relative flex items-center justify-center overflow-hidden bg-primary/15 p-8 sm:p-10 lg:p-12">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(900px circle at 85% 35%, rgba(233,120,28,0.45), transparent 60%), radial-gradient(1200px circle at 30% 75%, rgba(0,0,0,0.06), transparent 62%)",
                  }}
                />
                <div aria-hidden className="pointer-events-none absolute -right-28 -top-28 h-[420px] w-[420px] rounded-full border border-black/10 bg-white/20" />
                <div aria-hidden className="pointer-events-none absolute -right-10 top-24 h-[360px] w-[360px] rounded-full border border-black/10 bg-white/15" />
                <div aria-hidden className="pointer-events-none absolute right-24 -bottom-36 h-[520px] w-[520px] rounded-full border border-black/10 bg-white/10" />

                <motion.div
                  className="relative z-[1] mx-auto w-full max-w-[520px]"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
                >
                  {useAnimatedHero ? (
                    <LandingImageFrame className="mx-auto w-full bg-white">
                      <CareTipHeroAnimation />
                    </LandingImageFrame>
                  ) : singleHeroImage ? (
                    <LandingImageFrame className="mx-auto w-full bg-white">
                      <img
                        src={singleHeroImage.src}
                        alt={singleHeroImage.alt}
                        className={cn(
                          "block h-auto w-full",
                          singleHeroImage.imageFit === "contain" ? "object-contain" : "object-cover",
                        )}
                        style={{ objectPosition: singleHeroImage.objectPosition ?? "center" }}
                        loading="eager"
                        decoding="async"
                      />
                    </LandingImageFrame>
                  ) : (
                    <div className="w-full">
                      <FeatureCarousel images={carouselImages} />
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            cinematic
              ? landingUi.heroShell
              : "mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-6 pt-16 pb-24 md:grid-cols-12 md:gap-10 md:pt-20 md:pb-32 lg:gap-14",
          )}
        >
        <motion.div
          className={cn(
            "relative",
            !cinematic && "md:col-span-5",
            cinematic && landingUi.heroCopy,
          )}
          variants={cinematic && !reduceMotion ? landingHeroCopyStagger : undefined}
          initial={cinematic && !reduceMotion ? "hidden" : false}
          animate={cinematic && !reduceMotion ? "visible" : undefined}
        >
            {eyebrow?.trim() ? (
              cinematic ? (
                <motion.p className={landingUi.heroTagline} variants={landingHeroTextReveal}>
                  {eyebrow}
                </motion.p>
              ) : (
                <Badge variant="outline" className="mb-6 border-primary/40 text-foreground">
                  {eyebrow}
                </Badge>
              )
            ) : null}

            <motion.h1
              className={cn(
                cinematic
                  ? isDe
                    ? landingUi.heroHeadlineDe
                    : landingUi.heroHeadlineEn
                  : landingType.heroHeadline,
              )}
              variants={cinematic && !reduceMotion ? landingHeroTextReveal : undefined}
              initial={!cinematic && !reduceMotion ? { opacity: 0, y: 20 } : false}
              animate={!cinematic && !reduceMotion ? { opacity: 1, y: 0 } : undefined}
              transition={!cinematic ? { duration: 0.8, ease: "easeOut" } : undefined}
            >
              {title}
            </motion.h1>

            {description ? (
              cinematic ? (
                <motion.p className={landingUi.heroSubtitle} variants={landingHeroTextReveal}>
                  {description}
                </motion.p>
              ) : (
                <p className={cn(landingType.bodyLeadMuted, "mt-5 max-w-xl sm:mt-6")}>{description}</p>
              )
            ) : null}

            {cinematic ? (
              <motion.div className={landingUi.heroActionCluster} variants={landingHeroTextReveal}>
                {stats.length > 0 ? (
                  <LandingBenefitChecklist
                    items={stats}
                    tone="cinematic"
                    className={landingUi.heroBenefits}
                  />
                ) : null}
                <div className={landingUi.heroCtaRow}>
                  <Button asChild variant="default" className={landingUi.heroCtaPrimary}>
                    <Link
                      to={primaryCtaTo}
                      className="inline-flex h-full w-full items-center justify-center whitespace-nowrap"
                    >
                      {primaryCtaLabel}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className={landingUi.heroCtaSecondary}>
                    <Link
                      to={secondaryCtaTo}
                      className="inline-flex h-full w-full items-center justify-center whitespace-nowrap"
                    >
                      {secondaryCtaLabel}
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="mt-8 max-w-xl sm:mt-10">
                <Accordion type="single" collapsible className="w-full">
                  {steps.map((step) => (
                    <AccordionItem key={step.id} value={step.id}>
                      <AccordionTrigger className="text-left text-base font-semibold">{step.title}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">{step.text}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <motion.div className="mt-4 flex w-full flex-wrap items-stretch justify-start gap-3 sm:mt-7">
                  <Button
                    asChild
                    size="lg"
                    variant="default"
                    className="w-[min(64%,280px)]"
                  >
                    <Link to={primaryCtaTo} className="whitespace-nowrap">
                      {primaryCtaLabel}
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="w-[min(64%,280px)]"
                  >
                    <Link to={secondaryCtaTo} className="whitespace-nowrap">
                      {secondaryCtaLabel}
                    </Link>
                  </Button>
                </motion.div>
              </div>
            )}

            {!cinematic && stats.length > 0 ? (
              <LandingBenefitChecklist items={stats} tone="default" className="mt-5 sm:mt-7" />
            ) : null}
          </motion.div>

        <div
          className={cn(
            "relative flex min-h-0 w-full items-center justify-center max-md:flex-col max-md:items-center",
            !cinematic && "max-md:justify-self-center md:col-span-7",
            cinematic &&
              (singleHeroImage?.heroFrameAspect === "showcase"
                ? landingUi.heroMediaColShowcase
                : landingUi.heroMediaCol),
          )}
        >
            {heroBorderBeam ? (
            <div className="relative mx-auto inline-block max-md:w-full max-md:max-w-[520px]">
              <div className="relative overflow-hidden rounded-2xl border border-border/90 bg-card shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                <BorderBeam
                  size={260}
                  duration={14}
                  borderWidth={1.5}
                  colorFrom="#e9781c"
                  colorTo="#F97316"
                  delay={1}
                />
                <div className="relative z-[1] bg-[rgba(233,120,28,0.12)] p-2 sm:p-3">
                  {useAnimatedHero ? (
                    <LandingImageFrame className="mx-auto w-full max-w-[520px]">
                      <CareTipHeroAnimation />
                    </LandingImageFrame>
                  ) : singleHeroImage ? (
                    <LandingImageFrame className="mx-auto w-full max-w-[520px]">
                      <img
                        src={singleHeroImage.src}
                        alt={singleHeroImage.alt}
                        className="block aspect-[2/3] w-full object-cover object-[60%_center]"
                        loading="eager"
                        decoding="async"
                      />
                    </LandingImageFrame>
                  ) : (
                    <div className="mx-auto w-[min(100%,320px)] sm:w-[min(100%,400px)] md:w-[min(100%,480px)]">
                      <FeatureCarousel images={carouselImages} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {useAnimatedHero ? (
                <LandingImageFrame className="mx-auto w-full bg-white" style={{ maxWidth: "520px" }}>
                  <CareTipHeroAnimation />
                </LandingImageFrame>
              ) : singleHeroImage ? (
                cinematic && singleHeroImage.heroFrameAspect === "showcase" ? (
                  <LandingHeroShowcase src={singleHeroImage.src} alt={singleHeroImage.alt} />
                ) : cinematic ? (
                  <div className={cn("relative min-h-0", landingUi.heroMediaShellLegacy)}>
                    <div
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 top-[12%] z-0 h-[min(380px,56vw)] w-[min(480px,100%)] max-md:top-[8%] max-md:h-[min(140px,38vw)] max-md:w-[88%] -translate-x-1/2 rounded-[48%] bg-[radial-gradient(circle,rgba(233,120,28,0.16)_0%,rgba(233,120,28,0.05)_38%,transparent_72%)] blur-3xl opacity-90 dark:opacity-45"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 top-[34%] z-0 h-[200px] w-[min(340px,92%)] max-md:top-[30%] max-md:h-[72px] max-md:w-[84%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.07)_0%,transparent_68%)] blur-2xl dark:opacity-50"
                    />
                    <div className="relative z-[1] flex w-full justify-center max-md:py-0">
                      <div className="relative w-full max-md:mx-auto md:-translate-y-2 lg:-translate-y-4">
                        <div
                          aria-hidden
                          className="animate-float-shadow absolute -bottom-1.5 left-1/2 z-0 h-7 w-[82%] max-md:-bottom-1 max-md:h-6 -translate-x-1/2 rounded-[999px] bg-[radial-gradient(ellipse_at_center,rgba(120,113,105,0.18)_0%,rgba(120,113,105,0.05)_42%,transparent_72%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.28)_0%,rgba(0,0,0,0.07)_48%,transparent_74%)]"
                        />
                        <div
                          className={cn(
                            "animate-float relative mx-auto",
                            singleHeroImage.heroFrameAspect === "square"
                              ? landingUi.heroPhoneFrameSquare
                              : singleHeroImage.heroFrameAspect === "cinematic"
                                ? landingUi.heroPhoneFrameCinematic
                                : landingUi.heroPhoneFrame,
                          )}
                          style={
                            singleHeroImage.objectPosition
                              ? ({
                                  ["--hero-object-position"]: singleHeroImage.objectPosition,
                                } as React.CSSProperties)
                              : undefined
                          }
                        >
                          <img
                            src={singleHeroImage.src}
                            alt={singleHeroImage.alt}
                            className={cn(
                              "select-none",
                              singleHeroImage.heroFrameAspect === "cinematic"
                                ? landingUi.heroPhoneFrameCinematicImg
                                : "h-full w-full",
                              singleHeroImage.heroFrameAspect !== "cinematic" &&
                                ((singleHeroImage.imageFit ?? "contain") === "contain"
                                  ? [
                                      "max-md:object-contain max-md:object-center max-md:p-1",
                                      "md:object-contain md:[object-position:var(--hero-object-position,center)] md:p-1.5",
                                    ]
                                  : [
                                      "object-cover object-center",
                                      "[object-position:var(--hero-object-position,center)]",
                                    ]),
                            )}
                            loading="eager"
                            decoding="async"
                            {...({ fetchpriority: "high" } as unknown as React.ImgHTMLAttributes<HTMLImageElement>)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <LandingImageFrame className="mx-auto w-full bg-white" style={{ maxWidth: "520px" }}>
                    <img
                      src={singleHeroImage.src}
                      alt={singleHeroImage.alt}
                      className="block aspect-[2/3] w-full object-cover object-[60%_center]"
                      loading="eager"
                      decoding="async"
                    />
                  </LandingImageFrame>
                )
              ) : (
                <div className="mx-auto w-full" style={{ maxWidth: "520px" }}>
                  <FeatureCarousel images={carouselImages} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      )}
    </section>
  );
}
