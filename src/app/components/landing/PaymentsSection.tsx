import { motion } from "motion/react";
import { CreditCard, Smartphone, Clock, ListChecks } from "lucide-react";

const bullets = [
  {
    icon: CreditCard,
    title: "Card, Apple Pay, Google Pay",
    text: "Familiar checkout your guests already trust.",
  },
  {
    icon: Clock,
    title: "Instant or scheduled payouts",
    text: "Pay your team on the rhythm that fits your operation.",
  },
  {
    icon: ListChecks,
    title: "Transparent transaction tracking",
    text: "Every tip accounted for, with no guesswork at closeout.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first by design",
    text: "Optimized flows that feel fast on any phone.",
  },
] as const;

export function PaymentsSection() {
  return (
    <section className="border-y border-gray-200 bg-gray-50 px-6 py-24 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
          >
            Payments
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-balance text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl md:text-5xl"
          >
            Built on trusted payment infrastructure
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="mt-4 text-pretty text-lg leading-relaxed text-neutral-600 dark:text-neutral-400"
          >
            Secure, fast, and reliable payments powered by global providers.
          </motion.p>
        </div>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {bullets.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.li
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.06 }}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{item.text}</p>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
