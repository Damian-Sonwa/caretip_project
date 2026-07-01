import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router";
import { useTranslation } from "react-i18next";
import { createCareStatIcon } from "@/components/icons";
import {
  fetchPlatformHealth,
  fetchPlatformStats,
  fetchPlatformBusinesses,
  fetchOnboardingQueueMetrics,
  fetchPlatformSubscriptionMonitoring,
  fetchPlatformAuditLogs,
  fetchPlatformCommercialIntelligence,
  fetchPlatformAnalytics,
  type PlatformHealthResponse,
  type PlatformGlobalStats,
  type PlatformBusinessRow,
  type OnboardingQueueMetrics,
  type PlatformAnalytics,
} from "../lib/api";
import { logClientError } from "../lib/clientLog";
import { formatEur } from "../lib/formatEur";
import { useAuth } from "../hooks/useAuth";
import { PlatformStatCard } from "./platform/PlatformStatCard";
import { PlatformOverviewTeaserCard } from "./platform/PlatformOverviewTeaserCard";
import { PlatformBusinessMobileCard } from "./platform/PlatformBusinessMobileCard";
import { PlatformAdminOverviewHero } from "./platform/PlatformAdminOverviewHero";
import {
  PlatformAdminAttentionAlerts,
  type PlatformAdminAlert,
} from "./platform/PlatformAdminAttentionAlerts";
import { platformUi } from "./platform/platformDashboardUi";
import {
  PLATFORM_BUSINESS_BASE,
  PLATFORM_REVENUE_BASE,
  PLATFORM_REPORTS_BASE,
  PLATFORM_SYSTEM_BASE,
} from "./platform/platformAdminNav";
import { cn } from "@/lib/utils";

const VERIFICATION_TEASER_LIMIT = 3;
const RECENT_ACTIVITY_LIMIT = 4;

function onboardingTeaserPriority(status: PlatformBusinessRow["onboardingVerificationStatus"]): number {
  if (status === "submitted") return 0;
  if (status === "rejected") return 1;
  return 2;
}

function computeTipVolumeWindows(analytics: PlatformAnalytics | null): {
  todayEur: number;
  weekEur: number;
  monthEur: number;
} {
  const rows = analytics?.tipVolume ?? [];
  if (rows.length === 0) return { todayEur: 0, weekEur: 0, monthEur: 0 };
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const todayEur = sorted[sorted.length - 1]?.tipsEur ?? 0;
  const weekEur = sorted.slice(-7).reduce((sum, row) => sum + row.tipsEur, 0);
  const monthEur = sorted.reduce((sum, row) => sum + row.tipsEur, 0);
  return { todayEur, weekEur, monthEur };
}

function computeRevenueTrend(analytics: PlatformAnalytics | null): string {
  const rows = analytics?.tipVolume ?? [];
  if (rows.length < 8) return "0%";
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-7).reduce((sum, row) => sum + row.tipsEur, 0);
  const prior = sorted.slice(-14, -7).reduce((sum, row) => sum + row.tipsEur, 0);
  if (prior <= 0) return recent > 0 ? "+100%" : "0%";
  const pct = Math.round(((recent - prior) / prior) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}

function computeNewBusinessesThisWeek(analytics: PlatformAnalytics | null): number {
  return (analytics?.growth ?? []).slice(-7).reduce((sum, row) => sum + row.newBusinesses, 0);
}

export function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { user, authHydrated, sessionValidated } = useAuth();
  const [health, setHealth] = useState<PlatformHealthResponse | null>(null);
  const [stats, setStats] = useState<PlatformGlobalStats | null>(null);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [onboardingTeaser, setOnboardingTeaser] = useState<PlatformBusinessRow[]>([]);
  const [onboardingMetrics, setOnboardingMetrics] = useState<OnboardingQueueMetrics | null>(null);
  const [subscriptionOverview, setSubscriptionOverview] = useState<{
    active: number;
    trialing: number;
    failed: number;
    successful: number;
    failedPaymentsToday: number;
  } | null>(null);
  const [commercialSummary, setCommercialSummary] = useState<{
    upgrades: number;
    trials: number;
    atRisk: number;
  } | null>(null);
  const [recentLogs, setRecentLogs] = useState<Array<{ action: string; at: string; email?: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [
        healthRes,
        statsRes,
        analyticsRes,
        onboardingRes,
        onboardingSubmittedRes,
        subRes,
        logsRes,
        commercialRes,
      ] = await Promise.all([
        fetchPlatformHealth().catch(() => null),
        fetchPlatformStats().catch(() => null),
        fetchPlatformAnalytics(30).catch(() => null),
        fetchOnboardingQueueMetrics().catch(() => null),
        fetchPlatformBusinesses({
          workflow: "onboarding",
          status: "submitted",
          take: VERIFICATION_TEASER_LIMIT,
          sort: "newest",
        }).catch(() => ({ businesses: [] as PlatformBusinessRow[] })),
        fetchPlatformSubscriptionMonitoring(30).catch(() => null),
        fetchPlatformAuditLogs({ take: RECENT_ACTIVITY_LIMIT, skip: 0 }).catch(() => ({ items: [], total: 0 })),
        fetchPlatformCommercialIntelligence().catch(() => null),
      ]);

      if (healthRes) setHealth(healthRes);
      if (statsRes) setStats(statsRes);
      if (analyticsRes) setAnalytics(analyticsRes);
      if (onboardingRes) setOnboardingMetrics(onboardingRes);

      const onboardingQueue = (onboardingSubmittedRes.businesses ?? [])
        .sort(
          (a, b) =>
            onboardingTeaserPriority(a.onboardingVerificationStatus) -
              onboardingTeaserPriority(b.onboardingVerificationStatus) ||
            a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
        )
        .slice(0, VERIFICATION_TEASER_LIMIT);
      setOnboardingTeaser(onboardingQueue);

      if (subRes?.overview) {
        setSubscriptionOverview({
          active: subRes.overview.active ?? 0,
          trialing: subRes.overview.trialing ?? 0,
          failed: subRes.overview.failed ?? 0,
          successful: subRes.overview.successful ?? 0,
          failedPaymentsToday: subRes.widgets?.failedPaymentsToday ?? 0,
        });
      }

      setRecentLogs(
        (logsRes.items ?? []).map((row) => ({
          action: row.action,
          at: row.createdAt,
          email: row.userEmail,
        })),
      );

      if (commercialRes?.segments) {
        setCommercialSummary({
          upgrades: commercialRes.segments.premiumOpportunities?.length ?? 0,
          trials: commercialRes.segments.growthCandidates?.length ?? 0,
          atRisk: commercialRes.segments.atRisk?.length ?? 0,
        });
      }
    } catch (e) {
      logClientError("AdminDashboard.load", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeBusinessesCount = onboardingMetrics?.approved ?? 0;
  const pendingOnboardingCount = onboardingMetrics?.submitted ?? 0;
  const tipVolumes = useMemo(() => computeTipVolumeWindows(analytics), [analytics]);
  const revenueTrend = useMemo(() => computeRevenueTrend(analytics), [analytics]);
  const newBusinessesWeek = useMemo(() => computeNewBusinessesThisWeek(analytics), [analytics]);

  const attentionAlerts = useMemo((): PlatformAdminAlert[] => {
    const alerts: PlatformAdminAlert[] = [];

    if (health && (health.database !== "online" || health.stripe !== "online")) {
      alerts.push({
        id: "health",
        message: t("admin.overview.alerts.systemHealth"),
        href: `${PLATFORM_SYSTEM_BASE}/health`,
        severity: "critical",
      });
    }

    if (pendingOnboardingCount > 0) {
      alerts.push({
        id: "onboarding",
        message: t("admin.overview.alerts.pendingOnboarding", { count: pendingOnboardingCount }),
        href: `${PLATFORM_BUSINESS_BASE}/onboarding-verification`,
        severity: "warning",
      });
    }

    if ((subscriptionOverview?.failedPaymentsToday ?? 0) > 0) {
      alerts.push({
        id: "failed-payments",
        message: t("admin.overview.alerts.failedPaymentsToday", {
          count: subscriptionOverview?.failedPaymentsToday ?? 0,
        }),
        href: `${PLATFORM_REVENUE_BASE}/failed-payments`,
        severity: "warning",
      });
    }

    if ((commercialSummary?.atRisk ?? 0) > 0) {
      alerts.push({
        id: "at-risk",
        message: t("admin.overview.alerts.atRiskSubscriptions", { count: commercialSummary?.atRisk ?? 0 }),
        href: `${PLATFORM_REPORTS_BASE}/commercial`,
        severity: "warning",
      });
    }

    return alerts;
  }, [commercialSummary?.atRisk, health, pendingOnboardingCount, subscriptionOverview?.failedPaymentsToday, t]);

  if (!authHydrated || !sessionValidated || !user) return null;
  if (user.role !== "platform_admin") return <Navigate to="/unauthorized" replace />;

  return (
    <div className={cn(platformUi.page, "platform-dashboard-overview overflow-x-hidden")}>
      <div className={cn(platformUi.pageInner, "platform-dashboard-body", platformUi.overviewSection, "pt-3 sm:pt-4")}>
        <PlatformAdminOverviewHero health={health} adminName={user.name} locale={i18n.language} />

        <section aria-labelledby="platform-kpis-heading">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 id="platform-kpis-heading" className="text-sm font-semibold text-foreground sm:text-base">
              {t("admin.overview.kpisTitle")}
            </h2>
          </div>
          <div className={cn(platformUi.overviewKpiGrid, loading && "platform-admin-stat-grid--loading")}>
            <PlatformStatCard
              label={t("admin.overview.kpi.activeBusinesses")}
              value={String(activeBusinessesCount)}
              numericValue={activeBusinessesCount}
              loading={loading}
            />
            <PlatformStatCard
              label={t("admin.overview.revenue.todayVolume")}
              value={formatEur(tipVolumes.todayEur)}
              numericValue={tipVolumes.todayEur}
              countUpKind="eur"
              loading={loading}
              loadingVariant="currency"
              icon={createCareStatIcon("tips")}
            />
            <PlatformStatCard
              label={t("admin.overview.kpi.staff")}
              value={String(stats?.employeesCount ?? 0)}
              numericValue={stats?.employeesCount ?? 0}
              loading={loading}
            />
            <PlatformStatCard
              label={t("admin.overview.kpi.transactions")}
              value={String(stats?.successTransactionCount ?? 0)}
              numericValue={stats?.successTransactionCount ?? 0}
              loading={loading}
            />
            <PlatformStatCard
              label={t("admin.overview.revenue.monthlyVolume")}
              value={formatEur(tipVolumes.monthEur)}
              numericValue={tipVolumes.monthEur}
              countUpKind="eur"
              loading={loading}
              loadingVariant="currency"
            />
            <PlatformStatCard
              label={t("admin.overview.kpi.pendingOnboarding")}
              value={String(pendingOnboardingCount)}
              numericValue={pendingOnboardingCount}
              loading={loading}
              featured={pendingOnboardingCount > 0}
            />
          </div>
        </section>

        <PlatformAdminAttentionAlerts alerts={attentionAlerts} />

        <section aria-labelledby="platform-teasers-heading">
          <h2 id="platform-teasers-heading" className="sr-only">
            {t("admin.overview.teasersTitle")}
          </h2>
          <div className={platformUi.overviewTeaserGrid}>
            <PlatformOverviewTeaserCard
              title={t("admin.overview.subscriptionOverview.title")}
              viewAllHref={`${PLATFORM_BUSINESS_BASE}/subscriptions`}
              viewAllLabel={t("admin.overview.viewAll")}
              metrics={
                subscriptionOverview
                  ? [
                      { label: t("admin.subscriptions.kpi.active"), value: String(subscriptionOverview.active) },
                      { label: t("admin.subscriptions.kpi.trialing"), value: String(subscriptionOverview.trialing) },
                      { label: t("admin.subscriptions.kpi.failed"), value: String(subscriptionOverview.failed) },
                      {
                        label: t("admin.overview.subscriptionOverview.revenue"),
                        value: formatEur(tipVolumes.monthEur),
                      },
                    ]
                  : []
              }
            />

            <PlatformOverviewTeaserCard
              title={t("admin.overview.revenue.title")}
              viewAllHref={`${PLATFORM_REVENUE_BASE}/transactions`}
              viewAllLabel={t("admin.overview.viewAll")}
              metrics={[
                {
                  label: t("admin.overview.revenue.todayVolume"),
                  value: formatEur(tipVolumes.todayEur),
                },
                {
                  label: t("admin.overview.revenue.monthlyVolume"),
                  value: formatEur(tipVolumes.monthEur),
                },
                {
                  label: t("admin.overview.revenue.trend"),
                  value: revenueTrend,
                },
              ]}
            />

            <PlatformOverviewTeaserCard
              title={t("admin.overview.businessGrowth.title")}
              viewAllHref={`${PLATFORM_BUSINESS_BASE}/all`}
              viewAllLabel={t("admin.overview.viewAll")}
              metrics={[
                { label: t("admin.overview.kpi.totalBusinesses"), value: String(stats?.businessesCount ?? 0) },
                {
                  label: t("admin.overview.businessGrowth.newThisWeek"),
                  value: String(newBusinessesWeek),
                },
                {
                  label: t("admin.overview.kpi.pendingOnboarding"),
                  value: String(pendingOnboardingCount),
                },
              ]}
            />

            <PlatformOverviewTeaserCard
              title={t("admin.sections.verificationQueue.title")}
              viewAllHref={`${PLATFORM_BUSINESS_BASE}/onboarding-verification`}
              viewAllLabel={t("admin.verificationTeaser.viewAll")}
              metrics={[
                {
                  label: t("admin.onboardingVerificationPage.kpi.submitted"),
                  value: String(pendingOnboardingCount),
                },
                {
                  label: t("admin.onboardingVerificationPage.kpi.rejected"),
                  value: String(onboardingMetrics?.rejected ?? 0),
                },
              ]}
            >
              {onboardingTeaser.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("admin.overview.verification.empty")}</p>
              ) : (
                <ul className="space-y-2">
                  {onboardingTeaser.map((b) => (
                    <li key={b.id} className="hidden sm:block">
                      <Link
                        to={`${PLATFORM_BUSINESS_BASE}/${b.id}`}
                        className="flex items-center justify-between rounded-lg border border-border/80 px-3 py-2 text-sm transition-colors hover:bg-muted/40"
                      >
                        <span className="font-medium text-foreground">{b.name}</span>
                        <span className="text-xs text-muted-foreground">{b.ownerEmail}</span>
                      </Link>
                    </li>
                  ))}
                  <div className="space-y-2 sm:hidden">
                    {onboardingTeaser.map((b) => (
                      <PlatformBusinessMobileCard key={b.id} business={b} />
                    ))}
                  </div>
                </ul>
              )}
            </PlatformOverviewTeaserCard>

            <PlatformOverviewTeaserCard
              title={t("admin.sections.commercialIntelligence.title")}
              viewAllHref={`${PLATFORM_REPORTS_BASE}/commercial`}
              viewAllLabel={t("admin.overview.viewAll")}
              metrics={
                commercialSummary
                  ? [
                      { label: t("admin.overview.commercial.upgrades"), value: String(commercialSummary.upgrades) },
                      { label: t("admin.overview.commercial.trials"), value: String(commercialSummary.trials) },
                      { label: t("admin.overview.commercial.atRisk"), value: String(commercialSummary.atRisk) },
                    ]
                  : []
              }
            />
          </div>
        </section>

        <PlatformOverviewTeaserCard
          title={t("admin.overview.recentActivity.title")}
          viewAllHref={`${PLATFORM_REPORTS_BASE}/audit-logs`}
          viewAllLabel={t("admin.overview.viewAll")}
          metrics={[]}
          className="max-w-3xl"
        >
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.overview.recentActivity.empty")}</p>
          ) : (
            <ul className="space-y-2">
              {recentLogs.map((row, i) => (
                <li
                  key={`${row.action}-${row.at}-${i}`}
                  className="flex flex-col gap-0.5 rounded-lg border border-border/70 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium text-foreground">{row.action}</span>
                  <span className="text-xs text-muted-foreground">
                    {row.email ? `${row.email} · ` : ""}
                    {new Date(row.at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </PlatformOverviewTeaserCard>

        <p className="text-center text-xs leading-relaxed text-muted-foreground lg:text-left">
          {t("admin.overview.footerHint")}
        </p>
      </div>
    </div>
  );
}
