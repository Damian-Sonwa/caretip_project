import { motion } from "motion/react";
import { TrendingUp, Heart, Target, Zap } from "lucide-react";
import { LandingBorderedCard } from "@/components/ui/landing-bordered-card";

export function BenefitsSection() {
  const benefits = [
    {
      icon: TrendingUp,
      title: "Higher tips, less friction",
      description:
        "Card and phone tipping removes cash friction so more guests leave a tip.",
      stat: "+30%",
      color: "accent" as const,
    },
    {
      icon: Heart,
      title: "Easy for guests",
      description:
        "They tip from their own phone. No app download. No cash.",
      stat: "100%",
      color: "primary" as const,
    },
    {
      icon: Target,
      title: "Motivated teams",
      description:
        "Goals, recognition, and feedback in one flow.",
      stat: "98%",
      color: "accent" as const,
    },
  ];

  return (
    <section id="business-section" className="scroll-mt-[80px] bg-[#FFFFFF] px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 space-y-4 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-4 inline-block rounded-full bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
              Why CareTip
            </span>
            <h2 className="mb-6 text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl">
              Made for hospitality teams
            </h2>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Simple tipping for guests. Clear earnings for staff. Better control for the business.
            </p>
          </motion.div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="group relative h-full"
              >
                <LandingBorderedCard
                  beamDelay={index * 2}
                  cardClassName="min-h-[340px] p-8"
                >
                  <div className="flex h-full flex-col">
                    <div className="mb-6">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                          benefit.color === "accent" ? "bg-accent/15" : "bg-primary/15"
                        }`}
                      >
                        <Icon
                          className={`h-8 w-8 ${
                            benefit.color === "accent" ? "text-accent" : "text-primary"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold tracking-tight text-foreground">
                        {benefit.title}
                      </h3>
                      <p className="text-base leading-relaxed text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>

                    <div className="mt-auto pt-6">
                      <div className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-4 py-2.5">
                        <Zap
                          className={`h-4 w-4 shrink-0 ${
                            benefit.color === "accent" ? "text-accent" : "text-primary"
                          }`}
                        />
                        <span className="text-sm font-semibold text-foreground">{benefit.stat}</span>
                      </div>
                    </div>
                  </div>
                </LandingBorderedCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
