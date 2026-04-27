import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useMemo, useState } from "react";
import { CheckCircle2, QrCode, Sparkles, UserPlus, Users } from "lucide-react";

export function SimpleSetupSection() {
  const headingId = useId();
  const [activeStep, setActiveStep] = useState(0);

  const steps = useMemo(
    () =>
      [
        { title: "Sign up", icon: UserPlus },
        { title: "Add your team", icon: Users },
        { title: "Generate QR codes", icon: QrCode },
        { title: "Start taking tips", icon: CheckCircle2 },
      ] as const,
    [],
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveStep((s) => (s + 1) % steps.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [steps.length]);

  const progressPct = steps.length <= 1 ? 0 : (activeStep / (steps.length - 1)) * 100;

  return (
    <section
      id="how-it-works"
      className="scroll-mt-[80px] bg-white px-6 py-24"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ y: 18, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid items-start gap-8 md:grid-cols-[1fr_2fr] md:gap-10"
        >
          {/* LEFT: Navigation stepper */}
          <div className="space-y-6 text-center md:text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/[0.12] bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                Four short steps
              </span>
              <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-500 shadow-sm ring-1 ring-primary/12">
                Live in minutes
              </span>
            </div>

            <div className="space-y-2">
              <h2 id={headingId} className="text-3xl md:text-5xl font-bold leading-tight text-black">
                Live in minutes
              </h2>
              <p className="max-w-md md:max-w-lg mx-auto md:mx-0 text-base md:text-lg leading-relaxed text-gray-500">
                Set up your team and start collecting tips in a few clicks.
              </p>
            </div>

            {/* Desktop stepper */}
            <div className="relative hidden md:block">
              {/* Progress line (base) */}
              <div aria-hidden className="absolute left-[18px] top-5 h-[calc(100%-40px)] w-px bg-primary/12" />
              {/* Progress line (active fill) */}
              <motion.div
                aria-hidden
                className="absolute left-[18px] top-5 w-px bg-primary"
                initial={false}
                animate={{ height: `${progressPct}%` }}
                transition={{ duration: 0.55, ease: "easeInOut" }}
                style={{ transformOrigin: "top" }}
              />

              <div className="space-y-3">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === activeStep;
                  return (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => setActiveStep(index)}
                      onMouseEnter={() => setActiveStep(index)}
                      onFocus={() => setActiveStep(index)}
                      className={[
                        "group relative flex w-full items-start gap-4 rounded-xl border border-transparent p-4 text-left transition-all",
                        isActive ? "bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]" : "hover:bg-white/70 hover:shadow-sm",
                      ].join(" ")}
                    >
                      {/* Accent line */}
                      <span
                        aria-hidden
                        className={[
                          "absolute left-0 top-3 bottom-3 w-1 rounded-full transition-opacity",
                          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40",
                        ].join(" ")}
                        style={{ background: "#EB992C" }}
                      />

                      <span className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-primary/12">
                        <span className="text-sm font-bold text-foreground">{index + 1}</span>
                      </span>

                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <Icon className={isActive ? "h-4 w-4 text-primary" : "h-4 w-4 text-primary/45"} />
                          <span className={isActive ? "text-base font-bold text-foreground" : "text-base font-semibold text-foreground"}>
                            {step.title}
                          </span>
                        </span>
                        <span className="mt-1 block text-sm text-gray-500">
                          Step {index + 1} of {steps.length}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile: dots indicator */}
            <div className="md:hidden">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-primary/12">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-500">Step {activeStep + 1} of {steps.length}</p>
                  <p className="truncate text-base font-semibold text-foreground">{steps[activeStep]?.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveStep(i)}
                      aria-label={`Go to step ${i + 1}`}
                      className={[
                        "h-2.5 w-2.5 rounded-full transition-all",
                        i === activeStep ? "bg-primary" : "bg-primary/18 hover:bg-primary/28",
                      ].join(" ")}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Dynamic preview main stage */}
          <motion.div className="md:sticky md:top-24" whileHover={{ y: -5 }}>
            <div className="relative overflow-hidden rounded-3xl border border-primary/[0.12] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              {/* Browser-like top bar */}
              <div className="flex items-center gap-2 border-b border-primary/[0.12] bg-white px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-primary/12" />
                <span className="h-2.5 w-2.5 rounded-full bg-primary/12" />
                <span className="h-2.5 w-2.5 rounded-full bg-primary/12" />
                <span className="ml-3 text-xs font-semibold text-gray-500">CareTip</span>
              </div>

              <div className="relative p-5 sm:p-7">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -18 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                  >
                    {activeStep === 0 ? (
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-primary">Welcome to CareTip</p>
                          <p className="text-2xl font-bold text-foreground">Create your account</p>
                          <p className="text-sm text-gray-500">Start collecting tips in minutes.</p>
                        </div>

                        <div className="grid gap-3">
                          <div className="grid gap-1">
                              <span className="text-xs font-semibold text-gray-500">Email</span>
                            <div className="h-10 rounded-lg bg-[#F6F7F8] ring-1 ring-primary/12" />
                          </div>
                          <div className="grid gap-1">
                              <span className="text-xs font-semibold text-gray-500">Password</span>
                            <div className="h-10 rounded-lg bg-[#F6F7F8] ring-1 ring-primary/12" />
                          </div>
                          <div className="h-11 rounded-lg bg-primary text-white shadow-sm" />
                        </div>
                      </div>
                    ) : activeStep === 1 ? (
                      <div className="space-y-5">
                        <div className="rounded-2xl border border-primary/[0.12] bg-white p-5 shadow-sm">
                          <p className="text-sm font-semibold text-primary">Welcome aboard!</p>
                          <p className="mt-1 text-xl font-bold text-foreground">Let’s add your team</p>
                          <p className="mt-2 text-sm text-gray-500">
                            Invite teammates so everyone can start receiving tips.
                          </p>

                          <div className="mt-5 grid gap-3">
                            <div className="flex items-center justify-between rounded-xl bg-[#F6F7F8] px-4 py-3 ring-1 ring-primary/12">
                              <span className="text-sm font-semibold text-foreground">3 invites sent</span>
                              <span className="text-xs font-semibold text-gray-500">Today</span>
                            </div>
                            <div className="h-11 rounded-xl bg-primary text-white shadow-sm" />
                          </div>

                          <div className="mt-5">
                            <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                              <span>Progress</span>
                              <span>1/3</span>
                            </div>
                            <div className="mt-2 grid grid-cols-3 gap-2">
                              <div className="h-2 rounded-full bg-primary/90" />
                              <div className="h-2 rounded-full bg-primary/12" />
                              <div className="h-2 rounded-full bg-primary/12" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : activeStep === 2 ? (
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-primary">QR codes</p>
                          <p className="text-2xl font-bold text-foreground">Generate in seconds</p>
                          <p className="text-sm text-gray-500">Print, display, and start receiving tips.</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-dashed border-primary/20 bg-[#FBFBFC] p-5">
                            <QrCode className="h-6 w-6 text-primary" />
                            <p className="mt-3 text-sm font-semibold text-foreground">QR preview</p>
                          </div>
                          <div className="rounded-2xl border border-dashed border-primary/20 bg-[#FBFBFC] p-5">
                            <div className="h-10 w-10 rounded-xl bg-primary/10" />
                            <p className="mt-3 text-sm font-semibold text-foreground">Download / Print</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-primary">Analytics</p>
                          <p className="text-2xl font-bold text-foreground">Track tips in real time</p>
                          <p className="text-sm text-gray-500">See performance across your team.</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-dashed border-primary/20 bg-[#FBFBFC] p-5">
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                              <p className="text-sm font-semibold text-foreground">Live</p>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-dashed border-primary/20 bg-[#FBFBFC] p-5">
                            <div className="h-10 w-10 rounded-xl bg-primary/10" />
                            <p className="mt-3 text-sm font-semibold text-foreground">Payout ready</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
