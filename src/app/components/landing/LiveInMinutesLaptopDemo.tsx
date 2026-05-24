import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Heart, QrCode, Sparkles, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useMinWidthMedia } from "@/lib/motionPerf";
import atmosphereImg from "../../../../images/beauty-r.png";
import caretipLogo from "@/assets/brand/company_logo.png";

export const LIVE_DEMO_SLIDE_IDS = ["signup", "team", "qr", "dashboard"] as const;
export type LiveDemoSlideId = (typeof LIVE_DEMO_SLIDE_IDS)[number];

const STEP_IDS = ["signup", "team", "qr", "celebrate"] as const;

type LiveInMinutesLaptopDemoProps = {
  videoSrc?: string;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
};

export function LiveInMinutesLaptopDemo({
  videoSrc,
  activeIndex = 0,
}: LiveInMinutesLaptopDemoProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const isLgUp = useMinWidthMedia(1024);
  const enableFloatMotion = !reduceMotion && isLgUp;
  const index = Math.min(Math.max(0, activeIndex), STEP_IDS.length - 1);
  const stepId = STEP_IDS[index];

  const captions = React.useMemo(
    () => [
      t("landing.simpleSetup.visualCaption1"),
      t("landing.simpleSetup.visualCaption2"),
      t("landing.simpleSetup.visualCaption3"),
      t("landing.simpleSetup.visualCaption4"),
    ],
    [t],
  );

  if (videoSrc) {
    return (
      <motion.div
        className="caretip-live-minutes-stage caretip-live-minutes-device-lift relative mx-auto w-full max-w-[min(100%,15.75rem)] overflow-hidden rounded-[1.35rem] shadow-[0_20px_40px_-24px_rgba(30,24,16,0.26),0_8px_18px_-10px_rgba(30,24,16,0.12)] ring-1 ring-neutral-900/[0.06] sm:max-w-[20rem] sm:rounded-[1.5rem] lg:max-w-[22rem] dark:ring-white/[0.08]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <video autoPlay muted loop playsInline className="aspect-[3/4] w-full object-cover" src={videoSrc} />
      </motion.div>
    );
  }

  return (
    <div className="caretip-live-minutes-stage relative mx-auto w-full max-w-[min(100%,15.75rem)] sm:max-w-[20rem] lg:max-w-[22rem]">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-2 left-1/2 z-0 h-6 w-[68%] -translate-x-1/2 rounded-[100%] bg-neutral-900/[0.07] blur-lg sm:h-8 sm:w-[72%] sm:blur-xl dark:bg-black/40"
      />
      <motion.div
        className="caretip-live-minutes-device-lift relative aspect-[5/6] overflow-hidden rounded-[1.35rem] shadow-[0_24px_48px_-28px_rgba(30,24,16,0.32),0_8px_20px_-10px_rgba(30,24,16,0.14)] ring-1 ring-neutral-900/[0.05] sm:aspect-[3/4] sm:rounded-[1.5rem] sm:shadow-[0_32px_64px_-30px_rgba(30,24,16,0.38),0_12px_28px_-14px_rgba(30,24,16,0.16)] dark:ring-white/[0.08]"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-6%" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <img
          src={atmosphereImg}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-105 object-cover object-center"
          loading="lazy"
          decoding="async"
        />
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,22,16,0.25)_0%,rgba(28,22,16,0.55)_55%,rgba(20,16,12,0.72)_100%)]"
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_18%,rgba(255,220,180,0.18),transparent_52%)]"
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_22%,rgba(233,120,28,0.14),transparent_58%)]"
        />

        <motion.div
          className="caretip-live-minutes-phone-float absolute inset-x-0 top-[9%] bottom-[12%] flex items-center justify-center px-5 sm:top-[10%] sm:bottom-[14%] sm:px-6"
          animate={enableFloatMotion ? { y: [0, -5, 0] } : undefined}
          transition={
            enableFloatMotion
              ? { duration: 7, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }
              : undefined
          }
        >
          <PhoneFrame>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={stepId}
                role="img"
                aria-label={t("landing.liveDemo.demoAria", { label: captions[index] })}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="flex h-full flex-col items-center justify-center px-4 py-8 text-center"
              >
                {stepId === "signup" && <PhoneWelcome />}
                {stepId === "team" && <PhoneTeam />}
                {stepId === "qr" && <PhoneQr />}
                {stepId === "celebrate" && <PhoneCelebrate />}
              </motion.div>
            </AnimatePresence>
          </PhoneFrame>
        </motion.div>
      </motion.div>

      <p className="caretip-live-minutes-caption mt-2.5 text-center font-sans text-[12px] leading-snug tracking-tight text-neutral-600 dark:text-neutral-400 sm:mt-4 sm:text-[13px] lg:text-sm">
        {captions[index]}
      </p>
    </div>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <motion.div className="relative h-full w-full max-w-[10.25rem] sm:max-w-[11.25rem] lg:max-w-[12rem]">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-1 left-1/2 z-0 h-4 w-[88%] -translate-x-1/2 rounded-[100%] bg-neutral-900/25 blur-md"
      />
      <motion.div className="relative z-[1] h-full rounded-[1.65rem] bg-neutral-900/90 p-[3px] shadow-[0_20px_44px_-14px_rgba(0,0,0,0.5),0_6px_14px_-4px_rgba(0,0,0,0.25)] ring-1 ring-white/10">
        <span
          aria-hidden
          className="absolute left-1/2 top-1.5 z-10 h-[3px] w-10 -translate-x-1/2 rounded-full bg-neutral-700"
        />
        <motion.div className="h-full overflow-hidden rounded-[1.45rem] bg-[linear-gradient(180deg,#fffdf9_0%,#f8f4ee_100%)]">
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function PhoneWelcome() {
  const { t } = useTranslation();
  return (
    <>
      <img src={caretipLogo} alt="" className="mb-4 h-11 w-auto opacity-90 sm:h-12" aria-hidden />
      <p className="font-sans text-[15px] font-bold leading-snug tracking-tight text-neutral-900">
        {t("landing.simpleSetup.phoneWelcome")}
      </p>
      <p className="mt-2 max-w-[9.5rem] text-[11px] leading-relaxed text-neutral-600">
        {t("landing.simpleSetup.phoneWelcomeSub")}
      </p>
      <span className="mt-5 inline-flex items-center gap-1 rounded-full bg-primary/12 px-3 py-1.5 text-[10px] font-semibold text-primary ring-1 ring-primary/15">
        <Sparkles className="h-3 w-3" aria-hidden />
        {t("landing.liveDemo.continue")}
      </span>
    </>
  );
}

function PhoneTeam() {
  const { t } = useTranslation();
  const avatars = ["S", "M", "A"];
  return (
    <>
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100/80 text-primary ring-1 ring-amber-200/60">
        <Users className="h-5 w-5" strokeWidth={2} aria-hidden />
      </span>
      <p className="font-sans text-[15px] font-bold tracking-tight text-neutral-900">{t("landing.simpleSetup.phoneTeam")}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-neutral-600">{t("landing.simpleSetup.phoneTeamSub")}</p>
      <motion.div className="mt-4 flex -space-x-2">
        {avatars.map((initial) => (
          <span
            key={initial}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-50 text-[11px] font-bold text-neutral-800 ring-2 ring-white"
          >
            {initial}
          </span>
        ))}
      </motion.div>
    </>
  );
}

function PhoneQr() {
  const { t } = useTranslation();
  return (
    <>
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100/80 text-primary ring-1 ring-amber-200/60">
        <QrCode className="h-5 w-5" strokeWidth={2} aria-hidden />
      </span>
      <p className="font-sans text-[15px] font-bold tracking-tight text-neutral-900">{t("landing.simpleSetup.phoneQr")}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-neutral-600">{t("landing.simpleSetup.phoneQrSub")}</p>
      <motion.div className="mt-4 grid grid-cols-4 gap-px rounded-lg bg-neutral-900 p-1.5 shadow-sm">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className={cn("h-2 w-2 rounded-[1px]", i % 3 === 0 ? "bg-white" : "bg-neutral-400")} />
        ))}
      </motion.div>
    </>
  );
}

function PhoneCelebrate() {
  const { t } = useTranslation();
  return (
    <>
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/20">
        <Heart className="h-5 w-5 fill-primary/20" strokeWidth={2} aria-hidden />
      </span>
      <p className="font-sans text-[15px] font-bold tracking-tight text-neutral-900">{t("landing.simpleSetup.phoneCelebrate")}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-neutral-600">{t("landing.simpleSetup.phoneCelebrateSub")}</p>
      <p className="mt-4 font-sans text-2xl font-bold tabular-nums tracking-tight text-primary">€12</p>
    </>
  );
}
