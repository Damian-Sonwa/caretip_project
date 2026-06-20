export type DashboardFetchRecord = {
  name: string;
  url: string;
  start: number;
  end: number | null;
  duration: number | null;
  dependsOn?: string[];
};

declare global {
  interface Window {
    __caretipDashboardFetchProbe?: DashboardFetchRecord[];
  }
}

export function dashboardFetchProbeEnabled(): boolean {
  return typeof window !== "undefined" && Array.isArray(window.__caretipDashboardFetchProbe);
}

export function dashboardFetchProbeStart(name: string, url: string, dependsOn?: string[]): (() => void) | undefined {
  if (!dashboardFetchProbeEnabled()) return undefined;
  const record: DashboardFetchRecord = {
    name,
    url,
    start: performance.now(),
    end: null,
    duration: null,
    dependsOn,
  };
  window.__caretipDashboardFetchProbe!.push(record);
  return () => {
    record.end = performance.now();
    record.duration = Math.round(record.end - record.start);
  };
}

export function readDashboardFetchProbe(): DashboardFetchRecord[] {
  return [...(window.__caretipDashboardFetchProbe ?? [])];
}

export function clearDashboardFetchProbe(): void {
  if (typeof window !== "undefined") {
    window.__caretipDashboardFetchProbe = [];
  }
}
