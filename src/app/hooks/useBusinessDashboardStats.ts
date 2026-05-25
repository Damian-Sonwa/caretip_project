import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BusinessDashboardStats } from "../lib/api";
import {
  clearBusinessStatsClientCache,
  getBusinessStats,
  mergeBusinessDashboardStats,
} from "../lib/api";
import { createDashboardSwrStore, DASHBOARD_SWR_METRICS_TTL_MS } from "../lib/dashboardSwrCache";
import { isAbortError, toUserFriendlyMessage } from "../lib/errorMessages";
import { useDashboardTabRefocus } from "./useDashboardTabRefocus";

export type AnalyticsTimeframe = "week" | "month" | "year";

type BusinessSwrEntry = {
  summary: Partial<BusinessDashboardStats>;
  analytics: Partial<BusinessDashboardStats>;
  merged: BusinessDashboardStats;
  at: number;
};

const businessSwrStore = createDashboardSwrStore<BusinessSwrEntry>();

function swrKey(tf: AnalyticsTimeframe): string {
  return `business:${tf}`;
}

function hasMetricValues(data: BusinessDashboardStats | null | undefined): boolean {
  if (!data) return false;
  return data.totalTips != null || data.tipCount != null || data.employeeCount != null;
}

export function useBusinessDashboardStats(enabled: boolean, sessionValidated: boolean) {
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<AnalyticsTimeframe>("month");
  const [heroStats, setHeroStats] = useState<BusinessDashboardStats | null>(null);
  const [stats, setStats] = useState<BusinessDashboardStats | null>(null);
  const [statsTimeframe, setStatsTimeframe] = useState<AnalyticsTimeframe | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [statsLoadFailed, setStatsLoadFailed] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [dataRevision, setDataRevision] = useState(0);
  const [refetchTick, setRefetchTick] = useState(0);

  const tfRef = useRef(analyticsTimeframe);
  tfRef.current = analyticsTimeframe;
  const statsRef = useRef(stats);
  statsRef.current = stats;
  const uiRequestSeqRef = useRef(0);
  const abortByTfRef = useRef(new Map<AnalyticsTimeframe, AbortController>());
  const summaryPartialRef = useRef(new Map<AnalyticsTimeframe, Partial<BusinessDashboardStats>>());
  const analyticsPartialRef = useRef(new Map<AnalyticsTimeframe, Partial<BusinessDashboardStats>>());

  const persistSwr = useCallback((tf: AnalyticsTimeframe) => {
    const summary = summaryPartialRef.current.get(tf);
    const analytics = analyticsPartialRef.current.get(tf);
    const merged = mergeBusinessDashboardStats(summary, analytics);
    if (!merged) return;
    businessSwrStore.set(swrKey(tf), {
      summary: summary ?? {},
      analytics: analytics ?? {},
      merged,
      at: Date.now(),
    });
  }, []);

  const hydrateFromSwr = useCallback((tf: AnalyticsTimeframe): BusinessDashboardStats | null => {
    const hit = businessSwrStore.get(swrKey(tf), DASHBOARD_SWR_METRICS_TTL_MS);
    if (!hit) return null;
    summaryPartialRef.current.set(tf, hit.summary);
    analyticsPartialRef.current.set(tf, hit.analytics);
    return hit.merged;
  }, []);

  const commitUiStats = useCallback((tf: AnalyticsTimeframe, seq: number, fromNetwork: boolean) => {
    if (tf !== tfRef.current || uiRequestSeqRef.current !== seq) return;
    const merged = mergeBusinessDashboardStats(
      summaryPartialRef.current.get(tf),
      analyticsPartialRef.current.get(tf),
    );
    if (!merged) return;
    persistSwr(tf);
    setStats(merged);
    setStatsTimeframe(tf);
    setPendingVerification(false);
    setStatsLoadFailed(null);
    setLastUpdatedAt(Date.now());
    if (fromNetwork) setDataRevision((n) => n + 1);
  }, [persistSwr]);

  const applyHeroFromMonth = useCallback((tf: AnalyticsTimeframe) => {
    if (tf !== "month") return;
    const merged = mergeBusinessDashboardStats(
      summaryPartialRef.current.get("month"),
      analyticsPartialRef.current.get("month"),
    );
    if (merged) setHeroStats(merged);
  }, []);

  const applyCachedToUi = useCallback(
    (tf: AnalyticsTimeframe, merged: BusinessDashboardStats) => {
      setStats(merged);
      setStatsTimeframe(tf);
      setPendingVerification(false);
      setSummaryLoading(false);
      setAnalyticsLoading(true);
    },
    [],
  );

  const loadStatsFor = useCallback(
    async (
      tf: AnalyticsTimeframe,
      opts?: { affectsUi?: boolean; silent?: boolean; soft?: boolean },
    ): Promise<void> => {
      if (!sessionValidated || !enabled) return;

      const affectsUi = opts?.affectsUi === true && tf === tfRef.current;
      const seq = affectsUi ? ++uiRequestSeqRef.current : 0;
      const cached = affectsUi ? hydrateFromSwr(tf) : null;

      if (affectsUi) {
        setIsRevalidating(true);
        setStatsLoadFailed(null);
        if (cached) {
          applyCachedToUi(tf, cached);
        } else if (!opts?.soft) {
          setStats(null);
          setStatsTimeframe(null);
          summaryPartialRef.current.delete(tf);
          analyticsPartialRef.current.delete(tf);
          setSummaryLoading(true);
          setAnalyticsLoading(true);
        } else {
          setSummaryLoading(!hasMetricValues(statsRef.current));
          setAnalyticsLoading(true);
        }
      }

      const prev = abortByTfRef.current.get(tf);
      prev?.abort();
      const controller = new AbortController();
      abortByTfRef.current.set(tf, controller);

      let summarySettled = Boolean(cached && summaryPartialRef.current.has(tf));
      let analyticsSettled = Boolean(cached && analyticsPartialRef.current.has(tf));

      const summaryPromise = getBusinessStats(tf, {
        scope: "summary",
        silent: opts?.silent === true || Boolean(cached),
        signal: controller.signal,
      });
      const analyticsPromise = getBusinessStats(tf, {
        scope: "analytics",
        silent: opts?.silent === true || Boolean(cached),
        signal: controller.signal,
      });

      void summaryPromise
        .then((summaryData) => {
          if (controller.signal.aborted) return;
          summaryPartialRef.current.set(tf, summaryData);
          summarySettled = true;
          if (affectsUi && uiRequestSeqRef.current === seq) {
            setSummaryLoading(false);
            commitUiStats(tf, seq, true);
          }
          applyHeroFromMonth(tf);
        })
        .catch((err) => {
          if (isAbortError(err) || controller.signal.aborted) return;
          const msg = toUserFriendlyMessage(err);
          if (msg.toLowerCase().includes("pending verification")) {
            if (affectsUi && uiRequestSeqRef.current === seq) {
              setPendingVerification(true);
              setStats(null);
              setStatsTimeframe(null);
              setSummaryLoading(false);
              setAnalyticsLoading(false);
              setIsRevalidating(false);
            }
            return;
          }
          if (affectsUi && uiRequestSeqRef.current === seq) {
            setSummaryLoading(false);
            if (!hasMetricValues(statsRef.current)) setStatsLoadFailed(msg);
          }
        });

      void analyticsPromise
        .then((analyticsData) => {
          if (controller.signal.aborted) return;
          analyticsPartialRef.current.set(tf, analyticsData);
          analyticsSettled = true;
          if (affectsUi && uiRequestSeqRef.current === seq) {
            setAnalyticsLoading(false);
            commitUiStats(tf, seq, true);
          }
          applyHeroFromMonth(tf);
        })
        .catch((err) => {
          if (isAbortError(err) || controller.signal.aborted) return;
          if (affectsUi && uiRequestSeqRef.current === seq) {
            setAnalyticsLoading(false);
            if (!hasMetricValues(statsRef.current) && !statsLoadFailed) {
              setStatsLoadFailed(toUserFriendlyMessage(err));
            }
          }
        });

      try {
        await Promise.all([summaryPromise, analyticsPromise]);
      } catch {
        /* per-branch handlers */
      } finally {
        if (affectsUi && uiRequestSeqRef.current === seq) {
          if (!summarySettled) setSummaryLoading(false);
          if (!analyticsSettled) setAnalyticsLoading(false);
          setIsRevalidating(false);
        }
        if (abortByTfRef.current.get(tf) === controller) {
          abortByTfRef.current.delete(tf);
        }
      }
    },
    [
      enabled,
      sessionValidated,
      commitUiStats,
      applyHeroFromMonth,
      hydrateFromSwr,
      applyCachedToUi,
      statsLoadFailed,
    ],
  );

  const loadHeroMonthSummary = useCallback(async () => {
    if (!sessionValidated || !enabled) return;
    const cached = businessSwrStore.get(swrKey("month"), DASHBOARD_SWR_METRICS_TTL_MS);
    if (cached) {
      summaryPartialRef.current.set("month", cached.summary);
      analyticsPartialRef.current.set("month", cached.analytics);
      setHeroStats(cached.merged);
    }
    try {
      const summaryData = await getBusinessStats("month", { scope: "summary", silent: true });
      summaryPartialRef.current.set("month", summaryData);
      const merged = mergeBusinessDashboardStats(
        summaryData,
        analyticsPartialRef.current.get("month"),
      );
      if (merged) {
        persistSwr("month");
        setHeroStats(merged);
      }
    } catch {
      /* hero pulse optional */
    }
  }, [enabled, sessionValidated, persistSwr]);

  useEffect(() => {
    if (!enabled || !sessionValidated) {
      abortByTfRef.current.forEach((c) => c.abort());
      abortByTfRef.current.clear();
      clearBusinessStatsClientCache();
      businessSwrStore.clear();
      summaryPartialRef.current.clear();
      analyticsPartialRef.current.clear();
      setHeroStats(null);
      setStats(null);
      setStatsTimeframe(null);
      setSummaryLoading(true);
      setAnalyticsLoading(true);
      setIsRevalidating(false);
      setStatsLoadFailed(null);
      setPendingVerification(false);
      setLastUpdatedAt(null);
      return;
    }
  }, [enabled, sessionValidated]);

  useEffect(() => {
    if (!sessionValidated || !enabled) return;
    void loadStatsFor(analyticsTimeframe, { affectsUi: true });
    return () => abortByTfRef.current.get(analyticsTimeframe)?.abort();
  }, [enabled, sessionValidated, analyticsTimeframe, loadStatsFor, refetchTick]);

  useEffect(() => {
    if (!sessionValidated || !enabled) return;
    if (analyticsTimeframe === "month") return;
    void loadHeroMonthSummary();
  }, [enabled, sessionValidated, analyticsTimeframe, loadHeroMonthSummary, refetchTick]);

  const refetchLive = useCallback(() => {
    clearBusinessStatsClientCache();
    void loadStatsFor(tfRef.current, { affectsUi: true, soft: true, silent: true });
  }, [loadStatsFor]);

  useDashboardTabRefocus(refetchLive, enabled && sessionValidated);

  const refreshStatsQuiet = useCallback(async () => {
    if (!sessionValidated || !enabled) return;
    const tf = tfRef.current;
    const seq = ++uiRequestSeqRef.current;
    setIsRevalidating(true);
    clearBusinessStatsClientCache(tf);
    try {
      const [summaryData, analyticsData] = await Promise.all([
        getBusinessStats(tf, { scope: "summary", silent: true }),
        getBusinessStats(tf, { scope: "analytics", silent: true }),
      ]);
      if (uiRequestSeqRef.current !== seq || tf !== tfRef.current) return;
      summaryPartialRef.current.set(tf, summaryData);
      analyticsPartialRef.current.set(tf, analyticsData);
      commitUiStats(tf, seq, true);
      applyHeroFromMonth(tf);
      if (tf !== "month") void loadHeroMonthSummary();
    } catch {
      /* keep last live stats */
    } finally {
      if (uiRequestSeqRef.current === seq) setIsRevalidating(false);
    }
  }, [enabled, sessionValidated, commitUiStats, applyHeroFromMonth, loadHeroMonthSummary]);

  const retryStats = useCallback(() => {
    setStatsLoadFailed(null);
    clearBusinessStatsClientCache(tfRef.current);
    businessSwrStore.delete(swrKey(tfRef.current));
    summaryPartialRef.current.delete(tfRef.current);
    analyticsPartialRef.current.delete(tfRef.current);
    setRefetchTick((n) => n + 1);
  }, []);

  const valuesMatchAnalyticsPeriod =
    statsTimeframe === analyticsTimeframe && !pendingVerification;

  const displayStats = useMemo(() => {
    if (pendingVerification || !valuesMatchAnalyticsPeriod) return null;
    return stats;
  }, [pendingVerification, stats, valuesMatchAnalyticsPeriod]);

  const displayMetrics = useMemo(() => {
    if (!displayStats || !hasMetricValues(displayStats)) return null;
    return {
      totalTips: displayStats.totalTips ?? 0,
      tipCount: displayStats.tipCount ?? 0,
      employeeCount: displayStats.employeeCount ?? 0,
    };
  }, [displayStats?.totalTips, displayStats?.tipCount, displayStats?.employeeCount]);

  const isMetricsInitialLoad =
    enabled &&
    sessionValidated &&
    !pendingVerification &&
    !displayMetrics &&
    summaryLoading;

  const isAnalyticsSectionLoading =
    enabled &&
    sessionValidated &&
    !pendingVerification &&
    analyticsLoading &&
    !(displayStats?.dailyTipDistribution?.length ?? 0);

  const isPeriodRefreshing =
    isRevalidating && Boolean(displayMetrics) && !isMetricsInitialLoad;

  return {
    analyticsTimeframe,
    setAnalyticsTimeframe,
    heroStats,
    stats,
    displayStats,
    displayMetrics,
    statsTimeframe,
    valuesMatchAnalyticsPeriod,
    statsLoading: isMetricsInitialLoad,
    summaryLoading: isMetricsInitialLoad,
    analyticsLoading: isAnalyticsSectionLoading,
    analyticsTimeframeLoading:
      isRevalidating && (summaryLoading || analyticsLoading) ? analyticsTimeframe : null,
    statsLoadFailed,
    pendingVerification,
    isInitialLoad: isMetricsInitialLoad,
    isMetricsInitialLoad,
    isAnalyticsSectionLoading,
    isAnalyticsInitialLoad: isAnalyticsSectionLoading,
    isGoalsInitialLoad: isAnalyticsSectionLoading,
    isSecondarySectionLoading: isAnalyticsSectionLoading,
    isPeriodRefreshing,
    isDashboardHydrating: isMetricsInitialLoad,
    isRevalidating,
    dataRevision,
    lastUpdatedAt,
    showStatsSkeleton: isMetricsInitialLoad,
    refreshStatsQuiet,
    retryStats,
    refetchLive,
  };
}
