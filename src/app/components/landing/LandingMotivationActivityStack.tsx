import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { landingSectionViewport } from "@/lib/motionPerf";
import { cn } from "@/lib/utils";
import { MOTIVATION_ACTIVITY_CARD_SPECS } from "./landingMotivationActivitySpecs";

const cardMotion = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      delay: 0.08 + i * 0.07,
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
      })),
    [t],
  );

  return (
    <div className="caretip-motivation-activity hidden md:block">
      <div className="caretip-motivation-activity__ambient" aria-hidden />
      <div className="caretip-motivation-activity__frame">
        <p className="caretip-motivation-activity__feed-label">{t("landing.motivation.feedLabel")}</p>
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
                )}
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
                  <p className="caretip-motivation-activity__badge">{card.badge}</p>
                  <p className="caretip-motivation-activity__title">{card.title}</p>
                  <p className="caretip-motivation-activity__meta">{card.meta}</p>
                </div>
                {card.id === "tip" ? (
                  <span className="caretip-motivation-activity__live">{t("landing.motivation.liveBadge")}</span>
                ) : null}
              </motion.li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
