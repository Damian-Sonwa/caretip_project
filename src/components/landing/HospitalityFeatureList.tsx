import { LandingBenefitCheckMark, landingBenefitRowClass } from "@/components/landing/LandingCheckBadge";
import { caretipType } from "@/lib/typography/caretipType";
import { cn } from "@/lib/utils";

export type HospitalityFeatureItem = {
  title: string;
  text: string;
};

type HospitalityFeatureListProps = {
  features: HospitalityFeatureItem[];
  className?: string;
};

/** Flat editorial feature list for #built-for-hospitality — no cards or panels. */
export function HospitalityFeatureList({ features, className }: HospitalityFeatureListProps) {
  if (features.length === 0) return null;

  return (
    <ul className={cn("caretip-hospitality-feature-list", className)} role="list">
      {features.map((feature, index) => (
        <li
          key={`hospitality-feature-${index}`}
          className={cn("caretip-hospitality-feature-list__item", landingBenefitRowClass)}
          role="listitem"
        >
          <LandingBenefitCheckMark />
          <div className="caretip-hospitality-feature-list__body min-w-0">
            <h3
              className={cn(
                caretipType.featureCopySemibold,
                "caretip-hospitality-feature-list__title m-0 tracking-tight text-foreground",
              )}
            >
              {feature.title}
            </h3>
            <p
              className={cn(
                caretipType.bodyCopyMuted,
                "caretip-hospitality-feature-list__desc m-0 leading-relaxed",
              )}
            >
              {feature.text}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
