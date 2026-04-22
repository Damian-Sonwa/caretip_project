import { motion } from "motion/react";
import { Check, Clock, Zap } from "lucide-react";
import { LandingBorderedCard } from "@/components/ui/landing-bordered-card";

export function SimpleSetupSection() {
  const steps = [
    "Sign up",
    "Add your team",
    "Generate QR codes",
    "Start taking tips"
  ];

  return (
    <section
      id="how-it-works"
      className="scroll-mt-[80px] bg-transparent px-6 py-20 sm:py-28"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-semibold mb-4">
              Quick setup
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Live in minutes
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              No integrations to babysit. Four short steps.
            </p>
          </motion.div>
        </div>

        {/* Setup Steps */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <LandingBorderedCard
            cardClassName="relative overflow-hidden p-8 sm:p-12 bg-[radial-gradient(1200px_circle_at_0%_0%,rgba(0,0,0,0.04),transparent_55%),radial-gradient(900px_circle_at_100%_0%,rgba(0,0,0,0.03),transparent_50%),linear-gradient(135deg,rgba(0,0,0,0.02)_0%,#FFFFFF_52%,#FFFFFF_100%)] shadow-[0_6px_20px_rgba(0,0,0,0.06)]"
          >
          <div
            className="rounded-2xl border border-[#F0F0F0] bg-white/70 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] backdrop-blur-md sm:p-6"
          >
            <div className="space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={step}
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground shadow-sm">
                  {index + 1}
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <p className="text-lg font-semibold leading-snug text-foreground">{step}</p>
                  <Check className="w-5 h-5 text-accent" />
                </div>
              </motion.div>
            ))}
            </div>

            {/* Bottom Stats */}
            <div className="grid sm:grid-cols-3 gap-6 mt-10 pt-6 border-t border-[#F0F0F0]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">5 min</p>
                <p className="text-sm text-muted-foreground">Setup time</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Setup fees</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Check className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">24/7</p>
                <p className="text-sm text-muted-foreground">Support</p>
              </div>
            </div>
          </div>
          </div>
          </LandingBorderedCard>
        </motion.div>
      </div>
    </section>
  );
}
