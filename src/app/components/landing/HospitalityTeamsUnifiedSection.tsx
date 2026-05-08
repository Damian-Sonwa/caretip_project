import { motion } from "motion/react";
import { Coins, QrCode, Users, ShieldCheck, Sparkles } from "lucide-react";

import { LandingBorderedCard } from "@/components/ui/landing-bordered-card";
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
      className="scroll-mt-[80px] w-full max-w-full overflow-x-hidden bg-gray-50 px-6 pb-24 pt-14 sm:pt-16 lg:pt-20 dark:bg-neutral-900"
    >
      <div className="mx-auto w-full max-w-7xl min-w-0">
        <div className="mb-10 w-full max-w-full space-y-4 text-center sm:mb-14">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="mb-3 max-w-full break-words text-balance font-bold leading-[1.05] text-gray-900 text-[clamp(1.75rem,6vw,3.75rem)]">
              Built for hospitality teams
            </h2>
            <p className="mx-auto max-w-3xl break-words text-pretty leading-relaxed text-gray-500 text-[clamp(1rem,2.6vw,1.25rem)]">
              From restaurants to salons, CareTip helps your team earn more while giving you full visibility into
              performance.
            </p>
          </motion.div>
        </div>

        <div className="grid w-full min-w-0 gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-stretch lg:gap-14">
          {/* Mobile: images first */}
          <div className="min-w-0 lg:order-2">
            <LandingBorderedCard cardClassName="p-0">
              <motion.div
                initial={{ y: 6, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
                className="pointer-events-none absolute left-4 top-4 z-10 inline-flex items-center gap-2 text-sm font-semibold text-gray-900"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <QrCode className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span>Where CareTip Works</span>
              </motion.div>
              <HospitalityBusinessesMarquee />
            </LandingBorderedCard>
          </div>

          {/* Feature list */}
          <div className="min-w-0 lg:order-1">
            <ul className="w-full min-w-0 space-y-4">
              {FEATURES.map((f, idx) => (
                <motion.li
                  key={f.title}
                  initial={{ y: 10, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: idx * 0.08 }}
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
        </div>
      </div>
    </section>
  );
}

