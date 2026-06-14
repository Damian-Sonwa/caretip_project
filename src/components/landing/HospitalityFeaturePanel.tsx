import { useState } from "react";
import {
  LandingLiveMinutesMarker,
  landingLiveMinutesRowClass,
} from "@/components/landing/LandingLiveMinutesMarker";
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
      className={cn(
        "caretip-hospitality-feature-nav caretip-landing-feature-rhythm flex w-full cursor-default flex-col gap-6 sm:gap-8",
        className,
      )}
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
              isActive && "caretip-hospitality-feature-item--active",
            )}
          >
            <div className={cn(landingLiveMinutesRowClass, "caretip-hospitality-feature-entry cursor-default")}>
              <LandingLiveMinutesMarker className="mt-0.5 shrink-0 self-start" />
              <div className="min-w-0 flex-1 space-y-1 max-md:space-y-1 sm:space-y-1.5 lg:space-y-2">
                <div
                  className={cn(
                    caretipType.featureCopySemibold,
                    "caretip-hospitality-feature-heading cursor-default tracking-tight transition-[color,opacity] duration-300 ease-out",
                    isActive
                      ? "text-neutral-900 dark:text-neutral-50"
                      : "text-neutral-800 dark:text-neutral-100",
                  )}
                >
                  {feature.title}
                </div>
                <p
                  className={cn(
                    caretipType.bodyCopyMuted,
                    "caretip-hospitality-feature-desc max-w-prose cursor-default leading-relaxed",
                  )}
                >
                  {feature.text}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
