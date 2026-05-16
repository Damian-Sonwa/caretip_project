import { useMemo } from "react";
import { motion } from "motion/react";
import { Quote } from "lucide-react";
import { useTranslation } from "react-i18next";
import { landingUi } from "@/components/landing/landingUi";
import { cn } from "@/lib/utils";

const cardClassName = cn(
  "flex h-full flex-col rounded-2xl border border-neutral-200/95 bg-white",
  "px-4 pb-5 pt-4 max-lg:px-4 max-lg:pb-5 max-lg:pt-4 sm:px-7 sm:pb-7 sm:pt-7",
  "shadow-[0_1px_2px_rgba(15,15,15,0.04),0_10px_28px_rgba(15,15,15,0.06)]",
  "transition-[box-shadow,border-color] duration-300",
  "hover:border-neutral-300/90 hover:shadow-[0_2px_4px_rgba(15,15,15,0.05),0_14px_36px_rgba(15,15,15,0.08)]",
  "dark:border-neutral-700/90 dark:bg-neutral-900",
  "dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_12px_32px_rgba(0,0,0,0.45)]",
  "dark:hover:border-neutral-600",
);

const chipClassName = cn(
  "inline-flex min-h-8 items-center justify-center rounded-full border border-neutral-200/95 bg-white px-3 py-1.5 max-lg:min-h-8 max-lg:px-3 max-lg:py-1.5",
  "text-xs font-semibold tracking-tight text-neutral-800",
  "shadow-[0_1px_2px_rgba(15,15,15,0.04)] ring-1 ring-neutral-900/[0.04]",
  "dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:ring-white/[0.06]",
  "sm:min-h-10 sm:px-4 sm:text-[13px]",
);

export function LandingSocialProofSection() {
  const { t } = useTranslation();

  const stats = useMemo(
    () => [t("landing.socialProof.stat1"), t("landing.socialProof.stat2"), t("landing.socialProof.stat3")],
    [t],
  );

  const quotes = useMemo(
    () =>
      [
        { quote: t("landing.socialProof.q1Quote"), name: t("landing.socialProof.q1Name"), role: t("landing.socialProof.q1Role") },
        { quote: t("landing.socialProof.q2Quote"), name: t("landing.socialProof.q2Name"), role: t("landing.socialProof.q2Role") },
        { quote: t("landing.socialProof.q3Quote"), name: t("landing.socialProof.q3Name"), role: t("landing.socialProof.q3Role") },
      ],
    [t],
  );

  return (
    <section
      id="social-proof"
      className={cn(
        landingUi.section,
        "relative overflow-hidden border-y border-neutral-200/60 dark:border-neutral-800/80",
        "bg-[linear-gradient(180deg,#faf9f7_0%,#f4f2ef_48%,#faf9f7_100%)]",
        "dark:bg-[linear-gradient(180deg,#0a0a0a_0%,#121110_50%,#0a0a0a_100%)]",
      )}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_50%_at_50%_100%,rgba(235,153,44,0.05),transparent_58%)]"
      />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={landingUi.sectionIntro}
        >
          <h2 className={landingUi.sectionTitle}>
            {t("landing.socialProof.title")}
          </h2>
          <p
            className={cn(
              landingUi.sectionSubtitle,
              "text-neutral-700 dark:text-neutral-300",
            )}
          >
            {t("landing.socialProof.subtitle")}
          </p>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-5 flex flex-wrap items-center justify-center gap-2 max-lg:mb-6 sm:mb-8 sm:gap-2.5"
          aria-label={t("landing.socialProof.chipsAria")}
        >
          {stats.map((stat) => (
            <li key={stat} className={chipClassName}>
              {stat}
            </li>
          ))}
        </motion.ul>

        <motion.div
          className="grid gap-3 max-lg:gap-3.5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {quotes.map((item, idx) => (
            <motion.figure
              key={item.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className={cardClassName}
            >
              <Quote
                className="mb-3 h-7 w-7 text-primary/55 max-lg:mb-3 max-lg:h-7 max-lg:w-7 dark:text-primary/65 sm:mb-5 sm:h-9 sm:w-9"
                strokeWidth={2}
                aria-hidden
              />
              <blockquote className="flex-1 text-pretty text-[15px] font-normal leading-[1.55] text-neutral-800 max-lg:leading-[1.55] dark:text-neutral-200 sm:text-[17px] sm:leading-[1.7]">
                <span className="text-neutral-400 dark:text-neutral-500" aria-hidden>
                  “
                </span>
                {item.quote}
                <span className="text-neutral-400 dark:text-neutral-500" aria-hidden>
                  ”
                </span>
              </blockquote>
              <figcaption className="mt-auto border-t border-neutral-200/90 pt-4 max-lg:pt-4 dark:border-neutral-700/90 sm:pt-5">
                <p className="text-[15px] font-semibold tracking-tight text-neutral-900 max-lg:text-[15px] dark:text-neutral-50 sm:text-[15px]">
                  {item.name}
                </p>
                <p className="mt-1 text-sm font-medium leading-snug text-neutral-600 dark:text-neutral-400">
                  {item.role}
                </p>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
