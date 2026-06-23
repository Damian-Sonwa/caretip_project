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

/** Abstract wide-angle “3D map” with glowing orange nodes — no external map assets. */
function MapGraphic3D() {
  const nodes = [
    { x: "18%", y: "38%", r: 5, delay: 0 },
    { x: "28%", y: "52%", r: 4, delay: 0.2 },
    { x: "42%", y: "35%", r: 6, delay: 0.1 },
    { x: "55%", y: "48%", r: 5, delay: 0.35 },
    { x: "68%", y: "32%", r: 4, delay: 0.15 },
    { x: "78%", y: "55%", r: 5, delay: 0.25 },
    { x: "88%", y: "40%", r: 3, delay: 0.4 },
    { x: "35%", y: "68%", r: 4, delay: 0.3 },
    { x: "62%", y: "62%", r: 4, delay: 0.2 },
  ];

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-[#0a0c10] to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_100%,hsl(33_82%_45%_/_0.12),transparent_65%)]" />

      <div
        className="absolute left-1/2 top-[42%] h-[130%] w-[125%] -translate-x-1/2 -translate-y-1/2"
        style={{
          perspective: "900px",
          transform: "rotateX(54deg) rotateZ(-8deg) scale(1.04)",
          transformStyle: "preserve-3d",
        }}
      >
        <div className="absolute inset-0 rounded-[40%] border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent" />
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.35]"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <defs>
            <pattern id="net-grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path
                d="M 8 0 L 0 0 0 8"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="0.15"
              />
            </pattern>
            <linearGradient id="net-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#net-grid)" />
          <rect width="100" height="50" y="0" fill="url(#net-fade)" />
        </svg>
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
          </defs>
          <path
            d="M 22 42 Q 50 28 78 38"
            fill="none"
            stroke="hsl(33 82% 55% / 0.35)"
            strokeWidth="0.15"
          />
          <path
            d="M 35 68 Q 48 52 62 62"
            fill="none"
            stroke="hsl(33 82% 55% / 0.25)"
            strokeWidth="0.12"
          />
          <path
            d="M 42 35 L 68 32"
            fill="none"
            stroke="hsl(33 82% 55% / 0.2)"
            strokeWidth="0.1"
          />
        </svg>
      </div>

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {nodes.map((n, i) => (
          <g key={i}>
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r * 1.5}
              fill="hsl(33 90% 55% / 0.12)"
              className="max-md:opacity-80 md:animate-pulse"
              style={{ animationDelay: `${n.delay}s`, animationDuration: "3.2s" }}
            />
            <circle cx={n.x} cy={n.y} r={n.r * 0.45} fill="hsl(33 95% 62%)" />
            <circle cx={n.x} cy={n.y} r={n.r * 0.2} fill="white" opacity="0.85" />
          </g>
        ))}
      </svg>

      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/40" />
    </div>
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
          ? "platform-admin-hero relative overflow-hidden rounded-[calc(1.75rem-3px)] bg-zinc-950"
          : "platform-admin-hero relative mb-10 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-[0_22px_50px_-24px_rgba(0,0,0,0.55),0_14px_32px_-16px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.06] max-lg:mb-12"
      }
    >
      <MapGraphic3D />

      <div className="relative z-10 flex min-h-[min(380px,68svh)] flex-col gap-8 px-5 py-8 max-lg:gap-7 sm:px-8 sm:py-10 lg:min-h-[420px] lg:flex-row lg:items-end lg:justify-between lg:gap-10 lg:px-10 lg:py-12">
        <div className="relative max-w-xl lg:max-w-[28rem]">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-6 -inset-y-4 rounded-3xl bg-gradient-to-br from-black/70 via-black/45 to-transparent"
          />
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
