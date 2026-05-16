import * as React from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { motion } from "motion/react";

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
  stats = ["1 reference", "30s setup", "Share‑ready"],
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
  const carouselImages = React.useMemo(
    () =>
      tabsProp.map((t) => ({
        src: t.src,
        alt: t.alt ?? t.label,
        imageFit: t.imageFit,
        objectPosition: t.imageObjectPosition,
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
          ? "relative isolate w-full min-w-0 overflow-x-hidden bg-gradient-to-b from-[#fafaf8] via-white to-[#f4f3f0] text-gray-900 pt-11 pb-6 sm:pt-16 sm:pb-10 md:pt-[5.25rem] md:pb-14 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950 dark:text-neutral-100"
          : "w-full bg-transparent text-foreground pt-14 sm:pt-16",
        id && "scroll-mt-[80px]",
        className,
      )}
    >
      {cinematic && !splitPattern ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 min-h-[min(88vh,900px)] bg-[radial-gradient(ellipse_150%_68%_at_50%_-10%,rgba(235,153,44,0.065),transparent_62%),radial-gradient(ellipse_100%_58%_at_0%_40%,rgba(120,113,105,0.042),transparent_58%),radial-gradient(ellipse_100%_58%_at_100%_54%,rgba(235,153,44,0.036),transparent_58%)] dark:opacity-40"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 inset-y-0 opacity-[0.28] dark:opacity-[0.16] bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.26)_38%,rgba(255,255,255,0.18)_50%,rgba(255,255,255,0.26)_62%,transparent_100%)]"
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
                  style={{ background: "rgba(235,153,44,0.20)" }}
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
                    className="text-balance text-4xl font-bold leading-[0.95] text-gray-900 sm:text-5xl md:text-6xl"
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
                      "radial-gradient(900px circle at 85% 35%, rgba(235,153,44,0.45), transparent 60%), radial-gradient(1200px circle at 30% 75%, rgba(0,0,0,0.06), transparent 62%)",
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
              ? "mx-auto relative z-[1] flex w-full max-w-7xl flex-col gap-3 px-4 pb-3 pt-1 max-md:gap-y-2 sm:gap-5 sm:px-6 sm:pb-8 sm:pt-3 md:flex-row md:items-center md:gap-10 md:px-8 md:pb-10 md:pt-3 lg:gap-12 lg:px-10"
              : "mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-6 pt-16 pb-24 md:grid-cols-12 md:gap-10 md:pt-20 md:pb-32 lg:gap-14",
          )}
        >
        <div
          className={cn(
            "relative",
            !cinematic && "md:col-span-5",
            cinematic &&
              "order-1 flex flex-1 flex-col self-stretch max-md:items-stretch max-md:pt-0 md:flex-1 md:self-stretch md:flex md:flex-col md:justify-center md:pt-2 lg:pr-4",
          )}
        >
            {eyebrow?.trim() ? (
              <Badge
                variant="outline"
                className={cn(
                  "mb-6",
                  cinematic
                    ? "max-md:mx-auto max-md:mb-3 mb-4 text-gray-900 border-black/[0.10] bg-white sm:mb-6"
                    : "border-primary/40 text-foreground",
                )}
              >
                {eyebrow}
              </Badge>
            ) : null}

            <motion.h1
              className={cn(
                "text-balance font-bold",
                cinematic
                  ? "text-[1.65rem] leading-[1.18] tracking-[-0.02em] text-gray-950 sm:text-4xl sm:leading-[1.08] md:text-6xl dark:text-neutral-50"
                  : "text-4xl leading-[1.08] sm:text-5xl md:text-6xl",
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {title}
            </motion.h1>

            {description ? (
            <p
              className={cn(
                "mt-5 max-w-xl sm:mt-6",
                cinematic
                  ? "max-md:mt-3 mb-0.5 text-pretty text-[14px] font-normal leading-[1.62] tracking-[-0.01em] text-neutral-600 dark:text-neutral-300 sm:text-[17px] sm:leading-[1.65]"
                  : "leading-relaxed text-muted-foreground",
              )}
            >
                {description}
              </p>
            ) : null}

            {cinematic && stats.length > 0 ? (
              <LandingBenefitChecklist
                items={stats}
                tone="cinematic"
                className="mt-4 max-w-xl max-md:mt-3 sm:mt-5 sm:gap-3"
              />
            ) : null}

            <div
              className={cn(
                "max-w-xl",
                cinematic && "w-full",
                cinematic && (stats.length > 0 ? "mt-3 sm:mt-6" : "mt-4 sm:mt-8"),
                !cinematic && "mt-8 sm:mt-10",
              )}
            >
              {!cinematic ? (
                <Accordion type="single" collapsible className="w-full">
                  {steps.map((step) => (
                    <AccordionItem key={step.id} value={step.id}>
                      <AccordionTrigger className="text-left text-base font-semibold">{step.title}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">{step.text}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : null}

                  <div
                    className={cn(
                      "flex w-full flex-wrap items-stretch justify-center gap-3 sm:justify-start",
                      cinematic
                        ? "mx-auto mt-2 max-w-[min(100%,320px)] flex-col gap-1.5 sm:mx-0 sm:mt-5 sm:max-w-none sm:flex-row sm:flex-wrap sm:gap-3.5"
                        : "mt-4 gap-3 sm:mt-7",
                    )}
                  >
                <Button
                  asChild
                  size={cinematic ? "default" : "lg"}
                  variant="default"
                  className={cn(
                    "rounded-2xl font-bold leading-none sm:w-auto",
                    cinematic
                      ? [
                          "h-12 w-full min-w-0 border-0 px-6 text-base font-bold tracking-tight shadow-[0_12px_38px_-10px_rgba(235,153,44,0.42)] max-md:h-11 max-md:text-[15px] max-md:font-semibold max-md:ring-2 max-md:ring-[#EB992C]/20 sm:h-12 sm:min-w-[11.5rem] sm:rounded-xl sm:px-7",
                          "bg-[#EB992C] text-white hover:bg-[#d88926] hover:shadow-[0_14px_44px_-8px_rgba(235,153,44,0.48)]",
                          "focus-visible:ring-2 focus-visible:ring-[#EB992C]/40 focus-visible:ring-offset-2",
                        ]
                      : "h-12 w-[min(64%,280px)] px-6",
                    !cinematic && "w-[min(64%,280px)]",
                    !cinematic &&
                      "bg-[#EB992C] text-white hover:bg-[#d88926] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EB992C]",
                  )}
                >
                  <Link
                    to={primaryCtaTo}
                    className={cn(
                      "whitespace-nowrap",
                      cinematic &&
                        "inline-flex h-full min-h-0 w-full items-center justify-center gap-2 px-0 py-0 sm:w-auto",
                    )}
                  >
                    {primaryCtaLabel}
                  </Link>
                </Button>
                <Button
                  asChild
                  size={cinematic ? "default" : "lg"}
                  variant={cinematic ? "ghost" : "outline"}
                  className={cn(
                    "rounded-2xl leading-none sm:w-auto",
                    cinematic
                      ? [
                          "h-12 w-full min-w-0 border border-neutral-300/85 bg-white/80 px-5 text-[13px] font-medium leading-none text-neutral-600 shadow-sm backdrop-blur-sm max-md:h-11 max-md:border-[1.5px] max-md:border-stone-300/90 max-md:bg-white/95 max-md:px-5 max-md:text-[14px] max-md:shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07)]",
                          "hover:border-neutral-400/90 hover:bg-stone-50/95 hover:text-neutral-900 hover:shadow-md",
                          "dark:border-neutral-600/90 dark:bg-neutral-900/50 dark:text-neutral-200 dark:hover:border-neutral-500 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-50",
                          "max-md:dark:border-neutral-500/95 max-md:dark:bg-neutral-950/65 max-md:dark:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.35)]",
                          "sm:h-12 sm:min-w-[11.5rem] sm:rounded-xl sm:border sm:px-6 sm:text-sm sm:font-semibold sm:shadow-sm",
                        ]
                      : "h-12 w-[min(64%,280px)] border-2 bg-transparent px-6 font-semibold",
                    !cinematic && "w-[min(64%,280px)] border-primary",
                    !cinematic &&
                      "border-2 text-foreground hover:bg-muted",
                  )}
                >
                  <Link
                    to={secondaryCtaTo}
                    className={cn(
                      "whitespace-nowrap",
                      cinematic &&
                        "inline-flex h-full min-h-0 w-full items-center justify-center gap-1.5 px-0 py-0 text-neutral-700 dark:text-neutral-200 sm:w-auto",
                    )}
                  >
                    <span>{secondaryCtaLabel}</span>
                    {cinematic ? <ArrowRight className="h-3.5 w-3.5 opacity-60" aria-hidden /> : null}
                  </Link>
                </Button>
              </div>
            </div>

            {!cinematic && stats.length > 0 ? (
              <LandingBenefitChecklist items={stats} tone="default" className="mt-5 sm:mt-7" />
            ) : null}
          </div>

        <div
          className={cn(
            "relative flex min-h-0 w-full items-center justify-center max-md:flex-col max-md:items-center",
            !cinematic && "max-md:justify-self-center md:col-span-7",
            cinematic && "order-2 max-md:w-full max-md:pt-0 md:flex-1 md:self-stretch md:justify-center md:overflow-visible md:pt-1",
          )}
        >
            {heroBorderBeam ? (
            <div className="relative mx-auto inline-block max-md:w-full max-md:max-w-[520px]">
              <div className="relative overflow-hidden rounded-2xl border border-border/90 bg-card shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                <BorderBeam
                  size={260}
                  duration={14}
                  borderWidth={1.5}
                  colorFrom="#EB992C"
                  colorTo="#F97316"
                  delay={1}
                />
                <div className="relative z-[1] bg-[rgba(235,153,44,0.12)] p-2 sm:p-3">
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
                cinematic ? (
                  <div className="relative mx-auto w-full max-w-[720px] min-h-0 md:mx-auto">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 top-[10%] z-0 h-[min(440px,58vw)] w-[min(540px,94%)] max-md:h-[min(200px,48vw)] max-md:w-[min(100%,340px)] -translate-x-1/2 rounded-[48%] bg-[radial-gradient(circle,rgba(235,153,44,0.18)_0%,rgba(235,153,44,0.05)_38%,transparent_72%)] blur-3xl opacity-95 dark:opacity-45"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 top-[30%] z-0 h-[260px] w-[min(400px,88%)] max-md:h-[140px] max-md:w-[min(92vw,300px)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.09)_0%,transparent_68%)] blur-2xl dark:opacity-60"
                    />
                    <div className="relative z-[1] flex w-full justify-center md:justify-center">
                      <div className="relative w-full max-w-[590px] max-md:mx-auto max-md:translate-y-0 md:-translate-y-3 lg:-translate-y-5">
                        <div
                          aria-hidden
                          className="animate-float-shadow absolute -bottom-3 left-1/2 z-0 h-10 w-[86%] max-md:h-9 max-md:w-[88%] -translate-x-1/2 rounded-[999px] bg-[radial-gradient(ellipse_at_center,rgba(120,113,105,0.22)_0%,rgba(120,113,105,0.06)_42%,transparent_72%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.32)_0%,rgba(0,0,0,0.08)_48%,transparent_74%)]"
                        />
                        <div
                          className={cn(
                            "animate-float relative mx-auto w-[min(590px,94%)] max-w-full overflow-hidden rounded-[clamp(22px,4.5vw,40px)]",
                            "border border-neutral-200/95 bg-white",
                            "shadow-[0_22px_56px_-28px_rgba(15,23,42,0.09),0_10px_28px_-18px_rgba(15,23,42,0.05),0_4px_14px_-8px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.94)]",
                            "ring-1 ring-black/[0.04] dark:border-neutral-600/90 dark:bg-neutral-900 dark:shadow-[0_20px_48px_-22px_rgba(0,0,0,0.28),0_8px_22px_-14px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.04)] dark:ring-white/[0.06]",
                            "max-md:mx-auto max-md:w-[min(90vw,300px)] max-md:max-w-[300px] max-md:scale-100 max-md:origin-center",
                            "aspect-[2/3] max-md:h-auto max-md:max-h-none max-md:min-h-0 md:h-auto md:max-h-none md:w-[min(590px,94%)]",
                          )}
                          style={
                            singleHeroImage.objectPosition
                              ? ({ ["--hero-object-position" as any]: singleHeroImage.objectPosition } as React.CSSProperties)
                              : undefined
                          }
                        >
                          <img
                            src={singleHeroImage.src}
                            alt={singleHeroImage.alt}
                            className={cn(
                              "h-full w-full select-none",
                              "max-md:object-contain max-md:object-center max-md:p-1.5",
                              "md:object-cover md:[object-position:var(--hero-object-position,center)]",
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
