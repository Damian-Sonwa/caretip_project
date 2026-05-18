import { motion } from "motion/react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { ImgHTMLAttributes } from "react";
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
import { recordNewEmployeeTip } from "../../lib/employeeNotificationStore";
import employeeHeroImage from "../../../../images/ICT_employee.png";
import { cn } from "@/lib/utils";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeStatCard } from "../../components/employee/EmployeeStatCard";
import { EmployeeEmptyState } from "../../components/employee/EmployeeEmptyState";
import { employeeUi } from "../../components/employee/employeeDashboardUi";
import {
  devMockEmployeeAccountSummary,
  devMockEmployeeChartSeries,
  devMockEmployeeGoalBundle,
  devMockEmployeeRating,
  devMockEmployeeRecentTips,
  devMockEmployeeSummary,
  shouldUseEmployeeDashboardDevDemo,
} from "../../lib/devAnalyticsMocks";

const TOAST_OK = { style: { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } } as const;

type AnalyticsTimeframe = "today" | "week" | "month";

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

  /** Body analytics only — does not affect hero account summary. */
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<AnalyticsTimeframe>("today");
  const [tips, setTips] = useState<TipItem[]>([]);
  const [monthlyGoal, setMonthlyGoal] = useState<number | null>(null);
  const [currentMonthTotal, setCurrentMonthTotal] = useState(0);
  const [goalProgress, setGoalProgress] = useState<EmployeeGoalProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [businessTimezone, setBusinessTimezone] = useState<string | null>(null);
  const [periodTipCount, setPeriodTipCount] = useState(0);
  const [periodAmountEur, setPeriodAmountEur] = useState(0);
  const [chartSeries, setChartSeries] = useState<Array<{ label: string; amount: number }>>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  /** Matches analytics payload to the selected body period tab. */
  const [dataAnalyticsTimeframe, setDataAnalyticsTimeframe] = useState<AnalyticsTimeframe>("today");
  const [accountSummaryLoading, setAccountSummaryLoading] = useState(true);
  /** `undefined` = not loaded yet; `null` = no slug in DB */
  const [staffSlug, setStaffSlug] = useState<string | null | undefined>(undefined);
  /** Public venue slug from `/api/employees/me` for canonical tip URLs */
  const [employeeBusinessSlug, setEmployeeBusinessSlug] = useState<string | null | undefined>(undefined);
  /** Employee row id from `/api/employees/me` - must match QR `Employee.id`, not auth `User.id` */
  const [employeeRecordId, setEmployeeRecordId] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [generatingSlug, setGeneratingSlug] = useState(false);
  const [recentTipsExpanded, setRecentTipsExpanded] = useState(true);
  const [accountSummary, setAccountSummary] = useState({
    totalEarningsEur: 0,
    availableBalanceEur: 0,
    totalSupporters: 0,
    loaded: false,
  });

  const analyticsTimeframeRef = useRef(analyticsTimeframe);
  analyticsTimeframeRef.current = analyticsTimeframe;
  const analyticsFetchGen = useRef(0);
  const accountSummaryFetchGen = useRef(0);

  const applyAccountSummary = useCallback((data: Awaited<ReturnType<typeof getTipsByEmployee>>) => {
    setAccountSummary({
      totalEarningsEur: typeof data.totalEarningsEur === "number" ? data.totalEarningsEur : 0,
      availableBalanceEur: typeof data.availableBalanceEur === "number" ? data.availableBalanceEur : 0,
      totalSupporters: typeof data.totalSupporters === "number" ? data.totalSupporters : 0,
      loaded: true,
    });
  }, []);

  const applyAnalyticsPayload = useCallback(
    (data: Awaited<ReturnType<typeof getTipsByEmployee>>, requestedTf: AnalyticsTimeframe) => {
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
      setDataAnalyticsTimeframe(requestedTf);
    },
    [],
  );

  const fetchAccountSummary = useCallback(
    async (signal: AbortSignal, gen: number) => {
      const data = await getTipsByEmployee(undefined, { signal });
      if (gen !== accountSummaryFetchGen.current) return;
      applyAccountSummary(data);
    },
    [applyAccountSummary],
  );

  const fetchAnalyticsForTimeframe = useCallback(
    async (tf: AnalyticsTimeframe, signal: AbortSignal, gen: number) => {
      const data = await getTipsByEmployee(tf, { signal });
      if (gen !== analyticsFetchGen.current) return;
      applyAnalyticsPayload(data, tf);
    },
    [applyAnalyticsPayload],
  );

  const refreshDashboardQuiet = useCallback(async () => {
    const role = user?.role;
    if (!authHydrated || !sessionValidated || role !== "employee") return;
    try {
      const [summaryData, analyticsData] = await Promise.all([
        getTipsByEmployee(undefined),
        getTipsByEmployee(analyticsTimeframeRef.current),
      ]);
      applyAccountSummary(summaryData);
      applyAnalyticsPayload(analyticsData, analyticsTimeframeRef.current);
    } catch (e) {
      logClientError("EmployeeDashboard.refreshDashboardQuiet", e);
    }
  }, [authHydrated, sessionValidated, applyAccountSummary, applyAnalyticsPayload, user?.role]);

  const socketReady = useDeferSocketConnect(sessionValidated && user?.role === "employee");
  const { socket, connected, connectionStatus } = useSocket(socketReady);

  useRealtimeFallback(connected, refreshDashboardQuiet);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- profile load is independent of analytics period
  }, [authHydrated, sessionValidated, user?.id, user?.role, updateUser]);

  useEffect(() => {
    if (!authHydrated || !sessionValidated || !user || user.role !== "employee") return;
    const controller = new AbortController();
    accountSummaryFetchGen.current += 1;
    const gen = accountSummaryFetchGen.current;
    setAccountSummaryLoading(true);

    void fetchAccountSummary(controller.signal, gen)
      .catch((e: unknown) => {
        if ((e as { name?: string })?.name === "AbortError") return;
        if (gen !== accountSummaryFetchGen.current) return;
        logClientError("EmployeeDashboard.fetchAccountSummary", e);
      })
      .finally(() => {
        if (gen !== accountSummaryFetchGen.current) return;
        setAccountSummaryLoading(false);
      });

    return () => controller.abort();
  }, [authHydrated, fetchAccountSummary, sessionValidated, user?.role, user?.id]);

  useEffect(() => {
    if (!authHydrated || !sessionValidated || !user || user.role !== "employee") return;
    const controller = new AbortController();
    analyticsFetchGen.current += 1;
    const gen = analyticsFetchGen.current;
    setAnalyticsLoading(true);
    setError(null);

    void fetchAnalyticsForTimeframe(analyticsTimeframe, controller.signal, gen)
      .catch((e: unknown) => {
        if ((e as { name?: string })?.name === "AbortError") return;
        if (gen !== analyticsFetchGen.current) return;
        logClientError("EmployeeDashboard.fetchAnalytics", e);
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
        if (gen !== analyticsFetchGen.current) return;
        setAnalyticsLoading(false);
      });

    return () => controller.abort();
  }, [authHydrated, fetchAnalyticsForTimeframe, sessionValidated, analyticsTimeframe, user?.role, user?.id]);

  useEffect(() => {
    if (!socket || user?.role !== "employee" || !user.employeeId) return;

    const onNewTip = (payload: NewTipPayload) => {
      if (user.employeeId && payload.employeeId !== user.employeeId) return;

      recordNewEmployeeTip(user.employeeId, payload.tip);

      setCurrentMonthTotal(payload.currentMonthTotal);
      setMonthlyGoal(payload.monthlyGoal);
      void refreshDashboardQuiet();

      playChaChingSound();
      toast.success(t("employee.dashboard.toastNewTip"), TOAST_OK);
    };

    socket.on("new_tip", onNewTip);
    return () => {
      socket.off("new_tip", onNewTip);
    };
  }, [socket, user?.role, user?.employeeId, refreshDashboardQuiet, t]);

  const useDevDemo = shouldUseEmployeeDashboardDevDemo({
    isDev: import.meta.env.DEV,
    hasError: Boolean(error),
    accountSummaryLoaded: accountSummary.loaded,
    accountSummaryLoading,
    analyticsLoading,
    totalEarningsEur: accountSummary.totalEarningsEur,
    totalSupporters: accountSummary.totalSupporters,
  });

  const devGoalBundle = useDevDemo ? devMockEmployeeGoalBundle() : null;
  const devPeriodSummary = useDevDemo ? devMockEmployeeSummary(analyticsTimeframe) : null;

  const displayAccountSummary = useDevDemo
    ? { ...devMockEmployeeAccountSummary(), loaded: true }
    : accountSummary;

  const displayPeriodTipCount = devPeriodSummary?.tips ?? periodTipCount;
  const displayPeriodAmountEur = devPeriodSummary?.amount ?? periodAmountEur;
  const displayChartSeries = useDevDemo
    ? devMockEmployeeChartSeries(analyticsTimeframe)
    : chartSeries;
  const displayTips = useDevDemo ? devMockEmployeeRecentTips() : tips;
  const displayMonthlyGoal = devGoalBundle?.monthlyGoal ?? monthlyGoal;
  const displayCurrentMonthTotal = devGoalBundle?.currentMonthTotal ?? currentMonthTotal;
  const displayGoalProgress = devGoalBundle?.goal ?? goalProgress;

  const totalAmount = displayPeriodAmountEur;
  const avgTipFromServer = displayPeriodTipCount > 0 ? totalAmount / displayPeriodTipCount : 0;
  const stats = {
    tips: displayPeriodTipCount,
    avgTip: avgTipFromServer,
    amount: totalAmount,
    rating: useDevDemo ? devMockEmployeeRating() : null,
  };

  const chartData = useMemo(() => {
    return displayChartSeries.map((p) => ({
      time: analyticsTimeframe === "week" ? translateChartWeekdayLabel(p.label, t) : p.label,
      amount: p.amount,
    }));
  }, [displayChartSeries, analyticsTimeframe, t, i18n.resolvedLanguage]);

  const analyticsPeriodLabel = (tf: AnalyticsTimeframe) => {
    if (tf === "today") return t("employee.period.today");
    if (tf === "week") return t("employee.period.week");
    return t("employee.period.month");
  };

  /** False while analytics fetch is in flight or data lags behind the selected body period tab. */
  const valuesMatchAnalyticsPeriod =
    useDevDemo || (dataAnalyticsTimeframe === analyticsTimeframe && !analyticsLoading);

  const displayGoalPct =
    displayGoalProgress != null && displayGoalProgress.goalAmount > 0
      ? displayGoalProgress.percent
      : displayMonthlyGoal != null && displayMonthlyGoal > 0
        ? Math.min(100, Math.round((displayCurrentMonthTotal / displayMonthlyGoal) * 100))
        : null;

  const recentTips = displayTips.slice(0, 6).map((tipRow) => ({
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

  return (
    <div className={cn(employeeUi.page, "overflow-x-hidden")}>
      <div className={employeeUi.pageInner}>
        <DashboardHero
          stackHeroOnMobile
          hideTabs
          actionsPlacement="belowText"
          mobileAlign="left"
          className="employee-dashboard-hero mb-8 lg:mb-6"
          cardClassName="lg:border-neutral-200/90 lg:bg-gradient-to-br lg:from-white lg:to-stone-50/90 lg:shadow-[0_12px_44px_-20px_rgba(15,23,42,0.16)]"
          badgeClassName="normal-case border-primary/15 bg-primary/[0.06] px-2.5 py-1 text-[11px] max-lg:text-[12px] font-medium tracking-normal text-primary/90 shadow-none"
          titleClassName="max-lg:!leading-[1.05] lg:!leading-[1.08] tracking-tight max-lg:mx-0 max-lg:max-w-[20ch] max-lg:text-left lg:max-w-[13ch] lg:text-left xl:text-[2.35rem]"
          descriptionClassName="!line-clamp-2 max-w-[34ch] leading-relaxed text-muted-foreground/90 max-lg:mx-0 max-lg:text-left lg:max-w-sm"
          textColumnClassName="lg:py-2 xl:pr-6"
          badge={
            <>
              <Sparkles className="h-3 w-3 shrink-0 text-primary/75" aria-hidden />
              <span>
                {user.name
                  ? t("employee.hero.welcomeBackNamed", { name: user.name.split(" ")[0] })
                  : t("employee.hero.welcomeBack")}
              </span>
            </>
          }
          title={
            <>
              {t("employee.hero.headlineLine1")}
              <br />
              <span className="text-foreground/85">{t("employee.hero.headlineLine2")}</span>
            </>
          }
          description={t("employee.hero.sub")}
          image={
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="employee-hero-visual relative flex w-full flex-col items-center justify-center touch-manipulation max-lg:-mx-4 max-lg:w-[calc(100%+2rem)] max-lg:max-w-none sm:max-lg:-mx-5 sm:max-lg:w-[calc(100%+2.5rem)] lg:ml-auto lg:w-full lg:max-w-full"
            >
              <motion.div
                className={cn(
                  "employee-hero-chart-frame dashboard-hero-media-frame relative mx-auto w-full min-h-0 overflow-hidden max-lg:max-w-none",
                  "rounded-[1.75rem]",
                  "lg:h-[420px] lg:max-w-[560px]",
                )}
              >
                <img
                  src={employeeHeroImage}
                  alt=""
                  className="block h-full w-full object-cover object-center max-lg:absolute max-lg:inset-0 lg:h-full"
                  loading="eager"
                  decoding="async"
                  {...({ fetchpriority: "high" } as unknown as ImgHTMLAttributes<HTMLImageElement>)}
                />
              </motion.div>
            </motion.div>
          }
          imageOverlay={false}
          actions={
            <motion.div
              className="employee-hero-cta-block"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
            >
              <div className="employee-hero-cta-row">
                <Button
                  type="button"
                  onClick={() => void handleQrQuickAction()}
                  disabled={slugLoading || generatingSlug}
                  className={cn(employeeUi.btnPrimary, "min-w-0 shrink-0")}
                >
                  {generatingSlug ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                      {t("employee.hero.generating")}
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-4 w-4 shrink-0" />
                      {t("employee.hero.myQr")}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(employeeUi.btnSecondary, "min-w-0 shrink-0")}
                  asChild
                >
                  <Link to="/employee/tip-goals" className="inline-flex items-center justify-center gap-2">
                    <Target className="h-4 w-4 shrink-0" />
                    {t("employee.hero.setTipGoal")}
                  </Link>
                </Button>
              </div>
              <dl className="employee-hero-account-stats" aria-label={t("employee.hero.accountOverviewLabel")}>
                <div>
                  <dt>{t("employee.hero.statTotalEarnings")}</dt>
                  <dd>
                    {displayAccountSummary.loaded && !accountSummaryLoading
                      ? formatEur(displayAccountSummary.totalEarningsEur)
                      : t("format.noDataYet")}
                  </dd>
                </div>
                <div>
                  <dt>{t("employee.hero.statAvailableBalance")}</dt>
                  <dd>
                    {displayAccountSummary.loaded && !accountSummaryLoading
                      ? formatEur(displayAccountSummary.availableBalanceEur)
                      : t("format.noDataYet")}
                  </dd>
                </div>
                <div>
                  <dt>{t("employee.hero.statTotalSupporters")}</dt>
                  <dd>
                    {displayAccountSummary.loaded && !accountSummaryLoading
                      ? String(displayAccountSummary.totalSupporters)
                      : t("format.noDataYet")}
                  </dd>
                </div>
              </dl>
              <div className="dashboard-hero-context-bridge">
                <p className="dashboard-hero-context-bridge__text">{t("employee.hero.helperText")}</p>
              </div>
            </motion.div>
          }
        />
      </div>

      <TracingBeam className={cn(employeeUi.pageInner, "!pt-3 sm:!pt-2")}>
        <section className="mb-4 space-y-3" aria-labelledby="employee-analytics-period-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 space-y-1">
              <h2
                id="employee-analytics-period-heading"
                className="text-base font-semibold tracking-tight text-foreground"
              >
                {t("employee.dashboard.analyticsSectionTitle")}
              </h2>
              <p className="text-pretty text-sm leading-snug text-muted-foreground max-lg:line-clamp-2 lg:line-clamp-none">
                {t("employee.dashboard.analyticsSectionDesc", {
                  period: analyticsPeriodLabel(analyticsTimeframe),
                })}
              </p>
            </div>
            <LiveConnectionBadge status={connectionStatus} />
          </div>
          <div
            className={employeeUi.periodToggle}
            role="group"
            aria-label={t("employee.dashboard.analyticsPeriodAria")}
          >
            {(["today", "week", "month"] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setAnalyticsTimeframe(period)}
                aria-pressed={analyticsTimeframe === period}
                className={cn(
                  employeeUi.periodBtn,
                  analyticsTimeframe === period ? employeeUi.periodBtnActive : employeeUi.periodBtnIdle,
                )}
              >
                <span className="shrink-0">
                  {period === "today" && t("employee.earnings_today")}
                  {period === "week" && t("employee.earnings_week")}
                  {period === "month" && t("employee.earnings_month")}
                </span>
                {period === analyticsTimeframe && analyticsLoading ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin opacity-90" aria-hidden />
                ) : null}
              </button>
            ))}
          </div>
        </section>

        <div className={cn(employeeUi.section, "pb-6 pt-2")}>
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
            className={cn("transition-opacity duration-200", !valuesMatchAnalyticsPeriod && "opacity-[0.92]")}
          >
            <div className="relative mb-2 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6">
              {analyticsLoading && !useDevDemo ? (
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
              <EmployeeStatCard
                label={t("employee.dashboard.statTotalTips")}
                value={valuesMatchAnalyticsPeriod ? String(stats.tips) : t("format.noDataYet")}
                change={
                  analyticsLoading && !valuesMatchAnalyticsPeriod
                    ? t("employee.dashboard.statChangeUpdating")
                    : displayPeriodTipCount > 0 && valuesMatchAnalyticsPeriod
                      ? t("employee.dashboard.statChangeEarned", {
                          amount: formatEur(stats.amount),
                          count: displayPeriodTipCount,
                        })
                      : valuesMatchAnalyticsPeriod
                        ? t("format.metricZeroTips")
                        : t("employee.dashboard.statChangeEllipsis")
                }
                icon={<TrendingUp className="h-5 w-5" aria-hidden />}
                featured
              />
              <EmployeeStatCard
                label={
                  stats.rating != null ? t("employee.dashboard.statAvgRating") : t("employee.dashboard.statRatings")
                }
                value={stats.rating != null ? String(stats.rating) : t("format.notAvailable")}
                change={stats.rating != null ? undefined : t("format.metricZeroRatings")}
                icon={<Star className="h-5 w-5" aria-hidden />}
              />
              <EmployeeStatCard
                label={t("employee.dashboard.statMonthlyGoal")}
                value={displayGoalPct != null ? `${Math.round(Number(displayGoalPct))}%` : t("format.notAvailable")}
                change={
                  displayGoalPct != null
                    ? t("employee.dashboard.statGoalProgress")
                    : t("employee.dashboard.statGoalSetHint")
                }
                icon={<Target className="h-5 w-5" aria-hidden />}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className={cn(employeeUi.cardStatic, "w-full shadow-none hover:shadow-none")}>
              <CardHeader className={employeeUi.cardHeader}>
                <CardTitle className={employeeUi.cardTitle}>{t("employee.dashboard.earningsTitle")}</CardTitle>
                <CardDescription className="max-lg:line-clamp-3 lg:line-clamp-none">
                  {analyticsTimeframe === "today" &&
                    t("employee.dashboard.earningsDescToday", {
                      tz: businessTimezone ? t("employee.dashboard.tzSuffix", { tz: businessTimezone }) : "",
                    })}
                  {analyticsTimeframe === "week" &&
                    t("employee.dashboard.earningsDescWeek", {
                      tz: businessTimezone ? t("employee.dashboard.tzSuffix", { tz: businessTimezone }) : "",
                    })}
                  {analyticsTimeframe === "month" &&
                    t("employee.dashboard.earningsDescMonth", {
                      tz: businessTimezone ? t("employee.dashboard.tzSuffix", { tz: businessTimezone }) : "",
                    })}
                </CardDescription>
              </CardHeader>
              <CardContent className="min-w-0 overflow-x-auto overflow-y-visible pb-2">
                {(analyticsLoading && !useDevDemo) || !valuesMatchAnalyticsPeriod ? (
                  <div className="flex h-[220px] w-full min-w-0 items-center justify-center sm:h-[260px] lg:h-[280px]">
                    <Loader2
                      className="h-8 w-8 animate-spin text-muted-foreground"
                      aria-label={t("employee.dashboard.loadingChart")}
                    />
                  </div>
                ) : chartData.length === 0 ? (
                  <EmployeeEmptyState
                    icon={<TrendingUp className="h-6 w-6" aria-hidden />}
                    title={t("format.metricNoActivity")}
                    className="!py-10"
                  />
                ) : (
                  <div className="flex h-[220px] w-full min-w-0 items-center justify-center sm:h-[260px] lg:h-[280px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart key={analyticsTimeframe} data={chartData} margin={{ top: 10, right: 14, left: 4, bottom: 10 }}>
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
              <Card className={cn(employeeUi.cardStatic, "w-full shadow-none hover:shadow-none")}>
                <CardHeader className={cn(employeeUi.cardHeader, "flex flex-row items-center justify-between space-y-0")}>
                  <button
                    type="button"
                    onClick={() => setRecentTipsExpanded((v) => !v)}
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                    aria-expanded={recentTipsExpanded}
                  >
                    <div>
                      <CardTitle className={employeeUi.cardTitle}>{t("employee.dashboard.recentTips")}</CardTitle>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t("employee.dashboard.analyticsSectionDesc", {
                          period: analyticsPeriodLabel(analyticsTimeframe),
                        })}
                      </p>
                    </div>
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
                        <EmployeeEmptyState
                          icon={<TrendingUp className="h-6 w-6" aria-hidden />}
                          title={t("format.metricNoActivity")}
                          className="!py-8"
                        />
                      ) : (
                        recentTips.map((tip) => (
                          <div
                            key={tip.id}
                            className="flex items-center justify-between rounded-xl border border-neutral-200/70 bg-stone-50/50 p-3.5"
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
                <Card className={cn(employeeUi.cardStatic, "w-full shadow-none hover:shadow-none")}>
                  <CardHeader className={employeeUi.cardHeader}>
                    <CardTitle className={employeeUi.cardTitle}>{t("employee.dashboard.quickActions")}</CardTitle>
                    <CardDescription className={employeeUi.cardDesc}>{t("employee.dashboard.quickActionsDesc")}</CardDescription>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        className={cn(employeeUi.btnPrimary, "h-auto min-h-[6.5rem] flex-col gap-2 py-4")}
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
                        <Button
                          variant="outline"
                          className={cn(employeeUi.btnSecondary, "h-auto min-h-[6.5rem] flex-col gap-2 py-4")}
                          asChild
                        >
                          <a href={`/staff/${staffSlug}`} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-6 w-6" aria-hidden />
                            <span className="text-center text-xs font-semibold leading-tight">
                              {t("employee.dashboard.viewProfile")}
                            </span>
                          </a>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className={cn(employeeUi.btnSecondary, "h-auto min-h-[6.5rem] flex-col gap-2 py-4")}
                          disabled
                        >
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
