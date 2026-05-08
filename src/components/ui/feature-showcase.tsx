import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { CheckCircle, ShieldCheck, Sparkles, Zap } from "lucide-react";

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

function iconForFeatureHighlight(label: string) {
  const s = label.trim().toLowerCase();
  if (s.includes("live") || s.includes("minute")) return Zap;
  if (s.includes("pos")) return Sparkles;
  if (s.includes("secure") || s.includes("checkout")) return ShieldCheck;
  return CheckCircle;
}

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
          ? "relative w-full overflow-x-hidden bg-gradient-to-b from-white via-neutral-50/40 to-white text-gray-900 pt-14 sm:pt-18"
          : "w-full bg-transparent text-foreground pt-14 sm:pt-18",
        id && "scroll-mt-[80px]",
        className,
      )}
    >
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
                    <ul className="mt-6 flex flex-col gap-2.5 text-[13px] font-medium text-gray-600/90 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-2">
                      {stats.map((s, i) => {
                        const Icon = iconForFeatureHighlight(s);
                        return (
                          <li key={i} className="inline-flex items-center gap-2">
                            <Icon
                              className="h-4 w-4 shrink-0 text-primary/90"
                              aria-hidden
                            />
                            <span className="leading-relaxed">{s}</span>
                          </li>
                        );
                      })}
                    </ul>
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
              ? "mx-auto relative z-[1] flex w-full max-w-7xl flex-col gap-7 px-6 pb-10 pt-12 max-md:gap-y-6 max-md:px-4 max-md:pb-6 max-md:pt-8 md:flex-row md:items-center md:gap-8 md:px-6 md:pt-16 md:pb-10 lg:gap-10 lg:px-8"
              : "mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-6 pt-16 pb-24 md:grid-cols-12 md:gap-10 md:pt-20 md:pb-32 lg:gap-14",
          )}
        >
        <div
          className={cn(
            "relative",
            !cinematic && "md:col-span-5",
            cinematic &&
              "order-1 flex flex-1 flex-col self-stretch max-md:pt-2 md:flex-1 md:self-stretch md:flex md:flex-col md:pt-6",
          )}
        >
            {eyebrow?.trim() ? (
              <Badge
                variant="outline"
                className={cn(
                  "mb-6",
                  cinematic
                    ? "max-md:mx-auto text-gray-900 border-black/[0.10] bg-white"
                    : "border-primary/40 text-foreground",
                )}
              >
                {eyebrow}
              </Badge>
            ) : null}

            <motion.h1
              className={cn(
                "text-balance text-4xl font-bold leading-[1.08] sm:text-5xl md:text-6xl",
              cinematic && "text-gray-900",
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
                "mt-4 max-w-xl leading-relaxed sm:mt-5",
                cinematic ? "mb-1 text-gray-500" : "text-muted-foreground",
              )}
            >
                {description}
              </p>
            ) : null}

            {stats.length > 0 && (
              <ul
                className={cn(
                  "mt-5 flex flex-col gap-2.5 text-[13px] font-medium sm:mt-6",
                  cinematic
                    ? "text-gray-600/90 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-2"
                    : "text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2",
                )}
              >
                {stats.map((s, i) => {
                  const Icon = iconForFeatureHighlight(s);
                  return (
                    <li key={i} className="inline-flex items-center gap-2">
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          cinematic ? "text-primary/90" : "text-primary",
                        )}
                        aria-hidden
                      />
                      <span className="leading-relaxed">{s}</span>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className={cn("mt-8 max-w-xl sm:mt-10")}>
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

              <div className="mt-4 flex w-full flex-wrap items-stretch justify-center gap-3 sm:mt-7 sm:justify-start">
                <Button
                  asChild
                  size="lg"
                  className={cn(
                    "h-12 w-[min(64%,280px)] rounded-full px-6 font-bold leading-none sm:w-auto",
                    cinematic &&
                      "rounded-2xl bg-[#EB992C] text-white hover:bg-[#d88926] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EB992C]",
                  )}
                >
                  <Link to={primaryCtaTo} className="whitespace-nowrap">
                    {primaryCtaLabel}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className={cn(
                    "h-12 w-[min(64%,280px)] rounded-full border-2 bg-transparent px-6 font-semibold leading-none sm:w-auto",
                    cinematic
                      ? "rounded-2xl border-neutral-300 text-gray-900 hover:bg-neutral-100 hover:text-gray-900 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800/70"
                      : "border-primary",
                  )}
                >
                  <Link to={secondaryCtaTo} className="whitespace-nowrap">
                    {secondaryCtaLabel}
                  </Link>
                </Button>
              </div>
            </div>
          </div>

        <div
          className={cn(
            "relative flex min-h-0 items-center justify-center",
            !cinematic && "md:col-span-7",
            cinematic && "order-2 max-md:w-full md:flex-1 md:self-stretch md:justify-center md:overflow-visible",
          )}
        >
            {heroBorderBeam ? (
            <div className="relative inline-block">
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
                    <LandingImageFrame className="w-full max-w-[520px]">
                      <CareTipHeroAnimation />
                    </LandingImageFrame>
                  ) : singleHeroImage ? (
                    <LandingImageFrame className="w-full max-w-[520px]">
                      <img
                        src={singleHeroImage.src}
                        alt={singleHeroImage.alt}
                        className="block aspect-[2/3] w-full object-cover object-[60%_center]"
                        loading="eager"
                        decoding="async"
                      />
                    </LandingImageFrame>
                  ) : (
                    <div className="w-[320px] sm:w-[400px] md:w-[480px]">
                      <FeatureCarousel images={carouselImages} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {useAnimatedHero ? (
                <LandingImageFrame className="w-full bg-white" style={{ maxWidth: "520px" }}>
                  <CareTipHeroAnimation />
                </LandingImageFrame>
              ) : singleHeroImage ? (
                cinematic ? (
                  <div className="relative mx-auto w-full max-w-[720px] min-h-0 md:mx-auto">
                    <div className="relative flex w-full justify-center md:justify-center">
                      <div className="relative w-full max-w-[620px] max-md:mx-auto max-md:-translate-y-4 md:-translate-y-6 lg:-translate-y-8">
                        <div
                          aria-hidden
                          className="animate-float-shadow absolute -bottom-6 left-1/2 h-10 w-[72%] -translate-x-1/2 rounded-full bg-black/15 shadow-2xl"
                        />
                      <img
                        src={singleHeroImage.src}
                        alt={singleHeroImage.alt}
                        className={cn(
                          // Bigger on mobile, but slightly "zoomed out" (scale down a touch) to show more of the mockup.
                          "animate-float relative mx-auto h-auto w-[min(620px,96%)] max-w-full select-none max-md:w-full max-md:scale-[0.94] max-md:origin-center",
                          singleHeroImage.imageFit === "cover" ? "object-cover" : "object-contain",
                        )}
                        style={
                          singleHeroImage.objectPosition
                            ? { objectPosition: singleHeroImage.objectPosition }
                            : undefined
                        }
                        loading="eager"
                        decoding="async"
                        // React 18 warns on `fetchPriority`; keep the DOM attribute via lowercase.
                        {...({ fetchpriority: "high" } as unknown as React.ImgHTMLAttributes<HTMLImageElement>)}
                      />
                      </div>
                    </div>
                  </div>
                ) : (
                  <LandingImageFrame className="w-full bg-white" style={{ maxWidth: "520px" }}>
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
                <div className="w-full" style={{ maxWidth: "520px" }}>
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
