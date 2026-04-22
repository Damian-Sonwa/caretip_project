import { motion } from "motion/react";
import { Target, Trophy, Star, Award } from "lucide-react";
import { LandingBorderedCard } from "@/components/ui/landing-bordered-card";
import employeeMotivation from "../../../../images/employee.png";

export function StaffMotivationSection() {
  const motivationFeatures = [
    {
      icon: Target,
      title: "Personal goals",
      description: "Monthly targets with clear progress."
    },
    {
      icon: Trophy,
      title: "Recognition",
      description: "Highlight top earners and healthy competition."
    },
    {
      icon: Star,
      title: "Guest ratings",
      description: "Feedback right after the tip."
    },
    {
      icon: Award,
      title: "Performance insights",
      description: "See peaks, trends, and what drives tips."
    }
  ];

  return (
    <section
      id="staff-motivation"
      className="scroll-mt-[80px] bg-transparent px-6 py-20 sm:py-28"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Visual */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative order-2 lg:order-1"
          >
            {/* Landscape only: height comes from width x aspect; no min-h so the box never goes portrait in a narrow column */}
            <div className="relative overflow-hidden rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA] shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
              <LandingBorderedCard cardClassName="min-w-0 max-w-full overflow-hidden rounded-xl border-0 p-3 shadow-none">
                {/* Same inset as One scan / Instant tip: p-3 on card, image flush to inner rounded frame */}
                <div className="relative aspect-[5/4] w-full overflow-hidden rounded-xl border border-[#F0F0F0] bg-[#FAFAFA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] sm:aspect-[4/3]">
                  <img
                    src={employeeMotivation}
                    alt="Team member, motivated staff with CareTip"
                    className="absolute inset-0 h-full w-full object-cover object-center"
                    loading="lazy"
                    decoding="async"
                  />
                  <motion.div
                    initial={{ y: 12, opacity: 0, scale: 0.96 }}
                    whileInView={{ y: 0, opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: 0.35 }}
                    className="pointer-events-none absolute bottom-3 right-3 z-10 max-w-[calc(100%-1.5rem)] rounded-xl border border-accent/30 bg-white/95 p-3 shadow-lg backdrop-blur-sm sm:bottom-4 sm:right-4 sm:p-4"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary sm:h-10 sm:w-10">
                        <Trophy className="h-4 w-4 text-primary-foreground sm:h-5 sm:w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground sm:text-xs">Top Performer</p>
                        <p className="text-xs font-bold text-foreground sm:text-sm">This Week</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </LandingBorderedCard>
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-8 order-1 lg:order-2"
          >
            <div className="space-y-4">
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                Staff performance
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">
                Motivate your team
                <br />
                <span className="text-primary">to excel</span>
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Track staff performance in real time. Set goals and see who’s leading the shift.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {motivationFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
