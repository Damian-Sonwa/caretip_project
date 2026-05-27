import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { cn } from "@/lib/utils";
import {
  devClearDashboardDevDebug,
  getDashboardDevDebugSnapshot,
  subscribeDashboardDevDebug,
  type HydrationPhase,
  type HydrationSection,
} from "@/app/lib/dashboardDevDebug";

const DASHBOARD_PATH_HINTS = ["/employee", "/business", "/dashboard"];

function isOnDashboardPage(pathname: string): boolean {
  return DASHBOARD_PATH_HINTS.some((h) => pathname.includes(h));
}

function formatMs(ms: number | undefined): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function phaseClass(phase: HydrationPhase): string {
  if (phase === "ready") return "text-primary";
  if (phase === "loading") return "text-amber-600 dark:text-amber-400";
  if (phase === "error") return "text-destructive";
  return "text-muted-foreground";
}

const SECTIONS: HydrationSection[] = ["hero", "metrics", "charts", "goals", "notifications"];

export function DashboardDevDebugOverlayRoot() {
  const location = useLocation();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    return subscribeDashboardDevDebug(() => setTick((t) => t + 1));
  }, []);

  const snapshot = useMemo(() => getDashboardDevDebugSnapshot(), [tick]);
  const show = import.meta.env.DEV && isOnDashboardPage(location.pathname);
  if (!show) return null;

  const trackingOn = snapshot.enabled;
  const recent = snapshot.events.slice(-14);
  const deduped = recent.filter((e) => e.status === "deduped").length;
  const hydration = snapshot.hydration;

  const syncReady = ["hero", "metrics", "charts"].every(
    (s) => hydration[s as HydrationSection] === "ready",
  );

  return (
    <div
      className={cn(
        "fixed right-3 top-3 z-[90] w-[420px] max-w-[calc(100vw-1.5rem)] rounded-xl border border-border/70 bg-background/90 p-3 shadow-sm backdrop-blur",
      )}
      aria-label="Dashboard debug overlay (dev only)"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-foreground/90">DB Debug</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground/80">
            {trackingOn ? "tracking on" : "tracking off"} · pending {snapshot.pendingCount} · deduped{" "}
            {deduped}
            {syncReady ? " · sync OK" : ""}
          </div>
          {!trackingOn ? (
            <div className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
              Add <span className="font-mono">?dbdebug=1</span> or localStorage caretip_db_debug=1
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => devClearDashboardDevDebug()}
          className="rounded-lg border border-border/70 px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted/40"
        >
          clear
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
        {SECTIONS.map((section) => (
          <div key={section} className="contents">
            <div className="text-muted-foreground/90">{section}</div>
            <div className={cn("text-right font-medium capitalize", phaseClass(hydration[section]))}>
              {hydration[section]}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 max-h-[240px] overflow-auto rounded-lg border border-border/50">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-background/70">
            <tr className="text-left text-muted-foreground/90">
              <th className="px-2 py-1">t</th>
              <th className="px-2 py-1">status</th>
              <th className="px-2 py-1">dur</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((e) => (
              <tr key={e.id}>
                <td className="px-2 py-1 text-muted-foreground/80">{new Date(e.ts).toLocaleTimeString()}</td>
                <td
                  className={cn(
                    "px-2 py-1 font-medium",
                    e.status === "deduped"
                      ? "text-amber-600 dark:text-amber-400"
                      : e.status === "aborted"
                        ? "text-muted-foreground"
                        : e.status === "error"
                          ? "text-destructive"
                          : "text-foreground",
                  )}
                  title={e.key}
                >
                  {e.group.replace("dashboard:", "")} · {e.status}
                </td>
                <td className="px-2 py-1 text-muted-foreground/80">{formatMs(e.durationMs)}</td>
              </tr>
            ))}
            {recent.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-2 py-3 text-muted-foreground/80">
                  {trackingOn ? "no events yet" : "tracking disabled"}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
