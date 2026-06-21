import { lazy, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { dashboardBlockMotion } from "@/lib/motionPerf";
import { CheckCircle, Search, XCircle } from "lucide-react";
import { CareIcon, createCareStatIcon } from "@/components/icons";
import {
  fetchPlatformHealth,
  fetchPlatformStats,
  fetchPlatformBusinesses,
  fetchPlatformAnalytics,
  clearPlatformAnalyticsClientCache,
  type PlatformHealthResponse,
  type PlatformGlobalStats,
  type PlatformBusinessRow,
  type PlatformAnalytics,
} from "../lib/api";
import { logClientError } from "../lib/clientLog";
import { formatEur } from "../lib/formatEur";
import { toUserFriendlyMessage } from "../lib/errorMessages";
import { BusinessLogoMark } from "./business/BusinessLogoMark";
import { FixPrompt } from "./FixPrompt";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import { useRealtimeFallback } from "../hooks/useRealtimeFallback";
import { DashboardStatusStrip } from "./dashboard/DashboardStatusStrip";
import { derivePlatformAdminDashboardStatus } from "../lib/dashboardStatus/deriveDashboardStatus";
import { NetworkOverviewHero } from "./NetworkOverviewHero";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { BorderBeam } from "@/components/ui/border-beam";
import { cn } from "@/lib/utils";
import { platformUi } from "./platform/platformDashboardUi";
import { PlatformBusinessMobileCard } from "./platform/PlatformBusinessMobileCard";
import {
  DashboardHeroMetricSkeleton,
} from "./dashboard/DashboardAnalyticsLoader";
import { PlatformStatCard } from "./platform/PlatformStatCard";
import { runWithViewportScrollPreserved } from "../lib/dashboardScrollStability";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardChartsIdleMount } from "./dashboard/DashboardChartsIdleMount";
import { AdminDashboardAnalyticsChartsFallback } from "./AdminDashboardAnalyticsChartsFallback";

const AdminDashboardAnalyticsCharts = lazy(() =>
  import("./AdminDashboardAnalyticsCharts").then((mod) => ({
    default: mod.AdminDashboardAnalyticsCharts,
  })),
);

interface AdminStatCardProps {
  title: string;
  value: string;
  numericValue?: number;
  countUpKind?: "eur" | "eur-whole" | "integer" | "decimal" | "percent";
  change?: string;
  icon: React.ElementType;
  delay: number;
  beam?: boolean;
  wideOnTablet?: boolean;
  loading?: boolean;
  loadingVariant?: "currency" | "count" | "pulse";
}

function AdminStatCard({
  title,
  value,
  numericValue,
  countUpKind = "integer",
  change,
  icon: Icon,
  delay,
  beam,
  wideOnTablet,
  loading,
  loadingVariant = "count",
}: AdminStatCardProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      {...dashboardBlockMotion}
      transition={{
        ...dashboardBlockMotion.transition,
        delay: reduceMotion || !loading ? 0 : delay * 0.5,
      }}
      className={cn(
        "h-full min-w-0",
        wideOnTablet && "sm:col-span-2 lg:col-span-2 min-[1536px]:col-span-1",
      )}
    >
      <div className="relative h-full overflow-hidden rounded-2xl">
        {beam && !reduceMotion && !loading ? (
          <BorderBeam size={220} duration={20} colorFrom="#e9932f" colorTo="#000000" />
        ) : null}
        <PlatformStatCard
          label={title}
          value={value}
          numericValue={numericValue}
          countUpKind={countUpKind}
          change={change}
          icon={<Icon className="h-5 w-5" aria-hidden />}
          featured={beam}
          loading={loading}
          loadingVariant={loadingVariant}
          className={cn(
            "h-full transition-shadow hover:shadow-md",
            loading && "platform-admin-stat-card--loading",
          )}
        />
      </div>
    </motion.div>
  );
}

const ADMIN_ANALYTICS_TZ_KEY = "caretip_platform_admin_timezone";
const ADMIN_ANALYTICS_TZ_DEFAULT = "Europe/Berlin";
const ADMIN_ANALYTICS_TZ_OPTIONS = [
  "Europe/Berlin",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Africa/Lagos",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
] as const;

// Session-memory snapshot (no persistence): paints instantly within same session.
type AdminSessionSnapshot = {
  stats: PlatformGlobalStats | null;
  businesses: PlatformBusinessRow[];
  analytics: PlatformAnalytics | null;
  health: PlatformHealthResponse | null;
  at: number;
};

let adminSessionSnapshot: AdminSessionSnapshot | null = null;

function analyticsHasVisibleData(a: PlatformAnalytics): boolean {
  const tipVol = a.tipVolume.reduce((s, r) => s + (r.tipsEur ?? 0), 0);
  const tipCount = a.tipStatus.reduce((s, r) => s + (r.count ?? 0), 0);
  const users = a.userDistribution.reduce((s, r) => s + (r.count ?? 0), 0);
  const growth = a.growth.some((r) => r.newUsers > 0 || r.newBusinesses > 0 || r.newTips > 0);
  return tipVol > 0 || tipCount > 0 || users > 0 || growth || (a.topBusinessesByTips?.length ?? 0) > 0;
}

/** Align tip-status chart with lifetime stat cards when analytics status rows are empty. */
function mergeTipStatusForCharts(
  analytics: PlatformAnalytics,
  stats: PlatformGlobalStats | null,
): PlatformAnalytics["tipStatus"] {
  const rows = analytics.tipStatus;
  const sum = rows.reduce((s, r) => s + (r.count ?? 0), 0);
  if (sum > 0 || !stats) return rows;
  const success = stats.successTransactionCount ?? 0;
  const total = stats.transactionCount ?? 0;
  const pending = Math.max(0, total - success);
  return [
    { status: "success", count: success },
    { status: "pending", count: pending },
    { status: "failed", count: 0 },
  ];
}

/**
 * Super Admin home: global platform stats + all businesses (live aggregates).
 * Renders inside SuperAdminLayout only (no business dashboard UI).
 */
export function AdminDashboard() {
  const { t } = useTranslation();
  const { user, authHydrated, sessionValidated } = useAuth();
  const { socket, connected, connectionStatus } = useSocket(
    Boolean(user?.role === "platform_admin" && authHydrated && sessionValidated),
  );

  const [health, setHealth] = useState<PlatformHealthResponse | null>(null);
  const [stats, setStats] = useState<PlatformGlobalStats | null>(null);
  const [businesses, setBusinesses] = useState<PlatformBusinessRow[]>([]);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [analyticsTimezone, setAnalyticsTimezone] = useState<string>(() => {
    try {
      const raw = localStorage.getItem(ADMIN_ANALYTICS_TZ_KEY);
      return raw?.trim() || ADMIN_ANALYTICS_TZ_DEFAULT;
    } catch {
      return ADMIN_ANALYTICS_TZ_DEFAULT;
    }
  });
  const [serviceIssue, setServiceIssue] = useState<string | null>(null);
  const [businessSearchQuery, setBusinessSearchQuery] = useState("");
  const [businessesExpanded, setBusinessesExpanded] = useState(true);
  /** First full platform stats + businesses fetch only (background refreshes do not flash loaders). */
  const [initialDashLoading, setInitialDashLoading] = useState(true);
  const dashboardLoadGenRef = useRef(0);
  const analyticsLoadGenRef = useRef(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [analyticsSyncing, setAnalyticsSyncing] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [analyticsUpdatedAt, setAnalyticsUpdatedAt] = useState<number | null>(null);
  const businessesDeferTimerRef = useRef<number | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const metricsRefreshTimerRef = useRef<number | null>(null);
  const sessionHydratedRef = useRef(false);
  const analyticsTimezoneRef = useRef(analyticsTimezone);
  analyticsTimezoneRef.current = analyticsTimezone;

  const emptyAnalytics = useMemo<PlatformAnalytics>(() => {
    const rangeDays = 30;
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - (rangeDays - 1));
    const growth: PlatformAnalytics["growth"] = [];
    const tipVolume: PlatformAnalytics["tipVolume"] = [];
    for (let i = 0; i < rangeDays; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      growth.push({ date: iso, newUsers: 0, newBusinesses: 0, newTips: 0 });
      tipVolume.push({ date: iso, tipsEur: 0, tipCount: 0 });
    }
    return {
      rangeDays,
      userDistribution: [
        { role: "business", count: 0 },
        { role: "employee", count: 0 },
        { role: "platform_admin", count: 0 },
      ],
      tipStatus: [
        { status: "success", count: 0 },
        { status: "pending", count: 0 },
        { status: "failed", count: 0 },
      ],
      growth,
      tipVolume,
      topBusinessesByTips: [],
    };
  }, []);

  const filteredBusinesses = useMemo(() => {
    const q = businessSearchQuery.trim().toLowerCase();
    if (!q) return businesses;
    return businesses.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        b.ownerEmail.toLowerCase().includes(q)
    );
  }, [businesses, businessSearchQuery]);

  useEffect(() => {
    if (!authHydrated || !sessionValidated || !user || user.role !== "platform_admin") return;
    let cancelled = false;
    void fetchPlatformHealth()
      .then((h) => {
        if (!cancelled) setHealth(h);
      })
      .catch((err: unknown) => {
        logClientError("AdminDashboard.fetchPlatformHealth", err);
        if (!cancelled) setHealth({ database: "offline", stripe: "offline" });
      });
    return () => {
      cancelled = true;
    };
  }, [user, authHydrated, sessionValidated]);

  const persistSessionSnapshot = useCallback(
    (
      next: Partial<{
        stats: PlatformGlobalStats | null;
        businesses: PlatformBusinessRow[];
        analytics: PlatformAnalytics | null;
        health: PlatformHealthResponse | null;
      }>,
    ) => {
      adminSessionSnapshot = {
        stats: next.stats ?? adminSessionSnapshot?.stats ?? null,
        businesses: next.businesses ?? adminSessionSnapshot?.businesses ?? [],
        analytics: next.analytics ?? adminSessionSnapshot?.analytics ?? null,
        health: next.health ?? adminSessionSnapshot?.health ?? null,
        at: Date.now(),
      };
    },
    [],
  );

  const loadAnalytics = useCallback(
    async (gen: number, opts?: { bustCache?: boolean }) => {
      const tz = analyticsTimezoneRef.current;
      if (opts?.bustCache) clearPlatformAnalyticsClientCache(30, tz);
      setAnalyticsSyncing(true);
      setAnalyticsError(null);
      try {
        const a = await fetchPlatformAnalytics(30, tz);
        if (gen !== analyticsLoadGenRef.current) return;
        if (a.warning) {
          setAnalyticsError(a.warning);
        } else {
          setAnalyticsError(null);
        }
        // Still hydrate charts from the safe payload (zeros) so Recharts mounts; stats cards stay separate.
        setAnalytics(a);
        setAnalyticsUpdatedAt(Date.now());
        persistSessionSnapshot({ analytics: a });
      } catch (e) {
        if (gen !== analyticsLoadGenRef.current) return;
        logClientError("AdminDashboard.analytics", e);
        const msg = toUserFriendlyMessage(e);
        setAnalyticsError(msg || t("admin.analyticsLoadFailed"));
        setAnalytics((prev) => prev ?? null);
      } finally {
        if (gen === analyticsLoadGenRef.current) setAnalyticsSyncing(false);
      }
    },
    [persistSessionSnapshot, t],
  );

  const refreshStats = useCallback(
    async (loadGen: number) => {
      const s = await fetchPlatformStats();
      if (loadGen !== dashboardLoadGenRef.current) return;
      setStats(s);
      persistSessionSnapshot({ stats: s });
    },
    [persistSessionSnapshot],
  );

  const refreshBusinesses = useCallback(
    async (loadGen: number) => {
      const b = await fetchPlatformBusinesses();
      if (loadGen !== dashboardLoadGenRef.current) return;
      setBusinesses(b.businesses);
      persistSessionSnapshot({ businesses: b.businesses });
    },
    [persistSessionSnapshot],
  );

  const refreshMetrics = useCallback(() => {
    if (!authHydrated || !sessionValidated || !user || user.role !== "platform_admin") return;
    const statsGen = ++dashboardLoadGenRef.current;
    const analyticsGen = ++analyticsLoadGenRef.current;
    void refreshStats(statsGen).catch((err: unknown) => {
      logClientError("AdminDashboard.refreshStats", err);
    });
    void loadAnalytics(analyticsGen, { bustCache: true });
  }, [user, authHydrated, sessionValidated, refreshStats, loadAnalytics]);

  const scheduleDeferredBusinesses = useCallback(
    (loadGen: number) => {
      if (businessesDeferTimerRef.current != null) {
        window.clearTimeout(businessesDeferTimerRef.current);
      }
      businessesDeferTimerRef.current = window.setTimeout(() => {
        businessesDeferTimerRef.current = null;
        void refreshBusinesses(loadGen).catch((err: unknown) => {
          logClientError("AdminDashboard.refreshBusinesses", err);
        });
      }, 50);
    },
    [refreshBusinesses],
  );

  const loadDashboardData = useCallback(async () => {
    if (!authHydrated || !sessionValidated || !user || user.role !== "platform_admin") return;
    const loadGen = ++dashboardLoadGenRef.current;
    const analyticsGen = ++analyticsLoadGenRef.current;
    setIsSyncing(true);
    setServiceIssue(null);
    setAnalyticsError(null);

    void refreshStats(loadGen)
      .then(() => {
        if (loadGen === dashboardLoadGenRef.current) setInitialDashLoading(false);
      })
      .catch((err: unknown) => {
        if (loadGen !== dashboardLoadGenRef.current) return;
        logClientError("AdminDashboard.refreshStats", err);
      })
      .finally(() => {
        if (loadGen === dashboardLoadGenRef.current) setIsSyncing(false);
      });

    void loadAnalytics(analyticsGen, { bustCache: false });

    scheduleDeferredBusinesses(loadGen);
  }, [
    user,
    authHydrated,
    sessionValidated,
    refreshStats,
    loadAnalytics,
    scheduleDeferredBusinesses,
  ]);

  useEffect(() => {
    if (!authHydrated || !sessionValidated || !user || user.role !== "platform_admin") return;
    if (!sessionHydratedRef.current && adminSessionSnapshot) {
      sessionHydratedRef.current = true;
      setStats(adminSessionSnapshot.stats);
      setBusinesses(adminSessionSnapshot.businesses);
      setAnalytics(adminSessionSnapshot.analytics);
      if (adminSessionSnapshot.analytics) setAnalyticsUpdatedAt(adminSessionSnapshot.at);
      setHealth(adminSessionSnapshot.health);
      setInitialDashLoading(false);
    }
    void loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per auth session
  }, [authHydrated, sessionValidated, user?.id, user?.role]);

  useEffect(() => {
    if (!authHydrated) return;
    return () => {
      if (metricsRefreshTimerRef.current != null) {
        window.clearTimeout(metricsRefreshTimerRef.current);
        metricsRefreshTimerRef.current = null;
      }
      if (businessesDeferTimerRef.current != null) {
        window.clearTimeout(businessesDeferTimerRef.current);
        businessesDeferTimerRef.current = null;
      }
    };
  }, [authHydrated]);

  // If the API is down (503), don't keep hammering it on a timer.
  useRealtimeFallback(connected || Boolean(serviceIssue), refreshMetrics);

  useEffect(() => {
    if (!socket || user?.role !== "platform_admin") return;
    const scheduleFullRefresh = () => {
      if (refreshTimerRef.current != null) window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null;
        void loadDashboardData();
      }, 900);
    };
    const scheduleMetricsRefresh = () => {
      if (metricsRefreshTimerRef.current != null) window.clearTimeout(metricsRefreshTimerRef.current);
      metricsRefreshTimerRef.current = window.setTimeout(() => {
        metricsRefreshTimerRef.current = null;
        refreshMetrics();
      }, 600);
    };
    socket.on("platform_data_updated", scheduleFullRefresh);
    socket.on("platform_verification_updated", scheduleFullRefresh);
    socket.on("platform_metrics_updated", scheduleMetricsRefresh);
    return () => {
      socket.off("platform_data_updated", scheduleFullRefresh);
      socket.off("platform_verification_updated", scheduleFullRefresh);
      socket.off("platform_metrics_updated", scheduleMetricsRefresh);
      if (metricsRefreshTimerRef.current != null) {
        window.clearTimeout(metricsRefreshTimerRef.current);
        metricsRefreshTimerRef.current = null;
      }
    };
  }, [socket, user?.role, loadDashboardData, refreshMetrics]);

  const chartAnalytics = analytics;
  const hasPlatformStats = Boolean(stats);
  const hasPlatformCharts = Boolean(chartAnalytics);
  const showStatLoading = !hasPlatformStats && initialDashLoading;
  const showChartSkeletons = !hasPlatformCharts && initialDashLoading;
  const analyticsMeta = chartAnalytics ?? emptyAnalytics;
  const chartTipStatus = useMemo(
    () =>
      chartAnalytics ? mergeTipStatusForCharts(chartAnalytics, stats) : analyticsMeta.tipStatus,
    [chartAnalytics, stats, analyticsMeta.tipStatus],
  );
  const chartsLookEmpty =
    Boolean(stats?.successTransactionCount) &&
    (chartAnalytics
      ? !analyticsHasVisibleData({
          ...chartAnalytics,
          tipStatus: chartTipStatus,
        })
      : false);

  const pendingVerificationCount = useMemo(
    () => businesses.filter((b) => b.verificationStatus === "pending").length,
    [businesses],
  );

  const adminStatusItems = useMemo(
    () =>
      derivePlatformAdminDashboardStatus(
        {
          isInitialLoading: showStatLoading,
          isSyncing,
          analyticsSyncing,
          serviceIssue,
          socketStatus: connectionStatus,
          pendingVerificationCount,
        },
        t,
      ),
    [
      showStatLoading,
      isSyncing,
      analyticsSyncing,
      serviceIssue,
      connectionStatus,
      pendingVerificationCount,
      t,
    ],
  );

  if (!authHydrated || !sessionValidated || !user) {
    return null;
  }
  if (user.role !== "platform_admin") {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <main className="bg-background">
      <div className={platformUi.page}>
        <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
          <DashboardStatusStrip
            placeholder={showStatLoading}
            items={adminStatusItems}
            className="justify-end"
          />
        </div>
        <NetworkOverviewHero health={health} />

        <TracingBeam>
          <FixPrompt
            id="platformDataLoad"
            issueActive={Boolean(serviceIssue)}
            dismissPersistence="session"
            title={t("admin.loadErrorTitle")}
            description={serviceIssue ?? undefined}
            actionLabel={t("admin.retry")}
            onAction={() => void loadDashboardData()}
            className="mb-6"
          />
          <div
            className={cn(
              platformUi.statGrid,
              showStatLoading && "platform-admin-stat-grid--loading",
            )}
            aria-busy={showStatLoading || undefined}
          >
          <AdminStatCard
            title={t("admin.statTips")}
            value={stats ? formatEur(stats.totalVolumeEur) : t("format.notAvailable")}
            numericValue={stats?.totalVolumeEur}
            countUpKind="eur"
            loading={showStatLoading}
            loadingVariant="currency"
            change={
              stats
                ? t("admin.statTipsChange", {
                    success: stats.successTransactionCount,
                    total: stats.transactionCount,
                    biz:
                      typeof stats.businessesWithSuccessfulTips === "number"
                        ? t("admin.statTipsBizPart", { count: stats.businessesWithSuccessfulTips })
                        : "",
                  })
                : undefined
            }
            icon={createCareStatIcon("tips")}
            delay={0.1}
            beam
            wideOnTablet
          />
          <AdminStatCard
            title={t("admin.statVenues")}
            value={stats ? String(stats.businessesCount) : t("format.notAvailable")}
            numericValue={stats?.businessesCount}
            loading={showStatLoading}
            change={t("admin.statVenuesChange")}
            icon={createCareStatIcon("hospitalityVenue")}
            delay={0.15}
          />
          <AdminStatCard
            title={t("admin.statLocations")}
            value={stats ? String(stats.locationsCount) : t("format.notAvailable")}
            numericValue={stats?.locationsCount}
            loading={showStatLoading}
            change={t("admin.statLocationsChange")}
            icon={createCareStatIcon("locations")}
            delay={0.18}
          />
          <AdminStatCard
            title={t("admin.statStaff")}
            value={stats ? String(stats.employeesCount) : t("format.notAvailable")}
            numericValue={stats?.employeesCount}
            loading={showStatLoading}
            change={t("admin.statStaffChange")}
            icon={createCareStatIcon("team")}
            delay={0.2}
          />
          <AdminStatCard
            title={t("admin.statActiveUsers")}
            value={stats ? String(stats.activeUsersCount) : t("format.notAvailable")}
            numericValue={stats?.activeUsersCount}
            loading={showStatLoading}
            change={t("admin.statActiveUsersChange")}
            icon={createCareStatIcon("users")}
            delay={0.25}
          />
        </div>

        {/* Analytics charts — Recharts lazy-loaded after stat cards paint */}
        <DashboardChartsIdleMount fallback={<AdminDashboardAnalyticsChartsFallback />}>
          <AdminDashboardAnalyticsCharts
            showChartSkeletons={showChartSkeletons}
            chartAnalytics={chartAnalytics}
            chartTipStatus={chartTipStatus}
            chartsLookEmpty={chartsLookEmpty}
            analyticsError={analyticsError}
            analyticsMeta={analyticsMeta}
            analyticsTimezone={analyticsTimezone}
            analyticsSyncing={analyticsSyncing}
            analyticsUpdatedAt={analyticsUpdatedAt}
            onTimezoneChange={(v) => {
              runWithViewportScrollPreserved(() => {
                setAnalyticsTimezone(v);
                analyticsTimezoneRef.current = v;
                try {
                  localStorage.setItem(ADMIN_ANALYTICS_TZ_KEY, v);
                } catch {
                  // ignore
                }
                const nextGen = ++analyticsLoadGenRef.current;
                void loadAnalytics(nextGen, { bustCache: true });
              });
            }}
            onRetryAnalytics={() => {
              const nextGen = ++analyticsLoadGenRef.current;
              void loadAnalytics(nextGen, { bustCache: true });
            }}
          />
        </DashboardChartsIdleMount>

        <motion.div
          {...dashboardBlockMotion}
          transition={{ ...dashboardBlockMotion.transition, delay: 0.12 }}
          className={platformUi.businessesPanel}
        >
          <div className={platformUi.businessesPanelHeader}>
            <button
              type="button"
              onClick={() => setBusinessesExpanded((v) => !v)}
              className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
              aria-expanded={businessesExpanded}
            >
              <div className="flex min-w-0 items-center gap-2">
                <CareIcon name="hospitalityVenue" size="md" className="text-foreground" />
                <h3 className="min-w-0 text-base font-semibold leading-snug text-foreground sm:text-lg">
                  <span className="block sm:inline">{t("admin.businessesTitle")}</span>
                  <span className="mt-0.5 block text-xs font-medium text-muted-foreground sm:ml-2 sm:mt-0 sm:inline">
                    {t("admin.businessesSubtitle")}
                  </span>
                </h3>
              </div>
            </button>

            <Link
              to="/platform-admin/businesses"
              className="shrink-0 text-xs font-medium text-foreground underline-offset-4 hover:underline sm:text-sm"
            >
              {t("admin.businessesOpen")}
            </Link>
          </div>

          {businessesExpanded ? (
            <>
              {businesses.length > 0 && (
                <div className={platformUi.businessesSearchWrap}>
                  <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="search"
                      value={businessSearchQuery}
                      onChange={(e) => setBusinessSearchQuery(e.target.value)}
                      placeholder={t("admin.searchBusinessesPlaceholder")}
                      autoComplete="off"
                      aria-label={t("admin.searchBusinessesAria")}
                      className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                  </div>
                </div>
              )}
              {businesses.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">{t("admin.noBusinesses")}</p>
              ) : filteredBusinesses.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">{t("admin.noSearchMatches")}</p>
              ) : (
                <>
                  <div className={platformUi.businessesMobileList}>
                    {filteredBusinesses.map((b) => (
                      <PlatformBusinessMobileCard key={b.id} business={b} />
                    ))}
                  </div>
                  <div className={platformUi.businessesTableWrap}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted text-left">
                        <th className="px-4 py-3 font-medium text-muted-foreground">{t("admin.colBusiness")}</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">{t("admin.colOwner")}</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">{t("admin.colStatus")}</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                          {t("admin.colTipsEur")}
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                          {t("admin.colStaffLoc")}
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                          {t("admin.colActions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBusinesses.map((b) => (
                        <tr key={b.id} className="border-b border-border hover:bg-muted/50">
                          <td className="px-2 py-3 align-middle">
                            <BusinessLogoMark
                              logoPathOrUrl={b.logoPath ?? null}
                              businessName={b.name}
                              size="sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{b.name}</div>
                            <div className="font-mono text-xs text-muted-foreground">{b.slug}</div>
                          </td>
                          <td className="px-4 py-3 text-xs">{b.ownerEmail}</td>
                          <td className="px-4 py-3">
                            {b.verificationStatus === "verified" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-xs font-medium text-success-foreground">
                                <CheckCircle className="h-3.5 w-3.5" /> {t("admin.verification.verified")}
                              </span>
                            ) : b.verificationStatus === "rejected" ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
                                <XCircle className="h-3.5 w-3.5" /> {t("admin.verification.rejected")}
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-amber-700">
                                {t("admin.verification.pending")}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {formatEur(b.totalTipsEur ?? 0)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                            {b.staffCount ?? 0} / {b.locationCount ?? 0}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to={`/platform-admin/businesses/${b.id}`}
                              className="text-xs font-medium text-foreground underline-offset-2 hover:underline"
                            >
                              {t("admin.view")}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </>
              )}
            </>
          ) : null}
        </motion.div>
        </TracingBeam>
      </div>
    </main>
  );
}
