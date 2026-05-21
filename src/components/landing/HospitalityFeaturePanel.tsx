import { useState } from "react";
import { HospitalityFeatureMarker } from "@/components/landing/HospitalityFeatureMarker";
import { caretipType } from "@/lib/typography/caretipType";
import { cn } from "@/lib/utils";

export type HospitalityFeatureItem = {
  title: string;
  text: string;
};

type HospitalityFeaturePanelProps = {
  features: HospitalityFeatureItem[];
  className?: string;
};

/**
 * Editorial feature navigation (#built-for-hospitality) — hover-only preview sync.
 * Not clickable: no buttons, pointer cursor, or focus-ring affordances.
 */
export function HospitalityFeaturePanel({ features, className }: HospitalityFeaturePanelProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <ul
      className={cn("caretip-hospitality-feature-nav flex w-full cursor-default flex-col", className)}
      role="list"
    >
      {features.map((feature, index) => {
        const isActive = index === activeIndex;
        return (
          <li
            key={`hospitality-feature-${index}`}
            role="listitem"
            onMouseEnter={() => setActiveIndex(index)}
            className={cn(
              "caretip-hospitality-feature-item group min-w-0 cursor-default",
              index > 0 && "caretip-hospitality-feature-item--divided",
              isActive && "caretip-hospitality-feature-item--active",
            )}
          >
            <div className="caretip-hospitality-feature-entry cursor-default">
              <div className="caretip-hospitality-feature-heading inline-flex max-w-full cursor-default items-start gap-2.5 sm:gap-3">
                <HospitalityFeatureMarker active={isActive} className="shrink-0 self-start" />
                <span
                  className={cn(
                    caretipType.featureCopy,
                    "min-w-0 cursor-default pt-1 transition-[color,font-weight,opacity] duration-300 ease-out",
                    isActive
                      ? "font-semibold text-neutral-900 dark:text-neutral-50"
                      : "font-medium text-neutral-700 group-hover:text-neutral-900 dark:text-neutral-300 dark:group-hover:text-neutral-100",
                  )}
                >
                  {feature.title}
                </span>
              </div>
              <p
                className={cn(
                  caretipType.bodyCopyMuted,
                  "caretip-hospitality-feature-desc mt-1.5 max-w-prose cursor-default leading-relaxed",
                )}
              >
                {feature.text}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
