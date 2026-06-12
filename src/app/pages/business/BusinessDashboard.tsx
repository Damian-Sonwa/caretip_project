import { motion } from "motion/react";
import { dashboardBlockMotion } from "@/lib/motionPerf";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, Navigate } from "react-router";
import type { ImgHTMLAttributes } from "react";
import {
  Users,
  TrendingUp,
  Download,
  MapPin,
  Star,
  Building2,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { CareIcon } from "@/components/icons";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { translateChartMonthLabel, translateChartWeekdayLabel } from "@/lib/chartAxisLabels";
import { GlobalAppLoadingHold } from "../../components/GlobalAppLoadingHold";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { useSocket, useDeferSocketConnect } from "../../hooks/useSocket";
import { useRealtimeFallback } from "../../hooks/useRealtimeFallback";
import { DashboardStatusStrip } from "../../components/dashboard/DashboardStatusStrip";
import { deriveBusinessDashboardStatus } from "../../lib/dashboardStatus/deriveDashboardStatus";
import { FixPrompt } from "../../components/FixPrompt";
import { downloadBusinessTransactionsExport } from "../../lib/api";
import { useBusinessDashboardStats } from "../../hooks/useBusinessDashboardStats";
import { useSubscriptionEntitlements } from "../../hooks/useSubscriptionEntitlements";
import {
  DashboardChartSkeleton,
  DashboardHeroMetricSkeleton,
} from "../../components/dashboard/DashboardAnalyticsLoader";
import {
  DashboardAnalyticsPhaseHintSlot,
  DashboardListSkeleton,
  DashboardStableChartSlot,
  DeferredContentFade,
  GoalsTableLoadingShell,
} from "../../components/dashboard/DashboardSectionLoading";
import { CountUpMetric } from "../../components/dashboard/CountUpMetric";
import { DashboardAnalyticsPeriodToggle } from "../../components/dashboard/DashboardAnalyticsPeriodToggle";
import { runWithViewportScrollPreserved } from "../../lib/dashboardScrollStability";
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
import { BusinessDashboardMetricsGrid } from "../../components/business/BusinessDashboardMetricsGrid";
import { RecentCustomerFeedbackPanel } from "../../components/business/RecentCustomerFeedbackPanel";
import { EmployeeEmptyState } from "../../components/employee/EmployeeEmptyState";
import { businessUi } from "../../components/business/businessDashboardUi";
import {
  BUSINESS_CHART_AXIS,
  BUSINESS_CHART_BAR_SOFT,
  BUSINESS_CHART_GRID,
  businessChartBarFill,
  businessChartTooltipStyle,
} from "../../components/business/businessDashboardChartTheme";
import {
  devMockBusinessEmployeePerformance,
  devMockBusinessOperationalPulse,
  devMockBusinessPeriodStats,
  devMockBusinessTipDistribution,
  shouldUseBusinessDashboardDevDemo,
} from "../../lib/devAnalyticsMocks";
import { getAuthSessionFlags } from "../../lib/authSessionBootstrap";
import { isOnboardingCompleted } from "../../lib/onboardingProgress";
import { isWalkthroughDemoManager } from "../../lib/walkthroughDemo";
import businessHeroImage from "../../../../images/bizzy002.png";

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

const TOAST_OK = { style: { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } } as const;

const EXPORT_ERROR_TOAST = {
  style: { background: "#000000", color: "#ffffff" },
} as const;

function goalStatusClass(s: EmployeeGoalProgressStatus): string {
  if (s === "achieved") return "text-[#34D399]";
  if (s === "on_track") return "text-primary";
  return "text-amber-700";
}

export function BusinessDashboard() {
  const { t, i18n } = useTranslation();
  const timeLocale = i18n.language?.toLowerCase().startsWith("de") ? de : enUS;
  const goalPeriodLabels = useMemo(
    () =>
      ({
        daily: t("business.period.daily"),
        weekly: t("business.period.weekly"),
        monthly: t("business.period.monthly"),
      }) satisfies Record<GoalPeriod, string>,
    [t],
  );
  const { user, logout, isBusiness, exitImpersonation, sessionValidated, authReady } =
    useRequireAuth();

  const handleLogout = () => {
    if (user?.impersonation) {
      exitImpersonation();
      return;
    }
    logout();
  };

  const { advancedAnalyticsEnabled, hasCapability } = useSubscriptionEntitlements({
    enabled: user?.role === "business" && authReady,
    role: user?.role === "business" ? "business" : null,
  });
  const canExportCsv = hasCapability("csvExport");
  const businessKycApproved = Boolean(user?.impersonation || user?.status === "APPROVED");
  const businessKycNeedsVerification = Boolean(
    isBusiness &&
      !user?.impersonation &&
      (user?.status === "PENDING" || user?.status === "REJECTED"),
  );

  const {
    analyticsTimeframe,
    setAnalyticsTimeframe,
    heroStats,
    analyticsTimeframeLoading,
    statsLoadFailed,
    pendingVerification,
    displayStats,
    displayMetrics,
    isMetricsInitialLoad,
    isAnalyticsSectionLoading,
    isGoalsInitialLoad,
    isPeriodRefreshing,
    showStatsSkeleton,
    valuesMatchAnalyticsPeriod,
    refreshStatsQuiet,
    retryStats,
    applyLiveTip,
  } = useBusinessDashboardStats(
    user?.role === "business" && authReady && user.hasCompletedOnboarding === true,
    sessionValidated,
    advancedAnalyticsEnabled,
  );
  const showPendingVerification = businessKycNeedsVerification || pendingVerification === true;

  const [exportLoading, setExportLoading] = useState(false);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [topPerformersExpanded, setTopPerformersExpanded] = useState(true);
  const [employeeGoalsExpanded, setEmployeeGoalsExpanded] = useState(true);
  /** Mobile-only: expand long “how it works” copy under the employee goals title. */
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(true);
  const refreshTimerRef = useRef<number | null>(null);
  const socketReady = useDeferSocketConnect(authReady && user?.role === "business");
  const { socket, connected, connectionStatus } = useSocket(socketReady);

  useRealtimeFallback(connected, () => {
    refreshStatsQuiet();
  });

  useEffect(() => {
    if (!socket || user?.role !== "business") return;
    const sync = () => refreshStatsQuiet();
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
      const who = payload.employeeName?.trim() || t("business.dashboard.toastTeamMember");
      const timeStr = format(new Date(payload.tip.createdAt), "p", { locale: timeLocale });
      toast.success(
        t("business.dashboard.toastNewTip", {
          who,
          amount: formatEur(Number(payload.tip.amount)),
          time: timeStr,
        }),
        TOAST_OK,
      );
      applyLiveTip(payload);

      // Avoid websocket-triggered request storms: apply event instantly, verify once.
      if (refreshTimerRef.current != null) window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null;
        refreshStatsQuiet();
      }, 900);
    };

    socket.on("new_tip", onNewTip);
    return () => {
      socket.off("new_tip", onNewTip);
    };
  }, [socket, user?.role, user?.businessId, refreshStatsQuiet, t, timeLocale, applyLiveTip]);

  const handleExport = async () => {
    if (!isBusiness) return;
    setExportLoading(true);
    try {
      await downloadBusinessTransactionsExport();
    } catch (err) {
      logClientError("BusinessDashboard", err);
      toast.error(t("business.dashboard.exportFailed"), EXPORT_ERROR_TOAST);
    } finally {
      setExportLoading(false);
    }
  };

  const rosterEmployees = displayStats?.employees ?? [];
  const activeRosterCount = rosterEmployees.filter(
    (e) => e.isActive === true && e.activationStatus === "active" && e.emailVerified === true,
  ).length;
  const topEmployees = rosterEmployees
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

  const useDevDemo = shouldUseBusinessDashboardDevDemo({
    isDev: import.meta.env.DEV,
    isWalkthroughDemoAccount: isWalkthroughDemoManager(user),
    statsLoading: isMetricsInitialLoad,
    pendingVerification: showPendingVerification,
    tipCount: displayStats?.tipCount ?? 0,
  });

  const devPeriod = useDevDemo ? devMockBusinessPeriodStats(analyticsTimeframe) : null;
  const analyticsStats: BusinessDashboardStats | null = useDevDemo
    ? {
        ...(displayStats ?? {}),
        totalTips: devPeriod!.totalTips,
        tipCount: devPeriod!.tipCount,
        employeeCount: devPeriod!.employeeCount,
      }
    : displayStats;

  const operationalPulse = useDevDemo
    ? devMockBusinessOperationalPulse()
    : (heroStats?.operationalPulse ?? displayStats?.operationalPulse);

  const tipDistributionData = useDevDemo
    ? devMockBusinessTipDistribution(analyticsTimeframe)
    : (displayStats?.dailyTipDistribution ?? []);

  const tipDistributionChartData = useMemo(() => {
    return tipDistributionData.map((row) => ({
      ...row,
      dayLabel:
        analyticsTimeframe === "week"
          ? translateChartWeekdayLabel(row.day, t)
          : analyticsTimeframe === "year"
            ? translateChartMonthLabel(row.day, t)
            : row.day,
    }));
  }, [tipDistributionData, analyticsTimeframe, t, i18n.resolvedLanguage]);

  const employeePerformance = useMemo(() => {
    if (useDevDemo) {
      return devMockBusinessEmployeePerformance([...BUSINESS_CHART_COLORS]);
    }
    const list = [...(displayStats?.employees ?? [])].sort(
      (a, b) => b.tipsTotal - a.tipsTotal,
    );
    return list.map((e, i) => ({
      name:
        e.name.split(" ").length > 1
          ? `${e.name.split(" ")[0]} ${e.name.split(" ")[1]?.[0] ?? ""}.`
          : e.name,
      tips: e.tipsTotal,
      rating: e.rating ?? 0,
      color: BUSINESS_CHART_COLORS[i % BUSINESS_CHART_COLORS.length],
    }));
  }, [useDevDemo, displayStats?.employees]);

  const hasTipActivityInPeriod = useDevDemo || (displayMetrics?.totalTips ?? 0) > 0;

  const tipDistributionTotal = useMemo(
    () => tipDistributionData.reduce((acc, row) => acc + (Number(row.amount) || 0), 0),
    [tipDistributionData],
  );

  const employeeGoalsList = displayStats?.employeeGoals ?? [];
  const goalsTableColumns = useMemo(
    () => [
      t("business.dashboard.tableTeamMember"),
      t("business.dashboard.tablePeriod"),
      t("business.dashboard.tableTarget"),
      t("business.dashboard.tableCurrent"),
      t("business.dashboard.tableProgress"),
      t("business.dashboard.tableStatus"),
    ],
    [t],
  );
  const employeeGoalsSummary = useMemo(() => {
    const goals = employeeGoalsList;
    if (goals.length === 0) return null;
    const onTrack = goals.filter((g) => g.status === "achieved" || g.status === "on_track").length;
    return { total: goals.length, onTrack };
  }, [employeeGoalsList]);

  const analyticsPeriodLabel = (period: "week" | "month" | "year") => {
    if (period === "week") return t("dashboard.filter_week");
    if (period === "year") return t("dashboard.filter_year");
    return t("dashboard.filter_month");
  };

  const brokenQrLinks =
    (displayStats?.employees ?? []).length > 0 &&
    (displayStats?.employees ?? []).some((e) => e.slug == null || e.slug === "");

  const showMetricsSkeleton = isMetricsInitialLoad && !useDevDemo;
  const heroPulseLoading =
    !useDevDemo && showMetricsSkeleton && !heroStats && !operationalPulse;
  const showChartsLoading = isAnalyticsSectionLoading && !useDevDemo;
  const showGoalsLoading = isGoalsInitialLoad && !useDevDemo;

  const dashboardStatusItems = useMemo(
    () =>
      deriveBusinessDashboardStatus(
        {
          isInitialLoading: showMetricsSkeleton,
          isPeriodRefreshing,
          pendingVerification: showPendingVerification,
          verificationStatus: displayStats?.verificationStatus,
          statsLoadFailed,
          socketStatus: connectionStatus,
        },
        t,
      ),
    [
      showMetricsSkeleton,
      isPeriodRefreshing,
      showPendingVerification,
      displayStats?.verificationStatus,
      statsLoadFailed,
      connectionStatus,
      t,
    ],
  );

  if (!user) {
    return <GlobalAppLoadingHold />;
  }

  const { onboardingStatusFromServer } = getAuthSessionFlags();
  if (
    user.role === "business" &&
    onboardingStatusFromServer &&
    !isOnboardingCompleted(user)
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className={cn(businessUi.page, "overflow-x-hidden")}>
      {statsLoadFailed && !isMetricsInitialLoad && !showStatsSkeleton && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">{statsLoadFailed}</p>
          <button
            type="button"
            onClick={retryStats}
            className="mt-2 text-primary hover:underline text-sm font-medium"
          >
            {t("dashboard.tryAgain")}
          </button>
        </div>
      )}
      {user?.impersonation && (
        <div
          className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-primary/15 px-4 py-2.5 text-sm text-foreground"
          role="status"
        >
          <span>{t("business.dashboard.impersonationBanner")}</span>
          <button
            type="button"
            onClick={exitImpersonation}
            className="font-semibold text-foreground underline underline-offset-2"
          >
            {t("business.dashboard.exitImpersonation")}
          </button>
        </div>
      )}

      <div className={businessUi.pageInner}>
        <FixPrompt
          id="pendingVerification"
          issueActive={showPendingVerification}
          tone="info"
          title={
            user?.status === "REJECTED"
              ? t("business.dashboard.verificationBannerRejectedTitle")
              : t("business.dashboard.verificationBannerTitle")
          }
          description={
            user?.status === "REJECTED"
              ? t("business.dashboard.verificationBannerRejectedDesc")
              : t("business.dashboard.verificationBannerDesc")
          }
          actionLabel={t("business.dashboard.verificationBannerCta")}
          actionTo="/verification-pending"
          dismissPersistence="session"
          className="mb-5"
        />
        <DashboardHero
          stackHeroOnMobile
          hideTabs
          actionsPlacement="belowText"
          mobileAlign="left"
          className="business-dashboard-hero mb-7 sm:mb-8 lg:mb-7"
          cardClassName="lg:border-neutral-200/90 lg:bg-gradient-to-br lg:from-white lg:to-stone-50/90 lg:shadow-[0_12px_44px_-20px_rgba(15,23,42,0.16)]"
          badgeClassName="normal-case border-primary/15 bg-primary/[0.06] px-2.5 py-1 text-[11px] max-lg:text-[12px] font-medium tracking-normal text-primary/90 shadow-none"
          titleClassName="max-lg:!leading-[1.05] lg:!leading-[1.08] tracking-tight max-lg:text-left lg:max-w-[14ch] lg:text-left xl:text-[2.35rem]"
          descriptionClassName="!line-clamp-2 max-w-[34ch] leading-relaxed text-muted-foreground/90 max-lg:text-left lg:max-w-md"
          textColumnClassName="lg:py-2 xl:pr-6"
          badge={
            <>
              <Sparkles className="h-3 w-3 shrink-0 text-primary/75" aria-hidden />
              <span>
                {user.name
                  ? t("business.hero.welcomeBackNamed", { name: user.name.split(" ")[0] })
                  : t("business.hero.welcomeBack")}
              </span>
            </>
          }
          title={
            <>
              {t("business.hero.headlineLine1")}
              <br />
              <span className="text-foreground/85">{t("business.hero.headlineLine2")}</span>
            </>
          }
          description={t("business.hero.sub")}
          image={
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="business-hero-visual relative mx-auto flex w-full max-w-full flex-col items-center justify-center touch-manipulation lg:justify-self-center"
            >
              <div
                className={cn(
                  "business-hero-chart-frame dashboard-hero-media-frame relative mx-auto w-full min-h-0 overflow-hidden max-lg:max-w-none",
                  "rounded-[1.75rem]",
                  "lg:h-[420px] lg:max-w-[560px]",
                )}
              >
                <img
                  src={businessHeroImage}
                  alt=""
                  className="block h-full w-full object-cover object-center max-lg:absolute max-lg:inset-0 lg:h-full"
                  loading="eager"
                  decoding="async"
                  {...({ fetchpriority: "high" } as unknown as ImgHTMLAttributes<HTMLImageElement>)}
                />
              </div>
            </motion.div>
          }
          imageOverlay={false}
          actions={
            <motion.div
              className="business-hero-cta-block"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
            >
              <div className="business-hero-cta-row">
                <Button type="button" className={cn(businessUi.btnPrimary, "min-w-0 flex-1")} asChild>
                  <Link to="/dashboard/qr-code-management" className={businessUi.heroCtaLink}>
                    <CareIcon name="tableQr" size="sm" className="shrink-0" />
                    {t("business.hero.manageQr")}
                  </Link>
                </Button>
                <Button type="button" variant="outline" className={cn(businessUi.btnSecondary, "min-w-0 flex-1")} asChild>
                  <Link to="/dashboard/staff-management" className={businessUi.heroCtaLink}>
                    <Users className="h-4 w-4 shrink-0" aria-hidden />
                    {t("business.hero.manageTeam")}
                  </Link>
                </Button>
              </div>
              <dl
                className={cn(
                  "business-hero-account-stats dashboard-swr-swap",
                  heroPulseLoading && "dashboard-hero-account-stats--loading",
                  isPeriodRefreshing && "dashboard-swr-swap--revalidating",
                )}
                aria-label={t("business.hero.pulse.sectionLabel")}
                aria-busy={heroPulseLoading}
              >
                <div>
                  <dt>{t("business.hero.pulse.lastHour")}</dt>
                  <dd>
                    {heroPulseLoading ? (
                      <DashboardHeroMetricSkeleton variant="pulse" />
                    ) : operationalPulse ? (
                      <>
                        <span className="dashboard-hero-metric-value--live">
                          <CountUpMetric
                            value={operationalPulse.tipsLast60m.count}
                            kind="integer"
                            format={(n) => {
                              const count = Math.round(n);
                              return count === 0
                                ? t("format.metricZeroTips")
                                : t("business.hero.pulse.tipsCount", { count });
                            }}
                          />
                        </span>
                        {operationalPulse.tipsLast60m.count > 0 ? (
                          <span className="business-hero-pulse-subline dashboard-hero-metric-value--live text-muted-foreground/90">
                            <CountUpMetric
                              value={operationalPulse.tipsLast60m.amount}
                              kind="eur"
                              format={(n) =>
                                t("business.hero.pulse.volume", { amount: formatEur(n) })
                              }
                            />
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="block">{t("format.noDataYet")}</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>{t("business.hero.pulse.today")}</dt>
                  <dd>
                    {heroPulseLoading ? (
                      <DashboardHeroMetricSkeleton variant="pulse" />
                    ) : operationalPulse ? (
                      <>
                        <span className="dashboard-hero-metric-value--live">
                          <CountUpMetric
                            value={operationalPulse.tipsToday.count}
                            kind="integer"
                            format={(n) => {
                              const count = Math.round(n);
                              return count === 0
                                ? t("format.metricZeroTips")
                                : t("business.hero.pulse.tipsCount", { count });
                            }}
                          />
                        </span>
                        {operationalPulse.tipsToday.count > 0 ? (
                          <span className="business-hero-pulse-subline dashboard-hero-metric-value--live text-muted-foreground/90">
                            <CountUpMetric
                              value={operationalPulse.tipsToday.amount}
                              kind="eur"
                              format={(n) =>
                                t("business.hero.pulse.volume", { amount: formatEur(n) })
                              }
                            />
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="block">{t("format.noDataYet")}</span>
                    )}
                  </dd>
                </div>
              </dl>
            </motion.div>
          }
        />
      </div>

      <TracingBeam className={cn(businessUi.pageInner, "business-dashboard-body !pt-2 sm:!pt-3")}>
        <div className={businessUi.section}>
          <FixPrompt
            id="missingQR"
            issueActive={brokenQrLinks}
            dismissPersistence="session"
            title={t("business.fixQr.title")}
            description={t("business.fixQr.description")}
            actionLabel={t("business.fixQr.action")}
            actionTo="/dashboard/qr-code-management"
          />

          <section className="business-dashboard-analytics-intro" aria-labelledby="business-analytics-period-heading">
            <div className="business-dashboard-analytics-intro__head">
              <div className="min-w-0 space-y-1">
                <h2
                  id="business-analytics-period-heading"
                  className="text-base font-semibold tracking-tight text-foreground"
                >
                  {t("business.dashboard.analyticsSectionTitle")}
                </h2>
              </div>
              <DashboardStatusStrip
                placeholder={showMetricsSkeleton}
                items={dashboardStatusItems}
              />
            </div>
            <DashboardAnalyticsPeriodToggle
              ariaLabel={t("business.dashboard.analyticsPeriodAria")}
              value={analyticsTimeframe}
              onChange={(period) => {
                runWithViewportScrollPreserved(() => setAnalyticsTimeframe(period));
              }}
              options={(["week", "month", "year"] as const).map((period) => ({
                id: period,
                label: analyticsPeriodLabel(period),
                loading: analyticsTimeframeLoading === period,
              }))}
            />
            <DashboardAnalyticsPhaseHintSlot
              className="mt-3"
              show={showChartsLoading && !showMetricsSkeleton}
              label={t("dashboard.loading.analytics")}
            />
          </section>

          <motion.div
            {...dashboardBlockMotion}
            className={cn(
              "business-dashboard-block dashboard-swr-swap",
              isPeriodRefreshing && "dashboard-swr-swap--revalidating",
            )}
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <BusinessDashboardMetricsGrid
              analyticsTimeframe={analyticsTimeframe}
              metrics={
                useDevDemo && devPeriod
                  ? {
                      totalTips: devPeriod.totalTips,
                      tipCount: devPeriod.tipCount,
                      employeeCount: devPeriod.employeeCount,
                    }
                  : displayMetrics
                    ? {
                        ...displayMetrics,
                        employeeCount:
                          activeRosterCount > 0
                            ? activeRosterCount
                            : (displayMetrics.employeeCount ?? 0),
                      }
                    : null
              }
              loading={showMetricsSkeleton}
              isPeriodRefreshing={isPeriodRefreshing}
              hasTipActivityInPeriod={hasTipActivityInPeriod}
              topPerformersCount={topEmployees.length}
            />
          </motion.div>

          <motion.div
            {...dashboardBlockMotion}
            transition={{ delay: 0.35 }}
            className="business-dashboard-block"
          >
            <Card className={cn(businessUi.cardStatic, "business-dashboard-panel-card w-full")}>
              <CardHeader className="business-dashboard-panel-card__header space-y-3">
                <button
                  type="button"
                  onClick={() => setEmployeeGoalsExpanded((v) => !v)}
                  className="flex w-full min-w-0 items-start justify-between gap-3 rounded-lg text-left outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  aria-expanded={employeeGoalsExpanded}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={businessUi.iconTileMuted}>
                      <CareIcon name="goals" size="md" />
                    </div>
                    <CardTitle className="text-lg leading-snug">{t("business.dashboard.employeeGoalsTitle")}</CardTitle>
                  </div>
                </button>
                {employeeGoalsSummary ? (
                  <div className="business-dashboard-goals-summary" aria-label={t("business.dashboard.goalsSummaryAria")}>
                    <span className="business-dashboard-goals-pill business-dashboard-goals-pill--accent">
                      {t("business.dashboard.goalsOnTrack", { count: employeeGoalsSummary.onTrack })}
                    </span>
                    <span className="business-dashboard-goals-pill">
                      {t("business.dashboard.goalsTracked", { count: employeeGoalsSummary.total })}
                    </span>
                  </div>
                ) : null}
              </CardHeader>
              {employeeGoalsExpanded ? (
                <CardContent
                  className={cn(
                    "min-w-0 overflow-x-auto transition-opacity duration-300",
                  )}
                >
                  <DashboardStableChartSlot
                    loading={showGoalsLoading && !useDevDemo}
                    minHeightClass="min-h-[280px]"
                    skeleton={
                      <GoalsTableLoadingShell
                        label={t("dashboard.loading.goals")}
                        columnLabels={goalsTableColumns}
                      />
                    }
                  >
                    {employeeGoalsList.length === 0 ? (
                      <div className={cn(businessUi.cardPad)}>
                        <EmployeeEmptyState
                          className="py-10 sm:py-12"
                          icon={<CareIcon name="goals" size="lg" className="text-muted-foreground" />}
                          title={t("business.dashboard.noStaffGoals")}
                          description={t("business.dashboard.noStaffGoalsHint")}
                        />
                      </div>
                    ) : (
                      <DeferredContentFade show={!showGoalsLoading || useDevDemo}>
                        <table className="w-full min-w-[640px] border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-border text-left text-muted-foreground">
                              {goalsTableColumns.map((col) => (
                                <th key={col} className="pb-2 pr-3 font-medium last:pr-0">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {employeeGoalsList.map((g) => (
                              <tr key={g.employeeId} className="border-b border-border/60 last:border-0">
                                <td className="py-3 pr-3 font-medium text-foreground">{g.name}</td>
                                <td className="py-3 pr-3 text-muted-foreground">
                                  {goalPeriodLabels[g.goalPeriod]}
                                </td>
                                <td className="py-3 pr-3 tabular-nums">{formatEur(g.goalAmount)}</td>
                                <td className="py-3 pr-3 tabular-nums">{formatEur(g.currentAmount)}</td>
                                <td className="py-3 pr-3 tabular-nums font-medium">{g.percent}%</td>
                                <td className={`py-3 font-medium ${goalStatusClass(g.status)}`}>
                                  {t(`business.goalStatus.${g.status}`)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </DeferredContentFade>
                    )}
                  </DashboardStableChartSlot>
                </CardContent>
              ) : null}
            </Card>
          </motion.div>

          {/* Charts Section */}
          <div className={businessUi.analyticsChartsGrid}>
            {/* Tip Distribution Chart */}
            <motion.div
              {...dashboardBlockMotion}
              transition={{ delay: 0.4 }}
              className="flex h-full min-h-0 w-full"
            >
              <Card className={cn(businessUi.cardStatic, "business-dashboard-chart-card business-dashboard-panel-card w-full")}>
                <CardHeader className="business-dashboard-panel-card__header">
                  <CardTitle className="text-lg leading-snug">{t("business.dashboard.dailyTipDistTitle")}</CardTitle>
                </CardHeader>
                <CardContent
                  className={cn(
                    "business-dashboard-panel-card__content min-w-0 flex-1 overflow-x-auto overflow-y-visible transition-opacity duration-300",
                  )}
                >
                  <DashboardStableChartSlot
                    loading={showChartsLoading && !useDevDemo}
                    minHeightClass="min-h-[260px] sm:min-h-[290px]"
                    skeleton={
                      <DashboardChartSkeleton minHeightClass="h-full min-h-0" className="h-full" />
                    }
                  >
                    {!hasTipActivityInPeriod || tipDistributionData.length === 0 ? (
                      <div className={cn(businessUi.cardPad, "business-dashboard-chart-empty")}>
                        <EmployeeEmptyState
                          className="relative z-[1] py-10 sm:py-12"
                          icon={<CareIcon name="analytics" size="lg" className="text-muted-foreground" />}
                          title={t("emptyState.chart.title")}
                          description={t("emptyState.chart.description")}
                        />
                      </div>
                    ) : (
                      <DeferredContentFade show={!showChartsLoading || useDevDemo}>
                        <div className="business-dashboard-chart-frame flex h-[260px] w-full min-w-0 items-center justify-center sm:h-[290px]">
                          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart
                              data={tipDistributionChartData}
                              margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
                              barCategoryGap="18%"
                            >
                              <CartesianGrid strokeDasharray="4 6" stroke={BUSINESS_CHART_GRID} vertical={false} />
                              <XAxis
                                dataKey="dayLabel"
                                stroke={BUSINESS_CHART_AXIS}
                                tickLine={false}
                                axisLine={{ stroke: BUSINESS_CHART_GRID }}
                                style={{ fontSize: "11px" }}
                                tickMargin={8}
                              />
                              <YAxis
                                stroke={BUSINESS_CHART_AXIS}
                                tickLine={false}
                                axisLine={false}
                                style={{ fontSize: "11px" }}
                                tickMargin={8}
                                width={48}
                              />
                              <Tooltip
                                formatter={(value: number) => [formatEur(Number(value)), t("charts.tooltip.tips")]}
                                contentStyle={businessChartTooltipStyle}
                                cursor={{ fill: "rgba(25, 114, 120, 0.06)" }}
                              />
                              <Bar
                                dataKey="amount"
                                fill={BUSINESS_CHART_BAR_SOFT}
                                radius={[6, 6, 0, 0]}
                                maxBarSize={44}
                                minPointSize={3}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="business-dashboard-chart-insight">
                          {t("business.dashboard.chartDistributionTotal", {
                            total: formatEur(tipDistributionTotal),
                          })}
                        </p>
                      </DeferredContentFade>
                    )}
                  </DashboardStableChartSlot>
                </CardContent>
              </Card>
            </motion.div>

            {/* Employee Performance */}
            <motion.div
              {...dashboardBlockMotion}
              transition={{ delay: 0.5 }}
              className="flex h-full min-h-0 w-full"
            >
              <Card className={cn(businessUi.cardStatic, "business-dashboard-chart-card business-dashboard-panel-card w-full")}>
                <CardHeader className="business-dashboard-panel-card__header">
                  <CardTitle className="text-lg leading-snug">{t("business.dashboard.employeePerformanceTitle")}</CardTitle>
                </CardHeader>
                <CardContent
                  className={cn(
                    "business-dashboard-panel-card__content min-w-0 flex-1 overflow-x-auto overflow-y-visible transition-opacity duration-300",
                  )}
                >
                  <DashboardStableChartSlot
                    loading={showChartsLoading && !useDevDemo}
                    minHeightClass="min-h-[260px] sm:min-h-[290px]"
                    skeleton={
                      <DashboardChartSkeleton minHeightClass="h-full min-h-0" className="h-full" />
                    }
                  >
                    {(displayStats?.employeeCount ?? 0) === 0 ? (
                      <div className={cn(businessUi.cardPad)}>
                        <EmployeeEmptyState
                          className="py-10 sm:py-12"
                          icon={<Users className="h-6 w-6 text-muted-foreground" aria-hidden />}
                          title={t("business.dashboard.noEmployees")}
                          description={t("business.dashboard.noEmployeesChartHint")}
                        />
                      </div>
                    ) : !hasTipActivityInPeriod ? (
                      <div className={cn(businessUi.cardPad)}>
                        <EmployeeEmptyState
                          className="py-10 sm:py-12"
                          icon={<TrendingUp className="h-6 w-6 text-muted-foreground" aria-hidden />}
                          title={t("emptyState.chart.title")}
                          description={t("emptyState.chart.description")}
                        />
                      </div>
                    ) : employeePerformance.length === 0 ? (
                      <div className={cn(businessUi.cardPad)}>
                        <EmployeeEmptyState
                          className="py-10 sm:py-12"
                          icon={<TrendingUp className="h-6 w-6 text-muted-foreground" aria-hidden />}
                          title={t("emptyState.chart.title")}
                          description={t("emptyState.chart.description")}
                        />
                      </div>
                    ) : (
                      <DeferredContentFade show={!showChartsLoading || useDevDemo}>
                        <div className="business-dashboard-chart-frame flex h-[260px] w-full min-w-0 items-center justify-center sm:h-[290px]">
                          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart
                              data={employeePerformance}
                              layout="vertical"
                              margin={{ top: 12, right: 16, left: 4, bottom: 4 }}
                              barCategoryGap="16%"
                            >
                              <CartesianGrid strokeDasharray="4 6" stroke={BUSINESS_CHART_GRID} horizontal={false} />
                              <XAxis
                                type="number"
                                stroke={BUSINESS_CHART_AXIS}
                                tickLine={false}
                                axisLine={{ stroke: BUSINESS_CHART_GRID }}
                                style={{ fontSize: "11px" }}
                                tickMargin={8}
                              />
                              <YAxis
                                dataKey="name"
                                type="category"
                                stroke={BUSINESS_CHART_AXIS}
                                tickLine={false}
                                axisLine={false}
                                style={{ fontSize: "11px" }}
                                width={100}
                                tickMargin={6}
                              />
                              <Tooltip
                                formatter={(value: number) => [formatEur(Number(value)), t("charts.tooltip.tips")]}
                                contentStyle={businessChartTooltipStyle}
                                cursor={{ fill: "rgba(25, 114, 120, 0.05)" }}
                              />
                              <Bar dataKey="tips" radius={[0, 6, 6, 0]} maxBarSize={22} minPointSize={4}>
                                {employeePerformance.map((entry, index) => (
                                  <Cell
                                    key={`cell-${entry.name}`}
                                    fill={businessChartBarFill(index, employeePerformance.length)}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="business-dashboard-chart-insight">
                          {t("business.dashboard.chartPerformanceLeader", {
                            name: employeePerformance[0]?.name ?? "—",
                            amount: formatEur(employeePerformance[0]?.tips ?? 0),
                          })}
                        </p>
                      </DeferredContentFade>
                    )}
                  </DashboardStableChartSlot>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent customer feedback */}
          <motion.div {...dashboardBlockMotion} transition={{ delay: 0.55 }}>
            <RecentCustomerFeedbackPanel
              enabled={isBusiness && sessionValidated}
            />
          </motion.div>

          {/* Top Performers & Quick Actions */}
          <div className={businessUi.bottomGrid}>
            {/* Top Performers */}
            <motion.div
              {...dashboardBlockMotion}
              transition={{ delay: 0.6 }}
              className="business-dashboard-bottom-grid__main lg:col-span-2"
            >
              <Card className={cn(businessUi.cardStatic, "business-dashboard-panel-card h-full w-full")}>
                <CardHeader className="business-dashboard-panel-card__header flex flex-row items-center justify-between gap-4 space-y-0">
                  <div className="min-w-0 flex-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => setTopPerformersExpanded((v) => !v)}
                      className="flex w-full min-w-0 items-center justify-between gap-3 text-left"
                      aria-expanded={topPerformersExpanded}
                    >
                      <CardTitle className="text-lg">{t("business.dashboard.topPerformers")}</CardTitle>
                    </button>
                    {topPerformersExpanded && topEmployees.length > 0 ? (
                      <CardDescription className={cn(businessUi.cardDesc, "pr-2")}>
                        {t("business.dashboard.topPerformersPeriodHint", {
                          period: analyticsPeriodLabel(analyticsTimeframe),
                        })}
                      </CardDescription>
                    ) : null}
                  </div>
                  <Link
                    to="/dashboard/staff-management"
                    className="ml-3 flex shrink-0 items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline"
                  >
                    {t("dashboard.viewAll")}
                  </Link>
                </CardHeader>
                {topPerformersExpanded ? (
                  <CardContent
                    className={cn(
                      "transition-opacity duration-300",
                    )}
                  >
                    <DashboardStableChartSlot
                      loading={showChartsLoading && !useDevDemo}
                      minHeightClass="min-h-[160px] sm:min-h-[180px]"
                      skeleton={
                        <DashboardListSkeleton
                          minHeightClass="h-full min-h-0"
                          className="h-full"
                        />
                      }
                    >
                      {topEmployees.length === 0 ? (
                        <div className={cn(businessUi.cardPad)}>
                          <EmployeeEmptyState
                            className="py-8 sm:py-10"
                            icon={<Users className="h-6 w-6 text-muted-foreground" aria-hidden />}
                            title={t("business.dashboard.noEmployees")}
                            description={t("business.dashboard.topPerformersEmptyHint")}
                          />
                        </div>
                      ) : (
                        <DeferredContentFade show={!showChartsLoading || useDevDemo}>
                        <div className="space-y-3">
                        {topEmployees.map((employee, index) => (
                          <div
                            key={employee.id}
                            className={cn(
                              businessUi.listItem,
                              "business-dashboard-top-performer-row flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4",
                            )}
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <span
                                className={cn(
                                  "business-dashboard-top-performer-rank",
                                  index === 0 && "bg-primary/10 text-primary",
                                )}
                                aria-hidden
                              >
                                {index + 1}
                              </span>
                              <div className="business-dashboard-top-performer-avatar relative shrink-0">
                                <ProfileAvatar src={employee.avatar} displayName={employee.name} className="h-12 w-12" />
                                {index === 0 ? (
                                  <span
                                    className="business-dashboard-top-performer-badge absolute right-0 top-0 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background"
                                    role="img"
                                    aria-label={t("business.dashboard.topPerformerBadge")}
                                  >
                                    <CareIcon name="employeePerformance" size="sm" />
                                  </span>
                                ) : null}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="business-dashboard-top-performer-name font-semibold text-foreground">
                                  {employee.name}
                                </h3>
                                <p className="business-dashboard-top-performer-role text-sm text-muted-foreground">
                                  {employee.role}
                                </p>
                              </div>
                            </div>
                            <div className="business-dashboard-top-performer-metrics shrink-0 text-left sm:text-right">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                {t("charts.tooltip.tips")}
                              </p>
                              <p className="text-lg font-bold tabular-nums text-foreground">{formatEur(employee.tips)}</p>
                              <div className="mt-0.5 flex items-center gap-1 text-sm sm:justify-end">
                                {employee.rating != null ? (
                                  <>
                                    <Star className="h-3 w-3 fill-primary text-primary" aria-hidden />
                                    <span className="tabular-nums text-muted-foreground">{employee.rating}</span>
                                  </>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    {t("business.dashboard.newMember")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        </div>
                        </DeferredContentFade>
                      )}
                    </DashboardStableChartSlot>
                  </CardContent>
                ) : null}
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              {...dashboardBlockMotion}
              transition={{ delay: 0.7 }}
              className="business-dashboard-bottom-grid__aside flex h-full flex-col gap-5 sm:gap-6"
            >
              <Card className={cn(businessUi.cardStatic, "business-dashboard-panel-card w-full")}>
                <CardHeader className="business-dashboard-panel-card__header">
                  <button
                    type="button"
                    onClick={() => setQuickActionsExpanded((v) => !v)}
                    className="flex w-full min-w-0 items-start justify-between gap-3 text-left"
                    aria-expanded={quickActionsExpanded}
                  >
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg">{t("business.dashboard.quickActions")}</CardTitle>
                    </div>
                  </button>
                </CardHeader>
                {quickActionsExpanded ? (
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className={cn(businessUi.btnSecondary, "h-auto min-h-11 w-full justify-start gap-3 py-3")}
                      asChild
                    >
                      <Link to="/dashboard/settings?section=business" className="gap-3">
                        <span className={cn(businessUi.iconTileMuted, "!p-0 flex h-10 w-10 items-center justify-center")}>
                          <Building2 className="h-5 w-5" aria-hidden />
                        </span>
                        {t("business.dashboard.actionBusinessProfile")}
                      </Link>
                    </Button>
                    <Button className={cn(businessUi.btnPrimary, "h-auto min-h-11 w-full justify-start gap-3 py-3")} asChild>
                      <Link to="/dashboard/qr-code-management" className="gap-3">
                        <CareIcon name="tableQr" size="md" className="shrink-0" />
                        {t("business.dashboard.actionGenerateQr")}
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className={cn(businessUi.btnSecondary, "h-auto min-h-11 w-full justify-start gap-3 py-3")}
                      asChild
                    >
                      <Link to="/dashboard/locations" className="gap-3">
                        <span className={cn(businessUi.iconTileMuted, "!p-0 flex h-10 w-10 items-center justify-center")}>
                          <MapPin className="h-5 w-5" aria-hidden />
                        </span>
                        {t("business.dashboard.actionManageLocations")}
                      </Link>
                    </Button>
                    {canExportCsv ? (
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(businessUi.btnSecondary, "h-auto min-h-11 w-full justify-start gap-3 py-3")}
                        onClick={handleExport}
                        disabled={exportLoading || !isBusiness}
                        aria-busy={exportLoading}
                      >
                        <span className={cn(businessUi.iconTileMuted, "!p-0 flex h-10 w-10 items-center justify-center")}>
                          {exportLoading ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Download className="h-5 w-5" aria-hidden />
                          )}
                        </span>
                        {t("business.dashboard.actionExportReports")}
                      </Button>
                    ) : null}
                  </CardContent>
                ) : null}
              </Card>

              <Card className={cn(businessUi.cardStatic, "business-dashboard-help-card business-dashboard-panel-card mt-auto w-full")}>
                <CardHeader className="business-dashboard-panel-card__header !pb-2">
                  <div className="business-dashboard-help-head">
                    <div
                      className={cn(
                        businessUi.iconTileMuted,
                        "flex h-10 w-10 shrink-0 items-center justify-center text-primary/85",
                      )}
                      aria-hidden
                    >
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <div className="business-dashboard-help-copy space-y-1">
                      <CardTitle className="text-base leading-snug">{t("business.dashboard.needHelpTitle")}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    type="button"
                    className={cn(businessUi.btnPrimary, "w-full transition-transform active:scale-[0.99]")}
                    onClick={() => setGuidelinesOpen(true)}
                  >
                    {t("business.dashboard.viewGuidelines")}
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
