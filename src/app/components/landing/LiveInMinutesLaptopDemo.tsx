import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BarChart3, Mail, QrCode, UserPlus, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const SLIDE_MS = 2200;
const FADE_MS = 0.4;

export const LIVE_DEMO_SLIDE_IDS = ["signup", "team", "qr", "dashboard"] as const;
export type LiveDemoSlideId = (typeof LIVE_DEMO_SLIDE_IDS)[number];

type LiveInMinutesLaptopDemoProps = {
  videoSrc?: string;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
};

export function LiveInMinutesLaptopDemo({
  videoSrc,
  activeIndex: controlledIndex,
  onActiveIndexChange,
}: LiveInMinutesLaptopDemoProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [internalIndex, setInternalIndex] = React.useState(0);

  const slides = React.useMemo(
    () =>
      [
        { id: "signup" as const, label: t("landing.liveDemo.slideSignup") },
        { id: "team" as const, label: t("landing.liveDemo.slideTeam") },
        { id: "qr" as const, label: t("landing.liveDemo.slideQr") },
        { id: "dashboard" as const, label: t("landing.liveDemo.slideDashboard") },
      ],
    [t],
  );

  const isControlled = controlledIndex !== undefined;
  const index = isControlled ? Math.min(Math.max(0, controlledIndex), slides.length - 1) : internalIndex;

  const setIndex = React.useCallback(
    (next: number) => {
      const clamped = ((next % slides.length) + slides.length) % slides.length;
      if (!isControlled) setInternalIndex(clamped);
      onActiveIndexChange?.(clamped);
    },
    [isControlled, onActiveIndexChange, slides.length],
  );

  React.useEffect(() => {
    if (reduceMotion || videoSrc) return;
    const timer = window.setInterval(() => {
      setIndex(index + 1);
    }, SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [reduceMotion, videoSrc, index, setIndex]);

  const active = slides[reduceMotion ? 0 : index];

  return (
    <div className="relative mx-auto w-full max-w-none sm:max-w-2xl">
      <p className="mb-2.5 min-h-[1.25rem] px-1 text-center text-[12px] font-semibold uppercase leading-snug tracking-[0.12em] text-neutral-500 dark:text-neutral-400 sm:mb-4 sm:text-xs sm:tracking-[0.14em]">
        <span className="text-primary">{active.label}</span>
      </p>

      <div className="relative w-full rounded-[2rem] border border-neutral-200/95 bg-gradient-to-b from-neutral-50 to-neutral-100/90 p-2.5 pt-3.5 shadow-[0_2px_4px_rgba(15,15,15,0.05),0_24px_56px_rgba(15,15,15,0.12)] dark:border-neutral-600 dark:from-neutral-800 dark:to-neutral-900 sm:rounded-[2.5rem] sm:p-3 sm:pt-4">
        <div
          aria-hidden
          className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-neutral-300 dark:bg-neutral-600"
        />

        <div className="mt-2 overflow-hidden rounded-xl border border-neutral-200/90 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-neutral-900/[0.06] dark:border-neutral-600 dark:bg-neutral-950 dark:ring-white/10">
          <div className="relative w-full bg-white max-md:aspect-[4/3] max-md:min-h-[min(72vw,280px)] aspect-[16/10] dark:bg-neutral-950 sm:min-h-0 sm:aspect-[16/10]">
            {videoSrc ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover object-top"
                src={videoSrc}
              />
            ) : (
              <div className="absolute inset-0 overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active.id}
                    role="img"
                    aria-label={t("landing.liveDemo.demoAria", { label: active.label })}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: FADE_MS, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 flex min-h-0 flex-col overflow-hidden p-2 max-md:p-2.5 sm:p-[5.5%]"
                  >
                    {active.id === "signup" && <DemoSignup />}
                    {active.id === "team" && <DemoTeam />}
                    {active.id === "qr" && <DemoQr />}
                    {active.id === "dashboard" && <DemoDashboard />}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        <div
          aria-hidden
          className="mx-auto mt-1.5 h-1.5 w-[88%] rounded-b-md bg-gradient-to-b from-neutral-300 to-neutral-400/90 dark:from-neutral-600 dark:to-neutral-700"
        />
      </div>

      {!videoSrc ? (
        <div className="mt-3 flex justify-center gap-2" role="tablist" aria-label={t("landing.liveDemo.slideNavAria")}>
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={s.label}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === index ? "w-6 bg-primary" : "w-2 bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-600",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

const demoShell =
  "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-neutral-200/90 bg-white p-2 text-left shadow-[0_4px_20px_rgba(15,15,15,0.06)] max-md:p-2 sm:p-3.5 dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)]";

function DemoSignup() {
  const { t } = useTranslation();
  return (
    <div className={demoShell}>
      <div className="mb-2.5 flex items-center gap-2 border-b border-neutral-200 pb-2.5 dark:border-neutral-700">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
          <UserPlus className="h-4 w-4" strokeWidth={2.25} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {t("landing.liveDemo.signupBrand")}
          </p>
          <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">{t("landing.liveDemo.signupTitle")}</p>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-1.5 max-md:gap-1 sm:gap-2.5">
        <div>
          <p className="mb-1 text-[10px] font-semibold text-neutral-600 dark:text-neutral-400">{t("landing.liveDemo.workEmail")}</p>
          <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-2 dark:border-neutral-600 dark:bg-neutral-800">
            <Mail className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
            <span className="truncate text-[12px] font-medium text-neutral-800 dark:text-neutral-200">
              {t("landing.liveDemo.sampleEmail")}
            </span>
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold text-neutral-600 dark:text-neutral-400">{t("landing.liveDemo.password")}</p>
          <div className="h-6 rounded-md border border-neutral-200 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 sm:h-8 sm:rounded-lg" />
        </div>
        <button
          type="button"
          className="shrink-0 w-full rounded-md bg-primary py-2 text-[10px] font-bold text-white shadow-[0_4px_14px_rgba(235,153,44,0.35)] sm:rounded-lg sm:py-2.5 sm:text-[11px]"
        >
          {t("landing.liveDemo.continue")}
        </button>
      </div>
    </div>
  );
}

function DemoTeam() {
  const { t } = useTranslation();
  const names = ["Sofia, Server", "Marcus, Bar", "Aisha, Host"];
  return (
    <div className={demoShell}>
      <p className="shrink-0 text-[12px] font-bold leading-snug text-neutral-900 dark:text-neutral-100 sm:text-[13px]">{t("landing.liveDemo.inviteTitle")}</p>
      <p className="mt-0.5 shrink-0 text-[9px] font-medium leading-snug text-neutral-600 dark:text-neutral-400 sm:text-[10px]">{t("landing.liveDemo.inviteSub")}</p>
      <ul className="mt-1.5 flex min-h-0 flex-1 flex-col gap-1 overflow-hidden max-md:gap-1 sm:mt-3 sm:gap-2">
        {names.map((name, i) => (
          <li
            key={name}
            className="flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-800/80 max-md:py-1 sm:gap-2 sm:rounded-lg sm:px-2.5 sm:py-2"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary sm:h-7 sm:w-7 sm:text-[10px]">
              {name[0]}
            </div>
            <span className="flex-1 truncate text-[12px] font-semibold text-neutral-800 dark:text-neutral-200">{name}</span>
            {i === 0 ? (
              <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[9px] font-semibold text-primary">
                {t("landing.liveDemo.pending")}
              </span>
            ) : (
              <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">{t("landing.liveDemo.active")}</span>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-1.5 flex shrink-0 items-center justify-center gap-1 rounded-md border border-dashed border-primary/35 bg-primary/[0.08] py-1.5 text-[9px] font-semibold text-primary sm:mt-2 sm:gap-1.5 sm:rounded-lg sm:py-2.5 sm:text-[10px]">
        <Users className="h-3.5 w-3.5" aria-hidden />
        {t("landing.liveDemo.addAnother")}
      </div>
    </div>
  );
}

function DemoQr() {
  const { t } = useTranslation();
  const labels = [t("landing.liveDemo.qrLabel1"), t("landing.liveDemo.qrLabel2"), t("landing.liveDemo.qrLabel3")];
  return (
    <div className={demoShell}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">{t("landing.liveDemo.qrTitle")}</p>
          <p className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400">{t("landing.liveDemo.qrSub")}</p>
        </div>
        <QrCode className="h-5 w-5 text-primary" strokeWidth={2.25} aria-hidden />
      </div>
      <div className="mt-1.5 grid min-h-0 flex-1 grid-cols-3 gap-1 sm:mt-3 sm:gap-2">
        {labels.map((label) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-700 dark:bg-neutral-800/80"
          >
            <div className="grid h-8 w-8 grid-cols-4 gap-px rounded bg-neutral-900 p-0.5 sm:h-11 sm:w-11 sm:p-1">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className={cn("rounded-[1px]", i % 3 === 0 ? "bg-white" : "bg-neutral-300")} />
              ))}
            </div>
            <span className="mt-1.5 text-[9px] font-semibold text-neutral-700 dark:text-neutral-300">{label}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] font-medium text-neutral-600 dark:text-neutral-400">{t("landing.liveDemo.qrFooter")}</p>
    </div>
  );
}

function DemoDashboard() {
  const { t } = useTranslation();
  return (
    <div className={demoShell}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">{t("landing.liveDemo.dashToday")}</p>
          <p className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400">{t("landing.liveDemo.dashTipsSub")}</p>
        </div>
        <BarChart3 className="h-5 w-5 text-primary" strokeWidth={2.25} aria-hidden />
      </div>
      <div className="mt-1.5 grid shrink-0 grid-cols-2 gap-1.5 sm:mt-2.5 sm:gap-2">
        <div className="rounded-md border border-primary/20 bg-gradient-to-br from-primary/12 to-transparent p-2 dark:border-primary/30 sm:rounded-lg sm:p-2.5">
          <p className="text-[8px] font-semibold text-neutral-600 dark:text-neutral-400 sm:text-[9px]">{t("landing.liveDemo.tipsReceived")}</p>
          <p className="text-base font-bold tabular-nums leading-none text-neutral-900 dark:text-neutral-100 sm:text-xl">€284</p>
          <p className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">{t("landing.liveDemo.dashDelta")}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 dark:border-neutral-700 dark:bg-neutral-800/80">
          <p className="text-[9px] font-semibold text-neutral-600 dark:text-neutral-400">{t("landing.liveDemo.dashScans")}</p>
          <p className="text-base font-bold tabular-nums leading-none text-neutral-900 dark:text-neutral-100 sm:text-xl">48</p>
        </div>
      </div>
      <div className="mt-1.5 flex min-h-0 flex-1 flex-col justify-end sm:mt-2.5">
        <p className="mb-1 text-[8px] font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400 sm:mb-1.5 sm:text-[9px]">
          {t("landing.liveDemo.activity")}
        </p>
        <div className="flex h-10 origin-bottom items-end gap-1 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 px-2 pb-2 dark:border-neutral-700 dark:bg-neutral-800/80 max-md:scale-y-[0.72] sm:h-16 sm:scale-y-100 sm:gap-1.5 sm:rounded-lg sm:px-2.5 sm:pb-2.5">
          {[28, 44, 22, 52, 30, 56, 36].map((px, i) => (
            <div
              key={i}
              className="min-w-0 flex-1 rounded-sm bg-gradient-to-t from-primary to-primary/75"
              style={{ height: `${px}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
