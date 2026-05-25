import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearEmployeeAccountClientCache,
  getEmployeeAccountSnapshot,
  type EmployeeAccountSnapshot,
} from "../lib/api";
import {
  createDashboardSwrStore,
  DASHBOARD_SWR_BALANCE_TTL_MS,
} from "../lib/dashboardSwrCache";
import { canUseDashboardSwrCache, markDashboardLiveSettled } from "../lib/dashboardHydration";
import { isAbortError, isApiConnectivityError } from "../lib/errorMessages";
import { logClientError } from "../lib/clientLog";
import { useDashboardTabRefocus } from "./useDashboardTabRefocus";

const ACCOUNT_SWR_KEY = "employee:account";
const accountSwrStore = createDashboardSwrStore<EmployeeAccountSnapshot>();

/**
 * Hero account balances — short-lived SWR with immediate background revalidation.
 */
export function useEmployeeAccountSummary(enabled: boolean) {
  const [snapshot, setSnapshot] = useState<EmployeeAccountSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [dataRevision, setDataRevision] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const hasSettledLiveUiRef = useRef(false);

  const loadAccount = useCallback(
    async (opts?: { soft?: boolean }) => {
      if (!enabled) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const useCache = canUseDashboardSwrCache({
        hasSettledLiveUi: hasSettledLiveUiRef.current,
        soft: opts?.soft,
      });
      const cached = useCache
        ? accountSwrStore.get(ACCOUNT_SWR_KEY, DASHBOARD_SWR_BALANCE_TTL_MS)
        : null;
      setIsRevalidating(true);

      if (cached) {
        setSnapshot(cached);
        setLoading(false);
      } else if (!opts?.soft) {
        setSnapshot(null);
        setLoading(true);
      } else {
        setLoading(!snapshotRef.current);
      }

      try {
        const data = await getEmployeeAccountSnapshot({
          signal: controller.signal,
          silent: Boolean(cached || opts?.soft),
        });
        if (controller.signal.aborted) return;
        accountSwrStore.set(ACCOUNT_SWR_KEY, data);
        setSnapshot(data);
        setLastUpdatedAt(Date.now());
        setDataRevision((n) => n + 1);
        setLoading(false);
        markDashboardLiveSettled(hasSettledLiveUiRef);
      } catch (err) {
        if (isAbortError(err) || controller.signal.aborted) return;
        if (!isApiConnectivityError(err)) {
          logClientError("useEmployeeAccountSummary", err);
        }
        setLoading(false);
      } finally {
        if (!controller.signal.aborted) setIsRevalidating(false);
      }
    },
    [enabled],
  );

  const refetchLive = useCallback(() => {
    clearEmployeeAccountClientCache();
    void loadAccount({ soft: true });
  }, [loadAccount]);

  useDashboardTabRefocus(refetchLive, enabled);

  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort();
      abortRef.current = null;
      clearEmployeeAccountClientCache();
      accountSwrStore.clear();
      hasSettledLiveUiRef.current = false;
      setSnapshot(null);
      setLoading(true);
      setIsRevalidating(false);
      setLastUpdatedAt(null);
      return;
    }

    void loadAccount();
    return () => {
      abortRef.current?.abort();
    };
  }, [enabled, loadAccount]);

  const displayAccount = loading && !snapshot ? null : snapshot;

  const isInitialLoad = loading && !snapshot;

  const refreshQuiet = useCallback(async () => {
    if (!enabled) return;
    await loadAccount({ soft: true });
  }, [enabled, loadAccount]);

  return {
    displayAccount,
    snapshot,
    loading: isInitialLoad,
    isInitialLoad,
    isRevalidating,
    isPeriodRefreshing: isRevalidating && Boolean(snapshot) && !isInitialLoad,
    dataRevision,
    lastUpdatedAt,
    refreshQuiet,
    refetchLive,
  };
}
