import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3 } from "lucide-react";
import { PlatformPage, PlatformPageHeader } from "../../components/platform/PlatformPageChrome";
import { fetchPlatformAnalytics, type PlatformAnalytics } from "../../lib/api";
import { AdminDashboardAnalyticsChartsFallback } from "../../components/AdminDashboardAnalyticsChartsFallback";
import { AdminDashboardAnalyticsCharts } from "../../components/AdminDashboardAnalyticsCharts";

const ADMIN_ANALYTICS_TZ_DEFAULT = "Europe/Berlin";

export function PlatformBusinessAnalyticsPage() {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [timezone, setTimezone] = useState(ADMIN_ANALYTICS_TZ_DEFAULT);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const a = await fetchPlatformAnalytics(30, timezone);
      setAnalytics(a);
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
        icon={BarChart3}
        title={t("admin.businessAnalyticsPage.title")}
        subtitle={t("admin.businessAnalyticsPage.subtitle")}
      />
      {loading ? (
        <AdminDashboardAnalyticsChartsFallback />
      ) : (
        <AdminDashboardAnalyticsCharts
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
      )}
    </PlatformPage>
  );
}
