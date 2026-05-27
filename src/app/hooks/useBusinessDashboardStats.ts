import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BusinessDashboardStats } from "../lib/api";
import {
  clearBusinessStatsClientCache,
  getBusinessStats,
  mergeBusinessDashboardStats,
} from "../lib/api";
import { createDashboardSwrStore, DASHBOARD_SWR_METRICS_TTL_MS } from "../lib/dashboardSwrCache";
import { canUseDashboardSwrCache, markDashboardLiveSettled } from "../lib/dashboardHydration";
import { isAbortError, toUserFriendlyMessage } from "../lib/errorMessages";
import { useDashboardTabRefocus } from "./useDashboardTabRefocus";
import { devSetHydrationPhase } from "../lib/dashboardDevDebug";
import {
  abortTimeframeControllers,
  BUSINESS_HERO_MONTH_DEFER_MS,
} from "../lib/dashboardTimeframeOrchestration";

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
  const [analyticsTimeframe, setAnalyticsTimeframeState] = useState<AnalyticsTimeframe>("month");
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
  const hasSettledLiveUiRef = useRef(false);
  const loadStatsForRef = useRef<
    (tf: AnalyticsTimeframe, opts?: { affectsUi?: boolean; silent?: boolean; soft?: boolean }) => Promise<void>
  >(async () => {});
  const loadHeroMonthSummaryRef = useRef<() => Promise<void>>(async () => {});
  const heroDeferTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heroAbortRef = useRef<AbortController | null>(null);

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

  const cancelDeferredHeroMonth = useCallback(() => {
    if (heroDeferTimerRef.current != null) {
      clearTimeout(heroDeferTimerRef.current);
      heroDeferTimerRef.current = null;
    }
    heroAbortRef.current?.abort();
    heroAbortRef.current = null;
  }, []);

  const scheduleDeferredHeroMonth = useCallback(() => {
    if (tfRef.current === "month") return;
    cancelDeferredHeroMonth();
    heroDeferTimerRef.current = setTimeout(() => {
      heroDeferTimerRef.current = null;
      if (tfRef.current === "month" || !sessionValidated || !enabled) return;
      void loadHeroMonthSummaryRef.current();
    }, BUSINESS_HERO_MONTH_DEFER_MS);
  }, [cancelDeferredHeroMonth, enabled, sessionValidated]);

  const abortInactiveTimeframes = useCallback((activeTf: AnalyticsTimeframe) => {
    abortTimeframeControllers(abortByTfRef.current, activeTf);
    for (const tf of ["week", "month", "year"] as const) {
      if (tf !== activeTf) clearBusinessStatsClientCache(tf);
    }
  }, []);

  const loadStatsFor = useCallback(
    async (
      tf: AnalyticsTimeframe,
      opts?: { affectsUi?: boolean; silent?: boolean; soft?: boolean },
    ): Promise<void> => {
      if (!sessionValidated || !enabled) return;

      const affectsUi = opts?.affectsUi === true && tf === tfRef.current;
      if (affectsUi) {
        abortInactiveTimeframes(tf);
        cancelDeferredHeroMonth();
      }
      const seq = affectsUi ? ++uiRequestSeqRef.current : 0;
      const cached =
        affectsUi &&
        canUseDashboardSwrCache({ hasSettledLiveUi: hasSettledLiveUiRef.current, soft: opts?.soft })
          ? hydrateFromSwr(tf)
          : null;

      if (affectsUi) {
        setIsRevalidating(true);
        setStatsLoadFailed(null);
        if (cached) {
          applyCachedToUi(tf, cached);
          devSetHydrationPhase("metrics", "ready");
          devSetHydrationPhase("charts", "loading");
        } else if (!opts?.soft) {
          setStats(null);
          setStatsTimeframe(null);
          summaryPartialRef.current.delete(tf);
          analyticsPartialRef.current.delete(tf);
          setSummaryLoading(true);
          setAnalyticsLoading(true);
          devSetHydrationPhase("metrics", "loading");
          devSetHydrationPhase("charts", "loading");
          devSetHydrationPhase("goals", "loading");
        } else {
          setSummaryLoading(!hasMetricValues(statsRef.current));
          setAnalyticsLoading(true);
          if (!hasMetricValues(statsRef.current)) devSetHydrationPhase("metrics", "loading");
          devSetHydrationPhase("charts", "loading");
        }
      }

      const prev = abortByTfRef.current.get(tf);
      prev?.abort();
      clearBusinessStatsClientCache(tf);
      const controller = new AbortController();
      abortByTfRef.current.set(tf, controller);

      const silent = opts?.silent === true || Boolean(cached);
      const revalidate = opts?.soft === true;
      const stillActive = () =>
        !controller.signal.aborted && (!affectsUi || (tf === tfRef.current && uiRequestSeqRef.current === seq));

      let summarySettled =
        !revalidate && Boolean(cached && summaryPartialRef.current.has(tf));
      let analyticsSettled =
        !revalidate && Boolean(cached && analyticsPartialRef.current.has(tf));

      const handlePendingVerification = (msg: string) => {
        if (!msg.toLowerCase().includes("pending verification")) return false;
        if (affectsUi && uiRequestSeqRef.current === seq) {
          setPendingVerification(true);
          setStats(null);
          setStatsTimeframe(null);
          setSummaryLoading(false);
          setAnalyticsLoading(false);
          setIsRevalidating(false);
        }
        return true;
      };

      try {
        if (summarySettled && analyticsSettled) {
          if (affectsUi && stillActive()) {
            setSummaryLoading(false);
            setAnalyticsLoading(false);
            devSetHydrationPhase("metrics", "ready");
            devSetHydrationPhase("charts", "ready");
            devSetHydrationPhase("goals", "ready");
            commitUiStats(tf, seq, true);
            markDashboardLiveSettled(hasSettledLiveUiRef);
            scheduleDeferredHeroMonth();
          }
          return;
        }

        if (!summarySettled) {
          const summaryData = await getBusinessStats(tf, {
            scope: "summary",
            silent,
            signal: controller.signal,
          });
          if (!stillActive()) return;
          summaryPartialRef.current.set(tf, summaryData);
          summarySettled = true;
          if (affectsUi) {
            setSummaryLoading(false);
            devSetHydrationPhase("metrics", "ready");
            commitUiStats(tf, seq, true);
          }
          applyHeroFromMonth(tf);
          if (tf === "month") devSetHydrationPhase("hero", "ready");
        }

        if (!stillActive()) return;

        if (!analyticsSettled) {
          const analyticsData = await getBusinessStats(tf, {
            scope: "analytics",
            silent,
            signal: controller.signal,
          });
          if (!stillActive()) return;
          analyticsPartialRef.current.set(tf, analyticsData);
          analyticsSettled = true;
          if (affectsUi) {
            setAnalyticsLoading(false);
            devSetHydrationPhase("charts", "ready");
            devSetHydrationPhase("goals", "ready");
            commitUiStats(tf, seq, true);
          }
          applyHeroFromMonth(tf);
        }

        if (stillActive()) {
          markDashboardLiveSettled(hasSettledLiveUiRef);
          if (affectsUi) scheduleDeferredHeroMonth();
        }
      } catch (err) {
        if (isAbortError(err) || controller.signal.aborted) return;
        const msg = toUserFriendlyMessage(err);
        if (handlePendingVerification(msg)) return;
        if (affectsUi && uiRequestSeqRef.current === seq) {
          if (!summarySettled) {
            setSummaryLoading(false);
            devSetHydrationPhase("metrics", "error");
            if (!hasMetricValues(statsRef.current)) setStatsLoadFailed(msg);
          } else if (!analyticsSettled) {
            setAnalyticsLoading(false);
            devSetHydrationPhase("charts", "error");
            devSetHydrationPhase("goals", "error");
            if (!hasMetricValues(statsRef.current)) setStatsLoadFailed(msg);
          }
        }
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
      abortInactiveTimeframes,
      cancelDeferredHeroMonth,
      scheduleDeferredHeroMonth,
    ],
  );

  loadStatsForRef.current = loadStatsFor;

  const loadHeroMonthSummary = useCallback(async () => {
    if (!sessionValidated || !enabled) return;
    const activeAtStart = tfRef.current;
    if (activeAtStart === "month") return;

    heroAbortRef.current?.abort();
    const controller = new AbortController();
    heroAbortRef.current = controller;

    const useCache = canUseDashboardSwrCache({
      hasSettledLiveUi: hasSettledLiveUiRef.current,
      soft: true,
    });
    const cached = useCache
      ? businessSwrStore.get(swrKey("month"), DASHBOARD_SWR_METRICS_TTL_MS)
      : null;
    if (cached) {
      summaryPartialRef.current.set("month", cached.summary);
      analyticsPartialRef.current.set("month", cached.analytics);
      setHeroStats(cached.merged);
      devSetHydrationPhase("hero", "ready");
      return;
    }

    devSetHydrationPhase("hero", "loading");
    try {
      const summaryData = await getBusinessStats("month", {
        scope: "summary",
        silent: true,
        signal: controller.signal,
      });
      if (controller.signal.aborted || tfRef.current !== activeAtStart) return;
      summaryPartialRef.current.set("month", summaryData);
      const merged = mergeBusinessDashboardStats(
        summaryData,
        analyticsPartialRef.current.get("month"),
      );
      if (merged) {
        persistSwr("month");
        setHeroStats(merged);
        devSetHydrationPhase("hero", "ready");
      }
    } catch (err) {
      if (isAbortError(err) || controller.signal.aborted) return;
      devSetHydrationPhase("hero", "error");
    } finally {
      if (heroAbortRef.current === controller) heroAbortRef.current = null;
    }
  }, [enabled, sessionValidated, persistSwr]);

  loadHeroMonthSummaryRef.current = loadHeroMonthSummary;

  const setAnalyticsTimeframe = useCallback(
    (tf: AnalyticsTimeframe) => {
      if (tf === tfRef.current) return;
      abortInactiveTimeframes(tf);
      cancelDeferredHeroMonth();
      uiRequestSeqRef.current += 1;
      setAnalyticsTimeframeState(tf);
    },
    [abortInactiveTimeframes, cancelDeferredHeroMonth],
  );

  useEffect(() => {
    if (!enabled || !sessionValidated) {
      cancelDeferredHeroMonth();
      abortByTfRef.current.forEach((c) => c.abort());
      abortByTfRef.current.clear();
      clearBusinessStatsClientCache();
      businessSwrStore.clear();
      hasSettledLiveUiRef.current = false;
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
      devSetHydrationPhase("hero", "idle");
      devSetHydrationPhase("metrics", "idle");
      devSetHydrationPhase("charts", "idle");
      devSetHydrationPhase("goals", "idle");
      return;
    }
  }, [enabled, sessionValidated, cancelDeferredHeroMonth]);

  useEffect(() => {
    if (!sessionValidated || !enabled) return;
    void loadStatsForRef.current(analyticsTimeframe, { affectsUi: true });
    return () => {
      abortByTfRef.current.get(analyticsTimeframe)?.abort();
      abortByTfRef.current.delete(analyticsTimeframe);
      clearBusinessStatsClientCache(analyticsTimeframe);
    };
  }, [enabled, sessionValidated, analyticsTimeframe, refetchTick]);

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
      const summaryData = await getBusinessStats(tf, { scope: "summary", silent: true });
      if (uiRequestSeqRef.current !== seq || tf !== tfRef.current) return;
      summaryPartialRef.current.set(tf, summaryData);
      commitUiStats(tf, seq, true);
      applyHeroFromMonth(tf);

      const analyticsData = await getBusinessStats(tf, { scope: "analytics", silent: true });
      if (uiRequestSeqRef.current !== seq || tf !== tfRef.current) return;
      analyticsPartialRef.current.set(tf, analyticsData);
      commitUiStats(tf, seq, true);
      applyHeroFromMonth(tf);
      if (tf !== "month") scheduleDeferredHeroMonth();
    } catch {
      /* keep last live stats */
    } finally {
      if (uiRequestSeqRef.current === seq) setIsRevalidating(false);
    }
  }, [
    enabled,
    sessionValidated,
    commitUiStats,
    applyHeroFromMonth,
    scheduleDeferredHeroMonth,
  ]);

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

  const isGoalsInitialLoad =
    enabled &&
    sessionValidated &&
    !pendingVerification &&
    isAnalyticsSectionLoading &&
    (displayStats?.employeeGoals?.length ?? 0) === 0;

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
    isGoalsInitialLoad,
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
