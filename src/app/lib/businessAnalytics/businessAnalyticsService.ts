import { getBusinessStats, listBusinessTips, getBusinessQrAnalytics, type BusinessStatsScope } from "../api";
import { runBusinessIntelligenceEngine } from "../businessIntelligenceEngine";import { buildBusinessIntelligenceInput, tipsFeedParamsForTimeframe } from "../buildBusinessIntelligenceInput";
import {
  getBusinessAnalyticsBundle,
  setBusinessAnalyticsBundle,
  upsertBusinessAnalyticsStatsBundle,
} from "./businessAnalyticsStore";
import { snapshotFromStats, todaySnapshotFromPulse } from "./snapshot";
import type {
  AnalyticsTimeframe,
  BusinessAnalyticsBundle,
  BusinessAnalyticsDTO,
  FetchBusinessAnalyticsOptions,
} from "./types";
import type { BusinessDashboardStats } from "../api";
import { trackAnalyticsCacheHit, trackAnalyticsCacheMiss, trackAnalyticsRefetch } from "../realtime/realtimeMetrics";

/**
 * Sprint 8.1 — single authoritative period stats fetch (scope=full).
 * Used by dashboard overview to avoid summary + analytics duplicate calls.
 */
export async function fetchBusinessPeriodStats(
  timeframe: AnalyticsTimeframe,
  opts?: FetchBusinessAnalyticsOptions,
): Promise<BusinessDashboardStats> {
  if (!opts?.revalidate) {
    const cached = getBusinessAnalyticsBundle(timeframe);
    if (cached?.periodStats) {
      trackAnalyticsCacheHit();
      return cached.periodStats;
    }
  }

  trackAnalyticsCacheMiss();
  trackAnalyticsRefetch();

  const periodStats = await getBusinessStats(timeframe, {
    scope: opts?.scope ?? "full",
    signal: opts?.signal,
    silent: opts?.silent,
    revalidate: opts?.revalidate,
  });

  upsertBusinessAnalyticsStatsBundle(timeframe, periodStats);
  return periodStats;
}

/**
 * Sprint 3B — unified fetch for business analytics.
 * Single entry for period stats + week comparison + optional tips feed.
 */
export async function fetchBusinessAnalyticsBundle(
  timeframe: AnalyticsTimeframe,
  opts?: FetchBusinessAnalyticsOptions,
): Promise<BusinessAnalyticsBundle> {
  if (!opts?.revalidate) {
    const cached = getBusinessAnalyticsBundle(timeframe);
    if (cached) {
      trackAnalyticsCacheHit();
      return cached;
    }
  }

  trackAnalyticsCacheMiss();
  trackAnalyticsRefetch();

  const includeTipsFeed = opts?.includeTipsFeed !== false;
  const includeWeekStats = opts?.includeWeekStats !== false;
  const includeQrAnalytics = opts?.includeQrAnalytics !== false;
  const feedParams = tipsFeedParamsForTimeframe(timeframe);

  const [periodStats, weekStats, feed, qrAnalytics] = await Promise.all([
    getBusinessStats(timeframe, {
      scope: "full",
      signal: opts?.signal,
      silent: opts?.silent,
      revalidate: opts?.revalidate,
    }),
    includeWeekStats
      ? getBusinessStats("week", {
          scope: "summary",
          signal: opts?.signal,
          silent: opts?.silent,
          revalidate: opts?.revalidate,
        })
      : Promise.resolve(null as BusinessDashboardStats | null),
    includeTipsFeed
      ? listBusinessTips({
          ...feedParams,
          skip: 0,
          status: "success",
        })
      : Promise.resolve({ items: [] as BusinessAnalyticsBundle["recentTips"] }),
    includeQrAnalytics
      ? getBusinessQrAnalytics(timeframe, { signal: opts?.signal, silent: opts?.silent }).catch(
          () => null,
        )
      : Promise.resolve(null),
  ]);

  const bundle: BusinessAnalyticsBundle = {
    timeframe,
    periodStats,
    weekStats: weekStats ?? periodStats,
    recentTips: feed.items,
    qrAnalytics,
    fetchedAt: Date.now(),
  };

  setBusinessAnalyticsBundle(timeframe, bundle);
  return bundle;
}

/** Map raw bundle → authoritative DTO with shared BI aggregates. */
export function buildBusinessAnalyticsDTO(bundle: BusinessAnalyticsBundle): BusinessAnalyticsDTO {
  const period = snapshotFromStats(bundle.periodStats);
  const week = snapshotFromStats(bundle.weekStats);
  const pulse = bundle.periodStats.operationalPulse ?? null;
  const today = todaySnapshotFromPulse(pulse);

  const input = buildBusinessIntelligenceInput({
    period,
    week,
    today,
    dailyTipDistribution: bundle.periodStats.dailyTipDistribution ?? [],
    recentTips: bundle.recentTips,
    employees: bundle.periodStats.employees ?? [],
    employeeGoals: bundle.periodStats.employeeGoals ?? [],
    pulse,
    qrAnalytics: bundle.qrAnalytics ?? null,
  });

  const intelligence = runBusinessIntelligenceEngine(input);

  return {
    timeframe: bundle.timeframe,
    stats: bundle.periodStats,
    period,
    week,
    today,
    pulse,
    recentTips: bundle.recentTips,
    employees: bundle.periodStats.employees ?? [],
    employeeGoals: bundle.periodStats.employeeGoals ?? [],
    dailyTipDistribution: bundle.periodStats.dailyTipDistribution ?? [],
    input,
    intelligence,
    fetchedAt: bundle.fetchedAt,
  };
}

export async function fetchBusinessAnalyticsDTO(
  timeframe: AnalyticsTimeframe,
  opts?: FetchBusinessAnalyticsOptions,
): Promise<BusinessAnalyticsDTO> {
  const bundle = await fetchBusinessAnalyticsBundle(timeframe, opts);
  return buildBusinessAnalyticsDTO(bundle);
}
