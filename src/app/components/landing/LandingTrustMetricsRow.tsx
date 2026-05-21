import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { useInViewActive } from "@/lib/motionPerf";
import {
  TRUST_METRIC_ANIM_SPECS,
  formatTrustMetricValue,
  useTrustMetricCountUp,
} from "@/components/landing/landingTrustMetricsMotion";

const STAGGER_S = 0.12;
const REVEAL_EASE = [0.22, 1, 0.36, 1] as const;

function TrustMetricValue({
  id,
  valueKey,
  end,
  decimals,
  active,
  delayMs,
}: {
  id: (typeof TRUST_METRIC_ANIM_SPECS)[number]["id"];
  valueKey: string;
  end: number;
  decimals: number;
  active: boolean;
  delayMs: number;
}) {
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const value = useTrustMetricCountUp(end, active, delayMs, reduceMotion);
  const display = reduceMotion
    ? t(valueKey)
    : formatTrustMetricValue(id, value, decimals, i18n.language);

  return (
    <p className="caretip-trust-metric-value font-sans tabular-nums" aria-live="polite">
      {display}
    </p>
  );
}

export function LandingTrustMetricsRow({ className }: { className?: string }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const { ref, active } = useInViewActive<HTMLDivElement>({
    rootMargin: "0px 0px -8% 0px",
    threshold: [0, 0.15, 0.35],
  });

  return (
    <div
      ref={ref}
      className={cn("caretip-landing-trust-metrics", className)}
      aria-label={t("landing.trustMetrics.aria")}
    >
      <ul className="caretip-trust-metrics-grid grid w-full min-w-0 grid-cols-2 gap-x-6 gap-y-9 sm:gap-x-10 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-0 lg:gap-y-0">
        {TRUST_METRIC_ANIM_SPECS.map((spec, idx) => (
          <motion.li
            key={spec.id}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={
              reduceMotion
                ? undefined
                : active
                  ? { opacity: 1 }
                  : { opacity: 0 }
            }
            transition={{
              duration: 0.55,
              ease: REVEAL_EASE,
              delay: active ? idx * STAGGER_S : 0,
            }}
            className="caretip-trust-metric-item relative flex min-w-0 flex-col items-center justify-center text-center"
          >
            <TrustMetricValue
              id={spec.id}
              valueKey={spec.valueKey}
              end={spec.end}
              decimals={spec.decimals}
              active={active}
              delayMs={idx * 120}
            />
            <p className="caretip-trust-metric-label max-w-[14ch] text-pretty font-sans">
              {t(spec.labelKey)}
            </p>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
