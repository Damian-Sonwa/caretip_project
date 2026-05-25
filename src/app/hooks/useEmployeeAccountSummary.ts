import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearEmployeeAccountClientCache,
  getEmployeeAccountSnapshot,
  type EmployeeAccountSnapshot,
} from "../lib/api";
import { isAbortError, isApiConnectivityError } from "../lib/errorMessages";
import { logClientError } from "../lib/clientLog";
import { useDashboardTabRefocus } from "./useDashboardTabRefocus";

/**
 * Lifetime account metrics (hero) — always fetched live on dashboard entry.
 */
export function useEmployeeAccountSummary(enabled: boolean) {
  const [snapshot, setSnapshot] = useState<EmployeeAccountSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [refetchTick, setRefetchTick] = useState(0);

  const refetchLive = useCallback(() => {
    clearEmployeeAccountClientCache();
    setRefetchTick((n) => n + 1);
  }, []);

  useDashboardTabRefocus(refetchLive, enabled);

  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort();
      abortRef.current = null;
      clearEmployeeAccountClientCache();
      setSnapshot(null);
      setLoading(true);
      setLastUpdatedAt(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setSnapshot(null);

    void getEmployeeAccountSnapshot({ signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setSnapshot(data);
        setLastUpdatedAt(Date.now());
        setLoading(false);
      })
      .catch((err) => {
        if (isAbortError(err) || controller.signal.aborted) return;
        if (!isApiConnectivityError(err)) {
          logClientError("useEmployeeAccountSummary", err);
        }
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [enabled, refetchTick]);

  const displayAccount = loading ? null : snapshot;

  const isInitialLoad = loading;

  const refreshQuiet = useCallback(async () => {
    if (!enabled) return;
    clearEmployeeAccountClientCache();
    try {
      const data = await getEmployeeAccountSnapshot({ silent: true });
      setSnapshot(data);
      setLastUpdatedAt(Date.now());
    } catch (e) {
      if (!isApiConnectivityError(e)) {
        logClientError("useEmployeeAccountSummary.refreshQuiet", e);
      }
    }
  }, [enabled]);

  return {
    displayAccount,
    snapshot,
    loading,
    isInitialLoad,
    lastUpdatedAt,
    refreshQuiet,
    refetchLive,
  };
}
