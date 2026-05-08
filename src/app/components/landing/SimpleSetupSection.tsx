import { motion } from "motion/react";
import { Bolt, QrCode, Sparkles, UserPlus, Users } from "lucide-react";
import { LiveInMinutesLaptopDemo } from "./LiveInMinutesLaptopDemo";

export function SimpleSetupSection() {
  const steps = [
    {
      title: "Create your account",
      description: "Set up your workspace in a minute.",
      icon: UserPlus,
    },
    {
      title: "Add your team",
      description: "Invite staff and assign roles in one flow.",
      icon: Users,
    },
    {
      title: "Generate QR codes",
      description: "Download, print, and place where guests look.",
      icon: QrCode,
    },
    {
      title: "Start receiving tips",
      description: "Guests scan and tip, and your dashboard updates instantly.",
      icon: Bolt,
    },
  ] as const;

  return (
    <section
      id="how-it-works"
      className="scroll-mt-[80px] bg-white px-2 py-16 max-md:overflow-x-hidden sm:px-6 sm:py-20 lg:py-24 dark:bg-neutral-950"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid items-start gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-12">
          {/* LEFT: Journey step cards */}
          <div className="order-2 max-md:px-1 space-y-8 max-md:pt-2 lg:order-1 lg:px-0 lg:pt-0 md:px-0 md:pt-0">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Live in minutes
                </span>
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  No integrations. No complexity.
                </span>
              </div>

              <h2 className="text-balance text-3xl font-bold leading-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl md:text-5xl">
                A quick journey from setup to tips
              </h2>
              <p className="max-w-xl text-pretty text-base leading-relaxed text-neutral-600 dark:text-neutral-400 md:text-lg">
                Four moments that get you from “not set up” to “tips rolling in”, fast.
              </p>
            </motion.div>

            <div className="relative">
              {/* Timeline line */}
              <div
                aria-hidden
                className="absolute left-[18px] top-2 hidden h-[calc(100%-8px)] w-px bg-primary/20 sm:block"
              />

              <div className="space-y-3">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: idx * 0.06 }}
                      className="group relative rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/70 transition-shadow hover:shadow-md dark:bg-neutral-950 dark:ring-neutral-800"
                    >
                      {/* Orange indicator */}
                      <div className="hidden sm:block">
                        <span
                          aria-hidden
                          className="absolute left-[10px] top-6 h-4 w-4 rounded-full bg-white ring-2 ring-primary/35 dark:bg-neutral-950"
                        />
                        <span
                          aria-hidden
                          className="absolute left-[14px] top-[28px] h-2 w-2 rounded-full bg-primary"
                        />
                      </div>

                      <div className="flex items-start gap-4 sm:pl-8">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                            {step.title}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Laptop mockup */}
          <motion.div
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative order-1 mx-auto w-full max-w-2xl max-md:max-w-none max-md:-mx-1 max-md:w-[calc(100%+0.5rem)] lg:order-2 lg:mx-auto lg:w-full"
            whileHover={{ y: -4 }}
          >
            <div className="relative w-full overflow-visible px-0 pb-2 sm:px-0">
              <LiveInMinutesLaptopDemo videoSrc={import.meta.env.VITE_LIVE_IN_MINUTES_DEMO_VIDEO} />

              <div className="pointer-events-none absolute -right-1 top-2 z-10 hidden sm:block lg:right-0">
                <div className="rounded-2xl border border-gray-200 bg-white/95 px-3 py-2 text-left shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/95">
                  <p className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400">Setup status</p>
                  <p className="mt-0.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">Ready to collect tips</p>
                </div>
              </div>
              <div className="pointer-events-none absolute bottom-10 left-0 z-10 hidden sm:block">
                <div className="rounded-2xl border border-gray-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/95">
                  <p className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400">Typical time</p>
                  <p className="mt-0.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">Under 5 minutes</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
