import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BarChart3, Mail, QrCode, UserPlus, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

const SLIDE_MS = 1800;
const FADE_MS = 0.45;

type LiveInMinutesLaptopDemoProps = {
  videoSrc?: string;
};

export function LiveInMinutesLaptopDemo({ videoSrc }: LiveInMinutesLaptopDemoProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = React.useState(0);

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

  React.useEffect(() => {
    if (reduceMotion || videoSrc) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [reduceMotion, videoSrc, slides.length]);

  const active = slides[reduceMotion ? 0 : index];

  return (
    <div className="relative mx-auto w-full max-w-none sm:max-w-2xl">
      <div className="relative w-full rounded-[2.5rem] border border-gray-200 bg-gradient-to-b from-neutral-100 to-neutral-200 p-2.5 pt-3.5 shadow-xl dark:border-neutral-700 dark:from-neutral-800 dark:to-neutral-900 max-md:p-3 max-md:pt-4">
        <div
          aria-hidden
          className="absolute left-1/2 top-1.5 h-1 w-8 -translate-x-1/2 rounded-full bg-neutral-300/90 dark:bg-neutral-600"
        />

        <div className="mt-2 overflow-hidden rounded-xl border border-[rgba(235,153,44,0.45)] bg-[rgba(250,249,246,0.9)] ring-1 ring-[rgba(235,153,44,0.18)] dark:border-[rgba(235,153,44,0.35)] dark:bg-[rgba(235,153,44,0.10)] dark:ring-[rgba(235,153,44,0.14)]">
          <div className="relative aspect-[16/10] w-full max-w-none bg-white dark:bg-neutral-950">
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
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: FADE_MS, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 flex flex-col p-[5%] sm:p-[6%]"
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

      {!videoSrc && !reduceMotion ? (
        <div className="mt-2 flex justify-center gap-1.5" aria-hidden>
          {slides.map((s, i) => (
            <span
              key={s.id}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${i === index ? "bg-primary" : "bg-neutral-300 dark:bg-neutral-600"}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DemoSignup() {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col rounded-lg bg-white p-3 text-left shadow-inner ring-1 ring-black/[0.04] sm:p-4 dark:bg-neutral-900 dark:ring-white/10">
      <div className="mb-2 flex items-center gap-2 border-b border-neutral-100 pb-2 dark:border-neutral-800">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <UserPlus className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {t("landing.liveDemo.signupBrand")}
          </p>
          <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{t("landing.liveDemo.signupTitle")}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div>
          <p className="mb-0.5 text-[9px] font-medium text-neutral-500 dark:text-neutral-400">{t("landing.liveDemo.workEmail")}</p>
          <div className="flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-800/80">
            <Mail className="h-3 w-3 shrink-0 text-neutral-400" />
            <span className="truncate text-[10px] text-neutral-600 dark:text-neutral-300">{t("landing.liveDemo.sampleEmail")}</span>
          </div>
        </div>
        <div>
          <p className="mb-0.5 text-[9px] font-medium text-neutral-500 dark:text-neutral-400">{t("landing.liveDemo.password")}</p>
          <div className="h-7 rounded-md border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/80" />
        </div>
        <button
          type="button"
          className="mt-auto w-full rounded-lg bg-primary py-2 text-[10px] font-bold text-white shadow-sm"
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
    <div className="flex h-full flex-col rounded-lg bg-white p-3 text-left shadow-inner ring-1 ring-black/[0.04] sm:p-4 dark:bg-neutral-900 dark:ring-white/10">
      <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{t("landing.liveDemo.inviteTitle")}</p>
      <p className="mt-0.5 text-[9px] text-neutral-500 dark:text-neutral-400">{t("landing.liveDemo.inviteSub")}</p>
      <ul className="mt-3 flex flex-1 flex-col gap-2">
        {names.map((name, i) => (
          <li
            key={name}
            className="flex items-center gap-2 rounded-md border border-neutral-100 bg-neutral-50/90 px-2 py-1.5 dark:border-neutral-800 dark:bg-neutral-800/50"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary">
              {name[0]}
            </div>
            <span className="flex-1 truncate text-[10px] font-medium text-neutral-800 dark:text-neutral-200">{name}</span>
            {i === 0 ? (
              <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[8px] font-semibold text-primary">{t("landing.liveDemo.pending")}</span>
            ) : (
              <span className="text-[8px] text-emerald-600 dark:text-emerald-400">{t("landing.liveDemo.active")}</span>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center justify-center gap-1 rounded-md border border-dashed border-primary/30 bg-primary/[0.06] py-2 text-[9px] font-semibold text-primary">
        <Users className="h-3 w-3" aria-hidden />
        {t("landing.liveDemo.addAnother")}
      </div>
    </div>
  );
}

function DemoQr() {
  const { t } = useTranslation();
  const labels = [t("landing.liveDemo.qrLabel1"), t("landing.liveDemo.qrLabel2"), t("landing.liveDemo.qrLabel3")];
  return (
    <div className="flex h-full flex-col rounded-lg bg-white p-3 text-left shadow-inner ring-1 ring-black/[0.04] sm:p-4 dark:bg-neutral-900 dark:ring-white/10">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{t("landing.liveDemo.qrTitle")}</p>
          <p className="text-[9px] text-neutral-500 dark:text-neutral-400">{t("landing.liveDemo.qrSub")}</p>
        </div>
        <QrCode className="h-5 w-5 text-primary" aria-hidden />
      </div>
      <div className="mt-3 grid flex-1 grid-cols-3 gap-2">
        {labels.map((label) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-700 dark:bg-neutral-800/60"
          >
            <div className="grid h-10 w-10 grid-cols-4 gap-px rounded bg-neutral-900 p-1">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className={`rounded-[1px] ${i % 3 === 0 ? "bg-white" : "bg-neutral-200"}`} />
              ))}
            </div>
            <span className="mt-1.5 text-[8px] font-medium text-neutral-600 dark:text-neutral-300">{label}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-[9px] text-neutral-500 dark:text-neutral-400">{t("landing.liveDemo.qrFooter")}</p>
    </div>
  );
}

function DemoDashboard() {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col rounded-lg bg-white p-3 text-left shadow-inner ring-1 ring-black/[0.04] sm:p-4 dark:bg-neutral-900 dark:ring-white/10">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{t("landing.liveDemo.dashToday")}</p>
          <p className="text-[9px] text-neutral-500 dark:text-neutral-400">{t("landing.liveDemo.dashTipsSub")}</p>
        </div>
        <BarChart3 className="h-4 w-4 text-primary" aria-hidden />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-neutral-100 bg-gradient-to-br from-primary/10 to-transparent p-2 dark:border-neutral-800">
          <p className="text-[8px] font-medium text-neutral-500 dark:text-neutral-400">{t("landing.liveDemo.tipsReceived")}</p>
          <p className="text-lg font-bold tabular-nums text-neutral-900 dark:text-neutral-100">€284</p>
          <p className="text-[8px] text-emerald-600 dark:text-emerald-400">{t("landing.liveDemo.dashDelta")}</p>
        </div>
        <div className="rounded-md border border-neutral-100 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-800/40">
          <p className="text-[8px] font-medium text-neutral-500 dark:text-neutral-400">{t("landing.liveDemo.dashScans")}</p>
          <p className="text-lg font-bold tabular-nums text-neutral-900 dark:text-neutral-100">48</p>
        </div>
      </div>
      <div className="mt-2 hidden min-h-0 flex-1 flex-col justify-end md:flex">
        <p className="mb-1 text-[8px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {t("landing.liveDemo.activity")}
        </p>
        <div className="flex h-14 items-end gap-1.5 rounded-md border border-neutral-100 bg-neutral-50/80 px-2 pb-2 dark:border-neutral-800 dark:bg-neutral-800/40">
          {[26, 40, 20, 48, 28, 52, 34].map((px, i) => (
            <div
              key={i}
              className="min-w-0 flex-1 rounded-sm bg-gradient-to-t from-primary to-primary/70"
              style={{ height: `${px}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
