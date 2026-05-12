import { motion } from "motion/react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { ElementType } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { translateChartWeekdayLabel } from "@/lib/chartAxisLabels";
import i18n from "@/i18n/i18n";
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
  ChevronDown,
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
import staffHeroImage from "../../../../images/for_staff.png";
import { cn } from "@/lib/utils";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const TOAST_OK = { style: { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } } as const;

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
  if (diffMins < 60) return i18n.t("employee.relative.minutesAgo", { count: diffMins });
  if (diffHours < 24) {
    return diffHours === 1
      ? i18n.t("employee.relative.hourAgo")
      : i18n.t("employee.relative.hoursAgo", { count: diffHours });
  }
  return diffDays === 1 ? i18n.t("employee.relative.dayAgo") : i18n.t("employee.relative.daysAgo", { count: diffDays });
}

export function EmployeeDashboard() {
  const { t, i18n } = useTranslation();
  const { user, authHydrated, sessionValidated, updateUser } = useRequireAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [timeframe, setTimeframe] = useState<"today" | "week" | "month">("today");
  const [tips, setTips] = useState<TipItem[]>([]);
  const [monthlyGoal, setMonthlyGoal] = useState<number | null>(null);
  const [currentMonthTotal, setCurrentMonthTotal] = useState(0);
  const [goalProgress, setGoalProgress] = useState<EmployeeGoalProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [businessTimezone, setBusinessTimezone] = useState<string | null>(null);
  const [periodTipCount, setPeriodTipCount] = useState(0);
  const [periodAmountEur, setPeriodAmountEur] = useState(0);
  const [chartSeries, setChartSeries] = useState<Array<{ label: string; amount: number }>>([]);
  const [periodLoading, setPeriodLoading] = useState(true);
  /** Matches `tips` / aggregates to the period that was last applied (avoids showing wrong period while a fetch is in flight). */
  const [dataTimeframe, setDataTimeframe] = useState<"today" | "week" | "month">("today");
  /** `undefined` = not loaded yet; `null` = no slug in DB */
  const [staffSlug, setStaffSlug] = useState<string | null | undefined>(undefined);
  /** Public venue slug from `/api/employees/me` for canonical tip URLs */
  const [employeeBusinessSlug, setEmployeeBusinessSlug] = useState<string | null | undefined>(undefined);
  /** Employee row id from `/api/employees/me` - must match QR `Employee.id`, not auth `User.id` */
  const [employeeRecordId, setEmployeeRecordId] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [generatingSlug, setGeneratingSlug] = useState(false);
  const [recentTipsExpanded, setRecentTipsExpanded] = useState(true);

  const timeframeRef = useRef(timeframe);
  timeframeRef.current = timeframe;
  const tipsFetchGen = useRef(0);

  const applyTipsPayload = useCallback(
    (data: Awaited<ReturnType<typeof getTipsByEmployee>>, requestedTf: typeof timeframe) => {
      setTips(data.tips ?? []);
      setMonthlyGoal(data.monthlyGoal ?? null);
      setCurrentMonthTotal(data.currentMonthTotal ?? 0);
      setGoalProgress(data.goal ?? null);
      const tz = (data as { businessTimezone?: string }).businessTimezone;
      setBusinessTimezone(tz ?? null);
      const tipsArr = data.tips ?? [];
      const nCount = data.periodTipCount;
      const nAmount = data.periodAmountEur;
      setPeriodTipCount(typeof nCount === "number" ? nCount : tipsArr.length);
      setPeriodAmountEur(
        typeof nAmount === "number" ? nAmount : tipsArr.reduce((s, t) => s + t.amount, 0),
      );
      setChartSeries(Array.isArray(data.chartSeries) ? data.chartSeries : []);
      setDataTimeframe(requestedTf);
    },
    [],
  );

  const fetchTipsForTimeframe = useCallback(
    async (tf: typeof timeframe, signal: AbortSignal, gen: number) => {
      const data = await getTipsByEmployee(tf, { signal });
      if (gen !== tipsFetchGen.current) return;
      applyTipsPayload(data, tf);
    },
    [applyTipsPayload],
  );

  const refreshTipsQuiet = useCallback(async () => {
    const role = user?.role;
    if (!authHydrated || !sessionValidated || role !== "employee") return;
    try {
      const data = await getTipsByEmployee(timeframeRef.current);
      applyTipsPayload(data, timeframeRef.current);
    } catch (e) {
      logClientError("EmployeeDashboard.refreshTipsQuiet", e);
    }
  }, [authHydrated, sessionValidated, applyTipsPayload, user?.role]);

  const socketReady = useDeferSocketConnect(sessionValidated && user?.role === "employee");
  const { socket, connected, connectionStatus } = useSocket(socketReady);

  useRealtimeFallback(connected, refreshTipsQuiet);

  useEffect(() => {
    if (!authHydrated || !sessionValidated || !user || user.role !== "employee") return;
    let cancelled = false;
    const loadProfile = async () => {
      try {
        const p = await getEmployeeProfile();
        if (cancelled) return;
        setStaffSlug(p.slug ?? null);
        setEmployeeBusinessSlug(p.businessSlug ?? null);
        setEmployeeRecordId(p.id);
        updateUser({ avatar: p.avatar ?? undefined, name: p.name });
      } catch {
        if (cancelled) return;
        setStaffSlug(null);
        setEmployeeBusinessSlug(null);
        setEmployeeRecordId(null);
      }
    };
    void loadProfile();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid re-running on timeframe; profile is independent
  }, [authHydrated, sessionValidated, user?.id, user?.role, updateUser]);

  useEffect(() => {
    if (!authHydrated || !sessionValidated || !user || user.role !== "employee") return;
    const controller = new AbortController();
    tipsFetchGen.current += 1;
    const gen = tipsFetchGen.current;
    setPeriodLoading(true);
    setError(null);

    void fetchTipsForTimeframe(timeframe, controller.signal, gen)
      .then(() => {
        if (gen !== tipsFetchGen.current) return;
      })
      .catch((e: unknown) => {
        if ((e as { name?: string })?.name === "AbortError") return;
        if (gen !== tipsFetchGen.current) return;
        logClientError("EmployeeDashboard.fetchTips", e);
        setError(toUserFriendlyMessage(e, { audience: "employee" }));
        setTips([]);
        setPeriodTipCount(0);
        setPeriodAmountEur(0);
        setChartSeries([]);
        setMonthlyGoal(null);
        setCurrentMonthTotal(0);
        setGoalProgress(null);
        setBusinessTimezone(null);
      })
      .finally(() => {
        if (gen !== tipsFetchGen.current) return;
        setPeriodLoading(false);
      });

    return () => controller.abort();
  }, [authHydrated, fetchTipsForTimeframe, sessionValidated, timeframe, user?.role, user?.id]);

  useEffect(() => {
    if (!socket || user?.role !== "employee" || !user.employeeId) return;

    const onNewTip = (payload: NewTipPayload) => {
      if (user.employeeId && payload.employeeId !== user.employeeId) return;

      setCurrentMonthTotal(payload.currentMonthTotal);
      setMonthlyGoal(payload.monthlyGoal);
      void refreshTipsQuiet();

      playChaChingSound();
      toast.success(t("employee.dashboard.toastNewTip"), TOAST_OK);
    };

    socket.on("new_tip", onNewTip);
    return () => {
      socket.off("new_tip", onNewTip);
    };
  }, [socket, user?.role, user?.employeeId, refreshTipsQuiet, t]);

  const totalAmount = periodAmountEur;
  const avgTipFromServer = periodTipCount > 0 ? totalAmount / periodTipCount : 0;
  const stats = {
    tips: periodTipCount,
    avgTip: avgTipFromServer,
    amount: totalAmount,
    rating: null,
  };

  const chartData = useMemo(() => {
    return chartSeries.map((p) => ({
      time: timeframe === "week" ? translateChartWeekdayLabel(p.label, t) : p.label,
      amount: p.amount,
    }));
  }, [chartSeries, timeframe, t, i18n.resolvedLanguage]);

  /** False while a fetch is in flight or responses have not caught up with the selected tab. */
  const valuesMatchSelectedPeriod = dataTimeframe === timeframe && !periodLoading;

  const recentTips = tips.slice(0, 6).map((tipRow) => ({
    id: tipRow.id,
    amount: tipRow.amount,
    customer: t("employee.dashboard.anonymous"),
    time: formatTimeAgo(tipRow.createdAt),
  }));

  const slugLoading = staffSlug === undefined;
  const hasSlug = Boolean(staffSlug);
  const qrEmployeeId = user?.employeeId ?? employeeRecordId ?? null;

  const handleQrQuickAction = useCallback(async () => {
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
          toast.success(t("employee.dashboard.toastLinkReady"));
        } else {
          toast.error(t("employee.dashboard.toastLinkFail"));
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
  }, [
    authHydrated,
    sessionValidated,
    slugLoading,
    generatingSlug,
    hasSlug,
    t,
  ]);

  useEffect(() => {
    if (!sessionValidated || user?.role !== "employee") return;
    const params = new URLSearchParams(location.search);
    if (params.get("qr") !== "1") return;
    void handleQrQuickAction();
    params.delete("qr");
    const next = params.toString();
    navigate(next ? `${location.pathname}?${next}` : location.pathname, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid URL-trigger loop
  }, [location.pathname, location.search, navigate, sessionValidated, user?.role, handleQrQuickAction]);

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
            {t("dashboard.tryAgain")}
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
      <div className="caretip-container pt-6">
        <DashboardHero
          stackHeroOnMobile
          hideTabs
          actionsPlacement="belowText"
          mobileAlign="center"
          badge={
            <>
              <Sparkles className="h-3.5 w-3.5 text-foreground" />
              {user.name
                ? t("employee.welcome_mina", { name: user.name.split(" ")[0] })
                : t("employee.hero.welcomeBack")}
            </>
          }
          title={t("employee.hero.headline")}
          description={t("employee.hero.sub")}
          image={
            <div className="relative isolate flex w-full flex-col items-center justify-center touch-manipulation max-lg:mx-auto max-lg:max-w-full lg:max-w-[95%]">
              <div className="relative mx-auto flex w-full min-w-0 max-w-full flex-col items-center justify-center lg:max-w-[520px]">
                <div
                  className={cn(
                    "relative mx-auto w-full max-w-full shrink-0 overflow-hidden bg-gray-100 ring-1 ring-black/[0.04]",
                    "max-lg:flex max-lg:min-h-[280px] max-lg:max-h-[min(56vh,380px)] max-lg:items-center max-lg:justify-center",
                    "rounded-[2.5rem] border border-black/[0.06] shadow-xl",
                    "lg:block lg:h-[360px] lg:max-h-[360px] lg:min-h-0 lg:border-gray-100 lg:shadow-xl",
                  )}
                >
                  <img
                    src={staffHeroImage}
                    alt=""
                    className={cn(
                      "object-contain object-center",
                      "max-lg:h-auto max-lg:w-auto max-lg:max-h-full max-lg:max-w-[min(100%,calc(100vw-2rem))] max-lg:px-2 max-lg:py-2",
                      "lg:h-full lg:w-full lg:px-4 lg:py-4",
                    )}
                    draggable={false}
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          }
          imageOverlay={false}
          actions={
            <>
              <Button
                type="button"
                onClick={() => void handleQrQuickAction()}
                disabled={slugLoading || generatingSlug}
                className="bg-primary hover:bg-primary/90"
              >
                {generatingSlug ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("employee.hero.generating")}
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4 shrink-0" />
                    {t("dashboard.qr_button")}
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/employee/tip-goals" className="gap-2">
                  <Target className="h-4 w-4 shrink-0" />
                  {t("employee.set_goal")}
                </Link>
              </Button>
            </>
          }
        />
      </div>

      <TracingBeam className="caretip-container pt-3 sm:pt-2">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <LiveConnectionBadge status={connectionStatus} />
          <div className="dashboard-inline-actions flex w-full max-w-full flex-wrap gap-2 rounded-lg border border-black/[0.06] bg-white p-1 shadow-sm sm:w-fit">
            {(["today", "week", "month"] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setTimeframe(period)}
                className={`min-h-11 flex flex-1 items-center justify-center gap-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors sm:flex-initial sm:px-4 sm:text-sm ${
                  timeframe === period
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className="shrink-0">
                  {period === "today" && t("employee.earnings_today")}
                  {period === "week" && t("employee.earnings_week")}
                  {period === "month" && t("employee.earnings_month")}
                </span>
                {period === timeframe && periodLoading ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin opacity-90" aria-hidden />
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6 pb-6 pt-2">
          <FixPrompt
            id="profilePhoto"
            issueActive={!user.avatar}
            dismissPersistence="local"
            title={t("employee.dashboard.fixPhotoTitle")}
            description={t("employee.dashboard.fixPhotoDesc")}
            actionLabel={t("employee.dashboard.fixPhotoAction")}
            actionTo="/employee/settings"
          />

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={cn("transition-opacity duration-200", !valuesMatchSelectedPeriod && "opacity-[0.92]")}
          >
            <div className="relative mb-2 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-4 lg:gap-6">
              {periodLoading ? (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-center rounded-xl bg-transparent"
                >
                  <div className="mx-auto flex items-center gap-2 rounded-full border border-border/60 bg-white/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    {t("employee.dashboard.overlayUpdating")}
                  </div>
                </div>
              ) : null}
              <StatCard
                title={t("employee.dashboard.statTotalTips")}
                value={valuesMatchSelectedPeriod ? String(stats.tips) : "—"}
                change={
                  periodLoading && !valuesMatchSelectedPeriod
                    ? t("employee.dashboard.statChangeUpdating")
                    : periodTipCount > 0 && valuesMatchSelectedPeriod
                      ? t("employee.dashboard.statChangeEarned", {
                          amount: formatEur(stats.amount),
                          count: periodTipCount,
                        })
                      : valuesMatchSelectedPeriod
                        ? t("employee.dashboard.statChangeNoTips")
                        : t("employee.dashboard.statChangeEllipsis")
                }
                icon={TrendingUp}
              />
              <StatCard
                title={stats.rating != null ? t("employee.dashboard.statAvgRating") : t("employee.dashboard.statRatings")}
                value={stats.rating != null ? String(stats.rating) : t("format.notAvailable")}
                change={stats.rating != null ? undefined : t("employee.dashboard.statNoRatings")}
                icon={Star}
              />
              <StatCard
                title={t("employee.dashboard.statMonthlyGoal")}
                value={goalPct != null ? `${Math.round(Number(goalPct))}%` : t("format.notAvailable")}
                change={
                  goalPct != null
                    ? t("employee.dashboard.statGoalProgress")
                    : t("employee.dashboard.statGoalSetHint")
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
                <CardTitle className="text-lg">{t("employee.dashboard.earningsTitle")}</CardTitle>
                <CardDescription>
                  {timeframe === "today" &&
                    t("employee.dashboard.earningsDescToday", {
                      tz: businessTimezone ? t("employee.dashboard.tzSuffix", { tz: businessTimezone }) : "",
                    })}
                  {timeframe === "week" &&
                    t("employee.dashboard.earningsDescWeek", {
                      tz: businessTimezone ? t("employee.dashboard.tzSuffix", { tz: businessTimezone }) : "",
                    })}
                  {timeframe === "month" &&
                    t("employee.dashboard.earningsDescMonth", {
                      tz: businessTimezone ? t("employee.dashboard.tzSuffix", { tz: businessTimezone }) : "",
                    })}
                </CardDescription>
              </CardHeader>
              <CardContent className="min-w-0 overflow-x-auto overflow-y-visible pb-2">
                {periodLoading || !valuesMatchSelectedPeriod ? (
                  <div className="flex h-[240px] w-full min-w-0 items-center justify-center sm:h-[280px]">
                    <Loader2
                      className="h-8 w-8 animate-spin text-muted-foreground"
                      aria-label={t("employee.dashboard.loadingChart")}
                    />
                  </div>
                ) : chartData.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    {t("employee.dashboard.noTipActivityChart")}
                  </p>
                ) : (
                  <div className="flex h-[240px] w-full min-w-0 items-center justify-center sm:h-[280px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart key={timeframe} data={chartData} margin={{ top: 10, right: 14, left: 4, bottom: 10 }}>
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
                        formatter={(value: number) => [formatEur(Number(value)), t("charts.tooltip.earnings")]}
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
                  <button
                    type="button"
                    onClick={() => setRecentTipsExpanded((v) => !v)}
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                    aria-expanded={recentTipsExpanded}
                  >
                    <CardTitle className="text-lg">{t("employee.dashboard.recentTips")}</CardTitle>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                        recentTipsExpanded && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>
                  <Link
                    to="/employee/notifications"
                    className="flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
                  >
                    {t("dashboard.viewAll")}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </CardHeader>
                {recentTipsExpanded ? (
                  <CardContent>
                    <div className="space-y-3">
                      {recentTips.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                          {t("employee.dashboard.noTipsYet")}
                        </p>
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
                ) : null}
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
                    <CardTitle className="text-lg">{t("employee.dashboard.quickActions")}</CardTitle>
                    <CardDescription>{t("employee.dashboard.quickActionsDesc")}</CardDescription>
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
                            ? t("employee.dashboard.qrTileLoading")
                            : generatingSlug
                              ? t("employee.dashboard.qrTileGenerating")
                              : hasSlug
                                ? t("employee.dashboard.qrTileMyQr")
                                : t("employee.dashboard.qrTileGenerate")}
                        </span>
                      </Button>
                      {hasSlug && !slugLoading ? (
                        <Button variant="outline" className="h-auto min-h-[100px] flex-col gap-2 py-4" asChild>
                          <a href={`/staff/${staffSlug}`} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-6 w-6" aria-hidden />
                            <span className="text-center text-xs font-semibold leading-tight">
                              {t("employee.dashboard.viewProfile")}
                            </span>
                          </a>
                        </Button>
                      ) : (
                        <Button variant="outline" className="h-auto min-h-[100px] flex-col gap-2 py-4" disabled>
                          <Eye className="h-6 w-6" aria-hidden />
                          <span className="text-center text-xs font-semibold leading-tight">
                            {slugLoading ? t("employee.dashboard.qrTileLoading") : t("employee.dashboard.viewProfile")}
                          </span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
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
          employeeName={user.name ?? t("employee.dashboard.modalStaffFallback")}
          businessSlug={employeeBusinessSlug ?? undefined}
          employeeSlug={typeof staffSlug === "string" ? staffSlug : undefined}
        />
      )}
    </div>
  );
}
