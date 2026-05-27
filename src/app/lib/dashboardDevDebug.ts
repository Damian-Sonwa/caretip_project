export type DebugGroup =
  | "dashboard:hero"
  | "dashboard:metrics"
  | "dashboard:charts"
  | "dashboard:goals"
  | "notifications:unread"
  | "notifications:list"
  | "auth:refresh";

/** Lifecycle statuses shown in the dev overlay. */
export type DebugStatus = "start" | "deduped" | "aborted" | "completed" | "error";

export type DashboardDevDebugEvent = {
  id: string;
  ts: number;
  group: DebugGroup;
  key: string;
  status: DebugStatus;
  durationMs?: number;
  meta?: Record<string, unknown>;
  error?: string;
};

const MAX_EVENTS = 120;

const DASHBOARD_PATH_HINTS = ["/employee", "/business", "/dashboard"];

function isOnDashboardPath(pathname: string): boolean {
  return DASHBOARD_PATH_HINTS.some((h) => pathname.includes(h));
}

/**
 * Single gate for overlay + instrumentation.
 * Default ON in local dev on dashboard routes (opt-out with ?dbdebug=0).
 */
export function isDashboardDevDebugEnabled(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    const sp = new URLSearchParams(window.location.search);
    const v = sp.get("dbdebug");
    if (v === "0") return false;
    if (v === "1") return true;
    if (window.localStorage?.getItem("caretip_db_debug") === "1") return true;
    return isOnDashboardPath(window.location.pathname || "");
  } catch {
    return false;
  }
}

export type HydrationSection = "hero" | "metrics" | "charts" | "goals" | "notifications";

export type HydrationPhase = "idle" | "loading" | "ready" | "error";

const defaultHydration = (): Record<HydrationSection, HydrationPhase> => ({
  hero: "idle",
  metrics: "idle",
  charts: "idle",
  goals: "idle",
  notifications: "idle",
});

const pending = new Map<string, { startedAt: number; group: DebugGroup; meta?: Record<string, unknown> }>();
const events: DashboardDevDebugEvent[] = [];
const hydrationState = defaultHydration();
const listeners = new Set<() => void>();

function debugGroupToSection(group: DebugGroup): HydrationSection | null {
  if (group === "dashboard:hero") return "hero";
  if (group === "dashboard:metrics") return "metrics";
  if (group === "dashboard:charts") return "charts";
  if (group === "dashboard:goals") return "goals";
  if (group === "notifications:unread" || group === "notifications:list") return "notifications";
  return null;
}

/** Orchestrated UI hydration phase (reported by hooks + inferred from API lifecycle). */
export function devSetHydrationPhase(section: HydrationSection, phase: HydrationPhase): void {
  if (!isDashboardDevDebugEnabled()) return;
  if (hydrationState[section] === phase) return;
  hydrationState[section] = phase;
  emit();
}

export function getHydrationSnapshot(): Record<HydrationSection, HydrationPhase> {
  return { ...hydrationState };
}

function emit(): void {
  listeners.forEach((l) => l());
}

function pushEvent(e: Omit<DashboardDevDebugEvent, "id">): void {
  const id = `${e.group}:${e.key}:${e.ts}:${Math.random().toString(16).slice(2)}`;
  events.push({ ...e, id });
  while (events.length > MAX_EVENTS) events.shift();
  emit();
}

/** Map CareTip API URLs to dashboard debug groups (shared by api client + inflight dedupe). */
export function resolveDashboardApiDebugTarget(url: string): {
  group: DebugGroup;
  key: string;
  meta?: Record<string, unknown>;
} | null {
  if (!isDashboardDevDebugEnabled()) return null;

  try {
    const base =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "http://localhost";
    const u = new URL(url, base);
    const pathname = u.pathname.replace(/\/+$/, "") || "/";
    const scope = u.searchParams.get("scope") ?? undefined;
    const timeframe = u.searchParams.get("timeframe") ?? undefined;
    const cursor = u.searchParams.get("cursor") ?? undefined;

    if (pathname === "/api/tips/employee") {
      if (scope === "account") {
        return {
          group: "dashboard:hero",
          key: "employee:hero:account",
          meta: { timeframe: timeframe ?? "today", scope },
        };
      }
      if (scope === "summary") {
        return {
          group: "dashboard:metrics",
          key: `employee:metrics:${timeframe ?? "today"}`,
          meta: { timeframe: timeframe ?? "today", scope },
        };
      }
      if (scope === "analytics") {
        return {
          group: "dashboard:charts",
          key: `employee:charts:${timeframe ?? "today"}`,
          meta: { timeframe: timeframe ?? "today", scope },
        };
      }
      if (scope === "full") {
        return {
          group: "dashboard:metrics",
          key: `employee:full:${timeframe ?? "today"}`,
          meta: { timeframe: timeframe ?? "today", scope },
        };
      }
      return null;
    }

    if (pathname === "/api/business/me/stats") {
      if (scope === "summary") {
        return {
          group: "dashboard:metrics",
          key: `business:metrics:${timeframe ?? "month"}`,
          meta: { timeframe: timeframe ?? "month", scope },
        };
      }
      if (scope === "analytics") {
        return {
          group: "dashboard:charts",
          key: `business:charts:${timeframe ?? "month"}`,
          meta: { timeframe: timeframe ?? "month", scope, includesGoals: true },
        };
      }
      if (scope === "full") {
        return {
          group: "dashboard:metrics",
          key: `business:full:${timeframe ?? "month"}`,
          meta: { timeframe: timeframe ?? "month", scope },
        };
      }
      return null;
    }

    if (pathname === "/api/goals") {
      return { group: "dashboard:goals", key: "employee:goals:list" };
    }

    if (pathname === "/api/employees/me/goal") {
      return { group: "dashboard:goals", key: "employee:goal:single" };
    }

    if (pathname === "/api/me/notifications/unread-count") {
      return { group: "notifications:unread", key: "notifications:unreadCount" };
    }

    if (pathname === "/api/me/notifications") {
      return {
        group: "notifications:list",
        key: `notifications:list:${cursor ?? "none"}`,
      };
    }

    if (pathname === "/api/auth/refresh") {
      return { group: "auth:refresh", key: "auth:refresh" };
    }

    return null;
  } catch {
    return null;
  }
}

export function devTrackStart(
  group: DebugGroup,
  key: string,
  meta?: Record<string, unknown>,
): void {
  if (!isDashboardDevDebugEnabled()) return;

  const pendingHit = pending.get(key);
  if (pendingHit) {
    pushEvent({ ts: Date.now(), group, key, status: "deduped", meta });
    return;
  }

  pending.set(key, { startedAt: Date.now(), group, meta });
  pushEvent({ ts: Date.now(), group, key, status: "start", meta });
  const section = debugGroupToSection(group);
  if (section) devSetHydrationPhase(section, "loading");
}

/** In-flight join (same key already started) — does not start a new network request. */
export function devTrackDeduped(
  group: DebugGroup,
  key: string,
  meta?: Record<string, unknown>,
): void {
  if (!isDashboardDevDebugEnabled()) return;
  pushEvent({ ts: Date.now(), group, key, status: "deduped", meta });
}

export function devTrackEnd(
  group: DebugGroup,
  key: string,
  status: "completed" | "aborted" | "error",
  err?: unknown,
): void {
  if (!isDashboardDevDebugEnabled()) return;

  const hit = pending.get(key);
  const durationMs = hit ? Date.now() - hit.startedAt : undefined;
  pending.delete(key);

  pushEvent({
    ts: Date.now(),
    group,
    key,
    status,
    durationMs,
    error:
      err instanceof Error
        ? err.message
        : err != null
          ? typeof err === "string"
            ? err
            : "error"
          : undefined,
  });

  const section = debugGroupToSection(group);
  if (section) {
    if (status === "completed") devSetHydrationPhase(section, "ready");
    else if (status === "error") devSetHydrationPhase(section, "error");
    // aborted: leave phase to hook (may immediately re-enter loading)
  }
}

export function devClearDashboardDevDebug(): void {
  if (!isDashboardDevDebugEnabled()) return;
  pending.clear();
  events.splice(0, events.length);
  Object.assign(hydrationState, defaultHydration());
  emit();
}

export function getDashboardDevDebugSnapshot(): {
  enabled: boolean;
  pendingCount: number;
  events: DashboardDevDebugEvent[];
  hydration: Record<HydrationSection, HydrationPhase>;
} {
  return {
    enabled: isDashboardDevDebugEnabled(),
    pendingCount: pending.size,
    events: [...events],
    hydration: getHydrationSnapshot(),
  };
}

export function subscribeDashboardDevDebug(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
