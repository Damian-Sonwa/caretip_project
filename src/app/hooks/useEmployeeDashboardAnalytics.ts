import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearEmployeeTipsClientCache,
  getTipsByEmployee,
  mergeEmployeeTipsResponse,
  type EmployeeTipsResponse,
  type EmployeeGoalProgress,
  type TipItem,
} from "../lib/api";
import { isAbortError, isApiConnectivityError, toUserFriendlyMessage } from "../lib/errorMessages";
import { logClientError } from "../lib/clientLog";
import {
  recordNewEmployeeTip,
  syncEmployeeNotificationTips,
} from "../lib/employeeNotificationStore";
import { resolveEmployeeTipsWithDevPreview } from "../lib/devAnalyticsMocks";
import { useDashboardTabRefocus } from "./useDashboardTabRefocus";

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
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const tfRef = useRef(analyticsTimeframe);
  tfRef.current = analyticsTimeframe;
  const payloadRef = useRef(payload);
  payloadRef.current = payload;
  const uiRequestSeqRef = useRef(0);
  const abortRef = useRef(new Map<EmployeeAnalyticsTimeframe, AbortController>());
  const summaryPartialRef = useRef(new Map<EmployeeAnalyticsTimeframe, Partial<EmployeeTipsResponse>>());
  const analyticsPartialRef = useRef(new Map<EmployeeAnalyticsTimeframe, Partial<EmployeeTipsResponse>>());

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

  const commitUiPayload = useCallback((tf: EmployeeAnalyticsTimeframe, seq: number) => {
    if (tf !== tfRef.current || uiRequestSeqRef.current !== seq) return;
    const merged = mergeEmployeeTipsResponse(
      summaryPartialRef.current.get(tf),
      analyticsPartialRef.current.get(tf),
    );
    if (!merged) return;
    const next = payloadFromResponse(merged);
    setPayload(next);
    setDataTimeframe(tf);
    setError(null);
    setLastUpdatedAt(Date.now());
    if (merged.tips?.length) {
      syncTipsFromResponse(merged);
    }
  }, [syncTipsFromResponse]);

  const loadFor = useCallback(
    async (
      tf: EmployeeAnalyticsTimeframe,
      opts?: { affectsUi?: boolean; silent?: boolean; soft?: boolean },
    ): Promise<void> => {
      if (!enabled) return;

      const affectsUi = opts?.affectsUi === true && tf === tfRef.current;
      const seq = affectsUi ? ++uiRequestSeqRef.current : 0;

      if (affectsUi) {
        setSummaryLoading(true);
        setAnalyticsLoading(true);
        if (!opts?.soft) {
          setPayload(null);
          setDataTimeframe(null);
          summaryPartialRef.current.delete(tf);
          analyticsPartialRef.current.delete(tf);
        }
        setError(null);
      }

      const prev = abortRef.current.get(tf);
      prev?.abort();
      const controller = new AbortController();
      abortRef.current.set(tf, controller);

      const summaryPromise = getTipsByEmployee(tf, {
        scope: "summary",
        signal: controller.signal,
        silent: opts?.silent === true,
      });
      const analyticsPromise = getTipsByEmployee(tf, {
        scope: "analytics",
        signal: controller.signal,
        silent: opts?.silent === true,
      });

      void summaryPromise
        .then((summaryData) => {
          if (controller.signal.aborted) return;
          summaryPartialRef.current.set(tf, summaryData);
          if (affectsUi && uiRequestSeqRef.current === seq) {
            setSummaryLoading(false);
            commitUiPayload(tf, seq);
          }
        })
        .catch((err) => {
          if (isAbortError(err) || controller.signal.aborted) return;
          if (!opts?.silent && affectsUi && uiRequestSeqRef.current === seq) {
            if (!isApiConnectivityError(err)) {
              logClientError("useEmployeeDashboardAnalytics.load.summary", err);
            }
            setSummaryLoading(false);
            if (!payloadRef.current) {
              setError(toUserFriendlyMessage(err, { audience: "employee" }));
            }
          }
        });

      void analyticsPromise
        .then((analyticsData) => {
          if (controller.signal.aborted) return;
          analyticsPartialRef.current.set(tf, analyticsData);
          if (affectsUi && uiRequestSeqRef.current === seq) {
            setAnalyticsLoading(false);
            commitUiPayload(tf, seq);
            const merged = mergeEmployeeTipsResponse(
              summaryPartialRef.current.get(tf),
              analyticsData,
            );
            if (merged) syncTipsFromResponse(merged);
          }
        })
        .catch((err) => {
          if (isAbortError(err) || controller.signal.aborted) return;
          if (!opts?.silent && affectsUi && uiRequestSeqRef.current === seq) {
            if (!isApiConnectivityError(err)) {
              logClientError("useEmployeeDashboardAnalytics.load.analytics", err);
            }
            setAnalyticsLoading(false);
            if (!payloadRef.current) {
              setError(toUserFriendlyMessage(err, { audience: "employee" }));
            }
          }
        });

      try {
        await Promise.all([summaryPromise, analyticsPromise]);
      } catch {
        /* per-branch handlers */
      } finally {
        if (abortRef.current.get(tf) === controller) {
          abortRef.current.delete(tf);
        }
      }
    },
    [enabled, commitUiPayload, syncTipsFromResponse],
  );

  useEffect(() => {
    if (!enabled) {
      abortRef.current.forEach((c) => c.abort());
      abortRef.current.clear();
      clearEmployeeTipsClientCache();
      summaryPartialRef.current.clear();
      analyticsPartialRef.current.clear();
      setPayload(null);
      setDataTimeframe(null);
      setSummaryLoading(true);
      setAnalyticsLoading(true);
      setError(null);
      return;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void loadFor(analyticsTimeframe, { affectsUi: true });
    return () => abortRef.current.get(analyticsTimeframe)?.abort();
  }, [enabled, analyticsTimeframe, loadFor]);

  const refetchLive = useCallback(() => {
    clearEmployeeTipsClientCache();
    void loadFor(tfRef.current, { affectsUi: true, soft: true, silent: true });
  }, [loadFor]);

  useDashboardTabRefocus(refetchLive, enabled);

  const refreshQuiet = useCallback(async () => {
    if (!enabled) return;
    const tf = tfRef.current;
    const seq = ++uiRequestSeqRef.current;
    clearEmployeeTipsClientCache(tf);
    try {
      const [summaryData, analyticsData] = await Promise.all([
        getTipsByEmployee(tf, { scope: "summary", silent: true }),
        getTipsByEmployee(tf, { scope: "analytics", silent: true }),
      ]);
      if (uiRequestSeqRef.current !== seq || tf !== tfRef.current) return;
      summaryPartialRef.current.set(tf, summaryData);
      analyticsPartialRef.current.set(tf, analyticsData);
      commitUiPayload(tf, seq);
      const merged = mergeEmployeeTipsResponse(summaryData, analyticsData);
      if (merged) syncTipsFromResponse(merged);
    } catch (e) {
      if (!isApiConnectivityError(e)) {
        logClientError("useEmployeeDashboardAnalytics.refreshQuiet", e);
      }
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
    enabled && (summaryLoading || (valuesMatchAnalyticsPeriod && !displayMetrics));

  const isAnalyticsInitialLoad = enabled && analyticsLoading;

  return {
    analyticsTimeframe,
    setAnalyticsTimeframe,
    displayPayload,
    displayMetrics,
    payload,
    valuesMatchAnalyticsPeriod,
    summaryLoading: isMetricsInitialLoad,
    analyticsLoading: isAnalyticsInitialLoad,
    isInitialLoad: isMetricsInitialLoad,
    isMetricsInitialLoad,
    isAnalyticsInitialLoad,
    isPeriodRefreshing: false,
    isDashboardHydrating: isMetricsInitialLoad,
    lastUpdatedAt,
    error,
    refreshQuiet,
    refetchLive,
  };
}
