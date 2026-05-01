import { motion } from "motion/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import type { ElementType } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import {
  DollarSign,
  TrendingUp,
  Star,
  Eye,
  QrCode,
  ArrowUpRight,
  Loader2,
  Sparkles,
  Settings,
  Bell,
  ArrowRight,
  ExternalLink,
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
import type { TipItem, EmployeeGoalProgress } from "../../lib/api";
import { playChaChingSound } from "../../lib/tipSounds";
import { EmployeeHeader } from "../../components/employee/EmployeeHeader";
import { EmployeeQRCodeModal } from "../../components/employee/EmployeeQRCodeModal";
import { RealTimeTipPulseGraphic } from "../../components/employee/RealTimeTipPulseGraphic";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dashPanel } from "@/components/ui/dashboard-styles";
import { EmployeeGoalCard } from "../../components/employee/EmployeeGoalCard";

const TOAST_OK = { style: { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } } as const;

const EMPLOYEE_HERO_HEADLINE = "Your Excellence, Rewarded.";
const EMPLOYEE_HERO_SUB =
  "Every smile is an opportunity. Your next milestone is just one scan away. Let's make today your best shift yet.";

function StatCard(props: {
  title: string;
  value: string;
  change?: string;
  icon: ElementType<{ className?: string }>;
  beam?: boolean;
  valueSize?: "default" | "lg";
  pulse?: boolean;
}) {
  const Icon = props.icon;
  const valueClass =
    props.valueSize === "lg"
      ? "text-4xl font-bold tabular-nums text-foreground sm:text-5xl"
      : "text-2xl font-bold tabular-nums text-foreground sm:text-3xl";
  return (
    <Card className="relative h-full overflow-hidden border-2 border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      {props.beam ? <BorderBeam size={220} duration={18} colorFrom="#e9932f" colorTo="#000000" /> : null}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-lg border border-border bg-muted p-2">
            <Icon className="h-5 w-5 text-foreground" />
          </div>
        </div>
        <CardDescription className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {props.title}
        </CardDescription>
        <motion.div
          animate={props.pulse ? { scale: [1, 1.06, 1] } : { scale: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          <CardTitle className={`${valueClass} ${props.pulse ? "text-primary" : ""}`}>{props.value}</CardTitle>
        </motion.div>
        {props.change ? <p className="text-sm leading-snug text-muted-foreground">{props.change}</p> : null}
      </CardHeader>
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
  const { user, logout, updateUser } = useRequireAuth();

  const handleLogout = () => {
    logout();
  };

  const [timeframe, setTimeframe] = useState<"today" | "week" | "month">("today");
  const [tips, setTips] = useState<TipItem[]>([]);
  const [monthlyGoal, setMonthlyGoal] = useState<number | null>(null);
  const [currentMonthTotal, setCurrentMonthTotal] = useState(0);
  const [goalProgress, setGoalProgress] = useState<EmployeeGoalProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pulseEarnings, setPulseEarnings] = useState(false);
  /** `undefined` = not loaded yet; `null` = no slug in DB */
  const [staffSlug, setStaffSlug] = useState<string | null | undefined>(undefined);
  /** Employee row id from `/api/employees/me` - must match QR `Employee.id`, not auth `User.id` */
  const [employeeRecordId, setEmployeeRecordId] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [generatingSlug, setGeneratingSlug] = useState(false);

  const refreshTipsQuiet = useCallback(async () => {
    if (!user || user.role !== "employee") return;
    try {
      const data = await getTipsByEmployee();
      setTips(data.tips ?? []);
      setMonthlyGoal(data.monthlyGoal ?? null);
      setCurrentMonthTotal(data.currentMonthTotal ?? 0);
      setGoalProgress(data.goal ?? null);
    } catch (e) {
      logClientError("EmployeeDashboard.refreshTipsQuiet", e);
    }
  }, [user?.id, user?.role]);

  const socketReady = useDeferSocketConnect(user?.role === "employee");
  const { socket, connected, connectionStatus } = useSocket(socketReady);

  useRealtimeFallback(connected, refreshTipsQuiet);

  useEffect(() => {
    if (!user || user.role !== "employee") return;
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
        setError(toUserFriendlyMessage(err));
        setTips([]);
        setMonthlyGoal(null);
        setCurrentMonthTotal(0);
        setGoalProgress(null);
      }

      if (profileResult.status === "fulfilled") {
        const p = profileResult.value;
        setStaffSlug(p.slug ?? null);
        setEmployeeRecordId(p.id);
        updateUser({ avatar: p.avatar ?? undefined, name: p.name });
      } else {
        setStaffSlug(null);
        setEmployeeRecordId(null);
      }
    };
    void load();
    // Use stable fields only: `user` object identity changes after `updateUser`, which would otherwise
    // retrigger this effect forever (loading blink).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see comment above
  }, [user?.id, user?.role, updateUser]);

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
      setPulseEarnings(true);
      window.setTimeout(() => setPulseEarnings(false), 1500);
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
    if (slugLoading || generatingSlug) return;
    if (!hasSlug) {
      setGeneratingSlug(true);
      try {
        const p = await ensureEmployeeSlug();
        const s = p.slug;
        setStaffSlug(s ?? null);
        if (s) {
          setQrModalOpen(true);
          toast.success("Your tip link is ready");
        } else {
          toast.error("Could not create your link. Try again.");
        }
      } catch (e) {
        logClientError("EmployeeDashboard", e);
        toast.error(toUserFriendlyMessage(e));
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
      <EmployeeHeader user={user} onLogout={handleLogout} />

      <div className="mx-auto max-w-7xl px-4 pt-6">
        <DashboardHero
          badge={
            <>
              <Sparkles className="h-3.5 w-3.5 text-foreground" />
              Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
            </>
          }
          title={EMPLOYEE_HERO_HEADLINE}
          description={EMPLOYEE_HERO_SUB}
          image={<RealTimeTipPulseGraphic />}
          imageCaption="Profile and guest tips stay in sync with your QR."
          overview={
            <div className="space-y-3 text-sm text-foreground/80">
              <p>Track your earnings, tips, and progress toward your monthly goal. Every scan counts!</p>
            </div>
          }
          shortcuts={
            <>
              <Link
                to="/employee/settings"
                className="flex items-center justify-between rounded-lg px-2 py-2 font-medium text-foreground hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Profile &amp; settings
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/employee/notifications"
                className="flex items-center justify-between rounded-lg px-2 py-2 font-medium text-foreground hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              {hasSlug && staffSlug ? (
                <a
                  href={`/staff/${staffSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg px-2 py-2 font-medium text-foreground hover:bg-muted"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Public tip page
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : null}
            </>
          }
          actions={
            <>
              <Button type="button" onClick={() => void handleQrQuickAction()} disabled={slugLoading || generatingSlug} className="bg-primary hover:bg-primary/90">
                {generatingSlug ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    {hasSlug ? "My QR code" : "Generate my QR"}
                  </>
                )}
              </Button>
              <Button variant="outline" asChild>
                <Link to="/employee/settings">Settings</Link>
              </Button>
            </>
          }
        />
      </div>

      <TracingBeam className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-center gap-3">
          <LiveConnectionBadge status={connectionStatus} />
          <div className="flex w-full max-w-full flex-wrap gap-2 rounded-lg border border-black/[0.06] bg-white p-1 shadow-sm sm:w-fit">
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

        <div className="space-y-6 pb-6 pt-6">
          {!user.avatar && (
            <div className="flex flex-col gap-3 rounded-xl border border-black/[0.06] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">Action required</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload a photo so guests recognize you on your tip page.
                </p>
              </div>
              <Button asChild className="shrink-0">
                <Link to="/employee/settings">Upload photo</Link>
              </Button>
            </div>
          )}

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div className="relative mb-2 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title={`Total earnings (${timeframe === "today" ? "today" : timeframe === "week" ? "week" : "month"})`}
                value={`$${stats.amount.toFixed(2)}`}
                change={
                  filteredTips.length > 0
                    ? `${filteredTips.length} tip${filteredTips.length === 1 ? "" : "s"} in this period`
                    : "No activity yet for this period."
                }
                icon={DollarSign}
                beam
                valueSize="lg"
                pulse={pulseEarnings}
              />
              <StatCard title="Total tips" value={String(stats.tips)} icon={TrendingUp} />
              <StatCard
                title={stats.rating != null ? "Avg rating" : "Ratings"}
                value={stats.rating != null ? String(stats.rating) : "N/A"}
                change={stats.rating != null ? undefined : "No ratings yet"}
                icon={Star}
              />
              <StatCard
                title="Monthly goal"
                value={goalPct != null ? `${goalPct}%` : "N/A"}
                change={goalPct != null ? "Progress toward your current target" : "Set a goal in settings to track progress."}
                icon={Target}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className={dashPanel("shadow-sm")}>
              <CardHeader>
                <CardTitle className="text-lg">Earnings timeline</CardTitle>
                <CardDescription>
                  {timeframe === "today" && "Tips by hour today"}
                  {timeframe === "week" && "Tips by day (last 7 days)"}
                  {timeframe === "month" && "Tips by 6-day segment (last 30 days)"}
                </CardDescription>
              </CardHeader>
              <CardContent className="min-w-0 overflow-x-auto">
                {chartData.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">No tip activity yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200} minWidth={0}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="empColorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EB992C" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#EB992C" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="time" stroke="#404040" style={{ fontSize: "12px" }} />
                      <YAxis stroke="#404040" style={{ fontSize: "12px" }} />
                      <Tooltip
                        formatter={(value: number) => [`$${Number(value).toFixed(2)}`, "Earnings"]}
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
                )}
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Card className={dashPanel("shadow-sm")}>
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
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">${tip.amount.toFixed(2)}</p>
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
                <Card className={dashPanel("shadow-sm")}>
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
        />
      )}
    </div>
  );
}
