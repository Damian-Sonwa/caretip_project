import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { landingType } from "@/components/landing/landingTypography";
import { cn } from "@/lib/utils";

export type TestimonialIndustry = "restaurant" | "hotel" | "salon" | "healthcare" | "delivery";

export type LandingTestimonial = {
  quote: string;
  name: string;
  role: string;
  industry: TestimonialIndustry;
  rating?: number;
};

type LandingTestimonialCardProps = {
  testimonial: LandingTestimonial;
  className?: string;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className="caretip-testimonial-stars"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "caretip-testimonial-stars__icon",
            i < rating ? "caretip-testimonial-stars__icon--filled" : "caretip-testimonial-stars__icon--empty",
          )}
          strokeWidth={1.75}
          aria-hidden
        />
      ))}
    </div>
  );
}

export function LandingTestimonialCard({ testimonial, className }: LandingTestimonialCardProps) {
  const { t } = useTranslation();
  const rating = testimonial.rating ?? 5;
  const industryLabel = t(`landing.socialProof.industries.${testimonial.industry}`);

  return (
    <figure className={cn("caretip-testimonial-card", className)}>
      <div className="caretip-testimonial-card__top">
        <span className="caretip-testimonial-card__quote-mark" aria-hidden>
          &ldquo;
        </span>
        <span className="caretip-testimonial-card__industry">{industryLabel}</span>
      </div>

      <StarRating rating={rating} />

      <blockquote className="caretip-testimonial-card__quote">
        <p>{testimonial.quote}</p>
      </blockquote>

      <div className="caretip-testimonial-card__divider" aria-hidden />

      <figcaption className="caretip-testimonial-card__author">
        <p className={cn(landingType.cardTitle, "caretip-testimonial-card__name")}>{testimonial.name}</p>
        <p className="caretip-testimonial-card__role">{testimonial.role}</p>
      </figcaption>
    </figure>
  );
}
