import { motion } from "motion/react";
import { Coins, QrCode, Users, ShieldCheck, Sparkles } from "lucide-react";

import HospitalityBusinessesMarquee from "@/components/ui/team";

const FEATURES = [
  {
    Icon: Coins,
    title: "Earn more tips",
    text: "Fast, mobile-friendly tipping guests actually use.",
  },
  {
    Icon: QrCode,
    title: "Seamless QR payments",
    text: "Table, location, or staff QR codes (ready to print).",
  },
  {
    Icon: Users,
    title: "Easy staff management",
    text: "Activate staff, assign areas, and track performance.",
  },
  {
    Icon: ShieldCheck,
    title: "Secure payments",
    text: "Industry-grade checkout with encryption end to end.",
  },
  {
    Icon: Sparkles,
    title: "Clear performance",
    text: "Top performers and live activity (at a glance).",
  },
] as const;

export function HospitalityTeamsUnifiedSection() {
  return (
    <section
      id="built-for-hospitality"
      className="scroll-mt-[80px] w-full max-w-full overflow-x-hidden bg-gray-50 pb-20 pt-0 dark:bg-neutral-900 sm:pb-24"
    >
      {/* Full-bleed moving images (marquee) */}
      <div className="relative w-full border-b border-black/[0.06] bg-white dark:border-white/10 dark:bg-neutral-950">
        <div className="pointer-events-none absolute left-4 top-4 z-20 sm:left-6 sm:top-5">
          <span className="inline-flex rounded-full border border-gray-200 bg-white/95 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-neutral-950/90 dark:text-neutral-100">
            Where CareTip Works
          </span>
        </div>
        <HospitalityBusinessesMarquee fullBleed />
      </div>

      {/* Headline + copy + features below the marquee */}
      <div className="caretip-container min-w-0 pt-12 sm:pt-14 lg:pt-16">
        <div className="mb-10 w-full max-w-full space-y-4 text-center sm:mb-12">
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <h2 className="mb-3 max-w-full break-words text-balance font-bold leading-[1.05] text-gray-900 text-[clamp(1.75rem,6vw,3.75rem)] dark:text-neutral-100">
              Built for hospitality teams
            </h2>
            <p className="mx-auto max-w-3xl break-words text-pretty leading-relaxed text-gray-500 text-[clamp(1rem,2.6vw,1.25rem)] dark:text-neutral-400">
              From restaurants to salons, CareTip helps your team earn more while giving you full visibility into
              performance.
            </p>
          </motion.div>
        </div>

        <ul className="mx-auto grid w-full min-w-0 max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          {FEATURES.map((f, idx) => (
            <motion.li
              key={f.title}
              initial={{ y: 14, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.06 }}
              className="w-full rounded-3xl border border-black/[0.06] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-950/40"
            >
              <div className="flex w-full min-w-0 items-start gap-4">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary/10 text-primary">
                  <f.Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="max-w-full break-words text-lg font-bold tracking-tight text-gray-900 dark:text-neutral-100">
                    {f.title}
                  </p>
                  <p className="mt-1 max-w-full break-words text-base leading-relaxed text-gray-500 dark:text-neutral-300">
                    {f.text}
                  </p>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

