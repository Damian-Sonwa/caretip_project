import { motion } from "motion/react";
import { dashboardBlockMotion } from "@/lib/motionPerf";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { ImgHTMLAttributes } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { GlobalAppLoadingHold } from "../../components/GlobalAppLoadingHold";
import { translateChartWeekdayLabel } from "@/lib/chartAxisLabels";
import { runWithViewportScrollPreserved } from "../../lib/dashboardScrollStability";
import i18n from "@/i18n/i18n";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import {
  TrendingUp,
  Star,
  Eye,
  QrCode,
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
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { isProtectedApiReady } from "../../lib/authRestore";
import { useSocket, useDeferSocketConnect } from "../../hooks/useSocket";
import { useRealtimeFallback } from "../../hooks/useRealtimeFallback";
import { useDashboardTabRefocus } from "../../hooks/useDashboardTabRefocus";
import { DashboardStatusStrip } from "../../components/dashboard/DashboardStatusStrip";
import { deriveEmployeeDashboardStatus } from "../../lib/dashboardStatus/deriveDashboardStatus";
import { getEmployeeProfile, ensureEmployeeSlug } from "../../lib/api";
import { useEmployeeDashboardAnalytics } from "../../hooks/useEmployeeDashboardAnalytics";
import { useSubscriptionEntitlements } from "../../hooks/useSubscriptionEntitlements";
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
  DashboardChartSkeleton,
  DashboardHeroMetricSkeleton,
} from "../../components/dashboard/DashboardAnalyticsLoader";
import { CountUpMetric } from "../../components/dashboard/CountUpMetric";
import { DashboardStableChartSlot } from "../../components/dashboard/DashboardSectionLoading";
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
import { isWalkthroughDemoEmployee } from "../../lib/walkthroughDemo";

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

  const { advancedAnalyticsEnabled } = useSubscriptionEntitlements({
    enabled: dashboardEnabled,
    role: user?.role === "employee" ? "employee" : null,
  });

  const {
    analyticsTimeframe,
    setAnalyticsTimeframe,
    displayPayload,
    displayPayloadOrLatest,
    displayMetrics,
    valuesMatchAnalyticsPeriod,
    isMetricsInitialLoad,
    isAnalyticsInitialLoad,
    isPeriodRefreshing: analyticsPeriodRefreshing,
    analyticsTimeframeLoading,
    showMetricsSkeleton,
    error: analyticsError,
    refreshQuiet: refreshDashboardQuiet,
    applyLiveTip,
  } = useEmployeeDashboardAnalytics(dashboardEnabled, user?.employeeId, advancedAnalyticsEnabled);

  const showMetricsLoading = showMetricsSkeleton;
  const showChartLoading = isAnalyticsInitialLoad;
  const metricsSettledForPeriod =
    valuesMatchAnalyticsPeriod && !analyticsPeriodRefreshing && Boolean(displayMetrics);

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
  const refreshTimerRef = useRef<number | null>(null);

  const socketReady = useDeferSocketConnect(
    isProtectedApiReady() && user?.role === "employee",
  );
  const { socket, connected, connectionStatus } = useSocket(socketReady);

  useRealtimeFallback(connected, refreshDashboardQuiet);
  useDashboardTabRefocus(refreshDashboardQuiet, dashboardEnabled);

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
    const employeeId = user?.role === "employee" ? user.employeeId : undefined;
    if (!socket || !employeeId) return;

    const onNewTip = (payload: NewTipPayload) => {
      if (payload.employeeId !== employeeId) return;

      recordNewEmployeeTip(employeeId, payload.tip);

      applyLiveTip({
        tip: payload.tip,
        employeeId: payload.employeeId,
        currentMonthTotal: payload.currentMonthTotal,
        monthlyGoal: payload.monthlyGoal,
      });

      // Avoid websocket-triggered request storms: reconcile instantly from the event,
      // then verify authoritatively with a single debounced refresh.
      if (refreshTimerRef.current != null) window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null;
        void refreshDashboardQuiet();
      }, 900);

      playChaChingSound();
      toast.success(t("employee.dashboard.toastNewTip"), TOAST_OK);
    };

    socket.on("new_tip", onNewTip);
    return () => {
      socket.off("new_tip", onNewTip);
    };
  }, [socket, user?.role, user?.employeeId, refreshDashboardQuiet, t, applyLiveTip]);

  const heroPayload = displayPayloadOrLatest ?? displayPayload;

  const heroAccountReady =
    heroPayload != null &&
    (typeof heroPayload.totalEarningsEur === "number" ||
      typeof heroPayload.periodAmountEur === "number");

  const useDevDemo = shouldUseEmployeeDashboardDevDemo({
    isDev: import.meta.env.DEV,
    isWalkthroughDemoAccount: isWalkthroughDemoEmployee(user),
    hasError: Boolean(error),
    accountSummaryLoaded: heroAccountReady,
    accountSummaryLoading: isMetricsInitialLoad,
    analyticsLoading: showMetricsLoading,
    totalEarningsEur: heroPayload?.totalEarningsEur ?? 0,
    totalSupporters: heroPayload?.totalSupporters ?? 0,
  });

  const devGoalBundle = useDevDemo ? devMockEmployeeGoalBundle() : null;
  const devPeriodSummary = useDevDemo ? devMockEmployeeSummary(analyticsTimeframe) : null;

  const displayAccountSummary = useDevDemo
    ? { ...devMockEmployeeAccountSummary(), loaded: true }
    : heroAccountReady && heroPayload
      ? {
          totalEarningsEur: heroPayload.totalEarningsEur ?? heroPayload.periodAmountEur ?? 0,
          availableBalanceEur: heroPayload.availableBalanceEur ?? 0,
          totalSupporters: heroPayload.totalSupporters ?? 0,
          loaded: true,
        }
      : { totalEarningsEur: 0, availableBalanceEur: 0, totalSupporters: 0, loaded: false };

  const showHeroMetricsLoading =
    !useDevDemo &&
    (!displayAccountSummary.loaded || analyticsPeriodRefreshing) &&
    (showMetricsLoading || isMetricsInitialLoad);

  const chartPayload = displayPayload ?? displayPayloadOrLatest;
  const displayPeriodTipCount = devPeriodSummary?.tips ?? displayMetrics?.periodTipCount ?? 0;
  const displayPeriodAmountEur = devPeriodSummary?.amount ?? displayMetrics?.periodAmountEur ?? 0;
  const displayChartSeries = useDevDemo
    ? devMockEmployeeChartSeries(analyticsTimeframe)
    : (chartPayload?.chartSeries ?? []);
  const displayTips = useDevDemo ? devMockEmployeeRecentTips() : (chartPayload?.tips ?? []);
  const displayMonthlyGoal =
    devGoalBundle?.monthlyGoal ?? displayPayload?.monthlyGoal ?? displayMetrics?.monthlyGoal ?? null;
  const displayCurrentMonthTotal =
    devGoalBundle?.currentMonthTotal ??
    displayPayload?.currentMonthTotal ??
    displayMetrics?.currentMonthTotal ??
    0;
  const displayGoalProgress =
    devGoalBundle?.goal ?? displayPayload?.goalProgress ?? displayMetrics?.goalProgress ?? null;
  const businessTimezone = chartPayload?.businessTimezone ?? null;

  const periodMetrics = useMemo(() => {
    const periodTipCount =
      devPeriodSummary?.tips ?? displayMetrics?.periodTipCount ?? displayPeriodTipCount;
    const periodAmountEur =
      devPeriodSummary?.amount ?? displayMetrics?.periodAmountEur ?? displayPeriodAmountEur;
    const rating = useDevDemo
      ? devMockEmployeeRating()
      : (displayPayload?.averageRating ?? displayMetrics?.averageRating ?? null);
    const ratingCount = useDevDemo
      ? 12
      : (displayPayload?.ratingCount ?? displayMetrics?.ratingCount ?? 0);
    const goalPct =
      displayGoalProgress != null
        ? displayGoalProgress.goalAmount > 0
          ? displayGoalProgress.percent ?? 0
          : 0
        : displayMonthlyGoal != null && displayMonthlyGoal > 0
          ? Math.min(100, Math.round((displayCurrentMonthTotal / displayMonthlyGoal) * 100))
          : null;
    return { periodTipCount, periodAmountEur, goalPct, rating, ratingCount };
  }, [
    devPeriodSummary,
    displayMetrics,
    displayPeriodTipCount,
    displayPeriodAmountEur,
    useDevDemo,
    displayGoalProgress,
    displayMonthlyGoal,
    displayCurrentMonthTotal,
    displayPayload?.averageRating,
    displayPayload?.ratingCount,
    displayMetrics?.averageRating,
    displayMetrics?.ratingCount,
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

  const dashboardStatusItems = useMemo(
    () =>
      deriveEmployeeDashboardStatus(
        {
          isInitialLoading: showMetricsLoading,
          isPeriodRefreshing: analyticsPeriodRefreshing,
          socketStatus: connectionStatus,
        },
        t,
      ),
    [
      showMetricsLoading,
      analyticsPeriodRefreshing,
      connectionStatus,
      t,
    ],
  );

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

  if (!user) {
    return <GlobalAppLoadingHold />;
  }

  if (error && !heroPayload && showMetricsLoading) {
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
                  analyticsPeriodRefreshing && "dashboard-swr-swap--revalidating",
                )}
                aria-label={t("employee.hero.accountOverviewLabel")}
                aria-busy={showHeroMetricsLoading}
              >
                <div>
                  <dt>{t("employee.hero.statTotalEarnings")}</dt>
                  <dd>
                    {showHeroMetricsLoading ? (
                      <DashboardHeroMetricSkeleton variant="currency" />
                    ) : (
                      <span className="dashboard-hero-metric-value--live">
                        <CountUpMetric
                          value={displayAccountSummary.totalEarningsEur}
                          kind="eur"
                          format={(n) =>
                            n < 0.005 ? t("format.metricZeroTips") : formatEur(n)
                          }
                        />
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
                      <span className="dashboard-hero-metric-value--live">
                        <CountUpMetric
                          value={displayAccountSummary.availableBalanceEur}
                          kind="eur"
                        />
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
                      <span className="dashboard-hero-metric-value--live">
                        <CountUpMetric
                          value={displayAccountSummary.totalSupporters}
                          kind="integer"
                        />
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
        <section
          className={cn(
            "employee-dashboard-analytics-intro mb-1",
            (showMetricsLoading || analyticsPeriodRefreshing) &&
              "employee-dashboard-analytics-intro--loading",
          )}
          aria-labelledby="employee-analytics-period-heading"
          aria-busy={showMetricsLoading || analyticsPeriodRefreshing || undefined}
        >
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
            <DashboardStatusStrip
              placeholder={showMetricsLoading}
              items={dashboardStatusItems}
            />
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
                onClick={() => {
                  runWithViewportScrollPreserved(() => setAnalyticsTimeframe(period));
                }}
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
                {analyticsTimeframeLoading === period ? (
                  <span
                    className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-current/70 align-middle"
                    aria-hidden
                  />
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
          >
            <EmployeeDashboardMetricsGrid
              loading={showMetricsLoading}
              isPeriodRefreshing={analyticsPeriodRefreshing}
              metricsSettledForPeriod={metricsSettledForPeriod}
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
                <DashboardStableChartSlot
                  loading={showChartLoading}
                  minHeightClass="min-h-[220px] sm:min-h-[260px] lg:min-h-[280px]"
                  skeleton={
                    <DashboardChartSkeleton
                      variant="trend"
                      minHeightClass="h-full min-h-0"
                      className="h-full"
                    />
                  }
                >
                  {chartData.length === 0 ? (
                    <div className={cn(employeeUi.cardPad, employeeUi.chartEmpty)}>
                      <EmployeeEmptyState
                        icon={<TrendingUp className="h-6 w-6" aria-hidden />}
                        title={t("emptyState.chart.title")}
                        description={t("emptyState.chart.description")}
                        className="relative z-[1] !py-10"
                      />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        employeeUi.chartFrame,
                        "dashboard-hero-metric-value--live flex h-[220px] w-full min-w-0 items-center justify-center sm:h-[260px] lg:h-[280px]",
                      )}
                    >
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <AreaChart
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
                </DashboardStableChartSlot>
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
                  </button>
                  <Link
                    to="/employee/notifications"
                    className="flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
                  >
                    {t("dashboard.viewAll")}
                  </Link>
                </CardHeader>
                {recentTipsExpanded ? (
                  <CardContent>
                    <div className="space-y-3">
                      {recentTips.length === 0 ? (
                        <EmployeeEmptyState
                          icon={<TrendingUp className="h-6 w-6" aria-hidden />}
                          title={t("emptyState.tips.title")}
                          description={t("emptyState.tips.description")}
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
