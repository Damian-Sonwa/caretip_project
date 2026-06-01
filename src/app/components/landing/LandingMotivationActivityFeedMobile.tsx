import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { landingSectionViewport } from "@/lib/motionPerf";
import { cn } from "@/lib/utils";
import { MOTIVATION_ACTIVITY_CARD_SPECS } from "./landingMotivationActivitySpecs";

export function LandingMotivationActivityFeedMobile() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  const rows = useMemo(
    () =>
      MOTIVATION_ACTIVITY_CARD_SPECS.map((spec) => {
        const badge = t(spec.badgeKey);
        const title = t(spec.titleKey);
        const meta = t(spec.metaKey);
        return {
          id: spec.id,
          accentClass: spec.accentClass,
          primary: spec.mobilePrimary === "title" ? title : badge,
          secondary: spec.mobileSecondary === "meta" ? meta : title,
          showLive: spec.id === "tip",
        };
      }),
    [t],
  );

  return (
    <div className="caretip-motivation-activity-feed-mobile">
      <div className="caretip-motivation-activity-feed-mobile__frame">
        <div className="caretip-motivation-activity-feed-mobile__header">
          <p className="caretip-motivation-activity-feed-mobile__title">
            {t("landing.motivation.compactFeedTitle")}
          </p>
          {rows[0]?.showLive ? (
            <span className="caretip-motivation-activity__live">
              {t("landing.motivation.liveBadge")}
            </span>
          ) : null}
        </div>

        <ul className="caretip-motivation-activity-feed-mobile__list" role="list">
          {rows.map((row, index) => (
            <motion.li
              key={row.id}
              role="listitem"
              className={cn(
                "caretip-motivation-activity-feed-mobile__row",
                `caretip-motivation-activity-feed-mobile__row--${row.id}`,
              )}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={landingSectionViewport}
              transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <span
                className={cn(
                  "caretip-motivation-activity-feed-mobile__dot",
                  row.accentClass,
                )}
                aria-hidden
              />
              <div className="caretip-motivation-activity-feed-mobile__copy">
                <p className="caretip-motivation-activity-feed-mobile__primary">{row.primary}</p>
                <p className="caretip-motivation-activity-feed-mobile__secondary">{row.secondary}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
