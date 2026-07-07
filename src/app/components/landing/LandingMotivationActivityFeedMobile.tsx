import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

import { MOTIVATION_ACTIVITY_CARD_SPECS } from "./landingMotivationActivitySpecs";
import {
  MotivationActivityCardMeta,
  MotivationActivityCardTitle,
} from "./MotivationActivityCardContent";

export function LandingMotivationActivityFeedMobile() {
  const { t, i18n } = useTranslation();
  const reduceMotion = usePrefersReducedMotion();

  const rows = useMemo(
    () =>
      MOTIVATION_ACTIVITY_CARD_SPECS.map((spec) => ({
        ...spec,
        badge: t(spec.badgeKey),
        title: t(spec.titleKey),
        meta: t(spec.metaKey),
        time: t(spec.timeKey),
      })),
    [t, i18n.language],
  );

  return (
    <div className="caretip-motivation-activity-feed-mobile">
      <div className="caretip-motivation-activity-feed-mobile__frame">
        <div className="caretip-motivation-activity-feed-mobile__header">
          <p className="caretip-motivation-activity-feed-mobile__title">
            {t("landing.motivation.compactFeedTitle")}
          </p>
          <span className="caretip-motivation-activity__live caretip-motivation-activity__live--pulse">
            {t("status.live")}
          </span>
        </div>

        <ul className="caretip-motivation-activity-feed-mobile__list" role="list">
          {rows.map((row, index) => (
            <LandingReveal
              key={row.id}
              as="li"
              role="listitem"
              delay={index * 0.07}
              className={cn(
                "caretip-motivation-activity-feed-mobile__row",
                `caretip-motivation-activity-feed-mobile__row--${row.id}`,
                row.emphasis === "primary" && "caretip-motivation-activity-feed-mobile__row--primary",
                row.groupEnd && "caretip-motivation-activity-feed-mobile__row--group-end",
              )}
            >
              <span
                className={cn(
                  "caretip-motivation-activity-feed-mobile__dot",
                  row.accentClass,
                )}
                aria-hidden
              />
              <div className="caretip-motivation-activity-feed-mobile__copy">
                <div className="caretip-motivation-activity-feed-mobile__line">
                  <p className="caretip-motivation-activity-feed-mobile__badge">{row.badge}</p>
                  <time className="caretip-motivation-activity-feed-mobile__time">{row.time}</time>
                </div>
                <p className="caretip-motivation-activity-feed-mobile__primary">
                  <MotivationActivityCardTitle
                    card={row}
                    title={row.title}
                    animateMetrics={!reduceMotion}
                  />
                </p>
                <p className="caretip-motivation-activity-feed-mobile__secondary">
                  <MotivationActivityCardMeta
                    card={row}
                    meta={row.meta}
                    animateMetrics={!reduceMotion}
                  />
                </p>
              </div>
            </LandingReveal>
          ))}
        </ul>
      </div>
    </div>
  );
}
