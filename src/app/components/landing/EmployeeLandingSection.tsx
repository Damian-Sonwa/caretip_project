import { motion } from "motion/react";
import { Link } from "react-router";
import { Euro, TrendingUp, History, LayoutDashboard } from "lucide-react";
import newEmployeeImg from "../../../../images/new_one.png";

export function EmployeeLandingSection() {
  return (
    <section
      id="for-employees"
      className="scroll-mt-[80px] bg-gray-50 px-6 py-20 md:py-28 dark:bg-neutral-900"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative order-2 flex w-full min-h-0 flex-col items-center justify-center lg:order-1"
          whileHover={{ y: -5 }}
        >
          <div className="flex w-full min-h-0 items-center justify-center">
            <div className="mx-auto mt-10 w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white md:mt-0 lg:max-w-2xl dark:border-neutral-800 dark:bg-neutral-900">
              <img
                src={newEmployeeImg}
                alt="CareTip employee dashboard showing daily earnings, ratings, and goals"
                className="mx-auto h-auto w-full object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ x: 30, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="order-1 space-y-6 lg:order-2"
        >
          <div className="space-y-3">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              For employees
            </span>
            <h2 className="text-4xl font-bold text-neutral-900 sm:text-5xl dark:text-neutral-100">
              Track your success.
              <br />
              <span className="text-primary">Every day.</span>
            </h2>
            <p className="text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
              See your earnings, ratings, and performance at a glance. Stay motivated and in control of your growth.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Euro className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">Real-time earnings</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Watch tips land as your shift unfolds.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">Performance insights</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Spot patterns that help you earn more.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <History className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">Tip history & ratings</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">A clear trail of gratitude and feedback.</p>
              </div>
            </div>
          </div>

          <Link
            to="/join"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-semibold text-white shadow-[0_8px_22px_rgba(235,153,44,0.28)] transition-colors hover:bg-primary/90"
          >
            <LayoutDashboard className="h-5 w-5" />
            View employee dashboard
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
