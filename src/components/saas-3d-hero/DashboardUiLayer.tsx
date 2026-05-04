import { useId } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bell, Sparkles } from "lucide-react";
import { HERO_CHART_POINTS, HERO_NOTIFICATIONS, HERO_STATS } from "./dummyData";

type DashboardUiLayerProps = {
  /** When false, no Framer Motion or Recharts path animations (stable inside WebGL `<Html>` in production). */
  animated?: boolean;
};

/**
 * Glassmorphism dashboard UI rendered inside R3F `<Html transform>` (crisp vector + charts).
 */
export function DashboardUiLayer({ animated = true }: DashboardUiLayerProps) {
  const chartFillId = useId().replace(/:/g, "");

  return (
    <div
      className="pointer-events-none select-none rounded-2xl border border-white/[0.12] bg-gradient-to-br from-white/[0.14] to-white/[0.04] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
      style={{
        width: 440,
        height: 248,
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.06) inset, 0 0 60px rgba(124,58,237,0.15), 0 24px 80px rgba(0,0,0,0.5)",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/25 ring-1 ring-violet-400/30">
            <Sparkles className="h-4 w-4 text-violet-200" aria-hidden />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Overview</p>
            <p className="text-sm font-semibold text-white">Live workspace</p>
          </div>
        </div>
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10">
          <Bell className="h-4 w-4 text-slate-300" aria-hidden />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        </div>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {HERO_STATS.map((s, i) =>
          animated ? (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-2 py-2 ring-1 ring-white/[0.04]"
            >
              <p className="text-[9px] font-medium uppercase tracking-wide text-slate-500">{s.label}</p>
              <motion.p
                className="text-base font-semibold tabular-nums text-white"
                animate={{ opacity: [1, 0.88, 1] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
              >
                {s.value}
              </motion.p>
              <p className={`text-[10px] font-medium ${s.up ? "text-emerald-400/90" : "text-rose-400/90"}`}>
                {s.delta}
              </p>
            </motion.div>
          ) : (
            <div
              key={s.label}
              className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-2 py-2 ring-1 ring-white/[0.04]"
            >
              <p className="text-[9px] font-medium uppercase tracking-wide text-slate-500">{s.label}</p>
              <p className="text-base font-semibold tabular-nums text-white">{s.value}</p>
              <p className={`text-[10px] font-medium ${s.up ? "text-emerald-400/90" : "text-rose-400/90"}`}>
                {s.delta}
              </p>
            </div>
          ),
        )}
      </div>

      <div className="flex gap-3">
        {animated ? (
          <motion.div
            className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-slate-950/40 p-2 ring-1 ring-white/[0.05]"
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(139,92,246,0)",
                "0 0 24px 0 rgba(139,92,246,0.12)",
                "0 0 0 0 rgba(139,92,246,0)",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChartPanel chartFillId={chartFillId} animateChart />
          </motion.div>
        ) : (
          <div className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-slate-950/40 p-2 ring-1 ring-white/[0.05]">
            <ChartPanel chartFillId={chartFillId} animateChart={false} />
          </div>
        )}
        <div className="w-[120px] shrink-0 space-y-1.5 rounded-xl border border-white/[0.08] bg-slate-950/35 p-2 ring-1 ring-white/[0.05]">
          <p className="text-[9px] font-medium uppercase tracking-wide text-slate-500">Alerts</p>
          {HERO_NOTIFICATIONS.map((n) => (
            <div
              key={n.title}
              className="rounded-lg border border-white/[0.06] bg-white/[0.04] px-2 py-1.5"
            >
              <p className="truncate text-[10px] font-medium text-slate-200">{n.title}</p>
              <p className="text-[9px] text-slate-500">{n.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartPanel({ chartFillId, animateChart }: { chartFillId: string; animateChart: boolean }) {
  return (
    <>
      <p className="mb-1 text-[9px] font-medium uppercase tracking-wide text-slate-500">Revenue</p>
      <div className="h-[72px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={[...HERO_CHART_POINTS]} margin={{ top: 4, right: 0, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id={chartFillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="m" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, "dataMax + 8"]} />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.92)",
                border: "1px solid rgba(148,163,184,0.2)",
                borderRadius: 8,
                fontSize: 11,
              }}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Area
              type="monotone"
              dataKey="v"
              stroke="#c4b5fd"
              strokeWidth={2}
              fill={`url(#${chartFillId})`}
              isAnimationActive={animateChart}
              animationDuration={animateChart ? 1200 : 0}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
