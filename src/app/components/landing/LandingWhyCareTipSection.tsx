import { motion } from "motion/react";
import { X, Check } from "lucide-react";

const rows = [
  { label: "Guest experience", old: "Cash-only friction", next: "Scan, tip, done" },
  { label: "Team visibility", old: "Opaque envelopes", next: "Live earnings & history" },
  { label: "Operations", old: "Manual tracking", next: "Dashboards & exports" },
  { label: "Speed to value", old: "Weeks of setup", next: "Live in minutes" },
] as const;

export function LandingWhyCareTipSection() {
  return (
    <section className="bg-gray-50 px-6 py-24 dark:bg-neutral-900">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-balance text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl md:text-5xl"
          >
            Why CareTip?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="mt-4 text-lg text-neutral-600 dark:text-neutral-400"
          >
            A modern tipping layer that feels invisible to guests and empowering to your team.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="grid grid-cols-[1fr_1fr] gap-0 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-600 sm:grid-cols-[1.2fr_1fr_1fr] sm:px-6 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
            <span className="hidden sm:block" />
            <span className="text-center sm:text-left">Traditional tipping</span>
            <span className="text-center text-primary sm:text-left">With CareTip</span>
          </div>
          {rows.map((row, idx) => (
            <div
              key={row.label}
              className={[
                "grid grid-cols-1 items-center gap-3 px-4 py-4 sm:grid-cols-[1.2fr_1fr_1fr] sm:gap-4 sm:px-6",
                idx !== rows.length - 1 ? "border-b border-gray-200 dark:border-neutral-800" : "",
              ].join(" ")}
            >
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 sm:text-base">{row.label}</p>
              <div className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-neutral-600 ring-1 ring-gray-200 dark:bg-neutral-950 dark:text-neutral-400 dark:ring-neutral-800">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                <span>{row.old}</span>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-primary/[0.06] px-3 py-2.5 text-sm font-medium text-neutral-900 ring-1 ring-primary/15 dark:text-neutral-100">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{row.next}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
