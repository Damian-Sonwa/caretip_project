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
    text: "Table, location, or staff QR codes—ready to print.",
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
    text: "Top performers and live activity—at a glance.",
  },
] as const;

export function HospitalityTeamsUnifiedSection() {
  return (
    <section id="business-section" className="scroll-mt-[80px] bg-white px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 space-y-4 text-center sm:mb-14">
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <h2 className="mb-3 text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl">
              Built for hospitality teams
            </h2>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              From restaurants to salons, CareTip helps teams earn more through seamless tipping.
            </p>
          </motion.div>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-14">
          {/* Mobile: images first */}
          <div className="lg:order-2">
            <LandingBorderedCard showBeam={false} cardClassName="p-0 shadow-xl">
              <HospitalityBusinessesMarquee />
            </LandingBorderedCard>
          </div>

          {/* Feature list (no cards) */}
          <div className="lg:order-1">
            <ul className="space-y-4">
              {FEATURES.map((f, idx) => (
                <motion.li
                  key={f.title}
                  initial={{ y: 14, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: idx * 0.06 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <f.Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold tracking-tight text-foreground">{f.title}</p>
                    <p className="mt-1 text-base leading-relaxed text-muted-foreground">{f.text}</p>
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

