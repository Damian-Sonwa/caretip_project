import { motion } from "motion/react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export function LandingFinalCtaSection() {
  const { t } = useTranslation();
  return (
    <section className="relative w-full min-w-0 overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#fcfbf9_50%,#fffefb_100%)] px-4 py-12 sm:px-6 sm:py-20 md:py-24 lg:py-28 dark:bg-neutral-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_130%_75%_at_50%_0%,rgba(235,153,44,0.09),transparent_58%),radial-gradient(ellipse_120%_60%_at_20%_80%,rgba(0,0,0,0.028),transparent_55%),radial-gradient(ellipse_120%_60%_at_85%_70%,rgba(0,0,0,0.022),transparent_55%)]"
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-balance text-[clamp(1.5rem,5vw,2.25rem)] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl md:text-5xl"
        >
          {t("landing.finalCta.title")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.06 }}
          className="mt-5 text-pretty text-lg leading-[1.65] text-neutral-700 dark:text-neutral-300 sm:mt-6 sm:text-xl"
        >
          {t("landing.finalCta.subtitle")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.12 }}
          className="mt-6 sm:mt-10"
        >
          <Link
            to="/auth?mode=signup&role=business&from=landing"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-base font-semibold text-white shadow-[0_12px_38px_-10px_rgba(235,153,44,0.42)] transition-[colors,opacity,box-shadow,transform] hover:bg-primary/92 hover:shadow-[0_14px_44px_-8px_rgba(235,153,44,0.48)] active:scale-[0.99]"
          >
            {t("landing.finalCta.cta")}
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
