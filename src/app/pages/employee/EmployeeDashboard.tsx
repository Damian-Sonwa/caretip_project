import { motion } from "motion/react";
import { dashboardBlockMotion } from "@/lib/motionPerf";
import { useState, useEffect, useMemo, useCallback } from "react";
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
import { isProtectedApiReady } from "../../lib/authRestore";
import { useSocket, useDeferSocketConnect } from "../../hooks/useSocket";
import { useRealtimeFallback } from "../../hooks/useRealtimeFallback";
import { LiveConnectionBadge } from "../../components/LiveConnectionBadge";
import { getEmployeeProfile, ensureEmployeeSlug } from "../../lib/api";
import { useEmployeeAccountSummary } from "../../hooks/useEmployeeAccountSummary";
import { useEmployeeDashboardAnalytics } from "../../hooks/useEmployeeDashboardAnalytics";
import { EmployeeDashboardMetricsGrid } from "../../components/employee/EmployeeDashboardMetricsGrid";
import { formatEur } from "../../lib/formatEur";
import type { TipItem, EmployeeGoalProgress } from "../../lib/api";
import { playChaChingSound } from "../../lib/tipSounds";
import { FixPrompt } from "../../components/FixPrompt";
import { EmployeeQRCodeModal } from "../../components/employee/EmployeeQRCodeModal";
import {
  recordNewEmployeeTip,
  syncEmployeeNotificationTips,
} from "../../lib/employeeNotificationStore";
import employeeHeroImage from "../../../../images/ICT_employee.png";
import { cn } from "@/lib/utils";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DashboardHeroMetricSkeleton,
  DashboardRefreshIndicator,
  DashboardSectionSpinner,
} from "../../components/dashboard/DashboardAnalyticsLoader";
import { EmployeeEmptyState } from "../../components/employee/EmployeeEmptyState";
import { employeeUi } from "../../components/employee/employeeDashboardUi";
import {
  DASHBOARD_CHART_AXIS,
  DASHBOARD_CHART_GRID,
  DASHBOARD_CHART_AREA_STROKE,
  dashboardChartTooltipStyle,
} from "../../components/dashboard/dashboardChartTheme";
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

  const dashboardEnabled = isProtectedApiReady() && user?.role === "employee";

  const {
    displayAccount,
    isInitialLoad: accountInitialLoad,
    isPeriodRefreshing: accountPeriodRefreshing,
    dataRevision: accountDataRevision,
    lastUpdatedAt: accountLastUpdatedAt,
    refreshQuiet: refreshAccountQuiet,
  } = useEmployeeAccountSummary(dashboardEnabled);

  const {
    analyticsTimeframe,
    setAnalyticsTimeframe,
    displayPayload,
    displayMetrics,
    valuesMatchAnalyticsPeriod,
    isMetricsInitialLoad,
    isAnalyticsInitialLoad,
    isPeriodRefreshing: analyticsPeriodRefreshing,
    dataRevision: analyticsDataRevision,
    lastUpdatedAt: analyticsLastUpdatedAt,
    error: analyticsError,
    refreshQuiet: refreshAnalyticsQuiet,
  } = useEmployeeDashboardAnalytics(dashboardEnabled, user?.employeeId);

  const showMetricsLoading = isMetricsInitialLoad;
  const showChartLoading = isAnalyticsInitialLoad;

  const refreshDashboardQuiet = useCallback(async () => {
    await Promise.all([refreshAccountQuiet(), refreshAnalyticsQuiet()]);
  }, [refreshAccountQuiet, refreshAnalyticsQuiet]);

  const [error, setError] = useState<string | null>(null);
  /** `undefined` = not loaded yet; `null` = no slug in DB */
  const [staffSlug, setStaffSlug] = useState<string | null | undefined>(undefined);
  /** Public venue slug from `/api/employees/me` for canonical tip URLs */
  const [employeeBusinessSlug, setEmployeeBusinessSlug] = useState<string | null | undefined>(undefined);
  /** Employee row id from `/api/employees/me` - must match QR `Employee.id`, not auth `User.id` */
  const [employeeRecordId, setEmployeeRecordId] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [generatingSlug, setGeneratingSlug] = useState(false);
  const [recentTipsExpanded, setRecentTipsExpanded] = useState(true);

  const socketReady = useDeferSocketConnect(
    isProtectedApiReady() && user?.role === "employee",
  );
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
    if (analyticsError) setError(analyticsError);
  }, [analyticsError]);

  useEffect(() => {
    if (!socket || user?.role !== "employee" || !user.employeeId) return;

    const onNewTip = (payload: NewTipPayload) => {
      if (user.employeeId && payload.employeeId !== user.employeeId) return;

      recordNewEmployeeTip(user.employeeId, payload.tip);

      void refreshDashboardQuiet();

      playChaChingSound();
      toast.success(t("employee.dashboard.toastNewTip"), TOAST_OK);
    };

    socket.on("new_tip", onNewTip);
    return () => {
      socket.off("new_tip", onNewTip);
    };
  }, [socket, user?.role, user?.employeeId, refreshDashboardQuiet, t]);

  const accountLoaded = displayAccount != null;

  const useDevDemo = shouldUseEmployeeDashboardDevDemo({
    isDev: import.meta.env.DEV,
    hasError: Boolean(error),
    accountSummaryLoaded: accountLoaded,
    accountSummaryLoading: accountInitialLoad,
    analyticsLoading: showMetricsLoading || showChartLoading,
    totalEarningsEur: displayAccount?.totalEarningsEur ?? 0,
    totalSupporters: displayAccount?.totalSupporters ?? 0,
  });

  const devGoalBundle = useDevDemo ? devMockEmployeeGoalBundle() : null;
  const devPeriodSummary = useDevDemo ? devMockEmployeeSummary(analyticsTimeframe) : null;

  const displayAccountSummary = useDevDemo
    ? { ...devMockEmployeeAccountSummary(), loaded: true }
    : displayAccount
      ? {
          totalEarningsEur: displayAccount.totalEarningsEur,
          availableBalanceEur: displayAccount.availableBalanceEur,
          totalSupporters: displayAccount.totalSupporters,
          loaded: true,
        }
      : { totalEarningsEur: 0, availableBalanceEur: 0, totalSupporters: 0, loaded: false };

  const showHeroMetricsLoading = !useDevDemo && !displayAccountSummary.loaded;

  const displayPeriodTipCount = devPeriodSummary?.tips ?? displayPayload?.periodTipCount ?? 0;
  const displayPeriodAmountEur = devPeriodSummary?.amount ?? displayPayload?.periodAmountEur ?? 0;
  const displayChartSeries = useDevDemo
    ? devMockEmployeeChartSeries(analyticsTimeframe)
    : (displayPayload?.chartSeries ?? []);
  const displayTips = useDevDemo ? devMockEmployeeRecentTips() : (displayPayload?.tips ?? []);
  const displayMonthlyGoal = devGoalBundle?.monthlyGoal ?? displayPayload?.monthlyGoal ?? null;
  const displayCurrentMonthTotal =
    devGoalBundle?.currentMonthTotal ?? displayPayload?.currentMonthTotal ?? 0;
  const displayGoalProgress = devGoalBundle?.goal ?? displayPayload?.goalProgress ?? null;
  const businessTimezone = displayPayload?.businessTimezone ?? null;

  const periodMetrics = useMemo(() => {
    const periodTipCount = devPeriodSummary?.tips ?? displayMetrics?.periodTipCount ?? displayPeriodTipCount;
    const periodAmountEur = devPeriodSummary?.amount ?? displayMetrics?.periodAmountEur ?? displayPeriodAmountEur;
    const rating = useDevDemo ? devMockEmployeeRating() : null;
    const goalPct =
      displayGoalProgress != null && displayGoalProgress.goalAmount > 0
        ? displayGoalProgress.percent
        : displayMonthlyGoal != null && displayMonthlyGoal > 0
          ? Math.min(100, Math.round((displayCurrentMonthTotal / displayMonthlyGoal) * 100))
          : null;
    return { periodTipCount, periodAmountEur, goalPct, rating };
  }, [
    devPeriodSummary,
    displayMetrics,
    displayPeriodTipCount,
    displayPeriodAmountEur,
    useDevDemo,
    displayGoalProgress,
    displayMonthlyGoal,
    displayCurrentMonthTotal,
  ]);

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

  const valuesMatchPeriod = useDevDemo || valuesMatchAnalyticsPeriod;

  const recentTipsSource = displayTips;
  const recentTips = recentTipsSource.slice(0, 6).map((tipRow) => ({
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

  if (error && !displayPayload && showMetricsLoading) {
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
          className="employee-dashboard-hero mb-7 sm:mb-8 lg:mb-7"
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
              className="employee-hero-visual relative mx-auto flex w-full max-w-full flex-col items-center justify-center touch-manipulation lg:justify-self-center"
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
                  className={cn(employeeUi.btnPrimary, employeeUi.heroCtaBtn)}
                >
                  {generatingSlug ? (
                    <>
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                      {t("employee.hero.generating")}
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 shrink-0" />
                      {t("employee.hero.myQr")}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(employeeUi.btnSecondary, employeeUi.heroCtaBtn)}
                  asChild
                >
                  <Link to="/employee/tip-goals" className={employeeUi.heroCtaLink}>
                    <Target className="h-4 w-4 shrink-0" />
                    {t("employee.hero.setTipGoal")}
                  </Link>
                </Button>
              </div>
              <dl
                className={cn(
                  "employee-hero-account-stats dashboard-swr-swap",
                  showHeroMetricsLoading && "dashboard-hero-account-stats--loading",
                  accountPeriodRefreshing && "dashboard-swr-swap--revalidating",
                )}
                aria-label={t("employee.hero.accountOverviewLabel")}
                aria-busy={showHeroMetricsLoading}
                key={`hero-account-${accountDataRevision}`}
              >
                <div>
                  <dt>{t("employee.hero.statTotalEarnings")}</dt>
                  <dd>
                    {showHeroMetricsLoading ? (
                      <DashboardHeroMetricSkeleton variant="currency" />
                    ) : (
                      <span className="dashboard-hero-metric-value--live tabular-nums">
                        {displayAccountSummary.totalEarningsEur > 0
                          ? formatEur(displayAccountSummary.totalEarningsEur)
                          : t("format.metricZeroTips")}
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>{t("employee.hero.statAvailableBalance")}</dt>
                  <dd>
                    {showHeroMetricsLoading ? (
                      <DashboardHeroMetricSkeleton variant="currency" />
                    ) : (
                      <span className="dashboard-hero-metric-value--live tabular-nums">
                        {displayAccountSummary.availableBalanceEur > 0
                          ? formatEur(displayAccountSummary.availableBalanceEur)
                          : formatEur(0)}
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>{t("employee.hero.statTotalSupporters")}</dt>
                  <dd>
                    {showHeroMetricsLoading ? (
                      <DashboardHeroMetricSkeleton variant="count" />
                    ) : (
                      <span className="dashboard-hero-metric-value--live tabular-nums">
                        {String(displayAccountSummary.totalSupporters)}
                      </span>
                    )}
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

      <TracingBeam className={cn(employeeUi.pageInner, "employee-dashboard-body !pt-2 sm:!pt-3")}>
        <section className="employee-dashboard-analytics-intro mb-1" aria-labelledby="employee-analytics-period-heading">
          <div className="employee-dashboard-analytics-intro__head">
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
            <div className="flex flex-wrap items-center gap-2">
              <LiveConnectionBadge status={connectionStatus} />
              <DashboardRefreshIndicator
                isRefreshing={accountPeriodRefreshing || analyticsPeriodRefreshing}
                lastUpdatedAt={analyticsLastUpdatedAt ?? accountLastUpdatedAt}
              />
            </div>
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
                {period === analyticsTimeframe && (showMetricsLoading || showChartLoading) ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin opacity-90" aria-hidden />
                ) : null}
              </button>
            ))}
          </div>
        </section>

        <div className={cn(employeeUi.section, "employee-dashboard-section pb-6 pt-1")}>
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
            {...dashboardBlockMotion}
            className={cn(
              "dashboard-swr-swap",
              analyticsPeriodRefreshing && "dashboard-swr-swap--revalidating",
            )}
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            key={`emp-metrics-${analyticsDataRevision}`}
          >
            <EmployeeDashboardMetricsGrid
              loading={showMetricsLoading}
              isPeriodRefreshing={analyticsPeriodRefreshing}
              metrics={periodMetrics}
            />
          </motion.div>

          <motion.div
            {...dashboardBlockMotion}
            className={cn(
              "dashboard-swr-swap",
              analyticsPeriodRefreshing && "dashboard-swr-swap--revalidating",
            )}
            transition={{ delay: 0.4 }}
            key={`emp-chart-${analyticsDataRevision}`}
          >
            <Card className={cn(employeeUi.cardStatic, employeeUi.chartCard, "w-full")}>
              <CardHeader className={employeeUi.cardHeader}>
                <CardTitle className={employeeUi.cardTitle}>{t("employee.dashboard.earningsTitle")}</CardTitle>
                <CardDescription className={cn(employeeUi.cardDesc, "max-lg:line-clamp-3 lg:line-clamp-none")}>
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
                {showChartLoading ? (
                  <DashboardSectionSpinner
                    minHeightClass="min-h-[220px] sm:min-h-[260px] lg:min-h-[280px]"
                    ariaLabel={t("employee.dashboard.loadingChart")}
                  />
                ) : chartData.length === 0 ? (
                  <div className={cn(employeeUi.cardPad, employeeUi.chartEmpty)}>
                    <EmployeeEmptyState
                      icon={<TrendingUp className="h-6 w-6" aria-hidden />}
                      title={t("format.metricNoActivity")}
                      className="relative z-[1] !py-10"
                    />
                  </div>
                ) : (
                  <div className={cn(employeeUi.chartFrame, "flex h-[220px] w-full min-w-0 items-center justify-center sm:h-[260px] lg:h-[280px]")}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart
                      key={`emp-chart-${analyticsTimeframe}`}
                      data={chartData}
                      margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
                    >
                      <defs>
                        <linearGradient id="empColorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.32} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 6" stroke={DASHBOARD_CHART_GRID} vertical={false} />
                      <XAxis
                        dataKey="time"
                        stroke={DASHBOARD_CHART_AXIS}
                        tickLine={false}
                        axisLine={{ stroke: DASHBOARD_CHART_GRID }}
                        style={{ fontSize: "11px" }}
                        tickMargin={8}
                      />
                      <YAxis
                        stroke={DASHBOARD_CHART_AXIS}
                        tickLine={false}
                        axisLine={false}
                        style={{ fontSize: "11px" }}
                        tickMargin={8}
                        width={48}
                      />
                      <Tooltip
                        formatter={(value: number) => [formatEur(Number(value)), t("charts.tooltip.earnings")]}
                        contentStyle={dashboardChartTooltipStyle}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke={DASHBOARD_CHART_AREA_STROKE}
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
              {...dashboardBlockMotion}
              transition={{ delay: 0.5 }}
            >
              <Card className={cn(employeeUi.cardStatic, "w-full")}>
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
                            className={cn(employeeUi.listItem, employeeUi.listRow, "flex items-center justify-between p-3.5")}
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
                {...dashboardBlockMotion}
                transition={{ delay: 0.6 }}
              >
                <Card className={cn(employeeUi.cardStatic, "w-full")}>
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
