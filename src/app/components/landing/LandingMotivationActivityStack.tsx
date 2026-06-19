import { useMemo, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { landingSectionViewport } from "@/lib/motionPerf";
import { cn } from "@/lib/utils";

import { MOTIVATION_ACTIVITY_CARD_SPECS } from "./landingMotivationActivitySpecs";
import { MotivationActivityCardContent } from "./MotivationActivityCardContent";

const cardMotion = {
  hidden: { opacity: 0, x: 18, y: 6, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.48,
      delay: 0.06 + i * 0.09,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export function LandingMotivationActivityStack() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  const cards = useMemo(
    () =>
      MOTIVATION_ACTIVITY_CARD_SPECS.map((spec) => ({
        ...spec,
        badge: t(spec.badgeKey),
        title: t(spec.titleKey),
        meta: t(spec.metaKey),
        time: t(spec.timeKey),
      })),
    [t],
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
              <motion.li
                key={card.id}
                role="listitem"
                className={cn(
                  "caretip-motivation-activity__card",
                  `caretip-motivation-activity__card--${card.id}`,
                  `caretip-motivation-activity__card--${card.emphasis}`,
                  card.groupEnd && "caretip-motivation-activity__card--group-end",
                )}
                style={{ "--feed-card-index": index } as CSSProperties}
                custom={index}
                variants={reduceMotion ? undefined : cardMotion}
                initial={reduceMotion ? false : "hidden"}
                whileInView={reduceMotion ? undefined : "visible"}
                viewport={landingSectionViewport}
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
                    {t("landing.motivation.liveBadge")}
                  </span>
                ) : card.showSyncDot ? (
                  <span className="caretip-motivation-activity__status" aria-hidden>
                    <span className="caretip-motivation-activity__sync-dot caretip-motivation-activity__sync-dot--blue" />
                  </span>
                ) : null}
              </motion.li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
