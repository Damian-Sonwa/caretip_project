import { motion } from "motion/react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router";
import {
  Euro,
  Users,
  TrendingUp,
  Award,
  Download,
  ArrowUpRight,
  QrCode,
  MapPin,
  Star,
  Building2,
  ArrowRight,
  Store,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { useSocket, useDeferSocketConnect } from "../../hooks/useSocket";
import { useRealtimeFallback } from "../../hooks/useRealtimeFallback";
import { LiveConnectionBadge } from "../../components/LiveConnectionBadge";
import { FixPrompt } from "../../components/FixPrompt";
import { downloadBusinessTransactionsExport, getBusinessStats } from "../../lib/api";
import { formatEur } from "../../lib/formatEur";
import type {
  BusinessDashboardStats,
  EmployeeGoalProgressStatus,
  GoalPeriod,
} from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { LoadingSpinner } from "../../components/ui/loading-spinner";
import { CareTipUsageGuidelinesDialog } from "../../components/business/CareTipUsageGuidelinesDialog";
import { ProfileAvatar } from "../../components/ui/profile-avatar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { cn } from "@/lib/utils";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  devMockBusinessEmployeePerformance,
  devMockBusinessTipDistribution,
} from "../../lib/devAnalyticsMocks";
import aceHeroImage from "../../../../images/ACE.png";

// Match Platform Admin dashboard analytics palette (premium, consistent).
const BUSINESS_CHART_COLORS = [
  "#197278", // brand teal
  "#22d3ee", // cyan
  "#a78bfa", // purple
  "#34d399", // emerald
  "#f59e0b", // amber
  "#fb7185", // red
  "#94a3b8", // slate
] as const;

const BUSINESS_HERO_HEADLINE = "Team Performance Overview";
const BUSINESS_HERO_SUB = "Track team growth in real time.";

/** Desktop max height cap; mobile uses tighter fixed height for a compact hero. */
const BUSINESS_HERO_MEDIA_MAX_STYLE = { maxHeight: "min(55vh, 480px)" } as const;

const TOAST_OK = { style: { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } } as const;

const EXPORT_ERROR_TOAST = {
  style: { background: "#000000", color: "#ffffff" },
} as const;

const GOAL_PERIOD_LABEL: Record<GoalPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

function StatCard(props: {
  title: string;
  value: string;
  change?: string;
  icon: React.ElementType;
  /** On viewports below `lg`, span full width of the 2-column stats grid (primary metric). */
  featured?: boolean;
  /** `brand` = orange staff/earnings; `muted` = slate for secondary metrics. */
  iconTone?: "brand" | "muted";
}) {
  const Icon = props.icon;
  const tone = props.iconTone ?? "brand";
  return (
    <Card
      className={cn(
        "flex min-h-32 flex-col rounded-2xl border border-[#E5E7EB] bg-white p-4 text-left shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)]",
        props.featured && "max-lg:col-span-2",
      )}
    >
      <div className="mb-2 shrink-0">
        <div
          className={cn(
            "inline-flex rounded-lg p-2",
            tone === "brand" ? "bg-orange-50" : "bg-slate-50",
          )}
        >
          <Icon
            className={cn("h-5 w-5", tone === "brand" ? "text-primary" : "text-slate-600")}
            aria-hidden
          />
        </div>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{props.title}</p>
      <p className="shrink-0 hyphens-auto break-words text-balance text-xl font-bold tabular-nums leading-snug text-black sm:text-2xl">
        {props.value}
      </p>
      {props.change ? (
        <p className="mt-auto line-clamp-2 text-[10px] leading-snug text-gray-400">{props.change}</p>
      ) : (
        <div className="mt-auto shrink-0" aria-hidden />
      )}
    </Card>
  );
}

function goalStatusLabel(s: EmployeeGoalProgressStatus): string {
  if (s === "achieved") return "Achieved";
  if (s === "on_track") return "On track";
  return "Below target";
}

function goalStatusClass(s: EmployeeGoalProgressStatus): string {
  if (s === "achieved") return "text-[#34D399]";
  if (s === "on_track") return "text-primary";
  return "text-amber-700";
}

export function BusinessDashboard() {
  const { user, logout, isBusiness, exitImpersonation, sessionValidated } = useRequireAuth();

  const handleLogout = () => {
    if (user?.impersonation) {
      exitImpersonation();
      return;
    }
    logout();
  };
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("month");
  const [exportLoading, setExportLoading] = useState(false);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [stats, setStats] = useState<BusinessDashboardStats | null>(null);
  /** Stats fetch only — do not block rendering the dashboard shell. */
  const [statsLoading, setStatsLoading] = useState(true);
  /** Lightweight loading indicator for timeframe toggles (no blocking spinner). */
  const [timeframeLoading, setTimeframeLoading] = useState<null | "week" | "month" | "year">(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);

  const statsCacheRef = useRef(
    new Map<"week" | "month" | "year", { stats: BusinessDashboardStats; pendingVerification: false } | { stats: null; pendingVerification: true }>()
  );
  /**
   * Only tracks *UI-affecting* requests for the currently selected timeframe.
   * Background prefetches must never invalidate the foreground request, otherwise the first load
   * can populate the cache but fail to update cards until the user toggles.
   */
  const uiRequestSeqRef = useRef(0);

  const loadStatsFor = useCallback(
    async (tf: "week" | "month" | "year", opts?: { background?: boolean }) => {
      if (!sessionValidated || !user?.businessId) return;

      const cached = statsCacheRef.current.get(tf);
      if (cached) {
        if (tf === timeframe) {
          setPendingVerification(cached.pendingVerification);
          setError(null);
          setStats(cached.pendingVerification ? null : cached.stats);
          setStatsLoading(false);
          setTimeframeLoading(null);
        }
        return;
      }

      const affectsUi = !opts?.background && tf === timeframe;
      const seq = affectsUi ? ++uiRequestSeqRef.current : 0;
      if (affectsUi) {
        setTimeframeLoading(tf);
      }
      try {
        const data = await getBusinessStats(tf);
        statsCacheRef.current.set(tf, { stats: data, pendingVerification: false });
        if (tf === timeframe && (!affectsUi || uiRequestSeqRef.current === seq)) {
          setPendingVerification(false);
          setError(null);
          setStats(data);
        }
      } catch (err) {
        const msg = toUserFriendlyMessage(err);
        if (msg.toLowerCase().includes("pending verification")) {
          statsCacheRef.current.set(tf, { stats: null, pendingVerification: true });
          if (tf === timeframe && (!affectsUi || uiRequestSeqRef.current === seq)) {
            setPendingVerification(true);
            setError(null);
            setStats(null);
          }
        } else if (!opts?.background) {
          logClientError("BusinessDashboard.fetchStats", err);
          if (tf === timeframe && (!affectsUi || uiRequestSeqRef.current === seq)) {
            setError(msg);
            setStats(null);
          }
        } else {
          logClientError("BusinessDashboard.prefetchStats", err);
        }
      } finally {
        if (affectsUi) {
          setStatsLoading(false);
          setTimeframeLoading(null);
        }
      }
    },
    [timeframe, user?.businessId, sessionValidated]
  );

  const fetchStats = useCallback(async () => {
    if (!sessionValidated || !user?.businessId) {
      setStatsLoading(false);
      return;
    }
    // Only show loading if this timeframe is not cached.
    if (!statsCacheRef.current.get(timeframe)) setStatsLoading(true);
    await loadStatsFor(timeframe);
  }, [user?.businessId, sessionValidated, timeframe, loadStatsFor]);

  const refreshStatsQuiet = useCallback(async () => {
    if (!sessionValidated || !user?.businessId) return;
    try {
      const data = await getBusinessStats(timeframe);
      statsCacheRef.current.set(timeframe, { stats: data, pendingVerification: false });
      setStats(data);
    } catch (err) {
      logClientError("BusinessDashboard.refreshStatsQuiet", err);
      /* keep existing stats on background refresh failure */
    }
  }, [user?.businessId, timeframe, sessionValidated]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  // Prefetch other timeframes after first load for instant toggles.
  useEffect(() => {
    if (!sessionValidated || !user?.businessId) return;
    const others = (["week", "month", "year"] as const).filter((t) => t !== timeframe);
    // Defer so it never blocks interaction.
    const id = window.setTimeout(() => {
      others.forEach((t) => void loadStatsFor(t, { background: true }));
    }, 250);
    return () => window.clearTimeout(id);
  }, [loadStatsFor, timeframe, user?.businessId, sessionValidated]);

  const socketReady = useDeferSocketConnect(sessionValidated && user?.role === "business");
  const { socket, connected, connectionStatus } = useSocket(socketReady);

  useRealtimeFallback(connected, refreshStatsQuiet);

  useEffect(() => {
    if (!socket || user?.role !== "business") return;
    const sync = () => void refreshStatsQuiet();
    socket.on("business_data_updated", sync);
    socket.on("verification_updated", sync);
    return () => {
      socket.off("business_data_updated", sync);
      socket.off("verification_updated", sync);
    };
  }, [socket, user?.role, refreshStatsQuiet]);

  useEffect(() => {
    if (!socket || user?.role !== "business" || !user?.businessId) return;

    const onNewTip = (payload: {
      tip: { id: string; amount: number; status: string; createdAt: string };
      employeeId: string;
      employeeName?: string;
      businessId: string;
      currentMonthTotal: number;
      monthlyGoal: number | null;
    }) => {
      if (payload.businessId !== user.businessId) return;
      const who = payload.employeeName?.trim() || "Team member";
      const timeStr = new Date(payload.tip.createdAt).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
      toast.success(
        `New tip: ${who} · ${formatEur(Number(payload.tip.amount))} · ${timeStr}`,
        TOAST_OK,
      );
      void refreshStatsQuiet();
    };

    socket.on("new_tip", onNewTip);
    return () => {
      socket.off("new_tip", onNewTip);
    };
  }, [socket, user?.role, user?.businessId, refreshStatsQuiet]);

  const handleExport = async () => {
    if (!isBusiness) return;
    setExportLoading(true);
    try {
      await downloadBusinessTransactionsExport();
    } catch (err) {
      logClientError("BusinessDashboard", err);
      toast.error("Export failed. Please try again.", EXPORT_ERROR_TOAST);
    } finally {
      setExportLoading(false);
    }
  };

  const topEmployees = (stats?.employees ?? [])
    .filter((e) => e.isActive === true && e.activationStatus === "active" && e.emailVerified === true)
    .sort((a, b) => b.tipsTotal - a.tipsTotal)
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      name: e.name,
      role: e.jobTitle,
      avatar: e.avatar,
      tips: e.tipsTotal,
      rating: e.rating as number | null,
      growth: ""
    }));

  const devDemo =
    import.meta.env.DEV &&
    !statsLoading &&
    pendingVerification === false &&
    (stats?.tipCount ?? 0) === 0;

  const tipDistributionData = devDemo
    ? devMockBusinessTipDistribution(timeframe)
    : (stats?.dailyTipDistribution ?? []);

  const employeePerformance = useMemo(() => {
    if (devDemo) {
      return devMockBusinessEmployeePerformance([...BUSINESS_CHART_COLORS]);
    }
    const list = [...(stats?.employees ?? [])].sort((a, b) => b.tipsTotal - a.tipsTotal);
    return list.map((e, i) => ({
      name:
        e.name.split(" ").length > 1
          ? `${e.name.split(" ")[0]} ${e.name.split(" ")[1]?.[0] ?? ""}.`
          : e.name,
      tips: e.tipsTotal,
      rating: e.rating ?? 0,
      color: BUSINESS_CHART_COLORS[i % BUSINESS_CHART_COLORS.length],
    }));
  }, [devDemo, stats?.employees]);

  const hasTipActivityInPeriod = devDemo || (stats?.totalTips ?? 0) > 0;

  const brokenQrLinks =
    (stats?.employees ?? []).length > 0 &&
    (stats?.employees ?? []).some((e) => e.slug == null || e.slug === "");

  if (!user) return null;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="mb-2 text-sm font-medium text-destructive">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary hover:underline text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8F9FA]">
      {user?.impersonation && (
        <div
          className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-primary/15 px-4 py-2.5 text-sm text-foreground"
          role="status"
        >
          <span>Support mode: you are viewing this venue as the manager.</span>
          <button
            type="button"
            onClick={exitImpersonation}
            className="font-semibold text-foreground underline underline-offset-2"
          >
            Exit to Platform Admin
          </button>
        </div>
      )}

      <div className="caretip-container pt-6">
        <FixPrompt
          id="pendingVerification"
          issueActive={pendingVerification === true}
          tone="info"
          title="Account pending verification"
          description="Your venue dashboard stats will appear once verification is approved."
          dismissPersistence="session"
          className="mb-5"
        />
        <DashboardHero
          stackHeroOnMobile
          hideTabs
          actionsPlacement="belowText"
          badge={
            <>
              <Store className="h-3.5 w-3.5 text-foreground" />
              {statsLoading && !stats?.name?.trim() ? (
                <span className="text-muted-foreground animate-pulse">Loading venue…</span>
              ) : stats?.name?.trim() ? (
                stats.name
              ) : (
                "Venue dashboard"
              )}
            </>
          }
          title={BUSINESS_HERO_HEADLINE}
          description={BUSINESS_HERO_SUB}
          image={
            <div className="relative isolate flex h-full w-full max-w-full min-h-0 items-center justify-center touch-manipulation">
              <div className="relative mx-auto flex w-full min-w-0 max-w-none flex-col items-center justify-center lg:w-full lg:max-w-[420px]">
                <div
                  className={cn(
                    "relative mx-auto w-full max-w-full shrink-0 overflow-hidden bg-gray-100 ring-1 ring-black/[0.04]",
                    // Mobile: compact, premium media card
                    "aspect-[16/10] min-h-[220px] max-h-[260px] rounded-[20px] border border-black/[0.06] shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)]",
                    // Desktop: keep existing rhythm
                    "lg:aspect-square lg:max-h-none lg:max-w-[420px] lg:rounded-2xl lg:border-gray-100 lg:shadow-sm",
                  )}
                  style={BUSINESS_HERO_MEDIA_MAX_STYLE}
                >
                  <img
                    src={aceHeroImage}
                    alt=""
                    className="h-full w-full p-4 object-contain object-center"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          }
          imageOverlay={false}
        />
      </div>

      <TracingBeam className="caretip-container">
        <div className="space-y-6 pb-6 pt-4 sm:pt-6">
          <FixPrompt
            id="missingQR"
            issueActive={brokenQrLinks}
            dismissPersistence="session"
            title="Some staff are missing QR links"
            description="Open QR Management to generate fresh links and printable codes."
            actionLabel="Fix QR links"
            actionTo="/business/qr-management"
          />

          <div className="flex flex-wrap items-center gap-3">
            <LiveConnectionBadge status={connectionStatus} />
          <div className="dashboard-inline-actions flex w-full max-w-full flex-wrap gap-2 rounded-lg border border-[#E5E7EB] bg-white p-1 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)] sm:w-fit">
            {(["week", "month", "year"] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => {
                  // Prevent scroll jump: preserve scroll position across the state update.
                  const y = window.scrollY;
                  setTimeframe(period);
                  queueMicrotask(() => {
                    requestAnimationFrame(() => {
                      window.scrollTo({ top: y, left: 0, behavior: "instant" as ScrollBehavior });
                    });
                  });
                }}
                className={`min-h-11 flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-all sm:flex-initial sm:px-4 sm:text-sm ${
                  timeframe === period
                    ? "bg-primary text-primary-foreground shadow-[0_4px_18px_-4px_rgb(124_45_18_/0.22)]"
                    : "text-muted-foreground hover:bg-slate-50"
                }`}
              >
                {period === "week" && "This Week"}
                {period === "month" && "This Month"}
                {period === "year" && "This Year"}
                {timeframeLoading === period ? (
                  <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-current/70 align-middle" aria-hidden />
                ) : null}
              </button>
            ))}
          </div>
          </div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div className="relative mb-2 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
              <StatCard
                featured
                title={`Total tips (${timeframe === "week" ? "week" : timeframe === "month" ? "month" : "year"})`}
                value={formatEur(stats?.totalTips ?? 0)}
                change={hasTipActivityInPeriod ? "Live totals update as tips land." : "No tips yet for this period."}
                icon={Euro}
              />
              <StatCard
                title="Active employees"
                value={String(stats?.employeeCount ?? 0)}
                change={topEmployees.length > 0 ? `${topEmployees.length} showing in top list` : undefined}
                icon={Users}
              />
              <StatCard
                title="Tips count"
                value={String(stats?.tipCount ?? 0)}
                change={hasTipActivityInPeriod ? "Includes successful tips in this timeframe." : undefined}
                icon={Award}
                iconTone="muted"
              />
              <StatCard
                title="Avg tip per employee"
                value={
                  stats?.employeeCount && stats?.totalTips
                    ? formatEur(stats.totalTips / stats.employeeCount, { minFrac: 0, maxFrac: 0 })
                    : formatEur(0, { minFrac: 0, maxFrac: 0 })
                }
                change="Useful coaching metric"
                icon={TrendingUp}
                iconTone="muted"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="w-full rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)]">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <Target className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg">Employee tip goals</CardTitle>
                    <CardDescription>
                      Targets your team set for themselves. Progress uses tips in each person&apos;s current period
                      (aligned with the performance chart timeframe for totals).
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="min-w-0 overflow-x-auto">
                {!stats?.employeeGoals || stats.employeeGoals.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No staff have set a tip goal yet.
                  </p>
                ) : (
                  <table className="w-full min-w-[640px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="pb-2 pr-3 font-medium">Team member</th>
                        <th className="pb-2 pr-3 font-medium">Period</th>
                        <th className="pb-2 pr-3 font-medium tabular-nums">Target</th>
                        <th className="pb-2 pr-3 font-medium tabular-nums">Current</th>
                        <th className="pb-2 pr-3 font-medium tabular-nums">Progress</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.employeeGoals.map((g) => (
                        <tr key={g.employeeId} className="border-b border-border/60 last:border-0">
                          <td className="py-3 pr-3 font-medium text-foreground">{g.name}</td>
                          <td className="py-3 pr-3 text-muted-foreground">
                            {GOAL_PERIOD_LABEL[g.goalPeriod]}
                          </td>
                          <td className="py-3 pr-3 tabular-nums">{formatEur(g.goalAmount)}</td>
                          <td className="py-3 pr-3 tabular-nums">{formatEur(g.currentAmount)}</td>
                          <td className="py-3 pr-3 tabular-nums font-medium">{g.percent}%</td>
                          <td className={`py-3 font-medium ${goalStatusClass(g.status)}`}>
                            {goalStatusLabel(g.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Charts Section */}
          <div className="w-full grid gap-6 lg:grid-cols-2">
            {/* Tip Distribution Chart */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="w-full rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)]">
                <CardHeader>
                  <CardTitle className="text-lg">Daily tip distribution</CardTitle>
                  <CardDescription>
                    {timeframe === "week" && "Tips per day (Mon to Sun, current week)"}
                    {timeframe === "month" && "Tips per day (current month)"}
                    {timeframe === "year" && "Tips per month (current year)"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="min-w-0 overflow-x-auto overflow-y-visible pb-2">
                  {!hasTipActivityInPeriod || tipDistributionData.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">No tip activity yet</p>
                  ) : (
                    <div className="flex h-[260px] w-full min-w-0 items-center justify-center sm:h-[290px]">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart data={tipDistributionData} margin={{ top: 10, right: 12, left: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="day" stroke="#64748b" style={{ fontSize: "12px" }} tickMargin={8} />
                          <YAxis stroke="#64748b" style={{ fontSize: "12px" }} tickMargin={8} width={48} />
                          <Tooltip
                            formatter={(value: number) => [formatEur(Number(value)), "Tips"]}
                            contentStyle={{
                              backgroundColor: "#ffffff",
                              border: "1px solid #E5E7EB",
                              borderRadius: "8px",
                              color: "#000000",
                            }}
                          />
                          <Bar dataKey="amount" fill="#197278" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Employee Performance */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="w-full rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)]">
                <CardHeader>
                  <CardTitle className="text-lg">Employee performance</CardTitle>
                  <CardDescription>Tip totals by team member</CardDescription>
                </CardHeader>
                <CardContent className="min-w-0 overflow-x-auto overflow-y-visible pb-2">
                  {(stats?.employeeCount ?? 0) === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">No employees yet</p>
                  ) : !hasTipActivityInPeriod ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">No tip activity yet</p>
                  ) : employeePerformance.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">No tip activity yet</p>
                  ) : (
                    <div className="flex h-[260px] w-full min-w-0 items-center justify-center sm:h-[290px]">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart
                          data={employeePerformance}
                          layout="vertical"
                          margin={{ top: 10, right: 16, left: 4, bottom: 8 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis type="number" stroke="#64748b" style={{ fontSize: "12px" }} tickMargin={8} />
                          <YAxis
                            dataKey="name"
                            type="category"
                            stroke="#64748b"
                            style={{ fontSize: "12px" }}
                            width={100}
                            tickMargin={6}
                          />
                          <Tooltip
                            formatter={(value: number) => [formatEur(Number(value)), "Tips"]}
                            contentStyle={{
                              backgroundColor: "#ffffff",
                              border: "1px solid #e5e5e5",
                              borderRadius: "8px",
                              color: "#000000",
                            }}
                          />
                          <Bar dataKey="tips" radius={[0, 8, 8, 0]}>
                            {employeePerformance.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Top Performers & Quick Actions */}
          <div className="w-full grid gap-6 lg:grid-cols-3">
            {/* Top Performers */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="lg:col-span-2"
            >
              <Card className="w-full rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-lg">Top performers</CardTitle>
                  <Link
                    to="/dashboard/staff-management"
                    className="flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
                  >
                    View all
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topEmployees.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">No employees yet</p>
                    ) : (
                      topEmployees.map((employee, index) => (
                        <div
                          key={employee.id}
                          className="flex flex-col gap-3 rounded-lg border border-[#E5E7EB] bg-white p-4 sm:flex-row sm:items-center sm:gap-4"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="relative">
                              <ProfileAvatar src={employee.avatar} displayName={employee.name} className="h-12 w-12" />
                              {index === 0 && (
                                <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                  <Award className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate font-semibold text-foreground">{employee.name}</h3>
                              <p className="truncate text-sm text-muted-foreground">{employee.role}</p>
                            </div>
                          </div>
                          <div className="shrink-0 text-left sm:text-right">
                            <p className="text-lg font-bold tabular-nums text-foreground">{formatEur(employee.tips)}</p>
                            <div className="flex items-center justify-end gap-1 text-sm">
                              {employee.rating != null ? (
                                <>
                                  <Star className="h-3 w-3 fill-primary text-primary" />
                                  <span className="text-muted-foreground">{employee.rating}</span>
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground">New member</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="space-y-4"
            >
              <Card className="w-full rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)]">
                <CardHeader>
                  <CardTitle className="text-lg">Quick actions</CardTitle>
                  <CardDescription>Common venue tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-3 shadow-[0_1px_8px_-4px_rgba(15,23,42,0.08)]" asChild>
                    <Link to="/dashboard/profile" className="gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                        <Building2 className="h-5 w-5 text-slate-600" />
                      </span>
                      Business profile
                    </Link>
                  </Button>
                  <Button
                    className="w-full justify-start gap-3 shadow-[0_4px_18px_-4px_rgb(124_45_18_/0.18)]"
                    asChild
                  >
                    <Link to="/business/qr-management" className="gap-3">
                      <QrCode className="h-5 w-5 shrink-0" />
                      Generate QR codes
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-3 shadow-[0_1px_8px_-4px_rgba(15,23,42,0.08)]" asChild>
                    <Link to="/dashboard/locations" className="gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                        <MapPin className="h-5 w-5 text-slate-600" />
                      </span>
                      Manage locations
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start gap-3 shadow-[0_1px_8px_-4px_rgba(15,23,42,0.08)]"
                    onClick={handleExport}
                    disabled={exportLoading || !isBusiness}
                    aria-busy={exportLoading}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                      {exportLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Download className="h-5 w-5 text-slate-600" />
                      )}
                    </span>
                    Export reports
                  </Button>
                </CardContent>
              </Card>

              <Card className="w-full rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)]">
                <CardHeader>
                  <CardTitle className="text-base">Need help?</CardTitle>
                  <CardDescription>
                    Learn how to maximize your team&apos;s earnings and keep guests tipping smoothly.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    type="button"
                    className="w-full shadow-[0_4px_16px_-4px_rgb(124_45_18_/0.12)]"
                    onClick={() => setGuidelinesOpen(true)}
                  >
                    View guidelines
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </TracingBeam>

      <CareTipUsageGuidelinesDialog open={guidelinesOpen} onOpenChange={setGuidelinesOpen} />
    </div>
  );
}
