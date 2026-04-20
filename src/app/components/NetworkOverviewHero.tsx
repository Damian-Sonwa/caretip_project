import type { ElementType, ReactNode } from "react";
import { motion } from "motion/react";
import { Cloud, Database } from "lucide-react";
import type { PlatformHealthResponse } from "../lib/api";

export type NetworkOverviewHeroProps = {
  health: PlatformHealthResponse | null;
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
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-w-0 flex-1 flex-col gap-1 rounded-2xl border border-white/25 bg-white/[0.08] px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150 sm:px-5 sm:py-4"
    >
      <div className="flex items-center gap-2 text-white/90">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
          <Icon
            className={`h-4 w-4 text-primary sm:h-[18px] sm:w-[18px] ${iconClassName ?? ""}`}
            strokeWidth={2}
          />
        </div>
        <span className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-white/70 sm:text-xs">
          {label}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-2 pl-[2px]">
        <p
          className={`font-sans text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl ${valueClassName ?? ""}`}
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
          transform: "rotateX(54deg) rotateZ(-12deg) scale(1.05)",
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
            <filter id="glow-line" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M 22 42 Q 50 28 78 38"
            fill="none"
            stroke="hsl(33 82% 55% / 0.35)"
            strokeWidth="0.15"
            filter="url(#glow-line)"
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
        <defs>
          <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {nodes.map((n, i) => (
          <g key={i}>
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r * 1.8}
              fill="hsl(33 90% 55% / 0.15)"
              filter="url(#node-glow)"
              className="animate-pulse"
              style={{ animationDelay: `${n.delay}s`, animationDuration: "2.8s" }}
            />
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r * 0.45}
              fill="hsl(33 95% 62%)"
              className="animate-pulse"
              style={{ animationDelay: `${n.delay}s`, animationDuration: "2.2s" }}
            />
            <circle cx={n.x} cy={n.y} r={n.r * 0.2} fill="white" opacity="0.85" />
          </g>
        ))}
      </svg>

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
    </div>
  );
}

type ServiceKey = "database" | "stripe";

function serviceLine(
  health: PlatformHealthResponse | null,
  key: ServiceKey
): { text: string; state: "checking" | "online" | "offline" } {
  if (!health) return { text: "Checking…", state: "checking" };
  const ok = health[key] === "online";
  return { text: ok ? "Online" : "Offline", state: ok ? "online" : "offline" };
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
  if (state === "checking") return "!text-xl sm:!text-2xl text-white/90";
  if (state === "online") return "!text-xl sm:!text-2xl text-emerald-300";
  return "!text-xl sm:!text-2xl text-red-300";
}

function iconTint(state: "checking" | "online" | "offline"): string {
  if (state === "checking") return "text-primary";
  if (state === "online") return "text-emerald-400";
  return "text-red-400";
}

export function NetworkOverviewHero({ health }: NetworkOverviewHeroProps) {
  const pg = serviceLine(health, "database");
  const st = serviceLine(health, "stripe");

  return (
    <section className="relative mb-10 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl ring-1 ring-white/5">
      <MapGraphic3D />

      <div className="relative z-10 flex min-h-[min(420px,70vh)] flex-col justify-between gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:min-h-[420px] lg:flex-row lg:items-end lg:gap-0 lg:px-10 lg:py-12">
        <div className="max-w-xl lg:max-w-[28rem]">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-sans text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl md:text-5xl"
          >
            The CareTip Ecosystem
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="mt-3 max-w-lg font-sans text-base font-light leading-relaxed text-neutral-400 sm:text-lg"
          >
            Real-time monitoring of global tipping activity and platform health.
          </motion.p>
        </div>

        <div className="flex w-full flex-col gap-3 lg:ml-auto lg:w-auto lg:max-w-md xl:max-w-lg">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55 sm:text-left">
            System health
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <GlassStatCard
              icon={Database}
              label="PostgreSQL"
              value={pg.text}
              valueClassName={valueClass(pg.state)}
              iconClassName={iconTint(pg.state)}
              pulse={statusPulse(pg.state)}
              delay={0.12}
            />
            <GlassStatCard
              icon={Cloud}
              label="Stripe API"
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
