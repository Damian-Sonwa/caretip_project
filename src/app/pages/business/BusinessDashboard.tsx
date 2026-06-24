import { motion } from "motion/react";
import { dashboardBlockMotion } from "@/lib/motionPerf";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, Navigate } from "react-router";
import type { ImgHTMLAttributes } from "react";
import {
  Users,
  TrendingUp,
  MapPin,
  Star,
  Building2,
  Sparkles,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { CareIcon } from "@/components/icons";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { useSocket, useDeferSocketConnect } from "../../hooks/useSocket";
import { useRealtimeFallback } from "../../hooks/useRealtimeFallback";
import {
  REALTIME_EVENTS,
  type LiveNewTipPayload,
  type RealtimeEventEnvelope,
} from "../../lib/realtime/realtimeContracts";
import { shouldProcessRealtimeEvent } from "../../lib/realtime/realtimeEventDedupe";
import { DashboardStatusStrip } from "../../components/dashboard/DashboardStatusStrip";
import { deriveBusinessDashboardStatus } from "../../lib/dashboardStatus/deriveDashboardStatus";
import { FixPrompt } from "../../components/FixPrompt";
import { useBusinessDashboardStats } from "../../hooks/useBusinessDashboardStats";
import { useSubscriptionEntitlements } from "../../hooks/useSubscriptionEntitlements";
import { FeatureGate } from "../../components/subscription/FeatureGate";
import {
  DashboardHeroMetricSkeleton,
} from "../../components/dashboard/DashboardAnalyticsLoader";
import {
  DashboardAnalyticsPhaseHintSlot,
  DashboardStableChartSlot,
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
import { CareTipUsageGuidelinesDialog } from "../../components/business/CareTipUsageGuidelinesDialog";
import { ProfileAvatar } from "../../components/ui/profile-avatar";
import { cn } from "@/lib/utils";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { PremiumPageHero } from "../../components/premium/PremiumPageHero";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessDashboardMetricsGrid } from "../../components/business/BusinessDashboardMetricsGrid";
import { RecentCustomerFeedbackPanel } from "../../components/business/RecentCustomerFeedbackPanel";
import { TopPerformersTeaser, TOP_PERFORMERS_PAGE_PATH, DASHBOARD_EMPLOYEE_TEASER_LIMIT } from "../../components/business/insights/TopPerformersTeaser";
import { EmployeeEmptyState } from "../../components/employee/EmployeeEmptyState";
import { businessUi } from "../../components/business/businessDashboardUi";
import { BusinessResponsiveData } from "../../components/business/BusinessResponsiveData";
import { EmployeeGoalMobileCard } from "../../components/business/businessDashboardMobileCards";

import {
  devMockBusinessOperationalPulse,
  devMockBusinessPeriodStats,
  shouldUseBusinessDashboardDevDemo,
} from "../../lib/devAnalyticsMocks";
import { getAuthSessionFlags } from "../../lib/authSessionBootstrap";
import { isOnboardingCompleted } from "../../lib/onboardingProgress";
import { isWalkthroughDemoManager } from "../../lib/walkthroughDemo";
import businessHeroImage from "../../../../images/bizzy002.png";

const TOAST_OK = { style: { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } } as const;

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
      void exitImpersonation();
      return;
    }
    logout();
  };

  const { advancedAnalyticsEnabled } = useSubscriptionEntitlements({
    enabled: user?.role === "business" && authReady,
    role: user?.role === "business" ? "business" : null,
  });
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
    isGoalsInitialLoad,
    isPeriodRefreshing,
    showStatsSkeleton,
    refreshStatsQuiet,
    retryStats,
    applyLiveTip,
  } = useBusinessDashboardStats(
    user?.role === "business" && authReady && user.hasCompletedOnboarding === true,
    sessionValidated,
    advancedAnalyticsEnabled,
  );
  const showPendingVerification = businessKycNeedsVerification || pendingVerification === true;

  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [employeeGoalsExpanded, setEmployeeGoalsExpanded] = useState(true);
  /** Mobile-only: expand long “how it works” copy under the employee goals title. */
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(true);
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

    const onNewTip = (raw: LiveNewTipPayload | RealtimeEventEnvelope<LiveNewTipPayload>) => {
      const payload =
        "payload" in raw && raw.payload ? (raw.payload as LiveNewTipPayload) : (raw as LiveNewTipPayload);
      const eventId = "eventId" in raw ? raw.eventId : payload.tip?.id;
      if (!shouldProcessRealtimeEvent(eventId)) return;
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
    };

    socket.on("new_tip", onNewTip);
    socket.on("tip_received", onNewTip);
    socket.on(REALTIME_EVENTS.TIP_RECEIVED, onNewTip);
    return () => {
      socket.off("new_tip", onNewTip);
      socket.off("tip_received", onNewTip);
      socket.off(REALTIME_EVENTS.TIP_RECEIVED, onNewTip);
    };
  }, [socket, user?.role, user?.businessId, t, timeLocale, applyLiveTip]);

  const employees = displayStats?.employees;
  const activeRosterCount = useMemo(
    () =>
      (employees ?? []).filter(
        (e) => e.isActive === true && e.activationStatus === "active" && e.emailVerified === true,
      ).length,
    [employees],
  );
  const topPerformersTeaser = useMemo(() => {
    return (employees ?? [])
      .filter((e) => e.isActive === true && e.activationStatus === "active" && e.emailVerified === true)
      .sort((a, b) => b.tipsTotal - a.tipsTotal)
      .slice(0, DASHBOARD_EMPLOYEE_TEASER_LIMIT)
      .map((e) => ({
        id: e.id,
        name: e.name,
        avatar: e.avatar,
        tips: e.tipsTotal,
      }));
  }, [employees]);

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

  const hasTipActivityInPeriod = useDevDemo || (displayMetrics?.totalTips ?? 0) > 0;

  const employeeGoalsList = displayStats?.employeeGoals ?? [];
  const employeeGoalsTeaser = useMemo(
    () =>
      [...employeeGoalsList]
        .sort((a, b) => b.percent - a.percent)
        .slice(0, DASHBOARD_EMPLOYEE_TEASER_LIMIT),
    [employeeGoalsList],
  );
  const hasMoreGoals = employeeGoalsList.length > DASHBOARD_EMPLOYEE_TEASER_LIMIT;
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

  // ProtectedRoute guarantees user; avoid a second full-screen hold under layout chrome.
  if (!user) {
    return null;
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
            onClick={() => void exitImpersonation()}
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
        <PremiumPageHero personality="overview" className="business-dashboard-hero mb-7 sm:mb-8 lg:mb-7">
        <DashboardHero
          stackHeroOnMobile
          hideTabs
          actionsPlacement="belowText"
          mobileAlign="left"
          className="!mb-0"
          cardClassName="border-0 bg-card shadow-none max-lg:border-0 max-lg:bg-transparent max-lg:shadow-none lg:rounded-[calc(1.75rem-3px)] lg:border-0 lg:bg-card lg:shadow-none"
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
                  <Link to="/dashboard/qr-studio/employees" className={businessUi.heroCtaLink}>
                    <CareIcon name="tableQr" size="sm" className="shrink-0" />
                    {t("business.hero.manageQr")}
                  </Link>
                </Button>
                <Button type="button" variant="outline" className={cn(businessUi.btnSecondary, "min-w-0 flex-1")} asChild>
                  <Link to="/dashboard/team/employees" className={businessUi.heroCtaLink}>
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
        </PremiumPageHero>
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
            actionTo="/dashboard/qr-studio/employees"
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
              show={isPeriodRefreshing && !showMetricsSkeleton}
              label={t("dashboard.loading.secondary")}
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
              topPerformersCount={topPerformersTeaser.length}
            />
          </motion.div>

          <motion.div
            {...dashboardBlockMotion}
            transition={{ delay: 0.35 }}
            className="business-dashboard-block"
          >
            <FeatureGate featureKey="employeeGoals" role="business" enabled={isBusiness}>
            <Card className={cn(businessUi.cardStatic, "business-dashboard-panel-card w-full")}>
              <CardHeader className="business-dashboard-panel-card__header space-y-3">
                <div className="flex w-full min-w-0 items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setEmployeeGoalsExpanded((v) => !v)}
                    className="flex min-w-0 flex-1 items-start gap-3 rounded-lg text-left outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    aria-expanded={employeeGoalsExpanded}
                  >
                    <div className={businessUi.iconTileMuted}>
                      <CareIcon name="goals" size="md" />
                    </div>
                    <CardTitle className="text-lg leading-snug">{t("business.dashboard.employeeGoalsTitle")}</CardTitle>
                  </button>
                  {employeeGoalsList.length > 0 ? (
                    <Link
                      to={TOP_PERFORMERS_PAGE_PATH}
                      className="flex shrink-0 items-center gap-1 pt-1 text-sm font-medium text-primary hover:underline"
                    >
                      {t("business.dashboard.viewAllTopPerformers")}
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </Link>
                  ) : null}
                </div>
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
                    "min-w-0 transition-opacity duration-300",
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
                    {showGoalsLoading && !useDevDemo ? null : employeeGoalsList.length === 0 ? (
                      <div className={cn(businessUi.cardPad)}>
                        <EmployeeEmptyState
                          className="py-10 sm:py-12"
                          icon={<CareIcon name="goals" size="lg" className="text-muted-foreground" />}
                          title={t("business.dashboard.noStaffGoals")}
                          description={t("business.dashboard.noStaffGoalsHint")}
                        />
                      </div>
                    ) : (
                      <>
                        {hasMoreGoals ? (
                          <p className="mb-3 text-xs text-muted-foreground">
                            {t("business.dashboard.goalsTeaserHint", {
                              shown: employeeGoalsTeaser.length,
                              total: employeeGoalsList.length,
                            })}
                          </p>
                        ) : null}
                        <BusinessResponsiveData
                          panelClassName="border-0 bg-transparent shadow-none lg:border lg:border-neutral-200/80 lg:bg-white lg:shadow-[0_10px_36px_-14px_rgba(15,23,42,0.1)]"
                          mobile={
                            <>
                              {employeeGoalsTeaser.map((g) => (
                                <EmployeeGoalMobileCard
                                  key={g.employeeId}
                                  goal={g}
                                  periodLabel={goalPeriodLabels[g.goalPeriod]}
                                  statusLabel={t(`business.goalStatus.${g.status}`)}
                                  statusClassName={goalStatusClass(g.status)}
                                />
                              ))}
                            </>
                          }
                          desktop={
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr className="border-b border-border text-left text-muted-foreground">
                                  {goalsTableColumns.map((col) => (
                                    <th key={col} className="px-4 py-3 font-medium last:pr-0">
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {employeeGoalsTeaser.map((g) => (
                                  <tr key={g.employeeId} className="border-b border-border/60 last:border-0">
                                    <td className="px-4 py-3 font-medium text-foreground">{g.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                      {goalPeriodLabels[g.goalPeriod]}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums">{formatEur(g.goalAmount)}</td>
                                    <td className="px-4 py-3 tabular-nums">{formatEur(g.currentAmount)}</td>
                                    <td className="px-4 py-3 tabular-nums font-medium">{g.percent}%</td>
                                    <td className={`px-4 py-3 font-medium ${goalStatusClass(g.status)}`}>
                                      {t(`business.goalStatus.${g.status}`)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          }
                        />
                      </>
                    )}
                  </DashboardStableChartSlot>
                </CardContent>
              ) : null}
            </Card>
            </FeatureGate>
          </motion.div>

          {/* Recent customer feedback */}
          <motion.div {...dashboardBlockMotion} transition={{ delay: 0.55 }}>
            <RecentCustomerFeedbackPanel
              enabled={isBusiness && sessionValidated}
            />
          </motion.div>

          {/* Top Performers teaser & Quick Actions */}
          <div className={businessUi.bottomGrid}>
            <motion.div
              {...dashboardBlockMotion}
              transition={{ delay: 0.6 }}
              className="business-dashboard-bottom-grid__main lg:col-span-2"
            >
              <FeatureGate featureKey="advancedAnalytics" role="business" enabled={isBusiness}>
                <TopPerformersTeaser
                  employees={topPerformersTeaser}
                  loading={showMetricsSkeleton && !useDevDemo}
                />
              </FeatureGate>
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
                      <Link to="/dashboard/qr-studio/employees" className="gap-3">
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
                    <Button
                      variant="outline"
                      className={cn(businessUi.btnSecondary, "h-auto min-h-11 w-full justify-start gap-3 py-3")}
                      asChild
                    >
                      <Link to="/dashboard/tips/analytics" className="gap-3">
                        <span className={cn(businessUi.iconTileMuted, "!p-0 flex h-10 w-10 items-center justify-center")}>
                          <TrendingUp className="h-5 w-5" aria-hidden />
                        </span>
                        {t("business.dashboard.actionViewAnalytics")}
                      </Link>
                    </Button>
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
