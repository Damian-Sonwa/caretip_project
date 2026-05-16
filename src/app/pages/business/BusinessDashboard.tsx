import { motion } from "motion/react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router";
import type { ImgHTMLAttributes } from "react";
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
  Target,
  ChevronDown,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { translateChartMonthLabel, translateChartWeekdayLabel } from "@/lib/chartAxisLabels";
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
import { BusinessStatCard } from "../../components/business/BusinessStatCard";
import { EmployeeEmptyState } from "../../components/employee/EmployeeEmptyState";
import { businessUi } from "../../components/business/businessDashboardUi";
import {
  devMockBusinessEmployeePerformance,
  devMockBusinessOperationalPulse,
  devMockBusinessPeriodStats,
  devMockBusinessTipDistribution,
  shouldUseBusinessDashboardDevDemo,
} from "../../lib/devAnalyticsMocks";
import barChartHeroImage from "../../../../images/barchart.png";

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
  const { user, logout, isBusiness, exitImpersonation, sessionValidated } = useRequireAuth();

  const handleLogout = () => {
    if (user?.impersonation) {
      exitImpersonation();
      return;
    }
    logout();
  };
  /** Body analytics period — independent from hero venue overview (month). */
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<"week" | "month" | "year">("month");
  const [heroStats, setHeroStats] = useState<BusinessDashboardStats | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [topPerformersExpanded, setTopPerformersExpanded] = useState(true);
  const [employeeGoalsExpanded, setEmployeeGoalsExpanded] = useState(true);
  /** Mobile-only: expand long “how it works” copy under the employee goals title. */
  const [employeeGoalsDetailOpen, setEmployeeGoalsDetailOpen] = useState(false);
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(true);
  const [stats, setStats] = useState<BusinessDashboardStats | null>(null);
  /** Stats fetch only — do not block rendering the dashboard shell. */
  const [statsLoading, setStatsLoading] = useState(true);
  /** Lightweight loading indicator for analyticsTimeframe toggles (no blocking spinner). */
  const [analyticsTimeframeLoading, setAnalyticsTimeframeLoading] = useState<null | "week" | "month" | "year">(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);

  const statsCacheRef = useRef(
    new Map<"week" | "month" | "year", { stats: BusinessDashboardStats; pendingVerification: false } | { stats: null; pendingVerification: true }>()
  );
  /**
   * Only tracks *UI-affecting* requests for the currently selected analyticsTimeframe.
   * Background prefetches must never invalidate the foreground request, otherwise the first load
   * can populate the cache but fail to update cards until the user toggles.
   */
  const uiRequestSeqRef = useRef(0);

  const loadStatsFor = useCallback(
    async (tf: "week" | "month" | "year", opts?: { background?: boolean }) => {
      if (!sessionValidated || !user?.businessId) return;

      const cached = statsCacheRef.current.get(tf);
      if (cached) {
        if (tf === "month" && !cached.pendingVerification) {
          setHeroStats(cached.stats);
        }
        if (tf === analyticsTimeframe) {
          setPendingVerification(cached.pendingVerification);
          setError(null);
          setStats(cached.pendingVerification ? null : cached.stats);
          setStatsLoading(false);
          setAnalyticsTimeframeLoading(null);
        }
        return;
      }

      const affectsUi = !opts?.background && tf === analyticsTimeframe;
      const seq = affectsUi ? ++uiRequestSeqRef.current : 0;
      if (affectsUi) {
        setAnalyticsTimeframeLoading(tf);
      }
      try {
        const data = await getBusinessStats(tf);
        statsCacheRef.current.set(tf, { stats: data, pendingVerification: false });
        if (tf === "month") {
          setHeroStats(data);
        }
        if (tf === analyticsTimeframe && (!affectsUi || uiRequestSeqRef.current === seq)) {
          setPendingVerification(false);
          setError(null);
          setStats(data);
        }
      } catch (err) {
        const msg = toUserFriendlyMessage(err);
        if (msg.toLowerCase().includes("pending verification")) {
          statsCacheRef.current.set(tf, { stats: null, pendingVerification: true });
          if (tf === analyticsTimeframe && (!affectsUi || uiRequestSeqRef.current === seq)) {
            setPendingVerification(true);
            setError(null);
            setStats(null);
          }
        } else if (!opts?.background) {
          logClientError("BusinessDashboard.fetchStats", err);
          if (tf === analyticsTimeframe && (!affectsUi || uiRequestSeqRef.current === seq)) {
            setError(msg);
            setStats(null);
          }
        } else {
          logClientError("BusinessDashboard.prefetchStats", err);
        }
      } finally {
        if (affectsUi) {
          setStatsLoading(false);
          setAnalyticsTimeframeLoading(null);
        }
      }
    },
    [analyticsTimeframe, user?.businessId, sessionValidated]
  );

  const fetchStats = useCallback(async () => {
    if (!sessionValidated || !user?.businessId) {
      setStatsLoading(false);
      return;
    }
    // Only show loading if this analyticsTimeframe is not cached.
    if (!statsCacheRef.current.get(analyticsTimeframe)) setStatsLoading(true);
    await loadStatsFor(analyticsTimeframe);
  }, [user?.businessId, sessionValidated, analyticsTimeframe, loadStatsFor]);

  const refreshStatsQuiet = useCallback(async () => {
    if (!sessionValidated || !user?.businessId) return;
    try {
      const data = await getBusinessStats(analyticsTimeframe);
      statsCacheRef.current.set(analyticsTimeframe, { stats: data, pendingVerification: false });
      if (analyticsTimeframe === "month") {
        setHeroStats(data);
      }
      setStats(data);
    } catch (err) {
      logClientError("BusinessDashboard.refreshStatsQuiet", err);
      /* keep existing stats on background refresh failure */
    }
  }, [user?.businessId, analyticsTimeframe, sessionValidated]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  // Prefetch other analyticsTimeframes after first load for instant toggles.
  useEffect(() => {
    if (!sessionValidated || !user?.businessId) return;
    const others = (["week", "month", "year"] as const).filter((t) => t !== analyticsTimeframe);
    // Defer so it never blocks interaction.
    const id = window.setTimeout(() => {
      others.forEach((t) => void loadStatsFor(t, { background: true }));
    }, 250);
    return () => window.clearTimeout(id);
  }, [loadStatsFor, analyticsTimeframe, user?.businessId, sessionValidated]);

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
      void refreshStatsQuiet();
    };

    socket.on("new_tip", onNewTip);
    return () => {
      socket.off("new_tip", onNewTip);
    };
  }, [socket, user?.role, user?.businessId, refreshStatsQuiet, t, timeLocale]);

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

  const useDevDemo = shouldUseBusinessDashboardDevDemo({
    isDev: import.meta.env.DEV,
    statsLoading,
    pendingVerification,
    tipCount: stats?.tipCount ?? 0,
  });

  const devPeriod = useDevDemo ? devMockBusinessPeriodStats(analyticsTimeframe) : null;
  const analyticsStats: BusinessDashboardStats | null = useDevDemo
    ? {
        ...(stats ?? {}),
        totalTips: devPeriod!.totalTips,
        tipCount: devPeriod!.tipCount,
        employeeCount: devPeriod!.employeeCount,
      }
    : stats;

  const pulseSourceStats = heroStats ?? stats ?? null;
  const operationalPulse = useDevDemo
    ? devMockBusinessOperationalPulse()
    : pulseSourceStats?.operationalPulse;

  const tipDistributionData = useDevDemo
    ? devMockBusinessTipDistribution(analyticsTimeframe)
    : (stats?.dailyTipDistribution ?? []);

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
  }, [useDevDemo, stats?.employees]);

  const hasTipActivityInPeriod = useDevDemo || (analyticsStats?.totalTips ?? 0) > 0;

  const analyticsPeriodLabel = (period: "week" | "month" | "year") => {
    if (period === "week") return t("dashboard.filter_week");
    if (period === "year") return t("dashboard.filter_year");
    return t("dashboard.filter_month");
  };

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
            {t("dashboard.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(businessUi.page, "overflow-x-hidden")}>
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
          issueActive={pendingVerification === true}
          tone="info"
          title={t("business.dashboard.fixVerificationTitle")}
          description={t("business.dashboard.fixVerificationDesc")}
          dismissPersistence="session"
          className="mb-5"
        />
        <DashboardHero
          stackHeroOnMobile
          hideTabs
          actionsPlacement="belowText"
          mobileAlign="left"
          className="business-dashboard-hero mb-8 lg:mb-6"
          cardClassName="lg:border-neutral-200/90 lg:bg-gradient-to-br lg:from-white lg:to-stone-50/90 lg:shadow-[0_12px_44px_-20px_rgba(15,23,42,0.16)]"
          badgeClassName="normal-case border-primary/15 bg-primary/[0.06] px-2.5 py-1 text-[11px] max-lg:text-[12px] font-medium tracking-normal text-primary/90 shadow-none"
          titleClassName="!leading-[1.08] tracking-tight max-lg:text-left lg:max-w-[14ch] lg:text-left xl:text-[2.35rem]"
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
              <span className="block">{t("business.hero.headlineLine1")}</span>
              <span className="block text-foreground/85">{t("business.hero.headlineLine2")}</span>
            </>
          }
          description={t("business.hero.sub")}
          image={
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="business-hero-visual relative flex w-full flex-col items-center justify-center touch-manipulation max-lg:-mx-4 max-lg:w-[calc(100%+2rem)] max-lg:max-w-none sm:max-lg:-mx-5 sm:max-lg:w-[calc(100%+2.5rem)] lg:ml-auto lg:w-full lg:max-w-full"
            >
              <div
                className={cn(
                  "business-hero-chart-frame dashboard-hero-media-frame relative mx-auto w-full min-h-0 overflow-hidden max-lg:max-w-none",
                  "rounded-[1.75rem]",
                  "lg:h-[420px] lg:max-w-[560px]",
                )}
              >
                <img
                  src={barChartHeroImage}
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
                <Button type="button" className={cn(businessUi.btnPrimary, "min-w-0 shrink-0")} asChild>
                  <Link to="/dashboard/qr-code-management" className="inline-flex items-center justify-center gap-2">
                    <QrCode className="h-4 w-4 shrink-0" />
                    {t("business.hero.manageQr")}
                  </Link>
                </Button>
                <Button type="button" variant="ghost" className={cn(businessUi.btnSecondary, "min-w-0 shrink-0")} asChild>
                  <Link to="/dashboard/staff-management" className="inline-flex items-center justify-center gap-2">
                    <Users className="h-4 w-4 shrink-0" />
                    {t("business.hero.manageTeam")}
                  </Link>
                </Button>
              </div>
              <dl className="business-hero-account-stats" aria-label={t("business.hero.pulse.sectionLabel")}>
                <div>
                  <dt>{t("business.hero.pulse.lastHour")}</dt>
                  <dd>
                    {operationalPulse ? (
                      <>
                        <span className="block tabular-nums">
                          {operationalPulse.tipsLast60m.count === 0
                            ? t("format.metricZeroTips")
                            : t("business.hero.pulse.tipsCount", { count: operationalPulse.tipsLast60m.count })}
                        </span>
                        {operationalPulse.tipsLast60m.count > 0 ? (
                          <span className="business-hero-pulse-subline text-muted-foreground/90">
                            {t("business.hero.pulse.volume", { amount: formatEur(operationalPulse.tipsLast60m.amount) })}
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
                    {operationalPulse ? (
                      <>
                        <span className="block tabular-nums">
                          {operationalPulse.tipsToday.count === 0
                            ? t("format.metricZeroTips")
                            : t("business.hero.pulse.tipsCount", { count: operationalPulse.tipsToday.count })}
                        </span>
                        {operationalPulse.tipsToday.count > 0 ? (
                          <span className="business-hero-pulse-subline text-muted-foreground/90">
                            {t("business.hero.pulse.volume", { amount: formatEur(operationalPulse.tipsToday.amount) })}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="block">{t("format.noDataYet")}</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>{t("business.hero.pulse.readiness")}</dt>
                  <dd className="business-hero-pulse-readiness !mt-0 space-y-1">
                    {operationalPulse ? (
                      <>
                        <span className="block tabular-nums leading-tight">
                          {operationalPulse.goalsTracked > 0
                            ? t("business.hero.pulse.goalsProgress", {
                                onTrack: operationalPulse.goalsOnTrackOrBetter,
                                tracked: operationalPulse.goalsTracked,
                              })
                            : t("format.metricZeroGoals")}
                        </span>
                        <span className="business-hero-pulse-subline text-muted-foreground/90">
                          {t("business.hero.pulse.readySubtitle", {
                            ready: operationalPulse.tippingReadyEmployees,
                            total: operationalPulse.rosterTotal,
                          })}
                        </span>
                        <span
                          className={cn(
                            "business-hero-pulse-subline",
                            operationalPulse.employeesMissingQr > 0 ? "font-medium text-amber-900/85" : "text-muted-foreground/90",
                          )}
                        >
                          {operationalPulse.employeesMissingQr > 0
                            ? t("business.hero.pulse.qrIssues", { count: operationalPulse.employeesMissingQr })
                            : t("business.hero.pulse.qrComplete")}
                        </span>
                      </>
                    ) : (
                      <span className="block">{t("format.noDataYet")}</span>
                    )}
                  </dd>
                </div>
              </dl>
              <div className="dashboard-hero-context-bridge">
                <p className="dashboard-hero-context-bridge__text">{t("business.hero.helperText")}</p>
              </div>
            </motion.div>
          }
        />
      </div>

      <TracingBeam className={cn(businessUi.pageInner, "!pt-3 sm:!pt-2")}>
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

          <section className="space-y-3" aria-labelledby="business-analytics-period-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 space-y-1">
                <h2
                  id="business-analytics-period-heading"
                  className="text-base font-semibold tracking-tight text-foreground"
                >
                  {t("business.dashboard.analyticsSectionTitle")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("business.dashboard.analyticsSectionDesc", {
                    period: analyticsPeriodLabel(analyticsTimeframe),
                  })}
                </p>
              </div>
              <LiveConnectionBadge status={connectionStatus} />
            </div>
            <div
              className={businessUi.periodToggle}
              role="group"
              aria-label={t("business.dashboard.analyticsPeriodAria")}
            >
            {(["week", "month", "year"] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => {
                  // Prevent scroll jump: preserve scroll position across the state update.
                  const y = window.scrollY;
                  setAnalyticsTimeframe(period);
                  queueMicrotask(() => {
                    requestAnimationFrame(() => {
                      window.scrollTo({ top: y, left: 0, behavior: "instant" as ScrollBehavior });
                    });
                  });
                }}
                aria-pressed={analyticsTimeframe === period}
                className={cn(
                  businessUi.periodBtn,
                  analyticsTimeframe === period ? businessUi.periodBtnActive : businessUi.periodBtnIdle,
                )}
              >
                {analyticsPeriodLabel(period)}
                {analyticsTimeframeLoading === period ? (
                  <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-current/70 align-middle" aria-hidden />
                ) : null}
              </button>
            ))}
            </div>
          </section>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div className="relative mb-2 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
              <BusinessStatCard
                featured
                label={
                  analyticsTimeframe === "week"
                    ? t("business.dashboard.statsTotalTipsWeek")
                    : analyticsTimeframe === "month"
                      ? t("business.dashboard.statsTotalTipsMonth")
                      : t("business.dashboard.statsTotalTipsYear")
                }
                value={formatEur(analyticsStats?.totalTips ?? 0)}
                change={
                  hasTipActivityInPeriod
                    ? t("business.dashboard.statsLiveTotals")
                    : t("format.metricZeroTips")
                }
                icon={<Euro className="h-5 w-5" aria-hidden />}
              />
              <BusinessStatCard
                label={t("business.dashboard.activeEmployees")}
                value={String(analyticsStats?.employeeCount ?? 0)}
                change={
                  topEmployees.length > 0
                    ? t("business.dashboard.activeEmployeesTopHint", { count: topEmployees.length })
                    : undefined
                }
                icon={<Users className="h-5 w-5" aria-hidden />}
              />
              <BusinessStatCard
                label={t("business.dashboard.tipsCount")}
                value={String(analyticsStats?.tipCount ?? 0)}
                change={hasTipActivityInPeriod ? t("business.dashboard.tipsCountHint") : undefined}
                icon={<Award className="h-5 w-5" aria-hidden />}
              />
              <BusinessStatCard
                label={t("business.dashboard.avgTipPerEmployee")}
                value={
                  analyticsStats?.employeeCount && analyticsStats?.totalTips
                    ? formatEur(analyticsStats.totalTips / analyticsStats.employeeCount, {
                        minFrac: 0,
                        maxFrac: 0,
                      })
                    : formatEur(0, { minFrac: 0, maxFrac: 0 })
                }
                change={t("business.dashboard.avgTipCoaching")}
                icon={<TrendingUp className="h-5 w-5" aria-hidden />}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <Card className={cn(businessUi.cardStatic, "w-full")}>
              <CardHeader className="space-y-3 pb-4">
                <button
                  type="button"
                  onClick={() => setEmployeeGoalsExpanded((v) => !v)}
                  className="flex w-full min-w-0 items-start justify-between gap-3 rounded-lg text-left outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  aria-expanded={employeeGoalsExpanded}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={businessUi.iconTileMuted}>
                      <Target className="h-5 w-5" aria-hidden />
                    </div>
                    <CardTitle className="text-lg leading-snug">{t("business.dashboard.employeeGoalsTitle")}</CardTitle>
                  </div>
                  <ChevronDown
                    className={cn(
                      "mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                      employeeGoalsExpanded && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
                <CardDescription className="hidden lg:block text-pretty">{t("business.dashboard.employeeGoalsDesc")}</CardDescription>
                <div className="lg:hidden space-y-2">
                  <p className="text-sm leading-snug text-muted-foreground">{t("business.dashboard.employeeGoalsDescShort")}</p>
                  {employeeGoalsDetailOpen ? (
                    <>
                      <p className="text-sm leading-relaxed text-muted-foreground">{t("business.dashboard.employeeGoalsDesc")}</p>
                      <button
                        type="button"
                        className="touch-manipulation text-left text-sm font-medium text-primary underline-offset-4 hover:underline"
                        onClick={() => setEmployeeGoalsDetailOpen(false)}
                      >
                        {t("business.dashboard.employeeGoalsLess")}
                      </button>
                    </>
                  ) : (
                      <button
                        type="button"
                        className="touch-manipulation -mx-1 min-h-[44px] rounded-lg px-1 text-left text-sm font-medium text-primary underline-offset-4 hover:underline"
                        onClick={() => setEmployeeGoalsDetailOpen(true)}
                        aria-expanded={employeeGoalsDetailOpen}
                        aria-label={t("business.dashboard.employeeGoalsMoreAria")}
                      >
                      {t("business.dashboard.employeeGoalsMore")}
                    </button>
                  )}
                </div>
              </CardHeader>
              {employeeGoalsExpanded ? (
                <CardContent className="min-w-0 overflow-x-auto">
                  {!stats?.employeeGoals || stats.employeeGoals.length === 0 ? (
                    <div className={cn(businessUi.cardPad)}>
                      <EmployeeEmptyState
                        className="py-10 sm:py-12"
                        icon={<Target className="h-6 w-6 text-muted-foreground" aria-hidden />}
                        title={t("business.dashboard.noStaffGoals")}
                        description={t("business.dashboard.noStaffGoalsHint")}
                      />
                    </div>
                  ) : (
                    <table className="w-full min-w-[640px] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                          <th className="pb-2 pr-3 font-medium">{t("business.dashboard.tableTeamMember")}</th>
                          <th className="pb-2 pr-3 font-medium">{t("business.dashboard.tablePeriod")}</th>
                          <th className="pb-2 pr-3 font-medium tabular-nums">{t("business.dashboard.tableTarget")}</th>
                          <th className="pb-2 pr-3 font-medium tabular-nums">{t("business.dashboard.tableCurrent")}</th>
                          <th className="pb-2 pr-3 font-medium tabular-nums">{t("business.dashboard.tableProgress")}</th>
                          <th className="pb-2 font-medium">{t("business.dashboard.tableStatus")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.employeeGoals.map((g) => (
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
                  )}
                </CardContent>
              ) : null}
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
              <Card className={cn(businessUi.cardStatic, "w-full")}>
                <CardHeader>
                  <CardTitle className="text-lg">{t("business.dashboard.dailyTipDistTitle")}</CardTitle>
                  <CardDescription>
                    {analyticsTimeframe === "week" && t("business.dashboard.dailyTipDistDescWeek")}
                    {analyticsTimeframe === "month" && t("business.dashboard.dailyTipDistDescMonth")}
                    {analyticsTimeframe === "year" && t("business.dashboard.dailyTipDistDescYear")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="min-w-0 overflow-x-auto overflow-y-visible pb-2">
                  {!hasTipActivityInPeriod || tipDistributionData.length === 0 ? (
                    <div className={cn(businessUi.cardPad)}>
                      <EmployeeEmptyState
                        className="py-10 sm:py-12"
                        icon={<BarChart3 className="h-6 w-6 text-muted-foreground" aria-hidden />}
                        title={t("format.metricNoActivity")}
                        description={t("business.dashboard.chartEmptyDesc")}
                      />
                    </div>
                  ) : (
                    <div className="flex h-[260px] w-full min-w-0 items-center justify-center sm:h-[290px]">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart data={tipDistributionChartData} margin={{ top: 10, right: 12, left: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="dayLabel" stroke="#64748b" style={{ fontSize: "12px" }} tickMargin={8} />
                          <YAxis stroke="#64748b" style={{ fontSize: "12px" }} tickMargin={8} width={48} />
                          <Tooltip
                            formatter={(value: number) => [formatEur(Number(value)), t("charts.tooltip.tips")]}
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
              <Card className={cn(businessUi.cardStatic, "w-full")}>
                <CardHeader>
                  <CardTitle className="text-lg">{t("business.dashboard.employeePerformanceTitle")}</CardTitle>
                  <CardDescription>{t("business.dashboard.employeePerformanceDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="min-w-0 overflow-x-auto overflow-y-visible pb-2">
                  {(stats?.employeeCount ?? 0) === 0 ? (
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
                        title={t("format.metricNoActivity")}
                        description={t("business.dashboard.chartEmptyDesc")}
                      />
                    </div>
                  ) : employeePerformance.length === 0 ? (
                    <div className={cn(businessUi.cardPad)}>
                      <EmployeeEmptyState
                        className="py-10 sm:py-12"
                        icon={<TrendingUp className="h-6 w-6 text-muted-foreground" aria-hidden />}
                        title={t("format.metricNoActivity")}
                        description={t("business.dashboard.chartEmptyDesc")}
                      />
                    </div>
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
                            formatter={(value: number) => [formatEur(Number(value)), t("charts.tooltip.tips")]}
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
              <Card className={cn(businessUi.cardStatic, "w-full")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <button
                    type="button"
                    onClick={() => setTopPerformersExpanded((v) => !v)}
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                    aria-expanded={topPerformersExpanded}
                  >
                    <CardTitle className="text-lg">{t("business.dashboard.topPerformers")}</CardTitle>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                        topPerformersExpanded && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>
                  <Link
                    to="/dashboard/staff-management"
                    className="ml-3 flex shrink-0 items-center gap-1 text-sm font-medium text-foreground hover:underline"
                  >
                    {t("dashboard.viewAll")}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </CardHeader>
                {topPerformersExpanded ? (
                  <CardContent>
                    <div className="space-y-3">
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
                        topEmployees.map((employee, index) => (
                          <div
                            key={employee.id}
                            className={cn(
                              businessUi.listItem,
                              "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4",
                            )}
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
                                  <span className="text-xs text-muted-foreground">
                                    {t("business.dashboard.newMember")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                ) : null}
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="space-y-4"
            >
              <Card className={cn(businessUi.cardStatic, "w-full")}>
                <CardHeader>
                  <button
                    type="button"
                    onClick={() => setQuickActionsExpanded((v) => !v)}
                    className="flex w-full min-w-0 items-start justify-between gap-3 text-left"
                    aria-expanded={quickActionsExpanded}
                  >
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg">{t("business.dashboard.quickActions")}</CardTitle>
                      <CardDescription>{t("business.dashboard.quickActionsDesc")}</CardDescription>
                    </div>
                    <ChevronDown
                      className={cn(
                        "mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                        quickActionsExpanded && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>
                </CardHeader>
                {quickActionsExpanded ? (
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className={cn(businessUi.btnSecondary, "h-auto min-h-11 w-full justify-start gap-3 py-3")}
                      asChild
                    >
                      <Link to="/dashboard/profile" className="gap-3">
                        <span className={cn(businessUi.iconTileMuted, "!p-0 flex h-10 w-10 items-center justify-center")}>
                          <Building2 className="h-5 w-5" aria-hidden />
                        </span>
                        {t("business.dashboard.actionBusinessProfile")}
                      </Link>
                    </Button>
                    <Button className={cn(businessUi.btnPrimary, "h-auto min-h-11 w-full justify-start gap-3 py-3")} asChild>
                      <Link to="/dashboard/qr-code-management" className="gap-3">
                        <QrCode className="h-5 w-5 shrink-0" aria-hidden />
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
                  </CardContent>
                ) : null}
              </Card>

              <Card className={cn(businessUi.cardStatic, "w-full")}>
                <CardHeader>
                  <CardTitle className="text-base">{t("business.dashboard.needHelpTitle")}</CardTitle>
                  <CardDescription>{t("business.dashboard.needHelpDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button type="button" className={cn(businessUi.btnPrimary, "w-full")} onClick={() => setGuidelinesOpen(true)}>
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
