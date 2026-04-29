import { motion } from "motion/react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

export function LandingFinalCtaSection() {
  return (
    <section className="relative overflow-hidden bg-white px-6 py-24 md:py-28 dark:bg-neutral-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_circle_at_20%_20%,rgba(235,153,44,0.12),transparent_55%),radial-gradient(700px_circle_at_90%_60%,rgba(0,0,0,0.04),transparent_50%)]"
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-balance text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl md:text-5xl"
        >
          Start rewarding your team today
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.06 }}
          className="mt-5 text-pretty text-lg leading-relaxed text-neutral-600 dark:text-neutral-400"
        >
          Set up in minutes and give your team the recognition they deserve.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.12 }}
          className="mt-10"
        >
          <Link
            to="/onboarding"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-base font-semibold text-white shadow-[0_8px_22px_rgba(235,153,44,0.28)] transition-colors hover:bg-primary/90"
          >
            Get started
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
