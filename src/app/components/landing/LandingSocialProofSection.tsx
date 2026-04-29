import { motion } from "motion/react";
import { Quote } from "lucide-react";

const quotes = [
  {
    quote: "Our floor finally has a tipping flow guests actually use. Setup took one afternoon.",
    name: "Marco R.",
    role: "Restaurant operator",
  },
  {
    quote: "Staff see their week in real time. It is the simplest motivator we have added in years.",
    name: "Elena V.",
    role: "Salon owner",
  },
  {
    quote: "I stopped chasing cash variances. Tips land where they should, with receipts we can trust.",
    name: "James T.",
    role: "Hotel F&B lead",
  },
] as const;

export function LandingSocialProofSection() {
  return (
    <section className="border-t border-gray-200 bg-gray-50 px-6 py-24 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-balance text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl md:text-5xl"
          >
            Loved by teams everywhere
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="mt-4 text-lg text-neutral-600 dark:text-neutral-400"
          >
            Hospitality leaders use CareTip to reward great service, without slowing service down.
          </motion.p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {quotes.map((item, idx) => (
            <motion.figure
              key={item.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900"
            >
              <Quote className="mb-4 h-8 w-8 text-primary/40" aria-hidden />
              <blockquote className="flex-1 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">“{item.quote}”</blockquote>
              <figcaption className="mt-6 border-t border-gray-200 pt-4 dark:border-neutral-800">
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{item.name}</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{item.role}</p>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
