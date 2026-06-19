import { useState } from "react";
import {
  Coins,
  QrCode,
  ShieldCheck,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

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

const FEATURE_ICONS: LucideIcon[] = [Coins, QrCode, Users, ShieldCheck, TrendingUp];

/**
 * Premium feature cards with timeline (#built-for-hospitality).
 */
export function HospitalityFeaturePanel({ features, className }: HospitalityFeaturePanelProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <ul
      className={cn("caretip-hospitality-feature-nav flex w-full flex-col", className)}
      role="list"
    >
      {features.map((feature, index) => {
        const isActive = index === activeIndex;
        const isLast = index === features.length - 1;
        const Icon = FEATURE_ICONS[index] ?? Coins;

        return (
          <li
            key={`hospitality-feature-${index}`}
            role="listitem"
            onMouseEnter={() => setActiveIndex(index)}
            className={cn(
              "caretip-hospitality-feature-item group relative flex min-w-0 gap-4",
              isActive && "caretip-hospitality-feature-item--active",
            )}
          >
            <div className="caretip-hospitality-feature-timeline shrink-0" aria-hidden>
              <span
                className={cn(
                  "caretip-hospitality-feature-timeline-dot",
                  isActive && "caretip-hospitality-feature-timeline-dot--active",
                )}
              />
              {!isLast ? <span className="caretip-hospitality-feature-timeline-line" /> : null}
            </div>

            <article className="caretip-hospitality-feature-card min-w-0 flex-1">
              <div className="caretip-hospitality-feature-card__inner flex items-start gap-3.5 sm:gap-4">
                <span
                  className={cn(
                    "caretip-hospitality-feature-icon shrink-0",
                    isActive && "caretip-hospitality-feature-icon--active",
                  )}
                  aria-hidden
                >
                  <Icon className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" strokeWidth={2.15} />
                </span>
                <div className="min-w-0 flex-1 space-y-1 sm:space-y-1.5">
                  <h3
                    className={cn(
                      caretipType.featureCopySemibold,
                      "caretip-hospitality-feature-heading m-0 tracking-tight transition-[color,opacity] duration-300 ease-out",
                      isActive
                        ? "text-neutral-900 dark:text-neutral-50"
                        : "text-neutral-800 dark:text-neutral-100",
                    )}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className={cn(
                      caretipType.bodyCopyMuted,
                      "caretip-hospitality-feature-desc m-0 leading-relaxed",
                    )}
                  >
                    {feature.text}
                  </p>
                </div>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
