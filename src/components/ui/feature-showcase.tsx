import * as React from "react";
import type { LucideIcon } from "lucide-react";
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
  eyebrow = "Discover",
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

  return (
    <section
      id={id}
      className={cn(
        "w-full bg-transparent text-foreground pt-20 sm:pt-24",
        id && "scroll-mt-[80px]",
        className,
      )}
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-6 pt-16 pb-24 md:grid-cols-12 md:pt-20 md:pb-32 lg:gap-14">
        <div className="relative md:col-span-6">
          <Badge variant="outline" className="mb-6 border-primary/40 text-foreground">
            {eyebrow}
          </Badge>

          <motion.h1
            className="text-balance text-4xl font-bold leading-[0.95] sm:text-5xl md:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {title}
          </motion.h1>

          {description ? <p className="mt-6 max-w-xl text-muted-foreground">{description}</p> : null}

          {stats.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {stats.map((s, i) => (
                <Badge key={i} variant="secondary" className="bg-muted text-foreground">
                  {s}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-10 max-w-xl">
            <Accordion type="single" collapsible className="w-full">
              {steps.map((step) => (
                <AccordionItem key={step.id} value={step.id}>
                  <AccordionTrigger className="text-left text-base font-semibold">{step.title}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{step.text}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full font-bold">
                <Link to={primaryCtaTo}>{primaryCtaLabel}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-2 border-primary bg-transparent font-semibold">
                <Link to={secondaryCtaTo}>{secondaryCtaLabel}</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="relative min-h-0 md:col-span-6 flex items-center justify-center">
          {heroBorderBeam ? (
            <div className="relative inline-block">
              <div className="relative overflow-hidden rounded-2xl border border-border/90 bg-card shadow-xl">
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
                    <CareTipHeroAnimation />
                  ) : singleHeroImage ? (
                    <img
                      src={singleHeroImage.src}
                      alt={singleHeroImage.alt}
                      className="block w-[320px] rounded-xl object-cover object-[60%_center] shadow-sm ring-1 ring-black/5 sm:w-[400px] sm:rounded-2xl md:w-[480px]"
                      style={{ aspectRatio: "2 / 3" }}
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-[320px] sm:w-[400px] md:w-[480px]">
                      <FeatureCarousel images={carouselImages} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="overflow-hidden rounded-xl border border-border/80 bg-white p-0 shadow-sm sm:rounded-2xl"
              style={{ maxWidth: "480px", width: "100%" }}
            >
              {useAnimatedHero ? (
                <CareTipHeroAnimation />
              ) : singleHeroImage ? (
                <div className="w-full bg-white p-2 sm:p-3">
                  <img
                    src={singleHeroImage.src}
                    alt={singleHeroImage.alt}
                    className="block aspect-[2/3] w-full rounded-xl object-cover object-[60%_center] sm:rounded-2xl"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              ) : (
                <FeatureCarousel images={carouselImages} />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
