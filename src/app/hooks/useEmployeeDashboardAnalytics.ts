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
import { getAuthUser } from "../lib/authUserStore";
import { isWalkthroughDemoEmployee } from "../lib/walkthroughDemo";
import { devSetHydrationPhase } from "../lib/dashboardDevDebug";
import { primeEmployeeAccountSnapshot } from "./useEmployeeAccountSummary";
import {
  hasEmployeeChartOrTipsContent,
  hasEmployeePayloadVisibleContent,
} from "../lib/dashboardVisibleContent";

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
  averageRating: number | null;
  ratingCount: number;
  chartSeries: Array<{ label: string; amount: number }>;
  totalEarningsEur?: number;
  availableBalanceEur?: number;
  totalSupporters?: number;
};

function logEmployeePeriodPayload(
  timeframe: EmployeeAnalyticsTimeframe,
  payload: AnalyticsPayload,
  source: "cache" | "network",
): void {
  if (!import.meta.env.DEV) return;
  console.info(`[employee.analytics:${timeframe}]`, source, {
    periodAmountEur: payload.periodAmountEur,
    periodTipCount: payload.periodTipCount,
    averageRating: payload.averageRating,
    ratingCount: payload.ratingCount,
    monthlyGoal: payload.monthlyGoal,
    currentMonthTotal: payload.currentMonthTotal,
    goalProgress: payload.goalProgress,
    chartPoints: payload.chartSeries?.length ?? 0,
    tips: payload.tips?.length ?? 0,
  });
}

type EmployeeSwrEntry = {
  summary: Partial<EmployeeTipsResponse>;
  analytics: Partial<EmployeeTipsResponse>;
  payload: AnalyticsPayload;
  at: number;
};

const employeePeriodSwrStore = createDashboardSwrStore<EmployeeSwrEntry>();

export function clearEmployeePeriodSwrStore(): void {
  employeePeriodSwrStore.clear();
}

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
    averageRating:
      typeof data.averageRating === "number" && Number.isFinite(data.averageRating)
        ? data.averageRating
        : null,
    ratingCount: typeof data.ratingCount === "number" ? data.ratingCount : 0,
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
  const [lastKnownGoodMetrics, setLastKnownGoodMetrics] = useState<{
    periodTipCount: number;
    periodAmountEur: number;
    monthlyGoal: number | null;
    currentMonthTotal: number;
    goalProgress: EmployeeGoalProgress | null;
    averageRating: number | null;
    ratingCount: number;
  } | null>(null);

  const tfRef = useRef(analyticsTimeframe);
  tfRef.current = analyticsTimeframe;
  const payloadRef = useRef(payload);
  payloadRef.current = payload;
  const lastKnownGoodMetricsRef = useRef(lastKnownGoodMetrics);
  lastKnownGoodMetricsRef.current = lastKnownGoodMetrics;
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
      const tips = resolveEmployeeTipsWithDevPreview(
        data.tips ?? [],
        {
          totalEarningsEur: data.totalEarningsEur,
          totalSupporters: data.totalSupporters,
        },
        isWalkthroughDemoEmployee(getAuthUser()),
      );
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
      setLastKnownGoodMetrics({
        periodTipCount: next.periodTipCount,
        periodAmountEur: next.periodAmountEur,
        monthlyGoal: next.monthlyGoal,
        currentMonthTotal: next.currentMonthTotal,
        goalProgress: next.goalProgress,
        averageRating: next.averageRating,
        ratingCount: next.ratingCount,
      });
      logEmployeePeriodPayload(tf, next, fromNetwork ? "network" : "cache");
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
      tfRef.current = tf;
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
        markDashboardLiveSettled(hasSettledLiveUiRef);
      } else {
        const summaryPartial = summaryPartialRef.current.get(tf);
        if (summaryPartial && typeof summaryPartial.periodAmountEur === "number") {
          const seq = uiRequestSeqRef.current;
          setSummaryLoading(false);
          devSetHydrationPhase("metrics", "ready");
          const chartsReady =
            !advancedAnalyticsEnabledRef.current ||
            summaryPartial.analyticsBundled === true ||
            Boolean(analyticsPartialRef.current.get(tf));
          setAnalyticsLoading(!chartsReady);
          if (chartsReady) {
            devSetHydrationPhase("charts", "ready");
            devSetHydrationPhase("goals", "ready");
            setIsRevalidating(false);
          } else {
            devSetHydrationPhase("charts", "loading");
            setIsRevalidating(true);
          }
          commitUiPayload(tf, seq, false);
        } else {
          setIsRevalidating(true);
          setSummaryLoading(!payloadRef.current);
          setAnalyticsLoading(true);
        }
      }

      void loadForRef.current(tf, { affectsUi: true });
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

      const payloadVisibleOnScreen = () =>
        hasEmployeePayloadVisibleContent(payloadRef.current) ||
        Boolean(lastKnownGoodMetricsRef.current);
      const chartsVisibleOnScreen = () =>
        hasEmployeeChartOrTipsContent(payloadRef.current);
      const setSummaryLoadingUi = (next: boolean) => {
        if (next && revalidate && payloadVisibleOnScreen()) {
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
        const preserveVisibleUi =
          revalidate &&
          (hasEmployeePayloadVisibleContent(payloadRef.current) ||
            Boolean(lastKnownGoodMetricsRef.current));

        // Background soft refresh with visible KPIs — no status strip / toggle pulse (matches business).
        if (!(revalidate && preserveVisibleUi)) {
          setIsRevalidating(true);
        }
        if (preserveVisibleUi) {
          setSummaryLoading(false);
          setAnalyticsLoading(false);
        } else {
          const swrPayload = hydrateFromSwr(tf);
          if (swrPayload && canUsePeriodSwitchCache(hasSettledLiveUiRef.current) && opts?.soft) {
            setPayload(swrPayload);
            setDataTimeframe(tf);
            setSummaryLoading(false);
            const chartsReady =
              !advancedAnalyticsEnabledRef.current ||
              Boolean(swrPayload.chartSeries?.length);
            setAnalyticsLoadingUi(!chartsReady);
            devSetHydrationPhase("metrics", "ready");
            if (chartsReady) {
              devSetHydrationPhase("charts", "ready");
            } else if (!(revalidate && chartsVisibleOnScreen())) {
              devSetHydrationPhase("charts", "loading");
            }
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
            const chartsReady =
              !advancedAnalyticsEnabledRef.current ||
              Boolean(payloadRef.current?.chartSeries?.length);
            setSummaryLoadingUi(!payloadRef.current);
            setAnalyticsLoadingUi(!chartsReady);
            if (!payloadRef.current && !(revalidate && payloadVisibleOnScreen())) {
              devSetHydrationPhase("metrics", "loading");
            }
            if (!chartsReady && !(revalidate && chartsVisibleOnScreen())) {
              devSetHydrationPhase("charts", "loading");
            }
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
      setLastKnownGoodMetrics(null);
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
      const warmMount =
        hasSettledLiveUiRef.current &&
        (isPeriodSessionReady(tf) || hasEmployeePayloadVisibleContent(payloadRef.current));
      void loadForRef.current(tf, {
        affectsUi: true,
        soft: warmMount,
        silent: warmMount,
      });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      abortRef.current.get(tf)?.abort();
      abortRef.current.delete(tf);
    };
  }, [enabled, analyticsTimeframe]);

  const refetchLive = useCallback(() => {
    clearEmployeeTipsClientCache(tfRef.current);
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

  /** Period-aligned payload only — avoids binding KPI cards to a prior timeframe. */
  const displayPayload = useMemo(() => {
    if (!payload || !valuesMatchAnalyticsPeriod) return null;
    return payload;
  }, [payload, valuesMatchAnalyticsPeriod]);

  /** Hero + charts may reuse the latest payload while the active period fetch is in flight. */
  const displayPayloadOrLatest = useMemo(() => {
    if (displayPayload) return displayPayload;
    if (!payload) return null;
    if (hasEmployeePayloadVisibleContent(payload)) return payload;
    return null;
  }, [displayPayload, payload]);

  const displayMetrics = useMemo(() => {
    if (!displayPayload) return null;
    return {
      periodTipCount: displayPayload.periodTipCount,
      periodAmountEur: displayPayload.periodAmountEur,
      monthlyGoal: displayPayload.monthlyGoal,
      currentMonthTotal: displayPayload.currentMonthTotal,
      goalProgress: displayPayload.goalProgress,
      averageRating: displayPayload.averageRating,
      ratingCount: displayPayload.ratingCount,
    };
  }, [
    displayPayload?.periodTipCount,
    displayPayload?.periodAmountEur,
    displayPayload?.monthlyGoal,
    displayPayload?.currentMonthTotal,
    displayPayload?.goalProgress,
    displayPayload?.averageRating,
    displayPayload?.ratingCount,
  ]);

  const displayMetricsStable = useMemo(() => {
    if (displayMetrics) return displayMetrics;
    if (!enabled) return null;
    // Preserve tip totals during soft refresh for the same period (avoid zero flashes).
    if (
      valuesMatchAnalyticsPeriod &&
      (summaryLoading || analyticsLoading || isRevalidating)
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
    summaryLoading,
    valuesMatchAnalyticsPeriod,
  ]);

  const hasVisibleKpisOnScreen =
    Boolean(displayMetricsStable) ||
    hasEmployeePayloadVisibleContent(payload) ||
    Boolean(lastKnownGoodMetrics);

  const hasVisibleSecondaryOnScreen =
    hasEmployeeChartOrTipsContent(displayPayloadOrLatest) ||
    hasEmployeeChartOrTipsContent(payload);

  const isMetricsInitialLoad =
    enabled && !hasVisibleKpisOnScreen && (summaryLoading || isRevalidating);

  const isAnalyticsInitialLoad =
    enabled &&
    analyticsLoading &&
    !hasVisibleSecondaryOnScreen &&
    !isRevalidating;

  const isMetricsPeriodLoading =
    enabled &&
    !valuesMatchAnalyticsPeriod &&
    (summaryLoading || analyticsLoading || isRevalidating);

  /**
   * Status strip + subtle revalidate styling — aligned with business dashboard.
   */
  const isPeriodRefreshing =
    enabled &&
    !isMetricsInitialLoad &&
    (isRevalidating ||
      !valuesMatchAnalyticsPeriod ||
      summaryLoading ||
      analyticsLoading);

  const analyticsTimeframeLoading =
    isPeriodRefreshing && !isMetricsInitialLoad ? analyticsTimeframe : null;

  const showMetricsSkeleton = isMetricsInitialLoad || isMetricsPeriodLoading;

  return {
    analyticsTimeframe,
    setAnalyticsTimeframe: setAnalyticsTimeframeControlled,
    displayPayload,
    displayPayloadOrLatest,
    displayMetrics: displayMetricsStable,
    payload,
    valuesMatchAnalyticsPeriod,
    summaryLoading: isMetricsInitialLoad,
    analyticsLoading: isAnalyticsInitialLoad,
    isInitialLoad: isMetricsInitialLoad,
    isMetricsInitialLoad,
    isAnalyticsInitialLoad,
    isPeriodRefreshing,
    analyticsTimeframeLoading,
    showMetricsSkeleton,
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
