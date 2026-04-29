import { motion } from "motion/react";
import { QrCode, LayoutDashboard, BarChart3, History, Wallet, Star } from "lucide-react";

const items = [
  { icon: QrCode, title: "QR tipping pages", text: "Branded pages guests open in one scan." },
  { icon: LayoutDashboard, title: "Employee dashboards", text: "Earnings and momentum in one place." },
  { icon: BarChart3, title: "Business analytics", text: "See what is working across shifts and venues." },
  { icon: History, title: "Tip history", text: "A clear record for staff and finance." },
  { icon: Wallet, title: "Payout system", text: "Route and release tips with confidence." },
  { icon: Star, title: "Feedback & ratings", text: "Capture praise while the moment is fresh." },
] as const;

export function LandingFeaturesSection() {
  return (
    <section id="features" className="scroll-mt-[80px] bg-gray-50 px-6 py-24 dark:bg-neutral-900">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-balance text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl md:text-5xl"
          >
            Everything you need to grow
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="mt-4 text-pretty text-lg text-neutral-600 dark:text-neutral-400"
          >
            One platform for tipping, visibility, and payouts, without the overhead.
          </motion.p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.05 }}
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_14px_40px_rgba(0,0,0,0.06)] dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{item.text}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
