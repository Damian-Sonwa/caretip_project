import { motion } from "motion/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import type { ElementType } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import {
  TrendingUp,
  Star,
  Eye,
  QrCode,
  ArrowUpRight,
  Loader2,
  Sparkles,
  Settings,
  Target,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { devMockEmployeeEarningsTimeline, devMockEmployeeSummary } from "../../lib/devAnalyticsMocks";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { useSocket, useDeferSocketConnect } from "../../hooks/useSocket";
import { useRealtimeFallback } from "../../hooks/useRealtimeFallback";
import { LiveConnectionBadge } from "../../components/LiveConnectionBadge";
import { getTipsByEmployee, getEmployeeProfile, ensureEmployeeSlug } from "../../lib/api";
import { formatEur } from "../../lib/formatEur";
import type { TipItem, EmployeeGoalProgress } from "../../lib/api";
import { playChaChingSound } from "../../lib/tipSounds";
import { FixPrompt } from "../../components/FixPrompt";
import { EmployeeQRCodeModal } from "../../components/employee/EmployeeQRCodeModal";
import { RealTimeTipPulseGraphic } from "../../components/employee/RealTimeTipPulseGraphic";
import { cn } from "@/lib/utils";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeGoalCard } from "../../components/employee/EmployeeGoalCard";

const TOAST_OK = { style: { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } } as const;

const EMPLOYEE_HERO_HEADLINE = "Your earnings at a glance";
const EMPLOYEE_HERO_SUB = "Track tips by day, week, or month.";

function StatCard(props: {
  title: string;
  value: string;
  change?: string;
  icon: ElementType<{ className?: string }>;
  /** On viewports below `lg`, span full width of the 2-column stats grid (primary metric). */
  featured?: boolean;
}) {
  const Icon = props.icon;
  return (
    <Card
      className={cn(
        "flex min-h-32 flex-col rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-none",
        props.featured && "max-lg:col-span-2",
      )}
    >
      <div className="mb-2 shrink-0">
        <div className="inline-flex rounded-lg bg-orange-50 p-2">
          <Icon className="h-5 w-5 text-primary" aria-hidden />
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

interface NewTipPayload {
  tip: TipItem;
  employeeId: string;
  employeeName?: string;
  businessId: string;
  currentMonthTotal: number;
  monthlyGoal: number | null;
}

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

export function EmployeeDashboard() {
  const { user, authHydrated, sessionValidated, updateUser } = useRequireAuth();

  const [timeframe, setTimeframe] = useState<"today" | "week" | "month">("today");
  const [tips, setTips] = useState<TipItem[]>([]);
  const [monthlyGoal, setMonthlyGoal] = useState<number | null>(null);
  const [currentMonthTotal, setCurrentMonthTotal] = useState(0);
  const [goalProgress, setGoalProgress] = useState<EmployeeGoalProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** `undefined` = not loaded yet; `null` = no slug in DB */
  const [staffSlug, setStaffSlug] = useState<string | null | undefined>(undefined);
  /** Public venue slug from `/api/employees/me` for canonical tip URLs */
  const [employeeBusinessSlug, setEmployeeBusinessSlug] = useState<string | null | undefined>(undefined);
  /** Employee row id from `/api/employees/me` - must match QR `Employee.id`, not auth `User.id` */
  const [employeeRecordId, setEmployeeRecordId] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [generatingSlug, setGeneratingSlug] = useState(false);

  const refreshTipsQuiet = useCallback(async () => {
    const role = user?.role;
    if (!authHydrated || !sessionValidated || role !== "employee") return;
    try {
      const data = await getTipsByEmployee();
      setTips(data.tips ?? []);
      setMonthlyGoal(data.monthlyGoal ?? null);
      setCurrentMonthTotal(data.currentMonthTotal ?? 0);
      setGoalProgress(data.goal ?? null);
    } catch (e) {
      logClientError("EmployeeDashboard.refreshTipsQuiet", e);
    }
  }, [authHydrated, sessionValidated, user?.id, user?.role]);

  const socketReady = useDeferSocketConnect(sessionValidated && user?.role === "employee");
  const { socket, connected, connectionStatus } = useSocket(socketReady);

  useRealtimeFallback(connected, refreshTipsQuiet);

  useEffect(() => {
    if (!authHydrated || !sessionValidated || !user || user.role !== "employee") return;
    const load = async () => {
      setError(null);
      const [tipsResult, profileResult] = await Promise.allSettled([
        getTipsByEmployee(),
        getEmployeeProfile(),
      ]);

      if (tipsResult.status === "fulfilled") {
        const data = tipsResult.value;
        setTips(data.tips ?? []);
        setMonthlyGoal(data.monthlyGoal ?? null);
        setCurrentMonthTotal(data.currentMonthTotal ?? 0);
        setGoalProgress(data.goal ?? null);
      } else {
        const err = tipsResult.reason;
        setError(toUserFriendlyMessage(err, { audience: "employee" }));
        setTips([]);
        setMonthlyGoal(null);
        setCurrentMonthTotal(0);
        setGoalProgress(null);
      }

      if (profileResult.status === "fulfilled") {
        const p = profileResult.value;
        setStaffSlug(p.slug ?? null);
        setEmployeeBusinessSlug(p.businessSlug ?? null);
        setEmployeeRecordId(p.id);
        updateUser({ avatar: p.avatar ?? undefined, name: p.name });
      } else {
        setStaffSlug(null);
        setEmployeeBusinessSlug(null);
        setEmployeeRecordId(null);
      }
    };
    void load();
    // Use stable fields only: `user` object identity changes after `updateUser`, which would otherwise
    // retrigger this effect forever (loading blink).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see comment above
  }, [authHydrated, sessionValidated, user?.id, user?.role, updateUser]);

  useEffect(() => {
    if (!socket || user?.role !== "employee" || !user.employeeId) return;

    const onNewTip = (payload: NewTipPayload) => {
      if (user.employeeId && payload.employeeId !== user.employeeId) return;

      setTips((prev) => {
        const without = prev.filter((t) => t.id !== payload.tip.id);
        return [payload.tip, ...without];
      });
      setCurrentMonthTotal(payload.currentMonthTotal);
      setMonthlyGoal(payload.monthlyGoal);
      void refreshTipsQuiet();

      playChaChingSound();
      toast.success("You just received a tip!", TOAST_OK);
    };

    socket.on("new_tip", onNewTip);
    return () => {
      socket.off("new_tip", onNewTip);
    };
  }, [socket, user?.role, user?.employeeId, refreshTipsQuiet]);

  const filteredTips = tips.filter((t) => {
    const d = new Date(t.createdAt);
    const now = new Date();
    if (timeframe === "today")
      return d.toDateString() === now.toDateString();
    if (timeframe === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return d >= monthAgo;
  });

  const totalAmount = filteredTips.reduce((s, t) => s + t.amount, 0);
  const avgTip = filteredTips.length > 0 ? totalAmount / filteredTips.length : 0;
  // Dev-only: after initial hydration, show demo values when there are no real tips yet.
  const devDemo = import.meta.env.DEV && tips.length === 0 && staffSlug !== undefined && !error;
  const demoSummary = devDemo ? devMockEmployeeSummary(timeframe) : null;
  const stats = {
    amount: demoSummary ? demoSummary.amount : totalAmount,
    tips: demoSummary ? demoSummary.tips : filteredTips.length,
    avgTip: demoSummary ? demoSummary.avgTip : avgTip,
    rating: null,
  };

  const chartData = useMemo(() => {
    if (filteredTips.length === 0) {
      return import.meta.env.DEV && tips.length === 0 && staffSlug !== undefined && !error
        ? devMockEmployeeEarningsTimeline(timeframe)
        : [];
    }

    if (timeframe === "today") {
      const byHour = new Array(24).fill(0);
      for (const t of filteredTips) {
        const h = new Date(t.createdAt).getHours();
        byHour[h] += t.amount;
      }
      return byHour.map((amount, hour) => ({
        time: `${hour}:00`,
        amount,
      }));
    }

    if (timeframe === "week") {
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      const dayTotals = new Map<string, number>();
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dayTotals.set(d.toDateString(), 0);
      }
      for (const t of filteredTips) {
        const key = new Date(t.createdAt).toDateString();
        if (dayTotals.has(key)) {
          dayTotals.set(key, (dayTotals.get(key) ?? 0) + t.amount);
        }
      }
      return Array.from(dayTotals.entries()).map(([dateStr, amount]) => ({
        time: new Date(dateStr).toLocaleDateString(undefined, { weekday: "short" }),
        amount,
      }));
    }

    const base = new Date();
    base.setDate(base.getDate() - 29);
    base.setHours(0, 0, 0, 0);
    const buckets: { time: string; amount: number }[] = [];
    for (let w = 0; w < 5; w++) {
      const ws = new Date(base);
      ws.setDate(base.getDate() + w * 6);
      const we = new Date(ws);
      we.setDate(ws.getDate() + 5);
      we.setHours(23, 59, 59, 999);
      let sum = 0;
      for (const t of filteredTips) {
        const d = new Date(t.createdAt);
        if (d >= ws && d <= we) sum += t.amount;
      }
      buckets.push({
        time: `${ws.getMonth() + 1}/${ws.getDate()}`,
        amount: sum,
      });
    }
    return buckets;
  }, [error, filteredTips, staffSlug, timeframe, tips.length]);

  const recentTips = tips.slice(0, 6).map((t) => ({
    id: t.id,
    amount: t.amount,
    customer: "Anonymous",
    time: formatTimeAgo(t.createdAt)
  }));

  if (!user) return null;

  const slugLoading = staffSlug === undefined;
  const hasSlug = Boolean(staffSlug);
  const qrEmployeeId = user.employeeId ?? employeeRecordId ?? null;

  const handleQrQuickAction = async () => {
    if (!authHydrated || !sessionValidated) return;
    if (slugLoading || generatingSlug) return;
    if (!hasSlug) {
      setGeneratingSlug(true);
      try {
        const p = await ensureEmployeeSlug();
        const s = p.slug;
        setStaffSlug(s ?? null);
        setEmployeeBusinessSlug(p.businessSlug ?? null);
        if (s) {
          setQrModalOpen(true);
          toast.success("Your tip link is ready");
        } else {
          toast.error("Could not create your link. Try again.");
        }
      } catch (e) {
        logClientError("EmployeeDashboard", e);
        toast.error(toUserFriendlyMessage(e, { audience: "employee" }));
      } finally {
        setGeneratingSlug(false);
      }
      return;
    }
    setQrModalOpen(true);
  };

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

  const goalPct =
    goalProgress != null && goalProgress.goalAmount > 0
      ? goalProgress.percent
      : monthlyGoal != null && monthlyGoal > 0
        ? Math.min(100, Math.round((currentMonthTotal / monthlyGoal) * 100))
        : null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background pb-20">
      <div className="mx-auto max-w-7xl border-b border-border/50 px-6 pb-3 pt-3 sm:px-6 sm:pb-4 lg:px-8 lg:pt-4">
        <section
          className={cn(
            "grid grid-cols-1 gap-y-2.5 sm:gap-y-3",
            "lg:grid-cols-[minmax(0,1fr)_min(35%,clamp(234px,32vw,360px))] lg:gap-x-8 lg:gap-y-3 lg:items-start",
          )}
          aria-label="Dashboard overview"
        >
          <div className="flex min-w-0 flex-col gap-2 lg:col-start-1 lg:row-start-1">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted/80 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-foreground backdrop-blur-sm sm:px-3 sm:py-1 sm:text-xs">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-foreground" aria-hidden />
              {user.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Welcome back"}
            </div>
            <div className="space-y-1">
              <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground lg:text-3xl xl:text-4xl">
                {EMPLOYEE_HERO_HEADLINE}
              </h1>
              <p className="max-w-xl text-sm leading-snug text-muted-foreground">{EMPLOYEE_HERO_SUB}</p>
            </div>
          </div>

          <div
            className={cn(
              "flex w-full flex-col items-center justify-center lg:col-start-2 lg:row-start-2 lg:w-full lg:justify-self-stretch lg:self-center",
            )}
          >
            <div
              className={cn(
                "relative isolate aspect-square w-full max-h-[min(36vh,255px)] max-w-[min(238px,70vw)] touch-manipulation overflow-hidden rounded-2xl",
                "shadow-[0_20px_40px_-14px_rgba(0,0,0,0.42),0_0_0_1px_rgba(255,255,255,0.06),0_12px_40px_-12px_rgba(235,153,44,0.18)]",
                "ring-1 ring-white/5",
                "lg:max-h-[min(38vh,272px)] lg:max-w-full",
              )}
            >
              <RealTimeTipPulseGraphic embedded className="h-full w-full min-h-0" />
            </div>
            <p className="mt-1.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground/90 sm:text-[11px]">
              Live QR activity
            </p>
          </div>

          <div className="lg:col-start-1 lg:row-start-2 lg:min-w-0 lg:pr-2">
            <div className="rounded-xl border border-border/70 bg-muted/30 px-3.5 py-2.5 dark:bg-muted/15 sm:px-4 sm:py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                Total earnings (
                {timeframe === "today" ? "today" : timeframe === "week" ? "this week" : "this month"})
              </p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">
                {formatEur(stats.amount)}
              </p>
              {goalPct != null ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {Math.round(Number(goalPct))}% toward monthly goal
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:col-start-1 lg:row-start-3 lg:gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => void handleQrQuickAction()}
              disabled={slugLoading || generatingSlug}
              className="w-fit shrink-0 bg-primary px-3 hover:bg-primary/90 sm:px-4"
            >
              {generatingSlug ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  {hasSlug ? "My QR" : "Get QR"}
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" className="w-fit shrink-0 px-3 sm:px-4" asChild>
              <Link to="/employee/settings" className="gap-2">
                <Settings className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                Settings
              </Link>
            </Button>
          </div>
        </section>
      </div>

      <TracingBeam className="mx-auto max-w-7xl px-6 pt-2 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <LiveConnectionBadge status={connectionStatus} />
          <div className="dashboard-inline-actions flex w-full max-w-full flex-wrap gap-2 rounded-lg border border-black/[0.06] bg-white p-1 shadow-sm sm:w-fit">
            {(["today", "week", "month"] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setTimeframe(period)}
                className={`min-h-11 flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-all sm:flex-initial sm:px-4 sm:text-sm ${
                  timeframe === period
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {period === "today" && "Today"}
                {period === "week" && "This Week"}
                {period === "month" && "This Month"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6 pb-6 pt-2">
          <FixPrompt
            id="profilePhoto"
            issueActive={!user.avatar}
            dismissPersistence="local"
            title="Add a profile photo"
            description="Upload a photo so guests recognize you on your tip page."
            actionLabel="Upload photo"
            actionTo="/employee/settings"
          />

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div className="relative mb-2 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-4 lg:gap-6">
              <StatCard
                title="Total tips"
                value={String(stats.tips)}
                change={
                  filteredTips.length > 0
                    ? `${filteredTips.length} in the selected period`
                    : "No tips in this period yet."
                }
                icon={TrendingUp}
              />
              <StatCard
                title={stats.rating != null ? "Avg rating" : "Ratings"}
                value={stats.rating != null ? String(stats.rating) : "N/A"}
                change={stats.rating != null ? undefined : "No ratings yet"}
                icon={Star}
              />
              <StatCard
                title="Monthly goal"
                value={goalPct != null ? `${Math.round(Number(goalPct))}%` : "N/A"}
                change={
                  goalPct != null ? "Progress toward your current target." : "Set a goal in settings to track progress."
                }
                icon={Target}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="w-full rounded-2xl border border-gray-100 bg-white shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Earnings timeline</CardTitle>
                <CardDescription>
                  {timeframe === "today" && "Tips by hour today"}
                  {timeframe === "week" && "Tips by day (last 7 days)"}
                  {timeframe === "month" && "Tips by 6-day segment (last 30 days)"}
                </CardDescription>
              </CardHeader>
              <CardContent className="min-w-0 overflow-x-auto overflow-y-visible pb-2">
                {chartData.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">No tip activity yet</p>
                ) : (
                  <div className="flex h-[240px] w-full min-w-0 items-center justify-center sm:h-[280px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 14, left: 4, bottom: 10 }}>
                      <defs>
                        <linearGradient id="empColorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EB992C" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#EB992C" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="time" stroke="#404040" style={{ fontSize: "12px" }} tickMargin={8} />
                      <YAxis stroke="#404040" style={{ fontSize: "12px" }} tickMargin={8} width={48} />
                      <Tooltip
                        formatter={(value: number) => [formatEur(Number(value)), "Earnings"]}
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e5e5e5",
                          borderRadius: "8px",
                          color: "#000000",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#000000"
                        strokeWidth={2}
                        fill="url(#empColorAmount)"
                      />
                    </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <div className="w-full grid gap-6 lg:grid-cols-2">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="w-full rounded-2xl border border-gray-100 bg-white shadow-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-lg">Recent tips</CardTitle>
                  <Link
                    to="/employee/notifications"
                    className="flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
                  >
                    View all
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentTips.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">No tips yet</p>
                    ) : (
                      recentTips.map((tip) => (
                        <div
                          key={tip.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="break-words font-semibold tabular-nums text-foreground">{formatEur(tip.amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              {tip.customer} • {tip.time}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="space-y-4">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="w-full rounded-2xl border border-gray-100 bg-white shadow-none">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick actions</CardTitle>
                    <CardDescription>QR and public page</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        className="h-auto min-h-[100px] flex-col gap-2 py-4"
                        onClick={() => void handleQrQuickAction()}
                        disabled={slugLoading || generatingSlug}
                      >
                        {generatingSlug ? (
                          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
                        ) : (
                          <QrCode className="h-6 w-6" aria-hidden />
                        )}
                        <span className="text-center text-xs font-semibold leading-tight">
                          {slugLoading
                            ? "Loading…"
                            : generatingSlug
                              ? "Generating…"
                              : hasSlug
                                ? "My QR"
                                : "Generate QR"}
                        </span>
                      </Button>
                      {hasSlug && !slugLoading ? (
                        <Button variant="outline" className="h-auto min-h-[100px] flex-col gap-2 py-4" asChild>
                          <a href={`/staff/${staffSlug}`} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-6 w-6" aria-hidden />
                            <span className="text-center text-xs font-semibold leading-tight">View profile</span>
                          </a>
                        </Button>
                      ) : (
                        <Button variant="outline" className="h-auto min-h-[100px] flex-col gap-2 py-4" disabled>
                          <Eye className="h-6 w-6" aria-hidden />
                          <span className="text-center text-xs font-semibold leading-tight">
                            {slugLoading ? "Loading…" : "View profile"}
                          </span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <EmployeeGoalCard goal={goalProgress} onUpdated={refreshTipsQuiet} />
              </motion.div>
            </div>
          </div>
        </div>
      </TracingBeam>

      {qrEmployeeId && user.role === "employee" && (
        <EmployeeQRCodeModal
          open={qrModalOpen}
          onOpenChange={setQrModalOpen}
          employeeId={qrEmployeeId}
          employeeName={user.name ?? "Staff"}
          businessSlug={employeeBusinessSlug ?? undefined}
          employeeSlug={typeof staffSlug === "string" ? staffSlug : undefined}
        />
      )}
    </div>
  );
}
