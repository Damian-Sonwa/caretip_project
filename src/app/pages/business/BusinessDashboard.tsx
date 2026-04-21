import { motion } from "motion/react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router";
import {
  DollarSign,
  Users,
  TrendingUp,
  Award,
  Download,
  ArrowUpRight,
  QrCode,
  MapPin,
  Star,
  LogOut,
  Building2,
  LineChart,
  ArrowRight,
  Store,
  Target,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { useSocket, useDeferSocketConnect } from "../../hooks/useSocket";
import { useRealtimeFallback } from "../../hooks/useRealtimeFallback";
import { LiveConnectionBadge } from "../../components/LiveConnectionBadge";
import { downloadBusinessTransactionsExport, getBusinessStats } from "../../lib/api";
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
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  devMockBusinessEmployeePerformance,
  devMockBusinessTipDistribution,
} from "../../lib/devAnalyticsMocks";

import businessDashboardHeroImg from "../../../../images/newly01 (2).png";

const CHART_COLORS = ["#e9932f", "#000000", "#525252", "#a3a3a3", "#d4d4d4"];

const BUSINESS_HERO_HEADLINE = "Your Team's Performance at a Glance";
const BUSINESS_HERO_SUB =
  "From scan to success: track daily milestones, growth trends, and 5-star service in real time.";

const TOAST_OK = { style: { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } } as const;

const EXPORT_ERROR_TOAST = {
  style: { background: "#000000", color: "#ffffff" },
} as const;

const GOAL_PERIOD_LABEL: Record<GoalPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

function goalStatusLabel(s: EmployeeGoalProgressStatus): string {
  if (s === "achieved") return "Achieved";
  if (s === "on_track") return "On track";
  return "Below target";
}

function goalStatusClass(s: EmployeeGoalProgressStatus): string {
  if (s === "achieved") return "text-emerald-600";
  if (s === "on_track") return "text-primary";
  return "text-amber-700";
}

export function BusinessDashboard() {
  const { user, logout, isBusiness, exitImpersonation } = useRequireAuth();

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
  const [error, setError] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user?.businessId) {
      setStatsLoading(false);
      return;
    }
    setStatsLoading(true);
    setError(null);
    setPendingVerification(false);
    try {
      const data = await getBusinessStats(timeframe);
      setStats(data);
    } catch (err) {
      const msg = toUserFriendlyMessage(err);
      if (msg.toLowerCase().includes("pending verification")) {
        // Expected state: backend blocks manager stats until KYC verification completes.
        setPendingVerification(true);
        setError(null);
        setStats(null);
      } else {
        logClientError("BusinessDashboard.fetchStats", err);
        setError(msg);
        setStats(null);
      }
    } finally {
      setStatsLoading(false);
    }
  }, [user?.businessId, timeframe]);

  const refreshStatsQuiet = useCallback(async () => {
    if (!user?.businessId) return;
    try {
      const data = await getBusinessStats(timeframe);
      setStats(data);
    } catch (err) {
      logClientError("BusinessDashboard.refreshStatsQuiet", err);
      /* keep existing stats on background refresh failure */
    }
  }, [user?.businessId, timeframe]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const socketReady = useDeferSocketConnect(user?.role === "business");
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
        `New tip: ${who} · $${Number(payload.tip.amount).toFixed(2)} · ${timeStr}`,
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
      return devMockBusinessEmployeePerformance(CHART_COLORS);
    }
    const list = [...(stats?.employees ?? [])].sort((a, b) => b.tipsTotal - a.tipsTotal);
    return list.map((e, i) => ({
      name:
        e.name.split(" ").length > 1
          ? `${e.name.split(" ")[0]} ${e.name.split(" ")[1]?.[0] ?? ""}.`
          : e.name,
      tips: e.tipsTotal,
      rating: e.rating ?? 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
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
    <div className="min-h-screen overflow-x-hidden bg-background">
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

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        {pendingVerification && (
          <div className="mb-5 rounded-xl border-2 border-primary/30 bg-muted/40 p-4 text-sm">
            <p className="font-semibold text-foreground">Account pending verification</p>
            <p className="mt-1 text-muted-foreground">
              Your venue dashboard stats will appear once verification is approved.
            </p>
          </div>
        )}
        <DashboardHero
          badge={
            <>
              <Store className="h-3.5 w-3.5 text-foreground" />
              {statsLoading && !stats?.name?.trim() ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden />
                  <span className="text-muted-foreground">Loading…</span>
                </span>
              ) : stats?.name?.trim() ? (
                stats.name
              ) : (
                "Venue dashboard"
              )}
            </>
          }
          title={BUSINESS_HERO_HEADLINE}
          description={BUSINESS_HERO_SUB}
          imageSrc={businessDashboardHeroImg}
          imageCaption="From QR scans to trophies: see how your team performs at every step."
          overview={
            <div className="space-y-3 text-sm text-foreground/80">
              <p>Monitor team performance, track tip activity, and manage your venue operations in real time.</p>
            </div>
          }
          shortcuts={
            <>
              <Link
                to="/dashboard/staff-management"
                className="flex items-center justify-between rounded-lg px-2 py-2 font-medium text-foreground hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Manage staff
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/business/qr-management"
                className="flex items-center justify-between rounded-lg px-2 py-2 font-medium text-foreground hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR management
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/dashboard/locations"
                className="flex items-center justify-between rounded-lg px-2 py-2 font-medium text-foreground hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Locations
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/dashboard/tables"
                className="flex items-center justify-between rounded-lg px-2 py-2 font-medium text-foreground hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <LineChart className="h-4 w-4" />
                  Tables
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          }
          actions={
            <>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link to="/dashboard/staff-management">
                  Manage staff
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleExport}
                disabled={exportLoading || !isBusiness}
                aria-busy={exportLoading}
              >
                {exportLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Exporting…
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </>
                )}
              </Button>
              <Button variant="outline" type="button" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </>
          }
        />
      </div>

      <TracingBeam className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="space-y-6 py-6">
          {brokenQrLinks && (
            <div className="flex flex-col gap-3 rounded-xl border-2 border-primary bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Some staff are missing QR links</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Open QR Management to generate fresh links and printable codes.
                </p>
              </div>
              <Button asChild className="shrink-0">
                <Link to="/business/qr-management">Fix QR links</Link>
              </Button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <LiveConnectionBadge status={connectionStatus} />
          <div className="flex w-full max-w-full flex-wrap gap-2 rounded-lg border-2 border-border bg-card p-1 sm:w-fit">
            {(["week", "month", "year"] as const).map((period) => (
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
                {period === "week" && "This Week"}
                {period === "month" && "This Month"}
                {period === "year" && "This Year"}
              </button>
            ))}
          </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative md:col-span-2 lg:col-span-2"
            >
              <Card className="relative h-full overflow-hidden border-2 border-border bg-primary text-primary-foreground shadow-sm">
                <BorderBeam size={240} duration={17} colorFrom="#000000" colorTo="#e9932f" />
                <CardHeader>
                  <div className="mb-2 flex items-start justify-between">
                    <div className="rounded-lg border border-black/10 bg-black/10 p-3">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-black/10 px-2 py-1 text-xs font-medium">
                      {timeframe === "week"
                        ? "Week"
                        : timeframe === "month"
                          ? "Month"
                          : "Year"}
                    </span>
                  </div>
                  <CardTitle className="text-3xl font-bold tabular-nums text-primary-foreground">
                    ${(stats?.totalTips ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </CardTitle>
                  <CardDescription className="text-primary-foreground/80">
                    Total tips ({timeframe === "week" ? "this week" : timeframe === "month" ? "this month" : "this year"} view)
                  </CardDescription>
                  {(stats?.totalTips ?? 0) > 0 && (
                    <div className="mt-3 flex items-center gap-1 text-sm">
                      <TrendingUp className="h-4 w-4" />
                      <span>Keep QR links fresh so guests can tip easily.</span>
                    </div>
                  )}
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full border-2 border-border shadow-sm">
                <CardHeader>
                  <div className="mb-2 w-fit rounded-lg border border-border bg-muted p-3">
                    <Users className="h-6 w-6 text-foreground" />
                  </div>
                  <CardTitle className="text-3xl font-bold tabular-nums">
                    {stats?.employeeCount ?? 0}
                  </CardTitle>
                  <CardDescription>Active employees</CardDescription>
                  {topEmployees.length > 0 && (
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {topEmployees.length} in top list
                    </p>
                  )}
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full border-2 border-border shadow-sm">
                <CardHeader>
                  <div className="mb-2 w-fit rounded-lg border border-border bg-muted p-3">
                    <Star className="h-6 w-6 text-foreground" />
                  </div>
                  <CardTitle className="text-3xl font-bold tabular-nums">
                    {topEmployees.length > 0
                      ? (() => {
                          const withRatings = topEmployees.filter((e) => e.rating != null);
                          return withRatings.length > 0
                            ? (
                                withRatings.reduce((s, e) => s + (e.rating ?? 0), 0) /
                                withRatings.length
                              ).toFixed(1)
                            : "—";
                        })()
                      : "0"}
                  </CardTitle>
                  <CardDescription>Average rating</CardDescription>
                  <p className="mt-2 text-sm text-muted-foreground">{stats?.tipCount ?? 0} tips</p>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="md:col-span-2 lg:col-span-1"
            >
              <Card className="h-full border-2 border-border shadow-sm">
                <CardHeader>
                  <div className="mb-2 w-fit rounded-lg border border-border bg-muted p-3">
                    <TrendingUp className="h-6 w-6 text-foreground" />
                  </div>
                  <CardTitle className="text-3xl font-bold tabular-nums">
                    $
                    {stats?.employeeCount && stats?.totalTips
                      ? (stats.totalTips / stats.employeeCount).toFixed(0)
                      : "0"}
                  </CardTitle>
                  <CardDescription>Avg tip per employee</CardDescription>
                  <p className="mt-2 text-sm text-muted-foreground">Coaching metric</p>
                </CardHeader>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="border-2 border-border shadow-sm">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg border border-border bg-muted p-2">
                    <Target className="h-5 w-5 text-foreground" />
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
                          <td className="py-3 pr-3 tabular-nums">
                            ${g.goalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 pr-3 tabular-nums">
                            ${g.currentAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
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
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Tip Distribution Chart */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-2 border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Daily tip distribution</CardTitle>
                <CardDescription>
                  {timeframe === "week" && "Tips per day (Mon–Sun, current week)"}
                  {timeframe === "month" && "Tips per day (current month)"}
                  {timeframe === "year" && "Tips per month (current year)"}
                </CardDescription>
              </CardHeader>
              <CardContent className="min-w-0 overflow-x-auto">
                {!hasTipActivityInPeriod || tipDistributionData.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">No tip activity yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250} minWidth={0}>
                    <BarChart data={tipDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="day" stroke="#404040" style={{ fontSize: "12px" }} />
                      <YAxis stroke="#404040" style={{ fontSize: "12px" }} />
                      <Tooltip
                        formatter={(value: number) => [`$${Number(value).toFixed(2)}`, "Tips"]}
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e5e5e5",
                          borderRadius: "8px",
                          color: "#000000",
                        }}
                      />
                      <Bar dataKey="amount" fill="#e9932f" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
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
            <Card className="border-2 border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Employee performance</CardTitle>
                <CardDescription>Tip totals by team member</CardDescription>
              </CardHeader>
              <CardContent className="min-w-0 overflow-x-auto">
                {(stats?.employeeCount ?? 0) === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">No employees yet</p>
                ) : !hasTipActivityInPeriod ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">No tip activity yet</p>
                ) : employeePerformance.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">No tip activity yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250} minWidth={0}>
                    <BarChart data={employeePerformance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis type="number" stroke="#404040" style={{ fontSize: "12px" }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#404040"
                        style={{ fontSize: "12px" }}
                        width={80}
                      />
                      <Tooltip
                        formatter={(value: number) => [`$${Number(value).toFixed(2)}`, "Tips"]}
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
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Top Performers & Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Top Performers */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2"
          >
            <Card className="border-2 border-border shadow-sm">
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
                <p className="text-sm text-muted-foreground py-6 text-center">No employees yet</p>
              ) : (
                topEmployees.map((employee, index) => (
                  <div
                    key={employee.id}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="relative">
                        <ProfileAvatar
                          src={employee.avatar}
                          displayName={employee.name}
                          className="h-12 w-12"
                        />
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
                      <p className="text-lg font-bold tabular-nums text-foreground">
                        ${employee.tips.toLocaleString()}
                      </p>
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
            <Card className="border-2 border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick actions</CardTitle>
                <CardDescription>Common venue tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start gap-3" asChild>
                  <Link to="/business/qr-management">
                    <QrCode className="h-5 w-5 shrink-0" />
                    Generate QR codes
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3" asChild>
                  <Link to="/dashboard/locations">
                    <MapPin className="h-5 w-5 shrink-0" />
                    Manage locations
                  </Link>
                </Button>
                <Button
                  type="button"
                  className="w-full justify-start gap-3"
                  onClick={handleExport}
                  disabled={exportLoading || !isBusiness}
                  aria-busy={exportLoading}
                >
                  {exportLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Download className="h-5 w-5 shrink-0" />
                  )}
                  Export reports
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/30 bg-muted/30 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Need help?</CardTitle>
                <CardDescription>
                  Learn how to maximize your team&apos;s earnings and keep guests tipping smoothly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button type="button" className="w-full" onClick={() => setGuidelinesOpen(true)}>
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
