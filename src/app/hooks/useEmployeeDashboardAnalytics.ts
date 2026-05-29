import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearEmployeeTipsClientCache,
  getTipsByEmployee,
  mergeEmployeeTipsResponse,
  type EmployeeTipsResponse,
  type EmployeeGoalProgress,
  type TipItem,
} from "../lib/api";
import {
  createDashboardSwrStore,
  DASHBOARD_SWR_METRICS_TTL_MS,
} from "../lib/dashboardSwrCache";
import {
  canUsePeriodSwitchCache,
  markDashboardLiveSettled,
} from "../lib/dashboardHydration";
import { DASHBOARD_INACTIVE_PREFETCH_DELAY_MS } from "../lib/dashboardTimeframeOrchestration";
import { isAbortError, isApiConnectivityError, toUserFriendlyMessage } from "../lib/errorMessages";
import { logClientError } from "../lib/clientLog";
import {
  recordNewEmployeeTip,
  syncEmployeeNotificationTips,
} from "../lib/employeeNotificationStore";
import { resolveEmployeeTipsWithDevPreview } from "../lib/devAnalyticsMocks";
import { devSetHydrationPhase } from "../lib/dashboardDevDebug";
import { primeEmployeeAccountSnapshot } from "./useEmployeeAccountSummary";

export type EmployeeAnalyticsTimeframe = "today" | "week" | "month";

type LiveNewTipPayload = {
  tip: TipItem;
  employeeId: string;
  currentMonthTotal: number;
  monthlyGoal: number | null;
};

type AnalyticsPayload = {
  tips: TipItem[];
  monthlyGoal: number | null;
  currentMonthTotal: number;
  goalProgress: EmployeeGoalProgress | null;
  businessTimezone: string | null;
  periodTipCount: number;
  periodAmountEur: number;
  chartSeries: Array<{ label: string; amount: number }>;
  totalEarningsEur?: number;
  availableBalanceEur?: number;
  totalSupporters?: number;
};

type EmployeeSwrEntry = {
  summary: Partial<EmployeeTipsResponse>;
  analytics: Partial<EmployeeTipsResponse>;
  payload: AnalyticsPayload;
  at: number;
};

const employeePeriodSwrStore = createDashboardSwrStore<EmployeeSwrEntry>();

function swrKey(tf: EmployeeAnalyticsTimeframe): string {
  return `employee:period:${tf}`;
}

function payloadFromResponse(data: EmployeeTipsResponse): AnalyticsPayload {
  const tipsArr = data.tips ?? [];
  const nCount = data.periodTipCount;
  const nAmount = data.periodAmountEur;
  return {
    tips: tipsArr,
    monthlyGoal: data.monthlyGoal ?? null,
    currentMonthTotal: data.currentMonthTotal ?? 0,
    goalProgress: data.goal ?? null,
    businessTimezone: (data as { businessTimezone?: string }).businessTimezone ?? null,
    periodTipCount: typeof nCount === "number" ? nCount : tipsArr.length,
    periodAmountEur:
      typeof nAmount === "number" ? nAmount : tipsArr.reduce((s, t) => s + t.amount, 0),
    chartSeries: Array.isArray(data.chartSeries) ? data.chartSeries : [],
    totalEarningsEur:
      typeof data.totalEarningsEur === "number" ? data.totalEarningsEur : undefined,
    availableBalanceEur:
      typeof data.availableBalanceEur === "number" ? data.availableBalanceEur : undefined,
    totalSupporters:
      typeof data.totalSupporters === "number" ? data.totalSupporters : undefined,
  };
}

export function useEmployeeDashboardAnalytics(
  enabled: boolean,
  employeeId: string | undefined,
  advancedAnalyticsEnabled = true,
) {
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<EmployeeAnalyticsTimeframe>("today");
  const [payload, setPayload] = useState<AnalyticsPayload | null>(null);
  const [dataTimeframe, setDataTimeframe] = useState<EmployeeAnalyticsTimeframe | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [dataRevision, setDataRevision] = useState(0);

  const tfRef = useRef(analyticsTimeframe);
  tfRef.current = analyticsTimeframe;
  const payloadRef = useRef(payload);
  payloadRef.current = payload;
  const uiRequestSeqRef = useRef(0);
  const abortRef = useRef(new Map<EmployeeAnalyticsTimeframe, AbortController>());
  const summaryPartialRef = useRef(new Map<EmployeeAnalyticsTimeframe, Partial<EmployeeTipsResponse>>());
  const analyticsPartialRef = useRef(new Map<EmployeeAnalyticsTimeframe, Partial<EmployeeTipsResponse>>());
  const hasSettledLiveUiRef = useRef(false);
  const analyticsDeferTimerRef = useRef<number | null>(null);
  const loadForRef = useRef<
    (tf: EmployeeAnalyticsTimeframe, opts?: { affectsUi?: boolean; silent?: boolean; soft?: boolean }) => Promise<void>
  >(async () => {});
  const advancedAnalyticsEnabledRef = useRef(advancedAnalyticsEnabled);
  advancedAnalyticsEnabledRef.current = advancedAnalyticsEnabled;
  const mountGenerationRef = useRef(0);
  const prefetchQueueRef = useRef<number | null>(null);
  const scheduleInactivePrefetchRef = useRef<(activeTf: EmployeeAnalyticsTimeframe) => void>(() => {});

  const abortInactiveTimeframes = useCallback((activeTf: EmployeeAnalyticsTimeframe) => {
    for (const [tf, controller] of abortRef.current) {
      if (tf === activeTf) continue;
      controller.abort();
      abortRef.current.delete(tf);
    }
  }, []);

  const syncTipsFromResponse = useCallback(
    (data: EmployeeTipsResponse) => {
      if (!employeeId) return;
      const tips = resolveEmployeeTipsWithDevPreview(data.tips ?? [], {
        totalEarningsEur: data.totalEarningsEur,
        totalSupporters: data.totalSupporters,
      });
      syncEmployeeNotificationTips(employeeId, tips);
    },
    [employeeId],
  );

  const persistSwr = useCallback((tf: EmployeeAnalyticsTimeframe) => {
    const summary = summaryPartialRef.current.get(tf);
    const analytics = analyticsPartialRef.current.get(tf);
    const merged = mergeEmployeeTipsResponse(summary, analytics);
    if (!merged) return;
    employeePeriodSwrStore.set(swrKey(tf), {
      summary: summary ?? {},
      analytics: analytics ?? {},
      payload: payloadFromResponse(merged),
      at: Date.now(),
    });
  }, []);

  const hydrateFromSwr = useCallback((tf: EmployeeAnalyticsTimeframe): AnalyticsPayload | null => {
    const hit = employeePeriodSwrStore.get(swrKey(tf), DASHBOARD_SWR_METRICS_TTL_MS);
    if (!hit) return null;
    summaryPartialRef.current.set(tf, hit.summary);
    analyticsPartialRef.current.set(tf, hit.analytics);
    return hit.payload;
  }, []);

  const hydratePeriodSessionCache = useCallback(
    (tf: EmployeeAnalyticsTimeframe): void => {
      if (!canUsePeriodSwitchCache(hasSettledLiveUiRef.current)) return;
      hydrateFromSwr(tf);
    },
    [hydrateFromSwr],
  );

  const isPeriodSessionReady = useCallback((tf: EmployeeAnalyticsTimeframe): boolean => {
    const summaryPartial = summaryPartialRef.current.get(tf);
    if (!summaryPartial || typeof summaryPartial.periodAmountEur !== "number") {
      return false;
    }
    if (!advancedAnalyticsEnabledRef.current) return true;
    return (
      summaryPartial.analyticsBundled === true ||
      Boolean(analyticsPartialRef.current.get(tf))
    );
  }, []);

  const commitUiPayload = useCallback(
    (tf: EmployeeAnalyticsTimeframe, seq: number, fromNetwork: boolean) => {
      if (tf !== tfRef.current || uiRequestSeqRef.current !== seq) return;
      const merged = mergeEmployeeTipsResponse(
        summaryPartialRef.current.get(tf),
        analyticsPartialRef.current.get(tf),
      );
      if (!merged) return;
      const next = payloadFromResponse(merged);
      persistSwr(tf);
      setPayload(next);
      setDataTimeframe(tf);
      setError(null);
      setLastUpdatedAt(Date.now());
      if (fromNetwork) setDataRevision((n) => n + 1);
      if (merged.tips?.length) syncTipsFromResponse(merged);
    },
    [persistSwr, syncTipsFromResponse],
  );

  const setAnalyticsTimeframeControlled = useCallback(
    (tf: EmployeeAnalyticsTimeframe) => {
      if (tf === tfRef.current) return;
      abortInactiveTimeframes(tf);
      if (analyticsDeferTimerRef.current != null) {
        window.clearTimeout(analyticsDeferTimerRef.current);
        analyticsDeferTimerRef.current = null;
      }
      uiRequestSeqRef.current += 1;
      setAnalyticsTimeframe(tf);

      hydratePeriodSessionCache(tf);

      if (isPeriodSessionReady(tf)) {
        const seq = uiRequestSeqRef.current;
        setSummaryLoading(false);
        setAnalyticsLoading(false);
        setIsRevalidating(false);
        devSetHydrationPhase("metrics", "ready");
        devSetHydrationPhase("charts", "ready");
        devSetHydrationPhase("goals", "ready");
        commitUiPayload(tf, seq, false);
      } else {
        const summaryPartial = summaryPartialRef.current.get(tf);
        if (summaryPartial && typeof summaryPartial.periodAmountEur === "number") {
          const seq = uiRequestSeqRef.current;
          setSummaryLoading(false);
          devSetHydrationPhase("metrics", "ready");
          setAnalyticsLoading(true);
          devSetHydrationPhase("charts", "loading");
          commitUiPayload(tf, seq, false);
        }
      }
    },
    [
      abortInactiveTimeframes,
      commitUiPayload,
      hydratePeriodSessionCache,
      isPeriodSessionReady,
    ],
  );

  const loadFor = useCallback(
    async (
      tf: EmployeeAnalyticsTimeframe,
      opts?: { affectsUi?: boolean; silent?: boolean; soft?: boolean },
    ): Promise<void> => {
      if (!enabled) return;

      hydratePeriodSessionCache(tf);

      const affectsUi = opts?.affectsUi === true && tf === tfRef.current;
      const seq = affectsUi ? ++uiRequestSeqRef.current : 0;
      const revalidate = opts?.soft === true;
      const periodSessionReady = isPeriodSessionReady(tf);

      if (affectsUi) {
        setError(null);
        if (periodSessionReady && !revalidate) {
          setSummaryLoading(false);
          setAnalyticsLoading(false);
          setIsRevalidating(false);
          devSetHydrationPhase("metrics", "ready");
          devSetHydrationPhase("charts", "ready");
          devSetHydrationPhase("goals", "ready");
          commitUiPayload(tf, seq, false);
          markDashboardLiveSettled(hasSettledLiveUiRef);
          return;
        }
        setIsRevalidating(true);
        const swrPayload = hydrateFromSwr(tf);
        if (swrPayload && canUsePeriodSwitchCache(hasSettledLiveUiRef.current) && opts?.soft) {
          setPayload(swrPayload);
          setDataTimeframe(tf);
          setSummaryLoading(false);
          setAnalyticsLoading(true);
          devSetHydrationPhase("metrics", "ready");
          devSetHydrationPhase("charts", "loading");
        } else if (!opts?.soft) {
          setPayload(null);
          setDataTimeframe(null);
          summaryPartialRef.current.delete(tf);
          analyticsPartialRef.current.delete(tf);
          setSummaryLoading(true);
          setAnalyticsLoading(true);
          devSetHydrationPhase("metrics", "loading");
          devSetHydrationPhase("charts", "loading");
          devSetHydrationPhase("goals", "loading");
        } else {
          setSummaryLoading(!payloadRef.current);
          setAnalyticsLoading(true);
          if (!payloadRef.current) {
            devSetHydrationPhase("metrics", "loading");
            devSetHydrationPhase("charts", "loading");
          }
        }
      }

      const prev = abortRef.current.get(tf);
      prev?.abort();
      const controller = new AbortController();
      abortRef.current.set(tf, controller);

      const silent = opts?.silent === true || periodSessionReady;
      const stillActive = () =>
        !controller.signal.aborted && (!affectsUi || (tf === tfRef.current && uiRequestSeqRef.current === seq));

      let summarySettled = periodSessionReady && !revalidate;
      let analyticsSettled = periodSessionReady && !revalidate;

      const applyBundledAnalyticsFromSummary = (summaryData: EmployeeTipsResponse) => {
        if (typeof summaryData.totalEarningsEur === "number") {
          primeEmployeeAccountSnapshot({
            totalEarningsEur: summaryData.totalEarningsEur,
            availableBalanceEur: summaryData.availableBalanceEur ?? 0,
            totalSupporters: summaryData.totalSupporters ?? 0,
          });
        }
        if (summaryData.analyticsBundled !== true) return false;
        analyticsPartialRef.current.set(tf, {
          tips: summaryData.tips ?? [],
          chartSeries: summaryData.chartSeries ?? [],
          businessTimezone: summaryData.businessTimezone,
        });
        return true;
      };

      try {
        if (!summarySettled) {
          const summaryData = await getTipsByEmployee(tf, {
            scope: "summary",
            signal: controller.signal,
            silent,
          });
          if (!stillActive()) return;
          summaryPartialRef.current.set(tf, summaryData);
          summarySettled = true;
          if (applyBundledAnalyticsFromSummary(summaryData)) {
            analyticsSettled = true;
          }
          if (affectsUi && uiRequestSeqRef.current === seq) {
            setSummaryLoading(false);
            devSetHydrationPhase("metrics", "ready");
            devSetHydrationPhase("goals", "ready");
            if (analyticsSettled) {
              setAnalyticsLoading(false);
              devSetHydrationPhase("charts", "ready");
            }
            commitUiPayload(tf, seq, true);
            setIsRevalidating(false);
          }
        }

        if (!stillActive()) return;

        if (!analyticsSettled) {
          if (!advancedAnalyticsEnabledRef.current) {
            analyticsSettled = true;
            if (affectsUi && stillActive()) {
              setAnalyticsLoading(false);
              devSetHydrationPhase("charts", "ready");
              commitUiPayload(tf, seq, true);
            }
          } else {
            const analyticsData = await getTipsByEmployee(tf, {
              scope: "analytics",
              signal: controller.signal,
              silent,
            });
            if (!stillActive()) return;
            analyticsPartialRef.current.set(tf, analyticsData);
            analyticsSettled = true;
            if (affectsUi && stillActive()) {
              setAnalyticsLoading(false);
              devSetHydrationPhase("charts", "ready");
              commitUiPayload(tf, seq, true);
              const merged = mergeEmployeeTipsResponse(
                summaryPartialRef.current.get(tf),
                analyticsData,
              );
              if (merged) syncTipsFromResponse(merged);
            }
          }
        }

        if (stillActive()) {
          if (!affectsUi && summarySettled && analyticsSettled) {
            persistSwr(tf);
          }
          markDashboardLiveSettled(hasSettledLiveUiRef);
          if (affectsUi && tf === tfRef.current) {
            scheduleInactivePrefetchRef.current(tf);
          }
        }
      } catch (e) {
        if (isAbortError(e) || controller.signal.aborted) return;
        if (affectsUi && stillActive() && !summarySettled) {
          setError(toUserFriendlyMessage(e));
          devSetHydrationPhase("metrics", "error");
        }
      } finally {
        if (affectsUi && uiRequestSeqRef.current === seq) {
          if (!summarySettled) setSummaryLoading(false);
          if (!analyticsSettled) setAnalyticsLoading(false);
          setIsRevalidating(false);
        }
        if (abortRef.current.get(tf) === controller) {
          abortRef.current.delete(tf);
        }
      }
    },
    [
      enabled,
      commitUiPayload,
      syncTipsFromResponse,
      hydratePeriodSessionCache,
      isPeriodSessionReady,
      persistSwr,
    ],
  );

  loadForRef.current = loadFor;

  const scheduleInactivePrefetch = useCallback(
    (activeTf: EmployeeAnalyticsTimeframe) => {
      if (prefetchQueueRef.current != null) {
        window.clearTimeout(prefetchQueueRef.current);
      }
      const others: EmployeeAnalyticsTimeframe[] = (["today", "week", "month"] as const).filter(
        (t) => t !== activeTf,
      );
      let idx = 0;
      const step = () => {
        if (idx >= others.length) return;
        const nextTf = others[idx++]!;
        if (nextTf === tfRef.current) {
          step();
          return;
        }
        void loadFor(nextTf, { affectsUi: false, silent: true }).finally(step);
      };
      prefetchQueueRef.current = window.setTimeout(() => {
        prefetchQueueRef.current = null;
        if (!enabled) return;
        step();
      }, DASHBOARD_INACTIVE_PREFETCH_DELAY_MS);
    },
    [enabled, loadFor],
  );
  scheduleInactivePrefetchRef.current = scheduleInactivePrefetch;

  useEffect(() => {
    if (!enabled) {
      if (analyticsDeferTimerRef.current != null) {
        window.clearTimeout(analyticsDeferTimerRef.current);
        analyticsDeferTimerRef.current = null;
      }
      abortRef.current.forEach((c) => c.abort());
      abortRef.current.clear();
      clearEmployeeTipsClientCache();
      employeePeriodSwrStore.clear();
      hasSettledLiveUiRef.current = false;
      summaryPartialRef.current.clear();
      analyticsPartialRef.current.clear();
      setPayload(null);
      setDataTimeframe(null);
      setSummaryLoading(true);
      setAnalyticsLoading(true);
      setIsRevalidating(false);
      setError(null);
      devSetHydrationPhase("metrics", "idle");
      devSetHydrationPhase("charts", "idle");
      devSetHydrationPhase("goals", "idle");
      return;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const generation = ++mountGenerationRef.current;
    const tf = analyticsTimeframe;
    const timer = window.setTimeout(() => {
      if (mountGenerationRef.current !== generation) return;
      void loadForRef.current(tf, { affectsUi: true });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      abortRef.current.get(tf)?.abort();
      abortRef.current.delete(tf);
    };
  }, [enabled, analyticsTimeframe]);

  const refetchLive = useCallback(() => {
    clearEmployeeTipsClientCache();
    void loadFor(tfRef.current, { affectsUi: true, soft: true, silent: true });
  }, [loadFor]);

  const refreshQuiet = useCallback(async () => {
    if (!enabled) return;
    const tf = tfRef.current;
    const seq = ++uiRequestSeqRef.current;
    setIsRevalidating(true);
    clearEmployeeTipsClientCache(tf);
    try {
      const summaryData = await getTipsByEmployee(tf, { scope: "summary", silent: true });
      if (uiRequestSeqRef.current !== seq || tf !== tfRef.current) return;
      summaryPartialRef.current.set(tf, summaryData);
      if (summaryData.analyticsBundled === true) {
        analyticsPartialRef.current.set(tf, {
          tips: summaryData.tips ?? [],
          chartSeries: summaryData.chartSeries ?? [],
          businessTimezone: summaryData.businessTimezone,
        });
      }
      commitUiPayload(tf, seq, true);
      const merged = mergeEmployeeTipsResponse(
        summaryData,
        analyticsPartialRef.current.get(tf),
      );
      if (merged) syncTipsFromResponse(merged);
      if (
        summaryData.analyticsBundled !== true &&
        advancedAnalyticsEnabledRef.current
      ) {
        const analyticsData = await getTipsByEmployee(tf, { scope: "analytics", silent: true });
        if (uiRequestSeqRef.current !== seq || tf !== tfRef.current) return;
        analyticsPartialRef.current.set(tf, analyticsData);
        commitUiPayload(tf, seq, true);
        const mergedAfter = mergeEmployeeTipsResponse(summaryData, analyticsData);
        if (mergedAfter) syncTipsFromResponse(mergedAfter);
      }
    } catch (e) {
      if (!isApiConnectivityError(e)) {
        logClientError("useEmployeeDashboardAnalytics.refreshQuiet", e);
      }
    } finally {
      if (uiRequestSeqRef.current === seq) setIsRevalidating(false);
    }
  }, [enabled, commitUiPayload, syncTipsFromResponse]);

  const applyLiveTip = useCallback(
    (p: LiveNewTipPayload) => {
      if (!enabled) return;
      if (!employeeId || p.employeeId !== employeeId) return;

      // Only reconcile the *currently visible* period immediately.
      // Authoritative server fetch still wins and will reconcile final state.
      const tf = tfRef.current;
      const prevMerged = mergeEmployeeTipsResponse(
        summaryPartialRef.current.get(tf),
        analyticsPartialRef.current.get(tf),
      );
      if (!prevMerged) return;

      const existing = prevMerged.tips ?? [];
      const nextTips = [p.tip, ...existing].slice(0, 50);

      const summaryNext: Partial<EmployeeTipsResponse> = {
        ...summaryPartialRef.current.get(tf),
        tips: nextTips,
        periodTipCount: (prevMerged.periodTipCount ?? existing.length) + 1,
        periodAmountEur: (prevMerged.periodAmountEur ?? 0) + p.tip.amount,
        currentMonthTotal: p.currentMonthTotal,
        monthlyGoal: p.monthlyGoal,
      };

      summaryPartialRef.current.set(tf, summaryNext);
      commitUiPayload(tf, uiRequestSeqRef.current, false);
    },
    [enabled, employeeId, commitUiPayload],
  );

  const valuesMatchAnalyticsPeriod = dataTimeframe === analyticsTimeframe;

  const displayPayload = useMemo(() => {
    if (!valuesMatchAnalyticsPeriod) return null;
    return payload;
  }, [dataTimeframe, analyticsTimeframe, payload, valuesMatchAnalyticsPeriod]);

  const displayMetrics = useMemo(() => {
    if (!displayPayload) return null;
    return {
      periodTipCount: displayPayload.periodTipCount,
      periodAmountEur: displayPayload.periodAmountEur,
      monthlyGoal: displayPayload.monthlyGoal,
      currentMonthTotal: displayPayload.currentMonthTotal,
      goalProgress: displayPayload.goalProgress,
    };
  }, [
    displayPayload?.periodTipCount,
    displayPayload?.periodAmountEur,
    displayPayload?.monthlyGoal,
    displayPayload?.currentMonthTotal,
    displayPayload?.goalProgress,
  ]);

  const isMetricsInitialLoad =
    enabled && !displayMetrics && summaryLoading;

  const isAnalyticsInitialLoad =
    enabled && analyticsLoading && !(displayPayload?.chartSeries?.length ?? 0);

  const isPeriodRefreshing = isRevalidating && Boolean(displayMetrics) && !isMetricsInitialLoad;

  return {
    analyticsTimeframe,
    setAnalyticsTimeframe: setAnalyticsTimeframeControlled,
    displayPayload,
    displayMetrics,
    payload,
    valuesMatchAnalyticsPeriod,
    summaryLoading: isMetricsInitialLoad,
    analyticsLoading: isAnalyticsInitialLoad,
    isInitialLoad: isMetricsInitialLoad,
    isMetricsInitialLoad,
    isAnalyticsInitialLoad,
    isPeriodRefreshing,
    isDashboardHydrating: isMetricsInitialLoad,
    isRevalidating,
    dataRevision,
    lastUpdatedAt,
    error,
    refreshQuiet,
    refetchLive,
    applyLiveTip,
  };
}
