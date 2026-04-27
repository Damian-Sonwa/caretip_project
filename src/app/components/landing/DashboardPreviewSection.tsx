import { motion } from "motion/react";
import { Link } from "react-router";
import { BarChart3, Users, Euro, TrendingUp, Eye } from "lucide-react";
import businessSectionImg from "../../../../images/business_section.jpeg";
import forEmployeeImg from "../../../../images/for_employee.png";

export function DashboardPreviewSection() {
  return (
    <section className="bg-white px-6 py-20 md:py-28">
      <div className="max-w-7xl mx-auto space-y-24">
        {/* Business Dashboard Preview */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Content */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                For Businesses
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-black">
                Complete visibility
                <br />
                <span className="text-primary">into your team</span>
              </h2>
              <p className="text-lg leading-relaxed text-black/70">
                One dashboard for tips, staff, and locations.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-black mb-1">Live analytics</h3>
                  <p className="text-sm text-black/70">Tip trends and peak hours at a glance.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-black mb-1">Team management</h3>
                  <p className="text-sm text-black/70">Staff, QR codes, and venues in one flow.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Euro className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-black mb-1">Payout reports</h3>
                  <p className="text-sm text-black/70">Exports for accounting and payroll.</p>
                </div>
              </div>
            </div>

            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-semibold text-white shadow-[0_8px_22px_rgba(235,153,44,0.28)] transition-colors hover:bg-[#D8841F]"
            >
              <Eye className="w-5 h-5" />
              View Business Dashboard
            </Link>
          </motion.div>

          {/* Visual — business dashboard (laptop) */}
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative flex w-full min-h-0 flex-col items-center justify-center"
            whileHover={{ y: -5 }}
          >
            <div className="flex w-full min-h-0 items-center justify-center">
              <img
                src={businessSectionImg}
                alt="CareTip business dashboard on a laptop showing team visibility and analytics"
                className="mx-auto mt-10 h-auto w-full max-w-md object-contain md:mt-0 lg:max-w-2xl"
                loading="lazy"
                decoding="async"
              />
            </div>
          </motion.div>
        </div>

        {/* Employee Dashboard Preview */}
        <section id="for-employees" className="scroll-mt-20 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Visual — employee dashboard */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative order-2 flex w-full min-h-0 flex-col items-center justify-center lg:order-1"
            whileHover={{ y: -5 }}
          >
            <div className="flex w-full min-h-0 items-center justify-center">
              <img
                src={forEmployeeImg}
                alt="CareTip employee dashboard showing daily earnings, ratings, and goals"
                className="mx-auto mt-10 h-auto w-full max-w-md object-contain md:mt-0 lg:max-w-2xl"
                loading="lazy"
                decoding="async"
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="order-1 space-y-6 lg:order-2"
          >
            <div className="space-y-3">
              <span className="inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                For Employees
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-black">
                Track your success
                <br />
                <span className="text-primary">every day</span>
              </h2>
              <p className="text-lg leading-relaxed text-black/70">
                Earnings, ratings, and goals in one view.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Euro className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-black mb-1">Live earnings</h3>
                  <p className="text-sm text-black/70">Tips as they land: daily, weekly, or monthly.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-black mb-1">Performance insights</h3>
                  <p className="text-sm text-black/70">See what drives higher tips.</p>
                </div>
              </div>
            </div>

            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-semibold shadow-[0_8px_22px_rgba(235,153,44,0.28)] transition-colors hover:bg-[#D8841F]"
            >
              <Eye className="w-5 h-5" />
              View Employee Dashboard
            </Link>
          </motion.div>
        </section>
      </div>
    </section>
  );
}
