import { useMemo } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
import { LandingSectionAccent } from "@/components/landing/LandingSectionAccent";
import { landingFadeReveal } from "@/lib/motionPerf";
import { cn } from "@/lib/utils";
import {
  LandingTestimonialCard,
  type LandingTestimonial,
  type TestimonialIndustry,
} from "./LandingTestimonialCard";

const TESTIMONIAL_KEYS = [
  { quote: "q1Quote", name: "q1Name", role: "q1Role", industry: "q1Industry" },
  { quote: "q2Quote", name: "q2Name", role: "q2Role", industry: "q2Industry" },
  { quote: "q3Quote", name: "q3Name", role: "q3Role", industry: "q3Industry" },
] as const;

const VALID_INDUSTRIES: TestimonialIndustry[] = [
  "restaurant",
  "hotel",
  "salon",
  "healthcare",
  "delivery",
];

function parseIndustry(raw: string): TestimonialIndustry {
  return VALID_INDUSTRIES.includes(raw as TestimonialIndustry)
    ? (raw as TestimonialIndustry)
    : "restaurant";
}

export function LandingTestimonialsShowcase() {
  const { t } = useTranslation();

  const testimonials = useMemo<LandingTestimonial[]>(
    () =>
      TESTIMONIAL_KEYS.map((keys) => ({
        quote: t(`landing.socialProof.${keys.quote}`),
        name: t(`landing.socialProof.${keys.name}`),
        role: t(`landing.socialProof.${keys.role}`),
        industry: parseIndustry(t(`landing.socialProof.${keys.industry}`)),
        rating: 5,
      })).filter((item) => landingCopyVisible(item.quote)),
    [t],
  );

  if (testimonials.length === 0) return null;

  return (
    <div className="caretip-testimonials-showcase">
      <motion.header
        className={cn(landingUi.sectionIntro, "caretip-testimonials-showcase__header")}
        {...landingFadeReveal}
      >
        {landingCopyVisible(t("landing.socialProof.testimonialsEyebrow")) ? (
          <LandingSectionAccent variant="trend" className="max-lg:mx-auto">
            {t("landing.socialProof.testimonialsEyebrow")}
          </LandingSectionAccent>
        ) : null}
        <h2 className={cn(landingUi.sectionTitle, "caretip-testimonials-showcase__title")}>
          {t("landing.socialProof.testimonialsTitle")}
        </h2>
      </motion.header>

      <div className="caretip-testimonials-showcase__grid" role="list">
        {testimonials.map((item, idx) => (
          <motion.div
            key={item.name}
            role="listitem"
            className="caretip-testimonials-showcase__item h-full min-h-0"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-6% 0px" }}
            transition={{ duration: 0.45, delay: idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
          >
            <LandingTestimonialCard testimonial={item} className="h-full" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
