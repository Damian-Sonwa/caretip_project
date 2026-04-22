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
    text: "Stripe-backed checkout with verified webhooks.",
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
      id="business-section"
      className="scroll-mt-[80px] w-full max-w-full overflow-x-hidden bg-transparent px-4 py-20 sm:px-6 sm:py-24"
    >
      <div className="mx-auto w-full max-w-7xl min-w-0">
        <div className="mb-10 w-full max-w-full space-y-4 text-center sm:mb-14">
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <h2 className="mb-3 max-w-full break-words text-balance font-bold leading-[1.05] text-foreground text-[clamp(1.75rem,6vw,3.75rem)]">
              Built for hospitality teams
            </h2>
            <p className="mx-auto max-w-3xl break-words text-pretty leading-relaxed text-muted-foreground text-[clamp(1rem,2.6vw,1.25rem)]">
              Simple tipping for guests. Clear earnings for staff. Better control for the business.
            </p>
          </motion.div>
        </div>

        <div className="grid w-full min-w-0 gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-stretch lg:gap-14">
          {/* Mobile: images first */}
          <div className="min-w-0 lg:order-2">
            <LandingBorderedCard showBeam={false} cardClassName="p-0 shadow-xl">
              <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg border border-gray-200 bg-white/85 px-3 py-2 text-sm font-semibold text-foreground backdrop-blur-sm">
                Where CareTip Works
              </div>
              <HospitalityBusinessesMarquee />
            </LandingBorderedCard>
          </div>

          {/* Feature list (no cards) */}
          <div className="min-w-0 lg:order-1">
            <ul className="w-full min-w-0 space-y-4">
              {FEATURES.map((f, idx) => (
                <motion.li
                  key={f.title}
                  initial={{ y: 14, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: idx * 0.06 }}
                  className="flex min-w-0 items-start gap-4"
                >
                  <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <f.Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="max-w-full break-words text-lg font-bold tracking-tight text-foreground">
                      {f.title}
                    </p>
                    <p className="mt-1 max-w-full break-words text-base leading-relaxed text-muted-foreground">
                      {f.text}
                    </p>
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

