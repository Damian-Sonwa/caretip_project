import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BusinessDashboardStats } from "../lib/api";
import {
  clearBusinessStatsClientCache,
  mergeBusinessDashboardStats,
} from "../lib/api";
import { createDashboardSwrStore, DASHBOARD_SWR_METRICS_TTL_MS } from "../lib/dashboardSwrCache";
import {
  canUseDashboardSwrCache,
  canUsePeriodSwitchCache,
  markDashboardLiveSettled,
} from "../lib/dashboardHydration";
import { isAbortError, toUserFriendlyMessage } from "../lib/errorMessages";
import { useDashboardTabRefocus } from "./useDashboardTabRefocus";
import { devSetHydrationPhase } from "../lib/dashboardDevDebug";
import {
  abortTimeframeControllers,
  BUSINESS_HERO_MONTH_DEFER_MS,
  DASHBOARD_INACTIVE_PREFETCH_DELAY_MS,
} from "../lib/dashboardTimeframeOrchestration";
import {
  hasBusinessDashboardVisibleContent,
  hasBusinessKpiValues,
  hasBusinessSecondaryContent,
  hasBusinessAnalyticsPayload,
  isBusinessGoalsPayloadSettled,
} from "../lib/dashboardVisibleContent";
import { shouldRefetchOnAnalyticsCapabilityUpgrade } from "../lib/dashboardAnalyticsLifecycle";
import {
  getBusinessAnalyticsBundle,
  invalidateBusinessAnalytics,
  subscribeBusinessAnalyticsRefresh,
  upsertBusinessAnalyticsStatsBundle,
  clearBusinessAnalyticsStore,
  fetchBusinessPeriodStats,
  type AnalyticsTimeframe,
} from "../lib/businessAnalytics";
import {
  patchLiveTipAcrossTimeframes,
  subscribeAnalyticsPatch,
} from "../lib/realtime/patchAnalyticsLive";
import { trackSocketPatchApplied } from "../lib/realtime/realtimeMetrics";
import type { LiveNewTipPayload } from "../lib/realtime/realtimeContracts";

export type { AnalyticsTimeframe };

type BusinessSwrEntry = {
  summary: Partial<BusinessDashboardStats>;
  analytics: Partial<BusinessDashboardStats>;
  merged: BusinessDashboardStats;
  at: number;
};

const businessSwrStore = createDashboardSwrStore<BusinessSwrEntry>();

export function clearBusinessDashboardSwrStore(): void {
  businessSwrStore.clear();
  clearBusinessAnalyticsStore();
}

function swrKey(tf: AnalyticsTimeframe): string {
  return `business:${tf}`;
}

function hasMetricValues(data: BusinessDashboardStats | null | undefined): boolean {
  if (!data) return false;
  return data.totalTips != null || data.tipCount != null || data.employeeCount != null;
}

export function useBusinessDashboardStats(
  enabled: boolean,
  sessionValidated: boolean,
  advancedAnalyticsEnabled = true,
) {
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
  const [lastKnownGoodMetrics, setLastKnownGoodMetrics] = useState<{
    totalTips: number;
    tipCount: number;
    employeeCount: number;
  } | null>(null);

  const tfRef = useRef(analyticsTimeframe);
  tfRef.current = analyticsTimeframe;
  const statsRef = useRef(stats);
  statsRef.current = stats;
  const lastKnownGoodMetricsRef = useRef(lastKnownGoodMetrics);
  lastKnownGoodMetricsRef.current = lastKnownGoodMetrics;
  const uiRequestSeqRef = useRef(0);
  const abortByTfRef = useRef(new Map<AnalyticsTimeframe, AbortController>());
  const summaryPartialRef = useRef(new Map<AnalyticsTimeframe, Partial<BusinessDashboardStats>>());
  const analyticsPartialRef = useRef(new Map<AnalyticsTimeframe, Partial<BusinessDashboardStats>>());
  const hasSettledLiveUiRef = useRef(false);
  /** Periods that completed at least one successful network fetch this dashboard session. */
  const networkSettledTfsRef = useRef(new Set<AnalyticsTimeframe>());
  const loadStatsForRef = useRef<
    (
      tf: AnalyticsTimeframe,
      opts?: { affectsUi?: boolean; silent?: boolean; soft?: boolean; forceNetwork?: boolean },
    ) => Promise<void>
  >(async () => {});
  const loadHeroMonthSummaryRef = useRef<() => Promise<void>>(async () => {});
  const heroDeferTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heroAbortRef = useRef<AbortController | null>(null);
  const analyticsDeferTimerRef = useRef<number | null>(null);
  const advancedAnalyticsEnabledRef = useRef(advancedAnalyticsEnabled);
  advancedAnalyticsEnabledRef.current = advancedAnalyticsEnabled;
  const quietRefreshInFlightRef = useRef<Promise<void> | null>(null);
  const statsLoadInflightByTfRef = useRef(new Map<AnalyticsTimeframe, Promise<void>>());
  const refreshQuietDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tipReconcileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Bumps on effect cleanup so Strict Mode double-mount only runs the latest load. */
  const statsMountGenerationRef = useRef(0);
  /** Avoid clearing settled UI on bootstrap before first enable (prevents load→content→load flicker). */
  const wasDashboardEnabledRef = useRef(false);
  const scheduleInactivePrefetchRef = useRef<(activeTf: AnalyticsTimeframe) => void>(() => {});
  const prevAdvancedAnalyticsRef = useRef<boolean | null>(null);

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

  const hydratePeriodSessionCache = useCallback(
    (tf: AnalyticsTimeframe): void => {
      if (!canUsePeriodSwitchCache(hasSettledLiveUiRef.current)) return;
      hydrateFromSwr(tf);
    },
    [hydrateFromSwr],
  );

  const isPeriodSessionReady = useCallback(
    (tf: AnalyticsTimeframe): boolean => {
      if (!canUsePeriodSwitchCache(hasSettledLiveUiRef.current)) return false;
      if (!networkSettledTfsRef.current.has(tf)) return false;
      const summaryPartial = summaryPartialRef.current.get(tf);
      if (!summaryPartial || !hasMetricValues(summaryPartial as BusinessDashboardStats)) {
        return false;
      }
      if (!advancedAnalyticsEnabledRef.current) return true;
      return Boolean(analyticsPartialRef.current.get(tf));
    },
    [],
  );

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
    upsertBusinessAnalyticsStatsBundle(tf, merged);
    setPendingVerification(false);
    setStatsLoadFailed(null);
    setLastUpdatedAt(Date.now());
    if (fromNetwork) setDataRevision((n) => n + 1);
    if (hasMetricValues(merged)) {
      setLastKnownGoodMetrics({
        totalTips: typeof merged.totalTips === "number" ? merged.totalTips : 0,
        tipCount: typeof merged.tipCount === "number" ? merged.tipCount : 0,
        employeeCount: typeof merged.employeeCount === "number" ? merged.employeeCount : 0,
      });
    }
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
      const analyticsSlice = analyticsPartialRef.current.get(tf);
      const chartsReady =
        !advancedAnalyticsEnabledRef.current ||
        hasBusinessAnalyticsPayload(merged) ||
        hasBusinessAnalyticsPayload(analyticsSlice);
      setAnalyticsLoading(!chartsReady);
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

  const cancelDeferredAnalytics = useCallback(() => {
    if (analyticsDeferTimerRef.current != null) {
      window.clearTimeout(analyticsDeferTimerRef.current);
      analyticsDeferTimerRef.current = null;
    }
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
  }, []);

  const loadStatsFor = useCallback(
    async (
      tf: AnalyticsTimeframe,
      opts?: { affectsUi?: boolean; silent?: boolean; soft?: boolean; forceNetwork?: boolean },
    ): Promise<void> => {
      if (!sessionValidated || !enabled) return;

      const trustPeriodCache = canUsePeriodSwitchCache(hasSettledLiveUiRef.current);
      const revalidate =
        opts?.soft === true || opts?.forceNetwork === true || !trustPeriodCache;

      const kpisVisibleOnScreen = () =>
        hasBusinessKpiValues(statsRef.current) ||
        Boolean(lastKnownGoodMetricsRef.current);
      const chartsVisibleOnScreen = () => hasBusinessSecondaryContent(statsRef.current);
      const setSummaryLoadingUi = (next: boolean) => {
        if (next && revalidate && kpisVisibleOnScreen()) {
          setSummaryLoading(false);
          return;
        }
        setSummaryLoading(next);
      };
      const setAnalyticsLoadingUi = (next: boolean) => {
        if (next && revalidate && chartsVisibleOnScreen()) {
          setAnalyticsLoading(false);
          return;
        }
        setAnalyticsLoading(next);
      };

      hydratePeriodSessionCache(tf);

      if (trustPeriodCache) {
        const sharedBundle = getBusinessAnalyticsBundle(tf);
        if (sharedBundle?.periodStats && !revalidate) {
          summaryPartialRef.current.set(tf, sharedBundle.periodStats);
          analyticsPartialRef.current.set(tf, sharedBundle.periodStats);
        }
      }

      const affectsUi = opts?.affectsUi === true && tf === tfRef.current;
      if (affectsUi) {
        abortInactiveTimeframes(tf);
        cancelDeferredHeroMonth();
        cancelDeferredAnalytics();
      }
      const seq = affectsUi ? ++uiRequestSeqRef.current : 0;
      const cached =
        affectsUi &&
        canUseDashboardSwrCache({ hasSettledLiveUi: hasSettledLiveUiRef.current, soft: opts?.soft })
          ? hydrateFromSwr(tf)
          : null;

      const summaryPartial = summaryPartialRef.current.get(tf);
      const summaryFromMemory =
        trustPeriodCache &&
        networkSettledTfsRef.current.has(tf) &&
        Boolean(summaryPartial) &&
        (!revalidate || hasMetricValues(summaryPartial as BusinessDashboardStats));
      const periodSessionReady = isPeriodSessionReady(tf);
      let summarySettled = periodSessionReady && !revalidate;
      let analyticsSettled =
        !advancedAnalyticsEnabledRef.current
          ? summarySettled
          : periodSessionReady && !revalidate;

      const existingInflight = statsLoadInflightByTfRef.current.get(tf);
      if (existingInflight && !revalidate) {
        if (!affectsUi) return existingInflight;
        setStatsLoadFailed(null);
        if (periodSessionReady) {
          setSummaryLoading(false);
          setAnalyticsLoading(false);
          setIsRevalidating(false);
          devSetHydrationPhase("metrics", "ready");
          devSetHydrationPhase("charts", "ready");
          devSetHydrationPhase("goals", "ready");
          commitUiStats(tf, seq, false);
          markDashboardLiveSettled(hasSettledLiveUiRef);
        } else if (summaryFromMemory && !opts?.soft) {
          setIsRevalidating(true);
          commitUiStats(tf, seq, true);
          setSummaryLoading(false);
          devSetHydrationPhase("metrics", "ready");
          if (!analyticsSettled) {
            setAnalyticsLoadingUi(true);
            if (!(revalidate && chartsVisibleOnScreen())) {
              devSetHydrationPhase("charts", "loading");
            }
          } else {
            setAnalyticsLoading(false);
            devSetHydrationPhase("charts", "ready");
            devSetHydrationPhase("goals", "ready");
          }
        } else {
          setIsRevalidating(true);
          setSummaryLoadingUi(!hasMetricValues(statsRef.current));
          setAnalyticsLoadingUi(
            !analyticsSettled && advancedAnalyticsEnabledRef.current,
          );
          if (!hasMetricValues(statsRef.current) && !(revalidate && kpisVisibleOnScreen())) {
            devSetHydrationPhase("metrics", "loading");
          }
          if (!analyticsSettled && !(revalidate && chartsVisibleOnScreen())) {
            devSetHydrationPhase("charts", "loading");
            devSetHydrationPhase("goals", "loading");
          }
        }
        void existingInflight
          .then(() => {
            if (tf !== tfRef.current || uiRequestSeqRef.current !== seq) return;
            setSummaryLoading(false);
            setAnalyticsLoading(false);
            setIsRevalidating(false);
            devSetHydrationPhase("metrics", "ready");
            devSetHydrationPhase("charts", "ready");
            devSetHydrationPhase("goals", "ready");
            commitUiStats(tf, seq, true);
            markDashboardLiveSettled(hasSettledLiveUiRef);
            scheduleDeferredHeroMonth();
            if (tf === tfRef.current) scheduleInactivePrefetchRef.current(tf);
          })
          .catch(() => {
            if (tf !== tfRef.current || uiRequestSeqRef.current !== seq) return;
            setIsRevalidating(false);
            setAnalyticsLoading(false);
          });
        return existingInflight;
      }

      if (affectsUi) {
        setStatsLoadFailed(null);
        if (periodSessionReady && !revalidate && trustPeriodCache) {
          setSummaryLoading(false);
          setAnalyticsLoading(false);
          setIsRevalidating(false);
          devSetHydrationPhase("metrics", "ready");
          devSetHydrationPhase("charts", "ready");
          devSetHydrationPhase("goals", "ready");
          commitUiStats(tf, seq, false);
          markDashboardLiveSettled(hasSettledLiveUiRef);
          scheduleDeferredHeroMonth();
          return;
        }
        const preserveVisibleUi =
          revalidate &&
          (hasBusinessDashboardVisibleContent(statsRef.current) ||
            Boolean(lastKnownGoodMetricsRef.current));

        setIsRevalidating(true);
        if (preserveVisibleUi) {
          setSummaryLoading(false);
          setAnalyticsLoading(false);
        } else if (summaryFromMemory && !opts?.soft) {
          commitUiStats(tf, seq, true);
          setSummaryLoading(false);
          devSetHydrationPhase("metrics", "ready");
          if (!analyticsSettled) {
            setAnalyticsLoadingUi(true);
            if (!(revalidate && chartsVisibleOnScreen())) {
              devSetHydrationPhase("charts", "loading");
            }
          }
        } else if (cached) {
          applyCachedToUi(tf, cached);
          devSetHydrationPhase("metrics", "ready");
          if (analyticsPartialRef.current.get(tf) || !advancedAnalyticsEnabledRef.current) {
            devSetHydrationPhase("charts", "ready");
            devSetHydrationPhase("goals", "ready");
          } else {
            devSetHydrationPhase("charts", "loading");
          }
        } else if (!opts?.soft) {
          setSummaryLoadingUi(!kpisVisibleOnScreen());
          setAnalyticsLoadingUi(
            !chartsVisibleOnScreen() && advancedAnalyticsEnabledRef.current,
          );
          if (!hasMetricValues(statsRef.current) && !(revalidate && kpisVisibleOnScreen())) {
            devSetHydrationPhase("metrics", "loading");
          }
          if (!chartsVisibleOnScreen() && !(revalidate && chartsVisibleOnScreen())) {
            devSetHydrationPhase("charts", "loading");
            devSetHydrationPhase("goals", "loading");
          }
        } else {
          setSummaryLoadingUi(!hasMetricValues(statsRef.current));
          setAnalyticsLoadingUi(!analyticsSettled && advancedAnalyticsEnabledRef.current);
          if (!hasMetricValues(statsRef.current) && !(revalidate && kpisVisibleOnScreen())) {
            devSetHydrationPhase("metrics", "loading");
          }
          if (!analyticsSettled && !(revalidate && chartsVisibleOnScreen())) {
            devSetHydrationPhase("charts", "loading");
          }
        }
      }

      const prev = abortByTfRef.current.get(tf);
      prev?.abort();
      const controller = new AbortController();
      abortByTfRef.current.set(tf, controller);

      const silent = opts?.silent === true || Boolean(cached);
      const stillActive = () =>
        !controller.signal.aborted && (!affectsUi || (tf === tfRef.current && uiRequestSeqRef.current === seq));

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

      const run = (async () => {
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

          /** Sprint 8.1 — single scope=full fetch via unified analytics pipeline. */
          const needsPeriodNetwork = !summarySettled || (!analyticsSettled && advancedAnalyticsEnabledRef.current);

          if (needsPeriodNetwork && (!summaryFromMemory || !analyticsSettled)) {
            const periodStats = await fetchBusinessPeriodStats(tf, {
              silent,
              signal: controller.signal,
              revalidate,
              scope: advancedAnalyticsEnabledRef.current ? "full" : "summary",
            });
            if (!stillActive()) return;
            summaryPartialRef.current.set(tf, periodStats);
            networkSettledTfsRef.current.add(tf);
            summarySettled = true;
            if (advancedAnalyticsEnabledRef.current) {
              analyticsPartialRef.current.set(tf, periodStats);
              analyticsSettled = true;
            }
          }

          if (!summarySettled && summaryFromMemory) {
            summarySettled = true;
          }

          if (affectsUi && summarySettled) {
            setSummaryLoading(false);
            devSetHydrationPhase("metrics", "ready");
            if (!analyticsSettled && advancedAnalyticsEnabledRef.current) {
              setAnalyticsLoadingUi(true);
            }
            commitUiStats(tf, seq, true);
          }
          applyHeroFromMonth(tf);
          if (tf === "month") devSetHydrationPhase("hero", "ready");

          if (!stillActive()) return;

          if (!analyticsSettled) {
            if (!advancedAnalyticsEnabledRef.current) {
              analyticsSettled = true;
              if (affectsUi && stillActive()) {
                setAnalyticsLoading(false);
                devSetHydrationPhase("charts", "ready");
                devSetHydrationPhase("goals", "ready");
                commitUiStats(tf, seq, true);
              }
            } else if (affectsUi && stillActive()) {
              setAnalyticsLoading(true);
              devSetHydrationPhase("charts", "loading");
              devSetHydrationPhase("goals", "loading");
            }
          } else if (affectsUi && advancedAnalyticsEnabledRef.current) {
            setAnalyticsLoading(false);
            devSetHydrationPhase("charts", "ready");
            devSetHydrationPhase("goals", "ready");
            commitUiStats(tf, seq, true);
          }

        if (stillActive()) {
          if (!affectsUi && summarySettled && analyticsSettled) {
            persistSwr(tf);
          }
          markDashboardLiveSettled(hasSettledLiveUiRef);
          if (affectsUi) {
            scheduleDeferredHeroMonth();
            if (tf === tfRef.current) scheduleInactivePrefetchRef.current(tf);
          }
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
      })();

      statsLoadInflightByTfRef.current.set(tf, run);
      run.finally(() => {
        if (statsLoadInflightByTfRef.current.get(tf) === run) {
          statsLoadInflightByTfRef.current.delete(tf);
        }
      });
      return run;
    },
    [
      enabled,
      sessionValidated,
      commitUiStats,
      applyHeroFromMonth,
      hydrateFromSwr,
      hydratePeriodSessionCache,
      isPeriodSessionReady,
      persistSwr,
      applyCachedToUi,
      abortInactiveTimeframes,
      cancelDeferredHeroMonth,
      cancelDeferredAnalytics,
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

    const useCache =
      canUseDashboardSwrCache({
        hasSettledLiveUi: hasSettledLiveUiRef.current,
        soft: true,
      }) && networkSettledTfsRef.current.has("month");
    const monthSummary = summaryPartialRef.current.get("month");
    if (
      monthSummary &&
      networkSettledTfsRef.current.has("month") &&
      hasMetricValues(monthSummary as BusinessDashboardStats)
    ) {
      const merged = mergeBusinessDashboardStats(
        monthSummary,
        analyticsPartialRef.current.get("month"),
      );
      if (merged) {
        setHeroStats(merged);
        devSetHydrationPhase("hero", "ready");
        return;
      }
    }

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
      const summaryData = await fetchBusinessPeriodStats("month", {
        silent: true,
        signal: controller.signal,
        scope: advancedAnalyticsEnabledRef.current ? "full" : "summary",
        revalidate: !networkSettledTfsRef.current.has("month"),
      });
      if (controller.signal.aborted || tfRef.current !== activeAtStart) return;
      summaryPartialRef.current.set("month", summaryData);
      networkSettledTfsRef.current.add("month");
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

  const prefetchQueueRef = useRef<number | null>(null);
  const scheduleInactivePrefetch = useCallback(
    (activeTf: AnalyticsTimeframe) => {
      if (prefetchQueueRef.current != null) {
        window.clearTimeout(prefetchQueueRef.current);
      }
      // Year is switched often but was previously prefetched last; prioritize it after the active period.
      const prefetchOrder: AnalyticsTimeframe[] =
        activeTf === "month"
          ? ["year", "week"]
          : activeTf === "week"
            ? ["month", "year"]
            : ["month", "week"];
      const others = prefetchOrder.filter((t) => t !== activeTf);
      let idx = 0;
      const step = () => {
        if (idx >= others.length) return;
        const nextTf = others[idx++]!;
        if (nextTf === tfRef.current) {
          step();
          return;
        }
        void loadStatsFor(nextTf, { affectsUi: false, silent: true }).finally(step);
      };
      prefetchQueueRef.current = window.setTimeout(() => {
        prefetchQueueRef.current = null;
        if (!sessionValidated || !enabled) return;
        step();
      }, DASHBOARD_INACTIVE_PREFETCH_DELAY_MS);
    },
    [enabled, sessionValidated, loadStatsFor],
  );
      scheduleInactivePrefetchRef.current = scheduleInactivePrefetch;

  const setAnalyticsTimeframe = useCallback(
    (tf: AnalyticsTimeframe) => {
      if (tf === tfRef.current) return;
      abortInactiveTimeframes(tf);
      cancelDeferredHeroMonth();
      cancelDeferredAnalytics();
      tfRef.current = tf;
      setAnalyticsTimeframeState(tf);

      if (canUsePeriodSwitchCache(hasSettledLiveUiRef.current)) {
        const bundle = getBusinessAnalyticsBundle(tf);
        if (bundle?.periodStats) {
          summaryPartialRef.current.set(tf, bundle.periodStats);
          analyticsPartialRef.current.set(tf, bundle.periodStats);
        }
      }
      hydratePeriodSessionCache(tf);

      if (isPeriodSessionReady(tf)) {
        const seq = uiRequestSeqRef.current;
        setSummaryLoading(false);
        setAnalyticsLoading(false);
        setIsRevalidating(false);
        devSetHydrationPhase("metrics", "ready");
        devSetHydrationPhase("charts", "ready");
        devSetHydrationPhase("goals", "ready");
        commitUiStats(tf, seq, false);
        markDashboardLiveSettled(hasSettledLiveUiRef);
      } else {
        const summaryPartial = summaryPartialRef.current.get(tf);
        if (summaryPartial && hasMetricValues(summaryPartial as BusinessDashboardStats)) {
          const seq = uiRequestSeqRef.current;
          setSummaryLoading(false);
          devSetHydrationPhase("metrics", "ready");
          const analyticsSlice = analyticsPartialRef.current.get(tf);
          const chartsReady =
            !advancedAnalyticsEnabledRef.current ||
            hasBusinessAnalyticsPayload(analyticsSlice);
          setAnalyticsLoading(!chartsReady);
          if (chartsReady) {
            devSetHydrationPhase("charts", "ready");
            devSetHydrationPhase("goals", "ready");
          } else {
            devSetHydrationPhase("charts", "loading");
          }
          commitUiStats(tf, seq, false);
        } else {
          setIsRevalidating(true);
          setSummaryLoading(!hasMetricValues(statsRef.current));
          setAnalyticsLoading(true);
        }
      }

      void loadStatsForRef.current(tf, {
        affectsUi: true,
        soft: canUsePeriodSwitchCache(hasSettledLiveUiRef.current),
      });
    },
    [
      abortInactiveTimeframes,
      cancelDeferredHeroMonth,
      cancelDeferredAnalytics,
      hydratePeriodSessionCache,
      isPeriodSessionReady,
      commitUiStats,
    ],
  );

  useEffect(() => {
    const isActive = enabled && sessionValidated;
    const wasActive = wasDashboardEnabledRef.current;
    wasDashboardEnabledRef.current = isActive;

    if (isActive) return;
    // Bootstrap: skip destructive reset until we've been enabled at least once.
    if (!wasActive) return;

    cancelDeferredHeroMonth();
    cancelDeferredAnalytics();
    abortByTfRef.current.forEach((c) => c.abort());
    abortByTfRef.current.clear();
    clearBusinessStatsClientCache();
    clearBusinessAnalyticsStore();
    businessSwrStore.clear();
    hasSettledLiveUiRef.current = false;
    networkSettledTfsRef.current.clear();
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
    setLastKnownGoodMetrics(null);
    devSetHydrationPhase("hero", "idle");
    devSetHydrationPhase("metrics", "idle");
    devSetHydrationPhase("charts", "idle");
    devSetHydrationPhase("goals", "idle");
  }, [enabled, sessionValidated, cancelDeferredHeroMonth, cancelDeferredAnalytics]);

  useEffect(() => {
    if (!sessionValidated || !enabled) return;
    const generation = ++statsMountGenerationRef.current;
    if (!hasSettledLiveUiRef.current) {
      clearBusinessAnalyticsStore();
      networkSettledTfsRef.current.clear();
    }
    const handle = window.setTimeout(() => {
      if (statsMountGenerationRef.current !== generation) return;
      const tf = analyticsTimeframe;
      const warmMount =
        hasSettledLiveUiRef.current &&
        (isPeriodSessionReady(tf) || hasBusinessDashboardVisibleContent(statsRef.current));
      void loadStatsForRef.current(tf, {
        affectsUi: true,
        soft: warmMount,
        silent: warmMount,
        forceNetwork: !hasSettledLiveUiRef.current,
      });
    }, 0);
    return () => {
      window.clearTimeout(handle);
      statsMountGenerationRef.current += 1;
    };
  }, [enabled, sessionValidated, refetchTick]);

  useEffect(() => {
    if (!enabled || !sessionValidated) return;

    const prev = prevAdvancedAnalyticsRef.current;
    prevAdvancedAnalyticsRef.current = advancedAnalyticsEnabled;

    if (!shouldRefetchOnAnalyticsCapabilityUpgrade(prev, advancedAnalyticsEnabled)) return;

    const tf = tfRef.current;
    const analyticsSlice = analyticsPartialRef.current.get(tf);
    if (hasBusinessAnalyticsPayload(analyticsSlice)) return;

    cancelDeferredAnalytics();
    invalidateBusinessAnalytics(tf);
    analyticsPartialRef.current.delete(tf);
    businessSwrStore.delete(swrKey(tf));
    setAnalyticsLoading(true);
    devSetHydrationPhase("charts", "loading");
    devSetHydrationPhase("goals", "loading");
    void loadStatsForRef.current(tf, {
      affectsUi: true,
      soft: false,
      silent: false,
      forceNetwork: true,
    });
  }, [advancedAnalyticsEnabled, enabled, sessionValidated, cancelDeferredAnalytics]);

  useEffect(() => {
    if (!enabled || !sessionValidated) return;
    return subscribeBusinessAnalyticsRefresh(() => {
      void loadStatsForRef.current(tfRef.current, {
        affectsUi: true,
        soft: true,
        silent: true,
      });
    });
  }, [enabled, sessionValidated]);

  useEffect(() => {
    if (!enabled || !sessionValidated) return;
    return subscribeAnalyticsPatch((patched) => {
      const tf = patched.timeframe;
      const stats = patched.stats;
      if (!stats) return;
      summaryPartialRef.current.set(tf, stats);
      analyticsPartialRef.current.set(tf, analyticsPartialRef.current.get(tf) ?? stats);
      if (tf === tfRef.current) {
        commitUiStats(tf, uiRequestSeqRef.current, false);
      }
      if (tf === "month") applyHeroFromMonth("month");
    });
  }, [enabled, sessionValidated, commitUiStats, applyHeroFromMonth]);

  const refetchLive = useCallback(() => {
    invalidateBusinessAnalytics(tfRef.current);
    void loadStatsFor(tfRef.current, { affectsUi: true, soft: true, silent: true });
  }, [loadStatsFor]);

  useDashboardTabRefocus(refetchLive, enabled && sessionValidated);

  const refreshStatsQuiet = useCallback(() => {
    if (!sessionValidated || !enabled) return;
    if (refreshQuietDebounceRef.current != null) {
      clearTimeout(refreshQuietDebounceRef.current);
    }
    refreshQuietDebounceRef.current = setTimeout(() => {
      refreshQuietDebounceRef.current = null;
      if (!sessionValidated || !enabled) return;
      if (quietRefreshInFlightRef.current) return;

      invalidateBusinessAnalytics(tfRef.current);
      const run = loadStatsFor(tfRef.current, {
        affectsUi: true,
        soft: true,
        silent: true,
      });
      quietRefreshInFlightRef.current = run;
      void run.finally(() => {
        if (quietRefreshInFlightRef.current === run) quietRefreshInFlightRef.current = null;
      });
    }, 400);
  }, [enabled, sessionValidated, loadStatsFor]);

  const scheduleTipReconcile = useCallback(() => {
    if (tipReconcileTimerRef.current != null) {
      clearTimeout(tipReconcileTimerRef.current);
    }
    tipReconcileTimerRef.current = setTimeout(() => {
      tipReconcileTimerRef.current = null;
      invalidateBusinessAnalytics(tfRef.current);
      void loadStatsFor(tfRef.current, { affectsUi: true, soft: true, silent: true });
    }, 2_500);
  }, [loadStatsFor]);

  const syncPartialsFromAnalyticsBundles = useCallback(() => {
    for (const tf of ["week", "month", "year"] as AnalyticsTimeframe[]) {
      const bundle = getBusinessAnalyticsBundle(tf);
      if (!bundle?.periodStats) continue;
      summaryPartialRef.current.set(tf, bundle.periodStats);
      upsertBusinessAnalyticsStatsBundle(tf, bundle.periodStats);
    }
  }, []);

  const applyLiveTip = useCallback(
    (p: LiveNewTipPayload) => {
      if (!enabled || !sessionValidated) return;
      patchLiveTipAcrossTimeframes(p, p.employeeName);
      trackSocketPatchApplied();
      syncPartialsFromAnalyticsBundles();
      const tf = tfRef.current;
      commitUiStats(tf, uiRequestSeqRef.current, false);
      applyHeroFromMonth(tf);
      scheduleTipReconcile();
    },
    [
      enabled,
      sessionValidated,
      commitUiStats,
      applyHeroFromMonth,
      scheduleTipReconcile,
      syncPartialsFromAnalyticsBundles,
    ],
  );

  const retryStats = useCallback(() => {
    setStatsLoadFailed(null);
    invalidateBusinessAnalytics(tfRef.current);
    businessSwrStore.delete(swrKey(tfRef.current));
    summaryPartialRef.current.delete(tfRef.current);
    analyticsPartialRef.current.delete(tfRef.current);
    networkSettledTfsRef.current.delete(tfRef.current);
    setRefetchTick((n) => n + 1);
  }, []);

  const valuesMatchAnalyticsPeriod =
    statsTimeframe === analyticsTimeframe && !pendingVerification;

  const displayStats = useMemo(() => {
    if (pendingVerification) return null;

    if (stats && statsTimeframe === analyticsTimeframe) {
      return stats;
    }

    const cached =
      lastUpdatedAt != null && valuesMatchAnalyticsPeriod
        ? getBusinessAnalyticsBundle(analyticsTimeframe)?.periodStats
        : null;
    if (
      cached &&
      (hasBusinessDashboardVisibleContent(cached) || hasMetricValues(cached))
    ) {
      return cached as BusinessDashboardStats;
    }

    if (!stats) return null;
    if (hasBusinessDashboardVisibleContent(stats)) return stats;
    if (hasMetricValues(stats)) return stats;
    return null;
  }, [
    pendingVerification,
    stats,
    statsTimeframe,
    analyticsTimeframe,
    dataRevision,
    lastUpdatedAt,
    valuesMatchAnalyticsPeriod,
  ]);

  const displayMetrics = useMemo(() => {
    if (!displayStats || !hasMetricValues(displayStats)) return null;
    return {
      totalTips: displayStats.totalTips ?? 0,
      tipCount: displayStats.tipCount ?? 0,
      employeeCount: displayStats.employeeCount ?? 0,
    };
  }, [displayStats?.totalTips, displayStats?.tipCount, displayStats?.employeeCount]);

  const displayMetricsStable = useMemo(() => {
    if (displayMetrics) return displayMetrics;
    // During fast period switches, keep last known good values visible instead of flashing zeros.
    if (!enabled || !sessionValidated || pendingVerification) return null;
    if (
      !valuesMatchAnalyticsPeriod ||
      summaryLoading ||
      analyticsLoading ||
      isRevalidating
    ) {
      return lastKnownGoodMetrics;
    }
    return null;
  }, [
    analyticsLoading,
    displayMetrics,
    enabled,
    isRevalidating,
    lastKnownGoodMetrics,
    pendingVerification,
    sessionValidated,
    summaryLoading,
    valuesMatchAnalyticsPeriod,
  ]);

  const hasVisibleKpisOnScreen =
    Boolean(displayMetricsStable) ||
    hasBusinessKpiValues(stats) ||
    Boolean(lastKnownGoodMetrics);

  const chartsPayloadPending =
    advancedAnalyticsEnabled &&
    valuesMatchAnalyticsPeriod &&
    !hasBusinessAnalyticsPayload(displayStats) &&
    !hasBusinessAnalyticsPayload(stats);

  const isMetricsInitialLoad =
    enabled &&
    sessionValidated &&
    !pendingVerification &&
    !hasVisibleKpisOnScreen &&
    summaryLoading &&
    !isRevalidating;

  const isAnalyticsSectionLoading =
    enabled &&
    sessionValidated &&
    !pendingVerification &&
    !isRevalidating &&
    (analyticsLoading || chartsPayloadPending);

  /** Status strip: stay on Updating until KPIs, charts/goals, and period alignment have all settled. */
  const isPeriodRefreshing =
    enabled &&
    sessionValidated &&
    !pendingVerification &&
    !isMetricsInitialLoad &&
    (isRevalidating ||
      summaryLoading ||
      analyticsLoading ||
      chartsPayloadPending ||
      !valuesMatchAnalyticsPeriod);

  const isGoalsInitialLoad =
    enabled &&
    sessionValidated &&
    !pendingVerification &&
    advancedAnalyticsEnabled &&
    analyticsLoading &&
    !isRevalidating &&
    !isBusinessGoalsPayloadSettled(displayStats);

  return {
    analyticsTimeframe,
    setAnalyticsTimeframe,
    heroStats,
    stats,
    displayStats,
    displayMetrics: displayMetricsStable,
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
    applyLiveTip,
  };
}
