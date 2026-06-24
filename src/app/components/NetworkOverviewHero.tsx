import type { ElementType, ReactNode } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Cloud, Database } from "lucide-react";
import type { PlatformHealthResponse } from "../lib/api";

export type NetworkOverviewHeroProps = {
  health: PlatformHealthResponse | null;
  /** When true, sits inside PremiumPageHero — drops outer frame styles. */
  embedded?: boolean;
};

function LivePulse({ className }: { className?: string }) {
  return (
    <span className={`relative flex h-3 w-3 ${className ?? ""}`}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
    </span>
  );
}

function GlassStatCard({
  icon: Icon,
  label,
  value,
  valueClassName,
  pulse,
  delay,
  iconClassName,
}: {
  icon: ElementType;
  label: string;
  value: string;
  valueClassName?: string;
  pulse?: ReactNode;
  delay: number;
  iconClassName?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay * 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-w-0 flex-1 flex-col gap-1 rounded-2xl border border-white/20 bg-white/[0.09] px-4 py-3 shadow-[0_8px_28px_-8px_rgba(0,0,0,0.35),0_4px_12px_-4px_rgba(0,0,0,0.15)] backdrop-blur-md sm:px-5 sm:py-4"
    >
      <div className="flex items-center gap-2 text-white/90">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
          <Icon
            className={`h-4 w-4 text-primary sm:h-[18px] sm:w-[18px] ${iconClassName ?? ""}`}
            strokeWidth={2}
          />
        </div>
        <span className="truncate text-[12px] font-medium uppercase tracking-[0.11em] text-white/72 sm:text-xs">
          {label}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-2 pl-[2px]">
        <p
          className={`font-sans text-[1.625rem] font-bold tabular-nums tracking-tight text-white sm:text-3xl ${valueClassName ?? ""}`}
        >
          {value}
        </p>
        {pulse}
      </div>
    </motion.div>
  );
}

/** Abstract map backdrop — warm premium gradient with orange atmosphere. */
function MapGraphic3D() {
  return (
    <div
      className="platform-admin-hero__atmosphere pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
      aria-hidden
    />
  );
}

function statusPulse(state: "checking" | "online" | "offline"): ReactNode {
  if (state === "checking") {
    return <span className="h-3 w-3 animate-pulse rounded-full bg-white/30" />;
  }
  if (state === "online") {
    return <LivePulse />;
  }
  return (
    <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(248,113,113,0.85)]" />
  );
}

function valueClass(state: "checking" | "online" | "offline"): string {
  if (state === "checking") return "!text-[1.125rem] sm:!text-2xl text-white/90";
  if (state === "online") return "!text-[1.125rem] sm:!text-2xl text-emerald-300";
  return "!text-[1.125rem] sm:!text-2xl text-red-300";
}

function iconTint(state: "checking" | "online" | "offline"): string {
  if (state === "checking") return "text-primary";
  if (state === "online") return "text-emerald-400";
  return "text-red-400";
}

export function NetworkOverviewHero({ health, embedded = false }: NetworkOverviewHeroProps) {
  const { t } = useTranslation();

  const pg = useMemo(() => {
    if (!health) return { text: t("admin.networkHero.checking"), state: "checking" as const };
    const ok = health.database === "online";
    return {
      text: ok ? t("admin.networkHero.online") : t("admin.networkHero.offline"),
      state: ok ? ("online" as const) : ("offline" as const),
    };
  }, [health, t]);

  const st = useMemo(() => {
    if (!health) return { text: t("admin.networkHero.checking"), state: "checking" as const };
    const ok = health.stripe === "online";
    return {
      text: ok ? t("admin.networkHero.online") : t("admin.networkHero.offline"),
      state: ok ? ("online" as const) : ("offline" as const),
    };
  }, [health, t]);

  return (
    <section
      className={
        embedded
          ? "platform-admin-hero relative overflow-hidden rounded-[1.75rem]"
          : "platform-admin-hero relative mb-10 overflow-hidden rounded-3xl border border-white/10 shadow-[0_22px_50px_-24px_rgba(233,120,28,0.38),0_14px_32px_-16px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.06] max-lg:mb-12"
      }
    >
      <MapGraphic3D />

      <div className="relative z-10 flex min-h-[min(380px,68svh)] flex-col gap-8 px-5 py-8 max-lg:gap-7 sm:px-8 sm:py-10 lg:min-h-[420px] lg:flex-row lg:items-end lg:justify-between lg:gap-10 lg:px-10 lg:py-12">
        <div className="relative max-w-xl lg:max-w-[28rem]">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative font-sans text-[1.75rem] font-bold leading-[1.16] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-4xl md:text-[2.6rem]"
          >
            {t("admin.networkHero.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="relative mt-3 font-sans text-[15px] font-normal leading-relaxed text-neutral-200/95 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] sm:text-base lg:text-lg"
          >
            <span className="lg:hidden">{t("admin.networkHero.subtitleMobile")}</span>
            <span className="hidden lg:inline">{t("admin.networkHero.subtitle")}</span>
          </motion.p>
        </div>

        <div className="flex w-full flex-col gap-3 lg:ml-auto lg:w-auto lg:max-w-md xl:max-w-lg">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/58 sm:text-left sm:text-xs">
            {t("admin.networkHero.systemHealth")}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:items-stretch sm:gap-3">
            <GlassStatCard
              icon={Database}
              label={t("admin.networkHero.labelPostgres")}
              value={pg.text}
              valueClassName={valueClass(pg.state)}
              iconClassName={iconTint(pg.state)}
              pulse={statusPulse(pg.state)}
              delay={0.12}
            />
            <GlassStatCard
              icon={Cloud}
              label={t("admin.networkHero.labelStripe")}
              value={st.text}
              valueClassName={valueClass(st.state)}
              iconClassName={iconTint(st.state)}
              pulse={statusPulse(st.state)}
              delay={0.2}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
