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
    <section id="how-it-works" className="scroll-mt-[80px] bg-[#FFFFFF] px-6 py-20 sm:py-28">
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
          <LandingBorderedCard beamDelay={3} cardClassName="p-8 shadow-xl sm:p-12">
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground">
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
          <div className="grid sm:grid-cols-3 gap-6 mt-12 pt-8 border-t border-border">
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
          </LandingBorderedCard>
        </motion.div>
      </div>
    </section>
  );
}
