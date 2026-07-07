import { useMemo, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

import { MOTIVATION_ACTIVITY_CARD_SPECS } from "./landingMotivationActivitySpecs";
import { MotivationActivityCardContent } from "./MotivationActivityCardContent";

export function LandingMotivationActivityStack() {
  const { t, i18n } = useTranslation();
  const reduceMotion = usePrefersReducedMotion();

  const cards = useMemo(
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
    <div className="caretip-motivation-activity w-full">
      <div className="caretip-motivation-activity__ambient" aria-hidden />
      <div className="caretip-motivation-activity__frame">
        <div className="caretip-motivation-activity__feed-header">
          <p className="caretip-motivation-activity__feed-label">{t("landing.motivation.feedLabel")}</p>
          <span className="caretip-motivation-activity__feed-sync" aria-hidden>
            <span className="caretip-motivation-activity__sync-dot" />
            {t("landing.motivation.syncLabel")}
          </span>
        </div>
        <ul className="caretip-motivation-activity__stack" role="list">
          {cards.map((card, index) => {
            const Icon = card.Icon;
            return (
              <LandingReveal
                key={card.id}
                as="li"
                role="listitem"
                delay={0.06 + index * 0.09}
                className={cn(
                  "caretip-motivation-activity__card",
                  `caretip-motivation-activity__card--${card.id}`,
                  `caretip-motivation-activity__card--${card.emphasis}`,
                  card.groupEnd && "caretip-motivation-activity__card--group-end",
                )}
                style={{ "--feed-card-index": index } as CSSProperties}
              >
                <div className={cn("caretip-motivation-activity__icon", card.accentClass)}>
                  <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                </div>
                <div className="caretip-motivation-activity__body">
                  <MotivationActivityCardContent
                    card={card}
                    badge={card.badge}
                    title={card.title}
                    meta={card.meta}
                    time={card.time}
                    animateMetrics={!reduceMotion}
                  />
                </div>
                {card.showLive ? (
                  <span className="caretip-motivation-activity__live caretip-motivation-activity__live--pulse">
                    {t("status.live")}
                  </span>
                ) : card.showSyncDot ? (
                  <span className="caretip-motivation-activity__status" aria-hidden>
                    <span className="caretip-motivation-activity__sync-dot caretip-motivation-activity__sync-dot--blue" />
                  </span>
                ) : null}
              </LandingReveal>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
