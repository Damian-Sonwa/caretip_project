import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  AnimatedTestimonials,
  type Testimonial,
} from "@/components/ui/animated-testimonials";
import { landingCopyVisible } from "@/components/landing/landingUi";

const TESTIMONIAL_KEYS = [
  { quote: "q1Quote", name: "q1Name", role: "q1Role", industry: "q1Industry" },
  { quote: "q2Quote", name: "q2Name", role: "q2Role", industry: "q2Industry" },
  { quote: "q3Quote", name: "q3Name", role: "q3Role", industry: "q3Industry" },
] as const;

const VALID_INDUSTRIES = ["restaurant", "hotel", "salon", "healthcare", "delivery"] as const;

function parseIndustry(raw: string): (typeof VALID_INDUSTRIES)[number] {
  return VALID_INDUSTRIES.includes(raw as (typeof VALID_INDUSTRIES)[number])
    ? (raw as (typeof VALID_INDUSTRIES)[number])
    : "restaurant";
}

export function LandingAnimatedTestimonials() {
  const { t } = useTranslation();

  const testimonials = useMemo<Testimonial[]>(
    () =>
      TESTIMONIAL_KEYS.flatMap((keys, index) => {
        const quote = t(`landing.socialProof.${keys.quote}`);
        if (!landingCopyVisible(quote)) return [];
        const industry = parseIndustry(t(`landing.socialProof.${keys.industry}`));
        return [
          {
            id: index + 1,
            name: t(`landing.socialProof.${keys.name}`),
            role: t(`landing.socialProof.${keys.role}`),
            company: t(`landing.socialProof.industries.${industry}`),
            content: quote,
            rating: 5,
          },
        ];
      }),
    [t],
  );

  if (testimonials.length === 0) return null;

  const badgeText = landingCopyVisible(t("landing.socialProof.testimonialsEyebrow"))
    ? t("landing.socialProof.testimonialsEyebrow")
    : undefined;

  const subtitle = landingCopyVisible(t("landing.socialProof.testimonialsSubtitle"))
    ? t("landing.socialProof.testimonialsSubtitle")
    : undefined;

  return (
    <AnimatedTestimonials
      badgeText={badgeText}
      title={t("landing.socialProof.testimonialsTitle")}
      subtitle={subtitle}
      testimonials={testimonials}
      autoRotateInterval={6000}
      className="caretip-animated-testimonials--landing rounded-2xl border border-border/60 bg-transparent dark:border-neutral-800/80"
      sectionId="social-proof-testimonials"
    />
  );
}
