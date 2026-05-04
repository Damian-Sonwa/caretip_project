import { motion } from "motion/react";
import { Link } from "react-router";
import { BarChart3, Users, PieChart, FileDown, ArrowRight } from "lucide-react";
import businessSectionImg from "../../../../images/business_section.jpeg";

export function BusinessLandingSection() {
  return (
    <section
      id="business-section"
      className="scroll-mt-[80px] bg-white px-2 py-20 max-md:overflow-x-hidden md:px-6 md:py-28 dark:bg-neutral-950"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 max-md:gap-y-10 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="order-2 space-y-6 max-md:px-2 max-md:pt-2 md:order-1 md:px-0 md:pt-0"
        >
          <div className="space-y-4">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              Business dashboard
            </span>
            <h2 className="text-4xl font-bold text-neutral-900 sm:text-5xl dark:text-neutral-100">
              Complete visibility
              <br />
              <span className="text-primary">into your team</span>
            </h2>
            <p className="text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
              Monitor performance, track tips, and manage your entire operation from one clean dashboard.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">Team performance tracking</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">See momentum across shifts, roles, and locations.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <PieChart className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">Tip distribution insights</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Understand where tips land, and why it matters.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <FileDown className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">Exportable reports</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Clean exports for finance, payroll, and audits.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">Staff management</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Roles, access, and QR assignments without spreadsheets.</p>
              </div>
            </div>
          </div>

          <Link
            to="/auth?mode=signup&role=business&from=landing"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-semibold text-white shadow-[0_8px_22px_rgba(235,153,44,0.28)] transition-colors hover:bg-primary/90"
          >
            <ArrowRight className="h-5 w-5" />
            Get started
          </Link>
        </motion.div>

        <motion.div
          initial={{ x: 30, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative order-1 flex w-full min-h-0 flex-col items-center justify-center max-md:-mx-2 max-md:w-[calc(100%+1rem)] md:order-2 md:mx-0 md:w-full"
          whileHover={{ y: -5 }}
        >
          <div className="flex w-full min-h-0 items-center justify-center">
            <img
              src={businessSectionImg}
              alt="CareTip business dashboard on a laptop showing team visibility and analytics"
              className="mx-auto h-auto w-full max-w-none object-contain max-md:mt-4 max-md:min-h-[min(42dvh,380px)] max-md:max-w-none md:mt-0 md:max-w-md lg:max-w-2xl"
              loading="lazy"
              decoding="async"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
