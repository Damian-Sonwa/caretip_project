import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { BusinessDashboardStats } from "../lib/api";

import {

  clearBusinessStatsClientCache,

  getBusinessStats,

  mergeBusinessDashboardStats,

} from "../lib/api";

import { isAbortError, toUserFriendlyMessage } from "../lib/errorMessages";

import { useDashboardTabRefocus } from "./useDashboardTabRefocus";



export type AnalyticsTimeframe = "week" | "month" | "year";



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

  const [statsLoadFailed, setStatsLoadFailed] = useState<string | null>(null);

  const [pendingVerification, setPendingVerification] = useState(false);

  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const [refetchTick, setRefetchTick] = useState(0);



  const tfRef = useRef(analyticsTimeframe);

  tfRef.current = analyticsTimeframe;

  const statsRef = useRef(stats);

  statsRef.current = stats;

  const uiRequestSeqRef = useRef(0);

  const abortByTfRef = useRef(new Map<AnalyticsTimeframe, AbortController>());

  const summaryPartialRef = useRef(new Map<AnalyticsTimeframe, Partial<BusinessDashboardStats>>());

  const analyticsPartialRef = useRef(new Map<AnalyticsTimeframe, Partial<BusinessDashboardStats>>());



  const commitUiStats = useCallback((tf: AnalyticsTimeframe, seq: number) => {

    if (tf !== tfRef.current || uiRequestSeqRef.current !== seq) return;

    const merged = mergeBusinessDashboardStats(

      summaryPartialRef.current.get(tf),

      analyticsPartialRef.current.get(tf),

    );

    if (!merged) return;

    setStats(merged);

    setStatsTimeframe(tf);

    setPendingVerification(false);

    setStatsLoadFailed(null);

    setLastUpdatedAt(Date.now());

  }, []);



  const applyHeroFromMonth = useCallback((tf: AnalyticsTimeframe) => {

    if (tf !== "month") return;

    const merged = mergeBusinessDashboardStats(

      summaryPartialRef.current.get("month"),

      analyticsPartialRef.current.get("month"),

    );

    if (merged) setHeroStats(merged);

  }, []);



  const loadStatsFor = useCallback(

    async (

      tf: AnalyticsTimeframe,

      opts?: { affectsUi?: boolean; silent?: boolean; soft?: boolean },

    ): Promise<void> => {

      if (!sessionValidated || !enabled) return;



      const affectsUi = opts?.affectsUi === true && tf === tfRef.current;

      const seq = affectsUi ? ++uiRequestSeqRef.current : 0;



      if (affectsUi) {

        setSummaryLoading(true);

        setAnalyticsLoading(true);

        if (!opts?.soft) {

          setStats(null);

          setStatsTimeframe(null);

          summaryPartialRef.current.delete(tf);

          analyticsPartialRef.current.delete(tf);

        }

        setStatsLoadFailed(null);

      }



      const prev = abortByTfRef.current.get(tf);

      prev?.abort();

      const controller = new AbortController();

      abortByTfRef.current.set(tf, controller);



      const summaryPromise = getBusinessStats(tf, {

        scope: "summary",

        silent: opts?.silent === true,

        signal: controller.signal,

      });

      const analyticsPromise = getBusinessStats(tf, {

        scope: "analytics",

        silent: opts?.silent === true,

        signal: controller.signal,

      });



      void summaryPromise

        .then((summaryData) => {

          if (controller.signal.aborted) return;

          summaryPartialRef.current.set(tf, summaryData);

          if (affectsUi && uiRequestSeqRef.current === seq) {

            setSummaryLoading(false);

            commitUiStats(tf, seq);

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

            }

            return;

          }

          if (affectsUi && uiRequestSeqRef.current === seq) {

            setSummaryLoading(false);

            if (!hasMetricValues(statsRef.current)) {

              setStatsLoadFailed(msg);

            }

          }

        });



      void analyticsPromise

        .then((analyticsData) => {

          if (controller.signal.aborted) return;

          analyticsPartialRef.current.set(tf, analyticsData);

          if (affectsUi && uiRequestSeqRef.current === seq) {

            setAnalyticsLoading(false);

            commitUiStats(tf, seq);

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

        if (abortByTfRef.current.get(tf) === controller) {

          abortByTfRef.current.delete(tf);

        }

      }

    },

    [enabled, sessionValidated, commitUiStats, applyHeroFromMonth],

  );



  const loadHeroMonthSummary = useCallback(async () => {

    if (!sessionValidated || !enabled) return;

    try {

      const summaryData = await getBusinessStats("month", {

        scope: "summary",

        silent: true,

      });

      summaryPartialRef.current.set("month", summaryData);

      const merged = mergeBusinessDashboardStats(

        summaryData,

        analyticsPartialRef.current.get("month"),

      );

      if (merged) setHeroStats(merged);

    } catch {

      /* hero pulse optional */

    }

  }, [enabled, sessionValidated]);



  useEffect(() => {

    if (!enabled || !sessionValidated) {

      abortByTfRef.current.forEach((c) => c.abort());

      abortByTfRef.current.clear();

      clearBusinessStatsClientCache();

      summaryPartialRef.current.clear();

      analyticsPartialRef.current.clear();

      setHeroStats(null);

      setStats(null);

      setStatsTimeframe(null);

      setSummaryLoading(true);

      setAnalyticsLoading(true);

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

    clearBusinessStatsClientCache(tf);

    try {

      const [summaryData, analyticsData] = await Promise.all([

        getBusinessStats(tf, { scope: "summary", silent: true }),

        getBusinessStats(tf, { scope: "analytics", silent: true }),

      ]);

      if (uiRequestSeqRef.current !== seq || tf !== tfRef.current) return;

      summaryPartialRef.current.set(tf, summaryData);

      analyticsPartialRef.current.set(tf, analyticsData);

      commitUiStats(tf, seq);

      applyHeroFromMonth(tf);

      if (tf !== "month") {

        void loadHeroMonthSummary();

      }

    } catch {

      /* keep last live stats */

    }

  }, [enabled, sessionValidated, commitUiStats, applyHeroFromMonth, loadHeroMonthSummary]);



  const retryStats = useCallback(() => {

    setStatsLoadFailed(null);

    clearBusinessStatsClientCache(tfRef.current);

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

    enabled && sessionValidated && !pendingVerification && (summaryLoading || !displayMetrics);



  const isAnalyticsSectionLoading =

    enabled && sessionValidated && !pendingVerification && analyticsLoading;



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

    analyticsTimeframeLoading: summaryLoading || analyticsLoading ? analyticsTimeframe : null,

    statsLoadFailed,

    pendingVerification,

    isInitialLoad: isMetricsInitialLoad,

    isMetricsInitialLoad,

    isAnalyticsSectionLoading,

    isAnalyticsInitialLoad: isAnalyticsSectionLoading,

    isGoalsInitialLoad: isAnalyticsSectionLoading,

    isSecondarySectionLoading: isAnalyticsSectionLoading,

    isPeriodRefreshing: false,

    isDashboardHydrating: isMetricsInitialLoad,

    lastUpdatedAt,

    showStatsSkeleton: isMetricsInitialLoad,

    refreshStatsQuiet,

    retryStats,

    refetchLive,

  };

}


