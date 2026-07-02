import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileBarChart } from "lucide-react";
import { PlatformPage, PlatformPageHeader } from "../../../components/platform/PlatformPageChrome";
import {
  fetchPlatformAnalytics,
  fetchPlatformStats,
  type PlatformAnalytics,
  type PlatformGlobalStats,
} from "../../../lib/api";
import { AdminDashboardAnalyticsChartsFallback } from "../../../components/AdminDashboardAnalyticsChartsFallback";
import { DashboardChartsIdleMount } from "../../../components/dashboard/DashboardChartsIdleMount";
import { PlatformUsageKpiStrip } from "../../../components/platform/PlatformUsageKpiStrip";

const AdminDashboardAnalyticsCharts = lazy(() =>
  import("../../../components/AdminDashboardAnalyticsCharts").then((mod) => ({
    default: mod.AdminDashboardAnalyticsCharts,
  })),
);

const ADMIN_ANALYTICS_TZ_DEFAULT = "Europe/Berlin";

export function PlatformUsageReportsPage() {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [stats, setStats] = useState<PlatformGlobalStats | null>(null);
  const [timezone, setTimezone] = useState(ADMIN_ANALYTICS_TZ_DEFAULT);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, s] = await Promise.all([
        fetchPlatformAnalytics(30, timezone),
        fetchPlatformStats(),
      ]);
      setAnalytics(a);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }, [timezone]);

  useEffect(() => {
    void load();
  }, [load]);

  const emptyAnalytics = useMemo<PlatformAnalytics>(
    () => ({
      rangeDays: 30,
      userDistribution: [],
      tipStatus: [],
      growth: [],
      tipVolume: [],
      topBusinessesByTips: [],
    }),
    [],
  );

  return (
    <PlatformPage>
      <PlatformPageHeader
        icon={FileBarChart}
        title={t("admin.usageReportsPage.title")}
        subtitle={t("admin.usageReportsPage.subtitle")}
      />
      <PlatformUsageKpiStrip stats={stats} loading={loading} />
      {loading ? (
        <AdminDashboardAnalyticsChartsFallback chartCount={3} />
      ) : (
        <DashboardChartsIdleMount whenVisible fallback={<AdminDashboardAnalyticsChartsFallback chartCount={3} />}>
          <Suspense fallback={<AdminDashboardAnalyticsChartsFallback chartCount={3} />}>
            <AdminDashboardAnalyticsCharts
              variant="usage"
              showChartSkeletons={false}
              chartAnalytics={analytics ?? emptyAnalytics}
              chartTipStatus={analytics?.tipStatus ?? []}
              chartsLookEmpty={false}
              analyticsError={null}
              analyticsMeta={{ rangeDays: 30, timezone }}
              analyticsTimezone={timezone}
              analyticsSyncing={false}
              analyticsUpdatedAt={Date.now()}
              onTimezoneChange={setTimezone}
              onRetryAnalytics={() => void load()}
            />
          </Suspense>
        </DashboardChartsIdleMount>
      )}
    </PlatformPage>
  );
}
