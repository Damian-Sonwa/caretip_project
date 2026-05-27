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
import { canUseDashboardSwrCache, markDashboardLiveSettled } from "../lib/dashboardHydration";
import { isAbortError, isApiConnectivityError, toUserFriendlyMessage } from "../lib/errorMessages";
import { logClientError } from "../lib/clientLog";
import {
  recordNewEmployeeTip,
  syncEmployeeNotificationTips,
} from "../lib/employeeNotificationStore";
import { resolveEmployeeTipsWithDevPreview } from "../lib/devAnalyticsMocks";
import { useDashboardTabRefocus } from "./useDashboardTabRefocus";
import { devSetHydrationPhase } from "../lib/dashboardDevDebug";

export type EmployeeAnalyticsTimeframe = "today" | "week" | "month";

type AnalyticsPayload = {
  tips: TipItem[];
  monthlyGoal: number | null;
  currentMonthTotal: number;
  goalProgress: EmployeeGoalProgress | null;
  businessTimezone: string | null;
  periodTipCount: number;
  periodAmountEur: number;
  chartSeries: Array<{ label: string; amount: number }>;
  totalEarningsEur: number;
  availableBalanceEur: number;
  totalSupporters: number;
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
    totalEarningsEur: typeof data.totalEarningsEur === "number" ? data.totalEarningsEur : 0,
    availableBalanceEur: typeof data.availableBalanceEur === "number" ? data.availableBalanceEur : 0,
    totalSupporters: typeof data.totalSupporters === "number" ? data.totalSupporters : 0,
  };
}

export function useEmployeeDashboardAnalytics(
  enabled: boolean,
  employeeId: string | undefined,
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
  const loadForRef = useRef<
    (tf: EmployeeAnalyticsTimeframe, opts?: { affectsUi?: boolean; silent?: boolean; soft?: boolean }) => Promise<void>
  >(async () => {});

  const abortInactiveTimeframes = useCallback((activeTf: EmployeeAnalyticsTimeframe) => {
    for (const [tf, controller] of abortRef.current) {
      if (tf === activeTf) continue;
      controller.abort();
      abortRef.current.delete(tf);
    }
    for (const tf of ["today", "week", "month"] as const) {
      if (tf !== activeTf) clearEmployeeTipsClientCache(tf);
    }
  }, []);

  const setAnalyticsTimeframeControlled = useCallback(
    (tf: EmployeeAnalyticsTimeframe) => {
      if (tf === tfRef.current) return;
      abortInactiveTimeframes(tf);
      uiRequestSeqRef.current += 1;
      setAnalyticsTimeframe(tf);
    },
    [abortInactiveTimeframes],
  );

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

  const loadFor = useCallback(
    async (
      tf: EmployeeAnalyticsTimeframe,
      opts?: { affectsUi?: boolean; silent?: boolean; soft?: boolean },
    ): Promise<void> => {
      if (!enabled) return;

      const affectsUi = opts?.affectsUi === true && tf === tfRef.current;
      const seq = affectsUi ? ++uiRequestSeqRef.current : 0;
      const cached =
        affectsUi &&
        canUseDashboardSwrCache({ hasSettledLiveUi: hasSettledLiveUiRef.current, soft: opts?.soft })
          ? hydrateFromSwr(tf)
          : null;

      if (affectsUi) {
        setIsRevalidating(true);
        setError(null);
        if (cached) {
          setPayload(cached);
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
      clearEmployeeTipsClientCache(tf);
      const controller = new AbortController();
      abortRef.current.set(tf, controller);

      const silent = opts?.silent === true || Boolean(cached);
      const revalidate = opts?.soft === true;
      const stillActive = () =>
        !controller.signal.aborted && (!affectsUi || (tf === tfRef.current && uiRequestSeqRef.current === seq));

      let summarySettled = !revalidate && Boolean(cached && summaryPartialRef.current.has(tf));
      let analyticsSettled = !revalidate && Boolean(cached && analyticsPartialRef.current.has(tf));

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
          if (affectsUi && uiRequestSeqRef.current === seq) {
            setSummaryLoading(false);
            devSetHydrationPhase("metrics", "ready");
            devSetHydrationPhase("goals", "ready");
            commitUiPayload(tf, seq, true);
          }
        }

        if (!stillActive()) return;

        if (!analyticsSettled) {
          const analyticsData = await getTipsByEmployee(tf, {
            scope: "analytics",
            signal: controller.signal,
            silent,
          });
          if (!stillActive()) return;
          analyticsPartialRef.current.set(tf, analyticsData);
          analyticsSettled = true;
          if (affectsUi && uiRequestSeqRef.current === seq) {
            setAnalyticsLoading(false);
            devSetHydrationPhase("charts", "ready");
            commitUiPayload(tf, seq, true);
            const merged = mergeEmployeeTipsResponse(summaryPartialRef.current.get(tf), analyticsData);
            if (merged) syncTipsFromResponse(merged);
          }
        }

        if (stillActive()) {
          markDashboardLiveSettled(hasSettledLiveUiRef);
        }
      } catch {
        /* per-branch handlers */
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
    [enabled, commitUiPayload, syncTipsFromResponse, hydrateFromSwr],
  );

  loadForRef.current = loadFor;

  useEffect(() => {
    if (!enabled) {
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
    void loadForRef.current(analyticsTimeframe, { affectsUi: true });
    return () => {
      abortRef.current.get(analyticsTimeframe)?.abort();
      abortRef.current.delete(analyticsTimeframe);
      clearEmployeeTipsClientCache(analyticsTimeframe);
    };
  }, [enabled, analyticsTimeframe]);

  const refetchLive = useCallback(() => {
    clearEmployeeTipsClientCache();
    void loadFor(tfRef.current, { affectsUi: true, soft: true, silent: true });
  }, [loadFor]);

  useDashboardTabRefocus(refetchLive, enabled);

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
      commitUiPayload(tf, seq, true);

      const analyticsData = await getTipsByEmployee(tf, { scope: "analytics", silent: true });
      if (uiRequestSeqRef.current !== seq || tf !== tfRef.current) return;
      analyticsPartialRef.current.set(tf, analyticsData);
      commitUiPayload(tf, seq, true);
      const merged = mergeEmployeeTipsResponse(summaryData, analyticsData);
      if (merged) syncTipsFromResponse(merged);
    } catch (e) {
      if (!isApiConnectivityError(e)) {
        logClientError("useEmployeeDashboardAnalytics.refreshQuiet", e);
      }
    } finally {
      if (uiRequestSeqRef.current === seq) setIsRevalidating(false);
    }
  }, [enabled, commitUiPayload, syncTipsFromResponse]);

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
  };
}
